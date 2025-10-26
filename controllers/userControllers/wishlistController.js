const StatusCode = require("../../constants/statusCode");
const cartModels = require("../../models/cartModels");
const wishlistModels = require("../../models/wishlistModels");
const { checkProductValidity } = require("../../utils/stockManagement");
const { wishlistCount } = require("../../utils/wishlistCount");

//wishlistPage
const wishlistPage = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;
    const wishlist = await wishlistModels
      .findOne({ userId })
      .populate("items.productId");

    let message = wishlist?.updateMessage ?? null;
    if (message == false) {
      await wishlistModels.findOneAndUpdate(
        { userId },
        { $set: { updateMessage: null }, updatedAt: Date.now() }
      );
    }

    let wishlistItems = [];

    //get wishlist items
    for (let item of wishlist.items) {
      for (let variant of item.productId.variants) {
        if (variant._id.toString() == item.variantId.toString()) {
          const eachitems = {};
          eachitems._id = item._id;
          eachitems.categoryId = item.productId.categoryId;
          eachitems.subCategoryId = item.productId.subCategoryId;
          eachitems.productId = item.productId._id;
          eachitems.variantId = variant._id;
          eachitems.productName = item.productId.productName;
          eachitems.variantName = variant.variantName;
          eachitems.variantDescription = variant.variantDescription;
          eachitems.stock = variant.stock;
          eachitems.color = variant.color;
          eachitems.price = variant.price;
          eachitems.finalDiscountPercentage = variant.finalDiscountPercentage;
          eachitems.finalPrice = variant.finalPrice;
          eachitems.images = variant.images;
          wishlistItems.push(eachitems);
        }
      }
    }

    res.status(StatusCode.OK).render("userPages/pages/myAccount/wishlist", {
      wishlistItems,
      message,
    });
  } catch (err) {
    err.status = StatusCode.INTERNAL_SERVER_ERROR;
    err.redirectUrl = "/login";
    next(err);
  }
};

// addToWishlistRequest
const addToWishlistRequest = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { cartTrue, categoryId, subCategoryId } = req.body;
    const userId = req.session?.user?._id;

    const result = await checkProductValidity(productId, variantId);
    if (!result) {
      const url = "/home";
      return res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: true, redirectUrl: url });
    }

    //check variant is already in wishlist
    const wishlist = await wishlistModels.findOne({ userId });

    const item = wishlist.items.find(
      (item) => item.variantId.toString() === variantId
    );
    if (item) {
      return res.status(StatusCode.BAD_REQUEST).json({ success: false });
    }

    //add to wishlist a variant
    const newItem = {};
    newItem.categoryId = categoryId;
    newItem.subCategoryId = subCategoryId;
    newItem.productId = productId;
    newItem.variantId = variantId;
    await wishlistModels.findOneAndUpdate(
      { userId },
      { $push: { items: newItem }, updatedAt: Date.now() }
    );

    const count = await wishlistCount(userId);
    if (cartTrue == true) {
      await cartModels.findOneAndUpdate(
        { userId, "items.variantId": variantId },
        { $pull: { items: { variantId } }, updatedAt: Date.now() }
      );
      return res
        .status(StatusCode.OK)
        .json({ success: true, count, redirectUrl: "/cart" });
    }

    res.status(StatusCode.OK).json({ success: true, count });
  } catch (err) {
    console.log(err);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};

// cartRemoveItemRequest
const wishlistRemoveItemRequest = async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    const itemId = req.params.itemId;

    await wishlistModels.findOneAndUpdate(
      { userId, "items._id": itemId },
      { $pull: { items: { _id: itemId } }, updatedAt: Date.now() }
    );

    res.status(StatusCode.OK).json({ success: true, redirectUrl: "/wishlist" });
  } catch (err) {
    console.log(err);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error" });
  }
};

// wishlistRemoveAllItemRequest
const wishlistRemoveAllItemRequest = async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    await wishlistModels.findOneAndUpdate({ userId }, { $set: { items: [] } });
    res.status(StatusCode.OK).json({ success: true, redirectUrl: "/wishlist" });
  } catch (err) {
    console.log(err);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};

// moveAllItemsToWishlistRequest
const moveAllItemsToCartRequest = async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    const cart = await cartModels.findOne({ userId });
    const wishlist = await wishlistModels
      .findOne({ userId }, { items: 1 })
      .populate("items.productId");

    for (let item of wishlist.items) {
      let flag = 0;
      for (let variant of item.productId.variants) {
        if (
          variant._id.toString() == item.variantId.toString() &&
          variant.stock <= 0
        ) {
          flag = 1;
          break;
        }
      }
      if (flag == 0) {
        for (let cartItem of cart.items) {
          if (item.variantId.toString() == cartItem.variantId.toString()) {
            flag = 2;
            break;
          }
        }
      }
      if (flag == 0) {
        const newItem = {};
        newItem.productId = item.productId._id;
        newItem.variantId = item.variantId;
        newItem.categoryId = item.categoryId;
        newItem.subCategoryId = item.subCategoryId;
        newItem.quantity = 1;
        await cartModels.findOneAndUpdate(
          { userId },
          { $push: { items: newItem }, updatedAt: Date.now() }
        );
      }
      if (flag == 0 || flag == 2) {
        await wishlistModels.findOneAndUpdate(
          { userId, "items.variantId": item.variantId },
          {
            $pull: { items: { variantId: item.variantId } },
            updatedAt: Date.now(),
          }
        );
      }
    }

    res.status(StatusCode.OK).json({ success: true, redirectUrl: "/wishlist" });
  } catch (err) {
    console.log(err);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};

module.exports = {
  wishlistPage,
  addToWishlistRequest,
  wishlistRemoveItemRequest,
  wishlistRemoveAllItemRequest,
  moveAllItemsToCartRequest,
};
