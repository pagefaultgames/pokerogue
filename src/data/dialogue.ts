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
  [TrainerType.RIVAL]: {
    encounter: [
      `There you are! I've been looking everywhere for you!\nDid you forget to say goodbye to your best friend?
      $So you're finally pursuing your dream, huh?\nI knew you'd do it one day…
      $Anyway, I'll forgive you for forgetting me, but on one condition. You have to battle me!
      $You'd better give it your best! Wouldn't want your adventure to be over before it started, right?`
    ],
    victory: [
      `You already have three Pokémon?!\nThat's not fair at all!
      $Just kidding! I lost fair and square, and now I know you'll do fine out there.
      $By the way, the professor wanted me to give you some items. Hopefully they're helpful!
      $Do your best like always! I believe in you!`
    ]
  },
  [TrainerType.RIVAL_2]: {
    encounter: [
      `Oh, fancy meeting you here. Looks like you're still undefeated. Right on!
      $I know what you're thinking, and no, I wasn't following you. I just happened to be in the area.
      $I'm happy for you but I just want to let you know that it's OK to lose sometimes.
      $We learn from our mistakes, often more than we would if we kept succeeding.
      $In any case, I've been training hard for our rematch, so you'd better give it your all!`
    ],
    victory: [
      `I… wasn't supposed to lose that time…`
    ]
  },
  [TrainerType.RIVAL_3]: {
    encounter: [
      `Long time no see! Still haven't lost, huh.\nYou're starting to get on my nerves. Just kidding!
      $But really, I think it's about time you came home.\nYour family and friends miss you, you know.
      $I know your dream means a lot to you, but the reality is you're going to lose sooner or later.
      $And when you do, I'll be there for you like always.\nNow, let me show you how strong I've become!`
    ],
    victory: [
      `After all that… it wasn't enough…?`
    ]
  },
  [TrainerType.RIVAL_4]: {
    encounter: [
      `It's me! You didn't forget about me again did you?
      $You made it really far! I'm proud of you.\nBut it looks like it's the end of your journey.
      $You've awoken something in me I never knew was there.\nIt seems like all I do now is train.
      $I hardly even eat or sleep now, I just train my Pokémon all day, getting stronger every time.
      $And now, I've finally reached peak performance.\nI don't think anyone could beat me now.
      $And you know what? It's all because of you.\nI don't know whether to thank you or hate you.
      $Prepare yourself.`
    ],
    victory: [
      `What…@d{64} what are you?`
    ]
  },
  [TrainerType.RIVAL_5]: {
    encounter: [ `…` ],
    victory: [ '…' ]
  }
};

export const battleSpecDialogue = {
  [BattleSpec.FINAL_BOSS]: {
    encounter: `It appears the time has finally come once again.\nYou know why you have come here, do you not?
               $You were drawn here, because you have been here before.\nCountless times.
               $Though, perhaps it can be counted.\nTo be precise, this is in fact your 5,643,853rd cycle.
               $Each cycle your mind reverts to its former state.\nEven so, somehow, remnants of your former selves remain.
               $Until now you have yet to succeed, but I sense a different presence in you this time.\n
               $You are the only one here, though it is as if there is… another.
               $Will you finally prove a formidable challenge to me?\nThe challenge I have longed for for millenia?
               $We begin.`,
    firstStageWin: `I see. The presence I felt was indeed real.\nIt appears I no longer need to hold back.
                   $Do not disappoint me.`,
    secondStageWin: `…Magnificent.`
  }
};

export function initTrainerTypeDialogue() {
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