export const lostAtSea = {
  intro: "You are halucinating and starting to loose your bearings.",
  title: "Lost at sea",
  description:
    "You get lost at sea. All you \"sea\" is water everywhere and the sun is burning bright. Certain Pokémons can help you get back on track unharmed.",
  query: "What will you do?",
  option: {
    1: {
      label: "Use {{pokemonCanLearnMove}}", // pkm has to be of type water
      tooltip:
        "Use {{pokemonCanLearnMove}} to guide you back. {{pokemonCanLearnMove}} earns EXP as if having defeated a Lapras.",
      selected: "{{pokemonCanLearnMove}} guides you back and earns EXP.",
    },
    2: {
      label: "Use {{flyingPkm}}", // pkm has to be of type flying
      tooltip:
        "Use {{flyingPkm}} to guide you back. {{flyingPkm}} earns EXP as if having defeated a Lapras.",
      selected: "{{flyingPkm}} guides you back and earns EXP.",
    },
    3: {
      label: "Wander aimlessly",
      tooltip:
        "Wander aimlessly until you're back. All your Pokémon lose {{damagePercentage}}% of their HP. Any below that are KO'd.",
      selected:
        "You wander aimlessly around. After hours of wandering, you find your way back. You and your team take the toll.",
    },
  },
};
