#!/usr/bin/env node
// Reuse the Pillow toolchain used by DailyMirror's other icon generators.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
execFileSync(
  process.platform === 'win32' ? 'python' : 'python3',
  [
    '-c',
    'from PIL import Image; import sys; im=Image.open(sys.argv[1]).convert("RGBA").resize((1024,1024),Image.Resampling.LANCZOS); bg=Image.new("RGBA",im.size,"#5968F9"); Image.alpha_composite(bg,im).convert("RGB").save(sys.argv[2],format="PNG")',
    path.join(__dirname, '../build/dailymirror-icon.png'),
    path.join(
      __dirname,
      '../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
    ),
  ],
  { stdio: 'inherit' },
);
execFileSync(
  process.platform === 'win32' ? 'python' : 'python3',
  [
    '-c',
    'from PIL import Image; from pathlib import Path; import sys; im=Image.open(sys.argv[1]).convert("RGBA").resize((512,512),Image.Resampling.LANCZOS); bg=Image.new("RGBA",(2732,2732),"#5968F9"); bg.alpha_composite(im,(1110,1110)); [(bg.convert("RGB").save(p,format="PNG")) for p in Path(sys.argv[2]).glob("splash-2732x2732*.png")]',
    path.join(__dirname, '../build/dailymirror-icon.png'),
    path.join(__dirname, '../ios/App/App/Assets.xcassets/Splash.imageset'),
  ],
  { stdio: 'inherit' },
);
console.log('DailyMirror iOS icon generated: 1024x1024, opaque RGB.');
