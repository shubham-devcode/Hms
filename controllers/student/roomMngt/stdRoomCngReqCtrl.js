// --- Models Imports ---
const RoomChangeRequest = require('../../../models/RoomChangeRequest');

//Student Room Change Request
exports.roomChangeRequest = async (req, res) => {
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
};

// Cancle Room Change Request
exports.cancleRoomChangeRequest = async (req, res) => {
    try {
        await RoomChangeRequest.findOneAndDelete({ student: req.user._id, status: 'pending' });
        req.flash('success_msg', 'Request Cancelled');
        res.redirect('/student/dashboard?section=room');
    } catch (err) {
        res.redirect('/student/dashboard?section=room');
    }
};