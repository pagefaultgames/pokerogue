import { speciesDataRegistry } from "#app/global-species-data-registry";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { getEnumValues } from "#utils/enums";
import { describe, expect, it } from "vitest";

describe("SpeciesDataRegistry", () => {
  describe("General", () => {
    it("should have an entry for all species", () => {
      const dataSpeciesIds = Object.keys(speciesDataRegistry.data).map(id => Number.parseInt(id));
      for (const speciesId of getEnumValues(SpeciesId)) {
        expect
          .soft(dataSpeciesIds.includes(speciesId), `Missing species data for ${SpeciesId[speciesId]} (${speciesId})`)
          .toBe(true);
      }
    });
  });

  describe("Starters", () => {
    it("should NOT have starter costs for non starters", () => {
      for (const speciesData of Object.values(speciesDataRegistry.data)) {
        if (
          speciesData.species.speciesId !== speciesData.starter
          && speciesData.species.speciesId !== SpeciesId.PIKACHU
        ) {
          expect
            .soft(
              speciesData.starterCost === undefined,
              `Non starter ${SpeciesId[speciesData.species.speciesId]} (${speciesData.species.speciesId}) has a starter cost of ${speciesData.starterCost}`,
            )
            .toBe(true);
        }
      }
    });
    it("should have valid starter costs for all starters", () => {
      for (const speciesData of Object.values(speciesDataRegistry.data)) {
        if (speciesData.species.speciesId === speciesData.starter) {
          const cond =
            speciesData.starterCost !== undefined && speciesData.starterCost > 0 && speciesData.starterCost <= 10;
          expect
            .soft(
              cond,
              `Starter ${SpeciesId[speciesData.species.speciesId]} (${speciesData.species.speciesId}) has invalid starter cost of ${speciesData.starterCost}`,
            )
            .toBe(true);
        }
      }
    });

    it("should NOT have eggTiers for non starters", () => {
      for (const speciesData of Object.values(speciesDataRegistry.data)) {
        if (speciesData.species.speciesId !== speciesData.starter) {
          expect
            .soft(
              speciesData.eggTier === undefined,
              `Non starter ${SpeciesId[speciesData.species.speciesId]} (${speciesData.species.speciesId}) has eggTier: ${speciesData.eggTier}`,
            )
            .toBe(true);
        }
      }
    });

    it("should have valid eggTiers for all starters", () => {
      for (const speciesData of Object.values(speciesDataRegistry.data)) {
        if (speciesData.species.speciesId === speciesData.starter) {
          const cond = speciesData.eggTier !== undefined && speciesData.eggTier >= 0 && speciesData.eggTier <= 3;
          expect
            .soft(
              cond,
              `Starter ${SpeciesId[speciesData.species.speciesId]} (${speciesData.species.speciesId}) has invalid eggTier of ${speciesData.eggTier}`,
            )
            .toBe(true);
        }
      }
    });
  });

  describe("TMs", () => {
    it("should not have any duplicate TMs", () => {
      for (const speciesData of Object.values(speciesDataRegistry.data)) {
        const seen = new Set<number>();
        const duplicates = speciesData.tms.filter(tm => seen.has(tm) || !seen.add(tm));

        expect
          .soft(
            duplicates,
            `Duplicate TMs for species ${SpeciesId[speciesData.species.speciesId]} (${speciesData.species.speciesId}): ${duplicates.map(tm => MoveId[tm]).join(", ")}`,
          )
          .toHaveLength(0);
      }
    });

    it("Should have valid formkeys for formTms", () => {
      for (const speciesData of Object.values(speciesDataRegistry.data)) {
        if (speciesData.formTms) {
          const validFormKeys = speciesData.species.forms.map(form => form.formKey);
          for (const formKey of Object.keys(speciesData.formTms)) {
            expect
              .soft(
                validFormKeys.includes(formKey),
                `Invalid formKey "${formKey}" in formTms for species ${SpeciesId[speciesData.species.speciesId]} (${speciesData.species.speciesId})`,
              )
              .toBe(true);
          }
        }
      }
    });
  });

  describe("Level Moves", () => {
    it("should not have any duplicate level moves", () => {
      for (const speciesData of Object.values(speciesDataRegistry.data)) {
        const seen = new Set<[number, MoveId]>();
        const duplicates = speciesData.levelMoves.filter(lm => seen.has(lm) || !seen.add(lm));

        expect
          .soft(
            duplicates,
            `Duplicate level moves for species ${SpeciesId[speciesData.species.speciesId]} (${speciesData.species.speciesId}): ${duplicates.map(lm => lm[0]).join(", ")}`,
          )
          .toHaveLength(0);
      }
    });

    it("Should have valid formkeys for formLevelMoves", () => {
      for (const speciesData of Object.values(speciesDataRegistry.data)) {
        if (speciesData.formLevelMoves) {
          const validFormKeys = speciesData.species.forms.map(form => form.formKey);
          for (const formKey of Object.keys(speciesData.formLevelMoves)) {
            expect
              .soft(
                validFormKeys.includes(formKey),
                `Invalid formKey "${formKey}" in formLevelMoves for species ${SpeciesId[speciesData.species.speciesId]} (${speciesData.species.speciesId})`,
              )
              .toBe(true);
          }
        }
      }
    });
  });
});
