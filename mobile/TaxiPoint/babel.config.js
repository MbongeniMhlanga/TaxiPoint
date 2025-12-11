module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',      // Expo default preset
      '@babel/preset-typescript', // For TypeScript
      '@babel/preset-react',      // For JSX
    ],
    plugins: [],
  };
};
