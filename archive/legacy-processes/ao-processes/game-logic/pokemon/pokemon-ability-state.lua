-- Pokemon Ability State Management
-- Handles ability state tracking, inheritance, and persistence
-- Based on TypeScript reference for exact behavioral parity

local PokemonAbilityState = {}

-- Import required modules
local AbilityDatabase = require("data.abilities.ability-database")
local AbilityIndexes = require("data.abilities.ability-indexes")
local SpeciesDatabase = require("data.species.species-database")
local CryptoRNG = require("game-logic.rng.crypto-rng")

-- Ability slot enumeration (matching TypeScript AbilityAttr)
PokemonAbilityState.AbilitySlot = {
    ABILITY_1 = 1,
    ABILITY_2 = 2,
    ABILITY_HIDDEN = 4
}

-- Pokemon ability state structure
PokemonAbilityState.PokemonAbilityData = {
    -- Current ability
    currentAbilityId = nil,
    currentAbilitySlot = nil,
    
    -- Available abilities for this Pokemon
    availableAbilities = {}, -- {slotId = abilityId}
    
    -- Ability history and changes
    originalAbility = nil,    -- Original ability from species
    abilityHistory = {},      -- Array of ability changes
    temporaryAbility = nil,   -- Temporary ability from moves/items
    
    -- Ability suppression state
    abilitySuppressed = false,
    suppressionSource = nil,
    suppressionTurns = 0,
    
    -- Breeding and inheritance data
    inheritanceData = {
        parentAbilities = {},     -- Abilities from parents
        inheritanceRules = {},    -- Special inheritance rules
        breedingCompatible = {}   -- Compatible abilities for breeding
    }
}

-- Initialize Pokemon ability state
function PokemonAbilityState.initPokemonAbility(pokemon, speciesId, abilitySlot)
    if not pokemon.abilityState then
        pokemon.abilityState = {}
        
        -- Copy template structure
        for key, value in pairs(PokemonAbilityState.PokemonAbilityData) do
            if type(value) == "table" then
                pokemon.abilityState[key] = {}
                for subKey, subValue in pairs(value) do
                    pokemon.abilityState[key][subKey] = subValue
                end
            else
                pokemon.abilityState[key] = value
            end
        end
    end
    
    -- Set up species-specific abilities
    PokemonAbilityState.setupSpeciesAbilities(pokemon, speciesId)
    
    -- Set initial ability based on slot preference
    PokemonAbilityState.setInitialAbility(pokemon, abilitySlot)
    
    return true
end

-- Set up available abilities for species
function PokemonAbilityState.setupSpeciesAbilities(pokemon, speciesId)
    local speciesAbilities = AbilityIndexes.getSpeciesAbilities(speciesId)
    
    pokemon.abilityState.availableAbilities = {}
    
    for _, abilityInfo in ipairs(speciesAbilities) do
        pokemon.abilityState.availableAbilities[abilityInfo.slot] = abilityInfo.id
    end
    
    return true
end

-- Set initial ability for Pokemon
function PokemonAbilityState.setInitialAbility(pokemon, preferredSlot)
    local availableSlots = {}
    
    -- Get all available ability slots
    for slot, abilityId in pairs(pokemon.abilityState.availableAbilities) do
        table.insert(availableSlots, {slot = slot, abilityId = abilityId})
    end
    
    if #availableSlots == 0 then
        return false, "No abilities available for this Pokemon"
    end
    
    -- Use preferred slot if available
    local selectedAbility = nil
    if preferredSlot and pokemon.abilityState.availableAbilities[preferredSlot] then
        selectedAbility = {
            slot = preferredSlot,
            abilityId = pokemon.abilityState.availableAbilities[preferredSlot]
        }
    else
        -- Default to first available ability (usually ABILITY_1)
        table.sort(availableSlots, function(a, b) return a.slot < b.slot end)
        selectedAbility = availableSlots[1]
    end
    
    -- Set current ability
    pokemon.abilityState.currentAbilityId = selectedAbility.abilityId
    pokemon.abilityState.currentAbilitySlot = selectedAbility.slot
    pokemon.abilityState.originalAbility = selectedAbility.abilityId
    
    return true
end

-- Get current Pokemon ability
function PokemonAbilityState.getCurrentAbility(pokemon)
    if not pokemon.abilityState then
        return nil
    end
    
    -- Check for temporary ability first
    if pokemon.abilityState.temporaryAbility then
        return {
            id = pokemon.abilityState.temporaryAbility,
            slot = pokemon.abilityState.currentAbilitySlot,
            isTemporary = true
        }
    end
    
    -- Return current ability
    return {
        id = pokemon.abilityState.currentAbilityId,
        slot = pokemon.abilityState.currentAbilitySlot,
        isTemporary = false
    }
end

-- Change Pokemon ability
function PokemonAbilityState.changeAbility(pokemon, newAbilityId, source, isTemporary)
    if not pokemon.abilityState then
        return false, "Pokemon ability state not initialized"
    end
    
    -- Validate new ability
    local abilityData = AbilityDatabase.getAbility(newAbilityId)
    if not abilityData then
        return false, "Invalid ability ID: " .. tostring(newAbilityId)
    end
    
    -- Check if ability can be changed
    if not abilityData.isReplaceable and not isTemporary then
        return false, "Ability cannot be replaced: " .. abilityData.name
    end
    
    -- Record ability change in history
    table.insert(pokemon.abilityState.abilityHistory, {
        previousAbility = pokemon.abilityState.currentAbilityId,
        newAbility = newAbilityId,
        source = source,
        timestamp = os.time(),
        isTemporary = isTemporary or false
    })
    
    if isTemporary then
        -- Set temporary ability
        pokemon.abilityState.temporaryAbility = newAbilityId
    else
        -- Permanently change ability
        pokemon.abilityState.currentAbilityId = newAbilityId
        
        -- Find appropriate slot for new ability
        local newSlot = nil
        for slot, abilityId in pairs(pokemon.abilityState.availableAbilities) do
            if abilityId == newAbilityId then
                newSlot = slot
                break
            end
        end
        
        if not newSlot then
            -- Ability not naturally available, use current slot
            newSlot = pokemon.abilityState.currentAbilitySlot
        end
        
        pokemon.abilityState.currentAbilitySlot = newSlot
    end
    
    return true
end

-- Remove temporary ability
function PokemonAbilityState.removeTemporaryAbility(pokemon)
    if not pokemon.abilityState then
        return false
    end
    
    if pokemon.abilityState.temporaryAbility then
        pokemon.abilityState.temporaryAbility = nil
        return true
    end
    
    return false
end

-- Check if Pokemon can have specific ability
function PokemonAbilityState.canHaveAbility(pokemon, abilityId, speciesId)
    speciesId = speciesId or pokemon.speciesId
    
    if not speciesId then
        return false, "Species ID required"
    end
    
    -- Check species compatibility
    local speciesAbilities = AbilityIndexes.getSpeciesAbilities(speciesId)
    
    for _, abilityInfo in ipairs(speciesAbilities) do
        if abilityInfo.id == abilityId then
            return true, abilityInfo.slot
        end
    end
    
    return false, "Ability not compatible with species"
end

-- Get available abilities for Pokemon
function PokemonAbilityState.getAvailableAbilities(pokemon, includeHidden)
    if not pokemon.abilityState then
        return {}
    end
    
    local abilities = {}
    
    for slot, abilityId in pairs(pokemon.abilityState.availableAbilities) do
        -- Skip hidden abilities if not requested
        if slot ~= PokemonAbilityState.AbilitySlot.ABILITY_HIDDEN or includeHidden then
            local abilityData = AbilityDatabase.getAbility(abilityId)
            if abilityData then
                table.insert(abilities, {
                    id = abilityId,
                    slot = slot,
                    name = abilityData.name,
                    description = abilityData.description,
                    isHidden = slot == PokemonAbilityState.AbilitySlot.ABILITY_HIDDEN
                })
            end
        end
    end
    
    return abilities
end

-- Suppress Pokemon ability
function PokemonAbilityState.suppressAbility(pokemon, source, turns)
    if not pokemon.abilityState then
        return false
    end
    
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    if not currentAbility then
        return false
    end
    
    local abilityData = AbilityDatabase.getAbility(currentAbility.id)
    if not abilityData or not abilityData.isSuppressable then
        return false, "Ability cannot be suppressed"
    end
    
    pokemon.abilityState.abilitySuppressed = true
    pokemon.abilityState.suppressionSource = source
    pokemon.abilityState.suppressionTurns = turns or 0
    
    return true
end

-- Remove ability suppression
function PokemonAbilityState.removeAbilitySuppression(pokemon)
    if not pokemon.abilityState then
        return false
    end
    
    pokemon.abilityState.abilitySuppressed = false
    pokemon.abilityState.suppressionSource = nil
    pokemon.abilityState.suppressionTurns = 0
    
    return true
end

-- Check if Pokemon ability is suppressed
function PokemonAbilityState.isAbilitySuppressed(pokemon)
    if not pokemon.abilityState then
        return false
    end
    
    return pokemon.abilityState.abilitySuppressed or false
end

-- Update suppression turns (called each turn)
function PokemonAbilityState.updateSuppressionTurns(pokemon)
    if not pokemon.abilityState or not pokemon.abilityState.abilitySuppressed then
        return false
    end
    
    if pokemon.abilityState.suppressionTurns > 0 then
        pokemon.abilityState.suppressionTurns = pokemon.abilityState.suppressionTurns - 1
        
        if pokemon.abilityState.suppressionTurns <= 0 then
            PokemonAbilityState.removeAbilitySuppression(pokemon)
            return true -- Suppression ended
        end
    end
    
    return false
end

-- Handle ability inheritance for breeding
function PokemonAbilityState.setupBreedingInheritance(offspring, parent1, parent2)
    if not offspring.abilityState then
        PokemonAbilityState.initPokemonAbility(offspring, offspring.speciesId)
    end
    
    -- Store parent abilities
    offspring.abilityState.inheritanceData.parentAbilities = {
        parent1 = parent1.abilityState and parent1.abilityState.currentAbilityId or nil,
        parent2 = parent2.abilityState and parent2.abilityState.currentAbilityId or nil
    }
    
    -- Apply inheritance rules
    local inheritedAbility = PokemonAbilityState.calculateInheritedAbility(offspring, parent1, parent2)
    
    if inheritedAbility then
        offspring.abilityState.currentAbilityId = inheritedAbility.abilityId
        offspring.abilityState.currentAbilitySlot = inheritedAbility.slot
        offspring.abilityState.originalAbility = inheritedAbility.abilityId
    end
    
    return true
end

-- Calculate inherited ability based on breeding rules
function PokemonAbilityState.calculateInheritedAbility(offspring, parent1, parent2)
    local availableAbilities = offspring.abilityState.availableAbilities
    
    if not availableAbilities or not next(availableAbilities) then
        return nil
    end
    
    -- Get parent abilities that are compatible with offspring
    local inheritableAbilities = {}
    
    for _, parent in ipairs({parent1, parent2}) do
        if parent.abilityState and parent.abilityState.currentAbilityId then
            local parentAbility = parent.abilityState.currentAbilityId
            
            -- Check if offspring can have parent's ability
            for slot, abilityId in pairs(availableAbilities) do
                if abilityId == parentAbility then
                    table.insert(inheritableAbilities, {
                        abilityId = abilityId,
                        slot = slot,
                        parent = parent
                    })
                end
            end
        end
    end
    
    -- Apply inheritance priority rules
    if #inheritableAbilities > 0 then
        -- Prefer hidden abilities if available
        for _, inheritance in ipairs(inheritableAbilities) do
            if inheritance.slot == PokemonAbilityState.AbilitySlot.ABILITY_HIDDEN then
                -- Hidden abilities have special inheritance rules (typically lower chance)
                if CryptoRNG.random() < 0.6 then -- 60% chance to inherit hidden ability
                    return inheritance
                end
            end
        end
        
        -- Otherwise, random selection from compatible abilities
        return inheritableAbilities[CryptoRNG.random(1, #inheritableAbilities)]
    end
    
    -- Fallback to species default
    local defaultSlots = {
        PokemonAbilityState.AbilitySlot.ABILITY_1,
        PokemonAbilityState.AbilitySlot.ABILITY_2
    }
    
    for _, slot in ipairs(defaultSlots) do
        if availableAbilities[slot] then
            return {
                abilityId = availableAbilities[slot],
                slot = slot
            }
        end
    end
    
    return nil
end

-- Validate ability compatibility for breeding
function PokemonAbilityState.validateBreedingCompatibility(species1Id, ability1Id, species2Id, ability2Id)
    -- Check if abilities are compatible for producing offspring
    local species1Abilities = AbilityIndexes.getSpeciesAbilities(species1Id)
    local species2Abilities = AbilityIndexes.getSpeciesAbilities(species2Id)
    
    -- Validate that parents actually can have these abilities
    local parent1Valid = false
    local parent2Valid = false
    
    for _, abilityInfo in ipairs(species1Abilities) do
        if abilityInfo.id == ability1Id then
            parent1Valid = true
            break
        end
    end
    
    for _, abilityInfo in ipairs(species2Abilities) do
        if abilityInfo.id == ability2Id then
            parent2Valid = true
            break
        end
    end
    
    return parent1Valid and parent2Valid
end

-- Get Pokemon ability state for persistence/saving
function PokemonAbilityState.getAbilityStateData(pokemon)
    if not pokemon.abilityState then
        return nil
    end
    
    return {
        currentAbilityId = pokemon.abilityState.currentAbilityId,
        currentAbilitySlot = pokemon.abilityState.currentAbilitySlot,
        originalAbility = pokemon.abilityState.originalAbility,
        temporaryAbility = pokemon.abilityState.temporaryAbility,
        abilitySuppressed = pokemon.abilityState.abilitySuppressed,
        suppressionTurns = pokemon.abilityState.suppressionTurns,
        abilityHistory = pokemon.abilityState.abilityHistory,
        inheritanceData = pokemon.abilityState.inheritanceData
    }
end

-- Restore Pokemon ability state from saved data
function PokemonAbilityState.restoreAbilityStateData(pokemon, stateData, speciesId)
    if not stateData then
        return false
    end
    
    -- Initialize if not present
    if not pokemon.abilityState then
        PokemonAbilityState.initPokemonAbility(pokemon, speciesId)
    end
    
    -- Restore state data
    pokemon.abilityState.currentAbilityId = stateData.currentAbilityId
    pokemon.abilityState.currentAbilitySlot = stateData.currentAbilitySlot
    pokemon.abilityState.originalAbility = stateData.originalAbility
    pokemon.abilityState.temporaryAbility = stateData.temporaryAbility
    pokemon.abilityState.abilitySuppressed = stateData.abilitySuppressed or false
    pokemon.abilityState.suppressionTurns = stateData.suppressionTurns or 0
    pokemon.abilityState.abilityHistory = stateData.abilityHistory or {}
    pokemon.abilityState.inheritanceData = stateData.inheritanceData or {}
    
    return true
end

return PokemonAbilityState