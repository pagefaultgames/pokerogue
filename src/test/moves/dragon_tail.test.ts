import { allMoves } from "#app/data/move.js";
import { SPLASH_ONLY } from "../utils/testUtils";
import { BattleEndPhase, BerryPhase, TurnEndPhase} from "#app/phases.js";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BattlerIndex } from "#app/battle.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Dragon Tail", () => {
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
    game.override.battleType("single");
    game.override.moveset([Moves.DRAGON_TAIL, Moves.SPLASH]);
    game.override.enemySpecies(Species.WAILORD);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.startingLevel(5);
    game.override.enemyLevel(5);

    vi.spyOn(allMoves[Moves.DRAGON_TAIL], "accuracy", "get").mockReturnValue(100);
  });

  test(
    "Single battle should cause opponent to flee, and not crash",
    async () => {
      await game.startBattle([Species.DRATINI]);

      const enemyPokemon = game.scene.getEnemyPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_TAIL));

      await game.phaseInterceptor.to(BerryPhase);

      const isVisible = enemyPokemon.visible;
      const hasFled = enemyPokemon.wildFlee;
      expect(!isVisible && hasFled ).toBe(true);

      // simply want to test that the game makes it this far without crashing
      await game.phaseInterceptor.to(BattleEndPhase);
      expect(true).toBe(true);
    }, TIMEOUT
  );

  test(
    "Single battle should cause opponent to flee, display ability, and not crash",
    async () => {
      await game.startBattle([Species.DRATINI]);
      game.override.enemyAbility(Abilities.ROUGH_SKIN);

      const leadPokemon = game.scene.getPlayerPokemon();

      const enemyPokemon = game.scene.getEnemyPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_TAIL));

      await game.phaseInterceptor.to(BerryPhase);

      const isVisible = enemyPokemon.visible;
      const hasFled = enemyPokemon.wildFlee;
      expect(!isVisible && hasFled ).toBe(true);

      await game.phaseInterceptor.to(BattleEndPhase);
      expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
    }, TIMEOUT
  );

  test(
    "Double battles should proceed without crashing" ,
    async () => {
      game.override.battleType("double").enemyMoveset(SPLASH_ONLY);
      await game.startBattle([Species.DRATINI, Species.DRATINI, Species.WAILORD, Species.WAILORD]);
      game.override.moveset([Moves.DRAGON_TAIL, Moves.SPLASH, Moves.FLAMETHROWER]);
      game.override.enemyAbility(Abilities.ROUGH_SKIN);

      const leadPokemon = game.scene.getParty()[0];
      const secPokemon = game.scene.getParty()[1];
      expect(leadPokemon).toBeDefined();
      expect(secPokemon).toBeDefined();

      const enemyLeadPokemon = game.scene.currentBattle.enemyParty[0];
      const enemySecPokemon = game.scene.currentBattle.enemyParty[1];

      game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_TAIL));
      game.doSelectTarget(BattlerIndex.ENEMY);

      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      const isVisibleLead = enemyLeadPokemon.visible;
      const hasFledLead = enemyLeadPokemon.wildFlee;
      const isVisibleSec = enemySecPokemon.visible;
      const hasFledSec = enemySecPokemon.wildFlee;
      expect(!isVisibleLead && hasFledLead && isVisibleSec && !hasFledSec ).toBe(true);

      expect(leadPokemon.hp < leadPokemon.getMaxHp());

      // second turn

      game.doAttack(getMovePosition(game.scene, 0, Moves.FLAMETHROWER));
      game.doSelectTarget(BattlerIndex.ENEMY_2);
      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase);
      expect(enemySecPokemon.hp < enemySecPokemon.getMaxHp() ).toBe(true);

    }, TIMEOUT
  );

  test(
    "Flee move redirection works" ,
    async () => {
      game.override.battleType("double").enemyMoveset(SPLASH_ONLY);
      await game.startBattle([Species.DRATINI, Species.DRATINI, Species.WAILORD, Species.WAILORD]);
      game.override.moveset([Moves.DRAGON_TAIL, Moves.SPLASH, Moves.FLAMETHROWER]);
      game.override.enemyAbility(Abilities.ROUGH_SKIN);

      const leadPokemon = game.scene.getParty()[0];
      const secPokemon = game.scene.getParty()[1];
      expect(leadPokemon).toBeDefined();
      expect(secPokemon).toBeDefined();

      const enemyLeadPokemon = game.scene.currentBattle.enemyParty[0];
      const enemySecPokemon = game.scene.currentBattle.enemyParty[1];

      game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_TAIL));
      game.doSelectTarget(BattlerIndex.ENEMY);

      // target the same pokemon, second move should be redirected after first flees
      game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_TAIL));
      game.doSelectTarget(BattlerIndex.ENEMY);

      await game.phaseInterceptor.to(BerryPhase);

      const isVisibleLead = enemyLeadPokemon.visible;
      const hasFledLead = enemyLeadPokemon.wildFlee;
      const isVisibleSec = enemySecPokemon.visible;
      const hasFledSec = enemySecPokemon.wildFlee;
      expect(!isVisibleLead && hasFledLead && !isVisibleSec && hasFledSec ).toBe(true);

      expect(leadPokemon.hp < leadPokemon.getMaxHp());
      expect(secPokemon.hp < secPokemon.getMaxHp());
      expect(enemyLeadPokemon.hp < enemyLeadPokemon.getMaxHp());
      expect(enemySecPokemon.hp < enemySecPokemon.getMaxHp());

    }, TIMEOUT
  );
});
