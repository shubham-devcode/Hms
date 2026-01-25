const express = require('express');
const router = express.Router();
const { ensureStudent } = require('../config/auth');

// Models
const User = require('../models/User');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const RoomChangeRequest = require('../models/RoomChangeRequest'); 

// ==========================================
// 1. STUDENT DASHBOARD
// ==========================================
router.get('/dashboard', ensureStudent, async (req, res) => {
  try {
    // 1. Student ka Data (Room ke saath)
    const student = await User.findById(req.user.id).populate('room').lean();
    
    // 2. Roommates ka Data (Agar room mila hua hai)
    let roomDetails = null;
    if (student.room) {
      roomDetails = await Room.findById(student.room._id).populate('occupants', 'name email').lean();
    }

    // 3. Apni Complaints fetch karo
    const myComplaints = await Complaint.find({ student: req.user.id }).sort({ createdAt: -1 }).lean();

    // 4. Room Change Request Status
    const roomRequest = await RoomChangeRequest.findOne({ student: req.user.id, status: 'pending' }).lean();

    res.render('student-dashboard', {
      user: student,
      room: roomDetails,
      complaints: myComplaints,
      roomRequest, // Pass request status
      layout: 'layout-dashboard' // ✅ Same Master Layout
    });

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Dashboard Error');
    res.redirect('/users/login');
  }
});

// ==========================================
// 2. RAISE COMPLAINT
// ==========================================
router.post('/complaint/add', ensureStudent, async (req, res) => {
  try {
    const { title, category, description } = req.body;

    if (!title || !description) {
      req.flash('error_msg', 'Please fill all fields');
      return res.redirect('/student/dashboard');
    }

    await Complaint.create({
      student: req.user.id,
      room: req.user.room,
      title,
      category,
      description,
      status: 'pending'
    });

    req.flash('success_msg', 'Complaint submitted successfully');
    res.redirect('/student/dashboard');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to submit complaint');
    res.redirect('/student/dashboard');
  }
});

// ==========================================
// 3. REQUEST ROOM CHANGE
// ==========================================
router.post('/request-room-change', ensureStudent, async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Check if already pending
    const existing = await RoomChangeRequest.findOne({ student: req.user.id, status: 'pending' });
    if(existing) {
        req.flash('error_msg', 'You already have a pending request.');
        return res.redirect('/student/dashboard');
    }

    await RoomChangeRequest.create({
        student: req.user.id,
        currentRoom: req.user.room,
        reason,
        status: 'pending'
    });

    req.flash('success_msg', 'Request sent to Admin.');
    res.redirect('/student/dashboard');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Request Failed');
    res.redirect('/student/dashboard');
  }
});

module.exports = router;
