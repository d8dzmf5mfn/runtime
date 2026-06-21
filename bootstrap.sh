#!/bin/bash
# Runtime — AI Dev Control Plane Bootstrap
# Run this to set up the project on your Desktop

set -e

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Desktop/Runtime(🫪)"

echo "=== Runtime Bootstrap ==="
echo "Source: $SRC"
echo "Dest:   $DEST"

if [ "$SRC" != "$DEST" ]; then
  echo "[1/3] Copying to Desktop..."
  rm -rf "$DEST"
  mkdir -p "$(dirname "$DEST")"
  cp -R "$SRC" "$DEST"
fi

cd "$DEST"
echo "[2/3] Installing dependencies..."
npm install
echo "[3/3] Building..."
npm run build
echo "=== Done ==="
echo "Run: cd $DEST && node packages/cli/dist/index.js --help"
