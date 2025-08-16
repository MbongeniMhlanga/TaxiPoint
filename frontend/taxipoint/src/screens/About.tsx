import React from "react";

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-start p-6">
      <div className="max-w-5xl w-full text-center mt-16">
        <h1 className="text-5xl font-bold text-blue-400 mb-6">About Taxipoint</h1>
        <p className="text-gray-300 text-lg mb-6">
          Taxipoint is designed to make commuting easier and more efficient. Our app helps you locate the nearest taxi ranks, find out where taxis are heading, and plan your trips with ease.
        </p>
        <p className="text-gray-400 mb-10">
          Whether you're commuting to work, school, or exploring the city, Taxipoint provides accurate and up-to-date information to help you reach your destination safely and on time.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-6">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex-1 hover:scale-105 transition-transform">
            <h3 className="text-2xl font-semibold mb-2 text-blue-400">Find Taxi Ranks</h3>
            <p className="text-gray-300">Quickly locate nearby taxi ranks no matter where you are in the city.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex-1 hover:scale-105 transition-transform">
            <h3 className="text-2xl font-semibold mb-2 text-blue-400">Trip Information</h3>
            <p className="text-gray-300">See where taxis are going and plan your commute effectively.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex-1 hover:scale-105 transition-transform">
            <h3 className="text-2xl font-semibold mb-2 text-blue-400">Reliable & Easy</h3>
            <p className="text-gray-300">Access accurate information anytime, making your commute stress-free.</p>
          </div>
        </div>

        <div className="mt-12 text-gray-300">
          <h2 className="text-3xl font-bold text-blue-400 mb-4">Our Mission</h2>
          <p className="mb-2">
            To provide commuters with real-time, reliable information about taxi ranks and routes, improving urban mobility and daily travel experiences.
          </p>
          <p>
            At Taxipoint, we aim to make every commute efficient, safe, and informed for all South African travelers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
