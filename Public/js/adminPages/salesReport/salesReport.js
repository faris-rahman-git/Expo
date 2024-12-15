window.addEventListener("beforeunload", () => {
  localStorage.setItem("scrollPosition", window.scrollY);
});

// Restore scroll position after the page loads
window.addEventListener("load", () => {
  const scrollPosition = localStorage.getItem("scrollPosition");
  if (scrollPosition) {
    window.scrollTo(0, parseInt(scrollPosition, 10));
  }
});

function salesReportFilterFunction() {
  const custom = document.getElementById("custom").value;
  if (custom == "Custom") {
    const customBtn = document.getElementById("customBtn");
    customBtn.style.display = "block ";
  } else {
    document.getElementById("salesReportFilter").submit();
  }
}
function validateForm() {
  const toDate = document.getElementById("toDate").value.trim();

  const fromDate = document.getElementById("fromDate").value.trim();

  const logErrorMessage = document.getElementById("logErrorMessage");

  // Check required fields for both Add and Edit
  if (!fromDate) {
    logErrorMessage.textContent = "From Date Required";
    return false;
  }
  if (!toDate) {
    logErrorMessage.textContent = "To Date Required";
    return false;
  }
  if (new Date(fromDate) > new Date(toDate)) {
    logErrorMessage.textContent = "From Must Less Than To";
    return false;
  }
  if (new Date(toDate) > Date.now()) {
    logErrorMessage.textContent =
      "Invalid To Date (To Date Must Less Than Today)";
    return false;
  }
  return true;
}
