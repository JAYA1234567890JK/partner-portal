const { z } = require('zod');

const email = z.string().trim().email('Enter a valid email address.').max(254).transform((value) => value.toLowerCase());
const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.').max(120),
  businessName: z.string().trim().min(1, 'Business name is required.').max(160),
  businessType: z.string().trim().max(80).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  email,
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid mobile number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.', path: ['confirmPassword'],
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Email and password are required.').max(128),
});

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Please correct the highlighted fields.',
        errors: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      });
    }
    req.validatedBody = result.data;
    return next();
  };
}

module.exports = { registerSchema, loginSchema, validateBody };
