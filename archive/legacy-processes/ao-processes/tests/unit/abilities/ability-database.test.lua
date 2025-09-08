-- Unit Tests for Ability Database
-- Tests ability data structure, validation, and lookup functions
-- Following AAA pattern (Arrange, Act, Assert) for comprehensive coverage

-- Test framework setup
local function assert(condition, message)
    if not condition then
        error(message or "Assertion failed", 2)
    end
end

local function assertEqual(actual, expected, message)
    if actual ~= expected then
        error(message or ("Expected " .. tostring(expected) .. ", got " .. tostring(actual)), 2)
    end
end

local function assertNotNil(value, message)
    if value == nil then
        error(message or "Value should not be nil", 2)
    end
end

local function assertNil(value, message)
    if value ~= nil then
        error(message or "Value should be nil", 2)
    end
end

-- Import the module under test
local AbilityDatabase = require("data.abilities.ability-database")

-- Test suite for AbilityDatabase
local AbilityDatabaseTests = {}

-- Test: Database Initialization
function AbilityDatabaseTests.testInit()
    -- Arrange: Fresh database state
    AbilityDatabase.abilities = nil
    
    -- Act: Initialize database
    AbilityDatabase.init()
    
    -- Assert: Database is properly initialized
    assertNotNil(AbilityDatabase.abilities, "Abilities table should be initialized")
    assertNotNil(AbilityDatabase.abilitiesByName, "Name index should be initialized")
    assertNotNil(AbilityDatabase.abilitiesByTrigger, "Trigger index should be initialized")
    assertNotNil(AbilityDatabase.passiveAbilities, "Passive abilities should be initialized")
    
    -- Verify NONE ability exists
    local noneAbility = AbilityDatabase.abilities[0]
    assertNotNil(noneAbility, "NONE ability should exist")
    assertEqual(noneAbility.id, 0, "NONE ability ID should be 0")
    assertEqual(noneAbility.name, "None", "NONE ability name should be 'None'")
end

-- Test: Get Ability by ID
function AbilityDatabaseTests.testGetAbility()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act & Assert: Test valid ability IDs
    local noneAbility = AbilityDatabase.getAbility(0)
    assertNotNil(noneAbility, "Should return NONE ability")
    assertEqual(noneAbility.id, 0, "NONE ability ID should be 0")
    
    local stenchAbility = AbilityDatabase.getAbility(1)
    assertNotNil(stenchAbility, "Should return STENCH ability")
    assertEqual(stenchAbility.id, 1, "STENCH ability ID should be 1")
    assertEqual(stenchAbility.name, "Stench", "STENCH ability name should be 'Stench'")
    
    -- Test invalid ability ID
    local invalidAbility = AbilityDatabase.getAbility(9999)
    assertNil(invalidAbility, "Should return nil for invalid ability ID")
end

-- Test: Get Ability ID by Name
function AbilityDatabaseTests.testGetAbilityIdByName()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act & Assert: Test valid ability names
    local noneId = AbilityDatabase.getAbilityIdByName("None")
    assertEqual(noneId, 0, "Should return 0 for 'None'")
    
    local stenchId = AbilityDatabase.getAbilityIdByName("Stench")
    assertEqual(stenchId, 1, "Should return 1 for 'Stench'")
    
    -- Test case insensitivity
    local stenchIdLower = AbilityDatabase.getAbilityIdByName("stench")
    assertEqual(stenchIdLower, 1, "Should return 1 for 'stench' (case insensitive)")
    
    local stenchIdUpper = AbilityDatabase.getAbilityIdByName("STENCH")
    assertEqual(stenchIdUpper, 1, "Should return 1 for 'STENCH' (case insensitive)")
    
    -- Test invalid name
    local invalidId = AbilityDatabase.getAbilityIdByName("NonexistentAbility")
    assertNil(invalidId, "Should return nil for invalid ability name")
end

-- Test: Get Abilities by Trigger
function AbilityDatabaseTests.testGetAbilitiesByTrigger()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act & Assert: Test valid triggers
    local onAttackAbilities = AbilityDatabase.getAbilitiesByTrigger("ON_ATTACK")
    assertNotNil(onAttackAbilities, "Should return abilities for ON_ATTACK trigger")
    assert(#onAttackAbilities > 0, "Should have at least one ON_ATTACK ability")
    
    -- Verify STENCH is in ON_ATTACK trigger list
    local stenchFound = false
    for _, abilityId in ipairs(onAttackAbilities) do
        if abilityId == 1 then -- STENCH
            stenchFound = true
            break
        end
    end
    assert(stenchFound, "STENCH should be in ON_ATTACK trigger list")
    
    local postSummonAbilities = AbilityDatabase.getAbilitiesByTrigger("POST_SUMMON")
    assertNotNil(postSummonAbilities, "Should return abilities for POST_SUMMON trigger")
    
    -- Verify DRIZZLE is in POST_SUMMON trigger list
    local drizzleFound = false
    for _, abilityId in ipairs(postSummonAbilities) do
        if abilityId == 2 then -- DRIZZLE
            drizzleFound = true
            break
        end
    end
    assert(drizzleFound, "DRIZZLE should be in POST_SUMMON trigger list")
    
    -- Test invalid trigger
    local invalidTrigger = AbilityDatabase.getAbilitiesByTrigger("INVALID_TRIGGER")
    assertEqual(#invalidTrigger, 0, "Should return empty table for invalid trigger")
end

-- Test: Ability Data Validation
function AbilityDatabaseTests.testValidateAbility()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act & Assert: Test valid abilities
    local isValid, errorMsg = AbilityDatabase.validateAbility(0)
    assert(isValid, "NONE ability should be valid: " .. (errorMsg or ""))
    
    local isStenchValid, stenchErrorMsg = AbilityDatabase.validateAbility(1)
    assert(isStenchValid, "STENCH ability should be valid: " .. (stenchErrorMsg or ""))
    
    -- Test invalid ability ID
    local isInvalidValid, invalidErrorMsg = AbilityDatabase.validateAbility(9999)
    assert(not isInvalidValid, "Should return false for invalid ability ID")
    assertNotNil(invalidErrorMsg, "Should return error message for invalid ability")
end

-- Test: Ability Data Structure Integrity
function AbilityDatabaseTests.testAbilityDataStructure()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act: Get test abilities
    local stenchAbility = AbilityDatabase.getAbility(1)
    local drizzleAbility = AbilityDatabase.getAbility(2)
    
    -- Assert: Required fields exist
    local requiredFields = {
        "id", "name", "description", "generation", "postSummonPriority",
        "isBypassFaint", "isIgnorable", "isSuppressable", "isCopiable", 
        "isReplaceable", "triggers", "effects", "conditions", "isPassive"
    }
    
    for _, field in ipairs(requiredFields) do
        assertNotNil(stenchAbility[field], "STENCH should have field: " .. field)
        assertNotNil(drizzleAbility[field], "DRIZZLE should have field: " .. field)
    end
    
    -- Assert: Specific field values
    assertEqual(stenchAbility.generation, 3, "STENCH should be generation 3")
    assertEqual(drizzleAbility.generation, 3, "DRIZZLE should be generation 3")
    assert(not stenchAbility.isPassive, "STENCH should not be passive")
    assert(not drizzleAbility.isPassive, "DRIZZLE should not be passive")
    
    -- Assert: Effects structure
    assert(type(stenchAbility.effects) == "table", "STENCH effects should be table")
    assert(#stenchAbility.effects > 0, "STENCH should have at least one effect")
    
    local firstEffect = stenchAbility.effects[1]
    assertNotNil(firstEffect.trigger, "Effect should have trigger")
    assertNotNil(firstEffect.effect, "Effect should have effect type")
    assertNotNil(firstEffect.chance, "Effect should have chance")
end

-- Test: Database Count and Statistics
function AbilityDatabaseTests.testAbilityCount()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act: Get ability count
    local count = AbilityDatabase.getAbilityCount()
    
    -- Assert: Count is reasonable
    assert(count > 0, "Should have at least one ability")
    assert(count >= 8, "Should have at least 8 abilities from foundation data")
    
    -- Verify count matches actual abilities
    local actualCount = 0
    for _ in pairs(AbilityDatabase.getAllAbilities()) do
        actualCount = actualCount + 1
    end
    assertEqual(count, actualCount, "Count should match actual number of abilities")
end

-- Test: Trigger Index Integrity
function AbilityDatabaseTests.testTriggerIndexIntegrity()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act & Assert: Verify trigger indexes match ability data
    for abilityId, abilityData in pairs(AbilityDatabase.getAllAbilities()) do
        for _, trigger in ipairs(abilityData.triggers) do
            local triggerAbilities = AbilityDatabase.getAbilitiesByTrigger(trigger)
            
            -- Check that ability appears in trigger index
            local foundInIndex = false
            for _, indexedAbilityId in ipairs(triggerAbilities) do
                if indexedAbilityId == abilityId then
                    foundInIndex = true
                    break
                end
            end
            
            assert(foundInIndex, 
                "Ability " .. abilityId .. " with trigger " .. trigger .. " should be in trigger index")
        end
    end
end

-- Test: Effect Validation
function AbilityDatabaseTests.testEffectValidation()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act & Assert: Validate effect structures
    for abilityId, abilityData in pairs(AbilityDatabase.getAllAbilities()) do
        for _, effect in ipairs(abilityData.effects) do
            -- Check required effect fields
            assertNotNil(effect.trigger, "Effect should have trigger for ability " .. abilityId)
            assertNotNil(effect.effect, "Effect should have effect type for ability " .. abilityId)
            
            -- Verify trigger exists in ability's trigger list
            local triggerFound = false
            for _, abilityTrigger in ipairs(abilityData.triggers) do
                if abilityTrigger == effect.trigger then
                    triggerFound = true
                    break
                end
            end
            
            assert(triggerFound, 
                "Effect trigger " .. effect.trigger .. " should exist in ability triggers for " .. abilityId)
        end
    end
end

-- Test: Name Index Case Insensitivity
function AbilityDatabaseTests.testNameIndexCaseInsensitivity()
    -- Arrange: Initialize database
    AbilityDatabase.init()
    
    -- Act & Assert: Test various case combinations
    local testCases = {
        {"Stench", 1},
        {"STENCH", 1},
        {"stench", 1},
        {"StEnCh", 1},
        {"Speed Boost", 3},
        {"SPEED_BOOST", 3},
        {"speed boost", 3}
    }
    
    for _, testCase in ipairs(testCases) do
        local name, expectedId = testCase[1], testCase[2]
        local actualId = AbilityDatabase.getAbilityIdByName(name)
        assertEqual(actualId, expectedId, 
            "Name lookup for '" .. name .. "' should return " .. expectedId)
    end
end

-- Run all tests
function AbilityDatabaseTests.runAllTests()
    local tests = {
        {"Database Initialization", AbilityDatabaseTests.testInit},
        {"Get Ability by ID", AbilityDatabaseTests.testGetAbility},
        {"Get Ability ID by Name", AbilityDatabaseTests.testGetAbilityIdByName},
        {"Get Abilities by Trigger", AbilityDatabaseTests.testGetAbilitiesByTrigger},
        {"Ability Data Validation", AbilityDatabaseTests.testValidateAbility},
        {"Ability Data Structure", AbilityDatabaseTests.testAbilityDataStructure},
        {"Ability Count", AbilityDatabaseTests.testAbilityCount},
        {"Trigger Index Integrity", AbilityDatabaseTests.testTriggerIndexIntegrity},
        {"Effect Validation", AbilityDatabaseTests.testEffectValidation},
        {"Name Index Case Insensitivity", AbilityDatabaseTests.testNameIndexCaseInsensitivity}
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Ability Database Tests...")
    print("================================")
    
    for _, test in ipairs(tests) do
        local testName, testFunc = test[1], test[2]
        local success, errorMsg = pcall(testFunc)
        
        if success then
            print("✓ " .. testName)
            passed = passed + 1
        else
            print("✗ " .. testName .. ": " .. errorMsg)
            failed = failed + 1
        end
    end
    
    print("================================")
    print("Results: " .. passed .. " passed, " .. failed .. " failed")
    
    return failed == 0
end

return AbilityDatabaseTests