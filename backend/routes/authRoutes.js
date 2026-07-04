const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize, authMiddleware, adminMiddleware } = require('../middleware/auth');
const { 
  validateBody, 
  signupSchema, 
  loginSchema, 
  createAdminSchema, 
  moodSchema 
} = require('../middleware/validation');

// In-memory rate limiting and login audits
const loginAttempts = {};
const failedLoginTracks = {};

const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const limitWindow = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!loginAttempts[ip]) {
    loginAttempts[ip] = [];
  }

  loginAttempts[ip] = loginAttempts[ip].filter(timestamp => now - timestamp < limitWindow);

  if (loginAttempts[ip].length >= maxAttempts) {
    console.warn(`[Suspicious Activity] Rate limit exceeded for IP: ${ip}. Multiple attempted logins.`);
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }

  loginAttempts[ip].push(now);
  next();
};

const recordFailedLogin = (email, ip) => {
  const now = Date.now();
  const key = `${email}:${ip}`;
  if (!failedLoginTracks[key]) {
    failedLoginTracks[key] = [];
  }
  failedLoginTracks[key].push(now);
  failedLoginTracks[key] = failedLoginTracks[key].filter(t => now - t < 15 * 60 * 1000);
  
  if (failedLoginTracks[key].length >= 3) {
    console.warn(`[Suspicious Activity] Multiple failed login attempts (${failedLoginTracks[key].length}) detected for email: ${email} from IP: ${ip}`);
  }
};

const clearFailedLogin = (email, ip) => {
  const key = `${email}:${ip}`;
  delete failedLoginTracks[key];
};

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_12345', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', validateBody(signupSchema), async (req, res) => {
  try {
    const { name, employeeId, email, password, department, designation, contact } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Please provide an Employee ID' });
    }

    // Check if user already exists by email or employee ID
    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (userExists) {
      const field = userExists.email === email ? 'Email' : 'Employee ID';
      return res.status(400).json({ success: false, message: `${field} is already registered` });
    }

    // Create user
    const user = await User.create({
      name,
      employeeId,
      email,
      password,
      role: 'employee',
      department: department || 'General',
      designation: designation || 'Associate',
      contact: contact || ''
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginRateLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user with password selected (since schema selects it false by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      recordFailedLogin(email, req.ip);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      recordFailedLogin(email, req.ip);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    clearFailedLogin(email, req.ip);

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        success: true,
        data: user
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log daily mood
// @route   POST /api/auth/mood
// @access  Private
router.post('/mood', protect, validateBody(moodSchema), async (req, res) => {
  try {
    const { mood, note } = req.body;
    if (!mood) {
      return res.status(400).json({ success: false, message: 'Mood value is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user already logged mood today to avoid spam (optional, let's just append)
    const today = new Date().setHours(0, 0, 0, 0);
    const alreadyLoggedToday = user.moodLogs.some(log => new Date(log.date).setHours(0, 0, 0, 0) === today);

    if (alreadyLoggedToday) {
      // Update today's mood instead of adding a new one
      const index = user.moodLogs.findIndex(log => new Date(log.date).setHours(0, 0, 0, 0) === today);
      user.moodLogs[index].mood = mood;
      user.moodLogs[index].note = note || '';
      user.moodLogs[index].date = new Date();
    } else {
      user.moodLogs.push({ mood, note: note || '', date: new Date() });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Mood logged successfully',
      data: user.moodLogs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new admin user (Admins only)
// @route   POST /api/auth/create-admin
// @access  Private/Admin
router.post('/create-admin', authMiddleware, adminMiddleware, validateBody(createAdminSchema), async (req, res) => {
  try {
    const { name, email, password, employeeId, department, designation, contact } = req.body;

    if (!email || !password || !employeeId) {
      return res.status(400).json({ success: false, message: 'Please provide email, password, and employeeId' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (userExists) {
      const field = userExists.email === email ? 'Email' : 'Employee ID';
      return res.status(400).json({ success: false, message: `${field} is already registered` });
    }

    // Create admin user
    const adminUser = await User.create({
      name: name || 'Admin User',
      employeeId,
      email,
      password,
      role: 'admin',
      department: department || 'Human Resources',
      designation: designation || 'HR Manager',
      contact: contact || ''
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        _id: adminUser._id,
        name: adminUser.name,
        employeeId: adminUser.employeeId,
        email: adminUser.email,
        role: adminUser.role,
        department: adminUser.department,
        designation: adminUser.designation
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
