-- Terrain Abilities System
-- Handles terrain-related ability activations and interactions
-- Includes terrain-setting abilities, terrain-triggered abilities, and terrain duration modifications

local TerrainAbilities = {}

-- Load dependencies
local Enums = require("data.constants.enums")
local TerrainEffects = require("game-logic.battle.terrain-effects")

-- Terrain-setting abilities configuration
TerrainAbilities.TerrainSurgeAbilities = {
    [Enums.AbilityId.ELECTRIC_SURGE] = TerrainEffects.TerrainType.ELECTRIC,
    [Enums.AbilityId.GRASSY_SURGE] = TerrainEffects.TerrainType.GRASSY,
    [Enums.AbilityId.MISTY_SURGE] = TerrainEffects.TerrainType.MISTY,
    [Enums.AbilityId.PSYCHIC_SURGE] = TerrainEffects.TerrainType.PSYCHIC
}

-- Terrain-activated abilities configuration
TerrainAbilities.TerrainActivatedAbilities = {
    [Enums.AbilityId.SURGE_SURFER] = {
        terrain = TerrainEffects.TerrainType.ELECTRIC,
        effect = "speed_double",
        description = "Speed doubles in Electric Terrain"
    },
    [Enums.AbilityId.GRASS_PELT] = {
        terrain = TerrainEffects.TerrainType.GRASSY,
        effect = "defense_boost",
        description = "Defense is raised in Grassy Terrain"
    }
}

-- Check if Pokemon has a terrain-setting ability
-- @param pokemon: Pokemon data
-- @return: Terrain type to set, or nil if no terrain ability
function TerrainAbilities.getTerrainFromAbility(pokemon)
    if not pokemon or not pokemon.ability then
        return nil
    end
    
    return TerrainAbilities.TerrainSurgeAbilities[pokemon.ability]
end

-- Process terrain-setting ability on switch-in
-- @param pokemon: Pokemon switching in
-- @param terrainState: Current terrain state
-- @return: Updated terrain state, activation message
function TerrainAbilities.processTerrainSurgeAbility(pokemon, terrainState)
    if not pokemon or not pokemon.ability or not terrainState then
        return terrainState, nil
    end
    
    local newTerrainType = TerrainAbilities.TerrainSurgeAbilities[pokemon.ability]
    if not newTerrainType then
        return terrainState, nil
    end
    
    -- Don't activate if terrain is already active
    if terrainState.current_terrain == newTerrainType then
        return terrainState, nil
    end
    
    local abilityName = ""
    for abilityName, abilityId in pairs(Enums.AbilityId) do
        if abilityId == pokemon.ability then
            abilityName = abilityName
            break
        end
    end
    
    local updatedTerrainState, success, message = TerrainEffects.setTerrain(
        terrainState, 
        newTerrainType, 
        nil, -- Use default duration
        abilityName
    )
    
    if success then
        local activationMessage = pokemon.name .. "'s " .. abilityName .. " activated! " .. message
        return updatedTerrainState, activationMessage
    end
    
    return terrainState, nil
end

-- Check if Pokemon has a terrain-activated ability
-- @param pokemon: Pokemon data
-- @param terrainState: Current terrain state
-- @return: Boolean indicating if ability should activate
function TerrainAbilities.hasTerrainActivatedAbility(pokemon, terrainState)
    if not pokemon or not pokemon.ability or not terrainState then
        return false
    end
    
    local abilityData = TerrainAbilities.TerrainActivatedAbilities[pokemon.ability]
    if not abilityData then
        return false
    end
    
    -- Check if Pokemon is grounded (terrain-activated abilities require grounding)
    if not TerrainEffects.isPokemonGrounded(pokemon) then
        return false
    end
    
    return terrainState.current_terrain == abilityData.terrain
end

-- Get terrain ability stat modifier
-- @param pokemon: Pokemon data
-- @param terrainState: Current terrain state
-- @param statType: Stat type to check (Enums.Stat)
-- @return: Stat modifier value or 1.0 if no modifier
function TerrainAbilities.getTerrainAbilityStatModifier(pokemon, terrainState, statType)
    if not TerrainAbilities.hasTerrainActivatedAbility(pokemon, terrainState) then
        return 1.0
    end
    
    local abilityData = TerrainAbilities.TerrainActivatedAbilities[pokemon.ability]
    if not abilityData then
        return 1.0
    end
    
    -- Surge Surfer - Speed doubles in Electric Terrain
    if pokemon.ability == Enums.AbilityId.SURGE_SURFER and statType == Enums.Stat.SPD then
        return 2.0
    end
    
    -- Grass Pelt - Defense boost in Grassy Terrain
    if pokemon.ability == Enums.AbilityId.GRASS_PELT and statType == Enums.Stat.DEF then
        return 1.5 -- 50% defense boost
    end
    
    return 1.0
end

-- Process terrain ability activation messages
-- @param pokemon: Pokemon data
-- @param terrainState: Current terrain state
-- @return: Activation message or nil
function TerrainAbilities.getTerrainAbilityActivationMessage(pokemon, terrainState)
    if not TerrainAbilities.hasTerrainActivatedAbility(pokemon, terrainState) then
        return nil
    end
    
    local abilityData = TerrainAbilities.TerrainActivatedAbilities[pokemon.ability]
    if not abilityData then
        return nil
    end
    
    local abilityName = ""
    for name, abilityId in pairs(Enums.AbilityId) do
        if abilityId == pokemon.ability then
            abilityName = name
            break
        end
    end
    
    return pokemon.name .. "'s " .. abilityName .. " activated! " .. abilityData.description
end

-- Check if terrain duration should be extended by ability or item
-- @param pokemon: Pokemon data
-- @param terrainState: Current terrain state
-- @param baseDuration: Base duration for the terrain
-- @return: Modified duration
function TerrainAbilities.getModifiedTerrainDuration(pokemon, terrainState, baseDuration)
    if not pokemon or not terrainState or not baseDuration then
        return baseDuration
    end
    
    -- Terrain Extender item extends duration from 5 to 8 turns
    if pokemon.item == Enums.ItemId.TERRAIN_EXTENDER and baseDuration == 5 then
        return 8
    end
    
    -- TODO: Add other duration-extending effects like Power Herb for specific terrain moves
    
    return baseDuration
end

-- Get all terrain abilities for a Pokemon
-- @param pokemon: Pokemon data
-- @return: Table of terrain ability information
function TerrainAbilities.getTerrainAbilityInfo(pokemon)
    if not pokemon or not pokemon.ability then
        return {}
    end
    
    local info = {}
    
    -- Check for terrain-setting ability
    local terrainType = TerrainAbilities.TerrainSurgeAbilities[pokemon.ability]
    if terrainType then
        local terrainName = ""
        for name, type in pairs(TerrainEffects.TerrainType) do
            if type == terrainType then
                terrainName = name
                break
            end
        end
        
        table.insert(info, {
            type = "terrain_surge",
            terrain = terrainName,
            description = "Sets " .. terrainName .. " Terrain on switch-in"
        })
    end
    
    -- Check for terrain-activated ability
    local activatedData = TerrainAbilities.TerrainActivatedAbilities[pokemon.ability]
    if activatedData then
        local terrainName = ""
        for name, type in pairs(TerrainEffects.TerrainType) do
            if type == activatedData.terrain then
                terrainName = name
                break
            end
        end
        
        table.insert(info, {
            type = "terrain_activated",
            terrain = terrainName,
            effect = activatedData.effect,
            description = activatedData.description
        })
    end
    
    return info
end

-- Check if an ability prevents terrain effects
-- @param pokemon: Pokemon data
-- @param terrainType: Terrain type to check
-- @return: Boolean indicating if terrain effects are prevented
function TerrainAbilities.doesAbilityPreventTerrainEffects(pokemon, terrainType)
    if not pokemon or not pokemon.ability or not terrainType then
        return false
    end
    
    -- TODO: Add abilities that prevent terrain effects
    -- For example, some abilities might make Pokemon immune to terrain
    
    return false
end

-- Process end-of-turn terrain ability effects
-- @param pokemon: Pokemon data
-- @param terrainState: Current terrain state
-- @return: List of ability effects triggered
function TerrainAbilities.processEndOfTurnTerrainAbilities(pokemon, terrainState)
    if not pokemon or not terrainState then
        return {}
    end
    
    local effects = {}
    
    -- Process terrain-activated abilities that have end-of-turn effects
    if TerrainAbilities.hasTerrainActivatedAbility(pokemon, terrainState) then
        local abilityData = TerrainAbilities.TerrainActivatedAbilities[pokemon.ability]
        
        -- Add any end-of-turn effects here
        -- For now, Surge Surfer and Grass Pelt are stat modifiers, not end-of-turn effects
    end
    
    return effects
end

return TerrainAbilities