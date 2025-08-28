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

-- Import move system modules
local MoveDatabase = require('data.moves.move-database')
local MoveIndexes = require('data.moves.move-indexes')
local MoveEffects = require('game-logic.battle.move-effects')
local PriorityCalculator = require('game-logic.battle.priority-calculator')
local CriticalHitCalculator = require('game-logic.battle.critical-hit-calculator')

-- Import Pokemon instance management modules
local PokemonManager = require("game-logic.pokemon.pokemon-manager")
local PokemonStorage = require("data.pokemon-instances.pokemon-storage")
local PlayerIndex = require("data.pokemon-instances.player-index")
local CustomizationManager = require("game-logic.pokemon.customization-manager")

-- Import move learning modules
local MoveManager = require("game-logic.pokemon.move-manager")
local TMDatabase = require("data.moves.tm-database")
local EggMoves = require("data.moves.egg-moves")
local TutorMoves = require("data.moves.tutor-moves")

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

-- Move Database Query Handlers

-- Query individual move data
queryHandlers["query-move-data"] = function(msg)
    local moveId = msg.Data and msg.Data.moveId
    local includeEffects = msg.Data and msg.Data.includeEffects or false
    
    if not moveId then
        return {
            success = false,
            error = "Missing moveId parameter"
        }
    end
    
    -- Ensure move database is initialized
    MoveDatabase.init()
    
    local move = MoveDatabase.moves[tonumber(moveId)]
    if not move then
        return {
            success = false,
            error = "Move not found: " .. tostring(moveId)
        }
    end
    
    local result = {
        success = true,
        moveId = move.id,
        name = move.name,
        type = move.type,
        category = move.category,
        power = move.power,
        accuracy = move.accuracy,
        pp = move.pp,
        target = move.target,
        priority = move.priority,
        flags = move.flags
    }
    
    if includeEffects and move.effects then
        result.effects = move.effects
        result.effectDescription = MoveEffects.getEffectDescription(move.effects)
    end
    
    return result
end

-- Query moves by type
queryHandlers["query-moves-by-type"] = function(msg)
    local moveType = msg.Data and msg.Data.type
    local includeStats = msg.Data and msg.Data.includeStats or false
    local limit = msg.Data and msg.Data.limit or 50
    
    if not moveType then
        return {
            success = false,
            error = "Missing type parameter"
        }
    end
    
    MoveDatabase.init()
    MoveIndexes.init()
    
    local moves = MoveIndexes.getMovesByType(tonumber(moveType))
    
    -- Apply limit
    if #moves > limit then
        local limitedMoves = {}
        for i = 1, limit do
            table.insert(limitedMoves, moves[i])
        end
        moves = limitedMoves
    end
    
    -- Add stats if requested
    if includeStats then
        local totalMoves = MoveIndexes.getMoveCountByType(tonumber(moveType))
        return {
            success = true,
            type = tonumber(moveType),
            moves = moves,
            count = #moves,
            totalCount = totalMoves,
            limit = limit
        }
    end
    
    return {
        success = true,
        type = tonumber(moveType),
        moves = moves,
        count = #moves
    }
end

-- Query moves by category
queryHandlers["query-moves-by-category"] = function(msg)
    local category = msg.Data and msg.Data.category
    local includeTypeBreakdown = msg.Data and msg.Data.includeTypeBreakdown or false
    local limit = msg.Data and msg.Data.limit or 100
    
    if not category then
        return {
            success = false,
            error = "Missing category parameter"
        }
    end
    
    MoveDatabase.init()
    MoveIndexes.init()
    
    local moves = MoveIndexes.getMovesByCategory(tonumber(category))
    
    -- Apply limit
    if #moves > limit then
        local limitedMoves = {}
        for i = 1, limit do
            table.insert(limitedMoves, moves[i])
        end
        moves = limitedMoves
    end
    
    local result = {
        success = true,
        category = tonumber(category),
        categoryName = category == 0 and "Physical" or (category == 1 and "Special" or "Status"),
        moves = moves,
        count = #moves
    }
    
    if includeTypeBreakdown then
        local typeBreakdown = {}
        for _, move in ipairs(moves) do
            local moveType = move.type
            typeBreakdown[moveType] = (typeBreakdown[moveType] or 0) + 1
        end
        result.typeBreakdown = typeBreakdown
    end
    
    return result
end

-- Query moves by power range
queryHandlers["query-moves-by-power"] = function(msg)
    local minPower = msg.Data and msg.Data.minPower or 0
    local maxPower = msg.Data and msg.Data.maxPower or 250
    local category = msg.Data and msg.Data.category -- Optional category filter
    local limit = msg.Data and msg.Data.limit or 100
    
    MoveDatabase.init()
    MoveIndexes.init()
    
    local moves = MoveIndexes.getMovesByPowerRange(minPower, maxPower)
    
    -- Apply category filter if specified
    if category then
        local filteredMoves = {}
        for _, move in ipairs(moves) do
            if move.category == tonumber(category) then
                table.insert(filteredMoves, move)
            end
        end
        moves = filteredMoves
    end
    
    -- Apply limit
    if #moves > limit then
        local limitedMoves = {}
        for i = 1, limit do
            table.insert(limitedMoves, moves[i])
        end
        moves = limitedMoves
    end
    
    return {
        success = true,
        minPower = minPower,
        maxPower = maxPower,
        category = category,
        moves = moves,
        count = #moves,
        limit = limit
    }
end

-- Query move effects and mechanics
queryHandlers["query-move-effects"] = function(msg)
    local moveId = msg.Data and msg.Data.moveId
    local effectType = msg.Data and msg.Data.effectType -- Optional filter
    
    if not moveId then
        return {
            success = false,
            error = "Missing moveId parameter"
        }
    end
    
    MoveDatabase.init()
    local move = MoveDatabase.moves[tonumber(moveId)]
    
    if not move then
        return {
            success = false,
            error = "Move not found: " .. tostring(moveId)
        }
    end
    
    local result = {
        success = true,
        moveId = tonumber(moveId),
        moveName = move.name,
        effects = move.effects or {},
        hasEffects = move.effects and next(move.effects) ~= nil
    }
    
    if move.effects then
        result.effectDescription = MoveEffects.getEffectDescription(move.effects)
        
        -- Validate effects
        local isValid, errorMsg = MoveEffects.validateEffect(move.effects)
        result.effectsValid = isValid
        if not isValid then
            result.validationError = errorMsg
        end
        
        -- Filter by effect type if specified
        if effectType then
            local hasEffectType = false
            if effectType == "status" and (move.effects.burn_chance or move.effects.poison_chance or 
                                        move.effects.paralysis_chance or move.effects.freeze_chance or 
                                        move.effects.sleep_chance) then
                hasEffectType = true
            elseif effectType == "stat_change" and move.effects.stat_change then
                hasEffectType = true
            elseif effectType == "healing" and (move.effects.heal_percentage or move.effects.heal_amount) then
                hasEffectType = true
            elseif effectType == "recoil" and move.effects.recoil_percentage then
                hasEffectType = true
            elseif effectType == "multi_hit" and move.effects.multi_hit then
                hasEffectType = true
            elseif effectType == "weather" and move.effects.weather then
                hasEffectType = true
            elseif effectType == "terrain" and move.effects.terrain then
                hasEffectType = true
            end
            
            result.matchesEffectType = hasEffectType
            result.requestedEffectType = effectType
        end
    end
    
    return result
end

-- Query move priority information
queryHandlers["query-move-priority"] = function(msg)
    local moveId = msg.Data and msg.Data.moveId
    local priorityRange = msg.Data and msg.Data.priorityRange -- Optional: get all moves in priority range
    
    if moveId then
        -- Query specific move priority
        MoveDatabase.init()
        local move = MoveDatabase.moves[tonumber(moveId)]
        
        if not move then
            return {
                success = false,
                error = "Move not found: " .. tostring(moveId)
            }
        end
        
        PriorityCalculator.init()
        local priority = PriorityCalculator.getMovePriority(tonumber(moveId))
        
        return {
            success = true,
            moveId = tonumber(moveId),
            moveName = move.name,
            priority = priority,
            priorityDescription = priority > 0 and "Increased priority" or (priority < 0 and "Decreased priority" or "Normal priority")
        }
    elseif priorityRange then
        -- Query all moves with specific priority
        MoveDatabase.init()
        MoveIndexes.init()
        
        local moves = MoveIndexes.getMovesByPriority(tonumber(priorityRange))
        
        return {
            success = true,
            priorityRange = tonumber(priorityRange),
            moves = moves,
            count = #moves
        }
    else
        return {
            success = false,
            error = "Must specify either moveId or priorityRange parameter"
        }
    end
end

-- Query critical hit information
queryHandlers["query-move-critical-hit"] = function(msg)
    local moveId = msg.Data and msg.Data.moveId
    local pokemonData = msg.Data and msg.Data.pokemonData -- Optional Pokemon data for detailed calculation
    
    if not moveId then
        return {
            success = false,
            error = "Missing moveId parameter"
        }
    end
    
    MoveDatabase.init()
    local move = MoveDatabase.moves[tonumber(moveId)]
    
    if not move then
        return {
            success = false,
            error = "Move not found: " .. tostring(moveId)
        }
    end
    
    CriticalHitCalculator.init()
    
    local result = {
        success = true,
        moveId = tonumber(moveId),
        moveName = move.name,
        canCriticalHit = CriticalHitCalculator.canMoveCriticalHit(tonumber(moveId), nil)
    }
    
    if pokemonData then
        -- Detailed critical hit calculation with Pokemon data
        local critBreakdown = CriticalHitCalculator.getCriticalHitBreakdown(
            pokemonData, tonumber(moveId), nil, nil
        )
        result.criticalHitBreakdown = critBreakdown
        result.finalRate = critBreakdown.final_rate
        result.finalStage = critBreakdown.final_stage
    else
        -- Basic move critical hit info
        result.baseHighCrit = move.effects and move.effects.high_crit or false
    end
    
    return result
end

-- Query move compatibility with Pokemon
queryHandlers["query-move-compatibility"] = function(msg)
    local moveId = msg.Data and msg.Data.moveId
    local speciesId = msg.Data and msg.Data.speciesId
    local pokemonId = msg.Data and msg.Data.pokemonId
    local playerId = msg.From or (msg.Data and msg.Data.playerId)
    
    if not moveId then
        return {
            success = false,
            error = "Missing moveId parameter"
        }
    end
    
    if not speciesId and not pokemonId then
        return {
            success = false,
            error = "Must specify either speciesId or pokemonId parameter"
        }
    end
    
    MoveDatabase.init()
    local move = MoveDatabase.moves[tonumber(moveId)]
    
    if not move then
        return {
            success = false,
            error = "Move not found: " .. tostring(moveId)
        }
    end
    
    local result = {
        success = true,
        moveId = tonumber(moveId),
        moveName = move.name
    }
    
    if pokemonId then
        -- Check specific Pokemon instance compatibility
        local pokemon, error = PokemonManager.getPokemonWithOwnership(pokemonId, playerId)
        if not pokemon then
            return {
                success = false,
                error = error or "Pokemon not found or access denied"
            }
        end
        
        result.pokemonId = pokemonId
        result.speciesId = pokemon.speciesId
        
        -- Check if Pokemon can learn the move (would integrate with move learning system)
        local MoveManager = require("game-logic.pokemon.move-manager")
        local canLearn, method = MoveManager.canLearnMove(pokemon, tonumber(moveId))
        
        result.canLearn = canLearn
        result.learnMethod = method
        result.currentlyKnows = MoveManager.knowsMove(pokemon, tonumber(moveId))
    else
        -- Check species compatibility
        SpeciesDatabase.init()
        local species = SpeciesDatabase.getSpecies(tonumber(speciesId))
        
        if not species then
            return {
                success = false,
                error = "Species not found: " .. tostring(speciesId)
            }
        end
        
        result.speciesId = tonumber(speciesId)
        result.speciesName = species.name
        
        -- Check species learnset compatibility
        local canLearnByLevel = false
        local canLearnByTM = false
        local learnLevel = nil
        
        if species.learnset then
            for level, moves in pairs(species.learnset) do
                for _, learnableMove in ipairs(moves) do
                    if learnableMove == tonumber(moveId) then
                        canLearnByLevel = true
                        learnLevel = tonumber(level)
                        break
                    end
                end
                if canLearnByLevel then break end
            end
        end
        
        -- Check TM/TR compatibility (placeholder - would integrate with TM system)
        canLearnByTM = false -- TODO: Implement TM compatibility check
        
        result.canLearnByLevel = canLearnByLevel
        result.canLearnByTM = canLearnByTM
        result.learnLevel = learnLevel
        result.anyCompatibility = canLearnByLevel or canLearnByTM
    end
    
    return result
end

-- Query move database statistics
queryHandlers["query-move-database-stats"] = function(msg)
    MoveDatabase.init()
    MoveIndexes.init()
    
    local stats = {
        totalMoves = MoveDatabase.getMoveCount(),
        movesByCategory = {
            physical = 0,
            special = 0,
            status = 0
        },
        movesByType = {},
        powerDistribution = {
            noPower = 0,      -- Status moves (power = 0)
            lowPower = 0,     -- 1-60 power
            mediumPower = 0,  -- 61-95 power
            highPower = 0,    -- 96-120 power
            veryHighPower = 0 -- 121+ power
        },
        priorityDistribution = {}
    }
    
    -- Analyze all moves
    for moveId, move in pairs(MoveDatabase.moves) do
        -- Category distribution
        if move.category == 0 then
            stats.movesByCategory.physical = stats.movesByCategory.physical + 1
        elseif move.category == 1 then
            stats.movesByCategory.special = stats.movesByCategory.special + 1
        elseif move.category == 2 then
            stats.movesByCategory.status = stats.movesByCategory.status + 1
        end
        
        -- Type distribution
        local moveType = move.type
        stats.movesByType[moveType] = (stats.movesByType[moveType] or 0) + 1
        
        -- Power distribution
        local power = move.power or 0
        if power == 0 then
            stats.powerDistribution.noPower = stats.powerDistribution.noPower + 1
        elseif power <= 60 then
            stats.powerDistribution.lowPower = stats.powerDistribution.lowPower + 1
        elseif power <= 95 then
            stats.powerDistribution.mediumPower = stats.powerDistribution.mediumPower + 1
        elseif power <= 120 then
            stats.powerDistribution.highPower = stats.powerDistribution.highPower + 1
        else
            stats.powerDistribution.veryHighPower = stats.powerDistribution.veryHighPower + 1
        end
        
        -- Priority distribution
        local priority = move.priority or 0
        stats.priorityDistribution[priority] = (stats.priorityDistribution[priority] or 0) + 1
    end
    
    return {
        success = true,
        databaseStats = stats,
        timestamp = os.time()
    }
end

-- Query moves with specific flags
queryHandlers["query-moves-by-flags"] = function(msg)
    local flags = msg.Data and msg.Data.flags
    local matchType = msg.Data and msg.Data.matchType or "any" -- "any" or "all"
    local limit = msg.Data and msg.Data.limit or 50
    
    if not flags or type(flags) ~= "table" or #flags == 0 then
        return {
            success = false,
            error = "Missing flags parameter (must be non-empty table)"
        }
    end
    
    MoveDatabase.init()
    MoveIndexes.init()
    
    local matchingMoves = {}
    
    -- Search through all moves
    for moveId, move in pairs(MoveDatabase.moves) do
        local moveFlags = move.flags or {}
        local matches = false
        
        if matchType == "any" then
            -- Check if move has any of the requested flags
            for _, requestedFlag in ipairs(flags) do
                for _, moveFlag in ipairs(moveFlags) do
                    if moveFlag == requestedFlag then
                        matches = true
                        break
                    end
                end
                if matches then break end
            end
        else -- matchType == "all"
            -- Check if move has all of the requested flags
            matches = true
            for _, requestedFlag in ipairs(flags) do
                local hasFlag = false
                for _, moveFlag in ipairs(moveFlags) do
                    if moveFlag == requestedFlag then
                        hasFlag = true
                        break
                    end
                end
                if not hasFlag then
                    matches = false
                    break
                end
            end
        end
        
        if matches then
            table.insert(matchingMoves, {
                id = move.id,
                name = move.name,
                type = move.type,
                category = move.category,
                power = move.power,
                flags = move.flags,
                matchedFlags = {}
            })
            
            -- Record which flags matched
            local lastMove = matchingMoves[#matchingMoves]
            for _, requestedFlag in ipairs(flags) do
                for _, moveFlag in ipairs(move.flags or {}) do
                    if moveFlag == requestedFlag then
                        table.insert(lastMove.matchedFlags, requestedFlag)
                    end
                end
            end
        end
    end
    
    -- Apply limit
    if #matchingMoves > limit then
        local limitedMoves = {}
        for i = 1, limit do
            table.insert(limitedMoves, matchingMoves[i])
        end
        matchingMoves = limitedMoves
    end
    
    return {
        success = true,
        requestedFlags = flags,
        matchType = matchType,
        moves = matchingMoves,
        count = #matchingMoves,
        limit = limit
    }
end

-- Move Learning Query Handlers

-- Query learnable moves for a species
queryHandlers["query-learnable-moves"] = function(msg)
    local speciesId = msg.Data and tonumber(msg.Data.speciesId)
    local method = msg.Data and msg.Data.method -- "level", "tm", "tr", "tutor", "egg", or "all"
    local level = msg.Data and tonumber(msg.Data.level)
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local learnableMoves = {}
    method = method or "all"
    
    -- Level-up moves
    if method == "level" or method == "all" then
        local levelMoves = MoveManager.getMovesLearnableAtLevel(speciesId, level or 100)
        for _, moveData in ipairs(levelMoves) do
            table.insert(learnableMoves, {
                moveId = moveData.moveId,
                learnLevel = moveData.level,
                method = "level"
            })
        end
    end
    
    -- TM moves
    if method == "tm" or method == "all" then
        local tmMoves = MoveManager.getCompatibleTMs(speciesId)
        for _, tmData in ipairs(tmMoves) do
            table.insert(learnableMoves, {
                moveId = tmData.moveId,
                tmNumber = tmData.tmNumber,
                method = "tm"
            })
        end
    end
    
    -- TR moves  
    if method == "tr" or method == "all" then
        local trMoves = MoveManager.getCompatibleTRs(speciesId)
        for _, trData in ipairs(trMoves) do
            table.insert(learnableMoves, {
                moveId = trData.moveId,
                trNumber = trData.trNumber,
                method = "tr"
            })
        end
    end
    
    -- Tutor moves
    if method == "tutor" or method == "all" then
        local tutorMoves = MoveManager.getAvailableTutorMoves(speciesId)
        for _, tutorData in ipairs(tutorMoves) do
            table.insert(learnableMoves, {
                moveId = tutorData.moveId,
                tutorId = tutorData.tutorId,
                cost = tutorData.cost,
                currency = tutorData.currency,
                method = "tutor"
            })
        end
    end
    
    -- Egg moves
    if method == "egg" or method == "all" then
        local eggMoves = MoveManager.getEggMovesForSpecies(speciesId)
        for _, moveId in ipairs(eggMoves) do
            table.insert(learnableMoves, {
                moveId = moveId,
                method = "egg"
            })
        end
    end
    
    return {
        success = true,
        speciesId = speciesId,
        method = method,
        moves = learnableMoves,
        count = #learnableMoves
    }
end

-- Query TM/TR compatibility for a species
queryHandlers["query-tm-tr-compatibility"] = function(msg)
    local speciesId = msg.Data and tonumber(msg.Data.speciesId)
    local machineType = msg.Data and msg.Data.machineType -- "tm", "tr", or "both"
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    machineType = machineType or "both"
    local compatibility = {}
    
    if machineType == "tm" or machineType == "both" then
        compatibility.tms = MoveManager.getCompatibleTMs(speciesId)
    end
    
    if machineType == "tr" or machineType == "both" then  
        compatibility.trs = MoveManager.getCompatibleTRs(speciesId)
    end
    
    return {
        success = true,
        speciesId = speciesId,
        machineType = machineType,
        compatibility = compatibility
    }
end

-- Query forgotten moves for relearning
queryHandlers["query-forgotten-moves"] = function(msg)
    local pokemonId = msg.Data and msg.Data.pokemonId
    local playerId = msg.Data and msg.Data.playerId
    
    if not pokemonId or not playerId then
        return {
            success = false,
            error = "Missing pokemonId or playerId parameter"
        }
    end
    
    -- Get Pokemon instance from storage
    local pokemon = PokemonStorage.getPokemon(playerId, pokemonId)
    if not pokemon then
        return {
            success = false,
            error = "Pokemon not found"
        }
    end
    
    local forgottenMoves = MoveManager.getForgottenMoves(pokemon)
    local relearnableMoves = {}
    
    for _, forgottenMove in ipairs(forgottenMoves) do
        local cost = MoveManager.calculateRelearnCost(pokemon, forgottenMove.id, forgottenMove)
        table.insert(relearnableMoves, {
            moveId = forgottenMove.id,
            name = forgottenMove.name,
            learnMethod = forgottenMove.learnMethod,
            forgottenAt = forgottenMove.forgottenAt,
            relearnCost = cost
        })
    end
    
    return {
        success = true,
        pokemonId = pokemonId,
        forgottenMoves = relearnableMoves,
        count = #relearnableMoves
    }
end

-- Query egg move compatibility for breeding
queryHandlers["query-egg-move-compatibility"] = function(msg) 
    local speciesId = msg.Data and tonumber(msg.Data.speciesId)
    
    if not speciesId then
        return {
            success = false,
            error = "Missing speciesId parameter"
        }
    end
    
    local compatibility = MoveManager.getEggMoveCompatibility(speciesId)
    
    return {
        success = true,
        speciesId = speciesId,
        eggMoves = compatibility.eggMoves or {},
        compatibleParents = compatibility.compatibleParents or {},
        eggMoveCount = #(compatibility.eggMoves or {})
    }
end

-- Query available tutors and their moves
queryHandlers["query-tutor-moves"] = function(msg)
    local tutorId = msg.Data and msg.Data.tutorId
    local speciesId = msg.Data and tonumber(msg.Data.speciesId)
    
    if tutorId then
        -- Query specific tutor
        local tutor = TutorMoves.tutors[tutorId]
        if not tutor then
            return {
                success = false,
                error = "Tutor not found: " .. tostring(tutorId)
            }
        end
        
        local moves = {}
        if speciesId then
            -- Get moves available for specific species from this tutor
            local availableMoves = TutorMoves.getAvailableMovesForSpecies(speciesId, tutorId)
            for _, moveId in ipairs(availableMoves) do
                local cost = TutorMoves.getMoveCost(tutorId, moveId)
                table.insert(moves, {
                    moveId = moveId,
                    cost = cost
                })
            end
        else
            -- Get all moves from this tutor
            for _, moveData in ipairs(tutor.moves) do
                table.insert(moves, {
                    moveId = moveData.moveId,
                    cost = moveData.cost
                })
            end
        end
        
        return {
            success = true,
            tutor = {
                id = tutor.id,
                name = tutor.name,
                location = tutor.location,
                currency = tutor.currency
            },
            moves = moves,
            moveCount = #moves
        }
    else
        -- Query all tutors
        local tutors = MoveManager.getAllTutors()
        
        return {
            success = true,
            tutors = tutors,
            tutorCount = #tutors
        }
    end
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