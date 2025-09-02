--[[
Pokemon Stat Calculator
Implements precise stat calculation formulas matching TypeScript reference implementation

Handles:
- Base stat calculations with IV, nature, and level factors
- Nature modifier application in correct order
- IV generation and validation
- Shiny determination
- Hidden Power type calculation
- Battle stat integration for temporary modifications
--]]

local StatCalculator = {}

-- Import dependencies
local NatureModifiers = require("data.constants.nature-modifiers")
local Enums = require("data.constants.enums")
local CryptoRNG = require("game-logic.rng.crypto-rng")
local PositionalMechanics = require("game-logic.battle.positional-mechanics")

-- Constants for stat calculations (matching TypeScript Math.floor/Math.ceil behavior)
local MAX_IV = 31
local MIN_IV = 0
local MIN_LEVEL = 1
local MAX_LEVEL = 100
local SHINY_ODDS_DIVISOR = 4096  -- 1/4096 chance for shiny

-- IV generation and validation

-- Generate random IVs for a Pokemon using AO crypto module for deterministic battles
-- @param seed: Optional seed for deterministic IV generation (for battle replay)
-- @return: Table with IVs for all 6 stats (0-31 range)
function StatCalculator.generateRandomIVs(seed)
    -- Initialize global RNG with seed for deterministic generation
    if seed then
        CryptoRNG.initGlobalRNG(seed)
    end
    
    return {
        hp = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        attack = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        defense = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        spAttack = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        spDefense = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV),
        speed = CryptoRNG.globalRandomInt(MIN_IV, MAX_IV)
    }
end

-- Validate IV data integrity
-- @param ivs: Table with IV values
-- @return: Boolean indicating if all IVs are valid (0-31 range)
function StatCalculator.validateIVs(ivs)
    if type(ivs) ~= "table" then
        return false, "IVs must be a table"
    end
    
    local requiredStats = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
    
    for _, stat in ipairs(requiredStats) do
        local iv = ivs[stat]
        if type(iv) ~= "number" then
            return false, "IV for " .. stat .. " must be a number"
        end
        if iv < MIN_IV or iv > MAX_IV then
            return false, "IV for " .. stat .. " must be between " .. MIN_IV .. " and " .. MAX_IV
        end
        if iv ~= math.floor(iv) then
            return false, "IV for " .. stat .. " must be an integer"
        end
    end
    
    return true
end

-- Shiny determination based on IV values

-- Calculate shiny probability based on IV combination
-- @param ivs: Table with IV values
-- @return: Boolean indicating if Pokemon is shiny
function StatCalculator.calculateShinyFromIVs(ivs)
    if not StatCalculator.validateIVs(ivs) then
        return false
    end
    
    -- Calculate shiny value using traditional method
    -- Combines HP, Attack, Defense, and Speed IVs
    local shinyValue = (ivs.hp * 2048) + (ivs.attack * 128) + (ivs.defense * 8) + ivs.speed
    
    return (shinyValue % SHINY_ODDS_DIVISOR) == 0
end

-- Stat calculation functions

-- Calculate HP stat using Pokemon formula
-- @param baseHp: Base HP stat from species data
-- @param iv: HP IV value (0-31)
-- @param level: Pokemon level (1-100)
-- @return: Calculated HP stat
function StatCalculator.calculateHPStat(baseHp, iv, level)
    -- Special case: Shedinja always has 1 HP
    if baseHp == 1 then
        return 1
    end
    
    if level == 1 then
        return baseHp + iv + 10
    end
    
    -- HP Formula: floor(((2 * Base + IV) * Level) / 100) + Level + 10
    local calculation = math.floor(((2 * baseHp + iv) * level) / 100) + level + 10
    return calculation
end

-- Calculate non-HP stat using Pokemon formula
-- @param baseStat: Base stat value from species data
-- @param iv: IV value for this stat (0-31)  
-- @param level: Pokemon level (1-100)
-- @param natureModifier: Nature multiplier (0.9, 1.0, or 1.1)
-- @return: Calculated stat value
function StatCalculator.calculateStat(baseStat, iv, level, natureModifier)
    if level == 1 then
        return math.floor((baseStat + iv) * (natureModifier or 1.0))
    end
    
    -- Stat Formula: floor((floor(((2 * Base + IV) * Level) / 100) + 5) * Nature)
    local baseCalc = math.floor(((2 * baseStat + iv) * level) / 100) + 5
    local calculation = math.floor(baseCalc * (natureModifier or 1.0))
    return calculation
end

-- Calculate all Pokemon stats
-- @param baseStats: Table with base stats {hp, attack, defense, spAttack, spDefense, speed}
-- @param ivs: Table with IV values {hp, attack, defense, spAttack, spDefense, speed}
-- @param level: Pokemon level (1-100)
-- @param natureId: Nature ID from Enums.Nature
-- @return: Table with calculated stats
function StatCalculator.calculateAllStats(baseStats, ivs, level, natureId)
    -- Validate inputs
    if type(baseStats) ~= "table" or type(ivs) ~= "table" then
        return nil, "Base stats and IVs must be tables"
    end
    
    if type(level) ~= "number" or level < MIN_LEVEL or level > MAX_LEVEL then
        return nil, "Level must be between " .. MIN_LEVEL .. " and " .. MAX_LEVEL
    end
    
    local valid, error = StatCalculator.validateIVs(ivs)
    if not valid then
        return nil, error
    end
    
    if not NatureModifiers.natureExists(natureId) then
        return nil, "Invalid nature ID: " .. tostring(natureId)
    end
    
    -- Get nature modifiers
    local natureMultipliers = NatureModifiers.getAllModifiers(natureId)
    
    -- Convert indexed baseStats array to named fields if needed
    -- Species database provides [1,2,3,4,5,6] but we need {hp, attack, defense, spAttack, spDefense, speed}
    local normalizedBaseStats = baseStats
    if baseStats[1] and not baseStats.hp then
        normalizedBaseStats = {
            hp = baseStats[1],
            attack = baseStats[2],
            defense = baseStats[3],
            spAttack = baseStats[4],
            spDefense = baseStats[5],
            speed = baseStats[6]
        }
    end
    
    -- Calculate stats
    local stats = {}
    
    -- HP calculation (no nature modifier)
    stats.hp = StatCalculator.calculateHPStat(normalizedBaseStats.hp, ivs.hp, level)
    
    -- Other stats with nature modifiers
    stats.attack = StatCalculator.calculateStat(normalizedBaseStats.attack, ivs.attack, level, natureMultipliers[2])
    stats.defense = StatCalculator.calculateStat(normalizedBaseStats.defense, ivs.defense, level, natureMultipliers[3])
    stats.spAttack = StatCalculator.calculateStat(normalizedBaseStats.spAttack, ivs.spAttack, level, natureMultipliers[4])
    stats.spDefense = StatCalculator.calculateStat(normalizedBaseStats.spDefense, ivs.spDefense, level, natureMultipliers[5])
    stats.speed = StatCalculator.calculateStat(normalizedBaseStats.speed, ivs.speed, level, natureMultipliers[6])
    
    return stats
end

-- Hidden Power type calculation (if used in game)

-- Calculate Hidden Power type from IVs
-- @param ivs: Table with IV values
-- @return: Type ID for Hidden Power move
function StatCalculator.calculateHiddenPowerType(ivs)
    if not StatCalculator.validateIVs(ivs) then
        return nil, "Invalid IVs for Hidden Power calculation"
    end
    
    -- Hidden Power type formula using IV remainders
    local typeValue = 0
    
    -- Each stat contributes based on IV % 2
    typeValue = typeValue + (ivs.hp % 2)
    typeValue = typeValue + ((ivs.attack % 2) * 2)
    typeValue = typeValue + ((ivs.defense % 2) * 4)
    typeValue = typeValue + ((ivs.speed % 2) * 8)
    typeValue = typeValue + ((ivs.spAttack % 2) * 16)
    typeValue = typeValue + ((ivs.spDefense % 2) * 32)
    
    -- Map to type (excludes Normal and ???)
    local hiddenPowerTypes = {
        Enums.PokemonType.FIGHTING, -- 0
        Enums.PokemonType.FLYING,   -- 1
        Enums.PokemonType.POISON,   -- 2
        Enums.PokemonType.GROUND,   -- 3
        Enums.PokemonType.ROCK,     -- 4
        Enums.PokemonType.BUG,      -- 5
        Enums.PokemonType.GHOST,    -- 6
        Enums.PokemonType.STEEL,    -- 7
        Enums.PokemonType.FIRE,     -- 8
        Enums.PokemonType.WATER,    -- 9
        Enums.PokemonType.GRASS,    -- 10
        Enums.PokemonType.ELECTRIC, -- 11
        Enums.PokemonType.PSYCHIC,  -- 12
        Enums.PokemonType.ICE,      -- 13
        Enums.PokemonType.DRAGON,   -- 14
        Enums.PokemonType.DARK      -- 15
    }
    
    local typeIndex = (typeValue % 15) + 1  -- Lua arrays are 1-indexed
    return hiddenPowerTypes[typeIndex]
end

-- Battle integration functions

-- Apply stat stage modifications for battle
-- @param baseStat: Original calculated stat
-- @param stages: Stat stage changes (-6 to +6)
-- @return: Modified stat for battle
function StatCalculator.applyStatStages(baseStat, stages)
    if stages == 0 then
        return baseStat
    end
    
    -- Stat stage multipliers (traditional Pokemon formula)
    local multipliers = {
        [-6] = 2/8, [-5] = 2/7, [-4] = 2/6, [-3] = 2/5, [-2] = 2/4, [-1] = 2/3,
        [0] = 1,
        [1] = 3/2, [2] = 4/2, [3] = 5/2, [4] = 6/2, [5] = 7/2, [6] = 8/2
    }
    
    local multiplier = multipliers[math.max(-6, math.min(6, stages))]
    return math.floor(baseStat * multiplier)
end

-- Apply field condition stat modifications
-- @param pokemon: Pokemon data with calculated stats
-- @param fieldConditions: Current field conditions
-- @return: Pokemon stats modified by field conditions
function StatCalculator.applyFieldConditionStatModifications(pokemon, fieldConditions)
    if not pokemon or not pokemon.stats or not fieldConditions then
        return pokemon
    end
    
    local FieldConditions = require("game-logic.battle.field-conditions")
    local modifiedStats = {}
    
    -- Copy all stats
    for stat, value in pairs(pokemon.stats) do
        modifiedStats[stat] = value
    end
    
    -- Check for Wonder Room (swaps Defense and Special Defense)
    for conditionType, conditionData in pairs(fieldConditions) do
        if conditionType == FieldConditions.FieldEffectType.WONDER_ROOM and 
           conditionData.duration and conditionData.duration > 0 then
            
            -- Swap Defense and Special Defense stats
            local originalDef = modifiedStats.defense or modifiedStats.def or 0
            local originalSpDef = modifiedStats.spDefense or modifiedStats.spdef or 0
            
            -- Perform the swap with both naming conventions
            modifiedStats.defense = originalSpDef
            modifiedStats.spDefense = originalDef
            modifiedStats.def = originalSpDef  -- Compatibility
            modifiedStats.spdef = originalDef  -- Compatibility
            
            break -- Only one Wonder Room can be active
        end
    end
    
    -- Create modified Pokemon copy
    local modifiedPokemon = {}
    for k, v in pairs(pokemon) do
        modifiedPokemon[k] = v
    end
    modifiedPokemon.stats = modifiedStats
    modifiedPokemon.wonder_room_active = true  -- Mark for debugging
    
    return modifiedPokemon
end

-- Check if stat is swapped by field conditions
-- @param statName: Name of the stat to check
-- @param fieldConditions: Current field conditions
-- @return: Original stat name that should be used, boolean indicating if swapped
function StatCalculator.getFieldConditionStatMapping(statName, fieldConditions)
    if not statName or not fieldConditions then
        return statName, false
    end
    
    local FieldConditions = require("game-logic.battle.field-conditions")
    
    -- Check for Wonder Room
    for conditionType, conditionData in pairs(fieldConditions) do
        if conditionType == FieldConditions.FieldEffectType.WONDER_ROOM and 
           conditionData.duration and conditionData.duration > 0 then
            
            -- Map swapped stats
            if statName == "defense" or statName == "def" then
                return "spDefense", true  -- Defense becomes Special Defense
            elseif statName == "spDefense" or statName == "spdef" then
                return "defense", true   -- Special Defense becomes Defense
            end
            
            break
        end
    end
    
    return statName, false
end

-- Calculate effective stat for damage calculation with field conditions
-- @param pokemon: Pokemon data
-- @param statName: Name of stat to calculate
-- @param fieldConditions: Current field conditions
-- @param stages: Stat stage modifications
-- @return: Effective stat value considering field conditions
function StatCalculator.calculateEffectiveStatWithFieldConditions(pokemon, statName, fieldConditions, stages)
    if not pokemon or not pokemon.stats then
        return 0
    end
    
    -- Get field condition mapping
    local effectiveStatName, isSwapped = StatCalculator.getFieldConditionStatMapping(statName, fieldConditions)
    
    -- Get base stat (after any swapping)
    local baseStat = pokemon.stats[effectiveStatName] or 0
    
    -- Apply stage modifications
    local finalStat = StatCalculator.applyStatStages(baseStat, stages or 0)
    
    return finalStat, isSwapped
end

-- Recalculate stats after level change or evolution
-- @param pokemon: Pokemon data table with baseStats, ivs, level, natureId
-- @return: Updated stats table
function StatCalculator.recalculateStats(pokemon)
    if not pokemon.baseStats or not pokemon.ivs or not pokemon.level or not pokemon.natureId then
        return nil, "Missing required Pokemon data for stat recalculation"
    end
    
    return StatCalculator.calculateAllStats(
        pokemon.baseStats, 
        pokemon.ivs, 
        pokemon.level, 
        pokemon.natureId
    )
end

-- Breeding-related functions

-- Generate child IVs from parent IVs (simplified inheritance)
-- @param parent1IVs: First parent's IVs
-- @param parent2IVs: Second parent's IVs
-- @param seed: Optional seed for deterministic breeding (for battle replay)
-- @return: Child IVs with inheritance from both parents
function StatCalculator.generateChildIVs(parent1IVs, parent2IVs, seed)
    if not StatCalculator.validateIVs(parent1IVs) or not StatCalculator.validateIVs(parent2IVs) then
        return nil, "Invalid parent IVs for breeding"
    end
    
    local childIVs = {}
    local stats = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
    
    if seed then
        CryptoRNG.initGlobalRNG(seed)
    end
    
    for _, stat in ipairs(stats) do
        -- 50% chance to inherit from each parent, with some random variation
        if CryptoRNG.globalRandom() < 0.5 then
            -- Inherit from parent 1 with slight variation
            childIVs[stat] = math.min(MAX_IV, math.max(MIN_IV, parent1IVs[stat] + CryptoRNG.globalRandomInt(-2, 2)))
        else
            -- Inherit from parent 2 with slight variation  
            childIVs[stat] = math.min(MAX_IV, math.max(MIN_IV, parent2IVs[stat] + CryptoRNG.globalRandomInt(-2, 2)))
        end
    end
    
    return childIVs
end

-- Utility functions

-- Get stat modifier from nature for specific stat
-- @param natureId: Nature ID
-- @param statName: Stat name ("attack", "defense", etc.)
-- @return: Multiplier value for the stat
function StatCalculator.getNatureModifier(natureId, statName)
    local statIndexMap = {
        hp = 1, attack = 2, defense = 3, 
        spAttack = 4, spDefense = 5, speed = 6
    }
    
    local statIndex = statIndexMap[statName]
    if not statIndex then
        return 1.0
    end
    
    return NatureModifiers.getStatModifier(natureId, statIndex)
end

-- Check if stat calculation matches expected value (for testing)
-- @param expected: Expected stat value
-- @param actual: Calculated stat value  
-- @param tolerance: Allowed difference (default 0)
-- @return: Boolean indicating if values match within tolerance
function StatCalculator.validateStatCalculation(expected, actual, tolerance)
    tolerance = tolerance or 0
    return math.abs(expected - actual) <= tolerance
end

-- Positional Abilities System
-- Handle Plus/Minus and other position-dependent abilities

-- Positional abilities that require adjacency
StatCalculator.PositionalAbilities = {
    PLUS = "Plus",
    MINUS = "Minus",
    -- Add other positional abilities as needed
}

-- Check if ability is positional (requires adjacency)
-- @param abilityName: Name of the ability
-- @return: Boolean indicating if ability is positional
function StatCalculator.isPositionalAbility(abilityName)
    if not abilityName then
        return false
    end
    
    for _, positionalAbility in pairs(StatCalculator.PositionalAbilities) do
        if abilityName == positionalAbility then
            return true
        end
    end
    
    return false
end

-- Check if Pokemon has Plus or Minus ability and should receive bonus
-- @param pokemon: Pokemon to check
-- @param battleState: Current battle state
-- @return: Boolean indicating if positional ability bonus applies
function StatCalculator.checkPositionalAbilityActivation(pokemon, battleState)
    if not pokemon or not pokemon.ability or not battleState then
        return false
    end
    
    local abilityName = pokemon.ability
    
    -- Must have Plus or Minus ability
    if abilityName ~= StatCalculator.PositionalAbilities.PLUS and 
       abilityName ~= StatCalculator.PositionalAbilities.MINUS then
        return false
    end
    
    -- Must be in double battle format
    if not PositionalMechanics.supportsPositionalMechanics(battleState) then
        return false
    end
    
    -- Check adjacent allies for complementary abilities
    local adjacentAllies = PositionalMechanics.getAdjacentAllies(battleState, pokemon)
    
    for _, ally in ipairs(adjacentAllies) do
        if ally and ally.ability then
            -- Plus and Minus activate when adjacent to each other
            if (abilityName == StatCalculator.PositionalAbilities.PLUS and 
                ally.ability == StatCalculator.PositionalAbilities.MINUS) or
               (abilityName == StatCalculator.PositionalAbilities.MINUS and 
                ally.ability == StatCalculator.PositionalAbilities.PLUS) then
                return true
            end
        end
    end
    
    return false
end

-- Calculate stat modifier from positional abilities
-- @param pokemon: Pokemon with the positional ability
-- @param statType: Type of stat ("spAttack" or "spatk" for Plus/Minus)
-- @param battleState: Current battle state
-- @return: Stat modifier (1.0 = no change, 1.5 = +50% boost)
function StatCalculator.getPositionalAbilityStatModifier(pokemon, statType, battleState)
    if not pokemon or not statType or not battleState then
        return 1.0
    end
    
    -- Check if positional ability should activate
    if not StatCalculator.checkPositionalAbilityActivation(pokemon, battleState) then
        return 1.0
    end
    
    local abilityName = pokemon.ability
    
    -- Plus and Minus boost Special Attack by 50%
    if (abilityName == StatCalculator.PositionalAbilities.PLUS or
        abilityName == StatCalculator.PositionalAbilities.MINUS) and
       (statType == "spAttack" or statType == "spatk") then
        return 1.5 -- +50% boost
    end
    
    -- Add other positional ability stat modifications here
    
    return 1.0
end

-- Apply positional ability effects to Pokemon stats during battle
-- @param pokemon: Pokemon to apply effects to
-- @param battleState: Current battle state
-- @return: Modified stat values or original stats if no changes
function StatCalculator.applyPositionalAbilityEffects(pokemon, battleState)
    if not pokemon or not pokemon.stats or not battleState then
        return pokemon.stats
    end
    
    -- Check if any positional abilities are active
    if not StatCalculator.checkPositionalAbilityActivation(pokemon, battleState) then
        return pokemon.stats
    end
    
    -- Create modified stats table
    local modifiedStats = {}
    for statName, statValue in pairs(pokemon.stats) do
        modifiedStats[statName] = statValue
    end
    
    -- Apply Plus/Minus special attack boost
    local spAttackModifier = StatCalculator.getPositionalAbilityStatModifier(pokemon, "spAttack", battleState)
    if spAttackModifier ~= 1.0 then
        local spAttackStat = modifiedStats.spAttack or modifiedStats.spatk
        if spAttackStat then
            local boostedValue = math.floor(spAttackStat * spAttackModifier)
            modifiedStats.spAttack = boostedValue
            if modifiedStats.spatk then
                modifiedStats.spatk = boostedValue
            end
        end
    end
    
    return modifiedStats
end

-- Get positional ability status information
-- @param pokemon: Pokemon to check
-- @param battleState: Current battle state
-- @return: Information about positional ability status
function StatCalculator.getPositionalAbilityInfo(pokemon, battleState)
    if not pokemon then
        return {
            has_positional_ability = false,
            ability_name = nil,
            is_active = false,
            boost_applied = false,
            adjacent_allies = 0
        }
    end
    
    local abilityName = pokemon.ability
    local hasPositionalAbility = StatCalculator.isPositionalAbility(abilityName)
    local isActive = false
    local boostApplied = false
    local adjacentAllies = {}
    
    if hasPositionalAbility and battleState then
        isActive = StatCalculator.checkPositionalAbilityActivation(pokemon, battleState)
        if isActive then
            boostApplied = StatCalculator.getPositionalAbilityStatModifier(pokemon, "spAttack", battleState) ~= 1.0
        end
        adjacentAllies = PositionalMechanics.getAdjacentAllies(battleState, pokemon)
    end
    
    return {
        has_positional_ability = hasPositionalAbility,
        ability_name = abilityName,
        is_active = isActive,
        boost_applied = boostApplied,
        adjacent_allies = #adjacentAllies,
        ally_abilities = {}
    }
end

-- Check for positional ability interactions between Pokemon
-- @param pokemon1: First Pokemon
-- @param pokemon2: Second Pokemon  
-- @return: Information about their positional ability interaction
function StatCalculator.checkPositionalAbilityInteraction(pokemon1, pokemon2)
    if not pokemon1 or not pokemon2 then
        return {
            interaction_exists = false,
            interaction_type = nil,
            both_benefit = false
        }
    end
    
    local ability1 = pokemon1.ability
    local ability2 = pokemon2.ability
    
    -- Plus/Minus interaction
    if (ability1 == StatCalculator.PositionalAbilities.PLUS and 
        ability2 == StatCalculator.PositionalAbilities.MINUS) or
       (ability1 == StatCalculator.PositionalAbilities.MINUS and 
        ability2 == StatCalculator.PositionalAbilities.PLUS) then
        return {
            interaction_exists = true,
            interaction_type = "Plus/Minus",
            both_benefit = true,
            stat_boost = "Special Attack +50%"
        }
    end
    
    return {
        interaction_exists = false,
        interaction_type = nil,
        both_benefit = false
    }
end

-- Update Pokemon battle data with positional ability effects
-- @param pokemon: Pokemon to update
-- @param battleState: Current battle state
-- @return: Success boolean and update details
function StatCalculator.updatePositionalAbilityBattleData(pokemon, battleState)
    if not pokemon or not battleState then
        return false, "Missing required parameters"
    end
    
    -- Initialize battle data if not present
    if not pokemon.battleData then
        pokemon.battleData = {}
    end
    
    -- Store original stats if not already stored
    if not pokemon.battleData.originalStats then
        pokemon.battleData.originalStats = {}
        for statName, statValue in pairs(pokemon.stats) do
            pokemon.battleData.originalStats[statName] = statValue
        end
    end
    
    -- Apply positional ability effects
    local modifiedStats = StatCalculator.applyPositionalAbilityEffects(pokemon, battleState)
    
    -- Check if stats were actually modified
    local statsChanged = false
    for statName, statValue in pairs(modifiedStats) do
        if pokemon.stats[statName] ~= statValue then
            statsChanged = true
            break
        end
    end
    
    if statsChanged then
        -- Update current stats with positional ability modifications
        pokemon.stats = modifiedStats
        
        -- Store positional ability info in battle data
        pokemon.battleData.positionalAbilityInfo = StatCalculator.getPositionalAbilityInfo(pokemon, battleState)
        pokemon.battleData.positionalAbilityActive = true
        
        return true, "Positional ability effects applied"
    else
        pokemon.battleData.positionalAbilityActive = false
        return true, "No positional ability effects to apply"
    end
end

-- Reset positional ability effects (when Pokemon switches out or battle ends)
-- @param pokemon: Pokemon to reset
-- @return: Success boolean and reset details
function StatCalculator.resetPositionalAbilityEffects(pokemon)
    if not pokemon or not pokemon.battleData then
        return false, "No battle data to reset"
    end
    
    -- Restore original stats if they were modified
    if pokemon.battleData.originalStats and pokemon.battleData.positionalAbilityActive then
        pokemon.stats = pokemon.battleData.originalStats
        pokemon.battleData.positionalAbilityActive = false
        pokemon.battleData.positionalAbilityInfo = nil
        
        return true, "Positional ability effects reset"
    end
    
    return true, "No positional ability effects to reset"
end

return StatCalculator