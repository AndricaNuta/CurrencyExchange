#!/bin/bash
set -euo pipefail
cd "$CI_WORKSPACE"

echo "Node: $(node -v)"
echo "npm:  $(npm -v)"

# Make sure devDeps are not pruned by environment defaults
export NPM_CONFIG_PRODUCTION=false

if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# Hard fail if worklets-core isn't present
if [ ! -d node_modules/react-native-worklets-core/cpp ]; then
  echo "❌ react-native-worklets-core is missing. Is it in dependencies?"
  ls -la node_modules | sed -n '1,120p' || true
  exit 1
fi

echo "✅ node_modules installed (react-native-worklets-core present)"
