-- Player Character Progression System
-- Comprehensive player progression tracking including character data, game progression, 
-- Pokédex completion, battle statistics, money, play time, and inventory management
-- Behavioral parity with TypeScript reference implementation

local Enums = require("data.constants.enums")

local PlayerProgressionSystem = {}

-- Player progression status constants
PlayerProgressionSystem.PROGRESSION_STATUS = {
    NONE = 0,
    IN_PROGRESS = 1,
    COMPLETED = 2
}

-- Game progression milestones
PlayerProgressionSystem.GAME_MILESTONES = {
    GYM_BADGES = {
        BROCK = 1,      -- Pewter Gym
        MISTY = 2,      -- Cerulean Gym
        LT_SURGE = 3,   -- Vermilion Gym
        ERIKA = 4,      -- Celadon Gym
        KOGA = 5,       -- Fuchsia Gym
        SABRINA = 6,    -- Saffron Gym
        BLAINE = 7,     -- Cinnabar Gym
        GIOVANNI = 8    -- Viridian Gym
    },
    ELITE_FOUR = {
        LORELEI = 1,
        BRUNO = 2,
        AGATHA = 3,
        LANCE = 4
    },
    CHAMPION = {
        CHAMPION_DEFEATED = 1,
        HALL_OF_FAME = 2
    }
}

-- Pokédex completion status
PlayerProgressionSystem.POKEDEX_STATUS = {
    UNSEEN = 0,
    SEEN = 1,
    CAUGHT = 2,
    OWNED = 3  -- Currently in party/PC
}

-- Battle types for statistics tracking
PlayerProgressionSystem.BATTLE_TYPES = {
    WILD = 1,
    TRAINER = 2,
    GYM_LEADER = 3,
    ELITE_FOUR = 4,
    CHAMPION = 5,
    LEGENDARY = 6
}

-- Player character customization options
PlayerProgressionSystem.CHARACTER_CUSTOMIZATION = {
    GENDER = {
        MALE = 0,
        FEMALE = 1,
        NON_BINARY = 2
    },
    APPEARANCE = {
        -- Appearance options would be expanded based on game requirements
        DEFAULT = 0
    }
}

-- Initialize player progression data structure
-- @param playerId: Player wallet address (AO identity)
-- @param playerName: Player character name
-- @param gender: Player character gender (from CHARACTER_CUSTOMIZATION.GENDER)
-- @return: Initial player progression data table
function PlayerProgressionSystem.initializePlayerProgression(playerId, playerName, gender)
    if not playerId or type(playerId) ~= "string" then
        return nil, "Invalid player ID"
    end
    
    if not playerName or type(playerName) ~= "string" or string.len(playerName) == 0 then
        return nil, "Invalid player name"
    end
    
    gender = gender or PlayerProgressionSystem.CHARACTER_CUSTOMIZATION.GENDER.MALE
    
    local currentTime = os.time()
    
    local playerData = {
        -- Core player identification
        playerId = playerId,
        gameVersion = "1.0.0",
        createdDate = currentTime,
        lastSaved = currentTime,
        
        -- Player character customization
        character = {
            name = playerName,
            gender = gender,
            appearance = PlayerProgressionSystem.CHARACTER_CUSTOMIZATION.APPEARANCE.DEFAULT,
            startDate = currentTime
        },
        
        -- Game progression tracking
        progression = {
            waveIndex = 1,
            biomeIndex = 1,
            gameMode = "CLASSIC",
            
            -- Gym badge tracking
            gymBadges = {
                BROCK = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                MISTY = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                LT_SURGE = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                ERIKA = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                KOGA = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                SABRINA = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                BLAINE = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                GIOVANNI = PlayerProgressionSystem.PROGRESSION_STATUS.NONE
            },
            badgeCount = 0,
            
            -- Elite Four progression
            eliteFour = {
                LORELEI = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                BRUNO = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                AGATHA = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                LANCE = PlayerProgressionSystem.PROGRESSION_STATUS.NONE
            },
            eliteFourCount = 0,
            
            -- Champion progression
            champion = {
                CHAMPION_DEFEATED = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
                HALL_OF_FAME = PlayerProgressionSystem.PROGRESSION_STATUS.NONE
            },
            championStatus = PlayerProgressionSystem.PROGRESSION_STATUS.NONE,
            
            -- Unlock status
            unlocks = {
                pcSystem = true,
                shop = false,
                breeding = false,
                daycare = false
            }
        },
        
        -- Pokédex completion tracking
        pokedex = {
            seenCount = 0,
            caughtCount = 0,
            ownedCount = 0,
            species = {} -- Will be populated with species completion status
        },
        
        -- Battle statistics
        gameStats = {
            battles = {
                totalBattles = 0,
                wins = 0,
                losses = 0,
                draws = 0,
                
                -- Battle type breakdown
                wildBattles = 0,
                trainerBattles = 0,
                gymBattles = 0,
                eliteFourBattles = 0,
                championBattles = 0,
                legendaryBattles = 0
            },
            
            -- Pokemon statistics
            pokemon = {
                totalCaught = 0,
                totalReleased = 0,
                totalEvolved = 0,
                favoriteSpecies = nil,
                highestLevel = 1
            },
            
            -- Achievement tracking
            achievements = {
                firstCapture = false,
                firstEvolution = false,
                firstGymBadge = false,
                allBadges = false,
                eliteFourDefeated = false,
                championDefeated = false,
                pokedexCompleted = false
            }
        },
        
        -- Money tracking
        money = {
            current = 3000, -- Starting money
            total = 3000,   -- Total money earned
            spent = 0,      -- Total money spent
            transactions = {} -- Transaction history
        },
        
        -- Play time tracking
        playTime = {
            totalSeconds = 0,
            currentSessionStart = currentTime,
            sessionCount = 1,
            longestSession = 0,
            averageSession = 0
        },
        
        -- Player inventory (basic structure)
        inventory = {
            items = {},
            keyItems = {},
            tms = {},
            berries = {},
            balls = {
                [1] = { itemId = 1, quantity = 20 } -- 20 Poké Balls to start
            },
            capacity = {
                items = 999,
                keyItems = 50,
                tms = 100,
                berries = 50
            }
        },
        
        -- Save data integrity
        dataIntegrity = {
            version = "1.0.0",
            checksum = nil, -- Will be calculated during save
            validated = true,
            lastValidation = currentTime
        }
    }
    
    -- Initialize Pokédex with all known species
    PlayerProgressionSystem.initializePokedex(playerData)
    
    return playerData
end

-- Initialize Pokédex with all species from enums
-- @param playerData: Player progression data table
function PlayerProgressionSystem.initializePokedex(playerData)
    if not playerData or not playerData.pokedex then
        return false, "Invalid player data"
    end
    
    -- Initialize all species with UNSEEN status
    for _, speciesId in pairs(Enums.SpeciesId) do
        playerData.pokedex.species[speciesId] = {
            status = PlayerProgressionSystem.POKEDEX_STATUS.UNSEEN,
            firstSeen = nil,
            firstCaught = nil,
            timesEncountered = 0,
            timesCaught = 0
        }
    end
    
    return true
end

-- Update player character information
-- @param playerData: Player progression data table
-- @param characterUpdates: Table with character updates
-- @return: Success boolean and error message
function PlayerProgressionSystem.updatePlayerCharacter(playerData, characterUpdates)
    if not playerData or not playerData.character then
        return false, "Invalid player data"
    end
    
    if not characterUpdates or type(characterUpdates) ~= "table" then
        return false, "Invalid character updates"
    end
    
    -- Update character name if provided
    if characterUpdates.name then
        if type(characterUpdates.name) ~= "string" or string.len(characterUpdates.name) == 0 then
            return false, "Invalid character name"
        end
        playerData.character.name = characterUpdates.name
    end
    
    -- Update character gender if provided
    if characterUpdates.gender then
        local validGenders = PlayerProgressionSystem.CHARACTER_CUSTOMIZATION.GENDER
        local validGender = false
        for _, gender in pairs(validGenders) do
            if characterUpdates.gender == gender then
                validGender = true
                break
            end
        end
        
        if not validGender then
            return false, "Invalid character gender"
        end
        
        playerData.character.gender = characterUpdates.gender
    end
    
    -- Update character appearance if provided
    if characterUpdates.appearance then
        playerData.character.appearance = characterUpdates.appearance
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true
end

-- Award gym badge and update progression
-- @param playerData: Player progression data table
-- @param badgeName: Badge name (from GAME_MILESTONES.GYM_BADGES)
-- @return: Success boolean and error message
function PlayerProgressionSystem.awardGymBadge(playerData, badgeName)
    if not playerData or not playerData.progression then
        return false, "Invalid player data"
    end
    
    if not badgeName or not PlayerProgressionSystem.GAME_MILESTONES.GYM_BADGES[badgeName] then
        return false, "Invalid badge name"
    end
    
    -- Check if badge already earned
    if playerData.progression.gymBadges[badgeName] == PlayerProgressionSystem.PROGRESSION_STATUS.COMPLETED then
        return false, "Badge already earned"
    end
    
    -- Award the badge
    playerData.progression.gymBadges[badgeName] = PlayerProgressionSystem.PROGRESSION_STATUS.COMPLETED
    playerData.progression.badgeCount = playerData.progression.badgeCount + 1
    
    -- Update achievements
    if not playerData.gameStats.achievements.firstGymBadge then
        playerData.gameStats.achievements.firstGymBadge = true
    end
    
    if playerData.progression.badgeCount == 8 then
        playerData.gameStats.achievements.allBadges = true
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true
end

-- Update Elite Four progression
-- @param playerData: Player progression data table
-- @param memberName: Elite Four member name
-- @return: Success boolean and error message
function PlayerProgressionSystem.updateEliteFourProgression(playerData, memberName)
    if not playerData or not playerData.progression then
        return false, "Invalid player data"
    end
    
    if not memberName or not PlayerProgressionSystem.GAME_MILESTONES.ELITE_FOUR[memberName] then
        return false, "Invalid Elite Four member name"
    end
    
    -- Mark Elite Four member as defeated
    playerData.progression.eliteFour[memberName] = PlayerProgressionSystem.PROGRESSION_STATUS.COMPLETED
    
    -- Count completed Elite Four battles
    local eliteFourCount = 0
    for _, status in pairs(playerData.progression.eliteFour) do
        if status == PlayerProgressionSystem.PROGRESSION_STATUS.COMPLETED then
            eliteFourCount = eliteFourCount + 1
        end
    end
    playerData.progression.eliteFourCount = eliteFourCount
    
    -- Check if all Elite Four are defeated
    if eliteFourCount == 4 then
        playerData.gameStats.achievements.eliteFourDefeated = true
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true
end

-- Update Champion progression
-- @param playerData: Player progression data table
-- @param championMilestone: Champion milestone (CHAMPION_DEFEATED or HALL_OF_FAME)
-- @return: Success boolean and error message
function PlayerProgressionSystem.updateChampionProgression(playerData, championMilestone)
    if not playerData or not playerData.progression then
        return false, "Invalid player data"
    end
    
    if not championMilestone or not PlayerProgressionSystem.GAME_MILESTONES.CHAMPION[championMilestone] then
        return false, "Invalid champion milestone"
    end
    
    -- Update champion progression
    playerData.progression.champion[championMilestone] = PlayerProgressionSystem.PROGRESSION_STATUS.COMPLETED
    
    -- Update overall champion status
    if championMilestone == "CHAMPION_DEFEATED" then
        playerData.progression.championStatus = PlayerProgressionSystem.PROGRESSION_STATUS.COMPLETED
        playerData.gameStats.achievements.championDefeated = true
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true
end

-- Update Pokédex entry
-- @param playerData: Player progression data table
-- @param speciesId: Species ID to update
-- @param status: New status (SEEN, CAUGHT, OWNED)
-- @return: Success boolean and error message
function PlayerProgressionSystem.updatePokedexEntry(playerData, speciesId, status)
    if not playerData or not playerData.pokedex then
        return false, "Invalid player data"
    end
    
    if not speciesId or not Enums.isValidSpecies(speciesId) then
        return false, "Invalid species ID"
    end
    
    if not status or status < PlayerProgressionSystem.POKEDEX_STATUS.UNSEEN or 
       status > PlayerProgressionSystem.POKEDEX_STATUS.OWNED then
        return false, "Invalid Pokédex status"
    end
    
    -- Initialize species entry if it doesn't exist
    if not playerData.pokedex.species[speciesId] then
        playerData.pokedex.species[speciesId] = {
            status = PlayerProgressionSystem.POKEDEX_STATUS.UNSEEN,
            firstSeen = nil,
            firstCaught = nil,
            timesEncountered = 0,
            timesCaught = 0
        }
    end
    
    local entry = playerData.pokedex.species[speciesId]
    local currentTime = os.time()
    local wasUnseen = (entry.status == PlayerProgressionSystem.POKEDEX_STATUS.UNSEEN)
    local wasUncaught = (entry.status < PlayerProgressionSystem.POKEDEX_STATUS.CAUGHT)
    
    -- Update status progression
    if status > entry.status then
        entry.status = status
        
        -- Track first encounters
        if status >= PlayerProgressionSystem.POKEDEX_STATUS.SEEN and not entry.firstSeen then
            entry.firstSeen = currentTime
            entry.timesEncountered = entry.timesEncountered + 1
            
            -- Update seen count
            if wasUnseen then
                playerData.pokedex.seenCount = playerData.pokedex.seenCount + 1
            end
        end
        
        if status >= PlayerProgressionSystem.POKEDEX_STATUS.CAUGHT and not entry.firstCaught then
            entry.firstCaught = currentTime
            entry.timesCaught = entry.timesCaught + 1
            
            -- Update caught count
            if wasUncaught then
                playerData.pokedex.caughtCount = playerData.pokedex.caughtCount + 1
                playerData.gameStats.pokemon.totalCaught = playerData.gameStats.pokemon.totalCaught + 1
                
                -- First capture achievement
                if not playerData.gameStats.achievements.firstCapture then
                    playerData.gameStats.achievements.firstCapture = true
                end
            end
        end
        
        if status == PlayerProgressionSystem.POKEDEX_STATUS.OWNED then
            playerData.pokedex.ownedCount = playerData.pokedex.ownedCount + 1
        end
    elseif status == PlayerProgressionSystem.POKEDEX_STATUS.SEEN and entry.status >= PlayerProgressionSystem.POKEDEX_STATUS.SEEN then
        -- Increment encounter count for repeat sightings
        entry.timesEncountered = entry.timesEncountered + 1
    elseif status == PlayerProgressionSystem.POKEDEX_STATUS.CAUGHT and entry.status >= PlayerProgressionSystem.POKEDEX_STATUS.CAUGHT then
        -- Increment capture count for repeat catches
        entry.timesCaught = entry.timesCaught + 1
        playerData.gameStats.pokemon.totalCaught = playerData.gameStats.pokemon.totalCaught + 1
    end
    
    -- Check for Pokédex completion achievement
    local totalSpecies = 0
    for _ in pairs(Enums.SpeciesId) do
        totalSpecies = totalSpecies + 1
    end
    
    if playerData.pokedex.caughtCount == totalSpecies then
        playerData.gameStats.achievements.pokedexCompleted = true
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true
end

-- Get player progression summary
-- @param playerData: Player progression data table
-- @return: Progression summary table
function PlayerProgressionSystem.getProgressionSummary(playerData)
    if not playerData then
        return nil
    end
    
    return {
        playerId = playerData.playerId,
        characterName = playerData.character.name,
        badgeCount = playerData.progression.badgeCount,
        eliteFourCount = playerData.progression.eliteFourCount,
        championStatus = playerData.progression.championStatus,
        pokedexCompletion = {
            seen = playerData.pokedex.seenCount,
            caught = playerData.pokedex.caughtCount,
            owned = playerData.pokedex.ownedCount
        },
        battleStats = {
            totalBattles = playerData.gameStats.battles.totalBattles,
            winRate = playerData.gameStats.battles.totalBattles > 0 and 
                     (playerData.gameStats.battles.wins / playerData.gameStats.battles.totalBattles) or 0
        },
        playTime = playerData.playTime.totalSeconds,
        money = playerData.money.current,
        achievements = playerData.gameStats.achievements
    }
end

-- Validate player progression data integrity
-- @param playerData: Player progression data table
-- @return: Validation result and any errors
function PlayerProgressionSystem.validatePlayerData(playerData)
    local errors = {}
    
    if not playerData then
        table.insert(errors, "Player data is nil")
        return false, errors
    end
    
    -- Validate core fields
    if not playerData.playerId or type(playerData.playerId) ~= "string" then
        table.insert(errors, "Invalid player ID")
    end
    
    if not playerData.character or not playerData.character.name then
        table.insert(errors, "Invalid character data")
    end
    
    if not playerData.progression then
        table.insert(errors, "Missing progression data")
    end
    
    if not playerData.pokedex then
        table.insert(errors, "Missing Pokédex data")
    end
    
    if not playerData.gameStats then
        table.insert(errors, "Missing game statistics")
    end
    
    if not playerData.money or playerData.money.current < 0 then
        table.insert(errors, "Invalid money data")
    end
    
    if not playerData.playTime or playerData.playTime.totalSeconds < 0 then
        table.insert(errors, "Invalid play time data")
    end
    
    -- Validate progression consistency
    if playerData.progression then
        local badgeCount = 0
        for _, status in pairs(playerData.progression.gymBadges or {}) do
            if status == PlayerProgressionSystem.PROGRESSION_STATUS.COMPLETED then
                badgeCount = badgeCount + 1
            end
        end
        
        if badgeCount ~= (playerData.progression.badgeCount or 0) then
            table.insert(errors, "Badge count mismatch")
        end
    end
    
    -- Validate Pokédex consistency
    if playerData.pokedex and playerData.pokedex.species then
        local seenCount = 0
        local caughtCount = 0
        local ownedCount = 0
        
        for _, entry in pairs(playerData.pokedex.species) do
            if entry.status >= PlayerProgressionSystem.POKEDEX_STATUS.SEEN then
                seenCount = seenCount + 1
            end
            if entry.status >= PlayerProgressionSystem.POKEDEX_STATUS.CAUGHT then
                caughtCount = caughtCount + 1
            end
            if entry.status == PlayerProgressionSystem.POKEDEX_STATUS.OWNED then
                ownedCount = ownedCount + 1
            end
        end
        
        if seenCount ~= playerData.pokedex.seenCount then
            table.insert(errors, "Pokédex seen count mismatch")
        end
        if caughtCount ~= playerData.pokedex.caughtCount then
            table.insert(errors, "Pokédex caught count mismatch")
        end
        if ownedCount ~= playerData.pokedex.ownedCount then
            table.insert(errors, "Pokédex owned count mismatch")
        end
    end
    
    return #errors == 0, errors
end

-- Battle Statistics Tracking Functions

-- Record battle result and update statistics
-- @param playerData: Player progression data table
-- @param battleType: Type of battle (from BATTLE_TYPES)
-- @param result: Battle result ('win', 'loss', 'draw')
-- @param battleContext: Additional battle context (optional)
-- @return: Success boolean and error message
function PlayerProgressionSystem.recordBattleResult(playerData, battleType, result, battleContext)
    if not playerData or not playerData.gameStats then
        return false, "Invalid player data"
    end
    
    if not battleType or not PlayerProgressionSystem.BATTLE_TYPES[battleType] then
        return false, "Invalid battle type"
    end
    
    if not result or (result ~= 'win' and result ~= 'loss' and result ~= 'draw') then
        return false, "Invalid battle result"
    end
    
    local battles = playerData.gameStats.battles
    
    -- Update overall battle statistics
    battles.totalBattles = battles.totalBattles + 1
    
    if result == 'win' then
        battles.wins = battles.wins + 1
    elseif result == 'loss' then
        battles.losses = battles.losses + 1
    else
        battles.draws = battles.draws + 1
    end
    
    -- Update battle type statistics
    if battleType == 'WILD' then
        battles.wildBattles = battles.wildBattles + 1
    elseif battleType == 'TRAINER' then
        battles.trainerBattles = battles.trainerBattles + 1
    elseif battleType == 'GYM_LEADER' then
        battles.gymBattles = battles.gymBattles + 1
    elseif battleType == 'ELITE_FOUR' then
        battles.eliteFourBattles = battles.eliteFourBattles + 1
    elseif battleType == 'CHAMPION' then
        battles.championBattles = battles.championBattles + 1
    elseif battleType == 'LEGENDARY' then
        battles.legendaryBattles = battles.legendaryBattles + 1
    end
    
    -- Update highest level if provided in context
    if battleContext and battleContext.highestLevel then
        if battleContext.highestLevel > playerData.gameStats.pokemon.highestLevel then
            playerData.gameStats.pokemon.highestLevel = battleContext.highestLevel
        end
    end
    
    -- Update favorite species tracking if provided
    if battleContext and battleContext.pokemonUsed then
        for _, pokemon in ipairs(battleContext.pokemonUsed) do
            if not playerData.gameStats.pokemon.favoriteSpecies or 
               pokemon.timesUsed > (playerData.gameStats.pokemon.favoriteSpecies.timesUsed or 0) then
                playerData.gameStats.pokemon.favoriteSpecies = {
                    speciesId = pokemon.speciesId,
                    timesUsed = pokemon.timesUsed or 1
                }
            end
        end
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true
end

-- Money Management Functions

-- Add money to player's balance with transaction logging
-- @param playerData: Player progression data table
-- @param amount: Amount to add (must be positive)
-- @param source: Source of money gain (e.g., 'battle_win', 'item_sale')
-- @param description: Optional transaction description
-- @return: Success boolean, new balance, and error message
function PlayerProgressionSystem.addMoney(playerData, amount, source, description)
    if not playerData or not playerData.money then
        return false, 0, "Invalid player data"
    end
    
    if not amount or amount <= 0 then
        return false, playerData.money.current, "Invalid amount"
    end
    
    if not source or type(source) ~= "string" then
        return false, playerData.money.current, "Invalid source"
    end
    
    -- Check for overflow protection
    local maxMoney = 999999999
    if playerData.money.current + amount > maxMoney then
        amount = maxMoney - playerData.money.current
    end
    
    -- Update money balances
    playerData.money.current = playerData.money.current + amount
    playerData.money.total = playerData.money.total + amount
    
    -- Log transaction
    local transaction = {
        timestamp = os.time(),
        type = "gain",
        amount = amount,
        source = source,
        description = description or "",
        balanceAfter = playerData.money.current
    }
    
    table.insert(playerData.money.transactions, transaction)
    
    -- Keep transaction history manageable (last 100 transactions)
    if #playerData.money.transactions > 100 then
        table.remove(playerData.money.transactions, 1)
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true, playerData.money.current
end

-- Spend money from player's balance with transaction logging
-- @param playerData: Player progression data table
-- @param amount: Amount to spend (must be positive)
-- @param purpose: Purpose of spending (e.g., 'item_purchase', 'service')
-- @param description: Optional transaction description
-- @return: Success boolean, new balance, and error message
function PlayerProgressionSystem.spendMoney(playerData, amount, purpose, description)
    if not playerData or not playerData.money then
        return false, 0, "Invalid player data"
    end
    
    if not amount or amount <= 0 then
        return false, playerData.money.current, "Invalid amount"
    end
    
    if not purpose or type(purpose) ~= "string" then
        return false, playerData.money.current, "Invalid purpose"
    end
    
    -- Check if player has enough money
    if playerData.money.current < amount then
        return false, playerData.money.current, "Insufficient funds"
    end
    
    -- Update money balances
    playerData.money.current = playerData.money.current - amount
    playerData.money.spent = playerData.money.spent + amount
    
    -- Log transaction
    local transaction = {
        timestamp = os.time(),
        type = "spend",
        amount = amount,
        purpose = purpose,
        description = description or "",
        balanceAfter = playerData.money.current
    }
    
    table.insert(playerData.money.transactions, transaction)
    
    -- Keep transaction history manageable (last 100 transactions)
    if #playerData.money.transactions > 100 then
        table.remove(playerData.money.transactions, 1)
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true, playerData.money.current
end

-- Get money transaction history
-- @param playerData: Player progression data table
-- @param limit: Maximum number of transactions to return (optional)
-- @return: Array of recent transactions
function PlayerProgressionSystem.getTransactionHistory(playerData, limit)
    if not playerData or not playerData.money or not playerData.money.transactions then
        return {}
    end
    
    local transactions = playerData.money.transactions
    limit = limit or #transactions
    
    if limit >= #transactions then
        return transactions
    end
    
    -- Return the most recent transactions
    local recentTransactions = {}
    local startIndex = #transactions - limit + 1
    
    for i = startIndex, #transactions do
        table.insert(recentTransactions, transactions[i])
    end
    
    return recentTransactions
end

-- Play Time and Session Management Functions

-- Start a new play session
-- @param playerData: Player progression data table
-- @return: Success boolean and error message
function PlayerProgressionSystem.startSession(playerData)
    if not playerData or not playerData.playTime then
        return false, "Invalid player data"
    end
    
    -- End previous session if it was still active
    if playerData.playTime.currentSessionStart then
        PlayerProgressionSystem.endSession(playerData)
    end
    
    playerData.playTime.currentSessionStart = os.time()
    playerData.playTime.sessionCount = playerData.playTime.sessionCount + 1
    
    return true
end

-- End current play session and update play time statistics
-- @param playerData: Player progression data table
-- @return: Success boolean, session duration, and error message
function PlayerProgressionSystem.endSession(playerData)
    if not playerData or not playerData.playTime then
        return false, 0, "Invalid player data"
    end
    
    if not playerData.playTime.currentSessionStart then
        return false, 0, "No active session"
    end
    
    local currentTime = os.time()
    local sessionDuration = currentTime - playerData.playTime.currentSessionStart
    
    -- Update play time statistics
    playerData.playTime.totalSeconds = playerData.playTime.totalSeconds + sessionDuration
    
    -- Update longest session record
    if sessionDuration > playerData.playTime.longestSession then
        playerData.playTime.longestSession = sessionDuration
    end
    
    -- Calculate average session length
    if playerData.playTime.sessionCount > 0 then
        playerData.playTime.averageSession = playerData.playTime.totalSeconds / playerData.playTime.sessionCount
    end
    
    -- Clear current session
    playerData.playTime.currentSessionStart = nil
    
    -- Update last saved timestamp
    playerData.lastSaved = currentTime
    
    return true, sessionDuration
end

-- Get current session duration
-- @param playerData: Player progression data table
-- @return: Current session duration in seconds
function PlayerProgressionSystem.getCurrentSessionDuration(playerData)
    if not playerData or not playerData.playTime or not playerData.playTime.currentSessionStart then
        return 0
    end
    
    return os.time() - playerData.playTime.currentSessionStart
end

-- Format play time for display
-- @param seconds: Total seconds to format
-- @return: Formatted time string (e.g., "1h 23m 45s")
function PlayerProgressionSystem.formatPlayTime(seconds)
    if not seconds or seconds < 0 then
        return "0s"
    end
    
    local hours = math.floor(seconds / 3600)
    local minutes = math.floor((seconds % 3600) / 60)
    local remainingSeconds = seconds % 60
    
    if hours > 0 then
        return string.format("%dh %dm %ds", hours, minutes, remainingSeconds)
    elseif minutes > 0 then
        return string.format("%dm %ds", minutes, remainingSeconds)
    else
        return string.format("%ds", remainingSeconds)
    end
end

-- Player Inventory Management Functions

-- Add item to player inventory
-- @param playerData: Player progression data table
-- @param itemId: Item ID to add
-- @param quantity: Quantity to add (default: 1)
-- @param itemType: Type of item ('items', 'keyItems', 'tms', 'berries', 'balls')
-- @return: Success boolean and error message
function PlayerProgressionSystem.addItem(playerData, itemId, quantity, itemType)
    if not playerData or not playerData.inventory then
        return false, "Invalid player data"
    end
    
    if not itemId or itemId <= 0 then
        return false, "Invalid item ID"
    end
    
    quantity = quantity or 1
    if quantity <= 0 then
        return false, "Invalid quantity"
    end
    
    itemType = itemType or 'items'
    if not playerData.inventory[itemType] then
        return false, "Invalid item type"
    end
    
    -- Check inventory capacity
    local capacity = playerData.inventory.capacity[itemType]
    if capacity then
        local currentCount = 0
        for _ in pairs(playerData.inventory[itemType]) do
            currentCount = currentCount + 1
        end
        
        if currentCount >= capacity then
            return false, "Inventory full"
        end
    end
    
    -- Add item to inventory
    if playerData.inventory[itemType][itemId] then
        playerData.inventory[itemType][itemId].quantity = playerData.inventory[itemType][itemId].quantity + quantity
    else
        playerData.inventory[itemType][itemId] = {
            itemId = itemId,
            quantity = quantity,
            acquired = os.time()
        }
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true
end

-- Remove item from player inventory
-- @param playerData: Player progression data table
-- @param itemId: Item ID to remove
-- @param quantity: Quantity to remove (default: 1)
-- @param itemType: Type of item ('items', 'keyItems', 'tms', 'berries', 'balls')
-- @return: Success boolean, actual quantity removed, and error message
function PlayerProgressionSystem.removeItem(playerData, itemId, quantity, itemType)
    if not playerData or not playerData.inventory then
        return false, 0, "Invalid player data"
    end
    
    if not itemId or itemId <= 0 then
        return false, 0, "Invalid item ID"
    end
    
    quantity = quantity or 1
    if quantity <= 0 then
        return false, 0, "Invalid quantity"
    end
    
    itemType = itemType or 'items'
    if not playerData.inventory[itemType] then
        return false, 0, "Invalid item type"
    end
    
    -- Check if item exists in inventory
    local item = playerData.inventory[itemType][itemId]
    if not item then
        return false, 0, "Item not found in inventory"
    end
    
    -- Determine how many can be removed
    local quantityToRemove = math.min(quantity, item.quantity)
    
    -- Remove quantity
    item.quantity = item.quantity - quantityToRemove
    
    -- Remove item entry if quantity reaches zero
    if item.quantity <= 0 then
        playerData.inventory[itemType][itemId] = nil
    end
    
    -- Update last saved timestamp
    playerData.lastSaved = os.time()
    
    return true, quantityToRemove
end

-- Check if player has specific item quantity
-- @param playerData: Player progression data table
-- @param itemId: Item ID to check
-- @param quantity: Quantity needed (default: 1)
-- @param itemType: Type of item ('items', 'keyItems', 'tms', 'berries', 'balls')
-- @return: Boolean indicating if player has enough items
function PlayerProgressionSystem.hasItem(playerData, itemId, quantity, itemType)
    if not playerData or not playerData.inventory then
        return false
    end
    
    if not itemId or itemId <= 0 then
        return false
    end
    
    quantity = quantity or 1
    itemType = itemType or 'items'
    
    if not playerData.inventory[itemType] then
        return false
    end
    
    local item = playerData.inventory[itemType][itemId]
    return item and item.quantity >= quantity
end

-- Get inventory summary
-- @param playerData: Player progression data table
-- @return: Inventory summary table
function PlayerProgressionSystem.getInventorySummary(playerData)
    if not playerData or not playerData.inventory then
        return nil
    end
    
    local summary = {
        items = {},
        keyItems = {},
        tms = {},
        berries = {},
        balls = {},
        totalItems = 0
    }
    
    for itemType, items in pairs(playerData.inventory) do
        if type(items) == "table" and itemType ~= "capacity" then
            summary[itemType] = {}
            for itemId, item in pairs(items) do
                summary[itemType][itemId] = {
                    itemId = item.itemId,
                    quantity = item.quantity,
                    acquired = item.acquired
                }
                summary.totalItems = summary.totalItems + item.quantity
            end
        end
    end
    
    return summary
end

-- Save Data Validation and Integrity Functions

-- Calculate SHA256 checksum for player data integrity
-- @param playerData: Player progression data table
-- @return: SHA256 checksum string
function PlayerProgressionSystem.calculateChecksum(playerData)
    if not playerData then
        return nil
    end
    
    -- Create a copy of player data without the checksum field for calculation
    local dataForChecksum = {}
    for key, value in pairs(playerData) do
        if key ~= "dataIntegrity" then
            dataForChecksum[key] = value
        end
    end
    
    -- Convert to JSON string for consistent hashing
    local jsonString = ""
    
    -- Simple JSON serialization for checksum (deterministic order)
    local function serializeTable(t, depth)
        depth = depth or 0
        if depth > 10 then return "{}" end -- Prevent infinite recursion
        
        local result = "{"
        local keys = {}
        for k in pairs(t) do
            table.insert(keys, k)
        end
        table.sort(keys, function(a, b) return tostring(a) < tostring(b) end)
        
        for i, k in ipairs(keys) do
            if i > 1 then result = result .. "," end
            local v = t[k]
            result = result .. '"' .. tostring(k) .. '":'
            
            if type(v) == "table" then
                result = result .. serializeTable(v, depth + 1)
            elseif type(v) == "string" then
                result = result .. '"' .. v .. '"'
            else
                result = result .. tostring(v)
            end
        end
        result = result .. "}"
        return result
    end
    
    jsonString = serializeTable(dataForChecksum)
    
    -- Simple hash function (not cryptographically secure, but adequate for data integrity)
    local function simpleHash(str)
        local hash = 0
        for i = 1, #str do
            hash = ((hash << 5) - hash + string.byte(str, i)) & 0xFFFFFFFF
        end
        return string.format("%08x", hash)
    end
    
    return simpleHash(jsonString)
end

-- Validate player data integrity using checksum
-- @param playerData: Player progression data table
-- @return: Boolean indicating if data is valid, and error messages
function PlayerProgressionSystem.validateDataIntegrity(playerData)
    if not playerData then
        return false, {"Player data is nil"}
    end
    
    if not playerData.dataIntegrity then
        return false, {"Missing data integrity information"}
    end
    
    -- Calculate current checksum
    local currentChecksum = PlayerProgressionSystem.calculateChecksum(playerData)
    
    -- Compare with stored checksum
    if currentChecksum ~= playerData.dataIntegrity.checksum then
        return false, {"Data integrity check failed - checksum mismatch"}
    end
    
    -- Additional validation checks
    local isValid, validationErrors = PlayerProgressionSystem.validatePlayerData(playerData)
    if not isValid then
        return false, validationErrors
    end
    
    -- Update validation timestamp
    playerData.dataIntegrity.lastValidation = os.time()
    playerData.dataIntegrity.validated = true
    
    return true, {}
end

-- Create backup of player data before modifications
-- @param playerData: Player progression data table
-- @return: Deep copy of player data for backup
function PlayerProgressionSystem.createBackup(playerData)
    if not playerData then
        return nil
    end
    
    local function deepCopy(original)
        local copy = {}
        for key, value in pairs(original) do
            if type(value) == "table" then
                copy[key] = deepCopy(value)
            else
                copy[key] = value
            end
        end
        return copy
    end
    
    return deepCopy(playerData)
end

-- Restore player data from backup
-- @param backupData: Backup player data to restore
-- @return: Restored player data and success boolean
function PlayerProgressionSystem.restoreFromBackup(backupData)
    if not backupData then
        return nil, false
    end
    
    -- Validate backup data before restoring
    local isValid, errors = PlayerProgressionSystem.validatePlayerData(backupData)
    if not isValid then
        return nil, false, "Backup data is corrupted: " .. table.concat(errors, ", ")
    end
    
    return PlayerProgressionSystem.createBackup(backupData), true
end

-- Prepare player data for saving (update checksums, timestamps)
-- @param playerData: Player progression data table
-- @return: Player data ready for persistence
function PlayerProgressionSystem.prepareSaveData(playerData)
    if not playerData then
        return nil
    end
    
    -- Update save timestamp
    playerData.lastSaved = os.time()
    
    -- Update data integrity information
    if not playerData.dataIntegrity then
        playerData.dataIntegrity = {
            version = "1.0.0",
            checksum = nil,
            validated = false,
            lastValidation = os.time()
        }
    end
    
    -- Calculate and store checksum
    playerData.dataIntegrity.checksum = PlayerProgressionSystem.calculateChecksum(playerData)
    playerData.dataIntegrity.validated = true
    playerData.dataIntegrity.lastValidation = os.time()
    
    return playerData
end

-- Migrate player data to newer version if needed
-- @param playerData: Player progression data table
-- @param targetVersion: Target version to migrate to (optional)
-- @return: Migrated player data and success boolean
function PlayerProgressionSystem.migratePlayerData(playerData, targetVersion)
    if not playerData then
        return nil, false
    end
    
    targetVersion = targetVersion or "1.0.0"
    local currentVersion = playerData.gameVersion or "1.0.0"
    
    -- No migration needed if versions match
    if currentVersion == targetVersion then
        return playerData, true
    end
    
    -- Create backup before migration
    local backup = PlayerProgressionSystem.createBackup(playerData)
    
    -- Version-specific migrations would go here
    -- For now, we just update the version number
    playerData.gameVersion = targetVersion
    
    -- Update data integrity after migration
    if playerData.dataIntegrity then
        playerData.dataIntegrity.version = targetVersion
    end
    
    -- Validate migrated data
    local isValid, errors = PlayerProgressionSystem.validatePlayerData(playerData)
    if not isValid then
        -- Restore from backup if migration failed
        return backup, false, "Migration failed: " .. table.concat(errors, ", ")
    end
    
    return playerData, true
end

-- System Integration Functions

-- Serialize player data to JSON for external storage
-- @param playerData: Player progression data table
-- @return: JSON string representation
function PlayerProgressionSystem.serializePlayerData(playerData)
    if not playerData then
        return nil
    end
    
    -- Prepare data for saving (updates checksums)
    local saveData = PlayerProgressionSystem.prepareSaveData(playerData)
    
    -- Simple JSON serialization
    local function toJSON(t, depth)
        depth = depth or 0
        if depth > 20 then return "{}" end
        
        if type(t) ~= "table" then
            if type(t) == "string" then
                return '"' .. t:gsub('"', '\\"') .. '"'
            else
                return tostring(t)
            end
        end
        
        local result = "{"
        local first = true
        
        for k, v in pairs(t) do
            if not first then result = result .. "," end
            first = false
            
            result = result .. '"' .. tostring(k) .. '":'
            result = result .. toJSON(v, depth + 1)
        end
        
        result = result .. "}"
        return result
    end
    
    return toJSON(saveData)
end

-- Get player statistics summary for external systems
-- @param playerData: Player progression data table
-- @return: Statistics summary table
function PlayerProgressionSystem.getPlayerStatistics(playerData)
    if not playerData then
        return nil
    end
    
    return {
        playerId = playerData.playerId,
        character = {
            name = playerData.character.name,
            gender = playerData.character.gender,
            created = playerData.character.startDate
        },
        progression = {
            badgeCount = playerData.progression.badgeCount,
            eliteFourCount = playerData.progression.eliteFourCount,
            championStatus = playerData.progression.championStatus,
            waveIndex = playerData.progression.waveIndex
        },
        pokedex = {
            seenCount = playerData.pokedex.seenCount,
            caughtCount = playerData.pokedex.caughtCount,
            completionPercentage = playerData.pokedex.caughtCount > 0 and
                (playerData.pokedex.caughtCount / 151 * 100) or 0
        },
        battles = {
            totalBattles = playerData.gameStats.battles.totalBattles,
            wins = playerData.gameStats.battles.wins,
            losses = playerData.gameStats.battles.losses,
            winRate = playerData.gameStats.battles.totalBattles > 0 and
                (playerData.gameStats.battles.wins / playerData.gameStats.battles.totalBattles * 100) or 0
        },
        pokemon = {
            totalCaught = playerData.gameStats.pokemon.totalCaught,
            highestLevel = playerData.gameStats.pokemon.highestLevel,
            favoriteSpecies = playerData.gameStats.pokemon.favoriteSpecies
        },
        money = {
            current = playerData.money.current,
            totalEarned = playerData.money.total,
            totalSpent = playerData.money.spent
        },
        playTime = {
            totalSeconds = playerData.playTime.totalSeconds,
            sessionCount = playerData.playTime.sessionCount,
            averageSession = playerData.playTime.averageSession,
            longestSession = playerData.playTime.longestSession,
            formattedTotal = PlayerProgressionSystem.formatPlayTime(playerData.playTime.totalSeconds)
        },
        achievements = playerData.gameStats.achievements,
        lastSaved = playerData.lastSaved,
        dataIntegrity = {
            validated = playerData.dataIntegrity.validated,
            lastValidation = playerData.dataIntegrity.lastValidation,
            version = playerData.dataIntegrity.version
        }
    }
end

return PlayerProgressionSystem