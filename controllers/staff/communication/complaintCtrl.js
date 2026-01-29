// --- Models Imports ---
const User = require('../models/User');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const RoomChangeRequest = require('../models/RoomChangeRequest');

// Complaint
exports.complaint = async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };
        if (status === 'resolved') updateData.resolvedAt = Date.now();

        await Complaint.findByIdAndUpdate(req.params.id, updateData);
        req.flash('success_msg', 'Complaint Updated');
        res.redirect('/staff/dashboard'); // ✅ FIX
    } catch (err) {
        res.redirect('/staff/dashboard');
    }
};

exports.resComplaint = async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, { status: 'resolved', resolvedAt: Date.now() });
    req.flash('success_msg', 'Complaint Resolved');
    res.redirect('/staff/dashboard');
  } catch (err) {
    res.redirect('/staff/dashboard');
  }
};