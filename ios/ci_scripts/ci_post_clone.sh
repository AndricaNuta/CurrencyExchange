#!/bin/bash
set -euo pipefail

echo "🔧 Installing CocoaPods..."

cd ios

export GEM_HOME="$HOME/.gem"
export PATH="$GEM_HOME/bin:$PATH"

if ! command -v pod > /dev/null; then
  echo "📦 Installing CocoaPods..."
  gem install cocoapods -v 1.15.2 --no-document
fi

echo "📦 Running pod install..."
pod install --repo-update

echo "✅ CocoaPods install complete"
