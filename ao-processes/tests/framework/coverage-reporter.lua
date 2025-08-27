-- Test Coverage Reporter and Metrics Collection
-- Comprehensive coverage analysis for AO handler testing

local CoverageReporter = {}
CoverageReporter.__index = CoverageReporter

function CoverageReporter.new()
    local reporter = setmetatable({}, CoverageReporter)
    
    reporter.coverage = {
        files = {},
        functions = {},
        lines = {},
        branches = {},
        handlers = {}
    }
    
    reporter.thresholds = {
        line = 80,
        function_ = 90,
        branch = 75,
        handler = 95
    }
    
    reporter.startTime = nil
    reporter.endTime = nil
    reporter.testMetrics = {}
    
    return reporter
end

-- Coverage Tracking
function CoverageReporter:startCoverage()
    self.startTime = os.time()
    self.coverage = {
        files = {},
        functions = {},
        lines = {},
        branches = {},
        handlers = {}
    }
    
    -- Hook into function calls for tracking
    self:setupCoverageHooks()
end

function CoverageReporter:endCoverage()
    self.endTime = os.time()
    self:teardownCoverageHooks()
end

function CoverageReporter:setupCoverageHooks()
    -- Store original debug hook if exists
    self.originalHook = debug.gethook()
    
    -- Set up line-by-line tracking
    debug.sethook(function(event, line)
        if event == "line" then
            local info = debug.getinfo(2, "Sl")
            if info and info.source then
                local file = info.source
                if string.sub(file, 1, 1) == "@" then
                    file = string.sub(file, 2)
                end
                
                -- Only track our project files
                if string.find(file, "ao%-processes") then
                    self:recordLineCoverage(file, line)
                end
            end
        elseif event == "call" then
            local info = debug.getinfo(2, "Sn")
            if info and info.source and info.name then
                local file = info.source
                if string.sub(file, 1, 1) == "@" then
                    file = string.sub(file, 2)
                end
                
                if string.find(file, "ao%-processes") then
                    self:recordFunctionCoverage(file, info.name, info.linedefined)
                end
            end
        end
    end, "cl")
end

function CoverageReporter:teardownCoverageHooks()
    -- Restore original hook
    if self.originalHook then
        debug.sethook(self.originalHook)
    else
        debug.sethook()
    end
end

function CoverageReporter:recordLineCoverage(file, line)
    if not self.coverage.lines[file] then
        self.coverage.lines[file] = {}
    end
    
    self.coverage.lines[file][line] = (self.coverage.lines[file][line] or 0) + 1
    self.coverage.files[file] = true
end

function CoverageReporter:recordFunctionCoverage(file, functionName, lineNumber)
    local functionKey = file .. ":" .. functionName .. ":" .. (lineNumber or 0)
    
    if not self.coverage.functions[functionKey] then
        self.coverage.functions[functionKey] = {
            file = file,
            name = functionName,
            line = lineNumber,
            calls = 0
        }
    end
    
    self.coverage.functions[functionKey].calls = self.coverage.functions[functionKey].calls + 1
    self.coverage.files[file] = true
end

function CoverageReporter:recordHandlerCoverage(handlerName, executionData)
    if not self.coverage.handlers[handlerName] then
        self.coverage.handlers[handlerName] = {
            name = handlerName,
            executions = 0,
            successfulExecutions = 0,
            averageExecutionTime = 0,
            totalExecutionTime = 0,
            patterns = {},
            messageTypes = {}
        }
    end
    
    local handler = self.coverage.handlers[handlerName]
    handler.executions = handler.executions + 1
    
    if executionData.success then
        handler.successfulExecutions = handler.successfulExecutions + 1
    end
    
    if executionData.duration then
        handler.totalExecutionTime = handler.totalExecutionTime + executionData.duration
        handler.averageExecutionTime = handler.totalExecutionTime / handler.executions
    end
    
    if executionData.messageType then
        handler.messageTypes[executionData.messageType] = (handler.messageTypes[executionData.messageType] or 0) + 1
    end
end

-- Coverage Analysis
function CoverageReporter:calculateLineCoverage(file)
    if not file then
        -- Calculate overall line coverage
        local totalLines = 0
        local coveredLines = 0
        
        for file, lines in pairs(self.coverage.lines) do
            for line, count in pairs(lines) do
                totalLines = totalLines + 1
                if count > 0 then
                    coveredLines = coveredLines + 1
                end
            end
        end
        
        return totalLines > 0 and (coveredLines / totalLines * 100) or 0, coveredLines, totalLines
    else
        -- Calculate coverage for specific file
        local lines = self.coverage.lines[file] or {}
        local totalLines = 0
        local coveredLines = 0
        
        for line, count in pairs(lines) do
            totalLines = totalLines + 1
            if count > 0 then
                coveredLines = coveredLines + 1
            end
        end
        
        return totalLines > 0 and (coveredLines / totalLines * 100) or 0, coveredLines, totalLines
    end
end

function CoverageReporter:calculateFunctionCoverage(file)
    local totalFunctions = 0
    local coveredFunctions = 0
    
    for functionKey, functionData in pairs(self.coverage.functions) do
        if not file or functionData.file == file then
            totalFunctions = totalFunctions + 1
            if functionData.calls > 0 then
                coveredFunctions = coveredFunctions + 1
            end
        end
    end
    
    return totalFunctions > 0 and (coveredFunctions / totalFunctions * 100) or 0, coveredFunctions, totalFunctions
end

function CoverageReporter:calculateHandlerCoverage()
    local totalHandlers = 0
    local testedHandlers = 0
    local successfulHandlers = 0
    
    for handlerName, handlerData in pairs(self.coverage.handlers) do
        totalHandlers = totalHandlers + 1
        
        if handlerData.executions > 0 then
            testedHandlers = testedHandlers + 1
            
            if handlerData.successfulExecutions > 0 then
                successfulHandlers = successfulHandlers + 1
            end
        end
    end
    
    local testCoverage = totalHandlers > 0 and (testedHandlers / totalHandlers * 100) or 0
    local successRate = testedHandlers > 0 and (successfulHandlers / testedHandlers * 100) or 0
    
    return testCoverage, successRate, testedHandlers, totalHandlers
end

-- Report Generation
function CoverageReporter:generateDetailedReport()
    local report = {
        metadata = {
            startTime = self.startTime,
            endTime = self.endTime,
            duration = self.endTime and (self.endTime - self.startTime) or 0,
            generatedAt = os.time()
        },
        summary = {},
        files = {},
        handlers = {},
        recommendations = {},
        thresholds = self.thresholds
    }
    
    -- Overall coverage summary
    local lineCoverage, coveredLines, totalLines = self:calculateLineCoverage()
    local functionCoverage, coveredFunctions, totalFunctions = self:calculateFunctionCoverage()
    local handlerTestCoverage, handlerSuccessRate = self:calculateHandlerCoverage()
    
    report.summary = {
        lineCoverage = lineCoverage,
        functionCoverage = functionCoverage,
        handlerTestCoverage = handlerTestCoverage,
        handlerSuccessRate = handlerSuccessRate,
        filesAnalyzed = 0,
        totalLines = totalLines,
        coveredLines = coveredLines,
        totalFunctions = totalFunctions,
        coveredFunctions = coveredFunctions
    }
    
    -- Count analyzed files
    for _ in pairs(self.coverage.files) do
        report.summary.filesAnalyzed = report.summary.filesAnalyzed + 1
    end
    
    -- File-by-file analysis
    for file, _ in pairs(self.coverage.files) do
        local fileLineCoverage, fileCoveredLines, fileTotalLines = self:calculateLineCoverage(file)
        local fileFunctionCoverage, fileCoveredFunctions, fileTotalFunctions = self:calculateFunctionCoverage(file)
        
        report.files[file] = {
            lineCoverage = fileLineCoverage,
            functionCoverage = fileFunctionCoverage,
            totalLines = fileTotalLines,
            coveredLines = fileCoveredLines,
            totalFunctions = fileTotalFunctions,
            coveredFunctions = fileCoveredFunctions,
            uncoveredLines = self:getUncoveredLines(file),
            hotspots = self:getExecutionHotspots(file)
        }
    end
    
    -- Handler analysis
    for handlerName, handlerData in pairs(self.coverage.handlers) do
        local successRate = handlerData.executions > 0 and 
                          (handlerData.successfulExecutions / handlerData.executions * 100) or 0
        
        report.handlers[handlerName] = {
            name = handlerName,
            executions = handlerData.executions,
            successfulExecutions = handlerData.successfulExecutions,
            successRate = successRate,
            averageExecutionTime = handlerData.averageExecutionTime,
            messageTypesCovered = self:countKeys(handlerData.messageTypes),
            messageTypesDetails = handlerData.messageTypes
        }
    end
    
    -- Generate recommendations
    report.recommendations = self:generateRecommendations(report)
    
    return report
end

function CoverageReporter:getUncoveredLines(file)
    local uncovered = {}
    local lines = self.coverage.lines[file] or {}
    
    -- This is simplified - in a real implementation, you'd parse the actual file
    -- to determine which lines are executable vs comments/whitespace
    for line = 1, 1000 do -- Arbitrary max line check
        if not lines[line] or lines[line] == 0 then
            -- Check if this line exists in the file and is executable
            -- This would require actual file parsing in real implementation
            table.insert(uncovered, line)
        end
    end
    
    return uncovered
end

function CoverageReporter:getExecutionHotspots(file)
    local hotspots = {}
    local lines = self.coverage.lines[file] or {}
    
    -- Find lines with high execution counts
    local threshold = 10 -- Lines executed more than 10 times
    
    for line, count in pairs(lines) do
        if count > threshold then
            table.insert(hotspots, {line = line, count = count})
        end
    end
    
    -- Sort by execution count
    table.sort(hotspots, function(a, b) return a.count > b.count end)
    
    return hotspots
end

function CoverageReporter:generateRecommendations(report)
    local recommendations = {}
    
    -- Line coverage recommendations
    if report.summary.lineCoverage < self.thresholds.line then
        table.insert(recommendations, {
            type = "line_coverage",
            priority = "high",
            message = string.format("Line coverage (%.1f%%) is below threshold (%.1f%%)", 
                                  report.summary.lineCoverage, self.thresholds.line)
        })
    end
    
    -- Function coverage recommendations
    if report.summary.functionCoverage < self.thresholds.function_ then
        table.insert(recommendations, {
            type = "function_coverage",
            priority = "high",
            message = string.format("Function coverage (%.1f%%) is below threshold (%.1f%%)", 
                                  report.summary.functionCoverage, self.thresholds.function_)
        })
    end
    
    -- Handler coverage recommendations
    if report.summary.handlerTestCoverage < self.thresholds.handler then
        table.insert(recommendations, {
            type = "handler_coverage",
            priority = "critical",
            message = string.format("Handler test coverage (%.1f%%) is below threshold (%.1f%%)", 
                                  report.summary.handlerTestCoverage, self.thresholds.handler)
        })
    end
    
    -- Performance recommendations
    for handlerName, handlerData in pairs(report.handlers) do
        if handlerData.averageExecutionTime > 1.0 then
            table.insert(recommendations, {
                type = "performance",
                priority = "medium",
                message = string.format("Handler '%s' has high average execution time (%.3fs)", 
                                      handlerName, handlerData.averageExecutionTime)
            })
        end
        
        if handlerData.successRate < 95.0 then
            table.insert(recommendations, {
                type = "reliability",
                priority = "high",
                message = string.format("Handler '%s' has low success rate (%.1f%%)", 
                                      handlerName, handlerData.successRate)
            })
        end
    end
    
    return recommendations
end

-- Utility Functions
function CoverageReporter:countKeys(table)
    local count = 0
    for _ in pairs(table) do
        count = count + 1
    end
    return count
end

function CoverageReporter:printSummaryReport()
    local report = self:generateDetailedReport()
    
    print("📊 Coverage Report Summary")
    print("=========================")
    print(string.format("Files Analyzed: %d", report.summary.filesAnalyzed))
    print(string.format("Line Coverage: %.1f%% (%d/%d)", 
          report.summary.lineCoverage, report.summary.coveredLines, report.summary.totalLines))
    print(string.format("Function Coverage: %.1f%% (%d/%d)", 
          report.summary.functionCoverage, report.summary.coveredFunctions, report.summary.totalFunctions))
    print(string.format("Handler Test Coverage: %.1f%%", report.summary.handlerTestCoverage))
    print(string.format("Handler Success Rate: %.1f%%", report.summary.handlerSuccessRate))
    
    if #report.recommendations > 0 then
        print("\n⚠️  Recommendations:")
        for _, rec in ipairs(report.recommendations) do
            local icon = rec.priority == "critical" and "🔴" or 
                        rec.priority == "high" and "🟠" or
                        rec.priority == "medium" and "🟡" or "ℹ️"
            print(string.format("   %s %s", icon, rec.message))
        end
    else
        print("\n🎉 All coverage thresholds met!")
    end
end

function CoverageReporter:exportReport(format, filename)
    format = format or "json"
    filename = filename or ("coverage-report." .. format)
    
    local report = self:generateDetailedReport()
    
    if format == "json" then
        local json = require("json")
        local content = json.encode(report)
        
        local file = io.open(filename, "w")
        if file then
            file:write(content)
            file:close()
            return true, "Report exported to " .. filename
        else
            return false, "Failed to write file " .. filename
        end
    else
        return false, "Unsupported format: " .. format
    end
end

return CoverageReporter