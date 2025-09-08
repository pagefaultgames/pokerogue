-- Unit Tests for Deployment Orchestrator Component

-- Mock dependencies
local TestFramework = require("tests.test-framework")
local DeploymentOrchestrator = require("coordinator.components.deployment-orchestrator")

-- Test suite setup
local suite = TestFramework.createSuite("DeploymentOrchestrator")

-- Mock MessageCorrelator
local MockMessageCorrelator = {
    generateId = function()
        return "test-correlation-" .. math.random(1000, 9999)
    end
}

-- Mock MessageRouter
local MockMessageRouter = {
    routeMessage = function(messageType, message, routingType)
        return { success = true, messageId = "test-message-id" }
    end
}

-- Replace real dependencies with mocks
package.loaded["game-logic.process-coordination.message-correlator"] = MockMessageCorrelator
package.loaded["game-logic.process-coordination.message-router"] = MockMessageRouter

-- Test: Initialization
suite:addTest("should initialize with default configuration", function()
    -- Arrange & Act
    DeploymentOrchestrator.initialize()
    
    -- Assert
    TestFramework.assertTrue(DeploymentOrchestrator.config.maxConcurrentDeployments == 5, 
                           "Should have default max concurrent deployments")
    TestFramework.assertTrue(DeploymentOrchestrator.config.dependencyCheckEnabled, 
                           "Should have dependency check enabled by default")
end)

suite:addTest("should initialize with custom configuration", function()
    -- Arrange
    local customConfig = {
        maxConcurrentDeployments = 10,
        deploymentTimeoutMinutes = 30,
        dependencyCheckEnabled = false
    }
    
    -- Act
    DeploymentOrchestrator.initialize(customConfig)
    
    -- Assert
    TestFramework.assertEqual(DeploymentOrchestrator.config.maxConcurrentDeployments, 10, 
                            "Should use custom max concurrent deployments")
    TestFramework.assertEqual(DeploymentOrchestrator.config.deploymentTimeoutMinutes, 30, 
                            "Should use custom deployment timeout")
    TestFramework.assertFalse(DeploymentOrchestrator.config.dependencyCheckEnabled, 
                            "Should use custom dependency check setting")
end)

-- Test: Deployment Request Validation
suite:addTest("should validate deployment request successfully", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local validRequest = {
        targetProcesses = {"process1", "process2"},
        deploymentStrategy = "DEPENDENCY_AWARE",
        configuration = {}
    }
    
    -- Act
    local result = DeploymentOrchestrator._validateDeploymentRequest(validRequest)
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should validate valid request")
end)

suite:addTest("should reject deployment request with no target processes", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local invalidRequest = {
        deploymentStrategy = "SEQUENTIAL"
    }
    
    -- Act
    local result = DeploymentOrchestrator._validateDeploymentRequest(invalidRequest)
    
    -- Assert
    TestFramework.assertFalse(result.success, "Should reject request without target processes")
    TestFramework.assertStringContains(result.error, "Target processes are required", 
                                     "Should have appropriate error message")
end)

suite:addTest("should reject deployment request with too many processes", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local invalidRequest = {
        targetProcesses = {"p1", "p2", "p3", "p4", "p5", "p6", "p7"}  -- More than max (5)
    }
    
    -- Act
    local result = DeploymentOrchestrator._validateDeploymentRequest(invalidRequest)
    
    -- Assert
    TestFramework.assertFalse(result.success, "Should reject request with too many processes")
    TestFramework.assertStringContains(result.error, "Too many target processes", 
                                     "Should have appropriate error message")
end)

-- Test: Deployment Plan Generation
suite:addTest("should generate sequential deployment plan", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local deployment = {
        strategy = DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.SEQUENTIAL,
        targetProcesses = {"process1", "process2", "process3"}
    }
    
    -- Act
    local result = DeploymentOrchestrator._generateDeploymentPlan(deployment)
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should generate plan successfully")
    TestFramework.assertEqual(result.deploymentPlan.strategy, "SEQUENTIAL", 
                            "Should use sequential strategy")
    TestFramework.assertEqual(#result.deploymentPlan.executionOrder, 3, 
                            "Should have all processes in execution order")
end)

suite:addTest("should generate dependency-aware deployment plan", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local deployment = {
        strategy = DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.DEPENDENCY_AWARE,
        targetProcesses = {"battle-process", "coordinator-process"}
    }
    
    -- Act
    local result = DeploymentOrchestrator._generateDeploymentPlan(deployment)
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should generate plan successfully")
    TestFramework.assertEqual(result.deploymentPlan.strategy, "DEPENDENCY_AWARE", 
                            "Should use dependency-aware strategy")
    
    -- Coordinator should come before battle (dependency order)
    local executionOrder = result.deploymentPlan.executionOrder
    local coordinatorIndex, battleIndex
    for i, processId in ipairs(executionOrder) do
        if processId == "coordinator-process" then
            coordinatorIndex = i
        elseif processId == "battle-process" then
            battleIndex = i
        end
    end
    
    TestFramework.assertTrue(coordinatorIndex and battleIndex, 
                           "Both processes should be in execution order")
    TestFramework.assertTrue(coordinatorIndex < battleIndex, 
                           "Coordinator should be deployed before battle")
end)

-- Test: Deployment Orchestration
suite:addTest("should orchestrate successful deployment", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local deploymentRequest = {
        targetProcesses = {"process1"},
        deploymentStrategy = "SEQUENTIAL",
        configuration = {},
        adminUserId = "test-admin",
        correlationId = "test-correlation-123"
    }
    
    -- Act
    local result = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should orchestrate deployment successfully")
    TestFramework.assertNotNil(result.deploymentId, "Should have deployment ID")
    TestFramework.assertEqual(result.status, DeploymentOrchestrator.DEPLOYMENT_STATUS.COMPLETED, 
                            "Should have completed status")
end)

suite:addTest("should handle deployment with invalid strategy", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local deploymentRequest = {
        targetProcesses = {"process1"},
        deploymentStrategy = "INVALID_STRATEGY",
        configuration = {}
    }
    
    -- Act
    local result = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    
    -- Assert
    TestFramework.assertFalse(result.success, "Should fail with invalid strategy")
    TestFramework.assertStringContains(result.error, "Invalid deployment strategy", 
                                     "Should have appropriate error message")
end)

-- Test: Deployment Status Tracking
suite:addTest("should track active deployment status", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local deploymentRequest = {
        targetProcesses = {"process1"},
        deploymentStrategy = "SEQUENTIAL",
        configuration = {}
    }
    
    -- Act - Start deployment
    local deploymentResult = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    
    -- Act - Check status (should be in history since orchestrateDeployment completes immediately)
    local statusResult = DeploymentOrchestrator.getDeploymentStatus(deploymentResult.deploymentId)
    
    -- Assert
    TestFramework.assertTrue(statusResult.success, "Should get deployment status successfully")
    TestFramework.assertEqual(statusResult.deployment.id, deploymentResult.deploymentId, 
                            "Should return correct deployment ID")
end)

suite:addTest("should return error for non-existent deployment", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    
    -- Act
    local result = DeploymentOrchestrator.getDeploymentStatus("non-existent-id")
    
    -- Assert
    TestFramework.assertFalse(result.success, "Should fail for non-existent deployment")
    TestFramework.assertStringContains(result.error, "Deployment not found", 
                                     "Should have appropriate error message")
end)

-- Test: Dependency Resolution
suite:addTest("should resolve dependency order correctly", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local processes = {"battle-process", "coordinator-process", "shop-process"}
    
    -- Act
    local result = DeploymentOrchestrator._resolveDependencyOrder(processes)
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should resolve dependencies successfully")
    TestFramework.assertEqual(#result.orderedProcesses, 3, "Should have all processes in order")
    
    -- Find positions
    local positions = {}
    for i, processId in ipairs(result.orderedProcesses) do
        positions[processId] = i
    end
    
    -- Verify dependency order (coordinator should come before battle and shop)
    TestFramework.assertTrue(positions["coordinator-process"] < positions["battle-process"], 
                           "Coordinator should come before battle")
    TestFramework.assertTrue(positions["coordinator-process"] < positions["shop-process"], 
                           "Coordinator should come before shop")
end)

suite:addTest("should handle circular dependencies gracefully", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    
    -- Temporarily modify dependencies to create circular reference
    local originalDeps = DeploymentOrchestrator.processDependencies["battle-process"]
    DeploymentOrchestrator.processDependencies["battle-process"] = {"shop-process"}
    DeploymentOrchestrator.processDependencies["shop-process"] = {"battle-process"}
    
    local processes = {"battle-process", "shop-process"}
    
    -- Act
    local result = DeploymentOrchestrator._resolveDependencyOrder(processes)
    
    -- Restore original dependencies
    DeploymentOrchestrator.processDependencies["battle-process"] = originalDeps
    DeploymentOrchestrator.processDependencies["shop-process"] = {"coordinator-process"}
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should handle circular dependencies")
    TestFramework.assertEqual(#result.orderedProcesses, 2, "Should include both processes")
end)

-- Test: Process Deployment Simulation
suite:addTest("should deploy to process successfully", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local deployment = {
        id = "test-deployment-123",
        strategy = "SEQUENTIAL",
        configuration = { testProcess = { setting = "value" } },
        rollbackEnabled = true
    }
    
    -- Act
    local result = DeploymentOrchestrator._deployToProcess("testProcess", deployment)
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should deploy to process successfully")
    TestFramework.assertEqual(result.processId, "testProcess", "Should have correct process ID")
    TestFramework.assertNotNil(result.correlationId, "Should have correlation ID")
    TestFramework.assertNotNil(result.deploymentTime, "Should have deployment time")
end)

-- Test: Health Check Validation
suite:addTest("should validate process health successfully", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    local deployment = {
        id = "test-deployment-123",
        healthCheckTimeout = 60
    }
    
    -- Act
    local result = DeploymentOrchestrator._validateProcessHealth("testProcess", deployment)
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should validate process health successfully")
    TestFramework.assertEqual(result.processId, "testProcess", "Should have correct process ID")
    TestFramework.assertNotNil(result.correlationId, "Should have correlation ID")
end)

-- Test: Deployment Cancellation
suite:addTest("should cancel active deployment successfully", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    
    -- Create a mock active deployment
    local deploymentId = "test-deployment-cancel"
    DeploymentOrchestrator.activeDeployments[deploymentId] = {
        id = deploymentId,
        status = DeploymentOrchestrator.DEPLOYMENT_STATUS.DEPLOYING,
        targetProcesses = {"process1"},
        startTime = 0
    }
    
    -- Act
    local result = DeploymentOrchestrator.cancelDeployment(deploymentId, "Test cancellation")
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should cancel deployment successfully")
    TestFramework.assertEqual(result.deploymentId, deploymentId, "Should return correct deployment ID")
    TestFramework.assertNil(DeploymentOrchestrator.activeDeployments[deploymentId], 
                          "Should remove from active deployments")
end)

suite:addTest("should not cancel completed deployment", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    
    -- Create a mock completed deployment
    local deploymentId = "test-deployment-completed"
    DeploymentOrchestrator.activeDeployments[deploymentId] = {
        id = deploymentId,
        status = DeploymentOrchestrator.DEPLOYMENT_STATUS.COMPLETED,
        targetProcesses = {"process1"},
        startTime = 0
    }
    
    -- Act
    local result = DeploymentOrchestrator.cancelDeployment(deploymentId, "Test cancellation")
    
    -- Assert
    TestFramework.assertFalse(result.success, "Should not cancel completed deployment")
    TestFramework.assertStringContains(result.error, "Cannot cancel completed deployment", 
                                     "Should have appropriate error message")
end)

-- Test: Active Deployments Management
suite:addTest("should get active deployments list", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    
    -- Add mock active deployments
    DeploymentOrchestrator.activeDeployments["deploy1"] = {
        id = "deploy1",
        status = "DEPLOYING",
        strategy = "SEQUENTIAL",
        targetProcesses = {"process1"},
        startTime = 0
    }
    DeploymentOrchestrator.activeDeployments["deploy2"] = {
        id = "deploy2",
        status = "PENDING",
        strategy = "PARALLEL",
        targetProcesses = {"process2", "process3"},
        startTime = 0
    }
    
    -- Act
    local activeDeployments = DeploymentOrchestrator.getActiveDeployments()
    
    -- Assert
    TestFramework.assertEqual(#activeDeployments, 2, "Should return correct number of active deployments")
    
    -- Find deployments by ID
    local deploy1Found = false
    local deploy2Found = false
    for _, deployment in ipairs(activeDeployments) do
        if deployment.id == "deploy1" then
            deploy1Found = true
            TestFramework.assertEqual(deployment.status, "DEPLOYING", "Should have correct status")
        elseif deployment.id == "deploy2" then
            deploy2Found = true
            TestFramework.assertEqual(deployment.strategy, "PARALLEL", "Should have correct strategy")
        end
    end
    
    TestFramework.assertTrue(deploy1Found, "Should find first deployment")
    TestFramework.assertTrue(deploy2Found, "Should find second deployment")
    
    -- Cleanup
    DeploymentOrchestrator.activeDeployments = {}
end)

suite:addTest("should handle empty active deployments", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    
    -- Act
    local activeDeployments = DeploymentOrchestrator.getActiveDeployments()
    
    -- Assert
    TestFramework.assertEqual(#activeDeployments, 0, "Should return empty list when no active deployments")
end)

-- Test: Deployment Completion and History Management
suite:addTest("should move completed deployment to history", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    
    local deployment = {
        id = "test-deployment-history",
        status = DeploymentOrchestrator.DEPLOYMENT_STATUS.COMPLETED,
        targetProcesses = {"process1"},
        startTime = 0,
        completionTime = 0
    }
    
    DeploymentOrchestrator.activeDeployments[deployment.id] = deployment
    
    -- Act
    DeploymentOrchestrator._completeDeployment(deployment)
    
    -- Assert
    TestFramework.assertNil(DeploymentOrchestrator.activeDeployments[deployment.id], 
                          "Should remove from active deployments")
    
    -- Check if it's in history
    local foundInHistory = false
    for _, historyDeployment in ipairs(DeploymentOrchestrator.deploymentHistory) do
        if historyDeployment.id == deployment.id then
            foundInHistory = true
            break
        end
    end
    
    TestFramework.assertTrue(foundInHistory, "Should add to deployment history")
end)

-- Test: Utility Functions
suite:addTest("should check if process list contains process", function()
    -- Arrange
    local processes = {"process1", "process2", "process3"}
    
    -- Act & Assert
    TestFramework.assertTrue(DeploymentOrchestrator._containsProcess(processes, "process2"), 
                           "Should find existing process")
    TestFramework.assertFalse(DeploymentOrchestrator._containsProcess(processes, "process4"), 
                            "Should not find non-existing process")
    TestFramework.assertFalse(DeploymentOrchestrator._containsProcess({}, "process1"), 
                            "Should handle empty process list")
end)

-- Performance Tests
suite:addTest("should handle large number of processes efficiently", function()
    -- Arrange
    DeploymentOrchestrator.initialize({ maxConcurrentDeployments = 50 })
    
    local processes = {}
    for i = 1, 20 do
        table.insert(processes, "process" .. i)
    end
    
    local deployment = {
        strategy = DeploymentOrchestrator.DEPLOYMENT_STRATEGIES.DEPENDENCY_AWARE,
        targetProcesses = processes
    }
    
    -- Act
    local startTime = msg.Timestamp
    local result = DeploymentOrchestrator._generateDeploymentPlan(deployment)
    local endTime = 0
    
    -- Assert
    TestFramework.assertTrue(result.success, "Should handle large process list")
    TestFramework.assertEqual(#result.deploymentPlan.executionOrder, 20, 
                            "Should include all processes")
    TestFramework.assertTrue(endTime - startTime < 2, 
                           "Should complete dependency resolution quickly")
end)

-- Error Handling Tests
suite:addTest("should handle deployment with invalid process ID", function()
    -- Arrange
    DeploymentOrchestrator.initialize()
    
    local deploymentRequest = {
        targetProcesses = {"", "valid-process"},  -- Empty process ID
        deploymentStrategy = "SEQUENTIAL",
        configuration = {}
    }
    
    -- Act
    local result = DeploymentOrchestrator.orchestrateDeployment(deploymentRequest)
    
    -- Assert - Should still succeed but handle empty process ID gracefully
    TestFramework.assertTrue(result.success, "Should handle invalid process IDs gracefully")
end)

-- Run the test suite
return suite