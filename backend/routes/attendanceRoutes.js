const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { protect, authorize, authMiddleware, adminMiddleware } = require('../middleware/auth');

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Check-in today
// @route   POST /api/attendance/checkin
// @access  Private
router.post('/checkin', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const dateString = getLocalDateString();

    // Check if user already checked in today
    const existing = await Attendance.findOne({ userId, dateString });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already checked in today' });
    }

    const checkInTime = new Date();
    
    // Status logic: Let's say check-in after 9:30 AM is Late
    let status = 'Present';
    const limitTime = new Date();
    limitTime.setHours(9, 30, 0, 0); // 9:30 AM
    if (checkInTime > limitTime) {
      status = 'Late';
    }

    const attendance = await Attendance.create({
      userId,
      dateString,
      checkIn: checkInTime,
      status
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Check-out today
// @route   POST /api/attendance/checkout
// @access  Private
router.post('/checkout', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const dateString = getLocalDateString();

    // Find today's attendance log
    const attendance = await Attendance.findOne({ userId, dateString });
    if (!attendance) {
      return res.status(400).json({ success: false, message: 'You have not checked in today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    attendance.checkOut = checkOutTime;

    // Calculate hours worked
    const diffMs = checkOutTime - attendance.checkIn;
    const hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    attendance.totalHours = hours;

    // Status logic: if total hours worked < 4 hours, mark as Half-day
    if (hours < 4.0) {
      attendance.status = 'Half-day';
    } else if (attendance.status !== 'Late') {
      attendance.status = 'Present';
    }

    await attendance.save();

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get check-in status for today
// @route   GET /api/attendance/today
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const dateString = getLocalDateString();

    const attendance = await Attendance.findOne({ userId, dateString });
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user's attendance logs
// @route   GET /api/attendance/my-attendance
// @access  Private
router.get('/my-attendance', protect, async (req, res) => {
  try {
    const attendance = await Attendance.find({ userId: req.user._id }).sort({ checkIn: -1 });
    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all attendance logs (Admin)
// @route   GET /api/attendance/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const attendance = await Attendance.find({})
      .populate('userId', 'name email department designation')
      .sort({ checkIn: -1 });
    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get compiled attendance sheet (Calendar & stats)
// @route   GET /api/attendance/sheet
// @access  Private
router.get('/sheet', protect, async (req, res) => {
  try {
    let { userId, month, year } = req.query;
    const loggedInUserId = req.user._id;

    const today = new Date();
    month = month ? parseInt(month) : today.getMonth() + 1; // 1-12
    year = year ? parseInt(year) : today.getFullYear();

    let targetUserId = loggedInUserId;
    if (userId && userId !== loggedInUserId.toString()) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to view this sheet' });
      }
      targetUserId = userId;
    }

    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const logs = await Attendance.find({
      userId: targetUserId,
      dateString: { $gte: startDateStr, $lte: endDateStr }
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

    const leaves = await Leave.find({
      userId: targetUserId,
      status: 'Approved',
      startDate: { $lte: endOfMonth },
      endDate: { $gte: startOfMonth }
    });

    const logMap = {};
    logs.forEach(log => {
      logMap[log.dateString] = log;
    });

    const compiledDays = [];
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let weekendCount = 0;

    const currentLocalDateStr = getLocalDateString();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      let status = 'Not Checked In';
      let details = null;

      if (logMap[dateString]) {
        const log = logMap[dateString];
        details = {
          checkIn: log.checkIn,
          checkOut: log.checkOut,
          totalHours: log.totalHours,
          _id: log._id
        };
        
        if (log.checkOut) {
          if (log.totalHours < 4.0) {
            status = 'Half-day';
            halfDayCount++;
          } else {
            status = log.status; // 'Present' or 'Late'
            if (log.status === 'Late') lateCount++;
            else presentCount++;
          }
        } else {
          status = log.status; // Active shift
          if (log.status === 'Late') lateCount++;
          else presentCount++;
        }
      } else {
        const hasLeave = leaves.some(leave => {
          const start = new Date(leave.startDate);
          start.setHours(0,0,0,0);
          const end = new Date(leave.endDate);
          end.setHours(23,59,59,999);
          return date >= start && date <= end;
        });

        if (hasLeave) {
          status = 'Leave';
          leaveCount++;
        } else if (isWeekend) {
          status = 'Weekend';
          weekendCount++;
        } else {
          if (dateString < currentLocalDateStr) {
            status = 'Absent';
            absentCount++;
          } else if (dateString === currentLocalDateStr) {
            const currentHour = today.getHours();
            if (currentHour >= 12) {
              status = 'Absent';
              absentCount++;
            } else {
              status = 'Not Checked In';
            }
          } else {
            status = 'Scheduled';
          }
        }
      }

      compiledDays.push({
        dateString,
        day,
        dayOfWeek: date.getDay(),
        status,
        details
      });
    }

    const weeklyStats = {};
    let currentWeekNum = 1;
    compiledDays.forEach((dayObj, idx) => {
      const weekKey = `Week ${currentWeekNum}`;
      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = { present: 0, absent: 0, halfDay: 0, leave: 0 };
      }

      const stat = weeklyStats[weekKey];
      if (dayObj.status === 'Present' || dayObj.status === 'Late') stat.present++;
      else if (dayObj.status === 'Absent') stat.absent++;
      else if (dayObj.status === 'Half-day') stat.halfDay++;
      else if (dayObj.status === 'Leave') stat.leave++;

      if (dayObj.dayOfWeek === 6 && idx !== compiledDays.length - 1) {
        currentWeekNum++;
      }
    });

    const activeDays = presentCount + lateCount + halfDayCount + absentCount + leaveCount;
    const attendancePercentage = activeDays > 0 
      ? parseFloat(((presentCount + lateCount + halfDayCount * 0.5 + leaveCount) / activeDays * 100).toFixed(1)) 
      : 100.0;

    res.json({
      success: true,
      stats: {
        present: presentCount + lateCount,
        absent: absentCount,
        halfDay: halfDayCount,
        leave: leaveCount,
        weekend: weekendCount,
        percentage: attendancePercentage
      },
      weeklyStats,
      days: compiledDays
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all employees daily attendance status (Admin)
// @route   GET /api/attendance/daily-status
// @access  Private/Admin
router.get('/daily-status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let { date } = req.query;
    if (!date) {
      date = getLocalDateString();
    }

    const employees = await User.find({}).sort({ name: 1 });

    const logs = await Attendance.find({ dateString: date });
    const logMap = {};
    logs.forEach(log => {
      logMap[log.userId.toString()] = log;
    });

    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    const targetDateEnd = new Date(date);
    targetDateEnd.setHours(23,59,59,999);

    const leaves = await Leave.find({
      status: 'Approved',
      startDate: { $lte: targetDateEnd },
      endDate: { $gte: targetDate }
    });
    
    const leaveUserIds = new Set(leaves.map(l => l.userId.toString()));

    const records = [];
    const summary = {
      total: employees.length,
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      notCheckedIn: 0
    };

    const todayStr = getLocalDateString();

    employees.forEach(emp => {
      const empId = emp._id.toString();
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

      let status = 'Not Checked In';
      let details = null;

      if (logMap[empId]) {
        const log = logMap[empId];
        details = {
          checkIn: log.checkIn,
          checkOut: log.checkOut,
          totalHours: log.totalHours,
          _id: log._id
        };

        if (log.checkOut) {
          if (log.totalHours < 4.0) {
            status = 'Half-day';
            summary.halfDay++;
          } else {
            status = log.status; // 'Present' or 'Late'
            summary.present++;
          }
        } else {
          status = log.status; // Active shift (Present/Late)
          summary.present++;
        }
      } else if (leaveUserIds.has(empId)) {
        status = 'Leave';
        summary.leave++;
      } else if (isWeekend) {
        status = 'Weekend';
      } else {
        if (date < todayStr) {
          status = 'Absent';
          summary.absent++;
        } else if (date === todayStr) {
          const currentHour = new Date().getHours();
          if (currentHour >= 12) {
            status = 'Absent';
            summary.absent++;
          } else {
            status = 'Not Checked In';
            summary.notCheckedIn++;
          }
        } else {
          status = 'Scheduled';
        }
      }

      records.push({
        user: {
          _id: emp._id,
          name: emp.name,
          employeeId: emp.employeeId,
          email: emp.email,
          department: emp.department,
          designation: emp.designation
        },
        status,
        details
      });
    });

    res.json({
      success: true,
      date,
      summary,
      records
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
