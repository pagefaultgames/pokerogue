import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Stat, BATTLE_STATS, EFFECTIVE_STATS } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { BattlerIndex } from "#app/battle";

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
      .enemySpecies(Species.MEW)
      .enemyLevel(200)
      .enemyAbility(Abilities.BEAST_BOOST)
      .enemyPassiveAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .ability(Abilities.INTIMIDATE)
      .moveset([Moves.TRANSFORM]);
  });

  it("should copy species, ability, gender, all stats except HP, all stat stages, moveset, and types of target", async () => {
    await game.classicMode.startBattle([Species.DITTO]);

    game.move.select(Moves.TRANSFORM);
    await game.phaseInterceptor.to(TurnEndPhase);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
    expect(player.getAbility()).toBe(enemy.getAbility());
    expect(player.getGender()).toBe(enemy.getGender());

    expect(player.getStat(Stat.HP, false)).not.toBe(enemy.getStat(Stat.HP));
    for (const s of EFFECTIVE_STATS) {
      expect(player.getStat(s, false)).toBe(enemy.getStat(s, false));
    }

    for (const s of BATTLE_STATS) {
      expect(player.getStatStage(s)).toBe(enemy.getStatStage(s));
    }

    const playerMoveset = player.getMoveset();
    const enemyMoveset = enemy.getMoveset();

    expect(playerMoveset.length).toBe(enemyMoveset.length);
    for (let i = 0; i < playerMoveset.length && i < enemyMoveset.length; i++) {
      expect(playerMoveset[i]?.moveId).toBe(enemyMoveset[i]?.moveId);
    }

    const playerTypes = player.getTypes();
    const enemyTypes = enemy.getTypes();

    expect(playerTypes.length).toBe(enemyTypes.length);
    for (let i = 0; i < playerTypes.length && i < enemyTypes.length; i++) {
      expect(playerTypes[i]).toBe(enemyTypes[i]);
    }
  });

  it("should copy in-battle overridden stats", async () => {
    game.override.enemyMoveset([Moves.POWER_SPLIT]);

    await game.classicMode.startBattle([Species.DITTO]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const avgAtk = Math.floor((player.getStat(Stat.ATK, false) + enemy.getStat(Stat.ATK, false)) / 2);
    const avgSpAtk = Math.floor((player.getStat(Stat.SPATK, false) + enemy.getStat(Stat.SPATK, false)) / 2);

    game.move.select(Moves.TRANSFORM);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(avgAtk);
    expect(enemy.getStat(Stat.ATK, false)).toBe(avgAtk);

    expect(player.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
    expect(enemy.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
  });

  it("should set each move's pp to a maximum of 5", async () => {
    game.override.enemyMoveset([Moves.SWORDS_DANCE, Moves.GROWL, Moves.SKETCH, Moves.RECOVER]);

    await game.classicMode.startBattle([Species.DITTO]);
    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.TRANSFORM);
    await game.phaseInterceptor.to(TurnEndPhase);

    player.getMoveset().forEach(move => {
      // Should set correct maximum PP without touching `ppUp`
      if (move) {
        if (move.moveId === Moves.SKETCH) {
          expect(move.getMovePp()).toBe(1);
        } else {
          expect(move.getMovePp()).toBe(5);
        }
        expect(move.ppUp).toBe(0);
      }
    });
  });

  it("should activate its ability if it copies one that activates on summon", async () => {
    game.override.enemyAbility(Abilities.INTIMIDATE).ability(Abilities.BALL_FETCH);

    await game.classicMode.startBattle([Species.DITTO]);
    game.move.select(Moves.TRANSFORM);

    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should persist transformed attributes across reloads", async () => {
    game.override.enemyMoveset([]).moveset([]);

    await game.classicMode.startBattle([Species.DITTO]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.changeMoveset(player, Moves.TRANSFORM);
    game.move.changeMoveset(enemy, Moves.MEMENTO);

    game.move.select(Moves.TRANSFORM);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextWave();

    expect(game.scene.getCurrentPhase()?.constructor.name).toBe("CommandPhase");
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
    expect(playerMoveset[0]?.moveId).toEqual(Moves.MEMENTO);
  });

  it("should stay transformed with the correct form after reload", async () => {
    game.override.enemyMoveset([]).moveset([]);
    game.override.enemySpecies(Species.DARMANITAN);

    await game.classicMode.startBattle([Species.DITTO]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    // change form
    enemy.species.forms[1];
    enemy.species.formIndex = 1;

    game.move.changeMoveset(player, Moves.TRANSFORM);
    game.move.changeMoveset(enemy, Moves.MEMENTO);

    game.move.select(Moves.TRANSFORM);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextWave();

    expect(game.scene.getCurrentPhase()?.constructor.name).toBe("CommandPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(2);

    await game.reload.reloadSession();

    const playerReloaded = game.scene.getPlayerPokemon()!;

    expect(playerReloaded.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
    expect(playerReloaded.getSpeciesForm().formIndex).toBe(enemy.getSpeciesForm().formIndex);
  });
});
