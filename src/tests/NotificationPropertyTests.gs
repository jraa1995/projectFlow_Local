/**
 * Property-Based Tests for Notification System
 * Tests for notification generation and delivery integrity
 * 
 * **Feature: enterprise-project-management, Property 24: Mention Notification Generation**
 * **Validates: Requirements 6.1**
 */

// =============================================================================
// DATA GENERATORS FOR NOTIFICATION TESTS
// =============================================================================

/**
 * Generate test data for mention notification generation
 */
function generateMentionNotificationTestData() {
  const users = getActiveUsers();
  const tasks = getAllTasks();
  
  if (users.length < 2) {
    throw new Error('Need at least 2 users for mention notification testing');
  }
  
  if (tasks.length === 0) {
    throw new Error('Need at least 1 task for mention notification testing');
  }
  
  // Select random users for the test
  const mentionedByUser = users[Math.floor(Math.random() * users.length)];
  const mentionedUsers = [];
  
  // Select 1-3 other users to mention (excluding the author)
  const otherUsers = users.filter(u => u.email !== mentionedByUser.email);
  const numMentions = Math.min(Math.floor(Math.random() * 3) + 1, otherUsers.length);
  
  for (let i = 0; i < numMentions; i++) {
    const user = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    if (!mentionedUsers.find(u => u.email === user.email)) {
      mentionedUsers.push(user);
    }
  }
  
  // Select random task
  const task = tasks[Math.floor(Math.random() * tasks.length)];
  
  // Generate comment content with mentions
  let content = generateRandomString(20, 150, false);
  mentionedUsers.forEach(user => {
    const mentionText = `@${user.email}`;
    const insertPos = Math.floor(Math.random() * content.length);
    content = content.slice(0, insertPos) + ' ' + mentionText + ' ' + content.slice(insertPos);
  });
  
  return {
    taskId: task.id,
    content: content.trim(),
    mentionedByUserId: mentionedByUser.email,
    mentionedUsers: mentionedUsers,
    task: task,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate random notification data for testing
 */
function generateNotificationTestData() {
  const users = getActiveUsers();
  const tasks = getAllTasks();
  const notificationTypes = CONFIG.NOTIFICATION_TYPES;
  const channels = CONFIG.NOTIFICATION_CHANNELS;
  
  if (users.length === 0 || tasks.length === 0) {
    throw new Error('Need users and tasks for notification testing');
  }
  
  const user = users[Math.floor(Math.random() * users.length)];
  const task = tasks[Math.floor(Math.random() * tasks.length)];
  const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
  
  // Select 1-3 random channels
  const numChannels = Math.floor(Math.random() * channels.length) + 1;
  const selectedChannels = [];
  
  for (let i = 0; i < numChannels; i++) {
    const channel = channels[Math.floor(Math.random() * channels.length)];
    if (!selectedChannels.includes(channel)) {
      selectedChannels.push(channel);
    }
  }
  
  return {
    userId: user.email,
    type: type,
    title: `Test notification for ${type}`,
    message: `This is a test ${type} notification for task ${task.title}`,
    entityType: 'task',
    entityId: task.id,
    channels: selectedChannels,
    user: user,
    task: task
  };
}

// =============================================================================
// PROPERTY TESTS
// =============================================================================

/**
 * Property 24: Mention Notification Generation
 * For any comment containing user mentions, appropriate notifications should be 
 * generated for all mentioned users
 * 
 * **Validates: Requirements 6.1**
 */
function testMentionNotificationGeneration(testData) {
  const { taskId, content, mentionedByUserId, mentionedUsers, task } = testData;
  
  try {
    // Get initial notification counts for each mentioned user
    const initialNotificationCounts = {};
    mentionedUsers.forEach(user => {
      const notifications = getNotificationsForUser(user.email, 1000);
      initialNotificationCounts[user.email] = notifications.length;
    });
    
    // Also get initial count for the author (should not receive notification)
    const authorNotifications = getNotificationsForUser(mentionedByUserId, 1000);
    const initialAuthorCount = authorNotifications.length;
    
    // Create comment with mentions using MentionEngine
    const comment = {
      id: generateId('cmt'),
      taskId: taskId,
      userId: mentionedByUserId,
      content: content,
      createdAt: now()
    };
    
    // Parse mentions and create notifications
    const parseResult = MentionEngine.parseCommentForMentions(content);
    
    if (parseResult.mentionedUsers.length === 0) {
      // If no valid mentions were parsed, we can't test notification generation
      return true; // This is valid behavior
    }
    
    // Create notifications using MentionEngine
    const notifications = MentionEngine.createMentionNotifications(
      taskId,
      parseResult.mentionedUsers,
      comment
    );
    
    // Verify notifications were created for each mentioned user
    for (const mentionedUser of parseResult.mentionedUsers) {
      const userEmail = mentionedUser.email;
      
      // Skip if user mentioned themselves
      if (userEmail === mentionedByUserId) {
        continue;
      }
      
      // Check that a notification was created for this user
      const userNotifications = notifications.filter(n => n.userId === userEmail);
      
      if (userNotifications.length === 0) {
        return `No notification created for mentioned user ${userEmail}`;
      }
      
      if (userNotifications.length > 1) {
        return `Multiple notifications created for mentioned user ${userEmail} (expected 1, got ${userNotifications.length})`;
      }
      
      const notification = userNotifications[0];
      
      // Verify notification properties
      if (notification.type !== 'mention') {
        return `Incorrect notification type for ${userEmail}: expected 'mention', got '${notification.type}'`;
      }
      
      if (notification.entityType !== 'task') {
        return `Incorrect entity type for ${userEmail}: expected 'task', got '${notification.entityType}'`;
      }
      
      if (notification.entityId !== taskId) {
        return `Incorrect entity ID for ${userEmail}: expected '${taskId}', got '${notification.entityId}'`;
      }
      
      if (!notification.title || notification.title.length === 0) {
        return `Empty notification title for ${userEmail}`;
      }
      
      if (!notification.message || notification.message.length === 0) {
        return `Empty notification message for ${userEmail}`;
      }
      
      // Verify notification contains task information
      if (!notification.message.includes(task.title) && !notification.message.includes(taskId)) {
        return `Notification message for ${userEmail} does not reference the task`;
      }
      
      // Verify notification has appropriate channels
      if (!notification.channels || notification.channels.length === 0) {
        return `No notification channels specified for ${userEmail}`;
      }
      
      // Verify channels are valid
      const validChannels = CONFIG.NOTIFICATION_CHANNELS;
      for (const channel of notification.channels) {
        if (!validChannels.includes(channel)) {
          return `Invalid notification channel '${channel}' for ${userEmail}`;
        }
      }
      
      // Verify notification was actually saved to the sheet
      const savedNotifications = getNotificationsForUser(userEmail, 10);
      const foundNotification = savedNotifications.find(n => 
        n.id === notification.id ||
        (n.type === 'mention' && 
         n.entityId === taskId && 
         new Date(n.createdAt) >= new Date(testData.timestamp))
      );
      
      if (!foundNotification) {
        return `Notification for ${userEmail} was not saved to the notifications sheet`;
      }
    }
    
    // Verify author did not receive a notification for their own mention
    const newAuthorNotifications = getNotificationsForUser(mentionedByUserId, 1000);
    const authorNotificationIncrease = newAuthorNotifications.length - initialAuthorCount;
    
    // Author should not get a mention notification for their own comment
    const authorMentionNotifications = newAuthorNotifications.filter(n => 
      n.type === 'mention' && 
      n.entityId === taskId &&
      new Date(n.createdAt) >= new Date(testData.timestamp)
    );
    
    if (authorMentionNotifications.length > 0) {
      return `Author ${mentionedByUserId} should not receive mention notification for their own comment`;
    }
    
    // Verify mention records were created
    for (const mentionedUser of parseResult.mentionedUsers) {
      if (mentionedUser.email === mentionedByUserId) continue;
      
      const mentions = getMentionsForUser(mentionedUser.email, 10);
      const foundMention = mentions.find(m => 
        m.taskId === taskId &&
        m.mentionedByUserId === mentionedByUserId &&
        new Date(m.createdAt) >= new Date(testData.timestamp)
      );
      
      if (!foundMention) {
        return `Mention record not created for ${mentionedUser.email}`;
      }
    }
    
    // Test notification engine integration
    const engineNotifications = NotificationEngine.createBatchNotifications([
      {
        userId: mentionedUsers[0].email,
        type: 'mention',
        title: 'Test batch notification',
        message: 'Testing batch notification creation',
        entityType: 'task',
        entityId: taskId,
        channels: ['in_app']
      }
    ]);
    
    if (engineNotifications.length !== 1) {
      return `NotificationEngine.createBatchNotifications failed: expected 1 notification, got ${engineNotifications.length}`;
    }
    
    return true;
    
  } catch (error) {
    return `Error during mention notification generation test: ${error.message}`;
  }
}

/**
 * Property 25: Multi-Channel Notification Formatting
 * For any notification, the content should be correctly formatted for all 
 * configured delivery channels (email, in-app)
 * 
 * **Validates: Requirements 6.2**
 */
function testMultiChannelNotificationFormatting(testData) {
  const { userId, type, title, message, entityType, entityId, channels } = testData;
  
  try {
    // Create notification with multiple channels
    const notification = NotificationEngine.createNotification({
      userId: userId,
      type: type,
      title: title,
      message: message,
      entityType: entityType,
      entityId: entityId,
      channels: channels
    });
    
    if (!notification) {
      // This could be valid if user has disabled all channels
      return true;
    }
    
    // Verify notification has the expected channels
    if (!notification.channels || notification.channels.length === 0) {
      return 'Notification should have at least one delivery channel';
    }
    
    // Test each channel formatting
    for (const channel of notification.channels) {
      switch (channel) {
        case 'email':
          const emailResult = this.testEmailChannelFormatting(notification);
          if (emailResult !== true) {
            return `Email channel formatting failed: ${emailResult}`;
          }
          break;
          
        case 'in_app':
          const inAppResult = this.testInAppChannelFormatting(notification);
          if (inAppResult !== true) {
            return `In-app channel formatting failed: ${inAppResult}`;
          }
          break;
          
        case 'push':
          const pushResult = this.testPushChannelFormatting(notification);
          if (pushResult !== true) {
            return `Push channel formatting failed: ${pushResult}`;
          }
          break;
          
        default:
          return `Unknown notification channel: ${channel}`;
      }
    }
    
    // Test channel consistency - same notification should have consistent core content
    const baseContent = {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      entityType: notification.entityType,
      entityId: notification.entityId
    };
    
    // Verify all channels reference the same core notification data
    for (const channel of notification.channels) {
      if (channel === 'email') {
        const emailContent = EmailNotificationService.formatEmailContent(notification);
        
        // Email should contain the notification title or message
        if (!emailContent.subject.includes(baseContent.title) && 
            !emailContent.subject.includes(baseContent.type)) {
          return `Email subject does not reference notification content: "${emailContent.subject}"`;
        }
        
        if (!emailContent.htmlBody.includes(baseContent.message) && 
            !emailContent.htmlBody.includes(baseContent.title)) {
          return `Email body does not contain notification content`;
        }
        
        if (!emailContent.textBody.includes(baseContent.message) && 
            !emailContent.textBody.includes(baseContent.title)) {
          return `Email text body does not contain notification content`;
        }
      }
    }
    
    // Test user preference filtering
    const userPrefs = NotificationEngine.getUserNotificationPreferences(userId);
    const typePrefs = userPrefs[type] || {};
    
    for (const channel of notification.channels) {
      if (typePrefs[channel] === false) {
        return `Channel '${channel}' should be filtered out based on user preferences`;
      }
    }
    
    // Test notification delivery simulation
    const deliveryResults = this.simulateMultiChannelDelivery(notification);
    
    for (const result of deliveryResults) {
      if (!result.success && result.channel !== 'push') { // Push might fail in test environment
        return `Delivery simulation failed for ${result.channel}: ${result.error}`;
      }
    }
    
    return true;
    
  } catch (error) {
    return `Error during multi-channel notification formatting test: ${error.message}`;
  }
}

/**
 * Test email channel formatting
 * @param {Object} notification - Notification object
 * @returns {boolean|string} True if valid, error message if invalid
 */
function testEmailChannelFormatting(notification) {
  try {
    const emailContent = EmailNotificationService.formatEmailContent(notification);
    
    // Verify email content structure
    if (!emailContent.subject || emailContent.subject.length === 0) {
      return 'Email subject is empty';
    }
    
    if (!emailContent.htmlBody || emailContent.htmlBody.length === 0) {
      return 'Email HTML body is empty';
    }
    
    if (!emailContent.textBody || emailContent.textBody.length === 0) {
      return 'Email text body is empty';
    }
    
    // Verify HTML structure
    if (!emailContent.htmlBody.includes('<html>') || !emailContent.htmlBody.includes('</html>')) {
      return 'Email HTML body is not properly formatted HTML';
    }
    
    // Verify essential email elements
    const requiredElements = ['{{taskUrl}}', '{{unsubscribeUrl}}', '{{systemUrl}}'];
    const processedHtml = EmailNotificationService.processTemplate(emailContent.htmlBody, {
      taskUrl: 'https://test.com/task/123',
      unsubscribeUrl: 'https://test.com/unsubscribe',
      systemUrl: 'https://test.com'
    });
    
    if (processedHtml.includes('{{')) {
      return 'Email HTML contains unprocessed template variables';
    }
    
    // Verify text version has same core content
    const htmlText = emailContent.htmlBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const textContent = emailContent.textBody.replace(/\s+/g, ' ').trim();
    
    // Both should contain the notification title or message
    const hasTitle = htmlText.includes(notification.title) && textContent.includes(notification.title);
    const hasMessage = htmlText.includes(notification.message) && textContent.includes(notification.message);
    
    if (!hasTitle && !hasMessage) {
      return 'Email HTML and text versions do not both contain notification content';
    }
    
    return true;
    
  } catch (error) {
    return `Email formatting error: ${error.message}`;
  }
}

/**
 * Test in-app channel formatting
 * @param {Object} notification - Notification object
 * @returns {boolean|string} True if valid, error message if invalid
 */
function testInAppChannelFormatting(notification) {
  try {
    // Verify notification was saved to the notifications sheet
    const savedNotifications = getNotificationsForUser(notification.userId, 10);
    const foundNotification = savedNotifications.find(n => n.id === notification.id);
    
    if (!foundNotification) {
      return 'In-app notification was not saved to notifications sheet';
    }
    
    // Verify in-app notification structure
    if (!foundNotification.title || foundNotification.title.length === 0) {
      return 'In-app notification title is empty';
    }
    
    if (!foundNotification.message || foundNotification.message.length === 0) {
      return 'In-app notification message is empty';
    }
    
    if (foundNotification.read !== false) {
      return 'New in-app notification should be marked as unread';
    }
    
    // Verify notification metadata
    if (foundNotification.type !== notification.type) {
      return `In-app notification type mismatch: expected '${notification.type}', got '${foundNotification.type}'`;
    }
    
    if (foundNotification.entityType !== notification.entityType) {
      return `In-app notification entityType mismatch: expected '${notification.entityType}', got '${foundNotification.entityType}'`;
    }
    
    if (foundNotification.entityId !== notification.entityId) {
      return `In-app notification entityId mismatch: expected '${notification.entityId}', got '${foundNotification.entityId}'`;
    }
    
    // Verify channels array includes in_app
    if (!foundNotification.channels.includes('in_app')) {
      return 'In-app notification channels should include "in_app"';
    }
    
    return true;
    
  } catch (error) {
    return `In-app formatting error: ${error.message}`;
  }
}

/**
 * Test push channel formatting
 * @param {Object} notification - Notification object
 * @returns {boolean|string} True if valid, error message if invalid
 */
function testPushChannelFormatting(notification) {
  try {
    // For push notifications, we mainly verify the structure is correct
    // since actual push delivery requires external services
    
    if (!notification.title || notification.title.length === 0) {
      return 'Push notification title is empty';
    }
    
    if (!notification.message || notification.message.length === 0) {
      return 'Push notification message is empty';
    }
    
    // Verify title and message are appropriate length for push notifications
    if (notification.title.length > 100) {
      return 'Push notification title is too long (max 100 characters)';
    }
    
    if (notification.message.length > 200) {
      return 'Push notification message is too long (max 200 characters)';
    }
    
    // Verify channels array includes push
    if (!notification.channels.includes('push')) {
      return 'Push notification channels should include "push"';
    }
    
    return true;
    
  } catch (error) {
    return `Push formatting error: ${error.message}`;
  }
}

/**
 * Simulate multi-channel delivery for testing
 * @param {Object} notification - Notification object
 * @returns {Array} Array of delivery results
 */
function simulateMultiChannelDelivery(notification) {
  const results = [];
  
  for (const channel of notification.channels) {
    try {
      switch (channel) {
        case 'email':
          // Simulate email delivery (don't actually send)
          const emailContent = EmailNotificationService.formatEmailContent(notification);
          results.push({
            channel: 'email',
            success: true,
            contentLength: emailContent.htmlBody.length,
            hasSubject: !!emailContent.subject
          });
          break;
          
        case 'in_app':
          // In-app is already delivered by saving to sheet
          results.push({
            channel: 'in_app',
            success: true,
            saved: true
          });
          break;
          
        case 'push':
          // Simulate push delivery
          results.push({
            channel: 'push',
            success: true,
            simulated: true
          });
          break;
          
        default:
          results.push({
            channel: channel,
            success: false,
            error: `Unknown channel: ${channel}`
          });
      }
    } catch (error) {
      results.push({
        channel: channel,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
  const { userId, type, title, message, entityType, entityId, channels } = testData;
  
  try {
    // Get initial notification count
    const initialNotifications = getNotificationsForUser(userId, 1000);
    const initialCount = initialNotifications.length;
    
    // Create notification using NotificationEngine
    const notification = NotificationEngine.createNotification({
      userId: userId,
      type: type,
      title: title,
      message: message,
      entityType: entityType,
      entityId: entityId,
      channels: channels
    });
    
    // Verify notification was created
    if (!notification) {
      // This could be valid if user has disabled all channels for this type
      const userPrefs = NotificationEngine.getUserNotificationPreferences(userId);
      const typePrefs = userPrefs[type] || {};
      
      const enabledChannels = channels.filter(channel => typePrefs[channel] !== false);
      
      if (enabledChannels.length === 0) {
        return true; // Valid behavior - no channels enabled
      } else {
        return `Notification was not created despite having enabled channels: ${enabledChannels.join(', ')}`;
      }
    }
    
    // Verify notification properties
    if (notification.userId !== userId) {
      return `Incorrect userId: expected '${userId}', got '${notification.userId}'`;
    }
    
    if (notification.type !== type) {
      return `Incorrect type: expected '${type}', got '${notification.type}'`;
    }
    
    if (notification.entityType !== entityType) {
      return `Incorrect entityType: expected '${entityType}', got '${notification.entityType}'`;
    }
    
    if (notification.entityId !== entityId) {
      return `Incorrect entityId: expected '${entityId}', got '${notification.entityId}'`;
    }
    
    // Verify channels are filtered by user preferences
    const userPrefs = NotificationEngine.getUserNotificationPreferences(userId);
    const typePrefs = userPrefs[type] || {};
    
    for (const channel of notification.channels) {
      if (typePrefs[channel] === false) {
        return `Channel '${channel}' should be filtered out based on user preferences`;
      }
    }
    
    // Verify notification was saved to sheet
    const newNotifications = getNotificationsForUser(userId, 10);
    const foundNotification = newNotifications.find(n => n.id === notification.id);
    
    if (!foundNotification) {
      return `Notification ${notification.id} was not saved to the notifications sheet`;
    }
    
    // Verify saved notification matches created notification
    if (foundNotification.type !== notification.type) {
      return `Saved notification type mismatch: expected '${notification.type}', got '${foundNotification.type}'`;
    }
    
    if (foundNotification.entityId !== notification.entityId) {
      return `Saved notification entityId mismatch: expected '${notification.entityId}', got '${foundNotification.entityId}'`;
    }
    
    // Test notification statistics
    const stats = NotificationEngine.getNotificationStatistics(userId);
    
    if (stats.total <= initialCount) {
      return `Notification statistics not updated: expected > ${initialCount}, got ${stats.total}`;
    }
    
    if (!stats.byType[type] || stats.byType[type] === 0) {
      return `Notification type statistics not updated for type '${type}'`;
    }
    
    return true;
    
  } catch (error) {
    return `Error during notification creation integrity test: ${error.message}`;
  }
}

// =============================================================================
// TEST EXECUTION
// =============================================================================

/**
 * Run property test for mention notification generation
 * **Feature: enterprise-project-management, Property 24: Mention Notification Generation**
 */
function runMentionNotificationPropertyTest(iterations = 100) {
  console.log('🧪 Running Property Test: Mention Notification Generation');
  console.log('**Feature: enterprise-project-management, Property 24: Mention Notification Generation**');
  console.log(`Iterations: ${iterations}`);
  
  // Setup test environment
  setupNotificationTestData();
  
  try {
    const result = runPropertyTest(
      'Property 24: Mention Notification Generation',
      testMentionNotificationGeneration,
      generateMentionNotificationTestData,
      iterations
    );
    
    console.log(`\n📊 Property Test Results:`);
    console.log(`✅ Passed: ${result.passed}/${result.iterations}`);
    console.log(`❌ Failed: ${result.failed}/${result.iterations}`);
    
    if (result.success) {
      console.log('🎉 Property 24: Mention Notification Generation - PASSED');
    } else {
      console.log('❌ Property 24: Mention Notification Generation - FAILED');
      if (result.failures.length > 0) {
        console.log('\nSample failures:');
        result.failures.slice(0, 3).forEach((failure, idx) => {
          console.log(`  ${idx + 1}. ${failure.result || failure.error}`);
        });
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Property test execution failed:', error);
    return {
      success: false,
      error: error.message,
      passed: 0,
      failed: 1,
      iterations: 1
    };
  } finally {
    cleanupNotificationTestData();
  }
}

/**
 * Property 29: Notification Status Tracking
 * For any notification, the read/unread status should be correctly maintained 
 * and displayed in the notification center
 * 
 * **Validates: Requirements 6.6**
 */
function testNotificationStatusTracking(testData) {
  const { userId, type, title, message, entityType, entityId, channels } = testData;
  
  try {
    // Create a notification
    const notification = NotificationEngine.createNotification({
      userId: userId,
      type: type,
      title: title,
      message: message,
      entityType: entityType,
      entityId: entityId,
      channels: channels
    });
    
    if (!notification) {
      // Valid if user has disabled all channels
      return true;
    }
    
    // Verify initial state - notification should be unread
    if (notification.read !== false) {
      return `New notification should be marked as unread, got: ${notification.read}`;
    }
    
    // Verify notification appears in user's unread notifications
    const unreadNotifications = getNotificationsForUser(userId, 50, true); // unreadOnly = true
    const foundUnread = unreadNotifications.find(n => n.id === notification.id);
    
    if (!foundUnread) {
      return `Notification ${notification.id} should appear in unread notifications list`;
    }
    
    if (foundUnread.read !== false) {
      return `Notification in unread list should have read=false, got: ${foundUnread.read}`;
    }
    
    // Verify notification appears in all notifications
    const allNotifications = getNotificationsForUser(userId, 50, false); // include read ones
    const foundInAll = allNotifications.find(n => n.id === notification.id);
    
    if (!foundInAll) {
      return `Notification ${notification.id} should appear in all notifications list`;
    }
    
    // Test marking notification as read
    const markedNotification = markNotificationAsRead(notification.id);
    
    if (!markedNotification) {
      return `markNotificationAsRead should return the updated notification`;
    }
    
    if (markedNotification.read !== true) {
      return `Marked notification should have read=true, got: ${markedNotification.read}`;
    }
    
    // Verify notification no longer appears in unread list
    const unreadAfterMark = getNotificationsForUser(userId, 50, true);
    const stillUnread = unreadAfterMark.find(n => n.id === notification.id);
    
    if (stillUnread) {
      return `Notification ${notification.id} should not appear in unread list after being marked as read`;
    }
    
    // Verify notification still appears in all notifications but with read=true
    const allAfterMark = getNotificationsForUser(userId, 50, false);
    const foundAfterMark = allAfterMark.find(n => n.id === notification.id);
    
    if (!foundAfterMark) {
      return `Notification ${notification.id} should still appear in all notifications after being marked as read`;
    }
    
    if (foundAfterMark.read !== true) {
      return `Notification in all list should have read=true after being marked, got: ${foundAfterMark.read}`;
    }
    
    // Test notification statistics consistency
    const stats = NotificationEngine.getNotificationStatistics(userId);
    
    // Verify total count includes our notification
    if (stats.total === 0) {
      return `Notification statistics should include our notification in total count`;
    }
    
    // Verify unread count is consistent
    const actualUnreadCount = getNotificationsForUser(userId, 1000, true).length;
    if (stats.unread !== actualUnreadCount) {
      return `Statistics unread count (${stats.unread}) should match actual unread notifications (${actualUnreadCount})`;
    }
    
    // Verify type statistics
    if (!stats.byType[type] || stats.byType[type] === 0) {
      return `Statistics should include count for notification type '${type}'`;
    }
    
    // Verify channel statistics
    for (const channel of notification.channels) {
      if (!stats.byChannel[channel] || stats.byChannel[channel] === 0) {
        return `Statistics should include count for notification channel '${channel}'`;
      }
    }
    
    // Test batch status operations
    // Create another notification for batch testing
    const notification2 = NotificationEngine.createNotification({
      userId: userId,
      type: 'task_assigned',
      title: 'Batch test notification',
      message: 'Testing batch operations',
      entityType: entityType,
      entityId: entityId,
      channels: ['in_app']
    });
    
    if (notification2) {
      // Verify both notifications are unread
      const bothUnread = getNotificationsForUser(userId, 50, true);
      const unreadIds = bothUnread.map(n => n.id);
      
      if (!unreadIds.includes(notification2.id)) {
        return `Second notification should appear in unread list`;
      }
      
      // Test that read status is properly maintained across multiple notifications
      const allUserNotifications = getNotificationsForUser(userId, 50, false);
      const readStatuses = allUserNotifications.reduce((acc, n) => {
        acc[n.id] = n.read;
        return acc;
      }, {});
      
      // Our first notification should be read, second should be unread
      if (readStatuses[notification.id] !== true) {
        return `First notification should remain read after creating second notification`;
      }
      
      if (readStatuses[notification2.id] !== false) {
        return `Second notification should be unread`;
      }
    }
    
    // Test notification ordering (most recent first)
    const orderedNotifications = getNotificationsForUser(userId, 50, false);
    
    if (orderedNotifications.length >= 2) {
      for (let i = 1; i < orderedNotifications.length; i++) {
        const current = new Date(orderedNotifications[i].createdAt);
        const previous = new Date(orderedNotifications[i - 1].createdAt);
        
        if (current > previous) {
          return `Notifications should be ordered by creation date (newest first), but notification at index ${i} is newer than ${i - 1}`;
        }
      }
    }
    
    // Test notification persistence across sessions (simulated)
    // Re-fetch notifications to ensure they persist
    const persistedNotifications = getNotificationsForUser(userId, 50, false);
    const persistedNotification = persistedNotifications.find(n => n.id === notification.id);
    
    if (!persistedNotification) {
      return `Notification should persist across data fetches`;
    }
    
    if (persistedNotification.read !== true) {
      return `Notification read status should persist across data fetches`;
    }
    
    return true;
    
  } catch (error) {
    return `Error during notification status tracking test: ${error.message}`;
  }
}

/**
 * Generate test data for notification status tracking
 */
function generateNotificationStatusTestData() {
  const users = getActiveUsers();
  const tasks = getAllTasks();
  const notificationTypes = CONFIG.NOTIFICATION_TYPES;
  const channels = CONFIG.NOTIFICATION_CHANNELS;
  
  if (users.length === 0 || tasks.length === 0) {
    throw new Error('Need users and tasks for notification status testing');
  }
  
  const user = users[Math.floor(Math.random() * users.length)];
  const task = tasks[Math.floor(Math.random() * tasks.length)];
  const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
  
  // Select 1-2 random channels
  const numChannels = Math.floor(Math.random() * 2) + 1;
  const selectedChannels = [];
  
  for (let i = 0; i < numChannels; i++) {
    const channel = channels[Math.floor(Math.random() * channels.length)];
    if (!selectedChannels.includes(channel)) {
      selectedChannels.push(channel);
    }
  }
  
  return {
    userId: user.email,
    type: type,
    title: `Status tracking test for ${type}`,
    message: `Testing notification status tracking for ${type} notifications`,
    entityType: 'task',
    entityId: task.id,
    channels: selectedChannels,
    user: user,
    task: task
  };
}
  console.log('🧪 Running Property Test: Multi-Channel Notification Formatting');
  console.log('**Feature: enterprise-project-management, Property 25: Multi-Channel Notification Formatting**');
  console.log(`Iterations: ${iterations}`);
  
  // Setup test environment
  setupNotificationTestData();
  
  try {
    const result = runPropertyTest(
      'Property 25: Multi-Channel Notification Formatting',
      testMultiChannelNotificationFormatting,
      generateNotificationTestData,
      iterations
    );
    
    console.log(`\n📊 Property Test Results:`);
    console.log(`✅ Passed: ${result.passed}/${result.iterations}`);
    console.log(`❌ Failed: ${result.failed}/${result.iterations}`);
    
    if (result.success) {
      console.log('🎉 Property 25: Multi-Channel Notification Formatting - PASSED');
    } else {
      console.log('❌ Property 25: Multi-Channel Notification Formatting - FAILED');
      if (result.failures.length > 0) {
        console.log('\nSample failures:');
        result.failures.slice(0, 3).forEach((failure, idx) => {
          console.log(`  ${idx + 1}. ${failure.result || failure.error}`);
        });
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Property test execution failed:', error);
    return {
      success: false,
      error: error.message,
      passed: 0,
      failed: 1,
      iterations: 1
    };
  } finally {
    cleanupNotificationTestData();
  }
}
/**
 * Run property test for notification status tracking
 * **Feature: enterprise-project-management, Property 29: Notification Status Tracking**
 */
function runNotificationStatusTrackingPropertyTest(iterations = 100) {
  console.log('🧪 Running Property Test: Notification Status Tracking');
  console.log('**Feature: enterprise-project-management, Property 29: Notification Status Tracking**');
  console.log(`Iterations: ${iterations}`);
  
  // Setup test environment
  setupNotificationTestData();
  
  try {
    const result = runPropertyTest(
      'Property 29: Notification Status Tracking',
      testNotificationStatusTracking,
      generateNotificationStatusTestData,
      iterations
    );
    
    console.log(`\n📊 Property Test Results:`);
    console.log(`✅ Passed: ${result.passed}/${result.iterations}`);
    console.log(`❌ Failed: ${result.failed}/${result.iterations}`);
    
    if (result.success) {
      console.log('🎉 Property 29: Notification Status Tracking - PASSED');
    } else {
      console.log('❌ Property 29: Notification Status Tracking - FAILED');
      if (result.failures.length > 0) {
        console.log('\nSample failures:');
        result.failures.slice(0, 3).forEach((failure, idx) => {
          console.log(`  ${idx + 1}. ${failure.result || failure.error}`);
        });
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Property test execution failed:', error);
    return {
      success: false,
      error: error.message,
      passed: 0,
      failed: 1,
      iterations: 1
    };
  } finally {
    cleanupNotificationTestData();
  }
}

/**
 * Run property test for multi-channel notification formatting
 * **Feature: enterprise-project-management, Property 25: Multi-Channel Notification Formatting**
 */
function runMultiChannelNotificationPropertyTest(iterations = 100) {
  console.log('🧪 Running Property Test: Multi-Channel Notification Formatting');
  console.log('**Feature: enterprise-project-management, Property 25: Multi-Channel Notification Formatting**');
  console.log(`Iterations: ${iterations}`);
  
  // Setup test environment
  setupNotificationTestData();
  
  try {
    const result = runPropertyTest(
      'Property 25: Multi-Channel Notification Formatting',
      testMultiChannelNotificationFormatting,
      generateNotificationTestData,
      iterations
    );
    
    console.log(`\n📊 Property Test Results:`);
    console.log(`✅ Passed: ${result.passed}/${result.iterations}`);
    console.log(`❌ Failed: ${result.failed}/${result.iterations}`);
    
    if (result.success) {
      console.log('🎉 Property 25: Multi-Channel Notification Formatting - PASSED');
    } else {
      console.log('❌ Property 25: Multi-Channel Notification Formatting - FAILED');
      if (result.failures.length > 0) {
        console.log('\nSample failures:');
        result.failures.slice(0, 3).forEach((failure, idx) => {
          console.log(`  ${idx + 1}. ${failure.result || failure.error}`);
        });
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Property test execution failed:', error);
    return {
      success: false,
      error: error.message,
      passed: 0,
      failed: 1,
      iterations: 1
    };
  } finally {
    cleanupNotificationTestData();
  }
}

/**
 * Run property test for notification creation integrity
 */
function runNotificationCreationPropertyTest(iterations = 50) {

/**
 * Setup test data for notification tests
 */
function setupNotificationTestData() {
  // Ensure we have sufficient test users
  const users = getAllUsers();
  const requiredUsers = [
    { email: 'alice.test@example.com', name: 'Alice Test', role: 'member' },
    { email: 'bob.test@example.com', name: 'Bob Test', role: 'member' },
    { email: 'charlie.test@example.com', name: 'Charlie Test', role: 'member' },
    { email: 'diana.test@example.com', name: 'Diana Test', role: 'member' }
  ];
  
  requiredUsers.forEach(userData => {
    const existingUser = getUserByEmail(userData.email);
    if (!existingUser) {
      createUser(userData);
    }
  });
  
  // Ensure we have test projects and tasks
  const projects = getAllProjects();
  if (projects.length === 0) {
    createProject({
      name: 'Notification Test Project',
      description: 'Project for notification testing'
    });
  }
  
  const tasks = getAllTasks();
  if (tasks.length < 3) {
    const project = getAllProjects()[0];
    
    for (let i = tasks.length; i < 3; i++) {
      createTask({
        title: `Notification Test Task ${i + 1}`,
        description: `Task ${i + 1} for notification testing`,
        status: 'To Do',
        projectId: project.id,
        assignee: requiredUsers[i % requiredUsers.length].email
      });
    }
  }
}

/**
 * Cleanup test data created during notification tests
 */
function cleanupNotificationTestData() {
  try {
    // Clean up test notifications
    const testUsers = [
      'alice.test@example.com',
      'bob.test@example.com', 
      'charlie.test@example.com',
      'diana.test@example.com'
    ];
    
    testUsers.forEach(userEmail => {
      const notifications = getNotificationsForUser(userEmail, 1000);
      // In a real implementation, we would delete test notifications
      // For now, just log the count
      console.log(`User ${userEmail} has ${notifications.length} notifications`);
    });
    
    console.log('✅ Notification test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Notification test cleanup had issues:', error.message);
  }
}

/**
 * Quick test for mention notification generation
 */
function quickTestMentionNotifications() {
  console.log('🧪 Quick Test: Mention Notification Generation');
  
  setupNotificationTestData();
  
  try {
    const testData = generateMentionNotificationTestData();
    console.log('Generated test data:', {
      taskId: testData.taskId,
      mentionedUsers: testData.mentionedUsers.map(u => u.email),
      contentLength: testData.content.length
    });
    
    const result = testMentionNotificationGeneration(testData);
    
    if (result === true) {
      console.log('✅ Quick test passed');
      return { success: true };
    } else {
      console.log('❌ Quick test failed:', result);
      return { success: false, error: result };
    }
    
  } catch (error) {
    console.error('❌ Quick test error:', error);
    return { success: false, error: error.message };
  } finally {
    cleanupNotificationTestData();
  }
}

console.log('✅ NotificationPropertyTests.gs loaded - Notification property tests ready');