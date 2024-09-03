import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, test } from "vitest";
import GameManager from "../utils/gameManager";
import { Stat } from "#enums/stat";
import { BerryPhase } from "#app/phases/berry-phase";
import { FaintPhase } from "#app/phases/faint-phase";
import { MessagePhase } from "#app/phases/message-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { SPLASH_ONLY } from "../utils/testUtils";

const TIMEOUT = 20 * 1000;

describe("Moves - Parting Shot", () => {
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
    game.override.battleType("single");
    game.override.moveset([Moves.PARTING_SHOT, Moves.SPLASH]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.startingLevel(5);
    game.override.enemyLevel(5);

  });

  test(
    "Parting Shot when buffed by prankster should fail against dark types",
    async () => {
      game.override
        .enemySpecies(Species.POOCHYENA)
        .ability(Abilities.PRANKSTER);
      await game.startBattle([Species.MURKROW, Species.MEOWTH]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.move.select(Moves.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MURKROW);
    }, TIMEOUT
  );

  test(
    "Parting shot should fail against good as gold ability",
    async () => {
      game.override
        .enemySpecies(Species.GHOLDENGO)
        .enemyAbility(Abilities.GOOD_AS_GOLD);
      await game.startBattle([Species.MURKROW, Species.MEOWTH]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.move.select(Moves.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MURKROW);
    }, TIMEOUT
  );

  it.skip( // TODO: fix this bug to pass the test!
    "Parting shot should fail if target is -6/-6 de-buffed",
    async () => {
      game.override.moveset([Moves.PARTING_SHOT, Moves.MEMENTO, Moves.SPLASH]);
      await game.startBattle([Species.MEOWTH, Species.MEOWTH, Species.MEOWTH, Species.MURKROW, Species.ABRA]);

      // use Memento 3 times to debuff enemy
      game.move.select(Moves.MEMENTO);
      await game.phaseInterceptor.to(FaintPhase);
      expect(game.scene.getParty()[0].isFainted()).toBe(true);
      game.doSelectPartyPokemon(1);

      await game.phaseInterceptor.to(TurnInitPhase, false);
      game.move.select(Moves.MEMENTO);
      await game.phaseInterceptor.to(FaintPhase);
      expect(game.scene.getParty()[0].isFainted()).toBe(true);
      game.doSelectPartyPokemon(2);

      await game.phaseInterceptor.to(TurnInitPhase, false);
      game.move.select(Moves.MEMENTO);
      await game.phaseInterceptor.to(FaintPhase);
      expect(game.scene.getParty()[0].isFainted()).toBe(true);
      game.doSelectPartyPokemon(3);

      // set up done
      await game.phaseInterceptor.to(TurnInitPhase, false);
      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-6);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-6);

      // now parting shot should fail
      game.move.select(Moves.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-6);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-6);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MURKROW);
    }, TIMEOUT
  );

  it.skip( // TODO: fix this bug to pass the test!
    "Parting shot shouldn't allow switch out when mist is active",
    async () => {
      game.override
        .enemySpecies(Species.ALTARIA)
        .enemyAbility(Abilities.NONE)
        .enemyMoveset(Array(4).fill(Moves.MIST));
      await game.startBattle([Species.SNORLAX, Species.MEOWTH]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.move.select(Moves.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MURKROW);
    }, TIMEOUT
  );

  it.skip( // TODO: fix this bug to pass the test!
    "Parting shot shouldn't allow switch out against clear body ability",
    async () => {
      game.override
        .enemySpecies(Species.TENTACOOL)
        .enemyAbility(Abilities.CLEAR_BODY);
      await game.startBattle([Species.SNORLAX, Species.MEOWTH]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.move.select(Moves.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MURKROW);
    }, TIMEOUT
  );

  it.skip( // TODO: fix this bug to pass the test!
    "Parting shot should de-buff and not fail if no party available to switch - party size 1",
    async () => {
      await game.startBattle([Species.MURKROW]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.move.select(Moves.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-1);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MURKROW);
    }, TIMEOUT
  );

  it.skip( // TODO: fix this bug to pass the test!
    "Parting shot regularly not fail if no party available to switch - party fainted",
    async () => {
      await game.startBattle([Species.MURKROW, Species.MEOWTH]);
      game.move.select(Moves.SPLASH);

      // intentionally kill party pokemon, switch to second slot (now 1 party mon is fainted)
      await game.killPokemon(game.scene.getParty()[0]);
      expect(game.scene.getParty()[0].isFainted()).toBe(true);
      await game.phaseInterceptor.run(MessagePhase);
      game.doSelectPartyPokemon(1);

      await game.phaseInterceptor.to(TurnInitPhase, false);
      game.move.select(Moves.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MEOWTH);
    }, TIMEOUT
  );
});
