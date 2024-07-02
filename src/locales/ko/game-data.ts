import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const gameData: SimpleTranslationEntries = {
  "systemData": "시스템",
  "sessionData": "세션",
  "settingsData": "설정",
  "tutorialsData": "튜토리얼",
  "seenDialoguesData": "본 대화",

  "dataCouldNotBeLoaded": "{{dataName}}[[를]] 불러올 수 없었습니다. 파일이 손상되었을 수 있습니다.",
  "dataWillBeOverridden": "{{dataName}} 데이터를 덮어쓰고 페이지를 새로고침 합니다. 계속하시겠습니까?",
  "errorContactServer": "서버에 접근할 수 없습니다. {{dataName}} 데이터를 불러올 수 없습니다.",
  "errorUpdating": "{{dataName}} 데이터를 업데이트하는 도중 오류가 발생했습니다. 관리자에게 문의하십시오.",
} as const;
