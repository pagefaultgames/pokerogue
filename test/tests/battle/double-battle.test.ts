import { getGameMode } from "#app/game-mode";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { Command } from "#enums/command";
import { GameModes } from "#enums/game-modes";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import { UiMode } from "#enums/ui-mode";
import type { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/framework/game-manager";
import type { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Double Battles", () => {
  const DOUBLE_CHANCE = 8; // Normal chance of double battle is 1/8

  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override //
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("double");
  });

  async function getModifierShopHandler(): Promise<ModifierSelectUiHandler> {
    await game.phaseInterceptor.to("BattleEndPhase");
    await vi.waitUntil(() => !game.scene.phaseManager.getCurrentPhase()?.is("BattleEndPhase"));

    const currentPhase = game.scene.phaseManager.getCurrentPhase()?.phaseName;
    expect(currentPhase, "Expected battle to transition to SelectModifierPhase").toBe("SelectModifierPhase");

    await game.phaseInterceptor.to("SelectModifierPhase");
    await vi.waitUntil(() => game.scene.ui.mode === UiMode.MODIFIER_SELECT);

    return game.scene.ui.getHandler() as ModifierSelectUiHandler;
  }

  // double-battle player's pokemon both fainted in same round, then revive one, and next double battle summons two player's pokemon successfully.
  // (There were bugs that either only summon one when can summon two, player stuck in switchPhase etc)
  it("3v2 edge case: player summons 2 pokemon on the next battle after being fainted and revived", async () => {
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARIZARD, SpeciesId.SQUIRTLE);

    game.move.use(MoveId.SPLASH);
    game.move.use(MoveId.SPLASH, 1);

    for (const pokemon of game.scene.getPlayerField()) {
      pokemon.hp = 0;
      pokemon.status = new Status(StatusEffect.FAINT);
      expect(pokemon).toHaveFainted();
    }

    await game.doKillOpponents();

    await game.phaseInterceptor.to("BattleEndPhase");
    game.doSelectModifier();

    const charizard = game.scene.getPlayerParty().findIndex(p => p.species.speciesId === SpeciesId.CHARIZARD);
    game.doRevivePokemon(charizard);

    await game.phaseInterceptor.to("TurnInitPhase");
    expect(game.scene.getPlayerField().filter(p => !p.isFainted())).toHaveLength(2);
  });

  it("randomly chooses between single and double battles if there is no battle type override", async () => {
    game.override.battleStyle(null);

    let rngSweepProgress = 0; // Will simulate RNG rolls by slowly increasing from 0 to 1
    let doubleCount = 0;
    let singleCount = 0;

    vi.spyOn(Phaser.Math.RND, "realInRange").mockImplementation((min: number, max: number) => {
      return rngSweepProgress * (max - min) + min;
    });

    // Play through endless, waves 1 to 9, counting number of double battles from waves 2 to 9
    await game.classicMode.startBattle(SpeciesId.BULBASAUR);
    game.scene.gameMode = getGameMode(GameModes.ENDLESS);

    for (let i = 0; i < DOUBLE_CHANCE; i++) {
      rngSweepProgress = (i + 0.5) / DOUBLE_CHANCE;

      game.move.use(MoveId.SPLASH);
      await game.doKillOpponents();
      await game.toNextWave();

      if (game.scene.getEnemyParty().length === 1) {
        singleCount++;
      } else if (game.scene.getEnemyParty().length === 2) {
        doubleCount++;
      }
    }

    expect(doubleCount).toBe(1);
    expect(singleCount).toBe(DOUBLE_CHANCE - 1);
  });

  it("should offer no rewards when both opponents flee and zero are defeated", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.FEEBAS);

    game.move.use(MoveId.ROAR, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.ROAR, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);

    const handler = await getModifierShopHandler();
    expect(handler.options.length).toBe(0);
  });

  it("should offer normal rewards when one opponent is defeated and the other flees", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.FEEBAS);

    game.field.getEnemyParty()[0].hp = 1;

    game.move.use(MoveId.AERIAL_ACE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    game.move.use(MoveId.ROAR, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);

    const handler = await getModifierShopHandler();
    expect(handler.options.length).toBe(3);
  });

  it("should not allow the player to select rewards when running away with one enemy defeated", async () => {
    game.override.runSuccess(true);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.field.getEnemyParty()[0].hp = 1;

    game.move.use(MoveId.AERIAL_ACE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.toNextTurn();

    const commandPhase = game.scene.phaseManager.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);

    let rewardsShown = false;

    game.promptHandler.addToNextPrompt(
      "SelectModifierPhase",
      UiMode.MODIFIER_SELECT,
      () => {
        rewardsShown = true;
        game.endPhase();
      },
      () => game.isCurrentPhase("NewBattlePhase"),
    );

    await game.phaseInterceptor.to("NewBattlePhase");

    if (rewardsShown) {
      expect.fail("The player should not have an opportunity to select rewards.");
    }
    expect(game.scene.currentBattle.waveIndex).toBe(2);
  });

  it("won't queue multiple `BattleEndPhase`s/etc if the last 2 enemy Pokemon are defeated simultaneously in a trainer battle", async () => {
    game.override //
      .battleType(BattleType.TRAINER)
      .randomTrainer({ trainerType: TrainerType.YOUNGSTER, trainerVariant: TrainerVariant.DOUBLE })
      .startingLevel(200);

    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    expect(game.field.getEnemyParty()).toHaveLength(2);
    expect(game.scene.getEnemyField()).toHaveLength(2);

    game.move.use(MoveId.SURF);
    await game.toEndOfTurn(false);

    expect(game.scene.phaseManager["phaseQueue"].findAll("BattleEndPhase")).toHaveLength(1);
  });
});
