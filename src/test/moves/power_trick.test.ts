import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";

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
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.MEW)
      .enemyLevel(200)
      .moveset([ Moves.POWER_TRICK ])
      .ability(Abilities.BALL_FETCH);
  });

  it("swaps the user's ATK and DEF stats", async () => {
    await game.classicMode.startBattle([ Species.SHUCKLE ]);

    const player = game.scene.getPlayerPokemon()!;
    const baseATK = player.getStat(Stat.ATK, false);
    const baseDEF = player.getStat(Stat.DEF, false);

    game.move.select(Moves.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(baseDEF);
    expect(player.getStat(Stat.DEF, false)).toBe(baseATK);
    expect(player.getTag(BattlerTagType.POWER_TRICK)).toBeDefined();
  });

  it("resets initial ATK and DEF stat swap when used consecutively", async () => {
    await game.classicMode.startBattle([ Species.SHUCKLE ]);

    const player = game.scene.getPlayerPokemon()!;
    const baseATK = player.getStat(Stat.ATK, false);
    const baseDEF = player.getStat(Stat.DEF, false);

    game.move.select(Moves.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(Moves.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(baseATK);
    expect(player.getStat(Stat.DEF, false)).toBe(baseDEF);
    expect(player.getTag(BattlerTagType.POWER_TRICK)).toBeUndefined();
  });

  it("should pass effect when using BATON_PASS", async () => {
    await game.classicMode.startBattle([ Species.SHUCKLE, Species.SHUCKLE ]);
    await game.override.moveset([ Moves.POWER_TRICK, Moves.BATON_PASS ]);

    const player = game.scene.getPlayerPokemon()!;
    player.addTag(BattlerTagType.POWER_TRICK);

    game.move.select(Moves.BATON_PASS);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);

    const switchedPlayer = game.scene.getPlayerPokemon()!;
    const baseATK = switchedPlayer.getStat(Stat.ATK);
    const baseDEF = switchedPlayer.getStat(Stat.DEF);

    expect(switchedPlayer.getStat(Stat.ATK, false)).toBe(baseDEF);
    expect(switchedPlayer.getStat(Stat.DEF, false)).toBe(baseATK);
    expect(switchedPlayer.getTag(BattlerTagType.POWER_TRICK)).toBeDefined();
  });

  it("should remove effect after using Transform", async () => {
    await game.classicMode.startBattle([ Species.SHUCKLE, Species.SHUCKLE ]);
    await game.override.moveset([ Moves.POWER_TRICK, Moves.TRANSFORM ]);

    const player = game.scene.getPlayerPokemon()!;
    player.addTag(BattlerTagType.POWER_TRICK);

    game.move.select(Moves.TRANSFORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    const enemy = game.scene.getEnemyPokemon()!;
    const baseATK = enemy.getStat(Stat.ATK);
    const baseDEF = enemy.getStat(Stat.DEF);

    expect(player.getStat(Stat.ATK, false)).toBe(baseATK);
    expect(player.getStat(Stat.DEF, false)).toBe(baseDEF);
    expect(player.getTag(BattlerTagType.POWER_TRICK)).toBeUndefined();
  });
});
