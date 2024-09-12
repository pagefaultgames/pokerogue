import { Species } from "#app/enums/species";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "../utils/gameManager";
import { PokeballType } from "#app/enums/pokeball";
import BattleScene from "#app/battle-scene";

describe("Spec - Pokemon", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  it("should not crash when trying to set status of undefined", async () => {
    await game.classicMode.runToSummon([Species.ABRA]);

    const pkm = game.scene.getPlayerPokemon()!;
    expect(pkm).toBeDefined();

    expect(pkm.trySetStatus(undefined)).toBe(true);
  });

  describe("Add To Party", () => {
    let scene: BattleScene;

    beforeEach(async () => {
      game.override.enemySpecies(Species.ZUBAT);
      await game.classicMode.runToSummon([Species.ABRA, Species.ABRA, Species.ABRA, Species.ABRA, Species.ABRA]); // 5 Abra, only 1 slot left
      scene = game.scene;
    });

    it("should append a new pokemon by default", async () => {
      const zubat = scene.getEnemyPokemon()!;
      zubat.addToParty(PokeballType.LUXURY_BALL);

      const party = scene.getParty();
      expect(party).toHaveLength(6);
      party.forEach((pkm, index) =>{
        expect(pkm.species.speciesId).toBe(index === 5 ? Species.ZUBAT : Species.ABRA);
      });
    });

    it("should put a new pokemon into the passed slotIndex", async () => {
      const slotIndex = 1;
      const zubat = scene.getEnemyPokemon()!;
      zubat.addToParty(PokeballType.LUXURY_BALL, slotIndex);

      const party = scene.getParty();
      expect(party).toHaveLength(6);
      party.forEach((pkm, index) =>{
        expect(pkm.species.speciesId).toBe(index === slotIndex ? Species.ZUBAT : Species.ABRA);
      });
    });
  });
});
