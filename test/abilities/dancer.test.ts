import { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import { MovePhase } from "#app/phases/move-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Dancer", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Check that the {@linkcode Pokemon} using a move in the current {@linkcode MovePhase} */
  function checkCurrentMoveUser(pokemon: Pokemon | undefined, move: Moves, targets?: BattlerIndex[]) {
    const currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase).not.toBeNull();
    expect(currentPhase).toBeInstanceOf(MovePhase);
    expect.soft(currentPhase.pokemon).toBe(pokemon);
    expect.soft(currentPhase.move.moveId).toBe(move);
    if (targets) {
      expect.soft(currentPhase.targets).toEqual(targets);
    }
  }

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
    game.override.battleStyle("double").enemySpecies(Species.SHUCKLE).enemyLevel(100);
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability)
  it("should copy dance moves in speed order without consuming extra PP", async () => {
    game.override.enemyAbility(Abilities.DANCER).enemyMoveset(Moves.VICTORY_DANCE);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio, feebas] = game.scene.getPlayerField();
    game.move.changeMoveset(oricorio, [Moves.SWORDS_DANCE, Moves.VICTORY_DANCE, Moves.SPLASH]);
    game.move.changeMoveset(feebas, [Moves.SWORDS_DANCE, Moves.SPLASH]);

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MovePhase"); // feebas uses swords dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies swords dance

    checkCurrentMoveUser(oricorio, Moves.SWORDS_DANCE, [BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 1 copies swords dance
    await game.phaseInterceptor.to("MovePhase", false); // shuckle 2 copies swords dance

    await game.phaseInterceptor.to("MovePhase"); // shuckle 1 uses victory dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies victory dance

    checkCurrentMoveUser(oricorio, Moves.VICTORY_DANCE, [BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("BerryPhase"); // finish the turn

    // doesn't use PP if copied move is also in moveset
    expect(oricorio.moveset[0]?.ppUsed).toBe(0);
    expect(oricorio.moveset[1]?.ppUsed).toBe(0);
    expect(oricorio.getStatStage(Stat.ATK)).toBe(4); // 2 from swords dance, 1x2 from victory dance
  });

  it("should target the correct slot in double battles", async () => {
    game.override.moveset([Moves.REVELATION_DANCE, Moves.SPLASH]).enemyMoveset(Moves.FIERY_DANCE);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    // oricorio uses splash, everyone else uses rev dance
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.FIERY_DANCE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.FIERY_DANCE, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MovePhase"); // oricorio splash

    await game.phaseInterceptor.to("MovePhase"); // feebas uses rev dance on shuckle #2
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies rev dance

    // Since our ally used rev dance, oricorio should target the same slot as them
    checkCurrentMoveUser(oricorio, Moves.REVELATION_DANCE, [BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 1 uses fiery dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies fiery dance

    checkCurrentMoveUser(oricorio, Moves.FIERY_DANCE, [BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 uses fiery dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies fiery dance

    checkCurrentMoveUser(oricorio, Moves.FIERY_DANCE, [BattlerIndex.ENEMY_2]);
  });

  // TODO: Fix sometime
  it.todo("should not trigger on failed/ineffective moves", async () => {
    game.override
      .battleStyle("single")
      .moveset([Moves.SPLASH, Moves.PROTECT])
      .enemySpecies(Species.GROUDON)
      .enemyMoveset([Moves.FEATHER_DANCE, Moves.REVELATION_DANCE]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    const groudon = game.scene.getEnemyPokemon()!;
    expect(oricorio).toBeDefined();
    expect(groudon).toBeDefined();

    // minimize attack and use feather dance
    oricorio.setStatStage(Stat.ATK, -6);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.FEATHER_DANCE);
    await game.toNextTurn();

    // wasn't copied due to failing at -6
    expect(oricorio.getStatStage(Stat.ATK)).toBe(-6);
    expect(groudon.getStatStage(Stat.ATK)).toBe(0);

    // reset attack, but block with protect this time
    oricorio.setStatStage(Stat.ATK, 0);
    game.move.select(Moves.PROTECT);
    await game.forceEnemyMove(Moves.FEATHER_DANCE);
    await game.toNextTurn();

    // wasn't copied due to being blocked
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);
    expect(groudon.getStatStage(Stat.ATK)).toBe(0);

    // Enemy uses ground-type rev dance immune
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.REVELATION_DANCE);
    await game.toNextTurn();

    // wasn't copied due to being ineffective
    expect(oricorio.hp).toBe(oricorio.getMaxHp());
    expect(groudon.hp).toBe(groudon.getMaxHp());
  });

  // TODO: Enable once confusion override from Cud Chew PR gets merged
  it.todo("should trigger confusion self-damage, even if protected", async () => {
    game.override
      .battleStyle("single")
      .moveset([Moves.PROTECT, Moves.SPLASH])
      .enemyMoveset([Moves.TEETER_DANCE, Moves.SWORDS_DANCE]);
    /* .confusionActivation(false); // disable confusion unless forced by mocks*/
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    // get confused
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.TEETER_DANCE);
    await game.toNextTurn();

    // Protect, then copy swords dance
    game.move.select(Moves.PROTECT);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.toNextTurn();

    await game.phaseInterceptor.to("MovePhase"); // protect
    await game.phaseInterceptor.to("MovePhase"); // Swords dance
    // await game.move.forceConfusionActivation(true); // force confusion proc during swords dance copy
    await game.phaseInterceptor.to("TurnEndPhase");

    // took damage from confusion instead of using move;
    // enemy remains confused
    expect(oricorio.hp).toBeLessThan(oricorio.getMaxHp());
    expect(oricorio.getTag(BattlerTagType.CONFUSED)).toBeDefined();
    expect(game.scene.getEnemyPokemon()?.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
  });

  // TODO: Enable once interaction is confirmed
  it.todo("should not count as last move used for mirror move", async () => {
    game.override.moveset([Moves.FIERY_DANCE, Moves.REVELATION_DANCE]).enemyMoveset([Moves.MIRROR_MOVE, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [, shuckle2] = game.scene.getPlayerParty();

    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.MIRROR_MOVE, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // Oricorio rev dance
    await game.phaseInterceptor.to("MovePhase"); // Feebas fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio fiery dance (from dancer)

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 copies oricorio
    await game.phaseInterceptor.to("MovePhase", false); // copied move used

    checkCurrentMoveUser(shuckle2, Moves.REVELATION_DANCE); // change to fiery dance if i am in fact wrong
  });

  it("should not count as the last move used for instruct", async () => {
    game.override.moveset([Moves.FIERY_DANCE, Moves.REVELATION_DANCE]).enemyMoveset([Moves.INSTRUCT, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.INSTRUCT, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // Oricorio rev dance
    await game.phaseInterceptor.to("MovePhase"); // Feebas fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio fiery dance (from dancer)

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 instructs oricorio
    await game.phaseInterceptor.to("MovePhase", false); // instructed move used

    checkCurrentMoveUser(game.scene.getPlayerPokemon(), Moves.REVELATION_DANCE);
  });
});
