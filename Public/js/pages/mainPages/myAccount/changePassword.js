function validateLogin() {
  var currentPass = document.getElementById("currentPass").value.trim();
  if (!currentPass) {
    document.getElementById("logErrorMessage").textContent =
      "Current PassWord Must Be Required";
    return false;
  }
  return true;
}
