--[[
Unit Tests for Party Manager
Tests party composition, validation, and Pokemon management
--]]

local lu = require("tests.luaunit")

-- Mock PokemonValidator
local MockPokemonValidator = {
    validatePokemon = function(pokemon)
        if not pokemon or not pokemon.id or not pokemon.speciesId then
            return false, "Invalid Pokemon data"
        end
        if pokemon.id == 999 then
            return false, "Test invalid Pokemon"
        end
        return true
    end
}

package.loaded["pokemon.components.pokemon-validator"] = MockPokemonValidator

-- Load the module under test
local PartyManager = require("pokemon.components.party-manager")

-- Test suite
TestPartyManager = {}

-- Helper function to create test Pokemon
local function createTestPokemon(id, speciesId, species, level, hp, maxHp)
    return {
        id = id,
        speciesId = speciesId,
        species = species or "Test Pokemon",
        level = level or 10,
        hp = hp or 50,
        maxHp = maxHp or 50,
        stats = {hp = maxHp or 50, attack = 50, defense = 50, spAttack = 50, spDefense = 50, speed = 50},
        ivs = {hp = 15, attack = 15, defense = 15, spAttack = 15, spDefense = 15, speed = 15},
        nature = 1,
        playerId = "test_player"
    }
end

function TestPartyManager:setUp()
    -- Initialize manager for each test
    PartyManager.initialize()
end

function TestPartyManager:tearDown()
    -- Clean up after each test
    PartyManager._internal.playerParties = {}
end

-- Party Creation and Access Tests

function TestPartyManager:testGetOrCreateParty()
    -- Test creating new party
    local party, error = PartyManager.getOrCreateParty("player1")
    
    lu.assertNotNil(party, "Party should be created")
    lu.assertNil(error, "No error should occur")
    lu.assertEquals(party.playerId, "player1")
    lu.assertEquals(#party.party, 0)
    lu.assertFalse(party.battleReady)
    
    -- Test getting existing party
    local sameParty, _ = PartyManager.getOrCreateParty("player1")
    lu.assertEquals(party, sameParty, "Should return same party object")
end

function TestPartyManager:testGetOrCreatePartyInvalidPlayer()
    -- Test with nil player ID
    local party, error = PartyManager.getOrCreateParty(nil)
    
    lu.assertNil(party)
    lu.assertNotNil(error)
end

function TestPartyManager:testGetParty()
    -- Create party first
    PartyManager.getOrCreateParty("player1")
    
    -- Test getting existing party
    local party = PartyManager.getParty("player1")
    lu.assertNotNil(party)
    lu.assertEquals(party.playerId, "player1")
    
    -- Test getting non-existent party
    local noParty = PartyManager.getParty("nonexistent")
    lu.assertNil(noParty)
end

function TestPartyManager:testGetPartyPokemon()
    -- Create party and add Pokemon
    PartyManager.getOrCreateParty("player1")
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    PartyManager.addPokemonToParty("player1", pokemon)
    
    -- Test getting party Pokemon
    local partyPokemon = PartyManager.getPartyPokemon("player1")
    lu.assertEquals(#partyPokemon, 1)
    lu.assertEquals(partyPokemon[1].id, 1)
    
    -- Test getting Pokemon from empty party
    local emptyPokemon = PartyManager.getPartyPokemon("player2")
    lu.assertEquals(#emptyPokemon, 0)
end

-- Pokemon Addition Tests

function TestPartyManager:testAddPokemonToParty()
    -- Create test Pokemon
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    
    -- Test adding Pokemon to party
    local success, partyData = PartyManager.addPokemonToParty("player1", pokemon)
    
    lu.assertTrue(success)
    lu.assertNotNil(partyData)
    lu.assertEquals(#partyData.party, 1)
    lu.assertEquals(partyData.party[1].id, 1)
    lu.assertTrue(partyData.battleReady, "Party should be battle ready with healthy Pokemon")
end

function TestPartyManager:testAddPokemonToSpecificSlot()
    -- Create test Pokemon
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    
    -- Test adding Pokemon to specific slot
    local success, partyData = PartyManager.addPokemonToParty("player1", pokemon, 3)
    
    lu.assertTrue(success)
    lu.assertNotNil(partyData)
    lu.assertEquals(partyData.party[3].id, 1)
end

function TestPartyManager:testAddPokemonInvalidSlot()
    -- Create test Pokemon
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    
    -- Test adding Pokemon to invalid slot
    local success1, error1 = PartyManager.addPokemonToParty("player1", pokemon, 0)
    local success2, error2 = PartyManager.addPokemonToParty("player1", pokemon, 7)
    
    lu.assertFalse(success1)
    lu.assertFalse(success2)
    lu.assertNotNil(error1)
    lu.assertNotNil(error2)
end

function TestPartyManager:testAddPokemonPartyFull()
    -- Fill party to maximum capacity
    for i = 1, 6 do
        local pokemon = createTestPokemon(i, i, "Pokemon" .. i)
        PartyManager.addPokemonToParty("player1", pokemon)
    end
    
    -- Try to add one more Pokemon
    local pokemon7 = createTestPokemon(7, 7, "Pokemon7")
    local success, error = PartyManager.addPokemonToParty("player1", pokemon7)
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "full")
end

function TestPartyManager:testAddDuplicatePokemon()
    -- Add Pokemon to party
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    PartyManager.addPokemonToParty("player1", pokemon)
    
    -- Try to add same Pokemon again
    local success, error = PartyManager.addPokemonToParty("player1", pokemon)
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "already in party")
end

function TestPartyManager:testAddInvalidPokemon()
    -- Test adding invalid Pokemon
    local invalidPokemon = createTestPokemon(999, 999, "Invalid") -- ID 999 fails validation
    local success, error = PartyManager.addPokemonToParty("player1", invalidPokemon)
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "Invalid Pokemon")
end

-- Pokemon Removal Tests

function TestPartyManager:testRemovePokemonFromParty()
    -- Add Pokemon to party
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    PartyManager.addPokemonToParty("player1", pokemon)
    
    -- Test removing Pokemon
    local success, partyData = PartyManager.removePokemonFromParty("player1", 1)
    
    lu.assertTrue(success)
    lu.assertNotNil(partyData)
    lu.assertEquals(#partyData.party, 0)
    lu.assertFalse(partyData.battleReady, "Empty party should not be battle ready")
end

function TestPartyManager:testRemovePokemonNotInParty()
    -- Create empty party
    PartyManager.getOrCreateParty("player1")
    
    -- Try to remove Pokemon not in party
    local success, error = PartyManager.removePokemonFromParty("player1", 999)
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "not found")
end

function TestPartyManager:testRemovePokemonNoParty()
    -- Try to remove Pokemon from non-existent party
    local success, error = PartyManager.removePokemonFromParty("nonexistent", 1)
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "no party")
end

-- Pokemon Swapping Tests

function TestPartyManager:testSwapPokemonInParty()
    -- Add two Pokemon to party
    local pokemon1 = createTestPokemon(1, 1, "Bulbasaur")
    local pokemon2 = createTestPokemon(2, 4, "Charmander")
    
    PartyManager.addPokemonToParty("player1", pokemon1)
    PartyManager.addPokemonToParty("player1", pokemon2)
    
    -- Test swapping positions
    local success, partyData = PartyManager.swapPokemonInParty("player1", 1, 2)
    
    lu.assertTrue(success)
    lu.assertNotNil(partyData)
    lu.assertEquals(partyData.party[1].id, 2) -- Charmander now in slot 1
    lu.assertEquals(partyData.party[2].id, 1) -- Bulbasaur now in slot 2
end

function TestPartyManager:testSwapPokemonInvalidSlots()
    -- Add Pokemon to party
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    PartyManager.addPokemonToParty("player1", pokemon)
    
    -- Test swapping with invalid slots
    local success1, error1 = PartyManager.swapPokemonInParty("player1", 0, 1)
    local success2, error2 = PartyManager.swapPokemonInParty("player1", 1, 7)
    local success3, error3 = PartyManager.swapPokemonInParty("player1", 1, 1) -- Same slot
    
    lu.assertFalse(success1)
    lu.assertFalse(success2)
    lu.assertFalse(success3)
    lu.assertNotNil(error1)
    lu.assertNotNil(error2)
    lu.assertNotNil(error3)
end

function TestPartyManager:testSwapPokemonEmptySlot()
    -- Add one Pokemon to party
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    PartyManager.addPokemonToParty("player1", pokemon)
    
    -- Try to swap with empty slot
    local success, error = PartyManager.swapPokemonInParty("player1", 2, 1)
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "No Pokemon in source slot")
end

-- Party Replacement Tests

function TestPartyManager:testSetParty()
    -- Create test Pokemon array
    local newParty = {
        createTestPokemon(1, 1, "Bulbasaur"),
        createTestPokemon(2, 4, "Charmander"),
        createTestPokemon(3, 7, "Squirtle")
    }
    
    -- Test setting entire party
    local success, partyData = PartyManager.setParty("player1", newParty)
    
    lu.assertTrue(success)
    lu.assertNotNil(partyData)
    lu.assertEquals(#partyData.party, 3)
    lu.assertEquals(partyData.party[1].id, 1)
    lu.assertEquals(partyData.party[2].id, 2)
    lu.assertEquals(partyData.party[3].id, 3)
    lu.assertTrue(partyData.battleReady)
end

function TestPartyManager:testSetPartyTooLarge()
    -- Create party with too many Pokemon
    local largeParty = {}
    for i = 1, 7 do
        table.insert(largeParty, createTestPokemon(i, i, "Pokemon" .. i))
    end
    
    -- Test setting oversized party
    local success, error = PartyManager.setParty("player1", largeParty)
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "too large")
end

function TestPartyManager:testSetPartyWithInvalidPokemon()
    -- Create party with one invalid Pokemon
    local invalidParty = {
        createTestPokemon(1, 1, "Bulbasaur"),
        createTestPokemon(999, 999, "Invalid") -- Fails validation
    }
    
    -- Test setting party with invalid Pokemon
    local success, error = PartyManager.setParty("player1", invalidParty)
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "Invalid Pokemon")
end

-- Battle Readiness Tests

function TestPartyManager:testUpdateBattleReadiness()
    -- Test empty party (not battle ready)
    PartyManager.getOrCreateParty("player1")
    local ready1 = PartyManager.updateBattleReadiness("player1")
    lu.assertFalse(ready1)
    
    -- Add healthy Pokemon (battle ready)
    local healthyPokemon = createTestPokemon(1, 1, "Bulbasaur", 10, 50, 50)
    PartyManager.addPokemonToParty("player1", healthyPokemon)
    local ready2 = PartyManager.updateBattleReadiness("player1")
    lu.assertTrue(ready2)
    
    -- Add fainted Pokemon (still battle ready due to healthy Pokemon)
    local faintedPokemon = createTestPokemon(2, 4, "Charmander", 10, 0, 50)
    PartyManager.addPokemonToParty("player1", faintedPokemon)
    local ready3 = PartyManager.updateBattleReadiness("player1")
    lu.assertTrue(ready3)
end

function TestPartyManager:testValidateParty()
    -- Test valid party
    local validParty = {
        party = {createTestPokemon(1, 1, "Bulbasaur")}
    }
    
    local isValid1, error1 = PartyManager.validateParty(validParty)
    lu.assertTrue(isValid1)
    lu.assertNil(error1)
    
    -- Test party with duplicate IDs
    local duplicateParty = {
        party = {
            createTestPokemon(1, 1, "Bulbasaur"),
            createTestPokemon(1, 4, "Charmander") -- Duplicate ID
        }
    }
    
    local isValid2, error2 = PartyManager.validateParty(duplicateParty)
    lu.assertFalse(isValid2)
    lu.assertNotNil(error2)
    lu.assertStrContains(error2, "Duplicate")
end

-- Party Information Tests

function TestPartyManager:testGetPartySummary()
    -- Add Pokemon to party
    local pokemon1 = createTestPokemon(1, 1, "Bulbasaur", 15, 45, 60)
    local pokemon2 = createTestPokemon(2, 4, "Charmander", 12, 0, 50) -- Fainted
    
    PartyManager.addPokemonToParty("player1", pokemon1)
    PartyManager.addPokemonToParty("player1", pokemon2)
    
    -- Test getting party summary
    local summary = PartyManager.getPartySummary("player1")
    
    lu.assertTrue(summary.hasParty)
    lu.assertEquals(summary.pokemonCount, 2)
    lu.assertTrue(summary.battleReady)
    lu.assertEquals(#summary.summary, 2)
    
    -- Check summary details
    local pokemon1Summary = summary.summary[1]
    lu.assertEquals(pokemon1Summary.id, 1)
    lu.assertEquals(pokemon1Summary.species, "Bulbasaur")
    lu.assertEquals(pokemon1Summary.level, 15)
    lu.assertEquals(pokemon1Summary.hp, 45)
    lu.assertEquals(pokemon1Summary.maxHp, 60)
end

function TestPartyManager:testGetLeadPokemon()
    -- Add healthy and fainted Pokemon
    local faintedPokemon = createTestPokemon(1, 1, "Bulbasaur", 10, 0, 50)
    local healthyPokemon = createTestPokemon(2, 4, "Charmander", 10, 40, 50)
    
    PartyManager.addPokemonToParty("player1", faintedPokemon)
    PartyManager.addPokemonToParty("player1", healthyPokemon)
    
    -- Test getting lead Pokemon (should skip fainted)
    local leadPokemon = PartyManager.getLeadPokemon("player1")
    
    lu.assertNotNil(leadPokemon)
    lu.assertEquals(leadPokemon.id, 2) -- Should be Charmander (healthy)
end

function TestPartyManager:testGetHealthyPokemon()
    -- Add mix of healthy and fainted Pokemon
    local pokemon1 = createTestPokemon(1, 1, "Bulbasaur", 10, 50, 50) -- Healthy
    local pokemon2 = createTestPokemon(2, 4, "Charmander", 10, 0, 50)  -- Fainted
    local pokemon3 = createTestPokemon(3, 7, "Squirtle", 10, 30, 50)   -- Healthy
    
    PartyManager.addPokemonToParty("player1", pokemon1)
    PartyManager.addPokemonToParty("player1", pokemon2)
    PartyManager.addPokemonToParty("player1", pokemon3)
    
    -- Test getting healthy Pokemon
    local healthyPokemon = PartyManager.getHealthyPokemon("player1")
    
    lu.assertEquals(#healthyPokemon, 2)
    lu.assertEquals(healthyPokemon[1].id, 1)
    lu.assertEquals(healthyPokemon[2].id, 3)
end

-- Statistics Tests

function TestPartyManager:testStatistics()
    -- Get initial statistics
    local initialStats = PartyManager.getStatistics()
    
    -- Create party and add Pokemon
    local pokemon = createTestPokemon(1, 1, "Bulbasaur")
    PartyManager.addPokemonToParty("player1", pokemon)
    
    -- Check statistics updated
    local afterStats = PartyManager.getStatistics()
    lu.assertEquals(afterStats.partiesCreated, initialStats.partiesCreated + 1)
    lu.assertEquals(afterStats.pokemonAdded, initialStats.pokemonAdded + 1)
    lu.assertEquals(afterStats.totalParties, 1)
    lu.assertEquals(afterStats.totalPokemonInParties, 1)
    lu.assertEquals(afterStats.battleReadyParties, 1)
end

-- Run the tests
return TestPartyManager