import { BattlerIndex } from "#app/battle";
import type { MovePhase } from "#app/phases/move-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Dancer", () => {
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
    game.override.battleStyle("double");
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability)

  it("triggers when dance moves are used, doesn't consume extra PP", async () => {
    game.override.enemyAbility(Abilities.DANCER).enemySpecies(Species.MAGIKARP).enemyMoveset(Moves.VICTORY_DANCE);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio, feebas] = game.scene.getPlayerField();
    game.move.changeMoveset(oricorio, [Moves.SWORDS_DANCE, Moves.VICTORY_DANCE, Moves.SPLASH]);
    game.move.changeMoveset(feebas, [Moves.SWORDS_DANCE, Moves.SPLASH]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SWORDS_DANCE, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MovePhase"); // feebas uses swords dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies swords dance

    let currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(Moves.SWORDS_DANCE);

    await game.phaseInterceptor.to("MoveEndPhase"); // end oricorio's move
    await game.phaseInterceptor.to("MovePhase"); // magikarp 1 copies swords dance
    await game.phaseInterceptor.to("MovePhase"); // magikarp 2 copies swords dance
    await game.phaseInterceptor.to("MovePhase"); // magikarp (left) uses victory dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies magikarp's victory dance

    currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(Moves.VICTORY_DANCE);

    await game.phaseInterceptor.to("BerryPhase"); // finish the turn

    // doesn't use PP if copied move is also in moveset
    expect(oricorio.moveset[0]?.ppUsed).toBe(0);
    expect(oricorio.moveset[1]?.ppUsed).toBe(0);
  });

  // TODO: Enable after Dancer rework to not push to move history
  it.todo("should not count as the last move used for mirror move/instruct", async () => {
    game.override
      .moveset([Moves.FIERY_DANCE, Moves.REVELATION_DANCE])
      .enemyMoveset([Moves.INSTRUCT, Moves.MIRROR_MOVE, Moves.SPLASH])
      .enemySpecies(Species.SHUCKLE)
      .enemyLevel(10);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio] = game.scene.getPlayerField();
    const [, shuckle2] = game.scene.getEnemyField();

    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.INSTRUCT, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.MIRROR_MOVE, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MovePhase"); // Oricorio rev dance
    await game.phaseInterceptor.to("MovePhase"); // Feebas fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio fiery dance (from dancer)
    await game.phaseInterceptor.to("MoveEndPhase", false);
    // dancer copied move doesn't appear in move history
    expect(oricorio.getLastXMoves(-1)[0].move).toBe(Moves.REVELATION_DANCE);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 mirror moves oricorio
    await game.phaseInterceptor.to("MovePhase"); // calls instructed rev dance
    let currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(shuckle2);
    expect(currentPhase.move.moveId).toBe(Moves.REVELATION_DANCE);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 1 instructs oricorio
    await game.phaseInterceptor.to("MovePhase");
    currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(Moves.REVELATION_DANCE);
  });
});
