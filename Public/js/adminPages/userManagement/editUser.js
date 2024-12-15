document.getElementById("editUserBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  var userName = document.getElementById("userName").value.trim();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value.trim();
  var confirmPassword = document.getElementById("confirmPassword").value.trim();
  var phoneNumber = document.getElementById("phoneNumber").value.trim();
  var blockStatus = document.getElementById("inputBlocked").value.trim();
  var logErrorMessage = document.getElementById("logErrorMessage");

  // Check required fields for both Add and Edit
  if (!userName || !email) {
    logErrorMessage.textContent = "User Name and Email are required";
    return false;
  }

  // Validate password if provided
  if (password || confirmPassword) {
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
      logErrorMessage.textContent =
        "Password and Confirm Password do not match";
      return false;
    }
  }

  // Prepare the data to send to the server
  const userData = {
    userName,
    email,
    password,
    confirmPassword,
    phoneNumber,
    blockStatus,
  };

  try {
    const userId = document.getElementById("userId").value;
    const url = `/admin/editUser/${userId}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!data.success) {
      logErrorMessage.textContent = data.message;
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
      return;
    } else {
      window.location.href = data.redirectUrl;
    }
  } catch (err) {
    console.log(err);
  }
});
