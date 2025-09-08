-- Configuration Distributor Component
-- Manages centralized configuration distribution, validation, and versioning

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local ConfigDistributor = {
    -- Configuration
    config = {
        configValidationEnabled = true,
        configVersioning = true,
        encryptionEnabled = false,
        maxConfigHistoryEntries = 50,
        configSyncTimeoutSeconds = 60
    },
    
    -- Configuration storage
    configurations = {},
    
    -- Configuration history
    configHistory = {},
    
    -- Process-specific configurations
    processConfigurations = {},
    
    -- Configuration distribution tracking
    distributionTracking = {},
    
    -- Configuration types
    CONFIG_TYPES = {
        PROCESS_CONFIG = "PROCESS_CONFIG",
        ENVIRONMENT_VARS = "ENVIRONMENT_VARS",
        RESOURCE_LIMITS = "RESOURCE_LIMITS",
        SECURITY_CONFIG = "SECURITY_CONFIG",
        LOGGING_CONFIG = "LOGGING_CONFIG",
        MONITORING_CONFIG = "MONITORING_CONFIG"
    },
    
    -- Distribution statuses
    DISTRIBUTION_STATUS = {
        PENDING = "PENDING",
        DISTRIBUTING = "DISTRIBUTING",
        COMPLETED = "COMPLETED",
        FAILED = "FAILED",
        PARTIAL = "PARTIAL"
    }
}

-- Initialize configuration distributor
function ConfigDistributor.initialize(config)
    if config then
        for key, value in pairs(config) do
            if ConfigDistributor.config[key] ~= nil then
                ConfigDistributor.config[key] = value
            end
        end
    end
    
    ConfigDistributor.configurations = {}
    ConfigDistributor.configHistory = {}
    ConfigDistributor.processConfigurations = {}
    ConfigDistributor.distributionTracking = {}
    
    print("[ConfigDistributor] Configuration distributor initialized")
end

-- Handle configuration request
function ConfigDistributor.handleConfigurationRequest(msg)
    -- Parse message data
    local success, requestData = pcall(function()
        return require('json').decode(msg.Data)
    end)
    
    if not success then
        return {
            success = false,
            error = "Invalid JSON in configuration request",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    local configRequest = requestData.configRequest
    if not configRequest then
        return {
            success = false,
            error = "Missing configuration request data",
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Validate configuration request
    local validationResult = ConfigDistributor._validateConfigRequest(configRequest)
    if not validationResult.success then
        return {
            success = false,
            error = "Validation failed: " .. validationResult.error,
            correlationId = msg.Tags.CorrelationId
        }
    end
    
    -- Handle different request types
    local requestType = configRequest.requestType
    local result
    
    if requestType == "DISTRIBUTE_CONFIG" then
        result = ConfigDistributor._distributeConfiguration(configRequest)
    elseif requestType == "GET_CONFIG" then
        result = ConfigDistributor._getConfiguration(configRequest)
    elseif requestType == "UPDATE_CONFIG" then
        result = ConfigDistributor._updateConfiguration(configRequest)
    elseif requestType == "VALIDATE_CONFIG" then
        result = ConfigDistributor._validateConfiguration(configRequest)
    elseif requestType == "SYNC_CONFIG" then
        result = ConfigDistributor._syncConfiguration(configRequest)
    else
        result = { success = false, error = "Unknown configuration request type: " .. requestType }
    end
    
    result.correlationId = msg.Tags.CorrelationId
    return result
end

-- Distribute configuration to target processes
function ConfigDistributor._distributeConfiguration(request)
    local distributionId = MessageCorrelator.generateId()
    local currentTime = 0
    
    local distribution = {
        id = distributionId,
        status = ConfigDistributor.DISTRIBUTION_STATUS.PENDING,
        configData = request.configData,
        configType = request.configType,
        targetProcesses = request.targetProcesses,
        version = request.version or ConfigDistributor._generateConfigVersion(),
        startTime = currentTime,
        distributionResults = {},
        validationRequired = request.validationRequired ~= false
    }
    
    -- Register distribution tracking
    ConfigDistributor.distributionTracking[distributionId] = distribution
    
    -- Validate configuration data if required
    if distribution.validationRequired then
        local validationResult = ConfigDistributor._validateConfigData(distribution.configData, distribution.configType)
        if not validationResult.success then
            distribution.status = ConfigDistributor.DISTRIBUTION_STATUS.FAILED
            distribution.error = "Configuration validation failed: " .. validationResult.error
            return {
                success = false,
                error = distribution.error,
                distributionId = distributionId
            }
        end
    end
    
    distribution.status = ConfigDistributor.DISTRIBUTION_STATUS.DISTRIBUTING
    
    -- Distribute to each target process
    local distributionResults = {}
    local successCount = 0
    
    for _, processId in ipairs(distribution.targetProcesses) do
        local processResult = ConfigDistributor._distributeToProcess(processId, distribution)
        distributionResults[processId] = processResult
        
        if processResult.success then
            successCount = successCount + 1
            
            -- Update process-specific configuration cache
            ConfigDistributor._updateProcessConfiguration(processId, distribution.configType, distribution.configData, distribution.version)
        end
    end
    
    distribution.distributionResults = distributionResults
    distribution.completionTime = 0
    
    -- Determine final status
    if successCount == #distribution.targetProcesses then
        distribution.status = ConfigDistributor.DISTRIBUTION_STATUS.COMPLETED
    elseif successCount > 0 then
        distribution.status = ConfigDistributor.DISTRIBUTION_STATUS.PARTIAL
    else
        distribution.status = ConfigDistributor.DISTRIBUTION_STATUS.FAILED
    end
    
    -- Store configuration if distribution was successful
    if distribution.status == ConfigDistributor.DISTRIBUTION_STATUS.COMPLETED or 
       distribution.status == ConfigDistributor.DISTRIBUTION_STATUS.PARTIAL then
        ConfigDistributor._storeConfiguration(distribution)
    end
    
    print("[ConfigDistributor] Configuration distribution completed: " .. distributionId .. 
          " - Status: " .. distribution.status .. 
          " - Success: " .. successCount .. "/" .. #distribution.targetProcesses)
    
    return {
        success = distribution.status == ConfigDistributor.DISTRIBUTION_STATUS.COMPLETED,
        distributionId = distributionId,
        status = distribution.status,
        distributionResults = distributionResults,
        successCount = successCount,
        totalCount = #distribution.targetProcesses,
        configVersion = distribution.version
    }
end

-- Get configuration for specific process
function ConfigDistributor._getConfiguration(request)
    local processId = request.processId
    local configType = request.configType
    
    if not processId then
        return { success = false, error = "Process ID required for configuration retrieval" }
    end
    
    local processConfig = ConfigDistributor.processConfigurations[processId]
    if not processConfig then
        return {
            success = false,
            error = "No configuration found for process: " .. processId
        }
    end
    
    if configType then
        -- Get specific configuration type
        local specificConfig = processConfig[configType]
        if not specificConfig then
            return {
                success = false,
                error = "Configuration type not found for process: " .. configType
            }
        end
        
        return {
            success = true,
            processId = processId,
            configType = configType,
            configData = specificConfig.configData,
            version = specificConfig.version,
            lastUpdated = specificConfig.lastUpdated
        }
    else
        -- Get all configurations for process
        return {
            success = true,
            processId = processId,
            configurations = processConfig
        }
    end
end

-- Update configuration
function ConfigDistributor._updateConfiguration(request)
    local configData = request.configData
    local configType = request.configType
    local targetProcesses = request.targetProcesses
    
    if not configData or not configType or not targetProcesses then
        return { success = false, error = "Configuration data, type, and target processes required for update" }
    end
    
    -- Create distribution request for update
    local distributionRequest = {
        requestType = "DISTRIBUTE_CONFIG",
        configData = configData,
        configType = configType,
        targetProcesses = targetProcesses,
        version = ConfigDistributor._generateConfigVersion(),
        validationRequired = true
    }
    
    return ConfigDistributor._distributeConfiguration(distributionRequest)
end

-- Validate configuration
function ConfigDistributor._validateConfiguration(request)
    local configData = request.configData
    local configType = request.configType
    
    if not configData or not configType then
        return { success = false, error = "Configuration data and type required for validation" }
    end
    
    local validationResult = ConfigDistributor._validateConfigData(configData, configType)
    
    return {
        success = validationResult.success,
        configType = configType,
        validationResult = validationResult,
        validationTime = 0
    }
end

-- Sync configuration across processes
function ConfigDistributor._syncConfiguration(request)
    local configType = request.configType
    local sourceProcessId = request.sourceProcessId
    local targetProcesses = request.targetProcesses or {}
    
    if not configType or not sourceProcessId then
        return { success = false, error = "Configuration type and source process required for sync" }
    end
    
    -- Get source configuration
    local sourceConfig = ConfigDistributor.processConfigurations[sourceProcessId]
    if not sourceConfig or not sourceConfig[configType] then
        return { success = false, error = "Source configuration not found" }
    end
    
    local configData = sourceConfig[configType].configData
    
    -- Determine target processes if not specified
    if #targetProcesses == 0 then
        for processId in pairs(ConfigDistributor.processConfigurations) do
            if processId ~= sourceProcessId then
                table.insert(targetProcesses, processId)
            end
        end
    end
    
    -- Create sync distribution
    local syncRequest = {
        requestType = "DISTRIBUTE_CONFIG",
        configData = configData,
        configType = configType,
        targetProcesses = targetProcesses,
        version = ConfigDistributor._generateConfigVersion(),
        validationRequired = true
    }
    
    local syncResult = ConfigDistributor._distributeConfiguration(syncRequest)
    syncResult.syncType = "CONFIG_SYNC"
    syncResult.sourceProcessId = sourceProcessId
    
    return syncResult
end

-- Get distribution status
function ConfigDistributor.getDistributionStatus(distributionId)
    local distribution = ConfigDistributor.distributionTracking[distributionId]
    if not distribution then
        return { success = false, error = "Distribution not found: " .. distributionId }
    end
    
    return {
        success = true,
        distribution = {
            id = distribution.id,
            status = distribution.status,
            configType = distribution.configType,
            targetProcesses = distribution.targetProcesses,
            version = distribution.version,
            startTime = distribution.startTime,
            completionTime = distribution.completionTime,
            distributionResults = distribution.distributionResults,
            error = distribution.error
        }
    }
end

-- Get configuration statistics
function ConfigDistributor.getStatistics()
    local stats = {
        totalConfigurations = ConfigDistributor._getTableSize(ConfigDistributor.configurations),
        processConfigurationsCount = ConfigDistributor._getTableSize(ConfigDistributor.processConfigurations),
        activeDistributions = 0,
        completedDistributions = 0,
        failedDistributions = 0,
        configHistoryEntries = #ConfigDistributor.configHistory,
        configTypeDistribution = {}
    }
    
    -- Count distribution statuses
    for _, distribution in pairs(ConfigDistributor.distributionTracking) do
        if distribution.status == ConfigDistributor.DISTRIBUTION_STATUS.DISTRIBUTING or 
           distribution.status == ConfigDistributor.DISTRIBUTION_STATUS.PENDING then
            stats.activeDistributions = stats.activeDistributions + 1
        elseif distribution.status == ConfigDistributor.DISTRIBUTION_STATUS.COMPLETED then
            stats.completedDistributions = stats.completedDistributions + 1
        elseif distribution.status == ConfigDistributor.DISTRIBUTION_STATUS.FAILED then
            stats.failedDistributions = stats.failedDistributions + 1
        end
    end
    
    -- Count configuration types
    for _, processConfigs in pairs(ConfigDistributor.processConfigurations) do
        for configType in pairs(processConfigs) do
            if not stats.configTypeDistribution[configType] then
                stats.configTypeDistribution[configType] = 0
            end
            stats.configTypeDistribution[configType] = stats.configTypeDistribution[configType] + 1
        end
    end
    
    return stats
end

-- Private helper functions

function ConfigDistributor._validateConfigRequest(request)
    if not request.requestType then
        return { success = false, error = "Request type required" }
    end
    
    local requestType = request.requestType
    
    if requestType == "DISTRIBUTE_CONFIG" then
        if not request.configData or not request.configType or not request.targetProcesses then
            return { success = false, error = "Configuration data, type, and target processes required for distribution" }
        end
        if type(request.targetProcesses) ~= "table" or #request.targetProcesses == 0 then
            return { success = false, error = "Target processes must be a non-empty array" }
        end
    elseif requestType == "GET_CONFIG" then
        if not request.processId then
            return { success = false, error = "Process ID required for configuration retrieval" }
        end
    elseif requestType == "UPDATE_CONFIG" then
        if not request.configData or not request.configType or not request.targetProcesses then
            return { success = false, error = "Configuration data, type, and target processes required for update" }
        end
    elseif requestType == "VALIDATE_CONFIG" then
        if not request.configData or not request.configType then
            return { success = false, error = "Configuration data and type required for validation" }
        end
    elseif requestType == "SYNC_CONFIG" then
        if not request.configType or not request.sourceProcessId then
            return { success = false, error = "Configuration type and source process required for sync" }
        end
    else
        return { success = false, error = "Unknown request type: " .. requestType }
    end
    
    return { success = true }
end

function ConfigDistributor._validateConfigData(configData, configType)
    if not configData or type(configData) ~= "table" then
        return { success = false, error = "Configuration data must be a table" }
    end
    
    -- Type-specific validation
    if configType == ConfigDistributor.CONFIG_TYPES.PROCESS_CONFIG then
        return ConfigDistributor._validateProcessConfig(configData)
    elseif configType == ConfigDistributor.CONFIG_TYPES.ENVIRONMENT_VARS then
        return ConfigDistributor._validateEnvironmentVars(configData)
    elseif configType == ConfigDistributor.CONFIG_TYPES.RESOURCE_LIMITS then
        return ConfigDistributor._validateResourceLimits(configData)
    elseif configType == ConfigDistributor.CONFIG_TYPES.SECURITY_CONFIG then
        return ConfigDistributor._validateSecurityConfig(configData)
    elseif configType == ConfigDistributor.CONFIG_TYPES.LOGGING_CONFIG then
        return ConfigDistributor._validateLoggingConfig(configData)
    elseif configType == ConfigDistributor.CONFIG_TYPES.MONITORING_CONFIG then
        return ConfigDistributor._validateMonitoringConfig(configData)
    else
        -- Generic validation for unknown types
        return { success = true }
    end
end

function ConfigDistributor._validateProcessConfig(configData)
    -- Basic process configuration validation
    if configData.processType and type(configData.processType) ~= "string" then
        return { success = false, error = "processType must be a string" }
    end
    
    if configData.maxConcurrentRequests and type(configData.maxConcurrentRequests) ~= "number" then
        return { success = false, error = "maxConcurrentRequests must be a number" }
    end
    
    return { success = true }
end

function ConfigDistributor._validateEnvironmentVars(configData)
    -- Environment variables must be string key-value pairs
    for key, value in pairs(configData) do
        if type(key) ~= "string" or type(value) ~= "string" then
            return { success = false, error = "Environment variables must be string key-value pairs" }
        end
    end
    return { success = true }
end

function ConfigDistributor._validateResourceLimits(configData)
    local numericFields = {"maxMemoryMB", "maxCpuPercent", "maxStorageMB", "maxConnections"}
    
    for _, field in ipairs(numericFields) do
        if configData[field] and (type(configData[field]) ~= "number" or configData[field] <= 0) then
            return { success = false, error = field .. " must be a positive number" }
        end
    end
    
    return { success = true }
end

function ConfigDistributor._validateSecurityConfig(configData)
    if configData.authLevel and type(configData.authLevel) ~= "string" then
        return { success = false, error = "authLevel must be a string" }
    end
    
    if configData.encryptionEnabled and type(configData.encryptionEnabled) ~= "boolean" then
        return { success = false, error = "encryptionEnabled must be a boolean" }
    end
    
    return { success = true }
end

function ConfigDistributor._validateLoggingConfig(configData)
    if configData.logLevel and type(configData.logLevel) ~= "string" then
        return { success = false, error = "logLevel must be a string" }
    end
    
    local validLogLevels = {"DEBUG", "INFO", "WARN", "ERROR", "FATAL"}
    if configData.logLevel then
        local validLevel = false
        for _, level in ipairs(validLogLevels) do
            if configData.logLevel == level then
                validLevel = true
                break
            end
        end
        if not validLevel then
            return { success = false, error = "Invalid log level: " .. configData.logLevel }
        end
    end
    
    return { success = true }
end

function ConfigDistributor._validateMonitoringConfig(configData)
    if configData.metricsEnabled and type(configData.metricsEnabled) ~= "boolean" then
        return { success = false, error = "metricsEnabled must be a boolean" }
    end
    
    if configData.healthCheckInterval and type(configData.healthCheckInterval) ~= "number" then
        return { success = false, error = "healthCheckInterval must be a number" }
    end
    
    return { success = true }
end

function ConfigDistributor._distributeToProcess(processId, distribution)
    local distributionMessage = {
        correlation = {
            id = MessageCorrelator.generateId(),
            requestType = "CONFIG_UPDATE"
        },
        configUpdate = {
            distributionId = distribution.id,
            processId = processId,
            configType = distribution.configType,
            configData = distribution.configData,
            version = distribution.version,
            validationRequired = distribution.validationRequired
        }
    }
    
    -- Route configuration message
    local routingResult = MessageRouter.routeMessage(
        "CONFIG_UPDATE",
        distributionMessage,
        "DIRECT_ROUTE"
    )
    
    return {
        success = routingResult.success,
        processId = processId,
        configType = distribution.configType,
        version = distribution.version,
        distributionTime = 0,
        correlationId = distributionMessage.correlation.id,
        error = routingResult.error
    }
end

function ConfigDistributor._updateProcessConfiguration(processId, configType, configData, version)
    if not ConfigDistributor.processConfigurations[processId] then
        ConfigDistributor.processConfigurations[processId] = {}
    end
    
    ConfigDistributor.processConfigurations[processId][configType] = {
        configData = configData,
        version = version,
        lastUpdated = 0
    }
end

function ConfigDistributor._storeConfiguration(distribution)
    local configKey = distribution.configType .. "_" .. distribution.version
    
    ConfigDistributor.configurations[configKey] = {
        configType = distribution.configType,
        configData = distribution.configData,
        version = distribution.version,
        targetProcesses = distribution.targetProcesses,
        distributionId = distribution.id,
        createdTime = distribution.startTime,
        distributionStatus = distribution.status
    }
    
    -- Add to history
    table.insert(ConfigDistributor.configHistory, {
        configType = distribution.configType,
        version = distribution.version,
        distributionId = distribution.id,
        timestamp = msg.Timestamp,
        action = "DISTRIBUTED"
    })
    
    -- Manage history size
    if #ConfigDistributor.configHistory > ConfigDistributor.config.maxConfigHistoryEntries then
        table.remove(ConfigDistributor.configHistory, 1)
    end
end

function ConfigDistributor._generateConfigVersion()
    return "id_" .. msg.Timestamp .. "_" .. math.random(1000, 9999)
end

function ConfigDistributor._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return ConfigDistributor