--[[
End-to-End Integration Testing Framework
Tests complete workflows across all process boundaries in the distributed architecture
--]]

local json = require("json")

local EndToEndIntegrationTester = {
    integrationTests = {},
    workflowDefinitions = {},
    processConnections = {}
}

-- Define comprehensive end-to-end workflows
EndToEndIntegrationTester.workflowDefinitions = {
    complete_battle_workflow = {
        name = "Complete Battle Workflow",
        description = "Full battle from initiation to completion across all processes",
        processes = {"coordinator", "battle", "pokemon", "admin"},
        steps = {
            {
                step = 1,
                action = "initiate_battle_request",
                process = "coordinator",
                inputData = {
                    playerId = "test_player_1",
                    opponentType = "wild",
                    battleType = "single"
                },
                expectedOutputs = {
                    "battle_session_created",
                    "pokemon_data_requested"
                }
            },
            {
                step = 2,
                action = "fetch_pokemon_data",
                process = "pokemon",
                inputData = {
                    playerId = "test_player_1",
                    requestType = "battle_party"
                },
                expectedOutputs = {
                    "pokemon_data_response"
                }
            },
            {
                step = 3,
                action = "initialize_battle",
                process = "battle",
                inputData = {
                    playerParty = "{{pokemon_data_response}}",
                    opponentData = "wild_pokemon_encounter"
                },
                expectedOutputs = {
                    "battle_initialized",
                    "battle_state_created"
                }
            },
            {
                step = 4,
                action = "execute_battle_turn",
                process = "battle",
                inputData = {
                    playerAction = "use_move",
                    moveId = 85
                },
                expectedOutputs = {
                    "turn_executed",
                    "damage_calculated",
                    "battle_state_updated"
                }
            },
            {
                step = 5,
                action = "update_pokemon_stats",
                process = "pokemon",
                inputData = {
                    pokemonId = "{{battle_participant_id}}",
                    statUpdates = "{{battle_results}}"
                },
                expectedOutputs = {
                    "pokemon_stats_updated"
                }
            },
            {
                step = 6,
                action = "complete_battle",
                process = "coordinator",
                inputData = {
                    battleResult = "{{final_battle_result}}"
                },
                expectedOutputs = {
                    "battle_completed",
                    "rewards_calculated"
                }
            },
            {
                step = 7,
                action = "log_battle_completion",
                process = "admin",
                inputData = {
                    battleSummary = "{{complete_battle_data}}"
                },
                expectedOutputs = {
                    "battle_logged",
                    "metrics_updated"
                }
            }
        }
    },
    
    pokemon_evolution_workflow = {
        name = "Pokemon Evolution Workflow",
        description = "Complete Pokemon evolution process across coordination and Pokemon processes",
        processes = {"coordinator", "pokemon", "admin"},
        steps = {
            {
                step = 1,
                action = "check_evolution_conditions",
                process = "pokemon",
                inputData = {
                    pokemonId = "test_pokemon_1",
                    triggersEvaluated = {"level_up", "item_use", "happiness"}
                },
                expectedOutputs = {
                    "evolution_conditions_met"
                }
            },
            {
                step = 2,
                action = "initiate_evolution",
                process = "coordinator",
                inputData = {
                    pokemonId = "test_pokemon_1",
                    evolutionTrigger = "level_up",
                    newSpeciesId = 26 -- Raichu
                },
                expectedOutputs = {
                    "evolution_initiated",
                    "stat_recalculation_requested"
                }
            },
            {
                step = 3,
                action = "update_pokemon_species",
                process = "pokemon",
                inputData = {
                    pokemonId = "test_pokemon_1",
                    newSpeciesId = 26,
                    retainedMoves = {85, 86, 87},
                    newMoves = {89}
                },
                expectedOutputs = {
                    "species_updated",
                    "stats_recalculated",
                    "moves_updated"
                }
            },
            {
                step = 4,
                action = "log_evolution_event",
                process = "admin",
                inputData = {
                    pokemonId = "test_pokemon_1",
                    evolutionData = "{{evolution_complete_data}}"
                },
                expectedOutputs = {
                    "evolution_logged",
                    "player_achievement_updated"
                }
            }
        }
    },
    
    multi_process_item_usage_workflow = {
        name = "Multi-Process Item Usage Workflow",
        description = "Item usage affecting multiple game systems",
        processes = {"coordinator", "pokemon", "battle", "economy", "admin"},
        steps = {
            {
                step = 1,
                action = "validate_item_usage",
                process = "economy",
                inputData = {
                    playerId = "test_player_1",
                    itemId = "rare_candy",
                    quantity = 1
                },
                expectedOutputs = {
                    "item_validation_passed",
                    "inventory_updated"
                }
            },
            {
                step = 2,
                action = "coordinate_item_effect",
                process = "coordinator",
                inputData = {
                    itemId = "rare_candy",
                    targetPokemon = "test_pokemon_1",
                    effectType = "level_increase"
                },
                expectedOutputs = {
                    "item_effect_coordinated",
                    "pokemon_update_requested"
                }
            },
            {
                step = 3,
                action = "apply_pokemon_level_increase",
                process = "pokemon",
                inputData = {
                    pokemonId = "test_pokemon_1",
                    levelIncrease = 1,
                    triggerEvolution = true
                },
                expectedOutputs = {
                    "level_increased",
                    "stats_updated",
                    "evolution_check_triggered"
                }
            },
            {
                step = 4,
                action = "update_battle_stats",
                process = "battle",
                inputData = {
                    pokemonId = "test_pokemon_1",
                    statUpdates = "{{updated_pokemon_stats}}"
                },
                expectedOutputs = {
                    "battle_stats_synchronized"
                }
            },
            {
                step = 5,
                action = "log_item_usage",
                process = "admin",
                inputData = {
                    playerId = "test_player_1",
                    itemUsageData = "{{complete_item_usage_data}}"
                },
                expectedOutputs = {
                    "item_usage_logged",
                    "usage_statistics_updated"
                }
            }
        }
    }
}

-- Create integration test configuration
function EndToEndIntegrationTester.createIntegrationTestConfig(options)
    return {
        testId = options.testId or ("integration_test_" .. os.time()),
        workflows = options.workflows or {"complete_battle_workflow"},
        testIterations = options.testIterations or 10,
        timeoutPerWorkflow = options.timeoutPerWorkflow or 300, -- 5 minutes
        processEndpoints = options.processEndpoints or {
            coordinator = "coordinator-process-id",
            battle = "battle-process-id",
            pokemon = "pokemon-process-id",
            economy = "economy-process-id",
            admin = "admin-process-id"
        },
        recordDetailedLogs = options.recordDetailedLogs or true,
        validateProcessCommunication = options.validateProcessCommunication or true,
        testFailureHandling = options.testFailureHandling or true
    }
end

-- Execute comprehensive integration testing
function EndToEndIntegrationTester.executeIntegrationTesting(config)
    print(string.format("Starting end-to-end integration testing: %s", config.testId))
    print(string.format("Workflows: %s, Iterations: %d", 
          table.concat(config.workflows, ", "), config.testIterations))
    
    local integrationResults = {
        testId = config.testId,
        config = config,
        startTime = os.time(),
        workflowResults = {},
        communicationValidation = {},
        failureAnalysis = {},
        summary = {}
    }
    
    -- Initialize process connections
    EndToEndIntegrationTester.initializeProcessConnections(config)
    
    -- Execute integration tests for each workflow
    for _, workflowName in ipairs(config.workflows) do
        print(string.format("Testing workflow: %s", workflowName))
        
        local workflowDefinition = EndToEndIntegrationTester.workflowDefinitions[workflowName]
        if not workflowDefinition then
            print(string.format("Warning: Unknown workflow: %s", workflowName))
        else
            local workflowResults = EndToEndIntegrationTester.executeWorkflowTesting(
                workflowName, workflowDefinition, config
            )
            integrationResults.workflowResults[workflowName] = workflowResults
            
            -- Validate inter-process communication for this workflow
            if config.validateProcessCommunication then
                local communicationValidation = EndToEndIntegrationTester.validateProcessCommunication(
                    workflowName, workflowResults, config
                )
                integrationResults.communicationValidation[workflowName] = communicationValidation
            end
        end
    end
    
    -- Analyze failures and communication patterns
    integrationResults.failureAnalysis = EndToEndIntegrationTester.analyzeIntegrationFailures(
        integrationResults.workflowResults
    )
    
    -- Generate comprehensive summary
    integrationResults.summary = EndToEndIntegrationTester.generateIntegrationSummary(integrationResults)
    integrationResults.endTime = os.time()
    
    EndToEndIntegrationTester.integrationTests[config.testId] = integrationResults
    
    print(string.format("End-to-end integration testing completed: %s", config.testId))
    return integrationResults
end

-- Initialize process connections for testing
function EndToEndIntegrationTester.initializeProcessConnections(config)
    EndToEndIntegrationTester.processConnections = {}
    
    for processName, processId in pairs(config.processEndpoints) do
        EndToEndIntegrationTester.processConnections[processName] = {
            processId = processId,
            connectionStatus = "active",
            messageQueue = {},
            responseCallbacks = {},
            lastHeartbeat = os.time()
        }
    end
    
    print(string.format("Initialized connections to %d processes", 
          #EndToEndIntegrationTester.processConnections))
end

-- Execute workflow testing across multiple iterations
function EndToEndIntegrationTester.executeWorkflowTesting(workflowName, workflowDefinition, config)
    local workflowResults = {
        workflowName = workflowName,
        definition = workflowDefinition,
        iterations = {},
        successCount = 0,
        failureCount = 0,
        averageExecutionTime = 0,
        communicationMetrics = {}
    }
    
    local totalExecutionTime = 0
    
    for iteration = 1, config.testIterations do
        print(string.format("  Executing workflow iteration %d/%d", iteration, config.testIterations))
        
        local iterationResult = EndToEndIntegrationTester.executeWorkflowIteration(
            workflowDefinition, iteration, config
        )
        
        table.insert(workflowResults.iterations, iterationResult)
        totalExecutionTime = totalExecutionTime + iterationResult.executionTime
        
        if iterationResult.success then
            workflowResults.successCount = workflowResults.successCount + 1
        else
            workflowResults.failureCount = workflowResults.failureCount + 1
        end
        
        -- Collect communication metrics
        if iterationResult.communicationLog then
            EndToEndIntegrationTester.aggregateCommunicationMetrics(
                workflowResults.communicationMetrics, iterationResult.communicationLog
            )
        end
    end
    
    if config.testIterations > 0 then
        workflowResults.averageExecutionTime = totalExecutionTime / config.testIterations
    end
    
    return workflowResults
end

-- Execute single workflow iteration
function EndToEndIntegrationTester.executeWorkflowIteration(workflowDefinition, iteration, config)
    local iterationResult = {
        iteration = iteration,
        success = false,
        executionTime = 0,
        stepResults = {},
        communicationLog = {},
        error = nil,
        processStates = {}
    }
    
    local startTime = os.clock()
    local workflowContext = {}
    
    -- Execute each step in the workflow
    for _, stepDefinition in ipairs(workflowDefinition.steps) do
        local stepResult = EndToEndIntegrationTester.executeWorkflowStep(
            stepDefinition, workflowContext, config
        )
        
        table.insert(iterationResult.stepResults, stepResult)
        
        -- Update workflow context with step outputs
        if stepResult.success then
            for key, value in pairs(stepResult.outputs) do
                workflowContext[key] = value
            end
        else
            iterationResult.error = stepResult.error
            iterationResult.executionTime = os.clock() - startTime
            return iterationResult
        end
        
        -- Record communication events
        if stepResult.communicationEvents then
            for _, event in ipairs(stepResult.communicationEvents) do
                table.insert(iterationResult.communicationLog, event)
            end
        end
    end
    
    iterationResult.success = true
    iterationResult.executionTime = os.clock() - startTime
    iterationResult.processStates = EndToEndIntegrationTester.captureProcessStates(config)
    
    return iterationResult
end

-- Execute individual workflow step
function EndToEndIntegrationTester.executeWorkflowStep(stepDefinition, workflowContext, config)
    local stepResult = {
        step = stepDefinition.step,
        action = stepDefinition.action,
        process = stepDefinition.process,
        success = false,
        executionTime = 0,
        outputs = {},
        communicationEvents = {},
        error = nil
    }
    
    local startTime = os.clock()
    
    -- Resolve input data with context substitution
    local resolvedInputData = EndToEndIntegrationTester.resolveInputData(
        stepDefinition.inputData, workflowContext
    )
    
    -- Execute step on target process
    local success, result = pcall(function()
        return EndToEndIntegrationTester.executeProcessAction(
            stepDefinition.process, stepDefinition.action, resolvedInputData, config
        )
    end)
    
    stepResult.executionTime = os.clock() - startTime
    
    if success then
        stepResult.success = true
        stepResult.outputs = result.outputs or {}
        stepResult.communicationEvents = result.communicationEvents or {}
        
        -- Validate expected outputs
        local outputValidation = EndToEndIntegrationTester.validateStepOutputs(
            result.outputs, stepDefinition.expectedOutputs
        )
        
        if not outputValidation.valid then
            stepResult.success = false
            stepResult.error = "Expected outputs not received: " .. 
                             table.concat(outputValidation.missingOutputs, ", ")
        end
    else
        stepResult.success = false
        stepResult.error = result or "Unknown error during step execution"
    end
    
    return stepResult
end

-- Resolve input data with context variable substitution
function EndToEndIntegrationTester.resolveInputData(inputData, workflowContext)
    local resolvedData = {}
    
    for key, value in pairs(inputData) do
        if type(value) == "string" and string.sub(value, 1, 2) == "{{" and string.sub(value, -2) == "}}" then
            -- Context variable substitution
            local contextKey = string.sub(value, 3, -3)
            resolvedData[key] = workflowContext[contextKey] or value
        else
            resolvedData[key] = value
        end
    end
    
    return resolvedData
end

-- Execute action on specific process
function EndToEndIntegrationTester.executeProcessAction(processName, action, inputData, config)
    local processConnection = EndToEndIntegrationTester.processConnections[processName]
    if not processConnection then
        error("No connection to process: " .. processName)
    end
    
    -- Simulate process action execution
    local result = {
        outputs = {},
        communicationEvents = {},
        processingTime = 0
    }
    
    local startTime = os.clock()
    
    -- Simulate action-specific processing
    if action == "initiate_battle_request" then
        result.outputs = EndToEndIntegrationTester.simulateBattleInitiation(inputData)
    elseif action == "fetch_pokemon_data" then
        result.outputs = EndToEndIntegrationTester.simulatePokemonDataFetch(inputData)
    elseif action == "initialize_battle" then
        result.outputs = EndToEndIntegrationTester.simulateBattleInitialization(inputData)
    elseif action == "execute_battle_turn" then
        result.outputs = EndToEndIntegrationTester.simulateBattleTurnExecution(inputData)
    elseif action == "update_pokemon_stats" then
        result.outputs = EndToEndIntegrationTester.simulatePokemonStatsUpdate(inputData)
    elseif action == "complete_battle" then
        result.outputs = EndToEndIntegrationTester.simulateBattleCompletion(inputData)
    elseif action == "log_battle_completion" then
        result.outputs = EndToEndIntegrationTester.simulateBattleLogging(inputData)
    else
        result.outputs = {
            genericActionResult = "action_completed",
            processedInputs = inputData
        }
    end
    
    result.processingTime = os.clock() - startTime
    
    -- Record communication event
    table.insert(result.communicationEvents, {
        timestamp = os.time(),
        sourceProcess = "integration_tester",
        targetProcess = processName,
        action = action,
        inputData = inputData,
        processingTime = result.processingTime
    })
    
    return result
end

-- Simulate battle initiation process
function EndToEndIntegrationTester.simulateBattleInitiation(inputData)
    return {
        battle_session_created = {
            sessionId = "battle_session_" .. os.time(),
            playerId = inputData.playerId,
            battleType = inputData.battleType
        },
        pokemon_data_requested = {
            requestId = "pokemon_request_" .. os.time(),
            playerId = inputData.playerId
        }
    }
end

-- Simulate Pokemon data fetch
function EndToEndIntegrationTester.simulatePokemonDataFetch(inputData)
    return {
        pokemon_data_response = {
            playerId = inputData.playerId,
            partyData = {
                {pokemonId = "pokemon_1", speciesId = 25, level = 50, currentHp = 150, maxHp = 150},
                {pokemonId = "pokemon_2", speciesId = 1, level = 48, currentHp = 140, maxHp = 140}
            },
            responseTime = os.clock()
        }
    }
end

-- Simulate battle initialization
function EndToEndIntegrationTester.simulateBattleInitialization(inputData)
    return {
        battle_initialized = {
            battleId = "battle_" .. os.time(),
            playerParty = inputData.playerParty,
            opponentData = inputData.opponentData
        },
        battle_state_created = {
            battleStateId = "state_" .. os.time(),
            turn = 0,
            activePlayerPokemon = 1,
            activeOpponentPokemon = 1
        }
    }
end

-- Simulate battle turn execution
function EndToEndIntegrationTester.simulateBattleTurnExecution(inputData)
    return {
        turn_executed = {
            turnNumber = 1,
            playerAction = inputData.playerAction,
            moveId = inputData.moveId
        },
        damage_calculated = {
            damageDealt = 45,
            criticalHit = false,
            effectiveness = 1.0
        },
        battle_state_updated = {
            opponentHpRemaining = 95,
            battleContinues = true
        }
    }
end

-- Simulate Pokemon stats update
function EndToEndIntegrationTester.simulatePokemonStatsUpdate(inputData)
    return {
        pokemon_stats_updated = {
            pokemonId = inputData.pokemonId,
            updatedStats = inputData.statUpdates,
            updateTime = os.time()
        }
    }
end

-- Simulate battle completion
function EndToEndIntegrationTester.simulateBattleCompletion(inputData)
    return {
        battle_completed = {
            battleResult = inputData.battleResult,
            winner = "player",
            completionTime = os.time()
        },
        rewards_calculated = {
            experienceGained = 1250,
            moneyEarned = 500,
            itemsFound = {}
        }
    }
end

-- Simulate battle logging
function EndToEndIntegrationTester.simulateBattleLogging(inputData)
    return {
        battle_logged = {
            logId = "log_" .. os.time(),
            battleData = inputData.battleSummary
        },
        metrics_updated = {
            battlesCompleted = 1,
            totalExperienceAwarded = 1250
        }
    }
end

-- Validate step outputs against expectations
function EndToEndIntegrationTester.validateStepOutputs(actualOutputs, expectedOutputs)
    local validation = {
        valid = true,
        missingOutputs = {},
        unexpectedOutputs = {}
    }
    
    -- Check for missing expected outputs
    for _, expectedOutput in ipairs(expectedOutputs) do
        if not actualOutputs[expectedOutput] then
            validation.valid = false
            table.insert(validation.missingOutputs, expectedOutput)
        end
    end
    
    -- Check for unexpected outputs (informational)
    for outputKey, _ in pairs(actualOutputs) do
        local found = false
        for _, expectedOutput in ipairs(expectedOutputs) do
            if outputKey == expectedOutput then
                found = true
                break
            end
        end
        if not found then
            table.insert(validation.unexpectedOutputs, outputKey)
        end
    end
    
    return validation
end

-- Capture current process states
function EndToEndIntegrationTester.captureProcessStates(config)
    local processStates = {}
    
    for processName, connection in pairs(EndToEndIntegrationTester.processConnections) do
        processStates[processName] = {
            connectionStatus = connection.connectionStatus,
            messageQueueSize = #connection.messageQueue,
            lastHeartbeat = connection.lastHeartbeat,
            responseLatency = os.time() - connection.lastHeartbeat
        }
    end
    
    return processStates
end

-- Aggregate communication metrics across iterations
function EndToEndIntegrationTester.aggregateCommunicationMetrics(aggregatedMetrics, communicationLog)
    for _, event in ipairs(communicationLog) do
        local processKey = event.targetProcess
        
        if not aggregatedMetrics[processKey] then
            aggregatedMetrics[processKey] = {
                totalMessages = 0,
                totalProcessingTime = 0,
                averageProcessingTime = 0,
                messagesByAction = {}
            }
        end
        
        local processMetrics = aggregatedMetrics[processKey]
        processMetrics.totalMessages = processMetrics.totalMessages + 1
        processMetrics.totalProcessingTime = processMetrics.totalProcessingTime + event.processingTime
        processMetrics.averageProcessingTime = processMetrics.totalProcessingTime / processMetrics.totalMessages
        
        -- Track messages by action
        if not processMetrics.messagesByAction[event.action] then
            processMetrics.messagesByAction[event.action] = 0
        end
        processMetrics.messagesByAction[event.action] = processMetrics.messagesByAction[event.action] + 1
    end
end

-- Validate inter-process communication patterns
function EndToEndIntegrationTester.validateProcessCommunication(workflowName, workflowResults, config)
    local validation = {
        workflowName = workflowName,
        valid = true,
        issues = {},
        communicationPatterns = {},
        recommendations = {}
    }
    
    -- Analyze communication patterns across iterations
    local allCommunicationEvents = {}
    for _, iteration in ipairs(workflowResults.iterations) do
        for _, event in ipairs(iteration.communicationLog) do
            table.insert(allCommunicationEvents, event)
        end
    end
    
    -- Validate message ordering
    local orderingValidation = EndToEndIntegrationTester.validateMessageOrdering(allCommunicationEvents)
    if not orderingValidation.valid then
        validation.valid = false
        table.insert(validation.issues, {
            type = "message_ordering",
            description = "Message ordering inconsistencies detected",
            details = orderingValidation.issues
        })
    end
    
    -- Validate response times
    local responseTimeValidation = EndToEndIntegrationTester.validateResponseTimes(allCommunicationEvents)
    if not responseTimeValidation.valid then
        validation.valid = false
        table.insert(validation.issues, {
            type = "response_times",
            description = "Response time issues detected",
            details = responseTimeValidation.issues
        })
    end
    
    -- Generate communication pattern analysis
    validation.communicationPatterns = EndToEndIntegrationTester.analyzeCommunicationPatterns(
        allCommunicationEvents
    )
    
    return validation
end

-- Validate message ordering across processes
function EndToEndIntegrationTester.validateMessageOrdering(communicationEvents)
    local validation = {
        valid = true,
        issues = {}
    }
    
    -- Simple ordering validation: ensure chronological order
    local lastTimestamp = 0
    for _, event in ipairs(communicationEvents) do
        if event.timestamp < lastTimestamp then
            validation.valid = false
            table.insert(validation.issues, {
                event = event,
                description = "Message received out of chronological order"
            })
        end
        lastTimestamp = event.timestamp
    end
    
    return validation
end

-- Validate response times across processes
function EndToEndIntegrationTester.validateResponseTimes(communicationEvents)
    local validation = {
        valid = true,
        issues = {}
    }
    
    local maxAcceptableResponseTime = 5.0 -- 5 seconds
    
    for _, event in ipairs(communicationEvents) do
        if event.processingTime > maxAcceptableResponseTime then
            validation.valid = false
            table.insert(validation.issues, {
                event = event,
                description = string.format("Response time exceeded threshold: %.2fs", event.processingTime)
            })
        end
    end
    
    return validation
end

-- Analyze communication patterns
function EndToEndIntegrationTester.analyzeCommunicationPatterns(communicationEvents)
    local patterns = {
        processInteractions = {},
        actionFrequency = {},
        averageResponseTimes = {}
    }
    
    -- Analyze process interactions
    for _, event in ipairs(communicationEvents) do
        local interactionKey = event.sourceProcess .. " -> " .. event.targetProcess
        
        if not patterns.processInteractions[interactionKey] then
            patterns.processInteractions[interactionKey] = {
                count = 0,
                totalResponseTime = 0,
                averageResponseTime = 0
            }
        end
        
        local interaction = patterns.processInteractions[interactionKey]
        interaction.count = interaction.count + 1
        interaction.totalResponseTime = interaction.totalResponseTime + event.processingTime
        interaction.averageResponseTime = interaction.totalResponseTime / interaction.count
        
        -- Track action frequency
        if not patterns.actionFrequency[event.action] then
            patterns.actionFrequency[event.action] = 0
        end
        patterns.actionFrequency[event.action] = patterns.actionFrequency[event.action] + 1
        
        -- Track average response times by target process
        if not patterns.averageResponseTimes[event.targetProcess] then
            patterns.averageResponseTimes[event.targetProcess] = {
                totalTime = 0,
                count = 0,
                average = 0
            }
        end
        
        local responseTimeData = patterns.averageResponseTimes[event.targetProcess]
        responseTimeData.totalTime = responseTimeData.totalTime + event.processingTime
        responseTimeData.count = responseTimeData.count + 1
        responseTimeData.average = responseTimeData.totalTime / responseTimeData.count
    end
    
    return patterns
end

-- Analyze integration failures across workflows
function EndToEndIntegrationTester.analyzeIntegrationFailures(workflowResults)
    local failureAnalysis = {
        totalFailures = 0,
        failuresByWorkflow = {},
        failuresByProcess = {},
        failuresByAction = {},
        commonFailurePatterns = {}
    }
    
    for workflowName, workflowResult in pairs(workflowResults) do
        failureAnalysis.failuresByWorkflow[workflowName] = {
            totalIterations = #workflowResult.iterations,
            failures = workflowResult.failureCount,
            successRate = workflowResult.successCount / #workflowResult.iterations
        }
        
        failureAnalysis.totalFailures = failureAnalysis.totalFailures + workflowResult.failureCount
        
        -- Analyze failure details
        for _, iteration in ipairs(workflowResult.iterations) do
            if not iteration.success then
                -- Analyze step failures
                for _, stepResult in ipairs(iteration.stepResults) do
                    if not stepResult.success then
                        -- Track failures by process
                        if not failureAnalysis.failuresByProcess[stepResult.process] then
                            failureAnalysis.failuresByProcess[stepResult.process] = 0
                        end
                        failureAnalysis.failuresByProcess[stepResult.process] = 
                            failureAnalysis.failuresByProcess[stepResult.process] + 1
                        
                        -- Track failures by action
                        if not failureAnalysis.failuresByAction[stepResult.action] then
                            failureAnalysis.failuresByAction[stepResult.action] = 0
                        end
                        failureAnalysis.failuresByAction[stepResult.action] = 
                            failureAnalysis.failuresByAction[stepResult.action] + 1
                    end
                end
            end
        end
    end
    
    return failureAnalysis
end

-- Generate comprehensive integration summary
function EndToEndIntegrationTester.generateIntegrationSummary(integrationResults)
    local summary = {
        totalWorkflows = 0,
        totalIterations = 0,
        totalSuccesses = 0,
        totalFailures = 0,
        overallSuccessRate = 0,
        averageExecutionTime = 0,
        communicationEfficiency = {},
        recommendations = {}
    }
    
    local totalExecutionTime = 0
    
    for workflowName, workflowResult in pairs(integrationResults.workflowResults) do
        summary.totalWorkflows = summary.totalWorkflows + 1
        summary.totalIterations = summary.totalIterations + #workflowResult.iterations
        summary.totalSuccesses = summary.totalSuccesses + workflowResult.successCount
        summary.totalFailures = summary.totalFailures + workflowResult.failureCount
        totalExecutionTime = totalExecutionTime + (workflowResult.averageExecutionTime * #workflowResult.iterations)
    end
    
    if summary.totalIterations > 0 then
        summary.overallSuccessRate = summary.totalSuccesses / summary.totalIterations
        summary.averageExecutionTime = totalExecutionTime / summary.totalIterations
    end
    
    -- Analyze communication efficiency
    summary.communicationEfficiency = EndToEndIntegrationTester.analyzeCommunicationEfficiency(
        integrationResults.workflowResults
    )
    
    -- Generate recommendations
    summary.recommendations = EndToEndIntegrationTester.generateIntegrationRecommendations(
        summary, integrationResults.failureAnalysis
    )
    
    return summary
end

-- Analyze communication efficiency
function EndToEndIntegrationTester.analyzeCommunicationEfficiency(workflowResults)
    local efficiency = {
        averageMessageLatency = 0,
        messageVolumeByProcess = {},
        mostEfficientWorkflow = nil,
        leastEfficientWorkflow = nil
    }
    
    local totalLatency = 0
    local messageCount = 0
    local workflowEfficiency = {}
    
    for workflowName, workflowResult in pairs(workflowResults) do
        local workflowLatency = 0
        local workflowMessages = 0
        
        for processName, processMetrics in pairs(workflowResult.communicationMetrics) do
            if not efficiency.messageVolumeByProcess[processName] then
                efficiency.messageVolumeByProcess[processName] = 0
            end
            efficiency.messageVolumeByProcess[processName] = 
                efficiency.messageVolumeByProcess[processName] + processMetrics.totalMessages
            
            workflowLatency = workflowLatency + processMetrics.totalProcessingTime
            workflowMessages = workflowMessages + processMetrics.totalMessages
            
            totalLatency = totalLatency + processMetrics.totalProcessingTime
            messageCount = messageCount + processMetrics.totalMessages
        end
        
        if workflowMessages > 0 then
            workflowEfficiency[workflowName] = workflowLatency / workflowMessages
        end
    end
    
    if messageCount > 0 then
        efficiency.averageMessageLatency = totalLatency / messageCount
    end
    
    -- Find most/least efficient workflows
    local bestEfficiency = math.huge
    local worstEfficiency = 0
    
    for workflowName, efficiencyValue in pairs(workflowEfficiency) do
        if efficiencyValue < bestEfficiency then
            bestEfficiency = efficiencyValue
            efficiency.mostEfficientWorkflow = workflowName
        end
        if efficiencyValue > worstEfficiency then
            worstEfficiency = efficiencyValue
            efficiency.leastEfficientWorkflow = workflowName
        end
    end
    
    return efficiency
end

-- Generate integration recommendations
function EndToEndIntegrationTester.generateIntegrationRecommendations(summary, failureAnalysis)
    local recommendations = {}
    
    -- Success rate recommendations
    if summary.overallSuccessRate < 0.9 then
        table.insert(recommendations, {
            priority = "high",
            category = "reliability",
            description = "Overall integration success rate below 90%",
            action = "Investigation of workflow failures and process communication issues needed"
        })
    elseif summary.overallSuccessRate < 0.99 then
        table.insert(recommendations, {
            priority = "medium",
            category = "reliability",
            description = "Integration success rate below 99%",
            action = "Review specific failure patterns and improve error handling"
        })
    end
    
    -- Communication efficiency recommendations
    if summary.communicationEfficiency.averageMessageLatency > 1.0 then
        table.insert(recommendations, {
            priority = "medium",
            category = "performance",
            description = "Average message latency exceeds 1 second",
            action = "Optimize inter-process communication and reduce processing delays"
        })
    end
    
    -- Failure pattern recommendations
    if failureAnalysis.totalFailures > 0 then
        table.insert(recommendations, {
            priority = "medium",
            category = "debugging",
            description = "Integration failures detected",
            action = "Analyze failure patterns and improve process coordination"
        })
    end
    
    return recommendations
end

-- Get integration test results
function EndToEndIntegrationTester.getIntegrationTestResults(testId)
    if testId then
        return EndToEndIntegrationTester.integrationTests[testId]
    else
        return EndToEndIntegrationTester.integrationTests
    end
end

return EndToEndIntegrationTester