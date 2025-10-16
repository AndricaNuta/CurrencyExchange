#!/bin/bash
set -euo pipefail
echo ":: Xcode Cloud - ci_pre_xcodebuild.sh ::"

# Safety net: if node_modules missing, install them here too
if [ ! -d "$CI_WORKSPACE/node_modules" ]; then
  cd "$CI_WORKSPACE"
  export NPM_CONFIG_PRODUCTION=false
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
fi

cd "$CI_WORKSPACE/ios"
pod install --repo-update
echo "✅ Cocoapods ready"
