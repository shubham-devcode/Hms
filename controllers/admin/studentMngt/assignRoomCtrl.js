const User = require('../../../models/User');
const Room = require('../../../models/Room');

// ==========================================
// Manually Assign Room (Optimized for Admin)
// ==========================================
exports.assignRoom = async (req, res) => {
    try {
        const studentId = req.params.id; // URL से ID (e.g. /assign/:id)
        const { roomId } = req.body;     // Form से Room ID

        // 1. Basic Check
        if (!roomId) {
            req.flash('error_msg', 'Please select a room.');
            return res.redirect('/admin/dashboard?section=students');
        }

        const student = await User.findById(studentId);
        const room = await Room.findById(roomId);

        // 2. Safety Check (Crash Proof)
        if (!student || !room) {
            req.flash('error_msg', 'Student or Room not found!');
            return res.redirect('/admin/dashboard?section=students');
        }

        // 3. Capacity Check
        if (room.occupants.length >= room.capacity) {
            req.flash('error_msg', `🛑 Room ${room.roomNumber} is FULL!`);
            return res.redirect('/admin/dashboard?section=students');
        }

        // 4. Swap Logic (अगर स्टूडेंट पहले किसी रूम में था, तो वहां से हटाएं)
        if (student.room) {
            // $pull ऑपरेटर array से item को atomic तरीके से हटाता है
            await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
        }

        // 5. Assign New Room
        // $addToSet यह सुनिश्चित करता है कि duplicates न बनें
        await Room.findByIdAndUpdate(roomId, { $addToSet: { occupants: student._id } });

        // 6. Update Student Record
        student.room = roomId;
        await student.save();

        req.flash('success_msg', `✅ Assigned to Room ${room.roomNumber}`);
        res.redirect('/admin/dashboard?section=students');

    } catch (err) {
        console.error("Admin Assign Room Error:", err);
        req.flash('error_msg', 'Server Error while assigning room');
        res.redirect('/admin/dashboard?section=students');
    }
};
