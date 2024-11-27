const userModels = require("../models/userModels");
const { otpGenerator } = require("../utils/otpGenerator");
const bcrypt = require("bcrypt");
const saltRound = 10;

//signupPage
const signupPage = (req, res) => {
  //message session
  const message = req.session.message ?? "Enter Your Details";
  delete req.session.message;

  //redirect to signup page
  res.render("userPages/signup/signUp", { message });
};

//otpRequest
const otpRequest = async (req, res) => {
  try {
    const { email } = req.body;

    //check already exist
    const userExist = await userModels.findOne({ email });
    if (userExist) {
      req.session.message = "Email Is Already Exist";
      return res.redirect("/signUp");
    }

    // calling otpGenerator function
    const otp = await otpGenerator(email);

    //add session's
    req.session.otp = otp;
    req.session.otpTime = new Date().getTime();
    req.session.signup = req.body;

    //redirect to otp page
    res.redirect("/otp");
  } catch (err) {
    req.session.message = "Something Went Wrong! Please Try Again";
    return res.redirect("/signUp");
  }
};

//resendOtp for resend and forgot password
const resendOtpRequest = async (req, res) => {
  try {
    const email = req.session?.signup?.email || req.session.forgotEmail;

    // calling otpGenerator function
    const otp = await otpGenerator(email);

    //add session's
    req.session.otp = otp;
    req.session.otpTime = new Date().getTime();

    //redirect to otp page if user is signing up
    if (req.session.signup) {
      return res.redirect("/otp");
    }

    //redirect to forgot password page  if user is forgot password
    return res.redirect("/login/forgotPasswordOtpPage");
  } catch (err) {
    console.log(err);
  }
};

// otpPage
const otpPage = (req, res) => {
  //check user is not enter deatils
  if (!req.session.signup) return res.redirect("/signUp");

  //check user already enter otp
  if (req.session.isOtp) return res.redirect("/password");

  //message session
  const message = req.session.message ?? "Please Check SMS or Email";
  delete req.session.message;

  //redirect to otp page
  res.render("userPages/signup/otpPage", { message });
};

//passwordRequest
const passwordRequest = async (req, res) => {
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
      return res.redirect("/otp");
    }

    //set otp is checked
    req.session.isOtp = true;

    //redirect to password page
    res.redirect("/password");
  } catch (err) {
    req.session.message = "Something Went Wrong! Please Try Again";
    return res.redirect("/otp");
  }
};

//passwordPage
const passwordPage = (req, res) => {
  //check user is not OTP
  if (!req.session.isOtp) return res.redirect("/otp");

  const message = req.session.message ?? "Please Enter New Password";
  delete req.session.message;
  //render password page
  res.render("userPages/signup/passwordPage", { message });
};

//signupRequest
const signupRequest = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    //check if password and confirm password is same
    if (password !== confirmPassword) {
      req.session.message = "Password and Confirm Password is not same";
      return res.redirect("/passwordPage");
    }

    const { userName, email, phoneNumber } = req.session.signup;

    //use bcrypt to hash password
    const hashedPassword = await bcrypt.hash(password, saltRound);

    //create new user document
    const newUser = new userModels({
      userName,
      email,
      phoneNumber,
      password: hashedPassword,
      createdBy: {
        name: userName,
      },
    });
    await newUser.save();

    //delete session
    delete req.session.isOtp;
    delete req.session.signup;

    //redirect login
    return res.redirect("/login");
  } catch (err) {
    req.session.message = "Something went wrong! Please try again";
    return res.redirect("/passwordPage");
  }
};

//loginPage
const loginPage = (req, res) => {
  const message = req.session.message ?? "Enter Your Credentials";
  delete req.session.message;
  res.render("userPages/login/login", { message });
};

//loginRequest
const loginRequest = async (req, res) => {
  try {
    const { email, password } = req.body;

    //check user is exist
    const user = await userModels.findOne({ email });

    //if user is not exist
    if (!user) {
      req.session.message = "invaild email or password";
      return res.redirect("/login");
    }

    //if user don't have password
    if (!user.password) {
      req.session.message = "invaild email or password";
      return res.redirect("/login");
    }

    //check password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.message = "invaild email or password";
      return res.redirect("/login");
    }

    //redirect to home
    res.redirect("/home");
  } catch (err) {
    req.session.message = "Something went wrong! Please try again";
    return res.redirect("/login");
  }
};

//login with social media
const loginWithSocialMedia = async (req, res) => {
  try {
    //check email is available
    const email = req.user?.emails?.[0]?.value;
    if (!email) {
      req.session.message = "Something Went Wrong Try Another Option";
      return res.redirect("/login");
    }

    //check user is exist
    const user = await userModels.findOne({ email });
    if (user) {
      return res.redirect("/home");
    }

    //create new user document
    const newUser = new userModels({
      userName: req.user?.displayName ?? req.user?.username ?? "",
      email,
      createdBy: {
        name: req.user?.displayName ?? req.user?.username ?? "",
      },
    });
    await newUser.save();

    //redirect to home
    return res.redirect("/home");
  } catch (err) {
    req.session.message = "Something Went Wrong! Please try again";
    return res.redirect("/login");
  }
};

//forgot password email page
const forgotPasswordEmailPage = (req, res) => {
  const message = req.session.message ?? "Please Enter Your Email";
  delete req.session.message;
  res.render("userPages/login/forgotPasswordEmailPage", { message });
};

//forgot password OTP Request
const forgotPasswordOtpRequest = async (req, res) => {
  try {
    const email = req.body.email;

    //check user is exist
    const user = await userModels.findOne({ email });
    if (!user) {
      req.session.message = "Email Not Found";
      return res.redirect("/login/forgotPasswordEmail");
    }

    // calling otpGenerator function
    const otp = await otpGenerator(email);

    //add session's
    req.session.otp = otp;
    req.session.otpTime = new Date().getTime();
    req.session.forgotEmail = user.email;

    //redirect to forgot password OTP page
    res.redirect("/login/forgotPasswordOtp");
  } catch (err) {
    req.session.message = "Something Went wrong, Please Try Again";
    res.redirect("/login/forgotPasswordEmail");
  }
};

//forgot password OTP page
const forgotPasswordOtpPage = (req, res) => {
  //check if user is not enter email
  if (!req.session.forgotEmail) {
    return res.redirect("/login/forgotPasswordEmail");
  }

  //check if user is already enter OTP
  if (req.session.isForgotOtp) return res.redirect("/login/forgotPassword");

  const message = req.session.message ?? "Please Check Your Email or SMS";
  delete req.session.message;
  res.render("userPages/login/forgotPasswordOtpPage", { message });
};

//forget password request
const forgotPasswordRequest = async (req, res) => {
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
      return res.redirect("/login/forgotPasswordOtp");
    }

    //set otp is checked
    req.session.isForgotOtp = true;

    //redirect to forgotpassword page
    res.redirect("/login/forgotPassword");
  } catch (err) {
    req.session.message = "Something Went wrong, Please Try Again";
    res.redirect("/login/forgotPasswordEmail");
  }
};

//forgot Password page
const forgotPasswordPage = (req, res) => {
  //check if user is not enter otp
  if (!req.session.isForgotOtp) return res.redirect("/login/forgotPasswordOtp");

  const message = req.session.message ?? "Please Enter New Password";
  delete req.session.message;
  res.render("userPages/login/forgotPasswordPage", { message });
};

// forgotLogin Request
const forgotLoginRequest = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    //check if password and confirm password are same
    if (password !== confirmPassword) {
      req.session.message = "Password and Confirm Password Should be Same";
      return res.redirect("/login/forgotPassword");
    }

    const user = await userModels.findOne({ email: req.session.forgotEmail });
    const hashedPassword = await bcrypt.hash(password, 10);

    //save new password in database
    user.password = hashedPassword;
    await user.save();

    // Clear session data for security
    delete req.session.forgotEmail;
    delete req.session.isForgotOtp;

    //redirect to login page
    req.session.message = "Password Reset Successfully! Please Login";
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    req.session.message = "Something Went wrong, Please Try Again";
    res.redirect("/login/forgotPasswordEmail");
  }
};

//homePage
const homePage = async (req, res) => {
  try {
    res.render("userPages/home");
  } catch (err) {}
};

module.exports = {
  signupPage,
  otpPage,
  passwordPage,
  loginPage,
  homePage,
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
