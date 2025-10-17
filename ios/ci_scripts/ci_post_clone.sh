#!/bin/bash
set -euo pipefail

echo "🔧 Installing Node.js, JS deps, and CocoaPods..."

# Install Homebrew (if needed)
if ! command -v brew &> /dev/null; then
  echo "📦 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Install Node.js
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js..."
  brew install node
fi

# Go one directory up to root of project
cd ../..

# JS dependencies (use yarn or npm depending on your project)
if [ -f yarn.lock ]; then
  echo "📦 Installing JS dependencies with yarn..."
  yarn install --frozen-lockfile
else
  echo "📦 Installing JS dependencies with npm..."
  npm ci
fi

# Return to ios folder
cd ios

# Set up Ruby Gems path
export GEM_HOME="$HOME/.gem"
export PATH="$GEM_HOME/bin:$PATH"

# Install CocoaPods
if ! command -v pod &> /dev/null; then
  echo "📦 Installing CocoaPods..."
  gem install cocoapods -v 1.15.2 --no-document
fi

# Pod install
echo "📦 Running pod install..."
pod install --repo-update

echo "✅ All dependencies installed"
