-- rng-validator.lua: Deterministic RNG Validation System
-- Validates battle seeds, RNG replay, and probability distributions

local RngValidator = {}

-- Constants
local RNG_ERRORS = {
    INVALID_SEED = "RNG_001",
    PROBABILITY_VIOLATION = "RNG_002",
    REPLAY_MISMATCH = "RNG_003",
    SEED_CORRUPTION = "RNG_004",
    IMPOSSIBLE_OUTCOME = "RNG_005"
}

-- Validate battle seed format and integrity
function RngValidator.validateBattleSeed(battleSeed)
    if not battleSeed then
        error({
            code = RNG_ERRORS.INVALID_SEED,
            message = "Battle seed is required",
            success = false
        })
    end
    
    if type(battleSeed) ~= "string" then
        error({
            code = RNG_ERRORS.INVALID_SEED,
            message = "Battle seed must be a string",
            success = false
        })
    end
    
    -- Check seed format (should be hex string of specific length)
    if not battleSeed:match("^[0-9a-fA-F]+$") or #battleSeed ~= 64 then
        error({
            code = RNG_ERRORS.INVALID_SEED,
            message = "Battle seed must be 64-character hex string",
            success = false
        })
    end
    
    return true
end

-- Validate RNG state tracking
function RngValidator.validateRngState(rngState, expectedCounter)
    if not rngState then
        error({
            code = RNG_ERRORS.SEED_CORRUPTION,
            message = "RNG state is required",
            success = false
        })
    end
    
    if not rngState.counter then
        error({
            code = RNG_ERRORS.SEED_CORRUPTION,
            message = "RNG counter is missing",
            success = false
        })
    end
    
    if expectedCounter and rngState.counter ~= expectedCounter then
        error({
            code = RNG_ERRORS.REPLAY_MISMATCH,
            message = string.format("RNG counter mismatch: expected %d, got %d", expectedCounter, rngState.counter),
            success = false
        })
    end
    
    return true
end

-- Validate probability distribution for battle outcomes
function RngValidator.validateProbabilityDistribution(outcomes, expectedProbability, sampleSize)
    if not outcomes or not expectedProbability or not sampleSize then
        error({
            code = RNG_ERRORS.PROBABILITY_VIOLATION,
            message = "Outcomes, expected probability and sample size required",
            success = false
        })
    end
    
    if sampleSize < 10 then
        return true -- Too small sample for meaningful validation
    end
    
    local successCount = 0
    for _, outcome in ipairs(outcomes) do
        if outcome.success then
            successCount = successCount + 1
        end
    end
    
    local actualProbability = successCount / sampleSize
    local tolerance = 0.2 -- 20% tolerance for probability validation
    
    if math.abs(actualProbability - expectedProbability) > tolerance then
        error({
            code = RNG_ERRORS.PROBABILITY_VIOLATION,
            message = string.format("Probability distribution violation: expected %.2f, got %.2f", expectedProbability, actualProbability),
            success = false
        })
    end
    
    return true
end

-- Validate battle replay using seed
function RngValidator.validateBattleReplay(originalBattle, replayBattle, battleSeed)
    if not originalBattle or not replayBattle or not battleSeed then
        error({
            code = RNG_ERRORS.REPLAY_MISMATCH,
            message = "Original battle, replay battle and seed required",
            success = false
        })
    end
    
    RngValidator.validateBattleSeed(battleSeed)
    
    -- Validate key battle outcomes match
    if originalBattle.winner ~= replayBattle.winner then
        error({
            code = RNG_ERRORS.REPLAY_MISMATCH,
            message = "Battle winner mismatch in replay",
            success = false
        })
    end
    
    if originalBattle.turnCount ~= replayBattle.turnCount then
        error({
            code = RNG_ERRORS.REPLAY_MISMATCH,
            message = "Battle turn count mismatch in replay",
            success = false
        })
    end
    
    -- Validate critical hits match (deterministic with seed)
    local originalCrits = originalBattle.criticalHits or {}
    local replayCrits = replayBattle.criticalHits or {}
    
    if #originalCrits ~= #replayCrits then
        error({
            code = RNG_ERRORS.REPLAY_MISMATCH,
            message = "Critical hit count mismatch in replay",
            success = false
        })
    end
    
    for i, originalCrit in ipairs(originalCrits) do
        local replayCrit = replayCrits[i]
        if not replayCrit or originalCrit.turn ~= replayCrit.turn then
            error({
                code = RNG_ERRORS.REPLAY_MISMATCH,
                message = "Critical hit timing mismatch in replay",
                success = false
            })
        end
    end
    
    return true
end

-- Validate impossible RNG outcomes
function RngValidator.validateOutcomePossibility(outcome, context)
    if not outcome or not context then
        error({
            code = RNG_ERRORS.IMPOSSIBLE_OUTCOME,
            message = "Outcome and context required for validation",
            success = false
        })
    end
    
    -- Validate critical hit impossibility (0% crit rate should never crit)
    if outcome.type == "critical_hit" and context.critRate == 0 then
        error({
            code = RNG_ERRORS.IMPOSSIBLE_OUTCOME,
            message = "Critical hit impossible with 0% crit rate",
            success = false
        })
    end
    
    -- Validate miss impossibility (100% accuracy should never miss)
    if outcome.type == "miss" and context.accuracy == 1.0 then
        error({
            code = RNG_ERRORS.IMPOSSIBLE_OUTCOME,
            message = "Miss impossible with 100% accuracy",
            success = false
        })
    end
    
    -- Validate damage ranges
    if outcome.type == "damage" and context.expectedDamageRange then
        local minDamage = context.expectedDamageRange.min
        local maxDamage = context.expectedDamageRange.max
        
        if outcome.damage < minDamage or outcome.damage > maxDamage then
            error({
                code = RNG_ERRORS.IMPOSSIBLE_OUTCOME,
                message = string.format("Damage %d outside possible range %d-%d", outcome.damage, minDamage, maxDamage),
                success = false
            })
        end
    end
    
    return true
end

-- Get RNG validation error information
function RngValidator.getErrorInfo(errorCode)
    local errorMessages = {
        [RNG_ERRORS.INVALID_SEED] = "Battle seed validation failed",
        [RNG_ERRORS.PROBABILITY_VIOLATION] = "Probability distribution validation failed",
        [RNG_ERRORS.REPLAY_MISMATCH] = "Battle replay validation failed",
        [RNG_ERRORS.SEED_CORRUPTION] = "RNG state corruption detected",
        [RNG_ERRORS.IMPOSSIBLE_OUTCOME] = "Impossible RNG outcome detected"
    }
    
    return {
        code = errorCode,
        message = errorMessages[errorCode] or "Unknown RNG validation error",
        category = "RNG"
    }
end

return RngValidator