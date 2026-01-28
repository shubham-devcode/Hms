const Notice = require('../../../models/Notice');

// Add Notice
exports.addNotice = async (req, res) => {
    try {
        const { title, content } = req.body;
        await Notice.create({ title, content, postedBy: req.user.name });
        req.flash('success_msg', 'Notice Posted');
        res.redirect('/admin/dashboard?section=notices');
    } catch (err) {
        res.redirect('/admin/dashboard?section=notices');
    }
};

// Delete Notice
exports.delNotice = async (req, res) => {
    try {
        await Notice.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Notice Deleted');
        res.redirect('/admin/dashboard?section=notices');
    } catch (err) {
        res.redirect('/admin/dashboard?section=notices');
    }
};