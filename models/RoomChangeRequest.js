const mongoose = require('mongoose');

const RoomChangeRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    type: {
      type: String,
      enum: ['new', 'change'],
      default: 'new'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }   // 🔥 THIS IS THE FIX
);

module.exports = mongoose.model('RoomChangeRequest', RoomChangeRequestSchema);