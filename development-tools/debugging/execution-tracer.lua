-- Execution Tracer for Handler Debugging
-- Advanced tracing and debugging interfaces for AO handler execution

local ExecutionTracer = {}
ExecutionTracer.__index = ExecutionTracer

function ExecutionTracer.new(emulator)
    local tracer = setmetatable({}, ExecutionTracer)
    tracer.emulator = emulator
    tracer.traces = {}
    tracer.activeTraces = {}
    tracer.filters = {}
    tracer.breakpoints = {}
    tracer.callStack = {}
    tracer.enabled = false
    tracer.maxTraceSize = 10000 -- Maximum number of trace entries
    return tracer
end

-- Trace Management
function ExecutionTracer:startTracing(options)
    options = options or {}
    
    self.enabled = true
    self.traceSession = {
        id = "trace_" .. os.time(),
        startTime = os.time(),
        options = options,
        messageCount = 0,
        handlerCalls = 0,
        errors = {},
        performance = {
            totalExecutionTime = 0,
            averageMessageTime = 0,
            slowestHandler = nil,
            fastestHandler = nil
        }
    }
    
    -- Apply filters
    self.filters = {
        includeHandlers = options.includeHandlers,
        excludeHandlers = options.excludeHandlers,
        includeActions = options.includeActions,
        excludeActions = options.excludeActions,
        minExecutionTime = options.minExecutionTime or 0,
        maxTraceDepth = options.maxTraceDepth or 50
    }
    
    print("🔍 Execution tracing started: " .. self.traceSession.id)
    return self.traceSession.id
end

function ExecutionTracer:stopTracing()
    if not self.enabled then
        return nil
    end
    
    self.enabled = false
    self.traceSession.endTime = os.time()
    self.traceSession.duration = self.traceSession.endTime - self.traceSession.startTime
    
    -- Calculate final performance metrics
    if self.traceSession.messageCount > 0 then
        self.traceSession.performance.averageMessageTime = 
            self.traceSession.performance.totalExecutionTime / self.traceSession.messageCount
    end
    
    print("🔍 Execution tracing stopped. Duration: " .. self.traceSession.duration .. "s")
    
    local session = self.traceSession
    self.traceSession = nil
    
    return session
end

function ExecutionTracer:isTracing()
    return self.enabled
end

-- Message Tracing
function ExecutionTracer:traceMessage(message, executionResult)
    if not self.enabled then
        return
    end
    
    local messageTrace = {
        id = "msg_" .. self.traceSession.messageCount + 1,
        timestamp = os.time(),
        message = self:sanitizeMessage(message),
        execution = {
            startTime = os.clock(),
            endTime = nil,
            duration = 0,
            handlerResults = {},
            errors = {},
            stateChanges = {},
            callStack = {}
        },
        metadata = {
            messageSize = self:estimateObjectSize(message),
            handlerCount = 0,
            successfulHandlers = 0,
            failedHandlers = 0
        }
    }
    
    self.traceSession.messageCount = self.traceSession.messageCount + 1
    
    -- Process execution results
    if executionResult and executionResult.results then
        for _, handlerResult in ipairs(executionResult.results) do
            local handlerTrace = self:traceHandlerExecution(handlerResult, messageTrace)
            table.insert(messageTrace.execution.handlerResults, handlerTrace)
            
            messageTrace.metadata.handlerCount = messageTrace.metadata.handlerCount + 1
            
            if handlerTrace.success then
                messageTrace.metadata.successfulHandlers = messageTrace.metadata.successfulHandlers + 1
            else
                messageTrace.metadata.failedHandlers = messageTrace.metadata.failedHandlers + 1
                table.insert(messageTrace.execution.errors, handlerTrace.error)
            end
        end
    end
    
    messageTrace.execution.endTime = os.clock()
    messageTrace.execution.duration = messageTrace.execution.endTime - messageTrace.execution.startTime
    
    -- Update session performance metrics
    self.traceSession.performance.totalExecutionTime = 
        self.traceSession.performance.totalExecutionTime + messageTrace.execution.duration
    
    -- Apply filters
    if self:shouldIncludeTrace(messageTrace) then
        self:addTrace(messageTrace)
    end
    
    return messageTrace
end

function ExecutionTracer:traceHandlerExecution(handlerResult, messageContext)
    local handlerTrace = {
        handler = handlerResult.handler or "unknown",
        success = handlerResult.success,
        result = handlerResult.result,
        error = handlerResult.error,
        execution = {
            startTime = os.clock(),
            endTime = os.clock(),
            duration = 0,
            memoryUsage = 0,
            callDepth = #self.callStack
        },
        context = {
            messageId = messageContext.id,
            messageAction = messageContext.message.Action,
            stateSnapshot = nil -- Will be populated if needed
        }
    }
    
    -- Simulate execution timing (in real implementation, would measure actual execution)
    handlerTrace.execution.duration = math.random() * 0.01 -- Random duration for demo
    
    -- Track performance extremes
    if not self.traceSession.performance.slowestHandler or 
       handlerTrace.execution.duration > self.traceSession.performance.slowestHandler.duration then
        self.traceSession.performance.slowestHandler = {
            handler = handlerTrace.handler,
            duration = handlerTrace.execution.duration,
            messageId = messageContext.id
        }
    end
    
    if not self.traceSession.performance.fastestHandler or 
       handlerTrace.execution.duration < self.traceSession.performance.fastestHandler.duration then
        self.traceSession.performance.fastestHandler = {
            handler = handlerTrace.handler,
            duration = handlerTrace.execution.duration,
            messageId = messageContext.id
        }
    end
    
    self.traceSession.handlerCalls = self.traceSession.handlerCalls + 1
    
    return handlerTrace
end

-- Call Stack Management
function ExecutionTracer:pushCall(functionName, args)
    if not self.enabled then
        return
    end
    
    local call = {
        function_name = functionName,
        args = args,
        startTime = os.clock(),
        depth = #self.callStack + 1,
        parent = #self.callStack > 0 and self.callStack[#self.callStack] or nil
    }
    
    table.insert(self.callStack, call)
    
    return call
end

function ExecutionTracer:popCall()
    if not self.enabled or #self.callStack == 0 then
        return nil
    end
    
    local call = table.remove(self.callStack)
    call.endTime = os.clock()
    call.duration = call.endTime - call.startTime
    
    return call
end

function ExecutionTracer:getCurrentCallStack()
    return self:deepCopy(self.callStack)
end

-- Breakpoint Management
function ExecutionTracer:setBreakpoint(condition, options)
    options = options or {}
    
    local breakpoint = {
        id = "bp_" .. os.time() .. "_" .. math.random(1000),
        condition = condition, -- function(context) -> boolean
        action = options.action or "pause", -- pause, log, callback
        callback = options.callback,
        hitCount = 0,
        maxHits = options.maxHits,
        enabled = true,
        created = os.time(),
        description = options.description or "Custom breakpoint"
    }
    
    self.breakpoints[breakpoint.id] = breakpoint
    return breakpoint.id
end

function ExecutionTracer:removeBreakpoint(breakpointId)
    self.breakpoints[breakpointId] = nil
end

function ExecutionTracer:checkBreakpoints(context)
    local triggered = {}
    
    for id, breakpoint in pairs(self.breakpoints) do
        if breakpoint.enabled then
            local shouldTrigger = false
            
            if type(breakpoint.condition) == "function" then
                local success, result = pcall(breakpoint.condition, context)
                shouldTrigger = success and result
            end
            
            if shouldTrigger then
                breakpoint.hitCount = breakpoint.hitCount + 1
                
                local trigger = {
                    breakpointId = id,
                    breakpoint = breakpoint,
                    context = context,
                    timestamp = os.time()
                }
                
                table.insert(triggered, trigger)
                
                -- Execute breakpoint action
                if breakpoint.action == "log" then
                    print("🔴 Breakpoint triggered: " .. breakpoint.description)
                elseif breakpoint.action == "callback" and breakpoint.callback then
                    pcall(breakpoint.callback, trigger)
                end
                
                -- Disable if max hits reached
                if breakpoint.maxHits and breakpoint.hitCount >= breakpoint.maxHits then
                    breakpoint.enabled = false
                end
            end
        end
    end
    
    return triggered
end

-- Trace Analysis
function ExecutionTracer:analyzeTraces(options)
    options = options or {}
    
    local analysis = {
        timestamp = os.time(),
        traceCount = #self.traces,
        timeRange = {},
        performance = {
            totalHandlers = 0,
            uniqueHandlers = {},
            averageExecutionTime = 0,
            executionTimeDistribution = {},
            errorRate = 0
        },
        patterns = {
            commonSequences = {},
            errorPatterns = {},
            performanceBottlenecks = {}
        },
        recommendations = {}
    }
    
    if #self.traces == 0 then
        return analysis
    end
    
    -- Calculate time range
    local firstTrace = self.traces[1]
    local lastTrace = self.traces[#self.traces]
    analysis.timeRange = {
        start = firstTrace.timestamp,
        ["end"] = lastTrace.timestamp,
        duration = lastTrace.timestamp - firstTrace.timestamp
    }
    
    -- Analyze performance
    local totalDuration = 0
    local errorCount = 0
    
    for _, trace in ipairs(self.traces) do
        totalDuration = totalDuration + trace.execution.duration
        
        for _, handlerResult in ipairs(trace.execution.handlerResults) do
            analysis.performance.totalHandlers = analysis.performance.totalHandlers + 1
            
            local handlerName = handlerResult.handler
            analysis.performance.uniqueHandlers[handlerName] = 
                (analysis.performance.uniqueHandlers[handlerName] or 0) + 1
            
            if not handlerResult.success then
                errorCount = errorCount + 1
            end
            
            -- Execution time distribution
            local timeGroup = self:getExecutionTimeGroup(handlerResult.execution.duration)
            analysis.performance.executionTimeDistribution[timeGroup] = 
                (analysis.performance.executionTimeDistribution[timeGroup] or 0) + 1
        end
        
        errorCount = errorCount + #trace.execution.errors
    end
    
    analysis.performance.averageExecutionTime = totalDuration / #self.traces
    analysis.performance.errorRate = errorCount / analysis.performance.totalHandlers
    
    -- Find patterns
    analysis.patterns.commonSequences = self:findCommonSequences()
    analysis.patterns.errorPatterns = self:findErrorPatterns()
    analysis.patterns.performanceBottlenecks = self:findPerformanceBottlenecks()
    
    -- Generate recommendations
    analysis.recommendations = self:generateRecommendations(analysis)
    
    return analysis
end

function ExecutionTracer:findCommonSequences()
    local sequences = {}
    local sequenceCount = {}
    
    -- Look for common handler execution sequences
    for _, trace in ipairs(self.traces) do
        if #trace.execution.handlerResults > 1 then
            local handlerSequence = {}
            for _, handlerResult in ipairs(trace.execution.handlerResults) do
                table.insert(handlerSequence, handlerResult.handler)
            end
            
            local sequenceKey = table.concat(handlerSequence, " -> ")
            sequenceCount[sequenceKey] = (sequenceCount[sequenceKey] or 0) + 1
        end
    end
    
    -- Return sequences that occur more than once
    for sequence, count in pairs(sequenceCount) do
        if count > 1 then
            table.insert(sequences, {
                sequence = sequence,
                count = count,
                frequency = count / #self.traces
            })
        end
    end
    
    -- Sort by frequency
    table.sort(sequences, function(a, b) return a.count > b.count end)
    
    return sequences
end

function ExecutionTracer:findErrorPatterns()
    local errorPatterns = {}
    local errorsByHandler = {}
    local errorsByAction = {}
    
    for _, trace in ipairs(self.traces) do
        for _, error in ipairs(trace.execution.errors) do
            -- Group by handler
            local handler = "unknown"
            for _, handlerResult in ipairs(trace.execution.handlerResults) do
                if handlerResult.error == error then
                    handler = handlerResult.handler
                    break
                end
            end
            
            errorsByHandler[handler] = (errorsByHandler[handler] or 0) + 1
            
            -- Group by message action
            local action = trace.message.Action or "unknown"
            errorsByAction[action] = (errorsByAction[action] or 0) + 1
        end
    end
    
    table.insert(errorPatterns, {
        type = "by_handler",
        data = errorsByHandler
    })
    
    table.insert(errorPatterns, {
        type = "by_action",
        data = errorsByAction
    })
    
    return errorPatterns
end

function ExecutionTracer:findPerformanceBottlenecks()
    local bottlenecks = {}
    
    -- Find handlers with consistently high execution times
    local handlerTimes = {}
    
    for _, trace in ipairs(self.traces) do
        for _, handlerResult in ipairs(trace.execution.handlerResults) do
            local handler = handlerResult.handler
            if not handlerTimes[handler] then
                handlerTimes[handler] = {
                    times = {},
                    total = 0,
                    count = 0
                }
            end
            
            table.insert(handlerTimes[handler].times, handlerResult.execution.duration)
            handlerTimes[handler].total = handlerTimes[handler].total + handlerResult.execution.duration
            handlerTimes[handler].count = handlerTimes[handler].count + 1
        end
    end
    
    -- Calculate averages and identify slow handlers
    for handler, data in pairs(handlerTimes) do
        local average = data.total / data.count
        
        -- Consider it a bottleneck if average > 0.01 seconds
        if average > 0.01 then
            table.insert(bottlenecks, {
                handler = handler,
                averageTime = average,
                callCount = data.count,
                totalTime = data.total,
                severity = average > 0.05 and "high" or "medium"
            })
        end
    end
    
    -- Sort by total time impact
    table.sort(bottlenecks, function(a, b) return a.totalTime > b.totalTime end)
    
    return bottlenecks
end

function ExecutionTracer:generateRecommendations(analysis)
    local recommendations = {}
    
    -- Performance recommendations
    if analysis.performance.errorRate > 0.1 then
        table.insert(recommendations, {
            type = "error_rate",
            priority = "high",
            message = string.format("High error rate detected (%.1f%%). Review error patterns.", 
                                  analysis.performance.errorRate * 100)
        })
    end
    
    if analysis.performance.averageExecutionTime > 0.1 then
        table.insert(recommendations, {
            type = "performance",
            priority = "medium", 
            message = "Average execution time is high. Consider optimizing handler logic."
        })
    end
    
    -- Bottleneck recommendations
    for _, bottleneck in ipairs(analysis.patterns.performanceBottlenecks) do
        if bottleneck.severity == "high" then
            table.insert(recommendations, {
                type = "bottleneck",
                priority = "high",
                message = string.format("Handler '%s' is a performance bottleneck (%.3fs average)", 
                                      bottleneck.handler, bottleneck.averageTime)
            })
        end
    end
    
    return recommendations
end

-- Trace Storage and Retrieval
function ExecutionTracer:addTrace(trace)
    table.insert(self.traces, trace)
    
    -- Maintain maximum trace size
    while #self.traces > self.maxTraceSize do
        table.remove(self.traces, 1)
    end
end

function ExecutionTracer:getTraces(filter)
    if not filter then
        return self.traces
    end
    
    local filtered = {}
    
    for _, trace in ipairs(self.traces) do
        if self:traceMatchesFilter(trace, filter) then
            table.insert(filtered, trace)
        end
    end
    
    return filtered
end

function ExecutionTracer:clearTraces()
    self.traces = {}
end

-- Filtering
function ExecutionTracer:shouldIncludeTrace(trace)
    -- Check handler filters
    if self.filters.includeHandlers then
        local included = false
        for _, handlerResult in ipairs(trace.execution.handlerResults) do
            for _, includedHandler in ipairs(self.filters.includeHandlers) do
                if handlerResult.handler == includedHandler then
                    included = true
                    break
                end
            end
            if included then break end
        end
        if not included then return false end
    end
    
    if self.filters.excludeHandlers then
        for _, handlerResult in ipairs(trace.execution.handlerResults) do
            for _, excludedHandler in ipairs(self.filters.excludeHandlers) do
                if handlerResult.handler == excludedHandler then
                    return false
                end
            end
        end
    end
    
    -- Check action filters
    if self.filters.includeActions then
        local included = false
        for _, action in ipairs(self.filters.includeActions) do
            if trace.message.Action == action then
                included = true
                break
            end
        end
        if not included then return false end
    end
    
    if self.filters.excludeActions then
        for _, action in ipairs(self.filters.excludeActions) do
            if trace.message.Action == action then
                return false
            end
        end
    end
    
    -- Check execution time filter
    if trace.execution.duration < self.filters.minExecutionTime then
        return false
    end
    
    return true
end

function ExecutionTracer:traceMatchesFilter(trace, filter)
    if filter.handler and not string.find(trace.message.Action or "", filter.handler) then
        return false
    end
    
    if filter.action and trace.message.Action ~= filter.action then
        return false
    end
    
    if filter.minDuration and trace.execution.duration < filter.minDuration then
        return false
    end
    
    if filter.maxDuration and trace.execution.duration > filter.maxDuration then
        return false
    end
    
    return true
end

-- Utility Functions
function ExecutionTracer:sanitizeMessage(message)
    -- Create a clean copy of the message for tracing
    local sanitized = {}
    
    for key, value in pairs(message) do
        if type(value) == "string" and string.len(value) > 1000 then
            sanitized[key] = string.sub(value, 1, 997) .. "..."
        else
            sanitized[key] = value
        end
    end
    
    return sanitized
end

function ExecutionTracer:estimateObjectSize(obj)
    if type(obj) ~= "table" then
        return 1
    end
    
    local size = 1
    for _, value in pairs(obj) do
        size = size + self:estimateObjectSize(value)
    end
    
    return size
end

function ExecutionTracer:getExecutionTimeGroup(duration)
    if duration < 0.001 then
        return "very_fast"
    elseif duration < 0.01 then
        return "fast"
    elseif duration < 0.1 then
        return "medium"
    elseif duration < 1.0 then
        return "slow"
    else
        return "very_slow"
    end
end

function ExecutionTracer:deepCopy(orig)
    local orig_type = type(orig)
    local copy
    if orig_type == 'table' then
        copy = {}
        for orig_key, orig_value in pairs(orig) do
            copy[orig_key] = self:deepCopy(orig_value)
        end
    else
        copy = orig
    end
    return copy
end

-- Export and Reporting
function ExecutionTracer:exportTrace(format)
    format = format or "json"
    
    local export = {
        session = self.traceSession,
        traces = self.traces,
        analysis = self:analyzeTraces(),
        exported_at = os.time(),
        format = format
    }
    
    if format == "json" then
        return self:toJSON(export)
    elseif format == "summary" then
        return self:toSummary(export)
    end
    
    return export
end

function ExecutionTracer:toJSON(obj)
    -- Simplified JSON serialization
    if type(obj) == "table" then
        local parts = {}
        for k, v in pairs(obj) do
            table.insert(parts, '"' .. tostring(k) .. '":' .. self:toJSON(v))
        end
        return "{" .. table.concat(parts, ",") .. "}"
    elseif type(obj) == "string" then
        return '"' .. obj .. '"'
    elseif type(obj) == "number" then
        return tostring(obj)
    elseif type(obj) == "boolean" then
        return obj and "true" or "false"
    else
        return "null"
    end
end

function ExecutionTracer:toSummary(export)
    local lines = {
        "Execution Trace Summary",
        "======================",
        "Session: " .. (export.session and export.session.id or "unknown"),
        "Traces: " .. #export.traces,
        "Analysis: " .. (export.analysis and "available" or "unavailable"),
        "Exported: " .. os.date("%Y-%m-%d %H:%M:%S", export.exported_at),
        ""
    }
    
    if export.analysis then
        table.insert(lines, "Performance:")
        table.insert(lines, "  Total Handlers: " .. export.analysis.performance.totalHandlers)
        table.insert(lines, "  Average Execution: " .. string.format("%.3fs", export.analysis.performance.averageExecutionTime))
        table.insert(lines, "  Error Rate: " .. string.format("%.1f%%", export.analysis.performance.errorRate * 100))
        table.insert(lines, "")
        
        if #export.analysis.recommendations > 0 then
            table.insert(lines, "Recommendations:")
            for _, rec in ipairs(export.analysis.recommendations) do
                table.insert(lines, "  - " .. rec.message)
            end
        end
    end
    
    return table.concat(lines, "\n")
end

return ExecutionTracer