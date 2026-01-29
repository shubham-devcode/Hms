// --- Models Imports ---
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');

// Add Student by staff
exports.addStudent = async (req, res) => {
  try {
    const { name, email, phone, gender, course, address, guardianName, guardianPhone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/staff/dashboard');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    await User.create({
      name: name.trim(), email: email.toLowerCase().trim(), phone, gender, course, address, guardianName, guardianPhone,
      rollNumber: 'TBD', role: 'student', isApproved: false, room: null, password: hashedPassword, status: 'present', isOut: false
    });

    req.flash('success_msg', 'Student Sent for Approval');
    res.redirect('/staff/dashboard'); 
  } catch (err) {
    req.flash('error_msg', 'Error adding student');
    res.redirect('/staff/dashboard');
  }
};