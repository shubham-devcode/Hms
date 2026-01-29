const bcrypt = require('bcryptjs');

//Import Models
const User = require('../../models/User');

// Admin Setup 
exports.admintSetup = async (req, res) => {
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
            <p><strong>Name:</strong> Shubham Yadav</p>
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
};