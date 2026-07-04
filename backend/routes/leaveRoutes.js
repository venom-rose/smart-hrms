const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const { protect, authorize, authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateBody, applyLeaveSchema, processLeaveSchema } = require('../middleware/validation');
const { sendLeaveStatusEmail } = require('../utils/emailHelper');

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private
router.post('/', protect, validateBody(applyLeaveSchema), async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all details' });
    }

    const leave = await Leave.create({
      userId: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current employee's leaves
// @route   GET /api/leaves/my-leaves
// @access  Private
router.get('/my-leaves', protect, async (req, res) => {
  try {
    const leaves = await Leave.find({ userId: req.user._id }).sort({ appliedDate: -1 });
    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all leaves (Admin)
// @route   GET /api/leaves/all
// @access  Private/Admin
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const leaves = await Leave.find({})
      .populate('userId', 'name email department designation')
      .sort({ appliedDate: -1 });
    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Approve/Reject leave request
// @route   PUT /api/leaves/:id/status
// @access  Private/Admin
router.put('/:id/status', authMiddleware, adminMiddleware, validateBody(processLeaveSchema), async (req, res) => {
  try {
    const { status, adminComments } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const leave = await Leave.findById(req.params.id).populate('userId', 'name email');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    if (adminComments !== undefined) {
      leave.adminComments = adminComments;
    }

    await leave.save();

    // Trigger mock transactional email to employee
    if (leave.userId && leave.userId.email) {
      sendLeaveStatusEmail(
        leave.userId.email,
        leave.userId.name,
        status,
        leave.reason,
        adminComments
      );
    }

    res.json({ success: true, data: leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
