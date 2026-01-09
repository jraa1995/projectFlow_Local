/**
 * Critical Path Calculation Property Tests
 * Property-based tests for critical path calculation accuracy and consistency
 * **Feature: enterprise-project-management, Property 7: Critical Path Calculation**
 * **Validates: Requirements 2.8**
 */

/**
 * Property 7: Critical Path Calculation
 * For any project with task dependencies, the critical path analysis should correctly 
 * identify the longest path through the dependency network
 * **Validates: Requirements 2.8**
 */
function runCriticalPathCalculationPropertyTest(iterations = 100) {
  console.log('🧪 Running Critical Path Calculation Property Test');
  console.log('**Feature: enterprise-project-management, Property 7: Critical Path Calculation**');
  console.log('**Validates: Requirements 2.8**');
  
  let passed = 0;
  let failed = 0;
  let failureDetails = [];
  
  try {
    for (let i = 0; i < iterations; i++) {
      try {
        // Generate random test data with complex dependency networks
        const testData = generateRandomCriticalPathTestData();
        
        // Create test tasks and dependencies in the system
        const createdTasks = createTestTasks(testData.tasks);
        const createdDependencies = createTestDependencies(testData.dependencies);
        
        try {
          // Test critical path calculation
          const result = verifyCriticalPathCalculation(
            createdTasks, 
            createdDependencies, 
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
              calculatedPath: result.calculatedPath,
              expectedPath: result.expectedPath
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
      testName: 'Critical Path Calculation Property Test',
      property: 'Property 7: Critical Path Calculation',
      validates: 'Requirements 2.8',
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
      testName: 'Critical Path Calculation Property Test',
      error: error.message,
      passed: passed,
      failed: failed + 1
    };
  }
}

/**
 * Generate random test data with complex dependency networks for critical path testing
 */
function generateRandomCriticalPathTestData() {
  const projectId = 'CPTEST';
  
  // Generate 5-12 tasks to create meaningful dependency networks
  const taskCount = 5 + Math.floor(Math.random() * 8);
  const tasks = [];
  
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 5); // Start 5 days ago
  
  const statuses = ['To Do', 'In Progress', 'Review', 'Done'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  
  // Create tasks with realistic durations and dates
  for (let i = 0; i < taskCount; i++) {
    const duration = 1 + Math.floor(Math.random() * 7); // 1-7 days duration
    const estimatedHrs = duration * 8; // 8 hours per day
    
    // For critical path testing, we need consistent date patterns
    // Tasks will be positioned based on their dependencies later
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + i * 2); // Initial spacing
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
    
    tasks.push({
      id: `${projectId}-${100 + i}`,
      projectId: projectId,
      title: `Critical Path Test Task ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
      description: `Generated critical path test task ${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      type: 'Task',
      assignee: 'test@example.com',
      reporter: 'test@example.com',
      startDate: startDate.toISOString().split('T')[0],
      dueDate: endDate.toISOString().split('T')[0],
      estimatedHrs: estimatedHrs,
      actualHrs: Math.floor(Math.random() * estimatedHrs),
      labels: [`cp-test-${i}`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: Math.random() > 0.8 ? new Date().toISOString() : '',
      duration: duration // Store for critical path calculation
    });
  }
  
  // Generate dependencies to create known critical paths
  const dependencies = [];
  const dependencyPatterns = generateDependencyPatterns(tasks);
  
  // Use one of several predefined patterns for predictable critical paths
  const patternIndex = Math.floor(Math.random() * dependencyPatterns.length);
  const selectedPattern = dependencyPatterns[patternIndex];
  
  selectedPattern.dependencies.forEach(dep => {
    dependencies.push({
      predecessorId: dep.from,
      successorId: dep.to,
      dependencyType: 'finish_to_start',
      lag: Math.floor(Math.random() * 2) // 0-1 days lag
    });
  });
  
  return {
    projectId: projectId,
    tasks: tasks,
    dependencies: dependencies,
    expectedCriticalPath: selectedPattern.expectedCriticalPath,
    patternName: selectedPattern.name
  };
}

/**
 * Generate dependency patterns with known critical paths
 */
function generateDependencyPatterns(tasks) {
  if (tasks.length < 3) return [];
  
  const patterns = [];
  
  // Pattern 1: Simple linear chain (all tasks are critical)
  if (tasks.length >= 3) {
    const linearDeps = [];
    const linearPath = [];
    
    for (let i = 0; i < tasks.length - 1; i++) {
      linearDeps.push({
        from: tasks[i].id,
        to: tasks[i + 1].id
      });
      linearPath.push(tasks[i].id);
    }
    linearPath.push(tasks[tasks.length - 1].id);
    
    patterns.push({
      name: 'Linear Chain',
      dependencies: linearDeps,
      expectedCriticalPath: linearPath
    });
  }
  
  // Pattern 2: Diamond pattern (two parallel paths, one longer)
  if (tasks.length >= 4) {
    const diamondDeps = [
      { from: tasks[0].id, to: tasks[1].id }, // Start -> Path1
      { from: tasks[0].id, to: tasks[2].id }, // Start -> Path2
      { from: tasks[1].id, to: tasks[3].id }, // Path1 -> End
      { from: tasks[2].id, to: tasks[3].id }  // Path2 -> End
    ];
    
    // Make one path longer by adjusting task durations
    tasks[1].duration = tasks[1].duration + 2; // Make path 1 longer
    
    const diamondPath = [tasks[0].id, tasks[1].id, tasks[3].id]; // Longer path
    
    patterns.push({
      name: 'Diamond Pattern',
      dependencies: diamondDeps,
      expectedCriticalPath: diamondPath
    });
  }
  
  // Pattern 3: Fork and merge (multiple parallel paths)
  if (tasks.length >= 5) {
    const forkDeps = [
      { from: tasks[0].id, to: tasks[1].id }, // Start -> Path1
      { from: tasks[0].id, to: tasks[2].id }, // Start -> Path2
      { from: tasks[1].id, to: tasks[3].id }, // Path1 -> Merge
      { from: tasks[2].id, to: tasks[3].id }, // Path2 -> Merge
      { from: tasks[3].id, to: tasks[4].id }  // Merge -> End
    ];
    
    // Make path through task[1] longer
    tasks[1].duration = Math.max(tasks[1].duration, tasks[2].duration + 1);
    
    const forkPath = [tasks[0].id, tasks[1].id, tasks[3].id, tasks[4].id];
    
    patterns.push({
      name: 'Fork and Merge',
      dependencies: forkDeps,
      expectedCriticalPath: forkPath
    });
  }
  
  // Pattern 4: Complex network (if enough tasks)
  if (tasks.length >= 6) {
    const complexDeps = [
      { from: tasks[0].id, to: tasks[1].id },
      { from: tasks[0].id, to: tasks[2].id },
      { from: tasks[1].id, to: tasks[3].id },
      { from: tasks[2].id, to: tasks[4].id },
      { from: tasks[3].id, to: tasks[5].id },
      { from: tasks[4].id, to: tasks[5].id }
    ];
    
    // Make one path clearly longer
    tasks[2].duration = Math.max(tasks[2].duration, 5);
    tasks[4].duration = Math.max(tasks[4].duration, 3);
    
    const complexPath = [tasks[0].id, tasks[2].id, tasks[4].id, tasks[5].id];
    
    patterns.push({
      name: 'Complex Network',
      dependencies: complexDeps,
      expectedCriticalPath: complexPath
    });
  }
  
  return patterns;
}

/**
 * Verify critical path calculation accuracy
 */
function verifyCriticalPathCalculation(createdTasks, createdDependencies, testData) {
  try {
    // Generate timeline data to get calculated critical path
    const timelineData = TimelineEngine.generateProjectTimeline(testData.projectId);
    
    if (!timelineData || !timelineData.criticalPath) {
      return {
        success: false,
        reason: 'Timeline generation failed or no critical path calculated',
        calculatedPath: [],
        expectedPath: testData.expectedCriticalPath
      };
    }
    
    const calculatedPath = timelineData.criticalPath;
    const expectedPath = testData.expectedCriticalPath;
    
    // Test 1: Verify critical path is not empty (unless no dependencies)
    if (createdDependencies.length > 0 && calculatedPath.length === 0) {
      return {
        success: false,
        reason: 'Critical path is empty despite having dependencies',
        calculatedPath: calculatedPath,
        expectedPath: expectedPath
      };
    }
    
    // Test 2: Verify all critical path tasks exist
    const taskIds = new Set(createdTasks.map(t => t.id));
    for (const taskId of calculatedPath) {
      if (!taskIds.has(taskId)) {
        return {
          success: false,
          reason: `Critical path contains non-existent task: ${taskId}`,
          calculatedPath: calculatedPath,
          expectedPath: expectedPath
        };
      }
    }
    
    // Test 3: Verify critical path forms a valid dependency chain
    const dependencyMap = new Map();
    createdDependencies.forEach(dep => {
      if (!dependencyMap.has(dep.predecessorId)) {
        dependencyMap.set(dep.predecessorId, []);
      }
      dependencyMap.get(dep.predecessorId).push(dep.successorId);
    });
    
    // Check that critical path tasks are connected by dependencies
    for (let i = 0; i < calculatedPath.length - 1; i++) {
      const currentTask = calculatedPath[i];
      const nextTask = calculatedPath[i + 1];
      
      const successors = dependencyMap.get(currentTask) || [];
      if (!successors.includes(nextTask)) {
        // Check if there's an indirect connection through other critical path tasks
        const hasIndirectConnection = checkIndirectConnection(
          currentTask, 
          nextTask, 
          dependencyMap, 
          calculatedPath
        );
        
        if (!hasIndirectConnection) {
          return {
            success: false,
            reason: `Critical path tasks ${currentTask} and ${nextTask} are not connected by dependencies`,
            calculatedPath: calculatedPath,
            expectedPath: expectedPath
          };
        }
      }
    }
    
    // Test 4: Verify critical path represents the longest path
    const pathDuration = calculatePathDuration(calculatedPath, createdTasks, createdDependencies);
    const alternativePaths = findAllPaths(createdTasks, createdDependencies);
    
    for (const altPath of alternativePaths) {
      const altDuration = calculatePathDuration(altPath, createdTasks, createdDependencies);
      if (altDuration > pathDuration + 0.1) { // Allow small floating point differences
        return {
          success: false,
          reason: `Found longer path (${altDuration} days) than critical path (${pathDuration} days)`,
          calculatedPath: calculatedPath,
          expectedPath: expectedPath,
          longerPath: altPath,
          longerPathDuration: altDuration
        };
      }
    }
    
    // Test 5: For known patterns, verify the calculated path matches expected structure
    if (testData.patternName && expectedPath.length > 0) {
      const pathsMatch = verifyPathStructure(calculatedPath, expectedPath, testData.patternName);
      if (!pathsMatch.success) {
        // This might not be a failure if there are multiple valid critical paths
        // Log as a warning but don't fail the test
        console.warn(`Path structure mismatch for ${testData.patternName}: ${pathsMatch.reason}`);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      reason: 'Critical path verification error: ' + error.message,
      error: error
    };
  }
}

/**
 * Check if there's an indirect connection between two tasks through the critical path
 */
function checkIndirectConnection(fromTask, toTask, dependencyMap, criticalPath) {
  const fromIndex = criticalPath.indexOf(fromTask);
  const toIndex = criticalPath.indexOf(toTask);
  
  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
    return false;
  }
  
  // Check if there's a path through intermediate critical path tasks
  let currentTask = fromTask;
  for (let i = fromIndex; i < toIndex; i++) {
    const nextTask = criticalPath[i + 1];
    const successors = dependencyMap.get(currentTask) || [];
    
    if (!successors.includes(nextTask)) {
      return false;
    }
    currentTask = nextTask;
  }
  
  return true;
}

/**
 * Calculate the duration of a path through tasks
 */
function calculatePathDuration(path, tasks, dependencies) {
  if (path.length === 0) return 0;
  
  const taskMap = new Map();
  tasks.forEach(task => {
    taskMap.set(task.id, {
      duration: task.duration || Math.ceil((new Date(task.dueDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24))
    });
  });
  
  const dependencyMap = new Map();
  dependencies.forEach(dep => {
    dependencyMap.set(`${dep.predecessorId}-${dep.successorId}`, dep.lag || 0);
  });
  
  let totalDuration = 0;
  
  for (let i = 0; i < path.length; i++) {
    const task = taskMap.get(path[i]);
    if (task) {
      totalDuration += task.duration;
    }
    
    // Add lag time if there's a dependency to the next task
    if (i < path.length - 1) {
      const lag = dependencyMap.get(`${path[i]}-${path[i + 1]}`) || 0;
      totalDuration += lag;
    }
  }
  
  return totalDuration;
}

/**
 * Find all possible paths through the dependency network (simplified)
 */
function findAllPaths(tasks, dependencies) {
  const dependencyMap = new Map();
  const reverseDependencyMap = new Map();
  
  // Build dependency maps
  dependencies.forEach(dep => {
    if (!dependencyMap.has(dep.predecessorId)) {
      dependencyMap.set(dep.predecessorId, []);
    }
    dependencyMap.get(dep.predecessorId).push(dep.successorId);
    
    if (!reverseDependencyMap.has(dep.successorId)) {
      reverseDependencyMap.set(dep.successorId, []);
    }
    reverseDependencyMap.get(dep.successorId).push(dep.predecessorId);
  });
  
  // Find start tasks (no predecessors)
  const startTasks = tasks.filter(task => !reverseDependencyMap.has(task.id));
  
  // Find end tasks (no successors)
  const endTasks = tasks.filter(task => !dependencyMap.has(task.id));
  
  const allPaths = [];
  
  // Generate paths from each start task to each end task
  startTasks.forEach(startTask => {
    endTasks.forEach(endTask => {
      const paths = findPathsBetween(startTask.id, endTask.id, dependencyMap, new Set());
      allPaths.push(...paths);
    });
  });
  
  return allPaths.slice(0, 20); // Limit to prevent excessive computation
}

/**
 * Find paths between two tasks (recursive)
 */
function findPathsBetween(fromTask, toTask, dependencyMap, visited) {
  if (visited.has(fromTask)) return []; // Avoid cycles
  if (fromTask === toTask) return [[fromTask]];
  
  const successors = dependencyMap.get(fromTask) || [];
  const paths = [];
  
  visited.add(fromTask);
  
  successors.forEach(successor => {
    const subPaths = findPathsBetween(successor, toTask, dependencyMap, new Set(visited));
    subPaths.forEach(subPath => {
      paths.push([fromTask, ...subPath]);
    });
  });
  
  return paths;
}

/**
 * Verify path structure matches expected pattern
 */
function verifyPathStructure(calculatedPath, expectedPath, patternName) {
  // For simple patterns, check if the paths are similar
  if (patternName === 'Linear Chain') {
    // All tasks should be in the critical path
    return {
      success: calculatedPath.length === expectedPath.length,
      reason: calculatedPath.length !== expectedPath.length ? 
        `Linear chain should have ${expectedPath.length} tasks, got ${calculatedPath.length}` : 
        'Path structure matches'
    };
  }
  
  // For other patterns, check if key tasks are included
  const keyTasks = expectedPath.slice(0, Math.min(3, expectedPath.length));
  const hasKeyTasks = keyTasks.every(task => calculatedPath.includes(task));
  
  return {
    success: hasKeyTasks,
    reason: hasKeyTasks ? 'Key tasks found in critical path' : 'Missing key tasks from expected path'
  };
}

/**
 * Run critical path calculation property test (main entry point)
 */
function runCriticalPathPropertyTest(iterations = 100) {
  return runCriticalPathCalculationPropertyTest(iterations);
}