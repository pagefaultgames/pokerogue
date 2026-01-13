import { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import i18next, { type ParseKeys } from "i18next";
import { type MockInstance, vi } from "vitest";

/**
 * Mock i18next's {@linkcode t} function to only produce the raw key.
 *
 * @returns A {@linkcode MockInstance} for `i18next.t`
 */
export function mockI18next(): MockInstance<(typeof i18next)["t"]> {
  return vi.spyOn(i18next, "t").mockImplementation((key: ParseKeys) => key);
}

/**
 * Creates an array of range `start - end`
 *
 * @param start start number e.g. 1
 * @param end end number e.g. 10
 * @returns an array of numbers
 */
export function arrayOfRange(start: number, end: number) {
  return Array.from({ length: end - start }, (_v, k) => k + start);
}

/**
 * Utility to get the API base URL from the environment variable (or the default/fallback).
 * @returns the API base URL
 */
export function getApiBaseUrl() {
  return import.meta.env.VITE_SERVER_URL ?? "http://localhost:8001";
}

// #region Matcher utilities

/**
 * Helper to determine the actual type of the received object as human readable string
 * @param received - The received object
 * @returns A human readable string of the received object (type)
 */
export function receivedStr(received: unknown): string {
  if (received === null) {
    return "null";
  }

  switch (typeof received) {
    case "undefined":
      return "undefined";
    case "object":
      // Null-prototype objects have no constructors
      return received.constructor?.name ?? "a null-prototype object";
    case "function":
      return `function ${received.name}`;
    case "boolean":
    case "number":
    case "string":
    case "symbol":
    case "bigint":
    default:
      return received.toString();
  }
}

/**
 * Helper function to check if the received object or primitive is a non-`null` object.
 * @param received - The object or primitive to check
 * @returns Whether `received` is an instance of {@linkcode Object}.
 */
function isObject(received: unknown): received is object {
  return received !== null && typeof received === "object";
}

/**
 * Helper function to check if a given object is a {@linkcode Pokemon}.
 * @param received - The object or primitive to check
 * @returns Whether `received` is an instance of {@linkcode Pokemon}.
 */
export function isPokemonInstance(received: unknown): received is Pokemon {
  return isObject(received) && received instanceof Pokemon;
}

/**
 * Helper function to check if a given object is a {@linkcode GameManager}.
 * @param received - The object or primitive to check
 * @returns Whether `received` is an instance of {@linkcode GameManager}.
 */
export function isGameManagerInstance(received: unknown): received is GameManager {
  return isObject(received) && received instanceof GameManager;
}

// #endregion Matcher utilities
