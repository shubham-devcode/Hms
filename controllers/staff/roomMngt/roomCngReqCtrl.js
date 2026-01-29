// --- Models Imports ---
const User = require('../../../models/User');
const Room = require('../../../models/Room');
const RoomChangeRequest = require('../../../models/RoomChangeRequest');

// Room Change Request and Aprove
exports.reqApprove = async (req, res) => {
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
};

// Reject Room Change Request
exports.reqReject = async (req, res) => {
    try {
        await RoomChangeRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        req.flash('warning_msg', 'Request Rejected');
        res.redirect('/staff/dashboard?section=requests'); // ✅ FIX
    } catch (err) {
        res.redirect('/staff/dashboard?section=requests');
    }
};