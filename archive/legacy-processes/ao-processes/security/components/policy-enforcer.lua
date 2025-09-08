-- Security Policy Enforcer
-- Enforces security policies across all process boundaries

local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local AuditLogger = require("security.components.audit-logger")

local PolicyEnforcer = {
    -- Policy storage
    securityPolicies = {},
    policyViolations = {},
    
    -- Enforcement metrics
    enforcementMetrics = {
        totalEnforcements = 0,
        policiesEvaluated = 0,
        violationsDetected = 0,
        actionsBlocked = 0,
        processesTerminated = 0
    },
    
    -- Configuration
    maxViolationHistory = 10000,
    defaultPolicyMode = "WARN" -- MONITOR, WARN, BLOCK, TERMINATE
}

-- Enforcement modes
PolicyEnforcer.ENFORCEMENT_MODES = {
    MONITOR = "MONITOR",     -- Log violations but allow action
    WARN = "WARN",           -- Log and warn but allow action
    BLOCK = "BLOCK",         -- Block action and log violation
    TERMINATE = "TERMINATE"  -- Terminate process/session and log
}

-- Policy scope types
PolicyEnforcer.SCOPE_TYPES = {
    GLOBAL = "*",
    PROCESS_TYPE = "process-type:",
    SPECIFIC_PROCESS = "process-id:"
}

-- Initialize policy enforcer
function PolicyEnforcer.initialize()
    PolicyEnforcer.securityPolicies = {}
    PolicyEnforcer.policyViolations = {}
    PolicyEnforcer.enforcementMetrics = {
        totalEnforcements = 0,
        policiesEvaluated = 0,
        violationsDetected = 0,
        actionsBlocked = 0,
        processesTerminated = 0
    }
    
    -- Load default security policies
    PolicyEnforcer._loadDefaultSecurityPolicies()
    
    print("[PolicyEnforcer] Policy enforcement system initialized with " .. 
          PolicyEnforcer._getTableSize(PolicyEnforcer.securityPolicies) .. " policies")
end

-- Load default security policies
function PolicyEnforcer._loadDefaultSecurityPolicies()
    -- Input validation policy
    PolicyEnforcer.addSecurityPolicy({
        policyId = "input-validation",
        policyName = "Input Validation Policy",
        enforcement = PolicyEnforcer.ENFORCEMENT_MODES.BLOCK,
        processScope = {PolicyEnforcer.SCOPE_TYPES.GLOBAL},
        rules = {
            {
                ruleId = "require-correlation-id",
                description = "All inter-process messages must include correlation ID",
                evaluationLogic = function(context)
                    if context.messageType == "INTER_PROCESS" then
                        if not context.correlation or not context.correlation.id then
                            return false, "Missing correlation ID in inter-process message"
                        end
                    end
                    return true, nil
                end
            },
            {
                ruleId = "validate-wallet-address",
                description = "Wallet addresses must be valid Arweave format",
                evaluationLogic = function(context)
                    if context.playerId then
                        if type(context.playerId) ~= "string" or #context.playerId ~= 43 then
                            return false, "Invalid wallet address format"
                        end
                        if not string.match(context.playerId, "^[A-Za-z0-9_%-]+$") then
                            return false, "Invalid wallet address characters"
                        end
                    end
                    return true, nil
                end
            }
        }
    })
    
    -- Process authentication policy
    PolicyEnforcer.addSecurityPolicy({
        policyId = "process-auth",
        policyName = "Inter-Process Authentication Policy",
        enforcement = PolicyEnforcer.ENFORCEMENT_MODES.BLOCK,
        processScope = {PolicyEnforcer.SCOPE_TYPES.GLOBAL},
        rules = {
            {
                ruleId = "require-process-token",
                description = "Inter-process communications must include valid authentication token",
                evaluationLogic = function(context)
                    if context.messageType == "INTER_PROCESS" and context.processAuth then
                        if not context.processAuth.authToken or not context.processAuth.sourceProcessId then
                            return false, "Missing process authentication credentials"
                        end
                        
                        -- Validate token with ProcessAuthenticator
                        local isValid, authContext, error = ProcessAuthenticator.validateAuthToken(
                            context.processAuth.authToken.tokenId,
                            context.processAuth.authToken.signature
                        )
                        
                        if not isValid then
                            return false, "Invalid process authentication token: " .. tostring(error)
                        end
                        
                        -- Verify process ID matches token
                        if authContext.processId ~= context.processAuth.sourceProcessId then
                            return false, "Process ID mismatch in authentication"
                        end
                    end
                    return true, nil
                end
            },
            {
                ruleId = "validate-process-capabilities",
                description = "Process must have required capabilities for operation",
                evaluationLogic = function(context)
                    if context.operation and context.processAuth then
                        local processInfo = ProcessAuthenticator.getProcessInfo(context.processAuth.sourceProcessId)
                        if processInfo then
                            -- Check if process has required capability
                            local hasCapability = false
                            for _, capability in ipairs(processInfo.capabilities or {}) do
                                if capability == "*" or capability == context.operation then
                                    hasCapability = true
                                    break
                                end
                            end
                            
                            if not hasCapability then
                                return false, "Process lacks required capability: " .. context.operation
                            end
                        end
                    end
                    return true, nil
                end
            }
        }
    })
    
    -- Data integrity policy
    PolicyEnforcer.addSecurityPolicy({
        policyId = "data-integrity",
        policyName = "Data Integrity Validation Policy",
        enforcement = PolicyEnforcer.ENFORCEMENT_MODES.WARN,
        processScope = {
            PolicyEnforcer.SCOPE_TYPES.PROCESS_TYPE .. "battle",
            PolicyEnforcer.SCOPE_TYPES.PROCESS_TYPE .. "pokemon"
        },
        rules = {
            {
                ruleId = "pokemon-stat-consistency",
                description = "Pokemon statistics must be mathematically consistent",
                evaluationLogic = function(context)
                    if context.pokemon then
                        local pokemon = context.pokemon
                        
                        -- HP consistency check
                        if pokemon.hp and pokemon.maxHp and pokemon.hp > pokemon.maxHp then
                            return false, "Pokemon HP exceeds maximum HP"
                        end
                        
                        -- Level-stat consistency (basic check)
                        if pokemon.level and pokemon.level > 100 then
                            return false, "Pokemon level exceeds maximum (100)"
                        end
                        
                        -- Negative stat check
                        local stats = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
                        for _, stat in ipairs(stats) do
                            if pokemon[stat] and pokemon[stat] < 0 then
                                return false, "Pokemon has negative " .. stat
                            end
                        end
                    end
                    return true, nil
                end
            },
            {
                ruleId = "battle-state-consistency",
                description = "Battle state must be logically consistent",
                evaluationLogic = function(context)
                    if context.battleState then
                        local battle = context.battleState
                        
                        -- Turn consistency
                        if battle.turn and battle.turn < 0 then
                            return false, "Negative battle turn number"
                        end
                        
                        -- Active Pokemon consistency
                        if battle.activePlayerPokemon and battle.activeEnemyPokemon then
                            if battle.activePlayerPokemon.hp and battle.activePlayerPokemon.hp <= 0 and
                               battle.battlePhase ~= "FAINTED" then
                                return false, "Active Pokemon has 0 HP but battle continues"
                            end
                        end
                    end
                    return true, nil
                end
            }
        }
    })
    
    -- Rate limiting policy
    PolicyEnforcer.addSecurityPolicy({
        policyId = "rate-limiting",
        policyName = "Action Rate Limiting Policy",
        enforcement = PolicyEnforcer.ENFORCEMENT_MODES.BLOCK,
        processScope = {PolicyEnforcer.SCOPE_TYPES.GLOBAL},
        rules = {
            {
                ruleId = "message-rate-limit",
                description = "Players cannot exceed maximum message rate",
                evaluationLogic = function(context)
                    if context.playerId and context.timestamp then
                        -- Simple rate limiting logic (would be more sophisticated in production)
                        local rateKey = "rate_" .. context.playerId
                        local lastMessageTime = PolicyEnforcer._getRateLimitData(rateKey)
                        
                        if lastMessageTime and (context.timestamp - lastMessageTime) < 100 then -- 100ms minimum
                            return false, "Message rate limit exceeded"
                        end
                        
                        PolicyEnforcer._setRateLimitData(rateKey, context.timestamp)
                    end
                    return true, nil
                end
            }
        }
    })
end

-- Rate limiting storage (simple in-memory implementation)
PolicyEnforcer._rateLimitData = {}

function PolicyEnforcer._getRateLimitData(key)
    return PolicyEnforcer._rateLimitData[key]
end

function PolicyEnforcer._setRateLimitData(key, value)
    PolicyEnforcer._rateLimitData[key] = value
end

-- Add security policy
function PolicyEnforcer.addSecurityPolicy(policy)
    if not policy.policyId or type(policy.policyId) ~= "string" then
        return false, "Policy ID required and must be a string"
    end
    
    if not policy.policyName or type(policy.policyName) ~= "string" then
        return false, "Policy name required and must be a string"
    end
    
    if not policy.rules or type(policy.rules) ~= "table" or #policy.rules == 0 then
        return false, "Policy must have at least one rule"
    end
    
    if not policy.enforcement or not PolicyEnforcer.ENFORCEMENT_MODES[policy.enforcement] then
        return false, "Valid enforcement mode required"
    end
    
    -- Validate rules
    for _, rule in ipairs(policy.rules) do
        if not rule.ruleId or not rule.evaluationLogic or type(rule.evaluationLogic) ~= "function" then
            return false, "Each rule must have ruleId and evaluationLogic function"
        end
    end
    
    PolicyEnforcer.securityPolicies[policy.policyId] = {
        policyId = policy.policyId,
        policyName = policy.policyName,
        enforcement = policy.enforcement,
        processScope = policy.processScope or {PolicyEnforcer.SCOPE_TYPES.GLOBAL},
        rules = policy.rules,
        enabled = policy.enabled ~= false,
        metadata = policy.metadata or {},
        createdAt = 0,
        lastModified = 0
    }
    
    return true, nil
end

-- Enforce policies for a given context
function PolicyEnforcer.enforcePolicies(context)
    local startTime = msg.Timestamp
    local violations = {}
    local actionsToBlock = {}
    local highestEnforcement = PolicyEnforcer.ENFORCEMENT_MODES.MONITOR
    
    PolicyEnforcer.enforcementMetrics.totalEnforcements = PolicyEnforcer.enforcementMetrics.totalEnforcements + 1
    
    -- Evaluate all applicable policies
    for policyId, policy in pairs(PolicyEnforcer.securityPolicies) do
        if policy.enabled and PolicyEnforcer._isPolicyApplicable(policy, context) then
            PolicyEnforcer.enforcementMetrics.policiesEvaluated = PolicyEnforcer.enforcementMetrics.policiesEvaluated + 1
            
            -- Evaluate each rule in the policy
            for _, rule in ipairs(policy.rules) do
                local success, ruleResult, violationMessage = pcall(rule.evaluationLogic, context)
                
                if success then
                    if not ruleResult then
                        -- Policy violation detected
                        local violation = {
                            policyId = policyId,
                            policyName = policy.policyName,
                            ruleId = rule.ruleId,
                            ruleDescription = rule.description,
                            enforcement = policy.enforcement,
                            violationMessage = violationMessage or "Policy rule violation",
                            timestamp = msg.Timestamp,
                            context = {
                                playerId = context.playerId,
                                processId = context.processId,
                                operation = context.operation,
                                messageType = context.messageType
                            }
                        }
                        
                        table.insert(violations, violation)
                        PolicyEnforcer.enforcementMetrics.violationsDetected = PolicyEnforcer.enforcementMetrics.violationsDetected + 1
                        
                        -- Track enforcement escalation
                        if PolicyEnforcer._getEnforcementLevel(policy.enforcement) > 
                           PolicyEnforcer._getEnforcementLevel(highestEnforcement) then
                            highestEnforcement = policy.enforcement
                        end
                        
                        -- Log policy violation
                        AuditLogger.logPolicyViolation(violation, context.correlationId)
                        
                        print(string.format("[PolicyEnforcer] Policy violation: %s - %s", 
                              policyId, violationMessage))
                    end
                else
                    print(string.format("[PolicyEnforcer] Error evaluating rule %s: %s", 
                          rule.ruleId, tostring(ruleResult)))
                end
            end
        end
    end
    
    -- Determine enforcement action
    local enforcementResult = {
        allowed = true,
        enforcement = highestEnforcement,
        violations = violations,
        actionMessage = nil
    }
    
    if #violations > 0 then
        -- Apply enforcement based on highest severity
        if highestEnforcement == PolicyEnforcer.ENFORCEMENT_MODES.BLOCK then
            enforcementResult.allowed = false
            enforcementResult.actionMessage = "Action blocked due to policy violations"
            PolicyEnforcer.enforcementMetrics.actionsBlocked = PolicyEnforcer.enforcementMetrics.actionsBlocked + 1
            
        elseif highestEnforcement == PolicyEnforcer.ENFORCEMENT_MODES.TERMINATE then
            enforcementResult.allowed = false
            enforcementResult.actionMessage = "Process terminated due to critical policy violations"
            PolicyEnforcer.enforcementMetrics.processesTerminated = PolicyEnforcer.enforcementMetrics.processesTerminated + 1
            
        elseif highestEnforcement == PolicyEnforcer.ENFORCEMENT_MODES.WARN then
            enforcementResult.actionMessage = "Action allowed with warnings due to policy violations"
            
        else -- MONITOR
            enforcementResult.actionMessage = "Action monitored, no enforcement applied"
        end
        
        -- Record policy violations for tracking
        PolicyEnforcer._recordPolicyViolations(violations, context)
    end
    
    local endTime = msg.Timestamp
    local enforcementTime = endTime - startTime
    
    return enforcementResult, enforcementTime
end

-- Check if policy applies to the given context
function PolicyEnforcer._isPolicyApplicable(policy, context)
    if not policy.processScope then
        return true
    end
    
    for _, scope in ipairs(policy.processScope) do
        if scope == PolicyEnforcer.SCOPE_TYPES.GLOBAL then
            return true
        elseif string.match(scope, "^process%-type:") then
            local processType = string.sub(scope, 14) -- Remove "process-type:" prefix
            if context.processType == processType then
                return true
            end
        elseif string.match(scope, "^process%-id:") then
            local processId = string.sub(scope, 12) -- Remove "process-id:" prefix
            if context.processId == processId then
                return true
            end
        elseif context.processId and string.match(context.processId, scope) then
            return true
        end
    end
    
    return false
end

-- Record policy violations for tracking
function PolicyEnforcer._recordPolicyViolations(violations, context)
    for _, violation in ipairs(violations) do
        local violationId = "id_" .. msg.Timestamp .. "_" .. (#PolicyEnforcer.policyViolations + 1)
        
        PolicyEnforcer.policyViolations[violationId] = {
            violationId = violationId,
            policyId = violation.policyId,
            ruleId = violation.ruleId,
            playerId = context.playerId,
            processId = context.processId,
            enforcement = violation.enforcement,
            violationMessage = violation.violationMessage,
            timestamp = violation.timestamp,
            context = violation.context,
            resolved = false
        }
    end
    
    -- Cleanup old violations if at limit
    PolicyEnforcer._cleanupOldViolations()
end

-- Cleanup old violation records
function PolicyEnforcer._cleanupOldViolations()
    local violationCount = PolicyEnforcer._getTableSize(PolicyEnforcer.policyViolations)
    
    if violationCount > PolicyEnforcer.maxViolationHistory then
        -- Convert to array and sort by timestamp
        local violationArray = {}
        for violationId, violation in pairs(PolicyEnforcer.policyViolations) do
            violation.violationId = violationId
            table.insert(violationArray, violation)
        end
        
        table.sort(violationArray, function(a, b) return a.timestamp < b.timestamp end)
        
        -- Remove oldest 20%
        local removeCount = math.floor(violationCount * 0.2)
        for i = 1, removeCount do
            PolicyEnforcer.policyViolations[violationArray[i].violationId] = nil
        end
    end
end

-- Get enforcement level as number for comparison
function PolicyEnforcer._getEnforcementLevel(enforcement)
    local levels = {
        [PolicyEnforcer.ENFORCEMENT_MODES.MONITOR] = 1,
        [PolicyEnforcer.ENFORCEMENT_MODES.WARN] = 2,
        [PolicyEnforcer.ENFORCEMENT_MODES.BLOCK] = 3,
        [PolicyEnforcer.ENFORCEMENT_MODES.TERMINATE] = 4
    }
    return levels[enforcement] or 1
end

-- Get policy enforcement statistics
function PolicyEnforcer.getStatistics()
    local policyStats = {}
    for policyId, policy in pairs(PolicyEnforcer.securityPolicies) do
        policyStats[policyId] = {
            policyName = policy.policyName,
            enforcement = policy.enforcement,
            enabled = policy.enabled,
            ruleCount = #policy.rules,
            processScope = policy.processScope
        }
    end
    
    return {
        totalEnforcements = PolicyEnforcer.enforcementMetrics.totalEnforcements,
        policiesEvaluated = PolicyEnforcer.enforcementMetrics.policiesEvaluated,
        violationsDetected = PolicyEnforcer.enforcementMetrics.violationsDetected,
        actionsBlocked = PolicyEnforcer.enforcementMetrics.actionsBlocked,
        processesTerminated = PolicyEnforcer.enforcementMetrics.processesTerminated,
        activePolicies = PolicyEnforcer._getTableSize(PolicyEnforcer.securityPolicies),
        trackedViolations = PolicyEnforcer._getTableSize(PolicyEnforcer.policyViolations),
        policies = policyStats
    }
end

-- Get policy violations for a player or process
function PolicyEnforcer.getPolicyViolations(playerId, processId, days)
    local violations = {}
    days = days or 7
    local cutoffTime = 0 - (days * 24 * 3600)
    
    for violationId, violation in pairs(PolicyEnforcer.policyViolations) do
        if violation.timestamp >= cutoffTime then
            local includeViolation = true
            
            if playerId and violation.playerId ~= playerId then
                includeViolation = false
            end
            
            if processId and violation.processId ~= processId then
                includeViolation = false
            end
            
            if includeViolation then
                table.insert(violations, violation)
            end
        end
    end
    
    -- Sort by timestamp (most recent first)
    table.sort(violations, function(a, b) return a.timestamp > b.timestamp end)
    
    return violations
end

-- Enable/disable security policy
function PolicyEnforcer.setPolicyEnabled(policyId, enabled)
    local policy = PolicyEnforcer.securityPolicies[policyId]
    if policy then
        policy.enabled = enabled
        policy.lastModified = 0
        return true
    end
    return false
end

-- Update policy enforcement mode
function PolicyEnforcer.updatePolicyEnforcement(policyId, enforcement)
    if not PolicyEnforcer.ENFORCEMENT_MODES[enforcement] then
        return false, "Invalid enforcement mode"
    end
    
    local policy = PolicyEnforcer.securityPolicies[policyId]
    if policy then
        policy.enforcement = enforcement
        policy.lastModified = 0
        return true
    end
    return false, "Policy not found"
end

-- Get health status
function PolicyEnforcer.getHealth()
    local stats = PolicyEnforcer.getStatistics()
    
    -- Check if enforcement system is functioning
    if stats.activePolicies == 0 then
        return "DEGRADED"
    end
    
    -- Check if violations are being tracked
    if stats.totalEnforcements > 100 and stats.violationsDetected == 0 then
        return "DEGRADED" -- Might indicate rules are too permissive
    end
    
    return "HEALTHY"
end

-- Helper function
function PolicyEnforcer._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return PolicyEnforcer