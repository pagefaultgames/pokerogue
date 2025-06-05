import { Gender } from "#app/data/gender";
import { PokeballType } from "#app/enums/pokeball";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .enemySpecies(SpeciesId.ZORUA)
      .enemyAbility(AbilityId.ILLUSION)
      .enemyMoveset(MoveId.TACKLE)
      .enemyHeldItems([{ name: "WIDE_LENS", count: 3 }])
      .moveset([MoveId.WORRY_SEED, MoveId.SOAK, MoveId.TACKLE])
      .startingHeldItems([{ name: "WIDE_LENS", count: 3 }]);
  });

  it("creates illusion at the start", async () => {
    await game.classicMode.startBattle([SpeciesId.ZOROARK, SpeciesId.FEEBAS]);
    const zoroark = game.scene.getPlayerPokemon()!;
    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zoroark.summonData.illusion).equals(true);
    expect(!!zorua.summonData.illusion).equals(true);
  });

  it("break after receiving damaging move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("TurnEndPhase");

    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zorua.summonData.illusion).equals(false);
    expect(zorua.name).equals("Zorua");
  });

  it("break after getting ability changed", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    game.move.select(MoveId.WORRY_SEED);

    await game.phaseInterceptor.to("TurnEndPhase");

    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zorua.summonData.illusion).equals(false);
  });

  it("breaks with neutralizing gas", async () => {
    game.override.enemyAbility(AbilityId.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([SpeciesId.KOFFING]);

    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zorua.summonData.illusion).equals(false);
  });

  it("does not activate if neutralizing gas is active", async () => {
    game.override
      .enemyAbility(AbilityId.NEUTRALIZING_GAS)
      .ability(AbilityId.ILLUSION)
      .moveset(MoveId.SPLASH)
      .enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.summonData.illusion).toBeFalsy();
  });

  it("causes enemy AI to consider the illusion's type instead of the actual type when considering move effectiveness", async () => {
    game.override.enemyMoveset([MoveId.FLAMETHROWER, MoveId.PSYCHIC, MoveId.TACKLE]);
    await game.classicMode.startBattle([SpeciesId.ZOROARK, SpeciesId.FEEBAS]);

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
    expect(psychicEffectiveness).above(flameThrowerEffectiveness);
  });

  it("does not break from indirect damage", async () => {
    game.override.enemySpecies(SpeciesId.GIGALITH);
    game.override.enemyAbility(AbilityId.SAND_STREAM);
    game.override.enemyMoveset(MoveId.WILL_O_WISP);
    game.override.moveset([MoveId.FLARE_BLITZ]);

    await game.classicMode.startBattle([SpeciesId.ZOROARK, SpeciesId.AZUMARILL]);

    game.move.select(MoveId.FLARE_BLITZ);

    await game.phaseInterceptor.to("TurnEndPhase");

    const zoroark = game.scene.getPlayerPokemon()!;

    expect(!!zoroark.summonData.illusion).equals(true);
  });

  it("copies the the name, nickname, gender, shininess, and pokeball from the illusion source", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.ZOROARK, SpeciesId.AXEW]);
    const axew = game.scene.getPlayerParty().at(2)!;
    axew.shiny = true;
    axew.nickname = btoa(unescape(encodeURIComponent("axew nickname")));
    axew.gender = Gender.FEMALE;
    axew.pokeball = PokeballType.GREAT_BALL;

    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase");

    const zoroark = game.scene.getPlayerPokemon()!;

    expect(zoroark.name).equals("Axew");
    expect(zoroark.getNameToRender()).equals("axew nickname");
    expect(zoroark.getGender(false, true)).equals(Gender.FEMALE);
    expect(zoroark.isShiny(true)).equals(true);
    expect(zoroark.getPokeball(true)).equals(PokeballType.GREAT_BALL);
  });

  it("breaks when suppressed", async () => {
    game.override.moveset(MoveId.GASTRO_ACID);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zorua.summonData?.illusion).toBe(true);

    game.move.select(MoveId.GASTRO_ACID);
    await game.phaseInterceptor.to("BerryPhase");

    expect(zorua.isFullHp()).toBe(true);
    expect(!!zorua.summonData?.illusion).toBe(false);
  });
});
