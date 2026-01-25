const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student'
  },
  
  // Student Specific Fields
  rollNumber: {
    type: String,
    default: null
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  status: {
    type: String,
    // 👇 YAHAN ERROR THA: Humne 'on-leave' add kar diya hai
    enum: ['present', 'on-leave', 'absent'], 
    default: 'present'
  },
  
  profilePic: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
