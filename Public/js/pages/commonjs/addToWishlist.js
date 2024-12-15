document.querySelectorAll(".addToWishlist").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();

    const cartAlert = document.getElementById("cartAlert");
    const cartTrue =
      Boolean(document.getElementById("cartTrue")?.value) || false;

    const productId = event.currentTarget.dataset.productid;
    const variantId = event.currentTarget.dataset.variantid;
    const categoryId = event.currentTarget.dataset.categoryid;
    const subCategoryId = event.currentTarget.dataset.subcategoryid;

    const url = `/addToWishlist/${productId}/${variantId}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartTrue,
          categoryId,
          subCategoryId,
        }),
      });

      const result = await response.json();
      //if response is ok
      if (result.success) {
        wishlistCount.innerText = result.count;
        cartAlert.style.display = "block";
        cartAlert.innerHTML =
          "<strong>Item Added to Wishlist successfully!</strong>";
        // Set a timeout to hide the alert after 5 seconds
        if (result.redirectUrl) {
          setTimeout(() => {
            cartAlert.style.display = "none";
            sessionStorage.setItem("scrollPosition", window.scrollY);
            window.location.href = result.redirectUrl;
          }, 1000);
        }
        setTimeout(() => {
          cartAlert.style.display = "none";
        }, 5000);
      } else {
        if (result.message) {
          cartAlert.innerHTML =
            "<strong> Product is Not Available!.Home Page Reloading... </strong>";
          cartAlert.style.display = "block";
          setTimeout(() => {
            cartAlert.style.display = "none";
            window.location.href = result.redirectUrl;
          }, 1000);
        } else {
          cartAlert.innerHTML = "<strong>Item Already in Wishlist</strong>";
          cartAlert.style.display = "block";
          setTimeout(() => {
            cartAlert.style.display = "none";
          }, 5000);
        }
      }
    } catch (err) {
      console.log(err);
      cartAlert.innerHTML = "<strong>Item Can't be Added to Wishlist</strong>";
      cartAlert.style.display = "block";
      setTimeout(() => {
        cartAlert.style.display = "none";
      }, 5000);
    }
  });
});
