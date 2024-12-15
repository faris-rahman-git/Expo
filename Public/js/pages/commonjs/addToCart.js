//add cart for single items
document.querySelectorAll(".addToCart").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();

    const productId = event.currentTarget.dataset.productid;
    const variantId = event.currentTarget.dataset.variantid;
    const categoryId = event.currentTarget.dataset.categoryid;
    const subCategoryId = event.currentTarget.dataset.subcategoryid;

    const wishlistTrue =
      Boolean(document.getElementById("wishlistTrue")?.value) || false;

    const cartCount = document.getElementById("cartCount");
    const cartAlert = document.getElementById("cartAlert");
    const quantity = document.getElementById("quantity").value;
    const url = `/addToCart/${productId}/${variantId}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: quantity,
          categoryId: categoryId,
          subCategoryId: subCategoryId,
          wishlistTrue,
        }),
      });

      const result = await response.json();
      //if response is ok
      if (result.success) {
        cartCount.innerText = result.count;
        cartAlert.style.display = "block";
        cartAlert.innerHTML =
          "<strong>Item added to cart successfully! </strong>";
        // Set a timeout to hide the alert after 5 seconds
        if (result.redirectUrl) {
          setTimeout(() => {
            cartAlert.style.display = "none";
            sessionStorage.setItem("scrollPosition", window.scrollY);
            window.location.href = result.redirectUrl;
          }, 500);
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
          cartAlert.innerHTML = "<strong>Item Already in Cart</strong>";
          cartAlert.style.display = "block";
          setTimeout(() => {
            cartAlert.style.display = "none";
          }, 5000);
        }
      }
    } catch (err) {
      console.log(err);
      cartAlert.innerHTML = "<strong>Item Can't be Added to Cart</strong>";
      cartAlert.style.display = "block";
      setTimeout(() => {
        cartAlert.style.display = "none";
      }, 5000);
    }
  });
});
