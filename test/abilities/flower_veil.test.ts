import { BattlerIndex } from "#app/battle";
import { modifierTypes } from "#app/modifier/modifier-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Flower Veil", () => {
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
      .moveset([ Moves.SPLASH ])
      .enemySpecies(Species.BULBASAUR)
      .ability(Abilities.FLOWER_VEIL)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should not prevent any source of self-inflicted status conditions", async () => {
    game.override.enemyMoveset([ Moves.TACKLE, Moves.SPLASH ])
      .ability(Abilities.FLOWER_VEIL)
      .moveset([ Moves.REST, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const user = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.REST);
    await game.forceEnemyMove(Moves.TACKLE);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();
    expect(user.status?.effect).toBe(StatusEffect.SLEEP);

    game.scene.addModifier(modifierTypes.FLAME_ORB().newModifier(user));
    game.scene.updateModifiers(true);
    // remove sleep status
    user.resetStatus();
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    expect(user.status?.effect).toBe(StatusEffect.BURN);

    game.scene.addModifier(modifierTypes.TOXIC_ORB().newModifier(user));
    game.scene.updateModifiers(true);
    user.resetStatus();

  });

  it("should prevent the drops while retaining the boosts from spicy extract", async () => {
    game.override.enemyMoveset([ Moves.SPICY_EXTRACT ])
      .moveset([ Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const user = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.ATK)).toBe(2);
    expect(user.getStatStage(Stat.DEF)).toBe(0);
  });

  it("should not prevent self-inflicted stat drops from moves like Close Combat", async () => {
    game.override.moveset([ Moves.CLOSE_COMBAT ]);
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const enemy = game.scene.getEnemyPokemon()!;
    game.move.select(Moves.CLOSE_COMBAT);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-1);
  });
});
