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
        "Hey, wanna battle?",
        "Are you a new trainer too?",
        "Hey, I haven't seen you before. Let's battle!",
        "I just lost, so I'm trying to find more Pokémon.\nWait! You look weak! Come on, let's battle!",
        "Have we met or not? I don't really remember. Well, I guess it's nice to meet you anyway!",
        "All right! Let's go!",
        "All right! Here I come! I'll show you my power!",
        "Haw haw haw... I'll show you how hawesome my Pokémon are!",
        "No need to waste time saying hello. Bring it on whenever you're ready!",
        "Don't let your guard down, or you may be crying when a kid beats you.",
        "I've raised my Pokémon with great care. You're not allowed to hurt them!",
        "Glad you made it! It won't be an easy job from here.",
        "The battles continue forever! Welcome to the world with no end!"
      ],
      victory: [
        "Wow! You're strong!",
        "I didn't stand a chance, huh?",
        "I'll find you again when I'm older and beat you!",
        "Ugh. I don't have any more Pokémon.",
        "No way… NO WAY! How could I lose again…",
        "No! I lost!",
        "Whoa! You are incredible! I'm amazed and surprised!",
        "Could it be… How… My Pokémon and I are the strongest, though…",
        "I won't lose next time! Let's battle again sometime!",
        "Sheesh! Can't you see that I'm just a kid! It wasn't fair of you to go all out like that!",
        "Your Pokémon are more amazing! Trade with me!",
        "I got a little carried away earlier, but what job was I talking about?",
        "Ahaha! There it is! That's right! You're already right at home in this world!"
      ]
    },
    //LASS
    {
      encounter: [
        "Let's have a battle, shall we?",
        "You look like a new trainer. Let's have a battle!",
        "I don't recognize you. How about a battle?",
        "Let's have a fun Pokémon battle!",
        "I'll show you the ropes of how to really use Pokémon!",
        "A serious battle starts from a serious beginning! Are you sure you're ready?",
        "You're only young once. And you only get one shot at a given battle. Soon, you'll be nothing but a memory.",
        "You'd better go easy on me, OK? Though I'll be seriously fighting!",
        "School is boring. I've got nothing to do. Yawn. I'm only battling to kill the time."
      ],
      victory: [
        "That was impressive! I've got a lot to learn.",
        "I didn't think you'd beat me that bad…",
        "I hope we get to have a rematch some day.",
        "That was pretty amazingly fun! You've totally exhausted me…",
        "You actually taught me a lesson! You're pretty amazing!",
        "Seriously, I lost. That is, like, seriously depressing, but you were seriously cool.",
        "I don't need memories like this. Deleting memory…",
        "Hey! I told you to go easy on me! Still, you're pretty cool when you're serious.",
        "I'm actually getting tired of battling… There's gotta be something new to do…"
      ]
    }
  ],
  [TrainerType.BREEDER]: [
    {
      encounter: [
        "Obedient Pokémon, selfish Pokémon… Pokémon have unique characteristics.",
        "Even though my upbringing and behavior are poor, I've raised my Pokémon well.",
        "Hmm, do you discipline your Pokémon? Pampering them too much is no good.",
      ],
      victory: [
        "It is important to nurture and train each Pokémon's characteristics.",
        "Unlike my diabolical self, these are some good Pokémon.",
        "Too much praise can spoil both Pokémon and people.",
      ],
      defeat:[
        "You should not get angry at your Pokémon, even if you lose a battle.",
        "Right? Pretty good Pokémon, huh? I'm suited to raising things.",
        "No matter how much you love your Pokémon, you still have to discipline them when they misbehave."
      ]
    },
    {
      encounter: [
        "Pokémon never betray you. They return all the love you give them.",
        "Shall I give you a tip for training good Pokémon?",
        "I have raised these very special Pokémon using a special method."
      ],
      victory: [
        "Ugh… It wasn't supposed to be like this. Did I administer the wrong blend?",
        "How could that happen to my Pokémon… What are you feeding your Pokémon?",
        "If I lose, that tells you I was just killing time. It doesn't damage my ego at all."
      ],
      defeat: [
        "This proves my Pokémon have accepted my love.",
        "The real trick behind training good Pokémon is catching good Pokémon.",
        "Pokémon will be strong or weak depending on how you raise them."
      ]
    }
  ],
  [TrainerType.FISHERMAN]: [
    {
      encounter: [
        "Aack! You made me lose a bite!\nWhat are you going to do about it?",
        "Go away! You're scaring the Pokémon!",
        "Let's see if you can reel in a victory!",
      ],
      victory: [
        "Just forget about it.",
        "Next time, I'll be reelin' in the triumph!",
        "Guess I underestimated the currents this time.",
      ]
    },
    {
      encounter: [
        "Woah! I've hooked a big one!",
        "Line's in, ready to reel in success!",
        "Ready to make waves!"
      ],
      victory: [
        "I'll be back with a stronger hook.",
        "I'll reel in victory next time.",
        "I'm just sharpening my hooks for the comeback!"
      ]
    }
  ],
  [TrainerType.SWIMMER]: [
    {
      encounter: [
        "Time to dive in!",
        "Let's ride the waves of victory!",
        "Ready to make a splash!",
      ],
      victory: [
        "Drenched in defeat!",
        "A wave of defeat!",
        "Back to shore, I guess.",
      ]
    }
  ],
  [TrainerType.BACKPACKER]: [
    {
      encounter: [
        "Pack up, game on!",
        "Let's see if you can keep pace!",
        "Gear up, challenger!",
        "I've spent 20 years trying to find myself… But where am I?"
      ],
      victory: [
        "Tripped up this time!",
        "Oh, I think I'm lost.",
        "Dead end!",
        "Wait up a second! Hey! Don't you know who I am?"
      ]
    }
  ],
  [TrainerType.ACE_TRAINER]: [
    {
      encounter: [
        "You seem quite confident.",
        "Your Pokémon… Show them to me…",
        "Because I'm an Ace Trainer, people think I'm strong.",
        "Are you aware of what it takes to be an Ace Trainer?"
      ],
      victory: [
        "Yes… You have good Pokémon…",
        "What?! But I'm a battling genius!",
        "Of course, you are the main character!",
        "OK! OK! You could be an Ace Trainer!"
      ],
      defeat: [
        "I am devoting my body and soul to Pokémon battles!",
        "All within my expectations… Nothing to be surprised about…",
        "I thought I'd grow up to be a frail person who looked like they would break if you squeezed them too hard.",
        "Of course I'm strong and don't lose. It's important that I win gracefully."
      ]
    }
  ],
  [TrainerType.PARASOL_LADY]: [
    {
      encounter: [
        "Time to grace the battlefield with elegance and poise!",
      ],
      victory: [
        "My elegance remains unbroken!",
      ]
    }
  ],
  [TrainerType.TWINS]: [
    {
      encounter: [
        "Get ready, because when we team up, it's double the trouble!",
        "Two hearts, one strategy – let's see if you can keep up with our twin power!",
        "Hope you're ready for double trouble, because we're about to bring the heat!"
      ],
      victory: [
        "We may have lost this round, but our bond remains unbreakable!",
        "Our twin spirit won't be dimmed for long.",
        "We'll come back stronger as a dynamic duo!"
      ],
      defeat: [
        "Twin power reigns supreme!",
        "Two hearts, one triumph!",
        "Double the smiles, double the victory dance!"
      ],
    }
  ],
  [TrainerType.CYCLIST]: [
    {
      encounter: [
        "Get ready to eat my dust!",
        "Gear up, challenger! I'm about to leave you in the dust!",
        "Pedal to the metal, let's see if you can keep pace!"
      ],
      victory: [
        "Spokes may be still, but determination pedals on.",
        "Outpaced!",
        "The road to victory has many twists and turns yet to explore."
      ]
    }
  ],
  [TrainerType.BLACK_BELT]: [
    {
      encounter: [
        "I praise your courage in challenging me! For I am the one with the strongest kick!",
        "Oh, I see. Would you like to be cut to pieces? Or do you prefer the role of punching bag?"
      ],
      victory: [
        "Oh. The Pokémon did the fighting. My strong kick didn't help a bit.",
        "Hmmm… If I was going to lose anyway, I was hoping to get totally messed up in the process."
      ]
    },
    //BATTLE GIRL
    {
      encounter: [
        "You don't have to try to impress me. You can lose against me.",
      ],
      victory: [
        "It's hard to say good-bye, but we are running out of time…",
      ]
    }
  ],
  [TrainerType.HIKER]: [
    {
      encounter: [
        "My middle-age spread has given me as much gravitas as the mountains I hike!",
        "I inherited this big-boned body from my parents… I'm like a living mountain range…",
      ],
      victory: [
        "At least I cannot lose when it comes to BMI!",
        "It's not enough… It's never enough. My bad cholesterol isn't high enough…"
      ]
    }
  ],
  [TrainerType.RANGER]: [
    {
      encounter: [
        "When I am surrounded by nature, most other things cease to matter.",
        "When I'm living without nature in my life, sometimes I'll suddenly feel an anxiety attack coming on."
      ],
      victory: [
        "It doesn't matter to the vastness of nature whether I win or lose…",
        "Something like this is pretty trivial compared to the stifling feelings of city life."
      ],
      defeat: [
        "I won the battle. But victory is nothing compared to the vastness of nature…",
        "I'm sure how you feel is not so bad if you compare it to my anxiety attacks…"
      ]
    }
  ],
  [TrainerType.SCIENTIST]: [
    {
      encounter: [
        "My research will lead this world to peace and joy.",
      ],
      victory: [
        "I am a genius… I am not supposed to lose against someone like you…",
      ]
    }
  ],
  [TrainerType.SCHOOL_KID]: [
    {
      encounter: [
        "…Heehee. I'm confident in my calculations and analysis.",
        "I'm gaining as much experience as I can because I want to be a Gym Leader someday."
      ],
      victory: [
        "Ohhhh… Calculation and analysis are perhaps no match for chance…",
        "Even difficult, trying experiences have their purpose, I suppose."
      ]
    }
  ],
  [TrainerType.ARTIST]: [
    {
      encounter: [
        "I used to be popular, but now I am all washed up.",
      ],
      victory: [
        "As times change, values also change. I realized that too late.",
      ]
    }
  ],
  [TrainerType.GUITARIST]: [
    {
      encounter: [
        "Get ready to feel the rhythm of defeat as I strum my way to victory!",
      ],
      victory: [
        "Silenced for now, but my melody of resilience will play on.",
      ]
    }
  ],
  [TrainerType.WORKER]: [
    {
      encounter: [
        "It bothers me that people always misunderstand me. I'm a lot more pure than everyone thinks."
      ],
      victory: [
        "I really don't want my skin to burn, so I want to stay in the shade while I work.",
      ]
    },
    {
      encounter: [
        `It bothers me that people always misunderstand me. 
        $I'm a lot more pure than everyone thinks.`
      ],
      victory: [
        "I really don't want my skin to burn, so I want to stay in the shade while I work."
      ],
      defeat: [
        "My body and mind aren't necessarily always in sync."
      ]
    },
    {
      encounter: [
        "I'll show you we can break you. We've been training in the field!"
      ],
      victory: [
        "How strange… How could this be… I shouldn't have been outmuscled.",
      ]
    },
  ],
  [TrainerType.HEX_MANIAC]: [
    {
      encounter: [
        "I normally only ever listen to classical music, but if I lose, I think I shall try a bit of new age!",
        "I grow stronger with each tear I cry."
      ],
      victory: [
        "Is this the dawning of the age of Aquarius?",
        "Now I can get even stronger. I grow with every grudge."
      ],
      defeat: [
        "New age simply refers to twentieth century classical composers, right?",
        "Don't get hung up on sadness or frustration. You can use your grudges to motivate yourself."
      ]
    }
  ],
  [TrainerType.PSYCHIC]: [
    {
      encounter: [
        "Hi! Focus!",
      ],
      victory: [
        "Eeeeek!",
      ]
    }
  ],
  [TrainerType.OFFICER]: [
    {
      encounter: [
        "Brace yourself, because justice is about to be served!",
        "Ready to uphold the law and serve justice on the battlefield!"
      ],
      victory: [
        "The weight of justice feels heavier than ever…",
        "The shadows of defeat linger in the precinct."
      ]
    }
  ],
  [TrainerType.BEAUTY]: [
    {
      encounter: [
        "My last ever battle… That's the way I'd like us to view this match…"
      ],
      victory: [
        "It's been fun… Let's have another last battle again someday…"
      ]
    }
  ],
  [TrainerType.BAKER]: [
    {
      encounter: [
        "Hope you're ready to taste defeat!"
      ],
      victory: [
        "I'll bake a comeback."
      ]
    }
  ],
  [TrainerType.BIKER]: [
    {
      encounter: [
        "Time to rev up and leave you in the dust!"
      ],
      victory: [
        "I'll tune up for the next race."
      ]
    }
  ],
  [TrainerType.BROCK]: {
    encounter: [
      "My expertise on Rock-type Pokémon will take you down! Come on!",
      "My rock-hard willpower will overwhelm you!",
      "Allow me to show you the true strength of my Pokémon!"
    ],
    victory: [
      "Your Pokémon's strength have overcome my rock-hard defenses!",
      "The world is huge! I'm glad to have had a chance to battle you.",
      "Perhaps I should go back to pursuing my dream as a Pokémon Breeder…"
    ],
    defeat: [
      "The best offense is a good defense!\nThat's my way of doing things!",
      "Come study rocks with me next time to better learn how to fight them!",
      "Hah, all my traveling around the regions is paying off!"
    ]
  },
  [TrainerType.MISTY]: {
    encounter: [
      "My policy is an all out offensive with Water-type Pokémon!",
      "Hiya, I'll show you the strength of my aquatic Pokémon!",
      "My dream was to go on a journey and battle powerful trainers…\nWill you be a sufficient challenge?"
    ],
    victory: [
      "You really are strong… I'll admit that you are skilled…",
      "Grrr… You know you just got lucky, right?!",
      "Wow, you're too much! I can't believe you beat me!"
    ],
    defeat: [
      "Was the mighty Misty too much for you?",
      "I hope you saw my Pokémon's elegant swimming techniques!",
      "Your Pokémon were no match for my pride and joys!"
    ]
  },
  [TrainerType.LT_SURGE]: {
    encounter: [
      "My Electric Pokémon saved me during the war! I'll show you how!",
      "Ten-hut! I'll shock you into surrender!",
      "I'll zap you just like I do to all my enemies in battle!"
    ],
    victory: [
      "Whoa! Your team's the real deal, kid!",
      "Aaargh, you're strong! Even my electric tricks lost against you.",
      "That was an absolutely shocking loss!"
    ],
    defeat: [
      "Oh yeah! When it comes to Electric-type Pokémon, I'm number one in the world!",
      "Hahaha! That was an electrifying battle, kid!",
      "A Pokémon battle is war, and I have showed you first-hand combat!"
    ]
  },
  [TrainerType.ERIKA]: {
    encounter: [
      "Ah, the weather is lovely here…\nOh, a battle? Very well then.",
      "My Pokémon battling skills rival that of my flower arranging skills.",
      "Oh, I hope the pleasant aroma of my Pokémon doesn't put me to sleep again…",
      "Seeing flowers in a garden is so soothing."
    ],
    victory: [
      "Oh! I concede defeat.",
      "That match was most delightful.",
      "Ah, it appears it is my loss…",
      "Oh, my goodness."
    ],
    defeat: [
      "I was afraid I would doze off…",
      "Oh my, it seems my Grass Pokémon overwhelmed you.",
      "That battle was such a soothing experience.",
      "Oh… Is that all?"
    ]
  },
  [TrainerType.JANINE]: {
    encounter: [
      "I am mastering the art of poisonous attacks.\nI shall spar with you today!",
      "Father trusts that I can hold my own.\nI will prove him right!",
      "My ninja techniques are only second to my Father's!\nCan you keep up?"
    ],
    victory: [
      "Even now, I still need training… I understand.",
      "Your battle technique has outmatched mine.",
      "I'm going to really apply myself and improve my skills."
    ],
    defeat: [
      "Fufufu… the poison has sapped all your strength to battle.",
      "Ha! You didn't stand a chance against my superior ninja skills!",
      "Father's faith in me has proven to not be misplaced."
    ]
  },
  [TrainerType.SABRINA]: {
    encounter: [
      "Through my psychic ability, I had a vision of your arrival!",
      "I dislike fighting, but if you wish, I will show you my powers!",
      "I can sense great ambition in you. I shall see if it not unfounded."
    ],
    victory: [
      "Your power… It far exceeds what I foresaw…",
      "I failed to accurately predict your power.",
      "Even with my immense psychic powers, I cannot sense another as strong as you."
    ],
    defeat: [
      "This victory… It is exactly as I foresaw in my visions!",
      "Perhaps it was another I sensed a great desire in…",
      "Hone your abilities before recklessly charging into battle.\nYou never know what the future may hold if you do…"
    ]
  },
  [TrainerType.BLAINE]: {
    encounter: [
      "Hah! Hope you brought a Burn Heal!",
      "My fiery Pokémon will incinerate all challengers!",
      "Get ready to play with fire!"
    ],
    victory: [
      "I have burned down to nothing! Not even ashes remain!",
      "Didn't I stoke the flames high enough?",
      "I'm all burned out… But this makes my motivation to improve burn even hotter!"
    ],
    defeat: [
      "My raging inferno cannot be quelled!",
      "My Pokémon have been powered up with the heat from this victory!",
      "Hah! My passion burns brighter than yours!"
    ]
  },
  [TrainerType.GIOVANNI]: {
    encounter: [
      "I, the leader of Team Rocket, will make you feel a world of pain!",
      "My training here will be vital before I am to face my old associates again.",
      "I do not think you are prepared for the level of failure you are about to experience!"
    ],
    victory: [
      "WHAT! Me, lose?! There is nothing I wish to say to you!",
      "Hmph… You could never understand what I hope to achieve.",
      "This defeat is merely delaying the inevitable.\nI will rise Team Rocket from the ashes in due time."
    ],
    defeat: [
      "Not being able to measure your own strength shows that you are still but a child.",
      "Do not try to interfere with me again.",
      "I hope you understand how foolish challenging me was."
    ]
  },
  [TrainerType.ROXANNE]: {
    encounter: [
      "Would you kindly demonstrate how you battle?",
      "You can learn many things by battling many trainers.",
      "Oh, you caught me strategizing.\nWould you like to battle?"
    ],
    victory: [
      "Oh, I appear to have lost.\nI understand.",
      "It seems that I still have so much more to learn when it comes to battle.",
      "I'll take what I learned here today to heart."
    ],
    defeat: [
      "I have learned many things from our battle.\nI hope you have too.",
      "I look forward to battling you again.\nI hope you'll use what you've learned here.",
      "I won due to everything I have learned."
    ]
  },
  [TrainerType.BRAWLY]: {
    encounter: [
      "Oh man, a challenger!\nLet's see what you can do!",
      "You seem like a big splash.\nLet's battle!",
      "Time to create a storm!\nLet's go!"
    ],
    victory: [
      "Oh woah, you've washed me out!",
      "You surfed my wave and crashed me down!",
      "I feel like I'm lost in Granite Cave!"
    ],
    defeat: [
      "Haha, I surfed the big wave!\nChallenge me again sometime.",
      "Surf with me again some time!",
      "Just like the tides come in and out, I hope you return to challenge me again."
    ]
  },
  [TrainerType.WATTSON]: {
    encounter: [
      "Time to get shocked!\nWahahahaha!",
      "I'll make sparks fly!\nWahahahaha!",
      "I hope you brought Paralyz Heal!\nWahahahaha!"
    ],
    victory: [
      "Seems like I'm out of charge!\nWahahahaha!",
      "You've completely grounded me!\nWahahahaha!",
      "Thanks for the thrill!\nWahahahaha!"
    ],
    defeat: [
      "Recharge your batteries and challenge me again sometime!\nWahahahaha!",
      "I hope you found our battle electrifying!\nWahahahaha!",
      "Aren't you shocked I won?\nWahahahaha!"
    ]
  },
  [TrainerType.FLANNERY]: {
    encounter: [
      "Nice to meet you! Wait, no…\nI will crush you!",
      "I've only been a leader for a little while, but I'll smoke you!",
      "It's time to demonstrate the moves my grandfather has taught me! Let's battle!"
    ],
    victory: [
      "You remind me of my grandfather…\nNo wonder I lost.",
      "Am I trying too hard?\nI should relax, can't get too heated.",
      "Losing isn't going to smother me out.\nTime to reignite training!"
    ],
    defeat: [
      "I hope I've made my grandfather proud…\nLet's battle again some time.",
      "I…I can't believe I won!\nDoing things my way worked!",
      "Let's exchange burning hot moves again soon!"
    ]
  },
  [TrainerType.NORMAN]: {
    encounter: [
      "I'm surprised you managed to get here.\nLet's battle.",
      "I'll do everything in my power as a Gym Leader to win.\nLet's go!",
      "You better give this your all.\nIt's time to battle!"
    ],
    victory: [
      "I lost to you…?\nRules are rules, though.",
      "Was moving from Olivine a mistake…?",
      "I can't believe it.\nThat was a great match."
    ],
    defeat: [
      "We both tried our best.\nI hope we can battle again soon.",
      "You should try challenging my kid instead.\nYou might learn something!",
      "Thank you for the excellent battle.\nBetter luck next time."
    ]
  },
  [TrainerType.WINONA]: {
    encounter: [
      "I've been soaring the skies looking for prey…\nAnd you're my target!",
      "No matter how our battle is, my Flying Pokémon and I will triumph with grace. Let's battle!",
      "I hope you aren't scared of heights.\nLet's ascend!"
    ],
    victory: [
      "You're the first Trainer I've seen with more grace than I.\nExcellently played.",
      "Oh, my Flying Pokémon have plummeted!\nVery well.",
      "Though I may have fallen, my Pokémon will continue to fly!"
    ],
    defeat: [
      "My Flying Pokémon and I will forever dance elegantly!",
      "I hope you enjoyed our show.\nOur graceful dance is finished.",
      "Won't you come see our elegant choreography again?"
    ]
  },
  [TrainerType.TATE]: {
    encounter: [
      "Hehehe…\nWere you surprised to see me without my sister?",
      "I can see what you're thinking…\nYou want to battle!",
      "How can you defeat someone…\nWho knows your every move?"
    ],
    victory: [
      "It can't be helped…\nI miss Liza…",
      "Your bond with your Pokémon was stronger than mine.",
      "If I were with Liza, we would have won.\nWe can finish each other's thoughts!"
    ],
    defeat: [
      "My Pokémon and I are superior!",
      "If you can't even defeat me, you'll never be able to defeat Liza either.",
      "It's all thanks to my strict training with Liza.\nI can make myself one with Pokémon."
    ]
  },
  [TrainerType.LIZA]: {
    encounter: [
      "Fufufu…\nWere you surprised to see me without my brother?",
      "I can determine what you desire…\nYou want to battle, don't you?",
      "How can you defeat someone…\nWho's one with their Pokémon?"
    ],
    victory: [
      "It can't be helped…\nI miss Tate…",
      "Your bond with your Pokémon…\nIt's stronger than mine.",
      "If I were with Tate, we would have won.\nWe can finish each other's sentences!"
    ],
    defeat: [
      "My Pokémon and I are victorious.",
      "If you can't even defeat me, you'll never be able to defeat Tate either.",
      "It's all thanks to my strict training with Tate.\nI can synchronize myself with my Pokémon."
    ]
  },
  [TrainerType.JUAN]: {
    encounter: [
      "Now's not the time to act coy.\nLet's battle!",
      "Ahahaha, You'll be witness to my artistry with Water Pokémon!",
      "A typhoon approaches!\nWill you be able to test me?",
      "Please, you shall bear witness to our artistry.\nA grand illusion of water sculpted by my Pokémon and myself!"
    ],
    victory: [
      "You may be a genius who can take on Wallace!",
      "I focused on elegance while you trained.\nIt's only natural that you defeated me.",
      "Ahahaha!\nVery well, You have won this time.",
      "From you, I sense the brilliant shine of skill that will overcome all."
    ],
    defeat: [
      "My Pokémon and I have sculpted an illusion of Water and come out victorious.",
      "Ahahaha, I have won, and you have lost.",
      "Shall I loan you my outfit? It may help you battle!\nAhahaha, I jest!",
      "I'm the winner! Which is to say, you lost."
    ]
  },
  [TrainerType.CRASHER_WAKE]: {
    encounter: [
      "Crash! Crash! Watch out!\nCrasher Wake…is…heeere!",
      "Crash! Crash! Crasher Wake!",
      "I'm the tidal wave of power to wash you away!"
    ],
    victory: [
      "That puts a grin on my face!\nGuhahaha! That was a blast!",
      "Hunwah! It's gone and ended!\nHow will I say this…\nI want more! I wanted to battle a lot more!",
      "WHAAAAT!?"
    ],
    defeat: [
      "Yeeeeah! That's right!",
      "I won, but I want more! I wanted to battle a lot more!",
      "So long!"
    ]
  },
  [TrainerType.FALKNER]: {
    encounter: [
      "I'll show you the real power of the magnificent bird Pokémon!",
      "Winds, stay with me!",
      "Dad! I hope you're watching me battle from above!"
    ],
    victory: [
      "I understand… I'll bow out gracefully.",
      "A defeat is a defeat. You are strong indeed.",
      "…Shoot! Yeah, I lost."
    ],
    defeat: [
      "Dad! I won with your cherished bird Pokémon…",
      "Bird Pokémon are the best after all!",
      "Feels like I'm catching up to my dad!"
    ]
  },
  [TrainerType.NESSA]: {
    encounter: [
      "No matter what kind of plan your refined mind may be plotting, my partner and I will be sure to sink it.",
      "I'm not here to chat. I'm here to win!",
      "This is a little gift from my Pokémon… I hope you can take it!"
    ],
    victory: [
      "You and your Pokémon are just too much…",
      "How…? How can this be?!",
      "I was totally washed away!"
    ],
    defeat: [
      "The raging wave crashes again!",
      "Time to ride the wave of victory!",
      "Ehehe!"
    ]
  },
  [TrainerType.MELONY]: {
    encounter: [
      "I'm not going to hold back!",
      "All righty, I suppose we should get started.",
      "I'll freeze you solid!"
    ],
    victory: [
      "You… You're pretty good, huh?",
      "If you find Gordie around, be sure to give him a right trashing, would you?",
      "I think you took breaking the ice a little too literally…"
    ],
    defeat: [
      "Now do you see how severe battles can be?",
      "Hee! Looks like I went and won again!",
      "Are you holding back?"
    ]
  },
  [TrainerType.MARLON]: {
    encounter: [
      "You look strong! Shoots! Let's start!",
      "I'm strong like the ocean's wide. You're gonna get swept away, fo' sho'.",
      "Oh ho, so I'm facing you! That's off the wall."
    ],
    victory: [
      "You totally rocked that! You're raising some wicked Pokémon. You got this Trainer thing down!",
      "You don't just look strong, you're strong fo' reals! Eh, I was swept away, too!",
      "You're strong as a gnarly wave!"
    ],
    defeat: [
      "You're tough, but it's not enough to sway the sea, 'K!",
      "Hee! Looks like I went and won again!",
      "Sweet, sweet victory!"
    ]
  },
  [TrainerType.SHAUNTAL]: {
    encounter: [
      "Excuse me. You're a challenger, right?\nI'm the Elite Four's Ghost-type Pokémon user, Shauntal, and I shall be your opponent.",
      "I absolutely love writing about Trainers who come here and the Pokémon they train.\nCould I use you and your Pokémon as a subject?",
      "Every person who works with Pokémon has a story to tell.\nWhat story is about to be told?"
    ],
    victory: [
      "Wow. I'm dumbstruck!",
      "S-sorry! First, I must apologize to my Pokémon…\n\nI'm really sorry you had a bad experience because of me!",
      "Even in light of that, I'm still one of the Elite Four!"
    ],
    defeat: [
      "Eheh.",
      "That gave me excellent material for my next novel!",
      "And so, another tale ends…"
    ]
  },
  [TrainerType.MARSHAL]: {
    encounter: [
      "My mentor, Alder, sees your potential as a Trainer and is taking an interest in you.\nIt is my intention to test you--to take you to the limits of your strength. Kiai!",
      "Victory, decisive victory, is my intention! Challenger, here I come!",
      "In myself, I seek to develop the strength of a fighter and shatter any weakness in myself!\nPrevailing with the force of my convictions!"
    ],
    victory: [
      "Whew! Well done!",
      "As your battles continue, aim for even greater heights!",
      "The strength shown by you and your Pokémon has deeply impressed me…"
    ],
    defeat: [
      "Hmm.",
      "That was good battle.",
      "Haaah! Haaah! Haiyaaaah!"
    ]
  },
  [TrainerType.CHEREN]: {
    encounter: [
      "You remind me of an old friend. That makes me excited about this Pokémon battle!",
      `Pokémon battles have no meaning if you don't think why you battle. 
      $Or better said, it makes battling together with Pokémon meaningless.`,
      "My name's Cheren! I'm a Gym Leader and a teacher! Pleasure to meet you."
    ],
    victory: [
      "Thank you! I saw what was missing in me.",
      "Thank you! I feel like I saw a little of the way toward my ideals.",
      "Hmm… This is problematic."
    ],
    defeat: [
      "As a Gym Leader, I aim to be a wall for you to overcome.",
      "All right!",
      "I made it where I am because Pokémon were by my side.\nPerhaps we need to think about why Pokémon help us not in terms of Pokémon and Trainers but as a relationship between living beings."
    ]
  },
  [TrainerType.CHILI]: {
    encounter: [
      "Yeeeeooow! Time to play with FIRE!! I'm the strongest of us brothers!",
      "Ta-da! The Fire-type scorcher Chili--that's me--will be your opponent!",
      "I'm going to show you what me and my blazing Fire types can do!"
    ],
    victory: [
      "You got me. I am… burned… out…",
      "Whoa ho! You're on fire!",
      "Augh! You got me!"
    ],
    defeat: [
      "I'm on fire! Play with me, and you'll get burned!",
      "When you play with fire, you get burned!",
      "I mean, c'mon, your opponent was me! You didn't have a chance!"
    ]
  },
  [TrainerType.CILAN]: {
    encounter: [
      `Nothing personal... No hard feelings... Me and my Grass-type Pokémon will...
      $Um... We're gonna battle come what may.`,
      "So, um, if you're OK with me, I'll, um, put everything I've got into being, er, you know, your opponent.",
      "OK… So, um, I'm Cilan, I like Grass-type Pokémon."
    ],
    victory: [
      "Er… Is it over now?",
      `…What a surprise. You are very strong, aren't you? 
      $I guess my brothers wouldn't have been able to defeat you either…`,
      "…Huh. Looks like my timing was, um, off?"
    ],
    defeat: [
      "Huh? Did I win?",
      `I guess… 
      $I suppose I won, because I've been competing with my brothers Chili and Cress, and we all were able to get tougher.`,
      "It…it was quite a thrilling experience…"
    ]
  },
  [TrainerType.ROARK]: {
    encounter: [
      "I need to see your potential as a Trainer. And, I'll need to see the toughness of the Pokémon that battle with you!",
      "Here goes! These are my rocking Pokémon, my pride and joy!",
      "Rock-type Pokémon are simply the best!",
      "I need to see your potential as a Trainer. And, I'll need to see the toughness of the Pokémon that battle with you!"
    ],
    victory: [
      "W-what? That can't be! My buffed-up Pokémon!",
      "…We lost control there. Next time I'd like to challenge you to a Fossil-digging race underground.",
      "With skill like yours, it's natural for you to win.",
      "Wh-what?! It can't be! Even that wasn't enough?",
      "I blew it."
    ],
    defeat: [
      "See? I'm proud of my rocking battle style!",
      "Thanks! The battle gave me confidence that I may be able to beat my dad!",
      "I feel like I just smashed through a really stubborn boulder!"
    ]
  },
  [TrainerType.MORTY]: {
    encounter: [
      `With a little more, I could see a future in which I meet the legendary Pokémon.
      $You're going to help me reach that level!`,
      `It's said that a rainbow-hued Pokémon will come down to appear before a truly powerful Trainer. 
      $I believed that tale, so I have secretly trained here all my life. As a result, I can now see what others cannot. 
      $I see a shadow of the person who will make the Pokémon appear. 
      $I believe that person is me! You're going to help me reach that level!`,
      "Whether you choose to believe or not, mystic power does exist.",
      "You can bear witness to the fruits of my training.",
      "You must make your soul one with that of Pokémon. Can you do this?",
      "Say, do you want to be part of my training?"
    ],
    victory: [
      "I'm not good enough yet…",
      `I see… Your journey has taken you to far-away places and you have witnessed much more than I.
      $I envy you for that…`,
      "How is this possible…",
      `I don't think our potentials are so different.
      $But you seem to have something more than that… So be it.`,
      "Guess I need more training.",
      "That's a shame."
    ],
    defeat: [
      "I moved… one step ahead again.",
      "Fufufu…",
      "Wh-what?! It can't be! Even that wasn't enough?",
      "I feel like I just smashed through a really stubborn boulder!",
      "Ahahahah!",
      "I knew I would win!"
    ]
  },
  [TrainerType.CRISPIN]: {
    encounter: [
      "I wanna win, so that's exactly what I'll do!",
      "I battle because I wanna battle! And you know what? That's how it should be!"
    ],
    victory: [
      "I wanted to win…but I lost!",
      "I lost…'cause I couldn't win!"
    ],
    defeat: [
      "Hey, wait a sec. Did I just win? I think I just won! Talk about satisfying!",
      "Wooo! That was amazing!"
    ]
  },
  [TrainerType.AMARYS]: {
    encounter: [
      `I want to be the one to help a certain person. That being the case, I cannot afford to lose.
      $… Our battle starts now.`,

    ],
    victory: [
      "I am… not enough, I see.",
    ],
    defeat: [
      "Victory belongs to me. Well fought.",
    ]
  },
  [TrainerType.LACEY]: {
    encounter: [
      "I'll be facing you with my usual party as a member of the Elite Four.",
    ],
    victory: [
      "That was a great battle!",
    ],
    defeat: [
      "Let's give your Pokémon a nice round of applause for their efforts!",
    ]
  },
  [TrainerType.DRAYTON]: {
    encounter: [
      `Man, I love chairs. Don't you love chairs? What lifesavers. 
      $I don't get why everyone doesn't just sit all the time. Standing up's tiring work!`,
    ],
    victory: [
      "Guess I should've expected that!",
    ],
    defeat: [
      "Heh heh! Don't mind me, just scooping up a W over here. I get it if you're upset, but don't go full Kieran on me, OK?",
    ]
  },
  [TrainerType.RAMOS]: {
    encounter: [
      `Did yeh enjoy the garden playground I made with all these sturdy plants o' mine?
      $Their strength is a sign o' my strength as a gardener and a Gym Leader! Yeh sure yer up to facing all that?`,
    ],
    victory: [
      "Yeh believe in yer Pokémon… And they believe in yeh, too… It was a fine battle, sprout.",
    ],
    defeat: [
      "Hohoho… Indeed. Frail little blades o' grass'll break through even concrete.",
    ]
  },
  [TrainerType.VIOLA]: {
    encounter: [
      `Whether it's the tears of frustration that follow a loss or the blossoming of joy that comes with victory…
      $They're both great subjects for my camera! Fantastic! This'll be just fantastic! 
      $Now come at me!`,
      "My lens is always focused on victory--I won't let anything ruin this shot!"
    ],
    victory: [
      "You and your Pokémon have shown me a whole new depth of field! Fantastic! Just fantastic!",
      `The world you see through a lens, and the world you see with a Pokémon by your side…
      $The same world can look entirely different depending on your view.`
    ],
    defeat: [
      "The photo from the moment of my victory will be a really winner, all right!",
      "Yes! I took some great photos!"
    ]
  },
  [TrainerType.CANDICE]: {
    encounter: [
      `You want to challenge Candice? Sure thing! I was waiting for someone tough! 
      $But I should tell you, I'm tough because I know how to focus.`,
      `Pokémon, fashion, romance… It's all about focus! 
      $I'll show you just what I mean. Get ready to lose!`
    ],
    victory: [
      "I must say, I'm warmed up to you! I might even admire you a little.",
      `Wow! You're great! You've earned my respect! 
      $I think your focus and will bowled us over totally. `
    ],
    defeat: [
      "I sensed your will to win, but I don't lose!",
      "See? Candice's focus! My Pokémon's focus is great, too!"
    ]
  },
  [TrainerType.GARDENIA]: {
    encounter: [
      "You have a winning aura about you. So, anyway, this will be fun. Let's have our battle!",
    ],
    victory: [
      "Amazing! You're very good, aren't you?",
    ],
    defeat: [
      "Yes! My Pokémon and I are perfectly good!",
    ]
  },
  [TrainerType.AARON]: {
    encounter: [
      "Ok! Let me take you on!",
    ],
    victory: [
      "Battling is a deep and complex affair…",
    ],
    defeat: [
      "Victory over an Elite Four member doesn't come easily.",
    ]
  },
  [TrainerType.CRESS]: {
    encounter: [
      "That is correct! It shall be I and my esteemed Water types that you must face in battle!",
    ],
    victory: [
      "Lose? Me? I don't believe this.",
    ],
    defeat: [
      "This is the appropriate result when I'm your opponent.",
    ]
  },
  [TrainerType.ALLISTER]: {
    encounter: [
      "'M Allister.\nH-here… I go…",
    ],
    victory: [
      `I nearly lost my mask from the shock… That was…
      $Wow. I can see your skill for what it is.`,
    ],
    defeat: [
      "Th-that was ace!",
    ]
  },
  [TrainerType.CLAY]: {
    encounter: [
      "Harrumph! Kept me waitin', didn't ya, kid? All right, time to see what ya can do!",
    ],
    victory: [
      "Man oh man… It feels good to go all out and still be defeated!",
    ],
    defeat: [
      `What's important is how ya react to losin'. 
      $That's why folks who use losin' as fuel to get better are tough.`,
    ]
  },
  [TrainerType.KOFU]: {
    encounter: [
      "I'mma serve you a full course o' Water-type Pokémon! Don't try to eat 'em, though!",
    ],
    victory: [
      "Vaultin' Veluza! Yer a lively one, aren't ya! A little TOO lively, if I do say so myself!",
    ],
    defeat: [
      "You come back to see me again now, ya hear?",
    ]
  },
  [TrainerType.TULIP]: {
    encounter: [
      "Allow me to put my skills to use to make your cute little Pokémon even more beautiful!",
    ],
    victory: [
      "Your strength has a magic to it that cannot be washed away.",
    ],
    defeat: [
      "You know, in my line of work, people who lack talent in one area or the other often fade away quickly—never to be heard of again.",
    ]
  },
  [TrainerType.SIDNEY]: {
    encounter: [
      `I like that look you're giving me. I guess you'll give me a good match.
      $That's good! Looking real good! All right!
      $You and me, let's enjoy a battle that can only be staged here!`,
    ],
    victory: [
      "Well, how do you like that? I lost! Eh, it was fun, so it doesn't matter.",
    ],
    defeat: [
      "No hard feelings, alright?",
    ]
  },
  [TrainerType.PHOEBE]: {
    encounter: [
      `While I trained, I gained the ability to commune with Ghost-type Pokémon. 
      $Yes, the bond I developed with Pokémon is extremely tight. 
      $So, come on, just try and see if you can even inflict damage on my Pokémon!`,
    ],
    victory: [
      "Oh, darn. I've gone and lost.",
    ],
    defeat: [
      "I look forward to battling you again sometime!",
    ]
  },
  [TrainerType.GLACIA]: {
    encounter: [
      `All I have seen are challenges by weak Trainers and their Pokémon. 
      $What about you? It would please me to no end if I could go all out against you!`,
    ],
    victory: [
      `You and your Pokémon… How hot your spirits burn!
      $The all-consuming heat overwhelms. 
      $It's no surprise that my icy skills failed to harm you.`,
    ],
    defeat: [
      "A fiercely passionate battle, indeed.",
    ]
  },
  [TrainerType.DRAKE]: {
    encounter: [
      `For us to battle with Pokémon as partners, do you know what it takes? Do you know what is needed? 
      $If you don't, then you will never prevail over me!`,
    ],
    victory: [
      "Superb, it should be said.",
    ],
    defeat: [
      "I gave my all for that battle!",
    ]
  },
  [TrainerType.WALLACE]: {
    encounter: [
      `There's something about you… A difference in your demeanor. 
      $I think I sense that in you. Now, show me. Show me the power you wield with your Pokémon. 
      $And I, in turn, shall present you with a performance of illusions in water by me and my Pokémon!`,
    ],
    victory: [
      `Bravo. I realize now your authenticity and magnificence as a Pokémon Trainer. 
      $I find much joy in having met you and your Pokémon. You have proven yourself worthy.`,
    ],
    defeat: [
      "A grand illusion!",
    ]
  },
  [TrainerType.LORELEI]: {
    encounter: [
      `No one can best me when it comes to icy Pokémon! Freezing moves are powerful!
      $Your Pokémon will be at my mercy when they are frozen solid! Hahaha! Are you ready?`,
    ],
    victory: [
      "How dare you!",
    ],
    defeat: [
      "There's nothing you can do once you're frozen.",
    ]
  },
  [TrainerType.WILL]: {
    encounter: [
      `I have trained all around the world, making my psychic Pokémon powerful.
      $I can only keep getting better! Losing is not an option!`,
    ],
    victory: [
      "I… I can't… believe it…",
    ],
    defeat: [
      "That was close. I wonder what it is that you lack.",
    ]
  },
  [TrainerType.MALVA]: {
    encounter: [
      `I feel like my heart might just burst into flames. 
      $I'm burning up with my hatred for you, runt!`,
    ],
    victory: [
      "What news… So a new challenger has defeated Malva!",
    ],
    defeat: [
      "I am delighted! Yes, delighted that I could squash you beneath my heel.",
    ]
  },
  [TrainerType.HALA]: {
    encounter: [
      "Old Hala is here to make you holler!",
    ],
    victory: [
      "I could feel the power you gained on your journey.",
    ],
    defeat: [
      "Haha! What a delightful battle!",
    ]
  },
  [TrainerType.MOLAYNE]: {
    encounter: [
      `I gave the captain position to my cousin Sophocles, but I'm confident in my ability. 
      $My strength is like that of a supernova!`,
    ],
    victory: [
      "I certainly found an interesting Trainer to face!",
    ],
    defeat: [
      "Ahaha. What an interesting battle.",
    ]
  },
  [TrainerType.RIKA]: {
    encounter: [
      "I'd say I'll go easy on you, but… I'd be lying! Think fast!",
    ],
    victory: [
      "Not bad, kiddo.",
    ],
    defeat: [
      "Nahahaha! You really are something else, kiddo!",
    ]
  },
  [TrainerType.BRUNO]: {
    encounter: [
      "We will grind you down with our superior power! Hoo hah!",
    ],
    victory: [
      "Why? How could I lose?",
    ],
    defeat: [
      "You can challenge me all you like, but the results will never change!",
    ]
  },
  [TrainerType.BUGSY]: {
    encounter: [
      "Let me demonstrate what I've learned from my studies.",
    ],
    victory: [
      `Whoa, amazing! You're an expert on Pokémon! 
      $My research isn't complete yet. OK, you win.`,
    ],
    defeat: [
      "Thanks! Thanks to our battle, I was also able to make progress in my research!",
    ]
  },
  [TrainerType.KOGA]: {
    encounter: [
      "Fwahahahaha! Pokémon are not merely about brute force--you shall see soon enough!",
    ],
    victory: [
      "Ah! You've proven your worth!",
    ],
    defeat: [
      "Have you learned to fear the techniques of the ninja?",
    ]
  },
  [TrainerType.BERTHA]: {
    encounter: [
      "Well, would you show this old lady how much you've learned?",
    ],
    victory: [
      `Well! Dear child, I must say, that was most impressive. 
      $Your Pokémon believed in you and did their best to earn you the win. 
      $Even though I've lost, I find myself with this silly grin!`,
    ],
    defeat: [
      "Hahahahah! Looks like this old lady won!",
    ]
  },
  [TrainerType.LENORA]: {
    encounter: [
      "Well then, challenger, I'm going to research how you battle with the Pokémon you've so lovingly raised!",
    ],
    victory: [
      "My theory about you was correct. You're more than just talented… You're motivated! I salute you!",
    ],
    defeat: [
      "Ah ha ha! If you lose, make sure to analyze why, and use that knowledge in your next battle!",
    ]
  },
  [TrainerType.SIEBOLD]: {
    encounter: [
      "As long as I am alive, I shall strive onward to seek the ultimate cuisine... and the strongest opponents in battle!",
    ],
    victory: [
      "I shall store my memory of you and your Pokémon forever away within my heart.",
    ],
    defeat: [
      `Our Pokémon battle was like food for my soul. It shall keep me going. 
      $That is how I will pay my respects to you for giving your all in battle!`,
    ]
  },
  [TrainerType.ROXIE]: {
    encounter: [
      "Get ready! I'm gonna knock some sense outta ya!",
    ],
    victory: [
      "Wild! Your reason's already more toxic than mine!",
    ],
    defeat: [
      "Hey, c'mon! Get serious! You gotta put more out there!",
    ]
  },
  [TrainerType.OLIVIA]: {
    encounter: [
      "No introduction needed here. Time to battle me, Olivia!",
    ],
    victory: [
      "Really lovely… Both you and your Pokémon…",
    ],
    defeat: [
      "Mmm-hmm.",
    ]
  },
  [TrainerType.POPPY]: {
    encounter: [
      "Oooh! Do you wanna have a Pokémon battle with me?",
    ],
    victory: [
      "Uagh?! Mmmuuuggghhh…",
    ],
    defeat: [
      `Yaaay! I did it! I de-feet-ed you! You can come for… For… An avenge match? 
      $Come for an avenge match anytime you want!`,
    ]
  },
  [TrainerType.AGATHA]: {
    encounter: [
      "Pokémon are for battling! I'll show you how a real Trainer battles!",
    ],
    victory: [
      "Oh my! You're something special, child!",
    ],
    defeat: [
      "Bahaha. That's how a proper battle's done!",
    ]
  },
  [TrainerType.FLINT]: {
    encounter: [
      "Hope you're warmed up, cause here comes the Big Bang!",
    ],
    victory: [
      "Incredible! Your moves are so hot, they make mine look lukewarm!",
    ],
    defeat: [
      "Huh? Is that it? I think you need a bit more passion.",
    ]
  },
  [TrainerType.GRIMSLEY]: {
    encounter: [
      "The winner takes everything, and there's nothing left for the loser.",
    ],
    victory: [
      "When one loses, they lose everything… The next thing I'll look for will be victory, too!",
    ],
    defeat: [
      "If somebody wins, the person who fought against that person will lose.",
    ]
  },
  [TrainerType.CAITLIN]: {
    encounter: [
      `It's me who appeared when the flower opened up. You who have been waiting…
      $You look like a Pokémon Trainer with refined strength and deepened kindness. 
      $What I look for in my opponent is superb strength… 
      $Please unleash your power to the fullest!`,
    ],
    victory: [
      "My Pokémon and I learned so much! I offer you my thanks.",
    ],
    defeat: [
      "I aspire to claim victory with elegance and grace.",
    ]
  },
  [TrainerType.DIANTHA]: {
    encounter: [
      `Battling against you and your Pokémon, all of you brimming with hope for the future… 
      $Honestly, it just fills me up with energy I need to keep facing each new day! It does!`,
    ],
    victory: [
      "Witnessing the noble spirits of you and your Pokémon in battle has really touched my heart…",
    ],
    defeat: [
      "Oh, fantastic! What did you think? My team was pretty cool, right?",
    ]
  },
  [TrainerType.WIKSTROM]: {
    encounter: [
      `Well met, young challenger! Verily am I the famed blade of hardened steel, Duke Wikstrom! 
      $Let the battle begin! En garde!`,
    ],
    victory: [
      "Glorious! The trust that you share with your honorable Pokémon surpasses even mine!",
    ],
    defeat: [
      `What manner of magic is this? My heart, it doth hammer ceaselessly in my breast! 
      $Winning against such a worthy opponent doth give my soul wings--thus do I soar!`,
    ]
  },
  [TrainerType.ACEROLA]: {
    encounter: [
      "Battling is just plain fun! Come on, I can take you!",
    ],
    victory: [
      "I'm… I'm speechless! How did you do it?!",
    ],
    defeat: [
      "Ehaha! What an amazing victory!",
    ]
  },
  [TrainerType.LARRY_ELITE]: {
    encounter: [
      `Hello there… It's me, Larry.
      $I serve as a member of the Elite Four too, yes… Unfortunately for me.`,
    ],
    victory: [
      "Well, that took the wind from under our wings…",
    ],
    defeat: [
      "It's time for a meeting with the boss.",
    ]
  },
  [TrainerType.LANCE]: {
    encounter: [
      "I've been waiting for you. Allow me to test your skill.",
      "I thought that you would be able to get this far. Let's get this started."
    ],
    victory: [
      "You got me. You are magnificent!",
      "I never expected another trainer to beat me… I'm surprised."
    ],
    defeat: [
      "That was close. Want to try again?",
      "It's not that you are weak. Don't let it bother you."
    ]
  },
  [TrainerType.KAREN]: {
    encounter: [
      "I am Karen. Would you care for a showdown with my Dark-type Pokémon?",
      "I am unlike those you've already met.",
      "You've assembled a charming team. Our battle should be a good one."
    ],
    victory: [
      "No! I can't win. How did you become so strong?",
      "I will not stray from my chosen path.",
      "The Champion is looking forward to meeting you."
    ],
    defeat: [
      "That's about what I expected.",
      "Well, that was relatively entertaining.",
      "Come visit me anytime."
    ]
  },
  [TrainerType.MILO]: {
    encounter: [
      `Sure seems like you understand Pokémon real well. 
      $This is gonna be a doozy of a battle! 
      $I'll have to Dynamax my Pokémon if I want to win!`,
    ],
    victory: [
      "The power of Grass has wilted… What an incredible Challenger!",
    ],
    defeat: [
      "This'll really leave you in shock and awe.",
    ]
  },
  [TrainerType.LUCIAN]: {
    encounter: [
      `Just a moment, please. The book I'm reading has nearly reached its thrilling climax… 
      $The hero has obtained a mystic sword and is about to face their final trial… Ah, never mind. 
      $Since you've made it this far, I'll put that aside and battle you. 
      $Let me see if you'll achieve as much glory as the hero of my book!,`
    ],
    victory: [
      "I see… It appears you've put me in checkmate.",
    ],
    defeat: [
      "I have a reputation to uphold.",
    ]
  },
  [TrainerType.DRASNA]: {
    encounter: [
      `You must be a strong Trainer. Yes, quite strong indeed…
      $That's just wonderful news! Facing opponents like you and your team will make my Pokémon grow like weeds!`
    ],
    victory: [
      "Oh, dear me. That sure was a quick battle… I do hope you'll come back again sometime!",
    ],
    defeat: [
      "How can this be?",
    ]
  },
  [TrainerType.KAHILI]: {
    encounter: [
      "So, here you are… Why don't we see who the winds favor today, you… Or me?"
    ],
    victory: [
      "It's frustrating to me as a member of the Elite Four, but it seems your strength is the real deal.",
    ],
    defeat: [
      "That was an ace!",
    ]
  },
  [TrainerType.HASSEL]: {
    encounter: [
      "Prepare to learn firsthand how the fiery breath of ferocious battle feels!"
    ],
    victory: [
      `Fortune smiled on me this time, but… 
      $Judging from how the match went, who knows if I will be so lucky next time.`,
    ],
    defeat: [
      "That was an ace!",
    ]
  },
  [TrainerType.BLUE]: {
    encounter: [
      "You must be pretty good to get this far."
    ],
    victory: [
      "I've only lost to him and now to you… Him? Hee, hee…",
    ],
    defeat: [
      "See? My power is what got me here.",
    ]
  },
  [TrainerType.PIERS]: {
    encounter: [
      "Get ready for a mosh pit with me and my party! Spikemuth, it's time to rock!"
    ],
    victory: [
      "Me an' my team gave it our best. Let's meet up again for a battle some time…",
    ],
    defeat: [
      "My throat's ragged from shoutin'… But 'at was an excitin' battle!",
    ]
  },
  [TrainerType.RED]: {
    encounter: [
      "…!"
    ],
    victory: [
      "…?",
    ],
    defeat: [
      "…!",
    ]
  },
  [TrainerType.JASMINE]: {
    encounter: [
      "Oh… Your Pokémon are impressive. I think I will enjoy this."
    ],
    victory: [
      "You are truly strong. I'll have to try much harder, too.",
    ],
    defeat: [
      "I never expected to win.",
    ]
  },
  [TrainerType.LANCE_CHAMPION]: {
    encounter: [
      "I am still the Champion. I won't hold anything back.",
    ],
    victory: [
      "This is the emergence of a new Champion.",
    ],
    defeat: [
      "I successfully defended my Championship.",
    ]
  },
  [TrainerType.STEVEN]: {
    encounter: [
      `Tell me… What have you seen on your journey with your Pokémon? 
      $What have you felt, meeting so many other Trainers out there? 
      $Traveling this rich land… Has it awoken something inside you? 
      $I want you to come at me with all that you've learned. 
      $My Pokémon and I will respond in turn with all that we know!`,
    ],
    victory: [
      "So I, the Champion, fall in defeat…",
    ],
    defeat: [
      "That was time well spent! Thank you!",
    ]
  },
  [TrainerType.CYNTHIA]: {
    encounter: [
      "I, Cynthia, accept your challenge! There won't be any letup from me!",
    ],
    victory: [
      "No matter how fun the battle is, it will always end sometime…",
    ],
    defeat: [
      "Even if you lose, never lose your love of Pokémon.",
    ]
  },
  [TrainerType.IRIS]: {
    encounter: [
      `Know what? I really look forward to having serious battles with strong Trainers! 
      $I mean, come on! The Trainers who make it here are Trainers who desire victory with every fiber of their being! 
      #And they are battling alongside Pokémon that have been through countless difficult battles! 
      $If I battle with people like that, not only will I get stronger, my Pokémon will, too! 
      $And we'll get to know each other even better! OK! Brace yourself! 
      $I'm Iris, the Pokémon League Champion, and I'm going to defeat you!`,
    ],
    victory: [
      "Aghhhh… I did my best, but we lost…",
    ],
    defeat: [
      "Yay! We won!",
    ]
  },
  [TrainerType.HAU]: {
    encounter: [
      `I wonder if a Trainer battles differently depending on whether they're from a warm region or a cold region.
      $Let's test it out!`,
    ],
    victory: [
      "That was awesome! I think I kinda understand your vibe a little better now!",
    ],
    defeat: [
      "Ma-an, that was some kinda battle!",
    ]
  },
  [TrainerType.GEETA]: {
    encounter: [
      `I decided to throw my hat in the ring once more. 
      $Come now… Show me the fruits of your training.`,
    ],
    victory: [
      "I eagerly await news of all your achievements!",
    ],
    defeat: [
      "What's the matter? This isn't all, is it?",
    ]
  },
  [TrainerType.NEMONA]: {
    encounter: [
      "Yesss! I'm so psyched! Time for us to let loose!",
    ],
    victory: [
      "Well, that stinks, but I still had fun! I'll getcha next time!",
    ],
    defeat: [
      "Well, that was a great battle! Fruitful for sure.",
    ]
  },
  [TrainerType.LEON]: {
    encounter: [
      "We're gonna have an absolutely champion time!",
    ],
    victory: [
      `My time as Champion is over… 
      $But what a champion time it's been! 
      $Thank you for the greatest battle I've ever had!`,
    ],
    defeat: [
      "An absolute champion time, that was!",
    ]
  },
  [TrainerType.WHITNEY]: {
    encounter: [
      "Hey! Don't you think Pokémon are, like, super cute?",
    ],
    victory: [
      "Waaah! Waaah! You're so mean!",
    ],
    defeat: [
      "And that's that!",
    ]
  },
  [TrainerType.CHUCK]: {
    encounter: [
      "Hah! You want to challenge me? Are you brave or just ignorant?",
    ],
    victory: [
      "You're strong! Would you please make me your apprentice?",
    ],
    defeat: [
      "There. Do you realize how much more powerful I am than you?",
    ]
  },
  [TrainerType.KATY]: {
    encounter: [
      "Don't let your guard down unless you would like to find yourself knocked off your feet!",
    ],
    victory: [
      "All of my sweet little Pokémon dropped like flies!",
    ],
    defeat: [
      "Eat up, my cute little Vivillon!",
    ]
  },
  [TrainerType.PRYCE]: {
    encounter: [
      "Youth alone does not ensure victory! Experience is what counts.",
    ],
    victory: [
      "Outstanding! That was perfect. Try not to forget what you feel now.",
    ],
    defeat: [
      "Just as I envisioned.",
    ]
  },
  [TrainerType.CLAIR]: {
    encounter: [
      "Do you know who I am? And you still dare to challenge me?",
    ],
    victory: [
      "I wonder how far you can get with your skill level. This should be fascinating.",
    ],
    defeat: [
      "That's that.",
    ]
  },
  [TrainerType.MAYLENE]: {
    encounter: [
      `I've come to challenge you now, and I won't hold anything back. 
      $Please prepare yourself for battle!`,
    ],
    victory: [
      "I admit defeat…",
    ],
    defeat: [
      "That was awesome.",
    ]
  },
  [TrainerType.FANTINA]: {
    encounter: [
      `You shall challenge me, yes? But I shall win. 
      $That is what the Gym Leader of Hearthome does, non?`,
    ],
    victory: [
      "You are so fantastically strong. I know why I have lost.",
    ],
    defeat: [
      "I am so, so, very happy!",
    ]
  },
  [TrainerType.BYRON]: {
    encounter: [
      `Trainer! You're young, just like my son, Roark. 
      $With more young Trainers taking charge, the future of Pokémon is bright! 
      $So, as a wall for young people, I'll take your challenge!`,
    ],
    victory: [
      "Hmm! My sturdy Pokémon--defeated!",
    ],
    defeat: [
      "Gwahahaha! How were my sturdy Pokémon?!",
    ]
  },
  [TrainerType.OLYMPIA]: {
    encounter: [
      "An ancient custom deciding one's destiny. The battle begins!",
    ],
    victory: [
      "Create your own path. Let nothing get in your way. Your fate, your future.",
    ],
    defeat: [
      "Our path is clear now.",
    ]
  },
  [TrainerType.VOLKNER]: {
    encounter: [
      `Since you've come this far, you must be quite strong…
      $I hope you're the Trainer who'll make me remember how fun it is to battle!`,
    ],
    victory: [
      `You've got me beat…
      $Your desire and the noble way your Pokémon battled for you… 
      $I even felt thrilled during our match. That was a very good battle.`,
    ],
    defeat: [
      `It was not shocking at all… 
      $That is not what I wanted!`,
    ]
  },
  [TrainerType.BURGH]: {
    encounter: [
      `M'hm… If I win this battle, I feel like I can draw a picture unlike any before it. 
      $OK! I can hear my battle muse loud and clear. Let's get straight to it!`,
      `Of course, I'm really proud of all of my Pokémon! 
      $Well now… Let's get right to it!`
    ],
    victory: [
      "Is it over? Has my muse abandoned me?",
      "Hmm… It's over! You're incredible!"
    ],
    defeat: [
      "Wow… It's beautiful somehow, isn't it…",
      `Sometimes I hear people say something was an ugly win. 
      $I think if you're trying your best, any win is beautiful.`
    ]
  },
  [TrainerType.ELESA]: {
    encounter: [
      `C'est fini! When I'm certain of that, I feel an electric jolt run through my body! 
      $I want to feel the sensation, so now my beloved Pokémon are going to make your head spin!`,
    ],
    victory: [
      "I meant to make your head spin, but you shocked me instead.",
    ],
    defeat: [
      "That was unsatisfying somehow… Will you give it your all next time?",
    ]
  },
  [TrainerType.SKYLA]: {
    encounter: [
      `It's finally time for a showdown! That means the Pokémon battle that decides who's at the top, right? 
      $I love being on the summit! 'Cause you can see forever and ever from high places! 
      $So, how about you and I have some fun?`,
    ],
    victory: [
      "Being your opponent in battle is a new source of strength to me. Thank you!",
    ],
    defeat: [
      "Win or lose, you always gain something from a battle, right?",
    ]
  },
  [TrainerType.BRYCEN]: {
    encounter: [
      `There is also strength in being with other people and Pokémon. 
      $Receiving their support makes you stronger. I'll show you this power!`,
    ],
    victory: [
      "The wonderful combination of you and your Pokémon! What a beautiful friendship!",
    ],
    defeat: [
      "Extreme conditions really test you and train you!",
    ]
  },
  [TrainerType.DRAYDEN]: {
    encounter: [
      `What I want to find is a young Trainer who can show me a bright future. 
      $Let's battle with everything we have: your skill, my experience, and the love we've raised our Pokémon with!`,
    ],
    victory: [
      "This intense feeling that floods me after a defeat… I don't know how to describe it.",
    ],
    defeat: [
      "Harrumph! I know your ability is greater than that!",
    ]
  },
  [TrainerType.GRANT]: {
    encounter: [
      `There is only one thing I wish for. 
      $That by surpassing one another, we find a way to even greater heights.`,
    ],
    victory: [
      "You are a wall that I am unable to surmount!",
    ],
    defeat: [
      `Do not give up. 
      $That is all there really is to it. 
      $The most important lessons in life are simple.`,
    ]
  },
  [TrainerType.KORRINA]: {
    encounter: [
      "Time for Lady Korrina's big appearance!",
    ],
    victory: [
      "It's your very being that allows your Pokémon to evolve!",
    ],
    defeat: [
      "What an explosive battle!",
    ]
  },
  [TrainerType.CLEMONT]: {
    encounter: [
      "Oh! I'm glad that we got to meet!",
    ],
    victory: [
      "Your passion for battle inspires me!",
    ],
    defeat: [
      "Looks like my Trainer-Grow-Stronger Machine, Mach 2 is really working!",
    ]
  },
  [TrainerType.VALERIE]: {
    encounter: [
      `Oh, if it isn't a young Trainer… It is lovely to get to meet you like this. 
      $Then I suppose you have earned yourself the right to a battle, as a reward for your efforts. 
      $The elusive Fairy may appear frail as the breeze and delicate as a bloom, but it is strong.`,
    ],
    victory: [
      "I hope that you will find things worth smiling about tomorrow…",
    ],
    defeat: [
      "Oh goodness, what a pity…",
    ]
  },
  [TrainerType.WULFRIC]: {
    encounter: [
      `You know what? We all talk big about what you learn from battling and bonds and all that…
      $But really, I just do it 'cause it's fun. 
      $Who cares about the grandstanding? Let's get to battling!`,
    ],
    victory: [
      "Outstanding! I'm tough as an iceberg, but you smashed me through and through!",
    ],
    defeat: [
      "Tussle with me and this is what happens!",
    ]
  },
  [TrainerType.KABU]: {
    encounter: [
      `Every Trainer and Pokémon trains hard in pursuit of victory. 
      $But that means your opponent is also working hard to win. 
      $In the end, the match is decided by which side is able to unleash their true potential.`,
    ],
    victory: [
      "I'm glad I could battle you today!",
    ],
    defeat: [
      "That's a great way for me to feel my own growth!",
    ]
  },
  [TrainerType.BEA]: {
    encounter: [
      `Do you have an unshakable spirit that won't be moved, no matter how you are attacked? 
      $I think I'll just test that out, shall I?`,
    ],
    victory: [
      "I felt the fighting spirit of your Pokémon as you led them in battle.",
    ],
    defeat: [
      "That was the best sort of match anyone could ever hope for.",
    ]
  },
  [TrainerType.OPAL]: {
    encounter: [
      "Let me have a look at how you and your partner Pokémon behave!",
    ],
    victory: [
      "Your pink is still lacking, but you're an excellent Trainer with excellent Pokémon.",
    ],
    defeat: [
      "Too bad for you, I guess.",
    ]
  },
  [TrainerType.BEDE]: {
    encounter: [
      "I suppose I should prove beyond doubt just how pathetic you are and how strong I am.",
    ],
    victory: [
      "I see… Well, that's fine. I wasn't really trying all that hard anyway.",
    ],
    defeat: [
      "Not a bad job, I suppose.",
    ]
  },
  [TrainerType.GORDIE]: {
    encounter: [
      "So, let's get this over with.",
    ],
    victory: [
      "I just want to climb into a hole… Well, I guess it'd be more like falling from here.",
    ],
    defeat: [
      "Battle like you always do, victory will follow!",
    ]
  },
  [TrainerType.MARNIE]: {
    encounter: [
      `The truth is, when all's said and done… I really just wanna become Champion for myself! 
      $So don't take it personal when I kick your butt!`,
    ],
    victory: [
      "OK, so I lost… But I got to see a lot of the good points of you and your Pokémon!",
    ],
    defeat: [
      "Hope you enjoyed our battle tactics.",
    ]
  },
  [TrainerType.RAIHAN]: {
    encounter: [
      "I'm going to defeat the Champion, win the whole tournament, and prove to the world just how strong the great Raihan really is!",
    ],
    victory: [
      `I look this good even when I lose. 
      $It's a real curse. 
      $Guess it's time for another selfie!`,
    ],
    defeat: [
      "Let's take a selfie to remember this.",
    ]
  },
  [TrainerType.BRASSIUS]: {
    encounter: [
      "I assume you are ready? Let our collaborative work of art begin!",
    ],
    victory: [
      "Ahhh…vant-garde!",
    ],
    defeat: [
      "I will begin on a new piece at once!",
    ]
  },
  [TrainerType.IONO]: {
    encounter: [
      `How're ya feelin' about this battle?
      $...
      $Let's get this show on the road! How strong is our challenger? 
      $I 'unno! Let's find out together!`,
    ],
    victory: [
      "You're as flashy and bright as a 10,000,000-volt Thunderbolt, friendo!",
    ],
    defeat: [
      "Your eyeballs are MINE!",
    ]
  },
  [TrainerType.LARRY]: {
    encounter: [
      "When all's said and done, simplicity is strongest.",
    ],
    victory: [
      "A serving of defeat, huh?",
    ],
    defeat: [
      "I'll call it a day.",
    ]
  },
  [TrainerType.RYME]: {
    encounter: [
      "Come on, baby! Rattle me down to the bone!",
    ],
    victory: [
      "You're cool, my friend—you move my SOUL!",
    ],
    defeat: [
      "Later, baby!",
    ]
  },
  [TrainerType.GRUSHA]: {
    encounter: [
      "All I need to do is make sure the power of my Pokémon chills you to the bone!",
    ],
    victory: [
      "Your burning passion… I kinda like it, to be honest.",
    ],
    defeat: [
      "Things didn't heat up for you.",
    ]
  },
  [TrainerType.MARNIE_ELITE]: {
    encounter: [
      "You've made it this far, huh? Let's see if you can handle my Pokémon!",
      "I'll give it my best shot, but don't think I'll go easy on you!",
    ],
    victory: [
      "I can't believe I lost... But you deserved that win. Well done!",
      "Looks like I've still got a lot to learn. Great battle, though!",
    ],
    defeat: [
      "You put up a good fight, but I've got the edge! Better luck next time!",
      "Seems like my training's paid off. Thanks for the battle!",
    ]
  },
  [TrainerType.NESSA_ELITE]: {
    encounter: [
      "The tides are turning in my favor. Ready to get swept away?",
      "Let's make some waves with this battle! I hope you're prepared!",
    ],
    victory: [
      "You navigated those waters perfectly... Well done!",
      "Looks like my currents were no match for you. Great job!",
    ],
    defeat: [
      "Water always finds a way. That was a refreshing battle!",
      "You fought well, but the ocean's power is unstoppable!",
    ]
  },
  [TrainerType.BEA_ELITE]: {
    encounter: [
      "Prepare yourself! My fighting spirit burns bright!",
      "Let's see if you can keep up with my relentless pace!",
    ],
    victory: [
      "Your strength... It's impressive. You truly deserve this win.",
      "I've never felt this intensity before. Amazing job!",
    ],
    defeat: [
      "Another victory for my intense training regimen! Well done!",
      "You've got strength, but I trained harder. Great battle!",
    ]
  },
  [TrainerType.ALLISTER_ELITE]: {
    encounter: [
      "Shadows fall... Are you ready to face your fears?",
      "Let's see if you can handle the darkness that I command.",
    ],
    victory: [
      "You've dispelled the shadows... For now. Well done.",
      "Your light pierced through my darkness. Great job.",
    ],
    defeat: [
      "The shadows have spoken... Your strength isn't enough.",
      "Darkness triumphs... Maybe next time you'll see the light.",
    ]
  },
  [TrainerType.RAIHAN_ELITE]: {
    encounter: [
      "Storm's brewing! Let's see if you can weather this fight!",
      "Get ready to face the eye of the storm!",
    ],
    victory: [
      "You've bested the storm... Incredible job!",
      "You rode the winds perfectly... Great battle!",
    ],
    defeat: [
      "Another storm weathered, another victory claimed! Well fought!",
      "You got caught in my storm! Better luck next time!",
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
        `@c{shock}Wow… You cleaned me out.\nAre you actually a beginner?
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
        `@c{neutral_eclosed}Oh. I guess I was overconfident.
        $@c{smile}That's alright, though. I figured this might happen.\n@c{serious_mopen_fists}It just means I need to try harder for next time!\n
        $@c{smile}Oh, not that you really need the help, but I had an extra one of these lying around and figured you might want it.\n
        $@c{serious_smile_fists}Don't expect another one after this, though!\nI can't keep giving my opponent an advantage after all.
        $@c{smile}Anyway, take care!`
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
        `@c{neutral}I… wasn't supposed to lose that time…
        $@c{smile}Aw well. That just means I'll have to train even harder for next time!
        $@c{smile_wave}I also got you another one of these!\n@c{smile_wave_wink}No need to thank me~.
        $@c{angry_mopen}This is the last one, though! You won't be getting anymore freebies from me after this!
        $@c{smile_wave}Keep at it!`
      ],
      defeat: [
        "It's OK to lose sometimes…"
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
        "@c{angry_mhalf}This is ridiculous… I've hardly stopped training…\nHow are we still so far apart?"
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
        "@c{shock}After all that… it wasn't enough…?\nYou'll never come back at this rate…"
      ],
      defeat: [
        "You gave it your best, now let's go home."
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
        "@c{neutral}What…@d{64} What are you?"
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
        "@c{neutral}What…@d{64} What are you?"
      ],
      defeat: [
        "$@c{smile}You should be proud of how far you made it."
      ]
    }
  ],
  [TrainerType.RIVAL_5]: [
    {
      encounter: [
        "@c{neutral}…"
      ],
      victory: [
        "@c{neutral}…"
      ]
    },
    {
      encounter: [
        "@c{neutral}…"
      ],
      victory: [
        "@c{neutral}…"
      ]
    },
    {
      defeat: [
        "$@c{smile_ehalf}…"
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
        $@c{smile_ehalf}I… don't know what all this means… but I feel it's true.
        $@c{neutral}If you can't defeat me here and now, you won't stand a chance.`
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
    secondStageWin: "…Magnificent."
  }
};

export const miscDialogue = {
  ending: [
    `@c{smile}Oh? You won?@d{96} @c{smile_eclosed}I guess I should've known.\nBut, you're back now.
    $@c{smile}It's over.@d{64} You ended the loop.
    $@c{serious_smile_fists}You fulfilled your dream too, didn't you?\nYou didn't lose even once.
    $@c{neutral}I'm the only one who'll remember what you did.@d{96}\nI guess that's okay, isn't it?
    $@c{serious_smile_fists}Your legend will always live on in our hearts.
    $@c{smile_eclosed}Anyway, I've had about enough of this place, haven't you? Let's head home.
    $@c{serious_smile_fists}Maybe when we get back, we can have another battle?\nIf you're up to it.`,
    `@c{shock}You're back?@d{32} Does that mean…@d{96} you won?!\n@c{smile_ehalf}I should have known you had it in you.
    $@c{smile_eclosed}Of course… I always had that feeling.\n@c{smile}It's over now, right? You ended the loop.
    $@c{smile_ehalf}You fulfilled your dream too, didn't you?\nYou didn't lose even once.
    $I'll be the only one to remember what you did.\n@c{angry_mopen}I'll try not to forget!
    $@c{smile_wave_wink}Just kidding!@d{64} @c{smile}I'd never forget.@d{32}\nYour legend will live on in our hearts.
    $@c{smile_wave}Anyway,@d{64} it's getting late…@d{96} I think?\nIt's hard to tell in this place.
    $Let's go home. @c{smile_wave_wink}Maybe tomorrow, we can have another battle, for old time's sake?`
  ]
};

export function getCharVariantFromDialogue(message: string): string {
  const variantMatch = /@c\{(.*?)\}/.exec(message);
  if (variantMatch) {
    return variantMatch[1];
  }
  return "neutral";
}

export function initTrainerTypeDialogue(): void {
  const trainerTypes = Object.keys(trainerTypeDialogue).map(t => parseInt(t) as TrainerType);
  for (const trainerType of trainerTypes) {
    const messages = trainerTypeDialogue[trainerType];
    const messageTypes = [ "encounter", "victory", "defeat" ];
    for (const messageType of messageTypes) {
      if (Array.isArray(messages)) {
        if (messages[0][messageType]) {
          trainerConfigs[trainerType][`${messageType}Messages`] = messages[0][messageType];
        }
        if (messages.length > 1) {
          trainerConfigs[trainerType][`female${messageType.slice(0, 1).toUpperCase()}${messageType.slice(1)}Messages`] = messages[1][messageType];
        }
      } else {
        trainerConfigs[trainerType][`${messageType}Messages`] = messages[messageType];
      }
    }
  }
}
