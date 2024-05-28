import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const menuUiHandler: SimpleTranslationEntries = {
  "GAME_SETTINGS": "게임 설정",
  "ACHIEVEMENTS": "업적",
  "STATS": "통계",
  "VOUCHERS": "바우처",
  "EGG_LIST": "알 목록",
  "EGG_GACHA": "알 뽑기",
  "MANAGE_DATA": "데이터 관리",
  "COMMUNITY": "커뮤니티",
  "SAVE_AND_QUIT": "저장 후 나가기",
  "LOG_OUT": "로그아웃",
  "slot": "슬롯 {{slotNumber}}",
  "importSession": "세션 불러오기",
  "importSlotSelect": "불러올 슬롯을 골라주세요.",
  "exportSession": "세션 내보내기",
  "exportSlotSelect": "내보낼 슬롯을 골라주세요.",
  "importData": "데이터 불러오기",
  "exportData": "데이터 내보내기",
  "cancel": "취소",
  "losingProgressionWarning": "전투 시작으로부터의 진행 상황을 잃게 됩니다. 계속하시겠습니까?"
} as const;
