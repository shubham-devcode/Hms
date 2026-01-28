const User = require('../../../models/User');
const Room = require('../../../models/Room');

//Delete Student
exports.deleteStudent =  async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if(student.room) {
            const room = await Room.findById(student.room);
            if(room) {
                room.occupants = room.occupants.filter(id => id.toString() !== student._id.toString());
                await room.save();
            }
        }
        await User.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Student Deleted');
        res.redirect('/admin/dashboard?section=students');
    } catch (err) {
        res.redirect('/admin/dashboard?section=students');
    }
};
