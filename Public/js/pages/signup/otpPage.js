// Function to validate the OTP field
document
  .getElementById("setPasswordBtn")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    const otp = document.getElementById("otp").value.trim();
    const logErrorMessage = document.getElementById("logErrorMessage");
    if (!otp) {
      logErrorMessage.textContent = "Please Enter OTP";
      return false;
    }

    const formData = {
      otp,
    };
    try {
      const response = await fetch("/password", {
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

// Function to start the countdown timer when OTP form is displayed
function startOtpTimer() {
  const resendOtpButton = document.getElementById("resendOtpButton");
  resendOtpButton.disabled = true; // Disable the button initially

  let timer = 60; // Set timer duration (in seconds)

  let interval = setInterval(() => {
    timer--;

    if (timer <= 0) {
      clearInterval(interval); // Stop the interval once the timer reaches 0
      resendOtpButton.disabled = false; // Enable the button after 1 minute
      resendOtpButton.textContent = "Resend OTP";
    } else {
      resendOtpButton.textContent = `Resend OTP (${timer}s)`;
    }
  }, 1000);
}

// Function to resend OTP and reset the timer
function resendOtp() {
  document.getElementById("logErrorMessage").textContent =
    "OTP Resend Successfully! Please Check Your Email";
  setTimeout(() => {
    startOtpTimer(); // Start the timer after OTP is resent
  }, 1000); // Simulated delay for OTP sending

  fetch("/resendOtp", {
    method: "POST", // Use POST method
    headers: {
      "Content-Type": "application/json", // Set the content type as JSON
    },
  })
    .then((response) => response.json()) // Parse the response as JSON
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Automatically start the timer when OTP form is loaded
window.onload = function () {
  startOtpTimer(); // Start the timer when the OTP form is displayed
};
