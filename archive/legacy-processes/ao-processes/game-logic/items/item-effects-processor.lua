--[[
Item Effects Processing System
Handles activation and effect processing for all item types

Features:
- Immediate use effects for consumable items
- Battle use effects for combat items
- Passive effects for held items
- Deterministic processing using AO crypto module
- Item effectiveness calculations matching TypeScript implementation
- Activation condition validation and error handling

Usage:
- processItemEffect(pokemon, itemId, context, battleState)
- validateItemUsage(pokemon, itemId, context)
- calculateItemEffectiveness(pokemon, itemId, effectData)
--]]

local ItemEffectsProcessor = {}

-- Dependencies
local ItemDatabase = require('data.items.item-database')
-- Use global crypto module as per coding standards - no fallback to math.random
local crypto = _G.crypto
if not crypto then
    error("AO crypto module not available - required for deterministic processing")
end

-- Effect processing results enum
local EffectResult = {
    SUCCESS = "success",
    FAILED = "failed",
    INVALID_USAGE = "invalid_usage",
    INVALID_TARGET = "invalid_target",
    NO_EFFECT = "no_effect",
    ALREADY_APPLIED = "already_applied"
}

-- Processor state
local processorInitialized = false

-- Initialize processor
function ItemEffectsProcessor.init()
    if processorInitialized then
        return
    end
    
    ItemDatabase.init()
    processorInitialized = true
end

-- Process item effect on target Pokemon
-- @param pokemon: Pokemon instance to apply effect to
-- @param itemId: ID of item being used
-- @param context: Usage context ("overworld", "battle", "both")
-- @param battleState: Optional battle state data for battle effects
-- @param quantity: Optional quantity for stackable consumables (default 1)
-- @return: EffectResult, processed data, and descriptive message
function ItemEffectsProcessor.processItemEffect(pokemon, itemId, context, battleState, quantity)
    ItemEffectsProcessor.init()
    
    quantity = quantity or 1
    
    -- Get item data
    local itemData = ItemDatabase.getItem(itemId)
    if not itemData then
        return EffectResult.FAILED, nil, "Item not found: " .. tostring(itemId)
    end
    
    -- Validate usage context
    if not ItemDatabase.canUseInContext(itemId, context) then
        return EffectResult.INVALID_USAGE, nil, "Item cannot be used in " .. context .. " context"
    end
    
    -- Validate target Pokemon
    if not pokemon or not pokemon.id then
        return EffectResult.INVALID_TARGET, nil, "Invalid target Pokemon"
    end
    
    -- Route to appropriate effect processor based on category
    local category = itemData.category
    
    if category == ItemDatabase.ItemCategory.HEALING then
        return ItemEffectsProcessor.processHealingEffect(pokemon, itemData, quantity)
    elseif category == ItemDatabase.ItemCategory.PP_RESTORE then
        return ItemEffectsProcessor.processPpRestoreEffect(pokemon, itemData, quantity, battleState)
    elseif category == ItemDatabase.ItemCategory.BERRY then
        return ItemEffectsProcessor.processBerryEffect(pokemon, itemData, context, battleState)
    elseif category == ItemDatabase.ItemCategory.STAT_BOOSTER then
        return ItemEffectsProcessor.processStatBoostEffect(pokemon, itemData, quantity)
    elseif category == ItemDatabase.ItemCategory.EVOLUTION then
        return ItemEffectsProcessor.processEvolutionEffect(pokemon, itemData, context)
    elseif category == ItemDatabase.ItemCategory.POKEBALL then
        return ItemEffectsProcessor.processPokeballEffect(pokemon, itemData, context, battleState)
    elseif category == ItemDatabase.ItemCategory.HELD_ITEM then
        return ItemEffectsProcessor.processHeldItemEffect(pokemon, itemData, context, battleState)
    else
        return EffectResult.NO_EFFECT, nil, "No effect processor for category: " .. tostring(category)
    end
end

-- Process healing item effects
-- @param pokemon: Target Pokemon
-- @param itemData: Item data structure
-- @param quantity: Quantity used
-- @return: EffectResult, healing data, message
function ItemEffectsProcessor.processHealingEffect(pokemon, itemData, quantity)
    local result = {
        healedHp = 0,
        statusCured = false,
        revived = false,
        previousHp = pokemon.hp or 0,
        previousStatus = pokemon.status,
        isFainted = (pokemon.hp or 0) <= 0
    }
    
    -- Handle revive items for fainted Pokemon
    if result.isFainted and itemData.revive then
        local maxHp = pokemon.stats and pokemon.stats.hp or pokemon.maxHp or 100
        local reviveAmount = 0
        
        if itemData.revivePercent == 100 then
            reviveAmount = maxHp
        else
            -- Use precise calculation matching TypeScript Math.floor
            reviveAmount = math.floor((maxHp * itemData.revivePercent) / 100)
        end
        
        pokemon.hp = reviveAmount
        result.healedHp = reviveAmount
        result.revived = true
        
        return EffectResult.SUCCESS, result, string.format("Revived %s with %d HP", pokemon.name or "Pokemon", reviveAmount)
    end
    
    -- Cannot heal fainted Pokemon with non-revive items
    if result.isFainted and not itemData.revive then
        return EffectResult.NO_EFFECT, result, "Cannot use on fainted Pokemon"
    end
    
    -- Process HP healing
    if itemData.healAmount then
        local maxHp = pokemon.stats and pokemon.stats.hp or pokemon.maxHp or 100
        local currentHp = pokemon.hp or 0
        local healAmount = 0
        
        if itemData.healAmount == 0 then
            -- Full heal (Max Potion, Full Restore)
            healAmount = maxHp - currentHp
        else
            -- Fixed amount heal with quantity multiplier
            healAmount = itemData.healAmount * quantity
            -- Don't exceed max HP
            healAmount = math.min(healAmount, maxHp - currentHp)
        end
        
        if healAmount > 0 then
            pokemon.hp = math.min(currentHp + healAmount, maxHp)
            result.healedHp = healAmount
        end
    end
    
    -- Process status healing
    if itemData.curesStatus and pokemon.status then
        result.statusCured = true
        result.previousStatus = pokemon.status
        pokemon.status = nil
    end
    
    -- Check if any effect was applied
    if result.healedHp > 0 or result.statusCured or result.revived then
        return EffectResult.SUCCESS, result, string.format("Healed %d HP, status cured: %s", result.healedHp, tostring(result.statusCured))
    end
    
    return EffectResult.NO_EFFECT, result, "No healing needed"
end

-- Process PP restoration item effects
-- @param pokemon: Target Pokemon
-- @param itemData: Item data structure  
-- @param quantity: Quantity used
-- @param battleState: Battle state for move selection
-- @return: EffectResult, PP data, message
function ItemEffectsProcessor.processPpRestoreEffect(pokemon, itemData, quantity, battleState)
    local result = {
        movesRestored = {},
        totalPpRestored = 0,
        ppMaxIncreased = {}
    }
    
    if not pokemon.moves or #pokemon.moves == 0 then
        return EffectResult.NO_EFFECT, result, "Pokemon has no moves"
    end
    
    -- Handle PP Up/PP Max items (increase maximum PP)
    if itemData.ppMaxIncrease then
        -- For PP Up/Max, target specific move (requires battle state to specify move)
        local targetMoveIndex = battleState and battleState.targetMove or 1
        if targetMoveIndex > 0 and targetMoveIndex <= #pokemon.moves then
            local move = pokemon.moves[targetMoveIndex]
            if move then
                local currentBoost = move.ppBoosts or 0
                local maxBoosts = 3 -- Maximum PP boosts allowed
                
                if currentBoost < maxBoosts then
                    local boostsToAdd = math.min(itemData.ppMaxIncrease * quantity, maxBoosts - currentBoost)
                    move.ppBoosts = currentBoost + boostsToAdd
                    
                    result.ppMaxIncreased[targetMoveIndex] = boostsToAdd
                    return EffectResult.SUCCESS, result, string.format("Increased %s max PP by %d", move.name or "move", boostsToAdd)
                else
                    return EffectResult.NO_EFFECT, result, "Move PP already at maximum"
                end
            end
        end
        return EffectResult.INVALID_TARGET, result, "Invalid move target"
    end
    
    -- Handle regular PP restoration
    local restoreAmount = itemData.ppRestore
    if restoreAmount == -1 then
        restoreAmount = 999 -- Full restore
    else
        restoreAmount = restoreAmount * quantity
    end
    
    if itemData.allMoves then
        -- Restore PP for all moves (Elixir, Max Elixir)
        for i, move in ipairs(pokemon.moves) do
            if move and move.pp ~= nil and move.maxPp then
                local currentPp = move.pp
                local maxPp = move.maxPp
                local ppToRestore = math.min(restoreAmount, maxPp - currentPp)
                
                if ppToRestore > 0 then
                    move.pp = currentPp + ppToRestore
                    result.movesRestored[i] = ppToRestore
                    result.totalPpRestored = result.totalPpRestored + ppToRestore
                end
            end
        end
    elseif itemData.targetMove then
        -- Restore PP for specific move (Ether, Max Ether)
        local targetMoveIndex = battleState and battleState.targetMove or 1
        if targetMoveIndex > 0 and targetMoveIndex <= #pokemon.moves then
            local move = pokemon.moves[targetMoveIndex]
            if move and move.pp ~= nil and move.maxPp then
                local currentPp = move.pp
                local maxPp = move.maxPp
                local ppToRestore = math.min(restoreAmount, maxPp - currentPp)
                
                if ppToRestore > 0 then
                    move.pp = currentPp + ppToRestore
                    result.movesRestored[targetMoveIndex] = ppToRestore
                    result.totalPpRestored = ppToRestore
                end
            end
        else
            return EffectResult.INVALID_TARGET, result, "Invalid move target"
        end
    end
    
    if result.totalPpRestored > 0 then
        return EffectResult.SUCCESS, result, string.format("Restored %d total PP", result.totalPpRestored)
    end
    
    return EffectResult.NO_EFFECT, result, "No PP restoration needed"
end

-- Process berry effects (held items with activation conditions)
-- @param pokemon: Target Pokemon
-- @param itemData: Berry data structure
-- @param context: Usage context
-- @param battleState: Battle state for activation conditions
-- @return: EffectResult, berry data, message
function ItemEffectsProcessor.processBerryEffect(pokemon, itemData, context, battleState)
    local result = {
        activated = false,
        effectApplied = false,
        healedHp = 0,
        statusCured = false,
        statsBoosted = {}
    }
    
    -- Check activation conditions
    local shouldActivate = false
    
    if itemData.activateThreshold then
        -- HP threshold activation (Sitrus, stat-boost berries)
        local currentHpPercent = 100
        if pokemon.hp and pokemon.maxHp and pokemon.maxHp > 0 then
            currentHpPercent = math.floor((pokemon.hp * 100) / pokemon.maxHp)
        end
        
        if currentHpPercent <= itemData.activateThreshold then
            shouldActivate = true
        end
    elseif itemData.activateOnSuperEffective and battleState then
        -- Super-effective hit activation (Enigma Berry)
        if battleState.lastHitWasSuperEffective then
            shouldActivate = true
        end
    elseif context == "overworld" then
        -- Manual activation in overworld
        shouldActivate = true
    elseif itemData.curesStatus and pokemon.status then
        -- Status condition activation (Lum Berry)
        shouldActivate = true
    end
    
    if not shouldActivate then
        return EffectResult.NO_EFFECT, result, "Berry activation conditions not met"
    end
    
    result.activated = true
    
    -- Process berry effects
    if itemData.healPercent then
        local maxHp = pokemon.maxHp or 100
        local healAmount = math.floor((maxHp * itemData.healPercent) / 100)
        local currentHp = pokemon.hp or 0
        
        if currentHp < maxHp then
            pokemon.hp = math.min(currentHp + healAmount, maxHp)
            result.healedHp = healAmount
            result.effectApplied = true
        end
    end
    
    if itemData.curesStatus and pokemon.status then
        result.statusCured = true
        pokemon.status = nil
        result.effectApplied = true
    end
    
    if itemData.ppRestore and pokemon.moves then
        -- Find first move with 0 PP (Leppa Berry)
        for i, move in ipairs(pokemon.moves) do
            if move and move.pp == 0 and move.maxPp then
                local ppToRestore = math.min(itemData.ppRestore, move.maxPp)
                move.pp = ppToRestore
                result.effectApplied = true
                break
            end
        end
    end
    
    if itemData.statBoost and battleState then
        -- Stat boost berries (Liechi, Ganlon, etc.)
        local statName = itemData.statBoost
        local boostAmount = itemData.statBoostAmount or 1
        
        -- Apply stat stage boost using battle state
        if battleState.applyStatStageBoost then
            battleState.applyStatStageBoost(pokemon.id, statName, boostAmount)
            result.statsBoosted[statName] = boostAmount
            result.effectApplied = true
        end
    end
    
    if itemData.randomStatBoost and battleState then
        -- Random stat boost (Starf Berry)
        local stats = {"attack", "defense", "special_attack", "special_defense", "speed"}
        local randomStat = stats[crypto.random(1, #stats)]
        local boostAmount = itemData.statBoostAmount or 2
        
        if battleState.applyStatStageBoost then
            battleState.applyStatStageBoost(pokemon.id, randomStat, boostAmount)
            result.statsBoosted[randomStat] = boostAmount
            result.effectApplied = true
        end
    end
    
    if itemData.critBoost and battleState then
        -- Critical hit boost (Lansat Berry)
        if battleState.applyCritBoost then
            battleState.applyCritBoost(pokemon.id, 1)
            result.effectApplied = true
        end
    end
    
    if result.effectApplied then
        -- Berry is consumed after activation
        return EffectResult.SUCCESS, result, string.format("Berry activated: healed %d HP, status cured: %s", result.healedHp, tostring(result.statusCured))
    end
    
    return EffectResult.NO_EFFECT, result, "Berry activated but no effect applied"
end

-- Process stat booster effects (vitamins, etc.)
-- @param pokemon: Target Pokemon
-- @param itemData: Stat booster data
-- @param quantity: Quantity used
-- @return: EffectResult, stat data, message
function ItemEffectsProcessor.processStatBoostEffect(pokemon, itemData, quantity)
    local result = {
        statIncreased = nil,
        increaseAmount = 0,
        friendshipGained = 0
    }
    
    -- Handle vitamin stat boosts (HP Up, Protein, etc.)
    if itemData.type == "friendship_vitamin" then
        -- Apply base stat increase (EVs in original game)
        if not pokemon.evs then
            pokemon.evs = {}
        end
        
        local statName = itemData.id:sub(1, -4):lower() -- Remove "_UP" suffix
        if statName == "hp" then
            statName = "hp"
        elseif itemData.id == "PROTEIN" then
            statName = "attack"
        elseif itemData.id == "IRON" then
            statName = "defense"
        elseif itemData.id == "CALCIUM" then
            statName = "special_attack"
        elseif itemData.id == "ZINC" then
            statName = "special_defense"
        elseif itemData.id == "CARBOS" then
            statName = "speed"
        end
        
        local currentEvs = pokemon.evs[statName] or 0
        local maxEvs = 252 -- Standard EV limit
        local evsToAdd = math.min(10 * quantity, maxEvs - currentEvs) -- 10 EVs per vitamin
        
        if evsToAdd > 0 then
            pokemon.evs[statName] = currentEvs + evsToAdd
            result.statIncreased = statName
            result.increaseAmount = evsToAdd
        end
        
        -- Apply friendship gain
        if itemData.friendshipGain then
            local currentFriendship = pokemon.friendship or 0
            local friendshipIncrease = ItemDatabase.getFriendshipGain(itemData.id, currentFriendship)
            pokemon.friendship = math.min(currentFriendship + (friendshipIncrease * quantity), 255)
            result.friendshipGained = friendshipIncrease * quantity
        end
        
        return EffectResult.SUCCESS, result, string.format("Increased %s by %d EVs, gained %d friendship", statName, result.increaseAmount, result.friendshipGained)
    end
    
    return EffectResult.NO_EFFECT, result, "No stat boost effect"
end

-- Process evolution item effects
-- @param pokemon: Target Pokemon
-- @param itemData: Evolution item data
-- @param context: Usage context
-- @return: EffectResult, evolution data, message
function ItemEffectsProcessor.processEvolutionEffect(pokemon, itemData, context)
    local result = {
        canEvolve = false,
        evolutionTriggered = false,
        evolvedSpecies = nil
    }
    
    -- Check if Pokemon can use this evolution item
    if not pokemon.speciesId then
        return EffectResult.INVALID_TARGET, result, "Pokemon missing species ID"
    end
    
    local canUse = ItemDatabase.canSpeciesUseEvolutionItem(pokemon.speciesId, itemData.id)
    if not canUse then
        return EffectResult.INVALID_USAGE, result, "Pokemon cannot use this evolution item"
    end
    
    result.canEvolve = true
    
    -- Evolution processing would be handled by evolution system
    -- This effect processor just validates usage and marks trigger
    result.evolutionTriggered = true
    
    return EffectResult.SUCCESS, result, "Evolution item can be used (evolution system will process)"
end

-- Process Pokeball effects (catching wild Pokemon)
-- @param pokemon: Wild Pokemon target
-- @param itemData: Pokeball data
-- @param context: Usage context
-- @param battleState: Battle state for catch calculation
-- @return: EffectResult, catch data, message
function ItemEffectsProcessor.processPokeballEffect(pokemon, itemData, context, battleState)
    local result = {
        catchAttempted = false,
        catchSuccessful = false,
        catchRate = 0,
        ballUsed = itemData.id
    }
    
    if context ~= "overworld" and context ~= "battle" then
        return EffectResult.INVALID_USAGE, result, "Pokeballs can only be used on wild Pokemon"
    end
    
    if not battleState or not battleState.isWildBattle then
        return EffectResult.INVALID_USAGE, result, "Can only catch wild Pokemon"
    end
    
    -- Calculate catch rate using deterministic formula
    local baseCatchRate = pokemon.speciesData and pokemon.speciesData.catchRate or 45
    local ballMultiplier = itemData.catchRate or 1.0
    local hpMultiplier = 1.0
    
    -- HP-based catch rate calculation
    if pokemon.hp and pokemon.maxHp and pokemon.maxHp > 0 then
        local hpPercent = pokemon.hp / pokemon.maxHp
        hpMultiplier = math.max(0.1, 1.0 - (hpPercent * 0.5)) -- Lower HP = higher catch rate
    end
    
    -- Status condition bonus
    local statusMultiplier = 1.0
    if pokemon.status == "sleep" or pokemon.status == "freeze" then
        statusMultiplier = 2.0
    elseif pokemon.status == "paralysis" or pokemon.status == "burn" or pokemon.status == "poison" then
        statusMultiplier = 1.5
    end
    
    -- Final catch rate calculation (matching TypeScript precision)
    local finalCatchRate = math.floor(baseCatchRate * ballMultiplier * hpMultiplier * statusMultiplier)
    finalCatchRate = math.min(finalCatchRate, 255) -- Cap at 255
    
    result.catchRate = finalCatchRate
    result.catchAttempted = true
    
    -- Use deterministic random for catch check
    local catchRoll = crypto.random(0, 255)
    result.catchSuccessful = catchRoll <= finalCatchRate
    
    if result.catchSuccessful then
        return EffectResult.SUCCESS, result, string.format("Pokemon caught! Catch rate: %d", finalCatchRate)
    else
        return EffectResult.FAILED, result, string.format("Pokemon broke free! Catch rate: %d, roll: %d", finalCatchRate, catchRoll)
    end
end

-- Process held item effects (passive battle effects)
-- @param pokemon: Pokemon with held item
-- @param itemData: Held item data
-- @param context: Usage context
-- @param battleState: Battle state for passive effects
-- @return: EffectResult, effect data, message
function ItemEffectsProcessor.processHeldItemEffect(pokemon, itemData, context, battleState)
    local result = {
        effectType = "passive",
        modifiersApplied = {}
    }
    
    -- Held items have passive effects that are processed during battle
    -- This function validates the held item and sets up effect data
    
    if not pokemon.heldItem or pokemon.heldItem ~= itemData.id then
        pokemon.heldItem = itemData.id
    end
    
    -- Mark held item as active for battle system
    result.modifiersApplied.heldItem = itemData.id
    
    return EffectResult.SUCCESS, result, "Held item effect registered"
end

-- Validate if item can be used on target
-- @param pokemon: Target Pokemon
-- @param itemId: Item ID to validate
-- @param context: Usage context
-- @return: Boolean valid, error message
function ItemEffectsProcessor.validateItemUsage(pokemon, itemId, context)
    ItemEffectsProcessor.init()
    
    local itemData = ItemDatabase.getItem(itemId)
    if not itemData then
        return false, "Item not found"
    end
    
    if not ItemDatabase.canUseInContext(itemId, context) then
        return false, "Item cannot be used in this context"
    end
    
    if not pokemon or not pokemon.id then
        return false, "Invalid target Pokemon"
    end
    
    -- Category-specific validation
    local category = itemData.category
    
    if category == ItemDatabase.ItemCategory.HEALING then
        if itemData.revive and (pokemon.hp or 0) > 0 then
            return false, "Pokemon is not fainted"
        end
        if not itemData.revive and (pokemon.hp or 0) <= 0 then
            return false, "Cannot use on fainted Pokemon"
        end
    elseif category == ItemDatabase.ItemCategory.EVOLUTION then
        if not ItemDatabase.canSpeciesUseEvolutionItem(pokemon.speciesId, itemData.id) then
            return false, "Pokemon cannot use this evolution item"
        end
    elseif category == ItemDatabase.ItemCategory.POKEBALL then
        if context ~= "overworld" and context ~= "battle" then
            return false, "Pokeballs can only be used on wild Pokemon"
        end
    end
    
    return true, "Valid usage"
end

-- Calculate item effectiveness multiplier
-- @param pokemon: Target Pokemon
-- @param itemId: Item ID
-- @param effectData: Effect data structure
-- @return: Effectiveness multiplier (1.0 = normal)
function ItemEffectsProcessor.calculateItemEffectiveness(pokemon, itemId, effectData)
    ItemEffectsProcessor.init()
    
    local itemData = ItemDatabase.getItem(itemId)
    if not itemData then
        return 1.0
    end
    
    local effectiveness = 1.0
    
    -- Type-based effectiveness (for healing items on specific types)
    if itemData.typeEffectiveness and pokemon.types then
        for _, pokemonType in ipairs(pokemon.types) do
            if itemData.typeEffectiveness[pokemonType] then
                effectiveness = effectiveness * itemData.typeEffectiveness[pokemonType]
            end
        end
    end
    
    -- Level-based effectiveness
    if itemData.levelEffectiveness and pokemon.level then
        if pokemon.level < 10 then
            effectiveness = effectiveness * (itemData.levelEffectiveness.low or 1.0)
        elseif pokemon.level > 50 then
            effectiveness = effectiveness * (itemData.levelEffectiveness.high or 1.0)
        end
    end
    
    return effectiveness
end

-- Export constants and functions
ItemEffectsProcessor.EffectResult = EffectResult

return ItemEffectsProcessor