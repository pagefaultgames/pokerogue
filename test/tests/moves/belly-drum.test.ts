import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { getStatKey, Stat } from "#enums/stat";
import type { StatStageChangePhase } from "#phases/stat-stage-change-phase";
import { GameManager } from "#test/framework/game-manager";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - BELLY DRUM", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .startingLevel(100)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  // Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Belly_Drum_(move)

  it("should set the user's ATK stat stage to its maximum, at the cost of 1/2 of its maximum HP", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    player.setStatStage(Stat.ATK, -6);

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.BELLY_DRUM, result: MoveResult.SUCCESS });
    expect(player).toHaveTakenDamage(player.getMaxHp() / 2);
    expect(player).toHaveStatStage(Stat.ATK, 6);
  });

  // TODO: Do we need this test? it seems redundant (the same could be said of any stat raising move)
  it("should still take effect if an uninvolved stat stage is at max", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    player.setStatStage(Stat.SPATK, 6);

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.BELLY_DRUM, result: MoveResult.SUCCESS });
    expect(player).toHaveStatStage(Stat.ATK, 6);
    expect(player).toHaveStatStage(Stat.SPATK, 6);
  });

  it("should fail if the pokemon's ATK stat stage is at its maximum", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    player.setStatStage(Stat.ATK, 6);

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    // TODO: This doesn't actually count as failed due to incorrect failure propagation
    // expect(player).toHaveUsedMove({ move: MoveId.BELLY_DRUM, result: MoveResult.FAIL });
    expect(player).toHaveFullHp();
    expect(player).toHaveStatStage(Stat.ATK, 6);
  });

  it("should fail if the user's health is insufficient", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    player.hp = toDmgValue(player.getMaxHp() / 2) - 1;

    game.move.use(MoveId.BELLY_DRUM);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.BELLY_DRUM, result: MoveResult.FAIL });
    expect(player).toHaveStatStage(Stat.ATK, 0);
  });

  it("should override the default stat change message with a custom one", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    game.move.use(MoveId.BELLY_DRUM);
    await game.phaseInterceptor.to("StatStageChangePhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as StatStageChangePhase;
    expect(game).toBeAtPhase("StatStageChangePhase");
    const defaultMessageSpy = vi.spyOn(
      phase as unknown as { buildStatStageChangeMessage: StatStageChangePhase["buildStatStageChangeMessage"] },
      "buildStatStageChangeMessage",
    );

    await game.toEndOfTurn();

    expect(game).toHaveShownMessage(
      i18next.t("moveTriggers:cutOwnHpAndMaximizedStat", {
        pokemonName: getPokemonNameWithAffix(player),
        statName: i18next.t(getStatKey(Stat.ATK)),
      }),
    );
    expect(defaultMessageSpy).not.toHaveBeenCalled();
  });

  // TODO: Should this test go here or in contrary.test.ts?
  // TODO: Confirm mainline behaviour
  it.todo("should still fail at max HP if the user has Contrary");
});
