-- Battle State Manager
-- Manages active Pokemon, battle state transitions, and Pokemon status persistence
-- Integrates with turn processor and provides battle state consistency
-- Handles battle state serialization for session persistence and replay

local BattleStateManager = {}

-- Load dependencies
local BattleConditions = require("game-logic.battle.battle-conditions")
local BattleRNG = require("game-logic.rng.battle-rng")

-- Battle state types
BattleStateManager.BattlePhase = {
    COMMAND_SELECTION = 1,
    EXECUTING_TURN = 2,
    END_OF_TURN = 3,
    BATTLE_END = 4
}

BattleStateManager.BattleType = {
    SINGLE = "single",
    DOUBLE = "double",
    TRIPLE = "triple",
    ROTATION = "rotation"
}

-- Battle constants
BattleStateManager.Constants = {
    MAX_DOUBLE_BATTLE_POKEMON = 2,
    MAX_STAT_STAGE = 6,
    MIN_STAT_STAGE = -6,
    DEFAULT_LEVEL = 50,
    DEFAULT_HP = 100
}

-- Initialize battle state manager
-- @param battleId: Unique battle identifier
-- @param battleType: Battle format (single/double)
-- @param battleSeed: Deterministic RNG seed
-- @return: Success status
function BattleStateManager.init(battleId, battleType, battleSeed)
    if not battleId then
        return false, "Battle ID required for state manager initialization"
    end
    
    BattleStateManager.battleId = battleId
    BattleStateManager.battleType = battleType or BattleStateManager.BattleType.SINGLE
    BattleStateManager.battleSeed = battleSeed
    
    return true, "Battle state manager initialized"
end

-- Create new battle state structure
-- @param battleId: Unique battle identifier  
-- @param battleSeed: Deterministic RNG seed
-- @param playerParty: Player's Pokemon party
-- @param enemyParty: Enemy's Pokemon party
-- @param battleType: Battle format (single/double)
-- @return: Complete battle state object
function BattleStateManager.createBattleState(battleId, battleSeed, playerParty, enemyParty, battleType)
    if not battleId or not battleSeed then
        return nil, "Invalid battle state creation parameters"
    end
    
    local battleState = {
        -- Core battle identifiers
        battleId = battleId,
        battleSeed = battleSeed,
        battleType = battleType or BattleStateManager.BattleType.SINGLE,
        
        -- Battle progression tracking
        turn = 0,
        phase = BattleStateManager.BattlePhase.COMMAND_SELECTION,
        
        -- Pokemon parties with full state tracking
        playerParty = BattleStateManager.initializeParty(playerParty, "player"),
        enemyParty = BattleStateManager.initializeParty(enemyParty, "enemy"),
        
        -- Active Pokemon tracking
        activePlayer = {},
        activeEnemy = {},
        
        -- Battle state persistence
        battleConditions = BattleStateManager.createBattleConditions(),
        turnHistory = {},
        battleEvents = {},
        
        -- Turn processing state
        turnOrder = {},
        currentAction = nil,
        pendingActions = {},
        interruptQueue = {},
        turnCommands = {},
        
        -- Battle result tracking
        battleResult = nil,
        battleStats = {
            startTime = os.time(),
            totalTurns = 0,
            totalDamageDealt = 0,
            pokemonFainted = 0
        },
        
        -- Multi-turn tracking
        multiTurnData = {},
        
        -- Battle participation tracking
        participationData = {}
    }
    
    -- Initialize active Pokemon for battle start
    BattleStateManager.initializeActivePokemon(battleState)
    
    return battleState, nil
end

-- Initialize Pokemon party with battle-specific data
-- @param party: Raw Pokemon party data
-- @param side: "player" or "enemy"
-- @return: Initialized party with battle data
function BattleStateManager.initializeParty(party, side)
    if not party then
        return {}
    end
    
    local initializedParty = {}
    
    for i, pokemon in ipairs(party) do
        if pokemon then
            local battlePokemon = {
                -- Core Pokemon data
                id = pokemon.id or (side .. "_pokemon_" .. i),
                name = pokemon.name or "Unknown",
                species = pokemon.species,
                level = pokemon.level or BattleStateManager.Constants.DEFAULT_LEVEL,
                
                -- Battle stats
                stats = pokemon.stats or {hp = BattleStateManager.Constants.DEFAULT_HP, attack = BattleStateManager.Constants.DEFAULT_HP, defense = BattleStateManager.Constants.DEFAULT_HP, spatk = BattleStateManager.Constants.DEFAULT_HP, spdef = BattleStateManager.Constants.DEFAULT_HP, speed = BattleStateManager.Constants.DEFAULT_HP},
                currentHP = pokemon.currentHP or pokemon.stats and pokemon.stats.hp or BattleStateManager.Constants.DEFAULT_HP,
                maxHP = pokemon.maxHP or pokemon.stats and pokemon.stats.hp or BattleStateManager.Constants.DEFAULT_HP,
                
                -- Status and conditions
                status = pokemon.status or nil,
                statusTurns = pokemon.statusTurns or nil,
                fainted = pokemon.fainted or false,
                
                -- Battle-specific data
                battleData = {
                    side = side,
                    partyIndex = i,
                    statStages = {atk = 0, def = 0, spa = 0, spd = 0, spe = 0, accuracy = 0, evasion = 0},
                    turnsSinceSwitchIn = 0,
                    damageThisTurn = 0,
                    healingThisTurn = 0,
                    moveUsedThisTurn = nil,
                    lastDamageSource = nil,
                    hasMoved = false
                },
                
                -- Pokemon moveset and ability
                moves = pokemon.moves or {},
                ability = pokemon.ability,
                item = pokemon.item,
                nature = pokemon.nature,
                
                -- Participation tracking
                participated = false,
                turnCount = 0,
                damageDealt = 0,
                damageTaken = 0
            }
            
            table.insert(initializedParty, battlePokemon)
        end
    end
    
    return initializedParty
end

-- Initialize active Pokemon for battle start
-- @param battleState: Battle state to initialize
function BattleStateManager.initializeActivePokemon(battleState)
    -- Find first non-fainted Pokemon for player
    for _, pokemon in ipairs(battleState.playerParty) do
        if pokemon.currentHP > 0 and not pokemon.fainted then
            battleState.activePlayer[1] = pokemon.id
            pokemon.battleData.turnsSinceSwitchIn = 0
            pokemon.participated = true
            break
        end
    end
    
    -- Find first non-fainted Pokemon for enemy
    for _, pokemon in ipairs(battleState.enemyParty) do
        if pokemon.currentHP > 0 and not pokemon.fainted then
            battleState.activeEnemy[1] = pokemon.id
            pokemon.battleData.turnsSinceSwitchIn = 0
            pokemon.participated = true
            break
        end
    end
    
    -- For double battles, initialize second Pokemon
    if battleState.battleType == BattleStateManager.BattleType.DOUBLE then
        local playerCount = 0
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon.currentHP > 0 and not pokemon.fainted then
                playerCount = playerCount + 1
                if playerCount == BattleStateManager.Constants.MAX_DOUBLE_BATTLE_POKEMON and not battleState.activePlayer[2] then
                    battleState.activePlayer[2] = pokemon.id
                    pokemon.battleData.turnsSinceSwitchIn = 0
                    pokemon.participated = true
                    break
                end
            end
        end
        
        local enemyCount = 0
        for _, pokemon in ipairs(battleState.enemyParty) do
            if pokemon.currentHP > 0 and not pokemon.fainted then
                enemyCount = enemyCount + 1
                if enemyCount == BattleStateManager.Constants.MAX_DOUBLE_BATTLE_POKEMON and not battleState.activeEnemy[2] then
                    battleState.activeEnemy[2] = pokemon.id
                    pokemon.battleData.turnsSinceSwitchIn = 0
                    pokemon.participated = true
                    break
                end
            end
        end
    end
end

-- Create initial battle conditions structure
-- @return: Battle conditions object
function BattleStateManager.createBattleConditions()
    return {
        weather = BattleConditions.WeatherType and BattleConditions.WeatherType.NONE or "none",
        weatherDuration = 0,
        terrain = BattleConditions.TerrainType and BattleConditions.TerrainType.NONE or "none",
        terrainDuration = 0,
        trickRoom = 0,
        tailwind = {[0] = 0, [1] = 0},
        gravity = 0,
        magicRoom = 0,
        wonderRoom = 0,
        entryHazards = {
            player = {spikes = 0, toxicSpikes = 0, stealthRock = false, stickyWeb = false},
            enemy = {spikes = 0, toxicSpikes = 0, stealthRock = false, stickyWeb = false}
        }
    }
end

-- Get active Pokemon for a side
-- @param battleState: Current battle state
-- @param side: "player" or "enemy"
-- @param position: Active position (1 for single, 1-2 for double)
-- @return: Active Pokemon object or nil
function BattleStateManager.getActivePokemon(battleState, side, position)
    if not battleState then
        return nil
    end
    
    position = position or 1
    local activePokemonId = nil
    
    if side == "player" then
        activePokemonId = battleState.activePlayer[position]
    elseif side == "enemy" then
        activePokemonId = battleState.activeEnemy[position]
    else
        return nil
    end
    
    if not activePokemonId then
        return nil
    end
    
    return BattleStateManager.findPokemonById(battleState, activePokemonId, side)
end

-- Get all active Pokemon for a side
-- @param battleState: Current battle state
-- @param side: "player" or "enemy"
-- @return: Array of active Pokemon
function BattleStateManager.getAllActivePokemon(battleState, side)
    if not battleState then
        return {}
    end
    
    local activePokemon = {}
    local activeIds = nil
    
    if side == "player" then
        activeIds = battleState.activePlayer
    elseif side == "enemy" then
        activeIds = battleState.activeEnemy
    else
        return {}
    end
    
    for position, pokemonId in pairs(activeIds) do
        if pokemonId then
            local pokemon = BattleStateManager.findPokemonById(battleState, pokemonId, side)
            if pokemon then
                pokemon.battlePosition = position
                table.insert(activePokemon, pokemon)
            end
        end
    end
    
    return activePokemon
end

-- Find Pokemon by ID in battle state
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon ID to find
-- @param side: Optional side hint for faster search
-- @return: Pokemon object or nil
function BattleStateManager.findPokemonById(battleState, pokemonId, side)
    if not battleState or not pokemonId then
        return nil
    end
    
    -- Search specific side if provided
    if side == "player" then
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon.id == pokemonId then
                return pokemon
            end
        end
    elseif side == "enemy" then
        for _, pokemon in ipairs(battleState.enemyParty) do
            if pokemon.id == pokemonId then
                return pokemon
            end
        end
    else
        -- Search both sides
        for _, pokemon in ipairs(battleState.playerParty) do
            if pokemon.id == pokemonId then
                return pokemon
            end
        end
        for _, pokemon in ipairs(battleState.enemyParty) do
            if pokemon.id == pokemonId then
                return pokemon
            end
        end
    end
    
    return nil
end

-- Update battle phase
-- @param battleState: Current battle state
-- @param newPhase: New battle phase
-- @return: Success status
function BattleStateManager.updateBattlePhase(battleState, newPhase)
    if not battleState then
        return false, "Invalid battle state"
    end
    
    local validPhases = {
        [BattleStateManager.BattlePhase.COMMAND_SELECTION] = true,
        [BattleStateManager.BattlePhase.EXECUTING_TURN] = true,
        [BattleStateManager.BattlePhase.END_OF_TURN] = true,
        [BattleStateManager.BattlePhase.BATTLE_END] = true
    }
    
    if not validPhases[newPhase] then
        return false, "Invalid battle phase"
    end
    
    local previousPhase = battleState.phase
    battleState.phase = newPhase
    
    -- Log phase transition
    table.insert(battleState.battleEvents, {
        type = "phase_change",
        from = previousPhase,
        to = newPhase,
        turn = battleState.turn,
        timestamp = os.time()
    })
    
    return true, "Battle phase updated"
end

-- Persist Pokemon status across battle state changes
-- @param battleState: Current battle state
-- @param pokemonId: Pokemon to update
-- @param statusUpdate: Status information to persist
-- @return: Success status
function BattleStateManager.persistPokemonStatus(battleState, pokemonId, statusUpdate)
    if not battleState or not pokemonId or not statusUpdate then
        return false, "Invalid status persistence parameters"
    end
    
    local pokemon = BattleStateManager.findPokemonById(battleState, pokemonId)
    if not pokemon then
        return false, "Pokemon not found for status persistence"
    end
    
    -- Update status condition
    if statusUpdate.status ~= nil then
        pokemon.status = statusUpdate.status
        pokemon.statusTurns = statusUpdate.statusTurns or nil
    end
    
    -- Update HP
    if statusUpdate.currentHP ~= nil then
        pokemon.currentHP = math.max(0, math.min(statusUpdate.currentHP, pokemon.maxHP))
        if pokemon.currentHP <= 0 and not pokemon.fainted then
            pokemon.fainted = true
        end
    end
    
    -- Update stat stages
    if statusUpdate.statStages then
        for stat, value in pairs(statusUpdate.statStages) do
            if pokemon.battleData.statStages[stat] then
                pokemon.battleData.statStages[stat] = math.max(BattleStateManager.Constants.MIN_STAT_STAGE, math.min(BattleStateManager.Constants.MAX_STAT_STAGE, value))
            end
        end
    end
    
    -- Update battle-specific data
    if statusUpdate.battleData then
        for key, value in pairs(statusUpdate.battleData) do
            pokemon.battleData[key] = value
        end
    end
    
    return true, "Pokemon status persisted successfully"
end

-- Serialize battle state for persistence
-- @param battleState: Battle state to serialize
-- @return: Serialized battle state data
function BattleStateManager.serializeBattleState(battleState)
    if not battleState then
        return nil, "Invalid battle state for serialization"
    end
    
    local serializedState = {
        -- Core identifiers
        battleId = battleState.battleId,
        battleSeed = battleState.battleSeed,
        battleType = battleState.battleType,
        
        -- Battle progress
        turn = battleState.turn,
        phase = battleState.phase,
        
        -- Pokemon parties (without functions)
        playerParty = BattleStateManager.serializeParty(battleState.playerParty),
        enemyParty = BattleStateManager.serializeParty(battleState.enemyParty),
        
        -- Active Pokemon tracking
        activePlayer = battleState.activePlayer,
        activeEnemy = battleState.activeEnemy,
        
        -- Battle conditions
        battleConditions = battleState.battleConditions,
        
        -- Turn state
        turnOrder = battleState.turnOrder,
        pendingActions = battleState.pendingActions,
        interruptQueue = battleState.interruptQueue,
        
        -- Results and stats
        battleResult = battleState.battleResult,
        battleStats = battleState.battleStats,
        
        -- Multi-turn and participation
        multiTurnData = battleState.multiTurnData,
        participationData = battleState.participationData,
        
        -- Serialization metadata
        serializedAt = os.time(),
        version = "1.0"
    }
    
    return serializedState, nil
end

-- Deserialize battle state from persistence
-- @param serializedData: Serialized battle state data
-- @return: Restored battle state object
function BattleStateManager.deserializeBattleState(serializedData)
    if not serializedData then
        return nil, "Invalid serialized data for deserialization"
    end
    
    local battleState = {
        -- Core identifiers
        battleId = serializedData.battleId,
        battleSeed = serializedData.battleSeed,
        battleType = serializedData.battleType or BattleStateManager.BattleType.SINGLE,
        
        -- Battle progress
        turn = serializedData.turn or 0,
        phase = serializedData.phase or BattleStateManager.BattlePhase.COMMAND_SELECTION,
        
        -- Pokemon parties
        playerParty = BattleStateManager.deserializeParty(serializedData.playerParty),
        enemyParty = BattleStateManager.deserializeParty(serializedData.enemyParty),
        
        -- Active Pokemon tracking
        activePlayer = serializedData.activePlayer or {},
        activeEnemy = serializedData.activeEnemy or {},
        
        -- Battle conditions
        battleConditions = serializedData.battleConditions or BattleStateManager.createBattleConditions(),
        
        -- Turn state
        turnOrder = serializedData.turnOrder or {},
        currentAction = nil,
        pendingActions = serializedData.pendingActions or {},
        interruptQueue = serializedData.interruptQueue or {},
        turnCommands = {},
        
        -- History and events
        turnHistory = serializedData.turnHistory or {},
        battleEvents = serializedData.battleEvents or {},
        
        -- Results and stats
        battleResult = serializedData.battleResult,
        battleStats = serializedData.battleStats or {
            startTime = os.time(),
            totalTurns = 0,
            totalDamageDealt = 0,
            pokemonFainted = 0
        },
        
        -- Multi-turn and participation
        multiTurnData = serializedData.multiTurnData or {},
        participationData = serializedData.participationData or {}
    }
    
    return battleState, nil
end

-- Serialize party for persistence
-- @param party: Pokemon party to serialize
-- @return: Serialized party data
function BattleStateManager.serializeParty(party)
    if not party then
        return {}
    end
    
    local serializedParty = {}
    
    for _, pokemon in ipairs(party) do
        table.insert(serializedParty, {
            -- Core Pokemon data
            id = pokemon.id,
            name = pokemon.name,
            species = pokemon.species,
            level = pokemon.level,
            
            -- Battle stats
            stats = pokemon.stats,
            currentHP = pokemon.currentHP,
            maxHP = pokemon.maxHP,
            
            -- Status and conditions
            status = pokemon.status,
            statusTurns = pokemon.statusTurns,
            fainted = pokemon.fainted,
            
            -- Battle-specific data
            battleData = pokemon.battleData,
            
            -- Pokemon data
            moves = pokemon.moves,
            ability = pokemon.ability,
            item = pokemon.item,
            nature = pokemon.nature,
            
            -- Participation
            participated = pokemon.participated,
            turnCount = pokemon.turnCount,
            damageDealt = pokemon.damageDealt,
            damageTaken = pokemon.damageTaken
        })
    end
    
    return serializedParty
end

-- Deserialize party from persistence
-- @param serializedParty: Serialized party data
-- @return: Restored party object
function BattleStateManager.deserializeParty(serializedParty)
    if not serializedParty then
        return {}
    end
    
    local party = {}
    
    for _, pokemonData in ipairs(serializedParty) do
        table.insert(party, {
            -- Core Pokemon data
            id = pokemonData.id,
            name = pokemonData.name,
            species = pokemonData.species,
            level = pokemonData.level,
            
            -- Battle stats
            stats = pokemonData.stats,
            currentHP = pokemonData.currentHP,
            maxHP = pokemonData.maxHP,
            
            -- Status and conditions
            status = pokemonData.status,
            statusTurns = pokemonData.statusTurns,
            fainted = pokemonData.fainted or false,
            
            -- Battle-specific data
            battleData = pokemonData.battleData or {
                statStages = {atk = 0, def = 0, spa = 0, spd = 0, spe = 0, accuracy = 0, evasion = 0},
                turnsSinceSwitchIn = 0,
                damageThisTurn = 0,
                healingThisTurn = 0
            },
            
            -- Pokemon data
            moves = pokemonData.moves,
            ability = pokemonData.ability,
            item = pokemonData.item,
            nature = pokemonData.nature,
            
            -- Participation
            participated = pokemonData.participated or false,
            turnCount = pokemonData.turnCount or 0,
            damageDealt = pokemonData.damageDealt or 0,
            damageTaken = pokemonData.damageTaken or 0
        })
    end
    
    return party
end

-- Reset turn-specific battle data
-- @param battleState: Current battle state
function BattleStateManager.resetTurnData(battleState)
    if not battleState then
        return
    end
    
    -- Reset turn-specific data for all Pokemon
    local allPokemon = {}
    for _, pokemon in ipairs(battleState.playerParty) do
        table.insert(allPokemon, pokemon)
    end
    for _, pokemon in ipairs(battleState.enemyParty) do
        table.insert(allPokemon, pokemon)
    end
    
    for _, pokemon in ipairs(allPokemon) do
        if pokemon.battleData then
            pokemon.battleData.damageThisTurn = 0
            pokemon.battleData.healingThisTurn = 0
            pokemon.battleData.moveUsedThisTurn = nil
            pokemon.battleData.hasMoved = false
            pokemon.battleData.turnsSinceSwitchIn = pokemon.battleData.turnsSinceSwitchIn + 1
        end
    end
end

-- Validate battle state consistency
-- @param battleState: Battle state to validate
-- @return: Validation result
function BattleStateManager.validateBattleState(battleState)
    if not battleState then
        return false, "No battle state provided"
    end
    
    -- Check required fields
    if not battleState.battleId then
        return false, "Missing battle ID"
    end
    
    if not battleState.playerParty or not battleState.enemyParty then
        return false, "Missing Pokemon parties"
    end
    
    -- Validate active Pokemon
    for _, pokemonId in pairs(battleState.activePlayer) do
        local pokemon = BattleStateManager.findPokemonById(battleState, pokemonId, "player")
        if not pokemon then
            return false, "Invalid active player Pokemon: " .. tostring(pokemonId)
        end
        if pokemon.currentHP <= 0 then
            return false, "Active player Pokemon is fainted: " .. tostring(pokemonId)
        end
    end
    
    for _, pokemonId in pairs(battleState.activeEnemy) do
        local pokemon = BattleStateManager.findPokemonById(battleState, pokemonId, "enemy")
        if not pokemon then
            return false, "Invalid active enemy Pokemon: " .. tostring(pokemonId)
        end
        if pokemon.currentHP <= 0 then
            return false, "Active enemy Pokemon is fainted: " .. tostring(pokemonId)
        end
    end
    
    return true, "Battle state is valid"
end

return BattleStateManager