--[[
Pokemon Validator
Pokemon data integrity and validation for the pokemon process

Features:
- Comprehensive Pokemon data validation
- Stat consistency checking
- IV and nature validation
- Level and experience validation
- Anti-cheat validation
--]]

local PokemonValidator = {}

-- Import dependencies
local StatCalculator = require("pokemon.components.stat-calculator")

-- Validation constants
local MIN_LEVEL = 1
local MAX_LEVEL = 100
local MIN_IV = 0
local MAX_IV = 31
local MIN_HP = 1
local MAX_POKEMON_ID = 999999999 -- Reasonable upper limit

-- Core Validation Functions

-- Validate complete Pokemon data
-- @param pokemon: Pokemon data structure
-- @return: Boolean indicating validity, error message if invalid
function PokemonValidator.validatePokemon(pokemon)
    if not pokemon then
        return false, "Pokemon data is required"
    end
    
    -- Validate basic required fields
    local basicValid, basicError = PokemonValidator.validateBasicFields(pokemon)
    if not basicValid then
        return false, basicError
    end
    
    -- Validate level and experience consistency
    local levelValid, levelError = PokemonValidator.validateLevelAndExperience(pokemon)
    if not levelValid then
        return false, levelError
    end
    
    -- Validate IVs
    local ivValid, ivError = PokemonValidator.validateIVs(pokemon.ivs)
    if not ivValid then
        return false, "IV validation failed: " .. ivError
    end
    
    -- Validate nature
    local natureValid, natureError = PokemonValidator.validateNature(pokemon.nature or pokemon.natureId)
    if not natureValid then
        return false, "Nature validation failed: " .. natureError
    end
    
    -- Validate stats consistency
    local statsValid, statsError = PokemonValidator.validateStatConsistency(pokemon)
    if not statsValid then
        return false, "Stat validation failed: " .. statsError
    end
    
    -- Validate HP
    local hpValid, hpError = PokemonValidator.validateHP(pokemon)
    if not hpValid then
        return false, "HP validation failed: " .. hpError
    end
    
    -- Validate gender (if present)
    if pokemon.gender then
        local genderValid, genderError = PokemonValidator.validateGender(pokemon.gender)
        if not genderValid then
            return false, "Gender validation failed: " .. genderError
        end
    end
    
    return true
end

-- Validate basic required fields
-- @param pokemon: Pokemon data
-- @return: Boolean indicating validity, error message
function PokemonValidator.validateBasicFields(pokemon)
    -- Required fields
    local requiredFields = {
        "id", "speciesId", "level", "hp", "maxHp", "stats", "ivs"
    }
    
    for _, field in ipairs(requiredFields) do
        if pokemon[field] == nil then
            return false, "Missing required field: " .. field
        end
    end
    
    -- Validate ID
    if type(pokemon.id) ~= "number" or pokemon.id < 1 or pokemon.id > MAX_POKEMON_ID or pokemon.id ~= math.floor(pokemon.id) then
        return false, "Invalid Pokemon ID: must be positive integer"
    end
    
    -- Validate species ID
    if not pokemon.speciesId or (type(pokemon.speciesId) ~= "string" and type(pokemon.speciesId) ~= "number") then
        return false, "Invalid species ID"
    end
    
    -- Validate player ID (if present)
    if pokemon.playerId and type(pokemon.playerId) ~= "string" then
        return false, "Invalid player ID: must be string"
    end
    
    return true
end

-- Validate level and experience consistency
-- @param pokemon: Pokemon data
-- @return: Boolean indicating validity, error message
function PokemonValidator.validateLevelAndExperience(pokemon)
    -- Validate level range
    if type(pokemon.level) ~= "number" or pokemon.level < MIN_LEVEL or pokemon.level > MAX_LEVEL then
        return false, "Invalid level: must be between " .. MIN_LEVEL .. " and " .. MAX_LEVEL
    end
    
    if pokemon.level ~= math.floor(pokemon.level) then
        return false, "Level must be an integer"
    end
    
    -- Validate experience (if present)
    if pokemon.exp then
        if type(pokemon.exp) ~= "number" or pokemon.exp < 0 then
            return false, "Experience must be non-negative number"
        end
        
        if pokemon.exp ~= math.floor(pokemon.exp) then
            return false, "Experience must be an integer"
        end
        
        -- Check experience/level consistency
        -- This would require access to growth rate data, simplified for now
        if pokemon.level == 1 and pokemon.exp > 10 then
            -- Level 1 should have minimal experience
            return false, "Experience too high for level 1"
        end
        
        if pokemon.level == MAX_LEVEL and pokemon.exp > 2000000 then
            -- Reasonable upper bound for max level experience
            return false, "Experience unreasonably high for level " .. MAX_LEVEL
        end
    end
    
    return true
end

-- Validate IVs
-- @param ivs: IV data table
-- @return: Boolean indicating validity, error message
function PokemonValidator.validateIVs(ivs)
    return StatCalculator.validateIVs(ivs)
end

-- Validate nature
-- @param nature: Nature ID or name
-- @return: Boolean indicating validity, error message
function PokemonValidator.validateNature(nature)
    if not nature then
        return false, "Nature is required"
    end
    
    if type(nature) == "number" then
        if nature < 1 or nature > 25 or nature ~= math.floor(nature) then
            return false, "Invalid nature ID: must be integer between 1 and 25"
        end
    elseif type(nature) == "string" then
        if nature == "" then
            return false, "Nature name cannot be empty"
        end
        -- Would validate against known nature names in full implementation
    else
        return false, "Nature must be number or string"
    end
    
    return true
end

-- Validate stat consistency
-- @param pokemon: Pokemon data with stats, baseStats, ivs, level, nature
-- @return: Boolean indicating validity, error message
function PokemonValidator.validateStatConsistency(pokemon)
    if not pokemon.stats or type(pokemon.stats) ~= "table" then
        return false, "Stats table is required"
    end
    
    -- Check that all required stats are present and valid
    local requiredStats = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"}
    
    for _, statName in ipairs(requiredStats) do
        local statValue = pokemon.stats[statName]
        
        if not statValue or type(statValue) ~= "number" then
            return false, "Invalid " .. statName .. " stat: must be number"
        end
        
        if statValue < 1 or statValue > 999 or statValue ~= math.floor(statValue) then
            return false, "Invalid " .. statName .. " stat: must be integer between 1 and 999"
        end
    end
    
    -- If we have complete data, validate stat calculation accuracy
    if pokemon.baseStats and pokemon.ivs and pokemon.level and (pokemon.nature or pokemon.natureId) then
        local expectedStats, error = StatCalculator.calculateAllStats(
            pokemon.baseStats,
            pokemon.ivs,
            pokemon.level,
            pokemon.nature or pokemon.natureId
        )
        
        if expectedStats then
            -- Allow small tolerance for rounding differences
            local tolerance = 1
            
            for _, statName in ipairs(requiredStats) do
                local expected = expectedStats[statName]
                local actual = pokemon.stats[statName]
                
                if math.abs(expected - actual) > tolerance then
                    return false, "Stat calculation mismatch for " .. statName .. 
                          ": expected " .. expected .. ", got " .. actual
                end
            end
        end
    end
    
    return true
end

-- Validate HP values
-- @param pokemon: Pokemon data
-- @return: Boolean indicating validity, error message
function PokemonValidator.validateHP(pokemon)
    -- Validate maxHp
    if type(pokemon.maxHp) ~= "number" or pokemon.maxHp < MIN_HP then
        return false, "Invalid maxHp: must be at least " .. MIN_HP
    end
    
    if pokemon.maxHp ~= math.floor(pokemon.maxHp) then
        return false, "maxHp must be an integer"
    end
    
    -- Validate current hp
    if type(pokemon.hp) ~= "number" or pokemon.hp < 0 then
        return false, "Invalid hp: must be non-negative number"
    end
    
    if pokemon.hp ~= math.floor(pokemon.hp) then
        return false, "hp must be an integer"
    end
    
    if pokemon.hp > pokemon.maxHp then
        return false, "hp cannot exceed maxHp"
    end
    
    -- Check HP consistency with stats (if available)
    if pokemon.stats and pokemon.stats.hp then
        if pokemon.maxHp ~= pokemon.stats.hp then
            return false, "maxHp must match HP stat"
        end
    end
    
    return true
end

-- Validate gender
-- @param gender: Gender string
-- @return: Boolean indicating validity, error message
function PokemonValidator.validateGender(gender)
    if type(gender) ~= "string" then
        return false, "Gender must be string"
    end
    
    local validGenders = {"MALE", "FEMALE", "GENDERLESS"}
    for _, validGender in ipairs(validGenders) do
        if gender == validGender then
            return true
        end
    end
    
    return false, "Invalid gender: must be MALE, FEMALE, or GENDERLESS"
end

-- Anti-Cheat Validation

-- Validate Pokemon is not impossibly modified
-- @param pokemon: Pokemon data
-- @return: Boolean indicating legitimacy, error message
function PokemonValidator.validateAntiCheat(pokemon)
    -- Check for impossible stat combinations
    local antiCheatValid, antiCheatError = PokemonValidator.validateReasonableStats(pokemon)
    if not antiCheatValid then
        return false, antiCheatError
    end
    
    -- Check for impossible level/experience combinations
    if pokemon.level == 1 and pokemon.exp and pokemon.exp > 1000 then
        return false, "Suspicious experience for level 1"
    end
    
    -- Check for impossible shiny/IV combinations (if shiny data available)
    if pokemon.isShiny ~= nil and pokemon.ivs then
        local calculatedShiny = StatCalculator.calculateShinyFromIVs(pokemon.ivs)
        if pokemon.isShiny ~= calculatedShiny then
            return false, "Shiny status doesn't match IV calculation"
        end
    end
    
    return true
end

-- Validate stats are reasonable and not hacked
-- @param pokemon: Pokemon data
-- @return: Boolean indicating validity, error message
function PokemonValidator.validateReasonableStats(pokemon)
    if not pokemon.stats then
        return true -- Can't validate without stats
    end
    
    -- Check for unreasonable stat values
    for statName, statValue in pairs(pokemon.stats) do
        -- No stat should be absurdly high for any legitimate Pokemon
        if statValue > 800 then
            return false, "Stat " .. statName .. " is unreasonably high: " .. statValue
        end
        
        -- HP should be reasonable for the level
        if statName == "hp" and pokemon.level then
            local maxExpectedHP = pokemon.level * 3 + 200 -- Generous upper bound
            if statValue > maxExpectedHP then
                return false, "HP is unreasonably high for level " .. pokemon.level
            end
        end
    end
    
    return true
end

-- Batch Validation

-- Validate multiple Pokemon at once
-- @param pokemonList: Array of Pokemon data
-- @return: Array of validation results
function PokemonValidator.validatePokemonBatch(pokemonList)
    if not pokemonList or type(pokemonList) ~= "table" then
        return {}
    end
    
    local results = {}
    
    for i, pokemon in ipairs(pokemonList) do
        local isValid, error = PokemonValidator.validatePokemon(pokemon)
        table.insert(results, {
            index = i,
            pokemonId = pokemon and pokemon.id,
            valid = isValid,
            error = error
        })
    end
    
    return results
end

-- Quick validation for critical fields only
-- @param pokemon: Pokemon data
-- @return: Boolean indicating basic validity
function PokemonValidator.quickValidate(pokemon)
    if not pokemon then
        return false
    end
    
    -- Check only essential fields for performance
    return pokemon.id and 
           pokemon.speciesId and 
           pokemon.level and 
           type(pokemon.level) == "number" and
           pokemon.level >= MIN_LEVEL and 
           pokemon.level <= MAX_LEVEL and
           pokemon.hp and 
           type(pokemon.hp) == "number" and
           pokemon.hp >= 0 and
           pokemon.maxHp and
           type(pokemon.maxHp) == "number" and
           pokemon.maxHp >= MIN_HP
end

-- Validation Statistics and Utilities

-- Get validation error categories
-- @param pokemon: Pokemon data
-- @return: Table with specific validation issues
function PokemonValidator.getValidationDetails(pokemon)
    local details = {
        basicFields = true,
        level = true,
        ivs = true,
        nature = true,
        stats = true,
        hp = true,
        gender = true,
        antiCheat = true,
        errors = {}
    }
    
    if not pokemon then
        details.basicFields = false
        table.insert(details.errors, "Pokemon data missing")
        return details
    end
    
    -- Check each validation category
    local basicValid, basicError = PokemonValidator.validateBasicFields(pokemon)
    if not basicValid then
        details.basicFields = false
        table.insert(details.errors, "Basic fields: " .. basicError)
    end
    
    local levelValid, levelError = PokemonValidator.validateLevelAndExperience(pokemon)
    if not levelValid then
        details.level = false
        table.insert(details.errors, "Level: " .. levelError)
    end
    
    if pokemon.ivs then
        local ivValid, ivError = PokemonValidator.validateIVs(pokemon.ivs)
        if not ivValid then
            details.ivs = false
            table.insert(details.errors, "IVs: " .. ivError)
        end
    end
    
    if pokemon.nature or pokemon.natureId then
        local natureValid, natureError = PokemonValidator.validateNature(pokemon.nature or pokemon.natureId)
        if not natureValid then
            details.nature = false
            table.insert(details.errors, "Nature: " .. natureError)
        end
    end
    
    local statsValid, statsError = PokemonValidator.validateStatConsistency(pokemon)
    if not statsValid then
        details.stats = false
        table.insert(details.errors, "Stats: " .. statsError)
    end
    
    local hpValid, hpError = PokemonValidator.validateHP(pokemon)
    if not hpValid then
        details.hp = false
        table.insert(details.errors, "HP: " .. hpError)
    end
    
    if pokemon.gender then
        local genderValid, genderError = PokemonValidator.validateGender(pokemon.gender)
        if not genderValid then
            details.gender = false
            table.insert(details.errors, "Gender: " .. genderError)
        end
    end
    
    local antiCheatValid, antiCheatError = PokemonValidator.validateAntiCheat(pokemon)
    if not antiCheatValid then
        details.antiCheat = false
        table.insert(details.errors, "Anti-cheat: " .. antiCheatError)
    end
    
    return details
end

return PokemonValidator