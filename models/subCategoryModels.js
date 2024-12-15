const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  subCategoryName: { type: String },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategoryModels",
    required: true,
  },
  noOfProducts: { type: Number, default: 0 },
  isInactive: { type: Boolean, default: false },
  inactivedAt: { type: Date },
  salesCount: { type: Number, default: 0 },
  offerStatus: { type: Boolean, default: false },
  offerPercentage: { type: Number, default: 0 },
  offerStartDate: { type: Date },
  offerEndDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
});

module.exports = mongoose.model("subCategoryModels", subCategorySchema);
