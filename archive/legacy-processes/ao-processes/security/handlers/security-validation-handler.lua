-- Security Validation Handler
-- Processes real-time security validation requests from all processes

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ValidationEngine = require("security.components.validation-engine")
local PolicyEnforcer = require("security.components.policy-enforcer")
local AuditLogger = require("security.components.audit-logger")

-- Security Validation Request Handler
Handlers.add(
    "security-validation",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_VALIDATION"),
    function(msg)
        local startTime = msg.Timestamp
        
        -- Parse validation request
        local validationRequest = json.decode(msg.Data)
        if not validationRequest then
            local errorResponse = {
                correlation = {
                    id = msg.Tags.CorrelationId or "unknown",
                    responseType = "VALIDATION_ERROR"
                },
                result = {
                    success = false,
                    error = "Invalid validation request format",
                    valid = false,
                    securityAction = "BLOCK"
                }
            }
            
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "SECURITY_VALIDATION_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode(errorResponse)
            })
            return
        end
        
        local correlationId = (validationRequest.correlation and validationRequest.correlation.id) or 
                             msg.Tags.CorrelationId or
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        -- Update correlation status
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
        
        print(string.format("[SecurityValidationHandler] Processing validation request from %s - Type: %s", 
              msg.From, validationRequest.validationData and validationRequest.validationData.validationType or "unknown"))
        
        -- Validate request format
        if not validationRequest.validationData or 
           not validationRequest.validationData.validationType or
           not ValidationEngine.VALIDATION_TYPES[validationRequest.validationData.validationType] then
            
            local errorResponse = {
                correlation = {
                    id = correlationId,
                    responseType = "VALIDATION_ERROR"
                },
                result = {
                    success = false,
                    error = "Invalid validation type or missing validation data",
                    valid = false,
                    securityAction = "BLOCK"
                }
            }
            
            MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.FAILED, 
                                                      "Invalid validation request")
            
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "SECURITY_VALIDATION_RESPONSE",
                    CorrelationId = correlationId
                },
                Data = json.encode(errorResponse)
            })
            return
        end
        
        local validationData = validationRequest.validationData
        local processAuth = validationRequest.processAuth
        
        -- Authenticate requesting process if auth data provided
        local authContext = nil
        if processAuth and processAuth.authToken then
            local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
            local isValidAuth, authResult, authError = ProcessAuthenticator.validateAuthToken(
                processAuth.authToken.tokenId, 
                processAuth.authToken.signature
            )
            
            if isValidAuth then
                authContext = authResult
            else
                print("[SecurityValidationHandler] Process authentication failed: " .. tostring(authError))
            end
        end
        
        -- Perform validation using ValidationEngine
        local isValid, violations, securityAction, validationSource = ValidationEngine.validate(
            validationData.validationType,
            validationData.data,
            validationData.processId or msg.From
        )
        
        -- Enforce security policies
        local policyContext = {
            validationType = validationData.validationType,
            playerId = validationData.playerId,
            processId = validationData.processId or msg.From,
            operation = validationData.operation,
            messageType = "SECURITY_VALIDATION",
            correlationId = correlationId,
            authContext = authContext,
            data = validationData.data
        }
        
        local policyResult, policyTime = PolicyEnforcer.enforcePolicies(policyContext)
        
        -- Combine validation and policy results
        local finalSecurityAction = securityAction
        if not policyResult.allowed then
            finalSecurityAction = policyResult.enforcement == "TERMINATE" and "TERMINATE" or "BLOCK"
            isValid = false
            
            -- Add policy violations to validation violations
            if policyResult.violations then
                for _, policyViolation in ipairs(policyResult.violations) do
                    table.insert(violations, {
                        ruleId = "policy-" .. policyViolation.policyId,
                        severity = "HIGH",
                        errorMessage = policyViolation.violationMessage,
                        timestamp = msg.Timestamp,
                        type = "POLICY_VIOLATION"
                    })
                end
            end
        end
        
        local endTime = msg.Timestamp
        local totalValidationTime = endTime - startTime
        
        -- Create validation result
        local validationResult = {
            valid = isValid,
            validationType = validationData.validationType,
            violations = violations,
            securityAction = finalSecurityAction,
            playerId = validationData.playerId,
            processId = validationData.processId or msg.From,
            validationLatency = totalValidationTime,
            policyLatency = policyTime,
            rulesEvaluated = #violations,
            cacheHit = validationSource == "CACHED",
            auditEventId = nil -- Will be set by audit logging
        }
        
        -- Log validation result to audit system
        local auditEventId = AuditLogger.logValidationResult(validationResult, correlationId)
        validationResult.auditEventId = auditEventId
        
        -- Prepare response
        local validationResponse = {
            correlation = {
                id = correlationId,
                responseType = "VALIDATION_RESULT"
            },
            result = {
                success = true,
                valid = validationResult.valid,
                validationType = validationResult.validationType,
                violations = validationResult.violations,
                securityAction = validationResult.securityAction,
                auditEventId = validationResult.auditEventId
            },
            metadata = {
                validationLatency = validationResult.validationLatency,
                policyLatency = validationResult.policyLatency,
                rulesEvaluated = validationResult.rulesEvaluated,
                cacheHit = validationResult.cacheHit,
                processedAt = 0
            }
        }
        
        -- Update correlation status
        MessageCorrelator.updateCorrelationStatus(
            correlationId, 
            MessageCorrelator.MESSAGE_STATUS.COMPLETED
        )
        
        -- Send validation response
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_VALIDATION_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(validationResponse)
        })
        
        print(string.format(
            "[SecurityValidationHandler] Validation completed: %s (%s) - Action: %s - Time: %dms",
            isValid and "VALID" or "INVALID",
            validationData.validationType,
            finalSecurityAction,
            totalValidationTime
        ))
    end
)

-- Batch Validation Handler (for multiple validations in one request)
Handlers.add(
    "security-batch-validation",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_BATCH_VALIDATION"),
    function(msg)
        local startTime = msg.Timestamp
        
        -- Parse batch validation request
        local batchRequest = json.decode(msg.Data)
        if not batchRequest or not batchRequest.validations or type(batchRequest.validations) ~= "table" then
            local errorResponse = {
                correlation = {
                    id = msg.Tags.CorrelationId or "unknown",
                    responseType = "BATCH_VALIDATION_ERROR"
                },
                result = {
                    success = false,
                    error = "Invalid batch validation request format",
                    validationResults = {}
                }
            }
            
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "SECURITY_BATCH_VALIDATION_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode(errorResponse)
            })
            return
        end
        
        local correlationId = (batchRequest.correlation and batchRequest.correlation.id) or 
                             msg.Tags.CorrelationId or
                             MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
        
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
        
        print(string.format("[SecurityValidationHandler] Processing batch validation: %d validations from %s", 
              #batchRequest.validations, msg.From))
        
        local validationResults = {}
        local allValid = true
        local totalViolations = 0
        
        -- Process each validation in the batch
        for i, validationData in ipairs(batchRequest.validations) do
            if ValidationEngine.VALIDATION_TYPES[validationData.validationType] then
                local isValid, violations, securityAction = ValidationEngine.validate(
                    validationData.validationType,
                    validationData.data,
                    validationData.processId or msg.From
                )
                
                local validationResult = {
                    index = i,
                    valid = isValid,
                    validationType = validationData.validationType,
                    violations = violations,
                    securityAction = securityAction,
                    playerId = validationData.playerId,
                    processId = validationData.processId or msg.From
                }
                
                table.insert(validationResults, validationResult)
                
                if not isValid then
                    allValid = false
                    totalViolations = totalViolations + #violations
                end
                
                -- Log individual validation result
                AuditLogger.logValidationResult(validationResult, correlationId .. "_" .. i)
                
            else
                -- Invalid validation type
                table.insert(validationResults, {
                    index = i,
                    valid = false,
                    validationType = validationData.validationType,
                    violations = {{
                        ruleId = "invalid-validation-type",
                        severity = "HIGH",
                        errorMessage = "Invalid validation type: " .. tostring(validationData.validationType),
                        timestamp = 0
                    }},
                    securityAction = "BLOCK",
                    playerId = validationData.playerId,
                    processId = validationData.processId or msg.From
                })
                allValid = false
                totalViolations = totalViolations + 1
            end
        end
        
        local endTime = msg.Timestamp
        local totalProcessingTime = endTime - startTime
        
        -- Prepare batch response
        local batchResponse = {
            correlation = {
                id = correlationId,
                responseType = "BATCH_VALIDATION_RESULT"
            },
            result = {
                success = true,
                allValid = allValid,
                validationResults = validationResults,
                summary = {
                    totalValidations = #batchRequest.validations,
                    validValidations = #batchRequest.validations - (#validationResults - (#batchRequest.validations - totalViolations)),
                    totalViolations = totalViolations
                }
            },
            metadata = {
                processingTime = totalProcessingTime,
                averageValidationTime = totalProcessingTime / #batchRequest.validations,
                processedAt = 0
            }
        }
        
        MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
        
        -- Send batch response
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_BATCH_VALIDATION_RESPONSE",
                CorrelationId = correlationId
            },
            Data = json.encode(batchResponse)
        })
        
        print(string.format(
            "[SecurityValidationHandler] Batch validation completed: %d/%d valid - Time: %dms",
            #batchRequest.validations - totalViolations,
            #batchRequest.validations,
            totalProcessingTime
        ))
    end
)

-- Validation Rule Management Handler
Handlers.add(
    "security-validation-rule-management",
    Handlers.utils.hasMatchingTag("Action", "SECURITY_VALIDATION_RULE_MANAGEMENT"),
    function(msg)
        local request = json.decode(msg.Data)
        if not request or not request.operation then
            ao.send({
                Target = msg.From,
                Tags = { 
                    Action = "SECURITY_VALIDATION_RULE_MANAGEMENT_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "unknown"
                },
                Data = json.encode({
                    success = false,
                    error = "Invalid rule management request"
                })
            })
            return
        end
        
        local result = { success = false, error = "Unknown operation" }
        
        if request.operation == "ADD_RULE" and request.rule then
            local success, error = ValidationEngine.addValidationRule(request.rule)
            result.success = success
            result.error = error
            
        elseif request.operation == "REMOVE_RULE" and request.ruleId then
            result.success = ValidationEngine.removeValidationRule(request.ruleId)
            result.error = not result.success and "Rule not found" or nil
            
        elseif request.operation == "ENABLE_RULE" and request.ruleId then
            result.success = ValidationEngine.setRuleEnabled(request.ruleId, true)
            result.error = not result.success and "Rule not found" or nil
            
        elseif request.operation == "DISABLE_RULE" and request.ruleId then
            result.success = ValidationEngine.setRuleEnabled(request.ruleId, false)
            result.error = not result.success and "Rule not found" or nil
            
        elseif request.operation == "LIST_RULES" then
            result.success = true
            result.rules = ValidationEngine.getValidationRules(request.ruleType, request.processId)
            
        elseif request.operation == "GET_STATISTICS" then
            result.success = true
            result.statistics = ValidationEngine.getStatistics()
        end
        
        -- Log rule management activity
        AuditLogger.logSecurityEvent({
            eventType = AuditLogger.EVENT_TYPES.SYSTEM_EVENT,
            severity = AuditLogger.SEVERITY_LEVELS.LOW,
            processId = msg.From,
            eventData = {
                operation = request.operation,
                ruleId = request.ruleId,
                success = result.success,
                error = result.error
            }
        })
        
        ao.send({
            Target = msg.From,
            Tags = { 
                Action = "SECURITY_VALIDATION_RULE_MANAGEMENT_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "unknown"
            },
            Data = json.encode(result)
        })
    end
)

print("[SecurityValidationHandler] Security validation handlers loaded")