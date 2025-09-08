-- Unit Tests for Backward Compatibility Layer
-- Tests legacy message format adaptation and compatibility shims

package.path = package.path .. ";../../../?.lua"

local BackwardCompatibility = require("game-logic.process-coordination.backward-compatibility")

-- Simple test framework
local tests = {}
local totalTests = 0
local passedTests = 0

local function assert(condition, message)
    totalTests = totalTests + 1
    if condition then
        passedTests = passedTests + 1
        print("✓ " .. (message or "Test passed"))
    else
        print("✗ " .. (message or "Test failed"))
    end
end

-- Test: Legacy message detection
function tests.testLegacyMessageDetection()
    print("\n=== Testing Legacy Message Detection ===")
    
    -- Test new format message (should not be detected as legacy)
    local newFormatMessage = {
        correlation = { id = "test-123" },
        auth = { processId = "test-process" },
        operation = { type = "BATTLE_RESOLUTION" },
        payload = { data = "test" }
    }
    assert(not BackwardCompatibility.isLegacyMessage(newFormatMessage), 
           "New format message should not be detected as legacy")
    
    -- Test legacy format messages (should be detected as legacy)
    local legacyActionMessage = { action = "battle", data = "test" }
    assert(BackwardCompatibility.isLegacyMessage(legacyActionMessage),
           "Legacy action message should be detected as legacy")
           
    local legacyCommandMessage = { command = "save", gameState = {} }
    assert(BackwardCompatibility.isLegacyMessage(legacyCommandMessage),
           "Legacy command message should be detected as legacy")
    
    local legacyOperationMessage = { operation = "shop-buy", item = "potion" }
    assert(BackwardCompatibility.isLegacyMessage(legacyOperationMessage),
           "Legacy operation message should be detected as legacy")
           
    local legacyTypeMessage = { type = "admin", request = "info" }
    assert(BackwardCompatibility.isLegacyMessage(legacyTypeMessage),
           "Legacy type message should be detected as legacy")
    
    -- Test non-legacy messages
    assert(not BackwardCompatibility.isLegacyMessage({}),
           "Empty message should not be detected as legacy")
    assert(not BackwardCompatibility.isLegacyMessage("string"),
           "String message should not be detected as legacy")
    assert(not BackwardCompatibility.isLegacyMessage(nil),
           "Nil message should not be detected as legacy")
end

-- Test: Legacy message adaptation
function tests.testLegacyMessageAdaptation()
    print("\n=== Testing Legacy Message Adaptation ===")
    
    -- Test basic legacy message adaptation
    local legacyMessage = {
        action = "battle",
        pokemonId = "pikachu-123",
        moveId = "thunderbolt",
        priority = "HIGH"
    }
    
    local adaptedMessage = BackwardCompatibility.adaptLegacyMessage(legacyMessage, "legacy-client", "coordinator")
    assert(adaptedMessage ~= nil, "Legacy message should be successfully adapted")
    assert(adaptedMessage.operation.type == "BATTLE_RESOLUTION", "Legacy 'battle' should map to 'BATTLE_RESOLUTION'")
    assert(adaptedMessage.correlation.id ~= nil, "Adapted message should have correlation ID")
    assert(adaptedMessage.auth.processId == "legacy-client", "Adapted message should preserve origin process ID")
    assert(adaptedMessage.payload.originalData == legacyMessage, "Adapted message should preserve original data")
    assert(adaptedMessage._compatibility.isAdapted == true, "Adapted message should be marked as adapted")
end

-- Test: All legacy operation mappings
function tests.testLegacyOperationMappings()
    print("\n=== Testing Legacy Operation Mappings ===")
    
    local mappings = BackwardCompatibility.getLegacyMappings()
    
    -- Test battle mappings
    assert(mappings["battle"] == "BATTLE_RESOLUTION", "Battle mapping should be correct")
    assert(mappings["start-battle"] == "BATTLE_START", "Start battle mapping should be correct")
    assert(mappings["end-battle"] == "BATTLE_END", "End battle mapping should be correct")
    assert(mappings["execute-move"] == "MOVE_EXECUTION", "Move execution mapping should be correct")
    
    -- Test pokemon mappings
    assert(mappings["update-pokemon"] == "POKEMON_UPDATE", "Pokemon update mapping should be correct")
    assert(mappings["evolve-pokemon"] == "POKEMON_EVOLUTION", "Pokemon evolution mapping should be correct")
    assert(mappings["calculate-stats"] == "STAT_CALCULATION", "Stat calculation mapping should be correct")
    assert(mappings["catch-pokemon"] == "POKEMON_CAPTURE", "Pokemon capture mapping should be correct")
    
    -- Test shop mappings
    assert(mappings["shop-buy"] == "ITEM_PURCHASE", "Shop buy mapping should be correct")
    assert(mappings["shop-sell"] == "ITEM_SALE", "Shop sell mapping should be correct")
    assert(mappings["shop-inventory"] == "SHOP_INVENTORY", "Shop inventory mapping should be correct")
    assert(mappings["shop-transaction"] == "SHOP_TRANSACTION", "Shop transaction mapping should be correct")
    
    -- Test game state mappings
    assert(mappings["save"] == "SAVE_GAME", "Save mapping should be correct")
    assert(mappings["load"] == "LOAD_GAME", "Load mapping should be correct")
    assert(mappings["sync"] == "SYNC_STATE", "Sync mapping should be correct")
    
    -- Test admin mappings
    assert(mappings["get-info"] == "PROCESS_INFO", "Get info mapping should be correct")
    assert(mappings["admin"] == "ADMIN_COMMAND", "Admin mapping should be correct")
end

-- Test: Response adaptation to legacy format
function tests.testResponseAdaptationToLegacy()
    print("\n=== Testing Response Adaptation to Legacy Format ===")
    
    local originalLegacyMessage = { action = "battle", data = "test" }
    
    -- Test successful response adaptation
    local interProcessResponse = {
        success = true,
        payload = { battleResult = "victory", experience = 100 },
        correlationId = "test-123",
        targetProcessId = "battle-process",
        timestamp = 1234567890
    }
    
    local legacyResponse = BackwardCompatibility.adaptResponseToLegacy(interProcessResponse, originalLegacyMessage)
    assert(legacyResponse ~= nil, "Response should be successfully adapted to legacy format")
    assert(legacyResponse.success == true, "Adapted response should preserve success status")
    assert(legacyResponse.result ~= nil, "Adapted response should have result data")
    assert(legacyResponse.correlationId == "test-123", "Adapted response should preserve correlation ID")
    assert(legacyResponse._adapted ~= nil, "Adapted response should be marked as adapted")
    
    -- Test error response adaptation
    local errorResponse = {
        success = false,
        error = "BATTLE_FAILED",
        message = "Pokemon fainted",
        timestamp = 1234567890
    }
    
    local legacyErrorResponse = BackwardCompatibility.adaptResponseToLegacy(errorResponse, originalLegacyMessage)
    assert(legacyErrorResponse.success == false, "Error response should preserve failure status")
    assert(legacyErrorResponse.error == "BATTLE_FAILED", "Error response should preserve error code")
    assert(legacyErrorResponse.message == "Pokemon fainted", "Error response should preserve error message")
end

-- Test: Custom legacy mapping management
function tests.testCustomLegacyMappings()
    print("\n=== Testing Custom Legacy Mappings ===")
    
    -- Test adding custom mapping
    local success = BackwardCompatibility.addLegacyMapping("custom-op", "CUSTOM_OPERATION")
    assert(success == true, "Should successfully add custom legacy mapping")
    
    local mappings = BackwardCompatibility.getLegacyMappings()
    assert(mappings["custom-op"] == "CUSTOM_OPERATION", "Custom mapping should be present")
    
    -- Test removing custom mapping
    local removeSuccess = BackwardCompatibility.removeLegacyMapping("custom-op")
    assert(removeSuccess == true, "Should successfully remove custom legacy mapping")
    
    mappings = BackwardCompatibility.getLegacyMappings()
    assert(mappings["custom-op"] == nil, "Custom mapping should be removed")
    
    -- Test removing non-existent mapping
    local removeFailure = BackwardCompatibility.removeLegacyMapping("non-existent")
    assert(removeFailure == false, "Should fail to remove non-existent mapping")
end

-- Test: Legacy compatibility validation
function tests.testLegacyCompatibilityValidation()
    print("\n=== Testing Legacy Compatibility Validation ===")
    
    -- Test valid legacy message
    local validLegacyMessage = { action = "battle", data = "test" }
    local isValid, message = BackwardCompatibility.validateLegacyCompatibility(validLegacyMessage)
    assert(isValid == true, "Valid legacy message should pass validation")
    assert(type(message) == "string", "Validation should return descriptive message")
    
    -- Test invalid legacy message (unknown operation)
    local invalidLegacyMessage = { action = "unknown-operation", data = "test" }
    local isInvalid, errorMessage = BackwardCompatibility.validateLegacyCompatibility(invalidLegacyMessage)
    assert(isInvalid == false, "Invalid legacy message should fail validation")
    assert(type(errorMessage) == "string", "Validation should return error message")
    
    -- Test new format message
    local newFormatMessage = {
        correlation = { id = "test" },
        auth = { processId = "test" },
        operation = { type = "BATTLE_RESOLUTION" }
    }
    local newValid, newMessage = BackwardCompatibility.validateLegacyCompatibility(newFormatMessage)
    assert(newValid == true, "New format message should pass validation")
end

-- Test: Compatibility statistics tracking
function tests.testCompatibilityStatistics()
    print("\n=== Testing Compatibility Statistics ===")
    
    local initialStats = BackwardCompatibility.getCompatibilityStats()
    local initialProcessed = initialStats.legacyMessagesProcessed
    local initialAdapted = initialStats.adaptedMessages
    
    -- Process a legacy message to update statistics
    local legacyMessage = { command = "save", gameState = {} }
    BackwardCompatibility.adaptLegacyMessage(legacyMessage, "test-process", "coordinator")
    
    local updatedStats = BackwardCompatibility.getCompatibilityStats()
    assert(updatedStats.legacyMessagesProcessed == initialProcessed + 1, 
           "Statistics should track processed legacy messages")
    assert(updatedStats.adaptedMessages == initialAdapted + 1,
           "Statistics should track adapted messages")
    
    -- Test operation-specific statistics
    assert(updatedStats.byOperationType["save"] ~= nil,
           "Should track statistics by operation type")
    assert(updatedStats.byOperationType["save"].processed > 0,
           "Should track processed count by operation type")
end

-- Test: Edge cases and error handling
function tests.testEdgeCasesAndErrorHandling()
    print("\n=== Testing Edge Cases and Error Handling ===")
    
    -- Test adaptation with missing operation type
    local invalidMessage = { data = "test", someField = "value" }
    local adaptedMessage, error = BackwardCompatibility.adaptLegacyMessage(invalidMessage)
    assert(adaptedMessage == nil, "Should fail to adapt message without operation type")
    assert(type(error) == "string", "Should return error message for invalid adaptation")
    
    -- Test adaptation with unmappable operation type
    local unmappableMessage = { action = "totally-unknown-operation" }
    local unmappableResult, unmappableError = BackwardCompatibility.adaptLegacyMessage(unmappableMessage)
    assert(unmappableResult == nil, "Should fail to adapt message with unknown operation")
    assert(type(unmappableError) == "string", "Should return error message for unknown operation")
    
    -- Test response adaptation with nil response
    local nilResponse = BackwardCompatibility.adaptResponseToLegacy(nil, { action = "test" })
    assert(nilResponse == nil, "Should handle nil response gracefully")
    
    -- Test adding invalid custom mapping
    local invalidMappingSuccess = BackwardCompatibility.addLegacyMapping(nil, "NEW_OP")
    assert(invalidMappingSuccess == false, "Should fail to add mapping with nil legacy operation")
    
    local invalidMappingSuccess2 = BackwardCompatibility.addLegacyMapping("legacy-op", nil)
    assert(invalidMappingSuccess2 == false, "Should fail to add mapping with nil new operation")
end

-- Run all tests
function runAllTests()
    print("Starting Backward Compatibility Tests...")
    print("=====================================")
    
    tests.testLegacyMessageDetection()
    tests.testLegacyMessageAdaptation()
    tests.testLegacyOperationMappings()
    tests.testResponseAdaptationToLegacy()
    tests.testCustomLegacyMappings()
    tests.testLegacyCompatibilityValidation()
    tests.testCompatibilityStatistics()
    tests.testEdgeCasesAndErrorHandling()
    
    print("\n=====================================")
    print("Backward Compatibility Tests Complete")
    print("Tests passed: " .. passedTests .. "/" .. totalTests)
    
    if passedTests == totalTests then
        print("✅ All tests passed!")
        return true
    else
        print("❌ Some tests failed!")
        return false
    end
end

-- Run tests if this file is executed directly
if not package.loaded[...] then
    local testResult = runAllTests()
end

return {
    runAllTests = runAllTests,
    tests = tests
}