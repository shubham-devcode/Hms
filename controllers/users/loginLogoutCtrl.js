const passport = require('passport');

// Login User
exports.login = (req, res, next) => {
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
};

// Logout User
exports.logout = (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
};