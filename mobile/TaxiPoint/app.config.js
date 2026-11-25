const { expo } = require('./app.json');

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

const plugins = expo.plugins || [];

module.exports = {
  ...expo,
  runtimeVersion: expo.runtimeVersion || { policy: 'appVersion' },
  android: {
    ...(expo.android || {}),
    config: {
      ...(expo.android?.config || {}),
      googleMaps: {
        ...(expo.android?.config?.googleMaps || {}),
        ...(googleMapsApiKey ? { apiKey: googleMapsApiKey } : {}),
      },
    },
  },
  extra: {
    ...(expo.extra || {}),
    googleMapsApiKey,
  },
  plugins,
};
