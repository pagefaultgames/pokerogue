import i18next, { ParseKeys } from "i18next";
import { vi } from "vitest";

export function mockI18next() {
  return vi.spyOn(i18next, "t").mockImplementation((key: ParseKeys) => key);
}

export function arrayOfRange(start: integer, end: integer) {
  return Array.from({ length: end - start }, (_v, k) => k + start);
}
