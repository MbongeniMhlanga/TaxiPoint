const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidResolutionPatch(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const resolutionStrategy = `
      configurations.all {
          resolutionStrategy {
              force "androidx.versionedparcelable:versionedparcelable:1.1.1"
              force "androidx.annotation:annotation:1.2.0"
              force "androidx.core:core:1.6.0"
          }
      }
      `;
      
      if (!config.modResults.contents.includes('resolutionStrategy')) {
        config.modResults.contents = config.modResults.contents + resolutionStrategy;
      }
    }
    return config;
  });
};
