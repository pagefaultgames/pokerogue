import {SimpleTranslationEntries} from "#app/plugins/i18n";

// Titles of special trainers like gym leaders, elite four, and the champion
export const titles: SimpleTranslationEntries = {
  "elite_four": "四天王",
  "elite_four_female": "Elite Four",
  "gym_leader": "道館館主",
  "gym_leader_female": "道館館主",
  "gym_leader_double": "Gym Leader Duo",
  "champion": "冠軍",
  "champion_female": "Champion",
  "champion_double": "Champion Duo",
  "rival": "勁敵",
  "professor": "博士",
  "frontier_brain": "開拓頭腦",
  // Maybe if we add the evil teams we can add "Team Rocket" and "Team Aqua" etc. here as well as "Team Rocket Boss" and "Team Aqua Admin" etc.
} as const;

// Titles of trainers like "Youngster" or "Lass"
export const trainerClasses: SimpleTranslationEntries = {
  "ace_trainer": "精英訓練家",
  "ace_trainer_female": "精英訓練家",
  "ace_duo": "精英組合",
  "artist": "藝術家",
  "artist_female": "藝術家",
  "backers": "啦啦隊",
  "backpacker": "背包客",
  "backpacker_female": "背包客",
  "backpackers": "背包客組合",
  "baker": "麵包師",
  "battle_girl": "對戰少女",
  "beauty": "大姐姐",
  "beginners": "新人訓練家組合",
  "biker": "飆車族",
  "black_belt": "空手道王",
  "breeder": "寶可夢培育家",
  "breeder_female": "寶可夢培育家",
  "breeders": "寶可夢培育家組合",
  "clerk": "商務人士",
  "clerk_female": "職場OL",
  "colleagues": "商務夥伴",
  "crush_kin": "格鬥姐弟",
  "cyclist": "自行車手",
  "cyclist_female": "自行車手",
  "cyclists": "自行車手組合",
  "dancer": "舞者",
  "dancer_female": "舞者",
  "depot_agent": "鐵路員工",
  "doctor": "醫生",
  "doctor_female": "醫生",
  "fisherman": "垂釣者",
  "fisherman_female": "垂釣者",
  "gentleman": "紳士",
  "guitarist": "吉他手",
  "guitarist_female": "吉他手",
  "harlequin": "滑稽演員",
  "hiker": "登山男",
  "hooligans": "壞組合",
  "hoopster": "籃球選手",
  "infielder": "棒球選手",
  "janitor": "清潔員",
  "lady": "千金小姐",
  "lass": "迷你裙",
  "linebacker": "美式橄欖球選手",
  "maid": "女僕",
  "madame": "女士",
  "medical_team": "醫療團隊",
  "musician": "音樂家",
  "hex_maniac": "靈異迷",
  "nurse": "護士",
  "nursery_aide": "幼兒園老師",
  "officer": "警察",
  "parasol_lady": "陽傘姐姐",
  "pilot": "飛行員",
  "pokéfan": "發燒友俱樂部",
  "pokéfan_female": "發燒友俱樂部",
  "pokéfan_family": "同好夫婦",
  "preschooler": "幼兒園小朋友",
  "preschooler_female": "幼兒園小朋友",
  "preschoolers": "幼兒園小朋友組合",
  "psychic": "超能力者",
  "psychic_female": "超能力者",
  "psychics": "超能力者組合",
  "pokémon_ranger": "寶可夢巡護員",
  "pokémon_ranger_female": "寶可夢巡護員",
  "pokémon_rangers": "寶可夢巡護員組合",
  "ranger": "巡護員",
  "restaurant_staff": "服務生組合",
  "rich": "富有",
  "rich_female": "富有",
  "rich_boy": "富家少爺",
  "rich_couple": "富豪夫婦",
  "rich_kid": "富家孩子",
  "rich_kid_female": "富家孩子",
  "rich_kids": "富二代組合",
  "roughneck": "光頭男",
  "scientist": "研究員",
  "scientist_female": "研究員",
  "scientists": "研究員組合",
  "smasher": "網球選手",
  "snow_worker": "雪地工人",
  "snow_worker_female": "雪地工人",
  "striker": "足球選手",
  "school_kid": "補習班學生",
  "school_kid_female": "補習班學生",
  "school_kids": "補習班學生組合",
  "swimmer": "泳褲小伙子",
  "swimmer_female": "比基尼大姐姐",
  "swimmers": "泳裝情侶",
  "twins": "雙胞胎",
  "veteran": "資深訓練家",
  "veteran_female": "資深訓練家",
  "veteran_duo": "資深組合",
  "waiter": "服務生",
  "waitress": "女服務生",
  "worker": "工人",
  "worker_female": "工人",
  "workers": "工人組合",
  "youngster": "短褲小子"
} as const;

// Names of special trainers like gym leaders, elite four, and the champion
export const trainerNames: SimpleTranslationEntries = {
  // ---- 館主 Gym leader ----
  // 關都地區 Kanto Region
  "brock": "小剛",
  "misty": "小霞",
  "lt_surge": "馬志士",
  "erika": "莉佳",
  "janine": "阿杏",
  "sabrina": "娜姿",
  "blaine": "夏伯",
  "giovanni": "坂木",

  // 城都地區 Johto Region
  "falkner": "阿速",
  "bugsy": "阿筆",
  "whitney": "小茜",
  "morty": "松葉",
  "chuck": "阿四",
  "jasmine": "阿蜜",
  "pryce": "柳伯",
  "clair": "小椿",

  // 豐緣地區 Hoenn Region
  "roxanne": "杜鵑",
  "brawly": "藤樹",
  "wattson": "鐵旋",
  "flannery": "亞莎",
  "norman": "千里",
  "winona": "娜琪",
  "tate": "小楓",
  "liza": "小南",
  "juan": "亞當",

  // 神奧地區 Sinnoh Region
  "roark": "瓢太",
  "gardenia": "菜種",
  "maylene": "阿李",
  "crasher_wake": "吉憲",
  "fantina": "梅麗莎",
  "byron": "東瓜",
  "candice": "小菘",
  "volkner": "電次",

  // 合眾地區 Unova Region
  "cilan": "天桐",
  "chili": "伯特",
  "cress": "寇恩",
  "cheren": "黑連",
  "lenora": "蘆薈",
  "roxie": "霍米加",
  "burgh": "亞堤",
  "elesa": "小菊兒",
  "clay": "菊老大",
  "skyla": "風露",
  "brycen": "哈奇庫",
  "drayden": "夏卡",
  "marlon": "西子伊",

  // 卡洛斯地區 Kalos Region
  "viola": "紫羅蘭",
  "grant": "查克洛",
  "korrina": "可爾妮",
  "ramos": "福爺",
  "clemont": "希特隆",
  "valerie": "瑪綉",
  "olympia": "葛吉花",
  "wulfric": "得撫",

  // 伽勒爾地區 Galar Region
  "milo": "亞洛",
  "nessa": "露璃娜",
  "kabu": "卡芜",
  "bea": "彩豆",
  "allister": "歐尼奧",
  "opal": "波普菈",
  "bede": "彼特",
  "gordie": "瑪瓜",
  "melony": "美蓉",
  "piers": "聶梓",
  "marnie": "瑪俐",
  "raihan": "奇巴納",

  // 帕底亞地區 Paldea Region
  "katy": "阿楓",
  "brassius": "寇沙",
  "iono": "奇樹",
  "kofu": "海岱",
  "larry": "青木",
  "ryme": "萊姆",
  "tulip": "莉普",
  "grusha": "古魯夏",

  // ---- 四天王 Elite Four ----
  // 關都地區 Kanto Region
  "lorelei": "科拿",
  "bruno": "希巴",
  "agatha": "菊子",
  "lance": "阿渡",

  // 城都地區 Johto Region
  "will": "一樹",
  "koga": "阿桔",
  "karen": "梨花",

  // 豐都地區 Hoenn Region
  "sidney": "花月",
  "phoebe": "芙蓉",
  "glacia": "波妮",
  "drake": "源治",

  // 神奧地區 Sinnoh Region
  "aaron": "阿柳",
  "bertha": "菊野",
  "flint": "大葉",
  "lucian": "悟松",

  // 合眾地區 Unova Region
  "shauntal": "婉龍",
  "marshal": "連武",
  "grimsley": "越橘",
  "caitlin": "嘉德麗雅",

  // 卡洛斯地區 Kalos Region
  "malva": "帕琦拉",
  "siebold": "志米",
  "wikstrom": "雁鎧",
  "drasna": "朵拉塞娜",

  // 阿羅拉地區 Alola Region
  "hala": "哈拉",
  "molayne": "馬睿因",
  "olivia": "麗姿",
  "acerola": "阿塞蘿拉",
  "kahili": "卡希麗",

  // 帕底亞地區 Paldea Region
  "rika": "辛俐",
  "poppy": "波琵",
  "hassel": "八朔",

  // 藍莓學院 Blueberry Academy
  "crispin": "赤松",
  "amarys": "納莉",
  "lacey": "紫竽",
  "drayton": "杜若",

  // ---- 冠軍 Champion ----
  // 關都地區 Kanto Region
  "blue": "青綠",
  "red": "赤紅",

  // 豐緣地區 Hoenn Region
  "steven": "大吾",
  "wallace": "米可利",

  // 神奧地區 Sinnoh Region
  "cynthia": "竹蘭",

  // 合眾地區 Unova Region
  "alder": "阿戴克",
  "iris": "艾莉絲",

  // 卡洛斯地區 Kalos Region
  "diantha": "卡露妮",

  // 阿羅拉地區 Alola Region
  "hau": "哈烏",

  // 伽勒爾地區 Galar Region
  "leon": "丹帝",

  // 帕底亞地區 Paldea Region
  "geeta": "也慈",
  "nemona": "妮莫",

  // 藍莓學院 Blueberry Academy
  "kieran": "烏栗",

  // 勁敵 Rival
  "rival": "芬恩",
  "rival_female": "艾薇",

  // Double Names
  "blue_red_double": "Blue & Red",
  "red_blue_double": "Red & Blue",
  "tate_liza_double": "Tate & Liza",
  "liza_tate_double": "Liza & Tate",
  "steven_wallace_double": "Steven & Wallace",
  "wallace_steven_double": "Wallace & Steven",
  "alder_iris_double": "Alder & Iris",
  "iris_alder_double": "Iris & Alder",
  "marnie_piers_double": "Marnie & Piers",
  "piers_marnie_double": "Piers & Marnie",
} as const;
