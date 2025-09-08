-- Battle State Persistence System
-- Handles battle state serialization, restoration, and history tracking
-- Provides battle replay capability and system reliability features
-- Maintains battle state synchronization and data integrity

local BattleStatePersistence = {}

-- Load dependencies
local json = require("json")

-- Battle state serialization format version
BattleStatePersistence.VERSION = "1.0.0"

-- Battle history storage (in-memory for this implementation)
local BattleHistory = {}
local BattleSnapshots = {}
local BattleBackups = {}

-- Serialize battle state for persistence
-- @param battleState: Battle state object to serialize
-- @return: Serialized battle state string and success status
function BattleStatePersistence.serializeBattleState(battleState)
    if not battleState then
        return nil, false, "Invalid battle state"
    end
    
    local success, serializedState = pcall(function()
        -- Create serializable version of battle state
        local serializableState = {
            version = BattleStatePersistence.VERSION,
            battleId = battleState.battleId,
            turn = battleState.turn,
            phase = battleState.phase,
            battleSeed = battleState.battleSeed,
            battleConditions = battleState.battleConditions,
            battleResult = battleState.battleResult,
            
            -- Serialize Pokemon parties with essential data only
            playerParty = BattleStatePersistence.serializeParty(battleState.playerParty),
            enemyParty = BattleStatePersistence.serializeParty(battleState.enemyParty),
            
            -- Serialize turn data
            turnOrder = BattleStatePersistence.serializeTurnOrder(battleState.turnOrder),
            pendingActions = BattleStatePersistence.serializeActions(battleState.pendingActions),
            interruptQueue = battleState.interruptQueue or {},
            turnCommands = battleState.turnCommands or {},
            
            -- Multi-turn tracking data
            multiTurnData = battleState.multiTurnData or {},
            
            -- Metadata
            timestamp = os.time(),
            serialization_version = BattleStatePersistence.VERSION
        }
        
        return json.encode(serializableState)
    end)
    
    if not success then
        return nil, false, "Serialization failed: " .. tostring(serializedState)
    end
    
    return serializedState, true, "Battle state serialized successfully"
end

-- Deserialize battle state from storage
-- @param serializedState: Serialized battle state string
-- @return: Battle state object and success status
function BattleStatePersistence.deserializeBattleState(serializedState)
    if not serializedState or type(serializedState) ~= "string" then
        return nil, false, "Invalid serialized state"
    end
    
    local success, battleState = pcall(function()
        local stateData = json.decode(serializedState)
        
        -- Validate version compatibility
        if not stateData.version or stateData.version ~= BattleStatePersistence.VERSION then
            error("Version mismatch: expected " .. BattleStatePersistence.VERSION .. ", got " .. tostring(stateData.version))
        end
        
        -- Reconstruct battle state object
        local reconstructedState = {
            battleId = stateData.battleId,
            turn = stateData.turn or 0,
            phase = stateData.phase or 1,
            battleSeed = stateData.battleSeed,
            battleConditions = stateData.battleConditions or {},
            battleResult = stateData.battleResult,
            
            -- Deserialize Pokemon parties
            playerParty = BattleStatePersistence.deserializeParty(stateData.playerParty),
            enemyParty = BattleStatePersistence.deserializeParty(stateData.enemyParty),
            
            -- Deserialize turn data
            turnOrder = BattleStatePersistence.deserializeTurnOrder(stateData.turnOrder),
            pendingActions = BattleStatePersistence.deserializeActions(stateData.pendingActions),
            interruptQueue = stateData.interruptQueue or {},
            turnCommands = stateData.turnCommands or {},
            
            -- Multi-turn tracking data
            multiTurnData = stateData.multiTurnData or {},
        }
        
        return reconstructedState
    end)
    
    if not success then
        return nil, false, "Deserialization failed: " .. tostring(battleState)
    end
    
    return battleState, true, "Battle state deserialized successfully"
end

-- Serialize Pokemon party data
-- @param party: Pokemon party array
-- @return: Serializable party data
function BattleStatePersistence.serializeParty(party)
    if not party or type(party) ~= "table" then
        return {}
    end
    
    local serializedParty = {}
    
    for i, pokemon in ipairs(party) do
        if pokemon then
            local serializedPokemon = {
                id = pokemon.id,
                name = pokemon.name,
                species = pokemon.species,
                level = pokemon.level,
                currentHP = pokemon.currentHP,
                maxHP = pokemon.maxHP or (pokemon.stats and pokemon.stats.hp),
                status = pokemon.status,
                statusTurns = pokemon.statusTurns,
                fainted = pokemon.fainted,
                
                -- Stats and modifications
                stats = pokemon.stats,
                battleStats = pokemon.battleStats or {},
                nature = pokemon.nature,
                ability = pokemon.ability,
                heldItem = pokemon.heldItem,
                types = pokemon.types,
                
                -- Move data
                moves = pokemon.moves or {},
                
                -- Battle-specific data
                itemConsumed = pokemon.itemConsumed,
                side = pokemon.side or 0
            }
            
            table.insert(serializedParty, serializedPokemon)
        end
    end
    
    return serializedParty
end

-- Deserialize Pokemon party data
-- @param serializedParty: Serialized party data
-- @return: Reconstructed Pokemon party
function BattleStatePersistence.deserializeParty(serializedParty)
    if not serializedParty or type(serializedParty) ~= "table" then
        return {}
    end
    
    local party = {}
    
    for _, pokemonData in ipairs(serializedParty) do
        if pokemonData then
            table.insert(party, pokemonData)
        end
    end
    
    return party
end

-- Serialize turn order data
-- @param turnOrder: Turn order array
-- @return: Serializable turn order data
function BattleStatePersistence.serializeTurnOrder(turnOrder)
    if not turnOrder or type(turnOrder) ~= "table" then
        return {}
    end
    
    local serializedOrder = {}
    
    for i, action in ipairs(turnOrder) do
        if action then
            local serializedAction = {
                type = action.type,
                pokemonId = action.pokemonId,
                moveId = action.moveId,
                priority = action.priority,
                category = action.category,
                effectiveSpeed = action.effectiveSpeed,
                timestamp = action.timestamp,
                target = action.target and {
                    id = action.target.id,
                    name = action.target.name
                } or nil,
                data = action.data or {}
            }
            
            table.insert(serializedOrder, serializedAction)
        end
    end
    
    return serializedOrder
end

-- Deserialize turn order data
-- @param serializedOrder: Serialized turn order data
-- @return: Reconstructed turn order
function BattleStatePersistence.deserializeTurnOrder(serializedOrder)
    if not serializedOrder or type(serializedOrder) ~= "table" then
        return {}
    end
    
    local turnOrder = {}
    
    for _, actionData in ipairs(serializedOrder) do
        if actionData then
            table.insert(turnOrder, actionData)
        end
    end
    
    return turnOrder
end

-- Serialize pending actions data
-- @param actions: Pending actions array
-- @return: Serializable actions data
function BattleStatePersistence.serializeActions(actions)
    if not actions or type(actions) ~= "table" then
        return {}
    end
    
    -- Actions have the same structure as turn order, so reuse the function
    return BattleStatePersistence.serializeTurnOrder(actions)
end

-- Deserialize pending actions data
-- @param serializedActions: Serialized actions data
-- @return: Reconstructed actions
function BattleStatePersistence.deserializeActions(serializedActions)
    if not serializedActions or type(serializedActions) ~= "table" then
        return {}
    end
    
    -- Actions have the same structure as turn order, so reuse the function
    return BattleStatePersistence.deserializeTurnOrder(serializedActions)
end

-- Create battle state snapshot for turn-by-turn history
-- @param battleState: Current battle state
-- @param turnNumber: Turn number for the snapshot
-- @param actionType: Type of action that triggered the snapshot
-- @return: Snapshot creation result
function BattleStatePersistence.createBattleSnapshot(battleState, turnNumber, actionType)
    if not battleState or not battleState.battleId then
        return false, "Invalid battle state for snapshot"
    end
    
    local battleId = battleState.battleId
    
    -- Initialize battle history if not exists
    if not BattleHistory[battleId] then
        BattleHistory[battleId] = {
            battleId = battleId,
            snapshots = {},
            created = os.time()
        }
    end
    
    -- Create snapshot
    local serializedState, success, error = BattleStatePersistence.serializeBattleState(battleState)
    if not success then
        return false, "Failed to create snapshot: " .. (error or "Unknown error")
    end
    
    local snapshot = {
        turn = turnNumber or battleState.turn,
        action_type = actionType or "unknown",
        timestamp = os.time(),
        state_data = serializedState,
        checksum = BattleStatePersistence.calculateChecksum(serializedState)
    }
    
    table.insert(BattleHistory[battleId].snapshots, snapshot)
    
    -- Limit history size (keep last 100 turns)
    while #BattleHistory[battleId].snapshots > 100 do
        table.remove(BattleHistory[battleId].snapshots, 1)
    end
    
    return true, "Snapshot created successfully"
end

-- Restore battle state from specific snapshot
-- @param battleId: Battle identifier
-- @param turnNumber: Turn number to restore (nil for latest)
-- @return: Restored battle state and success status
function BattleStatePersistence.restoreBattleSnapshot(battleId, turnNumber)
    if not battleId then
        return nil, false, "Battle ID required for restoration"
    end
    
    if not BattleHistory[battleId] then
        return nil, false, "No battle history found for battle " .. battleId
    end
    
    local snapshots = BattleHistory[battleId].snapshots
    local targetSnapshot = nil
    
    if turnNumber then
        -- Find specific turn
        for _, snapshot in ipairs(snapshots) do
            if snapshot.turn == turnNumber then
                targetSnapshot = snapshot
                break
            end
        end
    else
        -- Get latest snapshot
        if #snapshots > 0 then
            targetSnapshot = snapshots[#snapshots]
        end
    end
    
    if not targetSnapshot then
        return nil, false, "No snapshot found for turn " .. tostring(turnNumber or "latest")
    end
    
    -- Validate snapshot integrity
    local currentChecksum = BattleStatePersistence.calculateChecksum(targetSnapshot.state_data)
    if currentChecksum ~= targetSnapshot.checksum then
        return nil, false, "Snapshot integrity check failed"
    end
    
    -- Restore battle state
    local battleState, success, error = BattleStatePersistence.deserializeBattleState(targetSnapshot.state_data)
    if not success then
        return nil, false, "Failed to restore snapshot: " .. (error or "Unknown error")
    end
    
    return battleState, true, "Battle state restored from turn " .. targetSnapshot.turn
end

-- Create battle state backup for reliability
-- @param battleState: Battle state to backup
-- @return: Backup creation result
function BattleStatePersistence.createBattleBackup(battleState)
    if not battleState or not battleState.battleId then
        return false, "Invalid battle state for backup"
    end
    
    local battleId = battleState.battleId
    
    -- Serialize battle state
    local serializedState, success, error = BattleStatePersistence.serializeBattleState(battleState)
    if not success then
        return false, "Failed to create backup: " .. (error or "Unknown error")
    end
    
    -- Create backup entry
    local backup = {
        battleId = battleId,
        timestamp = os.time(),
        state_data = serializedState,
        checksum = BattleStatePersistence.calculateChecksum(serializedState)
    }
    
    -- Store backup (keep last 3 backups per battle)
    if not BattleBackups[battleId] then
        BattleBackups[battleId] = {}
    end
    
    table.insert(BattleBackups[battleId], backup)
    
    while #BattleBackups[battleId] > 3 do
        table.remove(BattleBackups[battleId], 1)
    end
    
    return true, "Battle backup created successfully"
end

-- Recover battle state from backup
-- @param battleId: Battle identifier
-- @param backupIndex: Backup index (1 = oldest, nil = latest)
-- @return: Recovered battle state and success status
function BattleStatePersistence.recoverBattleBackup(battleId, backupIndex)
    if not battleId then
        return nil, false, "Battle ID required for recovery"
    end
    
    if not BattleBackups[battleId] or #BattleBackups[battleId] == 0 then
        return nil, false, "No backups found for battle " .. battleId
    end
    
    local backups = BattleBackups[battleId]
    local targetBackup = nil
    
    if backupIndex then
        targetBackup = backups[backupIndex]
    else
        targetBackup = backups[#backups] -- Latest backup
    end
    
    if not targetBackup then
        return nil, false, "Backup not found at index " .. tostring(backupIndex or "latest")
    end
    
    -- Validate backup integrity
    local currentChecksum = BattleStatePersistence.calculateChecksum(targetBackup.state_data)
    if currentChecksum ~= targetBackup.checksum then
        return nil, false, "Backup integrity check failed"
    end
    
    -- Recover battle state
    local battleState, success, error = BattleStatePersistence.deserializeBattleState(targetBackup.state_data)
    if not success then
        return nil, false, "Failed to recover backup: " .. (error or "Unknown error")
    end
    
    return battleState, true, "Battle state recovered from backup"
end

-- Validate battle state data integrity
-- @param battleState: Battle state to validate
-- @return: Validation result and error details
function BattleStatePersistence.validateBattleState(battleState)
    if not battleState then
        return false, "Battle state is nil"
    end
    
    -- Check required fields
    local requiredFields = {"battleId", "turn", "phase", "battleSeed", "playerParty", "enemyParty"}
    for _, field in ipairs(requiredFields) do
        if battleState[field] == nil then
            return false, "Missing required field: " .. field
        end
    end
    
    -- Validate battle ID format
    if type(battleState.battleId) ~= "string" or #battleState.battleId == 0 then
        return false, "Invalid battle ID"
    end
    
    -- Validate turn number
    if type(battleState.turn) ~= "number" or battleState.turn < 0 then
        return false, "Invalid turn number"
    end
    
    -- Validate phase
    local validPhases = {1, 2, 3, 4}
    local phaseValid = false
    for _, validPhase in ipairs(validPhases) do
        if battleState.phase == validPhase then
            phaseValid = true
            break
        end
    end
    if not phaseValid then
        return false, "Invalid battle phase"
    end
    
    -- Validate parties
    if type(battleState.playerParty) ~= "table" then
        return false, "Player party must be a table"
    end
    if type(battleState.enemyParty) ~= "table" then
        return false, "Enemy party must be a table"
    end
    
    -- Validate Pokemon in parties
    for i, pokemon in ipairs(battleState.playerParty) do
        if not pokemon.id or not pokemon.species then
            return false, "Invalid Pokemon at player party index " .. i
        end
    end
    
    for i, pokemon in ipairs(battleState.enemyParty) do
        if not pokemon.id or not pokemon.species then
            return false, "Invalid Pokemon at enemy party index " .. i
        end
    end
    
    return true, "Battle state validation passed"
end

-- Calculate simple checksum for data integrity
-- @param data: String data to checksum
-- @return: Checksum value
function BattleStatePersistence.calculateChecksum(data)
    if not data or type(data) ~= "string" then
        return 0
    end
    
    local checksum = 0
    for i = 1, #data do
        local byte = string.byte(data, i)
        checksum = (checksum + byte * i) % 2147483647 -- Keep within 32-bit range
    end
    
    return checksum
end

-- Get battle history summary
-- @param battleId: Battle identifier
-- @return: Battle history summary
function BattleStatePersistence.getBattleHistorySummary(battleId)
    if not battleId or not BattleHistory[battleId] then
        return nil
    end
    
    local history = BattleHistory[battleId]
    
    return {
        battleId = history.battleId,
        created = history.created,
        total_snapshots = #history.snapshots,
        turns_recorded = history.snapshots[#history.snapshots] and history.snapshots[#history.snapshots].turn or 0,
        earliest_turn = history.snapshots[1] and history.snapshots[1].turn or 0,
        latest_turn = history.snapshots[#history.snapshots] and history.snapshots[#history.snapshots].turn or 0
    }
end

-- Clean up battle persistence data for completed battles
-- @param battleId: Battle identifier to clean up
-- @return: Cleanup result
function BattleStatePersistence.cleanupBattleData(battleId)
    if not battleId then
        return false, "Battle ID required"
    end
    
    local cleaned = 0
    
    -- Clean up history
    if BattleHistory[battleId] then
        BattleHistory[battleId] = nil
        cleaned = cleaned + 1
    end
    
    -- Clean up backups
    if BattleBackups[battleId] then
        BattleBackups[battleId] = nil
        cleaned = cleaned + 1
    end
    
    -- Clean up snapshots
    if BattleSnapshots[battleId] then
        BattleSnapshots[battleId] = nil
        cleaned = cleaned + 1
    end
    
    return true, "Cleaned up " .. cleaned .. " data structures for battle " .. battleId
end

-- Get persistence system statistics
-- @return: System statistics
function BattleStatePersistence.getSystemStats()
    local stats = {
        active_battles = 0,
        total_snapshots = 0,
        total_backups = 0,
        memory_usage = {
            history_entries = 0,
            backup_entries = 0
        }
    }
    
    -- Count battle history data
    for battleId, history in pairs(BattleHistory) do
        stats.active_battles = stats.active_battles + 1
        stats.total_snapshots = stats.total_snapshots + #history.snapshots
        stats.memory_usage.history_entries = stats.memory_usage.history_entries + 1
    end
    
    -- Count backup data
    for battleId, backups in pairs(BattleBackups) do
        stats.total_backups = stats.total_backups + #backups
        stats.memory_usage.backup_entries = stats.memory_usage.backup_entries + 1
    end
    
    return stats
end

return BattleStatePersistence