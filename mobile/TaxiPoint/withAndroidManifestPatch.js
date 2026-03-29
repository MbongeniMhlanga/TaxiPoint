const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidManifestPatch(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    // Suggestion: add 'tools:replace="android:appComponentFactory"'
    mainApplication.$['tools:replace'] = 'android:appComponentFactory';
    mainApplication.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
    
    // Ensure the tools namespace is added to the manifest tag
    if (!config.modResults.manifest.$['xmlns:tools']) {
      config.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    
    return config;
  });
};
