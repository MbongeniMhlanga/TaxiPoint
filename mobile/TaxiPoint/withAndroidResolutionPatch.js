const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidResolutionPatch(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const resolutionStrategy = `
      configurations.all {
          resolutionStrategy {
              force "androidx.versionedparcelable:versionedparcelable:1.1.1"
              force "androidx.annotation:annotation:1.7.0"
              force "androidx.core:core:1.12.0"
              force "androidx.core:core-ktx:1.12.0"
              force "androidx.appcompat:appcompat:1.6.1"
              force "androidx.activity:activity:1.8.0"
              force "androidx.fragment:fragment:1.6.1"
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


