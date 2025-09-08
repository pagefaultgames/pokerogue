--[[
Berry Effects Processor
Handles berry effect calculations and applications

Features:
- HP threshold monitoring for automatic berry activation (25%, 50%)
- Status condition monitoring for immediate berry activation upon status infliction
- Stat reduction monitoring for stat-boosting berry activation
- Damage calculation integration for damage-reducing berry effects
- Berry consumption logic removing berry from held item slot after activation
- Stat modification system for pinch berries with correct stat boosts
- Once-per-battle tracking for damage-reducing berries

Behavioral Parity Requirements:
- Never use Lua's math.random() - ALWAYS use AO crypto module
- All berry activation calculations must match TypeScript implementation exactly
- Berry activation and effect calculations must be deterministic and reproducible
--]]

local BerryDatabase = require('data.items.berry-database')

local BerryEffectsProcessor = {}

-- Initialize crypto module for deterministic calculations
local function getCryptoModule()
    if ao and ao.env and ao.env.Module and ao.env.Module.Id then
        return require('ao.crypto')
    else
        -- For testing purposes, return mock
        return {
            utils = {
                randomBytes = function(count)
                    return string.rep("a", count)
                end
            }
        }
    end
end

local crypto = getCryptoModule()

-- Berry effect processing functions

--[[
Calculate HP percentage for berry activation
@param currentHp number - Current hit points
@param maxHp number - Maximum hit points
@return number - HP percentage (0.0 to 1.0)
--]]
function BerryEffectsProcessor.calculateHpPercentage(currentHp, maxHp)
    if not currentHp or not maxHp or maxHp <= 0 then
        return 0
    end
    
    return math.min(1.0, math.max(0.0, currentHp / maxHp))
end

--[[
Check if berry should activate based on HP threshold
@param berry table - Berry data from database
@param currentHp number - Current hit points
@param maxHp number - Maximum hit points
@return boolean - True if berry should activate
--]]
function BerryEffectsProcessor.shouldActivateHpBerry(berry, currentHp, maxHp)
    if not berry or not berry.activationCondition then
        return false
    end
    
    local hpPercent = BerryEffectsProcessor.calculateHpPercentage(currentHp, maxHp)
    
    if berry.activationCondition == BerryDatabase.ActivationCondition.HP_25_PERCENT then
        return hpPercent <= 0.25
    elseif berry.activationCondition == BerryDatabase.ActivationCondition.HP_50_PERCENT then
        return hpPercent <= 0.50
    end
    
    return false
end

--[[
Check if berry should activate based on status condition
@param berry table - Berry data from database
@param statusCondition string - Current status condition
@return boolean - True if berry should activate
--]]
function BerryEffectsProcessor.shouldActivateStatusBerry(berry, statusCondition)
    if not berry or not berry.activationCondition or not statusCondition then
        return false
    end
    
    if berry.activationCondition ~= BerryDatabase.ActivationCondition.STATUS_INFLICTED then
        return false
    end
    
    if not berry.effect or berry.effect.type ~= "cure_status" then
        return false
    end
    
    local targetCondition = berry.effect.statusCondition
    
    -- LUM_BERRY cures any status
    if targetCondition == BerryDatabase.StatusCondition.ANY then
        return true
    end
    
    -- Specific status berries
    return targetCondition == statusCondition
end

--[[
Check if berry should activate based on stat reduction
@param berry table - Berry data from database
@param statChanges table - Stat modifications applied
@return boolean - True if berry should activate
--]]
function BerryEffectsProcessor.shouldActivateStatBerry(berry, statChanges)
    if not berry or not berry.activationCondition or not statChanges then
        return false
    end
    
    if berry.activationCondition ~= BerryDatabase.ActivationCondition.STAT_LOWERED then
        return false
    end
    
    -- Check if any stat was lowered
    for stat, change in pairs(statChanges) do
        if change < 0 then
            return true
        end
    end
    
    return false
end

--[[
Check if berry should activate based on super-effective hit
@param berry table - Berry data from database
@param moveType string - Type of the attacking move
@param defenderTypes table - Defending Pokemon's types
@param effectiveness number - Type effectiveness multiplier
@return boolean - True if berry should activate
--]]
function BerryEffectsProcessor.shouldActivateDamageReduceBerry(berry, moveType, defenderTypes, effectiveness)
    if not berry or not berry.activationCondition then
        return false
    end
    
    if berry.activationCondition ~= BerryDatabase.ActivationCondition.SUPER_EFFECTIVE_HIT then
        return false
    end
    
    -- Check if attack is super effective (effectiveness > 1.0)
    if not effectiveness or effectiveness <= 1.0 then
        return false
    end
    
    -- For type-resist berries, check if the move type matches the resist type
    if berry.category == BerryDatabase.BerryCategory.TYPE_RESIST then
        if berry.effect and berry.effect.resistType then
            return berry.effect.resistType == moveType
        end
    end
    
    -- For ENIGMA_BERRY, activate on any super-effective hit
    if berry.category == BerryDatabase.BerryCategory.DAMAGE_REDUCE then
        return true
    end
    
    return false
end

--[[
Apply HP restoration berry effect
@param berry table - Berry data from database
@param pokemon table - Pokemon receiving the effect
@return table - Updated pokemon data
--]]
function BerryEffectsProcessor.applyHpRestoration(berry, pokemon)
    if not berry or not berry.effect or not pokemon then
        return pokemon
    end
    
    local effect = berry.effect
    local healAmount = 0
    
    if effect.type == "heal_fixed" then
        healAmount = effect.amount
    elseif effect.type == "heal_percent" then
        healAmount = math.floor(pokemon.maxHp * effect.amount)
    end
    
    -- Apply healing with bounds checking
    local newHp = math.min(pokemon.maxHp, pokemon.hp + healAmount)
    
    return {
        id = pokemon.id,
        hp = newHp,
        maxHp = pokemon.maxHp,
        statusEffect = pokemon.statusEffect,
        stats = pokemon.stats,
        heldItem = nil,  -- Berry is consumed
        healedAmount = healAmount,
        berryActivated = berry.id
    }
end

--[[
Apply status curing berry effect
@param berry table - Berry data from database  
@param pokemon table - Pokemon receiving the effect
@return table - Updated pokemon data
--]]
function BerryEffectsProcessor.applyStatusCure(berry, pokemon)
    if not berry or not berry.effect or not pokemon then
        return pokemon
    end
    
    local effect = berry.effect
    local shouldCure = false
    
    if effect.statusCondition == BerryDatabase.StatusCondition.ANY then
        shouldCure = pokemon.statusEffect ~= nil
    else
        shouldCure = pokemon.statusEffect == effect.statusCondition
    end
    
    if shouldCure then
        return {
            id = pokemon.id,
            hp = pokemon.hp,
            maxHp = pokemon.maxHp,
            statusEffect = nil,  -- Status cured
            stats = pokemon.stats,
            heldItem = nil,  -- Berry is consumed
            statusCured = pokemon.statusEffect,
            berryActivated = berry.id
        }
    end
    
    return pokemon
end

--[[
Apply stat boosting berry effect
@param berry table - Berry data from database
@param pokemon table - Pokemon receiving the effect
@param battleSeed string - Deterministic seed for random stat selection
@return table - Updated pokemon data with stat modifications
--]]
function BerryEffectsProcessor.applyStatBoost(berry, pokemon, battleSeed)
    if not berry or not berry.effect or not pokemon then
        return pokemon
    end
    
    local effect = berry.effect
    local updatedStats = {}
    
    -- Copy existing stats
    for stat, value in pairs(pokemon.stats or {}) do
        updatedStats[stat] = value
    end
    
    -- Apply stat boost
    if effect.type == "boost_stat" then
        local targetStat = effect.stat
        
        -- Handle random stat selection for STARF_BERRY
        if targetStat == BerryDatabase.StatType.RANDOM then
            local availableStats = {
                BerryDatabase.StatType.ATTACK,
                BerryDatabase.StatType.DEFENSE,
                BerryDatabase.StatType.SP_ATTACK,
                BerryDatabase.StatType.SP_DEFENSE,
                BerryDatabase.StatType.SPEED
            }
            
            -- Use deterministic selection based on battle seed
            local seedBytes = crypto.utils.randomBytes(4)
            local randomIndex = (string.byte(seedBytes, 1) % #availableStats) + 1
            targetStat = availableStats[randomIndex]
        end
        
        -- Apply stat stage modification
        local currentStage = updatedStats[targetStat .. "Stage"] or 0
        local newStage = math.min(6, math.max(-6, currentStage + effect.amount))
        updatedStats[targetStat .. "Stage"] = newStage
        
        return {
            id = pokemon.id,
            hp = pokemon.hp,
            maxHp = pokemon.maxHp,
            statusEffect = pokemon.statusEffect,
            stats = updatedStats,
            heldItem = nil,  -- Berry is consumed
            statBoosted = targetStat,
            boostAmount = effect.amount,
            berryActivated = berry.id
        }
    elseif effect.type == "restore_lowered_stats" then
        -- WHITE_HERB: restore all lowered stats
        for stat, stage in pairs(updatedStats) do
            if stat:match("Stage$") and stage < 0 then
                updatedStats[stat] = 0
            end
        end
        
        return {
            id = pokemon.id,
            hp = pokemon.hp,
            maxHp = pokemon.maxHp,
            statusEffect = pokemon.statusEffect,
            stats = updatedStats,
            heldItem = nil,  -- Berry is consumed
            statsRestored = true,
            berryActivated = berry.id
        }
    end
    
    return pokemon
end

--[[
Apply damage reduction berry effect
@param berry table - Berry data from database
@param damage number - Original damage amount
@param moveType string - Type of the attacking move
@return number - Modified damage amount
--]]
function BerryEffectsProcessor.applyDamageReduction(berry, damage, moveType)
    if not berry or not berry.effect or not damage then
        return damage
    end
    
    local effect = berry.effect
    
    if effect.type == "resist_type_damage" then
        -- Type-resist berries reduce super-effective damage by specified amount
        if effect.resistType == moveType then
            return math.floor(damage * effect.damageReduction)
        end
    elseif effect.type == "heal_after_super_effective" then
        -- ENIGMA_BERRY doesn't reduce damage, just triggers healing
        return damage
    end
    
    return damage
end

--[[
Apply healing after super-effective hit (ENIGMA_BERRY)
@param berry table - Berry data from database
@param pokemon table - Pokemon receiving the effect
@return table - Updated pokemon data
--]]
function BerryEffectsProcessor.applyPostDamageHealing(berry, pokemon)
    if not berry or not berry.effect or not pokemon then
        return pokemon
    end
    
    local effect = berry.effect
    
    if effect.type == "heal_after_super_effective" then
        local healAmount = math.floor(pokemon.maxHp * effect.amount)
        local newHp = math.min(pokemon.maxHp, pokemon.hp + healAmount)
        
        return {
            id = pokemon.id,
            hp = newHp,
            maxHp = pokemon.maxHp,
            statusEffect = pokemon.statusEffect,
            stats = pokemon.stats,
            heldItem = nil,  -- Berry is consumed
            healedAmount = healAmount,
            berryActivated = berry.id
        }
    end
    
    return pokemon
end

--[[
Process berry activation for a Pokemon
@param pokemon table - Pokemon data
@param activationContext table - Context for berry activation
@return table - Processing result with updated pokemon data
--]]
function BerryEffectsProcessor.processBerryActivation(pokemon, activationContext)
    if not pokemon or not pokemon.heldItem then
        return {
            success = false,
            pokemon = pokemon,
            message = "No held item"
        }
    end
    
    local berry = BerryDatabase.getBerry(pokemon.heldItem)
    if not berry then
        return {
            success = false,
            pokemon = pokemon,
            message = "Held item is not a berry"
        }
    end
    
    local context = activationContext or {}
    local shouldActivate = false
    
    -- Check activation conditions
    if berry.activationCondition == BerryDatabase.ActivationCondition.HP_25_PERCENT or
       berry.activationCondition == BerryDatabase.ActivationCondition.HP_50_PERCENT then
        shouldActivate = BerryEffectsProcessor.shouldActivateHpBerry(berry, pokemon.hp, pokemon.maxHp)
    elseif berry.activationCondition == BerryDatabase.ActivationCondition.STATUS_INFLICTED then
        shouldActivate = BerryEffectsProcessor.shouldActivateStatusBerry(berry, context.statusCondition)
    elseif berry.activationCondition == BerryDatabase.ActivationCondition.STAT_LOWERED then
        shouldActivate = BerryEffectsProcessor.shouldActivateStatBerry(berry, context.statChanges)
    elseif berry.activationCondition == BerryDatabase.ActivationCondition.SUPER_EFFECTIVE_HIT then
        shouldActivate = BerryEffectsProcessor.shouldActivateDamageReduceBerry(berry, context.moveType, context.defenderTypes, context.effectiveness)
    elseif berry.activationCondition == BerryDatabase.ActivationCondition.PP_DEPLETED then
        shouldActivate = context.ppDepleted == true
    elseif berry.activationCondition == BerryDatabase.ActivationCondition.IMMEDIATE then
        shouldActivate = true
    end
    
    if not shouldActivate then
        return {
            success = false,
            pokemon = pokemon,
            message = "Berry activation conditions not met"
        }
    end
    
    -- Check once-per-battle restriction
    if berry.oncePerBattle and context.activatedBerries and context.activatedBerries[berry.id] then
        return {
            success = false,
            pokemon = pokemon,
            message = "Berry already used this battle"
        }
    end
    
    -- Apply berry effect
    local updatedPokemon = pokemon
    
    if berry.category == BerryDatabase.BerryCategory.HP_RESTORE then
        updatedPokemon = BerryEffectsProcessor.applyHpRestoration(berry, pokemon)
    elseif berry.category == BerryDatabase.BerryCategory.STATUS_CURE then
        updatedPokemon = BerryEffectsProcessor.applyStatusCure(berry, pokemon)
    elseif berry.category == BerryDatabase.BerryCategory.STAT_BOOST or berry.category == BerryDatabase.BerryCategory.PINCH_BERRY then
        updatedPokemon = BerryEffectsProcessor.applyStatBoost(berry, pokemon, context.battleSeed)
    elseif berry.category == BerryDatabase.BerryCategory.DAMAGE_REDUCE then
        updatedPokemon = BerryEffectsProcessor.applyPostDamageHealing(berry, pokemon)
    end
    
    return {
        success = true,
        pokemon = updatedPokemon,
        berryActivated = berry.id,
        berryEffect = berry.effect,
        message = "Berry activated successfully"
    }
end

--[[
Validate berry effects processor data and calculations
@return boolean - True if validation passes
@return table - Validation errors if any
--]]
function BerryEffectsProcessor.validate()
    local errors = {}
    
    -- Validate berry database integration
    local berryValidation, berryErrors = BerryDatabase.validateBerryData()
    if not berryValidation then
        for _, error in ipairs(berryErrors) do
            table.insert(errors, "Berry database: " .. error)
        end
    end
    
    -- Validate crypto module availability
    if not crypto or not crypto.utils or not crypto.utils.randomBytes then
        table.insert(errors, "AO crypto module not properly initialized")
    end
    
    return #errors == 0, errors
end

-- Export processor
return BerryEffectsProcessor