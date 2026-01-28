const bcrypt = require('bcryptjs');
const User = require('../../../models/User');

// Add Staff
exports.addStaff = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check Duplicate Email
        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if(exists) {
            req.flash('error_msg', 'Email already registered!');
            return res.redirect('/admin/dashboard?section=staff');
        }

        //  Hash Password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        
        // Generate Unique ID for Staff
        const staffId = "STAFF_" + Date.now().toString().slice(-6);

        // Create staff
        await User.create({ 
            name, 
            email: email.toLowerCase().trim(), 
            phone: phone || "0000000000",
            password: hash, 
            role: 'staff', 
            rollNumber: staffId, 
            isApproved: true, 
            status: 'present', 
            statusUpdatedAt: Date.now() 
        });
        req.flash('success_msg', 'New Staff Member Added Successfully');
        res.redirect('/admin/dashboard?section=staff');

    } catch (err) {
        if(err.code === 11000) {
            req.flash('error_msg', 'Database Error: Duplicate Data (Check Email/RollNo)');
        } else {
            req.flash('error_msg', 'Server Error');
        }
        res.redirect('/admin/dashboard?section=staff');
    }
};