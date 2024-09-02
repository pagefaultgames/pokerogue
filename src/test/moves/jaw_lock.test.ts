import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BerryPhase } from "#app/phases/berry-phase";
import { FaintPhase } from "#app/phases/faint-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import GameManager from "#app/test/utils/gameManager";
import { SPLASH_ONLY } from "#app/test/utils/testUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Jaw Lock", () => {
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
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(SPLASH_ONLY)
      .moveset([Moves.JAW_LOCK, Moves.SPLASH])
      .startingLevel(100)
      .enemyLevel(100)
      .disableCrits();
  });

  it(
    "should trap the move's user and target",
    async () => {
      await game.startBattle([Species.BULBASAUR]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.JAW_LOCK);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to(MoveEffectPhase, false);

      expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();
    }, TIMEOUT
  );

  it(
    "should not trap either pokemon if the target faints",
    async () => {
      game.override.enemyLevel(1);
      await game.startBattle([Species.BULBASAUR]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.JAW_LOCK);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to(MoveEffectPhase, false);

      expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();

      await game.phaseInterceptor.to(FaintPhase);

      expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    }, TIMEOUT
  );

  it(
    "should only trap the user until the target faints",
    async () => {
      await game.startBattle([Species.BULBASAUR]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.JAW_LOCK);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();

      await game.phaseInterceptor.to(TurnEndPhase);

      await game.doKillOpponents();

      expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    }, TIMEOUT
  );

  it(
    "should not trap other targets after the first target is trapped",
    async () => {
      game.override.battleType("double");

      await game.startBattle([Species.CHARMANDER, Species.BULBASAUR]);

      const playerPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.JAW_LOCK, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SPLASH, 1);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(playerPokemon[0].getTag(BattlerTagType.TRAPPED)).toBeDefined();
      expect(enemyPokemon[0].getTag(BattlerTagType.TRAPPED)).toBeDefined();

      await game.toNextTurn();

      game.move.select(Moves.JAW_LOCK, 0, BattlerIndex.ENEMY_2);
      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(enemyPokemon[1].getTag(BattlerTagType.TRAPPED)).toBeUndefined();
      expect(playerPokemon[0].getTag(BattlerTagType.TRAPPED)).toBeDefined();
      expect(playerPokemon[0].getTag(BattlerTagType.TRAPPED)?.sourceId).toBe(enemyPokemon[0].id);
    }, TIMEOUT
  );

  it(
    "should not trap either pokemon if the target is protected",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.PROTECT));

      await game.startBattle([Species.BULBASAUR]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.JAW_LOCK);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(playerPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    }, TIMEOUT
  );
});
