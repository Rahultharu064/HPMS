import Joi from 'joi'

const IdTypes = ['Passport', 'National ID', 'Driver License', 'Voter ID', 'Other']

// Normalize free-text nationality to ISO-2 country codes for South Asia
const COUNTRY_ALIASES = {
  IN: ['india', 'in', 'indian'],
  NP: ['nepal', 'np', 'nepali'],
  BD: ['bangladesh', 'bd', 'bangladeshi'],
  PK: ['pakistan', 'pk', 'pakistani'],
  LK: ['sri lanka', 'srilanka', 'lk', 'sri lankan', 'sri-lanka'],
  BT: ['bhutan', 'bt', 'bhutanese'],
  MV: ['maldives', 'mv', 'maldivian'],
  AF: ['afghanistan', 'af', 'afghan']
}

const normalizeCountryToISO2 = (name) => {
  const n = String(name || '').trim().toLowerCase()
  if (!n) return null
  for (const [iso, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (aliases.includes(n)) return iso
  }
  return null
}

// South Asia country-specific ID patterns
const COUNTRY_ID_RULES = {
  IN: {
    'Passport': /^[A-Z][0-9]{7}$/,
    'National ID': /^(?:\d{4}\s?\d{4}\s?\d{4}|\d{12})$/, // Aadhaar
    'Voter ID': /^[A-Z]{3}[0-9]{7}$/,
    'Driver License': /^[A-Z]{2}\d{2}\d{11}$/
  },
  NP: {
    'Passport': /^[A-Z][0-9]{7}$/,
    'National ID': /^[A-Z0-9-]{6,20}$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/
  },
  BD: {
    'Passport': /^[A-Z0-9]{8,9}$/,
    'National ID': /^(?:\d{10}|\d{13}|\d{17})$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/
  },
  PK: {
    'Passport': /^[A-Z]{2}\d{7}$/,
    'National ID': /^\d{5}-\d{7}-\d$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/
  },
  LK: {
    'Passport': /^[A-Z]\d{7}$/,
    'National ID': /^(?:\d{9}[VvXx]|\d{12})$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/
  },
  BT: {
    'Passport': /^[A-Z0-9]{8,9}$/,
    'National ID': /^\d{11}$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/
  },
  MV: {
    'Passport': /^[A-Z0-9]{8,9}$/,
    'National ID': /^[A-Z0-9]{5,20}$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/
  },
  AF: {
    'Passport': /^[A-Z]{1,2}\d{7}$/,
    'National ID': /^[A-Z0-9-]{6,20}$/,
    'Driver License': /^[A-Z0-9-]{5,20}$/
  }
}

// Conditional ID number pattern based on ID type (generic but practical constraints)
const idNumberSchema = Joi.when('idType', {
  switch: [
    {
      is: 'Passport',
      then: Joi.string()
        .pattern(/^[A-Z0-9]{6,12}$/i)
        .messages({ 'string.pattern.base': 'Passport number must be 6-12 alphanumeric characters' })
        .required(),
    },
    {
      is: 'National ID',
      then: Joi.string()
        .pattern(/^[A-Z0-9-]{6,20}$/i)
        .messages({ 'string.pattern.base': 'National ID must be 6-20 characters (letters, numbers, hyphen)' })
        .required(),
    },
    {
      is: 'Driver License',
      then: Joi.string()
        .pattern(/^[A-Z0-9-]{5,20}$/i)
        .messages({ 'string.pattern.base': 'Driver License must be 5-20 characters (letters, numbers, hyphen)' })
        .required(),
    },
    {
      is: 'Voter ID',
      then: Joi.string()
        .pattern(/^[A-Z0-9]{5,20}$/i)
        .messages({ 'string.pattern.base': 'Voter ID must be 5-20 alphanumeric characters' })
        .required(),
    },
    {
      is: 'Other',
      then: Joi.string().min(3).max(50).required(),
    },
  ],
  otherwise: Joi.string().min(3).max(50).required(),
})

export const bookingSchema = Joi.object({
  // Either guestId OR full guest info must be provided
  guestId: Joi.number().integer().positive(),

  // Guest info (used when guestId is not provided)
  firstName: Joi.string().min(1),
  lastName: Joi.string().min(1),
  email: Joi.string().email(),
  phone: Joi.string().min(6),
  nationality: Joi.string().min(1).max(100).optional(),
  idType: Joi.string().valid(...IdTypes).optional(),
  idNumber: idNumberSchema.optional(),

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
    // Public website flow: require ID info
    if (!value.idType) {
      return helpers.error('any.custom', { message: `Government ID Type is required` })
    }
    if (!value.idNumber) {
      return helpers.error('any.custom', { message: `ID Number is required` })
    }
  }

  // If idType is provided, idNumber must pass the corresponding rule
  if (value.idType) {
    // Prefer country-specific validation if nationality is recognized
    const iso = normalizeCountryToISO2(value.nationality)
    const specific = iso && COUNTRY_ID_RULES?.[iso]?.[value.idType]
    if (specific) {
      const ok = specific.test(String(value.idNumber || ''))
      if (!ok) {
        return helpers.error('any.custom', { message: `Invalid ${value.idType} format for ${value.nationality}` })
      }
    } else {
      const { error } = idNumberSchema.validate(value.idNumber, { context: { idType: value.idType } })
      if (error) {
        return helpers.error('any.custom', { message: error.message })
      }
    }
  }
  return value
})

