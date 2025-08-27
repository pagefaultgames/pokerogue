-- resource-validator.lua: Resource and Inventory Validation
-- Validates inventory limits, currency caps, and resource management

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

-- Validate inventory limits for item addition
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

-- Validate currency transactions
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

-- Validate Pokemon storage operations
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

-- Validate trade operations
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

-- Validate overall resource caps
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

-- Get resource validation error information
function ResourceValidator.getErrorInfo(errorCode)
    local errorMessages = {
        [RESOURCE_ERRORS.INVENTORY_LIMIT_EXCEEDED] = "Inventory limit validation failed",
        [RESOURCE_ERRORS.CURRENCY_CAP_EXCEEDED] = "Currency cap validation failed",
        [RESOURCE_ERRORS.POKEMON_STORAGE_FULL] = "Pokemon storage validation failed",
        [RESOURCE_ERRORS.INVALID_TRADE] = "Trade validation failed",
        [RESOURCE_ERRORS.RESOURCE_UNDERFLOW] = "Resource underflow validation failed"
    }
    
    return {
        code = errorCode,
        message = errorMessages[errorCode] or "Unknown resource validation error",
        category = "RESOURCE"
    }
end

return ResourceValidator