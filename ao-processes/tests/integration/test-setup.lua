-- Integration Test Setup Module
-- Provides standardized path configuration and test framework initialization
-- Use this at the top of all integration tests to ensure consistent module loading

local TestSetup = {}

-- Standard Lua path configuration for integration tests
function TestSetup.setupLuaPath()
    local originalPath = package.path
    
    -- Try multiple path setups for different execution contexts
    local pathConfigs = {
        -- From integration/ directory (most common case)
        {
            "../framework/?.lua",
            "../framework/?/init.lua",
            "../../?.lua",
            "../../?/init.lua", 
            "../../data/?.lua",
            "../../data/?/init.lua",
            "../../game-logic/?.lua", 
            "../../game-logic/?/init.lua",
            "../../handlers/?.lua",
            "../../handlers/?/init.lua",
            "../?.lua",
            "../?/init.lua"
        },
        -- From tests/ directory (if run from parent)
        {
            "./framework/?.lua",
            "./framework/?/init.lua",
            "../?.lua",
            "../?/init.lua", 
            "../data/?.lua",
            "../data/?/init.lua",
            "../game-logic/?.lua", 
            "../game-logic/?/init.lua",
            "../handlers/?.lua",
            "../handlers/?/init.lua",
            "./?.lua",
            "./?/init.lua"
        }
    }
    
    -- Try each path configuration
    for _, paths in ipairs(pathConfigs) do
        local newPath = originalPath
        for _, path in ipairs(paths) do
            newPath = newPath .. ";" .. path
        end
        package.path = newPath
        
        -- Test if we can load the test framework
        local success, testFramework = pcall(require, "framework.test-framework-enhanced")
        if success then
            return testFramework
        end
    end
    
    -- Fallback: restore original path and create simple framework
    package.path = originalPath
    print("Warning: Could not load enhanced test framework, using simple framework")
    return {
        createTestSuite = function() return {} end,
        runTest = function(name, func) 
            local success, result = pcall(func)
            if success then
                print("✅ " .. name .. " PASSED")
            else
                print("❌ " .. name .. " FAILED: " .. tostring(result))
            end
        end
    }
end

-- Initialize common test dependencies
function TestSetup.initializeTestEnvironment()
    -- Initialize RNG if available
    local success, CryptoRNG = pcall(require, "game-logic.rng.crypto-rng")
    if success then
        CryptoRNG.initBattleRNG("integration-test-seed")
    end
    
    -- Initialize other common systems
    local entryhazards = pcall(require, "game-logic.battle.entry-hazards")
    if entryhazards then
        -- Entry hazards system should be initialized
    end
    
    local switcheffects = pcall(require, "game-logic.battle.switch-in-effects")
    if switcheffects then
        -- Switch-in effects system should be initialized
    end
end

-- Standard battle state factory for integration tests
function TestSetup.createStandardBattleState()
    return {
        battleId = "integration-test",
        turn = 1,
        phase = 1,
        turnOrder = {},
        currentAction = nil,
        pendingActions = {},
        interruptQueue = {},
        battleSeed = "test-seed-123",
        playerParty = {},
        enemyParty = {},
        battleConditions = {
            entryHazards = {
                player = {},
                enemy = {}
            },
            weather = {
                type = 0,
                duration = 0
            },
            terrain = {
                type = 0, 
                duration = 0
            }
        },
        battleEvents = {},
        activePokemon = {
            player = nil,
            enemy = nil
        }
    }
end

-- Standard Pokemon factory for integration tests
function TestSetup.createStandardPokemon(options)
    options = options or {}
    local id = options.id or math.random(1000, 9999)
    local name = options.name or "TestMon"
    local species = options.species or 1
    local types = options.types or {0}  -- Normal type default
    local level = options.level or 50
    local hp = options.hp or 150
    local ability = options.ability or nil
    local moves = options.moves or {}
    
    return {
        id = tostring(id),
        name = name,
        species = {
            id = species,
            type1 = types[1],
            type2 = types[2]
        },
        level = level,
        ability = ability,
        moves = moves,
        stats = {
            hp = hp,
            attack = 100,
            defense = 100, 
            spAttack = 100,
            spDefense = 100,
            speed = 100
        },
        maxHP = hp,
        currentHP = hp,
        battleData = {
            side = options.side or "player",
            statStages = {
                atk = 0, def = 0, spa = 0, spd = 0, spe = 0, acc = 0, eva = 0
            }
        },
        status = nil,
        statusTurns = nil,
        fainted = false
    }
end

-- Test Enums for integration tests
TestSetup.TestEnums = {
    PokemonType = {
        NORMAL = 0, FIGHTING = 1, FLYING = 2, POISON = 3, GROUND = 4,
        ROCK = 5, BUG = 6, GHOST = 7, STEEL = 8, FIRE = 9,
        WATER = 10, GRASS = 11, ELECTRIC = 12, PSYCHIC = 13, ICE = 14,
        DRAGON = 15, DARK = 16, FAIRY = 17
    },
    AbilityId = {
        LEVITATE = 26,
        MAGIC_GUARD = 98
    },
    MoveId = {
        STEALTH_ROCK = 277,
        SPIKES = 191,
        TOXIC_SPIKES = 390,
        RAPID_SPIN = 229,
        DEFOG = 432
    },
    MoveCategory = {
        PHYSICAL = 0,
        SPECIAL = 1,
        STATUS = 2
    },
    MoveTarget = {
        SELECTED = 0,
        USER = 8,
        ALL_OPPONENTS = 10
    }
}

return TestSetup