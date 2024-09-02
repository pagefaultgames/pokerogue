*PokéRogue is a browser based Pokémon fangame heavily inspired by the roguelite genre. Battle endlessly while gathering stacking items, exploring many different biomes, fighting trainers, bosses, and more!*

This is a mod for PokéRogue, for use with the offline version.
It's used to help with our routing project.

This program is for Windows - it does not have installers for Mac or Linux right now.
(You can still do run validation without this mod, of course)

## Feature progress
- [x] Logs all the steps you take while playing
- [x] Logs the wild Pokémon you encounter and their stats
- [x] Logs the category of trainers you encounter
- [x] In-Game GUI to export logs
- [x] Show damage values for attacks (present, but incomplete)
- [x] Show catch rates
- [x] Show attributes of wild Pokémon (max IVs, nature, abilities)

# Instructions
### Installation
- Make sure you have the app (download v1.3.1 [here](https://github.com/Admiral-Billy/Pokerogue-App/releases/tag/v1.3.1) - v2.0.0 and up will not work!)
- Look on the `Pathing Tool` forum in the `daily-projects` channel for the modified installer that allows downloading different versions
- Replace `resources/update-game.js` in the offline version's files with the modified installer
- Run `update-game.bat` in that same folder, typing `y` and pressing enter to confirm you want to install offline mode
- Select Pokerogue-Projects/Pathing-Tool (option 2 by default) and press enter again
 - "Beta" does nothing right now
- Wait (it will take a few minutes to install no matter which version you selected)
- Choose whether you want the offline version of the `pkmn.help` type calculator, then press enter one final time when prompted to close the terminal
### Setting up a run
- Open PokéRogue online (you can use [PokeRogue](https://pokerogue.net/) or the online mode of the app)
- Start a new Daily Run
- Save & Quit
- Open the menu
- Go to Manage Data, select Export Session, and select the slot you saved the Daily Run to - you will download a `.prsv` file
- Open the app in offline mode by running `Pokerogue Offine.bat`
- Open the menu, go to Manage Data, and instead *import* a session
- Select the `.prsv` you downloaded, and select a slot to save it to. When the game reloads, you'll see that the newly imported run has appeared as an option on the title screen.
- Open Manage Logs on the title screen.
- If you played a run already, be sure to export your files first.
- Select `Clear All (3)` to delete any previous run data.
### Playing the Daily Run
- All Daily Run saves will appear as buttons on the title screen. Selecting them will load the file as if you had opened the Load Game menu. (Selecting them in that menu still works, of course.)
- Play! The game will automatically log your run as you go.
 - **Warning**: The logs do not discriminate between saves, and if you open another save file, it will **overwrite** any data in Steps (`instructions.txt`) or Encounters (`encounters.csv`).
- When you're done, go to the title screen and open Manage Logs.
 - Select a log to save it to your device (the number in parenthases indicates the file size)
 - Select "Export All" to save all logs to your device at once (the number in parenthases indicates how many logs will be exported)
 - Select "Reset All" to delete all existing run data
