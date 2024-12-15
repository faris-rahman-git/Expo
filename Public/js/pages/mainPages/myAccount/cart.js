document.addEventListener("DOMContentLoaded", function () {
  const message = document.getElementById("message").value;
  if (message == "true") {
    document.getElementById("modalButton").click();
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML =
      "Some products in your cart are <strong>out of stock  or have limited availability</strong>. We have updated your cart accordingly. Please review your cart before proceeding to checkout.";
  }
  if (message == "false") {
    document.getElementById("modalButton").click();
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML =
      "Some products in your cart are <strong>No Longer Available and Automatically Remove Them</strong>. Please review your cart before proceeding to checkout.";
  }
});

jQuery(
  '<div class="quantity-nav"><div class="quantity-button quantity-up"><p>+</p></div><div class="quantity-button quantity-down"><p>-</p></div></div>'
).insertAfter(".quantity input");

jQuery(".quantity").each(function () {
  var spinner = jQuery(this),
    input = spinner.find('input[type="number"]'),
    btnUp = spinner.find(".quantity-up"),
    btnDown = spinner.find(".quantity-down"),
    min = input.attr("min"),
    max = input.attr("max");

  btnUp.click(async function () {
    var oldValue = parseFloat(input.val());
    if (oldValue >= max) {
      showAlertModal(
        "Alert! You’ve reached the maximum quantity limit for this item. No additional units can be added per person."
      );
      return;
    } else {
      var newVal = oldValue + 1;
    }
    spinner.find("input").val(newVal);
    spinner.find("input").trigger("change");

    if (oldValue != newVal) {
      await updateQuantity(newVal);
    }
  });

  btnDown.click(async function () {
    var oldValue = parseFloat(input.val());
    if (oldValue <= min) {
      showAlertModal(
        "Warning! You cannot reduce the quantity further. Minimum limit reached for this item."
      );
      return;
    } else {
      var newVal = oldValue - 1;
    }
    spinner.find("input").val(newVal);
    spinner.find("input").trigger("change");

    if (oldValue != newVal) {
      await updateQuantity(newVal);
    }
  });

  // Function to make fetch call
  async function updateQuantity(quantity) {
    const itemId = spinner.data("item-id");
    try {
      const response = await fetch(`/cart/updateQty/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      const result = await response.json();

      if (result.success) {
        redirectWithScrollPosition(result.redirectUrl);
      } else {
        console.error("Failed to update quantity", result.message);
      }
    } catch (err) {
      console.error("Error updating quantity", err);
    }
  }

  // Function to show alert modal
  function showAlertModal(message) {
    document.getElementById("modalButton").click();
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = message;
  }
});

const redirectWithScrollPosition = (url) => {
  // Save current scroll position
  sessionStorage.setItem("scrollPosition", window.scrollY);

  // Redirect to the given URL
  window.location.href = url;
};

//remove each items
const cartAlert = document.getElementById("cartAlert");

document.querySelectorAll(".removeItemToCart").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      const itemId = event.target.dataset.id;
      const length = event.target.dataset.length;
      const response = await fetch(`/cart/removeItemToCart/${itemId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ length }),
      });
      const result = await response.json();

      if (result.success) {
        // Redirect if a redirectUrl is provided
        if (result.redirectUrl) {
          cartAlert.innerHTML = "<strong>Removing Item ...!</strong>";
          cartAlert.style.display = "block";
          setTimeout(() => {
            cartAlert.style.display = "none";
            if (result.redirectUrl == "/cart") {
              window.location.href = result.redirectUrl;
            } else {
              redirectWithScrollPosition(result.redirectUrl);
            }
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
      const response = await fetch("/cart/removeAllItems", {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        cartAlert.innerHTML = "<strong>Removing All Items From Cart!</strong>";
        cartAlert.style.display = "block";
        setTimeout(() => {
          cartAlert.style.display = "none";
          window.location.href = result.redirectUrl;
        }, 1000);
      } else {
        cartAlert.innerHTML = "<strong>Failed to remove all items:</strong>";
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

//moveAllItemsToWishlist
document
  .getElementById("moveAllItemsToWishlist")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/cart/moveAllItemsToWishlist", {
        method: "POST",
      });
      const result = await response.json();
      if (result.success == true) {
        cartAlert.style.display = "block";
        cartAlert.innerHTML =
          "<strong>Moving All Items To Wishlist ...!</strong>";
        setTimeout(() => {
          cartAlert.style.display = "none";
          window.location.href = result.redirectUrl;
        }, 800);
      } else {
        cartAlert.innerHTML = "<strong>Failed to move all items:</strong>";
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
