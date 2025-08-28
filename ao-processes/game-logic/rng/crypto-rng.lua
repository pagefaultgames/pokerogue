-- Cryptographically secure RNG wrapper for AO processes
-- Replaces non-deterministic math.random() with seedable crypto-based randomness

local CryptoRNG = {
    -- Battle RNG state for deterministic battles
    battleSeed = nil,
    battleCounter = 0,
    
    -- General RNG state for non-battle operations
    globalSeed = nil,
    globalCounter = 0
}

-- Initialize battle RNG with a specific seed for deterministic battles
function CryptoRNG.initBattleRNG(seed)
    if not seed or type(seed) ~= "string" then
        error("Battle RNG seed must be a string")
    end
    CryptoRNG.battleSeed = seed
    CryptoRNG.battleCounter = 0
end

-- Initialize global RNG with a seed (or generate one from ao.crypto)
function CryptoRNG.initGlobalRNG(seed)
    if seed then
        CryptoRNG.globalSeed = seed
    else
        -- Use AO crypto to generate a random seed (with fallback for testing)
        if ao and ao.crypto and ao.crypto.cipher then
            CryptoRNG.globalSeed = ao.crypto.cipher.issuer()
        else
            -- Fallback for testing environment - use current time
            CryptoRNG.globalSeed = tostring(os.time())
        end
    end
    CryptoRNG.globalCounter = 0
end

-- Get deterministic random integer in battle context
function CryptoRNG.battleRandomInt(min, max)
    if not CryptoRNG.battleSeed then
        error("Battle RNG not initialized - call CryptoRNG.initBattleRNG(seed) first")
    end
    
    -- Increment counter for deterministic sequence
    CryptoRNG.battleCounter = CryptoRNG.battleCounter + 1
    
    -- Create deterministic input combining seed and counter
    local input = CryptoRNG.battleSeed .. ":" .. tostring(CryptoRNG.battleCounter)
    
    -- Use AO crypto to generate deterministic hash (with fallback)
    local hash
    if ao and ao.crypto and ao.crypto.utils then
        hash = ao.crypto.utils.hash(input)
    else
        -- Fallback hash function for testing using simple string hashing
        local hashNum = 0
        for i = 1, #input do
            hashNum = hashNum + string.byte(input, i) * (i * 31)
        end
        hash = tostring(math.abs(hashNum))
    end
    
    -- Convert hash to number and normalize to range
    local num = 0
    for i = 1, math.min(8, #hash) do
        num = num + string.byte(hash, i) * (256 ^ (i - 1))
    end
    
    -- Normalize to requested range
    if min and max then
        return min + (num % (max - min + 1))
    else
        return num % 100 + 1  -- Default 1-100 range
    end
end

-- Get random number in battle context (0-1 float)
function CryptoRNG.battleRandom()
    local randomInt = CryptoRNG.battleRandomInt(0, 999999)
    return randomInt / 999999
end

-- Get random integer in global context
function CryptoRNG.globalRandomInt(min, max)
    if not CryptoRNG.globalSeed then
        CryptoRNG.initGlobalRNG()
    end
    
    CryptoRNG.globalCounter = CryptoRNG.globalCounter + 1
    
    -- Create deterministic input
    local input = CryptoRNG.globalSeed .. ":" .. tostring(CryptoRNG.globalCounter)
    
    -- Use AO crypto for randomness (with fallback)
    local hash
    if ao and ao.crypto and ao.crypto.utils then
        hash = ao.crypto.utils.hash(input)
    else
        -- Fallback hash function for testing using simple string hashing
        local hashNum = 0
        for i = 1, #input do
            hashNum = hashNum + string.byte(input, i) * (i * 37)
        end
        hash = tostring(math.abs(hashNum))
    end
    
    -- Convert to number
    local num = 0
    for i = 1, math.min(8, #hash) do
        num = num + string.byte(hash, i) * (256 ^ (i - 1))
    end
    
    -- Normalize to range
    if min and max then
        return min + (num % (max - min + 1))
    else
        return num % 100 + 1
    end
end

-- Get random float in global context (0-1)
function CryptoRNG.globalRandom()
    local randomInt = CryptoRNG.globalRandomInt(0, 999999)
    return randomInt / 999999
end

-- Compatibility functions that match math.random() interface
function CryptoRNG.random(...)
    local args = {...}
    local argCount = #args
    
    if argCount == 0 then
        -- math.random() -> 0-1 float
        return CryptoRNG.globalRandom()
    elseif argCount == 1 then
        -- math.random(n) -> 1 to n
        return CryptoRNG.globalRandomInt(1, args[1])
    elseif argCount == 2 then
        -- math.random(m, n) -> m to n
        return CryptoRNG.globalRandomInt(args[1], args[2])
    else
        error("Invalid number of arguments to CryptoRNG.random()")
    end
end

-- Battle-specific random that follows the same interface
function CryptoRNG.battleRandomCompat(...)
    local args = {...}
    local argCount = #args
    
    if argCount == 0 then
        return CryptoRNG.battleRandom()
    elseif argCount == 1 then
        return CryptoRNG.battleRandomInt(1, args[1])
    elseif argCount == 2 then
        return CryptoRNG.battleRandomInt(args[1], args[2])
    else
        error("Invalid number of arguments to CryptoRNG.battleRandomCompat()")
    end
end

-- Reset battle RNG state (for new battles)
function CryptoRNG.resetBattleRNG()
    CryptoRNG.battleSeed = nil
    CryptoRNG.battleCounter = 0
end

-- Get current battle RNG state for debugging
function CryptoRNG.getBattleState()
    return {
        seed = CryptoRNG.battleSeed,
        counter = CryptoRNG.battleCounter
    }
end

return CryptoRNG