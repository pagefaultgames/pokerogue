-- Debug test for switch-in damage issues

local TestSetup = require("test-setup")
local TestFramework = TestSetup.setupLuaPath()
TestSetup.initializeTestEnvironment()

local EntryHazards = require("game-logic.battle.entry-hazards")
local SwitchInEffects = require("game-logic.battle.switch-in-effects")
local MoveEffects = require("game-logic.battle.move-effects")
local TestEnums = TestSetup.TestEnums

-- Mock Enums for this test
package.loaded["data.constants.enums"] = TestEnums

-- Create test battle state
local battleState = TestSetup.createStandardBattleState()

print("=== Debug Switch-in Damage Test ===")

-- Step 1: Set up Stealth Rock on enemy side manually
battleState.battleConditions.entryHazards.enemy.stealthRock = true
print("1. Manually set Stealth Rock on enemy side:", battleState.battleConditions.entryHazards.enemy.stealthRock)

-- Step 2: Create a Charizard (Fire/Flying - should take 4x damage from Stealth Rock)
local charizard = TestSetup.createStandardPokemon({
    name = "Charizard", 
    species = 6,
    types = {TestEnums.PokemonType.FIRE, TestEnums.PokemonType.FLYING},
    side = "enemy",
    hp = 150,
    ability = 66 -- Set to a specific ability ID that's not Magic Guard
})

print("2. Charizard created:")
print("   Name:", charizard.name)
print("   Side:", charizard.battleData.side)
print("   Types:", charizard.species.type1, charizard.species.type2)
print("   Current HP:", charizard.currentHP)
print("   Max HP:", charizard.maxHP)
print("   Ability:", charizard.ability)
print("   Magic Guard ID:", TestEnums.AbilityId.MAGIC_GUARD)
print("   Blaze ID:", TestEnums.AbilityId.BLAZE)
-- Load Enums the same way EntryHazards does
local LocalEnums = nil
pcall(function() LocalEnums = require("data.constants.enums") end)
print("   Real Enums Magic Guard ID:", LocalEnums and LocalEnums.AbilityId.MAGIC_GUARD or "Enums not loaded")

-- Step 3: Test switch-in effects
print("3. Testing switch-in effects...")
print("   Battle conditions exist:", battleState.battleConditions ~= nil)
print("   Entry hazards exist:", battleState.battleConditions.entryHazards ~= nil)
print("   Enemy hazards exist:", battleState.battleConditions.entryHazards.enemy ~= nil)

-- Test effect collection separately
local effects = SwitchInEffects.collectSwitchInEffects(battleState, charizard, "enemy")
print("   Collected effects count:", #effects)
for i, effect in ipairs(effects) do
    print("     Effect " .. i .. ":", effect.type, effect.hazardType)
end

-- Test EntryHazards directly
print("   Testing EntryHazards.processHazardEffects directly:")
print("   Checking dependencies:")
local TypeChart = nil
local Enums = nil
pcall(function() TypeChart = require("data.constants.type-chart") end)
pcall(function() Enums = require("data.constants.enums") end)
print("     TypeChart loaded:", TypeChart ~= nil)
print("     Enums loaded:", Enums ~= nil)

-- Test effectiveness calculation manually
print("     Charizard types:", charizard.species.type1, charizard.species.type2)
print("     Fire type constant:", Enums.PokemonType.FIRE)
print("     Flying type constant:", Enums.PokemonType.FLYING) 
print("     Rock type constant:", Enums.PokemonType.ROCK)
print("     TypeChart.getEffectiveness function exists:", TypeChart.getEffectiveness ~= nil)

if TypeChart.getEffectiveness then
    local fireEff = TypeChart.getEffectiveness(Enums.PokemonType.ROCK, Enums.PokemonType.FIRE)
    local flyingEff = TypeChart.getEffectiveness(Enums.PokemonType.ROCK, Enums.PokemonType.FLYING)
    print("     Rock vs Fire effectiveness:", fireEff)
    print("     Rock vs Flying effectiveness:", flyingEff)
end

local effectiveness = EntryHazards.calculateStealthRockEffectiveness(charizard)
print("     Stealth Rock effectiveness:", effectiveness)
print("     Base damage (1/8 HP):", charizard.maxHP * 0.125)
print("     Final damage calc:", math.max(1, math.floor(charizard.maxHP * 0.125 * effectiveness)))

-- Test immunity check directly
local config = EntryHazards.HazardConfig[EntryHazards.HazardType.STEALTH_ROCK]
local immunity = EntryHazards.checkHazardImmunity(charizard, EntryHazards.HazardType.STEALTH_ROCK, config)
print("     Immunity check:")
print("       Immune:", immunity.immune)
print("       Messages:", #immunity.messages)
if immunity.messages and #immunity.messages > 0 then
    for i, msg in ipairs(immunity.messages) do
        print("         Message " .. i .. ":", msg)
    end
end

-- Test processIndividualHazard directly
local hazards = battleState.battleConditions.entryHazards.enemy
local individualResult = EntryHazards.processIndividualHazard(battleState, charizard, EntryHazards.HazardType.STEALTH_ROCK, hazards)
print("     Individual hazard result:")
print("       Type:", individualResult and individualResult.hazardType or "nil")
print("       Damage:", individualResult and individualResult.damage or "nil")
print("       Messages:", individualResult and #individualResult.messages or "nil")

local hazardResult = EntryHazards.processHazardEffects(battleState, charizard)
print("     Success:", hazardResult.success)
print("     Damage taken:", hazardResult.damageTaken)
print("     Effects count:", hazardResult.effects and #hazardResult.effects or "nil")
if hazardResult.effects then
    for i, effect in ipairs(hazardResult.effects) do
        print("       Effect " .. i .. ":", effect.hazardType, effect.damage)
    end
end

local switchResult = SwitchInEffects.processAllSwitchInEffects(battleState, charizard, "enemy")

print("4. Switch-in result:")
print("   Success:", switchResult.success)
print("   Damage taken:", switchResult.damageTaken)
print("   Effects count:", switchResult.effectsApplied and #switchResult.effectsApplied or "nil")
if switchResult.effectsApplied then
    for i, effect in ipairs(switchResult.effectsApplied) do
        print("     Effect " .. i .. ":", effect.type, effect.hazardType, effect.damage)
    end
end

print("5. Charizard after switch-in:")
print("   Current HP:", charizard.currentHP)
print("   Max HP:", charizard.maxHP)
print("   HP lost:", charizard.maxHP - charizard.currentHP)

print("=== End Debug Test ===")