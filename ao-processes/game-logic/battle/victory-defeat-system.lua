-- Victory/Defeat Detection System
-- Detects and handles battle end conditions with appropriate rewards
-- Integrates with existing battle state management and turn processing
-- Provides victory/defeat condition checking and forfeit/escape handling

local VictoryDefeatSystem = {}

-- Load dependencies
local BattleRNG = require("game-logic.rng.battle-rng")

-- Battle result types
VictoryDefeatSystem.BattleResult = {
    VICTORY = "victory",
    DEFEAT = "defeat", 
    FORFEIT = "forfeit",
    ESCAPE = "escape",
    DRAW = "draw",
    NO_RESULT = "no_result"
}

-- Escape/forfeit outcome types
VictoryDefeatSystem.EscapeOutcome = {
    SUCCESS = "success",
    FAILED = "failed",
    BLOCKED = "blocked"
}

-- Initialize victory/defeat system
-- @param battleSeed: Deterministic RNG seed for escape calculations
-- @return: Success status
function VictoryDefeatSystem.init(battleSeed)
    if battleSeed then
        BattleRNG.initSeed(battleSeed)
    end
    return true, "Victory/defeat system initialized"
end

-- Check if player has any usable Pokemon remaining
-- @param playerParty: Player's Pokemon party
-- @return: Boolean indicating if player can continue
function VictoryDefeatSystem.canPlayerContinue(playerParty)
    if not playerParty or #playerParty == 0 then
        return false
    end
    
    for _, pokemon in ipairs(playerParty) do
        if pokemon and not pokemon.fainted and pokemon.currentHP and pokemon.currentHP > 0 then
            return true
        end
    end
    
    return false
end

-- Check if enemy has any usable Pokemon remaining  
-- @param enemyParty: Enemy's Pokemon party
-- @return: Boolean indicating if enemy can continue
function VictoryDefeatSystem.canEnemyContinue(enemyParty)
    if not enemyParty or #enemyParty == 0 then
        return false
    end
    
    for _, pokemon in ipairs(enemyParty) do
        if pokemon and not pokemon.fainted and pokemon.currentHP and pokemon.currentHP > 0 then
            return true
        end
    end
    
    return false
end

-- Check all victory and defeat conditions
-- @param battleState: Current battle state with parties and conditions
-- @return: Battle result table or nil if battle continues
function VictoryDefeatSystem.checkBattleEndConditions(battleState)
    if not battleState or not battleState.playerParty or not battleState.enemyParty then
        return nil
    end
    
    local playerCanContinue = VictoryDefeatSystem.canPlayerContinue(battleState.playerParty)
    local enemyCanContinue = VictoryDefeatSystem.canEnemyContinue(battleState.enemyParty)
    
    -- Check for victory condition (opponent has no usable Pokemon)
    if not enemyCanContinue and playerCanContinue then
        return {
            result = VictoryDefeatSystem.BattleResult.VICTORY,
            reason = "All enemy Pokemon fainted",
            timestamp = os.time(),
            turn = battleState.turn or 0,
            battleId = battleState.battleId
        }
    end
    
    -- Check for defeat condition (player has no usable Pokemon)  
    if not playerCanContinue and enemyCanContinue then
        return {
            result = VictoryDefeatSystem.BattleResult.DEFEAT,
            reason = "All player Pokemon fainted", 
            timestamp = os.time(),
            turn = battleState.turn or 0,
            battleId = battleState.battleId
        }
    end
    
    -- Check for draw condition (both sides have no usable Pokemon)
    if not playerCanContinue and not enemyCanContinue then
        return {
            result = VictoryDefeatSystem.BattleResult.DRAW,
            reason = "All Pokemon from both sides fainted",
            timestamp = os.time(),
            turn = battleState.turn or 0,
            battleId = battleState.battleId
        }
    end
    
    -- Battle continues if both sides have usable Pokemon
    return nil
end

-- Process forfeit attempt with validation
-- @param battleState: Current battle state
-- @param playerId: ID of player attempting forfeit
-- @return: Forfeit result with success status
function VictoryDefeatSystem.processForfeit(battleState, playerId)
    if not battleState then
        return {
            success = false,
            outcome = VictoryDefeatSystem.EscapeOutcome.FAILED,
            message = "Invalid battle state for forfeit",
            battleResult = nil
        }
    end
    
    -- Forfeit is always successful in battle context
    local battleResult = {
        result = VictoryDefeatSystem.BattleResult.FORFEIT,
        reason = "Player forfeited the battle",
        timestamp = os.time(),
        turn = battleState.turn or 0,
        battleId = battleState.battleId,
        forfeitedBy = playerId
    }
    
    return {
        success = true,
        outcome = VictoryDefeatSystem.EscapeOutcome.SUCCESS,
        message = "Battle forfeited successfully",
        battleResult = battleResult
    }
end

-- Process escape attempt with success rate calculation
-- @param battleState: Current battle state
-- @param playerPokemon: Pokemon attempting escape
-- @param enemyPokemon: Current enemy Pokemon
-- @return: Escape result with success/failure status
function VictoryDefeatSystem.processEscape(battleState, playerPokemon, enemyPokemon)
    if not battleState or not playerPokemon then
        return {
            success = false,
            outcome = VictoryDefeatSystem.EscapeOutcome.FAILED,
            message = "Invalid escape parameters",
            battleResult = nil,
            escapeChance = 0
        }
    end
    
    -- Calculate escape success rate based on speed difference
    local escapeChance = VictoryDefeatSystem.calculateEscapeChance(playerPokemon, enemyPokemon, battleState.turn or 1)
    
    -- Use battle RNG for deterministic escape outcome
    local escapeRoll = BattleRNG.random(1, 100)
    local escapeSucceeded = escapeRoll <= escapeChance
    
    if escapeSucceeded then
        local battleResult = {
            result = VictoryDefeatSystem.BattleResult.ESCAPE,
            reason = "Successfully escaped from battle",
            timestamp = os.time(),
            turn = battleState.turn or 0,
            battleId = battleState.battleId,
            escapeChance = escapeChance,
            escapeRoll = escapeRoll
        }
        
        return {
            success = true,
            outcome = VictoryDefeatSystem.EscapeOutcome.SUCCESS,
            message = "Escaped successfully",
            battleResult = battleResult,
            escapeChance = escapeChance,
            escapeRoll = escapeRoll
        }
    else
        return {
            success = false,
            outcome = VictoryDefeatSystem.EscapeOutcome.FAILED,
            message = "Could not escape",
            battleResult = nil,
            escapeChance = escapeChance,
            escapeRoll = escapeRoll
        }
    end
end

-- Calculate escape chance based on speed and attempts
-- Formula matches TypeScript implementation for behavioral parity
-- @param playerPokemon: Pokemon attempting escape
-- @param enemyPokemon: Opposing Pokemon (optional)
-- @param escapeAttempts: Number of previous escape attempts
-- @return: Escape success percentage (0-100)
function VictoryDefeatSystem.calculateEscapeChance(playerPokemon, enemyPokemon, escapeAttempts)
    if not playerPokemon then
        return 0
    end
    
    -- Base escape chance starts at 25%
    local baseEscapeChance = 25
    local escapeAttemptBonus = (escapeAttempts - 1) * 10  -- +10% per previous attempt
    
    local escapeChance = baseEscapeChance + escapeAttemptBonus
    
    -- If enemy Pokemon available, factor in speed difference
    if enemyPokemon and enemyPokemon.stats and playerPokemon.stats then
        local playerSpeed = playerPokemon.stats.speed or 50
        local enemySpeed = enemyPokemon.stats.speed or 50
        
        -- Speed-based modifier: faster Pokemon escape easier
        if playerSpeed > enemySpeed then
            local speedRatio = playerSpeed / enemySpeed
            escapeChance = escapeChance + math.floor(speedRatio * 10)  -- Bonus for being faster
        elseif enemySpeed > playerSpeed then
            local speedRatio = enemySpeed / playerSpeed  
            escapeChance = escapeChance - math.floor(speedRatio * 5)   -- Penalty for being slower
        end
    end
    
    -- Cap escape chance between 5% and 100%
    escapeChance = math.max(5, math.min(100, escapeChance))
    
    return escapeChance
end

-- Get battle end condition summary for display
-- @param battleResult: Battle result object from checkBattleEndConditions
-- @return: Human-readable battle end summary
function VictoryDefeatSystem.getBattleEndSummary(battleResult)
    if not battleResult then
        return "Battle continues"
    end
    
    local summaries = {
        [VictoryDefeatSystem.BattleResult.VICTORY] = "Victory! All enemy Pokemon have been defeated.",
        [VictoryDefeatSystem.BattleResult.DEFEAT] = "Defeat! All your Pokemon have fainted.",
        [VictoryDefeatSystem.BattleResult.DRAW] = "Draw! All Pokemon from both sides have fainted.",
        [VictoryDefeatSystem.BattleResult.FORFEIT] = "Battle was forfeited.",
        [VictoryDefeatSystem.BattleResult.ESCAPE] = "Successfully escaped from battle."
    }
    
    local summary = summaries[battleResult.result] or "Battle ended with unknown result"
    
    if battleResult.turn and battleResult.turn > 0 then
        summary = summary .. " (Turn " .. battleResult.turn .. ")"
    end
    
    return summary
end

-- Validate battle state for victory/defeat checking
-- @param battleState: Battle state to validate
-- @return: Validation result with success status and error message
function VictoryDefeatSystem.validateBattleState(battleState)
    if not battleState then
        return {
            valid = false,
            error = "Battle state is nil"
        }
    end
    
    if not battleState.playerParty or type(battleState.playerParty) ~= "table" then
        return {
            valid = false,
            error = "Invalid player party data"
        }
    end
    
    if not battleState.enemyParty or type(battleState.enemyParty) ~= "table" then
        return {
            valid = false,
            error = "Invalid enemy party data"
        }
    end
    
    if #battleState.playerParty == 0 then
        return {
            valid = false,
            error = "Player party is empty"
        }
    end
    
    if #battleState.enemyParty == 0 then
        return {
            valid = false,
            error = "Enemy party is empty"
        }
    end
    
    return {
        valid = true,
        error = nil
    }
end

return VictoryDefeatSystem