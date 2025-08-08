import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Recoil Moves", () => {
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
      .enemySpecies(SpeciesId.PIDOVE)
      .startingLevel(1)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SUBSTITUTE)
      .criticalHits(false)
      .ability(AbilityId.NO_GUARD)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

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
  ])("$moveName causes recoil damage when hitting a substitute", async ({ moveId }) => {
    await game.classicMode.startBattle([SpeciesId.TOGEPI]);

    game.move.use(moveId);
    await game.phaseInterceptor.to("MoveEndPhase"); // Pidove substitute

    const pidove = game.field.getEnemyPokemon();
    const subTag = pidove.getTag(BattlerTagType.SUBSTITUTE)!;
    expect(subTag).toBeDefined();
    const subInitialHp = subTag.hp;

    await game.phaseInterceptor.to("MoveEndPhase"); // player attack

    expect(subTag.hp).toBeLessThan(subInitialHp);

    const playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
  });

  it("causes recoil damage when hitting a substitute in a double battle", async () => {
    game.override.battleStyle("double");

    await game.classicMode.startBattle([SpeciesId.TOGEPI, SpeciesId.TOGEPI]);

    const [playerPokemon1, playerPokemon2] = game.scene.getPlayerField();

    game.move.use(MoveId.DOUBLE_EDGE, 0);
    game.move.use(MoveId.DOUBLE_EDGE, 1);

    await game.toNextTurn();

    expect(playerPokemon1.hp).toBeLessThan(playerPokemon1.getMaxHp());
    expect(playerPokemon2.hp).toBeLessThan(playerPokemon2.getMaxHp());
  });
});
