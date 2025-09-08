#!/bin/bash
# Bundle Size Validation Script
# Validates bundles meet AO deployment size requirements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BUNDLE_DIR="${1:-build-optimized}"
MAX_SIZE=512000  # 500KB limit for reliable AO deployment
REPORT_FILE="bundle-validation-report.txt"

echo -e "${GREEN}🛡️  Bundle Size Validation${NC}"
echo "============================"
echo ""

# Check if bundle directory exists
if [[ ! -d "$BUNDLE_DIR" ]]; then
    echo -e "${RED}❌ Bundle directory not found: $BUNDLE_DIR${NC}"
    echo "Usage: $0 [bundle-directory]"
    exit 1
fi

# Initialize report
echo "Bundle Size Validation Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "Directory: $BUNDLE_DIR" >> "$REPORT_FILE"
echo "Size Limit: $MAX_SIZE bytes (500KB)" >> "$REPORT_FILE"
echo "=======================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

validation_passed=true
total_files=0
passed_files=0
failed_files=0

echo -e "${BLUE}📊 Validating bundle sizes...${NC}"
echo ""

for bundle in "$BUNDLE_DIR"/*.lua; do
    if [[ -f "$bundle" ]]; then
        filename=$(basename "$bundle")
        size=$(wc -c < "$bundle")
        lines=$(wc -l < "$bundle")
        
        ((total_files++))
        
        if [[ $size -le $MAX_SIZE ]]; then
            echo -e "${GREEN}✅ $filename${NC}"
            echo "  Size: $size bytes ($lines lines)"
            echo "  Status: PASS - Within 500KB limit"
            echo ""
            
            echo "✅ $filename: $size bytes ($lines lines) - PASS" >> "$REPORT_FILE"
            ((passed_files++))
        else
            excess=$((size - MAX_SIZE))
            echo -e "${RED}❌ $filename${NC}"
            echo "  Size: $size bytes ($lines lines)"
            echo "  Status: FAIL - Exceeds limit by $excess bytes"
            echo ""
            
            echo "❌ $filename: $size bytes ($lines lines) - FAIL (exceeds by $excess bytes)" >> "$REPORT_FILE"
            ((failed_files++))
            validation_passed=false
        fi
    fi
done

# Summary
echo "" >> "$REPORT_FILE"
echo "VALIDATION SUMMARY:" >> "$REPORT_FILE"
echo "==================" >> "$REPORT_FILE"
echo "Total files: $total_files" >> "$REPORT_FILE"
echo "Passed: $passed_files" >> "$REPORT_FILE"
echo "Failed: $failed_files" >> "$REPORT_FILE"

echo -e "${BLUE}📋 Validation Summary:${NC}"
echo "Total files: $total_files"
echo "Passed: $passed_files"
echo "Failed: $failed_files"
echo ""

if [[ $validation_passed == true ]]; then
    echo -e "${GREEN}🎉 ALL BUNDLES PASSED VALIDATION!${NC}"
    echo "All bundles are ready for AO deployment."
    echo ""
    echo "OVERALL STATUS: PASS - All bundles ready for deployment" >> "$REPORT_FILE"
    
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "1. Deploy bundles: ./scripts/deploy-validated-bundles.sh"
    echo "2. Test deployment: ./scripts/test-deployment.sh"
    echo ""
    
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED!${NC}"
    echo "Some bundles exceed the 500KB size limit."
    echo ""
    echo "OVERALL STATUS: FAIL - Some bundles exceed size limits" >> "$REPORT_FILE"
    
    echo -e "${YELLOW}🔧 Recommended Actions:${NC}"
    echo "1. Run additional optimization: ./scripts/emergency-bundle-split.sh"
    echo "2. Consider data externalization for large bundles"
    echo "3. Review module dependencies for further reduction"
    echo ""
    
    echo -e "${GREEN}📄 Full report saved to: $REPORT_FILE${NC}"
    
    exit 1
fi