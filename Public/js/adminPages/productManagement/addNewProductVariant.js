// Modify the validateForm function to call updateFileInput before validation
function validateForm() {
  updateFileInput(); // Update the file input with selected files

  const productVariantName = document
    .getElementById("productVariantName")
    .value.trim();
  const stock = document.getElementById("stock").value.trim();
  const price = document.getElementById("price").value.trim();
  const color = document.getElementById("color").value.trim();
  const startDate = document.getElementById("startDate");
  const expiryDate = document.getElementById("expiryDate");

  const offerPercentage = document
    .getElementById("offerPercentage")
    .value.trim();
  const previewImages = document.querySelectorAll(
    "#imagePreviewContainer .image-preview"
  );

  const productVariantDescription = document.getElementById(
    "productVariantDescription"
  ).value;
  const logErrorMessage = document.getElementById("logErrorMessage");

  // Reset error message
  logErrorMessage.textContent = "";

  // Validate required fields
  if (
    !productVariantName ||
    !color ||
    !stock ||
    !price ||
    !productVariantDescription
  ) {
    logErrorMessage.textContent = "All fields are required.";
    return false;
  }

  // Validate numeric fields
  if (isNaN(stock) || stock < 0) {
    logErrorMessage.textContent = "Stock must be a positive number.";
    return false;
  }
  if (isNaN(price) || price < 0) {
    logErrorMessage.textContent = "Price must be a positive number.";
    return false;
  }
  if (previewImages.length < 3) {
    logErrorMessage.textContent = "Please upload at least Three images.";
    return false;
  }
  if (offerPercentage < 0) {
    logErrorMessage.textContent = "Offer Percentage cannot be negative";
    return false;
  }
  if (offerPercentage > 100) {
    logErrorMessage.textContent = "Offer Percentage cannot be greater than 100";
    return false;
  }
  if (startDate.value > expiryDate.value && expiryDate.value) {
    logErrorMessage.textContent = "Start Date Must be Less Than Expiry Date.";
    return false;
  }
  return true;
}
