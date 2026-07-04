const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.log('Super admin credentials not configured in environment variables.');
      return;
    }

    // Check if this super admin already exists by email
    let superAdmin = await User.findOne({ email });
    if (superAdmin) {
      console.log(`Super admin account (${email}) already exists.`);
      return;
    }

    // Check if default employee ID is already taken to avoid duplicate conflicts
    const employeeId = 'ADM000';
    const idExists = await User.findOne({ employeeId });
    if (idExists) {
      console.log(`Employee ID ${employeeId} is already taken. Cannot auto-create super admin.`);
      return;
    }

    // Create the super admin user
    superAdmin = await User.create({
      name: 'Super Admin',
      employeeId,
      email,
      password,
      role: 'admin',
      department: 'Human Resources',
      designation: 'Super Administrator',
      contact: '0000000000',
      address: 'System Default Headquarters'
    });

    console.log(`Super admin account (${email}) created successfully.`);
  } catch (error) {
    console.error('Error seeding super admin account:', error.message);
  }
};

module.exports = { seedSuperAdmin };
