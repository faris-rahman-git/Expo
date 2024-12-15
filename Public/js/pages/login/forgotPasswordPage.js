function validateForm() {
  var password = document.getElementById("password").value.trim();
  var confirmPassword = document
    .getElementById("confirm-password")
    .value.trim();
  if (!password || !confirmPassword) {
    logErrorMessage.textContent = "All fields are required";
    return false;
  }
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    logErrorMessage.textContent =
      "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    return false;
  }
  if (password !== confirmPassword) {
    logErrorMessage.textContent = "Password and Confirm Password do not match";
    return false;
  }
  return true;
}
