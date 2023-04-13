import BattleScene, { Button } from "../battle-scene";
import PokemonSpecies, { allSpecies } from "../pokemon-species";
import { Species } from "../species";
import { TextStyle, addTextObject } from "../text";
import { Mode } from "./ui";
import * as Utils from "../utils";
import MessageUiHandler from "./message-ui-handler";

export type StarterSelectCallback = (starterSpecies: PokemonSpecies[]) => void;

export default class StarterSelectUiHandler extends MessageUiHandler {
    private starterSelectContainer: Phaser.GameObjects.Container;
    private starterSelectGenIconContainers: Phaser.GameObjects.Container[];
    private pokemonNumberText: Phaser.GameObjects.Text;
    private pokemonSprite: Phaser.GameObjects.Sprite;
    private pokemonNameText: Phaser.GameObjects.Text;
    private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;

    private genMode: boolean;
    private genCursor: integer = 0;
    private genSpecies: PokemonSpecies[][] = [];
    private lastSpecies: PokemonSpecies;
    private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
    private starterGens: integer[] = [];
    private starterCursors: integer[] = [];

    private assetLoadCancelled: Utils.BooleanHolder;
    private cursorObj: Phaser.GameObjects.Image;
    private starterCursorObjs: Phaser.GameObjects.Image[];
    private starterIcons: Phaser.GameObjects.Sprite[];
    private genCursorObj: Phaser.GameObjects.Image;
    private genCursorHighlightObj: Phaser.GameObjects.Image;

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

      const starterSelectBg = this.scene.add.image(1, 1, 'starter_select_bg');
      starterSelectBg.setOrigin(0, 0);
      this.starterSelectContainer.add(starterSelectBg);

      this.pokemonNumberText = addTextObject(this.scene, 17, 1, '000', TextStyle.SUMMARY);
      this.pokemonNumberText.setOrigin(0, 0);
      this.starterSelectContainer.add(this.pokemonNumberText);

      this.pokemonNameText = addTextObject(this.scene, 6, 112, '', TextStyle.SUMMARY);
      this.pokemonNameText.setOrigin(0, 0);
      this.starterSelectContainer.add(this.pokemonNameText);

      const genText = addTextObject(this.scene, 115, 6, 'I\nII\nIII\nIV\nV', TextStyle.WINDOW);
      genText.setLineSpacing(16);
      this.starterSelectContainer.add(genText);

      this.starterSelectGenIconContainers = new Array(5).fill(null).map((_, i) => {
        const container = this.scene.add.container(149, 9);
        if (i)
          container.setVisible(false);
        this.starterSelectContainer.add(container);
        return container;
      });

      this.starterCursorObjs = new Array(3).fill(null).map(() => {
        const cursorObj = this.scene.add.image(0, 0, 'starter_select_cursor_highlight');
        cursorObj.setVisible(false);
        cursorObj.setOrigin(0, 0);
        this.starterSelectContainer.add(cursorObj);
        return cursorObj;
      });

      this.cursorObj = this.scene.add.image(0, 0, 'starter_select_cursor');
      this.cursorObj.setOrigin(0, 0);
      this.starterSelectContainer.add(this.cursorObj);

      this.genCursorHighlightObj = this.scene.add.image(111, 5, 'starter_select_gen_cursor_highlight');
      this.genCursorHighlightObj.setOrigin(0, 0);
      this.starterSelectContainer.add(this.genCursorHighlightObj);

      this.genCursorObj = this.scene.add.image(111, 5, 'starter_select_gen_cursor');
      this.genCursorObj.setVisible(false);
      this.genCursorObj.setOrigin(0, 0);
      this.starterSelectContainer.add(this.genCursorObj);
      
      for (let g = 0; g < this.starterSelectGenIconContainers.length; g++) {
        let s = 0;
        this.genSpecies.push([]);

        for (let species of allSpecies) {
          if (species.getPrevolutionLevels(true).length || species.generation !== g + 1)
            continue;
          this.speciesLoaded.set(species.speciesId, false);
          this.genSpecies[g].push(species);
          species.generateIconAnim(this.scene);
          const x = (s % 9) * 18;
          const y = Math.floor(s / 9) * 18;
          const icon = this.scene.add.sprite(x, y, species.getIconAtlasKey());
          icon.setScale(0.5);
          icon.setOrigin(0, 0);
          icon.play(species.getIconKey()).stop();
          this.starterSelectGenIconContainers[g].add(icon);
          s++;
        }
      }

      this.scene.anims.create({
        key: 'pkmn_icon__000',
        frames: this.scene.anims.generateFrameNames('pokemon_icons_0', { prefix: `000_`, zeroPad: 2, suffix: '.png', start: 1, end: 34 }),
        frameRate: 128,
        repeat: -1
      });

      this.starterIcons = new Array(3).fill(null).map((_, i) => {
        const icon = this.scene.add.sprite(115, 95 + 16 * i, 'pokemon_icons_0');
        icon.setScale(0.5);
        icon.setOrigin(0, 0);
        icon.play('pkmn_icon__000');
        this.starterSelectContainer.add(icon);
        return icon;
      });

      this.pokemonSprite = this.scene.add.sprite(53, 63, `pkmn__sub`);
      this.starterSelectContainer.add(this.pokemonSprite);

      this.starterSelectMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
      this.starterSelectMessageBoxContainer.setVisible(false);
      this.starterSelectContainer.add(this.starterSelectMessageBoxContainer);

      const starterSelectMessageBox = this.scene.add.image(0, 0, 'starter_select_message');
      starterSelectMessageBox.setOrigin(0, 1);
      this.starterSelectMessageBoxContainer.add(starterSelectMessageBox);

      this.message = addTextObject(this.scene, 8, -8, '', TextStyle.WINDOW, { maxLines: 1 });
      this.message.setOrigin(0, 1);
      this.starterSelectMessageBoxContainer.add(this.message);
    }
  
    show(args: any[]): void {
      if (args.length >= 1 && args[0] instanceof Function) {
        super.show(args);

        this.starterSelectCallback = args[0] as StarterSelectCallback;

        this.starterSelectContainer.setVisible(true);

        this.setGenMode(false);
        this.setCursor(0);
        this.setGenMode(true);
        this.setCursor(0);
      }
    }

    showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
      super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

      this.starterSelectMessageBoxContainer.setVisible(true);
    }
  
    processInput(button: Button): void {
      const ui = this.getUi();

      let success = false;
  
      if (this.genMode) {
        switch (button) {
          case Button.UP:
            if (this.genCursor)
              success = this.setCursor(this.genCursor - 1);
            break;
          case Button.DOWN:
            if (this.genCursor < 4)
              success = this.setCursor(this.genCursor + 1);
            break;
          case Button.RIGHT:
            success = this.setGenMode(false);
            break;
        }
      } else {
        if (button === Button.ACTION) {
          if (this.starterCursors.length < 3) {
            let isDupe = false;
            for (let s = 0; s < this.starterCursors.length; s++) {
              if (this.starterGens[s] === this.genCursor && this.starterCursors[s] === this.cursor) {
                isDupe = true;
                break;
              }
            }
            if (!isDupe) {
              const cursorObj = this.starterCursorObjs[this.starterCursors.length];
              cursorObj.setVisible(true);
              cursorObj.setPosition(this.cursorObj.x, this.cursorObj.y);
              const species = this.genSpecies[this.genCursor][this.cursor];
              this.starterIcons[this.starterCursors.length].play(species.getIconKey());
              this.starterGens.push(this.genCursor);
              this.starterCursors.push(this.cursor);
              if (this.speciesLoaded.get(species.speciesId))
                species.cry(this.scene);
              if (this.starterCursors.length === 3) {
                ui.showText('Begin with these POKéMON?', null, () => {
                  ui.setModeWithoutClear(Mode.CONFIRM, () => {
                    ui.setMode(Mode.STARTER_SELECT);
                    const originalStarterSelectCallback = this.starterSelectCallback;
                    this.starterSelectCallback = null;
                    originalStarterSelectCallback(new Array(3).fill(0).map((_, i) => this.genSpecies[this.starterGens[i]][this.starterCursors[i]]));
                  }, () => {
                    ui.setMode(Mode.STARTER_SELECT);
                    this.popStarter();
                    this.clearText();
                  });
                });
              }
              success = true;
            } else
              ui.playError();
          }
        } else if (button === Button.CANCEL) {
          if (this.starterCursors.length) {
            this.popStarter();
            success = true;
          } else
            ui.playError();
        } else {
          const genStarters = this.starterSelectGenIconContainers[this.genCursor].getAll().length;
          const rows = Math.ceil(genStarters / 9);
          const row = Math.floor(this.cursor / 9);
          switch (button) {
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
              else
                success = this.setGenMode(true);
              break;
            case Button.RIGHT:
              if (this.cursor % 9 < (row < rows - 1 ? 8 : (genStarters - 1) % 9))
                success = this.setCursor(this.cursor + 1);
              break;
          }
        }
      }
    
      if (success)
        ui.playSelect();
    }
  
    setCursor(cursor: integer): boolean {
      let changed = false;

      if (this.genMode) {
        changed = this.genCursor !== cursor;

        if (this.genCursor !== undefined)
          this.starterSelectGenIconContainers[this.genCursor].setVisible(false);
        this.cursor = 0;
        this.genCursor = cursor;
        this.genCursorObj.setY(5 + 17 * this.genCursor);
        this.genCursorHighlightObj.setY(this.genCursorObj.y);
        this.starterSelectGenIconContainers[this.genCursor].setVisible(true);

        for (let s = 0; s < this.starterCursorObjs.length; s++)
          this.starterCursorObjs[s].setVisible(this.starterGens[s] === cursor);
      } else {
        changed = super.setCursor(cursor);

        this.cursorObj.setPosition(148 + 18 * (cursor % 9), 10 + 18 * Math.floor(cursor / 9));

        this.setSpecies(this.genSpecies[this.genCursor][cursor]);
      }
  
      return changed;
    }

    setGenMode(genMode: boolean): boolean {
      if (genMode !== this.genMode) {
        this.genMode = genMode;

        this.genCursorObj.setVisible(genMode);
        this.cursorObj.setVisible(!genMode);

        this.setCursor(genMode ? this.genCursor : this.cursor);
        if (genMode)
          this.setSpecies(null);

        return true;
      }

      return false;
    }

    setSpecies(species: PokemonSpecies) {
      this.pokemonSprite.setVisible(false);

      if (this.assetLoadCancelled) {
        this.assetLoadCancelled.value = true;
        this.assetLoadCancelled = null;
      }

      if (this.lastSpecies)
        (this.starterSelectGenIconContainers[this.lastSpecies.generation - 1].getAt(this.genSpecies[this.lastSpecies.generation - 1].indexOf(this.lastSpecies)) as Phaser.GameObjects.Sprite).stop();

      if (species) {
        this.pokemonNumberText.setText(Utils.padInt(species.speciesId, 3));
        this.pokemonNameText.setText(species.name.toUpperCase());

        const assetLoadCancelled = new Utils.BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        const female = Utils.randInt(2) === 1;
        species.loadAssets(this.scene, female, false, true).then(() => {
          if (assetLoadCancelled.value)
            return;
          this.assetLoadCancelled = null;
          this.speciesLoaded.set(species.speciesId, true);
          this.pokemonSprite.play(species.getSpriteKey(female, false));
          this.pokemonSprite.setVisible(true);
        });

        (this.starterSelectGenIconContainers[this.genCursor].getAt(this.cursor) as Phaser.GameObjects.Sprite).play(species.getIconKey());
      } else {
        this.pokemonNumberText.setText(Utils.padInt(0, 3));
        this.pokemonNameText.setText('');
      }

      this.lastSpecies = species;
    }

    popStarter(): void {
      this.starterGens.pop();
      this.starterCursors.pop();
      this.starterCursorObjs[this.starterCursors.length].setVisible(false);
      this.starterIcons[this.starterCursors.length].play('pkmn_icon__000');
    }

    clearText() {
      this.starterSelectMessageBoxContainer.setVisible(false);
      super.clearText();
    }
  
    clear(): void {
      super.clear();
      this.cursor = -1;
      this.starterSelectContainer.setVisible(false);
    }
  }  