#!/bin/bash
# Multi-Process Deployment Orchestration Script
# Deploys and coordinates multiple AO processes with dependency management

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
COORDINATOR_DIR="ao-processes/coordinator"
DEPLOYMENT_TIMEOUT=600  # 10 minutes
HEALTH_CHECK_TIMEOUT=120  # 2 minutes
MAX_RETRY_ATTEMPTS=3
DEPENDENCY_WAIT_TIME=30  # 30 seconds between dependency checks

# Process deployment order (dependency-aware)
PROCESS_ORDER=(
    "coordinator"
    "deployment-coordinator"
    "battle"
    "pokemon"
    "shop"
    "security"
    "admin"
)

# Process dependencies mapping
declare -A PROCESS_DEPENDENCIES
PROCESS_DEPENDENCIES[coordinator]=""
PROCESS_DEPENDENCIES[deployment-coordinator]=""
PROCESS_DEPENDENCIES[battle]="coordinator"
PROCESS_DEPENDENCIES[pokemon]="coordinator"
PROCESS_DEPENDENCIES[shop]="coordinator"
PROCESS_DEPENDENCIES[security]="coordinator"
PROCESS_DEPENDENCIES[admin]=""

# Process health check endpoints
declare -A HEALTH_ENDPOINTS
HEALTH_ENDPOINTS[coordinator]="COORDINATOR_HEALTH"
HEALTH_ENDPOINTS[deployment-coordinator]="SYSTEM_HEALTH"
HEALTH_ENDPOINTS[battle]="BATTLE_HEALTH"
HEALTH_ENDPOINTS[pokemon]="POKEMON_HEALTH"
HEALTH_ENDPOINTS[shop]="SHOP_HEALTH"
HEALTH_ENDPOINTS[security]="SECURITY_HEALTH"
HEALTH_ENDPOINTS[admin]="ADMIN_HEALTH"

# Deployment state tracking
declare -A PROCESS_STATUS
declare -A PROCESS_IDS
declare -A DEPLOYMENT_TIMES
DEPLOYMENT_START_TIME=$(date +%s)

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
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to check if required tools are available
check_dependencies() {
    log_step "Checking deployment dependencies..."
    
    if ! command -v npx &> /dev/null; then
        log_error "npx is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command -v harlequin &> /dev/null; then
        log_error "harlequin is not installed. Please install the harlequin toolkit."
        exit 1
    fi
    
    if [ ! -d "$BUILD_DIR" ]; then
        log_info "Creating build directory..."
        mkdir -p "$BUILD_DIR"
    fi
    
    log_success "All dependencies are available"
}

# Function to validate process configuration
validate_process_config() {
    local process_name=$1
    local config_file="ao-processes/${process_name}/main.lua"
    
    if [ ! -f "$config_file" ]; then
        log_error "Process configuration not found: $config_file"
        return 1
    fi
    
    # Basic Lua syntax check
    if ! lua -e "dofile('$config_file')" &> /dev/null; then
        log_warning "Potential syntax issues in $config_file"
    fi
    
    return 0
}

# Function to wait for process dependencies
wait_for_dependencies() {
    local process_name=$1
    local dependencies="${PROCESS_DEPENDENCIES[$process_name]}"
    
    if [ -z "$dependencies" ]; then
        log_info "No dependencies for $process_name"
        return 0
    fi
    
    log_step "Waiting for dependencies of $process_name: $dependencies"
    
    IFS=' ' read -ra DEPS <<< "$dependencies"
    for dep in "${DEPS[@]}"; do
        local max_wait=300  # 5 minutes max wait per dependency
        local wait_time=0
        
        while [ $wait_time -lt $max_wait ]; do
            if [ "${PROCESS_STATUS[$dep]}" == "HEALTHY" ]; then
                log_success "Dependency $dep is healthy"
                break
            fi
            
            log_info "Waiting for dependency $dep to be healthy... (${wait_time}s)"
            sleep $DEPENDENCY_WAIT_TIME
            wait_time=$((wait_time + DEPENDENCY_WAIT_TIME))
            
            # Re-check dependency health
            check_process_health "$dep"
        done
        
        if [ $wait_time -ge $max_wait ]; then
            log_error "Dependency $dep failed to become healthy within timeout"
            return 1
        fi
    done
    
    return 0
}

# Function to bundle process files
bundle_process() {
    local process_name=$1
    local process_dir="ao-processes/${process_name}"
    local output_file="$BUILD_DIR/${process_name}-process.lua"
    
    log_step "Bundling $process_name process..."
    
    if [ ! -d "$process_dir" ]; then
        log_error "Process directory not found: $process_dir"
        return 1
    fi
    
    # Special handling for deployment coordinator
    if [ "$process_name" == "deployment-coordinator" ]; then
        process_dir="$COORDINATOR_DIR"
    fi
    
    # Use harlequin to bundle the process
    if harlequin lua-utils bundle --entrypoint "$process_dir/main.lua" > "$output_file" 2>/dev/null; then
        log_success "$process_name process bundled successfully"
        return 0
    else
        log_error "Failed to bundle $process_name process"
        return 1
    fi
}

# Function to deploy a single process
deploy_process() {
    local process_name=$1
    local bundle_file="$BUILD_DIR/${process_name}-process.lua"
    local retry_count=0
    
    log_step "Deploying $process_name process..."
    
    # Validate bundle exists
    if [ ! -f "$bundle_file" ]; then
        log_error "Bundle file not found: $bundle_file"
        return 1
    fi
    
    # Deploy with retry logic
    while [ $retry_count -lt $MAX_RETRY_ATTEMPTS ]; do
        local deploy_start=$(date +%s)
        
        # Use permamind to spawn the process
        if npx permamind spawnProcess --file "$bundle_file" --name "${process_name}-process" --module "mzFmF0rEoA5JyOX6G7Fwc97L6dQfwMUFuQmZNQFg6yc" > /tmp/deploy_output.txt 2>&1; then
            local deploy_end=$(date +%s)
            local deploy_duration=$((deploy_end - deploy_start))
            
            # Extract process ID from output
            local process_id=$(grep -o "Process ID: [A-Za-z0-9_-]*" /tmp/deploy_output.txt | cut -d' ' -f3 | head -1)
            
            if [ -n "$process_id" ]; then
                PROCESS_IDS[$process_name]=$process_id
                DEPLOYMENT_TIMES[$process_name]=$deploy_duration
                PROCESS_STATUS[$process_name]="DEPLOYED"
                
                log_success "$process_name deployed successfully (Process ID: $process_id, Duration: ${deploy_duration}s)"
                return 0
            else
                log_warning "Process deployed but ID not found in output"
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
    PROCESS_STATUS[$process_name]="FAILED"
    return 1
}

# Function to check process health
check_process_health() {
    local process_name=$1
    local process_id="${PROCESS_IDS[$process_name]}"
    local health_endpoint="${HEALTH_ENDPOINTS[$process_name]}"
    
    if [ -z "$process_id" ]; then
        PROCESS_STATUS[$process_name]="UNKNOWN"
        return 1
    fi
    
    log_info "Checking health of $process_name (ID: $process_id)..."
    
    # Send health check message using permamind
    if timeout $HEALTH_CHECK_TIMEOUT npx permamind executeAction --target "$process_id" --action "$health_endpoint" > /tmp/health_output.txt 2>&1; then
        # Parse health response
        if grep -q "success.*true" /tmp/health_output.txt || grep -q "HEALTHY" /tmp/health_output.txt; then
            PROCESS_STATUS[$process_name]="HEALTHY"
            log_success "$process_name is healthy"
            return 0
        fi
    fi
    
    PROCESS_STATUS[$process_name]="UNHEALTHY"
    log_warning "$process_name health check failed"
    return 1
}

# Function to perform post-deployment validation
validate_deployment() {
    local process_name=$1
    
    log_step "Validating $process_name deployment..."
    
    # Check if process is responsive
    if ! check_process_health "$process_name"; then
        log_error "$process_name validation failed - not healthy"
        return 1
    fi
    
    # Additional validation checks could go here
    # For example, checking specific functionality
    
    log_success "$process_name validation passed"
    return 0
}

# Function to register process with deployment coordinator
register_with_coordinator() {
    local process_name=$1
    local process_id="${PROCESS_IDS[$process_name]}"
    local coordinator_id="${PROCESS_IDS[deployment-coordinator]}"
    
    if [ -z "$coordinator_id" ] || [ "$process_name" == "deployment-coordinator" ]; then
        return 0  # Skip if no coordinator or registering coordinator itself
    fi
    
    log_step "Registering $process_name with deployment coordinator..."
    
    # Create registration message
    local registration_data=$(cat <<EOF
{
    "processRegistration": {
        "processId": "$process_id",
        "processType": "${process_name^^}",
        "version": "1.0.0",
        "capabilities": ["PROCESS_OPERATIONS"],
        "healthCheckEndpoint": "${HEALTH_ENDPOINTS[$process_name]}"
    }
}
EOF
)
    
    # Send registration using permamind
    if echo "$registration_data" | npx permamind executeAction --target "$coordinator_id" --action "PROCESS_REGISTRATION" --data - > /tmp/register_output.txt 2>&1; then
        if grep -q "success.*true" /tmp/register_output.txt; then
            log_success "$process_name registered with deployment coordinator"
            return 0
        fi
    fi
    
    log_warning "Failed to register $process_name with deployment coordinator"
    return 1
}

# Function to display deployment summary
display_deployment_summary() {
    local deployment_end_time=$(date +%s)
    local total_deployment_time=$((deployment_end_time - DEPLOYMENT_START_TIME))
    
    echo ""
    echo "=========================================="
    echo -e "${GREEN}📊 MULTI-PROCESS DEPLOYMENT SUMMARY${NC}"
    echo "=========================================="
    echo "Total Deployment Time: ${total_deployment_time}s"
    echo ""
    
    local successful_deployments=0
    local failed_deployments=0
    
    for process in "${PROCESS_ORDER[@]}"; do
        local status="${PROCESS_STATUS[$process]}"
        local process_id="${PROCESS_IDS[$process]}"
        local duration="${DEPLOYMENT_TIMES[$process]:-N/A}"
        
        case "$status" in
            "HEALTHY")
                echo -e "${GREEN}✅ $process${NC} - ID: ${process_id:-N/A} - Duration: ${duration}s"
                successful_deployments=$((successful_deployments + 1))
                ;;
            "DEPLOYED"|"UNHEALTHY")
                echo -e "${YELLOW}⚠️  $process${NC} - ID: ${process_id:-N/A} - Duration: ${duration}s - Status: $status"
                ;;
            "FAILED"|*)
                echo -e "${RED}❌ $process${NC} - Status: $status"
                failed_deployments=$((failed_deployments + 1))
                ;;
        esac
    done
    
    echo ""
    echo "Success Rate: $successful_deployments/${#PROCESS_ORDER[@]} processes"
    
    if [ $failed_deployments -eq 0 ] && [ $successful_deployments -eq ${#PROCESS_ORDER[@]} ]; then
        echo -e "${GREEN}🎉 All processes deployed successfully!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Deployment completed with issues${NC}"
        return 1
    fi
}

# Function to save deployment manifest
save_deployment_manifest() {
    local manifest_file="$BUILD_DIR/deployment-manifest.json"
    
    log_step "Saving deployment manifest..."
    
    cat > "$manifest_file" <<EOF
{
    "deploymentTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "deploymentDuration": $(($(date +%s) - DEPLOYMENT_START_TIME)),
    "processes": {
EOF
    
    local first=true
    for process in "${PROCESS_ORDER[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$manifest_file"
        fi
        
        cat >> "$manifest_file" <<EOF
        "$process": {
            "processId": "${PROCESS_IDS[$process]:-null}",
            "status": "${PROCESS_STATUS[$process]:-UNKNOWN}",
            "deploymentTime": ${DEPLOYMENT_TIMES[$process]:-0},
            "dependencies": "${PROCESS_DEPENDENCIES[$process]:-}"
        }
EOF
    done
    
    cat >> "$manifest_file" <<EOF
    }
}
EOF
    
    log_success "Deployment manifest saved: $manifest_file"
}

# Main deployment function
main() {
    echo -e "${GREEN}🚀 Multi-Process PokéRogue AO Deployment${NC}"
    echo "=============================================="
    echo "Deployment Strategy: Dependency-Aware Sequential"
    echo "Processes to Deploy: ${PROCESS_ORDER[*]}"
    echo ""
    
    # Initialize process status
    for process in "${PROCESS_ORDER[@]}"; do
        PROCESS_STATUS[$process]="PENDING"
    done
    
    # Check dependencies and setup
    check_dependencies
    
    # Deploy each process in dependency order
    for process in "${PROCESS_ORDER[@]}"; do
        echo ""
        log_step "Processing $process..."
        
        # Skip if deployment mode specified and process not included
        if [ -n "$DEPLOY_ONLY" ] && [[ ! " $DEPLOY_ONLY " =~ " $process " ]]; then
            log_info "Skipping $process (not in deployment scope)"
            PROCESS_STATUS[$process]="SKIPPED"
            continue
        fi
        
        # Validate process configuration
        if ! validate_process_config "$process"; then
            log_error "Process validation failed for $process"
            PROCESS_STATUS[$process]="FAILED"
            continue
        fi
        
        # Wait for dependencies
        if ! wait_for_dependencies "$process"; then
            log_error "Dependency wait failed for $process"
            PROCESS_STATUS[$process]="FAILED"
            continue
        fi
        
        # Bundle process
        if ! bundle_process "$process"; then
            PROCESS_STATUS[$process]="FAILED"
            continue
        fi
        
        # Deploy process
        if ! deploy_process "$process"; then
            PROCESS_STATUS[$process]="FAILED"
            continue
        fi
        
        # Validate deployment
        if ! validate_deployment "$process"; then
            PROCESS_STATUS[$process]="UNHEALTHY"
        fi
        
        # Register with coordinator (if not the coordinator itself)
        register_with_coordinator "$process"
        
        log_success "$process deployment phase completed"
    done
    
    echo ""
    log_step "Performing final system validation..."
    
    # Final health check for all processes
    for process in "${PROCESS_ORDER[@]}"; do
        if [ "${PROCESS_STATUS[$process]}" == "DEPLOYED" ]; then
            check_process_health "$process"
        fi
    done
    
    # Save deployment manifest
    save_deployment_manifest
    
    # Display summary
    display_deployment_summary
    
    # Clean up temporary files
    rm -f /tmp/deploy_output.txt /tmp/health_output.txt /tmp/register_output.txt
    
    # Exit with appropriate code
    local failed_count=0
    for process in "${PROCESS_ORDER[@]}"; do
        if [ "${PROCESS_STATUS[$process]}" == "FAILED" ]; then
            failed_count=$((failed_count + 1))
        fi
    done
    
    exit $failed_count
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --only)
            DEPLOY_ONLY="$2"
            shift 2
            ;;
        --timeout)
            DEPLOYMENT_TIMEOUT="$2"
            shift 2
            ;;
        --help)
            echo "Multi-Process Deployment Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --only PROCESSES    Deploy only specified processes (space-separated)"
            echo "  --timeout SECONDS   Deployment timeout (default: 600)"
            echo "  --help             Show this help message"
            echo ""
            echo "Available processes: ${PROCESS_ORDER[*]}"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main deployment
main