const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// ==========================================
// MODELS IMPORT
// ==========================================
const User = require('../models/User');
const GalleryImage = require('../models/GalleryImage'); 

// ==========================================
// 1. 🏠 HOME PAGE (Landing Page)
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Home page par sirf Latest 6 Photos dikhayenge (Site Fast rahégi)
    const galleryImages = await GalleryImage.find()
      .sort({ createdAt: -1 })
      .limit(6) 
      .lean();
    
    res.render('index', { 
      title: 'HMS - Next Gen Hostel',
      galleryImages, 
      path: '/' // Navbar Active karne ke liye
    });

  } catch (err) {
    console.error("Home Page Error:", err);
    res.render('index', { 
        title: 'HMS', 
        galleryImages: [],
        path: '/'
    });
  }
});

// ==========================================
// 2. 🖼️ GALLERY PAGE (Full Gallery)
// ==========================================
router.get('/gallery', async (req, res) => {
  try {
    // Yahan SAARI photos dikhayenge
    const galleryImages = await GalleryImage.find()
      .sort({ createdAt: -1 })
      .lean();

    res.render('gallery', {
      title: 'Our Gallery - HMS',
      galleryImages,
      path: '/gallery' // Navbar Active karne ke liye
    });

  } catch (err) {
    console.error("Gallery Page Error:", err);
    res.redirect('/');
  }
});

// ==========================================
// 3. 🛠️ SETUP ADMIN ROUTE (One Time Use)
// ==========================================
router.get('/setup-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      return res.send('<h3>⚠️ Admin already exists!</h3><br><a href="/users/login">Go to Login Page</a>');
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
      status: 'present',
      isApproved: true // Admin is auto-approved
    });

    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: green;">✅ Admin Created Successfully!</h1>
            <p><strong>Email:</strong> admin@hms.com</p>
            <p><strong>Password:</strong> admin123</p>
            <hr style="width: 50%; margin: 20px auto;">
            <a href="/users/login" style="background: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Click here to Login</a>
        </div>
    `);

  } catch (err) {
    console.error(err);
    res.send('Error creating admin: ' + err.message);
  }
});

module.exports = router;
