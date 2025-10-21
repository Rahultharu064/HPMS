import Joi from 'joi'

export const bookingSchema = Joi.object({
  // Either guestId OR full guest info must be provided
  guestId: Joi.number().integer().positive(),

  // Guest info (used when guestId is not provided)
  firstName: Joi.string().min(1),
  lastName: Joi.string().min(1),
  email: Joi.string().email(),
  phone: Joi.string().min(6),

  // Booking details
  roomId: Joi.number().integer().positive().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required(),
  adults: Joi.number().integer().min(1).default(1),
  children: Joi.number().integer().min(0).default(0),

  // Optional fields managed by server/business logic
  paymentMethod: Joi.string().valid('Cash', 'cash', 'Card', 'card', 'Online', 'online', 'esewa', 'khalti').optional(),
  status: Joi.string().lowercase().valid('pending', 'confirmed', 'cancelled', 'completed').default('pending'),
  totalAmount: Joi.number().min(0),
  specialRequests: Joi.string().allow('').max(1000)
}).custom((value, helpers) => {
  // Enforce: either provide guestId, or provide all guest fields
  if (!value.guestId) {
    const requiredGuestFields = ['firstName', 'lastName', 'email', 'phone']
    const missing = requiredGuestFields.filter(k => !value[k])
    if (missing.length > 0) {
      return helpers.error('any.custom', { message: `Either 'guestId' or all of [firstName, lastName, email, phone] must be provided. Missing: ${missing.join(', ')}` })
    }
  }
  return value
})

