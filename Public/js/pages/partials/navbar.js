(function () {
  fetch("/navCount", {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("cartCount").innerText = data.navCartCount;
      document.getElementById("wishlistCount").innerText =
        data.navWishlistCount;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
})();
