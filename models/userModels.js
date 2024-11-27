const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phoneNumber: { type: Number },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
  isBlock: { type: Boolean, default: false },
  role: { type: String, enum: ["User", "Admin"], default: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  createdBy: {
    name: { type: String, required: true },
    role: { type: String, enum: ["User", "Admin"], default: "User" },
  },
  updatedBy: {
    name: { type: String },
    role: { type: String, enum: ["User", "Admin"] },
  },
});

module.exports = mongoose.model("userModels", userSchema);
