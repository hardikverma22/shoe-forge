#!/usr/bin/env bash
# Builds public/models/forge-runner.glb from the source glTF.
# 1. split into named per-part nodes (scripts/split-parts.mjs)
# 2. compress textures to WebP and geometry with meshopt
# --join false keeps the parts separate; --instance false keeps them unique.
set -euo pipefail
mkdir -p .tmp-model public/models
node scripts/split-parts.mjs
npx gltf-transform optimize .tmp-model/parts.glb public/models/forge-runner.glb \
  --compress meshopt --texture-compress webp --join false --instance false
rm -rf .tmp-model
