import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import {StatusEffect} from "#enums/status-effect";
import {RageTag} from "#app/data/battler-tags";
import {PlayerPokemon} from "#app/field/pokemon";
import {Nature} from "#enums/nature";
import {CommandPhase} from "#app/phases/command-phase";
import {BattlerIndex} from "#app/battle";
import {TurnEndPhase} from "#app/phases/turn-end-phase";
import {Stat} from "#enums/stat";


const TIMEOUT = 20 * 1000;

function fullOf(move: Moves) : Moves[] {
  return [move, move, move, move];
}
describe("Moves - Rage", () => {
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
      .starterSpecies(Species.BOLTUND)
      .moveset([Moves.RAGE, Moves.SPLASH, Moves.SPORE, Moves.VITAL_THROW])
      .startingLevel(100)
      .enemyLevel(100)
      .disableCrits();
  });

  /**
   * Ally Attack-Boost Test.
   *
   * Checks that Rage provides an attack boost if the user it hit after use.
   *
   * Checks that Rage provides an attack boost if the user is hit before moving
   * on the following turn, regardless of what move they selected.
   *
   * Checks that a pokemon stops raging if they use a different move.
   */
  it(
    "should raise attack if hit after use",
    async () => {
      game.override
        .enemySpecies(Species.SHUCKLE)
        .enemyMoveset(fullOf(Moves.TACKLE));
      await game.classicMode.startBattle();

      const leadPokemon = game.scene.getPlayerPokemon()!;

      // Player Boltund uses Rage. Opponent Shuckle uses Tackle.
      // Boltund's attack is raised.
      game.move.select(Moves.RAGE);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(1);

      // Opponent Shuckle uses Tackle. Player Boltund uses Vital Throw (Negative Priority).
      // Boltund's attack is raised.
      game.move.select(Moves.VITAL_THROW);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);

      // Opponent Shuckle uses Tackle. Player Boltund uses Vital Throw (Negative Priority).
      // Boltund's attack not raised.
      game.move.select(Moves.VITAL_THROW);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);

    }, TIMEOUT
  );

  /**
   * Checks that Opponent Pokemon correctly receive the Attack boost from Rage
   * Checks that using a Status Move on a Pokemon that used Rage does NOT provide an Attack Boost
   * Checks that Pokemon do not lose the {@linkcode RageTag} BattlerTag when sleeping.
   */
  it(
    "should not raise ATK if hit by status move",
    async () => {
      game.override
        .enemySpecies(Species.SHUCKLE)
        .enemyMoveset(fullOf(Moves.RAGE));
      await game.classicMode.startBattle();

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const oppPokemon = game.scene.getEnemyPokemon()!;

      // Opponent Shuckle uses Rage. Ally Boltund uses Vital Throw.
      // Shuckle gets an Attack boost
      game.move.select(Moves.VITAL_THROW);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(oppPokemon.getStatStage(Stat.ATK)).toBe(1);

      // Ally Boltund uses Spore. Shuckle is asleep.
      // Shuckle does not get an attack boost. Shuckle still has the RageTag tag.
      game.move.select(Moves.SPORE);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(oppPokemon.getStatStage(Stat.ATK)).toBe(1);
      expect(oppPokemon.getTag(RageTag)).toBeTruthy;
    }, TIMEOUT
  );

  /**
   * Checks that the {@linkcode RageTag} tag is not given if the target is immune
   */
  it(
    "should not raise ATK if target is immune",
    async () => {
      game.override
        .enemySpecies(Species.GASTLY)
        .enemyMoveset(fullOf(Moves.TACKLE)); // Has semi-invulnerable turn
      await game.classicMode.startBattle();

      const leadPokemon = game.scene.getPlayerPokemon()!;

      // Boltund uses rage, but it has no effect, Gastly uses Tackle
      // Boltund does not have RageTag or Attack boost.
      game.move.select(Moves.RAGE);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon.getTag(RageTag)).toBeNull;
    }, TIMEOUT
  );

  /**
   * Checks that the {@linkcode RageTag} tag is not given if the target is semi-invulnerable
   * Checks that Pokémon does not get Attack boost if it uses Rage after getting hit on a turn
   */
  it(
    "should not raise ATK if target is semi-invulnerable",
    async () => {
      game.override
        .enemySpecies(Species.REGIELEKI)
        .enemyMoveset(fullOf(Moves.PHANTOM_FORCE)); // Has semi-invulnerable turn
      await game.classicMode.startBattle();

      const leadPokemon = game.scene.getPlayerPokemon()!;

      // Regieliki uses Fly. Boltund uses Rage, but Regieleki is invulnerable
      // Boltund does not gain RageTag or Attack boost
      game.move.select(Moves.RAGE);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon.getTag(RageTag)).toBeNull;

      // Regieleki finishes Fly, Boltund uses Rage
      // Boltund gains RageTag, but no boost
      game.move.select(Moves.RAGE);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon.getTag(RageTag)).toBeTruthy;
    }, TIMEOUT
  );

  it(
    "should not stop raging if rage fails",
    async () => {
      game.override
        .enemySpecies(Species.SHUCKLE)
        .enemyMoveset(fullOf(Moves.PHANTOM_FORCE)); // Has semi-invulnerable turn
      await game.classicMode.startBattle();

      const leadPokemon = game.scene.getPlayerPokemon()!;

      // Boltund uses Rage, Shuckle uses Fly
      // Boltund gains RageTag
      game.move.select(Moves.RAGE);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon.getTag(RageTag)).toBeTruthy;

      // Boltund uses Rage, Shuckle is underwater, Shuckle finishes Dive
      // Boltund gains gains boost, does not lose RageTag
      game.move.select(Moves.RAGE);
      await game.toNextTurn();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(1);
      expect(leadPokemon.getTag(RageTag)).toBeTruthy;
    }, TIMEOUT
  );

  /**
   * Basic doubles test
   * Checks that if a raging Pokemon is hit multiple times in one turn, they get multiple boosts
   * Should also cover multi-hit moves
   */
  it(
    "should provide boost per hit in doubles",
    async () => {
      game.override
        .moveset([Moves.RAGE, Moves.MEMENTO, Moves.SPORE, Moves.VITAL_THROW])
        .battleType("double")
        .enemySpecies(Species.SHUCKLE)
        .enemyMoveset(fullOf(Moves.TACKLE));
      await game.classicMode.startBattle([Species.BOLTUND, Species.BOLTUND]);

      const leadPokemon = game.scene.getParty()[0];

      game.move.select(Moves.RAGE, 1, BattlerIndex.ENEMY);
      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.MEMENTO, 1, BattlerIndex.ENEMY_2);


      await game.phaseInterceptor.to(TurnEndPhase, false);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
      expect(leadPokemon.getTag(RageTag)).toBeTruthy;
    }, TIMEOUT
  );

  /**
   * Checks that a pokemon does not lose the RageTag if it is unable to act
   * regardless of what it was otherwise going to do
   */
  it(
    "should stay raging if unable to act",
    async () => {
      game.override
        .moveset([Moves.RAGE, Moves.SPLASH, Moves.SPORE, Moves.VITAL_THROW])
        .battleType("double")
        .enemySpecies(Species.SHUCKLE)
        .enemyMoveset(fullOf(Moves.SPLASH)); // Has semi-invulnerable turn
      await game.classicMode.startBattle();

      const leadPokemon: PlayerPokemon = game.scene.getParty()[0];
      // Ensure that second pokemon is faster.
      leadPokemon.natureOverride = Nature.SASSY;
      game.scene.getParty()[1].natureOverride = Nature.JOLLY;

      game.move.select(Moves.RAGE, 1, BattlerIndex.ENEMY);
      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPORE, 1, BattlerIndex.PLAYER);

      await game.phaseInterceptor.to(TurnEndPhase, false);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon.getTag(RageTag)).toBeTruthy;
      expect(leadPokemon.status?.effect).toBe(StatusEffect.SLEEP);
    }, TIMEOUT
  );
});
