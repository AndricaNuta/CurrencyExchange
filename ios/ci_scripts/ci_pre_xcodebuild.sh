#!/bin/bash
set -euo pipefail

echo ":: Xcode Cloud - ci_pre_xcodebuild.sh ::"

# Provide a fallback if CI_WORKSPACE is not set
WORKSPACE="${CI_WORKSPACE:-$(cd ../.. && pwd)}"

# Safety net: if node_modules missing, install them here too
if [ ! -d "$WORKSPACE/node_modules" ]; then
  echo "📦 node_modules missing — installing deps..."
  cd "$WORKSPACE"
  export NPM_CONFIG_PRODUCTION=false
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
fi

cd "$WORKSPACE/ios"
pod install --repo-update

echo "✅ Cocoapods ready"
