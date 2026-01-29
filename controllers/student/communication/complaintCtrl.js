// --- Models Imports ---
const Complaint = require('../../../models/Complaint');

// Student Raise Complaint
exports.complaint = async (req, res) => {
  try {
    const { title, category, description } = req.body;

    if (!title || !description) {
      req.flash('error_msg', 'Please fill all fields');
      return res.redirect('/student/dashboard?section=complaints');
    }

    await Complaint.create({
      student: req.user._id,
      room: req.user.room, // Can be null if no room assigned
      title,
      category,
      description,
      status: 'pending'
    });

    req.flash('success_msg', 'Complaint submitted successfully');
    res.redirect('/student/dashboard?section=complaints');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to submit complaint');
    res.redirect('/student/dashboard?section=complaints');
  }
};