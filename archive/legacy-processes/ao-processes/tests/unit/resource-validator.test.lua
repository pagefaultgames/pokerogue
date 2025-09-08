-- resource-validator.test.lua: Unit tests for Resource and Inventory Validation

-- Load the validation handler and create mock resource validator
package.path = package.path .. ";../../?.lua;../../handlers/?.lua;../../game-logic/pokemon/?.lua"

-- Mock resource validator for testing (would normally be a separate module)
local ResourceValidator = {}

-- Constants
local RESOURCE_ERRORS = {
    INVENTORY_LIMIT_EXCEEDED = "RES_001",
    CURRENCY_CAP_EXCEEDED = "RES_002",
    POKEMON_STORAGE_FULL = "RES_003",
    INVALID_TRADE = "RES_004",
    RESOURCE_UNDERFLOW = "RES_005"
}

local RESOURCE_LIMITS = {
    MAX_INVENTORY_ITEMS = 999,
    MAX_CURRENCY = 999999,
    MAX_PARTY_SIZE = 6,
    MAX_PC_STORAGE = 720, -- 24 boxes * 30 Pokemon per box
    MAX_ITEM_STACK = 99
}

function ResourceValidator.validateInventoryLimits(playerInventory, itemId, quantity)
    if not playerInventory or not itemId or not quantity then
        error({
            code = RESOURCE_ERRORS.INVENTORY_LIMIT_EXCEEDED,
            message = "Player inventory, item ID and quantity required",
            success = false
        })
    end
    
    if quantity <= 0 then
        error({
            code = RESOURCE_ERRORS.RESOURCE_UNDERFLOW,
            message = "Item quantity must be positive",
            success = false
        })
    end
    
    -- Check current item count
    local currentCount = playerInventory[itemId] or 0
    local newCount = currentCount + quantity
    
    if newCount > RESOURCE_LIMITS.MAX_ITEM_STACK then
        error({
            code = RESOURCE_ERRORS.INVENTORY_LIMIT_EXCEEDED,
            message = string.format("Item stack limit exceeded: %d (max %d)", newCount, RESOURCE_LIMITS.MAX_ITEM_STACK),
            success = false
        })
    end
    
    -- Check total inventory slots
    local totalItems = 0
    for _, count in pairs(playerInventory) do
        totalItems = totalItems + count
    end
    
    if totalItems + quantity > RESOURCE_LIMITS.MAX_INVENTORY_ITEMS then
        error({
            code = RESOURCE_ERRORS.INVENTORY_LIMIT_EXCEEDED,
            message = "Total inventory limit exceeded",
            success = false
        })
    end
    
    return true
end

function ResourceValidator.validateCurrencyTransaction(playerData, amount, transactionType)
    if not playerData or not amount or not transactionType then
        error({
            code = RESOURCE_ERRORS.CURRENCY_CAP_EXCEEDED,
            message = "Player data, amount and transaction type required",
            success = false
        })
    end
    
    local currentCurrency = playerData.currency or 0
    
    if transactionType == "spend" then
        if amount > currentCurrency then
            error({
                code = RESOURCE_ERRORS.RESOURCE_UNDERFLOW,
                message = "Insufficient currency for transaction",
                success = false
            })
        end
        
        if amount <= 0 then
            error({
                code = RESOURCE_ERRORS.RESOURCE_UNDERFLOW,
                message = "Spend amount must be positive",
                success = false
            })
        end
    elseif transactionType == "earn" then
        if amount <= 0 then
            error({
                code = RESOURCE_ERRORS.CURRENCY_CAP_EXCEEDED,
                message = "Earn amount must be positive", 
                success = false
            })
        end
        
        local newCurrency = currentCurrency + amount
        if newCurrency > RESOURCE_LIMITS.MAX_CURRENCY then
            error({
                code = RESOURCE_ERRORS.CURRENCY_CAP_EXCEEDED,
                message = "Currency cap exceeded",
                success = false
            })
        end
    else
        error({
            code = RESOURCE_ERRORS.CURRENCY_CAP_EXCEEDED,
            message = "Invalid transaction type",
            success = false
        })
    end
    
    return true
end

function ResourceValidator.validatePokemonStorage(playerData, pokemonData, storageAction)
    if not playerData or not pokemonData or not storageAction then
        error({
            code = RESOURCE_ERRORS.POKEMON_STORAGE_FULL,
            message = "Player data, Pokemon data and storage action required",
            success = false
        })
    end
    
    if storageAction == "add_to_party" then
        local partySize = playerData.party and #playerData.party or 0
        if partySize >= RESOURCE_LIMITS.MAX_PARTY_SIZE then
            error({
                code = RESOURCE_ERRORS.POKEMON_STORAGE_FULL,
                message = "Party is full",
                success = false
            })
        end
    elseif storageAction == "add_to_pc" then
        local pcCount = 0
        if playerData.pc then
            for _, box in pairs(playerData.pc) do
                if box then
                    pcCount = pcCount + #box
                end
            end
        end
        
        if pcCount >= RESOURCE_LIMITS.MAX_PC_STORAGE then
            error({
                code = RESOURCE_ERRORS.POKEMON_STORAGE_FULL,
                message = "PC storage is full",
                success = false
            })
        end
    else
        error({
            code = RESOURCE_ERRORS.POKEMON_STORAGE_FULL,
            message = "Invalid storage action",
            success = false
        })
    end
    
    return true
end

function ResourceValidator.validateTradeOperation(playerData, tradePartnerData, tradeOffer)
    if not playerData or not tradePartnerData or not tradeOffer then
        error({
            code = RESOURCE_ERRORS.INVALID_TRADE,
            message = "Player data, trade partner data and trade offer required",
            success = false
        })
    end
    
    -- Validate player has offered Pokemon
    if tradeOffer.playerPokemonIndex then
        local party = playerData.party or {}
        if tradeOffer.playerPokemonIndex > #party or tradeOffer.playerPokemonIndex < 1 then
            error({
                code = RESOURCE_ERRORS.INVALID_TRADE,
                message = "Invalid Pokemon index for trade",
                success = false
            })
        end
    end
    
    -- Validate trade partner has offered Pokemon
    if tradeOffer.partnerPokemonIndex then
        local partnerParty = tradePartnerData.party or {}
        if tradeOffer.partnerPokemonIndex > #partnerParty or tradeOffer.partnerPokemonIndex < 1 then
            error({
                code = RESOURCE_ERRORS.INVALID_TRADE,
                message = "Invalid partner Pokemon index for trade",
                success = false
            })
        end
    end
    
    -- Check if both parties have space for the trade
    local playerPartySize = playerData.party and #playerData.party or 0
    local partnerPartySize = tradePartnerData.party and #tradePartnerData.party or 0
    
    -- This is simplified - in reality would check for swaps vs additions
    if playerPartySize >= RESOURCE_LIMITS.MAX_PARTY_SIZE then
        error({
            code = RESOURCE_ERRORS.INVALID_TRADE,
            message = "Player party is full for trade",
            success = false
        })
    end
    
    return true
end

function ResourceValidator.validateResourceCaps(playerData)
    if not playerData then
        error({
            code = RESOURCE_ERRORS.RESOURCE_UNDERFLOW,
            message = "Player data required for resource validation",
            success = false
        })
    end
    
    -- Validate currency cap
    local currency = playerData.currency or 0
    if currency > RESOURCE_LIMITS.MAX_CURRENCY then
        error({
            code = RESOURCE_ERRORS.CURRENCY_CAP_EXCEEDED,
            message = "Player currency exceeds maximum allowed",
            success = false
        })
    end
    
    if currency < 0 then
        error({
            code = RESOURCE_ERRORS.RESOURCE_UNDERFLOW,
            message = "Player currency cannot be negative",
            success = false
        })
    end
    
    -- Validate party size
    local partySize = playerData.party and #playerData.party or 0
    if partySize > RESOURCE_LIMITS.MAX_PARTY_SIZE then
        error({
            code = RESOURCE_ERRORS.POKEMON_STORAGE_FULL,
            message = "Party size exceeds maximum allowed",
            success = false
        })
    end
    
    -- Validate inventory totals
    if playerData.inventory then
        local totalItems = 0
        for itemId, count in pairs(playerData.inventory) do
            if count > RESOURCE_LIMITS.MAX_ITEM_STACK then
                error({
                    code = RESOURCE_ERRORS.INVENTORY_LIMIT_EXCEEDED,
                    message = string.format("Item %s exceeds stack limit", itemId),
                    success = false
                })
            end
            totalItems = totalItems + count
        end
        
        if totalItems > RESOURCE_LIMITS.MAX_INVENTORY_ITEMS then
            error({
                code = RESOURCE_ERRORS.INVENTORY_LIMIT_EXCEEDED,
                message = "Total inventory exceeds maximum allowed",
                success = false
            })
        end
    end
    
    return true
end

-- Simple test framework
local TestRunner = {
    tests = {},
    passed = 0,
    failed = 0
}

function TestRunner.test(name, testFunc)
    table.insert(TestRunner.tests, {name = name, func = testFunc})
end

function TestRunner.run()
    print("Running ResourceValidator Tests...")
    print("=" .. string.rep("=", 50))
    
    for _, test in ipairs(TestRunner.tests) do
        local success, error = pcall(test.func)
        if success then
            print("✓ " .. test.name)
            TestRunner.passed = TestRunner.passed + 1
        else
            print("✗ " .. test.name .. " - " .. tostring(error))
            TestRunner.failed = TestRunner.failed + 1
        end
    end
    
    print("=" .. string.rep("=", 50))
    print(string.format("Results: %d passed, %d failed", TestRunner.passed, TestRunner.failed))
    return TestRunner.failed == 0
end

function TestRunner.assert(condition, message)
    if not condition then
        error(message or "Assertion failed")
    end
end

function TestRunner.assertError(func, expectedErrorCode, message)
    local success, err = pcall(func)
    TestRunner.assert(not success, message or "Expected function to throw error")
    if type(err) == "table" and err.code then
        TestRunner.assert(err.code == expectedErrorCode, 
            string.format("Expected error code %s, got %s", expectedErrorCode, err.code))
    else
        error(string.format("Expected error object with code %s, got %s", expectedErrorCode, type(err)))
    end
end

-- Test Cases

-- Inventory Validation Tests
TestRunner.test("validateInventoryLimits - valid addition", function()
    local inventory = {pokeball = 10, potion = 5}
    local result = ResourceValidator.validateInventoryLimits(inventory, "pokeball", 20)
    TestRunner.assert(result == true, "Should allow valid item addition")
end)

TestRunner.test("validateInventoryLimits - stack limit exceeded", function()
    local inventory = {pokeball = 95}
    TestRunner.assertError(function()
        ResourceValidator.validateInventoryLimits(inventory, "pokeball", 10)  -- Would be 105 total
    end, "RES_001", "Should reject stack limit exceeded")
end)

TestRunner.test("validateInventoryLimits - negative quantity", function()
    local inventory = {pokeball = 10}
    TestRunner.assertError(function()
        ResourceValidator.validateInventoryLimits(inventory, "pokeball", -5)
    end, "RES_005", "Should reject negative quantities")
end)

-- Currency Validation Tests
TestRunner.test("validateCurrencyTransaction - valid spending", function()
    local playerData = {currency = 1000}
    local result = ResourceValidator.validateCurrencyTransaction(playerData, 500, "spend")
    TestRunner.assert(result == true, "Should allow valid spending")
end)

TestRunner.test("validateCurrencyTransaction - insufficient funds", function()
    local playerData = {currency = 100}
    TestRunner.assertError(function()
        ResourceValidator.validateCurrencyTransaction(playerData, 500, "spend")
    end, "RES_005", "Should reject insufficient funds")
end)

TestRunner.test("validateCurrencyTransaction - valid earning", function()
    local playerData = {currency = 1000}
    local result = ResourceValidator.validateCurrencyTransaction(playerData, 500, "earn")
    TestRunner.assert(result == true, "Should allow valid earning")
end)

TestRunner.test("validateCurrencyTransaction - currency cap exceeded", function()
    local playerData = {currency = 999000}
    TestRunner.assertError(function()
        ResourceValidator.validateCurrencyTransaction(playerData, 5000, "earn")  -- Would exceed 999999
    end, "RES_002", "Should reject currency cap exceeded")
end)

TestRunner.test("validateCurrencyTransaction - invalid transaction type", function()
    local playerData = {currency = 1000}
    TestRunner.assertError(function()
        ResourceValidator.validateCurrencyTransaction(playerData, 500, "invalid")
    end, "RES_002", "Should reject invalid transaction type")
end)

-- Pokemon Storage Validation Tests
TestRunner.test("validatePokemonStorage - add to party valid", function()
    local playerData = {
        party = {
            {species = "pikachu"},
            {species = "charmander"}
        }
    }
    local pokemon = {species = "squirtle"}
    local result = ResourceValidator.validatePokemonStorage(playerData, pokemon, "add_to_party")
    TestRunner.assert(result == true, "Should allow adding Pokemon to party with space")
end)

TestRunner.test("validatePokemonStorage - party full", function()
    local playerData = {
        party = {
            {species = "pikachu"},
            {species = "charmander"},
            {species = "squirtle"},
            {species = "bulbasaur"},
            {species = "caterpie"},
            {species = "weedle"}  -- 6 Pokemon = full party
        }
    }
    local pokemon = {species = "pidgey"}
    TestRunner.assertError(function()
        ResourceValidator.validatePokemonStorage(playerData, pokemon, "add_to_party")
    end, "RES_003", "Should reject adding to full party")
end)

TestRunner.test("validatePokemonStorage - add to PC valid", function()
    local playerData = {
        pc = {
            box1 = {{species = "pikachu"}},  -- PC with some space
            box2 = {}
        }
    }
    local pokemon = {species = "charmander"}
    local result = ResourceValidator.validatePokemonStorage(playerData, pokemon, "add_to_pc")
    TestRunner.assert(result == true, "Should allow adding Pokemon to PC with space")
end)

-- Trade Validation Tests
TestRunner.test("validateTradeOperation - valid trade", function()
    local playerData = {
        party = {
            {species = "pikachu"},
            {species = "charmander"}
        }
    }
    local partnerData = {
        party = {
            {species = "squirtle"}
        }
    }
    local tradeOffer = {
        playerPokemonIndex = 1,
        partnerPokemonIndex = 1
    }
    local result = ResourceValidator.validateTradeOperation(playerData, partnerData, tradeOffer)
    TestRunner.assert(result == true, "Should allow valid trade")
end)

TestRunner.test("validateTradeOperation - invalid player Pokemon index", function()
    local playerData = {
        party = {
            {species = "pikachu"}
        }
    }
    local partnerData = {
        party = {
            {species = "squirtle"}
        }
    }
    local tradeOffer = {
        playerPokemonIndex = 5,  -- Out of range
        partnerPokemonIndex = 1
    }
    TestRunner.assertError(function()
        ResourceValidator.validateTradeOperation(playerData, partnerData, tradeOffer)
    end, "RES_004", "Should reject invalid Pokemon index")
end)

-- Resource Caps Validation Tests
TestRunner.test("validateResourceCaps - valid player data", function()
    local playerData = {
        currency = 50000,
        party = {
            {species = "pikachu"},
            {species = "charmander"}
        },
        inventory = {
            pokeball = 50,
            potion = 20
        }
    }
    local result = ResourceValidator.validateResourceCaps(playerData)
    TestRunner.assert(result == true, "Should validate valid player resource caps")
end)

TestRunner.test("validateResourceCaps - currency exceeds cap", function()
    local playerData = {
        currency = 1500000  -- Over 999999 limit
    }
    TestRunner.assertError(function()
        ResourceValidator.validateResourceCaps(playerData)
    end, "RES_002", "Should reject currency over cap")
end)

TestRunner.test("validateResourceCaps - negative currency", function()
    local playerData = {
        currency = -100
    }
    TestRunner.assertError(function()
        ResourceValidator.validateResourceCaps(playerData)
    end, "RES_005", "Should reject negative currency")
end)

TestRunner.test("validateResourceCaps - party size exceeds limit", function()
    local playerData = {
        party = {
            {species = "pikachu"},
            {species = "charmander"},
            {species = "squirtle"},
            {species = "bulbasaur"},
            {species = "caterpie"},
            {species = "weedle"},
            {species = "pidgey"}  -- 7 Pokemon = over limit
        }
    }
    TestRunner.assertError(function()
        ResourceValidator.validateResourceCaps(playerData)
    end, "RES_003", "Should reject party size over limit")
end)

TestRunner.test("validateResourceCaps - item stack exceeds limit", function()
    local playerData = {
        inventory = {
            pokeball = 150  -- Over 99 limit
        }
    }
    TestRunner.assertError(function()
        ResourceValidator.validateResourceCaps(playerData)
    end, "RES_001", "Should reject item stack over limit")
end)

-- Run all tests
return TestRunner.run()