const express = require('express');
const router = express.Router();
const { ensureStaff } = require('../config/auth');
const bcrypt = require('bcryptjs');

// --- Models Imports ---
const User = require('../models/User');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const RoomChangeRequest = require('../models/RoomChangeRequest');

// ==========================================
// 1. STAFF DASHBOARD
// ==========================================
router.get('/dashboard', ensureStaff, async (req, res) => {
  try {
    const section = req.query.section || 'dashboard';
    const searchQuery = req.query.search;

    let studentFilter = { role: 'student', isApproved: true };
    
    if (searchQuery) {
        studentFilter.$or = [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
            { rollNumber: { $regex: searchQuery, $options: 'i' } }
        ];
    }

    const [students, rooms, complaints, notices, roomRequests] = await Promise.all([
        User.find(studentFilter).populate('room').sort({ rollNumber: 1 }).lean(),
        Room.find().populate('occupants').lean(),
        Complaint.find({ status: { $in: ['pending', 'in-progress'] } }).populate('student').sort({ createdAt: 1 }).lean(),
        Notice.find().sort({ createdAt: -1 }).limit(5).lean(),
        RoomChangeRequest.find({ status: 'pending' }).populate('student').populate('currentRoom').lean()
    ]);

    const stats = {
      totalStudents: students.length,
      presentStudents: students.filter(s => s.status === 'present' && !s.isOut).length,
      onLeave: students.filter(s => s.status === 'on-leave').length,
      outOfHostel: students.filter(s => s.isOut).length,
      pendingComplaints: complaints.length,
      pendingRequests: roomRequests.length
    };

    res.render('staff-dashboard', {
      user: req.user,
      section,
      students,
      rooms,
      complaints,
      notices,
      roomRequests,
      stats,
      searchQuery,
      layout: 'layout-dashboard'
    });

  } catch (err) {
    console.error("Staff Dashboard Error:", err);
    res.redirect('/');
  }
});


// ==========================================
// 2. ATTENDANCE (Redirect -> Dashboard)
// ==========================================
router.post('/student/:id/status', ensureStaff, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.redirect('/staff/dashboard');

    student.status = (student.status === 'present') ? 'on-leave' : 'present';
    if(student.status === 'on-leave') student.isOut = false;

    await student.save();
    req.flash('success_msg', `Status updated for ${student.name}`);
    
    // ✅ FIX: Go to Dashboard explicitly
    res.redirect('/staff/dashboard');

  } catch (err) {
    res.redirect('/staff/dashboard');
  }
});


// ==========================================
// 3. GATE PASS (Redirect -> Gate Section)
// ==========================================
router.post('/student/:id/toggle-gate', ensureStaff, async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student) return res.redirect('/staff/dashboard?section=gate');

        if (student.isOut) {
            student.isOut = false;
            student.outTime = null;
            req.flash('success_msg', `✅ ${student.name} marked IN.`);
        } else {
            student.isOut = true;
            student.outTime = new Date();
            req.flash('warning_msg', `👋 ${student.name} marked OUT.`);
        }

        await student.save();
        
        // ✅ FIX: Go to Gate Section
        res.redirect('/staff/dashboard?section=gate');

    } catch (err) {
        res.redirect('/staff/dashboard?section=gate');
    }
});


// ==========================================
// 4. ROOM MANAGEMENT (Redirect -> Dashboard)
// ==========================================
router.post('/room/assign', ensureStaff, async (req, res) => {
  try {
    const { studentId, roomId } = req.body;
    const student = await User.findById(studentId);
    const room = await Room.findById(roomId);

    if (room.occupants.length >= room.capacity) {
      req.flash('error_msg', 'Room is FULL!');
      return res.redirect('/staff/dashboard');
    }

    if (student.room) {
      await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
    }

    await Room.findByIdAndUpdate(roomId, { $addToSet: { occupants: student._id } });
    student.room = roomId;
    await student.save();

    req.flash('success_msg', 'Room Assigned');
    res.redirect('/staff/dashboard'); // ✅ FIX

  } catch (err) {
    res.redirect('/staff/dashboard');
  }
});

router.post('/room/remove', ensureStaff, async (req, res) => {
  try {
    const { studentId, roomId } = req.body;
    await Room.findByIdAndUpdate(roomId, { $pull: { occupants: studentId } });
    await User.findByIdAndUpdate(studentId, { room: null });

    req.flash('warning_msg', 'Student removed from room');
    res.redirect('/staff/dashboard'); // ✅ FIX

  } catch (err) {
    res.redirect('/staff/dashboard');
  }
});


// ==========================================
// 5. COMPLAINTS (Redirect -> Dashboard)
// ==========================================
router.post('/complaint/:id/update', ensureStaff, async (req, res) => {
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
});

router.post('/complaint/:id/resolve', ensureStaff, async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, { status: 'resolved', resolvedAt: Date.now() });
    req.flash('success_msg', 'Complaint Resolved');
    res.redirect('/staff/dashboard'); // ✅ FIX
  } catch (err) {
    res.redirect('/staff/dashboard');
  }
});


// ==========================================
// 6. ADD STUDENT (Redirect -> Dashboard)
// ==========================================
router.post('/student/add', ensureStaff, async (req, res) => {
  try {
    const { name, email, phone, gender, course, address, guardianName, guardianPhone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/staff/dashboard');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    await User.create({
      name: name.trim(), email: email.toLowerCase().trim(), phone, gender, course, address, guardianName, guardianPhone,
      rollNumber: 'TBD', role: 'student', isApproved: false, room: null, password: hashedPassword, status: 'present', isOut: false
    });

    req.flash('success_msg', 'Student Sent for Approval');
    res.redirect('/staff/dashboard'); // ✅ FIX

  } catch (err) {
    req.flash('error_msg', 'Error adding student');
    res.redirect('/staff/dashboard');
  }
});


// ==========================================
// 7. ROOM REQUESTS (Redirect -> Request Section)
// ==========================================
router.post('/request/:id/approve', ensureStaff, async (req, res) => {
    try {
        const { targetRoomId } = req.body;
        const request = await RoomChangeRequest.findById(req.params.id);

        if (!request || request.status !== 'pending') {
            return res.redirect('/staff/dashboard?section=requests'); // ✅ FIX
        }

        const student = await User.findById(request.student);
        const newRoom = await Room.findById(targetRoomId);

        if(!newRoom || newRoom.occupants.length >= newRoom.capacity) {
            req.flash('error_msg', 'Room Full');
            return res.redirect('/staff/dashboard?section=requests');
        }

        if (student.room) await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });

        newRoom.occupants.push(student._id);
        await newRoom.save();

        student.room = newRoom._id;
        await student.save();

        request.status = 'approved';
        await request.save();

        req.flash('success_msg', 'Request Approved');
        res.redirect('/staff/dashboard?section=requests'); // ✅ FIX

    } catch (err) {
        res.redirect('/staff/dashboard?section=requests');
    }
});

router.post('/request/:id/reject', ensureStaff, async (req, res) => {
    try {
        await RoomChangeRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        req.flash('warning_msg', 'Request Rejected');
        res.redirect('/staff/dashboard?section=requests'); // ✅ FIX
    } catch (err) {
        res.redirect('/staff/dashboard?section=requests');
    }
});

module.exports = router;
