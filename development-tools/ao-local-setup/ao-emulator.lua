-- Local AO Process Emulation for Development and Testing
-- Provides native AO Handlers pattern simulation without network deployment

local AOEmulator = {}
AOEmulator.__index = AOEmulator

-- Global AO state simulation
local ao = {
    id = "test-process-id",
    env = {
        Process = {
            Id = "test-process-id",
            Owner = "test-owner-address"
        }
    }
}

-- Handler registry for native AO Handlers pattern
local Handlers = {
    list = {},
    add = function(self, name, pattern, handler)
        table.insert(self.list, {
            name = name,
            pattern = pattern,
            handler = handler
        })
    end,
    
    -- Execute matching handlers for a message
    handle = function(self, message)
        local results = {}
        for _, handlerInfo in ipairs(self.list) do
            local match = false
            
            -- Pattern matching logic
            if type(handlerInfo.pattern) == "string" then
                match = (message.Action == handlerInfo.pattern)
            elseif type(handlerInfo.pattern) == "function" then
                match = handlerInfo.pattern(message)
            end
            
            if match then
                local success, result = pcall(handlerInfo.handler, message)
                if success then
                    table.insert(results, {
                        handler = handlerInfo.name,
                        success = true,
                        result = result
                    })
                else
                    table.insert(results, {
                        handler = handlerInfo.name,
                        success = false,
                        error = result
                    })
                end
            end
        end
        return results
    end
}

function AOEmulator.new(options)
    local emulator = setmetatable({}, AOEmulator)
    
    -- Process state
    emulator.processId = options.processId or "test-process-" .. tostring(math.random(1000000))
    emulator.owner = options.owner or "test-owner-" .. tostring(math.random(1000000))
    emulator.state = {}
    emulator.messages = {}
    emulator.messageCounter = 0
    
    -- Set global ao for handler compatibility
    ao.id = emulator.processId
    ao.env.Process.Id = emulator.processId
    ao.env.Process.Owner = emulator.owner
    
    return emulator
end

function AOEmulator:loadProcess(processFilePath)
    -- Clear existing handlers
    Handlers.list = {}
    
    -- Set up global environment
    local env = {
        ao = ao,
        Handlers = Handlers,
        print = print,
        table = table,
        string = string,
        math = math,
        pairs = pairs,
        ipairs = ipairs,
        type = type,
        tostring = tostring,
        tonumber = tonumber,
        assert = assert,
        error = error,
        pcall = pcall,
        xpcall = xpcall,
        require = require,
        -- Add process state access
        State = self.state
    }
    
    -- Load the process file in the controlled environment
    local chunk, err = loadfile(processFilePath)
    if not chunk then
        error("Failed to load process file: " .. err)
    end
    
    setfenv(chunk, env)
    local success, result = pcall(chunk)
    
    if not success then
        error("Failed to execute process file: " .. result)
    end
    
    return true
end

function AOEmulator:sendMessage(message)
    self.messageCounter = self.messageCounter + 1
    
    -- Create standard AO message structure
    local aoMessage = {
        Id = "msg-" .. tostring(self.messageCounter),
        From = message.From or "test-sender",
        Owner = message.Owner or message.From or "test-sender",
        Action = message.Action,
        Data = message.Data or "",
        Tags = message.Tags or {},
        Timestamp = os.time(),
        Target = self.processId,
        -- Add custom fields
        ["Block-Height"] = message["Block-Height"] or "1000000",
        Module = message.Module or "test-module"
    }
    
    -- Store message
    table.insert(self.messages, aoMessage)
    
    -- Process through handlers
    local results = Handlers:handle(aoMessage)
    
    return {
        message = aoMessage,
        results = results,
        state = self:getState()
    }
end

function AOEmulator:getState()
    -- Return deep copy of state
    local function deepCopy(orig)
        local orig_type = type(orig)
        local copy
        if orig_type == 'table' then
            copy = {}
            for orig_key, orig_value in pairs(orig) do
                copy[orig_key] = deepCopy(orig_value)
            end
        else
            copy = orig
        end
        return copy
    end
    
    return deepCopy(self.state)
end

function AOEmulator:getMessages(filter)
    local filtered = {}
    
    for _, msg in ipairs(self.messages) do
        local include = true
        
        if filter then
            if filter.Action and msg.Action ~= filter.Action then
                include = false
            end
            if filter.From and msg.From ~= filter.From then
                include = false
            end
            if filter.limit and #filtered >= filter.limit then
                break
            end
        end
        
        if include then
            table.insert(filtered, msg)
        end
    end
    
    return filtered
end

function AOEmulator:reset()
    self.state = {}
    self.messages = {}
    self.messageCounter = 0
    Handlers.list = {}
end

-- Export for use in tests
return {
    AOEmulator = AOEmulator,
    ao = ao,
    Handlers = Handlers
}