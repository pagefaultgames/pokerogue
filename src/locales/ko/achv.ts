import { AchievementTranslationEntries } from "#app/plugins/i18n.js";

export const achv: AchievementTranslationEntries = {
  "Achievements": {
    name: "업적",
  },
  "Locked": {
    name: "미완료",
  },

  "MoneyAchv": {
    description: "누적 소지금 ₽{{moneyAmount}} 달성",
  },
  "10K_MONEY": {
    name: "돈 좀 있나?",
  },
  "100K_MONEY": {
    name: "부자",
  },
  "1M_MONEY": {
    name: "백만장자",
  },
  "10M_MONEY": {
    name: "상위 1프로",
  },

  "DamageAchv": {
    description: "한 번의 공격만으로 {{damageAmount}} 대미지",
  },
  "250_DMG": {
    name: "강타자",
  },
  "1000_DMG": {
    name: "최강타자",
  },
  "2500_DMG": {
    name: "때릴 줄 아시는군요!",
  },
  "10000_DMG": {
    name: "원펀맨",
  },

  "HealAchv": {
    description: "기술이나 특성, 지닌 도구로 한 번에 {{healAmount}} {{HP}} 회복",
  },
  "250_HEAL": {
    name: "견습 힐러",
  },
  "1000_HEAL": {
    name: "상급 힐러",
  },
  "2500_HEAL": {
    name: "클레릭",
  },
  "10000_HEAL": {
    name: "회복 마스터",
  },

  "LevelAchv": {
    description: "포켓몬 Lv{{level}} 달성",
  },
  "LV_100": {
    name: "잠깐, 여기가 끝이 아니라구!",
  },
  "LV_250": {
    name: "엘리트",
  },
  "LV_1000": {
    name: "더 먼 곳을 향해",
  },

  "RibbonAchv": {
    description: "총 {{ribbonAmount}}개의 리본 획득",
  },
  "10_RIBBONS": {
    name: "포켓몬 리그 챔피언",
  },
  "25_RIBBONS": {
    name: "슈퍼 리그 챔피언",
  },
  "50_RIBBONS": {
    name: "하이퍼 리그 챔피언",
  },
  "75_RIBBONS": {
    name: "로그 리그 챔피언",
  },
  "100_RIBBONS": {
    name: "마스터 리그 챔피언",
  },

  "TRANSFER_MAX_BATTLE_STAT": {
    name: "팀워크",
    description: "한 개 이상의 능력치가 최대 랭크일 때 배턴터치 사용",
  },
  "MAX_FRIENDSHIP": {
    name: "친밀 맥스",
    description: "최대 친밀도 달성",
  },
  "MEGA_EVOLVE": {
    name: "메가변환",
    description: "포켓몬을 메가진화",
  },
  "GIGANTAMAX": {
    name: "엄청난 것",
    description: "포켓몬을 다이맥스",
  },
  "TERASTALLIZE": {
    name: "반짝반짝",
    description: "포켓몬을 테라스탈",
  },
  "STELLAR_TERASTALLIZE": {
    name: "숨겨진 타입",
    description: "포켓몬을 스텔라 테라스탈",
  },
  "SPLICE": {
    name: "끝없는 융합",
    description: "유전자쐐기로 두 포켓몬을 융합",
  },
  "MINI_BLACK_HOLE": {
    name: "도구가 가득한 구멍",
    description: "미니 블랙홀 획득",
  },
  "CATCH_MYTHICAL": {
    name: "환상",
    description: "환상의 포켓몬 포획",
  },
  "CATCH_SUB_LEGENDARY": {
    name: "(준)전설",
    description: "준전설 포켓몬 포획",
  },
  "CATCH_LEGENDARY": {
    name: "전설",
    description: "전설의 포켓몬 포획",
  },
  "SEE_SHINY": {
    name: "다른 색",
    description: "야생의 색이 다른 포켓몬 발견",
  },
  "SHINY_PARTY": {
    name: "찐사랑",
    description: "색이 다른 포켓몬만으로 파티 구성",
  },
  "HATCH_MYTHICAL": {
    name: "환상의 알",
    description: "알에서 환상의 포켓몬이 부화",
  },
  "HATCH_SUB_LEGENDARY": {
    name: "준전설 알",
    description: "알에서 준전설 포켓몬이 부화",
  },
  "HATCH_LEGENDARY": {
    name: "전설의 알",
    description: "알에서 전설의 포켓몬이 부화",
  },
  "HATCH_SHINY": {
    name: "빛나는 알",
    description: "알에서 색이 다른 포켓몬이 부화",
  },
  "HIDDEN_ABILITY": {
    name: "숨은 잠재력",
    description: "숨겨진 특성을 지닌 포켓몬을 포획",
  },
  "PERFECT_IVS": {
    name: "진짜배기 증명서",
    description: "최고의 개체값을 지닌 포켓몬 획득",
  },
  "CLASSIC_VICTORY": {
    name: "무패",
    description: "클래식 모드 클리어",
  },
} as const;
