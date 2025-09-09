import { AbilityId } from "#enums/ability-id";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { ExpBoosterModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenges - Limited Support", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.VOLTORB)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it('should disable the shop in "No Shop"', async () => {
    game.override.startingWave(181);
    game.challengeMode.addChallenge(Challenges.LIMITED_SUPPORT, 2, 1);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(game.scene.ui.getMode()).toBe(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = game.scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.shopOptionsRows).toHaveLength(0);
  });

  it('should disable the automatic party heal in "No Heal"', async () => {
    game.override.startingWave(10);
    game.challengeMode.addChallenge(Challenges.LIMITED_SUPPORT, 1, 1);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.hp /= 2;

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(playerPokemon).not.toHaveFullHp();
  });

  it('should disable both automatic party healing and shop in "Both"', async () => {
    game.override.startingWave(10);
    game.challengeMode.addChallenge(Challenges.LIMITED_SUPPORT, 3, 1);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.hp /= 2;

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(game.scene.getModifiers(ExpBoosterModifier)).toHaveLength(1);
    expect(playerPokemon).not.toHaveFullHp();

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(game.scene.ui.getMode()).toBe(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = game.scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.shopOptionsRows).toHaveLength(0);
  });
});
