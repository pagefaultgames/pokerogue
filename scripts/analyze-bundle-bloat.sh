#!/bin/bash
# Bundle Bloat Analysis Script
# Identifies duplicate modules and size optimization opportunities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BUNDLE_DIR="${1:-build}"
REPORT_FILE="bundle-analysis-report.txt"

echo -e "${GREEN}🔍 Bundle Bloat Analysis${NC}"
echo "================================="
echo ""

# Check if build directory exists
if [[ ! -d "$BUNDLE_DIR" ]]; then
    echo -e "${RED}❌ Bundle directory not found: $BUNDLE_DIR${NC}"
    exit 1
fi

# Initialize report
echo "Bundle Bloat Analysis Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "=========================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

total_files=0
total_size=0

echo -e "${BLUE}📊 Bundle Size Summary:${NC}"
echo "Bundle Size Summary:" >> "$REPORT_FILE"
echo "-------------------" >> "$REPORT_FILE"

for bundle in "$BUNDLE_DIR"/*.lua; do
    if [[ -f "$bundle" ]]; then
        filename=$(basename "$bundle")
        size=$(wc -c < "$bundle")
        lines=$(wc -l < "$bundle")
        
        echo -e "${YELLOW}$filename:${NC} $size bytes, $lines lines"
        echo "$filename: $size bytes, $lines lines" >> "$REPORT_FILE"
        
        ((total_files++))
        ((total_size += size))
    fi
done

echo ""
echo -e "${GREEN}Total: $total_files files, $total_size bytes${NC}"
echo "Total: $total_files files, $total_size bytes" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Analyze duplicates for each bundle
echo -e "${BLUE}🔍 Duplicate Module Analysis:${NC}"
echo "Duplicate Module Analysis:" >> "$REPORT_FILE"
echo "-------------------------" >> "$REPORT_FILE"

for bundle in "$BUNDLE_DIR"/*.lua; do
    if [[ -f "$bundle" ]]; then
        filename=$(basename "$bundle")
        echo ""
        echo -e "${YELLOW}=== $filename ===${NC}"
        echo "=== $filename ===" >> "$REPORT_FILE"
        
        # Find most duplicated modules
        echo -e "${BLUE}Top duplicate modules:${NC}"
        echo "Top duplicate modules:" >> "$REPORT_FILE"
        
        grep "===== MODULE:" "$bundle" | \
        sed 's/^.*MODULE: //' | sed 's/ =====$//g' | \
        sort | uniq -c | sort -nr | head -10 | \
        while read count module; do
            if [[ $count -gt 1 ]]; then
                echo -e "  ${RED}$count× $module${NC}"
                echo "  $count× $module" >> "$REPORT_FILE"
            fi
        done
        
        # Calculate duplicate impact
        total_modules=$(grep -c "===== MODULE:" "$bundle" || echo 0)
        unique_modules=$(grep "===== MODULE:" "$bundle" | sed 's/^.*MODULE: //' | sed 's/ =====$//g' | sort | uniq | wc -l || echo 0)
        duplicate_count=$((total_modules - unique_modules))
        
        if [[ $duplicate_count -gt 0 ]]; then
            echo -e "${RED}📈 Duplication Impact: $duplicate_count duplicate inclusions${NC}"
            echo "📈 Duplication Impact: $duplicate_count duplicate inclusions" >> "$REPORT_FILE"
        fi
        
        echo "" >> "$REPORT_FILE"
    fi
done

# Size analysis
echo ""
echo -e "${BLUE}🎯 Size Optimization Recommendations:${NC}"
echo "Size Optimization Recommendations:" >> "$REPORT_FILE"
echo "==================================" >> "$REPORT_FILE"

for bundle in "$BUNDLE_DIR"/*.lua; do
    if [[ -f "$bundle" ]]; then
        filename=$(basename "$bundle")
        size=$(wc -c < "$bundle")
        
        # 500KB size limit (AO deployment recommendation)
        size_limit=512000
        
        if [[ $size -gt $size_limit ]]; then
            echo -e "${RED}❌ $filename: $size bytes (exceeds 500KB limit by $((size - size_limit)) bytes)${NC}"
            echo "❌ $filename: $size bytes (exceeds 500KB limit by $((size - size_limit)) bytes)" >> "$REPORT_FILE"
        else
            echo -e "${GREEN}✅ $filename: $size bytes (within 500KB limit)${NC}"
            echo "✅ $filename: $size bytes (within 500KB limit)" >> "$REPORT_FILE"
        fi
    fi
done

echo ""
echo -e "${BLUE}📋 Immediate Actions Required:${NC}"
echo "Immediate Actions Required:" >> "$REPORT_FILE"
echo "---------------------------" >> "$REPORT_FILE"

action_count=1
for bundle in "$BUNDLE_DIR"/*.lua; do
    if [[ -f "$bundle" ]]; then
        filename=$(basename "$bundle")
        size=$(wc -c < "$bundle")
        size_limit=512000
        
        if [[ $size -gt $size_limit ]]; then
            echo -e "${YELLOW}$action_count. Fix $filename duplication (priority: HIGH)${NC}"
            echo "$action_count. Fix $filename duplication (priority: HIGH)" >> "$REPORT_FILE"
            ((action_count++))
        fi
    fi
done

if [[ $action_count -eq 1 ]]; then
    echo -e "${GREEN}✅ All bundles are within size limits!${NC}"
    echo "✅ All bundles are within size limits!" >> "$REPORT_FILE"
fi

echo ""
echo -e "${GREEN}📄 Full report saved to: $REPORT_FILE${NC}"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "1. Run: ./scripts/optimize-bundle-duplicates.sh"
echo "2. Rebuild with: ./scripts/build-minimal-processes.sh"
echo "3. Validate with: ./scripts/validate-bundle-sizes.sh"