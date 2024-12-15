const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "CategoryModels" },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "subCategoryModels" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "productModels" },
  variantId: { type: mongoose.Schema.Types.ObjectId },
  quantity: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModels",
    required: true, 
  },
  items: [itemSchema],
  updateMessage : { type: Boolean },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("cartModels", cartSchema);
