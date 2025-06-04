import { RechargingTag, SemiInvulnerableTag } from "#app/data/battler-tags";
import { RandomMoveAttr } from "#app/data/moves/move";
import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Stat } from "#app/enums/stat";
import { CommandPhase } from "#app/phases/command-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
    randomMoveAttr = allMoves[MoveId.METRONOME].getAttrs(RandomMoveAttr)[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.METRONOME, MoveId.SPLASH])
      .battleStyle("single")
      .startingLevel(100)
      .starterSpecies(SpeciesId.REGIELEKI)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it("should have one semi-invulnerable turn and deal damage on the second turn when a semi-invulnerable move is called", async () => {
    await game.classicMode.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.DIVE);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(SemiInvulnerableTag)).toBeTruthy();

    await game.toNextTurn();
    expect(player.getTag(SemiInvulnerableTag)).toBeFalsy();
    expect(enemy.isFullHp()).toBeFalsy();
  });

  it("should apply secondary effects of a move", async () => {
    await game.classicMode.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.WOOD_HAMMER);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.isFullHp()).toBeFalsy();
  });

  it("should recharge after using recharge move", async () => {
    await game.classicMode.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.HYPER_BEAM);
    vi.spyOn(allMoves[MoveId.HYPER_BEAM], "accuracy", "get").mockReturnValue(100);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(RechargingTag)).toBeTruthy();
  });

  it("should only target ally for Aromatic Mist", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.RATTATA]);
    const [leftPlayer, rightPlayer] = game.scene.getPlayerField();
    const [leftOpp, rightOpp] = game.scene.getEnemyField();
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.AROMATIC_MIST);

    game.move.select(MoveId.METRONOME, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(rightPlayer.getStatStage(Stat.SPDEF)).toBe(1);
    expect(leftPlayer.getStatStage(Stat.SPDEF)).toBe(0);
    expect(leftOpp.getStatStage(Stat.SPDEF)).toBe(0);
    expect(rightOpp.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("should cause opponent to flee, and not crash for Roar", async () => {
    await game.classicMode.startBattle();
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.ROAR);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);

    await game.phaseInterceptor.to("CommandPhase");
  });
});
