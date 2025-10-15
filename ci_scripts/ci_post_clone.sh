#!/bin/sh
set -euxo pipefail

# 1) Node deps (needed before pod install because RN generates pod specs)
if [ -f .nvmrc ]; then
  export NVM_DIR="$HOME/.nvm"
  . "$NVM_DIR/nvm.sh"
  nvm install
  nvm use
fi

if [ -f yarn.lock ]; then
  yarn install --frozen-lockfile
elif [ -f pnpm-lock.yaml ]; then
  npm i -g pnpm
  pnpm install --frozen-lockfile
else
  npm ci
fi

# 2) iOS pods
cd ios

# If you keep a Gemfile, prefer Bundler (pin Cocoapods):
if [ -f ../Gemfile ]; then
  gem install bundler --no-document || true
  bundle install --path ../.bundle
  bundle exec pod install --repo-update
else
  pod install --repo-update
fi
