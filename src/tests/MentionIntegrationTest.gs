/**
 * Integration Test for Complete Mention System
 * Tests the full workflow from comment creation to notification delivery
 */

function testMentionSystemIntegration() {
  console.log('🚀 Testing Complete Mention System Integration');
  console.log('==============================================');
  
  try {
    // Setup test environment
    initializeSystem();
    
    // Create test users
    const testUsers = [
      { email: 'alice.integration@example.com', name: 'Alice Integration', role: 'member' },
      { email: 'bob.integration@example.com', name: 'Bob Integration', role: 'admin' },
      { email: 'charlie.integration@example.com', name: 'Charlie Integration', role: 'member' }
    ];
    
    testUsers.forEach(userData => {
      const existingUser = getUserByEmail(userData.email);
      if (!existingUser) {
        createUser(userData);
      }
    });
    
    // Create test project and task
    const testProject = createProject({
      name: 'Mention Integration Test Project',
      description: 'Project for testing mention system integration'
    });
    
    const testTask = createTask({
      title: 'Integration Test Task',
      description: 'Task for testing mention system',
      status: 'In Progress',
      projectId: testProject.id,
      assignee: 'alice.integration@example.com'
    });
    
    console.log(`✅ Test environment created - Task: ${testTask.id}`);
    
    // Test 1: Comment with mentions creation
    console.log('\n1️⃣ Testing comment creation with mentions');
    
    const commentContent = 'Hey @alice.integration@example.com and @bob.integration@example.com, please review this task. Also CC @charlie.integration@example.com for visibility.';
    
    const comment = addCommentWithMentions(testTask.id, commentContent, 'bob.integration@example.com');
    
    if (!comment || !comment.id) {
      throw new Error('Comment was not created successfully');
    }
    
    console.log(`✅ Comment created: ${comment.id}`);
    
    // Verify comment has mention metadata
    if (!comment.mentionedUsers || comment.mentionedUsers.length === 0) {
      throw new Error('Comment does not contain mention metadata');
    }
    
    const expectedMentions = ['alice.integration@example.com', 'charlie.integration@example.com']; // Bob shouldn't mention himself
    const actualMentions = Array.isArray(comment.mentionedUsers) ? 
      comment.mentionedUsers : 
      comment.mentionedUsers.split(',').map(e => e.trim());
    
    expectedMentions.forEach(email => {
      if (!actualMentions.includes(email)) {
        throw new Error(`Expected mention ${email} not found in comment`);
      }
    });
    
    console.log(`✅ Comment mentions verified: ${actualMentions.join(', ')}`);
    
    // Test 2: Mention records creation
    console.log('\n2️⃣ Testing mention records creation');
    
    const aliceMentions = getMentionsForUser('alice.integration@example.com', 10);
    const charlieMentions = getMentionsForUser('charlie.integration@example.com', 10);
    const bobMentions = getMentionsForUser('bob.integration@example.com', 10); // Should be empty (self-mention)
    
    if (aliceMentions.length === 0) {
      throw new Error('No mention record created for Alice');
    }
    
    if (charlieMentions.length === 0) {
      throw new Error('No mention record created for Charlie');
    }
    
    // Bob should not have a mention record (self-mention prevention)
    const bobSelfMention = bobMentions.find(m => m.mentionedByUserId === 'bob.integration@example.com');
    if (bobSelfMention) {
      throw new Error('Self-mention record was incorrectly created for Bob');
    }
    
    console.log(`✅ Mention records created correctly`);
    
    // Test 3: Notification creation
    console.log('\n3️⃣ Testing notification creation');
    
    const aliceNotifications = getNotificationsForUser('alice.integration@example.com', 10);
    const charlieNotifications = getNotificationsForUser('charlie.integration@example.com', 10);
    
    const aliceMentionNotification = aliceNotifications.find(n => 
      n.type === 'mention' && 
      n.entityId === testTask.id
    );
    
    const charlieMentionNotification = charlieNotifications.find(n => 
      n.type === 'mention' && 
      n.entityId === testTask.id
    );
    
    if (!aliceMentionNotification) {
      throw new Error('No mention notification created for Alice');
    }
    
    if (!charlieMentionNotification) {
      throw new Error('No mention notification created for Charlie');
    }
    
    console.log(`✅ Notifications created correctly`);
    
    // Test 4: Comment retrieval and formatting
    console.log('\n4️⃣ Testing comment retrieval and formatting');
    
    const taskComments = loadComments(testTask.id);
    const createdComment = taskComments.find(c => c.id === comment.id);
    
    if (!createdComment) {
      throw new Error('Created comment not found in task comments');
    }
    
    if (!createdComment.formattedContent) {
      throw new Error('Comment does not have formatted content');
    }
    
    // Check that formatted content contains mention spans
    if (!createdComment.formattedContent.includes('<span class="mention"')) {
      throw new Error('Formatted content does not contain mention spans');
    }
    
    // Check that user display names are used instead of emails
    if (!createdComment.formattedContent.includes('Alice Integration')) {
      throw new Error('Formatted content does not use display names');
    }
    
    console.log(`✅ Comment formatting verified`);
    
    // Test 5: User suggestions functionality
    console.log('\n5️⃣ Testing user suggestions');
    
    const suggestions = getUserSuggestions('alice', []);
    const aliceSuggestion = suggestions.find(s => s.email === 'alice.integration@example.com');
    
    if (!aliceSuggestion) {
      throw new Error('Alice not found in user suggestions');
    }
    
    if (!aliceSuggestion.displayText.includes('Alice Integration')) {
      throw new Error('User suggestion does not contain display name');
    }
    
    console.log(`✅ User suggestions working correctly`);
    
    // Test 6: Mention validation
    console.log('\n6️⃣ Testing mention validation');
    
    const validationResult = MentionEngine.validateMentions([
      'alice.integration@example.com',
      'invalid.user@example.com',
      'charlie.integration@example.com'
    ]);
    
    if (validationResult.validUsers.length !== 2) {
      throw new Error(`Expected 2 valid users, got ${validationResult.validUsers.length}`);
    }
    
    if (validationResult.invalidUsers.length !== 1) {
      throw new Error(`Expected 1 invalid user, got ${validationResult.invalidUsers.length}`);
    }
    
    if (validationResult.isValid !== false) {
      throw new Error('Validation should return false when invalid users are present');
    }
    
    console.log(`✅ Mention validation working correctly`);
    
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data');
    
    deleteComment(comment.id);
    deleteTask(testTask.id);
    
    // Clean up test users (optional - they can remain for future tests)
    console.log(`✅ Test data cleaned up`);
    
    // Final summary
    console.log('\n🎉 Integration Test Summary');
    console.log('==========================');
    console.log('✅ Comment creation with mentions');
    console.log('✅ Mention record creation');
    console.log('✅ Notification generation');
    console.log('✅ Comment formatting and display');
    console.log('✅ User suggestion functionality');
    console.log('✅ Mention validation');
    console.log('\n🎊 All integration tests passed successfully!');
    
    return {
      success: true,
      testsRun: 6,
      message: 'Complete mention system integration test passed'
    };
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Quick integration test for development
 */
function quickIntegrationTest() {
  console.log('🧪 Quick Mention Integration Test');
  
  try {
    initializeSystem();
    
    // Create minimal test
    const testUser = getUserByEmail('quick.test@example.com') || createUser({
      email: 'quick.test@example.com',
      name: 'Quick Test',
      role: 'member'
    });
    
    const testTask = createTask({
      title: 'Quick Test Task',
      status: 'To Do'
    });
    
    const comment = addCommentWithMentions(
      testTask.id, 
      'Hello @quick.test@example.com!', 
      getCurrentUserEmail()
    );
    
    console.log('✅ Quick test passed');
    
    // Cleanup
    deleteComment(comment.id);
    deleteTask(testTask.id);
    
    return true;
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
}

console.log('✅ MentionIntegrationTest.gs loaded - Integration tests ready');