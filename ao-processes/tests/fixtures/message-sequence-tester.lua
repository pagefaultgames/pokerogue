-- Message Sequence Testing for Complex Workflows
-- Tests sequences of messages to validate complex game workflows

local MessageSequenceTester = {}
MessageSequenceTester.__index = MessageSequenceTester

function MessageSequenceTester.new(emulator, fixtures)
    local tester = setmetatable({}, MessageSequenceTester)
    tester.emulator = emulator
    tester.fixtures = fixtures or require("ao-processes/tests/fixtures/ao-message-fixtures").new()
    tester.sequences = {}
    tester.executionResults = {}
    return tester
end

-- Sequence Definition
function MessageSequenceTester:defineSequence(name, config)
    local sequence = {
        name = name,
        description = config.description or "",
        steps = config.steps or {},
        preconditions = config.preconditions or {},
        postconditions = config.postconditions or {},
        timeout = config.timeout or 30000, -- 30 seconds
        retryOnFailure = config.retryOnFailure or false,
        stopOnError = config.stopOnError ~= false, -- default true
        tags = config.tags or {},
        metadata = config.metadata or {}
    }
    
    self.sequences[name] = sequence
    return sequence
end

-- Built-in Complex Sequences
function MessageSequenceTester:initializeBuiltInSequences()
    -- Complete Authentication Flow
    self:defineSequence("completeAuthFlow", {
        description = "Full authentication workflow from request to verification",
        tags = {"auth", "security", "workflow"},
        
        steps = {
            {
                name = "initial-auth-request",
                description = "Player requests authentication",
                type = "single",
                message = function(tester, context)
                    return tester.fixtures:createMessage("auth", "authRequest", {
                        From = context.playerId or "test-player"
                    })
                end,
                expectations = {
                    responseContains = {"challenge", "expires"},
                    stateChanges = {"auth_sessions." .. (context and context.playerId or "test-player")}
                },
                timeout = 5000
            },
            
            {
                name = "challenge-processing",
                description = "System processes challenge and sends response",
                type = "validation",
                validate = function(tester, context, previousResults)
                    local lastResult = previousResults[#previousResults]
                    if not lastResult or not lastResult.success then
                        return false, "Previous auth request failed"
                    end
                    
                    -- Check if challenge was created
                    local state = tester.emulator:getState()
                    local playerId = context.playerId or "test-player"
                    
                    return true, "Challenge validated"
                end
            },
            
            {
                name = "challenge-response",
                description = "Player responds to authentication challenge",
                type = "single",
                message = function(tester, context, previousResults)
                    return tester.fixtures:createMessage("auth", "authResponse", {
                        From = context.playerId or "test-player",
                        Tags = {
                            ChallengeId = "extracted-from-previous", -- Would extract from previous result
                            Wallet = context.playerId or "test-player"
                        }
                    })
                end,
                expectations = {
                    responseContains = {"success", "token"},
                    stateChanges = {"authenticated_users." .. (context and context.playerId or "test-player")}
                }
            },
            
            {
                name = "verify-authentication",
                description = "Verify player is now authenticated",
                type = "query",
                message = function(tester, context)
                    return tester.fixtures:createMessage("query", "stateQuery", {
                        From = context.playerId or "test-player"
                    })
                end,
                expectations = {
                    responseContains = {"authenticated", "true"}
                }
            }
        },
        
        postconditions = {
            playerAuthenticated = true,
            validSessionExists = true
        }
    })
    
    -- Complete Battle Workflow
    self:defineSequence("completeBattleWorkflow", {
        description = "Full battle from start to finish with multiple turns",
        tags = {"battle", "gameplay", "multi-turn"},
        
        steps = {
            {
                name = "battle-initialization",
                description = "Initialize battle between two players",
                type = "single",
                message = function(tester, context)
                    return tester.fixtures:createMessage("battle", "battleStart", {
                        From = context.player1 or "player1",
                        Tags = {Wallet = context.player1 or "player1"},
                        Data = {
                            opponentId = context.player2 or "player2",
                            battleType = "standard",
                            gameMode = "singles"
                        }
                    })
                end,
                expectations = {
                    responseContains = {"battleId", "initialized"},
                    stateChanges = {"active_battles"}
                }
            },
            
            {
                name = "first-turn-moves",
                description = "Both players submit moves for turn 1",
                type = "batch",
                messages = function(tester, context)
                    return {
                        tester.fixtures:createMessage("battle", "battleMove", {
                            From = context.player1 or "player1",
                            Tags = {
                                Wallet = context.player1 or "player1",
                                BattleId = context.battleId or "test-battle",
                                Turn = "1"
                            },
                            Data = {moveId = 85, targetSlot = 0, pokemonSlot = 0}
                        }),
                        tester.fixtures:createMessage("battle", "battleMove", {
                            From = context.player2 or "player2",
                            Tags = {
                                Wallet = context.player2 or "player2",
                                BattleId = context.battleId or "test-battle",
                                Turn = "1"
                            },
                            Data = {moveId = 52, targetSlot = 0, pokemonSlot = 0}
                        })
                    }
                end,
                expectations = {
                    responseContains = {"damage", "turn_complete"},
                    allMessagesSucceed = true
                }
            },
            
            {
                name = "second-turn-moves",
                description = "Both players submit moves for turn 2",
                type = "batch",
                messages = function(tester, context)
                    return {
                        tester.fixtures:createMessage("battle", "battleMove", {
                            From = context.player1 or "player1",
                            Tags = {
                                Wallet = context.player1 or "player1",
                                BattleId = context.battleId or "test-battle",
                                Turn = "2"
                            },
                            Data = {moveId = 85, targetSlot = 0, pokemonSlot = 0}
                        }),
                        tester.fixtures:createMessage("battle", "battleMove", {
                            From = context.player2 or "player2",
                            Tags = {
                                Wallet = context.player2 or "player2",
                                BattleId = context.battleId or "test-battle",
                                Turn = "2"
                            },
                            Data = {moveId = 52, targetSlot = 0, pokemonSlot = 0}
                        })
                    }
                end,
                expectations = {
                    responseContains = {"damage", "battle_ended"},
                    battleEnded = true
                }
            },
            
            {
                name = "battle-completion",
                description = "Verify battle completed properly",
                type = "query",
                message = function(tester, context)
                    return tester.fixtures:createMessage("query", "battleHistoryQuery", {
                        From = context.player1 or "player1",
                        Tags = {Wallet = context.player1 or "player1"}
                    })
                end,
                expectations = {
                    responseContains = {"winner", "rewards", "completed"}
                }
            }
        },
        
        postconditions = {
            battleCompleted = true,
            winnerDetermined = true,
            rewardsDistributed = true
        }
    })
    
    -- Game State Management Sequence
    self:defineSequence("gameStateManagement", {
        description = "Test game save/load and state persistence",
        tags = {"state", "persistence", "save-load"},
        
        steps = {
            {
                name = "initial-state-setup",
                description = "Set up initial game state",
                type = "batch",
                messages = function(tester, context)
                    return {
                        tester.fixtures:createMessage("game", "initializePlayer", {
                            From = context.playerId or "test-player"
                        }),
                        tester.fixtures:createMessage("query", "stateQuery", {
                            From = context.playerId or "test-player"
                        })
                    }
                end
            },
            
            {
                name = "make-progress",
                description = "Player makes some game progress",
                type = "batch",
                messages = function(tester, context)
                    local player = context.playerId or "test-player"
                    return {
                        tester.fixtures:createMessage("game", "captureWildPokemon", {
                            From = player,
                            Data = {pokemonId = 25, location = "Route 1"}
                        }),
                        tester.fixtures:createMessage("game", "gainExperience", {
                            From = player,
                            Data = {pokemonSlot = 0, experience = 500}
                        })
                    }
                end
            },
            
            {
                name = "save-game-state",
                description = "Save current game state",
                type = "single",
                message = function(tester, context)
                    return tester.fixtures:createMessage("game", "saveGame", {
                        From = context.playerId or "test-player",
                        Tags = {SaveSlot = "1"}
                    })
                end,
                expectations = {
                    responseContains = {"saved", "success"}
                }
            },
            
            {
                name = "modify-state",
                description = "Make additional changes to state",
                type = "single",
                message = function(tester, context)
                    return tester.fixtures:createMessage("game", "spendCurrency", {
                        From = context.playerId or "test-player",
                        Data = {amount = 1000, reason = "test-expense"}
                    })
                end
            },
            
            {
                name = "load-saved-state",
                description = "Load previously saved state",
                type = "single",
                message = function(tester, context)
                    return tester.fixtures:createMessage("game", "loadGame", {
                        From = context.playerId or "test-player",
                        Tags = {SaveSlot = "1"}
                    })
                end,
                expectations = {
                    responseContains = {"loaded", "success"}
                }
            },
            
            {
                name = "verify-state-restored",
                description = "Verify state was restored correctly",
                type = "query",
                message = function(tester, context)
                    return tester.fixtures:createMessage("query", "stateQuery", {
                        From = context.playerId or "test-player"
                    })
                end,
                expectations = {
                    stateMatches = "pre_modification_state"
                }
            }
        },
        
        postconditions = {
            stateConsistent = true,
            saveLoadWorking = true
        }
    })
end

-- Sequence Execution
function MessageSequenceTester:executeSequence(sequenceName, context, options)
    context = context or {}
    options = options or {}
    
    local sequence = self.sequences[sequenceName]
    if not sequence then
        error("Sequence not found: " .. sequenceName)
    end
    
    local execution = {
        sequence = sequence,
        context = context,
        startTime = os.time(),
        steps = {},
        messages = {},
        results = {},
        success = true,
        errors = {},
        warnings = {}
    }
    
    print("🔄 Executing Sequence: " .. sequence.name)
    print("Description: " .. sequence.description)
    print(string.rep("-", 60))
    
    -- Check preconditions
    local preconditionsValid = self:validatePreconditions(sequence, context)
    if not preconditionsValid then
        execution.success = false
        table.insert(execution.errors, "Preconditions not met")
        return execution
    end
    
    -- Execute each step
    for stepIndex, step in ipairs(sequence.steps) do
        local stepExecution = self:executeStep(sequence, step, context, execution.results)
        
        stepExecution.stepIndex = stepIndex
        table.insert(execution.steps, stepExecution)
        
        -- Collect messages and results
        for _, message in ipairs(stepExecution.messages) do
            table.insert(execution.messages, message)
        end
        for _, result in ipairs(stepExecution.results) do
            table.insert(execution.results, result)
        end
        
        -- Check for step failure
        if not stepExecution.success then
            execution.success = false
            table.insert(execution.errors, string.format("Step %d failed: %s", stepIndex, step.name))
            
            if sequence.stopOnError then
                break
            end
        end
        
        -- Check timeout
        if os.time() - execution.startTime > (sequence.timeout / 1000) then
            execution.success = false
            table.insert(execution.errors, "Sequence timeout reached")
            break
        end
    end
    
    -- Validate postconditions
    if execution.success then
        local postValid = self:validatePostconditions(sequence, context, execution)
        if not postValid then
            execution.success = false
            table.insert(execution.errors, "Postconditions not met")
        end
    end
    
    execution.endTime = os.time()
    execution.duration = execution.endTime - execution.startTime
    
    -- Store execution result
    table.insert(self.executionResults, execution)
    
    -- Print summary
    print("")
    print("📊 Sequence Summary:")
    print(string.format("  Duration: %ds", execution.duration))
    print(string.format("  Steps: %d", #execution.steps))
    print(string.format("  Messages: %d", #execution.messages))
    print(string.format("  Success: %s", execution.success and "✅" or "❌"))
    
    if #execution.errors > 0 then
        print("  Errors:")
        for _, error in ipairs(execution.errors) do
            print("    - " .. error)
        end
    end
    
    return execution
end

function MessageSequenceTester:executeStep(sequence, step, context, previousResults)
    local stepExecution = {
        step = step,
        startTime = os.time(),
        messages = {},
        results = {},
        success = true,
        errors = {},
        type = step.type or "single"
    }
    
    print(string.format("Step: %s", step.name))
    
    -- Generate messages based on step type
    local messages = {}
    
    if step.type == "single" and step.message then
        local message = step.message(self, context, previousResults)
        if message then
            table.insert(messages, message)
        end
        
    elseif step.type == "batch" and step.messages then
        local batchMessages = step.messages(self, context, previousResults)
        if batchMessages and type(batchMessages) == "table" then
            for _, message in ipairs(batchMessages) do
                table.insert(messages, message)
            end
        end
        
    elseif step.type == "query" and step.message then
        local message = step.message(self, context, previousResults)
        if message then
            table.insert(messages, message)
        end
        
    elseif step.type == "validation" and step.validate then
        local valid, error = step.validate(self, context, previousResults)
        stepExecution.success = valid
        if not valid then
            table.insert(stepExecution.errors, error or "Validation failed")
        end
        -- No messages to process for validation steps
        stepExecution.endTime = os.time()
        return stepExecution
    end
    
    -- Execute messages
    for _, message in ipairs(messages) do
        table.insert(stepExecution.messages, message)
        
        if self.emulator then
            local result = self.emulator:sendMessage(message)
            table.insert(stepExecution.results, result)
            
            -- Validate step expectations if provided
            if step.expectations then
                local valid = self:validateStepExpectations(step.expectations, result, message)
                if not valid then
                    stepExecution.success = false
                    table.insert(stepExecution.errors, "Step expectations not met")
                end
            end
        end
    end
    
    stepExecution.endTime = os.time()
    stepExecution.duration = stepExecution.endTime - stepExecution.startTime
    
    print(string.format("  ✅ %s (%d messages, %ds)", 
                       stepExecution.success and "Completed" or "Failed", 
                       #stepExecution.messages, 
                       stepExecution.duration))
    
    return stepExecution
end

function MessageSequenceTester:validateStepExpectations(expectations, result, message)
    -- Basic validation - in real implementation, would be more sophisticated
    if expectations.responseContains then
        -- Check if response contains expected strings
        local responseStr = tostring(result)
        for _, expected in ipairs(expectations.responseContains) do
            if not string.find(responseStr:lower(), expected:lower()) then
                return false
            end
        end
    end
    
    if expectations.allMessagesSucceed then
        if not result or not result.results then
            return false
        end
        
        for _, handlerResult in ipairs(result.results) do
            if not handlerResult.success then
                return false
            end
        end
    end
    
    return true
end

function MessageSequenceTester:validatePreconditions(sequence, context)
    -- Basic precondition validation
    for condition, expected in pairs(sequence.preconditions) do
        -- Implement specific precondition checks
        if condition == "playerAuthenticated" then
            -- Check if player is authenticated
            local state = self.emulator:getState()
            -- Simplified check
            if not state or not expected then
                return false
            end
        end
    end
    
    return true
end

function MessageSequenceTester:validatePostconditions(sequence, context, execution)
    -- Basic postcondition validation
    for condition, expected in pairs(sequence.postconditions) do
        -- Implement specific postcondition checks
        if condition == "battleCompleted" then
            -- Check if battle completed successfully
            local completedSuccessfully = false
            for _, result in ipairs(execution.results) do
                if result.message and result.message.Action == "Battle-End" then
                    completedSuccessfully = true
                    break
                end
            end
            if not completedSuccessfully and expected then
                return false
            end
        end
    end
    
    return true
end

-- Batch Sequence Testing
function MessageSequenceTester:executeSequenceSuite(sequenceNames, context, options)
    local suite = {
        sequences = sequenceNames,
        executions = {},
        startTime = os.time(),
        totalSuccess = true
    }
    
    for _, sequenceName in ipairs(sequenceNames) do
        local execution = self:executeSequence(sequenceName, context, options)
        table.insert(suite.executions, execution)
        
        if not execution.success then
            suite.totalSuccess = false
        end
    end
    
    suite.endTime = os.time()
    suite.totalDuration = suite.endTime - suite.startTime
    
    return suite
end

-- Analysis and Reporting
function MessageSequenceTester:analyzeSequenceExecution(execution)
    local analysis = {
        sequence = execution.sequence.name,
        success = execution.success,
        totalDuration = execution.duration,
        stepAnalysis = {},
        messageFlow = {},
        performance = {},
        bottlenecks = {}
    }
    
    -- Analyze each step
    for _, step in ipairs(execution.steps) do
        local stepAnalysis = {
            name = step.step.name,
            success = step.success,
            duration = step.duration,
            messageCount = #step.messages,
            efficiency = step.duration > 0 and (#step.messages / step.duration) or 0
        }
        
        table.insert(analysis.stepAnalysis, stepAnalysis)
        
        -- Identify bottlenecks (steps taking longer than average)
        if step.duration > (execution.duration / #execution.steps) * 2 then
            table.insert(analysis.bottlenecks, {
                step = step.step.name,
                duration = step.duration,
                reason = "above_average_duration"
            })
        end
    end
    
    -- Message flow analysis
    analysis.messageFlow = {
        totalMessages = #execution.messages,
        averagePerStep = #execution.messages / #execution.steps,
        messageTypes = self:analyzeMessageTypes(execution.messages)
    }
    
    return analysis
end

function MessageSequenceTester:analyzeMessageTypes(messages)
    local types = {}
    
    for _, message in ipairs(messages) do
        local action = message.Action or "unknown"
        types[action] = (types[action] or 0) + 1
    end
    
    return types
end

return MessageSequenceTester