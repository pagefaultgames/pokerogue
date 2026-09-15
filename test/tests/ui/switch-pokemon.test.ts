import { BattleType } from "#enums/battle-type";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { PartyUiMode } from "#enums/party-ui-mode";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/framework/game-manager";
import type { ConfirmUiHandler } from "#ui/confirm-ui-handler";
import type { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import type { PartyUiHandler } from "#ui/party-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("UI - Party switch mode", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  /**
   * Setup for every test. We want the first battle to be against wild pokémon,
   * the party to have four pokémon so we can swap them around,
   * and we immediately jump to the modifier select phase.
   */
  async function setupBattle(battleStyle: "single" | "double") {
    game.override
      .moveset(MoveId.SPLASH)
      .startingLevel(200)
      .enemySpecies(SpeciesId.MAGIKARP)
      .battleStyle(battleStyle)
      .battleType(BattleType.WILD);

    await game.classicMode.startBattle(SpeciesId.ABRA, SpeciesId.VOLCARONA, SpeciesId.RAYQUAZA, SpeciesId.MAGCARGO);
    game.move.select(MoveId.SPLASH);
    if (battleStyle === "double") {
      game.move.select(MoveId.SPLASH);
    }
    await game.doKillOpponents();
    await game.phaseInterceptor.to("SelectModifierPhase");
  }

  /**
   * Helper function to swap two pokémon in the party.
   */
  function swapInParty(partyHandler: PartyUiHandler, first: number, second: number) {
    partyHandler.setCursor(first);
    partyHandler.processInput(Button.ACTION);
    partyHandler.setCursor(1);
    partyHandler.processInput(Button.ACTION);
    partyHandler.setCursor(second);
    partyHandler.processInput(Button.ACTION);
  }

  /**
   * Helper function to skip modifier select and go to the next wave.
   * Party reordering will happen during this function.
   */
  async function skipModifierSelect() {
    await game.scene.ui.setModeWithoutClear(UiMode.MODIFIER_SELECT);
    const msHandler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
    msHandler.processInput(Button.CANCEL);
    msHandler.processInput(Button.ACTION);
    const confirmHandler = game.scene.ui.getHandler() as ConfirmUiHandler;
    confirmHandler.processInput(Button.ACTION);

    await game.phaseInterceptor.to("TurnInitPhase");
  }

  it("should reorder the party before a single battle", async () => {
    await setupBattle("single");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const thirdPokemon = party[2];

    swapInParty(partyHandler, 0, 2);

    expect(game.scene.getPlayerParty()[0]).toBe(thirdPokemon);
    expect(game.scene.getPlayerParty()[2]).toBe(firstPokemon);

    // We do this to check which Pokémon are actually on the field
    let onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField).not.toContain(thirdPokemon);

    await skipModifierSelect();

    onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField[0]).toBe(thirdPokemon);
  });

  it("should reorder the party before a double battle", async () => {
    await setupBattle("double");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const secondPokemon = party[1];
    const thirdPokemon = party[2];
    const fourthPokemon = party[3];

    swapInParty(partyHandler, 0, 2);
    swapInParty(partyHandler, 1, 3);

    expect(game.scene.getPlayerParty()[0]).toBe(thirdPokemon);
    expect(game.scene.getPlayerParty()[1]).toBe(fourthPokemon);
    expect(game.scene.getPlayerParty()[2]).toBe(firstPokemon);
    expect(game.scene.getPlayerParty()[3]).toBe(secondPokemon);

    let onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField).not.toContain(thirdPokemon);
    expect(onField).not.toContain(fourthPokemon);

    await skipModifierSelect();

    onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField[0]).toBe(thirdPokemon);
    expect(onField[1]).toBe(fourthPokemon);
  });

  it("should reorder the party when going from double to single battle", async () => {
    await setupBattle("double");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const secondPokemon = party[1];
    const thirdPokemon = party[2];

    swapInParty(partyHandler, 0, 2);

    expect(game.scene.getPlayerParty()[0]).toBe(thirdPokemon);
    expect(game.scene.getPlayerParty()[2]).toBe(firstPokemon);

    let onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField).not.toContain(thirdPokemon);

    game.override.battleStyle("single");

    await skipModifierSelect();

    onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField[0]).toBe(thirdPokemon);
    expect(onField).not.toContain(firstPokemon);
    expect(onField).not.toContain(secondPokemon);
  });

  it("should reorder the party when going from single to double battle", async () => {
    await setupBattle("single");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const secondPokemon = party[1];
    const thirdPokemon = party[2];

    swapInParty(partyHandler, 0, 1);
    swapInParty(partyHandler, 0, 2);

    expect(game.scene.getPlayerParty()[0]).toBe(thirdPokemon);
    expect(game.scene.getPlayerParty()[2]).toBe(secondPokemon);

    let onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField).not.toContain(secondPokemon);
    expect(onField).not.toContain(thirdPokemon);

    game.override.battleStyle("double");

    await skipModifierSelect();

    onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField[0]).toBe(thirdPokemon);
    expect(onField[1]).toBe(firstPokemon);
    expect(onField).not.toContain(secondPokemon);
  });

  it("should reorder the party before a double battle against trainers", async () => {
    await setupBattle("double");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const secondPokemon = party[1];
    const thirdPokemon = party[2];
    const fourthPokemon = party[3];

    swapInParty(partyHandler, 0, 2);
    swapInParty(partyHandler, 1, 3);

    expect(game.scene.getPlayerParty()[0]).toBe(thirdPokemon);
    expect(game.scene.getPlayerParty()[1]).toBe(fourthPokemon);
    expect(game.scene.getPlayerParty()[2]).toBe(firstPokemon);
    expect(game.scene.getPlayerParty()[3]).toBe(secondPokemon);

    let onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField).not.toContain(thirdPokemon);
    expect(onField).not.toContain(fourthPokemon);

    game.override.battleType(BattleType.TRAINER).randomTrainer({ trainerType: TrainerType.TWINS });

    await skipModifierSelect();

    onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField[0]).toBe(thirdPokemon);
    expect(onField[1]).toBe(fourthPokemon);
  });
});
