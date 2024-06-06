import { ModifierTypeTranslationEntries } from "#app/plugins/i18n";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "Receive {{pokeballName}} x{{modifierCount}} (Inventory: {{pokeballAmount}}) \nCatch Rate: {{catchRate}}",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "Receive {{voucherTypeName}} x{{modifierCount}}",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}} はこのアイテムを\nもつことができません！",
        "tooMany": "{{pokemonName}} はこのアイテムを\nもちすぎています！",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "ポケモンの HPを {{restorePoints}} または {{restorePercent}}%のどちらか高いほうをかいふくする",
      extra: {
        "fully": "ポケモンのHPをすべてかいふくする",
        "fullyWithStatus": "ポケモンの HPと じょうたいいじょうを かいふくする",
      }
    },
    "PokemonReviveModifierType": {
      description: "ひんしになってしまったポケモンの HP {{restorePercent}}%を かいふくする",
    },
    "PokemonStatusHealModifierType": {
      description: "全てのじょうたいいじょうを なおす",
    },
    "PokemonPpRestoreModifierType": {
      description: "ポケモンが おぼえている わざの PPを {{restorePoints}}ずつ かいふくする",
      extra: {
        "fully": "ポケモンが おぼえている わざの PPを すべて かいふくする",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "ポケモンが おぼえている 4つの わざの PPを {{restorePoints}}ずつ かいふくする",
      extra: {
        "fully": "ポケモンが おぼえている 4つの わざの PPを すべて かいふくする",
      }
    },
    "PokemonPpUpModifierType": {
      description: "ポケモンのわざのさいだいPPを さいだいPP 5ごとに {{upPoints}} ポイントずつ ふやします（さいだい3）",
    },
    "PokemonNatureChangeModifierType": {
      name: "{{natureName}} Mint",
      description: "ポケモンのせいかくを {{natureName}}にかえて スターターのせいかくをえいきゅうにかいじょする",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "バトル{{battleCount}}かいのあいだ ダブルバトルになるかくりつを2ばいにする",
    },
    "TempBattleStatBoosterModifierType": {
      description: "すべてのパーティメンバーの {{tempBattleStatName}}を5かいのバトルのあいだ 1だんかいあげる",
    },
    "AttackTypeBoosterModifierType": {
      description: "ポケモンの {{moveType}}タイプのわざのいりょくを20パーセントあげる",
    },
    "PokemonLevelIncrementModifierType": {
      description: "ポケモンのレベルを1あげる",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "すべてのパーティメンバーのレベルを1あげる",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "ポケモンの{{statName}}のきほんステータスを10パーセントあげる。IVがたかいほどスタックのげんかいもたかくなる。",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "すべてのポケモンのHPを100パーセントかいふくする",
    },
    "AllPokemonFullReviveModifierType": {
      description: "ひんしになったすべてのポケモンをふっかつさせ HPをぜんかいふくする",
    },
    "MoneyRewardModifierType": {
      description: "{{moneyMultiplier}}ぶんのきんがくをあたえる (₽{{moneyAmount}})",
      extra: {
        "small": "すくない",
        "moderate": "ふつう",
        "large": "おおい",
      },
    },
    "ExpBoosterModifierType": {
      description: "もらえるけいけんちを {{boostPercent}}パーセントふやす",
    },
    "PokemonExpBoosterModifierType": {
      description: "もっているポケモンのけいけんちを {{boostPercent}}パーセントふやす",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "しょうりごとに 50%パーセント なかよく なりやすくなる",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "わざのめいちゅうりつを{{accuracyAmount}}ふやす (さいだい100)",
    },
    "PokemonMultiHitModifierType": {
      description: "Attacks hit one additional time at the cost of a 60/75/82.5% power reduction per stack respectively",
    },
    "TmModifierType": {
      name: "わざレコード{{moveId}} - {{moveName}}",
      description: "ポケモンに {{moveName}} をおしえる",
    },
    "TmModifierTypeWithInfo": {
      name: "わざレコード{{moveId}} - {{moveName}}",
      description: "ポケモンに {{moveName}} をおしえる\n(Hold C or Shift for more info)",
    },
    "EvolutionItemModifierType": {
      description: "とくていのポケモンをしんかさせる",
    },
    "FormChangeItemModifierType": {
      description: "とくていのポケモンをフォームチェンジさせる",
    },
    "FusePokemonModifierType": {
      description: "2匹のポケモンをけつごうする (とくせいをいどうし、きほんステータスとタイプをわけ、わざプールをきょうゆうする)",
    },
    "TerastallizeModifierType": {
      name: "{{teraType}} Tera Shard",
      description: "ポケモンを{{teraType}}タイプにテラスタル（10かいのバトルまで）",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "こうげきするとき あいてがもっているアイテムを {{chancePercent}}パーセントのかくりつでぬすむ",
    },
    "TurnHeldItemTransferModifierType": {
      description: "まいターン あいてからひとつのもちものをてにいれる",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "こうげきわざに {{chancePercent}}パーセントのかくりつで {{statusEffect}}をあたえる",
    },
    "EnemyEndureChanceModifierType": {
      description: "こうげきをこらえるかくりつを{{chancePercent}}パーセントふやす",
    },

    "RARE_CANDY": { name: "ふしぎなアメ" },
    "RARER_CANDY": { name: "もっとふしぎなアメ" },

    "MEGA_BRACELET": { name: "メガバングル", description: "メガストーンがつかえるようになる" },
    "DYNAMAX_BAND": { name: "ダイマックスバンド", description: "ダイスープがつかえるようになる" },
    "TERA_ORB": { name: "テラスタルオーブ", description: "テラピースがつかえるようになる" },

    "MAP": { name: "ちず", description: "わかれみちでいきさきをえらべるようになる" },

    "POTION": { name: "キズぐすり" },
    "SUPER_POTION": { name: "いいキズぐすり" },
    "HYPER_POTION": { name: "すごいキズぐすり" },
    "MAX_POTION": { name: "まんたんのくすり" },
    "FULL_RESTORE": { name: "かいふくのくすり" },

    "REVIVE": { name: "げんきのかけら" },
    "MAX_REVIVE": { name: "げんきのかたまり" },

    "FULL_HEAL": { name: "なんでもなおし" },

    "SACRED_ASH": { name: "せいなるはい" },

    "REVIVER_SEED": { name: "ふっかつのタネ", description: "ひんしになったときもっているポケモンをHPはんぶんでふっかつさせる" },

    "ETHER": { name: "ピーピーエイド" },
    "MAX_ETHER": { name: "ピーピーリカバー" },

    "ELIXIR": { name: "ピーピーエイダー" },
    "MAX_ELIXIR": { name: "ピーピーマックス" },

    "PP_UP": { name: "ポイントアップ" },
    "PP_MAX": { name: "ポイントマックス" },

    "LURE": { name: "ダブルバトルコロン" },
    "SUPER_LURE": { name: "シルバーコロン" },
    "MAX_LURE": { name: "ゴールドコロン" },

    "MEMORY_MUSHROOM": { name: "きおくキノコ", description: "ポケモンのわすれたわざをおぼえさせる" },

    "EXP_SHARE": { name: "がくしゅうそうち", description: "バトルにさんかしていないポケモンが けいけんちの20パーセントをもらう" },
    "EXP_BALANCE": { name: "バランスそうち", description: "レベルがひくいパーティメンバーがもらうけいけんちがふえる" },

    "OVAL_CHARM": { name: "まるいおまもり", description: "バトルにふくすうのポケモンがさんかするとけいけんちが10パーセントふえる" },

    "EXP_CHARM": { name: "けいけんちおまもり" },
    "SUPER_EXP_CHARM": { name: "いいけいけんちおまもり" },
    "GOLDEN_EXP_CHARM": { name: "ゴールドけいけんちおまもり" },

    "LUCKY_EGG": { name: "しあわせタマゴ" },
    "GOLDEN_EGG": { name: "おうごんタマゴ" },

    "SOOTHE_BELL": { name: "やすらぎのすず" },

    "SOUL_DEW": { name: "こころのしずく", description: "ポケモンのせいかくがステータスにあたえるえいきょうを10%ふやす（合算）" },

    "NUGGET": { name: "きんのたま" },
    "BIG_NUGGET": { name: "でかいきんのたま" },
    "RELIC_GOLD": { name: "こだいのきんか" },

    "AMULET_COIN": { name: "おまもりこばん", description: "もらえる おかねが 20パーセント ふえる" },
    "GOLDEN_PUNCH": { name: "ゴールドパンチ", description: "あたえたちょくせつダメージの50パーセントをおかねとしてもらえる" },
    "COIN_CASE": { name: "コインケース", description: "10かいのバトルごとにもちきんの10パーセントをりしとしてうけとる" },

    "LOCK_CAPSULE": { name: "ロックカプセル", description: "リロールするときにアイテムのレアリティをロックできる" },

    "GRIP_CLAW": { name: "ねばりのかぎづめ" },
    "WIDE_LENS": { name: "こうかくレンズ" },

    "MULTI_LENS": { name: "マルチレンズ" },

    "HEALING_CHARM": { name: "ヒーリングチャーム", description: "HPをかいふくするわざとアイテムのこうかを10パーセントあげる (ふっかつはのぞく)" },
    "CANDY_JAR": { name: "アメボトル", description: "ふしぎなアメのアイテムでふえるレベルが1ふえる" },

    "BERRY_POUCH": { name: "きのみぶくろ", description: "つかったきのみがつかわれないかくりつを30パーセントふやす" },

    "FOCUS_BAND": { name: "きあいのハチマキ", description: "ひんしになるダメージをうけてもHP1でたえるかくりつを10パーセントふやす" },

    "QUICK_CLAW": { name: "せんせいのツメ", description: "すばやさにかかわらず さきにこうどうするかくりつを10パーセントふやす (ゆうせんどのあと)" },

    "KINGS_ROCK": { name: "おうじゃのしるし", description: "こうげきわざがあいてをひるませるかくりつを10パーセントふやす" },

    "LEFTOVERS": { name: "たべのこし", description: "ポケモンのさいだいHPの1/16をまいターンかいふくする" },
    "SHELL_BELL": { name: "かいがらのすず", description: "ポケモンがあたえたダメージの1/8をかいふくする" },

    "TOXIC_ORB": { name: "どくどくだま", description: "ターンの終わりに すでに じょうたいじょうしょうが なければ もうどくの じょうたいに なる" },
    "FLAME_ORB": { name: "かえんだま", description: "ターンの終わりに すでに じょうたいじょうしょうが なければ やけどの じょうたいに なる" },

    "BATON": { name: "バトン", description: "ポケモンをこうたいするときにこうかをひきつぎ わなをかいひすることもできる" },

    "SHINY_CHARM": { name: "ひかるおまもり", description: "Dramatically increases the chance of a wild Pokémon being Shiny" },
    "ABILITY_CHARM": { name: "とくせいおまもり", description: "Dramatically increases the chance of a wild Pokémon having a Hidden Ability" },

    "IV_SCANNER": { name: "IV たんちき", description: "Allows scanning the IVs of wild Pokémon. 2 IVs are revealed per stack. The best IVs are shown first" },

    "DNA_SPLICERS": { name: "いでんしのくさび" },

    "MINI_BLACK_HOLE": { name: "Mini Black Hole" },

    "GOLDEN_POKEBALL": { name: "ゴールドモンスターボール", description: "Adds 1 extra item option at the end of every battle" },

    "ENEMY_DAMAGE_BOOSTER": { name: "Damage Token", description: "Increases damage by 5%" },
    "ENEMY_DAMAGE_REDUCTION": { name: "Protection Token", description: "Reduces incoming damage by 2.5%" },
    "ENEMY_HEAL": { name: "Recovery Token", description: "Heals 2% of max HP every turn" },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "Poison Token" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "Paralyze Token" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "Burn Token" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "Full Heal Token", description: "Adds a 2.5% chance every turn to heal a status condition" },
    "ENEMY_ENDURE_CHANCE": { name: "Endure Token" },
    "ENEMY_FUSED_CHANCE": { name: "Fusion Token", description: "Adds a 1% chance that a wild Pokémon will be a fusion" },
  },
  TempBattleStatBoosterItem: {
    "x_attack": "プラスパワー",
    "x_defense": "ディフェンダー",
    "x_sp_atk": "スペシャルアップ",
    "x_sp_def": "スペシャルガード",
    "x_speed": "スピーダー",
    "x_accuracy": "ヨクアタール",
    "dire_hit": "クリティカット",
  },
  AttackTypeBoosterItem: {
    "silk_scarf": "シルクのスカーフ",
    "black_belt": "くろおび",
    "sharp_beak": "するどいくちばし",
    "poison_barb": "どくバリ",
    "soft_sand": "やわらかいすな",
    "hard_stone": "かたいいし",
    "silver_powder": "ぎんのこな",
    "spell_tag": "のろいのおふだ",
    "metal_coat": "メタルコート",
    "charcoal": "もくたん",
    "mystic_water": "しんぴのしずく",
    "miracle_seed": "きせきのタネ",
    "magnet": "じしゃく",
    "twisted_spoon": "まがったスプーン",
    "never_melt_ice": "とけないこおり",
    "dragon_fang": "りゅうのキバ",
    "black_glasses": "くろいメガネ",
    "fairy_feather": "ようせいのハネ",
  },
  BaseStatBoosterItem: {
    "hp_up": "マックスアップ",
    "protein": "タウリン",
    "iron": "ブロムヘキシン",
    "calcium": "リゾチウム",
    "zinc": "キトサン",
    "carbos": "インドメタシン",
  },
  EvolutionItem: {
    "NONE": "None",

    "LINKING_CORD": "つながりのヒモ",
    "SUN_STONE": "たいようのいし",
    "MOON_STONE": "つきのいし",
    "LEAF_STONE": "リーフのいし",
    "FIRE_STONE": "ほのおのいし",
    "WATER_STONE": "みずのいし",
    "THUNDER_STONE": "かみなりのいし",
    "ICE_STONE": "こおりのいし",
    "DUSK_STONE": "やみのいし",
    "DAWN_STONE": "めざめいし",
    "SHINY_STONE": "ひかりのいし",
    "CRACKED_POT": "われたポット",
    "SWEET_APPLE": "あまーいりんご",
    "TART_APPLE": "すっぱいりんご",
    "STRAWBERRY_SWEET": "いちごアメざいく",
    "UNREMARKABLE_TEACUP": "ボンサクのちゃわん",

    "CHIPPED_POT": "かけたポット",
    "BLACK_AUGURITE": "くろのきせき",
    "GALARICA_CUFF": "ガラナツブレス",
    "GALARICA_WREATH": "ガラナツリース",
    "PEAT_BLOCK": "ピートブロック",
    "AUSPICIOUS_ARMOR": "イワイノヨロイ",
    "MALICIOUS_ARMOR": "ノロイノヨロイ",
    "MASTERPIECE_TEACUP": "ケッサクのちゃわん",
    "METAL_ALLOY": "ふくごうきんぞく",
    "SCROLL_OF_DARKNESS": "あくのかけじく",
    "SCROLL_OF_WATERS": "みずのかけじく",
    "SYRUPY_APPLE": "みついりりんご",
  },
  FormChangeItem: {
    "NONE": "None",

    "ABOMASITE": "Abomasite",
    "ABSOLITE": "Absolite",
    "AERODACTYLITE": "Aerodactylite",
    "AGGRONITE": "Aggronite",
    "ALAKAZITE": "Alakazite",
    "ALTARIANITE": "Altarianite",
    "AMPHAROSITE": "Ampharosite",
    "AUDINITE": "Audinite",
    "BANETTITE": "Banettite",
    "BEEDRILLITE": "Beedrillite",
    "BLASTOISINITE": "Blastoisinite",
    "BLAZIKENITE": "Blazikenite",
    "CAMERUPTITE": "Cameruptite",
    "CHARIZARDITE_X": "Charizardite X",
    "CHARIZARDITE_Y": "Charizardite Y",
    "DIANCITE": "Diancite",
    "GALLADITE": "Galladite",
    "GARCHOMPITE": "Garchompite",
    "GARDEVOIRITE": "Gardevoirite",
    "GENGARITE": "Gengarite",
    "GLALITITE": "Glalitite",
    "GYARADOSITE": "Gyaradosite",
    "HERACRONITE": "Heracronite",
    "HOUNDOOMINITE": "Houndoominite",
    "KANGASKHANITE": "Kangaskhanite",
    "LATIASITE": "Latiasite",
    "LATIOSITE": "Latiosite",
    "LOPUNNITE": "Lopunnite",
    "LUCARIONITE": "Lucarionite",
    "MANECTITE": "Manectite",
    "MAWILITE": "Mawilite",
    "MEDICHAMITE": "Medichamite",
    "METAGROSSITE": "Metagrossite",
    "MEWTWONITE_X": "Mewtwonite X",
    "MEWTWONITE_Y": "Mewtwonite Y",
    "PIDGEOTITE": "Pidgeotite",
    "PINSIRITE": "Pinsirite",
    "RAYQUAZITE": "Rayquazite",
    "SABLENITE": "Sablenite",
    "SALAMENCITE": "Salamencite",
    "SCEPTILITE": "Sceptilite",
    "SCIZORITE": "Scizorite",
    "SHARPEDONITE": "Sharpedonite",
    "SLOWBRONITE": "Slowbronite",
    "STEELIXITE": "Steelixite",
    "SWAMPERTITE": "Swampertite",
    "TYRANITARITE": "Tyranitarite",
    "VENUSAURITE": "Venusaurite",

    "BLUE_ORB": "Blue Orb",
    "RED_ORB": "Red Orb",
    "SHARP_METEORITE": "Sharp Meteorite",
    "HARD_METEORITE": "Hard Meteorite",
    "SMOOTH_METEORITE": "Smooth Meteorite",
    "ADAMANT_CRYSTAL": "Adamant Crystal",
    "LUSTROUS_GLOBE": "Lustrous Globe",
    "GRISEOUS_CORE": "Griseous Core",
    "REVEAL_GLASS": "Reveal Glass",
    "GRACIDEA": "Gracidea",
    "MAX_MUSHROOMS": "Max Mushrooms",
    "DARK_STONE": "Dark Stone",
    "LIGHT_STONE": "Light Stone",
    "PRISON_BOTTLE": "Prison Bottle",
    "N_LUNARIZER": "N Lunarizer",
    "N_SOLARIZER": "N Solarizer",
    "RUSTED_SWORD": "Rusted Sword",
    "RUSTED_SHIELD": "Rusted Shield",
    "ICY_REINS_OF_UNITY": "Icy Reins Of Unity",
    "SHADOW_REINS_OF_UNITY": "Shadow Reins Of Unity",
    "WELLSPRING_MASK": "Wellspring Mask",
    "HEARTHFLAME_MASK": "Hearthflame Mask",
    "CORNERSTONE_MASK": "Cornerstone Mask",
    "SHOCK_DRIVE": "Shock Drive",
    "BURN_DRIVE": "Burn Drive",
    "CHILL_DRIVE": "Chill Drive",
    "DOUSE_DRIVE": "Douse Drive",
  },
} as const;
