/**
 * Timeline Filtering Property Tests
 * Property-based tests for timeline filtering accuracy and search functionality
 * **Feature: enterprise-project-management, Property 5: Timeline Filtering Accuracy**
 * **Validates: Requirements 2.6**
 */

/**
 * Property 5: Timeline Filtering Accuracy
 * For any timeline or Gantt chart filter (project, assignee, date range), only tasks 
 * matching the filter criteria should be included in the results
 * **Validates: Requirements 2.6**
 */
function runTimelineFilteringAccuracyPropertyTest(iterations = 100) {
  console.log('🧪 Running Timeline Filtering Accuracy Property Test');
  console.log('**Feature: enterprise-project-management, Property 5: Timeline Filtering Accuracy**');
  console.log('**Validates: Requirements 2.6**');
  
  let passed = 0;
  let failed = 0;
  let failureDetails = [];
  
  try {
    for (let i = 0; i < iterations; i++) {
      try {
        // Generate random test data with diverse properties for filtering
        const testData = generateRandomFilteringTestData();
        
        // Create test tasks in the system
        const createdTasks = createTestTasks(testData.tasks);
        
        try {
          // Test various filter combinations
          const filterTests = generateFilterTestCases(testData);
          
          let iterationPassed = true;
          let iterationFailures = [];
          
          for (const filterTest of filterTests) {
            const result = verifyFilteringAccuracy(createdTasks, filterTest, testData);
            
            if (!result.success) {
              iterationPassed = false;
              iterationFailures.push({
                filterTest: filterTest,
                reason: result.reason,
                expected: result.expected,
                actual: result.actual
              });
            }
          }
          
          if (iterationPassed) {
            passed++;
          } else {
            failed++;
            failureDetails.push({
              iteration: i + 1,
              reason: `Filter accuracy failures: ${iterationFailures.length}`,
              failures: iterationFailures.slice(0, 3) // Limit details
            });
          }
          
        } finally {
          // Clean up test data
          cleanupTestTasks(createdTasks);
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
      testName: 'Timeline Filtering Accuracy Property Test',
      property: 'Property 5: Timeline Filtering Accuracy',
      validates: 'Requirements 2.6',
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
      testName: 'Timeline Filtering Accuracy Property Test',
      error: error.message,
      passed: passed,
      failed: failed + 1
    };
  }
}

/**
 * Generate random test data with diverse properties for filtering tests
 */
function generateRandomFilteringTestData() {
  const projectIds = ['FILTER1', 'FILTER2', 'FILTER3'];
  const assignees = ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com'];
  const statuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Done'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const types = ['Task', 'Bug', 'Feature', 'Story'];
  const labels = ['frontend', 'backend', 'api', 'ui', 'database', 'testing'];
  
  // Generate 10-20 tasks with diverse properties
  const taskCount = 10 + Math.floor(Math.random() * 11);
  const tasks = [];
  
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 60); // Start 60 days ago
  
  for (let i = 0; i < taskCount; i++) {
    const startOffset = Math.floor(Math.random() * 120); // 0-120 days from base
    const duration = 1 + Math.floor(Math.random() * 14); // 1-14 days duration
    
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + startOffset);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
    
    const estimatedHrs = 4 + Math.floor(Math.random() * 32); // 4-36 hours
    const actualHrs = Math.floor(Math.random() * estimatedHrs);
    
    // Randomly assign properties to ensure good distribution
    const projectId = projectIds[Math.floor(Math.random() * projectIds.length)];
    const assignee = Math.random() > 0.1 ? assignees[Math.floor(Math.random() * assignees.length)] : ''; // 10% unassigned
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Random labels (0-3 labels per task)
    const taskLabels = [];
    const labelCount = Math.floor(Math.random() * 4);
    for (let j = 0; j < labelCount; j++) {
      const label = labels[Math.floor(Math.random() * labels.length)];
      if (!taskLabels.includes(label)) {
        taskLabels.push(label);
      }
    }
    
    tasks.push({
      id: `${projectId}-${100 + i}`,
      projectId: projectId,
      title: `Filter Test Task ${i + 1} ${type}`,
      description: `Generated filtering test task ${i + 1} for ${projectId}`,
      status: status,
      priority: priority,
      type: type,
      assignee: assignee,
      reporter: 'test@example.com',
      startDate: startDate.toISOString().split('T')[0],
      dueDate: endDate.toISOString().split('T')[0],
      estimatedHrs: estimatedHrs,
      actualHrs: actualHrs,
      labels: taskLabels,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: status === 'Done' ? new Date().toISOString() : ''
    });
  }
  
  return {
    tasks: tasks,
    projectIds: projectIds,
    assignees: assignees,
    statuses: statuses,
    priorities: priorities,
    types: types,
    labels: labels
  };
}

/**
 * Generate filter test cases
 */
function generateFilterTestCases(testData) {
  const testCases = [];
  
  // Test single filters
  
  // Project filter tests
  testData.projectIds.forEach(projectId => {
    testCases.push({
      name: `Project filter: ${projectId}`,
      filters: { projectId: projectId },
      expectedCount: testData.tasks.filter(t => t.projectId === projectId).length
    });
  });
  
  // Assignee filter tests
  testData.assignees.forEach(assignee => {
    testCases.push({
      name: `Assignee filter: ${assignee}`,
      filters: { assignee: assignee },
      expectedCount: testData.tasks.filter(t => t.assignee === assignee).length
    });
  });
  
  // Status filter tests
  testData.statuses.forEach(status => {
    testCases.push({
      name: `Status filter: ${status}`,
      filters: { status: status },
      expectedCount: testData.tasks.filter(t => t.status === status).length
    });
  });
  
  // Priority filter tests
  testData.priorities.forEach(priority => {
    testCases.push({
      name: `Priority filter: ${priority}`,
      filters: { priority: priority },
      expectedCount: testData.tasks.filter(t => t.priority === priority).length
    });
  });
  
  // Search filter tests
  const searchTerms = ['Task', 'Bug', 'Feature', 'test', '100'];
  searchTerms.forEach(term => {
    const expectedCount = testData.tasks.filter(t => 
      t.title.toLowerCase().includes(term.toLowerCase()) ||
      t.id.toLowerCase().includes(term.toLowerCase()) ||
      (t.assignee && t.assignee.toLowerCase().includes(term.toLowerCase()))
    ).length;
    
    testCases.push({
      name: `Search filter: ${term}`,
      filters: { search: term },
      expectedCount: expectedCount
    });
  });
  
  // Overdue filter test
  const now = new Date();
  const overdueCount = testData.tasks.filter(t => 
    new Date(t.dueDate) < now && t.status !== 'Done'
  ).length;
  
  testCases.push({
    name: 'Overdue filter',
    filters: { showOverdueOnly: true },
    expectedCount: overdueCount
  });
  
  // Date range filter tests
  const midDate = new Date();
  midDate.setDate(midDate.getDate() - 30);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  
  const dateRangeCount = testData.tasks.filter(t => {
    const taskStart = new Date(t.startDate);
    const taskEnd = new Date(t.dueDate);
    return (taskStart >= midDate && taskStart <= endDate) ||
           (taskEnd >= midDate && taskEnd <= endDate) ||
           (taskStart <= midDate && taskEnd >= endDate);
  }).length;
  
  testCases.push({
    name: 'Date range filter',
    filters: { 
      dateRange: { 
        start: midDate, 
        end: endDate 
      } 
    },
    expectedCount: dateRangeCount
  });
  
  // Combined filter tests (randomly select 3-5 combinations)
  const combinationCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < combinationCount; i++) {
    const combinedFilters = {};
    let expectedTasks = [...testData.tasks];
    
    // Randomly add 2-3 filters
    const filterCount = 2 + Math.floor(Math.random() * 2);
    const availableFilters = ['projectId', 'assignee', 'status', 'priority'];
    
    for (let j = 0; j < filterCount && availableFilters.length > 0; j++) {
      const filterIndex = Math.floor(Math.random() * availableFilters.length);
      const filterType = availableFilters.splice(filterIndex, 1)[0];
      
      switch (filterType) {
        case 'projectId':
          const projectId = testData.projectIds[Math.floor(Math.random() * testData.projectIds.length)];
          combinedFilters.projectId = projectId;
          expectedTasks = expectedTasks.filter(t => t.projectId === projectId);
          break;
          
        case 'assignee':
          const assignee = testData.assignees[Math.floor(Math.random() * testData.assignees.length)];
          combinedFilters.assignee = assignee;
          expectedTasks = expectedTasks.filter(t => t.assignee === assignee);
          break;
          
        case 'status':
          const status = testData.statuses[Math.floor(Math.random() * testData.statuses.length)];
          combinedFilters.status = status;
          expectedTasks = expectedTasks.filter(t => t.status === status);
          break;
          
        case 'priority':
          const priority = testData.priorities[Math.floor(Math.random() * testData.priorities.length)];
          combinedFilters.priority = priority;
          expectedTasks = expectedTasks.filter(t => t.priority === priority);
          break;
      }
    }
    
    testCases.push({
      name: `Combined filters: ${Object.keys(combinedFilters).join(', ')}`,
      filters: combinedFilters,
      expectedCount: expectedTasks.length
    });
  }
  
  return testCases;
}

/**
 * Verify filtering accuracy for a specific filter test case
 */
function verifyFilteringAccuracy(createdTasks, filterTest, testData) {
  try {
    // Apply the filter using the server-side filtering function
    const filteredData = getFilteredTimelineData(
      filterTest.filters.projectId || null, 
      filterTest.filters
    );
    
    // Verify the result count matches expected
    if (filteredData.tasks.length !== filterTest.expectedCount) {
      return {
        success: false,
        reason: `${filterTest.name}: Expected ${filterTest.expectedCount} tasks, got ${filteredData.tasks.length}`,
        expected: filterTest.expectedCount,
        actual: filteredData.tasks.length,
        filterTest: filterTest
      };
    }
    
    // Verify each returned task matches the filter criteria
    for (const task of filteredData.tasks) {
      const matchResult = verifyTaskMatchesFilters(task, filterTest.filters);
      if (!matchResult.success) {
        return {
          success: false,
          reason: `${filterTest.name}: Task ${task.id} doesn't match filter criteria: ${matchResult.reason}`,
          task: task,
          filterTest: filterTest
        };
      }
    }
    
    // Verify no matching tasks were excluded
    const allTasks = createdTasks;
    for (const task of allTasks) {
      const shouldBeIncluded = verifyTaskMatchesFilters(task, filterTest.filters);
      const isIncluded = filteredData.tasks.some(ft => ft.id === task.id);
      
      if (shouldBeIncluded.success && !isIncluded) {
        return {
          success: false,
          reason: `${filterTest.name}: Task ${task.id} should be included but was excluded`,
          task: task,
          filterTest: filterTest
        };
      }
      
      if (!shouldBeIncluded.success && isIncluded) {
        return {
          success: false,
          reason: `${filterTest.name}: Task ${task.id} should be excluded but was included`,
          task: task,
          filterTest: filterTest
        };
      }
    }
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      reason: `Filter verification error: ${error.message}`,
      error: error
    };
  }
}

/**
 * Verify that a task matches the given filter criteria
 */
function verifyTaskMatchesFilters(task, filters) {
  try {
    // Project filter
    if (filters.projectId && task.projectId !== filters.projectId) {
      return { success: false, reason: `Project mismatch: expected ${filters.projectId}, got ${task.projectId}` };
    }
    
    // Assignee filter
    if (filters.assignee && task.assignee !== filters.assignee) {
      return { success: false, reason: `Assignee mismatch: expected ${filters.assignee}, got ${task.assignee}` };
    }
    
    // Status filter
    if (filters.status && task.status !== filters.status) {
      return { success: false, reason: `Status mismatch: expected ${filters.status}, got ${task.status}` };
    }
    
    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return { success: false, reason: `Priority mismatch: expected ${filters.priority}, got ${task.priority}` };
    }
    
    // Type filter
    if (filters.type && task.type !== filters.type) {
      return { success: false, reason: `Type mismatch: expected ${filters.type}, got ${task.type}` };
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        task.name.toLowerCase().includes(searchTerm) ||
        task.id.toLowerCase().includes(searchTerm) ||
        (task.assignee && task.assignee.toLowerCase().includes(searchTerm)) ||
        (task.labels && task.labels.some(label => label.toLowerCase().includes(searchTerm)));
      
      if (!matchesSearch) {
        return { success: false, reason: `Search mismatch: task doesn't contain "${filters.search}"` };
      }
    }
    
    // Overdue filter
    if (filters.showOverdueOnly) {
      const now = new Date();
      const taskEnd = task.end || new Date(task.dueDate);
      const isOverdue = taskEnd < now && task.status !== 'Done';
      
      if (!isOverdue) {
        return { success: false, reason: 'Task is not overdue but overdue filter is active' };
      }
    }
    
    // Date range filter
    if (filters.dateRange) {
      const taskStart = task.start || new Date(task.startDate);
      const taskEnd = task.end || new Date(task.dueDate);
      
      const overlaps = 
        (taskStart >= filters.dateRange.start && taskStart <= filters.dateRange.end) ||
        (taskEnd >= filters.dateRange.start && taskEnd <= filters.dateRange.end) ||
        (taskStart <= filters.dateRange.start && taskEnd >= filters.dateRange.end);
      
      if (!overlaps) {
        return { success: false, reason: 'Task dates do not overlap with filter date range' };
      }
    }
    
    return { success: true };
    
  } catch (error) {
    return { success: false, reason: `Filter matching error: ${error.message}` };
  }
}

/**
 * Run timeline filtering accuracy property test (main entry point)
 */
function runTimelineFilteringPropertyTest(iterations = 100) {
  return runTimelineFilteringAccuracyPropertyTest(iterations);
}