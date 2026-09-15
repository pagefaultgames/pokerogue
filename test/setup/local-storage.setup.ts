import { mockLocalStorage } from "#test/mocks/mock-local-storage";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: mockLocalStorage(),
});
