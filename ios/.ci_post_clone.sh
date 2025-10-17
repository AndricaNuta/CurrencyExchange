#!/bin/bash
set -euo pipefail

echo "🔧 [ci_post_clone] Installing CocoaPods..."

cd ios

export GEM_HOME="$HOME/.gem"
export PATH="$GEM_HOME/bin:$PATH"

if ! command -v pod > /dev/null; then
  echo "📦 Installing CocoaPods..."
  gem install cocoapods --no-document
fi

pod install --repo-update

echo "✅ [ci_post_clone] Pods installed successfully"
