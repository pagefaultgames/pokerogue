-- Unit tests for Backward Compatibility timestamp parameter integration
-- Validates timestamp parameter threading for legacy message adaptation

local TestFramework = require("tests.framework.test-framework-enhanced")
local BackwardCompatibility = require("game-logic.process-coordination.backward-compatibility")

-- Test suite for Backward Compatibility timestamp integration
local BackwardCompatibilityTimestampTest = TestFramework.createTestSuite("BackwardCompatibilityTimestampTest")

function BackwardCompatibilityTimestampTest.setUp()
    -- Initialize backward compatibility system
    BackwardCompatibility.initialize()
    
    -- Mock timestamp for consistent testing
    local mockTimestamp = 1640995200 -- 2022-01-01 00:00:00 UTC
    
    return {
        mockTimestamp = mockTimestamp,
        legacyBattleMessage = {
            action = "battle",
            pokemon = "pikachu",
            move = "thunderbolt",
            priority = "HIGH"
        },
        legacyShopMessage = {
            command = "shop-buy",
            item = "potion",
            quantity = 5,
            retryable = true
        },
        newFormatMessage = {
            correlation = { id = "corr-001", origin = "test", target = "battle" },
            auth = { processId = "test-process", token = "test-token" },
            operation = { type = "BATTLE_RESOLUTION" },
            payload = { data = "test" }
        }
    }
end

function BackwardCompatibilityTimestampTest.tearDown()
    -- Reset compatibility statistics
    BackwardCompatibility.compatibilityStats = {
        legacyMessagesProcessed = 0,
        adaptedMessages = 0,
        incompatibleMessages = 0,
        byOperationType = {}
    }
end

function BackwardCompatibilityTimestampTest.testAdaptLegacyMessageWithTimestamp()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Adapt legacy message with timestamp parameter
    local adaptedMessage = BackwardCompatibility.adaptLegacyMessage(
        testData.legacyBattleMessage,
        "legacy-process",
        "battle-process",
        testData.mockTimestamp
    )
    
    TestFramework.assertNotNil(adaptedMessage, "Legacy message adaptation should succeed with timestamp parameter")
    
    -- Verify timestamp integration in auth section
    TestFramework.assertEquals(adaptedMessage.auth.timestamp, testData.mockTimestamp, "Auth section should use provided timestamp")
    
    -- Verify timestamp integration in payload section
    TestFramework.assertEquals(adaptedMessage.payload.adaptedAt, testData.mockTimestamp, "Payload should contain adaptation timestamp")
    
    -- Verify operation type mapping
    TestFramework.assertEquals(adaptedMessage.operation.type, "BATTLE_RESOLUTION", "Legacy 'battle' should map to 'BATTLE_RESOLUTION'")
    
    -- Verify compatibility metadata
    TestFramework.assertTrue(adaptedMessage._compatibility.isAdapted, "Message should be marked as adapted")
    TestFramework.assertEquals(adaptedMessage._compatibility.adaptedFrom, "battle", "Adaptation source should be recorded")
end

function BackwardCompatibilityTimestampTest.testAdaptShopMessageWithTimestamp()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Adapt legacy shop message with timestamp
    local adaptedMessage = BackwardCompatibility.adaptLegacyMessage(
        testData.legacyShopMessage,
        "client-process",
        "shop-process", 
        testData.mockTimestamp
    )
    
    TestFramework.assertNotNil(adaptedMessage, "Legacy shop message should be adapted with timestamp")
    TestFramework.assertEquals(adaptedMessage.operation.type, "ITEM_PURCHASE", "Legacy 'shop-buy' should map to 'ITEM_PURCHASE'")
    TestFramework.assertEquals(adaptedMessage.auth.timestamp, testData.mockTimestamp, "Auth timestamp should match provided value")
    TestFramework.assertEquals(adaptedMessage.payload.adaptedAt, testData.mockTimestamp, "Adaptation timestamp should match provided value")
end

function BackwardCompatibilityTimestampTest.testAdaptResponseToLegacyWithTimestamp()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Create new format response
    local newFormatResponse = {
        success = true,
        payload = { result = "battle-complete", exp = 150 },
        correlation = { id = "corr-001" },
        targetProcessId = "battle-process"
    }
    
    -- Adapt response back to legacy format with timestamp
    local legacyResponse = BackwardCompatibility.adaptResponseToLegacy(
        newFormatResponse,
        testData.legacyBattleMessage,
        testData.mockTimestamp
    )
    
    TestFramework.assertNotNil(legacyResponse, "Response adaptation to legacy format should succeed")
    TestFramework.assertEquals(legacyResponse.timestamp, testData.mockTimestamp, "Legacy response should use provided timestamp")
    TestFramework.assertEquals(legacyResponse._adapted.adaptedAt, testData.mockTimestamp, "Response adaptation timestamp should match")
    TestFramework.assertTrue(legacyResponse.success, "Success flag should be preserved")
    TestFramework.assertEquals(legacyResponse.correlationId, "corr-001", "Correlation ID should be extracted")
end

function BackwardCompatibilityTimestampTest.testNewFormatMessagePassthrough()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Attempt to adapt already-new format message
    local result = BackwardCompatibility.adaptLegacyMessage(
        testData.newFormatMessage,
        "test-process",
        "target-process",
        testData.mockTimestamp
    )
    
    -- Should return original message unchanged
    TestFramework.assertEquals(result, testData.newFormatMessage, "New format message should pass through unchanged")
end

function BackwardCompatibilityTimestampTest.testTimestampParameterFallback()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Test with nil timestamp parameter (should fallback to 0)
    local adaptedMessage = BackwardCompatibility.adaptLegacyMessage(
        testData.legacyBattleMessage,
        "legacy-process",
        "battle-process",
        nil -- nil timestamp
    )
    
    TestFramework.assertNotNil(adaptedMessage, "Message adaptation should succeed with nil timestamp")
    TestFramework.assertEquals(adaptedMessage.auth.timestamp, 0, "Auth timestamp should fallback to 0")
    TestFramework.assertEquals(adaptedMessage.payload.adaptedAt, 0, "Adaptation timestamp should fallback to 0")
end

function BackwardCompatibilityTimestampTest.testIncompatibleMessageHandling()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Message with no identifiable operation type
    local incompatibleMessage = {
        data = "some data",
        value = 123
        -- No action, command, operation, or type field
    }
    
    local result, error = BackwardCompatibility.adaptLegacyMessage(
        incompatibleMessage,
        "test-process",
        "target-process",
        testData.mockTimestamp
    )
    
    TestFramework.assertNil(result, "Incompatible message should not be adapted")
    TestFramework.assertNotNil(error, "Error should be returned for incompatible message")
    TestFramework.assertStringContains(error, "Cannot determine operation type", "Error should indicate missing operation type")
end

function BackwardCompatibilityTimestampTest.testUnmappedOperationHandling()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Message with unsupported operation type
    local unmappedMessage = {
        action = "unknown-operation",
        data = "test data"
    }
    
    local result, error = BackwardCompatibility.adaptLegacyMessage(
        unmappedMessage,
        "test-process",
        "target-process",
        testData.mockTimestamp
    )
    
    TestFramework.assertNil(result, "Unmapped operation should not be adapted")
    TestFramework.assertNotNil(error, "Error should be returned for unmapped operation")
    TestFramework.assertStringContains(error, "No mapping found", "Error should indicate missing mapping")
end

function BackwardCompatibilityTimestampTest.testStatisticsTracking()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Get initial stats
    local initialStats = BackwardCompatibility.getCompatibilityStats()
    local initialProcessed = initialStats.legacyMessagesProcessed
    local initialAdapted = initialStats.adaptedMessages
    
    -- Adapt a message
    BackwardCompatibility.adaptLegacyMessage(
        testData.legacyBattleMessage,
        "test-process",
        "battle-process",
        testData.mockTimestamp
    )
    
    -- Check updated stats
    local updatedStats = BackwardCompatibility.getCompatibilityStats()
    TestFramework.assertEquals(updatedStats.legacyMessagesProcessed, initialProcessed + 1, "Processed count should increment")
    TestFramework.assertEquals(updatedStats.adaptedMessages, initialAdapted + 1, "Adapted count should increment")
end

function BackwardCompatibilityTimestampTest.testCorrelationIdGeneration()
    local testData = BackwardCompatibilityTimestampTest.setUp()
    
    -- Adapt message and verify correlation ID is generated
    local adaptedMessage = BackwardCompatibility.adaptLegacyMessage(
        testData.legacyBattleMessage,
        "legacy-process",
        "battle-process",
        testData.mockTimestamp
    )
    
    TestFramework.assertNotNil(adaptedMessage.correlation.id, "Correlation ID should be generated for adapted message")
    TestFramework.assertEquals(adaptedMessage.correlation.origin, "legacy-process", "Correlation origin should match source process")
    TestFramework.assertEquals(adaptedMessage.correlation.target, "battle-process", "Correlation target should match target process")
end

-- Register test cases
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testAdaptLegacyMessageWithTimestamp)
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testAdaptShopMessageWithTimestamp)
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testAdaptResponseToLegacyWithTimestamp)
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testNewFormatMessagePassthrough)
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testTimestampParameterFallback)
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testIncompatibleMessageHandling)
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testUnmappedOperationHandling)
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testStatisticsTracking)
TestFramework.registerTestCase(BackwardCompatibilityTimestampTest.testCorrelationIdGeneration)

return BackwardCompatibilityTimestampTest