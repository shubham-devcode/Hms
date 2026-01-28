// --- Models Imports ---
const User = require('../../models/User');
const Room = require('../../models/Room');
const Complaint = require('../../models/Complaint');
const GalleryImage = require('../../models/GalleryImage');
const RoomChangeRequest = require('../../models/RoomChangeRequest');
const Notice = require('../../models/Notice');


// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const searchQuery = req.query.search;
    const section = req.query.section || 'dashboard';

    //  Approved Students List 
    let studentFilter = { role: 'student', isApproved: true };
    
    if (searchQuery) {
      studentFilter = {
        role: 'student',
        isApproved: true, 
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { rollNumber: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }

    // Fetch Data
    const [students, staff, rooms, complaints, galleryImages, roomRequests, pendingUsers, notices] = await Promise.all([
      User.find(studentFilter).populate('room').sort({ rollNumber: 1 }).lean(),
      User.find({ role: 'staff' }).sort({ name: 1 }).lean(),
      Room.find().populate('occupants').sort({ roomNumber: 1 }).lean(),
      Complaint.find({ status: 'pending' }).populate('student').sort({ createdAt: -1 }).lean(),
      GalleryImage.find().sort({ createdAt: -1 }).lean(),
      RoomChangeRequest.find({ status: 'pending' }).populate('student').populate('currentRoom').lean(),
      User.find({ role: 'student', isApproved: false }).sort({ createdAt: -1 }).lean(),
      Notice.find().sort({ createdAt: -1 }).lean()
    ]);

    //  Stats Logic
    let totalSeats = 0, occupiedSeats = 0;
    rooms.forEach(r => {
      totalSeats += r.capacity;
      occupiedSeats += (r.occupants ? r.occupants.length : 0);
    });
    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

    // Staff Stats
    const staffStats = {
        total: staff.length,
        active: staff.filter(s => s.status === 'present').length,
        onLeave: staff.filter(s => s.status === 'on-leave').length
    };

    res.render('admin-dashboard', {
      user: req.user,
      stats: {
        totalStudents: students.length, 
        staffStats, //  New Staff Stats
        occupancyRate,
        pendingRequests: roomRequests.length,
        pendingApprovals: pendingUsers.length 
      },
      students, staff, rooms, complaints, galleryImages, roomRequests, pendingUsers, notices,
      searchQuery, section, path: '/dashboard', layout: 'layout-dashboard'
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.redirect('/');
  }
};