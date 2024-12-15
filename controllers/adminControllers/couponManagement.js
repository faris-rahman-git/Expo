const couponModels = require("../../models/couponModels");
const userModels = require("../../models/userModels");
const { getContrastColor } = require("../../utils/textColorGenerator.js");

//allCouponPage
const allCouponPage = async (req, res, next) => {
  try {
    const allCoupons = await couponModels
      .find({ isDeleted: false })
      .sort({ createdAt: 1 });

    res.status(200).render("adminPages/couponManagement/allCoupon", {
      activeSidebar: {
        main: "couponManagement",
        sub: "allCoupon",
      },
      allCoupons,
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allUsers";
    next(err);
  }
};

// addNewCouponPage
const addNewCouponPage = async (req, res, next) => {
  try {
    const users = await userModels.find({ isDeleted: false, role: "User" });
    res.status(200).render("adminPages/couponManagement/addNewCoupon", {
      activeSidebar: {
        main: "couponManagement",
        sub: "addNewCoupon",
      },
      users,
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allCoupon";
    next(err);
  }
};

//addNewCouponRequest
const addNewCouponRequest = async (req, res, next) => {
  try {
    const {
      couponName,
      couponCode,
      description,
      discountType,
      discountValue,
      startDate,
      expiryDate,
      totalUsageLimit,
      minPurchase,
      maxDiscount,
      couponStatus,
      couponColor,
      assignedUsers,
      selectedUsersId,
    } = req.body;

    if (discountType == "Percentage") {
      if (discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: "Discount Value Is Not In Percentage",
        });
      }
    }

    const normalizedCouponName = couponName.replace(/\s+/g, "").toLowerCase();
    const normalizedCouponCode = couponCode.replace(/\s+/g, "").toUpperCase();

    // Find the product in the database with the same normalized name, category, and subcategory
    const couponNameExist = await couponModels.findOne({
      $expr: {
        $eq: [
          {
            $toLower: {
              $replaceAll: {
                input: "$couponName", // Field to normalize
                find: " ", // What to replace
                replacement: "", // Replacement value
              },
            },
          },
          normalizedCouponName, // Normalized input
        ],
      },
    });

    if (couponNameExist) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon Name Already exists" });
    }

    //check coupon code is already exist
    const couponCodeExist = await couponModels.findOne({
      couponCode: normalizedCouponCode,
    });

    if (couponCodeExist) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon Code Already exists" });
    }

    const textColor = await getContrastColor(couponColor);

    // Create the new product
    const newPCoupon = new couponModels({
      couponName: couponName.trim(),
      couponCode: normalizedCouponCode,
      description: description.trim(),
      discountType,
      discountValue,
      minPurchase,
      color: couponColor,
      textColor,
      assignedUsers,
    });

    if (startDate == "") {
      newPCoupon.startDate = Date.now();
    } else {
      newPCoupon.startDate = new Date(startDate);
    }
    if (expiryDate == "") {
      newPCoupon.expiryDate = null;
    } else {
      newPCoupon.expiryDate = new Date(expiryDate);
    }
    if (discountType == "Percentage") {
      newPCoupon.maxDiscount = maxDiscount;
    }
    if (couponStatus == "Active") {
      newPCoupon.isActive = true;
    } else {
      newPCoupon.isActive = false;
    }
    if (totalUsageLimit == "" || totalUsageLimit == 0) {
      newPCoupon.totalUsageLimit = null;
    } else {
      newPCoupon.totalUsageLimit = totalUsageLimit;
    }
    if (assignedUsers == "selectedUsers") {
      const usersId = JSON.parse(selectedUsersId);
      newPCoupon.selectedUsersId = usersId;
    }

    // Save the new coupon
    const coupon = await newPCoupon.save();
    if (assignedUsers == "allUsers") {
      //add coupon to all users database
      await userModels.updateMany(
        { role: "User" },
        { $push: { userCoupons: { couponId: coupon._id } } }
      );
    } else {
      const usersId = JSON.parse(selectedUsersId);

      for (let id of usersId) {
        await userModels.findByIdAndUpdate(id, {
          $push: { userCoupons: { couponId: coupon._id } },
        });
      }
    }

    return res
      .status(200)
      .json({ success: true, redirectUrl: "/admin/allCoupon" });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allCoupon";
    next(err);
  }
};

//editCouponPage
const editCouponPage = async (req, res, next) => {
  try {
    const id = req.params.id;
    const coupon = await couponModels.findById(id);
    const users = await userModels.find({ isDeleted: false, role: "User" });

    const message = req.session.message ?? "Edit Coupon Details";
    delete req.session.message;
    res.status(200).render("adminPages/couponManagement/editCoupon", {
      coupon,
      message,
      users,
      activeSidebar: { main: "couponManagement" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allCoupon";
    next(err);
  }
};

// editCouponRequest
const editCouponRequest = async (req, res, next) => {
  const id = req.params.id;
  try {
    const coupon = await couponModels.findById(id);
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, redirectUrl: "/admin/allCoupon" });

    const {
      couponName,
      couponColor,
      description,
      discountType,
      discountValue,
      startDate,
      expiryDate,
      totalUsageLimit,
      minPurchase,
      maxDiscount,
      couponStatus,
      assignedUsers,
      selectedUsersId,
    } = req.body;

    const normalizedCouponName = couponName.replace(/\s+/g, "").toLowerCase();

    //check coupon Name is already exist
    const couponNameExist = await couponModels.findOne({
      $expr: {
        $eq: [
          {
            $toLower: {
              $replaceAll: {
                input: "$couponName", // Field to normalize
                find: " ", // What to replace
                replacement: "", // Replacement value
              },
            },
          },
          normalizedCouponName, // Normalized input
        ],
      },
    });
    if (couponNameExist && couponNameExist._id.toString() != id) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon Name is already Taken" });
    }

    let updateCoupon = {};
    if (couponName != coupon.couponName)
      updateCoupon.couponName = couponName.trim();

    if (couponColor != coupon.color) {
      updateCoupon.color = couponColor;
      const textColor = await getContrastColor(couponColor);
      updateCoupon.textColor = textColor;
    }

    if (description != coupon.description)
      updateCoupon.description = description.trim();

    if (discountType != coupon.discountType) {
      updateCoupon.discountType = discountType;
    }

    if (discountType == "Percentage") {
      if (maxDiscount != coupon.maxDiscount) {
        updateCoupon.maxDiscount = maxDiscount;
      }
    } else {
      updateCoupon.maxDiscount = null;
    }

    if (discountValue != coupon.discountValue)
      updateCoupon.discountValue = discountValue;

    if (new Date(startDate) != coupon.startDate) {
      if (startDate != "") {
        updateCoupon.startDate = new Date(startDate);
      }
    }

    if (new Date(expiryDate) != coupon.expiryDate) {
      if (expiryDate == "") {
        updateCoupon.expiryDate = null;
      } else {
        updateCoupon.expiryDate = new Date(expiryDate);
      }
    }

    if (totalUsageLimit != coupon.totalUsageLimit) {
      if (totalUsageLimit == 0) {
        updateCoupon.totalUsageLimit = null;
      } else {
        updateCoupon.totalUsageLimit = totalUsageLimit;
      }
    }

    if (minPurchase != coupon.minPurchase) {
      updateCoupon.minPurchase = minPurchase;
    }

    const isActive = couponStatus == "Active" ? true : false;
    if (isActive != coupon.couponStatus) {
      updateCoupon.isActive = isActive;
    }

    let usersId = [];
    if (selectedUsersId != "") {
      usersId = JSON.parse(selectedUsersId);
    }
    if (
      assignedUsers != coupon.assignedUsers ||
      usersId != coupon.selectedUsersId
    ) {
      updateCoupon.assignedUsers = assignedUsers;
      await userModels.updateMany(
        { "userCoupons.couponId": coupon._id },
        { $pull: { userCoupons: { couponId: coupon._id } } }
      );
      if (assignedUsers == "selectedUsers") {
        updateCoupon.selectedUsersId = usersId;
        //add coupons to user database
        for (let id of usersId) {
          await userModels.findByIdAndUpdate(id, {
            $push: { userCoupons: { couponId: coupon._id } },
          });
        }
      }

      if (assignedUsers == "allUsers") {
        updateCoupon.selectedUsersId = [];
        //add coupon to all users database
        await userModels.updateMany(
          { role: "User" },
          { $push: { userCoupons: { couponId: coupon._id } } }
        );
      }
    }

    updateCoupon.updatedAt = Date.now();

    await couponModels.findOneAndUpdate({ _id: id }, { $set: updateCoupon });

    return res
    .status(200)
    .json({ success: true, redirectUrl: "/admin/allCoupon" });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allCoupon";
    next(err);
  }
};

//softDeleteCouponRequest
const softDeleteCouponRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await couponModels.findById(id);
    if (!coupon) {
      return res.status(404).redirect("/admin/allCoupon");
    }

    //update coupon details
    const updateCoupon = {
      isDeleted: true,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    };
    await couponModels.findOneAndUpdate({ _id: id }, { $set: updateCoupon });

    res.status(200).redirect("/admin/allCoupon");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allCoupon";
    next(err);
  }
};

//DeleteCouponPage
const DeleteCouponPage = async (req, res, next) => {
  try {
    const coupons = await couponModels.find({ isDeleted: true });
    res.status(200).render("adminPages/couponManagement/deletedCoupon", {
      coupons,
      activeSidebar: {
        main: "couponManagement",
        sub: "deletedCoupons",
      },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allCoupon";
    next(err);
  }
};

// restore Category Request
const restoreCouponRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const coupon = await couponModels.findById(id);
    if (!coupon) {
      return res.status(404).redirect("/admin/allCoupon");
    }

    //update coupon details
    const updateCoupon = {
      isDeleted: false,
      deletedAt: null,
      updatedAt: Date.now(),
    };

    await couponModels.findOneAndUpdate({ _id: id }, { $set: updateCoupon });

    res.status(200).redirect("/admin/deletedCoupon");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/deletedCoupon";
    next(err);
  }
};

// delete Category Request
const deletedCouponRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const coupon = await couponModels.findById(id);
    if (!coupon) {
      return res.status(404).redirect("/admin/allCoupon");
    }

    await couponModels.deleteOne({ _id: id });

    await userModels.updateMany(
      { "userCoupons.couponId": id },
      { $pull: { userCoupons: { couponId: id } } }
    );

    return res.status(200).redirect("/admin/deletedCoupon");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/deletedCoupon";
    next(err);
  }
};

module.exports = {
  addNewCouponPage,
  addNewCouponRequest,
  allCouponPage,
  softDeleteCouponRequest,
  DeleteCouponPage,
  restoreCouponRequest,
  deletedCouponRequest,
  editCouponPage,
  editCouponRequest,
};
