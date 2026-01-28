const User = require('../../../models/User');

// Student Aproval
exports.stdAproveCtrl = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.redirect('/admin/dashboard?section=approvals');

        if (!user.rollNumber || user.rollNumber === 'TBD') {
            const allStudents = await User.find({ role: 'student', isApproved: true }).select('rollNumber').lean();
            let maxRoll = 100;
            allStudents.forEach(s => {
                const r = parseInt(s.rollNumber);
                if(!isNaN(r) && r > maxRoll) maxRoll = r;
            });
            user.rollNumber = (maxRoll + 1).toString();
        }

        user.isApproved = true;
        await user.save();

        req.flash('success_msg', `Student Approved! Roll No: ${user.rollNumber}`);
        res.redirect('/admin/dashboard?section=approvals');
    } catch (err) {
        res.redirect('/admin/dashboard?section=approvals');
    }
};

exports.stdRjtCtrl = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        req.flash('error_msg', 'Registration Rejected');
        res.redirect('/admin/dashboard?section=approvals');
    } catch (err) {
        res.redirect('/admin/dashboard?section=approvals');
    }
};