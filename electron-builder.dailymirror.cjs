const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const base = yaml.load(
  fs.readFileSync(path.join(__dirname, 'electron-builder.yaml'), 'utf8'),
);

module.exports = {
  ...base,
  appId: 'com.dailymirror.desktop',
  productName: 'DailyMirror',
  directories: { ...base.directories, output: '../releases/windows' },
  files: [...base.files, 'LICENSE'],
  extraMetadata: { name: 'dailymirror', productName: 'DailyMirror' },
  win: {
    executableName: 'DailyMirror',
    icon: 'build/dailymirror.ico',
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'portable', arch: ['x64'] },
    ],
    signAndEditExecutable: true,
  },
  nsis: {
    ...base.nsis,
    artifactName: 'DailyMirror-Setup-${version}-x64.${ext}',
    shortcutName: 'DailyMirror',
    uninstallDisplayName: 'DailyMirror',
  },
  portable: { artifactName: 'DailyMirror-Portable-${version}-x64.${ext}' },
};
