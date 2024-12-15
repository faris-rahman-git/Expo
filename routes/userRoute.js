const express = require("express");
const {
  homePage,
  productDetailsPage,
  navCount,
  searchPage,
  searchRequest,
  logOutRequest,
} = require("../controllers/userControllers/userController");
const passport = require("passport");
const { isLogin, isNotLoginUser } = require("../middlewares/auth");
const {
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
} = require("../controllers/userControllers/signupAndLognin");
const {
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
} = require("../controllers/userControllers/checkoutController");
const {
  addToCartRequest,
  cartPage,
  cartRemoveItemRequest,
  removeAllItemsRequest,
  updateQtyRequest,
  moveAllItemsToWishlistRequest,
} = require("../controllers/userControllers/cartController");
const {
  accountPage,
  addNewAddressPage,
  editAddressPage,
  OrderDetailsPage,
  editAccountDetailsRequest,
  addNewAddressRequest,
  editAddressRequest,
  removeAddressRequest,
  cancelOrderRequest,
  chnagePasswordPage,
  newPasswordPageRequest,
  returnProductRequest,
  cancelReturnRequest,
  orderInvoicePage,
  dropOrderRequest,
  retryPaymentRequest,
  paymentGatewayRequest,
} = require("../controllers/userControllers/accountController");
const {
  wishlistPage,
  addToWishlistRequest,
  wishlistRemoveItemRequest,
  wishlistRemoveAllItemRequest,
  moveAllItemsToCartRequest,
} = require("../controllers/userControllers/wishlistController");
const {
  walletPage,
} = require("../controllers/userControllers/walletController");
const router = express.Router();

//user signup page
router.get("/signUp", isLogin, signupPage);

//user otp request
router.post("/otp", isLogin, otpRequest);

//resendOtp
router.post("/resendOtp", isLogin, resendOtpRequest);

//otp page
router.get("/otp", isLogin, otpPage);

//user passwordRequest request
router.post("/password", isLogin, passwordRequest);

//password page
router.get("/password", isLogin, passwordPage);

//user signupRequest request
router.post("/signUp", isLogin, signupRequest);

//user login
router.get("/login", isLogin, loginPage);

//login request
router.post("/login", isLogin, loginRequest);

//login with google
router.get(
  "/auth/google",
  isLogin,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

//login with google callback
router.get(
  "/auth/google/callback",
  isLogin,
  passport.authenticate("google", { failureRedirect: "/login" }),
  loginWithSocialMedia
);

//login with github
router.get(
  "/auth/github",
  isLogin,
  passport.authenticate("github", { scope: ["user:email"] })
);

//login with github callback
router.get(
  "/auth/github/callback",
  isLogin,
  passport.authenticate("github", { failureRedirect: "/login" }),
  loginWithSocialMedia
);

//login with microsoft
router.get("/auth/microsoft", isLogin, passport.authenticate("microsoft"));

//login with github microsoft
router.get(
  "/auth/microsoft/callback",
  isLogin,
  passport.authenticate("microsoft", { failureRedirect: "/login" }),
  loginWithSocialMedia
);

//login with facebook
router.get(
  "/auth/facebook",
  isLogin,
  passport.authenticate("facebook", {
    scope: ["email"],
  })
);

//login with facebook callback
router.get(
  "/auth/facebook/callback",
  isLogin,
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

//cartCount
router.get("/navCount", navCount);

//product details page
router.get("/productDetails/:productId/:variantId", productDetailsPage);

//search page
router.get("/search", searchPage);

//search requst
router.post("/search", searchRequest);

//add to cart
router.post(
  "/addToCart/:productId/:variantId",
  isNotLoginUser,
  addToCartRequest
);

//account page
router.get("/myAccount", isNotLoginUser, accountPage);

// edit Account Details Request
router.put(
  "/myAccount/editAccountDetails/:id",
  isNotLoginUser,
  editAccountDetailsRequest
);

//change password page
router.get("/myAccount/changePassword", isNotLoginUser, chnagePasswordPage);

//new password page request
router.post(
  "/myAccount/changePassword",
  isNotLoginUser,
  newPasswordPageRequest
);

//add new address page
router.get("/myAccount/addNewAddress/:id", isNotLoginUser, addNewAddressPage);

//add New Address Request
router.post(
  "/myAccount/addNewAddress/:id",
  isNotLoginUser,
  addNewAddressRequest
);

//edit address page
router.get(
  "/myAccount/editaddress/:userId/:addressId",
  isNotLoginUser,
  editAddressPage
);

//edit address request
router.put(
  "/myAccount/editaddress/:userId/:addressId",
  isNotLoginUser,
  editAddressRequest
);

//remove address request
router.delete(
  "/myAccount/removeAddress/:userId/:addressId",
  isNotLoginUser,
  removeAddressRequest
);

//cancel order request
router.patch("/cancelOrder/:id/:orderId", isNotLoginUser, cancelOrderRequest);

//return product request
router.patch("/returnProduct/:itemId", isNotLoginUser, returnProductRequest);

//cancel return  request
router.patch("/cancelReturn/:itemId", isNotLoginUser, cancelReturnRequest);

//order Invoice Page
router.get("/orderInvoice/:id/:orderId", isNotLoginUser, orderInvoicePage);

//view order details
router.get("/OrderDetails/:id/:orderId", isNotLoginUser, OrderDetailsPage);

// dropOrderRequest
router.patch("/dropOrder/:id", isNotLoginUser, dropOrderRequest);

//retryPaymentRequest
router.patch(
  "/myAccount/retryPayment/:id",
  isNotLoginUser,
  retryPaymentRequest
);

//paymentGatewayRequest
router.post("/myAccount/paymentGateway", isNotLoginUser, paymentGatewayRequest);

//cart page
router.get("/cart", isNotLoginUser, cartPage);

//updateQty
router.put("/cart/updateQty/:itemId/", isNotLoginUser, updateQtyRequest);

//cart removeItem
router.delete(
  "/cart/removeItemToCart/:itemId",
  isNotLoginUser,
  cartRemoveItemRequest
);

//remove all items from cart
router.delete("/cart/removeAllItems", isNotLoginUser, removeAllItemsRequest);

// moveAllItemsToWishlist
router.post(
  "/cart/moveAllItemsToWishlist",
  isNotLoginUser,
  moveAllItemsToWishlistRequest
);

//cart checkOut
router.post("/cart/cartCheckOut", isNotLoginUser, cartCheckoutRequest);

//wishlist
router.get("/wishlist", isNotLoginUser, wishlistPage);

//add to wishlist
router.post(
  "/addToWishlist/:productId/:variantId",
  isNotLoginUser,
  addToWishlistRequest
);

//wishlistRemoveItemRequest
router.delete(
  "/wishlist/removeItemToWishlist/:itemId",
  isNotLoginUser,
  wishlistRemoveItemRequest
);

//wishlistRemoveAllItemRequest
router.delete(
  "/wishlist/removeAllItems",
  isNotLoginUser,
  wishlistRemoveAllItemRequest
);

// moveAllItemsToCart
router.post(
  "/wishlist/moveAllItemsToCart",
  isNotLoginUser,
  moveAllItemsToCartRequest
);

//wallet page
router.get("/wallet", isNotLoginUser, walletPage);

//product checkout
router.post("/productCheckOut/", isNotLoginUser, productCheckoutRequest);

//checkOut page
router.get("/checkOut", isNotLoginUser, checkOutPage);

//change address
router.get("/checkOut/changeAddress", isNotLoginUser, changeAddressPage);

//chenge address request
router.post("/checkOut/changeAddress", isNotLoginUser, changeAddressRequest);

//applyCouponRequest
router.post("/checkOut/applyCoupon", isNotLoginUser, applyCouponRequest);

//removeCouponRequest
router.delete("/checkOut/removeCoupon", isNotLoginUser, removeCouponRequest);

// placeOrder
router.post("/checkOut/placeOrder", isNotLoginUser, placeOrderRequest);

//placeorder payment
router.post("/checkOut/payment", isNotLoginUser, placeOrderPaymentRequest);

//thank you page
router.get("/checkOut/thankYou", isNotLoginUser, thankYouPage);

//sorry page
router.get("/checkOut/sorry", isNotLoginUser, sorryPage);

router.get("/logout", logOutRequest);

module.exports = router;
