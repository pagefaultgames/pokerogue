import { AbilityId } from "#enums/ability-id";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenges - No Support", () => {
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
      .enemyMoveset(MoveId.SPLASH)
      .moveset(MoveId.RAZOR_LEAF);
  });

  it('disables the shop in "No Shop"', async () => {
    game.override.startingWave(181);
    game.challengeMode.addChallenge(Challenges.NO_SUPPORT, 2, 1);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    game.move.select(MoveId.RAZOR_LEAF);
    await game.doKillOpponents();

    await game.phaseInterceptor.to("SelectModifierPhase");
    expect(game.scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = game.scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.shopOptionsRows.length).toBe(0);
  });

  it('disables the automatic party heal in "No Heal"', async () => {
    game.override.startingWave(10);
    game.challengeMode.addChallenge(Challenges.NO_SUPPORT, 1, 1);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    const playerPokemon = game.scene.getPlayerPokemon();
    playerPokemon!.damageAndUpdate(playerPokemon!.hp / 2);

    game.move.select(MoveId.RAZOR_LEAF);
    await game.doKillOpponents();

    await game.phaseInterceptor.to("SelectModifierPhase");
    game.doSelectModifier();

    // Next wave
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(playerPokemon!.isFullHp()).toBe(false);
  });

  it('disables the automatic party heal and the shop in "Both"', async () => {
    game.override.startingWave(10);
    game.challengeMode.addChallenge(Challenges.NO_SUPPORT, 3, 1);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    const playerPokemon = game.scene.getPlayerPokemon();
    playerPokemon!.damageAndUpdate(playerPokemon!.hp / 2);

    game.move.select(MoveId.RAZOR_LEAF);
    await game.doKillOpponents();

    await game.phaseInterceptor.to("SelectModifierPhase");
    game.doSelectModifier();

    // Next wave
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(playerPokemon!.isFullHp()).toBe(false);

    game.move.select(MoveId.RAZOR_LEAF);
    await game.doKillOpponents();

    await game.phaseInterceptor.to("SelectModifierPhase");
    expect(game.scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = game.scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(modifierSelectHandler.shopOptionsRows.length).toBe(0);
  });
});
