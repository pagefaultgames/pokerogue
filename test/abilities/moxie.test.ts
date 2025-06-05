import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerIndex } from "#app/battle";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { VictoryPhase } from "#app/phases/victory-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";

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
    game.override.battleStyle("single");
    game.override.enemySpecies(SpeciesId.RATTATA);
    game.override.enemyAbility(AbilityId.MOXIE);
    game.override.ability(AbilityId.MOXIE);
    game.override.startingLevel(2000);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset(MoveId.SPLASH);
  });

  it("should raise ATK stat stage by 1 when winning a battle", async () => {
    const moveToUse = MoveId.AERIAL_ACE;
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.MIGHTYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(moveToUse);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(VictoryPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(1);
  }, 20000);

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

      game.move.select(moveToUse);
      game.selectTarget(BattlerIndex.PLAYER_2);

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(firstPokemon.getStatStage(Stat.ATK)).toBe(1);
    },
    20000,
  );
});
