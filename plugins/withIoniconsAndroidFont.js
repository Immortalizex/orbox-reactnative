const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Android: @expo/vector-icons Ionicons uses fontFamily "ionicons" (see create-icon-set.js).
 * On Android the glyph font is resolved by the .ttf basename, case-sensitively on many devices.
 * A file named Ionicons.ttf does not match "ionicons", so icons render as empty squares in release APKs.
 * This copies the bundled font to assets/fonts/ionicons.ttf so lookup succeeds everywhere.
 */
module.exports = function withIoniconsAndroidFont(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const src = path.join(projectRoot, 'assets', 'fonts', 'Ionicons.ttf');
      if (!fs.existsSync(src)) {
        console.warn('[withIoniconsAndroidFont] Missing assets/fonts/Ionicons.ttf — icon font not copied.');
        return cfg;
      }
      const fontsDir = path.join(platformRoot, 'app', 'src', 'main', 'assets', 'fonts');
      await fs.promises.mkdir(fontsDir, { recursive: true });
      const dest = path.join(fontsDir, 'ionicons.ttf');
      await fs.promises.copyFile(src, dest);
      return cfg;
    },
  ]);
};
