import { DialogueTranslationEntries, SimpleTranslationEntries } from "#app/plugins/i18n";

// Dialogue of the NPCs in the game when the player character is male (or unset)
export const PGMdialogue: DialogueTranslationEntries = {
  "youngster": {
    "encounter": {
      1: "거기 너! 나와 배틀 어때?",
      2: "넌 새내기 트레이너구나. 맞지?",
      3: "거기 너! 처음보는 얼굴인데? 나랑 배틀하자!",
      4: "방금 배틀에서 져서 새로운 포켓몬을 찾는 중이야.\n잠깐! 넌 약해보이는데? 어서 나와 배틀하자!",
      5: "우리 만난 적이 있었던가? 잘 기억은 안나지만 어쨌든 만나서 반가워!",
      6: "좋아! 시작하자!",
      7: "좋아! 내가 왔다! 내 힘을 보여주지!",
      8: "하하하… 내 포켓몬이 얼마나 멋진지 보여주겠어!",
      9: "인사할 시간도 없어. 준비가 되었다면 이리 와!",
      10: "긴장을 늦추지마. 그렇지 않으면 어린이에게 맞아 울지도 몰라.",
      11: "난 내 포켓몬들을 소중히 키웠어. 내 포켓몬에게 상처를 입히게 놔두지 않겠어!",
      12: "여기까지 잘 왔구나! 하지만 지금부턴 쉽지 않을거야.",
      13: "배틀은 끝나지 않아! 끝없는 배틀의 세계에 온 것을 환영해!"
    },
    "victory": {
      1: "우와! 넌 강하구나!",
      2: "하? 난 기회가 없었어.",
      3: "내가 조금 더 큰 다음엔 널 찾아서 때리겠어!",
      4: "으.. 더이상 가지고 있는 포켓몬이 없어.",
      5: "말도 안돼… 안돼! 내가 또 지다니…",
      6: "안돼! 내가 지다니!",
      7: "우와! 정말 깜짝 놀랐어! 넌 정말 강하구나!",
      8: "이럴수가… 내 포켓몬과 난 최강인데… 어떻게…",
      9: "다음엔 지지 않을거야! 다음에 다시 배틀하자!",
      10: "쳇! 내가 어린애인게 보이지 않아?! 그렇게 최선을 다하는건 불공평해!",
      11: "네 포켓몬은 정말 굉장하구나! 나와 교환하자!",
      12: "내가 잠깐 정신이 나갔었나 봐. 내가 무슨 말을 하고 있었지?",
      13: "아하! 거기구나! 좋아! 넌 이미 이 세계에 머무를 곳이 있구나!"
    }
  },
  "lass": {
    "encounter": {
      1: "나랑 배틀하자, 어때?",
      2: "넌 신입 트레이너구나. 나랑 배틀하자!",
      3: "너 거기 있었구나? 나랑 배틀할래?",
      4: "재밌는 포켓몬 배틀하자!",
      5: "내가 포켓몬을 어떻게 다뤄야하는지 보여줄게!",
      6: "진정한 배틀은 진지한 자세부터 시작이야! 준비됐어?",
      7: "젊음이 한순간이듯 배틀에서 네 기회도 단 한번만 주어질거야. 곧 넌 추억속으로 사라질거야.",
      8: "나에겐 살살해도 돼, 알았지? 그래도 난 진지하게 싸울거야!",
      9: "학교는 지겨워. 나는 할 일이 없어. 하암~ 난 그저 시간을 때우기 위해 싸울뿐이야."
    },
    "victory": {
      1: "인상적이었어! 난 아직 배울게 많구나.",
      2: "내가 이렇게까지 크게 질 줄은 몰랐어…",
      3: "언젠가 우리가 다시 배틀할 수 있을 날을 기다릴게.",
      4: "놀라울 정도로 엄청 재미있었어! 넌 날 완전히 지치게 만들어버렸네…",
      5: "넌 나에게 진짜 교훈을 주었어! 넌 정말 대단해!",
      6: "세상에, 내가 지다니. 이거 정말 우울하지만… 넌 정말 멋있었어.",
      7: "난 이런 기억따윈 필요없어. 잊어버리겠어…",
      8: "거기 너! 살살하라고 했지! 그래도 넌 진지할때 정말 멋지구나!",
      9: "사실 배틀하는 것이 지루하던 참이야… 뭔가 새로운 것이 없을까?"
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
      1: "너는 꽤 자신만만해 보이는구나.",
      2: "너의 포켓몬들… 나에게 보여줘…",
      3: "내가 엘리트 트레이너라서, 사람들은 내가 강하다고 생각해.",
      4: "엘리트 트레이너가 되려면 무엇이 필요한지 알고 있니?"
    },
    "victory": {
      1: "그러네… 넌 좋은 포켓몬을 가졌구나…",
      2: "뭐? 말도 안 돼, 난 배틀 천재라구!",
      3: "그래도 역시, 네가 주인공이구나!",
      4: "좋아! 좋아! 너도 엘리트 트레이너가 될 수 있겠어!"
    },
    "defeat": {
      1: "난 내 몸과 마음을 포켓몬 배틀에 바치고 있어!",
      2: "모두 예상된 일이었어… 이건 놀랄 일이 아니야…",
      3: "난 내가 강하게 압박하면 무너질 연약한 사람이라고 생각했어.",
      4: "난 강하고, 지지 않아. 그저 멋지게 이길 수 없었기 때문이야."
    }
  },
  "parasol_lady": {
    "encounter": {
      1: "우아함과 침착함으로 승부하겠습니다!",
    },
    "victory": {
      1: "그래도 제 우아함은 무너지지 않아요!",
    }
  },
  "twins": {
    "encounter": {
      1: "각오해, 우리가 한 팀이 되면 두 배로 강해진다구!",
      2: "마음은 두 개지만 우리는 하나 – 네가 쌍둥이의 파워를 따라잡을 수 있는지 보겠어!",
      3: "두 배로 각오하는 게 좋을 거야. 우리가 곧 화나게 할 거거든!"
    },
    "victory": {
      1: "비록 우리는 졌지만, 우리의 관계는 깨지지 않아!",
      2: "그래도 우리의 영혼은 오랫동안 흐려지지 않을 거야.",
      3: "더 강력한 듀오로 강해져서 돌아오겠어!"
    },
    "defeat": {
      1: "우리 쌍둥이의 파워는 최고야!",
      2: "마음은 두 개지만 승리는 하나!",
      3: "미소도 두 배, 승리의 댄스도 두 배!"
    }
  },
  "cyclist": {
    "encounter": {
      1: "내가 만든 먼지나 마실 준비하시지!",
      2: "준비하라구! 난 널 먼지 속에 놓고 올 거니까!",
      3: "전력을 다해야 할 거야, 네가 날 따라올 수 있는지 지켜보겠어!"
    },
    "victory": {
      1: "바퀴가 움직이지 않더라도, 나의 페달은 그렇지 않아.",
      2: "이런, 따라잡혔어!",
      3: "승리로 가는 길에는 아직 만나지 못한 우여곡절이 많이 있구나."
    },
  },
  "black_belt": {
    "encounter": {
      1: "네 용기가 대단하구나! 난 최고의 발차기 실력을 갖추고 있다구!",
      2: "오, 알겠어. 산산조각이 나고 싶구나? 아니면 샌드백이 되고 싶은 거야?"
    },
    "victory": {
      1: "이런, 포켓몬이 배틀을 하는 동안 내 발차기는 전혀 도움이 되지 않았어.",
      2: "음… 어차피 내가 질거라면, 완전 엉망진창이 되길 바랬는데…"
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
  "firebreather": {
    "encounter": {
      1: "My flames shall devour you!",
      2: "My soul is on fire. I'll show you how hot it burns!",
      3: "Step right up and take a look!"
    },
    "victory": {
      1: "I burned down to ashes...",
      2: "Yow! That's hot!",
      3: "Ow! I scorched the tip of my nose!"
    },
  },
  "sailor": {
    "encounter": {
      1: "Matey, you're walking the plank if you lose!",
      2: "Come on then! My sailor's pride is at stake!",
      3: "Ahoy there! Are you seasick?"
    },
    "victory": {
      1: "Argh! Beaten by a kid!",
      2: "Your spirit sank me!",
      3: "I think it's me that's seasick..."
    },
  },
  "brock": {
    "encounter": {
      1: "내 전문인 바위 타입 포켓몬으로 널 쓰러뜨려줄게! 덤벼!",
      2: "바위같은 의지로 널 압도하겠어!",
      3: "내 포켓몬의 진정한 힘을 보여줄게!"
    },
    "victory": {
      1: "네 포켓몬의 힘이 바위같은 내 방어를 이겼어!",
      2: "세상은 넓구나! 너랑 겨뤄볼 수 있어서 즐거웠어.",
      3: "아마도 난 포켓몬 브리더의 꿈을 이루러 가야할지도…"
    },
    "defeat": {
      1: "최선의 공격은 적절한 방어지!\n그게 내 방식이야!",
      2: "다음에 나한테 더 배우러와. 바위타입과 어떻게 싸워야하는지 알려주지!",
      3: "아, 여러 지역을 돌아다니며 여행한 보람이 있군!"
    }
  },
  "misty": {
    "encounter": {
      1: "내 방침은 물타입 포켓몬으로 공격하고 공격하고 또 공격하는 거!",
      2: "아하핫, 너한테 내 물타입 포켓몬들의 힘을 보여줄게!",
      3: "내 꿈은 여행을 다니며 강한 트레이너들과 배틀하는 거였어…\n네가 그 충분한 도전자가 될 수 있는지 볼까?"
    },
    "victory": {
      1: "너 정말로 강하구나… 그 실력 인정하도록 할게…",
      2: "으으… 너 그냥 운이 좋았던거야, 그치?!",
      3: "우와, 너 대단해! 날 이기다니 믿을 수 없어!"
    },
    "defeat": {
      1: "최강인 최이슬! 너한테 좀 심했나?",
      2: "내 포켓몬들의 우아한 수영 테크닉을 봤길 바랄게!",
      3: "내 프라이드와 즐거움엔 네 포켓몬들은 상대가 안 돼. "
    }
  },
  "lt_surge": {
    "encounter": {
      1: "마이 전기 포켓몬은 전쟁에서 미를 구했어요! 하우를 유에게 보여줄게요!",
      2: "헤이! 쇼크로 유를 항복시키겠어요!",
      3: "배틀에서 마이 에너미에게 했던 것처럼 유에게도 펀치를 날리겠어요!"
    },
    "victory": {
      1: "와우, 키드! 유어 팀은 진짜 대단하군요!",
      2: "으흐흑, 유는 스트롱하네요! 마이 전기 트릭도 유에겐 로스트입니다.",
      3: "앱솔루트하고 쇼킹한 패배였어요!"
    },
    "defeat": {
      1: "오우 예! 전기 타입 포켓몬이라면, 미가 월드에서 넘버 원이에요!",
      2: "하하하! 키드, 이것이 찌릿찌릿 일렉트릭 배틀입니다!",
      3: "포켓몬 배틀은 전쟁, 앤드 나는 유에게 직접 전투를 보여줬습니다!"
    }
  },
  "erika": {
    "encounter": {
      1: "아, 오늘은 날씨가 좋네요…\n음, 배틀일까요? 그럼 더 좋죠.",
      2: "제 포켓몬들의 배틀 실력은 제 꽃꽂이 실력만큼 대단하답니다.",
      3: "아, 제 포켓몬의 달콤한 향기가 저를 다시 잠들게 하지 않았으면 좋겠는데……",
      4: "정원에서 꽃을 보면 마음이 편안해져요.”."
    },
    "victory": {
      1: "앗! 제 패배를 인정합니다.",
      2: "방금 경기 정말 달콤했어요.",
      3: "아, 제가 진 것 같네요…",
      4: "앗, 맙소사."
    },
    "defeat": {
      1: "저 조금 걱정했어요. 너무 졸려서…",
      2: "어머, 제 풀 포켓몬이 당신을 압도한 것 같네요.",
      3: "이 배틀 정말로 편안한 경험이었네요.",
      4: "어머… 이게 끝인가요?"
    }
  },
  "janine": {
    "encounter": {
      1: "난 독을 사용하는 인술을 갈고 닦고 있어.\n오늘 수련에서는 너랑 대련할거야!",
      2: "아버지는 내가 잘해낼 수 있다고 신뢰하셔.\n 그게 맞는다는 걸 증명할게!",
      3: "내 인술은 아버지한테 뒤처지지 않아! 따라올 수 있겠어? "
    },
    "victory": {
      1: "역시 아직도, 난 더 수련이 필요해… 납득했어.",
      2: "네 배틀 기술이 내 인술보다 한 수위야.",
      3: "더 스스로 갈고 닦아서, 내 인술을 향상 시키겠어."
    },
    "defeat": {
      1: "후후후… 독이 네 기력을 모두 가져가버렸네.",
      2: "하핫, 너 내 인술에 맞설 기회를 잡지 못했구나!",
      3: "나를 향한 아버지의 신뢰, 틀리지 않았다는 걸 증명해냈어."
    }
  },
  "sabrina": {
    "encounter": {
      1: "내 초능력을 통해서, 너의 도착은 예상하고 있었어!",
      2: "싸우는 건 좋아하지 않지만 네가 원한다면… 나의 힘을 보여줄게!",
      3: "네게서 큰 염원이 느껴져. 그것이 근거 없는 것이 아닌지 지켜보겠어."
    },
    "victory": {
      1: "너의 힘은… 내가 예견했던 것보다 훨씬 뛰어나…",
      2: "나는 너의 힘을 정확하게 예측하지 못했어.",
      3: "나 엄청난 초능력을 가지고도, 너처럼 강한 사람을 느끼지 못했네."
    },
    "defeat": {
      1: "이 승리는… 내가 환상에서 예견한 그대로네!",
      2: "아마도 그건, 내가 깊이 느꼈던 또 다른 염원이었을거야…",
      3: "무모하게 배틀에 임하기 전에 능력을 갈고닦도록.\n넌 미래가 어떻게 될지 예지할 수 없으니까…"
    }
  },
  "blaine": {
    "encounter": {
      1: "우오오~옷! 화상치료제는 잘 준비했는가!",
      2: "나의 포켓몬은 모든 것을 불꽃으로 태워버리는 강한 녀석들뿐이다!",
      3: "불꽃과 함께할 준비는 됐는가!"
    },
    "victory": {
      1: "아무것도 남지 않고 불타버렸다! 재조차 남지 않았어!",
      2: "내가 불을 너무 세게 피우지 않았나?",
      3: "불태웠다… 하지만 이건 불꽃을 향상시키려는 내 동기를 더욱 뜨겁게 만드는군!"
    },
    "defeat": {
      1: "나의 타오르는 불길은 진압할 수 없다!",
      2: "내 포켓몬은 이번 승리의 열기로 더욱 강해졌다!",
      3: "하! 내 열정이 네 것보다 더 밝게 타오르고 있군!"
    }
  },
  "giovanni": {
    "encounter": {
      1: "나, 로켓단의 리더가, 고통의 세계를 느끼게 해주마!",
      2: "옛 동료들과 다시 만나기 전, 이곳에서의 훈련은 매우 중요하겠군.",
      3: "너는 곧 경험하게 될 실패에 대한 준비가 되어 있지 않군!"
    },
    "victory": {
      1: "하! 내가 졌다고?! 더 이상 할말이 없군!",
      2: "흐음… 넌 내가 이루고자 하는 것을 결코 이해할 수 없을 거다.",
      3: "이 패배는 피할 수 없는 것을 단지 지연시킬 뿐.\n때가 되면 잿더미에서 로켓단을 일으켜 세울 것이다."
    },
    "defeat": {
      1: "자신의 힘을 스스로 잴수 없다는 것은 네가 아직 꼬맹이라는 것을 보여준다고 할 수 있지.",
      2: "다시는 나를 방해하지 말도록.",
      3: "나에게 도전하는 것이 얼마나 어리석은 짓인지 이해했으면 좋겠군."
    }
  },
  "roxanne": {
    "encounter": {
      1: "당신이 어떻게 싸우는지 보여주시겠어요?",
      2: "당신은 여러 트레이너와 싸우면서 많은 것을 배울 수 있을거예요.",
      3: "아, 전략짜는 거 들켰네요.\n배틀할까요?"
    },
    "victory": {
      1: "아, 제가 진 것 같네요.\n승복하겠습니다.",
      2: "전 아직도 포켓몬 배틀에 대해서 한참 더 배워야할 것 같네요.",
      3: "오늘 여기서 배운 것들을 마음에 담아둬야겠어요."
    },
    "defeat": {
      1: "전 방금 승부에서 많은 것을 배웠습니다.\n당신도 그랬길 바래요.",
      2: "다시 붙을 날이 기대되네요.\n당신이 여기서 배운 걸 활용할 수 있길 바랍니다.",
      3: "여태까지 공부해온 것 덕분에 이겼네요."
    }
  },
  "brawly": {
    "encounter": {
      1: "오, 도전자잖아!\n어디 한 번 볼까!",
      2: "넌 큰 파란을 일으킬 것 같군.\n승부다!",
      3: "폭풍을 일으킬 시간이야!\n가자!"
    },
    "victory": {
      1: "우와, 너 날 씻겨버렸네!",
      2: "내 파도를 타고, 나까지 밀어내다니!",
      3: "바위 동굴에서 길을 잃은 기분이야!"
    },
    "defeat": {
      1: "하핫, 난 큰 파도를 탔다고!\n언제 또 도전해주라.",
      2: "언젠가 또 같이 서핑하자고!",
      3: "파도가 밀려왔다가 밀려나듯, 언젠가 너도 다시 도전하러 와."
    }
  },
  "wattson": {
    "encounter": {
      1: "찌릿찌릿해질 때가 됐군!\n와하하하핫!",
      2: "스파크가 튀도록 해주마!\n와하하하하!",
      3: "와하하하하!\n마비 치료제를 가져왔길 바라네!"
    },
    "victory": {
      1: "이 몸 배터리가 다 됐군!\n와하하하하!",
      2: "자네 완전히 날 좌초시켰군!\n와하하하핫!",
      3: "스릴 넘치는 배틀, 고맙네!\n와하하하하하!"
    },
    "defeat": {
      1: "자네의 배터리 재충전하게. 그리고 나에게 도전하러 돌아오도록!\n와하하하핫!",
      2: "방금 배틀이 자네에게 짜릿짜릿했길 바란다네!\n와하하하하!",
      3: "자네 혹시 내가 이겨서 충격 받았나?\n와하하하핫!"
    }
  },
  "flannery": {
    "encounter": {
      1: "어서오세요! 잠깐, 아냐…\n너를 무너뜨려줄게!",
      2: "난 체육관 관장이 된지는 얼마 안됐지만, 널 태워버릴거야!",
      3: "할아버지에게 배운 기술을 한 수 보여줄게! 승부다!"
    },
    "victory": {
      1: "너 우리 할아버지를 생각나게 하네…\n내가 진 게 놀랍진 않아.",
      2: "나 너무 열심히 하는 건가?\n너무 열 올리면 안되니깐, 진정해야겠어.",
      3: "패배는 날 꺼뜨릴 수 없어.\n트레이닝으로 다시 불을 붙일 때야!"
    },
    "defeat": {
      1: "할아버지가 자랑스러워하시길…\n언젠가 다시 배틀하자.",
      2: "내…내가 이기다니!\n내 방식대로 한 게 통했어!",
      3: "조만간 다시 뜨겁게 불타오르는 배틀을 하자!"
    }
  },
  "norman": {
    "encounter": {
      1: "여기까지 오다니 놀랍군.\n한 번 겨뤄볼까.",
      2: "관장으로서 최선을 다해 널 이길 거란다.\n가자!",
      3: "최선을 다하는 게 좋을 거야.\n승부할 시간이다!"
    },
    "victory": {
      1: "내가 지다니…?\n규칙은 규칙이니, 흐음.",
      2: "담청시티에서 이사한 게 문제였나…?",
      3: "믿을 수 없구나.\n훌륭한 승부였어."
    },
    "defeat": {
      1: "우린 둘 다 최선을 다했지.\n다시 대결할 수 있었으면 좋겠구나.",
      2: "우리 집 꼬마에게 도전해보는 것도 좋겠군.\n아마 뭔가 배울 수 있을거다!",
      3: "방금 전 배틀 완벽했어.\n다음에도 행운이 함께하길."
    }
  },
  "winona": {
    "encounter": {
      1: "저는 먹이를 찾아서 하늘을 날아다녔어요…\n그리고 당신은 제 타겟입니다!",
      2: "배틀이 어떻게 되든, 전 제 비행 포켓몬과 우아하게 승리하겠어요. 승부합시다!",
      3: "당신이 높은 곳을 무서워하지 않기를.\n자, 날아올라요!"
    },
    "victory": {
      1: "저보다 우아하게 나서는 트레이너는 처음 봤습니다.\n훌륭하시네요.",
      2: "이런, 제 비행 포켓몬이 추락해버렸네요!\n훌륭한 배틀이었습니다.",
      3: "비록 전 떨어졌지만, 제 포켓몬은 다시 날아갈 겁니다!"
    },
    "defeat": {
      1: "제 비행 포켓몬과 영원히 우아하게 춤출게요.",
      2: "우리의 쇼가 즐거웠길 바라요.\우아한 춤은 끝났습니다.",
      3: "우리의 엘레강스한 안무를 다시 보러오지 않을래요?"
    }
  },
  "tate": {
    "encounter": {
      1: "헤헤헤…\n내가 란과 같이 있지 않아서 놀랐지?",
      2: "네가 무슨 생각을 하는지 알아…\n승부하고 싶은거지!",
      3: "네 움직임을 모두 알고 있는데…\n어떻게 이기려고?"
    },
    "victory": {
      1: "어쩔 수 없지…\n란이 보고싶다아…",
      2: "너와 네 포켓몬과의 유대, 나보다 더 견고한걸.",
      3: "란이랑 함께였다면, 우리가 이겼어.\n둘이선 더 잘 할 수 있다구!"
    },
    "defeat": {
      1: "내 포켓몬과 나는 우수하다구!",
      2: "날 못 이긴다면, 넌 란한테도 절대로 못 이겨.",
      3: "란과 함께한 엄격한 훈련 덕이야.\n덕분에 포켓몬과 하나가 될 수 있었어."
    }
  },
  "liza": {
    "encounter": {
      1: "후후후…\n내가 풍과 같이 있지 않아서 놀랐지?",
      2: "네가 무얼 바라는지 알아…\n포켓몬 배틀, 맞지?",
      3: "포켓몬과 하나가 된 사람…\n어떻게 이기려고?"
    },
    "victory": {
      1: "어쩔 수 없지…\n풍이 보고싶다아…",
      2: "너와 네 포켓몬과의 유대, 나보다 더 견고한걸.",
      3: "풍이랑 함께였다면, 우리가 이겼어.\n둘이선 더 잘 할 수 있다구!"
    },
    "defeat": {
      1: "내 포켓몬과 내가 승리한거야.",
      2: "날 못 이긴다면, 넌 풍한테도 절대로 못 이겨.",
      3: "풍과 함께한 엄격한 훈련 덕이야.\n덕분에 포켓몬과 싱크로 될 수 있었어."
    }
  },
  "juan": {
    "encounter": {
      1: "지금은 겸양을 부릴 때가 아니군요.\n승부합시다!",
      2: "아하하하, 물 포켓몬과 함께 아트를 보여드리겠습니다!",
      3: "태풍이 다가오는군요!\n저를 테스트해주시겠습니까?",
      4: "자, 마음껏 봐주십시오.\n저와 포켓몬이 이루어내는 물의 일루전을!"
    },
    "victory": {
      1: "당신은 윤진 관장을 뛰어넘을 지니어스군요!",
      2: "당신이 훈련할 때 저는 엘레강스에 집중했습니다.\n당신이 이기는 건 당연하죠.",
      3: "아하하하하!\n잘했습니다, 이번엔 당신이 이겼네요.",
      4: "모든 것을 극복하는 브릴리언트 스킬, 당신에게 느껴지네요."
    },
    "defeat": {
      1: "저와 포켓몬이 이루어내는 물의 일루전이 승리했습니다.",
      2: "아하하핫, 저는 이겼고, 당신은 졌습니다.",
      3: "겉옷 빌려드릴까요? 아마도 배틀에 도움이 될겁니다!\n아하하하, 농담입니다!",
      4: "제가 승리자군요! 그리고, 당신은 졌네요."
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
      1: `그래, 올곧게 자란 초목을 모아서 만든 풀 정글짐은 어땠는가?
                $자네가 느낀 그것이 나의 체육관 관장으로서의 실력이네! 한번 확인해 보겠나?`,
    },
    "victory": {
      1: "포켓몬은 자네를 믿고, 자네는 그들을 믿는다…가슴이 후련해지는 승부였구먼."
    },
    "defeat": {
      1: "호호호…연약해 보이는 풀잎은 콘크리트도 뚫을 수 있다네."
    }
  },
  "viola": {
    "encounter": {
      1: `패배의 분함도 승리의 순간도…
                $둘 다 최고의 피사체야! 정말 멋져 멋져! 
                $자, 그럼 덤비렴!`,
      2: "나 비올라는 셔트 찬스를 노리는 것처럼--승리를 노릴 거야!"
    },
    "victory": {
      1: "너와 네 포켓몬은 최고의 콤비구나! 정말 멋져 멋져!",
      2: `렌즈 너머의 세계와 포켓몬의 마음으로 보는 세계…
                $똑같이 보이는 풍경이지만 다양한 세계가 겹쳐져 있는 거야.`
    },
    "defeat": {
      1: "내가 승리한 순간을 찍은 사진은 정말 멋져 멋져!",
      2: "좋아! 멋진 사진을 찍었어!"
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
      1: "물포켓몬의 풀코스를! 배 터지게 먹여 주도록 하마!"
    },
    "victory": {
      1: "우옷! 우오오옷! 이렇게 팔팔한 트레이너가 다 있다니!"
    },
    "defeat": {
      1: "젊은 친구! 다음에 또 만나기를 기대하고 있으마!"
    }
  },
  "tulip": {
    "encounter": {
      1: "리파의 기술로 너의 포켓몬들을 지금보다 훨~씬 아름답게 만들어 줄게!"
    },
    "victory": {
      1: "너의 강함은 풀 수 없는 매직이구나."
    },
    "defeat": {
      1: "…리파의 업계에서는 어중간한 재능을 가진 사람은 대체로 금방 사라져 버려."
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
      1: "실컷 귀여워해 줄 테니까… 한 번 열심히 해 보라고!"
    },
    "victory": {
      1: "너, 꽤 하는구나!"
    },
    "defeat": {
      1: "아하하! 제법인데! 역시 너는 재밌는 녀석이라니까!"
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
      1: "I'm Bugsy! I never lose when it comes to bug Pokémon!"
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
      1: "우와~! 뽀삐와 포켓몬 승부가 하고 싶으세요?"
    },
    "victory": {
      1: "훌쩍, 으에엥~"
    },
    "defeat": {
      1: `만세~! 만세~ 목수, 성공했어요! 
                $에헴! 리벤지 매치는 언제든지 받아 줄게요!`,
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
      1: `…안녕하십니까, 청목입니다.
                $귀찮게도 저는 사천왕도 겸임하고 있습니다.`,
    },
    "victory": {
      1: "날고 있는 새포켓몬도 떨어뜨릴 기세로군요."
    },
    "defeat": {
      1: "치프와 만나기로 한 시각이군요."
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
      1: "맹렬하게 몰아치는 승부의 숨결을 직접 가르쳐 드리겠습니다!!"
    },
    "victory": {
      1: `이번에는 당신이 승리를 쟁취했군요. 
                $하지만, 시합의 흐름을 보니… 다음 승부는 또 어떻게 될지 모르겠네요.`,
    },
    "defeat": {
      1: "저에게 더 배우고 싶은 것이 있으시다면 또 승부하도록 하죠."
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
    },
    "victory": {
      1: "I eagerly await news of all your achievements!"
    },
    "defeat": {
      1: "What's the matter? This isn't all, is it?"
    }
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
      1: "쓰러지고 싶지 않다면 방심하지 말고 열심히 해 봐~"
    },
    "victory": {
      1: "내 포켓몬들 모두 지쳐서 헤벌레~ 해졌어~"
    },
    "defeat": {
      1: "비비용~ 많~이 먹으렴~"
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
      1: "준비는 됐겠지!? 그럼, 우리 둘의 예술적인 합작품을 한번 만들어 보도록 할까!"
    },
    "victory": {
      1: "아… 아방가르드!!"
    },
    "defeat": {
      1: "바로 신작을 만들러 가야 하니 이만 실례하겠다!"
    }
  },
  "iono": {
    "encounter": {
      1: `자~ 오늘의 각오는~ 모야모야~?
                    $...
                    $그럼, 이제 시작해 볼까! 
                    $도전자님의 실력은 과연 과연~!?`,
    },
    "victory": {
      1: "너의 반짝임은 1000만볼트!"
    },
    "defeat": {
      1: "당신의 눈길을 일렉트릭네트로 뾰로롱!"
    }
  },
  "larry": {
    "encounter": {
      1: "그렇습니다. 심플한 것이 가장 강한 것입니다!"
    },
    "victory": {
      1: "허, 이걸로 한 방 먹은 게 되었군요."
    },
    "defeat": {
      1: "오늘은 저는 이만 실례하겠습니다."
    }
  },
  "ryme": {
    "encounter": {
      1: "나의 영혼 흔들어 봐 Come On!"
    },
    "victory": {
      1: "너의 Cool한 Youth 나의 Soul이 Move!"
    },
    "defeat": {
      1: "Bye Bye Baby~!"
    }
  },
  "grusha": {
    "encounter": {
      1: "내가 너를 철저하게 얼려 버리면 고민할 것도 없겠지!"
    },
    "victory": {
      1: "너의 그 열기… 싫지 않아."
    },
    "defeat": {
      1: "너에겐 아직 열기가 부족하구나."
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
      1: `@c{smile}오, 찾았다! 떠나려는 건 알고 있었지만\n인사정도는 해줄 줄 알았는데…
                    $@c{smile_eclosed}그러니까 정말로 꿈을 좇겠다는 거지?\n듣고도 못 믿었다니까.
                    $@c{serious_smile_fists}여기까지 온 김에, 배틀은 어때?\n준비가 됐나 보자구.
                    $@c{serious_mopen_fists}망설이지 말고,\n너의 진면목을 보여봐!`
    },
    "victory": {
      1: `@c{shock}와… 정말 깔끔하게 당했네.\n초보자 맞아?
                   $@c{smile}운이 따른 건지도 모르겠지만…\n그래도 정말 꿈을 이룰 지도.
                   $그나저나, 박사님께서 이걸 전해달라고 하시더라.\n좋아 보이던데.
                   $@c{serious_smile_fists}아무튼, 힘 내는거야!`
    },
  },
  "rival_female": {
    "encounter": {
      1: `@c{smile_wave}여깄구나! 찾고 있었어!\n@c{angry_mopen}절친한테 작별인사도 안 하는거야?
                    $@c{smile_ehalf}꿈을 향해 떠나는거구나. 그렇지?\n이런 날이 오긴 하네…
                    $@c{smile}아무튼, 날 까먹고 가버린 건 용서해주겠어.\n@c{smile_wave_wink}배틀을 해준다면 말야!
                    $@c{angry_mopen}최선을 다 해 봐.\n모험을 시작과 동시에 끝내고 싶지 않다면!`
    },
    "victory": {
      1: `@c{shock}왜 벌써 이렇게 센 건데?!@d{96}\n@c{angry}아니면 뭔가 속임수, 그런 거?
                    $@c{smile_wave_wink}농담, 농담!@d{64} @c{smile_eclosed}내가 진 거 맞아…\n너 정말 앞으로도 잘 하겠는데.
                    $@c{smile}아 그래, 박사님께서 전해달라던 물건.\n도움이 되면 좋겠어!
                    $@c{smile_wave}항상 최선을 다 하라구! 믿고 있을게!`
    },
  },
  "rival_2": {
    "encounter": {
      1: `@c{smile}어라, 너 여깄었구나?\n@c{smile_eclosed}아직도 전승 중이라, 이거지…?
                $@c{serious_mopen_fists}널 쫓아서 온 것 같아 보이겠지만, 오해야.
                $@c{serious_smile_fists}그래도 솔직히 그 때부터 쭉 재대결이 간절했어.
                $그 동안의 훈련도 있겠다 마침 좋은 기회같지?
                $@c{serious_mopen_fists}자, 전처럼!\n배틀이야!`
    },
    "victory": {
      1: `@c{neutral_eclosed}이런. 자신감이 과했나봐.
                $@c{smile}그래, 또 지고 말았네.\n@c{serious_mopen_fists}좀 더 열심히 훈련을 해야겠어!\n
                $@c{smile}너한테 도움이 필요할 것 같지는 않지만, 이거.\n남는 게 있어서 말이야.
                $@c{serious_smile_fists}물론 이번이 마지막이야, 알겠지?\n공평하게 하지 않으면 그게 내 핑계거리가 되고 말거야.
                $@c{smile}이제 갈게. 앞으로도 조심하고!`
    },
  },
  "rival_2_female": {
    "encounter": {
      1: `@c{smile_wave}우연이네, 이런 곳에서 만나고.\n아직 연전연승이구나? @c{angry_mopen}나쁘지 않아!
                $@c{angry_mopen}무슨 생각하고있는지 알겠어, 하지만 아냐.\n@c{smile_eclosed}우연히 근처에 있었을 뿐이라구.
                $@c{smile_ehalf}그래도 마침, 가끔은 지는것도 괜찮다고 알려주고 싶었는데.
                $@c{smile}우린 실수를 통해서도 성장할 수 있잖아.\n때로는 성공을 반복할 때보다도 더 많이 말야.
                $@c{angry_mopen}어쨌든간에, 나도 이런 때를 위해 훈련해왔으니까,\n너도 최선을 다 하는게 좋을 거야!`
    },
    "victory": {
      1: `@c{neutral}이… 번에도 져버릴 줄이야…
                $@c{smile}으, 그래. 더 열심히 훈련하면 되겠지!
                $@c{smile_wave}이것도 하나 더 챙겨왔으니 받아!\n@c{smile_wave_wink}감사 인사는 됐다구~.
                $@c{angry_mopen}하지만, 마지막이야!\n또 이렇게 공짜로 나눠주진 않을 테니까!
                $@c{smile_wave}그럼!`
    },
    "defeat": {
      1: "가끔은 지는 것도 괜찮아…"
    }
  },
  "rival_3": {
    "encounter": {
      1: `@c{smile}이게 누구야! 오랜만이야.\n@c{neutral}역시나… 쭉 이기고 있었구나?
                $@c{neutral_eclosed}상황이 좀… 그렇더라. \n혼자 마을로 돌아가봤자 너 없인 예전같아질 수 없겠지.
                $@c{serious}이기적인 이야기란건 알지만 말해야겠어.\n@c{neutral_eclosed}너 지금 좀 아닌 것 같아.
                $@c{serious}계속 이기기만 하겠다는 건 너무 비현실적이야.\n사람은 원래 꺾여가며 성장하는 거라고.
                $@c{neutral_eclosed}물론 지금까지는 잘 해왔다고 생각하겠지만,\n갈 길이 멀지. @c{neutral}대비는 되어 있어?
                $@c{serious_mopen_fists}그렇다면, 내게 증명해 줘.`
    },
    "victory": {
      1: "@c{angry_mhalf}말도 안 돼… 한시도 쉬지 않고 훈련했는데…\n어째서 전혀 닿을 수 없는거야?"
    },
  },
  "rival_3_female": {
    "encounter": {
      1: `@c{smile_wave}오랜만이야! 아직도 안 졌구나.\n@c{angry}거슬리게 말야. @c{smile_wave_wink}농담이야!
                $@c{smile_ehalf}하지만 진짜, 고향이 그립진 않아? 집이나… 나는?\n나… 나는, 네가 정말 그리웠어.
                $@c{smile_eclosed}난 너의 꿈과 모든 것을 응원하지만,\n넌 언젠가 패배를 겪게 될 거야.
                $@c{smile}그 땐 언제나처럼 내가 곁에 있어줄게.\n@c{angry_mopen}내가 얼마나 강해졌는지도, 지금 보여 줄 테니까!`
    },
    "victory": {
      1: "@c{shock}이렇게까지 했는데도… 모자랐던 거야…?\n이러면 정말로 너는 이제 영영…"
    },
    "defeat": {
      1: "최선을 다 했지.\n집에 갈 시간이야."
    }
  },
  "rival_4": {
    "encounter": {
      1: `@c{neutral}안녕.
                $잡담은 넘어가자.\n@c{neutral_eclosed}너에게 이기기 위해 찾아왔어. 간단하지.
                $@c{serious_mhalf_fists}이제 잠재력을 끌어내는 법은 확실히 알겠어.
                $@c{smile}잠이나 사회적인 활동들.\n줄일 수 있는 불필요한 시간이 아주 많더라.
                $@c{serious_mopen_fists}오직 승리 뿐이야.\n이제 아무것도 중요하지 않아.
                $@c{neutral_eclosed}나도 이제 더 이상은 지지 않게 됐어.\n@c{smile_eclosed}네 그 철학이 완전히 틀린 건 아니었나봐.
                $@c{angry_mhalf}패배는 약자에게 주어지는 것이고, 난 더 이상 약하지 않아.
                $@c{serious_mopen_fists}준비해.`
    },
    "victory": {
      1: "@c{neutral}너…@d{64} 너 대체 뭐야?"
    },
  },
  "rival_4_female": {
    "encounter": {
      1: `@c{neutral}나야! 날 잊어버리고 있던 건… 아니지?
                $@c{smile}네 업적에 자랑스러워 할 때가 됐어. 축하해!\n하지만 네 여행도 여기까지야.
                $@c{smile_eclosed}너는 나도 모르던 내 안의 무언가를 일깨웠어.\n이제 훈련 말고는 아무것도 하지 않아.
                $@c{smile_ehalf}먹지도 자지도 않고, 그저 하루종일.\n더 강해지고 있어.
                $@c{neutral}사실, 나… 이제 내가 뭔지도 잘 모르겠어.
                $그렇지만 기량만은, 정점에 다다랐지.\n아무도 내게 이길 수 없을거야.
                $그거 알아? 이게 전부 네 덕이야.\n@c{smile_ehalf}감사해야할지 증오해야할지 모르겠네.
                $@c{angry_mopen}준비해.`
    },
    "victory": {
      1: "@c{neutral}너…@d{64} 너 대체 뭐야?"
    },
    "defeat": {
      1: "$@c{smile}네가 키운 상대야. 자랑스럽지?"
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
      1: `@c{smile_eclosed}다시 만났구나.
                $@c{neutral}모든 걸 되짚어 봤어.\n이 기이함에도 이유가 있더라.
                $@c{neutral_eclosed}널 이기고자 하는 욕구, 아니면 네 꿈…\n이건 그저 더 큰 무언가의 일부일 뿐이었어.
                $@c{serious}개인의 문제가 아니라 세계 전체가 엮인 일이었고…\n@c{serious_mhalf_fists}난 널 한계까지 밀어붙이기 위한 도구였던 거지.
                $@c{neutral_eclosed}내가 잘 쓰였는진 모르겠지만 어쨌든 최선을 다 했고.
                $@c{neutral}끝끝내 도착한 이곳은 끔찍하지만…\n언젠가 와 본 것 같아.
                $@c{serious_mhalf_fists}너도 그렇게 느끼지?
                $@c{serious}…그리고 무언가가 이야기하고 있어.\n오랫동안 세상에 알려져온 무언가가.
                $우리가 함께했던 소중한 시간들은 이제 그저 아득해.
                $@c{neutral_eclosed}실제로 일어난 일이긴 할까?
                $@c{serious_mopen_fists}너는 계속 나아가야 해. 그렇지 않으면 끝나지 않아.\n오직 너만이 할 수 있어.
                $@c{serious_smile_fists}잘 모르겠지만, 하나만은 확실해.
                $@c{serious_mopen_fists}여기서 날 쓰러뜨리지 못한다면, 너에게 기회는 없을거란걸.`
    },
    "victory": {
      1: `@c{smile_eclosed}내 역할은 여기까진 것 같아.
                $하나만 약속해 줘.\n@c{smile}세상을 원래대로 되돌리고 나면, 집으로 돌아오는거야.`
    },
  },
  "rival_6_female": {
    "encounter": {
      1: `@c{smile_ehalf}또 이렇게 만났네.
                $@c{smile_eclosed}나 머릿속이 빙글빙글 도는 것 같아…
                $@c{smile_ehalf}모든 것이 이상하게 보이는 이유.\n분명 뭔가가 있어…
                $@c{smile}너는 너의 꿈이 있고,\n나는 나의 야망이 있지…
                $이 모든것, 우리가 하고 있는 모든 일들이\n더 큰 무언가를 위한 것임을 느낄 수밖에 없어.
                $@c{smile_eclosed}나는 아마 너를…\n한계까지 몰아붙여야 하는 거야.
                $@c{smile_ehalf}잘 해왔는지는 모르겠는데, 최선은 다 했어.
                $이 이상하고 무서운 곳…\n모든게 선명하게 보이고…
                $이건… 오래전부터 세상에 알려져온 전부.
                $@c{smile_eclosed}우리가 함께해온 추억들이, 이제는 거의 떠오르지 않아.
                $@c{smile_ehalf}실제로 일어났던 일일까? 너무 멀게만 느껴지는데…
                $@c{angry_mopen}계속 나아가야 해. 안 그러면, 영원히 끝나지 않을 거야. \n오직 너만이 할 수 있어.
                $@c{smile_ehalf}난… 이 모든게 무슨 의미가 있는지는 잘 모르겠지만…\n이거 하나는 느끼고 있어.
                $@c{neutral}여기서 날 쓰러뜨리지 못한다면, 너에게 기회는 없을거란걸.`
    },
    "victory": {
      1: `@c{smile_ehalf}나… 내 소임을 다 한 기분이야…
                $@c{smile_eclosed}약속해 줘… 세상을 원래대로 되돌리고서… \n집으로… 무사히 돌아오는 거야.
                $@c{smile_ehalf}…고마워.`
    },
  },
};


// Dialogue of the NPCs in the game when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMdialogue.
export const PGFdialogue: DialogueTranslationEntries = PGMdialogue;

// Dialogue of the endboss of the game when the player character is male (Or unset)
export const PGMbattleSpecDialogue: SimpleTranslationEntries = {
  "encounter": `드디어 때가 다시 도래했다.\n당도한 연유를 아는가?
               $이미 도달한 적이 있기에 이 자리에 있다.\n셀 수도 없이 많이.
               $아니, 사실 셀 수는 있지.\n정확히 너의 5,643,853번째다.
               $매 번 태초의 정신으로 되돌아갔을 뿐.\n하지만 어떻게든, 흔적은 남는다.
               $실패만을 반복했을 뿐이지만,\n지금은 네 안에 무언가가 있구나.\n
               $홀로 선 것처럼 보이나, 무언가 이질적인…
               $마침내 그간의 갈망을 해소해주는가?\n수천 년 간 기다려온 도전을?
               $시작하지.`,
  "firstStageWin": `그렇군. 정말로 있었어.\n이제 주저할 필요는 없다.
                    $실망시키지 않도록.`,
  "secondStageWin": "…고무적이군."
};

// Dialogue of the endboss of the game when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMbattleSpecDialogue.
export const PGFbattleSpecDialogue: SimpleTranslationEntries = PGMbattleSpecDialogue;

// Dialogue that does not fit into any other category (e.g. tutorial messages, or the end of the game). For when the player character is male
export const PGMmiscDialogue: SimpleTranslationEntries = {
  "ending":
        `@c{smile}오? 이긴거야?@d{96} @c{smile_eclosed}진즉 알았어야 했는데.\n아무튼, 돌아왔구나.
        $@c{smile}다 끝난거야.@d{64} 네가 굴레를 끝장냈어.
        $@c{serious_smile_fists}네 꿈도 이뤄졌고말야.\n진짜로 한 번도 안 졌잖아.
        $@c{neutral}기억하는 건 우리들 뿐일 모양이지만.@d{96}\n그래도, 괜찮지?
        $@c{serious_smile_fists}오늘의 일은\n너와 나의 마음 속에 항상 함께할 거야.
        $@c{smile_eclosed}여기 구경도 충분히 했으니\n이제 집에 가자.
        $@c{serious_smile_fists}되돌아가서, 다시 배틀을 할 수도 있지 않을까?\n네가 원한다면 말야.`,
  "ending_female":
        `@c{shock}돌아왔구나?@d{32} 그 말은…@d{96} 이겼어?!\n@c{smile_ehalf}그럴 줄 알았다니까.
        $@c{smile_eclosed}물론… 언제나 느껴왔지.\n@c{smile}끝난 거, 맞지? 이 굴레를 말이야.
        $@c{smile_ehalf}네 꿈도 이뤘고 말이야.\n어떻게 한번도 안 졌대?
        $네가 한 일은 나만 기억하게 될 모양이지만.\n@c{angry_mopen}나, 안 까먹어볼 테니까!
        $@c{smile_wave_wink}농담이야!@d{64} @c{smile}절대 안 잊어버릴 거야.@d{32}\n마음 속엔 쭉 남아있을 수 있게.
        $@c{smile_wave}어쨌든,@d{64} 시간이 좀 늦었어…@d{96}\n이런 곳에서 할 말은 아닌가?
        $집에 가자. @c{smile_wave_wink}아마 내일은,\n추억을 되짚어보기 위한 배틀을 해볼 수 있을 거야.`,
  "ending_endless": "끝에 도달하신 것을 축하드립니다!\n더 많은 컨텐츠를 기다려주세요.",
  "ending_name": "Devs"
};
// Dialogue that does not fit into any other category (e.g. tutorial messages, or the end of the game). For when the player character is female. For languages that do not have gendered pronouns, this can be set to PGMmiscDialogue.
export const PGFmiscDialogue: SimpleTranslationEntries = PGMmiscDialogue;


// Dialogue of the named double battles in the game. For when the player is male (or unset).
export const PGMdoubleBattleDialogue: DialogueTranslationEntries = {
  "blue_red_double": {
    "encounter": {
      1: `그린: 어이 레드! 우리가 누군지 보여주자고!
                  $레드: ...
                  $그린: 태초마을의 힘을 보여주지!`,
    },
    "victory": {
      1: `그린: 훌륭한 승부였어!
              $레드: ...`,
    },
  },
  "red_blue_double": {
    "encounter": {
      1: `레드: ...!
                  $그린: 이 녀석은 여전히 말이 없구나.
                    $그린: 그렇지만 방심해선 안 돼! 그래도 챔피언이라고!`,
    },
    "victory": {
      1: `레드: ...!
                $그린: 다음에는 우리가 이길 테다!`,
    },
  },
  "tate_liza_double": {
    "encounter": {
      1: `풍: 에헤헤... 체육관 관장이
                  $란: 두 명이나 있어서 놀랐지?
                  $풍: 우리는 쌍둥이!
                  $란: 굳이 말을 하지 않아도 서로가 무슨 생각을 하고 있는지
                  $풍: 자동으로 머릿속에 떠오르니까
                  $란: 호흡을 척척 맞출 수가 있지!`,
    },
    "victory": {
      1: `풍: 우, 우리들의
                  $란: 팀워크가...!`,
    },
  },
  "liza_tate_double": {
    "encounter": {
      1: `란: 우후후... 체육관 관장이
                  $풍: 두 명이나 있어서 놀랐어?
                  $란: 우리는 쌍둥이!
                  $풍: 완벽한 우리의 콤비네이션을
                  $란: 과연 네가 깨뜨릴 수 있을까?`
    },
    "victory": {
      1: `란: 우리들이 생각한 만큼
                  $풍: 우리가 강하지 않았던 걸까?`,
    },
  },
  "wallace_steven_double": {
    "encounter": {
      1: `성호: 윤진! 우리 챔피언의 힘을 보여주자!
                  $윤진: 호연의 힘을 보여주마!
                  $성호: 간다!`,
    },
    "victory": {
      1: `성호: 훌륭한 승부였어!
                  $윤진: 다음엔 우리가 이길 거다!`,
    },
  },
  "steven_wallace_double": {
    "encounter": {
      1: `성호: 너 혹시 희귀한 포켓몬 가지고 있니?
          $윤진: 성호야... 우리는 포켓몬을 자랑하러 온 게 아니라 승부하러 온 거야.
            $성호: 오... 그렇지... 그럼 간다!`,
    },
    "victory": {
      1: `성호: 이제 승부는 끝났으니 포켓몬을 자랑해 볼까!
            $윤진: 성호야...`,
    },
  },
  "alder_iris_double": {
    "encounter": {
      1:  `노간주: 우리는 하나 지방 최강의 트레이너들이란다!
                  $아이리스: 이렇게 강한 트레이너와 싸울 수 있어서 정말 기뻐~!!`,
    },
    "victory": {
      1:   `노간주: 장하구나! 실로 견줄 자가 천하에 없도다!
                  $아이리스: 다음 번엔 우리가 꼭 이길 거야~!`,
    },
  },
  "iris_alder_double": {
    "encounter": {
      1:   `아이리스: 어서 와, 도전자! 내가 바로 하나 지방 챔피언이야~!
                  $노간주: 아이리스야, 너무 흥분한 것 아니냐?`,
    },
    "victory": {
      1:    `아이리스: 후와아아아아... 최선을 다했는데도... 우리가 져버렸네!
                  $노간주: 하지만 우리의 패배를 발판 삼아 나아가리라!`,
    },
  },
  "piers_marnie_double": {
    "encounter": {
      1:   `마리: 오빠, 스파이크마을의 힘을 보여주자!
                  $두송: 우리가 어둠을 불러올 것이다!`,
    },
    "victory": {
      1:  `마리: 네가 우리의 어둠에 빛을 불러왔구나!
                  $두송: 여긴 너무 밝네...`,
    },
  },
  "marnie_piers_double": {
    "encounter": {
      1:  `두송: 큰서트 즐길 준비 됐어?
                    $마리: 오빠... 얘들은 노래가 아니라 승부를 하러 왔어...`,
    },
    "victory": {
      1:  `두송: 훌륭한 콘서트였다!
                    $마리: 오빠...`,
    },
  },
};

// Dialogue of the named double battles in the game. For when the player is female. For languages that do not have gendered pronouns, this can be set to PGMdoubleBattleDialogue.
export const PGFdoubleBattleDialogue: DialogueTranslationEntries = PGMdoubleBattleDialogue;
