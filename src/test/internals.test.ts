import { Abilities } from "#app/enums/abilities";
import { Species } from "#app/enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Internals", () => {
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

  it("should provide Eevee with 3 defined abilities", async () => {
    await game.classicMode.runToSummon([Species.EEVEE]);
    const eevee = game.scene.getPlayerPokemon()!;

    expect(eevee.getSpeciesForm().getAbilityCount()).toBe(3);

    expect(eevee.getSpeciesForm().getAbility(0)).toBe(Abilities.RUN_AWAY);
    expect(eevee.getSpeciesForm().getAbility(1)).toBe(Abilities.ADAPTABILITY);
    expect(eevee.getSpeciesForm().getAbility(2)).toBe(Abilities.ANTICIPATION);
  });

  it("should set Eeeve abilityIndex between 0-2", async () => {
    await game.classicMode.runToSummon([Species.EEVEE]);
    const eevee = game.scene.getPlayerPokemon()!;

    expect(eevee.abilityIndex).toBeGreaterThanOrEqual(0);
    expect(eevee.abilityIndex).toBeLessThanOrEqual(2);
  });
});
