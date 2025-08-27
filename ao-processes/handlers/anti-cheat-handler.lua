-- anti-cheat-handler.lua: Anti-Cheat Detection System
-- Detects suspicious behavior and coordinates all validation systems

local AntiCheatHandler = {}

-- Import validation modules
local AuthHandler = require("auth-handler")
local ValidationHandler = require("validation-handler")

-- Constants
local CHEAT_ERRORS = {
    SUSPICIOUS_BEHAVIOR = "CHEAT_001",
    DATA_ANOMALY = "CHEAT_002",
    PATTERN_VIOLATION = "CHEAT_003",
    INTEGRITY_BREACH = "CHEAT_004",
    CORRELATION_MISMATCH = "CHEAT_005"
}

-- Anomaly detection thresholds
local ANOMALY_THRESHOLDS = {
    MAX_WIN_STREAK = 50,
    MAX_LEVEL_GAIN_PER_HOUR = 10,
    MAX_CURRENCY_GAIN_PER_MINUTE = 10000,
    MIN_BATTLE_DURATION = 1000,
    MAX_ACTIONS_PER_SECOND = 5
}

-- Detect suspicious player behavior patterns
function AntiCheatHandler.detectSuspiciousBehavior(playerId, playerData, activityLog)
    local anomalies = {}
    
    if not playerId or not playerData then
        return anomalies
    end
    
    -- Check win streak anomaly
    if playerData.currentWinStreak and playerData.currentWinStreak > ANOMALY_THRESHOLDS.MAX_WIN_STREAK then
        table.insert(anomalies, {
            type = "excessive_win_streak",
            value = playerData.currentWinStreak,
            threshold = ANOMALY_THRESHOLDS.MAX_WIN_STREAK,
            severity = "high"
        })
    end
    
    -- Check rapid progression
    if playerData.recentLevelUps then
        local recentLevelUps = #playerData.recentLevelUps
        if recentLevelUps > ANOMALY_THRESHOLDS.MAX_LEVEL_GAIN_PER_HOUR then
            table.insert(anomalies, {
                type = "rapid_progression",
                value = recentLevelUps,
                threshold = ANOMALY_THRESHOLDS.MAX_LEVEL_GAIN_PER_HOUR,
                severity = "medium"
            })
        end
    end
    
    -- Check activity log for rapid actions
    if activityLog then
        local recentActions = {}
        local currentTime = os.time() * 1000 -- Current time in milliseconds
        local oneSecondAgo = currentTime - 1000
        
        for _, action in ipairs(activityLog) do
            if action.timestamp > oneSecondAgo then
                table.insert(recentActions, action)
            end
        end
        
        if #recentActions > ANOMALY_THRESHOLDS.MAX_ACTIONS_PER_SECOND then
            table.insert(anomalies, {
                type = "rapid_actions",
                value = #recentActions,
                threshold = ANOMALY_THRESHOLDS.MAX_ACTIONS_PER_SECOND,
                severity = "high"
            })
        end
    end
    
    return anomalies
end

-- Detect data corruption or manipulation
function AntiCheatHandler.detectDataCorruption(gameState)
    local corruptions = {}
    
    if not gameState or not gameState.player then
        table.insert(corruptions, {
            type = "missing_player_data",
            severity = "critical"
        })
        return corruptions
    end
    
    local playerData = gameState.player
    
    -- Check Pokemon party integrity
    if playerData.party then
        for i, pokemon in ipairs(playerData.party) do
            -- Check level vs experience consistency
            if pokemon.level and pokemon.experience then
                local minExpForLevel = math.max(0, (pokemon.level - 1) ^ 3)
                if pokemon.experience < minExpForLevel then
                    table.insert(corruptions, {
                        type = "experience_level_mismatch",
                        pokemonIndex = i,
                        level = pokemon.level,
                        experience = pokemon.experience,
                        severity = "high"
                    })
                end
            end
            
            -- Check stat bounds
            if pokemon.stats then
                for statName, statValue in pairs(pokemon.stats) do
                    if statValue and (statValue < 1 or statValue > 999) then
                        table.insert(corruptions, {
                            type = "stat_out_of_bounds",
                            pokemonIndex = i,
                            stat = statName,
                            value = statValue,
                            severity = "medium"
                        })
                    end
                end
            end
        end
    end
    
    -- Check currency bounds
    if playerData.currency then
        if playerData.currency < 0 or playerData.currency > 999999 then
            table.insert(corruptions, {
                type = "currency_out_of_bounds",
                value = playerData.currency,
                severity = "high"
            })
        end
    end
    
    return corruptions
end

-- Comprehensive cheat detection scan
function AntiCheatHandler.performCheatScan(playerId, gameState, activityLog, correlationId)
    local scanResults = {
        playerId = playerId,
        correlationId = correlationId,
        timestamp = os.time() * 1000,
        anomalies = {},
        corruptions = {},
        violations = {},
        overallRiskScore = 0,
        recommendedAction = "none"
    }
    
    -- Detect behavioral anomalies
    if gameState and gameState.player then
        scanResults.anomalies = AntiCheatHandler.detectSuspiciousBehavior(playerId, gameState.player, activityLog)
    end
    
    -- Detect data corruptions
    scanResults.corruptions = AntiCheatHandler.detectDataCorruption(gameState)
    
    -- Calculate risk score
    local riskScore = 0
    
    for _, anomaly in ipairs(scanResults.anomalies) do
        if anomaly.severity == "critical" then
            riskScore = riskScore + 10
        elseif anomaly.severity == "high" then
            riskScore = riskScore + 5
        elseif anomaly.severity == "medium" then
            riskScore = riskScore + 2
        else
            riskScore = riskScore + 1
        end
    end
    
    for _, corruption in ipairs(scanResults.corruptions) do
        if corruption.severity == "critical" then
            riskScore = riskScore + 15
        elseif corruption.severity == "high" then
            riskScore = riskScore + 8
        elseif corruption.severity == "medium" then
            riskScore = riskScore + 3
        else
            riskScore = riskScore + 1
        end
    end
    
    scanResults.overallRiskScore = riskScore
    
    -- Recommend action based on risk score
    if riskScore >= 20 then
        scanResults.recommendedAction = "suspend_account"
    elseif riskScore >= 10 then
        scanResults.recommendedAction = "flag_for_review"
    elseif riskScore >= 5 then
        scanResults.recommendedAction = "monitor_closely"
    else
        scanResults.recommendedAction = "none"
    end
    
    return scanResults
end

-- Validate complete player action with all security checks
function AntiCheatHandler.validateSecureAction(actionData, gameState, correlationId)
    local validationResult = {
        success = false,
        correlationId = correlationId,
        errors = {},
        warnings = {}
    }
    
    local success, result = pcall(function()
        -- Step 1: Authorization check
        local authResult = AuthHandler.authorizePlayerOperation(
            actionData.operation,
            actionData.playerId,
            actionData.messageFrom,
            actionData.additionalData
        )
        
        if not authResult.success then
            error({
                code = CHEAT_ERRORS.INTEGRITY_BREACH,
                message = "Authorization failed: " .. (authResult.error.message or "Unknown error"),
                category = "AUTHORIZATION",
                success = false
            })
        end
        
        -- Step 2: Action validation
        if actionData.battleAction then
            ValidationHandler.validateCompleteAction(
                actionData.battleAction,
                gameState.battleState,
                gameState.playerPokemon,
                gameState.moveDatabase
            )
        end
        
        -- Step 3: Cheat detection scan
        local cheatScan = AntiCheatHandler.performCheatScan(
            actionData.playerId,
            gameState,
            actionData.activityLog,
            correlationId
        )
        
        -- Flag high-risk activities
        if cheatScan.overallRiskScore >= 10 then
            table.insert(validationResult.warnings, {
                type = "high_risk_detected",
                riskScore = cheatScan.overallRiskScore,
                recommendedAction = cheatScan.recommendedAction
            })
        end
        
        -- Block critical risk activities
        if cheatScan.overallRiskScore >= 20 then
            error({
                code = CHEAT_ERRORS.SUSPICIOUS_BEHAVIOR,
                message = "Action blocked due to high cheat risk score",
                riskScore = cheatScan.overallRiskScore,
                success = false
            })
        end
        
        return {
            success = true,
            authorizedBy = authResult.authorizedBy,
            cheatScan = cheatScan
        }
    end)
    
    if success then
        validationResult.success = true
        validationResult.authResult = result.authorizedBy
        validationResult.cheatScan = result.cheatScan
    else
        validationResult.success = false
        table.insert(validationResult.errors, result)
    end
    
    return validationResult
end

-- Log security events with correlation ID
function AntiCheatHandler.logSecurityEvent(eventType, playerId, details, correlationId)
    local logEntry = {
        timestamp = os.time() * 1000,
        eventType = eventType,
        playerId = playerId,
        correlationId = correlationId,
        details = details
    }
    
    -- In production, this would write to a secure audit log
    print(string.format("[SECURITY] %s - Player: %s - Correlation: %s", 
        eventType, playerId or "unknown", correlationId or "none"))
    
    return logEntry
end

-- Get anti-cheat error information
function AntiCheatHandler.getErrorInfo(errorCode)
    local errorMessages = {
        [CHEAT_ERRORS.SUSPICIOUS_BEHAVIOR] = "Suspicious behavior pattern detected",
        [CHEAT_ERRORS.DATA_ANOMALY] = "Data anomaly detected",
        [CHEAT_ERRORS.PATTERN_VIOLATION] = "Behavior pattern violation",
        [CHEAT_ERRORS.INTEGRITY_BREACH] = "Data integrity breach detected",
        [CHEAT_ERRORS.CORRELATION_MISMATCH] = "Data correlation mismatch"
    }
    
    return {
        code = errorCode,
        message = errorMessages[errorCode] or "Unknown anti-cheat error",
        category = "ANTI_CHEAT"
    }
end

return AntiCheatHandler