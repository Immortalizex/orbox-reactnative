const path = require('path');
const fs = require('fs');

// Load .env so EXPO_PUBLIC_* are available at build time
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const m = trimmed.match(/^EXPO_PUBLIC_(\w+)\s*=\s*(.+)$/);
        if (m) process.env[`EXPO_PUBLIC_${m[1]}`] = m[2].replace(/^["']|["']$/g, '').trim();
      });
  }
} catch (_) {}

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA2khpphiL_8BcsVhVpd5O2ewVmxAd-Y40rr';

module.exports = {
  expo: {
    name: 'OrBox Fit',
    slug: 'orbox-fit',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    // Keep disabled for now: some Android release builds can drop icon fonts with New Architecture enabled.
    newArchEnabled: false,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0a0a',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.orbox.fit',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#0a0a0a',
      },
      package: 'com.orbox.fit',
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: [
      'expo-asset',
      './plugins/withIoniconsAndroidFont.js',
      ['expo-font', { fonts: ['./assets/fonts/Ionicons.ttf'] }],
      ['./plugins/withGoogleMapsApiKey.js', { apiKey: googleMapsApiKey }],
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || '/api',
      appId: process.env.EXPO_PUBLIC_APP_ID || 'default',
      eas: {
        projectId: '0579d9cc-fd03-4c3c-8218-a51c1e272090',
      },
    },
    web: {
      bundler: 'metro',
      favicon: './assets/icon.png',
    },
  },
};
