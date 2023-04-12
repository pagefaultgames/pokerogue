import Phaser from 'phaser';
import { Biome, BiomeArena } from './biome';
import UI from './ui/ui';
import { EncounterPhase, SummonPhase, CommandPhase, NextEncounterPhase, SwitchBiomePhase, NewBiomeEncounterPhase, SelectBiomePhase } from './battle-phases';
import { PlayerPokemon, EnemyPokemon } from './pokemon';
import PokemonSpecies, { allSpecies, getPokemonSpecies } from './pokemon-species';
import * as Utils from './utils';
import { Modifier, ModifierBar, ConsumablePokemonModifier, ConsumableModifier, PartyShareModifier, PokemonHpRestoreModifier, HealingBoosterModifier, PersistentModifier, PokemonHeldItemModifier, ConsumablePokemonMoveModifier } from './modifier';
import { PokeballType } from './pokeball';
import { Species } from './species';
import { initAutoPlay } from './auto-play';
import { Battle } from './battle';
import { initCommonAnims, loadCommonAnimAssets, populateAnims } from './battle-anims';
import { BattlePhase } from './battle-phase';

const enableAuto = true;

export enum Button {
	UP,
	DOWN,
	LEFT,
	RIGHT,
	ACTION,
	CANCEL,
	RANDOM,
	AUTO,
	SPEED_UP,
	SLOW_DOWN
}

export default class BattleScene extends Phaser.Scene {
	public auto: boolean;
	public autoSpeed: integer = 1;

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
	public arena: BiomeArena;
	public trainer: Phaser.GameObjects.Sprite;
	public currentBattle: Battle;
	public pokeballCounts = Object.fromEntries(Utils.getEnumValues(PokeballType).filter(p => p <= PokeballType.MASTER_BALL).map(t => [ t, 0 ]));
	private party: PlayerPokemon[];
	private modifierBar: ModifierBar;
	private modifiers: PersistentModifier[];
	public uiContainer: Phaser.GameObjects.Container;
	public ui: UI;

	//public spritePipeline: SpritePipeline;

	private bgm: Phaser.Sound.BaseSound;
	
	private buttonKeys: Phaser.Input.Keyboard.Key[][];

	private blockInput: boolean;

	public trainerId: integer = Utils.randInt(65536);
	public secretId: integer = Utils.randInt(65536);

	constructor() {
		super('battle');

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
		this.loadImage('party_options_top', 'ui');
		this.loadImage('party_options_center', 'ui');
		this.loadImage('party_options_bottom', 'ui');
		this.loadAtlas('party_cancel', 'ui');

		this.loadImage('summary_bg', 'ui');
		this.loadImage('summary_overlay_shiny', 'ui');
		this.loadImage('summary_profile', 'ui');
		this.loadImage('summary_moves', 'ui');
		this.loadImage('summary_moves_effect', 'ui');
		this.loadImage('summary_moves_overlay_row', 'ui');
		this.loadImage('summary_moves_overlay_pp', 'ui');
		this.loadAtlas('summary_moves_cursor', 'ui');

		this.loadImage('biome_select_window_2', 'ui');
		this.loadImage('biome_select_window_3', 'ui');

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
		this.loadSe('exp');
		this.loadSe('level_up');
		this.loadSe('sparkle');
		this.loadSe('restore');
		this.loadSe('shine');
		this.loadSe('charge');
		this.loadSe('beam');
		this.loadSe('error');

		this.loadSe('pb');
		this.loadSe('pb_rel');
		this.loadSe('pb_throw');
		this.loadSe('pb_bounce_1');
		this.loadSe('pb_bounce_2');
		this.loadSe('pb_move');
		this.loadSe('pb_catch');
		this.loadSe('pb_lock');

		this.loadBgm('level_up_fanfare');
		this.loadBgm('evolution');
		this.loadBgm('evolution_fanfare');

		//this.load.glsl('sprite', 'shaders/sprite.frag');

		populateAnims();
	}

	create() {
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

		this.modifierBar = new ModifierBar(this);
		this.add.existing(this.modifierBar);
		uiContainer.add(this.modifierBar);

		this.party = [];

		let loadPokemonAssets = [];

		const isRandom = this.isButtonPressed(Button.RANDOM); // For testing purposes

		if (isRandom) {
			const biomes = Utils.getEnumValues(Biome);
			this.newBiome(biomes[Utils.randInt(biomes.length)]);
		} else
			this.newBiome(Biome.PLAINS);

		const biomeKey = this.arena.getBiomeKey();
		this.arenaBg = this.add.sprite(0, 0, `${biomeKey}_bg`);
		this.arenaBgTransition = this.add.sprite(0, 0, `${biomeKey}_bg`);
		this.arenaPlayer = this.add.sprite(340, 20, `${biomeKey}_a`);
		this.arenaPlayerTransition = this.add.sprite(40, 20, `${biomeKey}_a`);
		this.arenaEnemy = this.add.sprite(-240, 13, `${biomeKey}_b`);
		this.arenaNextEnemy = this.add.sprite(-240, 13, `${biomeKey}_b`);

		this.arenaBgTransition.setVisible(false);
		this.arenaPlayerTransition.setVisible(false);

		[this.arenaBg, this.arenaBgTransition, this.arenaPlayer, this.arenaPlayerTransition, this.arenaEnemy, this.arenaNextEnemy].forEach(a => {
			a.setOrigin(0, 0);
			field.add(a);
		});
		this.arena.playBgm();

		for (let s = 0; s < 3; s++) {
			const playerSpecies = !isRandom ? getPokemonSpecies(s === 0 ? Species.TORCHIC : s === 1 ? Species.TREECKO : Species.MUDKIP) : this.randomSpecies(5);
			const playerPokemon = new PlayerPokemon(this, playerSpecies, 5);
			playerPokemon.setVisible(false);
			loadPokemonAssets.push(playerPokemon.loadAssets());

			this.party.push(playerPokemon);
		}
		
		console.log(this.getPlayerPokemon().species.name, this.getPlayerPokemon().species.speciesId, this.getPlayerPokemon().stats);

		const trainerPbFrameNames = this.anims.generateFrameNames('trainer_m_pb', { zeroPad: 2, start: 1, end: 12 });
		this.anims.create({
			key: 'trainer_m_pb',
			frames: trainerPbFrameNames,
			frameRate: 16
		});

		const trainer = this.add.sprite(406, 132, 'trainer_m');
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

		const ui = new UI(this);
		this.uiContainer.add(ui);

		this.ui = ui;

		ui.setup();

		Promise.all([ Promise.all(loadPokemonAssets), initCommonAnims().then(() => loadCommonAnimAssets(this, true)) ]).then(() => {
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
			[Button.RANDOM]: [keyCodes.R],
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

	getPlayerPokemon(): PlayerPokemon {
		return this.getParty()[0];
	}

	getEnemyPokemon(): EnemyPokemon {
		return this.currentBattle.enemyPokemon;
	}

	newBattle(): Battle {
		if (this.currentBattle) {
			console.log(this.getPlayerPokemon(), this.getParty().map(p => p.name), this.getPlayerPokemon().id)

			this.getEnemyPokemon().destroy();
			if (this.currentBattle.waveIndex % 10)
				this.unshiftPhase(new NextEncounterPhase(this));
			else {
				this.unshiftPhase(new SelectBiomePhase(this));
				this.unshiftPhase(new NewBiomeEncounterPhase(this));
			}
		} else {
			//this.pushPhase(new SelectStarterPhase(this));
			this.pushPhase(new EncounterPhase(this));
			this.pushPhase(new SummonPhase(this));
		}

		this.currentBattle = new Battle((this.currentBattle?.waveIndex || 0) + 1);
		return this.currentBattle;
	}

	newBiome(biome: Biome): BiomeArena {
		this.arena = new BiomeArena(this, biome, Biome[biome].toLowerCase());
		return this.arena;
	}

	randomSpecies(level: integer, fromArenaPool?: boolean): PokemonSpecies {
		return fromArenaPool
			? this.arena.randomSpecies(1, level)
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
		else if (enableAuto) {
			if (this.isButtonPressed(Button.AUTO))
				this.auto = !this.auto;
			else if (this.isButtonPressed(Button.SPEED_UP)) {
				if (this.autoSpeed < 20)
					this.autoSpeed++;
			} else if (this.isButtonPressed(Button.SLOW_DOWN)) {
				if (this.autoSpeed > 1)
					this.autoSpeed--;
			}
			return;
		} else
			return;
		this.blockInput = true;
		this.time.delayedCall(250, () => {
			this.blockInput = false;
		});
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

	fadeOutBgm(destroy?: boolean): void {
		this.arena.fadeOutBgm(500, destroy);
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

	populatePhaseQueue(): void {
		this.phaseQueue.push(new CommandPhase(this));
	}

	addModifier(modifier: Modifier, virtual?: boolean): Promise<void> {
		return new Promise(resolve => {
			if (modifier instanceof PersistentModifier) {
				if ((modifier as PersistentModifier).add(this.modifiers, !!virtual) && !virtual)
					this.sound.play('restore');

				if (!virtual)
					this.updateModifiers().then(() => resolve());
			} else if (modifier instanceof ConsumableModifier) {
				this.sound.play('restore');

				if (modifier instanceof ConsumablePokemonModifier) {
					for (let p in this.party) {
						const pokemon = this.party[p];

						const args: any[] = [ pokemon ];
						if (modifier instanceof PokemonHpRestoreModifier) {
							const hpRestoreMultiplier = new Utils.IntegerHolder(1);
							this.applyModifiers(HealingBoosterModifier, hpRestoreMultiplier);
							args.push(hpRestoreMultiplier.value);
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

	removePartyMemberModifiers(partyMemberIndex: integer): Promise<void> {
		return new Promise(resolve => {
			const pokemonId = this.getParty()[partyMemberIndex].id;
			const modifiersToRemove = this.modifiers.filter(m => (m instanceof PokemonHeldItemModifier) && (m as PokemonHeldItemModifier).pokemonId === pokemonId);
			for (let m of modifiersToRemove)
				this.modifiers.splice(this.modifiers.indexOf(m), 1);
			this.updateModifiers().then(() => resolve());
		});
	}



	updateModifiers(): Promise<void> {
		return new Promise(resolve => {
			for (let modifier of this.modifiers) {
				if (modifier instanceof PersistentModifier)
					(modifier as PersistentModifier).virtualStackCount = 0;
			}

			this.applyModifiers(PartyShareModifier, this, this.modifiers);

			const modifiers = this.modifiers.slice(0);
			for (let modifier of modifiers) {
				if (!modifier.getStackCount())
					this.modifiers.splice(this.modifiers.indexOf(modifier), 1);
			}

			this.updatePartyForModifiers().then(() => {
				this.modifierBar.updateModifiers(this.modifiers);
				resolve();
			});
		});
	}

	updatePartyForModifiers(): Promise<void> {
		return new Promise(resolve => {
			Promise.allSettled(this.party.map(p => {
				p.calculateStats();
				return p.updateInfo();
			})).then(() => resolve());
		});
	}

	getModifier(modifierType: { new(...args: any[]): Modifier }): Modifier {
		return this.modifiers.find(m => m instanceof modifierType);
	}

	applyModifiers(modifierType: { new(...args: any[]): Modifier }, ...args: any[]): void {
		const modifiers = this.modifiers.filter(m => m instanceof modifierType && m.shouldApply(args));
		for (let modifier of modifiers) {
			if (modifier.apply(args))
				console.log('Applied', modifier.type.name);
		}
	}
}