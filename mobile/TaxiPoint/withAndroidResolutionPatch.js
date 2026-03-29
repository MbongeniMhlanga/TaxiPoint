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
              force "androidx.appcompat:appcompat:1.3.1"
              force "androidx.legacy:legacy-support-v4:1.0.0"
          }
          exclude group: 'com.android.support', module: 'support-v4'
          exclude group: 'com.android.support', module: 'support-compat'
          exclude group: 'com.android.support', module: 'support-media-compat'
          exclude group: 'com.android.support', module: 'support-core-utils'
          exclude group: 'com.android.support', module: 'support-core-ui'
          exclude group: 'com.android.support', module: 'support-fragment'
          exclude group: 'com.android.support', module: 'versionedparcelable'
      }
      `;
      
      if (!config.modResults.contents.includes('resolutionStrategy')) {
        config.modResults.contents = config.modResults.contents + resolutionStrategy;
      }
    }
    return config;
  });
};

