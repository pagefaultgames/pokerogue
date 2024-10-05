import { SubstituteTag } from "#app/data/battler-tags";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("Moves - Shed Tail", () => {
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
    game.override
      .moveset([ Moves.SHED_TAIL ])
      .battleType("single")
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("transfers a Substitute doll to the switched in Pokemon", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP, Species.FEEBAS ]);

    const magikarp = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SHED_TAIL);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    const feebas = game.scene.getPlayerPokemon()!;
    const substituteTag = feebas.getTag(SubstituteTag);

    expect(feebas).not.toBe(magikarp);
    expect(feebas.hp).toBe(feebas.getMaxHp());
    // Note: Shed Tail's HP cost is currently not accurate to mainline, as it
    // should cost ceil(maxHP / 2) instead of max(floor(maxHp / 2), 1). The current
    // implementation is consistent with Substitute's HP cost logic, but that's not
    // the case in mainline for some reason :regiDespair:.
    expect(magikarp.hp).toBe(Math.ceil(magikarp.getMaxHp() / 2));
    expect(substituteTag).toBeDefined();
    expect(substituteTag?.hp).toBe(Math.floor(magikarp.getMaxHp() / 4));
  });
});
