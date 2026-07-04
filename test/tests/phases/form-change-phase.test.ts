import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { PokemonFormChangeItemModifier } from "#modifiers/modifier";
import { FormChangeItemModifierType } from "#modifiers/modifier-type";
import { generateModifierType } from "#mystery-encounters/encounter-phase-utils";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Form Change Phase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("Zacian should successfully change into Crowned form", async () => {
    await game.classicMode.startBattle(SpeciesId.ZACIAN);

    const zacian = game.field.getPlayerPokemon();
    expect(zacian.getFormKey()).toBe("hero-of-many-battles");
    expect(zacian.getTypes()).toStrictEqual([PokemonType.FAIRY]);
    expect(zacian.calculateBaseStats()).toStrictEqual([92, 120, 115, 80, 115, 138]);

    const rustedSwordType = generateModifierType(modifierTypes.RARE_FORM_CHANGE_ITEM)!;
    const rustedSword = rustedSwordType.newModifier(zacian);
    await game.scene.addModifier(rustedSword);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.phaseInterceptor.log.includes("FormChangePhase")).toBe(true);
    expect(zacian.getFormKey()).toBe("crowned");
    expect(zacian.getTypes()).toStrictEqual([PokemonType.FAIRY, PokemonType.STEEL]);
    expect(zacian.calculateBaseStats()).toStrictEqual([92, 150, 115, 80, 115, 148]);
  });

  it.each([
    {
      name: "Zacian to Crowned Sword",
      species: SpeciesId.ZACIAN,
      ally: undefined as SpeciesId | undefined,
      moveset: [MoveId.IRON_HEAD, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL],
      item: FormChangeItem.RUSTED_SWORD,
      selectMove: MoveId.IRON_HEAD,
      expectedFormKey: "crowned",
      learns: [MoveId.BEHEMOTH_BLADE],
      forgets: [MoveId.IRON_HEAD],
      multiLearn: false,
    },
    {
      name: "Zamazenta to Crowned Shield",
      species: SpeciesId.ZAMAZENTA,
      ally: undefined as SpeciesId | undefined,
      moveset: [MoveId.IRON_HEAD, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL],
      item: FormChangeItem.RUSTED_SHIELD,
      selectMove: MoveId.IRON_HEAD,
      expectedFormKey: "crowned",
      learns: [MoveId.BEHEMOTH_BASH],
      forgets: [MoveId.IRON_HEAD],
      multiLearn: false,
    },
    {
      name: "Hoopa to Unbound",
      species: SpeciesId.HOOPA,
      ally: undefined as SpeciesId | undefined,
      moveset: [MoveId.HYPERSPACE_HOLE, MoveId.CONFUSION, MoveId.LIGHT_SCREEN, MoveId.DARK_PULSE],
      item: FormChangeItem.PRISON_BOTTLE,
      selectMove: MoveId.HYPERSPACE_HOLE,
      expectedFormKey: "unbound",
      learns: [MoveId.HYPERSPACE_FURY],
      forgets: [MoveId.HYPERSPACE_HOLE],
      multiLearn: false,
    },
    {
      name: "Necrozma to Dusk Mane",
      species: SpeciesId.NECROZMA,
      ally: SpeciesId.SOLGALEO as SpeciesId | undefined,
      moveset: [MoveId.CONFUSION, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH],
      item: FormChangeItem.N_SOLARIZER,
      selectMove: MoveId.CONFUSION,
      expectedFormKey: "dusk-mane",
      learns: [MoveId.SUNSTEEL_STRIKE],
      forgets: [MoveId.CONFUSION],
      multiLearn: false,
    },
    {
      name: "Necrozma to Dawn Wings",
      species: SpeciesId.NECROZMA,
      ally: SpeciesId.LUNALA as SpeciesId | undefined,
      moveset: [MoveId.CONFUSION, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH],
      item: FormChangeItem.N_LUNARIZER,
      selectMove: MoveId.CONFUSION,
      expectedFormKey: "dawn-wings",
      learns: [MoveId.MOONGEIST_BEAM],
      forgets: [MoveId.CONFUSION],
      multiLearn: false,
    },
    {
      name: "Kyurem to Black",
      species: SpeciesId.KYUREM,
      ally: SpeciesId.ZEKROM as SpeciesId | undefined,
      moveset: [MoveId.SCARY_FACE, MoveId.GLACIATE, MoveId.BLIZZARD, MoveId.DRAGON_BREATH],
      item: FormChangeItem.DARK_STONE,
      selectMove: MoveId.SCARY_FACE,
      expectedFormKey: "black",
      learns: [MoveId.FUSION_BOLT, MoveId.FREEZE_SHOCK],
      forgets: [MoveId.SCARY_FACE, MoveId.GLACIATE],
      multiLearn: true,
    },
    {
      name: "Kyurem to White",
      species: SpeciesId.KYUREM,
      ally: SpeciesId.RESHIRAM as SpeciesId | undefined,
      moveset: [MoveId.SCARY_FACE, MoveId.GLACIATE, MoveId.BLIZZARD, MoveId.DRAGON_BREATH],
      item: FormChangeItem.LIGHT_STONE,
      selectMove: MoveId.SCARY_FACE,
      expectedFormKey: "white",
      learns: [MoveId.FUSION_FLARE, MoveId.ICE_BURN],
      forgets: [MoveId.SCARY_FACE, MoveId.GLACIATE],
      multiLearn: true,
    },
  ])("$name should learn signature moves upon form change", async ({
    species,
    ally,
    moveset,
    item,
    selectMove,
    expectedFormKey,
    learns,
    forgets,
    multiLearn,
  }) => {
    game.override.moveset(moveset);
    await game.classicMode.startBattle(...(ally ? [species, ally] : [species]));

    const pokemon = game.field.getPlayerPokemon();
    if (ally) {
      game.scene.gameData.dexData[ally].caughtAttr = BigInt(1);
    }
    game.move.changeMoveset(pokemon, moveset);

    const itemType = new FormChangeItemModifierType(item);
    await game.scene.addModifier(itemType.newModifier(pokemon));

    game.move.select(selectMove);
    await game.phaseInterceptor.to(multiLearn ? "TurnInitPhase" : "LearnMovePhase");

    expect(pokemon.getFormKey()).toBe(expectedFormKey);
    for (const move of learns) {
      expect(pokemon.moveset.some(m => m?.moveId === move)).toBe(true);
    }
    for (const move of forgets) {
      expect(pokemon.moveset.some(m => m?.moveId === move)).toBe(false);
    }
  });

  it.each([
    {
      name: "Zacian Crowned to Hero",
      species: SpeciesId.ZACIAN,
      ally: undefined as SpeciesId | undefined,
      moveset: [MoveId.BEHEMOTH_BLADE, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL],
      changeMoveset: undefined as MoveId[] | undefined,
      item: FormChangeItem.RUSTED_SWORD,
      selectMove: MoveId.BEHEMOTH_BLADE,
      expectedFormKey: "hero-of-many-battles",
      learns: [MoveId.IRON_HEAD],
      forgets: [MoveId.BEHEMOTH_BLADE],
    },
    {
      name: "Zamazenta Crowned to Hero",
      species: SpeciesId.ZAMAZENTA,
      ally: undefined as SpeciesId | undefined,
      moveset: [MoveId.BEHEMOTH_BASH, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL],
      changeMoveset: undefined as MoveId[] | undefined,
      item: FormChangeItem.RUSTED_SHIELD,
      selectMove: MoveId.BEHEMOTH_BASH,
      expectedFormKey: "hero-of-many-battles",
      learns: [MoveId.IRON_HEAD],
      forgets: [MoveId.BEHEMOTH_BASH],
    },
    {
      name: "Hoopa Unbound to base",
      species: SpeciesId.HOOPA,
      ally: undefined as SpeciesId | undefined,
      moveset: [MoveId.HYPERSPACE_FURY, MoveId.CONFUSION, MoveId.LIGHT_SCREEN, MoveId.DARK_PULSE],
      changeMoveset: undefined as MoveId[] | undefined,
      item: FormChangeItem.PRISON_BOTTLE,
      selectMove: MoveId.HYPERSPACE_FURY,
      expectedFormKey: "",
      learns: [MoveId.HYPERSPACE_HOLE],
      forgets: [MoveId.HYPERSPACE_FURY],
    },
    {
      name: "Necrozma Dusk Mane to base",
      species: SpeciesId.NECROZMA,
      ally: SpeciesId.SOLGALEO as SpeciesId | undefined,
      moveset: undefined as MoveId[] | undefined,
      changeMoveset: [MoveId.SUNSTEEL_STRIKE, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH],
      item: FormChangeItem.N_SOLARIZER,
      selectMove: MoveId.SUNSTEEL_STRIKE,
      expectedFormKey: "",
      learns: [MoveId.CONFUSION],
      forgets: [MoveId.SUNSTEEL_STRIKE],
    },
    {
      name: "Necrozma Dawn Wings to base",
      species: SpeciesId.NECROZMA,
      ally: SpeciesId.LUNALA as SpeciesId | undefined,
      moveset: undefined as MoveId[] | undefined,
      changeMoveset: [MoveId.MOONGEIST_BEAM, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH],
      item: FormChangeItem.N_LUNARIZER,
      selectMove: MoveId.MOONGEIST_BEAM,
      expectedFormKey: "",
      learns: [MoveId.CONFUSION],
      forgets: [MoveId.MOONGEIST_BEAM],
    },
    {
      name: "Black Kyurem to base",
      species: SpeciesId.KYUREM,
      ally: SpeciesId.ZEKROM as SpeciesId | undefined,
      moveset: undefined as MoveId[] | undefined,
      changeMoveset: [MoveId.FUSION_BOLT, MoveId.FREEZE_SHOCK, MoveId.ICY_WIND, MoveId.DRAGON_BREATH],
      item: FormChangeItem.DARK_STONE,
      selectMove: MoveId.FUSION_BOLT,
      expectedFormKey: "",
      learns: [MoveId.SCARY_FACE, MoveId.GLACIATE],
      forgets: [MoveId.FUSION_BOLT, MoveId.FREEZE_SHOCK],
    },
    {
      name: "White Kyurem to base",
      species: SpeciesId.KYUREM,
      ally: SpeciesId.RESHIRAM as SpeciesId | undefined,
      moveset: undefined as MoveId[] | undefined,
      changeMoveset: [MoveId.FUSION_FLARE, MoveId.ICE_BURN, MoveId.ICY_WIND, MoveId.DRAGON_BREATH],
      item: FormChangeItem.LIGHT_STONE,
      selectMove: MoveId.FUSION_FLARE,
      expectedFormKey: "",
      learns: [MoveId.SCARY_FACE, MoveId.GLACIATE],
      forgets: [MoveId.FUSION_FLARE, MoveId.ICE_BURN],
    },
  ])("$name should revert and restore previous form's moves", async ({
    species,
    ally,
    moveset,
    changeMoveset,
    item,
    selectMove,
    expectedFormKey,
    learns,
    forgets,
  }) => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    if (moveset) {
      game.override.moveset(moveset);
    }
    await game.classicMode.startBattle(...(ally ? [species, ally] : [species]));

    const pokemon = game.field.getPlayerPokemon();
    if (ally) {
      game.scene.gameData.dexData[ally].caughtAttr = BigInt(1);
    }
    if (changeMoveset) {
      game.move.changeMoveset(pokemon, changeMoveset);
    } else if (moveset) {
      game.move.changeMoveset(pokemon, moveset);
    }

    const itemType = new FormChangeItemModifierType(item);
    await game.scene.addModifier(itemType.newModifier(pokemon));

    game.move.select(selectMove);
    await game.phaseInterceptor.to("TurnInitPhase");

    const formChangeItem = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(formChangeItem);

    game.move.select(selectMove);
    await game.phaseInterceptor.to("TurnInitPhase");

    expect(pokemon.getFormKey()).toBe(expectedFormKey);
    for (const move of learns) {
      expect(pokemon.moveset.some(m => m?.moveId === move)).toBe(true);
    }
    for (const move of forgets) {
      expect(pokemon.moveset.some(m => m?.moveId === move)).toBe(false);
    }
  });

  /* Special cases */

  it("(Ultra) Necrozma should change to Dusk Mane form and try to learn Moongeist Beam", async () => {
    game.override
      .moveset([MoveId.SUNSTEEL_STRIKE, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.runToSummon(SpeciesId.NECROZMA, SpeciesId.SOLGALEO);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.SOLGALEO].caughtAttr = BigInt(1);

    necrozma.formIndex = 1;
    await necrozma.updateInfo();

    const nSolarizerModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.N_SOLARIZER),
      necrozma.id,
      FormChangeItem.N_SOLARIZER,
      true,
    );
    game.scene.modifiers.push(nSolarizerModifier);

    const ultraType = new FormChangeItemModifierType(FormChangeItem.ULTRANECROZIUM_Z);
    await game.scene.addModifier(ultraType.newModifier(necrozma));

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(3);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    expect(necrozma.getFormKey()).toBe("ultra");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.NIGHT_SLASH)).toBe(false);
  });

  it("(Ultra) Necrozma should change to Dawn Wings form and try to learn Sunsteel Strike", async () => {
    game.override
      .moveset([MoveId.MOONGEIST_BEAM, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.runToSummon(SpeciesId.NECROZMA, SpeciesId.LUNALA);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.LUNALA].caughtAttr = BigInt(1);

    necrozma.formIndex = 2;
    await necrozma.updateInfo();

    const nLunarizerModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.N_LUNARIZER),
      necrozma.id,
      FormChangeItem.N_LUNARIZER,
      true,
    );
    game.scene.modifiers.push(nLunarizerModifier);

    const ultraType = new FormChangeItemModifierType(FormChangeItem.ULTRANECROZIUM_Z);
    await game.scene.addModifier(ultraType.newModifier(necrozma));

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(3);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    expect(necrozma.getFormKey()).toBe("ultra");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.NIGHT_SLASH)).toBe(false);
  });

  it("(Dusk Mane) Ultra Necrozma should forget Moongeist Beam when returned to non ultra form", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.runToSummon(SpeciesId.NECROZMA, SpeciesId.SOLGALEO);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.SOLGALEO].caughtAttr = BigInt(1);

    necrozma.formIndex = 3;
    game.move.changeMoveset(necrozma, [
      MoveId.SUNSTEEL_STRIKE,
      MoveId.MOONGEIST_BEAM,
      MoveId.SLASH,
      MoveId.NIGHT_SLASH,
    ]);

    const nSolarizerModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.N_SOLARIZER),
      necrozma.id,
      FormChangeItem.N_SOLARIZER,
      true,
    );
    game.scene.modifiers.push(nSolarizerModifier);

    const ultraModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.ULTRANECROZIUM_Z),
      necrozma.id,
      FormChangeItem.ULTRANECROZIUM_Z,
      true,
    );
    game.scene.modifiers.push(ultraModifier);

    ultraModifier.apply(necrozma, false);
    await game.phaseInterceptor.to("FormChangePhase");

    expect(necrozma.getFormKey()).toBe("dusk-mane");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(false);
  });

  it("(Dawn Wings) Necrozma should forget Sunsteel Strike when returned to non ultra form", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.runToSummon(SpeciesId.NECROZMA, SpeciesId.LUNALA);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.LUNALA].caughtAttr = BigInt(1);

    necrozma.formIndex = 3;
    game.move.changeMoveset(necrozma, [
      MoveId.SUNSTEEL_STRIKE,
      MoveId.MOONGEIST_BEAM,
      MoveId.SLASH,
      MoveId.NIGHT_SLASH,
    ]);

    const nLunarizerModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.N_LUNARIZER),
      necrozma.id,
      FormChangeItem.N_LUNARIZER,
      true,
    );
    game.scene.modifiers.push(nLunarizerModifier);

    const ultraModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.ULTRANECROZIUM_Z),
      necrozma.id,
      FormChangeItem.ULTRANECROZIUM_Z,
      true,
    );
    game.scene.modifiers.push(ultraModifier);

    ultraModifier.apply(necrozma, false);
    await game.phaseInterceptor.to("FormChangePhase");

    expect(necrozma.getFormKey()).toBe("dawn-wings");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(false);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(true);
  });

  it("Calyrex should change to Ice Rider form and learn Glacial Lance", async () => {
    game.override.moveset([MoveId.POUND, MoveId.TACKLE, MoveId.STOMP, MoveId.SWORDS_DANCE]);
    await game.classicMode.runToSummon(SpeciesId.CALYREX, SpeciesId.GLASTRIER);

    const calyrex = game.field.getPlayerPokemon();
    expect(calyrex.getFormKey()).toBe("");
    game.scene.gameData.dexData[SpeciesId.GLASTRIER].caughtAttr = BigInt(1);

    const icyReinsType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    await game.scene.addModifier(icyReinsType.newModifier(calyrex));

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(0);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    expect(calyrex.getFormKey()).toBe("ice");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.GLACIAL_LANCE)).toBe(true);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.POUND)).toBe(false);
  });

  it("Calyrex should change to Shadow Rider form and learn Astral Barrage", async () => {
    game.override.moveset([MoveId.POUND, MoveId.TACKLE, MoveId.STOMP, MoveId.SWORDS_DANCE]);
    await game.classicMode.runToSummon(SpeciesId.CALYREX, SpeciesId.SPECTRIER);

    const calyrex = game.field.getPlayerPokemon();
    expect(calyrex.getFormKey()).toBe("");
    game.scene.gameData.dexData[SpeciesId.SPECTRIER].caughtAttr = BigInt(1);

    const shadowReinsType = new FormChangeItemModifierType(FormChangeItem.SHADOW_REINS_OF_UNITY);
    await game.scene.addModifier(shadowReinsType.newModifier(calyrex));

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(0);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    expect(calyrex.getFormKey()).toBe("shadow");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.ASTRAL_BARRAGE)).toBe(true);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.POUND)).toBe(false);
  });

  it("Calyrex should forget form-specific moves when returning to default form", async () => {
    game.override
      .moveset([MoveId.POUND, MoveId.TACKLE, MoveId.STOMP, MoveId.GLACIAL_LANCE])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.CALYREX, SpeciesId.GLASTRIER);

    const calyrex = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.GLASTRIER].caughtAttr = BigInt(1);

    const icyReinsType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    await game.scene.addModifier(icyReinsType.newModifier(calyrex));

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(calyrex.getFormKey()).toBe("ice");

    const newIcyReins = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newIcyReins);

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("FormChangePhase");

    expect(calyrex.getFormKey()).toBe("");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.GLACIAL_LANCE)).toBe(false);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.POUND)).toBe(true);
  });

  it("Calyrex should learn Confusion if there are no more moves left after returning to default form", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.CALYREX, SpeciesId.GLASTRIER);

    const calyrex = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.GLASTRIER].caughtAttr = BigInt(1);
    game.move.changeMoveset(calyrex, [MoveId.GLACIAL_LANCE]);

    const icyReinsType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    await game.scene.addModifier(icyReinsType.newModifier(calyrex));

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(calyrex.getFormKey()).toBe("ice");

    const newIcyReins = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newIcyReins);

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("LearnMovePhase");

    expect(calyrex.getFormKey()).toBe("");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.CONFUSION)).toBe(true);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.GLACIAL_LANCE)).toBe(false);
  });
});
