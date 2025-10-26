const StatusCode = require("../../constants/statusCode");
const orderModels = require("../../models/orderModels");
const { updateStockAndSalesCount } = require("../../utils/stockManagement");
const { walletUpdate } = require("../../utils/walletupdates");

// allOrdersPage
const allOrdersPage = async (req, res, next) => {
  try {
    const filterContent = req.session.filterContent ?? "all";
    const filterReturnContent = req.session.filterReturnContent ?? "all";
    delete req.session.filterContent;
    delete req.session.filterReturnContent;
    const allOrders = await orderModels.find().populate("userId");

    let orders = [];

    allOrders.forEach((order) => {
      order.products.forEach((eachOrder) => {
        if (filterContent == "all") {
          getFilteredOrder(order, eachOrder);
        }
        if (filterContent == "Pending" && eachOrder.status == "Pending") {
          getFilteredOrder(order, eachOrder);
        }
        if (filterContent == "Confirmed" && eachOrder.status == "Confirmed") {
          getFilteredOrder(order, eachOrder);
        }
        if (filterContent == "Shipped" && eachOrder.status == "Shipped") {
          getFilteredOrder(order, eachOrder);
        }
        if (
          filterContent == "OutForDelivery" &&
          eachOrder.status == "OutForDelivery"
        ) {
          getFilteredOrder(order, eachOrder);
        }
        if (filterContent == "Delivered" && eachOrder.status == "Delivered") {
          getFilteredOrder(order, eachOrder);
        }
        if (filterContent == "Cancelled" && eachOrder.status == "Cancelled") {
          getFilteredOrder(order, eachOrder);
        }
        if (filterContent == "Return" && eachOrder.status == "Return") {
          getFilteredOrder(order, eachOrder);
        }
      });
    });

    function getFilteredOrder(order, eachOrder) {
      const order1 = eachOrder.toObject(); // Convert to a plain JS object
      order1._id = order._id;
      order1.orderId = eachOrder._id;
      order1.userEmail = order.userId.email;
      order1.userId = order.userId._id;
      order1.shippingCost = eachOrder.shippingCost;
      order1.returnStatus = eachOrder.returnStatus;
      order1.orderDate = order.orderDate;
      order1.method = order.paymentDetails.method;
      order1.onlineTransactionStatus =
        order.paymentDetails.onlineTransactionStatus;
      orders.push(order1);
    }

    if (filterReturnContent != "all") {
      const retrunOrder = orders.filter((item) => {
        if (item.returnStatus == filterReturnContent) {
          return item;
        }
      });
      orders = retrunOrder;
    }

    orders.sort((a, b) => {
      return b.orderDate - a.orderDate;
    });

    res.status(StatusCode.OK).render("adminPages/orderManagement/allOrders", {
      orders,
      filterReturnContent,
      activeSidebar: { main: "orderManagement" },
      filterContent,
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allProducts";
    next(err);
  }
};

//filter request
const filterRequest = (req, res) => {
  const { filterContent, filterReturnContent } = req.body;
  req.session.filterContent = filterContent;
  req.session.filterReturnContent = filterReturnContent;
  res.status(StatusCode.OK).redirect("/admin/allOrders");
};

// changeOrderStatusRequest
const changeOrderStatusRequest = async (req, res, next) => {
  try {
    const { id, orderId } = req.params;
    const {
      orderStatus,
      orderReturnStatus,
      productId,
      variantId,
      quantity,
      price,
      discount,
      userId,
    } = req.body;
    const updateFields = {
      "products.$.status": orderStatus,
      updatedAt: Date.now(),
    };

    const orderDetails = await orderModels.findById(id, { paymentDetails: 1 });

    //order return status set Initiated
    if (orderStatus == "Return" && orderReturnStatus == undefined) {
      updateFields["products.$.returnStatus"] = "Initiated";
    }

    //order deliverd
    if (orderStatus == "Delivered") {
      updateFields["products.$.deliveredAt"] = Date.now();
      if (
        orderDetails.paymentDetails.onlineTransactionStatus != "Paid" &&
        orderDetails.paymentDetails.method != "Online"
      ) {
        updateFields["products.$.paymentStatus"] = "Paid";
      }
    }

    //order cancelled
    if (orderStatus == "Cancelled") {
      if (
        orderDetails.paymentDetails.onlineTransactionStatus == "Paid" &&
        (orderDetails.paymentDetails.method == "Online" ||
          orderDetails.paymentDetails.method == "Wallet" ||
          orderDetails.paymentDetails.method == "Wallet-Online")
      ) {
        //update wallet
        const incUpdates = {
          balance: quantity * price - discount,
          income: quantity * price - discount,
        };
        const pushUpdates = {
          transactions: {
            type: "Credit",
            amount: quantity * price - discount,
            parentOrderId: id,
            orderId,
            description:
              "You received a refund of ₹" +
              quantity * price -
              discount +
              ".00 for OrderId #" +
              orderId +
              "due to a canceled order",
          },
        };
        const result = await walletUpdate(userId, incUpdates, pushUpdates);

        updateOrder["products.$.paymentStatus"] = "Refunded";
      } else {
        updateFields["products.$.paymentStatus"] = "Failed";
      }
    }

    if (orderStatus == "Return" && orderReturnStatus != undefined) {
      updateFields["products.$.returnStatus"] = orderReturnStatus;
    }
    if (orderStatus == "Return" && orderReturnStatus == "Completed") {
      //update wallet
      const incUpdates = {
        balance: quantity * price - discount,
        income: quantity * price - discount,
      };
      const pushUpdates = {
        transactions: {
          type: "Credit",
          amount: quantity * price - discount,
          parentOrderId: id,
          orderId,
          description:
            "You received a refund of ₹" +
            quantity * price -
            discount +
            ".00 for OrderId #" +
            orderId +
            "due to a canceled order",
        },
      };
      await walletUpdate(userId, incUpdates, pushUpdates);

      //update variant stock
      const result = await updateStockAndSalesCount(
        productId,
        variantId,
        quantity,
        "add"
      );

      updateFields["products.$.returnedAt"] = Date.now();
      updateFields["products.$.paymentStatus"] = "Refunded";
    }

    await orderModels.findOneAndUpdate(
      { _id: id, "products._id": orderId },
      { $set: updateFields }
    );

    res.status(StatusCode.OK).redirect("/admin/allOrders");
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allOrders";
    next(err);
  }
};

//orderDetailsPage
const orderDetailsPage = async (req, res) => {
  try {
    const { id, orderId } = req.params;
    const order = await orderModels.findById(id).populate("products.productId");

    res.status(StatusCode.OK).render("adminPages/orderManagement/orderDetails", {
      activeSidebar: { main: "orderManagement" },
      order,
      orderId,
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allOrders";
    next(err);
  }
};

module.exports = {
  allOrdersPage,
  filterRequest,
  changeOrderStatusRequest,
  orderDetailsPage,
};
