const categoryModels = require("../../models/categoryModels");
const subCategoryModels = require("../../models/subCategoryModels");
const productModels = require("../../models/productModels");
const sharp = require("sharp");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  updateTotalStock,
  upload,
  deleteUploadedFiles,
  updateNoOfVariants,
  deleteAllImagesInProduct,
  deleteImage,
  deleteAllImagesInVariant,
} = require("../../utils/productManagementUtils");
const {
  incNoOfSubCategory,
  decNoOfSubCategory,
} = require("../../utils/categoryManagementUtils");
const { removeCartAndWishlistItems } = require("../../utils/stockManagement");

// all Products page
const allProductsPage = async (req, res, next) => {
  try {
    const products = await productModels
      .find({ isDeleted: false })
      .populate("categoryId")
      .populate("subCategoryId");

    const validProducts = products.filter(
      (product) =>
        !product.categoryId.isDeleted &&
        !product?.subCategoryId?.isDeleted &&
        !product.categoryId.isInactive &&
        !product?.subCategoryId?.isInactive
    );

    res.status(200).render("adminPages/productManagement/allProducts", {
      validProducts,
      activeSidebar: { main: "productManagement", sub: "allProducts" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allCategory";
    next(err);
  }
};

//add new product page
const addNewProductPage = async (req, res, next) => {
  try {
    const categories = await categoryModels.find({ isDeleted: false });
    res.status(200).render("adminPages/productManagement/addNewProduct", {
      categories,
      activeSidebar: { main: "productManagement", sub: "addNewProducts" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allProducts";
    next(err);
  }
};

//add New Product Page Get SubCategories
const addNewProductPageGetSubCategories = async (req, res, next) => {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    if (categoryId != "Select Product Category") {
      var subCategories = await subCategoryModels.find({
        categoryId,
        isDeleted: false,
      });
      res.status(200).json(subCategories);
    }
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allProducts";
    next(err);
  }
};

//add new product request
const addNewProductRequest = async (req, res, next) => {
  try {
    let {
      productName,
      status,
      productCategory,
      productSubCategory,
      offerStatus,
      offerPercentage,
      expiryDate,
      startDate,
    } = req.body;

    const normalizedProductName = productName.replace(/\s+/g, "").toLowerCase();

    // Find the product in the database with the same normalized name, category, and subcategory
    const productExist = await productModels.findOne({
      $expr: {
        $eq: [
          {
            $toLower: {
              $replaceAll: {
                input: "$productName", // Field to normalize
                find: " ", // What to replace
                replacement: "", // Replacement value
              },
            },
          },
          normalizedProductName, // Normalized input
        ],
      },
      categoryId: productCategory,
      subCategoryId: productSubCategory,
    });

    if (productExist) {
      return res.status(400).json({
        success: false,
        message: "Product already exists in this Category and SubCategory",
      });
    }

    // Create the new product
    const newProduct = new productModels({
      productName: productName.trim(),
      categoryId: productCategory,
      subCategoryId: productSubCategory,
    });

    // Handle product status for activation/inactivation
    const isInactive = status === "Active" ? false : true;
    newProduct.isInactive = isInactive;
    if (isInactive) {
      newProduct.inactivedAt = Date.now();
    }

    offerStatus = offerStatus === "Active" ? true : false;
    newProduct.offerStatus = offerStatus;
    if (offerPercentage == "") {
      offerPercentage = 0;
    }
    newProduct.offerPercentage = offerPercentage;
    if (expiryDate == "") {
      newProduct.offerEndDate = null;
    } else {
      newProduct.offerEndDate = new Date(expiryDate);
    }
    if (startDate == "") {
      newProduct.offerStartDate = Date.now();
    } else {
      newProduct.offerStartDate = new Date(startDate);
    }

    // Save the new product
    await newProduct.save();

    await incNoOfSubCategory(productSubCategory);

    return res
      .status(200)
      .json({ success: true, redirectUrl: "/admin/allProducts" });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allProducts";
    next(err);
  }
};

// editProductPage
const editProductPage = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await productModels
      .findById(productId)
      .populate("categoryId")
      .populate("subCategoryId");
    const categories = await categoryModels.find({ isDeleted: false });
    const subCategories = await subCategoryModels.find({
      categoryId: product.categoryId._id,
      isDeleted: false,
    });
    if (!product) {
      res.status(400).redirect("/admin/allProducts");
    }

    res.status(200).render("adminPages/productManagement/editProducts", {
      product,
      categories,
      subCategories,
      activeSidebar: { main: "productManagement" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allProducts";
    next(err);
  }
};

// editProductRequest
const editProductRequest = async (req, res, next) => {
  const productId = req.params.id;
  try {
    let {
      productName,
      status,
      categoryId,
      subCategoryId,
      offerStatus,
      offerPercentage,
      expiryDate,
      startDate,
    } = req.body;

    //find product
    const product = await productModels.findById(productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        redirectUrl: "/admin/allProducts",
      });
    }

    const normalizedProductName = productName.replace(/\s+/g, "").toLowerCase();

    // Find the product in the database with the same normalized name, category, and subcategory
    const productExist = await productModels.findOne({
      $expr: {
        $eq: [
          {
            $toLower: {
              $replaceAll: {
                input: "$productName", // Field to normalize
                find: " ", // What to replace
                replacement: "", // Replacement value
              },
            },
          },
          normalizedProductName, // Normalized input
        ],
      },
      categoryId,
      subCategoryId,
    });

    if (productExist && productExist._id.toString() != productId) {
      return res.status(400).json({
        success: false,
        message: "Product already exists in this Category and SubCategory",
      });
    }

    const updateProduct = {};

    if (productName != product.productName) {
      updateProduct.productName = productName.trim();
    }

    //check category and update
    if (categoryId.toString() !== product.categoryId.toString()) {
      updateProduct.categoryId = categoryId;
    }

    if (subCategoryId.toString() != product.subCategoryId._id.toString()) {
      updateProduct.subCategoryId = subCategoryId;
      await decNoOfSubCategory(product.subCategoryId._id.toString());
      await incNoOfSubCategory(subCategoryId);
    }

    // Handle product status for activation/inactivation
    const isInactive = status === "Active" ? false : true;
    if (product.isInactive !== isInactive) {
      updateProduct.isInactive = isInactive;
      if (isInactive) {
        await removeCartAndWishlistItems("product", productId);
        updateProduct.inactivedAt = Date.now();
      } else {
        updateProduct.inactivedAt = null;
      }
    }

    offerStatus = offerStatus === "Active" ? true : false;
    if (offerStatus != product.offerStatus) {
      updateProduct.offerStatus = offerStatus;
    }

    if (offerPercentage == "") {
      offerPercentage = 0;
    }
    if (offerPercentage != product.offerPercentage) {
      updateProduct.offerPercentage = offerPercentage;
    }

    if (new Date(startDate) != product.startDate) {
      if (startDate != "") {
        updateProduct.offerStartDate = new Date(startDate);
      }
    }

    if (new Date(expiryDate) != product.expiryDate) {
      if (expiryDate == "") {
        updateProduct.offerEndDate = null;
      } else {
        updateProduct.offerEndDate = new Date(expiryDate);
      }
    }

    updateProduct.updatedAt = Date.now();
    await productModels.findOneAndUpdate(
      { _id: productId },
      { $set: updateProduct }
    );

    return res.status(200).json({
      success: true,
      redirectUrl: "/admin/allProducts",
    });
  } catch (err) {
    req.session.message = "Something Went Wrong! Please Try Again";
    err.status = 500;
    err.redirectUrl = "/admin/editProduct/" + productId;
    next(err);
  }
};

//soft Delete Product request
const softDeleteProductRequest = async (req, res, next) => {
  try {
    const id = req.params.id;

    //check product
    const product = await productModels.findById(id);
    if (!product) {
      return res.status(400).redirect("/admin/allProducts");
    }

    //update schema
    const updateProduct = {};
    updateProduct.isDeleted = true;
    updateProduct.deletedAt = Date.now();
    updateProduct.updatedAt = Date.now();
    await productModels.findOneAndUpdate({ _id: id }, { $set: updateProduct });
    await decNoOfSubCategory(product.subCategoryId);

    //remove cart items
    await removeCartAndWishlistItems("product", id);

    //redirect allProducts page
    res.status(200).redirect("/admin/allProducts");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allProducts";
    next(err);
  }
};

//deleted Products page
const deletedProductsPage = async (req, res, next) => {
  try {
    const products = await productModels
      .find({ isDeleted: true })
      .populate("categoryId subCategoryId");
    res.status(200).render("adminPages/productManagement/deletedProducts", {
      products,
      activeSidebar: { main: "productManagement", sub: "deletedProducts" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allProducts";
    next(err);
  }
};

//restore Product request
const restoreProductRequest = async (req, res, next) => {
  try {
    const id = req.params.id;

    //check product
    const product = await productModels.findById(id);
    if (!product) {
      return res.status(400).redirect("/admin/deletedProducts");
    }

    //update databse
    const updateProduct = {};
    updateProduct.isDeleted = false;
    updateProduct.deletedAt = null;
    updateProduct.updatedAt = Date.now();
    await productModels.findOneAndUpdate({ _id: id }, { $set: updateProduct });
    await incNoOfSubCategory(product.subCategoryId);

    //redirect deletedProducts page
    res.status(200).redirect("/admin/deletedProducts");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/deletedProducts";
    next(err);
  }
};

//permenertly delete Product Request
const deleteProductRequest = async (req, res, next) => {
  try {
    const id = req.params.id;

    //check product
    const product = await productModels.findById(id);
    if (!product) {
      return res.status(400).redirect("/admin/deletedProducts");
    }

    //delete permenently
    const state = await deleteAllImagesInProduct(product);
    if (state) {
      await productModels.deleteOne({ _id: product._id });
    }

    return res.status(200).redirect("/admin/deletedProducts");
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/deletedProducts";
    next(err);
  }
};

//veriant management
//product Variants page
const productVariantsPage = async (req, res, next) => {
  try {
    const productId = req.params.id;

    //take product from databse
    const product = await productModels
      .findOne({
        _id: productId,
        isDeleted: false,
        isInactive: false,
      })
      .populate("categoryId subCategoryId");

    const activeVariants = product.variants.filter(
      (variant) =>
        !variant.isDeleted &&
        !product.categoryId.isDeleted &&
        !product.subCategoryId.isDeleted &&
        !product.categoryId.isInactive &&
        !product.subCategoryId.isInactive
    );

    if (activeVariants.length === 0 && product.variants.length > 0) {
      return res.status(404).redirect("/admin/allProducts");
    }
    res.status(200).render("adminPages/productManagement/productVariants", {
      product,
      activeVariants,
      activeSidebar: { main: "productManagement", sub: "allProducts" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/allProducts";
    next(err);
  }
};

//add New Product Variant Page
const addNewProductVariantPage = (req, res) => {
  const productId = req.params.id;
  const message = req.session.message ?? "Enter product variant details";
  delete req.session.message;
  res.status(200).render("adminPages/productManagement/addNewProductVariant", {
    message,
    productId,
    activeSidebar: { main: "productManagement", sub: "allProducts" },
  });
};

// add New Product Variant Request
const addNewProductVariantRequest = async (req, res, next) => {
  const { productId } = req.params;
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.log(err);
        req.session.message =
          err.message === "Only image files are allowed!"
            ? "Only image files are allowed"
            : "Only 5 images can be uploaded.";
        return res
          .status(400)
          .redirect(`/admin/addNewProductVariant/${productId}`);
      }

      let {
        productVariantName,
        productVariantDescription,
        color,
        price,
        stock,
        status,
        offerStatus,
        offerPercentage,
        expiryDate,
        startDate,
      } = req.body;

      if (
        ![
          productVariantName,
          color,
          price,
          stock,
          productVariantDescription,
        ].every(Boolean)
      ) {
        req.session.message = "All fields are required";
        return res
          .status(400)
          .redirect(`/admin/addNewProductVariant/${productId}`);
      }

      if (isNaN(stock) || stock < 0 || isNaN(price) || price < 0) {
        req.session.message = "Stock and price must be positive numbers.";
        return res
          .status(400)
          .redirect(`/admin/addNewProductVariant/${productId}`);
      }

      const normalizedProductVariantName = productVariantName
        .replace(/\s+/g, "")
        .toLowerCase();
      const normalizedColor = color.replace(/\s+/g, "").toLowerCase();
      const product = await productModels.findById(productId);

      const productVariantExist = product.variants.find(
        (variant) =>
          variant.variantName.replace(/\s+/g, "").toLowerCase() ===
            normalizedProductVariantName &&
          variant.color.replace(/\s+/g, "").toLowerCase() === normalizedColor
      );

      if (productVariantExist) {
        deleteUploadedFiles(req.files);
        req.session.message =
          "Product variant with the same name and color already exists.";
        return res
          .status(400)
          .redirect(`/admin/addNewProductVariant/${productId}`);
      }

      const processedImages = req.files.map((file) => ({
        path: `/productImages/${file.filename}`,
        originalName: file.originalname,
      }));

      const isInactive = status !== "Active";
      offerStatus = offerStatus === "Active";
      offerPercentage = offerPercentage || 0;

      const newVariant = {
        variantName: productVariantName.trim(),
        variantDescription: productVariantDescription.trim(),
        color: color.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        isInactive,
        images: processedImages,
        offerStatus,
        offerPercentage,
        offerEndDate: expiryDate ? new Date(expiryDate) : null,
        offerStartDate: startDate ? new Date(startDate) : Date.now(),
      };

      await productModels.updateOne(
        { _id: productId },
        { $push: { variants: newVariant } }
      );
      await updateNoOfVariants(productId);
      await updateTotalStock(productId);

      return res.status(200).redirect(`/admin/productVariants/${productId}`);
    });
  } catch (err) {
    next(err);
  }
};

//soft Delete Product Variant request
const softDeleteProductVariantRequest = async (req, res, next) => {
  try {
    const { variantId, productId } = req.params;

    //update databse
    const result = await productModels.updateOne(
      { _id: productId, "variants._id": variantId }, // Find the product and variant by variantId
      {
        $set: {
          "variants.$.isDeleted": true, // Mark the variant as deleted
          "variants.$.deletedAt": new Date(), // Set the deletedAt timestamp
        },
      }
    );
    if (!result) {
      return res.status(404).redirect("/admin/allProducts");
    }

    // Sum all variant stock for the product
    await updateNoOfVariants(productId);
    await updateTotalStock(productId);

    //remove cart items
    await removeCartAndWishlistItems("variant", variantId);

    return res.status(200).redirect("/admin/productVariants/" + productId);
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/productVariants/" + productId;
    next(err);
  }
};

//edit Product Variant page
const editProductVariantPage = async (req, res, next) => {
  const { variantId, productId } = req.params;
  try {
    //take produts and variants
    const product = await productModels.findById(productId);
    const variant = product.variants.find((variant) =>
      variant._id.equals(variantId)
    );
    if (!variant) {
      return res.status(400).redirect("/admin/productVariants" + productId);
    }

    const message = req.session.message ?? "Edit product variant";
    delete req.session.message;
    delete req.session.removeImages;
    req.session.removeImages = [];
    res.status(200).render("adminPages/productManagement/editProductVariant", {
      productId,
      message,
      variant,
      activeSidebar: { main: "productManagement", sub: "allProducts" },
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/productVariants/" + productId;
    next(err);
  }
};

// removeVariantImage
const removeVariantImage = (req, res) => {
  const { imageIndex } = req.params;
  req.session.removeImages.push(Number(imageIndex));
  return res.status(200).json({ message: "Image removed successfully." });
};

//edit Product Variant request
const editProductVariantRequest = async (req, res, next) => {
  const { variantId, productId } = req.params;
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error(err);
        req.session.message = "Only 5 Images Can Upload";
        return res
          .status(400)
          .redirect("/admin/editProductVariant/" + productId + "/" + variantId);
      }

      let {
        productVariantName,
        price,
        color,
        stock,
        status,
        productVariantDescription,
        offerStatus,
        offerPercentage,
        expiryDate,
        startDate,
      } = req.body;

      // Normalize product variant name and color (remove whitespaces and convert to lowercase)
      const normalizedProductVariantName = productVariantName
        .replace(/\s+/g, "")
        .toLowerCase();
      const normalizedColor = color.replace(/\s+/g, "").toLowerCase();

      const product = await productModels.findById(productId);

      if (!product) {
        return res.status(400).redirect("/admin/productVariants/" + productId);
      }

      // Check if the variant already exists (same name and color combination)
      const variantExist = product.variants.find((variant) => {
        const normalizedVariantName = variant.variantName
          .replace(/\s+/g, "")
          .toLowerCase();
        const normalizedVariantColor = variant.color
          .replace(/\s+/g, "")
          .toLowerCase();

        // Check if both name and color match
        return (
          normalizedVariantName === normalizedProductVariantName &&
          normalizedVariantColor === normalizedColor
        );
      });
      if (variantExist && !variantExist._id.equals(variantId)) {
        req.session.message =
          "Product variant with the same name and color already exists";
        return res
          .status(400)
          .redirect("/admin/editProductVariant/" + productId + "/" + variantId);
      }

      // Find the variant to edit
      const variant = product.variants.find((variant) =>
        variant._id.equals(variantId)
      );

      if (!variant) {
        return res.status(400).redirect("/admin/productVariants/" + productId);
      }

      //remove images
      const images = req.session?.removeImages.sort((a, b) => b - a);
      if (images.length !== 0) {
        for (let i = 0; i < images.length; i++) {
          variant.images.splice(images[i], 1);
        }
      }

      // Process uploaded images using sharp
      const processedImages = [];
      const processedImagesDir = path.join(
        __dirname,
        "../../Public/productImages/"
      );

      for (const file of req.files) {
        const outputFileName = `processed-${Date.now()}-${uuidv4()}-${
          file.originalname
        }`;
        const outputFilePath = path.join(processedImagesDir, outputFileName); // Using backslashes for path

        // Use sharp to resize and crop the image
        await sharp(file.path)
          .resize(600, 690, {
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy, // Focus on the most important area
          })
          .toFormat("jpeg")
          .jpeg({ quality: 80 })
          .toFile(outputFilePath);

        // Add the processed image details to the array (relative path with backslashes for public access)
        variant.images.push({
          path: `\\productImages\\${outputFileName}`, // Using backslashes for file path
          originalName: file.originalname,
        });

        // Optionally delete the original image uploaded by multer
        await deleteImage(file.path);
      }

      // Update the variant fields
      if (productVariantName !== "")
        variant.variantName = productVariantName.trim();
      if (price !== "") variant.price = price;
      if (color !== "") variant.color = color.trim();
      if (stock !== "") variant.stock = stock;
      if (status !== "")
        variant.isInactive = status === "Active" ? false : true; // Fix isInactive logic
      if (productVariantDescription !== "")
        variant.variantDescription = productVariantDescription.trim();
      if (variant.isInactive) {
        await removeCartAndWishlistItems("variant", variantId);
        variant.inactivedAt = Date.now();
      } else {
        variant.inactivedAt = null;
      }

      offerStatus = offerStatus === "Active" ? true : false;
      variant.offerStatus = offerStatus;

      if (offerPercentage == "") {
        offerPercentage = 0;
      }
      variant.offerPercentage = offerPercentage;

      if (startDate != "") {
        variant.offerStartDate = new Date(startDate);
      } else {
        variant.offerStartDate = Date.now();
      }

      if (expiryDate == "") {
        variant.offerEndDate = null;
      } else {
        variant.offerEndDate = new Date(expiryDate);
      }

      variant.updatedAt = Date.now();

      // Save the updated product document
      await product.save(); // Save the changes to the database

      await updateTotalStock(productId);

      return res.status(200).redirect("/admin/productVariants/" + productId);
    });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/productVariants/" + productId;
    next(err);
  }
};

//deleted product varients page
const deletedProductVariantsPage = async (req, res, next) => {
  const productId = req.params.id;
  try {
    //take product details from database
    const product = await productModels.findById(productId);
    if (!product) {
      return res.status(400).redirect("/admin/productVariants/" + productId);
    }

    const variants = product.variants.filter((variant) => variant.isDeleted);
    res
      .status(200)
      .render("adminPages/productManagement/DeletedProductVariants", {
        variants,
        productId,
        activeSidebar: { main: "productManagement", sub: "allProducts" },
      });
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/productVariants/" + productId;
    next(err);
  }
};

//restore Variants Request
const restoreProductVariantRequest = async (req, res, next) => {
  const { productId, variantId } = req.params;
  try {
    //update product details from database
    await productModels.updateOne(
      { _id: productId, "variants._id": variantId }, // Find the product and variant by variantId
      {
        $set: {
          "variants.$.isDeleted": false, // Mark the variant as deleted
          "variants.$.deletedAt": null, // Set the deletedAt timestamp
        },
      }
    );

    // Sum all variant stock for the product
    await updateNoOfVariants(productId);
    await updateTotalStock(productId);

    return res
      .status(200)
      .redirect("/admin/DeletedProductVariants/" + productId);
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/DeletedProductVariants/" + productId;
    next(err);
  }
};

// restore Product Variant Request
const deleteProductVariantsRequest = async (req, res, next) => {
  const { productId, variantId } = req.params;
  try {
    const state = await deleteAllImagesInVariant(productId, variantId);
    if (state) {
      //take product details from database
      await productModels.updateOne(
        { _id: productId },
        {
          $pull: {
            variants: { _id: variantId },
          },
        }
      );

      await updateNoOfVariants(productId);
      await updateTotalStock(productId);
    }

    res.status(400).redirect("/admin/DeletedProductVariants/" + productId);
  } catch (err) {
    err.status = 500;
    err.redirectUrl = "/admin/DeletedProductVariants/" + productId;
    next(err);
  }
};

module.exports = {
  allProductsPage,
  addNewProductPage,
  addNewProductRequest,
  addNewProductPageGetSubCategories,
  productVariantsPage,
  addNewProductVariantPage,
  addNewProductVariantRequest,
  softDeleteProductVariantRequest,
  editProductVariantPage,
  removeVariantImage,
  editProductVariantRequest,
  deletedProductVariantsPage,
  deleteProductVariantsRequest,
  restoreProductVariantRequest,
  softDeleteProductRequest,
  deletedProductsPage,
  restoreProductRequest,
  deleteProductRequest,
  editProductPage,
  editProductRequest,
};
