export const lostAtSea = {
  intro: "You are halucinating and starting to loose your bearings.",
  title: "Lost at sea",
  description:
    "You get lost at sea. All you \"sea\" is water everywhere and the sun is burning bright. Certain Pokémons can help you get back on track unharmed.",
  query: "What will you do?",
  option: {
    1: {
      label: "Use {{option1PrimaryName}}",
      label_disabled: "Can't {{option1RequiredMove}}",
      tooltip: "Use {{option1PrimaryName}} to guide you back. {{option1PrimaryName}} earns EXP as if having defeated a Lapras.",
      tooltip_disabled: "You have no Pokémon that could learn {{option1RequiredMove}}",
      selected: "{{option1PrimaryName}} guides you back and earns EXP.",
    },
    2: {
      label: "Use {{option2PrimaryName}}",
      label_disabled: "Can't {{option2RequiredMove}}",
      tooltip: "Use {{option2PrimaryName}} to guide you back. {{option2PrimaryName}} earns EXP as if having defeated a Lapras.",
      tooltip_disabled: "You have no Pokémon that could learn {{option2RequiredMove}}",
      selected: "{{option2PrimaryName}} guides you back and earns EXP.",
    },
    3: {
      label: "Wander aimlessly",
      tooltip: "Wander aimlessly until you're back. All your Pokémon lose {{damagePercentage}}% of their HP. Any below that are KO'd.",
      selected: "You wander aimlessly around. After hours of wandering, you find your way back. You and your team take the toll.",
    },
  },
};
