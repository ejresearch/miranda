#!/bin/bash
# lock_lightrag_versions.sh - Prevent version conflicts

echo "🔒 Locking LightRAG-HKU to optimal versions..."

# Lock to working versions
pip install --force-reinstall \
  "lightrag-hku>=1.4.4,<2.0.0" \
  "openai>=1.10.0,<2.0.0" \
  "httpx>=0.24.1,<1.0.0"

echo "✅ Versions locked to working combination"
