// --- Models Imports ---
const User = require('../../../models/User');
const Room = require('../../../models/Room');

exports.removeRoom = async (req, res) => {
    try {
        // नोट: अगर आप इसे Admin Dashboard से कॉल कर रहे हैं तो req.params.id का उपयोग करें
        // अगर फॉर्म से कर रहे हैं तो req.body का। मैंने दोनों हैंडल कर दिए हैं।
        const studentId = req.params.id || req.body.studentId;

        // 1. स्टूडेंट को ढूंढें
        const student = await User.findById(studentId);

        if (!student) {
            req.flash('error_msg', 'Student not found');
            return res.redirect('/staff/dashboard');
        }

        // 2. अगर स्टूडेंट के पास रूम है, तो उस रूम से उसे हटाएं
        if (student.room) {
            const room = await Room.findById(student.room);
            if (room) {
                room.occupants.pull(student._id); // रूम लिस्ट से नाम हटाएं
                await room.save();
            }
        }

        // 3. स्टूडेंट के प्रोफाइल से रूम ID हटाएं
        student.room = null; // रूम खाली करें
        await student.save();

        req.flash('warning_msg', 'Student removed from room (Unassigned)');
        
        // अगर यह स्टाफ डैशबोर्ड के लिए है तो '/staff/dashboard' रखें, 
        // वरना एडमिन के लिए '/admin/dashboard'
        res.redirect('/staff/dashboard'); 

    } catch (err) {
        console.error("Remove Room Error:", err);
        req.flash('error_msg', 'Error removing student from room');
        res.redirect('/staff/dashboard');
    }
};
