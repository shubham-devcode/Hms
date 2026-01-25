const express = require('express');
const router = express.Router(); // ✅ Ye line zaroori thi, jo missing thi
const bcrypt = require('bcryptjs');

// Models Import
const User = require('../models/User');
const GalleryImage = require('../models/galleryImages'); // Home page gallery ke liye

// ==========================================
// 1. 🏠 HOME PAGE (Landing Page)
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Gallery images fetch karein taaki slider me dikh sakein
    const galleryImages = await GalleryImage.find({ isVisible: true }).sort({ createdAt: -1 }).lean();
    
    res.render('index', { 
      title: 'HMS - Hostel Management System',
      galleryImages 
    });
  } catch (err) {
    console.error(err);
    res.render('index', { title: 'HMS', galleryImages: [] });
  }
});

// ==========================================
// 🛠️ SETUP ADMIN ROUTE (One Time Use)
// ==========================================
router.get('/setup-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.send('<div style="font-family: sans-serif; text-align: center; margin-top: 50px;"><h3>⚠️ Admin already exists!</h3><a href="/users/login">Go to Login</a></div>');
    }

    // Create New Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt); // Password: admin123

    await User.create({
      name: 'Shubham Yadav',
      email: 'admin@hms.com',
      password: hashedPassword,
      role: 'admin',
      rollNumber: null,
      room: null,
      status: 'present'
    });

    res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px; color: green;">
        <h1>✅ Admin Created Successfully!</h1>
        <p>Email: <strong>admin@hms.com</strong></p>
        <p>Password: <strong>admin123</strong></p>
        <br>
        <a href="/users/login" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
      </div>
    `);

  } catch (err) {
    console.error(err);
    res.send('Error creating admin: ' + err.message);
  }
});

module.exports = router; // ✅ Ye line file ke end me hona zaroori hai
