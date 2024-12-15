function validateLogin() {
  var email = document.getElementById("email").value.trim();
  if (!email) {
    document.getElementById("logErrorMessage").textContent =
      "Email Is Required";
    return false;
  }
  return true;
}
