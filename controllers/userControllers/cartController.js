const cartModels = require("../../models/cartModels");
const wishlistModels = require("../../models/wishlistModels");
const { cartCount } = require("../../utils/cartCount");
const {
  checkProductValidity,
  checkStock,
} = require("../../utils/stockManagement");

// cartPage
const cartPage = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;
    const cart = await cartModels
      .findOne({ userId })
      .populate("items.productId");

    let message = cart.updateMessage;
    if (message == false) {
      await cartModels.findOneAndUpdate(
        { userId },
        { $set: { updateMessage: null }, updatedAt: Date.now() }
      );
    }
    //get cart items

    let cartItems = [];
    let cartSubtotal = 0;

    for (let item of cart.items) {
      for (let variant of item.productId.variants) {
        if (variant._id.toString() == item.variantId.toString()) {
          const clonedVariant = variant.toObject(); // Convert to a plain JS object
          clonedVariant.productName = item.productId.productName; // Modify the cloned object
          clonedVariant.quantity = item.quantity;
          clonedVariant.cartItemId = item._id;
          clonedVariant.productId = item.productId._id;
          clonedVariant.categoryId = item.categoryId;
          clonedVariant.subCategoryId = item.subCategoryId;
          cartSubtotal += variant.finalPrice * item.quantity;
          if (item.quantity > variant.stock && variant.stock > 0) {
            await cartModels.findOneAndUpdate(
              {
                userId,
                "items.variantId": variant._id,
              },
              {
                $set: { "items.$.quantity": variant.stock },
                updatedAt: Date.now(),
              }
            );
            message = true;
          } else if (variant.stock == 0) {
            await cartModels.findOneAndUpdate(
              {
                userId,
                "items.variantId": variant._id,
              },
              {
                $pull: { items: { variantId: variant._id } },
                updatedAt: Date.now(),
              }
            );
            message = true;
            continue;
          }
          cartItems.push(clonedVariant); // Add the modified object to cartItems
        }
      }
    }

    req.session.cartLength = cart.items.length;

    res.status(200).render("userPages/pages/myAccount/cart", {
      cartItems,
      cartSubtotal,
      message,
    });
  } catch (err) {
    err.status(500);
    err.redirectUrl = req.get("Referer") || "/home";
    next(err);
  }
};

//add To Cart Request
const addToCartRequest = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { quantity, categoryId, subCategoryId, wishlistTrue } = req.body;
    const userId = req.session?.user?._id;

    const result = await checkProductValidity(productId, variantId);
    const checkStockResult = await checkStock(productId, variantId, quantity);
    if (!result || checkStockResult === true) {
      const url = "/home";
      return res
        .status(400)
        .json({ success: false, message: true, redirectUrl: url });
    }

    //check variant is already in cart
    const cart = await cartModels.findOne({ userId }, { items: 1 });
    const item = cart.items.find(
      (item) => item.variantId.toString() === variantId
    );
    if (item) {
      return res.status(400).json({ success: false });
    }

    //add to cart a variant
    const newItem = {};
    newItem.categoryId = categoryId;
    newItem.subCategoryId = subCategoryId;
    newItem.productId = productId;
    newItem.variantId = variantId;
    if (quantity > 3) {
      newItem.quantity = 3;
    } else if (quantity <= 0) {
      newItem.quantity = 1;
    } else {
      newItem.quantity = quantity;
    }

    await cartModels.findOneAndUpdate(
      { userId },
      { $push: { items: newItem }, updatedAt: Date.now() }
    );

    const count = await cartCount(userId);

    if (wishlistTrue == true) {
      await wishlistModels.findOneAndUpdate(
        { userId, "items.variantId": variantId },
        { $pull: { items: { variantId } }, updatedAt: Date.now() }
      );
      return res
        .status(200)
        .json({ success: true, count, redirectUrl: "/wishlist" });
    }

    res.status(200).json({ success: true, count });
  } catch (err) {
    console.log(err);
  }
};

// updateQtyRequest
const updateQtyRequest = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const quantity = req.body.quantity;
    if (quantity <= 3 && quantity >= 1) {
      if (itemId == 1) {
        req.session.quantity = quantity;
      } else {
        const userId = req.session?.user?._id;
        await cartModels.findOneAndUpdate(
          { userId, "items._id": itemId },
          { $set: { "items.$.quantity": quantity }, updatedAt: Date.now() }
        );
      }
    }
    const url = req.get("Referer");

    res.status(200).json({ success: true, redirectUrl: url });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

// cartRemoveItemRequest
const cartRemoveItemRequest = async (req, res) => {
  try {
    const { length } = req.body;
    const userId = req.session?.user?._id;
    const itemId = req.params.itemId;

    if (itemId != 1) {
      await cartModels
        .findOneAndUpdate(
          { userId, "items._id": itemId },
          { $pull: { items: { _id: itemId } }, updatedAt: Date.now() }
        )
        .populate("items.productId");
    }

    let url;
    if (length == 1) {
      if (itemId != 1) {
        url = "/cart";
      } else {
        url =
          "/productDetails/" +
            req.session.productId +
            "/" +
            req.session.variantId || "/home";
      }
      delete req.session.checkout;
      delete req.session.coupon;
      delete req.session.productId;
      delete req.session.variantId;
      delete req.session.quantity;
    } else {
      url = req.get("Referer");
    }

    res.status(200).json({ success: true, redirectUrl: url }); // Redirect to cart page
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// removeAllItemsRequest
const removeAllItemsRequest = async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    await cartModels.findOneAndUpdate(
      { userId },
      { $set: { items: [] }, updatedAt: Date.now() }
    );
    res.status(200).json({ success: true, redirectUrl: "/cart" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

// moveAllItemsToWishlistRequest
const moveAllItemsToWishlistRequest = async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    const cart = await cartModels.findOne({ userId }, { items: 1 });
    const wishlist = await wishlistModels.findOne({ userId });

    if (!wishlist) {
      const newWishlist = new wishlistModels({
        userId,
        items: [],
      });
      await newWishlist.save();
    }

    for (let item of cart.items) {
      let flag = 0;
      for (let wishItem of wishlist.items) {
        if (item.variantId.toString() == wishItem.variantId.toString()) {
          flag = 1;
          break;
        }
      }
      if (flag == 0) {
        const newItem = {};
        newItem.productId = item.productId;
        newItem.variantId = item.variantId;
        newItem.categoryId = item.categoryId;
        newItem.subCategoryId = item.subCategoryId;
        await wishlistModels.findOneAndUpdate(
          { userId },
          { $push: { items: newItem }, updatedAt: Date.now() }
        );
      }
    }

    await cartModels.findOneAndUpdate(
      { userId },
      { $set: { items: [] }, updatedAt: Date.now() }
    );

    res.status(200).json({ success: true, redirectUrl: "/cart" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

module.exports = {
  addToCartRequest,
  cartPage,
  cartRemoveItemRequest,
  removeAllItemsRequest,
  updateQtyRequest,
  moveAllItemsToWishlistRequest,
};
