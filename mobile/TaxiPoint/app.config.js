const { expo } = require('./app.json');

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

const plugins = (expo.plugins || []).map((plugin) => {
  if (plugin === 'react-native-maps') {
    if (googleMapsApiKey) {
      return [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: googleMapsApiKey,
        },
      ];
    }

    return plugin;
  }

  return plugin;
});

module.exports = {
  ...expo,
  extra: {
    ...(expo.extra || {}),
    googleMapsApiKey,
  },
  plugins,
};
