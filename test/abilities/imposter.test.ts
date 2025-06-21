import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { MoveId } from "#enums/move-id";
import { Stat } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";

// TODO: Add more tests once Imposter is fully implemented
describe("Abilities - Imposter", () => {
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
      .ability(AbilityId.IMPOSTER)
      .moveset(MoveId.SPLASH);
  });

  it("should copy species, ability, gender, all stats except HP, all stat stages, moveset, and types of target", async () => {
    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(player.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
    expect(player.getAbility()).toBe(enemy.getAbility());
    expect(player.getGender()).toBe(enemy.getGender());

    const playerStats = player.getStats(false);
    const enemyStats = enemy.getStats(false);
    // HP stays the same; all other stats should carry over
    expect(playerStats[0]).not.toBe(enemyStats[0]);
    expect(playerStats.slice(1)).toEqual(enemyStats.slice(1));

    expect(player.getStatStages()).toEqual(enemy.getStatStages());

    expect(player.getMoveset().map(m => m.moveId)).toEqual(player.getMoveset().map(m => m.moveId));

    expect(player.getTypes()).toEqual(enemy.getTypes());
  });

  it("should copy in-battle overridden stats", async () => {
    game.override.ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.DITTO]);

    const [karp, ditto] = game.scene.getPlayerParty();
    const enemy = game.field.getEnemyPokemon();
    const abMock = game.field.mockAbility(ditto, AbilityId.IMPOSTER);

    const oldAtk = karp.getStat(Stat.ATK);

    // Turn 1: Use power split
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.POWER_SPLIT);
    await game.toNextTurn();

    const avgAtk = Math.floor((karp.getStat(Stat.ATK, false) + enemy.getStat(Stat.ATK, false)) / 2);

    expect(enemy.getStat(Stat.ATK, false)).toBe(avgAtk);
    expect(karp.getStat(Stat.ATK, false)).toBe(avgAtk);
    expect(avgAtk).not.toBe(oldAtk);

    // Turn 2: Switch in ditto, should copy power split stats
    game.doSwitchPokemon(1);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("PokemonTransformPhase", false);
    // reset ability mock after activating so Ditto doesn't keep on transforming into itself
    abMock.mockRestore();
    await game.toEndOfTurn();

    expect(ditto.getStat(Stat.ATK, false)).toBe(avgAtk);
  });

  it("should set each move's pp to a maximum of 5", async () => {
    game.override.enemyMoveset([MoveId.SWORDS_DANCE, MoveId.GROWL, MoveId.SKETCH, MoveId.RECOVER]);
    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const player = game.field.getPlayerPokemon();

    player.getMoveset().forEach(move => {
      // Should set correct maximum PP without touching `ppUp`
      if (move.moveId === MoveId.SKETCH) {
        expect(move.getMovePp()).toBe(1);
      } else {
        expect(move.getMovePp()).toBe(5);
      }
      expect(move.ppUp).toBe(0);
    });
  });

  it("should activate its ability if it copies one that activates on summon", async () => {
    game.override.enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.DITTO]);

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should persist transformed attributes across reloads", async () => {
    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(game.scene.phaseManager.getCurrentPhase()?.phaseName).toBe("CommandPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(2);

    await game.reload.reloadSession();

    const playerReloaded = game.field.getPlayerPokemon();

    expect(playerReloaded.getSpeciesForm().speciesId).toBe(SpeciesId.MEW);
    expect(playerReloaded.getAbility()).toBe(enemy.getAbility());
    expect(playerReloaded.getGender()).toBe(enemy.getGender());

    const playerStats = player.getStats(false);
    const playerReloadedStats = player.getStats(false);
    // HP stays the same; all other stats should carry over
    expect(playerReloadedStats).toEqual(playerStats);

    expect(playerReloaded.getMoveset()).toEqual(player.getMoveset());
  });

  // TODO: This doesn't look as though it should work
  it("should stay transformed with the correct form after reload", async () => {
    game.override.enemySpecies(SpeciesId.UNOWN);
    await game.classicMode.startBattle([SpeciesId.DITTO]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    // change form
    enemy.species.forms[5];
    enemy.species.formIndex = 5;

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(game.scene.phaseManager.getCurrentPhase()?.constructor.name).toBe("CommandPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(2);

    expect(player.getSpeciesForm().speciesId).toBe(SpeciesId.UNOWN);
    expect(player.getSpeciesForm().formIndex).toBe(5);

    await game.reload.reloadSession();

    const playerReloaded = game.field.getPlayerPokemon();

    expect(playerReloaded.getSpeciesForm().speciesId).toBe(SpeciesId.UNOWN);
    expect(playerReloaded.getSpeciesForm().formIndex).toBe(5);
  });
});
