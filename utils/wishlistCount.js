const wishlistModels = require("../models/wishlistModels");

const wishlistCount = async (userId) => {
  try {
    const wishlist = await wishlistModels.findOne({ userId });
    const wishlistCount = wishlist?.items.length || 0;
    return wishlistCount;
  } catch (err) {
    console.log(err);
  }
};
module.exports = { wishlistCount };
