-- Error Handling Framework
-- Provides comprehensive error handling, logging, and response formatting

local ErrorHandler = {}

-- Import required modules
local CryptoRNG = require("game-logic.rng.crypto-rng")

-- Error Type Constants
ErrorHandler.ERROR_TYPES = {
    VALIDATION = "VALIDATION_ERROR",
    HANDLER = "HANDLER_ERROR",
    SYSTEM = "SYSTEM_ERROR", 
    NOT_FOUND = "NOT_FOUND_ERROR",
    AUTHENTICATION = "AUTHENTICATION_ERROR",
    RATE_LIMIT = "RATE_LIMIT_ERROR",
    TIMEOUT = "TIMEOUT_ERROR",
    DATA_CORRUPTION = "DATA_CORRUPTION_ERROR"
}

-- Error Severity Levels
ErrorHandler.SEVERITY_LEVELS = {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}

-- Error Code Registry
ErrorHandler.ERROR_CODES = {
    -- Validation Errors (1000-1999)
    MISSING_REQUIRED_TAG = 1001,
    INVALID_TAG_VALUE = 1002,
    MISSING_REQUIRED_DATA = 1003,
    INVALID_DATA_FORMAT = 1004,
    SCHEMA_VALIDATION_FAILED = 1005,
    
    -- Handler Errors (2000-2999)
    HANDLER_NOT_FOUND = 2001,
    HANDLER_EXECUTION_FAILED = 2002,
    HANDLER_TIMEOUT = 2003,
    HANDLER_INITIALIZATION_FAILED = 2004,
    
    -- System Errors (3000-3999)
    PROCESS_STARTUP_FAILED = 3001,
    MEMORY_ALLOCATION_FAILED = 3002,
    RESOURCE_UNAVAILABLE = 3003,
    INTERNAL_STATE_ERROR = 3004,
    
    -- Authentication Errors (4000-4999)
    INVALID_SENDER = 4001,
    INSUFFICIENT_PERMISSIONS = 4002,
    AUTHENTICATION_REQUIRED = 4003,
    TOKEN_EXPIRED = 4004,
    
    -- Rate Limit Errors (5000-5999)
    REQUEST_RATE_EXCEEDED = 5001,
    CONCURRENT_LIMIT_EXCEEDED = 5002,
    DAILY_QUOTA_EXCEEDED = 5003
}

-- Initialize error tracking
ErrorHandler.errorStats = {
    total_errors = 0,
    errors_by_type = {},
    errors_by_handler = {},
    last_error_time = 0
}

-- Create structured error object
function ErrorHandler.createError(errorType, errorCode, message, details)
    local error = {
        type = errorType,
        code = errorCode,
        message = message,
        details = details or {},
        timestamp = os.time(),
        correlation_id = ErrorHandler.generateCorrelationId(),
        severity = ErrorHandler.getSeverityForErrorType(errorType)
    }
    
    -- Update error statistics
    ErrorHandler.trackError(error)
    
    return error
end

-- Generate unique correlation ID for error tracking
function ErrorHandler.generateCorrelationId()
    local timestamp = os.time() * 1000 + CryptoRNG.random(0, 999)
    local randomSuffix = CryptoRNG.random(10000, 99999)
    return "err_" .. timestamp .. "_" .. randomSuffix
end

-- Get severity level based on error type
function ErrorHandler.getSeverityForErrorType(errorType)
    local severityMap = {
        [ErrorHandler.ERROR_TYPES.VALIDATION] = ErrorHandler.SEVERITY_LEVELS.LOW,
        [ErrorHandler.ERROR_TYPES.HANDLER] = ErrorHandler.SEVERITY_LEVELS.MEDIUM,
        [ErrorHandler.ERROR_TYPES.SYSTEM] = ErrorHandler.SEVERITY_LEVELS.HIGH,
        [ErrorHandler.ERROR_TYPES.NOT_FOUND] = ErrorHandler.SEVERITY_LEVELS.LOW,
        [ErrorHandler.ERROR_TYPES.AUTHENTICATION] = ErrorHandler.SEVERITY_LEVELS.MEDIUM,
        [ErrorHandler.ERROR_TYPES.RATE_LIMIT] = ErrorHandler.SEVERITY_LEVELS.LOW,
        [ErrorHandler.ERROR_TYPES.TIMEOUT] = ErrorHandler.SEVERITY_LEVELS.MEDIUM,
        [ErrorHandler.ERROR_TYPES.DATA_CORRUPTION] = ErrorHandler.SEVERITY_LEVELS.CRITICAL
    }
    
    return severityMap[errorType] or ErrorHandler.SEVERITY_LEVELS.MEDIUM
end

-- Track error statistics
function ErrorHandler.trackError(error)
    ErrorHandler.errorStats.total_errors = ErrorHandler.errorStats.total_errors + 1
    ErrorHandler.errorStats.last_error_time = error.timestamp
    
    -- Track by type
    if not ErrorHandler.errorStats.errors_by_type[error.type] then
        ErrorHandler.errorStats.errors_by_type[error.type] = 0
    end
    ErrorHandler.errorStats.errors_by_type[error.type] = ErrorHandler.errorStats.errors_by_type[error.type] + 1
end

-- Send standardized error response to AO message
function ErrorHandler.sendErrorResponse(msg, error)
    if not msg or not msg.reply then
        return false
    end
    
    local responseData = {
        error = {
            type = error.type,
            code = error.code,
            message = error.message,
            correlation_id = error.correlation_id,
            timestamp = os.date("%Y-%m-%d %H:%M:%S", error.timestamp),
            severity = error.severity
        }
    }
    
    -- Add details if present
    if error.details and next(error.details) then
        responseData.error.details = error.details
    end
    
    msg.reply({
        Target = msg.From,
        Tags = {
            Action = "Error-Response",
            Success = "false",
            ["Error-Type"] = error.type,
            ["Error-Code"] = tostring(error.code),
            ["Correlation-ID"] = error.correlation_id,
            ["Severity"] = error.severity
        },
        Data = json.encode(responseData)
    })
    
    return true
end

-- Wrap handler execution with error handling
function ErrorHandler.wrapHandler(handlerName, handlerFunction)
    return function(msg)
        local success, result = pcall(handlerFunction, msg)
        
        if not success then
            -- Create error object from the caught error
            local error = ErrorHandler.createError(
                ErrorHandler.ERROR_TYPES.HANDLER,
                ErrorHandler.ERROR_CODES.HANDLER_EXECUTION_FAILED,
                "Handler execution failed: " .. tostring(result),
                {
                    handler_name = handlerName,
                    message_from = msg.From,
                    message_tags = msg.Tags
                }
            )
            
            -- Track handler-specific errors
            if not ErrorHandler.errorStats.errors_by_handler[handlerName] then
                ErrorHandler.errorStats.errors_by_handler[handlerName] = 0
            end
            ErrorHandler.errorStats.errors_by_handler[handlerName] = 
                ErrorHandler.errorStats.errors_by_handler[handlerName] + 1
                
            -- Send error response
            ErrorHandler.sendErrorResponse(msg, error)
            
            -- Log error for debugging
            ErrorHandler.logError(error)
            
            return false
        end
        
        return result
    end
end

-- Log error for debugging and monitoring
function ErrorHandler.logError(error)
    local logMessage = string.format(
        "[ERROR] [%s] [%s] %s (Code: %d, Correlation: %s)",
        os.date("%Y-%m-%d %H:%M:%S", error.timestamp),
        error.severity:upper(),
        error.message,
        error.code,
        error.correlation_id
    )
    
    -- Print to console (in production, this would go to proper logging system)
    print(logMessage)
    
    -- Add details if present
    if error.details and next(error.details) then
        for key, value in pairs(error.details) do
            print("  " .. key .. ": " .. tostring(value))
        end
    end
end

-- Validate message format and return structured error if invalid
function ErrorHandler.validateMessage(msg, requiredTags, optionalTags)
    local errors = {}
    
    -- Check if message has Tags
    if not msg.Tags then
        table.insert(errors, "Message missing Tags")
    else
        -- Check required tags
        if requiredTags then
            for _, tag in ipairs(requiredTags) do
                if not msg.Tags[tag] then
                    table.insert(errors, "Missing required tag: " .. tag)
                end
            end
        end
    end
    
    -- Check if sender is present
    if not msg.From then
        table.insert(errors, "Message missing From field")
    end
    
    if #errors > 0 then
        return ErrorHandler.createError(
            ErrorHandler.ERROR_TYPES.VALIDATION,
            ErrorHandler.ERROR_CODES.MISSING_REQUIRED_TAG,
            "Message validation failed",
            { validation_errors = errors }
        )
    end
    
    return nil -- No errors
end

-- Get error statistics for monitoring
function ErrorHandler.getErrorStats()
    return {
        total_errors = ErrorHandler.errorStats.total_errors,
        errors_by_type = ErrorHandler.errorStats.errors_by_type,
        errors_by_handler = ErrorHandler.errorStats.errors_by_handler,
        last_error_time = ErrorHandler.errorStats.last_error_time > 0 and 
            os.date("%Y-%m-%d %H:%M:%S", ErrorHandler.errorStats.last_error_time) or "None"
    }
end

-- Reset error statistics (for testing or maintenance)
function ErrorHandler.resetErrorStats()
    ErrorHandler.errorStats = {
        total_errors = 0,
        errors_by_type = {},
        errors_by_handler = {},
        last_error_time = 0
    }
end

-- Health check for error handling system
function ErrorHandler.healthCheck()
    local stats = ErrorHandler.getErrorStats()
    local health = {
        status = "healthy",
        error_rate = stats.total_errors,
        high_severity_errors = 0,
        critical_errors = 0
    }
    
    -- Count high severity and critical errors
    for errorType, count in pairs(stats.errors_by_type) do
        local severity = ErrorHandler.getSeverityForErrorType(errorType)
        if severity == ErrorHandler.SEVERITY_LEVELS.HIGH then
            health.high_severity_errors = health.high_severity_errors + count
        elseif severity == ErrorHandler.SEVERITY_LEVELS.CRITICAL then
            health.critical_errors = health.critical_errors + count
        end
    end
    
    -- Determine overall health status
    if health.critical_errors > 0 then
        health.status = "critical"
    elseif health.high_severity_errors > 5 then
        health.status = "degraded"
    elseif stats.total_errors > 100 then
        health.status = "warning"
    end
    
    return health
end

return ErrorHandler