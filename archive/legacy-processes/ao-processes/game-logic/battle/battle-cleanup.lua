-- Battle Cleanup System
-- Resets temporary battle state while preserving persistent Pokemon and player data
-- Restores Pokemon to non-battle state with proper status and modification cleanup
-- Integrates with battle state persistence system for clean battle transitions

local BattleCleanup = {}

-- Load dependencies  
local BattleStateManager = require("game-logic.battle.battle-state-manager")

-- Cleanup operation types
BattleCleanup.CleanupType = {
    FULL_CLEANUP = "full",          -- Complete battle cleanup
    PARTIAL_CLEANUP = "partial",    -- Preserve some battle data
    PRESERVE_STATS = "preserve"     -- Keep battle statistics
}

-- Cleanup phases
BattleCleanup.CleanupPhase = {
    PRE_CLEANUP = "pre_cleanup",
    POKEMON_CLEANUP = "pokemon_cleanup", 
    BATTLE_STATE_CLEANUP = "battle_state_cleanup",
    PERSISTENCE_CLEANUP = "persistence_cleanup",
    POST_CLEANUP = "post_cleanup"
}

-- Initialize battle cleanup system
-- @return: Success status
function BattleCleanup.init()
    return true, "Battle cleanup system initialized"
end

-- Execute complete battle cleanup after battle conclusion
-- @param battleState: Battle state to clean up
-- @param battleResult: Battle conclusion result
-- @param cleanupType: Type of cleanup to perform
-- @return: Cleanup results with restored state
function BattleCleanup.executeBattleCleanup(battleState, battleResult, cleanupType)
    if not battleState then
        return {success = false, error = "Invalid battle state for cleanup"}
    end
    
    cleanupType = cleanupType or BattleCleanup.CleanupType.FULL_CLEANUP
    
    local cleanupResults = {
        success = true,
        battleId = battleState.battleId,
        battleResult = battleResult and battleResult.result or "unknown",
        cleanupType = cleanupType,
        phases = {},
        restoredPokemon = {},
        preservedData = {},
        errors = {}
    }
    
    -- Execute cleanup phases in order
    local phases = {
        BattleCleanup.CleanupPhase.PRE_CLEANUP,
        BattleCleanup.CleanupPhase.POKEMON_CLEANUP,
        BattleCleanup.CleanupPhase.BATTLE_STATE_CLEANUP,
        BattleCleanup.CleanupPhase.PERSISTENCE_CLEANUP,
        BattleCleanup.CleanupPhase.POST_CLEANUP
    }
    
    for _, phase in ipairs(phases) do
        local phaseResult = BattleCleanup.executeCleanupPhase(battleState, battleResult, phase, cleanupType)
        table.insert(cleanupResults.phases, phaseResult)
        
        if not phaseResult.success then
            table.insert(cleanupResults.errors, phaseResult.error or "Unknown phase error")
        end
        
        -- Merge phase-specific results
        if phaseResult.restoredPokemon then
            for _, pokemon in ipairs(phaseResult.restoredPokemon) do
                table.insert(cleanupResults.restoredPokemon, pokemon)
            end
        end
        
        if phaseResult.preservedData then
            for key, value in pairs(phaseResult.preservedData) do
                cleanupResults.preservedData[key] = value
            end
        end
    end
    
    -- Mark cleanup completion
    cleanupResults.completedAt = os.time()
    cleanupResults.success = #cleanupResults.errors == 0
    
    return cleanupResults
end

-- Execute individual cleanup phase
-- @param battleState: Battle state being cleaned
-- @param battleResult: Battle conclusion result  
-- @param phase: Cleanup phase to execute
-- @param cleanupType: Type of cleanup being performed
-- @return: Phase execution results
function BattleCleanup.executeCleanupPhase(battleState, battleResult, phase, cleanupType)
    local phaseResult = {
        phase = phase,
        success = true,
        startTime = os.time(),
        restoredPokemon = {},
        preservedData = {},
        error = nil
    }
    
    if phase == BattleCleanup.CleanupPhase.PRE_CLEANUP then
        phaseResult = BattleCleanup.executePreCleanup(battleState, battleResult, cleanupType)
        
    elseif phase == BattleCleanup.CleanupPhase.POKEMON_CLEANUP then
        phaseResult = BattleCleanup.executePokemonCleanup(battleState, battleResult, cleanupType)
        
    elseif phase == BattleCleanup.CleanupPhase.BATTLE_STATE_CLEANUP then
        phaseResult = BattleCleanup.executeBattleStateCleanup(battleState, battleResult, cleanupType)
        
    elseif phase == BattleCleanup.CleanupPhase.PERSISTENCE_CLEANUP then
        phaseResult = BattleCleanup.executePersistenceCleanup(battleState, battleResult, cleanupType)
        
    elseif phase == BattleCleanup.CleanupPhase.POST_CLEANUP then
        phaseResult = BattleCleanup.executePostCleanup(battleState, battleResult, cleanupType)
    else
        phaseResult.success = false
        phaseResult.error = "Unknown cleanup phase: " .. tostring(phase)
    end
    
    phaseResult.phase = phase
    phaseResult.duration = os.time() - phaseResult.startTime
    
    return phaseResult
end

-- Execute pre-cleanup phase (preparation and validation)
-- @param battleState: Battle state being cleaned
-- @param battleResult: Battle conclusion result
-- @param cleanupType: Type of cleanup being performed
-- @return: Pre-cleanup results
function BattleCleanup.executePreCleanup(battleState, battleResult, cleanupType)
    local result = {
        success = true,
        preservedData = {},
        error = nil
    }
    
    -- Validate battle state before cleanup
    if not battleState.battleId then
        result.success = false
        result.error = "Missing battle ID"
        return result
    end
    
    if not battleState.playerParty or not battleState.enemyParty then
        result.success = false  
        result.error = "Missing Pokemon party data"
        return result
    end
    
    -- Preserve battle statistics if requested
    if cleanupType == BattleCleanup.CleanupType.PRESERVE_STATS then
        result.preservedData.battleStats = battleState.battleStats or {}
        result.preservedData.participationData = battleState.participationData or {}
        result.preservedData.turnHistory = battleState.turnHistory or {}
    end
    
    -- Preserve battle result information
    result.preservedData.battleResult = battleResult
    result.preservedData.battleId = battleState.battleId
    result.preservedData.originalBattleType = battleState.battleType
    
    return result
end

-- Execute Pokemon cleanup phase (restore Pokemon to non-battle state)
-- @param battleState: Battle state being cleaned
-- @param battleResult: Battle conclusion result
-- @param cleanupType: Type of cleanup being performed
-- @return: Pokemon cleanup results
function BattleCleanup.executePokemonCleanup(battleState, battleResult, cleanupType)
    local result = {
        success = true,
        restoredPokemon = {},
        error = nil
    }
    
    -- Clean up player Pokemon
    for _, pokemon in ipairs(battleState.playerParty or {}) do
        local restoredPokemon, error = BattleCleanup.restorePokemonState(pokemon, cleanupType)
        
        if restoredPokemon then
            table.insert(result.restoredPokemon, {
                pokemonId = pokemon.id,
                pokemonName = pokemon.name,
                restored = true,
                preservedStats = cleanupType == BattleCleanup.CleanupType.PRESERVE_STATS
            })
        else
            result.success = false
            result.error = error or "Failed to restore Pokemon state"
        end
    end
    
    -- Enemy Pokemon don't need restoration (they're temporary)
    -- But we can record their final state for statistics if needed
    if cleanupType == BattleCleanup.CleanupType.PRESERVE_STATS then
        local enemyFinalStates = {}
        for _, pokemon in ipairs(battleState.enemyParty or {}) do
            table.insert(enemyFinalStates, {
                pokemonId = pokemon.id,
                name = pokemon.name,
                fainted = pokemon.fainted,
                finalHP = pokemon.currentHP or 0
            })
        end
        result.preservedData = {enemyFinalStates = enemyFinalStates}
    end
    
    return result
end

-- Restore individual Pokemon to non-battle state
-- @param pokemon: Pokemon instance to restore
-- @param cleanupType: Type of cleanup being performed
-- @return: Restored Pokemon instance and error status
function BattleCleanup.restorePokemonState(pokemon, cleanupType)
    if not pokemon then
        return nil, "Pokemon instance is nil"
    end
    
    -- Preserve important persistent data
    local persistentData = {
        id = pokemon.id,
        name = pokemon.name,
        speciesId = pokemon.speciesId,
        level = pokemon.level,
        exp = pokemon.exp,
        friendship = pokemon.friendship,
        nature = pokemon.nature,
        ability = pokemon.ability,
        moves = pokemon.moves,
        ivs = pokemon.ivs,
        evs = pokemon.evs,
        heldItem = pokemon.heldItem,
        isShiny = pokemon.isShiny
    }
    
    -- Preserve battle statistics if requested
    if cleanupType == BattleCleanup.CleanupType.PRESERVE_STATS then
        persistentData.battleStats = pokemon.battleStats
        persistentData.battleHistory = pokemon.battleHistory
        persistentData.lastBattleAt = pokemon.lastBattleAt
    end
    
    -- Clear temporary battle data
    pokemon.battleData = nil
    pokemon.statStages = {
        attack = 0,
        defense = 0,
        spAttack = 0,
        spDefense = 0,
        speed = 0,
        accuracy = 0,
        evasion = 0
    }
    
    -- Clear temporary status effects (preserve permanent conditions)
    if pokemon.status and pokemon.status ~= "HEALTHY" then
        -- Clear temporary status conditions like sleep, paralysis
        local temporaryStatuses = {"SLEEP", "FREEZE", "PARALYSIS", "BURN", "POISON", "CONFUSION"}
        for _, tempStatus in ipairs(temporaryStatuses) do
            if pokemon.status == tempStatus then
                pokemon.status = "HEALTHY"
                pokemon.statusTurns = 0
                break
            end
        end
    end
    
    -- Clear battle-specific modifications
    pokemon.battleModifications = nil
    pokemon.turnsPaused = nil
    pokemon.lastMoveTurn = nil
    pokemon.lastMoveUsed = nil
    
    -- Restore persistent data
    for key, value in pairs(persistentData) do
        pokemon[key] = value
    end
    
    -- Ensure HP is within valid bounds (but don't heal fainted Pokemon)
    if pokemon.stats and pokemon.stats.maxHp then
        if pokemon.currentHP and not pokemon.fainted then
            pokemon.currentHP = math.max(0, math.min(pokemon.currentHP, pokemon.stats.maxHp))
        elseif pokemon.fainted then
            pokemon.currentHP = 0
        end
    end
    
    return pokemon, nil
end

-- Execute battle state cleanup phase (clear battle-specific data structures)
-- @param battleState: Battle state being cleaned
-- @param battleResult: Battle conclusion result
-- @param cleanupType: Type of cleanup being performed
-- @return: Battle state cleanup results
function BattleCleanup.executeBattleStateCleanup(battleState, battleResult, cleanupType)
    local result = {
        success = true,
        preservedData = {},
        error = nil
    }
    
    -- Preserve critical data before cleanup
    if cleanupType == BattleCleanup.CleanupType.PRESERVE_STATS then
        result.preservedData.finalTurnOrder = battleState.turnOrder
        result.preservedData.finalBattleConditions = battleState.battleConditions
        result.preservedData.totalTurns = battleState.turn
    end
    
    -- Clear temporary battle state
    battleState.turnOrder = {}
    battleState.currentAction = nil
    battleState.pendingActions = {}
    battleState.interruptQueue = {}
    battleState.turnCommands = {}
    battleState.multiTurnData = {}
    
    -- Reset battle phase
    if BattleStateManager and BattleStateManager.BattlePhase then
        battleState.phase = BattleStateManager.BattlePhase.BATTLE_END
    end
    
    -- Clear battle conditions (weather, terrain, etc.)
    if battleState.battleConditions then
        battleState.battleConditions.weather = "NONE"
        battleState.battleConditions.weatherDuration = 0
        battleState.battleConditions.terrain = "NONE"
        battleState.battleConditions.terrainDuration = 0
        battleState.battleConditions.trickRoom = 0
        battleState.battleConditions.tailwind = {[0] = 0, [1] = 0}
    end
    
    -- Clear active Pokemon references (battle is over)
    battleState.activePlayer = {}
    battleState.activeEnemy = {}
    
    return result
end

-- Execute persistence cleanup phase (clear temporary files and sessions)
-- @param battleState: Battle state being cleaned
-- @param battleResult: Battle conclusion result
-- @param cleanupType: Type of cleanup being performed
-- @return: Persistence cleanup results
function BattleCleanup.executePersistenceCleanup(battleState, battleResult, cleanupType)
    local result = {
        success = true,
        preservedData = {},
        error = nil
    }
    
    -- Mark battle session for cleanup (this would integrate with session management)
    if battleState.battleId then
        result.preservedData.cleanedBattleId = battleState.battleId
        -- In actual implementation, this would remove the battle from active session storage
    end
    
    -- Preserve battle replay data if requested
    if cleanupType == BattleCleanup.CleanupType.PRESERVE_STATS then
        result.preservedData.battleReplayData = {
            battleId = battleState.battleId,
            seed = battleState.battleSeed,
            turnHistory = battleState.turnHistory or {},
            finalResult = battleResult
        }
    else
        -- Clear replay data for memory efficiency
        battleState.turnHistory = {}
        battleState.battleEvents = {}
    end
    
    return result
end

-- Execute post-cleanup phase (final validation and cleanup completion)
-- @param battleState: Battle state being cleaned
-- @param battleResult: Battle conclusion result
-- @param cleanupType: Type of cleanup being performed
-- @return: Post-cleanup results
function BattleCleanup.executePostCleanup(battleState, battleResult, cleanupType)
    local result = {
        success = true,
        preservedData = {},
        error = nil
    }
    
    -- Validate cleanup completion
    local validation = BattleCleanup.validateCleanupCompletion(battleState, cleanupType)
    
    if not validation.valid then
        result.success = false
        result.error = "Cleanup validation failed: " .. (validation.error or "Unknown error")
        return result
    end
    
    -- Record cleanup completion
    result.preservedData.cleanupCompletedAt = os.time()
    result.preservedData.cleanupType = cleanupType
    result.preservedData.validationPassed = true
    
    return result
end

-- Validate that cleanup was completed successfully
-- @param battleState: Cleaned battle state
-- @param cleanupType: Type of cleanup that was performed
-- @return: Validation result
function BattleCleanup.validateCleanupCompletion(battleState, cleanupType)
    if not battleState then
        return {valid = false, error = "Battle state is nil after cleanup"}
    end
    
    -- Check that temporary data structures are cleared
    if #(battleState.turnOrder or {}) > 0 then
        return {valid = false, error = "Turn order not cleared"}
    end
    
    if #(battleState.pendingActions or {}) > 0 then
        return {valid = false, error = "Pending actions not cleared"}
    end
    
    if #(battleState.interruptQueue or {}) > 0 then
        return {valid = false, error = "Interrupt queue not cleared"}
    end
    
    -- Check that Pokemon are in valid non-battle state
    for _, pokemon in ipairs(battleState.playerParty or {}) do
        if pokemon.battleData then
            return {valid = false, error = "Pokemon battle data not cleared: " .. (pokemon.name or "unknown")}
        end
        
        -- Validate stat stages are reset
        if pokemon.statStages then
            for stat, stage in pairs(pokemon.statStages) do
                if stage ~= 0 then
                    return {valid = false, error = "Stat stages not reset for " .. (pokemon.name or "unknown")}
                end
            end
        end
    end
    
    return {valid = true, error = nil}
end

-- Get cleanup summary for logging/display
-- @param cleanupResults: Results from executeBattleCleanup
-- @return: Human-readable cleanup summary
function BattleCleanup.getCleanupSummary(cleanupResults)
    if not cleanupResults then
        return "No cleanup results available"
    end
    
    local summary = string.format(
        "Battle cleanup %s for %s (Type: %s)",
        cleanupResults.success and "completed" or "failed",
        cleanupResults.battleId or "unknown battle",
        cleanupResults.cleanupType or "unknown"
    )
    
    if cleanupResults.restoredPokemon and #cleanupResults.restoredPokemon > 0 then
        summary = summary .. string.format(" | Pokemon restored: %d", #cleanupResults.restoredPokemon)
    end
    
    if cleanupResults.errors and #cleanupResults.errors > 0 then
        summary = summary .. string.format(" | Errors: %d", #cleanupResults.errors)
    end
    
    return summary
end

return BattleCleanup