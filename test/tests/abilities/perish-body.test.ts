import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Perish Song", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.PERISH_BODY)
      .moveset(MoveId.SPLASH)
      .enemyMoveset(MoveId.AQUA_JET);
  });

  it("should trigger when hit with damaging move", async () => {
    await game.classicMode.startBattle(SpeciesId.CURSOLA);

    const cursola = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(cursola).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 3 });
    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 3 });
  });

  it("should trigger even when fainting", async () => {
    game.override.enemyLevel(100).startingLevel(1);
    await game.classicMode.startBattle(SpeciesId.CURSOLA, SpeciesId.FEEBAS);

    const magikarp = game.field.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 3 });
  });

  it("should not activate if attacker already has perish song", async () => {
    game.override.enemyMoveset([MoveId.PERISH_SONG, MoveId.AQUA_JET, MoveId.SPLASH]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.CURSOLA);

    const feebas = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.PERISH_SONG);
    await game.toNextTurn();

    expect(feebas).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 3 });
    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 3 });

    game.doSwitchPokemon(1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const cursola = game.field.getPlayerPokemon();
    expect(cursola).not.toHaveBattlerTag(BattlerTagType.PERISH_SONG);
    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 2 });

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.AQUA_JET);
    await game.toNextTurn();

    expect(cursola).not.toHaveBattlerTag(BattlerTagType.PERISH_SONG);
    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 1 });
  });

  it("should activate if cursola already has perish song, but not reset its counter", async () => {
    game.override
      .enemyMoveset([MoveId.PERISH_SONG, MoveId.AQUA_JET, MoveId.SPLASH])
      .moveset([MoveId.WHIRLWIND, MoveId.SPLASH])
      .startingWave(5);
    await game.classicMode.startBattle(SpeciesId.CURSOLA);

    const cursola = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();

    game.move.select(MoveId.WHIRLWIND);
    await game.move.selectEnemyMove(MoveId.PERISH_SONG);
    await game.toNextTurn();

    expect(cursola).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 3 });
    expect(magikarp).not.toHaveBattlerTag(BattlerTagType.PERISH_SONG);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.AQUA_JET);
    await game.toNextTurn();

    expect(cursola).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 2 });
    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.PERISH_SONG, turnCount: 3 });
  });
});
