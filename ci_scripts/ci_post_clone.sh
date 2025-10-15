#!/bin/sh
set -euxo pipefail

echo "🔧 Post-clone START"
echo "PWD=$(pwd)"
ls -la

# Node deps
if command -v node >/dev/null 2>&1; then node -v; else echo "⚠️ node not found"; fi
if [ -f yarn.lock ]; then
  yarn --version || true
  yarn install --frozen-lockfile
elif [ -f pnpm-lock.yaml ]; then
  npm i -g pnpm
  pnpm install --frozen-lockfile
else
  npm ci
fi

# Ensure CocoaPods available (user-install, no sudo)
export GEM_HOME="$HOME/.gem"
export PATH="$GEM_HOME/bin:$PATH"
gem install cocoapods --no-document || true
pod --version

cd ios
echo "📦 Running pod install in $(pwd)"
pod repo update --silent || true
pod install --repo-update

echo "📂 Verify Pods target support files exist"
ls -la "Pods/Target Support Files" || true
ls -la "Pods/Target Support Files/Pods-CurrencyCamera" || true

echo "✅ Post-clone DONE"
