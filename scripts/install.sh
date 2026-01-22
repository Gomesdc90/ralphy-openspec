#!/usr/bin/env sh
set -eu

echo "Installing ralphy-spec via npm..."

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is not installed. Please install Node.js >= 20.19.0." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed. Please install npm (or a Node distribution that includes it)." >&2
  exit 1
fi

NODE_VERSION="$(node --version | sed 's/^v//')"
echo "Detected node v$NODE_VERSION"

npm install -g ralphy-spec@latest

echo "Done."
echo "Try: ralphy-spec --help"
