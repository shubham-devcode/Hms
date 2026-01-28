// Import bcrypt to securely hash passwords before saving them
const bcrypt = require('bcryptjs');

// Import User and Room models from the models folder
const User = require('../../../models/User');
const Room = require('../../../models/Room');

//  Controller to handle adding a new student to the HMS portal.
exports.addStudent = async (req, res) => {
    try {
        // Extract student details from the registration form
        const { 
            name, email, phone, gender, course, address, 
            guardianName, guardianPhone, 
            password, confirm_password, roomId 
        } = req.body;

        //  Validation: Ensure both password fields match
        if (password !== confirm_password) {
            req.flash('error_msg', 'Passwords do not match');
            return res.redirect('/admin/dashboard?section=students');
        }

        //  Duplicate Check: Ensure the email is not already used in the database
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            req.flash('error_msg', 'Email already registered');
            return res.redirect('/admin/dashboard?section=students');
        }

        //  Automatic Roll Number Generation
        const lastStudent = await User.findOne({ role: 'student', isApproved: true }).sort({ _id: -1 });
        let nextRoll = '101';
        if (lastStudent && lastStudent.rollNumber && !isNaN(parseInt(lastStudent.rollNumber))) {
            nextRoll = (parseInt(lastStudent.rollNumber) + 1).toString();
        }

        //  Password Hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //  Create the new student record
        const newUser = await User.create({
            name, email: email.toLowerCase(), phone, gender, course, address, guardianName, guardianPhone,
            password: hashedPassword, role: 'student', rollNumber: nextRoll,
            isApproved: true, status: 'present'
        });

        //  Room Assignment (Optional)
        
        if (roomId) {
            const room = await Room.findById(roomId);
            // Basic capacity check to prevent over-filling the room
            if (room && room.occupants.length < room.capacity) {
                room.occupants.push(newUser._id);
                await room.save();
                
                // Link the room ID back to the student's profile
                newUser.room = room._id;
                await newUser.save();
            }
        }

        // Success
        req.flash('success_msg', `Student Added! Roll No: ${nextRoll}`);
        res.redirect('/admin/dashboard?section=students');

    } catch (err) {
        // Error
        req.flash('error_msg', 'Error adding student');
        res.redirect('/admin/dashboard?section=students');
    }
};
