-- Deployment Coordinator Process
-- Main entry point for coordinated deployment and orchestration of distributed processes

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")

-- Components
local DeploymentOrchestrator = require("coordinator.components.deployment-orchestrator")
local BlueGreenManager = require("coordinator.components.blue-green-manager")
local ConfigDistributor = require("coordinator.components.config-distributor")

-- Handlers
local DeploymentHandler = require("coordinator.handlers.deployment-handler")
local DiscoveryHandler = require("coordinator.handlers.discovery-handler")

-- Process state
local state = {
    processId = ao.id,
    processType = "DEPLOYMENT_COORDINATOR",
    status = "INITIALIZING",
    version = "1.0.0",
    startTime = 0,
    
    -- Process registry for discovery
    processRegistry = {},
    
    -- Active deployments tracking
    activeDeployments = {},
    
    -- Deployment statistics
    statistics = {
        totalDeployments = 0,
        successfulDeployments = 0,
        failedDeployments = 0,
        rolledBackDeployments = 0,
        averageDeploymentTime = 0
    },
    
    -- Configuration
    config = {
        maxConcurrentDeployments = 5,
        deploymentTimeoutMinutes = 60,
        healthCheckTimeoutSeconds = 300,
        rollbackEnabled = true,
        processDiscoveryEnabled = true,
        configurationValidationEnabled = true
    }
}

-- Initialize the deployment coordinator process
local function initialize()
    print("[DeploymentCoordinator] Initializing deployment coordinator process...")
    
    -- Initialize components
    DeploymentOrchestrator.initialize(state.config)
    BlueGreenManager.initialize(state.config)
    ConfigDistributor.initialize(state.config)
    
    -- Initialize handlers
    DeploymentHandler.initialize(state)
    DiscoveryHandler.initialize(state)
    
    -- Initialize process authenticator
    ProcessAuthenticator.initialize("DEPLOYMENT_COORDINATOR", {
        requiredAuthLevel = "ADMIN",
        enableAuditLogging = true,
        sessionTimeoutMinutes = 60
    })
    
    -- Initialize message correlator
    MessageCorrelator.initialize()
    
    -- Initialize message router
    MessageRouter.initialize("DEPLOYMENT_COORDINATOR")
    
    -- Set process status
    state.status = "ACTIVE"
    state.initializedAt = 0
    
    print("[DeploymentCoordinator] Deployment coordinator process initialized successfully")
end

-- Process info handler for AO Info protocol compliance
Handlers.add("Info", "Info", function(msg)
    ao.send({
        Target = msg.From,
        Data = require('json').encode({
            name = "Deployment Coordinator Process",
            processType = "DEPLOYMENT_COORDINATOR",
            version = state.version,
            status = state.status,
            startTime = state.startTime,
            description = "Coordinates multi-process deployments, health validation, and orchestration",
            capabilities = {
                "DEPLOYMENT_COORDINATION",
                "HEALTH_VALIDATION", 
                "ROLLBACK_MANAGEMENT",
                "BLUE_GREEN_DEPLOYMENT",
                "CONFIGURATION_DISTRIBUTION",
                "PROCESS_DISCOVERY"
            },
            endpoints = {
                deployment = "DEPLOY_PROCESS",
                healthCheck = "DEPLOYMENT_HEALTH_CHECK", 
                rollback = "DEPLOYMENT_ROLLBACK",
                discovery = "PROCESS_REGISTRATION",
                configuration = "CONFIG_DISTRIBUTION"
            },
            authentication = {
                required = true,
                level = "ADMIN",
                methods = {"TOKEN_BASED"}
            },
            statistics = state.statistics,
            activeDeployments = state.activeDeployments
        })
    })
end)

-- Main deployment coordination handler
Handlers.add("DeployProcess", "DEPLOY_PROCESS", function(msg)
    local result = DeploymentHandler.handleDeploymentRequest(msg)
    
    ao.send({
        Target = msg.From,
        Data = require('json').encode(result)
    })
end)

-- Health validation handler
Handlers.add("DeploymentHealthCheck", "DEPLOYMENT_HEALTH_CHECK", function(msg)
    local result = DeploymentHandler.handleHealthValidation(msg)
    
    ao.send({
        Target = msg.From,
        Data = require('json').encode(result)
    })
end)

-- Rollback handler
Handlers.add("DeploymentRollback", "DEPLOYMENT_ROLLBACK", function(msg)
    local result = DeploymentHandler.handleRollbackRequest(msg)
    
    ao.send({
        Target = msg.From,
        Data = require('json').encode(result)
    })
end)

-- Process registration and discovery handler
Handlers.add("ProcessRegistration", "PROCESS_REGISTRATION", function(msg)
    local result = DiscoveryHandler.handleProcessRegistration(msg)
    
    ao.send({
        Target = msg.From,
        Data = require('json').encode(result)
    })
end)

-- Process deregistration handler  
Handlers.add("ProcessDeregistration", "PROCESS_DEREGISTRATION", function(msg)
    local result = DiscoveryHandler.handleProcessDeregistration(msg)
    
    ao.send({
        Target = msg.From,
        Data = require('json').encode(result)
    })
end)

-- Configuration distribution handler
Handlers.add("ConfigDistribution", "CONFIG_DISTRIBUTION", function(msg)
    local result = ConfigDistributor.handleConfigurationRequest(msg)
    
    ao.send({
        Target = msg.From,
        Data = require('json').encode(result)
    })
end)

-- Blue-green deployment handler
Handlers.add("BlueGreenDeployment", "BLUE_GREEN_DEPLOYMENT", function(msg)
    local result = BlueGreenManager.handleBlueGreenRequest(msg)
    
    ao.send({
        Target = msg.From,
        Data = require('json').encode(result)
    })
end)

-- Deployment status query handler
Handlers.add("DeploymentStatus", "DEPLOYMENT_STATUS", function(msg)
    local deploymentId = msg.Tags.DeploymentId
    
    if not deploymentId then
        ao.send({
            Target = msg.From,
            Data = require('json').encode({
                success = false,
                error = "Deployment ID required"
            })
        })
        return
    end
    
    local deployment = state.activeDeployments[deploymentId]
    if deployment then
        ao.send({
            Target = msg.From,
            Data = require('json').encode({
                success = true,
                deploymentStatus = deployment
            })
        })
    else
        ao.send({
            Target = msg.From,
            Data = require('json').encode({
                success = false,
                error = "Deployment not found: " .. deploymentId
            })
        })
    end
end)

-- Process discovery query handler
Handlers.add("ProcessDiscovery", "PROCESS_DISCOVERY", function(msg)
    local processType = msg.Tags.ProcessType
    
    if processType then
        -- Filter by process type
        local filteredProcesses = {}
        for processId, processInfo in pairs(state.processRegistry) do
            if processInfo.processType == processType then
                filteredProcesses[processId] = processInfo
            end
        end
        
        ao.send({
            Target = msg.From,
            Data = require('json').encode({
                success = true,
                processes = filteredProcesses,
                count = DiscoveryHandler._getTableSize(filteredProcesses)
            })
        })
    else
        -- Return all registered processes
        ao.send({
            Target = msg.From,
            Data = require('json').encode({
                success = true,
                processes = state.processRegistry,
                count = DiscoveryHandler._getTableSize(state.processRegistry)
            })
        })
    end
end)

-- System health query handler
Handlers.add("SystemHealth", "SYSTEM_HEALTH", function(msg)
    local healthSummary = {
        deploymentCoordinatorStatus = state.status,
        activeDeployments = DiscoveryHandler._getTableSize(state.activeDeployments),
        registeredProcesses = DiscoveryHandler._getTableSize(state.processRegistry),
        statistics = state.statistics,
        uptime = 0 - state.startTime
    }
    
    ao.send({
        Target = msg.From,
        Data = require('json').encode({
            success = true,
            healthSummary = healthSummary
        })
    })
end)

-- Statistics handler
Handlers.add("GetStatistics", "GET_STATISTICS", function(msg)
    ao.send({
        Target = msg.From,
        Data = require('json').encode({
            success = true,
            statistics = state.statistics,
            processInfo = {
                processId = state.processId,
                processType = state.processType,
                status = state.status,
                uptime = 0 - state.startTime
            }
        })
    })
end)

-- Error handler
Handlers.add("Error", "Error", function(msg)
    print("[DeploymentCoordinator] Error received: " .. (msg.Data or "Unknown error"))
    
    -- Log error for debugging
    local errorInfo = {
        timestamp = msg.Timestamp,
        processId = state.processId,
        error = msg.Data,
        source = msg.From
    }
    
    print("[DeploymentCoordinator] Error logged: " .. require('json').encode(errorInfo))
end)

-- Initialize the process
initialize()

print("[DeploymentCoordinator] Deployment Coordinator Process Ready - Process ID: " .. state.processId)