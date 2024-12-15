const walletModels = require("../../models/walletModels");

const walletPage = async (req, res, next) => {
  try {
    const currentPage = req.query.currentPage;
    const userId = req.session?.user?._id;
    const wallet = await walletModels.findOne({ userId });

    wallet.transactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const limit = 5;
    const skip = (currentPage - 1) * limit;
    const pageTransactions = wallet.transactions.slice(skip, skip + limit);
    const totalTransactions = wallet.transactions.length;
    const totalPage = Math.ceil(totalTransactions / limit);

    res.render("userPages/pages/myAccount/wallet", {
      wallet,
      currentPage: Number(currentPage),
      pageTransactions,
      totalTransactions,
      skip,
      totalPage,
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/home";
    next(err);
  }
};

module.exports = { walletPage };
