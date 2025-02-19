const userModels = require("../../models/userModels");
const productModels = require("../../models/productModels");
const cartModels = require("../../models/cartModels");
const {
  checkProductValidity,
  checkStock,
} = require("../../utils/stockManagement");
const walletModels = require("../../models/walletModels");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const {
  placeOrderToDatabase,
  updateOrderToDatabase,
} = require("../../utils/placeOrderToDatabase");
const { walletUpdate } = require("../../utils/walletupdates");
const couponModels = require("../../models/couponModels");

//cartCheckoutRequest
const cartCheckoutRequest = (req, res) => {
  delete req.session.productId;
  delete req.session.variantId;
  delete req.session.quantity;
  req.session.checkout = true;
  res.status(200).redirect("/checkOut");
};

// productCheckoutRequest
const productCheckoutRequest = async (req, res, next) => {
  try {
    const { quantity, productId, variantId } = req.body;

    const result = await checkProductValidity(productId, variantId);
    if (!result) {
      const url = "/home";
      return res.status(400).redirect(url);
    }

    req.session.checkout = true;
    req.session.productId = productId;
    req.session.variantId = variantId;
    if (quantity > 3) {
      req.session.quantity = 3;
    } else if (quantity <= 0) {
      req.session.quantity = 1;
    } else {
      req.session.quantity = quantity;
    }
    res.status(200).redirect("/checkOut");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/home";
    next(err);
  }
};

// checkOutPage
const checkOutPage = async (req, res, next) => {
  try {
    if (!req.session.checkout) {
      if (
        req.get("Referer") == "https://localhost:3000/checkOut" ||
        req.get("Referer") == "http://localhost:3000/checkOut"
      ) {
        return res.status(200).redirect("/home");
      }
      return res.status(200).redirect(req.get("Referer") || "/home");
    }

    const userId = req.session?.user?._id;
    const user = await userModels.findById(userId);
    let defaultAddress;

    for (let item of user.addresses) {
      if (item._id.toString() === user.defaultAddress.toString()) {
        defaultAddress = item;
      }
    }

    let coupon = req.session.coupon || null;
    let selectedItems = [];
    let forPlaceOrder = [];
    let subtotal = 0;
    let orderTotal = 0;
    let TotalDicount = 0;

    //cart
    if (!req.session.productId) {
      const cart = await cartModels
        .findOne({ userId })
        .populate("items.productId");

      for (let item of cart.items) {
        for (let variant of item.productId.variants) {
          if (variant._id.toString() == item.variantId.toString()) {
            //check stock
            if (item.quantity > variant.stock) {
              return res.status(400).redirect("/cart");
            }

            const clonedVariant = variant.toObject(); // Convert to a plain JS object
            clonedVariant.productName = item.productId.productName; // Modify the cloned object
            clonedVariant.quantity = item.quantity;
            clonedVariant.cartItemId = item._id;
            clonedVariant.productId = item.productId._id;
            selectedItems.push(clonedVariant);
            subtotal += variant.finalPrice * item.quantity;
          }
        }
      }

      for (let item of cart.items) {
        for (let variant of item.productId.variants) {
          if (variant._id.toString() == item.variantId.toString()) {
            //check stock
            if (item.quantity > variant.stock) {
              return res.status(400).redirect("/cart");
            }

            //placeOrder details
            const placeOrder = {};
            placeOrder.productId = item.productId._id;
            placeOrder.variantId = variant._id;
            placeOrder.quantity = item.quantity;
            placeOrder.price = variant.price;
            placeOrder.finalPrice = variant.finalPrice;
            placeOrder.discount = 0;
            if (coupon) {
              let totalPrice = variant.finalPrice * item.quantity;
              let orderTotal1;
              if (coupon.discountType == "Percentage") {
                orderTotal1 = parseInt(
                  totalPrice - totalPrice * (coupon.discountValue / 100)
                );
              }
              if (coupon.discountType == "Fixed") {
                orderTotal1 =
                  totalPrice -
                  parseInt((totalPrice / subtotal) * coupon.discountValue);
              }
              placeOrder.discount = totalPrice - orderTotal1;
              orderTotal += orderTotal1;
              TotalDicount += totalPrice - orderTotal1;
            }
            forPlaceOrder.push(placeOrder);
          }
        }
      }

      req.session.checkoutFromCart = true;
    } else {
      //check product is valid
      const resultActive = await checkProductValidity(
        req.session.productId,
        req.session.variantId
      );
      if (!resultActive) {
        return res.status(400).redirect("/home");
      }

      const product = await productModels.findOne({
        _id: req.session.productId,
      });
      for (let variant of product.variants) {
        {
          if (variant._id.toString() == req.session.variantId.toString()) {
            //if stock is zero
            if (variant.stock == 0) {
              req.session.messageFromCheckout = true;
              return res
                .status(400)
                .redirect(
                  "/productDetails/" +
                    req.session.productId +
                    "/" +
                    req.session.variantId
                );
            }

            const clonedVariant = variant.toObject(); // Convert to a plain JS object
            clonedVariant.productName = product.productName; // Modify the cloned object
            clonedVariant.quantity =
              Number(req.session.quantity) > variant.stock
                ? variant.stock
                : Number(req.session.quantity);
            clonedVariant.productId = product._id;
            selectedItems.push(clonedVariant);
            subtotal +=
              variant.finalPrice *
              (Number(req.session.quantity) > variant.stock
                ? variant.stock
                : Number(req.session.quantity));
          }
        }
      }

      for (let variant of product.variants) {
        {
          if (variant._id.toString() == req.session.variantId.toString()) {
            //if stock is zero
            if (variant.stock == 0) {
              req.session.messageFromCheckout = true;
              return res
                .status(400)
                .redirect(
                  "/productDetails/" +
                    req.session.productId +
                    "/" +
                    req.session.variantId
                );
            }

            //placeorder details
            const placeOrder = {};
            placeOrder.productId = product._id;
            placeOrder.variantId = variant._id;
            placeOrder.quantity =
              Number(req.session.quantity) > variant.stock
                ? variant.stock
                : Number(req.session.quantity);
            placeOrder.price = variant.price;
            placeOrder.finalPrice = variant.finalPrice;
            placeOrder.discount = 0;

            if (coupon) {
              let totalPrice =
                variant.finalPrice *
                (Number(req.session.quantity) > variant.stock
                  ? variant.stock
                  : Number(req.session.quantity));
              let orderTotal1;
              if (coupon.discountType == "Percentage") {
                orderTotal1 = parseInt(
                  totalPrice - totalPrice * (coupon.discountValue / 100)
                );
              }
              if (coupon.discountType == "Fixed") {
                orderTotal1 =
                  totalPrice -
                  parseInt((totalPrice / subtotal) * coupon.discountValue);
              }
              placeOrder.discount = totalPrice - orderTotal1;
              orderTotal += orderTotal1;
              TotalDicount += totalPrice - orderTotal1;
            }

            forPlaceOrder.push(placeOrder);
          }
        }
      }
    }

    //take wallet balance
    const walletBalance = await walletModels.findOne(
      { userId },
      { balance: 1 }
    );

    if (
      coupon &&
      coupon.maxDiscount < TotalDicount &&
      coupon.maxDiscount != 0 &&
      coupon.discountType == "Percentage"
    ) {
      orderTotal = 0;
      TotalDicount = 0;
      for (let item of forPlaceOrder) {
        let totalPrice = item.finalPrice * item.quantity;
        let orderTotal1 =
          totalPrice - parseInt((totalPrice / subtotal) * coupon.maxDiscount);
        item.discount = totalPrice - orderTotal1;
        orderTotal += orderTotal1;
        TotalDicount += totalPrice - orderTotal1;
      }
    }

    if (orderTotal == 0) {
      orderTotal = subtotal;
    }

    res.status(200).render("userPages/pages/checkout/checkOut", {
      defaultAddress,
      subtotal,
      coupon,
      TotalDicount,
      orderTotal: orderTotal + selectedItems.length * 25,
      selectedItems,
      walletBalance,
      forPlaceOrder: JSON.stringify(forPlaceOrder),
    });
  } catch (err) {
    if (
      req.get("Referer") == "https://localhost:3000/checkOut" ||
      req.get("Referer") == "http://localhost:3000/checkOut"
    ) {
      err.redirectUrl = "/home";
    } else {
      err.redirectUrl = req.get("Referer") || "/home";
    }
    err.status = 500;
    next(err);
  }
};

// changeAddressPage
const changeAddressPage = async (req, res, next) => {
  try {
    delete req.session.changeAddressPage;
    if (!req.session.checkout) {
      return res.status(400).redirect(req.get("Referer") || "/home");
    }

    const userId = req.session?.user?._id;
    const user = await userModels.findById(userId);
    let defaultAddress;
    let address = [];

    for (let item of user.addresses) {
      if (item._id.toString() === user.defaultAddress.toString()) {
        defaultAddress = item;
      } else {
        address.push(item);
      }
    }

    req.session.changeAddressPage = true;
    res.status(200).render("userPages/pages/checkout/changeAddress", {
      defaultAddress,
      address,
      userId,
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = req.get("Referer") || "/home";
    next(err);
  }
};

// changeAddressRequest
const changeAddressRequest = async (req, res, next) => {
  try {
    const { address } = req.body;
    await userModels.findOneAndUpdate(
      {
        _id: req.session?.user?._id,
      },
      {
        $set: { defaultAddress: address },
        updatedAt: Date.now(),
      }
    );
    res.status(200).redirect("/checkOut");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/checkOut";
    next(err);
  }
};

//applyCouponRequest
const applyCouponRequest = async (req, res) => {
  try {
    delete req.session.coupon;
    let { coupon, subtotal } = req.body;
    coupon = coupon.toUpperCase().trim();
    subtotal = Number(subtotal);
    const userId = req.session?.user?._id;

    const user = await userModels
      .findOne({ _id: userId }, { userCoupons: 1 })
      .populate("userCoupons.couponId");

    if (user.userCoupons.length > 0) {
      for (let item of user.userCoupons) {
        if (item.couponId.couponCode == coupon) {
          if (item.couponId.isDeleted) {
            return res
              .status(400)
              .json({ success: false, message: "Coupon Removed" });
          }
          if (!item.couponId.isActive) {
            return res
              .status(400)
              .json({ success: false, message: "Coupon Inactive" });
          }
          if (item.couponId.expiryDate) {
            if (item.couponId.expiryDate < Date.now()) {
              return res
                .status(400)
                .json({ success: false, message: "Coupon Expired" });
            }
          }
          if (item.couponId.startDate > Date.now()) {
            return res
              .status(400)
              .json({ success: false, message: "Coupon Not Valid Yet " });
          }
          if (item.couponId.minPurchase > subtotal) {
            return res.status(400).json({
              success: false,
              message: "Minimum Purchase Amount Not Met",
            });
          }
          if (item.couponId.totalUsageLimit) {
            if (
              item.couponId.totalUsageLimit <= item.couponId.currectUsageCount
            ) {
              return res.status(400).json({
                success: false,
                message: "Coupon Usage Limit Exceeded",
              });
            }
          }
          if (item.isUsed) {
            return res
              .status(400)
              .json({ success: false, message: "Coupon is already used" });
          }
          req.session.coupon = {
            _id: item.couponId._id,
            couponCode: item.couponId.couponCode,
            discountType: item.couponId.discountType,
            discountValue: item.couponId.discountValue,
            maxDiscount: item.couponId.maxDiscount,
          };
          return res.status(200).json({
            success: true,
            message: "Coupon Applied Successfully",
          });
        }
      }
    }
    return res
      .status(400)
      .json({ success: false, message: "Coupon Not Found" });
  } catch (err) {
    res.status(200).json({ success: false, message: "SomeThing Went Wrong" });
  }
};

// removeCouponRequest
const removeCouponRequest = (req, res) => {
  delete req.session.coupon;
  res.status(200).json({ success: true });
};

// placeOrderRequest
const placeOrderRequest = async (req, res, next) => {
  try {
    let {
      forPlaceOrder,
      defaultAddress,
      paymentMethod,
      isWalletPayment,
      walletBalance,
    } = req.body;

    delete req.session.checkout;
    delete req.session.coupon;
    delete req.session.productId;
    delete req.session.variantId;
    delete req.session.quantity;

    if (!defaultAddress) {
      return res.status(400).json({ success: false, redirectUrl: "/checkOut" });
    }
    if (!isWalletPayment && paymentMethod == null) {
      paymentMethod = "COD";
    }

    const userId = req.session?.user?._id;
    const couponId = req.session?.coupon?._id ?? null;
    if (couponId) {
      const coupon = await couponModels.findById(couponId);
      {
        if (coupon.isDeleted) {
          return res
            .status(400)
            .json({ success: false, message: "Coupon Removed" });
        }
        if (!coupon.isActive) {
          return res
            .status(400)
            .json({ success: false, message: "Coupon Inactive" });
        }
        if (coupon.expiryDate) {
          if (coupon.expiryDate < Date.now()) {
            return res
              .status(400)
              .json({ success: false, message: "Coupon Expired" });
          }
        }
        if (coupon.startDate > Date.now()) {
          return res
            .status(400)
            .json({ success: false, message: "Coupon Not Valid Yet " });
        }
        if (coupon.totalUsageLimit) {
          if (coupon.totalUsageLimit <= coupon.currectUsageCount) {
            return res.status(400).json({
              success: false,
              message: "Coupon Usage Limit Exceeded",
            });
          }
        }
      }
    }
    let orderItems = JSON.parse(forPlaceOrder);
    let address = JSON.parse(defaultAddress);
    let totalPrice = 0;

    const user = await userModels.findById(userId, {
      userName: 1,
      email: 1,
      phoneNumber: 1,
    });

    for (let item of orderItems) {
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
        req.session.sorryCheckout = true;
        return res
          .status(400)
          .json({ success: false, redirectUrl: "/checkOut/sorry" });
      }
      totalPrice += item.quantity * item.finalPrice - item.discount;
    }

    let walletAmount = 0;
    let isWalletPaymentAndOnline = false;

    totalPrice = totalPrice + orderItems.length * 25;

    //wallet and hibrid
    if (isWalletPayment) {
      //wallet only
      if (walletBalance >= totalPrice) {
        paymentMethod = "Wallet";
        const isWallet = true;
        const ischeckoutFromCart = req.session.checkoutFromCart;
        delete req.session.checkoutFromCart;

        const result2 = await placeOrderToDatabase(
          couponId,
          ischeckoutFromCart,
          address,
          orderItems,
          paymentMethod,
          userId,
          isWallet
        );
        if (!result2) {
          req.session.sorryCheckout = true;
          return res
            .status(400)
            .json({ success: false, redirectUrl: "/checkOut/sorry" });
        }

        const orderIds = [];
        result2.products.forEach((product) => {
          orderIds.push(product._id);
        });
        //update wallet
        const incUpdates = {
          balance: -totalPrice,
          expense: totalPrice,
        };
        const pushUpdates = {
          transactions: {
            type: "Debit",
            amount: totalPrice,
            parentOrderId: result2._id,
            orderIdsForWalletOrder: [...orderIds],
            description:
              "You used ₹" +
              totalPrice +
              ".00 from your wallet to complete the purchase of your order #" +
              orderIds,
          },
        };
        const result1 = await walletUpdate(userId, incUpdates, pushUpdates);

        if (!result1) {
          req.session.sorryCheckout = true;
          return res
            .status(400)
            .json({ success: false, redirectUrl: "/checkOut/sorry" });
        }

        req.session.thankyou = true;
        return res.status(200).json({
          success: true,
          paymentMethod: "Wallet",
          redirectUrl: "/checkOut/thankYou",
        });
      } else {
        totalPrice = totalPrice - walletBalance;
        walletAmount = walletBalance;
        isWalletPaymentAndOnline = true;
        paymentMethod = "Wallet-Online";
      }
    }

    if (paymentMethod == "Online" || isWalletPaymentAndOnline) {
      //create an  online or Wallet-Online order
      const isWallet = false;
      const ischeckoutFromCart = req.session.checkoutFromCart;
      delete req.session.checkoutFromCart;
      const result = await placeOrderToDatabase(
        couponId,
        ischeckoutFromCart,
        address,
        orderItems,
        paymentMethod,
        userId,
        isWallet,
        walletAmount
      );
      if (!result) {
        req.session.sorryCheckout = true;
        return res
          .status(400)
          .json({ success: false, redirectUrl: "/checkOut/sorry" });
      }

      const parentOrderId = result._id;
      //if Wallet-Online order
      if (isWalletPaymentAndOnline) {
        const orderIds = [];
        result.products.forEach((product) => {
          orderIds.push(product._id);
        });
        //update wallet
        const incUpdates = {
          balance: -walletAmount,
          expense: walletAmount,
        };
        const pushUpdates = {
          transactions: {
            type: "Debit",
            amount: walletAmount,
            parentOrderId: parentOrderId,
            orderIdsForWalletOrder: [...orderIds],
            description:
              "You used ₹" +
              walletAmount +
              ".00 from your wallet to complete the purchase of your order #" +
              orderIds,
          },
        };
        const result1 = await walletUpdate(userId, incUpdates, pushUpdates);

        if (!result1) {
          req.session.sorryCheckout = true;
          return res
            .status(400)
            .json({ success: false, redirectUrl: "/checkOut/sorry" });
        }
      }

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
            .status(500)
            .json({ success: false, redirectUrl: "/checkOut/sorry" });
        } else {
          return res.status(200).json({
            success: true,
            paymentMethod,
            order,
            parentOrderId,
            user,
          });
        }
      });
    }

    //if payment is COD
    if (paymentMethod == "COD") {
      const ischeckoutFromCart = req.session.checkoutFromCart;
      delete req.session.checkoutFromCart;
      const result = await placeOrderToDatabase(
        couponId,
        ischeckoutFromCart,
        address,
        orderItems,
        paymentMethod,
        userId
      );
      if (!result) {
        req.session.sorryCheckout = true;
        return res
          .status(400)
          .json({ success: false, redirectUrl: "/checkOut/sorry" });
      }

      req.session.thankyou = true;
      return res.status(200).json({
        success: true,
        paymentMethod,
        redirectUrl: "/checkOut/thankYou",
      });
    }
  } catch (err) {
    req.session.sorryCheckout = true;
    res.status(500).json({ success: false, redirectUrl: "/checkOut/sorry" });
  }
};

// placeOrderPaymentRequest
const placeOrderPaymentRequest = async (req, res) => {
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
        req.session.thankyou = true;
        return res.status(200).json({
          success: true,
          redirectUrl: "/checkOut/thankYou",
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
    console.log(err);
  }
};

// thankYouPage
const thankYouPage = (req, res) => {
  if (req.session.thankyou) {
    delete req.session.thankyou;
    res.status(200).render("userPages/pages/checkout/thankYou");
  } else {
    const url = req.get("Referer") || "/home";
    res.status(200).redirect(url);
  }
};

//sorryPage
const sorryPage = (req, res) => {
  if (req.session.sorryCheckout) {
    delete req.session.sorryCheckout;
    res.status(200).render("userPages/pages/checkout/Sorry");
  } else {
    const url = req.get("Referer") || "/home";
    res.status(200).redirect(url);
  }
};

module.exports = {
  cartCheckoutRequest,
  productCheckoutRequest,
  checkOutPage,
  changeAddressPage,
  changeAddressRequest,
  placeOrderRequest,
  thankYouPage,
  sorryPage,
  placeOrderPaymentRequest,
  applyCouponRequest,
  removeCouponRequest,
};
