const express = require("express");
const {
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
} = require("../controllers/adminControllers/userManagement");
const {
  addNewCategoryPage,
  addNewCategoryRequest,
  allCategoryPage,
  editCategoryPage,
  editCategoryRequest,
  softDeleteCategoryRequest,
  addNewSubCategoryPage,
  deletedCategoryPage,
  addNewSubCategoryRequest,
  subCategoryPage,
  softDeleteSubCategoryRequest,
  deletedSubCategoriesPage,
  deletedSubCategoriesRequest,
  restoreSubCategoryRequest,
  editSubCategoryPage,
  editSubCategoryRequest,
  deletedCategoryRequest,
  restoreCategoryRequest,
} = require("../controllers/adminControllers/categoryManagement");
const {
  allProductsPage,
  addNewProductPage,
  addNewProductRequest,
  addNewProductPageGetSubCategories,
  productVariantsPage,
  addNewProductVariantPage,
  addNewProductVariantRequest,
  softDeleteProductVariantRequest,
  editProductVariantPage,
  editProductVariantRequest,
  deletedProductVariantsPage,
  deleteProductVariantsRequest,
  restoreProductVariantRequest,
  softDeleteProductRequest,
  deletedProductsPage,
  restoreProductRequest,
  deleteProductRequest,
  editProductPage,
  removeVariantImage,
  editProductRequest,
} = require("../controllers/adminControllers/productManagement");
const { isNotLoginAdmin } = require("../middlewares/auth");
const {
  allOrdersPage,
  changeOrderStatusRequest,
  orderDetailsPage,
  filterRequest,
} = require("../controllers/adminControllers/orderManagement");
const {
  addNewCouponPage,
  addNewCouponRequest,
  allCouponPage,
  softDeleteCouponRequest,
  DeleteCouponPage,
  restoreCouponRequest,
  deletedCouponRequest,
  editCouponPage,
  editCouponRequest,
} = require("../controllers/adminControllers/couponManagement");
const {
  salesReportPage,
  salesReportFilterRequest,
} = require("../controllers/adminControllers/salesReport");
const {
  dashboardPage,
  dashboardUserFilterRequest,
  dashboardSalesFilterRequest,
} = require("../controllers/adminControllers/dashboard");
const router = express.Router();

//dashboard start
//dashboard Page
router.get("/dashboard", isNotLoginAdmin, dashboardPage);

//dashboard userFilterRequest
router.post(
  "/dashboard/userFilter/:filter",
  isNotLoginAdmin,
  dashboardUserFilterRequest
);

//dashboardSalesFilterRequest
router.post(
  "/dashboard/salesFilter/:filter",
  isNotLoginAdmin,
  dashboardSalesFilterRequest
);
//dashboard end

//salesReport routers Start
//salesReport
router.get("/salesReport", isNotLoginAdmin, salesReportPage);

//salesReportFilterRequest
router.post(
  "/salesReport/salesReportFilter",
  isNotLoginAdmin,
  salesReportFilterRequest
);
//salesReport routers End

//user management routers start
//all users page
router.get("/allUsers", isNotLoginAdmin, allUsersPage);

//edit user page
router.get("/editUser/:id", isNotLoginAdmin, editUserPage);

//edit user request
router.put("/editUser/:id", isNotLoginAdmin, editUserRequest);

//soft Delete User request
router.patch("/softDeleteUser/:id", isNotLoginAdmin, softDeleteUserRequest);

//add new user page
router.get("/addNewUser", isNotLoginAdmin, addNewUserPage);

//add new user request
router.post("/addNewUser", isNotLoginAdmin, addNewUserRequest);

//all blocked users page
router.get("/blockedUsers", isNotLoginAdmin, blockedUsersPage);

//unblock User request
router.patch("/unblockUser/:id", isNotLoginAdmin, unblockUserRequest);

//all deleted users page
router.get("/deletedUsers", isNotLoginAdmin, deletedUsersPage);

//restore User request
router.patch("/restoreUser/:id", isNotLoginAdmin, restoreUserRequest);

//delete User request
router.delete("/deleteUser/:id", isNotLoginAdmin, deleteUserRequest);
//user management routers end

//Category management routers start
//category start
router.get("/allCategory", isNotLoginAdmin, allCategoryPage);

// add New Category Page
router.get("/addNewCategory", isNotLoginAdmin, addNewCategoryPage);

// add New Category Request
router.post("/addNewCategory", isNotLoginAdmin, addNewCategoryRequest);

// edit Category Page
router.get("/editCategory/:id", isNotLoginAdmin, editCategoryPage);

// edit Category Request
router.put("/editCategory/:id", isNotLoginAdmin, editCategoryRequest);

// soft Delete Category Request
router.patch(
  "/softDeleteCategory/:id",
  isNotLoginAdmin,
  softDeleteCategoryRequest
);

// deleted Category Page
router.get("/deletedCategory", isNotLoginAdmin, deletedCategoryPage);

// restore Category Request
router.patch("/restoreCategory/:id", isNotLoginAdmin, restoreCategoryRequest);

// delete Category Request
router.delete("/deletedCategory/:id", isNotLoginAdmin, deletedCategoryRequest);
//category end

//subcategory start
// subCategory Page
router.get("/subCategory/:id", isNotLoginAdmin, subCategoryPage);

// add New SubCategory Page
router.get("/addNewSubCategory/:id", isNotLoginAdmin, addNewSubCategoryPage);

// add New SubCategory Request
router.post(
  "/addNewSubCategory/:id",
  isNotLoginAdmin,
  addNewSubCategoryRequest
);

// edit SubCategory Page
router.get(
  "/editSubCategory/:categoryId/:subCategoryId",
  isNotLoginAdmin,
  editSubCategoryPage
);

// edit SubCategory Request
router.put(
  "/editSubCategory/:categoryId/:subCategoryId",
  isNotLoginAdmin,
  editSubCategoryRequest
);

// softDelete SubCategory Request
router.patch(
  "/softDeleteSubCategory/:categoryId/:subCategoryId",
  isNotLoginAdmin,
  softDeleteSubCategoryRequest
);

// deleted SubCategories Page
router.get(
  "/deletedSubCategories/:id",
  isNotLoginAdmin,
  deletedSubCategoriesPage
);

// delete SubCategory Request
router.delete(
  "/deletedSubCategories/:categoryId/:subCategoryId",
  isNotLoginAdmin,
  deletedSubCategoriesRequest
);

// restore SubCategory Request
router.patch(
  "/restoreSubCategory/:categoryId/:subCategoryId",
  isNotLoginAdmin,
  restoreSubCategoryRequest
);
//subcategory end
//Category management routers end

//product management routers start
//product start
//all product page
router.get("/allProducts", isNotLoginAdmin, allProductsPage);

//add new product page
router.get("/addNewProduct", isNotLoginAdmin, addNewProductPage);

//add New Product Page Get SubCategories
router.get(
  "/subcategories",
  isNotLoginAdmin,
  addNewProductPageGetSubCategories
);

//add new product request
router.post("/addNewProduct", isNotLoginAdmin, addNewProductRequest);

// editProduct page
router.get("/editProduct/:id", isNotLoginAdmin, editProductPage);

// editProduct request
router.put("/editProduct/:id", isNotLoginAdmin, editProductRequest);

//soft Delete Product request
router.patch(
  "/softDeleteProduct/:id",
  isNotLoginAdmin,
  softDeleteProductRequest
);

//deleted Products page
router.get("/deletedProducts", isNotLoginAdmin, deletedProductsPage);

//restore Product request
router.patch("/restoreProduct/:id", isNotLoginAdmin, restoreProductRequest);

//permenertly delete Product Request
router.delete("/deleteProduct/:id", isNotLoginAdmin, deleteProductRequest);
//product end

//variants start
//product Variants page
router.get("/productVariants/:id", isNotLoginAdmin, productVariantsPage);

//add New Product Variant Page
router.get(
  "/addNewProductVariant/:id",
  isNotLoginAdmin,
  addNewProductVariantPage
);

//add New Product Variant request
router.post(
  "/addNewProductVariant/:productId",
  isNotLoginAdmin,
  addNewProductVariantRequest
);

//soft Delete Product Variant request
router.patch(
  "/softDeleteProductVariant/:productId/:variantId",
  isNotLoginAdmin,
  softDeleteProductVariantRequest
);

//edit Product Variant page
router.get(
  "/editProductVariant/:productId/:variantId",
  isNotLoginAdmin,
  editProductVariantPage
);

//remove image
router.patch("/removeImage/:imageIndex", isNotLoginAdmin, removeVariantImage);

//edit Product Variant request
router.put(
  "/editProductVariant/:productId/:variantId",
  isNotLoginAdmin,
  editProductVariantRequest
);

// deleted Product Variants Page
router.get(
  "/deletedProductVariants/:id",
  isNotLoginAdmin,
  deletedProductVariantsPage
);

// restore Product Variant Request
router.patch(
  "/restoreProductVariant/:productId/:variantId",
  isNotLoginAdmin,
  restoreProductVariantRequest
);

//delete Product Variants Request
router.delete(
  "/deleteProductVariant/:productId/:variantId",
  isNotLoginAdmin,
  deleteProductVariantsRequest
);
//variants end
//product management routers end

//coupon Managment Start
//allCoupon
router.get("/allCoupon", isNotLoginAdmin, allCouponPage);

//addNewCouponPage
router.get("/addNewCoupon", isNotLoginAdmin, addNewCouponPage);

//addNewCouponRequest
router.post("/addNewCoupon", isNotLoginAdmin, addNewCouponRequest);

//editCouponPage
router.get("/editCoupon/:id", isNotLoginAdmin, editCouponPage);

//editCouponRequest
router.put("/editCoupon/:id", isNotLoginAdmin, editCouponRequest);

//softDeleteCouponRequest
router.patch("/softDeleteCoupon/:id", isNotLoginAdmin, softDeleteCouponRequest);

//DeleteCouponPage
router.get("/deletedCoupon", isNotLoginAdmin, DeleteCouponPage);

//restoreCouponRequest
router.patch("/restoreCoupon/:id", isNotLoginAdmin, restoreCouponRequest);

//deletedCouponRequest
router.delete("/deletedCoupon/:id", isNotLoginAdmin, deletedCouponRequest);

//coupon Managment End

//orderManagement
//allorders
router.get("/allOrders", isNotLoginAdmin, allOrdersPage);

//filterRequest
router.post("/filterRequest", isNotLoginAdmin, filterRequest);

//changeOrderStatusRequest
router.patch(
  "/changeOrderStatus/:id/:orderId",
  isNotLoginAdmin,
  changeOrderStatusRequest
);

//orderDetails
router.get("/orderDetails/:id/:orderId", isNotLoginAdmin, orderDetailsPage);

module.exports = router;
