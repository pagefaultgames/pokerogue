import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";

/**
 * If a species is in here, during moveset generation, the signature move will be forced with x% probability before any other moves are added
 *
 * @privateRemarks
 * If multiple moves are in the map, those that the species can learn will be selected with equal probability.
 */
export const FORCED_SIGNATURE_MOVES: Partial<Record<SpeciesId, MoveId | MoveId[]>> = {
// These moves are vitally important due to form interactions so they're listed separately
  [SpeciesId.CASTFORM]: MoveId.WEATHER_BALL,
  [SpeciesId.ORICORIO]: MoveId.REVELATION_DANCE,
  [SpeciesId.PALDEA_TAUROS]: MoveId.RAGING_BULL,
  [SpeciesId.ARCEUS]: MoveId.JUDGMENT,
  [SpeciesId.SILVALLY]: MoveId.MULTI_ATTACK,
  [SpeciesId.MORPEKO]: MoveId.AURA_WHEEL,
  [SpeciesId.AEGISLASH]: MoveId.KINGS_SHIELD,
  [SpeciesId.GENESECT]: MoveId.TECHNO_BLAST,
  [SpeciesId.CRAMORANT]: [MoveId.SURF, MoveId.DIVE],
  [SpeciesId.OGERPON]: MoveId.IVY_CUDGEL,
  // Significant ability interaction
  [SpeciesId.DHELMISE]: MoveId.ANCHOR_SHOT,

  // It's OKAY for forms-specific moves on RHS. If the base species can't learn it, it just won't be forced.

  // Starters
  [SpeciesId.HISUI_SAMUROTT]: [MoveId.RAZOR_SHELL, MoveId.CEASELESS_EDGE],
  [SpeciesId.DECIDUEYE]: MoveId.SPIRIT_SHACKLE,
  [SpeciesId.HISUI_DECIDUEYE]: MoveId.TRIPLE_ARROWS,
  [SpeciesId.CINDERACE]: MoveId.PYRO_BALL,
  [SpeciesId.INTELEON]: MoveId.SNIPE_SHOT,
  [SpeciesId.MEOWSCARADA]: MoveId.FLOWER_TRICK,
  [SpeciesId.SKELEDIRGE]: MoveId.TORCH_SONG,
  [SpeciesId.QUAQUAVAL]: MoveId.AQUA_STEP,

  // Note: Putting the same move multiple times means it is more likely to be randomly selected
  [SpeciesId.KOMMO_O]: [MoveId.CLANGING_SCALES, MoveId.CLANGOROUS_SOUL, MoveId.CLANGOROUS_SOUL],

  [SpeciesId.FLAPPLE]: MoveId.GRAV_APPLE,
  [SpeciesId.APPLETUN]: MoveId.APPLE_ACID,
  [SpeciesId.DIPPLIN]: MoveId.SYRUP_BOMB,
  [SpeciesId.HYDRAPPLE]: MoveId.FICKLE_BEAM,

  // Spores
  [SpeciesId.PARASECT]: MoveId.SPORE,
  [SpeciesId.AMOONGUSS]: [MoveId.SPORE, MoveId.TOXIC],
  [SpeciesId.SHIINOTIC]: MoveId.SPORE,
  [SpeciesId.TOEDSCRUEL]: MoveId.SPORE,

  // Misc sig moves
  [SpeciesId.VESPIQUEN]: [MoveId.ATTACK_ORDER, MoveId.DEFEND_ORDER, MoveId.HEAL_ORDER],
  [SpeciesId.CHATOT]: MoveId.CHATTER,
  [SpeciesId.KLINK]: MoveId.GEAR_GRIND,
  [SpeciesId.KLANG]: MoveId.GEAR_GRIND,
  [SpeciesId.KLINKLANG]: MoveId.GEAR_GRIND,
  [SpeciesId.BOUFFALANT]: MoveId.HEAD_CHARGE,
  [SpeciesId.VOLCARONA]: MoveId.FIERY_DANCE,
  [SpeciesId.TOUCANNON]: MoveId.BEAK_BLAST,
  [SpeciesId.TOGEDEMARU]: MoveId.ZING_ZAP,
  [SpeciesId.BRUXISH]: MoveId.PSYCHIC_FANGS,
  [SpeciesId.CRABOMINABLE]: MoveId.ICE_HAMMER,
  [SpeciesId.NACLSTACK]: MoveId.SALT_CURE,
  [SpeciesId.GARGANACL]: MoveId.SALT_CURE,
  [SpeciesId.ARMAROUGE]: MoveId.ARMOR_CANNON,
  [SpeciesId.CERULEDGE]: MoveId.BITTER_BLADE,
  [SpeciesId.ESPATHRA]: MoveId.LUMINA_CRASH,
  [SpeciesId.TINKATON]: MoveId.GIGATON_HAMMER,
  [SpeciesId.PALAFIN]: MoveId.JET_PUNCH,
  [SpeciesId.GHOLDENGO]: MoveId.MAKE_IT_RAIN,
  [SpeciesId.SINISTCHA]: MoveId.MATCHA_GOTCHA,
  [SpeciesId.MALAMAR]: MoveId.TOPSY_TURVY,
  [SpeciesId.TOGEDEMARU]: MoveId.ZING_ZAP,
  [SpeciesId.WUGTRIO]: MoveId.TRIPLE_DIVE,
  [SpeciesId.REVAVROOM]: [
    MoveId.SPIN_OUT,
    MoveId.COMBAT_TORQUE,
    MoveId.MAGICAL_TORQUE,
    MoveId.NOXIOUS_TORQUE,
    MoveId.WICKED_TORQUE,
    MoveId.BLAZING_TORQUE,
  ],
  [SpeciesId.ROTOM]: [MoveId.BLIZZARD, MoveId.AIR_SLASH, MoveId.OVERHEAT, MoveId.HYDRO_PUMP, MoveId.LEAF_STORM],

  // Regionals and whatnot
  [SpeciesId.ALOLA_MAROWAK]: MoveId.SHADOW_BONE,
  [SpeciesId.GALAR_SLOWBRO]: MoveId.SHELL_SIDE_ARM,
  [SpeciesId.HISUI_BRAVIARY]: MoveId.ESPER_WING,
  [SpeciesId.OBSTAGOON]: MoveId.OBSTRUCT,
  [SpeciesId.WYRDEER]: MoveId.PSYSHIELD_BASH,
  [SpeciesId.SNEASLER]: MoveId.DIRE_CLAW,
  [SpeciesId.KLEAVOR]: MoveId.STONE_AXE,

  [SpeciesId.BLOODMOON_URSALUNA]: MoveId.BLOOD_MOON,

  // UBs
  [SpeciesId.KARTANA]: [MoveId.LEAF_BLADE, MoveId.SMART_STRIKE],

  // Paradox Mons
  [SpeciesId.IRON_MOTH]: MoveId.FIERY_DANCE,
  [SpeciesId.IRON_LEAVES]: MoveId.PSYBLADE,
  [SpeciesId.GOUGING_FIRE]: MoveId.BURNING_BULWARK,
  [SpeciesId.IRON_BOULDER]: MoveId.MIGHTY_CLEAVE,
  [SpeciesId.IRON_CROWN]: MoveId.TACHYON_CUTTER,

  // Gen 2/3 Legends and Galarian birds
  [SpeciesId.LUGIA]: MoveId.AEROBLAST,
  [SpeciesId.HO_OH]: MoveId.SACRED_FIRE,
  [SpeciesId.LATIAS]: MoveId.MIST_BALL,
  [SpeciesId.LATIOS]: MoveId.LUSTER_PURGE,
  [SpeciesId.GALAR_ARTICUNO]: MoveId.FREEZING_GLARE,
  [SpeciesId.GALAR_ZAPDOS]: MoveId.THUNDEROUS_KICK,
  [SpeciesId.GALAR_MOLTRES]: MoveId.FIERY_WRATH,
  
  // Gen 4 Legends
  [SpeciesId.UXIE]: MoveId.MYSTICAL_POWER,
  [SpeciesId.AZELF]: MoveId.MYSTICAL_POWER,
  [SpeciesId.MESPRIT]: MoveId.MYSTICAL_POWER,
  [SpeciesId.PALKIA]: MoveId.SPACIAL_REND,
  [SpeciesId.DARKRAI]: MoveId.DARK_VOID,
  [SpeciesId.SHAYMIN]: MoveId.SEED_FLARE,

  // Gen 5 Legends
  [SpeciesId.VICTINI]: [MoveId.V_CREATE, MoveId.SEARING_SHOT],
  [SpeciesId.RESHIRAM]: [MoveId.FUSION_FLARE, MoveId.BLUE_FLARE],
  [SpeciesId.ZEKROM]: [MoveId.FUSION_BOLT, MoveId.BOLT_STRIKE],
  [SpeciesId.KYUREM]: [MoveId.FUSION_FLARE, MoveId.FUSION_BOLT],
  [SpeciesId.KELDEO]: MoveId.SECRET_SWORD,

  // Gen 6 Legends
  [SpeciesId.ETERNAL_FLOETTE]: MoveId.LIGHT_OF_RUIN,
  [SpeciesId.YVELTAL]: MoveId.OBLIVION_WING,
  [SpeciesId.ZYGARDE]: [MoveId.THOUSAND_ARROWS, MoveId.THOUSAND_WAVES],
  [SpeciesId.DIANCIE]: MoveId.DIAMOND_STORM,
  [SpeciesId.HOOPA]: [MoveId.HYPERSPACE_FURY, MoveId.HYPERSPACE_HOLE],
  [SpeciesId.VOLCANION]: MoveId.STEAM_ERUPTION,

  // Gen 7 Legends
  [SpeciesId.SOLGALEO]: MoveId.SUNSTEEL_STRIKE,
  [SpeciesId.LUNALA]: MoveId.MOONGEIST_BEAM,
  [SpeciesId.NECROZMA]: MoveId.PHOTON_GEYSER,
  [SpeciesId.MARSHADOW]: MoveId.SPECTRAL_THIEF,
  [SpeciesId.MAGEARNA]: MoveId.FLEUR_CANNON,
  [SpeciesId.ZERAORA]: MoveId.PLASMA_FISTS,
  [SpeciesId.MELMETAL]: MoveId.DOUBLE_IRON_BASH,

  // Gen 8 Legends
  [SpeciesId.ZACIAN]: MoveId.PLAY_ROUGH,
  [SpeciesId.ZAMAZENTA]: MoveId.BODY_PRESS,
  [SpeciesId.ETERNATUS]: MoveId.DYNAMAX_CANNON,
  [SpeciesId.URSHIFU]: [MoveId.WICKED_BLOW, MoveId.SURGING_STRIKES],
  [SpeciesId.REGIDRAGO]: MoveId.DRAGON_ENERGY,
  [SpeciesId.CALYREX]: [MoveId.ASTRAL_BARRAGE, MoveId.GLACIAL_LANCE],

  // Gen 9 Legends
  [SpeciesId.KORAIDON]: MoveId.COLLISION_COURSE,
  [SpeciesId.MIRAIDON]: MoveId.ELECTRO_DRIFT,
  [SpeciesId.TERAPAGOS]: MoveId.TERA_STARSTORM,
  [SpeciesId.PECHARUNT]: MoveId.MALIGNANT_CHAIN,

  // Suggested by Blitzy
  [SpeciesId.SCIZOR]: MoveId.BULLET_PUNCH,
  // Partner Moves
  [SpeciesId.EEVEE]: [
    MoveId.BOUNCY_BUBBLE,
    MoveId.BUZZY_BUZZ,
    MoveId.SIZZLY_SLIDE,
    MoveId.BADDY_BAD,
    MoveId.GLITZY_GLOW,
    MoveId.FREEZY_FROST,
    MoveId.SAPPY_SEED,
    MoveId.SPARKLY_SWIRL,
  ],
  [SpeciesId.ARCTOVISH]: MoveId.FISHIOUS_REND, // Benjie prefers this be addressed outside of signature moves
  [SpeciesId.DRACOVISH]: MoveId.FISHIOUS_REND, // Benjie doesn't approve >:o
  [SpeciesId.ARCTOZOLT]: MoveId.BOLT_BEAK,
  [SpeciesId.DRACOZOLT]: MoveId.BOLT_BEAK, // Benjie prefers this be addressed outside of signature moves
  [SpeciesId.SPIDOPS]: MoveId.SILK_TRAP,
  [SpeciesId.TOXAPEX]: MoveId.BANEFUL_BUNKER,
  [SpeciesId.ARIADOS]: MoveId.TOXIC_THREAD,
  [SpeciesId.BLISSEY]: MoveId.SOFT_BOILED,
  [SpeciesId.MEDICHAM]: [MoveId.ZEN_HEADBUTT, MoveId.PSYCHO_CUT], // Avoids special moves on level 
  [SpeciesId.LILLIGANT]: MoveId.QUIVER_DANCE,
  [SpeciesId.HISUI_LILLIGANT]: MoveId.VICTORY_DANCE,
  [SpeciesId.PALOSSAND]: MoveId.SHORE_UP,
  [SpeciesId.TOXTRICITY]: MoveId.OVERDRIVE,
  [SpeciesId.FALINKS]: MoveId.NO_RETREAT,
  [SpeciesId.GRAPPLOCT]: MoveId.OCTOLOCK,
  [SpeciesId.MAUSHOLD]: [MoveId.POPULATION_BOMB, MoveId.TIDY_UP],
  [SpeciesId.VELUZA]: MoveId.FILLET_AWAY,
  [SpeciesId.DELIBIRD]: MoveId.PRESENT,
  [SpeciesId.CINCCINO]: MoveId.TAIL_SLAP,
  [SpeciesId.HOUNDSTONE]: MoveId.LAST_RESPECTS,
  [SpeciesId.ANNIHILAPE]: MoveId.RAGE_FIST,
  [SpeciesId.DRAGAPULT]: MoveId.DRAGON_DARTS,
  // Partner / Cosplay Moves
  [SpeciesId.PIKACHU]: [
    MoveId.SPLISHY_SPLASH,
    MoveId.FLOATY_FALL,
    MoveId.METEOR_MASH,
    MoveId.ICICLE_CRASH,
    MoveId.FLYING_PRESS,
  ],
  // These are here to make up for movegen jank
  [SpeciesId.HONCHKROW]: [MoveId.NIGHT_SLASH, MoveId.SUCKER_PUNCH], // Avoids special moves / works with ability
  [SpeciesId.NIHILEGO]: MoveId.POWER_GEM, // Avoids Head Smash
  // It always gets mega launcher
  [SpeciesId.CLAWITZER]: MoveId.WATER_PULSE,
  [SpeciesId.LUXRAY]: [MoveId.WILD_CHARGE, MoveId.SUPERCELL_SLAM],
  // Force shadow ball because it is the only good special ghost move
  [SpeciesId.MISMAGIUS]: MoveId.SHADOW_BALL,
  // Avoids dazzling gleam possibility
  [SpeciesId.GRANBULL]: MoveId.PLAY_ROUGH,

};
export const FORCED_RIVAL_SIGNATURE_MOVES: Partial<Record<SpeciesId, MoveId | MoveId[]>> = {
  [SpeciesId.UNFEZANT]: MoveId.SLASH,
  [SpeciesId.SWELLOW]: MoveId.BOOMBURST,
  [SpeciesId.STARAPTOR]: MoveId.HEAD_CHARGE,
};
