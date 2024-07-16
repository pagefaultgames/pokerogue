import BattleScene from "#app/battle-scene.js";
import { PokeballType } from "#app/data/pokeball.js";
import { CommandPhase } from "#app/phases.js";
import { Command } from "#app/ui/command-ui-handler.js";
import { Mode } from "#app/ui/ui.js";

export const BallCommand = (scene: BattleScene) => {
    const convertPokeballCounts = (counts: { [key: number]: number }) => {
        const result: { [key: string]: number } = {};
        for (const key in counts) {
            if (counts.hasOwnProperty(key)) {
                const enumKey = PokeballType[key as keyof typeof PokeballType];
                result[enumKey] = counts[key];
            }
        }

        return result;
    };

    const convertedPokeballCounts = convertPokeballCounts(scene.pokeballCounts);
    console.log(convertedPokeballCounts);
    const commandPhase = scene.getCurrentPhase();

    if (commandPhase instanceof CommandPhase) {
        commandPhase.handleCommand(Command.BALL, 4, []);
    }
};

export default BallCommand;
