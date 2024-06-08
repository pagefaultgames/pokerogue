import { ModifierTypeTranslationEntries } from "#app/plugins/i18n";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    AddPokeballModifierType: {
      name: "{{modifierCount}}x {{pokeballName}}",
      description:
                "獲得 {{pokeballName}} x{{modifierCount}} (已有：{{pokeballAmount}}) \n捕捉倍率：{{catchRate}}",
    },
    AddVoucherModifierType: {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "獲得 {{voucherTypeName}} x{{modifierCount}}",
    },
    PokemonHeldItemModifierType: {
      extra: {
        inoperable: "{{pokemonName}} 無法攜帶\n這個物品！",
        tooMany: "{{pokemonName}} 已有太多\n這個物品！",
      },
    },
    PokemonHpRestoreModifierType: {
      description:
                "爲一隻寶可夢恢復 {{restorePoints}} HP 或 {{restorePercent}}% HP，取最大值",
      extra: {
        fully: "爲一隻寶可夢恢復全部HP",
        fullyWithStatus: "爲一隻寶可夢恢復全部HP並消除所有負面\n狀態",
      },
    },
    PokemonReviveModifierType: {
      description: "復活一隻寶可夢並恢復 {{restorePercent}}% HP",
    },
    PokemonStatusHealModifierType: {
      description: "爲一隻寶可夢消除所有負面狀態",
    },
    PokemonPpRestoreModifierType: {
      description: "爲一隻寶可夢的一個招式恢復 {{restorePoints}} PP",
      extra: { fully: "完全恢復一隻寶可夢一個招式的PP" },
    },
    PokemonAllMovePpRestoreModifierType: {
      description: "爲一隻寶可夢的所有招式恢復 {{restorePoints}} PP",
      extra: { fully: "爲一隻寶可夢的所有招式恢復所有PP" },
    },
    PokemonPpUpModifierType: {
      description:
                "永久提升一個招式的PP，每5點最大PP增加{{upPoints}} (最多3點)。",
    },
    PokemonNatureChangeModifierType: {
      name: "{{natureName}}薄荷",
      description:
                "將一隻寶可夢的性格改爲{{natureName}}併爲該寶可\n夢永久解鎖該性格.",
    },
    DoubleBattleChanceBoosterModifierType: {
      description: "接下來的{{battleCount}}場戰鬥是雙打的概率翻倍",
    },
    TempBattleStatBoosterModifierType: {
      description:
                "爲所有成員寶可夢提升一級{{tempBattleStatName}}，持續5場戰鬥",
    },
    AttackTypeBoosterModifierType: {
      description: "一隻寶可夢的{{moveType}}系招式威力提升20%",
    },
    PokemonLevelIncrementModifierType: {
      description: "一隻寶可夢等級提升1級",
    },
    AllPokemonLevelIncrementModifierType: {
      description: "所有成員寶可夢等級提升1級",
    },
    PokemonBaseStatBoosterModifierType: {
      description:
                "增加持有者的{{statName}}10%，個體值越高堆疊\n上限越高.",
    },
    AllPokemonFullHpRestoreModifierType: {
      description: "所有寶可夢完全恢復HP",
    },
    AllPokemonFullReviveModifierType: {
      description: "復活所有瀕死寶可夢，完全恢復HP",
    },
    MoneyRewardModifierType: {
      description: "獲得{{moneyMultiplier}}金錢 (₽{{moneyAmount}})",
      extra: { small: "少量", moderate: "中等", large: "大量" },
    },
    ExpBoosterModifierType: {
      description: "經驗值獲取量增加{{boostPercent}}%",
    },
    PokemonExpBoosterModifierType: {
      description: "持有者經驗值獲取量增加{{boostPercent}}%",
    },
    PokemonFriendshipBoosterModifierType: {
      description: "每場戰鬥獲得的好感度提升50%",
    },
    PokemonMoveAccuracyBoosterModifierType: {
      description: "招式命中率增加{{accuracyAmount}} (最大100)",
    },
    PokemonMultiHitModifierType: {
      description:
                "攻擊造成一次額外傷害，每次堆疊額外傷害\n分別衰減60/75/82.5%",
    },
    TmModifierType: {
      name: "招式學習器 {{moveId}} - {{moveName}}",
      description: "教會一隻寶可夢{{moveName}}",
    },
    TmModifierTypeWithInfo: {
      name: "TM{{moveId}} - {{moveName}}",
      description: "教會一隻寶可夢{{moveName}}\n(Hold C or Shift for more info)",
    },
    EvolutionItemModifierType: { description: "使某些寶可夢進化" },
    FormChangeItemModifierType: { description: "使某些寶可夢更改形態" },
    FusePokemonModifierType: {
      description:
                "融合兩隻寶可夢 (改變特性, 平分基礎點數\n和屬性, 共享招式池)",
    },
    TerastallizeModifierType: {
      name: "{{teraType}}太晶碎塊",
      description: "持有者獲得{{teraType}}太晶化10場戰鬥",
    },
    ContactHeldItemTransferChanceModifierType: {
      description: "攻擊時{{chancePercent}}%概率偷取對手物品",
    },
    TurnHeldItemTransferModifierType: {
      description: "持有者每回合從對手那裏獲得一個持有的物品",
    },
    EnemyAttackStatusEffectChanceModifierType: {
      description: "攻擊時{{chancePercent}}%概率造成{{statusEffect}}",
    },
    EnemyEndureChanceModifierType: {
      description: "增加{{chancePercent}}%遭受攻擊的概率",
    },
    RARE_CANDY: { name: "神奇糖果" },
    RARER_CANDY: { name: "超神奇糖果" },
    MEGA_BRACELET: {
      name: "超級手鐲",
      description: "能讓攜帶着超級石戰鬥的寶可夢進行\n超級進化",
    },
    DYNAMAX_BAND: {
      name: "極巨腕帶",
      description: "能讓攜帶着極巨菇菇戰鬥的寶可夢進行\n極巨化",
    },
    TERA_ORB: {
      name: "太晶珠",
      description: "能讓攜帶着太晶碎塊戰鬥的寶可夢進行\n太晶化",
    },
    MAP: {
      name: "地圖",
      description: "允許你在切換寶可夢羣落時選擇目的地",
    },
    POTION: { name: "傷藥" },
    SUPER_POTION: { name: "好傷藥" },
    HYPER_POTION: { name: "厲害傷藥" },
    MAX_POTION: { name: "全滿藥" },
    FULL_RESTORE: { name: "全復藥" },
    REVIVE: { name: "活力碎片" },
    MAX_REVIVE: { name: "活力塊" },
    FULL_HEAL: { name: "萬靈藥" },
    SACRED_ASH: { name: "聖灰" },
    REVIVER_SEED: {
      name: "復活種子",
      description: "恢復1只瀕死寶可夢的HP至1/2",
    },
    ETHER: { name: "PP單項小補劑" },
    MAX_ETHER: { name: "PP單項全補劑" },
    ELIXIR: { name: "PP多項小補劑" },
    MAX_ELIXIR: { name: "PP多項全補劑" },
    PP_UP: { name: "PP提升劑" },
    PP_MAX: { name: "PP極限提升劑" },
    LURE: { name: "引蟲香水" },
    SUPER_LURE: { name: "白銀香水" },
    MAX_LURE: { name: "黃金香水" },
    MEMORY_MUSHROOM: {
      name: "回憶蘑菇",
      description: "回憶一個寶可夢已經遺忘的招式",
    },
    EXP_SHARE: {
      name: "學習裝置",
      description: "未參加對戰的寶可夢獲得20%的經驗值",
    },
    EXP_BALANCE: {
      name: "均衡型學習裝置",
      description: "隊伍中的低級寶可夢獲得更多經驗值",
    },
    OVAL_CHARM: {
      name: "圓形護符",
      description:
                "當多隻寶可夢參與戰鬥，分別獲得總經驗值\n10%的額外經驗值",
    },
    EXP_CHARM: { name: "經驗護符" },
    SUPER_EXP_CHARM: { name: "超級經驗護符" },
    GOLDEN_EXP_CHARM: { name: "黃金經驗護符" },
    LUCKY_EGG: { name: "幸運蛋" },
    GOLDEN_EGG: { name: "金蛋" },
    SOOTHE_BELL: { name: "安撫之鈴" },
    SOUL_DEW: {
      name: "心之水滴",
      description: "增加寶可夢性格影響10% (加算)",
    },
    NUGGET: { name: "金珠" },
    BIG_NUGGET: { name: "巨大金珠" },
    RELIC_GOLD: { name: "古代金幣" },
    AMULET_COIN: { name: "護符金幣", description: "金錢獎勵增加20%" },
    GOLDEN_PUNCH: {
      name: "黃金拳頭",
      description: "將50%造成的傷害轉換爲金錢",
    },
    COIN_CASE: {
      name: "代幣盒",
      description: "每十場戰鬥, 獲得自己金錢10%的利息",
    },
    LOCK_CAPSULE: {
      name: "上鎖的容器",
      description: "允許在刷新物品時鎖定物品稀有度",
    },
    GRIP_CLAW: { name: "緊纏鉤爪" },
    WIDE_LENS: { name: "廣角鏡" },
    MULTI_LENS: { name: "多重鏡" },
    HEALING_CHARM: {
      name: "治癒護符",
      description: "HP恢復量增加10% (不含復活)",
    },
    CANDY_JAR: { name: "糖果罐", description: "神奇糖果提供的升級提升1級" },
    BERRY_POUCH: {
      name: "樹果袋",
      description: "使用樹果時有30%的幾率不會消耗樹果",
    },
    FOCUS_BAND: {
      name: "氣勢頭帶",
      description:
                "攜帶該道具的寶可夢有10%幾率在受到\n攻擊而將陷入瀕死狀態時，保留1點HP不陷入瀕死狀態",
    },
    QUICK_CLAW: {
      name: "先制之爪",
      description: "有10%的幾率無視速度優先使出招式\n(先制技能優先)",
    },
    KINGS_ROCK: {
      name: "王者之證",
      description:
                "攜帶該道具的寶可夢使用任意原本不會造成\n畏縮狀態的攻擊招式並造成傷害時，有\n10%幾率使目標陷入畏縮狀態",
    },
    LEFTOVERS: {
      name: "喫剩的東西",
      description: "攜帶該道具的寶可夢在每個回合結束時恢復\n最大HP的1/16",
    },
    SHELL_BELL: {
      name: "貝殼之鈴",
      description:
                "攜帶該道具的寶可夢在攻擊對方成功造成傷\n害時，攜帶者的HP會恢復其所造成傷害\n的1/8",
    },
    TOXIC_ORB: {
      name: "Toxic Orb",
      description:
                "It's a bizarre orb that exudes toxins when touched and will badly poison the holder during battle"
    },
    FLAME_ORB: {
      name: "Flame Orb",
      description:
                "It's a bizarre orb that gives off heat when touched and will affect the holder with a burn during battle"
    },
    BATON: {
      name: "接力棒",
      description: "允許在切換寶可夢時保留能力變化, 對陷阱\n同樣生效",
    },
    SHINY_CHARM: {
      name: "閃耀護符",
      description: "顯著增加野生寶可夢的閃光概率",
    },
    ABILITY_CHARM: {
      name: "特性護符",
      description: "顯著增加野生寶可夢有隱藏特性的概率",
    },
    IV_SCANNER: {
      name: "個體值探測器",
      description:
                "允許掃描野生寶可夢的個體值。 每個次顯示\n2個個體值. 最好的個體值優先顯示",
    },
    DNA_SPLICERS: { name: "基因之楔" },
    MINI_BLACK_HOLE: { name: "迷你黑洞" },
    GOLDEN_POKEBALL: {
      name: "黃金精靈球",
      description: "在每場戰鬥結束後增加一個額外物品選項",
    },
    ENEMY_DAMAGE_BOOSTER: {
      name: "傷害硬幣",
      description: "增加5%造成傷害",
    },
    ENEMY_DAMAGE_REDUCTION: {
      name: "防禦硬幣",
      description: "減少2.5%承受傷害",
    },
    ENEMY_HEAL: { name: "恢復硬幣", description: "每回合恢復2%最大HP" },
    ENEMY_ATTACK_POISON_CHANCE: { name: "劇毒硬幣" },
    ENEMY_ATTACK_PARALYZE_CHANCE: { name: "麻痹硬幣" },
    ENEMY_ATTACK_BURN_CHANCE: { name: "灼燒硬幣" },
    ENEMY_STATUS_EFFECT_HEAL_CHANCE: {
      name: "萬靈藥硬幣",
      description: "增加2.5%每回合治癒異常狀態的概率",
    },
    ENEMY_ENDURE_CHANCE: { name: "忍受硬幣" },
    ENEMY_FUSED_CHANCE: {
      name: "融合硬幣",
      description: "增加1%野生融合寶可夢出現概率",
    },
  },
  TempBattleStatBoosterItem: {
    x_attack: "力量強化",
    x_defense: "防禦強化",
    x_sp_atk: "特攻強化",
    x_sp_def: "特防強化",
    x_speed: "速度強化",
    x_accuracy: "命中強化",
    dire_hit: "要害攻擊",
  },
  AttackTypeBoosterItem: {
    silk_scarf: "絲綢圍巾",
    black_belt: "黑帶",
    sharp_beak: "銳利鳥嘴",
    poison_barb: "毒針",
    soft_sand: "柔軟沙子",
    hard_stone: "硬石頭",
    silver_powder: "銀粉",
    spell_tag: "詛咒之符",
    metal_coat: "金屬膜",
    charcoal: "木炭",
    mystic_water: "神祕水滴",
    miracle_seed: "奇蹟種子",
    magnet: "磁鐵",
    twisted_spoon: "彎曲的湯匙",
    never_melt_ice: "不融冰",
    dragon_fang: "龍之牙",
    black_glasses: "黑色眼鏡",
    fairy_feather: "妖精之羽",
  },
  BaseStatBoosterItem: {
    hp_up: "HP增強劑",
    protein: "攻擊增強劑",
    iron: "防禦增強劑",
    calcium: "特攻增強劑",
    zinc: "特防增強劑",
    carbos: "速度增強劑",
  },
  EvolutionItem: {
    NONE: "無",
    LINKING_CORD: "聯繫繩",
    SUN_STONE: "日之石",
    MOON_STONE: "月之石",
    LEAF_STONE: "葉之石",
    FIRE_STONE: "火之石",
    WATER_STONE: "水之石",
    THUNDER_STONE: "雷之石",
    ICE_STONE: "冰之石",
    DUSK_STONE: "暗之石",
    DAWN_STONE: "覺醒之石",
    SHINY_STONE: "光之石",
    CRACKED_POT: "破裂的茶壺",
    SWEET_APPLE: "甜甜蘋果",
    TART_APPLE: "酸酸蘋果",
    STRAWBERRY_SWEET: "草莓糖飾",
    UNREMARKABLE_TEACUP: "凡作茶碗",
    CHIPPED_POT: "缺損的茶壺",
    BLACK_AUGURITE: "黑奇石",
    GALARICA_CUFF: "伽勒豆蔻手環",
    GALARICA_WREATH: "伽勒豆蔻花圈",
    PEAT_BLOCK: "泥炭塊",
    AUSPICIOUS_ARMOR: "慶祝之鎧",
    MALICIOUS_ARMOR: "咒術之鎧",
    MASTERPIECE_TEACUP: "傑作茶碗",
    METAL_ALLOY: "複合金屬",
    SCROLL_OF_DARKNESS: "惡之掛軸",
    SCROLL_OF_WATERS: "水之掛軸",
    SYRUPY_APPLE: "蜜汁蘋果",
  },
  FormChangeItem: {
    NONE: "無",
    ABOMASITE: "暴雪王進化石",
    ABSOLITE: "阿勃梭魯進化石",
    AERODACTYLITE: "化石翼龍進化石",
    AGGRONITE: "波士可多拉進化石",
    ALAKAZITE: "胡地進化石",
    ALTARIANITE: "七夕青鳥進化石",
    AMPHAROSITE: "電龍進化石",
    AUDINITE: "差不多娃娃進化石",
    BANETTITE: "詛咒娃娃進化石",
    BEEDRILLITE: "大針蜂進化石",
    BLASTOISINITE: "水箭龜進化石",
    BLAZIKENITE: "火焰雞進化石",
    CAMERUPTITE: "噴火駝進化石",
    CHARIZARDITE_X: "噴火龍進化石Ｘ",
    CHARIZARDITE_Y: "噴火龍進化石Ｙ",
    DIANCITE: "蒂安希進化石",
    GALLADITE: "艾路雷朵進化石",
    GARCHOMPITE: "烈咬陸鯊進化石",
    GARDEVOIRITE: "沙奈朵進化石",
    GENGARITE: "耿鬼進化石",
    GLALITITE: "冰鬼護進化石",
    GYARADOSITE: "暴鯉龍進化石",
    HERACRONITE: "赫拉克羅斯進化石",
    HOUNDOOMINITE: "黑魯加進化石",
    KANGASKHANITE: "袋獸進化石",
    LATIASITE: "拉帝亞斯進化石",
    LATIOSITE: "拉帝歐斯進化石",
    LOPUNNITE: "長耳兔進化石",
    LUCARIONITE: "路卡利歐進化石",
    MANECTITE: "雷電獸進化石",
    MAWILITE: "大嘴娃進化石",
    MEDICHAMITE: "恰雷姆進化石",
    METAGROSSITE: "巨金怪進化石",
    MEWTWONITE_X: "超夢進化石Ｘ",
    MEWTWONITE_Y: "超夢進化石Ｙ",
    PIDGEOTITE: "大比鳥進化石",
    PINSIRITE: "凱羅斯進化石",
    RAYQUAZITE: "烈空坐進化石",
    SABLENITE: "勾魂眼進化石",
    SALAMENCITE: "暴飛龍進化石",
    SCEPTILITE: "蜥蜴王進化石",
    SCIZORITE: "巨鉗螳螂進化石",
    SHARPEDONITE: "巨牙鯊進化石",
    SLOWBRONITE: "呆殼獸進化石",
    STEELIXITE: "大鋼蛇進化石",
    SWAMPERTITE: "巨沼怪進化石",
    TYRANITARITE: "班基拉斯進化石",
    VENUSAURITE: "妙蛙花進化石",
    BLUE_ORB: "靛藍色寶珠",
    RED_ORB: "硃紅色寶珠",
    SHARP_METEORITE: "銳利隕石",
    HARD_METEORITE: "堅硬隕石",
    SMOOTH_METEORITE: "光滑隕石",
    ADAMANT_CRYSTAL: "大金剛寶玉",
    LUSTROUS_GLOBE: "大白寶玉",
    GRISEOUS_CORE: "大白金寶玉",
    REVEAL_GLASS: "現形鏡",
    GRACIDEA: "葛拉西蒂亞花",
    MAX_MUSHROOMS: "極巨菇菇",
    DARK_STONE: "黑暗石",
    LIGHT_STONE: "光明石",
    PRISON_BOTTLE: "懲戒之壺",
    N_LUNARIZER: "奈克洛露奈合體器",
    N_SOLARIZER: "奈克洛索爾合體器",
    RUSTED_SWORD: "腐朽的劍",
    RUSTED_SHIELD: "腐朽的盾",
    ICY_REINS_OF_UNITY: "牽絆繮繩(冰)",
    SHADOW_REINS_OF_UNITY: "牽絆繮繩(幽靈)",
    WELLSPRING_MASK: "水井面具",
    HEARTHFLAME_MASK: "火竈面具",
    CORNERSTONE_MASK: "礎石面具",
    SHOCK_DRIVE: "閃電卡帶",
    BURN_DRIVE: "火焰卡帶",
    CHILL_DRIVE: "冰凍卡帶",
    DOUSE_DRIVE: "水流卡帶",
  },
} as const;
