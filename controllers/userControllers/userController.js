const categoryModels = require("../../models/categoryModels");
const productModels = require("../../models/productModels");
const subCategoryModels = require("../../models/subCategoryModels");
const { cartCount } = require("../../utils/cartCount");
const { checkProductValidity } = require("../../utils/stockManagement");
const { wishlistCount } = require("../../utils/wishlistCount");

//homePage
const homePage = async (req, res, next) => {
  try {
    const products = await productModels
      .find({ isDeleted: false, isInactive: false })
      .populate("categoryId")
      .populate("subCategoryId");

    const validProducts = products.filter((product) => {
      return (
        !product.categoryId.isDeleted &&
        !product.categoryId.isInactive &&
        !product.subCategoryId.isDeleted &&
        !product.subCategoryId.isInactive &&
        product.variants.length > 0
      );
    });

    res.render("userPages/pages/home", { validProducts });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/login";
    next(err);
  }
};

const navCount = async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    const navCartCount = await cartCount(userId);
    const navWishlistCount = await wishlistCount(userId);
    res.status(200).json({ success: true, navCartCount, navWishlistCount });
  } catch (err) {
    console.log(err);
  }
};

// productDetailsPage
const productDetailsPage = async (req, res, next) => {
  try {
    const messageFromCheckout = req.session.messageFromCheckout;
    delete req.session.messageFromCheckout;
    const { productId, variantId } = req.params;

    const result = await checkProductValidity(productId, variantId);

    if (!result) {
      const url = req.get("Referer") || "/home";
      return res.status(400).redirect(url);
    }

    const product = await productModels
      .findById(productId)
      .populate("categoryId")
      .populate("subCategoryId");
    if (!product) {
      res.status(404).redirect("/home");
    }

    const variant = product.variants.find(
      (variant) => variant._id.toString() === variantId
    );

    const fullRelatedProducts = await productModels
      .find({
        categoryId: product.categoryId,
        isInactive: false,
        isDeleted: false,
      })
      .populate("categoryId subCategoryId");

    let relatedProducts = [];

    for (let product of fullRelatedProducts) {
      if (
        !product.categoryId.isDeleted &&
        !product.categoryId.isInactive &&
        !product.subCategoryId.isDeleted &&
        !product.subCategoryId.isInactive &&
        product.variants.length > 0
      ) {
        relatedProducts.push(product);
      }
    }

    res.status(200).render("userPages/pages/productDetails", {
      product,
      variant,
      relatedProducts,
      messageFromCheckout,
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = req.get("Referer") || "/home";
    next(err);
  }
};

//search page
const searchPage = async (req, res, next) => {
  try {
    const searchData = req.query.searchData;
    const outOfStockStatus = req.query.outOfStockStatus;
    const sortType = req.query.sortType;
    const currentPage = req.query.currentPage;
    const selectedCategory = req.query.selectedCategory;
    let selectedBrand = req.query.selectedBrand;

    if (req.session.selectedCategory != selectedCategory) {
      selectedBrand = "all";
    }

    const limit = 5;
    const skip = (currentPage - 1) * limit;

    //get category names
    const categorys = await categoryModels.find(
      { isInactive: false, isDeleted: false },
      { categoryName: 1 }
    );

    let subCategorys;
    if (selectedCategory == "all") {
      subCategorys = await subCategoryModels.aggregate([
        {
          $match: { isInactive: false, isDeleted: false },
        },
        {
          $group: { _id: { subCategoryName: "$subCategoryName" } },
        },
      ]);
    } else {
      subCategorys = await subCategoryModels.find(
        { categoryId: selectedCategory, isInactive: false, isDeleted: false },
        { subCategoryName: 1 }
      );
    }

    let products;

    if (searchData == "") {
      products = await productModels
        .find({})
        .populate("subCategoryId categoryId");
    } else {
      // Create text index on productName
      await productModels.collection.createIndex({
        productName: "text",
      });

      products = await productModels
        .find({ $text: { $search: searchData } })
        .sort({ score: { $meta: "textScore" } })
        .select({ score: { $meta: "textScore" } })
        .populate("subCategoryId categoryId");
    }

    let matchProducts = [];
    for (const product of products) {
      for (const variant of product.variants) {
        const result = await checkProductValidity(product._id, variant._id);
        if (result) {
          let newVariant = variant.toObject();
          newVariant.productId = product._id;
          newVariant.productId = {
            _id: product._id,
            productName: product.productName,
            offerStatus: product.offerStatus,
            offerPercentage: product.offerPercentage,
            offerStartDate: product.offerStartDate,
            offerEndDate: product.offerEndDate,
          };
          newVariant.productName = product.productName;
          newVariant.categoryId = product.categoryId;
          newVariant.subCategoryId = product.subCategoryId;
          if (
            selectedCategory != product.categoryId._id &&
            selectedCategory != "all"
          ) {
            continue;
          }
          if (
            selectedBrand != product.subCategoryId.subCategoryName &&
            selectedBrand != "all"
          ) {
            continue;
          }
          if (outOfStockStatus == "hide" && newVariant.stock <= 0) {
            continue;
          }
          matchProducts.push(newVariant);
        }
      }
    }

    if (sortType == "Popularity") {
      matchProducts.sort((a, b) => b.salesCount - a.salesCount);
    }
    if (sortType == "Price: Low to High") {
      matchProducts.sort((a, b) => a.price - b.price);
    }
    if (sortType == "Price: High to Low") {
      matchProducts.sort((a, b) => b.price - a.price);
    }
    if (sortType == "Average Ratings") {
    }
    if (sortType == "New Arrivals") {
      matchProducts.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    if (sortType == "aA - zZ") {
      matchProducts.sort((a, b) => a.productName.localeCompare(b.productName));
    }
    if (sortType == "zZ - aA") {
      matchProducts.sort((a, b) => b.productName.localeCompare(a.productName));
    }

    const pageProduct = matchProducts.slice(skip, skip + limit);
    const totalProduct = matchProducts.length;
    const totalPage = Math.ceil(totalProduct / limit);

    req.session.selectedCategory = selectedCategory;

    res.status(200).render("userPages/pages/search", {
      searchData,
      matchProducts: pageProduct,
      sortType,
      totalPage,
      totalProduct,
      currentPage: Number(currentPage),
      outOfStockStatus,
      categorys,
      selectedCategory,
      subCategorys,
      selectedBrand,
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = req.get("Referer") || "/home";
    next(err);
  }
};

// searchRequest
const searchRequest = (req, res) => {
  const {
    search,
    sortType,
    outOfStockStatus,
    selectedCategory,
    selectedBrand,
  } = req.body;
  const page = req.query.page;
  // if (search == "") {
  //   const url = req.get("Referer") || "/home";
  //   return res.status(400).redirect(url);
  // }

  res
    .status(200)
    .redirect(
      "/search?searchData=" +
        search +
        "&selectedCategory=" +
        selectedCategory +
        "&selectedBrand=" +
        selectedBrand +
        "&sortType=" +
        sortType +
        "&outOfStockStatus=" +
        outOfStockStatus +
        "&currentPage=" +
        page
    );
};

// logOutRequest
const logOutRequest = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.clearCookie("connect-sid");
    res.redirect("/login");
  });
};

module.exports = {
  homePage,
  productDetailsPage,
  navCount,
  searchPage,
  searchRequest,
  logOutRequest,
};
