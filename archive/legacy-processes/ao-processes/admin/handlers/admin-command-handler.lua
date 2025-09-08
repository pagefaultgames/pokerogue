-- Admin Command Handler
-- Handles administrative command execution across distributed processes

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")
local AdminCommandProcessor = require("admin.components.admin-command-processor")
local LogAggregator = require("admin.components.log-aggregator")
local AlertManager = require("admin.components.alert-manager")

-- Administrative command execution handler
Handlers.add(
    "admin-command",
    Handlers.utils.hasMatchingTag("Action", "ADMIN_COMMAND"),
    function(msg)
        -- Authenticate admin command
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "admin-command"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for administrative commands",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local commandData = json.decode(msg.Data)
        if not commandData or not commandData.adminCommand then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "admin-command"
                },
                Data = json.encode({
                    success = false,
                    error = "Administrative command data is required"
                })
            })
            return
        end
        
        local adminCommand = commandData.adminCommand
        local correlationId = MessageCorrelator.generateId()
        
        -- Validate command structure
        if not adminCommand.commandType then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "admin-command"
                },
                Data = json.encode({
                    success = false,
                    error = "Command type is required"
                })
            })
            return
        end
        
        local commandType = adminCommand.commandType
        local targetProcesses = adminCommand.targetProcesses or {}
        local executionMode = adminCommand.executionMode or "IMMEDIATE"
        local commandParams = adminCommand.commandParams or {}
        
        -- Log command execution attempt
        LogAggregator.logEvent({
            level = "INFO",
            component = "AdminCommand",
            message = "Administrative command initiated: " .. commandType,
            adminUserId = authResult.userId,
            correlationId = correlationId,
            targetProcesses = targetProcesses,
            executionMode = executionMode
        })
        
        -- Execute administrative command
        local executionResult = AdminCommandProcessor.executeCommand({
            commandId = correlationId,
            commandType = commandType,
            targetProcesses = targetProcesses,
            executionMode = executionMode,
            commandParams = commandParams,
            adminUserId = authResult.userId,
            correlationId = correlationId
        })
        
        -- Generate alert for critical commands
        local criticalCommands = {"SHUTDOWN", "RESTART", "MAINTENANCE", "ROLLBACK"}
        local isCritical = false
        for _, criticalCmd in ipairs(criticalCommands) do
            if commandType == criticalCmd then
                isCritical = true
                break
            end
        end
        
        if isCritical then
            AlertManager.generateAlert({
                type = "ADMIN_COMMAND",
                severity = "WARNING",
                message = "Critical administrative command executed: " .. commandType,
                details = {
                    commandType = commandType,
                    targetProcesses = targetProcesses,
                    adminUserId = authResult.userId,
                    executionResult = executionResult.success and "SUCCESS" or "FAILED"
                }
            })
        end
        
        -- Send command execution result
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "ADMIN_COMMAND_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "admin-command"
            },
            Data = json.encode({
                success = executionResult.success,
                commandId = correlationId,
                commandType = commandType,
                executionStatus = executionResult.status,
                affectedProcesses = executionResult.affectedProcesses,
                executionDetails = executionResult.details,
                rollbackAvailable = executionResult.rollbackAvailable,
                timestamp = msg.Timestamp,
                error = executionResult.error
            })
        })
        
        print("[AdminCommandHandler] Command '" .. commandType .. "' executed by " .. 
              (authResult.userId or "unknown") .. " - Status: " .. (executionResult.status or "UNKNOWN"))
    end
)

-- Command status query handler
Handlers.add(
    "command-status-query",
    Handlers.utils.hasMatchingTag("Action", "COMMAND_STATUS_QUERY"),
    function(msg)
        -- Authenticate status query
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "command-status-query"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for command status query",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local queryData = json.decode(msg.Data)
        local commandId = queryData and queryData.commandId
        
        if commandId then
            -- Get status for specific command
            local commandStatus = AdminCommandProcessor.getCommandStatus(commandId)
            
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "COMMAND_STATUS_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "command-status-query"
                },
                Data = json.encode({
                    success = true,
                    commandId = commandId,
                    commandStatus = commandStatus,
                    timestamp = 0
                })
            })
        else
            -- Get all active commands
            local activeCommands = AdminCommandProcessor.getActiveCommands()
            local recentCommands = AdminCommandProcessor.getRecentCommands(20)
            
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "COMMAND_STATUS_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "command-status-query"
                },
                Data = json.encode({
                    success = true,
                    activeCommands = activeCommands,
                    recentCommands = recentCommands,
                    timestamp = 0
                })
            })
        end
        
        print("[AdminCommandHandler] Command status query processed for " .. msg.From)
    end
)

-- Command rollback handler
Handlers.add(
    "command-rollback",
    Handlers.utils.hasMatchingTag("Action", "COMMAND_ROLLBACK"),
    function(msg)
        -- Authenticate rollback request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "command-rollback"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for command rollback",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local rollbackData = json.decode(msg.Data)
        if not rollbackData or not rollbackData.commandId then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "command-rollback"
                },
                Data = json.encode({
                    success = false,
                    error = "Command ID is required for rollback"
                })
            })
            return
        end
        
        local commandId = rollbackData.commandId
        local rollbackReason = rollbackData.reason or "Manual rollback request"
        
        -- Log rollback attempt
        LogAggregator.logEvent({
            level = "WARN",
            component = "AdminCommand",
            message = "Command rollback initiated",
            adminUserId = authResult.userId,
            commandId = commandId,
            reason = rollbackReason
        })
        
        -- Execute rollback
        local rollbackResult = AdminCommandProcessor.rollbackCommand(commandId, {
            adminUserId = authResult.userId,
            reason = rollbackReason
        })
        
        -- Generate alert for rollback
        AlertManager.generateAlert({
            type = "COMMAND_ROLLBACK",
            severity = rollbackResult.success and "INFO" or "ERROR",
            message = "Administrative command rollback " .. (rollbackResult.success and "completed" or "failed"),
            details = {
                commandId = commandId,
                reason = rollbackReason,
                adminUserId = authResult.userId,
                rollbackResult = rollbackResult.success and "SUCCESS" or "FAILED"
            }
        })
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "COMMAND_ROLLBACK_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "command-rollback"
            },
            Data = json.encode({
                success = rollbackResult.success,
                commandId = commandId,
                rollbackStatus = rollbackResult.status,
                rollbackDetails = rollbackResult.details,
                affectedProcesses = rollbackResult.affectedProcesses,
                timestamp = msg.Timestamp,
                error = rollbackResult.error
            })
        })
        
        print("[AdminCommandHandler] Rollback for command '" .. commandId .. "' " .. 
              (rollbackResult.success and "completed" or "failed"))
    end
)

-- Process shutdown command handler
Handlers.add(
    "process-shutdown",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_SHUTDOWN"),
    function(msg)
        -- Authenticate shutdown command
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "process-shutdown"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for process shutdown",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local shutdownData = json.decode(msg.Data)
        if not shutdownData or not shutdownData.targetProcesses then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "process-shutdown"
                },
                Data = json.encode({
                    success = false,
                    error = "Target processes are required"
                })
            })
            return
        end
        
        local targetProcesses = shutdownData.targetProcesses
        local gracefulShutdown = shutdownData.gracefulShutdown ~= false
        local shutdownReason = shutdownData.reason or "Administrative shutdown"
        
        -- Execute shutdown command
        local shutdownResult = AdminCommandProcessor.executeCommand({
            commandType = "SHUTDOWN",
            targetProcesses = targetProcesses,
            commandParams = {
                gracefulShutdown = gracefulShutdown,
                reason = shutdownReason,
                statePreservation = shutdownData.statePreservation
            },
            adminUserId = authResult.userId
        })
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "PROCESS_SHUTDOWN_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "process-shutdown"
            },
            Data = json.encode({
                success = shutdownResult.success,
                shutdownStatus = shutdownResult.status,
                affectedProcesses = shutdownResult.affectedProcesses,
                timestamp = msg.Timestamp,
                error = shutdownResult.error
            })
        })
        
        print("[AdminCommandHandler] Process shutdown executed for " .. #targetProcesses .. " processes")
    end
)

-- Process restart command handler
Handlers.add(
    "process-restart",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_RESTART"),
    function(msg)
        -- Authenticate restart command
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "process-restart"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for process restart",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local restartData = json.decode(msg.Data)
        if not restartData or not restartData.targetProcesses then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "process-restart"
                },
                Data = json.encode({
                    success = false,
                    error = "Target processes are required"
                })
            })
            return
        end
        
        local targetProcesses = restartData.targetProcesses
        local restartReason = restartData.reason or "Administrative restart"
        
        -- Execute restart command
        local restartResult = AdminCommandProcessor.executeCommand({
            commandType = "RESTART",
            targetProcesses = targetProcesses,
            commandParams = {
                reason = restartReason,
                stateRestore = restartData.stateRestore,
                configUpdate = restartData.configUpdate
            },
            adminUserId = authResult.userId
        })
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "PROCESS_RESTART_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "process-restart"
            },
            Data = json.encode({
                success = restartResult.success,
                restartStatus = restartResult.status,
                affectedProcesses = restartResult.affectedProcesses,
                timestamp = msg.Timestamp,
                error = restartResult.error
            })
        })
        
        print("[AdminCommandHandler] Process restart executed for " .. #targetProcesses .. " processes")
    end
)

print("[AdminCommandHandler] Admin command handlers registered")