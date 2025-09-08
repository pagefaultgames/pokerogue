#!/usr/bin/env bash
# Simple deployment script for bundled AO processes from build folder
# Compatible with older bash versions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
DEPLOYMENT_MANIFEST="$BUILD_DIR/multi-process-manifest.json"
DEPLOYMENT_LOG="$BUILD_DIR/deployment.log"
MAX_RETRY_ATTEMPTS=3
HEALTH_CHECK_TIMEOUT=30

# Process deployment order
PROCESS_ORDER=(
    "coordinator"
    "admin"
    "security"
    "battle"
    "pokemon"
    "economy"
)

DEPLOYMENT_START_TIME=$(date +%s)

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Check dependencies
check_dependencies() {
    log_step "Checking deployment dependencies..."
    
    if ! command -v aos &> /dev/null; then
        log_error "aos is not installed. Please install the AOS CLI."
        log_info "Install with: npm install -g @permaweb/aos"
        exit 1
    fi
    
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build directory not found: $BUILD_DIR"
        log_info "Please run 'npm run ao:build' first to build processes"
        exit 1
    fi
    
    echo "Deployment started at $(date)" > "$DEPLOYMENT_LOG"
    log_success "All dependencies are available"
}

# Validate build files
validate_build_files() {
    log_step "Validating build files..."
    
    local missing_files=0
    
    for process in "${PROCESS_ORDER[@]}"; do
        local bundle_file="$BUILD_DIR/${process}-process.lua"
        
        if [ ! -f "$bundle_file" ]; then
            log_error "Bundle file not found: $bundle_file"
            missing_files=$((missing_files + 1))
        else
            local file_size=$(stat -f%z "$bundle_file" 2>/dev/null || stat -c%s "$bundle_file" 2>/dev/null || echo "0")
            if [ "$file_size" -eq 0 ]; then
                log_error "Bundle file is empty: $bundle_file"
                missing_files=$((missing_files + 1))
            else
                log_info "$process bundle found (${file_size} bytes)"
            fi
        fi
    done
    
    if [ $missing_files -gt 0 ]; then
        log_error "$missing_files process bundles are missing or invalid"
        exit 1
    fi
    
    log_success "All build files validated"
}

# Deploy a single process
deploy_process() {
    local process_name=$1
    local bundle_file="$BUILD_DIR/${process_name}-process.lua"
    local retry_count=0
    
    log_step "Deploying $process_name process..."
    
    while [ $retry_count -lt $MAX_RETRY_ATTEMPTS ]; do
        local deploy_start=$(date +%s)
        
        log_info "Spawning $process_name process (attempt $((retry_count + 1))/$MAX_RETRY_ATTEMPTS)"
        
        if aos "${process_name}-process" --load "$bundle_file" --module-id "mzFmF0rEoA5JyOX6G7Fwc97L6dQfwMUFuQmZNQFg6yc" > "/tmp/deploy_${process_name}.log" 2>&1 <<< "Info"; then
            local deploy_end=$(date +%s)
            local deploy_duration=$((deploy_end - deploy_start))
            
            # Try to extract process ID from AOS output
            local process_id=$(grep -o "Process [A-Za-z0-9_-]*" "/tmp/deploy_${process_name}.log" | head -1 | cut -d' ' -f2)
            
            if [ -z "$process_id" ]; then
                # Try to find process ID in aos output format (43 char AO process IDs)
                process_id=$(grep -oE "[A-Za-z0-9_-]{43}" "/tmp/deploy_${process_name}.log" | head -1)
            fi
            
            if [ -z "$process_id" ]; then
                # Look for any long alphanumeric string that could be a process ID
                process_id=$(grep -oE "[A-Za-z0-9_-]{20,}" "/tmp/deploy_${process_name}.log" | head -1)
            fi
            
            if [ -n "$process_id" ]; then
                log_success "$process_name deployed successfully"
                log_info "Process ID: $process_id"
                log_info "Duration: ${deploy_duration}s"
                
                # Save deployment info
                echo "${process_name}:${process_id}:${deploy_duration}" >> "/tmp/deployment_results.txt"
                
                return 0
            else
                log_warning "Process may have deployed but ID extraction failed"
            fi
        else
            retry_count=$((retry_count + 1))
            log_warning "$process_name deployment failed (attempt $retry_count/$MAX_RETRY_ATTEMPTS)"
            
            if [ $retry_count -lt $MAX_RETRY_ATTEMPTS ]; then
                log_info "Retrying in 10 seconds..."
                sleep 10
            fi
        fi
    done
    
    log_error "Failed to deploy $process_name after $MAX_RETRY_ATTEMPTS attempts"
    echo "${process_name}:FAILED:0" >> "/tmp/deployment_results.txt"
    return 1
}

# Check process health
check_process_health() {
    local process_name=$1
    local process_id=$2
    
    if [ -z "$process_id" ] || [ "$process_id" = "FAILED" ]; then
        return 1
    fi
    
    log_info "Checking health of $process_name (ID: $process_id)..."
    
    if timeout $HEALTH_CHECK_TIMEOUT aos "$process_id" > "/tmp/health_${process_name}.log" 2>&1 <<< "Info"; then
        if grep -q "success\|Info\|OK" "/tmp/health_${process_name}.log"; then
            log_success "$process_name is healthy"
            return 0
        fi
    fi
    
    log_warning "$process_name health check unclear"
    return 1
}

# Display deployment summary
display_deployment_summary() {
    local deployment_end_time=$(date +%s)
    local total_deployment_time=$((deployment_end_time - DEPLOYMENT_START_TIME))
    
    echo ""
    echo "=========================================="
    echo -e "${GREEN}📊 POKÉROGUE AO DEPLOYMENT SUMMARY${NC}"
    echo "=========================================="
    echo "Total Deployment Time: ${total_deployment_time}s"
    echo ""
    
    local successful_deployments=0
    local failed_deployments=0
    
    if [ -f "/tmp/deployment_results.txt" ]; then
        while IFS=: read -r process_name process_id duration; do
            if [ "$process_id" = "FAILED" ]; then
                echo -e "${RED}❌ $process_name${NC} - FAILED"
                failed_deployments=$((failed_deployments + 1))
            else
                echo -e "${GREEN}✅ $process_name${NC} - ID: $process_id - Duration: ${duration}s"
                successful_deployments=$((successful_deployments + 1))
            fi
        done < "/tmp/deployment_results.txt"
    fi
    
    echo ""
    echo "Success Rate: $successful_deployments/${#PROCESS_ORDER[@]} processes"
    
    if [ $failed_deployments -eq 0 ]; then
        echo -e "${GREEN}🎉 All processes deployed successfully!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Deployment completed with $failed_deployments failures${NC}"
        return 1
    fi
}

# Save deployment results
save_deployment_results() {
    local results_file="$BUILD_DIR/deployment-results.json"
    
    log_step "Saving deployment results..."
    
    echo "{" > "$results_file"
    echo "  \"deploymentTimestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$results_file"
    echo "  \"deploymentDuration\": $(($(date +%s) - DEPLOYMENT_START_TIME))," >> "$results_file"
    echo "  \"processes\": {" >> "$results_file"
    
    if [ -f "/tmp/deployment_results.txt" ]; then
        local first=true
        while IFS=: read -r process_name process_id duration; do
            if [ "$first" = true ]; then
                first=false
            else
                echo "," >> "$results_file"
            fi
            
            echo "    \"$process_name\": {" >> "$results_file"
            if [ "$process_id" = "FAILED" ]; then
                echo "      \"processId\": null," >> "$results_file"
                echo "      \"status\": \"FAILED\"," >> "$results_file"
            else
                echo "      \"processId\": \"$process_id\"," >> "$results_file"
                echo "      \"status\": \"DEPLOYED\"," >> "$results_file"
            fi
            echo "      \"deploymentTime\": $duration" >> "$results_file"
            echo -n "    }" >> "$results_file"
        done < "/tmp/deployment_results.txt"
    fi
    
    echo "" >> "$results_file"
    echo "  }" >> "$results_file"
    echo "}" >> "$results_file"
    
    log_success "Deployment results saved: $results_file"
}

# Main function
main() {
    echo -e "${GREEN}🚀 PokéRogue AO Process Deployment${NC}"
    echo "=============================================="
    echo "Source: Build folder bundled processes"
    echo "Processes: ${PROCESS_ORDER[*]}"
    echo ""
    
    # Clean up any previous deployment files
    rm -f /tmp/deployment_results.txt /tmp/deploy_*.log /tmp/health_*.log
    
    # Check and validate
    check_dependencies
    validate_build_files
    
    # Deploy each process
    for process in "${PROCESS_ORDER[@]}"; do
        echo ""
        deploy_process "$process"
        sleep 2  # Brief pause between deployments
    done
    
    echo ""
    log_step "Running health checks..."
    
    # Health checks
    if [ -f "/tmp/deployment_results.txt" ]; then
        sleep 5  # Allow processes to initialize
        while IFS=: read -r process_name process_id duration; do
            if [ "$process_id" != "FAILED" ]; then
                check_process_health "$process_name" "$process_id"
            fi
        done < "/tmp/deployment_results.txt"
    fi
    
    # Save and display results
    save_deployment_results
    display_deployment_summary
    
    # Clean up
    rm -f /tmp/deploy_*.log /tmp/health_*.log /tmp/deployment_results.txt
    
    # Count failures for exit code
    local failed_count=0
    if [ -f "$BUILD_DIR/deployment-results.json" ]; then
        failed_count=$(grep -c '"status": "FAILED"' "$BUILD_DIR/deployment-results.json" || echo "0")
    fi
    
    exit $failed_count
}

# Handle help
case "${1:-}" in
    --help|-h)
        echo "PokéRogue AO Process Deployment Script"
        echo ""
        echo "Usage: $0"
        echo ""
        echo "This script deploys all bundled AO processes from the build folder."
        echo "Make sure to run 'npm run ao:build' before deployment."
        echo ""
        echo "Available processes: ${PROCESS_ORDER[*]}"
        exit 0
        ;;
esac

# Run main function
main "$@"