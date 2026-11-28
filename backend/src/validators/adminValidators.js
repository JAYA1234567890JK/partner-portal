const { z } = require('zod');
const { validateBody } = require('./authValidators');

const updatePropertyStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().trim().max(2000, 'Review note must be at most 2000 characters.').optional().default(''),
}).superRefine((value, context) => {
  if (value.status === 'REJECTED' && value.reviewNote.length < 4) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['reviewNote'], message: 'Add a short reason when requesting changes.' });
  }
});

function validatePropertyStatus(req, res, next) {
  if (typeof req.params.propertyId !== 'string' || req.params.propertyId.length > 64) {
    return res.status(400).json({ success: false, message: 'Invalid property ID.' });
  }
  return validateBody(updatePropertyStatusSchema)(req, res, next);
}

module.exports = { validatePropertyStatus };
