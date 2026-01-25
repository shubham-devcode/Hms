const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();

// =====================
// 1. PASSPORT CONFIG
// =====================
require('./config/passport')(passport);

// =====================
// 2. DATABASE CONNECTION
// =====================
// Database Name 'HMS' kar diya hai taaki Admin Setup wala data yahin mile
const dbName = 'HMS'; 
mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`)
  .then(() => console.log(`✅ MongoDB Connected to database: ${dbName}`))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// =====================
// 3. MIDDLEWARE & VIEWS
// =====================

// EJS Layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Default Layout (Ye 'views/layout.ejs' ko dhundega Home page ke liye)
// Dashboards ke liye hum specific layout routes me set kar chuke hain
app.set('layout', 'layout'); 

// Public Folder (CSS/Images)
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser (Form Data)
app.use(express.urlencoded({ extended: true }));

// =====================
// 4. SESSION & SECURITY
// =====================
app.use(session({
  secret: 'hms_premium_secret_key_2025', // Strong secret key
  resave: true,
  saveUninitialized: true
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash Messages
app.use(flash());

// Global Variables (Middleware)
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error'); // Passport login error
  res.locals.user = req.user || null; // Current logged in user
  next();
});

// =====================
// 5. ROUTES (UPDATED)
// =====================

// A. Home & Setup Route (routes/index.js)
app.use('/', require('./routes/index'));

// B. Auth Routes (routes/users.js) - Login/Logout/Redirect
app.use('/users', require('./routes/users'));

// C. Protected Dashboards
app.use('/admin', require('./routes/admin'));
app.use('/staff', require('./routes/staff'));
app.use('/student', require('./routes/student'));

// =====================
// 6. ERROR HANDLING (404)
// =====================
// Agar koi Aisa route ho jo upar define nahi hai, to 404 dikhao
app.use((req, res) => {
  res.status(404).send(`
    <div style="text-align:center; padding:50px; font-family:sans-serif;">
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you are looking for doesn't exist.</p>
      <a href="/" style="background:#6366f1; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Go Home</a>
    </div>
  `);
});

// =====================
// 7. START SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
