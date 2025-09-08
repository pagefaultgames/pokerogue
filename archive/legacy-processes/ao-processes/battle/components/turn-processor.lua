-- Battle Process Turn Processor
-- Extracted from game-logic.battle.turn-processor for dedicated battle process
-- Maintains exact turn resolution logic with priority calculation and battle phases
-- Epic 32.3: Battle Engine Process Extraction

local TurnProcessor = {}

-- Load dependencies
local PriorityCalculator = require("game-logic.battle.priority-calculator")
local BattleConditions = require("game-logic.battle.battle-conditions")
local BattleRNG = require("game-logic.rng.battle-rng")
local Enums = require("data.constants.enums")

-- Berry system integration
local BerryActivationManager = require("game-logic.items.berry-activation-manager")
local BerryEffectsProcessor = require("game-logic.items.berry-effects-processor")

-- Status effects system dependencies
local StatusEffects = require("game-logic.pokemon.status-effects")
local StatusInteractions = require("game-logic.pokemon.status-interactions")
local StatusHealing = require("game-logic.pokemon.status-healing")
local StatusImmunities = require("game-logic.pokemon.status-immunities")

-- Weather system dependencies
local WeatherEffects = require("game-logic.battle.weather-effects")
local WeatherAbilities = require("game-logic.battle.weather-abilities")

-- Terrain system dependencies
local TerrainEffects = require("game-logic.battle.terrain-effects")
local TerrainAbilities = require("game-logic.battle.terrain-abilities")

-- Entry hazards system dependencies
local EntryHazards = require("game-logic.battle.entry-hazards")
local SwitchInEffects = require("game-logic.battle.switch-in-effects")

-- Field conditions system dependencies
local FieldConditions = require("game-logic.battle.field-conditions")

-- Turn phase enumeration
TurnProcessor.TurnPhase = {
    COMMAND_SELECTION = 1,
    ACTION_EXECUTION = 2,
    END_OF_TURN = 3,
    BATTLE_END = 4
}

-- Action type enumeration
TurnProcessor.ActionType = {
    MOVE = "move",
    SWITCH = "switch",
    ITEM = "item",
    MEGA_EVOLUTION = "mega_evolution",
    Z_MOVE = "z_move",
    DYNAMAX = "dynamax",
    ABILITY = "ability"
}

-- Battle state structure template
TurnProcessor.BattleState = {
    battleId = nil,
    turn = 0,
    phase = TurnProcessor.TurnPhase.COMMAND_SELECTION,
    turnOrder = {},
    currentAction = nil,
    pendingActions = {},
    interruptQueue = {},
    battleSeed = nil,
    playerParty = {},
    enemyParty = {},
    battleConditions = {},
    turnCommands = {},
    battleResult = nil
}

-- Initialize turn processor for a battle
-- @param battleId: Unique battle identifier
-- @param battleSeed: Deterministic RNG seed
-- @param playerParty: Player's Pokemon party
-- @param enemyParty: Enemy's Pokemon party
-- @return: Battle state object
function TurnProcessor.initializeBattle(battleId, battleSeed, playerParty, enemyParty)
    if not battleId or not battleSeed then
        return nil, "Invalid battle initialization parameters"
    end
    
    -- Initialize battle RNG with seed
    BattleRNG.initSeed(battleSeed)
    
    -- Create new battle state
    local battleState = {
        battleId = battleId,
        turn = 0,
        phase = TurnProcessor.TurnPhase.COMMAND_SELECTION,
        turnOrder = {},
        currentAction = nil,
        pendingActions = {},
        interruptQueue = {},
        battleSeed = battleSeed,
        playerParty = playerParty or {},
        enemyParty = enemyParty or {},
        battleConditions = {
            weather = nil,
            terrain = nil,
            fieldEffects = {},
            sideConditions = {
                player = {},
                enemy = {}
            }
        },
        turnCommands = {},
        battleResult = nil,
        activePlayerPokemon = {},
        activeEnemyPokemon = {}
    }
    
    -- Set initial active Pokemon
    if playerParty and #playerParty > 0 then
        table.insert(battleState.activePlayerPokemon, playerParty[1])
    end
    
    if enemyParty and #enemyParty > 0 then
        table.insert(battleState.activeEnemyPokemon, enemyParty[1])
    end
    
    return battleState, nil
end

-- Find Pokemon in battle parties
-- @param battleState: Battle state object
-- @param pokemonId: Pokemon identifier
-- @param playerId: Player identifier (optional)
-- @return: Pokemon data if found
function TurnProcessor.findPokemon(battleState, pokemonId, playerId)
    if not battleState or not pokemonId then
        return nil
    end
    
    -- Check player party
    for _, pokemon in ipairs(battleState.playerParty) do
        if pokemon.id == pokemonId then
            return pokemon
        end
    end
    
    -- Check enemy party
    for _, pokemon in ipairs(battleState.enemyParty) do
        if pokemon.id == pokemonId then
            return pokemon
        end
    end
    
    return nil
end

-- Validate battle command
-- @param battleState: Current battle state
-- @param pokemon: Pokemon executing the command
-- @param command: Command to validate
-- @return: Validation result with success/error
function TurnProcessor.validateCommand(battleState, pokemon, command)
    if not battleState or not pokemon or not command then
        return {valid = false, error = "Missing required parameters"}
    end
    
    -- Check if Pokemon can act
    if not TurnProcessor.canPokemonAct(pokemon) then
        return {valid = false, error = "Pokemon cannot act"}
    end
    
    -- Validate based on command type
    if command.type == TurnProcessor.ActionType.MOVE then
        return TurnProcessor.validateMoveCommand(pokemon, command)
    elseif command.type == TurnProcessor.ActionType.SWITCH then
        return TurnProcessor.validateSwitchCommand(battleState, pokemon, command)
    elseif command.type == TurnProcessor.ActionType.ITEM then
        return TurnProcessor.validateItemCommand(pokemon, command)
    else
        return {valid = false, error = "Unknown command type"}
    end
end

-- Check if Pokemon can perform actions
-- @param pokemon: Pokemon to check
-- @return: Boolean indicating if Pokemon can act
function TurnProcessor.canPokemonAct(pokemon)
    if not pokemon then
        return false
    end
    
    -- Check if fainted
    if pokemon.hp <= 0 then
        return false
    end
    
    -- Check status conditions that prevent action
    if pokemon.status == Enums.StatusCondition.SLEEP then
        -- Pokemon might wake up during action
        return true
    end
    
    if pokemon.status == Enums.StatusCondition.FREEZE then
        -- Pokemon might thaw during action
        return true
    end
    
    if pokemon.status == Enums.StatusCondition.PARALYSIS then
        -- Pokemon might be able to act despite paralysis
        return true
    end
    
    return true
end

-- Validate move command
-- @param pokemon: Pokemon using the move
-- @param command: Move command data
-- @return: Validation result
function TurnProcessor.validateMoveCommand(pokemon, command)
    if not command.moveId then
        return {valid = false, error = "Move ID required"}
    end
    
    -- Check if Pokemon knows the move
    local knowsMove = false
    for _, move in ipairs(pokemon.moves or {}) do
        if move.id == command.moveId then
            knowsMove = true
            -- Check PP
            if move.pp <= 0 then
                return {valid = false, error = "Move has no PP remaining"}
            end
            break
        end
    end
    
    if not knowsMove then
        return {valid = false, error = "Pokemon doesn't know this move"}
    end
    
    return {valid = true}
end

-- Validate switch command
-- @param battleState: Current battle state
-- @param pokemon: Current Pokemon
-- @param command: Switch command data
-- @return: Validation result
function TurnProcessor.validateSwitchCommand(battleState, pokemon, command)
    if not command.switchPokemonId then
        return {valid = false, error = "Switch Pokemon ID required"}
    end
    
    -- Find the Pokemon to switch to
    local switchPokemon = TurnProcessor.findPokemon(battleState, command.switchPokemonId)
    if not switchPokemon then
        return {valid = false, error = "Switch Pokemon not found"}
    end
    
    -- Check if switch Pokemon is available
    if switchPokemon.hp <= 0 then
        return {valid = false, error = "Cannot switch to fainted Pokemon"}
    end
    
    -- Check if already active
    if switchPokemon.id == pokemon.id then
        return {valid = false, error = "Pokemon is already active"}
    end
    
    return {valid = true}
end

-- Validate item command
-- @param pokemon: Pokemon using the item
-- @param command: Item command data
-- @return: Validation result
function TurnProcessor.validateItemCommand(pokemon, command)
    if not command.itemId then
        return {valid = false, error = "Item ID required"}
    end
    
    -- Additional item validation would be implemented here
    -- This is a placeholder for item system integration
    
    return {valid = true}
end

-- Add command to current turn
-- @param battleState: Battle state object
-- @param playerId: Player issuing command
-- @param command: Battle command data
-- @return: Success status and validation result
function TurnProcessor.addTurnCommand(battleState, playerId, command)
    if not battleState or battleState.phase ~= TurnProcessor.TurnPhase.COMMAND_SELECTION then
        return false, "Not in command selection phase"
    end
    
    if not playerId or not command then
        return false, "Invalid command parameters"
    end
    
    -- Validate command structure
    if not command.type or not command.pokemonId then
        return false, "Command missing required fields"
    end
    
    -- Find Pokemon in appropriate party
    local pokemon = TurnProcessor.findPokemon(battleState, command.pokemonId, playerId)
    if not pokemon then
        return false, "Pokemon not found or not available"
    end
    
    -- Validate command based on type
    local validationResult = TurnProcessor.validateCommand(battleState, pokemon, command)
    if not validationResult.valid then
        return false, validationResult.error
    end
    
    -- Store command
    if not battleState.turnCommands[playerId] then
        battleState.turnCommands[playerId] = {}
    end
    
    command.pokemon = pokemon
    command.playerId = playerId
    table.insert(battleState.turnCommands[playerId], command)
    
    return true, {
        command_accepted = true,
        pokemon_id = command.pokemonId,
        action_type = command.type
    }
end

-- Create turn actions from commands
-- @param battleState: Current battle state
-- @return: Array of turn actions
function TurnProcessor.createTurnActions(battleState)
    local actions = {}
    
    for playerId, commands in pairs(battleState.turnCommands) do
        for _, command in ipairs(commands) do
            local action = {
                type = command.type,
                pokemonId = command.pokemonId,
                pokemon = command.pokemon,
                playerId = playerId,
                priority = 0,
                speed = command.pokemon.stats.speed or 0,
                timestamp = 0
            }
            
            -- Add action-specific data
            if command.type == TurnProcessor.ActionType.MOVE then
                action.moveId = command.moveId
                action.target = command.target
                -- Priority will be calculated by PriorityCalculator
            elseif command.type == TurnProcessor.ActionType.SWITCH then
                action.switchPokemonId = command.switchPokemonId
                action.priority = 6  -- Switch has high priority
            elseif command.type == TurnProcessor.ActionType.ITEM then
                action.itemId = command.itemId
                action.priority = 6  -- Item use has high priority
            end
            
            table.insert(actions, action)
        end
    end
    
    return actions
end

-- Process complete battle turn with all phases
-- @param battleState: Current battle state
-- @return: Turn result with actions executed and battle state updates
function TurnProcessor.processBattleTurn(battleState)
    if not battleState or battleState.phase ~= TurnProcessor.TurnPhase.COMMAND_SELECTION then
        return nil, "Invalid battle state or phase"
    end
    
    -- Initialize berry activation state for this battle
    BerryActivationManager.initializeBattleState(battleState.battleId)
    
    -- Transition to action execution phase
    battleState.phase = TurnProcessor.TurnPhase.ACTION_EXECUTION
    battleState.turn = battleState.turn + 1
    
    -- Create turn actions from commands
    local turnActions = TurnProcessor.createTurnActions(battleState)
    if not turnActions or #turnActions == 0 then
        return nil, "No valid actions to process"
    end
    
    -- Calculate turn order with priority and speed
    local completeConditions = battleState.battleConditions or {}
    completeConditions.fieldConditions = battleState.fieldConditions
    battleState.turnOrder = PriorityCalculator.calculateTurnOrder(turnActions, completeConditions)
    
    local turnResult = {
        turn = battleState.turn,
        actions_executed = {},
        battle_events = {},
        interruptions = {},
        phase_results = {}
    }
    
    -- Execute all actions in priority order
    for _, action in ipairs(battleState.turnOrder) do
        battleState.currentAction = action
        
        local actionResult = TurnProcessor.executeAction(battleState, action)
        table.insert(turnResult.actions_executed, actionResult)
        
        -- Check for battle end conditions after each action
        local battleEnd = TurnProcessor.checkBattleEndConditions(battleState)
        if battleEnd then
            battleState.battleResult = battleEnd
            battleState.phase = TurnProcessor.TurnPhase.BATTLE_END
            turnResult.battle_end = battleEnd
            return turnResult, nil
        end
    end
    
    -- Process end-of-turn effects
    battleState.phase = TurnProcessor.TurnPhase.END_OF_TURN
    local endTurnResult = TurnProcessor.processEndOfTurnEffects(battleState)
    turnResult.phase_results.end_of_turn = endTurnResult
    
    -- Check battle end conditions after end-of-turn effects
    local battleEnd = TurnProcessor.checkBattleEndConditions(battleState)
    if battleEnd then
        battleState.battleResult = battleEnd
        battleState.phase = TurnProcessor.TurnPhase.BATTLE_END
        turnResult.battle_end = battleEnd
        return turnResult, nil
    end
    
    -- Clear turn commands and return to command selection phase
    battleState.turnCommands = {}
    battleState.phase = TurnProcessor.TurnPhase.COMMAND_SELECTION
    
    return turnResult, nil
end

-- Execute individual battle action
-- @param battleState: Current battle state
-- @param action: Action to execute
-- @return: Action execution result
function TurnProcessor.executeAction(battleState, action)
    if not battleState or not action then
        return {success = false, error = "Invalid action parameters"}
    end
    
    local result = {
        action_type = action.type,
        pokemon_id = action.pokemonId,
        success = false,
        effects = {},
        messages = {},
        timestamp = 0
    }
    
    -- Check if Pokemon is still able to act
    if not TurnProcessor.canPokemonAct(action.pokemon) then
        result.error = "Pokemon cannot act"
        result.messages = {"Pokemon is unable to act!"}
        return result
    end
    
    -- Execute based on action type
    if action.type == TurnProcessor.ActionType.MOVE then
        result = TurnProcessor.executeMoveAction(battleState, action)
    elseif action.type == TurnProcessor.ActionType.SWITCH then
        result = TurnProcessor.executeSwitchAction(battleState, action)
    elseif action.type == TurnProcessor.ActionType.ITEM then
        result = TurnProcessor.executeItemAction(battleState, action)
    else
        result.error = "Unknown action type: " .. tostring(action.type)
    end
    
    return result
end

-- Execute move action (placeholder for move system integration)
-- @param battleState: Current battle state
-- @param action: Move action to execute
-- @return: Move execution result
function TurnProcessor.executeMoveAction(battleState, action)
    local result = {
        action_type = "move",
        pokemon_id = action.pokemonId,
        move_id = action.moveId,
        success = true,
        damage_dealt = 0,
        effects = {},
        messages = {"Move executed successfully"}
    }
    
    -- This will integrate with the move system and damage calculator
    -- Placeholder implementation for now
    
    return result
end

-- Execute switch action
-- @param battleState: Current battle state
-- @param action: Switch action to execute
-- @return: Switch execution result
function TurnProcessor.executeSwitchAction(battleState, action)
    local result = {
        action_type = "switch",
        pokemon_id = action.pokemonId,
        switch_pokemon_id = action.switchPokemonId,
        success = true,
        effects = {},
        messages = {"Pokemon switched successfully"}
    }
    
    -- Implement switch logic here
    -- This is a placeholder for switch system integration
    
    return result
end

-- Execute item action
-- @param battleState: Current battle state
-- @param action: Item action to execute
-- @return: Item execution result
function TurnProcessor.executeItemAction(battleState, action)
    local result = {
        action_type = "item",
        pokemon_id = action.pokemonId,
        item_id = action.itemId,
        success = true,
        effects = {},
        messages = {"Item used successfully"}
    }
    
    -- Implement item usage logic here
    -- This is a placeholder for item system integration
    
    return result
end

-- Process end-of-turn effects
-- @param battleState: Current battle state
-- @return: End of turn processing result
function TurnProcessor.processEndOfTurnEffects(battleState)
    local result = {
        weather_effects = {},
        status_effects = {},
        terrain_effects = {},
        field_effects = {}
    }
    
    -- Process weather effects
    if battleState.battleConditions.weather then
        result.weather_effects = WeatherEffects.processEndOfTurn(battleState)
    end
    
    -- Process terrain effects
    if battleState.battleConditions.terrain then
        result.terrain_effects = TerrainEffects.processEndOfTurn(battleState)
    end
    
    -- Process status effects on all active Pokemon
    for _, pokemon in ipairs(battleState.activePlayerPokemon) do
        if pokemon.status then
            local statusResult = StatusEffects.processEndOfTurn(pokemon, battleState)
            table.insert(result.status_effects, statusResult)
        end
    end
    
    for _, pokemon in ipairs(battleState.activeEnemyPokemon) do
        if pokemon.status then
            local statusResult = StatusEffects.processEndOfTurn(pokemon, battleState)
            table.insert(result.status_effects, statusResult)
        end
    end
    
    return result
end

-- Check for battle end conditions
-- @param battleState: Current battle state
-- @return: Battle end result if battle is over, nil otherwise
function TurnProcessor.checkBattleEndConditions(battleState)
    if not battleState then
        return nil
    end
    
    -- Check if all player Pokemon are fainted
    local playerHasActivePokemon = false
    for _, pokemon in ipairs(battleState.playerParty) do
        if pokemon.hp > 0 then
            playerHasActivePokemon = true
            break
        end
    end
    
    -- Check if all enemy Pokemon are fainted
    local enemyHasActivePokemon = false
    for _, pokemon in ipairs(battleState.enemyParty) do
        if pokemon.hp > 0 then
            enemyHasActivePokemon = true
            break
        end
    end
    
    if not playerHasActivePokemon and not enemyHasActivePokemon then
        return {
            result = "DRAW",
            reason = "All Pokemon fainted"
        }
    elseif not playerHasActivePokemon then
        return {
            result = "DEFEAT",
            reason = "All player Pokemon fainted"
        }
    elseif not enemyHasActivePokemon then
        return {
            result = "VICTORY",
            reason = "All enemy Pokemon fainted"
        }
    end
    
    return nil
end

return TurnProcessor