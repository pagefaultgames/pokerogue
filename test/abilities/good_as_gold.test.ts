import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allAbilities } from "#app/data/data-lists";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Stat } from "#app/enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import { WeatherType } from "#app/enums/weather-type";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.GOOD_AS_GOLD)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should block normal status moves", async () => {
    game.override.enemyMoveset([MoveId.GROWL]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SPLASH, 0);

    await game.phaseInterceptor.to("BerryPhase");

    expect(player.waveData.abilitiesApplied).toContain(AbilityId.GOOD_AS_GOLD);
    expect(player.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should block memento and prevent the user from fainting", async () => {
    game.override.enemyMoveset([MoveId.MEMENTO]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.move.select(MoveId.MEMENTO);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerPokemon()!.isFainted()).toBe(false);
    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not block any status moves that target the field, one side, or all pokemon", async () => {
    game.override.battleStyle("double");
    game.override.enemyMoveset([MoveId.STEALTH_ROCK, MoveId.HAZE]);
    game.override.moveset([MoveId.SWORDS_DANCE, MoveId.SAFEGUARD]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const [good_as_gold, ball_fetch] = game.scene.getPlayerField();

    // Force second pokemon to have ball fetch to isolate to a single mon.
    vi.spyOn(ball_fetch, "getAbility").mockReturnValue(allAbilities[AbilityId.BALL_FETCH]);

    game.move.select(MoveId.SWORDS_DANCE, 0);
    game.move.select(MoveId.SAFEGUARD, 1);
    await game.move.selectEnemyMove(MoveId.STEALTH_ROCK);
    await game.move.selectEnemyMove(MoveId.HAZE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(good_as_gold.getAbility().id).toBe(AbilityId.GOOD_AS_GOLD);
    expect(good_as_gold.getStatStage(Stat.ATK)).toBe(0);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.STEALTH_ROCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.SAFEGUARD, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("should not block field targeted effects in singles", async () => {
    game.override.battleStyle("single");
    game.override.enemyMoveset([MoveId.SPIKES]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH, 0);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("should block the ally's helping hand", async () => {
    game.override.battleStyle("double");
    game.override.moveset([MoveId.HELPING_HAND, MoveId.TACKLE]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    game.move.select(MoveId.HELPING_HAND, 0);
    game.move.select(MoveId.TACKLE, 1);
    await game.phaseInterceptor.to("MoveEndPhase", true);

    expect(game.scene.getPlayerField()[1].getTag(BattlerTagType.HELPING_HAND)).toBeUndefined();
  });

  // TODO: re-enable when heal bell is fixed
  it.todo("should block the ally's heal bell, but only if the good as gold user is on the field", async () => {
    game.override.battleStyle("double").statusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([SpeciesId.MILOTIC, SpeciesId.FEEBAS, SpeciesId.ABRA]);
    const [milotic, feebas, abra] = game.scene.getPlayerParty();
    game.field.mockAbility(milotic, AbilityId.GOOD_AS_GOLD);
    game.field.mockAbility(feebas, AbilityId.BALL_FETCH);
    game.field.mockAbility(abra, AbilityId.BALL_FETCH);

    // turn 1
    game.move.use(MoveId.SPLASH, 0);
    game.move.use(MoveId.HEAL_BELL, 1);
    await game.toNextTurn();
    expect(milotic.status?.effect).toBe(StatusEffect.BURN);

    game.doSwitchPokemon(2);
    game.move.use(MoveId.HEAL_BELL, 1);
    await game.toNextTurn();
    expect(milotic.status?.effect).toBeUndefined();
  });

  it("should not block field targeted effects like rain dance", async () => {
    game.override.battleStyle("single");
    game.override.enemyMoveset([MoveId.RAIN_DANCE]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.use(MoveId.SPLASH, 0);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });
});
