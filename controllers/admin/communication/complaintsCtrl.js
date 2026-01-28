const Complaint = require('../../../models/Complaint');

// complaints
exports.complaintCtrl = async (req, res) => {
    try {
        await Complaint.findByIdAndUpdate(req.params.id, { status: 'resolved' });
        req.flash('success_msg', 'Complaint Resolved');
        res.redirect('/admin/dashboard?section=complaints');
    } catch (err) {
        res.redirect('/admin/dashboard?section=complaints');
    }
};
