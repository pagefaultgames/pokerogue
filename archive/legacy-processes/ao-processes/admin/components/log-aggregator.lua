-- Log Aggregator Component
-- Provides centralized logging collection, correlation, and analysis across distributed processes

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")

local LogAggregator = {
    -- Centralized log storage
    logEntries = {},
    
    -- Log streaming subscriptions
    streamSubscriptions = {},
    
    -- Log correlation tracking
    correlationMap = {},
    
    -- Aggregation configuration
    config = {
        maxLogEntries = 10000,
        logRetentionHours = 48,
        correlationTimeWindow = 3600, -- 1 hour
        streamBufferSize = 100,
        autoArchiveEnabled = true,
        compressionEnabled = true
    },
    
    -- Log levels
    LOG_LEVELS = {
        TRACE = 0,
        DEBUG = 1,
        INFO = 2,
        WARN = 3,
        ERROR = 4,
        FATAL = 5
    },
    
    -- Aggregation statistics
    statistics = {
        totalLogsCollected = 0,
        logsByLevel = {
            TRACE = 0,
            DEBUG = 0,
            INFO = 0,
            WARN = 0,
            ERROR = 0,
            FATAL = 0
        },
        correlatedLogs = 0,
        streamingSubscribers = 0,
        lastLogTime = 0,
        archivedLogCount = 0
    }
}

-- Initialize log aggregation system
function LogAggregator.initialize()
    LogAggregator.logEntries = {}
    LogAggregator.streamSubscriptions = {}
    LogAggregator.correlationMap = {}
    LogAggregator.statistics = {
        totalLogsCollected = 0,
        logsByLevel = {
            TRACE = 0,
            DEBUG = 0,
            INFO = 0,
            WARN = 0,
            ERROR = 0,
            FATAL = 0
        },
        correlatedLogs = 0,
        streamingSubscribers = 0,
        lastLogTime = 0,
        archivedLogCount = 0
    }
    print("[LogAggregator] Log aggregation system initialized")
end

-- Log an event to the aggregated log system
function LogAggregator.logEvent(logEvent)
    if not logEvent or not logEvent.message then
        return { success = false, error = "Log message is required" }
    end
    
    local timestamp = 0
    local logEntry = {
        id = MessageCorrelator.generateId(),
        timestamp = timestamp,
        level = logEvent.level or "INFO",
        component = logEvent.component or "UNKNOWN",
        processId = logEvent.processId or "admin-process",
        message = logEvent.message,
        correlationId = logEvent.correlationId,
        adminUserId = logEvent.adminUserId,
        metadata = logEvent.metadata or {},
        context = logEvent.context or {}
    }
    
    -- Add to log storage
    table.insert(LogAggregator.logEntries, logEntry)
    
    -- Update statistics
    LogAggregator.statistics.totalLogsCollected = LogAggregator.statistics.totalLogsCollected + 1
    LogAggregator.statistics.logsByLevel[logEntry.level] = 
        (LogAggregator.statistics.logsByLevel[logEntry.level] or 0) + 1
    LogAggregator.statistics.lastLogTime = timestamp
    
    -- Handle correlation tracking
    if logEvent.correlationId then
        LogAggregator._trackLogCorrelation(logEntry)
    end
    
    -- Stream to subscribers
    LogAggregator._streamLogToSubscribers(logEntry)
    
    -- Manage log storage size
    LogAggregator._manageLogSize()
    
    return { success = true, logId = logEntry.id }
end

-- Get recent logs with optional filtering
function LogAggregator.getRecentLogs(limit, filters)
    local maxLimit = limit or 100
    local recentLogs = {}
    local count = 0
    
    -- Iterate through logs in reverse order (most recent first)
    for i = #LogAggregator.logEntries, 1, -1 do
        if count >= maxLimit then break end
        
        local logEntry = LogAggregator.logEntries[i]
        
        -- Apply filters
        if LogAggregator._matchesFilters(logEntry, filters) then
            table.insert(recentLogs, logEntry)
            count = count + 1
        end
    end
    
    return recentLogs
end

-- Get correlated logs based on correlation ID
function LogAggregator.getCorrelatedLogs(correlationId, options)
    local correlatedLogs = {}
    local includeChildren = options and options.includeChildren or false
    local timeRange = options and options.timeRange
    
    -- Direct correlation lookup
    local directLogs = LogAggregator.correlationMap[correlationId] or {}
    
    for _, logEntry in ipairs(directLogs) do
        if LogAggregator._inTimeRange(logEntry.timestamp, timeRange) then
            table.insert(correlatedLogs, logEntry)
        end
    end
    
    -- Include child correlations if requested
    if includeChildren then
        local childCorrelations = LogAggregator._findChildCorrelations(correlationId)
        for _, childId in ipairs(childCorrelations) do
            local childLogs = LogAggregator.correlationMap[childId] or {}
            for _, logEntry in ipairs(childLogs) do
                if LogAggregator._inTimeRange(logEntry.timestamp, timeRange) then
                    table.insert(correlatedLogs, logEntry)
                end
            end
        end
    end
    
    -- Sort by timestamp
    table.sort(correlatedLogs, function(a, b) return a.timestamp < b.timestamp end)
    
    return correlatedLogs
end

-- Get error logs with optional filtering
function LogAggregator.getErrorLogs(limit, filters)
    local errorFilters = filters or {}
    errorFilters.logLevel = "ERROR,FATAL"
    
    return LogAggregator.getRecentLogs(limit, errorFilters)
end

-- Search logs by message content
function LogAggregator.searchLogs(searchQuery, options)
    local matchingLogs = {}
    local caseSensitive = options and options.caseSensitive or false
    local timeRange = options and options.timeRange
    local limit = options and options.limit or 100
    local count = 0
    
    local searchTerm = caseSensitive and searchQuery or string.lower(searchQuery)
    
    for i = #LogAggregator.logEntries, 1, -1 do
        if count >= limit then break end
        
        local logEntry = LogAggregator.logEntries[i]
        local messageToSearch = caseSensitive and logEntry.message or string.lower(logEntry.message)
        
        if string.find(messageToSearch, searchTerm, 1, true) and 
           LogAggregator._inTimeRange(logEntry.timestamp, timeRange) then
            table.insert(matchingLogs, logEntry)
            count = count + 1
        end
    end
    
    return matchingLogs
end

-- Subscribe to log streaming
function LogAggregator.subscribeToLogStream(streamConfig)
    if not streamConfig or not streamConfig.subscriberId then
        return { success = false, error = "Subscriber ID is required" }
    end
    
    local subscriptionId = MessageCorrelator.generateId()
    local subscription = {
        subscriptionId = subscriptionId,
        subscriberId = streamConfig.subscriberId,
        logLevel = streamConfig.logLevel,
        component = streamConfig.component,
        processId = streamConfig.processId,
        includeCorrelation = streamConfig.includeCorrelation or false,
        bufferSize = streamConfig.bufferSize or LogAggregator.config.streamBufferSize,
        buffer = {},
        subscribedAt = 0
    }
    
    LogAggregator.streamSubscriptions[streamConfig.subscriberId] = subscription
    LogAggregator.statistics.streamingSubscribers = 
        LogAggregator._getTableSize(LogAggregator.streamSubscriptions)
    
    print("[LogAggregator] Log stream subscription created for " .. streamConfig.subscriberId)
    return { success = true, subscriptionId = subscriptionId }
end

-- Unsubscribe from log streaming
function LogAggregator.unsubscribeFromLogStream(subscriberId)
    if LogAggregator.streamSubscriptions[subscriberId] then
        LogAggregator.streamSubscriptions[subscriberId] = nil
        LogAggregator.statistics.streamingSubscribers = 
            LogAggregator._getTableSize(LogAggregator.streamSubscriptions)
        
        print("[LogAggregator] Log stream subscription removed for " .. subscriberId)
        return { success = true }
    else
        return { success = false, error = "Subscription not found" }
    end
end

-- Get stream status for subscriber
function LogAggregator.getStreamStatus(subscriberId)
    local subscription = LogAggregator.streamSubscriptions[subscriberId]
    if not subscription then
        return { subscribed = false }
    end
    
    return {
        subscribed = true,
        subscriptionId = subscription.subscriptionId,
        subscribedAt = subscription.subscribedAt,
        bufferSize = #subscription.buffer,
        maxBufferSize = subscription.bufferSize,
        logLevel = subscription.logLevel,
        component = subscription.component
    }
end

-- Perform trend analysis on logs
function LogAggregator.performTrendAnalysis(analysisOptions)
    local timeRange = analysisOptions and analysisOptions.timeRange
    local processId = analysisOptions and analysisOptions.processId
    local metricTypes = analysisOptions and analysisOptions.metricTypes or {"ERROR_RATE", "LOG_VOLUME"}
    
    local analysis = {
        timestamp = msg.Timestamp,
        timeRange = timeRange,
        processId = processId,
        metrics = {}
    }
    
    for _, metricType in ipairs(metricTypes) do
        if metricType == "ERROR_RATE" then
            analysis.metrics.errorRate = LogAggregator._analyzeErrorRate(timeRange, processId)
        elseif metricType == "LOG_VOLUME" then
            analysis.metrics.logVolume = LogAggregator._analyzeLogVolume(timeRange, processId)
        elseif metricType == "COMPONENT_ACTIVITY" then
            analysis.metrics.componentActivity = LogAggregator._analyzeComponentActivity(timeRange, processId)
        end
    end
    
    return analysis
end

-- Perform error analysis
function LogAggregator.performErrorAnalysis(analysisOptions)
    local timeRange = analysisOptions and analysisOptions.timeRange
    local processId = analysisOptions and analysisOptions.processId
    local groupByError = analysisOptions and analysisOptions.groupByError or false
    
    local errorLogs = LogAggregator.getErrorLogs(1000, {
        timeRange = timeRange,
        processId = processId
    })
    
    local analysis = {
        timestamp = msg.Timestamp,
        timeRange = timeRange,
        processId = processId,
        totalErrors = #errorLogs,
        errorsByComponent = {},
        errorsByType = {},
        errorTimeline = {}
    }
    
    -- Analyze error distribution
    for _, logEntry in ipairs(errorLogs) do
        -- Count by component
        local component = logEntry.component or "UNKNOWN"
        analysis.errorsByComponent[component] = (analysis.errorsByComponent[component] or 0) + 1
        
        -- Group by error type if requested
        if groupByError then
            local errorType = LogAggregator._extractErrorType(logEntry.message)
            analysis.errorsByType[errorType] = (analysis.errorsByType[errorType] or 0) + 1
        end
        
        -- Build error timeline
        local timeWindow = math.floor(logEntry.timestamp / 300) * 300 -- 5-minute windows
        analysis.errorTimeline[timeWindow] = (analysis.errorTimeline[timeWindow] or 0) + 1
    end
    
    return analysis
end

-- Perform performance analysis based on logs
function LogAggregator.performPerformanceAnalysis(analysisOptions)
    local timeRange = analysisOptions and analysisOptions.timeRange
    local processId = analysisOptions and analysisOptions.processId
    
    local performanceLogs = LogAggregator.getRecentLogs(5000, {
        timeRange = timeRange,
        processId = processId,
        component = "PERFORMANCE"
    })
    
    local analysis = {
        timestamp = msg.Timestamp,
        timeRange = timeRange,
        processId = processId,
        performanceMetrics = {
            averageResponseTime = 0,
            maxResponseTime = 0,
            minResponseTime = 999999,
            totalOperations = 0
        },
        slowOperations = {},
        performanceTrends = {}
    }
    
    -- Analyze performance metrics from logs
    local responseTimes = {}
    
    for _, logEntry in ipairs(performanceLogs) do
        -- Extract performance data from log metadata
        if logEntry.metadata and logEntry.metadata.responseTime then
            local responseTime = logEntry.metadata.responseTime
            table.insert(responseTimes, responseTime)
            
            if responseTime > analysis.performanceMetrics.maxResponseTime then
                analysis.performanceMetrics.maxResponseTime = responseTime
            end
            if responseTime < analysis.performanceMetrics.minResponseTime then
                analysis.performanceMetrics.minResponseTime = responseTime
            end
            
            -- Track slow operations
            if responseTime > 1000 then -- > 1 second
                table.insert(analysis.slowOperations, {
                    timestamp = logEntry.timestamp,
                    operation = logEntry.metadata.operation,
                    responseTime = responseTime,
                    processId = logEntry.processId
                })
            end
        end
    end
    
    -- Calculate average
    if #responseTimes > 0 then
        local sum = 0
        for _, time in ipairs(responseTimes) do
            sum = sum + time
        end
        analysis.performanceMetrics.averageResponseTime = sum / #responseTimes
        analysis.performanceMetrics.totalOperations = #responseTimes
    end
    
    return analysis
end

-- Perform correlation analysis
function LogAggregator.performCorrelationAnalysis(analysisOptions)
    local correlationId = analysisOptions.correlationId
    local timeRange = analysisOptions and analysisOptions.timeRange
    
    if not correlationId then
        return { success = false, error = "Correlation ID is required" }
    end
    
    local correlatedLogs = LogAggregator.getCorrelatedLogs(correlationId, {
        timeRange = timeRange,
        includeChildren = true
    })
    
    local analysis = {
        timestamp = msg.Timestamp,
        correlationId = correlationId,
        timeRange = timeRange,
        totalCorrelatedLogs = #correlatedLogs,
        logsByLevel = {},
        logsByComponent = {},
        timeline = {},
        correlationFlow = {}
    }
    
    -- Analyze correlated logs
    for _, logEntry in ipairs(correlatedLogs) do
        -- Count by level
        local level = logEntry.level
        analysis.logsByLevel[level] = (analysis.logsByLevel[level] or 0) + 1
        
        -- Count by component
        local component = logEntry.component
        analysis.logsByComponent[component] = (analysis.logsByComponent[component] or 0) + 1
        
        -- Build timeline
        local timeWindow = math.floor(logEntry.timestamp / 60) * 60 -- 1-minute windows
        if not analysis.timeline[timeWindow] then
            analysis.timeline[timeWindow] = 0
        end
        analysis.timeline[timeWindow] = analysis.timeline[timeWindow] + 1
        
        -- Build correlation flow
        table.insert(analysis.correlationFlow, {
            timestamp = logEntry.timestamp,
            component = logEntry.component,
            processId = logEntry.processId,
            level = logEntry.level,
            message = logEntry.message
        })
    end
    
    return analysis
end

-- Update log retention policy
function LogAggregator.updateRetentionPolicy(retentionPolicy)
    if not retentionPolicy or type(retentionPolicy) ~= "table" then
        return { success = false, error = "Invalid retention policy" }
    end
    
    if retentionPolicy.maxLogEntries then
        LogAggregator.config.maxLogEntries = retentionPolicy.maxLogEntries
    end
    
    if retentionPolicy.logRetentionHours then
        LogAggregator.config.logRetentionHours = retentionPolicy.logRetentionHours
    end
    
    if retentionPolicy.autoArchiveEnabled ~= nil then
        LogAggregator.config.autoArchiveEnabled = retentionPolicy.autoArchiveEnabled
    end
    
    print("[LogAggregator] Log retention policy updated")
    return { success = true, policy = LogAggregator.config }
end

-- Update aggregation settings
function LogAggregator.updateAggregationSettings(aggregationSettings)
    if not aggregationSettings or type(aggregationSettings) ~= "table" then
        return { success = false, error = "Invalid aggregation settings" }
    end
    
    for key, value in pairs(aggregationSettings) do
        if LogAggregator.config[key] then
            LogAggregator.config[key] = value
        end
    end
    
    print("[LogAggregator] Aggregation settings updated")
    return { success = true, settings = LogAggregator.config }
end

-- Update correlation settings
function LogAggregator.updateCorrelationSettings(correlationSettings)
    if not correlationSettings or type(correlationSettings) ~= "table" then
        return { success = false, error = "Invalid correlation settings" }
    end
    
    if correlationSettings.correlationTimeWindow then
        LogAggregator.config.correlationTimeWindow = correlationSettings.correlationTimeWindow
    end
    
    print("[LogAggregator] Correlation settings updated")
    return { success = true, settings = LogAggregator.config }
end

-- Update log alert rules
function LogAggregator.updateLogAlertRules(alertRules)
    if not alertRules or type(alertRules) ~= "table" then
        return { success = false, error = "Invalid alert rules" }
    end
    
    LogAggregator.config.alertRules = alertRules
    
    print("[LogAggregator] Log alert rules updated")
    return { success = true, rules = alertRules }
end

-- Export logs to various formats
function LogAggregator.exportLogs(exportOptions)
    local format = exportOptions.format or "JSON"
    local timeRange = exportOptions.timeRange
    local filters = exportOptions.filters or {}
    local compression = exportOptions.compression or false
    
    local logsToExport = LogAggregator.getRecentLogs(LogAggregator.config.maxLogEntries, filters)
    
    -- Filter by time range
    if timeRange then
        local filteredLogs = {}
        for _, logEntry in ipairs(logsToExport) do
            if LogAggregator._inTimeRange(logEntry.timestamp, timeRange) then
                table.insert(filteredLogs, logEntry)
            end
        end
        logsToExport = filteredLogs
    end
    
    local exportResult = {
        success = true,
        format = format,
        recordCount = #logsToExport,
        exportTimestamp = 0,
        compressionEnabled = compression
    }
    
    -- Format conversion would happen here
    if format == "JSON" then
        exportResult.data = json.encode(logsToExport)
    elseif format == "CSV" then
        exportResult.data = LogAggregator._convertToCSV(logsToExport)
    else
        return { success = false, error = "Unsupported export format: " .. format }
    end
    
    -- Compression would happen here if enabled
    if compression then
        -- Placeholder for compression logic
        exportResult.compressed = true
    end
    
    print("[LogAggregator] Log export completed - " .. #logsToExport .. " logs in " .. format .. " format")
    return exportResult
end

-- Get aggregation summary
function LogAggregator.getAggregationSummary()
    return {
        totalLogs = #LogAggregator.logEntries,
        logsByLevel = LogAggregator.statistics.logsByLevel,
        correlatedLogs = LogAggregator.statistics.correlatedLogs,
        streamingSubscribers = LogAggregator.statistics.streamingSubscribers,
        lastLogTime = LogAggregator.statistics.lastLogTime,
        configuration = LogAggregator.config
    }
end

-- Get log aggregation statistics
function LogAggregator.getStatistics()
    return LogAggregator.statistics
end

-- Private helper functions

function LogAggregator._trackLogCorrelation(logEntry)
    local correlationId = logEntry.correlationId
    
    if not LogAggregator.correlationMap[correlationId] then
        LogAggregator.correlationMap[correlationId] = {}
    end
    
    table.insert(LogAggregator.correlationMap[correlationId], logEntry)
    LogAggregator.statistics.correlatedLogs = LogAggregator.statistics.correlatedLogs + 1
end

function LogAggregator._streamLogToSubscribers(logEntry)
    for subscriberId, subscription in pairs(LogAggregator.streamSubscriptions) do
        if LogAggregator._matchesSubscription(logEntry, subscription) then
            table.insert(subscription.buffer, logEntry)
            
            -- Manage buffer size
            if #subscription.buffer > subscription.bufferSize then
                table.remove(subscription.buffer, 1)
            end
        end
    end
end

function LogAggregator._manageLogSize()
    -- Remove old logs if exceeding max entries
    if #LogAggregator.logEntries > LogAggregator.config.maxLogEntries then
        table.remove(LogAggregator.logEntries, 1)
    end
    
    -- Remove logs older than retention period
    local currentTime = 0
    local retentionThreshold = currentTime - (LogAggregator.config.logRetentionHours * 3600)
    
    local i = 1
    while i <= #LogAggregator.logEntries do
        if LogAggregator.logEntries[i].timestamp < retentionThreshold then
            table.remove(LogAggregator.logEntries, i)
            LogAggregator.statistics.archivedLogCount = LogAggregator.statistics.archivedLogCount + 1
        else
            break -- Logs are ordered by timestamp, so we can break here
        end
    end
end

function LogAggregator._matchesFilters(logEntry, filters)
    if not filters then return true end
    
    -- Time range filter
    if filters.timeRange and not LogAggregator._inTimeRange(logEntry.timestamp, filters.timeRange) then
        return false
    end
    
    -- Log level filter
    if filters.logLevel then
        local levels = {}
        for level in string.gmatch(filters.logLevel, "([^,]+)") do
            levels[level] = true
        end
        if not levels[logEntry.level] then
            return false
        end
    end
    
    -- Component filter
    if filters.component and logEntry.component ~= filters.component then
        return false
    end
    
    -- Process ID filter
    if filters.processId and logEntry.processId ~= filters.processId then
        return false
    end
    
    return true
end

function LogAggregator._matchesSubscription(logEntry, subscription)
    if subscription.logLevel then
        local levels = {}
        for level in string.gmatch(subscription.logLevel, "([^,]+)") do
            levels[level] = true
        end
        if not levels[logEntry.level] then
            return false
        end
    end
    
    if subscription.component and logEntry.component ~= subscription.component then
        return false
    end
    
    if subscription.processId and logEntry.processId ~= subscription.processId then
        return false
    end
    
    return true
end

function LogAggregator._inTimeRange(timestamp, timeRange)
    if not timeRange then return true end
    
    local startTime = timeRange.start or 0
    local endTime = timeRange.finish or 0
    
    return timestamp >= startTime and timestamp <= endTime
end

function LogAggregator._findChildCorrelations(parentCorrelationId)
    -- Simplified child correlation detection
    local childIds = {}
    
    for correlationId, logs in pairs(LogAggregator.correlationMap) do
        if string.find(correlationId, parentCorrelationId, 1, true) and 
           correlationId ~= parentCorrelationId then
            table.insert(childIds, correlationId)
        end
    end
    
    return childIds
end

function LogAggregator._analyzeErrorRate(timeRange, processId)
    local errorLogs = LogAggregator.getErrorLogs(1000, {
        timeRange = timeRange,
        processId = processId
    })
    
    local allLogs = LogAggregator.getRecentLogs(10000, {
        timeRange = timeRange,
        processId = processId
    })
    
    local errorRate = #allLogs > 0 and (#errorLogs / #allLogs) * 100 or 0
    
    return {
        errorRate = errorRate,
        totalErrors = #errorLogs,
        totalLogs = #allLogs,
        trend = "STABLE" -- Simplified trend analysis
    }
end

function LogAggregator._analyzeLogVolume(timeRange, processId)
    local logs = LogAggregator.getRecentLogs(10000, {
        timeRange = timeRange,
        processId = processId
    })
    
    return {
        totalVolume = #logs,
        averagePerHour = #logs / ((timeRange and (timeRange.finish - timeRange.start) / 3600) or 1),
        trend = "STABLE" -- Simplified trend analysis
    }
end

function LogAggregator._analyzeComponentActivity(timeRange, processId)
    local logs = LogAggregator.getRecentLogs(10000, {
        timeRange = timeRange,
        processId = processId
    })
    
    local componentActivity = {}
    
    for _, logEntry in ipairs(logs) do
        local component = logEntry.component or "UNKNOWN"
        componentActivity[component] = (componentActivity[component] or 0) + 1
    end
    
    return componentActivity
end

function LogAggregator._extractErrorType(errorMessage)
    -- Simple error type extraction
    if string.find(string.lower(errorMessage), "timeout") then
        return "TIMEOUT"
    elseif string.find(string.lower(errorMessage), "connection") then
        return "CONNECTION"
    elseif string.find(string.lower(errorMessage), "authentication") then
        return "AUTHENTICATION"
    else
        return "GENERAL"
    end
end

function LogAggregator._convertToCSV(logs)
    local csv = "timestamp,level,component,processId,message\n"
    
    for _, log in ipairs(logs) do
        csv = csv .. string.format("%s,%s,%s,%s,\"%s\"\n",
            log.timestamp,
            log.level,
            log.component,
            log.processId,
            string.gsub(log.message, "\"", "\"\"") -- Escape quotes
        )
    end
    
    return csv
end

function LogAggregator._getTableSize(tbl)
    local count = 0
    for _ in pairs(tbl) do
        count = count + 1
    end
    return count
end

return LogAggregator