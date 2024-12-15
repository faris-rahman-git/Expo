document.addEventListener("DOMContentLoaded", () => {
  const scrollPosition = sessionStorage.getItem("scrollPosition");
  if (scrollPosition) {
    window.scrollTo(0, parseInt(scrollPosition, 10)); // Restore scroll position
    sessionStorage.removeItem("scrollPosition"); // Clear the stored value
  }
});
