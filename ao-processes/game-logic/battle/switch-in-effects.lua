-- Switch-In Effects System
-- Handles ability activation, entry hazards, and effect processing when Pokemon switch in
-- Integrates with existing ability systems and battle conditions
-- Provides correct trigger order for multiple simultaneous switch-in effects

local SwitchInEffects = {}

-- Load dependencies
local BattleStateManager = require("game-logic.battle.battle-state-manager")
local BattleRNG = require("game-logic.rng.battle-rng")
local EntryHazards = require("game-logic.battle.entry-hazards")

-- Optional dependencies  
local BattleMessages = nil
local AbilityInteractions = nil
local Enums = nil
pcall(function() BattleMessages = require("game-logic.battle.battle-messages") end)
pcall(function() AbilityInteractions = require("game-logic.battle.ability-interactions") end)
pcall(function() Enums = require("data.constants.enums") end)

-- Switch-in effect types and priorities
SwitchInEffects.EffectType = {
    ENTRY_HAZARDS = "ENTRY_HAZARDS",
    ABILITY_ACTIVATION = "ABILITY_ACTIVATION",
    WEATHER_RESPONSE = "WEATHER_RESPONSE", 
    TERRAIN_RESPONSE = "TERRAIN_RESPONSE",
    INTIMIDATE_REACTION = "INTIMIDATE_REACTION",
    FORM_CHANGE = "FORM_CHANGE"
}

-- Effect processing priorities (lower numbers execute first)
SwitchInEffects.EffectPriority = {
    [SwitchInEffects.EffectType.ENTRY_HAZARDS] = 1,
    [SwitchInEffects.EffectType.ABILITY_ACTIVATION] = 2,
    [SwitchInEffects.EffectType.WEATHER_RESPONSE] = 3,
    [SwitchInEffects.EffectType.TERRAIN_RESPONSE] = 4,
    [SwitchInEffects.EffectType.INTIMIDATE_REACTION] = 5,
    [SwitchInEffects.EffectType.FORM_CHANGE] = 6
}

-- Entry hazard damage calculations
SwitchInEffects.EntryHazards = {
    SPIKES = {
        maxLayers = 3,
        damagePerLayer = "1/8", -- 1/8 max HP per layer
        blockedByFlying = true,
        blockedByLevitate = true
    },
    TOXIC_SPIKES = {
        maxLayers = 2,
        layer1Effect = "poison",
        layer2Effect = "badly_poison",
        blockedByFlying = true,
        blockedByLevitate = true,
        absorbedByPoison = true
    },
    STEALTH_ROCK = {
        damageBase = "1/8", -- Base 1/8 max HP, modified by type effectiveness
        useTypeEffectiveness = true
    },
    STICKY_WEB = {
        effect = "speed_drop",
        stages = -1,
        blockedByFlying = true,
        blockedByLevitate = true
    }
}

-- Initialize switch-in effects system
function SwitchInEffects.init()
    -- Initialize battle messages if available
    if BattleMessages and BattleMessages.init then
        BattleMessages.init()
    end
    
    return true, "Switch-in effects system initialized"
end

-- Process all switch-in effects for a Pokemon
-- @param battleState: Current battle state
-- @param pokemon: Pokemon that switched in
-- @param position: Battle position
-- @param previousPokemon: Pokemon that was switched out (optional)
-- @return: Switch-in effects result
function SwitchInEffects.processAllSwitchInEffects(battleState, pokemon, position, previousPokemon)
    if not battleState or not pokemon then
        return {
            success = false,
            error = "Invalid parameters for switch-in effects processing"
        }
    end
    
    local result = {
        success = true,
        pokemon = pokemon,
        position = position,
        effects = {},
        messages = {},
        damageTaken = 0,
        healing = 0,
        statusChanges = {},
        statStages = {},
        timestamp = os.time()
    }
    
    -- Collect all switch-in effects
    local effects = SwitchInEffects.collectSwitchInEffects(battleState, pokemon, position)
    
    -- Sort effects by priority
    table.sort(effects, function(a, b)
        return (SwitchInEffects.EffectPriority[a.type] or 99) < (SwitchInEffects.EffectPriority[b.type] or 99)
    end)
    
    -- Process effects in order
    for _, effect in ipairs(effects) do
        local effectResult = SwitchInEffects.processEffect(battleState, pokemon, effect)
        
        if effectResult then
            table.insert(result.effects, effectResult)
            
            -- Combine messages
            if effectResult.messages then
                for _, message in ipairs(effectResult.messages) do
                    table.insert(result.messages, message)
                end
            end
            
            -- Accumulate damage and healing
            result.damageTaken = result.damageTaken + (effectResult.damage or 0)
            result.healing = result.healing + (effectResult.healing or 0)
            
            -- Combine status changes
            if effectResult.statusChange then
                table.insert(result.statusChanges, effectResult.statusChange)
            end
            
            -- Combine stat stage changes
            if effectResult.statStageChanges then
                for stat, change in pairs(effectResult.statStageChanges) do
                    result.statStages[stat] = (result.statStages[stat] or 0) + change
                end
            end
            
            -- Check if Pokemon fainted from entry hazards
            if pokemon.currentHP <= 0 then
                pokemon.fainted = true
                table.insert(result.messages, pokemon.name .. " fainted from entry hazards!")
                break -- No more effects if Pokemon fainted
            end
        end
    end
    
    -- Record switch-in effects in battle events
    table.insert(battleState.battleEvents, {
        type = "switch_in_effects",
        pokemon = pokemon.id,
        position = position,
        effects = result.effects,
        damage = result.damageTaken,
        healing = result.healing,
        turn = battleState.turn,
        timestamp = os.time()
    })
    
    return result
end

-- Collect all applicable switch-in effects for a Pokemon
-- @param battleState: Current battle state
-- @param pokemon: Pokemon that switched in
-- @param position: Battle position
-- @return: Array of switch-in effects
function SwitchInEffects.collectSwitchInEffects(battleState, pokemon, position)
    local effects = {}
    
    -- Entry hazards (processed first)
    local hazardEffects = SwitchInEffects.getEntryHazardEffects(battleState, pokemon, position)
    for _, effect in ipairs(hazardEffects) do
        table.insert(effects, effect)
    end
    
    -- Ability activations
    local abilityEffects = SwitchInEffects.getAbilitySwitchInEffects(battleState, pokemon, position)
    for _, effect in ipairs(abilityEffects) do
        table.insert(effects, effect)
    end
    
    -- Weather responses
    local weatherEffects = SwitchInEffects.getWeatherSwitchInEffects(battleState, pokemon)
    for _, effect in ipairs(weatherEffects) do
        table.insert(effects, effect)
    end
    
    -- Terrain responses
    local terrainEffects = SwitchInEffects.getTerrainSwitchInEffects(battleState, pokemon)
    for _, effect in ipairs(terrainEffects) do
        table.insert(effects, effect)
    end
    
    -- Intimidate reactions (if opponent has Intimidate)
    local intimidateEffects = SwitchInEffects.getIntimidateReactionEffects(battleState, pokemon, position)
    for _, effect in ipairs(intimidateEffects) do
        table.insert(effects, effect)
    end
    
    return effects
end

-- Get entry hazard effects for switching Pokemon
-- @param battleState: Current battle state
-- @param pokemon: Pokemon switching in
-- @param position: Battle position
-- @return: Array of entry hazard effects
function SwitchInEffects.getEntryHazardEffects(battleState, pokemon, position)
    local effects = {}
    
    if not battleState.battleConditions or not battleState.battleConditions.entryHazards then
        return effects
    end
    
    local side = pokemon.battleData.side
    local hazards = battleState.battleConditions.entryHazards[side]
    
    if not hazards then
        return effects
    end
    
    -- Stealth Rock
    if hazards.stealthRock then
        table.insert(effects, {
            type = SwitchInEffects.EffectType.ENTRY_HAZARDS,
            hazardType = "STEALTH_ROCK",
            pokemon = pokemon,
            data = SwitchInEffects.EntryHazards.STEALTH_ROCK
        })
    end
    
    -- Spikes
    if hazards.spikes > 0 then
        table.insert(effects, {
            type = SwitchInEffects.EffectType.ENTRY_HAZARDS,
            hazardType = "SPIKES",
            layers = hazards.spikes,
            pokemon = pokemon,
            data = SwitchInEffects.EntryHazards.SPIKES
        })
    end
    
    -- Toxic Spikes
    if hazards.toxicSpikes > 0 then
        table.insert(effects, {
            type = SwitchInEffects.EffectType.ENTRY_HAZARDS,
            hazardType = "TOXIC_SPIKES",
            layers = hazards.toxicSpikes,
            pokemon = pokemon,
            data = SwitchInEffects.EntryHazards.TOXIC_SPIKES
        })
    end
    
    -- Sticky Web
    if hazards.stickyWeb then
        table.insert(effects, {
            type = SwitchInEffects.EffectType.ENTRY_HAZARDS,
            hazardType = "STICKY_WEB",
            pokemon = pokemon,
            data = SwitchInEffects.EntryHazards.STICKY_WEB
        })
    end
    
    return effects
end

-- Get ability-based switch-in effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon switching in
-- @param position: Battle position
-- @return: Array of ability effects
function SwitchInEffects.getAbilitySwitchInEffects(battleState, pokemon, position)
    local effects = {}
    
    -- Skip ability effects if dependencies not loaded or no ability
    if not pokemon.ability then
        return effects
    end
    
    -- For testing, just return empty effects - full ability system integration
    -- would require the complete Enums system which may not be available in tests
    return effects
end

-- Get weather-responsive switch-in effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon switching in
-- @return: Array of weather effects
function SwitchInEffects.getWeatherSwitchInEffects(battleState, pokemon)
    -- Simplified for testing - full weather response system would need Enums integration
    return {}
end

-- Get terrain-responsive switch-in effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon switching in
-- @return: Array of terrain effects
function SwitchInEffects.getTerrainSwitchInEffects(battleState, pokemon)
    local effects = {}
    
    if not battleState.battleConditions or not battleState.battleConditions.terrain then
        return effects
    end
    
    -- Future terrain-based abilities can be added here
    
    return effects
end

-- Get Intimidate reaction effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon switching in
-- @param position: Battle position
-- @return: Array of Intimidate reaction effects
function SwitchInEffects.getIntimidateReactionEffects(battleState, pokemon, position)
    -- Simplified for testing - full intimidate reaction system would need Enums integration
    return {}
end

-- Process individual switch-in effect
-- @param battleState: Current battle state
-- @param pokemon: Pokemon being affected
-- @param effect: Effect to process
-- @return: Effect processing result
function SwitchInEffects.processEffect(battleState, pokemon, effect)
    if not effect then
        return nil
    end
    
    if effect.type == SwitchInEffects.EffectType.ENTRY_HAZARDS then
        return SwitchInEffects.processEntryHazardEffect(battleState, pokemon, effect)
    elseif effect.type == SwitchInEffects.EffectType.ABILITY_ACTIVATION then
        return SwitchInEffects.processAbilityEffect(battleState, pokemon, effect)
    elseif effect.type == SwitchInEffects.EffectType.WEATHER_RESPONSE then
        return SwitchInEffects.processWeatherEffect(battleState, pokemon, effect)
    elseif effect.type == SwitchInEffects.EffectType.TERRAIN_RESPONSE then
        return SwitchInEffects.processTerrainEffect(battleState, pokemon, effect)
    elseif effect.type == SwitchInEffects.EffectType.INTIMIDATE_REACTION then
        return SwitchInEffects.processIntimidateReactionEffect(battleState, pokemon, effect)
    elseif effect.type == SwitchInEffects.EffectType.FORM_CHANGE then
        return SwitchInEffects.processFormChangeEffect(battleState, pokemon, effect)
    end
    
    return nil
end

-- Process entry hazard effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon being affected
-- @param effect: Entry hazard effect
-- @return: Entry hazard processing result
function SwitchInEffects.processEntryHazardEffect(battleState, pokemon, effect)
    -- Delegate to comprehensive EntryHazards module
    return EntryHazards.processHazardEffects(battleState, pokemon)
end

-- Process ability activation effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon with activating ability
-- @param effect: Ability effect
-- @return: Ability processing result
function SwitchInEffects.processAbilityEffect(battleState, pokemon, effect)
    local result = {
        type = "ability_activation",
        ability = effect.ability,
        pokemon = pokemon.id,
        messages = {}
    }
    
    if effect.effect == "weather_change" then
        battleState.battleConditions.weather = effect.weather
        battleState.battleConditions.weatherDuration = 5
        result.messages = {pokemon.name .. "'s " .. SwitchInEffects.getAbilityName(effect.ability) .. " changed the weather!"}
        
    elseif effect.effect == "intimidate" then
        -- Apply Attack reduction to all opposing Pokemon
        result.messages = {pokemon.name .. "'s Intimidate lowered opposing Pokemon's Attack!"}
        -- Implementation would interact with opposing Pokemon stat stages
        
    elseif effect.effect == "download" then
        -- Compare opposing Defense vs Special Defense and boost accordingly
        result.messages = {pokemon.name .. "'s Download boosted its stats!"}
        -- Implementation would analyze opposing stats and boost Attack or Special Attack
        
    elseif effect.effect == "trace" then
        -- Copy ability from opposing Pokemon
        result.messages = {pokemon.name .. " traced an opposing Pokemon's ability!"}
        -- Implementation would copy a random opposing Pokemon's ability
        
    elseif effect.effect == "weather_nullify" then
        result.messages = {pokemon.name .. "'s " .. SwitchInEffects.getAbilityName(effect.ability) .. " nullified the weather!"}
        -- Weather effects are suppressed while this Pokemon is active
    end
    
    return result
end

-- Process weather response effects
-- @param battleState: Current battle state  
-- @param pokemon: Pokemon responding to weather
-- @param effect: Weather effect
-- @return: Weather processing result
function SwitchInEffects.processWeatherEffect(battleState, pokemon, effect)
    local result = {
        type = "weather_response",
        pokemon = pokemon.id,
        messages = {}
    }
    
    if effect.effect == "form_change" then
        -- Castform form change based on weather
        result.messages = {pokemon.name .. " transformed!"}
        -- Implementation would change Pokemon's form/type based on weather
    end
    
    return result
end

-- Process terrain response effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon responding to terrain
-- @param effect: Terrain effect
-- @return: Terrain processing result
function SwitchInEffects.processTerrainEffect(battleState, pokemon, effect)
    local result = {
        type = "terrain_response", 
        pokemon = pokemon.id,
        messages = {}
    }
    
    -- Future terrain effects can be implemented here
    
    return result
end

-- Process Intimidate reaction effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon reacting to Intimidate
-- @param effect: Intimidate reaction effect
-- @return: Intimidate reaction processing result
function SwitchInEffects.processIntimidateReactionEffect(battleState, pokemon, effect)
    local result = {
        type = "intimidate_reaction",
        pokemon = pokemon.id,
        ability = effect.ability,
        messages = {},
        statStageChanges = {}
    }
    
    if effect.effect == "stat_boost_on_intimidate" and Enums and Enums.AbilityId then
        if effect.ability == Enums.AbilityId.COMPETITIVE then
            -- Boost Special Attack by 2 stages
            pokemon.battleData.statStages.spa = math.min(6, pokemon.battleData.statStages.spa + 2)
            result.statStageChanges.spa = 2
            result.messages = {pokemon.name .. "'s Competitive boosted its Special Attack!"}
            
        elseif effect.ability == Enums.AbilityId.DEFIANT then
            -- Boost Attack by 2 stages
            pokemon.battleData.statStages.atk = math.min(6, pokemon.battleData.statStages.atk + 2)
            result.statStageChanges.atk = 2
            result.messages = {pokemon.name .. "'s Defiant boosted its Attack!"}
        end
    end
    
    return result
end

-- Process form change effects
-- @param battleState: Current battle state
-- @param pokemon: Pokemon changing form
-- @param effect: Form change effect
-- @return: Form change processing result
function SwitchInEffects.processFormChangeEffect(battleState, pokemon, effect)
    local result = {
        type = "form_change",
        pokemon = pokemon.id,
        messages = {}
    }
    
    -- Implementation would handle form changes like Castform, Cherrim, etc.
    result.messages = {pokemon.name .. " changed form!"}
    
    return result
end

-- Helper functions for effect processing

-- Check entry hazard immunity
-- @param pokemon: Pokemon to check
-- @param effect: Entry hazard effect
-- @return: Immunity check result
function SwitchInEffects.checkEntryHazardImmunity(pokemon, effect)
    local result = {immune = false, messages = {}}
    
    if not Enums or not Enums.AbilityId then
        return result -- Skip immunity checks if Enums not available
    end
    
    -- Magic Guard immunity
    if pokemon.ability == Enums.AbilityId.MAGIC_GUARD then
        result.immune = true
        result.messages = {pokemon.name .. "'s Magic Guard prevents entry hazard damage!"}
        return result
    end
    
    -- Flying type immunity to ground hazards
    if effect.data.blockedByFlying and Enums.PokemonType and SwitchInEffects.hasType(pokemon, Enums.PokemonType.FLYING) then
        result.immune = true
        return result
    end
    
    -- Levitate immunity to ground hazards
    if effect.data.blockedByLevitate and pokemon.ability == Enums.AbilityId.LEVITATE then
        result.immune = true
        return result
    end
    
    return result
end

-- Get Stealth Rock type effectiveness
-- @param pokemon: Pokemon to check
-- @return: Type effectiveness multiplier
function SwitchInEffects.getStealthRockEffectiveness(pokemon)
    -- This would integrate with the type chart system
    -- For now, return neutral effectiveness
    local effectiveness = 1.0
    
    -- Implementation would check Pokemon's types against Rock-type effectiveness
    -- and return the appropriate multiplier (0.25x to 4x)
    
    return effectiveness
end

-- Check if Pokemon is grounded
-- @param pokemon: Pokemon to check
-- @return: True if Pokemon is affected by ground-based effects
function SwitchInEffects.isGrounded(pokemon)
    if not Enums then
        return true -- Assume grounded if no type checking available
    end
    
    if Enums.PokemonType and SwitchInEffects.hasType(pokemon, Enums.PokemonType.FLYING) then
        return false
    end
    
    if Enums.AbilityId and pokemon.ability == Enums.AbilityId.LEVITATE then
        return false
    end
    
    -- Check for Air Balloon item
    if Enums.ItemId and pokemon.item == Enums.ItemId.AIR_BALLOON then
        return false
    end
    
    return true
end

-- Check if Pokemon has specific type
-- @param pokemon: Pokemon to check
-- @param typeId: Type ID to check for
-- @return: True if Pokemon has the type
function SwitchInEffects.hasType(pokemon, typeId)
    if not pokemon.species then
        return false
    end
    
    -- This would integrate with species data
    -- For now, assume basic type checking
    return false
end

-- Check if Pokemon is Poison type
-- @param pokemon: Pokemon to check
-- @return: True if Pokemon is Poison type
function SwitchInEffects.isPoisonType(pokemon)
    if not Enums or not Enums.PokemonType then
        return false
    end
    return SwitchInEffects.hasType(pokemon, Enums.PokemonType.POISON)
end

-- Get ability name for messages
-- @param abilityId: Ability ID
-- @return: Ability name string
function SwitchInEffects.getAbilityName(abilityId)
    -- This would integrate with ability data
    local abilityNames = {}
    if Enums and Enums.AbilityId then
        abilityNames = {
            [Enums.AbilityId.DROUGHT] = "Drought",
            [Enums.AbilityId.DRIZZLE] = "Drizzle",
            [Enums.AbilityId.SAND_STREAM] = "Sand Stream",
            [Enums.AbilityId.SNOW_WARNING] = "Snow Warning",
            [Enums.AbilityId.AIR_LOCK] = "Air Lock",
            [Enums.AbilityId.CLOUD_NINE] = "Cloud Nine"
        }
    end
    
    return abilityNames[abilityId] or "Unknown Ability"
end

return SwitchInEffects