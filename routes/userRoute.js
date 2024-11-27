const express = require("express");
const {
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
} = require("../controllers/userController");
const passport = require("passport");
const router = express.Router();

//user signup page
router.get("/signUp", signupPage);

//user otp request
router.post("/otp", otpRequest);

//otp page
router.get("/otp", otpPage);

//user passwordRequest request
router.post("/password", passwordRequest);

//password page
router.get("/password", passwordPage);

//user signupRequest request
router.post("/signUp", signupRequest);

//resendOtp
router.post("/resendOtp", resendOtpRequest);

//user login
router.get("/login", loginPage);

//login request
router.post("/login", loginRequest);

//login with google
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

//login with google callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  loginWithSocialMedia
);

//login with github
router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

//login with github callback
router.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  loginWithSocialMedia
);

//login with microsoft
router.get("/auth/microsoft", passport.authenticate("microsoft"));

//login with github microsoft
router.get(
  "/auth/microsoft/callback",
  passport.authenticate("microsoft", { failureRedirect: "/login" }),
  loginWithSocialMedia
);

//login with facebook
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);

//login with facebook callback
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  loginWithSocialMedia
);

//forgot password email page
router.get("/login/forgotPasswordEmail", forgotPasswordEmailPage);

//forgot password otp request
router.post("/login/forgotPasswordOtp", forgotPasswordOtpRequest);

//forgot password OTP page
router.get("/login/forgotPasswordOtp", forgotPasswordOtpPage);

//forgot password request
router.post("/login/forgotPassword", forgotPasswordRequest);

//forgot password page
router.get("/login/forgotPassword", forgotPasswordPage);

//forgot login request
router.post("/login/forgotLogin", forgotLoginRequest);

//home
router.get("/home", homePage);

module.exports = router;
