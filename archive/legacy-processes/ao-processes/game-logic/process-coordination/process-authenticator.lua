-- Inter-Process Authentication Framework
-- Provides secure process identity validation and token-based authentication

local CryptoRNG = require("game-logic.rng.crypto-rng")

local ProcessAuthenticator = {
    -- Process registry storage
    processRegistry = {},
    
    -- Authentication token storage (active tokens)
    activeTokens = {},
    
    -- Token configuration
    tokenExpirationTime = 3600, -- 1 hour in seconds
    maxTokensPerProcess = 5,
    
    -- Process types for capability-based authentication
    PROCESS_TYPES = {
        COORDINATOR = "coordinator",
        BATTLE = "battle", 
        POKEMON = "pokemon",
        SHOP = "shop",
        SECURITY = "security",
        ADMIN = "admin"
    },
    
    -- Authentication levels
    AUTH_LEVELS = {
        NONE = "none",
        BASIC = "basic", 
        ELEVATED = "elevated",
        ADMIN = "admin"
    }
}

-- Initialize the authentication system
function ProcessAuthenticator.initialize()
    ProcessAuthenticator.processRegistry = {}
    ProcessAuthenticator.activeTokens = {}
    CryptoRNG.initGlobalRNG()
    print("[ProcessAuthenticator] Authentication system initialized")
end

-- Register a process with identity validation
function ProcessAuthenticator.registerProcess(processId, processType, walletAddress, capabilities, timestamp)
    if not processId or type(processId) ~= "string" or processId == "" then
        return false, "Process ID is required and must be a non-empty string"
    end
    
    if not processType or not ProcessAuthenticator.PROCESS_TYPES[processType:upper()] then
        return false, "Invalid process type. Must be one of: " .. table.concat(ProcessAuthenticator._getProcessTypeList(), ", ")
    end
    
    if not walletAddress or type(walletAddress) ~= "string" or walletAddress == "" then
        return false, "Wallet address is required for process identity validation"
    end
    
    if not capabilities or type(capabilities) ~= "table" then
        return false, "Capabilities must be provided as a table"
    end
    
    -- Validate wallet address format (basic validation)
    if not ProcessAuthenticator._validateWalletAddress(walletAddress) then
        return false, "Invalid wallet address format"
    end
    
    -- Check if process is already registered
    if ProcessAuthenticator.processRegistry[processId] then
        return false, "Process already registered: " .. processId
    end
    
    local currentTime = timestamp or 0
    local processRecord = {
        id = processId,
        type = processType:lower(),
        walletAddress = walletAddress,
        capabilities = capabilities,
        authLevel = ProcessAuthenticator._determineAuthLevel(processType, capabilities),
        status = "active",
        registeredAt = currentTime,
        lastHeartbeat = currentTime,
        tokenCount = 0
    }
    
    ProcessAuthenticator.processRegistry[processId] = processRecord
    
    print(string.format("[ProcessAuthenticator] Process registered: %s (Type: %s, Auth: %s)", 
          processId, processType, processRecord.authLevel))
    
    return true
end

-- Generate authentication token for a registered process
function ProcessAuthenticator.generateAuthToken(processId, requestingWallet, expirationTime, timestamp)
    local processRecord = ProcessAuthenticator.processRegistry[processId]
    if not processRecord then
        return nil, "Process not registered: " .. tostring(processId)
    end
    
    -- Validate requesting wallet matches registered wallet
    if processRecord.walletAddress ~= requestingWallet then
        return nil, "Wallet address mismatch for process authentication"
    end
    
    if processRecord.status ~= "active" then
        return nil, "Process is not active: " .. processId
    end
    
    -- Check token limit
    if processRecord.tokenCount >= ProcessAuthenticator.maxTokensPerProcess then
        return nil, "Maximum tokens exceeded for process: " .. processId
    end
    
    local tokenExpiration = expirationTime or ProcessAuthenticator.tokenExpirationTime
    local currentTime = timestamp or 0
    
    -- Generate unique token
    local tokenId = ProcessAuthenticator._generateTokenId()
    local tokenSignature = ProcessAuthenticator._generateTokenSignature(processId, tokenId, currentTime)
    
    local token = {
        id = tokenId,
        processId = processId,
        walletAddress = requestingWallet,
        signature = tokenSignature,
        authLevel = processRecord.authLevel,
        capabilities = processRecord.capabilities,
        issuedAt = currentTime,
        expiresAt = currentTime + tokenExpiration,
        status = "active"
    }
    
    ProcessAuthenticator.activeTokens[tokenId] = token
    processRecord.tokenCount = processRecord.tokenCount + 1
    processRecord.lastHeartbeat = currentTime
    
    return {
        tokenId = tokenId,
        signature = tokenSignature,
        expiresAt = token.expiresAt,
        authLevel = token.authLevel
    }
end

-- Validate authentication token and return process context
function ProcessAuthenticator.validateAuthToken(tokenId, signature, timestamp)
    local token = ProcessAuthenticator.activeTokens[tokenId]
    if not token then
        return false, nil, "Invalid token: not found"
    end
    
    if token.status ~= "active" then
        return false, nil, "Token is not active"
    end
    
    if (timestamp or 0) > token.expiresAt then
        ProcessAuthenticator._expireToken(tokenId)
        return false, nil, "Token has expired"
    end
    
    if token.signature ~= signature then
        return false, nil, "Token signature validation failed"
    end
    
    -- Return process authentication context
    local authContext = {
        processId = token.processId,
        walletAddress = token.walletAddress,
        authLevel = token.authLevel,
        capabilities = token.capabilities,
        tokenExpiration = token.expiresAt
    }
    
    return true, authContext, nil
end

-- Revoke authentication token
function ProcessAuthenticator.revokeAuthToken(tokenId, requestingProcessId)
    local token = ProcessAuthenticator.activeTokens[tokenId]
    if not token then
        return false, "Token not found: " .. tostring(tokenId)
    end
    
    -- Only the token owner or admin process can revoke
    if token.processId ~= requestingProcessId then
        local requestingProcess = ProcessAuthenticator.processRegistry[requestingProcessId]
        if not requestingProcess or requestingProcess.authLevel ~= ProcessAuthenticator.AUTH_LEVELS.ADMIN then
            return false, "Insufficient privileges to revoke token"
        end
    end
    
    ProcessAuthenticator._expireToken(tokenId)
    return true
end

-- Validate process-to-process communication authorization
function ProcessAuthenticator.validateProcessAuth(sourceProcessId, targetProcessId, operation, authToken, timestamp)
    -- Validate source process token
    local isValidToken, authContext, tokenError = ProcessAuthenticator.validateAuthToken(authToken.tokenId, authToken.signature, timestamp)
    if not isValidToken then
        return false, "Source process authentication failed: " .. tostring(tokenError)
    end
    
    if authContext.processId ~= sourceProcessId then
        return false, "Token process ID mismatch"
    end
    
    -- Check if target process exists and is active
    local targetProcess = ProcessAuthenticator.processRegistry[targetProcessId]
    if not targetProcess then
        return false, "Target process not registered: " .. targetProcessId
    end
    
    if targetProcess.status ~= "active" then
        return false, "Target process is not active: " .. targetProcessId
    end
    
    -- Validate operation authorization based on capabilities
    if not ProcessAuthenticator._isOperationAuthorized(authContext.capabilities, operation) then
        return false, "Operation not authorized for source process capabilities"
    end
    
    return true
end

-- Update process heartbeat
function ProcessAuthenticator.updateProcessHeartbeat(processId, timestamp)
    local processRecord = ProcessAuthenticator.processRegistry[processId]
    if not processRecord then
        return false, "Process not registered: " .. processId
    end
    
    processRecord.lastHeartbeat = timestamp or 0
    return true
end

-- Get registered process information
function ProcessAuthenticator.getProcessInfo(processId)
    local processRecord = ProcessAuthenticator.processRegistry[processId]
    if not processRecord then
        return nil
    end
    
    return {
        id = processRecord.id,
        type = processRecord.type,
        capabilities = processRecord.capabilities,
        authLevel = processRecord.authLevel,
        status = processRecord.status,
        registeredAt = processRecord.registeredAt,
        lastHeartbeat = processRecord.lastHeartbeat
    }
end

-- List all registered processes
function ProcessAuthenticator.listRegisteredProcesses(filterByType, filterByAuthLevel)
    local processes = {}
    
    for processId, processRecord in pairs(ProcessAuthenticator.processRegistry) do
        local includeProcess = true
        
        if filterByType and processRecord.type ~= filterByType then
            includeProcess = false
        end
        
        if filterByAuthLevel and processRecord.authLevel ~= filterByAuthLevel then
            includeProcess = false
        end
        
        if includeProcess then
            processes[processId] = ProcessAuthenticator.getProcessInfo(processId)
        end
    end
    
    return processes
end

-- Clean up expired tokens and inactive processes
function ProcessAuthenticator.cleanup(timestamp)
    local currentTime = timestamp or 0
    local expiredTokens = 0
    local inactiveProcesses = 0
    
    -- Clean up expired tokens
    for tokenId, token in pairs(ProcessAuthenticator.activeTokens) do
        if currentTime > token.expiresAt then
            ProcessAuthenticator._expireToken(tokenId)
            expiredTokens = expiredTokens + 1
        end
    end
    
    -- Mark processes inactive if no heartbeat for too long (2x token expiration)
    local inactiveThreshold = ProcessAuthenticator.tokenExpirationTime * 2
    for processId, processRecord in pairs(ProcessAuthenticator.processRegistry) do
        if processRecord.status == "active" and 
           (currentTime - processRecord.lastHeartbeat) > inactiveThreshold then
            processRecord.status = "inactive"
            inactiveProcesses = inactiveProcesses + 1
        end
    end
    
    return {
        expiredTokens = expiredTokens,
        inactiveProcesses = inactiveProcesses
    }
end

-- Get authentication statistics
function ProcessAuthenticator.getStatistics()
    local registeredProcesses = 0
    local activeProcesses = 0
    local activeTokens = 0
    local processTypes = {}
    local authLevels = {}
    
    for _, processRecord in pairs(ProcessAuthenticator.processRegistry) do
        registeredProcesses = registeredProcesses + 1
        if processRecord.status == "active" then
            activeProcesses = activeProcesses + 1
        end
        
        processTypes[processRecord.type] = (processTypes[processRecord.type] or 0) + 1
        authLevels[processRecord.authLevel] = (authLevels[processRecord.authLevel] or 0) + 1
    end
    
    for _ in pairs(ProcessAuthenticator.activeTokens) do
        activeTokens = activeTokens + 1
    end
    
    return {
        registeredProcesses = registeredProcesses,
        activeProcesses = activeProcesses,
        inactiveProcesses = registeredProcesses - activeProcesses,
        activeTokens = activeTokens,
        maxTokensPerProcess = ProcessAuthenticator.maxTokensPerProcess,
        tokenExpirationTime = ProcessAuthenticator.tokenExpirationTime,
        processTypeBreakdown = processTypes,
        authLevelBreakdown = authLevels
    }
end

-- Private helper functions

function ProcessAuthenticator._validateWalletAddress(walletAddress)
    -- Basic validation: should be 43 characters and alphanumeric with specific chars
    if type(walletAddress) ~= "string" or #walletAddress ~= 43 then
        return false
    end
    
    -- Check for valid Arweave wallet address pattern (Base64URL)
    return string.match(walletAddress, "^[A-Za-z0-9_%-]+$") ~= nil
end

function ProcessAuthenticator._determineAuthLevel(processType, capabilities)
    local normalizedType = processType:lower()
    
    if normalizedType == ProcessAuthenticator.PROCESS_TYPES.ADMIN then
        return ProcessAuthenticator.AUTH_LEVELS.ADMIN
    elseif normalizedType == ProcessAuthenticator.PROCESS_TYPES.SECURITY or
           normalizedType == ProcessAuthenticator.PROCESS_TYPES.COORDINATOR then
        return ProcessAuthenticator.AUTH_LEVELS.ELEVATED
    else
        return ProcessAuthenticator.AUTH_LEVELS.BASIC
    end
end

function ProcessAuthenticator._generateTokenId()
    local timestamp = msg.Timestamp + CryptoRNG.random(0, 999)
    local randomSuffix = CryptoRNG.random(100000, 999999)
    return "token_" .. timestamp .. "_" .. randomSuffix
end

function ProcessAuthenticator._generateTokenSignature(processId, tokenId, timestamp)
    -- Generate signature using process ID, token ID, and timestamp
    local signatureBase = processId .. "|" .. tokenId .. "|" .. timestamp
    
    -- Use crypto module for signing (in real AO environment)
    -- For now, use a deterministic hash-like generation
    local signature = ""
    for i = 1, #signatureBase do
        local char = string.sub(signatureBase, i, i)
        signature = signature .. string.format("%02x", string.byte(char))
    end
    
    -- Add random suffix using CryptoRNG
    local randomSuffix = CryptoRNG.random(1000000, 9999999)
    return signature .. "_" .. randomSuffix
end

function ProcessAuthenticator._expireToken(tokenId)
    local token = ProcessAuthenticator.activeTokens[tokenId]
    if token then
        -- Decrease token count for the process
        local processRecord = ProcessAuthenticator.processRegistry[token.processId]
        if processRecord then
            processRecord.tokenCount = math.max(0, processRecord.tokenCount - 1)
        end
        
        -- Remove token from active tokens
        ProcessAuthenticator.activeTokens[tokenId] = nil
    end
end

function ProcessAuthenticator._isOperationAuthorized(capabilities, operation)
    if not capabilities or type(capabilities) ~= "table" then
        return false
    end
    
    -- Check if operation is in capabilities list
    for _, capability in ipairs(capabilities) do
        if capability == operation or capability == "*" then
            return true
        end
    end
    
    return false
end

function ProcessAuthenticator._getProcessTypeList()
    local types = {}
    for _, processType in pairs(ProcessAuthenticator.PROCESS_TYPES) do
        table.insert(types, processType:upper())
    end
    return types
end

return ProcessAuthenticator