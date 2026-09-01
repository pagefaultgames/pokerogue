import type { BattleScene } from "#app/battle-scene";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { PartyUiMode } from "#enums/party-ui-mode";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import { GameManager } from "#test/framework/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/utils/game-manager-utils";
import type { PartyUiHandler } from "#ui/party-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("UI - Switch Mode Button", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    scene = game.scene;
  });

  async function setupBattle(battleStyle: "single" | "double") {
    game.override
      .moveset([MoveId.FISSURE, MoveId.SPLASH])
      .ability(AbilityId.NO_GUARD)
      .startingLevel(200)
      .enemySpecies(SpeciesId.MAGIKARP)
      .battleStyle(battleStyle);

    initSceneWithoutEncounterPhase(scene, [SpeciesId.ABRA, SpeciesId.VOLCARONA, SpeciesId.RAYQUAZA]);
    const selectModifierPhase = new SelectModifierPhase();
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    await game.phaseInterceptor.to("SelectModifierPhase");
  }

  it("should show the switch mode button in single battles", async () => {
    await setupBattle("single");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    expect(partyHandler["partySwitchModeButton"].visible).toBe(true);
  });

  it("should show the switch mode button in double battles", async () => {
    await setupBattle("double");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    expect(partyHandler["partySwitchModeButton"].visible).toBe(true);
  });

  it("should hide the switch mode button", async () => {
    await setupBattle("single");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.MODIFIER_TRANSFER);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    expect(partyHandler["partySwitchModeButton"].visible).toBe(false);
  });

  it("should switch using the switch mode button in single battles", async () => {
    await setupBattle("single");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const secondPokemon = party[1];

    partyHandler.setCursor(7);
    partyHandler.processInput(Button.ACTION);
    partyHandler.setCursor(0);
    partyHandler.processInput(Button.ACTION);
    partyHandler.setCursor(1);
    partyHandler.processInput(Button.ACTION);

    expect(game.scene.getPlayerParty()[0]).toBe(secondPokemon);
    expect(game.scene.getPlayerParty()[1]).toBe(firstPokemon);
  });

  it("should switch using the switch mode button in double battles", async () => {
    await setupBattle("double");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const secondPokemon = party[1];

    partyHandler.setCursor(7);
    partyHandler.processInput(Button.ACTION);
    partyHandler.setCursor(0);
    partyHandler.processInput(Button.ACTION);
    partyHandler.setCursor(1);
    partyHandler.processInput(Button.ACTION);

    expect(game.scene.getPlayerParty()[0]).toBe(secondPokemon);
    expect(game.scene.getPlayerParty()[1]).toBe(firstPokemon);
  });
});
