-- Turn-Based Battle Engine
-- Core turn processing with speed-based ordering and battle phases
-- Handles action queuing, priority calculation, and turn execution
-- Integrates with existing move systems and battle conditions

local TurnProcessor = {}

-- Load dependencies
local PriorityCalculator = require("game-logic.battle.priority-calculator")
local BattleConditions = require("game-logic.battle.battle-conditions")
local BattleRNG = require("game-logic.rng.battle-rng")
local Enums = require("data.constants.enums")

-- Status effects system dependencies
local StatusEffects = require("game-logic.pokemon.status-effects")
local StatusInteractions = require("game-logic.pokemon.status-interactions")
local StatusHealing = require("game-logic.pokemon.status-healing")
local StatusImmunities = require("game-logic.pokemon.status-immunities")

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

-- Battle state structure
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
            weather = BattleConditions.WeatherType.NONE,
            weatherDuration = 0,
            terrain = BattleConditions.TerrainType.NONE,
            terrainDuration = 0,
            trickRoom = 0,
            tailwind = {[0] = 0, [1] = 0}
        },
        turnCommands = {},
        battleResult = nil,
        multiTurnData = {}
    }
    
    -- Initialize priority calculator
    PriorityCalculator.init()
    
    return battleState, nil
end

-- Begin new turn command collection phase
-- @param battleState: Current battle state
-- @param timeout: Command timeout in milliseconds (optional)
-- @return: Success status and command collection state
function TurnProcessor.beginCommandPhase(battleState, timeout)
    if not battleState then
        return false, "Invalid battle state"
    end
    
    battleState.turn = battleState.turn + 1
    battleState.phase = TurnProcessor.TurnPhase.COMMAND_SELECTION
    battleState.turnCommands = {}
    battleState.turnOrder = {}
    battleState.pendingActions = {}
    battleState.currentAction = nil
    
    -- Clear any previous turn data
    battleState.interruptQueue = {}
    
    return true, {
        turn = battleState.turn,
        phase = "COMMAND_SELECTION",
        timeout = timeout or 30000
    }
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

-- Process complete battle turn with all phases
-- @param battleState: Current battle state
-- @return: Turn result with actions executed and battle state updates
function TurnProcessor.processBattleTurn(battleState)
    if not battleState or battleState.phase ~= TurnProcessor.TurnPhase.COMMAND_SELECTION then
        return nil, "Invalid battle state or phase"
    end
    
    -- Transition to action execution phase
    battleState.phase = TurnProcessor.TurnPhase.ACTION_EXECUTION
    
    -- Create turn actions from commands
    local turnActions = TurnProcessor.createTurnActions(battleState)
    if not turnActions or #turnActions == 0 then
        return nil, "No valid actions to process"
    end
    
    -- Calculate turn order with priority and speed
    battleState.turnOrder = PriorityCalculator.calculateTurnOrder(turnActions, battleState.battleConditions)
    battleState.pendingActions = {}
    for _, action in ipairs(battleState.turnOrder) do
        table.insert(battleState.pendingActions, action)
    end
    
    local turnResult = {
        turn = battleState.turn,
        actions_executed = {},
        battle_events = {},
        interruptions = {},
        phase_results = {}
    }
    
    -- Execute all actions in priority order
    while #battleState.pendingActions > 0 do
        local action = table.remove(battleState.pendingActions, 1)
        battleState.currentAction = action
        
        local actionResult = TurnProcessor.executeAction(battleState, action)
        table.insert(turnResult.actions_executed, actionResult)
        
        -- Check for battle interruptions (fainting, forced switches)
        local interruptions = TurnProcessor.handleBattleInterruptions(battleState)
        for _, interruption in ipairs(interruptions) do
            table.insert(turnResult.interruptions, interruption)
        end
        
        -- Check for battle end conditions
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
    
    -- Return to command selection phase for next turn
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
        timestamp = os.time()
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
    
    -- Update multi-turn action tracking
    TurnProcessor.updateMultiTurnActions(battleState, action, result)
    
    return result
end

-- Execute move action with full move system integration
-- @param battleState: Current battle state
-- @param action: Move action to execute
-- @return: Move execution result
function TurnProcessor.executeMoveAction(battleState, action)
    local result = {
        action_type = "move",
        pokemon_id = action.pokemonId,
        move_id = action.moveId,
        target_id = action.target and action.target.id or nil,
        success = false,
        damage_dealt = 0,
        effects = {},
        messages = {}
    }
    
    -- Load move database
    local MoveDatabase = require("data.moves.move-database")
    if not MoveDatabase.moves or #MoveDatabase.moves == 0 then
        MoveDatabase.init()
    end
    
    local move = MoveDatabase.moves[action.moveId]
    if not move then
        result.error = "Move not found"
        result.messages = {action.pokemon.name .. " tried to use an unknown move!"}
        return result
    end
    
    -- Check status effects for move prevention
    if action.pokemon.statusEffect then
        local movePreventionCheck = StatusEffects.checkMovePreventionEffects(action.pokemon, move, battleState)
        if not movePreventionCheck.canMove then
            result.error = "Move prevented by status condition"
            result.messages = movePreventionCheck.messages or {action.pokemon.name .. " couldn't move due to status condition!"}
            result.statusPrevention = movePreventionCheck
            return result
        end
        
        -- Add status change messages if Pokemon recovered
        if movePreventionCheck.statusChanged then
            for _, message in ipairs(movePreventionCheck.messages) do
                table.insert(result.messages, message)
            end
        end
    end

    -- Check PP availability
    if action.pokemon.moves and action.pokemon.moves[action.moveId] then
        local pokemonMove = action.pokemon.moves[action.moveId]
        if pokemonMove.pp <= 0 then
            result.error = "No PP remaining"
            result.messages = {action.pokemon.name .. " has no PP left for " .. move.name .. "!"}
            return result
        end
        pokemonMove.pp = pokemonMove.pp - 1
    end
    
    result.success = true
    result.messages = {action.pokemon.name .. " used " .. move.name .. "!"}
    
    -- Integration with comprehensive move effects system from Stories 3.1-3.4
    local moveEffectsSystem = require("game-logic.battle.move-effects")
    local moveInteractionProcessor = require("game-logic.battle.move-interaction-processor")
    local battleMessages = require("game-logic.battle.battle-messages")
    
    -- Initialize battle messages system if not already done
    battleMessages.init()
    
    -- Process move with full effects system integration
    if moveEffectsSystem and moveEffectsSystem.executeMove then
        local effectResult = moveEffectsSystem.executeMove(battleState, action.pokemon, move, action.target)
        if effectResult then
            result.damage_dealt = effectResult.damage or 0
            result.effects = effectResult.effects or {}
            result.effectiveness = effectResult.effectiveness or 1.0
            result.critical_hit = effectResult.critical_hit or false
            result.missed = effectResult.missed or false
            result.failed = effectResult.failed or false
            result.no_effect = effectResult.no_effect or false
            
            -- Generate battle messages for the move action
            local moveMessages = battleMessages.generateMoveMessage(action.pokemon, move, action.target, effectResult)
            result.messages = moveMessages
            
            -- Add damage messages if damage was dealt
            if result.damage_dealt > 0 and action.target then
                local damageMessages = battleMessages.generateDamageMessage(
                    action.target, 
                    result.damage_dealt, 
                    "move", 
                    result.effectiveness, 
                    result.critical_hit
                )
                for _, msg in ipairs(damageMessages) do
                    table.insert(result.messages, msg)
                end
            end
            
            -- Add status effect messages
            if effectResult.status_effects then
                for _, statusEffect in ipairs(effectResult.status_effects) do
                    local statusMsg = battleMessages.generateStatusMessage(
                        statusEffect.target or action.target, 
                        statusEffect.status, 
                        statusEffect.applied
                    )
                    table.insert(result.messages, statusMsg)
                end
            end
        end
    end
    
    -- Process move interactions and combo effects from Story 3.4
    if moveInteractionProcessor and moveInteractionProcessor.processInteractions then
        local interactionResult = moveInteractionProcessor.processInteractions(
            battleState, action.pokemon, move, action.target, result
        )
        if interactionResult then
            -- Update result with interaction effects
            result.interaction_effects = interactionResult.effects or {}
            if interactionResult.messages then
                for _, msg in ipairs(interactionResult.messages) do
                    table.insert(result.messages, msg)
                end
            end
        end
    end
    
    return result
end

-- Execute switch action
-- @param battleState: Current battle state
-- @param action: Switch action to execute
-- @return: Switch execution result
function TurnProcessor.executeSwitchAction(battleState, action)
    -- Load switch system integration
    local PokemonSwitchSystem = require("game-logic.battle.pokemon-switch-system")
    local SwitchInEffects = require("game-logic.battle.switch-in-effects")
    local ParticipationTracker = require("game-logic.battle.participation-tracker")
    
    local result = {
        action_type = "switch",
        pokemon_id = action.pokemonId,
        switch_to = action.switchTo,
        success = false,
        effects = {},
        messages = {}
    }
    
    -- Use the comprehensive switch system
    local switchResult = PokemonSwitchSystem.executeSwitch(
        battleState, 
        action.playerId, 
        action.pokemonId, 
        action.switchTo, 
        action.position or 1,
        PokemonSwitchSystem.SwitchType.VOLUNTARY
    )
    
    if not switchResult.success then
        result.error = switchResult.error or "Switch failed"
        result.messages = switchResult.messages or {"Switch failed!"}
        return result
    end
    
    -- Record participation tracking
    ParticipationTracker.recordSwitchOut(battleState, action.pokemonId, action.position, battleState.turn, "voluntary")
    ParticipationTracker.recordSwitchIn(battleState, action.switchTo, action.position, battleState.turn)
    
    -- Process switch-in effects
    local switchInResult = SwitchInEffects.processAllSwitchInEffects(
        battleState, 
        switchResult.targetPokemon, 
        action.position or 1,
        switchResult.currentPokemon
    )
    
    -- Combine results
    result.success = true
    result.messages = switchResult.messages or {}
    result.effects = switchInResult.effects or {}
    result.switchInEffects = switchInResult
    
    -- Add switch-in effect messages
    if switchInResult and switchInResult.messages then
        for _, message in ipairs(switchInResult.messages) do
            table.insert(result.messages, message)
        end
    end
    
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
        success = false,
        effects = {},
        messages = {}
    }
    
    -- Placeholder for item system integration
    -- Will be implemented with comprehensive item effects
    result.success = true
    result.messages = {"Trainer used an item!"}
    
    return result
end

-- Process end-of-turn effects (weather, terrain, status, abilities)
-- @param battleState: Current battle state
-- @return: End-of-turn effects result
function TurnProcessor.processEndOfTurnEffects(battleState)
    local result = {
        weather_effects = {},
        terrain_effects = {},
        status_effects = {},
        ability_effects = {},
        duration_updates = {}
    }
    
    -- Process weather effects
    if battleState.battleConditions.weather ~= BattleConditions.WeatherType.NONE then
        local allPokemon = {}
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon.currentHP > 0 then
                table.insert(allPokemon, pokemon)
            end
        end
        for _, pokemon in ipairs(battleState.enemyParty) do
            if pokemon.currentHP > 0 then
                table.insert(allPokemon, pokemon)
            end
        end
        
        local weatherDamage = BattleConditions.processWeatherDamage(
            battleState.battleId,
            battleState.battleConditions.weather,
            allPokemon
        )
        result.weather_effects = weatherDamage
        
        -- Update weather duration
        local newDuration, expired = BattleConditions.updateDuration("weather", battleState.battleConditions.weatherDuration)
        battleState.battleConditions.weatherDuration = newDuration
        if expired then
            battleState.battleConditions.weather = BattleConditions.WeatherType.NONE
            table.insert(result.duration_updates, {type = "weather", expired = true})
        end
    end
    
    -- Process terrain effects
    if battleState.battleConditions.terrain ~= BattleConditions.TerrainType.NONE then
        local allPokemon = {}
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon.currentHP > 0 then
                table.insert(allPokemon, pokemon)
            end
        end
        for _, pokemon in ipairs(battleState.enemyParty) do
            if pokemon.currentHP > 0 then
                table.insert(allPokemon, pokemon)
            end
        end
        
        local terrainHealing = BattleConditions.processTerrainHealing(
            battleState.battleId,
            battleState.battleConditions.terrain,
            allPokemon
        )
        result.terrain_effects = terrainHealing
        
        -- Update terrain duration
        local newDuration, expired = BattleConditions.updateDuration("terrain", battleState.battleConditions.terrainDuration)
        battleState.battleConditions.terrainDuration = newDuration
        if expired then
            battleState.battleConditions.terrain = BattleConditions.TerrainType.NONE
            table.insert(result.duration_updates, {type = "terrain", expired = true})
        end
    end
    
    -- Process status effects on all Pokemon using comprehensive status effects system
    local allPokemon = {}
    for _, pokemon in ipairs(battleState.playerParty) do
        table.insert(allPokemon, pokemon)
    end
    for _, pokemon in ipairs(battleState.enemyParty) do
        table.insert(allPokemon, pokemon)
    end
    
    for _, pokemon in ipairs(allPokemon) do
        local statusResult = StatusEffects.processEndOfTurnEffects(pokemon, battleState)
        if statusResult and (#statusResult.effects > 0 or #statusResult.messages > 0) then
            result.status_effects[pokemon.id] = statusResult
        end
    end
    
    -- Update multi-turn move durations
    TurnProcessor.updateMultiTurnDurations(battleState)
    
    return result
end

-- Process status effects for a Pokemon (deprecated - use StatusEffects.processEndOfTurnEffects)
-- @param pokemon: Pokemon to process
-- @param battleState: Current battle state
-- @return: Status effect results
function TurnProcessor.processStatusEffects(pokemon, battleState)
    -- Delegate to comprehensive status effects system
    return StatusEffects.processEndOfTurnEffects(pokemon, battleState)
end

-- Handle battle interruptions (fainting, forced switches)
-- @param battleState: Current battle state
-- @return: List of interruptions that occurred
function TurnProcessor.handleBattleInterruptions(battleState)
    local interruptions = {}
    
    -- Check for fainted Pokemon
    local faintedPokemon = TurnProcessor.checkFaintedPokemon(battleState)
    for _, pokemon in ipairs(faintedPokemon) do
        table.insert(interruptions, {
            type = "faint",
            pokemon_id = pokemon.id,
            player_id = pokemon.playerId,
            message = pokemon.name .. " fainted!"
        })
        
        -- Add to interrupt queue for handling
        table.insert(battleState.interruptQueue, {
            type = "faint_replacement",
            player_id = pokemon.playerId,
            fainted_pokemon = pokemon.id
        })
    end
    
    -- Handle forced switches (from moves like Roar, Whirlwind)
    -- This would integrate with move effects system
    
    return interruptions
end

-- Check for fainted Pokemon
-- @param battleState: Current battle state
-- @return: List of newly fainted Pokemon
function TurnProcessor.checkFaintedPokemon(battleState)
    local fainted = {}
    
    -- Check player party
    for _, pokemon in ipairs(battleState.playerParty) do
        if pokemon.currentHP <= 0 and not pokemon.fainted then
            pokemon.fainted = true
            pokemon.playerId = "player"
            table.insert(fainted, pokemon)
        end
    end
    
    -- Check enemy party
    for _, pokemon in ipairs(battleState.enemyParty) do
        if pokemon.currentHP <= 0 and not pokemon.fainted then
            pokemon.fainted = true
            pokemon.playerId = "enemy"
            table.insert(fainted, pokemon)
        end
    end
    
    return fainted
end

-- Check battle end conditions
-- @param battleState: Current battle state
-- @return: Battle result if battle ended, nil otherwise
function TurnProcessor.checkBattleEndConditions(battleState)
    -- Check if player has any usable Pokemon
    local playerUsable = 0
    for _, pokemon in ipairs(battleState.playerParty) do
        if pokemon.currentHP > 0 then
            playerUsable = playerUsable + 1
        end
    end
    
    -- Check if enemy has any usable Pokemon
    local enemyUsable = 0
    for _, pokemon in ipairs(battleState.enemyParty) do
        if pokemon.currentHP > 0 then
            enemyUsable = enemyUsable + 1
        end
    end
    
    -- Determine battle result
    if playerUsable == 0 and enemyUsable == 0 then
        return {
            result = "draw",
            reason = "All Pokemon fainted",
            timestamp = os.time()
        }
    elseif playerUsable == 0 then
        return {
            result = "defeat",
            reason = "Player has no usable Pokemon",
            timestamp = os.time()
        }
    elseif enemyUsable == 0 then
        return {
            result = "victory",
            reason = "Enemy has no usable Pokemon",
            timestamp = os.time()
        }
    end
    
    return nil -- Battle continues
end

-- Create turn actions from player commands
-- @param battleState: Current battle state
-- @return: List of turn actions
function TurnProcessor.createTurnActions(battleState)
    local actions = {}
    
    for playerId, commands in pairs(battleState.turnCommands) do
        for _, command in ipairs(commands) do
            local action = PriorityCalculator.createTurnAction(
                command.type,
                command.pokemon,
                command.moveId,
                command.target,
                command.data
            )
            
            if action then
                action.playerId = playerId
                table.insert(actions, action)
            end
        end
    end
    
    return actions
end

-- Find Pokemon in battle parties
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon ID to find
-- @param playerId: Player ID (optional, for validation)
-- @return: Pokemon object if found
function TurnProcessor.findPokemon(battleState, pokemonId, playerId)
    -- Search in player party
    for _, pokemon in ipairs(battleState.playerParty) do
        if pokemon.id == pokemonId then
            if not playerId or playerId == "player" then
                return pokemon
            end
        end
    end
    
    -- Search in enemy party
    for _, pokemon in ipairs(battleState.enemyParty) do
        if pokemon.id == pokemonId then
            if not playerId or playerId == "enemy" then
                return pokemon
            end
        end
    end
    
    return nil
end

-- Validate battle command
-- @param battleState: Current battle state
-- @param pokemon: Pokemon executing command
-- @param command: Command to validate
-- @return: Validation result
function TurnProcessor.validateCommand(battleState, pokemon, command)
    -- Check if Pokemon can act
    if not TurnProcessor.canPokemonAct(pokemon) then
        return {valid = false, error = "Pokemon cannot act"}
    end
    
    -- Validate based on command type
    if command.type == TurnProcessor.ActionType.MOVE then
        return TurnProcessor.validateMoveCommand(battleState, pokemon, command)
    elseif command.type == TurnProcessor.ActionType.SWITCH then
        return TurnProcessor.validateSwitchCommand(battleState, pokemon, command)
    elseif command.type == TurnProcessor.ActionType.ITEM then
        return TurnProcessor.validateItemCommand(battleState, pokemon, command)
    end
    
    return {valid = false, error = "Unknown command type"}
end

-- Validate move command
-- @param battleState: Current battle state
-- @param pokemon: Pokemon using move
-- @param command: Move command
-- @return: Validation result
function TurnProcessor.validateMoveCommand(battleState, pokemon, command)
    if not command.moveId then
        return {valid = false, error = "Move ID required"}
    end
    
    -- Check if Pokemon knows the move
    if pokemon.moves and not pokemon.moves[command.moveId] then
        return {valid = false, error = "Pokemon doesn't know this move"}
    end
    
    -- Check PP
    if pokemon.moves and pokemon.moves[command.moveId] then
        if pokemon.moves[command.moveId].pp <= 0 then
            return {valid = false, error = "No PP remaining for this move"}
        end
    end
    
    return {valid = true}
end

-- Validate switch command
-- @param battleState: Current battle state
-- @param pokemon: Current Pokemon
-- @param command: Switch command
-- @return: Validation result
function TurnProcessor.validateSwitchCommand(battleState, pokemon, command)
    if not command.switchTo then
        return {valid = false, error = "Switch target required"}
    end
    
    local switchPokemon = TurnProcessor.findPokemon(battleState, command.switchTo, command.playerId)
    if not switchPokemon then
        return {valid = false, error = "Switch target not found"}
    end
    
    if switchPokemon.currentHP <= 0 then
        return {valid = false, error = "Cannot switch to fainted Pokemon"}
    end
    
    if switchPokemon.id == pokemon.id then
        return {valid = false, error = "Cannot switch to same Pokemon"}
    end
    
    return {valid = true}
end

-- Validate item command
-- @param battleState: Current battle state
-- @param pokemon: Target Pokemon
-- @param command: Item command
-- @return: Validation result
function TurnProcessor.validateItemCommand(battleState, pokemon, command)
    if not command.itemId then
        return {valid = false, error = "Item ID required"}
    end
    
    -- Placeholder for item validation
    -- Will integrate with item system
    
    return {valid = true}
end

-- Check if Pokemon can act this turn
-- @param pokemon: Pokemon to check
-- @return: Boolean indicating if Pokemon can act
function TurnProcessor.canPokemonAct(pokemon)
    if not pokemon then
        return false
    end
    
    if pokemon.currentHP <= 0 then
        return false
    end
    
    -- Use comprehensive status effects system to check move prevention
    if pokemon.statusEffect then
        local movePreventionCheck = StatusEffects.checkMovePreventionEffects(pokemon, nil, nil)
        return movePreventionCheck.canMove
    end
    
    return true
end

-- Switch active Pokemon
-- @param battleState: Current battle state
-- @param playerId: Player performing switch
-- @param currentPokemonId: Currently active Pokemon
-- @param switchToPokemonId: Pokemon to switch to
-- @return: Success status
function TurnProcessor.switchActivePokemon(battleState, playerId, currentPokemonId, switchToPokemonId)
    -- This function would handle the active Pokemon switching logic
    -- For now, just mark the switch as completed
    return true
end

-- Update multi-turn action tracking
-- @param battleState: Current battle state
-- @param action: Action that was executed
-- @param result: Action execution result
function TurnProcessor.updateMultiTurnActions(battleState, action, result)
    if not battleState.multiTurnData then
        battleState.multiTurnData = {}
    end
    
    local pokemonId = action.pokemonId
    
    -- Handle multi-turn moves (Fly, Dig, Solar Beam, etc.)
    if action.type == TurnProcessor.ActionType.MOVE then
        local MoveDatabase = require("data.moves.move-database")
        if MoveDatabase.moves and MoveDatabase.moves[action.moveId] then
            local move = MoveDatabase.moves[action.moveId]
            
            -- Check if this is a charging move
            if move.flags and move.flags.charge then
                if not battleState.multiTurnData[pokemonId] then
                    battleState.multiTurnData[pokemonId] = {}
                end
                battleState.multiTurnData[pokemonId].charging = {
                    moveId = action.moveId,
                    turnsRemaining = 1,
                    target = action.target
                }
            end
            
            -- Check if this is a recharging move
            if move.flags and move.flags.recharge then
                if not battleState.multiTurnData[pokemonId] then
                    battleState.multiTurnData[pokemonId] = {}
                end
                battleState.multiTurnData[pokemonId].recharging = {
                    moveId = action.moveId,
                    turnsRemaining = 1
                }
            end
        end
    end
end

-- Update multi-turn durations
-- @param battleState: Current battle state
function TurnProcessor.updateMultiTurnDurations(battleState)
    if not battleState.multiTurnData then
        return
    end
    
    for pokemonId, data in pairs(battleState.multiTurnData) do
        -- Update charging moves
        if data.charging then
            data.charging.turnsRemaining = data.charging.turnsRemaining - 1
            if data.charging.turnsRemaining <= 0 then
                data.charging = nil
            end
        end
        
        -- Update recharging moves
        if data.recharging then
            data.recharging.turnsRemaining = data.recharging.turnsRemaining - 1
            if data.recharging.turnsRemaining <= 0 then
                data.recharging = nil
            end
        end
        
        -- Clean up empty entries
        local hasData = false
        for key, value in pairs(data) do
            if value then
                hasData = true
                break
            end
        end
        
        if not hasData then
            battleState.multiTurnData[pokemonId] = nil
        end
    end
end

return TurnProcessor