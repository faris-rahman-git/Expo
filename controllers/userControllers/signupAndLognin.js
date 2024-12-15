const userModels = require("../../models/userModels");
const { otpGenerator } = require("../../utils/otpGenerator");
const bcrypt = require("bcrypt");
const cartModels = require("../../models/cartModels");
const walletModels = require("../../models/walletModels");
const wishlistModels = require("../../models/wishlistModels");
const couponModels = require("../../models/couponModels");

//signupPage
const signupPage = (req, res) => {
  //redirect to signup page
  res.status(200).render("userPages/signup/signUp");
};

//otpRequest
const otpRequest = async (req, res, next) => {
  try {
    const { email } = req.body;

    //check already exist
    const userExist = await userModels.findOne({ email });
    if (userExist) {
      return res
        .status(409)
        .json({ success: false, message: "Email Is Already Exist" });
    }

    // calling otpGenerator function
    const otp = await otpGenerator(email);

    //add session's
    req.session.otp = otp;
    req.session.otpTime = new Date().getTime();
    req.session.signup = req.body;

    //redirect to otp page
    return res.status(200).json({ success: true, redirectUrl: "/otp" });
  } catch (err) {
    req.session.message = "Something Went Wrong! Please Try Again";
    err.status = 500;
    err.redirectUrl = "/signUp";
    next(err);
  }
};

//resendOtp for resend and forgot password
const resendOtpRequest = async (req, res, next) => {
  try {
    const email = req.session?.signup?.email || req.session.forgotEmail;

    // calling otpGenerator function
    const otp = await otpGenerator(email);

    //add session's
    req.session.otp = otp;
    req.session.otpTime = new Date().getTime();

    //redirect to otp page if user is signing up
    if (req.session.signup) {
      return res.status(200).redirect("/otp");
    }

    //redirect to forgot password page  if user is forgot password
    return res.status(200).redirect("/login/forgotPasswordOtpPage");
  } catch (err) {
    req.session.message = "Something Went Wrong! Please Try Again";
    err.status = 500;

    //if user is signing up
    if (req.session.signup) {
      err.redirectUrl = "/otp";
    } else {
      err.redirectUrl = "/login/forgotPasswordOtpPage";
    }
    next(err);
  }
};

// otpPage
const otpPage = (req, res) => {
  //check user is not enter deatils
  if (!req.session.signup) return res.status(400).redirect("/signUp");

  //check user already enter otp
  if (req.session.isOtp) return res.status(400).redirect("/password");

  //redirect to otp page
  res.status(200).render("userPages/signup/otpPage");
};

//passwordRequest
const passwordRequest = async (req, res, next) => {
  try {
    //check if otp is valid
    const realTime = new Date().getTime();
    if (realTime - req.session.otpTime > 120000) {
      req.session.otp = null;
    }

    const { otp } = req.body;
    const checkOtp = req.session.otp;

    //if otp is incorrect
    if (otp !== checkOtp) {
      return res
        .status(409)
        .json({ success: false, message: "Incorrect OTP Please Try Again" });
    }

    //set otp is checked
    req.session.isOtp = true;

    //redirect to password page
    return res.status(200).json({ success: true, redirectUrl: "/password" });
  } catch (err) {
    req.session.message = "Something Went Wrong! Please Try Again";
    err.status = 500;
    err.redirectUrl = "/otp";
    next(err);
  }
};

//passwordPage
const passwordPage = (req, res) => {
  //check user is not OTP
  if (!req.session.isOtp) return res.status(400).redirect("/otp");

  res.status(200).render("userPages/signup/passwordPage");
};

//signupRequest
const signupRequest = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;

    //check if password and confirm password is same
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password is not same",
      });
    }

    const { userName, email, phoneNumber } = req.session.signup;

    //use bcrypt to hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //add wellcome coupon
    const wellcomeCoupon = await couponModels.findOne(
      {
        couponCode: "WELLCOME5",
      },
      {
        _id: 1,
      }
    );

    //create new user document
    const newUser = new userModels({
      userName,
      email,
      phoneNumber,
      password: hashedPassword,
      userCoupons: {
        couponId: wellcomeCoupon._id,
      },
    });
    await newUser.save();

    //create new cart document
    const user = await userModels.findOne({ email });
    const newCart = new cartModels({
      userId: user._id,
      items: [],
    });
    await newCart.save();

    //create wishlist document
    const newWishlist = new wishlistModels({
      userId: user._id,
      items: [],
    });
    await newWishlist.save();

    //create wallet document
    const newWallet = new walletModels({
      userId: user._id,
      transactions: [],
    });
    await newWallet.save();

    //delete session
    delete req.session.isOtp;
    delete req.session.signup;

    //redirect login
    req.session.message = "Account Created Successfully! Please Login";
    return res.status(400).json({ success: true, redirectUrl: "/login" });
  } catch (err) {
    req.session.message = "Something went wrong! Please try again";
    err.status = 500;
    err.redirectUrl = "/password";
    next(err);
  }
};

//loginPage
const loginPage = (req, res) => {
  const message = req.session.message ?? "Enter Your Credentials";
  req.session.destroy();
  res.status(200).render("userPages/login/login", { message });
};

//loginRequest
const loginRequest = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //check user is exist
    const user = await userModels.findOne({ email });

    //if user is not exist
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "invaild email or password" });
    }

    //if user don't have password
    if (!user.password) {
      return res
        .status(400)
        .json({ success: false, message: "invaild email or password" });
    }

    //check password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "invaild email or password" });
    }

    if (user) {
      if (user.isDeleted === true) {
        return res.status(400).json({
          success: false,
          message: "Your Account is Deleted Please Contact Admin",
        });
      }
      if (user.isBlock === true) {
        return res.status(400).json({
          success: false,
          message: "Your Account is Blocked Please Contact Admin",
        });
      }
    }

    //redirect to home
    req.session.user = user;
    if (user.role === "Admin") {
      return res
        .status(200)
        .json({ success: true, redirectUrl: "/admin/dashboard" });
    }

    await userModels.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: Date.now(),
        },
      }
    );
    return res.status(200).json({ success: true, redirectUrl: "/home" });
  } catch (err) {
    req.session.message = "Something went wrong! Please try again";
    err.status = 500;
    err.redirectUrl = "/login";
    next(err);
  }
};

//login with social media
const loginWithSocialMedia = async (req, res, next) => {
  try {
    //check email is available
    const email = req.user?.emails?.[0]?.value;
    if (!email) {
      req.session.message = "Something Went Wrong Try Another Option";
      return res.status(400).redirect("/login");
    }

    //check user is exist
    let user = await userModels.findOne({ email });

    if (user) {
      if (user.isDeleted === true) {
        req.session.message = "Your Account is Deleted Please Contact Admin";
        return res.status(400).redirect("/login");
      }
      if (user.isBlock === true) {
        req.session.message = "Your Account is Blocked Please Contact Admin";
        return res.status(400).redirect("/login");
      }
      req.session.user = user;
      if (user.role === "Admin") {
        return res.status(200).redirect("/admin/dashboard");
      }
      await userModels.updateOne(
        { _id: user._id },
        {
          $set: {
            lastLogin: Date.now(),
          },
        }
      );
      return res.status(200).redirect("/home");
    }

    //add wellcome coupon
    const wellcomeCoupon = await couponModels.findOne(
      {
        couponCode: "WELLCOME5",
      },
      {
        _id: 1,
      }
    );

    //create new user document
    const newUser = new userModels({
      userName: req.user?.displayName ?? req.user?.username ?? "",
      email,
      userCoupons: {
        couponId: wellcomeCoupon._id,
      },
      lastLogin: Date.now(),
    });
    await newUser.save();

    user = await userModels.findOne({ email });

    const newCart = new cartModels({
      userId: user._id,
      items: [],
    });
    await newCart.save();

    req.session.user = user;

    //redirect to home
    return res.status(200).redirect("/home");
  } catch (err) {
    req.session.message = "Something Went Wrong! Please try again";
    err.status = 500;
    err.redirectUrl = "/login";
    next(err);
  }
};

//forgot password email page
const forgotPasswordEmailPage = (req, res) => {
  const message = req.session.message ?? "Please Enter Your Email";
  delete req.session.message;
  res
    .status(200)
    .render("userPages/login/forgotPasswordEmailPage", { message });
};

//forgot password OTP Request
const forgotPasswordOtpRequest = async (req, res, next) => {
  try {
    const email = req.body.email;

    //check user is exist
    const user = await userModels.findOne({ email });
    if (!user) {
      req.session.message = "Email Not Found";
      return res.status(400).redirect("/login/forgotPasswordEmail");
    }

    // calling otpGenerator function
    const otp = await otpGenerator(email);

    //add session's
    req.session.otp = otp;
    req.session.otpTime = new Date().getTime();
    req.session.forgotEmail = user.email;

    //redirect to forgot password OTP page
    res.status(200).redirect("/login/forgotPasswordOtp");
  } catch (err) {
    req.session.message = "Something Went wrong, Please Try Again";
    err.status = 500;
    err.redirectUrl = "/login/forgotPasswordEmail";
    next(err);
  }
};

//forgot password OTP page
const forgotPasswordOtpPage = (req, res) => {
  //check if user is not enter email
  if (!req.session.forgotEmail) {
    return res.status(400).redirect("/login/forgotPasswordEmail");
  }

  //check if user is already enter OTP
  if (req.session.isForgotOtp)
    return res.status(400).redirect("/login/forgotPassword");

  const message = req.session.message ?? "Please Check Your Email or SMS";
  delete req.session.message;
  res.status(200).render("userPages/login/forgotPasswordOtpPage", { message });
};

//forget password request
const forgotPasswordRequest = async (req, res, next) => {
  try {
    //check if otp is valid
    const realTime = new Date().getTime();
    if (realTime - req.session.otpTime > 120000) {
      req.session.otp = null;
    }

    const { otp } = req.body;
    const checkOtp = req.session.otp;

    //delete unwanted session
    delete req.session.otp;
    delete req.session.otpTime;

    //if otp is incorrect
    if (otp !== checkOtp) {
      req.session.message = "Incorrect OTP Please Try Again";
      return res.status(400).redirect("/login/forgotPasswordOtp");
    }

    //set otp is checked
    req.session.isForgotOtp = true;

    //redirect to forgotpassword page
    res.status(200).redirect("/login/forgotPassword");
  } catch (err) {
    req.session.message = "Something Went wrong, Please Try Again";
    err.status = 500;
    err.redirectUrl = "/login/forgotPasswordEmail";
    next(err);
  }
};

//forgot Password page
const forgotPasswordPage = (req, res) => {
  //check if user is not enter otp
  if (!req.session.isForgotOtp)
    return res.status(400).redirect("/login/forgotPasswordOtp");

  const message = req.session.message ?? "Please Enter New Password";
  delete req.session.message;
  res.status(200).render("userPages/login/forgotPasswordPage", { message });
};

// forgotLogin Request
const forgotLoginRequest = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;

    //check if password and confirm password are same
    if (password !== confirmPassword) {
      req.session.message = "Password and Confirm Password Should be Same";
      return res.status(400).redirect("/login/forgotPassword");
    }

    const user = await userModels.findOne({ email: req.session.forgotEmail });
    if (!user) {
      req.session.message = "Something Went Wrong! Email Not Found";
      return res.status(400).redirect("/login/forgotPasswordEmail");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    //save new password in database
    await userModels.updateOne(
      { email: req.session.forgotEmail },
      { $set: { password: hashedPassword } }
    );

    // Clear session data for security
    delete req.session.forgotEmail;
    delete req.session.isForgotOtp;
    delete req.session.fromChangePass;

    //redirect to login page
    req.session.message = "Password Reset Successfully! Please Login";
    res.status(200).redirect("/login");
  } catch (err) {
    req.session.message = "Something Went wrong, Please Try Again";
    err.status = 500;
    err.redirectUrl = "/login/forgotPasswordEmail";
    next(err);
  }
};

module.exports = {
  signupPage,
  otpPage,
  passwordPage,
  loginPage,
  otpRequest,
  passwordRequest,
  signupRequest,
  resendOtpRequest,
  loginRequest,
  loginWithSocialMedia,
  forgotPasswordEmailPage,
  forgotPasswordOtpRequest,
  forgotPasswordOtpPage,
  forgotPasswordRequest,
  forgotPasswordPage,
  forgotLoginRequest,
};
