function getContrastColor(hex) {
  // Convert HEX to RGB
  let r = parseInt(hex.substr(1, 2), 16);
  let g = parseInt(hex.substr(3, 2), 16);
  let b = parseInt(hex.substr(5, 2), 16);

  // Calculate brightness (YIQ formula)
  let brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return white (#FFFFFF) for dark backgrounds, black (#000000) for light backgrounds
  return brightness > 128 ? "#000000" : "#FFFFFF";
}

module.exports = { getContrastColor };