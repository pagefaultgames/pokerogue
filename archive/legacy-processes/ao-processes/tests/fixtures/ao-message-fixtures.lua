-- Comprehensive Mock AO Message Object Library
-- Provides realistic AO message templates for testing

local AOMessageFixtures = {}
AOMessageFixtures.__index = AOMessageFixtures

function AOMessageFixtures.new()
    local fixtures = setmetatable({}, AOMessageFixtures)
    fixtures.templates = {}
    fixtures.messageCounter = 0
    fixtures:initializeTemplates()
    return fixtures
end

function AOMessageFixtures:initializeTemplates()
    self.templates = {
        -- Authentication Messages
        auth = {
        authRequest = {
            From = "wallet-address-123",
            Action = "Auth-Request",
            Data = "",
            Tags = {
                Wallet = "wallet-address-123",
                Timestamp = "1692000000",
                ["Protocol-Version"] = "1.0"
            },
            ["Block-Height"] = "1000000",
            Owner = "wallet-address-123",
            Module = "auth-module"
        },
        
        authChallenge = {
            From = "process-id",
            Action = "Auth-Challenge",
            Data = '{"challenge": "random-challenge-string", "expires": 1692001000}',
            Tags = {
                Target = "wallet-address-123",
                Type = "challenge",
                Timestamp = "1692000030"
            },
            ["Block-Height"] = "1000001",
            Owner = "process-owner",
            Module = "auth-module"
        },
        
        authResponse = {
            From = "wallet-address-123",
            Action = "Auth-Response",
            Data = '{"signature": "signed-challenge-response", "publicKey": "user-public-key"}',
            Tags = {
                Wallet = "wallet-address-123",
                ChallengeId = "challenge-123",
                Timestamp = "1692000060"
            },
            ["Block-Height"] = "1000002",
            Owner = "wallet-address-123",
            Module = "auth-module"
        }
        },
        
        -- Battle Messages
        battle = {
        battleStart = {
            From = "player-wallet-1",
            Action = "Battle-Start",
            Data = '{"opponentId": "player-wallet-2", "battleType": "ranked", "gameMode": "singles"}',
            Tags = {
                Wallet = "player-wallet-1",
                BattleType = "ranked",
                GameMode = "singles",
                Timestamp = "1692000100"
            },
            ["Block-Height"] = "1000010",
            Owner = "player-wallet-1",
            Module = "battle-module"
        },
        
        battleMove = {
            From = "player-wallet-1",
            Action = "Battle-Move",
            Data = '{"moveId": 85, "targetSlot": 0, "pokemonSlot": 0, "battleSeed": "battle-seed-123"}',
            Tags = {
                Wallet = "player-wallet-1",
                BattleId = "battle-456",
                Turn = "1",
                MoveType = "attack",
                Timestamp = "1692000130"
            },
            ["Block-Height"] = "1000011",
            Owner = "player-wallet-1",
            Module = "battle-module"
        },
        
        battleSwitch = {
            From = "player-wallet-1",
            Action = "Battle-Switch",
            Data = '{"fromSlot": 0, "toSlot": 1}',
            Tags = {
                Wallet = "player-wallet-1",
                BattleId = "battle-456",
                Turn = "2",
                ActionType = "switch",
                Timestamp = "1692000160"
            },
            ["Block-Height"] = "1000012",
            Owner = "player-wallet-1",
            Module = "battle-module"
        },
        
        battleEnd = {
            From = "process-id",
            Action = "Battle-End",
            Data = '{"winner": "player-wallet-1", "reason": "opponent-fainted", "rewards": {"exp": 1500, "money": 500}}',
            Tags = {
                BattleId = "battle-456",
                Winner = "player-wallet-1",
                BattleType = "ranked",
                Duration = "180",
                Timestamp = "1692000300"
            },
            ["Block-Height"] = "1000020",
            Owner = "process-owner",
            Module = "battle-module"
        }
        },
        
        -- Query Messages
        query = {
        stateQuery = {
            From = "player-wallet-1",
            Action = "Query",
            Data = "state",
            Tags = {
                Wallet = "player-wallet-1",
                QueryType = "state",
                Timestamp = "1692000400"
            },
            ["Block-Height"] = "1000030",
            Owner = "player-wallet-1",
            Module = "query-module"
        },
        
        pokemonQuery = {
            From = "player-wallet-1",
            Action = "Query",
            Data = "pokemon",
            Tags = {
                Wallet = "player-wallet-1",
                QueryType = "pokemon",
                Filter = "party",
                Timestamp = "1692000430"
            },
            ["Block-Height"] = "1000031",
            Owner = "player-wallet-1",
            Module = "query-module"
        },
        
        battleHistoryQuery = {
            From = "player-wallet-1",
            Action = "Query",
            Data = "battle-history",
            Tags = {
                Wallet = "player-wallet-1",
                QueryType = "battle-history",
                Limit = "10",
                Timestamp = "1692000460"
            },
            ["Block-Height"] = "1000032",
            Owner = "player-wallet-1",
            Module = "query-module"
        }
        },
        
        -- Game Management Messages
        game = {
        saveGame = {
            From = "player-wallet-1",
            Action = "Save-Game",
            Data = '{"saveSlot": 1, "checkpoint": "gym-leader-3"}',
            Tags = {
                Wallet = "player-wallet-1",
                SaveSlot = "1",
                GameVersion = "1.0",
                Timestamp = "1692000500"
            },
            ["Block-Height"] = "1000040",
            Owner = "player-wallet-1",
            Module = "game-module"
        },
        
        loadGame = {
            From = "player-wallet-1",
            Action = "Load-Game",
            Data = '{"saveSlot": 1}',
            Tags = {
                Wallet = "player-wallet-1",
                SaveSlot = "1",
                Timestamp = "1692000530"
            },
            ["Block-Height"] = "1000041",
            Owner = "player-wallet-1",
            Module = "game-module"
        }
        },
        
        -- Admin Messages
        admin = {
        getInfo = {
            From = "admin-wallet",
            Action = "Info",
            Data = "",
            Tags = {
                Wallet = "admin-wallet",
                AdminLevel = "moderator",
                Timestamp = "1692000600"
            },
            ["Block-Height"] = "1000050",
            Owner = "admin-wallet",
            Module = "admin-module"
        },
        
        getHandlers = {
            From = "admin-wallet",
            Action = "Admin-Query",
            Data = "handlers",
            Tags = {
                Wallet = "admin-wallet",
                QueryType = "handlers",
                AdminLevel = "developer",
                Timestamp = "1692000630"
            },
            ["Block-Height"] = "1000051",
            Owner = "admin-wallet",
            Module = "admin-module"
        }
        },
        
        -- Error Messages (for testing error handling)
        error = {
        malformedMessage = {
            From = "bad-wallet",
            Action = "Invalid-Action",
            Data = "malformed json {{{",
            Tags = {
                Wallet = "bad-wallet"
            },
            ["Block-Height"] = "1000100",
            Owner = "bad-wallet"
        },
        
        unauthorizedMessage = {
            From = "unauthorized-wallet",
            Action = "Admin-Query",
            Data = "sensitive-data",
            Tags = {
                Wallet = "unauthorized-wallet",
                Timestamp = "1692000700"
            },
            ["Block-Height"] = "1000101",
            Owner = "unauthorized-wallet",
            Module = "admin-module"
        }
        }
    }
end

-- Message Creation Methods
function AOMessageFixtures:createMessage(category, messageType, overrides)
    overrides = overrides or {}
    
    local template = self.templates[category] and self.templates[category][messageType]
    if not template then
        error("Unknown message template: " .. category .. "." .. messageType)
    end
    
    -- Deep copy the template
    local message = self:deepCopy(template)
    
    -- Generate unique ID
    self.messageCounter = self.messageCounter + 1
    message.Id = "msg-" .. self.messageCounter .. "-" .. category .. "-" .. messageType
    
    -- Add timestamp if not provided
    message.Timestamp = message.Timestamp or os.time()
    
    -- Apply overrides
    for key, value in pairs(overrides) do
        if key == "Tags" and type(value) == "table" then
            message.Tags = message.Tags or {}
            for tagKey, tagValue in pairs(value) do
                message.Tags[tagKey] = tagValue
            end
        elseif key == "Data" and type(value) == "table" then
            -- Convert table to JSON string
            message.Data = self:encodeJSON(value)
        else
            message[key] = value
        end
    end
    
    return message
end

-- Bulk Message Creation
function AOMessageFixtures:createBattleSequence(player1, player2, moves)
    moves = moves or {
        {player = player1, moveId = 85, target = 0}, -- Thunderbolt
        {player = player2, moveId = 52, target = 0}, -- Ember
        {player = player1, moveId = 85, target = 0}, -- Thunderbolt
    }
    
    local sequence = {}
    local battleId = "battle-" .. self.messageCounter
    
    -- Battle start
    table.insert(sequence, self:createMessage("battle", "battleStart", {
        From = player1,
        Tags = {
            Wallet = player1
        },
        Data = {
            opponentId = player2,
            battleType = "test",
            gameMode = "singles"
        }
    }))
    
    -- Battle moves
    for i, move in ipairs(moves) do
        table.insert(sequence, self:createMessage("battle", "battleMove", {
            From = move.player,
            Tags = {
                Wallet = move.player,
                BattleId = battleId,
                Turn = tostring(i)
            },
            Data = {
                moveId = move.moveId,
                targetSlot = move.target,
                pokemonSlot = 0,
                battleSeed = battleId .. "-seed"
            }
        }))
    end
    
    -- Battle end
    table.insert(sequence, self:createMessage("battle", "battleEnd", {
        From = "process-id",
        Tags = {
            BattleId = battleId,
            Winner = player1
        },
        Data = {
            winner = player1,
            reason = "test-complete",
            rewards = {exp = 1000, money = 300}
        }
    }))
    
    return sequence
end

function AOMessageFixtures:createAuthSequence(wallet)
    local sequence = {}
    
    -- Auth request
    table.insert(sequence, self:createMessage("auth", "authRequest", {
        From = wallet,
        Tags = {Wallet = wallet}
    }))
    
    -- Auth challenge (from process)
    table.insert(sequence, self:createMessage("auth", "authChallenge", {
        From = "process-id",
        Tags = {Target = wallet}
    }))
    
    -- Auth response
    table.insert(sequence, self:createMessage("auth", "authResponse", {
        From = wallet,
        Tags = {Wallet = wallet, ChallengeId = "challenge-123"}
    }))
    
    return sequence
end

function AOMessageFixtures:createGameSession(wallet, actions)
    actions = actions or {"save", "query", "battle", "save"}
    
    local sequence = {}
    
    for _, action in ipairs(actions) do
        if action == "save" then
            table.insert(sequence, self:createMessage("game", "saveGame", {
                From = wallet,
                Tags = {Wallet = wallet}
            }))
        elseif action == "query" then
            table.insert(sequence, self:createMessage("query", "stateQuery", {
                From = wallet,
                Tags = {Wallet = wallet}
            }))
        elseif action == "battle" then
            local battleMsgs = self:createBattleSequence(wallet, "opponent-wallet")
            for _, msg in ipairs(battleMsgs) do
                table.insert(sequence, msg)
            end
        end
    end
    
    return sequence
end

-- Validation Helpers
function AOMessageFixtures:validateMessageStructure(message)
    local errors = {}
    
    -- Required fields
    local requiredFields = {"From", "Action", "Tags", "Block-Height", "Owner"}
    
    for _, field in ipairs(requiredFields) do
        if not message[field] then
            table.insert(errors, "Missing required field: " .. field)
        end
    end
    
    -- Validate wallet address format (basic)
    if message.From and not string.match(message.From, "^[a-zA-Z0-9_-]+$") then
        table.insert(errors, "Invalid wallet address format in From field")
    end
    
    -- Validate Tags structure
    if message.Tags then
        if type(message.Tags) ~= "table" then
            table.insert(errors, "Tags must be a table")
        else
            if not message.Tags.Wallet and not message.Tags.AdminLevel then
                table.insert(errors, "Tags should contain Wallet or AdminLevel")
            end
        end
    end
    
    -- Validate JSON in Data field
    if message.Data and message.Data ~= "" then
        if string.sub(message.Data, 1, 1) == "{" or string.sub(message.Data, 1, 1) == "[" then
            -- Should be valid JSON
            local success = pcall(function()
                return self:decodeJSON(message.Data)
            end)
            if not success then
                table.insert(errors, "Invalid JSON in Data field")
            end
        end
    end
    
    return #errors == 0, errors
end

-- Utility Functions
function AOMessageFixtures:deepCopy(orig)
    local orig_type = type(orig)
    local copy
    if orig_type == 'table' then
        copy = {}
        for orig_key, orig_value in pairs(orig) do
            copy[orig_key] = self:deepCopy(orig_value)
        end
    else
        copy = orig
    end
    return copy
end

function AOMessageFixtures:encodeJSON(data)
    -- Simple JSON encoding (in real implementation, use proper JSON library)
    if type(data) == "table" then
        local parts = {}
        local isArray = true
        local maxIndex = 0
        
        -- Check if it's an array
        for k, v in pairs(data) do
            if type(k) ~= "number" then
                isArray = false
                break
            end
            maxIndex = math.max(maxIndex, k)
        end
        
        if isArray then
            -- Array format
            for i = 1, maxIndex do
                table.insert(parts, self:encodeJSON(data[i] or "null"))
            end
            return "[" .. table.concat(parts, ",") .. "]"
        else
            -- Object format
            for k, v in pairs(data) do
                table.insert(parts, '"' .. tostring(k) .. '":' .. self:encodeJSON(v))
            end
            return "{" .. table.concat(parts, ",") .. "}"
        end
    elseif type(data) == "string" then
        return '"' .. data .. '"'
    elseif type(data) == "number" then
        return tostring(data)
    elseif type(data) == "boolean" then
        return data and "true" or "false"
    else
        return "null"
    end
end

function AOMessageFixtures:decodeJSON(jsonString)
    -- Simplified JSON decode - in real implementation, use proper JSON library
    -- This is just for basic validation
    return {}
end

-- Factory Functions for Common Scenarios
function AOMessageFixtures:randomWallet()
    return "wallet-" .. math.random(100000, 999999)
end

function AOMessageFixtures:randomBattleId()
    return "battle-" .. math.random(100000, 999999)
end

function AOMessageFixtures:createRandomBattleMessage()
    local actions = {"battleStart", "battleMove", "battleSwitch"}
    local action = actions[math.random(#actions)]
    
    return self:createMessage("battle", action, {
        From = self:randomWallet(),
        Tags = {
            BattleId = self:randomBattleId(),
            Turn = tostring(math.random(1, 50))
        }
    })
end

return AOMessageFixtures