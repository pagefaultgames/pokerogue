-- Battle Handler
-- Primary AO message handler for battle command processing and turn resolution
-- Integrates with turn processor and manages battle state persistence
-- Handles battle initialization, command processing, and battle flow management

local json = require("json")

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

-- Battle session storage (in-memory for this implementation)
local BattleSessions = {}

-- Handler registration
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
            battle_conditions = battleState.battleConditions
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
                battle_conditions = session.battleState.battleConditions
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