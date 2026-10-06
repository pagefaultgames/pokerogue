import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { Button } from "#enums/buttons";
import { Command } from "#enums/command";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import type { Move } from "#moves/move";
import type { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/framework/game-manager";
import type { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Natural Gift", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let moveToCheck: Move;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    moveToCheck = allMoves[MoveId.NATURAL_GIFT];
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.STURDY)
      .moveset(MoveId.NATURAL_GIFT)
      .enemySpecies(SpeciesId.DRAGONITE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.STURDY)
      .enemyLevel(50);

    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("changes type to match the consumed berry", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.GANLON_BERRY }]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    const enemyPokemon = game.field.getEnemyPokemon();
    const spy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");

    game.promptHandler.addToNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      game.scene.ui.setMode(UiMode.FIGHT, 0);
    });
    game.promptHandler.addToNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      (game.scene.phaseManager.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, MoveUseMode.NORMAL);
    });
    game.promptHandler.addToNextPrompt("ItemSelectPhase", UiMode.OPTION_SELECT, () => {
      (game.scene.ui.getHandler() as OptionSelectUiHandler).setCursor(0);
      (game.scene.ui.getHandler() as OptionSelectUiHandler).processInput(Button.ACTION);
    });
    game.selectTarget(0, BattlerIndex.ENEMY);

    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(spy).toHaveReturnedWith(4);
  });

  it("changes type to match the consumed berry", async () => {
    game.override.enemyHeldItems([{ entry: HeldItemId.GANLON_BERRY }]).enemyMoveset(MoveId.NATURAL_GIFT);

    await game.classicMode.startBattle(SpeciesId.DRAGONITE);
    const playerPokemon = game.field.getPlayerPokemon();
    const spy = vi.spyOn(playerPokemon, "getMoveEffectiveness");

    game.move.use(MoveId.SPLASH);

    await game.move.forceEnemyMove(MoveId.NATURAL_GIFT);
    await game.toEndOfTurn();

    expect(spy).toHaveReturnedWith(4);
  });
});
