function profile() {
  const name = document.getElementById("name").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const logMassage = document.getElementById("logMassage");

  if (name == "" || phoneNumber == "") {
    logMassage.innerHTML = "All fields are required";
    return false;
  }

  const phoneRegex = /^[789]\d{9}$/;

  if (
    !phoneRegex.test(phoneNumber) ||
    phoneNumber.length != 10 ||
    isNaN(phoneNumber)
  ) {
    logMassage.innerHTML =
      "Phone number is not valid! Please enter a valid phone number";
    return false;
  }
  return true;
}

async function retryPayment(orderId) {
  const url = `/myAccount/retryPayment/${orderId}`;
  const response = await fetch(url, {
    method: "PATCH",
  });

  const responseData = await response.json();
  console.log(responseData);
  if (!responseData.success) {
    window.location.href = responseData.redirectUrl;
    return;
  }
  if (responseData.success) {
    const order = responseData.order;
    const user = responseData.user;
    const options = {
      key: "rzp_test_x5DfH9IhxSrCMD",
      amount: order.amount,
      currency: order.currency,
      name: "Xpo Ecom",
      description: "Test Payment",
      order_id: order.id,
      handler: async function (response) {
        const paymentData = {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        };

        const verifyRes = await fetch("/myAccount/paymentGateway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentData,
            parentOrderId: responseData.id,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          window.location.href = verifyData.redirectUrl;
        } else {
          window.location.href = verifyData.redirectUrl;
        }
      },
      prefill: {
        name: user.userName,
        email: user.email,
        contact: user.phoneNumber,
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }
}

function cancelOrder() {
  const cancelReason = document.getElementById("cancelReason").value.trim();
  if (!cancelReason) {
    document.getElementById("cancelReasonLabel").innerHTML =
      "Canellation Reason Must be Required";
    return false;
  }
  if (cancelReason.length < 20) {
    document.getElementById("cancelReasonLabel").innerHTML =
      "Canellation Reason Must be at least 20 characters long";
    return false;
  }
  return true;
}

function returnOrder() {
  const returnReason = document.getElementById("returnReason").value.trim();
  if (!returnReason) {
    document.getElementById("returnReasonLabel").innerHTML =
      "return Reason Must be Required";
    return false;
  }
  if (returnReason.length < 20) {
    document.getElementById("returnReasonLabel").innerHTML =
      "return Reason Must be at least 20 characters long";
    return false;
  }
  return true;
}
