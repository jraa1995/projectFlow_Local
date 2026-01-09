/**
 * ProjectFlow Property-Based Tests
 * Tests for enterprise data model and comment processing integrity
 */

// =============================================================================
// PROPERTY-BASED TEST FRAMEWORK (Simplified for Google Apps Script)
// =============================================================================

/**
 * Simple property test runner for Google Apps Script
 */
function runPropertyTest(testName, propertyFunction, generator, iterations = 100) {
  console.log(`🧪 Running property test: ${testName}`);
  console.log(`   Iterations: ${iterations}`);
  
  let passed = 0;
  let failed = 0;
  let failures = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      const testData = generator();
      const result = propertyFunction(testData);
      
      if (result === true) {
        passed++;
      } else {
        failed++;
        failures.push({
          iteration: i + 1,
          input: testData,
          result: result
        });
        
        // Stop on first failure for debugging
        if (failed === 1) {
          console.log(`❌ First failure at iteration ${i + 1}:`);
          console.log(`   Input: ${JSON.stringify(testData)}`);
          console.log(`   Result: ${result}`);
        }
      }
    } catch (error) {
      failed++;
      failures.push({
        iteration: i + 1,
        error: error.message,
        stack: error.stack
      });
      
      if (failed === 1) {
        console.log(`❌ First error at iteration ${i + 1}: ${error.message}`);
      }
    }
  }
  
  const success = failed === 0;
  console.log(`   Results: ${passed} passed, ${failed} failed`);
  
  if (!success && failures.length > 0) {
    console.log(`   Sample failures:`);
    failures.slice(0, 3).forEach((f, idx) => {
      console.log(`     ${idx + 1}. Iteration ${f.iteration}: ${f.error || f.result}`);
    });
  }
  
  return {
    testName,
    success,
    passed,
    failed,
    iterations,
    failures: failures.slice(0, 5) // Keep only first 5 failures
  };
}

// =============================================================================
// DATA GENERATORS
// =============================================================================

/**
 * Generate random string with optional mention patterns
 */
function generateRandomString(minLength = 5, maxLength = 100, includeMentions = false) {
  const words = [
    'project', 'task', 'update', 'review', 'complete', 'urgent', 'meeting',
    'deadline', 'progress', 'issue', 'bug', 'feature', 'enhancement', 'fix',
    'implement', 'design', 'test', 'deploy', 'release', 'documentation'
  ];
  
  const length = Math.floor(Math.random() * (maxLength - minLength)) + minLength;
  let text = '';
  
  while (text.length < length) {
    const word = words[Math.floor(Math.random() * words.length)];
    text += (text ? ' ' : '') + word;
  }
  
  // Add mentions if requested
  if (includeMentions && Math.random() < 0.7) {
    const users = getActiveUsers();
    if (users.length > 0) {
      const numMentions = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numMentions; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const mentionText = `@${user.email}`;
        
        // Insert mention at random position
        const insertPos = Math.floor(Math.random() * text.length);
        text = text.slice(0, insertPos) + ' ' + mentionText + ' ' + text.slice(insertPos);
      }
    }
  }
  
  return text.trim();
}

/**
 * Generate random user email from existing users
 */
function generateRandomUserEmail() {
  const users = getActiveUsers();
  if (users.length === 0) {
    // Create a test user if none exist
    const testUser = createUser({
      email: 'test@example.com',
      name: 'Test User',
      role: 'member'
    });
    return testUser.email;
  }
  
  return users[Math.floor(Math.random() * users.length)].email;
}

/**
 * Generate random task ID from existing tasks
 */
function generateRandomTaskId() {
  const tasks = getAllTasks();
  if (tasks.length === 0) {
    // Create a test task if none exist
    const testTask = createTask({
      title: 'Test Task for Property Testing',
      status: 'To Do',
      projectId: 'TEST'
    });
    return testTask.id;
  }
  
  return tasks[Math.floor(Math.random() * tasks.length)].id;
}

/**
 * Generate test data for comment processing
 */
function generateCommentTestData() {
  return {
    taskId: generateRandomTaskId(),
    content: generateRandomString(10, 200, true), // Include mentions
    userId: generateRandomUserEmail(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate test data for mention formatting
 */
function generateMentionFormattingTestData() {
  const users = getActiveUsers();
  const numMentions = Math.floor(Math.random() * 3) + 1; // 1-3 mentions
  const selectedUsers = [];
  
  // Select random users for mentions
  for (let i = 0; i < Math.min(numMentions, users.length); i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    if (!selectedUsers.find(u => u.email === user.email)) {
      selectedUsers.push(user);
    }
  }
  
  // Generate content with mentions
  let content = generateRandomString(20, 150, false);
  
  // Insert mentions at random positions
  selectedUsers.forEach(user => {
    const mentionText = `@${user.email}`;
    const insertPos = Math.floor(Math.random() * content.length);
    content = content.slice(0, insertPos) + ' ' + mentionText + ' ' + content.slice(insertPos);
  });
  
  // Sometimes add invalid mentions
  if (Math.random() < 0.3) {
    const invalidMention = '@invalid.user@nonexistent.com';
    const insertPos = Math.floor(Math.random() * content.length);
    content = content.slice(0, insertPos) + ' ' + invalidMention + ' ' + content.slice(insertPos);
  }
  
  return {
    content: content.trim(),
    mentionedUsers: selectedUsers,
    expectedValidMentions: selectedUsers.length
  };
}

// =============================================================================
// PROPERTY TESTS
// =============================================================================

/**
 * Property 2: Mention Formatting Consistency
 * For any comment containing user mentions, the mention highlighting and formatting 
 * should be applied consistently and mentioned users should be visually distinguished
 * 
 * **Validates: Requirements 1.4**
 */
function testMentionFormattingConsistency(testData) {
  const { content, mentionedUsers } = testData;
  
  try {
    // Parse mentions using MentionEngine
    const parseResult = MentionEngine.parseCommentForMentions(content);
    
    // Verify parsing consistency
    if (!parseResult || typeof parseResult !== 'object') {
      return 'MentionEngine.parseCommentForMentions did not return valid result object';
    }
    
    // Check that original text is preserved
    if (parseResult.originalText !== content) {
      return 'Original text was not preserved in parse result';
    }
    
    // Verify formatted text contains proper mention highlighting
    if (parseResult.mentionedUsers.length > 0) {
      // Check that formatted text contains mention spans
      const mentionSpanPattern = /<span class="mention"[^>]*>@[^<]+<\/span>/g;
      const formattedMentions = parseResult.formattedText.match(mentionSpanPattern) || [];
      
      if (formattedMentions.length !== parseResult.mentionedUsers.length) {
        return `Expected ${parseResult.mentionedUsers.length} formatted mentions, found ${formattedMentions.length}`;
      }
      
      // Verify each mentioned user has proper formatting
      for (const user of parseResult.mentionedUsers) {
        const expectedPattern = new RegExp(`<span class="mention"[^>]*data-user="${escapeRegExp(user.email)}"[^>]*>@${escapeRegExp(user.name)}</span>`);
        
        if (!expectedPattern.test(parseResult.formattedText)) {
          return `Mention formatting for ${user.email} (${user.name}) not found in formatted text`;
        }
      }
    }
    
    // Test formatting utility function consistency
    const utilityFormatted = MentionEngine.formatMentionsForDisplay(content, parseResult.mentionedUsers);
    
    // Both methods should produce consistent results for valid mentions
    const parseFormatted = parseResult.formattedText;
    
    // Extract mention spans from both for comparison
    const extractMentionSpans = (text) => {
      const spans = text.match(/<span class="mention"[^>]*>[^<]+<\/span>/g) || [];
      return spans.sort();
    };
    
    const parseSpans = extractMentionSpans(parseFormatted);
    const utilitySpans = extractMentionSpans(utilityFormatted);
    
    if (parseSpans.length !== utilitySpans.length) {
      return `Inconsistent mention formatting: parse method found ${parseSpans.length} spans, utility method found ${utilitySpans.length} spans`;
    }
    
    // Test round-trip consistency (format then extract plain text)
    const plainTextExtracted = MentionEngine.extractPlainTextMentions(parseResult.formattedText);
    
    // Should preserve @mentions in plain text
    for (const user of parseResult.mentionedUsers) {
      const expectedMention = `@${user.name}`;
      if (!plainTextExtracted.includes(expectedMention)) {
        return `Plain text extraction did not preserve mention: ${expectedMention}`;
      }
    }
    
    // Test mention statistics consistency
    const stats = MentionEngine.getMentionStatistics(content);
    
    if (stats.validMentions !== parseResult.mentionedUsers.length) {
      return `Statistics mismatch: expected ${parseResult.mentionedUsers.length} valid mentions, stats reported ${stats.validMentions}`;
    }
    
    if (stats.invalidMentions !== parseResult.invalidMentions.length) {
      return `Statistics mismatch: expected ${parseResult.invalidMentions.length} invalid mentions, stats reported ${stats.invalidMentions}`;
    }
    
    // Verify user suggestions work consistently
    if (parseResult.mentionedUsers.length > 0) {
      const firstUser = parseResult.mentionedUsers[0];
      const suggestions = MentionEngine.getUserSuggestions(firstUser.email.substring(0, 3));
      
      // Should find the user in suggestions (unless excluded)
      const foundUser = suggestions.find(s => s.email === firstUser.email);
      if (!foundUser) {
        return `User ${firstUser.email} not found in suggestions for query "${firstUser.email.substring(0, 3)}"`;
      }
    }
    
    return true;
    
  } catch (error) {
    return `Error during mention formatting test: ${error.message}`;
  }
}

/**
 * Property 1: Comment Processing Integrity
 * For any comment with mention syntax (@username), the system should correctly 
 * parse mentions, validate user existence, save the comment with proper metadata, 
 * and create appropriate notification records
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.6**
 */
function testCommentProcessingIntegrity(testData) {
  const { taskId, content, userId } = testData;
  
  // Get initial state
  const initialComments = getCommentsForTask(taskId);
  const initialMentions = getMentionsForUser(userId);
  const initialNotifications = getNotificationsForUser(userId);
  
  // Extract expected mentions from content
  const mentionPattern = /@([^\s@]+@[^\s@]+)/g;
  const expectedMentions = [];
  let match;
  
  while ((match = mentionPattern.exec(content)) !== null) {
    const mentionedEmail = match[1];
    const user = getUserByEmail(mentionedEmail);
    if (user && user.active) {
      expectedMentions.push(mentionedEmail);
    }
  }
  
  try {
    // Process the comment (this should handle mentions automatically)
    const comment = addCommentWithMentions(taskId, content, userId);
    
    // Verify comment was created
    if (!comment || !comment.id) {
      return 'Comment was not created properly';
    }
    
    // Verify comment content is sanitized but preserved
    if (!comment.content || comment.content.length === 0) {
      return 'Comment content was not preserved';
    }
    
    // Verify mentioned users are recorded
    if (expectedMentions.length > 0) {
      const commentMentions = comment.mentionedUsers || [];
      
      for (const expectedEmail of expectedMentions) {
        if (!commentMentions.includes(expectedEmail)) {
          return `Expected mention ${expectedEmail} not found in comment.mentionedUsers`;
        }
      }
    }
    
    // Verify mention records were created
    if (expectedMentions.length > 0) {
      const newMentions = getMentionsForUser(userId);
      const mentionDiff = newMentions.length - initialMentions.length;
      
      if (mentionDiff !== expectedMentions.length) {
        return `Expected ${expectedMentions.length} new mentions, but found ${mentionDiff}`;
      }
    }
    
    // Verify notifications were created for mentioned users
    for (const mentionedEmail of expectedMentions) {
      const userNotifications = getNotificationsForUser(mentionedEmail);
      const hasNewNotification = userNotifications.some(n => 
        n.type === 'mention' && 
        n.entityId === taskId &&
        new Date(n.createdAt) > new Date(testData.timestamp)
      );
      
      if (!hasNewNotification) {
        return `No mention notification created for user ${mentionedEmail}`;
      }
    }
    
    // Cleanup test data
    deleteComment(comment.id);
    
    return true;
    
  } catch (error) {
    return `Error during comment processing: ${error.message}`;
  }
}

/**
 * Enhanced comment creation with mention processing
 * This function implements the comment processing logic that should handle mentions
 */
function addCommentWithMentions(taskId, content, userId) {
  const sheet = getCommentsSheet();
  const currentUser = userId || getCurrentUserEmail();
  const timestamp = now();
  
  // Parse mentions from content
  const mentionPattern = /@([^\s@]+@[^\s@]+)/g;
  const mentionedUsers = [];
  let match;
  
  while ((match = mentionPattern.exec(content)) !== null) {
    const mentionedEmail = match[1];
    const user = getUserByEmail(mentionedEmail);
    
    // Only include valid, active users
    if (user && user.active && !mentionedUsers.includes(mentionedEmail)) {
      mentionedUsers.push(mentionedEmail);
    }
  }
  
  // Create comment with mention data
  const comment = {
    id: generateId('cmt'),
    taskId: taskId,
    userId: currentUser,
    content: sanitize(content),
    createdAt: timestamp,
    updatedAt: timestamp,
    mentionedUsers: mentionedUsers.join(','),
    isEdited: false,
    editHistory: JSON.stringify([])
  };
  
  sheet.appendRow(objectToRow(comment, CONFIG.COMMENT_COLUMNS));
  
  // Create mention records and notifications
  mentionedUsers.forEach(mentionedEmail => {
    // Create mention record
    createMention({
      commentId: comment.id,
      mentionedUserId: mentionedEmail,
      mentionedByUserId: currentUser,
      taskId: taskId
    });
    
    // Create notification
    createNotification({
      userId: mentionedEmail,
      type: 'mention',
      title: 'You were mentioned in a comment',
      message: `${currentUser} mentioned you in a comment on task ${taskId}`,
      entityType: 'task',
      entityId: taskId,
      channels: ['in_app', 'email']
    });
  });
  
  // Log activity
  logActivity(currentUser, 'commented', 'task', taskId, { 
    preview: content.substring(0, 50),
    mentions: mentionedUsers.length
  });
  
  // Convert mentionedUsers back to array for return
  comment.mentionedUsers = mentionedUsers;
  
  return comment;
}

// =============================================================================
// TEST EXECUTION
// =============================================================================

/**
 * Run all property tests for enhanced data model
 */
function runEnhancedDataModelTests() {
  console.log('🚀 Running Enhanced Data Model Property Tests');
  console.log('==============================================');
  
  const results = [];
  
  // Ensure we have test data
  setupTestData();
  
  try {
    // Property 1: Comment Processing Integrity
    const result1 = runPropertyTest(
      'Property 1: Comment Processing Integrity',
      testCommentProcessingIntegrity,
      generateCommentTestData,
      100
    );
    results.push(result1);
    
    // Property 2: Mention Formatting Consistency
    const result2 = runPropertyTest(
      'Property 2: Mention Formatting Consistency',
      testMentionFormattingConsistency,
      generateMentionFormattingTestData,
      100
    );
    results.push(result2);
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let allSuccess = true;
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.passed}/${result.iterations} passed`);
      
      totalPassed += result.passed;
      totalFailed += result.failed;
      allSuccess = allSuccess && result.success;
    });
    
    console.log(`\nOverall: ${totalPassed} passed, ${totalFailed} failed`);
    
    if (allSuccess) {
      console.log('🎉 All property tests passed!');
    } else {
      console.log('❌ Some property tests failed. Check logs above for details.');
    }
    
    return {
      success: allSuccess,
      totalPassed,
      totalFailed,
      results
    };
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return {
      success: false,
      error: error.message,
      results
    };
  } finally {
    // Cleanup test data
    cleanupTestData();
  }
}

/**
 * Setup minimal test data
 */
function setupTestData() {
  // Ensure we have at least one user
  const users = getAllUsers();
  if (users.length === 0) {
    createUser({
      email: 'testuser1@example.com',
      name: 'Test User 1',
      role: 'member'
    });
    
    createUser({
      email: 'testuser2@example.com',
      name: 'Test User 2', 
      role: 'member'
    });
  }
  
  // Ensure we have at least one project and task
  const projects = getAllProjects();
  if (projects.length === 0) {
    createProject({
      name: 'Test Project',
      description: 'Project for property testing'
    });
  }
  
  const tasks = getAllTasks();
  if (tasks.length === 0) {
    createTask({
      title: 'Test Task for Property Testing',
      description: 'Task used for testing comment processing',
      status: 'To Do',
      projectId: projects[0]?.id || 'TEST'
    });
  }
}

/**
 * Cleanup test data created during testing
 */
function cleanupTestData() {
  try {
    // Remove test comments (those with "Test" in content)
    const allTasks = getAllTasks();
    allTasks.forEach(task => {
      const comments = getCommentsForTask(task.id);
      comments.forEach(comment => {
        if (comment.content && comment.content.includes('property testing')) {
          deleteComment(comment.id);
        }
      });
    });
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test cleanup had issues:', error.message);
  }
}

/**
 * Test just the mention formatting property
 */
function testMentionFormattingProperty() {
  console.log('🧪 Testing Mention Formatting Property');
  
  try {
    setupTestData();
    
    // Run a few iterations of the property test
    const result = runPropertyTest(
      'Property 2: Mention Formatting Consistency',
      testMentionFormattingConsistency,
      generateMentionFormattingTestData,
      10 // Smaller number for quick test
    );
    
    console.log('Property test result:', result);
    
    cleanupTestData();
    
    return result;
    
  } catch (error) {
    console.error('❌ Mention formatting property test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

console.log('✅ Tests.gs loaded - Enhanced Data Model Property Tests ready');

/**
 * Quick test runner for development
 */
function quickTestCommentProcessing() {
  console.log('🧪 Quick Comment Processing Test');
  
  setupTestData();
  
  const testData = generateCommentTestData();
  console.log('Test data:', testData);
  
  const result = testCommentProcessingIntegrity(testData);
  console.log('Result:', result);
  
  cleanupTestData();
  
  return result === true;
}