-- Unit tests for Message Correlation System
-- Tests correlation ID generation, tracking, and chain management

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")

local tests = {}

-- Test correlation ID generation
function tests.testCorrelationIdGeneration()
    MessageCorrelator.initialize()
    
    local id1 = MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
    local id2 = MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.INTER_PROCESS)
    local id3 = MessageCorrelator.generateCorrelationId(MessageCorrelator.CORRELATION_TYPES.CLIENT_REQUEST)
    
    assert(type(id1) == "string", "Correlation ID should be a string")
    assert(type(id2) == "string", "Correlation ID should be a string")
    assert(type(id3) == "string", "Correlation ID should be a string")
    
    assert(string.sub(id1, 1, 4) == "ipc_", "Inter-process correlation ID should have ipc_ prefix")
    assert(string.sub(id2, 1, 4) == "ipc_", "Inter-process correlation ID should have ipc_ prefix")
    assert(string.sub(id3, 1, 4) == "cor_", "Client request correlation ID should have cor_ prefix")
    
    assert(id1 ~= id2, "Correlation IDs should be unique")
    assert(id1 ~= id3, "Correlation IDs should be unique")
    assert(id2 ~= id3, "Correlation IDs should be unique")
end

-- Test correlation creation
function tests.testCorrelationCreation()
    MessageCorrelator.initialize()
    
    local originProcess = "process-123"
    local targetProcess = "process-456"
    local messageType = "BATTLE_RESOLUTION"
    
    local correlationId = MessageCorrelator.createCorrelation(originProcess, targetProcess, messageType)
    
    assert(type(correlationId) == "string", "Should return correlation ID")
    assert(string.sub(correlationId, 1, 4) == "ipc_", "Should generate inter-process correlation ID")
    
    local correlation = MessageCorrelator.getCorrelation(correlationId)
    assert(correlation ~= nil, "Should be able to retrieve correlation")
    assert(correlation.id == correlationId, "Correlation ID should match")
    assert(correlation.origin == originProcess, "Origin process should match")
    assert(correlation.target == targetProcess, "Target process should match") 
    assert(correlation.messageType == messageType, "Message type should match")
    assert(correlation.status == MessageCorrelator.MESSAGE_STATUS.PENDING, "Initial status should be pending")
    assert(correlation.depth == 0, "Root correlation should have depth 0")
end

-- Test nested correlation creation
function tests.testNestedCorrelationCreation()
    MessageCorrelator.initialize()
    
    -- Create parent correlation
    local parentId = MessageCorrelator.createCorrelation("process-1", "process-2", "POKEMON_UPDATE")
    
    -- Create child correlation
    local childId = MessageCorrelator.createCorrelation("process-2", "process-3", "STAT_CALCULATION", parentId)
    
    local parentCorrelation = MessageCorrelator.getCorrelation(parentId)
    local childCorrelation = MessageCorrelator.getCorrelation(childId)
    
    assert(parentCorrelation ~= nil, "Parent correlation should exist")
    assert(childCorrelation ~= nil, "Child correlation should exist")
    
    assert(childCorrelation.parent == parentId, "Child should reference parent")
    assert(childCorrelation.depth == 1, "Child should have depth 1")
    
    assert(#parentCorrelation.chain == 1, "Parent should have one child in chain")
    assert(parentCorrelation.chain[1] == childId, "Parent chain should contain child ID")
end

-- Test correlation status updates
function tests.testCorrelationStatusUpdates()
    MessageCorrelator.initialize()
    
    local correlationId = MessageCorrelator.createCorrelation("process-1", "process-2", "BATTLE_RESOLUTION")
    
    -- Update to processing
    local success = MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
    assert(success == true, "Status update should succeed")
    
    local correlation = MessageCorrelator.getCorrelation(correlationId)
    assert(correlation.status == MessageCorrelator.MESSAGE_STATUS.PROCESSING, "Status should be updated")
    
    -- Update to completed (should move to history)
    success = MessageCorrelator.updateCorrelationStatus(correlationId, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
    assert(success == true, "Status update should succeed")
    
    assert(MessageCorrelator.activeCorrelations[correlationId] == nil, "Should be removed from active correlations")
    assert(MessageCorrelator.correlationHistory[correlationId] ~= nil, "Should be moved to history")
end

-- Test correlation status updates with errors
function tests.testCorrelationStatusWithError()
    MessageCorrelator.initialize()
    
    local correlationId = MessageCorrelator.createCorrelation("process-1", "process-2", "SHOP_TRANSACTION")
    local errorMessage = "Insufficient funds"
    
    local success = MessageCorrelator.updateCorrelationStatus(
        correlationId, 
        MessageCorrelator.MESSAGE_STATUS.FAILED, 
        errorMessage
    )
    
    assert(success == true, "Status update should succeed")
    
    local correlation = MessageCorrelator.getCorrelation(correlationId)
    assert(correlation.status == MessageCorrelator.MESSAGE_STATUS.FAILED, "Status should be failed")
    assert(correlation.error == errorMessage, "Error message should be stored")
end

-- Test process correlation lookup
function tests.testProcessCorrelationLookup()
    MessageCorrelator.initialize()
    
    local processId = "process-123"
    
    local id1 = MessageCorrelator.createCorrelation(processId, "process-456", "MESSAGE_1")
    local id2 = MessageCorrelator.createCorrelation("process-789", processId, "MESSAGE_2")
    local id3 = MessageCorrelator.createCorrelation("process-abc", "process-def", "MESSAGE_3")
    
    local processCorrelations = MessageCorrelator.getProcessCorrelations(processId)
    
    assert(processCorrelations[id1] ~= nil, "Should include correlation where process is origin")
    assert(processCorrelations[id2] ~= nil, "Should include correlation where process is target")
    assert(processCorrelations[id3] == nil, "Should not include unrelated correlation")
    
    local correlationCount = 0
    for _ in pairs(processCorrelations) do
        correlationCount = correlationCount + 1
    end
    assert(correlationCount == 2, "Should have exactly 2 correlations for the process")
end

-- Test correlation chain retrieval
function tests.testCorrelationChainRetrieval()
    MessageCorrelator.initialize()
    
    -- Create correlation chain: parent -> child1 -> grandchild1, child2
    local parentId = MessageCorrelator.createCorrelation("process-1", "process-2", "PARENT_MESSAGE")
    local child1Id = MessageCorrelator.createCorrelation("process-2", "process-3", "CHILD1_MESSAGE", parentId)
    local child2Id = MessageCorrelator.createCorrelation("process-2", "process-4", "CHILD2_MESSAGE", parentId)
    local grandchild1Id = MessageCorrelator.createCorrelation("process-3", "process-5", "GRANDCHILD1_MESSAGE", child1Id)
    
    local chain = MessageCorrelator.getCorrelationChain(child1Id)
    
    assert(type(chain) == "table", "Chain should be a table")
    assert(#chain >= 3, "Chain should contain at least parent, child1, and grandchild1")
    
    -- Find the correlations in the chain
    local foundParent, foundChild1, foundGrandchild1 = false, false, false
    for _, correlation in ipairs(chain) do
        if correlation.id == parentId then
            foundParent = true
        elseif correlation.id == child1Id then
            foundChild1 = true
        elseif correlation.id == grandchild1Id then
            foundGrandchild1 = true
        end
    end
    
    assert(foundParent, "Chain should contain parent correlation")
    assert(foundChild1, "Chain should contain child1 correlation")
    assert(foundGrandchild1, "Chain should contain grandchild1 correlation")
end

-- Test correlation metadata creation and validation
function tests.testCorrelationMetadata()
    local metadata = MessageCorrelator.createCorrelationMetadata(
        "test-correlation-id", 
        "origin-process", 
        "target-process", 
        "parent-correlation-id"
    )
    
    assert(type(metadata) == "table", "Metadata should be a table")
    assert(metadata.id == "test-correlation-id", "ID should match")
    assert(metadata.origin == "origin-process", "Origin should match")
    assert(metadata.target == "target-process", "Target should match")
    assert(metadata.parent == "parent-correlation-id", "Parent should match")
    
    -- Test validation
    local isValid, errorMsg = MessageCorrelator.validateCorrelationMetadata(metadata)
    assert(isValid == true, "Valid metadata should pass validation")
    assert(errorMsg == nil, "Valid metadata should have no error message")
    
    -- Test invalid metadata
    local invalidMetadata = { id = "test-id" } -- missing required fields
    isValid, errorMsg = MessageCorrelator.validateCorrelationMetadata(invalidMetadata)
    assert(isValid == false, "Invalid metadata should fail validation")
    assert(type(errorMsg) == "string", "Should return error message for invalid metadata")
end

-- Test statistics
function tests.testCorrelationStatistics()
    MessageCorrelator.initialize()
    
    -- Create some correlations with different statuses
    local id1 = MessageCorrelator.createCorrelation("process-1", "process-2", "MESSAGE_1")
    local id2 = MessageCorrelator.createCorrelation("process-2", "process-3", "MESSAGE_2")
    local id3 = MessageCorrelator.createCorrelation("process-3", "process-4", "MESSAGE_3")
    
    -- Update statuses
    MessageCorrelator.updateCorrelationStatus(id1, MessageCorrelator.MESSAGE_STATUS.PROCESSING)
    MessageCorrelator.updateCorrelationStatus(id2, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
    MessageCorrelator.updateCorrelationStatus(id3, MessageCorrelator.MESSAGE_STATUS.FAILED, "Test error")
    
    local stats = MessageCorrelator.getStatistics()
    
    assert(type(stats) == "table", "Statistics should be a table")
    assert(type(stats.activeCorrelations) == "number", "Active correlations should be a number")
    assert(type(stats.historyCorrelations) == "number", "History correlations should be a number")
    assert(type(stats.totalCorrelations) == "number", "Total correlations should be a number")
    assert(type(stats.statusBreakdown) == "table", "Status breakdown should be a table")
    
    assert(stats.totalCorrelations == 3, "Should have 3 total correlations")
    assert(stats.activeCorrelations == 1, "Should have 1 active correlation")
    assert(stats.historyCorrelations == 2, "Should have 2 history correlations")
end

-- Test history cleanup
function tests.testHistoryCleanup()
    MessageCorrelator.initialize()
    
    -- Set a small max history size for testing
    local originalMaxSize = MessageCorrelator.maxHistorySize
    MessageCorrelator.maxHistorySize = 5
    
    -- Create and complete more correlations than the max size
    for i = 1, 7 do
        local id = MessageCorrelator.createCorrelation("process-1", "process-2", "MESSAGE_" .. i)
        MessageCorrelator.updateCorrelationStatus(id, MessageCorrelator.MESSAGE_STATUS.COMPLETED)
    end
    
    local stats = MessageCorrelator.getStatistics()
    assert(stats.historyCorrelations <= MessageCorrelator.maxHistorySize, 
           "History should not exceed max size")
    
    -- Restore original max size
    MessageCorrelator.maxHistorySize = originalMaxSize
end

-- Test invalid correlation updates
function tests.testInvalidCorrelationUpdates()
    MessageCorrelator.initialize()
    
    -- Try to update non-existent correlation
    local success, error = MessageCorrelator.updateCorrelationStatus("non-existent-id", MessageCorrelator.MESSAGE_STATUS.COMPLETED)
    assert(success == false, "Should fail for non-existent correlation")
    assert(type(error) == "string", "Should return error message")
end

-- Run all tests
function tests.runAll()
    print("[MessageCorrelator] Running unit tests...")
    
    local testFunctions = {
        "testCorrelationIdGeneration",
        "testCorrelationCreation",
        "testNestedCorrelationCreation",
        "testCorrelationStatusUpdates",
        "testCorrelationStatusWithError",
        "testProcessCorrelationLookup",
        "testCorrelationChainRetrieval",
        "testCorrelationMetadata",
        "testCorrelationStatistics",
        "testHistoryCleanup",
        "testInvalidCorrelationUpdates"
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
    
    print(string.format("[MessageCorrelator] Tests completed: %d/%d passed", passedTests, totalTests))
    
    if passedTests == totalTests then
        print("[MessageCorrelator] All tests passed!")
        return true
    else
        error(string.format("MessageCorrelator tests failed: %d/%d passed", passedTests, totalTests))
    end
end

-- Run tests if this file is executed directly
if debug.getinfo(2, "S") == nil then
    tests.runAll()
end

return tests