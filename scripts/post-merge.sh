#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Restore the committed dependency versions without rewriting the lockfile.
npm ci --include=dev --no-audit --no-fund

# Offline checks only: no database migrations or external inference requests.
npm test

# Replit reconciles/restarts the configured workflows after this script exits.
