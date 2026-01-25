const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ensureAdmin } = require('../config/auth');

// --- Models Imports ---
const User = require('../models/User');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const GalleryImage = require('../models/galleryImages');
const RoomChangeRequest = require('../models/RoomChangeRequest'); // ✅ Uncommented for Advanced Feature

// ==================================================
// 1. 🚀 PRO ADMIN DASHBOARD (Search + Stats + Parallel Load)
// ==================================================
router.get('/dashboard', ensureAdmin, async (req, res) => {
  try {
    // 🔍 SEARCH LOGIC
    // Agar URL me ?search=Rahul hai, to filter karo
    const searchQuery = req.query.search;
    let studentFilter = { role: 'student' };
    
    if (searchQuery) {
      studentFilter = {
        role: 'student',
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } }, // Case insensitive name search
          { email: { $regex: searchQuery, $options: 'i' } },
          { rollNumber: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }

    // Parallel Data Fetching
    const [students, staff, rooms, complaints, galleryImages, roomRequests] = await Promise.all([
      User.find(studentFilter).populate('room').sort({ rollNumber: 1 }).lean(),
      User.find({ role: 'staff' }).lean(),
      Room.find().populate('occupants').sort({ roomNumber: 1 }).lean(),
      Complaint.find({ status: 'pending' }).populate('student').sort({ createdAt: -1 }).lean(),
      GalleryImage.find().sort({ createdAt: -1 }).lean(),
      RoomChangeRequest.find({ status: 'pending' }).populate('student').populate('room').lean() // ✅ New Feature
    ]);

    // --- Advanced Stats ---
    let totalSeats = 0;
    let occupiedSeats = 0;

    rooms.forEach(r => {
      totalSeats += r.capacity;
      occupiedSeats += (r.occupants ? r.occupants.length : 0);
    });

    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

    // --- Render View ---
    res.render('admin-dashboard', {
      user: req.user,
      stats: {
        totalStudents: students.length,
        totalStaff: staff.length,
        totalSeats,
        occupiedSeats,
        availableSeats: totalSeats - occupiedSeats,
        occupancyRate,
        pendingRequests: roomRequests.length // Notification badge ke liye
      },
      students,
      staff,
      rooms,
      complaints,
      galleryImages,
      roomRequests, // ✅ Requests pass kiye
      searchQuery,  // Taaki search box me likha rahe
      section: req.query.section || 'dashboard', 
      layout: 'layout-dashboard'
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    req.flash('error_msg', 'Critical Error: Unable to load dashboard.');
    res.redirect('/users/login');
  }
});

// ==================================================
// 2. 📥 DATA EXPORT FEATURE (Premium)
// ==================================================
// Download Student List as CSV
router.get('/students/export', ensureAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).populate('room');
    
    // CSV Header
    let csv = 'Roll No,Name,Email,Room,Status\n';
    
    // CSV Rows
    students.forEach(s => {
      const roomNo = s.room ? s.room.roomNumber : 'Unassigned';
      csv += `${s.rollNumber || 'N/A'},${s.name},${s.email},${roomNo},${s.status}\n`;
    });

    // Send File
    res.header('Content-Type', 'text/csv');
    res.attachment('student_list.csv');
    res.send(csv);

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Export Failed');
    res.redirect('/admin/dashboard?section=students');
  }
});

// ==================================================
// 3. 🏠 ROOM MANAGEMENT
// ==================================================

// Add Room
router.post('/rooms/add', ensureAdmin, async (req, res) => {
  try {
    let { roomNumber, type, capacity, price, features, roomImage } = req.body;
    roomNumber = roomNumber.trim();

    const existingRoom = await Room.findOne({ roomNumber: { $regex: new RegExp(`^${roomNumber}$`, 'i') } });
    if (existingRoom) {
      req.flash('error_msg', `Room ${roomNumber} already exists!`);
      return res.redirect('/admin/dashboard?section=rooms');
    }

    let imageArray = [];
    if(roomImage && roomImage.trim().length > 0){
        imageArray.push(roomImage.trim());
    } else {
        imageArray.push('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=500&q=60');
    }

    await Room.create({
      roomNumber,
      type,
      capacity,
      price: price || 0,
      features: features ? features.split(',').map(f => f.trim()) : [],
      images: imageArray
    });

    req.flash('success_msg', `Room ${roomNumber} added successfully`);
    res.redirect('/admin/dashboard?section=rooms');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to add room');
    res.redirect('/admin/dashboard?section=rooms');
  }
});

// Update Room
router.post('/rooms/edit/:id', ensureAdmin, async (req, res) => {
  try {
    const { type, capacity, price } = req.body;
    const room = await Room.findById(req.params.id);

    if (room.occupants.length > parseInt(capacity)) {
      req.flash('error_msg', `Cannot reduce capacity. ${room.occupants.length} students inside.`);
      return res.redirect('/admin/dashboard?section=rooms');
    }

    await Room.findByIdAndUpdate(req.params.id, { type, capacity, price });
    req.flash('success_msg', 'Room updated successfully');
    res.redirect('/admin/dashboard?section=rooms');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Update failed');
    res.redirect('/admin/dashboard?section=rooms');
  }
});

// Delete Room
router.post('/rooms/delete/:id', ensureAdmin, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (room.occupants.length > 0) {
      req.flash('error_msg', 'Cannot delete occupied room');
      return res.redirect('/admin/dashboard?section=rooms');
    }
    await Room.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Room deleted');
    res.redirect('/admin/dashboard?section=rooms');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Delete failed');
    res.redirect('/admin/dashboard?section=rooms');
  }
});

// ==================================================
// 4. 🎓 STUDENT MANAGEMENT & REQUESTS
// ==================================================

// Add Student
router.post('/students/add', ensureAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/admin/dashboard?section=students');
    }

    const lastStudent = await User.findOne({ role: 'student' }).sort({ _id: -1 });
    let nextRoll = '101';
    if (lastStudent && lastStudent.rollNumber && !isNaN(lastStudent.rollNumber)) {
      nextRoll = (parseInt(lastStudent.rollNumber) + 1).toString();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      rollNumber: nextRoll,
      role: 'student',
      room: null,
      password: hashedPassword,
    });

    req.flash('success_msg', `Student Added! Roll: ${nextRoll}`);
    res.redirect('/admin/dashboard?section=students');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding student');
    res.redirect('/admin/dashboard?section=students');
  }
});

// Manual Assign Room
router.post('/students/assign/:studentId', ensureAdmin, async (req, res) => {
  const { roomId } = req.body;
  try {
    const student = await User.findById(req.params.studentId);
    const newRoom = await Room.findById(roomId);

    if (!student || !newRoom) {
      req.flash('error_msg', 'Invalid Data');
      return res.redirect('/admin/dashboard?section=students');
    }

    if (newRoom.occupants.length >= newRoom.capacity) {
      req.flash('error_msg', 'Room is Full!');
      return res.redirect('/admin/dashboard?section=students');
    }

    // Old Room se nikalo
    if (student.room) {
      await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
    }

    // New Room me dalo
    await Room.findByIdAndUpdate(newRoom._id, { $addToSet: { occupants: student._id } });
    student.room = newRoom._id;
    await student.save();

    req.flash('success_msg', `Moved to Room ${newRoom.roomNumber}`);
    res.redirect('/admin/dashboard?section=students');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Assignment failed');
    res.redirect('/admin/dashboard?section=students');
  }
});

// ⭐ NEW: Handle Room Change Requests (Approve/Reject)
router.post('/requests/:id/:action', ensureAdmin, async (req, res) => {
  try {
    const { id, action } = req.params; // action = 'approve' or 'reject'
    const request = await RoomChangeRequest.findById(id).populate('student room');

    if(!request) {
        req.flash('error_msg', 'Request not found');
        return res.redirect('/admin/dashboard?section=requests');
    }

    if(action === 'reject') {
        request.status = 'rejected';
        await request.save();
        req.flash('warning_msg', 'Request Rejected');
    } 
    else if (action === 'approve') {
        // Logic: Move student to requested room
        const student = await User.findById(request.student._id);
        const newRoom = await Room.findById(request.room._id);

        if(newRoom.occupants.length >= newRoom.capacity) {
            req.flash('error_msg', 'Target room is now Full. Cannot Approve.');
            return res.redirect('/admin/dashboard?section=requests');
        }

        // Old room clear
        if(student.room) {
            await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
        }
        
        // Assign New
        await Room.findByIdAndUpdate(newRoom._id, { $addToSet: { occupants: student._id } });
        student.room = newRoom._id;
        await student.save();

        request.status = 'approved';
        await request.save();
        req.flash('success_msg', 'Request Approved & Room Changed');
    }

    res.redirect('/admin/dashboard?section=requests');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Action failed');
    res.redirect('/admin/dashboard?section=requests');
  }
});

// Delete Student
router.post('/students/delete/:id', ensureAdmin, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
        req.flash('error_msg', 'Student not found');
        return res.redirect('/admin/dashboard?section=students');
    }

    if (student.room) {
      await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
    }

    await User.deleteOne({ _id: student._id });
    await Complaint.deleteMany({ student: student._id });
    await RoomChangeRequest.deleteMany({ student: student._id }); // Cleanup requests too

    req.flash('success_msg', 'Student deleted');
    res.redirect('/admin/dashboard?section=students');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Delete failed');
    res.redirect('/admin/dashboard?section=students');
  }
});

// ==================================================
// 5. STAFF & GALLERY & UTILS
// ==================================================

// Add Staff
router.post('/staff/add', ensureAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      req.flash('error_msg', 'Email in use');
      return res.redirect('/admin/dashboard?section=staff-register');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.create({ name, email, password: hashedPassword, role: 'staff' });
    req.flash('success_msg', 'Staff Added');
    res.redirect('/admin/dashboard?section=staff');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed');
    res.redirect('/admin/dashboard?section=staff-register');
  }
});

// Delete Staff
router.post('/staff/delete/:id', ensureAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      req.flash('error_msg', "Can't delete self");
      return res.redirect('/admin/dashboard?section=staff');
    }
    await User.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Staff removed');
    res.redirect('/admin/dashboard?section=staff');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Delete failed');
    res.redirect('/admin/dashboard?section=staff');
  }
});

// Gallery Add
router.post('/gallery/add', ensureAdmin, async (req, res) => {
  try {
    const { imageUrl, title, category } = req.body;
    if(!imageUrl) {
         req.flash('error_msg', 'URL required');
         return res.redirect('/admin/dashboard?section=gallery');
    }
    await GalleryImage.create({ imageUrl: imageUrl.trim(), title, category });
    req.flash('success_msg', 'Image Added');
    res.redirect('/admin/dashboard?section=gallery');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed');
    res.redirect('/admin/dashboard?section=gallery');
  }
});

// Gallery Delete
router.post('/gallery/delete/:id', ensureAdmin, async (req, res) => {
  try {
    await GalleryImage.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Image Deleted');
    res.redirect('/admin/dashboard?section=gallery');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed');
    res.redirect('/admin/dashboard?section=gallery');
  }
});

// Reset Password
router.post('/users/:id/reset-password', ensureAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);
    if (password.length < 6) {
      req.flash('error_msg', 'Min 6 chars required');
      const section = user.role === 'staff' ? 'staff' : 'students';
      return res.redirect(`/admin/dashboard?section=${section}`);
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    req.flash('success_msg', `Password reset for ${user.name}`);
    const section = user.role === 'staff' ? 'staff' : 'students';
    res.redirect(`/admin/dashboard?section=${section}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed');
    res.redirect('/admin/dashboard');
  }
});

// Resolve Complaint
router.post('/complaints/:id/resolve', ensureAdmin, async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, { status: 'resolved', resolvedAt: Date.now() });
    req.flash('success_msg', 'Resolved');
    res.redirect('/admin/dashboard?section=complaints');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed');
    res.redirect('/admin/dashboard?section=complaints');
  }
});

module.exports = router;
