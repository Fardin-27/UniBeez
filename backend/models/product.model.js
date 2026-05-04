import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    productCondition: {
      type: String,
      enum: ["new", "used"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      required: true,
      enum: [
        "electronics",
        "books",
        "clothing",
        "furniture",
        "sports",
        "stationery",
        "food",
        "accessories",
        "other",
      ],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ price: 1 });

productSchema.pre("validate", function (next) {
  this.isAvailable = Number(this.quantity) > 0;
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
