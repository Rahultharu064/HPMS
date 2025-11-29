import { Calendar, MapPin, Users, Search } from "lucide-react";
import React, { useState } from "react";

export default function Hero() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/heroinc.jpeg"
          alt="Luxury Hotel"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <span className="text-amber-100 text-sm tracking-wide">Premium Hospitality Experience</span>
          </div>

          {/* Main Heading */}
                <h1 className="text-white mb-8 tracking-tight">
                <span className="block text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none">
                  Welcome to
                </span>
                <h3 className="block text-7xl sm:text-8xl lg:text-9xl mt-3 bg-gradient-to-r from-white via-white to-white bg-clip-text text-transparent font-black uppercase tracking-tighter leading-none drop-shadow-2xl" style={{ textShadow: '0 0 80px rgba(255, 255, 255, 0.5)' }}>
                  INCHOTEL
                </h3>
                <span className="block text-3xl sm:text-4xl lg:text-5xl mt-6 font-light tracking-wide italic text-white">
                  Your Perfect Stay Awaits
                </span>
                </h1>

                {/* Subheading */}
          <p className="text-gray-100 text-xl sm:text-2xl max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
            Experience world-class comfort and hospitality<span className="text-amber-300 font-normal"> · </span>Book your dream getaway with exclusive rates<span className="text-amber-300 font-normal"> · </span>Personalized service
          </p>
        </div>

        {/* Booking Form Card */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Location Input */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Destination
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Where to?"
                    className="w-full pl-10 h-12 border border-gray-300 rounded-md focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Check-in Date */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Check In
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full pl-10 h-12 border border-gray-300 rounded-md focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Check-out Date */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Check Out
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full pl-10 h-12 border border-gray-300 rounded-md focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Guests
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-md focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white appearance-none cursor-pointer"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                    <option value="5+">5+ Guests</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search Available Rooms
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-lg">
              <div className="text-3xl font-bold text-amber-600 mb-1">500+</div>
              <div className="text-gray-700 text-sm">Luxury Rooms</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-lg">
              <div className="text-3xl font-bold text-amber-600 mb-1">50+</div>
              <div className="text-gray-700 text-sm">Destinations</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-lg">
              <div className="text-3xl font-bold text-amber-600 mb-1">98%</div>
              <div className="text-gray-700 text-sm">Happy Guests</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-lg">
              <div className="text-3xl font-bold text-amber-600 mb-1">24/7</div>
              <div className="text-gray-700 text-sm">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10"></div>
    </div>
  );
}