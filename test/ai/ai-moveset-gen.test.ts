import { __INTERNAL_TEST_EXPORTS } from "#app/ai/ai-moveset-gen";
import {
  COMMON_TIER_TM_LEVEL_REQUIREMENT,
  GREAT_TIER_TM_LEVEL_REQUIREMENT,
  ULTRA_TIER_TM_LEVEL_REQUIREMENT,
} from "#balance/moveset-generation";
import { allMoves, allSpecies } from "#data/data-lists";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { EnemyPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder } from "#utils/common";
import { afterEach } from "node:test";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Need a function for creating a mock pokemon

interface MockPokemonParams {
  level: number;
  hasTrainer?: boolean;
  /**
   * Whether the pokemon is a boss or not.
   * @defaultValue `false`
   */
  boss?: boolean;
  /**
   * The trainer slot to assign to the pokemon, if any.
   * @defaultValue `TrainerSlot.NONE`
   */
  trainerSlot?: TrainerSlot;
  /**
   * The form index to assign to the pokemon, if any.
   * This *must* be one of the valid form indices for the species, or the test will break.
   * @defaultValue `0`
   */
  formIndex?: number;
}

/**
 * Construct an `EnemyPokemon` that can be used for testing
 * @param species - The species ID of the pokemon to create
 */
function createTestablePokemon(
  species: SpeciesId,
  { level, trainerSlot = TrainerSlot.NONE, boss = false, formIndex = 0 }: MockPokemonParams,
): EnemyPokemon {
  const pokemon = new EnemyPokemon(allSpecies[species], level, trainerSlot, boss);
  if (formIndex !== 0) {
    const formIndexLength = allSpecies[species]?.forms.length;
    const name = allSpecies[species]?.name;
    expect(formIndex, `${name} does not have a form with index ${formIndex}`).toBeLessThan(formIndexLength);
    pokemon.formIndex = formIndex;
  }

  return pokemon;
}

describe("Unit Tests - ai-moveset-gen.ts", () => {
  describe("filterPool", () => {
    const { filterPool } = __INTERNAL_TEST_EXPORTS;
    it("clones a pool when there are no predicates", () => {
      const pool = new Map<MoveId, number>([
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
      ]);

      const filtered = filterPool(pool, () => true);
      const expected = [
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
      ];
      expect(filtered).toEqual(expected);
    });

    it("does not modify the original pool", () => {
      const pool = new Map<MoveId, number>([
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
      ]);
      const original = new Map(pool);

      filterPool(pool, moveId => moveId !== MoveId.TACKLE);
      expect(pool).toEqual(original);
    });

    it("filters out moves that do not match the predicate", () => {
      const pool = new Map<MoveId, number>([
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
        [MoveId.SPLASH, 3],
      ]);
      const filtered = filterPool(pool, moveId => moveId !== MoveId.SPLASH);
      expect(filtered).toEqual([
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
      ]);
    });

    it("returns an empty array if no moves match the predicate", () => {
      const pool = new Map<MoveId, number>([
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
      ]);
      const filtered = filterPool(pool, () => false);
      expect(filtered).toEqual([]);
    });

    it("calculates totalWeight correctly when provided", () => {
      const pool = new Map<MoveId, number>([
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
        [MoveId.SPLASH, 3],
      ]);
      const totalWeight = new NumberHolder(0);
      const filtered = filterPool(pool, moveId => moveId !== MoveId.SPLASH, totalWeight);
      expect(filtered).toEqual([
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
      ]);
      expect(totalWeight.value).toBe(3);
    });

    it("Clears totalWeight when provided", () => {
      const pool = new Map<MoveId, number>([
        [MoveId.TACKLE, 1],
        [MoveId.FLAMETHROWER, 2],
      ]);
      const totalWeight = new NumberHolder(42);
      const filtered = filterPool(pool, () => false, totalWeight);
      expect(filtered).toEqual([]);
      expect(totalWeight.value).toBe(0);
    });
  });

  describe("getAllowedTmTiers", () => {
    const { getAllowedTmTiers } = __INTERNAL_TEST_EXPORTS;

    it.each([
      { tierName: "common", resIdx: 0, level: COMMON_TIER_TM_LEVEL_REQUIREMENT - 1 },
      { tierName: "great", resIdx: 1, level: GREAT_TIER_TM_LEVEL_REQUIREMENT - 1 },
      { tierName: "ultra", resIdx: 2, level: ULTRA_TIER_TM_LEVEL_REQUIREMENT - 1 },
    ])("should prevent $name TMs when below level $level", ({ level, resIdx }) => {
      expect(getAllowedTmTiers(level)[resIdx]).toBe(false);
    });

    it.each([
      { tierName: "common", resIdx: 0, level: COMMON_TIER_TM_LEVEL_REQUIREMENT },
      { tierName: "great", resIdx: 1, level: GREAT_TIER_TM_LEVEL_REQUIREMENT },
      { tierName: "ultra", resIdx: 2, level: ULTRA_TIER_TM_LEVEL_REQUIREMENT },
    ])("should allow $name TMs when at level $level", ({ level, resIdx }) => {
      expect(getAllowedTmTiers(level)[resIdx]).toBe(true);
    });
  });

  // Unit tests for methods that require a game context
  describe("", () => {
    //#region boilerplate
    let phaserGame: Phaser.Game;
    // biome-ignore lint/correctness/noUnusedVariables: May be used by tests later
    let game: GameManager;
    /**A pokemon object that will be cleaned up after every test */
    let pokemon: EnemyPokemon | null = null;

    beforeAll(async () => {
      phaserGame = new Phaser.Game({
        type: Phaser.HEADLESS,
      });
      // Game manager can be reused between tests as we are not really modifying the global state
      // So there is no need to put this in a beforeEach with cleanup in afterEach.
      game = new GameManager(phaserGame);
    });

    afterEach(() => {
      pokemon?.destroy();
    });
    //#endregion boilerplate

    function createCharmander(_ = pokemon): asserts _ is EnemyPokemon {
      pokemon?.destroy();
      pokemon = createTestablePokemon(SpeciesId.CHARMANDER, { level: 10 });
      expect(pokemon).toBeInstanceOf(EnemyPokemon);
    }
    describe("getAndWeightLevelMoves", () => {
      const { getAndWeightLevelMoves } = __INTERNAL_TEST_EXPORTS;

      it("returns an empty map if getLevelMoves throws", async () => {
        createCharmander(pokemon);
        vi.spyOn(pokemon, "getLevelMoves").mockImplementation(() => {
          throw new Error("fail");
        });
        // Suppress the warning from the test output
        const warnMock = vi.spyOn(console, "warn").mockImplementationOnce(() => {});

        const result = getAndWeightLevelMoves(pokemon);
        expect(warnMock).toHaveBeenCalled();
        expect(result.size).toBe(0);
      });

      it("skips unimplemented moves", () => {
        createCharmander(pokemon);
        vi.spyOn(pokemon, "getLevelMoves").mockReturnValue([
          [1, MoveId.TACKLE],
          [5, MoveId.GROWL],
        ]);
        vi.spyOn(allMoves[MoveId.TACKLE], "name", "get").mockReturnValue("Tackle (N)");
        const result = getAndWeightLevelMoves(pokemon);
        expect(result).toContain(MoveId.GROWL);
      });

      it("skips moves already in the pool", () => {
        createCharmander(pokemon);
        vi.spyOn(pokemon, "getLevelMoves").mockReturnValue([
          [1, MoveId.TACKLE],
          [5, MoveId.TACKLE],
        ]);

        const result = getAndWeightLevelMoves(pokemon);
        expect(result.get(MoveId.TACKLE)).toBe(21);
      });

      it("weights moves based on level", () => {
        createCharmander(pokemon);
        vi.spyOn(pokemon, "getLevelMoves").mockReturnValue([
          [1, MoveId.TACKLE],
          [5, MoveId.GROWL],
          [9, MoveId.EMBER],
        ]);

        const result = getAndWeightLevelMoves(pokemon);
        expect(result.get(MoveId.TACKLE)).toBe(21);
        expect(result.get(MoveId.GROWL)).toBe(25);
        expect(result.get(MoveId.EMBER)).toBe(29);
      });
    });
  });
});

describe("Regression Tests - ai-moveset-gen.ts", () => {
  //#region boilerplate
  let phaserGame: Phaser.Game;
  // biome-ignore lint/correctness/noUnusedVariables: May be used by tests later
  let game: GameManager;
  /**A pokemon object that will be cleaned up after every test */
  let pokemon: EnemyPokemon | null = null;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    // Game manager can be reused between tests as we are not really modifying the global state
    // So there is no need to put this in a beforeEach with cleanup in afterEach.
    game = new GameManager(phaserGame);
  });

  afterEach(() => {
    pokemon?.destroy();
  });
  //#endregion boilerplate

  describe("getTmPoolForSpecies", () => {
    const { getTmPoolForSpecies } = __INTERNAL_TEST_EXPORTS;

    it("should not crash when generating a moveset for Ditto", () => {
      pokemon = createTestablePokemon(SpeciesId.DITTO, { level: 50 });
      expect(() =>
        getTmPoolForSpecies(SpeciesId.DITTO, ULTRA_TIER_TM_LEVEL_REQUIREMENT, "", new Map(), new Map(), new Map(), [
          true,
          true,
          true,
        ]),
      ).not.toThrow();
    });
  });
});
