/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const customDailyRunSchema = {
  title: "Custom daily seeds schema",
  description: "A schema for validating custom daily seeds.",
  type: "object",
  properties: {
    starters: {
      type: "array",
      items: {
        type: "object",
        description: "An array of three starter Pokémon.",
        properties: {
          speciesId: { $ref: "#/$defs/speciesId" },
          formIndex: { $ref: "#/$defs/formIndex" },
          variant: { $ref: "#/$defs/variant" },
          moveset: { $ref: "#/$defs/moveset" },
          nature: { $ref: "#/$defs/nature" },
          abilityIndex: { $ref: "#/$defs/abilityIndex" },
        },
        required: ["speciesId"],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 3,
    },
    boss: {
      type: "object",
      description: "A boss Pokémon configuration.",
      properties: {
        speciesId: { $ref: "#/$defs/speciesId" },
        formIndex: { $ref: "#/$defs/formIndex" },
        variant: { $ref: "#/$defs/variant" },
        moveset: { $ref: "#/$defs/moveset" },
        nature: { $ref: "#/$defs/nature" },
        ability: { $ref: "#/$defs/ability" },
        passive: { $ref: "#/$defs/passive" },
      },
      required: ["speciesId"],
      additionalProperties: false,
    },
    biome: { type: "integer", exclusiveMinimum: 0 },
    luck: { type: "number", minimum: 0, maximum: 14 },
    startingMoney: { type: "integer", minimum: 0 },
    seedVariation: {
      type: "string",
    },
    additionalProperties: false,
  },
  $defs: {
    speciesId: { type: "integer", exclusiveMinimum: 0 },
    formIndex: { type: "integer", minimum: 0 },
    variant: { type: "integer", minimum: 0, maximum: 2 },
    nature: { type: "integer", minimum: 0, maximum: 25 },
    ability: { type: "integer", exclusiveMinimum: 0 },
    passive: { type: "integer", exclusiveMinimum: 0 },
    abilityIndex: { type: "integer", minimum: 0, maximum: 2 },
    moveset: {
      type: "array",
      items: {
        type: "integer",
      },
      minItems: 1,
      maxItems: 4,
    },
  },
  additionalProperties: false,
  required: [],
};
