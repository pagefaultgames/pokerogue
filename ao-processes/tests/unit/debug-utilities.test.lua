-- Unit Tests for Debug Utilities Components
-- Tests all state inspection and debugging tools

-- Load components
local StateInspector = require("development-tools/debugging/state-inspector")
local ConsistencyValidator = require("development-tools/debugging/consistency-validator")
local ExecutionTracer = require("development-tools/debugging/execution-tracer")
local SnapshotManager = require("development-tools/debugging/snapshot-manager")
local AOEmulator = require("development-tools/ao-local-setup/ao-emulator").AOEmulator

-- Test framework setup
local function assertEquals(expected, actual, message)
    message = message or "Assertion failed"
    if expected ~= actual then
        error(message .. ": expected " .. tostring(expected) .. ", got " .. tostring(actual))
    end
end

local function assertNotNil(value, message)
    message = message or "Value should not be nil"
    if value == nil then
        error(message)
    end
end

local function assertTrue(condition, message)
    message = message or "Condition should be true"
    if not condition then
        error(message)
    end
end

local function assertGreaterThan(value, threshold, message)
    message = message or ("Value should be greater than " .. tostring(threshold))
    if value <= threshold then
        error(message .. ": " .. tostring(value) .. " <= " .. tostring(threshold))
    end
end

-- State Inspector Tests
local function testStateInspectorCreation()
    print("Testing State Inspector creation...")
    
    local emulator = AOEmulator.new({processId = "inspector-test"})
    local inspector = StateInspector.new(emulator)
    
    assertNotNil(inspector, "Inspector should be created")
    assertNotNil(inspector.emulator, "Inspector should have emulator reference")
    assertNotNil(inspector.inspectionHistory, "History should be initialized")
    assertNotNil(inspector.watchedKeys, "Watched keys should be initialized")
    
    print("✅ State Inspector creation test passed")
    return true
end

local function testStateInspection()
    print("Testing state inspection...")
    
    local emulator = AOEmulator.new({processId = "inspection-test"})
    local inspector = StateInspector.new(emulator)
    
    -- Set up test state
    emulator.state.players = {
        player1 = {
            id = "player1",
            level = 10,
            currency = 500
        }
    }
    emulator.state.global = {
        gameVersion = "1.0.0"
    }
    
    -- Perform inspection
    local inspection = inspector:inspectState("test_inspection")
    
    assertNotNil(inspection, "Inspection should return result")
    assertEquals("test_inspection", inspection.label, "Label should be set")
    assertNotNil(inspection.timestamp, "Timestamp should be set")
    assertNotNil(inspection.state, "State should be captured")
    assertNotNil(inspection.metadata, "Metadata should be generated")
    
    assertGreaterThan(inspection.metadata.stateSize, 0, "State size should be calculated")
    assertGreaterThan(inspection.metadata.keyCount, 0, "Key count should be calculated")
    
    print("✅ State inspection test passed")
    return true
end

local function testStateWatching()
    print("Testing state watching...")
    
    local emulator = AOEmulator.new({processId = "watch-test"})
    local inspector = StateInspector.new(emulator)
    
    -- Set initial state
    emulator.state.watchedValue = 100
    
    -- Set up watcher
    local changeDetected = false
    local watcher = inspector:watchState("watchedValue", function(change)
        changeDetected = true
    end)
    
    assertNotNil(watcher, "Watcher should be created")
    assertEquals(100, watcher.lastValue, "Initial value should be recorded")
    
    -- Change the value
    emulator.state.watchedValue = 200
    
    -- Check for changes
    local changes = inspector:checkWatchers()
    
    assertEquals(1, #changes, "Should detect one change")
    assertTrue(changeDetected, "Callback should be triggered")
    assertEquals(100, changes[1].oldValue, "Old value should be recorded")
    assertEquals(200, changes[1].newValue, "New value should be recorded")
    
    print("✅ State watching test passed")
    return true
end

local function testStateStructureAnalysis()
    print("Testing state structure analysis...")
    
    local emulator = AOEmulator.new({processId = "analysis-test"})
    local inspector = StateInspector.new(emulator)
    
    -- Set up complex state
    emulator.state.players = {
        player1 = {
            stats = {level = 10, exp = 1500},
            items = {"sword", "shield"}
        },
        player2 = {
            stats = {level = 15, exp = 3000},
            items = {"bow", "arrows", "potion"}
        }
    }
    
    local analysis = inspector:analyzeStateStructure()
    
    assertNotNil(analysis, "Analysis should be generated")
    assertNotNil(analysis.structure, "Structure map should be generated")
    assertNotNil(analysis.summary, "Summary should be generated")
    
    assertGreaterThan(analysis.summary.totalKeys, 0, "Should count keys")
    assertGreaterThan(analysis.summary.maxDepth, 0, "Should calculate depth")
    
    print("✅ State structure analysis test passed")
    return true
end

-- Consistency Validator Tests
local function testConsistencyValidatorCreation()
    print("Testing Consistency Validator creation...")
    
    local emulator = AOEmulator.new({processId = "validator-test"})
    local validator = ConsistencyValidator.new(emulator)
    
    assertNotNil(validator, "Validator should be created")
    assertNotNil(validator.emulator, "Validator should have emulator reference")
    assertNotNil(validator.rules, "Rules should be initialized")
    
    -- Check default rules are loaded
    assertTrue(next(validator.rules) ~= nil, "Default rules should be loaded")
    
    print("✅ Consistency Validator creation test passed")
    return true
end

local function testCustomValidationRules()
    print("Testing custom validation rules...")
    
    local emulator = AOEmulator.new({processId = "custom-rule-test"})
    local validator = ConsistencyValidator.new(emulator)
    
    -- Add custom rule
    local rule = validator:addRule("test_rule", {
        description = "Test validation rule",
        category = "test",
        severity = "warning",
        condition = function(state)
            return state.testValue == 42
        end
    })
    
    assertNotNil(rule, "Rule should be created")
    assertEquals("test_rule", rule.name, "Rule name should be set")
    assertEquals("Test validation rule", rule.description, "Description should be set")
    
    -- Test with failing condition
    emulator.state.testValue = 40
    local validation = validator:validateState()
    
    assertTrue(validation.summary.failed > 0 or validation.summary.warnings > 0, "Rule should detect violation")
    
    -- Test with passing condition  
    emulator.state.testValue = 42
    validation = validator:validateState()
    
    -- Find our test rule result
    local testRuleResult = nil
    for _, result in ipairs(validation.results) do
        if result.rule == "test_rule" then
            testRuleResult = result
            break
        end
    end
    
    assertNotNil(testRuleResult, "Test rule should have been executed")
    assertTrue(testRuleResult.passed, "Test rule should pass with correct value")
    
    print("✅ Custom validation rules test passed")
    return true
end

local function testStateValidation()
    print("Testing state validation...")
    
    local emulator = AOEmulator.new({processId = "validation-test"})
    local validator = ConsistencyValidator.new(emulator)
    
    -- Set up valid state
    emulator.state.players = {
        player1 = {
            id = "player1",
            team = {
                {
                    species = "Pikachu",
                    level = 25,
                    hp = 80,
                    maxHp = 80
                }
            },
            currency = 1000
        }
    }
    
    local validation = validator:validateState()
    
    assertNotNil(validation, "Validation should return result")
    assertNotNil(validation.summary, "Summary should be generated")
    assertGreaterThan(validation.summary.total_rules, 0, "Should execute rules")
    
    -- Most rules should pass with valid state
    assertTrue(validation.summary.passed > 0, "Some rules should pass")
    
    print("✅ State validation test passed")
    return true
end

-- Execution Tracer Tests
local function testExecutionTracerCreation()
    print("Testing Execution Tracer creation...")
    
    local emulator = AOEmulator.new({processId = "tracer-test"})
    local tracer = ExecutionTracer.new(emulator)
    
    assertNotNil(tracer, "Tracer should be created")
    assertNotNil(tracer.emulator, "Tracer should have emulator reference")
    assertNotNil(tracer.traces, "Traces should be initialized")
    assertEquals(false, tracer.enabled, "Tracing should be disabled initially")
    
    print("✅ Execution Tracer creation test passed")
    return true
end

local function testTracingLifecycle()
    print("Testing tracing lifecycle...")
    
    local emulator = AOEmulator.new({processId = "lifecycle-test"})
    local tracer = ExecutionTracer.new(emulator)
    
    -- Start tracing
    local sessionId = tracer:startTracing()
    
    assertNotNil(sessionId, "Session ID should be returned")
    assertTrue(tracer:isTracing(), "Tracing should be enabled")
    assertNotNil(tracer.traceSession, "Trace session should be created")
    
    -- Stop tracing
    local session = tracer:stopTracing()
    
    assertNotNil(session, "Session should be returned")
    assertTrue(not tracer:isTracing(), "Tracing should be disabled")
    assertNotNil(session.duration, "Duration should be calculated")
    
    print("✅ Tracing lifecycle test passed")
    return true
end

local function testMessageTracing()
    print("Testing message tracing...")
    
    local emulator = AOEmulator.new({processId = "msg-trace-test"})
    local tracer = ExecutionTracer.new(emulator)
    
    -- Start tracing
    tracer:startTracing()
    
    -- Create test message and execution result
    local testMessage = {
        From = "test-user",
        Action = "Test-Action",
        Data = "test data"
    }
    
    local executionResult = {
        results = {
            {
                handler = "TestHandler",
                success = true,
                result = "test result"
            }
        }
    }
    
    -- Trace message
    local messageTrace = tracer:traceMessage(testMessage, executionResult)
    
    assertNotNil(messageTrace, "Message trace should be created")
    assertNotNil(messageTrace.id, "Trace should have ID")
    assertEquals("Test-Action", messageTrace.message.Action, "Message should be captured")
    assertEquals(1, messageTrace.metadata.handlerCount, "Handler count should be tracked")
    assertEquals(1, messageTrace.metadata.successfulHandlers, "Successful handlers should be counted")
    
    print("✅ Message tracing test passed")
    return true
end

-- Snapshot Manager Tests
local function testSnapshotManagerCreation()
    print("Testing Snapshot Manager creation...")
    
    local emulator = AOEmulator.new({processId = "snapshot-test"})
    local manager = SnapshotManager.new(emulator)
    
    assertNotNil(manager, "Manager should be created")
    assertNotNil(manager.emulator, "Manager should have emulator reference")
    assertNotNil(manager.snapshots, "Snapshots should be initialized")
    assertNotNil(manager.metadata, "Metadata should be initialized")
    
    print("✅ Snapshot Manager creation test passed")
    return true
end

local function testSnapshotCreation()
    print("Testing snapshot creation...")
    
    local emulator = AOEmulator.new({processId = "snapshot-create-test"})
    local manager = SnapshotManager.new(emulator)
    
    -- Set up test state
    emulator.state.testData = {
        value1 = "test",
        value2 = 123,
        nested = {item = "nested"}
    }
    
    -- Create snapshot
    local snapshot = manager:createSnapshot("test_snapshot")
    
    assertNotNil(snapshot, "Snapshot should be created")
    assertNotNil(snapshot.id, "Snapshot should have ID")
    assertEquals("test_snapshot", snapshot.label, "Label should be set")
    assertNotNil(snapshot.timestamp, "Timestamp should be set")
    assertNotNil(snapshot.state, "State should be captured")
    assertNotNil(snapshot.metadata, "Metadata should be generated")
    
    assertEquals(1, #manager.snapshots, "Snapshot should be stored")
    
    print("✅ Snapshot creation test passed")
    return true
end

local function testSnapshotComparison()
    print("Testing snapshot comparison...")
    
    local emulator = AOEmulator.new({processId = "snapshot-compare-test"})
    local manager = SnapshotManager.new(emulator)
    
    -- Create first snapshot
    emulator.state.value = 100
    emulator.state.data = {item = "original"}
    local snapshot1 = manager:createSnapshot("snapshot_1")
    
    -- Modify state and create second snapshot
    emulator.state.value = 200
    emulator.state.data.item = "modified"
    emulator.state.newField = "added"
    local snapshot2 = manager:createSnapshot("snapshot_2")
    
    -- Compare snapshots
    local comparison = manager:compareSnapshots(snapshot1.id, snapshot2.id)
    
    assertNotNil(comparison, "Comparison should be generated")
    assertNotNil(comparison.differences, "Differences should be found")
    assertNotNil(comparison.summary, "Summary should be generated")
    
    assertGreaterThan(comparison.summary.totalChanges, 0, "Should detect changes")
    assertTrue(comparison.summary.added > 0 or comparison.summary.modified > 0, "Should detect additions or modifications")
    
    print("✅ Snapshot comparison test passed")
    return true
end

-- Integration Tests
local function testDebugUtilitiesIntegration()
    print("Testing debug utilities integration...")
    
    local emulator = AOEmulator.new({processId = "integration-test"})
    
    -- Create all debug utilities
    local inspector = StateInspector.new(emulator)
    local validator = ConsistencyValidator.new(emulator)
    local tracer = ExecutionTracer.new(emulator)
    local snapshotManager = SnapshotManager.new(emulator)
    
    -- Set up complex state
    emulator.state.players = {
        player1 = {
            id = "player1",
            level = 10,
            team = {
                {species = "Pikachu", hp = 100, maxHp = 100, level = 25}
            }
        }
    }
    
    -- Take initial snapshot
    local initialSnapshot = snapshotManager:createSnapshot("initial")
    
    -- Start tracing
    tracer:startTracing()
    
    -- Perform state inspection
    local inspection = inspector:inspectState("integration_test")
    
    -- Validate state
    local validation = validator:validateState()
    
    -- Modify state
    emulator.state.players.player1.level = 15
    
    -- Take second snapshot
    local modifiedSnapshot = snapshotManager:createSnapshot("modified")
    
    -- Compare snapshots
    local comparison = snapshotManager:compareSnapshots(initialSnapshot.id, modifiedSnapshot.id)
    
    -- Stop tracing
    local session = tracer:stopTracing()
    
    -- Verify all components worked
    assertNotNil(inspection, "Inspector should work")
    assertNotNil(validation, "Validator should work")
    assertNotNil(comparison, "Snapshot comparison should work")
    assertNotNil(session, "Tracer should work")
    
    assertTrue(comparison.summary.totalChanges > 0, "Should detect state changes")
    
    print("✅ Debug utilities integration test passed")
    return true
end

-- Performance Tests
local function testDebugUtilitiesPerformance()
    print("Testing debug utilities performance...")
    
    local emulator = AOEmulator.new({processId = "performance-test"})
    
    -- Create large state
    emulator.state.largeData = {}
    for i = 1, 100 do
        emulator.state.largeData["item" .. i] = {
            id = i,
            name = "Item " .. i,
            properties = {
                value = i * 10,
                rarity = i % 5,
                category = "test"
            }
        }
    end
    
    -- Test inspector performance
    local inspector = StateInspector.new(emulator)
    local startTime = os.clock()
    local inspection = inspector:inspectState("performance_test")
    local inspectionTime = os.clock() - startTime
    
    assertNotNil(inspection, "Inspection should complete")
    assertTrue(inspectionTime < 1.0, "Inspection should be fast")
    
    -- Test snapshot performance
    local snapshotManager = SnapshotManager.new(emulator)
    startTime = os.clock()
    local snapshot = snapshotManager:createSnapshot("performance_snapshot")
    local snapshotTime = os.clock() - startTime
    
    assertNotNil(snapshot, "Snapshot should be created")
    assertTrue(snapshotTime < 1.0, "Snapshot creation should be fast")
    
    print(string.format("  Inspection time: %.3fs", inspectionTime))
    print(string.format("  Snapshot time: %.3fs", snapshotTime))
    
    print("✅ Debug utilities performance test passed")
    return true
end

-- Run all tests
local function runTests()
    print("🧪 Running Debug Utilities Component Tests")
    print("==========================================")
    
    local tests = {
        testStateInspectorCreation,
        testStateInspection,
        testStateWatching,
        testStateStructureAnalysis,
        testConsistencyValidatorCreation,
        testCustomValidationRules,
        testStateValidation,
        testExecutionTracerCreation,
        testTracingLifecycle,
        testMessageTracing,
        testSnapshotManagerCreation,
        testSnapshotCreation,
        testSnapshotComparison,
        testDebugUtilitiesIntegration,
        testDebugUtilitiesPerformance
    }
    
    local passed = 0
    local failed = 0
    
    for i, test in ipairs(tests) do
        print("")
        local success, err = pcall(test)
        
        if success then
            passed = passed + 1
        else
            failed = failed + 1
            print("❌ Test " .. i .. " failed: " .. tostring(err))
        end
    end
    
    print("")
    print("📊 Test Results:")
    print("================")
    print("Passed: " .. passed)
    print("Failed: " .. failed)
    print("Total: " .. (passed + failed))
    
    if failed == 0 then
        print("")
        print("🎉 All Debug Utilities tests passed!")
        return true
    else
        print("")
        print("❌ Some tests failed. Please review the output above.")
        return false
    end
end

-- Execute tests
return runTests()