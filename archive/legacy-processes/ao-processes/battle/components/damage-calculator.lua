-- Battle Process Damage Calculator
-- Extracted from game-logic.battle.damage-calculator for dedicated battle process
-- Maintains exact mathematical parity with TypeScript implementation
-- Epic 32.3: Battle Engine Process Extraction

local TypeChart = require("data.constants.type-chart")
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Berry system integration
local BerryActivationManager = require("game-logic.items.berry-activation-manager")
local BerryEffectsProcessor = require("game-logic.items.berry-effects-processor")

local DamageCalculator = {}

-- Damage calculation constants (matching TypeScript implementation)
local DAMAGE_CONSTANTS = {
    BASE_LEVEL_MULTIPLIER = 2,
    LEVEL_DIVISOR = 5,
    LEVEL_ADD = 2,
    FORMULA_DIVISOR = 50,
    FORMULA_ADD = 2,
    STAB_MULTIPLIER = 1.5,
    CRITICAL_MULTIPLIER = 1.5,
    VARIANCE_MIN = 0.85,
    VARIANCE_MAX = 1.0,
    STAT_STAGE_NUMERATORS = {2, 2, 2, 2, 2, 2, 2, 3, 4},  -- -6 to +6 (index 1-13, with 7 = neutral)
    STAT_STAGE_DENOMINATORS = {8, 7, 6, 5, 4, 3, 2, 2, 2},
    -- Spread move damage reduction constants
    SPREAD_DAMAGE_REDUCTION = 0.75, -- Standard 25% reduction for spread moves
    MIN_SPREAD_DAMAGE = 1 -- Minimum damage for spread moves
}

-- Weather damage multipliers
local WEATHER_MULTIPLIERS = {
    RAIN = {
        [Enums.PokemonType.WATER] = 1.5,
        [Enums.PokemonType.FIRE] = 0.5
    },
    SUN = {
        [Enums.PokemonType.FIRE] = 1.5,
        [Enums.PokemonType.WATER] = 0.5
    },
    SANDSTORM = {
        -- No direct damage multipliers, handled elsewhere
    },
    HAIL = {
        -- No direct damage multipliers, handled elsewhere  
    }
}

-- Calculate base damage using exact TypeScript formula
-- Formula: ((2 * Level / 5 + 2) * Power * A / D / 50 + 2)
-- @param level: Pokemon level (1-100)
-- @param power: Move power
-- @param attack: Effective attack stat
-- @param defense: Effective defense stat
-- @return: Base damage (integer)
local function calculateBaseDamage(level, power, attack, defense)
    if not level or not power or not attack or not defense then
        error("Base damage calculation requires level, power, attack, and defense")
    end
    
    if power <= 0 or attack <= 0 or defense <= 0 then
        return 0
    end
    
    -- Exact TypeScript formula implementation using Math.floor equivalents
    -- Formula: ((2 * Level / 5 + 2) * Power * A / D / 50 + 2)
    local levelComponent = math.floor((DAMAGE_CONSTANTS.BASE_LEVEL_MULTIPLIER * level) / DAMAGE_CONSTANTS.LEVEL_DIVISOR) + DAMAGE_CONSTANTS.LEVEL_ADD
    local powerComponent = levelComponent * power
    local attackDefenseRatio = math.floor((powerComponent * attack) / defense)
    local finalComponent = math.floor(attackDefenseRatio / DAMAGE_CONSTANTS.FORMULA_DIVISOR)
    local baseDamage = finalComponent + DAMAGE_CONSTANTS.FORMULA_ADD
    
    return math.max(1, baseDamage)  -- Minimum 1 damage
end

-- Get effective attack or defense stat with stat stage modifications
-- @param baseStat: Base stat value
-- @param statStage: Stat stage modification (-6 to +6)
-- @return: Effective stat after modifications
local function getEffectiveStat(baseStat, statStage)
    if not baseStat then
        error("Effective stat calculation requires base stat")
    end
    
    statStage = statStage or 0
    
    -- Clamp stat stage to valid range
    statStage = math.max(-6, math.min(6, statStage))
    
    -- Convert to array index (0 = index 7, -6 = index 1, +6 = index 13)
    local index = statStage + 7
    
    local numerator = DAMAGE_CONSTANTS.STAT_STAGE_NUMERATORS[index]
    local denominator = DAMAGE_CONSTANTS.STAT_STAGE_DENOMINATORS[index]
    
    return math.floor((baseStat * numerator) / denominator)
end

-- Calculate critical hit damage
-- @param baseDamage: Base damage before critical hit
-- @param criticalHit: Boolean indicating if move is critical hit
-- @return: Damage after critical hit multiplier
local function applyCriticalHit(baseDamage, criticalHit)
    if not criticalHit then
        return baseDamage
    end
    
    return math.floor(baseDamage * DAMAGE_CONSTANTS.CRITICAL_MULTIPLIER)
end

-- Check if move gets STAB (Same Type Attack Bonus)
-- @param moveType: Type of the move being used
-- @param pokemonTypes: Array of Pokemon types or single type
-- @return: Boolean indicating if STAB applies
local function checkSTAB(moveType, pokemonTypes)
    if not moveType or not pokemonTypes then
        return false
    end
    
    -- Convert single type to array
    if type(pokemonTypes) ~= "table" then
        pokemonTypes = {pokemonTypes}
    end
    
    -- Check if move type matches any Pokemon type
    for _, pokemonType in ipairs(pokemonTypes) do
        if pokemonType == moveType then
            return true
        end
    end
    
    return false
end

-- Apply STAB multiplier to damage
-- @param damage: Damage before STAB
-- @param hasSTAB: Boolean indicating if STAB applies
-- @return: Damage after STAB multiplier
local function applySTAB(damage, hasSTAB)
    if not hasSTAB then
        return damage
    end
    
    return math.floor(damage * DAMAGE_CONSTANTS.STAB_MULTIPLIER)
end

-- Apply weather effects to damage
-- @param damage: Damage before weather effects
-- @param moveType: Type of the move
-- @param weather: Current weather condition
-- @return: Damage after weather multiplier
local function applyWeatherEffects(damage, moveType, weather)
    if not weather or not moveType then
        return damage
    end
    
    local weatherMultipliers = WEATHER_MULTIPLIERS[weather]
    if not weatherMultipliers then
        return damage
    end
    
    local multiplier = weatherMultipliers[moveType]
    if not multiplier then
        return damage
    end
    
    return math.floor(damage * multiplier)
end

-- Apply random damage variance (85%-100%)
-- @param damage: Damage before variance
-- @return: Final damage after random variance
local function applyDamageVariance(damage)
    if damage <= 0 then
        return 0
    end
    
    -- Generate random multiplier between 85% and 100%
    local randomMultiplier = BattleRNG.randomFloat() * (DAMAGE_CONSTANTS.VARIANCE_MAX - DAMAGE_CONSTANTS.VARIANCE_MIN) + DAMAGE_CONSTANTS.VARIANCE_MIN
    
    return math.max(1, math.floor(damage * randomMultiplier))
end

-- Determine if move results in critical hit
-- @param criticalHitRatio: Critical hit stage (0-4, higher = more likely)
-- @param pokemon: Pokemon data (for abilities/items that affect crit rate)
-- @return: Boolean indicating critical hit
local function determineCriticalHit(criticalHitRatio, pokemon)
    criticalHitRatio = criticalHitRatio or 0
    
    -- Critical hit thresholds based on ratio (matching TypeScript)
    local criticalThresholds = {16, 8, 2, 1, 1}  -- Indices 1-5 for ratios 0-4
    
    local thresholdIndex = math.min(criticalHitRatio + 1, 5)
    local threshold = criticalThresholds[thresholdIndex]
    
    return BattleRNG.criticalHit(threshold)
end

-- Apply ability effects to damage calculation
-- @param damage: Current damage
-- @param attacker: Attacking Pokemon data
-- @param defender: Defending Pokemon data  
-- @param moveData: Move data
-- @param battleState: Current battle state
-- @return: Damage after ability modifications
local function applyAbilityEffects(damage, attacker, defender, moveData, battleState)
    -- Integration point for ability system
    -- This will be expanded when ability processing is integrated
    return damage
end

-- Apply item effects to damage calculation
-- @param damage: Current damage
-- @param attacker: Attacking Pokemon data
-- @param defender: Defending Pokemon data
-- @param moveData: Move data
-- @param battleState: Current battle state  
-- @return: Damage after item modifications
local function applyItemEffects(damage, attacker, defender, moveData, battleState)
    -- Integration point for item system
    -- This will be expanded when item processing is integrated
    return damage
end

-- Main damage calculation function
-- @param params: Table containing all damage calculation parameters
--   - attacker: Pokemon using the move
--   - defender: Pokemon receiving damage
--   - moveData: Data about the move being used
--   - battleState: Current battle conditions
--   - options: Optional parameters (criticalHitForced, etc.)
-- @return: Table with damage result and calculation details
function DamageCalculator.calculateDamage(params)
    if not params or not params.attacker or not params.defender or not params.moveData then
        error("Damage calculation requires attacker, defender, and moveData")
    end
    
    local attacker = params.attacker
    local defender = params.defender
    local moveData = params.moveData
    local battleState = params.battleState or {}
    local options = params.options or {}
    
    -- Check for status moves (no damage)
    if moveData.category == Enums.MoveCategory.STATUS then
        return {
            damage = 0,
            criticalHit = false,
            typeEffectiveness = 1.0,
            details = {
                reason = "Status move deals no damage"
            }
        }
    end
    
    -- Check for zero power moves
    if not moveData.power or moveData.power <= 0 then
        return {
            damage = 0,
            criticalHit = false,
            typeEffectiveness = 1.0,
            details = {
                reason = "Move has no power"
            }
        }
    end
    
    -- Determine if critical hit occurs
    local criticalHit = options.criticalHitForced or determineCriticalHit(moveData.criticalHitRatio or 0, attacker)
    
    -- Get effective stats with stat stage modifications
    local attackStat = getEffectiveStat(
        moveData.category == Enums.MoveCategory.SPECIAL and attacker.stats.special_attack or attacker.stats.attack,
        moveData.category == Enums.MoveCategory.SPECIAL and (attacker.statStages.special_attack or 0) or (attacker.statStages.attack or 0)
    )
    
    local defenseStat = getEffectiveStat(
        moveData.category == Enums.MoveCategory.SPECIAL and defender.stats.special_defense or defender.stats.defense,
        moveData.category == Enums.MoveCategory.SPECIAL and (defender.statStages.special_defense or 0) or (defender.statStages.defense or 0)
    )
    
    -- Calculate base damage
    local baseDamage = calculateBaseDamage(attacker.level, moveData.power, attackStat, defenseStat)
    
    -- Apply critical hit
    baseDamage = applyCriticalHit(baseDamage, criticalHit)
    
    -- Apply STAB
    local hasSTAB = checkSTAB(moveData.type, attacker.types)
    baseDamage = applySTAB(baseDamage, hasSTAB)
    
    -- Calculate type effectiveness
    local typeEffectiveness = TypeChart.getAttackTypeEffectiveness(moveData.type, defender.types)
    baseDamage = math.floor(baseDamage * typeEffectiveness)
    
    -- Apply weather effects
    baseDamage = applyWeatherEffects(baseDamage, moveData.type, battleState.weather)
    
    -- Apply ability effects
    baseDamage = applyAbilityEffects(baseDamage, attacker, defender, moveData, battleState)
    
    -- Apply item effects
    baseDamage = applyItemEffects(baseDamage, attacker, defender, moveData, battleState)
    
    -- Apply random damage variance (only if not predetermined)
    local finalDamage = baseDamage
    if not options.skipVariance then
        finalDamage = applyDamageVariance(baseDamage)
    end
    
    return {
        damage = finalDamage,
        baseDamage = baseDamage,
        criticalHit = criticalHit,
        typeEffectiveness = typeEffectiveness,
        hasSTAB = hasSTAB,
        details = {
            attackStat = attackStat,
            defenseStat = defenseStat,
            level = attacker.level,
            power = moveData.power,
            weather = battleState.weather
        }
    }
end

-- Calculate damage range for move analysis
-- @param params: Same parameters as calculateDamage
-- @return: Table with minimum and maximum damage values
function DamageCalculator.calculateDamageRange(params)
    if not params then
        return {min = 0, max = 0}
    end
    
    -- Calculate with minimum variance (85%)
    local minParams = {}
    for k, v in pairs(params) do
        minParams[k] = v
    end
    minParams.options = minParams.options or {}
    minParams.options.skipVariance = true
    
    local baseResult = DamageCalculator.calculateDamage(minParams)
    local baseDamage = baseResult.baseDamage
    
    local minDamage = math.max(1, math.floor(baseDamage * DAMAGE_CONSTANTS.VARIANCE_MIN))
    local maxDamage = baseDamage
    
    return {
        min = minDamage,
        max = maxDamage,
        criticalHit = baseResult.criticalHit,
        typeEffectiveness = baseResult.typeEffectiveness
    }
end

-- Check if attack hits (accuracy calculation)
-- @param moveData: Move data with accuracy
-- @param attacker: Pokemon using the move
-- @param defender: Pokemon being targeted
-- @param battleState: Current battle state
-- @return: Boolean indicating if move hits
function DamageCalculator.checkAccuracy(moveData, attacker, defender, battleState)
    if not moveData.accuracy then
        return true  -- Always hits if no accuracy specified
    end
    
    -- Get effective accuracy with stat stage modifications
    local accuracyStage = (attacker.statStages and attacker.statStages.accuracy) or 0
    local evasionStage = (defender.statStages and defender.statStages.evasion) or 0
    
    -- Calculate effective accuracy
    local netStage = accuracyStage - evasionStage
    netStage = math.max(-6, math.min(6, netStage))
    
    local stageIndex = netStage + 7
    local numerator = DAMAGE_CONSTANTS.STAT_STAGE_NUMERATORS[stageIndex]
    local denominator = DAMAGE_CONSTANTS.STAT_STAGE_DENOMINATORS[stageIndex]
    
    local effectiveAccuracy = math.floor((moveData.accuracy * numerator) / denominator)
    
    -- Roll for accuracy
    return BattleRNG.accuracy(effectiveAccuracy)
end

return DamageCalculator