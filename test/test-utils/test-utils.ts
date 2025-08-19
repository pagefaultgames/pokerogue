import { Pokemon } from "#field/pokemon";
import type { GameManager } from "#test/test-utils/game-manager";
import i18next, { type ParseKeys } from "i18next";
import { vi } from "vitest";

/**
 * Sets up the i18next mock.
 * Includes a i18next.t mocked implementation only returning the raw key (`(key) => key`)
 *
 * @returns A spy/mock of i18next
 */
export function mockI18next() {
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

type TypeOfResult = "undefined" | "object" | "boolean" | "number" | "bigint" | "string" | "symbol" | "function";

/**
 * Helper to determine the actual type of the received object as human readable string
 * @param received - The received object
 * @returns A human readable string of the received object (type)
 */
export function receivedStr(received: unknown, expectedType: TypeOfResult = "object"): string {
  if (received === null) {
    return "null";
  }
  if (received === undefined) {
    return "undefined";
  }
  if (typeof received !== expectedType) {
    return typeof received;
  }
  if (expectedType === "object") {
    return received.constructor.name;
  }

  return "unknown";
}

/**
 * Helper to check if the received object is an {@linkcode object}
 * @param received - The object to check
 * @returns Whether the object is an {@linkcode object}.
 */
function isObject(received: unknown): received is object {
  return received !== null && typeof received === "object";
}

/**
 * Helper function to check if a given object is a {@linkcode Pokemon}.
 * @param received - The object to check
 * @return Whether `received` is a {@linkcode Pokemon} instance.
 */
export function isPokemonInstance(received: unknown): received is Pokemon {
  return isObject(received) && received instanceof Pokemon;
}

/**
 * Checks if an object is a {@linkcode GameManager} instance
 * @param received - The object to check
 * @returns Whether the object is a {@linkcode GameManager} instance.
 */
export function isGameManagerInstance(received: unknown): received is GameManager {
  return isObject(received) && (received as GameManager).constructor.name === "GameManager";
}
