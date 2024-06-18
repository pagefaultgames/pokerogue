import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const menuUiHandler: SimpleTranslationEntries = {
  "GAME_SETTINGS": "游戏设置",
  "ACHIEVEMENTS": "成就",
  "STATS": "数据统计",
  "VOUCHERS": "兑换券",
  "EGG_LIST": "蛋列表",
  "EGG_GACHA": "扭蛋机",
  "MANAGE_DATA": "管理数据",
  "COMMUNITY": "社区",
  "SAVE_AND_QUIT": "保存并退出",
  "LOG_OUT": "登出",
  "slot": "存档位 {{slotNumber}}",
  "importSession": "导入存档",
  "importSlotSelect": "选择要导入到的存档位。",
  "exportSession": "导出存档",
  "exportSlotSelect": "选择要导出的存档位。",
  "importData": "导入数据",
  "exportData": "导出数据",
  "cancel": "取消",
  "losingProgressionWarning": "你将失去自战斗开始以来的所有进度。是否\n继续？"
} as const;
