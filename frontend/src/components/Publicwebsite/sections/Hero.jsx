import React from "react";

export default function Hero() {
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

        <div className="max-w-5xl mx-auto">
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
