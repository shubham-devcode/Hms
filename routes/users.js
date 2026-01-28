const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ensureAuthenticated } = require('../config/auth');

// ==========================================
// 1. LOGIN ROUTES
// ==========================================

// Login Page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    
    // Agar user nahi mila (Galat details)
    if (!user) {
      req.flash('error_msg', 'Incorrect Email or Password');
      return res.redirect('/users/login');
    }

    // Login Function
    req.logIn(user, (err) => {
      if (err) { return next(err); }

      // 🔍 ROLE BASED REDIRECT (Most Important Fix)
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } 
      else if (user.role === 'staff') {
        return res.redirect('/staff/dashboard');
      } 
      else if (user.role === 'student') {
        return res.redirect('/student/dashboard');
      } 
      else {
        // Fallback for unknown roles
        return res.redirect('/');
      }
    });
  })(req, res, next);
});


// ==========================================
// 2. REGISTRATION ROUTES
// ==========================================

// Register Page
router.get('/register', (req, res) => {
  res.render('register');
});

// Register Handle
router.post('/register', async (req, res) => {
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
});


// ==========================================
// 3. PROFILE UPDATE (Generic)
// ==========================================
router.post('/profile/update', ensureAuthenticated, async (req, res) => {
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
});


// ==========================================
// 4. LOGOUT
// ==========================================
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

module.exports = router;
