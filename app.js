const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();

// PASSPORT CONFIG
require('./config/passport')(passport);

//  DATABASE CONNECTION
const dbName = 'HMS'; 
mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`)
  .then(() => console.log(` MongoDB Connected to database: ${dbName}`))
  .catch(err => console.log(' MongoDB Connection Error:', err));

// EJS Layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.set('layout', 'layout'); 

// Public Folder (CSS/Images)
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser (Form Data)
app.use(express.urlencoded({ extended: true }));

// SESSION & SECURITY
app.use(session({
  secret: 'Made_By_Shubham_Yadav', // Strong secret key
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

// ROUTES 
// Home
app.use('/', require('./routes/index'));

// Auth Routes 
app.use('/users', require('./routes/users'));

// Dashboards
app.use('/admin', require('./routes/admin'));
app.use('/staff', require('./routes/staff'));
app.use('/student', require('./routes/student'));

// ERROR HANDLING
app.use((req, res) => {
  res.status(404).send(`
    <div style="text-align:center; padding:50px; font-family:sans-serif;">
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you are looking for doesn't exist.</p>
      <a href="/" style="background:#6366f1; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Go Home</a>
    </div>
  `);
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
