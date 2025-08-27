-- Battle Ability Processor Implementation
-- Handles ability trigger detection and activation during battle phases
-- Based on TypeScript reference for exact behavioral parity

local AbilityProcessor = {}

-- Import required modules
local AbilityDatabase = require("data.abilities.ability-database")
local AbilityEffects = require("data.abilities.ability-effects")
local AbilityIndexes = require("data.abilities.ability-indexes")

-- Battle context structure for ability processing
AbilityProcessor.BattleContext = {
    battle = nil,           -- Current battle instance
    attacker = nil,         -- Attacking Pokemon
    defender = nil,         -- Defending Pokemon
    target = nil,           -- Target Pokemon (may be different from defender)
    move = nil,             -- Move being used
    damage = 0,             -- Calculated damage
    criticalHit = false,    -- Critical hit flag
    weather = nil,          -- Current weather
    terrain = nil,          -- Current terrain
    turn = 0,               -- Current turn number
    phase = nil,            -- Current battle phase
    
    -- Effect tracking
    effectsApplied = {},    -- List of effects applied this turn
    abilitiesTriggered = {},-- List of abilities that triggered
    suppressAbilities = false,  -- Global ability suppression
    
    -- Status and condition flags
    statusToApply = nil,    -- Status condition being applied
    statusPrevented = false,-- Status prevention flag
    critBlocked = false,    -- Critical hit blocked flag
    ohkoPrevented = false,  -- OHKO prevention flag
    
    -- Interaction results
    moveBlocked = false,    -- Move prevention flag
    damageModified = false, -- Damage modification flag
    statsModified = {}      -- Stat modifications applied
}

-- Initialize ability processor
function AbilityProcessor.init()
    -- Ensure all dependencies are initialized
    AbilityDatabase.init()
    AbilityIndexes.init()
end

-- Process abilities for specific trigger during battle
function AbilityProcessor.processTrigger(battleContext, trigger)
    if not battleContext or not trigger then
        return false
    end
    
    -- Check for global ability suppression
    if battleContext.suppressAbilities then
        return false
    end
    
    -- Get all Pokemon in battle with abilities that respond to this trigger
    local activeAbilities = AbilityProcessor.getActiveAbilities(battleContext, trigger)
    
    if #activeAbilities == 0 then
        return false
    end
    
    -- Resolve ability interactions and priority
    local resolvedAbilities = AbilityEffects.resolveAbilityInteractions(activeAbilities, trigger, battleContext)
    
    -- Apply abilities in priority order
    local anyTriggered = false
    for _, abilityInfo in ipairs(resolvedAbilities) do
        if AbilityProcessor.triggerAbility(battleContext, abilityInfo) then
            anyTriggered = true
        end
    end
    
    return anyTriggered
end

-- Get active abilities for a specific trigger
function AbilityProcessor.getActiveAbilities(battleContext, trigger)
    local activeAbilities = {}
    
    -- Get all Pokemon in the battle
    local battlePokemon = AbilityProcessor.getBattlePokemon(battleContext)
    
    for _, pokemon in ipairs(battlePokemon) do
        -- Skip fainted Pokemon (unless ability bypasses faint)
        if not pokemon.isFainted() then
            local pokemonAbility = pokemon.getAbility()
            if pokemonAbility then
                local abilityData = AbilityDatabase.getAbility(pokemonAbility.id)
                
                if abilityData and AbilityProcessor.hasAbilityTrigger(abilityData, trigger) then
                    -- Check if ability is suppressed for this Pokemon
                    if not pokemon.isAbilitySuppressed() then
                        table.insert(activeAbilities, {
                            pokemon = pokemon,
                            abilityId = abilityData.id,
                            abilityData = abilityData,
                            priority = abilityData.postSummonPriority or 0
                        })
                    end
                end
            end
        elseif pokemon.isFainted() then
            -- Check for abilities that can trigger on faint
            local pokemonAbility = pokemon.getAbility()
            if pokemonAbility then
                local abilityData = AbilityDatabase.getAbility(pokemonAbility.id)
                
                if abilityData and abilityData.isBypassFaint and 
                   AbilityProcessor.hasAbilityTrigger(abilityData, trigger) then
                    table.insert(activeAbilities, {
                        pokemon = pokemon,
                        abilityId = abilityData.id,
                        abilityData = abilityData,
                        priority = abilityData.postSummonPriority or 0
                    })
                end
            end
        end
    end
    
    return activeAbilities
end

-- Check if ability has specific trigger
function AbilityProcessor.hasAbilityTrigger(abilityData, trigger)
    if not abilityData.triggers then
        return false
    end
    
    for _, abilityTrigger in ipairs(abilityData.triggers) do
        if abilityTrigger == trigger then
            return true
        end
    end
    
    return false
end

-- Trigger a specific ability
function AbilityProcessor.triggerAbility(battleContext, abilityInfo)
    local pokemon = abilityInfo.pokemon
    local abilityData = abilityInfo.abilityData
    
    -- Check if ability can be triggered in current context
    if not AbilityProcessor.canTriggerAbility(pokemon, abilityData, battleContext) then
        return false
    end
    
    -- Apply all effects for this ability
    local anyEffectApplied = false
    for _, effect in ipairs(abilityData.effects) do
        if AbilityEffects.applyEffect(pokemon, abilityData, effect, battleContext) then
            anyEffectApplied = true
            
            -- Track effect application
            table.insert(battleContext.effectsApplied, {
                pokemon = pokemon,
                abilityId = abilityData.id,
                effect = effect,
                timestamp = os.time()
            })
        end
    end
    
    if anyEffectApplied then
        -- Track ability activation
        table.insert(battleContext.abilitiesTriggered, {
            pokemon = pokemon,
            abilityId = abilityData.id,
            trigger = battleContext.currentTrigger,
            timestamp = os.time()
        })
        
        -- Show ability activation message (if in battle)
        if battleContext.battle and battleContext.battle.showAbilityActivation then
            battleContext.battle.showAbilityActivation(pokemon, abilityData)
        end
    end
    
    return anyEffectApplied
end

-- Check if ability can be triggered
function AbilityProcessor.canTriggerAbility(pokemon, abilityData, battleContext)
    -- Check ability-specific conditions
    for _, condition in ipairs(abilityData.conditions or {}) do
        if not AbilityEffects.checkCondition(pokemon, condition, battleContext) then
            return false
        end
    end
    
    -- Check for ability suppression
    if pokemon.isAbilitySuppressed() and abilityData.isSuppressable then
        return false
    end
    
    -- Check for ignorable abilities in certain contexts
    if abilityData.isIgnorable and battleContext.ignoreAbilities then
        return false
    end
    
    return true
end

-- Get all Pokemon in battle
function AbilityProcessor.getBattlePokemon(battleContext)
    local pokemon = {}
    
    if battleContext.battle then
        -- Get all Pokemon from both sides
        for _, participant in ipairs(battleContext.battle.participants) do
            if participant.pokemon then
                table.insert(pokemon, participant.pokemon)
            end
        end
    else
        -- Fallback for individual Pokemon contexts
        if battleContext.attacker then
            table.insert(pokemon, battleContext.attacker)
        end
        if battleContext.defender and battleContext.defender ~= battleContext.attacker then
            table.insert(pokemon, battleContext.defender)
        end
    end
    
    return pokemon
end

-- Process post-summon abilities (when Pokemon enters battle)
function AbilityProcessor.processPostSummon(battleContext, pokemon)
    -- Create specific context for post-summon
    local postSummonContext = AbilityProcessor.copyBattleContext(battleContext)
    postSummonContext.currentTrigger = AbilityEffects.TriggerTypes.POST_SUMMON
    postSummonContext.summoned = pokemon
    
    return AbilityProcessor.processTrigger(postSummonContext, AbilityEffects.TriggerTypes.POST_SUMMON)
end

-- Process pre-attack abilities (before Pokemon attacks)
function AbilityProcessor.processPreAttack(battleContext)
    local preAttackContext = AbilityProcessor.copyBattleContext(battleContext)
    preAttackContext.currentTrigger = AbilityEffects.TriggerTypes.PRE_ATTACK
    
    return AbilityProcessor.processTrigger(preAttackContext, AbilityEffects.TriggerTypes.PRE_ATTACK)
end

-- Process on-attack abilities (when Pokemon attacks)
function AbilityProcessor.processOnAttack(battleContext)
    local onAttackContext = AbilityProcessor.copyBattleContext(battleContext)
    onAttackContext.currentTrigger = AbilityEffects.TriggerTypes.ON_ATTACK
    
    return AbilityProcessor.processTrigger(onAttackContext, AbilityEffects.TriggerTypes.ON_ATTACK)
end

-- Process pre-defend abilities (before Pokemon is attacked)
function AbilityProcessor.processPreDefend(battleContext)
    local preDefendContext = AbilityProcessor.copyBattleContext(battleContext)
    preDefendContext.currentTrigger = AbilityEffects.TriggerTypes.PRE_DEFEND
    
    return AbilityProcessor.processTrigger(preDefendContext, AbilityEffects.TriggerTypes.PRE_DEFEND)
end

-- Process post-defend abilities (after Pokemon is attacked)
function AbilityProcessor.processPostDefend(battleContext)
    local postDefendContext = AbilityProcessor.copyBattleContext(battleContext)
    postDefendContext.currentTrigger = AbilityEffects.TriggerTypes.POST_DEFEND
    
    return AbilityProcessor.processTrigger(postDefendContext, AbilityEffects.TriggerTypes.POST_DEFEND)
end

-- Process turn start abilities
function AbilityProcessor.processTurnStart(battleContext)
    local turnStartContext = AbilityProcessor.copyBattleContext(battleContext)
    turnStartContext.currentTrigger = AbilityEffects.TriggerTypes.TURN_START
    
    return AbilityProcessor.processTrigger(turnStartContext, AbilityEffects.TriggerTypes.TURN_START)
end

-- Process turn end abilities
function AbilityProcessor.processTurnEnd(battleContext)
    local turnEndContext = AbilityProcessor.copyBattleContext(battleContext)
    turnEndContext.currentTrigger = AbilityEffects.TriggerTypes.TURN_END
    
    return AbilityProcessor.processTrigger(turnEndContext, AbilityEffects.TriggerTypes.TURN_END)
end

-- Process status condition abilities
function AbilityProcessor.processStatusCondition(battleContext, statusCondition, isBeingApplied)
    local trigger = isBeingApplied and AbilityEffects.TriggerTypes.PRE_SET_STATUS or AbilityEffects.TriggerTypes.POST_SET_STATUS
    
    local statusContext = AbilityProcessor.copyBattleContext(battleContext)
    statusContext.currentTrigger = trigger
    statusContext.statusToApply = statusCondition
    
    return AbilityProcessor.processTrigger(statusContext, trigger)
end

-- Copy battle context for specific trigger processing
function AbilityProcessor.copyBattleContext(originalContext)
    local copy = {}
    for key, value in pairs(originalContext) do
        if type(value) == "table" then
            copy[key] = {}
            for subKey, subValue in pairs(value) do
                copy[key][subKey] = subValue
            end
        else
            copy[key] = value
        end
    end
    return copy
end

-- Create new battle context
function AbilityProcessor.createBattleContext(battle)
    local context = {}
    
    -- Copy structure from template
    for key, value in pairs(AbilityProcessor.BattleContext) do
        context[key] = value
    end
    
    -- Set battle-specific data
    context.battle = battle
    context.turn = battle.turn or 0
    context.weather = battle.weather
    context.terrain = battle.terrain
    
    -- Initialize empty tracking arrays
    context.effectsApplied = {}
    context.abilitiesTriggered = {}
    context.statsModified = {}
    
    return context
end

-- Check for ability interactions and conflicts
function AbilityProcessor.checkAbilityInteractions(battleContext, abilityList)
    local interactions = {}
    
    -- Check for known ability conflicts
    local conflictPairs = {
        -- Weather setting abilities
        {2, 45, 70}, -- DRIZZLE, SAND_STREAM, DROUGHT
        
        -- Pressure effects
        {46}, -- PRESSURE
        
        -- Trace interactions
        {36}, -- TRACE
    }
    
    for _, conflictGroup in ipairs(conflictPairs) do
        local activeInGroup = {}
        for _, abilityInfo in ipairs(abilityList) do
            for _, conflictAbility in ipairs(conflictGroup) do
                if abilityInfo.abilityId == conflictAbility then
                    table.insert(activeInGroup, abilityInfo)
                end
            end
        end
        
        if #activeInGroup > 1 then
            table.insert(interactions, {
                type = "CONFLICT",
                abilities = activeInGroup,
                resolution = "PRIORITY_ORDER"
            })
        end
    end
    
    return interactions
end

-- Get ability activation priority for sorting
function AbilityProcessor.getActivationPriority(abilityData, trigger, pokemon)
    local basePriority = abilityData.postSummonPriority or 0
    
    -- Apply trigger-specific priority modifications
    local triggerPriority = AbilityEffects.getTriggerPriority(abilityData.id, trigger)
    
    -- Speed-based tie breaking for abilities with same priority
    local speedTieBreaker = pokemon.getStat and (pokemon.getStat("SPD") / 1000) or 0
    
    return basePriority + triggerPriority + speedTieBreaker
end

-- Reset battle context for new turn
function AbilityProcessor.resetTurnContext(battleContext)
    battleContext.effectsApplied = {}
    battleContext.abilitiesTriggered = {}
    battleContext.statsModified = {}
    battleContext.statusPrevented = false
    battleContext.critBlocked = false
    battleContext.ohkoPrevented = false
    battleContext.moveBlocked = false
    battleContext.damageModified = false
end

-- Get processing statistics for debugging
function AbilityProcessor.getProcessingStats(battleContext)
    return {
        effectsApplied = #battleContext.effectsApplied,
        abilitiesTriggered = #battleContext.abilitiesTriggered,
        statsModified = #battleContext.statsModified,
        turn = battleContext.turn,
        phase = battleContext.phase
    }
end

return AbilityProcessor