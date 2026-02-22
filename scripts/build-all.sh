#!/bin/bash
# Build script for ShardDen

set -e

echo "🏗️  Building ShardDen..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust/Cargo not found${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

# Build order: Core -> Tools -> WASM -> Web -> Desktop

echo ""
echo "🔨 Building Rust packages..."

# Build Core
echo "  → Building core..."
cargo build --release -p shard-den-core

# Build JSON Extractor
echo "  → Building json-extractor..."
cargo build --release -p shard-den-json-extractor
cargo build --release -p shard-den

# Build WASM
echo "  → Building WASM..."
cargo build --release -p shard-den-wasm --target wasm32-unknown-unknown

# Build Web
echo ""
echo "🌐 Building Web frontend..."
cd packages/web
npm install
npm run build
cd ../..

# Build Desktop
echo ""
echo "💻 Building Desktop app..."
echo -e "${YELLOW}⚠️  Desktop build requires Tauri CLI${NC}"
echo "   Install with: cargo install tauri-cli"
echo ""
echo "   Then run: cargo tauri build --manifest-path packages/desktop/Cargo.toml"

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "📦 Artifacts:"
echo "  CLI: target/release/shard-den.exe"
echo "  WASM: packages/wasm/target/wasm32-unknown-unknown/release/"
echo "  Web: packages/web/dist/"
echo ""
