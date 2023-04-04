//import { battleAnimRawData } from "./battle-anim-raw-data";
import BattleScene from "./battle-scene";
import { Moves } from "./move";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "./pokemon";
import * as Utils from "./utils";
import fs from 'vite-plugin-fs/browser';

export enum AnimFrameTarget {
    USER,
    TARGET,
    GRAPHIC
}

enum AnimFocus {
    USER = 1,
    TARGET,
    USER_TARGET,
    SCREEN
}

export class Anim {
    public id: integer;
    public graphic: string;
    public frames: AnimFrame[][];
    public frameTimedEvents: Map<integer, AnimTimedEvent[]>;
    public position: integer;
    public hue: integer;

    constructor(source?: any) {
        this.frameTimedEvents = new Map<integer, AnimTimedEvent[]>;

        if (source) {
            this.id = source.id;
            this.graphic = source.graphic;
            this.frames = source.frames;

            const frameTimedEvents = source.frameTimedEvents;
            for (let fte of Object.keys(frameTimedEvents)) {
                const timedEvents: AnimTimedEvent[] = [];
                for (let te of frameTimedEvents[fte]) {
                    let timedEvent: AnimTimedEvent;
                    switch (te.eventType) {
                        case 'AnimTimedSoundEvent':
                            timedEvent = new AnimTimedSoundEvent(te.frameIndex, te.resourceName, te);
                            break;
                        case 'AnimTimedAddBgEvent':
                            timedEvent = new AnimTimedAddBgEvent(te.frameIndex, te.resourceName, te);
                            break;
                        case 'AnimTimedUpdateBgEvent':
                            timedEvent = new AnimTimedUpdateBgEvent(te.frameIndex, te.resourceName, te);
                            break;
                    }
                    timedEvents.push(timedEvent);
                }
                this.frameTimedEvents.set(parseInt(fte), timedEvents);
            }

            this.position = source.position;
            this.hue = source.hue;
        } else
            this.frames = [];
    }

    getSoundResourceNames(): string[] {
        const sounds = new Set<string>();

        for (let ftes of this.frameTimedEvents.values()) {
            for (let fte of ftes) {
                if (fte instanceof AnimTimedSoundEvent && fte.resourceName)
                    sounds.add(fte.resourceName);
            }
        }

        return Array.from(sounds.values());
    }

    getBackgroundResourceNames(): string[] {
        const backgrounds = new Set<string>();

        for (let ftes of this.frameTimedEvents.values()) {
            for (let fte of ftes) {
                if (fte instanceof AnimTimedAddBgEvent && fte.resourceName)
                    backgrounds.add(fte.resourceName);
            }
        }

        return Array.from(backgrounds.values());
    }
}

class AnimFrame {
    public x: number;
    public y: number;
    public zoomX: number;
    public zoomY: number;
    public angle: number;
    public mirror: boolean;
    public visible: boolean;
    public blendType: integer;
    public target: AnimFrameTarget;
    public graphicFrame: integer;
    public opacity: integer;
    public color: integer[];
    public tone: integer[];
    public flash: integer[];
    public locked: boolean;
    public priority: integer;
    public focus: AnimFocus;

    constructor(x: number, y: number, zoomX: number, zoomY: number, angle: number, mirror: boolean, visible: boolean, blendType: integer, pattern: integer,
        opacity: integer, colorR: integer, colorG: integer, colorB: integer, colorA: integer, toneR: integer, toneG: integer, toneB: integer, toneA: integer,
        flashR: integer, flashG: integer, flashB: integer, flashA: integer, locked: boolean, priority: integer, focus: AnimFocus) {
        this.x = x;
        this.y = y;
        this.zoomX = zoomX;
        this.zoomY = zoomY;
        this.angle = angle;
        this.mirror = mirror;
        this.visible = visible;
        this.blendType = blendType;
        let target = AnimFrameTarget.GRAPHIC;
        switch (pattern) {
            case -2:
                target = AnimFrameTarget.TARGET;
                this.x -= 384;
                this.y -= 96;
                break;
            case -1:
                target = AnimFrameTarget.USER;
                this.x -= 128;
                this.y -= 224;
                break;
            default:
                this.x = (this.x - 128) * 0.5;
                this.y = (this.y - 224) * 0.5;
        }
        this.target = target;
        this.graphicFrame = pattern >= 0 ? pattern : 0;
        this.opacity = opacity;
        this.color = [ colorR, colorG, colorB, colorA ];
        this.tone = [ toneR, toneG, toneB, toneA ];
        this.flash = [ flashR, flashG, flashB, flashA ];
        this.locked = locked;
        this.priority = priority;
        this.focus = focus;
    }
}

abstract class AnimTimedEvent {
    public frameIndex: integer;
    public resourceName: string;
    
    constructor(frameIndex: integer, resourceName: string) {
        this.frameIndex = frameIndex;
        this.resourceName = resourceName;
    }

    abstract execute(scene: BattleScene, moveAnim: MoveAnim): void;

    abstract getEventType(): string;
}

class AnimTimedSoundEvent extends AnimTimedEvent {
    public volume: number;
    public pitch: number;
    
    constructor(frameIndex: integer, resourceName: string, source?: any) {
        super(frameIndex, resourceName);

        if (source) {
            this.volume = source.volume;
            this.pitch = source.pitch;
        } else
            this.pitch = 100;
    }

    execute(scene: BattleScene, moveAnim: MoveAnim): void {
        const soundConfig = { rate: (this.pitch * 0.01), volume: (this.volume * 0.01) };
        if (this.resourceName)
            scene.sound.play(this.resourceName, soundConfig);
        else
            moveAnim.user.cry(soundConfig);
    }

    getEventType(): string {
        return 'AnimTimedSoundEvent';
    }
}

abstract class AnimTimedBgEvent extends AnimTimedEvent {
    public bgX: number;
    public bgY: number;
    public opacity: integer;
    public colorRed: integer;
    public colorGreen: integer;
    public colorBlue: integer;
    public colorAlpha: integer;
    public duration: integer;
    public flashScope: integer;
    public flashRed: integer;
    public flashGreen: integer;
    public flashBlue: integer;
    public flashAlpha: integer;
    public flashDuration: integer;

    constructor(frameIndex: integer, resourceName: string, source: any) {
        super(frameIndex, resourceName);

        if (source) {
            this.bgX = source.bgX;
            this.bgY = source.bgY;
            this.opacity = source.opacity;
            this.colorRed = source.colorRed;
            this.colorGreen = source.colorGreen;
            this.colorBlue = source.colorBlue;
            this.colorAlpha = source.colorAlpha;
            this.duration = source.duration;
            this.flashScope = source.flashScope;
            this.flashRed = source.flashRed;
            this.flashGreen = source.flashGreen;
            this.flashBlue = source.flashBlue;
            this.flashAlpha = source.flashAlpha;
            this.flashDuration = source.flashDuration;
        }
    }
}

class AnimTimedUpdateBgEvent extends AnimTimedBgEvent {
    constructor(frameIndex: integer, resourceName: string, source?: any) {
        super(frameIndex, resourceName, source);
    }

    execute(scene: BattleScene, moveAnim: MoveAnim): void {
        const tweenProps = {};
        if (this.bgX !== undefined)
            tweenProps['x'] = (this.bgX * 0.5) - 256;
        if (this.bgY !== undefined)
            tweenProps['y'] = (this.bgY * 0.5) - 284;
        if (this.opacity !== undefined)
            tweenProps['alpha'] = this.opacity / 255;
        if (Object.keys(tweenProps).length) {
            scene.tweens.add(Object.assign({
                targets: moveAnim.bgSprite,
                duration: this.duration * 2,
                useFrames: true
            }, tweenProps))
        }
    }

    getEventType(): string {
        return 'AnimTimedUpdateBgEvent';
    }
}

class AnimTimedAddBgEvent extends AnimTimedBgEvent {
    constructor(frameIndex: integer, resourceName: string, source?: any) {
        super(frameIndex, resourceName, source);
    }

    execute(scene: BattleScene, moveAnim: MoveAnim): void {
        moveAnim.bgSprite = scene.add.tileSprite(this.bgX - 256, this.bgY - 284, 768, 576, this.resourceName);
        moveAnim.bgSprite.setOrigin(0, 0);
        moveAnim.bgSprite.setScale(1.25);
        moveAnim.bgSprite.setAlpha(0);
        scene.field.add(moveAnim.bgSprite);
        scene.field.moveBelow(moveAnim.bgSprite, scene.getEnemyPokemon());

        scene.tweens.add({
            targets: moveAnim.bgSprite,
            alpha: 1,
            duration: this.duration * 2,
            useFrames: true
        });
    }

    getEventType(): string {
        return 'AnimTimedAddBgEvent';
    }
}

export const moveAnims = new Map<Moves, Anim | [Anim, Anim]>();

export function initAnim(move: Moves): Promise<void> {
    return new Promise(resolve => {
        if (moveAnims.has(move)) {
            if (moveAnims.get(move) !== null)
                resolve();
            else {
                let loadedCheckTimer = setInterval(() => {
                    if (moveAnims.get(move) !== null) {
                        clearInterval(loadedCheckTimer);
                        resolve();
                    }
                }, 50);
            }
        } else {
            moveAnims.set(move, null);
            fetch(`./battle-anims/${Moves[move].toLowerCase().replace(/\_/g, '-')}.json`)
                .then(response => response.json())
                .then(ba => {
                    if (Array.isArray(ba)) {
                        populateMoveAnim(move, ba[0]);
                        populateMoveAnim(move, ba[1]);
                    } else
                        populateMoveAnim(move, ba);
                    resolve();
                });
        }
    });
}

function populateMoveAnim(move: Moves, animSource: any) {
    const moveAnim = new Anim(animSource);
    if (moveAnims.get(move) === null) {
        moveAnims.set(move, moveAnim);
        return;
    }
    moveAnims.set(move, [ moveAnims.get(move) as Anim, moveAnim ]);
}

export function loadMoveAnimAssets(scene: BattleScene, moveIds: Moves[], startLoad?: boolean): Promise<void> {
    return new Promise(resolve => {
        const moveAnimations = moveIds.map(m => {
            const anims = moveAnims.get(m);
            if (anims instanceof Anim)
                return anims as Anim;
            return anims[0] as Anim;
        });
        const backgrounds = new Set<string>();
        const sounds = new Set<string>();
        for (let ma of moveAnimations) {
            const moveSounds = ma.getSoundResourceNames();
        for (let ms of moveSounds)
            sounds.add(ms);
            const moveBackgrounds = ma.getBackgroundResourceNames();
        for (let mbg of moveBackgrounds)
            backgrounds.add(mbg);
        if (ma.graphic)
            scene.loadSpritesheet(ma.graphic, 'battle_anims', 96);
        }
        for (let bg of backgrounds)
            scene.loadImage(bg, 'battle_anims');
        for (let s of sounds)
            scene.loadSe(s, 'battle_anims', s);
        this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
        if (startLoad && !scene.load.isLoading()) 
            scene.load.start();
    });
}

export class MoveAnim {
    public move: Moves;
    public user: Pokemon;
    public target: Pokemon;
    public moveSprites: Phaser.GameObjects.Sprite[];
    public bgSprite: Phaser.GameObjects.TileSprite;

    constructor(move: Moves, user: Pokemon, target: Pokemon) {
        this.move = move;
        this.user = user;
        this.target = target;
        this.moveSprites = [];
    }

    play(scene: BattleScene, callback?: Function) {
        const anim = moveAnims.get(this.move) instanceof Anim
            ? moveAnims.get(this.move) as Anim
            : moveAnims.get(this.move)[this.user instanceof PlayerPokemon ? 0 : 1] as Anim;
        const isOppMove = Array.isArray(moveAnims.get(this.move)) && this.user instanceof EnemyPokemon;

        const userInitialX = this.user.x;
        const userInitialY = this.user.y;
        const userHalfHeight = this.user.getSprite().displayHeight / 2;
        const targetInitialX = this.target.x;
        const targetInitialY = this.target.y;
        const targetHalfHeight = this.target.getSprite().displayHeight / 2;

        const coordMultiplayer = this.user instanceof PlayerPokemon || isOppMove ? 1 : -1;

        let f = 0;

        const moveSprites: Phaser.GameObjects.Sprite[] = [];

        scene.tweens.addCounter({
            useFrames: true,
            duration: 2,
            repeat: anim.frames.length,
            onRepeat: () => {
                const spriteFrames = anim.frames[f];
                let g = 0;
                for (let frame of spriteFrames) {
                    switch (frame.target) {
                        case AnimFrameTarget.USER:
                            this.user.setPosition(userInitialX + frame.x * coordMultiplayer, userInitialY + frame.y * coordMultiplayer);
                            break;
                        case AnimFrameTarget.TARGET:
                            this.target.setPosition(targetInitialX + frame.x * coordMultiplayer, targetInitialY + frame.y * coordMultiplayer);
                            break;
                        case AnimFrameTarget.GRAPHIC:
                            if (g === moveSprites.length) {
                                const newSprite = scene.add.sprite(0, 0, anim.graphic, 1);
                                scene.field.add(newSprite);
                                moveSprites.push(newSprite);
                            }
                            const moveSprite = moveSprites[g++];
                            moveSprite.setFrame(frame.graphicFrame);
                            const xProgress = Math.min(Math.max(frame.x, 0) / 128, 1);
                            const yOffset = ((userHalfHeight * (1 - xProgress)) + (targetHalfHeight * xProgress)) * -1;
                            moveSprite.setPosition((!isOppMove ? userInitialX : targetInitialX) + frame.x * coordMultiplayer, (!isOppMove ? userInitialY : targetInitialY) + yOffset + frame.y * coordMultiplayer);
                            moveSprite.setAlpha(frame.opacity);
                            moveSprite.setAngle(-frame.angle * coordMultiplayer);
                            break;
                    }
                    if (frame.target !== AnimFrameTarget.GRAPHIC) {
                        const pokemon = frame.target === AnimFrameTarget.USER
                            ? this.user
                            : this.target;
                        pokemon.setAlpha(frame.opacity);
                        pokemon.setAngle(-frame.angle * coordMultiplayer);
                        const zoomScaleX = frame.zoomX / 100;
                        const zoomScaleY = frame.zoomY / 100;
                        const zoomSprite = pokemon.getZoomSprite();
                        zoomSprite.setY(zoomSprite.displayHeight * (zoomScaleY - 1) * 0.5);
                        zoomSprite.setScale(zoomScaleX, zoomScaleY);
                    }
                }
                if (anim.frameTimedEvents.has(f)) {
                    for (let event of anim.frameTimedEvents.get(f))
                        event.execute(scene, this);
                }
                if (g < moveSprites.length) {
                    const removedSprites = moveSprites.splice(g, moveSprites.length - g);
                    for (let rs of removedSprites)
                        rs.destroy();
                }
                f++;
            },
            onComplete: () => {
                this.user.setPosition(userInitialX, userInitialY);
                this.user.setAlpha(1);
                this.user.setAngle(0);
                this.target.setPosition(targetInitialX, targetInitialY);
                this.target.setAlpha(1);
                this.target.setAngle(0);
                for (let ms of moveSprites)
                    ms.destroy();
                if (callback)
                    callback();
            }
        });
    }
}

export function populateAnims() {
    return;
    const moveNameToId = {};
    for (let move of Utils.getEnumValues(Moves)) {
        const moveName = Moves[move].toUpperCase().replace(/\_/g, '');
        moveNameToId[moveName] = move;
    }
    const animsData = [];//battleAnimRawData.split('!ruby/array:PBAnimation').slice(1);
    for (let a = 0; a < animsData.length; a++) {
        const fields = animsData[a].split('@').slice(1);
        
        let isOppMove: boolean;
        if (!fields[1].startsWith('name: Move:') && !(isOppMove = fields[1].startsWith('name: OppMove:')))
            continue;
        const nameIndex = fields[1].indexOf(':', 5) + 1;
        const moveName = fields[1].slice(nameIndex, fields[1].indexOf('\n', nameIndex));
        if (!moveNameToId.hasOwnProperty(moveName))
            continue;
        let anim = new Anim();
        anim.id = moveNameToId[moveName];
        moveAnims.set(moveNameToId[moveName], !isOppMove ? anim : [ moveAnims.get(moveNameToId[moveName]) as Anim, anim ]);
        for (let f = 0; f < fields.length; f++) {
            const field = fields[f];
            const fieldName = field.slice(0, field.indexOf(':'));
            const fieldData = field.slice(fieldName.length + 1, field.lastIndexOf('\n')).trim();
            switch (fieldName) {
                case 'array':
                    const framesData = fieldData.split('  - - - ').slice(1);
                    for (let fd = 0; fd < framesData.length; fd++) {
                        anim.frames.push([]);
                        const frameData = framesData[fd];
                        const focusFramesData = frameData.split('    - - ');
                        for (let tf = 0; tf < focusFramesData.length; tf++) {
                            const values = focusFramesData[tf].replace(/      \- /g, '').split('\n');
                            const targetFrame = new AnimFrame(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]), parseFloat(values[11]), parseFloat(values[3]),
                                values[4] === '1', values[6] === '1', parseInt(values[5]), parseInt(values[7]), parseInt(values[8]), parseInt(values[12]), parseInt(values[13]),
                                parseInt(values[14]), parseInt(values[15]), parseInt(values[16]), parseInt(values[17]), parseInt(values[18]), parseInt(values[19]),
                                parseInt(values[21]), parseInt(values[22]), parseInt(values[23]), parseInt(values[24]), values[20] === '1', parseInt(values[25]), parseInt(values[26]) as AnimFocus);
                            anim.frames[fd].push(targetFrame);
                        }
                    }
                    break;
                case 'graphic':
                    anim.graphic = fieldData !== "''" ? fieldData.slice(0, fieldData.indexOf('.')) : '';
                    break;
                case 'timing':
                    const timingEntries = fieldData.split('- !ruby/object:PBAnimTiming ').slice(1);
                    for (let t = 0; t < timingEntries.length; t++) {
                        const timingData = timingEntries[t].replace(/\n/g, ' ').replace(/[ ]{2,}/g, ' ').replace(/[a-z]+: ! '', /ig, '').replace(/name: (.*?),/, 'name: "$1",')
                            .replace(/flashColor: !ruby\/object:Color { alpha: ([\d\.]+), blue: ([\d\.]+), green: ([\d\.]+), red: ([\d\.]+)}/, 'flashRed: $4, flashGreen: $3, flashBlue: $2, flashAlpha: $1');
                        const frameIndex = parseInt(/frame: (\d+)/.exec(timingData)[1]);
                        const resourceName = /name: "(.*?)"/.exec(timingData)[1].replace("''", '');
                        const timingType = parseInt(/timingType: (\d)/.exec(timingData)[1]);
                        let timedEvent: AnimTimedEvent;
                        switch (timingType) {
                            case 0:
                                timedEvent = new AnimTimedSoundEvent(frameIndex, resourceName);
                                break;
                            case 1:
                                timedEvent = new AnimTimedAddBgEvent(frameIndex, resourceName.slice(0, resourceName.indexOf('.')));
                                break;
                            case 2:
                                timedEvent = new AnimTimedUpdateBgEvent(frameIndex, resourceName.slice(0, resourceName.indexOf('.')));
                                break;
                        }
                        if (!timedEvent)
                            continue;
                        const propPattern = /([a-z]+): (.*?)(?:,|\})/ig;
                        let propMatch: RegExpExecArray;
                        while ((propMatch = propPattern.exec(timingData))) {
                            const prop = propMatch[1];
                            let value: any = propMatch[2];
                            switch (prop) {
                                case 'bgX':
                                case 'bgY':
                                    value = parseFloat(value);
                                    break;
                                case 'volume':
                                case 'pitch':
                                case 'opacity':
                                case 'colorRed':
                                case 'colorGreen':
                                case 'colorBlue':
                                case 'colorAlpha':
                                case 'duration':
                                case 'flashScope':
                                case 'flashRed':
                                case 'flashGreen':
                                case 'flashBlue':
                                case 'flashAlpha':
                                case 'flashDuration':
                                    value = parseInt(value);
                                    break;
                            }
                            if (timedEvent.hasOwnProperty(prop))
                                timedEvent[prop] = value;
                        }
                        if (!anim.frameTimedEvents.has(frameIndex))
                            anim.frameTimedEvents.set(frameIndex, []);
                        anim.frameTimedEvents.get(frameIndex).push(timedEvent);
                    }
                    break;
                case 'position':
                    anim.position = parseInt(fieldData);
                    break;
                case 'hue':
                    anim.hue = parseInt(fieldData);
                    break;
            }
        }
    }

    for (let ma of moveAnims.keys()) {
        const data = moveAnims.get(ma);
        (async () => {
            await fs.writeFile(`./public/battle-anims/${Moves[ma].toLowerCase().replace(/\_/g, '-')}.json`, JSON.stringify(data, (k, v) => {
                if (v instanceof Map)
                    return Object.fromEntries(v);
                if (v instanceof AnimTimedEvent)
                    v['eventType'] = v.getEventType();
                return v;
            }, '  '));
        })(); 
    }
}