#!/bin/bash
# Clean multi-process build artifacts
# Removes build files and temporary artifacts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BUILD_DIR="build"
CLEAN_ALL=false
VERBOSE=false

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Clean multi-process build artifacts"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Show this help message"
    echo "  -a, --all      Clean all build artifacts (including dev builds)"
    echo "  -v, --verbose  Show detailed cleanup information"
    echo ""
    echo "Examples:"
    echo "  $0                # Clean production build artifacts"
    echo "  $0 --all          # Clean all build artifacts"
    echo "  $0 --verbose      # Clean with detailed output"
    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -a|--all)
            CLEAN_ALL=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${GREEN}🧹 Cleaning Multi-Process Build Artifacts${NC}"
echo "=========================================="
echo ""

if [[ ! -d "$BUILD_DIR" ]]; then
    echo -e "${YELLOW}⚠️  Build directory not found: $BUILD_DIR${NC}"
    echo -e "${GREEN}✅ Nothing to clean${NC}"
    exit 0
fi

# Count files before cleaning
total_files=$(find "$BUILD_DIR" -type f | wc -l | tr -d ' ')
total_size=$(du -sh "$BUILD_DIR" 2>/dev/null | cut -f1 || echo "unknown")

echo -e "${BLUE}📊 Current build artifacts:${NC}"
echo -e "${BLUE}   Files: $total_files${NC}"
echo -e "${BLUE}   Total size: $total_size${NC}"
echo ""

# Files to clean
PROCESS_FILES=("coordinator-process.lua" "battle-process.lua" "pokemon-process.lua" 
               "economy-process.lua" "security-process.lua" "admin-process.lua")
MANIFEST_FILES=("multi-process-manifest.json" "validation-report.json")
BUILD_INFO_FILES=("build-info.json")

files_removed=0
bytes_freed=0

remove_file() {
    local file=$1
    local description=$2
    
    if [[ -f "$BUILD_DIR/$file" ]]; then
        local size=$(wc -c < "$BUILD_DIR/$file" 2>/dev/null || echo 0)
        rm -f "$BUILD_DIR/$file"
        ((files_removed++))
        ((bytes_freed += size))
        
        if [[ "$VERBOSE" == "true" ]]; then
            echo -e "${GREEN}   ✅ Removed $description: $file (${size} bytes)${NC}"
        else
            echo -e "${GREEN}   ✅ Removed $description${NC}"
        fi
    elif [[ "$VERBOSE" == "true" ]]; then
        echo -e "${YELLOW}   ⚠️  Not found: $file${NC}"
    fi
}

echo -e "${BLUE}🗑️  Removing process build files...${NC}"
for file in "${PROCESS_FILES[@]}"; do
    process_name=$(echo "$file" | sed 's/-process\.lua$//')
    remove_file "$file" "$process_name process"
done

echo ""
echo -e "${BLUE}🗑️  Removing manifest files...${NC}"
for file in "${MANIFEST_FILES[@]}"; do
    description=$(echo "$file" | sed 's/-/ /g' | sed 's/\.json$//')
    remove_file "$file" "$description"
done

echo ""
echo -e "${BLUE}🗑️  Removing build info files...${NC}"
for file in "${BUILD_INFO_FILES[@]}"; do
    description=$(echo "$file" | sed 's/-/ /g' | sed 's/\.json$//')
    remove_file "$file" "$description"
done

# Clean development builds if requested
if [[ "$CLEAN_ALL" == "true" ]]; then
    echo ""
    echo -e "${BLUE}🗑️  Removing development build artifacts...${NC}"
    
    if [[ -d "$BUILD_DIR/dev" ]]; then
        dev_files=$(find "$BUILD_DIR/dev" -type f | wc -l | tr -d ' ')
        if [[ $dev_files -gt 0 ]]; then
            dev_size=$(du -sb "$BUILD_DIR/dev" 2>/dev/null | cut -f1 || echo 0)
            rm -rf "$BUILD_DIR/dev"
            ((files_removed += dev_files))
            ((bytes_freed += dev_size))
            echo -e "${GREEN}   ✅ Removed development builds ($dev_files files)${NC}"
        fi
    elif [[ "$VERBOSE" == "true" ]]; then
        echo -e "${YELLOW}   ⚠️  No development builds found${NC}"
    fi
    
    # Remove other temporary files
    temp_patterns=("*.tmp" "*.bak" "*.log" ".DS_Store")
    for pattern in "${temp_patterns[@]}"; do
        if find "$BUILD_DIR" -name "$pattern" -type f | grep -q .; then
            temp_count=$(find "$BUILD_DIR" -name "$pattern" -type f | wc -l | tr -d ' ')
            find "$BUILD_DIR" -name "$pattern" -type f -delete
            ((files_removed += temp_count))
            echo -e "${GREEN}   ✅ Removed $temp_count temporary files ($pattern)${NC}"
        elif [[ "$VERBOSE" == "true" ]]; then
            echo -e "${YELLOW}   ⚠️  No files matching $pattern${NC}"
        fi
    done
fi

echo ""

# Remove build directory if empty
if [[ -d "$BUILD_DIR" ]] && [[ -z "$(ls -A "$BUILD_DIR")" ]]; then
    rmdir "$BUILD_DIR"
    echo -e "${GREEN}🗑️  Removed empty build directory${NC}"
elif [[ -d "$BUILD_DIR" ]]; then
    remaining_files=$(find "$BUILD_DIR" -type f | wc -l | tr -d ' ')
    if [[ $remaining_files -gt 0 ]]; then
        echo -e "${BLUE}📁 Build directory retained ($remaining_files files remaining)${NC}"
    fi
fi

# Convert bytes to human readable
human_readable_size() {
    local bytes=$1
    if [[ $bytes -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ $bytes -lt $((1024*1024)) ]]; then
        echo "$((bytes/1024))KB"
    elif [[ $bytes -lt $((1024*1024*1024)) ]]; then
        echo "$((bytes/(1024*1024)))MB"
    else
        echo "$((bytes/(1024*1024*1024)))GB"
    fi
}

freed_size=$(human_readable_size $bytes_freed)

echo -e "${GREEN}🎉 Cleanup Summary${NC}"
echo "=================="
echo -e "${GREEN}✅ Files removed: $files_removed${NC}"
echo -e "${GREEN}✅ Space freed: $freed_size${NC}"
echo ""

if [[ $files_removed -eq 0 ]]; then
    echo -e "${YELLOW}No build artifacts found to clean${NC}"
else
    echo -e "${GREEN}Cleanup completed successfully! 🧹${NC}"
fi