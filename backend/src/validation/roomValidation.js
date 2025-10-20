import Joi from "joi";

export const roomSchema = Joi.object({
  name: Joi.string().min(3).required(),
  roomType: Joi.string().required(),
  roomNumber: Joi.string().required(),
  floor: Joi.number().integer().required(),
  price: Joi.number().positive().required(),
  size: Joi.number().positive().required(),
  maxAdults: Joi.number().integer().min(1).required(),
  maxChildren: Joi.number().integer().min(0).optional(),
  numBeds: Joi.number().integer().min(1).required(),
  allowChildren: Joi.boolean().optional(),
  description: Joi.string().min(10).required(),
  status: Joi.string().optional().default("available"),
  amenities: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional()
});
