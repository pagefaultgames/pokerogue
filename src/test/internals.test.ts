import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#app/enums/species.js";
import { Abilities } from "#app/enums/abilities.js";

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

  it("PokemonSpeciesForm - .getAbilityCount() and .getAbility()", async () => {
    await game.runToSummon([Species.EEVEE]);
    const eevee = game.scene.getPlayerPokemon();

    expect(eevee.getSpeciesForm().getAbilityCount()).toBe(3);

    expect(eevee.getSpeciesForm().getAbility(0)).toBe(Abilities.RUN_AWAY);
    expect(eevee.getSpeciesForm().getAbility(1)).toBe(Abilities.ADAPTABILITY);
    expect(eevee.getSpeciesForm().getAbility(2)).toBe(Abilities.ANTICIPATION);
  });

  it("Pokemon.abilityIndex definition", async () => {
    await game.runToSummon([Species.EEVEE]);
    const eevee = game.scene.getPlayerPokemon();

    const abilityIndexInRange = ([0, 1, 2].includes(eevee.abilityIndex));
    expect(abilityIndexInRange).toBe(true);
  });
});
