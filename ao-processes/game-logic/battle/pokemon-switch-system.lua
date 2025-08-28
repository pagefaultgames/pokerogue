-- Pokemon Switch System
-- Handles Pokemon switching mechanics, validation, and forced switches
-- Integrates with battle state manager and turn processor
-- Supports both voluntary and forced switching scenarios

local PokemonSwitchSystem = {}

-- Load dependencies
local BattleStateManager = require("game-logic.battle.battle-state-manager")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Optional dependencies
local BattleMessages = nil
pcall(function() BattleMessages = require("game-logic.battle.battle-messages") end)

-- Switch types
PokemonSwitchSystem.SwitchType = {
    VOLUNTARY = "voluntary",
    FORCED = "forced",
    FAINT_REPLACEMENT = "faint_replacement",
    MOVE_EFFECT = "move_effect",
    ABILITY_EFFECT = "ability_effect"
}

-- Switch validation error codes
PokemonSwitchSystem.ValidationError = {
    INVALID_POKEMON = "invalid_pokemon",
    FAINTED_POKEMON = "fainted_pokemon",
    SAME_POKEMON = "same_pokemon",
    NO_AVAILABLE_POKEMON = "no_available_pokemon",
    TRAPPED = "trapped",
    INVALID_PHASE = "invalid_phase",
    POSITION_OCCUPIED = "position_occupied"
}

-- Initialize switch system
function PokemonSwitchSystem.init()
    -- Initialize battle messages if available
    if BattleMessages and BattleMessages.init then
        BattleMessages.init()
    end
    
    return true, "Pokemon switch system initialized"
end

-- Validate switch command
-- @param battleState: Current battle state
-- @param playerId: Player attempting switch ("player" or "enemy")
-- @param currentPokemonId: Currently active Pokemon
-- @param targetPokemonId: Pokemon to switch to
-- @param position: Battle position (1 for single, 1-2 for double)
-- @param switchType: Type of switch being performed
-- @return: Validation result with success status and error details
function PokemonSwitchSystem.validateSwitch(battleState, playerId, currentPokemonId, targetPokemonId, position, switchType)
    if not battleState then
        return {
            valid = false,
            error = PokemonSwitchSystem.ValidationError.INVALID_POKEMON,
            message = "Invalid battle state"
        }
    end
    
    position = position or 1
    switchType = switchType or PokemonSwitchSystem.SwitchType.VOLUNTARY
    
    -- Find current Pokemon
    local currentPokemon = BattleStateManager.findPokemonById(battleState, currentPokemonId, playerId)
    if not currentPokemon then
        return {
            valid = false,
            error = PokemonSwitchSystem.ValidationError.INVALID_POKEMON,
            message = "Current Pokemon not found"
        }
    end
    
    -- Find target Pokemon
    local targetPokemon = BattleStateManager.findPokemonById(battleState, targetPokemonId, playerId)
    if not targetPokemon then
        return {
            valid = false,
            error = PokemonSwitchSystem.ValidationError.INVALID_POKEMON,
            message = "Target Pokemon not found"
        }
    end
    
    -- Check if target Pokemon is fainted
    if targetPokemon.currentHP <= 0 or targetPokemon.fainted then
        return {
            valid = false,
            error = PokemonSwitchSystem.ValidationError.FAINTED_POKEMON,
            message = targetPokemon.name .. " is unable to battle!"
        }
    end
    
    -- Check if switching to same Pokemon
    if currentPokemonId == targetPokemonId then
        return {
            valid = false,
            error = PokemonSwitchSystem.ValidationError.SAME_POKEMON,
            message = "Cannot switch to the same Pokemon"
        }
    end
    
    -- Check if target Pokemon is already active (for double battles)
    if battleState.battleType == BattleStateManager.BattleType.DOUBLE then
        local activeIds = playerId == "player" and battleState.activePlayer or battleState.activeEnemy
        for pos, activeId in pairs(activeIds) do
            if pos ~= position and activeId == targetPokemonId then
                return {
                    valid = false,
                    error = PokemonSwitchSystem.ValidationError.POSITION_OCCUPIED,
                    message = targetPokemon.name .. " is already in battle!"
                }
            end
        end
    end
    
    -- Check if current Pokemon is trapped (only for voluntary switches)
    if switchType == PokemonSwitchSystem.SwitchType.VOLUNTARY then
        local trapCheck = PokemonSwitchSystem.checkTrappingEffects(battleState, currentPokemon)
        if trapCheck.trapped then
            return {
                valid = false,
                error = PokemonSwitchSystem.ValidationError.TRAPPED,
                message = trapCheck.message or "Pokemon is trapped and cannot switch!"
            }
        end
    end
    
    -- Check battle phase for voluntary switches
    if switchType == PokemonSwitchSystem.SwitchType.VOLUNTARY then
        if battleState.phase ~= BattleStateManager.BattlePhase.COMMAND_SELECTION then
            return {
                valid = false,
                error = PokemonSwitchSystem.ValidationError.INVALID_PHASE,
                message = "Cannot switch during this battle phase"
            }
        end
    end
    
    return {
        valid = true,
        currentPokemon = currentPokemon,
        targetPokemon = targetPokemon,
        message = "Switch is valid"
    }
end

-- Execute Pokemon switch
-- @param battleState: Current battle state
-- @param playerId: Player performing switch
-- @param currentPokemonId: Currently active Pokemon
-- @param targetPokemonId: Pokemon to switch to
-- @param position: Battle position
-- @param switchType: Type of switch
-- @return: Switch execution result
function PokemonSwitchSystem.executeSwitch(battleState, playerId, currentPokemonId, targetPokemonId, position, switchType)
    position = position or 1
    switchType = switchType or PokemonSwitchSystem.SwitchType.VOLUNTARY
    
    -- Validate switch
    local validation = PokemonSwitchSystem.validateSwitch(
        battleState, playerId, currentPokemonId, targetPokemonId, position, switchType
    )
    
    if not validation.valid then
        return {
            success = false,
            error = validation.error,
            message = validation.message,
            switchType = switchType
        }
    end
    
    local currentPokemon = validation.currentPokemon
    local targetPokemon = validation.targetPokemon
    
    local result = {
        success = true,
        switchType = switchType,
        currentPokemon = currentPokemon,
        targetPokemon = targetPokemon,
        position = position,
        playerId = playerId,
        messages = {},
        effects = {},
        timestamp = os.time()
    }
    
    -- Generate switch messages
    local switchMessages = PokemonSwitchSystem.generateSwitchMessages(
        currentPokemon, targetPokemon, switchType
    )
    result.messages = switchMessages
    
    -- Execute the switch
    local switchSuccess = PokemonSwitchSystem.performSwitch(
        battleState, playerId, currentPokemonId, targetPokemonId, position
    )
    
    if not switchSuccess then
        result.success = false
        result.error = "Switch execution failed"
        return result
    end
    
    -- Record switch in battle history
    table.insert(battleState.battleEvents, {
        type = "pokemon_switch",
        turn = battleState.turn,
        playerId = playerId,
        position = position,
        from = currentPokemonId,
        to = targetPokemonId,
        switchType = switchType,
        timestamp = os.time()
    })
    
    -- Update participation tracking
    targetPokemon.participated = true
    targetPokemon.turnCount = targetPokemon.turnCount + 1
    
    -- Reset battle data for switched-in Pokemon
    if targetPokemon.battleData then
        targetPokemon.battleData.turnsSinceSwitchIn = 0
        targetPokemon.battleData.damageThisTurn = 0
        targetPokemon.battleData.healingThisTurn = 0
        targetPokemon.battleData.moveUsedThisTurn = nil
        targetPokemon.battleData.hasMoved = false
    end
    
    result.switchCompleted = true
    return result
end

-- Perform the actual switch operation
-- @param battleState: Current battle state
-- @param playerId: Player performing switch
-- @param currentPokemonId: Currently active Pokemon
-- @param targetPokemonId: Pokemon to switch to
-- @param position: Battle position
-- @return: Success status
function PokemonSwitchSystem.performSwitch(battleState, playerId, currentPokemonId, targetPokemonId, position)
    if not battleState or not playerId or not targetPokemonId then
        return false
    end
    
    position = position or 1
    
    -- Update active Pokemon tracking
    if playerId == "player" then
        battleState.activePlayer[position] = targetPokemonId
    elseif playerId == "enemy" then
        battleState.activeEnemy[position] = targetPokemonId
    else
        return false
    end
    
    return true
end

-- Handle forced switch scenarios
-- @param battleState: Current battle state
-- @param playerId: Player being forced to switch
-- @param currentPokemonId: Currently active Pokemon
-- @param position: Battle position
-- @param forceReason: Reason for forced switch (faint, move effect, etc.)
-- @return: Forced switch result
function PokemonSwitchSystem.handleForcedSwitch(battleState, playerId, currentPokemonId, position, forceReason)
    position = position or 1
    
    local result = {
        success = false,
        forced = true,
        reason = forceReason,
        playerId = playerId,
        position = position,
        currentPokemonId = currentPokemonId,
        messages = {},
        requiresPlayerChoice = false
    }
    
    -- Find available Pokemon for switch
    local availablePokemon = PokemonSwitchSystem.getAvailableSwitchTargets(battleState, playerId)
    
    if #availablePokemon == 0 then
        result.messages = {"No Pokemon available to switch!"}
        result.error = PokemonSwitchSystem.ValidationError.NO_AVAILABLE_POKEMON
        return result
    end
    
    -- Handle different forced switch scenarios
    if forceReason == "faint" then
        -- Pokemon fainted, player must choose replacement
        result.requiresPlayerChoice = true
        result.availablePokemon = availablePokemon
        result.messages = {"Choose a Pokemon to send out!"}
        result.success = true
    elseif forceReason == "move_effect" then
        -- Move forced switch (Roar, Whirlwind), randomly select Pokemon
        if #availablePokemon > 0 then
            local randomIndex = BattleRNG.randomInt(1, #availablePokemon)
            local randomPokemon = availablePokemon[randomIndex]
            
            local switchResult = PokemonSwitchSystem.executeSwitch(
                battleState, playerId, currentPokemonId, randomPokemon.id, position, 
                PokemonSwitchSystem.SwitchType.FORCED
            )
            
            result.success = switchResult.success
            result.targetPokemon = randomPokemon
            result.messages = switchResult.messages or {}
            table.insert(result.messages, randomPokemon.name .. " was forced out!")
        end
    elseif forceReason == "ability_effect" then
        -- Ability forced switch, similar to move effect
        if #availablePokemon > 0 then
            local randomIndex = BattleRNG.randomInt(1, #availablePokemon)
            local randomPokemon = availablePokemon[randomIndex]
            
            local switchResult = PokemonSwitchSystem.executeSwitch(
                battleState, playerId, currentPokemonId, randomPokemon.id, position,
                PokemonSwitchSystem.SwitchType.ABILITY_EFFECT
            )
            
            result.success = switchResult.success
            result.targetPokemon = randomPokemon
            result.messages = switchResult.messages or {}
            table.insert(result.messages, randomPokemon.name .. " was forced out by an ability!")
        end
    end
    
    return result
end

-- Get available Pokemon for switching
-- @param battleState: Current battle state
-- @param playerId: Player to check ("player" or "enemy")
-- @return: Array of available Pokemon
function PokemonSwitchSystem.getAvailableSwitchTargets(battleState, playerId)
    if not battleState or not playerId then
        return {}
    end
    
    local party = playerId == "player" and battleState.playerParty or battleState.enemyParty
    local activeIds = playerId == "player" and battleState.activePlayer or battleState.activeEnemy
    local available = {}
    
    for _, pokemon in ipairs(party) do
        if pokemon and pokemon.currentHP > 0 and not pokemon.fainted then
            -- Check if Pokemon is not already active
            local isActive = false
            for _, activeId in pairs(activeIds) do
                if pokemon.id == activeId then
                    isActive = true
                    break
                end
            end
            
            if not isActive then
                table.insert(available, pokemon)
            end
        end
    end
    
    return available
end

-- Check for trapping effects that prevent switching
-- @param battleState: Current battle state
-- @param pokemon: Pokemon to check for trapping
-- @return: Trapping check result
function PokemonSwitchSystem.checkTrappingEffects(battleState, pokemon)
    local result = {
        trapped = false,
        effects = {},
        message = nil
    }
    
    if not pokemon then
        return result
    end
    
    -- Check for trapping abilities (Arena Trap, Shadow Tag, Magnet Pull)
    if pokemon.battleData and pokemon.battleData.trapped then
        result.trapped = true
        result.message = pokemon.name .. " is trapped and cannot switch!"
        table.insert(result.effects, {type = "ability_trap", source = pokemon.battleData.trapSource})
        return result
    end
    
    -- Check for trapping moves (Mean Look, Block, Spider Web)
    if pokemon.battleData and pokemon.battleData.meanLook then
        result.trapped = true
        result.message = pokemon.name .. " is trapped by Mean Look!"
        table.insert(result.effects, {type = "move_trap", source = "mean_look"})
        return result
    end
    
    -- Check for partial trapping moves (Wrap, Bind, Fire Spin)
    if pokemon.battleData and pokemon.battleData.partiallyTrapped then
        result.trapped = true
        result.message = pokemon.name .. " is trapped!"
        table.insert(result.effects, {type = "partial_trap", source = pokemon.battleData.partialTrapSource})
        return result
    end
    
    -- Check for Ingrain
    if pokemon.battleData and pokemon.battleData.ingrained then
        result.trapped = true
        result.message = pokemon.name .. " is anchored in place by its roots!"
        table.insert(result.effects, {type = "ingrain"})
        return result
    end
    
    return result
end

-- Generate appropriate messages for switch scenarios
-- @param currentPokemon: Pokemon being switched out
-- @param targetPokemon: Pokemon being switched in
-- @param switchType: Type of switch
-- @return: Array of battle messages
function PokemonSwitchSystem.generateSwitchMessages(currentPokemon, targetPokemon, switchType)
    local messages = {}
    
    if switchType == PokemonSwitchSystem.SwitchType.VOLUNTARY then
        if currentPokemon and not currentPokemon.fainted then
            table.insert(messages, currentPokemon.name .. ", come back!")
        end
        table.insert(messages, "Go! " .. targetPokemon.name .. "!")
        
    elseif switchType == PokemonSwitchSystem.SwitchType.FAINT_REPLACEMENT then
        table.insert(messages, "Go! " .. targetPokemon.name .. "!")
        
    elseif switchType == PokemonSwitchSystem.SwitchType.FORCED then
        if currentPokemon then
            table.insert(messages, currentPokemon.name .. " was forced to withdraw!")
        end
        table.insert(messages, targetPokemon.name .. " was dragged out!")
        
    elseif switchType == PokemonSwitchSystem.SwitchType.MOVE_EFFECT then
        if currentPokemon then
            table.insert(messages, currentPokemon.name .. " was blown away!")
        end
        table.insert(messages, targetPokemon.name .. " was forced out!")
        
    elseif switchType == PokemonSwitchSystem.SwitchType.ABILITY_EFFECT then
        if currentPokemon then
            table.insert(messages, currentPokemon.name .. " was forced out!")
        end
        table.insert(messages, targetPokemon.name .. " was sent out!")
    end
    
    return messages
end

-- Handle emergency switch when all active Pokemon faint simultaneously
-- @param battleState: Current battle state
-- @param playerId: Player needing emergency switch
-- @return: Emergency switch result
function PokemonSwitchSystem.handleEmergencySwitch(battleState, playerId)
    local result = {
        success = false,
        emergency = true,
        playerId = playerId,
        switches = {},
        messages = {}
    }
    
    local availablePokemon = PokemonSwitchSystem.getAvailableSwitchTargets(battleState, playerId)
    
    if #availablePokemon == 0 then
        result.error = PokemonSwitchSystem.ValidationError.NO_AVAILABLE_POKEMON
        result.messages = {playerId .. " has no Pokemon left to battle!"}
        return result
    end
    
    -- For single battles, switch in first available Pokemon
    if battleState.battleType == BattleStateManager.BattleType.SINGLE then
        if #availablePokemon > 0 then
            local pokemon = availablePokemon[1]
            local switchResult = PokemonSwitchSystem.performSwitch(
                battleState, playerId, nil, pokemon.id, 1
            )
            
            if switchResult then
                result.success = true
                table.insert(result.switches, {position = 1, pokemon = pokemon})
                table.insert(result.messages, "Go! " .. pokemon.name .. "!")
            end
        end
    
    -- For double battles, switch in up to two Pokemon
    elseif battleState.battleType == BattleStateManager.BattleType.DOUBLE then
        local switchCount = math.min(2, #availablePokemon)
        
        for i = 1, switchCount do
            local pokemon = availablePokemon[i]
            local switchResult = PokemonSwitchSystem.performSwitch(
                battleState, playerId, nil, pokemon.id, i
            )
            
            if switchResult then
                table.insert(result.switches, {position = i, pokemon = pokemon})
                table.insert(result.messages, "Go! " .. pokemon.name .. "!")
            end
        end
        
        result.success = #result.switches > 0
    end
    
    return result
end

-- Validate double battle switch positioning
-- @param battleState: Current battle state
-- @param playerId: Player performing switch
-- @param position: Target position (1 or 2)
-- @param targetPokemonId: Pokemon to switch to
-- @return: Position validation result
function PokemonSwitchSystem.validateDoublePosition(battleState, playerId, position, targetPokemonId)
    if battleState.battleType ~= BattleStateManager.BattleType.DOUBLE then
        return {valid = true, message = "Single battle - position validation not needed"}
    end
    
    if position ~= 1 and position ~= 2 then
        return {
            valid = false,
            error = "invalid_position",
            message = "Position must be 1 or 2 for double battles"
        }
    end
    
    -- Check if target Pokemon is already active in other position
    local activeIds = playerId == "player" and battleState.activePlayer or battleState.activeEnemy
    local otherPosition = position == 1 and 2 or 1
    
    if activeIds[otherPosition] == targetPokemonId then
        return {
            valid = false,
            error = PokemonSwitchSystem.ValidationError.POSITION_OCCUPIED,
            message = "Pokemon is already active in another position"
        }
    end
    
    return {valid = true, message = "Position is valid"}
end

return PokemonSwitchSystem