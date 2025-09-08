-- Anti-Cheat Detection Engine
-- Detects impossible game states and suspicious behavioral patterns

local CryptoRNG = require("game-logic.rng.crypto-rng")

local AntiCheatDetector = {
    -- Detection state
    playerBehaviorProfiles = {},
    suspiciousActivities = {},
    cheatDetectionRules = {},
    statisticalBaselines = {},
    
    -- Detection metrics
    detectionMetrics = {
        totalChecks = 0,
        cheatsDetected = 0,
        falsePositives = 0,
        behaviorAnalyses = 0
    },
    
    -- Configuration
    suspicionThreshold = 75, -- 75% confidence for cheat detection
    behaviorWindowSize = 100, -- Track last 100 actions per player
    statisticalDeviationThreshold = 3.0 -- 3 standard deviations for anomaly
}

-- Cheat detection types
AntiCheatDetector.CHEAT_TYPES = {
    IMPOSSIBLE_STATE = "IMPOSSIBLE_STATE",
    STATISTICAL_ANOMALY = "STATISTICAL_ANOMALY", 
    BEHAVIORAL_PATTERN = "BEHAVIORAL_PATTERN",
    DATA_MANIPULATION = "DATA_MANIPULATION",
    TIME_MANIPULATION = "TIME_MANIPULATION"
}

-- Suspicion levels
AntiCheatDetector.SUSPICION_LEVELS = {
    LOW = 25,
    MEDIUM = 50,
    HIGH = 75,
    CRITICAL = 90
}

-- Initialize anti-cheat detector
function AntiCheatDetector.initialize()
    AntiCheatDetector.playerBehaviorProfiles = {}
    AntiCheatDetector.suspiciousActivities = {}
    AntiCheatDetector.cheatDetectionRules = {}
    AntiCheatDetector.statisticalBaselines = {}
    
    AntiCheatDetector.detectionMetrics = {
        totalChecks = 0,
        cheatsDetected = 0,
        falsePositives = 0,
        behaviorAnalyses = 0
    }
    
    -- Load default cheat detection rules
    AntiCheatDetector._loadDefaultDetectionRules()
    
    -- Initialize statistical baselines
    AntiCheatDetector._initializeStatisticalBaselines()
    
    print("[AntiCheatDetector] Anti-cheat detection engine initialized with " .. 
          AntiCheatDetector._getTableSize(AntiCheatDetector.cheatDetectionRules) .. " detection rules")
end

-- Load default cheat detection rules
function AntiCheatDetector._loadDefaultDetectionRules()
    -- Impossible Pokemon state detection
    AntiCheatDetector.addDetectionRule({
        ruleId = "impossible-pokemon-stats",
        cheatType = AntiCheatDetector.CHEAT_TYPES.IMPOSSIBLE_STATE,
        suspicionLevel = AntiCheatDetector.SUSPICION_LEVELS.CRITICAL,
        detectionLogic = function(data)
            if data.pokemon then
                local pokemon = data.pokemon
                
                -- Check for impossible stat values
                if pokemon.level and pokemon.level > 100 then
                    return true, "Pokemon level exceeds maximum (100)"
                end
                
                -- Check for negative stats
                local stats = {"hp", "maxHp", "attack", "defense", "spAttack", "spDefense", "speed"}
                for _, stat in ipairs(stats) do
                    if pokemon[stat] and pokemon[stat] < 0 then
                        return true, "Pokemon has negative " .. stat
                    end
                end
                
                -- Check for impossibly high stats (rough calculation)
                if pokemon.level and pokemon.level > 0 then
                    local maxBaseStat = 255 -- Highest possible base stat
                    local maxStatAtLevel = math.floor((2 * maxBaseStat + 31 + 252/4) * pokemon.level / 100) + 5
                    
                    for _, stat in ipairs({"attack", "defense", "spAttack", "spDefense", "speed"}) do
                        if pokemon[stat] and pokemon[stat] > maxStatAtLevel * 1.5 then -- 1.5x tolerance
                            return true, "Pokemon " .. stat .. " impossibly high for level " .. pokemon.level
                        end
                    end
                end
            end
            
            return false, nil
        end
    })
    
    -- Battle outcome manipulation detection
    AntiCheatDetector.addDetectionRule({
        ruleId = "impossible-battle-outcomes",
        cheatType = AntiCheatDetector.CHEAT_TYPES.IMPOSSIBLE_STATE,
        suspicionLevel = AntiCheatDetector.SUSPICION_LEVELS.HIGH,
        detectionLogic = function(data)
            if data.battleResult then
                local result = data.battleResult
                
                -- Check for impossible damage values
                if result.damageDealt and result.damageDealt < 0 then
                    return true, "Negative damage dealt"
                end
                
                -- Check for healing without healing moves/items
                if result.hpRestored and result.hpRestored > 0 and 
                   not result.healingSource then
                    return true, "HP restored without healing source"
                end
                
                -- Check for impossible critical hit rates
                if result.criticalHits and result.totalMoves and 
                   result.totalMoves > 0 and
                   (result.criticalHits / result.totalMoves) > 0.5 then -- 50%+ crit rate suspicious
                    return true, "Impossibly high critical hit rate: " .. 
                                (result.criticalHits / result.totalMoves * 100) .. "%"
                end
            end
            
            return false, nil
        end
    })
    
    -- Rapid action detection (speed hacking)
    AntiCheatDetector.addDetectionRule({
        ruleId = "rapid-action-detection",
        cheatType = AntiCheatDetector.CHEAT_TYPES.TIME_MANIPULATION,
        suspicionLevel = AntiCheatDetector.SUSPICION_LEVELS.MEDIUM,
        detectionLogic = function(data)
            if data.playerId and data.timestamp and data.actionType then
                local profile = AntiCheatDetector._getPlayerProfile(data.playerId)
                
                -- Check last action timing
                if profile.lastActionTime then
                    local timeDiff = data.timestamp - profile.lastActionTime
                    
                    -- Different minimum times for different action types
                    local minTimes = {
                        ["BATTLE_MOVE"] = 500,  -- 500ms minimum between battle moves
                        ["MENU_NAVIGATION"] = 100, -- 100ms minimum between menu actions
                        ["ITEM_USE"] = 300,     -- 300ms minimum between item uses
                        ["POKEMON_SWITCH"] = 200 -- 200ms minimum between switches
                    }
                    
                    local minTime = minTimes[data.actionType] or 200
                    
                    if timeDiff < minTime then
                        return true, "Action too rapid: " .. timeDiff .. "ms (min: " .. minTime .. "ms)"
                    end
                end
                
                -- Update profile
                profile.lastActionTime = data.timestamp
                profile.actionCount = (profile.actionCount or 0) + 1
            end
            
            return false, nil
        end
    })
    
    -- Statistical anomaly detection
    AntiCheatDetector.addDetectionRule({
        ruleId = "win-rate-anomaly",
        cheatType = AntiCheatDetector.CHEAT_TYPES.STATISTICAL_ANOMALY,
        suspicionLevel = AntiCheatDetector.SUSPICION_LEVELS.MEDIUM,
        detectionLogic = function(data)
            if data.playerId and data.battleResult then
                local profile = AntiCheatDetector._getPlayerProfile(data.playerId)
                
                -- Track win/loss record
                profile.battles = profile.battles or {}
                table.insert(profile.battles, {
                    result = data.battleResult.won and "WIN" or "LOSS",
                    timestamp = data.timestamp or 0
                })
                
                -- Keep only recent battles (last 50)
                if #profile.battles > 50 then
                    table.remove(profile.battles, 1)
                end
                
                -- Calculate win rate for statistical analysis
                if #profile.battles >= 10 then -- Need at least 10 battles
                    local wins = 0
                    for _, battle in ipairs(profile.battles) do
                        if battle.result == "WIN" then
                            wins = wins + 1
                        end
                    end
                    
                    local winRate = wins / #profile.battles
                    
                    -- Check against statistical baselines (95% win rate is suspicious)
                    if winRate > 0.95 and #profile.battles >= 20 then
                        return true, "Suspiciously high win rate: " .. 
                                    string.format("%.1f%%", winRate * 100) .. 
                                    " (" .. wins .. "/" .. #profile.battles .. ")"
                    end
                end
            end
            
            return false, nil
        end
    })
    
    -- Data manipulation detection
    AntiCheatDetector.addDetectionRule({
        ruleId = "data-integrity-check",
        cheatType = AntiCheatDetector.CHEAT_TYPES.DATA_MANIPULATION,
        suspicionLevel = AntiCheatDetector.SUSPICION_LEVELS.HIGH,
        detectionLogic = function(data)
            if data.gameState then
                local state = data.gameState
                
                -- Check for data consistency
                if state.pokemon then
                    for _, pokemon in ipairs(state.pokemon) do
                        -- HP consistency
                        if pokemon.hp and pokemon.maxHp and pokemon.hp > pokemon.maxHp then
                            return true, "Pokemon HP exceeds maxHp"
                        end
                        
                        -- Move PP consistency
                        if pokemon.moves then
                            for _, move in ipairs(pokemon.moves) do
                                if move.pp and move.maxPP and move.pp > move.maxPP then
                                    return true, "Move PP exceeds maxPP"
                                end
                            end
                        end
                        
                        -- Experience consistency
                        if pokemon.level and pokemon.exp then
                            -- Basic level-exp consistency check
                            local minExpForLevel = pokemon.level > 1 and (pokemon.level - 1) ^ 3 or 0
                            if pokemon.exp < minExpForLevel then
                                return true, "Pokemon experience too low for level"
                            end
                        end
                    end
                end
                
                -- Check for impossible item quantities
                if state.items then
                    for itemId, quantity in pairs(state.items) do
                        if quantity < 0 then
                            return true, "Negative item quantity"
                        end
                        
                        if quantity > 999 then -- Max stack size check
                            return true, "Item quantity exceeds maximum stack size"
                        end
                    end
                end
            end
            
            return false, nil
        end
    })
end

-- Initialize statistical baselines
function AntiCheatDetector._initializeStatisticalBaselines()
    AntiCheatDetector.statisticalBaselines = {
        averageWinRate = 0.5, -- 50% baseline win rate
        averageBattleTime = 180, -- 3 minutes average battle time
        averageActionsPerBattle = 15, -- 15 actions per battle average
        averageDamagePerMove = 50 -- 50 damage per move average
    }
end

-- Add detection rule
function AntiCheatDetector.addDetectionRule(rule)
    if not rule.ruleId or type(rule.ruleId) ~= "string" then
        return false, "Rule ID required and must be a string"
    end
    
    if not rule.detectionLogic or type(rule.detectionLogic) ~= "function" then
        return false, "Detection logic function required"
    end
    
    if not rule.cheatType or not AntiCheatDetector.CHEAT_TYPES[rule.cheatType:upper()] then
        return false, "Valid cheat type required"
    end
    
    AntiCheatDetector.cheatDetectionRules[rule.ruleId] = {
        ruleId = rule.ruleId,
        cheatType = rule.cheatType,
        suspicionLevel = rule.suspicionLevel or AntiCheatDetector.SUSPICION_LEVELS.MEDIUM,
        detectionLogic = rule.detectionLogic,
        enabled = rule.enabled ~= false,
        metadata = rule.metadata or {},
        createdAt = 0
    }
    
    return true, nil
end

-- Perform cheat detection analysis
function AntiCheatDetector.analyzeForCheating(data, playerId)
    local startTime = msg.Timestamp
    local detectedCheats = {}
    local totalSuspicion = 0
    local rulesTriggered = 0
    
    AntiCheatDetector.detectionMetrics.totalChecks = AntiCheatDetector.detectionMetrics.totalChecks + 1
    
    -- Run all enabled detection rules
    for ruleId, rule in pairs(AntiCheatDetector.cheatDetectionRules) do
        if rule.enabled then
            local success, isCheatDetected, reason = pcall(rule.detectionLogic, data)
            
            if success and isCheatDetected then
                rulesTriggered = rulesTriggered + 1
                totalSuspicion = totalSuspicion + rule.suspicionLevel
                
                table.insert(detectedCheats, {
                    ruleId = ruleId,
                    cheatType = rule.cheatType,
                    suspicionLevel = rule.suspicionLevel,
                    reason = reason or "Cheat pattern detected",
                    timestamp = msg.Timestamp,
                    playerId = playerId
                })
                
                print(string.format("[AntiCheatDetector] Cheat detected by rule '%s': %s", 
                      ruleId, reason))
            elseif not success then
                print(string.format("[AntiCheatDetector] Error in detection rule '%s': %s", 
                      ruleId, tostring(isCheatDetected)))
            end
        end
    end
    
    -- Calculate overall suspicion score
    local suspicionScore = rulesTriggered > 0 and (totalSuspicion / rulesTriggered) or 0
    
    -- Update behavior profile
    if playerId then
        AntiCheatDetector._updatePlayerBehaviorProfile(playerId, data, suspicionScore, detectedCheats)
    end
    
    -- Determine if cheating is detected above threshold
    local cheatDetected = suspicionScore >= AntiCheatDetector.suspicionThreshold
    
    if cheatDetected then
        AntiCheatDetector.detectionMetrics.cheatsDetected = AntiCheatDetector.detectionMetrics.cheatsDetected + 1
    end
    
    -- Record suspicious activity
    if #detectedCheats > 0 then
        AntiCheatDetector._recordSuspiciousActivity(playerId, detectedCheats, suspicionScore)
    end
    
    local endTime = msg.Timestamp
    local analysisTime = endTime - startTime
    
    return cheatDetected, detectedCheats, suspicionScore, analysisTime
end

-- Update player behavior profile
function AntiCheatDetector._updatePlayerBehaviorProfile(playerId, data, suspicionScore, detectedCheats)
    local profile = AntiCheatDetector._getPlayerProfile(playerId)
    
    -- Update behavior tracking
    profile.totalAnalyses = (profile.totalAnalyses or 0) + 1
    profile.totalSuspicionScore = (profile.totalSuspicionScore or 0) + suspicionScore
    profile.averageSuspicion = profile.totalSuspicionScore / profile.totalAnalyses
    
    -- Track cheat detections
    profile.cheatDetections = (profile.cheatDetections or 0) + #detectedCheats
    profile.lastAnalyzed = 0
    
    -- Track recent suspicious activities (last 50)
    profile.recentActivities = profile.recentActivities or {}
    if #detectedCheats > 0 then
        table.insert(profile.recentActivities, {
            timestamp = msg.Timestamp,
            suspicionScore = suspicionScore,
            cheatTypes = AntiCheatDetector._extractCheatTypes(detectedCheats)
        })
        
        -- Keep only recent activities
        if #profile.recentActivities > 50 then
            table.remove(profile.recentActivities, 1)
        end
    end
    
    AntiCheatDetector.detectionMetrics.behaviorAnalyses = AntiCheatDetector.detectionMetrics.behaviorAnalyses + 1
end

-- Get or create player profile
function AntiCheatDetector._getPlayerProfile(playerId)
    if not AntiCheatDetector.playerBehaviorProfiles[playerId] then
        AntiCheatDetector.playerBehaviorProfiles[playerId] = {
            playerId = playerId,
            createdAt = 0,
            totalAnalyses = 0,
            totalSuspicionScore = 0,
            averageSuspicion = 0,
            cheatDetections = 0,
            recentActivities = {},
            lastActionTime = nil,
            actionCount = 0
        }
    end
    
    return AntiCheatDetector.playerBehaviorProfiles[playerId]
end

-- Record suspicious activity
function AntiCheatDetector._recordSuspiciousActivity(playerId, detectedCheats, suspicionScore)
    local activityId = "id_" .. msg.Timestamp .. "_" .. CryptoRNG.random(1000, 9999)
    
    AntiCheatDetector.suspiciousActivities[activityId] = {
        activityId = activityId,
        playerId = playerId,
        timestamp = msg.Timestamp,
        suspicionScore = suspicionScore,
        detectedCheats = detectedCheats,
        status = "OPEN",
        investigatorNotes = {}
    }
end

-- Extract cheat types from detections
function AntiCheatDetector._extractCheatTypes(detectedCheats)
    local cheatTypes = {}
    for _, cheat in ipairs(detectedCheats) do
        if not cheatTypes[cheat.cheatType] then
            cheatTypes[cheat.cheatType] = 0
        end
        cheatTypes[cheat.cheatType] = cheatTypes[cheat.cheatType] + 1
    end
    return cheatTypes
end

-- Get player behavior analysis
function AntiCheatDetector.getPlayerBehaviorAnalysis(playerId)
    local profile = AntiCheatDetector.playerBehaviorProfiles[playerId]
    if not profile then
        return nil, "Player profile not found"
    end
    
    return {
        playerId = playerId,
        profileCreated = profile.createdAt,
        totalAnalyses = profile.totalAnalyses,
        averageSuspicion = profile.averageSuspicion,
        cheatDetections = profile.cheatDetections,
        recentActivityCount = #profile.recentActivities,
        lastAnalyzed = profile.lastAnalyzed,
        riskLevel = AntiCheatDetector._calculateRiskLevel(profile),
        behaviorTrends = AntiCheatDetector._analyzeBehaviorTrends(profile)
    }
end

-- Calculate risk level for player
function AntiCheatDetector._calculateRiskLevel(profile)
    if profile.averageSuspicion >= AntiCheatDetector.SUSPICION_LEVELS.CRITICAL then
        return "CRITICAL"
    elseif profile.averageSuspicion >= AntiCheatDetector.SUSPICION_LEVELS.HIGH then
        return "HIGH"
    elseif profile.averageSuspicion >= AntiCheatDetector.SUSPICION_LEVELS.MEDIUM then
        return "MEDIUM"
    else
        return "LOW"
    end
end

-- Analyze behavior trends
function AntiCheatDetector._analyzeBehaviorTrends(profile)
    local trends = {
        suspicionTrend = "STABLE",
        mostCommonCheatType = nil,
        recentActivitySpike = false
    }
    
    if #profile.recentActivities >= 10 then
        -- Analyze suspicion trend over recent activities
        local recentAvg = 0
        local olderAvg = 0
        local midpoint = math.floor(#profile.recentActivities / 2)
        
        for i = 1, midpoint do
            olderAvg = olderAvg + profile.recentActivities[i].suspicionScore
        end
        olderAvg = olderAvg / midpoint
        
        for i = midpoint + 1, #profile.recentActivities do
            recentAvg = recentAvg + profile.recentActivities[i].suspicionScore
        end
        recentAvg = recentAvg / (#profile.recentActivities - midpoint)
        
        if recentAvg > olderAvg * 1.2 then
            trends.suspicionTrend = "INCREASING"
        elseif recentAvg < olderAvg * 0.8 then
            trends.suspicionTrend = "DECREASING"
        end
        
        -- Check for recent activity spike
        local recentCount = 0
        local cutoffTime = 0 - 3600 -- Last hour
        for _, activity in ipairs(profile.recentActivities) do
            if activity.timestamp > cutoffTime then
                recentCount = recentCount + 1
            end
        end
        
        trends.recentActivitySpike = recentCount > 5 -- More than 5 suspicious activities in last hour
    end
    
    return trends
end

-- Get detection statistics
function AntiCheatDetector.getStatistics()
    local totalSuspiciousActivities = AntiCheatDetector._getTableSize(AntiCheatDetector.suspiciousActivities)
    local totalProfiles = AntiCheatDetector._getTableSize(AntiCheatDetector.playerBehaviorProfiles)
    
    return {
        totalChecks = AntiCheatDetector.detectionMetrics.totalChecks,
        cheatsDetected = AntiCheatDetector.detectionMetrics.cheatsDetected,
        falsePositives = AntiCheatDetector.detectionMetrics.falsePositives,
        behaviorAnalyses = AntiCheatDetector.detectionMetrics.behaviorAnalyses,
        detectionRate = AntiCheatDetector.detectionMetrics.totalChecks > 0 and 
                       (AntiCheatDetector.detectionMetrics.cheatsDetected / AntiCheatDetector.detectionMetrics.totalChecks) or 0,
        activeRules = AntiCheatDetector._getTableSize(AntiCheatDetector.cheatDetectionRules),
        suspiciousActivities = totalSuspiciousActivities,
        playerProfiles = totalProfiles,
        suspicionThreshold = AntiCheatDetector.suspicionThreshold
    }
end

-- Get health status
function AntiCheatDetector.getHealth()
    local stats = AntiCheatDetector.getStatistics()
    
    -- Check if detection system is functioning properly
    if stats.totalChecks > 100 and stats.detectionRate > 0.8 then
        return "DEGRADED" -- Too many detections might indicate false positives
    end
    
    if AntiCheatDetector._getTableSize(AntiCheatDetector.cheatDetectionRules) < 3 then
        return "DEGRADED" -- Too few rules
    end
    
    return "HEALTHY"
end

-- Helper function
function AntiCheatDetector._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return AntiCheatDetector