const User = require('../../../models/User');

// Student Status
exports.studentStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.status = (user.status === 'present') ? 'on-leave' : 'present';
        user.statusUpdatedAt = Date.now();
        await user.save();
        req.flash('success_msg', `Student marked as ${user.status}`);
        res.redirect('/admin/dashboard?section=students');
    } catch (err) {
        res.redirect('/admin/dashboard?section=students');
    }
};
