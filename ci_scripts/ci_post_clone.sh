#!/bin/bash
set -euo pipefail

echo "== Post-clone env =="
command -v node >/dev/null && node -v || echo "node missing"
command -v npm  >/dev/null && npm -v  || true
command -v pod  >/dev/null && pod --version || true
ruby -v || true

# 1) Install JS deps (required for RN podspecs)
if [ -f yarn.lock ]; then
  yarn install --frozen-lockfile
elif [ -f package-lock.json ]; then
  npm ci
else
  npm i
fi

# 2) Ensure CocoaPods is available
if ! command -v pod >/dev/null 2>&1; then
  export GEM_HOME="$HOME/.gem"
  export PATH="$GEM_HOME/bin:$PATH"
  gem install cocoapods -v 1.15.2 --no-document
fi

# 3) Install pods
cd ios
pod install --repo-update

# 4) Sanity check – fail early if Pods target files are missing
ls "Pods/Target Support Files" >/dev/null
