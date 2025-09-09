import { getPokemonNameWithAffix } from "#app/messages";
import { AttackTypeBoosterModifier } from "#app/modifier/modifier";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { PositionalTagType } from "#enums/positional-tag-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Delayed Attacks", () => {
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
      .ability(AbilityId.NO_GUARD)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);
  });

  /**
   * Wait until a number of turns have passed.
   * @param numTurns - Number of turns to pass.
   * @param toEndOfTurn - Whether to advance to the `TurnEndPhase` (`true`) or the `PositionalTagPhase` (`false`);
   * default `true`
   * @returns A Promise that resolves once the specified number of turns has elapsed
   * and the specified phase has been reached.
   */
  async function passTurns(numTurns: number, toEndOfTurn = true): Promise<void> {
    for (let i = 0; i < numTurns; i++) {
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
      if (game.scene.getPlayerField()[1]?.isActive()) {
        game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      }
      await game.move.forceEnemyMove(MoveId.SPLASH);
      if (game.scene.getEnemyField()[1]?.isActive()) {
        await game.move.forceEnemyMove(MoveId.SPLASH);
      }
      await game.phaseInterceptor.to("PositionalTagPhase");
    }
    if (toEndOfTurn) {
      await game.toEndOfTurn();
    }
  }

  /**
   * Expect that future sight is active with the specified number of attacks.
   * @param numAttacks - The number of delayed attacks that should be queued; default `1`
   */
  function expectFutureSightActive(numAttacks = 1) {
    const delayedAttacks = game.scene.arena.positionalTagManager["tags"].filter(
      t => t.tagType === PositionalTagType.DELAYED_ATTACK,
    );
    expect(delayedAttacks).toHaveLength(numAttacks);
  }

  it.each<{ name: string; move: MoveId }>([
    { name: "Future Sight", move: MoveId.FUTURE_SIGHT },
    { name: "Doom Desire", move: MoveId.DOOM_DESIRE },
  ])("$name should show message and strike 2 turns after use, ignoring player/enemy switches", async ({ move }) => {
    game.override.battleType(BattleType.TRAINER);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(move);
    await game.toNextTurn();

    expectFutureSightActive();

    game.doSwitchPokemon(1);
    game.forceEnemyToSwitch();
    await game.toNextTurn();

    await passTurns(1);

    expectFutureSightActive(0);
    const enemy = game.field.getEnemyPokemon();
    expect(enemy).not.toHaveFullHp();
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy),
        moveName: allMoves[move].name,
      }),
    );
  });

  it("should fail (preserving prior instances) when used against the same target", async () => {
    await game.classicMode.startBattle([SpeciesId.BRONZONG]);

    game.move.use(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive();
    const bronzong = game.field.getPlayerPokemon();
    expect(bronzong.getLastXMoves()[0].result).toBe(MoveResult.OTHER);

    game.move.use(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive();
    expect(bronzong.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should still be delayed when called by other moves", async () => {
    await game.classicMode.startBattle([SpeciesId.BRONZONG]);

    game.move.use(MoveId.METRONOME);
    game.move.forceMetronomeMove(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive();
    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveFullHp();

    await passTurns(2);

    expectFutureSightActive(0);
    expect(enemy).not.toHaveFullHp();
  });

  it("should work when used against different targets in doubles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const [karp, feebas, enemy1, enemy2] = game.scene.getField();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.toEndOfTurn();

    expectFutureSightActive(2);
    expect(enemy1).toHaveFullHp();
    expect(enemy2).toHaveFullHp();
    expect(karp.getLastXMoves()[0].result).toBe(MoveResult.OTHER);
    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.OTHER);

    await passTurns(2);

    expect(enemy1).not.toHaveFullHp();
    expect(enemy2).not.toHaveFullHp();
  });

  it("should trigger multiple pending attacks in order of creation, even if that order changes later on", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const [alomomola, blissey] = game.scene.getField();

    const oldOrder = game.field.getSpeedOrder();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER_2);
    // Ensure that the moves are used deterministically in speed order (for speed ties)
    await game.setTurnOrder(oldOrder.map(p => p.getBattlerIndex()));
    await game.toNextTurn();

    expectFutureSightActive(4);

    // Lower speed to change turn order
    alomomola.setStatStage(Stat.SPD, 6);
    blissey.setStatStage(Stat.SPD, -6);

    const newOrder = game.field.getSpeedOrder();
    expect(newOrder).not.toEqual(oldOrder);

    await passTurns(2, false);

    // All attacks have concluded at this point, unshifting new `MoveEffectPhase`s to the queue.
    expectFutureSightActive(0);

    const MEPs = game.scene.phaseManager.phaseQueue.filter(p => p.is("MoveEffectPhase"));
    expect(MEPs).toHaveLength(4);
    expect(MEPs.map(mep => mep.getPokemon())).toEqual(oldOrder);
  });

  it("should vanish silently if it would otherwise hit the user", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const [karp, feebas, milotic] = game.scene.getPlayerParty();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expectFutureSightActive(1);

    // Milotic / Feebas // Karp
    game.doSwitchPokemon(2);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(game.scene.getPlayerParty()).toEqual([milotic, feebas, karp]);

    // Milotic / Karp // Feebas
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.doSwitchPokemon(2);

    await passTurns(1);

    expect(game.scene.getPlayerParty()).toEqual([milotic, karp, feebas]);

    expect(karp).toHaveFullHp();
    expect(feebas).toHaveFullHp();
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(karp),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
  });

  it("should redirect normally if target is fainted when move is used", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.killPokemon(enemy2);
    await game.toNextTurn();

    expect(enemy2.isFainted()).toBe(true);
    expectFutureSightActive();

    expect(game).toHavePositionalTag({
      tagType: PositionalTagType.DELAYED_ATTACK,
      targetIndex: enemy1.getBattlerIndex(),
    });

    await passTurns(2);

    expect(enemy1).not.toHaveFullHp();
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy1),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
  });

  it("should vanish silently if slot is vacant when attack lands", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.toNextTurn();

    expectFutureSightActive(1);

    game.move.use(MoveId.SPLASH);
    await game.killPokemon(enemy2);
    await game.toNextTurn();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expectFutureSightActive(0);
    expect(enemy1).toHaveFullHp();
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy1),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
  });

  it("should consider type changes at moment of execution while ignoring redirection", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    // fake left enemy having lightning rod
    const [enemy1, enemy2] = game.scene.getEnemyField();
    game.field.mockAbility(enemy1, AbilityId.LIGHTNING_ROD);

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.toNextTurn();

    expectFutureSightActive(1);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.ELECTRIFY, BattlerIndex.PLAYER);
    await game.phaseInterceptor.to("PositionalTagPhase");
    await game.phaseInterceptor.to("MoveEffectPhase", false);

    // Wait until all normal attacks have triggered, then check pending MEP
    const karp = game.field.getPlayerPokemon();
    const typeMock = vi.spyOn(karp, "getMoveType");

    await game.toEndOfTurn();

    expect(enemy1).toHaveFullHp();
    expect(enemy2).not.toHaveFullHp();
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy2),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
    expect(typeMock).toHaveLastReturnedWith(PokemonType.ELECTRIC);
  });

  // TODO: this is not implemented
  it.todo("should not apply Shell Bell recovery, even if user is on field");

  // TODO: Enable once code is added to MEP to do this
  it.todo("should not apply the user's abilities when dealing damage if the user is inactive", async () => {
    game.override.ability(AbilityId.NORMALIZE).enemySpecies(SpeciesId.LUNALA);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(MoveId.DOOM_DESIRE);
    await game.toNextTurn();

    expectFutureSightActive();

    await passTurns(1);

    game.doSwitchPokemon(1);
    const typeMock = vi.spyOn(game.field.getPlayerPokemon(), "getMoveType");
    const powerMock = vi.spyOn(allMoves[MoveId.DOOM_DESIRE], "calculateBattlePower");

    await game.toNextTurn();

    // Player Normalize was not applied due to being off field
    const enemy = game.field.getEnemyPokemon();
    expect(enemy).not.toHaveFullHp();
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy),
        moveName: allMoves[MoveId.DOOM_DESIRE].name,
      }),
    );
    expect(typeMock).toHaveLastReturnedWith(PokemonType.STEEL);
    expect(powerMock).toHaveLastReturnedWith(150);
  });

  it.todo("should not apply the user's held items when dealing damage if the user is inactive", async () => {
    game.override.startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 99, type: PokemonType.PSYCHIC }]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive();

    await passTurns(1);

    game.doSwitchPokemon(1);

    const powerMock = vi.spyOn(allMoves[MoveId.FUTURE_SIGHT], "calculateBattlePower");
    const typeBoostSpy = vi.spyOn(AttackTypeBoosterModifier.prototype, "apply");

    await game.toNextTurn();

    expect(powerMock).toHaveLastReturnedWith(120);
    expect(typeBoostSpy).not.toHaveBeenCalled();
  });

  it("should not crash when catching & releasing a Pokemon on the same turn its delayed attack expires", async () => {
    game.override.startingModifier([{ name: "MASTER_BALL", count: 1 }]);
    await game.classicMode.startBattle([
      SpeciesId.FEEBAS,
      SpeciesId.FEEBAS,
      SpeciesId.FEEBAS,
      SpeciesId.FEEBAS,
      SpeciesId.FEEBAS,
      SpeciesId.FEEBAS,
    ]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive(1);

    await passTurns(1);

    // Throw master ball and release the enemy
    game.doThrowPokeball(PokeballType.MASTER_BALL);
    game.onNextPrompt("AttemptCapturePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.CANCEL);
    });
    await game.toEndOfTurn();

    expectFutureSightActive(0);
  });

  // TODO: Implement and move to a power spot's test file
  it.todo("Should activate ally's power spot when switched in during single battles");
});
