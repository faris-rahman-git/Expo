const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "userModels" },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "productModels" },
      variantId: { type: mongoose.Schema.Types.ObjectId },
      quantity: { type: Number },
      price: { type: Number },
      couponDiscount: { type: Number, default: 0 },
      offerDiscount: { type: Number, default: 0 },
      shippingCost: { type: Number, default: 0 },
      status: {
        type: String,
        enum: [
          "Pending",
          "Confirmed",
          "Shipped",
          "OutForDelivery",
          "Delivered",
          "Cancelled",
          "Return",
        ],
        default: "Pending",
      },
      deliveredAt: {
        type: Date,
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
      returnStatus: {
        type: String,
        enum: ["Processing", "Initiated", "Completed", "Cancelled"],
      },
      returnReason: { type: String },
      returnedAt: {
        type: Date,
      },
      cancelReason: { type: String },
    },
  ],
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "couponModels" },
  totalPrice: { type: Number },
  shippingAddress: {
    fullName: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    pinCode: { type: Number, required: true },
    house: { type: String, required: true },
    street: { type: String },
    city: { type: String, required: true },
    landmark: { type: String },
  },
  TotalShippingCost: { type: Number, default: 0 },
  paymentDetails: {
    method: {
      type: String,
      enum: ["COD", "Online", "Wallet", "Wallet-Online"],
      required: true,
    },
    walletUsedAmount: { type: Number, default: 0 },
    transactionId: { type: String },
    onlineTransactionStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
    },
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("orderModels", orderSchema);
