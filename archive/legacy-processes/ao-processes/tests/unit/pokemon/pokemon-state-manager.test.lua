--[[
Unit Tests for Pokemon State Manager
Tests Pokemon CRUD operations, stat calculations, and level progression
--]]

local lu = require("tests.luaunit")

-- Mock dependencies for testing
local MockSpeciesManager = {
    getSpecies = function(speciesId)
        if speciesId == 1 then -- Bulbasaur
            return {
                name = "Bulbasaur",
                baseStats = {45, 49, 49, 65, 65, 45},
                growthRate = "MEDIUM_SLOW",
                genderRatio = 1, -- 1/8 female (87.5% male)
                abilities = {normal = "Overgrow", hidden = "Chlorophyll"}
            }
        elseif speciesId == 4 then -- Charmander
            return {
                name = "Charmander",
                baseStats = {39, 52, 43, 60, 50, 65},
                growthRate = "MEDIUM_SLOW",
                genderRatio = 1,
                abilities = {normal = "Blaze", hidden = "Solar Power"}
            }
        end
        return nil
    end
}

-- Mock StatCalculator for controlled testing
local MockStatCalculator = {
    calculateAllStats = function(baseStats, ivs, level, natureId)
        if not baseStats or not ivs or not level or not natureId then
            return nil, "Missing parameters"
        end
        
        -- Simple calculation for testing
        local stats = {}
        stats.hp = math.floor(baseStats[1] + level + ivs.hp / 2)
        stats.attack = math.floor(baseStats[2] + level + ivs.attack / 2)  
        stats.defense = math.floor(baseStats[3] + level + ivs.defense / 2)
        stats.spAttack = math.floor(baseStats[4] + level + ivs.spAttack / 2)
        stats.spDefense = math.floor(baseStats[5] + level + ivs.spDefense / 2)
        stats.speed = math.floor(baseStats[6] + level + ivs.speed / 2)
        
        return stats
    end,
    
    generateRandomIVs = function(seed)
        return {hp = 15, attack = 20, defense = 10, spAttack = 25, spDefense = 18, speed = 22}
    end,
    
    recalculateStats = function(pokemon)
        return MockStatCalculator.calculateAllStats(
            pokemon.baseStats, pokemon.ivs, pokemon.level, pokemon.natureId
        )
    end
}

-- Mock other dependencies
package.loaded["pokemon.components.species-manager"] = MockSpeciesManager
package.loaded["pokemon.components.stat-calculator"] = MockStatCalculator
package.loaded["pokemon.components.pokemon-validator"] = {
    validatePokemon = function(pokemon) return true end
}
package.loaded["game-logic.rng.crypto-rng"] = {
    initGlobalRNG = function(seed) end,
    globalRandomInt = function(min, max) return math.floor((min + max) / 2) end,
    globalRandom = function() return 0.5 end
}

-- Load the module under test
local PokemonStateManager = require("pokemon.components.pokemon-state-manager")

-- Test suite
TestPokemonStateManager = {}

function TestPokemonStateManager:setUp()
    -- Initialize manager for each test
    PokemonStateManager.initialize()
end

function TestPokemonStateManager:tearDown()
    -- Clean up after each test
    PokemonStateManager._internal.pokemonInstances = {}
    PokemonStateManager._internal.statistics = {
        created = 0, updated = 0, deleted = 0,
        levelUps = 0, evolutions = 0, validationFailures = 0
    }
end

-- Pokemon Creation Tests

function TestPokemonStateManager:testCreatePokemonValid()
    -- Test creating a valid Pokemon
    local pokemon, error = PokemonStateManager.createPokemon(1, 5, "player123")
    
    lu.assertNotNil(pokemon, "Pokemon should be created successfully")
    lu.assertNil(error, "No error should occur")
    lu.assertEquals(pokemon.speciesId, 1)
    lu.assertEquals(pokemon.species, "Bulbasaur")
    lu.assertEquals(pokemon.level, 5)
    lu.assertEquals(pokemon.playerId, "player123")
    lu.assertNotNil(pokemon.id)
    lu.assertNotNil(pokemon.stats)
    lu.assertNotNil(pokemon.ivs)
    lu.assertEquals(pokemon.hp, pokemon.maxHp) -- Should start at full HP
end

function TestPokemonStateManager:testCreatePokemonInvalidSpecies()
    -- Test creating Pokemon with invalid species
    local pokemon, error = PokemonStateManager.createPokemon(999, 5, "player123")
    
    lu.assertNil(pokemon, "Pokemon should not be created")
    lu.assertNotNil(error, "Error should be returned")
    lu.assertStrContains(error, "not found")
end

function TestPokemonStateManager:testCreatePokemonInvalidLevel()
    -- Test invalid level ranges
    local pokemon1, error1 = PokemonStateManager.createPokemon(1, 0, "player123")
    local pokemon2, error2 = PokemonStateManager.createPokemon(1, 101, "player123")
    
    lu.assertNil(pokemon1, "Pokemon with level 0 should not be created")
    lu.assertNil(pokemon2, "Pokemon with level 101 should not be created")
    lu.assertNotNil(error1)
    lu.assertNotNil(error2)
end

function TestPokemonStateManager:testCreatePokemonMissingParameters()
    -- Test missing required parameters
    local pokemon1, error1 = PokemonStateManager.createPokemon(nil, 5, "player123")
    local pokemon2, error2 = PokemonStateManager.createPokemon(1, nil, "player123") 
    local pokemon3, error3 = PokemonStateManager.createPokemon(1, 5, nil)
    
    lu.assertNil(pokemon1)
    lu.assertNil(pokemon2)
    lu.assertNil(pokemon3)
    lu.assertNotNil(error1)
    lu.assertNotNil(error2)
    lu.assertNotNil(error3)
end

-- Pokemon Retrieval Tests

function TestPokemonStateManager:testGetPokemon()
    -- Create Pokemon first
    local pokemon, _ = PokemonStateManager.createPokemon(1, 10, "player123")
    lu.assertNotNil(pokemon)
    
    -- Test retrieval
    local retrieved = PokemonStateManager.getPokemon(pokemon.id)
    lu.assertNotNil(retrieved)
    lu.assertEquals(retrieved.id, pokemon.id)
    lu.assertEquals(retrieved.speciesId, pokemon.speciesId)
end

function TestPokemonStateManager:testGetPokemonNotFound()
    -- Test retrieving non-existent Pokemon
    local pokemon = PokemonStateManager.getPokemon(999)
    lu.assertNil(pokemon)
end

function TestPokemonStateManager:testGetPlayerPokemon()
    -- Create multiple Pokemon for different players
    local pokemon1, _ = PokemonStateManager.createPokemon(1, 5, "player1")
    local pokemon2, _ = PokemonStateManager.createPokemon(4, 7, "player1")
    local pokemon3, _ = PokemonStateManager.createPokemon(1, 3, "player2")
    
    lu.assertNotNil(pokemon1)
    lu.assertNotNil(pokemon2)
    lu.assertNotNil(pokemon3)
    
    -- Test getting Pokemon for player1
    local player1Pokemon = PokemonStateManager.getPlayerPokemon("player1")
    lu.assertEquals(#player1Pokemon, 2)
    
    -- Test getting Pokemon for player2
    local player2Pokemon = PokemonStateManager.getPlayerPokemon("player2")
    lu.assertEquals(#player2Pokemon, 1)
    
    -- Test getting Pokemon for non-existent player
    local noPlayerPokemon = PokemonStateManager.getPlayerPokemon("nonexistent")
    lu.assertEquals(#noPlayerPokemon, 0)
end

-- Pokemon Update Tests

function TestPokemonStateManager:testUpdateHP()
    -- Create Pokemon
    local pokemon, _ = PokemonStateManager.createPokemon(1, 10, "player123")
    lu.assertNotNil(pokemon)
    
    local originalHp = pokemon.hp
    local newHp = math.floor(originalHp / 2)
    
    -- Test valid HP update
    local success, updatedPokemon = PokemonStateManager.updateHp(pokemon.id, newHp)
    
    lu.assertTrue(success)
    lu.assertNotNil(updatedPokemon)
    lu.assertEquals(updatedPokemon.hp, newHp)
    lu.assertEquals(updatedPokemon.maxHp, originalHp) -- maxHp should not change
end

function TestPokemonStateManager:testUpdateHPInvalid()
    -- Create Pokemon
    local pokemon, _ = PokemonStateManager.createPokemon(1, 10, "player123")
    lu.assertNotNil(pokemon)
    
    -- Test invalid HP values
    local success1, error1 = PokemonStateManager.updateHp(pokemon.id, -10)
    local success2, error2 = PokemonStateManager.updateHp(pokemon.id, pokemon.maxHp + 100)
    local success3, error3 = PokemonStateManager.updateHp(999, 50)
    
    lu.assertFalse(success1)
    lu.assertFalse(success2) 
    lu.assertFalse(success3)
    lu.assertNotNil(error1)
    lu.assertNotNil(error2)
    lu.assertNotNil(error3)
end

function TestPokemonStateManager:testGainExperience()
    -- Create low level Pokemon
    local pokemon, _ = PokemonStateManager.createPokemon(1, 1, "player123")
    lu.assertNotNil(pokemon)
    
    local originalLevel = pokemon.level
    local originalExp = pokemon.exp
    
    -- Gain experience that should cause level up
    local success, updatedPokemon, levelUpInfo = PokemonStateManager.gainExperience(pokemon.id, 1000)
    
    lu.assertTrue(success)
    lu.assertNotNil(updatedPokemon)
    lu.assertNotNil(levelUpInfo)
    
    -- Check experience was added
    lu.assertGreaterThan(updatedPokemon.exp, originalExp)
    
    -- Check level up occurred
    if levelUpInfo.levelsGained > 0 then
        lu.assertGreaterThan(updatedPokemon.level, originalLevel)
        lu.assertEquals(levelUpInfo.oldLevel, originalLevel)
        lu.assertEquals(levelUpInfo.newLevel, updatedPokemon.level)
    end
end

function TestPokemonStateManager:testGainExperienceInvalid()
    -- Create Pokemon
    local pokemon, _ = PokemonStateManager.createPokemon(1, 10, "player123")
    lu.assertNotNil(pokemon)
    
    -- Test invalid experience values
    local success1, error1 = PokemonStateManager.gainExperience(pokemon.id, -100)
    local success2, error2 = PokemonStateManager.gainExperience(pokemon.id, 0)
    local success3, error3 = PokemonStateManager.gainExperience(999, 100)
    
    lu.assertFalse(success1)
    lu.assertFalse(success2)
    lu.assertFalse(success3)
    lu.assertNotNil(error1)
    lu.assertNotNil(error2) 
    lu.assertNotNil(error3)
end

function TestPokemonStateManager:testUpdateStatusEffect()
    -- Create Pokemon
    local pokemon, _ = PokemonStateManager.createPokemon(1, 10, "player123")
    lu.assertNotNil(pokemon)
    
    -- Test setting status effect
    local success, updatedPokemon = PokemonStateManager.updateStatusEffect(pokemon.id, "PARALYZED")
    
    lu.assertTrue(success)
    lu.assertNotNil(updatedPokemon)
    lu.assertEquals(updatedPokemon.statusEffect, "PARALYZED")
    
    -- Test clearing status effect
    local success2, updatedPokemon2 = PokemonStateManager.updateStatusEffect(pokemon.id, nil)
    
    lu.assertTrue(success2)
    lu.assertNil(updatedPokemon2.statusEffect)
end

-- Pokemon Deletion Tests

function TestPokemonStateManager:testDeletePokemon()
    -- Create Pokemon
    local pokemon, _ = PokemonStateManager.createPokemon(1, 10, "player123")
    lu.assertNotNil(pokemon)
    
    -- Test deletion by owner
    local success, message = PokemonStateManager.deletePokemon(pokemon.id, "player123")
    
    lu.assertTrue(success)
    lu.assertNotNil(message)
    
    -- Verify Pokemon is deleted
    local retrieved = PokemonStateManager.getPokemon(pokemon.id)
    lu.assertNil(retrieved)
end

function TestPokemonStateManager:testDeletePokemonUnauthorized()
    -- Create Pokemon
    local pokemon, _ = PokemonStateManager.createPokemon(1, 10, "player123")
    lu.assertNotNil(pokemon)
    
    -- Test deletion by wrong player
    local success, error = PokemonStateManager.deletePokemon(pokemon.id, "different_player")
    
    lu.assertFalse(success)
    lu.assertNotNil(error)
    lu.assertStrContains(error, "Not authorized")
    
    -- Verify Pokemon still exists
    local retrieved = PokemonStateManager.getPokemon(pokemon.id)
    lu.assertNotNil(retrieved)
end

-- Utility Function Tests

function TestPokemonStateManager:testCalculateExperienceForLevel()
    -- Test level 1 (should be 0)
    local exp1 = PokemonStateManager.calculateExperienceForLevel(1, "MEDIUM_FAST")
    lu.assertEquals(exp1, 0)
    
    -- Test other levels
    local exp10 = PokemonStateManager.calculateExperienceForLevel(10, "MEDIUM_FAST")
    local exp50 = PokemonStateManager.calculateExperienceForLevel(50, "MEDIUM_FAST")
    
    lu.assertGreaterThan(exp10, 0)
    lu.assertGreaterThan(exp50, exp10)
    
    -- Test different growth rates
    local expFast = PokemonStateManager.calculateExperienceForLevel(50, "FAST")
    local expSlow = PokemonStateManager.calculateExperienceForLevel(50, "SLOW")
    
    lu.assertGreaterThan(expSlow, expFast)
end

function TestPokemonStateManager:testCalculateLevelFromExperience()
    -- Test calculating level from experience
    local level1 = PokemonStateManager.calculateLevelFromExperience(0, "MEDIUM_FAST")
    lu.assertEquals(level1, 1)
    
    local level50exp = PokemonStateManager.calculateExperienceForLevel(50, "MEDIUM_FAST")
    local level = PokemonStateManager.calculateLevelFromExperience(level50exp, "MEDIUM_FAST")
    lu.assertEquals(level, 50)
end

function TestPokemonStateManager:testGenerateGender()
    -- Test genderless
    local gender1 = PokemonStateManager.generateGender(-1, "seed123")
    lu.assertEquals(gender1, "GENDERLESS")
    
    local gender2 = PokemonStateManager.generateGender("GENDERLESS", "seed123")
    lu.assertEquals(gender2, "GENDERLESS")
    
    -- Test always male (genderRatio = 0)
    local gender3 = PokemonStateManager.generateGender(0, "seed123")
    lu.assertEquals(gender3, "MALE")
    
    -- Test always female (genderRatio = 8)
    local gender4 = PokemonStateManager.generateGender(8, "seed123")
    lu.assertEquals(gender4, "FEMALE")
    
    -- Test random gender (should return either MALE or FEMALE)
    local gender5 = PokemonStateManager.generateGender(4, "seed123") -- 50/50 ratio
    lu.assertTrue(gender5 == "MALE" or gender5 == "FEMALE")
end

-- Statistics Tests

function TestPokemonStateManager:testStatistics()
    -- Get initial statistics
    local initialStats = PokemonStateManager.getStatistics()
    
    -- Create a Pokemon
    local pokemon, _ = PokemonStateManager.createPokemon(1, 10, "player123")
    lu.assertNotNil(pokemon)
    
    -- Check statistics updated
    local afterCreateStats = PokemonStateManager.getStatistics()
    lu.assertEquals(afterCreateStats.created, initialStats.created + 1)
    lu.assertEquals(afterCreateStats.totalPokemon, 1)
    
    -- Update Pokemon
    PokemonStateManager.updateHp(pokemon.id, pokemon.maxHp - 10)
    
    local afterUpdateStats = PokemonStateManager.getStatistics()
    lu.assertEquals(afterUpdateStats.updated, initialStats.updated + 1)
    
    -- Delete Pokemon
    PokemonStateManager.deletePokemon(pokemon.id, "player123")
    
    local afterDeleteStats = PokemonStateManager.getStatistics()
    lu.assertEquals(afterDeleteStats.deleted, initialStats.deleted + 1)
    lu.assertEquals(afterDeleteStats.totalPokemon, 0)
end

-- Run the tests
return TestPokemonStateManager