-- Battle State Manager for Multi-Turn Testing Scenarios
-- Manages complex battle states and sequences for comprehensive testing

local BattleStateManager = {}
BattleStateManager.__index = BattleStateManager

function BattleStateManager.new()
    local manager = setmetatable({}, BattleStateManager)
    manager.battles = {}
    manager.battleHistory = {}
    manager.stateSnapshots = {}
    return manager
end

-- Battle State Structure
function BattleStateManager:createBattle(config)
    local battleId = config.battleId or ("battle-" .. os.time() .. "-" .. math.random(1000))
    
    local battle = {
        id = battleId,
        players = config.players or {"player1", "player2"},
        gameMode = config.gameMode or "singles",
        battleType = config.battleType or "standard",
        seed = config.seed or battleId .. "-seed",
        
        -- Battle state
        turn = 1,
        phase = "start", -- start, action-selection, execution, end
        currentPlayer = 1,
        weather = config.weather or "none",
        terrain = config.terrain or "none",
        
        -- Player states
        playerStates = {},
        
        -- Turn history
        turnHistory = {},
        actionQueue = {},
        
        -- Battle conditions
        conditions = {
            maxTurns = config.maxTurns or 100,
            timeLimit = config.timeLimit or 600, -- 10 minutes
            allowSwitching = config.allowSwitching ~= false,
            allowItems = config.allowItems ~= false
        },
        
        -- Timestamps
        startTime = os.time(),
        lastActionTime = os.time(),
        endTime = nil
    }
    
    -- Initialize player states
    for i, playerId in ipairs(battle.players) do
        battle.playerStates[playerId] = {
            playerId = playerId,
            position = i,
            team = config.teams and config.teams[i] or self:createDefaultTeam(playerId),
            activePokemon = 0, -- Index of active Pokemon
            actionThisTurn = nil,
            consecutiveTurns = 0,
            items = config.items and config.items[i] or {},
            status = "active" -- active, defeated, disconnected
        }
    end
    
    self.battles[battleId] = battle
    return battle
end

function BattleStateManager:createDefaultTeam(playerId)
    -- Create a default team for testing
    return {
        {
            id = 1,
            species = "Pikachu",
            level = 50,
            hp = 100,
            maxHp = 100,
            stats = {attack = 90, defense = 80, speed = 120, spAttack = 100, spDefense = 85},
            moves = {
                {id = 85, name = "Thunderbolt", pp = 15, maxPp = 15, type = "Electric"},
                {id = 86, name = "Thunder Wave", pp = 20, maxPp = 20, type = "Electric"},
                {id = 33, name = "Tackle", pp = 35, maxPp = 35, type = "Normal"},
                {id = 45, name = "Growl", pp = 40, maxPp = 40, type = "Normal"}
            },
            status = "healthy", -- healthy, poisoned, paralyzed, burned, frozen, asleep
            statusTurns = 0,
            position = 0
        },
        
        {
            id = 2,
            species = "Charmander",
            level = 45,
            hp = 95,
            maxHp = 95,
            stats = {attack = 85, defense = 70, speed = 95, spAttack = 85, spDefense = 75},
            moves = {
                {id = 52, name = "Ember", pp = 25, maxPp = 25, type = "Fire"},
                {id = 53, name = "Flamethrower", pp = 15, maxPp = 15, type = "Fire"},
                {id = 10, name = "Scratch", pp = 35, maxPp = 35, type = "Normal"},
                {id = 43, name = "Leer", pp = 30, maxPp = 30, type = "Normal"}
            },
            status = "healthy",
            statusTurns = 0,
            position = 1
        }
    }
end

-- Battle State Management
function BattleStateManager:getBattle(battleId)
    return self.battles[battleId]
end

function BattleStateManager:updateBattleState(battleId, updates)
    local battle = self.battles[battleId]
    if not battle then
        error("Battle not found: " .. battleId)
    end
    
    -- Create state snapshot before update
    self:createStateSnapshot(battleId, "before_update")
    
    -- Apply updates
    for key, value in pairs(updates) do
        if key == "playerStates" then
            for playerId, playerUpdates in pairs(value) do
                if battle.playerStates[playerId] then
                    for playerKey, playerValue in pairs(playerUpdates) do
                        battle.playerStates[playerId][playerKey] = playerValue
                    end
                end
            end
        else
            battle[key] = value
        end
    end
    
    battle.lastActionTime = os.time()
    
    -- Create state snapshot after update
    self:createStateSnapshot(battleId, "after_update")
    
    return battle
end

function BattleStateManager:processAction(battleId, playerId, action)
    local battle = self.battles[battleId]
    if not battle then
        error("Battle not found: " .. battleId)
    end
    
    local playerState = battle.playerStates[playerId]
    if not playerState then
        error("Player not found in battle: " .. playerId)
    end
    
    -- Validate action
    local valid, error = self:validateAction(battle, playerId, action)
    if not valid then
        return {success = false, error = error}
    end
    
    -- Queue action
    table.insert(battle.actionQueue, {
        playerId = playerId,
        action = action,
        priority = self:calculateActionPriority(battle, playerId, action),
        timestamp = os.time()
    })
    
    playerState.actionThisTurn = action
    
    -- Check if all players have submitted actions
    local allActionsSubmitted = true
    for _, player in pairs(battle.playerStates) do
        if player.status == "active" and not player.actionThisTurn then
            allActionsSubmitted = false
            break
        end
    end
    
    if allActionsSubmitted then
        return self:executeTurn(battleId)
    else
        return {success = true, message = "Action queued, waiting for other players"}
    end
end

function BattleStateManager:validateAction(battle, playerId, action)
    local playerState = battle.playerStates[playerId]
    
    -- Check if player can act
    if playerState.status ~= "active" then
        return false, "Player is not active in battle"
    end
    
    -- Check if action is valid for current phase
    if battle.phase ~= "action-selection" then
        return false, "Actions can only be submitted during action selection phase"
    end
    
    -- Validate action type
    if action.type == "move" then
        local pokemon = playerState.team[playerState.activePokemon + 1]
        if not pokemon then
            return false, "No active Pokemon"
        end
        
        local move = pokemon.moves[action.moveIndex]
        if not move then
            return false, "Invalid move index"
        end
        
        if move.pp <= 0 then
            return false, "Move has no PP remaining"
        end
        
    elseif action.type == "switch" then
        if not battle.conditions.allowSwitching then
            return false, "Switching is not allowed in this battle"
        end
        
        local targetPokemon = playerState.team[action.pokemonIndex]
        if not targetPokemon then
            return false, "Invalid Pokemon index"
        end
        
        if targetPokemon.hp <= 0 then
            return false, "Cannot switch to fainted Pokemon"
        end
        
        if action.pokemonIndex == playerState.activePokemon + 1 then
            return false, "Pokemon is already active"
        end
        
    elseif action.type == "item" then
        if not battle.conditions.allowItems then
            return false, "Items are not allowed in this battle"
        end
        
        local item = playerState.items[action.itemId]
        if not item or item.quantity <= 0 then
            return false, "Item not available"
        end
        
    else
        return false, "Invalid action type: " .. tostring(action.type)
    end
    
    return true
end

function BattleStateManager:calculateActionPriority(battle, playerId, action)
    local playerState = battle.playerStates[playerId]
    local pokemon = playerState.team[playerState.activePokemon + 1]
    
    -- Base priority by action type
    local basePriority = 0
    if action.type == "switch" then
        basePriority = 6 -- Switches have highest priority
    elseif action.type == "item" then
        basePriority = 5 -- Items have high priority
    elseif action.type == "move" then
        local move = pokemon.moves[action.moveIndex]
        basePriority = move.priority or 0 -- Move-specific priority
    end
    
    -- Add Pokemon speed as tiebreaker
    local speed = pokemon and pokemon.stats.speed or 0
    
    return basePriority * 1000 + speed
end

function BattleStateManager:executeTurn(battleId)
    local battle = self.battles[battleId]
    
    -- Create turn snapshot
    self:createStateSnapshot(battleId, "turn_start_" .. battle.turn)
    
    battle.phase = "execution"
    
    -- Sort actions by priority
    table.sort(battle.actionQueue, function(a, b)
        return a.priority > b.priority
    end)
    
    local turnResult = {
        turn = battle.turn,
        actions = {},
        effects = {},
        stateChanges = {},
        battleEnded = false,
        winner = nil
    }
    
    -- Execute each action in priority order
    for _, queuedAction in ipairs(battle.actionQueue) do
        local actionResult = self:executeAction(battle, queuedAction.playerId, queuedAction.action)
        table.insert(turnResult.actions, actionResult)
        
        -- Check for battle end conditions after each action
        local battleEnd = self:checkBattleEndConditions(battle)
        if battleEnd.ended then
            turnResult.battleEnded = true
            turnResult.winner = battleEnd.winner
            battle.phase = "end"
            battle.endTime = os.time()
            break
        end
    end
    
    -- Apply end-of-turn effects if battle continues
    if not turnResult.battleEnded then
        local endTurnEffects = self:applyEndOfTurnEffects(battle)
        turnResult.effects = endTurnEffects
        
        -- Check for battle end after status effects
        local battleEnd = self:checkBattleEndConditions(battle)
        if battleEnd.ended then
            turnResult.battleEnded = true
            turnResult.winner = battleEnd.winner
            battle.phase = "end"
            battle.endTime = os.time()
        end
    end
    
    -- Clean up for next turn
    if not turnResult.battleEnded then
        self:preparNextTurn(battle)
    end
    
    -- Store turn in history
    table.insert(battle.turnHistory, turnResult)
    
    -- Create final turn snapshot
    self:createStateSnapshot(battleId, "turn_end_" .. battle.turn)
    
    return {
        success = true,
        turnResult = turnResult,
        battleState = self:getBattleState(battleId)
    }
end

function BattleStateManager:executeAction(battle, playerId, action)
    local playerState = battle.playerStates[playerId]
    local pokemon = playerState.team[playerState.activePokemon + 1]
    
    local actionResult = {
        playerId = playerId,
        action = action,
        success = false,
        effects = {},
        damage = 0,
        critical = false,
        effectiveness = 1.0,
        message = ""
    }
    
    if action.type == "move" then
        local move = pokemon.moves[action.moveIndex]
        actionResult = self:executeMove(battle, playerId, move, action.targetId)
        
    elseif action.type == "switch" then
        actionResult = self:executeSwitch(battle, playerId, action.pokemonIndex)
        
    elseif action.type == "item" then
        actionResult = self:executeItem(battle, playerId, action.itemId, action.targetId)
    end
    
    return actionResult
end

function BattleStateManager:executeMove(battle, playerId, move, targetId)
    -- Simplified move execution for testing
    local damage = math.random(20, 80) -- Simplified damage calculation
    local critical = math.random() < 0.0625 -- 1/16 chance for critical
    
    if critical then
        damage = math.floor(damage * 1.5)
    end
    
    -- Apply damage to target
    local targetPlayer = battle.players[targetId] or battle.players[1]
    local targetState = battle.playerStates[targetPlayer]
    if targetState then
        local targetPokemon = targetState.team[targetState.activePokemon + 1]
        if targetPokemon then
            targetPokemon.hp = math.max(0, targetPokemon.hp - damage)
        end
    end
    
    -- Reduce PP
    move.pp = math.max(0, move.pp - 1)
    
    return {
        playerId = playerId,
        action = {type = "move", moveId = move.id, moveName = move.name},
        success = true,
        damage = damage,
        critical = critical,
        effectiveness = 1.0,
        message = string.format("%s used %s! It dealt %d damage%s!", 
                               playerId, move.name, damage, critical and " (Critical hit!)" or "")
    }
end

function BattleStateManager:executeSwitch(battle, playerId, pokemonIndex)
    local playerState = battle.playerStates[playerId]
    
    playerState.activePokemon = pokemonIndex - 1
    
    local newPokemon = playerState.team[pokemonIndex]
    
    return {
        playerId = playerId,
        action = {type = "switch", pokemonIndex = pokemonIndex},
        success = true,
        message = string.format("%s switched to %s!", playerId, newPokemon.species)
    }
end

function BattleStateManager:executeItem(battle, playerId, itemId, targetId)
    -- Simplified item execution
    return {
        playerId = playerId,
        action = {type = "item", itemId = itemId},
        success = true,
        message = string.format("%s used an item!", playerId)
    }
end

function BattleStateManager:applyEndOfTurnEffects(battle)
    local effects = {}
    
    -- Apply status effects, weather damage, etc.
    for playerId, playerState in pairs(battle.playerStates) do
        local pokemon = playerState.team[playerState.activePokemon + 1]
        if pokemon and pokemon.status ~= "healthy" then
            local effect = self:applyStatusEffect(pokemon)
            if effect then
                table.insert(effects, effect)
            end
        end
    end
    
    return effects
end

function BattleStateManager:applyStatusEffect(pokemon)
    if pokemon.status == "poisoned" then
        local damage = math.floor(pokemon.maxHp / 8)
        pokemon.hp = math.max(0, pokemon.hp - damage)
        return {
            type = "poison",
            damage = damage,
            message = pokemon.species .. " is hurt by poison!"
        }
    end
    
    return nil
end

function BattleStateManager:checkBattleEndConditions(battle)
    -- Check if any player has no usable Pokemon
    for playerId, playerState in pairs(battle.playerStates) do
        local hasUsablePokemon = false
        for _, pokemon in ipairs(playerState.team) do
            if pokemon.hp > 0 then
                hasUsablePokemon = true
                break
            end
        end
        
        if not hasUsablePokemon then
            -- Find winner (other active player)
            for otherPlayerId, otherState in pairs(battle.playerStates) do
                if otherPlayerId ~= playerId and otherState.status == "active" then
                    return {ended = true, winner = otherPlayerId, reason = "all_pokemon_fainted"}
                end
            end
        end
    end
    
    -- Check turn limit
    if battle.turn >= battle.conditions.maxTurns then
        return {ended = true, winner = nil, reason = "turn_limit_reached"}
    end
    
    -- Check time limit
    if os.time() - battle.startTime > battle.conditions.timeLimit then
        return {ended = true, winner = nil, reason = "time_limit_reached"}
    end
    
    return {ended = false}
end

function BattleStateManager:preparNextTurn(battle)
    -- Clear action queue
    battle.actionQueue = {}
    
    -- Clear player actions
    for _, playerState in pairs(battle.playerStates) do
        playerState.actionThisTurn = nil
    end
    
    -- Increment turn
    battle.turn = battle.turn + 1
    battle.phase = "action-selection"
end

-- State Snapshots
function BattleStateManager:createStateSnapshot(battleId, label)
    local battle = self.battles[battleId]
    if not battle then
        return
    end
    
    local snapshot = {
        battleId = battleId,
        label = label,
        timestamp = os.time(),
        turn = battle.turn,
        phase = battle.phase,
        playerStates = self:deepCopy(battle.playerStates),
        weather = battle.weather,
        terrain = battle.terrain
    }
    
    if not self.stateSnapshots[battleId] then
        self.stateSnapshots[battleId] = {}
    end
    
    table.insert(self.stateSnapshots[battleId], snapshot)
    return snapshot
end

function BattleStateManager:getStateSnapshots(battleId, label)
    local snapshots = self.stateSnapshots[battleId] or {}
    
    if label then
        local filtered = {}
        for _, snapshot in ipairs(snapshots) do
            if snapshot.label == label then
                table.insert(filtered, snapshot)
            end
        end
        return filtered
    end
    
    return snapshots
end

function BattleStateManager:compareSnapshots(snapshot1, snapshot2)
    local differences = {
        turn = snapshot1.turn ~= snapshot2.turn,
        phase = snapshot1.phase ~= snapshot2.phase,
        playerChanges = {}
    }
    
    -- Compare player states
    for playerId, state1 in pairs(snapshot1.playerStates) do
        local state2 = snapshot2.playerStates[playerId]
        if state2 then
            local playerDiff = {}
            
            -- Compare team (simplified)
            for i, pokemon1 in ipairs(state1.team) do
                local pokemon2 = state2.team[i]
                if pokemon2 and pokemon1.hp ~= pokemon2.hp then
                    playerDiff.hpChange = {
                        pokemon = i,
                        from = pokemon1.hp,
                        to = pokemon2.hp
                    }
                end
            end
            
            if next(playerDiff) then
                differences.playerChanges[playerId] = playerDiff
            end
        end
    end
    
    return differences
end

-- Utility Functions
function BattleStateManager:getBattleState(battleId)
    local battle = self.battles[battleId]
    if not battle then
        return nil
    end
    
    return {
        id = battle.id,
        turn = battle.turn,
        phase = battle.phase,
        players = battle.players,
        currentPlayer = battle.currentPlayer,
        weather = battle.weather,
        terrain = battle.terrain,
        actionQueue = #battle.actionQueue,
        turnHistory = #battle.turnHistory,
        isEnded = battle.phase == "end",
        duration = battle.endTime and (battle.endTime - battle.startTime) or (os.time() - battle.startTime)
    }
end

function BattleStateManager:deepCopy(orig)
    local orig_type = type(orig)
    local copy
    if orig_type == 'table' then
        copy = {}
        for orig_key, orig_value in pairs(orig) do
            copy[orig_key] = self:deepCopy(orig_value)
        end
    else
        copy = orig
    end
    return copy
end

return BattleStateManager