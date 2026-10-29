#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .ios-signing/config.sh ]]; then
  echo '请先按 docs/dailymirror/ios-packaging.zh-CN.md 配置 .ios-signing/config.sh'
  read -r -p '按回车键关闭...' unused
  exit 1
fi
source .ios-signing/config.sh
bash tools/package-dailymirror-ios.sh
read -r -p '打包完成，按回车键关闭...' unused
