const { withDangerousMod, withMainApplication } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SOURCE_FILE = 'ReminderNotificationChannels.kt';
const ENSURE_CALL = 'ReminderNotificationChannels.ensure(this)';

const REMINDER_SOUND_FILES = [
  'reminder_quiet.wav',
  'reminder_normal.wav',
  'reminder_noticeable.wav',
];

function copyReminderSoundsToRaw(projectRoot, platformProjectRoot) {
  const rawDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'raw');
  fs.mkdirSync(rawDir, { recursive: true });

  for (const fileName of REMINDER_SOUND_FILES) {
    const src = path.join(projectRoot, 'assets', 'Sounds', fileName);
    const dest = path.join(rawDir, fileName);
    if (!fs.existsSync(src)) {
      throw new Error(
        `[with-reminder-notification-channels] Missing sound asset: assets/Sounds/${fileName}`,
      );
    }
    fs.copyFileSync(src, dest);
  }
}

function copyChannelHelper(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const src = path.join(projectRoot, 'plugins', 'android', SOURCE_FILE);
      if (!fs.existsSync(src)) {
        return config;
      }

      // Guarantee custom notification sounds exist in res/raw for channel URIs.
      copyReminderSoundsToRaw(projectRoot, platformRoot);

      const javaRoot = path.join(platformRoot, 'app', 'src', 'main', 'java');
      const mainApplication =
        findFile(javaRoot, 'MainApplication.kt') ?? findFile(javaRoot, 'MainApplication.java');
      if (!mainApplication) {
        return config;
      }

      const dest = path.join(path.dirname(mainApplication), SOURCE_FILE);
      let contents = fs.readFileSync(src, 'utf8');
      const pkgMatch = fs.readFileSync(mainApplication, 'utf8').match(/^package\s+([^\s]+)/m);
      if (pkgMatch) {
        contents = contents.replace(/^package\s+.+$/m, `package ${pkgMatch[1]}`);
      }
      fs.writeFileSync(dest, contents);
      return config;
    },
  ]);
}

function findFile(dir, fileName) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === fileName) return fullPath;
    if (entry.isDirectory()) {
      const nested = findFile(fullPath, fileName);
      if (nested) return nested;
    }
  }
  return null;
}

function withEnsureCall(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes(ENSURE_CALL)) {
      return config;
    }
    contents = contents.replace(
      /super\.onCreate\(\)/,
      `super.onCreate()\n    ${ENSURE_CALL}`,
    );
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withReminderNotificationChannels(config) {
  config = copyChannelHelper(config);
  config = withEnsureCall(config);
  return config;
};
