import { Egg } from "#app/data/egg";
import { EggSourceType } from "#app/enums/egg-source-types";
import { EggTier } from "#app/enums/egg-type";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Manaphy Eggs", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const EGG_HATCH_COUNT: integer = 48;
  let rngSweepProgress: number = 0;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await game.importData("src/test/utils/saves/everything.prsv");

    /**
     * In our tests, we will perform an "RNG sweep" by letting rngSweepProgress
     * increase uniformly from 0 to 1 in order to get a uniform sample of the
     * possible RNG outcomes. This will let us quickly and consistently find
     * the probability of each RNG outcome.
     */
    vi.spyOn(Phaser.Math.RND, "realInRange").mockImplementation((min: number, max: number) => {
      return rngSweepProgress * (max - min) + min;
    });
  });

  it("should have correct Manaphy rates and Rare Egg Move rates, from the egg gacha", () => {
    const scene = game.scene;

    let manaphyCount = 0;
    let phioneCount = 0;
    let rareEggMoveCount = 0;
    for (let i = 0; i < EGG_HATCH_COUNT; i++) {
      rngSweepProgress = (2 * i + 1) / (2 * EGG_HATCH_COUNT);

      const newEgg = new Egg({ scene, tier: EggTier.COMMON, sourceType: EggSourceType.GACHA_SHINY, id: 204 });
      const newHatch = newEgg.generatePlayerPokemon(scene);
      if (newHatch.species.speciesId === Species.MANAPHY) {
        manaphyCount++;
      } else if (newHatch.species.speciesId === Species.PHIONE) {
        phioneCount++;
      }
      if (newEgg.eggMoveIndex === 3) {
        rareEggMoveCount++;
      }
    }

    expect(manaphyCount + phioneCount).toBe(EGG_HATCH_COUNT);
    expect(manaphyCount).toBe(1 / 8 * EGG_HATCH_COUNT);
    expect(rareEggMoveCount).toBe(1 / 12 * EGG_HATCH_COUNT);
  });

  it("should have correct Manaphy rates and Rare Egg Move rates, from Phione species eggs", () => {
    const scene = game.scene;

    let manaphyCount = 0;
    let phioneCount = 0;
    let rareEggMoveCount = 0;
    for (let i = 0; i < EGG_HATCH_COUNT; i++) {
      rngSweepProgress = (2 * i + 1) / (2 * EGG_HATCH_COUNT);

      const newEgg = new Egg({ scene, species: Species.PHIONE, sourceType: EggSourceType.SAME_SPECIES_EGG });
      const newHatch = newEgg.generatePlayerPokemon(scene);
      if (newHatch.species.speciesId === Species.MANAPHY) {
        manaphyCount++;
      } else if (newHatch.species.speciesId === Species.PHIONE) {
        phioneCount++;
      }
      if (newEgg.eggMoveIndex === 3) {
        rareEggMoveCount++;
      }
    }

    expect(manaphyCount + phioneCount).toBe(EGG_HATCH_COUNT);
    expect(manaphyCount).toBe(1 / 8 * EGG_HATCH_COUNT);
    expect(rareEggMoveCount).toBe(1 / 6 * EGG_HATCH_COUNT);
  });

  it("should have correct Manaphy rates and Rare Egg Move rates, from Manaphy species eggs", () => {
    const scene = game.scene;

    let manaphyCount = 0;
    let phioneCount = 0;
    let rareEggMoveCount = 0;
    for (let i = 0; i < EGG_HATCH_COUNT; i++) {
      rngSweepProgress = (2 * i + 1) / (2 * EGG_HATCH_COUNT);

      const newEgg = new Egg({ scene, species: Species.MANAPHY, sourceType: EggSourceType.SAME_SPECIES_EGG });
      const newHatch = newEgg.generatePlayerPokemon(scene);
      if (newHatch.species.speciesId === Species.MANAPHY) {
        manaphyCount++;
      } else if (newHatch.species.speciesId === Species.PHIONE) {
        phioneCount++;
      }
      if (newEgg.eggMoveIndex === 3) {
        rareEggMoveCount++;
      }
    }

    expect(phioneCount).toBe(0);
    expect(manaphyCount).toBe(EGG_HATCH_COUNT);
    expect(rareEggMoveCount).toBe(1 / 6 * EGG_HATCH_COUNT);
  });
});
