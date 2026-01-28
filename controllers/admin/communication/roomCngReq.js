const User = require('../../../models/User');
const RoomChangeRequest = require('../../../models/RoomChangeRequest');

// Approve Room Change Request
exports.ApveRoomCngReq = async (req, res) => {
    try {
        const { targetRoomId } = req.body; 
        const reqData = await RoomChangeRequest.findById(req.params.id);
        
        if(reqData && reqData.status === 'pending') {
            const student = await User.findById(reqData.student);
            reqData.status = 'approved';
            await reqData.save();
            req.flash('success_msg', 'Request Approved');
        }
        res.redirect('/admin/dashboard?section=requests');
    } catch(e) { res.redirect('/admin/dashboard?section=requests'); }
};

// Reject Room Change Request
exports.rjtRoomCngReq = async (req, res) => {
    try {
        await RoomChangeRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        req.flash('warning_msg', 'Request Rejected');
        res.redirect('/admin/dashboard?section=requests');
    } catch(e) { res.redirect('/admin/dashboard?section=requests'); }
};