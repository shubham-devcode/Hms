// --- Models Imports ---
const Room = require('../../../models/Room');

//Add Room
exports.addRoom = async (req, res) => {
    try {
        const { roomNumber, type, capacity, price, roomImage } = req.body;
        const exists = await Room.findOne({ roomNumber });
        if(exists) {
            req.flash('error_msg', 'Room Number already exists');
            return res.redirect('/admin/dashboard?section=rooms');
        }
        await Room.create({
            roomNumber, type, capacity, price,
            images: roomImage ? [roomImage] : []
        });
        req.flash('success_msg', 'Room Created Successfully');
        res.redirect('/admin/dashboard?section=rooms');
    } catch (err) {
        res.redirect('/admin/dashboard?section=rooms');
    }
};

// Delete Room

exports.deleteRoom = async (req, res) => {
    try {
        await Room.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Room Deleted');
        res.redirect('/admin/dashboard?section=rooms');
    } catch (err) {
        res.redirect('/admin/dashboard?section=rooms');
    }
};
