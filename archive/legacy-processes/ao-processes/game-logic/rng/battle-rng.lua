-- Battle-specific deterministic RNG system
-- Ensures reproducible battle outcomes using battle seeds

local CryptoRNG = require("game-logic.rng.crypto-rng")

local BattleRNG = {}

-- Initialize battle with deterministic seed
function BattleRNG.initBattle(battleId, seed)
    if not battleId or not seed then
        error("Battle RNG requires both battleId and seed")
    end
    
    -- Combine battle ID and seed for unique determinism
    local battleSeed = battleId .. ":" .. seed
    CryptoRNG.initBattleRNG(battleSeed)
end

-- Get damage roll for moves (critical for parity)
function BattleRNG.damageRoll(minDamage, maxDamage)
    if not minDamage or not maxDamage then
        error("Damage roll requires min and max damage")
    end
    return CryptoRNG.battleRandomInt(minDamage, maxDamage)
end

-- Critical hit determination
function BattleRNG.criticalHit(critRate)
    critRate = critRate or 1
    local roll = CryptoRNG.battleRandomInt(1, 24)  -- Standard crit mechanics
    return roll <= critRate
end

-- Accuracy check for moves
function BattleRNG.accuracyCheck(accuracy)
    accuracy = accuracy or 100
    local roll = CryptoRNG.battleRandomInt(1, 100)
    return roll <= accuracy
end

-- Status condition chance
function BattleRNG.statusChance(chance)
    if not chance or chance <= 0 then
        return false
    end
    local roll = CryptoRNG.battleRandomInt(1, 100)
    return roll <= chance
end

-- Speed tie resolution
function BattleRNG.speedTie()
    return CryptoRNG.battleRandomInt(1, 2) == 1
end

-- Multi-hit move determination
function BattleRNG.multiHitCount(minHits, maxHits)
    minHits = minHits or 2
    maxHits = maxHits or 5
    return CryptoRNG.battleRandomInt(minHits, maxHits)
end

-- Confusion damage chance
function BattleRNG.confusionDamage()
    return CryptoRNG.battleRandomInt(1, 3) == 1  -- 33% chance
end

-- Sleep duration (1-3 turns)
function BattleRNG.sleepDuration()
    return CryptoRNG.battleRandomInt(1, 3)
end

-- Flinch chance
function BattleRNG.flinchChance(chance)
    chance = chance or 30  -- Default 30% for moves like Bite
    local roll = CryptoRNG.battleRandomInt(1, 100)
    return roll <= chance
end

-- Type effectiveness variation (for moves that have random type)
function BattleRNG.randomType(typeList)
    if not typeList or #typeList == 0 then
        error("Random type requires type list")
    end
    local index = CryptoRNG.battleRandomInt(1, #typeList)
    return typeList[index]
end

-- Weather duration
function BattleRNG.weatherDuration(baseDuration)
    baseDuration = baseDuration or 5
    -- Some weather effects can vary ±1 turn
    local variance = CryptoRNG.battleRandomInt(-1, 1)
    return math.max(1, baseDuration + variance)
end

-- Healing amount variation (for moves like Rest)
function BattleRNG.healingAmount(baseHealing, pokemon)
    -- Most healing is fixed, but some moves have variation
    return baseHealing
end

-- Item drop chance (for abilities like Pickup)
function BattleRNG.itemDrop(chance)
    chance = chance or 10  -- Default 10%
    local roll = CryptoRNG.battleRandomInt(1, 100)
    return roll <= chance
end

-- Reset battle RNG (called between battles)
function BattleRNG.reset()
    CryptoRNG.resetBattleRNG()
end

-- Get current state for debugging
function BattleRNG.getState()
    return CryptoRNG.getBattleState()
end

-- Generic random integer (for complex probability distributions)
function BattleRNG.randomInt(min, max)
    return CryptoRNG.battleRandomInt(min or 1, max or 100)
end

-- Generic random float (0-1)
function BattleRNG.randomFloat()
    return CryptoRNG.battleRandom()
end

-- Seed battle for testing
function BattleRNG.seed(testSeed)
    CryptoRNG.initBattleRNG(testSeed or "test-battle-seed")
end

return BattleRNG