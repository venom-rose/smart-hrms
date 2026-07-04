const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateString: {
    type: String, // 'YYYY-MM-DD'
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent', 'Half-day', 'Leave'],
    default: 'Present'
  },
  totalHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Avoid duplicate checkins for same user on same day
attendanceSchema.index({ userId: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
