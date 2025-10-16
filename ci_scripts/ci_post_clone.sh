#!/bin/bash
set -euo pipefail
cd "$CI_WORKSPACE"

echo ":: Xcode Cloud - ci_post_clone.sh ::"
echo "Node: $(node -v)"; echo "npm: $(npm -v)"

# Install ALL deps (don’t prune devDeps; some native libs are miscategorized)
export NPM_CONFIG_PRODUCTION=false

if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# Prove worklets headers exist; fail early if not
test -d node_modules/react-native-worklets-core/cpp
echo "✅ node_modules installed (react-native-worklets-core present)"
