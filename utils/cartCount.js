const cartModels = require("../models/cartModels");

const cartCount = async (userId) => {
  try {
    const cart = await cartModels.findOne({ userId });
    const cartCount = cart?.items.length || 0;
    return cartCount
  } catch (err) {
    console.log(err);
  }
};

module.exports = {cartCount}