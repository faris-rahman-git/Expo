const Product= Object.freeze({
    CATEGORY_ID_REQUIRED : "Category ID is required.",
    PRODUCT_ALREADY_EXISTS : "Product already exists in this Category and SubCategory.",
    SOMETHING_WENT_WRONG : "Something Went Wrong! Please Try Again.",
    ENTER_PRODUCT_VARIANT_DETAILS : "Enter product variant details.",
    ONLY_IMAGE_FILES_ALLOWED : "Only image files are allowed!",
    ONLY_5_IMAGES_CAN_UPLOAD : "Only 5 images can be uploaded.",
    ALL_FIELDS_REQUIRED : "All fields are required.",
    STOCK_AND_PRICE_POSITIVE : "Stock and price must be positive numbers.",
    OFFER_PERCENTAGE_RANGE : "Offer percentage must be between 0 and 99.",
    PRODUCT_VARIANT_ALREADY_EXISTS : "Product variant with the same name and color already exists.",
    EDIT_PRODUCT_VARIANT : "Edit product variant.",
});

module.exports = Product;
