const moment = require("moment");
const orderModels = require("../../models/orderModels");
const StatusCode = require("../../constants/statusCode");

const salesReportPage = async (req, res, next) => {
  try {
    const filter = req.query.salesReportFilter || "Daily";
    let endDate = req.query.toDate || "";
    let startDate = req.query.fromDate || "";

    let days;

    if (filter == "Custom") {
      if (
        !startDate ||
        !endDate ||
        !moment(startDate).isValid() ||
        !moment(endDate).isValid()
      ) {
        return res.status(StatusCode.BAD_REQUEST).redirect("/admin/salesReport");
      }
      startDate = moment(startDate).startOf("day");
      endDate = moment(endDate).endOf("day");
      days = endDate.diff(startDate, "days") + 1;
    } else {
      startDate = moment(startDate).isValid()
        ? moment(startDate).startOf("day")
        : moment().startOf("day");
      endDate = moment(endDate).isValid()
        ? moment(endDate).endOf("day")
        : moment().endOf("day");

      if (filter === "Daily") {
        days = 1;
      } else if (filter === "Weekly") {
        days = 7;
        startDate = moment().subtract(6, "days").startOf("day");
      } else if (filter === "Monthly") {
        days = 30;
        startDate = moment().subtract(29, "days").startOf("day");
      } else if (filter === "Yearly") {
        days = 12;
        startDate = moment().subtract(11, "months").startOf("month");
      }
    }

    // Sales Data Aggregation Query
    const salesData = await orderModels.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: null,
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
    ]);

    const orderproducts = await orderModels.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          $or: [
            { orderDate: { $gte: startDate.toDate(), $lte: endDate.toDate() } },
          ],
        },
      },
      {
        $lookup: {
          from: "usermodels",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
    ]);

    return res.status(StatusCode.OK).render("adminPages/salesReport/salesReport", {
      activeSidebar: { main: "salesReport" },
      salesData: salesData.length > 0 ? salesData[0] : {},
      fromDate: startDate,
      toDate: endDate,
      orderproducts,
      filter,
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/dashboard";
    next(err);
  }
};

const salesReportFilterRequest = (req, res) => {
  let { salesReportFilter, toDate, fromDate } = req.body;
  salesReportFilter = salesReportFilter || "";
  toDate = toDate || "";
  fromDate = fromDate || "";
  res
    .status(StatusCode.OK)
    .redirect(
      "/admin/salesReport?salesReportFilter=" +
        salesReportFilter +
        "&fromDate=" +
        fromDate +
        "&toDate=" +
        toDate
    );
};

module.exports = {
  salesReportPage,
  salesReportFilterRequest,
};
