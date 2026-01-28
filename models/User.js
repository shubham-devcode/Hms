const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // ==========================
  // 1. LOGIN INFO (Auto & Form)
  // ==========================
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
  
  // ==========================
  // 2. PERSONAL DETAILS (Form)
  // ==========================
  phone: {
    type: String,
    required: true, // Contact Number jaruri hai
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dob: {
    type: Date, // Date of Birth
    default: null
  },
  address: {
    type: String, // Permanent Address
    default: ''
  },
  course: {
    type: String, // e.g. B.Tech, BCA
    default: ''
  },
  year: {
    type: String, // e.g. 1st Year, 2nd Year
    default: ''
  },

  // ==========================
  // 3. GUARDIAN DETAILS (Form)
  // ==========================
  guardianName: {
    type: String,
    default: ''
  },
  guardianPhone: {
    type: String,
    default: ''
  },

  // ==========================
  // 4. SYSTEM & ADMIN FIELDS
  // ==========================
  isApproved: { 
    type: Boolean, 
    default: false // ✅ New students cannot login until Admin approves
  },
  rollNumber: {
    type: String,
    default: 'TBD' // Admin baad me assign karega
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  profilePic: {
    type: String,
    default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  },

  // ==========================
  // 5. ATTENDANCE & GATE PASS
  // ==========================
  status: {
    type: String, 
    enum: ['present', 'on-leave', 'absent'], 
    default: 'present'
  },

  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },
  
  isOut: {
    type: Boolean,
    default: false // False = Hostel ke andar hai
  },
  outTime: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
