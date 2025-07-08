import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { Stat, EFFECTIVE_STATS } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";

// TODO: Add more tests once Transform is fully implemented
describe("Moves - Transform", () => {
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
      .enemySpecies(SpeciesId.MEW)
      .enemyLevel(200)
      .enemyAbility(AbilityId.BEAST_BOOST)
      .enemyPassiveAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.INTIMIDATE)
      .moveset([MoveId.TRANSFORM]);
  });

  it("should copy species, ability, gender, all stats except HP, all stat stages, moveset, and types of target", async () => {
    await game.classicMode.startBattle([SpeciesId.DITTO]);

    game.move.select(MoveId.TRANSFORM);
    await game.phaseInterceptor.to(TurnEndPhase);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
    expect(player.getAbility()).toBe(enemy.getAbility());
    expect(player.getGender()).toBe(enemy.getGender());

    // copies all stats except hp
    expect(player.getStat(Stat.HP, false)).not.toBe(enemy.getStat(Stat.HP));
    for (const s of EFFECTIVE_STATS) {
      expect(player.getStat(s, false)).toBe(enemy.getStat(s, false));
    }

    expect(player.getStatStages()).toEqual(enemy.getStatStages());

    // move IDs are equal
    expect(player.getMoveset().map(m => m.moveId)).toEqual(enemy.getMoveset().map(m => m.moveId));

    expect(player.getTypes()).toEqual(enemy.getTypes());
  });

  it("should copy in-battle overridden stats", async () => {
    game.override.enemyMoveset([MoveId.POWER_SPLIT]);

    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const avgAtk = Math.floor((player.getStat(Stat.ATK, false) + enemy.getStat(Stat.ATK, false)) / 2);
    const avgSpAtk = Math.floor((player.getStat(Stat.SPATK, false) + enemy.getStat(Stat.SPATK, false)) / 2);

    game.move.select(MoveId.TRANSFORM);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(avgAtk);
    expect(enemy.getStat(Stat.ATK, false)).toBe(avgAtk);

    expect(player.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
    expect(enemy.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
  });

  it("should set each move's pp to a maximum of 5", async () => {
    game.override.enemyMoveset([MoveId.SWORDS_DANCE, MoveId.GROWL, MoveId.SKETCH, MoveId.RECOVER]);

    await game.classicMode.startBattle([SpeciesId.DITTO]);
    const player = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.TRANSFORM);
    await game.phaseInterceptor.to(TurnEndPhase);

    player.getMoveset().forEach(move => {
      // Should set correct maximum PP without touching `ppUp`
      if (move) {
        if (move.moveId === MoveId.SKETCH) {
          expect(move.getMovePp()).toBe(1);
        } else {
          expect(move.getMovePp()).toBe(5);
        }
        expect(move.ppUp).toBe(0);
      }
    });
  });

  it("should activate its ability if it copies one that activates on summon", async () => {
    game.override.enemyAbility(AbilityId.INTIMIDATE).ability(AbilityId.BALL_FETCH);

    await game.classicMode.startBattle([SpeciesId.DITTO]);
    game.move.select(MoveId.TRANSFORM);

    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should persist transformed attributes across reloads", async () => {
    game.override.enemyMoveset([]).moveset([]);

    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.changeMoveset(player, MoveId.TRANSFORM);
    game.move.changeMoveset(enemy, MoveId.MEMENTO);

    game.move.select(MoveId.TRANSFORM);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextWave();

    expect(game.scene.phaseManager.getCurrentPhase()?.constructor.name).toBe("CommandPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(2);

    await game.reload.reloadSession();

    const playerReloaded = game.scene.getPlayerPokemon()!;
    const playerMoveset = player.getMoveset();

    expect(playerReloaded.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
    expect(playerReloaded.getAbility()).toBe(enemy.getAbility());
    expect(playerReloaded.getGender()).toBe(enemy.getGender());

    expect(playerReloaded.getStat(Stat.HP, false)).not.toBe(enemy.getStat(Stat.HP));
    for (const s of EFFECTIVE_STATS) {
      expect(playerReloaded.getStat(s, false)).toBe(enemy.getStat(s, false));
    }

    expect(playerMoveset.length).toEqual(1);
    expect(playerMoveset[0]?.moveId).toEqual(MoveId.MEMENTO);
  });

  it("should stay transformed with the correct form after reload", async () => {
    game.override.enemyMoveset([]).moveset([]).enemySpecies(SpeciesId.DARMANITAN);

    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    // change form
    enemy.species.forms[1];
    enemy.species.formIndex = 1;

    game.move.changeMoveset(player, MoveId.TRANSFORM);
    game.move.changeMoveset(enemy, MoveId.MEMENTO);

    game.move.select(MoveId.TRANSFORM);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextWave();

    expect(game.scene.phaseManager.getCurrentPhase()?.constructor.name).toBe("CommandPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(2);

    await game.reload.reloadSession();

    const playerReloaded = game.scene.getPlayerPokemon()!;

    expect(playerReloaded.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
    expect(playerReloaded.getSpeciesForm().formIndex).toBe(enemy.getSpeciesForm().formIndex);
  });
});
