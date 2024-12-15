const cartModels = require("../models/cartModels");
const couponModels = require("../models/couponModels");
const orderModels = require("../models/orderModels");
const { ObjectId } = require("mongodb");
const userModels = require("../models/userModels");
const { walletUpdate } = require("./walletupdates");
const { updateStockAndSalesCount } = require("./stockManagement");

const placeOrderToDatabase = async (
  couponId,
  ischeckoutFromCart,
  address,
  orderItems,
  paymentMethod,
  userId,
  isWallet = false,
  walletAmount = 0
) => {
  try {
    let items = [];
    let totalPrice = 0;

    for (let item of orderItems) {
      const item1 = {
        productId: new ObjectId(item.productId),
        variantId: new ObjectId(item.variantId),
        quantity: item.quantity,
        price: item.price,
        couponDiscount: item.discount,
        offerDiscount: item.price - item.finalPrice,
        shippingCost: 25,
      };
      if (isWallet) {
        item1.paymentStatus = "Paid";
      }
      items.push(item1);
      totalPrice += item.quantity * item.finalPrice - item.discount;

      //   Decrease stock
      if (paymentMethod != "Wallet-Online" && paymentMethod != "Online") {
        await updateStockAndSalesCount(
          item.productId,
          item.variantId,
          item.quantity,
          "sub"
        );
      }
    }

    //add new order to database
    const newOrder = new orderModels({
      userId,
      products: items,
      couponId,
      totalPrice,
      shippingAddress: {
        fullName: address.name,
        phoneNumber: address.phoneNumber,
        pinCode: address.pincode,
        house: address.house,
        street: address.street,
        city: address.city,
        landmark: address.landmark,
      },
      TotalShippingCost: orderItems.length * 25,
      paymentDetails: {
        method: paymentMethod,
      },
    });

    if (paymentMethod == "Wallet-Online" || paymentMethod == "Online") {
      newOrder.paymentDetails.walletUsedAmount = walletAmount;
      newOrder.paymentDetails.onlineTransactionStatus = "Pending";
    }

    if (isWallet) {
      newOrder.paymentDetails.onlineTransactionStatus = "Paid";
      newOrder.paymentDetails.walletUsedAmount =
        totalPrice + orderItems.length * 25;
    }

    const orderDetails = await newOrder.save();

    //remove items from cart
    if (ischeckoutFromCart == true) {
      await cartModels.findOneAndUpdate(
        {
          userId,
        },
        {
          $set: { items: [] },
          updatedAt: Date.now(),
        }
      );
    }

    if (couponId) {
      await couponModels.findOneAndUpdate(
        {
          _id: couponId,
        },
        {
          $inc: {
            currectUsageCount: 1,
          },
          updatedAt: Date.now(),
        }
      );
      await userModels.findOneAndUpdate(
        {
          _id: userId,
          "userCoupons.couponId": couponId,
        },
        {
          $set: {
            "userCoupons.$.isUsed": true,
          },
          updatedAt: Date.now(),
        }
      );
    }

    //update last order date
    await userModels.updateOne(
      { _id: userId },
      {
        $set: {
          lastOrderAt: Date.now(),
        },
      }
    );

    return orderDetails;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const updateOrderToDatabase = async (parentOrderId, transactionId) => {
  try {
    const order = await orderModels.findOneAndUpdate(
      { _id: parentOrderId },
      {
        $set: {
          "products.$[].paymentStatus": "Paid",
          "paymentDetails.onlineTransactionStatus": "Paid",
          "paymentDetails.transactionId": transactionId,
        },
        updatedAt: Date.now(),
      },
      { new: true }
    );

    for (let item of order.products) {
      await updateStockAndSalesCount(
        item.productId,
        item.variantId,
        item.quantity,
        "sub"
      );
    }

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

// droporder
const dropOrder = async (id, userId) => {
  try {
    const orderDetails = await orderModels.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          "products.$[].paymentStatus": "Failed",
          "products.$[].status": "Cancelled",
          "paymentDetails.onlineTransactionStatus": "Failed",
        },
        updatedAt: Date.now(),
      }
    );

    if (
      orderDetails.paymentDetails.method == "Wallet-Online" ||
      orderDetails.paymentDetails.walletUsedAmount != 0
    ) {
      let orderId = [];
      for (let item of orderDetails.products) {
        orderId.push(item._id);
      }
      // Update wallet balance and transaction history
      const incUpdates = {
        balance: orderDetails.paymentDetails.walletUsedAmount,
        income: orderDetails.paymentDetails.walletUsedAmount,
      };
      const pushUpdates = {
        transactions: {
          type: "Credit",
          amount: orderDetails.paymentDetails.walletUsedAmount,
          parentOrderId: id,
          orderId,
          description: `You received a refund of ₹${orderDetails.paymentDetails.walletUsedAmount}.00 for Order ID #${orderId} due to a dropped order`,
        },
      };
      await walletUpdate(userId, incUpdates, pushUpdates);
    }

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports = { placeOrderToDatabase, updateOrderToDatabase, dropOrder };
