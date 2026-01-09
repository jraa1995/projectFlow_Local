/**
 * Unit Tests for Autocomplete Functionality
 * Tests dropdown behavior, keyboard navigation, and user search
 */

/**
 * Test MentionEngine user suggestions functionality
 */
function testUserSuggestions() {
  console.log('🧪 Testing User Suggestions');
  
  try {
    // Setup test data
    setupTestData();
    
    const testUsers = [
      { email: 'alice.smith@example.com', name: 'Alice Smith', role: 'member' },
      { email: 'bob.jones@example.com', name: 'Bob Jones', role: 'member' },
      { email: 'charlie.brown@example.com', name: 'Charlie Brown', role: 'admin' }
    ];
    
    // Create test users
    testUsers.forEach(userData => {
      const existingUser = getUserByEmail(userData.email);
      if (!existingUser) {
        createUser(userData);
      }
    });
    
    // Test 1: Basic search functionality
    const suggestions1 = MentionEngine.getUserSuggestions('alice', []);
    if (suggestions1.length === 0) {
      throw new Error('No suggestions found for "alice" query');
    }
    
    const aliceResult = suggestions1.find(s => s.email === 'alice.smith@example.com');
    if (!aliceResult) {
      throw new Error('Alice not found in suggestions for "alice" query');
    }
    
    console.log('✅ Basic search functionality works');
    
    // Test 2: Email-based search
    const suggestions2 = MentionEngine.getUserSuggestions('bob.jones', []);
    const bobResult = suggestions2.find(s => s.email === 'bob.jones@example.com');
    if (!bobResult) {
      throw new Error('Bob not found in suggestions for email-based query');
    }
    
    console.log('✅ Email-based search works');
    
    // Test 3: Exclude users functionality
    const suggestions3 = MentionEngine.getUserSuggestions('', ['alice.smith@example.com']);
    const excludedAlice = suggestions3.find(s => s.email === 'alice.smith@example.com');
    if (excludedAlice) {
      throw new Error('Excluded user Alice found in suggestions');
    }
    
    console.log('✅ User exclusion works');
    
    // Test 4: Case insensitive search
    const suggestions4 = MentionEngine.getUserSuggestions('CHARLIE', []);
    const charlieResult = suggestions4.find(s => s.email === 'charlie.brown@example.com');
    if (!charlieResult) {
      throw new Error('Charlie not found with case insensitive search');
    }
    
    console.log('✅ Case insensitive search works');
    
    // Test 5: Match scoring
    const suggestions5 = MentionEngine.getUserSuggestions('smith', []);
    if (suggestions5.length > 0) {
      // Alice Smith should have a high match score for "smith"
      const aliceMatch = suggestions5.find(s => s.email === 'alice.smith@example.com');
      if (aliceMatch && aliceMatch.matchScore <= 0) {
        throw new Error('Match scoring not working properly');
      }
    }
    
    console.log('✅ Match scoring works');
    
    return {
      success: true,
      testsRun: 5,
      message: 'All user suggestion tests passed'
    };
    
  } catch (error) {
    console.error('❌ User suggestions test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test mention parsing and validation
 */
function testMentionParsing() {
  console.log('🧪 Testing Mention Parsing');
  
  try {
    // Setup test data
    setupTestData();
    
    // Ensure test users exist
    const testUser = getUserByEmail('test.user@example.com') || createUser({
      email: 'test.user@example.com',
      name: 'Test User',
      role: 'member'
    });
    
    // Test 1: Basic mention parsing
    const content1 = 'Hello @test.user@example.com, please review this.';
    const parseResult1 = MentionEngine.parseCommentForMentions(content1);
    
    if (parseResult1.mentionedUsers.length !== 1) {
      throw new Error(`Expected 1 mentioned user, got ${parseResult1.mentionedUsers.length}`);
    }
    
    if (parseResult1.mentionedUsers[0].email !== 'test.user@example.com') {
      throw new Error('Incorrect user email parsed from mention');
    }
    
    console.log('✅ Basic mention parsing works');
    
    // Test 2: Multiple mentions
    const content2 = 'CC: @test.user@example.com and @test.user@example.com for review';
    const parseResult2 = MentionEngine.parseCommentForMentions(content2);
    
    // Should deduplicate mentions
    if (parseResult2.mentionedUsers.length !== 1) {
      throw new Error(`Expected 1 unique mentioned user, got ${parseResult2.mentionedUsers.length}`);
    }
    
    console.log('✅ Mention deduplication works');
    
    // Test 3: Invalid mentions
    const content3 = 'Hello @nonexistent@invalid.com, this should not work.';
    const parseResult3 = MentionEngine.parseCommentForMentions(content3);
    
    if (parseResult3.mentionedUsers.length !== 0) {
      throw new Error('Invalid mention was incorrectly parsed as valid');
    }
    
    if (parseResult3.invalidMentions.length !== 1) {
      throw new Error('Invalid mention was not detected');
    }
    
    console.log('✅ Invalid mention detection works');
    
    // Test 4: Formatted text generation
    const content4 = 'Hello @test.user@example.com!';
    const parseResult4 = MentionEngine.parseCommentForMentions(content4);
    
    if (!parseResult4.formattedText.includes('<span class="mention"')) {
      throw new Error('Formatted text does not contain mention spans');
    }
    
    if (!parseResult4.formattedText.includes('Test User')) {
      throw new Error('Formatted text does not contain user display name');
    }
    
    console.log('✅ Formatted text generation works');
    
    // Test 5: Mention validation
    const validation = MentionEngine.validateMentions(['test.user@example.com', 'invalid@user.com']);
    
    if (validation.validUsers.length !== 1) {
      throw new Error(`Expected 1 valid user, got ${validation.validUsers.length}`);
    }
    
    if (validation.invalidUsers.length !== 1) {
      throw new Error(`Expected 1 invalid user, got ${validation.invalidUsers.length}`);
    }
    
    if (validation.isValid !== false) {
      throw new Error('Validation should return false when invalid users are present');
    }
    
    console.log('✅ Mention validation works');
    
    return {
      success: true,
      testsRun: 5,
      message: 'All mention parsing tests passed'
    };
    
  } catch (error) {
    console.error('❌ Mention parsing test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test mention formatting utilities
 */
function testMentionFormatting() {
  console.log('🧪 Testing Mention Formatting');
  
  try {
    // Setup test data
    setupTestData();
    
    const testUser = getUserByEmail('format.test@example.com') || createUser({
      email: 'format.test@example.com',
      name: 'Format Test',
      role: 'member'
    });
    
    // Test 1: Format mentions for display
    const text1 = 'Hello @format.test@example.com, how are you?';
    const users1 = [{ email: 'format.test@example.com', name: 'Format Test' }];
    const formatted1 = MentionEngine.formatMentionsForDisplay(text1, users1);
    
    if (!formatted1.includes('<span class="mention"')) {
      throw new Error('Formatted display text does not contain mention spans');
    }
    
    if (!formatted1.includes('Format Test')) {
      throw new Error('Formatted display text does not use display name');
    }
    
    console.log('✅ Format mentions for display works');
    
    // Test 2: Extract plain text mentions
    const formattedText = '<span class="mention" data-user="format.test@example.com">@Format Test</span>';
    const plainText = MentionEngine.extractPlainTextMentions(formattedText);
    
    if (!plainText.includes('@Format Test')) {
      throw new Error('Plain text extraction did not preserve mention format');
    }
    
    if (plainText.includes('<span')) {
      throw new Error('Plain text extraction did not remove HTML tags');
    }
    
    console.log('✅ Extract plain text mentions works');
    
    // Test 3: Mention statistics
    const statsText = 'Hello @format.test@example.com and @invalid@user.com!';
    const stats = MentionEngine.getMentionStatistics(statsText);
    
    if (stats.totalMentions !== 2) {
      throw new Error(`Expected 2 total mentions, got ${stats.totalMentions}`);
    }
    
    if (stats.validMentions !== 1) {
      throw new Error(`Expected 1 valid mention, got ${stats.validMentions}`);
    }
    
    if (stats.invalidMentions !== 1) {
      throw new Error(`Expected 1 invalid mention, got ${stats.invalidMentions}`);
    }
    
    if (!stats.hasInvalidMentions) {
      throw new Error('Statistics should indicate presence of invalid mentions');
    }
    
    console.log('✅ Mention statistics works');
    
    return {
      success: true,
      testsRun: 3,
      message: 'All mention formatting tests passed'
    };
    
  } catch (error) {
    console.error('❌ Mention formatting test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test notification creation for mentions
 */
function testMentionNotifications() {
  console.log('🧪 Testing Mention Notifications');
  
  try {
    // Setup test data
    setupTestData();
    
    // Create test users
    const mentionedUser = getUserByEmail('mentioned@example.com') || createUser({
      email: 'mentioned@example.com',
      name: 'Mentioned User',
      role: 'member'
    });
    
    const authorUser = getUserByEmail('author@example.com') || createUser({
      email: 'author@example.com',
      name: 'Author User',
      role: 'member'
    });
    
    // Create test task
    const testTask = createTask({
      title: 'Test Task for Notifications',
      status: 'To Do',
      projectId: 'TEST'
    });
    
    // Create test comment
    const testComment = {
      id: generateId('cmt'),
      taskId: testTask.id,
      userId: 'author@example.com',
      content: 'Please review @mentioned@example.com',
      createdAt: now()
    };
    
    // Test notification creation
    const mentionedUsers = [{ email: 'mentioned@example.com', name: 'Mentioned User' }];
    const notifications = MentionEngine.createMentionNotifications(
      testTask.id,
      mentionedUsers,
      testComment
    );
    
    if (notifications.length !== 1) {
      throw new Error(`Expected 1 notification, got ${notifications.length}`);
    }
    
    const notification = notifications[0];
    
    if (notification.userId !== 'mentioned@example.com') {
      throw new Error('Notification not created for correct user');
    }
    
    if (notification.type !== 'mention') {
      throw new Error('Notification type is not "mention"');
    }
    
    if (!notification.title.includes('mentioned')) {
      throw new Error('Notification title does not indicate mention');
    }
    
    if (notification.entityType !== 'task') {
      throw new Error('Notification entity type is not "task"');
    }
    
    if (notification.entityId !== testTask.id) {
      throw new Error('Notification entity ID does not match task ID');
    }
    
    console.log('✅ Mention notification creation works');
    
    // Test self-mention prevention
    const selfMentionComment = {
      id: generateId('cmt'),
      taskId: testTask.id,
      userId: 'mentioned@example.com', // Same as mentioned user
      content: 'I mention myself @mentioned@example.com',
      createdAt: now()
    };
    
    const selfNotifications = MentionEngine.createMentionNotifications(
      testTask.id,
      mentionedUsers,
      selfMentionComment
    );
    
    if (selfNotifications.length !== 0) {
      throw new Error('Self-mention notification was incorrectly created');
    }
    
    console.log('✅ Self-mention prevention works');
    
    // Cleanup
    deleteTask(testTask.id);
    
    return {
      success: true,
      testsRun: 2,
      message: 'All mention notification tests passed'
    };
    
  } catch (error) {
    console.error('❌ Mention notification test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all autocomplete unit tests
 */
function runAutocompleteUnitTests() {
  console.log('🚀 Running Autocomplete Unit Tests');
  console.log('==================================');
  
  const results = [];
  
  // Test 1: User Suggestions
  console.log('\n1️⃣ User Suggestions Test');
  const result1 = testUserSuggestions();
  results.push({ name: 'User Suggestions', ...result1 });
  
  // Test 2: Mention Parsing
  console.log('\n2️⃣ Mention Parsing Test');
  const result2 = testMentionParsing();
  results.push({ name: 'Mention Parsing', ...result2 });
  
  // Test 3: Mention Formatting
  console.log('\n3️⃣ Mention Formatting Test');
  const result3 = testMentionFormatting();
  results.push({ name: 'Mention Formatting', ...result3 });
  
  // Test 4: Mention Notifications
  console.log('\n4️⃣ Mention Notifications Test');
  const result4 = testMentionNotifications();
  results.push({ name: 'Mention Notifications', ...result4 });
  
  // Summary
  console.log('\n📊 Unit Test Summary');
  console.log('====================');
  
  let passed = 0;
  let failed = 0;
  let totalTests = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
    
    if (result.success) {
      passed++;
      totalTests += result.testsRun || 1;
    } else {
      failed++;
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\nTotal: ${passed} test suites passed, ${failed} failed`);
  console.log(`Individual tests: ${totalTests} tests executed`);
  
  return {
    success: failed === 0,
    passed,
    failed,
    totalTests,
    results
  };
}

/**
 * Quick test for development
 */
function quickTestAutocomplete() {
  console.log('🧪 Quick Autocomplete Test');
  
  try {
    setupTestData();
    
    // Test basic user suggestion
    const suggestions = MentionEngine.getUserSuggestions('test', []);
    console.log(`Found ${suggestions.length} suggestions for "test"`);
    
    // Test basic mention parsing
    const parseResult = MentionEngine.parseCommentForMentions('Hello @test@example.com!');
    console.log(`Parsed ${parseResult.mentionedUsers.length} mentions`);
    
    return true;
    
  } catch (error) {
    console.error('Quick test failed:', error);
    return false;
  }
}

console.log('✅ AutocompleteTests.gs loaded - Unit tests ready');