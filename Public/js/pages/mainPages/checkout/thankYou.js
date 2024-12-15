(function () {
  const alert = document.getElementById("cartAlert");
  alert.innerHTML = "<strong>Order Placed Successfully!</strong>";
  alert.style.display = "block";
  setTimeout(() => {
    alert.style.display = "none";
  }, 3000);
})();
