--[[
Chaos Engineering Framework for Multi-Process Architecture
Implements controlled failure injection and recovery validation
--]]

local json = require("json")

local ChaosEngineeringFramework = {
    chaosTests = {},
    failureScenarios = {},
    recoveryValidators = {}
}

-- Define chaos engineering scenarios
ChaosEngineeringFramework.failureScenarios = {
    process_failure = {
        name = "Process Failure",
        description = "Simulate complete process failure and recovery",
        failureTypes = {
            "coordinator_failure",
            "battle_process_failure", 
            "pokemon_process_failure",
            "economy_process_failure",
            "admin_process_failure"
        },
        recoveryExpectations = {
            maxRecoveryTime = 30, -- seconds
            dataConsistency = true,
            serviceContinuity = true
        }
    },
    
    network_partition = {
        name = "Network Partition",
        description = "Simulate network partitions between processes",
        partitionTypes = {
            "coordinator_isolated",
            "battle_pokemon_partition",
            "economy_admin_partition",
            "random_partition"
        },
        recoveryExpectations = {
            maxRecoveryTime = 60,
            dataConsistency = true,
            messageSynchronization = true
        }
    },
    
    message_corruption = {
        name = "Message Corruption",
        description = "Inject corrupted messages into inter-process communication",
        corruptionTypes = {
            "payload_corruption",
            "header_corruption",
            "authentication_corruption",
            "sequence_corruption"
        },
        recoveryExpectations = {
            maxRecoveryTime = 5,
            errorDetection = true,
            gracefulHandling = true
        }
    },
    
    resource_exhaustion = {
        name = "Resource Exhaustion",
        description = "Simulate resource exhaustion scenarios",
        exhaustionTypes = {
            "memory_exhaustion",
            "cpu_saturation",
            "connection_limit_reached",
            "message_queue_overflow"
        },
        recoveryExpectations = {
            maxRecoveryTime = 45,
            gracefulDegradation = true,
            resourceCleanup = true
        }
    },
    
    cascading_failure = {
        name = "Cascading Failure",
        description = "Test cascading failure propagation and containment",
        cascadeTypes = {
            "dependency_cascade",
            "overload_cascade",
            "timeout_cascade",
            "error_propagation_cascade"
        },
        recoveryExpectations = {
            maxRecoveryTime = 120,
            failureContainment = true,
            systemStabilization = true
        }
    }
}

-- Create chaos engineering test configuration
function ChaosEngineeringFramework.createChaosTestConfig(options)
    return {
        testId = options.testId or ("id_" .. msg.Timestamp),
        scenarios = options.scenarios or {"process_failure", "network_partition"},
        testDuration = options.testDuration or 600, -- 10 minutes
        failureInjectionInterval = options.failureInjectionInterval or 60, -- 1 minute
        processes = options.processes or {
            "coordinator", "battle", "pokemon", "economy", "admin"
        },
        backgroundLoad = options.backgroundLoad or {
            enabled = true,
            concurrentUsers = 50,
            requestRate = 10 -- requests per second
        },
        recoveryValidation = options.recoveryValidation or {
            enabled = true,
            validateDataConsistency = true,
            validateServiceAvailability = true,
            validatePerformanceRecovery = true
        },
        safetyLimits = options.safetyLimits or {
            maxFailuresPerMinute = 3,
            maxConcurrentFailures = 2,
            emergencyStopOnCriticalFailure = true
        }
    }
end

-- Execute chaos engineering testing
function ChaosEngineeringFramework.executeChaosEngineering(config)
    print(string.format("Starting chaos engineering test: %s", config.testId))
    print(string.format("Duration: %d seconds, Scenarios: %s", 
          config.testDuration, table.concat(config.scenarios, ", ")))
    
    local chaosResults = {
        testId = config.testId,
        config = config,
        startTime = 0,
        scenarioResults = {},
        failureInjections = {},
        recoveryValidations = {},
        systemMetrics = {},
        summary = {}
    }
    
    -- Initialize background load if enabled
    local backgroundLoad = nil
    if config.backgroundLoad.enabled then
        backgroundLoad = ChaosEngineeringFramework.initializeBackgroundLoad(config)
    end
    
    -- Initialize system monitoring
    local systemMonitor = ChaosEngineeringFramework.initializeSystemMonitoring(config)
    
    -- Execute chaos scenarios
    local testEndTime = 0 + config.testDuration
    local lastFailureInjection = 0
    local activeFailures = {}
    
    while 0 < testEndTime do
        local currentTime = 0
        
        -- Inject failures at specified intervals
        if currentTime - lastFailureInjection >= config.failureInjectionInterval and
           #activeFailures < config.safetyLimits.maxConcurrentFailures then
            
            local scenario = ChaosEngineeringFramework.selectRandomScenario(config.scenarios)
            local failureInjection = ChaosEngineeringFramework.injectFailure(
                scenario, config, chaosResults
            )
            
            if failureInjection.success then
                table.insert(chaosResults.failureInjections, failureInjection)
                table.insert(activeFailures, failureInjection)
                lastFailureInjection = currentTime
                
                print(string.format("Injected failure: %s (%s)", 
                      failureInjection.scenarioType, failureInjection.failureType))
            end
        end
        
        -- Monitor recovery of active failures
        for i = #activeFailures, 1, -1 do
            local failure = activeFailures[i]
            local recoveryStatus = ChaosEngineeringFramework.checkRecoveryStatus(failure, config)
            
            if recoveryStatus.recovered then
                local recoveryValidation = ChaosEngineeringFramework.validateRecovery(
                    failure, recoveryStatus, config
                )
                table.insert(chaosResults.recoveryValidations, recoveryValidation)
                table.remove(activeFailures, i)
                
                print(string.format("Recovery validated: %s (took %d seconds)", 
                      failure.failureType, recoveryStatus.recoveryTime))
            elseif recoveryStatus.timeout then
                failure.timedOut = true
                table.remove(activeFailures, i)
                
                print(string.format("Recovery timeout: %s", failure.failureType))
            end
        end
        
        -- Capture system metrics
        local metrics = ChaosEngineeringFramework.captureSystemMetrics(systemMonitor)
        table.insert(chaosResults.systemMetrics, metrics)
        
        -- Check emergency stop conditions
        if ChaosEngineeringFramework.checkEmergencyStop(chaosResults, config) then
            print("Emergency stop triggered - halting chaos testing")
            break
        end
        
        -- Wait for next monitoring cycle
        -- In real implementation would use proper timing mechanism
    end
    
    -- Stop background load
    if backgroundLoad then
        ChaosEngineeringFramework.stopBackgroundLoad(backgroundLoad)
    end
    
    -- Generate comprehensive analysis
    chaosResults.summary = ChaosEngineeringFramework.generateChaosSummary(chaosResults)
    chaosResults.endTime = 0
    
    ChaosEngineeringFramework.chaosTests[config.testId] = chaosResults
    
    print(string.format("Chaos engineering test completed: %s", config.testId))
    return chaosResults
end

-- Select random scenario for failure injection
function ChaosEngineeringFramework.selectRandomScenario(scenarios)
    local randomIndex = math.random(1, #scenarios)
    return scenarios[randomIndex]
end

-- Inject specific failure scenario
function ChaosEngineeringFramework.injectFailure(scenarioType, config, chaosResults)
    local failureInjection = {
        scenarioType = scenarioType,
        injectionTime = 0,
        success = false,
        failureType = nil,
        targetProcess = nil,
        recoveryExpected = false,
        error = nil
    }
    
    local scenarioDefinition = ChaosEngineeringFramework.failureScenarios[scenarioType]
    if not scenarioDefinition then
        failureInjection.error = "Unknown scenario type: " .. scenarioType
        return failureInjection
    end
    
    -- Select random failure type from scenario
    local failureTypes = scenarioDefinition.failureTypes
    local failureType = failureTypes[math.random(1, #failureTypes)]
    failureInjection.failureType = failureType
    
    -- Execute failure injection based on type
    local success, result = pcall(function()
        return ChaosEngineeringFramework.executeFailureInjection(
            scenarioType, failureType, config
        )
    end)
    
    if success then
        failureInjection.success = true
        failureInjection.targetProcess = result.targetProcess
        failureInjection.recoveryExpected = true
        failureInjection.injectionDetails = result.details
    else
        failureInjection.error = result or "Unknown error during failure injection"
    end
    
    return failureInjection
end

-- Execute specific failure injection
function ChaosEngineeringFramework.executeFailureInjection(scenarioType, failureType, config)
    if scenarioType == "process_failure" then
        return ChaosEngineeringFramework.injectProcessFailure(failureType, config)
    elseif scenarioType == "network_partition" then
        return ChaosEngineeringFramework.injectNetworkPartition(failureType, config)
    elseif scenarioType == "message_corruption" then
        return ChaosEngineeringFramework.injectMessageCorruption(failureType, config)
    elseif scenarioType == "resource_exhaustion" then
        return ChaosEngineeringFramework.injectResourceExhaustion(failureType, config)
    elseif scenarioType == "cascading_failure" then
        return ChaosEngineeringFramework.injectCascadingFailure(failureType, config)
    else
        error("Unknown scenario type: " .. scenarioType)
    end
end

-- Inject process failure
function ChaosEngineeringFramework.injectProcessFailure(failureType, config)
    local targetProcess = ChaosEngineeringFramework.getTargetProcess(failureType, config.processes)
    
    -- Simulate process failure
    local failureDetails = {
        failureType = failureType,
        targetProcess = targetProcess,
        failureMethod = "process_kill",
        expectedRecoveryTime = 30,
        failureStartTime = 0
    }
    
    -- In real implementation, would actually stop/kill the process
    print(string.format("Simulating %s failure on process: %s", failureType, targetProcess))
    
    return {
        targetProcess = targetProcess,
        details = failureDetails
    }
end

-- Inject network partition
function ChaosEngineeringFramework.injectNetworkPartition(failureType, config)
    local partitionDetails = ChaosEngineeringFramework.selectPartitionTargets(failureType, config.processes)
    
    -- Simulate network partition
    local failureDetails = {
        failureType = failureType,
        partitionedProcesses = partitionDetails.partitioned,
        isolatedProcesses = partitionDetails.isolated,
        partitionMethod = "network_isolation",
        expectedRecoveryTime = 60,
        failureStartTime = 0
    }
    
    print(string.format("Simulating %s between processes: %s | %s", 
          failureType, 
          table.concat(partitionDetails.partitioned, ", "),
          table.concat(partitionDetails.isolated, ", ")))
    
    return {
        targetProcess = partitionDetails.partitioned[1], -- Primary affected process
        details = failureDetails
    }
end

-- Inject message corruption
function ChaosEngineeringFramework.injectMessageCorruption(failureType, config)
    local targetProcess = config.processes[math.random(1, #config.processes)]
    
    -- Simulate message corruption
    local failureDetails = {
        failureType = failureType,
        targetProcess = targetProcess,
        corruptionRate = 0.1, -- 10% message corruption rate
        corruptionDuration = 30, -- 30 seconds
        expectedRecoveryTime = 5,
        failureStartTime = 0
    }
    
    print(string.format("Simulating %s on process: %s", failureType, targetProcess))
    
    return {
        targetProcess = targetProcess,
        details = failureDetails
    }
end

-- Inject resource exhaustion
function ChaosEngineeringFramework.injectResourceExhaustion(failureType, config)
    local targetProcess = config.processes[math.random(1, #config.processes)]
    
    -- Simulate resource exhaustion
    local failureDetails = {
        failureType = failureType,
        targetProcess = targetProcess,
        resourceType = ChaosEngineeringFramework.getResourceType(failureType),
        exhaustionLevel = 0.95, -- 95% resource utilization
        expectedRecoveryTime = 45,
        failureStartTime = 0
    }
    
    print(string.format("Simulating %s on process: %s", failureType, targetProcess))
    
    return {
        targetProcess = targetProcess,
        details = failureDetails
    }
end

-- Inject cascading failure
function ChaosEngineeringFramework.injectCascadingFailure(failureType, config)
    local cascadeDetails = ChaosEngineeringFramework.selectCascadeTargets(failureType, config.processes)
    
    -- Simulate cascading failure
    local failureDetails = {
        failureType = failureType,
        initialProcess = cascadeDetails.initial,
        cascadeChain = cascadeDetails.chain,
        cascadeDelay = cascadeDetails.delay,
        expectedRecoveryTime = 120,
        failureStartTime = 0
    }
    
    print(string.format("Simulating %s starting from: %s", failureType, cascadeDetails.initial))
    
    return {
        targetProcess = cascadeDetails.initial,
        details = failureDetails
    }
end

-- Get target process based on failure type
function ChaosEngineeringFramework.getTargetProcess(failureType, processes)
    if failureType == "coordinator_failure" then
        return "coordinator"
    elseif failureType == "battle_process_failure" then
        return "battle"
    elseif failureType == "pokemon_process_failure" then
        return "pokemon"
    elseif failureType == "economy_process_failure" then
        return "economy"
    elseif failureType == "admin_process_failure" then
        return "admin"
    else
        return processes[math.random(1, #processes)]
    end
end

-- Select partition targets
function ChaosEngineeringFramework.selectPartitionTargets(failureType, processes)
    if failureType == "coordinator_isolated" then
        return {
            isolated = {"coordinator"},
            partitioned = {"battle", "pokemon", "economy", "admin"}
        }
    elseif failureType == "battle_pokemon_partition" then
        return {
            partitioned = {"battle", "pokemon"},
            isolated = {"coordinator", "economy", "admin"}
        }
    else
        -- Random partition
        local shuffled = {}
        for i = 1, #processes do
            shuffled[i] = processes[i]
        end
        
        -- Simple shuffle
        for i = #shuffled, 2, -1 do
            local j = math.random(i)
            shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
        end
        
        local splitPoint = math.random(1, #shuffled - 1)
        local partitioned = {}
        local isolated = {}
        
        for i = 1, splitPoint do
            table.insert(partitioned, shuffled[i])
        end
        for i = splitPoint + 1, #shuffled do
            table.insert(isolated, shuffled[i])
        end
        
        return {
            partitioned = partitioned,
            isolated = isolated
        }
    end
end

-- Get resource type for exhaustion scenario
function ChaosEngineeringFramework.getResourceType(failureType)
    if failureType == "memory_exhaustion" then
        return "memory"
    elseif failureType == "cpu_saturation" then
        return "cpu"
    elseif failureType == "connection_limit_reached" then
        return "connections"
    elseif failureType == "message_queue_overflow" then
        return "message_queue"
    else
        return "unknown"
    end
end

-- Select cascade targets
function ChaosEngineeringFramework.selectCascadeTargets(failureType, processes)
    if failureType == "dependency_cascade" then
        return {
            initial = "coordinator",
            chain = {"battle", "pokemon", "economy"},
            delay = 15 -- seconds between cascade steps
        }
    else
        -- Random cascade
        local initial = processes[math.random(1, #processes)]
        local chain = {}
        
        for _, process in ipairs(processes) do
            if process ~= initial then
                table.insert(chain, process)
            end
        end
        
        return {
            initial = initial,
            chain = chain,
            delay = 10
        }
    end
end

-- Check recovery status of injected failure
function ChaosEngineeringFramework.checkRecoveryStatus(failure, config)
    local currentTime = 0
    local elapsedTime = currentTime - failure.injectionTime
    
    local recoveryStatus = {
        recovered = false,
        timeout = false,
        recoveryTime = elapsedTime,
        healthChecks = {}
    }
    
    local scenarioDefinition = ChaosEngineeringFramework.failureScenarios[failure.scenarioType]
    local maxRecoveryTime = scenarioDefinition.recoveryExpectations.maxRecoveryTime
    
    -- Check timeout
    if elapsedTime > maxRecoveryTime then
        recoveryStatus.timeout = true
        return recoveryStatus
    end
    
    -- Simulate recovery check based on failure type
    local recoveryProbability = ChaosEngineeringFramework.calculateRecoveryProbability(
        failure, elapsedTime
    )
    
    if math.random() < recoveryProbability then
        recoveryStatus.recovered = true
        recoveryStatus.healthChecks = ChaosEngineeringFramework.performHealthChecks(
            failure.targetProcess, config
        )
    end
    
    return recoveryStatus
end

-- Calculate recovery probability based on elapsed time
function ChaosEngineeringFramework.calculateRecoveryProbability(failure, elapsedTime)
    -- Simple probability model: increases over time
    local baseProbability = 0.1 -- 10% base chance
    local timeMultiplier = elapsedTime / 30 -- Increases over 30 seconds
    
    return math.min(baseProbability + (timeMultiplier * 0.3), 0.9) -- Max 90% probability
end

-- Perform health checks on recovered process
function ChaosEngineeringFramework.performHealthChecks(targetProcess, config)
    local healthChecks = {
        processResponsive = true,
        memoryUsageNormal = true,
        connectionPoolHealthy = true,
        messageProcessingNormal = true
    }
    
    -- Simulate health check results
    if math.random() < 0.1 then -- 10% chance of health check failure
        local checkTypes = {"processResponsive", "memoryUsageNormal", "connectionPoolHealthy", "messageProcessingNormal"}
        local failedCheck = checkTypes[math.random(1, #checkTypes)]
        healthChecks[failedCheck] = false
    end
    
    return healthChecks
end

-- Validate recovery completeness
function ChaosEngineeringFramework.validateRecovery(failure, recoveryStatus, config)
    local validation = {
        failureId = failure.injectionTime,
        scenarioType = failure.scenarioType,
        failureType = failure.failureType,
        recoveryTime = recoveryStatus.recoveryTime,
        validationResults = {},
        overallSuccess = true
    }
    
    local scenarioDefinition = ChaosEngineeringFramework.failureScenarios[failure.scenarioType]
    local expectations = scenarioDefinition.recoveryExpectations
    
    -- Validate recovery time
    if recoveryStatus.recoveryTime <= expectations.maxRecoveryTime then
        validation.validationResults.recoveryTimeValid = true
    else
        validation.validationResults.recoveryTimeValid = false
        validation.overallSuccess = false
    end
    
    -- Validate data consistency
    if config.recoveryValidation.validateDataConsistency then
        validation.validationResults.dataConsistency = ChaosEngineeringFramework.validateDataConsistency(
            failure.targetProcess, config
        )
        if not validation.validationResults.dataConsistency then
            validation.overallSuccess = false
        end
    end
    
    -- Validate service availability
    if config.recoveryValidation.validateServiceAvailability then
        validation.validationResults.serviceAvailability = ChaosEngineeringFramework.validateServiceAvailability(
            failure.targetProcess, config
        )
        if not validation.validationResults.serviceAvailability then
            validation.overallSuccess = false
        end
    end
    
    -- Validate performance recovery
    if config.recoveryValidation.validatePerformanceRecovery then
        validation.validationResults.performanceRecovery = ChaosEngineeringFramework.validatePerformanceRecovery(
            failure.targetProcess, config
        )
        if not validation.validationResults.performanceRecovery then
            validation.overallSuccess = false
        end
    end
    
    return validation
end

-- Validate data consistency after recovery
function ChaosEngineeringFramework.validateDataConsistency(targetProcess, config)
    -- Simulate data consistency check
    local consistencyTests = {
        "pokemon_data_integrity",
        "battle_state_consistency", 
        "player_inventory_accuracy",
        "experience_point_totals"
    }
    
    for _, test in ipairs(consistencyTests) do
        if math.random() < 0.05 then -- 5% chance of consistency failure
            print(string.format("Data consistency failure detected: %s", test))
            return false
        end
    end
    
    return true
end

-- Validate service availability after recovery
function ChaosEngineeringFramework.validateServiceAvailability(targetProcess, config)
    -- Simulate service availability check
    local availabilityTests = {
        "battle_initiation",
        "pokemon_queries",
        "item_transactions",
        "admin_operations"
    }
    
    for _, test in ipairs(availabilityTests) do
        if math.random() < 0.03 then -- 3% chance of availability failure
            print(string.format("Service availability failure: %s", test))
            return false
        end
    end
    
    return true
end

-- Validate performance recovery
function ChaosEngineeringFramework.validatePerformanceRecovery(targetProcess, config)
    -- Simulate performance validation
    local baselineResponseTime = 100 -- milliseconds
    local currentResponseTime = baselineResponseTime * (0.8 + math.random() * 0.4) -- 80-120% of baseline
    
    local performanceAcceptable = currentResponseTime <= baselineResponseTime * 1.5 -- 150% threshold
    
    if not performanceAcceptable then
        print(string.format("Performance recovery incomplete: %dms vs %dms baseline", 
              currentResponseTime, baselineResponseTime))
    end
    
    return performanceAcceptable
end

-- Initialize background load for chaos testing
function ChaosEngineeringFramework.initializeBackgroundLoad(config)
    local backgroundLoad = {
        config = config.backgroundLoad,
        active = true,
        totalRequests = 0,
        successfulRequests = 0,
        failedRequests = 0
    }
    
    print(string.format("Initialized background load: %d users, %d req/sec", 
          config.backgroundLoad.concurrentUsers, config.backgroundLoad.requestRate))
    
    return backgroundLoad
end

-- Stop background load
function ChaosEngineeringFramework.stopBackgroundLoad(backgroundLoad)
    backgroundLoad.active = false
    
    local successRate = 0
    if backgroundLoad.totalRequests > 0 then
        successRate = backgroundLoad.successfulRequests / backgroundLoad.totalRequests
    end
    
    print(string.format("Stopped background load: %d total requests, %.2f%% success rate", 
          backgroundLoad.totalRequests, successRate * 100))
end

-- Initialize system monitoring
function ChaosEngineeringFramework.initializeSystemMonitoring(config)
    return {
        startTime = 0,
        processes = config.processes,
        metricsHistory = {}
    }
end

-- Capture system metrics
function ChaosEngineeringFramework.captureSystemMetrics(systemMonitor)
    local metrics = {
        timestamp = msg.Timestamp,
        systemLoad = 0.3 + math.random() * 0.4, -- 30-70% system load
        memoryUtilization = 0.4 + math.random() * 0.3, -- 40-70% memory
        networkLatency = 10 + math.random() * 20, -- 10-30ms latency
        processMetrics = {}
    }
    
    for _, process in ipairs(systemMonitor.processes) do
        metrics.processMetrics[process] = {
            cpuUsage = 0.1 + math.random() * 0.4, -- 10-50% CPU per process
            memoryUsage = 100 + math.random() * 200, -- 100-300MB per process
            responseTime = 50 + math.random() * 100, -- 50-150ms response time
            errorRate = math.random() * 0.05 -- 0-5% error rate
        }
    end
    
    table.insert(systemMonitor.metricsHistory, metrics)
    return metrics
end

-- Check emergency stop conditions
function ChaosEngineeringFramework.checkEmergencyStop(chaosResults, config)
    if not config.safetyLimits.emergencyStopOnCriticalFailure then
        return false
    end
    
    -- Check for excessive failure rate
    local recentFailures = 0
    local currentTime = 0
    
    for _, failure in ipairs(chaosResults.failureInjections) do
        if currentTime - failure.injectionTime <= 60 then -- Last minute
            recentFailures = recentFailures + 1
        end
    end
    
    if recentFailures > config.safetyLimits.maxFailuresPerMinute then
        print(string.format("Emergency stop: %d failures in last minute", recentFailures))
        return true
    end
    
    -- Check for critical system metrics
    if #chaosResults.systemMetrics > 0 then
        local latestMetrics = chaosResults.systemMetrics[#chaosResults.systemMetrics]
        
        if latestMetrics.systemLoad > 0.9 then -- 90% system load
            print("Emergency stop: Critical system load")
            return true
        end
        
        if latestMetrics.memoryUtilization > 0.95 then -- 95% memory usage
            print("Emergency stop: Critical memory usage")
            return true
        end
    end
    
    return false
end

-- Generate comprehensive chaos engineering summary
function ChaosEngineeringFramework.generateChaosSummary(chaosResults)
    local summary = {
        totalFailuresInjected = #chaosResults.failureInjections,
        totalRecoveries = #chaosResults.recoveryValidations,
        averageRecoveryTime = 0,
        recoverySuccessRate = 0,
        scenarioBreakdown = {},
        resillienceScore = 0,
        recommendations = {}
    }
    
    -- Calculate average recovery time
    local totalRecoveryTime = 0
    local successfulRecoveries = 0
    
    for _, validation in ipairs(chaosResults.recoveryValidations) do
        totalRecoveryTime = totalRecoveryTime + validation.recoveryTime
        if validation.overallSuccess then
            successfulRecoveries = successfulRecoveries + 1
        end
    end
    
    if #chaosResults.recoveryValidations > 0 then
        summary.averageRecoveryTime = totalRecoveryTime / #chaosResults.recoveryValidations
        summary.recoverySuccessRate = successfulRecoveries / #chaosResults.recoveryValidations
    end
    
    -- Scenario breakdown
    local scenarioStats = {}
    for _, failure in ipairs(chaosResults.failureInjections) do
        if not scenarioStats[failure.scenarioType] then
            scenarioStats[failure.scenarioType] = {
                injected = 0,
                recovered = 0,
                timedOut = 0
            }
        end
        scenarioStats[failure.scenarioType].injected = scenarioStats[failure.scenarioType].injected + 1
    end
    
    for _, validation in ipairs(chaosResults.recoveryValidations) do
        if scenarioStats[validation.scenarioType] then
            if validation.overallSuccess then
                scenarioStats[validation.scenarioType].recovered = scenarioStats[validation.scenarioType].recovered + 1
            end
        end
    end
    
    summary.scenarioBreakdown = scenarioStats
    
    -- Calculate resilience score (0-100)
    local resilienceFactors = {
        recoverySuccessRate = summary.recoverySuccessRate * 40, -- 40 points max
        recoverySpeed = math.max(0, 30 - (summary.averageRecoveryTime / 2)), -- 30 points max, penalty for slow recovery
        systemStability = 30 -- 30 points max, based on system metrics stability
    }
    
    summary.resillienceScore = resilienceFactors.recoverySuccessRate + 
                              resilienceFactors.recoverySpeed + 
                              resilienceFactors.systemStability
    
    -- Generate recommendations
    summary.recommendations = ChaosEngineeringFramework.generateChaosRecommendations(summary)
    
    return summary
end

-- Generate chaos engineering recommendations
function ChaosEngineeringFramework.generateChaosRecommendations(summary)
    local recommendations = {}
    
    -- Recovery rate recommendations
    if summary.recoverySuccessRate < 0.8 then
        table.insert(recommendations, {
            priority = "critical",
            category = "resilience",
            description = "Low recovery success rate detected",
            action = "Review failure detection and recovery mechanisms"
        })
    elseif summary.recoverySuccessRate < 0.95 then
        table.insert(recommendations, {
            priority = "high",
            category = "resilience", 
            description = "Recovery success rate below 95%",
            action = "Improve error handling and recovery procedures"
        })
    end
    
    -- Recovery time recommendations
    if summary.averageRecoveryTime > 60 then
        table.insert(recommendations, {
            priority = "high",
            category = "performance",
            description = "Average recovery time exceeds 1 minute",
            action = "Optimize recovery procedures and reduce detection lag"
        })
    elseif summary.averageRecoveryTime > 30 then
        table.insert(recommendations, {
            priority = "medium",
            category = "performance",
            description = "Recovery time could be improved",
            action = "Review monitoring and alerting systems for faster detection"
        })
    end
    
    -- Resilience score recommendations
    if summary.resillienceScore < 60 then
        table.insert(recommendations, {
            priority = "critical",
            category = "system_design",
            description = "Low system resilience score",
            action = "Comprehensive review of fault tolerance architecture needed"
        })
    elseif summary.resillienceScore < 80 then
        table.insert(recommendations, {
            priority = "medium",
            category = "system_design",
            description = "System resilience can be improved",
            action = "Focus on specific failure scenarios with poor recovery"
        })
    end
    
    return recommendations
end

-- Get chaos engineering test results
function ChaosEngineeringFramework.getChaosTestResults(testId)
    if testId then
        return ChaosEngineeringFramework.chaosTests[testId]
    else
        return ChaosEngineeringFramework.chaosTests
    end
end

return ChaosEngineeringFramework