import { allMoves } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Battle Mechanics - Damage Calculation", () => {
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
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(100)
      .enemyLevel(100)
      .disableCrits()
      .moveset([Moves.TACKLE, Moves.DRAGON_RAGE, Moves.FISSURE, Moves.JUMP_KICK]);
  });

  it("Tackle deals expected base damage", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    vi.spyOn(playerPokemon, "getEffectiveStat").mockReturnValue(80);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "getEffectiveStat").mockReturnValue(90);

    // expected base damage = [(2*level/5 + 2) * power * playerATK / enemyDEF / 50] + 2
    //                      = 31.8666...
    expect(enemyPokemon.getAttackDamage(playerPokemon, allMoves[Moves.TACKLE]).damage).toBeCloseTo(31);
  });

  it("Attacks deal 1 damage at minimum", async () => {
    game.override
      .startingLevel(1)
      .enemySpecies(Species.AGGRON);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const aggron = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    // Lvl 1 0 Atk Magikarp Tackle vs. 0 HP / 0 Def Aggron: 1-1 (0.3 - 0.3%) -- possibly the worst move ever
    expect(aggron.hp).toBe(aggron.getMaxHp() - 1);
  });

  it("Fixed-damage moves ignore damage multipliers", async () => {
    game.override
      .enemySpecies(Species.DRAGONITE)
      .enemyAbility(Abilities.MULTISCALE);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const magikarp = game.scene.getPlayerPokemon()!;
    const dragonite = game.scene.getEnemyPokemon()!;

    expect(dragonite.getAttackDamage(magikarp, allMoves[Moves.DRAGON_RAGE]).damage).toBe(40);
  });

  it("One-hit KO moves ignore damage multipliers", async () => {
    game.override
      .enemySpecies(Species.AGGRON)
      .enemyAbility(Abilities.MULTISCALE);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const magikarp = game.scene.getPlayerPokemon()!;
    const aggron = game.scene.getEnemyPokemon()!;

    expect(aggron.getAttackDamage(magikarp, allMoves[Moves.FISSURE]).damage).toBe(aggron.hp);
  });

  it("When the user fails to use Jump Kick with Wonder Guard ability, the damage should be 1.", async () => {
    game.override
      .enemySpecies(Species.GASTLY)
      .ability(Abilities.WONDER_GUARD);

    await game.classicMode.startBattle([Species.SHEDINJA]);

    const shedinja = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.JUMP_KICK);

    await game.phaseInterceptor.to("DamagePhase");

    expect(shedinja.hp).toBe(shedinja.getMaxHp() - 1);
  });


  it("Charizard with odd HP survives Stealth Rock damage twice", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, Moves.STEALTH_ROCK, 0);
    game.override
      .seed("Charizard Stealth Rock test")
      .enemySpecies(Species.CHARIZARD)
      .enemyAbility(Abilities.BLAZE);

    await game.classicMode.startBattle([Species.PIKACHU]);

    const charizard = game.scene.getEnemyPokemon()!;

    if (charizard.getMaxHp() % 2 === 1) {
      expect(charizard.hp).toBeGreaterThan(charizard.getMaxHp() / 2);
    } else {
      expect(charizard.hp).toBe(charizard.getMaxHp() / 2);
    }
  });
});
