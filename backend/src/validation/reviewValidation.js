import Joi from 'joi'

export const reviewSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(3).max(2000).required()
})
