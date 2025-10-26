const categoryModels = require("../../models/categoryModels");
const subCategoryModels = require("../../models/subCategoryModels");
const productModels = require("../../models/productModels");
const {
  incNoOfCategory,
  decNoOfCategory,
} = require("../../utils/categoryManagementUtils");
const { deleteAllImages } = require("../../utils/productManagementUtils");
const { removeCartAndWishlistItems } = require("../../utils/stockManagement");
const { updateOffers } = require("../../utils/discountHelper");
const StatusCode = require("../../constants/statusCode");
const Category = require("../../constants/admin/category");

// all Category page
const allCategoryPage = async (req, res, next) => {
  try {
    const categories = await categoryModels.find({ isDeleted: false });
    res.status(StatusCode.OK).render("adminPages/categoryManagement/allCategory", {
      categories,
      activeSidebar: { main: "categoryManagement", sub: "allCategory" },
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allUsers";
    next(err);
  }
};

// add New Category page
const addNewCategoryPage = (req, res) => {
  res.status(StatusCode.OK).render("adminPages/categoryManagement/addNewCategory", {
    activeSidebar: { main: "categoryManagement", sub: "addNewCategory" },
  });
};

// add New Category request
const addNewCategoryRequest = async (req, res, next) => {
  try {
    let {
      categoryName,
      status,
      offerStatus,
      offerPercentage,
      expiryDate,
      startDate,
    } = req.body;

    const newCategoryName = categoryName.replace(/\s+/g, "").toLowerCase();
    const categoryExist = await categoryModels.findOne({
      $expr: {
        $eq: [
          {
            $toLower: {
              $replaceAll: {
                input: "$categoryName",
                find: " ",
                replacement: "",
              },
            },
          },
          newCategoryName,
        ],
      },
    });

    if (categoryExist) {
      return res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: Category.CATEGORY_NAME_ALREADY_TAKEN });
    }

    const newCategory = new categoryModels({
      categoryName,
    });

    const isInactive = status === "Active" ? false : true;
    newCategory.isInactive = isInactive;
    if (isInactive) {
      newCategory.inactivedAt = Date.now();
    }

    offerStatus = offerStatus === "Active" ? true : false;
    newCategory.offerStatus = offerStatus;
    if (offerPercentage == "") {
      offerPercentage = 0;
    }
    newCategory.offerPercentage = offerPercentage;
    if (expiryDate == "") {
      newCategory.offerEndDate = null;
    } else {
      newCategory.offerEndDate = new Date(expiryDate);
    }
    if (startDate == "") {
      newCategory.offerStartDate = Date.now();
    } else {
      newCategory.offerStartDate = new Date(startDate);
    }
    await newCategory.save();
    res.status(StatusCode.OK).json({ success: true, redirectUrl: "/admin/allCategory" });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allCategory";
    next(err);
  }
};

// edit Category Page
const editCategoryPage = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await categoryModels.findById(categoryId);
    res.status(StatusCode.OK).render("adminPages/categoryManagement/editCategory", {
      category,
      activeSidebar: { main: "categoryManagement" },
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allCategory";
    next(err);
  }
};

// edit Category Request
const editCategoryRequest = async (req, res, next) => {
  const categoryId = req.params.id;
  try {
    let {
      categoryName,
      status,
      offerStatus,
      offerPercentage,
      expiryDate,
      startDate,
    } = req.body;
    const category = await categoryModels.findById(categoryId);

    if (!category)
      return res
        .status(StatusCode.NOT_FOUND)
        .json({ success: false, redirectUrl: "/admin/allCategory" });

    const normalizedcategoryName = categoryName
      .replace(/\s+/g, "")
      .toLowerCase();

    // Check if the category already exist
    const categoryExist = await categoryModels.findOne({
      $expr: {
        $eq: [
          {
            $toLower: {
              $replaceAll: {
                input: "$categoryName",
                find: " ",
                replacement: "",
              },
            },
          },
          normalizedcategoryName,
        ],
      },
    });

    if (categoryExist && categoryExist._id.toString() != categoryId) {
      return res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: Category.CATEGORY_NAME_ALREADY_TAKEN });
    }

    const updateCategory = {};
    if (categoryName !== category.categoryName)
      updateCategory.categoryName = categoryName.trim();

    const isInactive = status === "Active" ? false : true;
    if (isInactive !== category.isInactive) {
      updateCategory.isInactive = isInactive;
      if (isInactive) {
        await removeCartAndWishlistItems("category", categoryId);
        updateCategory.inactivedAt = Date.now();
      } else {
        updateCategory.inactivedAt = null;
      }
    }

    offerStatus = offerStatus === "Active" ? true : false;
    if (offerStatus != category.offerStatus) {
      updateCategory.offerStatus = offerStatus;
    }

    if (offerPercentage == "") {
      offerPercentage = 0;
    }
    if (offerPercentage != category.offerPercentage) {
      updateCategory.offerPercentage = offerPercentage;
    }

    if (new Date(startDate) != category.startDate) {
      if (startDate != "") {
        updateCategory.offerStartDate = new Date(startDate);
      }
    }

    if (new Date(expiryDate) != category.expiryDate) {
      if (expiryDate == "") {
        updateCategory.offerEndDate = null;
      } else {
        updateCategory.offerEndDate = new Date(expiryDate);
      }
    }

    updateCategory.updatedAt = Date.now();
    await categoryModels.findOneAndUpdate(
      { _id: categoryId },
      { $set: updateCategory }
    );

    await updateOffers("category", categoryId);

    return res
      .status(StatusCode.OK)
      .json({ success: true, redirectUrl: "/admin/allCategory" });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/editCategory/" + categoryId;
    next(err);
  }
};

// soft Delete Category Request
const softDeleteCategoryRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const category = await categoryModels.findById(id);
    if (!category) {
      return res.status(StatusCode.NOT_FOUND).redirect("/admin/allCategory");
    }
    //update category details
    const updateCategory = {};
    updateCategory.isDeleted = true;
    updateCategory.deletedAt = Date.now();
    updateCategory.updatedAt = Date.now();
    await categoryModels.findOneAndUpdate(
      { _id: id },
      { $set: updateCategory }
    );

    //remove cart items
    await removeCartAndWishlistItems("category", id);

    return res.status(StatusCode.BAD_REQUEST).redirect(`/admin/allCategory`);
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allCategory";
    next(err);
  }
};

// deleted Category page
const deletedCategoryPage = async (req, res, next) => {
  try {
    const category = await categoryModels.find({ isDeleted: true });
    res.status(StatusCode.OK).render("adminPages/categoryManagement/deletedCategory", {
      category,
      activeSidebar: { main: "categoryManagement", sub: "deletedCategory" },
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allCategory";
    next(err);
  }
};

// restore Category Request
const restoreCategoryRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const category = await categoryModels.findById(id);
    if (!category) {
      return res.status(StatusCode.NOT_FOUND).redirect("/admin/deletedCategory");
    }

    //update category details
    const updateCategory = {};
    updateCategory.isDeleted = false;
    updateCategory.deletedAt = null;
    updateCategory.updatedAt = Date.now();
    await categoryModels.findOneAndUpdate(
      { _id: id },
      { $set: updateCategory }
    );

    res.status(StatusCode.OK).redirect("/admin/deletedCategory");
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/deletedCategory";
    next(err);
  }
};

// delete Category Request
const deletedCategoryRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const category = await categoryModels.findById(id);
    if (!category) {
      return res.status(StatusCode.NOT_FOUND).redirect("/admin/deletedCategory");
    }

    const identity = false;
    const state = await deleteAllImages(id, identity);
    if (state) {
      await productModels.deleteMany({ categoryId: category._id });
      await subCategoryModels.deleteMany({ categoryId: category._id });
      await categoryModels.deleteOne({ _id: category._id });
    }

    return res.status(StatusCode.OK).redirect("/admin/deletedCategory");
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/deletedCategory";
    next(err);
  }
};

// SubCategory page
const subCategoryPage = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const subCategory = await subCategoryModels
      .find({ categoryId, isDeleted: false })
      .populate("categoryId");

    const subcategoriesList = subCategory.filter(
      (sub) => !sub.categoryId.isDeleted && !sub.categoryId.isInactive
    );

    if (subcategoriesList.length === 0 && subCategory.length > 0) {
      return res.status(StatusCode.NOT_FOUND).redirect("/admin/allCategory");
    }

    res.status(StatusCode.OK).render("adminPages/categoryManagement/subCategory", {
      subcategoriesList,
      categoryId,
      activeSidebar: { main: "categoryManagement", sub: "allCategory" },
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/allCategory";
    next(err);
  }
};

// add New SubCategory
const addNewSubCategoryPage = (req, res) => {
  const categoryId = req.params.id;
  const message = req.session.message ?? Category.ENTER_NEW_SUBCATEGORY_DETAILS;
  delete req.session.message;
  res.status(StatusCode.OK).render("adminPages/categoryManagement/addNewSubCategory", {
    message,
    categoryId,
    activeSidebar: { main: "categoryManagement", sub: "allCategory" },
  });
};

// add New SubCategory Request
const addNewSubCategoryRequest = async (req, res, next) => {
  const categoryId = req.params.id;
  try {
    let {
      subCategoryName,
      status,
      offerStatus,
      offerPercentage,
      expiryDate,
      startDate,
    } = req.body;

    const normalizedSubCategoryName = subCategoryName
      .replace(/\s+/g, "")
      .toLowerCase();

    // Check if the subcategory already exists for the given parent category
    const subCategoryExist = await subCategoryModels.findOne({
      $expr: {
        $eq: [
          {
            $toLower: {
              $replaceAll: {
                input: "$subCategoryName",
                find: " ",
                replacement: "",
              },
            },
          },
          normalizedSubCategoryName,
        ],
      },
      categoryId,
    });

    if (subCategoryExist) {
      return res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: Category.SUBCATEGORY_NAME_ALREADY_TAKEN ,
      });
    }

    // Create new subcategory
    const newSubCategory = new subCategoryModels({
      subCategoryName: subCategoryName.trim(),
      categoryId,
    });

    // Handle status for activation/inactivation
    const isInactive = status === "Active" ? false : true;
    newSubCategory.isInactive = isInactive;
    if (isInactive) {
      newSubCategory.inactivedAt = Date.now();
    }

    offerStatus = offerStatus === "Active" ? true : false;
    newSubCategory.offerStatus = offerStatus;
    if (offerPercentage == "") {
      offerPercentage = 0;
    }
    newSubCategory.offerPercentage = offerPercentage;
    if (expiryDate == "") {
      newSubCategory.offerEndDate = null;
    } else {
      newSubCategory.offerEndDate = new Date(expiryDate);
    }
    if (startDate == "") {
      newSubCategory.offerStartDate = Date.now();
    } else {
      newSubCategory.offerStartDate = new Date(startDate);
    }

    // Save the new subcategory
    await newSubCategory.save();

    // Increment the number of subcategories in the parent category
    await incNoOfCategory(categoryId);

    res
      .status(StatusCode.OK)
      .json({ success: true, redirectUrl: "/admin/subCategory/" + categoryId });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/addNewSubCategory/" + categoryId;
    next(err);
  }
};

// edit SubCategory Page
const editSubCategoryPage = async (req, res, next) => {
  const { categoryId, subCategoryId } = req.params;
  try {
    //check if the Subcategory exists
    const subCategory = await subCategoryModels.findById(subCategoryId);
    if (!subCategory) {
      return res.status(StatusCode.BAD_REQUEST).redirect("/admin/subCategory/" + categoryId);
    }

    res.status(StatusCode.OK).render("adminPages/categoryManagement/editSubCategory", {
      categoryId,
      subCategory,
      activeSidebar: { main: "categoryManagement", sub: "allCategory" },
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/subCategory/" + categoryId;
    next(err);
  }
};

// edit SubCategory Request
const editSubCategoryRequest = async (req, res, next) => {
  const { categoryId, subCategoryId } = req.params;
  try {
    let {
      subCategoryName,
      status,
      offerStatus,
      offerPercentage,
      expiryDate,
      startDate,
    } = req.body;
    const subCategory = await subCategoryModels.findById(subCategoryId);
    if (!subCategory) {
      return res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        redirectUrl: "/admin/subCategory/" + categoryId,
      });
    }

    const normalizedSubCategoryName = subCategoryName
      .replace(/\s+/g, "")
      .toLowerCase();

    // Check if the subcategory already exists for the given parent category
    const subCategoryExist = await subCategoryModels.findOne({
      $expr: {
        $eq: [
          {
            $toLower: {
              $replaceAll: {
                input: "$subCategoryName",
                find: " ",
                replacement: "",
              },
            },
          },
          normalizedSubCategoryName,
        ],
      },
      categoryId,
    });

    if (subCategoryExist && subCategoryExist._id.toString() !== subCategoryId) {
      return res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: Category.SUBCATEGORY_NAME_ALREADY_TAKEN,
      });
    }

    //update the subcategory details
    const updateSubCategory = {};
    const isInactive = status === "Active" ? false : true;
    if (subCategoryName.trim())
      updateSubCategory.subCategoryName = subCategoryName.trim();
    if (isInactive !== subCategory.isInactive) {
      updateSubCategory.isInactive = isInactive;
      if (isInactive) {
        await removeCartAndWishlistItems("subCategory", subCategoryId);
        updateSubCategory.inactivedAt = Date.now();
      } else {
        updateSubCategory.inactivedAt = null;
      }
    }

    offerStatus = offerStatus === "Active" ? true : false;
    if (offerStatus != subCategory.offerStatus) {
      updateSubCategory.offerStatus = offerStatus;
    }

    if (offerPercentage == "") {
      offerPercentage = 0;
    }
    if (offerPercentage != subCategory.offerPercentage) {
      updateSubCategory.offerPercentage = offerPercentage;
    }

    if (new Date(startDate) != subCategory.startDate) {
      if (startDate != "") {
        updateSubCategory.offerStartDate = new Date(startDate);
      }
    }

    if (new Date(expiryDate) != subCategory.expiryDate) {
      if (expiryDate == "") {
        updateSubCategory.offerEndDate = null;
      } else {
        updateSubCategory.offerEndDate = new Date(expiryDate);
      }
    }

    updateSubCategory.updatedAt = Date.now();
    await subCategoryModels.findOneAndUpdate(
      { _id: subCategoryId },
      { $set: updateSubCategory }
    );
    await updateOffers("subcategory", subCategoryId);

    res
      .status(StatusCode.OK)
      .json({ success: true, redirectUrl: "/admin/subCategory/" + categoryId });
  } catch (err) {
    req.session.message = Category.SOMETHING_WENT_WRONG;
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl =
      "/admin/editSubCategory/" + categoryId + "/" + subCategoryId;
    next(err);
  }
};

// softDelete SubCategory Request
const softDeleteSubCategoryRequest = async (req, res, next) => {
  const { categoryId, subCategoryId } = req.params;
  try {
    //check subCategory is exist
    const subCategory = await subCategoryModels.findById(subCategoryId);
    if (!subCategory) {
      res.status(StatusCode.BAD_REQUEST).redirect("/admin/subCategory/" + categoryId);
    }
    //update details to database
    const updateSubCategory = {};
    updateSubCategory.isDeleted = true;
    updateSubCategory.deletedAt = Date.now();
    updateSubCategory.updatedAt = Date.now();

    await subCategoryModels.findOneAndUpdate(
      { _id: subCategoryId },
      { $set: updateSubCategory }
    );
    await decNoOfCategory(categoryId);

    //remove cart items
    await removeCartAndWishlistItems("subCategory", subCategoryId);

    //redirect
    res.status(StatusCode.OK).redirect("/admin/subCategory/" + categoryId);
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/subCategory/" + categoryId;
    next(err);
  }
};

//deleted SubCategories Page
const deletedSubCategoriesPage = async (req, res, next) => {
  const categoryId = req.params.id;
  try {
    const subcategories = await subCategoryModels.find({
      categoryId,
      isDeleted: true,
    });

    res.render("adminPages/categoryManagement/deletedSubCategory", {
      subcategories,
      categoryId,
      activeSidebar: { main: "categoryManagement", sub: "allCategory" },
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/subCategory/" + categoryId;
    next(err);
  }
};

// delete SubCategory Request
const deletedSubCategoriesRequest = async (req, res, next) => {
  const { categoryId, subCategoryId } = req.params;
  try {
    const subCategory = await subCategoryModels.findById(subCategoryId);
    if (!subCategory) {
      res.status(StatusCode.BAD_REQUEST).redirect("/admin/deletedSubCategories/" + categoryId);
    }

    //delete details from database
    const identity = true;
    const state = await deleteAllImages(subCategoryId, identity);
    if (state) {
      await productModels.deleteMany({ subCategoryId });
      await subCategoryModels.deleteOne({ _id: subCategoryId });
    }

    res.status(StatusCode.OK).redirect("/admin/deletedSubCategories/" + categoryId);
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/deletedSubCategories/" + categoryId;
    next(err);
  }
};

// restore SubCategory Request
const restoreSubCategoryRequest = async (req, res, next) => {
  const { categoryId, subCategoryId } = req.params;
  try {
    const subCategory = await subCategoryModels.findById(subCategoryId);
    if (!subCategory) {
      res.status(StatusCode.BAD_REQUEST).redirect("/admin/deletedSubCategories/" + categoryId);
    }

    //update isDeleted to false
    const updateSubCategory = {};
    updateSubCategory.isDeleted = false;
    updateSubCategory.deletedAt = null;
    updateSubCategory.updatedAt = Date.now();
    await subCategoryModels.findOneAndUpdate(
      { _id: subCategoryId },
      { $set: updateSubCategory }
    );

    await incNoOfCategory(categoryId);
    res.status(StatusCode.OK).redirect("/admin/deletedSubCategories/" + categoryId);
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/admin/deletedSubCategories/" + categoryId;
    next(err);
  }
};

module.exports = {
  allCategoryPage,
  addNewCategoryPage,
  addNewCategoryRequest,
  editCategoryPage,
  editCategoryRequest,
  softDeleteCategoryRequest,
  subCategoryPage,
  addNewSubCategoryPage,
  deletedCategoryPage,
  addNewSubCategoryRequest,
  softDeleteSubCategoryRequest,
  deletedSubCategoriesPage,
  deletedSubCategoriesRequest,
  restoreSubCategoryRequest,
  editSubCategoryPage,
  editSubCategoryRequest,
  deletedCategoryRequest,
  restoreCategoryRequest,
};
