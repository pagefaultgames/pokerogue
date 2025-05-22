import { BerryPhase } from "#app/phases/berry-phase";
import { MessagePhase } from "#app/phases/message-phase";
import { MoveHeaderPhase } from "#app/phases/move-header-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .ability(Abilities.UNNERVE)
      .moveset([Moves.FOCUS_PUNCH])
      .enemySpecies(Species.GROUDON)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should deal damage at the end of turn if uninterrupted", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    const enemyStartingHp = enemyPokemon.hp;

    game.move.select(Moves.FOCUS_PUNCH);

    await game.phaseInterceptor.to(MessagePhase);

    expect(enemyPokemon.hp).toBe(enemyStartingHp);
    expect(leadPokemon.getMoveHistory().length).toBe(0);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    expect(leadPokemon.getMoveHistory().length).toBe(1);
    expect(leadPokemon.turnData.totalDamageDealt).toBe(enemyStartingHp - enemyPokemon.hp);
  });

  it("should fail if the user is hit", async () => {
    game.override.enemyMoveset([Moves.TACKLE]);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    const enemyStartingHp = enemyPokemon.hp;

    game.move.select(Moves.FOCUS_PUNCH);

    await game.phaseInterceptor.to(MessagePhase);

    expect(enemyPokemon.hp).toBe(enemyStartingHp);
    expect(leadPokemon.getMoveHistory().length).toBe(0);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(enemyPokemon.hp).toBe(enemyStartingHp);
    expect(leadPokemon.getMoveHistory().length).toBe(1);
    expect(leadPokemon.turnData.totalDamageDealt).toBe(0);
  });

  it("should be cancelled if the user falls asleep mid-turn", async () => {
    game.override.enemyMoveset([Moves.SPORE]);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FOCUS_PUNCH);

    await game.phaseInterceptor.to(MessagePhase); // Header message

    expect(leadPokemon.getMoveHistory().length).toBe(0);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(leadPokemon.getMoveHistory().length).toBe(1);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });

  it("should not queue its pre-move message before an enemy switches", async () => {
    /** Guarantee a Trainer battle with multiple enemy Pokemon */
    game.override.startingWave(25);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    game.forceEnemyToSwitch();
    game.move.select(Moves.FOCUS_PUNCH);

    await game.phaseInterceptor.to(TurnStartPhase);

    expect(game.scene.getCurrentPhase() instanceof SwitchSummonPhase).toBeTruthy();
    expect(game.scene.phaseQueue.find(phase => phase instanceof MoveHeaderPhase)).toBeDefined();
  });
  it("should replace the 'but it failed' text when the user gets hit", async () => {
    game.override.enemyMoveset([Moves.TACKLE]);
    await game.classicMode.startBattle([Species.CHARIZARD]);

    game.move.select(Moves.FOCUS_PUNCH);
    await game.phaseInterceptor.to("MoveEndPhase", true);
    await game.phaseInterceptor.to("MessagePhase", false);
    const consoleSpy = vi.spyOn(console, "log");
    await game.phaseInterceptor.to("MoveEndPhase", true);
    expect(consoleSpy).nthCalledWith(1, i18next.t("moveTriggers:lostFocus", { pokemonName: "Charizard" }));
  });
});
