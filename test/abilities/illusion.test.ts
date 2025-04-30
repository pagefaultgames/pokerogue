import { Gender } from "#app/data/gender";
import { PokeballType } from "#app/enums/pokeball";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Illusion", () => {
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
      .enemySpecies(Species.ZORUA)
      .enemyAbility(Abilities.ILLUSION)
      .enemyMoveset(Moves.TACKLE)
      .enemyHeldItems([{ name: "WIDE_LENS", count: 3 }])
      .moveset([Moves.WORRY_SEED, Moves.SOAK, Moves.TACKLE])
      .startingHeldItems([{ name: "WIDE_LENS", count: 3 }]);
  });

  it("creates illusion at battle start", async () => {
    await game.classicMode.startBattle([Species.ZOROARK, Species.AXEW]);
    const zoroark = game.scene.getPlayerPokemon()!;
    const zorua = game.scene.getEnemyPokemon()!;

    expect(zoroark.summonData.illusion).toBeTruthy();
    expect(zorua.summonData.illusion).toBeTruthy();
  });

  it("breaks after receiving damaging move", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);
    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("TurnEndPhase");

    const zorua = game.scene.getEnemyPokemon()!;

    expect(zorua.summonData.illusion).toBeFalsy();
    expect(zorua.name).toBe("Zorua");
  });

  it("breaks after getting ability changed", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);
    game.move.select(Moves.WORRY_SEED);

    await game.phaseInterceptor.to("TurnEndPhase");

    const zorua = game.scene.getEnemyPokemon()!;

    expect(zorua.summonData.illusion).toBeFalsy();
  });

  it("breaks with neutralizing gas", async () => {
    game.override.enemyAbility(Abilities.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([Species.KOFFING]);

    const zorua = game.scene.getEnemyPokemon()!;
    expect(zorua.summonData.illusion).toBeFalsy();
  });

  it("does not activate if neutralizing gas is active", async () => {
    game.override
      .enemyAbility(Abilities.NEUTRALIZING_GAS)
      .ability(Abilities.ILLUSION)
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS, Species.MAGIKARP]);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.summonData.illusion).toBeFalsy();
  });

  it("causes enemy AI to consider the illusion's type instead of the actual type when considering move effectiveness", async () => {
    game.override.enemyMoveset([Moves.FLAMETHROWER, Moves.PSYCHIC, Moves.TACKLE]);
    await game.classicMode.startBattle([Species.ZOROARK, Species.FEEBAS]);

    const enemy = game.scene.getEnemyPokemon()!;
    const zoroark = game.scene.getPlayerPokemon()!;

    const flameThrower = enemy.getMoveset()[0]!.getMove();
    const psychic = enemy.getMoveset()[1]!.getMove();
    const flameThrowerEffectiveness = zoroark.getAttackTypeEffectiveness(
      flameThrower.type,
      enemy,
      undefined,
      undefined,
      flameThrower,
      true,
    );
    const psychicEffectiveness = zoroark.getAttackTypeEffectiveness(
      psychic.type,
      enemy,
      undefined,
      undefined,
      psychic,
      true,
    );
    expect(psychicEffectiveness).toBeGreaterThan(flameThrowerEffectiveness);
  });

  it("does not break from indirect damage", async () => {
    game.override
      .enemySpecies(Species.GIGALITH)
      .enemyAbility(Abilities.SAND_STREAM)
      .enemyMoveset(Moves.WILL_O_WISP)
      .moveset(Moves.FLARE_BLITZ);

    await game.classicMode.startBattle([Species.ZOROARK, Species.AZUMARILL]);

    game.move.select(Moves.FLARE_BLITZ);

    await game.phaseInterceptor.to("TurnEndPhase");

    const zoroark = game.scene.getPlayerPokemon()!;

    expect(zoroark.summonData.illusion).toBeTruthy();
  });

  it("copies the the name, nickname, gender, shininess, and pokeball from the illusion source", async () => {
    game.override.enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.ABRA, Species.ZOROARK, Species.AXEW]);

    const axew = game.scene.getPlayerParty().at(2)!;
    axew.shiny = true;
    axew.nickname = btoa(unescape(encodeURIComponent("axew nickname")));
    axew.gender = Gender.FEMALE;
    axew.pokeball = PokeballType.GREAT_BALL;

    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase");

    const zoroark = game.scene.getPlayerPokemon()!;

    expect(zoroark.name).toBe("Axew");
    expect(zoroark.getNameToRender()).toBe("axew nickname");
    expect(zoroark.getGender(false, true)).toBe(Gender.FEMALE);
    expect(zoroark.isShiny(true)).toBe(true);
    expect(zoroark.getPokeball(true)).toBe(PokeballType.GREAT_BALL);
  });

  it("breaks when suppressed", async () => {
    game.override.moveset(Moves.GASTRO_ACID);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const zorua = game.scene.getEnemyPokemon()!;

    expect(zorua.summonData.illusion).toBeTruthy();

    game.move.select(Moves.GASTRO_ACID);
    await game.phaseInterceptor.to("BerryPhase");

    expect(zorua.isFullHp()).toBe(true);
    expect(zorua.summonData.illusion).toBeFalsy();
  });
});
