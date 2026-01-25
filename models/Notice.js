const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: String,
  message: String,
  priority: { type: String, default: 'Normal' }
}, { timestamps: true });

module.exports = mongoose.model('Notice', NoticeSchema);