const express = require('express');
const router = express.Router();
const { ensureStaff } = require('../config/auth');

// Models Imports
const User = require('../models/User');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const bcrypt = require('bcryptjs');


// ==========================================
// 1. STAFF DASHBOARD (Main Logic)
// ==========================================
router.get('/dashboard', ensureStaff, async (req, res) => {
  try {
    // 1. Fetch Data in Parallel (Faster)
    const [students, rooms, complaints] = await Promise.all([
      User.find({ role: 'student' }).populate('room').sort({ name: 1 }).lean(),
      Room.find().populate('occupants').sort({ roomNumber: 1 }).lean(),
     Complaint.find({ 
          status: { $in: ['pending', 'in-progress'] } 
      }).populate('student').sort({ createdAt: 1 }).lean()
    ]);

    // 2. Calculate Stats
    let totalSeats = 0;
    let occupiedSeats = 0;
    rooms.forEach(r => {
      totalSeats += r.capacity;
      occupiedSeats += (r.occupants ? r.occupants.length : 0);
    });

    const stats = {
      totalStudents: students.length,
      presentStudents: students.filter(s => s.status === 'present').length,
      onHoliday: students.filter(s => s.status !== 'present').length,
      occupancyRate: totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0
    };

    // 3. Render View
    res.render('staff-dashboard', {
      user: req.user, // Current Logged in Staff
      students,
      rooms,
      complaints,
      stats,
      layout: 'layout-dashboard' // ✅ Uses the new Dashboard Layout
    });

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/users/login');
  }
});

// ==========================================
// 2. ATTENDANCE SYSTEM (Toggle Status)
// ==========================================
router.post('/student/:id/status', ensureStaff, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    
    // Toggle Status: Agar present hai to holiday, nahi to present
    student.status = (student.status === 'present') ? 'on-leave' : 'present';
    await student.save();

    req.flash('success_msg', `Status updated for ${student.name}`);
    res.redirect('/staff/dashboard');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Update failed');
    res.redirect('/staff/dashboard');
  }
});

// ==========================================
// 3. ROOM MANAGEMENT (Assign/Remove)
// ==========================================

// Assign Room
router.post('/room/assign', ensureStaff, async (req, res) => {
  try {
    const { studentId, roomId } = req.body;

    const student = await User.findById(studentId);
    const room = await Room.findById(roomId);

    // Check if Room Full
    if (room.occupants.length >= room.capacity) {
      req.flash('error_msg', 'Selected Room is FULL!');
      return res.redirect('/staff/dashboard');
    }

    // 1. Agar student kisi purane room me tha, to wahan se nikalo
    if (student.room) {
      await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
    }

    // 2. Naye Room me daalo
    await Room.findByIdAndUpdate(roomId, { $addToSet: { occupants: student._id } });
    
    // 3. Student ka record update karo
    student.room = roomId;
    await student.save();

    req.flash('success_msg', `${student.name} assigned to Room ${room.roomNumber}`);
    res.redirect('/staff/dashboard');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Assignment failed');
    res.redirect('/staff/dashboard');
  }
});

// Remove Student from Room
router.post('/room/remove', ensureStaff, async (req, res) => {
  try {
    const { studentId, roomId } = req.body;

    // Room se nikalo
    await Room.findByIdAndUpdate(roomId, { $pull: { occupants: studentId } });

    // Student ka room null karo
    await User.findByIdAndUpdate(studentId, { room: null });

    req.flash('warning_msg', 'Student removed from room');
    res.redirect('/staff/dashboard');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Action failed');
    res.redirect('/staff/dashboard');
  }
});

// ==========================================
// 4. COMPLAINT RESOLUTION
// ==========================================
router.post('/complaint/:id/resolve', ensureStaff, async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, { 
        status: 'resolved',
        resolvedAt: Date.now()
    });
    
    req.flash('success_msg', 'Complaint marked as Resolved');
    res.redirect('/staff/dashboard');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Action failed');
    res.redirect('/staff/dashboard');
  }
});

// complaint update
router.post('/complaint/:id/update', ensureStaff, async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };
        
        if (status === 'resolved') {
            updateData.resolvedAt = Date.now();
        }

        await Complaint.findByIdAndUpdate(req.params.id, updateData);
        req.flash('success_msg', `Complaint marked as ${status}`);
        res.redirect('/staff/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not update complaint');
        res.redirect('/staff/dashboard');
    }
});


// ==========================================
// 5. ADD STUDENT (By Staff)
// ==========================================
router.post('/student/add', ensureStaff, async (req, res) => {
  try {
    const { name, email } = req.body;

    // 1. Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error_msg', 'Email is already registered');
      return res.redirect('/staff/dashboard');
    }

    // 2. Generate Next Roll Number
    const lastStudent = await User.findOne({ role: 'student' }).sort({ _id: -1 });
    let nextRoll = '101';
    if (lastStudent && lastStudent.rollNumber && !isNaN(lastStudent.rollNumber)) {
      nextRoll = (parseInt(lastStudent.rollNumber) + 1).toString();
    }

    // 3. Create Password & User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt); // Default Password

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      rollNumber: nextRoll,
      role: 'student',
      room: null,
      password: hashedPassword,
    });

    req.flash('success_msg', `Student Added Successfully! Roll No: ${nextRoll}`);
    res.redirect('/staff/dashboard');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding student');
    res.redirect('/staff/dashboard');
  }
});


module.exports = router;
