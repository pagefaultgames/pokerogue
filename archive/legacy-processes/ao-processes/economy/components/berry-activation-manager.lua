--[[
Berry Activation Manager
Manages berry trigger monitoring and timing within battle system

Features:
- Battle turn integration for berry activation checks
- HP monitoring system triggering berry activation at correct thresholds
- Status effect monitoring triggering status-curing berries immediately
- Stat reduction monitoring for stat-boosting berry triggers
- Berry consumption workflow removing berries after activation
- Berry recycling system through moves (Recycle) and abilities (Harvest)
- Activation priority system for multiple berry triggers

Behavioral Parity Requirements:
- Never use Lua's math.random() - ALWAYS use AO crypto module
- All berry activation calculations must match TypeScript implementation exactly
- Berry activation and timing must be deterministic and reproducible
--]]

local BerryDatabase = require('data.items.berry-database')
local BerryEffectsProcessor = require('economy.components.berry-effects-processor')
local InventoryManager = require('economy.components.inventory-manager')

local BerryActivationManager = {}

-- Battle berry tracking state
local battleBerryState = {}

-- Activation priority constants (matching TypeScript implementation)
local ACTIVATION_PRIORITY = {
    HP_RESTORE = 1,
    STATUS_CURE = 2,
    STAT_BOOST = 3,
    DAMAGE_REDUCTION = 4,
    TYPE_RESISTANCE = 5
}

-- Initialize manager
function BerryActivationManager.init()
    -- Initialize any required state
end

--[[
Initialize berry activation state for a battle
@param battleId string - Unique battle identifier
@return boolean - Success status
--]]
function BerryActivationManager.initializeBattleState(battleId)
    if not battleId then
        return false
    end
    
    battleBerryState[battleId] = {
        activatedBerries = {},  -- Track once-per-battle berries
        activationQueue = {},   -- Pending berry activations
        recycledBerries = {},   -- Berries available for recycling
        turnActivations = {}    -- Activations for current turn
    }
    
    return true
end

--[[
Clear berry activation state for a battle
@param battleId string - Unique battle identifier
@return boolean - Success status
--]]
function BerryActivationManager.clearBattleState(battleId)
    if battleId and battleBerryState[battleId] then
        battleBerryState[battleId] = nil
        return true
    end
    return false
end

--[[
Check if a berry should activate based on Pokemon's current state
@param pokemonId string - Pokemon identifier
@param berryId string - Berry to check for activation
@param battleContext table - Current battle state context
@return boolean - Should activate, table - activation data
--]]
function BerryActivationManager.shouldActivateBerry(pokemonId, berryId, battleContext)
    if not pokemonId or not berryId or not battleContext then
        return false, nil
    end
    
    -- Get berry data
    local berry = BerryDatabase.getBerry(berryId)
    if not berry then
        return false, nil
    end
    
    local pokemon = battleContext.pokemon[pokemonId]
    if not pokemon then
        return false, nil
    end
    
    -- Check activation condition based on berry type
    local shouldActivate = false
    local activationData = {
        berryId = berryId,
        pokemonId = pokemonId,
        activationCondition = berry.activationCondition,
        priority = ACTIVATION_PRIORITY[berry.effect.type] or 99,
        battleId = battleContext.battleId
    }
    
    -- HP-based activation (e.g., Sitrus Berry, Oran Berry)
    if berry.activationCondition == "hp_50_percent" then
        local hpPercentage = (pokemon.hp or 0) / (pokemon.maxHP or 1)
        local threshold = 0.5  -- 50% threshold
        
        shouldActivate = hpPercentage <= threshold and pokemon.hp > 0
        activationData.currentHP = pokemon.hp
        activationData.maxHP = pokemon.maxHP
        activationData.hpPercentage = hpPercentage
        activationData.threshold = threshold
    
    -- Critical HP activation (e.g., Pinch berries)
    elseif berry.activationCondition == "hp_25_percent" then
        local hpPercentage = (pokemon.hp or 0) / (pokemon.maxHP or 1)
        local threshold = 0.25  -- 25% threshold
        
        shouldActivate = hpPercentage <= threshold and pokemon.hp > 0
        activationData.currentHP = pokemon.hp
        activationData.maxHP = pokemon.maxHP
        activationData.hpPercentage = hpPercentage
        activationData.threshold = threshold
    
    -- Status condition activation (e.g., Cheri Berry, Pecha Berry)
    elseif berry.activationCondition == "status_inflicted" then
        local targetStatus = berry.effect.statusCondition
        
        if targetStatus and pokemon.statusCondition == targetStatus then
            shouldActivate = true
            activationData.statusCondition = targetStatus
        end
    
    -- Stat reduction activation (e.g., White Herb, Mental Herb)
    elseif berry.activationCondition == "stat_lowered" then
        local targetStat = berry.effect.boostsStat or berry.effect.stat
        if targetStat and pokemon.statStages and pokemon.statStages[targetStat] then
            shouldActivate = pokemon.statStages[targetStat] < 0
            activationData.statReduced = targetStat
            activationData.statStage = pokemon.statStages[targetStat]
        end
    
    -- Super effective hit activation (e.g., weakness berries)
    elseif berry.activationCondition == "super_effective_hit" then
        local lastMove = battleContext.lastMove
        if lastMove and lastMove.targetId == pokemonId then
            local effectiveness = lastMove.effectiveness or 1.0
            shouldActivate = effectiveness > 1.0  -- Super effective moves
            activationData.moveEffectiveness = effectiveness
            activationData.moveType = lastMove.moveType
        end
    
    -- PP depleted activation (e.g., Leppa Berry)
    elseif berry.activationCondition == "pp_depleted" then
        -- Check if any move has 0 PP
        if pokemon.moves then
            for _, move in ipairs(pokemon.moves) do
                if move.pp and move.pp <= 0 then
                    shouldActivate = true
                    activationData.depletedMove = move.id
                    break
                end
            end
        end
    
    -- Immediate activation (e.g., certain special berries)
    elseif berry.activationCondition == "immediate" then
        shouldActivate = true
    end
    
    -- Check if berry was already activated this battle (for once-per-battle berries)
    if shouldActivate and berry.oncePerBattle then
        local battleId = battleContext.battleId
        if battleBerryState[battleId] and battleBerryState[battleId].activatedBerries[berryId] then
            shouldActivate = false
            activationData.alreadyActivated = true
        end
    end
    
    return shouldActivate, activationData
end

--[[
Process berry activation for a Pokemon
@param activationData table - Data from shouldActivateBerry check
@param battleContext table - Current battle state context
@return boolean - Success status, table - activation result
--]]
function BerryActivationManager.activateBerry(activationData, battleContext)
    if not activationData or not battleContext then
        return false, nil
    end
    
    local berryId = activationData.berryId
    local pokemonId = activationData.pokemonId
    local battleId = activationData.battleId
    
    -- Get berry and Pokemon data
    local berry = BerryDatabase.getBerry(berryId)
    if not berry then
        return false, { error = "Berry not found: " .. berryId }
    end
    
    local pokemon = battleContext.pokemon[pokemonId]
    if not pokemon then
        return false, { error = "Pokemon not found: " .. pokemonId }
    end
    
    -- Process berry effect through BerryEffectsProcessor
    local effectResult = BerryEffectsProcessor.applyBerryEffect(berry, pokemon, battleContext)
    if not effectResult.success then
        return false, effectResult
    end
    
    -- Mark berry as activated if once-per-battle
    if berry.oncePerBattle and battleId then
        if not battleBerryState[battleId] then
            BerryActivationManager.initializeBattleState(battleId)
        end
        battleBerryState[battleId].activatedBerries[berryId] = true
    end
    
    -- Track berry consumption for inventory management
    local playerId = pokemon.playerId or battleContext.playerId
    if playerId then
        InventoryManager.trackBerryConsumption(playerId, berryId, pokemonId, battleId)
        
        -- Remove berry from inventory if consumable
        if berry.consumable then
            InventoryManager.removeItem(playerId, berryId, 1, "Berry activated in battle")
        end
    end
    
    -- Log activation
    if battleId and battleBerryState[battleId] then
        table.insert(battleBerryState[battleId].turnActivations, {
            berryId = berryId,
            pokemonId = pokemonId,
            effectType = berry.effect.type,
            timestamp = 0
        })
    end
    
    local result = {
        success = true,
        berryId = berryId,
        pokemonId = pokemonId,
        effectType = berry.effect.type,
        effectMagnitude = effectResult.effectMagnitude,
        pokemonUpdates = effectResult.pokemonUpdates,
        berryConsumed = berry.consumable,
        activationTiming = berry.activationTiming or "IMMEDIATE"
    }
    
    return true, result
end

--[[
Check for berry activations at the start of a turn
@param battleContext table - Current battle state context
@return array - List of berry activations to process
--]]
function BerryActivationManager.checkTurnStartActivations(battleContext)
    if not battleContext or not battleContext.pokemon then
        return {}
    end
    
    local activations = {}
    local battleId = battleContext.battleId
    
    -- Clear previous turn activations
    if battleId and battleBerryState[battleId] then
        battleBerryState[battleId].turnActivations = {}
    end
    
    -- Check each Pokemon for berry activations
    for pokemonId, pokemon in pairs(battleContext.pokemon) do
        if pokemon.heldItem and pokemon.hp and pokemon.hp > 0 then
            local berry = BerryDatabase.getBerry(pokemon.heldItem)
            if berry then
                local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
                    pokemonId, pokemon.heldItem, battleContext
                )
                
                if shouldActivate then
                    table.insert(activations, activationData)
                end
            end
        end
    end
    
    -- Sort activations by priority
    table.sort(activations, function(a, b)
        return (a.priority or 99) < (b.priority or 99)
    end)
    
    return activations
end

--[[
Check for berry activations after damage is dealt
@param pokemonId string - Pokemon that took damage
@param battleContext table - Current battle state context
@return array - List of berry activations to process
--]]
function BerryActivationManager.checkPostDamageActivations(pokemonId, battleContext)
    if not pokemonId or not battleContext then
        return {}
    end
    
    local pokemon = battleContext.pokemon[pokemonId]
    if not pokemon or not pokemon.heldItem or pokemon.hp <= 0 then
        return {}
    end
    
    local berry = BerryDatabase.getBerry(pokemon.heldItem)
    if not berry then
        return {}
    end
    
    local shouldActivate, activationData = BerryActivationManager.shouldActivateBerry(
        pokemonId, pokemon.heldItem, battleContext
    )
    
    if shouldActivate then
        return {activationData}
    end
    
    return {}
end

--[[
Handle berry recycling (e.g., from Recycle move or Harvest ability)
@param pokemonId string - Pokemon to receive recycled berry
@param berryId string - Berry to recycle
@param recycleMethod string - How the berry was recycled
@param battleContext table - Current battle state context
@return boolean - Success status, table - recycle result
--]]
function BerryActivationManager.recycleBerry(pokemonId, berryId, recycleMethod, battleContext)
    if not pokemonId or not berryId or not battleContext then
        return false, { error = "Invalid parameters for berry recycling" }
    end
    
    local pokemon = battleContext.pokemon[pokemonId]
    if not pokemon then
        return false, { error = "Pokemon not found: " .. pokemonId }
    end
    
    -- Check if Pokemon already has a held item
    if pokemon.heldItem then
        return false, { error = "Pokemon already holding an item" }
    end
    
    local berry = BerryDatabase.getBerry(berryId)
    if not berry then
        return false, { error = "Berry not found: " .. berryId }
    end
    
    -- Give berry back to Pokemon
    pokemon.heldItem = berryId
    
    -- Track recycling for inventory management
    local playerId = pokemon.playerId or battleContext.playerId
    if playerId then
        InventoryManager.trackBerryRecycling(playerId, berryId, pokemonId, recycleMethod)
    end
    
    -- Log recycling
    local battleId = battleContext.battleId
    if battleId and battleBerryState[battleId] then
        table.insert(battleBerryState[battleId].recycledBerries, {
            berryId = berryId,
            pokemonId = pokemonId,
            recycleMethod = recycleMethod,
            timestamp = 0
        })
    end
    
    return true, {
        success = true,
        berryId = berryId,
        pokemonId = pokemonId,
        recycleMethod = recycleMethod
    }
end

--[[
Get berry activation history for a battle
@param battleId string - Battle identifier
@return table - Activation history data
--]]
function BerryActivationManager.getBattleActivationHistory(battleId)
    if not battleId or not battleBerryState[battleId] then
        return {
            activatedBerries = {},
            turnActivations = {},
            recycledBerries = {}
        }
    end
    
    return battleBerryState[battleId]
end

--[[
Validate berry activation integrity
@param activationData table - Activation data to validate
@return boolean - Is valid, table - validation result
--]]
function BerryActivationManager.validateActivation(activationData)
    if not activationData then
        return false, { error = "No activation data provided" }
    end
    
    local required = {"berryId", "pokemonId", "activationCondition"}
    for _, field in ipairs(required) do
        if not activationData[field] then
            return false, { error = "Missing required field: " .. field }
        end
    end
    
    -- Validate berry exists
    local berry = BerryDatabase.getBerry(activationData.berryId)
    if not berry then
        return false, { error = "Invalid berry: " .. activationData.berryId }
    end
    
    -- Validate activation condition matches berry
    if berry.activationCondition ~= activationData.activationCondition then
        return false, { 
            error = "Activation condition mismatch",
            expected = berry.activationCondition,
            provided = activationData.activationCondition
        }
    end
    
    return true, { valid = true }
end

return BerryActivationManager