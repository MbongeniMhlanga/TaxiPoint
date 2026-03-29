const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude web platform to prevent react-native-maps web import issues
config.resolver.platforms = ['ios', 'android'];

module.exports = config;