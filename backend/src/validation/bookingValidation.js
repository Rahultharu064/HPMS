import Joi from 'joi'

export const bookingSchema = Joi.object({
  // Guest info (required to create or link guest)
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().min(6).max(20).required(),

  // Stay details
  roomId: Joi.number().integer().positive().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required(),
  adults: Joi.number().integer().min(1).required(),
  children: Joi.number().integer().min(0).default(0),

  // Payment
  paymentMethod: Joi.string().valid('Cash', 'Card', 'eSewa', 'Khalti').default('Cash')
})
