document.getElementById("signupBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  var password = document.getElementById("password").value.trim();
  var confirmPassword = document
    .getElementById("confirm-password")
    .value.trim();
  const logErrorMessage = document.getElementById("logErrorMessage");

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
  const formData = {
    password,
    confirmPassword,
  };
  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    if (!data.success) {
      logErrorMessage.textContent = data.message;
      return false;
    } else {
      window.location.href = data.redirectUrl;
    }
  } catch (err) {
    console.log(err);
  }
});
