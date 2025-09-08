-- Unit tests for Process Authenticator timestamp parameter integration
-- Validates timestamp parameter threading for secondary module compatibility

local TestFramework = require("tests.framework.test-framework-enhanced")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

-- Test suite for Process Authenticator timestamp integration
local ProcessAuthenticatorTimestampTest = TestFramework.createTestSuite("ProcessAuthenticatorTimestampTest")

function ProcessAuthenticatorTimestampTest.setUp()
    -- Initialize process authenticator before each test
    ProcessAuthenticator.initialize()
    
    -- Mock timestamp for consistent testing
    local mockTimestamp = 1640995200 -- 2022-01-01 00:00:00 UTC
    
    return {
        mockTimestamp = mockTimestamp,
        testProcessId = "test-process-001",
        testWalletAddress = "ArWeave43CharWalletAddressForTestingPurposes",
        testCapabilities = {"battle:read", "pokemon:update"}
    }
end

function ProcessAuthenticatorTimestampTest.tearDown()
    -- Clean up any test data
    ProcessAuthenticator.processRegistry = {}
    ProcessAuthenticator.activeTokens = {}
end

function ProcessAuthenticatorTimestampTest.testRegisterProcessWithTimestamp()
    local testData = ProcessAuthenticatorTimestampTest.setUp()
    
    -- Test process registration with timestamp parameter
    local success = ProcessAuthenticator.registerProcess(
        testData.testProcessId,
        "BATTLE",
        testData.testWalletAddress,
        testData.testCapabilities,
        testData.mockTimestamp
    )
    
    TestFramework.assertTrue(success, "Process registration should succeed with timestamp parameter")
    
    -- Verify the process was registered with correct timestamp
    local processInfo = ProcessAuthenticator.getProcessInfo(testData.testProcessId)
    TestFramework.assertNotNil(processInfo, "Process info should be available after registration")
    TestFramework.assertEquals(processInfo.registeredAt, testData.mockTimestamp, "Process should be registered with provided timestamp")
    TestFramework.assertEquals(processInfo.lastHeartbeat, testData.mockTimestamp, "Process heartbeat should use provided timestamp")
end

function ProcessAuthenticatorTimestampTest.testGenerateAuthTokenWithTimestamp()
    local testData = ProcessAuthenticatorTimestampTest.setUp()
    
    -- Register process first
    ProcessAuthenticator.registerProcess(
        testData.testProcessId,
        "BATTLE", 
        testData.testWalletAddress,
        testData.testCapabilities,
        testData.mockTimestamp
    )
    
    -- Generate token with timestamp parameter
    local tokenResult = ProcessAuthenticator.generateAuthToken(
        testData.testProcessId,
        testData.testWalletAddress,
        3600, -- 1 hour expiration
        testData.mockTimestamp
    )
    
    TestFramework.assertNotNil(tokenResult, "Token generation should succeed with timestamp parameter")
    TestFramework.assertNotNil(tokenResult.tokenId, "Generated token should have token ID")
    TestFramework.assertNotNil(tokenResult.signature, "Generated token should have signature")
    TestFramework.assertEquals(tokenResult.expiresAt, testData.mockTimestamp + 3600, "Token expiration should use provided timestamp")
end

function ProcessAuthenticatorTimestampTest.testValidateAuthTokenWithTimestamp()
    local testData = ProcessAuthenticatorTimestampTest.setUp()
    
    -- Register process and generate token
    ProcessAuthenticator.registerProcess(
        testData.testProcessId,
        "BATTLE",
        testData.testWalletAddress, 
        testData.testCapabilities,
        testData.mockTimestamp
    )
    
    local tokenResult = ProcessAuthenticator.generateAuthToken(
        testData.testProcessId,
        testData.testWalletAddress,
        3600,
        testData.mockTimestamp
    )
    
    -- Validate token with timestamp parameter (before expiration)
    local isValid, authContext, error = ProcessAuthenticator.validateAuthToken(
        tokenResult.tokenId,
        tokenResult.signature,
        testData.mockTimestamp + 1800 -- 30 minutes later
    )
    
    TestFramework.assertTrue(isValid, "Token should be valid with timestamp parameter before expiration")
    TestFramework.assertNotNil(authContext, "Valid token should return auth context")
    TestFramework.assertEquals(authContext.processId, testData.testProcessId, "Auth context should contain correct process ID")
end

function ProcessAuthenticatorTimestampTest.testValidateExpiredTokenWithTimestamp()
    local testData = ProcessAuthenticatorTimestampTest.setUp()
    
    -- Register process and generate token
    ProcessAuthenticator.registerProcess(
        testData.testProcessId,
        "BATTLE",
        testData.testWalletAddress,
        testData.testCapabilities,
        testData.mockTimestamp
    )
    
    local tokenResult = ProcessAuthenticator.generateAuthToken(
        testData.testProcessId,
        testData.testWalletAddress,
        3600,
        testData.mockTimestamp
    )
    
    -- Validate token with timestamp parameter (after expiration)
    local isValid, authContext, error = ProcessAuthenticator.validateAuthToken(
        tokenResult.tokenId,
        tokenResult.signature,
        testData.mockTimestamp + 7200 -- 2 hours later (expired)
    )
    
    TestFramework.assertFalse(isValid, "Token should be invalid with timestamp parameter after expiration")
    TestFramework.assertNil(authContext, "Invalid token should not return auth context")
    TestFramework.assertNotNil(error, "Token validation should return error for expired token")
    TestFramework.assertStringContains(error, "expired", "Error message should indicate token expiration")
end

function ProcessAuthenticatorTimestampTest.testUpdateHeartbeatWithTimestamp()
    local testData = ProcessAuthenticatorTimestampTest.setUp()
    
    -- Register process
    ProcessAuthenticator.registerProcess(
        testData.testProcessId,
        "BATTLE",
        testData.testWalletAddress,
        testData.testCapabilities,
        testData.mockTimestamp
    )
    
    -- Update heartbeat with new timestamp
    local heartbeatTimestamp = testData.mockTimestamp + 600 -- 10 minutes later
    local success = ProcessAuthenticator.updateProcessHeartbeat(testData.testProcessId, heartbeatTimestamp)
    
    TestFramework.assertTrue(success, "Heartbeat update should succeed with timestamp parameter")
    
    -- Verify heartbeat was updated
    local processInfo = ProcessAuthenticator.getProcessInfo(testData.testProcessId)
    TestFramework.assertEquals(processInfo.lastHeartbeat, heartbeatTimestamp, "Process heartbeat should be updated with provided timestamp")
end

function ProcessAuthenticatorTimestampTest.testCleanupWithTimestamp()
    local testData = ProcessAuthenticatorTimestampTest.setUp()
    
    -- Register process and generate token
    ProcessAuthenticator.registerProcess(
        testData.testProcessId,
        "BATTLE",
        testData.testWalletAddress,
        testData.testCapabilities,
        testData.mockTimestamp
    )
    
    ProcessAuthenticator.generateAuthToken(
        testData.testProcessId,
        testData.testWalletAddress,
        3600,
        testData.mockTimestamp
    )
    
    -- Run cleanup with timestamp after expiration
    local cleanupResult = ProcessAuthenticator.cleanup(testData.mockTimestamp + 7200) -- 2 hours later
    
    TestFramework.assertNotNil(cleanupResult, "Cleanup should return result with timestamp parameter")
    TestFramework.assertEquals(cleanupResult.expiredTokens, 1, "Cleanup should identify expired tokens using timestamp")
end

function ProcessAuthenticatorTimestampTest.testValidateProcessAuthWithTimestamp()
    local testData = ProcessAuthenticatorTimestampTest.setUp()
    
    -- Register source and target processes
    ProcessAuthenticator.registerProcess(
        testData.testProcessId,
        "BATTLE",
        testData.testWalletAddress,
        testData.testCapabilities,
        testData.mockTimestamp
    )
    
    ProcessAuthenticator.registerProcess(
        "target-process-001",
        "POKEMON",
        "ArWeave43CharWalletAddressForTargetProcess", 
        {"pokemon:read"},
        testData.mockTimestamp
    )
    
    -- Generate auth token
    local tokenResult = ProcessAuthenticator.generateAuthToken(
        testData.testProcessId,
        testData.testWalletAddress,
        3600,
        testData.mockTimestamp
    )
    
    -- Validate process-to-process auth with timestamp
    local authToken = {
        tokenId = tokenResult.tokenId,
        signature = tokenResult.signature
    }
    
    local isAuthorized = ProcessAuthenticator.validateProcessAuth(
        testData.testProcessId,
        "target-process-001",
        "battle:read", -- operation within capabilities
        authToken,
        testData.mockTimestamp + 1800 -- 30 minutes later
    )
    
    TestFramework.assertTrue(isAuthorized, "Process-to-process auth should succeed with timestamp parameter")
end

function ProcessAuthenticatorTimestampTest.testTimestampParameterFallback()
    local testData = ProcessAuthenticatorTimestampTest.setUp()
    
    -- Test with nil timestamp parameter (should fallback to 0)
    local success = ProcessAuthenticator.registerProcess(
        testData.testProcessId,
        "BATTLE",
        testData.testWalletAddress,
        testData.testCapabilities,
        nil -- nil timestamp
    )
    
    TestFramework.assertTrue(success, "Process registration should succeed with nil timestamp (fallback)")
    
    -- Verify fallback to 0
    local processInfo = ProcessAuthenticator.getProcessInfo(testData.testProcessId)
    TestFramework.assertEquals(processInfo.registeredAt, 0, "Process should use fallback timestamp of 0")
end

-- Register test cases
TestFramework.registerTestCase(ProcessAuthenticatorTimestampTest.testRegisterProcessWithTimestamp)
TestFramework.registerTestCase(ProcessAuthenticatorTimestampTest.testGenerateAuthTokenWithTimestamp)
TestFramework.registerTestCase(ProcessAuthenticatorTimestampTest.testValidateAuthTokenWithTimestamp)
TestFramework.registerTestCase(ProcessAuthenticatorTimestampTest.testValidateExpiredTokenWithTimestamp)
TestFramework.registerTestCase(ProcessAuthenticatorTimestampTest.testUpdateHeartbeatWithTimestamp)
TestFramework.registerTestCase(ProcessAuthenticatorTimestampTest.testCleanupWithTimestamp)
TestFramework.registerTestCase(ProcessAuthenticatorTimestampTest.testValidateProcessAuthWithTimestamp)
TestFramework.registerTestCase(ProcessAuthenticatorTimestampTest.testTimestampParameterFallback)

return ProcessAuthenticatorTimestampTest