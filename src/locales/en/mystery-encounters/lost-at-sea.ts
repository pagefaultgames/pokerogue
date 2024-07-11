export const lostAtSea = {
  intro: "You are halucinating and starting to loose your bearings.",
  title: "Lost at sea",
  description:
    "You get lost at sea. All you \"sea\" is water everywhere and the sun is burning bright. Certain Pokémons can help you get back on track unharmed.",
  query: "What will you do?",
  option: {
    1: {
      label: "Use @ec{waterPkm}", // pkm has to be of type water
      tooltip:
        "Use @ec{waterPkm} to guide you back. @ec{waterPkm} earns EXP as if having defeated a Lapras.",
      selected: "@ec{waterPkm} guides you back and earns EXP.",
    },
    2: {
      label: "Use @ec{flyingPkm}", // pkm has to be of type flying
      tooltip:
        "Use @ec{flyingPkm} to guide you back. @ec{flyingPkm} earns EXP as if having defeated a Lapras.",
      selected: "@ec{flyingPkm} guides you back and earns EXP.",
    },
    3: {
      label: "Wander aimlessly",
      tooltip:
        "Wander aimlessly until you're back. All your Pokémon lose @ec{damagePercentage}% of their HP. Any below that are KO'd.",
      selected:
        "You wander aimlessly around. After hours of wandering, you find your way back. You and your team take the toll.",
    },
  },
};
