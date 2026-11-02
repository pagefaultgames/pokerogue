import { getPokemonNameWithAffix } from "#app/messages";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import { Button } from "#enums/buttons";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PartyUiMode } from "#enums/party-ui-mode";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/framework/game-manager";
import type { PhaseString } from "#types/phase-types";
import type { ConfirmUiHandler } from "#ui/confirm-ui-handler";
import type { PartyUiHandler } from "#ui/party-ui-handler";
import type { RewardSelectUiHandler } from "#ui/reward-select-ui-handler";
import i18next from "i18next";
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
   * and we immediately jump to the reward select phase.
   */
  async function setupBattle(battleStyle: "single" | "double") {
    game.override
      .startingLevel(200)
      .enemySpecies(SpeciesId.MAGIKARP)
      .battleStyle(battleStyle)
      .battleType(BattleType.WILD);

    await game.classicMode.startBattle(SpeciesId.ABRA, SpeciesId.VOLCARONA, SpeciesId.RAYQUAZA, SpeciesId.MAGCARGO);
    game.move.use(MoveId.SPLASH);
    if (battleStyle === "double") {
      game.move.use(MoveId.SPLASH);
    }
    await game.doKillOpponents();
    await game.phaseInterceptor.to("SelectRewardPhase");
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
   * Helper function to skip reward select and go to the next wave.
   * Party reordering will happen during this function.
   * @param target - The phase to stop at; default `TurnInitPhase`
   * @param runTarget - Whether to run the target phase; default `true`
   */
  async function skipRewardSelect(target: PhaseString = "TurnInitPhase", runTarget = true) {
    await game.scene.ui.setMode(UiMode.REWARD_SELECT);
    const msHandler = game.scene.ui.getHandler() as RewardSelectUiHandler;
    msHandler.processInput(Button.CANCEL);
    msHandler.processInput(Button.ACTION);
    const confirmHandler = game.scene.ui.getHandler() as ConfirmUiHandler;
    confirmHandler.processInput(Button.ACTION);

    await game.phaseInterceptor.to(target, runTarget);
  }

  /**
   * Helper function to count how many times the "come back" message was shown for a pokémon.
   */
  function countRecallMessages(pokemon: Pokemon): number {
    const message = i18next.t("battle:playerComeBack", { pokemonName: getPokemonNameWithAffix(pokemon) });
    return game.textInterceptor.logs.filter(log => log === message).length;
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

    await skipRewardSelect();

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

    await skipRewardSelect();

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

    await skipRewardSelect();

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

    await skipRewardSelect();

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

    await skipRewardSelect();

    onField = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
    expect(onField[0]).toBe(thirdPokemon);
    expect(onField[1]).toBe(fourthPokemon);
  });

  it("should not trigger a game over when only one pokémon can battle in a double battle", async () => {
    game.override
      .startingLevel(200)
      .enemySpecies(SpeciesId.MAGIKARP)
      .battleStyle("even-doubles")
      .battleType(BattleType.WILD);
    await game.classicMode.startBattle(SpeciesId.MANKEY, SpeciesId.ABRA, SpeciesId.VOLCARONA);
    const [mankey, abra, volcarona] = game.scene.getPlayerParty();
    abra.hp = 0;
    volcarona.hp = 0;

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(game.scene.currentBattle.double, "Expected a double battle on wave 2").toBe(true);
    expect(game).toBeAtPhase("CommandPhase");
    expect(game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField())).toEqual([mankey]);
  });

  it("should allow swapping two benched pokémon while Fairy Lock is active", async () => {
    await setupBattle("single");
    game.scene.arena.addTag(
      ArenaTagType.FAIRY_LOCK,
      2,
      MoveId.FAIRY_LOCK,
      game.field.getPlayerPokemon().id,
      ArenaTagSide.BOTH,
    );

    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const [, , thirdPokemon, fourthPokemon] = game.scene.getPlayerParty();

    swapInParty(partyHandler, 2, 3);

    expect(game.scene.getPlayerParty()[2]).toBe(fourthPokemon);
    expect(game.scene.getPlayerParty()[3]).toBe(thirdPokemon);
  });

  it.each([
    { battleStyle: "single", trainerType: TrainerType.YOUNGSTER },
    { battleStyle: "double", trainerType: TrainerType.TWINS },
  ] as const)(
    "should only recall each pokémon once before a $battleStyle trainer battle",
    async ({ battleStyle, trainerType }) => {
      await setupBattle(battleStyle);
      const recalledPokemon = game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField());
      expect(recalledPokemon).toHaveLength(battleStyle === "double" ? 2 : 1);

      game.override.battleType(BattleType.TRAINER).randomTrainer({ trainerType });
      game.textInterceptor.clearLogs();

      game.doSelectReward();
      await game.phaseInterceptor.to("TurnInitPhase");

      for (const pokemon of recalledPokemon) {
        expect(countRecallMessages(pokemon)).toBe(1);
      }
    },
  );

  it("should recall all pokémon instead of reordering them before the classic final boss", async () => {
    game.override.startingWave(199);
    await setupBattle("single");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const thirdPokemon = party[2];

    swapInParty(partyHandler, 0, 2);
    game.textInterceptor.clearLogs();

    await skipRewardSelect("NextEncounterPhase", false);

    // The new lead should only be sent out by the encounter itself, not before it
    expect(game.scene.currentBattle.isClassicFinalBoss, "Expected classic final boss on wave 200").toBe(true);
    expect(game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField())).not.toContain(thirdPokemon);
    expect(firstPokemon.isOnField()).toBe(false);
    expect(countRecallMessages(firstPokemon)).toBe(1);
  });

  it("should send out both pokémon during the encounter when entering a new biome in a double battle", async () => {
    game.override
      .startingWave(10)
      .startingLevel(200)
      .enemySpecies(SpeciesId.MAGIKARP)
      .battleStyle("single")
      .battleType(BattleType.WILD);
    await game.classicMode.startBattle(SpeciesId.ABRA, SpeciesId.VOLCARONA, SpeciesId.RAYQUAZA);
    const [firstPokemon, secondPokemon] = game.scene.getPlayerParty();

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    game.override.battleStyle("double");
    game.textInterceptor.clearLogs();

    await game.phaseInterceptor.to("NewBiomeEncounterPhase", false);

    // Both pokémon should be sent out by the encounter, after the trainer reappears
    expect(game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField())).toHaveLength(0);
    expect(countRecallMessages(firstPokemon)).toBe(1);

    await game.phaseInterceptor.to("TurnInitPhase");

    expect(game.scene.getPlayerField()).toEqual([firstPokemon, secondPokemon]);
    for (const pokemon of [firstPokemon, secondPokemon]) {
      expect(game.textInterceptor.logs).toContain(
        i18next.t("battle:playerGo", { pokemonName: getPokemonNameWithAffix(pokemon) }),
      );
    }
  });

  it("should recall all pokémon instead of reordering them when entering a new biome after a reward screen", async () => {
    game.override
      .startingWave(10)
      .startingLevel(200)
      .enemySpecies(SpeciesId.MAGIKARP)
      .battleStyle("single")
      .battleType(BattleType.WILD);
    // "No Heal" replaces the party heal before x1 waves with a reward screen
    game.challengeMode.addChallenge(Challenges.LIMITED_SUPPORT, 1, 1);
    await game.challengeMode.startBattle(SpeciesId.ABRA, SpeciesId.VOLCARONA, SpeciesId.RAYQUAZA);

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("SelectRewardPhase");

    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK);
    const partyHandler = game.scene.ui.getHandler() as PartyUiHandler;
    const party = game.scene.getPlayerParty();
    const firstPokemon = party[0];
    const thirdPokemon = party[2];

    swapInParty(partyHandler, 0, 2);
    game.textInterceptor.clearLogs();

    await skipRewardSelect("NewBiomeEncounterPhase", false);

    // The new lead should only be sent out by the encounter, after the trainer reappears
    expect(game.scene.getPlayerParty().filter(pokemon => pokemon.isOnField())).toHaveLength(0);
    expect(countRecallMessages(firstPokemon)).toBe(1);

    await game.phaseInterceptor.to("TurnInitPhase");

    expect(game.scene.getPlayerField()).toEqual([thirdPokemon]);
    expect(countRecallMessages(firstPokemon)).toBe(1);
  });
});
