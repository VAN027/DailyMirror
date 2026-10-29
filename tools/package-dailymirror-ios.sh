#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
node tools/check-dailymirror-changelog.js
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'iOS packaging requires macOS and Xcode. See docs/dailymirror/ios-packaging.zh-CN.md.' >&2
  exit 1
fi
: "${DAILYMIRROR_APPLE_TEAM_ID:?Set your Apple Team ID}"
: "${DAILYMIRROR_IOS_APP_PROFILE:?Set the app .mobileprovision path}"
: "${DAILYMIRROR_IOS_SHARE_PROFILE:?Set the ShareExtension .mobileprovision path}"
method="${DAILYMIRROR_IOS_EXPORT_METHOD:-release-testing}"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/dailymirror-ios.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT
python3 tools/prepare-dailymirror-ios-signing.py \
  --team "$DAILYMIRROR_APPLE_TEAM_ID" --method "$method" \
  --app-profile "$DAILYMIRROR_IOS_APP_PROFILE" \
  --share-profile "$DAILYMIRROR_IOS_SHARE_PROFILE" \
  --output "$work_dir/ExportOptions.plist"
xcodebuild -version

npm run buildFrontend:prodWeb
# productionWeb writes dist/browser directly, as configured in angular.json.
test -f dist/browser/index.html
npm run sync:ios
node tools/strip-service-worker-assets.js ios/App/App/public
cp LICENSE ios/App/App/public/LICENSE.txt
cp dist/3rdpartylicenses.txt ios/App/App/public/3rdpartylicenses.txt
# Capacitor sync runs pod install; the existing Podfile includes the native plugins.
version="$(node -p "require('./package.json').version.split('-')[0]")"
# shortcut: minute precision; override the build number for two exports in one minute.
build_number="${DAILYMIRROR_IOS_BUILD_NUMBER:-}"
if [[ -z "$build_number" ]]; then
  build_number="$(python3 -c 'import datetime; n=datetime.datetime.now(datetime.timezone.utc); print(f"{(n.date()-datetime.date(2020,1,1)).days}.{n.hour}.{n.minute}")')"
fi
xcodebuild archive -workspace ios/App/App.xcworkspace -scheme App \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$work_dir/DailyMirror.xcarchive" \
  MARKETING_VERSION="$version" CURRENT_PROJECT_VERSION="$build_number" \
  DEVELOPMENT_TEAM="$DAILYMIRROR_APPLE_TEAM_ID" \
  CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
xcodebuild -exportArchive -archivePath "$work_dir/DailyMirror.xcarchive" \
  -exportPath "$work_dir/export" -exportOptionsPlist "$work_dir/ExportOptions.plist"
python3 - "$work_dir/export" "$version" <<'PY'
import hashlib
import plistlib
import sys
import zipfile
from pathlib import Path
ipas = list(Path(sys.argv[1]).glob('*.ipa'))
if len(ipas) != 1:
    raise SystemExit('Expected one exported IPA')
with zipfile.ZipFile(ipas[0]) as archive:
    info = plistlib.loads(archive.read('Payload/App.app/Info.plist'))
    if info['CFBundleIdentifier'] != 'com.dailymirror.app' or info['CFBundleShortVersionString'] != sys.argv[2]:
        raise SystemExit('Exported IPA identity/version mismatch')
output = Path('../releases/ios')
output.mkdir(parents=True, exist_ok=True)
target = output / f'DailyMirror-{sys.argv[2]}-ios.ipa'
target.write_bytes(ipas[0].read_bytes())
checksum = hashlib.sha256(target.read_bytes()).hexdigest()
(output / f'SHA256SUMS-{sys.argv[2]}-ios.txt').write_text(f'{checksum}  {target.name}\n')
print(f'Created {target}')
PY
