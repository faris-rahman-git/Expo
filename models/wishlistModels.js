const mongoose = require("mongoose");

const itemsSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "CategoryModels" },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subCategoryModels",
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "productModels" },
  variantId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
});

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModels",
    require: true,
  },
  items: [itemsSchema],
  updateMessage : { type: Boolean },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("wishlistModels", wishlistSchema);
