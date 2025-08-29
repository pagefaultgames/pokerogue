-- Battle Message Generation System
-- Creates narrative battle messages matching current game output format
-- Handles move descriptions, damage reporting, status changes, and battle flow
-- Provides localized and contextual battle text generation

local BattleMessages = {}

-- Load dependencies
local MoveDatabase = require("data.moves.move-database")
local Enums = require("data.constants.enums")

-- Message templates for different battle events
local MessageTemplates = {
    -- Move usage messages
    move_use = "{attacker} used {move_name}!",
    move_miss = "{attacker}'s attack missed!",
    move_failed = "But it failed!",
    move_no_effect = "It had no effect on {target}!",
    
    -- Damage and effectiveness messages
    damage_super_effective = "It's super effective!",
    damage_not_very_effective = "It's not very effective...",
    damage_critical = "A critical hit!",
    damage_generic = "{target} took {damage} damage!",
    
    -- Status effect messages
    status_burned = "{pokemon} was burned!",
    status_poisoned = "{pokemon} was poisoned!",
    status_paralyzed = "{pokemon} is paralyzed! It may not be able to move!",
    status_frozen = "{pokemon} was frozen solid!",
    status_asleep = "{pokemon} fell asleep!",
    status_confused = "{pokemon} became confused!",
    
    -- Status effect damage
    burn_damage = "{pokemon} was hurt by its burn!",
    poison_damage = "{pokemon} was hurt by poison!",
    confusion_damage = "{pokemon} hurt itself in its confusion!",
    
    -- Recovery messages
    status_thawed = "{pokemon} thawed out!",
    status_woke_up = "{pokemon} woke up!",
    status_cured = "{pokemon} recovered from its status condition!",
    
    -- Stat modification messages
    stat_rose = "{pokemon}'s {stat} rose!",
    stat_rose_sharply = "{pokemon}'s {stat} rose sharply!",
    stat_rose_drastically = "{pokemon}'s {stat} rose drastically!",
    stat_fell = "{pokemon}'s {stat} fell!",
    stat_fell_harshly = "{pokemon}'s {stat} fell harshly!",
    stat_fell_severely = "{pokemon}'s {stat} fell severely!",
    stat_maxed = "{pokemon}'s {stat} won't go any higher!",
    stat_minimized = "{pokemon}'s {stat} won't go any lower!",
    
    -- Weather and terrain messages
    weather_sunny = "The sunlight turned harsh!",
    weather_rain = "It started to rain!",
    weather_sandstorm = "A sandstorm kicked up!",
    weather_hail = "It started to hail!",
    weather_ended = "The weather cleared up!",
    
    terrain_electric = "An electric current ran across the battlefield!",
    terrain_grassy = "Grass grew to cover the battlefield!",
    terrain_misty = "Mist swirled around the battlefield!",
    terrain_psychic = "The battlefield got weird!",
    terrain_ended = "The terrain returned to normal!",
    
    -- Pokemon switching messages
    switch_out = "{pokemon}, come back!",
    switch_in = "Go! {pokemon}!",
    switch_forced = "{pokemon} was forced to switch out!",
    
    -- Fainting and battle end messages
    pokemon_fainted = "{pokemon} fainted!",
    battle_victory = "You won the battle!",
    battle_defeat = "You lost the battle!",
    battle_draw = "The battle ended in a draw!",
    battle_forfeit = "The battle was forfeited!",
    
    -- Ability activation messages
    ability_activated = "{pokemon}'s {ability} activated!",
    ability_prevented = "{pokemon}'s {ability} prevented the effect!",
    
    -- Item usage messages
    item_used = "{trainer} used a {item}!",
    item_effect = "{item} had an effect on {pokemon}!",
    item_consumed = "{pokemon}'s {item} was consumed!",
    
    -- Turn phase messages
    turn_start = "Turn {turn}",
    turn_end = "End of turn {turn}",
    command_phase = "Select your command for {pokemon}!",
    
    -- Error and fallback messages
    unknown_move = "{pokemon} tried to use an unknown move!",
    no_pp = "{pokemon} has no PP left for {move}!",
    cannot_act = "{pokemon} cannot act!",
    invalid_target = "There is no target for the move!"
}

-- Stat name mappings for message generation
local StatNames = {
    [Enums.Stat.HP] = "HP",
    [Enums.Stat.ATK] = "Attack",
    [Enums.Stat.DEF] = "Defense",
    [Enums.Stat.SPATK] = "Sp. Atk",
    [Enums.Stat.SPDEF] = "Sp. Def",
    [Enums.Stat.SPD] = "Speed",
    [Enums.Stat.ACC] = "accuracy",
    [Enums.Stat.EVA] = "evasiveness"
}

-- Initialize message system
function BattleMessages.init()
    -- Ensure move database is loaded for move names
    if not MoveDatabase.moves or #MoveDatabase.moves == 0 then
        MoveDatabase.init()
    end
    
    return true
end

-- Generate move usage message
-- @param attacker: Pokemon using the move
-- @param move: Move data or move ID
-- @param target: Target Pokemon (optional)
-- @param result: Move execution result
-- @return: List of message strings
function BattleMessages.generateMoveMessage(attacker, move, target, result)
    if not attacker then
        return {"A Pokemon used a move!"}
    end
    
    local messages = {}
    local moveName = "a move"
    
    -- Get move name
    if type(move) == "number" then
        local moveData = MoveDatabase.moves[move]
        moveName = moveData and moveData.name or "Unknown Move"
    elseif type(move) == "table" and move.name then
        moveName = move.name
    end
    
    -- Primary move usage message
    local attackerName = attacker.name or "Pokemon"
    local useMessage = BattleMessages.formatMessage(MessageTemplates.move_use, {
        attacker = attackerName,
        move_name = moveName
    })
    table.insert(messages, useMessage)
    
    -- Add result-specific messages
    if result then
        if result.missed then
            table.insert(messages, BattleMessages.formatMessage(MessageTemplates.move_miss, {
                attacker = attackerName
            }))
        elseif result.failed then
            table.insert(messages, MessageTemplates.move_failed)
        elseif result.no_effect and target then
            table.insert(messages, BattleMessages.formatMessage(MessageTemplates.move_no_effect, {
                target = target.name or "the target"
            }))
        elseif result.damage_dealt and result.damage_dealt > 0 and target then
            -- Add effectiveness messages
            if result.effectiveness > 1 then
                table.insert(messages, MessageTemplates.damage_super_effective)
            elseif result.effectiveness < 1 and result.effectiveness > 0 then
                table.insert(messages, MessageTemplates.damage_not_very_effective)
            end
            
            -- Add critical hit message
            if result.critical_hit then
                table.insert(messages, MessageTemplates.damage_critical)
            end
        end
    end
    
    return messages
end

-- Generate damage reporting message
-- @param target: Pokemon taking damage
-- @param damage: Amount of damage
-- @param damageType: Type of damage (move, weather, status, etc.)
-- @param effectiveness: Type effectiveness multiplier (optional)
-- @param critical: Whether damage was critical (optional)
-- @return: List of damage message strings
function BattleMessages.generateDamageMessage(target, damage, damageType, effectiveness, critical)
    local messages = {}
    
    if not target or not damage or damage <= 0 then
        return messages
    end
    
    local targetName = target.name or "Pokemon"
    
    -- Add effectiveness message first (for move damage)
    if damageType == "move" and effectiveness then
        if effectiveness > 1 then
            table.insert(messages, MessageTemplates.damage_super_effective)
        elseif effectiveness < 1 and effectiveness > 0 then
            table.insert(messages, MessageTemplates.damage_not_very_effective)
        end
        
        if critical then
            table.insert(messages, MessageTemplates.damage_critical)
        end
    end
    
    -- Generate specific damage message based on type
    if damageType == "burn" then
        table.insert(messages, BattleMessages.formatMessage(MessageTemplates.burn_damage, {
            pokemon = targetName
        }))
    elseif damageType == "poison" then
        table.insert(messages, BattleMessages.formatMessage(MessageTemplates.poison_damage, {
            pokemon = targetName
        }))
    elseif damageType == "confusion" then
        table.insert(messages, BattleMessages.formatMessage(MessageTemplates.confusion_damage, {
            pokemon = targetName
        }))
    else
        -- Generic damage message
        table.insert(messages, BattleMessages.formatMessage(MessageTemplates.damage_generic, {
            target = targetName,
            damage = tostring(damage)
        }))
    end
    
    return messages
end

-- Generate status change message
-- @param pokemon: Pokemon receiving status change
-- @param statusEffect: Status effect being applied/removed
-- @param applied: Whether status is being applied (true) or removed (false)
-- @return: Status change message string
function BattleMessages.generateStatusMessage(pokemon, statusEffect, applied)
    if not pokemon or not statusEffect then
        return "A status effect occurred!"
    end
    
    local pokemonName = pokemon.name or "Pokemon"
    
    if applied then
        -- Status being applied
        if statusEffect == "burn" then
            return BattleMessages.formatMessage(MessageTemplates.status_burned, {pokemon = pokemonName})
        elseif statusEffect == "poison" then
            return BattleMessages.formatMessage(MessageTemplates.status_poisoned, {pokemon = pokemonName})
        elseif statusEffect == "paralysis" then
            return BattleMessages.formatMessage(MessageTemplates.status_paralyzed, {pokemon = pokemonName})
        elseif statusEffect == "freeze" then
            return BattleMessages.formatMessage(MessageTemplates.status_frozen, {pokemon = pokemonName})
        elseif statusEffect == "sleep" then
            return BattleMessages.formatMessage(MessageTemplates.status_asleep, {pokemon = pokemonName})
        elseif statusEffect == "confusion" then
            return BattleMessages.formatMessage(MessageTemplates.status_confused, {pokemon = pokemonName})
        end
    else
        -- Status being removed
        if statusEffect == "freeze" then
            return BattleMessages.formatMessage(MessageTemplates.status_thawed, {pokemon = pokemonName})
        elseif statusEffect == "sleep" then
            return BattleMessages.formatMessage(MessageTemplates.status_woke_up, {pokemon = pokemonName})
        else
            return BattleMessages.formatMessage(MessageTemplates.status_cured, {pokemon = pokemonName})
        end
    end
    
    return pokemonName .. "'s status changed!"
end

-- Generate stat modification message
-- @param pokemon: Pokemon whose stats are modified
-- @param stat: Stat being modified (using Enums.Stat)
-- @param stages: Number of stat stages changed (positive = increase, negative = decrease)
-- @return: Stat modification message string
function BattleMessages.generateStatMessage(pokemon, stat, stages)
    if not pokemon or not stat or not stages or stages == 0 then
        return "A stat was modified!"
    end
    
    local pokemonName = pokemon.name or "Pokemon"
    local statName = StatNames[stat] or "stat"
    
    if stages > 0 then
        -- Stat increase
        if stages == 1 then
            return BattleMessages.formatMessage(MessageTemplates.stat_rose, {
                pokemon = pokemonName,
                stat = statName
            })
        elseif stages == 2 then
            return BattleMessages.formatMessage(MessageTemplates.stat_rose_sharply, {
                pokemon = pokemonName,
                stat = statName
            })
        else
            return BattleMessages.formatMessage(MessageTemplates.stat_rose_drastically, {
                pokemon = pokemonName,
                stat = statName
            })
        end
    else
        -- Stat decrease
        local absStages = math.abs(stages)
        if absStages == 1 then
            return BattleMessages.formatMessage(MessageTemplates.stat_fell, {
                pokemon = pokemonName,
                stat = statName
            })
        elseif absStages == 2 then
            return BattleMessages.formatMessage(MessageTemplates.stat_fell_harshly, {
                pokemon = pokemonName,
                stat = statName
            })
        else
            return BattleMessages.formatMessage(MessageTemplates.stat_fell_severely, {
                pokemon = pokemonName,
                stat = statName
            })
        end
    end
end

-- Generate weather change message
-- @param weatherType: New weather type (using BattleConditions.WeatherType)
-- @param ended: Whether weather is ending (optional)
-- @return: Weather message string
function BattleMessages.generateWeatherMessage(weatherType, ended)
    if ended then
        return MessageTemplates.weather_ended
    end
    
    local BattleConditions = require("game-logic.battle.battle-conditions")
    
    if weatherType == BattleConditions.WeatherType.SUNNY then
        return MessageTemplates.weather_sunny
    elseif weatherType == BattleConditions.WeatherType.RAIN then
        return MessageTemplates.weather_rain
    elseif weatherType == BattleConditions.WeatherType.SANDSTORM then
        return MessageTemplates.weather_sandstorm
    elseif weatherType == BattleConditions.WeatherType.HAIL then
        return MessageTemplates.weather_hail
    end
    
    return "The weather changed!"
end

-- Generate terrain change message
-- @param terrainType: New terrain type (using BattleConditions.TerrainType)
-- @param ended: Whether terrain is ending (optional)
-- @return: Terrain message string
function BattleMessages.generateTerrainMessage(terrainType, ended)
    if ended then
        return MessageTemplates.terrain_ended
    end
    
    local BattleConditions = require("game-logic.battle.battle-conditions")
    
    if terrainType == BattleConditions.TerrainType.ELECTRIC then
        return MessageTemplates.terrain_electric
    elseif terrainType == BattleConditions.TerrainType.GRASSY then
        return MessageTemplates.terrain_grassy
    elseif terrainType == BattleConditions.TerrainType.MISTY then
        return MessageTemplates.terrain_misty
    elseif terrainType == BattleConditions.TerrainType.PSYCHIC then
        return MessageTemplates.terrain_psychic
    end
    
    return "The terrain changed!"
end

-- Generate Pokemon switching messages
-- @param outPokemon: Pokemon being switched out
-- @param inPokemon: Pokemon being switched in
-- @param forced: Whether switch was forced (optional)
-- @return: List of switching message strings
function BattleMessages.generateSwitchMessage(outPokemon, inPokemon, forced)
    local messages = {}
    
    if outPokemon then
        local outName = outPokemon.name or "Pokemon"
        if forced then
            table.insert(messages, BattleMessages.formatMessage(MessageTemplates.switch_forced, {
                pokemon = outName
            }))
        else
            table.insert(messages, BattleMessages.formatMessage(MessageTemplates.switch_out, {
                pokemon = outName
            }))
        end
    end
    
    if inPokemon then
        local inName = inPokemon.name or "Pokemon"
        table.insert(messages, BattleMessages.formatMessage(MessageTemplates.switch_in, {
            pokemon = inName
        }))
    end
    
    return messages
end

-- Generate battle end message
-- @param battleResult: Battle result ("victory", "defeat", "draw", "forfeit")
-- @param reason: Reason for battle end (optional)
-- @return: Battle end message string
function BattleMessages.generateBattleEndMessage(battleResult, reason)
    if battleResult == "victory" then
        return MessageTemplates.battle_victory
    elseif battleResult == "defeat" then
        return MessageTemplates.battle_defeat
    elseif battleResult == "draw" then
        return MessageTemplates.battle_draw
    elseif battleResult == "forfeit" then
        return MessageTemplates.battle_forfeit
    end
    
    return "The battle has ended!"
end

-- Generate fainting message
-- @param pokemon: Pokemon that fainted
-- @return: Fainting message string
function BattleMessages.generateFaintMessage(pokemon)
    if not pokemon then
        return "A Pokemon fainted!"
    end
    
    local pokemonName = pokemon.name or "Pokemon"
    return BattleMessages.formatMessage(MessageTemplates.pokemon_fainted, {
        pokemon = pokemonName
    })
end

-- Generate turn phase message
-- @param phase: Turn phase ("start", "end", "command")
-- @param turnNumber: Current turn number
-- @param pokemon: Active Pokemon (for command phase)
-- @return: Turn phase message string
function BattleMessages.generateTurnPhaseMessage(phase, turnNumber, pokemon)
    if phase == "start" then
        return BattleMessages.formatMessage(MessageTemplates.turn_start, {
            turn = tostring(turnNumber)
        })
    elseif phase == "end" then
        return BattleMessages.formatMessage(MessageTemplates.turn_end, {
            turn = tostring(turnNumber)
        })
    elseif phase == "command" and pokemon then
        return BattleMessages.formatMessage(MessageTemplates.command_phase, {
            pokemon = pokemon.name or "Pokemon"
        })
    end
    
    return "Turn phase: " .. (phase or "unknown")
end

-- Generate ability activation message
-- @param pokemon: Pokemon whose ability activated
-- @param abilityName: Name of the ability
-- @param prevented: Whether ability prevented an effect (optional)
-- @return: Ability message string
function BattleMessages.generateAbilityMessage(pokemon, abilityName, prevented)
    if not pokemon or not abilityName then
        return "An ability activated!"
    end
    
    local pokemonName = pokemon.name or "Pokemon"
    
    if prevented then
        return BattleMessages.formatMessage(MessageTemplates.ability_prevented, {
            pokemon = pokemonName,
            ability = abilityName
        })
    else
        return BattleMessages.formatMessage(MessageTemplates.ability_activated, {
            pokemon = pokemonName,
            ability = abilityName
        })
    end
end

-- Generate item usage message
-- @param trainer: Trainer using item (optional)
-- @param item: Item being used
-- @param pokemon: Target Pokemon (optional)
-- @param consumed: Whether item was consumed (optional)
-- @return: Item usage message string
function BattleMessages.generateItemMessage(trainer, item, pokemon, consumed)
    if not item then
        return "An item was used!"
    end
    
    local trainerName = trainer or "Trainer"
    local itemName = type(item) == "string" and item or "item"
    
    if consumed and pokemon then
        return BattleMessages.formatMessage(MessageTemplates.item_consumed, {
            pokemon = pokemon.name or "Pokemon",
            item = itemName
        })
    elseif pokemon then
        return BattleMessages.formatMessage(MessageTemplates.item_effect, {
            item = itemName,
            pokemon = pokemon.name or "Pokemon"
        })
    else
        return BattleMessages.formatMessage(MessageTemplates.item_used, {
            trainer = trainerName,
            item = itemName
        })
    end
end

-- Format message template with parameters
-- @param template: Message template string with {parameter} placeholders
-- @param params: Table of parameter values
-- @return: Formatted message string
function BattleMessages.formatMessage(template, params)
    if not template then
        return "Message template error!"
    end
    
    local message = template
    
    if params then
        for key, value in pairs(params) do
            local placeholder = "{" .. key .. "}"
            message = string.gsub(message, placeholder, tostring(value))
        end
    end
    
    return message
end

-- Generate comprehensive battle action description
-- @param action: Battle action data
-- @param result: Action execution result
-- @return: List of descriptive message strings
function BattleMessages.generateActionDescription(action, result)
    local messages = {}
    
    if not action then
        return {"A battle action occurred!"}
    end
    
    -- Generate messages based on action type
    if action.type == "move" then
        local moveMessages = BattleMessages.generateMoveMessage(action.pokemon, action.moveId, action.target, result)
        for _, msg in ipairs(moveMessages) do
            table.insert(messages, msg)
        end
        
        -- Add damage messages if applicable
        if result and result.damage_dealt and result.damage_dealt > 0 and action.target then
            local damageMessages = BattleMessages.generateDamageMessage(
                action.target, 
                result.damage_dealt, 
                "move", 
                result.effectiveness, 
                result.critical_hit
            )
            for _, msg in ipairs(damageMessages) do
                table.insert(messages, msg)
            end
        end
        
        -- Add status effect messages
        if result and result.status_effects then
            for _, statusEffect in ipairs(result.status_effects) do
                local statusMsg = BattleMessages.generateStatusMessage(
                    statusEffect.target, 
                    statusEffect.status, 
                    statusEffect.applied
                )
                table.insert(messages, statusMsg)
            end
        end
        
    elseif action.type == "switch" then
        local switchMessages = BattleMessages.generateSwitchMessage(action.pokemon, action.switchTo)
        for _, msg in ipairs(switchMessages) do
            table.insert(messages, msg)
        end
        
    elseif action.type == "item" then
        local itemMsg = BattleMessages.generateItemMessage("Trainer", action.itemId, action.pokemon)
        table.insert(messages, itemMsg)
    end
    
    return messages
end

-- Generate error message for invalid actions
-- @param errorType: Type of error
-- @param pokemon: Pokemon involved (optional)
-- @param move: Move involved (optional)
-- @return: Error message string
function BattleMessages.generateErrorMessage(errorType, pokemon, move)
    local pokemonName = pokemon and pokemon.name or "Pokemon"
    local moveName = "move"
    
    if move then
        if type(move) == "number" then
            local moveData = MoveDatabase.moves[move]
            moveName = moveData and moveData.name or "unknown move"
        elseif type(move) == "table" and move.name then
            moveName = move.name
        end
    end
    
    if errorType == "no_pp" then
        return BattleMessages.formatMessage(MessageTemplates.no_pp, {
            pokemon = pokemonName,
            move = moveName
        })
    elseif errorType == "cannot_act" then
        return BattleMessages.formatMessage(MessageTemplates.cannot_act, {
            pokemon = pokemonName
        })
    elseif errorType == "invalid_target" then
        return MessageTemplates.invalid_target
    elseif errorType == "unknown_move" then
        return BattleMessages.formatMessage(MessageTemplates.unknown_move, {
            pokemon = pokemonName
        })
    end
    
    return "An error occurred during battle!"
end

return BattleMessages