const User = require('../../../models/User');

// Staff Status
exports.staffStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.status = (user.status === 'present') ? 'on-leave' : 'present';
        user.statusUpdatedAt = Date.now();
        await user.save();
        req.flash('success_msg', `Staff marked as ${user.status}`);
        res.redirect('/admin/dashboard?section=staff');
    } catch (err) {
        res.redirect('/admin/dashboard?section=staff');
    }
};