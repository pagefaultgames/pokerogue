import { BerryPhase } from "#app/phases/berry-phase";
import { MessagePhase } from "#app/phases/message-phase";
import { MoveHeaderPhase } from "#app/phases/move-header-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .ability(Abilities.UNNERVE)
      .moveset([Moves.FOCUS_PUNCH])
      .enemySpecies(Species.GROUDON)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(SPLASH_ONLY)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it(
    "should deal damage at the end of turn if uninterrupted",
    async () => {
      await game.startBattle([Species.CHARIZARD]);

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
      expect(leadPokemon.turnData.damageDealt).toBe(enemyStartingHp - enemyPokemon.hp);
    }, TIMEOUT
  );

  it(
    "should fail if the user is hit",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));

      await game.startBattle([Species.CHARIZARD]);

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
      expect(leadPokemon.turnData.damageDealt).toBe(0);
    }, TIMEOUT
  );

  it(
    "should be cancelled if the user falls asleep mid-turn",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.SPORE));

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.FOCUS_PUNCH);

      await game.phaseInterceptor.to(MessagePhase); // Header message

      expect(leadPokemon.getMoveHistory().length).toBe(0);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getMoveHistory().length).toBe(1);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "should not queue its pre-move message before an enemy switches",
    async () => {
      /** Guarantee a Trainer battle with multiple enemy Pokemon */
      game.override.startingWave(25);

      await game.startBattle([Species.CHARIZARD]);

      game.forceEnemyToSwitch();
      game.move.select(Moves.FOCUS_PUNCH);

      await game.phaseInterceptor.to(TurnStartPhase);

      expect(game.scene.getCurrentPhase() instanceof SwitchSummonPhase).toBeTruthy();
      expect(game.scene.phaseQueue.find(phase => phase instanceof MoveHeaderPhase)).toBeDefined();
    }, TIMEOUT
  );
});
