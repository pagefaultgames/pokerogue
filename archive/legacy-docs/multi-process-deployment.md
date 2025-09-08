# Multi-Process Deployment & Orchestration Guide

This guide covers the deployment, management, and troubleshooting of PokéRogue's multi-process architecture using the deployment coordinator system.

## Overview

The multi-process deployment system provides coordinated deployment and orchestration of distributed AO processes with:

- **Dependency-aware deployment sequencing**
- **Health validation and monitoring**
- **Rollback capabilities**
- **Blue-green deployment strategies**
- **Configuration management**
- **Real-time monitoring and alerting**

## Architecture

### Components

1. **Deployment Coordinator Process** - Central orchestration and coordination
2. **Health Validator** - Integration with admin HealthMonitor
3. **Rollback Manager** - State preservation and rollback capabilities
4. **Blue-Green Manager** - Zero-downtime deployment strategies
5. **Configuration Distributor** - Centralized configuration management
6. **Deployment Monitor** - Metrics and AlertManager integration

### Process Dependencies

```
deployment-coordinator (standalone)
admin (standalone)
coordinator (standalone)
├── battle (depends on coordinator)
├── pokemon (depends on coordinator)
├── shop (depends on coordinator)
└── security (depends on coordinator)
```

## Deployment Scripts

### 1. Multi-Process Deployment

**Script:** `scripts/deploy-multi-process.sh`

**Purpose:** Deploy all processes with dependency management and health validation.

**Usage:**
```bash
# Deploy all processes
./scripts/deploy-multi-process.sh

# Deploy specific processes only
./scripts/deploy-multi-process.sh --only "coordinator battle pokemon"

# Set custom timeout
./scripts/deploy-multi-process.sh --timeout 900
```

**Features:**
- Dependency-aware sequential deployment
- Automatic health validation
- Process registration with deployment coordinator
- Deployment manifest generation
- Retry logic with configurable attempts
- Real-time progress tracking

**Output:**
- Deployment manifest: `build/deployment-manifest.json`
- Process bundles: `build/{process}-process.lua`

### 2. Deployment Validation

**Script:** `scripts/validate-deployment.sh`

**Purpose:** Comprehensive validation of deployed processes.

**Usage:**
```bash
# Run all validation types
./scripts/validate-deployment.sh

# Run specific validation types
./scripts/validate-deployment.sh --types "health,integration,performance"

# Custom performance test duration
./scripts/validate-deployment.sh --performance-duration 120
```

**Validation Types:**
- **Health:** Process responsiveness and status
- **Integration:** Inter-process communication
- **Performance:** Load testing and metrics
- **Security:** Authentication and authorization
- **Configuration:** Process capabilities and setup

**Output:**
- Validation report: `build/validation-report.json`
- Performance metrics
- Integration status

### 3. Deployment Rollback

**Script:** `scripts/rollback-deployment.sh`

**Purpose:** Safe rollback of multi-process deployments.

**Usage:**
```bash
# Interactive rollback
./scripts/rollback-deployment.sh

# Automated rollback
./scripts/rollback-deployment.sh --deployment-id "deploy-123" --reason "Critical bug found"

# Manual rollback (skip coordinator)
./scripts/rollback-deployment.sh --manual
```

**Features:**
- Coordinated rollback through deployment coordinator
- Manual rollback fallback
- Graceful process shutdown
- State preservation
- Rollback validation
- Comprehensive logging

## Deployment Strategies

### 1. Sequential Deployment (Default)

Processes are deployed one at a time in dependency order:

```bash
./scripts/deploy-multi-process.sh
```

**Advantages:**
- Safe and predictable
- Easy troubleshooting
- Clear dependency resolution

**Use Cases:**
- Production deployments
- Initial deployments
- Critical updates

### 2. Blue-Green Deployment

Zero-downtime deployment with traffic switching:

```bash
# Implement via deployment coordinator
# See Blue-Green Deployment section below
```

**Advantages:**
- Zero downtime
- Instant rollback capability
- Production traffic validation

**Use Cases:**
- Production updates
- A/B testing
- Critical services

### 3. Rolling Deployment

Gradual update with health validation:

**Advantages:**
- Resource efficient
- Gradual risk exposure
- Continuous availability

**Use Cases:**
- Large-scale updates
- Non-critical services
- Development environments

## Blue-Green Deployment

### Process

1. **Green Environment Preparation**
   - Deploy new version to green environment
   - Validate green environment health
   - Test green environment functionality

2. **Traffic Switching**
   - Gradual traffic routing to green
   - Monitor performance and errors
   - Full switch upon validation

3. **Monitoring & Validation**
   - Monitor green environment stability
   - Validate performance metrics
   - Cleanup blue environment upon success

### Configuration

```lua
-- Blue-green deployment request
{
    blueGreenRequest = {
        targetProcesses = {"battle", "pokemon", "shop"},
        newVersion = "2.1.0",
        trafficStrategy = "GRADUAL", -- INSTANT, GRADUAL, CANARY, A_B_TEST
        healthCheckTimeout = 300,
        rollbackOnFailure = true
    }
}
```

### Traffic Strategies

- **INSTANT:** Immediate 100% traffic switch
- **GRADUAL:** Progressive percentage-based switching
- **CANARY:** Small percentage validation first
- **A_B_TEST:** Maintain split for testing

## Configuration Management

### Centralized Configuration

The Configuration Distributor manages:

- **Process Configuration:** Runtime settings
- **Environment Variables:** System configuration
- **Resource Limits:** Memory, CPU, storage limits
- **Security Configuration:** Auth levels, encryption
- **Logging Configuration:** Log levels, outputs
- **Monitoring Configuration:** Metrics, health checks

### Configuration Types

```lua
-- Process configuration example
{
    configRequest = {
        requestType = "DISTRIBUTE_CONFIG",
        configType = "PROCESS_CONFIG",
        targetProcesses = ["battle", "pokemon"],
        configData = {
            maxConcurrentRequests = 100,
            requestTimeout = 30000,
            enableMetrics = true
        },
        validationRequired = true
    }
}
```

### Configuration Sync

```bash
# Sync configuration across processes
npx permamind executeAction --target COORDINATOR_ID --action CONFIG_DISTRIBUTION --data '{
    "configRequest": {
        "requestType": "SYNC_CONFIG",
        "configType": "LOGGING_CONFIG",
        "sourceProcessId": "admin-process"
    }
}'
```

## Health Monitoring

### Integration with Admin Process

The deployment coordinator integrates with the admin process HealthMonitor:

- **Automated health checks** during deployment
- **Real-time process monitoring**
- **Alert generation** on health failures
- **Performance metrics collection**

### Health Check Types

1. **Startup Health:** Immediate post-deployment validation
2. **Readiness Health:** Service availability confirmation
3. **Liveness Health:** Ongoing process responsiveness
4. **Performance Health:** Resource usage monitoring

### Health Validation

```lua
-- Health validation request
{
    healthCheck = {
        deploymentId = "deployment-123",
        checkType = "POST_DEPLOYMENT",
        timeoutSeconds = 60,
        expectedVersion = "2.1.0"
    }
}
```

## Monitoring & Alerting

### Integration with AlertManager

Automatic alert generation for:

- **Deployment failures** exceeding threshold
- **Health check failures** during deployment
- **Performance degradation** during deployment
- **Rollback events** and failures
- **Configuration distribution failures**

### Performance Metrics

- **Deployment success rate**
- **Average deployment time**
- **Health check response times**
- **Resource utilization during deployment**
- **Error rates during deployment**

### Monitoring Dashboard

Key metrics tracked:

```json
{
    "deploymentStatistics": {
        "totalDeployments": 150,
        "successfulDeployments": 142,
        "failedDeployments": 8,
        "averageDeploymentTime": 245,
        "rollbackRate": 5.3
    },
    "performanceMetrics": {
        "coordinatorCpuUsage": 25.4,
        "coordinatorMemoryUsage": 45.2,
        "messageProcessingTime": 89,
        "throughput": 95
    }
}
```

## Troubleshooting

### Common Issues

#### 1. Deployment Timeout

**Symptoms:**
- Deployment hangs during process startup
- Health checks timeout
- Processes appear unresponsive

**Solutions:**
```bash
# Check process status
./scripts/validate-deployment.sh --types "health"

# Increase timeout
./scripts/deploy-multi-process.sh --timeout 900

# Check process logs
npx permamind queryAOProcessMessages --processId PROCESS_ID
```

#### 2. Dependency Resolution Failures

**Symptoms:**
- Processes fail to start due to missing dependencies
- Incorrect deployment order
- Inter-process communication failures

**Solutions:**
```bash
# Validate process dependencies manually
./scripts/validate-deployment.sh --types "integration"

# Deploy with manual process selection
./scripts/deploy-multi-process.sh --only "coordinator battle pokemon shop"

# Check process registration
npx permamind executeAction --target COORDINATOR_ID --action PROCESS_DISCOVERY
```

#### 3. Health Check Failures

**Symptoms:**
- Processes deploy but fail health validation
- Intermittent health check failures
- Performance degradation warnings

**Solutions:**
```bash
# Extended health validation
./scripts/validate-deployment.sh --performance-duration 180

# Check admin integration
npx permamind executeAction --target ADMIN_ID --action ADMIN_HEALTH_CHECK

# Manual health check
npx permamind executeAction --target PROCESS_ID --action Info
```

#### 4. Rollback Failures

**Symptoms:**
- Processes won't stop during rollback
- Partial rollback completion
- State preservation failures

**Solutions:**
```bash
# Force manual rollback
./scripts/rollback-deployment.sh --manual

# Check process status
./scripts/validate-deployment.sh --types "health"

# Manual process termination (if needed)
# Note: Use with caution, may cause data loss
```

### Diagnostic Commands

#### Check Deployment Status

```bash
# Overall deployment status
cat build/deployment-manifest.json | jq '.processes'

# Process health summary
./scripts/validate-deployment.sh --types "health"
```

#### Monitor Process Communication

```bash
# Check message logs
npx permamind queryAOProcessMessages --processId PROCESS_ID

# Test process communication
npx permamind executeAction --target PROCESS_ID --action Info
```

#### Performance Analysis

```bash
# Run performance tests
./scripts/validate-deployment.sh --types "performance" --performance-duration 300

# Check resource usage
npx permamind executeAction --target COORDINATOR_ID --action GET_STATISTICS
```

### Log Analysis

#### Deployment Logs

Key log patterns to look for:

```bash
# Successful deployment
grep "deployment phase completed" /tmp/deploy_output.txt

# Health check failures
grep "health check failed" /tmp/health_output.txt

# Integration issues
grep "integration test failed" /tmp/register_output.txt
```

#### Process Logs

```bash
# Check process startup logs
npx permamind queryAOProcessMessages --processId PROCESS_ID | jq '.messages[] | select(.action == "STARTUP")'

# Monitor error messages
npx permamind queryAOProcessMessages --processId PROCESS_ID | jq '.messages[] | select(.action == "Error")'
```

## Best Practices

### Deployment Planning

1. **Pre-deployment Validation**
   - Validate configuration changes
   - Test in staging environment
   - Review dependency impacts

2. **Deployment Timing**
   - Schedule during low-traffic periods
   - Coordinate with maintenance windows
   - Plan for rollback scenarios

3. **Post-deployment Validation**
   - Run comprehensive validation tests
   - Monitor performance metrics
   - Validate business functionality

### Configuration Management

1. **Configuration Versioning**
   - Track configuration changes
   - Maintain rollback configurations
   - Document configuration impacts

2. **Environment Consistency**
   - Use consistent configurations across environments
   - Validate configuration distribution
   - Monitor configuration drift

### Monitoring & Alerting

1. **Proactive Monitoring**
   - Set appropriate alert thresholds
   - Monitor deployment trends
   - Track performance baselines

2. **Incident Response**
   - Maintain rollback procedures
   - Document troubleshooting steps
   - Practice emergency procedures

## Security Considerations

### Authentication & Authorization

- **Admin-level authentication** required for deployment operations
- **Process-level security** for configuration distribution
- **Audit logging** for all deployment activities

### Configuration Security

- **Secure configuration transmission**
- **Configuration validation** to prevent malicious configs
- **Access control** for sensitive configuration data

### Process Isolation

- **Process-level security boundaries**
- **Network isolation** where applicable
- **Resource limits** to prevent resource exhaustion

## Performance Optimization

### Deployment Performance

1. **Parallel Operations**
   - Use parallel deployment where safe
   - Optimize dependency resolution
   - Batch similar operations

2. **Resource Management**
   - Monitor resource usage during deployment
   - Optimize process startup times
   - Manage concurrent operations

### System Performance

1. **Load Testing**
   - Regular performance validation
   - Capacity planning
   - Performance regression testing

2. **Optimization**
   - Profile deployment processes
   - Optimize message routing
   - Reduce deployment overhead

## Maintenance

### Regular Maintenance Tasks

1. **Deployment Artifact Cleanup**
   ```bash
   # Clean old deployment artifacts (older than 7 days)
   find build/ -name "*.lua" -mtime +7 -delete
   find build/ -name "deployment-manifest-*.json" -mtime +7 -delete
   ```

2. **Log Rotation**
   ```bash
   # Archive old deployment logs
   find /tmp -name "deploy_*.txt" -mtime +3 -delete
   find /tmp -name "health_*.json" -mtime +3 -delete
   ```

3. **Performance Monitoring**
   - Review deployment performance trends
   - Analyze failure patterns
   - Update alert thresholds

### Backup & Recovery

1. **Configuration Backup**
   - Regular configuration snapshots
   - Version control integration
   - Recovery procedures

2. **State Preservation**
   - Regular state backups
   - Rollback point management
   - Recovery validation

---

## Quick Reference

### Essential Commands

```bash
# Deploy all processes
./scripts/deploy-multi-process.sh

# Validate deployment
./scripts/validate-deployment.sh

# Rollback deployment
./scripts/rollback-deployment.sh

# Check process health
npx permamind executeAction --target PROCESS_ID --action Info

# Get deployment status
cat build/deployment-manifest.json | jq '.processes'
```

### Emergency Procedures

```bash
# Emergency rollback
./scripts/rollback-deployment.sh --manual --reason "Emergency rollback"

# Force validation
./scripts/validate-deployment.sh --types "health,integration"

# Check system status
npx permamind executeAction --target COORDINATOR_ID --action SYSTEM_HEALTH
```

For additional support or questions, refer to the process-specific documentation or contact the development team.