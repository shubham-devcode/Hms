const bcrypt = require('bcryptjs');
const User = require('../../models/User');

// Register User
exports. registerUser = async (req, res) => {
  const { 
      name, email, password, confirm_password, 
      phone, gender, course, address, guardianName, guardianPhone 
  } = req.body;

  let errors = [];

  // Validation
  if (!name || !email || !password || !confirm_password || !phone) {
    errors.push({ msg: 'Please fill in all required fields' });
  }
  if (password !== confirm_password) {
    errors.push({ msg: 'Passwords do not match' });
  }
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', { 
        errors, name, email, password, confirm_password, phone, address 
    });
  } else {
    try {
      // Check if user exists
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        errors.push({ msg: 'Email is already registered' });
        return res.render('register', { errors, name, email, password, confirm_password, phone });
      }

      // Create New User
      const newUser = new User({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        gender,
        course,
        address,
        guardianName,
        guardianPhone,
        role: 'student',    // Default role
        isApproved: false   // Admin approval needed
      });

      // Hash Password
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      await newUser.save();

      req.flash('success_msg', 'Registration Successful! Please wait for Admin Approval.');
      res.redirect('/users/login');

    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Something went wrong during registration.');
      res.redirect('/users/register');
    }
  }
};