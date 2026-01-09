/**
 * NotificationEngine - Enterprise Notification System
 * Handles notification creation, queuing, and multi-channel delivery
 * 
 * Features:
 * - Multi-channel notification support (email, in-app, push)
 * - User preference handling for notification types
 * - Notification queuing and batch processing
 * - Template-based notification formatting
 * - Retry logic and error handling
 */

class NotificationEngine {
  
  /**
   * Create a notification for a user
   * @param {Object} notificationData - Notification configuration
   * @returns {Object} Created notification object
   */
  static createNotification(notificationData) {
    // Validate required fields
    if (!notificationData.userId) {
      throw new Error('userId is required for notification creation');
    }
    
    if (!notificationData.type) {
      throw new Error('type is required for notification creation');
    }
    
    // Get user preferences for this notification type
    const userPreferences = this.getUserNotificationPreferences(notificationData.userId);
    const typePreferences = userPreferences[notificationData.type] || {};
    
    // Determine delivery channels based on preferences
    let channels = notificationData.channels || ['in_app'];
    if (Array.isArray(channels)) {
      // Filter channels based on user preferences
      channels = channels.filter(channel => {
        return typePreferences[channel] !== false; // Default to true unless explicitly disabled
      });
    }
    
    // If no channels are enabled, skip notification creation
    if (channels.length === 0) {
      console.log(`Skipping notification for ${notificationData.userId} - all channels disabled for type ${notificationData.type}`);
      return null;
    }
    
    // Create notification record
    const notification = createNotification({
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title || this.getDefaultTitle(notificationData.type),
      message: notificationData.message || '',
      entityType: notificationData.entityType || '',
      entityId: notificationData.entityId || '',
      channels: channels,
      scheduledFor: notificationData.scheduledFor || now()
    });
    
    // Queue for immediate delivery if scheduled for now or past
    const scheduledTime = new Date(notification.scheduledFor);
    const currentTime = new Date();
    
    if (scheduledTime <= currentTime) {
      this.queueNotificationForDelivery(notification);
    }
    
    return notification;
  }
  
  /**
   * Queue multiple notifications for batch processing
   * @param {Array} notifications - Array of notification data objects
   * @returns {Array} Array of created notification objects
   */
  static createBatchNotifications(notifications) {
    if (!Array.isArray(notifications)) {
      throw new Error('notifications must be an array');
    }
    
    const createdNotifications = [];
    const deliveryQueue = [];
    
    notifications.forEach(notificationData => {
      try {
        const notification = this.createNotification(notificationData);
        if (notification) {
          createdNotifications.push(notification);
          
          // Check if should be delivered immediately
          const scheduledTime = new Date(notification.scheduledFor);
          const currentTime = new Date();
          
          if (scheduledTime <= currentTime) {
            deliveryQueue.push(notification);
          }
        }
      } catch (error) {
        console.error('Failed to create notification:', error, notificationData);
      }
    });
    
    // Process delivery queue in batch
    if (deliveryQueue.length > 0) {
      this.processBatchDelivery(deliveryQueue);
    }
    
    return createdNotifications;
  }
  
  /**
   * Get user notification preferences
   * @param {string} userId - User email
   * @returns {Object} User preferences object
   */
  static getUserNotificationPreferences(userId) {
    // For now, return default preferences
    // In a full implementation, this would read from a user preferences sheet
    const defaultPreferences = {
      mention: {
        email: true,
        in_app: true,
        push: false
      },
      task_assigned: {
        email: true,
        in_app: true,
        push: false
      },
      task_updated: {
        email: false,
        in_app: true,
        push: false
      },
      deadline_approaching: {
        email: true,
        in_app: true,
        push: true
      },
      project_update: {
        email: false,
        in_app: true,
        push: false
      },
      comment_added: {
        email: false,
        in_app: true,
        push: false
      }
    };
    
    return defaultPreferences;
  }
  
  /**
   * Update user notification preferences
   * @param {string} userId - User email
   * @param {Object} preferences - New preferences object
   * @returns {Object} Updated preferences
   */
  static updateUserNotificationPreferences(userId, preferences) {
    // In a full implementation, this would save to a user preferences sheet
    // For now, we'll just validate the structure and return it
    
    const validTypes = CONFIG.NOTIFICATION_TYPES;
    const validChannels = CONFIG.NOTIFICATION_CHANNELS;
    
    Object.keys(preferences).forEach(type => {
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid notification type: ${type}`);
      }
      
      Object.keys(preferences[type]).forEach(channel => {
        if (!validChannels.includes(channel)) {
          throw new Error(`Invalid notification channel: ${channel}`);
        }
      });
    });
    
    console.log(`Updated notification preferences for ${userId}`);
    return preferences;
  }
  
  /**
   * Queue notification for delivery
   * @param {Object} notification - Notification object
   */
  static queueNotificationForDelivery(notification) {
    try {
      // Process each channel
      notification.channels.forEach(channel => {
        switch (channel) {
          case 'email':
            this.queueEmailNotification(notification);
            break;
          case 'in_app':
            // In-app notifications are already stored in the sheet
            console.log(`In-app notification queued for ${notification.userId}`);
            break;
          case 'push':
            this.queuePushNotification(notification);
            break;
          default:
            console.warn(`Unknown notification channel: ${channel}`);
        }
      });
    } catch (error) {
      console.error('Failed to queue notification for delivery:', error, notification);
    }
  }
  
  /**
   * Queue email notification for delivery
   * @param {Object} notification - Notification object
   */
  static queueEmailNotification(notification) {
    try {
      // Use enhanced EmailNotificationService for delivery
      const deliveryResult = EmailNotificationService.sendEmailNotification(notification);
      console.log(`Email notification sent to ${notification.userId}:`, deliveryResult);
      
    } catch (error) {
      console.error('Failed to send email notification:', error, notification);
      
      // Log the failure for retry later
      logActivity('system', 'email_failed', 'notification', notification.id, {
        recipient: notification.userId,
        error: error.message,
        retryable: true
      });
    }
  }
  
  /**
   * Queue push notification for delivery
   * @param {Object} notification - Notification object
   */
  static queuePushNotification(notification) {
    // Push notifications would require additional setup (service worker, etc.)
    // For now, just log that it would be sent
    console.log(`Push notification queued for ${notification.userId}: ${notification.title}`);
  }
  
  /**
   * Process batch delivery of notifications
   * @param {Array} notifications - Array of notifications to deliver
   */
  static processBatchDelivery(notifications) {
    console.log(`Processing batch delivery of ${notifications.length} notifications`);
    
    // Group notifications by channel for efficient processing
    const channelGroups = {
      email: [],
      in_app: [],
      push: []
    };
    
    notifications.forEach(notification => {
      notification.channels.forEach(channel => {
        if (channelGroups[channel]) {
          channelGroups[channel].push(notification);
        }
      });
    });
    
    // Process email notifications in batch
    if (channelGroups.email.length > 0) {
      console.log(`Processing ${channelGroups.email.length} email notifications in batch`);
      
      try {
        const batchResult = EmailNotificationService.sendBatchEmailNotifications(channelGroups.email);
        console.log(`Batch email delivery completed: ${batchResult.successful} successful, ${batchResult.failed} failed`);
      } catch (error) {
        console.error('Batch email delivery failed:', error);
      }
    }
    
    // Process other channels individually
    ['in_app', 'push'].forEach(channel => {
      const channelNotifications = channelGroups[channel];
      if (channelNotifications.length > 0) {
        console.log(`Processing ${channelNotifications.length} ${channel} notifications`);
        
        channelNotifications.forEach(notification => {
          if (channel === 'in_app') {
            // In-app notifications are already stored in the sheet
            console.log(`In-app notification ready for ${notification.userId}`);
          } else if (channel === 'push') {
            this.queuePushNotification(notification);
          }
        });
      }
    });
  }
  
  /**
   * Send email with retry logic
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} body - Email body (HTML)
   * @param {number} maxRetries - Maximum retry attempts
   */
  static sendEmailWithRetry(email, subject, body, maxRetries = 3) {
    let attempt = 1;
    
    while (attempt <= maxRetries) {
      try {
        GmailApp.sendEmail(email, subject, '', {
          htmlBody: body,
          name: 'ProjectFlow Notifications'
        });
        
        console.log(`Email sent successfully to ${email} on attempt ${attempt}`);
        return;
        
      } catch (error) {
        console.error(`Email send attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to send email after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff delay
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        Utilities.sleep(delay);
        attempt++;
      }
    }
  }
  
  /**
   * Format notification for email delivery
   * @param {Object} notification - Notification object
   * @returns {Object} Email content with subject and body
   */
  static formatEmailNotification(notification) {
    const templates = this.getEmailTemplates();
    const template = templates[notification.type] || templates.default;
    
    // Get additional context data
    const contextData = this.getNotificationContext(notification);
    
    // Replace template variables
    const subject = this.replaceTemplateVariables(template.subject, notification, contextData);
    const body = this.replaceTemplateVariables(template.body, notification, contextData);
    
    return {
      subject: subject,
      body: body
    };
  }
  
  /**
   * Get email templates for different notification types
   * @returns {Object} Email templates
   */
  static getEmailTemplates() {
    return {
      mention: {
        subject: 'You were mentioned in ProjectFlow',
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin: 0;">You were mentioned in a comment</h2>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <p><strong>{{mentionedByName}}</strong> mentioned you in a comment on task:</p>
              <h3 style="color: #3b82f6; margin: 10px 0;">{{taskTitle}}</h3>
              
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0; font-style: italic;">"{{commentPreview}}"</p>
              </div>
              
              <p>
                <a href="{{taskUrl}}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Task
                </a>
              </p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
              <p>This notification was sent by ProjectFlow. To manage your notification preferences, visit your account settings.</p>
            </div>
          </div>
        `
      },
      
      task_assigned: {
        subject: 'New task assigned to you in ProjectFlow',
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin: 0;">New task assigned to you</h2>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h3 style="color: #3b82f6; margin: 0 0 10px 0;">{{taskTitle}}</h3>
              <p><strong>Priority:</strong> {{taskPriority}}</p>
              <p><strong>Due Date:</strong> {{taskDueDate}}</p>
              
              {{#taskDescription}}
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0;">{{taskDescription}}</p>
              </div>
              {{/taskDescription}}
              
              <p>
                <a href="{{taskUrl}}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Task
                </a>
              </p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
              <p>This notification was sent by ProjectFlow. To manage your notification preferences, visit your account settings.</p>
            </div>
          </div>
        `
      },
      
      deadline_approaching: {
        subject: 'Task deadline approaching in ProjectFlow',
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #92400e; margin: 0;">⚠️ Task deadline approaching</h2>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h3 style="color: #f59e0b; margin: 0 0 10px 0;">{{taskTitle}}</h3>
              <p><strong>Due Date:</strong> <span style="color: #dc2626;">{{taskDueDate}}</span></p>
              <p><strong>Priority:</strong> {{taskPriority}}</p>
              <p><strong>Status:</strong> {{taskStatus}}</p>
              
              <p>
                <a href="{{taskUrl}}" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Task
                </a>
              </p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
              <p>This notification was sent by ProjectFlow. To manage your notification preferences, visit your account settings.</p>
            </div>
          </div>
        `
      },
      
      default: {
        subject: 'ProjectFlow Notification',
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin: 0;">{{title}}</h2>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <p>{{message}}</p>
              
              {{#entityUrl}}
              <p>
                <a href="{{entityUrl}}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Details
                </a>
              </p>
              {{/entityUrl}}
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
              <p>This notification was sent by ProjectFlow. To manage your notification preferences, visit your account settings.</p>
            </div>
          </div>
        `
      }
    };
  }
  
  /**
   * Get additional context data for notification templates
   * @param {Object} notification - Notification object
   * @returns {Object} Context data
   */
  static getNotificationContext(notification) {
    const context = {};
    
    // Get task details if entityType is task
    if (notification.entityType === 'task' && notification.entityId) {
      const task = getTaskById(notification.entityId);
      if (task) {
        context.taskTitle = task.title;
        context.taskDescription = task.description;
        context.taskPriority = task.priority;
        context.taskStatus = task.status;
        context.taskDueDate = task.dueDate || 'Not set';
        context.taskUrl = this.getTaskUrl(task.id);
      }
    }
    
    // Get project details if entityType is project
    if (notification.entityType === 'project' && notification.entityId) {
      const project = getProjectById(notification.entityId);
      if (project) {
        context.projectName = project.name;
        context.projectDescription = project.description;
        context.projectUrl = this.getProjectUrl(project.id);
      }
    }
    
    // Get user details
    const user = getUserByEmail(notification.userId);
    if (user) {
      context.userName = user.name;
      context.userEmail = user.email;
    }
    
    return context;
  }
  
  /**
   * Replace template variables with actual values
   * @param {string} template - Template string with {{variables}}
   * @param {Object} notification - Notification object
   * @param {Object} context - Additional context data
   * @returns {string} Processed template
   */
  static replaceTemplateVariables(template, notification, context = {}) {
    let result = template;
    
    // Combine notification and context data
    const data = {
      ...notification,
      ...context
    };
    
    // Replace {{variable}} patterns
    Object.keys(data).forEach(key => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(pattern, data[key] || '');
    });
    
    // Handle conditional blocks {{#variable}}...{{/variable}}
    result = result.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, variable, content) => {
      return data[variable] ? content : '';
    });
    
    // Clean up any remaining template variables
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }
  
  /**
   * Get default notification title for a type
   * @param {string} type - Notification type
   * @returns {string} Default title
   */
  static getDefaultTitle(type) {
    const titles = {
      mention: 'You were mentioned',
      task_assigned: 'New task assigned',
      task_updated: 'Task updated',
      deadline_approaching: 'Deadline approaching',
      project_update: 'Project updated',
      comment_added: 'New comment added'
    };
    
    return titles[type] || 'ProjectFlow Notification';
  }
  
  /**
   * Get URL for a task (placeholder implementation)
   * @param {string} taskId - Task ID
   * @returns {string} Task URL
   */
  static getTaskUrl(taskId) {
    // In a real implementation, this would generate the actual web app URL
    const webAppUrl = ScriptApp.getService().getUrl();
    return `${webAppUrl}#/task/${taskId}`;
  }
  
  /**
   * Get URL for a project (placeholder implementation)
   * @param {string} projectId - Project ID
   * @returns {string} Project URL
   */
  static getProjectUrl(projectId) {
    // In a real implementation, this would generate the actual web app URL
    const webAppUrl = ScriptApp.getService().getUrl();
    return `${webAppUrl}#/project/${projectId}`;
  }
  
  /**
   * Process pending notifications (for scheduled delivery)
   * @param {number} batchSize - Maximum notifications to process
   * @returns {number} Number of notifications processed
   */
  static processPendingNotifications(batchSize = 50) {
    const pendingNotifications = getPendingNotifications(batchSize);
    
    if (pendingNotifications.length === 0) {
      return 0;
    }
    
    console.log(`Processing ${pendingNotifications.length} pending notifications`);
    
    pendingNotifications.forEach(notification => {
      try {
        this.queueNotificationForDelivery(notification);
        
        // Mark as processed (would need to add this field to the sheet)
        // For now, we'll just log it
        console.log(`Processed notification ${notification.id} for ${notification.userId}`);
        
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);
      }
    });
    
    return pendingNotifications.length;
  }
  
  /**
   * Get notification statistics for a user
   * @param {string} userId - User email
   * @returns {Object} Notification statistics
   */
  static getNotificationStatistics(userId) {
    const notifications = getNotificationsForUser(userId, 1000); // Get more for stats
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {},
      byChannel: {},
      recent: notifications.slice(0, 10)
    };
    
    // Count by type
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      // Count by channel
      notification.channels.forEach(channel => {
        stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
      });
    });
    
    return stats;
  }
}

console.log('✅ NotificationEngine.gs loaded - Enterprise notification system ready');