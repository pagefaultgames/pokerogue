-- Unit Tests for Ability Effects System
-- Tests ability effect application, conditions, and trigger processing
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

-- Import modules under test
local AbilityEffects = require("data.abilities.ability-effects")

-- Test suite for AbilityEffects
local AbilityEffectsTests = {}

-- Mock Pokemon for testing
local function createMockPokemon(hp, maxHp)
    return {
        hp = hp or 100,
        maxHp = maxHp or 100,
        statStages = {},
        
        getMaxHp = function(self) return self.maxHp end,
        getStatStage = function(self, stat) return self.statStages[stat] or 0 end,
        setStatStage = function(self, stat, stage) self.statStages[stat] = stage end,
        addTag = function(self, tag) 
            if not self.tags then self.tags = {} end
            table.insert(self.tags, tag) 
        end
    }
end

-- Mock battle context for testing
local function createMockBattleContext(options)
    options = options or {}
    return {
        battle = options.battle,
        move = options.move,
        damage = options.damage,
        criticalHit = options.criticalHit or false,
        statusToApply = options.statusToApply,
        target = options.target,
        statusPrevented = false,
        critBlocked = false,
        ohkoPrevented = false
    }
end

-- Test: Trigger Types Constants
function AbilityEffectsTests.testTriggerTypes()
    -- Arrange & Act: Check trigger type constants exist
    local expectedTriggers = {
        "POST_SUMMON", "PRE_ATTACK", "ON_ATTACK", "POST_ATTACK",
        "PRE_DEFEND", "ON_DEFEND", "POST_DEFEND", "PRE_SET_STATUS",
        "POST_SET_STATUS", "PRE_MOVE", "POST_MOVE", "TURN_START",
        "TURN_END", "ON_WEATHER", "ON_TERRAIN", "ON_SWITCH_IN",
        "ON_SWITCH_OUT", "ON_FAINT", "ON_REVIVE"
    }
    
    -- Assert: All expected triggers exist
    for _, trigger in ipairs(expectedTriggers) do
        assertNotNil(AbilityEffects.TriggerTypes[trigger], 
            "TriggerTypes should have " .. trigger)
    end
end

-- Test: Effect Types Constants
function AbilityEffectsTests.testEffectTypes()
    -- Arrange & Act: Check effect type constants exist
    local expectedEffects = {
        "STAT_STAGE_CHANGE", "STAT_MULTIPLIER", "PREVENT_STATUS",
        "CURE_STATUS", "INFLICT_STATUS", "SET_WEATHER", "PREVENT_WEATHER",
        "SET_TERRAIN", "DAMAGE_MULTIPLIER", "PREVENT_DAMAGE",
        "REFLECT_DAMAGE", "PREVENT_MOVE", "BLOCK_CRIT", "PRIORITY_CHANGE",
        "FLINCH_CHANCE", "PREVENT_OHKO", "IMMUNE_OHKO_MOVES", "TYPE_CHANGE",
        "ABILITY_CHANGE", "HEAL_HP", "DRAIN_HP"
    }
    
    -- Assert: All expected effects exist
    for _, effect in ipairs(expectedEffects) do
        assertNotNil(AbilityEffects.EffectTypes[effect], 
            "EffectTypes should have " .. effect)
    end
end

-- Test: Condition Checking - Always
function AbilityEffectsTests.testCheckConditionAlways()
    -- Arrange
    local pokemon = createMockPokemon()
    local battleContext = createMockBattleContext()
    
    -- Act & Assert
    assert(AbilityEffects.checkCondition(pokemon, "ALWAYS", battleContext),
        "ALWAYS condition should return true")
    assert(AbilityEffects.checkCondition(pokemon, nil, battleContext),
        "Nil condition should return true (defaults to ALWAYS)")
end

-- Test: Condition Checking - Full HP
function AbilityEffectsTests.testCheckConditionFullHP()
    -- Arrange
    local fullHpPokemon = createMockPokemon(100, 100)
    local damagedPokemon = createMockPokemon(50, 100)
    local battleContext = createMockBattleContext()
    
    -- Act & Assert
    assert(AbilityEffects.checkCondition(fullHpPokemon, "FULL_HP", battleContext),
        "FULL_HP condition should return true for full HP Pokemon")
    assert(not AbilityEffects.checkCondition(damagedPokemon, "FULL_HP", battleContext),
        "FULL_HP condition should return false for damaged Pokemon")
end

-- Test: Condition Checking - Low HP
function AbilityEffectsTests.testCheckConditionLowHP()
    -- Arrange
    local lowHpPokemon = createMockPokemon(20, 100)  -- 20/100 = 20% (below 25% threshold)
    local highHpPokemon = createMockPokemon(50, 100) -- 50/100 = 50% (above 25% threshold)
    local battleContext = createMockBattleContext()
    
    -- Act & Assert
    assert(AbilityEffects.checkCondition(lowHpPokemon, "LOW_HP", battleContext),
        "LOW_HP condition should return true for low HP Pokemon")
    assert(not AbilityEffects.checkCondition(highHpPokemon, "LOW_HP", battleContext),
        "LOW_HP condition should return false for high HP Pokemon")
end

-- Test: Condition Checking - Contact Move
function AbilityEffectsTests.testCheckConditionContactMove()
    -- Arrange
    local pokemon = createMockPokemon()
    local contactMove = {hasFlag = function(self, flag) return flag == "CONTACT" end}
    local nonContactMove = {hasFlag = function(self, flag) return false end}
    
    local contactContext = createMockBattleContext({move = contactMove})
    local nonContactContext = createMockBattleContext({move = nonContactMove})
    local noMoveContext = createMockBattleContext()
    
    -- Act & Assert
    assert(AbilityEffects.checkCondition(pokemon, "CONTACT_MOVE", contactContext),
        "CONTACT_MOVE condition should return true for contact moves")
    assert(not AbilityEffects.checkCondition(pokemon, "CONTACT_MOVE", nonContactContext),
        "CONTACT_MOVE condition should return false for non-contact moves")
    assert(not AbilityEffects.checkCondition(pokemon, "CONTACT_MOVE", noMoveContext),
        "CONTACT_MOVE condition should return false when no move present")
end

-- Test: Stat Stage Change Effect
function AbilityEffectsTests.testApplyStatStageChange()
    -- Arrange
    local pokemon = createMockPokemon()
    local ability = {id = 1, name = "Test"}
    local effect = {
        effect = "STAT_STAGE_CHANGE",
        stat = "ATK",
        stages = 1
    }
    local battleContext = createMockBattleContext()
    
    -- Act
    local applied = AbilityEffects.applyEffect(pokemon, ability, effect, battleContext)
    
    -- Assert
    assert(applied, "Stat stage change should be applied")
    assertEqual(pokemon:getStatStage("ATK"), 1, "Attack stage should be increased by 1")
end

-- Test: Prevent Status Effect
function AbilityEffectsTests.testApplyPreventStatus()
    -- Arrange
    local pokemon = createMockPokemon()
    local ability = {id = 1, name = "Test"}
    local effect = {
        effect = "PREVENT_STATUS",
        status = "PARALYSIS"
    }
    local battleContext = createMockBattleContext({statusToApply = "PARALYSIS"})
    
    -- Act
    local applied = AbilityEffects.applyEffect(pokemon, ability, effect, battleContext)
    
    -- Assert
    assert(applied, "Status prevention should be applied")
    assert(battleContext.statusPrevented, "Status should be marked as prevented")
end

-- Test: Block Critical Hit Effect
function AbilityEffectsTests.testApplyBlockCrit()
    -- Arrange
    local pokemon = createMockPokemon()
    local ability = {id = 1, name = "Test"}
    local effect = {
        effect = "BLOCK_CRIT"
    }
    local battleContext = createMockBattleContext({criticalHit = true})
    
    -- Act
    local applied = AbilityEffects.applyEffect(pokemon, ability, effect, battleContext)
    
    -- Assert
    assert(applied, "Critical hit block should be applied")
    assert(not battleContext.criticalHit, "Critical hit should be blocked")
    assert(battleContext.critBlocked, "Critical hit should be marked as blocked")
end

-- Test: OHKO Prevention Effect
function AbilityEffectsTests.testApplyPreventOHKO()
    -- Arrange
    local pokemon = createMockPokemon(100, 100) -- Full HP Pokemon
    local ability = {id = 1, name = "Test"}
    local effect = {
        effect = "PREVENT_OHKO"
    }
    local battleContext = createMockBattleContext({damage = 100}) -- OHKO damage
    
    -- Act
    local applied = AbilityEffects.applyEffect(pokemon, ability, effect, battleContext)
    
    -- Assert
    assert(applied, "OHKO prevention should be applied")
    assertEqual(battleContext.damage, 99, "Damage should be reduced to leave 1 HP")
    assert(battleContext.ohkoPrevented, "OHKO should be marked as prevented")
end

-- Test: OHKO Prevention - Not Full HP
function AbilityEffectsTests.testPreventOHKONotFullHP()
    -- Arrange
    local pokemon = createMockPokemon(50, 100) -- Damaged Pokemon
    local ability = {id = 1, name = "Test"}
    local effect = {
        effect = "PREVENT_OHKO"
    }
    local battleContext = createMockBattleContext({damage = 50})
    
    -- Act
    local applied = AbilityEffects.applyEffect(pokemon, ability, effect, battleContext)
    
    -- Assert
    assert(not applied, "OHKO prevention should not apply to damaged Pokemon")
    assertEqual(battleContext.damage, 50, "Damage should remain unchanged")
    assert(not battleContext.ohkoPrevented, "OHKO prevention should not be triggered")
end

-- Test: Flinch Chance Effect
function AbilityEffectsTests.testApplyFlinchChance()
    -- Arrange
    local pokemon = createMockPokemon()
    local target = createMockPokemon()
    local ability = {id = 1, name = "Test"}
    local effect = {
        effect = "FLINCH_CHANCE",
        chance = 1.0 -- 100% chance for test
    }
    local mockBattle = {
        randSeedFloat = function() return 0.5 end -- Always return 50%
    }
    local battleContext = createMockBattleContext({
        battle = mockBattle,
        target = target
    })
    
    -- Act
    local applied = AbilityEffects.applyEffect(pokemon, ability, effect, battleContext)
    
    -- Assert
    assert(applied, "Flinch effect should be applied")
    assertNotNil(target.tags, "Target should have tags")
    assertEqual(target.tags[1], "FLINCHED", "Target should be flinched")
end

-- Test: Trigger Priority System
function AbilityEffectsTests.testGetTriggerPriority()
    -- Arrange & Act
    local drizzlePriority = AbilityEffects.getTriggerPriority(2, "POST_SUMMON") -- DRIZZLE
    local stenchPriority = AbilityEffects.getTriggerPriority(1, "ON_ATTACK")   -- STENCH
    local battleArmorPriority = AbilityEffects.getTriggerPriority(4, "PRE_DEFEND") -- BATTLE_ARMOR
    
    -- Assert: Weather abilities should have higher priority on POST_SUMMON
    assert(drizzlePriority > 0, "DRIZZLE should have positive priority on POST_SUMMON")
    
    -- Assert: Defensive abilities should have higher priority than offensive
    assert(battleArmorPriority >= stenchPriority, 
        "Defensive abilities should have equal or higher priority than offensive")
end

-- Test: Ability Interaction Resolution
function AbilityEffectsTests.testResolveAbilityInteractions()
    -- Arrange
    local activeAbilities = {
        {abilityId = 1, pokemon = createMockPokemon()}, -- STENCH
        {abilityId = 2, pokemon = createMockPokemon()}, -- DRIZZLE
        {abilityId = 4, pokemon = createMockPokemon()}  -- BATTLE_ARMOR
    }
    local trigger = "POST_SUMMON"
    local battleContext = createMockBattleContext()
    
    -- Act
    local resolvedAbilities = AbilityEffects.resolveAbilityInteractions(
        activeAbilities, trigger, battleContext)
    
    -- Assert
    assertNotNil(resolvedAbilities, "Resolved abilities should not be nil")
    assert(#resolvedAbilities <= #activeAbilities, 
        "Resolved abilities should not exceed original count")
    
    -- Check priority sorting (higher priority first)
    if #resolvedAbilities > 1 then
        for i = 1, #resolvedAbilities - 1 do
            local currentPriority = AbilityEffects.getTriggerPriority(
                resolvedAbilities[i].abilityId, trigger)
            local nextPriority = AbilityEffects.getTriggerPriority(
                resolvedAbilities[i + 1].abilityId, trigger)
            
            assert(currentPriority >= nextPriority, 
                "Abilities should be sorted by priority (highest first)")
        end
    end
end

-- Test: Ability Suppression
function AbilityEffectsTests.testAbilitySuppression()
    -- Arrange
    local activeAbilities = {
        {abilityId = 1, pokemon = createMockPokemon()},
        {abilityId = 2, pokemon = createMockPokemon()}
    }
    local trigger = "POST_SUMMON"
    local battleContext = createMockBattleContext()
    battleContext.suppressAbilities = true
    
    -- Act
    local resolvedAbilities = AbilityEffects.resolveAbilityInteractions(
        activeAbilities, trigger, battleContext)
    
    -- Assert
    assertEqual(#resolvedAbilities, 0, 
        "No abilities should be resolved when suppressed")
end

-- Run all tests
function AbilityEffectsTests.runAllTests()
    local tests = {
        {"Trigger Types Constants", AbilityEffectsTests.testTriggerTypes},
        {"Effect Types Constants", AbilityEffectsTests.testEffectTypes},
        {"Check Condition - Always", AbilityEffectsTests.testCheckConditionAlways},
        {"Check Condition - Full HP", AbilityEffectsTests.testCheckConditionFullHP},
        {"Check Condition - Low HP", AbilityEffectsTests.testCheckConditionLowHP},
        {"Check Condition - Contact Move", AbilityEffectsTests.testCheckConditionContactMove},
        {"Apply Stat Stage Change", AbilityEffectsTests.testApplyStatStageChange},
        {"Apply Prevent Status", AbilityEffectsTests.testApplyPreventStatus},
        {"Apply Block Crit", AbilityEffectsTests.testApplyBlockCrit},
        {"Apply Prevent OHKO", AbilityEffectsTests.testApplyPreventOHKO},
        {"Prevent OHKO - Not Full HP", AbilityEffectsTests.testPreventOHKONotFullHP},
        {"Apply Flinch Chance", AbilityEffectsTests.testApplyFlinchChance},
        {"Get Trigger Priority", AbilityEffectsTests.testGetTriggerPriority},
        {"Resolve Ability Interactions", AbilityEffectsTests.testResolveAbilityInteractions},
        {"Ability Suppression", AbilityEffectsTests.testAbilitySuppression}
    }
    
    local passed = 0
    local failed = 0
    
    print("Running Ability Effects Tests...")
    print("==============================")
    
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
    
    print("==============================")
    print("Results: " .. passed .. " passed, " .. failed .. " failed")
    
    return failed == 0
end

return AbilityEffectsTests