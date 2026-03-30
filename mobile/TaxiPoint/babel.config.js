module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [], // Reanimated 4/RN 0.81 handles this internally; manual plugin often causes startup crashes on New Arch
  };
};
