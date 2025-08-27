-- State Snapshot and Comparison Tools
-- Advanced state snapshot management and comparison utilities for debugging

local SnapshotManager = {}
SnapshotManager.__index = SnapshotManager

function SnapshotManager.new(emulator)
    local manager = setmetatable({}, SnapshotManager)
    manager.emulator = emulator
    manager.snapshots = {}
    manager.maxSnapshots = 1000
    manager.compressionEnabled = true
    manager.metadata = {
        totalSnapshots = 0,
        storageUsed = 0,
        oldestSnapshot = nil,
        newestSnapshot = nil
    }
    return manager
end

-- Snapshot Creation
function SnapshotManager:createSnapshot(label, options)
    options = options or {}
    
    local state = self.emulator:getState()
    local snapshot = {
        id = self:generateSnapshotId(),
        label = label or ("snapshot_" .. os.time()),
        timestamp = os.time(),
        state = options.shallow and state or self:deepCopy(state),
        metadata = {
            size = self:calculateStateSize(state),
            depth = self:calculateStateDepth(state),
            keyCount = self:countKeys(state),
            checksum = self:calculateChecksum(state),
            compressed = false,
            tags = options.tags or {},
            source = options.source or "manual"
        },
        options = options
    }
    
    -- Apply compression if enabled and beneficial
    if self.compressionEnabled and snapshot.metadata.size > 100 then
        snapshot = self:compressSnapshot(snapshot)
    end
    
    -- Store snapshot
    self:storeSnapshot(snapshot)
    
    return snapshot
end

function SnapshotManager:createAutoSnapshot(trigger, context)
    local label = string.format("auto_%s_%s", trigger, os.date("%H%M%S"))
    
    local options = {
        tags = {"auto", trigger},
        source = "automatic",
        context = context,
        shallow = false
    }
    
    return self:createSnapshot(label, options)
end

function SnapshotManager:createDifferentialSnapshot(baseSnapshotId, label)
    local baseSnapshot = self:getSnapshot(baseSnapshotId)
    if not baseSnapshot then
        error("Base snapshot not found: " .. baseSnapshotId)
    end
    
    local currentState = self.emulator:getState()
    local differences = self:calculateStateDifferences(baseSnapshot.state, currentState)
    
    local snapshot = {
        id = self:generateSnapshotId(),
        label = label or ("diff_from_" .. baseSnapshotId),
        timestamp = os.time(),
        type = "differential",
        baseSnapshotId = baseSnapshotId,
        differences = differences,
        metadata = {
            size = self:calculateObjectSize(differences),
            changeCount = self:countChanges(differences),
            compressed = false,
            tags = {"differential"},
            source = "differential"
        }
    }
    
    self:storeSnapshot(snapshot)
    return snapshot
end

-- Snapshot Storage and Retrieval
function SnapshotManager:storeSnapshot(snapshot)
    -- Ensure we don't exceed maximum snapshots
    while #self.snapshots >= self.maxSnapshots do
        self:removeOldestSnapshot()
    end
    
    table.insert(self.snapshots, snapshot)
    
    -- Update metadata
    self.metadata.totalSnapshots = self.metadata.totalSnapshots + 1
    self.metadata.storageUsed = self.metadata.storageUsed + snapshot.metadata.size
    
    if not self.metadata.oldestSnapshot or snapshot.timestamp < self.metadata.oldestSnapshot.timestamp then
        self.metadata.oldestSnapshot = {id = snapshot.id, timestamp = snapshot.timestamp}
    end
    
    if not self.metadata.newestSnapshot or snapshot.timestamp > self.metadata.newestSnapshot.timestamp then
        self.metadata.newestSnapshot = {id = snapshot.id, timestamp = snapshot.timestamp}
    end
    
    return snapshot.id
end

function SnapshotManager:getSnapshot(snapshotId)
    for _, snapshot in ipairs(self.snapshots) do
        if snapshot.id == snapshotId then
            return snapshot
        end
    end
    return nil
end

function SnapshotManager:getSnapshotsByLabel(label)
    local matches = {}
    for _, snapshot in ipairs(self.snapshots) do
        if snapshot.label == label then
            table.insert(matches, snapshot)
        end
    end
    return matches
end

function SnapshotManager:getSnapshotsByTag(tag)
    local matches = {}
    for _, snapshot in ipairs(self.snapshots) do
        for _, snapshotTag in ipairs(snapshot.metadata.tags) do
            if snapshotTag == tag then
                table.insert(matches, snapshot)
                break
            end
        end
    end
    return matches
end

function SnapshotManager:listSnapshots(filter)
    if not filter then
        return self.snapshots
    end
    
    local filtered = {}
    for _, snapshot in ipairs(self.snapshots) do
        if self:snapshotMatchesFilter(snapshot, filter) then
            table.insert(filtered, snapshot)
        end
    end
    
    return filtered
end

-- Snapshot Comparison
function SnapshotManager:compareSnapshots(snapshot1Id, snapshot2Id, options)
    options = options or {}
    
    local snapshot1 = self:getSnapshot(snapshot1Id)
    local snapshot2 = self:getSnapshot(snapshot2Id)
    
    if not snapshot1 then
        error("Snapshot 1 not found: " .. snapshot1Id)
    end
    
    if not snapshot2 then
        error("Snapshot 2 not found: " .. snapshot2Id)
    end
    
    local state1 = self:reconstructState(snapshot1)
    local state2 = self:reconstructState(snapshot2)
    
    local comparison = {
        id = "comp_" .. os.time(),
        timestamp = os.time(),
        snapshot1 = {id = snapshot1.id, label = snapshot1.label, timestamp = snapshot1.timestamp},
        snapshot2 = {id = snapshot2.id, label = snapshot2.label, timestamp = snapshot2.timestamp},
        timeDelta = snapshot2.timestamp - snapshot1.timestamp,
        options = options,
        differences = {},
        summary = {
            totalChanges = 0,
            added = 0,
            removed = 0,
            modified = 0,
            typeChanged = 0,
            identical = 0
        },
        analysis = {}
    }
    
    -- Perform deep comparison
    self:compareStatesRecursive(state1, state2, "", comparison, options)
    
    -- Generate analysis
    comparison.analysis = self:analyzeComparison(comparison)
    
    return comparison
end

function SnapshotManager:compareStatesRecursive(state1, state2, path, comparison, options)
    local type1, type2 = type(state1), type(state2)
    
    -- Handle type changes
    if type1 ~= type2 then
        local change = {
            type = "type_changed",
            path = path,
            oldType = type1,
            newType = type2,
            oldValue = self:valueToString(state1),
            newValue = self:valueToString(state2)
        }
        table.insert(comparison.differences, change)
        comparison.summary.typeChanged = comparison.summary.typeChanged + 1
        comparison.summary.totalChanges = comparison.summary.totalChanges + 1
        return
    end
    
    -- Handle non-table values
    if type1 ~= "table" then
        if state1 ~= state2 then
            local change = {
                type = "value_changed",
                path = path,
                oldValue = state1,
                newValue = state2,
                dataType = type1
            }
            table.insert(comparison.differences, change)
            comparison.summary.modified = comparison.summary.modified + 1
            comparison.summary.totalChanges = comparison.summary.totalChanges + 1
        else
            comparison.summary.identical = comparison.summary.identical + 1
        end
        return
    end
    
    -- Handle table comparisons
    local keys1, keys2 = {}, {}
    
    for k in pairs(state1) do
        keys1[k] = true
    end
    
    for k in pairs(state2) do
        keys2[k] = true
    end
    
    -- Find added keys
    for key in pairs(keys2) do
        if not keys1[key] then
            local change = {
                type = "key_added",
                path = self:buildPath(path, key),
                newValue = state2[key],
                dataType = type(state2[key])
            }
            table.insert(comparison.differences, change)
            comparison.summary.added = comparison.summary.added + 1
            comparison.summary.totalChanges = comparison.summary.totalChanges + 1
        end
    end
    
    -- Find removed keys
    for key in pairs(keys1) do
        if not keys2[key] then
            local change = {
                type = "key_removed",
                path = self:buildPath(path, key),
                oldValue = state1[key],
                dataType = type(state1[key])
            }
            table.insert(comparison.differences, change)
            comparison.summary.removed = comparison.summary.removed + 1
            comparison.summary.totalChanges = comparison.summary.totalChanges + 1
        end
    end
    
    -- Compare common keys
    for key in pairs(keys1) do
        if keys2[key] then
            local keyPath = self:buildPath(path, key)
            
            -- Apply filters if specified
            if not self:shouldSkipPath(keyPath, options) then
                self:compareStatesRecursive(state1[key], state2[key], keyPath, comparison, options)
            end
        end
    end
end

-- Timeline Analysis
function SnapshotManager:createTimeline(snapshotIds, options)
    options = options or {}
    
    local timeline = {
        id = "timeline_" .. os.time(),
        created = os.time(),
        snapshots = {},
        changes = {},
        summary = {
            totalSnapshots = #snapshotIds,
            timeSpan = 0,
            totalChanges = 0,
            changeRate = 0
        },
        options = options
    }
    
    -- Sort snapshots by timestamp
    local snapshots = {}
    for _, id in ipairs(snapshotIds) do
        local snapshot = self:getSnapshot(id)
        if snapshot then
            table.insert(snapshots, snapshot)
        end
    end
    
    table.sort(snapshots, function(a, b) return a.timestamp < b.timestamp end)
    timeline.snapshots = snapshots
    
    if #snapshots > 1 then
        timeline.summary.timeSpan = snapshots[#snapshots].timestamp - snapshots[1].timestamp
    end
    
    -- Generate changes between consecutive snapshots
    for i = 1, #snapshots - 1 do
        local comparison = self:compareSnapshots(snapshots[i].id, snapshots[i + 1].id, options)
        
        local timelineChange = {
            fromSnapshot = snapshots[i].id,
            toSnapshot = snapshots[i + 1].id,
            timeDelta = comparison.timeDelta,
            changeCount = comparison.summary.totalChanges,
            changes = comparison.differences
        }
        
        table.insert(timeline.changes, timelineChange)
        timeline.summary.totalChanges = timeline.summary.totalChanges + comparison.summary.totalChanges
    end
    
    if timeline.summary.timeSpan > 0 then
        timeline.summary.changeRate = timeline.summary.totalChanges / timeline.summary.timeSpan
    end
    
    return timeline
end

-- State Reconstruction
function SnapshotManager:reconstructState(snapshot)
    if snapshot.type == "differential" then
        return self:reconstructDifferentialState(snapshot)
    else
        return snapshot.state
    end
end

function SnapshotManager:reconstructDifferentialState(diffSnapshot)
    local baseSnapshot = self:getSnapshot(diffSnapshot.baseSnapshotId)
    if not baseSnapshot then
        error("Base snapshot not found for differential reconstruction")
    end
    
    local baseState = self:reconstructState(baseSnapshot)
    local reconstructed = self:deepCopy(baseState)
    
    -- Apply differences
    for _, change in ipairs(diffSnapshot.differences.changes) do
        if change.type == "added" or change.type == "modified" then
            self:setValueAtPath(reconstructed, change.path, change.newValue)
        elseif change.type == "removed" then
            self:removeValueAtPath(reconstructed, change.path)
        end
    end
    
    return reconstructed
end

-- Snapshot Compression
function SnapshotManager:compressSnapshot(snapshot)
    -- Simple compression simulation - in real implementation would use actual compression
    local originalSize = snapshot.metadata.size
    
    -- Simulate 30-50% compression ratio
    local compressionRatio = 0.3 + math.random() * 0.2
    local compressedSize = math.floor(originalSize * compressionRatio)
    
    snapshot.metadata.compressed = true
    snapshot.metadata.originalSize = originalSize
    snapshot.metadata.size = compressedSize
    snapshot.metadata.compressionRatio = compressionRatio
    
    return snapshot
end

function SnapshotManager:decompressSnapshot(snapshot)
    if not snapshot.metadata.compressed then
        return snapshot
    end
    
    -- Restore original size
    snapshot.metadata.size = snapshot.metadata.originalSize
    snapshot.metadata.compressed = false
    
    return snapshot
end

-- Analysis and Insights
function SnapshotManager:analyzeComparison(comparison)
    local analysis = {
        changeTypes = {},
        pathAnalysis = {},
        dataTypeChanges = {},
        recommendations = {}
    }
    
    -- Analyze change types
    for _, change in ipairs(comparison.differences) do
        analysis.changeTypes[change.type] = (analysis.changeTypes[change.type] or 0) + 1
        
        -- Analyze paths
        local topLevelPath = string.match(change.path, "^([^.]+)")
        if topLevelPath then
            analysis.pathAnalysis[topLevelPath] = (analysis.pathAnalysis[topLevelPath] or 0) + 1
        end
        
        -- Analyze data types
        local dataType = change.dataType or type(change.newValue) or type(change.oldValue)
        if dataType then
            analysis.dataTypeChanges[dataType] = (analysis.dataTypeChanges[dataType] or 0) + 1
        end
    end
    
    -- Generate recommendations
    if comparison.summary.totalChanges > 1000 then
        table.insert(analysis.recommendations, {
            type = "performance",
            message = "Large number of changes detected - consider state optimization"
        })
    end
    
    if analysis.changeTypes.type_changed and analysis.changeTypes.type_changed > 10 then
        table.insert(analysis.recommendations, {
            type = "data_integrity", 
            message = "Many type changes detected - review data consistency"
        })
    end
    
    return analysis
end

function SnapshotManager:generateChangeReport(comparison)
    local report = {
        "State Comparison Report",
        "======================",
        "Snapshot 1: " .. comparison.snapshot1.label .. " (" .. os.date("%Y-%m-%d %H:%M:%S", comparison.snapshot1.timestamp) .. ")",
        "Snapshot 2: " .. comparison.snapshot2.label .. " (" .. os.date("%Y-%m-%d %H:%M:%S", comparison.snapshot2.timestamp) .. ")",
        "Time Delta: " .. comparison.timeDelta .. " seconds",
        "",
        "Summary:",
        "  Total Changes: " .. comparison.summary.totalChanges,
        "  Added: " .. comparison.summary.added,
        "  Removed: " .. comparison.summary.removed,
        "  Modified: " .. comparison.summary.modified,
        "  Type Changed: " .. comparison.summary.typeChanged,
        "  Identical: " .. comparison.summary.identical,
        ""
    }
    
    if #comparison.differences > 0 then
        table.insert(report, "Changes:")
        for i, change in ipairs(comparison.differences) do
            if i <= 20 then -- Limit to first 20 changes
                local line = string.format("  %s: %s", change.type:upper(), change.path)
                if change.oldValue and change.newValue then
                    line = line .. string.format(" (%s -> %s)", 
                                                self:valueToString(change.oldValue),
                                                self:valueToString(change.newValue))
                end
                table.insert(report, line)
            end
        end
        
        if #comparison.differences > 20 then
            table.insert(report, "  ... and " .. (#comparison.differences - 20) .. " more changes")
        end
    end
    
    return table.concat(report, "\n")
end

-- Utility Functions
function SnapshotManager:generateSnapshotId()
    return "snap_" .. os.time() .. "_" .. math.random(10000, 99999)
end

function SnapshotManager:calculateStateSize(state)
    if type(state) ~= "table" then
        return 1
    end
    
    local size = 1
    for _, value in pairs(state) do
        size = size + self:calculateStateSize(value)
    end
    
    return size
end

function SnapshotManager:calculateStateDepth(state, currentDepth)
    currentDepth = currentDepth or 0
    
    if type(state) ~= "table" then
        return currentDepth
    end
    
    local maxDepth = currentDepth
    for _, value in pairs(state) do
        local depth = self:calculateStateDepth(value, currentDepth + 1)
        maxDepth = math.max(maxDepth, depth)
    end
    
    return maxDepth
end

function SnapshotManager:countKeys(obj)
    if type(obj) ~= "table" then
        return 0
    end
    
    local count = 0
    for _ in pairs(obj) do
        count = count + 1
    end
    
    return count
end

function SnapshotManager:calculateChecksum(obj)
    -- Simple checksum calculation
    local str = self:objectToString(obj)
    local checksum = 0
    
    for i = 1, string.len(str) do
        checksum = (checksum + string.byte(str, i)) % 1000000
    end
    
    return checksum
end

function SnapshotManager:objectToString(obj)
    if type(obj) == "table" then
        local parts = {}
        for k, v in pairs(obj) do
            table.insert(parts, tostring(k) .. ":" .. self:objectToString(v))
        end
        table.sort(parts)
        return "{" .. table.concat(parts, ",") .. "}"
    else
        return tostring(obj)
    end
end

function SnapshotManager:valueToString(value)
    if type(value) == "string" and string.len(value) > 50 then
        return '"' .. string.sub(value, 1, 47) .. '..."'
    elseif type(value) == "table" then
        return "[table:" .. self:countKeys(value) .. "]"
    else
        return tostring(value)
    end
end

function SnapshotManager:buildPath(basePath, key)
    return basePath == "" and tostring(key) or (basePath .. "." .. tostring(key))
end

function SnapshotManager:shouldSkipPath(path, options)
    if not options.ignorePaths then
        return false
    end
    
    for _, ignorePath in ipairs(options.ignorePaths) do
        if string.find(path, ignorePath) then
            return true
        end
    end
    
    return false
end

function SnapshotManager:snapshotMatchesFilter(snapshot, filter)
    if filter.label and snapshot.label ~= filter.label then
        return false
    end
    
    if filter.tags then
        local hasTag = false
        for _, filterTag in ipairs(filter.tags) do
            for _, snapshotTag in ipairs(snapshot.metadata.tags) do
                if snapshotTag == filterTag then
                    hasTag = true
                    break
                end
            end
            if hasTag then break end
        end
        if not hasTag then return false end
    end
    
    if filter.minTimestamp and snapshot.timestamp < filter.minTimestamp then
        return false
    end
    
    if filter.maxTimestamp and snapshot.timestamp > filter.maxTimestamp then
        return false
    end
    
    return true
end

function SnapshotManager:deepCopy(orig)
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

function SnapshotManager:calculateStateDifferences(state1, state2)
    local differences = {
        changes = {},
        summary = {
            added = 0,
            removed = 0,
            modified = 0
        }
    }
    
    self:findDifferencesRecursive(state1, state2, "", differences)
    
    return differences
end

function SnapshotManager:findDifferencesRecursive(state1, state2, path, differences)
    -- Simplified difference calculation
    if type(state1) ~= type(state2) then
        table.insert(differences.changes, {
            type = "modified",
            path = path,
            oldValue = state1,
            newValue = state2
        })
        differences.summary.modified = differences.summary.modified + 1
        return
    end
    
    if type(state1) ~= "table" then
        if state1 ~= state2 then
            table.insert(differences.changes, {
                type = "modified",
                path = path,
                oldValue = state1,
                newValue = state2
            })
            differences.summary.modified = differences.summary.modified + 1
        end
        return
    end
    
    -- Handle table differences (simplified)
    for key, value in pairs(state2) do
        local keyPath = self:buildPath(path, key)
        if state1[key] == nil then
            table.insert(differences.changes, {
                type = "added",
                path = keyPath,
                newValue = value
            })
            differences.summary.added = differences.summary.added + 1
        else
            self:findDifferencesRecursive(state1[key], value, keyPath, differences)
        end
    end
    
    for key, value in pairs(state1) do
        if state2[key] == nil then
            local keyPath = self:buildPath(path, key)
            table.insert(differences.changes, {
                type = "removed",
                path = keyPath,
                oldValue = value
            })
            differences.summary.removed = differences.summary.removed + 1
        end
    end
end

function SnapshotManager:calculateObjectSize(obj)
    return self:calculateStateSize(obj)
end

function SnapshotManager:countChanges(differences)
    return #differences.changes
end

function SnapshotManager:removeOldestSnapshot()
    if #self.snapshots > 0 then
        local removed = table.remove(self.snapshots, 1)
        self.metadata.storageUsed = self.metadata.storageUsed - removed.metadata.size
    end
end

-- Path Utilities
function SnapshotManager:setValueAtPath(obj, path, value)
    local keys = {}
    for key in string.gmatch(path, "[^.]+") do
        table.insert(keys, key)
    end
    
    local current = obj
    for i = 1, #keys - 1 do
        local key = keys[i]
        if current[key] == nil then
            current[key] = {}
        end
        current = current[key]
    end
    
    current[keys[#keys]] = value
end

function SnapshotManager:removeValueAtPath(obj, path)
    local keys = {}
    for key in string.gmatch(path, "[^.]+") do
        table.insert(keys, key)
    end
    
    local current = obj
    for i = 1, #keys - 1 do
        current = current[keys[i]]
        if not current then
            return
        end
    end
    
    current[keys[#keys]] = nil
end

-- Management Functions
function SnapshotManager:cleanup(options)
    options = options or {}
    
    local removed = 0
    local saved_space = 0
    
    -- Remove old snapshots
    if options.maxAge then
        local cutoff = os.time() - options.maxAge
        local filtered = {}
        
        for _, snapshot in ipairs(self.snapshots) do
            if snapshot.timestamp >= cutoff then
                table.insert(filtered, snapshot)
            else
                removed = removed + 1
                saved_space = saved_space + snapshot.metadata.size
            end
        end
        
        self.snapshots = filtered
    end
    
    -- Remove by tag
    if options.removeTags then
        local filtered = {}
        
        for _, snapshot in ipairs(self.snapshots) do
            local shouldRemove = false
            
            for _, removeTag in ipairs(options.removeTags) do
                for _, snapshotTag in ipairs(snapshot.metadata.tags) do
                    if snapshotTag == removeTag then
                        shouldRemove = true
                        break
                    end
                end
                if shouldRemove then break end
            end
            
            if shouldRemove then
                removed = removed + 1
                saved_space = saved_space + snapshot.metadata.size
            else
                table.insert(filtered, snapshot)
            end
        end
        
        self.snapshots = filtered
    end
    
    -- Update metadata
    self.metadata.storageUsed = self.metadata.storageUsed - saved_space
    
    return {
        removed = removed,
        spaceSaved = saved_space
    }
end

return SnapshotManager