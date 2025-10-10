#!/usr/bin/env bash
set -euo pipefail

OUTDIR="android/app/build/outputs"
APK=$(ls -1 "$OUTDIR"/apk/**/app*-release*.apk 2>/dev/null | head -n1 || true)
AAB=$(ls -1 "$OUTDIR"/bundle/**/app*-release*.aab 2>/dev/null | head -n1 || true)
ART="${APK:-$AAB}"

if [[ -z "${ART}" ]]; then
  echo "❌ No release APK/AAB found under $OUTDIR"; exit 1
fi
echo "→ Using: $ART"

NDK="${ANDROID_NDK_HOME:-$HOME/Library/Android/sdk/ndk/27.1.12297006}"
if [[ -d "$NDK/toolchains/llvm/prebuilt/darwin-arm64/bin" ]]; then
  PREBUILT="$NDK/toolchains/llvm/prebuilt/darwin-arm64/bin"
else
  PREBUILT="$NDK/toolchains/llvm/prebuilt/darwin-x86_64/bin"
fi
READELF="$PREBUILT/llvm-readelf"

TMP=$(mktemp -d)
if [[ "${ART}" == *.apk ]]; then
  unzip -q "$ART" "lib/*/*.so" -d "$TMP"
  ROOT="$TMP/lib/arm64-v8a"
else
  unzip -q "$ART" "base/lib/*/*.so" -d "$TMP"
  ROOT="$TMP/base/lib/arm64-v8a"
fi

echo "Scanning .so files for 16KB alignment (0x4000)…"
bad=0
if [[ -d "$ROOT" ]]; then
  while IFS= read -r -d '' so; do
    aligns=$("$READELF" -l "$so" | awk '/LOAD/ {print $NF}' | sort -u | tr '\n' ' ')
    if echo "$aligns" | grep -Eq "(^| )0x1000( |$)|(^| )0x2000( |$)"; then
      echo "❌ 4/8KB align -> $so  (Aligns: $aligns)"
      bad=1
    else
      echo "✅ 16KB-ready -> $so  (Aligns: $aligns)"
    fi
  done < <(find "$ROOT" -name "*.so" -print0)
else
  echo "❗ No arm64-v8a libs found at $ROOT"
fi

rm -rf "$TMP"
exit $bad
