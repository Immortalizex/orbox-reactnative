// Load .env so EXPO_PUBLIC_* are available (backend URL, etc.)
const path = require('path');
const fs = require('fs');
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const m = trimmed.match(/^EXPO_PUBLIC_(\w+)\s*=\s*(.+)$/);
      if (m) process.env[`EXPO_PUBLIC_${m[1]}`] = m[2].replace(/^["']|["']$/g, '').trim();
    });
  }
} catch (_) {}

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || '/api',
      appId: process.env.EXPO_PUBLIC_APP_ID || 'default',
    },
    web: {
      bundler: 'metro',
      favicon: './assets/icon.png',
    },
  },
};
