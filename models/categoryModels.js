const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  categoryName: { type: String },
  noOfSubCategory: { type: Number, default: 0 },
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

module.exports = mongoose.model("CategoryModels", CategorySchema);
