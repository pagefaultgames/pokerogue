import BattleScene, { Button } from "../battle-scene";
import PokemonSpecies, { allSpecies, getPokemonSpecies, getPokemonSpeciesForm, speciesStarters } from "../data/pokemon-species";
import { Species } from "../data/enums/species";
import { TextStyle, addBBCodeTextObject, addTextObject, getTextColor } from "./text";
import { Mode } from "./ui";
import MessageUiHandler from "./message-ui-handler";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import { allAbilities } from "../data/ability";
import { GameModes, gameModes } from "../game-mode";
import { Unlockables } from "../system/unlockables";
import { GrowthRate, getGrowthRateColor } from "../data/exp";
import { DexAttr, DexEntry, StarterFormMoveData, StarterMoveset } from "../system/game-data";
import * as Utils from "../utils";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { StatsContainer } from "./stats-container";
import { addWindow } from "./ui-theme";
import { Nature, getNatureName } from "../data/nature";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { pokemonFormChanges } from "../data/pokemon-forms";
import { Tutorial, handleTutorial } from "../tutorial";
import { LevelMoves, pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "../data/pokemon-level-moves";
import { allMoves } from "../data/move";
import { Type } from "../data/type";
import { Moves } from "../data/enums/moves";
import { speciesEggMoves } from "../data/egg-moves";
import { TitlePhase } from "../phases";

export type StarterSelectCallback = (starters: Starter[]) => void;

export interface Starter {
  species: PokemonSpecies;
  dexAttr: bigint;
  nature: Nature;
  moveset?: StarterMoveset;
  pokerus: boolean;
}

const gens = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX' ];

export default class StarterSelectUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private shinyOverlay: Phaser.GameObjects.Image;
  private starterSelectGenIconContainers: Phaser.GameObjects.Container[];
  private pokemonNumberText: Phaser.GameObjects.Text;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private pokemonNameText: Phaser.GameObjects.Text;
  private pokemonGrowthRateLabelText: Phaser.GameObjects.Text;
  private pokemonGrowthRateText: Phaser.GameObjects.Text;
  private pokemonGenderText: Phaser.GameObjects.Text;
  private pokemonUncaughtText: Phaser.GameObjects.Text;
  private pokemonAbilityLabelText: Phaser.GameObjects.Text;
  private pokemonAbilityText: Phaser.GameObjects.Text;
  private pokemonNatureLabelText: Phaser.GameObjects.Text;
  private pokemonNatureText: BBCodeText;
  private pokemonCaughtCountLabelText: Phaser.GameObjects.Text;
  private pokemonCaughtCountText: Phaser.GameObjects.Text;
  private pokemonMovesContainer: Phaser.GameObjects.Container;
  private pokemonMoveContainers: Phaser.GameObjects.Container[];
  private pokemonMoveBgs: Phaser.GameObjects.NineSlice[];
  private pokemonMoveLabels: Phaser.GameObjects.Text[];
  private pokemonAdditionalMoveCountLabel: Phaser.GameObjects.Text;
  private pokemonEggMovesContainer: Phaser.GameObjects.Container;
  private pokemonEggMoveContainers: Phaser.GameObjects.Container[];
  private pokemonEggMoveBgs: Phaser.GameObjects.NineSlice[];
  private pokemonEggMoveLabels: Phaser.GameObjects.Text[];
  private genOptionsText: Phaser.GameObjects.Text;
  private instructionsText: Phaser.GameObjects.Text;
  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private statsContainer: StatsContainer;

  private genMode: boolean;
  private statsMode: boolean;
  private dexAttrCursor: bigint = 0n;
  private natureCursor: integer = -1;
  private genCursor: integer = 0;
  private genScrollCursor: integer = 0;
  private starterMoveset: StarterMoveset;

  private genSpecies: PokemonSpecies[][] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  private starterGens: integer[] = [];
  private starterCursors: integer[] = [];
  private pokerusGens: integer[] = [];
  private pokerusCursors: integer[] = [];
  private starterAttr: bigint[] = [];
  private starterNatures: Nature[] = [];
  private starterMovesets: StarterMoveset[] = [];
  private speciesStarterDexEntry: DexEntry;
  private speciesStarterMoves: Moves[];
  private canCycleShiny: boolean;
  private canCycleForm: boolean;
  private canCycleGender: boolean;
  private canCycleAbility: boolean;
  private canCycleNature: boolean;
  private value: integer = 0;

  private assetLoadCancelled: Utils.BooleanHolder;
  private cursorObj: Phaser.GameObjects.Image;
  private starterCursorObjs: Phaser.GameObjects.Image[];
  private pokerusCursorObjs: Phaser.GameObjects.Image[];
  private starterIcons: Phaser.GameObjects.Sprite[];
  private genCursorObj: Phaser.GameObjects.Image;
  private genCursorHighlightObj: Phaser.GameObjects.Image;
  private valueLimitLabel: Phaser.GameObjects.Text;
  private startCursorObj: Phaser.GameObjects.NineSlice;
  private starterValueLabels: Phaser.GameObjects.Text[];
  private shinyIcons: Phaser.GameObjects.Image[];

  private iconAnimHandler: PokemonIconAnimHandler;

  private starterSelectCallback: StarterSelectCallback;

  constructor(scene: BattleScene) {
    super(scene, Mode.STARTER_SELECT);
  }

  setup() {
    const ui = this.getUi();

    this.starterSelectContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.starterSelectContainer.setVisible(false);
    ui.add(this.starterSelectContainer);

    const bgColor = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0x006860);
    bgColor.setOrigin(0, 0);
    this.starterSelectContainer.add(bgColor);

    const starterSelectBg = this.scene.add.image(0, 0, 'starter_select_bg');
    starterSelectBg.setOrigin(0, 0);
    this.starterSelectContainer.add(starterSelectBg);

    this.shinyOverlay = this.scene.add.image(6, 6, 'summary_overlay_shiny');
    this.shinyOverlay.setOrigin(0, 0);
    this.shinyOverlay.setVisible(false);
    this.starterSelectContainer.add(this.shinyOverlay);

    const starterContainerWindow = addWindow(this.scene, 141, 1, 178, 178);
    
    this.starterSelectContainer.add(addWindow(this.scene, 107, 1, 34, 58));
    this.starterSelectContainer.add(addWindow(this.scene, 107, 59, 34, 91));
    this.starterSelectContainer.add(addWindow(this.scene, 107, 145, 34, 34, true));
    this.starterSelectContainer.add(starterContainerWindow);

    if (!this.scene.uiTheme)
      starterContainerWindow.setVisible(false);

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup(this.scene);

    this.pokemonNumberText = addTextObject(this.scene, 17, 1, '0000', TextStyle.SUMMARY);
    this.pokemonNumberText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNumberText);

    this.pokemonNameText = addTextObject(this.scene, 6, 112, '', TextStyle.SUMMARY);
    this.pokemonNameText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNameText);

    this.pokemonGrowthRateLabelText = addTextObject(this.scene, 8, 106, 'Growth Rate:', TextStyle.SUMMARY_ALT, { fontSize: '36px' });
    this.pokemonGrowthRateLabelText.setOrigin(0, 0);
    this.pokemonGrowthRateLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonGrowthRateLabelText);

    this.pokemonGrowthRateText = addTextObject(this.scene, 34, 106, '', TextStyle.SUMMARY_PINK, { fontSize: '36px' });
    this.pokemonGrowthRateText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGrowthRateText);

    this.pokemonGenderText = addTextObject(this.scene, 96, 112, '', TextStyle.SUMMARY_ALT);
    this.pokemonGenderText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGenderText);

    this.pokemonUncaughtText = addTextObject(this.scene, 6, 126, 'Uncaught', TextStyle.SUMMARY_ALT, { fontSize: '56px' });
    this.pokemonUncaughtText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonUncaughtText);

    this.pokemonAbilityLabelText = addTextObject(this.scene, 6, 126, 'Ability:', TextStyle.SUMMARY_ALT, { fontSize: '56px' });
    this.pokemonAbilityLabelText.setOrigin(0, 0);
    this.pokemonAbilityLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonAbilityLabelText);

    this.pokemonAbilityText = addTextObject(this.scene, 30, 126, '', TextStyle.SUMMARY_ALT, { fontSize: '56px' });
    this.pokemonAbilityText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonAbilityText);

    this.pokemonNatureLabelText = addTextObject(this.scene, 6, 135, 'Nature:', TextStyle.SUMMARY_ALT, { fontSize: '56px' });
    this.pokemonNatureLabelText.setOrigin(0, 0);
    this.pokemonNatureLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonNatureLabelText);

    this.pokemonNatureText = addBBCodeTextObject(this.scene, 30, 135, '', TextStyle.SUMMARY_ALT, { fontSize: '56px' });
    this.pokemonNatureText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNatureText);

    this.pokemonCaughtCountLabelText = addTextObject(this.scene, 6, 144, 'Caught/Hatched:', TextStyle.SUMMARY_ALT, { fontSize: '56px' });
    this.pokemonCaughtCountLabelText.setOrigin(0, 0);
    this.pokemonCaughtCountLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonCaughtCountLabelText);

    this.pokemonCaughtCountText = addTextObject(this.scene, 58, 144, '0/0 (0)', TextStyle.SUMMARY_ALT, { fontSize: '56px' });
    this.pokemonCaughtCountText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonCaughtCountText);

    this.pokemonMoveContainers = [];
    this.pokemonMoveBgs = [];
    this.pokemonMoveLabels = [];

    this.pokemonEggMoveContainers = [];
    this.pokemonEggMoveBgs = [];
    this.pokemonEggMoveLabels = [];

    this.genOptionsText = addTextObject(this.scene, 124, 7, '', TextStyle.WINDOW, { fontSize: 72, lineSpacing: 39, align: 'center' });
    this.genOptionsText.setShadowOffset(4.5, 4.5);
    this.genOptionsText.setOrigin(0.5, 0);
    this.starterSelectContainer.add(this.genOptionsText);

    this.updateGenOptions();

    this.starterSelectGenIconContainers = new Array(gens.length).fill(null).map((_, i) => {
      const container = this.scene.add.container(151, 9);
      if (i)
        container.setVisible(false);
      this.starterSelectContainer.add(container);
      return container;
    });

    this.pokerusCursorObjs = new Array(3).fill(null).map(() => {
      const cursorObj = this.scene.add.image(0, 0, 'select_cursor_pokerus');
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0, 0);
      this.starterSelectContainer.add(cursorObj);
      return cursorObj;
    });

    this.starterCursorObjs = new Array(6).fill(null).map(() => {
      const cursorObj = this.scene.add.image(0, 0, 'select_cursor_highlight');
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0, 0);
      this.starterSelectContainer.add(cursorObj);
      return cursorObj;
    });

    this.cursorObj = this.scene.add.image(0, 0, 'select_cursor');
    this.cursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.cursorObj);

    this.genCursorHighlightObj = this.scene.add.image(111, 5, 'select_gen_cursor_highlight');
    this.genCursorHighlightObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.genCursorHighlightObj);

    this.genCursorObj = this.scene.add.image(111, 5, 'select_gen_cursor');
    this.genCursorObj.setVisible(false);
    this.genCursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.genCursorObj);
    
    this.valueLimitLabel = addTextObject(this.scene, 124, 150, '0/10', TextStyle.TOOLTIP_CONTENT);
    this.valueLimitLabel.setOrigin(0.5, 0);
    this.starterSelectContainer.add(this.valueLimitLabel);

    const startLabel = addTextObject(this.scene, 124, 162, 'Start', TextStyle.TOOLTIP_CONTENT);
    startLabel.setOrigin(0.5, 0);
    this.starterSelectContainer.add(startLabel);

    this.startCursorObj = this.scene.add.nineslice(111, 160, 'select_cursor', null, 26, 15, 6, 6, 6, 6);
    this.startCursorObj.setVisible(false);
    this.startCursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.startCursorObj);

    const starterSpecies: Species[] = [];
    
    for (let g = 0; g < this.starterSelectGenIconContainers.length; g++) {
      let s = 0;
      this.genSpecies.push([]);

      for (let species of allSpecies) {
        if (!speciesStarters.hasOwnProperty(species.speciesId) || species.generation !== g + 1 || !species.isObtainable())
          continue;
        starterSpecies.push(species.speciesId);
        this.speciesLoaded.set(species.speciesId, false);
        this.genSpecies[g].push(species);
        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species);
        const defaultProps = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        const x = (s % 9) * 18;
        const y = Math.floor(s / 9) * 18;
        const icon = this.scene.add.sprite(x - 2, y + 2, species.getIconAtlasKey(defaultProps.formIndex));
        icon.setScale(0.5);
        icon.setOrigin(0, 0);
        icon.setFrame(species.getIconId(defaultProps.female, defaultProps.formIndex, defaultProps.shiny));
        icon.setTint(0);
        this.starterSelectGenIconContainers[g].add(icon);
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.NONE);
        s++;
      }
    }

    this.starterIcons = new Array(6).fill(null).map((_, i) => {
      const icon = this.scene.add.sprite(113, 63 + 13 * i, 'pokemon_icons_0');
      icon.setScale(0.5);
      icon.setOrigin(0, 0);
      icon.setFrame('unknown');
      this.starterSelectContainer.add(icon);
      this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);
      return icon;
    });

    this.starterValueLabels = new Array(81).fill(null).map((_, i) => {
      const x = (i % 9) * 18;
      const y = Math.floor(i / 9) * 18;
      const ret = addTextObject(this.scene, x + 152, y + 11, '0', TextStyle.WINDOW, { fontSize: '32px' });
      ret.setShadowOffset(2, 2);
      ret.setOrigin(0, 0);
      ret.setVisible(false);
      this.starterSelectContainer.add(ret);
      return ret;
    });

    this.shinyIcons = new Array(81).fill(null).map((_, i) => {
      const x = (i % 9) * 18;
      const y = Math.floor(i / 9) * 18;
      const ret = this.scene.add.image(x + 163, y + 11, 'shiny_star');
      ret.setOrigin(0, 0);
      ret.setScale(0.5);
      ret.setVisible(false);
      this.starterSelectContainer.add(ret);
      return ret;
    });

    this.pokemonSprite = this.scene.add.sprite(53, 63, `pkmn__sub`);
    this.starterSelectContainer.add(this.pokemonSprite);

    this.pokemonMovesContainer = this.scene.add.container(102, 16);
    this.pokemonMovesContainer.setScale(0.5);

    for (let m = 0; m < 4; m++) {
      const moveContainer = this.scene.add.container(0, 14 * m);

      const moveBg = this.scene.add.nineslice(0, 0, 'type_bgs', 'unknown', 92, 14, 2, 2, 2, 2);
      moveBg.setOrigin(1, 0);

      const moveLabel = addTextObject(this.scene, -moveBg.width / 2, 0, '-', TextStyle.PARTY);
      moveLabel.setOrigin(0.5, 0);

      this.pokemonMoveBgs.push(moveBg);
      this.pokemonMoveLabels.push(moveLabel);

      moveContainer.add(moveBg);
      moveContainer.add(moveLabel);

      this.pokemonMoveContainers.push(moveContainer);
      this.pokemonMovesContainer.add(moveContainer);
    }

    this.pokemonAdditionalMoveCountLabel = addTextObject(this.scene, -this.pokemonMoveBgs[0].width / 2, 56, '(+0)', TextStyle.PARTY);
    this.pokemonAdditionalMoveCountLabel.setOrigin(0.5, 0);

    this.pokemonMovesContainer.add(this.pokemonAdditionalMoveCountLabel);

    this.starterSelectContainer.add(this.pokemonMovesContainer);

    this.pokemonEggMovesContainer = this.scene.add.container(102, 85);
    this.pokemonEggMovesContainer.setScale(0.375);

    const eggMovesLabel = addTextObject(this.scene, -46, 0, 'Egg Moves', TextStyle.SUMMARY_ALT);
    eggMovesLabel.setOrigin(0.5, 0);
    
    this.pokemonEggMovesContainer.add(eggMovesLabel);

    for (let m = 0; m < 4; m++) {
      const eggMoveContainer = this.scene.add.container(0, 16 + 14 * m);

      const eggMoveBg = this.scene.add.nineslice(0, 0, 'type_bgs', 'unknown', 92, 14, 2, 2, 2, 2);
      eggMoveBg.setOrigin(1, 0);

      const eggMoveLabel = addTextObject(this.scene, -eggMoveBg.width / 2, 0, '???', TextStyle.PARTY);
      eggMoveLabel.setOrigin(0.5, 0);

      this.pokemonEggMoveBgs.push(eggMoveBg);
      this.pokemonEggMoveLabels.push(eggMoveLabel);

      eggMoveContainer.add(eggMoveBg);
      eggMoveContainer.add(eggMoveLabel);

      this.pokemonEggMoveContainers.push(eggMoveContainer);

      this.pokemonEggMovesContainer.add(eggMoveContainer);
    }

    this.starterSelectContainer.add(this.pokemonEggMovesContainer);

    this.instructionsText = addTextObject(this.scene, 4, 156, '', TextStyle.PARTY, { fontSize: '42px' });
    this.starterSelectContainer.add(this.instructionsText);

    this.starterSelectMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
    this.starterSelectMessageBoxContainer.setVisible(false);
    this.starterSelectContainer.add(this.starterSelectMessageBoxContainer);

    this.starterSelectMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    this.starterSelectMessageBox.setOrigin(0, 1);
    this.starterSelectMessageBoxContainer.add(this.starterSelectMessageBox);

    this.message = addTextObject(this.scene, 8, 8, '', TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.starterSelectMessageBoxContainer.add(this.message);

    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    this.scene.executeWithSeedOffset(() => {
      for (let c = 0; c < 3; c++) {
        let randomSpeciesId: Species;
        let species: PokemonSpecies;
        let pokerusCursor: integer;

        const generateSpecies = () => {
          randomSpeciesId = Utils.randSeedItem(starterSpecies);
          species = getPokemonSpecies(randomSpeciesId);
          pokerusCursor = this.genSpecies[species.generation - 1].indexOf(species);
        };
        
        let dupe = false;

        do {
          dupe = false;

          generateSpecies();

          for (let pc = 0; pc < c; pc++) {
            if (this.pokerusGens[pc] === species.generation -1 && this.pokerusCursors[pc] === pokerusCursor) {
              dupe = true;
              break;
            }
          }
        } while (dupe);

        this.pokerusGens.push(species.generation - 1);
        this.pokerusCursors.push(pokerusCursor);
        this.pokerusCursorObjs[c].setPosition(150 + 18 * (pokerusCursor % 9), 10 + 18 * Math.floor(pokerusCursor / 9));
      }
    }, 0, date.getTime().toString());

    this.statsContainer = new StatsContainer(this.scene, 6, 16);

    this.scene.add.existing(this.statsContainer);

    this.statsContainer.setVisible(false);

    this.starterSelectContainer.add(this.statsContainer);

    this.updateInstructions();
  }

  show(args: any[]): boolean {
    if (args.length >= 1 && args[0] instanceof Function) {
      super.show(args);

      for (let g = 0; g < this.genSpecies.length; g++) {
        this.genSpecies[g].forEach((species, s) => {
          const dexEntry = this.scene.gameData.dexData[species.speciesId];
          const icon = this.starterSelectGenIconContainers[g].getAt(s) as Phaser.GameObjects.Sprite;
          if (dexEntry.caughtAttr)
            icon.clearTint();
          else if (dexEntry.seenAttr)
            icon.setTint(0x808080);
        });
      }

      this.starterSelectCallback = args[0] as StarterSelectCallback;

      this.starterSelectContainer.setVisible(true);

      this.setGenMode(false);
      this.setCursor(0);
      this.setGenMode(true);
      this.setCursor(0);

      handleTutorial(this.scene, Tutorial.Starter_Select);

      return true;
    }

    return false;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    if (text?.indexOf('\n') === -1) {
      this.starterSelectMessageBox.setSize(318, 28);
      this.message.setY(-22);
    } else {
      this.starterSelectMessageBox.setSize(318, 42);
      this.message.setY(-37);
    }

    this.starterSelectMessageBoxContainer.setVisible(!!text?.length);
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.SUBMIT) {
      if (this.tryStart(true))
        success = true;
      else
        error = true;
    } else if (button === Button.CANCEL) {
      if (this.statsMode) {
        this.toggleStatsMode(false);
        success = true;
      } else if (this.starterCursors.length) {
        this.popStarter();
        success = true;
        this.updateInstructions();
      } else {
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        this.scene.getCurrentPhase().end();
        success = true;
      }
    } else if (this.startCursorObj.visible) {
      switch (button) {
        case Button.ACTION:
          if (this.tryStart(true))
            success = true;
          else
            error = true;
          break;
        case Button.UP:
          this.startCursorObj.setVisible(false);
          this.setGenMode(true);
          success = true;
          break;
        case Button.LEFT:
          this.startCursorObj.setVisible(false);
          this.setGenMode(false);
          this.setCursor(this.cursor + 8);
          success = true;
          break;
        case Button.RIGHT:
          this.startCursorObj.setVisible(false);
          this.setGenMode(false);
          success = true;
          break;
      }
    } else if (this.genMode) {
      switch (button) {
        case Button.UP:
          if (this.genCursor)
            success = this.setCursor(this.genCursor - 1);
          break;
        case Button.DOWN:
          if (this.genCursor < 2)
            success = this.setCursor(this.genCursor + 1);
          else {
            this.startCursorObj.setVisible(true);
            this.setGenMode(true);
            success = true;
          }
          break;
        case Button.LEFT:
          success = this.setGenMode(false);
          this.setCursor(this.cursor + 8);
          break;
        case Button.RIGHT:
          success = this.setGenMode(false);
          break;
      }
    } else {
      if (button === Button.ACTION) {
        if (!this.speciesStarterDexEntry?.caughtAttr)
          error = true;
        else if (this.starterCursors.length < 6) {
          const options = [
            {
              label: 'Add to Party',
              handler: () => {
                ui.setMode(Mode.STARTER_SELECT);
                let isDupe = false;
                for (let s = 0; s < this.starterCursors.length; s++) {
                  if (this.starterGens[s] === this.getGenCursorWithScroll() && this.starterCursors[s] === this.cursor) {
                    isDupe = true;
                    break;
                  }
                }
                const species = this.genSpecies[this.getGenCursorWithScroll()][this.cursor];
                if (!isDupe && this.tryUpdateValue(this.scene.gameData.getSpeciesStarterValue(species.speciesId))) {
                  const cursorObj = this.starterCursorObjs[this.starterCursors.length];
                  cursorObj.setVisible(true);
                  cursorObj.setPosition(this.cursorObj.x, this.cursorObj.y);
                  const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor);
                  this.starterIcons[this.starterCursors.length].setTexture(species.getIconAtlasKey(props.formIndex));
                  this.starterIcons[this.starterCursors.length].setFrame(species.getIconId(props.female, props.formIndex, props.shiny));
                  this.starterGens.push(this.getGenCursorWithScroll());
                  this.starterCursors.push(this.cursor);
                  this.starterAttr.push(this.dexAttrCursor);
                  this.starterNatures.push(this.natureCursor as unknown as Nature);
                  this.starterMovesets.push(this.starterMoveset.slice(0) as StarterMoveset);
                  if (this.speciesLoaded.get(species.speciesId))
                    getPokemonSpeciesForm(species.speciesId, props.formIndex).cry(this.scene);
                  if (this.starterCursors.length === 6 || this.value === 10)
                    this.tryStart();
                  this.updateInstructions();
                  ui.playSelect();
                } else
                  ui.playError();
              },
              overrideSound: true
            },
            {
              label: 'Toggle IVs',
              handler: () => {
                this.toggleStatsMode();
                ui.setMode(Mode.STARTER_SELECT);
              }
            }
          ];
          if (this.speciesStarterMoves.length > 1) {
            const showSwapOptions = (moveset: StarterMoveset) => {
              ui.setMode(Mode.STARTER_SELECT).then(() => {
                ui.showText('Select a move to swap out.', null, () => {
                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: moveset.map((m, i) => {
                      return {
                        label: allMoves[m].name,
                        handler: () => {
                          ui.setMode(Mode.STARTER_SELECT).then(() => {
                            ui.showText(`Select a move to swap with ${allMoves[m].name}.`, null, () => {
                              ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                                options: this.speciesStarterMoves.filter(sm => sm !== m).map(sm => {
                                  return {
                                    label: allMoves[sm].name,
                                    handler: () => {
                                      const speciesId = this.lastSpecies.speciesId;
                                      const existingMoveIndex = this.starterMoveset.indexOf(sm);
                                      this.starterMoveset[i] = sm;
                                      if (existingMoveIndex > -1)
                                        this.starterMoveset[existingMoveIndex] = m;
                                      const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.dexAttrCursor);
                                      if (!this.scene.gameData.starterMoveData.hasOwnProperty(speciesId) && pokemonFormLevelMoves.hasOwnProperty(speciesId)) {
                                        this.scene.gameData.starterMoveData[speciesId] = pokemonFormLevelMoves.hasOwnProperty(speciesId)
                                          ? {}
                                          : this.starterMoveset.slice(0) as StarterMoveset;
                                      }
                                      if (pokemonFormLevelMoves.hasOwnProperty(speciesId)) {
                                        if (!this.scene.gameData.starterMoveData[speciesId].hasOwnProperty(props.formIndex))
                                          this.scene.gameData.starterMoveData[speciesId][props.formIndex] = this.starterMoveset.slice(0) as StarterMoveset;
                                      } else
                                        this.scene.gameData.starterMoveData[speciesId] = this.starterMoveset.slice(0) as StarterMoveset;
                                      this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, false);
                                      showSwapOptions(this.starterMoveset);
                                    }
                                  };
                                }).concat({
                                  label: 'Cancel',
                                  handler: () => showSwapOptions(this.starterMoveset)
                                }),
                                maxOptions: 8,
                                yOffset: 19
                              });
                            });
                          });
                        }
                      }
                    }).concat({
                      label: 'Cancel',
                      handler: () => {
                        this.clearText();
                        ui.setMode(Mode.STARTER_SELECT);
                      }
                    }),
                    maxOptions: 8,
                    yOffset: 19
                  });
                });
              });
            };
            options.push({
              label: 'Manage Moves',
              handler: () => {
                showSwapOptions(this.starterMoveset);
              }
            });
          }
          options.push({
            label: 'Cancel',
            handler: () => {
              ui.setMode(Mode.STARTER_SELECT);
            }
          });
          ui.setModeWithoutClear(Mode.OPTION_SELECT, {
            options: options,
            yOffset: 47
          });
          success = true;
        }
      } else {
        const genStarters = this.starterSelectGenIconContainers[this.getGenCursorWithScroll()].getAll().length;
        const rows = Math.ceil(genStarters / 9);
        const row = Math.floor(this.cursor / 9);
        const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.dexAttrCursor);
        switch (button) {
          case Button.CYCLE_SHINY:
            if (this.canCycleShiny) {
              this.setSpeciesDetails(this.lastSpecies, !props.shiny, undefined, undefined, undefined, undefined);
              if (this.dexAttrCursor & DexAttr.SHINY)
                this.scene.playSound('sparkle');
              else
                success = true;
            }
            break;
          case Button.CYCLE_FORM:
            if (this.canCycleForm) {
              const formCount = this.lastSpecies.forms.length;
              let newFormIndex = props.formIndex;
              do {
                newFormIndex = (newFormIndex + 1) % formCount;
                if (this.speciesStarterDexEntry.caughtAttr & this.scene.gameData.getFormAttr(newFormIndex))
                  break;
              } while (newFormIndex !== props.formIndex);
              this.setSpeciesDetails(this.lastSpecies, undefined, newFormIndex, undefined, undefined, undefined);
              success = true;
            }
            break;
          case Button.CYCLE_GENDER:
            if (this.canCycleGender) {
              this.setSpeciesDetails(this.lastSpecies, undefined, undefined, !props.female, undefined, undefined);
              success = true;
            }
            break;
          case Button.CYCLE_ABILITY:
            if (this.canCycleAbility) {
              const abilityCount = this.lastSpecies.getAbilityCount();
              let newAbilityIndex = props.abilityIndex;
              do {
                newAbilityIndex = (newAbilityIndex + 1) % abilityCount;
                if (!newAbilityIndex) {
                  if (this.speciesStarterDexEntry.caughtAttr & DexAttr.ABILITY_1)
                    break;
                } else if (newAbilityIndex === 1) {
                  if (this.speciesStarterDexEntry.caughtAttr & (this.lastSpecies.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN))
                    break;
                } else {
                  if (this.speciesStarterDexEntry.caughtAttr & DexAttr.ABILITY_HIDDEN)
                    break;
                }
              } while (newAbilityIndex !== props.abilityIndex);
              this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, newAbilityIndex, undefined);
              success = true;
            }
            break;
          case Button.CYCLE_NATURE:
            if (this.canCycleNature) {
              const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry.natureAttr);
              const natureIndex = natures.indexOf(this.natureCursor);
              const newNature = natures[natureIndex < natures.length - 1 ? natureIndex + 1 : 0];
              this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, newNature);
              success = true;
            }
            break;
          case Button.UP:
            if (row)
              success = this.setCursor(this.cursor - 9);
            break;
          case Button.DOWN:
            if (row < rows - 2 || (row < rows - 1 && this.cursor % 9 <= (genStarters - 1) % 9))
              success = this.setCursor(this.cursor + 9);
            break;
          case Button.LEFT:
            if (this.cursor % 9)
              success = this.setCursor(this.cursor - 1);
            else {
              if (row >= Math.min(5, rows - 1))
                this.startCursorObj.setVisible(true);
              success = this.setGenMode(true);
            }
            break;
          case Button.RIGHT:
            if (this.cursor % 9 < (row < rows - 1 ? 8 : (genStarters - 1) % 9))
              success = this.setCursor(this.cursor + 1);
            else {
              if (row >= Math.min(5, rows - 1))
                this.startCursorObj.setVisible(true);
              success = this.setGenMode(true);
            }
            break;
        }
      }
    }
  
    if (success)
      ui.playSelect();
    else if (error)
      ui.playError();

    return success || error;
  }
  
  updateInstructions(): void {
    let instructionLines = [ ];
    let cycleInstructionLines = [];
    if (this.speciesStarterDexEntry?.caughtAttr) {
      if (this.canCycleShiny)
        cycleInstructionLines.push('R: Cycle Shiny');
      if (this.canCycleForm)
        cycleInstructionLines.push('F: Cycle Form');
      if (this.canCycleGender)
        cycleInstructionLines.push('G: Cycle Gender');
      if (this.canCycleAbility)
        cycleInstructionLines.push('E: Cycle Ability');
      if (this.canCycleNature)
        cycleInstructionLines.push('N: Cycle Nature');
    }

    if (cycleInstructionLines.length > 2) {
      cycleInstructionLines[0] += ' | ' + cycleInstructionLines.splice(1, 1);
      if (cycleInstructionLines.length > 2)
        cycleInstructionLines[1] += ' | ' + cycleInstructionLines.splice(2, 1);
    }

    for (let cil of cycleInstructionLines)
      instructionLines.push(cil);

    this.instructionsText.setText(instructionLines.join('\n'));
  }

  setCursor(cursor: integer): boolean {
    let changed = false;

    if (this.genMode) {
      changed = this.genCursor !== cursor;

      let genCursorWithScroll = this.getGenCursorWithScroll();

      if (!cursor && this.genScrollCursor) {
        this.genScrollCursor--;
        cursor++;
        this.updateGenOptions();
      } else if (cursor === 2 && this.genScrollCursor < gens.length - 3) {
        this.genScrollCursor++;
        cursor--;
        this.updateGenOptions();
      }

      if (genCursorWithScroll !== undefined)
        this.starterSelectGenIconContainers[genCursorWithScroll].setVisible(false);
      this.cursor = 0;
      this.genCursor = cursor;
      genCursorWithScroll = this.getGenCursorWithScroll();
      this.genCursorObj.setY(5 + 17 * this.genCursor);
      this.genCursorHighlightObj.setY(this.genCursorObj.y);
      this.starterSelectGenIconContainers[genCursorWithScroll].setVisible(true);

      for (let s = 0; s < this.starterCursorObjs.length; s++)
        this.starterCursorObjs[s].setVisible(this.starterGens[s] === genCursorWithScroll);
      for (let s = 0; s < this.pokerusCursorObjs.length; s++)
        this.pokerusCursorObjs[s].setVisible(this.pokerusGens[s] === genCursorWithScroll);

      const genLimit = this.genSpecies[genCursorWithScroll].length;
      for (let s = 0; s < 81; s++) {
        const speciesId = s < genLimit ? this.genSpecies[genCursorWithScroll][s].speciesId : 0 as Species;
        const slotVisible = speciesId && !!(this.scene.gameData.dexData[speciesId].caughtAttr);
        if (slotVisible) {
          const baseStarterValue = speciesStarters[speciesId];
          const starterValue = slotVisible ? this.scene.gameData.getSpeciesStarterValue(speciesId) : 0;
          let valueStr = starterValue.toString();
          if (valueStr.startsWith('0.'))
            valueStr = valueStr.slice(1);
          this.starterValueLabels[s].setText(valueStr);
          let textStyle: TextStyle;
          switch (baseStarterValue - starterValue) {
            case 0:
              textStyle = TextStyle.WINDOW;
              break;
            case 1:
            case 0.5:
              textStyle = TextStyle.SUMMARY_BLUE;
              break;
            default:
              textStyle = TextStyle.SUMMARY_GOLD;
              break;
          }
          this.starterValueLabels[s].setColor(this.getTextColor(textStyle));
          this.starterValueLabels[s].setShadowColor(this.getTextColor(textStyle, true));
        }
        this.starterValueLabels[s].setVisible(slotVisible);
        this.shinyIcons[s].setVisible(slotVisible && !!(this.scene.gameData.dexData[speciesId].caughtAttr & DexAttr.SHINY));
      }
    } else {
      changed = super.setCursor(cursor);

      this.cursorObj.setPosition(150 + 18 * (cursor % 9), 10 + 18 * Math.floor(cursor / 9));

      this.setSpecies(this.genSpecies[this.getGenCursorWithScroll()][cursor]);

      this.updateInstructions();
    }

    return changed;
  }

  getGenCursorWithScroll(): integer {
    return this.genCursor !== undefined
      ? this.genCursor + this.genScrollCursor
      : undefined;
  }

  updateGenOptions(): void {
    let text = '';
    for (let g = this.genScrollCursor; g <= this.genScrollCursor + 2; g++) {
      let optionText = gens[g];
      if (g === this.genScrollCursor && this.genScrollCursor)
        optionText = '↑';
      else if (g === this.genScrollCursor + 2 && this.genScrollCursor < gens.length - 3)
        optionText = '↓'
      text += `${text ? '\n' : ''}${optionText}`;
    }
    this.genOptionsText.setText(text);
  }

  setGenMode(genMode: boolean): boolean {
    this.genCursorObj.setVisible(genMode && !this.startCursorObj.visible);
    this.cursorObj.setVisible(!genMode && !this.startCursorObj.visible);
    
    if (genMode !== this.genMode) {
      this.genMode = genMode;

      this.setCursor(genMode ? this.genCursor : this.cursor);
      if (genMode)
        this.setSpecies(null);

      return true;
    }

    return false;
  }

  setSpecies(species: PokemonSpecies) {
    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;
    this.dexAttrCursor = species ? this.scene.gameData.getSpeciesDefaultDexAttr(species) : 0n;
    this.natureCursor = species ? this.scene.gameData.getSpeciesDefaultNature(species) : 0;

    if (this.statsMode) {
      if (this.speciesStarterDexEntry?.caughtAttr) {
        this.statsContainer.setVisible(true);
        this.showStats();
      } else {
        this.statsContainer.setVisible(false);
        this.statsContainer.updateIvs(null);
      }
    }

    if (this.lastSpecies) {
      const dexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(this.lastSpecies);
      const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, dexAttr);
      const lastSpeciesIcon = (this.starterSelectGenIconContainers[this.lastSpecies.generation - 1].getAt(this.genSpecies[this.lastSpecies.generation - 1].indexOf(this.lastSpecies)) as Phaser.GameObjects.Sprite);
      lastSpeciesIcon.setFrame(this.lastSpecies.getIconId(props.female, props.formIndex, props.shiny));
      this.iconAnimHandler.addOrUpdate(lastSpeciesIcon, PokemonIconAnimMode.NONE);
    }

    this.lastSpecies = species;

    if (species && (this.speciesStarterDexEntry?.seenAttr || this.speciesStarterDexEntry?.caughtAttr)) {
      this.pokemonNumberText.setText(Utils.padInt(species.speciesId, 4));
      this.pokemonNameText.setText(species.name);

      if (this.speciesStarterDexEntry?.caughtAttr) {
        this.pokemonGrowthRateText.setText(Utils.toReadableString(GrowthRate[species.growthRate]));
        this.pokemonGrowthRateText.setColor(getGrowthRateColor(species.growthRate));
        this.pokemonGrowthRateText.setShadowColor(getGrowthRateColor(species.growthRate, true));
        this.pokemonGrowthRateLabelText.setVisible(true);
        this.pokemonUncaughtText.setVisible(false);
        this.pokemonAbilityLabelText.setVisible(true);
        this.pokemonNatureLabelText.setVisible(true);
        this.pokemonCaughtCountLabelText.setVisible(true);
        this.pokemonCaughtCountText.setText(`${this.speciesStarterDexEntry.caughtCount}/${this.speciesStarterDexEntry.hatchedCount} (${this.speciesStarterDexEntry.caughtCount + this.speciesStarterDexEntry.hatchedCount})`);
        this.pokemonCaughtCountText.setVisible(true);
        this.iconAnimHandler.addOrUpdate(this.starterSelectGenIconContainers[species.generation - 1].getAt(this.genSpecies[species.generation - 1].indexOf(species)) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.PASSIVE);

        let starterIndex = -1;

        this.starterGens.every((g, i) => {
          const starterSpecies = this.genSpecies[g][this.starterCursors[i]];
          if (starterSpecies.speciesId === species.speciesId) {
            starterIndex = i;
            return false;
          }
          return true;
        });

        if (starterIndex > -1) {
          const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.starterAttr[starterIndex]);
          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.abilityIndex, this.starterNatures[starterIndex]);
        } else {
          const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species);
          const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);
          const props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
          
          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.abilityIndex, defaultNature);
        }
        this.pokemonSprite.clearTint();
        if (this.pokerusCursors.find((cursor: integer, i: integer) => cursor === this.cursor && this.pokerusGens[i] === this.genCursor))
          handleTutorial(this.scene, Tutorial.Pokerus);
      } else {
        this.pokemonGrowthRateText.setText('');
        this.pokemonGrowthRateLabelText.setVisible(false);
        this.pokemonUncaughtText.setVisible(true);
        this.pokemonAbilityLabelText.setVisible(false);
        this.pokemonNatureLabelText.setVisible(false);
        this.pokemonCaughtCountLabelText.setVisible(false);
        this.pokemonCaughtCountText.setVisible(false);

        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, true);
        const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);
        const props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        
        this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.abilityIndex, defaultNature, true);
        this.pokemonSprite.setTint(0x808080);
      }
    } else {
      this.pokemonNumberText.setText(Utils.padInt(0, 4));
      this.pokemonNameText.setText(species ? '???' : '');
      this.pokemonGrowthRateText.setText('');
      this.pokemonGrowthRateLabelText.setVisible(false);
      this.pokemonUncaughtText.setVisible(!!species);
      this.pokemonAbilityLabelText.setVisible(false);
      this.pokemonNatureLabelText.setVisible(false);
      this.pokemonCaughtCountLabelText.setVisible(false);
      this.pokemonCaughtCountText.setVisible(false);

      this.setSpeciesDetails(species, false, 0, false, 0, 0);
      this.pokemonSprite.clearTint();
    }
  }

  setSpeciesDetails(species: PokemonSpecies, shiny: boolean, formIndex: integer, female: boolean, abilityIndex: integer, natureIndex: integer, forSeen: boolean = false): void {
    const oldProps = species ? this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor) : null;
    const oldNatureIndex = this.natureCursor > -1 ? this.natureCursor : this.scene.gameData.getSpeciesDefaultNature(species);
    this.dexAttrCursor = 0n;
    this.natureCursor = -1;

    if (species) {
      this.dexAttrCursor |= (shiny !== undefined ? !shiny : !(shiny = oldProps.shiny)) ? DexAttr.NON_SHINY : DexAttr.SHINY;
      this.dexAttrCursor |= (female !== undefined ? !female : !(female = oldProps.female)) ? DexAttr.MALE : DexAttr.FEMALE;
      this.dexAttrCursor |= (abilityIndex !== undefined ? !abilityIndex : !(abilityIndex = oldProps.abilityIndex)) ? DexAttr.ABILITY_1 : species.ability2 && abilityIndex === 1 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
      this.dexAttrCursor |= this.scene.gameData.getFormAttr(formIndex !== undefined ? formIndex : (formIndex = oldProps.formIndex));
      this.natureCursor = natureIndex !== undefined ? natureIndex : (natureIndex = oldNatureIndex);
    }

    this.pokemonSprite.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    this.starterMoveset = null;
    this.speciesStarterMoves = [];

    if (species) {
      const dexEntry = this.scene.gameData.dexData[species.speciesId];
      if (!dexEntry.caughtAttr) {
        const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.scene.gameData.getSpeciesDefaultDexAttr(species, forSeen));
        const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);
        if (shiny === undefined || shiny !== props.shiny)
          shiny = props.shiny;
        if (formIndex === undefined || formIndex !== props.formIndex)
          formIndex = props.formIndex;
        if (female === undefined || female !== props.female)
          female = props.female;
        if (abilityIndex === undefined || abilityIndex !== props.abilityIndex)
          abilityIndex = props.abilityIndex;
        if (natureIndex === undefined || natureIndex !== defaultNature)
          natureIndex = defaultNature;
      }

      this.shinyOverlay.setVisible(shiny);
      this.pokemonNumberText.setColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, false));
      this.pokemonNumberText.setShadowColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, true));

      if (forSeen ? this.speciesStarterDexEntry?.seenAttr : this.speciesStarterDexEntry?.caughtAttr) {
        let starterIndex = -1;

        this.starterGens.every((g, i) => {
          const starterSpecies = this.genSpecies[g][this.starterCursors[i]];
          if (starterSpecies.speciesId === species.speciesId) {
            starterIndex = i;
            return false;
          }
          return true;
        });

        if (starterIndex > -1) {
          this.starterAttr[starterIndex] = this.dexAttrCursor;
          this.starterNatures[starterIndex] = this.natureCursor;
        }

        const assetLoadCancelled = new Utils.BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        species.loadAssets(this.scene, female, formIndex, shiny, true).then(() => {
          if (assetLoadCancelled.value)
            return;
          this.assetLoadCancelled = null;
          this.speciesLoaded.set(species.speciesId, true);
          this.pokemonSprite.play(species.getSpriteKey(female, formIndex, shiny));
          this.pokemonSprite.setVisible(!this.statsMode);
        });

        (this.starterSelectGenIconContainers[this.getGenCursorWithScroll()].getAt(this.cursor) as Phaser.GameObjects.Sprite).setFrame(species.getIconId(female, formIndex, shiny));

        this.canCycleShiny = !!(dexEntry.caughtAttr & DexAttr.NON_SHINY && dexEntry.caughtAttr & DexAttr.SHINY);
        this.canCycleGender = !!(dexEntry.caughtAttr & DexAttr.MALE && dexEntry.caughtAttr & DexAttr.FEMALE);
        this.canCycleAbility = [ dexEntry.caughtAttr & DexAttr.ABILITY_1, dexEntry.caughtAttr & DexAttr.ABILITY_2, dexEntry.caughtAttr & DexAttr.ABILITY_HIDDEN ].filter(a => a).length > 1;
        this.canCycleForm = species.forms.filter(f => !f.formKey || !pokemonFormChanges[species.speciesId]?.find(fc => fc.formKey))
          .map((_, f) => dexEntry.caughtAttr & this.scene.gameData.getFormAttr(f)).filter(a => a).length > 1;
        this.canCycleNature = this.scene.gameData.getNaturesForAttr(dexEntry.natureAttr).length > 1;
      }

      if (dexEntry.caughtAttr && species.malePercent !== null) {
        const gender = !female ? Gender.MALE : Gender.FEMALE;
        this.pokemonGenderText.setText(getGenderSymbol(gender));
        this.pokemonGenderText.setColor(getGenderColor(gender));
        this.pokemonGenderText.setShadowColor(getGenderColor(gender, true));
      } else
        this.pokemonGenderText.setText('');

      if (dexEntry.caughtAttr) {
        const ability = this.lastSpecies.getAbility(abilityIndex);
        this.pokemonAbilityText.setText(allAbilities[ability].name);

        const isHidden = ability === this.lastSpecies.abilityHidden;
        this.pokemonAbilityText.setColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD));
        this.pokemonAbilityText.setShadowColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD, true));

        this.pokemonNatureText.setText(getNatureName(natureIndex as unknown as Nature, true, true, false, this.scene.uiTheme));

        let levelMoves: LevelMoves;
        if (pokemonFormLevelMoves.hasOwnProperty(species.speciesId) && pokemonFormLevelMoves[species.speciesId].hasOwnProperty(formIndex))
          levelMoves = pokemonFormLevelMoves[species.speciesId][formIndex];
        else
          levelMoves = pokemonSpeciesLevelMoves[species.speciesId];
        this.speciesStarterMoves.push(...levelMoves.filter(lm => lm[0] <= 5).map(lm => lm[1]));
        if (speciesEggMoves.hasOwnProperty(species.speciesId)) {
          for (let em = 0; em < 4; em++) {
            if (this.scene.gameData.starterEggMoveData[species.speciesId] & Math.pow(2, em))
              this.speciesStarterMoves.push(speciesEggMoves[species.speciesId][em]);
          }
        }
        
        const speciesMoveData = this.scene.gameData.starterMoveData[species.speciesId];
        let moveData: StarterMoveset = speciesMoveData
          ? Array.isArray(speciesMoveData)
            ? speciesMoveData as StarterMoveset
            : (speciesMoveData as StarterFormMoveData)[formIndex]
          : null;
        const availableStarterMoves = this.speciesStarterMoves.concat(speciesEggMoves.hasOwnProperty(species.speciesId) ? speciesEggMoves[species.speciesId].filter((_, em: integer) => this.scene.gameData.starterEggMoveData[species.speciesId] & Math.pow(2, em)) : []);
        this.starterMoveset = (moveData || (this.speciesStarterMoves.slice(0, 4) as StarterMoveset)).filter(m => availableStarterMoves.find(sm => sm === m)) as StarterMoveset;
        // Consolidate move data if it contains an incompatible move
        if (this.starterMoveset.length < 4 && this.starterMoveset.length < availableStarterMoves.length)
          this.starterMoveset.push(...availableStarterMoves.filter(sm => this.starterMoveset.indexOf(sm) === -1).slice(0, 4 - this.starterMoveset.length));
      } else {
        this.pokemonAbilityText.setText('');
        this.pokemonNatureText.setText('');
      }
    } else {
      this.shinyOverlay.setVisible(false);
      this.pokemonNumberText.setColor(this.getTextColor(TextStyle.SUMMARY));
      this.pokemonNumberText.setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));
      this.pokemonGenderText.setText('');
      this.pokemonAbilityText.setText('');
      this.pokemonNatureText.setText('');
    }

    if (!this.starterMoveset)
      this.starterMoveset = this.speciesStarterMoves.slice(0, 4) as StarterMoveset;

    for (let m = 0; m < 4; m++) {
      const move = m < this.starterMoveset.length ? allMoves[this.starterMoveset[m]] : null;
      this.pokemonMoveBgs[m].setFrame(Type[move ? move.type : Type.UNKNOWN].toString().toLowerCase());
      this.pokemonMoveLabels[m].setText(move ? move.name : '-');
      this.pokemonMoveContainers[m].setVisible(!!move);
    }

    const hasEggMoves = species && speciesEggMoves.hasOwnProperty(species.speciesId);

    for (let em = 0; em < 4; em++) {
      const eggMove = hasEggMoves ? allMoves[speciesEggMoves[species.speciesId][em]] : null;
      const eggMoveUnlocked = eggMove && this.scene.gameData.starterEggMoveData.hasOwnProperty(species.speciesId) && this.scene.gameData.starterEggMoveData[species.speciesId] & Math.pow(2, em);
      this.pokemonEggMoveBgs[em].setFrame(Type[eggMove ? eggMove.type : Type.UNKNOWN].toString().toLowerCase());
      this.pokemonEggMoveLabels[em].setText(eggMove && eggMoveUnlocked ? eggMove.name : '???');
    }

    this.pokemonEggMovesContainer.setVisible(hasEggMoves);

    this.pokemonAdditionalMoveCountLabel.setText(`(+${Math.max(this.speciesStarterMoves.length - 4, 0)})`);
    this.pokemonAdditionalMoveCountLabel.setVisible(this.speciesStarterMoves.length > 4);

    this.updateInstructions();
  }

  popStarter(): void {
    this.starterGens.pop();
    this.starterCursors.pop();
    this.starterAttr.pop();
    this.starterNatures.pop();
    this.starterMovesets.pop();
    this.starterCursorObjs[this.starterCursors.length].setVisible(false);
    this.starterIcons[this.starterCursors.length].setTexture('pokemon_icons_0');
    this.starterIcons[this.starterCursors.length].setFrame('unknown');
    this.tryUpdateValue();
  }

  tryUpdateValue(add?: integer): boolean {
    const value = this.starterGens.reduce((total: integer, gen: integer, i: integer) => total += this.scene.gameData.getSpeciesStarterValue(this.genSpecies[gen][this.starterCursors[i]].speciesId), 0);
    const newValue = value + (add || 0);
    const overLimit = newValue > 10;
    let newValueStr = newValue.toString();
    if (newValueStr.startsWith('0.'))
      newValueStr = newValueStr.slice(1);
    this.valueLimitLabel.setText(`${newValueStr}/10`);
    this.valueLimitLabel.setColor(this.getTextColor(!overLimit ? TextStyle.TOOLTIP_CONTENT : TextStyle.SUMMARY_PINK));
    this.valueLimitLabel.setShadowColor(this.getTextColor(!overLimit ? TextStyle.TOOLTIP_CONTENT : TextStyle.SUMMARY_PINK, true));
    if (overLimit) {
      this.scene.time.delayedCall(Utils.fixedInt(500), () => this.tryUpdateValue());
      return false;
    }
    this.value = newValue;
    return true;
  }

  tryStart(manualTrigger: boolean = false): boolean {
    if (!this.starterGens.length)
      return false;

    const ui = this.getUi();

    const cancel = () => {
      ui.setMode(Mode.STARTER_SELECT);
      if (!manualTrigger)
        this.popStarter();
      this.clearText();
    };

    ui.showText('Begin with these Pokémon?', null, () => {
      ui.setModeWithoutClear(Mode.CONFIRM, () => {
        const startRun = (gameMode: GameModes) => {
          this.scene.gameMode = gameModes[gameMode];
          this.scene.money = this.scene.gameMode.getStartingMoney();
          ui.setMode(Mode.STARTER_SELECT);
          const thisObj = this;
          const originalStarterSelectCallback = this.starterSelectCallback;
          this.starterSelectCallback = null;
          originalStarterSelectCallback(new Array(this.starterGens.length).fill(0).map(function (_, i) {
            const starterSpecies = thisObj.genSpecies[thisObj.starterGens[i]][thisObj.starterCursors[i]];
            return {
              species: starterSpecies,
              dexAttr: thisObj.starterAttr[i],
              nature: thisObj.starterNatures[i] as Nature,
              moveset: thisObj.starterMovesets[i],
              pokerus: !![ 0, 1, 2 ].filter(n => thisObj.pokerusGens[n] === starterSpecies.generation - 1 && thisObj.pokerusCursors[n] === thisObj.genSpecies[starterSpecies.generation - 1].indexOf(starterSpecies)).length
            };
          }));
        };
        if (this.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
          ui.setMode(Mode.STARTER_SELECT);
          const options = [
            {
              label: gameModes[GameModes.CLASSIC].getName(),
              handler: () => startRun(GameModes.CLASSIC)
            },
            {
              label: gameModes[GameModes.ENDLESS].getName(),
              handler: () => startRun(GameModes.ENDLESS)
            }
          ];
          if (this.scene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]) {
            options.push({
              label: gameModes[GameModes.SPLICED_ENDLESS].getName(),
              handler: () => startRun(GameModes.SPLICED_ENDLESS)
            });
          }
          options.push({
            label: 'Cancel',
            handler: () => cancel()
          });
          ui.showText('Select a game mode.', null, () => ui.setModeWithoutClear(Mode.OPTION_SELECT, { options: options, yOffset: 19 }));
        } else
          startRun(GameModes.CLASSIC);
      }, cancel, null, null, 19);
    });

    return true;
  }

  toggleStatsMode(on?: boolean): void {
    if (on === undefined)
      on = !this.statsMode;
    if (on) {
      this.showStats();
      this.statsMode = true;
      this.pokemonSprite.setVisible(false);
    } else {
      this.statsMode = false;
      this.statsContainer.setVisible(false);
      this.pokemonSprite.setVisible(!!this.speciesStarterDexEntry?.caughtAttr);
      this.statsContainer.updateIvs(null);
    }
  }
  
  showStats(): void {
    if (!this.speciesStarterDexEntry)
      return;

    this.statsContainer.setVisible(true);

    this.statsContainer.updateIvs(this.speciesStarterDexEntry.ivs);
  }

  clearText() {
    this.starterSelectMessageBoxContainer.setVisible(false);
    super.clearText();
  }

  clear(): void {
    super.clear();
    this.cursor = -1;
    this.starterSelectContainer.setVisible(false);

    while (this.starterCursors.length)
      this.popStarter();

    if (this.statsMode)
      this.toggleStatsMode(false);
  }
}