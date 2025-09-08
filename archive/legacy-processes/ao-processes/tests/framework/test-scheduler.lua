-- AO Process Test Scheduler
-- Automated test scheduling and execution management with advanced orchestration
-- Part of the comprehensive testing framework for development environment

local TestScheduler = {}

-- Test scheduling state
local schedule_state = {
    active_schedules = {},
    execution_queue = {},
    running_tests = {},
    completed_executions = {},
    failed_executions = {},
    schedule_counter = 0
}

-- Configuration for test scheduling
local scheduler_config = {
    max_concurrent_executions = 3,
    default_execution_timeout = 300000, -- 5 minutes
    retry_failed_executions = 2,
    execution_cleanup_after = 3600000, -- 1 hour
    priority_levels = {
        critical = 1,
        high = 2,
        normal = 3,
        low = 4
    },
    schedule_types = {
        immediate = "immediate",
        delayed = "delayed",
        recurring = "recurring",
        conditional = "conditional"
    }
}

-- Schedule creation and management
function TestScheduler.createSchedule(schedule_config)
    local schedule_id = "schedule_" .. (schedule_state.schedule_counter + 1)
    schedule_state.schedule_counter = schedule_state.schedule_counter + 1
    
    local schedule = {
        id = schedule_id,
        name = schedule_config.name or "Unnamed Schedule",
        description = schedule_config.description or "",
        schedule_type = schedule_config.schedule_type or scheduler_config.schedule_types.immediate,
        priority = schedule_config.priority or scheduler_config.priority_levels.normal,
        tests = schedule_config.tests or {},
        execution_strategy = schedule_config.execution_strategy or "sequential",
        created_at = os.clock(),
        next_execution = schedule_config.next_execution or os.clock(),
        interval = schedule_config.interval, -- For recurring schedules
        max_executions = schedule_config.max_executions,
        execution_count = 0,
        enabled = schedule_config.enabled ~= false,
        conditions = schedule_config.conditions or {},
        notifications = schedule_config.notifications or {},
        timeout = schedule_config.timeout or scheduler_config.default_execution_timeout,
        metadata = schedule_config.metadata or {}
    }
    
    schedule_state.active_schedules[schedule_id] = schedule
    
    print("📅 Test schedule created: " .. schedule.name .. " (ID: " .. schedule_id .. ")")
    return schedule_id
end

function TestScheduler.updateSchedule(schedule_id, updates)
    local schedule = schedule_state.active_schedules[schedule_id]
    if not schedule then
        error("Schedule not found: " .. schedule_id)
    end
    
    for key, value in pairs(updates) do
        if key ~= "id" and key ~= "created_at" then
            schedule[key] = value
        end
    end
    
    print("🔄 Schedule updated: " .. schedule.name)
    return true
end

function TestScheduler.removeSchedule(schedule_id)
    local schedule = schedule_state.active_schedules[schedule_id]
    if not schedule then
        return false
    end
    
    -- Cancel any running executions for this schedule
    for execution_id, execution in pairs(schedule_state.running_tests) do
        if execution.schedule_id == schedule_id then
            TestScheduler.cancelExecution(execution_id)
        end
    end
    
    schedule_state.active_schedules[schedule_id] = nil
    print("🗑️ Schedule removed: " .. schedule.name)
    return true
end

-- Execution management
function TestScheduler.scheduleExecution(schedule_id, options)
    local schedule = schedule_state.active_schedules[schedule_id]
    if not schedule or not schedule.enabled then
        return nil
    end
    
    options = options or {}
    
    local execution_id = "exec_" .. schedule_id .. "_" .. os.clock()
    local execution = {
        id = execution_id,
        schedule_id = schedule_id,
        schedule_name = schedule.name,
        status = "queued",
        priority = options.priority or schedule.priority,
        tests = options.tests or schedule.tests,
        execution_strategy = options.execution_strategy or schedule.execution_strategy,
        scheduled_time = os.clock(),
        start_time = nil,
        end_time = nil,
        timeout = options.timeout or schedule.timeout,
        retry_count = 0,
        max_retries = options.max_retries or scheduler_config.retry_failed_executions,
        results = {},
        error_message = nil,
        metadata = {
            execution_type = options.execution_type or "scheduled",
            trigger = options.trigger or "scheduler",
            environment = options.environment or "development"
        }
    }
    
    -- Insert into execution queue based on priority
    TestScheduler.insertIntoQueue(execution)
    
    print("⏰ Test execution scheduled: " .. execution_id .. " (Priority: " .. execution.priority .. ")")
    return execution_id
end

function TestScheduler.insertIntoQueue(execution)
    -- Insert execution into queue based on priority
    local inserted = false
    for i, queued_execution in ipairs(schedule_state.execution_queue) do
        if execution.priority < queued_execution.priority then
            table.insert(schedule_state.execution_queue, i, execution)
            inserted = true
            break
        end
    end
    
    if not inserted then
        table.insert(schedule_state.execution_queue, execution)
    end
end

function TestScheduler.processExecutionQueue()
    -- Process queued executions based on available capacity
    local current_running = 0
    for _ in pairs(schedule_state.running_tests) do
        current_running = current_running + 1
    end
    
    local available_slots = scheduler_config.max_concurrent_executions - current_running
    if available_slots <= 0 then
        return 0 -- No available execution slots
    end
    
    local executions_started = 0
    local i = 1
    while i <= #schedule_state.execution_queue and executions_started < available_slots do
        local execution = schedule_state.execution_queue[i]
        
        if TestScheduler.canStartExecution(execution) then
            -- Remove from queue and start execution
            table.remove(schedule_state.execution_queue, i)
            TestScheduler.startExecution(execution)
            executions_started = executions_started + 1
        else
            i = i + 1
        end
    end
    
    return executions_started
end

function TestScheduler.canStartExecution(execution)
    local schedule = schedule_state.active_schedules[execution.schedule_id]
    if not schedule or not schedule.enabled then
        return false
    end
    
    -- Check schedule conditions
    if schedule.conditions and #schedule.conditions > 0 then
        for _, condition in ipairs(schedule.conditions) do
            if not TestScheduler.evaluateCondition(condition) then
                return false
            end
        end
    end
    
    -- Check execution time constraints
    local current_time = os.clock()
    if execution.scheduled_time > current_time then
        return false -- Not yet time to execute
    end
    
    return true
end

function TestScheduler.startExecution(execution)
    execution.status = "running"
    execution.start_time = os.clock()
    schedule_state.running_tests[execution.id] = execution
    
    print("🚀 Starting test execution: " .. execution.id)
    
    -- Execute the tests asynchronously (simulated)
    local success, results = pcall(function()
        return TestScheduler.executeTestSuite(execution)
    end)
    
    if success then
        TestScheduler.completeExecution(execution.id, results)
    else
        TestScheduler.failExecution(execution.id, results)
    end
end

function TestScheduler.executeTestSuite(execution)
    print("  🧪 Executing " .. #execution.tests .. " tests...")
    
    -- Load the advanced test runner
    local AdvancedTestRunner = require("ao-processes.tests.advanced-test-runner")
    
    -- Configure test runner for scheduled execution
    AdvancedTestRunner.configure({
        max_parallel_tests = execution.execution_strategy == "parallel" and 4 or 1,
        test_timeout = execution.timeout,
        continue_on_failure = true,
        generate_comprehensive_reports = true
    })
    
    -- Create test configuration based on execution
    local test_options = {
        execution_id = execution.id,
        schedule_id = execution.schedule_id,
        priority = execution.priority,
        metadata = execution.metadata
    }
    
    -- Determine which test types to run based on execution configuration
    if execution.metadata.test_types then
        for test_type, enabled in pairs(execution.metadata.test_types) do
            test_options["skip_" .. test_type .. "_tests"] = not enabled
        end
    end
    
    -- Execute the test suite
    local results = AdvancedTestRunner.runTestSuite(test_options)
    
    return results
end

function TestScheduler.completeExecution(execution_id, results)
    local execution = schedule_state.running_tests[execution_id]
    if not execution then
        return false
    end
    
    execution.status = "completed"
    execution.end_time = os.clock()
    execution.results = results
    
    -- Move to completed executions
    schedule_state.running_tests[execution_id] = nil
    schedule_state.completed_executions[execution_id] = execution
    
    -- Update schedule execution count
    local schedule = schedule_state.active_schedules[execution.schedule_id]
    if schedule then
        schedule.execution_count = schedule.execution_count + 1
        
        -- Handle recurring schedules
        if schedule.schedule_type == scheduler_config.schedule_types.recurring then
            TestScheduler.scheduleNextRecurrence(execution.schedule_id)
        end
        
        -- Check if schedule has reached max executions
        if schedule.max_executions and schedule.execution_count >= schedule.max_executions then
            schedule.enabled = false
            print("📊 Schedule reached max executions and has been disabled: " .. schedule.name)
        end
    end
    
    local duration = (execution.end_time - execution.start_time) * 1000
    local success_emoji = results.overall_success and "✅" or "❌"
    
    print(string.format("  %s Execution completed: %s (%.2fs)", 
        success_emoji, execution_id, duration / 1000))
    
    -- Send notifications if configured
    TestScheduler.sendNotifications(execution)
    
    return true
end

function TestScheduler.failExecution(execution_id, error_message)
    local execution = schedule_state.running_tests[execution_id]
    if not execution then
        return false
    end
    
    execution.end_time = os.clock()
    execution.error_message = tostring(error_message)
    execution.retry_count = execution.retry_count + 1
    
    -- Check if we should retry
    if execution.retry_count <= execution.max_retries then
        execution.status = "retrying"
        print("🔄 Retrying failed execution: " .. execution_id .. " (attempt " .. execution.retry_count .. ")")
        
        -- Re-queue the execution
        schedule_state.running_tests[execution_id] = nil
        TestScheduler.insertIntoQueue(execution)
    else
        execution.status = "failed"
        schedule_state.running_tests[execution_id] = nil
        schedule_state.failed_executions[execution_id] = execution
        
        print("❌ Execution failed permanently: " .. execution_id)
        print("   Error: " .. execution.error_message)
        
        -- Send failure notifications
        TestScheduler.sendNotifications(execution)
    end
    
    return true
end

function TestScheduler.cancelExecution(execution_id)
    local execution = schedule_state.running_tests[execution_id] or 
                     TestScheduler.findInQueue(execution_id)
    
    if not execution then
        return false
    end
    
    execution.status = "cancelled"
    execution.end_time = os.clock()
    
    -- Remove from running tests or queue
    schedule_state.running_tests[execution_id] = nil
    TestScheduler.removeFromQueue(execution_id)
    
    print("🚫 Execution cancelled: " .. execution_id)
    return true
end

-- Recurring schedule management
function TestScheduler.scheduleNextRecurrence(schedule_id)
    local schedule = schedule_state.active_schedules[schedule_id]
    if not schedule or not schedule.interval then
        return false
    end
    
    schedule.next_execution = os.clock() + schedule.interval
    print("🔄 Next recurrence scheduled for: " .. schedule.name .. " in " .. 
          string.format("%.1f seconds", schedule.interval))
    
    return true
end

-- Condition evaluation
function TestScheduler.evaluateCondition(condition)
    if condition.type == "time_window" then
        local current_time = os.date("*t")
        local current_hour = current_time.hour
        return current_hour >= condition.start_hour and current_hour < condition.end_hour
        
    elseif condition.type == "day_of_week" then
        local current_time = os.date("*t")
        local current_day = current_time.wday -- 1=Sunday, 7=Saturday
        return condition.allowed_days[current_day] == true
        
    elseif condition.type == "custom" then
        if condition.evaluator and type(condition.evaluator) == "function" then
            return condition.evaluator()
        end
        
    elseif condition.type == "file_exists" then
        local file = io.open(condition.file_path, "r")
        if file then
            file:close()
            return true
        end
        return false
        
    elseif condition.type == "environment" then
        local env_var = os.getenv(condition.variable)
        return env_var == condition.expected_value
    end
    
    return true -- Default to true for unknown conditions
end

-- Notification system
function TestScheduler.sendNotifications(execution)
    local schedule = schedule_state.active_schedules[execution.schedule_id]
    if not schedule or not schedule.notifications or #schedule.notifications == 0 then
        return
    end
    
    for _, notification in ipairs(schedule.notifications) do
        if TestScheduler.shouldSendNotification(notification, execution) then
            TestScheduler.sendNotification(notification, execution)
        end
    end
end

function TestScheduler.shouldSendNotification(notification, execution)
    if notification.on_success and execution.status == "completed" and execution.results.overall_success then
        return true
    end
    
    if notification.on_failure and (execution.status == "failed" or 
       (execution.status == "completed" and not execution.results.overall_success)) then
        return true
    end
    
    if notification.on_retry and execution.status == "retrying" then
        return true
    end
    
    return false
end

function TestScheduler.sendNotification(notification, execution)
    if notification.type == "console" then
        local message = TestScheduler.formatNotificationMessage(notification.template, execution)
        print("📢 " .. message)
        
    elseif notification.type == "log" then
        local message = TestScheduler.formatNotificationMessage(notification.template, execution)
        TestScheduler.writeToLog(notification.log_file or "test-scheduler.log", message)
        
    elseif notification.type == "webhook" then
        -- In a real implementation, this would make HTTP requests
        print("🌐 Webhook notification sent (simulated): " .. notification.url)
    end
end

function TestScheduler.formatNotificationMessage(template, execution)
    local message = template or "Execution {execution_id} completed with status: {status}"
    
    -- Replace placeholders
    message = message:gsub("{execution_id}", execution.id)
    message = message:gsub("{schedule_name}", execution.schedule_name)
    message = message:gsub("{status}", execution.status)
    message = message:gsub("{duration}", 
        execution.end_time and string.format("%.2fs", (execution.end_time - execution.start_time)) or "N/A")
    
    return message
end

function TestScheduler.writeToLog(log_file, message)
    local file = io.open(log_file, "a")
    if file then
        file:write(os.date("[%Y-%m-%d %H:%M:%S] ") .. message .. "\n")
        file:close()
    end
end

-- Queue management utilities
function TestScheduler.findInQueue(execution_id)
    for i, execution in ipairs(schedule_state.execution_queue) do
        if execution.id == execution_id then
            return execution, i
        end
    end
    return nil
end

function TestScheduler.removeFromQueue(execution_id)
    for i, execution in ipairs(schedule_state.execution_queue) do
        if execution.id == execution_id then
            table.remove(schedule_state.execution_queue, i)
            return true
        end
    end
    return false
end

-- Cleanup and maintenance
function TestScheduler.cleanupCompletedExecutions()
    local current_time = os.clock()
    local cleanup_before = current_time - scheduler_config.execution_cleanup_after / 1000
    local cleaned_count = 0
    
    -- Clean completed executions
    for execution_id, execution in pairs(schedule_state.completed_executions) do
        if execution.end_time < cleanup_before then
            schedule_state.completed_executions[execution_id] = nil
            cleaned_count = cleaned_count + 1
        end
    end
    
    -- Clean failed executions
    for execution_id, execution in pairs(schedule_state.failed_executions) do
        if execution.end_time < cleanup_before then
            schedule_state.failed_executions[execution_id] = nil
            cleaned_count = cleaned_count + 1
        end
    end
    
    if cleaned_count > 0 then
        print("🧹 Cleaned up " .. cleaned_count .. " old execution records")
    end
    
    return cleaned_count
end

-- Status and monitoring
function TestScheduler.getSchedulerStatus()
    return {
        active_schedules = #schedule_state.active_schedules,
        queued_executions = #schedule_state.execution_queue,
        running_executions = 0, -- Calculate this
        completed_executions = 0, -- Calculate this
        failed_executions = 0, -- Calculate this
        total_executions_processed = schedule_state.schedule_counter,
        uptime = os.clock() -- Simple uptime tracking
    }
end

function TestScheduler.getExecutionStatus(execution_id)
    -- Check running executions
    if schedule_state.running_tests[execution_id] then
        return schedule_state.running_tests[execution_id]
    end
    
    -- Check completed executions
    if schedule_state.completed_executions[execution_id] then
        return schedule_state.completed_executions[execution_id]
    end
    
    -- Check failed executions
    if schedule_state.failed_executions[execution_id] then
        return schedule_state.failed_executions[execution_id]
    end
    
    -- Check queued executions
    local queued_execution = TestScheduler.findInQueue(execution_id)
    if queued_execution then
        return queued_execution
    end
    
    return nil
end

function TestScheduler.listActiveSchedules()
    local schedules = {}
    for schedule_id, schedule in pairs(schedule_state.active_schedules) do
        schedules[schedule_id] = {
            id = schedule_id,
            name = schedule.name,
            enabled = schedule.enabled,
            schedule_type = schedule.schedule_type,
            execution_count = schedule.execution_count,
            next_execution = schedule.next_execution
        }
    end
    return schedules
end

-- Main scheduler loop (to be called periodically)
function TestScheduler.tick()
    -- Process execution queue
    local started = TestScheduler.processExecutionQueue()
    
    -- Check for recurring schedules that need to be executed
    local current_time = os.clock()
    for schedule_id, schedule in pairs(schedule_state.active_schedules) do
        if schedule.enabled and 
           schedule.schedule_type == scheduler_config.schedule_types.recurring and
           schedule.next_execution <= current_time then
            TestScheduler.scheduleExecution(schedule_id, {
                execution_type = "recurring",
                trigger = "scheduler_tick"
            })
        end
    end
    
    -- Periodic cleanup
    if math.random() < 0.01 then -- 1% chance per tick
        TestScheduler.cleanupCompletedExecutions()
    end
    
    return started
end

-- Configuration functions
function TestScheduler.configure(new_config)
    for k, v in pairs(new_config) do
        scheduler_config[k] = v
    end
end

function TestScheduler.getConfiguration()
    return scheduler_config
end

return TestScheduler