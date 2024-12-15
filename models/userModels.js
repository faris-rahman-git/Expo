const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  name: { type: String },
  phoneNumber: { type: Number },
  pincode: { type: Number },
  house: { type: String },
  street: { type: String },
  city: { type: String },
  landmark: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

const userSchema = new mongoose.Schema({
  userName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phoneNumber: { type: Number },
  isBlock: { type: Boolean, default: false },
  blockedAt: { type: Date },
  role: { type: String, enum: ["User", "Admin"], default: "User" },
  salesCount: { type: Number, default: 0 },
  addresses: [addressSchema],
  userCoupons: [
    {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: "couponModels" },
      isUsed: { type: Boolean, default: false },
    },
  ],
  defaultAddress: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  createdBy: { type: String, enum: ["User", "Admin"], default: "User" },
  updatedBy: { type: String, enum: ["User", "Admin"] },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String, enum: ["User", "Admin"] },
  lastLogin: { type: Date },
  lastOrderAt: { type: Date },
});

module.exports = mongoose.model("userModels", userSchema);
