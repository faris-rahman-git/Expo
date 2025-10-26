//aleart
document.addEventListener("DOMContentLoaded", function () {
  const message = document.getElementById("defaultAddress").value;
  if (message == "") {
    document.getElementById("modalButton").click();
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML =
      "To complete your order,<strong> please ensure that you have added a valid address</strong>. You cannot proceed with the checkout until an address is provided.";
  }
});

// wallet start
document
  .getElementById("WalletPayment")
  .addEventListener("change", function (e) {
    e.preventDefault();
    const paymentMethod1 = document.getElementById("paymentMethod1");
    const paymentMethod2 = document.getElementById("paymentMethod2");

    if (this.checked) {
      codPayment.style.display = "none";
      const walletBalance = e.currentTarget.dataset.walletbalance;
      const ordertotal = e.currentTarget.dataset.ordertotal;
      if (ordertotal < walletBalance) {
        paymentMethod1.checked = false;
        paymentMethod1.disabled = true;
      } else {
        paymentMethod1.checked = true;
      }
      paymentMethod2.checked = false;
      paymentMethod2.disabled = true;
    } else {
      codPayment.style.display = "block";
      paymentMethod1.checked = true;
      paymentMethod1.disabled = false;
      paymentMethod2.disabled = false;
    }
  });

// coupon start
async function applyCoupon() {
  const coupon = document.getElementById("coupon").value;
  const couponMessage = document.getElementById("couponMessage");
  const subtotal = document.getElementById("subtotal").value;
  if (!coupon) {
    couponMessage.textContent = "Please Enter Coupon Code To Submit :";
  } else {
    let couponResponse = await fetch("/checkOut/applyCoupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupon, subtotal }),
    });

    couponResponse = await couponResponse.json();

    if (!couponResponse.success) {
      couponMessage.textContent = couponResponse.message;
    }
    if (couponResponse.success == true) {
      couponMessage.textContent = couponResponse.message;
      window.location.reload();
    }
  }
}

function removeCoupon() {
  const response = fetch("/checkOut/removeCoupon", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  window.location.reload();
}

// place order start
async function placeOrder() {
  const forPlaceOrder = document.getElementById("forPlaceOrder").value;
  const defaultAddress = document.getElementById("defaultAddress").value;
  const paymentMethod =
    document.querySelector('input[name="paymentMethod"]:checked')?.value ||
    null;
  const isWalletPayment = document.getElementById("WalletPayment")?.checked;
  const walletBalance = Number(document.getElementById("walletBalance")?.value);

  const response = await fetch("/checkOut/placeOrder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      forPlaceOrder,
      defaultAddress,
      paymentMethod,
      isWalletPayment,
      walletBalance,
    }),
  });

  const responseData = await response.json();
  if (responseData.success == false && responseData.message) {
    document.getElementById("modalButton").click();
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML =
      "This coupon cannot be applied because: <strong>" +
      responseData.message +
      "</strong>.To apply this coupon, <strong>please ensure that you meet the required conditions</strong>.";
    return;
  }
  if (
    responseData.success == false ||
    responseData.paymentMethod == "COD" ||
    responseData.paymentMethod == "Wallet"
  ) {
    window.location.href = responseData.redirectUrl;
    return;
  }
  if (responseData.success == true && responseData.paymentMethod != "COD") {
    const order = responseData.order;
    const user = responseData.user;
    const options = {
      key: "rzp_test_HdrVnn0iQswq7O",
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

        const verifyRes = await fetch("/checkOut/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentData,
            parentOrderId: responseData.parentOrderId,
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
