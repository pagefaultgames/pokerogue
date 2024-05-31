import {SimpleTranslationEntries} from "#app/plugins/i18n";

// Titles of special trainers like gym leaders, elite four, and the champion
export const titles: SimpleTranslationEntries = {
  "elite_four": "四天王",
  "elite_four_female": "四天王",
  "gym_leader": "道馆馆主",
  "gym_leader_female": "道馆馆主",
  "gym_leader_double": "道馆馆主搭档",
  "champion": "冠军",
  "champion_female": "冠军",
  "champion_double": "冠军搭档",
  "rival": "劲敌",
  "professor": "博士",
  "frontier_brain": "开拓头脑",
  // Maybe if we add the evil teams we can add "Team Rocket" and "Team Aqua" etc. here as well as "Team Rocket Boss" and "Team Aqua Admin" etc.
} as const;

// Titles of trainers like "Youngster" or "Lass"
export const trainerClasses: SimpleTranslationEntries = {
  "ace_trainer": "精英训练家",
  "ace_trainer_female": "精英训练家",
  "ace_duo": "精英组合",
  "artist": "艺术家",
  "artist_female": "艺术家",
  "backers": "啦啦队",
  "backpacker": "背包客",
  "backpacker_female": "背包客",
  "backpackers": "背包客组合",
  "baker": "面包师",
  "battle_girl": "对战少女",
  "beauty": "大姐姐",
  "beginners": "新人训练家组合",
  "biker": "飙车族",
  "black_belt": "空手道王",
  "breeder": "宝可梦培育家",
  "breeder_female": "宝可梦培育家",
  "breeders": "宝可梦培育家组合",
  "clerk": "商务人士",
  "clerk_female": "职场OL",
  "colleagues": "商务伙伴",
  "crush_kin": "格斗姐弟",
  "cyclist": "自行车手",
  "cyclist_female": "自行车手",
  "cyclists": "自行车手组合",
  "dancer": "舞者",
  "dancer_female": "舞者",
  "depot_agent": "铁路员工",
  "doctor": "医生",
  "doctor_female": "医生",
  "firebreather": "Firebreather",
  "fisherman": "垂钓者",
  "fisherman_female": "垂钓者",
  "gentleman": "绅士",
  "guitarist": "吉他手",
  "guitarist_female": "吉他手",
  "harlequin": "滑稽演员",
  "hiker": "登山男",
  "hooligans": "坏组合",
  "hoopster": "篮球选手",
  "infielder": "棒球选手",
  "janitor": "清洁员",
  "lady": "千金小姐",
  "lass": "迷你裙",
  "linebacker": "美式橄榄球选手",
  "maid": "女仆",
  "madame": "女士",
  "medical_team": "医疗团队",
  "musician": "音乐家",
  "hex_maniac": "灵异迷",
  "nurse": "护士",
  "nursery_aide": "幼儿园老师",
  "officer": "警察",
  "parasol_lady": "阳伞姐姐",
  "pilot": "飞行员",
  "pokéfan": "发烧友俱乐部",
  "pokéfan_female": "发烧友俱乐部",
  "pokéfan_family": "同好夫妇",
  "preschooler": "幼儿园小朋友",
  "preschooler_female": "幼儿园小朋友",
  "preschoolers": "幼儿园小朋友组合",
  "psychic": "超能力者",
  "psychic_female": "超能力者",
  "psychics": "超能力者组合",
  "pokémon_ranger": "宝可梦巡护员",
  "pokémon_ranger_female": "宝可梦巡护员",
  "pokémon_rangers": "宝可梦巡护员组合",
  "ranger": "巡护员",
  "restaurant_staff": "服务生组合",
  "rich": "Rich",
  "rich_female": "Rich",
  "rich_boy": "富家少爷",
  "rich_couple": "富豪夫妇",
  "rich_kid": "Rich Kid",
  "rich_kid_female": "Rich Kid",
  "rich_kids": "富二代组合",
  "roughneck": "光头男",
  "scientist": "研究员",
  "scientist_female": "研究员",
  "scientists": "研究员组合",
  "smasher": "网球选手",
  "snow_worker": "雪地工人",
  "snow_worker_female": "雪地工人",
  "striker": "足球选手",
  "school_kid": "补习班学生",
  "school_kid_female": "补习班学生",
  "school_kids": "补习班学生组合",
  "swimmer": "泳裤小伙子",
  "swimmer_female": "比基尼大姐姐",
  "swimmers": "泳装情侣",
  "twins": "双胞胎",
  "veteran": "资深训练家",
  "veteran_female": "资深训练家",
  "veteran_duo": "资深组合",
  "waiter": "服务生",
  "waitress": "女服务生",
  "worker": "工人",
  "worker_female": "工人",
  "workers": "工人组合",
  "youngster": "短裤小子"
} as const;

// Names of special trainers like gym leaders, elite four, and the champion
export const trainerNames: SimpleTranslationEntries = {
  // ---- 馆主 Gym leader ----
  // 关都地区 Kanto Region
  "brock": "小刚",
  "misty": "小霞",
  "lt_surge": "马志士",
  "erika": "莉佳",
  "janine": "阿杏",
  "sabrina": "娜姿",
  "blaine": "夏伯",
  "giovanni": "坂木",

  // 城都地区 Johto Region
  "falkner": "阿速",
  "bugsy": "阿笔",
  "whitney": "小茜",
  "morty": "松叶",
  "chuck": "阿四",
  "jasmine": "阿蜜",
  "pryce": "柳伯",
  "clair": "小椿",

  // 丰缘地区 Hoenn Region
  "roxanne": "杜娟",
  "brawly": "藤树",
  "wattson": "铁旋",
  "flannery": "亚莎",
  "norman": "千里",
  "winona": "娜琪",
  "tate": "小枫",
  "liza": "小南",
  "juan": "亚当",

  // 神奥地区 Sinnoh Region
  "roark": "瓢太",
  "gardenia": "菜种",
  "maylene": "阿李",
  "crasher_wake": "吉宪",
  "fantina": "梅丽莎",
  "byron": "东瓜",
  "candice": "小菘",
  "volkner": "电次",

  // 合众地区 Unova Region
  "cilan": "天桐",
  "chili": "伯特",
  "cress": "寇恩",
  "cheren": "黑连",
  "lenora": "芦荟",
  "roxie": "霍米加",
  "burgh": "亚堤",
  "elesa": "小菊儿",
  "clay": "菊老大",
  "skyla": "风露",
  "brycen": "哈奇库",
  "drayden": "夏卡",
  "marlon": "西子伊",

  // 卡洛斯地区 Kalos Region
  "viola": "紫罗兰",
  "grant": "查克洛",
  "korrina": "可尔妮",
  "ramos": "福爷",
  "clemont": "希特隆",
  "valerie": "玛绣",
  "olympia": "葛吉花",
  "wulfric": "得抚",

  // 伽勒尔地区 Galar Region
  "milo": "亚洛",
  "nessa": "露璃娜",
  "kabu": "卡芜",
  "bea": "彩豆",
  "allister": "欧尼奥",
  "opal": "波普菈",
  "bede": "彼特",
  "gordie": "玛瓜",
  "melony": "美蓉",
  "piers": "聂梓",
  "marnie": "玛俐",
  "raihan": "奇巴纳",

  // 帕底亚地区 Paldea Region
  "katy": "阿枫",
  "brassius": "寇沙",
  "iono": "奇树",
  "kofu": "海岱",
  "larry": "青木",
  "ryme": "莱姆",
  "tulip": "莉普",
  "grusha": "古鲁夏",

  // ---- 四天王 Elite Four ----
  // 关都地区 Kanto Region
  "lorelei": "科拿",
  "bruno": "希巴",
  "agatha": "菊子",
  "lance": "阿渡",

  // 城都地区 Johto Region
  "will": "一树",
  "koga": "阿桔",
  "karen": "梨花",

  // 丰都地区 Hoenn Region
  "sidney": "花月",
  "phoebe": "芙蓉",
  "glacia": "波妮",
  "drake": "源治",

  // 神奥地区 Sinnoh Region
  "aaron": "阿柳",
  "bertha": "菊野",
  "flint": "大叶",
  "lucian": "悟松",

  // 合众地区 Unova Region
  "shauntal": "婉龙",
  "marshal": "连武",
  "grimsley": "越橘",
  "caitlin": "嘉德丽雅",

  // 卡洛斯地区 Kalos Region
  "malva": "帕琦拉",
  "siebold": "志米",
  "wikstrom": "雁铠",
  "drasna": "朵拉塞娜",

  // 阿罗拉地区 Alola Region
  "hala": "哈拉",
  "molayne": "马睿因",
  "olivia": "丽姿",
  "acerola": "阿塞萝拉",
  "kahili": "卡希丽",

  // 帕底亚地区 Paldea Region
  "rika": "辛俐",
  "poppy": "波琵",
  "hassel": "八朔",

  // 蓝莓学院 Blueberry Academy
  "crispin": "赤松",
  "amarys": "纳莉",
  "lacey": "紫竽",
  "drayton": "杜若",

  // ---- 冠军 Champion ----
  // 关都地区 Kanto Region
  "blue": "青绿",
  "red": "赤红",

  // 丰缘地区 Hoenn Region
  "steven": "大吾",
  "wallace": "米可利",

  // 神奥地区 Sinnoh Region
  "cynthia": "竹兰",

  // 合众地区 Unova Region
  "alder": "阿戴克",
  "iris": "艾莉丝",

  // 卡洛斯地区 Kalos Region
  "diantha": "卡露妮",

  // 阿罗拉地区 Alola Region
  "hau": "哈乌",

  // 伽勒尔地区 Galar Region
  "leon": "丹帝",

  // 帕底亚地区 paldea Region
  "geeta": "也慈",
  "nemona": "妮莫",

  // 蓝莓学院 Blueberry academy
  "kieran": "乌栗",

  // 劲敌 rival
  "rival": "芬恩",
  "rival_female": "艾薇",


  // Double Names
  "blue_red_double": "青绿 & 赤红",
  "red_blue_double": "赤红 & 青绿",
  "tate_liza_double": "小枫 & 小南",
  "liza_tate_double": "小南 & 小枫",
  "steven_wallace_double": "大吾 & 米可利",
  "wallace_steven_double": "米可利 & 大吾",
  "alder_iris_double": "阿戴克 & 艾莉丝",
  "iris_alder_double": "艾莉丝 & 阿戴克",
  "marnie_piers_double": "玛俐 & 聂梓",
  "piers_marnie_double": "聂梓 & 玛俐",
} as const;
