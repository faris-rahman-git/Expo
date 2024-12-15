const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponName: { type: String },
  couponCode: { type: String },
  description: { type: String },
  discountType: { type: String, enum: ["Percentage", "Fixed"] },
  discountValue: { type: Number },
  color: { type: String },
  textColor : { type: String },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  startDate: { type: Date },
  expiryDate: { type: Date },
  totalUsageLimit: { type: Number, default: null },
  currectUsageCount: { type: Number, default: 0 },
  assignedUsers: { type: String, enum: ["allUsers", "selectedUsers"] },
  selectedUsersId: [
    { type: mongoose.Schema.Types.ObjectId, ref: "userModels" },
  ],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("couponModels", couponSchema);
