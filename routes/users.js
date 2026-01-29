const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

//Imports Controllers
const loginLogoutCtrl = require('../controllers/users/loginLogoutCtrl');
const registrationCtrl = require('../controllers/users/registrationCtrl');
const updateProfileCtrl = require('../controllers/users/updateProfileCtrl');

// Login Page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login Handle
router.post('/login',loginLogoutCtrl.login );

// Register Page
router.get('/register', (req, res) => {
  res.render('register');
});

// Register Handle
router.post('/register', registrationCtrl.registerUser);

// PROFILE UPDATE (Generic)=
router.post('/profile/update', ensureAuthenticated, updateProfileCtrl.updateProfile);

// LOGOUT
router.get('/logout', loginLogoutCtrl.logout );

module.exports = router;
