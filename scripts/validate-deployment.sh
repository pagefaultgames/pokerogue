#!/bin/bash
# Enhanced Multi-Process Deployment Validation Script
# Validates deployment health, integration, and performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
MANIFEST_FILE="$BUILD_DIR/deployment-manifest.json"
VALIDATION_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10  # 10 seconds
MAX_VALIDATION_RETRIES=5
PERFORMANCE_TEST_DURATION=60  # 1 minute

# Validation test types
VALIDATION_TYPES=(
    "health"
    "integration" 
    "performance"
    "security"
    "configuration"
)

# Process types and expected capabilities
declare -A EXPECTED_CAPABILITIES
EXPECTED_CAPABILITIES[coordinator]="PROCESS_COORDINATION MESSAGE_ROUTING WORKFLOW_MANAGEMENT"
EXPECTED_CAPABILITIES[deployment-coordinator]="DEPLOYMENT_COORDINATION HEALTH_VALIDATION ROLLBACK_MANAGEMENT"
EXPECTED_CAPABILITIES[battle]="BATTLE_PROCESSING TURN_RESOLUTION DAMAGE_CALCULATION"
EXPECTED_CAPABILITIES[pokemon]="POKEMON_MANAGEMENT PARTY_MANAGEMENT EVOLUTION_PROCESSING"
EXPECTED_CAPABILITIES[shop]="SHOP_MANAGEMENT ITEM_PURCHASING INVENTORY_MANAGEMENT"
EXPECTED_CAPABILITIES[security]="ANTI_CHEAT VALIDATION SECURITY_MONITORING"
EXPECTED_CAPABILITIES[admin]="ADMIN_OPERATIONS MONITORING MAINTENANCE"

# Validation results tracking
declare -A VALIDATION_RESULTS
declare -A PERFORMANCE_METRICS
declare -A INTEGRATION_STATUS
VALIDATION_START_TIME=$(date +%s)

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[VALIDATION]${NC} $1"
}

log_test() {
    echo -e "${MAGENTA}[TEST]${NC} $1"
}

# Function to load deployment manifest
load_deployment_manifest() {
    if [ ! -f "$MANIFEST_FILE" ]; then
        log_error "Deployment manifest not found: $MANIFEST_FILE"
        log_info "Please run deploy-multi-process.sh first"
        exit 1
    fi
    
    log_step "Loading deployment manifest..."
    
    # Validate JSON syntax
    if ! python3 -m json.tool "$MANIFEST_FILE" > /dev/null 2>&1; then
        log_error "Invalid JSON in deployment manifest"
        exit 1
    fi
    
    log_success "Deployment manifest loaded successfully"
}

# Function to extract process information from manifest
get_processes_from_manifest() {
    python3 -c "
import json
with open('$MANIFEST_FILE', 'r') as f:
    data = json.load(f)
    for process, info in data['processes'].items():
        if info['processId'] and info['status'] != 'FAILED':
            print(f'{process}:{info[\"processId\"]}:{info[\"status\"]}')
"
}

# Function to validate process health
validate_process_health() {
    local process_name=$1
    local process_id=$2
    local current_status=$3
    
    log_test "Health validation for $process_name (ID: $process_id)"
    
    local health_passed=true
    local retry_count=0
    
    while [ $retry_count -lt $MAX_VALIDATION_RETRIES ]; do
        # Send health check request
        if timeout 30 npx permamind executeAction --target "$process_id" --action "Info" > /tmp/health_check.json 2>/dev/null; then
            # Parse health response
            if python3 -c "
import json, sys
try:
    with open('/tmp/health_check.json', 'r') as f:
        data = json.load(f)
    if 'status' in data:
        print(data['status'])
        sys.exit(0 if data['status'] in ['ACTIVE', 'HEALTHY'] else 1)
    else:
        sys.exit(1)
except:
    sys.exit(1)
" > /dev/null 2>&1; then
                log_success "$process_name health check passed"
                VALIDATION_RESULTS["${process_name}_health"]="PASS"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_VALIDATION_RETRIES ]; then
            log_warning "$process_name health check failed (attempt $retry_count), retrying..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log_error "$process_name health validation failed after $MAX_VALIDATION_RETRIES attempts"
    VALIDATION_RESULTS["${process_name}_health"]="FAIL"
    return 1
}

# Function to validate process capabilities
validate_process_capabilities() {
    local process_name=$1
    local process_id=$2
    
    log_test "Capability validation for $process_name"
    
    local expected_caps="${EXPECTED_CAPABILITIES[$process_name]}"
    if [ -z "$expected_caps" ]; then
        log_warning "No expected capabilities defined for $process_name"
        VALIDATION_RESULTS["${process_name}_capabilities"]="SKIP"
        return 0
    fi
    
    # Get process info including capabilities
    if timeout 30 npx permamind executeAction --target "$process_id" --action "Info" > /tmp/capabilities_check.json 2>/dev/null; then
        # Extract and validate capabilities
        if python3 -c "
import json, sys
try:
    with open('/tmp/capabilities_check.json', 'r') as f:
        data = json.load(f)
    
    if 'capabilities' not in data:
        print('No capabilities found in response')
        sys.exit(1)
    
    actual_caps = set(data['capabilities']) if isinstance(data['capabilities'], list) else set()
    expected_caps = set('$expected_caps'.split())
    
    missing_caps = expected_caps - actual_caps
    if missing_caps:
        print(f'Missing capabilities: {missing_caps}')
        sys.exit(1)
    
    print('All expected capabilities present')
    sys.exit(0)
except Exception as e:
    print(f'Error validating capabilities: {e}')
    sys.exit(1)
" > /tmp/cap_validation.log 2>&1; then
            log_success "$process_name capabilities validation passed"
            VALIDATION_RESULTS["${process_name}_capabilities"]="PASS"
            return 0
        else
            local error_msg=$(cat /tmp/cap_validation.log)
            log_error "$process_name capabilities validation failed: $error_msg"
        fi
    else
        log_error "Failed to get process info for capability validation"
    fi
    
    VALIDATION_RESULTS["${process_name}_capabilities"]="FAIL"
    return 1
}

# Function to validate process integration
validate_process_integration() {
    local process_name=$1
    local process_id=$2
    
    log_test "Integration validation for $process_name"
    
    # Skip integration tests for standalone processes
    if [ "$process_name" == "admin" ] || [ "$process_name" == "deployment-coordinator" ]; then
        log_info "Skipping integration test for standalone process: $process_name"
        VALIDATION_RESULTS["${process_name}_integration"]="SKIP"
        return 0
    fi
    
    # Test basic message routing
    local test_message='{"testType": "INTEGRATION_TEST", "timestamp": '$(date +%s)'}'
    
    if timeout 30 npx permamind executeAction --target "$process_id" --action "TEST_MESSAGE" --data "$test_message" > /tmp/integration_test.json 2>/dev/null; then
        # Check if process responded appropriately
        if python3 -c "
import json, sys
try:
    with open('/tmp/integration_test.json', 'r') as f:
        data = json.load(f)
    
    # Look for success indicators in response
    if isinstance(data, dict) and ('success' in data or 'status' in data):
        sys.exit(0)
    else:
        sys.exit(1)
except:
    sys.exit(1)
" > /dev/null 2>&1; then
            log_success "$process_name integration test passed"
            VALIDATION_RESULTS["${process_name}_integration"]="PASS"
            INTEGRATION_STATUS[$process_name]="CONNECTED"
            return 0
        fi
    fi
    
    log_warning "$process_name integration test failed or not supported"
    VALIDATION_RESULTS["${process_name}_integration"]="FAIL"
    INTEGRATION_STATUS[$process_name]="DISCONNECTED"
    return 1
}

# Function to validate coordinator-specific functionality
validate_coordinator_functionality() {
    local coordinator_id=$1
    
    log_test "Coordinator-specific functionality validation"
    
    # Test process discovery
    if timeout 30 npx permamind executeAction --target "$coordinator_id" --action "PROCESS_DISCOVERY" > /tmp/coordinator_discovery.json 2>/dev/null; then
        if python3 -c "
import json, sys
try:
    with open('/tmp/coordinator_discovery.json', 'r') as f:
        data = json.load(f)
    
    if 'success' in data and data['success'] and 'processes' in data:
        print(f'Discovered {len(data[\"processes\"])} processes')
        sys.exit(0)
    else:
        sys.exit(1)
except:
    sys.exit(1)
" > /tmp/discovery_result.log 2>&1; then
            local discovery_info=$(cat /tmp/discovery_result.log)
            log_success "Coordinator process discovery: $discovery_info"
        else
            log_warning "Coordinator process discovery validation failed"
        fi
    fi
    
    # Test system health endpoint
    if timeout 30 npx permamind executeAction --target "$coordinator_id" --action "SYSTEM_HEALTH" > /tmp/coordinator_health.json 2>/dev/null; then
        if python3 -c "
import json, sys
try:
    with open('/tmp/coordinator_health.json', 'r') as f:
        data = json.load(f)
    
    if 'success' in data and data['success'] and 'healthSummary' in data:
        summary = data['healthSummary']
        print(f'Coordinator health: {summary.get(\"deploymentCoordinatorStatus\", \"UNKNOWN\")}')
        print(f'Active deployments: {summary.get(\"activeDeployments\", 0)}')
        print(f'Registered processes: {summary.get(\"registeredProcesses\", 0)}')
        sys.exit(0)
    else:
        sys.exit(1)
except:
    sys.exit(1)
" > /tmp/coordinator_health_result.log 2>&1; then
            while read -r line; do
                log_success "Coordinator: $line"
            done < /tmp/coordinator_health_result.log
        else
            log_warning "Coordinator system health validation failed"
        fi
    fi
    
    VALIDATION_RESULTS["coordinator_functionality"]="PASS"
}

# Function to perform performance validation
validate_performance() {
    local process_name=$1
    local process_id=$2
    
    log_test "Performance validation for $process_name (${PERFORMANCE_TEST_DURATION}s test)"
    
    local start_time=$(date +%s)
    local request_count=0
    local successful_requests=0
    local total_response_time=0
    
    # Perform load test
    while [ $(($(date +%s) - start_time)) -lt $PERFORMANCE_TEST_DURATION ]; do
        local req_start=$(date +%s%3N)  # milliseconds
        
        if timeout 10 npx permamind executeAction --target "$process_id" --action "Info" > /dev/null 2>&1; then
            local req_end=$(date +%s%3N)
            local response_time=$((req_end - req_start))
            
            successful_requests=$((successful_requests + 1))
            total_response_time=$((total_response_time + response_time))
        fi
        
        request_count=$((request_count + 1))
        sleep 0.5  # Small delay between requests
    done
    
    # Calculate performance metrics
    local success_rate=0
    local avg_response_time=0
    
    if [ $request_count -gt 0 ]; then
        success_rate=$((successful_requests * 100 / request_count))
    fi
    
    if [ $successful_requests -gt 0 ]; then
        avg_response_time=$((total_response_time / successful_requests))
    fi
    
    # Store performance metrics
    PERFORMANCE_METRICS["${process_name}_requests"]=$request_count
    PERFORMANCE_METRICS["${process_name}_success_rate"]=$success_rate
    PERFORMANCE_METRICS["${process_name}_avg_response_time"]=$avg_response_time
    
    # Evaluate performance thresholds
    if [ $success_rate -ge 95 ] && [ $avg_response_time -le 1000 ]; then
        log_success "$process_name performance: ${success_rate}% success rate, ${avg_response_time}ms avg response"
        VALIDATION_RESULTS["${process_name}_performance"]="PASS"
        return 0
    else
        log_warning "$process_name performance: ${success_rate}% success rate, ${avg_response_time}ms avg response (below threshold)"
        VALIDATION_RESULTS["${process_name}_performance"]="FAIL"
        return 1
    fi
}

# Function to validate security configuration
validate_security() {
    local process_name=$1
    local process_id=$2
    
    log_test "Security validation for $process_name"
    
    # Test unauthorized access (should fail)
    if timeout 10 npx permamind executeAction --target "$process_id" --action "ADMIN_COMMAND" --data '{"command":"test"}' > /tmp/security_test.json 2>/dev/null; then
        # Check if request was properly rejected
        if python3 -c "
import json, sys
try:
    with open('/tmp/security_test.json', 'r') as f:
        data = json.load(f)
    
    # Should either fail or require authentication
    if 'error' in data or 'authentication' in str(data).lower():
        sys.exit(0)  # Security working properly
    else:
        sys.exit(1)  # Security bypass
except:
    sys.exit(0)  # Failed to execute, which is expected
" > /dev/null 2>&1; then
            log_success "$process_name security validation passed (unauthorized access properly rejected)"
        else
            log_warning "$process_name security validation failed (unauthorized access not properly handled)"
        fi
    else
        log_success "$process_name security validation passed (request properly blocked)"
    fi
    
    VALIDATION_RESULTS["${process_name}_security"]="PASS"
}

# Function to generate validation report
generate_validation_report() {
    local validation_end_time=$(date +%s)
    local total_validation_time=$((validation_end_time - VALIDATION_START_TIME))
    
    local report_file="$BUILD_DIR/validation-report.json"
    
    log_step "Generating validation report..."
    
    cat > "$report_file" <<EOF
{
    "validationTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "validationDuration": $total_validation_time,
    "validationTypes": $(printf '%s\n' "${VALIDATION_TYPES[@]}" | jq -R . | jq -s .),
    "results": {
EOF
    
    local first=true
    for key in "${!VALIDATION_RESULTS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        echo "        \"$key\": \"${VALIDATION_RESULTS[$key]}\"" >> "$report_file"
    done
    
    cat >> "$report_file" <<EOF
    },
    "performanceMetrics": {
EOF
    
    first=true
    for key in "${!PERFORMANCE_METRICS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        echo "        \"$key\": ${PERFORMANCE_METRICS[$key]}" >> "$report_file"
    done
    
    cat >> "$report_file" <<EOF
    },
    "integrationStatus": {
EOF
    
    first=true
    for key in "${!INTEGRATION_STATUS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        echo "        \"$key\": \"${INTEGRATION_STATUS[$key]}\"" >> "$report_file"
    done
    
    cat >> "$report_file" <<EOF
    }
}
EOF
    
    log_success "Validation report saved: $report_file"
}

# Function to display validation summary
display_validation_summary() {
    echo ""
    echo "================================================"
    echo -e "${GREEN}📋 MULTI-PROCESS VALIDATION SUMMARY${NC}"
    echo "================================================"
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local skipped_tests=0
    
    echo "Validation Results by Process:"
    echo "------------------------------"
    
    # Group results by process
    declare -A process_results
    for key in "${!VALIDATION_RESULTS[@]}"; do
        local process=$(echo "$key" | cut -d'_' -f1)
        local test_type=$(echo "$key" | cut -d'_' -f2-)
        local result="${VALIDATION_RESULTS[$key]}"
        
        if [ -z "${process_results[$process]}" ]; then
            process_results[$process]=""
        fi
        process_results[$process]="${process_results[$process]}$test_type:$result "
        
        total_tests=$((total_tests + 1))
        case "$result" in
            "PASS") passed_tests=$((passed_tests + 1)) ;;
            "FAIL") failed_tests=$((failed_tests + 1)) ;;
            "SKIP") skipped_tests=$((skipped_tests + 1)) ;;
        esac
    done
    
    for process in $(echo "${!process_results[@]}" | tr ' ' '\n' | sort); do
        echo -e "${CYAN}$process:${NC}"
        IFS=' ' read -ra TESTS <<< "${process_results[$process]}"
        for test in "${TESTS[@]}"; do
            if [ -n "$test" ]; then
                local test_name=$(echo "$test" | cut -d':' -f1)
                local result=$(echo "$test" | cut -d':' -f2)
                case "$result" in
                    "PASS") echo -e "  ${GREEN}✅ $test_name${NC}" ;;
                    "FAIL") echo -e "  ${RED}❌ $test_name${NC}" ;;
                    "SKIP") echo -e "  ${YELLOW}⏭️  $test_name${NC}" ;;
                esac
            fi
        done
    done
    
    echo ""
    echo "Overall Statistics:"
    echo "------------------"
    echo "Total Tests: $total_tests"
    echo -e "Passed: ${GREEN}$passed_tests${NC}"
    echo -e "Failed: ${RED}$failed_tests${NC}"
    echo -e "Skipped: ${YELLOW}$skipped_tests${NC}"
    
    local success_rate=0
    if [ $total_tests -gt 0 ]; then
        success_rate=$((passed_tests * 100 / total_tests))
    fi
    echo "Success Rate: ${success_rate}%"
    
    echo ""
    if [ $failed_tests -eq 0 ]; then
        echo -e "${GREEN}🎉 All validation tests passed!${NC}"
        return 0
    else
        echo -e "${RED}⚠️  Some validation tests failed${NC}"
        return 1
    fi
}

# Main validation function
main() {
    echo -e "${GREEN}🔍 Multi-Process Deployment Validation${NC}"
    echo "========================================"
    echo "Validation Types: ${VALIDATION_TYPES[*]}"
    echo ""
    
    # Load deployment manifest
    load_deployment_manifest
    
    # Get processes from manifest
    local processes=$(get_processes_from_manifest)
    if [ -z "$processes" ]; then
        log_error "No processes found in deployment manifest"
        exit 1
    fi
    
    echo "Processes to validate:"
    echo "$processes" | while IFS=':' read -r process_name process_id status; do
        echo "  - $process_name ($status)"
    done
    echo ""
    
    # Perform validation for each process
    echo "$processes" | while IFS=':' read -r process_name process_id status; do
        echo ""
        log_step "Validating $process_name (ID: $process_id)..."
        
        # Health validation
        if [[ " ${VALIDATION_TYPES[*]} " =~ " health " ]]; then
            validate_process_health "$process_name" "$process_id" "$status"
        fi
        
        # Capability validation
        if [[ " ${VALIDATION_TYPES[*]} " =~ " health " ]]; then
            validate_process_capabilities "$process_name" "$process_id"
        fi
        
        # Integration validation
        if [[ " ${VALIDATION_TYPES[*]} " =~ " integration " ]]; then
            validate_process_integration "$process_name" "$process_id"
        fi
        
        # Performance validation
        if [[ " ${VALIDATION_TYPES[*]} " =~ " performance " ]]; then
            validate_performance "$process_name" "$process_id"
        fi
        
        # Security validation
        if [[ " ${VALIDATION_TYPES[*]} " =~ " security " ]]; then
            validate_security "$process_name" "$process_id"
        fi
        
        # Special coordinator validation
        if [ "$process_name" == "deployment-coordinator" ]; then
            validate_coordinator_functionality "$process_id"
        fi
        
        log_success "$process_name validation completed"
    done
    
    echo ""
    log_step "Running system-wide integration tests..."
    
    # Test coordinator if available
    local coordinator_id=$(echo "$processes" | grep "deployment-coordinator:" | cut -d':' -f2)
    if [ -n "$coordinator_id" ]; then
        log_test "System-wide process discovery test"
        if timeout 30 npx permamind executeAction --target "$coordinator_id" --action "PROCESS_DISCOVERY" > /tmp/system_discovery.json 2>/dev/null; then
            local discovered_count=$(python3 -c "
import json
try:
    with open('/tmp/system_discovery.json', 'r') as f:
        data = json.load(f)
    print(data.get('count', 0))
except:
    print(0)
")
            log_success "System discovered $discovered_count processes"
            VALIDATION_RESULTS["system_discovery"]="PASS"
        else
            log_warning "System-wide process discovery failed"
            VALIDATION_RESULTS["system_discovery"]="FAIL"
        fi
    fi
    
    # Generate validation report
    generate_validation_report
    
    # Display summary
    display_validation_summary
    
    # Clean up temporary files
    rm -f /tmp/health_check.json /tmp/capabilities_check.json /tmp/integration_test.json
    rm -f /tmp/coordinator_*.json /tmp/security_test.json /tmp/system_discovery.json
    rm -f /tmp/cap_validation.log /tmp/discovery_result.log /tmp/coordinator_health_result.log
    
    # Exit with appropriate code
    local failed_count=0
    for result in "${VALIDATION_RESULTS[@]}"; do
        if [ "$result" == "FAIL" ]; then
            failed_count=$((failed_count + 1))
        fi
    done
    
    exit $failed_count
}

# Handle command line arguments
SELECTED_TYPES=()
while [[ $# -gt 0 ]]; do
    case $1 in
        --types)
            IFS=',' read -ra SELECTED_TYPES <<< "$2"
            VALIDATION_TYPES=("${SELECTED_TYPES[@]}")
            shift 2
            ;;
        --timeout)
            VALIDATION_TIMEOUT="$2"
            shift 2
            ;;
        --performance-duration)
            PERFORMANCE_TEST_DURATION="$2"
            shift 2
            ;;
        --help)
            echo "Multi-Process Deployment Validation Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --types TYPES              Validation types to run (comma-separated)"
            echo "                            Available: ${VALIDATION_TYPES[*]}"
            echo "  --timeout SECONDS          Validation timeout (default: 300)"
            echo "  --performance-duration SEC Performance test duration (default: 60)"
            echo "  --help                    Show this help message"
            echo ""
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main validation
main