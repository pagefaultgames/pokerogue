-- Unit Tests for Pokemon Ability State Management
-- Tests ability state tracking, inheritance, and persistence
-- Following AAA pattern for comprehensive coverage

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

-- Import modules under test
local PokemonAbilityState = require("game-logic.pokemon.pokemon-ability-state")

-- Test suite for PokemonAbilityState
local PokemonAbilityStateTests = {}

-- Create mock Pokemon for testing
local function createMockPokemon(speciesId)
    return {
        speciesId = speciesId or 1,
        abilityState = nil
    }
end

-- Test: Pokemon Ability Initialization
function PokemonAbilityStateTests.testInitPokemonAbility()
    -- Arrange
    local pokemon = createMockPokemon(1) -- Bulbasaur
    
    -- Act
    local success = PokemonAbilityState.initPokemonAbility(pokemon, 1, 1)
    
    -- Assert
    assert(success, "Pokemon ability initialization should succeed")
    assertNotNil(pokemon.abilityState, "Pokemon should have ability state")
    assertNotNil(pokemon.abilityState.currentAbilityId, "Pokemon should have current ability ID")
    assertNotNil(pokemon.abilityState.currentAbilitySlot, "Pokemon should have current ability slot")
    assertNotNil(pokemon.abilityState.originalAbility, "Pokemon should have original ability")
    assertNotNil(pokemon.abilityState.availableAbilities, "Pokemon should have available abilities")
end

-- Test: Get Current Ability
function PokemonAbilityStateTests.testGetCurrentAbility()
    -- Arrange
    local pokemon = createMockPokemon(1)
    PokemonAbilityState.initPokemonAbility(pokemon, 1, 1)
    
    -- Act
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    
    -- Assert
    assertNotNil(currentAbility, "Should return current ability")
    assertNotNil(currentAbility.id, "Ability should have ID")
    assertNotNil(currentAbility.slot, "Ability should have slot")
    assertEqual(currentAbility.isTemporary, false, "Initial ability should not be temporary")
end

-- Test: Get Current Ability - No State
function PokemonAbilityStateTests.testGetCurrentAbilityNoState()
    -- Arrange
    local pokemon = createMockPokemon(1)
    -- Don't initialize ability state
    
    -- Act
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    
    -- Assert
    assertNil(currentAbility, "Should return nil when no ability state")
end

-- Test: Change Ability - Permanent
function PokemonAbilityStateTests.testChangeAbilityPermanent()
    -- Arrange
    local pokemon = createMockPokemon(1)
    PokemonAbilityState.initPokemonAbility(pokemon, 1, 1)
    local originalAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    local newAbilityId = 2 -- DRIZZLE
    
    -- Act
    local success, errorMsg = PokemonAbilityState.changeAbility(pokemon, newAbilityId, "test", false)
    
    -- Assert
    assert(success, "Ability change should succeed: " .. (errorMsg or ""))
    
    local newAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    assertEqual(newAbility.id, newAbilityId, "New ability ID should be set")
    assertEqual(newAbility.isTemporary, false, "New ability should be permanent")
    
    -- Check history
    assert(#pokemon.abilityState.abilityHistory > 0, "Ability change should be recorded in history")
    local historyEntry = pokemon.abilityState.abilityHistory[#pokemon.abilityState.abilityHistory]
    assertEqual(historyEntry.previousAbility, originalAbility.id, "History should record previous ability")
    assertEqual(historyEntry.newAbility, newAbilityId, "History should record new ability")
    assertEqual(historyEntry.source, "test", "History should record source")
end

-- Test: Change Ability - Temporary
function PokemonAbilityStateTests.testChangeAbilityTemporary()
    -- Arrange
    local pokemon = createMockPokemon(1)
    PokemonAbilityState.initPokemonAbility(pokemon, 1, 1)
    local originalAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    local newAbilityId = 2 -- DRIZZLE
    
    -- Act
    local success, errorMsg = PokemonAbilityState.changeAbility(pokemon, newAbilityId, "test", true)
    
    -- Assert
    assert(success, "Temporary ability change should succeed: " .. (errorMsg or ""))
    
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    assertEqual(currentAbility.id, newAbilityId, "Current ability should be temporary ability")
    assertEqual(currentAbility.isTemporary, true, "Ability should be marked as temporary")
    assertEqual(pokemon.abilityState.temporaryAbility, newAbilityId, "Temporary ability should be set")
    assertEqual(pokemon.abilityState.currentAbilityId, originalAbility.id, "Original ability should be preserved")
end

-- Test: Remove Temporary Ability
function PokemonAbilityStateTests.testRemoveTemporaryAbility()
    -- Arrange
    local pokemon = createMockPokemon(1)
    PokemonAbilityState.initPokemonAbility(pokemon, 1, 1)
    local originalAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    
    -- Set temporary ability first
    PokemonAbilityState.changeAbility(pokemon, 2, "test", true)
    
    -- Act
    local success = PokemonAbilityState.removeTemporaryAbility(pokemon)
    
    -- Assert
    assert(success, "Removing temporary ability should succeed")
    
    local currentAbility = PokemonAbilityState.getCurrentAbility(pokemon)
    assertEqual(currentAbility.id, originalAbility.id, "Should revert to original ability")
    assertEqual(currentAbility.isTemporary, false, "Should not be temporary")
    assertNil(pokemon.abilityState.temporaryAbility, "Temporary ability should be cleared")
end

-- Test: Can Have Ability
function PokemonAbilityStateTests.testCanHaveAbility()
    -- Arrange
    local pokemon = createMockPokemon(1) -- Bulbasaur
    PokemonAbilityState.initPokemonAbility(pokemon, 1)
    
    -- Act & Assert: Valid abilities for Bulbasaur
    local canHave1, slot1 = PokemonAbilityState.canHaveAbility(pokemon, 65) -- OVERGROW
    assert(canHave1, "Bulbasaur should be able to have Overgrow")
    assertEqual(slot1, 1, "Overgrow should be in slot 1")
    
    local canHave2, slot2 = PokemonAbilityState.canHaveAbility(pokemon, 34) -- CHLOROPHYLL
    assert(canHave2, "Bulbasaur should be able to have Chlorophyll (hidden)")
    assertEqual(slot2, 4, "Chlorophyll should be in hidden slot")
    
    -- Invalid ability
    local canHave3, reason = PokemonAbilityState.canHaveAbility(pokemon, 2) -- DRIZZLE
    assert(not canHave3, "Bulbasaur should not be able to have Drizzle")
    assertNotNil(reason, "Should provide reason for inability")
end

-- Test: Get Available Abilities
function PokemonAbilityStateTests.testGetAvailableAbilities()
    -- Arrange
    local pokemon = createMockPokemon(1) -- Bulbasaur
    PokemonAbilityState.initPokemonAbility(pokemon, 1)
    
    -- Act: Get abilities without hidden
    local abilities = PokemonAbilityState.getAvailableAbilities(pokemon, false)
    
    -- Assert
    assert(#abilities > 0, "Should have available abilities")
    
    -- Check that no hidden abilities are included
    for _, ability in ipairs(abilities) do
        assert(not ability.isHidden, "Should not include hidden abilities when not requested")
    end
    
    -- Act: Get abilities with hidden
    local abilitiesWithHidden = PokemonAbilityState.getAvailableAbilities(pokemon, true)
    
    -- Assert
    assert(#abilitiesWithHidden >= #abilities, "Should have same or more abilities with hidden included")
    
    -- Check for hidden ability presence
    local hasHidden = false
    for _, ability in ipairs(abilitiesWithHidden) do
        if ability.isHidden then
            hasHidden = true
            break
        end
    end
    -- Note: This test assumes Bulbasaur has a hidden ability
end

-- Test: Ability Suppression
function PokemonAbilityStateTests.testAbilitySuppression()
    -- Arrange
    local pokemon = createMockPokemon(1)
    PokemonAbilityState.initPokemonAbility(pokemon, 1)
    
    -- Act: Suppress ability
    local success = PokemonAbilityState.suppressAbility(pokemon, "test_source", 3)
    
    -- Assert
    assert(success, "Ability suppression should succeed")
    assert(PokemonAbilityState.isAbilitySuppressed(pokemon), "Pokemon ability should be suppressed")
    assertEqual(pokemon.abilityState.suppressionSource, "test_source", "Suppression source should be recorded")
    assertEqual(pokemon.abilityState.suppressionTurns, 3, "Suppression turns should be set")
    
    -- Act: Remove suppression
    local removeSuccess = PokemonAbilityState.removeAbilitySuppression(pokemon)
    
    -- Assert
    assert(removeSuccess, "Removing suppression should succeed")
    assert(not PokemonAbilityState.isAbilitySuppressed(pokemon), "Pokemon ability should not be suppressed")
    assertEqual(pokemon.abilityState.suppressionTurns, 0, "Suppression turns should be reset")
end

-- Test: Update Suppression Turns
function PokemonAbilityStateTests.testUpdateSuppressionTurns()
    -- Arrange
    local pokemon = createMockPokemon(1)
    PokemonAbilityState.initPokemonAbility(pokemon, 1)
    PokemonAbilityState.suppressAbility(pokemon, "test", 2)
    
    -- Act: Update turns (first turn)
    local ended1 = PokemonAbilityState.updateSuppressionTurns(pokemon)
    
    -- Assert
    assert(not ended1, "Suppression should not end after first turn")
    assertEqual(pokemon.abilityState.suppressionTurns, 1, "Should have 1 turn remaining")
    assert(PokemonAbilityState.isAbilitySuppressed(pokemon), "Should still be suppressed")
    
    -- Act: Update turns (second turn)
    local ended2 = PokemonAbilityState.updateSuppressionTurns(pokemon)
    
    -- Assert
    assert(ended2, "Suppression should end after second turn")
    assertEqual(pokemon.abilityState.suppressionTurns, 0, "Should have 0 turns remaining")
    assert(not PokemonAbilityState.isAbilitySuppressed(pokemon), "Should no longer be suppressed")
end

-- Test: Breeding Inheritance Setup
function PokemonAbilityStateTests.testSetupBreedingInheritance()
    -- Arrange
    local parent1 = createMockPokemon(1)
    local parent2 = createMockPokemon(1)
    local offspring = createMockPokemon(1)
    
    PokemonAbilityState.initPokemonAbility(parent1, 1, 1)
    PokemonAbilityState.initPokemonAbility(parent2, 1, 2)
    
    -- Act
    local success = PokemonAbilityState.setupBreedingInheritance(offspring, parent1, parent2)
    
    -- Assert
    assert(success, "Breeding inheritance setup should succeed")
    assertNotNil(offspring.abilityState, "Offspring should have ability state")
    assertNotNil(offspring.abilityState.inheritanceData, "Offspring should have inheritance data")
    assertNotNil(offspring.abilityState.inheritanceData.parentAbilities, "Should record parent abilities")
    
    local currentAbility = PokemonAbilityState.getCurrentAbility(offspring)
    assertNotNil(currentAbility, "Offspring should have inherited ability")
end

-- Test: Breeding Compatibility Validation
function PokemonAbilityStateTests.testValidateBreedingCompatibility()
    -- Arrange: Test with Bulbasaur (species 1) abilities
    local species1Id = 1
    local ability1Id = 65  -- OVERGROW (valid for Bulbasaur)
    local species2Id = 1
    local ability2Id = 34  -- CHLOROPHYLL (valid for Bulbasaur, hidden)
    
    -- Act
    local isCompatible = PokemonAbilityState.validateBreedingCompatibility(
        species1Id, ability1Id, species2Id, ability2Id
    )
    
    -- Assert
    assert(isCompatible, "Compatible species and abilities should return true")
    
    -- Test with incompatible ability
    local incompatibleAbility = 2 -- DRIZZLE (not available to Bulbasaur)
    local isIncompatible = PokemonAbilityState.validateBreedingCompatibility(
        species1Id, incompatibleAbility, species2Id, ability2Id
    )
    
    assert(not isIncompatible, "Incompatible abilities should return false")
end

-- Test: Get and Restore Ability State Data
function PokemonAbilityStateTests.testAbilityStatePersistence()
    -- Arrange
    local pokemon = createMockPokemon(1)
    PokemonAbilityState.initPokemonAbility(pokemon, 1, 1)
    
    -- Make some changes to create interesting state
    PokemonAbilityState.changeAbility(pokemon, 2, "test_change", false)
    PokemonAbilityState.suppressAbility(pokemon, "test_suppress", 3)
    
    -- Act: Get state data
    local stateData = PokemonAbilityState.getAbilityStateData(pokemon)
    
    -- Assert: State data structure
    assertNotNil(stateData, "Should return state data")
    assertNotNil(stateData.currentAbilityId, "Should have current ability ID")
    assertNotNil(stateData.originalAbility, "Should have original ability")
    assert(stateData.abilitySuppressed, "Should preserve suppression state")
    assertEqual(stateData.suppressionTurns, 3, "Should preserve suppression turns")
    
    -- Create new Pokemon and restore state
    local newPokemon = createMockPokemon(1)
    local restoreSuccess = PokemonAbilityState.restoreAbilityStateData(newPokemon, stateData, 1)
    
    -- Assert: State restoration
    assert(restoreSuccess, "State restoration should succeed")
    assertEqual(newPokemon.abilityState.currentAbilityId, stateData.currentAbilityId, 
        "Should restore current ability ID")
    assertEqual(newPokemon.abilityState.suppressionTurns, 3, "Should restore suppression turns")
    assert(PokemonAbilityState.isAbilitySuppressed(newPokemon), "Should restore suppression state")
end

-- Run all tests
function PokemonAbilityStateTests.runAllTests()
    local tests = {
        {"Pokemon Ability Initialization", PokemonAbilityStateTests.testInitPokemonAbility},
        {"Get Current Ability", PokemonAbilityStateTests.testGetCurrentAbility},
        {"Get Current Ability - No State", PokemonAbilityStateTests.testGetCurrentAbilityNoState},
        {"Change Ability - Permanent", PokemonAbilityStateTests.testChangeAbilityPermanent},
        {"Change Ability - Temporary", PokemonAbilityStateTests.testChangeAbilityTemporary},
        {"Remove Temporary Ability", PokemonAbilityStateTests.testRemoveTemporaryAbility},
        {"Can Have Ability", PokemonAbilityStateTests.testCanHaveAbility},
        {"Get Available Abilities", PokemonAbilityStateTests.testGetAvailableAbilities},
        {"Ability Suppression", PokemonAbilityStateTests.testAbilitySuppression},
        {"Update Suppression Turns", PokemonAbilityStateTests.testUpdateSuppressionTurns},
        {"Setup Breeding Inheritance", PokemonAbilityStateTests.testSetupBreedingInheritance},
        {"Validate Breeding Compatibility", PokemonAbilityStateTests.testValidateBreedingCompatibility},
        {"Ability State Persistence", PokemonAbilityStateTests.testAbilityStatePersistence}
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Pokemon Ability State Tests...")
    print("=====================================")
    
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
    
    print("=====================================")
    print("Results: " .. passed .. " passed, " .. failed .. " failed")
    
    return failed == 0
end

return PokemonAbilityStateTests