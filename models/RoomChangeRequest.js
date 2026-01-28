const mongoose = require('mongoose');

const RoomChangeRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // ✅ ADDED: The room student is CURRENTLY in
    currentRoom: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },

    // ✅ OPTIONAL: The room they WANT (if selected)
    room: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },

    // ✅ ADDED: Reason for change
    reason: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ['new', 'change'],
      default: 'change'
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomChangeRequest', RoomChangeRequestSchema);
