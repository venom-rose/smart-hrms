const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Payroll = require('./models/Payroll');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-hrms');
    console.log('Connected to MongoDB to seed data...');

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Payroll.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Create Users
    // Admin User
    const admin = await User.create({
      name: 'Sarah HR Manager',
      employeeId: 'HR001',
      email: 'admin@hrms.com',
      password: 'Admin@123', // Encrypted by Mongoose pre-save hook
      role: 'admin',
      department: 'Human Resources',
      designation: 'HR Director',
      salary: 75000,
      allowances: 15000,
      deductions: 5000,
      contact: '9876543210',
      address: '742 Evergreen Terrace, Springfield',
      skills: ['Talent Acquisition', 'Strategic HR', 'Conflict Resolution', 'Negotiation']
    });

    // Employee User 1 (Engineering)
    const emp1 = await User.create({
      name: 'John Doe',
      employeeId: 'EMP001',
      email: 'employee@hrms.com',
      password: 'Employee@123', // Encrypted by Mongoose pre-save hook
      role: 'employee',
      department: 'Engineering',
      designation: 'Software Engineer',
      salary: 55000,
      allowances: 10000,
      deductions: 4000,
      contact: '9876501234',
      address: '123 Elm Street, Springfield',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
      moodLogs: [
        { mood: 'Great', note: 'Sprint completed early!', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { mood: 'Good', note: 'Productive bug fixing session.', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { mood: 'Stressed', note: 'Tight deployment deadline.', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { mood: 'Good', note: 'Deployment successful!', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
      ]
    });

    // Employee User 2 (Marketing)
    const emp2 = await User.create({
      name: 'Jane Smith',
      employeeId: 'EMP002',
      email: 'jane@hrms.com',
      password: 'Employee@123',
      role: 'employee',
      department: 'Marketing',
      designation: 'SEO Specialist',
      salary: 42000,
      allowances: 8000,
      deductions: 3000,
      contact: '9876505678',
      address: '456 Oak Avenue, Springfield',
      skills: ['SEO', 'Content Strategy', 'Google Analytics', 'Copywriting'],
      moodLogs: [
        { mood: 'Good', note: 'Completed marketing brief', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { mood: 'Burned Out', note: 'Too many back-to-back presentations.', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
      ]
    });

    console.log('Seeded Users.');

    // 2. Create Attendance logs (John Doe)
    const checkInTimeBase = new Date();
    
    // Day 1: Present (Checked in 9:00 AM, Checked out 5:30 PM)
    const d1_in = new Date();
    d1_in.setDate(d1_in.getDate() - 3);
    d1_in.setHours(9, 0, 0, 0);
    const d1_out = new Date(d1_in);
    d1_out.setHours(17, 30, 0, 0);

    // Day 2: Late (Checked in 10:15 AM, Checked out 6:00 PM)
    const d2_in = new Date();
    d2_in.setDate(d2_in.getDate() - 2);
    d2_in.setHours(10, 15, 0, 0);
    const d2_out = new Date(d2_in);
    d2_out.setHours(18, 0, 0, 0);

    // Day 3: Present (Checked in 8:45 AM, Checked out 5:00 PM)
    const d3_in = new Date();
    d3_in.setDate(d3_in.getDate() - 1);
    d3_in.setHours(8, 45, 0, 0);
    const d3_out = new Date(d3_in);
    d3_out.setHours(17, 0, 0, 0);

    await Attendance.create([
      {
        userId: emp1._id,
        dateString: getFormattedDateString(3),
        checkIn: d1_in,
        checkOut: d1_out,
        status: 'Present',
        totalHours: 8.5
      },
      {
        userId: emp1._id,
        dateString: getFormattedDateString(2),
        checkIn: d2_in,
        checkOut: d2_out,
        status: 'Late',
        totalHours: 7.75
      },
      {
        userId: emp1._id,
        dateString: getFormattedDateString(1),
        checkIn: d3_in,
        checkOut: d3_out,
        status: 'Present',
        totalHours: 8.25
      }
    ]);

    console.log('Seeded Attendance logs.');

    // 3. Create Leave applications
    await Leave.create([
      {
        userId: emp1._id,
        leaveType: 'Sick',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        reason: 'Dental appointment and recovery',
        status: 'Approved',
        approvedBy: admin._id,
        adminComments: 'Take rest John!'
      },
      {
        userId: emp1._id,
        leaveType: 'Paid',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        reason: 'Family summer vacation',
        status: 'Pending'
      },
      {
        userId: emp2._id,
        leaveType: 'Paid',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        reason: 'Personal urgent business',
        status: 'Pending'
      }
    ]);

    console.log('Seeded Leaves.');

    // 4. Create Payroll records
    await Payroll.create([
      {
        userId: emp1._id,
        month: 'May',
        year: 2026,
        basicSalary: 55000,
        allowances: 3500,
        deductions: 1200,
        netSalary: 57300,
        status: 'Paid',
        paymentDate: new Date('2026-05-31')
      },
      {
        userId: emp1._id,
        month: 'June',
        year: 2026,
        basicSalary: 55000,
        allowances: 3500,
        deductions: 1200,
        netSalary: 57300,
        status: 'Paid',
        paymentDate: new Date('2026-06-30')
      },
      {
        userId: emp2._id,
        month: 'June',
        year: 2026,
        basicSalary: 42000,
        allowances: 1500,
        deductions: 800,
        netSalary: 42700,
        status: 'Paid',
        paymentDate: new Date('2026-06-30')
      }
    ]);

    console.log('Seeded Payroll data.');
    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data: ', error);
    process.exit(1);
  }
};

function getFormattedDateString(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

seedData();
