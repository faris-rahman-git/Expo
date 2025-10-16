const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  variantName: { type: String },
  variantDescription: { type: String },
  price: { type: Number },
  finalPrice: { type: Number, default: 0 },
  finalDiscountPercentage: { type: Number, default: 0 },
  color: { type: String },
  stock: { type: Number, default: 0 },
  images: [
    {
      path: String, // File path
      originalName: String, // Original file name
    },
  ],
  salesCount: { type: Number, default: 0 },
  isInactive: { type: Boolean, default: false },
  inactivedAt: { type: Date },
  offerStatus: { type: Boolean, default: false },
  offerPercentage: { type: Number, default: 0 },
  offerStartDate: { type: Date },
  offerEndDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
});

const productSchema = new mongoose.Schema({
  productName: { type: String },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategoryModels",
    required: true,
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subCategoryModels",
    required: true,
  },
  salesCount: { type: Number, default: 0 },
  variants: [variantSchema],
  noOfVariants: { type: Number, default: 0 },
  totalStock: { type: Number, default: 0 },
  isInactive: { type: Boolean, default: false },
  inactivedAt: { type: Date },
  offerStatus: { type: Boolean, default: false },
  offerPercentage: { type: Number, default: 0 },
  offerStartDate: { type: Date },
  offerEndDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
});

module.exports = mongoose.model("productModels", productSchema);

// Pre-hooks to populate related data
productSchema.pre("find", function (next) {
  this.populate("categoryId subCategoryId");
  next();
});

productSchema.pre("findOne", function (next) {
  this.populate("categoryId subCategoryId");
  next();
});

productSchema.pre("findById", function (next) {
  this.populate("categoryId subCategoryId");
  next();
});
