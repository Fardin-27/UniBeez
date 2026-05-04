// Product & Transaction module
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

// GET /api/cart
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "title price images isAvailable quantity seller",
      populate: { path: "seller", select: "username fullName" },
    });

    if (!cart) {
      cart = { items: [] };
    }

    res.json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/add
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.quantity < quantity) {
      return res.status(400).json({ success: false, message: "Product not available in requested quantity" });
    }
    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot add your own product to cart" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (newQty > product.quantity) {
          return res.status(400).json({ success: false, message: `Cannot add more. Only ${product.quantity} in stock.` });
        }
        existingItem.quantity = newQty;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    await cart.populate({
      path: "items.product",
      select: "title price images isAvailable quantity seller",
      populate: { path: "seller", select: "username fullName" },
    });

    res.json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/remove/:productId
export const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await cart.save();
    await cart.populate({
      path: "items.product",
      select: "title price images isAvailable quantity seller",
      populate: { path: "seller", select: "username fullName" },
    });

    res.json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cart/update/:productId
export const updateCartQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not in cart" });
    }

    const product = await Product.findById(req.params.productId);
    if (product && quantity > product.quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.quantity} available in stock` });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate({
      path: "items.product",
      select: "title price images isAvailable quantity seller",
      populate: { path: "seller", select: "username fullName" },
    });

    res.json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/clear
export const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    next(error);
  }
};
