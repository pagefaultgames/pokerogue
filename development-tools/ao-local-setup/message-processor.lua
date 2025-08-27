-- Message Processing Simulation for AO Handlers
-- Simulates native AO Handlers pattern for development testing

local MessageProcessor = {}
MessageProcessor.__index = MessageProcessor

function MessageProcessor.new(emulator)
    local processor = setmetatable({}, MessageProcessor)
    processor.emulator = emulator
    processor.messageQueue = {}
    processor.processing = false
    return processor
end

-- Queue message for batch processing
function MessageProcessor:queueMessage(message)
    table.insert(self.messageQueue, message)
    return #self.messageQueue
end

-- Process single message immediately  
function MessageProcessor:processMessage(message)
    return self.emulator:sendMessage(message)
end

-- Process all queued messages in sequence
function MessageProcessor:processQueue()
    if self.processing then
        error("Message queue is already being processed")
    end
    
    self.processing = true
    local results = {}
    
    for i, message in ipairs(self.messageQueue) do
        local result = self.emulator:sendMessage(message)
        result.queuePosition = i
        table.insert(results, result)
    end
    
    -- Clear queue after processing
    self.messageQueue = {}
    self.processing = false
    
    return results
end

-- Create common message templates for testing
function MessageProcessor:createAuthMessage(wallet, action)
    return {
        From = wallet,
        Action = action or "Auth-Request",
        Data = "",
        Tags = {
            Wallet = wallet,
            Timestamp = tostring(os.time())
        }
    }
end

function MessageProcessor:createBattleMessage(wallet, battleData)
    return {
        From = wallet,
        Action = "Battle-Action",
        Data = battleData or "{}",
        Tags = {
            Wallet = wallet,
            Type = "battle",
            Timestamp = tostring(os.time())
        }
    }
end

function MessageProcessor:createQueryMessage(wallet, queryType)
    return {
        From = wallet,
        Action = "Query",
        Data = queryType or "state",
        Tags = {
            Wallet = wallet,
            QueryType = queryType or "state",
            Timestamp = tostring(os.time())
        }
    }
end

-- Simulate message validation
function MessageProcessor:validateMessage(message)
    local errors = {}
    
    if not message.From or message.From == "" then
        table.insert(errors, "Missing required field: From")
    end
    
    if not message.Action or message.Action == "" then
        table.insert(errors, "Missing required field: Action")  
    end
    
    -- Wallet address validation (basic pattern)
    if message.From and not string.match(message.From, "^[a-zA-Z0-9_-]+$") then
        table.insert(errors, "Invalid wallet address format")
    end
    
    return #errors == 0, errors
end

-- Simulate multi-turn game scenarios
function MessageProcessor:createGameScenario(players, actions)
    local scenario = {
        players = players or {"player1", "player2"},
        messages = {},
        expectedStates = {}
    }
    
    for turnIndex, turnActions in ipairs(actions) do
        for playerIndex, action in ipairs(turnActions) do
            local player = scenario.players[playerIndex]
            if player and action then
                local message = {
                    From = player,
                    Action = action.type or "Game-Action",
                    Data = action.data or "{}",
                    Tags = {
                        Wallet = player,
                        Turn = tostring(turnIndex),
                        Timestamp = tostring(os.time() + turnIndex)
                    }
                }
                
                table.insert(scenario.messages, message)
            end
        end
    end
    
    return scenario
end

-- Execute a complete game scenario
function MessageProcessor:executeScenario(scenario)
    local results = {
        scenario = scenario,
        messageResults = {},
        finalState = nil,
        errors = {}
    }
    
    for i, message in ipairs(scenario.messages) do
        local valid, validationErrors = self:validateMessage(message)
        
        if not valid then
            table.insert(results.errors, {
                messageIndex = i,
                message = message,
                validationErrors = validationErrors
            })
        else
            local result = self:processMessage(message)
            result.messageIndex = i
            table.insert(results.messageResults, result)
        end
    end
    
    results.finalState = self.emulator:getState()
    return results
end

-- Message sequence testing for complex workflows
function MessageProcessor:testMessageSequence(sequence)
    local results = {
        sequence = sequence,
        steps = {},
        finalState = nil,
        success = true
    }
    
    for stepIndex, step in ipairs(sequence) do
        local stepResult = {
            step = stepIndex,
            description = step.description or "Unnamed step",
            messages = {},
            stateAfter = nil,
            success = true,
            errors = {}
        }
        
        -- Process messages in this step
        for _, message in ipairs(step.messages or {}) do
            local valid, validationErrors = self:validateMessage(message)
            
            if not valid then
                stepResult.success = false
                results.success = false
                table.insert(stepResult.errors, {
                    message = message,
                    validationErrors = validationErrors
                })
            else
                local messageResult = self:processMessage(message)
                table.insert(stepResult.messages, messageResult)
            end
        end
        
        stepResult.stateAfter = self.emulator:getState()
        
        -- Validate expected state if provided
        if step.expectedState then
            local stateValid = self:validateExpectedState(stepResult.stateAfter, step.expectedState)
            if not stateValid then
                stepResult.success = false
                results.success = false
                table.insert(stepResult.errors, "State validation failed")
            end
        end
        
        table.insert(results.steps, stepResult)
        
        -- Stop processing if this step failed and stopOnError is set
        if not stepResult.success and step.stopOnError then
            break
        end
    end
    
    results.finalState = self.emulator:getState()
    return results
end

-- Validate expected state structure
function MessageProcessor:validateExpectedState(actualState, expectedState)
    local function validateValue(actual, expected, path)
        path = path or "root"
        
        if type(expected) ~= type(actual) then
            return false, path .. ": type mismatch"
        end
        
        if type(expected) == "table" then
            for key, expectedValue in pairs(expected) do
                local actualValue = actual[key]
                local valid, error = validateValue(actualValue, expectedValue, path .. "." .. tostring(key))
                if not valid then
                    return false, error
                end
            end
        else
            if actual ~= expected then
                return false, path .. ": value mismatch"
            end
        end
        
        return true
    end
    
    return validateValue(actualState, expectedState)
end

return MessageProcessor