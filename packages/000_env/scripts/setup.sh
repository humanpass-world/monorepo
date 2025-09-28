#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# decrypt env.jsonc from env.jsonc.enc
./scripts/env.sh decrypt

# Generate env files
node ./scripts/env.js

# Run more system checks
