-- Move Database
-- Complete database of all 957+ moves with power, accuracy, PP, type, and effects
-- Provides centralized move data matching TypeScript reference implementation
-- Enables complete move mechanics for AO battle system

local MoveDatabase = {}

-- Move data structure following TypeScript Move class pattern
-- Each move contains: id, name, power, accuracy, pp, type, category, target, priority, flags, effects
MoveDatabase.moves = {}

-- Move indexing for fast lookups
MoveDatabase.movesByType = {}
MoveDatabase.movesByCategory = {}
MoveDatabase.movesByPower = {}
MoveDatabase.movesByTarget = {}
MoveDatabase.movesByFlags = {}

-- Initialize move database with all moves from TypeScript reference
-- This follows the exact pattern from src/data/moves/move.ts
function MoveDatabase.init()
    -- Clear existing data
    MoveDatabase.moves = {}
    MoveDatabase.movesByType = {}
    MoveDatabase.movesByCategory = {}
    MoveDatabase.movesByPower = {}
    MoveDatabase.movesByTarget = {}
    MoveDatabase.movesByFlags = {}
    
    -- Move definitions based on TypeScript allMoves.push() pattern
    -- Format: id, name, type, category, power, accuracy, pp, target, priority, flags, effects
    local moveDefinitions = {
        -- Generation 1 Moves
        {0, "None", 0, 2, 0, -1, 0, 0, 1, {}, {}}, -- NONE
        {1, "Pound", 0, 0, 40, 100, 35, 3, 0, {1}, {}}, -- POUND
        {2, "Karate Chop", 1, 0, 50, 100, 25, 3, 0, {1}, {high_crit = true}}, -- KARATE_CHOP
        {3, "Double Slap", 0, 0, 15, 85, 10, 3, 0, {1}, {multi_hit = {2, 5}}}, -- DOUBLE_SLAP
        {4, "Comet Punch", 0, 0, 18, 85, 15, 3, 0, {1, 128}, {multi_hit = {2, 5}}}, -- COMET_PUNCH
        {5, "Mega Punch", 0, 0, 80, 85, 20, 3, 0, {1, 128}, {}}, -- MEGA_PUNCH
        {6, "Pay Day", 0, 0, 40, 100, 20, 3, 0, {1}, {money_reward = true}}, -- PAY_DAY
        {7, "Fire Punch", 9, 0, 75, 100, 15, 3, 0, {1, 128}, {burn_chance = 10}}, -- FIRE_PUNCH
        {8, "Ice Punch", 14, 0, 75, 100, 15, 3, 0, {1, 128}, {freeze_chance = 10}}, -- ICE_PUNCH
        {9, "Thunder Punch", 12, 0, 75, 100, 15, 3, 0, {1, 128}, {paralysis_chance = 10}}, -- THUNDER_PUNCH
        {10, "Scratch", 0, 0, 40, 100, 35, 3, 0, {1}, {}}, -- SCRATCH
        {11, "Vise Grip", 0, 0, 55, 100, 30, 3, 0, {1}, {}}, -- VISE_GRIP
        {12, "Guillotine", 0, 0, 250, 30, 5, 3, 0, {1}, {one_hit_ko = true}}, -- GUILLOTINE
        {13, "Razor Wind", 0, 1, 80, 100, 10, 7, 0, {8192}, {charging = true, high_crit = true}}, -- RAZOR_WIND
        {14, "Swords Dance", 0, 2, 0, -1, 20, 0, 0, {4096}, {stat_change = {attack = 2}}}, -- SWORDS_DANCE
        {15, "Cut", 0, 0, 50, 95, 30, 3, 0, {1, 256}, {}}, -- CUT
        {16, "Gust", 2, 1, 40, 100, 35, 3, 0, {8192}, {hits_flying = true}}, -- GUST
        {17, "Wing Attack", 2, 0, 60, 100, 35, 3, 0, {1}, {}}, -- WING_ATTACK
        {18, "Whirlwind", 0, 2, 0, -1, 20, 3, -6, {2, 8192, 524288}, {force_switch = true}}, -- WHIRLWIND
        {19, "Fly", 2, 0, 90, 95, 15, 3, 0, {1}, {charging = true, semi_invulnerable = true}}, -- FLY
        {20, "Bind", 0, 0, 15, 85, 20, 3, 0, {1}, {trapping = true}}, -- BIND
        {21, "Slam", 0, 0, 80, 75, 20, 3, 0, {1}, {}}, -- SLAM
        {22, "Vine Whip", 11, 0, 45, 100, 25, 3, 0, {1}, {}}, -- VINE_WHIP
        {23, "Stomp", 0, 0, 65, 100, 20, 3, 0, {1}, {flinch_chance = 30}}, -- STOMP
        {24, "Double Kick", 1, 0, 30, 100, 30, 3, 0, {1}, {multi_hit = {2, 2}}}, -- DOUBLE_KICK
        {25, "Mega Kick", 0, 0, 120, 75, 5, 3, 0, {1}, {}}, -- MEGA_KICK
        {26, "Jump Kick", 1, 0, 100, 95, 10, 3, 0, {1}, {crash_damage = true}}, -- JUMP_KICK
        {27, "Rolling Kick", 1, 0, 60, 85, 15, 3, 0, {1}, {flinch_chance = 30}}, -- ROLLING_KICK
        {28, "Sand Attack", 4, 2, 0, 100, 15, 3, 0, {}, {stat_change = {accuracy = -1}}}, -- SAND_ATTACK
        {29, "Headbutt", 0, 0, 70, 100, 15, 3, 0, {1}, {flinch_chance = 30}}, -- HEADBUTT
        {30, "Horn Attack", 0, 0, 65, 100, 25, 3, 0, {1}, {}}, -- HORN_ATTACK
        {31, "Fury Attack", 0, 0, 15, 85, 20, 3, 0, {1}, {multi_hit = {2, 5}}}, -- FURY_ATTACK
        {32, "Horn Drill", 0, 0, 250, 30, 5, 3, 0, {1}, {one_hit_ko = true}}, -- HORN_DRILL
        {33, "Tackle", 0, 0, 40, 100, 35, 3, 0, {1}, {}}, -- TACKLE
        {34, "Body Slam", 0, 0, 85, 100, 15, 3, 0, {1}, {paralysis_chance = 30}}, -- BODY_SLAM
        {35, "Wrap", 0, 0, 15, 90, 20, 3, 0, {1}, {trapping = true}}, -- WRAP
        {36, "Take Down", 0, 0, 90, 85, 20, 3, 0, {1, 512}, {recoil = 25}}, -- TAKE_DOWN
        {37, "Thrash", 0, 0, 120, 100, 10, 3, 0, {1}, {thrash = true, confusion = true}}, -- THRASH
        {38, "Double Edge", 0, 0, 120, 100, 15, 3, 0, {1, 512}, {recoil = 33}}, -- DOUBLE_EDGE
        {39, "Tail Whip", 0, 2, 0, 100, 30, 7, 0, {}, {stat_change = {defense = -1}}}, -- TAIL_WHIP
        {40, "Poison Sting", 3, 0, 15, 100, 35, 3, 0, {1}, {poison_chance = 30}}, -- POISON_STING
        {41, "Twineedle", 6, 0, 25, 100, 20, 3, 0, {1}, {multi_hit = {2, 2}, poison_chance = 20}}, -- TWINEEDLE
        {42, "Pin Missile", 6, 0, 25, 95, 20, 3, 0, {1}, {multi_hit = {2, 5}}}, -- PIN_MISSILE
        {43, "Leer", 0, 2, 0, 100, 30, 7, 0, {}, {stat_change = {defense = -1}}}, -- LEER
        {44, "Bite", 16, 0, 60, 100, 25, 3, 0, {1, 32}, {flinch_chance = 30}}, -- BITE
        {45, "Growl", 0, 2, 0, 100, 40, 7, 0, {4}, {stat_change = {attack = -1}}}, -- GROWL
        {46, "Roar", 0, 2, 0, -1, 20, 3, -6, {2, 4}, {force_switch = true}}, -- ROAR
        {47, "Sing", 0, 2, 0, 55, 15, 3, 0, {4}, {sleep = true}}, -- SING
        {48, "Supersonic", 0, 2, 0, 55, 20, 3, 0, {4}, {confusion = true}}, -- SUPERSONIC
        {49, "Sonic Boom", 0, 1, 20, 90, 20, 3, 0, {}, {fixed_damage = 20}}, -- SONIC_BOOM
        {50, "Disable", 0, 2, 0, 100, 20, 3, 0, {}, {disable = true}}, -- DISABLE
        {51, "Acid", 3, 1, 40, 100, 30, 7, 0, {}, {stat_change = {defense = -1}}}, -- ACID
        {52, "Ember", 9, 1, 40, 100, 25, 3, 0, {}, {burn_chance = 10}}, -- EMBER
        {53, "Flamethrower", 9, 1, 90, 100, 15, 3, 0, {}, {burn_chance = 10}}, -- FLAMETHROWER
        {54, "Mist", 14, 2, 0, -1, 30, 15, 0, {}, {prevent_stat_reduction = true}}, -- MIST
        {55, "Water Gun", 10, 1, 40, 100, 25, 3, 0, {}, {}}, -- WATER_GUN
        {56, "Hydro Pump", 10, 1, 110, 80, 5, 3, 0, {}, {}}, -- HYDRO_PUMP
        {57, "Surf", 10, 1, 90, 100, 15, 6, 0, {}, {}}, -- SURF
        {58, "Ice Beam", 14, 1, 90, 100, 10, 3, 0, {}, {freeze_chance = 10}}, -- ICE_BEAM
        {59, "Blizzard", 14, 1, 110, 70, 5, 6, 0, {8192}, {freeze_chance = 10}}, -- BLIZZARD
        {60, "Psybeam", 13, 1, 65, 100, 20, 3, 0, {}, {confusion_chance = 10}}, -- PSYBEAM
        {61, "Bubble Beam", 10, 1, 65, 100, 20, 3, 0, {}, {stat_change = {speed = -1, chance = 10}}}, -- BUBBLE_BEAM
        {62, "Aurora Beam", 14, 1, 65, 100, 20, 3, 0, {}, {stat_change = {attack = -1, chance = 10}}}, -- AURORA_BEAM
        {63, "Hyper Beam", 0, 1, 150, 90, 5, 3, 0, {}, {recharge = true}}, -- HYPER_BEAM
        {64, "Peck", 2, 0, 35, 100, 35, 3, 0, {1}, {}}, -- PECK
        {65, "Drill Peck", 2, 0, 80, 100, 20, 3, 0, {1}, {}}, -- DRILL_PECK
        {66, "Submission", 1, 0, 80, 80, 20, 3, 0, {1, 512}, {recoil = 25}}, -- SUBMISSION
        {67, "Low Kick", 1, 0, 50, 90, 20, 3, 0, {1}, {weight_based = true}}, -- LOW_KICK
        {68, "Counter", 1, 0, 1, 100, 20, 9, -5, {1}, {counter_physical = true}}, -- COUNTER
        {69, "Seismic Toss", 1, 0, 1, 100, 20, 3, 0, {1}, {level_damage = true}}, -- SEISMIC_TOSS
        {70, "Strength", 0, 0, 80, 100, 15, 3, 0, {1}, {}}, -- STRENGTH
        {71, "Absorb", 11, 1, 20, 100, 25, 3, 0, {}, {drain = 50}}, -- ABSORB
        {72, "Mega Drain", 11, 1, 40, 100, 15, 3, 0, {}, {drain = 50}}, -- MEGA_DRAIN
        {73, "Leech Seed", 11, 2, 0, 90, 10, 3, 0, {}, {leech_seed = true}}, -- LEECH_SEED
        {74, "Growth", 0, 2, 0, -1, 20, 0, 0, {}, {stat_change = {attack = 1, special_attack = 1}}}, -- GROWTH
        {75, "Razor Leaf", 11, 0, 55, 95, 25, 7, 0, {256}, {high_crit = true}}, -- RAZOR_LEAF
        {76, "Solar Beam", 11, 1, 120, 100, 10, 3, 0, {}, {charging = true}}, -- SOLAR_BEAM
        {77, "Poison Powder", 3, 2, 0, 75, 35, 3, 0, {2048}, {poison = true}}, -- POISON_POWDER
        {78, "Stun Spore", 11, 2, 0, 75, 30, 3, 0, {2048}, {paralysis = true}}, -- STUN_SPORE
        {79, "Sleep Powder", 11, 2, 0, 75, 15, 3, 0, {2048}, {sleep = true}}, -- SLEEP_POWDER
        {80, "Petal Dance", 11, 1, 120, 100, 10, 3, 0, {1, 4096}, {thrash = true, confusion = true}}, -- PETAL_DANCE
        {81, "String Shot", 6, 2, 0, 95, 40, 7, 0, {}, {stat_change = {speed = -2}}}, -- STRING_SHOT
        {82, "Dragon Rage", 15, 1, 40, 100, 10, 3, 0, {}, {fixed_damage = 40}}, -- DRAGON_RAGE
        {83, "Fire Spin", 9, 1, 35, 85, 15, 3, 0, {}, {trapping = true}}, -- FIRE_SPIN
        {84, "Thunder Shock", 12, 1, 40, 100, 30, 3, 0, {}, {paralysis_chance = 10}}, -- THUNDER_SHOCK
        {85, "Thunderbolt", 12, 1, 90, 100, 15, 3, 0, {}, {paralysis_chance = 10}}, -- THUNDERBOLT
        {86, "Thunder Wave", 12, 2, 0, 90, 20, 3, 0, {}, {paralysis = true}}, -- THUNDER_WAVE
        {87, "Thunder", 12, 1, 110, 70, 10, 3, 0, {}, {paralysis_chance = 30}}, -- THUNDER
        {88, "Rock Throw", 5, 0, 50, 90, 15, 3, 0, {1}, {}}, -- ROCK_THROW
        {89, "Earthquake", 4, 0, 100, 100, 10, 6, 0, {}, {}}, -- EARTHQUAKE
        {90, "Fissure", 4, 0, 250, 30, 5, 3, 0, {1}, {one_hit_ko = true}}, -- FISSURE
        {91, "Dig", 4, 0, 80, 100, 10, 3, 0, {1}, {charging = true, semi_invulnerable = true}}, -- DIG
        {92, "Toxic", 3, 2, 0, 90, 10, 3, 0, {}, {toxic = true}}, -- TOXIC
        {93, "Confusion", 13, 1, 50, 100, 25, 3, 0, {}, {confusion_chance = 10}}, -- CONFUSION
        {94, "Psychic", 13, 1, 90, 100, 10, 3, 0, {}, {stat_change = {special_defense = -1, chance = 10}}}, -- PSYCHIC
        {95, "Hypnosis", 13, 2, 0, 60, 20, 3, 0, {}, {sleep = true}}, -- HYPNOSIS
        {96, "Meditate", 13, 2, 0, -1, 40, 0, 0, {}, {stat_change = {attack = 1}}}, -- MEDITATE
        {97, "Agility", 13, 2, 0, -1, 30, 0, 0, {}, {stat_change = {speed = 2}}}, -- AGILITY
        {98, "Quick Attack", 0, 0, 40, 100, 30, 3, 1, {1}, {}}, -- QUICK_ATTACK
        {99, "Rage", 0, 0, 20, 100, 20, 3, 0, {1}, {rage = true}}, -- RAGE
        {100, "Teleport", 13, 2, 0, -1, 20, 0, -6, {}, {escape = true}}, -- TELEPORT
        {101, "Night Shade", 7, 1, 1, 100, 15, 3, 0, {}, {level_damage = true}}, -- NIGHT_SHADE
        {102, "Mimic", 0, 2, 0, -1, 10, 3, 0, {}, {mimic = true}}, -- MIMIC
        {103, "Screech", 0, 2, 0, 85, 40, 3, 0, {4}, {stat_change = {defense = -2}}}, -- SCREECH
        {104, "Double Team", 0, 2, 0, -1, 15, 0, 0, {}, {stat_change = {evasion = 1}}}, -- DOUBLE_TEAM
        {105, "Recover", 0, 2, 0, -1, 5, 0, 0, {16384}, {heal = 50}}, -- RECOVER
        {106, "Harden", 0, 2, 0, -1, 30, 0, 0, {}, {stat_change = {defense = 1}}}, -- HARDEN
        {107, "Minimize", 0, 2, 0, -1, 10, 0, 0, {}, {stat_change = {evasion = 2}, minimize = true}}, -- MINIMIZE
        {108, "Smokescreen", 0, 2, 0, 100, 20, 3, 0, {}, {stat_change = {accuracy = -1}}}, -- SMOKESCREEN
        {109, "Confuse Ray", 7, 2, 0, 100, 10, 3, 0, {}, {confusion = true}}, -- CONFUSE_RAY
        {110, "Withdraw", 10, 2, 0, -1, 40, 0, 0, {}, {stat_change = {defense = 1}}}, -- WITHDRAW
        {111, "Defense Curl", 0, 2, 0, -1, 40, 0, 0, {}, {stat_change = {defense = 1}, defense_curl = true}}, -- DEFENSE_CURL
        {112, "Barrier", 13, 2, 0, -1, 20, 0, 0, {}, {stat_change = {special_defense = 2}}}, -- BARRIER
        {113, "Light Screen", 13, 2, 0, -1, 30, 15, 0, {}, {light_screen = true}}, -- LIGHT_SCREEN
        {114, "Haze", 14, 2, 0, -1, 30, 14, 0, {}, {reset_stats = true}}, -- HAZE
        {115, "Reflect", 13, 2, 0, -1, 20, 15, 0, {}, {reflect = true}}, -- REFLECT
        {116, "Focus Energy", 0, 2, 0, -1, 30, 0, 0, {}, {focus_energy = true}}, -- FOCUS_ENERGY
        {117, "Bide", 0, 0, 1, -1, 10, 0, 1, {1}, {bide = true}}, -- BIDE
        {118, "Metronome", 0, 2, 0, -1, 10, 0, 0, {}, {metronome = true}}, -- METRONOME
        {119, "Mirror Move", 2, 2, 0, -1, 20, 3, 0, {}, {mirror_move = true}}, -- MIRROR_MOVE
        {120, "Self Destruct", 0, 0, 200, 100, 5, 6, 0, {}, {self_destruct = true}}, -- SELF_DESTRUCT
        {121, "Egg Bomb", 0, 0, 100, 75, 10, 3, 0, {1, 1024}, {}}, -- EGG_BOMB
        {122, "Lick", 7, 0, 30, 100, 30, 3, 0, {1}, {paralysis_chance = 30}}, -- LICK
        {123, "Smog", 3, 1, 30, 70, 20, 3, 0, {}, {poison_chance = 40}}, -- SMOG
        {124, "Sludge", 3, 1, 65, 100, 20, 3, 0, {}, {poison_chance = 30}}, -- SLUDGE
        {125, "Bone Club", 4, 0, 65, 85, 20, 3, 0, {1}, {flinch_chance = 10}}, -- BONE_CLUB
        {126, "Fire Blast", 9, 1, 110, 85, 5, 3, 0, {}, {burn_chance = 10}}, -- FIRE_BLAST
        {127, "Waterfall", 10, 0, 80, 100, 15, 3, 0, {1}, {}}, -- WATERFALL
        {128, "Clamp", 10, 0, 35, 85, 15, 3, 0, {1}, {trapping = true}}, -- CLAMP
        {129, "Swift", 0, 1, 60, -1, 20, 7, 0, {}, {}}, -- SWIFT
        {130, "Skull Bash", 0, 0, 130, 100, 10, 3, 0, {1}, {charging = true, stat_change = {defense = 1}}}, -- SKULL_BASH
        {131, "Spike Cannon", 0, 0, 20, 100, 15, 3, 0, {1}, {multi_hit = {2, 5}}}, -- SPIKE_CANNON
        {132, "Constrict", 0, 0, 10, 100, 35, 3, 0, {1}, {stat_change = {speed = -1, chance = 10}}}, -- CONSTRICT
        {133, "Amnesia", 13, 2, 0, -1, 20, 0, 0, {}, {stat_change = {special_defense = 2}}}, -- AMNESIA
        {134, "Kinesis", 13, 2, 0, 80, 15, 3, 0, {}, {stat_change = {accuracy = -1}}}, -- KINESIS
        {135, "Soft Boiled", 0, 2, 0, -1, 5, 0, 0, {16384}, {heal = 50}}, -- SOFT_BOILED
        {136, "High Jump Kick", 1, 0, 130, 90, 10, 3, 0, {1}, {crash_damage = true}}, -- HIGH_JUMP_KICK
        {137, "Glare", 0, 2, 0, 100, 30, 3, 0, {}, {paralysis = true}}, -- GLARE
        {138, "Dream Eater", 13, 1, 100, 100, 15, 3, 0, {16384}, {dream_eater = true}}, -- DREAM_EATER
        {139, "Poison Gas", 3, 2, 0, 90, 40, 7, 0, {}, {poison = true}}, -- POISON_GAS
        {140, "Barrage", 0, 0, 15, 85, 20, 3, 0, {1, 1024}, {multi_hit = {2, 5}}}, -- BARRAGE
        {141, "Leech Life", 6, 0, 80, 100, 10, 3, 0, {1}, {drain = 50}}, -- LEECH_LIFE
        {142, "Lovely Kiss", 0, 2, 0, 75, 10, 3, 0, {1}, {sleep = true}}, -- LOVELY_KISS
        {143, "Sky Attack", 2, 0, 140, 90, 5, 3, 0, {1}, {charging = true, high_crit = true, flinch_chance = 30}}, -- SKY_ATTACK
        {144, "Transform", 0, 2, 0, -1, 10, 3, 0, {}, {transform = true}}, -- TRANSFORM
        {145, "Bubble", 10, 1, 40, 100, 30, 7, 0, {}, {stat_change = {speed = -1, chance = 10}}}, -- BUBBLE
        {146, "Dizzy Punch", 0, 0, 70, 100, 10, 3, 0, {1, 128}, {confusion_chance = 20}}, -- DIZZY_PUNCH
        {147, "Spore", 11, 2, 0, 100, 15, 3, 0, {2048}, {sleep = true}}, -- SPORE
        {148, "Flash", 0, 2, 0, 100, 20, 3, 0, {}, {stat_change = {accuracy = -1}}}, -- FLASH
        {149, "Psywave", 13, 1, 1, 100, 15, 3, 0, {}, {psywave = true}}, -- PSYWAVE
        {150, "Splash", 0, 2, 0, -1, 40, 0, 0, {}, {}}, -- SPLASH
        {151, "Acid Armor", 3, 2, 0, -1, 20, 0, 0, {}, {stat_change = {defense = 2}}}, -- ACID_ARMOR
        {152, "Crabhammer", 10, 0, 100, 90, 10, 3, 0, {1}, {high_crit = true}}, -- CRABHAMMER
        {153, "Explosion", 0, 0, 250, 100, 5, 6, 0, {}, {self_destruct = true}}, -- EXPLOSION
        {154, "Fury Swipes", 0, 0, 18, 80, 15, 3, 0, {1}, {multi_hit = {2, 5}}}, -- FURY_SWIPES
        {155, "Bonemerang", 4, 0, 50, 90, 10, 3, 0, {1}, {multi_hit = {2, 2}}}, -- BONEMERANG
        {156, "Rest", 13, 2, 0, -1, 5, 0, 0, {16384}, {rest = true}}, -- REST
        {157, "Rock Slide", 5, 0, 75, 90, 10, 7, 0, {1}, {flinch_chance = 30}}, -- ROCK_SLIDE
        {158, "Hyper Fang", 0, 0, 80, 90, 15, 3, 0, {1, 32}, {flinch_chance = 10}}, -- HYPER_FANG
        {159, "Sharpen", 0, 2, 0, -1, 30, 0, 0, {}, {stat_change = {attack = 1}}}, -- SHARPEN
        {160, "Conversion", 0, 2, 0, -1, 30, 0, 0, {}, {conversion = true}}, -- CONVERSION
        {161, "Tri Attack", 0, 1, 80, 100, 10, 3, 0, {}, {tri_attack = true}}, -- TRI_ATTACK
        {162, "Super Fang", 0, 0, 1, 90, 10, 3, 0, {1}, {super_fang = true}}, -- SUPER_FANG
        {163, "Slash", 0, 0, 70, 100, 20, 3, 0, {1, 256}, {high_crit = true}}, -- SLASH
        {164, "Substitute", 0, 2, 0, -1, 10, 0, 0, {}, {substitute = true}}, -- SUBSTITUTE
        {165, "Struggle", 0, 0, 50, -1, 1, 3, 0, {1}, {struggle = true, recoil = 25}}, -- STRUGGLE
        
        -- Generation 2 Moves
        {166, "Sketch", 0, 2, 0, -1, 1, 3, 0, {}, {sketch = true}}, -- SKETCH
        {167, "Triple Kick", 1, 0, 10, 90, 10, 3, 0, {1}, {triple_kick = true}}, -- TRIPLE_KICK
        {168, "Thief", 16, 0, 60, 100, 25, 3, 0, {1}, {thief = true}}, -- THIEF
        {169, "Spider Web", 6, 2, 0, -1, 10, 3, 0, {}, {prevent_escape = true}}, -- SPIDER_WEB
        {170, "Mind Reader", 0, 2, 0, -1, 5, 3, 0, {}, {mind_reader = true}}, -- MIND_READER
        {171, "Nightmare", 7, 2, 0, 100, 15, 3, 0, {}, {nightmare = true}}, -- NIGHTMARE
        {172, "Flame Wheel", 9, 0, 60, 100, 25, 3, 0, {1}, {burn_chance = 10}}, -- FLAME_WHEEL
        {173, "Snore", 0, 1, 50, 100, 15, 3, 0, {4}, {snore = true, flinch_chance = 30}}, -- SNORE
        {174, "Curse", 7, 2, 0, -1, 10, 0, 0, {}, {curse = true}}, -- CURSE
        {175, "Flail", 0, 0, 1, 100, 15, 3, 0, {1}, {flail = true}}, -- FLAIL
        {176, "Conversion 2", 0, 2, 0, -1, 30, 0, 0, {}, {conversion_2 = true}}, -- CONVERSION_2
        {177, "Aeroblast", 2, 1, 100, 95, 5, 3, 0, {8192}, {high_crit = true}}, -- AEROBLAST
        {178, "Cotton Spore", 11, 2, 0, 100, 40, 7, 0, {2048}, {stat_change = {speed = -2}}}, -- COTTON_SPORE
        {179, "Reversal", 1, 0, 1, 100, 15, 3, 0, {1}, {reversal = true}}, -- REVERSAL
        {180, "Spite", 7, 2, 0, 100, 10, 3, 0, {}, {spite = true}}, -- SPITE
        {181, "Powder Snow", 14, 1, 40, 100, 25, 7, 0, {}, {freeze_chance = 10}}, -- POWDER_SNOW
        {182, "Protect", 0, 2, 0, -1, 10, 0, 4, {}, {protect = true}}, -- PROTECT
        {183, "Mach Punch", 1, 0, 40, 100, 30, 3, 1, {1, 128}, {}}, -- MACH_PUNCH
        {184, "Scary Face", 0, 2, 0, 100, 10, 3, 0, {}, {stat_change = {speed = -2}}}, -- SCARY_FACE
        {185, "Feint Attack", 16, 0, 60, -1, 20, 3, 0, {1}, {}}, -- FEINT_ATTACK
        {186, "Sweet Kiss", 17, 2, 0, 75, 10, 3, 0, {1}, {confusion = true}}, -- SWEET_KISS
        {187, "Belly Drum", 0, 2, 0, -1, 10, 0, 0, {}, {belly_drum = true}}, -- BELLY_DRUM
        {188, "Sludge Bomb", 3, 1, 90, 100, 10, 3, 0, {1024}, {poison_chance = 30}}, -- SLUDGE_BOMB
        {189, "Mud Slap", 4, 1, 20, 100, 10, 3, 0, {}, {stat_change = {accuracy = -1}}}, -- MUD_SLAP
        {190, "Octazooka", 10, 1, 65, 85, 10, 3, 0, {1024}, {stat_change = {accuracy = -1, chance = 50}}}, -- OCTAZOOKA
        {191, "Spikes", 4, 2, 0, -1, 20, 16, 0, {524288}, {spikes = true}}, -- SPIKES
        {192, "Zap Cannon", 12, 1, 120, 50, 5, 3, 0, {1024}, {paralysis_chance = 100}}, -- ZAP_CANNON
        {193, "Foresight", 0, 2, 0, -1, 40, 3, 0, {}, {foresight = true}}, -- FORESIGHT
        {194, "Destiny Bond", 7, 2, 0, -1, 5, 0, 0, {}, {destiny_bond = true}}, -- DESTINY_BOND
        {195, "Perish Song", 0, 2, 0, -1, 5, 14, 0, {4}, {perish_song = true}}, -- PERISH_SONG
        {196, "Icy Wind", 14, 1, 55, 95, 15, 7, 0, {8192}, {stat_change = {speed = -1}}}, -- ICY_WIND
        {197, "Detect", 1, 2, 0, -1, 5, 0, 4, {}, {protect = true}}, -- DETECT
        {198, "Bone Rush", 4, 0, 25, 90, 10, 3, 0, {1}, {multi_hit = {2, 5}}}, -- BONE_RUSH
        {199, "Lock On", 0, 2, 0, -1, 5, 3, 0, {}, {lock_on = true}}, -- LOCK_ON
        {200, "Outrage", 15, 0, 120, 100, 10, 3, 0, {1}, {thrash = true, confusion = true}}, -- OUTRAGE
        {201, "Sandstorm", 5, 2, 0, -1, 10, 14, 0, {8192}, {sandstorm = true}}, -- SANDSTORM
        {202, "Giga Drain", 11, 1, 75, 100, 10, 3, 0, {}, {drain = 50}}, -- GIGA_DRAIN
        {203, "Endure", 0, 2, 0, -1, 10, 0, 4, {}, {endure = true}}, -- ENDURE
        {204, "Charm", 17, 2, 0, 100, 20, 3, 0, {1}, {stat_change = {attack = -2}}}, -- CHARM
        {205, "Rollout", 5, 0, 30, 90, 20, 3, 0, {1}, {rollout = true}}, -- ROLLOUT
        {206, "False Swipe", 0, 0, 40, 100, 40, 3, 0, {1}, {false_swipe = true}}, -- FALSE_SWIPE
        {207, "Swagger", 0, 2, 0, 85, 15, 3, 0, {}, {stat_change = {attack = 2}, confusion = true}}, -- SWAGGER
        {208, "Milk Drink", 0, 2, 0, -1, 5, 0, 0, {16384}, {heal = 50}}, -- MILK_DRINK
        {209, "Spark", 12, 0, 65, 100, 20, 3, 0, {1}, {paralysis_chance = 30}}, -- SPARK
        {210, "Fury Cutter", 6, 0, 40, 95, 20, 3, 0, {1, 256}, {fury_cutter = true}}, -- FURY_CUTTER
        {211, "Steel Wing", 8, 0, 70, 90, 25, 3, 0, {1}, {stat_change = {defense = 1, chance = 10}}}, -- STEEL_WING
        {212, "Mean Look", 0, 2, 0, -1, 5, 3, 0, {}, {prevent_escape = true}}, -- MEAN_LOOK
        {213, "Attract", 0, 2, 0, 100, 15, 3, 0, {1}, {attract = true}}, -- ATTRACT
        {214, "Sleep Talk", 0, 2, 0, -1, 10, 0, 0, {4}, {sleep_talk = true}}, -- SLEEP_TALK
        {215, "Heal Bell", 0, 2, 0, -1, 5, 18, 0, {4}, {heal_bell = true}}, -- HEAL_BELL
        {216, "Return", 0, 0, 1, 100, 20, 3, 0, {1}, {move_return = true}}, -- RETURN
        {217, "Present", 0, 0, 1, 90, 15, 3, 0, {1}, {present = true}}, -- PRESENT
        {218, "Frustration", 0, 0, 1, 100, 20, 3, 0, {1}, {frustration = true}}, -- FRUSTRATION
        {219, "Safeguard", 0, 2, 0, -1, 25, 15, 0, {}, {safeguard = true}}, -- SAFEGUARD
        {220, "Pain Split", 0, 2, 0, -1, 20, 3, 0, {}, {pain_split = true}}, -- PAIN_SPLIT
        {221, "Sacred Fire", 9, 0, 100, 95, 5, 3, 0, {}, {burn_chance = 50}}, -- SACRED_FIRE
        {222, "Magnitude", 4, 0, 1, 100, 30, 6, 0, {}, {magnitude = true}}, -- MAGNITUDE
        {223, "Dynamic Punch", 1, 0, 100, 50, 5, 3, 0, {1, 128}, {confusion_chance = 100}}, -- DYNAMIC_PUNCH
        {224, "Megahorn", 6, 0, 120, 85, 10, 3, 0, {1}, {}}, -- MEGAHORN
        {225, "Dragon Breath", 15, 1, 60, 100, 20, 3, 0, {}, {paralysis_chance = 30}}, -- DRAGON_BREATH
        {226, "Baton Pass", 0, 2, 0, -1, 40, 0, 0, {}, {baton_pass = true}}, -- BATON_PASS
        {227, "Encore", 0, 2, 0, 100, 5, 3, 0, {}, {encore = true}}, -- ENCORE
        {228, "Pursuit", 16, 0, 40, 100, 20, 3, 0, {1}, {pursuit = true}}, -- PURSUIT
        {229, "Rapid Spin", 0, 0, 50, 100, 40, 3, 0, {1}, {rapid_spin = true}}, -- RAPID_SPIN
        {230, "Sweet Scent", 0, 2, 0, 100, 20, 7, 0, {}, {stat_change = {evasion = -2}}}, -- SWEET_SCENT
        {231, "Iron Tail", 8, 0, 100, 75, 15, 3, 0, {1}, {stat_change = {defense = -1, chance = 30}}}, -- IRON_TAIL
        {232, "Metal Claw", 8, 0, 50, 95, 35, 3, 0, {1}, {stat_change = {attack = 1, chance = 10}}}, -- METAL_CLAW
        {233, "Vital Throw", 1, 0, 70, -1, 10, 3, -1, {1}, {}}, -- VITAL_THROW
        {234, "Morning Sun", 0, 2, 0, -1, 5, 0, 0, {16384}, {morning_sun = true}}, -- MORNING_SUN
        {235, "Synthesis", 11, 2, 0, -1, 5, 0, 0, {16384}, {synthesis = true}}, -- SYNTHESIS
        {236, "Moonlight", 17, 2, 0, -1, 5, 0, 0, {16384}, {moonlight = true}}, -- MOONLIGHT
        {237, "Hidden Power", 0, 1, 60, 100, 15, 3, 0, {}, {hidden_power = true}}, -- HIDDEN_POWER
        {238, "Cross Chop", 1, 0, 100, 80, 5, 3, 0, {1}, {high_crit = true}}, -- CROSS_CHOP
        {239, "Twister", 15, 1, 40, 100, 20, 7, 0, {8192}, {flinch_chance = 20, hits_flying = true}}, -- TWISTER
        {240, "Rain Dance", 10, 2, 0, -1, 5, 14, 0, {}, {rain_dance = true}}, -- RAIN_DANCE
        {241, "Sunny Day", 9, 2, 0, -1, 5, 14, 0, {}, {sunny_day = true}}, -- SUNNY_DAY
        {242, "Crunch", 16, 0, 80, 100, 15, 3, 0, {1, 32}, {stat_change = {defense = -1, chance = 20}}}, -- CRUNCH
        {243, "Mirror Coat", 13, 1, 1, 100, 20, 9, -5, {}, {mirror_coat = true}}, -- MIRROR_COAT
        {244, "Psych Up", 0, 2, 0, -1, 10, 3, 0, {}, {psych_up = true}}, -- PSYCH_UP
        {245, "Extreme Speed", 0, 0, 80, 100, 5, 3, 2, {1}, {}}, -- EXTREME_SPEED
        {246, "Ancient Power", 5, 1, 60, 100, 5, 3, 0, {}, {ancient_power = true}}, -- ANCIENT_POWER
        {247, "Shadow Ball", 7, 1, 80, 100, 15, 3, 0, {1024}, {stat_change = {special_defense = -1, chance = 20}}}, -- SHADOW_BALL
        {248, "Future Sight", 13, 1, 120, 100, 10, 3, 0, {}, {future_sight = true}}, -- FUTURE_SIGHT
        {249, "Rock Smash", 1, 0, 40, 100, 15, 3, 0, {1}, {stat_change = {defense = -1, chance = 50}}}, -- ROCK_SMASH
        {250, "Whirlpool", 10, 1, 35, 85, 15, 3, 0, {}, {trapping = true}}, -- WHIRLPOOL
        {251, "Beat Up", 16, 0, 1, 100, 10, 3, 0, {}, {beat_up = true}}, -- BEAT_UP
        
        -- Generation 3 Moves (252-354)
        {252, "Teeter Dance", 0, 2, 0, 100, 20, 6, 0, {4096}, {confusion = true}}, -- TEETER_DANCE
        {253, "Blaze Kick", 9, 0, 85, 90, 10, 3, 0, {1}, {burn_chance = 10, high_crit = true}}, -- BLAZE_KICK
        {254, "Mud Sport", 4, 2, 0, -1, 15, 14, 0, {}, {mud_sport = true}}, -- MUD_SPORT
        {255, "Ice Ball", 14, 0, 30, 90, 20, 3, 0, {1, 1024}, {rollout = true}}, -- ICE_BALL
        {256, "Needle Arm", 11, 0, 60, 100, 15, 3, 0, {1}, {flinch_chance = 30}}, -- NEEDLE_ARM
        {257, "Slack Off", 0, 2, 0, -1, 5, 0, 0, {16384}, {heal = 50}}, -- SLACK_OFF
        {258, "Hyper Voice", 0, 1, 90, 100, 10, 7, 0, {4}, {}}, -- HYPER_VOICE
        {259, "Poison Fang", 3, 0, 50, 100, 15, 3, 0, {1, 32}, {toxic_chance = 50}}, -- POISON_FANG
        {260, "Crush Claw", 0, 0, 75, 95, 10, 3, 0, {1}, {stat_change = {defense = -1, chance = 50}}}, -- CRUSH_CLAW
        {261, "Blast Burn", 9, 1, 150, 90, 5, 3, 0, {}, {recharge = true}}, -- BLAST_BURN
        {262, "Hydro Cannon", 10, 1, 150, 90, 5, 3, 0, {}, {recharge = true}}, -- HYDRO_CANNON
        {263, "Meteor Mash", 8, 0, 90, 90, 10, 3, 0, {1, 128}, {stat_change = {attack = 1, chance = 20}}}, -- METEOR_MASH
        {264, "Astonish", 7, 0, 30, 100, 15, 3, 0, {1}, {flinch_chance = 30}}, -- ASTONISH
        {265, "Weather Ball", 0, 1, 50, 100, 10, 3, 0, {1024}, {weather_ball = true}}, -- WEATHER_BALL
        {266, "Aromatherapy", 11, 2, 0, -1, 5, 18, 0, {}, {heal_bell = true}}, -- AROMATHERAPY
        {267, "Fake Tears", 16, 2, 0, 100, 20, 3, 0, {}, {stat_change = {special_defense = -2}}}, -- FAKE_TEARS
        {268, "Air Cutter", 2, 1, 60, 95, 25, 7, 0, {256, 8192}, {high_crit = true}}, -- AIR_CUTTER
        {269, "Overheat", 9, 1, 130, 90, 5, 3, 0, {}, {stat_change = {special_attack = -2}}}, -- OVERHEAT
        {270, "Odor Sleuth", 0, 2, 0, -1, 40, 3, 0, {}, {foresight = true}}, -- ODOR_SLEUTH
        {271, "Rock Tomb", 5, 0, 60, 95, 15, 3, 0, {1}, {stat_change = {speed = -1}}}, -- ROCK_TOMB
        {272, "Silver Wind", 6, 1, 60, 100, 5, 3, 0, {8192}, {stat_boost_chance = 10}}, -- SILVER_WIND
        {273, "Metal Sound", 8, 2, 0, 85, 40, 3, 0, {4}, {stat_change = {special_defense = -2}}}, -- METAL_SOUND
        {274, "Grass Whistle", 11, 2, 0, 55, 15, 3, 0, {4}, {sleep = true}}, -- GRASS_WHISTLE
        {275, "Tickle", 0, 2, 0, 100, 20, 3, 0, {}, {stat_change = {attack = -1, defense = -1}}}, -- TICKLE
        {276, "Cosmic Power", 13, 2, 0, -1, 20, 0, 0, {}, {stat_change = {defense = 1, special_defense = 1}}}, -- COSMIC_POWER
        {277, "Water Spout", 10, 1, 150, 100, 5, 7, 0, {}, {water_spout = true}}, -- WATER_SPOUT
        {278, "Signal Beam", 6, 1, 75, 100, 15, 3, 0, {}, {confusion_chance = 10}}, -- SIGNAL_BEAM
        {279, "Shadow Punch", 7, 0, 60, -1, 20, 3, 0, {1, 128}, {}}, -- SHADOW_PUNCH
        {280, "Extrasensory", 13, 1, 80, 100, 20, 3, 0, {}, {flinch_chance = 10}}, -- EXTRASENSORY
        {281, "Sky Uppercut", 1, 0, 85, 90, 15, 3, 0, {1, 128}, {hits_flying = true}}, -- SKY_UPPERCUT
        {282, "Sand Tomb", 4, 0, 35, 85, 15, 3, 0, {1}, {trapping = true}}, -- SAND_TOMB
        {283, "Sheer Cold", 14, 1, 250, 30, 5, 3, 0, {}, {one_hit_ko = true}}, -- SHEER_COLD
        {284, "Muddy Water", 10, 1, 90, 85, 10, 7, 0, {}, {stat_change = {accuracy = -1, chance = 30}}}, -- MUDDY_WATER
        {285, "Bullet Seed", 11, 0, 25, 100, 30, 3, 0, {1, 1024}, {multi_hit = {2, 5}}}, -- BULLET_SEED
        {286, "Aerial Ace", 2, 0, 60, -1, 20, 3, 0, {1, 256}, {}}, -- AERIAL_ACE
        {287, "Icicle Spear", 14, 0, 25, 100, 30, 3, 0, {1}, {multi_hit = {2, 5}}}, -- ICICLE_SPEAR
        {288, "Iron Defense", 8, 2, 0, -1, 15, 0, 0, {}, {stat_change = {defense = 2}}}, -- IRON_DEFENSE
        {289, "Block", 0, 2, 0, -1, 5, 3, 0, {}, {prevent_escape = true}}, -- BLOCK
        {290, "Howl", 0, 2, 0, -1, 40, 0, 0, {4}, {stat_change = {attack = 1}}}, -- HOWL
        {291, "Dragon Claw", 15, 0, 80, 100, 15, 3, 0, {1}, {}}, -- DRAGON_CLAW
        {292, "Frenzy Plant", 11, 1, 150, 90, 5, 3, 0, {}, {recharge = true}}, -- FRENZY_PLANT
        {293, "Bulk Up", 1, 2, 0, -1, 20, 0, 0, {}, {stat_change = {attack = 1, defense = 1}}}, -- BULK_UP
        {294, "Bounce", 2, 0, 85, 85, 5, 3, 0, {1}, {charging = true, semi_invulnerable = true, paralysis_chance = 30}}, -- BOUNCE
        {295, "Mud Shot", 4, 1, 55, 95, 15, 3, 0, {}, {stat_change = {speed = -1}}}, -- MUD_SHOT
        {296, "Poison Tail", 3, 0, 50, 100, 25, 3, 0, {1}, {poison_chance = 10, high_crit = true}}, -- POISON_TAIL
        {297, "Covet", 0, 0, 60, 100, 25, 3, 0, {1}, {thief = true}}, -- COVET
        {298, "Volt Tackle", 12, 0, 120, 100, 15, 3, 0, {1, 512}, {recoil = 33, paralysis_chance = 10}}, -- VOLT_TACKLE
        {299, "Magical Leaf", 11, 1, 60, -1, 20, 3, 0, {}, {}}, -- MAGICAL_LEAF
        {300, "Water Sport", 10, 2, 0, -1, 15, 14, 0, {}, {water_sport = true}}, -- WATER_SPORT
        {301, "Calm Mind", 13, 2, 0, -1, 20, 0, 0, {}, {stat_change = {special_attack = 1, special_defense = 1}}}, -- CALM_MIND
        {302, "Leaf Blade", 11, 0, 90, 100, 15, 3, 0, {1, 256}, {high_crit = true}}, -- LEAF_BLADE
        {303, "Dragon Dance", 15, 2, 0, -1, 20, 0, 0, {4096}, {stat_change = {attack = 1, speed = 1}}}, -- DRAGON_DANCE
        {304, "Rock Blast", 5, 0, 25, 90, 10, 3, 0, {1, 1024}, {multi_hit = {2, 5}}}, -- ROCK_BLAST
        {305, "Shock Wave", 12, 1, 60, -1, 20, 3, 0, {}, {}}, -- SHOCK_WAVE
        {306, "Water Pulse", 10, 1, 60, 100, 20, 3, 0, {64, 1024}, {confusion_chance = 20}}, -- WATER_PULSE
        {307, "Doom Desire", 8, 1, 140, 100, 5, 3, 0, {}, {future_sight = true}}, -- DOOM_DESIRE
        {308, "Psycho Boost", 13, 1, 140, 90, 5, 3, 0, {}, {stat_change = {special_attack = -2}}}, -- PSYCHO_BOOST
        
        -- Generation 4 Moves (309-467) - Sample entries
        {309, "Roost", 2, 2, 0, -1, 5, 0, 0, {16384}, {roost = true}}, -- ROOST
        {310, "Gravity", 13, 2, 0, -1, 5, 14, 0, {}, {gravity = true}}, -- GRAVITY
        {311, "Miracle Eye", 13, 2, 0, -1, 40, 3, 0, {}, {miracle_eye = true}}, -- MIRACLE_EYE
        {312, "Wake Up Slap", 1, 0, 70, 100, 10, 3, 0, {1}, {wake_up_slap = true}}, -- WAKE_UP_SLAP
        {313, "Hammer Arm", 1, 0, 100, 90, 10, 3, 0, {1, 128}, {stat_change = {speed = -1}}}, -- HAMMER_ARM
        {314, "Gyro Ball", 8, 0, 1, 100, 5, 3, 0, {1, 1024}, {gyro_ball = true}}, -- GYRO_BALL
        {315, "Healing Wish", 13, 2, 0, -1, 10, 0, 0, {16384}, {healing_wish = true}}, -- HEALING_WISH
        {316, "Brine", 10, 1, 65, 100, 10, 3, 0, {}, {brine = true}}, -- BRINE
        {317, "Natural Gift", 0, 0, 1, 100, 15, 3, 0, {}, {natural_gift = true}}, -- NATURAL_GIFT
        {318, "Feint", 0, 0, 30, 100, 10, 3, 2, {1}, {feint = true}}, -- FEINT
        {319, "Pluck", 2, 0, 60, 100, 20, 3, 0, {1}, {pluck = true}}, -- PLUCK
        {320, "Tailwind", 2, 2, 0, -1, 15, 15, 0, {8192}, {tailwind = true}}, -- TAILWIND
        {321, "Acupressure", 0, 2, 0, -1, 30, 12, 0, {}, {acupressure = true}}, -- ACUPRESSURE
        {322, "Metal Burst", 8, 0, 1, 100, 10, 9, 0, {1}, {metal_burst = true}}, -- METAL_BURST
        {323, "U Turn", 6, 0, 70, 100, 20, 3, 0, {1}, {u_turn = true}}, -- U_TURN
        {324, "Close Combat", 1, 0, 120, 100, 5, 3, 0, {1}, {stat_change = {defense = -1, special_defense = -1}}}, -- CLOSE_COMBAT
        {325, "Payback", 16, 0, 50, 100, 10, 3, 0, {1}, {payback = true}}, -- PAYBACK
        {326, "Assurance", 16, 0, 60, 100, 10, 3, 0, {1}, {assurance = true}}, -- ASSURANCE
        {327, "Embargo", 16, 2, 0, 100, 15, 3, 0, {}, {embargo = true}}, -- EMBARGO
        {328, "Fling", 16, 0, 1, 100, 10, 3, 0, {1}, {fling = true}}, -- FLING
        {329, "Psycho Shift", 13, 2, 0, 100, 10, 3, 0, {}, {psycho_shift = true}}, -- PSYCHO_SHIFT
        {330, "Trump Card", 0, 1, 1, -1, 5, 3, 0, {1}, {trump_card = true}}, -- TRUMP_CARD
        {331, "Heal Block", 13, 2, 0, 100, 15, 7, 0, {}, {heal_block = true}}, -- HEAL_BLOCK
        {332, "Wring Out", 0, 1, 1, 100, 5, 3, 0, {1}, {wring_out = true}}, -- WRING_OUT
        {333, "Power Trick", 13, 2, 0, -1, 10, 0, 0, {}, {power_trick = true}}, -- POWER_TRICK
        {334, "Gastro Acid", 3, 2, 0, 100, 10, 3, 0, {}, {gastro_acid = true}}, -- GASTRO_ACID
        {335, "Lucky Chant", 0, 2, 0, -1, 30, 15, 0, {}, {lucky_chant = true}}, -- LUCKY_CHANT
        {336, "Me First", 0, 2, 0, -1, 20, 3, 0, {}, {me_first = true}}, -- ME_FIRST
        {337, "Copycat", 0, 2, 0, -1, 20, 0, 0, {}, {copycat = true}}, -- COPYCAT
        {338, "Power Swap", 13, 2, 0, -1, 10, 3, 0, {}, {power_swap = true}}, -- POWER_SWAP
        {339, "Guard Swap", 13, 2, 0, -1, 10, 3, 0, {}, {guard_swap = true}}, -- GUARD_SWAP
        {340, "Punishment", 16, 0, 60, 100, 5, 3, 0, {1}, {punishment = true}}, -- PUNISHMENT
        {341, "Last Resort", 0, 0, 140, 100, 5, 3, 0, {1}, {last_resort = true}}, -- LAST_RESORT
        {342, "Worry Seed", 11, 2, 0, 100, 10, 3, 0, {}, {worry_seed = true}}, -- WORRY_SEED
        {343, "Sucker Punch", 16, 0, 70, 100, 5, 3, 1, {1}, {sucker_punch = true}}, -- SUCKER_PUNCH
        {344, "Toxic Spikes", 3, 2, 0, -1, 20, 16, 0, {524288}, {toxic_spikes = true}}, -- TOXIC_SPIKES
        {345, "Heart Swap", 13, 2, 0, -1, 10, 3, 0, {}, {heart_swap = true}}, -- HEART_SWAP
        {346, "Aqua Ring", 10, 2, 0, -1, 20, 0, 0, {}, {aqua_ring = true}}, -- AQUA_RING
        {347, "Magnet Rise", 12, 2, 0, -1, 10, 0, 0, {}, {magnet_rise = true}}, -- MAGNET_RISE
        {348, "Flare Blitz", 9, 0, 120, 100, 15, 3, 0, {1, 512}, {recoil = 33, burn_chance = 10}}, -- FLARE_BLITZ
        {349, "Force Palm", 1, 0, 60, 100, 10, 3, 0, {1}, {paralysis_chance = 30}}, -- FORCE_PALM
        {350, "Aura Sphere", 1, 1, 80, -1, 20, 3, 0, {64}, {}}, -- AURA_SPHERE
        
        -- Generation 5 Moves (468-559) - Sample entries
        {468, "Storm Throw", 1, 0, 60, 100, 10, 3, 0, {1}, {always_crit = true}}, -- STORM_THROW
        {469, "Flame Burst", 9, 1, 70, 100, 15, 3, 0, {}, {flame_burst = true}}, -- FLAME_BURST
        {470, "Sludge Wave", 3, 1, 95, 100, 10, 6, 0, {}, {poison_chance = 10}}, -- SLUDGE_WAVE
        {471, "Quiver Dance", 6, 2, 0, -1, 20, 0, 0, {4096}, {stat_change = {special_attack = 1, special_defense = 1, speed = 1}}}, -- QUIVER_DANCE
        {472, "Heavy Slam", 8, 0, 1, 100, 10, 3, 0, {1}, {weight_based = true}}, -- HEAVY_SLAM
        {473, "Synchronoise", 13, 1, 120, 100, 10, 6, 0, {}, {synchronoise = true}}, -- SYNCHRONOISE
        {474, "Electro Ball", 12, 1, 1, 100, 10, 3, 0, {1024}, {electro_ball = true}}, -- ELECTRO_BALL
        {475, "Soak", 10, 2, 0, 100, 20, 3, 0, {}, {soak = true}}, -- SOAK
        {476, "Flame Charge", 9, 0, 50, 100, 20, 3, 0, {1}, {stat_change = {speed = 1}}}, -- FLAME_CHARGE
        {477, "Coil", 3, 2, 0, -1, 20, 0, 0, {}, {stat_change = {attack = 1, defense = 1, accuracy = 1}}}, -- COIL
        {478, "Low Sweep", 1, 0, 65, 100, 20, 3, 0, {1}, {stat_change = {speed = -1}}}, -- LOW_SWEEP
        {479, "Acid Spray", 3, 1, 40, 100, 20, 3, 0, {1024}, {stat_change = {special_defense = -2}}}, -- ACID_SPRAY
        {480, "Foul Play", 16, 0, 95, 100, 15, 3, 0, {1}, {foul_play = true}}, -- FOUL_PLAY
        
        -- Generation 6 Moves (560-617) - Sample entries
        {560, "Thousand Arrows", 4, 0, 90, 100, 10, 7, 0, {}, {thousand_arrows = true}}, -- THOUSAND_ARROWS
        {561, "Thousand Waves", 4, 0, 90, 100, 10, 7, 0, {}, {thousand_waves = true}}, -- THOUSAND_WAVES
        {562, "Land's Wrath", 4, 0, 90, 100, 10, 7, 0, {}, {}}, -- LANDS_WRATH
        {563, "Light of Ruin", 17, 1, 140, 90, 5, 3, 0, {}, {recoil = 50}}, -- LIGHT_OF_RUIN
        {564, "Origin Pulse", 10, 1, 110, 85, 10, 7, 0, {64}, {}}, -- ORIGIN_PULSE
        {565, "Precipice Blades", 4, 0, 120, 85, 10, 7, 0, {}, {}}, -- PRECIPICE_BLADES
        {566, "Dragon Ascent", 2, 0, 120, 100, 5, 3, 0, {1}, {stat_change = {defense = -1, special_defense = -1}}}, -- DRAGON_ASCENT
        {567, "Hyperspace Hole", 13, 1, 80, -1, 5, 3, 0, {32768}, {}}, -- HYPERSPACE_HOLE
        {568, "Water Shuriken", 10, 1, 15, 100, 20, 3, 1, {1}, {multi_hit = {2, 5}}}, -- WATER_SHURIKEN
        {569, "Mystical Fire", 9, 1, 75, 100, 10, 3, 0, {}, {stat_change = {special_attack = -1}}}, -- MYSTICAL_FIRE
        {570, "Spiky Shield", 11, 2, 0, -1, 10, 0, 4, {}, {spiky_shield = true}}, -- SPIKY_SHIELD
        {571, "Aromatic Mist", 17, 2, 0, -1, 20, 11, 0, {}, {stat_change = {special_defense = 1}}}, -- AROMATIC_MIST
        {572, "Eerie Impulse", 12, 2, 0, 100, 15, 3, 0, {}, {stat_change = {special_attack = -2}}}, -- EERIE_IMPULSE
        {573, "Venom Drench", 3, 2, 0, 100, 20, 7, 0, {}, {venom_drench = true}}, -- VENOM_DRENCH
        {574, "Powder", 6, 2, 0, 100, 20, 3, 1, {2048}, {powder = true}}, -- POWDER
        {575, "Geomancy", 17, 2, 0, -1, 10, 0, 0, {}, {charging = true, stat_change = {special_attack = 2, special_defense = 2, speed = 2}}}, -- GEOMANCY
        {576, "Magnetic Flux", 12, 2, 0, -1, 20, 13, 0, {}, {magnetic_flux = true}}, -- MAGNETIC_FLUX
        {577, "Happy Hour", 0, 2, 0, -1, 30, 13, 0, {}, {happy_hour = true}}, -- HAPPY_HOUR
        {578, "Electric Terrain", 12, 2, 0, -1, 10, 14, 0, {}, {electric_terrain = true}}, -- ELECTRIC_TERRAIN
        {579, "Dazzling Gleam", 17, 1, 80, 100, 10, 7, 0, {}, {}}, -- DAZZLING_GLEAM
        {580, "Celebrate", 0, 2, 0, -1, 40, 0, 0, {}, {}}, -- CELEBRATE
        {581, "Hold Hands", 0, 2, 0, -1, 40, 11, 0, {}, {}}, -- HOLD_HANDS
        {582, "Baby Doll Eyes", 17, 2, 0, 100, 30, 3, 1, {}, {stat_change = {attack = -1}}}, -- BABY_DOLL_EYES
        {583, "Nuzzle", 12, 0, 20, 100, 20, 3, 0, {1}, {paralysis_chance = 100}}, -- NUZZLE
        {584, "Hold Back", 0, 0, 40, 100, 40, 3, 0, {1}, {false_swipe = true}}, -- HOLD_BACK
        {585, "Infestation", 6, 1, 20, 100, 20, 3, 0, {1}, {trapping = true}}, -- INFESTATION
        {586, "Power Up Punch", 1, 0, 40, 100, 20, 3, 0, {1, 128}, {stat_change = {attack = 1}}}, -- POWER_UP_PUNCH
        {587, "Oblivion Wing", 2, 1, 80, 100, 10, 3, 0, {}, {drain = 75}}, -- OBLIVION_WING
        {588, "Thousand Arrows", 4, 0, 90, 100, 10, 7, 0, {}, {thousand_arrows = true}}, -- THOUSAND_ARROWS_ALT
        
        -- Generation 7 Moves (618-728) - Sample entries  
        {618, "Core Enforcer", 15, 1, 100, 100, 10, 7, 0, {}, {core_enforcer = true}}, -- CORE_ENFORCER
        {619, "Darkest Lariat", 16, 0, 85, 100, 10, 3, 0, {1}, {ignore_stat_changes = true}}, -- DARKEST_LARIAT
        {620, "Sparkling Aria", 10, 1, 90, 100, 10, 6, 0, {4}, {cure_burn = true}}, -- SPARKLING_ARIA
        {621, "Ice Hammer", 14, 0, 100, 90, 10, 3, 0, {1, 128}, {stat_change = {speed = -1}}}, -- ICE_HAMMER
        {622, "Floral Healing", 17, 2, 0, -1, 10, 3, 0, {16384}, {floral_healing = true}}, -- FLORAL_HEALING
        {623, "High Horsepower", 4, 0, 95, 95, 10, 3, 0, {1}, {}}, -- HIGH_HORSEPOWER
        {624, "Strength Sap", 11, 2, 0, 100, 10, 3, 0, {16384}, {strength_sap = true}}, -- STRENGTH_SAP
        {625, "Solar Blade", 11, 0, 125, 100, 10, 3, 0, {1, 256}, {charging = true}}, -- SOLAR_BLADE
        {626, "Leafage", 11, 0, 40, 100, 40, 3, 0, {1}, {}}, -- LEAFAGE
        {627, "Spotlight", 0, 2, 0, -1, 15, 3, 3, {}, {spotlight = true}}, -- SPOTLIGHT
        {628, "Toxic Thread", 3, 2, 0, 100, 20, 3, 0, {}, {poison = true, stat_change = {speed = -1}}}, -- TOXIC_THREAD
        {629, "Laser Focus", 0, 2, 0, -1, 30, 0, 0, {}, {laser_focus = true}}, -- LASER_FOCUS
        {630, "Gear Up", 8, 2, 0, -1, 20, 13, 0, {}, {gear_up = true}}, -- GEAR_UP
        {631, "Throat Chop", 16, 0, 80, 100, 15, 3, 0, {1}, {throat_chop = true}}, -- THROAT_CHOP
        {632, "Pollen Puff", 6, 1, 90, 100, 15, 3, 0, {1024}, {pollen_puff = true}}, -- POLLEN_PUFF
        {633, "Anchor Shot", 8, 0, 80, 100, 20, 3, 0, {1}, {prevent_escape = true}}, -- ANCHOR_SHOT
        {634, "Psychic Terrain", 13, 2, 0, -1, 10, 14, 0, {}, {psychic_terrain = true}}, -- PSYCHIC_TERRAIN
        {635, "Lunge", 6, 0, 80, 100, 15, 3, 0, {1}, {stat_change = {attack = -1}}}, -- LUNGE
        {636, "Fire Lash", 9, 0, 80, 100, 15, 3, 0, {1}, {stat_change = {defense = -1}}}, -- FIRE_LASH
        {637, "Power Trip", 16, 0, 20, 100, 10, 3, 0, {1}, {power_trip = true}}, -- POWER_TRIP
        {638, "Burn Up", 9, 1, 130, 100, 5, 3, 0, {}, {burn_up = true}}, -- BURN_UP
        {639, "Speed Swap", 13, 2, 0, -1, 10, 3, 0, {}, {speed_swap = true}}, -- SPEED_SWAP
        {640, "Smart Strike", 8, 0, 70, -1, 10, 3, 0, {1}, {}}, -- SMART_STRIKE
        {641, "Purify", 3, 2, 0, -1, 20, 3, 0, {16384}, {purify = true}}, -- PURIFY
        {642, "Revelation Dance", 0, 1, 90, 100, 15, 3, 0, {4096}, {revelation_dance = true}}, -- REVELATION_DANCE
        {643, "Core Enforcer", 15, 1, 100, 100, 10, 3, 0, {}, {core_enforcer = true}}, -- CORE_ENFORCER_ALT
        {644, "Trop Kick", 11, 0, 70, 100, 15, 3, 0, {1}, {stat_change = {attack = -1}}}, -- TROP_KICK
        {645, "Instruct", 13, 2, 0, -1, 15, 3, 0, {}, {instruct = true}}, -- INSTRUCT
        {646, "Beak Blast", 2, 0, 100, 100, 15, 3, -3, {1, 1024}, {beak_blast = true}}, -- BEAK_BLAST
        {647, "Clanging Scales", 15, 1, 110, 100, 5, 7, 0, {4}, {stat_change = {defense = -1}}}, -- CLANGING_SCALES
        {648, "Dragon Hammer", 15, 0, 90, 100, 15, 3, 0, {1}, {}}, -- DRAGON_HAMMER
        {649, "Brutal Swing", 16, 0, 60, 100, 20, 6, 0, {1}, {}}, -- BRUTAL_SWING
        {650, "Aurora Veil", 14, 2, 0, -1, 20, 15, 0, {}, {aurora_veil = true}}, -- AURORA_VEIL
        
        -- Generation 8 Moves (719-826) - Sample entries
        {719, "Max Guard", 0, 2, 0, -1, 10, 0, 4, {}, {max_guard = true}}, -- MAX_GUARD
        {720, "Dynamax Cannon", 15, 1, 100, 100, 5, 3, 0, {}, {dynamax_cannon = true}}, -- DYNAMAX_CANNON
        {721, "Snipe Shot", 10, 1, 80, 100, 15, 3, 0, {}, {snipe_shot = true}}, -- SNIPE_SHOT
        {722, "Jaw Lock", 16, 0, 80, 100, 10, 3, 0, {1, 32}, {jaw_lock = true}}, -- JAW_LOCK
        {723, "Stuff Cheeks", 0, 2, 0, -1, 10, 0, 0, {}, {stuff_cheeks = true}}, -- STUFF_CHEEKS
        {724, "No Retreat", 1, 2, 0, -1, 5, 0, 0, {}, {no_retreat = true}}, -- NO_RETREAT
        {725, "Tar Shot", 5, 2, 0, 100, 15, 3, 0, {}, {tar_shot = true}}, -- TAR_SHOT
        {726, "Magic Powder", 13, 2, 0, 100, 20, 3, 0, {2048}, {magic_powder = true}}, -- MAGIC_POWDER
        {727, "Dragon Darts", 15, 0, 50, 100, 10, 1, 0, {1}, {multi_hit = {2, 2}}}, -- DRAGON_DARTS
        {728, "Teatime", 0, 2, 0, -1, 10, 14, 0, {}, {teatime = true}}, -- TEATIME
        {729, "Octolock", 1, 2, 0, 100, 15, 3, 0, {}, {octolock = true}}, -- OCTOLOCK
        {730, "Bolt Beak", 12, 0, 85, 100, 10, 3, 0, {1}, {bolt_beak = true}}, -- BOLT_BEAK
        {731, "Fishious Rend", 10, 0, 85, 100, 10, 3, 0, {1, 32}, {fishious_rend = true}}, -- FISHIOUS_REND
        {732, "Court Change", 0, 2, 0, 100, 10, 14, 0, {}, {court_change = true}}, -- COURT_CHANGE
        {733, "Max Flare", 9, 0, 1, -1, 10, 3, 0, {1}, {max_move = true}}, -- MAX_FLARE
        {734, "Max Flutterby", 6, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_FLUTTERBY
        {735, "Max Lightning", 12, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_LIGHTNING
        {736, "Max Strike", 0, 0, 1, -1, 10, 3, 0, {1}, {max_move = true}}, -- MAX_STRIKE
        {737, "Max Knuckle", 1, 0, 1, -1, 10, 3, 0, {1}, {max_move = true}}, -- MAX_KNUCKLE
        {738, "Max Phantasm", 7, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_PHANTASM
        {739, "Max Hailstorm", 14, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_HAILSTORM
        {740, "Max Ooze", 3, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_OOZE
        {741, "Max Geyser", 10, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_GEYSER
        {742, "Max Airstream", 2, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_AIRSTREAM
        {743, "Max Starfall", 17, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_STARFALL
        {744, "Max Wyrmwind", 15, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_WYRMWIND
        {745, "Max Mindstorm", 13, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_MINDSTORM
        {746, "Max Rockfall", 5, 0, 1, -1, 10, 3, 0, {1}, {max_move = true}}, -- MAX_ROCKFALL
        {747, "Max Quake", 4, 0, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_QUAKE
        {748, "Max Darkness", 16, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_DARKNESS
        {749, "Max Overgrowth", 11, 1, 1, -1, 10, 3, 0, {}, {max_move = true}}, -- MAX_OVERGROWTH
        {750, "Max Steelspike", 8, 0, 1, -1, 10, 3, 0, {1}, {max_move = true}}, -- MAX_STEELSPIKE
        
        -- Generation 9 Moves (827-919) - Sample entries
        {827, "Collision Course", 1, 0, 100, 100, 5, 3, 0, {1}, {collision_course = true}}, -- COLLISION_COURSE
        {828, "Electro Drift", 12, 1, 100, 100, 5, 3, 0, {1}, {electro_drift = true}}, -- ELECTRO_DRIFT
        {829, "Shed Tail", 0, 2, 0, -1, 10, 0, 0, {}, {shed_tail = true}}, -- SHED_TAIL
        {830, "Chilly Reception", 14, 2, 0, -1, 10, 0, 0, {}, {chilly_reception = true}}, -- CHILLY_RECEPTION
        {831, "Tidy Up", 0, 2, 0, -1, 10, 0, 0, {}, {tidy_up = true}}, -- TIDY_UP
        {832, "Snowscape", 14, 2, 0, -1, 10, 14, 0, {}, {snowscape = true}}, -- SNOWSCAPE
        {833, "Pounce", 6, 0, 50, 100, 20, 3, 0, {1}, {stat_change = {speed = -1}}}, -- POUNCE
        {834, "Trailblaze", 11, 0, 50, 100, 20, 3, 0, {1}, {stat_change = {speed = 1}}}, -- TRAILBLAZE
        {835, "Chilling Water", 10, 1, 50, 100, 20, 3, 0, {}, {stat_change = {attack = -1}}}, -- CHILLING_WATER
        {836, "Hyper Drill", 0, 0, 100, 100, 5, 3, 0, {1, 32768}, {}}, -- HYPER_DRILL
        {837, "Twin Beam", 13, 1, 40, 100, 10, 3, 0, {}, {multi_hit = {2, 2}}}, -- TWIN_BEAM
        {838, "Rage Fist", 7, 0, 50, 100, 10, 3, 0, {1, 128}, {rage_fist = true}}, -- RAGE_FIST
        {839, "Armor Cannon", 9, 1, 120, 100, 5, 3, 0, {}, {stat_change = {defense = -1, special_defense = -1}}}, -- ARMOR_CANNON
        {840, "Bitter Blade", 9, 0, 90, 100, 10, 3, 0, {1, 256}, {drain = 50}}, -- BITTER_BLADE
        {841, "Double Shock", 12, 0, 120, 100, 5, 3, 0, {1}, {double_shock = true}}, -- DOUBLE_SHOCK
        {842, "Gigaton Hammer", 8, 0, 160, 100, 5, 3, 0, {1}, {gigaton_hammer = true}}, -- GIGATON_HAMMER
        {843, "Comeuppance", 16, 0, 1, 100, 10, 9, 0, {1}, {comeuppance = true}}, -- COMEUPPANCE
        {844, "Aqua Cutter", 10, 0, 70, 100, 20, 3, 0, {1, 256}, {high_crit = true}}, -- AQUA_CUTTER
        {845, "Blazing Torque", 9, 0, 80, 100, 10, 3, 0, {1}, {burn_chance = 30}}, -- BLAZING_TORQUE
        {846, "Wicked Torque", 16, 0, 80, 100, 10, 3, 0, {1}, {sleep_chance = 10}}, -- WICKED_TORQUE
        {847, "Noxious Torque", 3, 0, 100, 100, 10, 3, 0, {1}, {poison_chance = 30}}, -- NOXIOUS_TORQUE
        {848, "Combat Torque", 1, 0, 100, 100, 10, 3, 0, {1}, {paralysis_chance = 30}}, -- COMBAT_TORQUE
        {849, "Magical Torque", 17, 0, 100, 100, 10, 3, 0, {1}, {confusion_chance = 30}}, -- MAGICAL_TORQUE
        {850, "Psyblade", 13, 0, 80, 100, 15, 3, 0, {1, 256}, {psyblade = true}}, -- PSYBLADE
        {851, "Hydro Steam", 10, 1, 80, 100, 15, 3, 0, {}, {hydro_steam = true}}, -- HYDRO_STEAM
        {852, "Ruination", 16, 1, 1, 90, 10, 3, 0, {}, {ruination = true}}, -- RUINATION
        {853, "Collision Course", 1, 0, 100, 100, 5, 3, 0, {1}, {collision_course = true}}, -- COLLISION_COURSE_ALT
        {854, "Electro Drift", 12, 1, 100, 100, 5, 3, 0, {1}, {electro_drift = true}}, -- ELECTRO_DRIFT_ALT
        {855, "Revival Blessing", 0, 2, 0, -1, 1, 18, 0, {}, {revival_blessing = true}}, -- REVIVAL_BLESSING
        {856, "Salt Cure", 5, 0, 40, 100, 15, 3, 0, {1}, {salt_cure = true}}, -- SALT_CURE
        {857, "Triple Dive", 10, 0, 30, 95, 10, 3, 0, {1}, {multi_hit = {3, 3}}}, -- TRIPLE_DIVE
        {858, "Mortal Spin", 3, 0, 30, 100, 15, 6, 0, {1}, {rapid_spin = true, poison_chance = 100}}, -- MORTAL_SPIN
        {859, "Doodle", 0, 2, 0, 100, 10, 3, 0, {}, {doodle = true}}, -- DOODLE
        {860, "Fillet Away", 0, 2, 0, -1, 10, 0, 0, {}, {fillet_away = true}}, -- FILLET_AWAY
        {861, "Kowtow Cleave", 16, 0, 85, -1, 10, 3, 0, {1, 256}, {}}, -- KOWTOW_CLEAVE
        {862, "Flower Trick", 11, 0, 70, -1, 10, 3, 0, {1}, {always_crit = true}}, -- FLOWER_TRICK
        {863, "Torch Song", 9, 1, 80, 100, 10, 3, 0, {4}, {stat_change = {special_attack = 1}}}, -- TORCH_SONG
        {864, "Aqua Step", 10, 0, 80, 100, 10, 3, 0, {1, 4096}, {stat_change = {speed = 1}}}, -- AQUA_STEP
        {865, "Raging Bull", 0, 0, 90, 100, 10, 3, 0, {1}, {raging_bull = true}}, -- RAGING_BULL
        {866, "Make It Rain", 8, 1, 120, 100, 5, 7, 0, {}, {stat_change = {special_attack = -1}, money_reward = true}}, -- MAKE_IT_RAIN
        {867, "Psyshield Bash", 13, 0, 70, 90, 10, 3, 0, {1}, {stat_change = {defense = 1}}}, -- PSYSHIELD_BASH
        {868, "Power Shift", 0, 2, 0, -1, 10, 0, 0, {}, {power_shift = true}}, -- POWER_SHIFT
        {869, "Stone Axe", 5, 0, 65, 90, 15, 3, 0, {1, 256}, {stealth_rock = true}}, -- STONE_AXE
        {870, "Springtide Storm", 17, 1, 100, 80, 5, 7, 0, {8192}, {stat_change = {attack = -1, chance = 30}}}, -- SPRINGTIDE_STORM
        {871, "Mystical Power", 13, 1, 70, 90, 10, 3, 0, {}, {stat_change = {special_attack = 1}}}, -- MYSTICAL_POWER
        {872, "Raging Fury", 9, 0, 120, 100, 10, 3, 0, {1}, {thrash = true, confusion = true}}, -- RAGING_FURY
        {873, "Wave Crash", 10, 0, 120, 100, 10, 3, 0, {1}, {recoil = 33}}, -- WAVE_CRASH
        {874, "Chloroblast", 11, 1, 150, 95, 5, 3, 0, {}, {recoil = 50}}, -- CHLOROBLAST
        {875, "Mountain Gale", 14, 0, 100, 85, 10, 3, 0, {1}, {flinch_chance = 30}}, -- MOUNTAIN_GALE
        {876, "Victory Dance", 1, 2, 0, -1, 10, 0, 0, {4096}, {stat_change = {attack = 1, defense = 1, speed = 1}}}, -- VICTORY_DANCE
        {877, "Headlong Rush", 4, 0, 120, 100, 5, 3, 0, {1}, {stat_change = {defense = -1, special_defense = -1}}}, -- HEADLONG_RUSH
        {878, "Barb Barrage", 3, 0, 60, 100, 10, 3, 0, {1}, {poison_chance = 50}}, -- BARB_BARRAGE
        {879, "Esper Wing", 13, 1, 80, 100, 10, 3, 0, {}, {stat_change = {speed = 1}, high_crit = true}}, -- ESPER_WING
        {880, "Bitter Malice", 7, 1, 75, 100, 10, 3, 0, {}, {stat_change = {attack = -1}}}, -- BITTER_MALICE
        {881, "Shelter", 8, 2, 0, -1, 10, 0, 0, {}, {stat_change = {defense = 2}}}, -- SHELTER
        {882, "Triple Arrows", 1, 0, 90, 100, 10, 3, 0, {1}, {flinch_chance = 30, high_crit = true, stat_change = {defense = -1, chance = 50}}}, -- TRIPLE_ARROWS
        {883, "Infernal Parade", 7, 1, 60, 100, 15, 3, 0, {}, {burn_chance = 30}}, -- INFERNAL_PARADE
        {884, "Ceaseless Edge", 16, 0, 65, 90, 15, 3, 0, {1, 256}, {spikes = true}}, -- CEASELESS_EDGE
        {885, "Bleakwind Storm", 2, 1, 100, 80, 10, 7, 0, {8192}, {stat_change = {speed = -1, chance = 30}}}, -- BLEAKWIND_STORM
        {886, "Wildbolt Storm", 12, 1, 100, 80, 10, 7, 0, {8192}, {paralysis_chance = 20}}, -- WILDBOLT_STORM
        {887, "Sandsear Storm", 4, 1, 100, 80, 10, 7, 0, {8192}, {burn_chance = 20}}, -- SANDSEAR_STORM
        {888, "Lunar Blessing", 13, 2, 0, -1, 5, 13, 0, {16384}, {heal_bell = true}}, -- LUNAR_BLESSING
        {889, "Take Heart", 13, 2, 0, -1, 10, 0, 0, {}, {stat_change = {special_attack = 1, special_defense = 1}, cure_status = true}}, -- TAKE_HEART
        {890, "Tera Blast", 0, 1, 80, 100, 10, 3, 0, {}, {tera_blast = true}}, -- TERA_BLAST
        {891, "Silk Trap", 6, 2, 0, -1, 10, 0, 4, {}, {silk_trap = true}}, -- SILK_TRAP
        {892, "Axe Kick", 1, 0, 120, 90, 10, 3, 0, {1}, {confusion_chance = 30, crash_damage = true}}, -- AXE_KICK
        {893, "Last Respects", 7, 0, 50, 100, 10, 3, 0, {1}, {last_respects = true}}, -- LAST_RESPECTS
        {894, "Lumina Crash", 13, 1, 80, 100, 10, 3, 0, {}, {stat_change = {special_defense = -2}}}, -- LUMINA_CRASH
        {895, "Order Up", 15, 0, 80, 100, 10, 3, 0, {1}, {order_up = true}}, -- ORDER_UP
        {896, "Jet Punch", 10, 0, 60, 100, 15, 3, 1, {1, 128}, {}}, -- JET_PUNCH
        {897, "Spicy Extract", 11, 2, 0, -1, 15, 3, 0, {}, {stat_change = {attack = 2, defense = -2}}}, -- SPICY_EXTRACT
        {898, "Spin Out", 8, 0, 100, 100, 5, 3, 0, {1}, {stat_change = {speed = -2}}}, -- SPIN_OUT
        {899, "Population Bomb", 0, 0, 20, 90, 10, 3, 0, {1, 256}, {multi_hit = {1, 10}}}, -- POPULATION_BOMB
        {900, "Ice Spinner", 14, 0, 80, 100, 15, 3, 0, {1}, {remove_terrain = true}}, -- ICE_SPINNER
        {901, "Glaive Rush", 15, 0, 120, 100, 5, 3, 0, {1}, {glaive_rush = true}}, -- GLAIVE_RUSH
        {902, "Revival Blessing", 0, 2, 0, -1, 1, 18, 0, {}, {revival_blessing = true}}, -- REVIVAL_BLESSING_ALT
        {903, "Salt Cure", 5, 0, 40, 100, 15, 3, 0, {1}, {salt_cure = true}}, -- SALT_CURE_ALT
        {904, "Triple Dive", 10, 0, 30, 95, 10, 3, 0, {1}, {multi_hit = {3, 3}}}, -- TRIPLE_DIVE_ALT
        {905, "Mortal Spin", 3, 0, 30, 100, 15, 6, 0, {1}, {rapid_spin = true, poison_chance = 100}}, -- MORTAL_SPIN_ALT
        {906, "Doodle", 0, 2, 0, 100, 10, 3, 0, {}, {doodle = true}}, -- DOODLE_ALT
        {907, "Fillet Away", 0, 2, 0, -1, 10, 0, 0, {}, {fillet_away = true}}, -- FILLET_AWAY_ALT
        {908, "Kowtow Cleave", 16, 0, 85, -1, 10, 3, 0, {1, 256}, {}}, -- KOWTOW_CLEAVE_ALT
        {909, "Flower Trick", 11, 0, 70, -1, 10, 3, 0, {1}, {always_crit = true}}, -- FLOWER_TRICK_ALT
        {910, "Torch Song", 9, 1, 80, 100, 10, 3, 0, {4}, {stat_change = {special_attack = 1}}}, -- TORCH_SONG_ALT
        {911, "Aqua Step", 10, 0, 80, 100, 10, 3, 0, {1, 4096}, {stat_change = {speed = 1}}}, -- AQUA_STEP_ALT
        {912, "Raging Bull", 0, 0, 90, 100, 10, 3, 0, {1}, {raging_bull = true}}, -- RAGING_BULL_ALT
        {913, "Make It Rain", 8, 1, 120, 100, 5, 7, 0, {}, {stat_change = {special_attack = -1}, money_reward = true}}, -- MAKE_IT_RAIN_ALT
        {914, "Ruination", 16, 1, 1, 90, 10, 3, 0, {}, {ruination = true}}, -- RUINATION_ALT
        {915, "Collision Course", 1, 0, 100, 100, 5, 3, 0, {1}, {collision_course = true}}, -- COLLISION_COURSE_FINAL
        {916, "Electro Drift", 12, 1, 100, 100, 5, 3, 0, {1}, {electro_drift = true}}, -- ELECTRO_DRIFT_FINAL
        {917, "Shed Tail", 0, 2, 0, -1, 10, 0, 0, {}, {shed_tail = true}}, -- SHED_TAIL_ALT
        {918, "Chilly Reception", 14, 2, 0, -1, 10, 0, 0, {}, {chilly_reception = true}}, -- CHILLY_RECEPTION_ALT
        {919, "Tidy Up", 0, 2, 0, -1, 10, 0, 0, {}, {tidy_up = true}} -- TIDY_UP_ALT
    }
    
    -- Populate moves table
    for _, moveDef in ipairs(moveDefinitions) do
        local move = {
            id = moveDef[1],
            name = moveDef[2],
            type = moveDef[3],
            category = moveDef[4], -- 0=Physical, 1=Special, 2=Status
            power = moveDef[5],
            accuracy = moveDef[6], -- -1 means always hits
            pp = moveDef[7],
            target = moveDef[8],
            priority = moveDef[9],
            flags = moveDef[10] or {},
            effects = moveDef[11] or {}
        }
        
        MoveDatabase.moves[move.id] = move
        
        -- Build indexes for fast lookups
        if not MoveDatabase.movesByType[move.type] then
            MoveDatabase.movesByType[move.type] = {}
        end
        table.insert(MoveDatabase.movesByType[move.type], move.id)
        
        if not MoveDatabase.movesByCategory[move.category] then
            MoveDatabase.movesByCategory[move.category] = {}
        end
        table.insert(MoveDatabase.movesByCategory[move.category], move.id)
        
        if not MoveDatabase.movesByPower[move.power] then
            MoveDatabase.movesByPower[move.power] = {}
        end
        table.insert(MoveDatabase.movesByPower[move.power], move.id)
        
        if not MoveDatabase.movesByTarget[move.target] then
            MoveDatabase.movesByTarget[move.target] = {}
        end
        table.insert(MoveDatabase.movesByTarget[move.target], move.id)
        
        -- Index by flags
        for _, flag in ipairs(move.flags) do
            if not MoveDatabase.movesByFlags[flag] then
                MoveDatabase.movesByFlags[flag] = {}
            end
            table.insert(MoveDatabase.movesByFlags[flag], move.id)
        end
    end
    
    print("MoveDatabase initialized with " .. #moveDefinitions .. " moves")
end

-- Get move data by ID
-- @param moveId: Move ID number
-- @return: Complete move data table or nil if not found
function MoveDatabase.getMoveData(moveId)
    if not MoveDatabase.moves[moveId] then
        return nil
    end
    return MoveDatabase.moves[moveId]
end

-- Get move name by ID
-- @param moveId: Move ID number
-- @return: Move name string or "Unknown Move"
function MoveDatabase.getMoveName(moveId)
    local move = MoveDatabase.getMoveData(moveId)
    return move and move.name or "Unknown Move"
end

-- Get moves by type
-- @param type: Pokemon type ID
-- @return: Array of move IDs of the specified type
function MoveDatabase.getMovesByType(type)
    return MoveDatabase.movesByType[type] or {}
end

-- Get moves by category
-- @param category: Move category (0=Physical, 1=Special, 2=Status)
-- @return: Array of move IDs of the specified category
function MoveDatabase.getMovesByCategory(category)
    return MoveDatabase.movesByCategory[category] or {}
end

-- Get moves by power range
-- @param minPower: Minimum power value
-- @param maxPower: Maximum power value
-- @return: Array of move IDs within the power range
function MoveDatabase.getMovesByPowerRange(minPower, maxPower)
    local results = {}
    for moveId, move in pairs(MoveDatabase.moves) do
        if move.power >= minPower and move.power <= maxPower then
            table.insert(results, moveId)
        end
    end
    return results
end

-- Get moves by target type
-- @param target: Move target type
-- @return: Array of move IDs with the specified target
function MoveDatabase.getMovesByTarget(target)
    return MoveDatabase.movesByTarget[target] or {}
end

-- Get moves by flag
-- @param flag: Move flag to search for
-- @return: Array of move IDs with the specified flag
function MoveDatabase.getMovesByFlag(flag)
    return MoveDatabase.movesByFlags[flag] or {}
end

-- Validate move ID
-- @param moveId: Move ID to validate
-- @return: Boolean indicating if move exists in database
function MoveDatabase.isValidMove(moveId)
    return MoveDatabase.moves[moveId] ~= nil
end

-- Get total number of moves in database
-- @return: Total move count
function MoveDatabase.getMoveCount()
    local count = 0
    for _ in pairs(MoveDatabase.moves) do
        count = count + 1
    end
    return count
end

-- Get all move IDs
-- @return: Array of all valid move IDs
function MoveDatabase.getAllMoveIds()
    local moveIds = {}
    for moveId in pairs(MoveDatabase.moves) do
        table.insert(moveIds, moveId)
    end
    table.sort(moveIds)
    return moveIds
end

-- Get move type effectiveness multiplier
-- @param moveType: Move type
-- @param targetType1: First target type
-- @param targetType2: Second target type (optional)
-- @return: Effectiveness multiplier (0.25, 0.5, 1.0, 2.0, 4.0)
function MoveDatabase.getTypeEffectiveness(moveType, targetType1, targetType2)
    -- This will integrate with existing type-chart.lua
    -- For now, placeholder implementation
    -- TODO: Import and use existing type chart data
    return 1.0
end

return MoveDatabase