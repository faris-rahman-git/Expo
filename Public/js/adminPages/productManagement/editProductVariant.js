// Modify the validateForm function to call updateFileInput before validation
function validateForm() {
  updateFileInput(); // Update the file input with selected files

  const productVariantName = document
    .getElementById("productVariantName")
    .value.trim();
  const status = document.getElementById("status").value;
  const stock = document.getElementById("stock").value.trim();
  const price = document.getElementById("price").value.trim();
  const color = document.getElementById("color").value.trim();
  const productVariantDescription = document.getElementById(
    "productVariantDescription"
  ).value;
  const previewImages = document.querySelectorAll(
    "#imagePreviewContainer .image-preview"
  );
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

  return true;
}

async function removeFunction(button) {
  const imagePreview = button.closest(".image-preview");
  const index = imagePreview.getAttribute("data-index");

  const url = "/admin/removeImage/" + index;

  const response = await fetch(url, {
    method: "PATCH",
  });

  const responseData = await response.json();
  if (responseData.success) {
    // Remove the image preview from the DOM
    imagePreview.remove();
  } else {
    console.error("Failed to remove image");
  }
}
