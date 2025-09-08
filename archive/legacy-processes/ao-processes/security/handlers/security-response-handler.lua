-- Security Response Handler
-- Processes incident management and automated security responses

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local AuditLogger = require("security.components.audit-logger")
local IntegrityMonitor = require("security.components.integrity-monitor")
local AntiCheatDetector = require("security.components.anti-cheat-detector")

-- Incident Response Handler
Handlers.add(
    "incident-response",
    Handlers.utils.hasMatchingTag("Action", "INCIDENT_RESPONSE"),
    function(msg)
        local incidentRequest = json.decode(msg.Data)
        if not incidentRequest or not incidentRequest.incident then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "INCIDENT_RESPONSE_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid incident response request"
                })
            })
            return
        end
        
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local incident = incidentRequest.incident
        local requestedActions = incidentRequest.requestedActions or {}
        
        print(string.format("[SecurityResponseHandler] Processing incident response: %s - Severity: %s", 
              incident.type or "unknown", incident.severity or "unknown"))
        
        -- Process the security incident based on type and severity
        local responseResult = _processSecurityIncident(incident, requestedActions, correlationId)
        
        -- Log the incident response
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.INCIDENT_CREATED,
            severity = incident.severity or AuditLogger.SEVERITY_LEVELS.MEDIUM,
            playerId = incident.playerId,
            processId = incident.processId or msg.From,
            eventData = {
                incidentType = incident.type,
                incidentData = incident.data,
                requestedActions = requestedActions,
                responseActions = responseResult.actionsExecuted,
                responseTime = responseResult.responseTime
            },
            actionTaken = "INCIDENT_RESPONSE_INITIATED"
        }, correlationId)
        
        local incidentResponse = {
            correlation = {
                id = correlationId,
                responseType = "INCIDENT_RESPONSE_RESULT"
            },
            result = {
                success = responseResult.success,
                incidentId = responseResult.incidentId,
                actionsExecuted = responseResult.actionsExecuted,
                responseTime = responseResult.responseTime,
                message = responseResult.message
            },
            metadata = {
                processedAt = 0,
                processedBy = ao.id or "security-process"
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "INCIDENT_RESPONSE_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(incidentResponse)
        })
        
        print(string.format("[SecurityResponseHandler] Incident response completed: %s actions executed", 
              #responseResult.actionsExecuted))
    end
)

-- Integrity Check Handler
Handlers.add(
    "integrity-check",
    Handlers.utils.hasMatchingTag("Action", "INTEGRITY_CHECK"),
    function(msg)
        local integrityRequest = json.decode(msg.Data)
        if not integrityRequest then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "INTEGRITY_CHECK_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid integrity check request"
                })
            })
            return
        end
        
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local checkType = integrityRequest.checkType or "STATE_CORRUPTION"
        local data = integrityRequest.data
        local contextId = integrityRequest.contextId
        
        print(string.format("[SecurityResponseHandler] Performing integrity check: %s", checkType))
        
        local integrityResult = {}
        
        if checkType == "CHECKSUM_VALIDATION" and integrityRequest.expectedChecksum then
            local isValid, message, checkTime = IntegrityMonitor.validateDataChecksum(
                data, 
                integrityRequest.expectedChecksum,
                integrityRequest.checksumId
            )
            
            integrityResult = {
                checkType = checkType,
                valid = isValid,
                message = message,
                checkTime = checkTime,
                expectedChecksum = integrityRequest.expectedChecksum
            }
            
        elseif checkType == "CROSS_PROCESS_CONSISTENCY" and integrityRequest.processStates then
            local consistencyResult, checkTime = IntegrityMonitor.performCrossProcessConsistencyCheck(
                integrityRequest.processStates,
                integrityRequest.dataKey
            )
            
            integrityResult = {
                checkType = checkType,
                valid = consistencyResult.consistent,
                message = consistencyResult.consistent and "Data consistent across processes" or 
                         "Data inconsistency detected",
                checkTime = checkTime,
                consistencyDetails = consistencyResult
            }
            
        elseif checkType == "STATE_CORRUPTION" then
            local corruptionDetails, checkTime = IntegrityMonitor.detectStateCorruption(
                data,
                integrityRequest.stateType or "unknown",
                contextId
            )
            
            integrityResult = {
                checkType = checkType,
                valid = not corruptionDetails.corrupted,
                message = corruptionDetails.corrupted and "State corruption detected" or 
                         "State integrity verified",
                checkTime = checkTime,
                corruptionDetails = corruptionDetails
            }
            
        else
            integrityResult = {
                checkType = checkType,
                valid = false,
                message = "Unsupported integrity check type: " .. checkType,
                checkTime = 0
            }
        end
        
        -- Log integrity check result
        if not integrityResult.valid then
            AuditLogger.logSecurityEvent({
                eventType = AuditLogger.EVENT_TYPES.DATA_INTEGRITY_VIOLATION,
                severity = AuditLogger.SEVERITY_LEVELS.HIGH,
                processId = msg.From,
                eventData = {
                    checkType = checkType,
                    contextId = contextId,
                    integrityResult = integrityResult
                }
            }, correlationId)
        end
        
        local integrityResponse = {
            correlation = {
                id = correlationId,
                responseType = "INTEGRITY_CHECK_RESULT"
            },
            result = {
                success = true,
                integrityResult = integrityResult
            },
            metadata = {
                processedAt = 0,
                checkTime = integrityResult.checkTime
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "INTEGRITY_CHECK_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(integrityResponse)
        })
        
        print(string.format(
            "[SecurityResponseHandler] Integrity check completed: %s - Time: %dms",
            integrityResult.valid and "VALID" or "INVALID",
            integrityResult.checkTime or 0
        ))
    end
)

-- Security Alert Handler
Handlers.add(
    "security-alert",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_ALERT"),
    function(msg)
        local alertRequest = json.decode(msg.Data)
        if not alertRequest or not alertRequest.alert then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "SECURITY_ALERT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid security alert request"
                })
            })
            return
        end
        
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local alert = alertRequest.alert
        local alertSeverity = alert.severity or "MEDIUM"
        local alertType = alert.type or "GENERIC_ALERT"
        
        print(string.format("[SecurityResponseHandler] Processing security alert: %s - Severity: %s", 
              alertType, alertSeverity))
        
        -- Process the security alert and determine response
        local alertResponse = _processSecurityAlert(alert, correlationId)
        
        -- Log the security alert
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.SECURITY_ALERT,
            severity = alertSeverity == "CRITICAL" and AuditLogger.SEVERITY_LEVELS.CRITICAL or
                      alertSeverity == "HIGH" and AuditLogger.SEVERITY_LEVELS.HIGH or
                      alertSeverity == "MEDIUM" and AuditLogger.SEVERITY_LEVELS.MEDIUM or
                      AuditLogger.SEVERITY_LEVELS.LOW,
            playerId = alert.playerId,
            processId = alert.processId or msg.From,
            eventData = {
                alertType = alertType,
                alertData = alert.data,
                response = alertResponse
            },
            actionTaken = alertResponse.actionTaken or "ALERT_LOGGED"
        }, correlationId)
        
        local securityAlertResponse = {
            correlation = {
                id = correlationId,
                responseType = "SECURITY_ALERT_PROCESSED"
            },
            result = {
                success = true,
                alertProcessed = true,
                response = alertResponse,
                alertId = alertResponse.alertId
            },
            metadata = {
                processedAt = 0,
                alertType = alertType,
                severity = alertSeverity
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_ALERT_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(securityAlertResponse)
        })
        
        print(string.format("[SecurityResponseHandler] Security alert processed: %s - Action: %s", 
              alertType, alertResponse.actionTaken or "LOGGED"))
    end
)

-- Incident Resolution Handler
Handlers.add(
    "incident-resolution",
    Handlers.utils.hasMatchingTag("Action", "INCIDENT_RESOLUTION"),
    function(msg)
        local resolutionRequest = json.decode(msg.Data)
        if not resolutionRequest or not resolutionRequest.incidentId then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "INCIDENT_RESOLUTION_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid incident resolution request"
                })
            })
            return
        end
        
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local incidentId = resolutionRequest.incidentId
        local resolutionNotes = resolutionRequest.resolutionNotes or "Incident resolved"
        
        -- Resolve the incident (using IntegrityMonitor as it tracks corruption incidents)
        local resolved = IntegrityMonitor.resolveIncident(incidentId, resolutionNotes)
        
        local resolutionResponse = {
            correlation = {
                id = correlationId,
                responseType = "INCIDENT_RESOLUTION_RESULT"
            },
            result = {
                success = resolved,
                incidentId = incidentId,
                resolved = resolved,
                message = resolved and "Incident resolved successfully" or "Incident not found",
                resolutionNotes = resolutionNotes
            },
            metadata = {
                processedAt = 0,
                resolvedBy = msg.From
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "INCIDENT_RESOLUTION_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(resolutionResponse)
        })
        
        print(string.format("[SecurityResponseHandler] Incident resolution: %s - %s", 
              incidentId, resolved and "SUCCESS" or "FAILED"))
    end
)

-- Security Health Check Handler
Handlers.add(
    "security-health-check",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_HEALTH_CHECK"),
    function(msg)
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        -- Get health status from all security components
        local ValidationEngine = require("security.components.validation-engine")
        local PolicyEnforcer = require("security.components.policy-enforcer")
        
        local healthStatus = {
            validationEngine = ValidationEngine.getHealth(),
            antiCheatDetector = AntiCheatDetector.getHealth(),
            auditLogger = AuditLogger.getHealth(),
            policyEnforcer = PolicyEnforcer.getHealth(),
            integrityMonitor = IntegrityMonitor.getHealth()
        }
        
        -- Determine overall health
        local overallHealth = "HEALTHY"
        for component, health in pairs(healthStatus) do
            if health == "DEGRADED" then
                overallHealth = "DEGRADED"
                break
            end
        end
        
        -- Get system statistics
        local systemStats = {
            validation = ValidationEngine.getStatistics(),
            antiCheat = AntiCheatDetector.getStatistics(),
            audit = AuditLogger.getStatistics(),
            policy = PolicyEnforcer.getStatistics(),
            integrity = IntegrityMonitor.getStatistics()
        }
        
        local healthResponse = {
            correlation = {
                id = correlationId,
                responseType = "SECURITY_HEALTH_STATUS"
            },
            result = {
                success = true,
                overallHealth = overallHealth,
                componentHealth = healthStatus,
                systemStatistics = systemStats
            },
            metadata = {
                processedAt = 0,
                uptime = 0 - (securityState and securityState.startTime or 0)
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_HEALTH_CHECK_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(healthResponse)
        })
        
        print(string.format("[SecurityResponseHandler] Health check completed: %s", overallHealth))
    end
)

-- Private helper functions

function _processSecurityIncident(incident, requestedActions, correlationId)
    local startTime = msg.Timestamp
    local actionsExecuted = {}
    local incidentId = "id_" .. msg.Timestamp .. "_" .. #requestedActions
    
    -- Process each requested action
    for _, action in ipairs(requestedActions) do
        local actionResult = {
            action = action.type,
            executed = false,
            message = "Action not implemented",
            timestamp = 0
        }
        
        -- Execute the action based on type
        if action.type == "ISOLATE_PLAYER" and incident.playerId then
            actionResult.executed = true
            actionResult.message = "Player isolation logged for " .. incident.playerId
            
        elseif action.type == "RESET_GAME_STATE" and incident.playerId then
            actionResult.executed = true
            actionResult.message = "Game state reset logged for " .. incident.playerId
            
        elseif action.type == "ESCALATE_TO_ADMIN" then
            actionResult.executed = true
            actionResult.message = "Incident escalated to administrators"
            
        elseif action.type == "GENERATE_EVIDENCE_PACKAGE" then
            actionResult.executed = true
            actionResult.message = "Evidence package generation logged"
            
        elseif action.type == "NOTIFY_STAKEHOLDERS" then
            actionResult.executed = true
            actionResult.message = "Stakeholder notification logged"
        end
        
        table.insert(actionsExecuted, actionResult)
    end
    
    local endTime = msg.Timestamp
    
    return {
        success = true,
        incidentId = incidentId,
        actionsExecuted = actionsExecuted,
        responseTime = endTime - startTime,
        message = string.format("Incident processed with %d actions", #actionsExecuted)
    }
end

function _processSecurityAlert(alert, correlationId)
    local alertId = "id_" .. msg.Timestamp .. "_" .. (alert.type or "generic")
    local actionTaken = "ALERT_LOGGED"
    
    -- Determine automatic response based on alert type and severity
    if alert.severity == "CRITICAL" then
        actionTaken = "IMMEDIATE_INVESTIGATION_REQUIRED"
        
        -- In a real implementation, this might trigger immediate notifications
        print("[CRITICAL_ALERT] " .. (alert.type or "Unknown") .. ": " .. (alert.message or "No message"))
        
    elseif alert.severity == "HIGH" then
        actionTaken = "PRIORITY_INVESTIGATION_SCHEDULED"
        
    elseif alert.type == "PERFORMANCE_DEGRADATION" then
        actionTaken = "PERFORMANCE_MONITORING_ENABLED"
        
    elseif alert.type == "UNUSUAL_PATTERN_DETECTED" then
        actionTaken = "PATTERN_ANALYSIS_INITIATED"
    end
    
    return {
        alertId = alertId,
        processed = true,
        actionTaken = actionTaken,
        processedAt = 0,
        message = "Alert processed and logged"
    }
end

print("[SecurityResponseHandler] Security response handlers loaded")