// --- Models Imports ---
const User = require('../../../models/User');

// Gate Pass In or Out
exports. gatePass = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student) return res.redirect('/staff/dashboard?section=gate');

        if (student.isOut) {
            student.isOut = false;
            student.outTime = null;
            req.flash('success_msg', `✅ ${student.name} marked IN.`);
        } else {
            student.isOut = true;
            student.outTime = new Date();
            req.flash('warning_msg', `👋 ${student.name} marked OUT.`);
        }

        await student.save();
        
        // ✅ FIX: Go to Gate Section
        res.redirect('/staff/dashboard?section=gate');

    } catch (err) {
        res.redirect('/staff/dashboard?section=gate');
    }
};