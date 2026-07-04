const Joi = require('joi');

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    next();
  };
};

// Validation schemas definition
const signupSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name must be at least 3 characters long'
  }),
  employeeId: Joi.string().required(),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  contact: Joi.string().allow(''),
  department: Joi.string().allow(''),
  designation: Joi.string().allow('')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const createAdminSchema = Joi.object({
  name: Joi.string().allow(''),
  employeeId: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  contact: Joi.string().allow(''),
  department: Joi.string().allow(''),
  designation: Joi.string().allow('')
});

const moodSchema = Joi.object({
  mood: Joi.string().valid('Great', 'Good', 'Neutral', 'Stressed', 'Burned Out').required(),
  note: Joi.string().allow('')
});

const applyLeaveSchema = Joi.object({
  leaveType: Joi.string().valid('Paid', 'Sick', 'Unpaid').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  reason: Joi.string().required().max(500)
});

const processLeaveSchema = Joi.object({
  status: Joi.string().valid('Approved', 'Rejected').required(),
  adminComments: Joi.string().allow('').max(500)
});

const generatePayrollSchema = Joi.object({
  userId: Joi.string().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
  allowances: Joi.number().min(0).default(0),
  deductions: Joi.number().min(0).default(0),
  status: Joi.string().valid('Paid', 'Unpaid').default('Unpaid')
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(3),
  email: Joi.string().email(),
  employeeId: Joi.string(),
  role: Joi.string().valid('employee', 'admin'),
  department: Joi.string(),
  designation: Joi.string(),
  salary: Joi.number().min(0),
  allowances: Joi.number().min(0),
  deductions: Joi.number().min(0),
  contact: Joi.string().allow(''),
  address: Joi.string().allow(''),
  profilePicture: Joi.string().allow(''),
  skills: Joi.array().items(Joi.string()),
  documents: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    url: Joi.string().required(),
    uploadedAt: Joi.date()
  }))
});

module.exports = {
  validateBody,
  signupSchema,
  loginSchema,
  createAdminSchema,
  moodSchema,
  applyLeaveSchema,
  processLeaveSchema,
  generatePayrollSchema,
  updateProfileSchema
};
