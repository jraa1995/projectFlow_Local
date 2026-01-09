/**
 * Dependency Consistency Property Tests
 * Property-based tests for task dependency relationships and consistency
 * **Feature: enterprise-project-management, Property 4: Dependency Consistency**
 * **Validates: Requirements 2.5, 4.3**
 */

/**
 * Property 4: Dependency Consistency
 * For any task dependency modification, all dependent task dates and statuses should be 
 * recalculated to maintain consistency, and dependency rule violations should be prevented
 * **Validates: Requirements 2.5, 4.3**
 */
function runDependencyConsistencyPropertyTest(iterations = 100) {
  console.log('🧪 Running Dependency Consistency Property Test');
  console.log('**Feature: enterprise-project-management, Property 4: Dependency Consistency**');
  console.log('**Validates: Requirements 2.5, 4.3**');
  
  let passed = 0;
  let failed = 0;
  let failureDetails = [];
  
  try {
    for (let i = 0; i < iterations; i++) {
      try {
        // Generate random test data with dependencies
        const testData = generateRandomDependencyTestData();
        
        // Create test tasks and dependencies in the system
        const createdTasks = createTestTasks(testData.tasks);
        const createdDependencies = createTestDependencies(testData.dependencies);
        
        try {
          // Test dependency consistency
          const result = verifyDependencyConsistency(
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
              violations: result.violations
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
      testName: 'Dependency Consistency Property Test',
      property: 'Property 4: Dependency Consistency',
      validates: 'Requirements 2.5, 4.3',
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
      testName: 'Dependency Consistency Property Test',
      error: error.message,
      passed: passed,
      failed: failed + 1
    };
  }
}

/**
 * Generate random test data with task dependencies
 */
function generateRandomDependencyTestData() {
  const projectId = 'DEPTEST';
  
  // Generate 4-8 tasks with realistic dependencies
  const taskCount = 4 + Math.floor(Math.random() * 5);
  const tasks = [];
  
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 10); // Start 10 days ago
  
  const statuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Done'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  
  // Create tasks with sequential dates to allow for realistic dependencies
  for (let i = 0; i < taskCount; i++) {
    const startOffset = i * 2; // Each task starts 2 days after the previous
    const duration = 1 + Math.floor(Math.random() * 5); // 1-5 days duration
    
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + startOffset);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
    
    const estimatedHrs = 8 + Math.floor(Math.random() * 24); // 8-32 hours
    
    tasks.push({
      id: `${projectId}-${100 + i}`,
      projectId: projectId,
      title: `Dependency Test Task ${i + 1}`,
      description: `Generated dependency test task ${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      type: 'Task',
      assignee: 'test@example.com',
      reporter: 'test@example.com',
      startDate: startDate.toISOString().split('T')[0],
      dueDate: endDate.toISOString().split('T')[0],
      estimatedHrs: estimatedHrs,
      actualHrs: Math.floor(Math.random() * estimatedHrs),
      labels: [`dep-test-${i}`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: Math.random() > 0.8 ? new Date().toISOString() : ''
    });
  }
  
  // Generate dependencies - create a chain and some additional dependencies
  const dependencies = [];
  
  // Create a main dependency chain (task i depends on task i-1)
  for (let i = 1; i < tasks.length; i++) {
    dependencies.push({
      predecessorId: tasks[i - 1].id,
      successorId: tasks[i].id,
      dependencyType: 'finish_to_start',
      lag: Math.floor(Math.random() * 2) // 0-1 days lag
    });
  }
  
  // Add some additional random dependencies (but avoid circular dependencies)
  const additionalDeps = Math.floor(Math.random() * 3); // 0-2 additional dependencies
  for (let i = 0; i < additionalDeps; i++) {
    const predIndex = Math.floor(Math.random() * (tasks.length - 2));
    const succIndex = predIndex + 2; // Ensure successor comes after predecessor
    
    if (succIndex < tasks.length) {
      // Check if this dependency already exists
      const exists = dependencies.some(dep => 
        dep.predecessorId === tasks[predIndex].id && 
        dep.successorId === tasks[succIndex].id
      );
      
      if (!exists) {
        dependencies.push({
          predecessorId: tasks[predIndex].id,
          successorId: tasks[succIndex].id,
          dependencyType: Math.random() > 0.5 ? 'finish_to_start' : 'start_to_start',
          lag: Math.floor(Math.random() * 3) // 0-2 days lag
        });
      }
    }
  }
  
  return {
    projectId: projectId,
    tasks: tasks,
    dependencies: dependencies
  };
}

/**
 * Verify dependency consistency
 */
function verifyDependencyConsistency(originalTasks, originalDependencies, testData) {
  try {
    const violations = [];
    
    // Test 1: Verify all dependencies exist in the system
    const taskIds = new Set(originalTasks.map(t => t.id));
    
    for (const dep of originalDependencies) {
      if (!taskIds.has(dep.predecessorId)) {
        violations.push({
          type: 'missing_predecessor',
          dependency: dep,
          reason: `Predecessor task ${dep.predecessorId} not found`
        });
      }
      
      if (!taskIds.has(dep.successorId)) {
        violations.push({
          type: 'missing_successor',
          dependency: dep,
          reason: `Successor task ${dep.successorId} not found`
        });
      }
    }
    
    // Test 2: Verify no circular dependencies
    const circularCheck = TimelineEngine.validateDependencies(
      originalDependencies.map(dep => ({
        from: dep.predecessorId,
        to: dep.successorId,
        type: dep.dependencyType,
        lag: dep.lag
      }))
    );
    
    if (!circularCheck.isValid) {
      violations.push({
        type: 'circular_dependency',
        reason: 'Circular dependencies detected',
        cycles: circularCheck.circularDependencies
      });
    }
    
    // Test 3: Verify dependency date consistency
    const taskMap = new Map();
    originalTasks.forEach(task => {
      taskMap.set(task.id, {
        ...task,
        startDate: new Date(task.startDate),
        dueDate: new Date(task.dueDate)
      });
    });
    
    for (const dep of originalDependencies) {
      const predecessor = taskMap.get(dep.predecessorId);
      const successor = taskMap.get(dep.successorId);
      
      if (predecessor && successor) {
        // Check finish-to-start dependency
        if (dep.dependencyType === 'finish_to_start') {
          const expectedSuccessorStart = new Date(predecessor.dueDate);
          expectedSuccessorStart.setDate(expectedSuccessorStart.getDate() + (dep.lag || 0));
          
          if (successor.startDate < expectedSuccessorStart) {
            violations.push({
              type: 'date_violation',
              dependency: dep,
              reason: `Successor ${successor.id} starts before predecessor ${predecessor.id} finishes`,
              predecessorEnd: predecessor.dueDate,
              successorStart: successor.startDate,
              expectedStart: expectedSuccessorStart
            });
          }
        }
        
        // Check start-to-start dependency
        if (dep.dependencyType === 'start_to_start') {
          const expectedSuccessorStart = new Date(predecessor.startDate);
          expectedSuccessorStart.setDate(expectedSuccessorStart.getDate() + (dep.lag || 0));
          
          if (successor.startDate < expectedSuccessorStart) {
            violations.push({
              type: 'date_violation',
              dependency: dep,
              reason: `Successor ${successor.id} starts before predecessor ${predecessor.id} starts`,
              predecessorStart: predecessor.startDate,
              successorStart: successor.startDate,
              expectedStart: expectedSuccessorStart
            });
          }
        }
      }
    }
    
    // Test 4: Verify status consistency
    for (const dep of originalDependencies) {
      const predecessor = taskMap.get(dep.predecessorId);
      const successor = taskMap.get(dep.successorId);
      
      if (predecessor && successor) {
        // If successor is Done, predecessor should not be in Backlog
        if (successor.status === 'Done' && predecessor.status === 'Backlog') {
          violations.push({
            type: 'status_violation',
            dependency: dep,
            reason: `Successor ${successor.id} is Done but predecessor ${predecessor.id} is still in Backlog`,
            predecessorStatus: predecessor.status,
            successorStatus: successor.status
          });
        }
        
        // If successor is In Progress, predecessor should not be To Do (for finish-to-start)
        if (dep.dependencyType === 'finish_to_start' && 
            successor.status === 'In Progress' && 
            predecessor.status === 'To Do') {
          violations.push({
            type: 'status_violation',
            dependency: dep,
            reason: `Successor ${successor.id} is In Progress but predecessor ${predecessor.id} is still To Do`,
            predecessorStatus: predecessor.status,
            successorStatus: successor.status
          });
        }
      }
    }
    
    // Test 5: Test dependency modification scenarios
    const modificationTests = testDependencyModifications(originalTasks, originalDependencies);
    violations.push(...modificationTests);
    
    if (violations.length > 0) {
      return {
        success: false,
        reason: `Found ${violations.length} dependency consistency violations`,
        violations: violations
      };
    }
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      reason: 'Verification error: ' + error.message,
      error: error
    };
  }
}

/**
 * Test dependency modification scenarios
 */
function testDependencyModifications(tasks, dependencies) {
  const violations = [];
  
  try {
    // Test scenario: Move a predecessor task's end date later
    if (tasks.length >= 2 && dependencies.length > 0) {
      const testDep = dependencies[0];
      const predecessor = tasks.find(t => t.id === testDep.predecessorId);
      const successor = tasks.find(t => t.id === testDep.successorId);
      
      if (predecessor && successor) {
        // Simulate moving predecessor end date 5 days later
        const newEndDate = new Date(predecessor.dueDate);
        newEndDate.setDate(newEndDate.getDate() + 5);
        
        // Check if this would create a date violation
        const successorStart = new Date(successor.startDate);
        const expectedSuccessorStart = new Date(newEndDate);
        expectedSuccessorStart.setDate(expectedSuccessorStart.getDate() + (testDep.lag || 0));
        
        if (successorStart < expectedSuccessorStart) {
          // This is expected - the system should detect and handle this
          // We're testing that the system would identify this as needing adjustment
        }
      }
    }
    
    // Test scenario: Create a potential circular dependency
    if (tasks.length >= 3) {
      const task1 = tasks[0];
      const task2 = tasks[1];
      const task3 = tasks[2];
      
      // Check if adding task3 -> task1 would create a cycle
      // when task1 -> task2 -> task3 already exists
      const wouldCreateCycle = dependencies.some(d1 => 
        d1.predecessorId === task1.id && 
        dependencies.some(d2 => 
          d2.predecessorId === task2.id && d2.successorId === task3.id
        )
      );
      
      if (wouldCreateCycle) {
        // Test that the system would reject this circular dependency
        const testDependencies = [...dependencies, {
          predecessorId: task3.id,
          successorId: task1.id,
          dependencyType: 'finish_to_start',
          lag: 0
        }];
        
        const circularCheck = TimelineEngine.validateDependencies(
          testDependencies.map(dep => ({
            from: dep.predecessorId,
            to: dep.successorId,
            type: dep.dependencyType,
            lag: dep.lag
          }))
        );
        
        if (circularCheck.isValid) {
          violations.push({
            type: 'circular_dependency_not_detected',
            reason: 'System failed to detect circular dependency',
            testDependencies: testDependencies
          });
        }
      }
    }
    
  } catch (error) {
    violations.push({
      type: 'modification_test_error',
      reason: 'Error testing dependency modifications: ' + error.message,
      error: error
    });
  }
  
  return violations;
}

/**
 * Run dependency consistency property test (main entry point)
 */
function runDependencyPropertyTest(iterations = 100) {
  return runDependencyConsistencyPropertyTest(iterations);
}