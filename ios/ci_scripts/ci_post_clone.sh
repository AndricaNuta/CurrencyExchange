#!/bin/bash
set -euo pipefail

echo "🔧 Installing Node.js and CocoaPods..."

# Install Homebrew (if not present)
if ! command -v brew &> /dev/null; then
  echo "📦 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"  # For Apple Silicon
fi

# Install Node.js
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js..."
  brew install node
fi

# Setup RubyGems path
export GEM_HOME="$HOME/.gem"
export PATH="$GEM_HOME/bin:$PATH"

# Install CocoaPods
if ! command -v pod &> /dev/null; then
  echo "📦 Installing CocoaPods..."
  gem install cocoapods -v 1.15.2 --no-document
fi

# Install Pods
echo "📦 Running pod install..."
pod install --repo-update

echo "✅ Node and Pods installed successfully"
