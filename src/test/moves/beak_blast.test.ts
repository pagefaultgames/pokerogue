import { BattlerTagType } from "#app/enums/battler-tag-type";
import { StatusEffect } from "#app/enums/status-effect";
import { BerryPhase } from "#app/phases/berry-phase";
import { MovePhase } from "#app/phases/move-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Beak Blast", () => {
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
      .moveset([Moves.BEAK_BLAST])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Array(4).fill(Moves.TACKLE))
      .startingLevel(100)
      .enemyLevel(100);
  });

  it(
    "should add a charge effect that burns attackers on contact",
    async () => {
      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.BEAK_BLAST);

      await game.phaseInterceptor.to(MovePhase, false);
      expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeDefined();

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.status?.effect).toBe(StatusEffect.BURN);
    }, TIMEOUT
  );

  it(
    "should still charge and burn opponents if the user is sleeping",
    async () => {
      game.override.statusEffect(StatusEffect.SLEEP);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.BEAK_BLAST);

      await game.phaseInterceptor.to(MovePhase, false);
      expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeDefined();

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.status?.effect).toBe(StatusEffect.BURN);
    }, TIMEOUT
  );

  it(
    "should not burn attackers that don't make contact",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.WATER_GUN));

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.BEAK_BLAST);

      await game.phaseInterceptor.to(MovePhase, false);
      expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeDefined();

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.status?.effect).not.toBe(StatusEffect.BURN);
    }, TIMEOUT
  );

  it(
    "should only hit twice with Multi-Lens",
    async () => {
      game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.BEAK_BLAST);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(leadPokemon.turnData.hitCount).toBe(2);
    }, TIMEOUT
  );

  it(
    "should be blocked by Protect",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.PROTECT));

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.BEAK_BLAST);

      await game.phaseInterceptor.to(MovePhase, false);
      expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeDefined();

      await game.phaseInterceptor.to(TurnEndPhase);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
      expect(leadPokemon.getTag(BattlerTagType.BEAK_BLAST_CHARGING)).toBeUndefined();
    }, TIMEOUT
  );
});
