--[[
Time System for Pokemon Evolution
Minimal implementation for time-based evolution conditions

Provides:
- Day/night cycle detection
- Time-based evolution condition validation
- Basic time tracking for evolution requirements
--]]

local TimeSystem = {}

-- Time of day constants
local TimeOfDay = {
    DAWN = "DAWN",
    DAY = "DAY", 
    DUSK = "DUSK",
    NIGHT = "NIGHT"
}

-- Current game time state (will be set by battle context or game state)
local gameTimeState = {
    currentTime = TimeOfDay.DAY, -- Default to day
    battleTurn = 0,
    timeOfDayOverride = nil -- For testing or specific scenarios
}

-- Initialize time system
-- @param initialTime: Optional initial time override
function TimeSystem.init(initialTime)
    if initialTime then
        gameTimeState.currentTime = initialTime
    end
end

-- Get current time of day
-- @return: TimeOfDay constant
function TimeSystem.getCurrentTimeOfDay()
    if gameTimeState.timeOfDayOverride then
        return gameTimeState.timeOfDayOverride
    end
    
    return gameTimeState.currentTime
end

-- Set time of day (for testing or manual control)
-- @param timeOfDay: TimeOfDay constant to set
function TimeSystem.setTimeOfDay(timeOfDay)
    if TimeOfDay[timeOfDay] then
        gameTimeState.timeOfDayOverride = timeOfDay
    end
end

-- Clear time override (return to normal time calculation)
function TimeSystem.clearTimeOverride()
    gameTimeState.timeOfDayOverride = nil
end

-- Update time based on battle context
-- @param battleData: Battle data with turn count for time progression
function TimeSystem.updateFromBattleContext(battleData)
    if battleData and battleData.turn then
        gameTimeState.battleTurn = battleData.turn
        
        -- Simple time progression: every 20 turns = time change
        -- This is a minimal implementation for evolution conditions
        local timeIndex = math.floor((battleData.turn or 0) / 20) % 4
        local times = {TimeOfDay.DAY, TimeOfDay.DUSK, TimeOfDay.NIGHT, TimeOfDay.DAWN}
        gameTimeState.currentTime = times[timeIndex + 1]
    end
end

-- Check if current time matches evolution requirement
-- @param requiredTimes: Array of TimeOfDay values for evolution condition
-- @return: Boolean indicating if current time matches requirement
function TimeSystem.checkTimeCondition(requiredTimes)
    if not requiredTimes or type(requiredTimes) ~= "table" then
        return false
    end
    
    local currentTime = TimeSystem.getCurrentTimeOfDay()
    
    for _, timeRequirement in ipairs(requiredTimes) do
        if currentTime == timeRequirement then
            return true
        end
    end
    
    return false
end

-- Check if it's day time (for friendship day evolution)
-- @return: Boolean indicating if it's day time
function TimeSystem.isDayTime()
    local currentTime = TimeSystem.getCurrentTimeOfDay()
    return currentTime == TimeOfDay.DAY or currentTime == TimeOfDay.DAWN
end

-- Check if it's night time (for friendship night evolution)
-- @return: Boolean indicating if it's night time  
function TimeSystem.isNightTime()
    local currentTime = TimeSystem.getCurrentTimeOfDay()
    return currentTime == TimeOfDay.NIGHT or currentTime == TimeOfDay.DUSK
end

-- Get time-based evolution eligibility
-- @param evolutionTimeRequirement: Time requirement from evolution data
-- @return: Boolean indicating if time condition is met
function TimeSystem.checkEvolutionTimeRequirement(evolutionTimeRequirement)
    if not evolutionTimeRequirement then
        return true -- No time requirement
    end
    
    if type(evolutionTimeRequirement) == "string" then
        -- Single time requirement
        return TimeSystem.getCurrentTimeOfDay() == evolutionTimeRequirement
    elseif type(evolutionTimeRequirement) == "table" then
        -- Multiple time requirements
        return TimeSystem.checkTimeCondition(evolutionTimeRequirement)
    end
    
    return false
end

-- Get readable time description for evolution requirements
-- @param timeRequirement: Time requirement data
-- @return: Human-readable time requirement text
function TimeSystem.getTimeRequirementText(timeRequirement)
    if not timeRequirement then
        return "Any time"
    end
    
    if type(timeRequirement) == "string" then
        return timeRequirement:lower()
    elseif type(timeRequirement) == "table" then
        if #timeRequirement == 1 then
            return timeRequirement[1]:lower()
        else
            local timeTexts = {}
            for _, time in ipairs(timeRequirement) do
                table.insert(timeTexts, time:lower())
            end
            return table.concat(timeTexts, " or ")
        end
    end
    
    return "Special time condition"
end

-- Export time constants for other modules
TimeSystem.TimeOfDay = TimeOfDay

return TimeSystem