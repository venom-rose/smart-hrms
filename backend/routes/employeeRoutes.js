const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize, authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateBody, updateProfileSchema } = require('../middleware/validation');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const employees = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    // Normal user can only view their own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update employee profile
// @route   PUT /api/employees/:id
// @access  Private
router.put('/:id', protect, validateBody(updateProfileSchema), async (req, res) => {
  try {
    // Normal user can only update their own profile
    const isSelf = req.user._id.toString() === req.params.id;
    if (req.user.role !== 'admin' && !isSelf) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    }

    let employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Update fields based on permissions
    if (req.user.role === 'admin') {
      const {
        name,
        email,
        employeeId,
        role,
        department,
        designation,
        salary,
        allowances,
        deductions,
        contact,
        address,
        profilePicture,
        skills,
        documents
      } = req.body;

      if (name) employee.name = name;
      if (email) employee.email = email;
      if (employeeId) employee.employeeId = employeeId;
      if (role) employee.role = role;
      if (department) employee.department = department;
      if (designation) employee.designation = designation;
      if (salary !== undefined) employee.salary = salary;
      if (allowances !== undefined) employee.allowances = allowances;
      if (deductions !== undefined) employee.deductions = deductions;
      if (contact !== undefined) employee.contact = contact;
      if (address !== undefined) employee.address = address;
      if (profilePicture !== undefined) employee.profilePicture = profilePicture;
      if (skills !== undefined) employee.skills = skills;
      if (documents !== undefined) employee.documents = documents;
    } else {
      // Normal employee updating their own profile
      const { contact, address, profilePicture, skills } = req.body;

      if (contact !== undefined) employee.contact = contact;
      if (address !== undefined) employee.address = address;
      if (profilePicture !== undefined) employee.profilePicture = profilePicture;
      if (skills !== undefined) employee.skills = skills;
    }

    const updatedEmployee = await employee.save();
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete employee profile
// @route   DELETE /api/employees/:id
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Employee profile deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
