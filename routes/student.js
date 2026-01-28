const express = require('express');
const router = express.Router();
const { ensureStudent } = require('../config/auth');

// --- Models Imports ---
const User = require('../models/User');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const RoomChangeRequest = require('../models/RoomChangeRequest');
const Notice = require('../models/Notice'); // ✅ ADDED

// Middleware Wrapper (Just to be safe)
router.use(ensureStudent);


// ==========================================
// 1. STUDENT DASHBOARD
// ==========================================
router.get('/dashboard', async (req, res) => {
  try {
    const section = req.query.section || 'profile'; // Default section

    // 1. Student Data (Fresh Fetch)
    const student = await User.findById(req.user._id).populate('room').lean();

    // 2. Room Details & Roommates
    let roomDetails = null;
    let roommates = [];
    
    if (student.room) {
      roomDetails = await Room.findById(student.room._id).populate('occupants', 'name email phone').lean();
      
      // Filter out self from roommates list
      if (roomDetails && roomDetails.occupants) {
        roommates = roomDetails.occupants.filter(occ => occ._id.toString() !== student._id.toString());
      }
    }

    // 3. Complaints
    const myComplaints = await Complaint.find({ student: req.user._id }).sort({ createdAt: -1 }).lean();

    // 4. Room Change Request Status
    const roomRequest = await RoomChangeRequest.findOne({ student: req.user._id, status: 'pending' }).lean();

    // 5. Notices (Latest 5)
    const notices = await Notice.find().sort({ createdAt: -1 }).limit(5).lean();

    // 6. Available Rooms (For Change Request Dropdown)
    const availableRooms = await Room.find({ $where: "this.occupants.length < this.capacity" }).select('roomNumber type').lean();

    res.render('student-dashboard', {
      user: student,
      section,
      room: roomDetails,
      roommates,
      complaints: myComplaints,
      roomRequest,
      notices,
      availableRooms,
      layout: 'layout-dashboard'
    });

  } catch (err) {
    console.error("Student Dashboard Error:", err);
    req.flash('error_msg', 'Something went wrong');
    res.redirect('/users/login');
  }
});


// ==========================================
// 2. PROFILE & SETTINGS
// ==========================================
router.get('/profile', (req, res) => {
    res.redirect('/student/dashboard?section=profile');
});

router.get('/room', (req, res) => {
    res.redirect('/student/dashboard?section=room');
});

router.get('/complaints', (req, res) => {
    res.redirect('/student/dashboard?section=complaints');
});


// ==========================================
// 3. RAISE COMPLAINT
// ==========================================
router.post('/complaint/add', async (req, res) => {
  try {
    const { title, category, description } = req.body;

    if (!title || !description) {
      req.flash('error_msg', 'Please fill all fields');
      return res.redirect('/student/dashboard?section=complaints');
    }

    await Complaint.create({
      student: req.user._id,
      room: req.user.room, // Can be null if no room assigned
      title,
      category,
      description,
      status: 'pending'
    });

    req.flash('success_msg', 'Complaint submitted successfully');
    res.redirect('/student/dashboard?section=complaints');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to submit complaint');
    res.redirect('/student/dashboard?section=complaints');
  }
});


// ==========================================
// 4. REQUEST ROOM CHANGE
// ==========================================
router.post('/request-room-change', async (req, res) => {
  try {
    const { reason, requestedRoomId } = req.body;

    // Check if user has a room currently
    if(!req.user.room) {
        req.flash('error_msg', 'You are not assigned to any room yet.');
        return res.redirect('/student/dashboard?section=room');
    }

    // Check existing request
    const existing = await RoomChangeRequest.findOne({ student: req.user._id, status: 'pending' });
    if(existing) {
        req.flash('error_msg', 'You already have a pending request.');
        return res.redirect('/student/dashboard?section=room');
    }

    await RoomChangeRequest.create({
        student: req.user._id,
        currentRoom: req.user.room,
        room: requestedRoomId || null, // Optional target room
        reason,
        status: 'pending'
    });

    req.flash('success_msg', 'Room change request sent to Admin.');
    res.redirect('/student/dashboard?section=room');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Request Failed');
    res.redirect('/student/dashboard?section=room');
  }
});


// ==========================================
// 5. DELETE/CANCEL REQUEST
// ==========================================
router.post('/request-room-change/cancel', async (req, res) => {
    try {
        await RoomChangeRequest.findOneAndDelete({ student: req.user._id, status: 'pending' });
        req.flash('success_msg', 'Request Cancelled');
        res.redirect('/student/dashboard?section=room');
    } catch (err) {
        res.redirect('/student/dashboard?section=room');
    }
});

module.exports = router;
