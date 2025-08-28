-- Query Handler for AO Process
-- Handles species, evolution, and game data queries
-- Compatible with AOConnect protocol

local QueryHandler = {}

-- Import required modules
local SpeciesDatabase = require('data.species.species-database')
local EvolutionChains = require('data.species.evolution-chains')
local TypeChart = require('data.constants.type-chart')
local AbilityDatabase = require('data.abilities.ability-database')
local AbilityIndexes = require('data.abilities.ability-indexes')
local AbilityEffects = require('data.abilities.ability-effects')
local PassiveAbilities = require('data.abilities.passive-abilities')

-- Import Pokemon instance management modules
local PokemonManager = require("game-logic.pokemon.pokemon-manager")
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")
local PlayerIndex = require("data.pokemon-instances.player-index")
local CustomizationManager = require("game-logic.pokemon.customization-manager")

-- Query message handlers
local queryHandlers = {}

-- Species data queries
queryHandlers["query-species-data"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    local dataType = msg.Data and msg.Data.dataType or "all"
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local species = SpeciesDatabase.getSpecies(tonumber(speciesId))
    if not species then
        return {
            success = false,
            error = "Species not found: " .. tostring(speciesId)
        }
    end
    
    local result = {
        success = true,
        speciesId = species.id,
        name = species.name
    }
    
    if dataType == "all" or dataType == "stats" then
        result.baseStats = species.baseStats
        result.types = species.types
    end
    
    if dataType == "all" or dataType == "abilities" then
        result.abilities = species.abilities
    end
    
    if dataType == "all" or dataType == "breeding" then
        result.eggGroups = species.eggGroups
        result.genderRatio = species.genderRatio
    end
    
    if dataType == "all" or dataType == "encounter" then
        result.rarity = species.rarity
        result.encounterRate = species.encounterRate
    end
    
    return result
end

-- Evolution chain queries
queryHandlers["query-evolution-chain"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local chain = EvolutionChains.getEvolutionChain(tonumber(speciesId))
    local evolutions = EvolutionChains.getPossibleEvolutions(tonumber(speciesId))
    local preEvolution = EvolutionChains.getPreEvolution(tonumber(speciesId))
    
    return {
        success = true,
        speciesId = tonumber(speciesId),
        evolutionChain = chain,
        possibleEvolutions = evolutions,
        preEvolution = preEvolution,
        canEvolve = #evolutions > 0
    }
end

-- Species by type queries
queryHandlers["query-species-by-type"] = function(msg)
    local pokemonType = msg.Data and msg.Data.type
    
    if not pokemonType then
        return {
            success = false,
            error = "Missing type parameter"
        }
    end
    
    local species = SpeciesDatabase.getSpeciesByType(pokemonType)
    
    return {
        success = true,
        type = pokemonType,
        species = species,
        count = #species
    }
end

-- Species learnset queries
queryHandlers["query-species-learnset"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    local level = msg.Data and msg.Data.level
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local species = SpeciesDatabase.getSpecies(tonumber(speciesId))
    if not species then
        return {
            success = false,
            error = "Species not found: " .. tostring(speciesId)
        }
    end
    
    local result = {
        success = true,
        speciesId = tonumber(speciesId),
        learnset = species.learnset or {}
    }
    
    if level then
        local movesAtLevel = {}
        for moveLevel, moves in pairs(species.learnset or {}) do
            if tonumber(moveLevel) <= tonumber(level) then
                for _, moveId in ipairs(moves) do
                    table.insert(movesAtLevel, moveId)
                end
            end
        end
        result.availableMoves = movesAtLevel
        result.filterLevel = tonumber(level)
    end
    
    return result
end

-- Type effectiveness queries
queryHandlers["query-type-effectiveness"] = function(msg)
    local attackType = msg.Data and msg.Data.attackType
    local defenseTypes = msg.Data and msg.Data.defenseTypes
    
    if not attackType then
        return {
            success = false,
            error = "Missing attackType parameter"
        }
    end
    
    if not defenseTypes then
        return {
            success = false,
            error = "Missing defenseTypes parameter"
        }
    end
    
    local effectiveness = TypeChart.getEffectiveness(attackType, defenseTypes)
    
    return {
        success = true,
        attackType = attackType,
        defenseTypes = defenseTypes,
        effectiveness = effectiveness,
        description = TypeChart.getEffectivenessDescription(effectiveness)
    }
end

-- Species validation queries
queryHandlers["query-species-validation"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local isValid, error = SpeciesDatabase.validateSpecies(tonumber(speciesId))
    
    return {
        success = true,
        speciesId = tonumber(speciesId),
        isValid = isValid,
        validationError = error
    }
end

-- Base stats queries
queryHandlers["query-base-stats"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local baseStats = SpeciesDatabase.getBaseStats(tonumber(speciesId))
    if not baseStats then
        return {
            success = false,
            error = "Species not found: " .. tostring(speciesId)
        }
    end
    
    return {
        success = true,
        speciesId = tonumber(speciesId),
        baseStats = baseStats,
        statNames = {"hp", "attack", "defense", "spAttack", "spDefense", "speed"},
        total = baseStats[1] + baseStats[2] + baseStats[3] + baseStats[4] + baseStats[5] + baseStats[6]
    }
end

-- Evolution requirements queries
queryHandlers["query-evolution-requirements"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local evolutions = EvolutionChains.getPossibleEvolutions(tonumber(speciesId))
    
    return {
        success = true,
        speciesId = tonumber(speciesId),
        evolutions = evolutions,
        canEvolve = #evolutions > 0,
        evolutionCount = #evolutions
    }
end

-- Evolution validation queries
queryHandlers["query-evolution-validation"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    local pokemonData = msg.Data and msg.Data.pokemonData
    local targetSpeciesId = msg.Data and msg.Data.targetSpeciesId
    
    if not speciesId or not pokemonData or not targetSpeciesId then
        return {
            success = false,
            error = "Missing required parameters: speciesId, pokemonData, targetSpeciesId"
        }
    end
    
    local evolutions = EvolutionChains.getPossibleEvolutions(tonumber(speciesId))
    local targetEvolution = nil
    
    for _, evolution in ipairs(evolutions) do
        if evolution.speciesId == tonumber(targetSpeciesId) then
            targetEvolution = evolution
            break
        end
    end
    
    if not targetEvolution then
        return {
            success = false,
            error = "Invalid evolution target: " .. tostring(targetSpeciesId) .. " for species " .. tostring(speciesId)
        }
    end
    
    local canEvolve, reason = EvolutionChains.validateEvolutionConditions(
        tonumber(speciesId), 
        pokemonData, 
        targetEvolution
    )
    
    return {
        success = true,
        speciesId = tonumber(speciesId),
        targetSpeciesId = tonumber(targetSpeciesId),
        canEvolve = canEvolve,
        reason = reason,
        conditions = targetEvolution
    }
end

-- Breeding compatibility queries
queryHandlers["query-breeding-compatibility"] = function(msg)
    local species1Id = msg.Data and msg.Data.species1Id
    local species2Id = msg.Data and msg.Data.species2Id
    
    if not species1Id or not species2Id then
        return {
            success = false,
            error = "Missing required parameters: species1Id, species2Id"
        }
    end
    
    local canBreed = SpeciesDatabase.canBreedTogether(tonumber(species1Id), tonumber(species2Id))
    local species1EggGroups = SpeciesDatabase.getEggGroups(tonumber(species1Id))
    local species2EggGroups = SpeciesDatabase.getEggGroups(tonumber(species2Id))
    
    return {
        success = true,
        species1Id = tonumber(species1Id),
        species2Id = tonumber(species2Id),
        canBreed = canBreed,
        species1EggGroups = species1EggGroups,
        species2EggGroups = species2EggGroups
    }
end

-- Egg group queries
queryHandlers["query-egg-group"] = function(msg)
    local eggGroup = msg.Data and msg.Data.eggGroup
    
    if not eggGroup then
        return {
            success = false,
            error = "Missing eggGroup parameter"
        }
    end
    
    local species = SpeciesDatabase.getSpeciesByEggGroup(eggGroup)
    
    return {
        success = true,
        eggGroup = eggGroup,
        species = species,
        count = #species
    }
end

-- Species encounter queries
queryHandlers["query-species-encounters"] = function(msg)
    local biome = msg.Data and msg.Data.biome
    local rarity = msg.Data and msg.Data.rarity
    
    local result = {
        success = true
    }
    
    if biome then
        local speciesInBiome = SpeciesDatabase.getSpeciesByBiome(biome)
        result.biome = biome
        result.speciesInBiome = speciesInBiome
        result.biomeCount = #speciesInBiome
    end
    
    if rarity then
        local speciesWithRarity = SpeciesDatabase.getSpeciesByRarity(rarity)
        result.rarity = rarity
        result.speciesWithRarity = speciesWithRarity
        result.rarityCount = #speciesWithRarity
    end
    
    return result
end

-- Species biome queries
queryHandlers["query-species-biomes"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local biomes = SpeciesDatabase.getBiomes(tonumber(speciesId))
    local rarity = SpeciesDatabase.getRarity(tonumber(speciesId))
    local encounterRate = SpeciesDatabase.getEncounterRate(tonumber(speciesId))
    
    return {
        success = true,
        speciesId = tonumber(speciesId),
        biomes = biomes,
        rarity = rarity,
        encounterRate = encounterRate
    }
end

-- Ability data queries
queryHandlers["query-ability-data"] = function(msg)
    local abilityId = msg.Data and msg.Data.abilityId
    local dataType = msg.Data and msg.Data.dataType or "all"
    
    if not abilityId then
        return {
            success = false,
            error = "Missing abilityId parameter"
        }
    end
    
    local ability = AbilityDatabase.getAbility(tonumber(abilityId))
    if not ability then
        return {
            success = false,
            error = "Ability not found: " .. tostring(abilityId)
        }
    end
    
    local result = {
        success = true,
        abilityId = ability.id,
        name = ability.name,
        description = ability.description
    }
    
    if dataType == "all" or dataType == "details" then
        result.generation = ability.generation
        result.postSummonPriority = ability.postSummonPriority
        result.isBypassFaint = ability.isBypassFaint
        result.isIgnorable = ability.isIgnorable
        result.isSuppressable = ability.isSuppressable
        result.isCopiable = ability.isCopiable
        result.isReplaceable = ability.isReplaceable
        result.isPassive = ability.isPassive
    end
    
    if dataType == "all" or dataType == "effects" then
        result.triggers = ability.triggers
        result.effects = ability.effects
        result.conditions = ability.conditions
    end
    
    return result
end

-- Pokemon abilities queries
queryHandlers["query-pokemon-abilities"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local speciesId = msg.Data and msg.Data.speciesId
    local includeHidden = msg.Data and msg.Data.includeHidden or false
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local availableAbilities = AbilityIndexes.getSpeciesAbilities(tonumber(speciesId))
    local abilities = {}
    
    for _, abilityInfo in ipairs(availableAbilities) do
        if abilityInfo.slot ~= 4 or includeHidden then -- Skip hidden unless requested
            local abilityData = AbilityDatabase.getAbility(abilityInfo.id)
            if abilityData then
                table.insert(abilities, {
                    id = abilityInfo.id,
                    name = abilityData.name,
                    description = abilityData.description,
                    slot = abilityInfo.slot,
                    isHidden = abilityInfo.hidden
                })
            end
        end
    end
    
    return {
        success = true,
        speciesId = tonumber(speciesId),
        pokemonId = pokemonId,
        availableAbilities = abilities,
        count = #abilities
    }
end

-- Ability effects queries
queryHandlers["query-ability-effects"] = function(msg)
    local abilityId = msg.Data and msg.Data.abilityId
    local triggerType = msg.Data and msg.Data.triggerType
    
    if not abilityId then
        return {
            success = false,
            error = "Missing abilityId parameter"
        }
    end
    
    local ability = AbilityDatabase.getAbility(tonumber(abilityId))
    if not ability then
        return {
            success = false,
            error = "Ability not found: " .. tostring(abilityId)
        }
    end
    
    local effects = ability.effects
    if triggerType then
        effects = {}
        for _, effect in ipairs(ability.effects) do
            if effect.trigger == triggerType then
                table.insert(effects, effect)
            end
        end
    end
    
    return {
        success = true,
        abilityId = tonumber(abilityId),
        abilityName = ability.name,
        triggerType = triggerType,
        effects = effects,
        triggers = ability.triggers,
        effectCount = #effects
    }
end

-- Ability compatibility queries
queryHandlers["query-ability-compatibility"] = function(msg)
    local speciesId = msg.Data and msg.Data.speciesId
    local abilityId = msg.Data and msg.Data.abilityId
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local result = {
        success = true,
        speciesId = tonumber(speciesId)
    }
    
    if abilityId then
        local isCompatible = AbilityIndexes.validateSpeciesAbility(tonumber(speciesId), tonumber(abilityId))
        local abilityData = AbilityDatabase.getAbility(tonumber(abilityId))
        
        result.abilityId = tonumber(abilityId)
        result.abilityName = abilityData and abilityData.name or "Unknown"
        result.isCompatible = isCompatible
    else
        -- Return all compatible abilities for species
        local speciesAbilities = AbilityIndexes.getSpeciesAbilities(tonumber(speciesId))
        local compatibleAbilities = {}
        
        for _, abilityInfo in ipairs(speciesAbilities) do
            local abilityData = AbilityDatabase.getAbility(abilityInfo.id)
            if abilityData then
                table.insert(compatibleAbilities, {
                    id = abilityInfo.id,
                    name = abilityData.name,
                    slot = abilityInfo.slot,
                    isHidden = abilityInfo.hidden
                })
            end
        end
        
        result.compatibleAbilities = compatibleAbilities
        result.count = #compatibleAbilities
    end
    
    return result
end

-- Ability trigger queries
queryHandlers["query-ability-triggers"] = function(msg)
    local triggerType = msg.Data and msg.Data.triggerType
    
    if not triggerType then
        return {
            success = false,
            error = "Missing triggerType parameter"
        }
    end
    
    local abilitiesWithTrigger = AbilityIndexes.getAbilitiesByTrigger(triggerType, true)
    local abilities = {}
    
    for _, abilityInfo in ipairs(abilitiesWithTrigger) do
        local abilityId = abilityInfo.id or abilityInfo
        local abilityData = AbilityDatabase.getAbility(abilityId)
        if abilityData then
            table.insert(abilities, {
                id = abilityId,
                name = abilityData.name,
                description = abilityData.description,
                priority = abilityInfo.priority or 0
            })
        end
    end
    
    return {
        success = true,
        triggerType = triggerType,
        abilities = abilities,
        count = #abilities,
        availableTriggers = AbilityEffects.TriggerTypes
    }
end

-- Passive abilities queries
queryHandlers["query-passive-abilities"] = function(msg)
    local playerId = msg.Data and msg.Data.playerId
    local category = msg.Data and msg.Data.category
    
    if not playerId then
        return {
            success = false,
            error = "Missing playerId parameter"
        }
    end
    
    local availablePassives = PassiveAbilities.getAvailablePassives(playerId)
    local result = {
        success = true,
        playerId = playerId,
        passives = availablePassives,
        count = #availablePassives
    }
    
    if category then
        local categoryPassives = {}
        for _, passive in ipairs(availablePassives) do
            if passive.passive.category == category then
                table.insert(categoryPassives, passive)
            end
        end
        result.categoryPassives = categoryPassives
        result.categoryCount = #categoryPassives
        result.requestedCategory = category
    end
    
    return result
end

-- Passive ability categories queries
queryHandlers["query-passive-categories"] = function(msg)
    local categories = {}
    for categoryName, _ in pairs(PassiveAbilities.Categories) do
        local categoryPassives = PassiveAbilities.getPassivesByCategory(categoryName)
        table.insert(categories, {
            name = categoryName,
            passiveCount = #categoryPassives
        })
    end
    
    return {
        success = true,
        categories = categories,
        totalCategories = #categories
    }
end

-- Ability search queries
queryHandlers["query-ability-search"] = function(msg)
    local searchTerm = msg.Data and msg.Data.searchTerm
    local searchType = msg.Data and msg.Data.searchType or "name"
    
    if not searchTerm then
        return {
            success = false,
            error = "Missing searchTerm parameter"
        }
    end
    
    local results = {}
    
    if searchType == "name" then
        results = AbilityIndexes.searchAbilitiesByName(searchTerm)
    elseif searchType == "effect" then
        -- Search by effect type
        for abilityId, abilityData in pairs(AbilityDatabase.getAllAbilities()) do
            for _, effect in ipairs(abilityData.effects or {}) do
                if effect.effect and effect.effect:find(searchTerm:upper()) then
                    table.insert(results, {
                        id = abilityId,
                        name = abilityData.name,
                        description = abilityData.description,
                        matchedEffect = effect.effect
                    })
                    break
                end
            end
        end
    end
    
    return {
        success = true,
        searchTerm = searchTerm,
        searchType = searchType,
        results = results,
        count = #results
    }
end

-- Pokemon Instance Query Handlers

-- Query individual Pokemon instance
queryHandlers["query-pokemon-instance"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    local includeDetails = msg.Data and msg.Data.includeDetails or false
    
    if not pokemonId then
        return {
            success = false,
            error = "Missing pokemonId parameter"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    local result = {
        success = true,
        pokemon = pokemon
    }
    
    -- Add detailed information if requested
    if includeDetails then
        result.displayInfo = CustomizationManager.getPokemonDisplayInfo(pokemon)
        result.customizationStats = CustomizationManager.getCustomizationStats(pokemon)
        
        -- Add species information
        SpeciesDatabase.init()
        local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
        if speciesData then
            result.speciesInfo = {
                name = speciesData.name,
                types = speciesData.types,
                baseStats = speciesData.baseStats
            }
        end
    end
    
    return result
end

-- Query player's Pokemon collection
queryHandlers["query-player-pokemon"] = function(msg)
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    local filters = msg.Data and msg.Data.filters or {}
    local includeLocation = msg.Data and msg.Data.includeLocation or false
    local limit = msg.Data and msg.Data.limit or 50
    local offset = msg.Data and msg.Data.offset or 0
    
    if not playerId then
        return {
            success = false,
            error = "Missing playerId parameter"
        }
    end
    
    -- Get Pokemon using storage system with filters
    local searchFilters = {
        playerId = playerId,
        limit = limit + offset  -- Get extra to handle offset
    }
    
    -- Copy additional filters
    if filters.speciesId then searchFilters.speciesId = filters.speciesId end
    if filters.minLevel then searchFilters.minLevel = filters.minLevel end
    if filters.maxLevel then searchFilters.maxLevel = filters.maxLevel end
    if filters.isShiny ~= nil then searchFilters.isShiny = filters.isShiny end
    if filters.nature then searchFilters.nature = filters.nature end
    if filters.hasNickname ~= nil then searchFilters.hasNickname = filters.hasNickname end
    
    local allPokemon = PokemonStorage.search(searchFilters)
    
    -- Apply offset and limit
    local pokemon = {}
    for i = offset + 1, math.min(offset + limit, #allPokemon) do
        if allPokemon[i] then
            table.insert(pokemon, allPokemon[i])
        end
    end
    
    -- Add location information if requested
    if includeLocation then
        for _, pkmn in ipairs(pokemon) do
            local location = PlayerIndex.findPokemonLocation(playerId, pkmn.id)
            if location then
                pkmn._location = location
            end
        end
    end
    
    return {
        success = true,
        pokemon = pokemon,
        totalCount = #allPokemon,
        returnedCount = #pokemon,
        offset = offset,
        limit = limit,
        filters = filters
    }
end

-- Query player's party Pokemon
queryHandlers["query-party-pokemon"] = function(msg)
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not playerId then
        return {
            success = false,
            error = "Missing playerId parameter"
        }
    end
    
    local partyPokemon = PlayerIndex.getParty(playerId)
    
    return {
        success = true,
        party = partyPokemon,
        count = #partyPokemon,
        maxSize = 6
    }
end

-- Query player's PC box Pokemon
queryHandlers["query-box-pokemon"] = function(msg)
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    local boxNumber = msg.Data and msg.Data.boxNumber or 1
    
    if not playerId then
        return {
            success = false,
            error = "Missing playerId parameter"
        }
    end
    
    local boxPokemon = PlayerIndex.getBox(playerId, boxNumber)
    
    return {
        success = true,
        boxNumber = boxNumber,
        pokemon = boxPokemon,
        count = #boxPokemon,
        maxSize = 30
    }
end

-- Query Pokemon battle data
queryHandlers["query-pokemon-battle-data"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not pokemonId then
        return {
            success = false,
            error = "Missing pokemonId parameter"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    -- Extract battle-relevant data
    local battleData = {
        id = pokemon.id,
        speciesId = pokemon.speciesId,
        level = pokemon.level,
        stats = pokemon.stats,
        nature = pokemon.nature,
        gender = pokemon.gender,
        isShiny = pokemon.isShiny,
        statusEffect = pokemon.statusEffect,
        heldItem = pokemon.heldItem,
        moveset = pokemon.moveset or {},
        battleData = pokemon.battleData or {}
    }
    
    return {
        success = true,
        pokemonId = pokemonId,
        battleData = battleData
    }
end

-- Query Pokemon history and progression
queryHandlers["query-pokemon-history"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    local historyType = msg.Data and msg.Data.historyType or "all"
    local timeRange = msg.Data and msg.Data.timeRange  -- Optional time range in seconds
    
    if not pokemonId then
        return {
            success = false,
            error = "Missing pokemonId parameter"
        }
    end
    
    local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
    if not pokemon then
        return {
            success = false,
            error = error or "Pokemon not found or access denied"
        }
    end
    
    local result = {
        success = true,
        pokemonId = pokemonId
    }
    
    if historyType == "all" or historyType == "battles" then
        result.battleHistory = pokemon.battleHistory or {}
        
        -- Get battle statistics
        local ExperienceSystem = require("game-logic.progression.experience-system")
        result.battleStats = ExperienceSystem.getBattleStats(pokemon, timeRange)
    end
    
    if historyType == "all" or historyType == "friendship" then
        result.friendshipHistory = pokemon.friendshipHistory or {}
        result.currentFriendship = pokemon.friendship or 70
        
        local ExperienceSystem = require("game-logic.progression.experience-system")
        result.friendshipLevel = ExperienceSystem.getFriendshipLevel(pokemon.friendship or 70)
    end
    
    if historyType == "all" or historyType == "moves" then
        result.forgottenMoves = pokemon.forgottenMoves or {}
        result.currentMoves = pokemon.moveset or {}
        
        local MoveManager = require("game-logic.pokemon.move-manager")
        result.movesetStats = MoveManager.getMovesetStats(pokemon)
    end
    
    if historyType == "all" or historyType == "general" then
        result.createdAt = pokemon.createdAt
        result.lastBattleAt = pokemon.lastBattleAt
        result.originalTrainer = pokemon.originalTrainer
    end
    
    return result
end

-- Query player collection statistics
queryHandlers["query-player-collection-stats"] = function(msg)
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not playerId then
        return {
            success = false,
            error = "Missing playerId parameter"
        }
    end
    
    local playerStats = PlayerIndex.getPlayerStats(playerId)
    local storageStats = PokemonStorage.getStats()
    
    -- Get additional statistics
    local allPlayerPokemon = PlayerIndex.getAllPokemon(playerId)
    local shinyCount = 0
    local speciesCount = {}
    
    for _, pokemon in ipairs(allPlayerPokemon) do
        if pokemon.isShiny then
            shinyCount = shinyCount + 1
        end
        
        speciesCount[pokemon.speciesId] = (speciesCount[pokemon.speciesId] or 0) + 1
    end
    
    local uniqueSpecies = 0
    for _ in pairs(speciesCount) do
        uniqueSpecies = uniqueSpecies + 1
    end
    
    return {
        success = true,
        playerId = playerId,
        playerStats = playerStats,
        shinyCount = shinyCount,
        uniqueSpecies = uniqueSpecies,
        speciesCount = speciesCount,
        globalStats = {
            totalPokemonInSystem = storageStats.totalPokemon,
            totalPlayers = storageStats.playersWithPokemon
        }
    }
end

-- Query Pokemon by search criteria
queryHandlers["query-pokemon-search"] = function(msg)
    local searchTerm = msg.Data and msg.Data.searchTerm
    local searchType = msg.Data and msg.Data.searchType or "all"
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    local limit = msg.Data and msg.Data.limit or 20
    
    if not searchTerm then
        return {
            success = false,
            error = "Missing searchTerm parameter"
        }
    end
    
    local results = {}
    
    if searchType == "all" or searchType == "nickname" then
        -- Search by nickname
        local filters = {
            playerId = playerId,
            hasNickname = true,
            limit = limit * 2  -- Get extra for filtering
        }
        
        local pokemonWithNicknames = PokemonStorage.search(filters)
        
        for _, pokemon in ipairs(pokemonWithNicknames) do
            if pokemon.nickname and string.lower(pokemon.nickname):find(string.lower(searchTerm)) then
                table.insert(results, {
                    pokemon = pokemon,
                    matchType = "nickname",
                    matchValue = pokemon.nickname
                })
            end
        end
    end
    
    if searchType == "all" or searchType == "species" then
        -- Search by species name (would need species database integration)
        SpeciesDatabase.init()
        local allPlayerPokemon = PlayerIndex.getAllPokemon(playerId)
        
        for _, pokemon in ipairs(allPlayerPokemon) do
            local speciesData = SpeciesDatabase.getSpecies(pokemon.speciesId)
            if speciesData and speciesData.name and 
               string.lower(speciesData.name):find(string.lower(searchTerm)) then
                table.insert(results, {
                    pokemon = pokemon,
                    matchType = "species",
                    matchValue = speciesData.name
                })
            end
        end
    end
    
    -- Limit results
    if #results > limit then
        local limitedResults = {}
        for i = 1, limit do
            table.insert(limitedResults, results[i])
        end
        results = limitedResults
    end
    
    return {
        success = true,
        searchTerm = searchTerm,
        searchType = searchType,
        results = results,
        count = #results,
        playerId = playerId
    }
end

-- Main query handler dispatcher
function QueryHandler.handleQuery(msg)
    local queryType = msg.Action
    
    if not queryType then
        return {
            success = false,
            error = "Missing query action"
        }
    end
    
    local handler = queryHandlers[queryType]
    if not handler then
        return {
            success = false,
            error = "Unknown query type: " .. tostring(queryType)
        }
    end
    
    local success, result = pcall(handler, msg)
    if not success then
        return {
            success = false,
            error = "Query execution failed: " .. tostring(result)
        }
    end
    
    return result
end

-- Get available query types
function QueryHandler.getAvailableQueries()
    local queries = {}
    for queryType, _ in pairs(queryHandlers) do
        table.insert(queries, queryType)
    end
    table.sort(queries)
    
    return {
        success = true,
        availableQueries = queries,
        count = #queries
    }
end

-- Export for AO process
return {
    QueryHandler = QueryHandler,
    queryHandlers = queryHandlers
}