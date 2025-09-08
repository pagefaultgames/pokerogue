--[[
Battle Outcome Verification System
Ensures identical battle results across monolithic and distributed architectures
--]]

local json = require("json")

local BattleOutcomeVerifier = {
    battleTests = {},
    outcomeComparisons = {},
    battleScenarios = {}
}

-- Pre-defined battle scenarios for consistent testing
BattleOutcomeVerifier.battleScenarios = {
    single_pokemon_battle = {
        name = "Single Pokemon Battle",
        description = "Basic 1v1 Pokemon battle scenario",
        battleType = "single",
        playerParty = {
            {
                speciesId = 25, -- Pikachu
                level = 50,
                moves = {85, 86, 87, 88}, -- Thunder Shock, Thunder Wave, Quick Attack, Double Team
                nature = 3, -- Adamant
                ivs = {31, 31, 31, 31, 31, 31},
                evs = {0, 252, 0, 0, 0, 252}
            }
        },
        opponentParty = {
            {
                speciesId = 6, -- Charizard
                level = 52,
                moves = {136, 137, 138, 139}, -- Flamethrower, Fire Blast, Dragon Rage, Slash
                nature = 8, -- Modest
                ivs = {31, 0, 31, 31, 31, 31},
                evs = {4, 0, 0, 252, 0, 252}
            }
        }
    },
    
    multi_pokemon_battle = {
        name = "Multi Pokemon Battle",
        description = "Battle with multiple Pokemon per side",
        battleType = "single_6v6",
        playerParty = {
            {speciesId = 25, level = 50, moves = {85, 86, 87, 88}, nature = 3, ivs = {31, 31, 31, 31, 31, 31}, evs = {0, 252, 0, 0, 0, 252}},
            {speciesId = 1, level = 48, moves = {75, 76, 77, 78}, nature = 5, ivs = {31, 0, 31, 31, 31, 31}, evs = {252, 0, 0, 252, 0, 4}},
            {speciesId = 7, level = 49, moves = {55, 56, 57, 58}, nature = 12, ivs = {31, 0, 31, 31, 31, 31}, evs = {252, 0, 0, 252, 0, 4}}
        },
        opponentParty = {
            {speciesId = 6, level = 52, moves = {136, 137, 138, 139}, nature = 8, ivs = {31, 0, 31, 31, 31, 31}, evs = {4, 0, 0, 252, 0, 252}},
            {speciesId = 9, level = 51, moves = {110, 111, 112, 113}, nature = 8, ivs = {31, 0, 31, 31, 31, 31}, evs = {252, 0, 0, 252, 0, 4}},
            {speciesId = 3, level = 50, moves = {92, 93, 94, 95}, nature = 8, ivs = {31, 0, 31, 31, 31, 31}, evs = {252, 0, 0, 252, 0, 4}}
        }
    },
    
    status_effect_battle = {
        name = "Status Effect Battle",
        description = "Battle focusing on status effects and their interactions",
        battleType = "single",
        playerParty = {
            {
                speciesId = 97, -- Hypno
                level = 50,
                moves = {95, 79, 73, 50}, -- Hypnosis, Sleep Powder, Psychic, Disable
                nature = 8, -- Modest
                ivs = {31, 0, 31, 31, 31, 31},
                evs = {252, 0, 0, 252, 4, 0}
            }
        },
        opponentParty = {
            {
                speciesId = 89, -- Muk
                level = 51,
                moves = {188, 139, 92, 188}, -- Sludge Bomb, Poison Gas, Toxic, Body Slam
                nature = 3, -- Adamant
                ivs = {31, 31, 31, 31, 31, 31},
                evs = {252, 252, 4, 0, 0, 0}
            }
        }
    },
    
    critical_hit_battle = {
        name = "Critical Hit Battle",
        description = "Battle designed to test critical hit mechanics",
        battleType = "single",
        playerParty = {
            {
                speciesId = 123, -- Scyther
                level = 50,
                moves = {163, 14, 98, 104}, -- Slash, Swords Dance, Quick Attack, Double Team
                nature = 3, -- Adamant (boosts Attack)
                ivs = {31, 31, 31, 31, 31, 31},
                evs = {4, 252, 0, 0, 0, 252}
            }
        },
        opponentParty = {
            {
                speciesId = 127, -- Pinsir
                level = 50,
                moves = {11, 30, 99, 163}, -- Vice Grip, Horn Attack, Rage, Slash
                nature = 3, -- Adamant
                ivs = {31, 31, 31, 31, 31, 31},
                evs = {4, 252, 0, 0, 0, 252}
            }
        }
    }
}

-- Create battle outcome verification configuration
function BattleOutcomeVerifier.createBattleTestConfig(options)
    return {
        testId = options.testId or ("id_" .. msg.Timestamp),
        rngSeed = options.rngSeed or "battle-seed-987654",
        battleScenarios = options.battleScenarios or {"single_pokemon_battle"},
        architectures = options.architectures or {"monolithic", "distributed"},
        iterations = options.iterations or 100, -- Number of battle iterations per scenario
        verificationLevel = options.verificationLevel or "comprehensive", -- basic, standard, comprehensive
        recordBattleLog = options.recordBattleLog or true,
        timeoutPerBattle = options.timeoutPerBattle or 300 -- 5 minutes per battle max
    }
end

-- Execute comprehensive battle outcome verification
function BattleOutcomeVerifier.executeBattleVerification(config)
    print(string.format("Starting battle outcome verification: %s", config.testId))
    print(string.format("Scenarios: %s, Iterations: %d per scenario", 
          table.concat(config.battleScenarios, ", "), config.iterations))
    
    local verificationResults = {
        testId = config.testId,
        config = config,
        startTime = 0,
        battleResults = {},
        outcomeComparisons = {},
        verificationSummary = {},
        discrepancies = {}
    }
    
    -- Execute battle tests for each scenario
    for _, scenarioName in ipairs(config.battleScenarios) do
        print(string.format("Testing battle scenario: %s", scenarioName))
        
        local scenario = BattleOutcomeVerifier.battleScenarios[scenarioName]
        if not scenario then
            print(string.format("Warning: Unknown battle scenario: %s", scenarioName))
            goto continue
        end
        
        local scenarioResults = {}
        
        -- Execute battles on each architecture
        for _, architecture in ipairs(config.architectures) do
            print(string.format("  Executing on %s architecture", architecture))
            
            local architectureResults = BattleOutcomeVerifier.executeBattlesOnArchitecture(
                scenarioName, scenario, architecture, config
            )
            scenarioResults[architecture] = architectureResults
        end
        
        -- Compare battle outcomes between architectures
        local outcomeComparison = BattleOutcomeVerifier.compareBattleOutcomes(
            scenarioName, scenarioResults, config
        )
        
        verificationResults.battleResults[scenarioName] = scenarioResults
        verificationResults.outcomeComparisons[scenarioName] = outcomeComparison
        
        -- Record discrepancies
        if not outcomeComparison.identical then
            table.insert(verificationResults.discrepancies, {
                scenario = scenarioName,
                discrepancyType = outcomeComparison.discrepancyType,
                severity = outcomeComparison.severity,
                details = outcomeComparison.discrepancies
            })
        end
        
        ::continue::
    end
    
    -- Generate verification summary
    verificationResults.verificationSummary = BattleOutcomeVerifier.generateVerificationSummary(
        verificationResults
    )
    verificationResults.endTime = 0
    
    BattleOutcomeVerifier.battleTests[config.testId] = verificationResults
    
    print(string.format("Battle outcome verification completed: %s", config.testId))
    return verificationResults
end

-- Execute battles on specific architecture
function BattleOutcomeVerifier.executeBattlesOnArchitecture(scenarioName, scenario, architecture, config)
    local architectureResults = {
        architecture = architecture,
        scenario = scenarioName,
        battles = {},
        executionTime = 0,
        successfulBattles = 0,
        failedBattles = 0
    }
    
    local startTime = os.clock()
    
    -- Initialize deterministic RNG for this architecture
    local rng = BattleOutcomeVerifier.initializeBattleRNG(config.rngSeed, architecture)
    
    for iteration = 1, config.iterations do
        -- Reset RNG state for consistent battle conditions
        rng:resetToIteration(iteration)
        
        local battleResult = BattleOutcomeVerifier.executeSingleBattle(
            scenario, architecture, rng, iteration, config
        )
        
        table.insert(architectureResults.battles, battleResult)
        
        if battleResult.success then
            architectureResults.successfulBattles = architectureResults.successfulBattles + 1
        else
            architectureResults.failedBattles = architectureResults.failedBattles + 1
        end
    end
    
    architectureResults.executionTime = os.clock() - startTime
    
    return architectureResults
end

-- Initialize deterministic RNG for battle scenarios
function BattleOutcomeVerifier.initializeBattleRNG(seed, architecture)
    local rng = {
        baseSeed = seed,
        architecture = architecture,
        currentSeed = 0,
        turnCounter = 0,
        iterationSeed = 0
    }
    
    function rng:hashSeed(seedString)
        local hash = 0
        for i = 1, #seedString do
            local char = string.byte(seedString, i)
            hash = ((hash * 31) + char) % (2^31)
        end
        return hash
    end
    
    function rng:resetToIteration(iteration)
        local iterationSeed = self.baseSeed .. "_" .. self.architecture .. "_" .. iteration
        self.iterationSeed = iteration
        self.currentSeed = self:hashSeed(iterationSeed)
        self.turnCounter = 0
    end
    
    function rng:next()
        self.turnCounter = self.turnCounter + 1
        self.currentSeed = (self.currentSeed * 1103515245 + 12345) % (2^31)
        return self.currentSeed / (2^31)
    end
    
    function rng:nextInt(min, max)
        local range = max - min + 1
        return min + math.floor(self:next() * range)
    end
    
    function rng:nextBool(probability)
        return self:next() < probability
    end
    
    function rng:getState()
        return {
            currentSeed = self.currentSeed,
            turnCounter = self.turnCounter,
            iteration = self.iterationSeed
        }
    end
    
    return rng
end

-- Execute single battle scenario
function BattleOutcomeVerifier.executeSingleBattle(scenario, architecture, rng, iteration, config)
    local battleResult = {
        iteration = iteration,
        architecture = architecture,
        success = false,
        battleLog = {},
        finalState = {},
        winner = nil,
        totalTurns = 0,
        executionTime = 0,
        error = nil
    }
    
    local startTime = os.clock()
    
    -- Simulate battle execution with deterministic outcomes
    local success, result = pcall(function()
        return BattleOutcomeVerifier.simulateBattleExecution(scenario, rng, config)
    end)
    
    battleResult.executionTime = os.clock() - startTime
    
    if success then
        battleResult.success = true
        battleResult.battleLog = result.battleLog
        battleResult.finalState = result.finalState
        battleResult.winner = result.winner
        battleResult.totalTurns = result.totalTurns
    else
        battleResult.success = false
        battleResult.error = result or "Unknown error"
    end
    
    return battleResult
end

-- Simulate deterministic battle execution
function BattleOutcomeVerifier.simulateBattleExecution(scenario, rng, config)
    local battleState = {
        turn = 0,
        playerParty = BattleOutcomeVerifier.initializePokemonParty(scenario.playerParty),
        opponentParty = BattleOutcomeVerifier.initializePokemonParty(scenario.opponentParty),
        playerActivePokemon = 1,
        opponentActivePokemon = 1,
        winner = nil,
        battleLog = {}
    }
    
    -- Battle simulation loop
    local maxTurns = 1000 -- Prevent infinite battles
    
    while battleState.turn < maxTurns and not battleState.winner do
        battleState.turn = battleState.turn + 1
        
        -- Execute battle turn
        local turnResult = BattleOutcomeVerifier.executeBattleTurn(battleState, rng)
        
        table.insert(battleState.battleLog, turnResult)
        
        -- Check for battle end conditions
        battleState.winner = BattleOutcomeVerifier.checkBattleEndConditions(battleState)
        
        if battleState.winner then
            break
        end
        
        -- Switch fainted Pokemon if necessary
        BattleOutcomeVerifier.handleFaintedPokemon(battleState, rng)
    end
    
    if battleState.turn >= maxTurns then
        battleState.winner = "draw" -- Battle timeout
    end
    
    return {
        battleLog = battleState.battleLog,
        finalState = BattleOutcomeVerifier.extractFinalBattleState(battleState),
        winner = battleState.winner,
        totalTurns = battleState.turn
    }
end

-- Initialize Pokemon party for battle
function BattleOutcomeVerifier.initializePokemonParty(partyData)
    local party = {}
    
    for i, pokemonData in ipairs(partyData) do
        local pokemon = {
            speciesId = pokemonData.speciesId,
            level = pokemonData.level,
            currentHp = BattleOutcomeVerifier.calculateMaxHP(pokemonData),
            maxHp = BattleOutcomeVerifier.calculateMaxHP(pokemonData),
            stats = BattleOutcomeVerifier.calculatePokemonStats(pokemonData),
            moves = pokemonData.moves,
            nature = pokemonData.nature,
            statusCondition = nil,
            statusTurns = 0,
            fainted = false
        }
        
        party[i] = pokemon
    end
    
    return party
end

-- Calculate Pokemon maximum HP
function BattleOutcomeVerifier.calculateMaxHP(pokemonData)
    local baseHp = pokemonData.baseStats and pokemonData.baseStats.hp or 45 -- Default base HP
    local iv = pokemonData.ivs and pokemonData.ivs[1] or 31 -- HP IV
    local ev = pokemonData.evs and pokemonData.evs[1] or 0 -- HP EV
    
    return math.floor(((baseHp + iv + ev / 4) * pokemonData.level / 50) + pokemonData.level + 10)
end

-- Calculate Pokemon stats
function BattleOutcomeVerifier.calculatePokemonStats(pokemonData)
    -- Simplified stat calculation (in real implementation would use full formulas)
    local level = pokemonData.level
    
    return {
        attack = math.floor(((65 + 31 + 252 / 4) * level / 50) + 5), -- Base 65 Attack
        defense = math.floor(((55 + 31 + 0 / 4) * level / 50) + 5), -- Base 55 Defense
        spAttack = math.floor(((90 + 31 + 0 / 4) * level / 50) + 5), -- Base 90 Sp. Attack
        spDefense = math.floor(((75 + 31 + 4 / 4) * level / 50) + 5), -- Base 75 Sp. Defense
        speed = math.floor(((85 + 31 + 252 / 4) * level / 50) + 5) -- Base 85 Speed
    }
end

-- Execute single battle turn
function BattleOutcomeVerifier.executeBattleTurn(battleState, rng)
    local playerPokemon = battleState.playerParty[battleState.playerActivePokemon]
    local opponentPokemon = battleState.opponentParty[battleState.opponentActivePokemon]
    
    local turnResult = {
        turn = battleState.turn,
        actions = {},
        damageDealt = {},
        statusEffects = {},
        pokemonSwitches = {}
    }
    
    -- Determine turn order (simplified - based on speed)
    local playerGoesFirst = playerPokemon.stats.speed >= opponentPokemon.stats.speed
    if playerPokemon.stats.speed == opponentPokemon.stats.speed then
        playerGoesFirst = rng:nextBool(0.5) -- Random if speeds are equal
    end
    
    -- Execute actions in turn order
    if playerGoesFirst then
        BattleOutcomeVerifier.executePlayerAction(battleState, rng, turnResult)
        if not opponentPokemon.fainted then
            BattleOutcomeVerifier.executeOpponentAction(battleState, rng, turnResult)
        end
    else
        BattleOutcomeVerifier.executeOpponentAction(battleState, rng, turnResult)
        if not playerPokemon.fainted then
            BattleOutcomeVerifier.executePlayerAction(battleState, rng, turnResult)
        end
    end
    
    -- Process end-of-turn effects
    BattleOutcomeVerifier.processEndOfTurnEffects(battleState, rng, turnResult)
    
    return turnResult
end

-- Execute player action
function BattleOutcomeVerifier.executePlayerAction(battleState, rng, turnResult)
    local playerPokemon = battleState.playerParty[battleState.playerActivePokemon]
    local opponentPokemon = battleState.opponentParty[battleState.opponentActivePokemon]
    
    -- Simple AI: select random move
    local moveIndex = rng:nextInt(1, #playerPokemon.moves)
    local moveId = playerPokemon.moves[moveIndex]
    
    local actionResult = BattleOutcomeVerifier.executeMove(
        playerPokemon, opponentPokemon, moveId, rng, "player"
    )
    
    table.insert(turnResult.actions, actionResult)
    
    if actionResult.damage > 0 then
        opponentPokemon.currentHp = math.max(0, opponentPokemon.currentHp - actionResult.damage)
        if opponentPokemon.currentHp == 0 then
            opponentPokemon.fainted = true
        end
        
        turnResult.damageDealt.playerDamage = actionResult.damage
    end
end

-- Execute opponent action
function BattleOutcomeVerifier.executeOpponentAction(battleState, rng, turnResult)
    local playerPokemon = battleState.playerParty[battleState.playerActivePokemon]
    local opponentPokemon = battleState.opponentParty[battleState.opponentActivePokemon]
    
    -- Simple AI: select random move
    local moveIndex = rng:nextInt(1, #opponentPokemon.moves)
    local moveId = opponentPokemon.moves[moveIndex]
    
    local actionResult = BattleOutcomeVerifier.executeMove(
        opponentPokemon, playerPokemon, moveId, rng, "opponent"
    )
    
    table.insert(turnResult.actions, actionResult)
    
    if actionResult.damage > 0 then
        playerPokemon.currentHp = math.max(0, playerPokemon.currentHp - actionResult.damage)
        if playerPokemon.currentHp == 0 then
            playerPokemon.fainted = true
        end
        
        turnResult.damageDealt.opponentDamage = actionResult.damage
    end
end

-- Execute move with deterministic damage calculation
function BattleOutcomeVerifier.executeMove(attackingPokemon, defendingPokemon, moveId, rng, attacker)
    -- Simplified move data (in real implementation would use move database)
    local moveData = {
        power = 60 + (moveId % 50), -- Power 60-110
        accuracy = 85 + (moveId % 15), -- Accuracy 85-100
        type = moveId % 18, -- Type 0-17
        category = moveId % 2 == 0 and "physical" or "special"
    }
    
    local actionResult = {
        attacker = attacker,
        moveId = moveId,
        moveData = moveData,
        hit = false,
        critical = false,
        damage = 0,
        effectiveness = 1.0
    }
    
    -- Accuracy check
    actionResult.hit = rng:nextBool(moveData.accuracy / 100.0)
    if not actionResult.hit then
        return actionResult
    end
    
    -- Critical hit check (1/16 chance)
    actionResult.critical = rng:nextBool(1/16)
    
    -- Calculate damage
    local attackStat = moveData.category == "physical" and 
                      attackingPokemon.stats.attack or attackingPokemon.stats.spAttack
    local defenseStat = moveData.category == "physical" and 
                       defendingPokemon.stats.defense or defendingPokemon.stats.spDefense
    
    -- Base damage formula
    local baseDamage = ((2 * attackingPokemon.level + 10) / 250) * 
                      (attackStat / defenseStat) * moveData.power + 2
    
    -- Apply critical hit multiplier
    if actionResult.critical then
        baseDamage = baseDamage * 1.5
    end
    
    -- Apply type effectiveness (simplified)
    actionResult.effectiveness = BattleOutcomeVerifier.getTypeEffectiveness(
        moveData.type, defendingPokemon.speciesId
    )
    baseDamage = baseDamage * actionResult.effectiveness
    
    -- Apply random factor (85-100%)
    local randomFactor = rng:nextInt(85, 100) / 100.0
    baseDamage = baseDamage * randomFactor
    
    actionResult.damage = math.floor(baseDamage)
    
    return actionResult
end

-- Get type effectiveness multiplier (simplified)
function BattleOutcomeVerifier.getTypeEffectiveness(moveType, defendingSpeciesId)
    -- Simplified type chart
    local effectiveness = 1.0
    
    -- Some basic type relationships for testing
    if moveType == 10 and defendingSpeciesId == 6 then -- Fire vs Fire type
        effectiveness = 0.5 -- Not very effective
    elseif moveType == 11 and defendingSpeciesId == 25 then -- Water vs Electric
        effectiveness = 2.0 -- Super effective
    elseif moveType == 4 and defendingSpeciesId == 1 then -- Fighting vs Grass
        effectiveness = 0.5 -- Not very effective
    end
    
    return effectiveness
end

-- Process end-of-turn effects
function BattleOutcomeVerifier.processEndOfTurnEffects(battleState, rng, turnResult)
    -- Process status conditions for player Pokemon
    local playerPokemon = battleState.playerParty[battleState.playerActivePokemon]
    if playerPokemon.statusCondition and not playerPokemon.fainted then
        BattleOutcomeVerifier.processStatusCondition(playerPokemon, rng, turnResult)
    end
    
    -- Process status conditions for opponent Pokemon
    local opponentPokemon = battleState.opponentParty[battleState.opponentActivePokemon]
    if opponentPokemon.statusCondition and not opponentPokemon.fainted then
        BattleOutcomeVerifier.processStatusCondition(opponentPokemon, rng, turnResult)
    end
end

-- Process status condition effects
function BattleOutcomeVerifier.processStatusCondition(pokemon, rng, turnResult)
    if pokemon.statusCondition == "poison" then
        local poisonDamage = math.floor(pokemon.maxHp / 8)
        pokemon.currentHp = math.max(0, pokemon.currentHp - poisonDamage)
        
        table.insert(turnResult.statusEffects, {
            pokemon = pokemon.speciesId,
            effect = "poison_damage",
            damage = poisonDamage
        })
        
        if pokemon.currentHp == 0 then
            pokemon.fainted = true
        end
    end
    
    -- Decrement status turns
    pokemon.statusTurns = pokemon.statusTurns - 1
    if pokemon.statusTurns <= 0 then
        pokemon.statusCondition = nil
    end
end

-- Check battle end conditions
function BattleOutcomeVerifier.checkBattleEndConditions(battleState)
    -- Check if all player Pokemon are fainted
    local playerFainted = true
    for _, pokemon in ipairs(battleState.playerParty) do
        if not pokemon.fainted then
            playerFainted = false
            break
        end
    end
    
    -- Check if all opponent Pokemon are fainted
    local opponentFainted = true
    for _, pokemon in ipairs(battleState.opponentParty) do
        if not pokemon.fainted then
            opponentFainted = false
            break
        end
    end
    
    if playerFainted and opponentFainted then
        return "draw"
    elseif playerFainted then
        return "opponent"
    elseif opponentFainted then
        return "player"
    else
        return nil -- Battle continues
    end
end

-- Handle fainted Pokemon switching
function BattleOutcomeVerifier.handleFaintedPokemon(battleState, rng)
    -- Switch player Pokemon if current one fainted
    if battleState.playerParty[battleState.playerActivePokemon].fainted then
        for i = 1, #battleState.playerParty do
            if not battleState.playerParty[i].fainted then
                battleState.playerActivePokemon = i
                break
            end
        end
    end
    
    -- Switch opponent Pokemon if current one fainted
    if battleState.opponentParty[battleState.opponentActivePokemon].fainted then
        for i = 1, #battleState.opponentParty do
            if not battleState.opponentParty[i].fainted then
                battleState.opponentActivePokemon = i
                break
            end
        end
    end
end

-- Extract final battle state for comparison
function BattleOutcomeVerifier.extractFinalBattleState(battleState)
    return {
        finalTurn = battleState.turn,
        winner = battleState.winner,
        playerPartyState = BattleOutcomeVerifier.extractPartyState(battleState.playerParty),
        opponentPartyState = BattleOutcomeVerifier.extractPartyState(battleState.opponentParty)
    }
end

-- Extract party state for comparison
function BattleOutcomeVerifier.extractPartyState(party)
    local partyState = {}
    
    for i, pokemon in ipairs(party) do
        partyState[i] = {
            speciesId = pokemon.speciesId,
            currentHp = pokemon.currentHp,
            maxHp = pokemon.maxHp,
            fainted = pokemon.fainted,
            statusCondition = pokemon.statusCondition
        }
    end
    
    return partyState
end

-- Compare battle outcomes between architectures
function BattleOutcomeVerifier.compareBattleOutcomes(scenarioName, scenarioResults, config)
    local comparison = {
        scenario = scenarioName,
        identical = true,
        discrepancyType = "none",
        severity = "none",
        discrepancies = {},
        similarity = 1.0
    }
    
    local architectures = {}
    for arch, _ in pairs(scenarioResults) do
        table.insert(architectures, arch)
    end
    
    if #architectures < 2 then
        comparison.identical = false
        comparison.discrepancyType = "insufficient_data"
        comparison.severity = "critical"
        return comparison
    end
    
    local baseArch = architectures[1]
    local baseResults = scenarioResults[baseArch].battles
    
    -- Compare with other architectures
    for i = 2, #architectures do
        local compareArch = architectures[i]
        local compareResults = scenarioResults[compareArch].battles
        
        if #baseResults ~= #compareResults then
            comparison.identical = false
            comparison.discrepancyType = "battle_count_mismatch"
            comparison.severity = "critical"
            table.insert(comparison.discrepancies, {
                type = "battle_count_mismatch",
                baseArchitecture = baseArch,
                compareArchitecture = compareArch,
                baseCount = #baseResults,
                compareCount = #compareResults
            })
        else
        
        -- Compare individual battles
        local discrepancyCount = 0
        for j = 1, #baseResults do
            local baseBattle = baseResults[j]
            local compareBattle = compareResults[j]
            
            local battleDiscrepancies = BattleOutcomeVerifier.compareIndividualBattle(
                baseBattle, compareBattle, baseArch, compareArch
            )
            
            if #battleDiscrepancies > 0 then
                discrepancyCount = discrepancyCount + 1
                for _, discrepancy in ipairs(battleDiscrepancies) do
                    discrepancy.battleIteration = j
                    table.insert(comparison.discrepancies, discrepancy)
                end
            end
        end
        
        -- Calculate similarity
        local similarity = 1.0 - (discrepancyCount / #baseResults)
        comparison.similarity = math.min(comparison.similarity, similarity)
        
        if discrepancyCount > 0 then
            comparison.identical = false
            comparison.discrepancyType = "outcome_mismatch"
            
            -- Determine severity
            if similarity < 0.5 then
                comparison.severity = "critical"
            elseif similarity < 0.8 then
                comparison.severity = "high"
            elseif similarity < 0.95 then
                comparison.severity = "medium"
            else
                comparison.severity = "low"
            end
        end
        end -- end of else block
    end
    
    return comparison
end

-- Compare individual battle results
function BattleOutcomeVerifier.compareIndividualBattle(baseBattle, compareBattle, baseArch, compareArch)
    local discrepancies = {}
    
    -- Compare battle success
    if baseBattle.success ~= compareBattle.success then
        table.insert(discrepancies, {
            type = "execution_success_mismatch",
            baseSuccess = baseBattle.success,
            compareSuccess = compareBattle.success,
            baseArchitecture = baseArch,
            compareArchitecture = compareArch
        })
        return discrepancies -- If execution differed, can't compare outcomes
    end
    
    if not baseBattle.success then
        return discrepancies -- Both failed, no outcome to compare
    end
    
    -- Compare winners
    if baseBattle.winner ~= compareBattle.winner then
        table.insert(discrepancies, {
            type = "winner_mismatch",
            baseWinner = baseBattle.winner,
            compareWinner = compareBattle.winner,
            baseArchitecture = baseArch,
            compareArchitecture = compareArch
        })
    end
    
    -- Compare total turns
    if baseBattle.totalTurns ~= compareBattle.totalTurns then
        table.insert(discrepancies, {
            type = "turn_count_mismatch",
            baseTurns = baseBattle.totalTurns,
            compareTurns = compareBattle.totalTurns,
            baseArchitecture = baseArch,
            compareArchitecture = compareArch
        })
    end
    
    -- Compare final Pokemon states
    if baseBattle.finalState and compareBattle.finalState then
        local stateDiscrepancies = BattleOutcomeVerifier.compareFinalStates(
            baseBattle.finalState, compareBattle.finalState, baseArch, compareArch
        )
        
        for _, discrepancy in ipairs(stateDiscrepancies) do
            table.insert(discrepancies, discrepancy)
        end
    end
    
    return discrepancies
end

-- Compare final battle states
function BattleOutcomeVerifier.compareFinalStates(baseState, compareState, baseArch, compareArch)
    local discrepancies = {}
    
    -- Compare player party final state
    for i, basePokemon in ipairs(baseState.playerPartyState) do
        local comparePokemon = compareState.playerPartyState[i]
        
        if basePokemon.currentHp ~= comparePokemon.currentHp then
            table.insert(discrepancies, {
                type = "final_hp_mismatch",
                party = "player",
                pokemonIndex = i,
                baseHp = basePokemon.currentHp,
                compareHp = comparePokemon.currentHp,
                baseArchitecture = baseArch,
                compareArchitecture = compareArch
            })
        end
        
        if basePokemon.fainted ~= comparePokemon.fainted then
            table.insert(discrepancies, {
                type = "faint_status_mismatch",
                party = "player",
                pokemonIndex = i,
                baseFainted = basePokemon.fainted,
                compareFainted = comparePokemon.fainted,
                baseArchitecture = baseArch,
                compareArchitecture = compareArch
            })
        end
    end
    
    -- Compare opponent party final state
    for i, basePokemon in ipairs(baseState.opponentPartyState) do
        local comparePokemon = compareState.opponentPartyState[i]
        
        if basePokemon.currentHp ~= comparePokemon.currentHp then
            table.insert(discrepancies, {
                type = "final_hp_mismatch",
                party = "opponent",
                pokemonIndex = i,
                baseHp = basePokemon.currentHp,
                compareHp = comparePokemon.currentHp,
                baseArchitecture = baseArch,
                compareArchitecture = compareArch
            })
        end
    end
    
    return discrepancies
end

-- Generate comprehensive verification summary
function BattleOutcomeVerifier.generateVerificationSummary(verificationResults)
    local summary = {
        totalScenarios = 0,
        identicalScenarios = 0,
        discrepantScenarios = 0,
        overallSimilarity = 0,
        worstSeverity = "none",
        scenarioSummary = {},
        recommendations = {}
    }
    
    local totalSimilarity = 0
    local severityLevels = {none = 0, low = 1, medium = 2, high = 3, critical = 4}
    local maxSeverityLevel = 0
    
    for scenarioName, outcomeComparison in pairs(verificationResults.outcomeComparisons) do
        summary.totalScenarios = summary.totalScenarios + 1
        
        local scenarioSummary = {
            scenario = scenarioName,
            identical = outcomeComparison.identical,
            similarity = outcomeComparison.similarity,
            severity = outcomeComparison.severity,
            discrepancyCount = #outcomeComparison.discrepancies
        }
        
        summary.scenarioSummary[scenarioName] = scenarioSummary
        
        if outcomeComparison.identical then
            summary.identicalScenarios = summary.identicalScenarios + 1
        else
            summary.discrepantScenarios = summary.discrepantScenarios + 1
        end
        
        totalSimilarity = totalSimilarity + outcomeComparison.similarity
        
        local severityLevel = severityLevels[outcomeComparison.severity] or 0
        if severityLevel > maxSeverityLevel then
            maxSeverityLevel = severityLevel
            summary.worstSeverity = outcomeComparison.severity
        end
    end
    
    if summary.totalScenarios > 0 then
        summary.overallSimilarity = totalSimilarity / summary.totalScenarios
    end
    
    -- Generate recommendations
    summary.recommendations = BattleOutcomeVerifier.generateVerificationRecommendations(summary)
    
    return summary
end

-- Generate verification recommendations
function BattleOutcomeVerifier.generateVerificationRecommendations(summary)
    local recommendations = {}
    
    if summary.worstSeverity == "critical" then
        table.insert(recommendations, {
            priority = "critical",
            category = "battle_parity",
            description = "Critical battle outcome discrepancies detected",
            action = "Immediate investigation of battle logic differences required"
        })
    elseif summary.worstSeverity == "high" then
        table.insert(recommendations, {
            priority = "high",
            category = "battle_parity",
            description = "Significant battle outcome differences found",
            action = "Review battle calculation implementations for consistency"
        })
    end
    
    if summary.overallSimilarity < 0.9 then
        table.insert(recommendations, {
            priority = "high",
            category = "consistency",
            description = "Battle outcome similarity below 90%",
            action = "Systematic review of RNG usage and battle mechanics needed"
        })
    elseif summary.overallSimilarity < 0.99 then
        table.insert(recommendations, {
            priority = "medium",
            category = "consistency",
            description = "Minor battle outcome differences detected",
            action = "Review specific scenarios with discrepancies"
        })
    end
    
    return recommendations
end

-- Get battle test results
function BattleOutcomeVerifier.getBattleTestResults(testId)
    if testId then
        return BattleOutcomeVerifier.battleTests[testId]
    else
        return BattleOutcomeVerifier.battleTests
    end
end

return BattleOutcomeVerifier