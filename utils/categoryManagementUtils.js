const { model } = require("mongoose");
const categoryModels = require("../models/categoryModels");
const subCategoryModels = require("../models/subCategoryModels");

// Utility function to update the total stock of a product
const incNoOfSubCategory = async (subCategoryId) => {
  await subCategoryModels.updateOne(
    { _id: subCategoryId },
    { $inc: { noOfProducts: 1 } }
  );
};

const decNoOfSubCategory = async (subCategoryId) => {
  await subCategoryModels.updateOne(
    { _id: subCategoryId },
    { $inc: { noOfProducts: -1 } }
  );
};

const incNoOfCategory = async (categoryId) => {
  await categoryModels.updateOne(
    { _id: categoryId },
    { $inc: { noOfSubCategory: 1 } }
  );
};

const decNoOfCategory = async (categoryId) => {
  await categoryModels.updateOne(
    { _id: categoryId },
    { $inc: { noOfSubCategory: -1 } }
  );
};

module.exports = { incNoOfSubCategory, decNoOfSubCategory , incNoOfCategory , decNoOfCategory };
