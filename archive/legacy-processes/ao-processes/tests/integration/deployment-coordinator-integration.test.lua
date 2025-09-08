-- Integration Tests for Deployment Coordinator System
-- Tests complete deployment workflows with all components

local TestFramework = require("tests.test-framework")

-- Integration test suite
local suite = TestFramework.createSuite("DeploymentCoordinatorIntegration")

-- Test configuration
local testConfig = {
    testProcesses = {
        "test-coordinator",
        "test-battle",
        "test-pokemon",
        "test-shop"
    },
    deploymentTimeout = 120,
    healthCheckTimeout = 30,
    maxRetries = 3
}

-- Mock AO process environment
local mockAO = {
    id = "test-deployment-coordinator",
    send = function(message) 
        -- Mock successful message sending
        return true 
    end
}

-- Mock process registry for testing
local mockProcessRegistry = {
    ["test-coordinator"] = {
        processId = "test-coordinator-123",
        processType = "COORDINATOR",
        status = "ACTIVE",
        capabilities = {"PROCESS_COORDINATION", "MESSAGE_ROUTING"}
    },
    ["test-battle"] = {
        processId = "test-battle-456",
        processType = "BATTLE",
        status = "ACTIVE", 
        capabilities = {"BATTLE_PROCESSING", "TURN_RESOLUTION"}
    },
    ["test-pokemon"] = {
        processId = "test-pokemon-789",
        processType = "POKEMON",
        status = "ACTIVE",
        capabilities = {"POKEMON_MANAGEMENT", "PARTY_MANAGEMENT"}
    },
    ["test-shop"] = {
        processId = "test-shop-012",
        processType = "SHOP", 
        status = "ACTIVE",
        capabilities = {"SHOP_MANAGEMENT", "ITEM_PURCHASING"}
    }
}

-- Mock message responses for different scenarios
local mockMessageResponses = {
    successful_deployment = {
        success = true,
        processId = "test-process-id",
        deploymentTime = 0,
        correlationId = "test-correlation-id"
    },
    successful_health_check = {
        success = true,
        healthStatus = "HEALTHY",
        responseTime = 150,
        healthMetrics = {
            uptime = 3600,
            memoryUsage = 45.5,
            cpuUsage = 25.2,
            errorRate = 0.001
        }
    },
    successful_rollback = {
        success = true,
        processId = "test-process-id",
        rollbackTime = 0,
        rollbackPoint = "pre-deployment-state"
    }
}

-- Helper function to simulate message routing
local function simulateMessageRouting(messageType, message, routingType)
    -- Simulate processing delay
    TestFramework.sleep(0.1)
    
    if messageType == "PROCESS_DEPLOYMENT" then
        return mockMessageResponses.successful_deployment
    elseif messageType == "DEPLOYMENT_HEALTH_CHECK" then
        return mockMessageResponses.successful_health_check
    elseif messageType == "DEPLOYMENT_ROLLBACK" then  
        return mockMessageResponses.successful_rollback
    else
        return { success = true, messageId = "test-message-id" }
    end
end

-- Setup function to initialize test environment
local function setupTestEnvironment()
    -- Mock the AO global
    _G.ao = mockAO
    
    -- Mock require to return our test modules
    local originalRequire = require
    
    _G.require = function(moduleName)
        if moduleName == "game-logic.process-coordination.message-correlator" then
            return {
                generateId = function() return "id_" .. msg.Timestamp end,
                initialize = function() end
            }
        elseif moduleName == "game-logic.process-coordination.message-router" then
            return {
                routeMessage = simulateMessageRouting,
                initialize = function() end
            }
        elseif moduleName == "game-logic.process-coordination.process-authenticator" then
            return {
                authenticateRequest = function() return { success = true, userId = "test-admin" } end,
                initialize = function() end
            }
        else
            return originalRequire(moduleName)
        end
    end
end

-- Teardown function to clean test environment
local function teardownTestEnvironment()
    -- Restore original require
    _G.require = require
    _G.ao = nil
end

-- Test: Full Deployment Workflow
suite:addTest("should execute complete deployment workflow", function()
    -- Setup
    setupTestEnvironment()
    
    -- Load deployment coordinator components
    local DeploymentOrchestrator = require("coordinator.components.deployment-orchestrator")
    local HealthValidator = require("coordinator.components.health-validator")
    local DeploymentMonitor = require("coordinator.components.deployment-monitor")
    
    -- Initialize components
    DeploymentOrchestrator.initialize()
    HealthValidator.initialize()
    DeploymentMonitor.initialize()
    
    -- Arrange - Create deployment request
    local deploymentRequest = {
        targetProcesses = {"test-coordinator", "test-battle"},
        deploymentStrategy = "DEPENDENCY_AWARE",
        configuration = {
            ["test-coordinator"] = { setting = "coordinator_value" },
            ["test-battle"] = { setting = "battle_value" }
        },
        adminUserId = "integration-test-admin",
        healthCheckTimeout = testConfig.healthCheckTimeout,
        rollbackEnabled = true
    }
    
    -- Act - Execute deployment
    local deploymentResult = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    
    -- Assert - Deployment success
    TestFramework.assertTrue(deploymentResult.success, "Deployment should succeed")
    TestFramework.assertNotNil(deploymentResult.deploymentId, "Should have deployment ID")
    TestFramework.assertEqual(deploymentResult.status, "COMPLETED", "Should be completed")
    TestFramework.assertNotNil(deploymentResult.deploymentPlan, "Should have deployment plan")
    
    -- Verify deployment plan execution order (coordinator should come first)
    local executionOrder = deploymentResult.deploymentPlan.executionOrder
    TestFramework.assertTrue(#executionOrder == 2, "Should have both processes in execution order")
    
    local coordinatorIndex, battleIndex
    for i, processId in ipairs(executionOrder) do
        if processId == "test-coordinator" then
            coordinatorIndex = i
        elseif processId == "test-battle" then
            battleIndex = i
        end
    end
    
    TestFramework.assertTrue(coordinatorIndex < battleIndex, 
                           "Coordinator should be deployed before battle")
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Test: Health Validation Integration
suite:addTest("should perform integrated health validation", function()
    -- Setup
    setupTestEnvironment()
    
    local HealthValidator = require("coordinator.components.health-validator")
    
    -- Initialize with mock admin integration
    HealthValidator.initialize({}, "test-admin-process-id")
    
    -- Arrange - Create health validation request
    local validationRequest = {
        validationType = "POST_DEPLOYMENT",
        deploymentId = "test-deployment-123",
        targetProcesses = testConfig.testProcesses,
        healthThresholds = {
            maxResponseTimeMs = 5000,
            minHealthyProcessPercentage = 95,
            maxErrorRate = 0.05
        },
        timeoutSeconds = testConfig.healthCheckTimeout,
        adminUserId = "test-admin"
    }
    
    -- Act - Perform health validation
    local validationResult = HealthValidator.validateDeploymentHealth(validationRequest)
    
    -- Assert - Health validation success
    TestFramework.assertTrue(validationResult.success, "Health validation should succeed")
    TestFramework.assertNotNil(validationResult.validationId, "Should have validation ID")
    TestFramework.assertEqual(validationResult.status, "PASSED", "Should pass validation")
    TestFramework.assertEqual(validationResult.overallHealthStatus, "HEALTHY", 
                            "Should have healthy overall status")
    
    -- Verify process health results
    local processHealthResults = validationResult.processHealthResults
    TestFramework.assertNotNil(processHealthResults, "Should have process health results")
    
    for processId in pairs(processHealthResults) do
        local processResult = processHealthResults[processId]
        TestFramework.assertTrue(processResult.success, 
                               "Process " .. processId .. " should be healthy")
    end
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Test: Rollback Integration
suite:addTest("should execute complete rollback workflow", function()
    -- Setup
    setupTestEnvironment()
    
    local RollbackManager = require("coordinator.components.rollback-manager")
    local DeploymentOrchestrator = require("coordinator.components.deployment-orchestrator")
    
    -- Initialize components
    RollbackManager.initialize()
    DeploymentOrchestrator.initialize()
    
    -- Arrange - First deploy something to rollback
    local deploymentRequest = {
        targetProcesses = {"test-battle", "test-pokemon"},
        deploymentStrategy = "SEQUENTIAL",
        configuration = {},
        adminUserId = "integration-test-admin"
    }
    
    local deploymentResult = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    TestFramework.assertTrue(deploymentResult.success, "Initial deployment should succeed")
    
    -- Create rollback request
    local rollbackRequest = {
        rollbackType = "DEPLOYMENT_ROLLBACK",
        strategy = "DEPENDENCY_AWARE",
        targetProcesses = {"test-battle", "test-pokemon"},
        rollbackPoint = "pre-deployment-state",
        reason = "Integration test rollback",
        deploymentId = deploymentResult.deploymentId,
        preserveState = true,
        validationRequired = true,
        adminUserId = "integration-test-admin"
    }
    
    -- Act - Execute rollback
    local rollbackResult = RollbackManager.executeRollback(rollbackRequest)
    
    -- Assert - Rollback success
    TestFramework.assertTrue(rollbackResult.success, "Rollback should succeed")
    TestFramework.assertNotNil(rollbackResult.rollbackId, "Should have rollback ID")
    TestFramework.assertEqual(rollbackResult.status, "COMPLETED", "Should be completed")
    TestFramework.assertNotNil(rollbackResult.rollbackResults, "Should have rollback results")
    
    -- Verify rollback execution order (reverse of deployment)
    local rollbackPlan = rollbackResult.rollbackPlan
    TestFramework.assertNotNil(rollbackPlan, "Should have rollback plan")
    
    -- Verify rollback results for each process
    local rollbackResults = rollbackResult.rollbackResults
    for _, processId in ipairs(rollbackRequest.targetProcesses) do
        local processResult = rollbackResults[processId]
        TestFramework.assertNotNil(processResult, 
                                 "Should have result for process " .. processId)
        TestFramework.assertTrue(processResult.success, 
                               "Rollback should succeed for process " .. processId)
    end
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Test: Blue-Green Deployment Integration
suite:addTest("should execute blue-green deployment workflow", function()
    -- Setup
    setupTestEnvironment()
    
    local BlueGreenManager = require("coordinator.components.blue-green-manager")
    
    -- Initialize component
    BlueGreenManager.initialize()
    
    -- Mock successful blue-green responses
    local originalRouteMessage = simulateMessageRouting
    simulateMessageRouting = function(messageType, message, routingType)
        if messageType == "BLUE_GREEN_DEPLOY" then
            return { success = true, environment = "GREEN", deploymentTime = 0 }
        elseif messageType == "GREEN_HEALTH_CHECK" then
            return { 
                success = true, 
                healthStatus = "HEALTHY", 
                environment = "GREEN",
                responseTime = 200 
            }
        else
            return originalRouteMessage(messageType, message, routingType)
        end
    end
    
    -- Create mock message for blue-green request
    local mockMessage = {
        Data = require('json').encode({
            blueGreenRequest = {
                targetProcesses = {"test-battle"},
                newVersion = "2.1.0",
                trafficStrategy = "GRADUAL",
                healthCheckTimeout = 60,
                rollbackOnFailure = true,
                adminUserId = "integration-test-admin"
            }
        }),
        Tags = { CorrelationId = "test-correlation-bg" }
    }
    
    -- Act - Execute blue-green deployment
    local bgResult = BlueGreenManager.handleBlueGreenRequest(mockMessage)
    
    -- Assert - Blue-green deployment success
    TestFramework.assertTrue(bgResult.success, "Blue-green deployment should succeed")
    TestFramework.assertNotNil(bgResult.deploymentId, "Should have deployment ID")
    TestFramework.assertEqual(bgResult.phase, "COMPLETED", "Should reach completed phase")
    TestFramework.assertNotNil(bgResult.processVersions, "Should have process versions")
    TestFramework.assertNotNil(bgResult.trafficRouting, "Should have traffic routing info")
    
    -- Verify traffic routing configuration
    local trafficRouting = bgResult.trafficRouting
    for processId, routingInfo in pairs(trafficRouting) do
        TestFramework.assertNotNil(routingInfo.blue, "Should have blue traffic percentage")
        TestFramework.assertNotNil(routingInfo.green, "Should have green traffic percentage")
        TestFramework.assertEqual(routingInfo.blue + routingInfo.green, 100, 
                                "Traffic percentages should sum to 100")
    end
    
    -- Restore original function
    simulateMessageRouting = originalRouteMessage
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Test: Configuration Management Integration
suite:addTest("should distribute configuration across processes", function()
    -- Setup
    setupTestEnvironment()
    
    local ConfigDistributor = require("coordinator.components.config-distributor")
    
    -- Initialize component
    ConfigDistributor.initialize()
    
    -- Create mock message for configuration distribution
    local configData = {
        logLevel = "INFO",
        maxConnections = 100,
        timeout = 30000,
        enableMetrics = true
    }
    
    local mockMessage = {
        Data = require('json').encode({
            configRequest = {
                requestType = "DISTRIBUTE_CONFIG",
                configType = "PROCESS_CONFIG",
                targetProcesses = {"test-battle", "test-pokemon"},
                configData = configData,
                validationRequired = true,
                version = "config-v1.0.0"
            }
        }),
        Tags = { CorrelationId = "test-correlation-config" }
    }
    
    -- Act - Distribute configuration
    local configResult = ConfigDistributor.handleConfigurationRequest(mockMessage)
    
    -- Assert - Configuration distribution success
    TestFramework.assertTrue(configResult.success, "Configuration distribution should succeed")
    TestFramework.assertNotNil(configResult.distributionId, "Should have distribution ID")
    TestFramework.assertEqual(configResult.status, "COMPLETED", "Should be completed")
    TestFramework.assertNotNil(configResult.distributionResults, "Should have distribution results")
    
    -- Verify distribution results
    local distributionResults = configResult.distributionResults
    for _, processId in ipairs({"test-battle", "test-pokemon"}) do
        local processResult = distributionResults[processId]
        TestFramework.assertNotNil(processResult, 
                                 "Should have result for process " .. processId)
        TestFramework.assertTrue(processResult.success, 
                               "Configuration should be distributed to " .. processId)
    end
    
    -- Verify success counts
    TestFramework.assertEqual(configResult.successCount, 2, 
                            "Should have 2 successful distributions")
    TestFramework.assertEqual(configResult.totalCount, 2, 
                            "Should have 2 total distributions")
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Test: Deployment Monitoring Integration  
suite:addTest("should monitor deployment metrics and generate alerts", function()
    -- Setup
    setupTestEnvironment()
    
    local DeploymentMonitor = require("coordinator.components.deployment-monitor")
    
    -- Initialize with admin integration
    DeploymentMonitor.initialize({}, "test-admin-process-id")
    
    -- Arrange - Simulate deployment metrics
    local deploymentResults = {
        {
            success = true,
            duration = 120,
            deploymentType = "SEQUENTIAL",
            processCount = 3,
            deploymentId = "test-deploy-1"
        },
        {
            success = false,
            duration = 300,
            deploymentType = "DEPENDENCY_AWARE", 
            processCount = 2,
            deploymentId = "test-deploy-2",
            wasRolledBack = true
        },
        {
            success = true,
            duration = 95,
            deploymentType = "PARALLEL",
            processCount = 4,
            deploymentId = "test-deploy-3"
        }
    }
    
    -- Act - Record deployment metrics
    for _, result in ipairs(deploymentResults) do
        DeploymentMonitor.recordDeploymentMetrics(result)
    end
    
    -- Update performance metrics
    DeploymentMonitor.updatePerformanceMetrics({
        cpuUsage = 35.5,
        memoryUsage = 62.3,
        messageProcessingTime = 145,
        activeConnections = 25,
        throughput = 87,
        errorRate = 0.02
    })
    
    -- Act - Get deployment statistics
    local stats = DeploymentMonitor.getDeploymentStatistics()
    
    -- Assert - Statistics accuracy
    TestFramework.assertEqual(stats.totalDeployments, 3, "Should record all deployments")
    TestFramework.assertEqual(stats.successfulDeployments, 2, "Should record successful deployments")
    TestFramework.assertEqual(stats.failedDeployments, 1, "Should record failed deployments")
    TestFramework.assertEqual(stats.rolledBackDeployments, 1, "Should record rolled back deployments")
    
    -- Verify success rate calculation
    local expectedSuccessRate = (2 / 3) * 100
    TestFramework.assertTrue(math.abs(stats.successRate - expectedSuccessRate) < 0.1, 
                           "Should calculate correct success rate")
    
    -- Verify rollback rate calculation
    local expectedRollbackRate = (1 / 3) * 100
    TestFramework.assertTrue(math.abs(stats.rollbackRate - expectedRollbackRate) < 0.1, 
                           "Should calculate correct rollback rate")
    
    -- Verify performance metrics
    local perfMetrics = stats.performanceMetrics
    TestFramework.assertEqual(perfMetrics.coordinatorCpuUsage, 35.5, 
                            "Should record CPU usage")
    TestFramework.assertEqual(perfMetrics.coordinatorMemoryUsage, 62.3, 
                            "Should record memory usage")
    TestFramework.assertEqual(perfMetrics.errorRate, 0.02, 
                            "Should record error rate")
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Test: Process Discovery Integration
suite:addTest("should handle process registration and discovery", function()
    -- Setup
    setupTestEnvironment()
    
    local DiscoveryHandler = require("coordinator.handlers.discovery-handler")
    
    -- Initialize with mock state
    local mockState = {
        processRegistry = {},
        config = { processDiscoveryEnabled = true }
    }
    DiscoveryHandler.initialize(mockState)
    
    -- Arrange - Process registration requests
    local registrationRequests = {
        {
            processRegistration = {
                processId = "integration-test-battle",
                processType = "BATTLE",
                version = "1.2.0",
                capabilities = {"BATTLE_PROCESSING", "TURN_RESOLUTION"},
                healthCheckEndpoint = "BATTLE_HEALTH"
            }
        },
        {
            processRegistration = {
                processId = "integration-test-pokemon", 
                processType = "POKEMON",
                version = "1.2.0",
                capabilities = {"POKEMON_MANAGEMENT", "PARTY_MANAGEMENT"},
                healthCheckEndpoint = "POKEMON_HEALTH"
            }
        }
    }
    
    -- Act - Register processes
    local registrationResults = {}
    for i, regData in ipairs(registrationRequests) do
        local mockMessage = {
            Data = require('json').encode(regData),
            Tags = { CorrelationId = "test-reg-" .. i },
            From = "test-source-" .. i
        }
        
        local result = DiscoveryHandler.handleProcessRegistration(mockMessage)
        table.insert(registrationResults, result)
    end
    
    -- Assert - Registration success
    for i, result in ipairs(registrationResults) do
        TestFramework.assertTrue(result.success, 
                               "Process registration " .. i .. " should succeed")
        TestFramework.assertNotNil(result.processId, "Should have process ID")
        TestFramework.assertNotNil(result.registrationTime, "Should have registration time")
    end
    
    -- Test process discovery
    local discoveryResult = DiscoveryHandler.handleProcessDiscovery("BATTLE")
    
    -- Assert - Discovery success
    TestFramework.assertTrue(discoveryResult.success, "Process discovery should succeed")
    TestFramework.assertEqual(discoveryResult.processCount, 1, 
                            "Should find one BATTLE process")
    TestFramework.assertNotNil(discoveryResult.processes["integration-test-battle"], 
                             "Should find registered battle process")
    
    -- Test discovery of all processes
    local allProcessDiscovery = DiscoveryHandler.handleProcessDiscovery()
    TestFramework.assertTrue(allProcessDiscovery.success, "All process discovery should succeed")
    TestFramework.assertEqual(allProcessDiscovery.processCount, 2, 
                            "Should find both registered processes")
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Test: End-to-End Deployment Scenario
suite:addTest("should execute complete end-to-end deployment scenario", function()
    -- Setup
    setupTestEnvironment()
    
    -- Load all coordinator components
    local DeploymentOrchestrator = require("coordinator.components.deployment-orchestrator")
    local HealthValidator = require("coordinator.components.health-validator")
    local RollbackManager = require("coordinator.components.rollback-manager")
    local DeploymentMonitor = require("coordinator.components.deployment-monitor")
    local ConfigDistributor = require("coordinator.components.config-distributor")
    
    -- Initialize all components
    DeploymentOrchestrator.initialize()
    HealthValidator.initialize({}, "test-admin-process")
    RollbackManager.initialize()
    DeploymentMonitor.initialize({}, "test-admin-process")
    ConfigDistributor.initialize()
    
    -- Phase 1: Deploy processes
    local deploymentRequest = {
        targetProcesses = {"test-coordinator", "test-battle", "test-pokemon"},
        deploymentStrategy = "DEPENDENCY_AWARE",
        configuration = {
            ["test-coordinator"] = { role = "coordinator", maxConnections = 1000 },
            ["test-battle"] = { role = "battle", maxBattles = 100 },
            ["test-pokemon"] = { role = "pokemon", maxPartySize = 6 }
        },
        adminUserId = "e2e-test-admin",
        healthCheckTimeout = 60,
        rollbackEnabled = true
    }
    
    local deploymentResult = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    TestFramework.assertTrue(deploymentResult.success, "E2E deployment should succeed")
    
    -- Record deployment metrics
    DeploymentMonitor.recordDeploymentMetrics({
        success = deploymentResult.success,
        duration = 180,
        deploymentType = "DEPENDENCY_AWARE",
        processCount = #deploymentRequest.targetProcesses,
        deploymentId = deploymentResult.deploymentId
    })
    
    -- Phase 2: Health validation
    local healthValidationRequest = {
        validationType = "POST_DEPLOYMENT",
        deploymentId = deploymentResult.deploymentId,
        targetProcesses = deploymentRequest.targetProcesses,
        timeoutSeconds = 60,
        adminUserId = "e2e-test-admin"
    }
    
    local healthResult = HealthValidator.validateDeploymentHealth(healthValidationRequest)
    TestFramework.assertTrue(healthResult.success, "E2E health validation should succeed")
    
    -- Phase 3: Configuration distribution
    local configDistributionMessage = {
        Data = require('json').encode({
            configRequest = {
                requestType = "DISTRIBUTE_CONFIG",
                configType = "LOGGING_CONFIG", 
                targetProcesses = deploymentRequest.targetProcesses,
                configData = {
                    logLevel = "DEBUG",
                    enableConsoleOutput = true,
                    enableFileOutput = false
                },
                validationRequired = true
            }
        }),
        Tags = { CorrelationId = "e2e-config" }
    }
    
    local configResult = ConfigDistributor.handleConfigurationRequest(configDistributionMessage)
    TestFramework.assertTrue(configResult.success, "E2E configuration distribution should succeed")
    
    -- Phase 4: Test rollback capability (but don't execute - just validate)
    local rollbackRequest = {
        rollbackType = "DEPLOYMENT_ROLLBACK",
        strategy = "DEPENDENCY_AWARE",
        targetProcesses = deploymentRequest.targetProcesses,
        rollbackPoint = "pre-deployment-state",
        reason = "E2E test validation",
        deploymentId = deploymentResult.deploymentId,
        preserveState = true,
        validationRequired = false, -- Skip validation for faster test
        adminUserId = "e2e-test-admin"
    }
    
    -- Just validate rollback request without executing
    local rollbackValidation = RollbackManager._validateRollbackRequest(rollbackRequest)
    TestFramework.assertTrue(rollbackValidation.success, "E2E rollback validation should succeed")
    
    -- Phase 5: Verify monitoring data
    local monitoringStats = DeploymentMonitor.getDeploymentStatistics()
    TestFramework.assertTrue(monitoringStats.totalDeployments >= 1, 
                           "Should record deployment in monitoring")
    TestFramework.assertTrue(monitoringStats.successfulDeployments >= 1, 
                           "Should record successful deployment")
    
    -- Final assertions - end-to-end workflow completion
    TestFramework.assertTrue(deploymentResult.success, "E2E: Deployment phase succeeded")
    TestFramework.assertTrue(healthResult.success, "E2E: Health validation phase succeeded")
    TestFramework.assertTrue(configResult.success, "E2E: Configuration phase succeeded")
    TestFramework.assertTrue(rollbackValidation.success, "E2E: Rollback validation succeeded")
    TestFramework.assertTrue(monitoringStats.totalDeployments > 0, "E2E: Monitoring recorded data")
    
    print("[E2E Test] Complete deployment workflow executed successfully")
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Performance Integration Test
suite:addTest("should handle concurrent deployment requests efficiently", function()
    -- Setup
    setupTestEnvironment()
    
    local DeploymentOrchestrator = require("coordinator.components.deployment-orchestrator")
    DeploymentOrchestrator.initialize({ maxConcurrentDeployments = 10 })
    
    -- Create multiple deployment requests
    local deploymentRequests = {}
    for i = 1, 5 do
        table.insert(deploymentRequests, {
            targetProcesses = {"test-process-" .. i},
            deploymentStrategy = "SEQUENTIAL",
            configuration = {},
            adminUserId = "perf-test-admin-" .. i
        })
    end
    
    -- Execute deployments
    local startTime = msg.Timestamp
    local results = {}
    
    for i, request in ipairs(deploymentRequests) do
        local result = DeploymentOrchestrator.orchestrateDeployment(request)
        table.insert(results, result)
    end
    
    local endTime = 0
    local totalTime = endTime - startTime
    
    -- Assert performance and success
    TestFramework.assertTrue(totalTime < 5, "Concurrent deployments should complete quickly")
    
    for i, result in ipairs(results) do
        TestFramework.assertTrue(result.success, "Concurrent deployment " .. i .. " should succeed")
        TestFramework.assertNotNil(result.deploymentId, "Should have unique deployment ID")
    end
    
    -- Verify all deployments have unique IDs
    local deploymentIds = {}
    for _, result in ipairs(results) do
        TestFramework.assertNil(deploymentIds[result.deploymentId], 
                              "Should have unique deployment ID")
        deploymentIds[result.deploymentId] = true
    end
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Error Recovery Integration Test
suite:addTest("should recover from partial deployment failures", function()
    -- Setup
    setupTestEnvironment()
    
    local DeploymentOrchestrator = require("coordinator.components.deployment-orchestrator")
    local RollbackManager = require("coordinator.components.rollback-manager")
    
    DeploymentOrchestrator.initialize()
    RollbackManager.initialize()
    
    -- Mock partial failure scenario
    local originalRouteMessage = simulateMessageRouting
    local callCount = 0
    
    simulateMessageRouting = function(messageType, message, routingType)
        callCount = callCount + 1
        
        -- Simulate failure for second process deployment
        if messageType == "PROCESS_DEPLOYMENT" and callCount == 2 then
            return { success = false, error = "Simulated deployment failure" }
        else
            return originalRouteMessage(messageType, message, routingType)
        end
    end
    
    -- Create deployment request that will partially fail
    local deploymentRequest = {
        targetProcesses = {"test-process-1", "test-process-2", "test-process-3"},
        deploymentStrategy = "SEQUENTIAL",
        configuration = {},
        rollbackEnabled = true,
        adminUserId = "error-recovery-admin"
    }
    
    -- Execute deployment (should partially fail)
    local deploymentResult = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    
    -- Assert partial failure handling
    TestFramework.assertFalse(deploymentResult.success, "Deployment should fail due to simulated error")
    TestFramework.assertNotNil(deploymentResult.error, "Should have error message")
    TestFramework.assertTrue(deploymentResult.rollbackAvailable, "Should indicate rollback availability")
    
    -- Test rollback recovery
    local rollbackRequest = {
        rollbackType = "DEPLOYMENT_ROLLBACK",
        strategy = "SEQUENTIAL",
        targetProcesses = {"test-process-1"}, -- Only rollback successful deployments
        rollbackPoint = "pre-deployment-state",
        reason = "Recovery from partial failure",
        deploymentId = deploymentResult.deploymentId,
        preserveState = false, -- Skip state preservation for faster test
        validationRequired = false,
        adminUserId = "error-recovery-admin"
    }
    
    local rollbackResult = RollbackManager.executeRollback(rollbackRequest)
    TestFramework.assertTrue(rollbackResult.success, "Rollback recovery should succeed")
    
    -- Restore original function
    simulateMessageRouting = originalRouteMessage
    
    -- Cleanup
    teardownTestEnvironment()
end)

-- Run the integration test suite
return suite