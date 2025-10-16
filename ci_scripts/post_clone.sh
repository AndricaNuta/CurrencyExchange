#!/bin/bash
set -euo pipefail
cd "$CI_WORKSPACE"

echo ":: Xcode Cloud - post_clone.sh running ::"
echo "Node: $(node -v)"; echo "npm: $(npm -v)"

# ensure devDeps too (some native libs are miscategorized)
export NPM_CONFIG_PRODUCTION=false

if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# hard fail if worklets headers aren't there
if [ ! -d node_modules/react-native-worklets-core/cpp ]; then
  echo "❌ react-native-worklets-core/cpp missing after npm install"
  npm ls react-native-worklets-core || true
  ls -la node_modules | head -n 200 || true
  exit 1
fi

echo "✅ node_modules installed (react-native-worklets-core present)"
