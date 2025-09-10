import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { ShopCursorTarget } from "#enums/shop-cursor-target";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenges - Hardcore", () => {
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

    game.challengeMode.addChallenge(Challenges.HARDCORE, 1, 1);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.VOLTORB)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .moveset(MoveId.SPLASH);
  });

  it("should render Revival Blessing unusable by players only", async () => {
    game.override.enemyMoveset(MoveId.REVIVAL_BLESSING).moveset(MoveId.REVIVAL_BLESSING);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    const player = game.field.getPlayerPokemon();
    const revBlessing = player.getMoveset()[0];
    expect(revBlessing.isUsable(player)).toBe(false);

    game.move.select(MoveId.REVIVAL_BLESSING);
    await game.toEndOfTurn();

    // Player struggled due to only move being the unusable Revival Blessing
    expect(player).toHaveUsedMove(MoveId.STRUGGLE);
    expect(game.field.getEnemyPokemon()).toHaveUsedMove(MoveId.REVIVAL_BLESSING);
  });

  it("prevents REVIVE items in shop and in wave rewards", async () => {
    game.override.startingWave(181).startingLevel(200);
    await game.challengeMode.startBattle();

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();

    await game.phaseInterceptor.to("SelectModifierPhase");
    expect(game.scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
    const modifierSelectHandler = game.scene.ui.handlers.find(
      h => h instanceof ModifierSelectUiHandler,
    ) as ModifierSelectUiHandler;
    expect(
      modifierSelectHandler.options.find(reward => reward.modifierTypeOption.type.group === "revive"),
    ).toBeUndefined();
    expect(
      modifierSelectHandler.shopOptionsRows.find(row =>
        row.find(item => item.modifierTypeOption.type.group === "revive"),
      ),
    ).toBeUndefined();
  });

  it("prevents the automatic party heal from reviving fainted Pokémon", async () => {
    game.override.startingWave(10).startingLevel(200);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF, SpeciesId.WHISMUR]);

    const faintedPokemon = game.scene.getPlayerParty()[1];
    faintedPokemon.hp = 0;
    faintedPokemon.status = new Status(StatusEffect.FAINT);
    expect(faintedPokemon.isFainted()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();

    await game.toNextWave();

    expect(faintedPokemon.isFainted()).toBe(true);
  });

  // TODO: Couldn't figure out how to select party Pokémon
  it.skip("prevents fusion with a fainted Pokémon", async () => {
    game.override.itemRewards([{ name: "DNA_SPLICERS" }]);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF, SpeciesId.WHISMUR]);

    const faintedPokemon = game.scene.getPlayerParty()[1];
    faintedPokemon.hp = 0;
    faintedPokemon.status = new Status(StatusEffect.FAINT);
    expect(faintedPokemon.isFainted()).toBe(true);

    game.move.select(MoveId.RAZOR_LEAF);
    await game.doKillOpponents();

    await game.phaseInterceptor.to("SelectModifierPhase");
    game.onNextPrompt(
      "SelectModifierPhase",
      UiMode.MODIFIER_SELECT,
      () => {
        const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
        // Traverse to and select first modifier
        handler.setCursor(0);
        handler.setRowCursor(ShopCursorTarget.REWARDS);
        handler.processInput(Button.ACTION);

        // Go to fainted Pokémon and try to select it
        handler.processInput(Button.RIGHT);
        handler.processInput(Button.ACTION);
        handler.processInput(Button.ACTION);
        handler.processInput(Button.ACTION);

        expect(game.scene.getPlayerParty().length).toBe(2);
      },
      () => game.isCurrentPhase("CommandPhase") || game.isCurrentPhase("NewBattlePhase"),
      true,
    );
  });

  // TODO: Couldn't figure out how to select party Pokémon
  it.skip("prevents fainted Pokémon from being revived", async () => {
    game.override.itemRewards([{ name: "MAX_REVIVE" }]);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF, SpeciesId.WHISMUR]);

    const faintedPokemon = game.scene.getPlayerParty()[1];
    faintedPokemon.hp = 0;
    faintedPokemon.status = new Status(StatusEffect.FAINT);
    expect(faintedPokemon.isFainted()).toBe(true);

    game.move.select(MoveId.RAZOR_LEAF);
    await game.doKillOpponents();

    await game.phaseInterceptor.to("SelectModifierPhase");
    game.onNextPrompt(
      "SelectModifierPhase",
      UiMode.MODIFIER_SELECT,
      () => {
        const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
        // Traverse to and select first modifier
        handler.setCursor(0);
        handler.setRowCursor(ShopCursorTarget.REWARDS);
        handler.processInput(Button.ACTION);

        // Go to fainted Pokémon and try to select it
        handler.processInput(Button.RIGHT);
        handler.processInput(Button.ACTION);
        handler.processInput(Button.ACTION);
        handler.processInput(Button.ACTION);

        expect(faintedPokemon.isFainted()).toBe(true);
      },
      () => game.isCurrentPhase("CommandPhase") || game.isCurrentPhase("NewBattlePhase"),
      true,
    );
  });
});
