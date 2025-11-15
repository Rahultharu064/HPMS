import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Get all active testimonials
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      data: testimonials
    })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials'
    })
  }
}

// Get all testimonials (admin)
export const getAllTestimonialsAdmin = async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      data: testimonials
    })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials'
    })
  }
}

// Create testimonial
export const createTestimonial = async (req, res) => {
  try {
    const { name, location, rating, text, image } = req.body

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        location,
        rating: parseInt(rating),
        text,
        image
      }
    })

    res.status(201).json({
      success: true,
      data: testimonial,
      message: 'Testimonial created successfully'
    })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create testimonial'
    })
  }
}

// Update testimonial
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params
    const { name, location, rating, text, image, isActive } = req.body

    const testimonial = await prisma.testimonial.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name,
        location,
        rating: parseInt(rating),
        text,
        image,
        isActive
      }
    })

    res.json({
      success: true,
      data: testimonial,
      message: 'Testimonial updated successfully'
    })
  } catch (error) {
    console.error('Error updating testimonial:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update testimonial'
    })
  }
}

// Delete testimonial
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.testimonial.delete({
      where: {
        id: parseInt(id)
      }
    })

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete testimonial'
    })
  }
}

// Get testimonials from room reviews
export const getTestimonialsFromReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        room: {
          select: {
            name: true,
            roomType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to recent 10 reviews
    })

    // Transform reviews to testimonial format
    const testimonials = reviews.map(review => ({
      id: review.id,
      name: review.name,
      location: review.location || 'Kathmandu, Nepal', // Default location if not provided
      rating: Math.round(review.rating), // Convert float to int
      text: review.comment,
      image: review.image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Default image
      isActive: true,
      createdAt: review.createdAt
    }))

    res.json({
      success: true,
      data: testimonials
    })
  } catch (error) {
    console.error('Error fetching testimonials from reviews:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials from reviews'
    })
  }
}
