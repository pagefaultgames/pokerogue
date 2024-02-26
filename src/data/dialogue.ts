import { trainerConfigs } from "./trainer-config";
import { TrainerType } from "./enums/trainer-type";
import { BattleSpec } from "../enums/battle-spec";

export interface TrainerTypeMessages {
  encounter?: string | string[],
  victory?: string | string[],
  defeat?: string | string[]
}

export interface TrainerTypeDialogue {
  [key: integer]: TrainerTypeMessages | [ TrainerTypeMessages, TrainerTypeMessages ]
}

export const trainerTypeDialogue = {
  [TrainerType.YOUNGSTER]: [
    {
      encounter: [
        `Hey, wanna battle?`,
        `Are you a new trainer too?`,
        `Hey, I haven't seen you before. Let's battle!`
      ],
      victory: [
        `Wow! You're strong!`,
        `I didn't stand a chance, huh.`,
        `I'll find you again when I'm older and beat you!`
      ]
    },
    {
      encounter: [
        `Let's have a battle, shall we?`,
        `You look like a new trainer. Let's have a battle!`,
        `I don't recognize you. How about a battle?`
      ],
      victory: [
        `That was impressive! I've got a lot to learn.`,
        `I didn't think you'd beat me that bad…`,
        `I hope we get to have a rematch some day.`
      ]
    }
  ],
  [TrainerType.BROCK]: {
    encounter: [
      `My expertise on Rock-type Pokémon will take you down! Come on!`,
      `My rock-hard willpower will overwhelm you!`,
      `Allow me to show you the true strength of my Pokémon!`
    ],
    victory: [
      `Your Pokémon's strength have overcome my rock-hard defenses!`,
      `The world is huge! I'm glad to have had a chance to battle you.`,
      `Perhaps I should go back to pursuing my dream as a Pokémon Breeder…`
    ],
    defeat: [
      `The best offense is a good defense!\nThat's my way of doing things!`,
      `Come study rocks with me next time to better learn how to fight them!`,
      `Hah, all my traveling around the regions is paying off!`
    ]
  },
  [TrainerType.MISTY]: {
    encounter: [
      `My policy is an all out offensive with Water-type Pokémon!`,
      `Hiya, I'll show you the strength of my aquatic Pokémon!`,
      `My dream was to go on a journey and battle powerful trainers…\nWill you be a sufficient challenge?`
    ],
    victory: [
      `You really are strong… I'll admit that you are skilled…`,
      `Grrr… You know you just got lucky, right?!`,
      `Wow, you're too much! I can't believe you beat me!`
    ],
    defeat: [
      `Was the mighty Misty too much for you?`,
      `I hope you saw my Pokémon's elegant swimming techniques!`,
      `Your Pokémon were no match for my pride and joys!`
    ]
  },
  [TrainerType.LT_SURGE]: {
    encounter: [
      `My Electric Pokémon saved me during the war! I'll show you how!`,
      `Ten-hut! I'll shock you into surrender!`,
      `I'll zap you just like I do to all my enemies in battle!`
    ],
    victory: [
      `Whoa! Your team's the real deal, kid!`,
      `Aaargh, you're strong! Even my electric tricks lost against you.`,
      `That was an absolutely shocking loss!`
    ],
    defeat: [
      `Oh yeah! When it comes to Electric-type Pokémon, I'm number one in the world!`,
      `Hahaha! That was an electrifying battle, kid!`,
      `A Pokémon battle is war, and I have showed you first-hand combat!`
    ]
  },
  [TrainerType.ERIKA]: {
    encounter: [
      `Ah, the weather is lovely here…\nOh, a battle? Very well then.`,
      `My Pokémon battling skills rival that of my flower arranging skills.`,
      `Oh, I hope the pleasant aroma of my Pokémon doesn't put me to sleep again…`
    ],
    victory: [
      `Oh! I concede defeat.`,
      `That match was most delightful.`,
      `Ah, it appears it is my loss…`
    ],
    defeat: [
      `I was afraid I would doze off…`,
      `Oh my, it seems my Grass Pokémon overwhelmed you.`,
      `That battle was such a soothing experience.`
    ]
  },
  [TrainerType.JANINE]: {
    encounter: [
      `I am mastering the art of poisonous attacks.\nI shall spar with you today!`,
      `Father trusts that I can hold my own.\nI will prove him right!`,
      `My ninja techniques are only second to my Father's!\nCan you keep up?`
    ],
    victory: [
      `Even now, I still need training… I understand.`,
      `Your battle technique has outmatched mine.`,
      `I'm going to really apply myself and improve my skills.`
    ],
    defeat: [
      `Fufufu… the poison has sapped all your strength to battle.`,
      `Ha! You didn't stand a chance against my superior ninja skills!`,
      `Father's faith in me has proven to not be misplaced.`
    ]
  },
  [TrainerType.SABRINA]: {
    encounter: [
      `Through my psychic ability, I had a vision of your arrival!`,
      `I dislike fighting, but if you wish, I will show you my powers!`,
      `I can sense great ambition in you. I shall see if it not unfounded.`
    ],
    victory: [
      `Your power… It far exceeds what I foresaw…`,
      `I failed to accurately predict your power.`,
      `Even with my immense psychic powers, I cannot sense another as strong as you.`
    ],
    defeat: [
      `This victory… It is exactly as I foresaw in my visions!`,
      `Perhaps it was another I sensed a great desire in…`,
      `Hone your abilities before recklessly charging into battle.\nYou never know what the future may hold if you do…`
    ]
  },
  [TrainerType.BLAINE]: {
    encounter: [
      `Hah! Hope you brought a Burn Heal!`,
      `My fiery Pokémon will incinerate all challengers!`,
      `Get ready to play with fire!`
    ],
    victory: [
      `I have burned down to nothing! Not even ashes remain!`,
      `Didn't I stoke the flames high enough?`,
      `I'm all burned out… But this makes my motivation to improve burn even hotter!`
    ],
    defeat: [
      `My raging inferno cannot be quelled!`,
      `My Pokémon have been powered up with the heat from this victory!`,
      `Hah! My passion burns brighter than yours!`
    ]
  },
  [TrainerType.GIOVANNI]: {
    encounter: [
      `I, the leader of Team Rocket, will make you feel a world of pain!`,
      `My training here will be vital before I am to face my old associates again.`,
      `I do not think you are prepared for the level of failure you are about to experience!`
    ],
    victory: [
      `WHAT! Me, lose?! There is nothing I wish to say to you!`,
      `Hmph… You could never understand what I hope to achieve.`,
      `This defeat is merely delaying the inevitable.\nI will rise Team Rocket from the ashes in due time.`
    ],
    defeat: [
      `Not being able to measure your own strength shows that you are still but a child.`,
      `Do not try to interfere with me again.`,
      `I hope you understand how foolish challenging me was.`
    ]
  },
  [TrainerType.ROXANNE]: {
    encounter: [
      `Would you kindly demonstrate how you battle?`,
      `You can learn many things by battling many trainers.`,
      `Oh, you caught me strategizing.\nWould you like to battle?`
    ],
    victory: [
      `Oh, I appear to have lost.\nI understand.`,
      `It seems that I still have so much more to learn when it comes to battle.`,
      `I'll take what I learned here today to heart.`
    ],
    defeat: [
      `I have learned many things from our battle.\nI hope you have too.`,
      `I look forward to battling you again.\nI hope you'll use what you've learned here.`,
      `I won due to everything I have learned.`
    ]
  },
  [TrainerType.BRAWLY]: {
    encounter: [
      `Oh man, a challenger!\nLet's see what you can do!`,
      `You seem like a big splash.\nLet's battle!`,
      `Time to create a storm!\nLet's go!`
    ],
    victory: [
      `Oh woah, you've washed me out!`,
      `You surfed my wave and crashed me down!`,
      `I feel like I'm lost in Granite Cave!`
    ],
    defeat: [
      `Haha, I surfed the big wave!\nChallenge me again sometime.`,
      `Surf with me again some time!`,
      `Just like the tides come in and out, I hope you return to challenge me again.`
    ]
  },
  [TrainerType.WATTSON]: {
    encounter: [
      `Time to get shocked!\nWahahahaha!`,
      `I'll make sparks fly!\nWahahahaha!`,
      `I hope you brought Paralyz Heal!\nWahahahaha!`
    ],
    victory: [
      `Seems like I'm out of charge!\nWahahahaha!`,
      `You've completely grounded me!\nWahahahaha!`,
      `Thanks for the thrill!\nWahahahaha!`
    ],
    defeat: [
      `Recharge your batteries and challenge me again sometime!\nWahahahaha!`,
      `I hope you found our battle electrifying!\nWahahahaha!`,
      `Aren't you shocked I won?\nWahahahaha!`
    ]
  },
  [TrainerType.FLANNERY]: {
    encounter: [
      `Nice to meet you! Wait, no…\nI will crush you!`,
      `I've only been a leader for a little while, but I'll smoke you!`,
      `It's time to demonstrate the moves my grandfather has taught me! Let's battle!`
    ],
    victory: [
      `You remind me of my grandfather…\nNo wonder I lost.`,
      `Am I trying too hard?\nI should relax, can't get too heated.`,
      `Losing isn't going to smother me out.\nTime to reignite training!`
    ],
    defeat: [
      `I hope I've made my grandfather proud…\nLet's battle again some time.`,
      `I…I can't believe I won!\nDoing things my way worked!`,
      `Let's exchange burning hot moves again soon!`
    ]
  },
  [TrainerType.NORMAN]: {
    encounter: [
      `I'm surprised you managed to get here.\nLet's battle.`,
      `I'll do everything in my power as a Gym Leader to win.\nLet's go!`,
      `You better give this your all.\nIt's time to battle!`
    ],
    victory: [
      `I lost to you…?\nRules are rules, though.`,
      `Was moving from Olivine a mistake…?`,
      `I can't believe it.\nThat was a great match.`
    ],
    defeat: [
      `We both tried our best.\nI hope we can battle again soon.`,
      `You should try challenging my kid instead.\nYou might learn something!`,
      `Thank you for the excellent battle.\nBetter luck next time.`
    ]
  },
  [TrainerType.WINONA]: {
    encounter: [
      `I've been soaring the skies looking for prey…\nAnd you're my target!`,
      `No matter how our battle is, my Flying Pokémon and I will triumph with grace. Let's battle!`,
      `I hope you aren't scared of heights.\nLet's ascend!`
    ],
    victory: [
      `You're the first Trainer I've seen with more grace than I.\nExcellently played.`,
      `Oh, my Flying Pokémon have plummeted!\nVery well.`,
      `Though I may have fallen, my Pokémon will continue to fly!`
    ],
    defeat: [
      `My Flying Pokémon and I will forever dance elegantly!`,
      `I hope you enjoyed our show.\nOur graceful dance is finished.`,
      `Won't you come see our elegant choreography again?`
    ]
  },
  [TrainerType.TATE]: {
    encounter: [
      `Hehehe…\nWere you surprised to see me without my sister?`,
      `I can see what you're thinking…\nYou want to battle!`,
      `How can you defeat someone…\nWho knows your every move?`
    ],
    victory: [
      `It can't be helped…\nI miss Liza…`,
      `Your bond with your Pokémon was stronger than mine.`,
      `If I were with Liza, we would have won.\nWe can finish each other's thoughts!`
    ],
    defeat: [
      `My Pokémon and I are superior!`,
      `If you can't even defeat me, you'll never be able to defeat Liza either.`,
      `It's all thanks to my strict training with Liza.\nI can make myself one with Pokémon.`
    ]
  },
  [TrainerType.LIZA]: {
    encounter: [
      `Fufufu…\nWere you surprised to see me without my brother?`,
      `I can determine what you desire…\nYou want to battle, don't you?`,
      `How can you defeat someone…\nWho's one with their Pokémon?`
    ],
    victory: [
      `It can't be helped…\nI miss Tate…`,
      `Your bond with your Pokémon…\nIt's stronger than mine.`,
      `If I were with Tate, we would have won.\nWe can finish each other's sentences!`
    ],
    defeat: [
      `My Pokémon and I are victorious.`,
      `If you can't even defeat me, you'll never be able to defeat Tate either.`,
      `It's all thanks to my strict training with Tate.\nI can synchronize myself with my Pokémon.`
    ]
  },
  [TrainerType.JUAN]: {
    encounter: [
      `Now's not the time to act coy.\nLet's battle!`,
      `Ahahaha, You'll be witness to my artistry with Water Pokémon!`,
      `A typhoon approaches!\nWill you be able to test me?`
    ],
    victory: [
      `You may be a genius who can take on Wallace!`,
      `I focused on elegance while you trained.\nIt's only natural that you defeated me.`,
      `Ahahaha!\nVery well, You have won this time.`
    ],
    defeat: [
      `My Pokémon and I have sculpted an illusion of Water and come out victorious.`,
      `Ahahaha, I have won, and you have lost.`,
      `Shall I loan you my outfit? It may help you battle!\nAhahaha, I jest!`
    ]
  },
  [TrainerType.RIVAL]: [
    {
      encounter: [
        `@c{smile}Hey, I was looking for you! I knew you were eager to get going but I expected at least a goodbye…
        $@c{smile_eclosed}So you're really pursuing your dream after all?\n I almost can't believe it.
        $@c{serious_smile_fists}Since we're here, how about a battle?\nAfter all, I want to make sure you're ready.
        $@c{serious_mopen_fists}Don't hold back, I want you to give me everything you've got!`
      ],
      victory: [
        `@c{shock}Wow… You actually cleaned me out.\nAre you actually a beginner?
        $@c{smile}Maybe it was a bit of luck but…\nWho knows you might just be able to go all the way.
        $By the way, the professor asked me to give you these items. They look pretty cool.
        $@c{serious_smile_fists}Good luck out there!`
      ]
    },
    {
      encounter: [
        `@c{smile_wave}There you are! I've been looking everywhere for you!\n@c{angry_mopen}Did you forget to say goodbye to your best friend?
        $@c{smile_ehalf}You're going after your dream, huh?\nThat day is really today isn't it…
        $@c{smile}Anyway, I'll forgive you for forgetting me, but on one condition. @c{smile_wave_wink}You have to battle me!
        $@c{angry_mopen}Give it your all! Wouldn't want your adventure to be over before it started, right?`
      ],
      victory: [
        `@c{shock}You just started and you're already this strong?!@d{96}\n@c{angry}You totally cheated, didn't you?
        $@c{smile_wave_wink}Just kidding!@d{64} @c{smile_eclosed}I lost fair and square… I have a feeling you're going to do really well out there.
        $@c{smile}By the way, the professor wanted me to give you some items. Hopefully they're helpful!
        $@c{smile_wave}Do your best like always! I believe in you!`
      ]
    }
  ],
  [TrainerType.RIVAL_2]: [
    {
      encounter: [
        `@c{smile}Hey, you're here too?\n@c{smile_eclosed}Still a perfect record, huh…?
        $@c{serious_mopen_fists}I know it kind of looks like I followed you here, but that's mostly not true.
        $@c{serious_smile_fists}Honestly though, I've been itching for a rematch since you beat me back at home.
        $I've been doing a lot of my own training so I'll definitely put up a fight this time.
        $@c{serious_mopen_fists}Don't hold back, just like before!\nLet's go!`
      ],
      victory: [
        `@c{neutral_eclosed}Oh. I guess I was overconfident.`
      ]
    },
    {
      encounter: [
        `@c{smile_wave}Oh, fancy meeting you here. Looks like you're still undefeated. @c{angry_mopen}Huh… Not bad!
        $@c{angry_mopen}I know what you're thinking, and no, I wasn't creeping on you. @c{smile_eclosed}I just happened to be in the area.
        $@c{smile_ehalf}I'm happy for you but I just want to let you know that it's OK to lose sometimes.
        $@c{smile}We learn from our mistakes, often more than we would if we kept succeeding.
        $@c{angry_mopen}In any case, I've been training hard for our rematch, so you'd better give it your all!`
      ],
      victory: [
        `@c{neutral}I… wasn't supposed to lose that time…`
      ]
    }
  ],
  [TrainerType.RIVAL_3]: [
    {
      encounter: [
        `@c{smile}Hey, look who it is! It's been a while.\n@c{neutral}You're… still undefeated? Huh.
        $@c{neutral_eclosed}Things have been kind of… strange.\nIt's not the same back home without you.
        $@c{serious}I know it's selfish, but I need to get this off my chest.\n@c{neutral_eclosed}I think you're in over your head here.
        $@c{serious}Never losing once is just unrealistic.\nWe need to lose sometimes in order to grow.
        $@c{neutral_eclosed}You've had a great run but there's still so much ahead, and it only gets harder. @c{neutral}Are you prepared for that?
        $@c{serious_mopen_fists}If so, prove it to me.`
      ],
      victory: [
        `@c{angry_mhalf}This is ridiculous… I've hardly stopped training…\nHow are we still so far apart?`
      ]
    },
    {
      encounter: [
        `@c{smile_wave}Long time no see! Still haven't lost, huh.\n@c{angry}You're starting to get on my nerves. @c{smile_wave_wink}Just kidding!
        $@c{smile_ehalf}But really, don't you miss home by now? Or… me?\nI… I mean, we've really missed you.
        $@c{smile_eclosed}I support you in your dream and everything, but the reality is you're going to lose sooner or later.
        $@c{smile}And when you do, I'll be there for you like always.\n@c{angry_mopen}Now, let me show you how strong I've become!`
      ],
      victory: [
        `@c{shock}After all that… it wasn't enough…?\nYou'll never come back at this rate…`
      ]
    }
  ],
  [TrainerType.RIVAL_4]: [
    {
      encounter: [
        `@c{neutral}Hey.
        $I won't mince words or pleasantries with you.\n@c{neutral_eclosed}I'm here to win, plain and simple.
        $@c{serious_mhalf_fists}I've learned to maximize my potential by putting all my time into training.
        $@c{smile}You get a lot of extra time when you cut out the unnecessary sleep and social interaction.
        $@c{serious_mopen_fists}None of that matters anymore, not until I win.
        $@c{neutral_eclosed}I've even reached the point where I don't lose anymore.\n@c{smile_eclosed}I suppose your philosophy wasn't so wrong after all.
        $@c{angry_mhalf}Losing is for the weak, and I'm not weak anymore.
        $@c{serious_mopen_fists}Prepare yourself.`
      ],
      victory: [
        `@c{neutral}What…@d{64} What are you?`
      ]
    },
    {
      encounter: [
        `@c{neutral}It's me! You didn't forget about me again… did you?
        $@c{smile}You should be proud of how far you made it. Congrats!\nBut it looks like it's the end of your journey.
        $@c{smile_eclosed}You've awoken something in me I never knew was there.\nIt seems like all I do now is train.
        $@c{smile_ehalf}I hardly even eat or sleep now, I just train my Pokémon all day, getting stronger every time.
        $@c{neutral}In fact, I… hardly recognize myself.
        $And now, I've finally reached peak performance.\nI don't think anyone could beat me now.
        $And you know what? It's all because of you.\n@c{smile_ehalf}I don't know whether to thank you or hate you.
        $@c{angry_mopen}Prepare yourself.`
      ],
      victory: [
        `@c{neutral}What…@d{64} What are you?`
      ]
    }
  ],
  [TrainerType.RIVAL_5]: [
    {
      encounter: [
        `@c{neutral}…`
      ],
      victory: [
        `@c{neutral}…`
      ]
    },
    {
      encounter: [
        `@c{neutral}…`
      ],
      victory: [
        `@c{neutral}…`
      ]
    }
  ],
  [TrainerType.RIVAL_6]: [
    {
      encounter: [
        `@c{smile_eclosed}We meet again.
        $@c{neutral}I've had some time to reflect on all this.\nThere's a reason this all seems so strange.
        $@c{neutral_eclosed}Your dream, my drive to beat you…\nIt's all a part of something greater.
        $@c{serious}This isn't about me, or about you… This is about the world, @c{serious_mhalf_fists}and it's my purpose to push you to your limits.
        $@c{neutral_eclosed}Whether I've fulfilled that purpose I can't say, but I've done everything in my power.
        $@c{neutral}This place we ended up in is terrifying… Yet somehow I feel unphased, like I've been here before.
        $@c{serious_mhalf_fists}You feel the same, don't you?
        $@c{serious}…and it's like something here is speaking to me.\nThis is all the world's known for a long time now.
        $Those times we cherished together that seem so recent are nothing but a distant memory.
        $@c{neutral_eclosed}Who can say whether they were ever even real in the first place.
        $@c{serious_mopen_fists}You need to keep pushing, because if you don't, it will never end. You're the only one who can do this.
        $@c{serious_smile_fists}I hardly know what any of this means, I just know that it's true.
        $@c{serious_mopen_fists}If you can't defeat me here and now, you won't stand a chance.`
      ],
      victory: [
        `@c{smile_eclosed}It looks like my work is done here.
        $I want you to promise me one thing.\n@c{smile}After you heal the world, please come home.`
      ]
    },
    {
      encounter: [
        `@c{smile_ehalf}So it's just us again.
        $@c{smile_eclosed}You know, I keep going around and around in my head…
        $@c{smile_ehalf}There's something to all this, why everything seems so strange now…
        $@c{smile}You have your dream, and I have this ambition in me…
        $I just can't help but feel there's a greater purpose to all this, to what we're doing, you and I.
        $@c{smile_eclosed}I think I'm supposed to push you… to your limits.
        $@c{smile_ehalf}I'm not sure if I've been doing a good job at that, but I've tried my best up to now.
        $It's something about this strange and dreadful place… Everything seems so clear…
        $This… is all the world's known for a long time now.
        $@c{smile_eclosed}It's like I can barely remember the memories we cherished together.
        $@c{smile_ehalf}Were they even real? They seem so far away now…
        $@c{angry_mopen}You need to keep pushing, because if you don't, it will never end. You're the only one who can do this.
        $I… don't know what all this means… but I feel it's true.
        $If you can't defeat me here and now, you won't stand a chance.`
      ],
      victory: [
        `@c{smile_ehalf}I… I think I fulfilled my purpose…
        $@c{smile_eclosed}Promise me… After you heal the world… Please… come home safe.
        $@c{smile_ehalf}…Thank you.`
      ]
    }
  ]
};

export const battleSpecDialogue = {
  [BattleSpec.FINAL_BOSS]: {
    encounter: `It appears the time has finally come once again.\nYou know why you have come here, do you not?
               $You were drawn here, because you have been here before.\nCountless times.
               $Though, perhaps it can be counted.\nTo be precise, this is in fact your 5,643,853rd cycle.
               $Each cycle your mind reverts to its former state.\nEven so, somehow, remnants of your former selves remain.
               $Until now you have yet to succeed, but I sense a different presence in you this time.\n
               $You are the only one here, though it is as if there is… another.
               $Will you finally prove a formidable challenge to me?\nThe challenge I have longed for for millennia?
               $We begin.`,
    firstStageWin: `I see. The presence I felt was indeed real.\nIt appears I no longer need to hold back.
                   $Do not disappoint me.`,
    secondStageWin: `…Magnificent.`
  }
};

export function getCharVariantFromDialogue(message: string): string {
  const variantMatch = /@c\{(.*?)\}/.exec(message);
  if (variantMatch)
    return variantMatch[1];
  return 'neutral';
}

export function initTrainerTypeDialogue(): void {
  const trainerTypes = Object.keys(trainerTypeDialogue).map(t => parseInt(t) as TrainerType);
  for (let trainerType of trainerTypes) {
    const messages = trainerTypeDialogue[trainerType];
      const messageTypes = [ 'encounter', 'victory', 'defeat' ];
      for (let messageType of messageTypes) {
        if (Array.isArray(messages)) {
          if (messages[0][messageType])
            trainerConfigs[trainerType][`${messageType}Messages`] = messages[0][messageType];
          if (messages.length > 1)
            trainerConfigs[trainerType][`female${messageType.slice(0, 1).toUpperCase()}${messageType.slice(1)}Messages`] = messages[1][messageType];
        } else
          trainerConfigs[trainerType][`${messageType}Messages`] = messages[messageType];
      }
  }
}