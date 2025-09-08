-- Security Audit Handler
-- Processes audit log requests and security event reporting

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local AuditLogger = require("security.components.audit-logger")
local AntiCheatDetector = require("security.components.anti-cheat-detector")

-- Audit Log Query Handler
Handlers.add(
    "audit-log-request",
    Handlers.utils.hasMatchingTag("Action", "AUDIT_LOG_REQUEST"),
    function(msg)
        local startTime = msg.Timestamp
        
        -- Parse audit query request
        local auditQuery = json.decode(msg.Data)
        if not auditQuery then
            local errorResponse = {
                correlation = {
                    id = msg.Tags.CorrelationId or "unknown",
                    responseType = "AUDIT_QUERY_ERROR"
                },
                result = {
                    success = false,
                    error = "Invalid audit query request format",
                    events = {}
                }
            }
            
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "AUDIT_LOG_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode(errorResponse)
            })
            return
        end
        
        local correlationId = (auditQuery.correlation and auditQuery.correlation.id) or 
                             msg.Tags.CorrelationId or
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
        
        print(string.format("[SecurityAuditHandler] Processing audit query from %s", msg.From))
        
        -- Extract query filters
        local filters = auditQuery.filters or {}
        local limit = auditQuery.limit or 100
        local offset = auditQuery.offset or 0
        
        -- Query audit events
        local events, totalMatched = AuditLogger.queryAuditEvents(filters, limit, offset)
        
        local endTime = msg.Timestamp
        local queryTime = endTime - startTime
        
        -- Prepare audit response
        local auditResponse = {
            correlation = {
                id = correlationId,
                responseType = "AUDIT_QUERY_RESULT"
            },
            result = {
                success = true,
                events = events,
                totalMatched = totalMatched,
                returned = #events,
                limit = limit,
                offset = offset
            },
            metadata = {
                queryTime = queryTime,
                processedAt = 0,
                requestedBy = msg.From
            }
        }
        
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        -- Send audit response
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "AUDIT_LOG_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(auditResponse)
        })
        
        -- Log audit access
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
            severity = AuditLogger.SEVERITY_LEVELS.LOW,
            processId = msg.From,
            eventData = {
                operation = "AUDIT_LOG_ACCESS",
                eventsReturned = #events,
                totalMatched = totalMatched,
                filters = filters,
                queryTime = queryTime
            }
        }, correlationId)
        
        print(string.format(
            "[SecurityAuditHandler] Audit query completed: %d/%d events returned - Time: %dms",
            #events, totalMatched, queryTime
        ))
    end
)

-- Security Event Correlation Handler
Handlers.add(
    "security-event-correlation",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_EVENT_CORRELATION"),
    function(msg)
        local correlationQuery = json.decode(msg.Data)
        if not correlationQuery or not correlationQuery.correlationId then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "SECURITY_EVENT_CORRELATION_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Missing correlation ID for event correlation query"
                })
            })
            return
        end
        
        local requestCorrelationId = msg.Tags.CorrelationId or 
                                    MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        -- Get correlated events
        local correlatedEvents = AuditLogger.getEventsByCorrelation(correlationQuery.correlationId)
        
        -- Get correlation chain from MessageCorrelator
        local correlationChain = MessageCorrelator.getCorrelationChain(correlationQuery.correlationId)
        
        local correlationResponse = {
            correlation = {
                id = requestCorrelationId,
                responseType = "EVENT_CORRELATION_RESULT"
            },
            result = {
                success = true,
                targetCorrelationId = correlationQuery.correlationId,
                correlatedEvents = correlatedEvents,
                correlationChain = correlationChain,
                eventCount = #correlatedEvents
            },
            metadata = {
                processedAt = 0,
                requestedBy = msg.From
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_EVENT_CORRELATION_RESPONSE",
                CorrelationId = requestCorrelationId
            },
            Data = json.encode(correlationResponse)
        })
        
        print(string.format(
            "[SecurityAuditHandler] Event correlation query completed: %d events found for correlation %s",
            #correlatedEvents, correlationQuery.correlationId
        ))
    end
)

-- Player Security History Handler
Handlers.add(
    "player-security-history",
    Handlers.utils.hasMatchingTag("Action", "PLAYER_SECURITY_HISTORY"),
    function(msg)
        local historyQuery = json.decode(msg.Data)
        if not historyQuery or not historyQuery.playerId then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "PLAYER_SECURITY_HISTORY_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Missing player ID for security history query"
                })
            })
            return
        end
        
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local playerId = historyQuery.playerId
        local days = historyQuery.days or 30 -- Default to last 30 days
        local eventTypes = historyQuery.eventTypes -- Optional filter
        
        -- Get player security events
        local securityEvents = AuditLogger.getPlayerSecurityEvents(playerId, eventTypes, days)
        
        -- Get player behavior analysis from AntiCheatDetector
        local behaviorAnalysis, behaviorError = AntiCheatDetector.getPlayerBehaviorAnalysis(playerId)
        
        -- Get policy violations for this player
        local PolicyEnforcer = require("security.components.policy-enforcer")
        local policyViolations = PolicyEnforcer.getPolicyViolations(playerId, nil, days)
        
        local historyResponse = {
            correlation = {
                id = correlationId,
                responseType = "PLAYER_SECURITY_HISTORY_RESULT"
            },
            result = {
                success = true,
                playerId = playerId,
                securityEvents = securityEvents,
                behaviorAnalysis = behaviorAnalysis,
                policyViolations = policyViolations,
                summary = {
                    totalSecurityEvents = #securityEvents,
                    totalPolicyViolations = #policyViolations,
                    daysCovered = days,
                    riskLevel = behaviorAnalysis and behaviorAnalysis.riskLevel or "UNKNOWN"
                }
            },
            metadata = {
                processedAt = 0,
                requestedBy = msg.From
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "PLAYER_SECURITY_HISTORY_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(historyResponse)
        })
        
        -- Log security history access
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
            severity = AuditLogger.SEVERITY_LEVELS.LOW,
            processId = msg.From,
            playerId = playerId,
            eventData = {
                operation = "PLAYER_SECURITY_HISTORY_ACCESS",
                daysCovered = days,
                eventsReturned = #securityEvents,
                violationsReturned = #policyViolations,
                riskLevel = behaviorAnalysis and behaviorAnalysis.riskLevel or "UNKNOWN"
            }
        }, correlationId)
        
        print(string.format(
            "[SecurityAuditHandler] Player security history completed for %s: %d events, %d violations",
            playerId, #securityEvents, #policyViolations
        ))
    end
)

-- Security Statistics Handler
Handlers.add(
    "security-statistics",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_STATISTICS"),
    function(msg)
        local statsQuery = json.decode(msg.Data)
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        -- Collect statistics from all security components
        local auditStats = AuditLogger.getStatistics()
        local ValidationEngine = require("security.components.validation-engine")
        local validationStats = ValidationEngine.getStatistics()
        local cheatDetectionStats = AntiCheatDetector.getStatistics()
        local PolicyEnforcer = require("security.components.policy-enforcer")
        local policyStats = PolicyEnforcer.getStatistics()
        local IntegrityMonitor = require("security.components.integrity-monitor")
        local integrityStats = IntegrityMonitor.getStatistics()
        
        -- Calculate aggregate statistics
        local aggregateStats = {
            totalSecurityChecks = validationStats.totalValidations + cheatDetectionStats.totalChecks + integrityStats.totalChecks,
            totalSecurityEvents = auditStats.totalEvents,
            totalThreatDetections = cheatDetectionStats.cheatsDetected + integrityStats.dataCorruptions,
            systemHealth = {
                validation = ValidationEngine.getHealth(),
                cheatDetection = AntiCheatDetector.getHealth(),
                audit = AuditLogger.getHealth(),
                policy = PolicyEnforcer.getHealth(),
                integrity = IntegrityMonitor.getHealth()
            }
        }
        
        local statisticsResponse = {
            correlation = {
                id = correlationId,
                responseType = "SECURITY_STATISTICS_RESULT"
            },
            result = {
                success = true,
                statistics = {
                    audit = auditStats,
                    validation = validationStats,
                    cheatDetection = cheatDetectionStats,
                    policy = policyStats,
                    integrity = integrityStats,
                    aggregate = aggregateStats
                }
            },
            metadata = {
                processedAt = 0,
                requestedBy = msg.From
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_STATISTICS_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(statisticsResponse)
        })
        
        print("[SecurityAuditHandler] Security statistics query completed")
    end
)

-- Audit Export Handler (for compliance and external analysis)
Handlers.add(
    "audit-export",
    Handlers.utils.hasMatchingTag("Action", "AUDIT_EXPORT"),
    function(msg)
        local exportQuery = json.decode(msg.Data)
        if not exportQuery then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "AUDIT_EXPORT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid audit export request format"
                })
            })
            return
        end
        
        local correlationId = msg.Tags.CorrelationId or 
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local startDate = exportQuery.startDate
        local endDate = exportQuery.endDate
        local eventTypes = exportQuery.eventTypes
        
        -- Export audit events
        local exportedEvents = AuditLogger.exportAuditEvents(startDate, endDate, eventTypes)
        
        local exportResponse = {
            correlation = {
                id = correlationId,
                responseType = "AUDIT_EXPORT_RESULT"
            },
            result = {
                success = true,
                exportedEvents = exportedEvents,
                eventCount = #exportedEvents,
                exportCriteria = {
                    startDate = startDate,
                    endDate = endDate,
                    eventTypes = eventTypes
                }
            },
            metadata = {
                exportedAt = 0,
                requestedBy = msg.From
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "AUDIT_EXPORT_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(exportResponse)
        })
        
        -- Log export activity
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
            severity = AuditLogger.SEVERITY_LEVELS.MEDIUM,
            processId = msg.From,
            eventData = {
                operation = "AUDIT_EXPORT",
                eventCount = #exportedEvents,
                startDate = startDate,
                endDate = endDate,
                eventTypes = eventTypes
            }
        }, correlationId)
        
        print(string.format(
            "[SecurityAuditHandler] Audit export completed: %d events exported",
            #exportedEvents
        ))
    end
)

-- Security Event Report Handler (for incoming security events from other processes)
Handlers.add(
    "security-event-report",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_EVENT_REPORT"),
    function(msg)
        local eventReport = json.decode(msg.Data)
        if not eventReport or not eventReport.securityEvent then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "SECURITY_EVENT_REPORT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid security event report format"
                })
            })
            return
        end
        
        local correlationId = (eventReport.correlation and eventReport.correlation.id) or 
                             msg.Tags.CorrelationId or
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        local securityEvent = eventReport.securityEvent
        
        -- Validate and enrich the security event
        securityEvent.processId = securityEvent.processId or msg.From
        securityEvent.reportedBy = msg.From
        securityEvent.reportedAt = 0
        
        -- Log the reported security event
        local auditEventId = AuditLogger.logSecurityEvent({
            eventType = securityEvent.eventType or AuditLogger.EVENT_TYPES.SECURITY_ALERT,
            severity = securityEvent.severity or AuditLogger.SEVERITY_LEVELS.MEDIUM,
            playerId = securityEvent.playerId,
            processId = securityEvent.processId,
            eventData = securityEvent.eventData,
            actionTaken = securityEvent.actionTaken
        }, correlationId)
        
        local reportResponse = {
            correlation = {
                id = correlationId,
                responseType = "SECURITY_EVENT_REPORT_ACKNOWLEDGMENT"
            },
            result = {
                success = true,
                auditEventId = auditEventId,
                message = "Security event logged successfully"
            },
            metadata = {
                processedAt = 0,
                reportedBy = msg.From
            }
        }
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_EVENT_REPORT_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(reportResponse)
        })
        
        print(string.format(
            "[SecurityAuditHandler] Security event report logged: %s from %s - Event ID: %s",
            securityEvent.eventType or "UNKNOWN",
            msg.From,
            auditEventId
        ))
    end
)

print("[SecurityAuditHandler] Security audit handlers loaded")