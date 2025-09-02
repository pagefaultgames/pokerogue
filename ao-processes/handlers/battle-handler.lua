-- Battle Handler
-- Primary AO message handler for battle command processing and turn resolution
-- Integrates with turn processor and manages battle state persistence
-- Handles battle initialization, command processing, and battle flow management

-- JSON module (optional for testing environments)
local json = nil
local success, module = pcall(require, "json")
if success then
    json = module
else
    -- Fallback JSON implementation for testing
    json = {
        encode = function(obj)
            -- Simple JSON encoding fallback
            if type(obj) == "table" then
                return "{}"
            elseif type(obj) == "string" then
                return '"' .. obj .. '"'
            else
                return tostring(obj)
            end
        end,
        decode = function(str)
            -- Simple JSON decoding fallback
            return {}
        end
    }
end

-- Load dependencies
local TurnProcessor = require("game-logic.battle.turn-processor")
local BattleStateManager = require("game-logic.battle.battle-state-manager")
local PokemonSwitchSystem = require("game-logic.battle.pokemon-switch-system")
local ParticipationTracker = require("game-logic.battle.participation-tracker")
local ValidationHandler = require("handlers.validation-handler")
local ErrorHandler = require("handlers.error-handler")

-- Victory/Defeat system dependencies
local VictoryDefeatSystem = require("game-logic.battle.victory-defeat-system")
local ExperienceSystem = require("game-logic.progression.experience-system")
local RewardCalculator = require("game-logic.battle.reward-calculator")
local BattleStatistics = require("game-logic.battle.battle-statistics")
local BattleCleanup = require("game-logic.battle.battle-cleanup")

-- Status effect system dependencies
local StatusEffects = require("game-logic.pokemon.status-effects")
local StatusInteractions = require("game-logic.pokemon.status-interactions")
local StatusHealing = require("game-logic.pokemon.status-healing")
local StatusImmunities = require("game-logic.pokemon.status-immunities")

-- Weather system dependencies
local WeatherEffects = require("game-logic.battle.weather-effects")
local WeatherAbilities = require("game-logic.battle.weather-abilities")
local BattleConditions = require("game-logic.battle.battle-conditions")

-- Terrain system dependencies
local TerrainEffects = require("game-logic.battle.terrain-effects")
local TerrainAbilities = require("game-logic.battle.terrain-abilities")

-- Entry hazards system dependencies  
local EntryHazards = require("game-logic.battle.entry-hazards")
local SwitchInEffects = require("game-logic.battle.switch-in-effects")

-- Field conditions system dependencies
local FieldConditions = require("game-logic.battle.field-conditions")

-- Positional mechanics system dependencies
local PositionalMechanics = require("game-logic.battle.positional-mechanics")
local MoveTargeting = require("game-logic.battle.move-targeting")
local MoveEffects = require("game-logic.battle.move-effects")
local StatCalculator = require("game-logic.pokemon.stat-calculator")

-- Battle session storage (in-memory for this implementation)
local BattleSessions = {}

-- Handler registration (only in AO environment)
if Handlers then
Handlers.add(
    "INITIALIZE_BATTLE",
    Handlers.utils.hasMatchingTag("Action", "INITIALIZE_BATTLE"),
    function(msg)
        local response = initializeBattle(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "PROCESS_BATTLE_TURN",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_BATTLE_TURN"),
    function(msg)
        local response = processBattleTurn(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "ADD_BATTLE_COMMAND",
    Handlers.utils.hasMatchingTag("Action", "ADD_BATTLE_COMMAND"),
    function(msg)
        local response = addBattleCommand(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "GET_BATTLE_STATE",
    Handlers.utils.hasMatchingTag("Action", "GET_BATTLE_STATE"),
    function(msg)
        local response = getBattleState(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "FORFEIT_BATTLE",
    Handlers.utils.hasMatchingTag("Action", "FORFEIT_BATTLE"),
    function(msg)
        local response = forfeitBattle(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "CALCULATE_TURN_ORDER",
    Handlers.utils.hasMatchingTag("Action", "CALCULATE_TURN_ORDER"),
    function(msg)
        local response = calculateTurnOrder(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "EXECUTE_BATTLE_ACTION",
    Handlers.utils.hasMatchingTag("Action", "EXECUTE_BATTLE_ACTION"),
    function(msg)
        local response = executeBattleAction(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "HANDLE_BATTLE_INTERRUPTION",
    Handlers.utils.hasMatchingTag("Action", "HANDLE_BATTLE_INTERRUPTION"),
    function(msg)
        local response = handleBattleInterruption(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "UPDATE_BATTLE_STATE",
    Handlers.utils.hasMatchingTag("Action", "UPDATE_BATTLE_STATE"),
    function(msg)
        local response = updateBattleState(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "VALIDATE_BATTLE_COMMAND",
    Handlers.utils.hasMatchingTag("Action", "VALIDATE_BATTLE_COMMAND"),
    function(msg)
        local response = validateBattleCommand(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "CHECK_BATTLE_END_CONDITIONS",
    Handlers.utils.hasMatchingTag("Action", "CHECK_BATTLE_END_CONDITIONS"),
    function(msg)
        local response = checkBattleEndConditions(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "SWITCH_POKEMON",
    Handlers.utils.hasMatchingTag("Action", "SWITCH_POKEMON"),
    function(msg)
        local response = switchPokemon(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "COMPLETE_BATTLE",
    Handlers.utils.hasMatchingTag("Action", "COMPLETE_BATTLE"),
    function(msg)
        local response = completeBattle(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "PROCESS_BATTLE_VICTORY",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_BATTLE_VICTORY"),
    function(msg)
        local response = processBattleVictory(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "ESCAPE_BATTLE",
    Handlers.utils.hasMatchingTag("Action", "ESCAPE_BATTLE"),
    function(msg)
        local response = escapeBattle(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Status Effect Handlers
Handlers.add(
    "APPLY_STATUS_EFFECT",
    Handlers.utils.hasMatchingTag("Action", "APPLY_STATUS_EFFECT"),
    function(msg)
        local response = applyStatusEffect(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "HEAL_STATUS_EFFECT",
    Handlers.utils.hasMatchingTag("Action", "HEAL_STATUS_EFFECT"),
    function(msg)
        local response = healStatusEffect(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "CHECK_STATUS_IMMUNITY",
    Handlers.utils.hasMatchingTag("Action", "CHECK_STATUS_IMMUNITY"),
    function(msg)
        local response = checkStatusImmunity(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "PROCESS_END_OF_TURN_STATUS_EFFECTS",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_END_OF_TURN_STATUS_EFFECTS"),
    function(msg)
        local response = processEndOfTurnStatusEffects(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "GET_STATUS_INFO",
    Handlers.utils.hasMatchingTag("Action", "GET_STATUS_INFO"),
    function(msg)
        local response = getStatusInfo(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Weather Effect Handlers
Handlers.add(
    "SET_WEATHER",
    Handlers.utils.hasMatchingTag("Action", "SET_WEATHER"),
    function(msg)
        local response = setWeather(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "GET_WEATHER_INFO",
    Handlers.utils.hasMatchingTag("Action", "GET_WEATHER_INFO"),
    function(msg)
        local response = getWeatherInfo(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "PROCESS_WEATHER_EFFECTS",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_WEATHER_EFFECTS"),
    function(msg)
        local response = processWeatherEffects(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "CHECK_WEATHER_ABILITY_ACTIVATION",
    Handlers.utils.hasMatchingTag("Action", "CHECK_WEATHER_ABILITY_ACTIVATION"),
    function(msg)
        local response = checkWeatherAbilityActivation(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "MODIFY_MOVE_FOR_WEATHER",
    Handlers.utils.hasMatchingTag("Action", "MODIFY_MOVE_FOR_WEATHER"),
    function(msg)
        local response = modifyMoveForWeather(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "CLEAR_WEATHER",
    Handlers.utils.hasMatchingTag("Action", "CLEAR_WEATHER"),
    function(msg)
        local response = clearWeather(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Terrain Effect Handlers
Handlers.add(
    "SET_TERRAIN",
    Handlers.utils.hasMatchingTag("Action", "SET_TERRAIN"),
    function(msg)
        local response = setTerrain(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "GET_TERRAIN_INFO",
    Handlers.utils.hasMatchingTag("Action", "GET_TERRAIN_INFO"),
    function(msg)
        local response = getTerrainInfo(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "PROCESS_TERRAIN_EFFECTS",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_TERRAIN_EFFECTS"),
    function(msg)
        local response = processTerrainEffects(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "CHECK_TERRAIN_ABILITY_ACTIVATION",
    Handlers.utils.hasMatchingTag("Action", "CHECK_TERRAIN_ABILITY_ACTIVATION"),
    function(msg)
        local response = checkTerrainAbilityActivation(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "MODIFY_MOVE_FOR_TERRAIN",
    Handlers.utils.hasMatchingTag("Action", "MODIFY_MOVE_FOR_TERRAIN"),
    function(msg)
        local response = modifyMoveForTerrain(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "CLEAR_TERRAIN",
    Handlers.utils.hasMatchingTag("Action", "CLEAR_TERRAIN"),
    function(msg)
        local response = clearTerrain(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "PROCESS_COMBINED_ENVIRONMENTAL_EFFECTS",
    Handlers.utils.hasMatchingTag("Action", "PROCESS_COMBINED_ENVIRONMENTAL_EFFECTS"),
    function(msg)
        local response = processCombinedEnvironmentalEffects(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Positional Mechanics Handlers
Handlers.add(
    "GET_BATTLE_FORMAT_INFO",
    Handlers.utils.hasMatchingTag("Action", "GET_BATTLE_FORMAT_INFO"),
    function(msg)
        local response = getBattleFormatInfo(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "GET_POSITION_TARGETING_INFO",
    Handlers.utils.hasMatchingTag("Action", "GET_POSITION_TARGETING_INFO"),
    function(msg)
        local response = getPositionTargetingInfo(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "VALIDATE_MOVE_TARGETING",
    Handlers.utils.hasMatchingTag("Action", "VALIDATE_MOVE_TARGETING"),
    function(msg)
        local response = validateMoveTargeting(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "EXECUTE_POSITION_SWAP",
    Handlers.utils.hasMatchingTag("Action", "EXECUTE_POSITION_SWAP"),
    function(msg)
        local response = executePositionSwap(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "APPLY_POSITIONAL_TAG",
    Handlers.utils.hasMatchingTag("Action", "APPLY_POSITIONAL_TAG"),
    function(msg)
        local response = applyPositionalTag(msg)
        Handlers.utils.reply(response)(msg)
    end
)

Handlers.add(
    "GET_POSITIONAL_ABILITY_INFO",
    Handlers.utils.hasMatchingTag("Action", "GET_POSITIONAL_ABILITY_INFO"),
    function(msg)
        local response = getPositionalAbilityInfo(msg)
        Handlers.utils.reply(response)(msg)
    end
)

-- Initialize new battle session
-- @param msg: AO message with battle initialization data
-- @return: Battle initialization response
local function initializeBattle(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse battle initialization data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {
        "battleId", "battleSeed", "playerParty", "enemyParty"
    })
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Check if battle already exists
    if BattleSessions[data.battleId] then
        return ErrorHandler.createErrorResponse("BATTLE_EXISTS", "Battle session already exists", msg.Id)
    end
    
    -- Initialize battle state
    local battleState, error = TurnProcessor.initializeBattle(
        data.battleId,
        data.battleSeed,
        data.playerParty,
        data.enemyParty
    )
    
    if not battleState then
        return ErrorHandler.createErrorResponse("INITIALIZATION_FAILED", error or "Battle initialization failed", msg.Id)
    end
    
    -- Initialize field conditions for the battle
    if not battleState.fieldConditions then
        battleState.fieldConditions = {}
    end
    
    -- Initialize positional mechanics for the battle
    local activePlayerPokemon = {}
    local activeEnemyPokemon = {}
    
    -- Get active Pokemon for position initialization
    if battleState.playerParty then
        for i, pokemon in ipairs(battleState.playerParty) do
            if not pokemon.fainted and i <= 2 then -- Max 2 in doubles
                table.insert(activePlayerPokemon, pokemon)
            end
        end
    end
    
    if battleState.enemyParty then
        for i, pokemon in ipairs(battleState.enemyParty) do
            if not pokemon.fainted and i <= 2 then -- Max 2 in doubles
                table.insert(activeEnemyPokemon, pokemon)
            end
        end
    end
    
    -- Initialize battle positions
    local positionSuccess, positionMessage = PositionalMechanics.initializeBattlePositions(
        battleState, activePlayerPokemon, activeEnemyPokemon
    )
    
    if not positionSuccess then
        return ErrorHandler.createErrorResponse("POSITION_INIT_FAILED", positionMessage, msg.Id)
    end
    
    -- Initialize positional tags
    BattleConditions.initializePositionalTags(battleState)
    
    -- Apply initial positional ability effects
    for _, pokemon in ipairs(activePlayerPokemon) do
        StatCalculator.updatePositionalAbilityBattleData(pokemon, battleState)
    end
    for _, pokemon in ipairs(activeEnemyPokemon) do
        StatCalculator.updatePositionalAbilityBattleData(pokemon, battleState)
    end
    
    -- Store battle session
    BattleSessions[data.battleId] = {
        battleState = battleState,
        playerId = msg.From,
        createdAt = os.time(),
        lastActivity = os.time()
    }
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "INITIALIZE_BATTLE",
        battleId = data.battleId,
        message = "Battle initialized successfully",
        data = {
            battle_id = data.battleId,
            turn = battleState.turn,
            phase = battleState.phase,
            player_party_size = #battleState.playerParty,
            enemy_party_size = #battleState.enemyParty,
            battle_conditions = battleState.battleConditions,
            battle_format = PositionalMechanics.getBattleFormatInfo(battleState),
            active_positions = PositionalMechanics.getAllActivePositions(battleState)
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Process complete battle turn
-- @param msg: AO message with turn processing request
-- @return: Turn processing response
local function processBattleTurn(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse turn processing data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Update last activity
    session.lastActivity = os.time()
    
    -- Process battle turn
    local turnResult, error = TurnProcessor.processBattleTurn(session.battleState)
    if not turnResult then
        return ErrorHandler.createErrorResponse("TURN_PROCESSING_FAILED", error or "Turn processing failed", msg.Id)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "PROCESS_BATTLE_TURN",
        battleId = data.battleId,
        message = "Battle turn processed successfully",
        data = {
            turn_result = turnResult,
            battle_state = {
                turn = session.battleState.turn,
                phase = session.battleState.phase,
                battle_conditions = session.battleState.battleConditions,
                field_conditions = session.battleState.fieldConditions or {}
            }
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Add battle command to current turn
-- @param msg: AO message with battle command
-- @return: Command addition response
local function addBattleCommand(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse battle command data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "command"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Validate player access
    if session.playerId ~= msg.From then
        return ErrorHandler.createErrorResponse("UNAUTHORIZED", "Player not authorized for this battle", msg.Id)
    end
    
    -- Update last activity
    session.lastActivity = os.time()
    
    -- Add turn command
    local success, result = TurnProcessor.addTurnCommand(session.battleState, "player", data.command)
    if not success then
        return ErrorHandler.createErrorResponse("COMMAND_REJECTED", result or "Command rejected", msg.Id)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "ADD_BATTLE_COMMAND",
        battleId = data.battleId,
        message = "Battle command added successfully",
        data = {
            command_result = result,
            turn = session.battleState.turn,
            phase = session.battleState.phase
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Get current battle state
-- @param msg: AO message with battle state request
-- @return: Battle state response
local function getBattleState(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse battle state request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Update last activity
    session.lastActivity = os.time()
    
    -- Create battle state summary
    local battleStateSummary = {
        battle_id = session.battleState.battleId,
        turn = session.battleState.turn,
        phase = session.battleState.phase,
        battle_conditions = session.battleState.battleConditions,
        field_conditions = session.battleState.fieldConditions or {},
        player_party_summary = {},
        enemy_party_summary = {},
        turn_order_count = #session.battleState.turnOrder,
        pending_actions_count = #session.battleState.pendingActions,
        interruptions_count = #session.battleState.interruptQueue
    }
    
    -- Add Pokemon summaries (HP, status, etc.)
    for i, pokemon in ipairs(session.battleState.playerParty) do
        table.insert(battleStateSummary.player_party_summary, {
            index = i,
            pokemon_id = pokemon.id,
            name = pokemon.name or "Unknown",
            current_hp = pokemon.currentHP or 0,
            max_hp = pokemon.maxHP or pokemon.stats and pokemon.stats.hp or 100,
            status = pokemon.status,
            fainted = pokemon.fainted or false
        })
    end
    
    for i, pokemon in ipairs(session.battleState.enemyParty) do
        table.insert(battleStateSummary.enemy_party_summary, {
            index = i,
            pokemon_id = pokemon.id,
            name = pokemon.name or "Unknown",
            current_hp = pokemon.currentHP or 0,
            max_hp = pokemon.maxHP or pokemon.stats and pokemon.stats.hp or 100,
            status = pokemon.status,
            fainted = pokemon.fainted or false
        })
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "GET_BATTLE_STATE",
        battleId = data.battleId,
        message = "Battle state retrieved successfully",
        data = battleStateSummary,
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Forfeit current battle
-- @param msg: AO message with forfeit request
-- @return: Forfeit response
local function forfeitBattle(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse forfeit request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Validate player access
    if session.playerId ~= msg.From then
        return ErrorHandler.createErrorResponse("UNAUTHORIZED", "Player not authorized for this battle", msg.Id)
    end
    
    -- Set battle result to forfeit
    session.battleState.battleResult = {
        result = "forfeit",
        reason = "Player forfeited the battle",
        timestamp = os.time()
    }
    session.battleState.phase = TurnProcessor.TurnPhase.BATTLE_END
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "FORFEIT_BATTLE",
        battleId = data.battleId,
        message = "Battle forfeited successfully",
        data = {
            battle_result = session.battleState.battleResult,
            final_turn = session.battleState.turn
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Calculate turn order for queued commands
-- @param msg: AO message with turn order calculation request
-- @return: Turn order response
local function calculateTurnOrder(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse turn order request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Create turn actions from current commands
    local turnActions = TurnProcessor.createTurnActions(session.battleState)
    if not turnActions or #turnActions == 0 then
        return ErrorHandler.createErrorResponse("NO_ACTIONS", "No valid actions to calculate turn order", msg.Id)
    end
    
    -- Calculate turn order
    local PriorityCalculator = require("game-logic.battle.priority-calculator")
    local orderedActions = PriorityCalculator.calculateTurnOrder(turnActions, session.battleState.battleConditions)
    
    -- Create turn order summary
    local turnOrderSummary = {}
    for i, action in ipairs(orderedActions) do
        table.insert(turnOrderSummary, {
            order = i,
            action_type = action.type,
            pokemon_id = action.pokemonId,
            pokemon_name = action.pokemon and action.pokemon.name or "Unknown",
            move_id = action.moveId or nil,
            priority = action.priority or 0,
            effective_speed = action.effectiveSpeed or 0
        })
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "CALCULATE_TURN_ORDER",
        battleId = data.battleId,
        message = "Turn order calculated successfully",
        data = {
            turn = session.battleState.turn,
            turn_order = turnOrderSummary,
            total_actions = #orderedActions
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Execute individual battle action
-- @param msg: AO message with action execution request
-- @return: Action execution response
local function executeBattleAction(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse action execution request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "action"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Execute the action
    local actionResult = TurnProcessor.executeAction(session.battleState, data.action)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "EXECUTE_BATTLE_ACTION",
        battleId = data.battleId,
        message = "Battle action executed successfully",
        data = {
            action_result = actionResult,
            battle_phase = session.battleState.phase
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Handle battle interruption (fainting, forced switches)
-- @param msg: AO message with interruption handling request
-- @return: Interruption handling response
local function handleBattleInterruption(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse interruption request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Handle interruptions
    local interruptions = TurnProcessor.handleBattleInterruptions(session.battleState)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "HANDLE_BATTLE_INTERRUPTION",
        battleId = data.battleId,
        message = "Battle interruptions handled successfully",
        data = {
            interruptions = interruptions,
            interrupt_queue_size = #session.battleState.interruptQueue
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Update battle state with external changes
-- @param msg: AO message with state update request
-- @return: State update response
local function updateBattleState(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse state update request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "updates"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Apply updates to battle state
    local updatesApplied = 0
    for key, value in pairs(data.updates) do
        if session.battleState[key] ~= nil then
            session.battleState[key] = value
            updatesApplied = updatesApplied + 1
        end
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "UPDATE_BATTLE_STATE",
        battleId = data.battleId,
        message = "Battle state updated successfully",
        data = {
            updates_applied = updatesApplied,
            current_turn = session.battleState.turn,
            current_phase = session.battleState.phase
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Validate battle command before execution
-- @param msg: AO message with command validation request
-- @return: Command validation response
local function validateBattleCommand(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse command validation request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "command"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find Pokemon for command
    local pokemon = TurnProcessor.findPokemon(session.battleState, data.command.pokemonId, "player")
    if not pokemon then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found for command validation", msg.Id)
    end
    
    -- Validate command
    local validationResult = TurnProcessor.validateCommand(session.battleState, pokemon, data.command)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = validationResult.valid,
        action = "VALIDATE_BATTLE_COMMAND",
        battleId = data.battleId,
        message = validationResult.valid and "Command is valid" or "Command is invalid",
        data = {
            validation_result = validationResult,
            command_type = data.command.type,
            pokemon_id = data.command.pokemonId
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Check battle end conditions
-- @param msg: AO message with battle end check request
-- @return: Battle end check response
local function checkBattleEndConditions(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse battle end check request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Check battle end conditions
    local battleEnd = TurnProcessor.checkBattleEndConditions(session.battleState)
    local battleEnded = battleEnd ~= nil
    
    if battleEnded then
        session.battleState.battleResult = battleEnd
        session.battleState.phase = TurnProcessor.TurnPhase.BATTLE_END
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "CHECK_BATTLE_END_CONDITIONS",
        battleId = data.battleId,
        message = battleEnded and "Battle has ended" or "Battle continues",
        data = {
            battle_ended = battleEnded,
            battle_result = battleEnd,
            current_turn = session.battleState.turn,
            current_phase = session.battleState.phase
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Clean up expired battle sessions (utility function)
local function cleanupExpiredSessions()
    local currentTime = os.time()
    local expiredSessions = {}
    
    for battleId, session in pairs(BattleSessions) do
        -- Sessions expire after 1 hour of inactivity
        if currentTime - session.lastActivity > 3600 then
            table.insert(expiredSessions, battleId)
        end
    end
    
    for _, battleId in ipairs(expiredSessions) do
        BattleSessions[battleId] = nil
        print("Cleaned up expired battle session: " .. battleId)
    end
    
    return #expiredSessions
end

-- Execute Pokemon switch
-- @param msg: AO message with switch request
-- @return: Switch execution response
local function switchPokemon(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse switch request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {
        "battleId", "currentPokemonId", "targetPokemonId"
    })
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Validate player access
    if session.playerId ~= msg.From then
        return ErrorHandler.createErrorResponse("UNAUTHORIZED", "Player not authorized for this battle", msg.Id)
    end
    
    -- Update last activity
    session.lastActivity = os.time()
    
    -- Execute switch using comprehensive switch system
    local switchResult = PokemonSwitchSystem.executeSwitch(
        session.battleState,
        "player",
        data.currentPokemonId,
        data.targetPokemonId,
        data.position or 1,
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    if not switchResult.success then
        return ErrorHandler.createErrorResponse("SWITCH_FAILED", switchResult.message or "Switch execution failed", msg.Id)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "SWITCH_POKEMON",
        battleId = data.battleId,
        message = "Pokemon switched successfully",
        data = {
            switch_result = switchResult,
            battle_state = {
                turn = session.battleState.turn,
                phase = session.battleState.phase,
                active_player = session.battleState.activePlayer,
                active_enemy = session.battleState.activeEnemy
            }
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Complete battle with victory/defeat processing and rewards
-- @param msg: AO message with battle completion request
-- @return: Battle completion response with all rewards and statistics
local function completeBattle(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse battle completion request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Validate player access
    if session.playerId ~= msg.From then
        return ErrorHandler.createErrorResponse("UNAUTHORIZED", "Player not authorized for this battle", msg.Id)
    end
    
    -- Check for battle end conditions
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(session.battleState)
    
    if not battleResult then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_ENDED", "Battle has not ended yet", msg.Id)
    end
    
    -- Initialize systems with battle seed
    VictoryDefeatSystem.init(session.battleState.battleSeed)
    RewardCalculator.init(session.battleState.battleSeed)
    BattleStatistics.init()
    BattleCleanup.init()
    
    -- Process experience distribution
    local expDistribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
    
    -- Calculate battle rewards
    local rewardResults = RewardCalculator.calculateBattleRewards(session.battleState, battleResult)
    
    -- Update battle statistics
    local playerStatsUpdate = BattleStatistics.updatePlayerStatistics(
        session.playerId, 
        session.battleState, 
        battleResult, 
        rewardResults
    )
    
    local pokemonStatsUpdate = BattleStatistics.updateAllPokemonStatistics(
        session.battleState,
        battleResult,
        expDistribution
    )
    
    -- Execute battle cleanup
    local cleanupResults = BattleCleanup.executeBattleCleanup(
        session.battleState,
        battleResult,
        BattleCleanup.CleanupType.PRESERVE_STATS
    )
    
    -- Mark session as completed
    session.battleState.phase = TurnProcessor.TurnPhase.BATTLE_END
    session.battleState.battleResult = battleResult
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "COMPLETE_BATTLE",
        battleId = data.battleId,
        message = VictoryDefeatSystem.getBattleEndSummary(battleResult),
        data = {
            battle_result = battleResult,
            experience_distribution = expDistribution,
            reward_results = rewardResults,
            player_statistics = playerStatsUpdate,
            pokemon_statistics = pokemonStatsUpdate,
            cleanup_results = cleanupResults,
            reward_summary = RewardCalculator.getRewardSummary(rewardResults),
            cleanup_summary = BattleCleanup.getCleanupSummary(cleanupResults)
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Process battle victory with comprehensive reward and experience distribution
-- @param msg: AO message with victory processing request
-- @return: Victory processing response
local function processBattleVictory(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse victory processing request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Check victory condition
    local battleResult = VictoryDefeatSystem.checkBattleEndConditions(session.battleState)
    
    if not battleResult or battleResult.result ~= VictoryDefeatSystem.BattleResult.VICTORY then
        return ErrorHandler.createErrorResponse("NOT_VICTORY", "Battle is not in victory state", msg.Id)
    end
    
    -- Initialize systems
    RewardCalculator.init(session.battleState.battleSeed)
    
    -- Calculate rewards specifically for victory
    local rewardResults = RewardCalculator.calculateBattleRewards(session.battleState, battleResult)
    
    -- Distribute experience to participating Pokemon
    local expDistribution = ExperienceSystem.distributeBattleExperience(session.battleState, battleResult)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "PROCESS_BATTLE_VICTORY",
        battleId = data.battleId,
        message = "Victory! " .. RewardCalculator.getRewardSummary(rewardResults),
        data = {
            victory_confirmed = true,
            battle_result = battleResult,
            rewards = rewardResults,
            experience = expDistribution,
            participating_pokemon = expDistribution.totalDistributions or 0
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Process escape attempt from battle
-- @param msg: AO message with escape attempt request
-- @return: Escape attempt response
local function escapeBattle(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse escape request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Validate player access
    if session.playerId ~= msg.From then
        return ErrorHandler.createErrorResponse("UNAUTHORIZED", "Player not authorized for this battle", msg.Id)
    end
    
    -- Find active player Pokemon
    local playerPokemon = nil
    local enemyPokemon = nil
    
    for _, pokemon in ipairs(session.battleState.playerParty) do
        if not pokemon.fainted then
            playerPokemon = pokemon
            break
        end
    end
    
    for _, pokemon in ipairs(session.battleState.enemyParty) do
        if not pokemon.fainted then
            enemyPokemon = pokemon
            break
        end
    end
    
    if not playerPokemon then
        return ErrorHandler.createErrorResponse("NO_ACTIVE_POKEMON", "No active Pokemon available for escape", msg.Id)
    end
    
    -- Initialize victory/defeat system with battle seed
    VictoryDefeatSystem.init(session.battleState.battleSeed)
    
    -- Process escape attempt
    local escapeResult = VictoryDefeatSystem.processEscape(
        session.battleState,
        playerPokemon,
        enemyPokemon
    )
    
    local processingTime = (os.clock() - startTime) * 1000
    
    if escapeResult.success then
        -- Mark battle as ended by escape
        session.battleState.battleResult = escapeResult.battleResult
        session.battleState.phase = TurnProcessor.TurnPhase.BATTLE_END
        
        -- Give minimal experience for participation (escape scenario)
        local expDistribution = ExperienceSystem.distributeBattleExperience(session.battleState, escapeResult.battleResult)
        
        return {
            success = true,
            action = "ESCAPE_BATTLE",
            battleId = data.battleId,
            message = escapeResult.message,
            data = {
                escape_succeeded = true,
                escape_chance = escapeResult.escapeChance,
                escape_roll = escapeResult.escapeRoll,
                battle_result = escapeResult.battleResult,
                experience_gained = expDistribution.totalDistributions or 0
            },
            timestamp = os.time(),
            processing_time_ms = processingTime,
            message_id = msg.Id
        }
    else
        return {
            success = false,
            action = "ESCAPE_BATTLE",
            battleId = data.battleId,
            message = escapeResult.message,
            data = {
                escape_succeeded = false,
                escape_chance = escapeResult.escapeChance,
                escape_roll = escapeResult.escapeRoll,
                battle_continues = true
            },
            timestamp = os.time(),
            processing_time_ms = processingTime,
            message_id = msg.Id
        }
    end
end

-- Get battle handler statistics
local function getBattleHandlerStats()
    local stats = {
        active_sessions = 0,
        total_sessions = 0,
        sessions_by_phase = {
            [TurnProcessor.TurnPhase.COMMAND_SELECTION] = 0,
            [TurnProcessor.TurnPhase.ACTION_EXECUTION] = 0,
            [TurnProcessor.TurnPhase.END_OF_TURN] = 0,
            [TurnProcessor.TurnPhase.BATTLE_END] = 0
        }
    }
    
    for battleId, session in pairs(BattleSessions) do
        stats.total_sessions = stats.total_sessions + 1
        
        if session.battleState.phase ~= TurnProcessor.TurnPhase.BATTLE_END then
            stats.active_sessions = stats.active_sessions + 1
        end
        
        local phase = session.battleState.phase
        if stats.sessions_by_phase[phase] then
            stats.sessions_by_phase[phase] = stats.sessions_by_phase[phase] + 1
        end
    end
    
    return stats
end

-- Apply status effect to Pokemon
-- @param msg: AO message with status application request
-- @return: Status application response
local function applyStatusEffect(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse status application request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {
        "battleId", "pokemonId", "statusType"
    })
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find target Pokemon
    local pokemon = TurnProcessor.findPokemon(session.battleState, data.pokemonId, data.playerId)
    if not pokemon then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    -- Check status immunity
    local immunityCheck = StatusImmunities.checkStatusImmunity(pokemon, data.statusType, session.battleState)
    if immunityCheck.immune then
        return {
            success = false,
            action = "APPLY_STATUS_EFFECT",
            battleId = data.battleId,
            message = "Status effect blocked by immunity",
            data = {
                pokemon_id = data.pokemonId,
                attempted_status = data.statusType,
                immunity_type = immunityCheck.immunityType,
                immunity_source = immunityCheck.immunitySource,
                immunity_message = immunityCheck.message
            },
            timestamp = os.time(),
            processing_time_ms = (os.clock() - startTime) * 1000,
            message_id = msg.Id
        }
    end
    
    -- Validate status interactions
    local interactionValidation = StatusInteractions.validateStatusApplication(pokemon, data.statusType, data.forceReplace)
    if not interactionValidation.valid then
        return {
            success = false,
            action = "APPLY_STATUS_EFFECT",
            battleId = data.battleId,
            message = "Status application blocked by interaction rules",
            data = {
                pokemon_id = data.pokemonId,
                attempted_status = data.statusType,
                current_status = pokemon.statusEffect,
                interaction_error = interactionValidation.error
            },
            timestamp = os.time(),
            processing_time_ms = (os.clock() - startTime) * 1000,
            message_id = msg.Id
        }
    end
    
    -- Apply status effect
    local applicationResult = StatusEffects.applyStatusEffect(pokemon, data.statusType, data.duration, session.battleState)
    
    -- Check for auto-healing berries
    local autoHealResult = nil
    if applicationResult.success then
        autoHealResult = StatusHealing.executeAutoBerryHealing(pokemon, data.statusType)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = applicationResult.success,
        action = "APPLY_STATUS_EFFECT",
        battleId = data.battleId,
        message = applicationResult.success and "Status effect applied successfully" or "Status application failed",
        data = {
            pokemon_id = data.pokemonId,
            status_applied = data.statusType,
            application_result = applicationResult,
            auto_heal_result = autoHealResult,
            interaction_result = interactionValidation
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Heal status effect from Pokemon
-- @param msg: AO message with status healing request
-- @return: Status healing response
local function healStatusEffect(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse status healing request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {
        "battleId", "pokemonId", "healingMethod"
    })
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find target Pokemon
    local pokemon = TurnProcessor.findPokemon(session.battleState, data.pokemonId, data.playerId)
    if not pokemon then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    local healingResult = nil
    
    -- Execute healing based on method
    if data.healingMethod == StatusHealing.HealingMethod.MOVE then
        if not data.moveId then
            return ErrorHandler.createErrorResponse("MISSING_PARAMETER", "Move ID required for move-based healing", msg.Id)
        end
        healingResult = StatusHealing.executeMoveBased(session.battleState, pokemon, data.moveId, data.targetPokemon)
        
    elseif data.healingMethod == StatusHealing.HealingMethod.ITEM then
        if not data.itemId then
            return ErrorHandler.createErrorResponse("MISSING_PARAMETER", "Item ID required for item-based healing", msg.Id)
        end
        healingResult = StatusHealing.executeItemBased(session.battleState, pokemon, data.itemId, data.targetPokemon, data.inventory)
        
    elseif data.healingMethod == StatusHealing.HealingMethod.ABILITY then
        if not data.abilityId or not data.trigger then
            return ErrorHandler.createErrorResponse("MISSING_PARAMETER", "Ability ID and trigger required for ability-based healing", msg.Id)
        end
        healingResult = StatusHealing.executeAbilityBased(session.battleState, pokemon, data.abilityId, data.trigger, data.statusBeingApplied)
        
    else
        return ErrorHandler.createErrorResponse("INVALID_METHOD", "Unknown healing method", msg.Id)
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = healingResult.success,
        action = "HEAL_STATUS_EFFECT", 
        battleId = data.battleId,
        message = healingResult.success and "Status healing executed successfully" or "Status healing failed",
        data = {
            pokemon_id = data.pokemonId,
            healing_method = data.healingMethod,
            healing_result = healingResult
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Check status immunity for Pokemon
-- @param msg: AO message with immunity check request
-- @return: Immunity check response
local function checkStatusImmunity(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse immunity check request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {
        "battleId", "pokemonId", "statusType"
    })
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find target Pokemon
    local pokemon = TurnProcessor.findPokemon(session.battleState, data.pokemonId, data.playerId)
    if not pokemon then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    -- Check immunity
    local immunityCheck = StatusImmunities.checkStatusImmunity(pokemon, data.statusType, session.battleState)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "CHECK_STATUS_IMMUNITY",
        battleId = data.battleId,
        message = immunityCheck.immune and "Pokemon is immune to status effect" or "Pokemon is not immune to status effect",
        data = {
            pokemon_id = data.pokemonId,
            status_type = data.statusType,
            immune = immunityCheck.immune,
            immunity_check = immunityCheck
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Process end-of-turn status effects for all Pokemon in battle
-- @param msg: AO message with end-of-turn processing request
-- @return: End-of-turn status processing response
local function processEndOfTurnStatusEffects(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse end-of-turn processing request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    local result = {
        playerPartyEffects = {},
        enemyPartyEffects = {},
        totalDamage = 0,
        statusChanges = {}
    }
    
    -- Process status effects for player party
    for i, pokemon in ipairs(session.battleState.playerParty) do
        if pokemon.currentHP > 0 then
            local statusResult = StatusEffects.processEndOfTurnEffects(pokemon, session.battleState)
            if statusResult and (#statusResult.effects > 0 or #statusResult.messages > 0) then
                result.playerPartyEffects[pokemon.id] = statusResult
                result.totalDamage = result.totalDamage + (statusResult.damageDealt or 0)
                if statusResult.statusChanged then
                    table.insert(result.statusChanges, {
                        pokemon_id = pokemon.id,
                        party = "player",
                        change = "status_cleared"
                    })
                end
            end
        end
    end
    
    -- Process status effects for enemy party
    for i, pokemon in ipairs(session.battleState.enemyParty) do
        if pokemon.currentHP > 0 then
            local statusResult = StatusEffects.processEndOfTurnEffects(pokemon, session.battleState)
            if statusResult and (#statusResult.effects > 0 or #statusResult.messages > 0) then
                result.enemyPartyEffects[pokemon.id] = statusResult
                result.totalDamage = result.totalDamage + (statusResult.damageDealt or 0)
                if statusResult.statusChanged then
                    table.insert(result.statusChanges, {
                        pokemon_id = pokemon.id,
                        party = "enemy",
                        change = "status_cleared"
                    })
                end
            end
        end
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "PROCESS_END_OF_TURN_STATUS_EFFECTS",
        battleId = data.battleId,
        message = "End-of-turn status effects processed successfully",
        data = result,
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Get comprehensive status information for Pokemon
-- @param msg: AO message with status info request
-- @return: Status information response
local function getStatusInfo(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse status info request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "pokemonId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find target Pokemon
    local pokemon = TurnProcessor.findPokemon(session.battleState, data.pokemonId, data.playerId)
    if not pokemon then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    -- Gather comprehensive status information
    local statusInfo = {
        currentStatus = StatusEffects.getStatusEffectInfo(pokemon),
        immunities = StatusImmunities.getPokemonImmunityInfo(pokemon, session.battleState),
        healingOptions = StatusHealing.getHealingOptions(pokemon, session.battleState, data.inventory)
    }
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "GET_STATUS_INFO",
        battleId = data.battleId,
        message = "Status information retrieved successfully",
        data = {
            pokemon_id = data.pokemonId,
            status_info = statusInfo
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Weather Handler Implementations

-- Set weather for a battle
-- @param msg: AO message with weather setting data
-- @return: Weather setting response
local function setWeather(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse weather setting data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "weatherType"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Set weather
    local weatherSuccess, weatherResult = WeatherEffects.setWeather(
        data.battleId,
        data.weatherType,
        data.duration,
        data.source or "manual",
        data.sourceAbility
    )
    
    if not weatherSuccess then
        return ErrorHandler.createErrorResponse("WEATHER_SET_FAILED", weatherResult or "Failed to set weather", msg.Id)
    end
    
    -- Update battle state weather
    session.battleState.weather = {
        type = weatherResult.weather_type,
        duration = weatherResult.duration,
        source = weatherResult.source
    }
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "SET_WEATHER",
        battleId = data.battleId,
        message = "Weather set successfully",
        data = {
            weather_result = weatherResult
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Get current weather information for a battle
-- @param msg: AO message with weather info request
-- @return: Weather information response
local function getWeatherInfo(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse weather info request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Get all active Pokemon for weather effect analysis
    local allPokemon = {}
    if session.battleState.playerParty then
        for _, pokemon in ipairs(session.battleState.playerParty) do
            if pokemon and pokemon.currentHP > 0 then
                table.insert(allPokemon, pokemon)
            end
        end
    end
    if session.battleState.enemyParty then
        for _, pokemon in ipairs(session.battleState.enemyParty) do
            if pokemon and pokemon.currentHP > 0 then
                table.insert(allPokemon, pokemon)
            end
        end
    end
    
    -- Get comprehensive weather information
    local currentWeather = session.battleState.weather and session.battleState.weather.type or BattleConditions.WeatherType.NONE
    local weatherSummary = WeatherEffects.getWeatherEffectsSummary(currentWeather, allPokemon)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "GET_WEATHER_INFO",
        battleId = data.battleId,
        message = "Weather information retrieved successfully",
        data = {
            weather_summary = weatherSummary
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Process end-of-turn weather effects for a battle
-- @param msg: AO message with weather processing request
-- @return: Weather effects processing response
local function processWeatherEffects(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse weather effects request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Process weather effects
    local weatherResults = WeatherEffects.processEndOfTurnWeatherEffects(data.battleId, session.battleState)
    
    -- Apply damage and healing results to Pokemon
    for _, damageResult in ipairs(weatherResults.damage_results) do
        local pokemon = TurnProcessor.findPokemon(session.battleState, damageResult.pokemon_id)
        if pokemon then
            pokemon.currentHP = math.max(0, pokemon.currentHP - damageResult.damage)
        end
    end
    
    for _, healingResult in ipairs(weatherResults.healing_results) do
        local pokemon = TurnProcessor.findPokemon(session.battleState, healingResult.pokemon_id)
        if pokemon then
            local maxHP = pokemon.maxHP or pokemon.stats[1] or 100
            pokemon.currentHP = math.min(maxHP, pokemon.currentHP + healingResult.healing)
        end
    end
    
    -- Update weather duration
    if session.battleState.weather then
        local updatedWeather, expired = WeatherEffects.updateWeatherDuration(session.battleState.weather)
        session.battleState.weather = updatedWeather
        weatherResults.weather_expired = expired
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "PROCESS_WEATHER_EFFECTS",
        battleId = data.battleId,
        message = "Weather effects processed successfully",
        data = {
            weather_results = weatherResults
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Check for weather ability activation
-- @param msg: AO message with weather ability check request
-- @return: Weather ability activation response
local function checkWeatherAbilityActivation(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse weather ability request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "pokemonId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find target Pokemon
    local pokemon = TurnProcessor.findPokemon(session.battleState, data.pokemonId)
    if not pokemon then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    -- Check for weather-setting ability activation
    local weatherChange = WeatherAbilities.activateWeatherSettingAbility(pokemon, data.battleId)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "CHECK_WEATHER_ABILITY_ACTIVATION",
        battleId = data.battleId,
        message = "Weather ability activation checked",
        data = {
            pokemon_id = data.pokemonId,
            weather_change = weatherChange
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Modify move data based on current weather
-- @param msg: AO message with move modification request
-- @return: Move modification response
local function modifyMoveForWeather(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse move modification request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "moveData"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Get current weather
    local currentWeather = session.battleState.weather and session.battleState.weather.type or BattleConditions.WeatherType.NONE
    
    -- Modify move for weather
    local modifiedMove = WeatherEffects.processWeatherMoveInteractions(data.moveData, currentWeather)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "MODIFY_MOVE_FOR_WEATHER",
        battleId = data.battleId,
        message = "Move modified for weather successfully",
        data = {
            original_move = data.moveData,
            modified_move = modifiedMove
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Clear weather from a battle
-- @param msg: AO message with weather clearing request
-- @return: Weather clearing response
local function clearWeather(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse weather clearing request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Clear weather
    local currentWeather = session.battleState.weather
    local clearedWeather, cleared = WeatherEffects.removeWeatherEffects(
        data.battleId,
        currentWeather,
        data.source or "manual"
    )
    
    if cleared then
        session.battleState.weather = clearedWeather
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "CLEAR_WEATHER",
        battleId = data.battleId,
        message = cleared and "Weather cleared successfully" or "Weather was not cleared",
        data = {
            weather_cleared = cleared,
            new_weather = clearedWeather
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Set terrain in a battle
-- @param msg: AO message with terrain setting data
-- @return: Terrain setting response
local function setTerrain(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse terrain setting data", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "terrainType"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Initialize terrain state if not exists
    if not session.battleState.terrain then
        session.battleState.terrain = TerrainEffects.initializeTerrainState(data.battleId)
    end
    
    -- Set terrain
    local updatedTerrain, success, message = TerrainEffects.setTerrain(
        session.battleState.terrain,
        data.terrainType,
        data.duration,
        data.source or "move"
    )
    
    if success then
        session.battleState.terrain = updatedTerrain
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = success,
        action = "SET_TERRAIN",
        battleId = data.battleId,
        message = message,
        data = {
            terrain_state = updatedTerrain,
            terrain_info = TerrainEffects.getTerrainInfo(updatedTerrain)
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Get terrain information
-- @param msg: AO message with terrain info request
-- @return: Terrain information response
local function getTerrainInfo(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse terrain info request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Get terrain info
    local terrainInfo = session.battleState.terrain and 
                       TerrainEffects.getTerrainInfo(session.battleState.terrain) or 
                       TerrainEffects.getTerrainInfo(nil)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "GET_TERRAIN_INFO",
        battleId = data.battleId,
        message = "Terrain information retrieved",
        data = {
            terrain_info = terrainInfo
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Process terrain effects at end of turn
-- @param msg: AO message with terrain effects processing request
-- @return: Terrain effects processing response
local function processTerrainEffects(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse terrain effects request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Get all Pokemon for terrain effects processing
    local allPokemon = {}
    if session.battleState.playerParty then
        for _, pokemon in ipairs(session.battleState.playerParty) do
            table.insert(allPokemon, pokemon)
        end
    end
    if session.battleState.enemyParty then
        for _, pokemon in ipairs(session.battleState.enemyParty) do
            table.insert(allPokemon, pokemon)
        end
    end
    
    -- Process terrain healing effects
    local terrainResults = {}
    if session.battleState.terrain then
        terrainResults = TerrainEffects.processTerrainHealing(session.battleState.terrain, allPokemon)
        
        -- Apply healing results to Pokemon
        for _, healingResult in ipairs(terrainResults) do
            local pokemon = TurnProcessor.findPokemon(session.battleState, healingResult.pokemon_id)
            if pokemon then
                pokemon.currentHP = healingResult.new_hp
            end
        end
        
        -- Update terrain duration
        local updatedTerrain, expired = TerrainEffects.updateTerrainDuration(session.battleState.terrain)
        session.battleState.terrain = updatedTerrain
        terrainResults.terrain_expired = expired
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "PROCESS_TERRAIN_EFFECTS",
        battleId = data.battleId,
        message = "Terrain effects processed successfully",
        data = {
            terrain_results = terrainResults
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Check for terrain ability activation
-- @param msg: AO message with terrain ability check request
-- @return: Terrain ability activation response
local function checkTerrainAbilityActivation(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse terrain ability request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "pokemonId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find target Pokemon
    local pokemon = TurnProcessor.findPokemon(session.battleState, data.pokemonId)
    if not pokemon then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    -- Initialize terrain state if not exists
    if not session.battleState.terrain then
        session.battleState.terrain = TerrainEffects.initializeTerrainState(data.battleId)
    end
    
    -- Check for terrain-setting ability activation
    local updatedTerrain, activationMessage = TerrainAbilities.processTerrainSurgeAbility(pokemon, session.battleState.terrain)
    if activationMessage then
        session.battleState.terrain = updatedTerrain
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "CHECK_TERRAIN_ABILITY_ACTIVATION",
        battleId = data.battleId,
        message = "Terrain ability activation checked",
        data = {
            pokemon_id = data.pokemonId,
            activation_message = activationMessage,
            terrain_change = activationMessage ~= nil
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Modify move data based on current terrain
-- @param msg: AO message with move modification request
-- @return: Move modification response
local function modifyMoveForTerrain(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse move modification request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "moveData", "attackerPokemonId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find attacker Pokemon
    local attacker = TurnProcessor.findPokemon(session.battleState, data.attackerPokemonId)
    if not attacker then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Attacker Pokemon not found", msg.Id)
    end
    
    -- Get terrain power modifier
    local terrainModifier = 1.0
    local moveBlocked = false
    local blockReason = nil
    
    if session.battleState.terrain then
        local attackerGrounded = TerrainEffects.isPokemonGrounded(attacker)
        terrainModifier = TerrainEffects.getTerrainMovePowerModifier(data.moveData, session.battleState.terrain, attackerGrounded)
        
        -- Check if terrain blocks the move (for priority moves in Psychic Terrain)
        if data.targetPokemonId then
            local target = TurnProcessor.findPokemon(session.battleState, data.targetPokemonId)
            if target then
                local targetGrounded = TerrainEffects.isPokemonGrounded(target)
                moveBlocked, blockReason = TerrainEffects.doesTerrainBlockMove(data.moveData, session.battleState.terrain, targetGrounded)
            end
        end
    end
    
    -- Create modified move data
    local modifiedMove = {}
    for k, v in pairs(data.moveData) do
        modifiedMove[k] = v
    end
    
    if not moveBlocked then
        modifiedMove.power = (data.moveData.power or 0) * terrainModifier
        modifiedMove.terrain_modifier = terrainModifier
    else
        modifiedMove.blocked = true
        modifiedMove.block_reason = blockReason
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "MODIFY_MOVE_FOR_TERRAIN",
        battleId = data.battleId,
        message = moveBlocked and ("Move blocked: " .. blockReason) or "Move modified for terrain successfully",
        data = {
            original_move = data.moveData,
            modified_move = modifiedMove,
            terrain_modifier = terrainModifier,
            move_blocked = moveBlocked
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Clear terrain from a battle
-- @param msg: AO message with terrain clearing request
-- @return: Terrain clearing response
local function clearTerrain(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse terrain clearing request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Clear terrain
    local currentTerrain = session.battleState.terrain
    local clearedTerrain, cleared = TerrainEffects.setTerrain(
        currentTerrain,
        TerrainEffects.TerrainType.NONE,
        0,
        data.source or "manual"
    )
    
    if cleared then
        session.battleState.terrain = clearedTerrain
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "CLEAR_TERRAIN",
        battleId = data.battleId,
        message = "Terrain cleared successfully",
        data = {
            terrain_cleared = true,
            new_terrain = clearedTerrain
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Process combined environmental effects (weather + terrain + status)
-- @param msg: AO message with combined effects request
-- @return: Combined effects processing response
local function processCombinedEnvironmentalEffects(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse combined effects request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Get all Pokemon for effects processing
    local allPokemon = {}
    if session.battleState.playerParty then
        for _, pokemon in ipairs(session.battleState.playerParty) do
            table.insert(allPokemon, pokemon)
        end
    end
    if session.battleState.enemyParty then
        for _, pokemon in ipairs(session.battleState.enemyParty) do
            table.insert(allPokemon, pokemon)
        end
    end
    
    -- Get current weather and terrain types
    local currentWeather = session.battleState.weather and session.battleState.weather.type or BattleConditions.WeatherType.NONE
    local currentTerrain = session.battleState.terrain and session.battleState.terrain.current_terrain or TerrainEffects.TerrainType.NONE
    
    -- Process combined environmental effects
    local combinedResults = BattleConditions.processCombinedEnvironmentalEffects(
        data.battleId,
        currentWeather,
        currentTerrain,
        allPokemon
    )
    
    -- Apply net effects to Pokemon
    for _, effect in ipairs(combinedResults.combined_effects) do
        local pokemon = TurnProcessor.findPokemon(session.battleState, effect.pokemon_id)
        if pokemon then
            if effect.effect_type == "heal" then
                local maxHP = pokemon.maxHP or pokemon.stats[1] or 100
                pokemon.currentHP = math.min(maxHP, pokemon.currentHP + effect.final_amount)
            elseif effect.effect_type == "damage" then
                pokemon.currentHP = math.max(0, pokemon.currentHP - effect.final_amount)
            end
        end
    end
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "PROCESS_COMBINED_ENVIRONMENTAL_EFFECTS",
        battleId = data.battleId,
        message = "Combined environmental effects processed successfully",
        data = {
            combined_results = combinedResults
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Positional Mechanics Handler Functions

-- Get battle format information
-- @param msg: AO message with format info request
-- @return: Battle format information response
local function getBattleFormatInfo(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse format info request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    local formatInfo = PositionalMechanics.getBattleFormatInfo(session.battleState)
    local activePositions = PositionalMechanics.getAllActivePositions(session.battleState)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "GET_BATTLE_FORMAT_INFO",
        battleId = data.battleId,
        message = "Battle format information retrieved successfully",
        data = {
            format_info = formatInfo,
            active_positions = activePositions
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Get position targeting information
-- @param msg: AO message with targeting info request
-- @return: Position targeting information response
local function getPositionTargetingInfo(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse targeting info request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "pokemonId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find attacker Pokemon
    local attacker = TurnProcessor.findPokemon(session.battleState, data.pokemonId)
    if not attacker then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    local targetingInfo = MoveTargeting.getPositionTargetingInfo(session.battleState, attacker)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "GET_POSITION_TARGETING_INFO",
        battleId = data.battleId,
        message = "Position targeting information retrieved successfully",
        data = {
            targeting_info = targetingInfo,
            attacker_id = data.pokemonId
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Validate move targeting for positional moves
-- @param msg: AO message with targeting validation request
-- @return: Move targeting validation response
local function validateMoveTargeting(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse targeting validation request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "pokemonId", "moveData"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find attacker Pokemon
    local attacker = TurnProcessor.findPokemon(session.battleState, data.pokemonId)
    if not attacker then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    -- Find target Pokemon if specified
    local targetPokemon = nil
    if data.targetPokemonId then
        targetPokemon = TurnProcessor.findPokemon(session.battleState, data.targetPokemonId)
    end
    
    -- Validate targeting
    local validationResult, message = MoveTargeting.validateMoveTargeting(
        session.battleState, attacker, data.moveData, targetPokemon, data.targetPosition
    )
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = validationResult == MoveTargeting.ValidationResult.VALID,
        action = "VALIDATE_MOVE_TARGETING",
        battleId = data.battleId,
        message = message,
        data = {
            validation_result = validationResult,
            is_valid = validationResult == MoveTargeting.ValidationResult.VALID,
            attacker_id = data.pokemonId,
            target_id = data.targetPokemonId,
            move_data = data.moveData
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Execute position swap (Ally Switch)
-- @param msg: AO message with position swap request
-- @return: Position swap execution response
local function executePositionSwap(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse position swap request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "pokemonId", "moveData"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find user Pokemon
    local user = TurnProcessor.findPokemon(session.battleState, data.pokemonId)
    if not user then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    -- Execute position swap
    local swapResult = MoveEffects.executeAllySwitch(session.battleState, user, data.moveData)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = swapResult.success,
        action = "EXECUTE_POSITION_SWAP",
        battleId = data.battleId,
        message = swapResult.message,
        data = {
            swap_result = swapResult,
            active_positions = PositionalMechanics.getAllActivePositions(session.battleState)
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Apply positional tag to battlefield position
-- @param msg: AO message with positional tag application request
-- @return: Positional tag application response
local function applyPositionalTag(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse positional tag request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "side", "position", "tagType"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Apply positional tag
    local tagSuccess, tagMessage = BattleConditions.applyPositionalTag(
        session.battleState, data.side, data.position, data.tagType, 
        data.duration, data.effectData
    )
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = tagSuccess,
        action = "APPLY_POSITIONAL_TAG",
        battleId = data.battleId,
        message = tagMessage,
        data = {
            tag_applied = tagSuccess,
            side = data.side,
            position = data.position,
            tag_type = data.tagType,
            positional_tags_summary = BattleConditions.getPositionalTagsSummary(session.battleState)
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Get positional ability information
-- @param msg: AO message with positional ability info request
-- @return: Positional ability information response
local function getPositionalAbilityInfo(msg)
    local startTime = os.clock()
    
    -- Parse message data
    local success, data = pcall(json.decode, msg.Data or "{}")
    if not success then
        return ErrorHandler.createErrorResponse("INVALID_JSON", "Failed to parse positional ability info request", msg.Id)
    end
    
    -- Validate required parameters
    local validation = ValidationHandler.validateRequired(data, {"battleId", "pokemonId"})
    if not validation.valid then
        return ErrorHandler.createErrorResponse("VALIDATION_ERROR", validation.error, msg.Id)
    end
    
    -- Get battle session
    local session = BattleSessions[data.battleId]
    if not session then
        return ErrorHandler.createErrorResponse("BATTLE_NOT_FOUND", "Battle session not found", msg.Id)
    end
    
    -- Find Pokemon
    local pokemon = TurnProcessor.findPokemon(session.battleState, data.pokemonId)
    if not pokemon then
        return ErrorHandler.createErrorResponse("POKEMON_NOT_FOUND", "Pokemon not found", msg.Id)
    end
    
    -- Get positional ability info
    local abilityInfo = StatCalculator.getPositionalAbilityInfo(pokemon, session.battleState)
    
    local processingTime = (os.clock() - startTime) * 1000
    
    return {
        success = true,
        action = "GET_POSITIONAL_ABILITY_INFO",
        battleId = data.battleId,
        message = "Positional ability information retrieved successfully",
        data = {
            pokemon_id = data.pokemonId,
            ability_info = abilityInfo
        },
        timestamp = os.time(),
        processing_time_ms = processingTime,
        message_id = msg.Id
    }
end

-- Close conditional handler registration
end