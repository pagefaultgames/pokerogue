export const pokemonSalesmanDialogue = {
  intro: "A chipper elderly man approaches you.",
  speaker: "Gentleman",
  intro_dialogue: "Hello there! Have I got a deal just for YOU!{{specialShinyText}}",
  title: "The Pokémon Salesman",
  description: "\"This {{purchasePokemon}} is extremely unique, and carries an ability not normally found on its species! I'll let you have this swell {{purchasePokemon}} for just {{money, money}}!\"\n\n\"What do you say?\"",
  query: "What will you do?",
  shiny: "$I have SUPER amazing Pokémon that\nanyone would be dying to get!",
  option: {
    1: {
      label: "Accept",
      tooltip: "(-) Pay {{money, money}}\n(+) Gain a {{purchasePokemon}} with its Hidden Ability (also saved in Pokédex data)",
      selected_dialogue: `Excellent choice!
      $I can see you've a keen eye for business.`,
      selected_message: "You paid an outrageous sum and bought the {{purchasePokemon}}.",
      selected_dialogue_2: "Oh, yeah...@d{64} Returns not accepted, got that?"
    },
    2: {
      label: "Refuse",
      tooltip: "(-) No Rewards",
      selected: `No?@d{32} You say no?
        $I'm only doing this as a favor to you!`,
    },
  },
};
