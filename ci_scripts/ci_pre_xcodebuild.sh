#!/bin/sh
set -euxo pipefail
echo "🛠️ pre-xcodebuild: ensure pods"
export GEM_HOME="$HOME/.gem"
export PATH="$GEM_HOME/bin:$PATH"
cd ios
pod install --repo-update
