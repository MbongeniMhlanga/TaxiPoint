const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withAndroidBuildProperties(config) {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4096m -XX:MaxMetaspaceSize=512m',
    });
    return config;
  });
};
