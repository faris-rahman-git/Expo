

document
  .getElementById("addProductBtn")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    const logErrorMessage = document.getElementById("logErrorMessage");
    const productName = document.getElementById("productName").value.trim();
    const productCategory = document
      .getElementById("productCategory")
      .value.trim();
    const productSubCategory = document
      .getElementById("productSubCategory")
      .value.trim();

    const offerPercentage = document
      .getElementById("offerPercentage")
      .value.trim();

    // Check required fields for both Add and Edit
    if (!productName) {
      logErrorMessage.textContent = "Product Name are Required";
      return false;
    }
    if (
      productCategory === "Select Product Category" ||
      productSubCategory === "--Select SubCategory--" ||
      productSubCategory === ""
    ) {
      logErrorMessage.textContent =
        "Please select a Parent Category and Product SubCategory";
      return false;
    }
    if (offerPercentage < 0) {
      logErrorMessage.textContent = "Offer Percentage cannot be negative";
      return false;
    }
    if (offerPercentage > 100) {
      logErrorMessage.textContent =
        "Offer Percentage cannot be greater than 100";
      return false;
    }

    try {
      const response = await fetch("/admin/addNewProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          status: document.getElementById("inputStatus").value,
          productCategory,
          productSubCategory,
          offerStatus: document.getElementById("inputOfferStatus").value,
          offerPercentage,
          startDate: document.getElementById("startDate").value,
          expiryDate: document.getElementById("expiryDate").value,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        logErrorMessage.textContent = data.message;
        return false;
      } else {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.log(err);
    }
  });
