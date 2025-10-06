import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Moxie", () => {
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
    const moveToUse = MoveId.AERIAL_ACE;
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.MOXIE)
      .ability(AbilityId.MOXIE)
      .startingLevel(2000)
      .moveset([moveToUse])
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should raise ATK stat stage by 1 when winning a battle", async () => {
    const moveToUse = MoveId.AERIAL_ACE;
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.MIGHTYENA]);

    const playerPokemon = game.field.getPlayerPokemon();

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(moveToUse);
    await game.phaseInterceptor.to("VictoryPhase");

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  // TODO: Activate this test when MOXIE is corrected to work on faint and not on battle victory
  it.todo(
    "should raise ATK stat stage by 1 when defeating an ally Pokemon",
    async () => {
      game.override.battleStyle("double");
      const moveToUse = MoveId.AERIAL_ACE;
      await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.MIGHTYENA]);

      const [firstPokemon, secondPokemon] = game.scene.getPlayerField();

      expect(firstPokemon.getStatStage(Stat.ATK)).toBe(0);

      secondPokemon.hp = 1;

      game.move.select(moveToUse, BattlerIndex.PLAYER_2);

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(firstPokemon.getStatStage(Stat.ATK)).toBe(1);
    },
    20000,
  );
});
