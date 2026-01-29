const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },

  // 2. Complaint Details
  category: {
    type: String,
    enum: ['Electricity', 'Plumbing', 'Furniture', 'WiFi', 'Cleaning', 'Food', 'Other', 'Waiting For Room'],
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  // (Premium) Photo Proof
  image: {
    type: String, // Path to uploaded image
    default: null
  },

  // 3. Admin Management
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },

  // Admin/Staff ka jawab (jab complaint solve ho jaye)
  adminComment: {
    type: String,
    default: ''
  },

  resolvedAt: {
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
