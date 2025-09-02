-- Damage Calculator System
-- Complete damage calculation implementation matching TypeScript behavioral parity
-- Handles base damage, type effectiveness, STAB, critical hits, and all damage modifiers

local TypeChart = require("data.constants.type-chart")
local Enums = require("data.constants.enums")
local BattleRNG = require("game-logic.rng.battle-rng")
local MoveTargeting = require("game-logic.battle.move-targeting")

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
    -- Placeholder for ability effects - will be expanded in ability system integration
    -- Examples: Huge Power (doubles attack), Wonder Guard (immunity), etc.
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
    -- Placeholder for item effects - will be expanded in item system integration
    -- Examples: Choice Band (+50% attack), Life Orb (+30% damage), etc.
    return damage
end

-- Apply side effect damage reduction (Light Screen, Reflect, Aurora Veil)
-- @param damage: Current damage
-- @param moveData: Move data
-- @param attackingSide: Side performing the attack
-- @param defendingSide: Side receiving the attack
-- @param battleState: Current battle state
-- @return: Damage after side effect reductions
local function applySideEffectReductions(damage, moveData, attackingSide, defendingSide, battleState)
    if not damage or damage <= 0 or not moveData or not battleState then
        return damage
    end
    
    -- Only apply to damaging moves
    if moveData.category == Enums.MoveCategory.STATUS then
        return damage
    end
    
    local SideEffects = require("game-logic.battle.side-effects")
    
    -- Determine if this is a doubles battle format
    local isDoublesFormat = battleState.battleFormat == "doubles" or 
                           (battleState.playerParty and #battleState.playerParty > 1 and battleState.activePlayerPokemon and #battleState.activePlayerPokemon > 1)
    
    -- Apply side effect damage reduction
    return SideEffects.applyDamageReduction(damage, moveData.category, attackingSide, defendingSide, battleState, isDoublesFormat)
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
    
    -- Get Pokemon stats with current HP checks
    if not attacker.stats or not defender.stats then
        error("Pokemon must have stats for damage calculation")
    end
    
    -- Determine which stats to use based on move category
    local attackStat = moveData.category == Enums.MoveCategory.PHYSICAL and 
        (attacker.stats.attack or attacker.stats.atk) or 
        (attacker.stats.spAttack or attacker.stats.spatk)
    local defenseStat = moveData.category == Enums.MoveCategory.PHYSICAL and 
        (defender.stats.defense or defender.stats.def) or 
        (defender.stats.spDefense or defender.stats.spdef)
    
    -- Validate stats exist
    if not attackStat then
        error(string.format("Missing attack stat for %s move - attacker stats: %s", 
            moveData.category == Enums.MoveCategory.PHYSICAL and "physical" or "special",
            attacker.stats and "present" or "nil"))
    end
    if not defenseStat then
        error(string.format("Missing defense stat for %s move - defender stats: %s", 
            moveData.category == Enums.MoveCategory.PHYSICAL and "physical" or "special",
            defender.stats and "present" or "nil"))
    end
    
    -- Apply stat stage modifications
    local attackStages = (attacker.battleData and attacker.battleData.statStages) and 
        (moveData.category == Enums.MoveCategory.PHYSICAL and 
         (attacker.battleData.statStages.attack or attacker.battleData.statStages.atk) or 
         (attacker.battleData.statStages.spAttack or attacker.battleData.statStages.spatk)) or 0
    local defenseStages = (defender.battleData and defender.battleData.statStages) and
        (moveData.category == Enums.MoveCategory.PHYSICAL and 
         (defender.battleData.statStages.defense or defender.battleData.statStages.def) or 
         (defender.battleData.statStages.spDefense or defender.battleData.statStages.spdef)) or 0
    
    local effectiveAttack = getEffectiveStat(attackStat, attackStages)
    local effectiveDefense = getEffectiveStat(defenseStat, defenseStages)
    
    -- Calculate base damage
    local baseDamage = calculateBaseDamage(attacker.level, moveData.power, effectiveAttack, effectiveDefense)
    local currentDamage = baseDamage
    
    -- Determine critical hit
    local criticalHit = false
    if options.criticalHitForced == true then
        criticalHit = true
    elseif options.criticalHitForced == false then
        criticalHit = false  -- Explicitly forced to false
    else
        criticalHit = determineCriticalHit(moveData.criticalHitRatio or 0, attacker)
    end
    currentDamage = applyCriticalHit(currentDamage, criticalHit)
    
    -- Apply STAB
    local hasSTAB = checkSTAB(moveData.type, attacker.types)
    currentDamage = applySTAB(currentDamage, hasSTAB)
    
    -- Calculate type effectiveness
    local typeEffectiveness = TypeChart.getAttackTypeEffectiveness(moveData.type, defender.types)
    currentDamage = math.floor(currentDamage * typeEffectiveness)
    
    -- Apply weather effects
    local weather = battleState.weather
    currentDamage = applyWeatherEffects(currentDamage, moveData.type, weather)
    
    -- Apply ability effects
    currentDamage = applyAbilityEffects(currentDamage, attacker, defender, moveData, battleState)
    
    -- Apply item effects  
    currentDamage = applyItemEffects(currentDamage, attacker, defender, moveData, battleState)
    
    -- Apply side effect damage reductions (Light Screen, Reflect, Aurora Veil)
    -- Need to determine attacking and defending sides
    local attackingSide = attacker.side or "player"
    local defendingSide = defender.side or "enemy"
    currentDamage = applySideEffectReductions(currentDamage, moveData, attackingSide, defendingSide, battleState)
    
    -- Apply spread move damage reduction if move has spread properties or explicit multiplier
    if moveData.isSpreadMove and moveData.damageReduction then
        currentDamage = math.floor(currentDamage * moveData.damageReduction)
    elseif options.damageMultiplier then
        currentDamage = math.floor(currentDamage * options.damageMultiplier)
    end
    
    -- Apply random damage variance (final step)
    local finalDamage = applyDamageVariance(currentDamage)
    
    -- Return comprehensive damage calculation result
    return {
        damage = finalDamage,
        criticalHit = criticalHit,
        typeEffectiveness = typeEffectiveness,
        stab = hasSTAB,
        details = {
            baseDamage = baseDamage,
            afterCritical = criticalHit and math.floor(baseDamage * DAMAGE_CONSTANTS.CRITICAL_MULTIPLIER) or baseDamage,
            afterSTAB = hasSTAB and math.floor(currentDamage / typeEffectiveness * DAMAGE_CONSTANTS.STAB_MULTIPLIER) or currentDamage / typeEffectiveness,
            beforeVariance = currentDamage,
            effectiveAttack = effectiveAttack,
            effectiveDefense = effectiveDefense,
            attackStages = attackStages,
            defenseStages = defenseStages,
            weather = weather
        }
    }
end

-- Quick damage calculation for simple cases
-- @param attacker: Attacking Pokemon
-- @param defender: Defending Pokemon
-- @param moveData: Move data
-- @param battleState: Optional battle state
-- @return: Final damage amount (integer)
function DamageCalculator.quickDamage(attacker, defender, moveData, battleState)
    local result = DamageCalculator.calculateDamage({
        attacker = attacker,
        defender = defender,
        moveData = moveData,
        battleState = battleState
    })
    return result.damage
end

-- Calculate damage preview without random variance (for UI display)
-- @param params: Same as calculateDamage
-- @return: Damage range (min, max) without variance applied
function DamageCalculator.previewDamage(params)
    local result = DamageCalculator.calculateDamage(params)
    local beforeVariance = result.details.beforeVariance
    
    local minDamage = math.max(1, math.floor(beforeVariance * DAMAGE_CONSTANTS.VARIANCE_MIN))
    local maxDamage = math.floor(beforeVariance * DAMAGE_CONSTANTS.VARIANCE_MAX)
    
    return {
        minDamage = minDamage,
        maxDamage = maxDamage,
        criticalHit = result.criticalHit,
        typeEffectiveness = result.typeEffectiveness,
        stab = result.stab
    }
end

-- Utility function to check if attack would be super effective
-- @param moveType: Attack type
-- @param defenderTypes: Defender Pokemon types
-- @return: Boolean indicating super effectiveness
function DamageCalculator.isSuperEffective(moveType, defenderTypes)
    return TypeChart.isSuperEffective(moveType, defenderTypes)
end

-- Utility function to check if attack would have no effect
-- @param moveType: Attack type
-- @param defenderTypes: Defender Pokemon types  
-- @return: Boolean indicating no effect
function DamageCalculator.hasNoEffect(moveType, defenderTypes)
    return TypeChart.hasNoEffect(moveType, defenderTypes)
end

-- Get type effectiveness description
-- @param moveType: Attack type
-- @param defenderTypes: Defender Pokemon types
-- @return: String description of effectiveness
function DamageCalculator.getEffectivenessDescription(moveType, defenderTypes)
    return TypeChart.getEffectivenessDescription(moveType, defenderTypes)
end

-- Validate damage calculation parameters
-- @param params: Damage calculation parameters
-- @return: Boolean indicating if parameters are valid
function DamageCalculator.validateParams(params)
    if not params then
        return false, "Parameters are required"
    end
    
    if not params.attacker or not params.defender or not params.moveData then
        return false, "Attacker, defender, and moveData are required"
    end
    
    if not params.attacker.stats or not params.defender.stats then
        return false, "Both Pokemon must have stats"
    end
    
    if not params.attacker.level or params.attacker.level < 1 or params.attacker.level > 100 then
        return false, "Attacker level must be between 1 and 100"
    end
    
    if not params.moveData.type or not Enums.isValidType(params.moveData.type) then
        return false, "Move must have a valid type"
    end
    
    return true
end

-- Apply spread move damage reduction
-- @param damage: Base damage amount
-- @param targetCount: Number of targets being hit
-- @param customReduction: Custom reduction multiplier (optional)
-- @return: Reduced damage for spread moves
function DamageCalculator.applySpreadMoveDamageReduction(damage, targetCount, customReduction)
    if not damage or damage <= 0 then
        return 0
    end
    
    targetCount = targetCount or 1
    
    -- No reduction for single target
    if targetCount <= 1 then
        return damage
    end
    
    -- Use custom reduction or default spread move reduction
    local reductionMultiplier = customReduction or DAMAGE_CONSTANTS.SPREAD_DAMAGE_REDUCTION
    
    -- Apply reduction
    local reducedDamage = math.floor(damage * reductionMultiplier)
    
    -- Ensure minimum damage
    return math.max(DAMAGE_CONSTANTS.MIN_SPREAD_DAMAGE, reducedDamage)
end

-- Calculate damage for multiple targets (spread moves)
-- @param params: Table containing damage calculation parameters
--   - attacker: Pokemon using the move
--   - targets: Array of target Pokemon with their relationship info
--   - moveData: Data about the move being used
--   - battleState: Current battle conditions
--   - options: Optional parameters
-- @return: Array of damage results for each target
function DamageCalculator.calculateSpreadMoveDamage(params)
    if not params or not params.attacker or not params.targets or not params.moveData then
        return {}
    end
    
    local attacker = params.attacker
    local targets = params.targets
    local moveData = params.moveData
    local battleState = params.battleState or {}
    local options = params.options or {}
    
    -- Check if this is actually a spread move
    local targetingType = MoveTargeting.getMoveTargetingType(moveData)
    local isSpreadMove = targetingType == MoveTargeting.TargetingType.SPREAD
    
    local results = {}
    local targetCount = #targets
    
    -- Determine if damage reduction should be applied
    local applyReduction = isSpreadMove or (moveData.isSpreadMove == true) or targetCount > 1
    
    for _, targetInfo in ipairs(targets) do
        local target = targetInfo.pokemon
        
        -- Calculate base damage for this target
        local damageResult = DamageCalculator.calculateDamage({
            attacker = attacker,
            defender = target,
            moveData = moveData,
            battleState = battleState,
            options = options
        })
        
        -- Apply spread move damage reduction if applicable
        if applyReduction and damageResult.damage > 0 then
            local customReduction = targetInfo.damageMultiplier or moveData.damageReduction
            local reducedDamage = DamageCalculator.applySpreadMoveDamageReduction(
                damageResult.damage,
                targetCount,
                customReduction
            )
            
            -- Update damage result with reduction information
            damageResult.originalDamage = damageResult.damage
            damageResult.damage = reducedDamage
            damageResult.spreadReduction = true
            damageResult.reductionRatio = reducedDamage / damageResult.originalDamage
            damageResult.targetCount = targetCount
        end
        
        -- Add target-specific information
        damageResult.targetInfo = {
            pokemon_id = target.id,
            target_name = target.name or "Unknown",
            target_relationship = targetInfo.targetType or "opponent",
            target_position = targetInfo.targetPosition
        }
        
        table.insert(results, damageResult)
    end
    
    return results
end

-- Calculate damage for all targets of a multi-target move
-- @param battleState: Current battle state
-- @param attacker: Pokemon using the move
-- @param moveData: Move data
-- @param options: Optional calculation parameters
-- @return: Complete damage results for all valid targets
function DamageCalculator.calculateMultiTargetDamage(battleState, attacker, moveData, options)
    if not battleState or not attacker or not moveData then
        return {}
    end
    
    -- Resolve all targets for the move
    local resolvedTargets = MoveTargeting.resolveTargets(battleState, attacker, moveData)
    
    if #resolvedTargets == 0 then
        return {}
    end
    
    -- Calculate spread move damage for all targets
    return DamageCalculator.calculateSpreadMoveDamage({
        attacker = attacker,
        targets = resolvedTargets,
        moveData = moveData,
        battleState = battleState,
        options = options
    })
end

-- Preview spread move damage (without variance)
-- @param params: Same parameters as calculateSpreadMoveDamage
-- @return: Array of damage previews for each target
function DamageCalculator.previewSpreadMoveDamage(params)
    if not params or not params.attacker or not params.targets or not params.moveData then
        return {}
    end
    
    local results = {}
    local targetCount = #params.targets
    
    -- Determine if damage reduction should be applied
    local targetingType = MoveTargeting.getMoveTargetingType(params.moveData)
    local isSpreadMove = targetingType == MoveTargeting.TargetingType.SPREAD
    local applyReduction = isSpreadMove or (params.moveData.isSpreadMove == true) or targetCount > 1
    
    for _, targetInfo in ipairs(params.targets) do
        local target = targetInfo.pokemon
        
        -- Get damage preview for this target
        local damagePreview = DamageCalculator.previewDamage({
            attacker = params.attacker,
            defender = target,
            moveData = params.moveData,
            battleState = params.battleState,
            options = params.options
        })
        
        -- Apply spread move reduction to preview
        if applyReduction then
            local customReduction = targetInfo.damageMultiplier or params.moveData.damageReduction
            
            damagePreview.originalMinDamage = damagePreview.minDamage
            damagePreview.originalMaxDamage = damagePreview.maxDamage
            
            damagePreview.minDamage = DamageCalculator.applySpreadMoveDamageReduction(
                damagePreview.minDamage,
                targetCount,
                customReduction
            )
            damagePreview.maxDamage = DamageCalculator.applySpreadMoveDamageReduction(
                damagePreview.maxDamage,
                targetCount,
                customReduction
            )
            
            damagePreview.spreadReduction = true
            damagePreview.targetCount = targetCount
        end
        
        -- Add target information
        damagePreview.targetInfo = {
            pokemon_id = target.id,
            target_name = target.name or "Unknown",
            target_relationship = targetInfo.targetType or "opponent"
        }
        
        table.insert(results, damagePreview)
    end
    
    return results
end

-- Utility function to determine if a move should use spread damage mechanics
-- @param moveData: Move data to check
-- @param targetCount: Number of targets the move will hit
-- @return: Boolean indicating if spread damage should apply
function DamageCalculator.shouldUseSpreadDamage(moveData, targetCount)
    if not moveData then
        return false
    end
    
    -- Explicit spread move flag
    if moveData.isSpreadMove == true then
        return true
    end
    
    -- Check targeting type
    local targetingType = MoveTargeting.getMoveTargetingType(moveData)
    if targetingType == MoveTargeting.TargetingType.SPREAD then
        return true
    end
    
    -- Multi-target moves with multiple actual targets
    if targetCount and targetCount > 1 and 
       (targetingType == MoveTargeting.TargetingType.ALL_OPPONENTS or
        targetingType == MoveTargeting.TargetingType.ALL_POKEMON) then
        return true
    end
    
    return false
end

return DamageCalculator