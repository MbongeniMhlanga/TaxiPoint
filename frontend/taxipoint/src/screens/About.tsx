import React from "react";

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-start p-6">
      <div className="max-w-4xl w-full text-center mt-16">
        <h1 className="text-5xl font-bold text-blue-400 mb-6">About Our App</h1>
        <p className="text-gray-300 text-lg mb-6">
          Our mission is to provide a seamless, fast, and safe ride experience for everyone. 
          Just like Uber and Bolt, we aim to connect drivers and riders efficiently with advanced technology.
        </p>
        <p className="text-gray-400 mb-10">
          We are committed to safety, reliability, and convenience. Whether you are commuting daily or exploring new cities, 
          our app ensures you reach your destination effortlessly.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-6">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex-1">
            <h3 className="text-2xl font-semibold mb-2 text-blue-400">Fast & Reliable</h3>
            <p className="text-gray-300">Get to your destination quickly with real-time tracking and accurate ETAs.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex-1">
            <h3 className="text-2xl font-semibold mb-2 text-blue-400">Safe Rides</h3>
            <p className="text-gray-300">We prioritize your safety with verified drivers and robust safety features.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex-1">
            <h3 className="text-2xl font-semibold mb-2 text-blue-400">Customer Support</h3>
            <p className="text-gray-300">Our dedicated support team is always available to assist you.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
