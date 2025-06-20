import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, test } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { Stat } from "#enums/stat";
import { BerryPhase } from "#app/phases/berry-phase";
import { FaintPhase } from "#app/phases/faint-phase";
import { MessagePhase } from "#app/phases/message-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";

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
    game.override
      .battleStyle("single")
      .moveset([MoveId.PARTING_SHOT, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(5)
      .enemyLevel(5);
  });

  test("Parting Shot when buffed by prankster should fail against dark types", async () => {
    game.override.enemySpecies(SpeciesId.POOCHYENA).ability(AbilityId.PRANKSTER);
    await game.classicMode.startBattle([SpeciesId.MURKROW, SpeciesId.MEOWTH]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon).toBeDefined();

    game.move.select(MoveId.PARTING_SHOT);

    await game.phaseInterceptor.to(BerryPhase, false);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
    expect(game.scene.getPlayerField()[0].species.speciesId).toBe(SpeciesId.MURKROW);
  });

  test("Parting shot should fail against good as gold ability", async () => {
    game.override.enemySpecies(SpeciesId.GHOLDENGO).enemyAbility(AbilityId.GOOD_AS_GOLD);
    await game.classicMode.startBattle([SpeciesId.MURKROW, SpeciesId.MEOWTH]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon).toBeDefined();

    game.move.select(MoveId.PARTING_SHOT);

    await game.phaseInterceptor.to(BerryPhase, false);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
    expect(game.scene.getPlayerField()[0].species.speciesId).toBe(SpeciesId.MURKROW);
  });

  it.todo(
    // TODO: fix this bug to pass the test!
    "Parting shot should fail if target is -6/-6 de-buffed",
    async () => {
      game.override.moveset([MoveId.PARTING_SHOT, MoveId.MEMENTO, MoveId.SPLASH]);
      await game.classicMode.startBattle([
        SpeciesId.MEOWTH,
        SpeciesId.MEOWTH,
        SpeciesId.MEOWTH,
        SpeciesId.MURKROW,
        SpeciesId.ABRA,
      ]);

      // use Memento 3 times to debuff enemy
      game.move.select(MoveId.MEMENTO);
      await game.phaseInterceptor.to(FaintPhase);
      expect(game.scene.getPlayerParty()[0].isFainted()).toBe(true);
      game.doSelectPartyPokemon(1);

      await game.phaseInterceptor.to(TurnInitPhase, false);
      game.move.select(MoveId.MEMENTO);
      await game.phaseInterceptor.to(FaintPhase);
      expect(game.scene.getPlayerParty()[0].isFainted()).toBe(true);
      game.doSelectPartyPokemon(2);

      await game.phaseInterceptor.to(TurnInitPhase, false);
      game.move.select(MoveId.MEMENTO);
      await game.phaseInterceptor.to(FaintPhase);
      expect(game.scene.getPlayerParty()[0].isFainted()).toBe(true);
      game.doSelectPartyPokemon(3);

      // set up done
      await game.phaseInterceptor.to(TurnInitPhase, false);
      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-6);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-6);

      // now parting shot should fail
      game.move.select(MoveId.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-6);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-6);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(SpeciesId.MURKROW);
    },
  );

  it.todo(
    // TODO: fix this bug to pass the test!
    "Parting shot shouldn't allow switch out when mist is active",
    async () => {
      game.override.enemySpecies(SpeciesId.ALTARIA).enemyAbility(AbilityId.NONE).enemyMoveset([MoveId.MIST]);
      await game.classicMode.startBattle([SpeciesId.SNORLAX, SpeciesId.MEOWTH]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.move.select(MoveId.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(SpeciesId.MURKROW);
    },
  );

  it.todo(
    // TODO: fix this bug to pass the test!
    "Parting shot shouldn't allow switch out against clear body ability",
    async () => {
      game.override.enemySpecies(SpeciesId.TENTACOOL).enemyAbility(AbilityId.CLEAR_BODY);
      await game.classicMode.startBattle([SpeciesId.SNORLAX, SpeciesId.MEOWTH]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.move.select(MoveId.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(SpeciesId.MURKROW);
    },
  );

  it.todo(
    // TODO: fix this bug to pass the test!
    "Parting shot should de-buff and not fail if no party available to switch - party size 1",
    async () => {
      await game.classicMode.startBattle([SpeciesId.MURKROW]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();

      game.move.select(MoveId.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-1);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(SpeciesId.MURKROW);
    },
  );

  it.todo(
    // TODO: fix this bug to pass the test!
    "Parting shot regularly not fail if no party available to switch - party fainted",
    async () => {
      await game.classicMode.startBattle([SpeciesId.MURKROW, SpeciesId.MEOWTH]);
      game.move.select(MoveId.SPLASH);

      // intentionally kill party pokemon, switch to second slot (now 1 party mon is fainted)
      await game.killPokemon(game.scene.getPlayerParty()[0]);
      expect(game.scene.getPlayerParty()[0].isFainted()).toBe(true);
      await game.phaseInterceptor.run(MessagePhase);
      game.doSelectPartyPokemon(1);

      await game.phaseInterceptor.to(TurnInitPhase, false);
      game.move.select(MoveId.PARTING_SHOT);

      await game.phaseInterceptor.to(BerryPhase, false);
      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(SpeciesId.MEOWTH);
    },
  );
});
