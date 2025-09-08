#!/bin/bash
# Epic 34 Complete Test Suite Runner
# Runs all aolite tests with proper reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_RESULTS_DIR="test-results"
TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)

echo -e "${GREEN}🧪 Epic 34: Complete aolite Test Suite${NC}"
echo "========================================="
echo ""

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

# Test categories
UNIT_TESTS_DIR="ao-processes/tests/unit"
INTEGRATION_TESTS_DIR="ao-processes/tests/integration"
PERFORMANCE_TESTS_DIR="ao-processes/tests/performance"

# Test execution function
run_test_category() {
    local category="$1"
    local test_dir="$2" 
    local results_file="$TEST_RESULTS_DIR/${category}_results_${TIMESTAMP}.txt"
    
    echo -e "${BLUE}📂 Running $category tests...${NC}"
    echo "Test Category: $category" > "$results_file"
    echo "Timestamp: $(date)" >> "$results_file"
    echo "=========================================" >> "$results_file"
    echo "" >> "$results_file"
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local test_files=()
    
    # Find all test files
    if [[ -d "$test_dir" ]]; then
        while IFS= read -r -d '' test_file; do
            test_files+=("$test_file")
        done < <(find "$test_dir" -name "*.test.lua" -print0)
    fi
    
    if [[ ${#test_files[@]} -eq 0 ]]; then
        echo -e "${YELLOW}  ⚠️  No test files found in $test_dir${NC}"
        echo "No test files found" >> "$results_file"
        return 0
    fi
    
    echo "Found ${#test_files[@]} test files:" >> "$results_file"
    
    # Run each test file
    for test_file in "${test_files[@]}"; do
        local test_name=$(basename "$test_file" .test.lua)
        echo -e "${YELLOW}  🧪 Running $test_name...${NC}"
        echo "" >> "$results_file"
        echo "=== $test_name ===" >> "$results_file"
        
        ((total_tests++))
        
        # Run the test and capture output
        if timeout 60 lua "$test_file" >> "$results_file" 2>&1; then
            echo -e "${GREEN}    ✅ $test_name PASSED${NC}"
            echo "RESULT: PASSED" >> "$results_file"
            ((passed_tests++))
        else
            echo -e "${RED}    ❌ $test_name FAILED${NC}"
            echo "RESULT: FAILED" >> "$results_file"
            ((failed_tests++))
        fi
    done
    
    # Category summary
    echo "" >> "$results_file"
    echo "=========================================" >> "$results_file"
    echo "CATEGORY SUMMARY:" >> "$results_file"
    echo "Total tests: $total_tests" >> "$results_file"
    echo "Passed: $passed_tests" >> "$results_file"
    echo "Failed: $failed_tests" >> "$results_file"
    
    echo ""
    echo -e "${BLUE}📊 $category Results:${NC}"
    echo "  Total: $total_tests"
    echo "  Passed: $passed_tests"
    echo "  Failed: $failed_tests"
    
    if [[ $failed_tests -gt 0 ]]; then
        echo -e "${RED}  Status: FAILED${NC}"
        return 1
    else
        echo -e "${GREEN}  Status: PASSED${NC}"
        return 0
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}🔍 Checking aolite installation...${NC}"
    
    if ! lua -e "require('aolite')" 2>/dev/null; then
        echo -e "${RED}❌ aolite not found. Please run: luarocks install aolite${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ aolite installed${NC}"
    echo ""
    
    local overall_status=0
    
    # Run unit tests
    if ! run_test_category "unit" "$UNIT_TESTS_DIR"; then
        overall_status=1
    fi
    echo ""
    
    # Run integration tests
    if ! run_test_category "integration" "$INTEGRATION_TESTS_DIR"; then
        overall_status=1
    fi
    echo ""
    
    # Run performance tests (if they exist)
    if [[ -d "$PERFORMANCE_TESTS_DIR" ]] && [[ -n "$(find "$PERFORMANCE_TESTS_DIR" -name "*.test.lua" 2>/dev/null)" ]]; then
        if ! run_test_category "performance" "$PERFORMANCE_TESTS_DIR"; then
            overall_status=1
        fi
        echo ""
    fi
    
    # Generate combined report
    local final_report="$TEST_RESULTS_DIR/epic34_test_report_${TIMESTAMP}.md"
    
    cat > "$final_report" << EOF
# Epic 34 Test Suite Report

**Generated:** $(date)  
**Test Runner:** aolite  
**Environment:** $(lua -v 2>&1 | head -1)

## Test Results Summary

EOF

    # Add results from each category
    for results_file in "$TEST_RESULTS_DIR"/*_results_${TIMESTAMP}.txt; do
        if [[ -f "$results_file" ]]; then
            echo "### $(basename "$results_file" _results_${TIMESTAMP}.txt | tr '[:lower:]' '[:upper:]')" >> "$final_report"
            echo '```' >> "$final_report"
            tail -20 "$results_file" >> "$final_report"
            echo '```' >> "$final_report"
            echo "" >> "$final_report"
        fi
    done
    
    # Final status
    echo "## Overall Status" >> "$final_report"
    if [[ $overall_status -eq 0 ]]; then
        echo "✅ **ALL TESTS PASSED**" >> "$final_report"
    else
        echo "❌ **SOME TESTS FAILED**" >> "$final_report"
    fi
    
    echo ""
    echo -e "${GREEN}📄 Test report generated: $final_report${NC}"
    echo ""
    
    if [[ $overall_status -eq 0 ]]; then
        echo -e "${GREEN}🎉 All tests passed! Epic 34 testing suite is working correctly.${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Check the detailed reports for issues.${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    if [[ $overall_status -eq 0 ]]; then
        echo "1. Bundle optimization: ./scripts/optimize-bundle-duplicates.sh"
        echo "2. Bundle validation: ./scripts/validate-bundle-sizes.sh"
        echo "3. Deploy to AO: ready for deployment"
    else
        echo "1. Fix failing tests"
        echo "2. Re-run test suite"
        echo "3. Proceed with bundle optimization when tests pass"
    fi
    
    return $overall_status
}

# Handle script arguments
case "${1:-run}" in
    run)
        main
        ;;
    unit)
        run_test_category "unit" "$UNIT_TESTS_DIR"
        ;;
    integration)
        run_test_category "integration" "$INTEGRATION_TESTS_DIR"
        ;;
    performance)
        run_test_category "performance" "$PERFORMANCE_TESTS_DIR"
        ;;
    help|*)
        echo "Epic 34 Test Suite Runner"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  run            Run all test categories (default)"
        echo "  unit           Run unit tests only"
        echo "  integration    Run integration tests only"
        echo "  performance    Run performance tests only"
        echo "  help           Show this help"
        ;;
esac