document.addEventListener("DOMContentLoaded", function () {
  const message = document.getElementById("message").value;
  if (message == "false") {
    document.getElementById("modalButton").click();
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML =
      "Some products in your Wishlist are <strong>No Longer Available and Automatically Remove Them</strong>. Please review your Wishlist before doing any actions.";
  }
});

//remove each items
const cartAlert = document.getElementById("cartAlert");

document.querySelectorAll(".removeItemFromWishlist").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      const itemId = event.target.dataset.id;

      const response = await fetch(`/wishlist/removeItemToWishlist/${itemId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        // Redirect if a redirectUrl is provided
        if (result.redirectUrl) {
          cartAlert.innerHTML = "<strong>Removing Item ...!</strong>";
          cartAlert.style.display = "block";
          setTimeout(() => {
            cartAlert.style.display = "none";
            sessionStorage.setItem("scrollPosition", window.scrollY);
            window.location.href = result.redirectUrl;
          }, 500);
        }
      } else {
        cartAlert.innerHTML = "<strong>Failed to remove item!</strong>";
        cartAlert.style.display = "block";
        setTimeout(() => {
          cartAlert.style.display = "none";
        }, 5000);
      }
    } catch (err) {
      cartAlert.innerHTML =
        "<strong>Failed to remove item! Try again later.</strong>";
      cartAlert.style.display = "block";
      setTimeout(() => {
        cartAlert.style.display = "none";
      }, 5000);
    }
  });
});

//remove all items
document
  .getElementById("removeAllItems")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/wishlist/removeAllItems", {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        cartAlert.innerHTML =
          "<strong>Removing All Items From Wishlist!</strong>";
        cartAlert.style.display = "block";
        setTimeout(() => {
          cartAlert.style.display = "none";
          window.location.href = result.redirectUrl;
        }, 1000);
      } else {
        cartAlert.innerHTML = "<strong>Failed to remove all items!</strong>";
        cartAlert.style.display = "block";
        setTimeout(() => {
          cartAlert.style.display = "none";
        }, 5000);
      }
    } catch (err) {
      cartAlert.innerHTML =
        "<strong>Failed to remove all items! Try again later.</strong>";
      cartAlert.style.display = "block";
      setTimeout(() => {
        cartAlert.style.display = "none";
      }, 5000);
    }
  });

//move all items to cart
document
  .getElementById("moveAllItemsToCart")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/wishlist/moveAllItemsToCart", {
        method: "POST",
      });
      const result = await response.json();
      if (result.success == true) {
        cartAlert.style.display = "block";
        cartAlert.innerHTML =
          "<strong>Moving All Available Items To Cart ...!</strong>";
        setTimeout(() => {
          cartAlert.style.display = "none";
          window.location.href = result.redirectUrl;
        }, 800);
      } else {
        cartAlert.innerHTML = "<strong>Failed to move all items!</strong>";
        cartAlert.style.display = "block";
        setTimeout(() => {
          cartAlert.style.display = "none";
        }, 5000);
      }
    } catch (err) {
      cartAlert.innerHTML =
        "<strong>Failed to move all items! Try again later.</strong>";
      cartAlert.style.display = "block";
      setTimeout(() => {
        cartAlert.style.display = "none";
      }, 5000);
    }
  });
