import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Shield, Zap, Heart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  const features = [
    {
      icon: <MapPin size={28} />,
      title: 'Real-Time Locations',
      description: 'Find taxi ranks instantly with live location data and accurate directions.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: <Users size={28} />,
      title: 'Community Driven',
      description: 'Built by commuters, for commuters. Share incidents and help keep everyone safe.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: <Shield size={28} />,
      title: 'Safety First',
      description: 'Report and view incidents in real-time to make informed travel decisions.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: <Zap size={28} />,
      title: 'Lightning Fast',
      description: 'Optimized performance ensures you get the information you need, instantly.',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: <Heart size={28} />,
      title: 'Made with Care',
      description: 'Designed with love for the South African commuting community.',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: <TrendingUp size={28} />,
      title: 'Always Improving',
      description: 'Regular updates and new features based on your feedback.',
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <MapPin size={40} className="text-white" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold mb-4"
            >
              About TaxiPoint
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto"
            >
              Your trusted companion for navigating South Africa's taxi network
            </motion.p>
          </div>
        </motion.div>

        {/* Mission Section */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 md:p-12 mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-center max-w-3xl mx-auto">
              TaxiPoint was created to make commuting easier and safer for everyone. We provide real-time
              information about taxi ranks, help you navigate the city, and keep you informed about incidents
              that might affect your journey. Our goal is to empower commuters with the tools they need to
              travel confidently and efficiently.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-5xl font-bold mb-2">5+</div>
                <div className="text-blue-100 text-lg">Taxi Ranks</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-5xl font-bold mb-2">3</div>
                <div className="text-blue-100 text-lg">Districts Covered</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-5xl font-bold mb-2">24/7</div>
                <div className="text-blue-100 text-lg">Real-Time Updates</div>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mt-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of commuters who trust TaxiPoint for their daily travels.
            </p>
            <Link to="/taxi-ranks">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Explore Taxi Ranks
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
