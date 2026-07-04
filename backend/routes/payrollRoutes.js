const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const { protect, authorize, authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateBody, generatePayrollSchema } = require('../middleware/validation');

// @desc    Get current employee's payroll statements
// @route   GET /api/payroll/my-payroll
// @access  Private
router.get('/my-payroll', protect, async (req, res) => {
  try {
    const payroll = await Payroll.find({ userId: req.user._id }).sort({ year: -1, month: -1 });
    res.json({ success: true, count: payroll.length, data: payroll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all payroll logs (Admin)
// @route   GET /api/payroll/all
// @access  Private/Admin
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payroll = await Payroll.find({})
      .populate('userId', 'name email department designation salary')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, count: payroll.length, data: payroll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Generate payroll for an employee
// @route   POST /api/payroll
// @access  Private/Admin
router.post('/', authMiddleware, adminMiddleware, validateBody(generatePayrollSchema), async (req, res) => {
  try {
    const { userId, month, year, allowances, deductions, status } = req.body;

    if (!userId || !month || !year) {
      return res.status(400).json({ success: false, message: 'User, month, and year are required' });
    }

    // Verify employee exists
    const employee = await User.findById(userId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if payroll already generated for this period
    const existing = await Payroll.findOne({ userId, month, year });
    if (existing) {
      return res.status(400).json({ success: false, message: `Payroll already generated for ${month} ${year}` });
    }

    const basicSalary = employee.salary || 30000;
    const allowVal = Number(allowances) || 0;
    const deductVal = Number(deductions) || 0;
    const netSalary = basicSalary + allowVal - deductVal;

    const payroll = await Payroll.create({
      userId,
      month,
      year: Number(year),
      basicSalary,
      allowances: allowVal,
      deductions: deductVal,
      netSalary,
      status: status || 'Unpaid',
      paymentDate: status === 'Paid' ? new Date() : null
    });

    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
