#!/usr/bin/env bash
# Deploy a single AO process from the build folder

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
MAX_RETRY_ATTEMPTS=3
HEALTH_CHECK_TIMEOUT=30

# Available processes
AVAILABLE_PROCESSES=("coordinator" "admin" "security" "battle" "pokemon" "economy")

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

# Usage function
show_usage() {
    echo "Deploy Single AO Process"
    echo ""
    echo "Usage: $0 <process_name> [options]"
    echo ""
    echo "Available processes:"
    for process in "${AVAILABLE_PROCESSES[@]}"; do
        echo "  - $process"
    done
    echo ""
    echo "Options:"
    echo "  --no-health-check    Skip health check after deployment"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 coordinator"
    echo "  $0 battle --no-health-check"
}

# Validate process name
validate_process() {
    local process_name=$1
    
    if [[ ! " ${AVAILABLE_PROCESSES[@]} " =~ " ${process_name} " ]]; then
        log_error "Invalid process name: $process_name"
        echo ""
        echo "Available processes: ${AVAILABLE_PROCESSES[*]}"
        exit 1
    fi
    
    local bundle_file="$BUILD_DIR/${process_name}-process.lua"
    if [ ! -f "$bundle_file" ]; then
        log_error "Bundle file not found: $bundle_file"
        log_info "Please run 'npm run ao:build:$process_name' or 'npm run ao:build' first"
        exit 1
    fi
    
    local file_size=$(stat -f%z "$bundle_file" 2>/dev/null || stat -c%s "$bundle_file" 2>/dev/null || echo "0")
    if [ "$file_size" -eq 0 ]; then
        log_error "Bundle file is empty: $bundle_file"
        exit 1
    fi
    
    log_success "Process $process_name validated (bundle size: ${file_size} bytes)"
}

# Deploy process
deploy_process() {
    local process_name=$1
    local bundle_file="$BUILD_DIR/${process_name}-process.lua"
    local retry_count=0
    
    log_info "Deploying $process_name process..."
    
    # Check if aos is available
    if ! command -v aos &> /dev/null; then
        log_error "aos is not installed. Please install the AOS CLI."
        log_info "Install with: npm install -g @permaweb/aos"
        exit 1
    fi
    
    # Deploy with retry logic
    while [ $retry_count -lt $MAX_RETRY_ATTEMPTS ]; do
        local deploy_start=$(date +%s)
        
        log_info "Spawning $process_name process (attempt $((retry_count + 1))/$MAX_RETRY_ATTEMPTS)"
        
        # Use expect to handle AOS interactive prompts, or use a non-interactive approach
        if echo -e "\n" | aos "${process_name}-process" --load "$bundle_file" --module-id "mzFmF0rEoA5JyOX6G7Fwc97L6dQfwMUFuQmZNQFg6yc" > /tmp/deploy_${process_name}.log 2>&1; then
            local deploy_end=$(date +%s)
            local deploy_duration=$((deploy_end - deploy_start))
            
            # Extract process ID from output (AOS creates processes with specific patterns)
            local process_id=$(grep -o "Process [A-Za-z0-9_-]*" /tmp/deploy_${process_name}.log | head -1 | cut -d' ' -f2)
            
            if [ -z "$process_id" ]; then
                # Try to find process ID in aos output format
                process_id=$(grep -oE "[A-Za-z0-9_-]{43}" /tmp/deploy_${process_name}.log | head -1)
            fi
            
            if [ -z "$process_id" ]; then
                # Look for any long alphanumeric string that could be a process ID
                process_id=$(grep -oE "[A-Za-z0-9_-]{20,}" /tmp/deploy_${process_name}.log | head -1)
            fi
            
            if [ -n "$process_id" ]; then
                log_success "$process_name deployed successfully!"
                echo ""
                echo "Process ID: $process_id"
                echo "Duration: ${deploy_duration}s"
                echo "Bundle: $bundle_file"
                echo ""
                
                # Save deployment info
                echo "Process: $process_name" > "/tmp/${process_name}_deployment.info"
                echo "Process ID: $process_id" >> "/tmp/${process_name}_deployment.info"
                echo "Deploy Time: $(date)" >> "/tmp/${process_name}_deployment.info"
                echo "Duration: ${deploy_duration}s" >> "/tmp/${process_name}_deployment.info"
                
                return 0
            else
                log_warning "Process may have deployed but ID extraction failed"
                echo "Deployment output:"
                cat /tmp/deploy_${process_name}.log
            fi
        else
            retry_count=$((retry_count + 1))
            log_warning "$process_name deployment failed (attempt $retry_count/$MAX_RETRY_ATTEMPTS)"
            
            if [ $retry_count -lt $MAX_RETRY_ATTEMPTS ]; then
                log_info "Retrying in 5 seconds..."
                sleep 5
            else
                log_error "Deployment output:"
                cat /tmp/deploy_${process_name}.log
            fi
        fi
    done
    
    log_error "Failed to deploy $process_name after $MAX_RETRY_ATTEMPTS attempts"
    return 1
}

# Check process health
check_process_health() {
    local process_name=$1
    local process_id=$2
    
    log_info "Checking health of $process_name (ID: $process_id)..."
    
    # Send Info message to check if process responds using aos
    if timeout $HEALTH_CHECK_TIMEOUT aos "$process_id" > /tmp/health_${process_name}.log 2>&1 <<< "Info"; then
        # Check for success indicators in the response
        if grep -q "success" /tmp/health_${process_name}.log || grep -q "Info" /tmp/health_${process_name}.log; then
            log_success "$process_name is responding to health checks"
            return 0
        else
            log_info "Health check response:"
            head -3 /tmp/health_${process_name}.log
        fi
    else
        log_warning "$process_name health check timed out"
    fi
    
    log_warning "$process_name health status unclear, but process appears to be deployed"
    return 1
}

# Main function
main() {
    local process_name=""
    local skip_health_check=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-health-check)
                skip_health_check=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            --*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [ -z "$process_name" ]; then
                    process_name=$1
                else
                    log_error "Too many arguments"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Check if process name was provided
    if [ -z "$process_name" ]; then
        log_error "Process name is required"
        show_usage
        exit 1
    fi
    
    echo -e "${GREEN}🚀 Deploying PokéRogue AO Process: $process_name${NC}"
    echo "=============================================="
    
    # Validate and deploy
    validate_process "$process_name"
    
    if deploy_process "$process_name"; then
        # Extract process ID for health check
        if [ "$skip_health_check" = false ]; then
            local process_id=$(grep "Process ID:" "/tmp/${process_name}_deployment.info" | cut -d' ' -f3)
            if [ -n "$process_id" ]; then
                echo ""
                sleep 3  # Give process time to initialize
                check_process_health "$process_name" "$process_id"
            fi
        fi
        
        echo ""
        log_success "Deployment of $process_name completed!"
        
        if [ -f "/tmp/${process_name}_deployment.info" ]; then
            echo ""
            echo "Deployment Summary:"
            cat "/tmp/${process_name}_deployment.info"
        fi
    else
        exit 1
    fi
    
    # Clean up
    rm -f /tmp/deploy_${process_name}.log /tmp/health_${process_name}.log
}

# Run main function
main "$@"