-- Unit tests for Process Authentication Framework
-- Tests process registration, token generation, validation, and authorization

local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")

local tests = {}

-- Test process registration
function tests.testProcessRegistration()
    ProcessAuthenticator.initialize()
    
    local processId = "test-process-123"
    local processType = "battle"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"battle-resolution", "pokemon-management"}
    
    local success, error = ProcessAuthenticator.registerProcess(processId, processType, walletAddress, capabilities)
    
    assert(success == true, "Process registration should succeed")
    assert(error == nil, "No error should be returned on successful registration")
    
    local processInfo = ProcessAuthenticator.getProcessInfo(processId)
    assert(processInfo ~= nil, "Process info should be retrievable")
    assert(processInfo.id == processId, "Process ID should match")
    assert(processInfo.type == processType, "Process type should match")
    assert(processInfo.status == "active", "Process should be active")
    assert(processInfo.authLevel == ProcessAuthenticator.AUTH_LEVELS.BASIC, "Battle process should have basic auth level")
end

-- Test process registration validation
function tests.testProcessRegistrationValidation()
    ProcessAuthenticator.initialize()
    
    -- Test missing process ID
    local success, error = ProcessAuthenticator.registerProcess(nil, "battle", "abc123def456ghi789jkl012mno345pqr678stu901v", {"test"})
    assert(success == false, "Should fail without process ID")
    assert(type(error) == "string", "Should return error message")
    
    -- Test invalid process type
    success, error = ProcessAuthenticator.registerProcess("test-id", "invalid", "abc123def456ghi789jkl012mno345pqr678stu901v", {"test"})
    assert(success == false, "Should fail with invalid process type")
    
    -- Test missing wallet address
    success, error = ProcessAuthenticator.registerProcess("test-id", "battle", nil, {"test"})
    assert(success == false, "Should fail without wallet address")
    
    -- Test invalid wallet address format
    success, error = ProcessAuthenticator.registerProcess("test-id", "battle", "invalid-wallet", {"test"})
    assert(success == false, "Should fail with invalid wallet address format")
    
    -- Test missing capabilities
    success, error = ProcessAuthenticator.registerProcess("test-id", "battle", "abc123def456ghi789jkl012mno345pqr678stu901v", nil)
    assert(success == false, "Should fail without capabilities")
end

-- Test authentication levels assignment
function tests.testAuthLevels()
    ProcessAuthenticator.initialize()
    
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    -- Test admin process
    ProcessAuthenticator.registerProcess("admin-process", "admin", walletAddress, capabilities)
    local adminInfo = ProcessAuthenticator.getProcessInfo("admin-process")
    assert(adminInfo.authLevel == ProcessAuthenticator.AUTH_LEVELS.ADMIN, "Admin process should have admin auth level")
    
    -- Test security process  
    ProcessAuthenticator.registerProcess("security-process", "security", walletAddress, capabilities)
    local securityInfo = ProcessAuthenticator.getProcessInfo("security-process")
    assert(securityInfo.authLevel == ProcessAuthenticator.AUTH_LEVELS.ELEVATED, "Security process should have elevated auth level")
    
    -- Test coordinator process
    ProcessAuthenticator.registerProcess("coordinator-process", "coordinator", walletAddress, capabilities)
    local coordinatorInfo = ProcessAuthenticator.getProcessInfo("coordinator-process")
    assert(coordinatorInfo.authLevel == ProcessAuthenticator.AUTH_LEVELS.ELEVATED, "Coordinator process should have elevated auth level")
    
    -- Test basic process
    ProcessAuthenticator.registerProcess("battle-process", "battle", walletAddress, capabilities)
    local battleInfo = ProcessAuthenticator.getProcessInfo("battle-process")
    assert(battleInfo.authLevel == ProcessAuthenticator.AUTH_LEVELS.BASIC, "Battle process should have basic auth level")
end

-- Test duplicate process registration
function tests.testDuplicateRegistration()
    ProcessAuthenticator.initialize()
    
    local processId = "duplicate-test"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    -- First registration should succeed
    local success = ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    assert(success == true, "First registration should succeed")
    
    -- Second registration should fail
    success, error = ProcessAuthenticator.registerProcess(processId, "pokemon", walletAddress, capabilities)
    assert(success == false, "Duplicate registration should fail")
    assert(type(error) == "string", "Should return error message")
end

-- Test authentication token generation
function tests.testAuthTokenGeneration()
    ProcessAuthenticator.initialize()
    
    local processId = "token-test-process"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"battle-resolution"}
    
    ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    
    local token, error = ProcessAuthenticator.generateAuthToken(processId, walletAddress)
    
    assert(token ~= nil, "Token should be generated")
    assert(error == nil, "No error should be returned")
    assert(type(token.tokenId) == "string", "Token ID should be a string")
    assert(type(token.signature) == "string", "Token signature should be a string")
    assert(type(token.expiresAt) == "number", "Token expiration should be a number")
    assert(token.authLevel == ProcessAuthenticator.AUTH_LEVELS.BASIC, "Token should have correct auth level")
    assert(string.sub(token.tokenId, 1, 6) == "token_", "Token ID should have token_ prefix")
end

-- Test token generation validation
function tests.testTokenGenerationValidation()
    ProcessAuthenticator.initialize()
    
    local processId = "validation-test"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local wrongWallet = "def456ghi789jkl012mno345pqr678stu901vwx123"
    local capabilities = {"test-capability"}
    
    ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    
    -- Test token generation for non-existent process
    local token, error = ProcessAuthenticator.generateAuthToken("non-existent", walletAddress)
    assert(token == nil, "Should not generate token for non-existent process")
    assert(type(error) == "string", "Should return error message")
    
    -- Test wallet address mismatch
    token, error = ProcessAuthenticator.generateAuthToken(processId, wrongWallet)
    assert(token == nil, "Should not generate token for wrong wallet")
    assert(type(error) == "string", "Should return error message")
end

-- Test token validation
function tests.testTokenValidation()
    ProcessAuthenticator.initialize()
    
    local processId = "validation-test-process"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"battle-resolution", "pokemon-management"}
    
    ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    local token = ProcessAuthenticator.generateAuthToken(processId, walletAddress)
    
    local isValid, authContext, error = ProcessAuthenticator.validateAuthToken(token.tokenId, token.signature)
    
    assert(isValid == true, "Token should be valid")
    assert(authContext ~= nil, "Auth context should be returned")
    assert(error == nil, "No error should be returned")
    assert(authContext.processId == processId, "Process ID should match")
    assert(authContext.walletAddress == walletAddress, "Wallet address should match")
    assert(authContext.authLevel == ProcessAuthenticator.AUTH_LEVELS.BASIC, "Auth level should match")
    assert(type(authContext.capabilities) == "table", "Capabilities should be a table")
end

-- Test token validation failure cases
function tests.testTokenValidationFailures()
    ProcessAuthenticator.initialize()
    
    local processId = "failure-test-process"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    local token = ProcessAuthenticator.generateAuthToken(processId, walletAddress)
    
    -- Test invalid token ID
    local isValid, authContext, error = ProcessAuthenticator.validateAuthToken("invalid-token", token.signature)
    assert(isValid == false, "Invalid token should fail validation")
    assert(authContext == nil, "Auth context should be nil for invalid token")
    assert(type(error) == "string", "Error message should be returned")
    
    -- Test invalid signature
    isValid, authContext, error = ProcessAuthenticator.validateAuthToken(token.tokenId, "invalid-signature")
    assert(isValid == false, "Invalid signature should fail validation")
    assert(type(error) == "string", "Error message should be returned")
end

-- Test token revocation
function tests.testTokenRevocation()
    ProcessAuthenticator.initialize()
    
    local processId = "revocation-test-process"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    local token = ProcessAuthenticator.generateAuthToken(processId, walletAddress)
    
    -- Token should be valid before revocation
    local isValid = ProcessAuthenticator.validateAuthToken(token.tokenId, token.signature)
    assert(isValid == true, "Token should be valid before revocation")
    
    -- Revoke token
    local success = ProcessAuthenticator.revokeAuthToken(token.tokenId, processId)
    assert(success == true, "Token revocation should succeed")
    
    -- Token should be invalid after revocation
    isValid = ProcessAuthenticator.validateAuthToken(token.tokenId, token.signature)
    assert(isValid == false, "Token should be invalid after revocation")
end

-- Test process-to-process authorization
function tests.testProcessAuth()
    ProcessAuthenticator.initialize()
    
    local sourceProcessId = "source-process"
    local targetProcessId = "target-process"
    local walletAddress1 = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local walletAddress2 = "def456ghi789jkl012mno345pqr678stu901vwx123"
    local capabilities = {"battle-resolution", "pokemon-management"}
    
    ProcessAuthenticator.registerProcess(sourceProcessId, "battle", walletAddress1, capabilities)
    ProcessAuthenticator.registerProcess(targetProcessId, "pokemon", walletAddress2, {"pokemon-update"})
    
    local token = ProcessAuthenticator.generateAuthToken(sourceProcessId, walletAddress1)
    local authToken = {tokenId = token.tokenId, signature = token.signature}
    
    -- Test authorized operation
    local isAuthorized = ProcessAuthenticator.validateProcessAuth(sourceProcessId, targetProcessId, "battle-resolution", authToken)
    assert(isAuthorized == true, "Authorized operation should succeed")
    
    -- Test unauthorized operation
    isAuthorized = ProcessAuthenticator.validateProcessAuth(sourceProcessId, targetProcessId, "admin-operation", authToken)
    assert(isAuthorized == false, "Unauthorized operation should fail")
end

-- Test process listing and filtering
function tests.testProcessListing()
    ProcessAuthenticator.initialize()
    
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    ProcessAuthenticator.registerProcess("battle-process-1", "battle", walletAddress, capabilities)
    ProcessAuthenticator.registerProcess("battle-process-2", "battle", walletAddress, capabilities)
    ProcessAuthenticator.registerProcess("pokemon-process-1", "pokemon", walletAddress, capabilities)
    ProcessAuthenticator.registerProcess("admin-process-1", "admin", walletAddress, capabilities)
    
    -- Test listing all processes
    local allProcesses = ProcessAuthenticator.listRegisteredProcesses()
    local processCount = 0
    for _ in pairs(allProcesses) do
        processCount = processCount + 1
    end
    assert(processCount == 4, "Should have 4 registered processes")
    
    -- Test filtering by type
    local battleProcesses = ProcessAuthenticator.listRegisteredProcesses("battle")
    local battleCount = 0
    for _ in pairs(battleProcesses) do
        battleCount = battleCount + 1
    end
    assert(battleCount == 2, "Should have 2 battle processes")
    
    -- Test filtering by auth level
    local adminProcesses = ProcessAuthenticator.listRegisteredProcesses(nil, ProcessAuthenticator.AUTH_LEVELS.ADMIN)
    local adminCount = 0
    for _ in pairs(adminProcesses) do
        adminCount = adminCount + 1
    end
    assert(adminCount == 1, "Should have 1 admin process")
end

-- Test heartbeat functionality
function tests.testProcessHeartbeat()
    ProcessAuthenticator.initialize()
    
    local processId = "heartbeat-test"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    
    local processInfo = ProcessAuthenticator.getProcessInfo(processId)
    local initialHeartbeat = processInfo.lastHeartbeat
    
    -- Wait a moment and update heartbeat
    -- (In real tests we might use a mock time function)
    local success = ProcessAuthenticator.updateProcessHeartbeat(processId)
    assert(success == true, "Heartbeat update should succeed")
    
    -- Test heartbeat for non-existent process
    success = ProcessAuthenticator.updateProcessHeartbeat("non-existent")
    assert(success == false, "Heartbeat update should fail for non-existent process")
end

-- Test cleanup functionality
function tests.testCleanup()
    ProcessAuthenticator.initialize()
    
    local processId = "cleanup-test"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    ProcessAuthenticator.generateAuthToken(processId, walletAddress)
    
    local cleanupResults = ProcessAuthenticator.cleanup()
    
    assert(type(cleanupResults) == "table", "Cleanup should return results table")
    assert(type(cleanupResults.expiredTokens) == "number", "Should return expired token count")
    assert(type(cleanupResults.inactiveProcesses) == "number", "Should return inactive process count")
end

-- Test statistics
function tests.testStatistics()
    ProcessAuthenticator.initialize()
    
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    ProcessAuthenticator.registerProcess("stats-test-1", "battle", walletAddress, capabilities)
    ProcessAuthenticator.registerProcess("stats-test-2", "pokemon", walletAddress, capabilities)
    ProcessAuthenticator.registerProcess("stats-test-3", "admin", walletAddress, capabilities)
    
    ProcessAuthenticator.generateAuthToken("stats-test-1", walletAddress)
    ProcessAuthenticator.generateAuthToken("stats-test-2", walletAddress)
    
    local stats = ProcessAuthenticator.getStatistics()
    
    assert(type(stats) == "table", "Statistics should be a table")
    assert(stats.registeredProcesses == 3, "Should have 3 registered processes")
    assert(stats.activeProcesses == 3, "Should have 3 active processes")
    assert(stats.activeTokens == 2, "Should have 2 active tokens")
    assert(type(stats.processTypeBreakdown) == "table", "Should have process type breakdown")
    assert(type(stats.authLevelBreakdown) == "table", "Should have auth level breakdown")
    assert(stats.processTypeBreakdown.battle == 1, "Should have 1 battle process")
    assert(stats.authLevelBreakdown.basic == 2, "Should have 2 basic auth processes")
    assert(stats.authLevelBreakdown.admin == 1, "Should have 1 admin auth process")
end

-- Test maximum tokens per process
function tests.testMaxTokensPerProcess()
    ProcessAuthenticator.initialize()
    
    local processId = "max-tokens-test"
    local walletAddress = "abc123def456ghi789jkl012mno345pqr678stu901v"
    local capabilities = {"test-capability"}
    
    ProcessAuthenticator.registerProcess(processId, "battle", walletAddress, capabilities)
    
    -- Generate tokens up to the maximum
    local generatedTokens = 0
    for i = 1, ProcessAuthenticator.maxTokensPerProcess do
        local token, error = ProcessAuthenticator.generateAuthToken(processId, walletAddress)
        if token then
            generatedTokens = generatedTokens + 1
        else
            break
        end
    end
    
    assert(generatedTokens == ProcessAuthenticator.maxTokensPerProcess, 
           "Should generate maximum number of tokens")
    
    -- Try to generate one more token (should fail)
    local token, error = ProcessAuthenticator.generateAuthToken(processId, walletAddress)
    assert(token == nil, "Should not generate token beyond maximum")
    assert(type(error) == "string", "Should return error message")
end

-- Run all tests
function tests.runAll()
    print("[ProcessAuthenticator] Running unit tests...")
    
    local testFunctions = {
        "testProcessRegistration",
        "testProcessRegistrationValidation", 
        "testAuthLevels",
        "testDuplicateRegistration",
        "testAuthTokenGeneration",
        "testTokenGenerationValidation",
        "testTokenValidation",
        "testTokenValidationFailures",
        "testTokenRevocation",
        "testProcessAuth",
        "testProcessListing",
        "testProcessHeartbeat",
        "testCleanup",
        "testStatistics",
        "testMaxTokensPerProcess"
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
    
    print(string.format("[ProcessAuthenticator] Tests completed: %d/%d passed", passedTests, totalTests))
    
    if passedTests == totalTests then
        print("[ProcessAuthenticator] All tests passed!")
        return true
    else
        error(string.format("ProcessAuthenticator tests failed: %d/%d passed", passedTests, totalTests))
    end
end

-- Run tests if this file is executed directly
if debug.getinfo(2, "S") == nil then
    tests.runAll()
end

return tests