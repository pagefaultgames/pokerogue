import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const menuUiHandler: SimpleTranslationEntries = {
    "GAME_SETTINGS": '게임 설정',
    "ACHIEVEMENTS": "도전과제",
    "STATS": "통계",
    "VOUCHERS": "교환권",
    "EGG_LIST": "알 목록",
    "EGG_GACHA": "알 뽑기",
    "MANAGE_DATA": "데이터 관리",
    "COMMUNITY": "커뮤니티",
    "RETURN_TO_TITLE": "타이틀 화면으로",
    "LOG_OUT": "로그아웃",
    "slot": "슬롯 {{slotNumber}}",
    "importSession": "세션 불러오기",
    "importSlotSelect": "불러 올 세션을 선택하세요.",
    "exportSession": "세션 내보내기",
    "exportSlotSelect": "내보낼 세션을 선택하세요.",
    "importData": "데이터 불러오기",
    "exportData": "데이터 내보내기",
    "cancel": "취소",
    "losingProgressionWarning": "배틀이 시작된 이후의 모든 진행도를 잃어버리게 됩니다, 진행하겠습니까?"
} as const;