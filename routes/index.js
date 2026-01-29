const express = require('express');
const router = express.Router();

// Import Controllers
const homePageCtrl = require('../controllers/index/homePageCtrl');
const galleryImgCtrl = require('../controllers/index/galleryImgCtrl');
const adminSetupCtrl = require('../controllers/index/adminSetupCtrl');


// HOME PAGE 
router.get('/', homePageCtrl.homePage );

// GALLERY PAGE 
router.get('/gallery', galleryImgCtrl.showAllImg );


// SETUP ADMIN ROUTE (One Time Use)
router.get('/setup-admin', adminSetupCtrl.admintSetup );

module.exports = router;
