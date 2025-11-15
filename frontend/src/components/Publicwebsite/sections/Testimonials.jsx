import React, { useState, useEffect } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import testimonialService from '../../../services/testimonialService'

const Testimonials = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        // Try to get testimonials from reviews first, fallback to regular testimonials
        const response = await testimonialService.getFromReviews()
        if (response.success && response.data.length > 0) {
          setTestimonials(response.data)
        } else {
          // Fallback to regular testimonials
          const fallbackResponse = await testimonialService.getAll()
          if (fallbackResponse.success) {
            setTestimonials(fallbackResponse.data)
          }
        }
      } catch (err) {
        console.error('Error fetching testimonials:', err)
        setError('Failed to load testimonials')
        // Set default testimonials if API fails
        setTestimonials([
          {
            id: 1,
            name: 'Sarah Johnson',
            location: 'New York, USA',
            rating: 5,
            text: 'Absolutely amazing experience! The staff was incredibly friendly and the room was spotless. The view from our suite was breathtaking. Will definitely be back!',
            image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
          },
          {
            id: 2,
            name: 'Michael Chen',
            location: 'Tokyo, Japan',
            rating: 5,
            text: 'The attention to detail is remarkable. From the welcome drink to the turn-down service, everything was perfect. The spa facilities are world-class.',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
          },
          {
            id: 3,
            name: 'Emma Williams',
            location: 'London, UK',
            rating: 5,
            text: 'Perfect location in the heart of Kathmandu. The hotel combines modern luxury with traditional Nepali hospitality. Highly recommended for anyone visiting Nepal.',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
          },
          {
            id: 4,
            name: 'David Rodriguez',
            location: 'Madrid, Spain',
            rating: 5,
            text: 'The executive suite exceeded all expectations. The room service was prompt, the food was delicious, and the concierge helped us plan amazing day trips.',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-600 rounded-full px-4 py-2 mb-4">
            <Star className="fill-current" size={16} />
            <span className="font-semibold">Guest Reviews</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Our Guests Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our valued guests have to say 
            about their experience at HamroStay.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg">
                    <div className="text-center">
                      {/* Quote Icon */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Quote className="text-white" size={32} />
                      </div>

                      {/* Rating */}
                      <div className="flex justify-center gap-1 mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="fill-yellow-400 text-yellow-400" size={24} />
                        ))}
                      </div>

                      {/* Testimonial Text */}
                      <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 max-w-3xl mx-auto">
                        "{testimonial.text}"
                      </blockquote>

                      {/* Guest Info */}
                      <div className="flex items-center justify-center gap-4">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="text-left">
                          <h4 className="text-xl font-bold text-gray-900">{testimonial.name}</h4>
                          <p className="text-gray-600">{testimonial.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Overall Rating */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-4 bg-white rounded-2xl px-8 py-6 shadow-lg">
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">4.8</div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="fill-yellow-400 text-yellow-400" size={20} />
                ))}
              </div>
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold text-gray-900">Excellent</div>
              <div className="text-gray-600">Based on 500+ reviews</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
