-- Type Effectiveness Chart Implementation
-- Complete type effectiveness matrix for Pokemon battle calculations
-- Based on TypeScript reference implementation for exact behavioral parity

local TypeChart = {}

-- Type effectiveness multipliers (matching TypeScript TypeDamageMultiplier values)
TypeChart.MULTIPLIERS = {
    NO_EFFECT = 0,
    EIGHTH_EFFECTIVE = 0.125,
    QUARTER_EFFECTIVE = 0.25,
    HALF_EFFECTIVE = 0.5,
    NORMAL_EFFECTIVE = 1,
    SUPER_EFFECTIVE = 2,
    DOUBLE_SUPER_EFFECTIVE = 4,
    OCTAL_SUPER_EFFECTIVE = 8
}

-- Pokemon type constants (matching TypeScript PokemonType enum)
TypeChart.TYPES = {
    UNKNOWN = -1,
    NORMAL = 0,
    FIGHTING = 1,
    FLYING = 2,
    POISON = 3,
    GROUND = 4,
    ROCK = 5,
    BUG = 6,
    GHOST = 7,
    STEEL = 8,
    FIRE = 9,
    WATER = 10,
    GRASS = 11,
    ELECTRIC = 12,
    PSYCHIC = 13,
    ICE = 14,
    DRAGON = 15,
    DARK = 16,
    FAIRY = 17,
    STELLAR = 18
}

-- Reverse lookup from type names to numbers
TypeChart.TYPE_NAMES = {}
for typeName, typeNum in pairs(TypeChart.TYPES) do
    TypeChart.TYPE_NAMES[typeNum] = typeName
end

-- Get type damage multiplier for single type matchup
-- @param attackType: Attacking type (string or number)
-- @param defType: Defending type (string or number) 
-- @return: Damage multiplier (number: 0, 0.125, 0.25, 0.5, 1, 2, 4, or 8)
function TypeChart.getTypeDamageMultiplier(attackType, defType)
    -- Convert string types to numbers if needed
    if type(attackType) == "string" then
        attackType = TypeChart.TYPES[attackType]
    end
    if type(defType) == "string" then
        defType = TypeChart.TYPES[defType]
    end
    
    -- Handle unknown types
    if attackType == TypeChart.TYPES.UNKNOWN or defType == TypeChart.TYPES.UNKNOWN then
        return TypeChart.MULTIPLIERS.NORMAL_EFFECTIVE
    end
    
    -- Type effectiveness matrix implementation
    -- Based on exact TypeScript switch statement logic from src/data/type.ts
    
    -- NORMAL defending
    if defType == TypeChart.TYPES.NORMAL then
        if attackType == TypeChart.TYPES.FIGHTING then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        elseif attackType == TypeChart.TYPES.GHOST then
            return TypeChart.MULTIPLIERS.NO_EFFECT -- 0x
        end
        
    -- FIGHTING defending  
    elseif defType == TypeChart.TYPES.FIGHTING then
        if attackType == TypeChart.TYPES.ROCK or attackType == TypeChart.TYPES.BUG or attackType == TypeChart.TYPES.DARK then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.FLYING or attackType == TypeChart.TYPES.PSYCHIC or attackType == TypeChart.TYPES.FAIRY then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- FLYING defending
    elseif defType == TypeChart.TYPES.FLYING then
        if attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.GROUND or attackType == TypeChart.TYPES.BUG or attackType == TypeChart.TYPES.GRASS then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.ROCK or attackType == TypeChart.TYPES.ELECTRIC or attackType == TypeChart.TYPES.ICE then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        elseif attackType == TypeChart.TYPES.GROUND then
            return TypeChart.MULTIPLIERS.NO_EFFECT -- 0x
        end
        
    -- POISON defending
    elseif defType == TypeChart.TYPES.POISON then
        if attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.POISON or 
           attackType == TypeChart.TYPES.BUG or attackType == TypeChart.TYPES.GRASS or attackType == TypeChart.TYPES.FAIRY then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.GROUND or attackType == TypeChart.TYPES.PSYCHIC then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- GROUND defending
    elseif defType == TypeChart.TYPES.GROUND then
        if attackType == TypeChart.TYPES.POISON or attackType == TypeChart.TYPES.ROCK then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.WATER or attackType == TypeChart.TYPES.GRASS or attackType == TypeChart.TYPES.ICE then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        elseif attackType == TypeChart.TYPES.ELECTRIC then
            return TypeChart.MULTIPLIERS.NO_EFFECT -- 0x
        end
        
    -- ROCK defending
    elseif defType == TypeChart.TYPES.ROCK then
        if attackType == TypeChart.TYPES.NORMAL or attackType == TypeChart.TYPES.FLYING or 
           attackType == TypeChart.TYPES.POISON or attackType == TypeChart.TYPES.FIRE then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.GROUND or 
               attackType == TypeChart.TYPES.STEEL or attackType == TypeChart.TYPES.WATER or attackType == TypeChart.TYPES.GRASS then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- BUG defending
    elseif defType == TypeChart.TYPES.BUG then
        if attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.GROUND or attackType == TypeChart.TYPES.GRASS then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.FLYING or attackType == TypeChart.TYPES.ROCK or attackType == TypeChart.TYPES.FIRE then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- GHOST defending
    elseif defType == TypeChart.TYPES.GHOST then
        if attackType == TypeChart.TYPES.POISON or attackType == TypeChart.TYPES.BUG then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.GHOST or attackType == TypeChart.TYPES.DARK then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        elseif attackType == TypeChart.TYPES.NORMAL or attackType == TypeChart.TYPES.FIGHTING then
            return TypeChart.MULTIPLIERS.NO_EFFECT -- 0x
        end
        
    -- STEEL defending
    elseif defType == TypeChart.TYPES.STEEL then
        if attackType == TypeChart.TYPES.NORMAL or attackType == TypeChart.TYPES.FLYING or 
           attackType == TypeChart.TYPES.ROCK or attackType == TypeChart.TYPES.BUG or 
           attackType == TypeChart.TYPES.STEEL or attackType == TypeChart.TYPES.GRASS or 
           attackType == TypeChart.TYPES.PSYCHIC or attackType == TypeChart.TYPES.ICE or 
           attackType == TypeChart.TYPES.DRAGON or attackType == TypeChart.TYPES.FAIRY then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.GROUND or attackType == TypeChart.TYPES.FIRE then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        elseif attackType == TypeChart.TYPES.POISON then
            return TypeChart.MULTIPLIERS.NO_EFFECT -- 0x
        end
        
    -- FIRE defending
    elseif defType == TypeChart.TYPES.FIRE then
        if attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.FIRE or 
           attackType == TypeChart.TYPES.GRASS or attackType == TypeChart.TYPES.ICE or 
           attackType == TypeChart.TYPES.BUG or attackType == TypeChart.TYPES.STEEL or attackType == TypeChart.TYPES.FAIRY then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.GROUND or attackType == TypeChart.TYPES.ROCK or attackType == TypeChart.TYPES.WATER then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- WATER defending
    elseif defType == TypeChart.TYPES.WATER then
        if attackType == TypeChart.TYPES.STEEL or attackType == TypeChart.TYPES.FIRE or 
           attackType == TypeChart.TYPES.WATER or attackType == TypeChart.TYPES.ICE then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.GRASS or attackType == TypeChart.TYPES.ELECTRIC then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- GRASS defending  
    elseif defType == TypeChart.TYPES.GRASS then
        if attackType == TypeChart.TYPES.GROUND or attackType == TypeChart.TYPES.WATER or 
           attackType == TypeChart.TYPES.GRASS or attackType == TypeChart.TYPES.ELECTRIC then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.FLYING or attackType == TypeChart.TYPES.POISON or 
               attackType == TypeChart.TYPES.BUG or attackType == TypeChart.TYPES.FIRE or attackType == TypeChart.TYPES.ICE then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- ELECTRIC defending
    elseif defType == TypeChart.TYPES.ELECTRIC then
        if attackType == TypeChart.TYPES.FLYING or attackType == TypeChart.TYPES.STEEL or attackType == TypeChart.TYPES.ELECTRIC then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.GROUND then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- PSYCHIC defending
    elseif defType == TypeChart.TYPES.PSYCHIC then
        if attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.PSYCHIC then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.BUG or attackType == TypeChart.TYPES.GHOST or attackType == TypeChart.TYPES.DARK then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- ICE defending
    elseif defType == TypeChart.TYPES.ICE then
        if attackType == TypeChart.TYPES.ICE then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.ROCK or 
               attackType == TypeChart.TYPES.STEEL or attackType == TypeChart.TYPES.FIRE then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- DRAGON defending
    elseif defType == TypeChart.TYPES.DRAGON then
        if attackType == TypeChart.TYPES.FIRE or attackType == TypeChart.TYPES.WATER or 
           attackType == TypeChart.TYPES.ELECTRIC or attackType == TypeChart.TYPES.GRASS then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.ICE or attackType == TypeChart.TYPES.DRAGON or attackType == TypeChart.TYPES.FAIRY then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        end
        
    -- DARK defending
    elseif defType == TypeChart.TYPES.DARK then
        if attackType == TypeChart.TYPES.GHOST or attackType == TypeChart.TYPES.DARK then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.BUG or attackType == TypeChart.TYPES.FAIRY then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        elseif attackType == TypeChart.TYPES.PSYCHIC then
            return TypeChart.MULTIPLIERS.NO_EFFECT -- 0x
        end
        
    -- FAIRY defending
    elseif defType == TypeChart.TYPES.FAIRY then
        if attackType == TypeChart.TYPES.FIGHTING or attackType == TypeChart.TYPES.BUG or attackType == TypeChart.TYPES.DARK then
            return TypeChart.MULTIPLIERS.HALF_EFFECTIVE -- 0.5x
        elseif attackType == TypeChart.TYPES.POISON or attackType == TypeChart.TYPES.STEEL then
            return TypeChart.MULTIPLIERS.SUPER_EFFECTIVE -- 2x
        elseif attackType == TypeChart.TYPES.DRAGON then
            return TypeChart.MULTIPLIERS.NO_EFFECT -- 0x
        end
        
    -- STELLAR defending (special case)
    elseif defType == TypeChart.TYPES.STELLAR then
        -- Stellar type has special handling in battle context
        return TypeChart.MULTIPLIERS.NORMAL_EFFECTIVE -- 1x (will be modified by Terastalization logic)
    end
    
    -- Default case - normal effectiveness
    return TypeChart.MULTIPLIERS.NORMAL_EFFECTIVE -- 1x
end

-- Calculate attack type effectiveness against Pokemon with potentially multiple types
-- @param attackType: Attacking type (string or number)
-- @param defendingTypes: Array of defending types or single type
-- @return: Final damage multiplier after applying all type interactions
function TypeChart.getAttackTypeEffectiveness(attackType, defendingTypes)
    -- Handle single type Pokemon (convert to array)
    if type(defendingTypes) ~= "table" then
        defendingTypes = {defendingTypes}
    end
    
    -- Calculate effectiveness against each defending type and multiply together
    local finalMultiplier = TypeChart.MULTIPLIERS.NORMAL_EFFECTIVE
    
    for _, defType in ipairs(defendingTypes) do
        local typeMultiplier = TypeChart.getTypeDamageMultiplier(attackType, defType)
        finalMultiplier = finalMultiplier * typeMultiplier
    end
    
    return finalMultiplier
end

-- Check if attack type is super effective against defending types
-- @param attackType: Attacking type
-- @param defendingTypes: Array of defending types or single type
-- @return: Boolean indicating if attack is super effective (> 1x)
function TypeChart.isSuperEffective(attackType, defendingTypes)
    local effectiveness = TypeChart.getAttackTypeEffectiveness(attackType, defendingTypes)
    return effectiveness > TypeChart.MULTIPLIERS.NORMAL_EFFECTIVE
end

-- Check if attack type is not very effective against defending types
-- @param attackType: Attacking type
-- @param defendingTypes: Array of defending types or single type
-- @return: Boolean indicating if attack is not very effective (< 1x but > 0x)
function TypeChart.isNotVeryEffective(attackType, defendingTypes)
    local effectiveness = TypeChart.getAttackTypeEffectiveness(attackType, defendingTypes)
    return effectiveness > TypeChart.MULTIPLIERS.NO_EFFECT and effectiveness < TypeChart.MULTIPLIERS.NORMAL_EFFECTIVE
end

-- Check if attack has no effect against defending types
-- @param attackType: Attacking type
-- @param defendingTypes: Array of defending types or single type
-- @return: Boolean indicating if attack has no effect (0x)
function TypeChart.hasNoEffect(attackType, defendingTypes)
    local effectiveness = TypeChart.getAttackTypeEffectiveness(attackType, defendingTypes)
    return effectiveness == TypeChart.MULTIPLIERS.NO_EFFECT
end

-- Get effectiveness description text
-- @param attackType: Attacking type
-- @param defendingTypes: Array of defending types or single type
-- @return: String description of effectiveness
function TypeChart.getEffectivenessDescription(attackType, defendingTypes)
    local effectiveness = TypeChart.getAttackTypeEffectiveness(attackType, defendingTypes)
    
    if effectiveness == TypeChart.MULTIPLIERS.NO_EFFECT then
        return "No effect"
    elseif effectiveness == TypeChart.MULTIPLIERS.QUARTER_EFFECTIVE then
        return "Very not very effective"
    elseif effectiveness == TypeChart.MULTIPLIERS.HALF_EFFECTIVE then
        return "Not very effective"
    elseif effectiveness == TypeChart.MULTIPLIERS.NORMAL_EFFECTIVE then
        return "Normal effectiveness"
    elseif effectiveness == TypeChart.MULTIPLIERS.SUPER_EFFECTIVE then
        return "Super effective"
    elseif effectiveness == TypeChart.MULTIPLIERS.DOUBLE_SUPER_EFFECTIVE then
        return "Very super effective"
    else
        return string.format("%.3fx effective", effectiveness)
    end
end

return TypeChart