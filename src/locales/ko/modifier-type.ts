import { ModifierTypeTranslationEntries } from "#app/plugins/i18n";

export const modifierType: ModifierTypeTranslationEntries = {
  ModifierType: {
    "AddPokeballModifierType": {
      name: "{{pokeballName}} {{modifierCount}}개",
      description: "{{pokeballName}} {{modifierCount}}개 (현재: {{pokeballAmount}}개)를 획득한다.\n포획률: {{catchRate}}",
    },
    "AddVoucherModifierType": {
      name: "{{voucherTypeName}} {{modifierCount}}장",
      description: "{{voucherTypeName}} {{modifierCount}}장을 획득",
    },
    "PokemonHeldItemModifierType": {
      extra: {
        "inoperable": "{{pokemonName}}[[는]]\n이 아이템을 얻을 수 없다!",
        "tooMany": "{{pokemonName}}[[는]]\n이 아이템을 너무 많이 갖고 있다!",
      }
    },
    "PokemonHpRestoreModifierType": {
      description: "포켓몬 1마리의 HP를 {{restorePoints}} 또는 {{restorePercent}}% 중\n높은 수치만큼 회복",
      extra: {
        "fully": "포켓몬 1마리의 HP를 모두 회복",
        "fullyWithStatus": "포켓몬 1마리의 HP와 상태 이상을 모두 회복",
      }
    },
    "PokemonReviveModifierType": {
      description: "기절해 버린 포켓몬 1마리의 HP를 {{restorePercent}}%까지 회복",
    },
    "PokemonStatusHealModifierType": {
      description: "포켓몬 1마리의 상태 이상을 모두 회복",
    },
    "PokemonPpRestoreModifierType": {
      description: "포켓몬이 기억하고 있는 기술 중 1개의 PP를 {{restorePoints}}만큼 회복",
      extra: {
        "fully": "포켓몬이 기억하고 있는 기술 중 1개의 PP를 모두 회복",
      }
    },
    "PokemonAllMovePpRestoreModifierType": {
      description: "포켓몬이 기억하고 있는 4개의 기술 PP를 {{restorePoints}}씩 회복",
      extra: {
        "fully": "포켓몬이 기억하고 있는 4개의 기술 PP를 모두 회복",
      }
    },
    "PokemonPpUpModifierType": {
      description: "포켓몬이 기억하고 있는 기술 중 1개의 PP 최대치를 5마다 {{upPoints}}씩 상승 (최대 3)",
    },
    "PokemonNatureChangeModifierType": {
      name: "{{natureName}}민트",
      description: "포켓몬의 성격을 {{natureName}}[[로]] 바꾸고 스타팅에도 등록한다.",
    },
    "DoubleBattleChanceBoosterModifierType": {
      description: "{{battleCount}}번의 배틀 동안 더블 배틀이 등장할 확률 두 배",
    },
    "TempBattleStatBoosterModifierType": {
      description: "자신의 모든 포켓몬이 5번의 배틀 동안 {{tempBattleStatName}}[[가]] 한 단계 증가"
    },
    "AttackTypeBoosterModifierType": {
      description: "지니게 하면 {{moveType}}타입 기술의 위력이 20% 상승",
    },
    "PokemonLevelIncrementModifierType": {
      description: "포켓몬 1마리의 레벨이 1만큼 상승",
    },
    "AllPokemonLevelIncrementModifierType": {
      description: "자신의 모든 포켓몬의 레벨이 1씩 상승",
    },
    "PokemonBaseStatBoosterModifierType": {
      description: "지니게 하면 {{statName}} 종족값을 10% 올려준다. 개체값이 높을수록 더 많이 누적시킬 수 있다.",
    },
    "AllPokemonFullHpRestoreModifierType": {
      description: "자신의 포켓몬의 HP를 모두 회복",
    },
    "AllPokemonFullReviveModifierType": {
      description: "자신의 포켓몬의 HP를 기절해 버렸더라도 모두 회복",
    },
    "MoneyRewardModifierType": {
      description: "{{moneyMultiplier}} 양의 돈을 획득 (₽{{moneyAmount}})",
      extra: {
        "small": "적은",
        "moderate": "적당한",
        "large": "많은",
      },
    },
    "ExpBoosterModifierType": {
      description: "포켓몬이 받는 경험치가 늘어나는 부적. {{boostPercent}}% 증가",
    },
    "PokemonExpBoosterModifierType": {
      description: "지니게 한 포켓몬은 받을 수 있는 경험치가 {{boostPercent}}% 증가",
    },
    "PokemonFriendshipBoosterModifierType": {
      description: "배틀 승리로 얻는 친밀도가 50% 증가",
    },
    "PokemonMoveAccuracyBoosterModifierType": {
      description: "기술의 명중률이 {{accuracyAmount}} 증가 (최대 100)",
    },
    "PokemonMultiHitModifierType": {
      description: "지닌 개수(최대 3개)마다 추가 공격을 하는 대신, 공격력이 60%(1개)/75%(2개)/82.5%(3개)만큼 감소합니다.",
    },
    "TmModifierType": {
      name: "No.{{moveId}} {{moveName}}",
      description: "포켓몬에게 {{moveName}}[[를]] 가르침",
    },
    "TmModifierTypeWithInfo": {
      name: "No.{{moveId}} {{moveName}}",
      description: "포켓몬에게 {{moveName}}를(을) 가르침\n(C 또는 Shift를 꾹 눌러 정보 확인)",
    },
    "EvolutionItemModifierType": {
      description: "어느 특정 포켓몬을 진화",
    },
    "FormChangeItemModifierType": {
      description: "어느 특정 포켓몬을 폼 체인지",
    },
    "FusePokemonModifierType": {
      description: "두 포켓몬을 결합 (특성 변환, 종족값과 타입 분배, 기술폭 공유)",
    },
    "TerastallizeModifierType": {
      name: "테라피스 {{teraType}}",
      description: "지니게 하면 10번의 배틀 동안 {{teraType}} 테라스탈타입으로 테라스탈",
    },
    "ContactHeldItemTransferChanceModifierType": {
      description: "공격했을 때, {{chancePercent}}%의 확률로 상대의 도구를 도둑질",
    },
    "TurnHeldItemTransferModifierType": {
      description: "매 턴, 지닌 포켓몬은 상대로부터 도구를 하나 획득",
    },
    "EnemyAttackStatusEffectChanceModifierType": {
      description: "공격했을 때 {{statusEffect}} 상태로 만들 확률 {{chancePercent}}% 추가",
    },
    "EnemyEndureChanceModifierType": {
      description: "받은 공격을 버텨낼 확률 {{chancePercent}}% 추가",
    },

    "RARE_CANDY": { name: "이상한사탕" },
    "RARER_CANDY": { name: "더이상한사탕" },

    "MEGA_BRACELET": { name: "메가링", description: "메가스톤을 사용 가능" },
    "DYNAMAX_BAND": { name: "다이맥스 밴드", description: "다이버섯을 사용 가능" },
    "TERA_ORB": { name: "테라스탈오브", description: "테라피스를 사용 가능" },

    "MAP": { name: "지도", description: "갈림길에서 목적지 선택 가능" },

    "POTION": { name: "상처약" },
    "SUPER_POTION": { name: "좋은상처약" },
    "HYPER_POTION": { name: "고급상처약" },
    "MAX_POTION": { name: "풀회복약" },
    "FULL_RESTORE": { name: "회복약" },

    "REVIVE": { name: "기력의조각" },
    "MAX_REVIVE": { name: "기력의덩어리" },

    "FULL_HEAL": { name: "만병통치제" },

    "SACRED_ASH": { name: "성스러운분말" },

    "REVIVER_SEED": { name: "부활의씨앗", description: "포켓몬이 쓰러지려 할 때 HP를 절반 회복" },

    "ETHER": { name: "PP에이드" },
    "MAX_ETHER": { name: "PP회복" },

    "ELIXIR": { name: "PP에이더" },
    "MAX_ELIXIR": { name: "PP맥스" },

    "PP_UP": { name: "포인트업" },
    "PP_MAX": { name: "포인트맥스" },

    "LURE": { name: "더블배틀코롱" },
    "SUPER_LURE": { name: "실버코롱" },
    "MAX_LURE": { name: "골드코롱" },

    "MEMORY_MUSHROOM": { name: "기억버섯", description: "포켓몬의 잊어버린 기술을 떠올림" },

    "EXP_SHARE": { name: "학습장치", description: "배틀에 참여하지 않아도 20%의 경험치를 받을 수 있는 장치" },
    "EXP_BALANCE": { name: "균형학습장치", description: "레벨이 낮은 포켓몬이 받는 경험치를 가중" },

    "OVAL_CHARM": { name: "둥근부적", description: "여러 마리의 포켓몬이 배틀에 참여할 경우, 전체 경험치의 10%씩을 추가로 획득" },

    "EXP_CHARM": { name: "경험부적" },
    "SUPER_EXP_CHARM": { name: "좋은경험부적" },
    "GOLDEN_EXP_CHARM": { name: "황금경험부적" },

    "LUCKY_EGG": { name: "행복의알" },
    "GOLDEN_EGG": { name: "황금의알" },

    "SOOTHE_BELL": { name: "평온의방울" },

    "SOUL_DEW": { name: "마음의물방울", description: "지닌 포켓몬의 성격의 효과가 10% 증가 (합연산)" },

    "NUGGET": { name: "금구슬" },
    "BIG_NUGGET": { name: "큰금구슬" },
    "RELIC_GOLD": { name: "고대의금화" },

    "AMULET_COIN": { name: "부적금화", description: "받는 돈이 20% 증가" },
    "GOLDEN_PUNCH": { name: "골든펀치", description: "주는 데미지의 50%만큼 돈을 획득" },
    "COIN_CASE": { name: "동전케이스", description: "매 열 번째 배틀마다, 가진 돈의 10%를 이자로 획득" },

    "LOCK_CAPSULE": { name: "록캡슐", description: "받을 아이템을 갱신할 때 희귀도를 고정 가능" },

    "GRIP_CLAW": { name: "끈기갈고리손톱" },
    "WIDE_LENS": { name: "광각렌즈" },

    "MULTI_LENS": { name: "멀티렌즈" },

    "HEALING_CHARM": { name: "치유의부적", description: "HP를 회복하는 기술을 썼을 때 효율이 10% 증가 (부활 제외)" },
    "CANDY_JAR": { name: "사탕단지", description: "이상한사탕 종류의 아이템이 올려주는 레벨 1 증가" },

    "BERRY_POUCH": { name: "열매주머니", description: "사용한 나무열매가 소모되지 않을 확률 33% 추가" },

    "FOCUS_BAND": { name: "기합의머리띠", description: "기절할 듯한 데미지를 받아도 HP를 1 남겨서 견딜 확률 10% 추가" },

    "QUICK_CLAW": { name: "선제공격손톱", description: "상대보다 먼저 행동할 수 있게 될 확률 10% 추가 (우선도 처리 이후)" },

    "KINGS_ROCK": { name: "왕의징표석", description: "공격해서 데미지를 줄 때 상대를 풀죽일 확률 10% 추가" },

    "LEFTOVERS": { name: "먹다남은음식", description: "포켓몬의 HP가 매 턴 최대 체력의 1/16씩 회복" },
    "SHELL_BELL": { name: "조개껍질방울", description: "포켓몬이 준 데미지의 1/8씩 회복" },

    "TOXIC_ORB": { name: "맹독구슬", description: "이 도구를 지닌 포켓몬은 턴이 끝나는 시점에 상태이상에 걸리지 않았다면 맹독 상태가 된다." },
    "FLAME_ORB": { name: "화염구슬", description: "이 도구를 지닌 포켓몬은 턴이 끝나는 시점에 상태이상에 걸리지 않았다면 화상 상태가 된다." },

    "BATON": { name: "바톤", description: "포켓몬을 교체할 때 효과를 넘겨줄 수 있으며, 함정의 영향을 받지 않게 함" },

    "SHINY_CHARM": { name: "빛나는부적", description: "야생 포켓몬이 색이 다른 포켓몬으로 등장할 확률을 급격히 증가" },
    "ABILITY_CHARM": { name: "특성부적", description: "야생 포켓몬이 숨겨진 특성을 가지고 등장할 확률을 급격히 증가" },

    "IV_SCANNER": { name: "개체값탐지기", description: "야생 포켓몬의 개체값을 확인 가능하다. 높은 값이 먼저 표시되며 확인할 수 있는 개체값을 두 종류씩 추가" },

    "DNA_SPLICERS": { name: "유전자쐐기" },

    "MINI_BLACK_HOLE": { name: "미니 블랙홀" },

    "GOLDEN_POKEBALL": { name: "황금몬스터볼", description: "전투 후 획득하는 아이템의 선택지를 하나 더 추가" },

    "ENEMY_DAMAGE_BOOSTER": { name: "데미지 토큰", description: "주는 데미지를 5% 증가" },
    "ENEMY_DAMAGE_REDUCTION": { name: "보호 토큰", description: "받는 데미지를 2.5% 감소" },
    "ENEMY_HEAL": { name: "회복 토큰", description: "매 턴 최대 체력의 2%를 회복" },
    "ENEMY_ATTACK_POISON_CHANCE": { name: "독 토큰" },
    "ENEMY_ATTACK_PARALYZE_CHANCE": { name: "마비 토큰" },
    "ENEMY_ATTACK_BURN_CHANCE": { name: "화상 토큰" },
    "ENEMY_STATUS_EFFECT_HEAL_CHANCE": { name: "만병통치 토큰", description: "매 턴 상태이상에서 회복될 확률 2.5% 추가" },
    "ENEMY_ENDURE_CHANCE": { name: "버티기 토큰" },
    "ENEMY_FUSED_CHANCE": { name: "합체 토큰", description: "야생 포켓몬이 합체할 확률 1% 추가" },
  },
  TempBattleStatBoosterItem: {
    "x_attack": "플러스파워",
    "x_defense": "디펜드업",
    "x_sp_atk": "스페셜업",
    "x_sp_def": "스페셜가드",
    "x_speed": "스피드업",
    "x_accuracy": "잘-맞히기",
    "dire_hit": "크리티컬커터",
  },
  AttackTypeBoosterItem: {
    "silk_scarf": "실크스카프",
    "black_belt": "검은띠",
    "sharp_beak": "예리한부리",
    "poison_barb": "독바늘",
    "soft_sand": "부드러운모래",
    "hard_stone": "딱딱한돌",
    "silver_powder": "은빛가루",
    "spell_tag": "저주의부적",
    "metal_coat": "금속코트",
    "charcoal": "목탄",
    "mystic_water": "신비의물방울",
    "miracle_seed": "기적의씨",
    "magnet": "자석",
    "twisted_spoon": "휘어진스푼",
    "never_melt_ice": "녹지않는얼음",
    "dragon_fang": "용의이빨",
    "black_glasses": "검은안경",
    "fairy_feather": "요정의깃털",
  },
  BaseStatBoosterItem: {
    "hp_up": "맥스업",
    "protein": "타우린",
    "iron": "사포닌",
    "calcium": "리보플라빈",
    "zinc": "키토산",
    "carbos": "알칼로이드",
  },
  EvolutionItem: {
    "NONE": "None",

    "LINKING_CORD": "연결의끈",
    "SUN_STONE": "태양의돌",
    "MOON_STONE": "달의돌",
    "LEAF_STONE": "리프의돌",
    "FIRE_STONE": "불꽃의돌",
    "WATER_STONE": "물의돌",
    "THUNDER_STONE": "천둥의돌",
    "ICE_STONE": "얼음의돌",
    "DUSK_STONE": "어둠의돌",
    "DAWN_STONE": "각성의돌",
    "SHINY_STONE": "빛의돌",
    "CRACKED_POT": "깨진포트",
    "SWEET_APPLE": "달콤한사과",
    "TART_APPLE": "새콤한사과",
    "STRAWBERRY_SWEET": "딸기사탕공예",
    "UNREMARKABLE_TEACUP": "범작찻잔",

    "CHIPPED_POT": "이빠진포트",
    "BLACK_AUGURITE": "검은휘석",
    "GALARICA_CUFF": "가라두구팔찌",
    "GALARICA_WREATH": "가라두구머리장식",
    "PEAT_BLOCK": "피트블록",
    "AUSPICIOUS_ARMOR": "축복받은갑옷",
    "MALICIOUS_ARMOR": "저주받은갑옷",
    "MASTERPIECE_TEACUP": "걸작찻잔",
    "METAL_ALLOY": "복합금속",
    "SCROLL_OF_DARKNESS": "악의 족자",
    "SCROLL_OF_WATERS": "물의 족자",
    "SYRUPY_APPLE": "꿀맛사과",
  },
  FormChangeItem: {
    "NONE": "None",

    "ABOMASITE": "눈설왕나이트",
    "ABSOLITE": "앱솔나이트",
    "AERODACTYLITE": "프테라나이트",
    "AGGRONITE": "보스로라나이트",
    "ALAKAZITE": "후딘나이트",
    "ALTARIANITE": "파비코리나이트",
    "AMPHAROSITE": "전룡나이트",
    "AUDINITE": "다부니나이트",
    "BANETTITE": "다크펫나이트",
    "BEEDRILLITE": "독침붕나이트",
    "BLASTOISINITE": "거북왕나이트",
    "BLAZIKENITE": "번치코나이트",
    "CAMERUPTITE": "폭타나이트",
    "CHARIZARDITE_X": "리자몽나이트 X",
    "CHARIZARDITE_Y": "리자몽나이트 Y",
    "DIANCITE": "디안시나이트",
    "GALLADITE": "엘레이드나이트",
    "GARCHOMPITE": "한카리아스나이트",
    "GARDEVOIRITE": "가디안나이트",
    "GENGARITE": "팬텀나이트",
    "GLALITITE": "얼음귀신나이트",
    "GYARADOSITE": "갸라도스나이트",
    "HERACRONITE": "헤라크로스나이트",
    "HOUNDOOMINITE": "헬가나이트",
    "KANGASKHANITE": "캥카나이트",
    "LATIASITE": "라티아스나이트",
    "LATIOSITE": "라티오스나이트",
    "LOPUNNITE": "이어롭나이트",
    "LUCARIONITE": "루카리오나이트",
    "MANECTITE": "썬더볼트나이트",
    "MAWILITE": "입치트나이트",
    "MEDICHAMITE": "요가램나이트",
    "METAGROSSITE": "메타그로스나이트",
    "MEWTWONITE_X": "뮤츠나이트 X",
    "MEWTWONITE_Y": "뮤츠나이트 Y",
    "PIDGEOTITE": "피죤투나이트",
    "PINSIRITE": "쁘사이저나이트",
    "RAYQUAZITE": "레쿠쟈나이트",
    "SABLENITE": "깜까미나이트",
    "SALAMENCITE": "보만다나이트",
    "SCEPTILITE": "나무킹나이트",
    "SCIZORITE": "핫삼나이트",
    "SHARPEDONITE": "샤크니아나이트",
    "SLOWBRONITE": "야도란나이트",
    "STEELIXITE": "강철톤나이트",
    "SWAMPERTITE": "대짱이나이트",
    "TYRANITARITE": "마기라스나이트",
    "VENUSAURITE": "이상해꽃나이트",

    "BLUE_ORB": "쪽빛구슬",
    "RED_ORB": "주홍구슬",
    "SHARP_METEORITE": "뾰족한운석",
    "HARD_METEORITE": "단단한운석",
    "SMOOTH_METEORITE": "부드러운운석",
    "ADAMANT_CRYSTAL": "큰금강옥",
    "LUSTROUS_GLOBE": "큰백옥",
    "GRISEOUS_CORE": "큰백금옥",
    "REVEAL_GLASS": "비추는거울",
    "GRACIDEA": "그라시데아꽃",
    "MAX_MUSHROOMS": "다이버섯",
    "DARK_STONE": "다크스톤",
    "LIGHT_STONE": "라이트스톤",
    "PRISON_BOTTLE": "굴레의항아리",
    "N_LUNARIZER": "네크로플러스루나",
    "N_SOLARIZER": "네크로플러스솔",
    "RUSTED_SWORD": "녹슨검",
    "RUSTED_SHIELD": "녹슨방패",
    "ICY_REINS_OF_UNITY": "차가운유대의고삐",
    "SHADOW_REINS_OF_UNITY": "검은유대의고삐",
    "WELLSPRING_MASK": "우물의가면",
    "HEARTHFLAME_MASK": "화덕의가면",
    "CORNERSTONE_MASK": "주춧돌의가면",
    "SHOCK_DRIVE": "번개카세트",
    "BURN_DRIVE": "블레이즈카세트",
    "CHILL_DRIVE": "프리즈카세트",
    "DOUSE_DRIVE": "아쿠아카세트",

    "FIST_PLATE": "주먹플레이트",
    "SKY_PLATE": "푸른하늘플레이트",
    "TOXIC_PLATE": "맹독플레이트",
    "EARTH_PLATE": "대지플레이트",
    "STONE_PLATE": "암석플레이트",
    "INSECT_PLATE": "비단벌레플레이트",
    "SPOOKY_PLATE": "원령플레이트",
    "IRON_PLATE": "강철플레이트",
    "FLAME_PLATE": "불구슬플레이트",
    "SPLASH_PLATE": "물방울플레이트",
    "MEADOW_PLATE": "초록플레이트",
    "ZAP_PLATE": "우뢰플레이트",
    "MIND_PLATE": "이상한플레이트",
    "ICICLE_PLATE": "고드름플레이트",
    "DRACO_PLATE": "용의플레이트",
    "DREAD_PLATE": "공포플레이트",
    "PIXIE_PLATE": "정령플레이트",
    "BLANK_PLATE": "순백플레이트",
    "LEGEND_PLATE": "레전드플레이트",
    "FIGHTING_MEMORY": "파이팅메모리",
    "FLYING_MEMORY": "플라잉메모리",
    "POISON_MEMORY": "포이즌메모리",
    "GROUND_MEMORY": "그라운드메모리",
    "ROCK_MEMORY": "록메모리",
    "BUG_MEMORY": "버그메모리",
    "GHOST_MEMORY": "고스트메모리",
    "STEEL_MEMORY": "스틸메모리",
    "FIRE_MEMORY": "파이어메모리",
    "WATER_MEMORY": "워터메모리",
    "GRASS_MEMORY": "그래스메모리",
    "ELECTRIC_MEMORY": "일렉트릭메모리",
    "PSYCHIC_MEMORY": "사이킥메모리",
    "ICE_MEMORY": "아이스메모리",
    "DRAGON_MEMORY": "드래곤메모리",
    "DARK_MEMORY": "다크메모리",
    "FAIRY_MEMORY": "페어리메모리",
  },
} as const;
