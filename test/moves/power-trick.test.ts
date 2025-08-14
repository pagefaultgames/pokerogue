import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Power Trick", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.MEW)
      .enemyLevel(200)
      .moveset([MoveId.POWER_TRICK])
      .ability(AbilityId.BALL_FETCH);
  });

  it("swaps the user's ATK and DEF stats", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const player = game.field.getPlayerPokemon();
    const baseATK = player.getStat(Stat.ATK, false);
    const baseDEF = player.getStat(Stat.DEF, false);

    game.move.select(MoveId.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(baseDEF);
    expect(player.getStat(Stat.DEF, false)).toBe(baseATK);
    expect(player.getTag(BattlerTagType.POWER_TRICK)).toBeDefined();
  });

  it("resets initial ATK and DEF stat swap when used consecutively", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const player = game.field.getPlayerPokemon();
    const baseATK = player.getStat(Stat.ATK, false);
    const baseDEF = player.getStat(Stat.DEF, false);

    game.move.select(MoveId.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(MoveId.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(baseATK);
    expect(player.getStat(Stat.DEF, false)).toBe(baseDEF);
    expect(player.getTag(BattlerTagType.POWER_TRICK)).toBeUndefined();
  });

  it("should pass effect when using BATON_PASS", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.SHUCKLE]);
    await game.override.moveset([MoveId.POWER_TRICK, MoveId.BATON_PASS]);

    const player = game.field.getPlayerPokemon();
    player.addTag(BattlerTagType.POWER_TRICK);

    game.move.select(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);

    const switchedPlayer = game.field.getPlayerPokemon();
    const baseATK = switchedPlayer.getStat(Stat.ATK);
    const baseDEF = switchedPlayer.getStat(Stat.DEF);

    expect(switchedPlayer.getStat(Stat.ATK, false)).toBe(baseDEF);
    expect(switchedPlayer.getStat(Stat.DEF, false)).toBe(baseATK);
    expect(switchedPlayer.getTag(BattlerTagType.POWER_TRICK)).toBeDefined();
  });

  it("should remove effect after using Transform", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.SHUCKLE]);
    await game.override.moveset([MoveId.POWER_TRICK, MoveId.TRANSFORM]);

    const player = game.field.getPlayerPokemon();
    player.addTag(BattlerTagType.POWER_TRICK);

    game.move.select(MoveId.TRANSFORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    const enemy = game.field.getEnemyPokemon();
    const baseATK = enemy.getStat(Stat.ATK);
    const baseDEF = enemy.getStat(Stat.DEF);

    expect(player.getStat(Stat.ATK, false)).toBe(baseATK);
    expect(player.getStat(Stat.DEF, false)).toBe(baseDEF);
    expect(player.getTag(BattlerTagType.POWER_TRICK)).toBeUndefined();
  });
});
