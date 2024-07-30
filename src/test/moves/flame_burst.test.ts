import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  SelectTargetPhase,
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#app/enums/abilities.js";
import { allAbilities } from "#app/data/ability.js";
import Pokemon from "#app/field/pokemon.js";

describe("Moves - Flame Burst", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Calculates the effect damage of Flame Burst which is 1/16 of the target ally's max HP
   * See Flame Burst {@link https://bulbapedia.bulbagarden.net/wiki/Flame_Burst_(move)}
   * See Flame Burst's move attribute {@linkcode FlameBurstAttr}
   * @param pokemon {@linkcode Pokemon} - The ally of the move's target
   * @returns Effect damage of Flame Burst
   */
  const getEffectDamage = (pokemon: Pokemon): number => {
    return Math.max(1, Math.floor(pokemon.getMaxHp() * 1/16));
  };

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
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FLAME_BURST, Moves.SPLASH]);
    vi.spyOn(Overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.UNNERVE);
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(4);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHUCKLE);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(new Array(4).fill(Moves.SPLASH));
  });

  it("inflicts damage to the target's ally equal to 1/16 of its max HP", async () => {
    await game.startBattle([Species.PIKACHU, Species.PIKACHU]);
    const [ leftEnemy, rightEnemy ] = game.scene.getEnemyField();

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLAME_BURST));
    await game.phaseInterceptor.to(SelectTargetPhase, false);
    game.doSelectTarget(leftEnemy.getBattlerIndex());
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp() - getEffectDamage(rightEnemy));
  });

  it("does not inflict damage to the target's ally if the target was not affected by Flame Burst", async () => {
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.FLASH_FIRE);

    await game.startBattle([Species.PIKACHU, Species.PIKACHU]);
    const [ leftEnemy, rightEnemy ] = game.scene.getEnemyField();

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLAME_BURST));
    await game.phaseInterceptor.to(SelectTargetPhase, false);
    game.doSelectTarget(leftEnemy.getBattlerIndex());
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leftEnemy.hp).toBe(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp());
  });

  it("does not interact with the target ally's abilities", async () => {
    await game.startBattle([Species.PIKACHU, Species.PIKACHU]);
    const [ leftEnemy, rightEnemy ] = game.scene.getEnemyField();

    vi.spyOn(rightEnemy, "getAbility").mockReturnValue(allAbilities[Abilities.FLASH_FIRE]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLAME_BURST));
    await game.phaseInterceptor.to(SelectTargetPhase, false);
    game.doSelectTarget(leftEnemy.getBattlerIndex());
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp() - getEffectDamage(rightEnemy));
  });

  it("effect damage is prevented by Magic Guard", async () => {
    await game.startBattle([Species.PIKACHU, Species.PIKACHU]);
    const [ leftEnemy, rightEnemy ] = game.scene.getEnemyField();

    vi.spyOn(rightEnemy, "getAbility").mockReturnValue(allAbilities[Abilities.MAGIC_GUARD]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLAME_BURST));
    await game.phaseInterceptor.to(SelectTargetPhase, false);
    game.doSelectTarget(leftEnemy.getBattlerIndex());
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leftEnemy.hp).toBeLessThan(leftEnemy.getMaxHp());
    expect(rightEnemy.hp).toBe(rightEnemy.getMaxHp());
  });

  it("is not affected by protection moves and Endure", async () => {
    // TODO: update this test when it's possible to select move for each enemy
  }, { skip: true });
});
