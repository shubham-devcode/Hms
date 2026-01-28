const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

//Room Management
const roomCtrl = require('../controllers/admin/roomMngt/roomController.js')

// Student Management Controllers
const addStdCtrl = require('../controllers/admin/studentMngt/addStudentCtrl');
const studentStatusCtrl = require('../controllers/admin/studentMngt/stdStatusCtrl');
const delStdCtrl = require('../controllers/admin/studentMngt/delstudentdCtrl');
const manAsnRmCtrl = require('../controllers/admin/studentMngt/manAssignRoomCtrl');
const stdAprvCtrl = require('../controllers/admin/studentMngt/stdAprovCtrl');

// Staff Management
const addStaffCtrl = require('../controllers/admin/staffMngt/addStaffCtrl.js');
const delStaffCtrl = require('../controllers/admin/staffMngt/delStaffCtrl.js');
const staffStsCtrl = require('../controllers/admin/staffMngt/staffStatusCtrl.js')

// Communications Controllers
const cmptCtrl = require('../controllers/admin/communication/complaintsCtrl');
const nteCtrl = require('../controllers/admin/communication/noticeCtrl');
const roomReq = require('../controllers/admin/communication/roomCngReq');

// Gallery Controller
const galleryCtrl = require('../controllers/admin/gallery/galleryCtrl');

// Dashboard Controller
const dashboardCtrl = require('../controllers/admin/dashboardController');

// --- Middleware: Ensure User is Admin ---
function ensureAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    req.flash('error_msg', 'Access Denied: Admins Only');
    res.redirect('/users/login');
}

// Global Middleware
router.use(ensureAuthenticated, ensureAdmin);

// DASHBOARD 
router.get('/dashboard', dashboardCtrl.getDashboard );

//  ROOMS MANAGEMENT
router.get('/rooms', async (req, res) => {
    res.redirect('/admin/dashboard?section=rooms');
});

//Add Room
router.post('/rooms/add', roomCtrl.addRoom );

//Delete Room
router.post('/rooms/delete/:id', roomCtrl.deleteRoom);

//  STUDENTS MANAGEMENT
router.get('/students', async (req, res) => {
    res.redirect('/admin/dashboard?section=students');
});

//  Student Status (Present/Leave)
router.post('/students/status/:id', studentStatusCtrl.studentStatus );

// Add Student
router.post('/students/add', addStdCtrl.addStudent);

// Manually assign a room to a student
router.post('/students/assign/:id', manAsnRmCtrl.assignRoom);

// Delete Student
router.post('/students/delete/:id',delStdCtrl.deleteStudent);

// Student Approve / Reject
router.post('/users/approve/:id', stdAprvCtrl.stdAproveCtrl);
router.post('/users/reject/:id', stdAprvCtrl.stdRjtCtrl);

// COMPLAINTS & NOTICES
router.get('/complaints', async (req, res) => { res.redirect('/admin/dashboard?section=complaints'); });
router.get('/notices', async (req, res) => { res.redirect('/admin/dashboard?section=notices'); });

//complaints
router.post('/complaints/:id/resolve', cmptCtrl.complaintCtrl);

// Add Notice
router.post('/notices/add', nteCtrl.addNotice);

// Delete Notice
router.post('/notices/delete/:id', nteCtrl.delNotice);

//  GALLERY
router.get('/gallery', async (req, res) => { res.redirect('/admin/dashboard?section=gallery'); });

// Add Image in Gallery
router.post('/gallery/add', galleryCtrl.addImage);

// Delete Image From Gallery
router.post('/gallery/delete/:id', galleryCtrl.delImage );

// STAFF MANAGEMENT

// Add Staff
router.post('/staff/add', addStaffCtrl.addStaff);

// Toggle Staff Status (Active/Leave)
router.post('/staff/status/:id', staffStsCtrl.staffStatus);

// Delete Staff
router.post('/staff/delete/:id', delStaffCtrl.delStaff);

//Room Change Request Approve
router.post('/requests/:id/approve', roomReq.ApveRoomCngReq );

//Room Change Request Reject
router.post('/requests/:id/reject', roomReq.rjtRoomCngReq );

module.exports = router;
