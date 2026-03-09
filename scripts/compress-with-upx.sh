#!/bin/bash
# UPX compression script for ShardDen binaries
# Usage: ./scripts/compress-with-upx.sh [path/to/binary]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🗜️  ShardDen UPX Compression Tool"
echo ""

# Check if UPX is installed
if ! command -v upx &> /dev/null; then
    echo -e "${RED}❌ UPX not found${NC}"
    echo ""
    echo "Install UPX:"
    echo "  Windows: scoop install upx"
    echo "  macOS:   brew install upx"
    echo "  Linux:   sudo apt-get install upx"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ UPX found${NC}"
upx --version | head -1
echo ""

# Default binary paths
BINARY_PATHS=(
    "target/release/shard-den.exe"
    "src-tauri/target/release/ShardDen.exe"
    "src-tauri/target/release/bundle/msi/*.msi"
    "src-tauri/target/release/bundle/nsis/*.exe"
)

# If argument provided, use it as target
if [ $# -eq 1 ]; then
    TARGET_PATH="$1"
    if [ -f "$TARGET_PATH" ]; then
        echo -e "${BLUE}📦 Compressing: $TARGET_PATH${NC}"
        
        # Get original size
        ORIGINAL_SIZE=$(stat -c%s "$TARGET_PATH" 2>/dev/null || stat -f%z "$TARGET_PATH" 2>/dev/null)
        
        # Compress with UPX
        upx --best --lzma "$TARGET_PATH"
        
        # Get compressed size
        COMPRESSED_SIZE=$(stat -c%s "$TARGET_PATH" 2>/dev/null || stat -f%z "$TARGET_PATH" 2>/dev/null)
        
        # Calculate reduction
        REDUCTION=$((ORIGINAL_SIZE - COMPRESSED_SIZE))
        PERCENTAGE=$((100 * REDUCTION / ORIGINAL_SIZE))
        
        echo -e "${GREEN}✅ Compression complete!${NC}"
        echo "   Original:   $(numfmt --to=iec-i $ORIGINAL_SIZE)"
        echo "   Compressed: $(numfmt --to=iec-i $COMPRESSED_SIZE)"
        echo "   Saved:      $(numfmt --to=iec-i $REDUCTION) ($PERCENTAGE%)"
    else
        echo -e "${RED}❌ File not found: $TARGET_PATH${NC}"
        exit 1
    fi
else
    # Compress all found binaries
    echo -e "${BLUE}🔍 Scanning for binaries...${NC}"
    echo ""
    
    FOUND=0
    for pattern in "${BINARY_PATHS[@]}"; do
        for file in $pattern; do
            if [ -f "$file" ]; then
                FOUND=$((FOUND + 1))
                echo -e "${BLUE}📦 Compressing: $file${NC}"
                
                # Get original size
                ORIGINAL_SIZE=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
                
                # Compress with UPX (best compression, LZMA)
                upx --best --lzma "$file" 2>/dev/null || {
                    echo -e "${YELLOW}⚠️  Skipped: $file (already compressed or incompatible)${NC}"
                    continue
                }
                
                # Get compressed size
                COMPRESSED_SIZE=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
                
                # Calculate reduction
                REDUCTION=$((ORIGINAL_SIZE - COMPRESSED_SIZE))
                if [ $ORIGINAL_SIZE -gt 0 ]; then
                    PERCENTAGE=$((100 * REDUCTION / ORIGINAL_SIZE))
                else
                    PERCENTAGE=0
                fi
                
                echo -e "${GREEN}   ✓ Saved: $(numfmt --to=iec-i $REDUCTION) ($PERCENTAGE%)${NC}"
                echo ""
            fi
        done
    done
    
    if [ $FOUND -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No binaries found to compress${NC}"
        echo ""
        echo "Build the project first:"
        echo "  cargo build --release"
        echo "  cargo tauri build"
        echo ""
        exit 1
    fi
    
    echo -e "${GREEN}✅ All binaries compressed!${NC}"
fi

echo ""
echo "💡 Note: UPX compressed binaries may have slightly slower startup times."
echo "   For maximum performance, use uncompressed builds in production."
