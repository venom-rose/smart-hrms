const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const moodLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  mood: {
    type: String,
    enum: ['Great', 'Good', 'Neutral', 'Stressed', 'Burned Out'],
    required: true
  },
  note: {
    type: String,
    default: ''
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  employeeId: {
    type: String,
    required: [true, 'Please add an employee ID'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(v) {
        // Enforce 1 uppercase, 1 lowercase, 1 number, 1 special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    },
    select: false
  },
  role: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee'
  },
  department: {
    type: String,
    default: 'General'
  },
  designation: {
    type: String,
    default: 'Associate'
  },
  salary: {
    type: Number,
    default: 30000
  },
  dateOfJoining: {
    type: Date,
    default: Date.now
  },
  contact: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  documents: {
    type: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    default: [
      { name: 'Employment_Agreement.pdf', url: '#' },
      { name: 'Non_Disclosure_Agreement.pdf', url: '#' },
      { name: 'Code_of_Conduct.pdf', url: '#' }
    ]
  },
  skills: {
    type: [String],
    default: []
  },
  moodLogs: [moodLogSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
