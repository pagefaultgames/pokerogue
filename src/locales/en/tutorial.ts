import { SimpleTranslationEntries } from "#app/plugins/i18n";

export const tutorial: SimpleTranslationEntries = {
    "intro": `Welcome to PokéRogue! This is a battle-focused Pokémon fangame with roguelite elements.
    $This game is not monetized and we claim no ownership of Pokémon nor of the copyrighted assets used.
    $The game is a work in progress, but fully playable.\nFor bug reports, please use the Discord community.
    $If the game runs slowly, please ensure 'Hardware Acceleration' is turned on in your browser settings.`,
    
    "accessMenu": `To access the menu, press M or Escape while awaiting input.\nThe menu contains settings and various features.`,
    
    "menu": `From this menu you can access the settings.
    $From the settings you can change game speed, window style, and other options.
    $There are also various other features here, so be sure to check them all!`,

    "starterSelect": `From this screen, you can select your starters.\nThese are your initial party members.
    $Each starter has a value. Your party can have up to\n6 members as long as the total does not exceed 10.
    $You can also select gender, ability, and form depending on\nthe variants you've caught or hatched.
    $The IVs for a species are also the best of every one you've\ncaught or hatched, so try to get lots of the same species!`,

    "pokerus": `A daily random 3 selectable starters have a purple border.
    $If you see a starter you own with one of these,\ntry adding it to your party. Be sure to check its summary!`,

    "statChange": `Stat changes persist across battles as long as your Pokémon aren't recalled.
    $Your Pokémon are recalled before a trainer battle and before entering a new biome.
    $You can also view the stat changes for the Pokémon on the field by holding C or Shift.`,

    "selectItem": `After every battle, you are given a choice of 3 random items.\nYou may only pick one.
    $These range from consumables, to Pokémon held items, to passive permanent items.
    $Most non-consumable item effects will stack in various ways.
    $Some items will only show up if they can be used, such as evolution items.
    $You can also transfer held items between Pokémon using the transfer option.
    $The transfer option will appear in the bottom right once you have obtained a held item.
    $You may purchase consumable items with money, and a larger variety will be available the further you get.
    $Be sure to buy these before you pick your random item, as it will progress to the next battle once you do.`,

    "eggGacha": `From this screen, you can redeem your vouchers for\nPokémon eggs.
    $Eggs have to be hatched and get closer to hatching after\nevery battle. Rarer eggs take longer to hatch.
    $Hatched Pokémon also won't be added to your party, they will\nbe added to your starters.
    $Pokémon hatched from eggs generally have better IVs than\nwild Pokémon.
    $Some Pokémon can only even be obtained from eggs.
    $There are 3 different machines to pull from with different\nbonuses, so pick the one that suits you best!`,
} as const;