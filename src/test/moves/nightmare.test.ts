import { CommandPhase } from "#app/phases/command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { StatusEffect } from "#app/data/status-effect";

describe("Moves - Nightmare", () => {
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

    game.override.battleType("single")
      .enemySpecies(Species.RATTATA)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyStatusEffect(StatusEffect.SLEEP)
      .startingLevel(5)
      .moveset([ Moves.NIGHTMARE, Moves.SPLASH ]);
  });

  it("lowers enemy hp by 1/4 each turn while asleep", async () => {
    await game.classicMode.startBattle([ Species.HYPNO ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyMaxHP = enemyPokemon.hp;
    game.move.select(Moves.NIGHTMARE);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(enemyPokemon.hp).toBe(enemyMaxHP - Math.floor(enemyMaxHP / 4));

    // take a second turn to make sure damage occurs again
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to(TurnInitPhase);
    expect(enemyPokemon.hp).toBe(enemyMaxHP - Math.floor(enemyMaxHP / 4) - Math.floor(enemyMaxHP / 4));
  });
});
