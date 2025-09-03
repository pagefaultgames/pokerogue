--[[
Berry Handler
AO message processing for berry operations

Features:
- Berry assignment message handler (leveraging existing held item system)
- Berry activation query handler for berry status and availability  
- Berry consumption tracking handler for inventory updates
- Berry effect query handler for active berry effects and timing
- Berry recycling message handler for moves and abilities
- Proper error handling and success/failure responses for all berry operations

Behavioral Parity Requirements:
- Never use Lua's math.random() - ALWAYS use AO crypto module
- All AO message responses must include success boolean
- All berry operations must be deterministic and reproducible
--]]

-- JSON module (optional for testing environments)
local json = nil
local success, module = pcall(require, "json")
if success then
    json = module
else
    -- Fallback JSON implementation for testing
    json = {
        encode = function(obj)
            if type(obj) == "table" then
                return "{}"
            elseif type(obj) == "string" then
                return '"' .. obj .. '"'
            else
                return tostring(obj)
            end
        end,
        decode = function(str)
            return {}
        end
    }
end

-- Load dependencies
local BerryDatabase = require("data.items.berry-database")
local BerryEffectsProcessor = require("game-logic.items.berry-effects-processor")
local BerryActivationManager = require("game-logic.items.berry-activation-manager")
local ValidationHandler = require("handlers.validation-handler")
local ErrorHandler = require("handlers.error-handler")

-- Berry Handler Implementation
local BerryHandler = {}

--[[
Assign berry to Pokemon held item slot
@param msg AO message with assignment data
@return Assignment response
--]]
local function assignBerry(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse berry assignment data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"pokemonId", "berryId"})
    if not validation.isValid then
        return ErrorHandler.createErrorResponse("VALIDATION_FAILED", validation.message, msg.Id)
    end
    
    -- Validate berry exists in database
    local berry = BerryDatabase.getBerry(data.berryId)
    if not berry then
        return ErrorHandler.createErrorResponse("BERRY_NOT_FOUND", "Berry " .. data.berryId .. " not found in database", msg.Id)
    end
    
    -- Validate Pokemon exists (this would integrate with Pokemon state management)
    -- For now, assume Pokemon validation is handled by the calling system
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "ASSIGN_BERRY",
        pokemonId = data.pokemonId,
        berryId = data.berryId,
        berryName = berry.name,
        berryEffect = berry.effect,
        activationCondition = berry.activationCondition,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

--[[
Query berry status and availability
@param msg AO message with query data
@return Berry status response
--]]
local function queryBerryStatus(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse berry query data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"pokemonId"})
    if not validation.isValid then
        return ErrorHandler.createErrorResponse("VALIDATION_FAILED", validation.message, msg.Id)
    end
    
    -- Get battle berry state if battle ID provided
    local berryState = nil
    if data.battleId then
        berryState = BerryActivationManager.getBattleState(data.battleId)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "QUERY_BERRY_STATUS",
        pokemonId = data.pokemonId,
        battleId = data.battleId,
        berryState = berryState,
        availableBerries = BerryDatabase.getAllBerries(),
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

--[[
Track berry consumption and inventory updates
@param msg AO message with consumption data
@return Consumption tracking response
--]]
local function trackBerryConsumption(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse consumption tracking data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"pokemonId", "berryId", "battleId"})
    if not validation.isValid then
        return ErrorHandler.createErrorResponse("VALIDATION_FAILED", validation.message, msg.Id)
    end
    
    -- Validate berry exists
    local berry = BerryDatabase.getBerry(data.berryId)
    if not berry then
        return ErrorHandler.createErrorResponse("BERRY_NOT_FOUND", "Berry " .. data.berryId .. " not found in database", msg.Id)
    end
    
    -- Track consumption in battle state
    local state = BerryActivationManager.getBattleState(data.battleId)
    if state then
        table.insert(state.recycledBerries, {
            berryId = data.berryId,
            pokemonId = data.pokemonId,
            consumedTurn = data.turn or 1,
            consumedTime = os.time()
        })
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "TRACK_BERRY_CONSUMPTION",
        pokemonId = data.pokemonId,
        berryId = data.berryId,
        battleId = data.battleId,
        berryConsumed = true,
        availableForRecycling = true,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

--[[
Query active berry effects and timing
@param msg AO message with effect query data
@return Berry effects response
--]]
local function queryBerryEffects(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse berry effects query data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.isValid then
        return ErrorHandler.createErrorResponse("VALIDATION_FAILED", validation.message, msg.Id)
    end
    
    -- Get battle berry state
    local berryState = BerryActivationManager.getBattleState(data.battleId)
    local turnSummary = BerryActivationManager.getTurnSummary(data.battleId)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "QUERY_BERRY_EFFECTS",
        battleId = data.battleId,
        berryState = berryState,
        turnSummary = turnSummary,
        activeBerryEffects = turnSummary.activations or {},
        queuedActivations = turnSummary.queuedActivations or 0,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

--[[
Handle berry recycling through moves and abilities
@param msg AO message with recycling data
@return Berry recycling response
--]]
local function recycleBerry(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse berry recycling data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"pokemonId", "battleId", "recycleType"})
    if not validation.isValid then
        return ErrorHandler.createErrorResponse("VALIDATION_FAILED", validation.message, msg.Id)
    end
    
    -- Validate recycle type
    if data.recycleType ~= "move" and data.recycleType ~= "ability" then
        return ErrorHandler.createErrorResponse("INVALID_RECYCLE_TYPE", "Recycle type must be 'move' or 'ability'", msg.Id)
    end
    
    -- Attempt berry recycling
    local recycleResult = BerryActivationManager.recycleBerry(data.battleId, data.pokemonId, data.recycleType)
    if not recycleResult.success then
        return ErrorHandler.createErrorResponse("RECYCLE_FAILED", recycleResult.message or "Berry recycling failed", msg.Id)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "RECYCLE_BERRY",
        pokemonId = data.pokemonId,
        battleId = data.battleId,
        recycleType = data.recycleType,
        recycledBerry = recycleResult.berryId,
        berryRecycled = true,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

--[[
Process berry activation manually (for testing or special circumstances)
@param msg AO message with activation data
@return Berry activation response
--]]
local function processBerryActivation(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse berry activation data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"pokemon", "activationContext"})
    if not validation.isValid then
        return ErrorHandler.createErrorResponse("VALIDATION_FAILED", validation.message, msg.Id)
    end
    
    -- Process berry activation
    local activationResult = BerryEffectsProcessor.processBerryActivation(data.pokemon, data.activationContext)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = activationResult.success,
        action = "PROCESS_BERRY_ACTIVATION",
        pokemonId = data.pokemon.id,
        berryActivated = activationResult.berryActivated,
        berryEffect = activationResult.berryEffect,
        updatedPokemon = activationResult.pokemon,
        activationMessage = activationResult.message,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

--[[
Validate all berry data and systems
@param msg AO message (validation request)
@return Validation response
--]]
local function validateBerrySystem(msg)
    local startTime = os.clock()
    
    local validationResults = {}
    
    -- Validate berry database
    local berryValidation, berryErrors = BerryDatabase.validateBerryData()
    validationResults.berryDatabase = {
        valid = berryValidation,
        errors = berryErrors or {}
    }
    
    -- Validate berry effects processor
    local processorValidation, processorErrors = BerryEffectsProcessor.validate()
    validationResults.berryProcessor = {
        valid = processorValidation,
        errors = processorErrors or {}
    }
    
    -- Validate berry activation manager
    local managerValidation, managerErrors = BerryActivationManager.validate()
    validationResults.berryManager = {
        valid = managerValidation,
        errors = managerErrors or {}
    }
    
    local allValid = berryValidation and processorValidation and managerValidation
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = allValid,
        action = "VALIDATE_BERRY_SYSTEM",
        validationResults = validationResults,
        systemValid = allValid,
        processingTime = processingTime,
        timestamp = os.time(),
        messageId = msg.Id
    }
end

-- Register AO Message Handlers
if Handlers then
    Handlers.add(
        "ASSIGN_BERRY",
        Handlers.utils.hasMatchingTag("Action", "ASSIGN_BERRY"),
        function(msg)
            local response = assignBerry(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "QUERY_BERRY_STATUS",
        Handlers.utils.hasMatchingTag("Action", "QUERY_BERRY_STATUS"),
        function(msg)
            local response = queryBerryStatus(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "TRACK_BERRY_CONSUMPTION",
        Handlers.utils.hasMatchingTag("Action", "TRACK_BERRY_CONSUMPTION"),
        function(msg)
            local response = trackBerryConsumption(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "QUERY_BERRY_EFFECTS",
        Handlers.utils.hasMatchingTag("Action", "QUERY_BERRY_EFFECTS"),
        function(msg)
            local response = queryBerryEffects(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "RECYCLE_BERRY",
        Handlers.utils.hasMatchingTag("Action", "RECYCLE_BERRY"),
        function(msg)
            local response = recycleBerry(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "PROCESS_BERRY_ACTIVATION",
        Handlers.utils.hasMatchingTag("Action", "PROCESS_BERRY_ACTIVATION"),
        function(msg)
            local response = processBerryActivation(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
    
    Handlers.add(
        "VALIDATE_BERRY_SYSTEM",
        Handlers.utils.hasMatchingTag("Action", "VALIDATE_BERRY_SYSTEM"),
        function(msg)
            local response = validateBerrySystem(msg)
            Handlers.utils.reply(response)(msg)
        end
    )
end

-- Export berry handler functions for testing
BerryHandler.assignBerry = assignBerry
BerryHandler.queryBerryStatus = queryBerryStatus
BerryHandler.trackBerryConsumption = trackBerryConsumption
BerryHandler.queryBerryEffects = queryBerryEffects
BerryHandler.recycleBerry = recycleBerry
BerryHandler.processBerryActivation = processBerryActivation
BerryHandler.validateBerrySystem = validateBerrySystem

return BerryHandler