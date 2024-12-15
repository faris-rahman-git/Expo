document.getElementById("loginBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value.trim();
  const logErrorMessage = document.getElementById("logErrorMessage");
  if (!email || !password) {
    logErrorMessage.textContent = "All fields are required";
    return false;
  }
  const formData = {
    email,
    password,
  };
  try {
    const response = await fetch("/login", {
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
