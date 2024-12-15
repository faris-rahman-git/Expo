const walletModels = require("../models/walletModels");

const walletUpdate = async (userId, incUpdates, pushUpdates) => {
  try {
    //update wallet
    await walletModels.findOneAndUpdate(
      {
        userId,
      },
      {
        $inc: incUpdates,
        $push: pushUpdates,
        updatedAt: Date.now(),
      }
    );

    return true;
  } catch (err) {
    return false;
  }
};

module.exports = {walletUpdate}