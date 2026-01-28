const mongoose = require('mongoose');

const GalleryImageSchema = new mongoose.Schema({
  
  // Image ka path/url (Zaroori hai)
  imageUrl: {
    type: String,
    required: true
  },

  // Image ke bare me chhota sa title (Optional)
  // e.g., "Main Entrance" or "Canteen Area"
  title: {
    type: String,
    trim: true,
    default: ''
  },

  // Category taaki future me filter kar sakein (Optional)
  // e.g., 'Exterior', 'Facilities', 'Events'
  category: {
    type: String,
    enum: ['General', 'Facilities', 'Events', 'Rooms'],
    default: 'General'
  },
  
  // Is image ko home page par dikhana hai ya nahi?
  isVisible: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('GalleryImage', GalleryImageSchema);
