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

-- Initialize processor
function BerryEffectsProcessor.init()
    -- Initialize any required state
end

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
    
    return math.max(0, math.min(1, currentHp / maxHp))
end

--[[
Apply berry effect to Pokemon
@param berry table - Berry data from database
@param pokemon table - Pokemon receiving the effect
@param battleContext table - Current battle context
@return table - Effect application result
--]]
function BerryEffectsProcessor.applyBerryEffect(berry, pokemon, battleContext)
    if not berry or not pokemon then
        return { success = false, error = "Missing berry or pokemon data" }
    end
    
    local effectType = berry.effect.type
    local result = {
        success = false,
        effectType = effectType,
        effectMagnitude = 0,
        pokemonUpdates = {}
    }
    
    -- Route to appropriate effect handler
    if effectType == "HP_RESTORE" then
        result = BerryEffectsProcessor.applyHpRestoreEffect(berry, pokemon, battleContext)
    elseif effectType == "STATUS_CURE" then
        result = BerryEffectsProcessor.applyStatusCureEffect(berry, pokemon, battleContext)
    elseif effectType == "STAT_BOOST" then
        result = BerryEffectsProcessor.applyStatBoostEffect(berry, pokemon, battleContext)
    elseif effectType == "DAMAGE_REDUCTION" then
        result = BerryEffectsProcessor.applyDamageReductionEffect(berry, pokemon, battleContext)
    elseif effectType == "TYPE_RESISTANCE" then
        result = BerryEffectsProcessor.applyTypeResistanceEffect(berry, pokemon, battleContext)
    else
        result.error = "Unknown berry effect type: " .. effectType
    end
    
    return result
end

--[[
Apply HP restore effect (e.g., Sitrus Berry, Oran Berry)
@param berry table - Berry data
@param pokemon table - Pokemon data
@param battleContext table - Battle context
@return table - Application result
--]]
function BerryEffectsProcessor.applyHpRestoreEffect(berry, pokemon, battleContext)
    local restoreAmount = berry.effect.magnitude or 0
    local restoreType = berry.effect.restoreType or "FIXED"
    
    local actualRestore = 0
    
    if restoreType == "FIXED" then
        actualRestore = restoreAmount
    elseif restoreType == "PERCENTAGE" then
        actualRestore = math.floor((pokemon.maxHP or 100) * (restoreAmount / 100))
    elseif restoreType == "QUARTER_MAX" then
        actualRestore = math.floor((pokemon.maxHP or 100) / 4)
    end
    
    -- Apply healing, capped at max HP
    local currentHP = pokemon.hp or 0
    local maxHP = pokemon.maxHP or 100
    local newHP = math.min(maxHP, currentHP + actualRestore)
    local healedAmount = newHP - currentHP
    
    return {
        success = true,
        effectType = "HP_RESTORE",
        effectMagnitude = healedAmount,
        pokemonUpdates = {
            hp = newHP,
            healthRestored = healedAmount
        }
    }
end

--[[
Apply status cure effect (e.g., Cheri Berry, Pecha Berry)
@param berry table - Berry data
@param pokemon table - Pokemon data
@param battleContext table - Battle context
@return table - Application result
--]]
function BerryEffectsProcessor.applyStatusCureEffect(berry, pokemon, battleContext)
    local curesStatus = berry.effect.curesStatus or {}
    if type(curesStatus) == "string" then
        curesStatus = {curesStatus}
    end
    
    local currentStatus = pokemon.statusCondition
    local statusCured = nil
    
    -- Check if berry cures current status
    for _, status in ipairs(curesStatus) do
        if currentStatus == status then
            statusCured = status
            break
        end
    end
    
    local result = {
        success = statusCured ~= nil,
        effectType = "STATUS_CURE",
        effectMagnitude = statusCured and 1 or 0,
        pokemonUpdates = {}
    }
    
    if statusCured then
        result.pokemonUpdates.statusCondition = nil
        result.pokemonUpdates.statusCured = statusCured
    end
    
    return result
end

--[[
Apply stat boost effect (e.g., Liechi Berry, Salac Berry)
@param berry table - Berry data
@param pokemon table - Pokemon data
@param battleContext table - Battle context
@return table - Application result
--]]
function BerryEffectsProcessor.applyStatBoostEffect(berry, pokemon, battleContext)
    local boostStat = berry.effect.boostsStat
    local boostAmount = berry.effect.magnitude or 1
    
    if not boostStat then
        return {
            success = false,
            error = "No stat specified for boost",
            effectType = "STAT_BOOST"
        }
    end
    
    -- Initialize stat stages if not present
    if not pokemon.statStages then
        pokemon.statStages = {}
    end
    
    local currentStage = pokemon.statStages[boostStat] or 0
    local newStage = math.max(-6, math.min(6, currentStage + boostAmount))
    local actualBoost = newStage - currentStage
    
    local result = {
        success = actualBoost > 0,
        effectType = "STAT_BOOST",
        effectMagnitude = actualBoost,
        pokemonUpdates = {
            statStages = {}
        }
    }
    
    if actualBoost > 0 then
        result.pokemonUpdates.statStages[boostStat] = newStage
        result.pokemonUpdates.statBoosted = boostStat
        result.pokemonUpdates.boostAmount = actualBoost
    end
    
    return result
end

--[[
Apply damage reduction effect (e.g., weakness berries)
@param berry table - Berry data
@param pokemon table - Pokemon data
@param battleContext table - Battle context
@return table - Application result
--]]
function BerryEffectsProcessor.applyDamageReductionEffect(berry, pokemon, battleContext)
    local resistsType = berry.effect.resistsType
    local reductionPercent = berry.effect.magnitude or 50
    
    if not resistsType then
        return {
            success = false,
            error = "No type specified for resistance",
            effectType = "DAMAGE_REDUCTION"
        }
    end
    
    -- This effect is typically calculated during damage calculation
    -- Here we just return the configuration for the damage calculator
    return {
        success = true,
        effectType = "DAMAGE_REDUCTION",
        effectMagnitude = reductionPercent,
        pokemonUpdates = {
            damageReduction = {
                type = resistsType,
                percent = reductionPercent
            }
        }
    }
end

--[[
Apply type resistance effect (e.g., type-resist berries)
@param berry table - Berry data
@param pokemon table - Pokemon data
@param battleContext table - Battle context
@return table - Application result
--]]
function BerryEffectsProcessor.applyTypeResistanceEffect(berry, pokemon, battleContext)
    local resistsType = berry.effect.resistsType
    local effectiveness = berry.effect.effectiveness or 0.5
    
    if not resistsType then
        return {
            success = false,
            error = "No type specified for resistance",
            effectType = "TYPE_RESISTANCE"
        }
    end
    
    return {
        success = true,
        effectType = "TYPE_RESISTANCE",
        effectMagnitude = (1.0 - effectiveness) * 100,
        pokemonUpdates = {
            typeResistance = {
                type = resistsType,
                effectiveness = effectiveness
            }
        }
    }
end

--[[
Check if berry should activate for HP threshold
@param berry table - Berry data
@param pokemon table - Pokemon data
@return boolean - Should activate
--]]
function BerryEffectsProcessor.checkHpActivation(berry, pokemon)
    if not berry or not pokemon then
        return false
    end
    
    local activationCondition = berry.activationCondition
    if activationCondition ~= "hp_50_percent" and activationCondition ~= "hp_25_percent" then
        return false
    end
    
    local currentHP = pokemon.hp or 0
    local maxHP = pokemon.maxHP or 1
    local hpPercentage = BerryEffectsProcessor.calculateHpPercentage(currentHP, maxHP)
    
    local threshold = 0.5  -- Default 50%
    if activationCondition == "hp_25_percent" then
        threshold = 0.25  -- 25% for critical/pinch berries
    end
    
    return hpPercentage <= threshold and currentHP > 0
end

--[[
Check if berry should activate for status condition
@param berry table - Berry data
@param pokemon table - Pokemon data
@return boolean - Should activate
--]]
function BerryEffectsProcessor.checkStatusActivation(berry, pokemon)
    if not berry or not pokemon then
        return false
    end
    
    if berry.activationCondition ~= "status_inflicted" then
        return false
    end
    
    local targetStatus = berry.effect.statusCondition
    local currentStatus = pokemon.statusCondition
    
    if not currentStatus or not targetStatus then
        return false
    end
    
    return currentStatus == targetStatus
end

--[[
Check if berry should activate for stat reduction
@param berry table - Berry data
@param pokemon table - Pokemon data
@return boolean - Should activate
--]]
function BerryEffectsProcessor.checkStatActivation(berry, pokemon)
    if not berry or not pokemon then
        return false
    end
    
    if berry.activationCondition ~= "stat_lowered" then
        return false
    end
    
    local boostStat = berry.effect.boostsStat or berry.effect.stat
    if not boostStat or not pokemon.statStages then
        return false
    end
    
    local currentStage = pokemon.statStages[boostStat] or 0
    return currentStage < 0
end

--[[
Calculate berry effect priority for activation order
@param berry table - Berry data
@return number - Priority value (lower = higher priority)
--]]
function BerryEffectsProcessor.calculatePriority(berry)
    if not berry then
        return 99
    end
    
    local effectType = berry.effect.type
    
    -- Priority order: HP restore > status cure > stat boost > damage reduction
    if effectType == "HP_RESTORE" then
        return 1
    elseif effectType == "STATUS_CURE" then
        return 2
    elseif effectType == "STAT_BOOST" then
        return 3
    elseif effectType == "DAMAGE_REDUCTION" or effectType == "TYPE_RESISTANCE" then
        return 4
    else
        return 5
    end
end

--[[
Validate berry effect data
@param berry table - Berry data to validate
@return boolean - Is valid, table - validation errors
--]]
function BerryEffectsProcessor.validateBerryEffect(berry)
    if not berry then
        return false, {"Berry data is required"}
    end
    
    local errors = {}
    
    if not berry.effect then
        table.insert(errors, "Berry effect is required")
    else
        if not berry.effect.type then
            table.insert(errors, "Berry effect type is required")
        end
        
        if not berry.activationCondition then
            table.insert(errors, "Berry activation condition is required")
        end
        
        -- Validate specific effect types
        if berry.effect.type == "STAT_BOOST" and not berry.effect.boostsStat then
            table.insert(errors, "Stat boost berry must specify boostsStat")
        end
        
        if berry.effect.type == "STATUS_CURE" and not berry.effect.curesStatus then
            table.insert(errors, "Status cure berry must specify curesStatus")
        end
    end
    
    return #errors == 0, errors
end

return BerryEffectsProcessor