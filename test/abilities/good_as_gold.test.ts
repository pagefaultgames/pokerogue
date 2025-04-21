import { BattlerIndex } from "#app/battle";
import { allAbilities } from "#app/data/data-lists";
import { ArenaTagSide } from "#app/data/arena-tag";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Stat } from "#app/enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import { WeatherType } from "#app/enums/weather-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Good As Gold", () => {
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
      .moveset([Moves.SPLASH])
      .ability(Abilities.GOOD_AS_GOLD)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should block normal status moves", async () => {
    game.override.enemyMoveset([Moves.GROWL]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH, 0);

    await game.phaseInterceptor.to("BerryPhase");

    expect(player.battleData.abilitiesApplied[0]).toBe(Abilities.GOOD_AS_GOLD);
    expect(player.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should block memento and prevent the user from fainting", async () => {
    game.override.enemyMoveset([Moves.MEMENTO]);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    game.move.select(Moves.MEMENTO);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.isFainted()).toBe(false);
    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not block any status moves that target the field, one side, or all pokemon", async () => {
    game.override.battleStyle("double");
    game.override.enemyMoveset([Moves.STEALTH_ROCK, Moves.HAZE]);
    game.override.moveset([Moves.SWORDS_DANCE, Moves.SAFEGUARD]);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);
    const [good_as_gold, ball_fetch] = game.scene.getPlayerField();

    // Force second pokemon to have ball fetch to isolate to a single mon.
    vi.spyOn(ball_fetch, "getAbility").mockReturnValue(allAbilities[Abilities.BALL_FETCH]);

    game.move.select(Moves.SWORDS_DANCE, 0);
    game.move.select(Moves.SAFEGUARD, 1);
    await game.forceEnemyMove(Moves.STEALTH_ROCK);
    await game.forceEnemyMove(Moves.HAZE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(good_as_gold.getAbility().id).toBe(Abilities.GOOD_AS_GOLD);
    expect(good_as_gold.getStatStage(Stat.ATK)).toBe(0);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.STEALTH_ROCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.SAFEGUARD, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("should not block field targeted effects in singles", async () => {
    game.override.battleStyle("single");
    game.override.enemyMoveset([Moves.SPIKES]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SPLASH, 0);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("should block the ally's helping hand", async () => {
    game.override.battleStyle("double");
    game.override.moveset([Moves.HELPING_HAND, Moves.TACKLE]);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

    game.move.select(Moves.HELPING_HAND, 0);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.to("MoveEndPhase", true);

    expect(game.scene.getPlayerField()[1].getTag(BattlerTagType.HELPING_HAND)).toBeUndefined();
  });

  it("should block the ally's heal bell, but only if the good as gold user is on the field", async () => {
    game.override.battleStyle("double");
    game.override.moveset([Moves.HEAL_BELL, Moves.SPLASH]);
    game.override.statusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS, Species.ABRA]);
    const [good_as_gold, ball_fetch] = game.scene.getPlayerField();

    // Force second pokemon to have ball fetch to isolate to a single mon.
    vi.spyOn(ball_fetch, "getAbility").mockReturnValue(allAbilities[Abilities.BALL_FETCH]);

    // turn 1
    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.HEAL_BELL, 1);
    await game.toNextTurn();
    expect(good_as_gold.status?.effect).toBe(StatusEffect.BURN);

    game.doSwitchPokemon(2);
    game.move.select(Moves.HEAL_BELL, 0);
    await game.toNextTurn();
    expect(good_as_gold.status?.effect).toBeUndefined();
  });

  it("should not block field targeted effects like rain dance", async () => {
    game.override.battleStyle("single");
    game.override.enemyMoveset([Moves.RAIN_DANCE]);
    game.override.weather(WeatherType.NONE);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SPLASH, 0);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });
});
