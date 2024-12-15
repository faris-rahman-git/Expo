"use strict";

let cropper;
const fileInput = document.getElementById("customFile");
const previewContainer = document.getElementById("imagePreviewContainer");
const cropContainer = document.getElementById("cropContainer");
const imageToCrop = document.getElementById("imageToCrop");
const cropButton = document.getElementById("cropButton");
let selectedFiles = [];
let fileQueue = []; // Queue to process multiple files

// Handle file selection and initialize Cropper.js
fileInput.addEventListener("change", function (event) {
  fileQueue = Array.from(event.target.files); // Store selected files

  if (fileQueue.length > 0) {
    loadNextImage(); // Load first image for cropping
  }
});

// Load and crop images one by one
function loadNextImage() {
  if (fileQueue.length === 0) return; // No more files to process

  const file = fileQueue.shift(); // Get first file from queue
  const reader = new FileReader();

  reader.onload = function (e) {
    imageToCrop.src = e.target.result;
    cropContainer.style.display = "block";

    // Initialize Cropper.js
    if (cropper) cropper.destroy();
    cropper = new Cropper(imageToCrop, {
      aspectRatio: 600 / 690, // Match backend ratio
      viewMode: 2,
    });
  };

  reader.readAsDataURL(file);
}

// Handle cropping
cropButton.addEventListener("click", function () {
  const croppedImageDataURL = cropper
    .getCroppedCanvas({ width: 600, height: 690 }) // Ensure correct size
    .toDataURL("image/jpeg");

  fetch(croppedImageDataURL)
    .then((res) => res.blob())
    .then((blob) => {
      const croppedFile = new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" });

      selectedFiles.push(croppedFile);

      // Display cropped preview
      const previewDiv = document.createElement("div");
      previewDiv.className = "image-preview";

      const img = document.createElement("img");
      img.src = croppedImageDataURL;
      img.alt = "Cropped Image";

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "×";
      removeBtn.onclick = function () {
        previewDiv.remove();
        selectedFiles = selectedFiles.filter((f) => f !== croppedFile);
      };

      previewDiv.appendChild(img);
      previewDiv.appendChild(removeBtn);
      previewContainer.appendChild(previewDiv);

      cropContainer.style.display = "none"; // Hide crop container

      // Load next image if there are more files in queue
      if (fileQueue.length > 0) {
        loadNextImage();
      }
    });
});

// Update file input before submission
function updateFileInput() {
  const dataTransfer = new DataTransfer();
  selectedFiles.forEach((file) => dataTransfer.items.add(file));
  fileInput.files = dataTransfer.files;
}


function showCropContainer() {
  document.getElementById("cropContainer").style.display = "flex";
}

function hideCropContainer() {
  document.getElementById("cropContainer").style.display = "none";
}

// Attach show function when user selects an image
document.getElementById("customFile").addEventListener("change", function () {
  if (this.files.length > 0) {
    showCropContainer();
  }
});

// Attach hide function when cropping is done
document.getElementById("cropButton").addEventListener("click", function () {
  hideCropContainer();
});
