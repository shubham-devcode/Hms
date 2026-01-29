// --- Models Imports ---
const User = require('../../../models/User');
const Room = require('../../../models/Room');
const Complaint = require('../../../models/Complaint');
const RoomChangeRequest = require('../../../models/RoomChangeRequest');
const Notice = require('../../../models/Notice'); 

// Student Dashboard
exports.dashboard = async (req, res) => {
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
};