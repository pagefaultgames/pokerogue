import BattleScene from "../battle-scene";
import { GameModes } from "../game-mode";
import UiHandler from "./ui-handler";
import { SessionSaveData } from "../system/game-data";
import { TextStyle, addTextObject, addBBCodeTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import PokemonData from "../system/pokemon-data";
import i18next from "i18next";
import {Button} from "../enums/buttons";
import { BattleType } from "../battle";
import { TrainerVariant } from "../field/trainer";
import { Challenges } from "#enums/challenges";
import { getLuckString, getLuckTextTint } from "../modifier/modifier-type";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle.js";
import { Type, getTypeRgb } from "../data/type";
import { starterPassiveAbilities } from "../data/pokemon-species";
import { getNatureStatMultiplier, getNatureName } from "../data/nature";
import { allAbilities } from "../data/ability";
import { getVariantTint } from "#app/data/variant";
import { PokemonHeldItemModifier } from "../modifier/modifier";

/*
enum Page {
  GENERAL,
  STATS,
  HALL_OF_FAME
}
*/

export enum RunVictory {
  DEFEATED,
  VICTORY
}

export default class GameInfoUiHandler extends UiHandler {
  private runInfo: SessionSaveData;
  private victory: Boolean;

  private gameStatsContainer: Phaser.GameObjects.Container;
  private statsContainer: Phaser.GameObjects.Container;

  private runInfoContainer: Phaser.GameObjects.Container;
  private partyContainer: Phaser.GameObjects.Container;
  private statsBgWidth: integer;
  private partyContainerHeight: integer;
  private partyContainerWidth: integer;

  private hallofFameContainer: Phaser.GameObjects.Container;

  private partyInfo: Phaser.GameObjects.Container[];

  private statValues: Phaser.GameObjects.Text[];

  constructor(scene: BattleScene) {
    super(scene, Mode.RUN_INFO);
  }

  	setup() {

    //const ui = this.getUi();
 		//const page = 0;

 		this.gameStatsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.gameStatsContainer.setVisible(false);
 	}

 	show(args: any[]): boolean {
 		super.show(args);

    this.statsBgWidth = ((this.scene.game.canvas.width / 6) - 2) / 3;

    this.runInfoContainer = this.scene.add.container(0, 24);

    this.partyContainer = this.scene.add.container(this.statsBgWidth-10, 24);

    this.setCursor(0);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, i18next.t("runHistory:runInfo"), TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);
    this.gameStatsContainer.add(headerBg);
    this.gameStatsContainer.add(headerText);


    this.partyContainerWidth = (this.statsBgWidth*2)+10;
    this.partyContainerHeight = (this.scene.game.canvas.height / 6) - 25;
    const partyInfoWindow = addWindow(this.scene, 0, 0, (this.statsBgWidth*2)+10, (this.scene.game.canvas.height / 6) - 25);
    partyInfoWindow.setOrigin(0,0);

    this.partyContainer.add(partyInfoWindow);

    const runInfoWindow = addWindow(this.scene, 0, 0, this.statsBgWidth-10, (this.scene.game.canvas.height / 6) - 25);
    runInfoWindow.setOrigin(0, 0);
    this.runInfoContainer.add(runInfoWindow);

 		const run = args[0];
 		const runHistoryOrigin = args[1] ? true : false;

 		this.runInfo = this.scene.gameData.parseSessionData(JSON.stringify(run.entry));
    this.victory = run.victory;

 		this.parseRunInfo(this.runInfo, runHistoryOrigin, run.victory);

    const partyData = runHistoryOrigin ? this.runInfo.party : {};
    this.parsePartyInfo(partyData);

    this.gameStatsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);


    this.getUi().bringToTop(this.gameStatsContainer);
    this.gameStatsContainer.setVisible(true);


    this.setCursor(0);

    this.getUi().add(this.gameStatsContainer);
    //this.updateStats();

    this.getUi().hideTooltip();

    return true;
 	}

 	async parseRunInfo(runData:any, runHistoryOrigin: boolean, runResult: boolean = false) {
 		const genInfoText = addBBCodeTextObject(this.scene, 6, 18, "", TextStyle.WINDOW, {fontSize : "55px"});
 		if (runHistoryOrigin) {
 				const runResultText = addTextObject(this.scene, 6, 3, `${(runResult ? i18next.t("runHistory:victory") : i18next.t("runHistory:defeated")+" - Wave "+runData.waveIndex)}`, TextStyle.WINDOW, {fontSize : "65px"});
 				runResultText.appendText(new Date(runData.timestamp).toLocaleString());
 				this.runInfoContainer.add(runResultText);
 		}
 		genInfoText.appendText(i18next.t("runHistory:mode")+": ");
 		switch (runData.gameMode) {
    		case GameModes.DAILY:
    			genInfoText.appendText(`${i18next.t("gameMode:dailyRun")}`, false);
    			break;
    		case GameModes.SPLICED_ENDLESS:
    			genInfoText.appendText(`${i18next.t("gameMode:endlessSpliced")}`, false);
    			break;
    		case GameModes.CHALLENGE:
    			genInfoText.appendText(`${i18next.t("gameMode:challenge")}`, false);
    			genInfoText.appendText(`\t\t${i18next.t("runHistory:challengeRules")}: `);
      const runChallenges = runData.challenges;
      const rules = [];
      for (let i = 0; i < runChallenges.length; i++) {
        if (runChallenges[i].id === Challenges.SINGLE_GENERATION && runChallenges[i].value !== 0) {
          rules.push(i18next.t(`runHistory:challengeMonoGen${runChallenges[i].value}` as const));
        } else if (runChallenges[i].id === Challenges.SINGLE_TYPE && runChallenges[i].value !== 0) {
          rules.push(i18next.t(`pokemonInfo:Type.${Type[runChallenges[i].value-1]}` as const));
        }
      }
      if (rules) {
        for (let i = 0; i < rules.length; i++) {
          if (i > 0) {
            genInfoText.appendText(" + ", false);
          }
          genInfoText.appendText(rules[i], false);
        }
      }
    			break;
    		case GameModes.ENDLESS:
      genInfoText.appendText(`${i18next.t("gameMode:endless")}`, false);
      break;
    		case GameModes.CLASSIC:
      genInfoText.appendText(`${i18next.t("gameMode:classic")}`, false);
    			break;
    	}



    genInfoText.appendText(`${i18next.t("runHistory:money")}: ${Utils.formatLargeNumber(runData.money, 1000)}`);

    const luckValue = Phaser.Math.Clamp(runData.party.map(p => p.toPokemon(this.scene).getLuck()).reduce((total: integer, value: integer) => total += value, 0), 0, 14);
    if (luckValue < 14) {
      const luckTextTint = "[color=#"+(getLuckTextTint(luckValue)).toString(16)+"]";
      genInfoText.appendText(`${luckTextTint}${i18next.t("runHistory:luck")}: ${getLuckString(luckValue)}[/color]`);
    } else {
      const sssLuckText = addTextObject(this.scene, 0, 0, `${i18next.t("runHistory:luck")}: ${getLuckString(luckValue)}`, TextStyle.WINDOW, {fontSize: "55px"});
      sssLuckText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
      sssLuckText.setPosition(6, 67);
      this.runInfoContainer.add(sssLuckText);
    }

    	if (runHistoryOrigin && !runResult) {
    		const enemyContainer = this.scene.add.container(2, -42);
    		//Wild - Single and Doubles
    		if (runData.battleType === BattleType.WILD) {
    			runData.enemyParty.forEach((enemyData, e) => {
          const enemyIconContainer = this.scene.add.container(8+(e*24),63);
          enemyIconContainer.setScale(0.75);
          const bossStatus = enemyData.boss;
          enemyData.boss = false;
          const enemy = enemyData.toPokemon(this.scene);
          const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
          const enemyLevel = addTextObject(this.scene, 32, 24, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, bossStatus ? TextStyle.PARTY_RED : TextStyle.PARTY, { fontSize: "44px", color: "#f8f8f8" });
          enemyLevel.setShadow(0, 0, null);
          enemyLevel.setStroke("#424242", 14);
          enemyLevel.setOrigin(1, 0);
          enemyIconContainer.add(enemyIcon);
          enemyIconContainer.add(enemyLevel);
          enemyContainer.add(enemyIconContainer);
         	  enemy.destroy();
       		});
        genInfoText.setPosition(6,38);
    		//Trainer - Single and Double
    		} else if (runData.battleType === BattleType.TRAINER) {
    		  const tObj = runData.trainer.toTrainer(this.scene);
        const tObjSpriteKey = tObj.config.getSpriteKey(runData.trainer.variant === TrainerVariant.FEMALE, false);
        const tObjSprite = this.scene.add.sprite(3, 75, tObjSpriteKey);
        if (runData.trainer.variant === TrainerVariant.DOUBLE) {
          const doubleContainer = this.scene.add.container(5, 80);
          tObjSprite.setPosition(-3, -3);
          const tObjPartnerSpriteKey = tObj.config.getSpriteKey(true, true);
          const tObjPartnerSprite = this.scene.add.sprite(5, -3, tObjPartnerSpriteKey);
          tObjPartnerSprite.setScale(0.20);
          tObjSprite.setScale(0.20);
          doubleContainer.add(tObjSprite);
          doubleContainer.add(tObjPartnerSprite);
          enemyContainer.add(doubleContainer);
        } else {
          tObjSprite.setScale(0.25, 0.25);
          tObjSprite.setPosition(6, 82);
          enemyContainer.add(tObjSprite);
        }

        const teraPokemon = {};
        runData.enemyModifiers.forEach((m) => {
          if (m.className === "TerastallizeModifier") {
            teraPokemon[m.args[0]] = m.args[1];
          }
        });

        runData.enemyParty.forEach((enemyData, e) => {
          const pokemonRowHeight = Math.floor(e/3);
          const enemyIconContainer = this.scene.add.container(8+((e%3)*12), 66);
          enemyIconContainer.setScale(0.5);
          const isBoss = enemyData.boss;
          enemyData.boss = false;
          const enemy = enemyData.toPokemon(this.scene);
          const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
          const enemySprite1 = enemyIcon.list[0] as Phaser.GameObjects.Sprite;
          const enemySprite2 = (enemyIcon.list.length > 1) ? enemyIcon.list[1] as Phaser.GameObjects.Sprite : null;
          if (teraPokemon[enemyData.id]) {
            const teraTint = getTypeRgb(teraPokemon[enemyData.id]);
            const teraColor = new Phaser.Display.Color(teraTint[0], teraTint[1], teraTint[2]);
            enemySprite1.setTint(teraColor.color);
            if (enemySprite2) {
              enemySprite2.setTint(teraColor.color);
            }
          }
          enemyIcon.setPosition(34+(24 * (e%3)), 0+(35*pokemonRowHeight));
          const enemyLevel = addTextObject(this.scene, (26*(e%3))+44, 26+(35*pokemonRowHeight), `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, isBoss ? TextStyle.PARTY_RED : TextStyle.PARTY, { fontSize: "54px" });
          enemyLevel.setShadow(0, 0, null);
          enemyLevel.setStroke("#424242", 14);
          enemyLevel.setOrigin(1, 0);

          enemyIconContainer.add(enemyIcon);
          enemyIconContainer.add(enemyLevel);
          enemyContainer.add(enemyIconContainer);
         	  enemy.destroy();
       	  });

        if (runData.enemyParty.length > 3) {
          genInfoText.setPosition(6,52);
        } else {
          genInfoText.setPosition(6,40);
        }
    	  }
    	  this.runInfoContainer.add(enemyContainer);
    }


    if (luckValue >= 14) {
      genInfoText.appendText("\n", false);
    }

    const runLength = Utils.getPlayTimeString(runData.playTime);
    genInfoText.appendText(`${i18next.t("runHistory:runLength")}: ${runLength}`);

    	if (runData.modifiers.length) {
      genInfoText.appendText(i18next.t("runHistory:playerItems")+": ");
      const modifiersModule = await import("../modifier/modifier");

      let visibleModifierIndex = 0;

      const modifierIconsContainer = this.scene.add.container(8, 65);
      modifierIconsContainer.setScale(0.45);
      for (const m of runData.modifiers) {
        const modifier = m.toModifier(this.scene, modifiersModule[m.className]);
        if (modifier instanceof PokemonHeldItemModifier) {
          continue;
        }
        const item = this.scene.add.sprite(0, 12, "items");
        item.setFrame(modifier.type.iconImage);

        item.setOrigin(0, 0.5);
        const rowHeightModifier = Math.floor(visibleModifierIndex/7);
        item.setPosition(24 * (visibleModifierIndex%7), 20+(35*rowHeightModifier));

        modifierIconsContainer.add(item);
        const maxStackCount = modifier.getMaxStackCount(this.scene);
        if (maxStackCount > 1) {
          const itemStackCount = addTextObject(this.scene, (24*(visibleModifierIndex%7))+22, 22+(35*rowHeightModifier), modifier.stackCount, TextStyle.PARTY, {fontSize:"64px"});
          if (modifier.stackCount === maxStackCount) {
            itemStackCount.setColor("#f89890");
          }
          modifierIconsContainer.add(itemStackCount);
        }

        if (++visibleModifierIndex === 20) {
          const maxItems = addTextObject(this.scene, 45, 90, "+", TextStyle.WINDOW);
          maxItems.setPositionRelative(modifierIconsContainer, 70, 45);
          this.runInfoContainer.add(maxItems);
          break;
        }
      }
      if (runData.gameMode === GameModes.CHALLENGE) {
        modifierIconsContainer.setPositionRelative(genInfoText, 2, 65);
      } else {
        modifierIconsContainer.setPositionRelative(genInfoText, 2, 55);
      }

      this.runInfoContainer.add(modifierIconsContainer);
    }

 		this.runInfoContainer.add(genInfoText);
    this.gameStatsContainer.add(this.runInfoContainer);

 	}

 	parsePartyInfo(party: any) {

 		const windowHeight = ((this.scene.game.canvas.height / 6) - 23)/3;

 		const infoWidth = (this.statsBgWidth/2);

 		const pokemonPos = [[infoWidth+4, 28], [(infoWidth*3)+5, 28], [infoWidth+4, 78], [(infoWidth*3)+5, 78], [infoWidth+4, 128], [(infoWidth*3)+5, 128]];
 		party.forEach((p: PokemonData, i: integer) => {
      const pokemonInfoWindow = new RoundRectangle(this.scene, 0, 0, infoWidth*2, windowHeight-3, 3);

 			const pokemon = p.toPokemon(this.scene);
 			const pokemonInfoContainer = this.scene.add.container(pokemonPos[i][0], pokemonPos[i][1]);

 			const types = pokemon.getTypes();
 			let typeColor = getTypeRgb(types[0]);
 			const type1Color = new Phaser.Display.Color(typeColor[0], typeColor[1], typeColor[2]);

 			const bgColor = type1Color.clone().darken(45);
      pokemonInfoWindow.setFillStyle(bgColor.color);
      //pokemonInfoWindow.setBlendMode(Phaser.BlendModes.MULTIPLY);

      const iconContainer = this.scene.add.container(-55, -29);
      //pokemonSpriteWindow.setOrigin(-0.3, -0.25);
      const icon = this.scene.addPokemonIcon(pokemon, 0, 0, 0, 0);
      icon.setScale(0.75);
      icon.setPosition(14, 5.5);
      //const spriteAnimKey = icon.list[0].anims.key;
      typeColor = types[1] ? getTypeRgb(types[1]) : null;
      const type2Color = typeColor ? new Phaser.Display.Color(typeColor[0], typeColor[1], typeColor[2]) : null;
      type2Color ? pokemonInfoWindow.setStrokeStyle(1, type2Color.color, 0.95) : pokemonInfoWindow.setStrokeStyle(1, type1Color.color, 0.95);
      const sprite1 = icon.list[0] as Phaser.GameObjects.Sprite;
      const sprite2 = (icon.list.length > 1) ? icon.list[1] as Phaser.GameObjects.Sprite : null;
      if (type2Color && !pokemon.fusionSpecies) {
        sprite1.preFX.addShadow(-1, -1, 0.1, 1, type1Color.color);
        sprite1.preFX.addGlow(type2Color.color);
        //pokemonSpriteWindow.setFillStyle(type2Color.color, 0.7);
      } else if (type2Color && pokemon.fusionSpecies) {
        sprite1.preFX.addShadow(-1, -1, 0.1, 1, type2Color.color);
        sprite1.preFX.addGlow(type1Color.color);
        sprite2.preFX.addShadow(-1, -1, 0.1, 1, type1Color.color);
        sprite2.preFX.addGlow(type2Color.color);
      } else {
        sprite1.preFX.addShadow(-1, -1, 0.1, 1, type1Color.darken(10).color);
        sprite1.preFX.addGlow(type1Color.color);
        if (pokemon.fusionSpecies) {
          sprite2.preFX.addShadow(-1, -1, 0.1, 1, type1Color.color);
          sprite2.preFX.addGlow(type1Color.color);
        }
      }
      //pokemonSpriteWindow.setPosition(-2,1.5);
      //icon.add(pokemonSpriteWindow);
      this.getUi().bringToTop(icon);

      const textContainer = this.scene.add.container(-26, -25);
      const textContainerFontSize = "34px";
      const pSpecies = pokemon.species;
      const pNature = getNatureName(pokemon.nature);
      const pName = pokemon.fusionSpecies ? pokemon.name : pSpecies.name;
      const textNameNatureLevel = addBBCodeTextObject(this.scene, -2, 1, `${pName} - ${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatFancyLargeNumber(pokemon.level, 1)} - ${pNature}`, TextStyle.SUMMARY, { fontSize: textContainerFontSize, color: "#f8f8f8" });
      textContainer.add(textNameNatureLevel);

      const pPassiveInfo = pokemon.passive ? `${i18next.t("starterSelectUiHandler:passive")+" "+allAbilities[starterPassiveAbilities[pSpecies.speciesId]].name}` : "";
      //const abilityInd = pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex;
      const pAbilityInfo = i18next.t("starterSelectUiHandler:ability")+" "+ pokemon.getAbility().name;
      const textAbility = addBBCodeTextObject(this.scene, -2, 6, `${pAbilityInfo}`, TextStyle.SUMMARY, { fontSize: textContainerFontSize });
      textContainer.add(textAbility);
      const textPassive = addBBCodeTextObject(this.scene, -2, 11, pPassiveInfo, TextStyle.SUMMARY, {fontSize: textContainerFontSize});
      textContainer.add(textPassive);

      const pStats = [];
      pokemon.stats.forEach((element) => pStats.push(Utils.formatFancyLargeNumber(element,1)));
      const currentLanguage = i18next.resolvedLanguage;
      for (let i = 0; i < pStats.length; i++) {
        const isMult = getNatureStatMultiplier(pokemon.nature, i);
        pStats[i] = (isMult < 1) ? pStats[i] + "[color=#40c8f8]↓[/color]" : pStats[i];
        pStats[i] = (isMult > 1) ? pStats[i] + "[color=#f89890]↑[/color]" : pStats[i];
      }
      //Row 1: HP, Atk, Def
      //Row 2: SpAtk, SpDef, Speed
      const hp = addBBCodeTextObject(this.scene, 0, 0, i18next.t("pokemonInfo:Stat.HPshortened")+": "+pStats[0], TextStyle.SUMMARY, { fontSize: textContainerFontSize, align: "center" });
      const atk = addBBCodeTextObject(this.scene, 0, 0, i18next.t("pokemonInfo:Stat.ATKshortened")+": "+pStats[1], TextStyle.SUMMARY, { fontSize: textContainerFontSize, align: "center" });
      const def = addBBCodeTextObject(this.scene, 0, 0, i18next.t("pokemonInfo:Stat.DEFshortened")+": "+pStats[2], TextStyle.SUMMARY, { fontSize: textContainerFontSize, align: "center" });
      const spatk = addBBCodeTextObject(this.scene, 0, 0, i18next.t("pokemonInfo:Stat.SPATKshortened")+": "+pStats[3], TextStyle.SUMMARY, { fontSize: textContainerFontSize, align: "center" });
      const spdef = addBBCodeTextObject(this.scene, 0, 0, i18next.t("pokemonInfo:Stat.SPDEFshortened")+": "+pStats[4], TextStyle.SUMMARY, { fontSize: textContainerFontSize, align: "center" });
      const speedLabel = (currentLanguage==="es"||currentLanguage==="pt_BR") ? i18next.t("runHistory:SPDshortened") : i18next.t("pokemonInfo:Stat.SPDshortened");
      const speed = addBBCodeTextObject(this.scene, 0, 0, speedLabel+": "+pStats[5], TextStyle.SUMMARY, { fontSize: textContainerFontSize, align: "center" });

      Phaser.Actions.GridAlign([hp, atk, def, spatk, spdef, speed], {width:3, height:2, cellWidth:28, cellHeight: 6.25, x: -2, y: 20, position: Phaser.Display.Align.TOP_LEFT});
      textContainer.add([hp, atk, def, spatk, spdef, speed]);

      if (pokemon.fusionSpecies) {
        const splicedIcon = this.scene.add.image(0, 0, "icon_spliced");
        splicedIcon.setScale(0.35);
        splicedIcon.setOrigin(0, 0);
        pokemon.shiny ? splicedIcon.setPositionRelative(textContainer, 121, 32) : splicedIcon.setPositionRelative(textContainer, 127, 32);
        iconContainer.add(splicedIcon);
        this.getUi().bringToTop(splicedIcon);
      }

      if (pokemon.isShiny()) {
        const doubleShiny = pokemon.isFusion() && pokemon.shiny && pokemon.fusionShiny;

        const shinyStar = this.scene.add.image(0, 0, `shiny_star_small${doubleShiny ? "_1" : ""}`);
        shinyStar.setOrigin(0, 0);
        shinyStar.setScale(0.65);
        shinyStar.setPositionRelative(textContainer, 127, 32);
        shinyStar.setTint(getVariantTint(!doubleShiny ? pokemon.getVariant() : pokemon.variant));
        iconContainer.add(shinyStar);
        this.getUi().bringToTop(shinyStar);

        if (doubleShiny) {
          const fusionShinyStar = this.scene.add.image(0, 0, "shiny_star_small_2");
          fusionShinyStar.setOrigin(0, 0);
          fusionShinyStar.setScale(0.5);
          fusionShinyStar.setPosition(shinyStar.x, shinyStar.y);
          fusionShinyStar.setTint(getVariantTint(pokemon.fusionVariant));
          iconContainer.add(fusionShinyStar);
          this.getUi().bringToTop(fusionShinyStar);
        }
      }

      const pokemonMoveset = pokemon.getMoveset();
      const movesetContainer = this.scene.add.container(5.5, -28);
      const pokemonMoveBgs = [];
      const pokemonMoveLabels = [];
      const movePos = [[-6.5,35.5],[37,35.5],[-6.5,43.5],[37,43.5]];
      for (let m = 0; m < pokemonMoveset.length; m++) {
      	const moveContainer = this.scene.add.container(movePos[m][0], movePos[m][1]);
        moveContainer.setScale(0.5);

      	const moveBg = this.scene.add.nineslice(0, 0, "type_bgs", "unknown", 85, 15, 2, 2, 2, 2);
      	moveBg.setOrigin(1, 0);

      	const moveLabel = addTextObject(this.scene, -moveBg.width / 2, 2, "-", TextStyle.PARTY);
      	moveLabel.setOrigin(0.5, 0);
      	moveLabel.setName("text-move-label");

      	pokemonMoveBgs.push(moveBg);
      	pokemonMoveLabels.push(moveLabel);

      	moveContainer.add(moveBg);
      	moveContainer.add(moveLabel);

      	movesetContainer.add(moveContainer);

      	const move = m < pokemonMoveset.length ? pokemonMoveset[m].getMove() : null;
        pokemonMoveBgs[m].setFrame(Type[move ? move.type : Type.UNKNOWN].toString().toLowerCase());
        pokemonMoveLabels[m].setText(move ? move.name : "-");
    	}

      pokemonInfoContainer.add(pokemonInfoWindow);
      iconContainer.add(icon);
      pokemonInfoContainer.add(iconContainer);
      pokemonInfoContainer.add(movesetContainer);
      pokemonInfoContainer.add(textContainer);

      this.partyContainer.add(pokemonInfoContainer);
      pokemon.destroy();
 		});
    this.gameStatsContainer.add(this.partyContainer);
 	}

 	processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

    if (button === Button.CANCEL) {
      success = true;
      this.runInfoContainer.removeAll(true);
      this.partyContainer.removeAll(true);
      this.gameStatsContainer.removeAll(true);
      super.clear();
      this.gameStatsContainer.setVisible(false);
      ui.revertMode();
    } else {
      switch (button) {
      case Button.DOWN:
      case Button.UP:
        break;
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }
    return success || error;
  }
}

