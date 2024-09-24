import { Species } from "#app/enums/species";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "../utils/gameManager";
import { PokeballType } from "#app/enums/pokeball";
import BattleScene from "#app/battle-scene";
import { tmSpecies } from "#app/data/tms";

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
  it("pokemon that have form changes and different tms per form should not share tms between forms", async () => {
    game.override.starterForms({ [Species.ROTOM]: 4 });
    await game.classicMode.startBattle([Species.ROTOM]);
    const playerPokemon = game.scene.getPlayerPokemon()!;

    // 59 is blizzard, fan rotom should not be in that array
    const compatible1 = tmSpecies[59].some(p => {
      if (Array.isArray(p)) {
        const [pkm, form] = p;
        return pkm === playerPokemon.species.speciesId && playerPokemon.getFormKey() === form;
      }
      return false;
    });

    // Air slash is 403, fan rotom should be in it
    const compatible2 = tmSpecies[403].some(p => {
      if (Array.isArray(p)) {
        const [pkm, form] = p;
        return pkm === playerPokemon.species.speciesId && playerPokemon.getFormKey() === form;
      }
      return false;
    });

    expect(playerPokemon.compatibleTms.includes(59)).toBeFalsy();
    expect(playerPokemon.compatibleTms.includes(403)).toBeTruthy();
    expect(compatible1).toBeFalsy();
    expect(compatible2).toBeTruthy();
  });
});
