const express = require('express');
const router = express.Router();
const { ensureStaff } = require('../config/auth');

// Import Controller
const dashboardCtrl = require('../controllers/staff/dashboard/dashboardCtrl');
const attendanceCtrl = require('../controllers/staff/studentMngt/attendanceCtrl');
const gatePassCtrl = require('../controllers/staff/studentMngt/gatePassCtrl');
const assignRoomCtrl  = require('../controllers/staff/roomMngt/assignRoomCtrl');
const addStudentCtrl = require('../controllers/staff/studentMngt/addStudentCtrl');
const roomCngReqCtrl = require('../controllers/staff/roomMngt/roomCngReqCtrl'); 
const removeRoomCtrl = require('../controllers/staff/roomMngt/removeRoomCtrl');                                     

// STAFF DASHBOARD
router.get('/dashboard', ensureStaff, dashboardCtrl.dashboard);

//  ATTENDANCE 
router.post('/student/:id/status', ensureStaff, attendanceCtrl.attendance );

// GATE PASS (In or Out)
router.post('/student/:id/toggle-gate', ensureStaff, gatePassCtrl.gatePass);

// ROOM MANAGEMENT Assign or Remove Room
router.post('/room/assign', ensureStaff, assignRoomCtrl.assignRoom);
router.post('/room/remove', ensureStaff, removeRoomCtrl.removeRoom);

// COMPLAINTS 
router.post('/complaint/:id/update', ensureStaff, );
router.post('/complaint/:id/resolve', ensureStaff, );

// ADD STUDENT 
router.post('/student/add', ensureStaff, addStudentCtrl.addStudent );

// Room Change Request approve or Reject
router.post('/request/:id/approve', ensureStaff, roomCngReqCtrl.reqApprove );
router.post('/request/:id/reject', ensureStaff, roomCngReqCtrl.reqReject);

module.exports = router;
