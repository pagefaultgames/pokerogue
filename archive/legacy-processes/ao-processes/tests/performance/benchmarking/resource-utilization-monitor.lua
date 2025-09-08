--[[
Resource Utilization Monitoring System
Monitors memory and compute efficiency for performance benchmarking
--]]

local ResourceUtilizationMonitor = {}

-- Dependencies
local json = { encode = function(obj) return tostring(obj) end }

-- Resource monitoring configuration
local monitoringConfig = {
    samplingInterval = 5,         -- Seconds between samples
    retentionPeriod = 3600,      -- Keep 1 hour of data
    resourceTypes = {
        "CPU_USAGE",
        "MEMORY_USAGE", 
        "PROCESS_COUNT",
        "NETWORK_IO",
        "DISK_IO"
    },
    alertThresholds = {
        cpu = { warning = 70, critical = 90 },          -- Percentage
        memory = { warning = 80, critical = 95 },        -- Percentage
        processCount = { warning = 50, critical = 100 }, -- Count
        networkIO = { warning = 100, critical = 200 },   -- MB/s
        diskIO = { warning = 50, critical = 100 }        -- MB/s
    },
    architectureProfiles = {
        monolithic = {
            expectedCPU = 45,        -- Expected CPU usage percentage
            expectedMemory = 120,    -- Expected memory usage in MB
            expectedProcesses = 3    -- Expected process count
        },
        distributed = {
            expectedCPU = 35,        -- Lower per-process CPU usage
            expectedMemory = 80,     -- Lower per-process memory usage  
            expectedProcesses = 8    -- Higher process count
        }
    }
}

-- Monitoring state
local monitoringState = {
    isMonitoring = false,
    startTime = 0,
    samples = {},
    alerts = {},
    trends = {},
    currentResources = {
        cpu = 0,
        memory = 0,
        processCount = 0,
        networkIO = 0,
        diskIO = 0
    },
    architectureComparison = {}
}

function ResourceUtilizationMonitor.initializeResourceMonitoring(config)
    -- Update configuration
    if config then
        if config.samplingInterval then
            monitoringConfig.samplingInterval = config.samplingInterval
        end
        if config.retentionPeriod then
            monitoringConfig.retentionPeriod = config.retentionPeriod
        end
        if config.alertThresholds then
            for resource, thresholds in pairs(config.alertThresholds) do
                if monitoringConfig.alertThresholds[resource] then
                    for level, value in pairs(thresholds) do
                        monitoringConfig.alertThresholds[resource][level] = value
                    end
                end
            end
        end
    end
    
    -- Initialize state
    monitoringState.isMonitoring = false
    monitoringState.startTime = 0
    monitoringState.samples = {}
    monitoringState.alerts = {}
    monitoringState.trends = {}
    monitoringState.currentResources = {
        cpu = 0, memory = 0, processCount = 0, networkIO = 0, diskIO = 0
    }
    monitoringState.architectureComparison = {}
    
    print("[RESOURCE_MONITOR] Resource utilization monitoring initialized")
    
    return {
        success = true,
        samplingInterval = monitoringConfig.samplingInterval,
        retentionPeriod = monitoringConfig.retentionPeriod,
        resourceTypes = monitoringConfig.resourceTypes
    }
end

function ResourceUtilizationMonitor.startResourceMonitoring(duration, architecture)
    if monitoringState.isMonitoring then
        return {
            success = false,
            error = "Resource monitoring already in progress"
        }
    end
    
    monitoringState.isMonitoring = true
    monitoringState.startTime = 0
    monitoringState.samples = {}
    monitoringState.alerts = {}
    
    architecture = architecture or "distributed"
    
    print("[RESOURCE_MONITOR] Starting resource monitoring for " .. architecture .. " architecture")
    
    local monitoringDuration = duration or 300 -- Default 5 minutes
    local sampleCount = math.floor(monitoringDuration / monitoringConfig.samplingInterval)
    
    -- Simulate resource monitoring over time
    for sample = 1, sampleCount do
        local sampleTime = monitoringState.startTime + (sample * monitoringConfig.samplingInterval)
        local resourceSample = ResourceUtilizationMonitor.collectResourceSample(architecture, sample, sampleCount)
        
        resourceSample.timestamp = sampleTime
        resourceSample.sampleIndex = sample
        
        table.insert(monitoringState.samples, resourceSample)
        
        -- Update current resources
        monitoringState.currentResources = {
            cpu = resourceSample.cpu,
            memory = resourceSample.memory,
            processCount = resourceSample.processCount,
            networkIO = resourceSample.networkIO,
            diskIO = resourceSample.diskIO
        }
        
        -- Check for alerts
        ResourceUtilizationMonitor.checkResourceAlerts(resourceSample)
        
        -- Simulate real-time delay (shortened for testing)
        if sample % 10 == 0 then
            print("[RESOURCE_MONITOR] Sample " .. sample .. "/" .. sampleCount .. " collected")
        end
    end
    
    monitoringState.isMonitoring = false
    
    -- Analyze trends
    ResourceUtilizationMonitor.analyzeTrends()
    
    print("[RESOURCE_MONITOR] Resource monitoring completed")
    
    return {
        success = true,
        duration = monitoringDuration,
        sampleCount = #monitoringState.samples,
        alerts = #monitoringState.alerts,
        trends = monitoringState.trends
    }
end

function ResourceUtilizationMonitor.collectResourceSample(architecture, sampleIndex, totalSamples)
    local profile = monitoringConfig.architectureProfiles[architecture] or 
                   monitoringConfig.architectureProfiles.distributed
    
    -- Simulate realistic resource usage patterns
    local progressRatio = sampleIndex / totalSamples
    local loadFactor = 0.7 + (0.6 * progressRatio) -- Increase load over time
    
    -- CPU usage simulation
    local baseCPU = profile.expectedCPU
    local cpuVariation = math.random(-8, 12)
    local cpuSpike = (sampleIndex % 20 == 0) and math.random(15, 25) or 0 -- Occasional spikes
    local cpu = math.max(5, math.min(100, baseCPU * loadFactor + cpuVariation + cpuSpike))
    
    -- Memory usage simulation  
    local baseMemory = profile.expectedMemory
    local memoryGrowth = progressRatio * 20 -- Memory can grow over time
    local memoryVariation = math.random(-5, 8)
    local memory = math.max(10, baseMemory * loadFactor + memoryGrowth + memoryVariation)
    
    -- Process count (more stable)
    local processCount = profile.expectedProcesses + math.random(-1, 2)
    
    -- Network I/O simulation (varies with workload)
    local networkBase = architecture == "distributed" and 25 or 15
    local networkVariation = math.random(-5, 15)
    local networkIO = math.max(0, networkBase * loadFactor + networkVariation)
    
    -- Disk I/O simulation  
    local diskBase = 10
    local diskSpike = (sampleIndex % 15 == 0) and math.random(20, 40) or 0
    local diskVariation = math.random(-3, 8)
    local diskIO = math.max(0, diskBase + diskSpike + diskVariation)
    
    return {
        architecture = architecture,
        cpu = math.floor(cpu * 100) / 100,           -- Round to 2 decimal places
        memory = math.floor(memory * 100) / 100,
        processCount = processCount,
        networkIO = math.floor(networkIO * 100) / 100,
        diskIO = math.floor(diskIO * 100) / 100,
        loadFactor = loadFactor,
        efficiency = ResourceUtilizationMonitor.calculateEfficiency(cpu, memory, architecture)
    }
end

function ResourceUtilizationMonitor.calculateEfficiency(cpu, memory, architecture)
    local profile = monitoringConfig.architectureProfiles[architecture]
    
    -- Calculate efficiency based on how close actual usage is to expected usage
    local cpuEfficiency = 100 - math.abs(cpu - profile.expectedCPU)
    local memoryEfficiency = 100 - math.abs((memory - profile.expectedMemory) / profile.expectedMemory * 100)
    
    return (cpuEfficiency + memoryEfficiency) / 2
end

function ResourceUtilizationMonitor.checkResourceAlerts(sample)
    -- Check CPU alerts
    if sample.cpu >= monitoringConfig.alertThresholds.cpu.critical then
        table.insert(monitoringState.alerts, {
            timestamp = sample.timestamp,
            type = "CPU_CRITICAL",
            value = sample.cpu,
            threshold = monitoringConfig.alertThresholds.cpu.critical,
            architecture = sample.architecture
        })
    elseif sample.cpu >= monitoringConfig.alertThresholds.cpu.warning then
        table.insert(monitoringState.alerts, {
            timestamp = sample.timestamp,
            type = "CPU_WARNING", 
            value = sample.cpu,
            threshold = monitoringConfig.alertThresholds.cpu.warning,
            architecture = sample.architecture
        })
    end
    
    -- Check Memory alerts
    if sample.memory >= monitoringConfig.alertThresholds.memory.critical then
        table.insert(monitoringState.alerts, {
            timestamp = sample.timestamp,
            type = "MEMORY_CRITICAL",
            value = sample.memory,
            threshold = monitoringConfig.alertThresholds.memory.critical,
            architecture = sample.architecture
        })
    elseif sample.memory >= monitoringConfig.alertThresholds.memory.warning then
        table.insert(monitoringState.alerts, {
            timestamp = sample.timestamp,
            type = "MEMORY_WARNING",
            value = sample.memory, 
            threshold = monitoringConfig.alertThresholds.memory.warning,
            architecture = sample.architecture
        })
    end
    
    -- Check Network I/O alerts
    if sample.networkIO >= monitoringConfig.alertThresholds.networkIO.critical then
        table.insert(monitoringState.alerts, {
            timestamp = sample.timestamp,
            type = "NETWORK_IO_CRITICAL",
            value = sample.networkIO,
            threshold = monitoringConfig.alertThresholds.networkIO.critical,
            architecture = sample.architecture
        })
    end
end

function ResourceUtilizationMonitor.analyzeTrends()
    if #monitoringState.samples < 10 then
        return
    end
    
    monitoringState.trends = {}
    
    -- Analyze CPU trend
    local cpuTrend = ResourceUtilizationMonitor.calculateTrend("cpu")
    table.insert(monitoringState.trends, {
        resource = "CPU",
        direction = cpuTrend.direction,
        slope = cpuTrend.slope,
        confidence = cpuTrend.confidence
    })
    
    -- Analyze Memory trend
    local memoryTrend = ResourceUtilizationMonitor.calculateTrend("memory")
    table.insert(monitoringState.trends, {
        resource = "MEMORY", 
        direction = memoryTrend.direction,
        slope = memoryTrend.slope,
        confidence = memoryTrend.confidence
    })
    
    -- Analyze efficiency trend
    local efficiencyTrend = ResourceUtilizationMonitor.calculateTrend("efficiency")
    table.insert(monitoringState.trends, {
        resource = "EFFICIENCY",
        direction = efficiencyTrend.direction,
        slope = efficiencyTrend.slope,
        confidence = efficiencyTrend.confidence
    })
end

function ResourceUtilizationMonitor.calculateTrend(metric)
    local values = {}
    
    for i, sample in ipairs(monitoringState.samples) do
        table.insert(values, { x = i, y = sample[metric] or 0 })
    end
    
    if #values < 3 then
        return { direction = "INSUFFICIENT_DATA", slope = 0, confidence = 0 }
    end
    
    -- Calculate linear regression
    local n = #values
    local sumX, sumY, sumXY, sumX2 = 0, 0, 0, 0
    
    for _, point in ipairs(values) do
        sumX = sumX + point.x
        sumY = sumY + point.y
        sumXY = sumXY + (point.x * point.y)
        sumX2 = sumX2 + (point.x * point.x)
    end
    
    local slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    local intercept = (sumY - slope * sumX) / n
    
    -- Calculate correlation coefficient for confidence
    local meanX = sumX / n
    local meanY = sumY / n
    local numerator, denomX, denomY = 0, 0, 0
    
    for _, point in ipairs(values) do
        local dx = point.x - meanX
        local dy = point.y - meanY
        numerator = numerator + (dx * dy)
        denomX = denomX + (dx * dx)
        denomY = denomY + (dy * dy)
    end
    
    local correlation = numerator / math.sqrt(denomX * denomY)
    local confidence = math.abs(correlation) * 100
    
    -- Determine direction
    local direction
    if math.abs(slope) < 0.1 then
        direction = "STABLE"
    elseif slope > 0 then
        direction = "INCREASING"
    else
        direction = "DECREASING"
    end
    
    return {
        direction = direction,
        slope = slope,
        intercept = intercept,
        confidence = confidence
    }
end

function ResourceUtilizationMonitor.compareArchitectureUtilization(monolithicResults, distributedResults)
    local comparison = {
        monolithic = ResourceUtilizationMonitor.calculateAverageUtilization(monolithicResults),
        distributed = ResourceUtilizationMonitor.calculateAverageUtilization(distributedResults),
        differences = {},
        efficiency = {},
        recommendation = ""
    }
    
    -- Calculate differences
    comparison.differences = {
        cpu = comparison.distributed.cpu - comparison.monolithic.cpu,
        memory = comparison.distributed.memory - comparison.monolithic.memory,
        processCount = comparison.distributed.processCount - comparison.monolithic.processCount,
        networkIO = comparison.distributed.networkIO - comparison.monolithic.networkIO,
        diskIO = comparison.distributed.diskIO - comparison.monolithic.diskIO
    }
    
    -- Calculate efficiency comparison
    comparison.efficiency = {
        monolithic = comparison.monolithic.efficiency,
        distributed = comparison.distributed.efficiency,
        delta = comparison.distributed.efficiency - comparison.monolithic.efficiency
    }
    
    -- Generate recommendation
    if comparison.efficiency.delta > 10 then
        comparison.recommendation = "Distributed architecture shows significantly better resource efficiency"
    elseif comparison.efficiency.delta < -10 then  
        comparison.recommendation = "Monolithic architecture shows better resource efficiency"
    else
        comparison.recommendation = "Both architectures show similar resource efficiency"
    end
    
    monitoringState.architectureComparison = comparison
    
    return comparison
end

function ResourceUtilizationMonitor.calculateAverageUtilization(samples)
    if not samples or #samples == 0 then
        return { cpu = 0, memory = 0, processCount = 0, networkIO = 0, diskIO = 0, efficiency = 0 }
    end
    
    local totals = { cpu = 0, memory = 0, processCount = 0, networkIO = 0, diskIO = 0, efficiency = 0 }
    
    for _, sample in ipairs(samples) do
        totals.cpu = totals.cpu + sample.cpu
        totals.memory = totals.memory + sample.memory
        totals.processCount = totals.processCount + sample.processCount
        totals.networkIO = totals.networkIO + sample.networkIO
        totals.diskIO = totals.diskIO + sample.diskIO
        totals.efficiency = totals.efficiency + sample.efficiency
    end
    
    local count = #samples
    return {
        cpu = totals.cpu / count,
        memory = totals.memory / count,
        processCount = totals.processCount / count,
        networkIO = totals.networkIO / count,
        diskIO = totals.diskIO / count,
        efficiency = totals.efficiency / count
    }
end

function ResourceUtilizationMonitor.getCurrentResourceUsage()
    return monitoringState.currentResources
end

function ResourceUtilizationMonitor.getResourceHistory(duration)
    duration = duration or 300 -- Default 5 minutes
    local cutoffTime = 0 - duration
    
    local recentSamples = {}
    for _, sample in ipairs(monitoringState.samples) do
        if sample.timestamp >= cutoffTime then
            table.insert(recentSamples, sample)
        end
    end
    
    return recentSamples
end

function ResourceUtilizationMonitor.getResourceAlerts()
    return monitoringState.alerts
end

function ResourceUtilizationMonitor.getResourceTrends()
    return monitoringState.trends
end

function ResourceUtilizationMonitor.generateResourceUtilizationReport()
    local report = {
        reportTimestamp = 0,
        monitoringPeriod = {
            startTime = monitoringState.startTime,
            duration = 0 - monitoringState.startTime,
            sampleCount = #monitoringState.samples
        },
        averageUtilization = ResourceUtilizationMonitor.calculateAverageUtilization(monitoringState.samples),
        peakUtilization = ResourceUtilizationMonitor.calculatePeakUtilization(),
        alerts = monitoringState.alerts,
        trends = monitoringState.trends,
        architectureComparison = monitoringState.architectureComparison,
        efficiency = {
            overall = 0,
            cpuEfficiency = 0,
            memoryEfficiency = 0,
            recommendations = {}
        }
    }
    
    -- Calculate efficiency metrics
    if #monitoringState.samples > 0 then
        local totalEfficiency = 0
        for _, sample in ipairs(monitoringState.samples) do
            totalEfficiency = totalEfficiency + sample.efficiency
        end
        report.efficiency.overall = totalEfficiency / #monitoringState.samples
    end
    
    -- Generate efficiency recommendations
    if report.efficiency.overall < 60 then
        table.insert(report.efficiency.recommendations, "Resource utilization efficiency is below optimal levels")
    end
    
    if #monitoringState.alerts > 0 then
        table.insert(report.efficiency.recommendations, "Address resource utilization alerts for better efficiency")
    end
    
    return report
end

function ResourceUtilizationMonitor.calculatePeakUtilization()
    if #monitoringState.samples == 0 then
        return { cpu = 0, memory = 0, networkIO = 0, diskIO = 0 }
    end
    
    local peaks = { cpu = 0, memory = 0, networkIO = 0, diskIO = 0 }
    
    for _, sample in ipairs(monitoringState.samples) do
        peaks.cpu = math.max(peaks.cpu, sample.cpu)
        peaks.memory = math.max(peaks.memory, sample.memory)
        peaks.networkIO = math.max(peaks.networkIO, sample.networkIO)
        peaks.diskIO = math.max(peaks.diskIO, sample.diskIO)
    end
    
    return peaks
end

return ResourceUtilizationMonitor