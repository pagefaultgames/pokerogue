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
    SPEED = 5,  -- Alias for SPD for compatibility
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
    SOLAR_POWER = 77,
    SIMPLE = 78,
    CONTRARY = 79,
    ICE_BODY = 80,
    SAND_RUSH = 81,
    SNOW_CLOAK = 82,
    OVERCOAT = 83,
    SNOW_WARNING = 84,
    DRY_SKIN = 85, -- Weather healing/damage ability
    
    -- Terrain-related abilities (adding to support terrain system)
    ELECTRIC_SURGE = 226, -- Sets Electric Terrain on switch-in
    GRASSY_SURGE = 229, -- Sets Grassy Terrain on switch-in
    MISTY_SURGE = 228, -- Sets Misty Terrain on switch-in
    PSYCHIC_SURGE = 227, -- Sets Psychic Terrain on switch-in
    SURGE_SURFER = 207, -- Speed doubles in Electric Terrain
    GRASS_PELT = 179 -- Defense is raised in Grassy Terrain

    -- Note: Full ability list would continue with all abilities through modern generations
}

-- Move Category Enumeration (for move system integration)
Enums.MoveCategory = {
    PHYSICAL = 0,
    SPECIAL = 1,
    STATUS = 2
}

-- Move Target Enumeration (matching TypeScript MoveTarget enum)
Enums.MoveTarget = {
    USER = 0,
    OTHER = 1,
    ALL_OTHERS = 2,
    NEAR_OTHER = 3,
    ALL_NEAR_OTHERS = 4,
    NEAR_ENEMY = 5,
    ALL_NEAR_ENEMIES = 6,
    RANDOM_NEAR_ENEMY = 7,
    ALL_ENEMIES = 8,
    ATTACKER = 9,
    NEAR_ALLY = 10,
    ALLY = 11,
    USER_OR_NEAR_ALLY = 12,
    USER_AND_ALLIES = 13,
    ALL = 14,
    USER_SIDE = 15,
    ENEMY_SIDE = 16,
    BOTH_SIDES = 17,
    PARTY = 18,
    CURSE = 19
}

-- Move Flags Enumeration (matching TypeScript MoveFlags enum)
-- Represented as bitmask values for flag combinations
Enums.MoveFlags = {
    NONE = 0,
    MAKES_CONTACT = 1, -- 1 << 0
    IGNORE_PROTECT = 2, -- 1 << 1
    SOUND_BASED = 4, -- 1 << 2
    HIDE_USER = 8, -- 1 << 3
    HIDE_TARGET = 16, -- 1 << 4
    BITING_MOVE = 32, -- 1 << 5
    PULSE_MOVE = 64, -- 1 << 6
    PUNCHING_MOVE = 128, -- 1 << 7
    SLICING_MOVE = 256, -- 1 << 8
    RECKLESS_MOVE = 512, -- 1 << 9
    BALLBOMB_MOVE = 1024, -- 1 << 10
    POWDER_MOVE = 2048, -- 1 << 11
    DANCE_MOVE = 4096, -- 1 << 12
    WIND_MOVE = 8192, -- 1 << 13
    TRIAGE_MOVE = 16384, -- 1 << 14
    IGNORE_ABILITIES = 32768, -- 1 << 15
    CHECK_ALL_HITS = 65536, -- 1 << 16
    IGNORE_SUBSTITUTE = 131072, -- 1 << 17
    REDIRECT_COUNTER = 262144, -- 1 << 18
    REFLECTABLE = 524288 -- 1 << 19
}

-- Move ID Enumeration (starting with foundational moves)
-- Full implementation would include all 957 moves from TypeScript MoveId enum
Enums.MoveId = {
    NONE = 0,
    POUND = 1,
    KARATE_CHOP = 2,
    DOUBLE_SLAP = 3,
    COMET_PUNCH = 4,
    MEGA_PUNCH = 5,
    PAY_DAY = 6,
    FIRE_PUNCH = 7,
    ICE_PUNCH = 8,
    THUNDER_PUNCH = 9,
    SCRATCH = 10,
    VISE_GRIP = 11,
    GUILLOTINE = 12,
    RAZOR_WIND = 13,
    SWORDS_DANCE = 14,
    CUT = 15,
    GUST = 16,
    WING_ATTACK = 17,
    WHIRLWIND = 18,
    FLY = 19,
    BIND = 20,
    SLAM = 21,
    VINE_WHIP = 22,
    STOMP = 23,
    DOUBLE_KICK = 24,
    MEGA_KICK = 25,
    JUMP_KICK = 26,
    ROLLING_KICK = 27,
    SAND_ATTACK = 28,
    HEADBUTT = 29,
    HORN_ATTACK = 30,
    FURY_ATTACK = 31,
    HORN_DRILL = 32,
    TACKLE = 33,
    BODY_SLAM = 34,
    WRAP = 35,
    TAKE_DOWN = 36,
    THRASH = 37,
    DOUBLE_EDGE = 38,
    TAIL_WHIP = 39,
    POISON_STING = 40,
    TWINEEDLE = 41,
    PIN_MISSILE = 42,
    LEER = 43,
    BITE = 44,
    GROWL = 45,
    ROAR = 46,
    SING = 47,
    SUPERSONIC = 48,
    SONIC_BOOM = 49,
    DISABLE = 50,
    ACID = 51,
    EMBER = 52,
    FLAMETHROWER = 53,
    MIST = 54,
    WATER_GUN = 55,
    HYDRO_PUMP = 56,
    SURF = 57,
    ICE_BEAM = 58,
    BLIZZARD = 59,
    PSYBEAM = 60,
    BUBBLE_BEAM = 61,
    AURORA_BEAM = 62,
    HYPER_BEAM = 63,
    PECK = 64,
    DRILL_PECK = 65,
    SUBMISSION = 66,
    LOW_KICK = 67,
    COUNTER = 68,
    SEISMIC_TOSS = 69,
    STRENGTH = 70,
    ABSORB = 71,
    MEGA_DRAIN = 72,
    LEECH_SEED = 73,
    GROWTH = 74,
    RAZOR_LEAF = 75,
    SOLAR_BEAM = 76,
    POISON_POWDER = 77,
    STUN_SPORE = 78,
    SLEEP_POWDER = 79,
    PETAL_DANCE = 80,
    STRING_SHOT = 81,
    DRAGON_RAGE = 82,
    FIRE_SPIN = 83,
    THUNDER_SHOCK = 84,
    THUNDERBOLT = 85,
    THUNDER_WAVE = 86,
    THUNDER = 87,
    ROCK_THROW = 88,
    EARTHQUAKE = 89,
    FISSURE = 90,
    DIG = 91,
    TOXIC = 92,
    CONFUSION = 93,
    PSYCHIC = 94,
    HYPNOSIS = 95,
    MEDITATE = 96,
    AGILITY = 97,
    QUICK_ATTACK = 98,
    RAGE = 99,
    TELEPORT = 100,
    NIGHT_SHADE = 101,
    MIMIC = 102,
    SCREECH = 103,
    DOUBLE_TEAM = 104,
    RECOVER = 105,
    HARDEN = 106,
    MINIMIZE = 107,
    SMOKESCREEN = 108,
    CONFUSE_RAY = 109,
    WITHDRAW = 110,
    DEFENSE_CURL = 111,
    BARRIER = 112,
    LIGHT_SCREEN = 113,
    HAZE = 114,
    REFLECT = 115,
    FOCUS_ENERGY = 116,
    BIDE = 117,
    METRONOME = 118,
    MIRROR_MOVE = 119,
    SELF_DESTRUCT = 120,
    EGG_BOMB = 121,
    LICK = 122,
    SMOG = 123,
    SLUDGE = 124,
    BONE_CLUB = 125,
    FIRE_BLAST = 126,
    WATERFALL = 127,
    CLAMP = 128,
    SWIFT = 129,
    SKULL_BASH = 130,
    SPIKE_CANNON = 131,
    CONSTRICT = 132,
    AMNESIA = 133,
    KINESIS = 134,
    SOFT_BOILED = 135,
    HIGH_JUMP_KICK = 136,
    GLARE = 137,
    DREAM_EATER = 138,
    POISON_GAS = 139,
    BARRAGE = 140,
    LEECH_LIFE = 141,
    LOVELY_KISS = 142,
    SKY_ATTACK = 143,
    TRANSFORM = 144,
    BUBBLE = 145,
    DIZZY_PUNCH = 146,
    SPORE = 147,
    FLASH = 148,
    PSYWAVE = 149,
    SPLASH = 150,
    ACID_ARMOR = 151,
    CRABHAMMER = 152,
    EXPLOSION = 153,
    FURY_SWIPES = 154,
    BONEMERANG = 155,
    REST = 156,
    ROCK_SLIDE = 157,
    HYPER_FANG = 158,
    SHARPEN = 159,
    CONVERSION = 160,
    TRI_ATTACK = 161,
    SUPER_FANG = 162,
    SLASH = 163,
    SUBSTITUTE = 164,
    STRUGGLE = 165,
    SKETCH = 166,
    TRIPLE_KICK = 167,
    THIEF = 168,
    SPIDER_WEB = 169,
    MIND_READER = 170,
    NIGHTMARE = 171,
    FLAME_WHEEL = 172,
    SNORE = 173,
    CURSE = 174,
    FLAIL = 175,
    CONVERSION_2 = 176,
    AEROBLAST = 177,
    COTTON_SPORE = 178,
    REVERSAL = 179,
    SPITE = 180,
    POWDER_SNOW = 181,
    PROTECT = 182,
    MACH_PUNCH = 183,
    SCARY_FACE = 184,
    FEINT_ATTACK = 185,
    SWEET_KISS = 186,
    BELLY_DRUM = 187,
    SLUDGE_BOMB = 188,
    MUD_SLAP = 189,
    OCTAZOOKA = 190,
    SPIKES = 191,
    ZAP_CANNON = 192,
    FORESIGHT = 193,
    DESTINY_BOND = 194,
    PERISH_SONG = 195,
    ICY_WIND = 196,
    DETECT = 197,
    BONE_RUSH = 198,
    LOCK_ON = 199,
    OUTRAGE = 200,
    -- Additional moves needed for move effects
    DIVE = 291,
    BOUNCE = 340,
    SHADOW_FORCE = 467,
    FREEZE_SHOCK = 553,
    SLEEP_TALK = 214,
    MIRROR_COAT = 243,
    ENDURE = 203,
    FOLLOW_ME = 266,
    HELPING_HAND = 270,
    CHATTER = 448,
    FOCUS_PUNCH = 264,
    UPROAR = 253,
    ASSIST = 274,
    -- Note: Full implementation would include all moves up to ~957
    -- This foundation provides structure for complete move system integration
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

-- Get weather type name from weather ID
-- @param weatherId: Weather ID number
-- @return: Weather type name string or "UNKNOWN"
function Enums.getWeatherTypeName(weatherId)
    return Enums.WeatherTypeName[weatherId] or "UNKNOWN"
end

-- Get weather type ID from weather name
-- @param weatherName: Weather type name string
-- @return: Weather type ID number or nil if not found
function Enums.getWeatherTypeId(weatherName)
    return Enums.WeatherType[string.upper(weatherName)]
end

-- Check if a weather type is valid
-- @param weatherId: Weather type ID to validate
-- @return: Boolean indicating if weather type exists
function Enums.isValidWeatherType(weatherId)
    return Enums.WeatherTypeName[weatherId] ~= nil
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

-- Get all valid weather type IDs
-- @return: Array of all valid weather type IDs
function Enums.getAllWeatherTypeIds()
    local weatherTypes = {}
    for _, weatherId in pairs(Enums.WeatherType) do
        table.insert(weatherTypes, weatherId)
    end
    table.sort(weatherTypes)
    return weatherTypes
end

-- Weather Type Enumeration (for weather system)
Enums.WeatherType = {
    NONE = 0,
    SUNNY = 1,
    RAIN = 2,
    SANDSTORM = 3,
    HAIL = 4,
    FOG = 5,
    HEAVY_RAIN = 6,
    HARSH_SUN = 7,
    STRONG_WINDS = 8
}

-- Weather Type Name Lookup
Enums.WeatherTypeName = {}
for weatherName, weatherId in pairs(Enums.WeatherType) do
    Enums.WeatherTypeName[weatherId] = weatherName
end

-- Gender enumeration for Pokemon
Enums.Gender = {
    GENDERLESS = 0,
    MALE = 1,
    FEMALE = 2,
    UNKNOWN = -1
}

-- Move-related utility functions

-- Get move target name from target ID
-- @param targetId: Target ID number
-- @return: Target name string or "UNKNOWN"
function Enums.getMoveTargetName(targetId)
    for targetName, id in pairs(Enums.MoveTarget) do
        if id == targetId then
            return targetName
        end
    end
    return "UNKNOWN"
end

-- Get move category name from category ID
-- @param categoryId: Category ID number (0=Physical, 1=Special, 2=Status)
-- @return: Category name string or "UNKNOWN"
function Enums.getMoveCategoryName(categoryId)
    for categoryName, id in pairs(Enums.MoveCategory) do
        if id == categoryId then
            return categoryName
        end
    end
    return "UNKNOWN"
end

-- Check if a move flag is set in a flags bitmask
-- @param flags: Bitmask of move flags
-- @param flag: Flag to check for
-- @return: Boolean indicating if flag is set
function Enums.hasMoveFlag(flags, flag)
    return (flags & flag) == flag
end

-- Get move name from move ID
-- @param moveId: Move ID number
-- @return: Move name string or "UNKNOWN"
function Enums.getMoveName(moveId)
    for moveName, id in pairs(Enums.MoveId) do
        if id == moveId then
            return moveName
        end
    end
    return "UNKNOWN"
end

-- Get move ID from move name
-- @param moveName: Move name string
-- @return: Move ID number or nil if not found
function Enums.getMoveId(moveName)
    return Enums.MoveId[string.upper(moveName)]
end

-- Check if a move target is valid
-- @param targetId: Target ID to validate
-- @return: Boolean indicating if target exists
function Enums.isValidMoveTarget(targetId)
    for _, id in pairs(Enums.MoveTarget) do
        if id == targetId then
            return true
        end
    end
    return false
end

-- Check if a move category is valid
-- @param categoryId: Category ID to validate
-- @return: Boolean indicating if category exists
function Enums.isValidMoveCategory(categoryId)
    return categoryId >= 0 and categoryId <= 2
end

-- Get all valid move target IDs
-- @return: Array of all valid target IDs
function Enums.getAllMoveTargetIds()
    local targets = {}
    for _, targetId in pairs(Enums.MoveTarget) do
        table.insert(targets, targetId)
    end
    table.sort(targets)
    return targets
end

-- Get all valid move category IDs
-- @return: Array of all valid category IDs
function Enums.getAllMoveCategoryIds()
    local categories = {}
    for _, categoryId in pairs(Enums.MoveCategory) do
        table.insert(categories, categoryId)
    end
    table.sort(categories)
    return categories
end

-- Item ID Enumeration (basic items for terrain system)
Enums.ItemId = {
    NONE = 0,
    AIR_BALLOON = 541, -- Makes Pokemon not grounded until hit
    IRON_BALL = 278, -- Forces Pokemon to be grounded (nullifies Flying/Levitate)
    TERRAIN_EXTENDER = 879 -- Extends terrain duration from 5 to 8 turns
}

-- Legacy enum aliases for compatibility
Enums.Type = Enums.PokemonType
Enums.Ability = Enums.AbilityId
Enums.Move = Enums.MoveId

return Enums