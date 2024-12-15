const cartModels = require("../../models/cartModels");
const sessionModels = require("../../models/sessionModels");
const userModels = require("../../models/userModels");
const bcrypt = require("bcrypt");
const walletModels = require("../../models/walletModels");
const wishlistModels = require("../../models/wishlistModels");
const couponModels = require("../../models/couponModels");

//all users page
const allUsersPage = async (req, res, next) => {
  try {
    const users = await userModels.find({ isDeleted: false, role: "User" });
    res.status(200).render("adminPages/userManagement/allUsers", {
      users,
      activeSidebar: { main: "userManagement", sub: "allUsers" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/login";
    next(err);
  }
};

// edit User Page
const editUserPage = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await userModels.findById(id);

    //check user is exist or not
    if (!user) {
      return res.status(404).redirect("/admin/allUsers");
    }

    //redirect to edit user page
    return res.status(200).render("adminPages/userManagement/editUser", {
      user,
      activeSidebar: { main: "userManagement" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allUsers";
    next(err);
  }
};


// edit User Request
const editUserRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const {
      userName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      blockStatus,
    } = req.body;
    const user = await userModels.findById(id);

    //check user is exist or not
    if (!user) {
      return res
        .status(409)
        .json({ success: false, redirectUrl: "/admin/allUsers" });
    }

    //check email is already taken or not
    const userExist = await userModels.findOne({ email });
    if (userExist && userExist._id.toString() !== id) {
      return res
        .status(409)
        .json({ success: false, message: "Email Address is Already Taken" });
    }

    //check password is match or not
    if (password !== confirmPassword) {
      return res.status(409).json({
        success: false,
        message: "password and confirm password is not match",
      });
    }

    //add user details to database
    const updateUser = {};
    //check user name and add to database
    if (userName !== user.userName && userName)
      updateUser.userName = userName.trim();

    //check email and add to database
    if (email !== user.email && email) updateUser.email = email.trim();

    //hash password and add to database
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateUser.password = hashedPassword;
    }

    //check phone number and add to database
    if (phoneNumber !== user.phoneNumber && phoneNumber)
      updateUser.phoneNumber = phoneNumber.trim();

    //check block status and add to database
    const isBlock = blockStatus === "true" ? true : false;
    if (isBlock !== user.isBlock) {
      updateUser.isBlock = isBlock;
      if (isBlock) {
        updateUser.blockedAt = Date.now();
        await sessionModels.deleteMany({ "session.user.email": user.email });
      } else {
        updateUser.blockedAt = null;
      }
    }

    //upadte
    updateUser.updatedAt = Date.now();
    updateUser.updatedBy = "Admin";

    //add user to database
    await userModels.updateOne({ _id: id }, { $set: updateUser });

    //redirect to all users page
    return res
      .status(200)
      .json({ success: true, redirectUrl: "/admin/allUsers" });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allUsers";
    next(err);
  }
};

// soft Delete User Request
const softDeleteUserRequest = async (req, res, next) => {
  try {
    //take datas from request body
    const id = req.params.id;
    const { page } = req.body;

    //find user
    const user = await userModels.findById(id);

    //check if user exists
    if (!user) {
      if (page === "blockedUsers") {
        return res.status(404).redirect("/admin/blockedUsers");
      }
      return res.status(404).redirect("/admin/allUsers");
    }

    await sessionModels.deleteMany({ "session.user.email": user.email });

    //update user status to deleted
    const updateUser = {};
    updateUser.isDeleted = true;
    updateUser.deletedAt = Date.now();
    updateUser.deletedBy = "Admin";
    updateUser.updatedAt = Date.now();
    updateUser.updatedBy = "Admin";
    await userModels.updateOne({ _id: id }, { $set: updateUser });

    //redirect to all users page or blocked users page
    if (page === "blockedUsers") {
      return res.status(200).redirect("/admin/blockedUsers");
    }
    return res.status(200).redirect("/admin/allUsers");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allUsers";
    next(err);
  }
};

//add new user page
const addNewUserPage = (req, res) => {
  //render add new user page
  res.status(200).render("adminPages/userManagement/addNewUser", {
    activeSidebar: { main: "userManagement", sub: "addNewUser" },
  });
};

// add new user request
const addNewUserRequest = async (req, res, next) => {
  try {
    const {
      userName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      blockStatus,
    } = req.body;

    const userExist = await userModels.findOne({ email });
    if (userExist) {
      return res
        .status(409)
        .json({ success: false, message: "Email Already Taken" });
    }

    if (password !== confirmPassword) {
      return res.status(409).json({
        success: false,
        message: "Password and Confirm Password do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isBlock = blockStatus === "true" ? true : false;

    //add wellcome coupon
    const wellcomeCoupon = await couponModels.findOne(
      {
        couponCode: "WELLCOME5",
      },
      {
        _id: 1,
      }
    );

    const newUser = new userModels({
      userName: userName.trim(),
      email: email.trim(),
      password: hashedPassword,
      userCoupons: {
        couponId: wellcomeCoupon._id,
      },
      phoneNumber: phoneNumber.trim(),
      isBlock,
      createdBy: "Admin",
    });
    if (isBlock) user.blockedAt = Date.now();
    await newUser.save();

    //create cart for user
    const user = await userModels.findOne({ email });
    const newCart = new cartModels({
      userId: user._id,
      items: [],
    });
    await newCart.save();

    //create wishlist for user
    const newWishlist = new wishlistModels({
      userId: user._id,
      items: [],
    });
    await newWishlist.save();

    //create wallet for user
    const newWallet = new walletModels({
      userId: user._id,
      transactions: [],
    });
    await newWallet.save();

    return res
      .status(200)
      .json({ success: true, redirectUrl: "/admin/allUsers" });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/addNewUser";
    next(err);
  }
};

//blocked users page
const blockedUsersPage = async (req, res, next) => {
  try {
    //find user by block status and delete status
    const users = await userModels.find({
      isBlock: true,
      isDeleted: false,
      role: "User",
    });

    //render blocked users page
    res.status(200).render("adminPages/userManagement/blockedUser", {
      users,
      activeSidebar: { main: "userManagement", sub: "blockedUsers" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allUsers";
    next(err);
  }
};

// unblock User Request
const unblockUserRequest = async (req, res, next) => {
  try {
    //take id from query and check if user exist
    const id = req.params.id;
    const user = await userModels.findById(id);

    //check if user exist
    if (!user) {
      return res.status(404).redirect("/admin/blockedUsers");
    }

    //update user block status to false
    const updateUser = {};
    updateUser.isBlock = false;
    updateUser.blockedAt = null;
    updateUser.updatedAt = Date.now();
    updateUser.updatedBy = "Admin";
    await userModels.updateOne({ _id: id }, { $set: updateUser });

    //redirect to blocked users page
    return res.status(200).redirect("/admin/blockedUsers");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/blockedUsers";
    next(err);
  }
};

//deleted users page
const deletedUsersPage = async (req, res, next) => {
  try {
    //take deleted users from database and render deleted users page
    const users = await userModels.find({ isDeleted: true, role: "User" });
    res.status(200).render("adminPages/userManagement/deletedUser", {
      users,
      activeSidebar: { main: "userManagement", sub: "deletedUsers" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allUsers";
    next(err);
  }
};

// restore User Request
const restoreUserRequest = async (req, res, next) => {
  try {
    //take id from query and check if user exist
    const id = req.params.id;
    const user = await userModels.findById(id);

    //check if user exist
    if (!user) {
      return res.status(404).redirect("/admin/deletedUsers");
    }

    //update user isDeleted status to false
    const updateUser = {};
    updateUser.isDeleted = false;
    updateUser.deletedAt = null;
    updateUser.deletedBy = null;
    updateUser.updatedAt = Date.now();
    updateUser.updatedBy = "Admin";
    await userModels.updateOne({ _id: id }, { $set: updateUser });

    //redirect to delete users page
    return res.status(200).redirect("/admin/deletedUsers");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/deletedUsers";
    next(err);
  }
};

// delete User Request
const deleteUserRequest = async (req, res, next) => {
  try {
    //take id from query and check if user exist
    const id = req.params.id;
    const user = await userModels.findById(id);

    //check user is exist
    if (!user) {
      return res.status(404).redirect("/admin/deletedUsers");
    }

    //delete user from database
    await userModels.deleteOne({ _id: id });
    await cartModels.deleteOne({ userId: id });

    //redirect to delete users page
    return res.status(200).redirect("/admin/deletedUsers");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/deletedUsers";
    next(err);
  }
};

module.exports = {
  allUsersPage,
  blockedUsersPage,
  deletedUsersPage,
  addNewUserPage,
  addNewUserRequest,
  editUserPage,
  editUserRequest,
  softDeleteUserRequest,
  unblockUserRequest,
  deleteUserRequest,
  restoreUserRequest,
};
