const Dashboard = require("../../constants/admin/dashboard");
const StatusCode = require("../../constants/statusCode");
const categoryModels = require("../../models/categoryModels");
const orderModels = require("../../models/orderModels");
const productModels = require("../../models/productModels");
const subCategoryModels = require("../../models/subCategoryModels");
const userModels = require("../../models/userModels");
const moment = require("moment");

// dashboardPage
const dashboardPage = async (req, res, next) => {
  try {
    const userCount = await userModels.countDocuments({ role: "User" });

    const totalSales = await orderModels.aggregate([
      { $unwind: "$products" }, // Flatten the products array
      { $count: "totalOrders" }, // Count the total number of items
    ]);

    const completedOrders = await orderModels.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          $or: [
            { "products.status": "Delivered" },
            {
              "products.status": "Return",
              "products.returnStatus": "Cancelled",
            },
          ],
        },
      },
      { $count: "totalOrders" },
    ]);

    const pendingOrders = await orderModels.aggregate([
      { $unwind: "$products" }, // Flatten the products array
      {
        $match: {
          "products.status": {
            $in: ["Pending", "Confirmed", "Shipped", "OutForDelivery"],
          },
        },
      },
      { $count: "totalOrders" }, // Count the total number of matching documents
    ]);

    const returnedOrders = await orderModels.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.status": "Return",
          "products.returnStatus": "Completed",
        },
      },
      { $count: "totalOrders" },
    ]);

    const returnProgress = await orderModels.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.status": "Return",
          "products.returnStatus": {
            $in: ["Processing", "Initiated"],
          },
        },
      },
      { $count: "totalOrders" },
    ]);

    const cancelledOrders = await orderModels.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.status": "Cancelled",
        },
      },
      { $count: "totalOrders" },
    ]);

    const revenue = await orderModels.aggregate([
      { $unwind: "$products" }, // Flatten the products array
      {
        $match: {
          "products.paymentStatus": "Paid", // Ensure the order is paid
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $subtract: [
                { $multiply: ["$products.price", "$products.quantity"] }, // Total product revenue
                {
                  $add: [
                    { $ifNull: ["$products.couponDiscount", 0] }, // Use 0 if couponDiscount is missing
                    { $ifNull: ["$products.offerDiscount", 0] }, // Use 0 if offerDiscount is missing
                  ],
                },
              ],
            },
          },
        },
      },
    ]);

    const completedOrdersRevenue = await orderModels.aggregate([
      { $unwind: "$products" }, // Flatten the products array
      {
        $match: {
          "products.paymentStatus": "Paid", // Ensure the order is paid
          "products.status": "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $subtract: [
                { $multiply: ["$products.price", "$products.quantity"] }, // Total product revenue
                {
                  $add: [
                    { $ifNull: ["$products.couponDiscount", 0] }, // Use 0 if couponDiscount is missing
                    { $ifNull: ["$products.offerDiscount", 0] }, // Use 0 if offerDiscount is missing
                  ],
                },
              ],
            },
          },
        },
      },
    ]);

    //daily new users
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    // const newUsers = await userModels.aggregate([
    //   {
    //     $match: {
    //       createdAt: {
    //         $gte: startOfToday,
    //         $lte: endOfToday,
    //       },
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       totalUsers: { $sum: 1 },
    //     },
    //   },
    // ]);

    //daily active users
    const activeuserCount = await userModels.aggregate([
      {
        $match: {
          isBlock: false,
          isDeleted: false,
          role: "User",
          $or: [
            {
              lastLogin: {
                $gte: startOfToday,
                $lte: endOfToday,
              },
            },
            {
              lastOrderAt: {
                $gte: startOfToday,
                $lte: endOfToday,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
        },
      },
    ]);

    //top 10 category
    const top10Category = await categoryModels
      .find(
        {},
        {
          categoryName: 1,
          noOfSubCategory: 1,
          salesCount: 1,
          isInactive: 1,
          createdAt: 1,
        }
      )
      .sort({ salesCount: -1 })
      .limit(10);

    //top 10 brands
    const top10Brand = await subCategoryModels.aggregate([
      {
        $group: {
          _id: {
            normalizedName: {
              $toLower: {
                $replaceAll: {
                  input: "$subCategoryName",
                  find: " ",
                  replacement: "",
                },
              },
            }, // Normalize name for grouping
          },
          subCategoryName: { $first: "$subCategoryName" }, // Keep any original name
          totalSales: { $sum: "$salesCount" }, // Sum salesCount
          totalProducts: { $sum: "$noOfProducts" }, // Sum number of products
          firstCreatedAt: { $min: "$createdAt" }, // Get earliest created date
        },
      },
      { $sort: { totalSales: -1 } }, // Sort by totalSales descending
      { $limit: 10 }, // Get only top 10
      {
        $project: {
          _id: 0, // Remove MongoDB ID
          subCategoryName: 1,
          totalSales: 1,
          totalProducts: 1,
          firstCreatedAt: 1,
        },
      },
    ]);

    //top 10 Products
    const top10Product = await productModels
      .find(
        {},
        {
          productName: 1,
          noOfVariants: 1,
          salesCount: 1,
          createdAt: 1,
        }
      )
      .populate("categoryId", { categoryName: 1 })
      .populate("subCategoryId", { subCategoryName: 1 })
      .sort({ salesCount: -1 })
      .limit(10);

    res.status(StatusCode.OK).render("adminPages/dashboard/dashboard", {
      activeSidebar: { main: "dashboard" },
      userCount,
      activeuserCount: activeuserCount[0]?.totalUsers || 0,
      totalSales: totalSales[0]?.totalOrders || 0,
      completedOrders: completedOrders[0]?.totalOrders || 0,
      pendingOrders: pendingOrders[0]?.totalOrders || 0,
      returnProgress: returnProgress[0]?.totalOrders || 0,
      returnedOrders: returnedOrders[0]?.totalOrders || 0,
      cancelledOrders: cancelledOrders[0]?.totalOrders || 0,
      revenue: revenue[0]?.totalRevenue || 0,
      completedOrdersRevenue: completedOrdersRevenue[0]?.totalRevenue || 0,
      top10Category,
      top10Product,
      top10Brand,
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/dashboard";
    next(err);
  }
};

// dashboardUserFilterRequest
const dashboardUserFilterRequest = async (req, res, next) => {
  try {
    const { filter } = req.params;
    let { startDate, endDate } = req.body;

    let days = 1;
    if (filter === "Weekly") days = 7;
    if (filter === "Monthly") days = 30;
    if (filter === "Yearly") days = 12;

    let dataArray = [];

    if (filter === "Custom") {
      startDate = moment(startDate).startOf("day");
      endDate = moment(endDate).endOf("day");
      days = endDate.diff(startDate, "days");
    } else {
      endDate = moment().endOf("day");
      if (filter === "Daily") startDate = moment().startOf("day");
      if (filter === "Weekly")
        startDate = moment().subtract(7, "days").startOf("day");
      if (filter === "Monthly")
        startDate = moment().subtract(30, "days").startOf("day");
      if (filter === "Yearly")
        startDate = moment().subtract(1, "year").startOf("day");
    }

    const TotalUsers = await userModels.countDocuments({
      role: "User",
      createdAt: { $lte: endDate.toDate() },
    });

    const newUsers = await userModels.aggregate([
      {
        $match: {
          role: "User",
          createdAt: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalNewUser: { $sum: 1 },
        },
      },
    ]);

    const loopLimit = filter === "Daily" ? days - 1 : days;

    for (let i = 0; i <= loopLimit; i++) {
      let currentStartDate, currentEndDate;

      if (filter === "Yearly") {
        currentStartDate = moment(startDate).add(i, "months").startOf("month");
        currentEndDate = moment(startDate).add(i, "months").endOf("month");
      } else {
        currentStartDate = moment(startDate).add(i, "days").startOf("day");
        currentEndDate = moment(startDate).add(i, "days").endOf("day");
      }

      if (currentEndDate.isAfter(endDate)) {
        currentEndDate = endDate; // ✅ Ensure last date does not exceed the selected range
      }

      // Total Users up to that day
      const totalUsers = await userModels.countDocuments({
        role: "User",
        createdAt: { $lte: currentEndDate.toDate() },
      });

      // New Users for that day
      const newUsersResult = await userModels.aggregate([
        {
          $match: {
            role: "User",
            createdAt: {
              $gte: currentStartDate.toDate(),
              $lte: currentEndDate.toDate(),
            },
          },
        },
        {
          $group: { _id: null, total: { $sum: 1 } },
        },
      ]);
      const newUsers = newUsersResult.length > 0 ? newUsersResult[0].total : 0;

      // Push Data for Each Day
      dataArray.push({
        date: currentStartDate.format(
          filter === "Yearly" ? "YYYY-MM" : "YYYY-MM-DD"
        ),
        totalUsers,
        newUsers,
      });
    }

    let dateArr = [];
    let totalUsersArr = [];
    let newUsersArr = [];
    dataArray.forEach((item) => {
      dateArr.push(item.date);
      totalUsersArr.push(item.totalUsers);
      newUsersArr.push(item.newUsers);
    });

    res.status(StatusCode.OK).json({
      success: true,
      dateArr,
      totalUsersArr,
      newUsersArr,
      TotalUsers,
      newUsers: newUsers[0]?.totalNewUser || 0,
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/dashboard";
    next(err);
  }
};

const dashboardSalesFilterRequest = async (req, res, next) => {
  try {
    const { filter } = req.params;
    let { startDate, endDate } = req.body;

    let days, dateFormat, groupBy, timeUnit;

    if (filter === "Custom") {
      if (!startDate || !endDate) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: Dashboard.CUSTOM_FILTERING_REQUIRED,
        });
      }
      startDate = moment(startDate).startOf("day");
      endDate = moment(endDate).endOf("day");
      days = endDate.diff(startDate, "days") + 1; // ✅ Ensure correct day count
      dateFormat = "YYYY-MM-DD";
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
      timeUnit = "days";
    } else {
      if (!startDate || !endDate) {
        startDate = moment().startOf("day");
        endDate = moment().endOf("day");
      } else {
        startDate = moment(startDate).startOf("day");
        endDate = moment(endDate).endOf("day");
      }

      if (filter === "Daily") {
        days = 1;
        dateFormat = "YYYY-MM-DD";
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        timeUnit = "days";
      } else if (filter === "Weekly") {
        days = 7;
        startDate = moment().subtract(6, "days").startOf("day");
        dateFormat = "YYYY-MM-DD";
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        timeUnit = "days";
      } else if (filter === "Monthly") {
        days = 30;
        startDate = moment().subtract(29, "days").startOf("day");
        dateFormat = "YYYY-MM-DD";
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        timeUnit = "days";
      } else if (filter === "Yearly") {
        days = 12;
        startDate = moment().subtract(11, "months").startOf("month");
        dateFormat = "YYYY-MM";
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        timeUnit = "months";
      }
    }

    const salesData = await orderModels.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        },
      },
      { $unwind: "$products" }, // Each product in an order is counted separately
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
          CODOrders: {
            $sum: { $cond: [{ $eq: ["$paymentDetails.method", "COD"] }, 1, 0] },
          },
          CODAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentDetails.method", "COD"] },
                { $multiply: ["$products.price", "$products.quantity"] },
                0,
              ],
            },
          },
          digitalOrders: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$paymentDetails.method",
                    ["Online", "Wallet", "Wallet-Online"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          digitalAmount: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$paymentDetails.method",
                    ["Online", "Wallet", "Wallet-Online"],
                  ],
                },
                { $multiply: ["$products.price", "$products.quantity"] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    //  Fill Missing Dates in Dataset
    let dateArr = [];
    let totalOrdersArr = [];
    let totalRevenueArr = [];
    let CODOrdersArr = [];
    let CODAmountArr = [];
    let digitalOrdersArr = [];
    let digitalAmountArr = [];

    for (let i = 0; i < days; i++) {
      let dateLabel = moment(startDate).add(i, timeUnit).format(dateFormat);
      let foundData = salesData.find((item) => item._id === dateLabel);

      dateArr.push(dateLabel);
      totalOrdersArr.push(foundData ? foundData.totalOrders : 0);
      totalRevenueArr.push(foundData ? foundData.totalRevenue : 0);
      CODOrdersArr.push(foundData ? foundData.CODOrders : 0);
      CODAmountArr.push(foundData ? foundData.CODAmount : 0);
      digitalOrdersArr.push(foundData ? foundData.digitalOrders : 0);
      digitalAmountArr.push(foundData ? foundData.digitalAmount : 0);
    }

    return res.status(StatusCode.OK).json({
      success: true,
      filter,
      totalOrders: totalOrdersArr.reduce((a, b) => a + b, 0),
      totalRevenue: totalRevenueArr.reduce((a, b) => a + b, 0),
      CODOrdersCount: CODOrdersArr.reduce((a, b) => a + b, 0),
      CODOrdersAmount: CODAmountArr.reduce((a, b) => a + b, 0),
      digitalOrdersCount: digitalOrdersArr.reduce((a, b) => a + b, 0),
      digitalOrdersAmount: digitalAmountArr.reduce((a, b) => a + b, 0),
      dateArr,
      totalOrdersArr,
      totalRevenueArr,
      CODOrdersArr,
      CODAmountArr,
      digitalOrdersArr,
      digitalAmountArr,
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/dashboard";
    next(err);
  }
};

module.exports = {
  dashboardPage,
  dashboardUserFilterRequest,
  dashboardSalesFilterRequest,
};
