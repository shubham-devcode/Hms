const User = require('../../../models/User');

// Delete Staff
exports.delStaff = async (req, res) => {
    try {
        if(req.params.id === req.user._id.toString()) return res.redirect('/admin/dashboard?section=staff');
        await User.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Staff Removed');
        res.redirect('/admin/dashboard?section=staff');
    } catch (err) {
        res.redirect('/admin/dashboard?section=staff');
    }
};