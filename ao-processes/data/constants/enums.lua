-- Game Enums and Constants
-- Complete enum definitions matching TypeScript reference implementation
-- Provides centralized constants for species, types, abilities, and game mechanics

local Enums = {}

-- Pokemon Type Enumeration (matching TypeScript PokemonType enum)
Enums.PokemonType = {
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

-- Reverse lookup for type numbers to names
Enums.PokemonTypeName = {}
for typeName, typeNum in pairs(Enums.PokemonType) do
    Enums.PokemonTypeName[typeNum] = typeName
end

-- Species ID Enumeration (matching TypeScript SpeciesId enum)
-- Starting with Generation 1 Pokemon, expandable to full 800+ species
Enums.SpeciesId = {
    -- Generation 1
    BULBASAUR = 1,
    IVYSAUR = 2,
    VENUSAUR = 3,
    CHARMANDER = 4,
    CHARMELEON = 5,
    CHARIZARD = 6,
    SQUIRTLE = 7,
    WARTORTLE = 8,
    BLASTOISE = 9,
    CATERPIE = 10,
    METAPOD = 11,
    BUTTERFREE = 12,
    WEEDLE = 13,
    KAKUNA = 14,
    BEEDRILL = 15,
    PIDGEY = 16,
    PIDGEOTTO = 17,
    PIDGEOT = 18,
    RATTATA = 19,
    RATICATE = 20,
    SPEAROW = 21,
    FEAROW = 22,
    EKANS = 23,
    ARBOK = 24,
    PIKACHU = 25,
    RAICHU = 26,
    SANDSHREW = 27,
    SANDSLASH = 28,
    NIDORAN_F = 29,
    NIDORINA = 30,
    NIDOQUEEN = 31,
    NIDORAN_M = 32,
    NIDORINO = 33,
    NIDOKING = 34,
    CLEFAIRY = 35,
    CLEFABLE = 36,
    VULPIX = 37,
    NINETALES = 38,
    JIGGLYPUFF = 39,
    WIGGLYTUFF = 40,
    ZUBAT = 41,
    GOLBAT = 42,
    ODDISH = 43,
    GLOOM = 44,
    VILEPLUME = 45,
    PARAS = 46,
    PARASECT = 47,
    VENONAT = 48,
    VENOMOTH = 49,
    DIGLETT = 50,
    DUGTRIO = 51,
    MEOWTH = 52,
    PERSIAN = 53,
    PSYDUCK = 54,
    GOLDUCK = 55,
    MANKEY = 56,
    PRIMEAPE = 57,
    GROWLITHE = 58,
    ARCANINE = 59,
    POLIWAG = 60,
    POLIWHIRL = 61,
    POLIWRATH = 62,
    ABRA = 63,
    KADABRA = 64,
    ALAKAZAM = 65,
    MACHOP = 66,
    MACHOKE = 67,
    MACHAMP = 68,
    BELLSPROUT = 69,
    WEEPINBELL = 70,
    VICTREEBEL = 71,
    TENTACOOL = 72,
    TENTACRUEL = 73,
    GEODUDE = 74,
    GRAVELER = 75,
    GOLEM = 76,
    PONYTA = 77,
    RAPIDASH = 78,
    SLOWPOKE = 79,
    SLOWBRO = 80,
    MAGNEMITE = 81,
    MAGNETON = 82,
    FARFETCHD = 83,
    DODUO = 84,
    DODRIO = 85,
    SEEL = 86,
    DEWGONG = 87,
    GRIMER = 88,
    MUK = 89,
    SHELLDER = 90,
    CLOYSTER = 91,
    GASTLY = 92,
    HAUNTER = 93,
    GENGAR = 94,
    ONIX = 95,
    DROWZEE = 96,
    HYPNO = 97,
    KRABBY = 98,
    KINGLER = 99,
    VOLTORB = 100,
    ELECTRODE = 101,
    EXEGGCUTE = 102,
    EXEGGUTOR = 103,
    CUBONE = 104,
    MAROWAK = 105,
    HITMONLEE = 106,
    HITMONCHAN = 107,
    LICKITUNG = 108,
    KOFFING = 109,
    WEEZING = 110,
    RHYHORN = 111,
    RHYDON = 112,
    CHANSEY = 113,
    TANGELA = 114,
    KANGASKHAN = 115,
    HORSEA = 116,
    SEADRA = 117,
    GOLDEEN = 118,
    SEAKING = 119,
    STARYU = 120,
    STARMIE = 121,
    MR_MIME = 122,
    SCYTHER = 123,
    JYNX = 124,
    ELECTABUZZ = 125,
    MAGMAR = 126,
    PINSIR = 127,
    TAUROS = 128,
    MAGIKARP = 129,
    GYARADOS = 130,
    LAPRAS = 131,
    DITTO = 132,
    EEVEE = 133,
    VAPOREON = 134,
    JOLTEON = 135,
    FLAREON = 136,
    PORYGON = 137,
    OMANYTE = 138,
    OMASTAR = 139,
    KABUTO = 140,
    KABUTOPS = 141,
    AERODACTYL = 142,
    SNORLAX = 143,
    ARTICUNO = 144,
    ZAPDOS = 145,
    MOLTRES = 146,
    DRATINI = 147,
    DRAGONAIR = 148,
    DRAGONITE = 149,
    MEWTWO = 150,
    MEW = 151,
    
    -- Note: Additional generations and regional variants would continue here
    -- Regional variants typically use ranges:
    -- Alolan variants: 2000+
    -- Galarian variants: 4000+
    -- Hisuian variants: 6000+
    -- Paldean variants: 8000+
}

-- Reverse lookup for species IDs to names
Enums.SpeciesName = {}
for speciesName, speciesId in pairs(Enums.SpeciesId) do
    Enums.SpeciesName[speciesId] = speciesName
end

-- Base Stat Enumeration (matching TypeScript Stat enum)
Enums.Stat = {
    HP = 0,
    ATK = 1,
    DEF = 2,
    SPATK = 3,
    SPDEF = 4,
    SPD = 5,
    ACC = 6,    -- Battle-only stat (accuracy)
    EVA = 7     -- Battle-only stat (evasion)
}

-- Permanent stats used in base stat calculations (excludes ACC/EVA)
Enums.PERMANENT_STATS = {
    Enums.Stat.HP,
    Enums.Stat.ATK,
    Enums.Stat.DEF,
    Enums.Stat.SPATK,
    Enums.Stat.SPDEF,
    Enums.Stat.SPD
}

-- Growth Rate Enumeration (matching TypeScript GrowthRate enum)
Enums.GrowthRate = {
    ERRATIC = 0,
    FAST = 1,
    MEDIUM_FAST = 2,
    MEDIUM_SLOW = 3,
    SLOW = 4,
    FLUCTUATING = 5
}

-- Ability ID Enumeration (partial list for foundational structure)
-- Full implementation would include all 200+ abilities
Enums.AbilityId = {
    NONE = 0,
    STENCH = 1,
    DRIZZLE = 2,
    SPEED_BOOST = 3,
    BATTLE_ARMOR = 4,
    STURDY = 5,
    DAMP = 6,
    LIMBER = 7,
    SAND_VEIL = 8,
    STATIC = 9,
    VOLT_ABSORB = 10,
    WATER_ABSORB = 11,
    OBLIVIOUS = 12,
    CLOUD_NINE = 13,
    COMPOUND_EYES = 14,
    INSOMNIA = 15,
    COLOR_CHANGE = 16,
    IMMUNITY = 17,
    FLASH_FIRE = 18,
    SHIELD_DUST = 19,
    OWN_TEMPO = 20,
    SUCTION_CUPS = 21,
    INTIMIDATE = 22,
    SHADOW_TAG = 23,
    ROUGH_SKIN = 24,
    WONDER_GUARD = 25,
    LEVITATE = 26,
    EFFECT_SPORE = 27,
    SYNCHRONIZE = 28,
    CLEAR_BODY = 29,
    NATURAL_CURE = 30,
    LIGHTNING_ROD = 31,
    SERENE_GRACE = 32,
    SWIFT_SWIM = 33,
    CHLOROPHYLL = 34,
    ILLUMINATE = 35,
    TRACE = 36,
    HUGE_POWER = 37,
    POISON_POINT = 38,
    INNER_FOCUS = 39,
    MAGMA_ARMOR = 40,
    WATER_VEIL = 41,
    MAGNET_PULL = 42,
    SOUNDPROOF = 43,
    RAIN_DISH = 44,
    SAND_STREAM = 45,
    PRESSURE = 46,
    THICK_FAT = 47,
    EARLY_BIRD = 48,
    FLAME_BODY = 49,
    RUN_AWAY = 50,
    KEEN_EYE = 51,
    HYPER_CUTTER = 52,
    PICKUP = 53,
    TRUANT = 54,
    HUSTLE = 55,
    CUTE_CHARM = 56,
    PLUS = 57,
    MINUS = 58,
    FORECAST = 59,
    STICKY_HOLD = 60,
    SHED_SKIN = 61,
    GUTS = 62,
    MARVEL_SCALE = 63,
    LIQUID_OOZE = 64,
    OVERGROW = 65,
    BLAZE = 66,
    TORRENT = 67,
    SWARM = 68,
    ROCK_HEAD = 69,
    DROUGHT = 70,
    ARENA_TRAP = 71,
    VITAL_SPIRIT = 72,
    WHITE_SMOKE = 73,
    PURE_POWER = 74,
    SHELL_ARMOR = 75,
    AIR_LOCK = 76,
    SOLAR_POWER = 77
    
    -- Note: Full ability list would continue with all abilities through modern generations
}

-- Move Category Enumeration (for move system integration)
Enums.MoveCategory = {
    PHYSICAL = 0,
    SPECIAL = 1,
    STATUS = 2
}

-- Nature Enumeration (for stat calculations)
Enums.Nature = {
    HARDY = 0,
    LONELY = 1,
    BRAVE = 2,
    ADAMANT = 3,
    NAUGHTY = 4,
    BOLD = 5,
    DOCILE = 6,
    RELAXED = 7,
    IMPISH = 8,
    LAX = 9,
    TIMID = 10,
    HASTY = 11,
    SERIOUS = 12,
    JOLLY = 13,
    NAIVE = 14,
    MODEST = 15,
    MILD = 16,
    QUIET = 17,
    BASHFUL = 18,
    RASH = 19,
    CALM = 20,
    GENTLE = 21,
    SASSY = 22,
    CAREFUL = 23,
    QUIRKY = 24
}

-- Utility functions for enum operations

-- Get type name from type ID
-- @param typeId: Type ID number
-- @return: Type name string or "UNKNOWN"
function Enums.getTypeName(typeId)
    return Enums.PokemonTypeName[typeId] or "UNKNOWN"
end

-- Get type ID from type name
-- @param typeName: Type name string
-- @return: Type ID number or -1 for unknown
function Enums.getTypeId(typeName)
    return Enums.PokemonType[string.upper(typeName)] or Enums.PokemonType.UNKNOWN
end

-- Get species name from species ID
-- @param speciesId: Species ID number
-- @return: Species name string or "UNKNOWN"
function Enums.getSpeciesName(speciesId)
    return Enums.SpeciesName[speciesId] or "UNKNOWN"
end

-- Get species ID from species name
-- @param speciesName: Species name string
-- @return: Species ID number or nil if not found
function Enums.getSpeciesId(speciesName)
    return Enums.SpeciesId[string.upper(speciesName)]
end

-- Check if a type is valid
-- @param typeId: Type ID to validate
-- @return: Boolean indicating if type exists
function Enums.isValidType(typeId)
    return Enums.PokemonTypeName[typeId] ~= nil
end

-- Check if a species is valid
-- @param speciesId: Species ID to validate
-- @return: Boolean indicating if species exists
function Enums.isValidSpecies(speciesId)
    return Enums.SpeciesName[speciesId] ~= nil
end

-- Get all valid type IDs
-- @return: Array of all valid type IDs
function Enums.getAllTypeIds()
    local types = {}
    for _, typeId in pairs(Enums.PokemonType) do
        if typeId >= 0 then -- Exclude UNKNOWN (-1)
            table.insert(types, typeId)
        end
    end
    table.sort(types)
    return types
end

-- Get all valid species IDs
-- @return: Array of all valid species IDs
function Enums.getAllSpeciesIds()
    local species = {}
    for _, speciesId in pairs(Enums.SpeciesId) do
        table.insert(species, speciesId)
    end
    table.sort(species)
    return species
end

-- Gender enumeration for Pokemon
Enums.Gender = {
    GENDERLESS = 0,
    MALE = 1,
    FEMALE = 2,
    UNKNOWN = -1
}

return Enums