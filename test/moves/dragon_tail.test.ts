import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/moves/move";
import { Challenges } from "#enums/challenges";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleType } from "#enums/battle-type";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { splitArray } from "#app/utils/common";
import { BattlerTagType } from "#enums/battler-tag-type";

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
    game.override
      .battleStyle("single")
      .moveset([Moves.DRAGON_TAIL, Moves.SPLASH, Moves.FLAMETHROWER])
      .enemySpecies(Species.WAILORD)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(5)
      .enemyLevel(5);

    vi.spyOn(allMoves[Moves.DRAGON_TAIL], "accuracy", "get").mockReturnValue(100);
  });

  it("should cause opponent to flee, display ability, and not crash", async () => {
    game.override.enemyAbility(Abilities.ROUGH_SKIN);
    await game.classicMode.startBattle([Species.DRATINI]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DRAGON_TAIL);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(isVisible).toBe(false);
    expect(hasFled).toBe(true);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  });

  it("should proceed without crashing in a double battle", async () => {
    game.override.battleStyle("double").enemyMoveset(Moves.SPLASH).enemyAbility(Abilities.ROUGH_SKIN);
    await game.classicMode.startBattle([Species.DRATINI, Species.DRATINI, Species.WAILORD, Species.WAILORD]);

    const leadPokemon = game.scene.getPlayerParty()[0]!;

    const enemyLeadPokemon = game.scene.getEnemyParty()[0]!;
    const enemySecPokemon = game.scene.getEnemyParty()[1]!;

    game.move.select(Moves.DRAGON_TAIL, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("TurnEndPhase");

    const isVisibleLead = enemyLeadPokemon.visible;
    const hasFledLead = enemyLeadPokemon.switchOutStatus;
    const isVisibleSec = enemySecPokemon.visible;
    const hasFledSec = enemySecPokemon.switchOutStatus;
    expect(!isVisibleLead && hasFledLead && isVisibleSec && !hasFledSec).toBe(true);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());

    // second turn
    game.move.select(Moves.FLAMETHROWER, 0, BattlerIndex.ENEMY_2);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");
    expect(enemySecPokemon.hp).toBeLessThan(enemySecPokemon.getMaxHp());
  });

  it("should force trainers to switch randomly without selecting from a partner's party", async () => {
    game.override
      .battleStyle("double")
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.STURDY)
      .battleType(BattleType.TRAINER)
      .randomTrainer({ trainerType: TrainerType.TATE, alwaysDouble: true })
      .enemySpecies(0);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRANITAR]);

    // Grab each trainer's pokemon based on species name
    const [tateParty, lizaParty] = splitArray(
      game.scene.getEnemyParty(),
      pkmn => pkmn.trainerSlot === TrainerSlot.TRAINER,
    ).map(a => a.map(p => p.species.name));

    expect(tateParty).not.toEqual(lizaParty);

    // Force enemy trainers to switch to the first mon available.
    // Due to how enemy trainer parties are laid out, this prevents false positives
    // as Tate's pokemon are placed immediately before Liza's corresponding members.
    vi.fn(Phaser.Math.RND.integerInRange).mockImplementation(min => min);

    // Spy on the function responsible for making informed switches
    const choiceSwitchSpy = vi.spyOn(game.scene.currentBattle.trainer!, "getNextSummonIndex");

    game.move.select(Moves.DRAGON_TAIL, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    const [tatePartyNew, lizaPartyNew] = splitArray(
      game.scene.getEnemyParty(),
      pkmn => pkmn.trainerSlot === TrainerSlot.TRAINER,
    ).map(a => a.map(p => p.species.name));

    // Forced switch move should have switched Liza's Pokemon with another one of her own at random
    expect(tatePartyNew).toEqual(tateParty);
    expect(lizaPartyNew).not.toEqual(lizaParty);
    expect(choiceSwitchSpy).not.toHaveBeenCalled();
  });

  it("should redirect targets upon opponent flee", async () => {
    game.override.battleStyle("double").enemyMoveset(Moves.SPLASH).enemyAbility(Abilities.ROUGH_SKIN);
    await game.classicMode.startBattle([Species.DRATINI, Species.DRATINI, Species.WAILORD, Species.WAILORD]);

    const leadPokemon = game.scene.getPlayerParty()[0]!;
    const secPokemon = game.scene.getPlayerParty()[1]!;

    const enemyLeadPokemon = game.scene.getEnemyParty()[0]!;
    const enemySecPokemon = game.scene.getEnemyParty()[1]!;

    game.move.select(Moves.DRAGON_TAIL, 0, BattlerIndex.ENEMY);
    // target the same pokemon, second move should be redirected after first flees
    game.move.select(Moves.DRAGON_TAIL, 1, BattlerIndex.ENEMY);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisibleLead = enemyLeadPokemon.visible;
    const hasFledLead = enemyLeadPokemon.switchOutStatus;
    const isVisibleSec = enemySecPokemon.visible;
    const hasFledSec = enemySecPokemon.switchOutStatus;
    expect(!isVisibleLead && hasFledLead && !isVisibleSec && hasFledSec).toBe(true);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
    expect(secPokemon.hp).toBeLessThan(secPokemon.getMaxHp());
    expect(enemyLeadPokemon.hp).toBeLessThan(enemyLeadPokemon.getMaxHp());
    expect(enemySecPokemon.hp).toBeLessThan(enemySecPokemon.getMaxHp());
  });

  it("should not switch out a target with suction cups", async () => {
    game.override.enemyAbility(Abilities.SUCTION_CUPS);
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DRAGON_TAIL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isOnField()).toBe(true);
    expect(enemy.isFullHp()).toBe(false);
  });

  it("should not switch out a Commanded Dondozo", async () => {
    game.override.battleStyle("double").enemySpecies(Species.DONDOZO);
    await game.classicMode.startBattle([Species.REGIELEKI]);

    // pretend dondozo 2 commanded dondozo 1 (silly I know, but it works)
    const [dondozo1, dondozo2] = game.scene.getEnemyField();
    dondozo1.addTag(BattlerTagType.COMMANDED, 1, Moves.NONE, dondozo2.id);

    game.move.select(Moves.DRAGON_TAIL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(dondozo1.isOnField()).toBe(true);
    expect(dondozo1.isFullHp()).toBe(false);
  });

  it("should force a switch upon fainting an opponent normally", async () => {
    game.override.startingWave(5).startingLevel(1000); // To make sure Dragon Tail KO's the opponent
    await game.classicMode.startBattle([Species.DRATINI]);

    game.move.select(Moves.DRAGON_TAIL);

    await game.toNextTurn();

    // Make sure the enemy switched to a healthy Pokemon
    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).toBeDefined();
    expect(enemy.isFullHp()).toBe(true);

    // Make sure the enemy has a fainted Pokemon in their party and not on the field
    const faintedEnemy = game.scene.getEnemyParty().find(p => !p.isAllowedInBattle());
    expect(faintedEnemy).toBeDefined();
    expect(game.scene.getEnemyField().length).toBe(1);
  });

  it("should not cause a softlock when activating an opponent trainer's reviver seed", async () => {
    game.override
      .startingWave(5)
      .enemyHeldItems([{ name: "REVIVER_SEED" }])
      .startingLevel(1000); // To make sure Dragon Tail KO's the opponent
    await game.classicMode.startBattle([Species.DRATINI]);

    game.move.select(Moves.DRAGON_TAIL);

    await game.toNextTurn();

    // Make sure the enemy field is not empty and has a revived Pokemon
    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).toBeDefined();
    expect(enemy.hp).toBe(Math.floor(enemy.getMaxHp() / 2));
    expect(game.scene.getEnemyField().length).toBe(1);
  });

  it("should not cause a softlock when activating a player's reviver seed", async () => {
    game.override
      .startingHeldItems([{ name: "REVIVER_SEED" }])
      .enemyMoveset(Moves.DRAGON_TAIL)
      .enemyLevel(1000); // To make sure Dragon Tail KO's the player
    await game.classicMode.startBattle([Species.DRATINI, Species.BULBASAUR]);

    game.move.select(Moves.SPLASH);

    await game.toNextTurn();

    // Make sure the player's field is not empty and has a revived Pokemon
    const dratini = game.scene.getPlayerPokemon()!;
    expect(dratini).toBeDefined();
    expect(dratini.hp).toBe(Math.floor(dratini.getMaxHp() / 2));
    expect(game.scene.getPlayerField().length).toBe(1);
  });

  it("should force switches randomly", async () => {
    game.override.enemyMoveset(Moves.DRAGON_TAIL).startingLevel(100).enemyLevel(1);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that calls for switching to 1st backup Pokemon (Charmander)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.DRAGON_TAIL);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(true);
    expect(squirtle.isOnField()).toBe(false);
    expect(bulbasaur.getInverseHp()).toBeGreaterThan(0);

    // Turn 2: Mock an RNG call that calls for switching to 2nd backup Pokemon (Squirtle)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min + 1;
    });
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(false);
    expect(squirtle.isOnField()).toBe(true);
    expect(charmander.getInverseHp()).toBeGreaterThan(0);
  });

  it("should not force a switch to a fainted or challenge-ineligible Pokemon", async () => {
    game.override.enemyMoveset(Moves.DRAGON_TAIL).startingLevel(100).enemyLevel(1);
    // Mono-Water challenge, Eevee is ineligible
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
    await game.challengeMode.startBattle([Species.LAPRAS, Species.EEVEE, Species.TOXAPEX, Species.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();
    expect(toxapex).toBeDefined();

    // Mock an RNG call to switch to the first eligible pokemon.
    // Eevee is ineligible and Toxapex is fainted, so it should proc on Primarina instead
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.killPokemon(toxapex);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(false);
    expect(primarina.isOnField()).toBe(true);
    expect(lapras.getInverseHp()).toBeGreaterThan(0);
  });

  it("should deal damage without switching if there are no available backup Pokemon to switch into", async () => {
    game.override.enemyMoveset(Moves.DRAGON_TAIL).battleStyle("double").startingLevel(100).enemyLevel(1);
    // Mono-Water challenge
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
    await game.challengeMode.startBattle([Species.LAPRAS, Species.KYOGRE, Species.EEVEE, Species.CLOYSTER]);

    const [lapras, kyogre, eevee, cloyster] = game.scene.getPlayerParty();
    expect(cloyster).toBeDefined();

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.DRAGON_TAIL, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.DRAGON_TAIL, BattlerIndex.PLAYER_2);
    await game.killPokemon(cloyster);
    await game.toNextTurn();

    // Eevee is ineligble due to challenge and cloyster is fainted, leaving no backup pokemon able to switch in
    expect(lapras.isOnField()).toBe(true);
    expect(kyogre.isOnField()).toBe(true);
    expect(eevee.isOnField()).toBe(false);
    expect(cloyster.isOnField()).toBe(false);
    expect(lapras.getInverseHp()).toBeGreaterThan(0);
    expect(kyogre.getInverseHp()).toBeGreaterThan(0);
    expect(game.scene.getBackupPartyMemberIndices(true)).toHaveLength(0);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  });
});
