import { SettingKeys } from "../../settings/settings";

/**
 * Migrate from "REROLL_TARGET" property to {@linkcode
 * SettingKeys.Shop_Cursor_Target}.
 * @param data the `settings` object
 */
export function fixRerollTarget(data: Object) {
  if (data.hasOwnProperty("REROLL_TARGET") && !data.hasOwnProperty(SettingKeys.Shop_Cursor_Target)) {
    data[SettingKeys.Shop_Cursor_Target] = data["REROLL_TARGET"];
    delete data["REROLL_TARGET"];
    localStorage.setItem("settings", JSON.stringify(data));
  }
}
