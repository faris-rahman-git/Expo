const productModels = require("../models/productModels");
const cartModels = require("../models/cartModels");
const wishlistModels = require("../models/wishlistModels");
const categoryModels = require("../models/categoryModels");
const subCategoryModels = require("../models/subCategoryModels");

const removeCartAndWishlistItems = async (part, id) => {
  try {
    if (part === "category") {
      await cartModels.updateMany(
        { "items.categoryId": id },
        {
          $pull: { items: { categoryId: id } },
          updatedAt: Date.now(),
          updateMessage: false,
        }
      );
      await wishlistModels.updateMany(
        { "items.categoryId": id },
        {
          $pull: { items: { categoryId: id } },
          updatedAt: Date.now(),
          updateMessage: false,
        }
      );
    }
    if (part === "subCategory") {
      await cartModels.updateMany(
        { "items.subCategoryId": id },
        {
          $pull: { items: { subCategoryId: id } },
          updatedAt: Date.now(),
          updateMessage: false,
        }
      );
      await wishlistModels.updateMany(
        { "items.subCategoryId": id },
        {
          $pull: { items: { subCategoryId: id } },
          updatedAt: Date.now(),
          updateMessage: false,
        }
      );
    }
    if (part === "product") {
      await cartModels.updateMany(
        { "items.productId": id },
        {
          $pull: { items: { productId: id } },
          updatedAt: Date.now(),
          updateMessage: false,
        }
      );
      await wishlistModels.updateMany(
        { "items.productId": id },
        {
          $pull: { items: { productId: id } },
          updatedAt: Date.now(),
          updateMessage: false,
        }
      );
    }
    if (part === "variant") {
      await cartModels.updateMany(
        { "items.variantId": id },
        {
          $pull: { items: { variantId: id } },
          updatedAt: Date.now(),
          updateMessage: false,
        }
      );
      await wishlistModels.updateMany(
        { "items.variantId": id },
        {
          $pull: { items: { variantId: id } },
          updatedAt: Date.now(),
          updateMessage: false,
        }
      );
    }
  } catch (err) {
    console.log(err);
  }
};

const checkProductValidity = async (productId, variantId) => {
  try {
    const product = await productModels
      .findOne({
        _id: productId,
        isInactive: false,
        isDeleted: false,
        "variants._id": variantId,
      })
      .populate("categoryId subCategoryId");

    if (product) {
      if (
        product.categoryId.isInactive ||
        product.categoryId.isDeleted ||
        product.subCategoryId.isInactive ||
        product.subCategoryId.isDeleted
      ) {
        return false;
      } else {
        for (let variant of product.variants) {
          if (variant._id.toString() == variantId.toString()) {
            if (!variant.isInactive && !variant.isDeleted) {
              return true; //active
            }
            return false;
          }
        }
      }
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const checkStock = async (productId, variantId, quantity) => {
  try {
    const product = await productModels.findOne({
      _id: productId,
      "variants._id": variantId,
    });

    if (product) {
      for (let variant of product.variants) {
        if (variant._id.toString() == variantId.toString()) {
          if (variant.stock == 0 || quantity < 0) {
            return true;
          }
          if (variant.stock < quantity) {
            return variant.stock;
          }
          return false;
        }
      }
    } else {
      return true;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const updateStockAndSalesCount = async (
  productId,
  variantId,
  quantity,
  type
) => {
  try {
    //update variant stock
    let updateDetails = {};
    let updateDetails2 = {};
    if (type == "add") {
      updateDetails["variants.$.stock"] = quantity;
      updateDetails["variants.$.salesCount"] = -quantity;
      updateDetails.salesCount = -quantity;
      updateDetails2.salesCount = -quantity;
    }
    if (type == "sub") {
      updateDetails["variants.$.stock"] = -quantity;
      updateDetails["variants.$.salesCount"] = quantity;
      updateDetails.salesCount = quantity;
      updateDetails2.salesCount = quantity;
    }
    const product = await productModels.findOneAndUpdate(
      {
        _id: productId,
        "variants._id": variantId,
      },
      {
        $inc: updateDetails,
        updatedAt: Date.now(),
      }
    );

    await categoryModels.findOneAndUpdate(
      { _id: product.categoryId },
      {
        $inc: updateDetails2,
        updatedAt: Date.now(),
      }
    );

    await subCategoryModels.findOneAndUpdate(
      { _id: product.subCategoryId },
      {
        $inc: updateDetails2,
        updatedAt: Date.now(),
      }
    );

    return true;
  } catch (err) {
    return false;
  }
};

module.exports = {
  removeCartAndWishlistItems,
  checkProductValidity,
  checkStock,
  updateStockAndSalesCount,
};
