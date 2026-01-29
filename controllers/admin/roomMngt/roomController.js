// --- Models Imports ---
const Room = require('../../../models/Room');

// Add Room
exports.addRoom = async (req, res) => {
    try {
        // Form se aane wale naye fields (features) bhi receive karein
        const { roomNumber, type, capacity, price, roomImage, features } = req.body;

        const exists = await Room.findOne({ roomNumber });
        if (exists) {
            req.flash('error_msg', 'Room Number already exists');
            return res.redirect('/admin/dashboard?section=rooms');
        }

        // ✅ 1. Default Image Set Karein
        const defaultImage = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop";

        await Room.create({
            roomNumber, 
            type, 
            capacity, 
            price,
            
            // ✅ 2. Features ko comma (,) se todkar Array banayein
            features: features ? features.split(',').map(f => f.trim()) : [],

            // ✅ 3. Image Logic: Agar user ne link di hai to wo use karein, nahi to default lagayein
            images: roomImage ? [roomImage] : [defaultImage]
        });

        req.flash('success_msg', 'Room Created Successfully');
        res.redirect('/admin/dashboard?section=rooms');

    } catch (err) {
        console.error("Add Room Error:", err); // Error console me dekhne ke liye
        req.flash('error_msg', 'Error creating room');
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
