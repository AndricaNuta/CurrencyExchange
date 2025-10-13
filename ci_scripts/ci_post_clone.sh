#!/bin/sh
set -euo pipefail

echo "🔧 Ensuring CocoaPods is available"
if ! command -v pod >/dev/null 2>&1; then
  export GEM_HOME="$HOME/.gem"
  export PATH="$GEM_HOME/bin:$PATH"
  gem install cocoapods --no-document
fi

echo "📦 Installing pods"
cd ios
pod install --repo-update

echo "✅ Pods installed"
