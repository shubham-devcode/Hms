const express = require('express');
const router = express.Router();
const passport = require('passport');

// Login Page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    // successRedirect: '/',  <-- Is line ko hata dein agar ye hai
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
}, (req, res) => {
  // Yahan hum decide karenge ki kis role ko kahan bhejna hai
  const role = req.user.role;

  if (role === 'admin') {
    res.redirect('/admin/dashboard');
  } else if (role === 'staff') {
    res.redirect('/staff/dashboard');
  } else if (role === 'student') {
    res.redirect('/student/dashboard');
  } else {
    res.redirect('/'); // Default fallback
  }
});



// Smart Redirector (Role ke hisab se dashboard bheje)
router.get('/redirect', (req, res) => {
    if (!req.user) return res.redirect('/users/login');
    
    if (req.user.role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (req.user.role === 'staff') {
        res.redirect('/staff/dashboard');
    } else {
        res.redirect('/'); // Students ke liye Home page ya Student Dashboard
    }
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

module.exports = router;
