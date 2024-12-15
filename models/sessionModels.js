const mongoose = require('mongoose');

// Define the Session model
const sessionSchema = new mongoose.Schema({
  session: { type: Object },
  expires: Date, 
});

module.exports = mongoose.model("sessionModels", sessionSchema);