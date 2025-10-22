import Joi from 'joi'

export const reviewSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  rating: Joi.number().min(0).max(5).required(),
  comment: Joi.string().min(3).max(2000).required()
})
