import {DialogueTranslationEntries, SimpleTranslationEntries} from "#app/plugins/i18n";

// Dialogue of the NPCs in the game when the player character is male (or unset)
export const PGMdialogue: DialogueTranslationEntries = {
  "youngster": {
    "encounter": {
      1: "Hé ! Combat ?",
      2: "Toi aussi tu débutes ?",
      3: "Hé, j’me souviens pas de ta tête. Combat !",
	  4: "J’ai perdu, alors j’essaye de capturer d’autres Pokémon.\nHé, t’as l'air faible toi ! Allez, combat !",
      5: "On s’connait ? J’ai comme un doute. Dans tous les cas, sympa de te rencontrer !",
      6: "Allez, c’est parti !",
      7: "Attention, me voilà !\nTu vas voir comment j’suis fort !",
	  8: "Coucou… Tu veux voir mes bô Pokémon ?",
	  9: "Trève de mondanités. Ramène-toi quand tu le sens !",
	  10: "Baisse pas ta garde si tu veux pas pleurer d’avoir perdu face à un gamin.",
	  11: "J'ai tout donné pour élever mes Pokémon. Attention à toi si tu leur fait du mal !",
	  12: "Incroyable que t’y sois parvenu ! Mais la suite va pas être une partie de plaisir.",
	  13: "Les combats sont éternels ! Bienvenue dans un monde sans fin !"
    },
    "victory": {
      1: "Hé, mais t’es trop fort !",
      2: "En vrai j’avais aucune chance hein ?",
      3: "J’te retrouverai un jour, et là j’te battrai !",
      4: "Arg… J’ai plus aucun Pokémon.",
      5: "Non… IMPOSSIBLE ! Pourquoi j’ai encore perdu…",
      6: "Non ! J’ai perdu !",
	  7: "Waah ! T’es trop incroyable ! J’suis bouche bée !",
      8: "Pourquoi… Comment… Pourtant on est les plus forts, mes Pokémon et moi…",
	  9: "J’perdrai pas la prochaine fois ! Remettons ça un jour !",
	  10: "Weeeesh ! Tu vois que j’suis qu’un gamin ? C'est pas juste de me bully comme ça !",
	  11: "Tes Pokémon sont trop incroyables !\n… P’tit échange ?",
	  12: "Je me suis fait un peu aider plus tôt, mais de quel taf je parlais ?",
	  13: "Ahaha ! Et voilà, ça y est !\nT'es déjà comme chez toi dans ce monde !"
    }
  },
  "lass": {
    "encounter": {
      1: "Let's have a battle, shall we?",
      2: "You look like a new trainer. Let's have a battle!",
      3: "I don't recognize you. How about a battle?",
      4: "Let's have a fun Pokémon battle!",
      5: "I'll show you the ropes of how to really use Pokémon!",
      6: "A serious battle starts from a serious beginning! Are you sure you're ready?",
      7: "You're only young once. And you only get one shot at a given battle. Soon, you'll be nothing but a memory.",
      8: "You'd better go easy on me, OK? Though I'll be seriously fighting!",
      9: "School is boring. I've got nothing to do. Yawn. I'm only battling to kill the time."
    },
    "victory": {
      1: "That was impressive! I've got a lot to learn.",
      2: "I didn't think you'd beat me that bad…",
      3: "I hope we get to have a rematch some day.",
      4: "That was pretty amazingly fun! You've totally exhausted me…",
      5: "You actually taught me a lesson! You're pretty amazing!",
      6: "Seriously, I lost. That is, like, seriously depressing, but you were seriously cool.",
      7: "I don't need memories like this. Deleting memory…",
      8: "Hey! I told you to go easy on me! Still, you're pretty cool when you're serious.",
      9: "I'm actually getting tired of battling… There's gotta be something new to do…"
    }
  },
  "breeder": {
    "encounter": {
      1: "Obedient Pokémon, selfish Pokémon… Pokémon have unique characteristics.",
      2: "Even though my upbringing and behavior are poor, I've raised my Pokémon well.",
      3: "Hmm, do you discipline your Pokémon? Pampering them too much is no good.",
    },
    "victory": {
      1: "It is important to nurture and train each Pokémon's characteristics.",
      2: "Unlike my diabolical self, these are some good Pokémon.",
      3: "Too much praise can spoil both Pokémon and people.",
    },
    "defeat": {
      1: "You should not get angry at your Pokémon, even if you lose a battle.",
      2: "Right? Pretty good Pokémon, huh? I'm suited to raising things.",
      3: "No matter how much you love your Pokémon, you still have to discipline them when they misbehave."
    }
  },
  "breeder_female": {
    "encounter": {
      1: "Pokémon never betray you. They return all the love you give them.",
      2: "Shall I give you a tip for training good Pokémon?",
      3: "I have raised these very special Pokémon using a special method."
    },
    "victory": {
      1: "Ugh… It wasn't supposed to be like this. Did I administer the wrong blend?",
      2: "How could that happen to my Pokémon… What are you feeding your Pokémon?",
      3: "If I lose, that tells you I was just killing time. It doesn't damage my ego at all."
    },
    "defeat": {
      1: "This proves my Pokémon have accepted my love.",
      2: "The real trick behind training good Pokémon is catching good Pokémon.",
      3: "Pokémon will be strong or weak depending on how you raise them."
    }
  },
  "fisherman": {
    "encounter": {
      1: "Aack! You made me lose a bite!\nWhat are you going to do about it?",
      2: "Go away! You're scaring the Pokémon!",
      3: "Let's see if you can reel in a victory!",
    },
    "victory": {
      1: "Just forget about it.",
      2: "Next time, I'll be reelin' in the triumph!",
      3: "Guess I underestimated the currents this time.",
    },
  },
  "fisherman_female": {
    "encounter": {
      1: "Woah! I've hooked a big one!",
      2: "Line's in, ready to reel in success!",
      3: "Ready to make waves!"
    },
    "victory": {
      1: "I'll be back with a stronger hook.",
      2: "I'll reel in victory next time.",
      3: "I'm just sharpening my hooks for the comeback!"
    },
  },
  "swimmer": {
    "encounter": {
      1: "Time to dive in!",
      2: "Let's ride the waves of victory!",
      3: "Ready to make a splash!",
    },
    "victory": {
      1: "Drenched in defeat!",
      2: "A wave of defeat!",
      3: "Back to shore, I guess.",
    },
  },
  "backpacker": {
    "encounter": {
      1: "Pack up, game on!",
      2: "Let's see if you can keep pace!",
      3: "Gear up, challenger!",
      4: "I've spent 20 years trying to find myself… But where am I?"
    },
    "victory": {
      1: "Tripped up this time!",
      2: "Oh, I think I'm lost.",
      3: "Dead end!",
      4: "Wait up a second! Hey! Don't you know who I am?"
    },
  },
  "ace_trainer": {
    "encounter": {
      1: "You seem quite confident.",
      2: "Your Pokémon… Show them to me…",
      3: "Because I'm an Ace Trainer, people think I'm strong.",
      4: "Are you aware of what it takes to be an Ace Trainer?"
    },
    "victory": {
      1: "Yes… You have good Pokémon…",
      2: "What?! But I'm a battling genius!",
      3: "Of course, you are the main character!",
      4: "OK! OK! You could be an Ace Trainer!"
    },
    "defeat": {
      1: "I am devoting my body and soul to Pokémon battles!",
      2: "All within my expectations… Nothing to be surprised about…",
      3: "I thought I'd grow up to be a frail person who looked like they would break if you squeezed them too hard.",
      4: "Of course I'm strong and don't lose. It's important that I win gracefully."
    }
  },
  "parasol_lady": {
    "encounter": {
      1: "Time to grace the battlefield with elegance and poise!",
    },
    "victory": {
      2: "My elegance remains unbroken!",
    }
  },
  "twins": {
    "encounter": {
      1: "Get ready, because when we team up, it's double the trouble!",
      2: "Two hearts, one strategy – let's see if you can keep up with our twin power!",
      3: "Hope you're ready for double trouble, because we're about to bring the heat!"
    },
    "victory": {
      1: "We may have lost this round, but our bond remains unbreakable!",
      2: "Our twin spirit won't be dimmed for long.",
      3: "We'll come back stronger as a dynamic duo!"
    },
    "defeat": {
      1: "Twin power reigns supreme!",
      2: "Two hearts, one triumph!",
      3: "Double the smiles, double the victory dance!"
    }
  },
  "cyclist": {
    "encounter": {
      1: "Get ready to eat my dust!",
      2: "Gear up, challenger! I'm about to leave you in the dust!",
      3: "Pedal to the metal, let's see if you can keep pace!"
    },
    "victory": {
      1: "Spokes may be still, but determination pedals on.",
      2: "Outpaced!",
      3: "The road to victory has many twists and turns yet to explore."
    },
  },
  "black_belt": {
    "encounter": {
      1: "I praise your courage in challenging me! For I am the one with the strongest kick!",
      2: "Oh, I see. Would you like to be cut to pieces? Or do you prefer the role of punching bag?"
    },
    "victory": {
      1: "Oh. The Pokémon did the fighting. My strong kick didn't help a bit.",
      2: "Hmmm… If I was going to lose anyway, I was hoping to get totally messed up in the process."
    },
  },
  "battle_girl": {
    "encounter": {
      1: "You don't have to try to impress me. You can lose against me.",
    },
    "victory": {
      1: "It's hard to say good-bye, but we are running out of time…",
    },
  },
  "hiker": {
    "encounter": {
      1: "My middle-age spread has given me as much gravitas as the mountains I hike!",
      2: "I inherited this big-boned body from my parents… I'm like a living mountain range…",
    },
    "victory": {
      1: "At least I cannot lose when it comes to BMI!",
      2: "It's not enough… It's never enough. My bad cholesterol isn't high enough…"
    },
  },
  "ranger": {
    "encounter": {
      1: "When I am surrounded by nature, most other things cease to matter.",
      2: "When I'm living without nature in my life, sometimes I'll suddenly feel an anxiety attack coming on."
    },
    "victory": {
      1: "It doesn't matter to the vastness of nature whether I win or lose…",
      2: "Something like this is pretty trivial compared to the stifling feelings of city life."
    },
    "defeat": {
      1: "I won the battle. But victory is nothing compared to the vastness of nature…",
      2: "I'm sure how you feel is not so bad if you compare it to my anxiety attacks…"
    }
  },
  "scientist": {
    "encounter": {
      1: "My research will lead this world to peace and joy.",
    },
    "victory": {
      1: "I am a genius… I am not supposed to lose against someone like you…",
    },
  },
  "school_kid": {
    "encounter": {
      1: "…Heehee. I'm confident in my calculations and analysis.",
      2: "I'm gaining as much experience as I can because I want to be a Gym Leader someday."
    },
    "victory": {
      1: "Ohhhh… Calculation and analysis are perhaps no match for chance…",
      2: "Even difficult, trying experiences have their purpose, I suppose."
    }
  },
  "artist": {
    "encounter": {
      1: "I used to be popular, but now I am all washed up.",
    },
    "victory": {
      1: "As times change, values also change. I realized that too late.",
    },
  },
  "guitarist": {
    "encounter": {
      1: "Get ready to feel the rhythm of defeat as I strum my way to victory!",
    },
    "victory": {
      1: "Silenced for now, but my melody of resilience will play on.",
    },
  },
  "worker": {
    "encounter": {
      1: "It bothers me that people always misunderstand me. I'm a lot more pure than everyone thinks.",
    },
    "victory": {
      1: "I really don't want my skin to burn, so I want to stay in the shade while I work.",
    },
  },
  "worker_female": {
    "encounter": {
      1: `It bothers me that people always misunderstand me. 
                $I'm a lot more pure than everyone thinks.`
    },
    "victory": {
      1: "I really don't want my skin to burn, so I want to stay in the shade while I work."
    },
    "defeat": {
      1: "My body and mind aren't necessarily always in sync."
    }
  },
  "worker_double": {
    "encounter": {
      1: "I'll show you we can break you. We've been training in the field!",
    },
    "victory": {
      1: "How strange… How could this be… I shouldn't have been outmuscled.",
    },
  },
  "hex_maniac": {
    "encounter": {
      1: "I normally only ever listen to classical music, but if I lose, I think I shall try a bit of new age!",
      2: "I grow stronger with each tear I cry."
    },
    "victory": {
      1: "Is this the dawning of the age of Aquarius?",
      2: "Now I can get even stronger. I grow with every grudge."
    },
    "defeat": {
      1: "New age simply refers to twentieth century classical composers, right?",
      2: "Don't get hung up on sadness or frustration. You can use your grudges to motivate yourself."
    }
  },
  "psychic": {
    "encounter": {
      1: "Hi! Focus!",
    },
    "victory": {
      1: "Eeeeek!",
    },
  },
  "officer": {
    "encounter": {
      1: "Brace yourself, because justice is about to be served!",
      2: "Ready to uphold the law and serve justice on the battlefield!"
    },
    "victory": {
      1: "The weight of justice feels heavier than ever…",
      2: "The shadows of defeat linger in the precinct."
    }
  },
  "beauty": {
    "encounter": {
      1: "My last ever battle… That's the way I'd like us to view this match…",
    },
    "victory": {
      1: "It's been fun… Let's have another last battle again someday…",
    },
  },
  "baker": {
    "encounter": {
      1: "Hope you're ready to taste defeat!"
    },
    "victory": {
      1: "I'll bake a comeback."
    },
  },
  "biker": {
    "encounter": {
      1: "Time to rev up and leave you in the dust!"
    },
    "victory": {
      1: "I'll tune up for the next race."
    },
  },
  "brock": {
    "encounter": {
      1: "My expertise on Rock-type Pokémon will take you down! Come on!",
      2: "My rock-hard willpower will overwhelm you!",
      3: "Allow me to show you the true strength of my Pokémon!"
    },
    "victory": {
      1: "Your Pokémon's strength have overcome my rock-hard defenses!",
      2: "The world is huge! I'm glad to have had a chance to battle you.",
      3: "Perhaps I should go back to pursuing my dream as a Pokémon Breeder…"
    },
    "defeat": {
      1: "The best offense is a good defense!\nThat's my way of doing things!",
      2: "Come study rocks with me next time to better learn how to fight them!",
      3: "Hah, all my traveling around the regions is paying off!"
    }
  },
  "misty": {
    "encounter": {
      1: "My policy is an all out offensive with Water-type Pokémon!",
      2: "Hiya, I'll show you the strength of my aquatic Pokémon!",
      3: "My dream was to go on a journey and battle powerful trainers…\nWill you be a sufficient challenge?"
    },
    "victory": {
      1: "You really are strong… I'll admit that you are skilled…",
      2: "Grrr… You know you just got lucky, right?!",
      3: "Wow, you're too much! I can't believe you beat me!"
    },
    "defeat": {
      1: "Was the mighty Misty too much for you?",
      2: "I hope you saw my Pokémon's elegant swimming techniques!",
      3: "Your Pokémon were no match for my pride and joys!"
    }
  },
  "lt_surge": {
    "encounter": {
      1: "My Electric Pokémon saved me during the war! I'll show you how!",
      2: "Ten-hut! I'll shock you into surrender!",
      3: "I'll zap you just like I do to all my enemies in battle!"
    },
    "victory": {
      1: "Whoa! Your team's the real deal, kid!",
      2: "Aaargh, you're strong! Even my electric tricks lost against you.",
      3: "That was an absolutely shocking loss!"
    },
    "defeat": {
      1: "Oh yeah! When it comes to Electric-type Pokémon, I'm number one in the world!",
      2: "Hahaha! That was an electrifying battle, kid!",
      3: "A Pokémon battle is war, and I have showed you first-hand combat!"
    }
  },
  "erika": {
    "encounter": {
      1: "Ah, the weather is lovely here…\nOh, a battle? Very well then.",
      2: "My Pokémon battling skills rival that of my flower arranging skills.",
      3: "Oh, I hope the pleasant aroma of my Pokémon doesn't put me to sleep again…",
      4: "Seeing flowers in a garden is so soothing."
    },
    "victory": {
      1: "Oh! I concede defeat.",
      2: "That match was most delightful.",
      3: "Ah, it appears it is my loss…",
      4: "Oh, my goodness."
    },
    "defeat": {
      1: "I was afraid I would doze off…",
      2: "Oh my, it seems my Grass Pokémon overwhelmed you.",
      3: "That battle was such a soothing experience.",
      4: "Oh… Is that all?"
    }
  },
  "janine": {
    "encounter": {
      1: "I am mastering the art of poisonous attacks.\nI shall spar with you today!",
      2: "Father trusts that I can hold my own.\nI will prove him right!",
      3: "My ninja techniques are only second to my Father's!\nCan you keep up?"
    },
    "victory": {
      1: "Even now, I still need training… I understand.",
      2: "Your battle technique has outmatched mine.",
      3: "I'm going to really apply myself and improve my skills."
    },
    "defeat": {
      1: "Fufufu… the poison has sapped all your strength to battle.",
      2: "Ha! You didn't stand a chance against my superior ninja skills!",
      3: "Father's faith in me has proven to not be misplaced."
    }
  },
  "sabrina": {
    "encounter": {
      1: "Through my psychic ability, I had a vision of your arrival!",
      2: "I dislike fighting, but if you wish, I will show you my powers!",
      3: "I can sense great ambition in you. I shall see if it not unfounded."
    },
    "victory": {
      1: "Your power… It far exceeds what I foresaw…",
      2: "I failed to accurately predict your power.",
      3: "Even with my immense psychic powers, I cannot sense another as strong as you."
    },
    "defeat": {
      1: "This victory… It is exactly as I foresaw in my visions!",
      2: "Perhaps it was another I sensed a great desire in…",
      3: "Hone your abilities before recklessly charging into battle.\nYou never know what the future may hold if you do…"
    }
  },
  "blaine": {
    "encounter": {
      1: "Hah! Hope you brought a Burn Heal!",
      2: "My fiery Pokémon will incinerate all challengers!",
      3: "Get ready to play with fire!"
    },
    "victory": {
      1: "I have burned down to nothing! Not even ashes remain!",
      2: "Didn't I stoke the flames high enough?",
      3: "I'm all burned out… But this makes my motivation to improve burn even hotter!"
    },
    "defeat": {
      1: "My raging inferno cannot be quelled!",
      2: "My Pokémon have been powered up with the heat from this victory!",
      3: "Hah! My passion burns brighter than yours!"
    }
  },
  "giovanni": {
    "encounter": {
      1: "I, the leader of Team Rocket, will make you feel a world of pain!",
      2: "My training here will be vital before I am to face my old associates again.",
      3: "I do not think you are prepared for the level of failure you are about to experience!"
    },
    "victory": {
      1: "WHAT! Me, lose?! There is nothing I wish to say to you!",
      2: "Hmph… You could never understand what I hope to achieve.",
      3: "This defeat is merely delaying the inevitable.\nI will rise Team Rocket from the ashes in due time."
    },
    "defeat": {
      1: "Not being able to measure your own strength shows that you are still but a child.",
      2: "Do not try to interfere with me again.",
      3: "I hope you understand how foolish challenging me was."
    }
  },
  "roxanne": {
    "encounter": {
      1: "Would you kindly demonstrate how you battle?",
      2: "You can learn many things by battling many trainers.",
      3: "Oh, you caught me strategizing.\nWould you like to battle?"
    },
    "victory": {
      1: "Oh, I appear to have lost.\nI understand.",
      2: "It seems that I still have so much more to learn when it comes to battle.",
      3: "I'll take what I learned here today to heart."
    },
    "defeat": {
      1: "I have learned many things from our battle.\nI hope you have too.",
      2: "I look forward to battling you again.\nI hope you'll use what you've learned here.",
      3: "I won due to everything I have learned."
    }
  },
  "brawly": {
    "encounter": {
      1: "Oh man, a challenger!\nLet's see what you can do!",
      2: "You seem like a big splash.\nLet's battle!",
      3: "Time to create a storm!\nLet's go!"
    },
    "victory": {
      1: "Oh woah, you've washed me out!",
      2: "You surfed my wave and crashed me down!",
      3: "I feel like I'm lost in Granite Cave!"
    },
    "defeat": {
      1: "Haha, I surfed the big wave!\nChallenge me again sometime.",
      2: "Surf with me again some time!",
      3: "Just like the tides come in and out, I hope you return to challenge me again."
    }
  },
  "wattson": {
    "encounter": {
      1: "Time to get shocked!\nWahahahaha!",
      2: "I'll make sparks fly!\nWahahahaha!",
      3: "I hope you brought Paralyz Heal!\nWahahahaha!"
    },
    "victory": {
      1: "Seems like I'm out of charge!\nWahahahaha!",
      2: "You've completely grounded me!\nWahahahaha!",
      3: "Thanks for the thrill!\nWahahahaha!"
    },
    "defeat": {
      1: "Recharge your batteries and challenge me again sometime!\nWahahahaha!",
      2: "I hope you found our battle electrifying!\nWahahahaha!",
      3: "Aren't you shocked I won?\nWahahahaha!"
    }
  },
  "flannery": {
    "encounter": {
      1: "Nice to meet you! Wait, no…\nI will crush you!",
      2: "I've only been a leader for a little while, but I'll smoke you!",
      3: "It's time to demonstrate the moves my grandfather has taught me! Let's battle!"
    },
    "victory": {
      1: "You remind me of my grandfather…\nNo wonder I lost.",
      2: "Am I trying too hard?\nI should relax, can't get too heated.",
      3: "Losing isn't going to smother me out.\nTime to reignite training!"
    },
    "defeat": {
      1: "I hope I've made my grandfather proud…\nLet's battle again some time.",
      2: "I…I can't believe I won!\nDoing things my way worked!",
      3: "Let's exchange burning hot moves again soon!"
    }
  },
  "norman": {
    "encounter": {
      1: "I'm surprised you managed to get here.\nLet's battle.",
      2: "I'll do everything in my power as a Gym Leader to win.\nLet's go!",
      3: "You better give this your all.\nIt's time to battle!"
    },
    "victory": {
      1: "I lost to you…?\nRules are rules, though.",
      2: "Was moving from Olivine a mistake…?",
      3: "I can't believe it.\nThat was a great match."
    },
    "defeat": {
      1: "We both tried our best.\nI hope we can battle again soon.",
      2: "You should try challenging my kid instead.\nYou might learn something!",
      3: "Thank you for the excellent battle.\nBetter luck next time."
    }
  },
  "winona": {
    "encounter": {
      1: "I've been soaring the skies looking for prey…\nAnd you're my target!",
      2: "No matter how our battle is, my Flying Pokémon and I will triumph with grace. Let's battle!",
      3: "I hope you aren't scared of heights.\nLet's ascend!"
    },
    "victory": {
      1: "You're the first Trainer I've seen with more grace than I.\nExcellently played.",
      2: "Oh, my Flying Pokémon have plummeted!\nVery well.",
      3: "Though I may have fallen, my Pokémon will continue to fly!"
    },
    "defeat": {
      1: "My Flying Pokémon and I will forever dance elegantly!",
      2: "I hope you enjoyed our show.\nOur graceful dance is finished.",
      3: "Won't you come see our elegant choreography again?"
    }
  },
  "tate": {
    "encounter": {
      1: "Hehehe…\nWere you surprised to see me without my sister?",
      2: "I can see what you're thinking…\nYou want to battle!",
      3: "How can you defeat someone…\nWho knows your every move?"
    },
    "victory": {
      1: "It can't be helped…\nI miss Liza…",
      2: "Your bond with your Pokémon was stronger than mine.",
      3: "If I were with Liza, we would have won.\nWe can finish each other's thoughts!"
    },
    "defeat": {
      1: "My Pokémon and I are superior!",
      2: "If you can't even defeat me, you'll never be able to defeat Liza either.",
      3: "It's all thanks to my strict training with Liza.\nI can make myself one with Pokémon."
    }
  },
  "liza": {
    "encounter": {
      1: "Fufufu…\nWere you surprised to see me without my brother?",
      2: "I can determine what you desire…\nYou want to battle, don't you?",
      3: "How can you defeat someone…\nWho's one with their Pokémon?"
    },
    "victory": {
      1: "It can't be helped…\nI miss Tate…",
      2: "Your bond with your Pokémon…\nIt's stronger than mine.",
      3: "If I were with Tate, we would have won.\nWe can finish each other's sentences!"
    },
    "defeat": {
      1: "My Pokémon and I are victorious.",
      2: "If you can't even defeat me, you'll never be able to defeat Tate either.",
      3: "It's all thanks to my strict training with Tate.\nI can synchronize myself with my Pokémon."
    }
  },
  "juan": {
    "encounter": {
      1: "Now's not the time to act coy.\nLet's battle!",
      2: "Ahahaha, You'll be witness to my artistry with Water Pokémon!",
      3: "A typhoon approaches!\nWill you be able to test me?",
      4: "Please, you shall bear witness to our artistry.\nA grand illusion of water sculpted by my Pokémon and myself!"
    },
    "victory": {
      1: "You may be a genius who can take on Wallace!",
      2: "I focused on elegance while you trained.\nIt's only natural that you defeated me.",
      3: "Ahahaha!\nVery well, You have won this time.",
      4: "From you, I sense the brilliant shine of skill that will overcome all."
    },
    "defeat": {
      1: "My Pokémon and I have sculpted an illusion of Water and come out victorious.",
      2: "Ahahaha, I have won, and you have lost.",
      3: "Shall I loan you my outfit? It may help you battle!\nAhahaha, I jest!",
      4: "I'm the winner! Which is to say, you lost."
    }
  },
  "crasher_wake": {
    "encounter": {
      1: "Crash! Crash! Watch out!\nCrasher Wake…is…heeere!",
      2: "Crash! Crash! Crasher Wake!",
      3: "I'm the tidal wave of power to wash you away!"
    },
    "victory": {
      1: "That puts a grin on my face!\nGuhahaha! That was a blast!",
      2: "Hunwah! It's gone and ended!\nHow will I say this…\nI want more! I wanted to battle a lot more!",
      3: "WHAAAAT!?"
    },
    "defeat": {
      1: "Yeeeeah! That's right!",
      2: "I won, but I want more! I wanted to battle a lot more!",
      3: "So long!"
    }
  },
  "falkner": {
    "encounter": {
      1: "I'll show you the real power of the magnificent bird Pokémon!",
      2: "Winds, stay with me!",
      3: "Dad! I hope you're watching me battle from above!"
    },
    "victory": {
      1: "I understand… I'll bow out gracefully.",
      2: "A defeat is a defeat. You are strong indeed.",
      3: "…Shoot! Yeah, I lost."
    },
    "defeat": {
      1: "Dad! I won with your cherished bird Pokémon…",
      2: "Bird Pokémon are the best after all!",
      3: "Feels like I'm catching up to my dad!"
    }
  },
  "nessa": {
    "encounter": {
      1: "No matter what kind of plan your refined mind may be plotting, my partner and I will be sure to sink it.",
      2: "I'm not here to chat. I'm here to win!",
      3: "This is a little gift from my Pokémon… I hope you can take it!"
    },
    "victory": {
      1: "You and your Pokémon are just too much…",
      2: "How…? How can this be?!",
      3: "I was totally washed away!"
    },
    "defeat": {
      1: "The raging wave crashes again!",
      2: "Time to ride the wave of victory!",
      3: "Ehehe!"
    }
  },
  "melony": {
    "encounter": {
      1: "I'm not going to hold back!",
      2: "All righty, I suppose we should get started.",
      3: "I'll freeze you solid!"
    },
    "victory": {
      1: "You… You're pretty good, huh?",
      2: "If you find Gordie around, be sure to give him a right trashing, would you?",
      3: "I think you took breaking the ice a little too literally…"
    },
    "defeat": {
      1: "Now do you see how severe battles can be?",
      2: "Hee! Looks like I went and won again!",
      3: "Are you holding back?"
    }
  },
  "marlon": {
    "encounter": {
      1: "You look strong! Shoots! Let's start!",
      2: "I'm strong like the ocean's wide. You're gonna get swept away, fo' sho'.",
      3: "Oh ho, so I'm facing you! That's off the wall."
    },
    "victory": {
      1: "You totally rocked that! You're raising some wicked Pokémon. You got this Trainer thing down!",
      2: "You don't just look strong, you're strong fo' reals! Eh, I was swept away, too!",
      3: "You're strong as a gnarly wave!"
    },
    "defeat": {
      1: "You're tough, but it's not enough to sway the sea, 'K!",
      2: "Hee! Looks like I went and won again!",
      3: "Sweet, sweet victory!"
    }
  },
  "shauntal": {
    "encounter": {
      1: "Excuse me. You're a challenger, right?\nI'm the Elite Four's Ghost-type Pokémon user, Shauntal, and I shall be your opponent.",
      2: "I absolutely love writing about Trainers who come here and the Pokémon they train.\nCould I use you and your Pokémon as a subject?",
      3: "Every person who works with Pokémon has a story to tell.\nWhat story is about to be told?"
    },
    "victory": {
      1: "Wow. I'm dumbstruck!",
      2: "S-sorry! First, I must apologize to my Pokémon…\n\nI'm really sorry you had a bad experience because of me!",
      3: "Even in light of that, I'm still one of the Elite Four!"
    },
    "defeat": {
      1: "Eheh.",
      2: "That gave me excellent material for my next novel!",
      3: "And so, another tale ends…"
    }
  },
  "marshal": {
    "encounter": {
      1: "My mentor, Alder, sees your potential as a Trainer and is taking an interest in you.\nIt is my intention to test you--to take you to the limits of your strength. Kiai!",
      2: "Victory, decisive victory, is my intention! Challenger, here I come!",
      3: "In myself, I seek to develop the strength of a fighter and shatter any weakness in myself!\nPrevailing with the force of my convictions!"
    },
    "victory": {
      1: "Whew! Well done!",
      2: "As your battles continue, aim for even greater heights!",
      3: "The strength shown by you and your Pokémon has deeply impressed me…"
    },
    "defeat": {
      1: "Hmm.",
      2: "That was good battle.",
      3: "Haaah! Haaah! Haiyaaaah!"
    }
  },
  "cheren": {
    "encounter": {
      1: "You remind me of an old friend. That makes me excited about this Pokémon battle!",
      2: `Pokémon battles have no meaning if you don't think why you battle. 
      $Or better said, it makes battling together with Pokémon meaningless.`,
      3: "My name's Cheren! I'm a Gym Leader and a teacher! Pleasure to meet you."
    },
    "victory": {
      1: "Thank you! I saw what was missing in me.",
      2: "Thank you! I feel like I saw a little of the way toward my ideals.",
      3: "Hmm… This is problematic."
    },
    "defeat": {
      1: "As a Gym Leader, I aim to be a wall for you to overcome.",
      2: "All right!",
      3: "I made it where I am because Pokémon were by my side.\nPerhaps we need to think about why Pokémon help us not in terms of Pokémon and Trainers but as a relationship between living beings."
    }
  },
  "chili": {
    "encounter": {
      1: "Yeeeeooow! Time to play with FIRE!! I'm the strongest of us brothers!",
      2: "Ta-da! The Fire-type scorcher Chili--that's me--will be your opponent!",
      3: "I'm going to show you what me and my blazing Fire types can do!"
    },
    "victory": {
      1: "You got me. I am… burned… out…",
      2: "Whoa ho! You're on fire!",
      3: "Augh! You got me!"
    },
    "defeat": {
      1: "I'm on fire! Play with me, and you'll get burned!",
      2: "When you play with fire, you get burned!",
      3: "I mean, c'mon, your opponent was me! You didn't have a chance!"
    }
  },
  "cilan": {
    "encounter": {
      1: `Nothing personal... No hard feelings... Me and my Grass-type Pokémon will...
               $Um... We're gonna battle come what may.`,
      2: "So, um, if you're OK with me, I'll, um, put everything I've got into being, er, you know, your opponent.",
      3: "OK… So, um, I'm Cilan, I like Grass-type Pokémon."
    },
    "victory": {
      1: "Er… Is it over now?",
      2: `…What a surprise. You are very strong, aren't you? 
               $I guess my brothers wouldn't have been able to defeat you either…`,
      3: "…Huh. Looks like my timing was, um, off?"
    },
    "defeat": {
      1: "Huh? Did I win?",
      2: `I guess… 
                $I suppose I won, because I've been competing with my brothers Chili and Cress, and we all were able to get tougher.`,
      3: "It…it was quite a thrilling experience…"
    }
  },
  "roark": {
    "encounter": {
      1: "I need to see your potential as a Trainer. And, I'll need to see the toughness of the Pokémon that battle with you!",
      2: "Here goes! These are my rocking Pokémon, my pride and joy!",
      3: "Rock-type Pokémon are simply the best!",
      4: "I need to see your potential as a Trainer. And, I'll need to see the toughness of the Pokémon that battle with you!"
    },
    "victory": {
      1: "W-what? That can't be! My buffed-up Pokémon!",
      2: "…We lost control there. Next time I'd like to challenge you to a Fossil-digging race underground.",
      3: "With skill like yours, it's natural for you to win.",
      4: "Wh-what?! It can't be! Even that wasn't enough?",
      5: "I blew it."
    },
    "defeat": {
      1: "See? I'm proud of my rocking battle style!",
      2: "Thanks! The battle gave me confidence that I may be able to beat my dad!",
      3: "I feel like I just smashed through a really stubborn boulder!"
    }
  },
  "morty": {
    "encounter": {
      1: `With a little more, I could see a future in which I meet the legendary Pokémon.
                $You're going to help me reach that level!`,
      2: `It's said that a rainbow-hued Pokémon will come down to appear before a truly powerful Trainer. 
                $I believed that tale, so I have secretly trained here all my life. As a result, I can now see what others cannot. 
                $I see a shadow of the person who will make the Pokémon appear. 
                $I believe that person is me! You're going to help me reach that level!`,
      3: "Whether you choose to believe or not, mystic power does exist.",
      4: "You can bear witness to the fruits of my training.",
      5: "You must make your soul one with that of Pokémon. Can you do this?",
      6: "Say, do you want to be part of my training?"
    },
    "victory": {
      1: "I'm not good enough yet…",
      2: `I see… Your journey has taken you to far-away places and you have witnessed much more than I.
                $I envy you for that…`,
      3: "How is this possible…",
      4: `I don't think our potentials are so different.
                $But you seem to have something more than that… So be it.`,
      5: "Guess I need more training.",
      6: "That's a shame."
    },
    "defeat": {
      1: "I moved… one step ahead again.",
      2: "Fufufu…",
      3: "Wh-what?! It can't be! Even that wasn't enough?",
      4: "I feel like I just smashed through a really stubborn boulder!",
      5: "Ahahahah!",
      6: "I knew I would win!"
    }
  },
  "crispin": {
    "encounter": {
      1: "I wanna win, so that's exactly what I'll do!",
      2: "I battle because I wanna battle! And you know what? That's how it should be!"
    },
    "victory": {
      1: "I wanted to win…but I lost!",
      2: "I lost…'cause I couldn't win!"
    },
    "defeat": {
      1: "Hey, wait a sec. Did I just win? I think I just won! Talk about satisfying!",
      2: "Wooo! That was amazing!"
    }
  },
  "amarys": {
    "encounter": {
      1: `I want to be the one to help a certain person. That being the case, I cannot afford to lose.
                $… Our battle starts now.`,
    },
    "victory": {
      1: "I am… not enough, I see."
    },
    "defeat": {
      1: "Victory belongs to me. Well fought."
    }
  },
  "lacey": {
    "encounter": {
      1: "I'll be facing you with my usual party as a member of the Elite Four."
    },
    "victory": {
      1: "That was a great battle!"
    },
    "defeat": {
      1: "Let's give your Pokémon a nice round of applause for their efforts!"
    }
  },
  "drayton": {
    "encounter": {
      1: `Man, I love chairs. Don't you love chairs? What lifesavers. 
                $I don't get why everyone doesn't just sit all the time. Standing up's tiring work!`,
    },
    "victory": {
      1: "Guess I should've expected that!"
    },
    "defeat": {
      1: "Heh heh! Don't mind me, just scooping up a W over here. I get it if you're upset, but don't go full Kieran on me, OK?"
    }
  },
  "ramos": {
    "encounter": {
      1: `Did yeh enjoy the garden playground I made with all these sturdy plants o' mine?
                $Their strength is a sign o' my strength as a gardener and a Gym Leader! Yeh sure yer up to facing all that?`,
    },
    "victory": {
      1: "Yeh believe in yer Pokémon… And they believe in yeh, too… It was a fine battle, sprout."
    },
    "defeat": {
      1: "Hohoho… Indeed. Frail little blades o' grass'll break through even concrete."
    }
  },
  "viola": {
    "encounter": {
      1: `Whether it's the tears of frustration that follow a loss or the blossoming of joy that comes with victory…
                $They're both great subjects for my camera! Fantastic! This'll be just fantastic! 
                $Now come at me!`,
      2: "My lens is always focused on victory--I won't let anything ruin this shot!"
    },
    "victory": {
      1: "You and your Pokémon have shown me a whole new depth of field! Fantastic! Just fantastic!",
      2: `The world you see through a lens, and the world you see with a Pokémon by your side…
                $The same world can look entirely different depending on your view.`
    },
    "defeat": {
      1: "The photo from the moment of my victory will be a real winner, all right!",
      2: "Yes! I took some great photos!"
    }
  },
  "candice": {
    "encounter": {
      1: `You want to challenge Candice? Sure thing! I was waiting for someone tough! 
                $But I should tell you, I'm tough because I know how to focus.`,
      2: `Pokémon, fashion, romance… It's all about focus! 
                $I'll show you just what I mean. Get ready to lose!`
    },
    "victory": {
      1: "I must say, I'm warmed up to you! I might even admire you a little.",
      2: `Wow! You're great! You've earned my respect! 
                $I think your focus and will bowled us over totally. `
    },
    "defeat": {
      1: "I sensed your will to win, but I don't lose!",
      2: "See? Candice's focus! My Pokémon's focus is great, too!"
    }
  },
  "gardenia": {
    "encounter": {
      1: "You have a winning aura about you. So, anyway, this will be fun. Let's have our battle!"
    },
    "victory": {
      1: "Amazing! You're very good, aren't you?"
    },
    "defeat": {
      1: "Yes! My Pokémon and I are perfectly good!"
    }
  },
  "aaron": {
    "encounter": {
      1: "Ok! Let me take you on!"
    },
    "victory": {
      1: "Battling is a deep and complex affair…"
    },
    "defeat": {
      1: "Victory over an Elite Four member doesn't come easily."
    }
  },
  "cress": {
    "encounter": {
      1: "That is correct! It shall be I and my esteemed Water types that you must face in battle!"
    },
    "victory": {
      1: "Lose? Me? I don't believe this."
    },
    "defeat": {
      1: "This is the appropriate result when I'm your opponent."
    }
  },
  "allister": {
    "encounter": {
      1: "'M Allister.\nH-here… I go…"
    },
    "victory": {
      1: `I nearly lost my mask from the shock… That was…
                $Wow. I can see your skill for what it is.`,
    },
    "defeat": {
      1: "Th-that was ace!"
    }
  },
  "clay": {
    "encounter": {
      1: "Harrumph! Kept me waitin', didn't ya, kid? All right, time to see what ya can do!"
    },
    "victory": {
      1: "Man oh man… It feels good to go all out and still be defeated!"
    },
    "defeat": {
      1: `What's important is how ya react to losin'. 
                $That's why folks who use losin' as fuel to get better are tough.`,
    }
  },
  "kofu": {
    "encounter": {
      1: "I'mma serve you a full course o' Water-type Pokémon! Don't try to eat 'em, though!"
    },
    "victory": {
      1: "Vaultin' Veluza! Yer a lively one, aren't ya! A little TOO lively, if I do say so myself!"
    },
    "defeat": {
      1: "You come back to see me again now, ya hear?"
    }
  },
  "tulip": {
    "encounter": {
      1: "Allow me to put my skills to use to make your cute little Pokémon even more beautiful!"
    },
    "victory": {
      1: "Your strength has a magic to it that cannot be washed away."
    },
    "defeat": {
      1: "You know, in my line of work, people who lack talent in one area or the other often fade away quickly—never to be heard of again."
    }
  },
  "sidney": {
    "encounter": {
      1: `I like that look you're giving me. I guess you'll give me a good match.
                $That's good! Looking real good! All right!
                $You and me, let's enjoy a battle that can only be staged here!`,
    },
    "victory": {
      1: "Well, how do you like that? I lost! Eh, it was fun, so it doesn't matter."
    },
    "defeat": {
      1: "No hard feelings, alright?"
    }
  },
  "phoebe": {
    "encounter": {
      1: `While I trained, I gained the ability to commune with Ghost-type Pokémon. 
                $Yes, the bond I developed with Pokémon is extremely tight. 
                $So, come on, just try and see if you can even inflict damage on my Pokémon!`,
    },
    "victory": {
      1: "Oh, darn. I've gone and lost."
    },
    "defeat": {
      1: "I look forward to battling you again sometime!"
    }
  },
  "glacia": {
    "encounter": {
      1: `All I have seen are challenges by weak Trainers and their Pokémon. 
                $What about you? It would please me to no end if I could go all out against you!`,
    },
    "victory": {
      1: `You and your Pokémon… How hot your spirits burn!
                $The all-consuming heat overwhelms. 
                $It's no surprise that my icy skills failed to harm you.`,
    },
    "defeat": {
      1: "A fiercely passionate battle, indeed."
    }
  },
  "drake": {
    "encounter": {
      1: `For us to battle with Pokémon as partners, do you know what it takes? Do you know what is needed? 
                $If you don't, then you will never prevail over me!`,
    },
    "victory": {
      1: "Superb, it should be said."
    },
    "defeat": {
      1: "I gave my all for that battle!"
    }
  },
  "wallace": {
    "encounter": {
      1: `There's something about you… A difference in your demeanor. 
                $I think I sense that in you. Now, show me. Show me the power you wield with your Pokémon. 
                $And I, in turn, shall present you with a performance of illusions in water by me and my Pokémon!`,
    },
    "victory": {
      1: `Bravo. I realize now your authenticity and magnificence as a Pokémon Trainer. 
                    $I find much joy in having met you and your Pokémon. You have proven yourself worthy.`,
    },
    "defeat": {
      1: "A grand illusion!"
    }
  },
  "lorelei": {
    "encounter": {
      1: `No one can best me when it comes to icy Pokémon! Freezing moves are powerful!
                $Your Pokémon will be at my mercy when they are frozen solid! Hahaha! Are you ready?`,
    },
    "victory": {
      1: "How dare you!"
    },
    "defeat": {
      1: "There's nothing you can do once you're frozen."
    }
  },
  "will": {
    "encounter": {
      1: `I have trained all around the world, making my psychic Pokémon powerful.
                $I can only keep getting better! Losing is not an option!`,
    },
    "victory": {
      1: "I… I can't… believe it…"
    },
    "defeat": {
      1: "That was close. I wonder what it is that you lack."
    }
  },
  "malva": {
    "encounter": {
      1: `I feel like my heart might just burst into flames. 
                $I'm burning up with my hatred for you, runt!`,
    },
    "victory": {
      1: "What news… So a new challenger has defeated Malva!"
    },
    "defeat": {
      1: "I am delighted! Yes, delighted that I could squash you beneath my heel."
    }
  },
  "hala": {
    "encounter": {
      1: "Old Hala is here to make you holler!"
    },
    "victory": {
      1: "I could feel the power you gained on your journey."
    },
    "defeat": {
      1: "Haha! What a delightful battle!"
    }
  },
  "molayne": {
    "encounter": {
      1: `I gave the captain position to my cousin Sophocles, but I'm confident in my ability. 
                $My strength is like that of a supernova!`,
    },
    "victory": {
      1: "I certainly found an interesting Trainer to face!"
    },
    "defeat": {
      1: "Ahaha. What an interesting battle."
    }
  },
  "rika": {
    "encounter": {
      1: "I'd say I'll go easy on you, but… I'd be lying! Think fast!"
    },
    "victory": {
      1: "Not bad, kiddo."
    },
    "defeat": {
      1: "Nahahaha! You really are something else, kiddo!"
    }
  },
  "bruno": {
    "encounter": {
      1: "We will grind you down with our superior power! Hoo hah!"
    },
    "victory": {
      1: "Why? How could I lose?"
    },
    "defeat": {
      1: "You can challenge me all you like, but the results will never change!"
    }
  },
  "bugsy": {
    "encounter": {
      1: `Whoa, amazing! You're an expert on Pokémon! 
                $My research isn't complete yet. OK, you win.`,
    },
    "victory": {
      1: "Whoa, amazing! You're an expert on Pokémon!\nMy research isn't complete yet. OK, you win."
    },
    "defeat": {
      1: "Thanks! Thanks to our battle, I was also able to make progress in my research!"
    }
  },
  "koga": {
    "encounter": {
      1: "Fwahahahaha! Pokémon are not merely about brute force--you shall see soon enough!"
    },
    "victory": {
      1: "Ah! You've proven your worth!"
    },
    "defeat": {
      1: "Have you learned to fear the techniques of the ninja?"
    }
  },
  "bertha": {
    "encounter": {
      1: "Well, would you show this old lady how much you've learned?"
    },
    "victory": {
      1: `Well! Dear child, I must say, that was most impressive. 
                $Your Pokémon believed in you and did their best to earn you the win. 
                $Even though I've lost, I find myself with this silly grin!`,
    },
    "defeat": {
      1: "Hahahahah! Looks like this old lady won!"
    }
  },
  "lenora": {
    "encounter": {
      1: "Well then, challenger, I'm going to research how you battle with the Pokémon you've so lovingly raised!"
    },
    "victory": {
      1: "My theory about you was correct. You're more than just talented… You're motivated! I salute you!"
    },
    "defeat": {
      1: "Ah ha ha! If you lose, make sure to analyze why, and use that knowledge in your next battle!"
    }
  },
  "siebold": {
    "encounter": {
      1: "As long as I am alive, I shall strive onward to seek the ultimate cuisine... and the strongest opponents in battle!"
    },
    "victory": {
      1: "I shall store my memory of you and your Pokémon forever away within my heart."
    },
    "defeat": {
      1: `Our Pokémon battle was like food for my soul. It shall keep me going. 
                $That is how I will pay my respects to you for giving your all in battle!`,
    }
  },
  "roxie": {
    "encounter": {
      1: "Get ready! I'm gonna knock some sense outta ya!"
    },
    "victory": {
      1: "Wild! Your reason's already more toxic than mine!"
    },
    "defeat": {
      1: "Hey, c'mon! Get serious! You gotta put more out there!"
    }
  },
  "olivia": {
    "encounter": {
      1: "No introduction needed here. Time to battle me, Olivia!"
    },
    "victory": {
      1: "Really lovely… Both you and your Pokémon…"
    },
    "defeat": {
      1: "Mmm-hmm."
    }
  },
  "poppy": {
    "encounter": {
      1: "Oooh! Do you wanna have a Pokémon battle with me?"
    },
    "victory": {
      1: "Uagh?! Mmmuuuggghhh…"
    },
    "defeat": {
      1: `Yaaay! I did it! I de-feet-ed you! You can come for… For… An avenge match? 
                $Come for an avenge match anytime you want!`,
    }
  },
  "agatha": {
    "encounter": {
      1: "Pokémon are for battling! I'll show you how a real Trainer battles!"
    },
    "victory": {
      1: "Oh my! You're something special, child!"
    },
    "defeat": {
      1: "Bahaha. That's how a proper battle's done!"
    }
  },
  "flint": {
    "encounter": {
      1: "Hope you're warmed up, cause here comes the Big Bang!"
    },
    "victory": {
      1: "Incredible! Your moves are so hot, they make mine look lukewarm!"
    },
    "defeat": {
      1: "Huh? Is that it? I think you need a bit more passion."
    }
  },
  "grimsley": {
    "encounter": {
      1: "The winner takes everything, and there's nothing left for the loser."
    },
    "victory": {
      1: "When one loses, they lose everything… The next thing I'll look for will be victory, too!"
    },
    "defeat": {
      1: "If somebody wins, the person who fought against that person will lose."
    }
  },
  "caitlin": {
    "encounter": {
      1: `It's me who appeared when the flower opened up. You who have been waiting…
                $You look like a Pokémon Trainer with refined strength and deepened kindness. 
                $What I look for in my opponent is superb strength… 
                $Please unleash your power to the fullest!`,
    },
    "victory": {
      1: "My Pokémon and I learned so much! I offer you my thanks."
    },
    "defeat": {
      1: "I aspire to claim victory with elegance and grace."
    }
  },
  "diantha": {
    "encounter": {
      1: `Battling against you and your Pokémon, all of you brimming with hope for the future… 
                $Honestly, it just fills me up with energy I need to keep facing each new day! It does!`,
    },
    "victory": {
      1: "Witnessing the noble spirits of you and your Pokémon in battle has really touched my heart…"
    },
    "defeat": {
      1: "Oh, fantastic! What did you think? My team was pretty cool, right?"
    }
  },
  "wikstrom": {
    "encounter": {
      1: `Well met, young challenger! Verily am I the famed blade of hardened steel, Duke Wikstrom! 
                $Let the battle begin! En garde!`,
    },
    "victory": {
      1: "Glorious! The trust that you share with your honorable Pokémon surpasses even mine!"
    },
    "defeat": {
      1: `What manner of magic is this? My heart, it doth hammer ceaselessly in my breast! 
                $Winning against such a worthy opponent doth give my soul wings--thus do I soar!`,
    }
  },
  "acerola": {
    "encounter": {
      1: "Battling is just plain fun! Come on, I can take you!"
    },
    "victory": {
      1: "I'm… I'm speechless! How did you do it?!"
    },
    "defeat": {
      1: "Ehaha! What an amazing victory!"
    }
  },
  "larry_elite": {
    "encounter": {
      1: `Hello there… It's me, Larry.
                $I serve as a member of the Elite Four too, yes… Unfortunately for me.`,
    },
    "victory": {
      1: "Well, that took the wind from under our wings…"
    },
    "defeat": {
      1: "It's time for a meeting with the boss."
    }
  },
  "lance": {
    "encounter": {
      1: "I've been waiting for you. Allow me to test your skill.",
      2: "I thought that you would be able to get this far. Let's get this started."
    },
    "victory": {
      1: "You got me. You are magnificent!",
      2: "I never expected another trainer to beat me… I'm surprised."
    },
    "defeat": {
      1: "That was close. Want to try again?",
      2: "It's not that you are weak. Don't let it bother you."
    }
  },
  "karen": {
    "encounter": {
      1: "I am Karen. Would you care for a showdown with my Dark-type Pokémon?",
      2: "I am unlike those you've already met.",
      3: "You've assembled a charming team. Our battle should be a good one."
    },
    "victory": {
      1: "No! I can't win. How did you become so strong?",
      2: "I will not stray from my chosen path.",
      3: "The Champion is looking forward to meeting you."
    },
    "defeat": {
      1: "That's about what I expected.",
      2: "Well, that was relatively entertaining.",
      3: "Come visit me anytime."
    }
  },
  "milo": {
    "encounter": {
      1: `Sure seems like you understand Pokémon real well. 
               $This is gonna be a doozy of a battle! 
               $I'll have to Dynamax my Pokémon if I want to win!`,
    },
    "victory": {
      1: "The power of Grass has wilted… What an incredible Challenger!"
    },
    "defeat": {
      1: "This'll really leave you in shock and awe."
    }
  },
  "lucian": {
    "encounter": {
      1: `Just a moment, please. The book I'm reading has nearly reached its thrilling climax… 
                $The hero has obtained a mystic sword and is about to face their final trial… Ah, never mind. 
                $Since you've made it this far, I'll put that aside and battle you. 
                $Let me see if you'll achieve as much glory as the hero of my book!,`
    },
    "victory": {
      1: "I see… It appears you've put me in checkmate."
    },
    "defeat": {
      1: "I have a reputation to uphold."
    }
  },
  "drasna": {
    "encounter": {
      1: `You must be a strong Trainer. Yes, quite strong indeed…
                $That's just wonderful news! Facing opponents like you and your team will make my Pokémon grow like weeds!`
    },
    "victory": {
      1: "Oh, dear me. That sure was a quick battle… I do hope you'll come back again sometime!"
    },
    "defeat": {
      1: "How can this be?"
    }
  },
  "kahili": {
    "encounter": {
      1: "So, here you are… Why don't we see who the winds favor today, you… Or me?"
    },
    "victory": {
      1: "It's frustrating to me as a member of the Elite Four, but it seems your strength is the real deal."
    },
    "defeat": {
      1: "That was an ace!"
    }
  },
  "hassel": {
    "encounter": {
      1: "Prepare to learn firsthand how the fiery breath of ferocious battle feels!"
    },
    "victory": {
      1: `Fortune smiled on me this time, but… 
                $Judging from how the match went, who knows if I will be so lucky next time.`,
    },
    "defeat": {
      1: "That was an ace!"
    }
  },
  "blue": {
    "encounter": {
      1: "You must be pretty good to get this far."
    },
    "victory": {
      1: "I've only lost to him and now to you… Him? Hee, hee…"
    },
    "defeat": {
      1: "See? My power is what got me here."
    }
  },
  "piers": {
    "encounter": {
      1: "Get ready for a mosh pit with me and my party! Spikemuth, it's time to rock!"
    },
    "victory": {
      1: "Me an' my team gave it our best. Let's meet up again for a battle some time…"
    },
    "defeat": {
      1: "My throat's ragged from shoutin'… But 'at was an excitin' battle!"
    }
  },
  "red": {
    "encounter": {
      1: "…!"
    },
    "victory": {
      1: "…?"
    },
    "defeat": {
      1: "…!"
    }
  },
  "jasmine": {
    "encounter": {
      1: "Oh… Your Pokémon are impressive. I think I will enjoy this."
    },
    "victory": {
      1: "You are truly strong. I'll have to try much harder, too."
    },
    "defeat": {
      1: "I never expected to win."
    }
  },
  "lance_champion": {
    "encounter": {
      1: "I am still the Champion. I won't hold anything back."
    },
    "victory": {
      1: "This is the emergence of a new Champion."
    },
    "defeat": {
      1: "I successfully defended my Championship."
    }
  },
  "steven": {
    "encounter": {
      1: `Tell me… What have you seen on your journey with your Pokémon? 
                $What have you felt, meeting so many other Trainers out there? 
                $Traveling this rich land… Has it awoken something inside you? 
                $I want you to come at me with all that you've learned. 
                $My Pokémon and I will respond in turn with all that we know!`,
    },
    "victory": {
      1: "So I, the Champion, fall in defeat…"
    },
    "defeat": {
      1: "That was time well spent! Thank you!"
    }
  },
  "cynthia": {
    "encounter": {
      1: "I, Cynthia, accept your challenge! There won't be any letup from me!"
    },
    "victory": {
      1: "No matter how fun the battle is, it will always end sometime…"
    },
    "defeat": {
      1: "Even if you lose, never lose your love of Pokémon."
    }
  },
  "iris": {
    "encounter": {
      1: `Know what? I really look forward to having serious battles with strong Trainers! 
                $I mean, come on! The Trainers who make it here are Trainers who desire victory with every fiber of their being! 
                #And they are battling alongside Pokémon that have been through countless difficult battles! 
                $If I battle with people like that, not only will I get stronger, my Pokémon will, too! 
                $And we'll get to know each other even better! OK! Brace yourself! 
                $I'm Iris, the Pokémon League Champion, and I'm going to defeat you!`,
    },
    "victory": {
      1: "Aghhhh… I did my best, but we lost…"
    },
    "defeat": {
      1: "Yay! We won!"
    }
  },
  "hau": {
    "encounter": {
      1: `I wonder if a Trainer battles differently depending on whether they're from a warm region or a cold region.
                $Let's test it out!`,
    },
    "victory": {
      1: "That was awesome! I think I kinda understand your vibe a little better now!"
    },
    "defeat": {
      1: "Ma-an, that was some kinda battle!"
    }
  },
  "geeta": {
    "encounter": {
      1: `I decided to throw my hat in the ring once more. 
                $Come now… Show me the fruits of your training.`,
      "victory": {
        1: "I eagerly await news of all your achievements!"
      },
      "defeat": {
        1: "What's the matter? This isn't all, is it?"
      }
    },
  },
  "nemona": {
    "encounter": {
      1: "Yesss! I'm so psyched! Time for us to let loose!"
    },
    "victory": {
      1: "Well, that stinks, but I still had fun! I'll getcha next time!"
    },
    "defeat": {
      1: "Well, that was a great battle! Fruitful for sure."
    }
  },
  "leon": {
    "encounter": {
      1: "We're gonna have an absolutely champion time!"
    },
    "victory": {
      1: `My time as Champion is over… 
                $But what a champion time it's been! 
                $Thank you for the greatest battle I've ever had!`,
    },
    "defeat": {
      1: "An absolute champion time, that was!"
    }
  },
  "whitney": {
    "encounter": {
      1: "Hey! Don't you think Pokémon are, like, super cute?"
    },
    "victory": {
      1: "Waaah! Waaah! You're so mean!"
    },
    "defeat": {
      1: "And that's that!"
    }
  },
  "chuck": {
    "encounter": {
      1: "Hah! You want to challenge me? Are you brave or just ignorant?"
    },
    "victory": {
      1: "You're strong! Would you please make me your apprentice?"
    },
    "defeat": {
      1: "There. Do you realize how much more powerful I am than you?"
    }
  },
  "katy": {
    "encounter": {
      1: "Don't let your guard down unless you would like to find yourself knocked off your feet!"
    },
    "victory": {
      1: "All of my sweet little Pokémon dropped like flies!"
    },
    "defeat": {
      1: "Eat up, my cute little Vivillon!"
    }
  },
  "pryce": {
    "encounter": {
      1: "Youth alone does not ensure victory! Experience is what counts."
    },
    "victory": {
      1: "Outstanding! That was perfect. Try not to forget what you feel now."
    },
    "defeat": {
      1: "Just as I envisioned."
    }
  },
  "clair": {
    "encounter": {
      1: "Do you know who I am? And you still dare to challenge me?"
    },
    "victory": {
      1: "I wonder how far you can get with your skill level. This should be fascinating."
    },
    "defeat": {
      1: "That's that."
    }
  },
  "maylene": {
    "encounter": {
      1: `I've come to challenge you now, and I won't hold anything back. 
                    $Please prepare yourself for battle!`,
    },
    "victory": {
      1: "I admit defeat…"
    },
    "defeat": {
      1: "That was awesome."
    }
  },
  "fantina": {
    "encounter": {
      1: `You shall challenge me, yes? But I shall win. 
                    $That is what the Gym Leader of Hearthome does, non?`,
    },
    "victory": {
      1: "You are so fantastically strong. I know why I have lost."
    },
    "defeat": {
      1: "I am so, so, very happy!"
    }
  },
  "byron": {
    "encounter": {
      1: `Trainer! You're young, just like my son, Roark. 
                    $With more young Trainers taking charge, the future of Pokémon is bright! 
                    $So, as a wall for young people, I'll take your challenge!`,
    },
    "victory": {
      1: "Hmm! My sturdy Pokémon--defeated!"
    },
    "defeat": {
      1: "Gwahahaha! How were my sturdy Pokémon?!"
    }
  },
  "olympia": {
    "encounter": {
      1: "An ancient custom deciding one's destiny. The battle begins!"
    },
    "victory": {
      1: "Create your own path. Let nothing get in your way. Your fate, your future."
    },
    "defeat": {
      1: "Our path is clear now."
    }
  },
  "volkner": {
    "encounter": {
      1: `Since you've come this far, you must be quite strong…
                    $I hope you're the Trainer who'll make me remember how fun it is to battle!`,
    },
    "victory": {
      1: `You've got me beat…
                    $Your desire and the noble way your Pokémon battled for you… 
                    $I even felt thrilled during our match. That was a very good battle.`,
    },
    "defeat": {
      1: `It was not shocking at all… 
                    $That is not what I wanted!`,
    }
  },
  "burgh": {
    "encounter": {
      1: `M'hm… If I win this battle, I feel like I can draw a picture unlike any before it. 
                    $OK! I can hear my battle muse loud and clear. Let's get straight to it!`,
      2: `Of course, I'm really proud of all of my Pokémon! 
                    $Well now… Let's get right to it!`
    },
    "victory": {
      1: "Is it over? Has my muse abandoned me?",
      2: "Hmm… It's over! You're incredible!"
    },
    "defeat": {
      1: "Wow… It's beautiful somehow, isn't it…",
      2: `Sometimes I hear people say something was an ugly win. 
                    $I think if you're trying your best, any win is beautiful.`
    }
  },
  "elesa": {
    "encounter": {
      1: `C'est fini! When I'm certain of that, I feel an electric jolt run through my body! 
                    $I want to feel the sensation, so now my beloved Pokémon are going to make your head spin!`,
    },
    "victory": {
      1: "I meant to make your head spin, but you shocked me instead."
    },
    "defeat": {
      1: "That was unsatisfying somehow… Will you give it your all next time?"
    }
  },
  "skyla": {
    "encounter": {
      1: `It's finally time for a showdown! That means the Pokémon battle that decides who's at the top, right? 
                    $I love being on the summit! 'Cause you can see forever and ever from high places! 
                    $So, how about you and I have some fun?`,
    },
    "victory": {
      1: "Being your opponent in battle is a new source of strength to me. Thank you!"
    },
    "defeat": {
      1: "Win or lose, you always gain something from a battle, right?"
    }
  },
  "brycen": {
    "encounter": {
      1: `There is also strength in being with other people and Pokémon. 
                    $Receiving their support makes you stronger. I'll show you this power!`,
    },
    "victory": {
      1: "The wonderful combination of you and your Pokémon! What a beautiful friendship!"
    },
    "defeat": {
      1: "Extreme conditions really test you and train you!"
    }
  },
  "drayden": {
    "encounter": {
      1: `What I want to find is a young Trainer who can show me a bright future. 
                    $Let's battle with everything we have: your skill, my experience, and the love we've raised our Pokémon with!`,
    },
    "victory": {
      1: "This intense feeling that floods me after a defeat… I don't know how to describe it."
    },
    "defeat": {
      1: "Harrumph! I know your ability is greater than that!"
    }
  },
  "grant": {
    "encounter": {
      1: `There is only one thing I wish for. 
                    $That by surpassing one another, we find a way to even greater heights.`,
    },
    "victory": {
      1: "You are a wall that I am unable to surmount!"
    },
    "defeat": {
      1: `Do not give up. 
                    $That is all there really is to it. 
                    $The most important lessons in life are simple.`,
    }
  },
  "korrina": {
    "encounter": {
      1: "Time for Lady Korrina's big appearance!"
    },
    "victory": {
      1: "It's your very being that allows your Pokémon to evolve!"
    },
    "defeat": {
      1: "What an explosive battle!"
    }
  },
  "clemont": {
    "encounter": {
      1: "Oh! I'm glad that we got to meet!"
    },
    "victory": {
      1: "Your passion for battle inspires me!"
    },
    "defeat": {
      1: "Looks like my Trainer-Grow-Stronger Machine, Mach 2 is really working!"
    }
  },
  "valerie": {
    "encounter": {
      1: `Oh, if it isn't a young Trainer… It is lovely to get to meet you like this. 
                    $Then I suppose you have earned yourself the right to a battle, as a reward for your efforts. 
                    $The elusive Fairy may appear frail as the breeze and delicate as a bloom, but it is strong.`,
    },
    "victory": {
      1: "I hope that you will find things worth smiling about tomorrow…"
    },
    "defeat": {
      1: "Oh goodness, what a pity…"
    }
  },
  "wulfric": {
    "encounter": {
      1: `You know what? We all talk big about what you learn from battling and bonds and all that…
                    $But really, I just do it 'cause it's fun. 
                    $Who cares about the grandstanding? Let's get to battling!`,
    },
    "victory": {
      1: "Outstanding! I'm tough as an iceberg, but you smashed me through and through!"
    },
    "defeat": {
      1: "Tussle with me and this is what happens!"
    }
  },
  "kabu": {
    "encounter": {
      1: `Every Trainer and Pokémon trains hard in pursuit of victory. 
                    $But that means your opponent is also working hard to win. 
                    $In the end, the match is decided by which side is able to unleash their true potential.`,
    },
    "victory": {
      1: "I'm glad I could battle you today!"
    },
    "defeat": {
      1: "That's a great way for me to feel my own growth!"
    }
  },
  "bea": {
    "encounter": {
      1: `Do you have an unshakable spirit that won't be moved, no matter how you are attacked? 
                    $I think I'll just test that out, shall I?`,
    },
    "victory": {
      1: "I felt the fighting spirit of your Pokémon as you led them in battle."
    },
    "defeat": {
      1: "That was the best sort of match anyone could ever hope for."
    }
  },
  "opal": {
    "encounter": {
      1: "Let me have a look at how you and your partner Pokémon behave!"
    },
    "victory": {
      1: "Your pink is still lacking, but you're an excellent Trainer with excellent Pokémon."
    },
    "defeat": {
      1: "Too bad for you, I guess."
    }
  },
  "bede": {
    "encounter": {
      1: "I suppose I should prove beyond doubt just how pathetic you are and how strong I am."
    },
    "victory": {
      1: "I see… Well, that's fine. I wasn't really trying all that hard anyway."
    },
    "defeat": {
      1: "Not a bad job, I suppose."
    }
  },
  "gordie": {
    "encounter": {
      1: "So, let's get this over with."
    },
    "victory": {
      1: "I just want to climb into a hole… Well, I guess it'd be more like falling from here."
    },
    "defeat": {
      1: "Battle like you always do, victory will follow!"
    }
  },
  "marnie": {
    "encounter": {
      1: `The truth is, when all's said and done… I really just wanna become Champion for myself! 
                    $So don't take it personal when I kick your butt!`,
    },
    "victory": {
      1: "OK, so I lost… But I got to see a lot of the good points of you and your Pokémon!"
    },
    "defeat": {
      1: "Hope you enjoyed our battle tactics."
    }
  },
  "raihan": {
    "encounter": {
      1: "I'm going to defeat the Champion, win the whole tournament, and prove to the world just how strong the great Raihan really is!"
    },
    "victory": {
      1: `I look this good even when I lose. 
                    $It's a real curse. 
                    $Guess it's time for another selfie!`,
    },
    "defeat": {
      1: "Let's take a selfie to remember this."
    }
  },
  "brassius": {
    "encounter": {
      1: "I assume you are ready? Let our collaborative work of art begin!"
    },
    "victory": {
      1: "Ahhh…vant-garde!"
    },
    "defeat": {
      1: "I will begin on a new piece at once!"
    }
  },
  "iono": {
    "encounter": {
      1: `How're ya feelin' about this battle?
                    $...
                    $Let's get this show on the road! How strong is our challenger? 
                    $I 'unno! Let's find out together!`,
    },
    "victory": {
      1: "You're as flashy and bright as a 10,000,000-volt Thunderbolt, friendo!"
    },
    "defeat": {
      1: "Your eyeballs are MINE!"
    }
  },
  "larry": {
    "encounter": {
      1: "When all's said and done, simplicity is strongest."
    },
    "victory": {
      1: "A serving of defeat, huh?"
    },
    "defeat": {
      1: "I'll call it a day."
    }
  },
  "ryme": {
    "encounter": {
      1: "Come on, baby! Rattle me down to the bone!"
    },
    "victory": {
      1: "You're cool, my friend—you move my SOUL!"
    },
    "defeat": {
      1: "Later, baby!"
    }
  },
  "grusha": {
    "encounter": {
      1: "All I need to do is make sure the power of my Pokémon chills you to the bone!"
    },
    "victory": {
      1: "Your burning passion… I kinda like it, to be honest."
    },
    "defeat": {
      1: "Things didn't heat up for you."
    }
  },
  "marnie_elite": {
    "encounter": {
      1: "You've made it this far, huh? Let's see if you can handle my Pokémon!",
      2: "I'll give it my best shot, but don't think I'll go easy on you!"
    },
    "victory": {
      1: "I can't believe I lost... But you deserved that win. Well done!",
      2: "Looks like I've still got a lot to learn. Great battle, though!"
    },
    "defeat": {
      1: "You put up a good fight, but I've got the edge! Better luck next time!",
      2: "Seems like my training's paid off. Thanks for the battle!"
    }
  },
  "nessa_elite": {
    "encounter": {
      1: "The tides are turning in my favor. Ready to get swept away?",
      2: "Let's make some waves with this battle! I hope you're prepared!"
    },
    "victory": {
      1: "You navigated those waters perfectly... Well done!",
      2: "Looks like my currents were no match for you. Great job!"
    },
    "defeat": {
      1: "Water always finds a way. That was a refreshing battle!",
      2: "You fought well, but the ocean's power is unstoppable!"
    }
  },
  "bea_elite": {
    "encounter": {
      1: "Prepare yourself! My fighting spirit burns bright!",
      2: "Let's see if you can keep up with my relentless pace!"
    },
    "victory": {
      1: "Your strength... It's impressive. You truly deserve this win.",
      2: "I've never felt this intensity before. Amazing job!"
    },
    "defeat": {
      1: "Another victory for my intense training regimen! Well done!",
      2: "You've got strength, but I trained harder. Great battle!"
    }
  },
  "allister_elite": {
    "encounter": {
      1: "Shadows fall... Are you ready to face your fears?",
      2: "Let's see if you can handle the darkness that I command."
    },
    "victory": {
      1: "You've dispelled the shadows... For now. Well done.",
      2: "Your light pierced through my darkness. Great job."
    },
    "defeat": {
      1: "The shadows have spoken... Your strength isn't enough.",
      2: "Darkness triumphs... Maybe next time you'll see the light."
    }
  },
  "raihan_elite": {
    "encounter": {
      1: "Storm's brewing! Let's see if you can weather this fight!",
      2: "Get ready to face the eye of the storm!"
    },
    "victory": {
      1: "You've bested the storm... Incredible job!",
      2: "You rode the winds perfectly... Great battle!"
    },
    "defeat": {
      1: "Another storm weathered, another victory claimed! Well fought!",
      2: "You got caught in my storm! Better luck next time!"
    }
  },
  "rival": {
    "encounter": {
	  1: `@c{smile}Ah, je te cherchais ! Je savais que t’étais pressée de partir, mais je m’attendais quand même à un au revoir…
					$@c{smile_eclosed}T’as finalement décidé de réaliser ton rêve ?\nJ’ai peine à y croire.
					$@c{serious_smile_fists}Vu que t’es là, ça te dis un petit combat ?\nJe voudrais quand même m’assurer que t'es prête.
					$@c{serious_mopen_fists}Surtout ne te retiens pas et donne-moi tout ce que t’as !`
    },
    "victory": {
	  1: `@c{shock}Wah… Tu m’as vraiment lavé.\nT’es vraiment une débutante ?
				   $@c{smile}T'as peut-être eu de la chance, mais…\nPeut-être que t’arriveras jusqu’au bout du chemin.
				   $D'ailleurs, le prof m’a demandé de te filer ces objets.\nIls ont l’air sympas.
                   $@c{serious_smile_fists}Bonne chance à toi !`
    },
  },
  "rival_female": {
    "encounter": {
      1: `@c{smile_wave}Ah, je te cherchais ! Je t’ai cherché partout !\n@c{angry_mopen}On oublie de dire au revoir à sa meilleure amie ?
                    $@c{smile_ehalf}T’as décidé de réaliser ton rêve, hein ?\nCe jour est donc vraiment arrivé…
					$@c{smile}Je veux bien te pardonner de m’avoir oubliée, à une conditon. @c{smile_wave_wink}Que tu m’affronte !
					$@c{angry_mopen}Donne tout ! Ce serait dommage que ton aventure finisse avant d’avoir commencé, hein ?`
    },
    "victory": {
      1: `@c{shock}Tu viens de commencer et t’es déjà si fort ?!@d{96}\n@c{angry}T'as triché non ? Avoue !
                    $@c{smile_wave_wink}J'déconne !@d{64} @c{smile_eclosed}J'ai perdu dans les règles… J’ai le sentiment que tu vas très bien t’en sortir.
					$@c{smile}D’ailleurs, le prof veut que je te donne ces quelques objets. Ils te seront utiles, pour sûr !
					$@c{smile_wave}Fais de ton mieux, comme toujours !\nJe crois fort en toi !`
    },
  },
  "rival_2": {
    "encounter": {
	  1: `@c{smile}Hé, toi aussi t’es là ?\n@c{smile_eclosed}Toujours invaincue, hein… ?
				$@c{serious_mopen_fists}Je sais que j’ai l’air de t’avoir suivie ici, mais c'est pas complètement vrai.
				$@c{serious_smile_fists}Pour être honnête, ça me démangeait d’avoir une revanche depuis que tu m'as battu.
				$Je me suis beaucoup entrainé, alors sois sure que je vais pas retenir mes coups cette fois.
                $@c{serious_mopen_fists}Et comme la dernière fois, ne te retiens pas !\nC’est parti !`
    },
    "victory": {
	  1: `@c{neutral_eclosed}Oh. Je crois que j’ai trop pris la confiance.
				$@c{smile}Pas grave, c'est OK. Je me doutais que ça arriverait.\n@c{serious_mopen_fists}Je vais juste devoir encore plus m’entrainer !\n
                $@c{smile}Ah, et pas que t’aies réellement besoin d’aide, mais j’ai ça en trop sur moi qui pourrait t’intéresser.\n
				$@c{serious_smile_fists}Mais n’espère plus en avoir d’autres !\nJe peux pas passer mon temps à aider mon adversaire.
                $@c{smile}Bref, prends soin de toi !`
    },
  },
  "rival_2_female": {
    "encounter": {
	  1: `@c{smile_wave}Hé, sympa de te croiser ici. T’as toujours l’air invaincu. @c{angry_mopen}Eh… Pas mal !
				$@c{angry_mopen}Je sais à quoi tu penses et non, je t’espionne pas. @c{smile_eclosed}C’est juste que j’étais aussi dans le coin.
				$@c{smile_ehalf}Heureuse pour toi, mais je veux juste te rappeler que c’est pas grave de perdre parfois.
				$@c{smile}On apprend de nos erreurs, souvent plus que si on ne connaissait que le succès.
				$@c{angry_mopen}Dans tous les cas je me suis bien entrainée pour cette revanche, t'as intérêt à tout donner !`
    },
    "victory": {
	  1: `@c{neutral}Je… J’étais pas encore supposée perdre…
				$@c{smile}Bon. Ça veut juste dire que je vois devoir encore plus m’entrainer !
				$@c{smile_wave}J’ai aussi ça en rab pour toi !\n@c{smile_wave_wink}Inutile de me remercier ~.
                $@c{angry_mopen}C’était le dernier, terminé les cadeaux après celui-là !
                $@c{smile_wave}Allez, tiens le coup !`
    },
    "defeat": {
      1: "Je suppose que c’est parfois normal de perdre…"
    }
  },
  "rival_3": {
    "encounter": {
	  1: `@c{smile}Hé, mais qui voilà ! Ça fait un bail.\n@c{neutral}T’es… toujours invaincue ? Incroyable.
				$@c{neutral_eclosed}Tout est devenu un peu… étrange.\nC’est plus pareil sans toi au village.
				$@c{serious}Je sais que c’est égoïste, mais j’ai besoin d’expier ça.\n@c{neutral_eclosed}Je crois que tout ça te dépasse.
				$@c{serious}Ne jamais perdre, c’est juste irréaliste.\nGrandir, c’est parfois aussi savoir perdre.
				$@c{neutral_eclosed}T’as un beau parcours, mais il y a encore tellement à venir et ça va pas s’arranger. @c{neutral}T’es prête pour ça ?
                $@c{serious_mopen_fists}Si tu l’es, alors prouve-le.`
    },
    "victory": {
	  1: "@c{angry_mhalf}C’est lunaire… J’ai presque fait que m’entrainer…\nAlors pourquoi il y a encore un tel écart entre nous ?"
    },
  },
  "rival_3_female": {
    "encounter": {
	  1: `@c{smile_wave}Ça fait une éternité ! Toujours debout hein ?\n@c{angry}Tu commences à me pousser à bout là. @c{smile_wave_wink}T’inquiètes j’déconne !
				$@c{smile_ehalf}Mais en vrai, ta maison te manque pas ? Ou… Moi ?\nJ… Je veux dire… Tu me manques vraiment beaucoup.
				$@c{smile_eclosed}Je te soutiendrai toujours dans tes ambitions, mais la vérité est que tu finiras par perdre un jour ou l’autre.
                $@c{smile}Quand ça arrivera, je serai là pour toi, comme toujours.\n@c{angry_mopen}Maintenant, montre-moi à quel point t’es devenu fort !`
    },
    "victory": {
	  1: "@c{shock}Après tout ça… Ça te suffit toujours pas… ?\nTu reviendras jamais à ce rythme…"

    },
    "defeat": {
	  1: "T’as fait de ton mieux.\nAllez, rentrons à la maison."
    }
  },
  "rival_4": {
    "encounter": {
      1: `@c{neutral}Hé.
				$Je vais pas y aller par quatre chemins avec toi.\n@c{neutral_eclosed}Je suis là pour gagner. Simple, basique.
				$@c{serious_mhalf_fists}J’ai appris à maximiser tout mon potentiel en m’entrainant d’arrachepied.
				$@c{smile}C’est fou tout le temps que tu peux te dégager si tu dors pas en sacrifiant ta vie sociale.
				$@c{serious_mopen_fists}Plus rien n’a d’importance désormais, pas tant que j’aurai pas gagné.
				$@c{neutral_eclosed}J'ai atteint un stade où je ne peux plus perdre.\n@c{smile_eclosed}Je présume que ta philosophie était pas si fausse finalement.
				$@c{angry_mhalf}La défaite, c'est pour les faibles, et je ne suis plus un faible.
                $@c{serious_mopen_fists}Tiens-toi prête.`
    },
    "victory": {
      1: "@c{neutral}Que…@d{64} Qui es-tu ?"
    },
  },
  "rival_4_female": {
    "encounter": {
	  1: `@c{neutral}C’est moi ! Tu m’as pas encore oubliée… n’est-ce pas ?
				$@c{smile}Tu devrais être fier d’être arrivé aussi loin. GG !\nMais c’est certainement pas la fin de ton aventure.
				$@c{smile_eclosed}T’as éveillé en moi quelque chose que j’ignorais.\nTout mon temps passe dans l'entrainement.
				$@c{smile_ehalf}Je dors et je mange à peine, je m’entraine juste tous les jours, et deviens de plus en plus forte.
                $@c{neutral}En vrai, Je… J’ai de la peine à me reconnaitre.
				$Mais maintenant, je suis au top de mes capacités.\nJe doute que tu sois de nouveau capable de me battre.
				$Et tu sais quoi ? Tout ça, c’est de ta faute.\n@c{smile_ehalf}Et j’ignore si je dois te remercier ou te haïr.
                $@c{angry_mopen}Tiens-toi prêt.`
    },
    "victory": {
      1: "@c{neutral}Que…@d{64} Qui es-tu ?"

    },
    "defeat": {
      1: "$@c{smile}Tu devrais être fier d’être arrivé jusque là."
    }
  },
  "rival_5": {
    "encounter": {
      1: "@c{neutral}…"
    },
    "victory": {
      1: "@c{neutral}…"
    },
  },
  "rival_5_female": {
    "encounter": {
      1: "@c{neutral}…"
    },
    "victory": {
      1: "@c{neutral}…"

    },
    "defeat": {
      1: "$@c{smile_ehalf}…"
    }
  },
  "rival_6": {
    "encounter": {
      1: `@c{smile_eclosed}Nous y revoilà.
				$@c{neutral}J’ai eu du temps pour réfléchir à tout ça.\nIl y a une raison à pourquoi tout semble étrange.
				$@c{neutral_eclosed}Ton rêve, ma volonté de te battre…\nFont partie de quelque chose de plus grand.
				$@c{serious}C’est même pas à propos de moi, ni de toi… Mais du monde, @c{serious_mhalf_fists}et te repousser dans tes limites est ma mission.
				$@c{neutral_eclosed}J’ignore si je serai capable de l’accomplir, mais je ferai tout ce qui est en mon pouvoir.
				$@c{neutral}Cet endroit est terrifiant… Et pourtant il m’a l’air familier, comme si j’y avais déjà mis les pieds.
                $@c{serious_mhalf_fists}Tu ressens la même chose, pas vrai ?
				$@c{serious}…et c’est comme si quelque chose ici me parlait.
                                $Comme si c’était tout ce que ce monde avait toujours connu.
				$Ces précieux moments ensemble semblent si proches ne sont rien de plus qu’un lointain souvenir.
				$@c{neutral_eclosed}D’ailleurs, qui peut dire aujourd’hui qu’ils ont pu être réels ?
				$@c{serious_mopen_fists}Il faut que tu persévères. Si tu t’arrêtes, ça n'aura jamais de fin et t’es la seule à en être capable.
				$@c{serious_smile_fists}Difficile de comprendre le sens de tout ça, je sais juste que c’est la réalité.
				$@c{serious_mopen_fists}Si tu ne parviens pas à me battre ici et maintenant, tu n’as aucune chance.`
    },
    "victory": {
      1: `@c{smile_eclosed}J'ai fait ce que je j'avais à faire.
				$Promets-moi juste une chose.\n@c{smile}Après avoir réparé ce monde… Rentre à la maison.`
    },
  },
  "rival_6_female": {
    "encounter": {
      1: `@c{smile_ehalf}C’est donc encore entre toi et moi.
				$@c{smile_eclosed}Tu sais, j’ai beau retouner ça dans tous les sens…
                $@c{smile_ehalf}Quelque chose peut expliquer tout ça, pourquoi tout semble si étrange…
				$@c{smile}T’as tes rêves, j’ai mes ambitions…
				$J’ai juste le sentiment qu’il y a un grand dessein derrière tout ça, derrière ce qu’on fait toi et moi.
                $@c{smile_eclosed}Je crois que mon but est de… repousser tes limites.
				$@c{smile_ehalf}Je suis pas certaine de bien être douée à cet exercice, mais je fais de mon mieux.
				$Cet endroit épouvantable cache quelque chose d’étrange… Tout semble si limpide…
                $Comme… si c’était tout ce que ce monde avait toujours connu.
				$@c{smile_eclosed}J’ai le sentiment que nos précieux moments ensemble sont devenus si flous.
				$@c{smile_ehalf}Ont-ils au moins été réels ? Tout semble si loin maintenant…
                $@c{angry_mopen}Il faut que tu persévères. Si tu t’arrêtes, ça n'aura jamais de fin et t’es le seul à en être capable.
                $@c{smile_ehalf}Je… j’ignore le sens de tout ça… Mais je sais que c’est la réalité.
                $@c{neutral}Si tu ne parviens pas à me battre ici et maintenant, tu n’as aucune chance.`
    },
    "victory": {
      1: `@c{smile_ehalf}Je… Je crois que j'ai rempli ma mission…
                $@c{smile_eclosed}Promets-moi… Après avoir réparé ce monde… Reviens à la maison sain et sauf.
                $@c{smile_ehalf}… Merci.`

    },
  },
};


// Dialogue of the NPCs in the game when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMdialogue.
export const PGFdialogue: DialogueTranslationEntries = {
  "youngster": {
    "encounter": {
      1: "Hé ! Combat ?",
      2: "Toi aussi tu débutes ?",
      3: "Hé, j’me souviens pas de ta tête. Combat !",
	  4: "J’ai perdu, alors j’essaye de capturer d’autres Pokémon.\nHé, t’as l'air faible toi ! Allez, combat !",
      5: "On s’connait ? J’ai comme un doute. Dans tous les cas, sympa de te rencontrer !",
      6: "Allez, c’est parti !",
      7: "Attention, me voilà !\nTu vas voir comment j’suis fort !",
	  8: "Coucou… Tu veux voir mes bô Pokémon ?",
	  9: "Trève de mondanités. Ramène-toi quand tu le sens !",
	  10: "Baisse pas ta garde si tu veux pas pleurer d’avoir perdu face à un gamin.",
	  11: "J'ai tout donné pour élever mes Pokémon. Attention à toi si tu leur fait du mal !",
	  12: "Incroyable que t’y sois parvenue ! Mais la suite va pas être une partie de plaisir.",
	  13: "Les combats sont éternels ! Bienvenue dans un monde sans fin !"
    },
    "victory": {
      1: "Hé, mais t’es trop forte !",
      2: "En vrai j’avais aucune chance hein ?",
      3: "J’te retrouverai un jour, et là j’te battrai !",
      4: "Arg… J’ai plus aucun Pokémon.",
      5: "Non… IMPOSSIBLE ! Pourquoi j’ai encore perdu…",
      6: "Non ! J’ai perdu !",
	  7: "Waah ! T’es trop incroyable ! J’suis bouche bée !",
      8: "Pourquoi… Comment… Pourtant on est les plus forts, mes Pokémon et moi…",
	  9: "J’perdrai pas la prochaine fois ! Remettons ça un jour !",
	  10: "Weeeesh ! Tu vois que j’suis qu’un gamin ? C'est pas juste de me bully comme ça !",
	  11: "Tes Pokémon sont trop incroyables !\n… P’tit échange ?",
	  12: "Je me suis fait un peu aider plus tôt, mais de quel taf je parlais ?",
	  13: "Ahaha ! Et voilà, ça y est !\nT'es déjà comme chez toi dans ce monde !"
    }
  },
  "lass": {
    "encounter": {
      1: "Let's have a battle, shall we?",
      2: "You look like a new trainer. Let's have a battle!",
      3: "I don't recognize you. How about a battle?",
      4: "Let's have a fun Pokémon battle!",
      5: "I'll show you the ropes of how to really use Pokémon!",
      6: "A serious battle starts from a serious beginning! Are you sure you're ready?",
      7: "You're only young once. And you only get one shot at a given battle. Soon, you'll be nothing but a memory.",
      8: "You'd better go easy on me, OK? Though I'll be seriously fighting!",
      9: "School is boring. I've got nothing to do. Yawn. I'm only battling to kill the time."
    },
    "victory": {
      1: "That was impressive! I've got a lot to learn.",
      2: "I didn't think you'd beat me that bad…",
      3: "I hope we get to have a rematch some day.",
      4: "That was pretty amazingly fun! You've totally exhausted me…",
      5: "You actually taught me a lesson! You're pretty amazing!",
      6: "Seriously, I lost. That is, like, seriously depressing, but you were seriously cool.",
      7: "I don't need memories like this. Deleting memory…",
      8: "Hey! I told you to go easy on me! Still, you're pretty cool when you're serious.",
      9: "I'm actually getting tired of battling… There's gotta be something new to do…"
    }
  },
  "breeder": {
    "encounter": {
      1: "Obedient Pokémon, selfish Pokémon… Pokémon have unique characteristics.",
      2: "Even though my upbringing and behavior are poor, I've raised my Pokémon well.",
      3: "Hmm, do you discipline your Pokémon? Pampering them too much is no good.",
    },
    "victory": {
      1: "It is important to nurture and train each Pokémon's characteristics.",
      2: "Unlike my diabolical self, these are some good Pokémon.",
      3: "Too much praise can spoil both Pokémon and people.",
    },
    "defeat": {
      1: "You should not get angry at your Pokémon, even if you lose a battle.",
      2: "Right? Pretty good Pokémon, huh? I'm suited to raising things.",
      3: "No matter how much you love your Pokémon, you still have to discipline them when they misbehave."
    }
  },
  "breeder_female": {
    "encounter": {
      1: "Pokémon never betray you. They return all the love you give them.",
      2: "Shall I give you a tip for training good Pokémon?",
      3: "I have raised these very special Pokémon using a special method."
    },
    "victory": {
      1: "Ugh… It wasn't supposed to be like this. Did I administer the wrong blend?",
      2: "How could that happen to my Pokémon… What are you feeding your Pokémon?",
      3: "If I lose, that tells you I was just killing time. It doesn't damage my ego at all."
    },
    "defeat": {
      1: "This proves my Pokémon have accepted my love.",
      2: "The real trick behind training good Pokémon is catching good Pokémon.",
      3: "Pokémon will be strong or weak depending on how you raise them."
    }
  },
  "fisherman": {
    "encounter": {
      1: "Aack! You made me lose a bite!\nWhat are you going to do about it?",
      2: "Go away! You're scaring the Pokémon!",
      3: "Let's see if you can reel in a victory!",
    },
    "victory": {
      1: "Just forget about it.",
      2: "Next time, I'll be reelin' in the triumph!",
      3: "Guess I underestimated the currents this time.",
    },
  },
  "fisherman_female": {
    "encounter": {
      1: "Woah! I've hooked a big one!",
      2: "Line's in, ready to reel in success!",
      3: "Ready to make waves!"
    },
    "victory": {
      1: "I'll be back with a stronger hook.",
      2: "I'll reel in victory next time.",
      3: "I'm just sharpening my hooks for the comeback!"
    },
  },
  "swimmer": {
    "encounter": {
      1: "Time to dive in!",
      2: "Let's ride the waves of victory!",
      3: "Ready to make a splash!",
    },
    "victory": {
      1: "Drenched in defeat!",
      2: "A wave of defeat!",
      3: "Back to shore, I guess.",
    },
  },
  "backpacker": {
    "encounter": {
      1: "Pack up, game on!",
      2: "Let's see if you can keep pace!",
      3: "Gear up, challenger!",
      4: "I've spent 20 years trying to find myself… But where am I?"
    },
    "victory": {
      1: "Tripped up this time!",
      2: "Oh, I think I'm lost.",
      3: "Dead end!",
      4: "Wait up a second! Hey! Don't you know who I am?"
    },
  },
  "ace_trainer": {
    "encounter": {
      1: "You seem quite confident.",
      2: "Your Pokémon… Show them to me…",
      3: "Because I'm an Ace Trainer, people think I'm strong.",
      4: "Are you aware of what it takes to be an Ace Trainer?"
    },
    "victory": {
      1: "Yes… You have good Pokémon…",
      2: "What?! But I'm a battling genius!",
      3: "Of course, you are the main character!",
      4: "OK! OK! You could be an Ace Trainer!"
    },
    "defeat": {
      1: "I am devoting my body and soul to Pokémon battles!",
      2: "All within my expectations… Nothing to be surprised about…",
      3: "I thought I'd grow up to be a frail person who looked like they would break if you squeezed them too hard.",
      4: "Of course I'm strong and don't lose. It's important that I win gracefully."
    }
  },
  "parasol_lady": {
    "encounter": {
      1: "Time to grace the battlefield with elegance and poise!",
    },
    "victory": {
      1: "My elegance remains unbroken!",
    }
  },
  "twins": {
    "encounter": {
      1: "Get ready, because when we team up, it's double the trouble!",
      2: "Two hearts, one strategy – let's see if you can keep up with our twin power!",
      3: "Hope you're ready for double trouble, because we're about to bring the heat!"
    },
    "victory": {
      1: "We may have lost this round, but our bond remains unbreakable!",
      2: "Our twin spirit won't be dimmed for long.",
      3: "We'll come back stronger as a dynamic duo!"
    },
    "defeat": {
      1: "Twin power reigns supreme!",
      2: "Two hearts, one triumph!",
      3: "Double the smiles, double the victory dance!"
    }
  },
  "cyclist": {
    "encounter": {
      1: "Get ready to eat my dust!",
      2: "Gear up, challenger! I'm about to leave you in the dust!",
      3: "Pedal to the metal, let's see if you can keep pace!"
    },
    "victory": {
      1: "Spokes may be still, but determination pedals on.",
      2: "Outpaced!",
      3: "The road to victory has many twists and turns yet to explore."
    },
  },
  "black_belt": {
    "encounter": {
      1: "I praise your courage in challenging me! For I am the one with the strongest kick!",
      2: "Oh, I see. Would you like to be cut to pieces? Or do you prefer the role of punching bag?"
    },
    "victory": {
      1: "Oh. The Pokémon did the fighting. My strong kick didn't help a bit.",
      2: "Hmmm… If I was going to lose anyway, I was hoping to get totally messed up in the process."
    },
  },
  "battle_girl": {
    "encounter": {
      1: "You don't have to try to impress me. You can lose against me.",
    },
    "victory": {
      1: "It's hard to say good-bye, but we are running out of time…",
    },
  },
  "hiker": {
    "encounter": {
      1: "My middle-age spread has given me as much gravitas as the mountains I hike!",
      2: "I inherited this big-boned body from my parents… I'm like a living mountain range…",
    },
    "victory": {
      1: "At least I cannot lose when it comes to BMI!",
      2: "It's not enough… It's never enough. My bad cholesterol isn't high enough…"
    },
  },
  "ranger": {
    "encounter": {
      1: "When I am surrounded by nature, most other things cease to matter.",
      2: "When I'm living without nature in my life, sometimes I'll suddenly feel an anxiety attack coming on."
    },
    "victory": {
      1: "It doesn't matter to the vastness of nature whether I win or lose…",
      2: "Something like this is pretty trivial compared to the stifling feelings of city life."
    },
    "defeat": {
      1: "I won the battle. But victory is nothing compared to the vastness of nature…",
      2: "I'm sure how you feel is not so bad if you compare it to my anxiety attacks…"
    }
  },
  "scientist": {
    "encounter": {
      1: "My research will lead this world to peace and joy.",
    },
    "victory": {
      1: "I am a genius… I am not supposed to lose against someone like you…",
    },
  },
  "school_kid": {
    "encounter": {
      1: "…Heehee. I'm confident in my calculations and analysis.",
      2: "I'm gaining as much experience as I can because I want to be a Gym Leader someday."
    },
    "victory": {
      1: "Ohhhh… Calculation and analysis are perhaps no match for chance…",
      2: "Even difficult, trying experiences have their purpose, I suppose."
    }
  },
  "artist": {
    "encounter": {
      1: "I used to be popular, but now I am all washed up.",
    },
    "victory": {
      1: "As times change, values also change. I realized that too late.",
    },
  },
  "guitarist": {
    "encounter": {
      1: "Get ready to feel the rhythm of defeat as I strum my way to victory!",
    },
    "victory": {
      1: "Silenced for now, but my melody of resilience will play on.",
    },
  },
  "worker": {
    "encounter": {
      1: "It bothers me that people always misunderstand me. I'm a lot more pure than everyone thinks.",
    },
    "victory": {
      1: "I really don't want my skin to burn, so I want to stay in the shade while I work.",
    },
  },
  "worker_female": {
    "encounter": {
      1: `It bothers me that people always misunderstand me. 
                $I'm a lot more pure than everyone thinks.`
    },
    "victory": {
      1: "I really don't want my skin to burn, so I want to stay in the shade while I work."
    },
    "defeat": {
      1: "My body and mind aren't necessarily always in sync."
    }
  },
  "worker_double": {
    "encounter": {
      1: "I'll show you we can break you. We've been training in the field!",
    },
    "victory": {
      1: "How strange… How could this be… I shouldn't have been outmuscled.",
    },
  },
  "hex_maniac": {
    "encounter": {
      1: "I normally only ever listen to classical music, but if I lose, I think I shall try a bit of new age!",
      2: "I grow stronger with each tear I cry."
    },
    "victory": {
      1: "Is this the dawning of the age of Aquarius?",
      2: "Now I can get even stronger. I grow with every grudge."
    },
    "defeat": {
      1: "New age simply refers to twentieth century classical composers, right?",
      2: "Don't get hung up on sadness or frustration. You can use your grudges to motivate yourself."
    }
  },
  "psychic": {
    "encounter": {
      1: "Hi! Focus!",
    },
    "victory": {
      1: "Eeeeek!",
    },
  },
  "officer": {
    "encounter": {
      1: "Brace yourself, because justice is about to be served!",
      2: "Ready to uphold the law and serve justice on the battlefield!"
    },
    "victory": {
      1: "The weight of justice feels heavier than ever…",
      2: "The shadows of defeat linger in the precinct."
    }
  },
  "beauty": {
    "encounter": {
      1: "My last ever battle… That's the way I'd like us to view this match…",
    },
    "victory": {
      1: "It's been fun… Let's have another last battle again someday…",
    },
  },
  "baker": {
    "encounter": {
      1: "Hope you're ready to taste defeat!"
    },
    "victory": {
      1: "I'll bake a comeback."
    },
  },
  "biker": {
    "encounter": {
      1: "Time to rev up and leave you in the dust!"
    },
    "victory": {
      1: "I'll tune up for the next race."
    },
  },
  "brock": {
    "encounter": {
      1: "My expertise on Rock-type Pokémon will take you down! Come on!",
      2: "My rock-hard willpower will overwhelm you!",
      3: "Allow me to show you the true strength of my Pokémon!"
    },
    "victory": {
      1: "Your Pokémon's strength have overcome my rock-hard defenses!",
      2: "The world is huge! I'm glad to have had a chance to battle you.",
      3: "Perhaps I should go back to pursuing my dream as a Pokémon Breeder…"
    },
    "defeat": {
      1: "The best offense is a good defense!\nThat's my way of doing things!",
      2: "Come study rocks with me next time to better learn how to fight them!",
      3: "Hah, all my traveling around the regions is paying off!"
    }
  },
  "misty": {
    "encounter": {
      1: "My policy is an all out offensive with Water-type Pokémon!",
      2: "Hiya, I'll show you the strength of my aquatic Pokémon!",
      3: "My dream was to go on a journey and battle powerful trainers…\nWill you be a sufficient challenge?"
    },
    "victory": {
      1: "You really are strong… I'll admit that you are skilled…",
      2: "Grrr… You know you just got lucky, right?!",
      3: "Wow, you're too much! I can't believe you beat me!"
    },
    "defeat": {
      1: "Was the mighty Misty too much for you?",
      2: "I hope you saw my Pokémon's elegant swimming techniques!",
      3: "Your Pokémon were no match for my pride and joys!"
    }
  },
  "lt_surge": {
    "encounter": {
      1: "My Electric Pokémon saved me during the war! I'll show you how!",
      2: "Ten-hut! I'll shock you into surrender!",
      3: "I'll zap you just like I do to all my enemies in battle!"
    },
    "victory": {
      1: "Whoa! Your team's the real deal, kid!",
      2: "Aaargh, you're strong! Even my electric tricks lost against you.",
      3: "That was an absolutely shocking loss!"
    },
    "defeat": {
      1: "Oh yeah! When it comes to Electric-type Pokémon, I'm number one in the world!",
      2: "Hahaha! That was an electrifying battle, kid!",
      3: "A Pokémon battle is war, and I have showed you first-hand combat!"
    }
  },
  "erika": {
    "encounter": {
      1: "Ah, the weather is lovely here…\nOh, a battle? Very well then.",
      2: "My Pokémon battling skills rival that of my flower arranging skills.",
      3: "Oh, I hope the pleasant aroma of my Pokémon doesn't put me to sleep again…",
      4: "Seeing flowers in a garden is so soothing."
    },
    "victory": {
      1: "Oh! I concede defeat.",
      2: "That match was most delightful.",
      3: "Ah, it appears it is my loss…",
      4: "Oh, my goodness."
    },
    "defeat": {
      1: "I was afraid I would doze off…",
      2: "Oh my, it seems my Grass Pokémon overwhelmed you.",
      3: "That battle was such a soothing experience.",
      4: "Oh… Is that all?"
    }
  },
  "janine": {
    "encounter": {
      1: "I am mastering the art of poisonous attacks.\nI shall spar with you today!",
      2: "Father trusts that I can hold my own.\nI will prove him right!",
      3: "My ninja techniques are only second to my Father's!\nCan you keep up?"
    },
    "victory": {
      1: "Even now, I still need training… I understand.",
      2: "Your battle technique has outmatched mine.",
      3: "I'm going to really apply myself and improve my skills."
    },
    "defeat": {
      1: "Fufufu… the poison has sapped all your strength to battle.",
      2: "Ha! You didn't stand a chance against my superior ninja skills!",
      3: "Father's faith in me has proven to not be misplaced."
    }
  },
  "sabrina": {
    "encounter": {
      1: "Through my psychic ability, I had a vision of your arrival!",
      2: "I dislike fighting, but if you wish, I will show you my powers!",
      3: "I can sense great ambition in you. I shall see if it not unfounded."
    },
    "victory": {
      1: "Your power… It far exceeds what I foresaw…",
      2: "I failed to accurately predict your power.",
      3: "Even with my immense psychic powers, I cannot sense another as strong as you."
    },
    "defeat": {
      1: "This victory… It is exactly as I foresaw in my visions!",
      2: "Perhaps it was another I sensed a great desire in…",
      3: "Hone your abilities before recklessly charging into battle.\nYou never know what the future may hold if you do…"
    }
  },
  "blaine": {
    "encounter": {
      1: "Hah! Hope you brought a Burn Heal!",
      2: "My fiery Pokémon will incinerate all challengers!",
      3: "Get ready to play with fire!"
    },
    "victory": {
      1: "I have burned down to nothing! Not even ashes remain!",
      2: "Didn't I stoke the flames high enough?",
      3: "I'm all burned out… But this makes my motivation to improve burn even hotter!"
    },
    "defeat": {
      1: "My raging inferno cannot be quelled!",
      2: "My Pokémon have been powered up with the heat from this victory!",
      3: "Hah! My passion burns brighter than yours!"
    }
  },
  "giovanni": {
    "encounter": {
      1: "I, the leader of Team Rocket, will make you feel a world of pain!",
      2: "My training here will be vital before I am to face my old associates again.",
      3: "I do not think you are prepared for the level of failure you are about to experience!"
    },
    "victory": {
      1: "WHAT! Me, lose?! There is nothing I wish to say to you!",
      2: "Hmph… You could never understand what I hope to achieve.",
      3: "This defeat is merely delaying the inevitable.\nI will rise Team Rocket from the ashes in due time."
    },
    "defeat": {
      1: "Not being able to measure your own strength shows that you are still but a child.",
      2: "Do not try to interfere with me again.",
      3: "I hope you understand how foolish challenging me was."
    }
  },
  "roxanne": {
    "encounter": {
      1: "Would you kindly demonstrate how you battle?",
      2: "You can learn many things by battling many trainers.",
      3: "Oh, you caught me strategizing.\nWould you like to battle?"
    },
    "victory": {
      1: "Oh, I appear to have lost.\nI understand.",
      2: "It seems that I still have so much more to learn when it comes to battle.",
      3: "I'll take what I learned here today to heart."
    },
    "defeat": {
      1: "I have learned many things from our battle.\nI hope you have too.",
      2: "I look forward to battling you again.\nI hope you'll use what you've learned here.",
      3: "I won due to everything I have learned."
    }
  },
  "brawly": {
    "encounter": {
      1: "Oh man, a challenger!\nLet's see what you can do!",
      2: "You seem like a big splash.\nLet's battle!",
      3: "Time to create a storm!\nLet's go!"
    },
    "victory": {
      1: "Oh woah, you've washed me out!",
      2: "You surfed my wave and crashed me down!",
      3: "I feel like I'm lost in Granite Cave!"
    },
    "defeat": {
      1: "Haha, I surfed the big wave!\nChallenge me again sometime.",
      2: "Surf with me again some time!",
      3: "Just like the tides come in and out, I hope you return to challenge me again."
    }
  },
  "wattson": {
    "encounter": {
      1: "Time to get shocked!\nWahahahaha!",
      2: "I'll make sparks fly!\nWahahahaha!",
      3: "I hope you brought Paralyz Heal!\nWahahahaha!"
    },
    "victory": {
      1: "Seems like I'm out of charge!\nWahahahaha!",
      2: "You've completely grounded me!\nWahahahaha!",
      3: "Thanks for the thrill!\nWahahahaha!"
    },
    "defeat": {
      1: "Recharge your batteries and challenge me again sometime!\nWahahahaha!",
      2: "I hope you found our battle electrifying!\nWahahahaha!",
      3: "Aren't you shocked I won?\nWahahahaha!"
    }
  },
  "flannery": {
    "encounter": {
      1: "Nice to meet you! Wait, no…\nI will crush you!",
      2: "I've only been a leader for a little while, but I'll smoke you!",
      3: "It's time to demonstrate the moves my grandfather has taught me! Let's battle!"
    },
    "victory": {
      1: "You remind me of my grandfather…\nNo wonder I lost.",
      2: "Am I trying too hard?\nI should relax, can't get too heated.",
      3: "Losing isn't going to smother me out.\nTime to reignite training!"
    },
    "defeat": {
      1: "I hope I've made my grandfather proud…\nLet's battle again some time.",
      2: "I…I can't believe I won!\nDoing things my way worked!",
      3: "Let's exchange burning hot moves again soon!"
    }
  },
  "norman": {
    "encounter": {
      1: "I'm surprised you managed to get here.\nLet's battle.",
      2: "I'll do everything in my power as a Gym Leader to win.\nLet's go!",
      3: "You better give this your all.\nIt's time to battle!"
    },
    "victory": {
      1: "I lost to you…?\nRules are rules, though.",
      2: "Was moving from Olivine a mistake…?",
      3: "I can't believe it.\nThat was a great match."
    },
    "defeat": {
      1: "We both tried our best.\nI hope we can battle again soon.",
      2: "You should try challenging my kid instead.\nYou might learn something!",
      3: "Thank you for the excellent battle.\nBetter luck next time."
    }
  },
  "winona": {
    "encounter": {
      1: "I've been soaring the skies looking for prey…\nAnd you're my target!",
      2: "No matter how our battle is, my Flying Pokémon and I will triumph with grace. Let's battle!",
      3: "I hope you aren't scared of heights.\nLet's ascend!"
    },
    "victory": {
      1: "You're the first Trainer I've seen with more grace than I.\nExcellently played.",
      2: "Oh, my Flying Pokémon have plummeted!\nVery well.",
      3: "Though I may have fallen, my Pokémon will continue to fly!"
    },
    "defeat": {
      1: "My Flying Pokémon and I will forever dance elegantly!",
      2: "I hope you enjoyed our show.\nOur graceful dance is finished.",
      3: "Won't you come see our elegant choreography again?"
    }
  },
  "tate": {
    "encounter": {
      1: "Hehehe…\nWere you surprised to see me without my sister?",
      2: "I can see what you're thinking…\nYou want to battle!",
      3: "How can you defeat someone…\nWho knows your every move?"
    },
    "victory": {
      1: "It can't be helped…\nI miss Liza…",
      2: "Your bond with your Pokémon was stronger than mine.",
      3: "If I were with Liza, we would have won.\nWe can finish each other's thoughts!"
    },
    "defeat": {
      1: "My Pokémon and I are superior!",
      2: "If you can't even defeat me, you'll never be able to defeat Liza either.",
      3: "It's all thanks to my strict training with Liza.\nI can make myself one with Pokémon."
    }
  },
  "liza": {
    "encounter": {
      1: "Fufufu…\nWere you surprised to see me without my brother?",
      2: "I can determine what you desire…\nYou want to battle, don't you?",
      3: "How can you defeat someone…\nWho's one with their Pokémon?"
    },
    "victory": {
      1: "It can't be helped…\nI miss Tate…",
      2: "Your bond with your Pokémon…\nIt's stronger than mine.",
      3: "If I were with Tate, we would have won.\nWe can finish each other's sentences!"
    },
    "defeat": {
      1: "My Pokémon and I are victorious.",
      2: "If you can't even defeat me, you'll never be able to defeat Tate either.",
      3: "It's all thanks to my strict training with Tate.\nI can synchronize myself with my Pokémon."
    }
  },
  "juan": {
    "encounter": {
      1: "Now's not the time to act coy.\nLet's battle!",
      2: "Ahahaha, You'll be witness to my artistry with Water Pokémon!",
      3: "A typhoon approaches!\nWill you be able to test me?",
      4: "Please, you shall bear witness to our artistry.\nA grand illusion of water sculpted by my Pokémon and myself!"
    },
    "victory": {
      1: "You may be a genius who can take on Wallace!",
      2: "I focused on elegance while you trained.\nIt's only natural that you defeated me.",
      3: "Ahahaha!\nVery well, You have won this time.",
      4: "From you, I sense the brilliant shine of skill that will overcome all."
    },
    "defeat": {
      1: "My Pokémon and I have sculpted an illusion of Water and come out victorious.",
      2: "Ahahaha, I have won, and you have lost.",
      3: "Shall I loan you my outfit? It may help you battle!\nAhahaha, I jest!",
      4: "I'm the winner! Which is to say, you lost."
    }
  },
  "crasher_wake": {
    "encounter": {
      1: "Crash! Crash! Watch out!\nCrasher Wake…is…heeere!",
      2: "Crash! Crash! Crasher Wake!",
      3: "I'm the tidal wave of power to wash you away!"
    },
    "victory": {
      1: "That puts a grin on my face!\nGuhahaha! That was a blast!",
      2: "Hunwah! It's gone and ended!\nHow will I say this…\nI want more! I wanted to battle a lot more!",
      3: "WHAAAAT!?"
    },
    "defeat": {
      1: "Yeeeeah! That's right!",
      2: "I won, but I want more! I wanted to battle a lot more!",
      3: "So long!"
    }
  },
  "falkner": {
    "encounter": {
      1: "I'll show you the real power of the magnificent bird Pokémon!",
      2: "Winds, stay with me!",
      3: "Dad! I hope you're watching me battle from above!"
    },
    "victory": {
      1: "I understand… I'll bow out gracefully.",
      2: "A defeat is a defeat. You are strong indeed.",
      3: "…Shoot! Yeah, I lost."
    },
    "defeat": {
      1: "Dad! I won with your cherished bird Pokémon…",
      2: "Bird Pokémon are the best after all!",
      3: "Feels like I'm catching up to my dad!"
    }
  },
  "nessa": {
    "encounter": {
      1: "No matter what kind of plan your refined mind may be plotting, my partner and I will be sure to sink it.",
      2: "I'm not here to chat. I'm here to win!",
      3: "This is a little gift from my Pokémon… I hope you can take it!"
    },
    "victory": {
      1: "You and your Pokémon are just too much…",
      2: "How…? How can this be?!",
      3: "I was totally washed away!"
    },
    "defeat": {
      1: "The raging wave crashes again!",
      2: "Time to ride the wave of victory!",
      3: "Ehehe!"
    }
  },
  "melony": {
    "encounter": {
      1: "I'm not going to hold back!",
      2: "All righty, I suppose we should get started.",
      3: "I'll freeze you solid!"
    },
    "victory": {
      1: "You… You're pretty good, huh?",
      2: "If you find Gordie around, be sure to give him a right trashing, would you?",
      3: "I think you took breaking the ice a little too literally…"
    },
    "defeat": {
      1: "Now do you see how severe battles can be?",
      2: "Hee! Looks like I went and won again!",
      3: "Are you holding back?"
    }
  },
  "marlon": {
    "encounter": {
      1: "You look strong! Shoots! Let's start!",
      2: "I'm strong like the ocean's wide. You're gonna get swept away, fo' sho'.",
      3: "Oh ho, so I'm facing you! That's off the wall."
    },
    "victory": {
      1: "You totally rocked that! You're raising some wicked Pokémon. You got this Trainer thing down!",
      2: "You don't just look strong, you're strong fo' reals! Eh, I was swept away, too!",
      3: "You're strong as a gnarly wave!"
    },
    "defeat": {
      1: "You're tough, but it's not enough to sway the sea, 'K!",
      2: "Hee! Looks like I went and won again!",
      3: "Sweet, sweet victory!"
    }
  },
  "shauntal": {
    "encounter": {
      1: "Excuse me. You're a challenger, right?\nI'm the Elite Four's Ghost-type Pokémon user, Shauntal, and I shall be your opponent.",
      2: "I absolutely love writing about Trainers who come here and the Pokémon they train.\nCould I use you and your Pokémon as a subject?",
      3: "Every person who works with Pokémon has a story to tell.\nWhat story is about to be told?"
    },
    "victory": {
      1: "Wow. I'm dumbstruck!",
      2: "S-sorry! First, I must apologize to my Pokémon…\n\nI'm really sorry you had a bad experience because of me!",
      3: "Even in light of that, I'm still one of the Elite Four!"
    },
    "defeat": {
      1: "Eheh.",
      2: "That gave me excellent material for my next novel!",
      3: "And so, another tale ends…"
    }
  },
  "marshal": {
    "encounter": {
      1: "My mentor, Alder, sees your potential as a Trainer and is taking an interest in you.\nIt is my intention to test you--to take you to the limits of your strength. Kiai!",
      2: "Victory, decisive victory, is my intention! Challenger, here I come!",
      3: "In myself, I seek to develop the strength of a fighter and shatter any weakness in myself!\nPrevailing with the force of my convictions!"
    },
    "victory": {
      1: "Whew! Well done!",
      2: "As your battles continue, aim for even greater heights!",
      3: "The strength shown by you and your Pokémon has deeply impressed me…"
    },
    "defeat": {
      1: "Hmm.",
      2: "That was good battle.",
      3: "Haaah! Haaah! Haiyaaaah!"
    }
  },
  "cheren": {
    "encounter": {
      1: "You remind me of an old friend. That makes me excited about this Pokémon battle!",
      2: `Pokémon battles have no meaning if you don't think why you battle. 
      $Or better said, it makes battling together with Pokémon meaningless.`,
      3: "My name's Cheren! I'm a Gym Leader and a teacher! Pleasure to meet you."
    },
    "victory": {
      1: "Thank you! I saw what was missing in me.",
      2: "Thank you! I feel like I saw a little of the way toward my ideals.",
      3: "Hmm… This is problematic."
    },
    "defeat": {
      1: "As a Gym Leader, I aim to be a wall for you to overcome.",
      2: "All right!",
      3: "I made it where I am because Pokémon were by my side.\nPerhaps we need to think about why Pokémon help us not in terms of Pokémon and Trainers but as a relationship between living beings."
    }
  },
  "chili": {
    "encounter": {
      1: "Yeeeeooow! Time to play with FIRE!! I'm the strongest of us brothers!",
      2: "Ta-da! The Fire-type scorcher Chili--that's me--will be your opponent!",
      3: "I'm going to show you what me and my blazing Fire types can do!"
    },
    "victory": {
      1: "You got me. I am… burned… out…",
      2: "Whoa ho! You're on fire!",
      3: "Augh! You got me!"
    },
    "defeat": {
      1: "I'm on fire! Play with me, and you'll get burned!",
      2: "When you play with fire, you get burned!",
      3: "I mean, c'mon, your opponent was me! You didn't have a chance!"
    }
  },
  "cilan": {
    "encounter": {
      1: `Nothing personal... No hard feelings... Me and my Grass-type Pokémon will...
               $Um... We're gonna battle come what may.`,
      2: "So, um, if you're OK with me, I'll, um, put everything I've got into being, er, you know, your opponent.",
      3: "OK… So, um, I'm Cilan, I like Grass-type Pokémon."
    },
    "victory": {
      1: "Er… Is it over now?",
      2: `…What a surprise. You are very strong, aren't you? 
               $I guess my brothers wouldn't have been able to defeat you either…`,
      3: "…Huh. Looks like my timing was, um, off?"
    },
    "defeat": {
      1: "Huh? Did I win?",
      2: `I guess… 
                $I suppose I won, because I've been competing with my brothers Chili and Cress, and we all were able to get tougher.`,
      3: "It…it was quite a thrilling experience…"
    }
  },
  "roark": {
    "encounter": {
      1: "I need to see your potential as a Trainer. And, I'll need to see the toughness of the Pokémon that battle with you!",
      2: "Here goes! These are my rocking Pokémon, my pride and joy!",
      3: "Rock-type Pokémon are simply the best!",
      4: "I need to see your potential as a Trainer. And, I'll need to see the toughness of the Pokémon that battle with you!"
    },
    "victory": {
      1: "W-what? That can't be! My buffed-up Pokémon!",
      2: "…We lost control there. Next time I'd like to challenge you to a Fossil-digging race underground.",
      3: "With skill like yours, it's natural for you to win.",
      4: "Wh-what?! It can't be! Even that wasn't enough?",
      5: "I blew it."
    },
    "defeat": {
      1: "See? I'm proud of my rocking battle style!",
      2: "Thanks! The battle gave me confidence that I may be able to beat my dad!",
      3: "I feel like I just smashed through a really stubborn boulder!"
    }
  },
  "morty": {
    "encounter": {
      1: `With a little more, I could see a future in which I meet the legendary Pokémon.
                $You're going to help me reach that level!`,
      2: `It's said that a rainbow-hued Pokémon will come down to appear before a truly powerful Trainer. 
                $I believed that tale, so I have secretly trained here all my life. As a result, I can now see what others cannot. 
                $I see a shadow of the person who will make the Pokémon appear. 
                $I believe that person is me! You're going to help me reach that level!`,
      3: "Whether you choose to believe or not, mystic power does exist.",
      4: "You can bear witness to the fruits of my training.",
      5: "You must make your soul one with that of Pokémon. Can you do this?",
      6: "Say, do you want to be part of my training?"
    },
    "victory": {
      1: "I'm not good enough yet…",
      2: `I see… Your journey has taken you to far-away places and you have witnessed much more than I.
                $I envy you for that…`,
      3: "How is this possible…",
      4: `I don't think our potentials are so different.
                $But you seem to have something more than that… So be it.`,
      5: "Guess I need more training.",
      6: "That's a shame."
    },
    "defeat": {
      1: "I moved… one step ahead again.",
      2: "Fufufu…",
      3: "Wh-what?! It can't be! Even that wasn't enough?",
      4: "I feel like I just smashed through a really stubborn boulder!",
      5: "Ahahahah!",
      6: "I knew I would win!"
    }
  },
  "crispin": {
    "encounter": {
      1: "I wanna win, so that's exactly what I'll do!",
      2: "I battle because I wanna battle! And you know what? That's how it should be!"
    },
    "victory": {
      1: "I wanted to win…but I lost!",
      2: "I lost…'cause I couldn't win!"
    },
    "defeat": {
      1: "Hey, wait a sec. Did I just win? I think I just won! Talk about satisfying!",
      2: "Wooo! That was amazing!"
    }
  },
  "amarys": {
    "encounter": {
      1: `I want to be the one to help a certain person. That being the case, I cannot afford to lose.
                $… Our battle starts now.`,
    },
    "victory": {
      1: "I am… not enough, I see."
    },
    "defeat": {
      1: "Victory belongs to me. Well fought."
    }
  },
  "lacey": {
    "encounter": {
      1: "I'll be facing you with my usual party as a member of the Elite Four."
    },
    "victory": {
      1: "That was a great battle!"
    },
    "defeat": {
      1: "Let's give your Pokémon a nice round of applause for their efforts!"
    }
  },
  "drayton": {
    "encounter": {
      1: `Man, I love chairs. Don't you love chairs? What lifesavers. 
                $I don't get why everyone doesn't just sit all the time. Standing up's tiring work!`,
    },
    "victory": {
      1: "Guess I should've expected that!"
    },
    "defeat": {
      1: "Heh heh! Don't mind me, just scooping up a W over here. I get it if you're upset, but don't go full Kieran on me, OK?"
    }
  },
  "ramos": {
    "encounter": {
      1: `Did yeh enjoy the garden playground I made with all these sturdy plants o' mine?
                $Their strength is a sign o' my strength as a gardener and a Gym Leader! Yeh sure yer up to facing all that?`,
    },
    "victory": {
      1: "Yeh believe in yer Pokémon… And they believe in yeh, too… It was a fine battle, sprout."
    },
    "defeat": {
      1: "Hohoho… Indeed. Frail little blades o' grass'll break through even concrete."
    }
  },
  "viola": {
    "encounter": {
      1: `Whether it's the tears of frustration that follow a loss or the blossoming of joy that comes with victory…
                $They're both great subjects for my camera! Fantastic! This'll be just fantastic! 
                $Now come at me!`,
      2: "My lens is always focused on victory--I won't let anything ruin this shot!"
    },
    "victory": {
      1: "You and your Pokémon have shown me a whole new depth of field! Fantastic! Just fantastic!",
      2: `The world you see through a lens, and the world you see with a Pokémon by your side…
                $The same world can look entirely different depending on your view.`
    },
    "defeat": {
      1: "The photo from the moment of my victory will be a real winner, all right!",
      2: "Yes! I took some great photos!"
    }
  },
  "candice": {
    "encounter": {
      1: `You want to challenge Candice? Sure thing! I was waiting for someone tough! 
                $But I should tell you, I'm tough because I know how to focus.`,
      2: `Pokémon, fashion, romance… It's all about focus! 
                $I'll show you just what I mean. Get ready to lose!`
    },
    "victory": {
      1: "I must say, I'm warmed up to you! I might even admire you a little.",
      2: `Wow! You're great! You've earned my respect! 
                $I think your focus and will bowled us over totally. `
    },
    "defeat": {
      1: "I sensed your will to win, but I don't lose!",
      2: "See? Candice's focus! My Pokémon's focus is great, too!"
    }
  },
  "gardenia": {
    "encounter": {
      1: "You have a winning aura about you. So, anyway, this will be fun. Let's have our battle!"
    },
    "victory": {
      1: "Amazing! You're very good, aren't you?"
    },
    "defeat": {
      1: "Yes! My Pokémon and I are perfectly good!"
    }
  },
  "aaron": {
    "encounter": {
      1: "Ok! Let me take you on!"
    },
    "victory": {
      1: "Battling is a deep and complex affair…"
    },
    "defeat": {
      1: "Victory over an Elite Four member doesn't come easily."
    }
  },
  "cress": {
    "encounter": {
      1: "That is correct! It shall be I and my esteemed Water types that you must face in battle!"
    },
    "victory": {
      1: "Lose? Me? I don't believe this."
    },
    "defeat": {
      1: "This is the appropriate result when I'm your opponent."
    }
  },
  "allister": {
    "encounter": {
      1: "'M Allister.\nH-here… I go…"
    },
    "victory": {
      1: `I nearly lost my mask from the shock… That was…
                $Wow. I can see your skill for what it is.`,
    },
    "defeat": {
      1: "Th-that was ace!"
    }
  },
  "clay": {
    "encounter": {
      1: "Harrumph! Kept me waitin', didn't ya, kid? All right, time to see what ya can do!"
    },
    "victory": {
      1: "Man oh man… It feels good to go all out and still be defeated!"
    },
    "defeat": {
      1: `What's important is how ya react to losin'. 
                $That's why folks who use losin' as fuel to get better are tough.`,
    }
  },
  "kofu": {
    "encounter": {
      1: "I'mma serve you a full course o' Water-type Pokémon! Don't try to eat 'em, though!"
    },
    "victory": {
      1: "Vaultin' Veluza! Yer a lively one, aren't ya! A little TOO lively, if I do say so myself!"
    },
    "defeat": {
      1: "You come back to see me again now, ya hear?"
    }
  },
  "tulip": {
    "encounter": {
      1: "Allow me to put my skills to use to make your cute little Pokémon even more beautiful!"
    },
    "victory": {
      1: "Your strength has a magic to it that cannot be washed away."
    },
    "defeat": {
      1: "You know, in my line of work, people who lack talent in one area or the other often fade away quickly—never to be heard of again."
    }
  },
  "sidney": {
    "encounter": {
      1: `I like that look you're giving me. I guess you'll give me a good match.
                $That's good! Looking real good! All right!
                $You and me, let's enjoy a battle that can only be staged here!`,
    },
    "victory": {
      1: "Well, how do you like that? I lost! Eh, it was fun, so it doesn't matter."
    },
    "defeat": {
      1: "No hard feelings, alright?"
    }
  },
  "phoebe": {
    "encounter": {
      1: `While I trained, I gained the ability to commune with Ghost-type Pokémon. 
                $Yes, the bond I developed with Pokémon is extremely tight. 
                $So, come on, just try and see if you can even inflict damage on my Pokémon!`,
    },
    "victory": {
      1: "Oh, darn. I've gone and lost."
    },
    "defeat": {
      1: "I look forward to battling you again sometime!"
    }
  },
  "glacia": {
    "encounter": {
      1: `All I have seen are challenges by weak Trainers and their Pokémon. 
                $What about you? It would please me to no end if I could go all out against you!`,
    },
    "victory": {
      1: `You and your Pokémon… How hot your spirits burn!
                $The all-consuming heat overwhelms. 
                $It's no surprise that my icy skills failed to harm you.`,
    },
    "defeat": {
      1: "A fiercely passionate battle, indeed."
    }
  },
  "drake": {
    "encounter": {
      1: `For us to battle with Pokémon as partners, do you know what it takes? Do you know what is needed? 
                $If you don't, then you will never prevail over me!`,
    },
    "victory": {
      1: "Superb, it should be said."
    },
    "defeat": {
      1: "I gave my all for that battle!"
    }
  },
  "wallace": {
    "encounter": {
      1: `There's something about you… A difference in your demeanor. 
                $I think I sense that in you. Now, show me. Show me the power you wield with your Pokémon. 
                $And I, in turn, shall present you with a performance of illusions in water by me and my Pokémon!`,
    },
    "victory": {
      1: `Bravo. I realize now your authenticity and magnificence as a Pokémon Trainer. 
                    $I find much joy in having met you and your Pokémon. You have proven yourself worthy.`,
    },
    "defeat": {
      1: "A grand illusion!"
    }
  },
  "lorelei": {
    "encounter": {
      1: `No one can best me when it comes to icy Pokémon! Freezing moves are powerful!
                $Your Pokémon will be at my mercy when they are frozen solid! Hahaha! Are you ready?`,
    },
    "victory": {
      1: "How dare you!"
    },
    "defeat": {
      1: "There's nothing you can do once you're frozen."
    }
  },
  "will": {
    "encounter": {
      1: `I have trained all around the world, making my psychic Pokémon powerful.
                $I can only keep getting better! Losing is not an option!`,
    },
    "victory": {
      1: "I… I can't… believe it…"
    },
    "defeat": {
      1: "That was close. I wonder what it is that you lack."
    }
  },
  "malva": {
    "encounter": {
      1: `I feel like my heart might just burst into flames. 
                $I'm burning up with my hatred for you, runt!`,
    },
    "victory": {
      1: "What news… So a new challenger has defeated Malva!"
    },
    "defeat": {
      1: "I am delighted! Yes, delighted that I could squash you beneath my heel."
    }
  },
  "hala": {
    "encounter": {
      1: "Old Hala is here to make you holler!"
    },
    "victory": {
      1: "I could feel the power you gained on your journey."
    },
    "defeat": {
      1: "Haha! What a delightful battle!"
    }
  },
  "molayne": {
    "encounter": {
      1: `I gave the captain position to my cousin Sophocles, but I'm confident in my ability. 
                $My strength is like that of a supernova!`,
    },
    "victory": {
      1: "I certainly found an interesting Trainer to face!"
    },
    "defeat": {
      1: "Ahaha. What an interesting battle."
    }
  },
  "rika": {
    "encounter": {
      1: "I'd say I'll go easy on you, but… I'd be lying! Think fast!"
    },
    "victory": {
      1: "Not bad, kiddo."
    },
    "defeat": {
      1: "Nahahaha! You really are something else, kiddo!"
    }
  },
  "bruno": {
    "encounter": {
      1: "We will grind you down with our superior power! Hoo hah!"
    },
    "victory": {
      1: "Why? How could I lose?"
    },
    "defeat": {
      1: "You can challenge me all you like, but the results will never change!"
    }
  },
  "bugsy": {
    "encounter": {
      1: `Whoa, amazing! You're an expert on Pokémon! 
                $My research isn't complete yet. OK, you win.`,
    },
    "victory": {
      1: "Whoa, amazing! You're an expert on Pokémon!\nMy research isn't complete yet. OK, you win."
    },
    "defeat": {
      1: "Thanks! Thanks to our battle, I was also able to make progress in my research!"
    }
  },
  "koga": {
    "encounter": {
      1: "Fwahahahaha! Pokémon are not merely about brute force--you shall see soon enough!"
    },
    "victory": {
      1: "Ah! You've proven your worth!"
    },
    "defeat": {
      1: "Have you learned to fear the techniques of the ninja?"
    }
  },
  "bertha": {
    "encounter": {
      1: "Well, would you show this old lady how much you've learned?"
    },
    "victory": {
      1: `Well! Dear child, I must say, that was most impressive. 
                $Your Pokémon believed in you and did their best to earn you the win. 
                $Even though I've lost, I find myself with this silly grin!`,
    },
    "defeat": {
      1: "Hahahahah! Looks like this old lady won!"
    }
  },
  "lenora": {
    "encounter": {
      1: "Well then, challenger, I'm going to research how you battle with the Pokémon you've so lovingly raised!"
    },
    "victory": {
      1: "My theory about you was correct. You're more than just talented… You're motivated! I salute you!"
    },
    "defeat": {
      1: "Ah ha ha! If you lose, make sure to analyze why, and use that knowledge in your next battle!"
    }
  },
  "siebold": {
    "encounter": {
      1: "As long as I am alive, I shall strive onward to seek the ultimate cuisine... and the strongest opponents in battle!"
    },
    "victory": {
      1: "I shall store my memory of you and your Pokémon forever away within my heart."
    },
    "defeat": {
      1: `Our Pokémon battle was like food for my soul. It shall keep me going. 
                $That is how I will pay my respects to you for giving your all in battle!`,
    }
  },
  "roxie": {
    "encounter": {
      1: "Get ready! I'm gonna knock some sense outta ya!"
    },
    "victory": {
      1: "Wild! Your reason's already more toxic than mine!"
    },
    "defeat": {
      1: "Hey, c'mon! Get serious! You gotta put more out there!"
    }
  },
  "olivia": {
    "encounter": {
      1: "No introduction needed here. Time to battle me, Olivia!"
    },
    "victory": {
      1: "Really lovely… Both you and your Pokémon…"
    },
    "defeat": {
      1: "Mmm-hmm."
    }
  },
  "poppy": {
    "encounter": {
      1: "Oooh! Do you wanna have a Pokémon battle with me?"
    },
    "victory": {
      1: "Uagh?! Mmmuuuggghhh…"
    },
    "defeat": {
      1: `Yaaay! I did it! I de-feet-ed you! You can come for… For… An avenge match? 
                $Come for an avenge match anytime you want!`,
    }
  },
  "agatha": {
    "encounter": {
      1: "Pokémon are for battling! I'll show you how a real Trainer battles!"
    },
    "victory": {
      1: "Oh my! You're something special, child!"
    },
    "defeat": {
      1: "Bahaha. That's how a proper battle's done!"
    }
  },
  "flint": {
    "encounter": {
      1: "Hope you're warmed up, cause here comes the Big Bang!"
    },
    "victory": {
      1: "Incredible! Your moves are so hot, they make mine look lukewarm!"
    },
    "defeat": {
      1: "Huh? Is that it? I think you need a bit more passion."
    }
  },
  "grimsley": {
    "encounter": {
      1: "The winner takes everything, and there's nothing left for the loser."
    },
    "victory": {
      1: "When one loses, they lose everything… The next thing I'll look for will be victory, too!"
    },
    "defeat": {
      1: "If somebody wins, the person who fought against that person will lose."
    }
  },
  "caitlin": {
    "encounter": {
      1: `It's me who appeared when the flower opened up. You who have been waiting…
                $You look like a Pokémon Trainer with refined strength and deepened kindness. 
                $What I look for in my opponent is superb strength… 
                $Please unleash your power to the fullest!`,
    },
    "victory": {
      1: "My Pokémon and I learned so much! I offer you my thanks."
    },
    "defeat": {
      1: "I aspire to claim victory with elegance and grace."
    }
  },
  "diantha": {
    "encounter": {
      1: `Battling against you and your Pokémon, all of you brimming with hope for the future… 
                $Honestly, it just fills me up with energy I need to keep facing each new day! It does!`,
    },
    "victory": {
      1: "Witnessing the noble spirits of you and your Pokémon in battle has really touched my heart…"
    },
    "defeat": {
      1: "Oh, fantastic! What did you think? My team was pretty cool, right?"
    }
  },
  "wikstrom": {
    "encounter": {
      1: `Well met, young challenger! Verily am I the famed blade of hardened steel, Duke Wikstrom! 
                $Let the battle begin! En garde!`,
    },
    "victory": {
      1: "Glorious! The trust that you share with your honorable Pokémon surpasses even mine!"
    },
    "defeat": {
      1: `What manner of magic is this? My heart, it doth hammer ceaselessly in my breast! 
                $Winning against such a worthy opponent doth give my soul wings--thus do I soar!`,
    }
  },
  "acerola": {
    "encounter": {
      1: "Battling is just plain fun! Come on, I can take you!"
    },
    "victory": {
      1: "I'm… I'm speechless! How did you do it?!"
    },
    "defeat": {
      1: "Ehaha! What an amazing victory!"
    }
  },
  "larry_elite": {
    "encounter": {
      1: `Hello there… It's me, Larry.
                $I serve as a member of the Elite Four too, yes… Unfortunately for me.`,
    },
    "victory": {
      1: "Well, that took the wind from under our wings…"
    },
    "defeat": {
      1: "It's time for a meeting with the boss."
    }
  },
  "lance": {
    "encounter": {
      1: "I've been waiting for you. Allow me to test your skill.",
      2: "I thought that you would be able to get this far. Let's get this started."
    },
    "victory": {
      1: "You got me. You are magnificent!",
      2: "I never expected another trainer to beat me… I'm surprised."
    },
    "defeat": {
      1: "That was close. Want to try again?",
      2: "It's not that you are weak. Don't let it bother you."
    }
  },
  "karen": {
    "encounter": {
      1: "I am Karen. Would you care for a showdown with my Dark-type Pokémon?",
      2: "I am unlike those you've already met.",
      3: "You've assembled a charming team. Our battle should be a good one."
    },
    "victory": {
      1: "No! I can't win. How did you become so strong?",
      2: "I will not stray from my chosen path.",
      3: "The Champion is looking forward to meeting you."
    },
    "defeat": {
      1: "That's about what I expected.",
      2: "Well, that was relatively entertaining.",
      3: "Come visit me anytime."
    }
  },
  "milo": {
    "encounter": {
      1: `Sure seems like you understand Pokémon real well. 
               $This is gonna be a doozy of a battle! 
               $I'll have to Dynamax my Pokémon if I want to win!`,
    },
    "victory": {
      1: "The power of Grass has wilted… What an incredible Challenger!"
    },
    "defeat": {
      1: "This'll really leave you in shock and awe."
    }
  },
  "lucian": {
    "encounter": {
      1: `Just a moment, please. The book I'm reading has nearly reached its thrilling climax… 
                $The hero has obtained a mystic sword and is about to face their final trial… Ah, never mind. 
                $Since you've made it this far, I'll put that aside and battle you. 
                $Let me see if you'll achieve as much glory as the hero of my book!,`
    },
    "victory": {
      1: "I see… It appears you've put me in checkmate."
    },
    "defeat": {
      1: "I have a reputation to uphold."
    }
  },
  "drasna": {
    "encounter": {
      1: `You must be a strong Trainer. Yes, quite strong indeed…
                $That's just wonderful news! Facing opponents like you and your team will make my Pokémon grow like weeds!`
    },
    "victory": {
      1: "Oh, dear me. That sure was a quick battle… I do hope you'll come back again sometime!"
    },
    "defeat": {
      1: "How can this be?"
    }
  },
  "kahili": {
    "encounter": {
      1: "So, here you are… Why don't we see who the winds favor today, you… Or me?"
    },
    "victory": {
      1: "It's frustrating to me as a member of the Elite Four, but it seems your strength is the real deal."
    },
    "defeat": {
      1: "That was an ace!"
    }
  },
  "hassel": {
    "encounter": {
      1: "Prepare to learn firsthand how the fiery breath of ferocious battle feels!"
    },
    "victory": {
      1: `Fortune smiled on me this time, but… 
                $Judging from how the match went, who knows if I will be so lucky next time.`,
    },
    "defeat": {
      1: "That was an ace!"
    }
  },
  "blue": {
    "encounter": {
      1: "You must be pretty good to get this far."
    },
    "victory": {
      1: "I've only lost to him and now to you… Him? Hee, hee…"
    },
    "defeat": {
      1: "See? My power is what got me here."
    }
  },
  "piers": {
    "encounter": {
      1: "Get ready for a mosh pit with me and my party! Spikemuth, it's time to rock!"
    },
    "victory": {
      1: "Me an' my team gave it our best. Let's meet up again for a battle some time…"
    },
    "defeat": {
      1: "My throat's ragged from shoutin'… But 'at was an excitin' battle!"
    }
  },
  "red": {
    "encounter": {
      1: "…!"
    },
    "victory": {
      1: "…?"
    },
    "defeat": {
      1: "…!"
    }
  },
  "jasmine": {
    "encounter": {
      1: "Oh… Your Pokémon are impressive. I think I will enjoy this."
    },
    "victory": {
      1: "You are truly strong. I'll have to try much harder, too."
    },
    "defeat": {
      1: "I never expected to win."
    }
  },
  "lance_champion": {
    "encounter": {
      1: "I am still the Champion. I won't hold anything back."
    },
    "victory": {
      1: "This is the emergence of a new Champion."
    },
    "defeat": {
      1: "I successfully defended my Championship."
    }
  },
  "steven": {
    "encounter": {
      1: `Tell me… What have you seen on your journey with your Pokémon? 
                $What have you felt, meeting so many other Trainers out there? 
                $Traveling this rich land… Has it awoken something inside you? 
                $I want you to come at me with all that you've learned. 
                $My Pokémon and I will respond in turn with all that we know!`,
    },
    "victory": {
      1: "So I, the Champion, fall in defeat…"
    },
    "defeat": {
      1: "That was time well spent! Thank you!"
    }
  },
  "cynthia": {
    "encounter": {
      1: "I, Cynthia, accept your challenge! There won't be any letup from me!"
    },
    "victory": {
      1: "No matter how fun the battle is, it will always end sometime…"
    },
    "defeat": {
      1: "Even if you lose, never lose your love of Pokémon."
    }
  },
  "iris": {
    "encounter": {
      1: `Know what? I really look forward to having serious battles with strong Trainers! 
                $I mean, come on! The Trainers who make it here are Trainers who desire victory with every fiber of their being! 
                #And they are battling alongside Pokémon that have been through countless difficult battles! 
                $If I battle with people like that, not only will I get stronger, my Pokémon will, too! 
                $And we'll get to know each other even better! OK! Brace yourself! 
                $I'm Iris, the Pokémon League Champion, and I'm going to defeat you!`,
    },
    "victory": {
      1: "Aghhhh… I did my best, but we lost…"
    },
    "defeat": {
      1: "Yay! We won!"
    }
  },
  "hau": {
    "encounter": {
      1: `I wonder if a Trainer battles differently depending on whether they're from a warm region or a cold region.
                $Let's test it out!`,
    },
    "victory": {
      1: "That was awesome! I think I kinda understand your vibe a little better now!"
    },
    "defeat": {
      1: "Ma-an, that was some kinda battle!"
    }
  },
  "geeta": {
    "encounter": {
      1: `I decided to throw my hat in the ring once more. 
                $Come now… Show me the fruits of your training.`,
      "victory": {
        1: "I eagerly await news of all your achievements!"
      },
      "defeat": {
        1: "What's the matter? This isn't all, is it?"
      }
    },
  },
  "nemona": {
    "encounter": {
      1: "Yesss! I'm so psyched! Time for us to let loose!"
    },
    "victory": {
      1: "Well, that stinks, but I still had fun! I'll getcha next time!"
    },
    "defeat": {
      1: "Well, that was a great battle! Fruitful for sure."
    }
  },
  "leon": {
    "encounter": {
      1: "We're gonna have an absolutely champion time!"
    },
    "victory": {
      1: `My time as Champion is over… 
                $But what a champion time it's been! 
                $Thank you for the greatest battle I've ever had!`,
    },
    "defeat": {
      1: "An absolute champion time, that was!"
    }
  },
  "whitney": {
    "encounter": {
      1: "Hey! Don't you think Pokémon are, like, super cute?"
    },
    "victory": {
      1: "Waaah! Waaah! You're so mean!"
    },
    "defeat": {
      1: "And that's that!"
    }
  },
  "chuck": {
    "encounter": {
      1: "Hah! You want to challenge me? Are you brave or just ignorant?"
    },
    "victory": {
      1: "You're strong! Would you please make me your apprentice?"
    },
    "defeat": {
      1: "There. Do you realize how much more powerful I am than you?"
    }
  },
  "katy": {
    "encounter": {
      1: "Don't let your guard down unless you would like to find yourself knocked off your feet!"
    },
    "victory": {
      1: "All of my sweet little Pokémon dropped like flies!"
    },
    "defeat": {
      1: "Eat up, my cute little Vivillon!"
    }
  },
  "pryce": {
    "encounter": {
      1: "Youth alone does not ensure victory! Experience is what counts."
    },
    "victory": {
      1: "Outstanding! That was perfect. Try not to forget what you feel now."
    },
    "defeat": {
      1: "Just as I envisioned."
    }
  },
  "clair": {
    "encounter": {
      1: "Do you know who I am? And you still dare to challenge me?"
    },
    "victory": {
      1: "I wonder how far you can get with your skill level. This should be fascinating."
    },
    "defeat": {
      1: "That's that."
    }
  },
  "maylene": {
    "encounter": {
      1: `I've come to challenge you now, and I won't hold anything back. 
                    $Please prepare yourself for battle!`,
    },
    "victory": {
      1: "I admit defeat…"
    },
    "defeat": {
      1: "That was awesome."
    }
  },
  "fantina": {
    "encounter": {
      1: `You shall challenge me, yes? But I shall win. 
                    $That is what the Gym Leader of Hearthome does, non?`,
    },
    "victory": {
      1: "You are so fantastically strong. I know why I have lost."
    },
    "defeat": {
      1: "I am so, so, very happy!"
    }
  },
  "byron": {
    "encounter": {
      1: `Trainer! You're young, just like my son, Roark. 
                    $With more young Trainers taking charge, the future of Pokémon is bright! 
                    $So, as a wall for young people, I'll take your challenge!`,
    },
    "victory": {
      1: "Hmm! My sturdy Pokémon--defeated!"
    },
    "defeat": {
      1: "Gwahahaha! How were my sturdy Pokémon?!"
    }
  },
  "olympia": {
    "encounter": {
      1: "An ancient custom deciding one's destiny. The battle begins!"
    },
    "victory": {
      1: "Create your own path. Let nothing get in your way. Your fate, your future."
    },
    "defeat": {
      1: "Our path is clear now."
    }
  },
  "volkner": {
    "encounter": {
      1: `Since you've come this far, you must be quite strong…
                    $I hope you're the Trainer who'll make me remember how fun it is to battle!`,
    },
    "victory": {
      1: `You've got me beat…
                    $Your desire and the noble way your Pokémon battled for you… 
                    $I even felt thrilled during our match. That was a very good battle.`,
    },
    "defeat": {
      1: `It was not shocking at all… 
                    $That is not what I wanted!`,
    }
  },
  "burgh": {
    "encounter": {
      1: `M'hm… If I win this battle, I feel like I can draw a picture unlike any before it. 
                    $OK! I can hear my battle muse loud and clear. Let's get straight to it!`,
      2: `Of course, I'm really proud of all of my Pokémon! 
                    $Well now… Let's get right to it!`
    },
    "victory": {
      1: "Is it over? Has my muse abandoned me?",
      2: "Hmm… It's over! You're incredible!"
    },
    "defeat": {
      1: "Wow… It's beautiful somehow, isn't it…",
      2: `Sometimes I hear people say something was an ugly win. 
                    $I think if you're trying your best, any win is beautiful.`
    }
  },
  "elesa": {
    "encounter": {
      1: `C'est fini! When I'm certain of that, I feel an electric jolt run through my body! 
                    $I want to feel the sensation, so now my beloved Pokémon are going to make your head spin!`,
    },
    "victory": {
      1: "I meant to make your head spin, but you shocked me instead."
    },
    "defeat": {
      1: "That was unsatisfying somehow… Will you give it your all next time?"
    }
  },
  "skyla": {
    "encounter": {
      1: `It's finally time for a showdown! That means the Pokémon battle that decides who's at the top, right? 
                    $I love being on the summit! 'Cause you can see forever and ever from high places! 
                    $So, how about you and I have some fun?`,
    },
    "victory": {
      1: "Being your opponent in battle is a new source of strength to me. Thank you!"
    },
    "defeat": {
      1: "Win or lose, you always gain something from a battle, right?"
    }
  },
  "brycen": {
    "encounter": {
      1: `There is also strength in being with other people and Pokémon. 
                    $Receiving their support makes you stronger. I'll show you this power!`,
    },
    "victory": {
      1: "The wonderful combination of you and your Pokémon! What a beautiful friendship!"
    },
    "defeat": {
      1: "Extreme conditions really test you and train you!"
    }
  },
  "drayden": {
    "encounter": {
      1: `What I want to find is a young Trainer who can show me a bright future. 
                    $Let's battle with everything we have: your skill, my experience, and the love we've raised our Pokémon with!`,
    },
    "victory": {
      1: "This intense feeling that floods me after a defeat… I don't know how to describe it."
    },
    "defeat": {
      1: "Harrumph! I know your ability is greater than that!"
    }
  },
  "grant": {
    "encounter": {
      1: `There is only one thing I wish for. 
                    $That by surpassing one another, we find a way to even greater heights.`,
    },
    "victory": {
      1: "You are a wall that I am unable to surmount!"
    },
    "defeat": {
      1: `Do not give up. 
                    $That is all there really is to it. 
                    $The most important lessons in life are simple.`,
    }
  },
  "korrina": {
    "encounter": {
      1: "Time for Lady Korrina's big appearance!"
    },
    "victory": {
      1: "It's your very being that allows your Pokémon to evolve!"
    },
    "defeat": {
      1: "What an explosive battle!"
    }
  },
  "clemont": {
    "encounter": {
      1: "Oh! I'm glad that we got to meet!"
    },
    "victory": {
      1: "Your passion for battle inspires me!"
    },
    "defeat": {
      1: "Looks like my Trainer-Grow-Stronger Machine, Mach 2 is really working!"
    }
  },
  "valerie": {
    "encounter": {
      1: `Oh, if it isn't a young Trainer… It is lovely to get to meet you like this. 
                    $Then I suppose you have earned yourself the right to a battle, as a reward for your efforts. 
                    $The elusive Fairy may appear frail as the breeze and delicate as a bloom, but it is strong.`,
    },
    "victory": {
      1: "I hope that you will find things worth smiling about tomorrow…"
    },
    "defeat": {
      1: "Oh goodness, what a pity…"
    }
  },
  "wulfric": {
    "encounter": {
      1: `You know what? We all talk big about what you learn from battling and bonds and all that…
                    $But really, I just do it 'cause it's fun. 
                    $Who cares about the grandstanding? Let's get to battling!`,
    },
    "victory": {
      1: "Outstanding! I'm tough as an iceberg, but you smashed me through and through!"
    },
    "defeat": {
      1: "Tussle with me and this is what happens!"
    }
  },
  "kabu": {
    "encounter": {
      1: `Every Trainer and Pokémon trains hard in pursuit of victory. 
                    $But that means your opponent is also working hard to win. 
                    $In the end, the match is decided by which side is able to unleash their true potential.`,
    },
    "victory": {
      1: "I'm glad I could battle you today!"
    },
    "defeat": {
      1: "That's a great way for me to feel my own growth!"
    }
  },
  "bea": {
    "encounter": {
      1: `Do you have an unshakable spirit that won't be moved, no matter how you are attacked? 
                    $I think I'll just test that out, shall I?`,
    },
    "victory": {
      1: "I felt the fighting spirit of your Pokémon as you led them in battle."
    },
    "defeat": {
      1: "That was the best sort of match anyone could ever hope for."
    }
  },
  "opal": {
    "encounter": {
      1: "Let me have a look at how you and your partner Pokémon behave!"
    },
    "victory": {
      1: "Your pink is still lacking, but you're an excellent Trainer with excellent Pokémon."
    },
    "defeat": {
      1: "Too bad for you, I guess."
    }
  },
  "bede": {
    "encounter": {
      1: "I suppose I should prove beyond doubt just how pathetic you are and how strong I am."
    },
    "victory": {
      1: "I see… Well, that's fine. I wasn't really trying all that hard anyway."
    },
    "defeat": {
      1: "Not a bad job, I suppose."
    }
  },
  "gordie": {
    "encounter": {
      1: "So, let's get this over with."
    },
    "victory": {
      1: "I just want to climb into a hole… Well, I guess it'd be more like falling from here."
    },
    "defeat": {
      1: "Battle like you always do, victory will follow!"
    }
  },
  "marnie": {
    "encounter": {
      1: `The truth is, when all's said and done… I really just wanna become Champion for myself! 
                    $So don't take it personal when I kick your butt!`,
    },
    "victory": {
      1: "OK, so I lost… But I got to see a lot of the good points of you and your Pokémon!"
    },
    "defeat": {
      1: "Hope you enjoyed our battle tactics."
    }
  },
  "raihan": {
    "encounter": {
      1: "I'm going to defeat the Champion, win the whole tournament, and prove to the world just how strong the great Raihan really is!"
    },
    "victory": {
      1: `I look this good even when I lose. 
                    $It's a real curse. 
                    $Guess it's time for another selfie!`,
    },
    "defeat": {
      1: "Let's take a selfie to remember this."
    }
  },
  "brassius": {
    "encounter": {
      1: "I assume you are ready? Let our collaborative work of art begin!"
    },
    "victory": {
      1: "Ahhh…vant-garde!"
    },
    "defeat": {
      1: "I will begin on a new piece at once!"
    }
  },
  "iono": {
    "encounter": {
      1: `How're ya feelin' about this battle?
                    $...
                    $Let's get this show on the road! How strong is our challenger? 
                    $I 'unno! Let's find out together!`,
    },
    "victory": {
      1: "You're as flashy and bright as a 10,000,000-volt Thunderbolt, friendo!"
    },
    "defeat": {
      1: "Your eyeballs are MINE!"
    }
  },
  "larry": {
    "encounter": {
      1: "When all's said and done, simplicity is strongest."
    },
    "victory": {
      1: "A serving of defeat, huh?"
    },
    "defeat": {
      1: "I'll call it a day."
    }
  },
  "ryme": {
    "encounter": {
      1: "Come on, baby! Rattle me down to the bone!"
    },
    "victory": {
      1: "You're cool, my friend—you move my SOUL!"
    },
    "defeat": {
      1: "Later, baby!"
    }
  },
  "grusha": {
    "encounter": {
      1: "All I need to do is make sure the power of my Pokémon chills you to the bone!"
    },
    "victory": {
      1: "Your burning passion… I kinda like it, to be honest."
    },
    "defeat": {
      1: "Things didn't heat up for you."
    }
  },
  "marnie_elite": {
    "encounter": {
      1: "You've made it this far, huh? Let's see if you can handle my Pokémon!",
      2: "I'll give it my best shot, but don't think I'll go easy on you!"
    },
    "victory": {
      1: "I can't believe I lost... But you deserved that win. Well done!",
      2: "Looks like I've still got a lot to learn. Great battle, though!"
    },
    "defeat": {
      1: "You put up a good fight, but I've got the edge! Better luck next time!",
      2: "Seems like my training's paid off. Thanks for the battle!"
    }
  },
  "nessa_elite": {
    "encounter": {
      1: "The tides are turning in my favor. Ready to get swept away?",
      2: "Let's make some waves with this battle! I hope you're prepared!"
    },
    "victory": {
      1: "You navigated those waters perfectly... Well done!",
      2: "Looks like my currents were no match for you. Great job!"
    },
    "defeat": {
      1: "Water always finds a way. That was a refreshing battle!",
      2: "You fought well, but the ocean's power is unstoppable!"
    }
  },
  "bea_elite": {
    "encounter": {
      1: "Prepare yourself! My fighting spirit burns bright!",
      2: "Let's see if you can keep up with my relentless pace!"
    },
    "victory": {
      1: "Your strength... It's impressive. You truly deserve this win.",
      2: "I've never felt this intensity before. Amazing job!"
    },
    "defeat": {
      1: "Another victory for my intense training regimen! Well done!",
      2: "You've got strength, but I trained harder. Great battle!"
    }
  },
  "allister_elite": {
    "encounter": {
      1: "Shadows fall... Are you ready to face your fears?",
      2: "Let's see if you can handle the darkness that I command."
    },
    "victory": {
      1: "You've dispelled the shadows... For now. Well done.",
      2: "Your light pierced through my darkness. Great job."
    },
    "defeat": {
      1: "The shadows have spoken... Your strength isn't enough.",
      2: "Darkness triumphs... Maybe next time you'll see the light."
    }
  },
  "raihan_elite": {
    "encounter": {
      1: "Storm's brewing! Let's see if you can weather this fight!",
      2: "Get ready to face the eye of the storm!"
    },
    "victory": {
      1: "You've bested the storm... Incredible job!",
      2: "You rode the winds perfectly... Great battle!"
    },
    "defeat": {
      1: "Another storm weathered, another victory claimed! Well fought!",
      2: "You got caught in my storm! Better luck next time!"
    }
  },
  "rival": {
    "encounter": {
	  1: `@c{smile}Ah, je te cherchais ! Je savais que t’étais pressée de partir, mais je m’attendais quand même à un au revoir…
					$@c{smile_eclosed}T’as finalement décidé de réaliser ton rêve ?\nJ’ai peine à y croire.
					$@c{serious_smile_fists}Vu que t’es là, ça te dis un petit combat ?\nJe voudrais quand même m’assurer que t'es prête.
					$@c{serious_mopen_fists}Surtout ne te retiens pas et donne-moi tout ce que t’as !`
    },
    "victory": {
	  1: `@c{shock}Wah… Tu m’as vraiment lavé.\nT’es vraiment une débutante ?
				   $@c{smile}T'as peut-être eu de la chance, mais…\nPeut-être que t’arriveras jusqu’au bout du chemin.
				   $D'ailleurs, le prof m’a demandé de te filer ces objets.\nIls ont l’air sympas.
                   $@c{serious_smile_fists}Bonne chance à toi !`
    },
  },
  "rival_female": {
    "encounter": {
      1: `@c{smile_wave}Ah, je te cherchais ! Je t’ai cherché partout !\n@c{angry_mopen}On oublie de dire au revoir à sa meilleure amie ?
                    $@c{smile_ehalf}T’as décidé de réaliser ton rêve, hein ?\nCe jour est donc vraiment arrivé…
					$@c{smile}Je veux bien te pardonner de m’avoir oubliée, à une conditon. @c{smile_wave_wink}Que tu m’affronte !
					$@c{angry_mopen}Donne tout ! Ce serait dommage que ton aventure finisse avant d’avoir commencé, hein ?`
    },
    "victory": {
      1: `@c{shock}Tu viens de commencer et t’es déjà si fort ?!@d{96}\n@c{angry}T'as triché non ? Avoue !
                    $@c{smile_wave_wink}J'déconne !@d{64} @c{smile_eclosed}J'ai perdu dans les règles… J’ai le sentiment que tu vas très bien t’en sortir.
					$@c{smile}D’ailleurs, le prof veut que je te donne ces quelques objets. Ils te seront utiles, pour sûr !
					$@c{smile_wave}Fais de ton mieux, comme toujours !\nJe crois fort en toi !`
    },
  },
  "rival_2": {
    "encounter": {
	  1: `@c{smile}Hé, toi aussi t’es là ?\n@c{smile_eclosed}Toujours invaincue, hein… ?
				$@c{serious_mopen_fists}Je sais que j’ai l’air de t’avoir suivie ici, mais c'est pas complètement vrai.
				$@c{serious_smile_fists}Pour être honnête, ça me démangeait d’avoir une revanche depuis que tu m'as battu.
				$Je me suis beaucoup entrainé, alors sois sure que je vais pas retenir mes coups cette fois.
                $@c{serious_mopen_fists}Et comme la dernière fois, ne te retiens pas !\nC’est parti !`
    },
    "victory": {
	  1: `@c{neutral_eclosed}Oh. Je crois que j’ai trop pris la confiance.
				$@c{smile}Pas grave, c'est OK. Je me doutais que ça arriverait.\n@c{serious_mopen_fists}Je vais juste devoir encore plus m’entrainer !\n
                $@c{smile}Ah, et pas que t’aies réellement besoin d’aide, mais j’ai ça en trop sur moi qui pourrait t’intéresser.\n
				$@c{serious_smile_fists}Mais n’espère plus en avoir d’autres !\nJe peux pas passer mon temps à aider mon adversaire.
                $@c{smile}Bref, prends soin de toi !`
    },
  },
  "rival_2_female": {
    "encounter": {
	  1: `@c{smile_wave}Hé, sympa de te croiser ici. T’as toujours l’air invaincu. @c{angry_mopen}Eh… Pas mal !
				$@c{angry_mopen}Je sais à quoi tu penses et non, je t’espionne pas. @c{smile_eclosed}C’est juste que j’étais aussi dans le coin.
				$@c{smile_ehalf}Heureuse pour toi, mais je veux juste te rappeler que c’est pas grave de perdre parfois.
				$@c{smile}On apprend de nos erreurs, souvent plus que si on ne connaissait que le succès.
				$@c{angry_mopen}Dans tous les cas je me suis bien entrainée pour cette revanche, t'as intérêt à tout donner !`
    },
    "victory": {
	  1: `@c{neutral}Je… J’étais pas encore supposée perdre…
				$@c{smile}Bon. Ça veut juste dire que je vois devoir encore plus m’entrainer !
				$@c{smile_wave}J’ai aussi ça en rab pour toi !\n@c{smile_wave_wink}Inutile de me remercier ~.
                $@c{angry_mopen}C’était le dernier, terminé les cadeaux après celui-là !
                $@c{smile_wave}Allez, tiens le coup !`
    },
    "defeat": {
      1: "Je suppose que c’est parfois normal de perdre…"
    }
  },
  "rival_3": {
    "encounter": {
	  1: `@c{smile}Hé, mais qui voilà ! Ça fait un bail.\n@c{neutral}T’es… toujours invaincue ? Incroyable.
				$@c{neutral_eclosed}Tout est devenu un peu… étrange.\nC’est plus pareil sans toi au village.
				$@c{serious}Je sais que c’est égoïste, mais j’ai besoin d’expier ça.\n@c{neutral_eclosed}Je crois que tout ça te dépasse.
				$@c{serious}Ne jamais perdre, c’est juste irréaliste.\nGrandir, c’est parfois aussi savoir perdre.
				$@c{neutral_eclosed}T’as un beau parcours, mais il y a encore tellement à venir et ça va pas s’arranger. @c{neutral}T’es prête pour ça ?
                $@c{serious_mopen_fists}Si tu l’es, alors prouve-le.`
    },
    "victory": {
	  1: "@c{angry_mhalf}C’est lunaire… J’ai presque fait que m’entrainer…\nAlors pourquoi il y a encore un tel écart entre nous ?"
    },
  },
  "rival_3_female": {
    "encounter": {
	  1: `@c{smile_wave}Ça fait une éternité ! Toujours debout hein ?\n@c{angry}Tu commences à me pousser à bout là. @c{smile_wave_wink}T’inquiètes j’déconne !
				$@c{smile_ehalf}Mais en vrai, ta maison te manque pas ? Ou… Moi ?\nJ… Je veux dire… Tu me manques vraiment beaucoup.
				$@c{smile_eclosed}Je te soutiendrai toujours dans tes ambitions, mais la vérité est que tu finiras par perdre un jour ou l’autre.
                $@c{smile}Quand ça arrivera, je serai là pour toi, comme toujours.\n@c{angry_mopen}Maintenant, montre-moi à quel point t’es devenu fort !`
    },
    "victory": {
	  1: "@c{shock}Après tout ça… Ça te suffit toujours pas… ?\nTu reviendras jamais à ce rythme…"

    },
    "defeat": {
	  1: "T’as fait de ton mieux.\nAllez, rentrons à la maison."
    }
  },
  "rival_4": {
    "encounter": {
      1: `@c{neutral}Hé.
				$Je vais pas y aller par quatre chemins avec toi.\n@c{neutral_eclosed}Je suis là pour gagner. Simple, basique.
				$@c{serious_mhalf_fists}J’ai appris à maximiser tout mon potentiel en m’entrainant d’arrachepied.
				$@c{smile}C’est fou tout le temps que tu peux te dégager si tu dors pas en sacrifiant ta vie sociale.
				$@c{serious_mopen_fists}Plus rien n’a d’importance désormais, pas tant que j’aurai pas gagné.
				$@c{neutral_eclosed}J'ai atteint un stade où je ne peux plus perdre.\n@c{smile_eclosed}Je présume que ta philosophie était pas si fausse finalement.
				$@c{angry_mhalf}La défaite, c'est pour les faibles, et je ne suis plus un faible.
                $@c{serious_mopen_fists}Tiens-toi prête.`
    },
    "victory": {
      1: "@c{neutral}Que…@d{64} Qui es-tu ?"
    },
  },
  "rival_4_female": {
    "encounter": {
	  1: `@c{neutral}C’est moi ! Tu m’as pas encore oubliée… n’est-ce pas ?
				$@c{smile}Tu devrais être fier d’être arrivé aussi loin. GG !\nMais c’est certainement pas la fin de ton aventure.
				$@c{smile_eclosed}T’as éveillé en moi quelque chose que j’ignorais.\nTout mon temps passe dans l'entrainement.
				$@c{smile_ehalf}Je dors et je mange à peine, je m’entraine juste tous les jours, et deviens de plus en plus forte.
                $@c{neutral}En vrai, Je… J’ai de la peine à me reconnaitre.
				$Mais maintenant, je suis au top de mes capacités.\nJe doute que tu sois de nouveau capable de me battre.
				$Et tu sais quoi ? Tout ça, c’est de ta faute.\n@c{smile_ehalf}Et j’ignore si je dois te remercier ou te haïr.
                $@c{angry_mopen}Tiens-toi prêt.`
    },
    "victory": {
      1: "@c{neutral}Que…@d{64} Qui es-tu ?"

    },
    "defeat": {
      1: "$@c{smile}Tu devrais être fier d’être arrivé jusque là."
    }
  },
  "rival_5": {
    "encounter": {
      1: "@c{neutral}…"
    },
    "victory": {
      1: "@c{neutral}…"
    },
  },
  "rival_5_female": {
    "encounter": {
      1: "@c{neutral}…"
    },
    "victory": {
      1: "@c{neutral}…"

    },
    "defeat": {
      1: "$@c{smile_ehalf}…"
    }
  },
  "rival_6": {
    "encounter": {
      1: `@c{smile_eclosed}Nous y revoilà.
				$@c{neutral}J’ai eu du temps pour réfléchir à tout ça.\nIl y a une raison à pourquoi tout semble étrange.
				$@c{neutral_eclosed}Ton rêve, ma volonté de te battre…\nFont partie de quelque chose de plus grand.
				$@c{serious}C’est même pas à propos de moi, ni de toi… Mais du monde, @c{serious_mhalf_fists}et te repousser dans tes limites est ma mission.
				$@c{neutral_eclosed}J’ignore si je serai capable de l’accomplir, mais je ferai tout ce qui est en mon pouvoir.
				$@c{neutral}Cet endroit est terrifiant… Et pourtant il m’a l’air familier, comme si j’y avais déjà mis les pieds.
                $@c{serious_mhalf_fists}Tu ressens la même chose, pas vrai ?
				$@c{serious}…et c’est comme si quelque chose ici me parlait.\nComme si c’était tout ce que ce monde avait toujours connu.
				$Ces précieux moments ensemble semblent si proches ne sont rien de plus qu’un lointain souvenir.
				$@c{neutral_eclosed}D’ailleurs, qui peut dire aujourd’hui qu’ils ont pu être réels ?
				$@c{serious_mopen_fists}Il faut que tu persévères. Si tu t’arrêtes, ça n'aura jamais de fin et t’es la seule à en être capable.
				$@c{serious_smile_fists}Difficile de comprendre le sens de tout ça, je sais juste que c’est la réalité.
				$@c{serious_mopen_fists}Si tu ne parviens à pas me battre ici et maintenant, tu n’as aucune chance.`
    },
    "victory": {
      1: `@c{smile_eclosed}J'ai fait ce que je j'avais à faire.
				$Promets-moi juste une chose.\n@c{smile}Après avoir réparé ce monde… Rentre à la maison.`
    },
  },
  "rival_6_female": {
    "encounter": {
      1: `@c{smile_ehalf}C’est donc encore entre toi et moi.
				$@c{smile_eclosed}Tu sais, j’ai beau retouner ça dans tous les sens…
                $@c{smile_ehalf}Quelque chose peut expliquer tout ça, pourquoi tout semble si étrange…
				$@c{smile}T’as tes rêves, j’ai mes ambitions…
				$J’ai juste le sentiment qu’il y a un grand dessein derrière tout ça, derrière ce qu’on fait toi et moi.
                $@c{smile_eclosed}Je crois que mon but est de… repousser tes limites.
				$@c{smile_ehalf}Je suis pas certaine de bien être douée à cet exercice, mais je fais de mon mieux.
				$Cet endroit épouvantable cache quelque chose d’étrange… Tout semble si limpide…
                $Comme… si c’était tout ce que ce monde avait toujours connu.
				$@c{smile_eclosed}J’ai le sentiment que nos précieux moments ensemble sont devenus si flous.
				$@c{smile_ehalf}Ont-ils au moins été réels ? Tout semble si loin maintenant…
                $@c{angry_mopen}Il faut que tu persévères. Si tu t’arrêtes, ça n'aura jamais de fin et t’es le seul à en être capable.
                $@c{smile_ehalf}Je… j’ignore le sens de tout ça… Mais je sais que c’est la réalité.
                $@c{neutral}Si tu ne parviens à pas me battre ici et maintenant, tu n’as aucune chance.`
    },
    "victory": {
      1: `@c{smile_ehalf}Je… Je crois que j'ai rempli ma mission…
                $@c{smile_eclosed}Promets-moi… Après avoir réparé ce monde… Reviens à la maison sain et sauf.
                $@c{smile_ehalf}… Merci.`

    },
  },
};

// Dialogue of the endboss of the game when the player character is male (Or unset)
export const PGMbattleSpecDialogue: SimpleTranslationEntries = {
  "encounter": `Une fois de plus, te revoilà.\nSais-tu que ce n’est point là ta première venue ?
               $Tu a été appelé ici parce que t’y est déjà venu.\nUn nombre inimaginable de fois.
               $Mais allons-y, faisons le décompte.\nTu en es très précisément à ton 5 643 853e cycle.
			   $Chaque cycle réinitialise ton souvenir du précédent.\nMais étrangement, des bribes subsistent en toi.
			   $Jusqu’à maintenant, tu as toujours échoué. Mais je ressens quelque chose de différent cette fois-ci.\n
			   $Tu es la seule présence ici, bien que j’ai le sentiment d’en ressentir… une autre.
			   $Vas-tu enfin me livrer un affrontement digne de ce nom ?\nCe challenge dont je rêve depuis un millénaire ?
               $Commençons.`,
  "firstStageWin": `Je vois. Cette précence était bien réelle.\nJe n’ai donc plus besoin de retenir mes coups.
                    $Ne me déçoit pas.`,
  "secondStageWin": "… Magnifique."
};

// Dialogue of the endboss of the game when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMbattleSpecDialogue.
export const PGFbattleSpecDialogue: SimpleTranslationEntries = {
  "encounter": `Une fois de plus, te revoilà.\nSais-tu que ce n’est point là ta première venue ?
               $Tu a été appelée ici parce que t’y est déjà venue.\nUn nombre inimaginable de fois.
               $Mais allons-y, faisons le décompte.\nTu en es très précisément à ton 5 643 853e cycle.
			   $Chaque cycle réinitialise ton souvenir du précédent.\nMais étrangement, des bribes subsistent en toi.
			   $Jusqu’à maintenant, tu as toujours échoué. Mais je ressens quelque chose de différent cette fois-ci.\n
			   $Tu es la seule présence ici, bien que j’ai le sentiment d’en ressentir… une autre.
			   $Vas-tu enfin me livrer un affrontement digne de ce nom ?\nCe challenge dont je rêve depuis un millénaire ?
               $Commençons.`,
  "firstStageWin": `Je vois. Cette précence était bien réelle.\nJe n’ai donc plus besoin de retenir mes coups.
                    $Ne me déçoit pas.`,
  "secondStageWin": "… Magnifique."
};

// Dialogue that does not fit into any other category (e.g. tutorial messages, or the end of the game). For when the player character is male
export const PGMmiscDialogue: SimpleTranslationEntries = {
  "ending":
	  `@c{smile}Oh ? T’as gagné ?@d{96} @c{smile_eclosed}J'aurais dû le savoir.\nMais de voilà de retour.
        $@c{smile}C’est terminé.@d{64} T’as brisé ce cycle infernal.
		$@c{serious_smile_fists}T’as aussi accompli ton rêve non ?\nTu n’as pas connu la moindre défaite.
		$@c{neutral}Je suis le seul à me souvenir de ce que t’as fait.@d{96}\nJe pense que ça ira, non ?
		$@c{serious_smile_fists}Ta légende vivra à jamais dans nos cœurs.
		$@c{smile_eclosed}Bref, j’en ai un peu marre de ce endroit, pas toi ? Rentrons à la maison.
		$@c{serious_smile_fists}On se fera un p’tit combat une fois rentrés ?\nSi t’es d’accord.`,
  "ending_female":
      `@c{shock}T’es revenu ?@d{32} Ça veut dire…@d{96} que t’as gagné ?!\n@c{smile_ehalf}J'aurais dû le savoir.
		$@c{smile_eclosed}Bien sûr… J’ai toujours eu ce sentiment.\n@c{smile}C’est fini maitenant hein ? T’as brisé ce cycle.
		$@c{smile_ehalf}T’as aussi accompli ton rêve non ?\nTu n’as pas connu la moindre défaite.
        $Je serai la seule à me souvenir de ce que t’as fait.\n@c{angry_mopen}Je tâcherai de ne pas oublier !
        $@c{smile_wave_wink}J’déconne !@d{64} @c{smile}Jamais j’oublierai.@d{32}\nTa légende vivra à jamais dans nos cœurs.
        $@c{smile_wave}Bon,@d{64} il se fait tard…@d{96} je crois ?\nDifficile à dire ici.
        $Rentrons, @c{smile_wave_wink}et demain on se fera un p’tit combat, comme au bon vieux temps ?`,
};
// Dialogue that does not fit into any other category (e.g. tutorial messages, or the end of the game). For when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMmiscDialogue.
export const PGFmiscDialogue: SimpleTranslationEntries = PGMmiscDialogue;


// Dialogue of the named double battles in the game. For when the player is male (or unset).
export const PGMdoubleBattleDialogue: DialogueTranslationEntries = {
  "blue_red_double": {
    "encounter": {
      1: `Blue : Hé Red, montrons-leur de quel bois on se chauffe !
                  $Red : …
                  $Blue : Voilà la puissance du Bourg Palette !`,
    },
    "victory": {
      1: `Blue : C’était un magnifique combat !
              $Red : …`,
    },
  },
  "red_blue_double": {
    "encounter": {
      1: `Red : … !
                  $Blue : Il est pas très loquace.
					$Blue : Mais ne te laisse pas avoir, ça reste un Maitre Pokémon !`,
    },
    "victory": {
      1: `Red : … !
                $Blue : La prochaine fois, on va te battre !`,
    },
  },
  "tate_liza_double": {
    "encounter": {
      1: `Lévy : Are you suprised?
                  $Tatia : We are two gym leaders at once!
                  $Lévy : We are twins!
                  $Tatia : We dont need to talk to understand each other!
                  $Lévy : Twice the power...
                  $Tatia : Can you handle it?`,
    },
    "victory": {
      1: `Lévy : What? Our combination was perfect!
                  $Tatia : Looks like we need to train more...`,
    },
  },
  "liza_tate_double": {
    "encounter": {
      1: `Tatia : Hihihi... Are you suprised?
                  $Lévy : Yes, we are really two gym leaders at once!
                  $Tatia : This is my twin brother Tate!
                  $Lévy : And this is my twin sister Liza!
                  $Tatia : Don't you think we are a perfect combination?`
    },
    "victory": {
      1: `Tatia : Are we...
                  $Lévy : ...not as strong as we thought?`,
    },
  },
  "wallace_steven_double": {
    "encounter": {
      1: `Pierre R. : Marc, let's show them the power of the champions!
                  $Marc : We will show you the power of Hoenn!
                  $Pierre R. : Let's go!`,
    },
    "victory": {
      1: `Pierre R. : That was a great battle!
                  $Marc : We will win next time!`,
    },
  },
  "steven_wallace_double": {
    "encounter": {
      1: `Pierre R. : Do you have any rare Pokémon?
          $Marc : Pierre... We are here for a battle, not to show off our pokémon.
            $Pierre R. : Oh... I see... Let's go then!`,
    },
    "victory": {
      1: `Pierre R. : Now that we are done with the battle, let's show off our pokémon!
            $Marc : Pierre...`,
    },
  },
  "alder_iris_double": {
    "encounter": {
      1:  `Goyah : We are the strongest trainers in Unova!
                  $Iris : Fights against strong trainers are the best!`,
    },
    "victory": {
      1:   `Goyah : Wow! You are super strong!
                  $Iris : We will win next time!`,
    },
  },
  "iris_alder_double": {
    "encounter": {
      1:   `Iris : Welcome Challenger! I am THE Unova Champion!
                  $Goyah : Iris, aren't you a bit too excited?`,
    },
    "victory": {
      1:    `Iris : A loss like this is not easy to take...
                  $Goyah : But we will only get stronger with every loss!`,
    },
  },
  "piers_marnie_double": {
    "encounter": {
      1:   `Rosemary : Frérot, montrons-leur la puissance de Smashings !
                  $Peterson : Nous sommes les ténèbres !`,
    },
    "victory": {
      1:  `Rosemary : T’as amené la lumière dans les ténèbres !
                  $Peterson : P’têtre un peu trop…`,
    },
  },
  "marnie_piers_double": {
    "encounter": {
      1:  `Peterson : Chauds pour un concert ?
                    $Rosemary : Frérot… Ils sont pas là pour chanter, mais se battre…`,
    },
    "victory": {
      1:  `Peterson : Ça c'est du rock !
                    $Rosemary : Frérot…`,
    },
  },
};

// Dialogue of the named double battles in the game. For when the player is female. For languages that do not have gendered pronouns, this can be set to PGMdoubleBattleDialogue.
export const PGFdoubleBattleDialogue: DialogueTranslationEntries = {
  "blue_red_double": {
    "encounter": {
      1: `Blue : Hé Red, montrons-leur de quel bois on se chauffe !
                  $Red : …
                  $Blue : Voilà la puissance du Bourg Palette !`,
    },
    "victory": {
      1: `Blue : C’était un magnifique combat !
              $Red : …`,
    },
  },
  "red_blue_double": {
    "encounter": {
      1: `Red : … !
                  $Blue : Il est pas très loquace.
					$Blue : Mais ne te laisse pas avoir, ça reste un Maitre Pokémon !`,
    },
    "victory": {
      1: `Red : … !
                $Blue : La prochaine fois, on va te battre !`,
    },
  },
  "tate_liza_double": {
    "encounter": {
      1: `Lévy : Are you suprised?
                  $Tatia : We are two gym leaders at once!
                  $Lévy : We are twins!
                  $Tatia : We dont need to talk to understand each other!
                  $Lévy : Twice the power...
                  $Tatia : Can you handle it?`,
    },
    "victory": {
      1: `Lévy : What? Our combination was perfect!
                  $Tatia : Looks like we need to train more...`,
    },
  },
  "liza_tate_double": {
    "encounter": {
      1: `Tatia : Hihihi... Are you suprised?
                  $Lévy : Yes, we are really two gym leaders at once!
                  $Tatia : This is my twin brother Tate!
                  $Lévy : And this is my twin sister Liza!
                  $Tatia : Don't you think we are a perfect combination?`
    },
    "victory": {
      1: `Tatia : Are we...
                  $Lévy : ...not as strong as we thought?`,
    },
  },
  "wallace_steven_double": {
    "encounter": {
      1: `Pierre R. : Marc, let's show them the power of the champions!
                  $Marc : We will show you the power of Hoenn!
                  $Pierre R. : Let's go!`,
    },
    "victory": {
      1: `Pierre R. : That was a great battle!
                  $Marc : We will win next time!`,
    },
  },
  "steven_wallace_double": {
    "encounter": {
      1: `Pierre R. : Do you have any rare Pokémon?
          $Marc : Pierre... We are here for a battle, not to show off our pokémon.
            $Pierre R. : Oh... I see... Let's go then!`,
    },
    "victory": {
      1: `Pierre R. : Now that we are done with the battle, let's show off our pokémon!
            $Marc : Pierre...`,
    },
  },
  "alder_iris_double": {
    "encounter": {
      1:  `Goyah : We are the strongest trainers in Unova!
                  $Iris : Fights against strong trainers are the best!`,
    },
    "victory": {
      1:   `Goyah : Wow! You are super strong!
                  $Iris : We will win next time!`,
    },
  },
  "iris_alder_double": {
    "encounter": {
      1:   `Iris : Welcome Challenger! I am THE Unova Champion!
                  $Goyah : Iris, aren't you a bit too excited?`,
    },
    "victory": {
      1:    `Iris : A loss like this is not easy to take...
                  $Goyah : But we will only get stronger with every loss!`,
    },
  },
  "piers_marnie_double": {
    "encounter": {
      1:   `Rosemary : Frérot, montrons-leur la puissance de Smashings !
                  $Peterson : Nous sommes les ténèbres !`,
    },
    "victory": {
      1:  `Rosemary : T’as amené la lumière dans les ténèbres !
                  $Peterson : P’têtre un peu trop…`,
    },
  },
  "marnie_piers_double": {
    "encounter": {
      1:  `Peterson : Chauds pour un concert ?
                    $Rosemary : Frérot… Ils sont pas là pour chanter, mais se battre…`,
    },
    "victory": {
      1:  `Peterson : Ça c'est du rock !
                    $Rosemary : Frérot…`,
    },
  },
};
