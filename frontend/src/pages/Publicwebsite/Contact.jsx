import React, { useState } from 'react'
import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Calendar } from 'lucide-react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Handle form submission here
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: ['+977 1-2345678', '+977 1-2345679'],
      description: 'Call us anytime'
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['contact@namunacollege.edu.np'],
      description: 'Send us an email'
    },
    {
      icon: MapPin,
      title: 'Address',
      details: ['Itahari, Nepal'],
      description: 'Visit our location'
    },
    {
      icon: Clock,
      title: 'Hours',
      details: ['24/7 Reception', 'Check-in: 2:00 PM', 'Check-out: 11:00 AM'],
      description: 'Always available'
    }
  ]

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-white/90">
              We're here to help! Get in touch with us for any questions,
              reservations, or special requests.
            </p>
          </div>
        </div>
      </section>

      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Send us a Message</h2>
                <p className="text-gray-600">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+977 98-7654-3210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      <option value="reservation">Room Reservation</option>
                      <option value="event">Event Booking</option>
                      <option value="complaint">Complaint</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Cards */}
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon
                  return (
                    <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <IconComponent className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{info.title}</h3>
                          <div className="space-y-1">
                            {info.details.map((detail, idx) => (
                              <p key={idx} className="text-gray-700 font-medium">{detail}</p>
                            ))}
                          </div>
                          <p className="text-gray-500 text-sm mt-2">{info.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors">
                    <MessageCircle size={20} />
                    <span>Live Chat Support</span>
                  </button>
                  <button className="w-full flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors">
                    <Calendar size={20} />
                    <span>Book a Room</span>
                  </button>
                  <button className="w-full flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors">
                    <Phone size={20} />
                    <span>Call Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="mt-20">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Find Us</h3>
                <p className="text-gray-600 mb-6">
                  We're located in the heart of Thamel, Kathmandu's most vibrant tourist district.
                  Easy access to major attractions, shopping, and dining.
                </p>
              </div>
              <div className="h-96 bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-semibold">Interactive Map</p>
                  <p className="text-sm">Map integration would go here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Contact
