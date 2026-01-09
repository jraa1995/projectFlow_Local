/**
 * Simple test script to verify mention formatting property
 */

function testMentionFormattingSimple() {
  console.log('🧪 Simple Mention Formatting Test');
  
  try {
    // Initialize system
    initializeSystem();
    
    // Ensure we have test users
    const testUsers = [
      { email: 'alice@example.com', name: 'Alice Smith', role: 'member' },
      { email: 'bob@example.com', name: 'Bob Jones', role: 'member' }
    ];
    
    testUsers.forEach(userData => {
      const existingUser = getUserByEmail(userData.email);
      if (!existingUser) {
        createUser(userData);
      }
    });
    
    // Test content with mentions
    const testContent = 'Hello @alice@example.com and @bob@example.com, please review this task.';
    
    console.log('Testing content:', testContent);
    
    // Test MentionEngine parsing
    const parseResult = MentionEngine.parseCommentForMentions(testContent);
    
    console.log('Parse result:', JSON.stringify(parseResult, null, 2));
    
    // Verify basic functionality
    if (parseResult.mentionedUsers.length !== 2) {
      throw new Error(`Expected 2 mentioned users, got ${parseResult.mentionedUsers.length}`);
    }
    
    if (!parseResult.formattedText.includes('<span class="mention"')) {
      throw new Error('Formatted text does not contain mention spans');
    }
    
    // Test formatting consistency
    const testData = {
      content: testContent,
      mentionedUsers: parseResult.mentionedUsers
    };
    
    const propertyResult = testMentionFormattingConsistency(testData);
    
    if (propertyResult === true) {
      console.log('✅ Mention formatting property test passed');
      return { success: true };
    } else {
      console.log('❌ Mention formatting property test failed:', propertyResult);
      return { success: false, error: propertyResult };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

function runMentionPropertyTest() {
  return testMentionFormattingSimple();
}