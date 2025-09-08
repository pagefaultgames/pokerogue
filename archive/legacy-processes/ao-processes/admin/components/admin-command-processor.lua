-- Admin Command Processor Component
-- Handles execution and coordination of administrative commands across distributed processes

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")

local AdminCommandProcessor = {
    -- Active commands registry
    activeCommands = {},
    
    -- Command execution history
    commandHistory = {},
    
    -- Command execution statistics
    statistics = {
        totalCommands = 0,
        successfulCommands = 0,
        failedCommands = 0,
        rolledBackCommands = 0,
        averageExecutionTime = 0
    },
    
    -- Command types and their configurations
    COMMAND_TYPES = {
        SHUTDOWN = {
            name = "SHUTDOWN",
            requiresElevated = true,
            rollbackSupported = false,
            maxExecutionTime = 300 -- 5 minutes
        },
        RESTART = {
            name = "RESTART", 
            requiresElevated = true,
            rollbackSupported = true,
            maxExecutionTime = 600 -- 10 minutes
        },
        MAINTENANCE = {
            name = "MAINTENANCE",
            requiresElevated = true,
            rollbackSupported = true,
            maxExecutionTime = 1800 -- 30 minutes
        },
        DEPLOY = {
            name = "DEPLOY",
            requiresElevated = true,
            rollbackSupported = true,
            maxExecutionTime = 3600 -- 60 minutes
        },
        ROLLBACK = {
            name = "ROLLBACK",
            requiresElevated = true,
            rollbackSupported = false,
            maxExecutionTime = 900 -- 15 minutes
        },
        CONFIG_UPDATE = {
            name = "CONFIG_UPDATE",
            requiresElevated = false,
            rollbackSupported = true,
            maxExecutionTime = 180 -- 3 minutes
        }
    },
    
    -- Execution modes
    EXECUTION_MODES = {
        IMMEDIATE = "IMMEDIATE",
        SCHEDULED = "SCHEDULED",
        COORDINATED = "COORDINATED"
    },
    
    -- Command execution statuses
    EXECUTION_STATUS = {
        PENDING = "PENDING",
        EXECUTING = "EXECUTING",
        COMPLETED = "COMPLETED",
        FAILED = "FAILED",
        ROLLED_BACK = "ROLLED_BACK",
        TIMEOUT = "TIMEOUT"
    }
}

-- Initialize the admin command processor
function AdminCommandProcessor.initialize()
    AdminCommandProcessor.activeCommands = {}
    AdminCommandProcessor.commandHistory = {}
    AdminCommandProcessor.statistics = {
        totalCommands = 0,
        successfulCommands = 0,
        failedCommands = 0,
        rolledBackCommands = 0,
        averageExecutionTime = 0
    }
    print("[AdminCommandProcessor] Command processor initialized")
end

-- Execute administrative command
function AdminCommandProcessor.executeCommand(commandRequest)
    if not commandRequest or not commandRequest.commandType then
        return { success = false, error = "Command type is required" }
    end
    
    local commandType = commandRequest.commandType
    local commandId = commandRequest.commandId or MessageCorrelator.generateId()
    local targetProcesses = commandRequest.targetProcesses or {}
    local executionMode = commandRequest.executionMode or AdminCommandProcessor.EXECUTION_MODES.IMMEDIATE
    local commandParams = commandRequest.commandParams or {}
    local adminUserId = commandRequest.adminUserId
    
    -- Validate command type
    local commandConfig = AdminCommandProcessor.COMMAND_TYPES[commandType]
    if not commandConfig then
        return { success = false, error = "Unsupported command type: " .. commandType }
    end
    
    -- Create command execution record
    local commandRecord = {
        commandId = commandId,
        commandType = commandType,
        targetProcesses = targetProcesses,
        executionMode = executionMode,
        commandParams = commandParams,
        adminUserId = adminUserId,
        correlationId = commandRequest.correlationId,
        status = AdminCommandProcessor.EXECUTION_STATUS.PENDING,
        startTime = 0,
        executionDetails = {
            stepsCompleted = 0,
            totalSteps = #targetProcesses,
            processResults = {},
            rollbackData = {}
        },
        rollbackAvailable = commandConfig.rollbackSupported
    }
    
    -- Register active command
    AdminCommandProcessor.activeCommands[commandId] = commandRecord
    AdminCommandProcessor.statistics.totalCommands = AdminCommandProcessor.statistics.totalCommands + 1
    
    -- Execute command based on mode
    local executionResult = {}
    if executionMode == AdminCommandProcessor.EXECUTION_MODES.IMMEDIATE then
        executionResult = AdminCommandProcessor._executeImmediateCommand(commandRecord)
    elseif executionMode == AdminCommandProcessor.EXECUTION_MODES.SCHEDULED then
        executionResult = AdminCommandProcessor._scheduleCommand(commandRecord)
    elseif executionMode == AdminCommandProcessor.EXECUTION_MODES.COORDINATED then
        executionResult = AdminCommandProcessor._executeCoordinatedCommand(commandRecord)
    else
        executionResult = { success = false, error = "Unsupported execution mode: " .. executionMode }
    end
    
    -- Update command status
    if executionResult.success then
        commandRecord.status = AdminCommandProcessor.EXECUTION_STATUS.EXECUTING
        AdminCommandProcessor.statistics.successfulCommands = AdminCommandProcessor.statistics.successfulCommands + 1
    else
        commandRecord.status = AdminCommandProcessor.EXECUTION_STATUS.FAILED
        commandRecord.error = executionResult.error
        AdminCommandProcessor.statistics.failedCommands = AdminCommandProcessor.statistics.failedCommands + 1
    end
    
    print("[AdminCommandProcessor] Command '" .. commandType .. "' (" .. commandId .. ") " .. 
          (executionResult.success and "initiated" or "failed"))
    
    return {
        success = executionResult.success,
        commandId = commandId,
        status = commandRecord.status,
        affectedProcesses = targetProcesses,
        details = commandRecord.executionDetails,
        rollbackAvailable = commandRecord.rollbackAvailable,
        error = executionResult.error
    }
end

-- Get status of specific command
function AdminCommandProcessor.getCommandStatus(commandId)
    local commandRecord = AdminCommandProcessor.activeCommands[commandId]
    if not commandRecord then
        -- Check command history
        for _, historicalCommand in ipairs(AdminCommandProcessor.commandHistory) do
            if historicalCommand.commandId == commandId then
                return historicalCommand
            end
        end
        return nil
    end
    
    return {
        commandId = commandRecord.commandId,
        commandType = commandRecord.commandType,
        status = commandRecord.status,
        executionMode = commandRecord.executionMode,
        targetProcesses = commandRecord.targetProcesses,
        startTime = commandRecord.startTime,
        executionDetails = commandRecord.executionDetails,
        rollbackAvailable = commandRecord.rollbackAvailable,
        adminUserId = commandRecord.adminUserId
    }
end

-- Get all active commands
function AdminCommandProcessor.getActiveCommands()
    local activeCommandsList = {}
    for commandId, commandRecord in pairs(AdminCommandProcessor.activeCommands) do
        table.insert(activeCommandsList, {
            commandId = commandId,
            commandType = commandRecord.commandType,
            status = commandRecord.status,
            startTime = commandRecord.startTime,
            targetProcesses = commandRecord.targetProcesses,
            adminUserId = commandRecord.adminUserId
        })
    end
    return activeCommandsList
end

-- Get recent command history
function AdminCommandProcessor.getRecentCommands(limit)
    local recentCommands = {}
    local count = 0
    local maxLimit = limit or 20
    
    -- Get from command history (most recent first)
    for i = #AdminCommandProcessor.commandHistory, 1, -1 do
        if count >= maxLimit then break end
        table.insert(recentCommands, AdminCommandProcessor.commandHistory[i])
        count = count + 1
    end
    
    return recentCommands
end

-- Rollback specific command
function AdminCommandProcessor.rollbackCommand(commandId, rollbackOptions)
    local commandRecord = AdminCommandProcessor.activeCommands[commandId]
    
    -- Check if command exists and supports rollback
    if not commandRecord then
        -- Check if command is in history
        for _, historicalCommand in ipairs(AdminCommandProcessor.commandHistory) do
            if historicalCommand.commandId == commandId and historicalCommand.rollbackAvailable then
                commandRecord = historicalCommand
                break
            end
        end
    end
    
    if not commandRecord then
        return { success = false, error = "Command not found: " .. commandId }
    end
    
    if not commandRecord.rollbackAvailable then
        return { success = false, error = "Command does not support rollback: " .. commandRecord.commandType }
    end
    
    -- Create rollback command
    local rollbackCommandId = MessageCorrelator.generateId()
    local rollbackResult = AdminCommandProcessor.executeCommand({
        commandId = rollbackCommandId,
        commandType = "ROLLBACK",
        targetProcesses = commandRecord.targetProcesses,
        commandParams = {
            originalCommandId = commandId,
            rollbackData = commandRecord.executionDetails.rollbackData,
            adminUserId = rollbackOptions.adminUserId,
            reason = rollbackOptions.reason
        },
        adminUserId = rollbackOptions.adminUserId
    })
    
    if rollbackResult.success then
        -- Update original command status
        commandRecord.status = AdminCommandProcessor.EXECUTION_STATUS.ROLLED_BACK
        commandRecord.rollbackCommandId = rollbackCommandId
        commandRecord.rollbackTime = 0
        
        AdminCommandProcessor.statistics.rolledBackCommands = 
            AdminCommandProcessor.statistics.rolledBackCommands + 1
        
        print("[AdminCommandProcessor] Command '" .. commandId .. "' rolled back successfully")
        return {
            success = true,
            commandId = commandId,
            rollbackCommandId = rollbackCommandId,
            status = AdminCommandProcessor.EXECUTION_STATUS.ROLLED_BACK,
            affectedProcesses = commandRecord.targetProcesses,
            details = rollbackResult.details
        }
    else
        return {
            success = false,
            error = "Rollback execution failed: " .. (rollbackResult.error or "unknown error"),
            commandId = commandId
        }
    end
end

-- Complete command execution (called when all steps are done)
function AdminCommandProcessor.completeCommand(commandId, completionResult)
    local commandRecord = AdminCommandProcessor.activeCommands[commandId]
    if not commandRecord then
        return { success = false, error = "Command not found: " .. commandId }
    end
    
    -- Update command completion details
    commandRecord.status = completionResult.success and 
        AdminCommandProcessor.EXECUTION_STATUS.COMPLETED or 
        AdminCommandProcessor.EXECUTION_STATUS.FAILED
    commandRecord.completionTime = 0
    commandRecord.executionTime = commandRecord.completionTime - commandRecord.startTime
    commandRecord.executionDetails = completionResult.details or commandRecord.executionDetails
    
    -- Update statistics
    AdminCommandProcessor._updateExecutionTimeStatistics(commandRecord.executionTime)
    
    -- Move to history
    table.insert(AdminCommandProcessor.commandHistory, commandRecord)
    AdminCommandProcessor.activeCommands[commandId] = nil
    
    -- Keep history manageable (keep last 100 commands)
    if #AdminCommandProcessor.commandHistory > 100 then
        table.remove(AdminCommandProcessor.commandHistory, 1)
    end
    
    print("[AdminCommandProcessor] Command '" .. commandRecord.commandType .. "' (" .. commandId .. ") completed: " .. 
          commandRecord.status)
    
    return { success = true, commandStatus = commandRecord.status }
end

-- Get command processor statistics
function AdminCommandProcessor.getStatistics()
    return {
        statistics = AdminCommandProcessor.statistics,
        activeCommandCount = AdminCommandProcessor._getTableSize(AdminCommandProcessor.activeCommands),
        historyCount = #AdminCommandProcessor.commandHistory,
        supportedCommandTypes = AdminCommandProcessor.COMMAND_TYPES,
        executionModes = AdminCommandProcessor.EXECUTION_MODES
    }
end

-- Private helper functions

function AdminCommandProcessor._executeImmediateCommand(commandRecord)
    local results = {}
    
    for _, processId in ipairs(commandRecord.targetProcesses) do
        local commandMessage = {
            correlation = {
                id = commandRecord.correlationId or MessageCorrelator.generateId(),
                requestType = "ADMIN_COMMAND"
            },
            adminCommand = {
                commandType = commandRecord.commandType,
                commandId = commandRecord.commandId,
                commandParams = commandRecord.commandParams,
                executionMode = commandRecord.executionMode
            },
            processAuth = {
                sourceProcessId = "admin-process",
                adminUserId = commandRecord.adminUserId
            }
        }
        
        -- Route command to target process
        local routingResult = MessageRouter.routeMessage(
            "ADMIN_COMMAND",
            commandMessage,
            "DIRECT_ROUTE"
        )
        
        results[processId] = {
            processId = processId,
            routed = routingResult.success,
            error = routingResult.error
        }
        
        if routingResult.success then
            commandRecord.executionDetails.stepsCompleted = 
                commandRecord.executionDetails.stepsCompleted + 1
        end
    end
    
    commandRecord.executionDetails.processResults = results
    
    local successCount = 0
    for _, result in pairs(results) do
        if result.routed then
            successCount = successCount + 1
        end
    end
    
    return { 
        success = successCount == #commandRecord.targetProcesses,
        processResults = results,
        successCount = successCount,
        totalProcesses = #commandRecord.targetProcesses
    }
end

function AdminCommandProcessor._scheduleCommand(commandRecord)
    -- Placeholder for scheduled command execution
    -- This would integrate with a scheduler system
    return { success = true, scheduled = true }
end

function AdminCommandProcessor._executeCoordinatedCommand(commandRecord)
    -- Placeholder for coordinated command execution
    -- This would coordinate execution order based on dependencies
    return AdminCommandProcessor._executeImmediateCommand(commandRecord)
end

function AdminCommandProcessor._updateExecutionTimeStatistics(executionTime)
    local currentAvg = AdminCommandProcessor.statistics.averageExecutionTime
    local totalCommands = AdminCommandProcessor.statistics.totalCommands
    
    if totalCommands <= 1 then
        AdminCommandProcessor.statistics.averageExecutionTime = executionTime
    else
        AdminCommandProcessor.statistics.averageExecutionTime = 
            ((currentAvg * (totalCommands - 1)) + executionTime) / totalCommands
    end
end

function AdminCommandProcessor._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return AdminCommandProcessor