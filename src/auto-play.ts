import { SelectModifierPhase } from "./battle-phase";
import BattleScene from "./battle-scene";
import { ModifierTier, ModifierType, PokemonBaseStatBoosterModifierType, PokemonHpRestoreModifierType, PokemonReviveModifierType } from "./modifier";
import Pokemon, { AiType, EnemyPokemon, PlayerPokemon, PokemonMove } from "./pokemon";
import { Species } from "./species";
import { getTypeDamageMultiplier } from "./type";
import BattleMessageUiHandler from "./ui/battle-message-ui-handler";
import CommandUiHandler from "./ui/command-ui-handler";
import FightUiHandler from "./ui/fight-ui-handler";
import MessageUiHandler from "./ui/message-ui-handler";
import ModifierSelectUiHandler from "./ui/modifier-select-ui-handler";
import PartyUiHandler, { PartyUiMode } from "./ui/party-ui-handler";
import ConfirmUiHandler from "./ui/confirm-ui-handler";
import { Mode } from "./ui/ui";

export function initAutoPlay() {
    const thisArg = this as BattleScene;

    const originalDelayedCall = this.time.delayedCall;
    this.time.delayedCall = function (delay: number, callback: Function, args?: any[], callbackScope?: any) {
        if (thisArg.auto)
            delay /= thisArg.autoSpeed;
        originalDelayedCall.apply(this, [ delay, callback, args, callbackScope ]);
    };
    const originalAddEvent = this.time.addEvent;
    this.time.addEvent = function (config: Phaser.Time.TimerEvent | Phaser.Types.Time.TimerEventConfig) {
        if (thisArg.auto) {
            if (config.delay)
                config.delay = Math.ceil(config.delay / thisArg.autoSpeed);
            if (config.startAt)
                config.startAt = Math.ceil(config.startAt / thisArg.autoSpeed);
        }
        return originalAddEvent.apply(this, [ config ]);
    };
    const originalTweensAdd = this.tweens.add;
    this.tweens.add = function (config: Phaser.Types.Tweens.TweenBuilderConfig | object) {
        if (thisArg.auto) {
            if (config.duration)
                config.duration = Math.ceil(config.duration / thisArg.autoSpeed);
            if (config.delay)
                config.delay = Math.ceil(config.delay / thisArg.autoSpeed);
        }
        return originalTweensAdd.apply(this, [ config ]);
    };
    const originalAddCounter = this.tweens.addCounter;
    this.tweens.addCounter = function (config: Phaser.Types.Tweens.NumberTweenBuilderConfig) {
        if (thisArg.auto) {
            if (config.duration)
                config.duration = Math.ceil(config.duration / thisArg.autoSpeed);
            if (config.delay)
                config.delay = Math.ceil(config.delay / thisArg.autoSpeed);
        }
        return originalAddCounter.apply(this, [ config ]);
    };

    const keyCodes = Phaser.Input.Keyboard.KeyCodes;

    PlayerPokemon.prototype.getNextMove = EnemyPokemon.prototype.getNextMove;

    const playerPokemon = this.getParty()[0] as PlayerPokemon;
    
    const messageUiHandler = this.ui.handlers[Mode.MESSAGE] as BattleMessageUiHandler;
    const commandUiHandler = this.ui.handlers[Mode.COMMAND] as CommandUiHandler;
    const fightUiHandler = this.ui.handlers[Mode.FIGHT] as FightUiHandler;
    const partyUiHandler = this.ui.handlers[Mode.PARTY] as PartyUiHandler;
    const switchCheckUiHandler = this.ui.handlers[Mode.CONFIRM] as ConfirmUiHandler;
    const modifierSelectUiHandler = this.ui.handlers[Mode.MODIFIER_SELECT] as ModifierSelectUiHandler;

    const getBestPartyMemberIndex = () => {
        const enemyPokemon = thisArg.getEnemyPokemon();
        const party = thisArg.getParty();
        let bestPartyMemberIndex = -1;
        let bestPartyMemberEffectiveness = 0.5;
        for (let p = 0; p < party.length; p++) {
            const pokemon = party[p];
            if (pokemon.getHpRatio() <= 0.4)
                continue;
            const effectiveness = enemyPokemon
                ? getMaxMoveEffectiveness(pokemon, enemyPokemon) / getMaxMoveEffectiveness(enemyPokemon, pokemon)
                : 1;
            if (effectiveness > bestPartyMemberEffectiveness) {
                bestPartyMemberIndex = p;
                bestPartyMemberEffectiveness = effectiveness;
            }
            if (enemyPokemon)
                console.log(p, Species[pokemon.species.speciesId], '->', Species[enemyPokemon.species.speciesId], effectiveness);
        }

        if (bestPartyMemberIndex === -1) {
            let highestHpValue = -1;
            for (let p = 0; p < party.length; p++) {
                const pokemon = party[p];
                if (pokemon.hp > highestHpValue) {
                    highestHpValue = pokemon.hp;
                    bestPartyMemberIndex = p;
                }
            }
        }

        return bestPartyMemberIndex;
    };

    const getMaxMoveEffectiveness = (attacker: Pokemon, defender: Pokemon) => {
        let maxEffectiveness = 0.5;
        for (let m of attacker.moveset) {
            const moveType = m.getMove().type;
            let effectiveness = getTypeDamageMultiplier(moveType, defender.species.type1);
            if (defender.species.type2 > -1)
                effectiveness *= getTypeDamageMultiplier(moveType, defender.species.type2);
            if (effectiveness > maxEffectiveness)
                maxEffectiveness = effectiveness;
        }

        return maxEffectiveness;
    };

    let nextPartyMemberIndex = -1;

    const originalMessageUiHandlerShowText = MessageUiHandler.prototype.showText;
    MessageUiHandler.prototype.showText = function (text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean) {
        if (thisArg.auto) {
            delay = 1;
            callbackDelay = 0;
        }
        originalMessageUiHandlerShowText.apply(this, [ text, delay, callback, callbackDelay, prompt ]);
    };

    const originalMessageUiHandlerShowPrompt = MessageUiHandler.prototype.showPrompt;
    MessageUiHandler.prototype.showPrompt = function (callback: Function, callbackDelay: integer) {
        if (thisArg.auto)
            callbackDelay = 0;
        originalMessageUiHandlerShowPrompt.apply(this, [ callback, callbackDelay ]);
        if (thisArg.auto)
            thisArg.time.delayedCall(20, () => this.processInput(keyCodes.Z));
    };

    const originalMessageUiHandlerPromptLevelUpStats = messageUiHandler.promptLevelUpStats;
    messageUiHandler.promptLevelUpStats = function (prevStats: integer[], showTotals: boolean, callback?: Function) {
        originalMessageUiHandlerPromptLevelUpStats.apply(this, [ prevStats, showTotals, callback ]);
        if (thisArg.auto)
            thisArg.time.delayedCall(20, () => this.processInput(keyCodes.Z));
    };
    
    const originalCommandUiHandlerShow = commandUiHandler.show;
    commandUiHandler.show = function (args: any[]) {
        originalCommandUiHandlerShow.apply(this, [ args ]);
        if (thisArg.auto) {
            thisArg.time.delayedCall(20, () => {
                const bestPartyMemberIndex = getBestPartyMemberIndex();
                if (bestPartyMemberIndex) {
                    console.log(bestPartyMemberIndex, thisArg.getParty())
                    console.log('Switching to ', Species[thisArg.getParty()[bestPartyMemberIndex].species.speciesId]);
                    nextPartyMemberIndex = bestPartyMemberIndex;
                    commandUiHandler.setCursor(2);
                    thisArg.time.delayedCall(20, () => this.processInput(keyCodes.Z));
                } else {
                    commandUiHandler.setCursor(0);
                    thisArg.time.delayedCall(20, () => this.processInput(keyCodes.Z));
                }
            });
        }
    };

    const originalFightUiHandlerShow = fightUiHandler.show;
    fightUiHandler.show = function (args: any[]) {
        originalFightUiHandlerShow.apply(this, [ args ]);
        if (thisArg.auto) {
            if (!playerPokemon.aiType)
                playerPokemon.aiType = AiType.SMART;
            thisArg.time.delayedCall(20, () => {
                const nextMove = playerPokemon.getNextMove() as PokemonMove;
                fightUiHandler.setCursor(playerPokemon.moveset.indexOf(nextMove));
                thisArg.time.delayedCall(20, () => this.processInput(keyCodes.Z));
            });
        }
    };

    const originalPartyUiHandlerShow = partyUiHandler.show;
    partyUiHandler.show = function (args: any[]) {
        originalPartyUiHandlerShow.apply(this, [ args ]);
        if (thisArg.auto) {
            thisArg.time.delayedCall(20, () => {
                if (nextPartyMemberIndex === -1)
                    nextPartyMemberIndex = getBestPartyMemberIndex();
                partyUiHandler.setCursor(nextPartyMemberIndex);
                nextPartyMemberIndex = -1;
                if (partyUiHandler.partyUiMode === PartyUiMode.MODIFIER || partyUiHandler.getCursor()) {
                    this.processInput(keyCodes.Z);
                    thisArg.time.delayedCall(250, () => this.processInput(keyCodes.Z));
                } else
                    this.processInput(keyCodes.X);
            });
        }
    };

    const originalSwitchCheckUiHandlerShow = switchCheckUiHandler.show;
    switchCheckUiHandler.show = function (args: any[]) {
        originalSwitchCheckUiHandlerShow.apply(this, [ args ]);
        if (thisArg.auto) {
            const bestPartyMemberIndex = getBestPartyMemberIndex();
            thisArg.time.delayedCall(20, () => {
                if (bestPartyMemberIndex)
                    nextPartyMemberIndex = bestPartyMemberIndex;
                switchCheckUiHandler.setCursor(bestPartyMemberIndex ? 1 : 0);
                thisArg.time.delayedCall(20, () =>  this.processInput(keyCodes.Z));
            });
        }
    }

    const tryGetBestModifier = (modifierTypes: Array<ModifierType>, predicate: Function) => {
        for (let mt = 0; mt < modifierTypes.length; mt++) {
            const modifierType = modifierTypes[mt];
            if (predicate(modifierType)) {
                return mt;
            }
        }

        return -1;
    };

    const originalModifierSelectUiHandlerShow = modifierSelectUiHandler.show;
    modifierSelectUiHandler.show = function (args: any[]) {
        if (!thisArg.auto) {
            originalModifierSelectUiHandlerShow.apply(this, [ args ]);
            return;
        }

        if (modifierSelectUiHandler.active)
            return;

        thisArg.time.delayedCall(20, () => {
            originalModifierSelectUiHandlerShow.apply(this, [ args ]);

            const party = thisArg.getParty();
            const modifierTypes = modifierSelectUiHandler.options.map(o => o.modifierType);
            const faintedPartyMemberIndex = party.findIndex(p => !p.hp);
            const lowHpPartyMemberIndex = party.findIndex(p => p.getHpRatio() <= 0.5);
            const criticalHpPartyMemberIndex = party.findIndex(p => p.getHpRatio() <= 0.25);

            let optionIndex = tryGetBestModifier(modifierTypes, (modifierType: ModifierType) => {
                if (modifierType instanceof PokemonHpRestoreModifierType) {
                    if (modifierType instanceof PokemonReviveModifierType) {
                        if (faintedPartyMemberIndex > -1) {
                            nextPartyMemberIndex = faintedPartyMemberIndex;
                            return true;
                        }
                    } else if (criticalHpPartyMemberIndex > -1){
                        nextPartyMemberIndex = criticalHpPartyMemberIndex;
                        return true;
                    }
                }
            });

            if (optionIndex === -1) {
                optionIndex = tryGetBestModifier(modifierTypes, (modifierType: ModifierType) => {
                    if (modifierType.tier >= ModifierTier.ULTRA) {
                        nextPartyMemberIndex = 0;
                        return true;
                    }
                });
            }

            if (optionIndex === -1) {
                optionIndex = tryGetBestModifier(modifierTypes, (modifierType: ModifierType) => {
                    if (modifierType instanceof PokemonBaseStatBoosterModifierType) {
                        nextPartyMemberIndex = 0;
                        return true;
                    }
                });
            }

            if (optionIndex === -1) {
                optionIndex = tryGetBestModifier(modifierTypes, (modifierType: ModifierType) => {
                    if (lowHpPartyMemberIndex && modifierType instanceof PokemonHpRestoreModifierType && !(ModifierType instanceof PokemonReviveModifierType)) {
                        nextPartyMemberIndex = lowHpPartyMemberIndex;
                        return true;
                    }
                });
            }

            if (optionIndex === -1)
                optionIndex = 0;

            const trySelectModifier = () => {
                modifierSelectUiHandler.setCursor(optionIndex);
                thisArg.time.delayedCall(20, () => {
                    modifierSelectUiHandler.processInput(keyCodes.Z);
                    thisArg.time.delayedCall(250, () => {
                        console.log(modifierTypes[optionIndex]?.name);
                        if (thisArg.getCurrentPhase() instanceof SelectModifierPhase) {
                            if (optionIndex < modifierSelectUiHandler.options.length - 1) {
                                optionIndex++;
                                thisArg.time.delayedCall(250, () => trySelectModifier());
                            } else
                                modifierSelectUiHandler.processInput(keyCodes.X);
                        }
                    });
                });
            };

            thisArg.time.delayedCall(4000, () => trySelectModifier());
        });
    }
}