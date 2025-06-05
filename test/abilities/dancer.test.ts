import { BattlerIndex } from "#app/battle";
import type { MovePhase } from "#app/phases/move-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
    game.override.enemyAbility(AbilityId.DANCER).enemySpecies(SpeciesId.MAGIKARP).enemyMoveset(MoveId.VICTORY_DANCE);
    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.FEEBAS]);

    const [oricorio, feebas] = game.scene.getPlayerField();
    game.move.changeMoveset(oricorio, [MoveId.SWORDS_DANCE, MoveId.VICTORY_DANCE, MoveId.SPLASH]);
    game.move.changeMoveset(feebas, [MoveId.SWORDS_DANCE, MoveId.SPLASH]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SWORDS_DANCE, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MovePhase"); // feebas uses swords dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies swords dance

    let currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(MoveId.SWORDS_DANCE);

    await game.phaseInterceptor.to("MoveEndPhase"); // end oricorio's move
    await game.phaseInterceptor.to("MovePhase"); // magikarp 1 copies swords dance
    await game.phaseInterceptor.to("MovePhase"); // magikarp 2 copies swords dance
    await game.phaseInterceptor.to("MovePhase"); // magikarp (left) uses victory dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies magikarp's victory dance

    currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(MoveId.VICTORY_DANCE);

    await game.phaseInterceptor.to("BerryPhase"); // finish the turn

    // doesn't use PP if copied move is also in moveset
    expect(oricorio.moveset[0]?.ppUsed).toBe(0);
    expect(oricorio.moveset[1]?.ppUsed).toBe(0);
  });

  // TODO: Enable after Dancer rework to not push to move history
  it.todo("should not count as the last move used for mirror move/instruct", async () => {
    game.override
      .moveset([MoveId.FIERY_DANCE, MoveId.REVELATION_DANCE])
      .enemyMoveset([MoveId.INSTRUCT, MoveId.MIRROR_MOVE, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyLevel(10);
    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.FEEBAS]);

    const [oricorio] = game.scene.getPlayerField();
    const [, shuckle2] = game.scene.getEnemyField();

    game.move.select(MoveId.REVELATION_DANCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.move.selectEnemyMove(MoveId.INSTRUCT, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.MIRROR_MOVE, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MovePhase"); // Oricorio rev dance
    await game.phaseInterceptor.to("MovePhase"); // Feebas fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio fiery dance (from dancer)
    await game.phaseInterceptor.to("MoveEndPhase", false);
    // dancer copied move doesn't appear in move history
    expect(oricorio.getLastXMoves(-1)[0].move).toBe(MoveId.REVELATION_DANCE);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 mirror moves oricorio
    await game.phaseInterceptor.to("MovePhase"); // calls instructed rev dance
    let currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(shuckle2);
    expect(currentPhase.move.moveId).toBe(MoveId.REVELATION_DANCE);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 1 instructs oricorio
    await game.phaseInterceptor.to("MovePhase");
    currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(MoveId.REVELATION_DANCE);
  });
});
