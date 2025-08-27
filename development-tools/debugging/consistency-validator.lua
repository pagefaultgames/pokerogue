-- State Consistency Validation Utilities
-- Validates game state integrity and consistency across operations

local ConsistencyValidator = {}
ConsistencyValidator.__index = ConsistencyValidator

function ConsistencyValidator.new(emulator)
    local validator = setmetatable({}, ConsistencyValidator)
    validator.emulator = emulator
    validator.rules = {}
    validator.validationHistory = {}
    validator.violations = {}
    
    -- Initialize built-in validation rules
    validator:initializeDefaultRules()
    
    return validator
end

-- Rule Management
function ConsistencyValidator:addRule(name, ruleConfig)
    local rule = {
        name = name,
        description = ruleConfig.description or "",
        severity = ruleConfig.severity or "error", -- error, warning, info
        category = ruleConfig.category or "general",
        condition = ruleConfig.condition, -- function(state) -> boolean, string
        fix = ruleConfig.fix, -- optional function(state) -> fixedState
        enabled = ruleConfig.enabled ~= false,
        tags = ruleConfig.tags or {},
        created = os.time()
    }
    
    self.rules[name] = rule
    return rule
end

function ConsistencyValidator:removeRule(name)
    self.rules[name] = nil
end

function ConsistencyValidator:enableRule(name)
    if self.rules[name] then
        self.rules[name].enabled = true
    end
end

function ConsistencyValidator:disableRule(name)
    if self.rules[name] then
        self.rules[name].enabled = false
    end
end

-- Default Validation Rules
function ConsistencyValidator:initializeDefaultRules()
    -- Pokemon Team Consistency
    self:addRule("pokemon_team_integrity", {
        description = "Validates Pokemon team structure and data integrity",
        category = "pokemon",
        severity = "error",
        condition = function(state)
            if not state.players then
                return true -- No players to validate
            end
            
            for playerId, playerData in pairs(state.players) do
                if playerData.team then
                    -- Check team size
                    if #playerData.team > 6 then
                        return false, "Player " .. playerId .. " has more than 6 Pokemon"
                    end
                    
                    -- Validate each Pokemon
                    for i, pokemon in ipairs(playerData.team) do
                        if not pokemon.species or pokemon.species == "" then
                            return false, "Pokemon " .. i .. " in " .. playerId .. "'s team has no species"
                        end
                        
                        if not pokemon.hp or pokemon.hp < 0 then
                            return false, "Pokemon " .. i .. " has invalid HP: " .. tostring(pokemon.hp)
                        end
                        
                        if not pokemon.maxHp or pokemon.maxHp <= 0 then
                            return false, "Pokemon " .. i .. " has invalid max HP: " .. tostring(pokemon.maxHp)
                        end
                        
                        if pokemon.hp > pokemon.maxHp then
                            return false, "Pokemon " .. i .. " HP exceeds max HP"
                        end
                        
                        if not pokemon.level or pokemon.level < 1 or pokemon.level > 100 then
                            return false, "Pokemon " .. i .. " has invalid level: " .. tostring(pokemon.level)
                        end
                    end
                end
            end
            
            return true
        end
    })
    
    -- Battle State Consistency
    self:addRule("battle_state_integrity", {
        description = "Validates active battle state consistency",
        category = "battle",
        severity = "error",
        condition = function(state)
            if not state.active_battles then
                return true -- No active battles
            end
            
            for battleId, battle in pairs(state.active_battles) do
                -- Check battle has required fields
                if not battle.players or #battle.players < 2 then
                    return false, "Battle " .. battleId .. " has insufficient players"
                end
                
                if not battle.turn or battle.turn < 1 then
                    return false, "Battle " .. battleId .. " has invalid turn number"
                end
                
                if not battle.phase then
                    return false, "Battle " .. battleId .. " missing phase information"
                end
                
                -- Check player states exist for all battle participants
                for _, playerId in ipairs(battle.players) do
                    if not state.players or not state.players[playerId] then
                        return false, "Battle " .. battleId .. " references non-existent player " .. playerId
                    end
                end
            end
            
            return true
        end
    })
    
    -- Player Data Consistency
    self:addRule("player_data_integrity", {
        description = "Validates player data structure and relationships",
        category = "player",
        severity = "error",
        condition = function(state)
            if not state.players then
                return true
            end
            
            for playerId, playerData in pairs(state.players) do
                -- Check required fields
                if not playerData.id or playerData.id ~= playerId then
                    return false, "Player " .. playerId .. " has mismatched ID"
                end
                
                -- Check currency values
                if playerData.currency and playerData.currency < 0 then
                    return false, "Player " .. playerId .. " has negative currency"
                end
                
                -- Check experience values
                if playerData.experience and playerData.experience < 0 then
                    return false, "Player " .. playerId .. " has negative experience"
                end
                
                -- Check level consistency
                if playerData.level and playerData.experience then
                    local expectedMinExp = self:calculateMinExperienceForLevel(playerData.level)
                    if playerData.experience < expectedMinExp then
                        return false, "Player " .. playerId .. " experience doesn't match level"
                    end
                end
            end
            
            return true
        end
    })
    
    -- Resource Conservation
    self:addRule("resource_conservation", {
        description = "Validates that resources are properly conserved",
        category = "economy",
        severity = "warning",
        condition = function(state)
            if not state.players or not state.global_resources then
                return true
            end
            
            -- Check total currency conservation
            local totalPlayerCurrency = 0
            for _, playerData in pairs(state.players) do
                if playerData.currency then
                    totalPlayerCurrency = totalPlayerCurrency + playerData.currency
                end
            end
            
            local expectedTotal = state.global_resources.total_currency_issued or 0
            if totalPlayerCurrency > expectedTotal then
                return false, "Total player currency exceeds issued currency"
            end
            
            return true
        end
    })
    
    -- Authentication State Consistency
    self:addRule("auth_state_consistency", {
        description = "Validates authentication state integrity",
        category = "security",
        severity = "error",
        condition = function(state)
            if not state.authenticated_users and not state.auth_sessions then
                return true
            end
            
            -- Check authenticated users have valid sessions
            if state.authenticated_users then
                for userId, authData in pairs(state.authenticated_users) do
                    if authData.sessionId and state.auth_sessions then
                        local session = state.auth_sessions[authData.sessionId]
                        if not session then
                            return false, "User " .. userId .. " has invalid session reference"
                        end
                        
                        if session.userId ~= userId then
                            return false, "Session " .. authData.sessionId .. " has mismatched user ID"
                        end
                        
                        -- Check session expiry
                        if session.expires and session.expires < os.time() then
                            return false, "User " .. userId .. " has expired session"
                        end
                    end
                end
            end
            
            return true
        end
    })
    
    -- Move PP Consistency
    self:addRule("move_pp_consistency", {
        description = "Validates Pokemon move PP values are within bounds",
        category = "pokemon",
        severity = "warning",
        condition = function(state)
            if not state.players then
                return true
            end
            
            for playerId, playerData in pairs(state.players) do
                if playerData.team then
                    for i, pokemon in ipairs(playerData.team) do
                        if pokemon.moves then
                            for j, move in ipairs(pokemon.moves) do
                                if move.pp and move.maxPp then
                                    if move.pp > move.maxPp then
                                        return false, "Pokemon " .. i .. " move " .. j .. " PP exceeds maximum"
                                    end
                                    
                                    if move.pp < 0 then
                                        return false, "Pokemon " .. i .. " move " .. j .. " has negative PP"
                                    end
                                end
                            end
                        end
                    end
                end
            end
            
            return true
        end
    })
end

-- Validation Execution
function ConsistencyValidator:validateState(options)
    options = options or {}
    
    local state = self.emulator:getState()
    local validation = {
        timestamp = os.time(),
        state_snapshot = options.includeSnapshot and self:deepCopy(state) or nil,
        results = {},
        summary = {
            total_rules = 0,
            passed = 0,
            failed = 0,
            warnings = 0,
            skipped = 0
        },
        violations = {},
        performance = {}
    }
    
    -- Apply category filter if specified
    local rulesToRun = {}
    for name, rule in pairs(self.rules) do
        if rule.enabled then
            if not options.categories or self:ruleMatchesCategories(rule, options.categories) then
                if not options.tags or self:ruleMatchesTags(rule, options.tags) then
                    table.insert(rulesToRun, {name = name, rule = rule})
                end
            end
        end
    end
    
    validation.summary.total_rules = #rulesToRun
    
    -- Run validation rules
    for _, ruleInfo in ipairs(rulesToRun) do
        local ruleResult = self:runValidationRule(ruleInfo.name, ruleInfo.rule, state)
        table.insert(validation.results, ruleResult)
        
        if ruleResult.passed then
            validation.summary.passed = validation.summary.passed + 1
        elseif ruleResult.severity == "warning" then
            validation.summary.warnings = validation.summary.warnings + 1
            table.insert(validation.violations, ruleResult)
        else
            validation.summary.failed = validation.summary.failed + 1
            table.insert(validation.violations, ruleResult)
        end
    end
    
    -- Calculate overall status
    validation.status = "passed"
    if validation.summary.failed > 0 then
        validation.status = "failed"
    elseif validation.summary.warnings > 0 then
        validation.status = "warnings"
    end
    
    -- Store in history
    table.insert(self.validationHistory, validation)
    
    return validation
end

function ConsistencyValidator:runValidationRule(name, rule, state)
    local result = {
        rule = name,
        description = rule.description,
        category = rule.category,
        severity = rule.severity,
        passed = false,
        error = nil,
        message = nil,
        execution_time = 0,
        timestamp = os.time()
    }
    
    local startTime = os.clock()
    
    local success, outcome, message = pcall(rule.condition, state)
    
    result.execution_time = os.clock() - startTime
    
    if not success then
        result.error = outcome
        result.message = "Rule execution failed: " .. tostring(outcome)
    else
        result.passed = outcome
        result.message = message or (outcome and "Rule passed" or "Rule failed")
    end
    
    return result
end

-- Continuous Validation
function ConsistencyValidator:startContinuousValidation(interval, options)
    interval = interval or 5000 -- 5 seconds default
    options = options or {}
    
    local monitor = {
        interval = interval,
        options = options,
        active = true,
        results = {},
        violationCount = 0,
        startTime = os.time()
    }
    
    -- In a real implementation, this would use a proper timer/scheduler
    -- For this example, we'll just provide the structure
    monitor.validate = function()
        if monitor.active then
            local validation = self:validateState(options)
            table.insert(monitor.results, validation)
            
            if #validation.violations > 0 then
                monitor.violationCount = monitor.violationCount + #validation.violations
                
                -- Trigger alerts if specified
                if options.onViolation then
                    pcall(options.onViolation, validation.violations)
                end
            end
            
            return validation
        end
    end
    
    monitor.stop = function()
        monitor.active = false
        monitor.endTime = os.time()
    end
    
    monitor.getReport = function()
        return {
            duration = (monitor.endTime or os.time()) - monitor.startTime,
            validations = #monitor.results,
            violations = monitor.violationCount,
            results = monitor.results
        }
    end
    
    return monitor
end

-- State Repair and Fixing
function ConsistencyValidator:repairState(options)
    options = options or {}
    
    local state = self.emulator:getState()
    local repairs = {
        timestamp = os.time(),
        original_violations = {},
        repairs_attempted = {},
        repairs_successful = {},
        final_violations = {},
        success = false
    }
    
    -- First, find all violations
    local initialValidation = self:validateState()
    repairs.original_violations = initialValidation.violations
    
    -- Attempt repairs for rules that have fix functions
    for _, violation in ipairs(initialValidation.violations) do
        local rule = self.rules[violation.rule]
        
        if rule and rule.fix and (not options.dryRun) then
            local repairAttempt = {
                rule = violation.rule,
                attempted = true,
                success = false,
                error = nil
            }
            
            local success, fixedState, error = pcall(rule.fix, state)
            
            if success and fixedState then
                -- Update the emulator state (this would need to be implemented)
                -- For now, just record the attempt
                repairAttempt.success = true
                table.insert(repairs.repairs_successful, repairAttempt)
            else
                repairAttempt.error = error or "Fix function failed"
                table.insert(repairs.repairs_attempted, repairAttempt)
            end
        end
    end
    
    -- Validate again to check if repairs worked
    if not options.dryRun then
        local finalValidation = self:validateState()
        repairs.final_violations = finalValidation.violations
        repairs.success = #finalValidation.violations < #initialValidation.violations
    end
    
    return repairs
end

-- Validation Reporting
function ConsistencyValidator:generateValidationReport(validations)
    if not validations then
        validations = self.validationHistory
    end
    
    local report = {
        generated = os.time(),
        validation_count = #validations,
        summary = {
            total_violations = 0,
            by_category = {},
            by_severity = {},
            by_rule = {},
            trending = {}
        },
        details = validations
    }
    
    -- Analyze validation history
    for _, validation in ipairs(validations) do
        report.summary.total_violations = report.summary.total_violations + #validation.violations
        
        for _, violation in ipairs(validation.violations) do
            -- By category
            local category = violation.category or "unknown"
            report.summary.by_category[category] = (report.summary.by_category[category] or 0) + 1
            
            -- By severity
            local severity = violation.severity or "unknown"
            report.summary.by_severity[severity] = (report.summary.by_severity[severity] or 0) + 1
            
            -- By rule
            local rule = violation.rule or "unknown"
            report.summary.by_rule[rule] = (report.summary.by_rule[rule] or 0) + 1
        end
    end
    
    -- Calculate trending (last 10 vs previous 10 validations)
    if #validations >= 20 then
        local recent = {}
        local previous = {}
        
        for i = #validations - 9, #validations do
            table.insert(recent, validations[i])
        end
        
        for i = #validations - 19, #validations - 10 do
            table.insert(previous, validations[i])
        end
        
        local recentViolations = 0
        local previousViolations = 0
        
        for _, v in ipairs(recent) do
            recentViolations = recentViolations + #v.violations
        end
        
        for _, v in ipairs(previous) do
            previousViolations = previousViolations + #v.violations
        end
        
        report.summary.trending = {
            recent_violations = recentViolations,
            previous_violations = previousViolations,
            trend = recentViolations > previousViolations and "increasing" or 
                   recentViolations < previousViolations and "decreasing" or "stable"
        }
    end
    
    return report
end

-- Utility Functions
function ConsistencyValidator:deepCopy(orig)
    local orig_type = type(orig)
    local copy
    if orig_type == 'table' then
        copy = {}
        for orig_key, orig_value in pairs(orig) do
            copy[orig_key] = self:deepCopy(orig_value)
        end
    else
        copy = orig
    end
    return copy
end

function ConsistencyValidator:ruleMatchesCategories(rule, categories)
    for _, category in ipairs(categories) do
        if rule.category == category then
            return true
        end
    end
    return false
end

function ConsistencyValidator:ruleMatchesTags(rule, tags)
    for _, tag in ipairs(tags) do
        for _, ruleTag in ipairs(rule.tags) do
            if ruleTag == tag then
                return true
            end
        end
    end
    return false
end

function ConsistencyValidator:calculateMinExperienceForLevel(level)
    -- Simplified experience calculation
    return (level - 1) * 1000
end

-- Custom Validation Helpers
function ConsistencyValidator:createCustomRule(name, condition, options)
    options = options or {}
    
    return self:addRule(name, {
        description = options.description or ("Custom rule: " .. name),
        category = options.category or "custom",
        severity = options.severity or "warning",
        condition = condition,
        fix = options.fix,
        tags = options.tags or {"custom"}
    })
end

function ConsistencyValidator:validatePath(path, validator_func, options)
    options = options or {}
    
    return self:createCustomRule("path_" .. path:gsub("%.", "_"), function(state)
        local value = self:getValueAtPath(state, path)
        if value == nil and not options.allowNil then
            return false, "Path " .. path .. " not found in state"
        end
        
        if value ~= nil then
            return validator_func(value, path, state)
        end
        
        return true
    end, {
        description = "Validates value at path: " .. path,
        category = "path_validation",
        severity = options.severity or "error"
    })
end

function ConsistencyValidator:getValueAtPath(obj, path)
    local keys = {}
    for key in string.gmatch(path, "[^.]+") do
        table.insert(keys, key)
    end
    
    local current = obj
    for _, key in ipairs(keys) do
        if type(current) ~= "table" then
            return nil
        end
        current = current[key]
        if current == nil then
            return nil
        end
    end
    
    return current
end

-- Export and Import Rules
function ConsistencyValidator:exportRules()
    local exported = {
        timestamp = os.time(),
        rules = {},
        metadata = {
            rule_count = 0,
            categories = {},
            severities = {}
        }
    }
    
    for name, rule in pairs(self.rules) do
        -- Export rule without the actual function (can't serialize functions easily)
        exported.rules[name] = {
            name = rule.name,
            description = rule.description,
            severity = rule.severity,
            category = rule.category,
            enabled = rule.enabled,
            tags = rule.tags,
            created = rule.created,
            has_condition = (rule.condition ~= nil),
            has_fix = (rule.fix ~= nil)
        }
        
        exported.metadata.rule_count = exported.metadata.rule_count + 1
        exported.metadata.categories[rule.category] = (exported.metadata.categories[rule.category] or 0) + 1
        exported.metadata.severities[rule.severity] = (exported.metadata.severities[rule.severity] or 0) + 1
    end
    
    return exported
end

return ConsistencyValidator