#!/bin/bash
# Deployment Rollback Script
# Rolls back multi-process deployments using deployment coordinator

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
MANIFEST_FILE="$BUILD_DIR/deployment-manifest.json"
ROLLBACK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_TIMEOUT=60  # 1 minute
MAX_ROLLBACK_RETRIES=3

# Rollback state tracking
declare -A PROCESS_IDS
declare -A ROLLBACK_STATUS
ROLLBACK_START_TIME=$(date +%s)

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
    echo -e "${CYAN}[ROLLBACK]${NC} $1"
}

# Function to load deployment manifest
load_deployment_manifest() {
    if [ ! -f "$MANIFEST_FILE" ]; then
        log_error "Deployment manifest not found: $MANIFEST_FILE"
        log_info "Cannot rollback without deployment information"
        exit 1
    fi
    
    log_step "Loading deployment manifest for rollback..."
    
    # Extract process IDs from manifest
    python3 -c "
import json
with open('$MANIFEST_FILE', 'r') as f:
    data = json.load(f)
    for process, info in data['processes'].items():
        if info['processId'] and info['status'] not in ['FAILED', 'SKIPPED']:
            print(f'{process}:{info[\"processId\"]}')
" > /tmp/rollback_processes.txt
    
    if [ ! -s /tmp/rollback_processes.txt ]; then
        log_error "No processes found for rollback"
        exit 1
    fi
    
    # Load process IDs
    while IFS=':' read -r process_name process_id; do
        PROCESS_IDS[$process_name]=$process_id
        ROLLBACK_STATUS[$process_name]="PENDING"
    done < /tmp/rollback_processes.txt
    
    log_success "Loaded ${#PROCESS_IDS[@]} processes for rollback"
}

# Function to initiate rollback through deployment coordinator
initiate_coordinator_rollback() {
    local deployment_id=$1
    local reason=$2
    
    local coordinator_id="${PROCESS_IDS[deployment-coordinator]}"
    if [ -z "$coordinator_id" ]; then
        log_warning "Deployment coordinator not found, proceeding with manual rollback"
        return 1
    fi
    
    log_step "Initiating coordinated rollback through deployment coordinator..."
    
    local rollback_request=$(cat <<EOF
{
    "rollbackRequest": {
        "deploymentId": "$deployment_id",
        "reason": "$reason",
        "rollbackEnabled": true,
        "adminUserId": "rollback-script"
    },
    "processAuth": {
        "sourceProcessId": "rollback-script",
        "authToken": "rollback-token",
        "timestamp": $(date +%s)
    }
}
EOF
)
    
    if timeout $ROLLBACK_TIMEOUT npx permamind executeAction \
        --target "$coordinator_id" \
        --action "DEPLOYMENT_ROLLBACK" \
        --data "$rollback_request" > /tmp/coordinator_rollback.json 2>&1; then
        
        # Parse rollback response
        if python3 -c "
import json, sys
try:
    with open('/tmp/coordinator_rollback.json', 'r') as f:
        data = json.load(f)
    
    if data.get('success', False):
        print('Coordinator rollback initiated successfully')
        sys.exit(0)
    else:
        print(f'Coordinator rollback failed: {data.get(\"error\", \"Unknown error\")}')
        sys.exit(1)
except Exception as e:
    print(f'Error parsing coordinator response: {e}')
    sys.exit(1)
" > /tmp/rollback_result.log 2>&1; then
            local result=$(cat /tmp/rollback_result.log)
            log_success "$result"
            return 0
        else
            local error=$(cat /tmp/rollback_result.log)
            log_error "$error"
        fi
    else
        log_error "Failed to communicate with deployment coordinator"
    fi
    
    return 1
}

# Function to perform manual rollback
perform_manual_rollback() {
    local rollback_order=(
        "security"
        "shop" 
        "pokemon"
        "battle"
        "coordinator"
        "admin"
        "deployment-coordinator"
    )
    
    log_step "Performing manual rollback process..."
    
    local successful_rollbacks=0
    local failed_rollbacks=0
    
    for process in "${rollback_order[@]}"; do
        if [ -z "${PROCESS_IDS[$process]}" ]; then
            log_info "Skipping $process (not deployed)"
            continue
        fi
        
        log_step "Rolling back $process..."
        
        if rollback_single_process "$process" "${PROCESS_IDS[$process]}"; then
            ROLLBACK_STATUS[$process]="SUCCESS"
            successful_rollbacks=$((successful_rollbacks + 1))
            log_success "$process rollback completed"
        else
            ROLLBACK_STATUS[$process]="FAILED"
            failed_rollbacks=$((failed_rollbacks + 1))
            log_error "$process rollback failed"
        fi
        
        # Wait between rollbacks to avoid overwhelming the system
        sleep 5
    done
    
    log_info "Manual rollback completed: $successful_rollbacks successful, $failed_rollbacks failed"
    
    if [ $failed_rollbacks -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Function to rollback a single process
rollback_single_process() {
    local process_name=$1
    local process_id=$2
    local retry_count=0
    
    while [ $retry_count -lt $MAX_ROLLBACK_RETRIES ]; do
        log_info "Attempting to stop $process_name (attempt $((retry_count + 1))/$MAX_ROLLBACK_RETRIES)..."
        
        # Send shutdown message to process
        local shutdown_request=$(cat <<EOF
{
    "shutdown": {
        "reason": "Deployment rollback",
        "graceful": true,
        "timeout": $HEALTH_CHECK_TIMEOUT
    }
}
EOF
)
        
        if timeout $HEALTH_CHECK_TIMEOUT npx permamind executeAction \
            --target "$process_id" \
            --action "GRACEFUL_SHUTDOWN" \
            --data "$shutdown_request" > /tmp/shutdown_${process_name}.json 2>&1; then
            
            # Verify process stopped
            sleep 10  # Allow time for shutdown
            
            if ! timeout 10 npx permamind executeAction \
                --target "$process_id" \
                --action "Info" > /dev/null 2>&1; then
                log_success "$process_name stopped successfully"
                return 0
            else
                log_warning "$process_name still responsive after shutdown request"
            fi
        else
            log_warning "$process_name shutdown request failed"
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_ROLLBACK_RETRIES ]; then
            log_info "Retrying $process_name rollback in 15 seconds..."
            sleep 15
        fi
    done
    
    # Force stop if graceful shutdown failed
    log_warning "Attempting force stop of $process_name..."
    
    # In a real implementation, this would use more forceful methods
    # For now, we'll just report it as failed
    log_error "Unable to stop $process_name after $MAX_ROLLBACK_RETRIES attempts"
    return 1
}

# Function to validate rollback completion
validate_rollback() {
    log_step "Validating rollback completion..."
    
    local validation_passed=true
    local active_processes=0
    
    for process_name in "${!PROCESS_IDS[@]}"; do
        local process_id="${PROCESS_IDS[$process_name]}"
        
        log_info "Checking if $process_name is stopped..."
        
        if timeout 10 npx permamind executeAction \
            --target "$process_id" \
            --action "Info" > /dev/null 2>&1; then
            log_warning "$process_name is still active"
            active_processes=$((active_processes + 1))
            validation_passed=false
        else
            log_success "$process_name is stopped"
        fi
    done
    
    if [ $validation_passed = true ]; then
        log_success "All processes successfully stopped"
        return 0
    else
        log_warning "$active_processes processes are still active"
        return 1
    fi
}

# Function to cleanup rollback artifacts
cleanup_rollback_artifacts() {
    log_step "Cleaning up rollback artifacts..."
    
    # Remove deployment manifest
    if [ -f "$MANIFEST_FILE" ]; then
        mv "$MANIFEST_FILE" "${MANIFEST_FILE}.rolled-back-$(date +%s)"
        log_info "Deployment manifest archived"
    fi
    
    # Clean up temporary files
    rm -f /tmp/rollback_processes.txt
    rm -f /tmp/coordinator_rollback.json
    rm -f /tmp/rollback_result.log
    rm -f /tmp/shutdown_*.json
    
    # Create rollback completion marker
    local rollback_marker="$BUILD_DIR/rollback-$(date +%s).json"
    cat > "$rollback_marker" <<EOF
{
    "rollbackTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "rollbackDuration": $(($(date +%s) - ROLLBACK_START_TIME)),
    "rolledBackProcesses": $(printf '%s\n' "${!PROCESS_IDS[@]}" | jq -R . | jq -s .),
    "rollbackStatus": {
EOF
    
    local first=true
    for process in "${!ROLLBACK_STATUS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$rollback_marker"
        fi
        echo "        \"$process\": \"${ROLLBACK_STATUS[$process]}\"" >> "$rollback_marker"
    done
    
    cat >> "$rollback_marker" <<EOF
    }
}
EOF
    
    log_success "Rollback completion marker created: $rollback_marker"
}

# Function to display rollback summary
display_rollback_summary() {
    local rollback_end_time=$(date +%s)
    local total_rollback_time=$((rollback_end_time - ROLLBACK_START_TIME))
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}🔄 DEPLOYMENT ROLLBACK SUMMARY${NC}"
    echo "========================================"
    echo "Total Rollback Time: ${total_rollback_time}s"
    echo ""
    
    local successful_rollbacks=0
    local failed_rollbacks=0
    
    for process in "${!ROLLBACK_STATUS[@]}"; do
        local status="${ROLLBACK_STATUS[$process]}"
        local process_id="${PROCESS_IDS[$process]}"
        
        case "$status" in
            "SUCCESS")
                echo -e "${GREEN}✅ $process${NC} - Rolled back successfully"
                successful_rollbacks=$((successful_rollbacks + 1))
                ;;
            "FAILED")
                echo -e "${RED}❌ $process${NC} - Rollback failed"
                failed_rollbacks=$((failed_rollbacks + 1))
                ;;
            "PENDING")
                echo -e "${YELLOW}⏸️  $process${NC} - Rollback not attempted"
                failed_rollbacks=$((failed_rollbacks + 1))
                ;;
        esac
    done
    
    echo ""
    echo "Rollback Results: $successful_rollbacks successful, $failed_rollbacks failed"
    
    if [ $failed_rollbacks -eq 0 ]; then
        echo -e "${GREEN}🎉 Rollback completed successfully!${NC}"
        echo -e "${GREEN}All processes have been stopped and the deployment has been rolled back.${NC}"
        return 0
    else
        echo -e "${RED}⚠️  Rollback completed with errors${NC}"
        echo -e "${YELLOW}Some processes may still be running. Manual intervention may be required.${NC}"
        return 1
    fi
}

# Main rollback function
main() {
    local deployment_id=""
    local rollback_reason="Manual rollback via script"
    local coordinator_rollback=true
    
    echo -e "${GREEN}🔄 Multi-Process Deployment Rollback${NC}"
    echo "====================================="
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --deployment-id)
                deployment_id="$2"
                shift 2
                ;;
            --reason)
                rollback_reason="$2"
                shift 2
                ;;
            --manual)
                coordinator_rollback=false
                shift
                ;;
            --help)
                echo "Deployment Rollback Script"
                echo ""
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --deployment-id ID  Deployment ID to rollback"
                echo "  --reason REASON     Reason for rollback"
                echo "  --manual           Skip coordinator and perform manual rollback"
                echo "  --help             Show this help message"
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
    
    if [ -z "$deployment_id" ]; then
        deployment_id="rollback-$(date +%s)"
        log_info "No deployment ID specified, using: $deployment_id"
    fi
    
    echo "Deployment ID: $deployment_id"
    echo "Rollback Reason: $rollback_reason"
    echo ""
    
    # Load deployment information
    load_deployment_manifest
    
    echo "Processes to rollback:"
    for process in "${!PROCESS_IDS[@]}"; do
        echo "  - $process (ID: ${PROCESS_IDS[$process]})"
    done
    echo ""
    
    # Confirm rollback
    if [ -t 0 ]; then  # Check if running interactively
        echo -e "${YELLOW}WARNING: This will stop all deployed processes!${NC}"
        read -p "Are you sure you want to proceed with rollback? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Attempt coordinator rollback first if enabled
    local coordinator_success=false
    if [ "$coordinator_rollback" = true ]; then
        if initiate_coordinator_rollback "$deployment_id" "$rollback_reason"; then
            coordinator_success=true
            log_success "Coordinated rollback completed successfully"
        else
            log_warning "Coordinated rollback failed, falling back to manual rollback"
        fi
    fi
    
    # Perform manual rollback if coordinator failed or was disabled
    if [ "$coordinator_success" = false ]; then
        if ! perform_manual_rollback; then
            log_error "Manual rollback encountered errors"
        fi
    fi
    
    # Validate rollback completion
    sleep 10  # Allow processes time to fully shut down
    validate_rollback
    
    # Cleanup artifacts
    cleanup_rollback_artifacts
    
    # Display summary
    display_rollback_summary
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo ""
        echo -e "${GREEN}Rollback completed successfully. All processes have been stopped.${NC}"
        echo -e "${BLUE}To redeploy, run: ./scripts/deploy-multi-process.sh${NC}"
    else
        echo ""
        echo -e "${RED}Rollback completed with errors. Some manual cleanup may be required.${NC}"
        echo -e "${YELLOW}Check process status manually if needed.${NC}"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"