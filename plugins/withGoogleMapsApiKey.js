const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Expo config plugin: injects Google Maps API key into AndroidManifest.xml
 * so react-native-maps can display the map on Android.
 * Usage in app.config.js: plugins: [ [ './plugins/withGoogleMapsApiKey.js', { apiKey: 'YOUR_KEY' } ] ]
 */
function withGoogleMapsApiKey(config, { apiKey } = {}) {
  const key = (apiKey || config.android?.config?.googleMaps?.apiKey || '').trim();
  if (!key) return config; // skip so prebuild works without a key; set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for map on Android

  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest?.application?.[0];
    if (!app) return cfg;

    if (!app['meta-data']) app['meta-data'] = [];
    const meta = app['meta-data'];
    const existing = meta.find((m) => m.$?.['android:name'] === 'com.google.android.geo.API_KEY');
    if (existing) {
      existing.$['android:value'] = key;
    } else {
      meta.push({
        $: {
          'android:name': 'com.google.android.geo.API_KEY',
          'android:value': key,
        },
      });
    }
    return cfg;
  });
}

module.exports = withGoogleMapsApiKey;
