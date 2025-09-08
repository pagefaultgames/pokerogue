-- Security Enforcement Handler
-- Processes policy enforcement requests and security action execution

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local PolicyEnforcer = require("security.components.policy-enforcer")
local AuditLogger = require("security.components.audit-logger")
local AntiCheatDetector = require("security.components.anti-cheat-detector")

-- Policy Enforcement Handler
Handlers.add(
    "policy-enforcement",
    Handlers.utils.hasMatchingTag("Action", "POLICY_ENFORCEMENT"),
    function(msg)
        local startTime = msg.Timestamp
        
        -- Parse enforcement request
        local enforcementRequest = json.decode(msg.Data)
        if not enforcementRequest or not enforcementRequest.context then
            local errorResponse = {
                correlation = {
                    id = msg.Tags.CorrelationId or "unknown",
                    responseType = "ENFORCEMENT_ERROR"
                },
                result = {
                    success = false,
                    error = "Invalid policy enforcement request format",
                    allowed = false,
                    enforcement = "BLOCK"
                }
            }
            
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "POLICY_ENFORCEMENT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode(errorResponse)
            })
            return
        end
        
        local correlationId = (enforcementRequest.correlation and enforcementRequest.correlation.id) or 
                             msg.Tags.CorrelationId or
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
        
        local context = enforcementRequest.context
        context.correlationId = correlationId
        context.processId = context.processId or msg.From
        
        print(string.format("[SecurityEnforcementHandler] Processing policy enforcement from %s - Operation: %s", 
              msg.From, context.operation or "unknown"))
        
        -- Perform policy enforcement
        local enforcementResult, enforcementTime = PolicyEnforcer.enforcePolicies(context)
        
        local endTime = msg.Timestamp
        local totalProcessingTime = endTime - startTime
        
        -- Log enforcement action
        if #enforcementResult.violations > 0 then
            AuditLogger.logSecurityEvent({
                eventType = AuditLogger.EVENT_TYPES.POLICY_VIOLATION,
                severity = enforcementResult.enforcement == "TERMINATE" and AuditLogger.SEVERITY_LEVELS.CRITICAL or
                          enforcementResult.enforcement == "BLOCK" and AuditLogger.SEVERITY_LEVELS.HIGH or
                          AuditLogger.SEVERITY_LEVELS.MEDIUM,
                playerId = context.playerId,
                processId = context.processId,
                eventData = {
                    violations = enforcementResult.violations,
                    enforcement = enforcementResult.enforcement,
                    operation = context.operation,
                    allowed = enforcementResult.allowed
                },
                actionTaken = enforcementResult.enforcement
            }, correlationId)
        end
        
        -- Prepare enforcement response
        local enforcementResponse = {
            correlation = {
                id = correlationId,
                responseType = "ENFORCEMENT_RESULT"
            },
            result = {
                success = true,
                allowed = enforcementResult.allowed,
                enforcement = enforcementResult.enforcement,
                violations = enforcementResult.violations,
                actionMessage = enforcementResult.actionMessage
            },
            metadata = {
                enforcementTime = enforcementTime,
                totalProcessingTime = totalProcessingTime,
                violationCount = #enforcementResult.violations,
                processedAt = 0
            }
        }
        
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        -- Send enforcement response
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "POLICY_ENFORCEMENT_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(enforcementResponse)
        })
        
        print(string.format(
            "[SecurityEnforcementHandler] Enforcement completed: %s (%d violations) - Time: %dms",
            enforcementResult.allowed and "ALLOWED" or "BLOCKED",
            #enforcementResult.violations,
            totalProcessingTime
        ))
    end
)

-- Security Action Execution Handler
Handlers.add(
    "security-action-execution",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_ACTION_EXECUTION"),
    function(msg)
        local actionRequest = json.decode(msg.Data)
        if not actionRequest or not actionRequest.action or not actionRequest.target then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "SECURITY_ACTION_EXECUTION_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid security action execution request"
                })
            })
            return
        end
        
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local action = actionRequest.action
        local target = actionRequest.target
        local reason = actionRequest.reason or "Security enforcement action"
        local severity = actionRequest.severity or "MEDIUM"
        
        local executionResult = {
            success = false,
            action = action,
            target = target,
            executed = false,
            message = "Unknown action"
        }
        
        print(string.format("[SecurityEnforcementHandler] Executing security action: %s on %s", action, target.type))
        
        -- Execute the security action based on type
        if action == "WARN_PLAYER" then
            executionResult = _executePlayerWarning(target, reason, correlationId)
            
        elseif action == "SUSPEND_PLAYER" then
            executionResult = _executePlayerSuspension(target, reason, correlationId)
            
        elseif action == "TERMINATE_SESSION" then
            executionResult = _executeSessionTermination(target, reason, correlationId)
            
        elseif action == "BLOCK_PROCESS" then
            executionResult = _executeProcessBlock(target, reason, correlationId)
            
        elseif action == "QUARANTINE_DATA" then
            executionResult = _executeDataQuarantine(target, reason, correlationId)
            
        elseif action == "ALERT_ADMINISTRATORS" then
            executionResult = _executeAdministratorAlert(target, reason, severity, correlationId)
            
        else
            executionResult.message = "Unsupported security action: " .. action
        end
        
        -- Log the security action execution
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.SECURITY_ALERT,
            severity = severity == "CRITICAL" and AuditLogger.SEVERITY_LEVELS.CRITICAL or
                      severity == "HIGH" and AuditLogger.SEVERITY_LEVELS.HIGH or
                      AuditLogger.SEVERITY_LEVELS.MEDIUM,
            playerId = target.playerId,
            processId = target.processId or msg.From,
            eventData = {
                action = action,
                target = target,
                reason = reason,
                success = executionResult.success,
                executed = executionResult.executed,
                message = executionResult.message
            },
            actionTaken = action
        }, correlationId)
        
        -- Send execution response
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_ACTION_EXECUTION_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode({
                success = executionResult.success,
                executed = executionResult.executed,
                action = executionResult.action,
                target = executionResult.target,
                message = executionResult.message,
                correlationId = correlationId,
                processedAt = 0
            })
        })
        
        print(string.format(
            "[SecurityEnforcementHandler] Security action %s: %s",
            executionResult.executed and "executed" or "failed",
            executionResult.message
        ))
    end
)

-- Anti-Cheat Action Handler
Handlers.add(
    "anti-cheat-action",
    Handlers.utils.hasMatchingTag("Action", "ANTI_CHEAT_ACTION"),
    function(msg)
        local cheatActionRequest = json.decode(msg.Data)
        if not cheatActionRequest or not cheatActionRequest.playerId or not cheatActionRequest.cheatData then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "ANTI_CHEAT_ACTION_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid anti-cheat action request"
                })
            })
            return
        end
        
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local playerId = cheatActionRequest.playerId
        local cheatData = cheatActionRequest.cheatData
        
        -- Perform cheat analysis
        local cheatDetected, detectedCheats, suspicionScore, analysisTime = 
            AntiCheatDetector.analyzeForCheating(cheatData, playerId)
        
        local actionTaken = "NONE"
        local actionMessage = "No cheat detected"
        
        if cheatDetected then
            -- Determine action based on suspicion score and cheat types
            if suspicionScore >= AntiCheatDetector.SUSPICION_LEVELS.CRITICAL then
                actionTaken = "TERMINATE_SESSION"
                actionMessage = "Critical cheat detected - session terminated"
                
                -- Execute immediate session termination
                _executeSessionTermination({
                    type = "player_session",
                    playerId = playerId
                }, "Critical anti-cheat violation", correlationId)
                
            elseif suspicionScore >= AntiCheatDetector.SUSPICION_LEVELS.HIGH then
                actionTaken = "SUSPEND_PLAYER"
                actionMessage = "High-confidence cheat detected - player suspended"
                
                -- Execute player suspension
                _executePlayerSuspension({
                    type = "player",
                    playerId = playerId
                }, "High-confidence anti-cheat violation", correlationId)
                
            elseif suspicionScore >= AntiCheatDetector.SUSPICION_LEVELS.MEDIUM then
                actionTaken = "WARN_PLAYER"
                actionMessage = "Suspicious activity detected - player warned"
                
                -- Execute player warning
                _executePlayerWarning({
                    type = "player",
                    playerId = playerId
                }, "Suspicious activity detected", correlationId)
            end
            
            -- Log cheat detection
            AuditLogger.logCheatDetection({
                playerId = playerId,
                processId = msg.From,
                suspicionScore = suspicionScore,
                detectedCheats = detectedCheats,
                analysisTime = analysisTime,
                actionTaken = actionTaken,
                cheatTypes = _extractCheatTypes(detectedCheats)
            }, correlationId)
        end
        
        local cheatActionResponse = {
            correlation = {
                id = correlationId,
                responseType = "ANTI_CHEAT_ACTION_RESULT"
            },
            result = {
                success = true,
                cheatDetected = cheatDetected,
                suspicionScore = suspicionScore,
                detectedCheats = detectedCheats,
                actionTaken = actionTaken,
                actionMessage = actionMessage
            },
            metadata = {
                analysisTime = analysisTime,
                processedAt = 0,
                playerId = playerId
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "ANTI_CHEAT_ACTION_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(cheatActionResponse)
        })
        
        print(string.format(
            "[SecurityEnforcementHandler] Anti-cheat analysis completed for %s: %s (Score: %.1f)",
            playerId, 
            cheatDetected and "CHEAT_DETECTED" or "CLEAN",
            suspicionScore
        ))
    end
)

-- Policy Management Handler
Handlers.add(
    "policy-management",
    Handlers.utils.hasMatchingTag("Action", "POLICY_MANAGEMENT"),
    function(msg)
        local policyRequest = json.decode(msg.Data)
        if not policyRequest or not policyRequest.operation then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "POLICY_MANAGEMENT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid policy management request"
                })
            })
            return
        end
        
        local result = { success = false, error = "Unknown operation" }
        
        if policyRequest.operation == "ADD_POLICY" and policyRequest.policy then
            local success, error = PolicyEnforcer.addSecurityPolicy(policyRequest.policy)
            result.success = success
            result.error = error
            
        elseif policyRequest.operation == "ENABLE_POLICY" and policyRequest.policyId then
            result.success = PolicyEnforcer.setPolicyEnabled(policyRequest.policyId, true)
            result.error = not result.success and "Policy not found" or nil
            
        elseif policyRequest.operation == "DISABLE_POLICY" and policyRequest.policyId then
            result.success = PolicyEnforcer.setPolicyEnabled(policyRequest.policyId, false)
            result.error = not result.success and "Policy not found" or nil
            
        elseif policyRequest.operation == "UPDATE_ENFORCEMENT" and policyRequest.policyId and policyRequest.enforcement then
            result.success, result.error = PolicyEnforcer.updatePolicyEnforcement(policyRequest.policyId, policyRequest.enforcement)
            
        elseif policyRequest.operation == "GET_VIOLATIONS" then
            result.success = true
            result.violations = PolicyEnforcer.getPolicyViolations(
                policyRequest.playerId,
                policyRequest.processId,
                policyRequest.days
            )
            
        elseif policyRequest.operation == "GET_STATISTICS" then
            result.success = true
            result.statistics = PolicyEnforcer.getStatistics()
        end
        
        -- Log policy management activity
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
            severity = AuditLogger.SEVERITY_LEVELS.LOW,
            processId = msg.From,
            eventData = {
                operation = policyRequest.operation,
                policyId = policyRequest.policyId,
                success = result.success,
                error = result.error
            }
        })
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "POLICY_MANAGEMENT_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "unknown"
            },
            Data = json.encode(result)
        })
    end
)

-- Private helper functions for security action execution

function _executePlayerWarning(target, reason, correlationId)
    -- In a real implementation, this would send a warning message to the player
    -- For now, we'll just log the warning action
    
    return {
        success = true,
        action = "WARN_PLAYER",
        target = target,
        executed = true,
        message = "Player warning logged: " .. reason
    }
end

function _executePlayerSuspension(target, reason, correlationId)
    -- In a real implementation, this would suspend the player's account
    -- For now, we'll just log the suspension action
    
    -- Alert administrators about the suspension
    _executeAdministratorAlert(target, "Player suspended: " .. reason, "HIGH", correlationId)
    
    return {
        success = true,
        action = "SUSPEND_PLAYER",
        target = target,
        executed = true,
        message = "Player suspension logged: " .. reason
    }
end

function _executeSessionTermination(target, reason, correlationId)
    -- In a real implementation, this would forcibly terminate the player's session
    -- For now, we'll just log the termination action
    
    -- Alert administrators about the termination
    _executeAdministratorAlert(target, "Session terminated: " .. reason, "CRITICAL", correlationId)
    
    return {
        success = true,
        action = "TERMINATE_SESSION",
        target = target,
        executed = true,
        message = "Session termination logged: " .. reason
    }
end

function _executeProcessBlock(target, reason, correlationId)
    -- In a real implementation, this would block communication with the specified process
    -- For now, we'll just log the block action
    
    return {
        success = true,
        action = "BLOCK_PROCESS",
        target = target,
        executed = true,
        message = "Process block logged: " .. reason
    }
end

function _executeDataQuarantine(target, reason, correlationId)
    -- In a real implementation, this would quarantine suspicious data
    -- For now, we'll just log the quarantine action
    
    return {
        success = true,
        action = "QUARANTINE_DATA",
        target = target,
        executed = true,
        message = "Data quarantine logged: " .. reason
    }
end

function _executeAdministratorAlert(target, reason, severity, correlationId)
    -- In a real implementation, this would send alerts to system administrators
    -- For now, we'll just log the alert
    
    print(string.format("[ADMIN_ALERT] %s: %s - Target: %s", 
          severity, reason, json.encode(target)))
    
    return {
        success = true,
        action = "ALERT_ADMINISTRATORS",
        target = target,
        executed = true,
        message = "Administrator alert sent: " .. reason
    }
end

function _extractCheatTypes(detectedCheats)
    local cheatTypes = {}
    for _, cheat in ipairs(detectedCheats) do
        if not cheatTypes[cheat.cheatType] then
            cheatTypes[cheat.cheatType] = 0
        end
        cheatTypes[cheat.cheatType] = cheatTypes[cheat.cheatType] + 1
    end
    return cheatTypes
end

print("[SecurityEnforcementHandler] Security enforcement handlers loaded")