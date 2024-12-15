const productModels = require("../models/productModels");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../Public/productImages/");

    // Check if directory exists, if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Create directory recursively
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `processed-${Date.now()}-${file.originalname}`);
  },
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter }).array("croppedImages", 10); // Accept up to 5 images

// Utility function to delete uploaded files
const deleteUploadedFiles = (files) => {
  files.forEach((file) => {
    try {
      fs.unlinkSync(file.path); // Delete file synchronously
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  });
};

// Utility function to update the total stock of a product
const updateTotalStock = async (productId) => {
  const product = await productModels.findOne({ _id: productId });

  const validVariants = product.variants.filter(
    (variant) => !variant.isDeleted && !variant.isInactive
  );

  // Sum up the stock of all variants
  const totalStock = validVariants.reduce(
    (sum, variant) => sum + variant.stock,
    0
  );

  // Update the total stock field in the product document
  await productModels.updateOne({ _id: productId }, { $set: { totalStock } });
};

// Utility function to update the number of variants of a product
const updateNoOfVariants = async (productId) => {
  const product = await productModels.findOne({ _id: productId });

  // Count the number of variants
  const noOfVariants = product.variants.filter(
    (variant) => !variant.isDeleted
  ).length;

  // Update the noOfVariants field in the product document
  await productModels.updateOne({ _id: productId }, { $set: { noOfVariants } });
};

const deleteAllImagesInVariant = async (productId, variantId) => {
  try {
    const product = await productModels.findOne(
      {
        _id: productId,
        "variants._id": variantId,
      },
      {
        variants: {
          $elemMatch: { _id: variantId },
        },
      }
    );
    for (let image of product.variants[0].images) {
      const fullPath = path.join(__dirname, "../public", image.path);
      if (fs.existsSync(fullPath)) {
        // Delete the file
        await fs.promises.unlink(fullPath);
      }
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const deleteAllImagesInProduct = async (product) => {
  try {
    const deletePromises = [];

    product.variants.forEach((variant) => {
      variant.images.forEach((image) => {
        const fullPath = path.join(__dirname, "../public", image.path);
        if (fs.existsSync(fullPath)) {
          deletePromises.push(fs.promises.unlink(fullPath));
        }
      });
    });
    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const deleteAllImages = async (id, identity) => {
  try {
    const deletePromises = [];

    let products;

    if (identity) {
      products = await productModels.find({ subCategoryId: id });
    } else {
      products = await productModels.find({ categoryId: id });
    }
    products.forEach((product) => {
      product.variants.forEach((variant) => {
        variant.images.forEach((image) => {
          const fullPath = path.join(__dirname, "../public", image.path);
          if (fs.existsSync(fullPath)) {
            deletePromises.push(fs.promises.unlink(fullPath));
          }
        });
      });
    });

    // Wait for all deletions to complete
    await Promise.all(deletePromises);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const deleteImage = async (imagePath) => {
  try {
    const fullPath = path.join("D:\\brototype\\project\\project1", imagePath);
    if (fs.existsSync(fullPath)) {
      // Delete the file
      await fs.promises.unlink(fullPath);
    }
  } catch (err) {}
};

module.exports = {
  updateTotalStock,
  upload,
  deleteUploadedFiles,
  updateNoOfVariants,
  deleteAllImagesInVariant,
  deleteAllImagesInProduct,
  deleteAllImages,
  deleteImage,
};
