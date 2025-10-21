import Joi from 'joi'

export const bookingSchema = Joi.object({
  guestId: Joi.number().integer().positive().required(),
  roomId: Joi.number().integer().positive().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required(),
  adults: Joi.number().integer().min(1).default(1),
  children: Joi.number().integer().min(0).default(0),
  status: Joi.string().lowercase().valid('pending', 'confirmed', 'cancelled', 'completed').default('pending'),
  totalAmount: Joi.number().min(0),
  specialRequests: Joi.string().allow('').max(1000)
})

