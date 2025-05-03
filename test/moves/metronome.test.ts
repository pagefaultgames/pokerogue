import { RechargingTag, SemiInvulnerableTag } from "#app/data/battler-tags";
import { allMoves, RandomMoveAttr } from "#app/data/moves/move";
import { Abilities } from "#app/enums/abilities";
import { Stat } from "#app/enums/stat";
import { CommandPhase } from "#app/phases/command-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Metronome", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let randomMoveAttr: RandomMoveAttr;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    randomMoveAttr = allMoves[Moves.METRONOME].getAttrs(RandomMoveAttr)[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([Moves.METRONOME, Moves.SPLASH])
      .battleStyle("single")
      .startingLevel(100)
      .starterSpecies(Species.REGIELEKI)
      .enemyLevel(100)
      .enemySpecies(Species.SHUCKLE)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("should become semi-invulnerable as normal when using phasing moves", async () => {
    await game.classicMode.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(Moves.DIVE);

    game.move.select(Moves.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(SemiInvulnerableTag)).toBeTruthy();

    await game.toNextTurn();
    expect(player.getTag(SemiInvulnerableTag)).toBeFalsy();
    expect(enemy.isFullHp()).toBeFalsy();
  });

  it("should apply secondary effects", async () => {
    await game.classicMode.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(Moves.WOOD_HAMMER);

    game.move.select(Moves.METRONOME);
    await game.toNextTurn();

    expect(player.isFullHp()).toBeFalsy();
  });

  it("should recharge after using recharge move", async () => {
    await game.classicMode.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(Moves.HYPER_BEAM);
    vi.spyOn(allMoves[Moves.HYPER_BEAM], "accuracy", "get").mockReturnValue(100);

    game.move.select(Moves.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(RechargingTag)).toBeTruthy();
  });

  it("should only target ally for Aromatic Mist", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.REGIELEKI, Species.RATTATA]);
    const [leftPlayer, rightPlayer] = game.scene.getPlayerField();
    const [leftOpp, rightOpp] = game.scene.getEnemyField();
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(Moves.AROMATIC_MIST);

    game.move.select(Moves.METRONOME, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH, 1);
    await game.toNextTurn();

    expect(rightPlayer.getStatStage(Stat.SPDEF)).toBe(1);
    expect(leftPlayer.getStatStage(Stat.SPDEF)).toBe(0);
    expect(leftOpp.getStatStage(Stat.SPDEF)).toBe(0);
    expect(rightOpp.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("should cause opponent to flee when using Roar", async () => {
    await game.classicMode.startBattle();
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(Moves.ROAR);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(isVisible).toBe(false);
    expect(hasFled).toBe(true);

    expect(await game.toNextTurn()).not.toThrowError(); // Check no crash
  });
});
