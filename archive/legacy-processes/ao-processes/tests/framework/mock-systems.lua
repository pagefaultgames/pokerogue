-- Advanced Mock Systems for AO Handler Testing
-- Provides sophisticated mocking for RNG, database, and external dependencies

local MockSystems = {}
MockSystems.__index = MockSystems

function MockSystems.new()
    local mocks = setmetatable({}, MockSystems)
    mocks.activeMocks = {}
    mocks.originalFunctions = {}
    mocks.callHistory = {}
    return mocks
end

-- RNG Mock System
function MockSystems:mockRNG(config)
    config = config or {}
    
    local rngMock = {
        seed = config.seed or 12345,
        sequence = config.sequence or {},
        sequenceIndex = 1,
        callCount = 0,
        deterministicMode = config.deterministicMode ~= false -- default true
    }
    
    -- Store original functions
    self.originalFunctions.mathRandom = math.random
    self.originalFunctions.mathRandomseed = math.randomseed
    self.originalFunctions.osTime = os.time
    
    -- Mock math.random
    math.random = function(min, max)
        rngMock.callCount = rngMock.callCount + 1
        
        local value
        if #rngMock.sequence > 0 then
            -- Use predefined sequence
            value = rngMock.sequence[rngMock.sequenceIndex]
            rngMock.sequenceIndex = ((rngMock.sequenceIndex - 1) % #rngMock.sequence) + 1
        else
            -- Generate deterministic values based on seed and call count
            if rngMock.deterministicMode then
                value = (rngMock.seed + rngMock.callCount * 1103515245 + 12345) % 2147483647
                value = value / 2147483647 -- Normalize to [0,1)
            else
                value = self.originalFunctions.mathRandom()
            end
        end
        
        -- Record call
        table.insert(self.callHistory, {
            function_name = "math.random",
            args = {min, max},
            result = value,
            timestamp = os.time(),
            callIndex = rngMock.callCount
        })
        
        -- Apply range if specified
        if min and max then
            return math.floor(value * (max - min + 1)) + min
        elseif min then
            return math.floor(value * min) + 1
        else
            return value
        end
    end
    
    -- Mock math.randomseed
    math.randomseed = function(seed)
        rngMock.seed = seed
        rngMock.callCount = 0
        
        table.insert(self.callHistory, {
            function_name = "math.randomseed",
            args = {seed},
            result = nil,
            timestamp = os.time()
        })
    end
    
    self.activeMocks.rng = rngMock
    return rngMock
end

-- Crypto RNG Mock (AO-specific)
function MockSystems:mockCryptoRNG(config)
    config = config or {}
    
    local cryptoMock = {
        seed = config.seed or "default-battle-seed",
        counter = 0,
        randomValues = config.randomValues or {}
    }
    
    -- Mock AO crypto module
    local originalCrypto = _G.Crypto or {}
    
    _G.Crypto = {
        -- Mock deterministic random based on seed + counter
        random = function(seed, counter)
            cryptoMock.counter = cryptoMock.counter + 1
            
            local effectiveSeed = seed or cryptoMock.seed
            local effectiveCounter = counter or cryptoMock.counter
            
            -- Simple deterministic function for testing
            local value = 0
            for i = 1, string.len(effectiveSeed) do
                value = value + string.byte(effectiveSeed, i)
            end
            value = (value * effectiveCounter * 1103515245 + 12345) % 2147483647
            local normalizedValue = value / 2147483647
            
            table.insert(self.callHistory, {
                function_name = "Crypto.random",
                args = {effectiveSeed, effectiveCounter},
                result = normalizedValue,
                timestamp = os.time()
            })
            
            return normalizedValue
        end,
        
        -- Mock for getting random bytes
        randomBytes = function(length)
            local bytes = {}
            for i = 1, length do
                table.insert(bytes, math.floor(_G.Crypto.random() * 256))
            end
            return bytes
        end
    }
    
    self.originalFunctions.crypto = originalCrypto
    self.activeMocks.crypto = cryptoMock
    return cryptoMock
end

-- Database Mock System
function MockSystems:mockDatabase(config)
    config = config or {}
    
    local dbMock = {
        data = config.initialData or {},
        queries = {},
        transactions = {},
        currentTransaction = nil
    }
    
    -- Mock database operations
    local Database = {
        -- Mock query execution
        query = function(sql, params)
            params = params or {}
            
            local query = {
                sql = sql,
                params = params,
                timestamp = os.time(),
                result = nil
            }
            
            -- Simple query simulation
            if string.find(sql:lower(), "select") then
                -- Mock SELECT queries
                if string.find(sql:lower(), "pokemon") then
                    query.result = dbMock.data.pokemon or {}
                elseif string.find(sql:lower(), "moves") then
                    query.result = dbMock.data.moves or {}
                elseif string.find(sql:lower(), "items") then
                    query.result = dbMock.data.items or {}
                else
                    query.result = {}
                end
            elseif string.find(sql:lower(), "insert") then
                -- Mock INSERT queries
                query.result = {affected_rows = 1, insert_id = #dbMock.queries + 1}
            elseif string.find(sql:lower(), "update") then
                -- Mock UPDATE queries
                query.result = {affected_rows = 1}
            elseif string.find(sql:lower(), "delete") then
                -- Mock DELETE queries
                query.result = {affected_rows = 1}
            end
            
            table.insert(dbMock.queries, query)
            
            table.insert(self.callHistory, {
                function_name = "Database.query",
                args = {sql, params},
                result = query.result,
                timestamp = os.time()
            })
            
            return query.result
        end,
        
        -- Mock transaction support
        beginTransaction = function()
            dbMock.currentTransaction = {
                id = "tx_" .. tostring(os.time()),
                queries = {},
                started_at = os.time()
            }
            
            table.insert(self.callHistory, {
                function_name = "Database.beginTransaction",
                args = {},
                result = dbMock.currentTransaction.id,
                timestamp = os.time()
            })
            
            return dbMock.currentTransaction.id
        end,
        
        commitTransaction = function()
            if dbMock.currentTransaction then
                table.insert(dbMock.transactions, dbMock.currentTransaction)
                dbMock.currentTransaction = nil
                
                table.insert(self.callHistory, {
                    function_name = "Database.commitTransaction",
                    args = {},
                    result = true,
                    timestamp = os.time()
                })
                
                return true
            end
            return false
        end,
        
        rollbackTransaction = function()
            if dbMock.currentTransaction then
                dbMock.currentTransaction = nil
                
                table.insert(self.callHistory, {
                    function_name = "Database.rollbackTransaction",
                    args = {},
                    result = true,
                    timestamp = os.time()
                })
                
                return true
            end
            return false
        end
    }
    
    -- Store original if exists
    self.originalFunctions.database = _G.Database
    _G.Database = Database
    
    self.activeMocks.database = dbMock
    return dbMock
end

-- External API Mock System
function MockSystems:mockExternalAPI(apiName, config)
    config = config or {}
    
    local apiMock = {
        name = apiName,
        responses = config.responses or {},
        latency = config.latency or 0,
        failureRate = config.failureRate or 0,
        callCount = 0
    }
    
    local API = {
        request = function(method, endpoint, data, headers)
            apiMock.callCount = apiMock.callCount + 1
            
            -- Simulate latency
            if apiMock.latency > 0 then
                -- In real implementation, would use actual delay
                -- For testing, we just record the intended delay
            end
            
            -- Simulate failures
            if apiMock.failureRate > 0 and math.random() < apiMock.failureRate then
                local errorResponse = {
                    status = 500,
                    error = "Simulated API failure",
                    body = nil
                }
                
                table.insert(self.callHistory, {
                    function_name = apiName .. ".request",
                    args = {method, endpoint, data, headers},
                    result = errorResponse,
                    timestamp = os.time(),
                    success = false
                })
                
                return errorResponse
            end
            
            -- Return mock response
            local responseKey = method .. " " .. endpoint
            local response = apiMock.responses[responseKey] or {
                status = 200,
                body = {success = true, message = "Mock response"}
            }
            
            table.insert(self.callHistory, {
                function_name = apiName .. ".request",
                args = {method, endpoint, data, headers},
                result = response,
                timestamp = os.time(),
                success = true
            })
            
            return response
        end
    }
    
    self.originalFunctions[apiName] = _G[apiName]
    _G[apiName] = API
    
    self.activeMocks[apiName] = apiMock
    return apiMock
end

-- AO Message Mock System
function MockSystems:mockAOMessages(config)
    config = config or {}
    
    local messageMock = {
        messages = {},
        responses = config.responses or {},
        messageCounter = 0
    }
    
    -- Mock ao global
    local originalAO = _G.ao or {}
    
    _G.ao = {
        id = config.processId or "test-process",
        env = originalAO.env or {
            Process = {
                Id = config.processId or "test-process",
                Owner = config.owner or "test-owner"
            }
        },
        
        -- Mock message sending
        send = function(target, message)
            messageMock.messageCounter = messageMock.messageCounter + 1
            
            local sentMessage = {
                id = "msg_" .. messageMock.messageCounter,
                target = target,
                action = message.Action,
                data = message.Data,
                tags = message.Tags,
                timestamp = os.time()
            }
            
            table.insert(messageMock.messages, sentMessage)
            
            table.insert(self.callHistory, {
                function_name = "ao.send",
                args = {target, message},
                result = sentMessage.id,
                timestamp = os.time()
            })
            
            return sentMessage.id
        end,
        
        -- Mock getting process info
        id = config.processId or "test-process"
    }
    
    self.originalFunctions.ao = originalAO
    self.activeMocks.ao = messageMock
    return messageMock
end

-- Utility Functions
function MockSystems:resetMock(mockName)
    local mock = self.activeMocks[mockName]
    if mock then
        if mockName == "rng" then
            mock.callCount = 0
            mock.sequenceIndex = 1
        elseif mockName == "database" then
            mock.queries = {}
            mock.transactions = {}
            mock.currentTransaction = nil
        elseif mockName == "crypto" then
            mock.counter = 0
        end
    end
    
    -- Clear related call history
    local newHistory = {}
    for _, call in ipairs(self.callHistory) do
        if not string.find(call.function_name:lower(), mockName:lower()) then
            table.insert(newHistory, call)
        end
    end
    self.callHistory = newHistory
end

function MockSystems:resetAllMocks()
    for mockName, _ in pairs(self.activeMocks) do
        self:resetMock(mockName)
    end
end

function MockSystems:restoreOriginal(mockName)
    if self.originalFunctions[mockName] then
        if mockName == "rng" then
            math.random = self.originalFunctions.mathRandom
            math.randomseed = self.originalFunctions.mathRandomseed
        else
            _G[mockName] = self.originalFunctions[mockName]
        end
        
        self.originalFunctions[mockName] = nil
        self.activeMocks[mockName] = nil
    end
end

function MockSystems:restoreAll()
    for mockName, _ in pairs(self.originalFunctions) do
        self:restoreOriginal(mockName)
    end
end

function MockSystems:getCallHistory(functionName)
    if functionName then
        local filtered = {}
        for _, call in ipairs(self.callHistory) do
            if call.function_name == functionName then
                table.insert(filtered, call)
            end
        end
        return filtered
    end
    return self.callHistory
end

function MockSystems:getMockStats()
    local stats = {
        activeMocks = {},
        totalCalls = #self.callHistory,
        callsByFunction = {}
    }
    
    for mockName, mock in pairs(self.activeMocks) do
        stats.activeMocks[mockName] = mock
    end
    
    for _, call in ipairs(self.callHistory) do
        if not stats.callsByFunction[call.function_name] then
            stats.callsByFunction[call.function_name] = 0
        end
        stats.callsByFunction[call.function_name] = stats.callsByFunction[call.function_name] + 1
    end
    
    return stats
end

return MockSystems