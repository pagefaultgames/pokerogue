import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import type { MovePhase } from "#phases/move-phase";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Instruct", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .passiveAbility(AbilityId.NO_GUARD)
      .enemyLevel(100)
      .startingLevel(100)
      .criticalHits(false);
  });

  function instructSuccess(target: Pokemon, move: MoveId): void {
    expect(target).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
    expect(target).toHaveUsedMove({ move, result: MoveResult.SUCCESS }, 1);
  }

  it("should force the target to repeat their last used move", async () => {
    game.override.moveset(MoveId.INSTRUCT);
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    const enemy = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemy, MoveId.SONIC_BOOM);

    game.move.select(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.SONIC_BOOM);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MovePhase"); // enemy attacks us
    await game.phaseInterceptor.to("MovePhase", false); // instruct
    let currentPhase = game.scene.phaseManager.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(game.field.getPlayerPokemon());
    await game.phaseInterceptor.to("MoveEndPhase");

    await game.phaseInterceptor.to("MovePhase", false); // enemy repeats move
    currentPhase = game.scene.phaseManager.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(enemy);
    expect(currentPhase.move.moveId).toBe(MoveId.SONIC_BOOM);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(enemy, MoveId.SONIC_BOOM);
    expect(enemy).toHaveUsedPP(MoveId.SONIC_BOOM, 2);
  });

  it("should ignore Substitute", async () => {
    game.override.moveset([MoveId.INSTRUCT, MoveId.SPLASH]);
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    const enemy = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemy, [MoveId.SONIC_BOOM, MoveId.SUBSTITUTE]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SUBSTITUTE);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.SONIC_BOOM);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(game.field.getEnemyPokemon(), MoveId.SONIC_BOOM);
  });

  it("should repeat ally's attack on enemy", async () => {
    game.override.battleStyle("double").enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS, SpeciesId.SHUCKLE);

    const [amoonguss, shuckle] = game.scene.getPlayerField();
    game.move.changeMoveset(amoonguss, [MoveId.INSTRUCT, MoveId.SONIC_BOOM]);
    game.move.changeMoveset(shuckle, [MoveId.INSTRUCT, MoveId.SONIC_BOOM]);

    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.SONIC_BOOM, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(shuckle, MoveId.SONIC_BOOM);
  });

  // TODO: Enable test case once gigaton hammer (and blood moon) are reworked
  it.todo("should repeat Gigaton Hammer successfully", async () => {
    game.override.moveset(MoveId.INSTRUCT).enemyLevel(5);
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    const enemy = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemy, [MoveId.GIGATON_HAMMER, MoveId.BLOOD_MOON]);

    game.move.select(MoveId.INSTRUCT);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    instructSuccess(enemy, MoveId.GIGATON_HAMMER);
  });

  it("should be considered as the last move used for Copycat", async () => {
    game.override.battleStyle("double").enemyLevel(5);
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    game.move.changeMoveset(enemy1, MoveId.WATER_GUN);
    game.move.changeMoveset(enemy2, MoveId.COPYCAT);

    game.move.use(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    instructSuccess(enemy1, MoveId.WATER_GUN);
    // amoonguss gets hit by water gun thrice; once by original attack, once by instructed use and once by copycat
    expect(game.field.getPlayerPokemon().turnData.attacksReceived.length).toBe(3);
  });

  it("should fail on called/metronomed moves, even if also in moveset", async () => {
    game.move.forceMetronomeMove(MoveId.ABSORB);
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemy, [MoveId.METRONOME, MoveId.ABSORB]);

    game.move.use(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.METRONOME);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.FAIL });
  });

  it("should respect and trigger the enemy's status condition", async () => {
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    game.move.use(MoveId.THUNDER_WAVE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.use(MoveId.INSTRUCT);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MovePhase");
    // force enemy's instructed move (and only the instructed move) to fail
    await game.move.forceStatusActivation(true);
    await game.phaseInterceptor.to("MoveEndPhase");

    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveUsedMove({ move: MoveId.NONE, result: MoveResult.FAIL });
  });

  it("should fail if the target's move is out of PP", async () => {
    game.override.enemySpecies(SpeciesId.UNOWN);
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    const enemyPokemon = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemyPokemon, MoveId.HIDDEN_POWER);
    const hiddenPower = enemyPokemon.moveset.find(m => m?.moveId === MoveId.HIDDEN_POWER)!;
    hiddenPower.ppUsed = hiddenPower.getMovePp() - 1;

    game.move.use(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.HIDDEN_POWER);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.FAIL });
  });

  it("should redirect attacking moves if the original target fainted", async () => {
    game.override.battleStyle("double").enemyMoveset(MoveId.SPLASH).enemySpecies(SpeciesId.MAGIKARP).enemyLevel(1);
    await game.classicMode.startBattle(SpeciesId.HISUI_ELECTRODE, SpeciesId.KOMMO_O);

    game.move.use(MoveId.THUNDERBOLT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({
      move: MoveId.THUNDERBOLT,
      result: MoveResult.SUCCESS,
      targets: [BattlerIndex.ENEMY_2],
      useMode: MoveUseMode.NORMAL,
    });
    expect(player).toHaveUsedMove(
      {
        result: MoveResult.SUCCESS,
        move: MoveId.THUNDERBOLT,
        targets: [BattlerIndex.ENEMY],
        useMode: MoveUseMode.NORMAL,
      },
      1,
    );
    const [karp1, karp2] = game.scene.getEnemyField();
    expect(karp1.isFainted()).toBe(true);
    expect(karp2.isFainted()).toBe(true);
  });

  it("should trigger Dancer on Instructed dance moves", async () => {
    game.override.battleStyle("double").enemyMoveset([MoveId.INSTRUCT, MoveId.SPLASH]).enemyLevel(1000);
    await game.classicMode.startBattle(SpeciesId.ORICORIO, SpeciesId.VOLCARONA);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.selectEnemyMove(MoveId.INSTRUCT, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    // fiery dance triggered dancer successfully for a total of 4 hits
    // Enemy level is set to a high value so that it does not faint even after all 4 hits

    const volcarona = game.scene.getPlayerField()[1];
    instructSuccess(volcarona, MoveId.FIERY_DANCE);
    expect(game.field.getEnemyPokemon().turnData.attacksReceived.length).toBe(4);
  });

  it("should fail if the target just switched out", async () => {
    game.override.enemySpecies(SpeciesId.UNOWN);
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS, SpeciesId.TOXICROAK);

    // ensure move is in moveset to avoid false negatives
    const [player1, player2] = game.scene.getPlayerParty();
    game.move.changeMoveset(player1, MoveId.SEED_BOMB);
    game.move.changeMoveset(player2, MoveId.SEED_BOMB);

    player1.pushMoveHistory({
      move: MoveId.SEED_BOMB,
      targets: [BattlerIndex.ENEMY],
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.NORMAL,
    });

    game.doSwitchPokemon(1);
    await game.move.forceEnemyMove(MoveId.INSTRUCT);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.FAIL });
  });

  it("should fail if no move has yet been used by the target", async () => {
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    game.move.use(MoveId.INSTRUCT);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.FAIL });
  });

  it("should be able to call disabled moves, albeit unsuccessfully", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS, SpeciesId.DROWZEE);

    game.move.use(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.DISABLE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // Instruct itself works, but the instructed move fails due to being disabled
    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.SUCCESS });
    expect(enemy).toHaveUsedMove({ move: MoveId.NONE, result: MoveResult.FAIL });
    expect(enemy).toHaveUsedPP(MoveId.SONIC_BOOM, 1);
  });

  it("should not bypass protection moves", async () => {
    await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

    game.move.use(MoveId.INSTRUCT);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.MISS });
  });

  it("should not repeat enemy's charging move", async () => {
    game.override.enemyMoveset([MoveId.SONIC_BOOM, MoveId.HYPER_BEAM]);
    await game.classicMode.startBattle(SpeciesId.SHUCKLE);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    enemy.pushMoveHistory({
      move: MoveId.SONIC_BOOM,
      targets: [BattlerIndex.PLAYER],
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.NORMAL,
    });

    game.move.use(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.HYPER_BEAM);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // instruct fails at copying last move due to charging turn (rather than wrongly instructing sonic boom)
    expect(player).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.FAIL });

    game.move.use(MoveId.INSTRUCT);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(player).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.FAIL });
  });

  it("should not repeat move since forgotten by target", async () => {
    game.override.enemyMoveset(MoveId.INSTRUCT);
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    const regieleki = game.field.getPlayerPokemon();
    regieleki.pushMoveHistory({
      move: MoveId.ELECTRO_DRIFT,
      targets: [BattlerIndex.PLAYER],
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.NORMAL,
    });

    game.move.use(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();
    expect(game.field.getEnemyPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should disregard priority of instructed move on use", async () => {
    await game.classicMode.startBattle(SpeciesId.LUCARIO, SpeciesId.BANETTE);

    const enemyPokemon = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemyPokemon, [MoveId.WHIRLWIND, MoveId.SPLASH]);
    enemyPokemon.pushMoveHistory({
      move: MoveId.WHIRLWIND,
      targets: [BattlerIndex.PLAYER],
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.NORMAL,
    });

    game.move.use(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // lucario instructed enemy whirlwind at 0 priority to switch itself out
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.WHIRLWIND, result: MoveResult.SUCCESS }, 1);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.BANETTE);
  });

  it("should respect moves' original priority for psychic terrain", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.BANETTE, SpeciesId.KLEFKI);

    const banette = game.field.getPlayerPokemon();
    game.move.changeMoveset(banette, [MoveId.QUICK_ATTACK, MoveId.SPLASH]);

    game.move.select(MoveId.QUICK_ATTACK, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();
    expect(banette).toHaveUsedMove({
      move: MoveId.QUICK_ATTACK,
      targets: [BattlerIndex.ENEMY],
      result: MoveResult.SUCCESS,
    });

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // quick attack failed when instructed
    expect(banette).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.FAIL }, 1);
  });

  // TODO: Enable once Sky Drop is fully implemented
  it.todo("should not work against Sky Dropped targets, even if user/target have No Guard", async () => {
    game.override.battleStyle("double").ability(AbilityId.NO_GUARD);
    await game.classicMode.startBattle(SpeciesId.BANETTE, SpeciesId.KLEFKI);

    const [banette, klefki] = game.scene.getPlayerField();
    banette.pushMoveHistory({
      move: MoveId.VINE_WHIP,
      targets: [BattlerIndex.ENEMY],
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.NORMAL,
    });

    // Attempt to instruct banette after having been sent airborne
    game.move.use(MoveId.VINE_WHIP, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SKY_DROP, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.ASTONISH, BattlerIndex.PLAYER);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // Klefki instruct fails due to banette being airborne, even though it got hit prior
    expect(banette.visible).toBe(false);
    expect(banette.isFullHp()).toBe(false);
    expect(klefki.getLastXMoves()[0]).toMatchObject({
      move: MoveId.INSTRUCT,
      targets: [BattlerIndex.PLAYER],
      result: MoveResult.FAIL,
    });
  });

  it("should still work with prankster in psychic terrain", async () => {
    game.override
      .battleStyle("double")
      .ability(AbilityId.PRANKSTER)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.PSYCHIC_SURGE);
    await game.classicMode.startBattle(SpeciesId.BANETTE, SpeciesId.KLEFKI);

    const [banette, klefki] = game.scene.getPlayerField();
    game.move.changeMoveset(banette, [MoveId.VINE_WHIP]);
    game.move.changeMoveset(klefki, MoveId.INSTRUCT);
    banette.pushMoveHistory({
      move: MoveId.VINE_WHIP,
      targets: [BattlerIndex.ENEMY],
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.NORMAL,
    });

    game.move.select(MoveId.VINE_WHIP, BattlerIndex.PLAYER);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER); // copies vine whip
    game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // Klefki instructing a non-priority move succeeds, ignoring the priority of Instruct itself
    expect(banette).toHaveUsedMove(MoveId.VINE_WHIP, 1);
    expect(banette).toHaveUsedMove(MoveId.VINE_WHIP, 2);
    expect(klefki).toHaveUsedMove({
      move: MoveId.INSTRUCT,
      targets: [BattlerIndex.PLAYER],
      result: MoveResult.SUCCESS,
    });
  });

  it("should cause spread moves to correctly hit targets in doubles after singles", async () => {
    game.override
      .battleStyle("even-doubles")
      .moveset([MoveId.BREAKING_SWIPE, MoveId.INSTRUCT, MoveId.SPLASH])
      .enemyMoveset(MoveId.SONIC_BOOM)
      .enemySpecies(SpeciesId.AXEW)
      .startingLevel(500)
      .enemyLevel(1);
    await game.classicMode.startBattle(SpeciesId.KORAIDON, SpeciesId.KLEFKI);

    const koraidon = game.field.getPlayerPokemon();

    game.move.select(MoveId.BREAKING_SWIPE);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(koraidon).toHaveUsedMove({ move: MoveId.BREAKING_SWIPE, targets: [BattlerIndex.ENEMY] });

    await game.toNextWave();

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // instructed move used hit both enemies
    expect(koraidon).toHaveUsedMove(
      {
        move: MoveId.BREAKING_SWIPE,
        targets: [BattlerIndex.ENEMY, BattlerIndex.ENEMY_2],
      },
      1,
    );
  });

  it("should cause AoE moves to correctly hit everyone in doubles after singles", async () => {
    game.override
      .battleStyle("even-doubles")
      .moveset([MoveId.BRUTAL_SWING, MoveId.INSTRUCT, MoveId.SPLASH])
      .enemySpecies(SpeciesId.AXEW)
      .enemyMoveset(MoveId.SONIC_BOOM)
      .startingLevel(500)
      .enemyLevel(1);
    await game.classicMode.startBattle(SpeciesId.KORAIDON, SpeciesId.KLEFKI);

    const koraidon = game.field.getPlayerPokemon();

    game.move.select(MoveId.BRUTAL_SWING);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(koraidon.hp).toBe(koraidon.getMaxHp());
    expect(koraidon.getLastXMoves(-1)[0].targets).toEqual([BattlerIndex.ENEMY]);

    await game.toNextWave();

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // instructed attack hit all 3 other combatants
    expect(koraidon).toHaveUsedMove(
      {
        move: MoveId.BRUTAL_SWING,
        targets: [BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2],
      },
      1,
    );
  });

  it("should cause multi-hit moves to hit the appropriate number of times in singles", async () => {
    game.override
      .enemyAbility(AbilityId.SKILL_LINK)
      .moveset([MoveId.SPLASH, MoveId.INSTRUCT])
      .enemyMoveset(MoveId.BULLET_SEED);
    await game.classicMode.startBattle(SpeciesId.BULBASAUR);

    const bulbasaur = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    game.move.select(MoveId.INSTRUCT);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(bulbasaur.turnData.attacksReceived.length).toBe(10);

    await game.toNextTurn();
    game.move.select(MoveId.INSTRUCT);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(bulbasaur.turnData.attacksReceived.length).toBe(10);
  });

  it("should cause multi-hit moves to hit the appropriate number of times in doubles", async () => {
    game.override
      .battleStyle("double")
      .enemyAbility(AbilityId.SKILL_LINK)
      .moveset([MoveId.SPLASH, MoveId.INSTRUCT])
      .enemyMoveset([MoveId.BULLET_SEED, MoveId.SPLASH])
      .enemyLevel(5);
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.IVYSAUR);

    const ivysaur = game.scene.getPlayerField()[1];

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.selectEnemyMove(MoveId.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(ivysaur.turnData.attacksReceived.length).toBe(15);

    await game.toNextTurn();

    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.selectEnemyMove(MoveId.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(ivysaur.turnData.attacksReceived.length).toBe(15);
  });

  it("should respect prior flinches and trigger Steadfast", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.AUDINO, SpeciesId.ABRA);

    // Fake enemy 1 having attacked prior
    const [, player2, enemy1, enemy2] = game.scene.getField();
    enemy1.pushMoveHistory({
      move: MoveId.ABSORB,
      targets: [BattlerIndex.PLAYER],
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.NORMAL,
    });
    game.field.mockAbility(enemy1, AbilityId.STEADFAST);

    game.move.use(MoveId.FAKE_OUT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.ABSORB);
    await game.move.forceEnemyMove(MoveId.INSTRUCT, BattlerIndex.ENEMY);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    // TODO: Update `toHaveUsedMove` to allow passing multiple moves in an array
    expect(enemy1.getLastXMoves(-1).map(m => m.move)).toEqual([MoveId.NONE, MoveId.NONE, MoveId.NONE, MoveId.ABSORB]);
    expect(player2).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.SUCCESS });
    expect(enemy2).toHaveUsedMove({ move: MoveId.INSTRUCT, result: MoveResult.SUCCESS });
    expect(enemy1).toHaveStatStage(Stat.SPD, 3);
  });
});
