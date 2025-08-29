-- Move Effects Unit Tests
-- Comprehensive testing for move effects system functionality
-- Tests status effects, stat modifications, weather/terrain changes, healing, recoil, and multi-hit mechanics
-- Ensures TypeScript parity and proper battle integration

-- Load test framework and dependencies
local TestFramework = require("framework.test-framework-enhanced")
local MoveEffects = require("game-logic.battle.move-effects")
local MoveDatabase = require("data.moves.move-database")

-- Test suite for Move Effects
local MoveEffectsTests = {}

-- Helper function to create mock Pokemon
local function createMockPokemon(id, hp, maxHp, types, status)
    return {
        id = id or "test_pokemon",
        hp = hp or 100,
        maxHp = maxHp or 100,
        types = types or {0}, -- Normal type by default
        status = status or MoveEffects.STATUS_EFFECTS.NONE,
        battleStats = {
            [MoveEffects.BATTLE_STATS.ATK] = 0,
            [MoveEffects.BATTLE_STATS.DEF] = 0,
            [MoveEffects.BATTLE_STATS.SPATK] = 0,
            [MoveEffects.BATTLE_STATS.SPDEF] = 0,
            [MoveEffects.BATTLE_STATS.SPD] = 0,
            [MoveEffects.BATTLE_STATS.ACC] = 0,
            [MoveEffects.BATTLE_STATS.EVA] = 0
        }
    }
end

-- Helper function to create mock battle state
local function createMockBattleState()
    return {
        rng = {
            random = function() return 42 end -- Fixed seed for consistent testing
        }
    }
end

function MoveEffectsTests.runAllTests()
    local testSuite = TestFramework.createTestSuite("MoveEffects")
    
    -- Test status effect application
    testSuite:addTest("Status Effect Application", function()
        local pokemon = createMockPokemon()
        local battleState = createMockBattleState()
        
        -- Test burn application
        local success, result = MoveEffects.applyStatusEffect(
            pokemon, MoveEffects.STATUS_EFFECTS.BURN, battleState, "test_move"
        )
        TestFramework.assert(success == true, "Burn application should succeed")
        TestFramework.assert(pokemon.status == MoveEffects.STATUS_EFFECTS.BURN, "Pokemon should have burn status")
        
        -- Test status immunity - Fire types immune to burn
        local firePokemon = createMockPokemon("fire_pokemon", 100, 100, {9}) -- Fire type
        local success2, result2 = MoveEffects.applyStatusEffect(
            firePokemon, MoveEffects.STATUS_EFFECTS.BURN, battleState, "test_move"
        )
        TestFramework.assert(success2 == false, "Fire type should be immune to burn")
        TestFramework.assert(result2:find("Fire type immune"), "Should return fire immunity message")
    end)
    
    -- Test stat stage modifications
    testSuite:addTest("Stat Stage Modifications", function()
        local pokemon = createMockPokemon()
        local battleState = createMockBattleState()
        
        -- Test attack boost
        local success, change = MoveEffects.modifyStatStage(
            pokemon, MoveEffects.BATTLE_STATS.ATK, 2, battleState
        )
        TestFramework.assert(success == true, "Stat modification should succeed")
        TestFramework.assert(change == 2, "Should return actual change of +2")
        TestFramework.assert(pokemon.battleStats[MoveEffects.BATTLE_STATS.ATK] == 2, 
                           "Pokemon attack stage should be +2")
        
        -- Test clamping at +6
        local success2, change2 = MoveEffects.modifyStatStage(
            pokemon, MoveEffects.BATTLE_STATS.ATK, 5, battleState
        )
        TestFramework.assert(success2 == true, "Over-limit stat modification should succeed")
        TestFramework.assert(change2 == 4, "Should return actual change of +4 (clamped)")
        TestFramework.assert(pokemon.battleStats[MoveEffects.BATTLE_STATS.ATK] == 6,
                           "Pokemon attack stage should be clamped at +6")
    end)
    
    -- Test weather changes
    testSuite:addTest("Weather Change Effects", function()
        local battleState = createMockBattleState()
        
        -- Test rain setting
        local success, msg = MoveEffects.changeWeather(
            battleState, MoveEffects.WEATHER_TYPES.RAIN, 5, "rain_dance"
        )
        TestFramework.assert(success == true, "Weather change should succeed")
        TestFramework.assert(battleState.weather.weatherType == MoveEffects.WEATHER_TYPES.RAIN,
                           "Battle state should have rain weather")
        TestFramework.assert(battleState.weather.turnsLeft == 5, "Rain should last 5 turns")
        
        -- Test harsh sun setting
        local success2, msg2 = MoveEffects.changeWeather(
            battleState, MoveEffects.WEATHER_TYPES.HARSH_SUN, 8, "drought"
        )
        TestFramework.assert(success2 == true, "Second weather change should succeed")
        TestFramework.assert(battleState.weather.weatherType == MoveEffects.WEATHER_TYPES.HARSH_SUN,
                           "Weather should change to harsh sun")
    end)
    
    -- Test terrain changes
    testSuite:addTest("Terrain Change Effects", function()
        local battleState = createMockBattleState()
        
        -- Test electric terrain
        local success, msg = MoveEffects.changeTerrain(
            battleState, MoveEffects.TERRAIN_TYPES.ELECTRIC, 5, "electric_terrain"
        )
        TestFramework.assert(success == true, "Terrain change should succeed")
        TestFramework.assert(battleState.terrain.terrainType == MoveEffects.TERRAIN_TYPES.ELECTRIC,
                           "Battle state should have electric terrain")
        TestFramework.assert(battleState.terrain.turnsLeft == 5, "Electric terrain should last 5 turns")
    end)
    
    -- Test healing effects
    testSuite:addTest("Healing Effects", function()
        local pokemon = createMockPokemon("injured_pokemon", 50, 100)
        local battleState = createMockBattleState()
        
        -- Test percentage healing
        local success, healAmount = MoveEffects.healPokemon(pokemon, 50, battleState, true)
        TestFramework.assert(success == true, "Healing should succeed")
        TestFramework.assert(healAmount == 50, "Should heal 50 HP (50% of 100 max HP)")
        TestFramework.assert(pokemon.hp == 100, "Pokemon should be at full HP")
        
        -- Test fixed healing with overheal protection
        local pokemon2 = createMockPokemon("almost_full", 90, 100)
        local success2, healAmount2 = MoveEffects.healPokemon(pokemon2, 20, battleState, false)
        TestFramework.assert(success2 == true, "Fixed healing should succeed")
        TestFramework.assert(healAmount2 == 10, "Should only heal 10 HP (clamped to max)")
        TestFramework.assert(pokemon2.hp == 100, "Pokemon should be at full HP")
    end)
    
    -- Test recoil damage
    testSuite:addTest("Recoil Damage Effects", function()
        local pokemon = createMockPokemon("full_hp", 100, 100)
        local battleState = createMockBattleState()
        
        -- Test recoil damage calculation
        local success, recoilAmount = MoveEffects.applyRecoilDamage(pokemon, 120, 25, battleState)
        TestFramework.assert(success == true, "Recoil damage should succeed")
        TestFramework.assert(recoilAmount == 30, "Recoil should be 25% of 120 = 30")
        TestFramework.assert(pokemon.hp == 70, "Pokemon should have 70 HP remaining")
        
        -- Test recoil damage with insufficient HP
        local pokemon2 = createMockPokemon("low_hp", 10, 100)
        local success2, recoilAmount2 = MoveEffects.applyRecoilDamage(pokemon2, 80, 50, battleState)
        TestFramework.assert(success2 == true, "Recoil damage should succeed")
        TestFramework.assert(recoilAmount2 == 10, "Recoil should be clamped to remaining HP")
        TestFramework.assert(pokemon2.hp == 0, "Pokemon should faint")
    end)
    
    -- Test multi-hit calculations
    testSuite:addTest("Multi-Hit Move Calculations", function()
        local battleState = createMockBattleState()
        
        -- Test standard 2-5 hit move
        local move = {
            effects = {
                multi_hit = true
            }
        }
        local hitCount = MoveEffects.calculateMultiHitCount(move, battleState)
        TestFramework.assert(hitCount >= 2 and hitCount <= 5, "Hit count should be between 2-5")
        
        -- Test fixed hit count move
        local move2 = {
            effects = {
                multi_hit = 3
            }
        }
        local hitCount2 = MoveEffects.calculateMultiHitCount(move2, battleState)
        TestFramework.assert(hitCount2 == 3, "Fixed hit move should hit exactly 3 times")
        
        -- Test single-hit move (no multi-hit effect)
        local move3 = {}
        local hitCount3 = MoveEffects.calculateMultiHitCount(move3, battleState)
        TestFramework.assert(hitCount3 == 1, "Non-multi-hit move should hit once")
    end)
    
    -- Test complete move effect processing
    testSuite:addTest("Complete Move Effect Processing", function()
        local attacker = createMockPokemon("attacker")
        local target = createMockPokemon("target")
        local battleState = createMockBattleState()
        
        -- Test move with multiple effects (like Fire Punch)
        local move = {
            effects = {
                burn_chance = 100, -- Guaranteed burn for testing
                stat_change = {
                    attack = 1  -- +1 attack to user
                },
                stat_change_target = "self"
            }
        }
        
        local results = MoveEffects.processMovEffects(move, attacker, {target}, battleState, 75)
        
        -- Check status effect was applied
        TestFramework.assert(#results.statusEffects > 0, "Should have status effect results")
        TestFramework.assert(results.statusEffects[1].effect == MoveEffects.STATUS_EFFECTS.BURN,
                           "Should apply burn effect")
        
        -- Check stat change was applied
        TestFramework.assert(#results.statChanges > 0, "Should have stat change results")
        TestFramework.assert(results.statChanges[1].stat == "attack", "Should modify attack stat")
    end)
    
    -- Test effect validation
    testSuite:addTest("Effect Validation", function()
        -- Test valid effect
        local validEffect = {
            burn_chance = 30,
            stat_change = {
                attack = 1,
                defense = -1
            },
            healing = "1/2"
        }
        local isValid, msg = MoveEffects.validateEffect(validEffect)
        TestFramework.assert(isValid == true, "Valid effect should pass validation")
        
        -- Test invalid status chance
        local invalidEffect = {
            burn_chance = 150  -- > 100
        }
        local isValid2, msg2 = MoveEffects.validateEffect(invalidEffect)
        TestFramework.assert(isValid2 == false, "Invalid status chance should fail validation")
        TestFramework.assert(msg2:find("Status chance must be between 0%-100%"), 
                           "Should return appropriate error message")
        
        -- Test invalid stat stage
        local invalidEffect2 = {
            stat_change = {
                attack = 10  -- > 6
            }
        }
        local isValid3, msg3 = MoveEffects.validateEffect(invalidEffect2)
        TestFramework.assert(isValid3 == false, "Invalid stat stage should fail validation")
    end)
    
    -- Test effect descriptions
    testSuite:addTest("Effect Descriptions", function()
        local effect = {
            burn_chance = 30,
            stat_change = {
                attack = 2
            },
            healing = "1/2",
            recoil = "1/4"
        }
        
        local description = MoveEffects.getEffectDescription(effect)
        TestFramework.assert(type(description) == "string", "Description should be a string")
        TestFramework.assert(description:find("30%% chance to inflict Burn"), 
                           "Should describe burn chance")
        TestFramework.assert(description:find("Raises attack by 2 stage"), 
                           "Should describe stat boost")
        TestFramework.assert(description:find("Restores 1/2 of max HP"), 
                           "Should describe healing")
    end)
    
    -- Integration test with move database
    testSuite:addTest("Move Database Integration", function()
        MoveDatabase.init()
        
        -- Test Fire Punch effects
        local firePunch = MoveDatabase.moves[7]
        TestFramework.assert(firePunch ~= nil, "Fire Punch should exist in database")
        TestFramework.assert(firePunch.effects.burn_chance == 10, 
                           "Fire Punch should have 10% burn chance")
        
        -- Validate Fire Punch effects
        local isValid, msg = MoveEffects.validateEffect(firePunch.effects)
        TestFramework.assert(isValid == true, "Fire Punch effects should be valid")
        
        -- Test Thunder Punch effects  
        local thunderPunch = MoveDatabase.moves[9]
        TestFramework.assert(thunderPunch ~= nil, "Thunder Punch should exist in database")
        TestFramework.assert(thunderPunch.effects.paralysis_chance == 10,
                           "Thunder Punch should have 10% paralysis chance")
    end)
    
    -- Performance test
    testSuite:addTest("Effect Processing Performance", function()
        local pokemon = createMockPokemon()
        local battleState = createMockBattleState()
        
        -- Test status effect application performance
        local startTime = os.clock()
        for i = 1, 1000 do
            local testPokemon = createMockPokemon("perf_test_" .. i)
            MoveEffects.applyStatusEffect(testPokemon, MoveEffects.STATUS_EFFECTS.BURN, battleState)
        end
        local statusTime = os.clock() - startTime
        
        -- Test stat modification performance
        local startTime2 = os.clock()
        for i = 1, 1000 do
            local testPokemon = createMockPokemon("perf_test_stat_" .. i)
            MoveEffects.modifyStatStage(testPokemon, MoveEffects.BATTLE_STATS.ATK, 1, battleState)
        end
        local statTime = os.clock() - startTime2
        
        print("Status effect processing: " .. string.format("%.4f", statusTime) .. " seconds (1000 operations)")
        print("Stat modification processing: " .. string.format("%.4f", statTime) .. " seconds (1000 operations)")
        
        -- Performance should be reasonable
        TestFramework.assert(statusTime < 1.0, "Status effect processing should complete in under 1 second")
        TestFramework.assert(statTime < 1.0, "Stat modification should complete in under 1 second")
    end)
    
    return testSuite:run()
end

return MoveEffectsTests