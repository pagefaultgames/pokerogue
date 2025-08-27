-- Game State Inspection Tools
-- Advanced debugging and inspection utilities for AO game state

local StateInspector = {}
StateInspector.__index = StateInspector

function StateInspector.new(emulator)
    local inspector = setmetatable({}, StateInspector)
    inspector.emulator = emulator
    inspector.inspectionHistory = {}
    inspector.watchedKeys = {}
    inspector.breakpoints = {}
    inspector.filters = {}
    return inspector
end

-- State Inspection Methods
function StateInspector:inspectState(label)
    label = label or ("inspection_" .. os.time())
    
    local state = self.emulator:getState()
    local inspection = {
        label = label,
        timestamp = os.time(),
        state = self:deepCopy(state),
        metadata = {
            stateSize = self:calculateStateSize(state),
            keyCount = self:countKeys(state),
            depth = self:calculateDepth(state),
            types = self:analyzeTypes(state)
        }
    }
    
    table.insert(self.inspectionHistory, inspection)
    return inspection
end

function StateInspector:getStateValue(path)
    local state = self.emulator:getState()
    return self:navigateToPath(state, path)
end

function StateInspector:watchState(path, callback)
    local watcher = {
        path = path,
        callback = callback,
        lastValue = self:getStateValue(path),
        changeCount = 0
    }
    
    self.watchedKeys[path] = watcher
    return watcher
end

function StateInspector:unwatchState(path)
    self.watchedKeys[path] = nil
end

function StateInspector:checkWatchers()
    local changes = {}
    
    for path, watcher in pairs(self.watchedKeys) do
        local currentValue = self:getStateValue(path)
        
        if not self:deepEquals(currentValue, watcher.lastValue) then
            local change = {
                path = path,
                oldValue = watcher.lastValue,
                newValue = currentValue,
                timestamp = os.time(),
                changeNumber = watcher.changeCount + 1
            }
            
            watcher.lastValue = self:deepCopy(currentValue)
            watcher.changeCount = watcher.changeCount + 1
            
            if watcher.callback then
                pcall(watcher.callback, change)
            end
            
            table.insert(changes, change)
        end
    end
    
    return changes
end

-- State Analysis
function StateInspector:analyzeStateStructure()
    local state = self.emulator:getState()
    
    local analysis = {
        structure = self:buildStructureMap(state, "", 0),
        summary = {
            totalKeys = 0,
            maxDepth = 0,
            dataTypes = {},
            largestObjects = {},
            circularReferences = {}
        }
    }
    
    self:analyzeStructureRecursive(state, "", analysis, {}, 0)
    
    return analysis
end

function StateInspector:buildStructureMap(obj, path, depth)
    if type(obj) ~= "table" then
        return {
            type = type(obj),
            value = tostring(obj),
            path = path,
            depth = depth
        }
    end
    
    local structure = {
        type = "table",
        path = path,
        depth = depth,
        children = {},
        size = self:countKeys(obj)
    }
    
    for key, value in pairs(obj) do
        local childPath = path == "" and tostring(key) or (path .. "." .. tostring(key))
        structure.children[key] = self:buildStructureMap(value, childPath, depth + 1)
    end
    
    return structure
end

function StateInspector:analyzeStructureRecursive(obj, path, analysis, visited, depth)
    analysis.summary.maxDepth = math.max(analysis.summary.maxDepth, depth)
    
    if type(obj) ~= "table" then
        local dataType = type(obj)
        analysis.summary.dataTypes[dataType] = (analysis.summary.dataTypes[dataType] or 0) + 1
        analysis.summary.totalKeys = analysis.summary.totalKeys + 1
        return
    end
    
    -- Check for circular references
    if visited[obj] then
        table.insert(analysis.summary.circularReferences, {
            path = path,
            originalPath = visited[obj]
        })
        return
    end
    
    visited[obj] = path
    
    local keyCount = self:countKeys(obj)
    analysis.summary.totalKeys = analysis.summary.totalKeys + keyCount
    
    -- Track largest objects
    if keyCount > 10 then -- Arbitrary threshold
        table.insert(analysis.summary.largestObjects, {
            path = path,
            keyCount = keyCount,
            estimatedSize = self:calculateStateSize(obj)
        })
    end
    
    for key, value in pairs(obj) do
        local childPath = path == "" and tostring(key) or (path .. "." .. tostring(key))
        self:analyzeStructureRecursive(value, childPath, analysis, visited, depth + 1)
    end
    
    visited[obj] = nil
end

-- State Comparison
function StateInspector:compareStates(state1, state2, options)
    options = options or {}
    
    local comparison = {
        timestamp = os.time(),
        differences = {},
        summary = {
            totalDifferences = 0,
            addedKeys = 0,
            removedKeys = 0,
            modifiedKeys = 0,
            typeChanges = 0
        },
        options = options
    }
    
    self:compareRecursive(state1, state2, "", comparison, options)
    
    return comparison
end

function StateInspector:compareRecursive(obj1, obj2, path, comparison, options)
    local type1, type2 = type(obj1), type(obj2)
    
    -- Type changes
    if type1 ~= type2 then
        table.insert(comparison.differences, {
            type = "type_change",
            path = path,
            oldType = type1,
            newType = type2,
            oldValue = tostring(obj1),
            newValue = tostring(obj2)
        })
        comparison.summary.typeChanges = comparison.summary.typeChanges + 1
        comparison.summary.totalDifferences = comparison.summary.totalDifferences + 1
        return
    end
    
    -- Non-table comparisons
    if type1 ~= "table" then
        if not self:deepEquals(obj1, obj2) then
            table.insert(comparison.differences, {
                type = "value_change",
                path = path,
                oldValue = obj1,
                newValue = obj2
            })
            comparison.summary.modifiedKeys = comparison.summary.modifiedKeys + 1
            comparison.summary.totalDifferences = comparison.summary.totalDifferences + 1
        end
        return
    end
    
    -- Table comparisons
    local keys1, keys2 = {}, {}
    
    for k in pairs(obj1) do
        keys1[k] = true
    end
    
    for k in pairs(obj2) do
        keys2[k] = true
    end
    
    -- Find added keys
    for k in pairs(keys2) do
        if not keys1[k] then
            local childPath = path == "" and tostring(k) or (path .. "." .. tostring(k))
            table.insert(comparison.differences, {
                type = "key_added",
                path = childPath,
                newValue = obj2[k]
            })
            comparison.summary.addedKeys = comparison.summary.addedKeys + 1
            comparison.summary.totalDifferences = comparison.summary.totalDifferences + 1
        end
    end
    
    -- Find removed keys
    for k in pairs(keys1) do
        if not keys2[k] then
            local childPath = path == "" and tostring(k) or (path .. "." .. tostring(k))
            table.insert(comparison.differences, {
                type = "key_removed",
                path = childPath,
                oldValue = obj1[k]
            })
            comparison.summary.removedKeys = comparison.summary.removedKeys + 1
            comparison.summary.totalDifferences = comparison.summary.totalDifferences + 1
        end
    end
    
    -- Compare common keys
    for k in pairs(keys1) do
        if keys2[k] then
            local childPath = path == "" and tostring(k) or (path .. "." .. tostring(k))
            
            -- Apply filters if specified
            if not options.ignoreKeys or not self:matchesFilter(childPath, options.ignoreKeys) then
                self:compareRecursive(obj1[k], obj2[k], childPath, comparison, options)
            end
        end
    end
end

-- State Filtering and Search
function StateInspector:searchState(pattern, searchType)
    searchType = searchType or "value" -- "key", "value", "both"
    
    local state = self.emulator:getState()
    local results = {}
    
    self:searchRecursive(state, "", pattern, searchType, results)
    
    return {
        pattern = pattern,
        searchType = searchType,
        results = results,
        count = #results,
        timestamp = os.time()
    }
end

function StateInspector:searchRecursive(obj, path, pattern, searchType, results)
    if type(obj) ~= "table" then
        -- Search in values
        if (searchType == "value" or searchType == "both") then
            local valueStr = tostring(obj)
            if string.find(valueStr:lower(), pattern:lower()) then
                table.insert(results, {
                    type = "value_match",
                    path = path,
                    value = obj,
                    matchType = type(obj)
                })
            end
        end
        return
    end
    
    for key, value in pairs(obj) do
        local childPath = path == "" and tostring(key) or (path .. "." .. tostring(key))
        
        -- Search in keys
        if (searchType == "key" or searchType == "both") then
            local keyStr = tostring(key)
            if string.find(keyStr:lower(), pattern:lower()) then
                table.insert(results, {
                    type = "key_match",
                    path = childPath,
                    key = key,
                    value = value
                })
            end
        end
        
        self:searchRecursive(value, childPath, pattern, searchType, results)
    end
end

function StateInspector:filterState(filterFunc, options)
    options = options or {}
    
    local state = self.emulator:getState()
    local filtered = {}
    
    self:filterRecursive(state, "", filterFunc, filtered, options)
    
    return {
        originalState = options.includeOriginal and state or nil,
        filteredState = filtered,
        filterCount = self:countKeys(filtered),
        timestamp = os.time()
    }
end

function StateInspector:filterRecursive(obj, path, filterFunc, result, options)
    if type(obj) ~= "table" then
        if filterFunc(path, obj) then
            self:setNestedValue(result, path, obj)
        end
        return
    end
    
    for key, value in pairs(obj) do
        local childPath = path == "" and tostring(key) or (path .. "." .. tostring(key))
        
        if type(value) == "table" then
            self:filterRecursive(value, childPath, filterFunc, result, options)
        else
            if filterFunc(childPath, value) then
                self:setNestedValue(result, childPath, value)
            end
        end
    end
end

-- State Visualization
function StateInspector:visualizeState(options)
    options = options or {}
    
    local state = self.emulator:getState()
    local visualization = {
        type = "tree",
        maxDepth = options.maxDepth or 5,
        showValues = options.showValues ~= false,
        compact = options.compact or false,
        tree = self:buildVisualizationTree(state, "", 0, options)
    }
    
    return visualization
end

function StateInspector:buildVisualizationTree(obj, path, depth, options)
    if depth > options.maxDepth then
        return {
            type = "truncated",
            message = "Maximum depth exceeded",
            actualType = type(obj)
        }
    end
    
    if type(obj) ~= "table" then
        local node = {
            type = "leaf",
            dataType = type(obj),
            path = path
        }
        
        if options.showValues then
            local valueStr = tostring(obj)
            if string.len(valueStr) > 50 and not options.compact then
                node.value = string.sub(valueStr, 1, 47) .. "..."
            else
                node.value = valueStr
            end
        end
        
        return node
    end
    
    local node = {
        type = "branch",
        path = path,
        childCount = self:countKeys(obj),
        children = {}
    }
    
    -- Sort keys for consistent visualization
    local sortedKeys = {}
    for key in pairs(obj) do
        table.insert(sortedKeys, key)
    end
    table.sort(sortedKeys, function(a, b) 
        return tostring(a) < tostring(b) 
    end)
    
    for _, key in ipairs(sortedKeys) do
        local value = obj[key]
        local childPath = path == "" and tostring(key) or (path .. "." .. tostring(key))
        node.children[key] = self:buildVisualizationTree(value, childPath, depth + 1, options)
    end
    
    return node
end

function StateInspector:printStateTree(tree, indent)
    indent = indent or 0
    local prefix = string.rep("  ", indent)
    
    if tree.type == "leaf" then
        local output = prefix .. "├─ " .. (tree.path:match("([^.]+)$") or tree.path)
        output = output .. " (" .. tree.dataType .. ")"
        if tree.value then
            output = output .. ": " .. tree.value
        end
        print(output)
        
    elseif tree.type == "branch" then
        local name = tree.path:match("([^.]+)$") or "root"
        print(prefix .. "├─ " .. name .. "/ (" .. tree.childCount .. " items)")
        
        for key, child in pairs(tree.children) do
            self:printStateTree(child, indent + 1)
        end
        
    elseif tree.type == "truncated" then
        print(prefix .. "├─ ... (" .. tree.message .. ", " .. tree.actualType .. ")")
    end
end

-- Debug Breakpoints
function StateInspector:setBreakpoint(path, condition)
    local breakpoint = {
        path = path,
        condition = condition,
        hitCount = 0,
        enabled = true,
        created = os.time()
    }
    
    self.breakpoints[path] = breakpoint
    return breakpoint
end

function StateInspector:removeBreakpoint(path)
    self.breakpoints[path] = nil
end

function StateInspector:checkBreakpoints()
    local triggered = {}
    
    for path, breakpoint in pairs(self.breakpoints) do
        if breakpoint.enabled then
            local currentValue = self:getStateValue(path)
            local shouldBreak = false
            
            if type(breakpoint.condition) == "function" then
                shouldBreak = breakpoint.condition(currentValue, path)
            elseif breakpoint.condition == nil then
                shouldBreak = (currentValue ~= nil)
            else
                shouldBreak = (currentValue == breakpoint.condition)
            end
            
            if shouldBreak then
                breakpoint.hitCount = breakpoint.hitCount + 1
                table.insert(triggered, {
                    path = path,
                    breakpoint = breakpoint,
                    currentValue = currentValue,
                    timestamp = os.time()
                })
            end
        end
    end
    
    return triggered
end

-- Utility Functions
function StateInspector:deepCopy(orig)
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

function StateInspector:deepEquals(a, b)
    if type(a) ~= type(b) then
        return false
    end
    
    if type(a) == 'table' then
        for k, v in pairs(a) do
            if not self:deepEquals(v, b[k]) then
                return false
            end
        end
        for k, v in pairs(b) do
            if not self:deepEquals(v, a[k]) then
                return false
            end
        end
        return true
    else
        return a == b
    end
end

function StateInspector:navigateToPath(obj, path)
    local keys = {}
    for key in string.gmatch(path, "[^.]+") do
        table.insert(keys, key)
    end
    
    local current = obj
    for _, key in ipairs(keys) do
        if type(current) ~= "table" then
            return nil
        end
        current = current[key]
        if current == nil then
            return nil
        end
    end
    
    return current
end

function StateInspector:setNestedValue(obj, path, value)
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

function StateInspector:countKeys(obj)
    if type(obj) ~= "table" then
        return 0
    end
    
    local count = 0
    for _ in pairs(obj) do
        count = count + 1
    end
    return count
end

function StateInspector:calculateStateSize(obj)
    if type(obj) ~= "table" then
        return 1
    end
    
    local size = 1
    for _, value in pairs(obj) do
        size = size + self:calculateStateSize(value)
    end
    return size
end

function StateInspector:calculateDepth(obj, currentDepth)
    currentDepth = currentDepth or 0
    
    if type(obj) ~= "table" then
        return currentDepth
    end
    
    local maxDepth = currentDepth
    for _, value in pairs(obj) do
        local childDepth = self:calculateDepth(value, currentDepth + 1)
        maxDepth = math.max(maxDepth, childDepth)
    end
    
    return maxDepth
end

function StateInspector:analyzeTypes(obj)
    local types = {}
    
    local function analyzeRecursive(value)
        local valueType = type(value)
        types[valueType] = (types[valueType] or 0) + 1
        
        if valueType == "table" then
            for _, v in pairs(value) do
                analyzeRecursive(v)
            end
        end
    end
    
    analyzeRecursive(obj)
    return types
end

function StateInspector:matchesFilter(path, filters)
    for _, filter in ipairs(filters) do
        if string.find(path, filter) then
            return true
        end
    end
    return false
end

-- Export inspection data
function StateInspector:exportInspection(inspection, format)
    format = format or "json"
    
    if format == "json" then
        -- Simple JSON-like export
        return self:toJSON(inspection)
    elseif format == "summary" then
        return self:toSummary(inspection)
    end
    
    return inspection
end

function StateInspector:toJSON(obj)
    if type(obj) == "table" then
        local parts = {}
        local isArray = self:isArray(obj)
        
        if isArray then
            for i = 1, #obj do
                table.insert(parts, self:toJSON(obj[i]))
            end
            return "[" .. table.concat(parts, ",") .. "]"
        else
            for k, v in pairs(obj) do
                table.insert(parts, '"' .. tostring(k) .. '":' .. self:toJSON(v))
            end
            return "{" .. table.concat(parts, ",") .. "}"
        end
    elseif type(obj) == "string" then
        return '"' .. obj .. '"'
    elseif type(obj) == "number" then
        return tostring(obj)
    elseif type(obj) == "boolean" then
        return obj and "true" or "false"
    else
        return "null"
    end
end

function StateInspector:isArray(obj)
    local count = 0
    for k, _ in pairs(obj) do
        count = count + 1
        if type(k) ~= "number" or k ~= count then
            return false
        end
    end
    return true
end

function StateInspector:toSummary(inspection)
    local summary = {
        "State Inspection Summary",
        "========================",
        "Label: " .. inspection.label,
        "Timestamp: " .. os.date("%Y-%m-%d %H:%M:%S", inspection.timestamp),
        "State Size: " .. inspection.metadata.stateSize .. " nodes",
        "Key Count: " .. inspection.metadata.keyCount,
        "Max Depth: " .. inspection.metadata.depth,
        "",
        "Data Types:"
    }
    
    for dataType, count in pairs(inspection.metadata.types) do
        table.insert(summary, "  " .. dataType .. ": " .. count)
    end
    
    return table.concat(summary, "\n")
end

return StateInspector