import { DamagePhase } from "#app/phases/damage-phase.js";
import { toDmgValue } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Round Down and Minimun 1 test in Damage Calculation", () => {
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
    game.override.battleType("single");
    game.override.startingLevel(10);
  });

  it("When the user fails to use Jump Kick with Wonder Guard ability, the damage should be 1.", async () => {
    game.override.enemySpecies(Species.GASTLY);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.starterSpecies(Species.SHEDINJA);
    game.override.moveset([Moves.JUMP_KICK]);
    game.override.ability(Abilities.WONDER_GUARD);

    await game.startBattle();

    const shedinja = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.JUMP_KICK);

    await game.phaseInterceptor.to(DamagePhase);

    expect(shedinja.hp).toBe(shedinja.getMaxHp() - 1);
  });


  it("Charizard with odd HP survives Stealth Rock damage twice", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, Moves.STEALTH_ROCK, 0);
    game.override.seed("Charizard Stealth Rock test");
    game.override.enemySpecies(Species.CHARIZARD);
    game.override.enemyAbility(Abilities.BLAZE);
    game.override.starterSpecies(Species.PIKACHU);
    game.override.enemyLevel(100);

    await game.startBattle();

    const charizard = game.scene.getEnemyPokemon()!;

    const maxHp = charizard.getMaxHp();
    const damage_prediction = toDmgValue(charizard.getMaxHp() / 2);
    const currentHp = charizard.hp;
    const expectedHP = maxHp - damage_prediction;

    expect(currentHp).toBe(expectedHP);
  });
});
