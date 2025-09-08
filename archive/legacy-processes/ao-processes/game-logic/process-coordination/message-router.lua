-- Message Routing Layer for Inter-Process Communication
-- Routes messages based on operation type and maintains routing tables

local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")

local MessageRouter = {
    -- Routing table mapping operation types to process types
    operationRoutes = {},
    
    -- Process capability routing cache
    processCapabilities = {},
    
    -- Load balancing state for multiple processes of same type
    loadBalancingState = {},
    
    -- Routing statistics
    routingStats = {
        totalRoutes = 0,
        successfulRoutes = 0,
        failedRoutes = 0,
        routesByOperation = {},
        routesByProcessType = {}
    }
}

-- Operation types for routing classification
MessageRouter.OPERATION_TYPES = {
    -- Battle operations
    BATTLE_RESOLUTION = "BATTLE_RESOLUTION",
    BATTLE_START = "BATTLE_START",
    BATTLE_END = "BATTLE_END",
    MOVE_EXECUTION = "MOVE_EXECUTION",
    
    -- Pokemon operations  
    POKEMON_UPDATE = "POKEMON_UPDATE",
    POKEMON_EVOLUTION = "POKEMON_EVOLUTION",
    STAT_CALCULATION = "STAT_CALCULATION",
    POKEMON_CAPTURE = "POKEMON_CAPTURE",
    
    -- Shop operations
    SHOP_TRANSACTION = "SHOP_TRANSACTION", 
    SHOP_INVENTORY = "SHOP_INVENTORY",
    ITEM_PURCHASE = "ITEM_PURCHASE",
    ITEM_SALE = "ITEM_SALE",
    
    -- Game state operations
    SAVE_GAME = "SAVE_GAME",
    LOAD_GAME = "LOAD_GAME",
    SYNC_STATE = "SYNC_STATE",
    
    -- Admin operations
    PROCESS_HEALTH = "PROCESS_HEALTH",
    SYSTEM_STATUS = "SYSTEM_STATUS",
    CONFIGURATION_UPDATE = "CONFIGURATION_UPDATE"
}

-- Default routing table
MessageRouter.DEFAULT_ROUTES = {
    -- Battle operations route to battle processes
    [MessageRouter.OPERATION_TYPES.BATTLE_RESOLUTION] = ProcessAuthenticator.PROCESS_TYPES.BATTLE,
    [MessageRouter.OPERATION_TYPES.BATTLE_START] = ProcessAuthenticator.PROCESS_TYPES.BATTLE,
    [MessageRouter.OPERATION_TYPES.BATTLE_END] = ProcessAuthenticator.PROCESS_TYPES.BATTLE,
    [MessageRouter.OPERATION_TYPES.MOVE_EXECUTION] = ProcessAuthenticator.PROCESS_TYPES.BATTLE,
    
    -- Pokemon operations route to pokemon processes
    [MessageRouter.OPERATION_TYPES.POKEMON_UPDATE] = ProcessAuthenticator.PROCESS_TYPES.POKEMON,
    [MessageRouter.OPERATION_TYPES.POKEMON_EVOLUTION] = ProcessAuthenticator.PROCESS_TYPES.POKEMON,
    [MessageRouter.OPERATION_TYPES.STAT_CALCULATION] = ProcessAuthenticator.PROCESS_TYPES.POKEMON,
    [MessageRouter.OPERATION_TYPES.POKEMON_CAPTURE] = ProcessAuthenticator.PROCESS_TYPES.POKEMON,
    
    -- Shop operations route to shop processes
    [MessageRouter.OPERATION_TYPES.SHOP_TRANSACTION] = ProcessAuthenticator.PROCESS_TYPES.SHOP,
    [MessageRouter.OPERATION_TYPES.SHOP_INVENTORY] = ProcessAuthenticator.PROCESS_TYPES.SHOP,
    [MessageRouter.OPERATION_TYPES.ITEM_PURCHASE] = ProcessAuthenticator.PROCESS_TYPES.SHOP,
    [MessageRouter.OPERATION_TYPES.ITEM_SALE] = ProcessAuthenticator.PROCESS_TYPES.SHOP,
    
    -- Game state operations route to coordinator processes
    [MessageRouter.OPERATION_TYPES.SAVE_GAME] = ProcessAuthenticator.PROCESS_TYPES.COORDINATOR,
    [MessageRouter.OPERATION_TYPES.LOAD_GAME] = ProcessAuthenticator.PROCESS_TYPES.COORDINATOR,
    [MessageRouter.OPERATION_TYPES.SYNC_STATE] = ProcessAuthenticator.PROCESS_TYPES.COORDINATOR,
    
    -- Admin operations route to admin processes
    [MessageRouter.OPERATION_TYPES.PROCESS_HEALTH] = ProcessAuthenticator.PROCESS_TYPES.ADMIN,
    [MessageRouter.OPERATION_TYPES.SYSTEM_STATUS] = ProcessAuthenticator.PROCESS_TYPES.ADMIN,
    [MessageRouter.OPERATION_TYPES.CONFIGURATION_UPDATE] = ProcessAuthenticator.PROCESS_TYPES.ADMIN
}

-- Routing strategies
MessageRouter.ROUTING_STRATEGIES = {
    ROUND_ROBIN = "round_robin",
    LEAST_LOADED = "least_loaded",
    CAPABILITY_MATCH = "capability_match",
    RANDOM = "random"
}

-- Initialize the message router
function MessageRouter.initialize()
    -- Copy default routes to active routing table
    MessageRouter.operationRoutes = {}
    for operation, processType in pairs(MessageRouter.DEFAULT_ROUTES) do
        MessageRouter.operationRoutes[operation] = processType
    end
    
    MessageRouter.processCapabilities = {}
    MessageRouter.loadBalancingState = {}
    MessageRouter.routingStats = {
        totalRoutes = 0,
        successfulRoutes = 0,
        failedRoutes = 0,
        routesByOperation = {},
        routesByProcessType = {}
    }
    
    print("[MessageRouter] Message routing system initialized")
end

-- Add or update routing rule
function MessageRouter.addRoute(operationType, targetProcessType, priority)
    if not operationType or not targetProcessType then
        return false, "Operation type and target process type are required"
    end
    
    if not MessageRouter.OPERATION_TYPES[operationType] and not operationType then
        return false, "Invalid operation type: " .. tostring(operationType)
    end
    
    local validProcessTypes = ProcessAuthenticator._getProcessTypeList()
    local isValidProcessType = false
    for _, processType in ipairs(validProcessTypes) do
        if processType:lower() == targetProcessType:lower() then
            isValidProcessType = true
            break
        end
    end
    
    if not isValidProcessType then
        return false, "Invalid target process type: " .. tostring(targetProcessType)
    end
    
    MessageRouter.operationRoutes[operationType] = {
        processType = targetProcessType:lower(),
        priority = priority or "NORMAL",
        addedAt = timestamp or 0
    }
    
    return true
end

-- Remove routing rule
function MessageRouter.removeRoute(operationType)
    if not operationType then
        return false, "Operation type is required"
    end
    
    if MessageRouter.operationRoutes[operationType] then
        MessageRouter.operationRoutes[operationType] = nil
        return true
    end
    
    return false, "Route not found for operation: " .. tostring(operationType)
end

-- Route a message to appropriate process based on operation type
function MessageRouter.routeMessage(operationType, messageData, routingStrategy)
    MessageRouter.routingStats.totalRoutes = MessageRouter.routingStats.totalRoutes + 1
    MessageRouter.routingStats.routesByOperation[operationType] = (MessageRouter.routingStats.routesByOperation[operationType] or 0) + 1
    
    local strategy = routingStrategy or MessageRouter.ROUTING_STRATEGIES.CAPABILITY_MATCH
    
    -- Get target process type from routing table
    local routeInfo = MessageRouter.operationRoutes[operationType]
    if not routeInfo then
        MessageRouter.routingStats.failedRoutes = MessageRouter.routingStats.failedRoutes + 1
        return nil, "No route found for operation: " .. tostring(operationType)
    end
    
    local targetProcessType = type(routeInfo) == "table" and routeInfo.processType or routeInfo
    
    -- Get available processes for target type
    local availableProcesses = ProcessAuthenticator.listRegisteredProcesses(targetProcessType)
    if not availableProcesses or MessageRouter._getTableSize(availableProcesses) == 0 then
        MessageRouter.routingStats.failedRoutes = MessageRouter.routingStats.failedRoutes + 1
        return nil, "No available processes of type: " .. targetProcessType
    end
    
    -- Select target process based on routing strategy
    local targetProcessId = MessageRouter._selectTargetProcess(availableProcesses, strategy, operationType)
    if not targetProcessId then
        MessageRouter.routingStats.failedRoutes = MessageRouter.routingStats.failedRoutes + 1
        return nil, "Failed to select target process for operation: " .. operationType
    end
    
    -- Create routing context
    local routingContext = {
        operationType = operationType,
        targetProcessId = targetProcessId,
        targetProcessType = targetProcessType,
        routingStrategy = strategy,
        routedAt = timestamp or 0,
        messageData = messageData
    }
    
    MessageRouter.routingStats.successfulRoutes = MessageRouter.routingStats.successfulRoutes + 1
    MessageRouter.routingStats.routesByProcessType[targetProcessType] = (MessageRouter.routingStats.routesByProcessType[targetProcessType] or 0) + 1
    
    return routingContext
end

-- Get routing information for operation type
function MessageRouter.getRouteInfo(operationType)
    local routeInfo = MessageRouter.operationRoutes[operationType]
    if not routeInfo then
        return nil
    end
    
    local targetProcessType = type(routeInfo) == "table" and routeInfo.processType or routeInfo
    local availableProcesses = ProcessAuthenticator.listRegisteredProcesses(targetProcessType)
    
    return {
        operationType = operationType,
        targetProcessType = targetProcessType,
        priority = type(routeInfo) == "table" and routeInfo.priority or "NORMAL",
        availableProcessCount = MessageRouter._getTableSize(availableProcesses),
        availableProcessIds = MessageRouter._getProcessIds(availableProcesses)
    }
end

-- Validate message routing capability
function MessageRouter.validateRouting(operationType, sourceProcessId, targetProcessId)
    -- Check if operation type has a valid route
    local routeInfo = MessageRouter.getRouteInfo(operationType)
    if not routeInfo then
        return false, "No route configured for operation: " .. tostring(operationType)
    end
    
    -- Check if target process exists and is active
    local targetProcess = ProcessAuthenticator.getProcessInfo(targetProcessId)
    if not targetProcess then
        return false, "Target process not found: " .. tostring(targetProcessId)
    end
    
    if targetProcess.status ~= "active" then
        return false, "Target process is not active: " .. targetProcessId
    end
    
    -- Check if target process type matches route
    if targetProcess.type ~= routeInfo.targetProcessType then
        return false, string.format("Process type mismatch. Expected: %s, Got: %s", 
                                   routeInfo.targetProcessType, targetProcess.type)
    end
    
    -- Check if target process has required capability
    if not MessageRouter._processHasCapability(targetProcess.capabilities, operationType) then
        return false, "Target process lacks required capability for operation: " .. operationType
    end
    
    return true
end

-- Update process capabilities cache
function MessageRouter.updateProcessCapabilities(processId, capabilities)
    if not processId or not capabilities then
        return false
    end
    
    MessageRouter.processCapabilities[processId] = {
        capabilities = capabilities,
        lastUpdated = timestamp or 0
    }
    
    return true
end

-- Get all configured routes
function MessageRouter.getAllRoutes()
    local routes = {}
    
    for operationType, routeInfo in pairs(MessageRouter.operationRoutes) do
        local targetProcessType = type(routeInfo) == "table" and routeInfo.processType or routeInfo
        local priority = type(routeInfo) == "table" and routeInfo.priority or "NORMAL"
        
        routes[operationType] = {
            targetProcessType = targetProcessType,
            priority = priority,
            availableProcesses = MessageRouter._getTableSize(ProcessAuthenticator.listRegisteredProcesses(targetProcessType))
        }
    end
    
    return routes
end

-- Get routing statistics
function MessageRouter.getRoutingStatistics()
    return {
        totalRoutes = MessageRouter.routingStats.totalRoutes,
        successfulRoutes = MessageRouter.routingStats.successfulRoutes,
        failedRoutes = MessageRouter.routingStats.failedRoutes,
        successRate = MessageRouter.routingStats.totalRoutes > 0 and 
                     (MessageRouter.routingStats.successfulRoutes / MessageRouter.routingStats.totalRoutes) or 0,
        routesByOperation = MessageRouter.routingStats.routesByOperation,
        routesByProcessType = MessageRouter.routingStats.routesByProcessType,
        configuredRoutes = MessageRouter._getTableSize(MessageRouter.operationRoutes)
    }
end

-- Reset routing statistics
function MessageRouter.resetStatistics()
    MessageRouter.routingStats = {
        totalRoutes = 0,
        successfulRoutes = 0,
        failedRoutes = 0,
        routesByOperation = {},
        routesByProcessType = {}
    }
end

-- Private helper functions

function MessageRouter._selectTargetProcess(availableProcesses, strategy, operationType)
    if MessageRouter._getTableSize(availableProcesses) == 0 then
        return nil
    end
    
    local processIds = MessageRouter._getProcessIds(availableProcesses)
    
    if strategy == MessageRouter.ROUTING_STRATEGIES.ROUND_ROBIN then
        return MessageRouter._roundRobinSelection(processIds, operationType)
        
    elseif strategy == MessageRouter.ROUTING_STRATEGIES.CAPABILITY_MATCH then
        return MessageRouter._capabilityMatchSelection(availableProcesses, operationType)
        
    elseif strategy == MessageRouter.ROUTING_STRATEGIES.RANDOM then
        return MessageRouter._randomSelection(processIds)
        
    elseif strategy == MessageRouter.ROUTING_STRATEGIES.LEAST_LOADED then
        -- For now, fallback to round robin (load tracking would be implemented later)
        return MessageRouter._roundRobinSelection(processIds, operationType)
        
    else
        -- Default to first available process
        return processIds[1]
    end
end

function MessageRouter._roundRobinSelection(processIds, operationType)
    if not MessageRouter.loadBalancingState[operationType] then
        MessageRouter.loadBalancingState[operationType] = 0
    end
    
    local index = (MessageRouter.loadBalancingState[operationType] % #processIds) + 1
    MessageRouter.loadBalancingState[operationType] = MessageRouter.loadBalancingState[operationType] + 1
    
    return processIds[index]
end

function MessageRouter._capabilityMatchSelection(availableProcesses, operationType)
    -- Select process with best capability match
    for processId, processInfo in pairs(availableProcesses) do
        if MessageRouter._processHasCapability(processInfo.capabilities, operationType) then
            return processId
        end
    end
    
    -- Fallback to first available if no perfect match
    local processIds = MessageRouter._getProcessIds(availableProcesses)
    return processIds[1]
end

function MessageRouter._randomSelection(processIds)
    local randomIndex = math.random(1, #processIds)
    return processIds[randomIndex]
end

function MessageRouter._processHasCapability(capabilities, operationType)
    if not capabilities or type(capabilities) ~= "table" then
        return false
    end
    
    for _, capability in ipairs(capabilities) do
        if capability == "*" or capability == operationType or 
           MessageRouter._isRelatedCapability(capability, operationType) then
            return true
        end
    end
    
    return false
end

function MessageRouter._isRelatedCapability(capability, operationType)
    -- Check if capability covers the operation type
    local capabilityMappings = {
        ["battle-resolution"] = {"BATTLE_RESOLUTION", "BATTLE_START", "BATTLE_END", "MOVE_EXECUTION"},
        ["pokemon-management"] = {"POKEMON_UPDATE", "POKEMON_EVOLUTION", "STAT_CALCULATION", "POKEMON_CAPTURE"},
        ["shop-operations"] = {"SHOP_TRANSACTION", "SHOP_INVENTORY", "ITEM_PURCHASE", "ITEM_SALE"},
        ["game-state"] = {"SAVE_GAME", "LOAD_GAME", "SYNC_STATE"},
        ["admin-operations"] = {"PROCESS_HEALTH", "SYSTEM_STATUS", "CONFIGURATION_UPDATE"}
    }
    
    local relatedOperations = capabilityMappings[capability]
    if relatedOperations then
        for _, operation in ipairs(relatedOperations) do
            if operation == operationType then
                return true
            end
        end
    end
    
    return false
end

function MessageRouter._getProcessIds(processes)
    local ids = {}
    for processId, _ in pairs(processes) do
        table.insert(ids, processId)
    end
    return ids
end

function MessageRouter._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return MessageRouter