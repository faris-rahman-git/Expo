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

const orderModels = require("./orderModels");
const { dropOrder } = require("../utils/placeOrderToDatabase");

// Function to apply the discount logic
const updateVariantDiscounts = (product) => {
  const currentDate = new Date();
  let isUpdated = false;

  const isValidOffer = (offer) => {
    return (
      offer &&
      offer.offerStatus &&
      offer.offerStartDate <= currentDate &&
      (!offer.offerEndDate || offer.offerEndDate >= currentDate)
    );
  };

  product.variants.forEach((variant) => {
    let totalDiscount = 0;

    if (isValidOffer(variant)) {
      // Variant-level offer takes full priority, ignore all others
      totalDiscount = variant.offerPercentage;
    } else if (isValidOffer(product)) {
      // Product-level offer takes priority if no variant offer
      totalDiscount = product.offerPercentage;
    } else if (isValidOffer(product.subCategoryId)) {
      // Subcategory offer applies if no product offer
      totalDiscount = product.subCategoryId.offerPercentage;
    } else if (isValidOffer(product.categoryId)) {
      // Category offer applies if no subcategory offer
      totalDiscount = product.categoryId.offerPercentage;
    }

    const discountAmount = (variant.price * totalDiscount) / 100;
    const finalPrice = Math.round(variant.price - discountAmount);
    const finalDiscountPercentage = Math.floor(totalDiscount);

    if (
      variant.finalDiscountPercentage !== finalDiscountPercentage ||
      variant.finalPrice !== finalPrice
    ) {
      variant.finalDiscountPercentage = finalDiscountPercentage;
      variant.finalPrice = finalPrice;
      isUpdated = true;
    }
  });

  return isUpdated;
};

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

// Post-save hook to apply discounts automatically when product is saved
productSchema.post("save", async function () {
  const isUpdated = updateVariantDiscounts(this);
  if (isUpdated) {
    await this.save(); // Save again if there were any changes
  }
});

// Post-find hook to apply discounts after fetching
productSchema.post("find", async function (docs) {
  for (const doc of docs) {
    const isUpdated = updateVariantDiscounts(doc);
    if (isUpdated) {
      await doc.save(); // Save only if there's a change
    }
  }
});

// Post-findOne hook to apply discounts after fetching
productSchema.post("findOne", async function (doc) {
  if (doc) {
    const isUpdated = updateVariantDiscounts(doc);
    if (isUpdated) {
      await doc.save(); // Save only if there's a change
    }
  }
});

// Post-findById hook to apply discounts after fetching
productSchema.post("findById", async function (doc) {
  if (doc) {
    const isUpdated = updateVariantDiscounts(doc);
    if (isUpdated) {
      await doc.save(); // Save only if there's a change
    }
  }
});

