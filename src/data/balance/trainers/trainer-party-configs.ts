import { Moves } from "#enums/moves";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";
import { Gender } from "../../gender";
import type { TrainerPartyConfigs } from "../../trainers/typedefs";


export const trainerPartyConfigs: TrainerPartyConfigs = {
  [TrainerType.LORELEI]: [
    [0, {
      species: Species.DEWGONG,
      abilityIndex: 0, // Thick Fat
    }],
    [2, [
      {species: Species.SLOWBRO},
      {species: Species.GALAR_SLOWBRO}
      ],
      {
        teraType: PokemonType.ICE,
        instantTera: true,
        presetMoves: [Moves.ICE_BEAM],
      }
    ],
    [3, { species: Species.JYNX }],
    [4, [{ species: Species.CLOYSTER }, { species: Species.ALOLA_SANDSLASH }]],
    [5, { species: Species.LAPRAS }]
  ],
  [TrainerType.BRUNO]: [
    [0, [{ species: Species.HITMONLEE }, { species: Species.HITMONCHAN }, { species: Species.HITMONTOP }]],
    [2, {
      species: Species.STEELIX,
      instantTera: true,
      teraType: PokemonType.FIGHTING,
      presetMoves: [Moves.BODY_PRESS],
    }],
    [3, { species: Species.POLIWRATH }],
    [4, { species: Species.ANNIHILAPE }],
    [5, {
      species: Species.MACHAMP,
    }]
  ],
  [TrainerType.AGATHA]: [
    [0, { species: Species.MISMAGIUS }],
    [2, [{
      species: Species.ARBOK,
      abilityIndex: 0,
      }, {
      species: Species.WEEZING,
      abilityIndex: 0,
    }], {
      teraType: PokemonType.GHOST,
      instantTera: true,
      presetMoves: [Moves.TERA_BLAST],
    }],
    [3, { species: Species.ALOLA_MAROWAK }],
    [4, { species: Species.CURSOLA }],
    [5, {
      species: Species.GENGAR,
    }]
  ],
  [TrainerType.LANCE]: [
    [0, { species: Species.KINGDRA }],
    [2, [{
      species: Species.GYARADOS,
      presetMoves: [Moves.SCALE_SHOT],
    },
    {
      species: Species.AERODACTYL,
      presetMoves: [Moves.DRAGON_CLAW],
    }], {instantTera: true}
    ],
    [3, { species: Species.ALOLA_EXEGGUTOR }],
    [4, { species: Species.SALAMENCE }],
    [5, { species: Species.DRAGONITE }]
  ],

  [TrainerType.WILL]: [
    [0, { species: Species.JYNX }],
    [2, [
      {species: Species.SLOWKING},
      {species: Species.GALAR_SLOWKING},
    ], {
      gender: Gender.FEMALE,
      teraType: PokemonType.PSYCHIC,
      instantTera: true,
    }],
    [3, { species: Species.EXEGGUTOR, gender: Gender.FEMALE }],
    [4, [{ species: Species.WYRDEER }, { species: Species.FARIGIRAF }], {gender: Gender.FEMALE}],
    [5, { species: Species.XATU, gender: Gender.FEMALE }]
  ],
  [TrainerType.KOGA]: [
    [0, {
      species: Species.VENOMOTH,
      abilityIndex: 1, // Tinted Lens
    }],
    [2, [{
      species: Species.MUK,
      }, {
      species: Species.WEEZING,
    }], {instantTera: true}],
    [3, { species: Species.TENTACRUEL }],
    [4, [{ species: Species.SNEASLER }, { species: Species.OVERQWIL }]],
    [5, { species: Species.CROBAT }]
  ],
  [TrainerType.KAREN]: [
    [0, { species: Species.UMBREON }],
    [2, {
      species: Species.GENGAR,
      teraType: PokemonType.DARK,
      instantTera: true,
      presetMoves: [Moves.DARK_PULSE],
    }],
    [3, { species: Species.HONCHKROW }],
    [4, { species: Species.WEAVILE }],
    [5, { species: Species.HOUNDOOM }],
  ],

  [TrainerType.SIDNEY]: [
    [0, {
      species: Species.MIGHTYENA,
      abilityIndex: 0,
    }],
    [2, {
      species: Species.OBSTAGOON,
      teraType: PokemonType.DARK,
      instantTera: true,
    }],
    [3, [{ species: Species.SHIFTRY }, { species: Species.CACTURNE }]],
    [4, [{ species: Species.SHARPEDO }, { species: Species.CRAWDAUNT }]],
    [5, { species: Species.ABSOL }],
  ],
  [TrainerType.PHOEBE]: [
    [0, { species: Species.SABLEYE }],
    [2, {
      species: Species.BANETTE,
      instantTera: true,
    }],
    [3, [{ species: Species.DRIFBLIM }, { species: Species.MISMAGIUS }]],
    [4, [{ species: Species.ORICORIO }, { species: Species.ALOLA_MAROWAK }]],
    [5, { species: Species.DUSKNOIR }],
  ],
  [TrainerType.GLACIA]: [
    [0, {
      species: Species.ABOMASNOW,
      abilityIndex: 0, // Snow Warning
    }],
    [2, {
      species: Species.GLALIE,
      instantTera: true,
    }],
    [3, { species: Species.FROSLASS }],
    [4, { species: Species.ALOLA_NINETALES }],
    [5, { species: Species.WALREIN }],
  ],
  [TrainerType.DRAKE]: [
    [0, { species: Species.ALTARIA }],
    [2, {
      species: Species.DHELMISE,
      teraType: PokemonType.DRAGON,
      instantTera: true,
      presetMoves: [Moves.TERA_BLAST],
    }],
    [3, { species: Species.FLYGON }],
    [4, { species: Species.KINGDRA }],
    [5, { species: Species.SALAMENCE }],
  ],

  [TrainerType.AARON]: [
    [0, { species: Species.YANMEGA }],
    [2, { species: Species.HERACROSS }],
    [3, { species: Species.VESPIQUEN }],
    [4, [{ species: Species.SCIZOR }, { species: Species.KLEAVOR }]],
    [5, {
      species: Species.DRAPION,
      teraType: PokemonType.BUG,
      abilityIndex: 1, // Sniper
      instantTera: true,
      presetMoves: [Moves.X_SCISSOR],
    }]
  ],
  [TrainerType.BERTHA]: [
    [0, { species: Species.WHISCASH }],
    [2, {
      species: Species.HIPPOWDON,
      abilityIndex: 0, // Sand Stream
      instantTera: true,
    }],
    [3, { species: Species.GLISCOR }],
    [4, [{ species: Species.MAMOSWINE }, { species: Species.URSALUNA }]],
    [5, {
      species: Species.RHYPERIOR,
      abilityIndex: 1, // Solid Rock
    }]
  ],
  [TrainerType.FLINT]: [
    [0, { species: Species.RAPIDASH }],
    [2, [{
      species: Species.STEELIX,
      presetMoves: [Moves.FIRE_FANG],
    },
    {
      species: Species.LOPUNNY,
      presetMoves: [Moves.FIRE_PUNCH],
    }], {teraType: PokemonType.FIRE, instantTera: true}],
    [3, [{ species: Species.ARCANINE }, { species: Species.HISUI_ARCANINE }]],
    [4, { species: Species.INFERNAPE }],
    [5, {
      species: Species.MAGMORTAR,
    }]
  ],
  [TrainerType.LUCIAN]: [
    [0, [{ species: Species.ESPEON }, { species: Species.ALAKAZAM }]],
    [2, {
      species: Species.FARIGIRAF,
      instantTera: true,
    }],
    [3, { species: Species.BRONZONG }],
    [4, [{ species: Species.MR_RIME }, { species: Species.HISUI_BRAVIARY }]],
    [5, {
      species: Species.GALLADE,
      abilityIndex: 1, // Sharpness
    }]
  ],

  [TrainerType.SHAUNTAL]: [
    [0, { species: Species.COFAGRIGUS }],
    [2, { species: Species.GOLURK, teraType: PokemonType.GHOST, instantTera: true }],
    [3, { species: Species.JELLICENT }],
    [4, [{ species: Species.MISMAGIUS }, { species: Species.FROSLASS }]],
    [5, { species: Species.CHANDELURE }]
  ],
  [TrainerType.MARSHAL]: [
    [0, [{ species: Species.THROH }, { species: Species.SAWK }]],
    [2, { species: Species.MIENSHAO, instantTera: true }],
    [3, { species: Species.EMBOAR }],
    [4, [{ species: Species.BRELOOM }, { species: Species.TOXICROAK }]],
    [5, { species: Species.CONKELDURR }]
  ],
  [TrainerType.GRIMSLEY]: [
    [0, { species: Species.LIEPARD }],
    [2, { species: Species.KROOKODILE, teraType: PokemonType.DARK, instantTera: true }],
    [3, { species: Species.SCRAFTY }],
    [4, [{ species: Species.ZOROARK }, { species: Species.HISUI_SAMUROTT }]],
    [5, { species: Species.KINGAMBIT }]
  ],
  [TrainerType.CAITLIN]: [
    [0, { species: Species.MUSHARNA }],
    [2, { species: Species.REUNICLUS, instantTera: true }],
    [3, [{ species: Species.SIGILYPH }, { species: Species.HISUI_BRAVIARY }]],
    [4, {
      species: Species.GALLADE,
      abilityIndex: 1, // Sharpness
    }],
    [5, { species: Species.GOTHITELLE }],
  ],

  [TrainerType.MALVA]: [
    [0, { species: Species.PYROAR }],
    [2, { species: Species.HOUNDOOM, instantTera: true }],
    [3, {
      species: Species.TORKOAL,
      abilityIndex: 1, // Drought
    }],
    [4, [{ species: Species.CHANDELURE }, { species: Species.DELPHOX }]],
    [5, { species: Species.TALONFLAME }],
  ],
  [TrainerType.SIEBOLD]: [
    [0, { species: Species.CLAWITZER }],
    [2, { species: Species.GYARADOS, instantTera: true }],
    [3, { species: Species.STARMIE }],
    [4, [{ species: Species.BLASTOISE }, { species: Species.DONDOZO }]],
    [5, {
      species: Species.BARBARACLE,
      abilityIndex: 1, // Tough Claws
    }],
  ],
  [TrainerType.WIKSTROM]: [
    [0, { species: Species.KLEFKI }],
    [2, {
      species: Species.CERULEDGE,
      instantTera: true, // Tera Steel Ceruledge
      presetMoves: [Moves.IRON_HEAD],
    }],
    [3, { species: Species.SCIZOR }],
    [4, { species: Species.CORVIKNIGHT }],
    [5, { species: Species.AEGISLASH }],
  ],
  [TrainerType.DRASNA]: [
    [0, { species: Species.DRAGALGE }],
    [2, {
      species: Species.GARCHOMP,
      instantTera: true, // Tera Dragon Garchomp
    }],
    [3, { species: Species.ALTARIA }],
    [4, { species: Species.DRUDDIGON }],
    [5, { species: Species.NOIVERN }],
  ],

  [TrainerType.HALA]: [
    [0, { species: Species.HARIYAMA }],
    [2, {
      species: Species.INCINEROAR,
      instantTera: true, // Tera Fighting Incineroar
      presetMoves: [Moves.CROSS_CHOP],
    }],
    [3, { species: Species.BEWEAR }],
    [4, [{ species: Species.POLIWRATH }, { species: Species.ANNIHILAPE }]],
    [5, { species: Species.CRABOMINABLE }],
  ],
  [TrainerType.MOLAYNE]: [
    [0, { species: Species.KLEFKI }],
    [2, {
      species: Species.ALOLA_SANDSLASH,
      instantTera: true, // Tera Steel Alolan Sandslash
    }],
    [3, { species: Species.MAGNEZONE }],
    [4, [{ species: Species.METAGROSS }, { species: Species.KINGAMBIT }]],
    [5, { species: Species.ALOLA_DUGTRIO }],
  ],
  [TrainerType.OLIVIA]: [
    [0, {
      species: Species.GIGALITH,
      abilityIndex: 1, // Sand Stream
    }],
    [2, {
      species: Species.PROBOPASS,
      instantTera: true, // Tera Rock Probopass
    }],
    [3, { species: Species.ALOLA_GOLEM }],
    [4, [{ species: Species.RELICANTH }, { species: Species.CARBINK }]],
    [5, {
      species: Species.LYCANROC,
      formIndex: 1, // Midnight Lycanroc
    }],
  ],
  [TrainerType.ACEROLA]: [
    [0, { species: Species.DRIFBLIM }],
    [2, {
      species: Species.MIMIKYU,
      instantTera: true, // Tera Ghost Mimikyu
    }],
    [3, { species: Species.DHELMISE }],
    [4, { species: Species.FROSLASS }],
    [5, { species: Species.PALOSSAND }],
  ],
  [TrainerType.KAHILI]: [
    [0, { species: Species.HAWLUCHA }],
    [2, {
      species: Species.DECIDUEYE,
      instantTera: true, // Tera Flying Decidueye
      presetMoves: [Moves.BRAVE_BIRD],
    }],
    [3, [{ species: Species.BRAVIARY }, { species: Species.MANDIBUZZ }]],
    [4, { species: Species.ORICORIO }],
    [5, { species: Species.TOUCANNON }],
  ],

  [TrainerType.MARNIE_ELITE]: [
    [0, { species: Species.LIEPARD }],
    [2, {
      species: Species.TOXICROAK,
      instantTera: true, // Tera Dark Toxicroak
      presetMoves: [Moves.SUCKER_PUNCH],
    }],
    [3, [{ species: Species.SCRAFTY }, { species: Species.PANGORO }]],
    [4, { species: Species.MORPEKO }],
    [5, { species: Species.GRIMMSNARL }],
  ],
  [TrainerType.NESSA_ELITE]: [
    [0, { species: Species.GOLISOPOD }],
    [2, {
      species: Species.EISCUE,
      instantTera: true, // Tera Water Eiscue
      presetMoves: [Moves.LIQUIDATION],
    }],
    [3, {
      species: Species.PELIPPER,
      abilityIndex: 1, // Drizzle
    }],
    [4, { species: Species.TOXAPEX }],
    [5, { species: Species.DREDNAW }],
  ],
  [TrainerType.BEA_ELITE]: [
    [0, { species: Species.HAWLUCHA }],
    [2, {
      species: Species.SIRFETCHD,
      instantTera: true, // Tera Fighting Sirfetch'd
    }],
    [3, [{ species: Species.GRAPPLOCT }, { species: Species.FALINKS }]],
    [4, { species: Species.HITMONTOP }],
    [5, { species: Species.MACHAMP }],
  ],
  [TrainerType.ALLISTER_ELITE]: [
    [0, { species: Species.DUSKNOIR }],
    [2, {
      species: Species.CURSOLA,
      instantTera: true, // Tera Ghost Cursola
    }],
    [3, [{ species: Species.POLTEAGEIST }, { species: Species.SINISTCHA }]],
    [4, { species: Species.RUNERIGUS }],
    [5, { species: Species.GENGAR }],
  ],
  [TrainerType.RAIHAN_ELITE]: [
    [0, { species: Species.FLYGON }],
    [2, {
      species: Species.TORKOAL,
      abilityIndex: 1, // Drought
      instantTera: true, // Tera Dragon Torkoal
      presetMoves: [Moves.TERA_BLAST],
    }],
    [3, { species: Species.GOODRA }],
    [4, { species: Species.TURTONATOR }],
    [5, { species: Species.ARCHALUDON }],
  ],

  [TrainerType.RIKA]: [
    [0, { species: Species.DUGTRIO }],
    [2, { species: Species.DONPHAN }],
    [3, [{ species: Species.SWAMPERT }, { species: Species.TORTERRA }]],
    [4, { species: Species.CAMERUPT }],
    [5, { species: Species.CLODSIRE, instantTera: true }],
  ],
  [TrainerType.POPPY]: [
    [0, { species: Species.COPPERAJAH }],
    [2, { species: Species.MAGNEZONE }],
    [3, [
      {
        species: Species.CORVIKNIGHT
      },
      {
        species: Species.BRONZONG,
        abilityIndex: 0, // Levitate
      }
    ]],
    [4, { species: Species.STEELIX }],
    [5, { species: Species.TINKATON, instantTera: true }],
  ],
  [TrainerType.LARRY_ELITE]: [
    [0, { species: Species.ALTARIA }],
    [2, { species: Species.BOMBIRDIER }],
    [3, { species: Species.TROPIUS }],
    [4, { species: Species.STARAPTOR }],
    [5, { species: Species.FLAMIGO, instantTera: true }],
  ],
  [TrainerType.HASSEL]: [
    [0, { species: Species.NOIVERN }],
    [2, { species: Species.DRAGALGE }],
    [3, [{ species: Species.FLAPPLE }, { species: Species.APPLETUN }, { species: Species.HYDRAPPLE }]],
    [4, { species: Species.HAXORUS }],
    [5, { species: Species.BAXCALIBUR, instantTera: true }],
  ],

  [TrainerType.CRISPIN]: [
    [0, { species: Species.ROTOM }],
    [2, {
      species: Species.EXEGGUTOR,
      instantTera: true,
      presetMoves: [Moves.HEAT_WAVE],
    }],
    [3, {
      species: Species.TALONFLAME,
      presetMoves: [Moves.SUNNY_DAY],
    }],
    [4, { species: Species.MAGMORTAR }],
    [5, { species: Species.BLAZIKEN }],
  ],
  [TrainerType.AMARYS]: [
    [0, { species: Species.SKARMORY }],
    [2, {
      species: Species.REUNICLUS,
      instantTera: true,
      presetMoves: [Moves.FLASH_CANNON],
    }],
    [3, { species: Species.EMPOLEON }],
    [4, { species: Species.SCIZOR }],
    [5, { species: Species.METAGROSS }],
  ],
  [TrainerType.LACEY]: [
    [0, { species: Species.WHIMSICOTT }],
    [2, { species: Species.PRIMARINA }],
    [3, { species: Species.GRANBULL }],
    [4, { species: Species.ALCREMIE }],
    [5, {
      species: Species.EXCADRILL,
      instantTera: true, // Tera Fairy Excadrill
      presetMoves: [Moves.TERA_BLAST],
    }],
  ],
  [TrainerType.DRAYTON]: [
    [0, { species: Species.DRAGONITE }],
    [2, {
      species: Species.SCEPTILE,
      instantTera: true, // Tera Dragon Sceptile
      presetMoves: [Moves.DUAL_CHOP],
    }],
    [3, { species: Species.HAXORUS }],
    [4, { species: Species.KINGDRA }],
    [5, { species: Species.ARCHALUDON }],
  ],

  [TrainerType.BLUE]: [
    [0, { species: Species.ALAKAZAM }],
    [1, { species: Species.MACHAMP }],
    [2, { species: Species.HO_OH, pokeball: PokeballType.MASTER_BALL }],
    [3, [
      {species: Species.RHYPERIOR}, // Tera Ground or Rock
      {species: Species.ELECTIVIRE}, // Tera Electric
    ], {instantTera: true}],
    [4, [
      {species: Species.ARCANINE},
      {species: Species.EXEGGUTOR},
      {species: Species.GYARADOS}
    ], {boss: true}],
    [5, {
      species: Species.PIDGEOT,
      formIndex: 1, // Mega Pidgeot
    }]
  ],

  [TrainerType.RED]: [
    [0, {
      species: Species.PIKACHU,
      formIndex: 8, // G-Max Pikachu
    }],
    [1, [{ species: Species.ESPEON }, { species: Species.UMBREON }, { species: Species.SYLVEON }]],
    [2, { species: Species.LUGIA, pokeball: PokeballType.MASTER_BALL }],
    [3, [
      {species: Species.MEGANIUM},
      {species: Species.TYPHLOSION},
      {species: Species.FERALIGATR}
    ], {instantTera: true}],
    [4, { species: Species.SNORLAX, boss: true }],
    [5, [{
      species: Species.VENUSAUR,
      formIndex: 1, // Mega Venusaur
    }, {
      species: Species.CHARIZARD,
      formIndex: 1, // Mega Charizard X
    }, {
      species: Species.BLASTOISE,
      formIndex: 1, // Mega Blastoise
    }]],
  ],

  [TrainerType.LANCE_CHAMPION]: [
    [0, [{ species: Species.GYARADOS }, { species: Species.KINGDRA }]],
    [1, { species: Species.AERODACTYL }],
    [2, { species: Species.SALAMENCE, formIndex: 1 }], // Mega Salamence
    [3, { species: Species.CHARIZARD }],
    [4, [{
      species: Species.TYRANITAR,
      abilityIndex: 2, // Unnerve
      presetMoves: [Moves.DRAGON_CLAW],
    }, {
      species: Species.GARCHOMP,
      abilityIndex: 2, // Rough Skin
    }, {
      species: Species.KOMMO_O,
      abilityIndex: 1, // Soundproof
    }], {teraType: PokemonType.DRAGON, instantTera: true}],
    [5, {
      species: Species.DRAGONITE,
      boss: true,
    }]
  ],

  [TrainerType.STEVEN]: [
    [0, { species: Species.SKARMORY }],
    [1, [{ species: Species.CRADILY }, { species: Species.ARMALDO }]],
    [2, { species: Species.AGGRON, boss: true }],
    [3, [{ species: Species.GOLURK }, { species: Species.RUNERIGUS }]],
    [4, [
      {species: Species.REGIROCK},
      {species: Species.REGICE},
      {species: Species.REGISTEEL}
    ], {instantTera: true, pokeball: PokeballType.ULTRA_BALL}],
    [5, {
      species: Species.METAGROSS,
      formIndex: 1, // Mega Metagross
    }]
  ],
  [TrainerType.WALLACE]: [
    [0, { species: Species.PELIPPER, abilityIndex: 1 }], // Drizzle
    [1, { species: Species.LUDICOLO, abilityIndex: 0 }], // Swift Swim
    [2, [{
      species: Species.LATIAS,
      formIndex: 1, // Mega Latias
    }, {
      species: Species.LATIOS,
      formIndex: 1, // Mega Latios
    }], {pokeball: PokeballType.MASTER_BALL}],
    [3, [{ species: Species.SWAMPERT }, { species: Species.GASTRODON }, { species: Species.SEISMITOAD }]],
    [4, [
      {species: Species.REGIELEKI},
      {species: Species.REGIDRAGO}
    ], {instantTera: true, pokeball: PokeballType.ULTRA_BALL}],
    [5, {
      species: Species.MILOTIC,
      boss: true,
      gender: Gender.FEMALE,
    }]
  ],

  [TrainerType.CYNTHIA]: [
    [0, { species: Species.SPIRITOMB }],
    [1, { species: Species.LUCARIO }],
    [2, { species: Species.GIRATINA, pokeball: PokeballType.MASTER_BALL }],
    [3, [{
      species: Species.MILOTIC,
      teraType: PokemonType.WATER,
      instantTera: true,
    }, {
      species: Species.ROSERADE,
      teraType: PokemonType.GRASS,
      instantTera: true,
    }, {
      species: Species.HISUI_ARCANINE,
      teraType: PokemonType.FIRE,
      instantTera: true,
    }]],
    [4, {
      species: Species.TOGEKISS,
      abilityIndex: 1, // Serene Grace
      boss: true,
    }],
    [5, {
      species: Species.GARCHOMP,
      formIndex: 1, // Mega Garchomp
      gender: Gender.FEMALE,
    }]
  ],

  [TrainerType.ALDER]: [
    [0, [{ species: Species.BOUFFALANT }, { species: Species.BRAVIARY }]],
    [1, [
      { species: Species.BASCULEGION },
      { species: Species.HISUI_LILLIGANT },
      { species: Species.HISUI_ZOROARK },
    ], {pokeball: PokeballType.ROGUE_BALL}],
    [2, { species: Species.ZEKROM, pokeball: PokeballType.MASTER_BALL }],
    [3, { species: Species.KELDEO, pokeball: PokeballType.ULTRA_BALL }],
    [4, [
      { species: Species.CHANDELURE, teraType: PokemonType.GHOST },
      { species: Species.KROOKODILE, teraType: PokemonType.DARK },
      { species: Species.CONKELDURR, teraType: PokemonType.FIGHTING },
      { species: Species.REUNICLUS, teraType: PokemonType.PSYCHIC },
    ], {instantTera: true}],
    [5, { species: Species.VOLCARONA, boss: true }],
  ],
  [TrainerType.IRIS]: [
    [0, { species: Species.DRUDDIGON }],
    [1, { species: Species.ARCHEOPS }],
    [2, { species: Species.RESHIRAM, pokeball: PokeballType.MASTER_BALL }],
    [3, [
      { species: Species.SALAMENCE },
      { species: Species.HYDREIGON },
      { species: Species.ARCHALUDON },
    ], {teraType: PokemonType.DRAGON, instantTera: true}],
    [4, {
      species: Species.LAPRAS,
      formIndex: 1, // G-Max Lapras
    }],
    [5, { species: Species.HAXORUS, boss: true }],
  ],

  [TrainerType.DIANTHA]: [
    [0, { species: Species.HAWLUCHA }],
    [1, [{ species: Species.TREVENANT }, { species: Species.GOURGEIST }]],
    [2, { species: Species.XERNEAS, pokeball: PokeballType.MASTER_BALL }],
    [3, [{
      species: Species.TYRANTRUM,
      abilityIndex: 2, // Rock Head
      teraType: PokemonType.DRAGON,
    }, {
      species: Species.AURORUS,
      abilityIndex: 2, // Snow Warning
      teraType: PokemonType.ICE,
    }], {instantTera: true}],
    [4, {
      species: Species.GOODRA,
      boss: true,
    }],
    [5, {
      species: Species.GARDEVOIR,
      formIndex: 1, // Mega Gardevoir
    }],
  ],

  [TrainerType.KUKUI]: [
    [0, {
      species: Species.LYCANROC,
      formIndex: 2, // Dusk Lycanroc
    }],
    [1, [{ species: Species.MAGNEZONE }, { species: Species.ALOLA_NINETALES }]],
    [2, [
      { species: Species.TORNADUS },
      { species: Species.THUNDURUS },
      { species: Species.LANDORUS },
    ], {formIndex: 1, pokeball: PokeballType.ULTRA_BALL}], // Therian Forme Genie
    [3, [
      { species: Species.TAPU_KOKO },
      { species: Species.TAPU_FINI },
    ], {boss: true, pokeball: PokeballType.ULTRA_BALL}],
    [4, { species: Species.SNORLAX, formIndex: 1 }], // G-Max Snorlax
    [5, [
      { species: Species.INCINEROAR, teraType: PokemonType.DARK },
      { species: Species.HISUI_DECIDUEYE, teraType: PokemonType.FIGHTING },
    ], {instantTera: true}],
  ],

  [TrainerType.HAU]: [
    [0, { species: Species.ALOLA_RAICHU }],
    [1, { species: Species.NOIVERN }],
    [2, { species: Species.SOLGALEO, pokeball: PokeballType.MASTER_BALL }],
    [3, [
      { species: Species.TAPU_LELE, teraType: PokemonType.PSYCHIC },
      { species: Species.TAPU_BULU, teraType: PokemonType.GRASS },
    ], {instantTera: true, pokeball: PokeballType.ULTRA_BALL}],
    [4, { species: Species.ZYGARDE, formIndex: 1, pokeball: PokeballType.ROGUE_BALL }], // Zygarde 10% Forme, Aura Break
    [5, [
      { species: Species.DECIDUEYE },
      { species: Species.PRIMARINA, gender: Gender.FEMALE },
    ], {boss: true}],
  ],

  [TrainerType.LEON]: [
    [0, { species: Species.AEGISLASH }],
    [1, [{ species: Species.RHYPERIOR }, { species: Species.SEISMITOAD }, { species: Species.MR_RIME }]],
    [2, { species: Species.ZACIAN, pokeball: PokeballType.MASTER_BALL }],
    [3, { species: Species.DRAGAPULT, instantTera: true }], // Tera Ghost or Dragon Dragapult
    [4, [
      { species: Species.RILLABOOM },
      { species: Species.CINDERACE },
      { species: Species.INTELEON },
    ], {boss: true}],
    [5, { species: Species.CHARIZARD, formIndex: 3 }], // G-Max Charizard
  ],

  [TrainerType.MUSTARD]: [
    [0, { species: Species.CORVIKNIGHT, pokeball: PokeballType.ULTRA_BALL }],
    [1, { species: Species.KOMMO_O, pokeball: PokeballType.ULTRA_BALL }],
    [2, [
      { species: Species.GALAR_SLOWBRO, pokeball: PokeballType.ULTRA_BALL },
      { species: Species.GALAR_SLOWKING, pokeball: PokeballType.ULTRA_BALL },
    ], {teraType: PokemonType.POISON, instantTera: true}],
    [3, { species: Species.GALAR_DARMANITAN, pokeball: PokeballType.ULTRA_BALL }],
    [4, [
      { species: Species.VENUSAUR },
      { species: Species.BLASTOISE },
    ], {pokeball: PokeballType.ULTRA_BALL, boss: true}],
    [5, {
      species: Species.URSHIFU,
      randomForms: [2, 3], // G-Max Single Strike or G-Max Rapid Strike
      pokeball: PokeballType.ULTRA_BALL,
    }]
  ],

  [TrainerType.GEETA]: [
    [0, { species: Species.GLIMMORA, gender: Gender.MALE, boss: true }],
    [1, [{ species: Species.ESPATHRA }, { species: Species.VELUZA }]],
    [2, { species: Species.MIRAIDON, pokeball: PokeballType.MASTER_BALL }],
    [3, { species: Species.BAXCALIBUR }],
    [4, [{ species: Species.CHESNAUGHT }, { species: Species.DELPHOX }, { species: Species.GRENINJA }]],
    [5, {
      species: Species.KINGAMBIT,
      teraType: PokemonType.FLYING,
      instantTera: true,
      abilityIndex: 1,
      presetMoves: [Moves.TERA_BLAST],
    }],
  ],

  [TrainerType.NEMONA]: [
    [0, {
      species: Species.LYCANROC,
      formIndex: 0, // Midday
    }],
    [1, { species: Species.PAWMOT }],
    [2, {
      species: Species.KORAIDON,
      pokeball: PokeballType.MASTER_BALL
    }],
    [3, { species: Species.GHOLDENGO }],
    [4, [
      {
        species: Species.ARMAROUGE,
        teraType: PokemonType.PSYCHIC,
      },
      {
        species: Species.CERULEDGE,
        teraType: PokemonType.GHOST,
      },
    ], {instantTera: true}],
    [5, [
      {species: Species.MEOWSCARADA},
      {species: Species.SKELEDIRGE},
      {species: Species.QUAQUAVAL},
    ], {boss: true, gender: Gender.MALE}],
  ],

  [TrainerType.KIERAN]: [
    [0, [{ species: Species.POLIWRATH }, { species: Species.POLITOED }]],
    [1, [
      { species: Species.INCINEROAR, abilityIndex: 2 }, // Intimidate
      { species: Species.GRIMMSNARL, abilityIndex: 0 }, // Prankster
    ]],
    [2, { species: Species.TERAPAGOS, pokeball: PokeballType.MASTER_BALL }],
    [3, [
      { species: Species.URSALUNA },
      { species: Species.BLOODMOON_URSALUNA },
    ], {pokeball: PokeballType.ULTRA_BALL}],
    [4, {
      species: Species.OGERPON,
      randomForms: [0, 1, 2, 3], // Choose a random Mask, which will then Tera
      instantTera: true,
      pokeball: PokeballType.ULTRA_BALL,
      presetMoves: [Moves.IVY_CUDGEL],
    }],
    [5, { species: Species.HYDRAPPLE, boss: true }],
  ]
};
