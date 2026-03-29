const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidResolutionPatch(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const resolutionStrategy = `
      configurations.all {
          resolutionStrategy {
              force "androidx.versionedparcelable:versionedparcelable:1.1.1"
              force "androidx.annotation:annotation:1.9.0"
              force "androidx.core:core:1.15.0"
              force "androidx.core:core-ktx:1.15.0"
              force "androidx.appcompat:appcompat:1.7.0"
              force "androidx.activity:activity:1.9.2"
              force "androidx.activity:activity-ktx:1.9.2"
              force "androidx.fragment:fragment:1.8.4"
              force "androidx.fragment:fragment-ktx:1.8.4"
              force "androidx.lifecycle:lifecycle-runtime:2.8.6"
              force "androidx.lifecycle:lifecycle-viewmodel:2.8.6"
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
      
      dependencies {
          implementation "androidx.core:core:1.15.0"
          implementation "androidx.activity:activity:1.9.2"
          implementation "androidx.fragment:fragment:1.8.4"
          implementation "androidx.appcompat:appcompat:1.7.0"
      }
      `;
      
      if (!config.modResults.contents.includes('resolutionStrategy')) {
        config.modResults.contents = config.modResults.contents + resolutionStrategy;
      }
    }
    return config;
  });
};



