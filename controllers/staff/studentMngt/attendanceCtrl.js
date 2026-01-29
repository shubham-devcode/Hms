// --- Models Imports ---
const User = require('../../../models/User');

// Attendance Manage
exports.attendance = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.redirect('/staff/dashboard');

    student.status = (student.status === 'present') ? 'on-leave' : 'present';
    if(student.status === 'on-leave') student.isOut = false;

    await student.save();
    req.flash('success_msg', `Status updated for ${student.name}`);
    
    // Go to Dashboard 
    res.redirect('/staff/dashboard');

  } catch (err) {
    res.redirect('/staff/dashboard');
  }
};