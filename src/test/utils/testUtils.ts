import i18next, { ParseKeys } from "i18next";
import { vi } from "vitest";

export function mockI18next() {
  return vi.spyOn(i18next, "t").mockImplementation((key: ParseKeys) => key);
}
