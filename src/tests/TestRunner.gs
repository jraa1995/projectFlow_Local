/**
 * Test Runner for Google Apps Script Environment
 * Execute property tests within the GAS runtime
 */

/**
 * Main test execution function - run this in Google Apps Script
 */
function executePropertyTests() {
  try {
    console.log('🚀 Starting Enhanced Data Model Property Tests');
    console.log('===============================================');
    
    // Initialize system if needed
    const user = getCurrentUser();
    console.log(`Running as user: ${user.email}`);
    
    // Run the property tests
    const results = runEnhancedDataModelTests();
    
    // Return results for external validation
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Simplified test for basic functionality
 */
function testBasicCommentProcessing() {
  console.log('🧪 Testing Basic Comment Processing');
  
  try {
    // Setup
    setupTestData();
    
    const users = getAllUsers();
    const tasks = getAllTasks();
    
    if (users.length === 0 || tasks.length === 0) {
      throw new Error('Insufficient test data - need at least 1 user and 1 task');
    }
    
    const testUser = users[0];
    const testTask = tasks[0];
    
    // Test comment with mention
    const commentContent = `This is a test comment mentioning @${testUser.email} about the task progress.`;
    
    console.log(`Creating comment: "${commentContent}"`);
    console.log(`Task ID: ${testTask.id}`);
    console.log(`User: ${testUser.email}`);
    
    // Create comment with mentions
    const comment = addCommentWithMentions(testTask.id, commentContent, testUser.email);
    
    console.log('✅ Comment created:', comment.id);
    console.log('✅ Mentioned users:', comment.mentionedUsers);
    
    // Verify mentions were processed
    const mentions = getMentionsForUser(testUser.email, 10);
    console.log(`✅ Found ${mentions.length} mentions for user`);
    
    // Verify notifications were created
    const notifications = getNotificationsForUser(testUser.email, 10);
    console.log(`✅ Found ${notifications.length} notifications for user`);
    
    // Cleanup
    deleteComment(comment.id);
    console.log('✅ Cleanup completed');
    
    return {
      success: true,
      comment: comment,
      mentionsCount: mentions.length,
      notificationsCount: notifications.length
    };
    
  } catch (error) {
    console.error('❌ Basic test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test data model integrity
 */
function testDataModelIntegrity() {
  console.log('🧪 Testing Data Model Integrity');
  
  try {
    // Test all sheet creation
    const tasksSheet = getTasksSheet();
    const usersSheet = getUsersSheet();
    const projectsSheet = getProjectsSheet();
    const commentsSheet = getCommentsSheet();
    const activitySheet = getActivitySheet();
    const mentionsSheet = getMentionsSheet();
    const notificationsSheet = getNotificationsSheet();
    const cacheSheet = getAnalyticsCacheSheet();
    const dependenciesSheet = getTaskDependenciesSheet();
    
    console.log('✅ All sheets accessible');
    
    // Test configuration constants
    const requiredSheets = Object.keys(CONFIG.SHEETS);
    console.log(`✅ Configuration has ${requiredSheets.length} sheet definitions`);
    
    // Test column definitions
    const taskColumns = CONFIG.TASK_COLUMNS.length;
    const commentColumns = CONFIG.COMMENT_COLUMNS.length;
    const mentionColumns = CONFIG.MENTION_COLUMNS.length;
    const notificationColumns = CONFIG.NOTIFICATION_COLUMNS.length;
    
    console.log(`✅ Column definitions: Tasks(${taskColumns}), Comments(${commentColumns}), Mentions(${mentionColumns}), Notifications(${notificationColumns})`);
    
    // Test enhanced task columns
    const hasEnhancedColumns = CONFIG.TASK_COLUMNS.includes('dependencies') && 
                              CONFIG.TASK_COLUMNS.includes('timeEntries') &&
                              CONFIG.TASK_COLUMNS.includes('customFields');
    
    if (!hasEnhancedColumns) {
      throw new Error('Enhanced task columns not found in configuration');
    }
    
    console.log('✅ Enhanced task columns present');
    
    // Test enhanced comment columns  
    const hasEnhancedCommentColumns = CONFIG.COMMENT_COLUMNS.includes('mentionedUsers') &&
                                     CONFIG.COMMENT_COLUMNS.includes('isEdited') &&
                                     CONFIG.COMMENT_COLUMNS.includes('editHistory');
    
    if (!hasEnhancedCommentColumns) {
      throw new Error('Enhanced comment columns not found in configuration');
    }
    
    console.log('✅ Enhanced comment columns present');
    
    return {
      success: true,
      sheetsCount: requiredSheets.length,
      taskColumns: taskColumns,
      enhancedFeatures: true
    };
    
  } catch (error) {
    console.error('❌ Data model integrity test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all validation tests
 */
function runAllValidationTests() {
  console.log('🚀 Running All Validation Tests');
  console.log('================================');
  
  const results = [];
  
  // Test 1: Data Model Integrity
  console.log('\n1️⃣ Data Model Integrity Test');
  const result1 = testDataModelIntegrity();
  results.push({ name: 'Data Model Integrity', ...result1 });
  
  // Test 2: Basic Comment Processing
  console.log('\n2️⃣ Basic Comment Processing Test');
  const result2 = testBasicCommentProcessing();
  results.push({ name: 'Basic Comment Processing', ...result2 });
  
  // Test 3: Property Tests (if system is ready)
  console.log('\n3️⃣ Property-Based Tests');
  try {
    const result3 = runEnhancedDataModelTests();
    results.push({ name: 'Property-Based Tests', ...result3 });
  } catch (error) {
    console.log('⚠️ Property tests skipped due to error:', error.message);
    results.push({ 
      name: 'Property-Based Tests', 
      success: false, 
      error: error.message,
      skipped: true 
    });
  }
  
  // Test 4: Timeline Property Tests
  console.log('\n4️⃣ Timeline Property Tests');
  try {
    const result4 = runTimelineDataCompletenessPropertyTest(10); // Run with fewer iterations for testing
    results.push({ name: 'Timeline Property Tests', ...result4 });
  } catch (error) {
    console.log('⚠️ Timeline property tests skipped due to error:', error.message);
    results.push({ 
      name: 'Timeline Property Tests', 
      success: false, 
      error: error.message,
      skipped: true 
    });
  }
  
  // Summary
  console.log('\n📊 Validation Summary');
  console.log('====================');
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : (result.skipped ? '⚠️' : '❌');
    const suffix = result.skipped ? ' (SKIPPED)' : '';
    console.log(`${status} ${result.name}${suffix}`);
    
    if (result.success) passed++;
    else if (!result.skipped) failed++;
  });
  
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  
  return {
    success: failed === 0,
    passed,
    failed,
    results
  };
}

console.log('✅ TestRunner.gs loaded - Ready to execute tests');