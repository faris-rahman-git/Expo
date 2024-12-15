document
  .getElementById("productCategory")
  .addEventListener("change", async function () {
    const categoryId = this.value;
    const subCategorySelect = document.getElementById("productSubCategory");

    // Clear existing options
    subCategorySelect.innerHTML =
      '<option value="">--Select SubCategory--</option>';

    if (!categoryId) {
      return (subCategorySelect.innerHTML =
        '<option value="">--Select a  Category--</option>');
    } // Do nothing if no category is selected

    try {
      // Fetch subcategories based on the selected category
      const response = await fetch(
        `/admin/subcategories?categoryId=${categoryId}`
      );
      const subCategories = await response.json();

      if (response.ok) {
        // Populate subcategories
        subCategories.forEach((subCategory) => {
          const option = document.createElement("option");
          option.value = subCategory._id;
          option.textContent = subCategory.subCategoryName;
          subCategorySelect.appendChild(option);
        });
      } else {
        alert(subCategories.error || "Failed to load subcategories");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while fetching subcategories");
    }
  });
