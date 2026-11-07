import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Recoil Moves", () => {
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
      .enemySpecies(SpeciesId.PIDOVE)
      .startingLevel(1)
      .enemyLevel(100)
      .criticalHits(false)
      .ability(AbilityId.NO_GUARD)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  // TODO: Add test checking the recoil amounts based on damage taken (for everything but struggle)

  it.each([
    { moveName: "Double Edge", moveId: MoveId.DOUBLE_EDGE },
    { moveName: "Brave Bird", moveId: MoveId.BRAVE_BIRD },
    { moveName: "Flare Blitz", moveId: MoveId.FLARE_BLITZ },
    { moveName: "Head Charge", moveId: MoveId.HEAD_CHARGE },
    { moveName: "Head Smash", moveId: MoveId.HEAD_SMASH },
    { moveName: "Light of Ruin", moveId: MoveId.LIGHT_OF_RUIN },
    { moveName: "Struggle", moveId: MoveId.STRUGGLE },
    { moveName: "Submission", moveId: MoveId.SUBMISSION },
    { moveName: "Take Down", moveId: MoveId.TAKE_DOWN },
    { moveName: "Volt Tackle", moveId: MoveId.VOLT_TACKLE },
    { moveName: "Wave Crash", moveId: MoveId.WAVE_CRASH },
    { moveName: "Wild Charge", moveId: MoveId.WILD_CHARGE },
    { moveName: "Wood Hammer", moveId: MoveId.WOOD_HAMMER },
  ])("$moveName should cause recoil damage when hitting a substitute", async ({ moveId }) => {
    await game.classicMode.startBattle(SpeciesId.TOGEPI);

    game.move.use(moveId);
    await game.move.forceEnemyMove(MoveId.SUBSTITUTE);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase"); // Pidove substitute

    const enemy = game.field.getEnemyPokemon();
    const subTag = enemy.getTag(BattlerTagType.SUBSTITUTE)!;
    expect(subTag).toBeDefined();
    const subInitialHp = subTag.hp;

    await game.phaseInterceptor.to("MoveEndPhase"); // player attack

    expect(subTag.hp).toBeLessThan(subInitialHp); // make sure the substitute took damage (not vacuously true)

    const player = game.field.getPlayerPokemon();
    expect(player).not.toHaveFullHp();
  });

  it("should cause recoil damage when hitting a substitute in a double battle", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.TOGEPI, SpeciesId.TOGEPI);

    const [player1, player2] = game.scene.getPlayerField();

    game.move.use(MoveId.DOUBLE_EDGE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.DOUBLE_EDGE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.SUBSTITUTE);
    await game.move.forceEnemyMove(MoveId.SUBSTITUTE);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);
    await game.toEndOfTurn();

    expect(player1).not.toHaveFullHp();
    expect(player2).not.toHaveFullHp();
  });
});
