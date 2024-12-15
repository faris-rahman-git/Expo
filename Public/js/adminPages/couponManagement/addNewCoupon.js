
const discountType = document.getElementById("discountType");
const discountValue = document.getElementById("discountValue");
const maxDiscount = document.getElementById("maxDiscount");
const expiryDate = document.getElementById("expiryDate").value;
const startDate = document.getElementById("startDate");

discountType.addEventListener("change", (e) => {
  e.preventDefault();
  if (discountType.value == "Percentage") {
    discountValue.placeholder = "Discount Value In %";
    maxDiscount.disabled = false;
  } else {
    discountValue.placeholder = "Discount Value In Amount";
    maxDiscount.disabled = true;
    maxDiscount.value = null;
  }
});

const assignedUsers = document.getElementById("assignedUsers");
const selectUserBtn = document.getElementById("selectUserBtn");

assignedUsers.addEventListener("change", (e) => {
  e.preventDefault();
  if (assignedUsers.value == "allUsers") {
    selectUserBtn.style.display = 'none';
  } else {
    selectUserBtn.style.display = 'block';
  }
});

document.getElementById("addNewCouponBtn").addEventListener("click", async(e) => {
  e.preventDefault(); 
  const couponName = document.getElementById("couponName").value.trim();
  const couponCode = document.getElementById("couponCode").value.trim();
  const description = document.getElementById("description").value.trim();
  const discountType = document.getElementById("discountType");
  const discountValue = document.getElementById("discountValue");
  const totalUsageLimit = document
    .getElementById("totalUsageLimit")
    .value.trim();
  const minPurchase = document.getElementById("minPurchase").value.trim();
  const logErrorMessage = document.getElementById("logErrorMessage");

  // Reset error message
  logErrorMessage.textContent = "";

  // Validate required fields
  if (!couponName) {
    logErrorMessage.textContent = "Coupon Name Are Required.";
    return false;
  }
  if (!couponCode) {
    logErrorMessage.textContent = "Coupon Code Are Required.";
    return false;
  }
  if (!description) {
    logErrorMessage.textContent = "Coupon Description  Are Required.";
    return false;
  }
  if (!discountValue.value) {
    logErrorMessage.textContent = "Coupon Discount Value Are Required.";
    return false;
  }
  if (!minPurchase) {
    logErrorMessage.textContent = "Minimum Purchase Amount Are Required.";
    return false;
  }
  if(assignedUsers.value != "allUsers"){
    console.log(selectedUsersId.value)
    if(!selectedUsersId.value){
      logErrorMessage.textContent = "Please select at least one user.";
      return false
    }
  }

  // Validate numeric fields
  if (isNaN(discountValue.value) || discountValue.value < 0) {
    logErrorMessage.textContent =
      "Discount Value must be a positive number.";
    return false;
  }
  if (isNaN(totalUsageLimit) || totalUsageLimit < 0) {
    logErrorMessage.textContent =
      "Total Usage Limit must be a positive number.";
    return false;
  }
  if (isNaN(minPurchase) || minPurchase < 0) {
    logErrorMessage.textContent =
      "Minimum Purchase Amount must be a positive number.";
    return false;
  }

  if (discountType.value == "Percentage") {
    if (discountValue.value > 100 || discountValue.value <= 0) {
      logErrorMessage.textContent =
        "Discount Value Must Be In Percentage(1-100%).";
      return false;
    }
  }

  try{
  const response = await fetch("/admin/addNewCoupon", {
    method: "POST",
    headers : {
      "Content-Type": "application/json",
    }
    ,body: JSON.stringify({
      couponName: couponName,
      couponCode: couponCode,
      description: description,
      discountType: discountType.value,
      discountValue: discountValue.value,
      totalUsageLimit: totalUsageLimit,
      minPurchase: minPurchase,
      assignedUsers: assignedUsers.value,
      selectedUsersId: selectedUsersId.value,
      expiryDate: expiryDate,
      startDate: startDate.value,
      maxDiscount: maxDiscount.value,
      couponStatus : document.getElementById("couponStatus").value,
      couponColor : document.getElementById("couponColor").value,
      assignedUsers : assignedUsers.value,
      selectedUsersId : selectedUsersId.value
    }),
  })

  const data = await response.json();
      if (!data.success) {
        logErrorMessage.textContent = data.message;
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
        return false;
      } else {
        window.location.href = data.redirectUrl;
      }
    }catch(err){
      console.log(err)
    }
})

const userSelectMessage = document.getElementById("userSelectMessage");
let selectedUserIds = []; // Store selected user IDs

// Function to get selected user IDs
function getSelectedUserIds() {
  selectedUserIds = []; // Reset array
  document.querySelectorAll(".user-checkbox:checked").forEach((checkbox) => {
    selectedUserIds.push(checkbox.value);
  });
}

// Handle "Select Users" button click
document.getElementById("selectUsersBtn").addEventListener("click", () => {
getSelectedUserIds();
if (selectedUserIds.length === 0) {
userSelectMessage.textContent = "Please select at least one user!"
return;
}

// Store selected IDs in a hidden field (for submission later)
document.getElementById("selectedUsersId").value = JSON.stringify(selectedUserIds);

// Close modal after selection
$("#users").modal("hide");
});
