import Phaser from 'phaser';
import { Biome } from './data/biome';
import UI, { Mode } from './ui/ui';
import { EncounterPhase, SummonPhase, CommandPhase, NextEncounterPhase, NewBiomeEncounterPhase, SelectBiomePhase, SelectStarterPhase, MessagePhase } from './battle-phases';
import Pokemon, { PlayerPokemon, EnemyPokemon } from './pokemon';
import PokemonSpecies, { allSpecies, getPokemonSpecies } from './data/pokemon-species';
import * as Utils from './utils';
import { Modifier, ModifierBar, ConsumablePokemonModifier, ConsumableModifier, PartyShareModifier, PokemonHpRestoreModifier, HealingBoosterModifier, PersistentModifier, PokemonHeldItemModifier, ModifierPredicate } from './modifier/modifier';
import { PokeballType } from './data/pokeball';
import { Species } from './data/species';
import { initAutoPlay } from './system/auto-play';
import { Battle } from './battle';
import { initCommonAnims, initMoveAnim, loadCommonAnimAssets, loadMoveAnimAssets, populateAnims } from './data/battle-anims';
import { BattlePhase } from './battle-phase';
import { initGameSpeed } from './system/game-speed';
import { Arena } from './arena';
import { GameData } from './system/game-data';
import StarterSelectUiHandler from './ui/starter-select-ui-handler';
import { TextStyle, addTextObject } from './ui/text';
import { Moves } from './data/move';
import { getDefaultModifierTypeForTier, getEnemyModifierTypesForWave } from './modifier/modifier-type';

const enableAuto = true;
const quickStart = false;
export const startingLevel = 5;
export const startingWave = 1;
export const startingBiome = Biome.TOWN;

export enum Button {
	UP,
	DOWN,
	LEFT,
	RIGHT,
	ACTION,
	CANCEL,
	CYCLE_SHINY,
	CYCLE_FORM,
	CYCLE_GENDER,
	QUICK_START,
	AUTO,
	SPEED_UP,
	SLOW_DOWN
}

interface PokeballCounts {
	[pb: string]: integer;
}

export default class BattleScene extends Phaser.Scene {
	public auto: boolean;
	public gameSpeed: integer = 1;
	public quickStart: boolean = quickStart;

	public gameData: GameData;

	private phaseQueue: BattlePhase[];
	private phaseQueuePrepend: BattlePhase[];
	private currentPhase: BattlePhase;
	public field: Phaser.GameObjects.Container;
	public fieldUI: Phaser.GameObjects.Container;
	public arenaBg: Phaser.GameObjects.Image;
	public arenaBgTransition: Phaser.GameObjects.Image;
	public arenaPlayer: Phaser.GameObjects.Image;
	public arenaPlayerTransition: Phaser.GameObjects.Image;
	public arenaEnemy: Phaser.GameObjects.Image;
	public arenaEnemyTransition: Phaser.GameObjects.Image;
	public arenaNextEnemy: Phaser.GameObjects.Image;
	public arena: Arena;
	public trainer: Phaser.GameObjects.Sprite;
	public currentBattle: Battle;
	public pokeballCounts: PokeballCounts;
	private party: PlayerPokemon[];
	private waveCountText: Phaser.GameObjects.Text;
	private modifierBar: ModifierBar;
	private enemyModifierBar: ModifierBar;
	private modifiers: PersistentModifier[];
	private enemyModifiers: PokemonHeldItemModifier[];
	public uiContainer: Phaser.GameObjects.Container;
	public ui: UI;

	//public spritePipeline: SpritePipeline;

	private bgm: Phaser.Sound.BaseSound;
	private bgmResumeTimer: Phaser.Time.TimerEvent;
	
	private buttonKeys: Phaser.Input.Keyboard.Key[][];

	private blockInput: boolean;

	constructor() {
		super('battle');

		this.gameData = new GameData(this);
		
		this.phaseQueue = [];
		this.phaseQueuePrepend = [];
	}

	loadImage(key: string, folder: string, filename?: string) {
		if (!filename)
			filename = `${key}.png`;
		this.load.image(key, `images/${folder}/${filename}`);
	}

	loadAtlas(key: string, folder: string, filenameRoot?: string) {
		if (!filenameRoot)
			filenameRoot = key;
		if (folder)
			folder += '/';
		this.load.atlas(key, `images/${folder}${filenameRoot}.png`, `images/${folder}/${filenameRoot}.json`);
	}

	loadSpritesheet(key: string, folder: string, size: integer, filename?: string) {
		if (!filename)
			filename = `${key}.png`;
		this.load.spritesheet(key, `images/${folder}/${filename}`, { frameWidth: size, frameHeight: size });
	}

	loadSe(key: string, folder?: string, filenames?: string | string[]) {
		if (!filenames)
			filenames = `${key}.wav`;
		if (!folder)
			folder = '';
		else
			folder += '/';
		if (!Array.isArray(filenames))
			filenames = [ filenames ];
		for (let f of filenames as string[]) {
			this.load.audio(key, `audio/se/${folder}${f}`);
		}
	}

	loadBgm(key: string, filename?: string) {
		if (!filename)
			filename = `${key}.mp3`;
		this.load.audio(key, `audio/bgm/${filename}`);
	}

	preload() {
		// Load menu images
		this.loadImage('bg', 'ui');
		this.loadImage('bg_command', 'ui');
		this.loadImage('bg_fight', 'ui');
		this.loadAtlas('prompt', 'ui');
		this.loadImage('cursor', 'ui');
		this.loadImage('pbinfo_player', 'ui');
		this.loadImage('pbinfo_enemy', 'ui');
		this.loadImage('overlay_lv', 'ui');
		this.loadAtlas('numbers', 'ui');
		this.loadAtlas('overlay_hp', 'ui');
		this.loadImage('overlay_exp', 'ui');
		this.loadImage('icon_owned', 'ui');
		this.loadImage('level_up_stats', 'ui');
		this.loadImage('ball_window', 'ui');
		this.loadImage('boolean_window', 'ui');

		this.loadImage('party_bg', 'ui');
		this.loadAtlas('party_slot_main', 'ui');
		this.loadAtlas('party_slot', 'ui');
		this.loadImage('party_slot_overlay_lv', 'ui');
		this.loadImage('party_slot_hp_bar', 'ui');
		this.loadAtlas('party_slot_hp_overlay', 'ui');
		this.loadAtlas('party_pb', 'ui');
		this.loadImage('party_message', 'ui');
		this.loadImage('party_message_large', 'ui');
		this.loadImage('party_message_options', 'ui');
		this.loadImage('party_message_options_wide', 'ui');
		this.loadImage('party_options_top', 'ui');
		this.loadImage('party_options_center', 'ui');
		this.loadImage('party_options_bottom', 'ui');
		this.loadImage('party_options_wide_top', 'ui');
		this.loadImage('party_options_wide_center', 'ui');
		this.loadImage('party_options_wide_bottom', 'ui');
		this.loadAtlas('party_cancel', 'ui');

		this.loadImage('summary_bg', 'ui');
		this.loadImage('summary_overlay_shiny', 'ui');
		this.loadImage('summary_profile', 'ui');
		this.loadImage('summary_moves', 'ui');
		this.loadImage('summary_moves_effect', 'ui');
		this.loadImage('summary_moves_overlay_row', 'ui');
		this.loadImage('summary_moves_overlay_pp', 'ui');
		this.loadAtlas('summary_moves_cursor', 'ui');

		for (let o = 1; o <= 3; o++)
			this.loadImage(`option_select_window_${o}`, 'ui');

		this.loadImage('starter_select_bg', 'ui');
		this.loadImage('starter_select_message', 'ui');
		this.loadImage('starter_select_cursor', 'ui');
		this.loadImage('starter_select_cursor_highlight', 'ui');
		this.loadImage('starter_select_gen_cursor', 'ui');
		this.loadImage('starter_select_gen_cursor_highlight', 'ui');

		// Load arena images
		Utils.getEnumValues(Biome).map(at => {
			const atKey = Biome[at].toLowerCase();
			this.loadImage(`${atKey}_bg`, 'arenas', `${atKey}_bg.png`);
			this.loadImage(`${atKey}_a`, 'arenas', `${atKey}_a.png`);
			this.loadImage(`${atKey}_b`, 'arenas', `${atKey}_b.png`);
		});

		// Load trainer images
		this.loadImage('trainer_m', 'trainer');
		this.loadAtlas('trainer_m_pb', 'trainer');

		// Load pokemon-related images
		this.loadImage(`pkmn__back__sub`, 'pokemon/back', 'sub.png');
		this.loadImage(`pkmn__sub`, 'pokemon', 'sub.png');
		this.loadAtlas('battle_stats', 'effects');
		this.loadAtlas('shiny', 'effects');
		this.loadImage('evo_sparkle', 'effects');
		this.load.video('evo_bg', 'images/effects/evo_bg.mp4', null, false, true);

		this.loadAtlas('pb', '');
		this.loadAtlas('items', '');
		this.loadAtlas('types', '');
		this.loadAtlas('statuses', '');
		this.loadAtlas('categories', '');

		for (let i = 0; i < 6; i++)
			this.loadAtlas(`pokemon_icons_${i}`, 'ui');

		this.loadSe('select');
		this.loadSe('menu_open');
		this.loadSe('hit');
		this.loadSe('hit_strong');
		this.loadSe('hit_weak');
		this.loadSe('stat_up');
		this.loadSe('stat_down');
		this.loadSe('faint');
		this.loadSe('flee');
		this.loadSe('low_hp');
		this.loadSe('exp');
		this.loadSe('level_up');
		this.loadSe('sparkle');
		this.loadSe('restore');
		this.loadSe('shine');
		this.loadSe('charge');
		this.loadSe('beam');
		this.loadSe('upgrade');
		this.loadSe('error');

		this.loadSe('pb');
		this.loadSe('pb_rel');
		this.loadSe('pb_throw');
		this.loadSe('pb_bounce_1');
		this.loadSe('pb_bounce_2');
		this.loadSe('pb_move');
		this.loadSe('pb_catch');
		this.loadSe('pb_lock');

		this.loadBgm('menu');
		this.loadBgm('level_up_fanfare');
		this.loadBgm('evolution');
		this.loadBgm('evolution_fanfare');

		//this.load.glsl('sprite', 'shaders/sprite.frag');

		populateAnims();
	}

	create() {
		initGameSpeed.apply(this);

		this.setupControls();

		this.load.setBaseURL();

		//this.spritePipeline = (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines.get('Sprite') as SpritePipeline;

		this.time.delayedCall(20, () => this.launchBattle());
	}

	update() {
		this.checkInput();
	}

	launchBattle() {
		const field = this.add.container(0, 0);
		field.setScale(6);

		this.field = field;

		const fieldUI = this.add.container(0, this.game.canvas.height);
		fieldUI.setDepth(1);
		fieldUI.setScale(6);

		this.fieldUI = fieldUI;

		const uiContainer = this.add.container(0, 0);
		uiContainer.setDepth(2);
		uiContainer.setScale(6);

		this.uiContainer = uiContainer;

		this.modifiers = [];
		this.enemyModifiers = [];

		this.modifierBar = new ModifierBar(this);
		this.add.existing(this.modifierBar);
		uiContainer.add(this.modifierBar);

		this.enemyModifierBar = new ModifierBar(this, true);
		this.add.existing(this.enemyModifierBar);
		uiContainer.add(this.enemyModifierBar);

		this.waveCountText = addTextObject(this, (this.game.canvas.width / 6) - 2, 0, startingWave.toString(), TextStyle.BATTLE_INFO);
		this.waveCountText.setOrigin(1, 0);
		this.updateWaveCountPosition();
		this.fieldUI.add(this.waveCountText);

		this.party = [];

		let loadPokemonAssets = [];

		this.quickStart = this.quickStart || this.isButtonPressed(Button.QUICK_START);

		this.arenaBg = this.add.sprite(0, 0, 'plains_bg');
		this.arenaBgTransition = this.add.sprite(0, 0, `plains_bg`);
		this.arenaPlayer = this.add.sprite(0, 0, `plains_a`);
		this.arenaPlayerTransition = this.add.sprite(0, 0, `plains_a`);
		this.arenaEnemy = this.add.sprite(0, 0, `plains_b`);
		this.arenaNextEnemy = this.add.sprite(0, 0, `plains_b`);

		this.arenaBgTransition.setVisible(false);
		this.arenaPlayerTransition.setVisible(false);

		[this.arenaBg, this.arenaBgTransition, this.arenaPlayer, this.arenaPlayerTransition, this.arenaEnemy, this.arenaNextEnemy].forEach(a => {
			a.setOrigin(0, 0);
			field.add(a);
		});

		if (this.quickStart) {
			for (let s = 0; s < 3; s++) {
				const playerSpecies = getPokemonSpecies((getPokemonSpecies(s === 0 ? Species.TORCHIC : s === 1 ? Species.TREECKO : Species.MUDKIP)).getSpeciesForLevel(startingLevel, true));
				const playerPokemon = new PlayerPokemon(this, playerSpecies, startingLevel, 0);
				playerPokemon.setVisible(false);
				loadPokemonAssets.push(playerPokemon.loadAssets());

				this.party.push(playerPokemon);
			}
		}

		const trainerPbFrameNames = this.anims.generateFrameNames('trainer_m_pb', { zeroPad: 2, start: 1, end: 12 });
		this.anims.create({
			key: 'trainer_m_pb',
			frames: trainerPbFrameNames,
			frameRate: 16
		});

		const trainer = this.add.sprite(0, 0, 'trainer_m');
		trainer.setOrigin(0.5, 1);

		field.add(trainer);

		this.trainer = trainer;

		this.anims.create({
			key: 'prompt',
			frames: this.anims.generateFrameNumbers('prompt', { start: 1, end: 4 }),
			frameRate: 6,
			repeat: -1,
			showOnStart: true
		});

		this.reset();

		const ui = new UI(this);
		this.uiContainer.add(ui);

		this.ui = ui;

		ui.setup();

		Promise.all([
			Promise.all(loadPokemonAssets),
			initCommonAnims().then(() => loadCommonAnimAssets(this, true)),
			initMoveAnim(Moves.STRUGGLE).then(() => loadMoveAnimAssets(this, [ Moves.STRUGGLE ], true))
		]).then(() => {
			if (enableAuto)
				initAutoPlay.apply(this);
			
			this.pokeballCounts[PokeballType.POKEBALL] += 5;

			this.newBattle();

			this.shiftPhase();
		});
	}

	setupControls() {
		const keyCodes = Phaser.Input.Keyboard.KeyCodes;
		const keyConfig = {
			[Button.UP]: [keyCodes.UP, keyCodes.W],
			[Button.DOWN]: [keyCodes.DOWN, keyCodes.S],
			[Button.LEFT]: [keyCodes.LEFT, keyCodes.A],
			[Button.RIGHT]: [keyCodes.RIGHT, keyCodes.D],
			[Button.ACTION]: [keyCodes.ENTER, keyCodes.SPACE, keyCodes.Z],
			[Button.CANCEL]: [keyCodes.BACKSPACE, keyCodes.ESC, keyCodes.X],
			[Button.CYCLE_SHINY]: [keyCodes.R],
			[Button.CYCLE_FORM]: [keyCodes.F],
			[Button.CYCLE_GENDER]: [keyCodes.G],
			[Button.QUICK_START]: [keyCodes.Q],
			[Button.AUTO]: [keyCodes.F2],
			[Button.SPEED_UP]: [keyCodes.PLUS],
			[Button.SLOW_DOWN]: [keyCodes.MINUS]
		};
		this.buttonKeys = [];
		for (let b of Utils.getEnumValues(Button)) {
			const keys: Phaser.Input.Keyboard.Key[] = [];
			if (keyConfig.hasOwnProperty(b)) {
				for (let k of keyConfig[b])
					keys.push(this.input.keyboard.addKey(k));
			}
			this.buttonKeys[b] = keys;
		}
	}

	getParty(): PlayerPokemon[] {
		return this.party;
	}

	getEnemyParty(): EnemyPokemon[] {
		return this.getEnemyPokemon() ? [ this.getEnemyPokemon() ] : [];
	}

	getPlayerPokemon(): PlayerPokemon {
		return this.getParty()[0];
	}

	getEnemyPokemon(): EnemyPokemon {
		return this.currentBattle?.enemyPokemon;
	}

	getPokemonById(pokemonId: integer): Pokemon {
		const findInParty = (party: Pokemon[]) => party.find(p => p.id === pokemonId);
		return findInParty(this.getParty()) || findInParty(this.getEnemyParty());
	}

	reset(): void {
		this.pokeballCounts = Object.fromEntries(Utils.getEnumValues(PokeballType).filter(p => p <= PokeballType.MASTER_BALL).map(t => [ t, 0 ]));

		this.modifiers = [];
		this.enemyModifiers = [];
		this.modifierBar.removeAll(true);
		this.enemyModifierBar.removeAll(true);

		for (let p of this.getParty())
			p.destroy();
		this.party = [];
		for (let p of this.getEnemyParty())
			p.destroy();
			
		this.currentBattle = null;
		this.waveCountText.setText(startingWave.toString());

		this.newArena(startingBiome);
		const biomeKey = this.arena.getBiomeKey();

		this.arenaBg.setTexture(`${biomeKey}_bg`);
		this.arenaBgTransition.setTexture(`${biomeKey}_bg`);
		this.arenaPlayer.setTexture(`${biomeKey}_a`);
		this.arenaPlayerTransition.setTexture(`${biomeKey}_a`);
		this.arenaEnemy.setTexture(`${biomeKey}_b`);
		this.arenaNextEnemy.setTexture(`${biomeKey}_b`);

		this.arenaBgTransition.setPosition(0, 0);
		this.arenaPlayer.setPosition(340, 20);
		this.arenaPlayerTransition.setPosition(40, 2);
		this.arenaEnemy.setPosition(-240, 13);
		this.arenaNextEnemy.setPosition(-240, 13);

		this.trainer.setTexture('trainer_m');
		this.trainer.setPosition(406, 132);
	}

	newBattle(): Battle {
		if (this.currentBattle) {
			this.getEnemyPokemon().destroy();
			if (this.currentBattle.waveIndex % 10)
				this.pushPhase(new NextEncounterPhase(this));
			else {
				this.pushPhase(new SelectBiomePhase(this));
				this.pushPhase(new NewBiomeEncounterPhase(this));
			}
		} else {
			if (!this.quickStart) {
				this.arena.preloadBgm();
				this.pushPhase(new SelectStarterPhase(this));
			} else
				this.arena.playBgm();
			this.pushPhase(new EncounterPhase(this));
			this.pushPhase(new SummonPhase(this));
		}

		this.currentBattle = new Battle((this.currentBattle?.waveIndex || (startingWave - 1)) + 1);
		
		return this.currentBattle;
	}

	newArena(biome: Biome): Arena {
		this.arena = new Arena(this, biome, Biome[biome].toLowerCase());
		return this.arena;
	}

	updateWaveCountText(): void {
		const isBoss = !(this.currentBattle.waveIndex % 10);
		this.waveCountText.setText(this.currentBattle.waveIndex.toString());
		this.waveCountText.setColor(!isBoss ? '#404040' : '#f89890');
		this.waveCountText.setShadowColor(!isBoss ? '#ded6b5' : '#984038');
	}

	updateWaveCountPosition(): void {
		this.waveCountText.setY(-(this.game.canvas.height / 6) + (this.enemyModifiers.length ? 15 : 0));
	}

	randomSpecies(waveIndex: integer, level: integer, fromArenaPool?: boolean): PokemonSpecies {
		return fromArenaPool
			? this.arena.randomSpecies(waveIndex, level)
			: getPokemonSpecies(allSpecies[(Utils.randInt(allSpecies.length)) - 1].getSpeciesForLevel(level));
	}

	checkInput(): boolean {
		if (this.blockInput)
			return;
		if (this.isButtonPressed(Button.UP))
			this.ui.processInput(Button.UP);
		else if (this.isButtonPressed(Button.DOWN))
			this.ui.processInput(Button.DOWN);
		else if (this.isButtonPressed(Button.LEFT))
			this.ui.processInput(Button.LEFT);
		else if (this.isButtonPressed(Button.RIGHT))
			this.ui.processInput(Button.RIGHT);
		else if (this.isButtonPressed(Button.ACTION))
			this.ui.processInput(Button.ACTION);
		else if (this.isButtonPressed(Button.CANCEL))
			this.ui.processInput(Button.CANCEL);
		else if (this.ui?.getHandler() instanceof StarterSelectUiHandler) {
			if (this.isButtonPressed(Button.CYCLE_SHINY))
				this.ui.processInput(Button.CYCLE_SHINY);
			else if (this.isButtonPressed(Button.CYCLE_FORM))
				this.ui.processInput(Button.CYCLE_FORM);
			else if (this.isButtonPressed(Button.CYCLE_GENDER))
				this.ui.processInput(Button.CYCLE_GENDER);
			else
				return;
		}
		else if (this.isButtonPressed(Button.SPEED_UP)) {
			if (!this.auto) {
				if (this.gameSpeed < 2.5)
					this.gameSpeed += 0.25;
			} else if (this.gameSpeed < 20)
				this.gameSpeed++;
		} else if (this.isButtonPressed(Button.SLOW_DOWN)) {
			if (this.gameSpeed > 1) {
				if (!this.auto)
					this.gameSpeed -= 0.25;
				else
					this.gameSpeed--;
			}
		} else if (enableAuto) {
			if (this.isButtonPressed(Button.AUTO)) {
				this.auto = !this.auto;
				if (this.auto)
					this.gameSpeed = Math.floor(this.gameSpeed);
				else if (this.gameSpeed > 2.5)
					this.gameSpeed = 2.5;
			} else
				return;
		} else
			return;
		this.blockInput = true;
		this.time.delayedCall(new Utils.FixedInt(250) as unknown as integer, () => this.blockInput = false);
	}

	isButtonPressed(button: Button): boolean {
		return this.buttonKeys[button].filter(k => k.isDown).length >= 1;
	}

	playBgm(bgmName?: string): void {
		if (!bgmName && this.bgm) {
			this.bgm.play({
				volume: 1
			});
			return;
		}
		if (this.bgm && this.bgm.isPlaying)
			this.bgm.stop();
		this.bgm = this.sound.add(bgmName, { loop: true });
		this.bgm.play();
	}

	pauseBgm(): void {
		if (this.bgm)
			this.bgm.pause();
	}

	resumeBgm(): void {
		if (this.bgm && this.bgm.isPaused)
			this.bgm.resume();
	}

	fadeOutBgm(duration?: integer, destroy?: boolean): void {
		this.arena.fadeOutBgm(duration || 500, destroy);
	}

	playSoundWithoutBgm(soundName: string, pauseDuration?: integer): void {
		this.pauseBgm();
		this.sound.play(soundName);
		const sound = this.sound.get(soundName);
		if (this.bgmResumeTimer)
			this.bgmResumeTimer.destroy();
		this.bgmResumeTimer = this.time.delayedCall((pauseDuration || (sound.totalDuration * 1000)), () => {
			this.resumeBgm();
			this.bgmResumeTimer = null;
		});
	}

	getCurrentPhase(): BattlePhase {
		return this.currentPhase;
	}

	pushPhase(phase: BattlePhase): void {
		this.phaseQueue.push(phase);
	}

	unshiftPhase(phase: BattlePhase): void {
		this.phaseQueuePrepend.push(phase);
	}

	clearPhaseQueue(): void {
		this.phaseQueue.splice(0, this.phaseQueue.length);
	}

	shiftPhase(): void {
		if (this.phaseQueuePrepend.length) {
			while (this.phaseQueuePrepend.length)
				this.phaseQueue.unshift(this.phaseQueuePrepend.pop());
		}
		if (!this.phaseQueue.length)
			this.populatePhaseQueue();
		this.currentPhase = this.phaseQueue.shift();
		this.currentPhase.start();
	}

	queueMessage(message: string, callbackDelay?: integer, prompt?: boolean) {
		this.unshiftPhase(new MessagePhase(this, message, callbackDelay, prompt));
	}

	populatePhaseQueue(): void {
		this.phaseQueue.push(new CommandPhase(this));
	}

	addModifier(modifier: Modifier, playSound?: boolean, virtual?: boolean): Promise<void> {
		return new Promise(resolve => {
			const soundName = modifier.type.soundName;
			if (modifier instanceof PersistentModifier) {
				if ((modifier as PersistentModifier).add(this.modifiers, !!virtual)) {
					if (playSound && !this.sound.get(soundName))
						this.sound.play(soundName);
				} else if (!virtual) {
					const defaultModifierType = getDefaultModifierTypeForTier(modifier.type.tier);
					this.addModifier(defaultModifierType.newModifier(), playSound).then(() => resolve());
					this.queueMessage(`The stack for this item is full.\n You will receive ${defaultModifierType.name} instead.`, null, true);
					return;
				}

				if (!virtual)
					this.updateModifiers().then(() => resolve());
			} else if (modifier instanceof ConsumableModifier) {
				if (playSound && !this.sound.get(soundName))
					this.sound.play(soundName);

				if (modifier instanceof ConsumablePokemonModifier) {
					for (let p in this.party) {
						const pokemon = this.party[p];

						const args: any[] = [ pokemon ];
						if (modifier instanceof PokemonHpRestoreModifier) {
							if (!(modifier as PokemonHpRestoreModifier).fainted) {
								const hpRestoreMultiplier = new Utils.IntegerHolder(1);
								this.applyModifiers(HealingBoosterModifier, true, hpRestoreMultiplier);
								args.push(hpRestoreMultiplier.value);
							} else
								args.push(1);
						}
							
						if (modifier.shouldApply(args))
							modifier.apply(args);
					}
					
					Promise.allSettled(this.party.map(p => p.updateInfo())).then(() => resolve());
				} else {
					const args = [ this ];
					if (modifier.shouldApply(args))
						modifier.apply(args);
					
					resolve();
				}
			}
		});
	}

	tryTransferHeldItemModifier(itemModifier: PokemonHeldItemModifier, target: Pokemon, playSound: boolean): Promise<boolean> {
		return new Promise(resolve => {
			const newItemModifier = itemModifier.clone() as PokemonHeldItemModifier;
			newItemModifier.pokemonId = target.id;
			const matchingModifier = target.scene.findModifier(m => m instanceof PokemonHeldItemModifier
				&& (m as PokemonHeldItemModifier).matchType(itemModifier)) as PokemonHeldItemModifier;
			let removeOld = true;
			if (matchingModifier) {
				const maxStackCount = matchingModifier.getMaxStackCount();
				if (matchingModifier.stackCount >= maxStackCount) {
					resolve(false);
					return;
				}
				const newStackCount = matchingModifier.stackCount + itemModifier.stackCount;
				if (newStackCount > maxStackCount) {
					itemModifier.stackCount = newStackCount - maxStackCount;
					newItemModifier.stackCount = maxStackCount;
					removeOld = !itemModifier.stackCount;
				}
			}
			if (!removeOld || this.removeModifier(itemModifier)) {
				this.addModifier(newItemModifier, playSound).then(() => resolve(true));
				return;
			}
			resolve(false);
		});
	}

	removePartyMemberModifiers(partyMemberIndex: integer): Promise<void> {
		return new Promise(resolve => {
			const pokemonId = this.getParty()[partyMemberIndex].id;
			const modifiersToRemove = this.modifiers.filter(m => (m instanceof PokemonHeldItemModifier) && (m as PokemonHeldItemModifier).pokemonId === pokemonId);
			for (let m of modifiersToRemove)
				this.modifiers.splice(this.modifiers.indexOf(m), 1);
			this.updateModifiers().then(() => resolve());
		});
	}

	generateEnemyModifiers(): Promise<void> {
		return new Promise(resolve => {
			const waveIndex = this.currentBattle.waveIndex;
			const chances = Math.ceil(waveIndex / 10);
			const isBoss = waveIndex >= 100 || !(waveIndex % 10);
			let count = 0;
			for (let c = 0; c < chances; c++) {
				if (!Utils.randInt(!isBoss ? 12 : 4))
					count++;
				if (count === 12)
					break;
			}
			if (isBoss)
				count = Math.max(count, Math.floor(chances / 2));
			getEnemyModifierTypesForWave(waveIndex, count, this.getEnemyParty()).map(mt => mt.newModifier(this.getEnemyPokemon()).add(this.enemyModifiers, false));

			this.updateModifiers(false).then(() => resolve());
		});
	}

	clearEnemyModifiers(): void {
		this.enemyModifiers.splice(0, this.enemyModifiers.length);
		this.updateModifiers(false).then(() => this.updateWaveCountPosition());
	}

	updateModifiers(player?: boolean): Promise<void> {
		if (player === undefined)
			player = true;
		return new Promise(resolve => {
			const modifiers = player ? this.modifiers : this.enemyModifiers;
			for (let modifier of modifiers) {
				if (modifier instanceof PersistentModifier)
					(modifier as PersistentModifier).virtualStackCount = 0;
			}

			if (player)
				this.applyModifiers(PartyShareModifier, true, this, modifiers);

			const modifiersClone = modifiers.slice(0);
			for (let modifier of modifiersClone) {
				if (!modifier.getStackCount())
					modifiers.splice(modifiers.indexOf(modifier), 1);
			}

			this.updatePartyForModifiers(player ? this.getParty() : this.getEnemyParty()).then(() => {
				(player ? this.modifierBar : this.enemyModifierBar).updateModifiers(modifiers);
				if (!player)
					this.updateWaveCountPosition();
				resolve();
			});
		});
	}

	updatePartyForModifiers(party: Pokemon[]): Promise<void> {
		return new Promise(resolve => {
			Promise.allSettled(party.map(p => {
				p.calculateStats();
				return p.updateInfo();
			})).then(() => resolve());
		});
	}

	removeModifier(modifier: PersistentModifier, enemy?: boolean): boolean {
		const modifiers = !enemy ? this.modifiers : this.enemyModifiers;
		const modifierIndex = modifiers.indexOf(modifier);
		if (modifierIndex > -1) {
			modifiers.splice(modifierIndex, 1);
			return true;
		}

		return false;
	}

	getModifiers(modifierType: { new(...args: any[]): Modifier }, player?: boolean): Modifier[] {
		if (player === undefined)
			player = true;
		return (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType);
	}

	findModifiers(modifierFilter: ModifierPredicate, player?: boolean): Modifier[] {
		if (player === undefined)
			player = true;
		return (player ? this.modifiers : this.enemyModifiers).filter(m => (modifierFilter as ModifierPredicate)(m));
	}

	findModifier(modifierFilter: ModifierPredicate, player?: boolean): Modifier {
		if (player === undefined)
			player = true;
		return (player ? this.modifiers : this.enemyModifiers).find(m => (modifierFilter as ModifierPredicate)(m));
	}

	applyModifiers(modifierType: { new(...args: any[]): Modifier }, player?: boolean, ...args: any[]): void {
		if (player === undefined)
			player = true;
		const modifiers = (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType && m.shouldApply(args));
		for (let modifier of modifiers) {
			if (modifier.apply(args))
				console.log('Applied', modifier.type.name, !player ? '(enemy)' : '');
		}
	}

	applyModifier(modifierType: { new(...args: any[]): Modifier }, player?: boolean, ...args: any[]): PersistentModifier {
		if (player === undefined)
			player = true;
		const modifiers = (player ? this.modifiers : this.enemyModifiers).filter(m => m instanceof modifierType && m.shouldApply(args));
		for (let modifier of modifiers) {
			if (modifier.apply(args)) {
				console.log('Applied', modifier.type.name, !player ? '(enemy)' : '');
				return modifier;
			}
		}

		return null;
	}
}