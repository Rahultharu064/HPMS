export const validateBody = (schema) => (req, res, next) => {
  // If we expect multipart/form-data (files) clients might send text fields as strings.
  // Validate req.body as-is (Joi will coerce where possible).
  const { error, value } = schema.validate(req.body, { abortEarly: false, convert: true });
  if (error) {
    return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  }
  // attach coerced/validated value
  req.validatedBody = value;
  next();
};
