import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Costar", () => {
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
      .battleStyle("double")
      .criticalHits(false)
      .ability(AbilityId.COSTAR)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("copies the ally's stat stages", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.GIBLE, SpeciesId.MILOTIC);

    const [player1, , player3] = game.scene.getPlayerParty();

    game.move.use(MoveId.CURSE);
    game.move.use(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(player1).toHaveStatStage(Stat.ATK, 1);
    expect(player1).toHaveStatStage(Stat.DEF, 1);
    expect(player1).toHaveStatStage(Stat.SPD, -1);

    game.move.use(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.toEndOfTurn();

    expect(player3).toHaveStatStage(Stat.ATK, 1);
    expect(player3).toHaveStatStage(Stat.DEF, 1);
    expect(player3).toHaveStatStage(Stat.SPD, -1);
  });

  it.each<{ move: MoveId; tagType: BattlerTagType; moveName: string }>([
    { move: MoveId.FOCUS_ENERGY, tagType: BattlerTagType.CRIT_BOOST, moveName: "Focus Energy" },
    { move: MoveId.LASER_FOCUS, tagType: BattlerTagType.ALWAYS_CRIT, moveName: "Laser Focus" },
  ])("copies the ally's critical hit stages from $moveName", async ({ move, tagType }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.GYARADOS, SpeciesId.MILOTIC);

    const [player1, , player3] = game.scene.getPlayerParty();

    game.move.use(move);
    game.move.use(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(player1).toHaveBattlerTag(tagType);

    game.move.use(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.toEndOfTurn();

    expect(player3).toHaveBattlerTag(tagType);
  });

  it.each<{ speciesId: SpeciesId; critStages: 1 | 2 }>([
    { speciesId: SpeciesId.GYARADOS, critStages: 1 },
    { speciesId: SpeciesId.GIBLE, critStages: 2 },
  ])("copies the number of crit stages from Dragon Cheer ($critStages)", async ({ speciesId, critStages }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, speciesId, SpeciesId.MILOTIC);

    const [, player2, player3] = game.scene.getPlayerParty();

    game.move.use(MoveId.DRAGON_CHEER);
    game.move.use(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(player2).toHaveBattlerTag({ tagType: BattlerTagType.DRAGON_CHEER, critStages });

    game.doSwitchPokemon(2);
    game.move.use(MoveId.SPLASH, 1);
    await game.toEndOfTurn();

    expect(player3).toHaveBattlerTag({ tagType: BattlerTagType.DRAGON_CHEER, critStages });
  });
});
