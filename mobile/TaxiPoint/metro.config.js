const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add asset extensions for images
config.resolver.assetExts.push("png", "jpg", "jpeg", "gif");

// Optional: add TSX/JSX extensions if missing
config.resolver.sourceExts = [...config.resolver.sourceExts, "ts", "tsx", "js", "jsx"];

// Setup path alias '@' to project root
config.resolver.extraNodeModules = {
  "@": path.resolve(__dirname),
};

module.exports = config;
