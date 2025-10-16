#!/bin/bash
set -euxo pipefail

# Xcode Cloud checks out your repo into $CI_WORKSPACE
cd "$CI_WORKSPACE/ios"

# Avoid Ruby frozen-string bugs we saw earlier
export RUBYOPT=""

# CocoaPods is preinstalled on Xcode Cloud; install Pods
pod install --repo-update
