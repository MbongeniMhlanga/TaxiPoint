const { withAndroidManifest, withGradleProperties } = require('@expo/config-plugins');

module.exports = function withAndroidBuildProperties(config) {
  config = withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4096m -XX:MaxMetaspaceSize=512m',
    });
    return config;
  });

  return withAndroidManifest(config, (config) => {
    const apiKey = config.extra?.googleMapsApiKey;
    if (!apiKey) return config;

    const application = config.modResults.manifest.application[0];
    const metadata = application['meta-data'] || [];
    const name = 'com.google.android.geo.API_KEY';
    const existing = metadata.find((item) => item.$?.['android:name'] === name);

    if (existing) {
      existing.$['android:value'] = apiKey;
    } else {
      metadata.push({
        $: {
          'android:name': name,
          'android:value': apiKey,
        },
      });
    }

    application['meta-data'] = metadata;
    return config;
  });
};
