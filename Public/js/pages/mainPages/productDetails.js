document.addEventListener("DOMContentLoaded", function () {
  const message = document.getElementById("messageFromCheckout").value;
  if (message) {
    document.getElementById("modalButton").click();
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML =
      "This product is <strong>out of stock</strong>, so you cannot proceed to checkout. <strong>Please wait</strong> while we work on restocking it.";
  }
});
