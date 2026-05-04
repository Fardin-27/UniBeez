// Module 1: Product & Transaction Management – developed by Member 2
import Product from "../models/product.model.js";
import ActivityLog from "../models/activityLog.model.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const syncProductAvailability = async () => {
  const [restocked, soldOut] = await Promise.all([
    Product.updateMany(
      { quantity: { $gt: 0 }, isAvailable: false },
      { $set: { isAvailable: true } }
    ),
    Product.updateMany(
      { quantity: { $lte: 0 }, isAvailable: true },
      { $set: { isAvailable: false } }
    ),
  ]);

  return {
    restocked: restocked.modifiedCount || 0,
    soldOut: soldOut.modifiedCount || 0,
  };
};

const parseOptionalNumber = (value, fieldName, { min = 0 } = {}) => {
  if (value === undefined) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    const error = new Error(`${fieldName} must be at least ${min}`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};

const parseOptionalBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
};

// GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      availability,
      sort = "newest",
    } = req.query;

    const query = {};

    if (search) {
      const trimmedSearch = String(search).trim();
      const wordStartRegex = new RegExp(`\\b${escapeRegex(trimmedSearch)}`, "i");
      query.$or = [
        { title: { $regex: wordStartRegex } },
        { description: { $regex: wordStartRegex } },
        { category: { $regex: wordStartRegex } },
      ];
    }
    if (category) query.category = category;
    if (condition) query.productCondition = condition;
    if (availability === "true") query.quantity = { $gt: 0 };
    if (availability === "false") query.quantity = { $lte: 0 };
    if (!availability) query.quantity = { $gt: 0 }; // Default: show in-stock products
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    query.isFlagged = false;

    let sortOption = {};
    switch (sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate("seller", "username fullName avatar reputationScore")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "username fullName avatar reputationScore phone"
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admins can only mark products as flagged",
      });
    }

    const { title, description, price, productCondition, quantity, category } = req.body;

    const images = req.files
      ? req.files.map((f) => `/uploads/listings/${f.filename}`)
      : [];

    const product = await Product.create({
      title,
      description,
      price,
      productCondition,
      quantity,
      category,
      images,
      seller: req.user._id,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: "product_listed",
      description: `Listed product: ${title}`,
      relatedId: product._id,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (req.user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admins can only mark products as flagged",
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the seller can update this product" });
    }

    const { title, description, price, productCondition, quantity, category, isAvailable } = req.body;
    const parsedPrice = parseOptionalNumber(price, "Price");
    const parsedQuantity = parseOptionalNumber(quantity, "Quantity");
    const parsedIsAvailable = parseOptionalBoolean(isAvailable);

    // Handle new uploaded images
    const newImages = req.files && req.files.length > 0
      ? req.files.map((f) => `/uploads/listings/${f.filename}`)
      : null;

    // existingImages comes from the form as a JSON string of image paths to keep
    let existingImages = null;
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
      } catch { /* ignore parse errors */ }
    }

    // Combine: kept existing images + newly uploaded images
    let finalImages = null;
    if (existingImages || newImages) {
      finalImages = [...(existingImages || product.images), ...(newImages || [])];
    }

    Object.assign(product, {
      ...(title && { title }),
      ...(description && { description }),
      ...(parsedPrice !== undefined && { price: parsedPrice }),
      ...(productCondition && { productCondition }),
      ...(parsedQuantity !== undefined && { quantity: parsedQuantity }),
      ...(category && { category }),
      ...(finalImages && { images: finalImages }),
      ...(parsedQuantity !== undefined
        ? { isAvailable: parsedQuantity > 0 }
        : parsedIsAvailable !== undefined
          ? { isAvailable: parsedIsAvailable }
          : {}),
    });

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (req.user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admins can only mark products as flagged",
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the seller can delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/my/listings
export const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};
