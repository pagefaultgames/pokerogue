-- Admin Logging Handler
-- Handles log aggregation, correlation, and analysis across distributed processes

local MessageCorrelator = require("game-logic.process-coordination.message-correlator")
local ProcessAuthenticator = require("game-logic.process-coordination.process-authenticator")
local LogAggregator = require("admin.components.log-aggregator")
local AlertManager = require("admin.components.alert-manager")

-- Log aggregation query handler
Handlers.add(
    "log-aggregation",
    Handlers.utils.hasMatchingTag("Action", "LOG_AGGREGATION"),
    function(msg)
        -- Authenticate log aggregation request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-aggregation"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for log aggregation",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local queryData = json.decode(msg.Data)
        local queryType = queryData and queryData.queryType or "RECENT_LOGS"
        local timeRange = queryData and queryData.timeRange
        local logLevel = queryData and queryData.logLevel
        local component = queryData and queryData.component
        local processId = queryData and queryData.processId
        local correlationId = queryData and queryData.correlationId
        local limit = queryData and queryData.limit or 100
        
        local logResults = {}
        
        if queryType == "RECENT_LOGS" then
            logResults = LogAggregator.getRecentLogs(limit, {
                timeRange = timeRange,
                logLevel = logLevel,
                component = component,
                processId = processId
            })
        elseif queryType == "CORRELATED_LOGS" then
            if not correlationId then
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "ERROR_RESPONSE",
                        CorrelationId = msg.Tags.CorrelationId or "log-aggregation"
                    },
                    Data = json.encode({
                        success = false,
                        error = "Correlation ID is required for correlated logs query"
                    })
                })
                return
            end
            logResults = LogAggregator.getCorrelatedLogs(correlationId, {
                timeRange = timeRange,
                includeChildren = queryData.includeChildren
            })
        elseif queryType == "ERROR_LOGS" then
            logResults = LogAggregator.getErrorLogs(limit, {
                timeRange = timeRange,
                component = component,
                processId = processId
            })
        elseif queryType == "SEARCH_LOGS" then
            local searchQuery = queryData.searchQuery
            if not searchQuery then
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "ERROR_RESPONSE",
                        CorrelationId = msg.Tags.CorrelationId or "log-aggregation"
                    },
                    Data = json.encode({
                        success = false,
                        error = "Search query is required for log search"
                    })
                })
                return
            end
            logResults = LogAggregator.searchLogs(searchQuery, {
                timeRange = timeRange,
                limit = limit,
                caseSensitive = queryData.caseSensitive
            })
        else
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-aggregation"
                },
                Data = json.encode({
                    success = false,
                    error = "Unsupported query type: " .. queryType
                })
            })
            return
        end
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "LOG_AGGREGATION_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "log-aggregation"
            },
            Data = json.encode({
                success = true,
                queryType = queryType,
                logResults = logResults,
                totalResults = #logResults,
                aggregationSummary = LogAggregator.getAggregationSummary(),
                timestamp = 0
            })
        })
        
        print("[AdminLoggingHandler] Log aggregation query processed: " .. queryType)
    end
)

-- Log streaming handler
Handlers.add(
    "log-streaming",
    Handlers.utils.hasMatchingTag("Action", "LOG_STREAMING"),
    function(msg)
        -- Authenticate log streaming request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-streaming"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for log streaming",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local streamData = json.decode(msg.Data)
        local operation = streamData and streamData.operation or "SUBSCRIBE"
        
        if operation == "SUBSCRIBE" then
            local streamConfig = {
                subscriberId = msg.From,
                logLevel = streamData.logLevel,
                component = streamData.component,
                processId = streamData.processId,
                includeCorrelation = streamData.includeCorrelation,
                bufferSize = streamData.bufferSize or 50
            }
            
            local subscriptionResult = LogAggregator.subscribeToLogStream(streamConfig)
            
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "LOG_STREAMING_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-streaming"
                },
                Data = json.encode({
                    success = subscriptionResult.success,
                    operation = "SUBSCRIBE",
                    subscriptionId = subscriptionResult.subscriptionId,
                    streamConfig = streamConfig,
                    timestamp = 0
                })
            })
            
        elseif operation == "UNSUBSCRIBE" then
            local unsubscribeResult = LogAggregator.unsubscribeFromLogStream(msg.From)
            
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "LOG_STREAMING_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-streaming"
                },
                Data = json.encode({
                    success = unsubscribeResult.success,
                    operation = "UNSUBSCRIBE",
                    timestamp = 0
                })
            })
            
        elseif operation == "STATUS" then
            local streamStatus = LogAggregator.getStreamStatus(msg.From)
            
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "LOG_STREAMING_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-streaming"
                },
                Data = json.encode({
                    success = true,
                    operation = "STATUS",
                    streamStatus = streamStatus,
                    timestamp = 0
                })
            })
        else
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-streaming"
                },
                Data = json.encode({
                    success = false,
                    error = "Unsupported streaming operation: " .. operation
                })
            })
        end
        
        print("[AdminLoggingHandler] Log streaming operation processed: " .. operation)
    end
)

-- Log analysis handler
Handlers.add(
    "log-analysis",
    Handlers.utils.hasMatchingTag("Action", "LOG_ANALYSIS"),
    function(msg)
        -- Authenticate log analysis request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-analysis"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for log analysis",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local analysisData = json.decode(msg.Data)
        local analysisType = analysisData and analysisData.analysisType or "TREND_ANALYSIS"
        local timeRange = analysisData and analysisData.timeRange
        local processId = analysisData and analysisData.processId
        
        local analysisResults = {}
        
        if analysisType == "TREND_ANALYSIS" then
            analysisResults = LogAggregator.performTrendAnalysis({
                timeRange = timeRange,
                processId = processId,
                metricTypes = analysisData.metricTypes
            })
        elseif analysisType == "ERROR_ANALYSIS" then
            analysisResults = LogAggregator.performErrorAnalysis({
                timeRange = timeRange,
                processId = processId,
                groupByError = analysisData.groupByError,
                includeStackTraces = analysisData.includeStackTraces
            })
        elseif analysisType == "PERFORMANCE_ANALYSIS" then
            analysisResults = LogAggregator.performPerformanceAnalysis({
                timeRange = timeRange,
                processId = processId,
                analysisMetrics = analysisData.analysisMetrics
            })
        elseif analysisType == "CORRELATION_ANALYSIS" then
            local correlationId = analysisData.correlationId
            if not correlationId then
                ao.send({
                    Target = msg.From,
                    Tags = {
                        Action = "ERROR_RESPONSE",
                        CorrelationId = msg.Tags.CorrelationId or "log-analysis"
                    },
                    Data = json.encode({
                        success = false,
                        error = "Correlation ID is required for correlation analysis"
                    })
                })
                return
            end
            analysisResults = LogAggregator.performCorrelationAnalysis({
                correlationId = correlationId,
                timeRange = timeRange,
                includeMetrics = analysisData.includeMetrics
            })
        else
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-analysis"
                },
                Data = json.encode({
                    success = false,
                    error = "Unsupported analysis type: " .. analysisType
                })
            })
            return
        end
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "LOG_ANALYSIS_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "log-analysis"
            },
            Data = json.encode({
                success = true,
                analysisType = analysisType,
                analysisResults = analysisResults,
                analysisMetadata = {
                    timeRange = timeRange,
                    processId = processId,
                    generatedAt = 0
                },
                timestamp = 0
            })
        })
        
        print("[AdminLoggingHandler] Log analysis completed: " .. analysisType)
    end
)

-- Log configuration handler
Handlers.add(
    "log-configuration",
    Handlers.utils.hasMatchingTag("Action", "LOG_CONFIGURATION"),
    function(msg)
        -- Authenticate log configuration request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-configuration"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for log configuration",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local configData = json.decode(msg.Data)
        if not configData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-configuration"
                },
                Data = json.encode({
                    success = false,
                    error = "Configuration data is required"
                })
            })
            return
        end
        
        local configResult = {}
        
        if configData.retentionPolicy then
            configResult.retentionUpdate = LogAggregator.updateRetentionPolicy(configData.retentionPolicy)
        end
        
        if configData.aggregationSettings then
            configResult.aggregationUpdate = LogAggregator.updateAggregationSettings(configData.aggregationSettings)
        end
        
        if configData.correlationSettings then
            configResult.correlationUpdate = LogAggregator.updateCorrelationSettings(configData.correlationSettings)
        end
        
        if configData.alertRules then
            configResult.alertRulesUpdate = LogAggregator.updateLogAlertRules(configData.alertRules)
        end
        
        -- Log the configuration change
        LogAggregator.logEvent({
            level = "INFO",
            component = "LogConfiguration",
            message = "Log aggregation configuration updated",
            adminUserId = authResult.userId,
            configChanges = configData
        })
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "LOG_CONFIGURATION_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "log-configuration"
            },
            Data = json.encode({
                success = true,
                configurationResults = configResult,
                timestamp = 0
            })
        })
        
        print("[AdminLoggingHandler] Log configuration updated by " .. (authResult.userId or "unknown"))
    end
)

-- Log export handler
Handlers.add(
    "log-export",
    Handlers.utils.hasMatchingTag("Action", "LOG_EXPORT"),
    function(msg)
        -- Authenticate log export request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ADMIN")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-export"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for log export",
                    requiredLevel = "ADMIN"
                })
            })
            return
        end
        
        local exportData = json.decode(msg.Data)
        if not exportData then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-export"
                },
                Data = json.encode({
                    success = false,
                    error = "Export parameters are required"
                })
            })
            return
        end
        
        local exportFormat = exportData.format or "JSON"
        local timeRange = exportData.timeRange
        local filters = exportData.filters or {}
        local compressionEnabled = exportData.compression ~= false
        
        -- Execute log export
        local exportResult = LogAggregator.exportLogs({
            format = exportFormat,
            timeRange = timeRange,
            filters = filters,
            compression = compressionEnabled,
            includeMetadata = exportData.includeMetadata,
            adminUserId = authResult.userId
        })
        
        -- Generate alert for log export
        AlertManager.generateAlert({
            type = "LOG_EXPORT",
            severity = "INFO",
            message = "Log export " .. (exportResult.success and "completed" or "failed"),
            details = {
                format = exportFormat,
                timeRange = timeRange,
                recordCount = exportResult.recordCount,
                adminUserId = authResult.userId
            }
        })
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "LOG_EXPORT_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "log-export"
            },
            Data = json.encode({
                success = exportResult.success,
                exportFormat = exportFormat,
                exportResults = exportResult,
                timestamp = msg.Timestamp,
                error = exportResult.error
            })
        })
        
        print("[AdminLoggingHandler] Log export " .. (exportResult.success and "completed" or "failed") .. 
              " - Format: " .. exportFormat)
    end
)

-- Log statistics handler
Handlers.add(
    "log-statistics",
    Handlers.utils.hasMatchingTag("Action", "LOG_STATISTICS"),
    function(msg)
        -- Authenticate log statistics request
        local authResult = ProcessAuthenticator.validateMessage(msg, "ELEVATED")
        if not authResult.valid then
            ao.send({
                Target = msg.From,
                Tags = {
                    Action = "ERROR_RESPONSE",
                    CorrelationId = msg.Tags.CorrelationId or "log-statistics"
                },
                Data = json.encode({
                    success = false,
                    error = "Insufficient privileges for log statistics",
                    requiredLevel = "ELEVATED"
                })
            })
            return
        end
        
        local statistics = {
            aggregationStatistics = LogAggregator.getAggregationStatistics(),
            volumeStatistics = LogAggregator.getVolumeStatistics(),
            errorStatistics = LogAggregator.getErrorStatistics(),
            correlationStatistics = LogAggregator.getCorrelationStatistics(),
            streamingStatistics = LogAggregator.getStreamingStatistics(),
            retentionStatistics = LogAggregator.getRetentionStatistics()
        }
        
        ao.send({
            Target = msg.From,
            Tags = {
                Action = "LOG_STATISTICS_RESPONSE",
                CorrelationId = msg.Tags.CorrelationId or "log-statistics"
            },
            Data = json.encode({
                success = true,
                statistics = statistics,
                timestamp = 0
            })
        })
        
        print("[AdminLoggingHandler] Log statistics provided to " .. msg.From)
    end
)

print("[AdminLoggingHandler] Admin logging handlers registered")