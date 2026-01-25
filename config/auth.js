module.exports = {
  // ===================================
  // 1. BASIC GUARD (Check if Logged In)
  // ===================================
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/users/login');
  },

  // ===================================
  // 2. ADMIN GUARD (Only Admin Allowed)
  // ===================================
  ensureAdmin: function(req, res, next) {
    // Pehle check karo login hai ya nahi
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Please log in first');
      return res.redirect('/users/login');
    }

    // Phir check karo role 'admin' hai ya nahi
    if (req.user.role === 'admin') {
      return next();
    }

    // Agar role admin nahi hai, to wapas bhej do
    req.flash('error_msg', 'Access Denied: You are not an Admin!');
    res.redirect('/users/redirect'); // Smart Redirect (Dashboard bhej dega)
  },

  // ===================================
  // 3. STAFF GUARD (Only Staff Allowed)
  // ===================================
  ensureStaff: function(req, res, next) {
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Please log in first');
      return res.redirect('/users/login');
    }

    if (req.user.role === 'staff') {
      return next();
    }

    req.flash('error_msg', 'Access Denied: Staff Only Area!');
    res.redirect('/users/redirect');
  },

  // ===================================
  // 4. STUDENT GUARD (Only Students Allowed)
  // ===================================
  ensureStudent: function(req, res, next) {
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Please log in first');
      return res.redirect('/users/login');
    }

    if (req.user.role === 'student') {
      return next();
    }

    req.flash('error_msg', 'Access Denied: Students Only Area!');
    res.redirect('/users/redirect');
  }
};
