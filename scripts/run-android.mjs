/**
 * Runs `expo run:android` with JAVA_HOME and Android SDK paths set for Gradle.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');

function javaExe(home) {
  return path.join(home, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
}

function isValidJdk(home) {
  return Boolean(home && fs.existsSync(javaExe(home)));
}

function findJdkOnWindows() {
  const roots = [
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
  ].filter(Boolean);

  for (const root of roots) {
    const adoptiumBase = path.join(root, 'Eclipse Adoptium');
    if (fs.existsSync(adoptiumBase)) {
      const versions = fs
        .readdirSync(adoptiumBase)
        .filter((name) => name.startsWith('jdk'))
        .sort()
        .reverse();
      for (const name of versions) {
        const home = path.join(adoptiumBase, name);
        if (isValidJdk(home)) return home;
      }
    }
    const studioJbr = path.join(root, 'Android', 'Android Studio', 'jbr');
    if (isValidJdk(studioJbr)) return studioJbr;

    const javaBase = path.join(root, 'Java');
    if (fs.existsSync(javaBase)) {
      const versions = fs.readdirSync(javaBase).sort().reverse();
      for (const name of versions) {
        const home = path.join(javaBase, name);
        if (isValidJdk(home)) return home;
      }
    }
  }
  return null;
}

function findJdk() {
  if (isValidJdk(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }
  if (process.platform === 'win32') {
    return findJdkOnWindows();
  }
  if (process.platform === 'darwin') {
    const out = spawnSync('/usr/libexec/java_home', ['-v', '17'], {
      encoding: 'utf8',
    });
    if (out.status === 0) {
      const home = out.stdout.trim();
      if (isValidJdk(home)) return home;
    }
  }
  return null;
}

function isValidAndroidSdk(root) {
  if (!root || !fs.existsSync(root)) return false;
  const adb =
    process.platform === 'win32'
      ? path.join(root, 'platform-tools', 'adb.exe')
      : path.join(root, 'platform-tools', 'adb');
  return fs.existsSync(adb);
}

function parseLocalPropertiesSdkDir() {
  const lp = path.join(androidDir, 'local.properties');
  if (!fs.existsSync(lp)) return null;
  const text = fs.readFileSync(lp, 'utf8');
  const line = text.split(/\r?\n/).find((l) => /^\s*sdk\.dir\s*=/.test(l));
  if (!line) return null;
  const raw = line.replace(/^\s*sdk\.dir\s*=\s*/, '').trim();
  if (!raw) return null;
  let dir = raw.replace(/\//g, path.sep);
  if (process.platform === 'win32' && /^[A-Za-z]:\\/.test(dir)) {
    dir = dir.replace(/\\\\/g, '\\');
  }
  return dir;
}

function findAndroidSdk() {
  for (const key of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    const v = process.env[key];
    if (isValidAndroidSdk(v)) return path.resolve(v);
  }
  const fromFile = parseLocalPropertiesSdkDir();
  if (isValidAndroidSdk(fromFile)) return path.resolve(fromFile);

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const sdk = path.join(localAppData, 'Android', 'Sdk');
      if (isValidAndroidSdk(sdk)) return sdk;
    }
    const profile = process.env.USERPROFILE;
    if (profile) {
      const sdk = path.join(profile, 'AppData', 'Local', 'Android', 'Sdk');
      if (isValidAndroidSdk(sdk)) return sdk;
    }
  }

  if (process.platform === 'darwin') {
    const home = process.env.HOME;
    if (home) {
      const sdk = path.join(home, 'Library', 'Android', 'sdk');
      if (isValidAndroidSdk(sdk)) return sdk;
    }
  }

  if (process.env.HOME) {
    const sdk = path.join(process.env.HOME, 'Android', 'Sdk');
    if (isValidAndroidSdk(sdk)) return sdk;
  }

  return null;
}

/** Gradle reads sdk.dir; forward slashes work on Windows. */
function writeLocalProperties(sdkRoot) {
  if (!fs.existsSync(androidDir)) return;
  const sdkDirPosix = sdkRoot.replace(/\\/g, '/');
  const header =
    '# Auto-written by scripts/run-android.mjs (safe to delete; will be recreated)\n';
  const content = `${header}sdk.dir=${sdkDirPosix}\n`;
  const lp = path.join(androidDir, 'local.properties');
  fs.writeFileSync(lp, content, 'utf8');
}

const jdkHome = findJdk();
if (!jdkHome) {
  console.error('');
  console.error('No JDK found. Android builds need Java 17 (recommended).');
  console.error('');
  console.error('Windows: install Temurin 17, then reopen the terminal:');
  console.error('  winget install EclipseAdoptium.Temurin.17.JDK -e');
  console.error('');
  console.error('Or install Android Studio — it bundles a JDK under:');
  console.error('  ...\\Android\\Android Studio\\jbr');
  console.error('');
  console.error('Then either:');
  console.error('  • Set user environment variable JAVA_HOME to the JDK folder, or');
  console.error('  • Run "npm run android" again (this script auto-detects common installs).');
  console.error('');
  process.exit(1);
}

const sdkHome = findAndroidSdk();
if (!sdkHome) {
  console.error('');
  console.error('Android SDK not found. Gradle needs ANDROID_HOME or android/local.properties.');
  console.error('');
  console.error('Install the SDK (easiest: install Android Studio, then open it once).');
  console.error('Default location on Windows:');
  console.error('  %LOCALAPPDATA%\\Android\\Sdk');
  console.error('');
  console.error('Then either:');
  console.error('  • Set user variable ANDROID_HOME to that folder, or');
  console.error('  • Run "npm run android" again (this script auto-detects that path).');
  console.error('');
  process.exit(1);
}

writeLocalProperties(sdkHome);

const bin = path.join(jdkHome, 'bin');
const pathSep = process.platform === 'win32' ? ';' : ':';
const env = {
  ...process.env,
  JAVA_HOME: jdkHome,
  ANDROID_HOME: sdkHome,
  ANDROID_SDK_ROOT: sdkHome,
  PATH: `${bin}${pathSep}${process.env.PATH ?? ''}`,
};

console.log(`[DeliveryAPP] Using JAVA_HOME=${jdkHome}`);
console.log(`[DeliveryAPP] Using ANDROID_HOME=${sdkHome}\n`);

const extraArgs = process.argv.slice(2);
const result = spawnSync('npx', ['expo', 'run:android', ...extraArgs], {
  stdio: 'inherit',
  env,
  shell: true,
  cwd: projectRoot,
});

process.exit(result.status ?? 1);
