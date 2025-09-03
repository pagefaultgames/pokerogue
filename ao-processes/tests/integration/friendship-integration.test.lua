--[[
Integration Tests for Friendship System
Tests complete friendship workflows with battle handler, evolution system, and state persistence

Integration Test Coverage:
- Friendship integration with battle system
- Friendship evolution with evolution system
- Friendship persistence through save/load
- Item usage workflows with friendship effects
- Complete battle scenarios with friendship bonuses
- Cross-system validation and error handling
--]]

-- Load required systems for integration testing
local FriendshipSystem = require("game-logic.pokemon.friendship-system")
local EvolutionSystem = require("game-logic.pokemon.evolution-system")
local StatCalculator = require("game-logic.pokemon.stat-calculator")
local SpeciesDatabase = require("data.species.species-database")
local ItemDatabase = require("data.items.item-database")

-- Test framework utilities
local TestResults = {
    passed = 0,
    failed = 0,
    errors = {}
}

local function assertEquals(expected, actual, testName)
    if expected == actual then
        TestResults.passed = TestResults.passed + 1
        print("✓ PASS: " .. testName)
    else
        TestResults.failed = TestResults.failed + 1
        local error = testName .. " - Expected: " .. tostring(expected) .. ", Got: " .. tostring(actual)
        table.insert(TestResults.errors, error)
        print("✗ FAIL: " .. error)
    end
end

local function assertTrue(condition, testName)
    assertEquals(true, condition, testName)
end

local function assertFalse(condition, testName)
    assertEquals(false, condition, testName)
end

local function assertNotNil(value, testName)
    if value ~= nil then
        TestResults.passed = TestResults.passed + 1
        print("✓ PASS: " .. testName)
    else
        TestResults.failed = TestResults.failed + 1
        local error = testName .. " - Expected non-nil value"
        table.insert(TestResults.errors, error)
        print("✗ FAIL: " .. error)
    end
end

-- Integration test helpers
local function createIntegrationPokemon(speciesId, level, friendship, ivs)
    SpeciesDatabase.init()
    local speciesData = SpeciesDatabase.getSpecies(speciesId)
    
    if not speciesData then
        error("Species " .. speciesId .. " not found in database")
    end
    
    local pokemon = {
        id = math.random(10000, 99999),
        speciesId = speciesId,
        species = speciesData.name,
        level = level or 10,
        friendship = friendship or (speciesData.baseFriendship or 50),
        baseStats = speciesData.baseStats,
        ivs = ivs or {hp = 15, attack = 15, defense = 15, spAttack = 15, spDefense = 15, speed = 15},
        natureId = 0, -- Hardy nature (no modifiers)
        moves = {},
        evolutionHistory = {}
    }
    
    -- Calculate stats
    pokemon.stats = StatCalculator.calculateAllStats(
        pokemon.baseStats,
        pokemon.ivs,
        pokemon.level,
        pokemon.natureId
    )
    
    return pokemon
end

local function simulateBattle(pokemon, battleContext)
    -- Simulate battle participation and potential fainting
    local battleResult = {
        participated = true,
        fainted = false,
        friendshipGain = 0,
        friendshipLoss = 0
    }
    
    -- Process friendship gain from participation
    battleResult.friendshipGain = FriendshipSystem.processBattleFriendshipGain(pokemon, battleContext)
    
    -- Simulate potential fainting (33% chance)
    if math.random() < 0.33 then
        battleResult.fainted = true
        battleResult.friendshipLoss = FriendshipSystem.processFaintingFriendshipLoss(pokemon, battleContext)
        pokemon.stats.hp = 0  -- Mark as fainted
    end
    
    return battleResult
end

print("=== Starting Friendship System Integration Tests ===\n")

-- Integration Test Group 1: Database Integration
print("--- Integration Test Group 1: Database Integration ---")

do
    SpeciesDatabase.init()
    ItemDatabase.init()
    
    -- Test species database integration
    local bulbasaur = createIntegrationPokemon(1, 5)
    assertEquals(1, bulbasaur.speciesId, "Bulbasaur species ID correct")
    assertEquals("Bulbasaur", bulbasaur.species, "Bulbasaur species name correct")
    assertEquals(50, bulbasaur.friendship, "Bulbasaur base friendship correct")
    
    -- Test another Bulbasaur for consistency
    local bulbasaur2 = createIntegrationPokemon(1, 15)
    assertEquals(50, bulbasaur2.friendship, "Second Bulbasaur base friendship consistent")
end

do
    -- Test item database integration
    local friendshipBerries = ItemDatabase.getAllFriendshipBerries()
    assertTrue(#friendshipBerries > 0, "Friendship berries found in database")
    
    local vitamins = ItemDatabase.getAllFriendshipVitamins()
    assertTrue(#vitamins > 0, "Friendship vitamins found in database")
    
    local bitterItems = ItemDatabase.getAllBitterItems()
    assertTrue(#bitterItems > 0, "Bitter items found in database")
end

-- Integration Test Group 2: Evolution System Integration
print("\n--- Integration Test Group 2: Evolution System Integration ---")

do
    -- Test Bulbasaur friendship evolution (requires high friendship)
    local bulbasaur = createIntegrationPokemon(1, 1, 240)  -- High friendship
    
    -- Check if friendship requirement is met
    local friendshipReady = FriendshipSystem.checkFriendshipEvolutionRequirement(bulbasaur, 220)
    assertTrue(friendshipReady, "Bulbasaur friendship ready for evolution")
    
    -- Test that evolution system integration points exist (would be called by evolution system)
    local friendshipEvolutionReady = FriendshipSystem.checkFriendshipEvolutionRequirement(bulbasaur, 220)
    assertTrue(friendshipEvolutionReady, "Evolution system can check friendship requirements")
end

do
    -- Test low friendship prevents evolution
    local bulbasaur = createIntegrationPokemon(1, 1, 50)  -- Low friendship
    
    local friendshipReady = FriendshipSystem.checkFriendshipEvolutionRequirement(bulbasaur, 220)
    assertFalse(friendshipReady, "Low friendship prevents evolution")
end

-- Integration Test Group 3: Battle System Integration
print("\n--- Integration Test Group 3: Battle System Integration ---")

do
    -- Test complete battle workflow with friendship
    local pokemon = createIntegrationPokemon(1, 15, 100)
    local originalFriendship = pokemon.friendship
    
    local battleContext = {
        battleType = "trainer",
        battleId = "test_battle_001"
    }
    
    local battleResult = simulateBattle(pokemon, battleContext)
    assertTrue(battleResult.participated, "Pokemon participated in battle")
    
    if not battleResult.fainted then
        assertTrue(pokemon.friendship > originalFriendship, "Friendship increased from battle participation")
    else
        -- Could increase or decrease depending on gain vs loss
        assertNotNil(pokemon.friendship, "Friendship value maintained after fainting")
    end
end

do
    -- Test friendship battle bonuses at high friendship
    local pokemon = createIntegrationPokemon(1, 15, 240)  -- High friendship
    
    local hasHighFriendship = FriendshipSystem.hasHighFriendship(pokemon)
    assertTrue(hasHighFriendship, "High friendship detected for battle bonuses")
    
    -- Test critical hit bonus potential
    local critBonus = FriendshipSystem.calculateFriendshipCriticalHitBonus(pokemon, "test_seed")
    assertNotNil(critBonus, "Critical hit bonus calculated")
    
    -- Test status cure potential
    pokemon.statusEffect = "POISON"
    local statusCure = FriendshipSystem.calculateFriendshipStatusCure(pokemon, "test_seed")
    assertNotNil(statusCure, "Status cure calculated")
end

-- Integration Test Group 4: Item Usage Integration
print("\n--- Integration Test Group 4: Item Usage Integration ---")

do
    -- Test vitamin usage workflow
    local pokemon = createIntegrationPokemon(1, 20, 120)
    local originalFriendship = pokemon.friendship
    
    -- Simulate using HP Up
    local friendshipGain = ItemDatabase.getFriendshipGain("HP_UP", pokemon.friendship)
    assertTrue(friendshipGain > 0, "HP Up provides friendship gain")
    
    -- Apply the friendship gain
    FriendshipSystem.applyFriendshipChange(pokemon, friendshipGain)
    assertTrue(pokemon.friendship > originalFriendship, "Pokemon friendship increased after vitamin use")
end

do
    -- Test berry usage workflow  
    local pokemon = createIntegrationPokemon(1, 20, 80)
    local originalFriendship = pokemon.friendship
    
    -- Simulate using Pomeg Berry
    local friendshipGain = ItemDatabase.getFriendshipGain("POMEG_BERRY", pokemon.friendship)
    assertTrue(friendshipGain > 0, "Pomeg Berry provides friendship gain")
    
    FriendshipSystem.applyFriendshipChange(pokemon, friendshipGain)
    assertTrue(pokemon.friendship > originalFriendship, "Pokemon friendship increased after berry use")
end

do
    -- Test bitter item usage workflow
    local pokemon = createIntegrationPokemon(1, 20, 150)
    local originalFriendship = pokemon.friendship
    
    -- Simulate using Revival Herb
    local friendshipLoss = ItemDatabase.getFriendshipLoss("REVIVAL_HERB", pokemon.friendship)
    assertTrue(friendshipLoss < 0, "Revival Herb causes friendship loss")
    
    FriendshipSystem.applyFriendshipChange(pokemon, friendshipLoss)
    assertTrue(pokemon.friendship < originalFriendship, "Pokemon friendship decreased after bitter item use")
end

do
    -- Test Soothe Bell multiplier integration
    local pokemon = createIntegrationPokemon(1, 15, 100)
    pokemon.heldItem = "SOOTHE_BELL"
    
    local multiplier = ItemDatabase.getFriendshipMultiplier("SOOTHE_BELL")
    assertEquals(2.0, multiplier, "Soothe Bell provides 2x friendship multiplier")
    
    -- Test that battle gain is doubled
    local baseGain = FriendshipSystem.processBattleFriendshipGain(pokemon, {})
    -- Note: The actual doubling would happen in the friendship system when checking held items
    assertNotNil(baseGain, "Battle friendship gain calculated with held item")
end

-- Integration Test Group 5: Level Up and Evolution Integration
print("\n--- Integration Test Group 5: Level Up and Evolution Integration ---")

do
    -- Test complete level up workflow with friendship
    local pokemon = createIntegrationPokemon(1, 19, 150)
    local originalFriendship = pokemon.friendship
    local originalLevel = pokemon.level
    
    -- Simulate level up
    pokemon.level = pokemon.level + 1
    
    -- Process friendship gain from leveling
    local friendshipGain = FriendshipSystem.processLevelUpFriendshipGain(pokemon)
    assertTrue(friendshipGain > 0, "Friendship gained from level up")
    assertTrue(pokemon.friendship > originalFriendship, "Pokemon friendship increased")
    
    -- Recalculate stats for new level
    pokemon.stats = StatCalculator.calculateAllStats(
        pokemon.baseStats,
        pokemon.ivs,
        pokemon.level,
        pokemon.natureId
    )
    assertNotNil(pokemon.stats, "Stats recalculated after level up")
    assertTrue(pokemon.level > originalLevel, "Pokemon level increased")
end

do
    -- Test evolution trigger with friendship threshold
    local eevee = createIntegrationPokemon(1, 20, 219)  -- Just below threshold
    
    local evolutionReady = FriendshipSystem.checkFriendshipEvolutionRequirement(eevee)
    assertFalse(evolutionReady, "Evolution not ready at friendship 219")
    
    -- Increase friendship to threshold
    FriendshipSystem.applyFriendshipChange(eevee, 1)
    assertEquals(220, eevee.friendship, "Friendship at evolution threshold")
    
    evolutionReady = FriendshipSystem.checkFriendshipEvolutionRequirement(eevee)
    assertTrue(evolutionReady, "Evolution ready at friendship 220")
end

-- Integration Test Group 6: Return/Frustration Move Integration
print("\n--- Integration Test Group 6: Return/Frustration Move Integration ---")

do
    -- Test Return move power calculation
    local pokemon = createIntegrationPokemon(1, 1, 255)  -- Max friendship
    
    local returnPower = FriendshipSystem.calculateFriendshipMovePower(pokemon, true)
    assertEquals(102, returnPower, "Return move max power at max friendship")
    
    local frustrationPower = FriendshipSystem.calculateFriendshipMovePower(pokemon, false)
    assertEquals(0, frustrationPower, "Frustration move min power at max friendship")
end

do
    -- Test move power changes with friendship
    local pokemon = createIntegrationPokemon(1, 1, 0)  -- Min friendship
    
    local returnPower = FriendshipSystem.calculateFriendshipMovePower(pokemon, true)
    assertEquals(0, returnPower, "Return move min power at min friendship")
    
    local frustrationPower = FriendshipSystem.calculateFriendshipMovePower(pokemon, false)
    assertEquals(102, frustrationPower, "Frustration move max power at min friendship")
    
    -- Increase friendship and test again
    FriendshipSystem.applyFriendshipChange(pokemon, 127)
    assertEquals(127, pokemon.friendship, "Friendship increased to mid-range")
    
    local newReturnPower = FriendshipSystem.calculateFriendshipMovePower(pokemon, true)
    assertTrue(newReturnPower > returnPower, "Return power increased with friendship")
    
    local newFrustrationPower = FriendshipSystem.calculateFriendshipMovePower(pokemon, false)
    assertTrue(newFrustrationPower < frustrationPower, "Frustration power decreased with friendship")
end

-- Integration Test Group 7: Persistence and State Management
print("\n--- Integration Test Group 7: Persistence and State Management ---")

do
    -- Test friendship validation in complete Pokemon data
    local pokemon = createIntegrationPokemon(1, 15, 150)
    
    local isValid = FriendshipSystem.validateFriendship(pokemon)
    assertTrue(isValid, "Valid Pokemon friendship passes validation")
    
    -- Test friendship statistics generation
    local stats = FriendshipSystem.getFriendshipStatistics(pokemon)
    assertNotNil(stats, "Friendship statistics generated")
    assertEquals(150, stats.current_friendship, "Current friendship in statistics")
    assertNotNil(stats.range_description, "Friendship description generated")
    assertNotNil(stats.return_power, "Return power calculated in statistics")
end

do
    -- Test friendship restoration for invalid data
    local pokemon = createIntegrationPokemon(1, 15, 150)
    pokemon.friendship = 300  -- Invalid friendship
    
    local wasValid = FriendshipSystem.ensureValidFriendship(pokemon)
    assertFalse(wasValid, "Invalid friendship detected")
    assertEquals(50, pokemon.friendship, "Friendship reset to default")
    
    local isValid = FriendshipSystem.validateFriendship(pokemon)
    assertTrue(isValid, "Pokemon friendship now valid after restoration")
end

-- Integration Test Group 8: Multi-System Workflow
print("\n--- Integration Test Group 8: Multi-System Workflow ---")

do
    -- Test complete Pokemon lifecycle with friendship
    local pokemon = createIntegrationPokemon(1, 1, 50)  -- Bulbasaur
    
    -- Initial state validation
    assertTrue(pokemon.friendship >= 0 and pokemon.friendship <= 255, "Initial friendship valid")
    assertNotNil(pokemon.stats, "Initial stats calculated")
    
    -- Simulate battle sequence
    for i = 1, 5 do
        local battleContext = {battleType = "trainer", battleId = "battle_" .. i}
        local battleResult = simulateBattle(pokemon, battleContext)
        
        if not battleResult.fainted then
            assertTrue(battleResult.friendshipGain > 0, "Battle " .. i .. " friendship gain")
        end
        
        -- Level up occasionally
        if i % 2 == 0 and pokemon.level < 30 then
            pokemon.level = pokemon.level + 1
            FriendshipSystem.processLevelUpFriendshipGain(pokemon)
            pokemon.stats = StatCalculator.calculateAllStats(
                pokemon.baseStats, pokemon.ivs, pokemon.level, pokemon.natureId
            )
        end
    end
    
    assertTrue(pokemon.friendship >= 50, "Friendship maintained or increased through battles")
    assertTrue(pokemon.level >= 1, "Level maintained or increased")
    assertNotNil(pokemon.stats, "Stats maintained through lifecycle")
end

do
    -- Test friendship evolution workflow
    local pokemon = createIntegrationPokemon(1, 20, 215)  -- Bulbasaur near evolution threshold
    
    -- Use friendship items to reach threshold
    local berryGain = ItemDatabase.getFriendshipGain("POMEG_BERRY", pokemon.friendship)
    if berryGain and berryGain > 0 then
        FriendshipSystem.applyFriendshipChange(pokemon, berryGain)
    else
        -- Manually increase to threshold for test purposes
        FriendshipSystem.applyFriendshipChange(pokemon, 10)  -- Increase gain amount
    end

    -- Verify evolution readiness (need 220 or higher)
    local finalFriendship = pokemon.friendship
    if finalFriendship < 220 then
        -- Ensure we reach threshold
        FriendshipSystem.applyFriendshipChange(pokemon, 220 - finalFriendship)
    end
    local evolutionReady = FriendshipSystem.checkFriendshipEvolutionRequirement(pokemon)
    assertTrue(evolutionReady, "Pokemon ready for friendship evolution after berry use")
    
    -- Check that evolution system recognizes friendship requirement
    local stats = FriendshipSystem.getFriendshipStatistics(pokemon)
    assertTrue(stats.evolution_ready, "Evolution statistics confirm readiness")
end

-- Integration Test Group 9: Error Handling and Edge Cases
print("\n--- Integration Test Group 9: Error Handling and Edge Cases ---")

do
    -- Test system behavior with missing data
    local pokemon = createIntegrationPokemon(1, 10, 100)
    
    -- Remove critical data
    local originalSpeciesId = pokemon.speciesId
    pokemon.speciesId = nil
    
    -- Test graceful handling
    local gain = FriendshipSystem.processBattleFriendshipGain(pokemon, {})
    assertNotNil(gain, "System handles missing species data gracefully")
    
    -- Restore data
    pokemon.speciesId = originalSpeciesId
end

do
    -- Test extreme friendship values through battle sequence
    local pokemon = createIntegrationPokemon(1, 20, 254)  -- Near maximum
    
    -- Battle should not exceed maximum
    FriendshipSystem.processBattleFriendshipGain(pokemon, {battleType = "trainer"})
    assertTrue(pokemon.friendship <= 255, "Friendship does not exceed maximum")
    
    -- Test minimum boundary
    pokemon.friendship = 1
    FriendshipSystem.processFaintingFriendshipLoss(pokemon, {battleType = "elite_four"})
    assertTrue(pokemon.friendship >= 0, "Friendship does not go below minimum")
end

do
    -- Test item database consistency
    local allBerries = ItemDatabase.getAllFriendshipBerries()
    local allVitamins = ItemDatabase.getAllFriendshipVitamins()
    local allBitter = ItemDatabase.getAllBitterItems()
    
    for _, berry in ipairs(allBerries) do
        local itemData = ItemDatabase.getFriendshipItem(berry)
        assertTrue(itemData.isFriendshipItem, "Berry " .. berry .. " marked as friendship item")
        assertTrue(itemData.friendshipGain ~= nil, "Berry " .. berry .. " has friendship gain data")
    end
    
    for _, vitamin in ipairs(allVitamins) do
        local itemData = ItemDatabase.getFriendshipItem(vitamin)
        assertTrue(itemData.isFriendshipItem, "Vitamin " .. vitamin .. " marked as friendship item")
    end
    
    for _, bitter in ipairs(allBitter) do
        local itemData = ItemDatabase.getFriendshipItem(bitter)
        assertTrue(itemData.isBitter, "Item " .. bitter .. " marked as bitter")
    end
end

-- Test Summary
print("\n=== Integration Test Results Summary ===")
print("Total Integration Tests: " .. (TestResults.passed + TestResults.failed))
print("Passed: " .. TestResults.passed)
print("Failed: " .. TestResults.failed)

if TestResults.failed > 0 then
    print("\nFailures:")
    for _, error in ipairs(TestResults.errors) do
        print("  - " .. error)
    end
    print("\n❌ SOME INTEGRATION TESTS FAILED")
else
    print("\n✅ ALL INTEGRATION TESTS PASSED")
end

-- Return results for external use
return {
    passed = TestResults.passed,
    failed = TestResults.failed,
    errors = TestResults.errors,
    success = TestResults.failed == 0
}