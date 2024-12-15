const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModels",
    required: true,
  },
  balance: { type: Number, default: 0 },
  income: { type: Number, default: 0 },
  expense: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String, enum: ["Credit", "Debit"] },
      amount: { type: Number },
      paymentError: { type: Boolean, default: false },
      transactionId: { type: String },
      parentOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orderModels",
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      orderIdsForWalletOrder : [],
      description: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

module.exports = mongoose.model("walletModels", walletSchema);
