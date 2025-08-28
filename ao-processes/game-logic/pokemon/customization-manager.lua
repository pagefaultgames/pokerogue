--[[
Pokemon Customization Manager
Handles Pokemon customization features including nicknames, gender, shiny status, and variants

Features:
- Nickname validation and management
- Gender determination using deterministic RNG
- Shiny status calculation and tracking
- Variant/forme management for regional and special forms
- Input validation and security
--]]

local CustomizationManager = {}

-- Import dependencies
local StatCalculator = require("game-logic.pokemon.stat-calculator")
local SpeciesDatabase = require("data.species.species-database")
local Enums = require("data.constants.enums")

-- Constants for validation
local MAX_NICKNAME_LENGTH = 12
local MIN_NICKNAME_LENGTH = 1
local SHINY_ODDS_STANDARD = 4096      -- 1/4096 standard shiny rate
local SHINY_ODDS_MASUDA = 683         -- Masuda method rate
local SHINY_ODDS_SHINY_CHARM = 1365   -- With shiny charm

-- Invalid nickname patterns (basic filtering)
local INVALID_NICKNAME_PATTERNS = {
    "^%s*$",        -- Only whitespace
    ".*[<>\"'`].*", -- HTML/script injection characters
    ".*%c.*"        -- Control characters
}

-- Nickname System

-- Validate nickname input
-- @param nickname: Nickname string to validate
-- @return: Boolean validity, error message
function CustomizationManager.validateNickname(nickname)
    if not nickname then
        return true  -- Nil nickname is valid (clears nickname)
    end
    
    if type(nickname) ~= "string" then
        return false, "Nickname must be a string"
    end
    
    -- Length validation
    if string.len(nickname) > MAX_NICKNAME_LENGTH then
        return false, "Nickname cannot exceed " .. MAX_NICKNAME_LENGTH .. " characters"
    end
    
    if string.len(nickname) < MIN_NICKNAME_LENGTH then
        return false, "Nickname must be at least " .. MIN_NICKNAME_LENGTH .. " character"
    end
    
    -- Pattern validation
    for _, pattern in ipairs(INVALID_NICKNAME_PATTERNS) do
        if string.match(nickname, pattern) then
            return false, "Nickname contains invalid characters"
        end
    end
    
    return true
end

-- Set Pokemon nickname
-- @param pokemon: Pokemon instance
-- @param nickname: New nickname (nil to clear)
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, result info
function CustomizationManager.setNickname(pokemon, nickname, playerId)
    if not pokemon then
        return nil, "Pokemon instance required"
    end
    
    -- Validate ownership
    if pokemon.playerId ~= playerId then
        return pokemon, {
            success = false,
            reason = "access_denied",
            message = "Only the Pokemon's owner can change its nickname"
        }
    end
    
    -- Validate nickname
    local valid, error = CustomizationManager.validateNickname(nickname)
    if not valid then
        return pokemon, {
            success = false,
            reason = "invalid_nickname",
            message = error
        }
    end
    
    -- Store old nickname for result
    local oldNickname = pokemon.nickname
    
    -- Set new nickname (nil clears nickname)
    pokemon.nickname = nickname
    
    return pokemon, {
        success = true,
        oldNickname = oldNickname,
        newNickname = nickname,
        message = nickname and "Nickname set successfully" or "Nickname cleared successfully"
    }
end

-- Get Pokemon display name (nickname or species name)
-- @param pokemon: Pokemon instance
-- @return: Display name string
function CustomizationManager.getDisplayName(pokemon)
    if not pokemon then
        return "Unknown"
    end
    
    -- Use nickname if available
    if pokemon.nickname and pokemon.nickname ~= "" then
        return pokemon.nickname
    end
    
    -- Fall back to species name
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
    if speciesData and speciesData.name then
        return speciesData.name
    end
    
    return "Unknown Pokemon"
end

-- Gender System

-- Determine Pokemon gender using deterministic RNG
-- @param speciesId: Species ID for gender ratio lookup
-- @param personalityValue: Personality value for gender determination
-- @return: Gender enum value
function CustomizationManager.determineGender(speciesId, personalityValue)
    if not speciesId then
        return Enums.Gender.UNKNOWN
    end
    
    -- Get species data for gender ratio
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(speciesId)
    if not speciesData then
        return Enums.Gender.UNKNOWN
    end
    
    -- Handle genderless species
    local genderRatio = speciesData.genderRatio
    if genderRatio == -1 or genderRatio == nil then
        return Enums.Gender.GENDERLESS
    end
    
    -- Handle female-only species
    if genderRatio == 0 then
        return Enums.Gender.FEMALE
    end
    
    -- Handle male-only species
    if genderRatio == 8 then
        return Enums.Gender.MALE
    end
    
    -- Use personality value for gender determination
    personalityValue = personalityValue or math.random(0, 65535)
    local genderThreshold = genderRatio * 32  -- Convert 8ths to 256ths
    
    -- Determine gender based on personality value
    local genderValue = personalityValue % 256
    if genderValue < genderThreshold then
        return Enums.Gender.FEMALE
    else
        return Enums.Gender.MALE
    end
end

-- Generate personality value for gender and other traits
-- @param seed: Optional seed for deterministic generation
-- @return: 16-bit personality value
function CustomizationManager.generatePersonalityValue(seed)
    -- TODO: Replace with AO crypto module for deterministic generation
    -- For now using math.random but should use ao.randomInt() in production
    if seed then
        math.randomseed(seed)
    end
    
    return math.random(0, 65535)
end

-- Get gender display string
-- @param gender: Gender enum value
-- @return: Display string for gender
function CustomizationManager.getGenderDisplay(gender)
    if gender == Enums.Gender.MALE then
        return "♂"
    elseif gender == Enums.Gender.FEMALE then
        return "♀" 
    elseif gender == Enums.Gender.GENDERLESS then
        return "-"
    else
        return "?"
    end
end

-- Shiny System

-- Calculate shiny status from IVs and personality value
-- @param pokemon: Pokemon instance or IV table
-- @param method: Shiny calculation method ("standard", "masuda", "charm")
-- @return: Boolean indicating if Pokemon is shiny
function CustomizationManager.calculateShinyStatus(pokemon, method)
    if not pokemon or not pokemon.ivs then
        return false
    end
    
    method = method or "standard"
    local shinyOdds = SHINY_ODDS_STANDARD
    
    if method == "masuda" then
        shinyOdds = SHINY_ODDS_MASUDA
    elseif method == "charm" then
        shinyOdds = SHINY_ODDS_SHINY_CHARM
    end
    
    -- Use StatCalculator's shiny determination
    local isShiny = StatCalculator.calculateShinyFromIVs(pokemon.ivs)
    
    -- Adjust for different methods (simplified)
    if method ~= "standard" and not isShiny then
        -- Additional roll for special methods
        local extraRoll = math.random(1, shinyOdds)
        isShiny = extraRoll == 1
    end
    
    return isShiny
end

-- Force set shiny status (for special cases)
-- @param pokemon: Pokemon instance  
-- @param isShiny: Boolean shiny status
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, result info
function CustomizationManager.setShinyStatus(pokemon, isShiny, playerId)
    if not pokemon then
        return nil, "Pokemon instance required"
    end
    
    -- Validate ownership (only allow for admin or special cases)
    if pokemon.playerId ~= playerId then
        return pokemon, {
            success = false,
            reason = "access_denied",
            message = "Only the Pokemon's owner can modify shiny status"
        }
    end
    
    local oldStatus = pokemon.isShiny
    pokemon.isShiny = isShiny == true
    
    return pokemon, {
        success = true,
        oldStatus = oldStatus,
        newStatus = pokemon.isShiny,
        message = pokemon.isShiny and "Pokemon is now shiny" or "Pokemon is no longer shiny"
    }
end

-- Get shiny display indicator
-- @param isShiny: Boolean shiny status
-- @return: Display string for shiny status
function CustomizationManager.getShinyDisplay(isShiny)
    return isShiny and "★" or ""
end

-- Variant/Forme System

-- Set Pokemon variant/forme
-- @param pokemon: Pokemon instance
-- @param variantId: Variant/forme ID
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, result info  
function CustomizationManager.setVariant(pokemon, variantId, playerId)
    if not pokemon then
        return nil, "Pokemon instance required"
    end
    
    -- Validate ownership
    if pokemon.playerId ~= playerId then
        return pokemon, {
            success = false,
            reason = "access_denied",
            message = "Only the Pokemon's owner can change its variant"
        }
    end
    
    -- Validate variant ID
    if type(variantId) ~= "number" or variantId < 0 then
        return pokemon, {
            success = false,
            reason = "invalid_variant",
            message = "Invalid variant ID"
        }
    end
    
    -- Validate variant exists for species (would need variant database)
    -- For now, allowing any non-negative number
    
    local oldVariant = pokemon.variant or 0
    pokemon.variant = variantId
    
    return pokemon, {
        success = true,
        oldVariant = oldVariant,
        newVariant = variantId,
        message = "Pokemon variant updated successfully"
    }
end

-- Get variant display name
-- @param speciesId: Species ID
-- @param variantId: Variant ID
-- @return: Variant display name or empty string
function CustomizationManager.getVariantDisplay(speciesId, variantId)
    if not speciesId or not variantId or variantId == 0 then
        return ""
    end
    
    -- In full implementation, would look up variant names
    -- For now, returning generic variant info
    if variantId == 1 then
        return " (Alolan)"
    elseif variantId == 2 then
        return " (Galarian)"
    elseif variantId == 3 then
        return " (Hisuian)"
    else
        return " (Variant " .. variantId .. ")"
    end
end

-- Comprehensive Customization Functions

-- Apply full customization to Pokemon
-- @param pokemon: Pokemon instance
-- @param customizations: Table of customizations to apply
-- @param playerId: Player ID for ownership validation
-- @return: Updated Pokemon, results summary
function CustomizationManager.applyCustomizations(pokemon, customizations, playerId)
    if not pokemon or not customizations then
        return nil, "Pokemon and customizations required"
    end
    
    -- Validate ownership
    if pokemon.playerId ~= playerId then
        return pokemon, {
            success = false,
            reason = "access_denied",
            message = "Only the Pokemon's owner can customize it"
        }
    end
    
    local results = {
        success = true,
        changes = {},
        errors = {}
    }
    
    -- Apply nickname if provided
    if customizations.nickname ~= nil then
        local updatedPokemon, nicknameResult = CustomizationManager.setNickname(pokemon, customizations.nickname, playerId)
        pokemon = updatedPokemon
        
        if nicknameResult.success then
            table.insert(results.changes, "nickname")
        else
            table.insert(results.errors, nicknameResult.message)
        end
    end
    
    -- Apply variant if provided
    if customizations.variant then
        local updatedPokemon, variantResult = CustomizationManager.setVariant(pokemon, customizations.variant, playerId)
        pokemon = updatedPokemon
        
        if variantResult.success then
            table.insert(results.changes, "variant")
        else
            table.insert(results.errors, variantResult.message)
        end
    end
    
    -- Apply shiny status if provided (restricted operation)
    if customizations.isShiny ~= nil and customizations.allowShinyChange then
        local updatedPokemon, shinyResult = CustomizationManager.setShinyStatus(pokemon, customizations.isShiny, playerId)
        pokemon = updatedPokemon
        
        if shinyResult.success then
            table.insert(results.changes, "shiny")
        else
            table.insert(results.errors, shinyResult.message)
        end
    end
    
    -- Update results
    results.success = #results.errors == 0
    results.changeCount = #results.changes
    
    return pokemon, results
end

-- Get full Pokemon display info
-- @param pokemon: Pokemon instance
-- @return: Complete display information
function CustomizationManager.getPokemonDisplayInfo(pokemon)
    if not pokemon then
        return {
            displayName = "Unknown",
            species = "Unknown",
            nickname = nil,
            gender = "?",
            shiny = "",
            variant = "",
            fullDisplay = "Unknown"
        }
    end
    
    local displayName = CustomizationManager.getDisplayName(pokemon)
    local genderDisplay = CustomizationManager.getGenderDisplay(pokemon.gender)
    local shinyDisplay = CustomizationManager.getShinyDisplay(pokemon.isShiny)
    local variantDisplay = CustomizationManager.getVariantDisplay(pokemon.speciesId, pokemon.variant)
    
    -- Get species name for reference
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
    local speciesName = speciesData and speciesData.name or "Unknown"
    
    -- Build full display string
    local fullDisplay = displayName .. genderDisplay .. shinyDisplay .. variantDisplay
    
    return {
        displayName = displayName,
        species = speciesName,
        nickname = pokemon.nickname,
        gender = genderDisplay,
        shiny = shinyDisplay,
        variant = variantDisplay,
        fullDisplay = fullDisplay,
        level = pokemon.level
    }
end

-- Validation and Utility Functions

-- Validate all customization aspects of Pokemon
-- @param pokemon: Pokemon instance
-- @return: Boolean validity, array of errors
function CustomizationManager.validateCustomizations(pokemon)
    if not pokemon then
        return false, {"Pokemon instance required"}
    end
    
    local errors = {}
    
    -- Validate nickname
    if pokemon.nickname then
        local valid, error = CustomizationManager.validateNickname(pokemon.nickname)
        if not valid then
            table.insert(errors, "Invalid nickname: " .. error)
        end
    end
    
    -- Validate gender
    local validGenders = {
        [Enums.Gender.MALE] = true,
        [Enums.Gender.FEMALE] = true,
        [Enums.Gender.GENDERLESS] = true,
        [Enums.Gender.UNKNOWN] = true
    }
    
    if not validGenders[pokemon.gender] then
        table.insert(errors, "Invalid gender value")
    end
    
    -- Validate shiny status
    if type(pokemon.isShiny) ~= "boolean" then
        table.insert(errors, "Shiny status must be boolean")
    end
    
    -- Validate variant
    if pokemon.variant and (type(pokemon.variant) ~= "number" or pokemon.variant < 0) then
        table.insert(errors, "Invalid variant ID")
    end
    
    return #errors == 0, errors
end

-- Get customization statistics for a Pokemon
-- @param pokemon: Pokemon instance
-- @return: Statistics about Pokemon customizations
function CustomizationManager.getCustomizationStats(pokemon)
    if not pokemon then
        return {
            hasNickname = false,
            isShiny = false,
            hasVariant = false,
            customizationLevel = 0
        }
    end
    
    local stats = {
        hasNickname = pokemon.nickname and pokemon.nickname ~= "",
        isShiny = pokemon.isShiny == true,
        hasVariant = pokemon.variant and pokemon.variant > 0,
        gender = pokemon.gender,
        customizationLevel = 0
    }
    
    -- Calculate customization level (0-3)
    if stats.hasNickname then
        stats.customizationLevel = stats.customizationLevel + 1
    end
    if stats.isShiny then
        stats.customizationLevel = stats.customizationLevel + 1
    end
    if stats.hasVariant then
        stats.customizationLevel = stats.customizationLevel + 1
    end
    
    return stats
end

-- Get constants for external use
function CustomizationManager.getConstants()
    return {
        MAX_NICKNAME_LENGTH = MAX_NICKNAME_LENGTH,
        MIN_NICKNAME_LENGTH = MIN_NICKNAME_LENGTH,
        SHINY_ODDS_STANDARD = SHINY_ODDS_STANDARD,
        SHINY_ODDS_MASUDA = SHINY_ODDS_MASUDA,
        SHINY_ODDS_SHINY_CHARM = SHINY_ODDS_SHINY_CHARM
    }
end

-- Breeding and Generation Functions

-- Generate customization data for new Pokemon
-- @param speciesId: Species ID
-- @param options: Generation options (shinyMethod, forcedTraits, etc.)
-- @return: Table with generated customization data
function CustomizationManager.generateCustomizationData(speciesId, options)
    options = options or {}
    
    -- Generate personality value
    local personalityValue = CustomizationManager.generatePersonalityValue(options.seed)
    
    -- Determine gender
    local gender = CustomizationManager.determineGender(speciesId, personalityValue)
    
    -- Generate shiny status
    local isShiny = false
    if options.forceShiny then
        isShiny = true
    elseif options.shinyMethod then
        -- Would use IVs here, but they're generated elsewhere
        -- For now, using probability-based generation
        local shinyOdds = SHINY_ODDS_STANDARD
        if options.shinyMethod == "masuda" then
            shinyOdds = SHINY_ODDS_MASUDA
        elseif options.shinyMethod == "charm" then
            shinyOdds = SHINY_ODDS_SHINY_CHARM
        end
        
        isShiny = math.random(1, shinyOdds) == 1
    end
    
    -- Set variant
    local variant = options.variant or 0
    
    return {
        personalityValue = personalityValue,
        gender = gender,
        isShiny = isShiny,
        variant = variant
    }
end

return CustomizationManager