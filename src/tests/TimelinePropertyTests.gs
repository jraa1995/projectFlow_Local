/**
 * Timeline Property Tests
 * Property-based tests for timeline data generation and completeness
 * **Feature: enterprise-project-management, Property 3: Timeline Data Completeness**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */

/**
 * Property 3: Timeline Data Completeness
 * For any project timeline generation, all tasks should be included in chronological order 
 * with complete date, progress, and dependency information
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */
function runTimelineDataCompletenessPropertyTest(iterations = 100) {
  console.log('🧪 Running Timeline Data Completeness Property Test');
  console.log('**Feature: enterprise-project-management, Property 3: Timeline Data Completeness**');
  console.log('**Validates: Requirements 2.1, 2.2, 2.3, 2.4**');
  
  let passed = 0;
  let failed = 0;
  let failureDetails = [];
  
  try {
    for (let i = 0; i < iterations; i++) {
      try {
        // Generate random test data
        const testData = generateRandomTimelineTestData();
        
        // Create test tasks in the system
        const createdTasks = createTestTasks(testData.tasks);
        const createdDependencies = createTestDependencies(testData.dependencies);
        
        try {
          // Generate timeline data
          const timelineData = TimelineEngine.generateProjectTimeline(
            testData.projectId, 
            testData.dateRange
          );
          
          // Verify timeline data completeness
          const result = verifyTimelineDataCompleteness(
            createdTasks, 
            timelineData, 
            testData
          );
          
          if (result.success) {
            passed++;
          } else {
            failed++;
            failureDetails.push({
              iteration: i + 1,
              reason: result.reason,
              testData: testData,
              timelineData: timelineData
            });
          }
          
        } finally {
          // Clean up test data
          cleanupTestTasks(createdTasks);
          cleanupTestDependencies(createdDependencies);
        }
        
      } catch (error) {
        failed++;
        failureDetails.push({
          iteration: i + 1,
          reason: 'Exception: ' + error.message,
          error: error
        });
      }
    }
    
    const result = {
      testName: 'Timeline Data Completeness Property Test',
      property: 'Property 3: Timeline Data Completeness',
      validates: 'Requirements 2.1, 2.2, 2.3, 2.4',
      iterations: iterations,
      passed: passed,
      failed: failed,
      successRate: (passed / iterations * 100).toFixed(2) + '%',
      failures: failureDetails.slice(0, 5) // Limit failure details
    };
    
    console.log(`✅ Passed: ${passed}/${iterations} (${result.successRate})`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}/${iterations}`);
      console.log('First failure:', failureDetails[0]);
    }
    
    return result;
    
  } catch (error) {
    console.error('Property test framework error:', error);
    return {
      testName: 'Timeline Data Completeness Property Test',
      error: error.message,
      passed: passed,
      failed: failed + 1
    };
  }
}

/**
 * Generate random test data for timeline testing
 */
function generateRandomTimelineTestData() {
  const projectIds = ['TEST', 'DEMO', 'PROJ'];
  const projectId = projectIds[Math.floor(Math.random() * projectIds.length)];
  
  // Generate 3-10 random tasks
  const taskCount = 3 + Math.floor(Math.random() * 8);
  const tasks = [];
  
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30); // Start 30 days ago
  
  for (let i = 0; i < taskCount; i++) {
    const startOffset = Math.floor(Math.random() * 60); // 0-60 days from base
    const duration = 1 + Math.floor(Math.random() * 14); // 1-14 days duration
    
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + startOffset);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
    
    const estimatedHrs = 8 + Math.floor(Math.random() * 32); // 8-40 hours
    const actualHrs = Math.floor(Math.random() * estimatedHrs);
    
    const statuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Done'];
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const types = ['Task', 'Bug', 'Feature', 'Story'];
    
    tasks.push({
      id: `${projectId}-${100 + i}`,
      projectId: projectId,
      title: `Test Task ${i + 1}`,
      description: `Generated test task ${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      type: types[Math.floor(Math.random() * types.length)],
      assignee: 'test@example.com',
      reporter: 'test@example.com',
      startDate: startDate.toISOString().split('T')[0],
      dueDate: endDate.toISOString().split('T')[0],
      estimatedHrs: estimatedHrs,
      actualHrs: actualHrs,
      labels: [`label${i % 3}`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: Math.random() > 0.7 ? new Date().toISOString() : ''
    });
  }
  
  // Generate some random dependencies (20% chance between any two tasks)
  const dependencies = [];
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      if (Math.random() < 0.2) { // 20% chance
        dependencies.push({
          predecessorId: tasks[i].id,
          successorId: tasks[j].id,
          dependencyType: 'finish_to_start',
          lag: Math.floor(Math.random() * 3) // 0-2 days lag
        });
      }
    }
  }
  
  // Generate optional date range filter
  let dateRange = null;
  if (Math.random() < 0.3) { // 30% chance of date filter
    const filterStart = new Date(baseDate);
    filterStart.setDate(filterStart.getDate() + Math.floor(Math.random() * 30));
    const filterEnd = new Date(filterStart);
    filterEnd.setDate(filterEnd.getDate() + 30 + Math.floor(Math.random() * 30));
    
    dateRange = {
      start: filterStart,
      end: filterEnd
    };
  }
  
  return {
    projectId: Math.random() < 0.5 ? projectId : null, // 50% chance of project filter
    tasks: tasks,
    dependencies: dependencies,
    dateRange: dateRange
  };
}

/**
 * Create test tasks in the system
 */
function createTestTasks(tasks) {
  const createdTasks = [];
  
  tasks.forEach(taskData => {
    try {
      const task = createTask(taskData);
      createdTasks.push(task);
    } catch (error) {
      console.warn('Failed to create test task:', error.message);
    }
  });
  
  return createdTasks;
}

/**
 * Create test dependencies in the system
 */
function createTestDependencies(dependencies) {
  const createdDependencies = [];
  
  dependencies.forEach(depData => {
    try {
      const dependency = createTaskDependency(depData);
      createdDependencies.push(dependency);
    } catch (error) {
      console.warn('Failed to create test dependency:', error.message);
    }
  });
  
  return createdDependencies;
}

/**
 * Verify timeline data completeness
 */
function verifyTimelineDataCompleteness(originalTasks, timelineData, testData) {
  try {
    // Check that timeline data has required structure
    if (!timelineData || typeof timelineData !== 'object') {
      return { success: false, reason: 'Timeline data is not an object' };
    }
    
    const requiredFields = ['tasks', 'milestones', 'dependencies', 'criticalPath', 'dateRange'];
    for (const field of requiredFields) {
      if (!(field in timelineData)) {
        return { success: false, reason: `Missing required field: ${field}` };
      }
    }
    
    // Check that tasks array exists and is an array
    if (!Array.isArray(timelineData.tasks)) {
      return { success: false, reason: 'Timeline tasks is not an array' };
    }
    
    // Filter original tasks based on test criteria
    let expectedTasks = originalTasks;
    
    // Apply project filter if specified
    if (testData.projectId) {
      expectedTasks = expectedTasks.filter(task => task.projectId === testData.projectId);
    }
    
    // Apply date range filter if specified
    if (testData.dateRange) {
      expectedTasks = expectedTasks.filter(task => {
        const taskStart = task.startDate ? new Date(task.startDate) : null;
        const taskDue = task.dueDate ? new Date(task.dueDate) : null;
        
        if (taskStart && taskDue) {
          return (taskStart <= testData.dateRange.end && taskDue >= testData.dateRange.start);
        } else if (taskStart) {
          return taskStart >= testData.dateRange.start && taskStart <= testData.dateRange.end;
        } else if (taskDue) {
          return taskDue >= testData.dateRange.start && taskDue <= testData.dateRange.end;
        }
        return false;
      });
    }
    
    // Check that all expected tasks are included
    const timelineTaskIds = new Set(timelineData.tasks.map(t => t.id));
    const expectedTaskIds = new Set(expectedTasks.map(t => t.id));
    
    for (const expectedId of expectedTaskIds) {
      if (!timelineTaskIds.has(expectedId)) {
        return { 
          success: false, 
          reason: `Expected task ${expectedId} not found in timeline data` 
        };
      }
    }
    
    // Check that no unexpected tasks are included
    for (const timelineId of timelineTaskIds) {
      if (!expectedTaskIds.has(timelineId)) {
        return { 
          success: false, 
          reason: `Unexpected task ${timelineId} found in timeline data` 
        };
      }
    }
    
    // Verify each timeline task has complete data
    for (const task of timelineData.tasks) {
      // Check required fields
      const requiredTaskFields = ['id', 'name', 'start', 'end', 'progress'];
      for (const field of requiredTaskFields) {
        if (!(field in task)) {
          return { 
            success: false, 
            reason: `Task ${task.id} missing required field: ${field}` 
          };
        }
      }
      
      // Check that dates are valid Date objects
      if (!(task.start instanceof Date) || isNaN(task.start.getTime())) {
        return { 
          success: false, 
          reason: `Task ${task.id} has invalid start date` 
        };
      }
      
      if (!(task.end instanceof Date) || isNaN(task.end.getTime())) {
        return { 
          success: false, 
          reason: `Task ${task.id} has invalid end date` 
        };
      }
      
      // Check that start date is before or equal to end date
      if (task.start > task.end) {
        return { 
          success: false, 
          reason: `Task ${task.id} has start date after end date` 
        };
      }
      
      // Check that progress is a valid percentage
      if (typeof task.progress !== 'number' || task.progress < 0 || task.progress > 100) {
        return { 
          success: false, 
          reason: `Task ${task.id} has invalid progress: ${task.progress}` 
        };
      }
    }
    
    // Verify tasks are in chronological order (by start date)
    for (let i = 1; i < timelineData.tasks.length; i++) {
      const prevTask = timelineData.tasks[i - 1];
      const currentTask = timelineData.tasks[i];
      
      if (prevTask.start > currentTask.start) {
        return { 
          success: false, 
          reason: `Tasks not in chronological order: ${prevTask.id} starts after ${currentTask.id}` 
        };
      }
    }
    
    // Verify dependencies array structure
    if (!Array.isArray(timelineData.dependencies)) {
      return { success: false, reason: 'Dependencies is not an array' };
    }
    
    // Verify critical path array structure
    if (!Array.isArray(timelineData.criticalPath)) {
      return { success: false, reason: 'Critical path is not an array' };
    }
    
    // Verify date range structure
    if (!timelineData.dateRange || 
        !(timelineData.dateRange.start instanceof Date) ||
        !(timelineData.dateRange.end instanceof Date)) {
      return { success: false, reason: 'Invalid date range structure' };
    }
    
    return { success: true };
    
  } catch (error) {
    return { 
      success: false, 
      reason: 'Verification error: ' + error.message 
    };
  }
}

/**
 * Clean up test tasks
 */
function cleanupTestTasks(tasks) {
  tasks.forEach(task => {
    try {
      deleteTask(task.id);
    } catch (error) {
      console.warn('Failed to cleanup test task:', task.id, error.message);
    }
  });
}

/**
 * Clean up test dependencies
 */
function cleanupTestDependencies(dependencies) {
  dependencies.forEach(dependency => {
    try {
      deleteTaskDependency(dependency.id);
    } catch (error) {
      console.warn('Failed to cleanup test dependency:', dependency.id, error.message);
    }
  });
}

/**
 * Run timeline data completeness property test (main entry point)
 */
function runTimelinePropertyTest(iterations = 100) {
  return runTimelineDataCompletenessPropertyTest(iterations);
}