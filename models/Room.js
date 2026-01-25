const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Single', 'Double', 'Triple'],
    default: 'Double'
  },
  capacity: {
    type: Number,
    required: true,
    default: 2
  },
  price: {
    type: Number,
    default: 5000
  },
  features: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  occupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// ⚠️ Note: Humne yahan se purana 'pre-save' middleware hata diya hai
// jo "next is not a function" error de raha tha.

module.exports = mongoose.model('Room', RoomSchema);
