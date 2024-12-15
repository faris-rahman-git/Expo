document
  .getElementById("sendOtpButton")
  .addEventListener("click", async (e) => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const logErrorMessage = document.getElementById("logErrorMessage");

    if (!name || !email || !phone) {
      logErrorMessage.textContent = "All fields are required";
      return false;
    }

    const phoneRegex = /^[789]\d{9}$/;

    // Check if phone number matches the regular expression
    if (!phoneRegex.test(phone)) {
      logErrorMessage.textContent = "Invalid Phone Number";
      return false;
    }

    const formData = {
      name,
      email,
      phone,
    };
    try {
      const response = await fetch("/otp", {
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
