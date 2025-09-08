-- Unit tests for Message Router
-- Tests message routing, load balancing, and route management

local MessageRouter = require("game-logic.process-coordination.message-router")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

local tests = {}

-- Test router initialization
function tests.testRouterInitialization()
    MessageRouter.initialize()
    
    local routes = MessageRouter.getAllRoutes()
    assert(type(routes) == "table", "Routes should be a table")
    
    local stats = MessageRouter.getRoutingStatistics()
    assert(stats.totalRoutes == 0, "Initial total routes should be 0")
    assert(stats.successfulRoutes == 0, "Initial successful routes should be 0")
    assert(stats.failedRoutes == 0, "Initial failed routes should be 0")
end

-- Test basic routing
function tests.testBasicRouting()
    MessageRouter.initialize()
    ProcessAuthenticator.initialize()
    
    -- Register a test process
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    ProcessAuthenticator.registerProcess("battle-process-1", "battle", walletAddress, {"battle-resolution"})
    
    -- Test routing for battle operation
    local routingContext = MessageRouter.routeMessage(
        MessageRouter.OPERATION_TYPES.BATTLE_RESOLUTION, 
        {testData = "test"}
    )
    
    assert(routingContext ~= nil, "Should successfully route battle operation")
    assert(routingContext.operationType == MessageRouter.OPERATION_TYPES.BATTLE_RESOLUTION, "Operation type should match")
    assert(routingContext.targetProcessId == "battle-process-1", "Should route to registered battle process")
end

-- Test route validation
function tests.testRouteValidation()
    MessageRouter.initialize() 
    ProcessAuthenticator.initialize()
    
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    ProcessAuthenticator.registerProcess("battle-process-1", "battle", walletAddress, {"battle-resolution"})
    
    -- Test valid routing
    local isValid = MessageRouter.validateRouting(
        MessageRouter.OPERATION_TYPES.BATTLE_RESOLUTION,
        "source-process",
        "battle-process-1"
    )
    assert(isValid == true, "Valid routing should pass validation")
    
    -- Test invalid operation
    isValid = MessageRouter.validateRouting("INVALID_OPERATION", "source-process", "battle-process-1")
    assert(isValid == false, "Invalid operation should fail validation")
end

-- Test statistics tracking
function tests.testStatisticsTracking()
    MessageRouter.initialize()
    ProcessAuthenticator.initialize()
    
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    ProcessAuthenticator.registerProcess("battle-process-1", "battle", walletAddress, {"battle-resolution"})
    
    -- Route a few messages
    MessageRouter.routeMessage(MessageRouter.OPERATION_TYPES.BATTLE_RESOLUTION, {})
    MessageRouter.routeMessage(MessageRouter.OPERATION_TYPES.BATTLE_START, {})
    
    local stats = MessageRouter.getRoutingStatistics()
    assert(stats.totalRoutes == 2, "Should track total routes")
    assert(stats.successfulRoutes == 2, "Should track successful routes")
    assert(stats.successRate > 0, "Should calculate success rate")
end

-- Run all tests
function tests.runAll()
    print("[MessageRouter] Running unit tests...")
    
    local testFunctions = {
        "testRouterInitialization",
        "testBasicRouting", 
        "testRouteValidation",
        "testStatisticsTracking"
    }
    
    local passedTests = 0
    local totalTests = #testFunctions
    
    for _, testName in ipairs(testFunctions) do
        local success, errorMsg = pcall(tests[testName])
        if success then
            print(string.format("✓ %s", testName))
            passedTests = passedTests + 1
        else
            print(string.format("✗ %s: %s", testName, errorMsg))
        end
    end
    
    print(string.format("[MessageRouter] Tests completed: %d/%d passed", passedTests, totalTests))
    
    if passedTests == totalTests then
        print("[MessageRouter] All tests passed!")
        return true
    else
        error(string.format("MessageRouter tests failed: %d/%d passed", passedTests, totalTests))
    end
end

-- Run tests if this file is executed directly
if debug.getinfo(2, "S") == nil then
    tests.runAll()
end

return tests