-- progress-validator.lua: Progress and Content Validation
-- Validates game progression, experience, and content access

local ProgressValidator = {}

-- Constants
local PROGRESS_ERRORS = {
    CONTENT_SKIP = "PROG_001",
    INVALID_EXPERIENCE = "PROG_002",
    ILLEGAL_ITEM = "PROG_003",
    STATE_CORRUPTION = "PROG_004",
    INVALID_LEVEL_UP = "PROG_005"
}

local GAME_CONSTANTS = {
    MAX_POKEMON_LEVEL = 100,
    LEVEL_EXP_REQUIREMENTS = {
        [1] = 0,
        [2] = 8,
        [5] = 125,
        [10] = 1000,
        [25] = 15625,
        [50] = 125000,
        [100] = 1000000
    },
    AVAILABLE_AREAS = {"starter_town", "route_1", "forest", "city_1"},
    REQUIRED_PROGRESSION = {
        route_1 = {"starter_town"},
        forest = {"starter_town", "route_1"},
        city_1 = {"starter_town", "route_1", "forest"}
    }
}

-- Validate experience gain from battles or events
function ProgressValidator.validateExperienceGain(pokemonData, expGained, battleContext)
    if not pokemonData or not expGained then
        error({
            code = PROGRESS_ERRORS.INVALID_EXPERIENCE,
            message = "Pokemon data and experience amount required",
            success = false
        })
    end
    
    if expGained < 0 then
        error({
            code = PROGRESS_ERRORS.INVALID_EXPERIENCE,
            message = "Experience gain cannot be negative",
            success = false
        })
    end
    
    if expGained > 10000 then  -- Reasonable max exp per battle
        error({
            code = PROGRESS_ERRORS.INVALID_EXPERIENCE,
            message = "Experience gain exceeds maximum per battle",
            success = false
        })
    end
    
    return true
end

-- Validate Pokemon level increases
function ProgressValidator.validateLevelUp(pokemonData, newLevel)
    if not pokemonData or not newLevel then
        error({
            code = PROGRESS_ERRORS.INVALID_LEVEL_UP,
            message = "Pokemon data and new level required",
            success = false
        })
    end
    
    local currentLevel = pokemonData.level or 1
    
    if newLevel <= currentLevel then
        error({
            code = PROGRESS_ERRORS.INVALID_LEVEL_UP,
            message = "New level must be higher than current level",
            success = false
        })
    end
    
    if newLevel > GAME_CONSTANTS.MAX_POKEMON_LEVEL then
        error({
            code = PROGRESS_ERRORS.INVALID_LEVEL_UP,
            message = "Level cannot exceed maximum",
            success = false
        })
    end
    
    -- Check if Pokemon has enough experience for level
    local requiredExp = GAME_CONSTANTS.LEVEL_EXP_REQUIREMENTS[newLevel] or (newLevel ^ 3)
    if pokemonData.experience and pokemonData.experience < requiredExp then
        error({
            code = PROGRESS_ERRORS.INVALID_LEVEL_UP,
            message = "Insufficient experience for level up",
            success = false
        })
    end
    
    return true
end

-- Validate content progression and area access
function ProgressValidator.validateContentProgression(playerData, requestedArea)
    if not playerData or not requestedArea then
        error({
            code = PROGRESS_ERRORS.CONTENT_SKIP,
            message = "Player data and requested area required",
            success = false
        })
    end
    
    local visitedAreas = playerData.visitedAreas or {}
    local requiredAreas = GAME_CONSTANTS.REQUIRED_PROGRESSION[requestedArea] or {}
    
    for _, requiredArea in ipairs(requiredAreas) do
        local hasVisited = false
        for _, visitedArea in ipairs(visitedAreas) do
            if visitedArea == requiredArea then
                hasVisited = true
                break
            end
        end
        
        if not hasVisited then
            error({
                code = PROGRESS_ERRORS.CONTENT_SKIP,
                message = string.format("Must visit %s before accessing %s", requiredArea, requestedArea),
                success = false
            })
        end
    end
    
    return true
end

-- Validate item acquisition legality
function ProgressValidator.validateItemAcquisition(playerData, itemId, quantity, acquisitionMethod)
    if not playerData or not itemId or not quantity then
        error({
            code = PROGRESS_ERRORS.ILLEGAL_ITEM,
            message = "Player data, item ID and quantity required",
            success = false
        })
    end
    
    if quantity <= 0 then
        error({
            code = PROGRESS_ERRORS.ILLEGAL_ITEM,
            message = "Item quantity must be positive",
            success = false
        })
    end
    
    -- Check against item availability in current areas
    local currentArea = playerData.currentArea
    local areaItems = {
        starter_town = {"pokeball", "potion"},
        route_1 = {"pokeball", "potion", "antidote"},
        forest = {"pokeball", "potion", "antidote", "berry"},
        city_1 = {"pokeball", "potion", "antidote", "berry", "super_potion"}
    }
    
    if currentArea and areaItems[currentArea] then
        local itemAvailable = false
        for _, availableItem in ipairs(areaItems[currentArea]) do
            if availableItem == itemId then
                itemAvailable = true
                break
            end
        end
        
        if not itemAvailable and acquisitionMethod == "purchase" then
            error({
                code = PROGRESS_ERRORS.ILLEGAL_ITEM,
                message = string.format("Item %s not available in %s", itemId, currentArea),
                success = false
            })
        end
    end
    
    return true
end

-- Validate overall game state consistency
function ProgressValidator.validateStateConsistency(gameState)
    if not gameState then
        error({
            code = PROGRESS_ERRORS.STATE_CORRUPTION,
            message = "Game state required for validation",
            success = false
        })
    end
    
    local playerData = gameState.player
    if not playerData then
        error({
            code = PROGRESS_ERRORS.STATE_CORRUPTION,
            message = "Player data missing from game state",
            success = false
        })
    end
    
    -- Validate Pokemon party consistency
    if playerData.party then
        for i, pokemon in ipairs(playerData.party) do
            if pokemon.level and pokemon.experience then
                local minExpForLevel = GAME_CONSTANTS.LEVEL_EXP_REQUIREMENTS[pokemon.level] or (pokemon.level ^ 3)
                if pokemon.experience < minExpForLevel then
                    error({
                        code = PROGRESS_ERRORS.STATE_CORRUPTION,
                        message = string.format("Pokemon %d has insufficient experience for level %d", i, pokemon.level),
                        success = false
                    })
                end
            end
        end
    end
    
    return true
end

-- Get progress validation error information
function ProgressValidator.getErrorInfo(errorCode)
    local errorMessages = {
        [PROGRESS_ERRORS.CONTENT_SKIP] = "Content progression validation failed",
        [PROGRESS_ERRORS.INVALID_EXPERIENCE] = "Experience validation failed",
        [PROGRESS_ERRORS.ILLEGAL_ITEM] = "Item acquisition validation failed",
        [PROGRESS_ERRORS.STATE_CORRUPTION] = "Game state consistency validation failed",
        [PROGRESS_ERRORS.INVALID_LEVEL_UP] = "Level up validation failed"
    }
    
    return {
        code = errorCode,
        message = errorMessages[errorCode] or "Unknown progress validation error",
        category = "PROGRESS"
    }
end

return ProgressValidator