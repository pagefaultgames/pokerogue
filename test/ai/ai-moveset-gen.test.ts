import { __INTERNAL_TEST_EXPORTS, generateMoveset } from "#app/ai/ai-moveset-gen";
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
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { afterEach } from "node:test";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Parameters for {@linkcode createTestablePokemon}
 */
interface MockPokemonParams {
  /** The level to set the Pokémon to */
  level: number;
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
 * @returns The newly created `EnemyPokemon`.
 * @todo Move this to a dedicated unit test util folder if more tests come to rely on it
 */
function createTestablePokemon(
  species: SpeciesId,
  { level, trainerSlot = TrainerSlot.NONE, boss = false, formIndex = 0 }: MockPokemonParams,
): EnemyPokemon {
  const pokemon = new EnemyPokemon(allSpecies[species], level, trainerSlot, boss);
  if (formIndex !== 0) {
    const formIndexLength = getPokemonSpecies(species)?.forms.length;
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
    // Sanitize the interceptor after running the suite to ensure other tests are not affected
    afterAll(() => {
      game.phaseInterceptor.restoreOg();
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
        expect(result.has(MoveId.TACKLE)).toBe(false);
        expect(result.has(MoveId.GROWL)).toBe(true);
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

  afterAll(() => {
    game.phaseInterceptor.restoreOg();
  });
  //#endregion boilerplate

  describe("getTmPoolForSpecies", () => {
    const { getTmPoolForSpecies } = __INTERNAL_TEST_EXPORTS;

    it("should not crash when generating a moveset for Pokemon without TM moves", () => {
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

  describe("generateMoveset", () => {
    it("should spawn with 4 moves if possible", async () => {
      // Need to be in a wave for moveset generation to not actually break
      await game.classicMode.startBattle([SpeciesId.PIKACHU]);

      // Create a pokemon that can learn at least 4 moves
      pokemon = createTestablePokemon(SpeciesId.ROCKRUFF, { level: 15 });
      vi.spyOn(pokemon, "getLevelMoves").mockReturnValue([
        [1, MoveId.TACKLE],
        [4, MoveId.LEER],
        [7, MoveId.SAND_ATTACK],
        [10, MoveId.ROCK_THROW],
        [13, MoveId.DOUBLE_TEAM],
      ]);

      // Generate the moveset
      generateMoveset(pokemon);
      expect(pokemon.moveset).toHaveLength(4);
      // Unlike other test suites, phase interceptor is not automatically restored after the tests here,
      // since most tests in this suite do not need the phase
      game.phaseInterceptor.restoreOg();
    });
  });
});
