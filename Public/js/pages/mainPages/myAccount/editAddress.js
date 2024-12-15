function validateForm() {
  const name = document.getElementById("name").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const pincode = document.getElementById("pincode").value.trim();
  const house = document.getElementById("house").value.trim();
  const city = document.getElementById("city").value.trim();
  const logMassageName = document.getElementById("logMassageName");
  const logMassagePhone = document.getElementById("logMassagePhone");
  const logMassagePin = document.getElementById("logMassagePin");
  const logMassageHouse = document.getElementById("logMassageHouse");
  const logMassageCity = document.getElementById("logMassageCity");

  logMassageName.innerHTML = "";
  logMassagePhone.innerHTML = "";
  logMassagePin.innerHTML = "";
  logMassageHouse.innerHTML = "";
  logMassageCity.innerHTML = "";

  if (name == "") {
    logMassageName.innerHTML = "Please enter a name.";
    return false;
  }
  const phoneRegex = /^[789]\d{9}$/;
  if (
    phoneNumber == "" ||
    !phoneRegex.test(phoneNumber) ||
    isNaN(phoneNumber)
  ) {
    logMassagePhone.innerHTML =
      "Please enter a valid phone number so we can call if there are any issues with delivery.";
    return false;
  }
  if (pincode == "" || pincode.length != 6 || isNaN(pincode)) {
    logMassagePin.innerHTML = "Please enter a valid ZIP or postal code.";
    return false;
  }
  if (house == "") {
    logMassageHouse.innerHTML = "Please enter Address Line 1.";
    return false;
  }
  if (city == "") {
    logMassageHouse.innerHTML = "Please enter a city name.";
    return false;
  }
  return true;
}
