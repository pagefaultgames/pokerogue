import { TrainerType } from "./enums/trainer-type";
import * as Utils from "../utils";

class TrainerNameConfig {
  public urls: string[];
  public femaleUrls: string[];

  constructor(type: TrainerType, ...urls: string[]) {
    this.urls = urls.length ? urls : [ Utils.toReadableString(TrainerType[type]).replace(/ /g, "_") ];
  }

  hasGenderVariant(...femaleUrls: string[]): TrainerNameConfig {
    this.femaleUrls = femaleUrls.length ? femaleUrls : null;
    return this;
  }
}

interface TrainerNameConfigs {
  [key: integer]: TrainerNameConfig
}

// used in a commented code
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const trainerNameConfigs: TrainerNameConfigs = {
  [TrainerType.ACE_TRAINER]: new TrainerNameConfig(TrainerType.ACE_TRAINER),
  [TrainerType.ARTIST]: new TrainerNameConfig(TrainerType.ARTIST),
  [TrainerType.BACKERS]: new TrainerNameConfig(TrainerType.BACKERS),
  [TrainerType.BACKPACKER]: new TrainerNameConfig(TrainerType.BACKPACKER),
  [TrainerType.BAKER]: new TrainerNameConfig(TrainerType.BAKER),
  [TrainerType.BEAUTY]: new TrainerNameConfig(TrainerType.BEAUTY),
  [TrainerType.BIKER]: new TrainerNameConfig(TrainerType.BIKER),
  [TrainerType.BLACK_BELT]: new TrainerNameConfig(TrainerType.BLACK_BELT).hasGenderVariant("Battle_Girl"),
  [TrainerType.BREEDER]: new TrainerNameConfig(TrainerType.BREEDER, "Pokémon_Breeder"),
  [TrainerType.CLERK]: new TrainerNameConfig(TrainerType.CLERK),
  [TrainerType.CYCLIST]: new TrainerNameConfig(TrainerType.CYCLIST),
  [TrainerType.DANCER]: new TrainerNameConfig(TrainerType.DANCER),
  [TrainerType.DEPOT_AGENT]: new TrainerNameConfig(TrainerType.DEPOT_AGENT),
  [TrainerType.DOCTOR]: new TrainerNameConfig(TrainerType.DOCTOR).hasGenderVariant("Nurse"),
  [TrainerType.FIREBREATHER]: new TrainerNameConfig(TrainerType.FIREBREATHER),
  [TrainerType.FISHERMAN]: new TrainerNameConfig(TrainerType.FISHERMAN),
  [TrainerType.GUITARIST]: new TrainerNameConfig(TrainerType.GUITARIST),
  [TrainerType.HARLEQUIN]: new TrainerNameConfig(TrainerType.HARLEQUIN),
  [TrainerType.HIKER]: new TrainerNameConfig(TrainerType.HIKER),
  [TrainerType.HOOLIGANS]: new TrainerNameConfig(TrainerType.HOOLIGANS),
  [TrainerType.HOOPSTER]: new TrainerNameConfig(TrainerType.HOOPSTER),
  [TrainerType.INFIELDER]: new TrainerNameConfig(TrainerType.INFIELDER),
  [TrainerType.JANITOR]: new TrainerNameConfig(TrainerType.JANITOR),
  [TrainerType.LINEBACKER]: new TrainerNameConfig(TrainerType.LINEBACKER),
  [TrainerType.MAID]: new TrainerNameConfig(TrainerType.MAID),
  [TrainerType.MUSICIAN]: new TrainerNameConfig(TrainerType.MUSICIAN),
  [TrainerType.HEX_MANIAC]: new TrainerNameConfig(TrainerType.HEX_MANIAC),
  [TrainerType.NURSERY_AIDE]: new TrainerNameConfig(TrainerType.NURSERY_AIDE),
  [TrainerType.OFFICER]: new TrainerNameConfig(TrainerType.OFFICER),
  [TrainerType.PARASOL_LADY]: new TrainerNameConfig(TrainerType.PARASOL_LADY),
  [TrainerType.PILOT]: new TrainerNameConfig(TrainerType.PILOT),
  [TrainerType.POKEFAN]: new TrainerNameConfig(TrainerType.POKEFAN, "Poké_Fan"),
  [TrainerType.PRESCHOOLER]: new TrainerNameConfig(TrainerType.PRESCHOOLER),
  [TrainerType.PSYCHIC]: new TrainerNameConfig(TrainerType.PSYCHIC),
  [TrainerType.RANGER]: new TrainerNameConfig(TrainerType.RANGER),
  [TrainerType.RICH]: new TrainerNameConfig(TrainerType.RICH, "Gentleman").hasGenderVariant("Madame"),
  [TrainerType.RICH_KID]: new TrainerNameConfig(TrainerType.RICH_KID, "Rich_Boy").hasGenderVariant("Lady"),
  [TrainerType.ROUGHNECK]: new TrainerNameConfig(TrainerType.ROUGHNECK),
  [TrainerType.SAILOR]: new TrainerNameConfig(TrainerType.SAILOR),
  [TrainerType.SCIENTIST]: new TrainerNameConfig(TrainerType.SCIENTIST),
  [TrainerType.SMASHER]: new TrainerNameConfig(TrainerType.SMASHER),
  [TrainerType.SNOW_WORKER]: new TrainerNameConfig(TrainerType.SNOW_WORKER, "Worker"),
  [TrainerType.STRIKER]: new TrainerNameConfig(TrainerType.STRIKER),
  [TrainerType.SCHOOL_KID]: new TrainerNameConfig(TrainerType.SCHOOL_KID, "School_Kid"),
  [TrainerType.SWIMMER]: new TrainerNameConfig(TrainerType.SWIMMER),
  [TrainerType.TWINS]: new TrainerNameConfig(TrainerType.TWINS),
  [TrainerType.VETERAN]: new TrainerNameConfig(TrainerType.VETERAN),
  [TrainerType.WAITER]: new TrainerNameConfig(TrainerType.WAITER).hasGenderVariant("Waitress"),
  [TrainerType.WORKER]: new TrainerNameConfig(TrainerType.WORKER),
  [TrainerType.YOUNGSTER]: new TrainerNameConfig(TrainerType.YOUNGSTER).hasGenderVariant("Lass")
};

export const trainerNamePools = {
  [TrainerType.ACE_TRAINER]: [["Aaron","Allen","Blake","Brian","Gaven","Jake","Kevin","Mike","Nick","Paul","Ryan","Sean","Darin","Albert","Berke","Clyde","Edgar","George","Leroy","Owen","Parker","Randall","Ruben","Samuel","Vincent","Warren","Wilton","Zane","Alfred","Braxton","Felix","Gerald","Jonathan","Leonel","Marcel","Mitchell","Quincy","Roderick","Colby","Rolando","Yuji","Abel","Anton","Arthur","Cesar","Dalton","Dennis","Ernest","Garrett","Graham","Henry","Isaiah","Jonah","Jose","Keenan","Micah","Omar","Quinn","Rodolfo","Saul","Sergio","Skylar","Stefan","Zachery","Alton","Arabella","Bonita","Cal","Cody","French","Kobe","Paulo","Shaye","Austin","Beckett","Charlie","Corky","David","Dwayne","Elmer","Jesse","Jared","Johan","Jordan","Kipp","Lou","Terry","Tom","Webster","Billy","Doyle","Enzio","Geoff","Grant","Kelsey","Miguel","Pierce","Ray","Santino","Shel","Adelbert","Bence","Emil","Evan","Mathis","Maxim","Neil","Rico","Robbie","Theo","Viktor","Benedict","Cornelius","Hisato","Leopold","Neville","Vito","Chase","Cole","Hiroshi","Jackson","Jim","Kekoa","Makana","Yuki","Elwood","Seth","Alvin","Arjun","Arnold","Cameron","Carl","Carlton","Christopher","Dave","Dax","Dominic","Edmund","Finn","Fred","Garret","Grayson","Jace","Jaxson","Jay","Jirard","Johnson","Kayden","Kite","Louis","Mac","Marty","Percy","Raymond","Ronnie","Satch","Tim","Zach","Conner","Vince","Bedro","Boda","Botan","Daras","Dury","Herton","Rewn","Stum","Tock","Trilo","Berki","Cruik","Dazon","Desid","Dillot","Farfin","Forgon","Hebel","Morfon","Moril","Shadd","Vanhub","Bardo","Carben","Degin","Gorps","Klept","Lask","Malex","Mopar","Niled","Noxon","Teslor","Tetil"],["Beth","Carol","Cybil","Emma","Fran","Gwen","Irene","Jenn","Joyce","Kate","Kelly","Lois","Lola","Megan","Quinn","Reena","Cara","Alexa","Brooke","Caroline","Elaine","Hope","Jennifer","Jody","Julie","Lori","Mary","Michelle","Shannon","Wendy","Alexia","Alicia","Athena","Carolina","Cristin","Darcy","Dianne","Halle","Jazmyn","Katelynn","Keira","Marley","Allyson","Kathleen","Naomi","Alyssa","Ariana","Brandi","Breanna","Brenda","Brenna","Catherine","Clarice","Dana","Deanna","Destiny","Jamie","Jasmin","Kassandra","Laura","Maria","Mariah","Maya","Meagan","Mikayla","Monique","Natasha","Olivia","Sandra","Savannah","Sydney","Moira","Piper","Salma","Allison","Beverly","Cathy","Cheyenne","Clara","Dara","Eileen","Glinda","Junko","Lena","Lucille","Mariana","Olwen","Shanta","Stella","Angi","Belle","Chandra","Cora","Eve","Jacqueline","Jeanne","Juliet","Kathrine","Layla","Lucca","Melina","Miki","Nina","Sable","Shelly","Summer","Trish","Vicki","Alanza","Cordelia","Hilde","Imelda","Michele","Mireille","Claudia","Constance","Harriet","Honor","Melba","Portia","Alexis","Angela","Karla","Lindsey","Tori","Sheri","Jada","Kailee","Amanda","Annie","Kindra","Kyla","Sofia","Yvette","Becky","Flora","Gloria","Buna","Ferda","Lehan","Liqui","Lomen","Neira","Atilo","Detta","Gilly","Gosney","Levens","Moden","Rask","Rateis","Rosno","Tynan","Veron","Zoel","Cida","Dibsin","Dodin","Ebson","Equin","Flostin","Gabsen","Halsion","Hileon","Quelor","Rapeel","Roze","Tensin"]],
  [TrainerType.ARTIST]: [["Ismael","William","Horton","Pierre","Zach","Gough","Salvador","Vincent","Duncan"],["Georgia"]],
  [TrainerType.BACKERS]: [["Alf & Fred","Hawk & Dar","Joe & Ross","Les & Web","Masa & Yas","Stu & Art"],["Ai & Ciel","Ami & Eira","Cam & Abby","Fey & Sue","Kat & Phae","Kay & Ali","Ava & Aya","Cleo & Rio","May & Mal"]],
  [TrainerType.BACKPACKER]: [["Alexander","Carlos","Herman","Jerome","Keane","Kelsey","Kiyo","Michael","Nate","Peter","Sam","Stephen","Talon","Terrance","Toru","Waylon","Boone","Clifford","Ivan","Kendall","Lowell","Randall","Reece","Roland","Shane","Walt","Farid","Heike","Joren","Lane","Roderick","Darnell","Deon","Emory","Graeme","Grayson","Aitor","Alex","Arturo","Asier","Jaime","Jonathan","Julio","Kevin","Kosuke","Lander","Markel","Mateo","Nil","Pau","Samuel"],["Anna","Corin","Elaine","Emi","Jill","Kumiko","Liz","Lois","Lora","Molly","Patty","Ruth","Vicki","Annie","Blossom","Clara","Eileen","Mae","Myra","Rachel","Tami","Ashley","Mikiko","Kiana","Perdy","Maria","Yuho","Peren","Barbara","Diane"]],
  [TrainerType.BAKER]: ["Chris","Jenn","Lilly"],
  [TrainerType.BEAUTY]: ["Cassie","Julia","Olivia","Samantha","Valerie","Victoria","Bridget","Connie","Jessica","Johanna","Melissa","Sheila","Shirley","Tiffany","Namiko","Thalia","Grace","Lola","Lori","Maura","Tamia","Cyndy","Devon","Gabriella","Harley","Lindsay","Nicola","Callie","Charlotte","Kassandra","December","Fleming","Nikola","Aimee","Anais","Brigitte","Cassandra","Andrea","Brittney","Carolyn","Krystal","Alexis","Alice","Aina","Anya","Arianna","Aubrey","Beverly","Camille","Beauty","Evette","Hansol","Haruka","Jill","Jo","Lana","Lois","Lucy","Mai","Nickie","Nicole","Prita","Rose","Shelly","Suzy","Tessa","Anita","Alissa","Rita","Cudsy","Eloff","Miru","Minot","Nevah","Niven","Ogoin"],
  [TrainerType.BIKER]: ["Charles","Dwayne","Glenn","Harris","Joel","Riley","Zeke","Alex","Billy","Ernest","Gerald","Hideo","Isaac","Jared","Jaren","Jaxon","Jordy","Lao","Lukas","Malik","Nikolas","Ricardo","Ruben","Virgil","William","Aiden","Dale","Dan","Jacob","Markey","Reese","Teddy","Theron","Jeremy","Morgann","Phillip","Philip","Stanley","Dillon"],
  [TrainerType.BLACK_BELT]: [["Kenji","Lao","Lung","Nob","Wai","Yoshi","Atsushi","Daisuke","Hideki","Hitoshi","Kiyo","Koichi","Koji","Yuji","Cristian","Rhett","Takao","Theodore","Zander","Aaron","Hugh","Mike","Nicolas","Shea","Takashi","Adam","Carl","Colby","Darren","David","Davon","Derek","Eddie","Gregory","Griffin","Jarrett","Jeffery","Kendal","Kyle","Luke","Miles","Nathaniel","Philip","Rafael","Ray","Ricky","Sean","Willie","Ander","Manford","Benjamin","Corey","Edward","Grant","Jay","Kendrew","Kentaro","Ryder","Teppei","Thomas","Tyrone","Andrey","Donny","Drago","Gordon","Grigor","Jeriel","Kenneth","Martell","Mathis","Rich","Rocky","Rodrigo","Wesley","Zachery","Alonzo","Cadoc","Gunnar","Igor","Killian","Markus","Ricardo","Yanis","Banting","Clayton","Duane","Earl","Greg","Roy","Terry","Tracy","Walter","Alvaro","Curtis","Francis","Ross","Brice","Cheng","Dudley","Eric","Kano","Masahiro","Randy","Ryuji","Steve","Tadashi","Wong","Yuen","Brian","Carter","Reece","Nick","Yang"],["Cora","Cyndy","Jill","Laura","Sadie","Tessa","Vivian","Aisha","Callie","Danielle","Helene","Jocelyn","Lilith","Paula","Reyna","Helen","Kelsey","Tyler","Amy","Chandra","Hillary","Janie","Lee","Maggie","Mikiko","Miriam","Sharon","Susie","Xiao","Alize","Azra","Brenda","Chalina","Chan","Glinda","Maki","Tia","Tiffany","Wendy","Andrea","Gabrielle","Gerardine","Hailey","Hedvig","Justine","Kinsey","Sigrid","Veronique","Tess"]],
  [TrainerType.BREEDER]: [["Isaac","Myles","Salvadore","Albert","Kahlil","Eustace","Galen","Owen","Addison","Marcus","Foster","Cory","Glenn","Jay","Wesley","William","Adrian","Bradley","Jaime"],["Allison","Alize","Bethany","Lily","Lydia","Gabrielle","Jayden","Pat","Veronica","Amber","Jennifer","Kaylee","Adelaide","Brooke","Ethel","April","Irene","Magnolia","Amala","Mercy","Amanda","Ikue","Savannah","Yuka","Chloe","Debra","Denise","Elena"]],
  [TrainerType.CLERK]: [["Chaz","Clemens","Doug","Fredric","Ivan","Isaac","Nelson","Wade","Warren","Augustin","Gilligan","Cody","Jeremy","Shane","Dugal","Royce","Ronald"],["Alberta","Ingrid","Katie","Piper","Trisha","Wren","Britney","Lana","Jessica","Kristen","Michelle","Gabrielle"]],
  [TrainerType.CYCLIST]: [["Axel","James","John","Ryan","Hector","Jeremiah"],["Kayla","Megan","Nicole","Rachel","Krissa","Adelaide"]],
  [TrainerType.DANCER]: ["Brian","Davey","Dirk","Edmond","Mickey","Raymond","Cara","Julia","Maika","Mireille","Ronda","Zoe"],
  [TrainerType.DEPOT_AGENT]: ["Josh","Hank","Vincent"],
  [TrainerType.DOCTOR]: [["Hank","Jerry","Jules","Logan","Wayne","Braid","Derek","Heath","Julius","Kit","Graham"],["Kirsten","Sachiko","Shery","Carol","Dixie","Mariah"]],
  [TrainerType.FIREBREATHER]: ["Bill","Burt","Cliff","Dick","Lyle","Ned","Otis","Ray","Richard","Walt"],
  [TrainerType.FISHERMAN]: ["Andre","Arnold","Barney","Chris","Edgar","Henry","Jonah","Justin","Kyle","Martin","Marvin","Ralph","Raymond","Scott","Stephen","Wilton","Tully","Andrew","Barny","Carter","Claude","Dale","Elliot","Eugene","Ivan","Ned","Nolan","Roger","Ronald","Wade","Wayne","Darian","Kai","Chip","Hank","Kaden","Tommy","Tylor","Alec","Brett","Cameron","Cody","Cole","Cory","Erick","George","Joseph","Juan","Kenneth","Luc","Miguel","Travis","Walter","Zachary","Josh","Gideon","Kyler","Liam","Murphy","Bruce","Damon","Devon","Hubert","Jones","Lydon","Mick","Pete","Sean","Sid","Vince","Bucky","Dean","Eustace","Kenzo","Leroy","Mack","Ryder","Ewan","Finn","Murray","Seward","Shad","Wharton","Finley","Fisher","Fisk","River","Sheaffer","Timin","Carl","Ernest","Hal","Herbert","Hisato","Mike","Vernon","Harriet","Marina","Chase"],
  [TrainerType.GUITARIST]: ["Anna","Beverly","January","Tina","Alicia","Claudia","Julia","Lidia","Mireia","Noelia","Sara","Sheila","Tatiana"],
  [TrainerType.HARLEQUIN]: ["Charley","Ian","Jack","Kerry","Louis","Pat","Paul","Rick","Anders","Clarence","Gary"],
  [TrainerType.HIKER]: ["Anthony","Bailey","Benjamin","Daniel","Erik","Jim","Kenny","Leonard","Michael","Parry","Phillip","Russell","Sidney","Tim","Timothy","Alan","Brice","Clark","Eric","Lenny","Lucas","Mike","Trent","Devan","Eli","Marc","Sawyer","Allen","Daryl","Dudley","Earl","Franklin","Jeremy","Marcos","Nob","Oliver","Wayne","Alexander","Damon","Jonathan","Justin","Kevin","Lorenzo","Louis","Maurice","Nicholas","Reginald","Robert","Theodore","Bruce","Clarke","Devin","Dwight","Edwin","Eoin","Noland","Russel","Andy","Bret","Darrell","Gene","Hardy","Hugh","Jebediah","Jeremiah","Kit","Neil","Terrell","Don","Doug","Hunter","Jared","Jerome","Keith","Manuel","Markus","Otto","Shelby","Stephen","Teppei","Tobias","Wade","Zaiem","Aaron","Alain","Bergin","Bernard","Brent","Corwin","Craig","Delmon","Dunstan","Orestes","Ross","Davian","Calhoun","David","Gabriel","Ryan","Thomas","Travis","Zachary","Anuhea","Barnaby","Claus","Collin","Colson","Dexter","Dillan","Eugine","Farkas","Hisato","Julius","Kenji","Irwin","Lionel","Paul","Richter","Valentino","Donald","Douglas","Kevyn","Chester"], //["Angela","Carla","Celia","Daniela","Estela","Fatima","Helena","Leire","Lucia","Luna","Manuela","Mar","Marina","Miyu","Nancy","Nerea","Paula","Rocio","Yanira"]
  [TrainerType.HOOLIGANS]: ["Jim & Cas","Rob & Sal"],
  [TrainerType.HOOPSTER]: ["Bobby","John","Lamarcus","Derrick","Nicolas"],
  [TrainerType.INFIELDER]: ["Alex","Connor","Todd"],
  [TrainerType.JANITOR]: ["Caleb","Geoff","Brady","Felix","Orville","Melvin","Shawn"],
  [TrainerType.LINEBACKER]: ["Bob","Dan","Jonah"],
  [TrainerType.MAID]: ["Belinda","Sophie","Emily","Elena","Clare","Alica","Tanya","Tammy"],
  [TrainerType.MUSICIAN]: ["Boris","Preston","Charles","Clyde","Vincent","Dalton","Kirk","Shawn","Fabian","Fernando","Joseph","Marcos","Arturo","Jerry","Lonnie","Tony"],
  [TrainerType.NURSERY_AIDE]: ["Autumn","Briana","Leah","Miho","Ethel","Hollie","Ilse","June","Kimya","Rosalyn"],
  [TrainerType.OFFICER]: ["Dirk","Keith","Alex","Bobby","Caleb","Danny","Dylan","Thomas","Daniel","Jeff","Braven","Dell","Neagle","Haruki","Mitchell","Raymond"],
  [TrainerType.PARASOL_LADY]: ["Angelica","Clarissa","Madeline","Akari","Annabell","Kayley","Rachel","Alexa","Sabrina","April","Gwyneth","Laura","Lumi","Mariah","Melita","Nicole","Tihana","Ingrid","Tyra"],
  [TrainerType.PILOT]: ["Chase","Leonard","Ted","Elron","Ewing","Flynn","Winslow"],
  [TrainerType.POKEFAN]: [["Alex","Allan","Brandon","Carter","Colin","Derek","Jeremy","Joshua","Rex","Robert","Trevor","William","Colton","Miguel","Francisco","Kaleb","Leonard","Boone","Elliot","Jude","Norbert","Corey","Gabe","Baxter"],["Beverly","Georgia","Jaime","Ruth","Isabel","Marissa","Vanessa","Annika","Bethany","Kimberly","Meredith","Rebekah","Eleanor","Darcy","Lydia","Sachiko","Abigail","Agnes","Lydie","Roisin","Tara","Carmen","Janet"]],
  [TrainerType.PRESCHOOLER]: [["Billy","Doyle","Evan","Homer","Tully","Albert","Buster","Greg","Ike","Jojo","Tyrone","Adrian","Oliver","Hayden","Hunter","Kaleb","Liam","Dylan"],["Juliet","Mia","Sarah","Wendy","Winter","Chrissy","Eva","Lin","Samantha","Ella","Lily","Natalie","Ailey","Hannah","Malia","Kindra","Nancy"]],
  [TrainerType.PSYCHIC]: [["Fidel","Franklin","Gilbert","Greg","Herman","Jared","Mark","Nathan","Norman","Phil","Richard","Rodney","Cameron","Edward","Fritz","Joshua","Preston","Virgil","William","Alvaro","Blake","Cedric","Keenan","Nicholas","Dario","Johan","Lorenzo","Tyron","Bryce","Corbin","Deandre","Elijah","Kody","Landon","Maxwell","Mitchell","Sterling","Eli","Nelson","Vernon","Gaven","Gerard","Low","Micki","Perry","Rudolf","Tommy","Al","Nandor","Tully","Arthur","Emanuel","Franz","Harry","Paschal","Robert","Sayid","Angelo","Anton","Arin","Avery","Danny","Frasier","Harrison","Jaime","Ross","Rui","Vlad","Mason"],["Alexis","Hannah","Jacki","Jaclyn","Kayla","Maura","Samantha","Alix","Brandi","Edie","Macey","Mariella","Marlene","Laura","Rodette","Abigail","Brittney","Chelsey","Daisy","Desiree","Kendra","Lindsey","Rachael","Valencia","Belle","Cybil","Doreen","Dua","Future","Lin","Madhu","Alia","Ena","Joyce","Lynette","Olesia","Sarah"]],
  [TrainerType.RANGER]: [["Carlos","Jackson","Sebastian","Gav","Lorenzo","Logan","Nicolas","Trenton","Deshawn","Dwayne","Jeffery","Kyler","Taylor","Alain","Claude","Crofton","Forrest","Harry","Jaden","Keith","Lewis","Miguel","Pedro","Ralph","Richard","Bret","Daryl","Eddie","Johan","Leaf","Louis","Maxwell","Parker","Rick","Steve","Bjorn","Chaise","Dean","Lee","Maurice","Nash","Ralf","Reed","Shinobu","Silas"],["Catherine","Jenna","Sophia","Merdith","Nora","Beth","Chelsea","Katelyn","Madeline","Allison","Ashlee","Felicia","Krista","Annie","Audra","Brenda","Chloris","Eliza","Heidi","Irene","Mary","Mylene","Shanti","Shelly","Thalia","Anja","Briana","Dianna","Elaine","Elle","Hillary","Katie","Lena","Lois","Malory","Melita","Mikiko","Naoko","Serenity","Ambre","Brooke","Clementine","Melina","Petra","Twiggy"]],
  [TrainerType.RICH]: [["Alfred","Edward","Gregory","Preston","Thomas","Tucker","Walter","Clifford","Everett","Micah","Nate","Pierre","Terrance","Arthur","Brooks","Emanuel","Lamar","Jeremy","Leonardo","Milton","Frederic","Renaud","Robert","Yan","Daniel","Sheldon","Stonewall","Gerald","Ronald","Smith","Stanley","Reginald","Orson","Wilco","Caden","Glenn"],["Rebecca","Reina","Cassandra","Emilia","Grace","Marian","Elizabeth","Kathleen","Sayuri","Caroline","Judy"]],
  [TrainerType.RICH_KID]: [["Garret","Winston","Dawson","Enrique","Jason","Roman","Trey","Liam","Anthony","Brad","Cody","Manuel","Martin","Pierce","Rolan","Keenan","Filbert","Antoin","Cyus","Diek","Dugo","Flitz","Jurek","Lond","Perd","Quint","Basto","Benit","Brot","Denc","Guyit","Marcon","Perc","Puros","Roex","Sainz","Symin","Tark","Venak"],["Anette","Brianna","Cindy","Colleen","Daphne","Elizabeth","Naomi","Sarah","Charlotte","Gillian","Jacki","Lady","Melissa","Celeste","Colette","Elizandra","Isabel","Lynette","Magnolia","Sophie","Lina","Dulcie","Auro","Brin","Caril","Eloos","Gwin","Illa","Kowly","Rima","Ristin","Vesey","Brena","Deasy","Denslon","Kylet","Nemi","Rene","Sanol","Stouner","Sturk","Talmen","Zoila"]],
  [TrainerType.ROUGHNECK]: ["Camron","Corey","Gabriel","Isaiah","Jamal","Koji","Luke","Paxton","Raul","Zeek","Kirby","Chance","Dave","Fletcher","Johnny","Reese","Joey","Ricky","Silvester","Martin"],
  [TrainerType.SAILOR]: ["Alberto","Bost","Brennan","Brenden","Claude","Cory","Damian","Dirk","Duncan","Dwayne","Dylan","Eddie","Edmond","Elijah","Ernest","Eugene","Garrett","Golos","Gratin","Grestly","Harry","Hols","Hudson","Huey","Jebol","Jeff","Leonald","Luther","Kelvin","Kenneth","Kent","Knook","Marc","Mifis","Monar","Morkor","Ordes","Oxlin","Parker","Paul","Philip","Roberto","Samson","Skyler","Stanly","Tebu","Terrell","Trevor","Yasu","Zachariah"],
  [TrainerType.SCIENTIST]: [["Jed","Marc","Mitch","Rich","Ross","Beau","Braydon","Connor","Ed","Ivan","Jerry","Jose","Joshua","Parker","Rodney","Taylor","Ted","Travis","Zackery","Darrius","Emilio","Fredrick","Shaun","Stefano","Travon","Daniel","Garett","Gregg","Linden","Lowell","Trenton","Dudley","Luke","Markus","Nathan","Orville","Randall","Ron","Ronald","Simon","Steve","William","Franklin","Clarke","Jacques","Terrance","Ernst","Justus","Ikaika","Jayson","Kyle","Reid","Tyrone","Adam","Albert","Alphonse","Cory","Donnie","Elton","Francis","Gordon","Herbert","Humphrey","Jordan","Julian","Keaton","Levi","Melvin","Murray","West","Craig","Coren","Dubik","Kotan","Lethco","Mante","Mort","Myron","Odlow","Ribek","Roeck","Vogi","Vonder","Zogo","Doimo","Doton","Durel","Hildon","Kukla","Messa","Nanot","Platen","Raburn","Reman","Acrod","Coffy","Elrok","Foss","Hardig","Hombol","Hospel","Kaller","Klots","Krilok","Limar","Loket","Mesak","Morbit","Newin","Orill","Tabor","Tekot"],["Blythe","Chan","Kathrine","Marie","Maria","Naoko","Samantha","Satomi","Shannon","Athena","Caroline","Lumi","Lumina","Marissa","Sonia"]],
  [TrainerType.SMASHER]: ["Aspen","Elena","Mari","Amy","Lizzy"],
  [TrainerType.SNOW_WORKER]: [["Braden","Brendon","Colin","Conrad","Dillan","Gary","Gerardo","Holden","Jackson","Mason","Quentin","Willy","Noel","Arnold","Brady","Brand","Cairn","Cliff","Don","Eddie","Felix","Filipe","Glenn","Gus","Heath","Matthew","Patton","Rich","Rob","Ryan","Scott","Shelby","Sterling","Tyler","Victor","Zack","Friedrich","Herman","Isaac","Leo","Maynard","Mitchell","Morgann","Nathan","Niel","Pasqual","Paul","Tavarius","Tibor","Dimitri","Narek","Yusif","Frank","Jeff","Vaclav","Ovid","Francis","Keith","Russel","Sangon","Toway","Bomber","Chean","Demit","Hubor","Kebile","Laber","Ordo","Retay","Ronix","Wagel","Dobit","Kaster","Lobel","Releo","Saken","Rustix"],["Georgia","Sandra","Yvonne"]],
  [TrainerType.STRIKER]: ["Marco","Roberto","Tony"],
  [TrainerType.SCHOOL_KID]: [["Alan","Billy","Chad","Danny","Dudley","Jack","Joe","Johnny","Kipp","Nate","Ricky","Tommy","Jerry","Paul","Ted","Chance","Esteban","Forrest","Harrison","Connor","Sherman","Torin","Travis","Al","Carter","Edgar","Jem","Sammy","Shane","Shayne","Alvin","Keston","Neil","Seymour","William","Carson","Clark","Nolan"],["Georgia","Karen","Meiko","Christine","Mackenzie","Tiera","Ann","Gina","Lydia","Marsha","Millie","Sally","Serena","Silvia","Alberta","Cassie","Mara","Rita","Georgie","Meena","Nitzel"]],
  [TrainerType.SWIMMER]: [["Berke","Cameron","Charlie","George","Harold","Jerome","Kirk","Mathew","Parker","Randall","Seth","Simon","Tucker","Austin","Barry","Chad","Cody","Darrin","David","Dean","Douglas","Franklin","Gilbert","Herman","Jack","Luis","Matthew","Reed","Richard","Rodney","Roland","Spencer","Stan","Tony","Clarence","Declan","Dominik","Harrison","Kevin","Leonardo","Nolen","Pete","Santiago","Axle","Braden","Finn","Garrett","Mymo","Reece","Samir","Toby","Adrian","Colton","Dillon","Erik","Evan","Francisco","Glenn","Kurt","Oscar","Ricardo","Sam","Sheltin","Troy","Vincent","Wade","Wesley","Duane","Elmo","Esteban","Frankie","Ronald","Tyson","Bart","Matt","Tim","Wright","Jeffery","Kyle","Alessandro","Estaban","Kieran","Ramses","Casey","Dakota","Jared","Kalani","Keoni","Lawrence","Logan","Robert","Roddy","Yasu","Derek","Jacob","Bruce","Clayton"],["Briana","Dawn","Denise","Diana","Elaine","Kara","Kaylee","Lori","Nicole","Nikki","Paula","Susie","Wendy","Alice","Beth","Beverly","Brenda","Dana","Debra","Grace","Jenny","Katie","Laurel","Linda","Missy","Sharon","Tanya","Tara","Tisha","Carlee","Imani","Isabelle","Kyla","Sienna","Abigail","Amara","Anya","Connie","Maria","Melissa","Nora","Shirley","Shania","Tiffany","Aubree","Cassandra","Claire","Crystal","Erica","Gabrielle","Haley","Jessica","Joanna","Lydia","Mallory","Mary","Miranda","Paige","Sophia","Vanessa","Chelan","Debbie","Joy","Kendra","Leona","Mina","Caroline","Joyce","Larissa","Rebecca","Tyra","Dara","Desiree","Kaoru","Ruth","Coral","Genevieve","Isla","Marissa","Romy","Sheryl","Alexandria","Alicia","Chelsea","Jade","Kelsie","Laura","Portia","Shelby","Sara","Tiare","Kyra","Natasha","Layla","Scarlett","Cora"]],
  [TrainerType.TWINS]: ["Amy & May","Jo & Zoe","Meg & Peg","Ann & Anne","Lea & Pia","Amy & Liv","Gina & Mia","Miu & Yuki","Tori & Tia","Eli & Anne","Jen & Kira","Joy & Meg","Kiri & Jan","Miu & Mia","Emma & Lil","Liv & Liz","Teri & Tia","Amy & Mimi","Clea & Gil","Day & Dani","Kay & Tia","Tori & Til","Saya & Aya","Emy & Lin","Kumi & Amy","Mayo & May","Ally & Amy","Lia & Lily","Rae & Ula","Sola & Ana","Tara & Val","Faith & Joy","Nana & Nina"],
  [TrainerType.VETERAN]: [["Armando","Brenden","Brian","Clayton","Edgar","Emanuel","Grant","Harlan","Terrell","Arlen","Chester","Hugo","Martell","Ray","Shaun","Abraham","Carter","Claude","Jerry","Lucius","Murphy","Rayne","Ron","Sinan","Sterling","Vincent","Zach","Gerard","Gilles","Louis","Timeo","Akira","Don","Eric","Harry","Leon","Roger","Angus","Aristo","Brone","Johnny"],["Julia","Karla","Kim","Sayuri","Tiffany","Cathy","Cecile","Chloris","Denae","Gina","Maya","Oriana","Portia","Rhona","Rosaline","Catrina","Inga","Trisha","Heather","Lynn","Sheri","Alonsa","Ella","Leticia","Kiara"]],
  [TrainerType.WAITER]: [["Bert","Clint","Maxwell","Lou"],["Kati","Aurora","Bonita","Flo","Tia","Jan","Olwen","Paget","Paula","Talia"]],
  [TrainerType.WORKER]: [["Braden","Brendon","Colin","Conrad","Dillan","Gary","Gerardo","Holden","Jackson","Mason","Quentin","Willy","Noel","Arnold","Brady","Brand","Cairn","Cliff","Don","Eddie","Felix","Filipe","Glenn","Gus","Heath","Matthew","Patton","Rich","Rob","Ryan","Scott","Shelby","Sterling","Tyler","Victor","Zack","Friedrich","Herman","Isaac","Leo","Maynard","Mitchell","Morgann","Nathan","Niel","Pasqual","Paul","Tavarius","Tibor","Dimitri","Narek","Yusif","Frank","Jeff","Vaclav","Ovid","Francis","Keith","Russel","Sangon","Toway","Bomber","Chean","Demit","Hubor","Kebile","Laber","Ordo","Retay","Ronix","Wagel","Dobit","Kaster","Lobel","Releo","Saken","Rustix"],["Georgia","Sandra","Yvonne"]],
  [TrainerType.YOUNGSTER]: [["Albert","Gordon","Ian","Jason","Jimmy","Mikey","Owen","Samuel","Warren","Allen","Ben","Billy","Calvin","Dillion","Eddie","Joey","Josh","Neal","Timmy","Tommy","Breyden","Deandre","Demetrius","Dillon","Jaylen","Johnson","Shigenobu","Chad","Cole","Cordell","Dan","Dave","Destin","Nash","Tyler","Yasu","Austin","Dallas","Darius","Donny","Jonathon","Logan","Michael","Oliver","Sebastian","Tristan","Wayne","Norman","Roland","Regis","Abe","Astor","Keita","Kenneth","Kevin","Kyle","Lester","Masao","Nicholas","Parker","Wes","Zachary","Cody","Henley","Jaye","Karl","Kenny","Masahiro","Pedro","Petey","Sinclair","Terrell","Waylon","Aidan","Anthony","David","Jacob","Jayden","Cutler","Ham","Caleb","Kai","Honus","Kenway","Bret","Chris","Cid","Dennis","Easton","Ken","Robby","Ronny","Shawn","Benjamin","Jake","Travis","Adan","Aday","Beltran","Elian","Hernan","Julen","Luka","Roi","Bernie","Dustin","Jonathan","Wyatt"],["Alice","Bridget","Carrie","Connie","Dana","Ellen","Krise","Laura","Linda","Michelle","Shannon","Andrea","Crissy","Janice","Robin","Sally","Tiana","Haley","Ali","Ann","Dalia","Dawn","Iris","Joana","Julia","Kay","Lisa","Megan","Mikaela","Miriam","Paige","Reli","Blythe","Briana","Caroline","Cassidy","Kaitlin","Madeline","Molly","Natalie","Samantha","Sarah","Cathy","Dye","Eri","Eva","Fey","Kara","Lurleen","Maki","Mali","Maya","Miki","Sibyl","Daya","Diana","Flo","Helia","Henrietta","Isabel","Mai","Persephone","Serena","Anna","Charlotte","Elin","Elsa","Lise","Sara","Suzette","Audrey","Emmy","Isabella","Madison","Rika","Rylee","Salla","Ellie","Alexandra","Amy","Lass","Brittany","Chel","Cindy","Dianne","Emily","Emma","Evelyn","Hana","Harleen","Hazel","Jocelyn","Katrina","Kimberly","Lina","Marge","Mila","Mizuki","Rena","Sal","Satoko","Summer","Tomoe","Vicky","Yue","Yumi","Lauren","Rei","Riley","Lois","Nancy","Tammy","Terry"]],
  [TrainerType.HEX_MANIAC]: ["Kindra","Patricia","Tammy","Tasha","Valerie","Alaina","Kathleen","Leah","Makie","Sylvia","Anina","Arachna","Carrie","Desdemona","Josette","Luna","Melanie","Osanna","Raziah"],
};

// function used in a commented code
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchAndPopulateTrainerNames(url: string, parser: DOMParser, trainerNames: Set<string>, femaleTrainerNames: Set<string>, forceFemale: boolean = false) {
  return new Promise<void>(resolve => {
    fetch(`https://bulbapedia.bulbagarden.net/wiki/${url}_(Trainer_class)`)
      .then(response => response.text())
      .then(html => {
        console.log(url);
        const htmlDoc = parser.parseFromString(html, "text/html");
        const trainerListHeader = htmlDoc.querySelector("#Trainer_list").parentElement;
        const elements = [...trainerListHeader.parentElement.childNodes];
        const startChildIndex = elements.indexOf(trainerListHeader);
        const endChildIndex = elements.findIndex(h => h.nodeName === "H2" && elements.indexOf(h) > startChildIndex);
        const tables = elements.filter(t => {
          if (t.nodeName !== "TABLE" || t["className"] !== "expandable") {
            return false;
          }
          const childIndex = elements.indexOf(t);
          return childIndex > startChildIndex && childIndex < endChildIndex;
        }).map(t => t as Element);
        console.log(url, tables);
        for (const table of tables) {
          const trainerRows = [...table.querySelectorAll("tr:not(:first-child)")].filter(r => r.children.length === 9);
          for (const row of trainerRows) {
            const nameCell = row.firstElementChild;
            const content = nameCell.innerHTML;
            if (content.indexOf(" <a ") > -1) {
              const female = /♀/.test(content);
              if (url === "Twins") {
                console.log(content);
              }
              const nameMatch = />([a-z]+(?: &amp; [a-z]+)?)<\/a>/i.exec(content);
              if (nameMatch) {
                (female || forceFemale ? femaleTrainerNames : trainerNames).add(nameMatch[1].replace("&amp;", "&"));
              }
            }
          }
        }
        resolve();
      });
  });
}

/*export function scrapeTrainerNames() {
  const parser = new DOMParser();
  const trainerTypeNames = {};
  const populateTrainerNamePromises: Promise<void>[] = [];
  for (let t of Object.keys(trainerNameConfigs)) {
    populateTrainerNamePromises.push(new Promise<void>(resolve => {
      const trainerType = t;
      trainerTypeNames[trainerType] = [];

      const config = trainerNameConfigs[t] as TrainerNameConfig;
      const trainerNames = new Set<string>();
      const femaleTrainerNames = new Set<string>();
      console.log(config.urls, config.femaleUrls)
      const trainerClassRequests = config.urls.map(u => fetchAndPopulateTrainerNames(u, parser, trainerNames, femaleTrainerNames));
      if (config.femaleUrls)
        trainerClassRequests.push(...config.femaleUrls.map(u => fetchAndPopulateTrainerNames(u, parser, null, femaleTrainerNames, true)));
      Promise.all(trainerClassRequests).then(() => {
        console.log(trainerNames, femaleTrainerNames)
        trainerTypeNames[trainerType] = !femaleTrainerNames.size ? Array.from(trainerNames) : [ Array.from(trainerNames), Array.from(femaleTrainerNames) ];
        resolve();
      });
    }));
  }
  Promise.all(populateTrainerNamePromises).then(() => {
    let output = 'export const trainerNamePools = {';
    Object.keys(trainerTypeNames).forEach(t => {
      output += `\n\t[TrainerType.${TrainerType[t]}]: ${JSON.stringify(trainerTypeNames[t])},`;
    });
    output += `\n};`;
    console.log(output);
  });
}*/
