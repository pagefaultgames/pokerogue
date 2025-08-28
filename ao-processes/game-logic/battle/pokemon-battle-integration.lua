--[[
Pokemon Battle System Integration
Integrates Pokemon instances with battle mechanics

Features:
- Battle participation validation and setup
- Experience gain from battle results
- Battle state management for Pokemon instances
- Move usage and PP tracking during battles
- Status effect application and management
--]]

local BattleIntegration = {}

-- Import dependencies
local PokemonManager = require("game-logic.pokemon.pokemon-manager")
local ExperienceSystem = require("game-logic.progression.experience-system")
local MoveManager = require("game-logic.pokemon.move-manager")
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")

-- Constants
local BATTLE_STATES = {
    PREPARING = "preparing",
    ACTIVE = "active",
    FINISHED = "finished",
    CANCELLED = "cancelled"
}

local BATTLE_RESULTS = {
    WIN = "WIN",
    LOSS = "LOSS",
    DRAW = "DRAW"
}

-- Battle Participation Functions

-- Add Pokemon to battle
-- @param battleId: Battle ID
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, battle participation result
function BattleIntegration.addPokemonToBattle(battleId, pokemonId, playerId)
    if not battleId or not pokemonId or not playerId then
        return nil, "Battle ID, Pokemon ID, and player ID required"
    end
    
    -- Get Pokemon with ownership validation
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    -- Validate Pokemon is ready for battle
    if pokemon.stats.hp <= 0 then
        return pokemon, {
            success = false,
            reason = "fainted",
            message = "Pokemon has fainted and cannot battle"
        }
    end
    
    -- Check for status effects that prevent battle participation
    if pokemon.statusEffect and (pokemon.statusEffect == "frozen" or pokemon.statusEffect == "sleep") then
        -- Allow battle participation but note the status
    end
    
    -- Initialize battle data if needed
    if not pokemon.battleData then
        pokemon.battleData = {}
    end
    
    -- Set battle participation data
    pokemon.battleData = {
        battleId = battleId,
        battleState = BATTLE_STATES.PREPARING,
        joinedAt = os.time(),
        currentHP = pokemon.stats.hp,
        maxHP = pokemon.stats.maxHp,
        tempStatStages = {
            attack = 0,
            defense = 0,
            spAttack = 0,
            spDefense = 0,
            speed = 0
        },
        tempAbilityChanges = {},
        moveUsageThisBattle = {},
        actionsThisTurn = {}
    }
    
    -- Store in battle index
    PokemonStorage.addToBattle(battleId, pokemonId)
    
    -- Update Pokemon storage
    PokemonStorage.update(pokemonId, pokemon)
    
    return pokemon, {
        success = true,
        battleId = battleId,
        message = "Pokemon added to battle successfully"
    }
end

-- Remove Pokemon from battle
-- @param battleId: Battle ID
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, removal result
function BattleIntegration.removePokemonFromBattle(battleId, pokemonId, playerId)
    if not battleId or not pokemonId or not playerId then
        return nil, "Battle ID, Pokemon ID, and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    -- Clear battle-specific data
    if pokemon.battleData and pokemon.battleData.battleId == battleId then
        -- Preserve battle history
        if not pokemon.battleHistory then
            pokemon.battleHistory = {}
        end
        
        table.insert(pokemon.battleHistory, {
            battleId = battleId,
            joinedAt = pokemon.battleData.joinedAt,
            leftAt = os.time(),
            finalHP = pokemon.stats.hp,
            movesUsed = pokemon.battleData.moveUsageThisBattle,
            outcome = "incomplete"
        })
        
        pokemon.battleData = nil
    end
    
    -- Remove from battle index
    PokemonStorage.removeFromBattle(battleId, pokemonId)
    
    -- Update Pokemon storage
    PokemonStorage.update(pokemonId, pokemon)
    
    return pokemon, {
        success = true,
        message = "Pokemon removed from battle"
    }
end

-- Battle State Management

-- Update Pokemon battle state
-- @param pokemonId: Pokemon instance ID
-- @param battleState: New battle state
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, state change result
function BattleIntegration.updateBattleState(pokemonId, battleState, playerId)
    if not pokemonId or not battleState or not playerId then
        return nil, "Pokemon ID, battle state, and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    if not pokemon.battleData then
        return pokemon, {
            success = false,
            reason = "not_in_battle",
            message = "Pokemon is not in a battle"
        }
    end
    
    local oldState = pokemon.battleData.battleState
    pokemon.battleData.battleState = battleState
    
    -- Update timestamps for state changes
    if battleState == BATTLE_STATES.ACTIVE and oldState ~= BATTLE_STATES.ACTIVE then
        pokemon.battleData.battleStartedAt = os.time()
    elseif battleState == BATTLE_STATES.FINISHED and oldState ~= BATTLE_STATES.FINISHED then
        pokemon.battleData.battleEndedAt = os.time()
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, pokemon)
    
    return pokemon, {
        success = true,
        oldState = oldState,
        newState = battleState,
        message = "Battle state updated successfully"
    }
end

-- Apply temporary battle modifications
-- @param pokemonId: Pokemon instance ID
-- @param modifications: Temporary battle modifications
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, application result
function BattleIntegration.applyBattleEffects(pokemonId, modifications, playerId)
    if not pokemonId or not modifications or not playerId then
        return nil, "Pokemon ID, modifications, and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    if not pokemon.battleData then
        return pokemon, {
            success = false,
            reason = "not_in_battle",
            message = "Pokemon is not in a battle"
        }
    end
    
    local applied = {}
    
    -- Apply stat stage changes
    if modifications.statStages then
        for stat, change in pairs(modifications.statStages) do
            if pokemon.battleData.tempStatStages[stat] then
                local oldStage = pokemon.battleData.tempStatStages[stat]
                local newStage = math.max(-6, math.min(6, oldStage + change))
                pokemon.battleData.tempStatStages[stat] = newStage
                
                table.insert(applied, {
                    type = "stat_stage",
                    stat = stat,
                    oldStage = oldStage,
                    newStage = newStage
                })
            end
        end
    end
    
    -- Apply status effects
    if modifications.statusEffect then
        local oldStatus = pokemon.statusEffect
        pokemon.statusEffect = modifications.statusEffect
        
        table.insert(applied, {
            type = "status_effect",
            oldStatus = oldStatus,
            newStatus = modifications.statusEffect
        })
    end
    
    -- Apply HP changes
    if modifications.hpChange then
        local oldHP = pokemon.stats.hp
        local newHP = math.max(0, math.min(pokemon.stats.maxHp, oldHP + modifications.hpChange))
        pokemon.stats.hp = newHP
        
        table.insert(applied, {
            type = "hp_change",
            oldHP = oldHP,
            newHP = newHP,
            change = modifications.hpChange
        })
        
        -- Update battle data HP tracking
        pokemon.battleData.currentHP = newHP
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, pokemon)
    
    return pokemon, {
        success = true,
        applied = applied,
        message = "Battle effects applied successfully"
    }
end

-- Move Usage and PP Management

-- Use move in battle context
-- @param pokemonId: Pokemon instance ID
-- @param moveSlot: Move slot (1-4)
-- @param playerId: Player ID for ownership validation
-- @param battleContext: Battle context information
-- @return: Updated Pokemon, move usage result
function BattleIntegration.useMoveInBattle(pokemonId, moveSlot, playerId, battleContext)
    if not pokemonId or not moveSlot or not playerId then
        return nil, "Pokemon ID, move slot, and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    if not pokemon.battleData then
        return pokemon, {
            success = false,
            reason = "not_in_battle",
            message = "Pokemon is not in a battle"
        }
    end
    
    -- Use move through MoveManager
    local updatedPokemon, result = MoveManager.useMove(pokemon, moveSlot)
    
    if not result.success then
        return updatedPokemon, result
    end
    
    -- Track move usage in battle
    local moveId = result.move.id
    if not pokemon.battleData.moveUsageThisBattle[moveId] then
        pokemon.battleData.moveUsageThisBattle[moveId] = 0
    end
    pokemon.battleData.moveUsageThisBattle[moveId] = pokemon.battleData.moveUsageThisBattle[moveId] + 1
    
    -- Add to turn actions
    table.insert(pokemon.battleData.actionsThisTurn, {
        type = "move_used",
        moveId = moveId,
        moveSlot = moveSlot,
        timestamp = os.time(),
        context = battleContext or {}
    })
    
    -- Update storage
    PokemonStorage.update(pokemonId, updatedPokemon)
    
    return updatedPokemon, {
        success = true,
        move = result.move,
        ppRemaining = result.ppRemaining,
        usageCount = pokemon.battleData.moveUsageThisBattle[moveId],
        message = "Move used in battle successfully"
    }
end

-- Clear turn-based battle data
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon
function BattleIntegration.clearTurnData(pokemonId, playerId)
    if not pokemonId or not playerId then
        return nil, "Pokemon ID and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    if pokemon.battleData then
        pokemon.battleData.actionsThisTurn = {}
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, pokemon)
    
    return pokemon
end

-- Battle Result Processing

-- Process battle result and apply experience/friendship
-- @param pokemonId: Pokemon instance ID
-- @param battleResult: Battle outcome information
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, result processing info
function BattleIntegration.processBattleResult(pokemonId, battleResult, playerId)
    if not pokemonId or not battleResult or not playerId then
        return nil, "Pokemon ID, battle result, and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    if not pokemon.battleData then
        return pokemon, {
            success = false,
            reason = "not_in_battle",
            message = "Pokemon was not in a battle"
        }
    end
    
    local result = {
        success = true,
        pokemonId = pokemonId,
        battleId = pokemon.battleData.battleId,
        outcome = battleResult.outcome,
        rewards = {}
    }
    
    -- Apply experience gain if provided
    if battleResult.expGained and battleResult.expGained > 0 then
        local battleContext = {
            battleId = pokemon.battleData.battleId,
            battleType = battleResult.battleType or "WILD",
            opponent = battleResult.opponent
        }
        
        local updatedPokemon, levelUpData = ExperienceSystem.gainExperience(pokemon, battleResult.expGained, battleContext)
        pokemon = updatedPokemon
        
        result.rewards.experience = {
            gained = battleResult.expGained,
            levelUpData = levelUpData
        }
        
        -- Process level-up moves if leveled up
        if levelUpData and levelUpData.levelsGained > 0 then
            local movesLearned
            pokemon, movesLearned = MoveManager.processLevelUpMoves(pokemon, pokemon.level)
            result.rewards.movesLearned = movesLearned
        end
    end
    
    -- Apply friendship changes
    if battleResult.outcome then
        pokemon = ExperienceSystem.applyBattleFriendship(
            pokemon, 
            battleResult.outcome, 
            battleResult.battleType or "WILD"
        )
        
        result.rewards.friendship = {
            newFriendship = pokemon.friendship,
            friendshipLevel = ExperienceSystem.getFriendshipLevel(pokemon.friendship)
        }
    end
    
    -- Record battle in history
    local battleRecord = {
        battleId = pokemon.battleData.battleId,
        battleType = battleResult.battleType or "WILD",
        outcome = battleResult.outcome,
        expGained = battleResult.expGained or 0,
        friendshipChange = result.rewards.friendship and (pokemon.friendship - (result.rewards.friendship.newFriendship or 70)) or 0,
        participated = true,
        killingBlow = battleResult.killingBlow or false,
        opponent = battleResult.opponent,
        duration = pokemon.battleData.battleEndedAt and (pokemon.battleData.battleEndedAt - pokemon.battleData.battleStartedAt) or 0,
        movesUsed = pokemon.battleData.moveUsageThisBattle,
        timestamp = os.time()
    }
    
    pokemon = ExperienceSystem.recordBattleParticipation(pokemon, battleRecord)
    
    -- Clear battle data
    pokemon.battleData = nil
    pokemon.lastBattleAt = os.time()
    
    -- Remove from battle index
    PokemonStorage.removeFromBattle(result.battleId, pokemonId)
    
    -- Update storage
    PokemonStorage.update(pokemonId, pokemon)
    
    result.pokemon = pokemon
    result.battleRecord = battleRecord
    
    return pokemon, result
end

-- Restore Pokemon after battle
-- @param pokemonId: Pokemon instance ID
-- @param restoreType: Type of restoration ("full", "partial", "pp_only")
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, restoration result
function BattleIntegration.restorePokemonAfterBattle(pokemonId, restoreType, playerId)
    if not pokemonId or not playerId then
        return nil, "Pokemon ID and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    restoreType = restoreType or "partial"
    local restored = {}
    
    if restoreType == "full" then
        -- Full restoration: HP and PP
        pokemon.stats.hp = pokemon.stats.maxHp
        pokemon = MoveManager.restorePP(pokemon)
        pokemon.statusEffect = nil
        
        table.insert(restored, "hp")
        table.insert(restored, "pp")
        table.insert(restored, "status")
        
    elseif restoreType == "partial" then
        -- Partial restoration: some HP and PP
        local hpRestore = math.floor(pokemon.stats.maxHp * 0.3)
        pokemon.stats.hp = math.min(pokemon.stats.maxHp, pokemon.stats.hp + hpRestore)
        pokemon = MoveManager.restorePP(pokemon, nil, 10)  -- Restore 10 PP per move
        
        table.insert(restored, "partial_hp")
        table.insert(restored, "partial_pp")
        
    elseif restoreType == "pp_only" then
        -- PP only restoration
        pokemon = MoveManager.restorePP(pokemon)
        table.insert(restored, "pp")
    end
    
    -- Update storage
    PokemonStorage.update(pokemonId, pokemon)
    
    return pokemon, {
        success = true,
        restoreType = restoreType,
        restored = restored,
        message = "Pokemon restored successfully"
    }
end

-- Battle Validation and Utility Functions

-- Check if Pokemon can participate in battle
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID for ownership validation
-- @return: Boolean indicating if Pokemon can battle, reason if not
function BattleIntegration.canParticipateInBattle(pokemonId, playerId)
    if not pokemonId or not playerId then
        return false, "Pokemon ID and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return false, error or "Pokemon not found or access denied"
    end
    
    -- Check if Pokemon has fainted
    if pokemon.stats.hp <= 0 then
        return false, "Pokemon has fainted"
    end
    
    -- Check if Pokemon is already in a battle
    if pokemon.battleData and pokemon.battleData.battleState == BATTLE_STATES.ACTIVE then
        return false, "Pokemon is already in a battle"
    end
    
    -- Check for preventing status effects (could be overridden by battle rules)
    if pokemon.statusEffect == "frozen" then
        return false, "Pokemon is frozen and cannot battle"
    end
    
    -- Check if Pokemon has any moves with PP
    if pokemon.moveset then
        local hasUsableMoves = false
        for _, move in ipairs(pokemon.moveset) do
            if move.ppCurrent > 0 then
                hasUsableMoves = true
                break
            end
        end
        if not hasUsableMoves then
            return false, "Pokemon has no usable moves"
        end
    end
    
    return true
end

-- Get Pokemon's current battle status
-- @param pokemonId: Pokemon instance ID
-- @param playerId: Player ID for ownership validation
-- @return: Battle status information
function BattleIntegration.getBattleStatus(pokemonId, playerId)
    if not pokemonId or not playerId then
        return nil, "Pokemon ID and player ID required"
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return nil, error or "Pokemon not found or access denied"
    end
    
    local status = {
        pokemonId = pokemonId,
        inBattle = pokemon.battleData ~= nil,
        canBattle = BattleIntegration.canParticipateInBattle(pokemonId, playerId)
    }
    
    if pokemon.battleData then
        status.battleId = pokemon.battleData.battleId
        status.battleState = pokemon.battleData.battleState
        status.joinedAt = pokemon.battleData.joinedAt
        status.currentHP = pokemon.battleData.currentHP
        status.tempStatStages = pokemon.battleData.tempStatStages
        status.actionsThisTurn = #pokemon.battleData.actionsThisTurn
    end
    
    return status
end

-- Get constants for external use
function BattleIntegration.getConstants()
    return {
        BATTLE_STATES = BATTLE_STATES,
        BATTLE_RESULTS = BATTLE_RESULTS
    }
end

return BattleIntegration