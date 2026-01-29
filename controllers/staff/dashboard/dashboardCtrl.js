// --- Models Imports ---
const User = require('../../../models/User');
const Room = require('../../../models/Room');
const Complaint = require('../../../models/Complaint');
const Notice = require('../../../models/Notice');
const RoomChangeRequest = require('../../../models/RoomChangeRequest');

// Staff Dashboard
exports.dashboard = async (req, res) => {
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
};