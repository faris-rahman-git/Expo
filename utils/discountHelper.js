const productModels = require("../models/productModels");

const updateOffers = async (type, id) => {
  let products = [];

  switch (type) {
    case "variant":
    case "product":
      products = [
        await productModels
          .findById(type === "variant" ? id.productId : id)
          .populate("categoryId subCategoryId"),
      ].filter(Boolean);
      break;
    case "subcategory":
      products = await productModels
        .find({ subCategoryId: id })
        .populate("categoryId subCategoryId");
      break;
    case "category":
      products = await productModels
        .find({ categoryId: id })
        .populate("categoryId subCategoryId");
      break;
    default:
      throw new Error("Invalid type");
  }

  if (!products.length) return;

  const now = new Date();
  const isValidOffer = (item) =>
    item &&
    item.offerStatus &&
    item.offerStartDate <= now &&
    (!item.offerEndDate || item.offerEndDate >= now);

  for (const product of products) {
    let isUpdated = false;

    product.variants.forEach((variant) => {
      let totalDiscount = 0;

      if (type === "variant" && !variant._id.equals(id.variantId)) return;

      if (isValidOffer(variant)) {
        totalDiscount = variant.offerPercentage;
      } else if (isValidOffer(product)) {
        totalDiscount = product.offerPercentage;
      } else if (isValidOffer(product.subCategoryId)) {
        totalDiscount = product.subCategoryId.offerPercentage;
      } else if (isValidOffer(product.categoryId)) {
        totalDiscount = product.categoryId.offerPercentage;
      }

      const finalPrice = Math.round(
        variant.price - (variant.price * totalDiscount) / 100
      );
      const finalDiscountPercentage = Math.floor(totalDiscount);

      if (
        variant.finalPrice !== finalPrice ||
        variant.finalDiscountPercentage !== finalDiscountPercentage
      ) {
        variant.finalPrice = finalPrice;
        variant.finalDiscountPercentage = finalDiscountPercentage;
        isUpdated = true;
      }
    });

    if (isUpdated) await product.save();
  }
};

module.exports = {
  updateOffers,
};
