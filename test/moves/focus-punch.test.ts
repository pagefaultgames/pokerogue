import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { BerryPhase } from "#phases/berry-phase";
import { MessagePhase } from "#phases/message-phase";
import { MoveHeaderPhase } from "#phases/move-header-phase";
import { SwitchSummonPhase } from "#phases/switch-summon-phase";
import { TurnStartPhase } from "#phases/turn-start-phase";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Focus Punch", () => {
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
      .ability(AbilityId.UNNERVE)
      .moveset([MoveId.FOCUS_PUNCH])
      .enemySpecies(SpeciesId.GROUDON)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should deal damage at the end of turn if uninterrupted", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    const enemyStartingHp = enemyPokemon.hp;

    game.move.select(MoveId.FOCUS_PUNCH);

    await game.phaseInterceptor.to(MessagePhase);

    expect(enemyPokemon.hp).toBe(enemyStartingHp);
    expect(leadPokemon.getMoveHistory().length).toBe(0);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    expect(leadPokemon.getMoveHistory().length).toBe(1);
    expect(leadPokemon.turnData.totalDamageDealt).toBe(enemyStartingHp - enemyPokemon.hp);
  });

  it("should fail if the user is hit", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    const enemyStartingHp = enemyPokemon.hp;

    game.move.select(MoveId.FOCUS_PUNCH);

    await game.phaseInterceptor.to(MessagePhase);

    expect(enemyPokemon.hp).toBe(enemyStartingHp);
    expect(leadPokemon.getMoveHistory().length).toBe(0);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(enemyPokemon.hp).toBe(enemyStartingHp);
    expect(leadPokemon.getMoveHistory().length).toBe(1);
    expect(leadPokemon.turnData.totalDamageDealt).toBe(0);
  });

  it("should be cancelled if the user falls asleep mid-turn", async () => {
    game.override.enemyMoveset([MoveId.SPORE]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.FOCUS_PUNCH);

    await game.phaseInterceptor.to(MessagePhase); // Header message

    expect(leadPokemon.getMoveHistory().length).toBe(0);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(leadPokemon.getMoveHistory().length).toBe(1);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });

  it("should not queue its pre-move message before an enemy switches", async () => {
    /** Guarantee a Trainer battle with multiple enemy Pokemon */
    game.override.startingWave(25);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    game.forceEnemyToSwitch();
    game.move.select(MoveId.FOCUS_PUNCH);

    await game.phaseInterceptor.to(TurnStartPhase);

    expect(game.scene.phaseManager.getCurrentPhase() instanceof SwitchSummonPhase).toBeTruthy();
    expect(game.scene.phaseManager.phaseQueue.find(phase => phase instanceof MoveHeaderPhase)).toBeDefined();
  });
  it("should replace the 'but it failed' text when the user gets hit", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    game.move.select(MoveId.FOCUS_PUNCH);
    await game.phaseInterceptor.to("MoveEndPhase", true);
    await game.phaseInterceptor.to("MessagePhase", false);
    await game.phaseInterceptor.to("MoveEndPhase", true);
    expect(game.textInterceptor.logs).toContain(i18next.t("moveTriggers:lostFocus", { pokemonName: "Charizard" }));
    expect(game.textInterceptor.logs).not.toContain(i18next.t("battle:attackFailed"));
  });
});
