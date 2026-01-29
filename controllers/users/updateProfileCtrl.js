const User = require('../../models/User');

// Update User Profile
exports.updateProfile = async (req, res) => {
    try {
        const { phone, address, guardianPhone, gender } = req.body;
        
        // Update User
        await User.findByIdAndUpdate(req.user._id, {
            phone,
            address,
            guardianPhone,
            gender
        });

        req.flash('success_msg', 'Profile Updated Successfully');
        
        // Redirect back to respective dashboard
        if (req.user.role === 'admin') return res.redirect('/admin/dashboard');
        if (req.user.role === 'staff') return res.redirect('/staff/dashboard');
        if (req.user.role === 'student') return res.redirect('/student/dashboard');
        
        res.redirect('/');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Update Failed');
        
        // Error Redirect Fallback
        if (req.user.role === 'student') return res.redirect('/student/dashboard');
        res.redirect('/');
    }
};