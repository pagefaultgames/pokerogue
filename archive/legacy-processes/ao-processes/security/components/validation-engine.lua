-- Security Validation Engine
-- Real-time validation system with custom Lua schemas

local CryptoRNG = require("game-logic.rng.crypto-rng")

local ValidationEngine = {
    -- Validation state
    validationRules = {},
    validationCache = {},
    validationMetrics = {
        totalValidations = 0,
        validationTime = 0,
        cacheHits = 0,
        validationFailures = 0
    },
    
    -- Configuration
    cacheTimeout = 300, -- 5 minutes
    maxCacheSize = 1000,
    maxValidationTime = 50 -- 50ms max for performance
}

-- Validation rule types
ValidationEngine.VALIDATION_TYPES = {
    INPUT = "INPUT",
    STATE = "STATE", 
    BEHAVIOR = "BEHAVIOR",
    INTEGRITY = "INTEGRITY"
}

-- Validation result actions
ValidationEngine.VALIDATION_ACTIONS = {
    ALLOW = "ALLOW",
    WARN = "WARN",
    BLOCK = "BLOCK",
    TERMINATE = "TERMINATE"
}

-- Initialize validation engine
function ValidationEngine.initialize()
    ValidationEngine.validationRules = {}
    ValidationEngine.validationCache = {}
    ValidationEngine.validationMetrics = {
        totalValidations = 0,
        validationTime = 0,
        cacheHits = 0,
        validationFailures = 0
    }
    
    -- Load default validation rules
    ValidationEngine._loadDefaultValidationRules()
    
    print("[ValidationEngine] Validation engine initialized with " .. 
          ValidationEngine._getTableSize(ValidationEngine.validationRules) .. " rules")
end

-- Load default validation rules
function ValidationEngine._loadDefaultValidationRules()
    -- Input validation rules
    ValidationEngine.addValidationRule({
        ruleId = "validate-message-format",
        ruleType = ValidationEngine.VALIDATION_TYPES.INPUT,
        processScope = {"*"},
        severity = "HIGH",
        enabled = true,
        validationLogic = function(data)
            if not data or type(data) ~= "table" then
                return false, "Data must be a table"
            end
            
            -- Check for required correlation metadata
            if not data.correlation or type(data.correlation) ~= "table" then
                return false, "Correlation metadata required"
            end
            
            if not data.correlation.id or type(data.correlation.id) ~= "string" then
                return false, "Correlation ID required"
            end
            
            return true, nil
        end
    })
    
    ValidationEngine.addValidationRule({
        ruleId = "validate-wallet-address",
        ruleType = ValidationEngine.VALIDATION_TYPES.INPUT,
        processScope = {"*"},
        severity = "HIGH",
        enabled = true,
        validationLogic = function(data)
            if data.playerId and type(data.playerId) == "string" then
                -- Basic Arweave wallet address validation (43 chars, Base64URL)
                if #data.playerId ~= 43 then
                    return false, "Invalid wallet address length"
                end
                
                if not string.match(data.playerId, "^[A-Za-z0-9_%-]+$") then
                    return false, "Invalid wallet address format"
                end
            end
            
            return true, nil
        end
    })
    
    ValidationEngine.addValidationRule({
        ruleId = "validate-data-types",
        ruleType = ValidationEngine.VALIDATION_TYPES.INPUT,
        processScope = {"*"},
        severity = "MEDIUM",
        enabled = true,
        validationLogic = function(data)
            -- Validate common data types
            if data.timestamp and type(data.timestamp) ~= "number" then
                return false, "Timestamp must be a number"
            end
            
            if data.processId and type(data.processId) ~= "string" then
                return false, "Process ID must be a string"
            end
            
            if data.operation and type(data.operation) ~= "string" then
                return false, "Operation must be a string"
            end
            
            return true, nil
        end
    })
    
    -- State validation rules
    ValidationEngine.addValidationRule({
        ruleId = "validate-pokemon-stats",
        ruleType = ValidationEngine.VALIDATION_TYPES.STATE,
        processScope = {"battle", "pokemon"},
        severity = "HIGH", 
        enabled = true,
        validationLogic = function(data)
            if data.pokemon then
                local pokemon = data.pokemon
                
                -- Check stat ranges (assuming max level 100)
                if pokemon.level and (pokemon.level < 1 or pokemon.level > 100) then
                    return false, "Invalid Pokemon level range"
                end
                
                -- Check HP range (basic validation)
                if pokemon.hp and pokemon.maxHp and pokemon.hp > pokemon.maxHp then
                    return false, "Pokemon HP exceeds max HP"
                end
                
                -- Check if stats are numbers
                local statNames = {"hp", "maxHp", "attack", "defense", "spAttack", "spDefense", "speed"}
                for _, statName in ipairs(statNames) do
                    if pokemon[statName] and type(pokemon[statName]) ~= "number" then
                        return false, "Pokemon " .. statName .. " must be a number"
                    end
                end
            end
            
            return true, nil
        end
    })
    
    -- Behavior validation rules
    ValidationEngine.addValidationRule({
        ruleId = "validate-action-frequency",
        ruleType = ValidationEngine.VALIDATION_TYPES.BEHAVIOR,
        processScope = {"battle"},
        severity = "MEDIUM",
        enabled = true,
        validationLogic = function(data)
            -- Check for rapid-fire actions (basic rate limiting)
            if data.playerId and data.timestamp then
                local cacheKey = "last_action_" .. data.playerId
                local lastActionTime = ValidationEngine.validationCache[cacheKey]
                
                if lastActionTime and (data.timestamp - lastActionTime) < 100 then -- 100ms minimum
                    return false, "Actions too frequent"
                end
                
                ValidationEngine.validationCache[cacheKey] = data.timestamp
            end
            
            return true, nil
        end
    })
end

-- Add validation rule
function ValidationEngine.addValidationRule(rule)
    if not rule.ruleId or type(rule.ruleId) ~= "string" then
        return false, "Rule ID required and must be a string"
    end
    
    if not rule.validationLogic or type(rule.validationLogic) ~= "function" then
        return false, "Validation logic function required"
    end
    
    if not rule.ruleType or not ValidationEngine.VALIDATION_TYPES[rule.ruleType] then
        return false, "Valid rule type required"
    end
    
    ValidationEngine.validationRules[rule.ruleId] = {
        ruleId = rule.ruleId,
        ruleType = rule.ruleType,
        processScope = rule.processScope or {"*"},
        validationLogic = rule.validationLogic,
        severity = rule.severity or "MEDIUM",
        enabled = rule.enabled ~= false,
        metadata = rule.metadata or {},
        createdAt = 0
    }
    
    return true, nil
end

-- Remove validation rule
function ValidationEngine.removeValidationRule(ruleId)
    if ValidationEngine.validationRules[ruleId] then
        ValidationEngine.validationRules[ruleId] = nil
        return true
    end
    return false
end

-- Enable/disable validation rule
function ValidationEngine.setRuleEnabled(ruleId, enabled)
    local rule = ValidationEngine.validationRules[ruleId]
    if rule then
        rule.enabled = enabled
        return true
    end
    return false
end

-- Perform validation with performance monitoring
function ValidationEngine.validate(validationType, data, processId)
    local startTime = msg.Timestamp -- milliseconds
    local violations = {}
    local applicableRules = 0
    
    -- Check cache first for identical validations
    local cacheKey = ValidationEngine._generateCacheKey(validationType, data, processId)
    local cachedResult = ValidationEngine._getCachedValidation(cacheKey)
    
    if cachedResult then
        ValidationEngine.validationMetrics.cacheHits = ValidationEngine.validationMetrics.cacheHits + 1
        return cachedResult.valid, cachedResult.violations, cachedResult.action, "CACHED"
    end
    
    -- Find applicable rules for this validation
    for ruleId, rule in pairs(ValidationEngine.validationRules) do
        if rule.enabled and 
           rule.ruleType == validationType and
           ValidationEngine._isRuleApplicable(rule, processId) then
            
            applicableRules = applicableRules + 1
            
            -- Execute validation logic
            local isValid, errorMessage = pcall(rule.validationLogic, data)
            
            if not isValid or errorMessage then
                table.insert(violations, {
                    ruleId = ruleId,
                    severity = rule.severity,
                    errorMessage = errorMessage or "Validation rule failed",
                    timestamp = 0
                })
                
                ValidationEngine.validationMetrics.validationFailures = 
                    ValidationEngine.validationMetrics.validationFailures + 1
            end
        end
    end
    
    -- Determine overall validation result and action
    local isValid = #violations == 0
    local action = ValidationEngine._determineValidationAction(violations)
    
    -- Calculate validation time
    local endTime = msg.Timestamp
    local validationTime = endTime - startTime
    
    -- Update metrics
    ValidationEngine.validationMetrics.totalValidations = ValidationEngine.validationMetrics.totalValidations + 1
    ValidationEngine.validationMetrics.validationTime = ValidationEngine.validationMetrics.validationTime + validationTime
    
    -- Cache result if validation was successful and not too complex
    if isValid and applicableRules <= 10 then
        ValidationEngine._cacheValidationResult(cacheKey, {
            valid = isValid,
            violations = violations,
            action = action,
            cachedAt = 0
        })
    end
    
    -- Performance warning if validation took too long
    if validationTime > ValidationEngine.maxValidationTime then
        print(string.format("[ValidationEngine] PERFORMANCE WARNING: Validation took %dms (max: %dms)", 
              validationTime, ValidationEngine.maxValidationTime))
    end
    
    return isValid, violations, action, "VALIDATED"
end

-- Determine validation action based on violations
function ValidationEngine._determineValidationAction(violations)
    if #violations == 0 then
        return ValidationEngine.VALIDATION_ACTIONS.ALLOW
    end
    
    -- Check for highest severity violation
    local highestSeverity = "LOW"
    for _, violation in ipairs(violations) do
        if violation.severity == "CRITICAL" then
            return ValidationEngine.VALIDATION_ACTIONS.TERMINATE
        elseif violation.severity == "HIGH" and highestSeverity ~= "CRITICAL" then
            highestSeverity = "HIGH"
        elseif violation.severity == "MEDIUM" and 
               highestSeverity ~= "CRITICAL" and highestSeverity ~= "HIGH" then
            highestSeverity = "MEDIUM"
        end
    end
    
    -- Map severity to action
    if highestSeverity == "HIGH" then
        return ValidationEngine.VALIDATION_ACTIONS.BLOCK
    elseif highestSeverity == "MEDIUM" then
        return ValidationEngine.VALIDATION_ACTIONS.WARN
    else
        return ValidationEngine.VALIDATION_ACTIONS.ALLOW
    end
end

-- Check if validation rule applies to process
function ValidationEngine._isRuleApplicable(rule, processId)
    if not rule.processScope then
        return true
    end
    
    for _, scopePattern in ipairs(rule.processScope) do
        if scopePattern == "*" or 
           scopePattern == processId or
           string.match(processId or "", scopePattern) then
            return true
        end
    end
    
    return false
end

-- Cache management functions
function ValidationEngine._generateCacheKey(validationType, data, processId)
    -- Generate deterministic cache key
    local keyData = {
        type = validationType,
        process = processId or "unknown",
        dataHash = ValidationEngine._hashData(data)
    }
    
    return validationType .. "_" .. (processId or "unknown") .. "_" .. ValidationEngine._hashData(data)
end

function ValidationEngine._hashData(data)
    -- Simple hash function for cache keys
    local str = json.encode(data) or "null"
    local hash = 0
    for i = 1, #str do
        local char = string.byte(str, i)
        hash = ((hash * 31) + char) % 1000000
    end
    return tostring(hash)
end

function ValidationEngine._getCachedValidation(cacheKey)
    local cached = ValidationEngine.validationCache[cacheKey]
    
    if cached and (0 - cached.cachedAt) < ValidationEngine.cacheTimeout then
        return cached
    end
    
    -- Remove expired cache entry
    if cached then
        ValidationEngine.validationCache[cacheKey] = nil
    end
    
    return nil
end

function ValidationEngine._cacheValidationResult(cacheKey, result)
    -- Check cache size limit
    local cacheSize = ValidationEngine._getTableSize(ValidationEngine.validationCache)
    
    if cacheSize >= ValidationEngine.maxCacheSize then
        ValidationEngine._cleanupCache()
    end
    
    ValidationEngine.validationCache[cacheKey] = result
end

function ValidationEngine._cleanupCache()
    -- Remove oldest 20% of cache entries
    local cacheEntries = {}
    for key, entry in pairs(ValidationEngine.validationCache) do
        table.insert(cacheEntries, {key = key, cachedAt = entry.cachedAt})
    end
    
    table.sort(cacheEntries, function(a, b) return a.cachedAt < b.cachedAt end)
    
    local removeCount = math.floor(#cacheEntries * 0.2)
    for i = 1, removeCount do
        ValidationEngine.validationCache[cacheEntries[i].key] = nil
    end
end

-- Get validation statistics
function ValidationEngine.getStatistics()
    local avgValidationTime = 0
    if ValidationEngine.validationMetrics.totalValidations > 0 then
        avgValidationTime = ValidationEngine.validationMetrics.validationTime / 
                           ValidationEngine.validationMetrics.totalValidations
    end
    
    return {
        totalValidations = ValidationEngine.validationMetrics.totalValidations,
        averageValidationTime = avgValidationTime,
        cacheHits = ValidationEngine.validationMetrics.cacheHits,
        validationFailures = ValidationEngine.validationMetrics.validationFailures,
        cacheHitRate = ValidationEngine.validationMetrics.totalValidations > 0 and
                      (ValidationEngine.validationMetrics.cacheHits / ValidationEngine.validationMetrics.totalValidations) or 0,
        activeRules = ValidationEngine._getTableSize(ValidationEngine.validationRules),
        cacheSize = ValidationEngine._getTableSize(ValidationEngine.validationCache),
        maxValidationTime = ValidationEngine.maxValidationTime
    }
end

-- Get average validation time
function ValidationEngine.getAverageValidationTime()
    if ValidationEngine.validationMetrics.totalValidations > 0 then
        return ValidationEngine.validationMetrics.validationTime / ValidationEngine.validationMetrics.totalValidations
    end
    return 0
end

-- Get health status
function ValidationEngine.getHealth()
    local stats = ValidationEngine.getStatistics()
    
    -- Check health based on performance and error rates
    if stats.averageValidationTime > ValidationEngine.maxValidationTime * 2 then
        return "DEGRADED"
    end
    
    if stats.totalValidations > 0 and 
       (stats.validationFailures / stats.totalValidations) > 0.5 then
        return "DEGRADED"
    end
    
    return "HEALTHY"
end

-- Get list of validation rules
function ValidationEngine.getValidationRules(ruleType, processId)
    local rules = {}
    
    for ruleId, rule in pairs(ValidationEngine.validationRules) do
        local includeRule = true
        
        if ruleType and rule.ruleType ~= ruleType then
            includeRule = false
        end
        
        if processId and not ValidationEngine._isRuleApplicable(rule, processId) then
            includeRule = false
        end
        
        if includeRule then
            rules[ruleId] = {
                ruleId = rule.ruleId,
                ruleType = rule.ruleType,
                processScope = rule.processScope,
                severity = rule.severity,
                enabled = rule.enabled,
                metadata = rule.metadata,
                createdAt = rule.createdAt
            }
        end
    end
    
    return rules
end

-- Helper function
function ValidationEngine._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return ValidationEngine