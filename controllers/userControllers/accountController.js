const bcrypt = require("bcrypt");
const orderModels = require("../../models/orderModels");
const userModels = require("../../models/userModels");
const {
  updateStockAndSalesCount,
  checkProductValidity,
  checkStock,
} = require("../../utils/stockManagement");
const { walletUpdate } = require("../../utils/walletupdates");
const generateInvoicePDF = require("../../utils/pdfGenerator");
const {
  dropOrder,
  updateOrderToDatabase,
} = require("../../utils/placeOrderToDatabase");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// accountPage
const accountPage = async (req, res, next) => {
  try {
    delete req.session.checkout;
    delete req.session.coupon;
    const userId = req.session.user?._id ?? "";
    if (userId == "") {
      return res.status(400).redirect("/login");
    }
    const user = await userModels
      .findById(userId)
      .populate("userCoupons.couponId");
    const tab = req.session.tab ?? "profile";

    //user orders
    const orders = await orderModels
      .find({ userId })
      .sort({ updatedAt: -1 })
      .populate("products.productId");
    delete req.session.tab;
    res
      .status(200)
      .render("userPages/pages/myAccount/myAccount", { user, tab, orders });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = req.get("Referer") || "/login";
    next(err);
  }
};

// edit Account Details Request
const editAccountDetailsRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber } = req.body;
    //get user details
    const user = await userModels.findById(id);

    //check username and phone number
    const updateUser = {};
    if (name !== user.userName) {
      updateUser.userName = name.trim();
    }
    if (
      phoneNumber !== user.phoneNumber ||
      isNaN(phoneNumber) ||
      userName.length == 10
    ) {
      updateUser.phoneNumber = phoneNumber.trim();
    }
    updateUser.updatedAt = Date.now();
    updateUser.updatedBy = "User";

    //update user details
    await userModels.findOneAndUpdate({ _id: id }, { $set: updateUser });
    req.session.user = await userModels.findById(id);
    res.status(200).redirect("/myAccount");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//chnagePasswordPage
const chnagePasswordPage = async (req, res, next) => {
  try {
    req.session.forgotEmail = req.session.user?.email;
    req.session.isForgotOtp = true;
    req.session.fromChangePass = true;
    const message = req.session.message ?? "Please Enter Your Current Password";
    delete req.session.message;
    res
      .status(200)
      .render("userPages/pages/myAccount/changePassword", { message });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//redirect to new password page
const newPasswordPageRequest = async (req, res, next) => {
  try {
    const { currentPass } = req.body;
    const user = await userModels.findById(req.session.user._id);
    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) {
      req.session.message =
        "Invaild Password! Please enter your current password";
      return res.status(400).redirect("/myAccount/changePassword");
    }
    res.status(200).redirect("/login/forgotPassword");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//add new address
const addNewAddressPage = async (req, res, next) => {
  try {
    req.session.tab = "address";
    const id = req.params.id;

    //check user is exist
    if (id != req.session?.user?._id) {
      res.status(404).redirect("/myAccount");
    }

    //render page
    const message = req.session.message ?? "";
    delete req.session.message;
    res
      .status(200)
      .render("userPages/pages/myAccount/addNewAddress", { id, message });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//add New Address Request
const addNewAddressRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const {
      name,
      phoneNumber,
      pincode,
      house,
      street,
      landmark,
      city,
      defaultAddress,
    } = req.body;

    //check user is exist
    const userExist = await userModels.findById(id);
    if (!userExist) {
      delete req.session.user;
      return res.status(400).redirect("/login");
    }

    if (name.trim() == "") {
      req.session.message = "Please enter your name";
      return res.status(400).redirect("/myAccount/addNewAddress/" + id);
    }
    const phoneRegex = /^[789]\d{9}$/;
    if (
      phoneNumber.trim() == "" ||
      !phoneRegex.test(phoneNumber) ||
      isNaN(phoneNumber)
    ) {
      req.session.message =
        "Please enter a valid phone number so we can call if there are any issues with delivery.";
      return res.status(400).redirect("/myAccount/addNewAddress/" + id);
    }
    if (pincode.trim() == "" || pincode.length != 6 || isNaN(pincode)) {
      req.session.message = "Please enter a valid ZIP or postal code.";
      return res.status(400).redirect("/myAccount/addNewAddress/" + id);
    }
    if (house.trim() == "") {
      req.session.message = "Please enter Address Line";
      return res.status(400).redirect("/myAccount/addNewAddress/" + id);
    }
    if (city.trim() == "") {
      req.session.message = "Please enter your city";
      return res.status(400).redirect("/myAccount/addNewAddress/" + id);
    }

    const newAddress = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      pincode: pincode.trim(),
      house: house.trim(),
      street: street.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
    };

    // Add the new address to the database and retrieve its ID
    const updatedUser = await userModels.findOneAndUpdate(
      { _id: id },
      {
        $push: { addresses: newAddress },
        updatedAt: Date.now(),
        updatedBy: "User",
      },
      { new: true, runValidators: true } // Return the updated user object
    );

    // Find the newly added address by comparing the last item in the addresses array
    const addedAddress =
      updatedUser.addresses[updatedUser.addresses.length - 1];

    // Set the defaultAddress if addressDefault is "on"
    if (
      defaultAddress === "on" ||
      updatedUser.addresses.length == 1 ||
      req.session.changeAddressPage
    ) {
      await userModels.findByIdAndUpdate(id, {
        defaultAddress: addedAddress._id,
        updatedAt: Date.now(),
        updatedBy: "User",
      });
    }

    if (req.session.changeAddressPage) {
      delete req.session.changeAddressPage;
      return res.status(200).redirect("/checkOut/changeAddress/");
    }
    res.status(200).redirect("/myAccount");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//edit address
const editAddressPage = async (req, res, next) => {
  try {
    const { userId, addressId } = req.params;
    const user = await userModels.findById(userId);
    if (!user) {
      res.status(400).redirect("/myAccount");
    }
    const address = user.addresses.find(
      (address) => address._id.toString() == addressId
    );
    const message = req.session.message ?? "";
    delete req.session.message;
    res.status(200).render("userPages/pages/myAccount/editAddress", {
      address,
      user,
      message,
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

// editAddressRequest
const editAddressRequest = async (req, res, next) => {
  try {
    const { userId, addressId } = req.params;
    const {
      name,
      phoneNumber,
      pincode,
      house,
      street,
      landmark,
      city,
      defaultAddress,
    } = req.body;
    const user = await userModels.findById(userId);

    if (name.trim() == "") {
      req.session.message = "Please enter your name";
      return res
        .status(400)
        .redirect("/myAccount/editaddress/" + userId + "/" + addressId);
    }
    const phoneRegex = /^[789]\d{9}$/;
    if (
      phoneNumber.trim() == "" ||
      !phoneRegex.test(phoneNumber) ||
      isNaN(phoneNumber)
    ) {
      req.session.message =
        "Please enter a valid phone number so we can call if there are any issues with delivery.";
      return res
        .status(400)
        .redirect("/myAccount/editaddress/" + userId + "/" + addressId);
    }
    if (pincode.trim() == "" || pincode.length != 6 || isNaN(pincode)) {
      req.session.message = "Please enter a valid ZIP or postal code.";
      return res
        .status(400)
        .redirect("/myAccount/editaddress/" + userId + "/" + addressId);
    }
    if (house.trim() == "") {
      req.session.message = "Please enter Address Line";
      return res
        .status(400)
        .redirect("/myAccount/editaddress/" + userId + "/" + addressId);
    }
    if (city.trim() == "") {
      req.session.message = "Please enter your city";
      return res
        .status(400)
        .redirect("/myAccount/editaddress/" + userId + "/" + addressId);
    }

    const existingAddress = user.addresses.id(addressId);

    const updateAddress = {};
    updateAddress.name = name.trim();
    updateAddress.phoneNumber = phoneNumber.trim();
    updateAddress.pincode = pincode.trim();
    updateAddress.house = house.trim();
    updateAddress.street = street.trim();
    updateAddress.landmark = landmark.trim();
    updateAddress.city = city.trim();
    updateAddress.updatedAt = Date.now();
    updateAddress._id = existingAddress._id;

    await userModels.updateOne(
      { _id: userId, "addresses._id": addressId },
      {
        $set: {
          "addresses.$": updateAddress, // Update the specific address
        },
      }
    );

    //if defult
    const updateUser = {};
    if (defaultAddress === "on" || req.session.changeAddressPage) {
      updateUser.defaultAddress = addressId;
    }
    updateUser.updatedAt = Date.now();
    updateUser.updatedBy = "User";
    await userModels.findByIdAndUpdate(userId, { $set: updateUser });
    req.session.tab = "address";

    if (req.session.changeAddressPage) {
      delete req.session.changeAddressPage;
      return res.status(200).redirect("/checkOut/changeAddress/");
    }

    return res.status(200).redirect("/myAccount");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

// remove Address Request
const removeAddressRequest = async (req, res, next) => {
  try {
    const { userId, addressId } = req.params;

    await userModels.updateOne(
      { _id: userId },
      {
        $pull: {
          addresses: { _id: addressId },
        },
      }
    );

    const user = await userModels.findById(userId);

    if (addressId == user.defaultAddress.toString()) {
      const updateUser = {};
      updateUser.updatedAt = Date.now();
      updateUser.updatedBy = "User";
      if (user.addresses.length > 0) {
        updateUser.defaultAddress = user.addresses[0]._id;
      }
      if (user.addresses.length == 0) {
        updateUser.defaultAddress = null;
      }
      await userModels.findByIdAndUpdate(userId, { $set: updateUser });
    }

    req.session.tab = "address";
    return res.status(200).redirect("/myAccount");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

const orderInvoicePage = async (req, res, next) => {
  try {
    const { id, orderId } = req.params;
    const fullOrder = await orderModels
      .findById(id)
      .populate("products.productId");

    const order = fullOrder.products.find(
      (item) => item._id.toString() == orderId.toString()
    );

    // Generate the invoice and send it as a response
    await generateInvoicePDF(fullOrder, order, res);
  } catch (err) {
    err.status = 500;
    req.session.tab = "orders";
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//cancelOrderRequest
const cancelOrderRequest = async (req, res, next) => {
  try {
    const { id, orderId } = req.params;
    const { productId, variantId, quantity, price, discount, cancelReason } =
      req.body;
    const userId = req.session?.user?._id;

    const orderDetails = await orderModels.findById(id, { paymentDetails: 1 });

    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updateOrder = {
      "products.$.status": "Cancelled",
      "products.$.cancelReason": cancelReason,
    };

    let refundAmount = quantity * price - (discount || 0);
    if (isNaN(refundAmount) || refundAmount < 0) refundAmount = 0;

    // If payment was online, update wallet
    if (
      orderDetails.paymentDetails?.onlineTransactionStatus === "Paid" &&
      ["Online", "Wallet", "Wallet-Online"].includes(
        orderDetails.paymentDetails.method
      )
    ) {
      // Update wallet balance and transaction history
      const incUpdates = {
        balance: refundAmount,
        income: refundAmount,
      };
      const pushUpdates = {
        transactions: {
          type: "Credit",
          amount: refundAmount,
          parentOrderId: id,
          orderId,
          description: `You received a refund of ₹${refundAmount}.00 for Order ID #${orderId} due to a canceled order`,
        },
      };
      await walletUpdate(userId, incUpdates, pushUpdates);

      updateOrder["products.$.paymentStatus"] = "Refunded";
    } else {
      updateOrder["products.$.paymentStatus"] = "Failed";
    }

    // Cancel order
    const updatedOrder = await orderModels.findOneAndUpdate(
      {
        _id: id,
        "products._id": orderId,
      },
      {
        $set: updateOrder,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(400).redirect("/myAccount");
    }

    // Update variant stock
    await updateStockAndSalesCount(productId, variantId, quantity, "add");

    req.session.tab = "cancelledOrders";
    return res.status(200).redirect("/myAccount");
  } catch (err) {
    console.error("Cancel Order Error:", err);
    err.status = 500;
    err.redirectUrl = "/myAccount";
    return next(err);
  }
};

//returnProductRequest
const returnProductRequest = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const { fromPage , returnReason } = req.body;

    const userId = req.session.user?._id;

    //return product
    const modeldata = await orderModels.findOneAndUpdate(
      {
        userId,
        "products._id": itemId,
      },
      {
        $set: {
          "products.$.status": "Return",
          "products.$.returnStatus": "Processing",
          "products.$.returnReason": returnReason
        },
        updatedAt: Date.now(),
      }
    );

    if (fromPage == "orderDetails") {
      return res
        .status(200)
        .redirect("/OrderDetails/" + modeldata._id + "/" + itemId);
    }

    req.session.tab = "orders";
    res.status(200).redirect("/myAccount");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

// cancelReturnRequest
const cancelReturnRequest = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { fromPage } = req.body;
    const userId = req.session.user?._id;

    //cancel return
    const modeldata = await orderModels.findOneAndUpdate(
      {
        userId,
        "products._id": itemId,
      },
      {
        $set: {
          "products.$.returnStatus": "Cancelled",
        },
        updatedAt: Date.now(),
      }
    );

    if (fromPage == "orderDetails") {
      return res
        .status(200)
        .redirect("/OrderDetails/" + modeldata._id + "/" + itemId);
    }

    req.session.tab = "orders";
    res.status(200).redirect("/myAccount");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//order details page
const OrderDetailsPage = async (req, res, next) => {
  try {
    const { id, orderId } = req.params;
    const order = await orderModels.findById(id).populate("products.productId");
    req.session.tab = "orders";
    res
      .status(200)
      .render("userPages/pages/myAccount/orderDetails", { order, orderId });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//dropOrderRequest
const dropOrderRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.user?._id;

    //drop order
    const result = await dropOrder(id, userId);
    if (result) {
      req.session.tab = "unpaidOnlineOrders";
      return res.status(200).redirect("/myAccount");
    }
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//retryPaymentRequest
const retryPaymentRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderItem = await orderModels.findById(id);
    const userId = req.session.user?._id;

    const user = await userModels.findById(userId, {
      userName: 1,
      email: 1,
      phoneNumber: 1,
    });

    for (let item of orderItem.products) {
      //check product is active
      const activeResult = await checkProductValidity(
        item.productId,
        item.variantId
      );
      const checkStockResult = await checkStock(
        item.productId,
        item.variantId,
        item.quantity
      );
      if (!activeResult || checkStockResult) {
        await dropOrder(id, userId);
        req.session.sorryCheckout = true;
        return res
          .status(400)
          .json({ success: false, redirectUrl: "/checkOut/sorry" });
      }
    }

    const totalPrice =
      orderItem.totalPrice +
      orderItem.TotalShippingCost -
      orderItem.paymentDetails.walletUsedAmount;

    var instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
      amount: totalPrice * 100, // Convert to paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    await instance.orders.create(options, (err, order) => {
      if (err) {
        req.session.sorryCheckout = true;
        res
          .status(400)
          .json({ success: false, redirectUrl: "/checkOut/sorry" });
      } else {
        return res.status(200).json({
          success: true,
          order,
          id,
          user,
        });
      }
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

//paymentGatewayRequest
const paymentGatewayRequest = async (req, res, next) => {
  try {
    const { paymentData, parentOrderId } = req.body;

    //match razorpay_signature
    let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(
      paymentData.razorpay_order_id + "|" + paymentData.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    //if matched
    if (hmac == paymentData.razorpay_signature) {
      const result = await updateOrderToDatabase(
        parentOrderId,
        paymentData.razorpay_payment_id
      );

      if (result) {
        req.session.tab = "orders";
        return res.status(200).json({
          success: true,
          redirectUrl: "/myAccount",
        });
      }
    } else {
      req.session.sorryCheckout = true;
      return res.status(400).json({
        success: false,
        redirectUrl: "/checkOut/sorry",
      });
    }
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/myAccount";
    next(err);
  }
};

module.exports = {
  accountPage,
  addNewAddressPage,
  editAddressPage,
  OrderDetailsPage,
  editAccountDetailsRequest,
  addNewAddressRequest,
  editAddressRequest,
  removeAddressRequest,
  orderInvoicePage,
  cancelOrderRequest,
  dropOrderRequest,
  chnagePasswordPage,
  newPasswordPageRequest,
  returnProductRequest,
  cancelReturnRequest,
  retryPaymentRequest,
  paymentGatewayRequest,
};
