-- Battle Process State Manager
-- Extracted and adapted for dedicated battle process with inter-process coordination
-- Manages battle state synchronization, persistence, and coordination with other processes
-- Epic 32.3: Battle Engine Process Extraction

local BattleStateManager = {}

-- Load inter-process communication components
local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local MessageRouter = require("game-logic.process-coordination.message-router")

-- Load battle dependencies
local BattleRNG = require("game-logic.rng.battle-rng")
local Enums = require("data.constants.enums")

-- Battle state storage
local BattleStates = {}
local StateHistory = {}
local SynchronizationQueue = {}

-- Configuration
local CONFIG = {
    maxStateHistory = 1000,
    syncInterval = 100, -- milliseconds
    stateBackupInterval = 10000, -- 10 seconds
    maxConcurrentBattles = 100
}

-- Battle state status enumeration
BattleStateManager.StateStatus = {
    INITIALIZING = "INITIALIZING",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    ERROR = "ERROR",
    SYNCHRONIZING = "SYNCHRONIZING"
}

-- Initialize the battle state manager
function BattleStateManager.initialize()
    BattleStates = {}
    StateHistory = {}
    SynchronizationQueue = {}
    
    print("[BattleStateManager] State manager initialized")
    return {
        success = true,
        maxConcurrentBattles = CONFIG.maxConcurrentBattles
    }
end

-- Create new battle state with inter-process coordination
-- @param battleId: Unique battle identifier
-- @param battleParams: Battle initialization parameters
-- @param coordinatorId: Coordinator process ID for synchronization
-- @return: Created battle state or error
function BattleStateManager.createBattleState(battleId, battleParams, coordinatorId)
    if not battleId or not battleParams then
        return nil, "Invalid battle state creation parameters"
    end
    
    if BattleStates[battleId] then
        return nil, "Battle state already exists"
    end
    
    -- Check concurrent battle limit
    local activeBattles = 0
    for _, state in pairs(BattleStates) do
        if state.status ~= BattleStateManager.StateStatus.COMPLETED then
            activeBattles = activeBattles + 1
        end
    end
    
    if activeBattles >= CONFIG.maxConcurrentBattles then
        return nil, "Maximum concurrent battles reached"
    end
    
    -- Create correlation for coordinator communication
    local correlationId = MessageCorrelator.createCorrelation(
        ao.id,
        coordinatorId,
        "BATTLE_STATE_SYNC",
        nil
    )
    
    -- Initialize battle state
    local battleState = {
        battleId = battleId,
        status = BattleStateManager.StateStatus.INITIALIZING,
        coordinatorId = coordinatorId,
        correlationId = correlationId,
        createdAt = 0,
        lastUpdated = 0,
        lastSyncTime = 0,
        
        -- Battle data
        battleSeed = battleParams.battleSeed or BattleRNG.generateSeed(),
        battleType = battleParams.battleType or "WILD",
        turn = 0,
        phase = "COMMAND_SELECTION",
        
        -- Pokemon parties
        playerParty = battleParams.playerParty or {},
        enemyParty = battleParams.enemyParty or {},
        activePlayerPokemon = {},
        activeEnemyPokemon = {},
        
        -- Battle conditions
        battleConditions = {
            weather = nil,
            weatherTurns = 0,
            terrain = nil,
            terrainTurns = 0,
            fieldEffects = {},
            sideConditions = {
                player = {},
                enemy = {}
            }
        },
        
        -- Turn data
        turnCommands = {},
        turnOrder = {},
        currentAction = nil,
        pendingActions = {},
        
        -- Battle result
        battleResult = nil,
        
        -- Synchronization data
        syncVersion = 1,
        pendingUpdates = {},
        lastStateHash = nil
    }
    
    -- Set initial active Pokemon
    if battleState.playerParty and #battleState.playerParty > 0 then
        table.insert(battleState.activePlayerPokemon, battleState.playerParty[1])
    end
    
    if battleState.enemyParty and #battleState.enemyParty > 0 then
        table.insert(battleState.activeEnemyPokemon, battleState.enemyParty[1])
    end
    
    -- Generate state hash for synchronization
    battleState.lastStateHash = BattleStateManager.generateStateHash(battleState)
    
    -- Store battle state
    BattleStates[battleId] = battleState
    
    -- Initialize state history
    StateHistory[battleId] = {
        {
            turn = 0,
            timestamp = msg.Timestamp,
            stateSnapshot = BattleStateManager.createStateSnapshot(battleState),
            action = "BATTLE_INITIALIZED"
        }
    }
    
    -- Mark as active
    battleState.status = BattleStateManager.StateStatus.ACTIVE
    battleState.lastUpdated = 0
    
    print("[BattleStateManager] Battle state created: " .. battleId)
    
    return battleState, nil
end

-- Get battle state by ID
-- @param battleId: Battle identifier
-- @return: Battle state if found
function BattleStateManager.getBattleState(battleId)
    if not battleId then
        return nil
    end
    
    return BattleStates[battleId]
end

-- Update battle state and track changes
-- @param battleId: Battle identifier
-- @param updates: State updates to apply
-- @param actionDescription: Description of the action causing the update
-- @return: Success status and updated state
function BattleStateManager.updateBattleState(battleId, updates, actionDescription)
    if not battleId or not updates then
        return false, "Invalid update parameters"
    end
    
    local battleState = BattleStates[battleId]
    if not battleState then
        return false, "Battle state not found"
    end
    
    -- Apply updates
    for key, value in pairs(updates) do
        if key ~= "battleId" and key ~= "createdAt" and key ~= "correlationId" then
            battleState[key] = value
        end
    end
    
    -- Update metadata
    battleState.lastUpdated = 0
    battleState.syncVersion = battleState.syncVersion + 1
    
    -- Generate new state hash
    local newStateHash = BattleStateManager.generateStateHash(battleState)
    local stateChanged = newStateHash ~= battleState.lastStateHash
    battleState.lastStateHash = newStateHash
    
    -- Add to state history if state actually changed
    if stateChanged then
        BattleStateManager.addStateHistory(battleId, actionDescription or "STATE_UPDATE")
        
        -- Queue for synchronization with coordinator
        BattleStateManager.queueStateSync(battleId)
    end
    
    return true, battleState
end

-- Create state snapshot for history
-- @param battleState: Current battle state
-- @return: State snapshot
function BattleStateManager.createStateSnapshot(battleState)
    local snapshot = {
        turn = battleState.turn,
        phase = battleState.phase,
        status = battleState.status,
        battleConditions = battleState.battleConditions,
        activePlayerPokemon = {},
        activeEnemyPokemon = {},
        syncVersion = battleState.syncVersion
    }
    
    -- Copy active Pokemon data
    for _, pokemon in ipairs(battleState.activePlayerPokemon) do
        table.insert(snapshot.activePlayerPokemon, {
            id = pokemon.id,
            hp = pokemon.hp,
            status = pokemon.status,
            statStages = pokemon.statStages
        })
    end
    
    for _, pokemon in ipairs(battleState.activeEnemyPokemon) do
        table.insert(snapshot.activeEnemyPokemon, {
            id = pokemon.id,
            hp = pokemon.hp,
            status = pokemon.status,
            statStages = pokemon.statStages
        })
    end
    
    return snapshot
end

-- Add entry to state history
-- @param battleId: Battle identifier
-- @param actionDescription: Description of the action
function BattleStateManager.addStateHistory(battleId, actionDescription)
    local battleState = BattleStates[battleId]
    if not battleState then
        return
    end
    
    if not StateHistory[battleId] then
        StateHistory[battleId] = {}
    end
    
    local historyEntry = {
        turn = battleState.turn,
        timestamp = msg.Timestamp,
        stateSnapshot = BattleStateManager.createStateSnapshot(battleState),
        action = actionDescription,
        syncVersion = battleState.syncVersion
    }
    
    table.insert(StateHistory[battleId], historyEntry)
    
    -- Limit history size
    while #StateHistory[battleId] > CONFIG.maxStateHistory do
        table.remove(StateHistory[battleId], 1)
    end
end

-- Generate state hash for change detection
-- @param battleState: Battle state to hash
-- @return: State hash string
function BattleStateManager.generateStateHash(battleState)
    if not battleState then
        return ""
    end
    
    -- Create simplified state representation for hashing
    local hashData = {
        turn = battleState.turn,
        phase = battleState.phase,
        status = battleState.status,
        playerHp = {},
        enemyHp = {},
        conditions = battleState.battleConditions
    }
    
    -- Add Pokemon HP for change detection
    for _, pokemon in ipairs(battleState.activePlayerPokemon) do
        table.insert(hashData.playerHp, {id = pokemon.id, hp = pokemon.hp})
    end
    
    for _, pokemon in ipairs(battleState.activeEnemyPokemon) do
        table.insert(hashData.enemyHp, {id = pokemon.id, hp = pokemon.hp})
    end
    
    -- Simple hash generation (in production, use proper hashing)
    local hashString = json.encode(hashData)
    return tostring(#hashString) .. "_" .. tostring(0)
end

-- Queue battle state for synchronization with coordinator
-- @param battleId: Battle identifier
function BattleStateManager.queueStateSync(battleId)
    local battleState = BattleStates[battleId]
    if not battleState then
        return
    end
    
    SynchronizationQueue[battleId] = {
        battleId = battleId,
        queuedAt = 0,
        syncVersion = battleState.syncVersion,
        priority = 1
    }
end

-- Process state synchronization queue
-- @return: Number of states synchronized
function BattleStateManager.processStateSynchronization()
    local syncCount = 0
    local currentTime = 0
    
    for battleId, syncRequest in pairs(SynchronizationQueue) do
        local battleState = BattleStates[battleId]
        if battleState and battleState.coordinatorId then
            
            -- Check if sync is needed (version changed or time elapsed)
            local timeSinceLastSync = currentTime - battleState.lastSyncTime
            local versionChanged = battleState.syncVersion ~= syncRequest.syncVersion
            
            if timeSinceLastSync >= CONFIG.syncInterval or versionChanged then
                local success = BattleStateManager.synchronizeWithCoordinator(battleId)
                if success then
                    syncCount = syncCount + 1
                    battleState.lastSyncTime = currentTime
                    SynchronizationQueue[battleId] = nil
                end
            end
        else
            -- Remove invalid sync requests
            SynchronizationQueue[battleId] = nil
        end
    end
    
    return syncCount
end

-- Synchronize battle state with coordinator process
-- @param battleId: Battle identifier
-- @return: Synchronization success status
function BattleStateManager.synchronizeWithCoordinator(battleId)
    local battleState = BattleStates[battleId]
    if not battleState or not battleState.coordinatorId then
        return false
    end
    
    -- Create synchronization message
    local syncMessage = {
        correlation = {
            id = battleState.correlationId,
            sessionId = battleState.battleId,
            requestType = "BATTLE_STATE_SYNC"
        },
        battleData = {
            battleId = battleId,
            syncVersion = battleState.syncVersion,
            status = battleState.status,
            turn = battleState.turn,
            phase = battleState.phase,
            lastUpdated = battleState.lastUpdated,
            stateSnapshot = BattleStateManager.createStateSnapshot(battleState)
        },
        processAuth = {
            sourceProcessId = ao.id,
            timestamp = 0
        }
    }
    
    -- Send synchronization message to coordinator
    -- This would use AO's message sending mechanism
    print("[BattleStateManager] Synchronizing battle state: " .. battleId)
    
    return true
end

-- Get battle state history
-- @param battleId: Battle identifier
-- @param limit: Maximum number of history entries (optional)
-- @return: State history array
function BattleStateManager.getBattleHistory(battleId, limit)
    if not battleId then
        return {}
    end
    
    local history = StateHistory[battleId] or {}
    
    if limit and limit > 0 then
        local startIndex = math.max(1, #history - limit + 1)
        local limitedHistory = {}
        for i = startIndex, #history do
            table.insert(limitedHistory, history[i])
        end
        return limitedHistory
    end
    
    return history
end

-- Complete battle and perform cleanup
-- @param battleId: Battle identifier
-- @param battleResult: Final battle result
-- @return: Completion status
function BattleStateManager.completeBattle(battleId, battleResult)
    local battleState = BattleStates[battleId]
    if not battleState then
        return false, "Battle state not found"
    end
    
    -- Update battle state
    battleState.status = BattleStateManager.StateStatus.COMPLETED
    battleState.battleResult = battleResult
    battleState.lastUpdated = 0
    
    -- Add final history entry
    BattleStateManager.addStateHistory(battleId, "BATTLE_COMPLETED")
    
    -- Final synchronization with coordinator
    BattleStateManager.synchronizeWithCoordinator(battleId)
    
    print("[BattleStateManager] Battle completed: " .. battleId)
    
    return true
end

-- Clean up completed battles
-- @param maxAge: Maximum age in seconds for completed battles
-- @return: Number of battles cleaned up
function BattleStateManager.cleanupCompletedBattles(maxAge)
    maxAge = maxAge or 3600 -- Default 1 hour
    local currentTime = 0
    local cleanupCount = 0
    
    local battleIdsToRemove = {}
    
    for battleId, battleState in pairs(BattleStates) do
        if battleState.status == BattleStateManager.StateStatus.COMPLETED then
            local age = currentTime - battleState.lastUpdated
            if age > maxAge then
                table.insert(battleIdsToRemove, battleId)
            end
        end
    end
    
    -- Remove old completed battles
    for _, battleId in ipairs(battleIdsToRemove) do
        BattleStates[battleId] = nil
        StateHistory[battleId] = nil
        SynchronizationQueue[battleId] = nil
        cleanupCount = cleanupCount + 1
    end
    
    if cleanupCount > 0 then
        print("[BattleStateManager] Cleaned up " .. cleanupCount .. " completed battles")
    end
    
    return cleanupCount
end

-- Get battle state statistics
-- @return: Statistics about managed battle states
function BattleStateManager.getStatistics()
    local stats = {
        totalBattles = 0,
        activeBattles = 0,
        completedBattles = 0,
        errorBattles = 0,
        queuedSyncs = 0,
        totalHistoryEntries = 0
    }
    
    for _, battleState in pairs(BattleStates) do
        stats.totalBattles = stats.totalBattles + 1
        
        if battleState.status == BattleStateManager.StateStatus.ACTIVE then
            stats.activeBattles = stats.activeBattles + 1
        elseif battleState.status == BattleStateManager.StateStatus.COMPLETED then
            stats.completedBattles = stats.completedBattles + 1
        elseif battleState.status == BattleStateManager.StateStatus.ERROR then
            stats.errorBattles = stats.errorBattles + 1
        end
    end
    
    for _ in pairs(SynchronizationQueue) do
        stats.queuedSyncs = stats.queuedSyncs + 1
    end
    
    for _, history in pairs(StateHistory) do
        stats.totalHistoryEntries = stats.totalHistoryEntries + #history
    end
    
    return stats
end

return BattleStateManager