(function () {
  const alert = document.getElementById("cartAlert");
  alert.innerHTML = "<strong>Some products are unavailable!</strong>";
  alert.style.display = "block";
  setTimeout(() => {
    alert.style.display = "none";
  }, 3000);
})();
