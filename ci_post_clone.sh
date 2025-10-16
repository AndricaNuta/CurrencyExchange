#!/bin/bash
set -euo pipefail
cd "$CI_WORKSPACE"

echo "Node: $(node -v)"
echo "npm:  $(npm -v)"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# sanity check so we fail early if headers are missing
test -d node_modules/react-native-worklets-core/cpp
echo "✅ node_modules installed"
