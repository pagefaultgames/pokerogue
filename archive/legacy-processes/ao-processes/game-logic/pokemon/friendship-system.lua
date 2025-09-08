--[[
Pokemon Friendship System
Implements friendship tracking, gain/loss mechanics, and battle bonuses
Matches TypeScript reference implementation for exact behavioral parity

Features:
- Friendship gain from battle participation, leveling, and item usage
- Friendship loss from fainting and specific items
- Friendship battle bonuses (critical hits, status cure, evasion, survival)
- Friendship range checking for NPCs and evolution
- Deterministic processing using AO crypto module
--]]

local FriendshipSystem = {}

-- Import dependencies
local SpeciesDatabase = require("data.species.species-database")
local ItemDatabase = require("data.items.item-database")
local CryptoRNG = require("game-logic.rng.crypto-rng")
-- local Enums = require("data.constants.enums")  -- Reserved for future use

-- Friendship constants matching TypeScript implementation
local MIN_FRIENDSHIP = 0
local MAX_FRIENDSHIP = 255
local DEFAULT_BASE_FRIENDSHIP = 50  -- Default for caught Pokemon
local TRADED_BASE_FRIENDSHIP = 120  -- For traded Pokemon

-- Friendship gain rates per action type
local FRIENDSHIP_GAIN_RATES = {
    BATTLE_PARTICIPATION = {
        [0] = 5,   -- 0-99 friendship: +5
        [100] = 3, -- 100-199 friendship: +3
        [200] = 2  -- 200-255 friendship: +2
    },
    LEVEL_UP = {
        [0] = 5,   -- 0-99 friendship: +5
        [100] = 3, -- 100-199 friendship: +3
        [200] = 2  -- 200-255 friendship: +2
    },
    VITAMIN_USE = {
        [0] = 5,   -- 0-99 friendship: +5
        [100] = 3, -- 100-199 friendship: +3
        [200] = 2  -- 200-255 friendship: +2
    },
    BERRY_USE = {
        [0] = 10,  -- 0-99 friendship: +10
        [100] = 5, -- 100-199 friendship: +5
        [200] = 2  -- 200-255 friendship: +2
    },
    MASSAGE = {
        [0] = 30,  -- 0-99 friendship: +30
        [100] = 20, -- 100-199 friendship: +20
        [200] = 10  -- 200-255 friendship: +10
    },
    MASSAGE_USE = {
        [0] = 30,  -- 0-99 friendship: +30
        [100] = 20, -- 100-199 friendship: +20
        [200] = 10  -- 200-255 friendship: +10
    }
}

-- Friendship loss rates
local FRIENDSHIP_LOSS_RATES = {
    FAINTING = {
        [0] = -1,   -- 0-99 friendship: -1
        [100] = -5, -- 100-199 friendship: -5
        [200] = -10 -- 200-255 friendship: -10
    },
    BITTER_ITEM = {
        [0] = -5,   -- 0-99 friendship: -5
        [100] = -5, -- 100-199 friendship: -5
        [200] = -10 -- 200-255 friendship: -10
    }
}

-- Friendship ranges for text descriptions
local FRIENDSHIP_RANGES = {
    {min = 0, max = 50, description = "hates traveling with you"},
    {min = 51, max = 100, description = "dislikes you"},
    {min = 101, max = 150, description = "is neutral about you"},
    {min = 151, max = 200, description = "likes you quite a lot"},
    {min = 201, max = 254, description = "is very happy"},
    {min = 255, max = 255, description = "loves you"}
}

-- Battle bonus thresholds
local BATTLE_BONUS_THRESHOLD = 220  -- High friendship threshold for battle bonuses
local CRITICAL_HIT_BONUS_CHANCE = 12.5  -- 1/8 chance for bonus critical hit
local STATUS_CURE_CHANCE = 20.0         -- 1/5 chance to cure status
local DAMAGE_EVASION_CHANCE = 10.0      -- 1/10 chance to avoid damage
local SURVIVAL_CHANCE = 10.0            -- 1/10 chance to survive fatal hit with 1 HP

-- Core friendship tracking functions

-- Initialize friendship value for newly caught/traded Pokemon
-- @param pokemon: Pokemon data
-- @param isTraded: Boolean indicating if Pokemon was traded
-- @param speciesId: Species ID for base friendship lookup
-- @return: Initial friendship value
function FriendshipSystem.initializeFriendship(pokemon, isTraded, speciesId)
    if not pokemon then
        return DEFAULT_BASE_FRIENDSHIP
    end

    -- Get base friendship from species data
    local baseFriendship = DEFAULT_BASE_FRIENDSHIP

    if speciesId then
        SpeciesDatabase.init()
        local speciesData = SpeciesDatabase.getSpecies(speciesId)
        if speciesData and speciesData.baseFriendship then
            baseFriendship = speciesData.baseFriendship
        end
    end

    -- Traded Pokemon start with higher friendship
    if isTraded then
        baseFriendship = math.max(baseFriendship, TRADED_BASE_FRIENDSHIP)
    end

    -- Set initial friendship value
    pokemon.friendship = baseFriendship

    return baseFriendship
end

-- Get current friendship gain rate based on friendship level
-- @param currentFriendship: Current friendship value (0-255)
-- @param actionType: Type of action (key from FRIENDSHIP_GAIN_RATES)
-- @return: Friendship gain amount
function FriendshipSystem.getFriendshipGainRate(currentFriendship, actionType)
    if not currentFriendship or not actionType then
        return 0
    end

    local gainRates = FRIENDSHIP_GAIN_RATES[actionType]
    if not gainRates then
        return 0
    end

    -- Find appropriate gain rate based on current friendship
    if currentFriendship < 100 then
        return gainRates[0] or 0
    elseif currentFriendship < 200 then
        return gainRates[100] or 0
    else
        return gainRates[200] or 0
    end
end

-- Get current friendship loss rate based on friendship level
-- @param currentFriendship: Current friendship value (0-255)
-- @param lossType: Type of loss (key from FRIENDSHIP_LOSS_RATES)
-- @return: Friendship loss amount (negative value)
function FriendshipSystem.getFriendshipLossRate(currentFriendship, lossType)
    if not currentFriendship or not lossType then
        return 0
    end

    local lossRates = FRIENDSHIP_LOSS_RATES[lossType]
    if not lossRates then
        return 0
    end

    -- Find appropriate loss rate based on current friendship
    if currentFriendship < 100 then
        return lossRates[0] or 0
    elseif currentFriendship < 200 then
        return lossRates[100] or 0
    else
        return lossRates[200] or 0
    end
end

-- Apply friendship change with proper bounds checking
-- @param pokemon: Pokemon data
-- @param change: Friendship change amount (positive or negative)
-- @return: New friendship value, actual change applied
function FriendshipSystem.applyFriendshipChange(pokemon, change)
    if not pokemon then
        return 0, 0
    end

    local oldFriendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP
    local newFriendship = math.max(MIN_FRIENDSHIP, math.min(MAX_FRIENDSHIP, oldFriendship + change))
    local actualChange = newFriendship - oldFriendship

    pokemon.friendship = newFriendship

    return newFriendship, actualChange
end

-- Friendship gain mechanics

-- Process friendship gain from battle participation
-- @param pokemon: Pokemon that participated in battle
-- @param battleContext: Battle context information
-- @return: Friendship gain amount
function FriendshipSystem.processBattleFriendshipGain(pokemon, battleContext)
    if not pokemon then
        return 0
    end

    local currentFriendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP
    local baseGain = FriendshipSystem.getFriendshipGainRate(currentFriendship, "BATTLE_PARTICIPATION")

    -- Apply battle context modifiers
    local modifiedGain = baseGain

    -- Trainer battles give more friendship than wild battles
    if battleContext and battleContext.battleType == "trainer" then
        modifiedGain = math.floor(modifiedGain * 1.5)
    end

    -- Check for friendship-boosting items (Luxury Ball effect, Soothe Bell)
    if pokemon.caughtInLuxuryBall then
        modifiedGain = modifiedGain * 2
    end

    if pokemon.heldItem and ItemDatabase.isFriendshipBoostingItem then
        local itemData = ItemDatabase.getItem(pokemon.heldItem)
        if itemData and itemData.friendshipBoostMultiplier then
            modifiedGain = math.floor(modifiedGain * itemData.friendshipBoostMultiplier)
        end
    end

    local _, actualGain = FriendshipSystem.applyFriendshipChange(pokemon, modifiedGain)

    return actualGain
end

-- Process friendship gain from leveling up
-- @param pokemon: Pokemon that leveled up
-- @return: Friendship gain amount
function FriendshipSystem.processLevelUpFriendshipGain(pokemon)
    if not pokemon then
        return 0
    end

    local currentFriendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP
    local baseGain = FriendshipSystem.getFriendshipGainRate(currentFriendship, "LEVEL_UP")

    -- Apply friendship-boosting item effects
    local modifiedGain = baseGain

    if pokemon.caughtInLuxuryBall then
        modifiedGain = modifiedGain * 2
    end

    if pokemon.heldItem and ItemDatabase.isFriendshipBoostingItem then
        local itemData = ItemDatabase.getItem(pokemon.heldItem)
        if itemData and itemData.friendshipBoostMultiplier then
            modifiedGain = math.floor(modifiedGain * itemData.friendshipBoostMultiplier)
        end
    end

    local _, actualGain = FriendshipSystem.applyFriendshipChange(pokemon, modifiedGain)

    return actualGain
end

-- Process friendship gain from item usage
-- @param pokemon: Pokemon receiving item
-- @param itemType: Type of item used ("VITAMIN", "BERRY", "MASSAGE")
-- @return: Friendship gain amount
function FriendshipSystem.processItemFriendshipGain(pokemon, itemType)
    if not pokemon or not itemType then
        return 0
    end

    local currentFriendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP
    local baseGain = FriendshipSystem.getFriendshipGainRate(currentFriendship, itemType .. "_USE")

    if baseGain == 0 then
        -- Handle direct item type names
        baseGain = FriendshipSystem.getFriendshipGainRate(currentFriendship, itemType)
    end
    
    if baseGain == 0 then
        -- Fallback for unknown item types
        baseGain = FriendshipSystem.getFriendshipGainRate(currentFriendship, "VITAMIN_USE")
    end

    -- Apply friendship-boosting effects
    local modifiedGain = baseGain

    if pokemon.caughtInLuxuryBall then
        modifiedGain = modifiedGain * 2
    end

    local _, actualGain = FriendshipSystem.applyFriendshipChange(pokemon, modifiedGain)

    return actualGain
end

-- Friendship loss mechanics

-- Process friendship loss from fainting
-- @param pokemon: Pokemon that fainted
-- @param battleContext: Battle context information
-- @return: Friendship loss amount (negative value)
function FriendshipSystem.processFaintingFriendshipLoss(pokemon, battleContext)
    if not pokemon then
        return 0
    end

    local currentFriendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP
    local baseLoss = FriendshipSystem.getFriendshipLossRate(currentFriendship, "FAINTING")

    -- Apply context modifiers
    local modifiedLoss = baseLoss

    -- More severe loss in important battles
    if battleContext and battleContext.battleType == "gym" then
        modifiedLoss = math.floor(modifiedLoss * 1.5)
    elseif battleContext and battleContext.battleType == "elite_four" then
        modifiedLoss = math.floor(modifiedLoss * 2)
    end

    -- Pokemon level affects loss (higher level = less loss)
    if pokemon.level and pokemon.level >= 50 then
        modifiedLoss = math.ceil(modifiedLoss * 0.8)  -- 20% reduction for high level
    end

    local _, actualLoss = FriendshipSystem.applyFriendshipChange(pokemon, modifiedLoss)

    return actualLoss
end

-- Process friendship loss from bitter items
-- @param pokemon: Pokemon receiving bitter item
-- @param itemId: ID of the bitter item used
-- @return: Friendship loss amount (negative value)
function FriendshipSystem.processBitterItemFriendshipLoss(pokemon, itemId)
    if not pokemon then
        return 0
    end

    -- Items that cause friendship loss
    local bitterItems = {
        -- Revival herbs and bitter medicines
        ["REVIVAL_HERB"] = true,
        ["ENERGY_ROOT"] = true,
        ["HEAL_POWDER"] = true
    }

    -- Check if item causes friendship loss
    local itemData = nil
    if ItemDatabase.getItem then
        itemData = ItemDatabase.getItem(itemId)
    end
    local isBitterItem = false

    if itemData then
        isBitterItem = itemData.isBitter or bitterItems[itemData.name]
    else
        isBitterItem = bitterItems[itemId]
    end

    if not isBitterItem then
        return 0  -- No friendship loss for non-bitter items
    end

    local currentFriendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP
    local baseLoss = FriendshipSystem.getFriendshipLossRate(currentFriendship, "BITTER_ITEM")

    local _, actualLoss = FriendshipSystem.applyFriendshipChange(pokemon, baseLoss)

    return actualLoss
end

-- Friendship battle bonus mechanics

-- Check if Pokemon has high friendship for battle bonuses
-- @param pokemon: Pokemon to check
-- @return: Boolean indicating if Pokemon has high friendship
function FriendshipSystem.hasHighFriendship(pokemon)
    if not pokemon then
        return false
    end

    local friendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP
    return friendship >= BATTLE_BONUS_THRESHOLD
end

-- Calculate friendship-based critical hit bonus
-- @param pokemon: Attacking Pokemon
-- @param battleSeed: Seed for deterministic RNG
-- @return: Boolean indicating if friendship bonus critical hit occurs
function FriendshipSystem.calculateFriendshipCriticalHitBonus(pokemon, battleSeed)
    if not FriendshipSystem.hasHighFriendship(pokemon) then
        return false
    end

    -- Use deterministic RNG for battle replay compatibility
    if battleSeed then
        CryptoRNG.initBattleRNG(battleSeed)
    end

    local roll = CryptoRNG.battleRandom() * 100
    local bonusOccurs = roll < CRITICAL_HIT_BONUS_CHANCE

    return bonusOccurs
end

-- Calculate friendship-based status cure
-- @param pokemon: Pokemon with status condition
-- @param battleSeed: Seed for deterministic RNG
-- @return: Boolean indicating if friendship cures status
function FriendshipSystem.calculateFriendshipStatusCure(pokemon, battleSeed)
    if not FriendshipSystem.hasHighFriendship(pokemon) then
        return false
    end

    -- Only cure certain status conditions
    if not pokemon.statusEffect then
        return false
    end

    local curableStatuses = {
        "SLEEP", "POISON", "BURN", "FREEZE", "PARALYSIS"
    }

    local canCure = false
    for _, status in ipairs(curableStatuses) do
        if pokemon.statusEffect == status then
            canCure = true
            break
        end
    end

    if not canCure then
        return false
    end

    -- Use deterministic RNG
    if battleSeed then
        CryptoRNG.initBattleRNG(battleSeed)
    end

    local roll = CryptoRNG.battleRandom() * 100
    local cureOccurs = roll < STATUS_CURE_CHANCE

    return cureOccurs
end

-- Calculate friendship-based damage evasion
-- @param pokemon: Defending Pokemon
-- @param battleSeed: Seed for deterministic RNG
-- @return: Boolean indicating if friendship enables evasion
function FriendshipSystem.calculateFriendshipDamageEvasion(pokemon, battleSeed)
    if not FriendshipSystem.hasHighFriendship(pokemon) then
        return false
    end

    -- Use deterministic RNG
    if battleSeed then
        CryptoRNG.initBattleRNG(battleSeed)
    end

    local roll = CryptoRNG.battleRandom() * 100
    local evasionOccurs = roll < DAMAGE_EVASION_CHANCE

    return evasionOccurs
end

-- Calculate friendship-based survival (endure fatal hit with 1 HP)
-- @param pokemon: Pokemon taking fatal damage
-- @param battleSeed: Seed for deterministic RNG
-- @return: Boolean indicating if friendship enables survival
function FriendshipSystem.calculateFriendshipSurvival(pokemon, battleSeed)
    if not FriendshipSystem.hasHighFriendship(pokemon) then
        return false
    end

    -- Only works if Pokemon would be KO'd (HP > 0 but damage >= current HP)
    if not pokemon.stats or not pokemon.stats.hp or pokemon.stats.hp <= 0 then
        return false
    end

    -- Use deterministic RNG
    if battleSeed then
        CryptoRNG.initBattleRNG(battleSeed)
    end

    local roll = CryptoRNG.battleRandom() * 100
    local survivalOccurs = roll < SURVIVAL_CHANCE

    return survivalOccurs
end

-- Friendship display and checking functions

-- Get friendship range description for NPCs/UI
-- @param pokemon: Pokemon to check
-- @return: Text description of friendship level
function FriendshipSystem.getFriendshipDescription(pokemon)
    if not pokemon then
        return "Unknown friendship level"
    end

    local friendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP

    for _, range in ipairs(FRIENDSHIP_RANGES) do
        if friendship >= range.min and friendship <= range.max then
            return range.description
        end
    end

    return "friendship level unknown"
end

-- Get numerical friendship range for display
-- @param pokemon: Pokemon to check
-- @return: Range string (e.g., "151-200")
function FriendshipSystem.getFriendshipRange(pokemon)
    if not pokemon then
        return "0-50"
    end

    local friendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP

    for _, range in ipairs(FRIENDSHIP_RANGES) do
        if friendship >= range.min and friendship <= range.max then
            return range.min .. "-" .. range.max
        end
    end

    return "0-255"
end

-- Check if friendship meets evolution threshold
-- @param pokemon: Pokemon to check for evolution
-- @param requiredFriendship: Required friendship level (default 220)
-- @return: Boolean indicating if friendship requirement is met
function FriendshipSystem.checkFriendshipEvolutionRequirement(pokemon, requiredFriendship)
    if not pokemon then
        return false
    end

    local threshold = requiredFriendship or BATTLE_BONUS_THRESHOLD
    local friendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP

    return friendship >= threshold
end

-- Calculate Return/Frustration move power based on friendship
-- @param pokemon: Pokemon using the move
-- @param isReturnMove: Boolean indicating if move is Return (true) or Frustration (false)
-- @return: Move power based on friendship
function FriendshipSystem.calculateFriendshipMovePower(pokemon, isReturnMove)
    if not pokemon then
        return 50  -- Default power
    end

    local friendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP

    if isReturnMove then
        -- Return: Higher friendship = higher power (max 102 at friendship 255)
        return math.floor((friendship * 102) / 255)
    else
        -- Frustration: Lower friendship = higher power (max 102 at friendship 0)
        return math.floor(((255 - friendship) * 102) / 255)
    end
end

-- Friendship persistence and validation

-- Validate friendship value integrity
-- @param pokemon: Pokemon to validate
-- @return: Boolean indicating if friendship is valid, error message if invalid
function FriendshipSystem.validateFriendship(pokemon)
    if not pokemon then
        return false, "Pokemon data required"
    end

    local friendship = pokemon.friendship

    if not friendship then
        return false, "Friendship value missing"
    end

    if type(friendship) ~= "number" then
        return false, "Friendship must be a number"
    end

    if friendship < MIN_FRIENDSHIP or friendship > MAX_FRIENDSHIP then
        return false, "Friendship must be between " .. MIN_FRIENDSHIP .. " and " .. MAX_FRIENDSHIP
    end

    if friendship ~= math.floor(friendship) then
        return false, "Friendship must be an integer"
    end

    return true
end

-- Ensure Pokemon has valid friendship value
-- @param pokemon: Pokemon to check/fix
-- @return: Boolean indicating if friendship was valid or corrected
function FriendshipSystem.ensureValidFriendship(pokemon)
    if not pokemon then
        return false
    end

    local isValid, _ = FriendshipSystem.validateFriendship(pokemon)

    if not isValid then
        -- Set to default base friendship if invalid
        pokemon.friendship = DEFAULT_BASE_FRIENDSHIP
        return false
    end

    return true
end

-- Get friendship statistics for debugging
-- @param pokemon: Pokemon to analyze
-- @return: Table with friendship statistics
function FriendshipSystem.getFriendshipStatistics(pokemon)
    if not pokemon then
        return {
            current_friendship = 0,
            range_description = "Unknown",
            high_friendship = false,
            evolution_ready = false,
            battle_bonus_eligible = false,
            return_power = 0,
            frustration_power = 102
        }
    end

    local friendship = pokemon.friendship or DEFAULT_BASE_FRIENDSHIP
    local highFriendship = FriendshipSystem.hasHighFriendship(pokemon)

    return {
        current_friendship = friendship,
        range_description = FriendshipSystem.getFriendshipDescription(pokemon),
        range_numeric = FriendshipSystem.getFriendshipRange(pokemon),
        high_friendship = highFriendship,
        evolution_ready = FriendshipSystem.checkFriendshipEvolutionRequirement(pokemon),
        battle_bonus_eligible = highFriendship,
        return_power = FriendshipSystem.calculateFriendshipMovePower(pokemon, true),
        frustration_power = FriendshipSystem.calculateFriendshipMovePower(pokemon, false)
    }
end

-- Export constants for external use
FriendshipSystem.MIN_FRIENDSHIP = MIN_FRIENDSHIP
FriendshipSystem.MAX_FRIENDSHIP = MAX_FRIENDSHIP
FriendshipSystem.BATTLE_BONUS_THRESHOLD = BATTLE_BONUS_THRESHOLD
FriendshipSystem.FRIENDSHIP_RANGES = FRIENDSHIP_RANGES

return FriendshipSystem