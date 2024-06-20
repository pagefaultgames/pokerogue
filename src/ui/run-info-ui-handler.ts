import BattleScene from "../battle-scene";
import { GameModes } from "../game-mode";
import UiHandler from "./ui-handler";
import { SessionSaveData, parseSessionData, RunHistoryData, RunEntries, decrypt } from "../system/game-data";
import { TextStyle, addTextObject, addBBCodeTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import { PokemonData } from "../system/pokemon-data";
import { TrainerData } from "../system/trainer-data";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "../field/pokemon";
import { PokemonHeldItemModifier } from "../modifier/modifier";
import MessageUiHandler from "./message-ui-handler";
import i18next from "i18next";
import {Button} from "../enums/buttons";
import { BattleType } from "../battle";
import { TrainerType } from "../enums/trainer-type";
import { TrainerVariant } from "../field/trainer";
import { Challenges } from "#enums/challenges";
import { Type } from "../data/type";
import { getPartyLuckValue, getLuckString, getLuckTextTint } from "../modifier/modifier-type";
import RoundRectangle from 'phaser3-rex-plugins/plugins/roundrectangle.js';
import { Type, getTypeRgb } from "../data/type";
import { Species } from "#enums/species";
import PokemonSpecies, { allSpecies, starterPassiveAbilities, getFusedSpeciesName } from "../data/pokemon-species";
import { Nature, getNatureStatMultiplier, getNatureName } from "../data/nature";
import Ability, { allAbilities } from "../data/ability";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import Modifier, { getPartyLuckValue, modifierTypes } from "../modifier/modifier-type";

enum Page {
  GENERAL,
  STATS,
  HALL_OF_FAME
}

export enum RunVictory {
  DEFEATED,
  VICTORY
}

export default class GameInfoUiHandler extends UiHandler {
	private gameStatsContainer: Phaser.GameObjects.Container;
  	private statsContainer: Phaser.GameObjects.Container;

  	private runInfoContainer: Phaser.GameObjects.Container;
  	private partyContainer: Phaser.GameObjects.Container;
  	private statsBgWidth: integer;
  	private partyContainerHeight: integer;

  	private partyInfo: Phaser.GameObjects.Container[];

  	private statValues: Phaser.GameObjects.Text[];

	constructor(scene: BattleScene) {
     super(scene, Mode.RUN_INFO);
  }

  	setup() {
    	
      const ui = this.getUi();
 		  const page = 0; 

 		  this.gameStatsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

      this.gameStatsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

      const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
      headerBg.setOrigin(0, 0);

      const headerText = addTextObject(this.scene, 0, 0, i18next.t("runHistory:runInfo"), TextStyle.SETTINGS_LABEL);
      headerText.setOrigin(0, 0);
      headerText.setPositionRelative(headerBg, 8, 4);

      this.statsBgWidth = ((this.scene.game.canvas.width / 6) - 2) / 3;
        
      this.runInfoContainer = this.scene.add.container(0, 24);
		  const runInfoWindow = addWindow(this.scene, 0, 0, this.statsBgWidth-10, (this.scene.game.canvas.height / 6) - 25);
      runInfoWindow.setOrigin(0, 0);
      this.runInfoContainer.add(runInfoWindow);
        
      this.partyContainer = this.scene.add.container(this.statsBgWidth-10, 24);
      this.partyContainerWidth = (this.statsBgWidth*2)+10;
      this.partyContainerHeight = (this.scene.game.canvas / 6) - 25;
      const partyInfoWindow = addWindow(this.scene, 0, 0, (this.statsBgWidth*2)+10, (this.scene.game.canvas.height / 6) - 25);
      partyInfoWindow.setOrigin(0,0);

      this.partyContainer.add(partyInfoWindow); 

    	this.gameStatsContainer.add(headerBg);
    	this.gameStatsContainer.add(headerText);
    	this.gameStatsContainer.add(this.runInfoContainer);
    	this.gameStatsContainer.add(this.partyContainer);

    	ui.add(this.gameStatsContainer);

    	this.setCursor(0);

    	this.gameStatsContainer.setVisible(false);
 	}

 	show(args: any[]): boolean {
 		super.show(args);

 		const run = args[0];
 		const runHistoryOrigin = args[1] ? true : false;

 		const runData = this.scene.gameData.parseSessionData(JSON.stringify(run.entry));

 		this.parseRunInfo(runData, runHistoryOrigin, run.victory);

        const partyData = runHistoryOrigin ? runData.party : {};
        this.parsePartyInfo(partyData);

        
        this.getUi().bringToTop(this.gameStatsContainer);
        this.gameStatsContainer.setVisible(true);

        this.setCursor(0);

        //this.updateStats();
        

        this.getUi().hideTooltip();

        return true;
 	}

 	async parseRunInfo(runData:any, runHistoryOrigin: boolean, runResult: boolean = false) {
 		const info = [];
 		const genInfoText = addBBCodeTextObject(this.scene, 6, 18, "", TextStyle.WINDOW, {fontSize : "65px"});
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
    			genInfoText.appendText(`${i18next.t("gameMode:"+GameModes[runData.gameMode].toLowerCase())}`, false);
    			genInfoText.appendText(`\t${i18next.t("runHistory:challengeRules")}: `);
          const runChallenges = runData.challenges;
          const rules = [];
          for (var i = 0; i < runChallenges.length; i++) {
          if (runChallenges[i].id === Challenges.SINGLE_GENERATION && runChallenges[i].value !== 0) {
            rules.push(i18next.t("runHistory:challengeMonoGen"+runChallenges[i].value));
          }
          else if (runChallenges[i].id === Challenges.SINGLE_TYPE && runChallenges[i].value !== 0) {
            rules.push(Type[runChallenges[i].value-1]);
          }
          }
          if (rules) {
            genInfoText.appendText(rules, false);
          }
    			break;
    		case GameModes.ENDLESS:
    		case GameModes.CLASSIC:
    			genInfoText.appendText(`${i18next.t("gameMode:"+GameModes[runData.gameMode].toLowerCase())}`, false);
    			break;
    	}
    	const luckValue = Phaser.Math.Clamp(runData.party.map(p => p.toPokemon(this.scene).getLuck()).reduce((total: integer, value: integer) => total += value, 0), 0, 14);
    	const luckTextTint = "[color=#"+(getLuckTextTint(luckValue)).toString(16)+"]";
    	genInfoText.appendText(`${luckTextTint}${i18next.t("runHistory:luck")}: ${getLuckString(luckValue)}[/color]`);

    	genInfoText.appendText(`${i18next.t("runHistory:score")}: ${runData.score}`);

    	genInfoText.appendText(`${i18next.t("runHistory:money")}: ${Utils.formatLargeNumber(runData.money, 1000)}`);
    	

    	if (runHistoryOrigin && !runResult) {
    		const enemyContainer = this.scene.add.container(8, -40);
    		//Wild - Single and Doubles
    		if (runData.battleType === BattleType.WILD) {
    			runData.enemyParty.forEach((enemyData, e) => {
          		const enemyIconContainer = this.scene.add.container(8+(e*23),62);
          		enemyIconContainer.setScale(0.75);
          		enemyData.boss = false;
          		const enemy = enemyData.toPokemon(this.scene);
          		const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
          		const enemyLevel = addTextObject(this.scene, 32+(e*12), 20, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });
          		enemyLevel.setShadow(0, 0, null);
          		enemyLevel.setStroke("#424242", 14);
          		enemyLevel.setOrigin(1, 0);
          		enemyIconContainer.add(enemyIcon);
          		enemyIconContainer.add(enemyLevel);
          		enemyContainer.add(enemyIconContainer);
         		enemy.destroy();
       		});
    		}
    		//Trainer - Single
    		else if (runData.battleType === BattleType.TRAINER) {
    			const tObj = runData.trainer.toTrainer(this.scene);
    			const tObjSpriteKey = tObj.config.getSpriteKey(tObj.isFemale, tObj.isDouble);
    			const tObjSprite = this.scene.add.sprite(4, 76, tObjSpriteKey);
    			tObjSprite.setScale(0.25, 0.25);
    			runData.enemyParty.forEach((enemyData, e) => {
    			//e = (e>2) ? e : e/2;
          		const enemyIconContainer = this.scene.add.container(8+(e*12), 66);
          		enemyIconContainer.setScale(0.5);
              const isBoss = enemyData.boss;
          		enemyData.boss = false;
          		const enemy = enemyData.toPokemon(this.scene);
          		const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
          		const enemyLevel = addTextObject(this.scene, 32, 20, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, isBoss ? TextStyle.PARTY_RED : TextStyle.PARTY, { fontSize: "54px" });
          		enemyLevel.setShadow(0, 0, null);
          		enemyLevel.setStroke("#424242", 14);
          		enemyLevel.setOrigin(1, 0);
          		enemyIconContainer.add(enemyIcon);
          		enemyIconContainer.add(enemyLevel);
          		enemyContainer.add(enemyIconContainer);
         		enemy.destroy();
       		});
    			enemyContainer.add(tObjSprite);
    		}
    		this.runInfoContainer.add(enemyContainer);
    		genInfoText.setPosition(6,35);
    	}
 		
    	if (runData.modifiers) {
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
        item.setPosition(24 * (visibleModifierIndex%7), 0+(35*rowHeightModifier));
        const itemStackCount = addTextObject(this.scene, (24*(visibleModifierIndex%7))+22, 8+(35*rowHeightModifier), modifier.stackCount, TextStyle.PARTY, {fontSize:"64px"});
        modifierIconsContainer.add(item);
        modifierIconsContainer.add(itemStackCount);
        if (++visibleModifierIndex === 22) {
          break;
        }
      }
      modifierIconsContainer.setPosition(7, 110);
      this.runInfoContainer.add(modifierIconsContainer);
    }
 			//Defeat Handler 
 			//Defeated...
 			//Date:
 			//Mode:
 			//Luck:
 			//Score:	
 			//Enemy Party: (Wild Pokemon + Level - same for single/double) (Single Trainer - sprite + two rows of 3 pokemon at max) (Double Trainer - sprite/1 row + sprite/1 row)
 			//Wave - Biome:
 			//Player Items: (player modifiers)
    		
 			//genInfoText.setWordWrapCallback(() => '\n');
 		  this.runInfoContainer.add(genInfoText);
      

 	}

 	parsePartyInfo(party: any) {

 		const windowHeight = ((this.scene.game.canvas.height / 6) - 23)/3;
 		
 		const infoWidth = (this.statsBgWidth/2);

 		const pokemonPos = [[infoWidth+4, 28], [(infoWidth*3)+5, 28], [infoWidth+4, 78], [(infoWidth*3)+5, 78], [infoWidth+4, 128], [(infoWidth*3)+5, 128]]
 		party.forEach((p: PokemonData, i: integer) => {
      		const pokemonInfoWindow = new RoundRectangle(this.scene, 0, 0, infoWidth*2, windowHeight-3, 3);
 			pokemonInfoWindow.setStrokeStyle(1, 0x4b4b4b, 0.85);
 			const pokemonSpriteWindow = this.scene.add.rectangle(0, 0, 21, 21, 0xFFFFFF, 0.4);

 			const pokemon = p.toPokemon(this.scene);
      console.log(pokemon);
 			const pokemonInfoContainer = this.scene.add.container(pokemonPos[i][0], pokemonPos[i][1]);
 			pokemonInfoWindow.setStrokeStyle(1, 0x4b4b4b, 0.95);
 			
 			const types = pokemon.getTypes();
 			var typeColor = getTypeRgb(types[0]);
 			const type1Color = new Phaser.Display.Color(typeColor[0], typeColor[1], typeColor[2]);
 			if (types[1]) {
 				typeColor = getTypeRgb(types[1]);
 				const type2Color = new Phaser.Display.Color(typeColor[0], typeColor[1], typeColor[2]);
 				pokemonSpriteWindow.setFillStyle(type2Color.color, 0.7);
 			} 
 			type1Color.darken(25);
      pokemonInfoWindow.setFillStyle(type1Color.color);
      //pokemonInfoWindow.setBlendMode(Phaser.BlendModes.MULTIPLY);

 			const factors = i%2 ? [1,1] : [-1,-1];
      		const iconContainer = this.scene.add.container(-55, -29);
      		pokemonSpriteWindow.setOrigin(-0.3, -0.25);
      		const icon = this.scene.addPokemonIcon(pokemon, 0, 0, 0, 0);
          icon.setScale(0.75);
          icon.setPosition(14, 5);
          pokemonSpriteWindow.setPosition(-2,2);
      		icon.add(pokemonSpriteWindow)
      		this.getUi().bringToTop(icon);

      		const textContainer = this.scene.add.container(-26, -25);
      		const pSpecies = pokemon.species;
      		const pNature = getNatureName(pokemon.nature);
          const pName = pokemon.fusionSpecies ? pokemon.name : pSpecies.name;
      		const textNameNatureLevel = addTextObject(this.scene, -2, 1, `${pName} - ${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatFancyLargeNumber(pokemon.level, 1)} - ${pNature}`, TextStyle.SUMMARY, { fontSize: "33px", color: "#f8f8f8" });
      		textContainer.add(textNameNatureLevel);
      		
      		const pPassiveInfo = pokemon.passive ? `${i18next.t("starterSelectUiHandler:passive")+" "+allAbilities[starterPassiveAbilities[pSpecies.speciesId]].name}` : "";
      		const pHasHA = (pSpecies.hiddenAbility === pSpecies.getAbility(pokemon.AbilityIndex)) ? ["[color=#e8e8a8]","[/color]"] : ["",""];
      		const pAbilityInfo = i18next.t("starterSelectUiHandler:ability")+" "+pHasHA[0] + allAbilities[pSpecies.getAbility(pokemon.AbilityIndex)].name + pHasHA[1];
      		const textAbility = addBBCodeTextObject(this.scene, -2, 6, `${pAbilityInfo}`, TextStyle.SUMMARY, { fontSize: "34px" });
      		textContainer.add(textAbility);
      		const textPassive = addBBCodeTextObject(this.scene, -2, 11, pPassiveInfo, TextStyle.SUMMARY, {fontSize: "34px"});
      		textContainer.add(textPassive);

      		const pStats = pokemon.stats;
      		const pStatsArray = [i18next.t("pokemonInfo:Stat.HPshortened")+": ", i18next.t("pokemonInfo:Stat.ATKshortened")+": ", i18next.t("pokemonInfo:Stat.DEFshortened")+": ", i18next.t("pokemonInfo:Stat.SPATKshortened")+": ", i18next.t("pokemonInfo:Stat.SPDEFshortened")+": ", i18next.t("pokemonInfo:Stat.SPDshortened")+": "];
      		pStatsArray[0] = pStatsArray[0] + Utils.formatFancyLargeNumber(pStats[0], 1);
      		for (var i = 1; i < pStats.length; i++ ) {
      			const isMult = getNatureStatMultiplier(pokemon.nature, i);
      			pStatsArray[i] = pStatsArray[i] + Utils.formatFancyLargeNumber(pStats[i], 1);
      			pStatsArray[i] = (isMult < 1) ? "[b]" + pStatsArray[i] + "↓[/b]" : pStatsArray[i];
      			pStatsArray[i] = (isMult > 1) ? "[b]" + pStatsArray[i] + "↑[/b]" : pStatsArray[i];
      		}
      		const pStatsInfo1 = `${pStatsArray[0]} | ${pStatsArray[1]} | ${pStatsArray[2]}`;
      		const pStatsInfo2 = `${pStatsArray[3]} | ${pStatsArray[4]} | ${pStatsArray[5]}`;
      		const textStats1 = addBBCodeTextObject(this.scene, -2, 16, pStatsInfo1, TextStyle.SUMMARY, { fontSize: "34px" });
      		textContainer.add(textStats1);
      		const textStats2 = addBBCodeTextObject(this.scene, -2, 21, pStatsInfo2, TextStyle.SUMMARY, { fontSize: "34px"});
      		textContainer.add(textStats2);

      		const pokemonMoveset = pokemon.getMoveset();
      		const movesetContainer = this.scene.add.container(5.5, -30);
      		const pokemonMoveBgs = [];
      		const pokemonMoveLabels = [];
      		const movePos = [[-6,33],[41,33],[-6,43],[41,43]];
      		for (let m = 0; m < pokemonMoveset.length; m++) {
      			const moveContainer = this.scene.add.container(movePos[m][0], movePos[m][1]);
         		moveContainer.setScale(0.5);

      			const moveBg = this.scene.add.nineslice(0, 0, "type_bgs", "unknown", 92, 18, 2, 2, 2, 2);
      			moveBg.setOrigin(1, 0);

      			const moveLabel = addTextObject(this.scene, -moveBg.width / 2, 3, "-", TextStyle.PARTY);
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

      		//pokemonSpriteWindow.setOrigin(0,0);
      		//iconContainer.add(pokemonSpriteWindow);
      		pokemonInfoContainer.add(pokemonInfoWindow);
      		iconContainer.add(pokemonSpriteWindow);
      		iconContainer.add(icon);
      		pokemonInfoContainer.add(iconContainer);
      		pokemonInfoContainer.add(movesetContainer);
      		pokemonInfoContainer.add(textContainer);

      		this.partyContainer.add(pokemonInfoContainer);
      		pokemon.destroy();
 		});
 	}

 	processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
      switch (button) {
      case Button.UP:
        if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.DOWN:
        break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

}