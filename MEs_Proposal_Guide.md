# Event / Mystery Encounter Proposal Guidelines + The poing of this document

If you want to add an Event to our branch, read the guidelines below and then create an "New Issue" here:
https://github.com/AsdarDevelops/PokeRogue-Events/issues

The idea for this document is __not__ to stiffle creativity, but rather to guide a new Event creator, facilitate the reviewer's job, as well as keep Event philosophy consistent.

# What should I know before proposing an Event

Events are categorised in tiers/rarity. These are the rarities at the time of writing:

- ## ⚪ Common Events 
- ## 🔵 Great Events
- ## 🟡 Ultra Events
- ## 🔴 Rogue Events

## Do tiers mean anything?

Yes, and now. They overall represent the rate/chance an Event has to spawn, but they are not the only thing that is considered. More importantly, they help discern, at first glance, a few things:

### Meta progression (Most important): 
How much does the Event help you to __permanently unlock__: 
  - Rare starters (and candies to some extent)
  - Better IVs
  - Natures
  - Hidden Abilities 
  - Mythical/legendary starters
  - Shinies

  If you want to add an Event that gives you any of this, it's going to automatically go to 🟡 Ultra or 🔴 Rogue. And the further down the list, the more likely it will have to be 🔴 Rogue instead of 🟡 Ultra.

  For example, __Dark Deal__ is a 🔴 Rogue Event, because it gives you a chance to capture a very powerful PKMN and permanently add it to your Box. Whereas __Mysterious Challenger__, even it might have you fight a very, very strong trainer on the "Brutal Fight", will just give you an item that will stay with you within the boundaries of that run, hence why it could be 🔵 Great or ⚪ Common.

  Note: Bear in mind not even a 🔴 Rogue Event guarantees a shiny at the time of writing.

### Variance and swinginess (Important)
Imagine an Event at wave 12, a mysterious man offers to throw a coin in front of you. This is what happens:

- Heads: you win the run, get all the pokécandies as if you had won, and the final boss bows to your power.
- Tails: you die horribly and lose the run.

How often do you think this Event should happen? "Never" is the right answer, BUT the lesson here is that this Event would lean towards 🔴 Rogue rather than ⚪ Common, because it's repercussions are so, so much more meaningful than simply encountering your usual wild Pokémon fight. If you want to propose a swingy Event, that's fine, but know that the harder the swings, the higher the rarity.

- Example: ⚪ "Fight or Flight" will have you fight a boss PKMN from the biome, for a somewhat good reward. You will rarely win or lose your run here.
- Example: 🔴 "Dark Deal" will remove a Pokémon from your party. This can be your best Pokémon at the time. You **__can catch a legendary__** which is good for the run, and your box, but you also very well **__can lose the run and not catch anything__**

### Requirements (Somewhat Important)
If an Event is Space Biome only and it needs you to have a Steel type with the moves Extreme Speed and Pluck and the ability Levitate because you need your Pokémon to fix a rocket on the fly, it might very well be ⚪ and still almost no one should find it. Because of this, **in some exceptional cases** you might see an Event with a catchable Mythical Pokémon in a 🟡 Ultra Event. This is because the Biome requirement itself and the other factors are making it much harder to appear. 

__Thus, the more requirements an Event has to even proc, the more it can lean towards ⚪__

### Simplicity (Somewhat Important)

__The simpler the Event is at first glance **to the player**, the more it can lean towards ⚪ Common__.
Pretty straightforward, and useful when you're dealing with doubts between ⚪ Common or 🔵 Great. 

### What the Event rewards you with (**NOT** Important)
"Wait, what?"

__Excluding Meta Progression__ and __Swinginess__, I couldn't care less what the Event is handling you, it can very well be a Master-Ball __as long as the price you pay for it is right on par with it__. So go wild.

### That's it for rarity/tier
If you still can't figure it out, still suggest a range, like "I think either ⚪ Common or 🔵 Great".

## What is "Waves"
This is the floors/waves where you'd like your Event to happen. (11-179)* is the standard, but think about the following:

- Is your Event too strong early, but balanced towards the later waves of Classic? Then you might want to consider going for something like 50-179, or 110-179.
- Is your Event simply useless towards later stages? Then something like 11-89 might be your best call.
- Do you love number four? You can set your Events to be only multiples of 4. Hey, if it makes sense... 🤷🏻‍♂️

## Biomes

Currently, you can set the Events to happen in the specific Biomes of your choosing, but there are other options too that you can use:
- "ANY" ; self explanatory, it's any/all biomes

- "EXTREME_BIOMES" and "NON-EXTREME_BIOMES" ; these are all the biomes in two mutually exclusive lists. The main point of this split is to avoid "Breeders in Space" type situations, with random trainers saluting you while on the moon.
  - "EXTREME_BIOMES": Abyss, Badlands, Desert, Ice Cave, Seabed, Space, Volcano, Wasteland
  - "NON-EXTREME_BIOMES" ; Every other biome not on "EXTREME_BIOMES"

- "HUMAN_TRANSITABLE_BIOMES" ; for __people__, things like trainers, traders, youngster Joey and the people of the world. These are the biomes where you would feaseably find human beings during your journey.
  - They are: TOWN, PLAIN, GRASS, TALL_GRASS, METROPOLIS, FOREST, SWAMP, BEACH, LAKE, MOUNTAIN, BADLANDS, CAVE, DESERT, ICE_CAVE, MEADOW, POWER_PLANT, GRAVEYARD, DOJO, FACTORY, RUINS, CONSTRUCTION_SITE, JUNGLE, FAIRY_CAVE, TEMPLE, SLUM, SNOWY_FOREST, ISLAND, LABORATORY

- "CIVILIZATION_BIOMES" ; these are the places where you might find not only people, but also __are or can be near buildings__, a PKMN Center, a shopping center, a school.
  - They are: TOWN, PLAINS, GRASS, TALL_GRASS, METROPOLIS, BEACH, LAKE, MEADOW, POWER_PLANT, GRAVEYARD, DOJO, FACTORY, CONSTRUCTION_SITE, SLUM, ISLAND

You can use these tags, or the specific Biome, or a combination of both, to let us know where you'd like the Event to happen.

## Options

For now, I'll leave this as a WIP as we are still ironing out the details of what __can__ be done with Events, so just let your imagination run wild. __**Maximum of 4 selectable options at a time though, as that's what the UI can handle**__.

## Other tips for being more likely to get your Event approved

- Present your idea in an organized matter. The easier it is to read and understand, the more likeky it is to be approved. This means try to follow the template provided, one idea = one paragraph, and good spelling. If your mother tongue isn't English, do not worry too much, but the effort is always appreciated.

- Be specific, the more clear the whole flow of the Event is, and the less "holes" there are in your design, the more likely it gets approved. It will mean less guesswork and back and forth with the devs.

- Read what current MEs do. Read what rejected MEs proposed. The more you know about the feature, the better your design will likely be.

- Go wild.