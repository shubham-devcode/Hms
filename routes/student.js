const express = require('express');
const router = express.Router();
const { ensureStudent } = require('../config/auth'); 

// Imports Controllers
const dashboardCtrl = require('../controllers/student/dashboard/dashboardCtrl');
const complaintCtrl = require('../controllers/student/communication/complaintCtrl');
const stdRoomCngReqCtrl = require('../controllers/student/roomMngt/stdRoomCngReqCtrl');

// Middleware Wrapper 
router.use(ensureStudent);

// STUDENT DASHBOARD
router.get('/dashboard', dashboardCtrl.dashboard );

// PROFILE & SETTINGS
router.get('/profile', (req, res) => {
    res.redirect('/student/dashboard?section=profile');
});

router.get('/room', (req, res) => {
    res.redirect('/student/dashboard?section=room');
});

router.get('/complaints', (req, res) => {
    res.redirect('/student/dashboard?section=complaints');
});

// RAISE COMPLAINT
router.post('/complaint/add', complaintCtrl.complaint);

//REQUEST ROOM CHANGE
router.post('/request-room-change', stdRoomCngReqCtrl.roomChangeRequest );

// DELETE/CANCEL REQUEST
router.post('/request-room-change/cancel', stdRoomCngReqCtrl.cancleRoomChangeRequest);

module.exports = router;
