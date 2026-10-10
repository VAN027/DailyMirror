const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
// Pillow is already available on the packaging machine; keep root npm dependencies unchanged.
const pngBuffer = (source, size) =>
  execFileSync(
    'python',
    [
      '-c',
      'from PIL import Image; import sys,io; im=Image.open(sys.argv[1]).convert("RGBA"); im=im.resize((int(sys.argv[2]),int(sys.argv[2])),Image.Resampling.LANCZOS); out=io.BytesIO(); im.save(out,format="PNG"); sys.stdout.buffer.write(out.getvalue())',
      source,
      String(size),
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );

const root = path.resolve(__dirname, '..');
const icon = path.join(root, 'build/dailymirror-icon.png');
const tray = path.join(root, 'build/dailymirror-tray-icon.png');
const writePng = async (source, target, size) => {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, pngBuffer(source, size));
};

async function run() {
  const png = pngBuffer(icon, 256);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  await fs.writeFile(
    path.join(root, 'build/dailymirror.ico'),
    Buffer.concat([header, png]),
  );
  await fs.writeFile(path.join(root, 'src/favicon.ico'), Buffer.concat([header, png]));
  await writePng(icon, path.join(root, 'electron/assets/icons/icon_256x256.png'), 256);
  for (const theme of ['d', 'l']) {
    for (const [suffix, size] of [
      ['', 22],
      ['@2x', 44],
    ]) {
      await writePng(
        tray,
        path.join(root, `electron/assets/icons/tray-ico-${theme}${suffix}.png`),
        size,
      );
    }
  }
  // indicator.ts loads these state images, rather than the legacy tray-ico files.
  execFileSync('python', [path.join(__dirname, 'generate-dailymirror-tray-icons.py')], {
    stdio: 'inherit',
  });
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, 'src/manifest.json'), 'utf8'),
  );
  for (const item of manifest.icons) {
    await writePng(
      icon,
      path.join(root, 'src', item.src),
      Number(item.sizes.split('x')[0]),
    );
  }
  for (const [density, size] of Object.entries({
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
  })) {
    for (const name of ['ic_launcher', 'ic_launcher_round']) {
      await writePng(
        icon,
        path.join(root, `android/app/src/main/res/mipmap-${density}/${name}.png`),
        size,
      );
    }
  }
  await writePng(
    icon,
    path.join(root, 'android/app/src/main/res/drawable/dailymirror_launcher.png'),
    432,
  );
  for (const name of ['ic_launcher', 'ic_launcher_round']) {
    await fs.writeFile(
      path.join(root, `android/app/src/main/res/mipmap-anydpi-v26/${name}.xml`),
      // Android masks the central 72dp of a 108dp adaptive layer. Inset the
      // complete supplied artwork by 18dp (1/6) so its original spacing survives.
      '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background>\n    <shape android:shape="rectangle">\n      <solid android:color="#5968F9" />\n    </shape>\n  </background>\n  <foreground>\n    <inset android:drawable="@drawable/dailymirror_launcher" android:insetLeft="16.666667%" android:insetTop="16.666667%" android:insetRight="16.666667%" android:insetBottom="16.666667%" />\n  </foreground>\n</adaptive-icon>\n',
    );
  }
  const stringsPath = path.join(root, 'android/app/src/main/res/values/strings.xml');
  const strings = await fs.readFile(stringsPath, 'utf8');
  await fs.writeFile(
    stringsPath,
    strings
      .replaceAll('Super Productivity', 'DailyMirror')
      .replace('Super Prod</string>', 'DailyMirror</string>'),
  );
  console.log('DailyMirror Windows, web and Android icons generated.');
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
