import { ModifierTypeTranslationEntries } from "#app/interfaces/locales";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{modifierCount}}x {{pokeballName}}",
      description: "获得 {{pokeballName}} x{{modifierCount}} (已有：{{pokeballAmount}}) \n捕捉倍率：{{catchRate}}。",
    },
    "AddVoucherModifierType": {
      name: "{{modifierCount}}x {{voucherTypeName}}",
      description: "获得 {{voucherTypeName}} x{{modifierCount}}。",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}} 无法携带\n这个物品！",
        "tooMany": "{{pokemonName}} 已有太多\n这个物品！",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "为一只宝可梦回复 {{restorePoints}} HP 或 {{restorePercent}}% HP，取较大值。",
      extra: {
        "fully": "为一只宝可梦回复全部HP。",
        "fullyWithStatus": "为一只宝可梦回复全部HP并消除所有负面\n状态。",
      }
    },
    "PokemonReviveModifierType": {
      description: "复活一只宝可梦并回复 {{restorePercent}}% HP。",
    },
    "PokemonStatusHealModifierType": {
      description: "为一只宝可梦消除所有负面状态。",
    },
    "PokemonPpRestoreModifierType": {
      description: "为一只宝可梦的一个招式回复 {{restorePoints}} PP。",
      extra: {
        "fully": "完全回复一只宝可梦一个招式的PP。",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "为一只宝可梦的所有招式回复 {{restorePoints}} PP。",
      extra: {
        "fully": "为一只宝可梦的所有招式回复所有PP。",
      }
    },
    "PokemonPpUpModifierType": {
      description: "为一只宝可梦的一个招式永久增加{{upPoints}}点\nPP每5点当前最大PP (最多3点)。",
    },
    "PokemonNatureChangeModifierType": {
      name: "{{natureName}}薄荷",
      description: "将一只宝可梦的性格改为{{natureName}}并为该宝可\n梦永久解锁该性格。",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "接下来的{{battleCount}}场战斗是双打的概率翻倍。",
    },
    "TempBattleStatBoosterModifierType": {
      description: "为所有成员宝可梦提升一级{{tempBattleStatName}}，持续5场战斗。",
    },
    "AttackTypeBoosterModifierType": {
      description: "一只宝可梦的{{moveType}}系招式威力提升20%。",
    },
    "PokemonLevelIncrementModifierType": {
      description: "一只宝可梦等级提升1级。",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "所有成员宝可梦等级提升1级。",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "增加持有者的{{statName}}10%，个体值越高堆叠\n上限越高。",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "所有宝可梦完全回复HP。",
    },
    "AllPokemonFullReviveModifierType": {
      description: "复活所有濒死宝可梦，完全回复HP。",
    },
    "MoneyRewardModifierType": {
      description: "获得{{moneyMultiplier}}金钱 (₽{{moneyAmount}})。",
      extra: {
        "small": "少量",
        "moderate": "中等",
        "large": "大量",
      },
    },
    "ExpBoosterModifierType": {
      description: "经验值获取量增加{{boostPercent}}%。",
    },
    "PokemonExpBoosterModifierType": {
      description: "持有者经验值获取量增加{{boostPercent}}%。",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "每场战斗获得的好感度提升50%。",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "招式命中率增加{{accuracyAmount}} (最大100)。",
    },
    "PokemonMultiHitModifierType": {
      description: "攻击造成一次额外伤害，\n每堆叠一件会让攻击伤害\n衰减60/75/82.5%。",
    },
    "TmModifierType": {
      name: "招式学习器 {{moveId}} - {{moveName}}",
      description: "教会一只宝可梦{{moveName}}。",
    },
    "TmModifierTypeWithInfo": {
      name: "招式学习器 {{moveId}} - {{moveName}}",
      description: "教会一只宝可梦{{moveName}}\n(Hold C or Shift for more info)。",
    },
    "EvolutionItemModifierType": {
      description: "使某些宝可梦进化。",
    },
    "FormChangeItemModifierType": {
      description: "使某些宝可梦更改形态。",
    },
    "FusePokemonModifierType": {
      description: "融合两只宝可梦 (改变特性, 平分基础点数\n和属性, 共享招式池)。",
    },
    "TerastallizeModifierType": {
      name: "{{teraType}}太晶碎块",
      description: "持有者获得{{teraType}}太晶化10场战斗。",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "攻击时{{chancePercent}}%概率偷取对手物品。",
    },
    "TurnHeldItemTransferModifierType": {
      description: "持有者每回合从对手那里获得一个持有的物品。",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "攻击时{{chancePercent}}%概率造成{{statusEffect}}。",
    },
    "EnemyEndureChanceModifierType": {
      description: "敌方增加{{chancePercent}}%的概率在本回合不会倒下。",
    },

    "RARE_CANDY": { name: "神奇糖果" },
    "RARER_CANDY": { name: "超神奇糖果" },

    "MEGA_BRACELET": { name: "超级手镯", description: "能让携带着超级石战斗的宝可梦进行\n超级进化。" },
    "DYNAMAX_BAND": { name: "极巨腕带", description: "能让携带着极巨菇菇战斗的宝可梦进行\n极巨化。" },
    "TERA_ORB": { name: "太晶珠", description: "能让携带着太晶碎块战斗的宝可梦进行\n太晶化。" },

    "MAP": { name: "地图", description: "允许你在切换宝可梦群落时选择目的地。"},

    "POTION": { name: "伤药" },
    "SUPER_POTION": { name: "好伤药" },
    "HYPER_POTION": { name: "厉害伤药" },
    "MAX_POTION": { name: "全满药" },
    "FULL_RESTORE": { name: "全复药" },

    "REVIVE": { name: "活力碎片" },
    "MAX_REVIVE": { name: "活力块" },

    "FULL_HEAL": { name: "万灵药" },

    "SACRED_ASH": { name: "圣灰" },

    "REVIVER_SEED": { name: "复活种子", description: "恢复1只濒死宝可梦的HP至1/2。" },

    "ETHER": { name: "PP单项小补剂" },
    "MAX_ETHER": { name: "PP单项全补剂" },

    "ELIXIR": { name: "PP多项小补剂" },
    "MAX_ELIXIR": { name: "PP多项全补剂" },

    "PP_UP": { name: "PP提升剂" },
    "PP_MAX": { name: "PP极限提升剂" },

    "LURE": { name: "引虫香水" },
    "SUPER_LURE": { name: "白银香水" },
    "MAX_LURE": { name: "黄金香水" },

    "MEMORY_MUSHROOM": { name: "回忆蘑菇", description: "回忆一个宝可梦已经遗忘的招式。" },

    "EXP_SHARE": { name: "学习装置", description: "未参加对战的宝可梦获得20%的经验值。" },
    "EXP_BALANCE": { name: "均衡型学习装置", description: "队伍中的低级宝可梦获得更多经验值。" },

    "OVAL_CHARM": { name: "圆形护符", description: "当多只宝可梦参与战斗，分别获得总经验值\n10%的额外经验值。" },

    "EXP_CHARM": { name: "经验护符" },
    "SUPER_EXP_CHARM": { name: "超级经验护符" },
    "GOLDEN_EXP_CHARM": { name: "黄金经验护符" },

    "LUCKY_EGG": { name: "幸运蛋" },
    "GOLDEN_EGG": { name: "金蛋" },

    "SOOTHE_BELL": { name: "安抚之铃" },

    "SOUL_DEW": { name: "心之水滴", description: "增加宝可梦性格影响10% (加算)。" },

    "NUGGET": { name: "金珠" },
    "BIG_NUGGET": { name: "巨大金珠" },
    "RELIC_GOLD": { name: "古代金币" },

    "AMULET_COIN": { name: "护符金币", description: "金钱奖励增加20%。" },
    "GOLDEN_PUNCH": { name: "黄金拳头", description: "将50%造成的伤害转换为金钱。" },
    "COIN_CASE": { name: "代币盒", description: "每十场战斗, 获得自己金钱10%的利息。" },

    "LOCK_CAPSULE": { name: "上锁的容器", description: "允许在刷新物品时锁定物品稀有度。" },

    "GRIP_CLAW": { name: "紧缠钩爪" },
    "WIDE_LENS": { name: "广角镜" },

    "MULTI_LENS": { name: "多重镜" },

    "HEALING_CHARM": { name: "治愈护符", description: "HP回复量增加10% (不含复活)。" },
    "CANDY_JAR": { name: "糖果罐", description: "神奇糖果提供的升级额外增加1级。" },

    "BERRY_POUCH": { name: "树果袋", description: "使用树果时有30%的几率不会消耗树果。" },

    "FOCUS_BAND": { name: "气势头带", description: "携带该道具的宝可梦有10%几率在受到\n攻击而将陷入濒死状态时，保留1点HP不陷入濒死状态。" },

    "QUICK_CLAW": { name: "先制之爪", description: "有10%的几率无视速度优先使出招式\n(先制技能优先)。" },

    "KINGS_ROCK": { name: "王者之证", description: "携带该道具的宝可梦使用任意原本不会造成\n畏缩状态的攻击招式并造成伤害时，有\n10%几率使目标陷入畏缩状态。" },

    "LEFTOVERS": { name: "吃剩的东西", description: "携带该道具的宝可梦在每个回合结束时恢复\n最大HP的1/16。" },
    "SHELL_BELL": { name: "贝壳之铃", description: "携带该道具的宝可梦在攻击对方成功造成伤\n害时，携带者的HP会恢复其所造成伤害\n的1/8。" },

    "TOXIC_ORB": { name: "剧毒宝珠", description: "触碰后会放出毒的神奇宝珠。携带后，在战斗时会变成剧毒状态。" },
    "FLAME_ORB": { name: "火焰宝珠", description: "触碰后会放出热量的神奇宝珠。携带后，在战斗时会变成灼伤状态。" },

    "BATON": { name: "接力棒", description: "允许在切换宝可梦时保留能力变化, 对陷阱\n同样生效。" },

    "SHINY_CHARM": { name: "闪耀护符", description: "显著增加野生宝可梦的闪光概率。" },
    "ABILITY_CHARM": { name: "特性护符", description: "显著增加野生宝可梦有隐藏特性的概率。" },

    "IV_SCANNER": { name: "个体值探测器", description: "允许扫描野生宝可梦的个体值。可叠加，每多拥有一个多显示\n2项个体值. 最好的个体值优先显示。" },

    "DNA_SPLICERS": { name: "基因之楔" },

    "MINI_BLACK_HOLE": { name: "迷你黑洞" },

    "GOLDEN_POKEBALL": { name: "黄金精灵球", description: "在每场战斗结束后增加一个额外物品选项。" },

    "ENEMY_DAMAGE_BOOSTER": { name: "伤害硬币", description: "造成5%额外伤害（乘算）。" },
    "ENEMY_DAMAGE_REDUCTION": { name: "防御硬币", description: "受到2.5%更少伤害（乘算）。" },
    "ENEMY_HEAL": { name: "回复硬币", description: "每回合回复2%最大HP。" },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "剧毒硬币" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "麻痹硬币" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "灼烧硬币" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "万灵药硬币", description: "增加2.5%每回合治愈异常状态的概率。" },
    "ENEMY_ENDURE_CHANCE": { name: "忍受硬币" },
    "ENEMY_FUSED_CHANCE": { name: "融合硬币", description: "增加1%野生融合宝可梦出现概率。" },
  },
  TempBattleStatBoosterItem: {
    "x_attack": "力量强化",
    "x_defense": "防御强化",
    "x_sp_atk": "特攻强化",
    "x_sp_def": "特防强化",
    "x_speed": "速度强化",
    "x_accuracy": "命中强化",
    "dire_hit": "要害攻击",
  },

  TempBattleStatBoosterStatName: {
    "ATK": "攻击",
    "DEF": "防御",
    "SPATK": "特攻",
    "SPDEF": "特防",
    "SPD": "速度",
    "ACC": "命中",
    "CRIT": "会心",
    "EVA": "闪避",
    "DEFAULT": "???",
  },

  AttackTypeBoosterItem: {
    "silk_scarf": "丝绸围巾",
    "black_belt": "黑带",
    "sharp_beak": "锐利鸟嘴",
    "poison_barb": "毒针",
    "soft_sand": "柔软沙子",
    "hard_stone": "硬石头",
    "silver_powder": "银粉",
    "spell_tag": "诅咒之符",
    "metal_coat": "金属膜",
    "charcoal": "木炭",
    "mystic_water": "神秘水滴",
    "miracle_seed": "奇迹种子",
    "magnet": "磁铁",
    "twisted_spoon": "弯曲的汤匙",
    "never_melt_ice": "不融冰",
    "dragon_fang": "龙之牙",
    "black_glasses": "黑色眼镜",
    "fairy_feather": "妖精之羽",
  },
  BaseStatBoosterItem: {
    "hp_up": "HP增强剂",
    "protein": "攻击增强剂",
    "iron": "防御增强剂",
    "calcium": "特攻增强剂",
    "zinc": "特防增强剂",
    "carbos": "速度增强剂",
  },
  EvolutionItem: {
    "NONE": "无",

    "LINKING_CORD": "联系绳",
    "SUN_STONE": "日之石",
    "MOON_STONE": "月之石",
    "LEAF_STONE": "叶之石",
    "FIRE_STONE": "火之石",
    "WATER_STONE": "水之石",
    "THUNDER_STONE": "雷之石",
    "ICE_STONE": "冰之石",
    "DUSK_STONE": "暗之石",
    "DAWN_STONE": "觉醒之石",
    "SHINY_STONE": "光之石",
    "CRACKED_POT": "破裂的茶壶",
    "SWEET_APPLE": "甜甜苹果",
    "TART_APPLE": "酸酸苹果",
    "STRAWBERRY_SWEET": "草莓糖饰",
    "UNREMARKABLE_TEACUP": "凡作茶碗",

    "CHIPPED_POT": "缺损的茶壶",
    "BLACK_AUGURITE": "黑奇石",
    "GALARICA_CUFF": "伽勒豆蔻手环",
    "GALARICA_WREATH": "伽勒豆蔻花圈",
    "PEAT_BLOCK": "泥炭块",
    "AUSPICIOUS_ARMOR": "庆祝之铠",
    "MALICIOUS_ARMOR": "咒术之铠",
    "MASTERPIECE_TEACUP": "杰作茶碗",
    "METAL_ALLOY": "复合金属",
    "SCROLL_OF_DARKNESS": "恶之挂轴",
    "SCROLL_OF_WATERS": "水之挂轴",
    "SYRUPY_APPLE": "蜜汁苹果",
  },
  FormChangeItem: {
    "NONE": "无",

    "ABOMASITE": "暴雪王进化石",
    "ABSOLITE": "阿勃梭鲁进化石",
    "AERODACTYLITE": "化石翼龙进化石",
    "AGGRONITE": "波士可多拉进化石",
    "ALAKAZITE": "胡地进化石",
    "ALTARIANITE": "七夕青鸟进化石",
    "AMPHAROSITE": "电龙进化石",
    "AUDINITE": "差不多娃娃进化石",
    "BANETTITE": "诅咒娃娃进化石",
    "BEEDRILLITE": "大针蜂进化石",
    "BLASTOISINITE": "水箭龟进化石",
    "BLAZIKENITE": "火焰鸡进化石",
    "CAMERUPTITE": "喷火驼进化石",
    "CHARIZARDITE_X": "喷火龙进化石Ｘ",
    "CHARIZARDITE_Y": "喷火龙进化石Ｙ",
    "DIANCITE": "蒂安希进化石",
    "GALLADITE": "艾路雷朵进化石",
    "GARCHOMPITE": "烈咬陆鲨进化石",
    "GARDEVOIRITE": "沙奈朵进化石",
    "GENGARITE": "耿鬼进化石",
    "GLALITITE": "冰鬼护进化石",
    "GYARADOSITE": "暴鲤龙进化石",
    "HERACRONITE": "赫拉克罗斯进化石",
    "HOUNDOOMINITE": "黑鲁加进化石",
    "KANGASKHANITE": "袋兽进化石",
    "LATIASITE": "拉帝亚斯进化石",
    "LATIOSITE": "拉帝欧斯进化石",
    "LOPUNNITE": "长耳兔进化石",
    "LUCARIONITE": "路卡利欧进化石",
    "MANECTITE": "雷电兽进化石",
    "MAWILITE": "大嘴娃进化石",
    "MEDICHAMITE": "恰雷姆进化石",
    "METAGROSSITE": "巨金怪进化石",
    "MEWTWONITE_X": "超梦进化石Ｘ",
    "MEWTWONITE_Y": "超梦进化石Ｙ",
    "PIDGEOTITE": "大比鸟进化石",
    "PINSIRITE": "凯罗斯进化石",
    "RAYQUAZITE": "烈空坐进化石",
    "SABLENITE": "勾魂眼进化石",
    "SALAMENCITE": "暴飞龙进化石",
    "SCEPTILITE": "蜥蜴王进化石",
    "SCIZORITE": "巨钳螳螂进化石",
    "SHARPEDONITE": "巨牙鲨进化石",
    "SLOWBRONITE": "呆壳兽进化石",
    "STEELIXITE": "大钢蛇进化石",
    "SWAMPERTITE": "巨沼怪进化石",
    "TYRANITARITE": "班基拉斯进化石",
    "VENUSAURITE": "妙蛙花进化石",

    "BLUE_ORB": "靛蓝色宝珠",
    "RED_ORB": "朱红色宝珠",
    "SHARP_METEORITE": "锐利陨石",
    "HARD_METEORITE": "坚硬陨石",
    "SMOOTH_METEORITE": "光滑陨石",
    "ADAMANT_CRYSTAL": "大金刚宝玉",
    "LUSTROUS_GLOBE": "大白宝玉",
    "GRISEOUS_CORE": "大白金宝玉",
    "REVEAL_GLASS": "现形镜",
    "GRACIDEA": "葛拉西蒂亚花",
    "MAX_MUSHROOMS": "极巨菇菇",
    "DARK_STONE": "黑暗石",
    "LIGHT_STONE": "光明石",
    "PRISON_BOTTLE": "惩戒之壶",
    "N_LUNARIZER": "奈克洛露奈合体器",
    "N_SOLARIZER": "奈克洛索尔合体器",
    "RUSTED_SWORD": "腐朽的剑",
    "RUSTED_SHIELD": "腐朽的盾",
    "ICY_REINS_OF_UNITY": "牵绊缰绳(冰)",
    "SHADOW_REINS_OF_UNITY": "牵绊缰绳(幽灵)",
    "WELLSPRING_MASK": "水井面具",
    "HEARTHFLAME_MASK": "火灶面具",
    "CORNERSTONE_MASK": "础石面具",
    "SHOCK_DRIVE": "闪电卡带",
    "BURN_DRIVE": "火焰卡带",
    "CHILL_DRIVE": "冰冻卡带",
    "DOUSE_DRIVE": "水流卡带",

    "FIST_PLATE": "拳头石板",
    "SKY_PLATE": "蓝天石板",
    "TOXIC_PLATE": "剧毒石板",
    "EARTH_PLATE": "大地石板",
    "STONE_PLATE": "岩石石板",
    "INSECT_PLATE": "玉虫石板",
    "SPOOKY_PLATE": "妖怪石板",
    "IRON_PLATE": "钢铁石板",
    "FLAME_PLATE": "火球石板",
    "SPLASH_PLATE": "水滴石板",
    "MEADOW_PLATE": "碧绿石板",
    "ZAP_PLATE": "雷电石板",
    "MIND_PLATE": "神奇石板",
    "ICICLE_PLATE": "冰柱石板",
    "DRACO_PLATE": "龙之石板",
    "DREAD_PLATE": "恶颜石板",
    "PIXIE_PLATE": "妖精石板",
    "BLANK_PLATE": "净空石板",
    "LEGEND_PLATE": "传说石板",
    "FIGHTING_MEMORY": "战斗存储碟",
    "FLYING_MEMORY": "飞翔存储碟",
    "POISON_MEMORY": "毒存储碟",
    "GROUND_MEMORY": "大地存储碟",
    "ROCK_MEMORY": "岩石存储碟",
    "BUG_MEMORY": "虫子存储碟",
    "GHOST_MEMORY": "幽灵存储碟",
    "STEEL_MEMORY": "钢铁存储碟",
    "FIRE_MEMORY": "火焰存储碟",
    "WATER_MEMORY": "清水存储碟",
    "GRASS_MEMORY": "青草存储碟",
    "ELECTRIC_MEMORY": "电子存储碟",
    "PSYCHIC_MEMORY": "精神存储碟",
    "ICE_MEMORY": "冰雪存储碟",
    "DRAGON_MEMORY": "龙存储碟",
    "DARK_MEMORY": "黑暗存储碟",
    "FAIRY_MEMORY": "妖精存储碟",
    "BLANK_MEMORY": "空白存储碟",
  },
} as const;
