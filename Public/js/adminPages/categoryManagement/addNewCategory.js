document
  .getElementById("addCategoryBtn")
  .addEventListener("click", async (e) => {
    e.preventDefault();

    const categoryName = document.getElementById("categoryName").value.trim();

    const offerPercentage = document
      .getElementById("offerPercentage")
      .value.trim();

    // Check required fields for both Add and Edit
    if (!categoryName) {
      logErrorMessage.textContent = "Category Name are Required";
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
      const response = await fetch("/admin/addNewCategory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryName: categoryName,
          status: document.getElementById("inputStatus").value,
          offerStatus: document.getElementById("inputOfferStatus").value,
          offerPercentage: offerPercentage,
          expiryDate: document.getElementById("expiryDate").value,
          startDate: document.getElementById("startDate").value,
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
