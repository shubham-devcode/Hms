const User = require('../../../models/User');
const Room = require('../../../models/Room');

// Assign Room to Student By Staff
exports.assignRoom = async (req, res) => {
  try {
    // Note: Ensure your form sends 'studentId' and 'roomId'
    const { studentId, roomId } = req.body;

    const student = await User.findById(studentId);
    const room = await Room.findById(roomId);

    // ✅ FIX 1: Safety Check (Agar ID galat hui to crash nahi hoga)
    if (!student || !room) {
        req.flash('error_msg', 'Student or Room not found!');
        return res.redirect('/staff/dashboard');
    }

    // ✅ FIX 2: Check Capacity
    if (room.occupants.length >= room.capacity) {
      req.flash('error_msg', 'Room is FULL!');
      return res.redirect('/staff/dashboard');
    }

    // ✅ FIX 3: Swap Logic (Agar pehle se room hai to wahan se hatao)
    if (student.room) {
      await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
    }

    // 4. Assign New Room
    // $addToSet duplicates hone se rokta hai
    await Room.findByIdAndUpdate(roomId, { $addToSet: { occupants: student._id } });

    // 5. Update Student
    student.room = roomId;
    await student.save();

    req.flash('success_msg', 'Room Assigned Successfully');
    res.redirect('/staff/dashboard');

  } catch (err) {
    console.error("Assign Error:", err); // Error console me dikhega
    req.flash('error_msg', 'Something went wrong');
    res.redirect('/staff/dashboard');
  }
};
