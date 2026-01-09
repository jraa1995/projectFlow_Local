/**
 * EmailNotificationService - Enhanced Email Delivery System
 * Handles email template management, delivery, and error handling
 * 
 * Features:
 * - Rich HTML email templates
 * - Retry logic with exponential backoff
 * - Email delivery tracking
 * - Template customization
 * - Batch email processing
 */

class EmailNotificationService {
  
  /**
   * Send email notification with enhanced template and retry logic
   * @param {Object} notification - Notification object
   * @returns {Object} Delivery result
   */
  static sendEmailNotification(notification) {
    try {
      // Get user details
      const user = getUserByEmail(notification.userId);
      if (!user || !user.active) {
        throw new Error(`Cannot send email to inactive user: ${notification.userId}`);
      }
      
      // Format email content using enhanced templates
      const emailContent = this.formatEmailContent(notification);
      
      // Send email with retry logic
      const deliveryResult = this.sendEmailWithRetry(
        user.email,
        emailContent.subject,
        emailContent.htmlBody,
        emailContent.textBody,
        3 // max retries
      );
      
      // Log successful delivery
      this.logEmailDelivery(notification, user.email, 'success', deliveryResult);
      
      return {
        success: true,
        recipient: user.email,
        messageId: deliveryResult.messageId,
        deliveredAt: new Date().toISOString()
      };
      
    } catch (error) {
      // Log failed delivery
      this.logEmailDelivery(notification, notification.userId, 'failed', { error: error.message });
      
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }
  
  /**
   * Send multiple email notifications in batch
   * @param {Array} notifications - Array of notification objects
   * @returns {Object} Batch delivery results
   */
  static sendBatchEmailNotifications(notifications) {
    const results = {
      total: notifications.length,
      successful: 0,
      failed: 0,
      results: []
    };
    
    console.log(`Processing batch email delivery for ${notifications.length} notifications`);
    
    notifications.forEach((notification, index) => {
      try {
        const result = this.sendEmailNotification(notification);
        results.successful++;
        results.results.push({
          notificationId: notification.id,
          success: true,
          ...result
        });
        
        // Add small delay between emails to avoid rate limiting
        if (index < notifications.length - 1) {
          Utilities.sleep(100); // 100ms delay
        }
        
      } catch (error) {
        results.failed++;
        results.results.push({
          notificationId: notification.id,
          success: false,
          error: error.message,
          recipient: notification.userId
        });
      }
    });
    
    console.log(`Batch email delivery completed: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }
  
  /**
   * Format email content using enhanced templates
   * @param {Object} notification - Notification object
   * @returns {Object} Formatted email content
   */
  static formatEmailContent(notification) {
    const template = this.getEmailTemplate(notification.type);
    const context = this.buildEmailContext(notification);
    
    // Process template with context data
    const subject = this.processTemplate(template.subject, context);
    const htmlBody = this.processTemplate(template.htmlBody, context);
    const textBody = this.processTemplate(template.textBody, context);
    
    return {
      subject: subject,
      htmlBody: htmlBody,
      textBody: textBody
    };
  }
  
  /**
   * Get enhanced email template for notification type
   * @param {string} notificationType - Type of notification
   * @returns {Object} Email template
   */
  static getEmailTemplate(notificationType) {
    const templates = {
      mention: {
        subject: 'You were mentioned in {{taskTitle}} - ProjectFlow',
        htmlBody: this.getMentionEmailTemplate(),
        textBody: this.getMentionTextTemplate()
      },
      
      task_assigned: {
        subject: 'New task assigned: {{taskTitle}} - ProjectFlow',
        htmlBody: this.getTaskAssignedEmailTemplate(),
        textBody: this.getTaskAssignedTextTemplate()
      },
      
      task_updated: {
        subject: 'Task updated: {{taskTitle}} - ProjectFlow',
        htmlBody: this.getTaskUpdatedEmailTemplate(),
        textBody: this.getTaskUpdatedTextTemplate()
      },
      
      deadline_approaching: {
        subject: '⚠️ Deadline approaching: {{taskTitle}} - ProjectFlow',
        htmlBody: this.getDeadlineEmailTemplate(),
        textBody: this.getDeadlineTextTemplate()
      },
      
      project_update: {
        subject: 'Project update: {{projectName}} - ProjectFlow',
        htmlBody: this.getProjectUpdateEmailTemplate(),
        textBody: this.getProjectUpdateTextTemplate()
      },
      
      comment_added: {
        subject: 'New comment on {{taskTitle}} - ProjectFlow',
        htmlBody: this.getCommentEmailTemplate(),
        textBody: this.getCommentTextTemplate()
      }
    };
    
    return templates[notificationType] || templates.mention;
  }
  
  /**
   * Build context data for email templates
   * @param {Object} notification - Notification object
   * @returns {Object} Template context
   */
  static buildEmailContext(notification) {
    const context = {
      // Notification data
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || '',
      createdAt: notification.createdAt || '',
      
      // User data
      userName: '',
      userEmail: notification.userId || '',
      
      // Task data
      taskTitle: '',
      taskDescription: '',
      taskStatus: '',
      taskPriority: '',
      taskDueDate: '',
      taskUrl: '',
      
      // Project data
      projectName: '',
      projectDescription: '',
      projectUrl: '',
      
      // System data
      systemName: 'ProjectFlow',
      systemUrl: this.getSystemUrl(),
      unsubscribeUrl: this.getUnsubscribeUrl(notification.userId),
      
      // Formatting helpers
      formattedDate: this.formatDate(notification.createdAt),
      priorityColor: '#3b82f6',
      statusColor: '#10b981'
    };
    
    // Get user details
    const user = getUserByEmail(notification.userId);
    if (user) {
      context.userName = user.name;
      context.userEmail = user.email;
    }
    
    // Get task details if applicable
    if (notification.entityType === 'task' && notification.entityId) {
      const task = getTaskById(notification.entityId);
      if (task) {
        context.taskTitle = task.title;
        context.taskDescription = task.description || '';
        context.taskStatus = task.status || '';
        context.taskPriority = task.priority || '';
        context.taskDueDate = task.dueDate || 'Not set';
        context.taskUrl = this.getTaskUrl(task.id);
        
        // Set priority color
        context.priorityColor = this.getPriorityColor(task.priority);
        context.statusColor = this.getStatusColor(task.status);
        
        // Get project details
        if (task.projectId) {
          const project = getProjectById(task.projectId);
          if (project) {
            context.projectName = project.name;
            context.projectDescription = project.description || '';
            context.projectUrl = this.getProjectUrl(project.id);
          }
        }
      }
    }
    
    // Get project details if applicable
    if (notification.entityType === 'project' && notification.entityId) {
      const project = getProjectById(notification.entityId);
      if (project) {
        context.projectName = project.name;
        context.projectDescription = project.description || '';
        context.projectUrl = this.getProjectUrl(project.id);
      }
    }
    
    return context;
  }
  
  /**
   * Process template with context data
   * @param {string} template - Template string
   * @param {Object} context - Context data
   * @returns {string} Processed template
   */
  static processTemplate(template, context) {
    let result = template;
    
    // Replace {{variable}} patterns
    Object.keys(context).forEach(key => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      const value = context[key] || '';
      result = result.replace(pattern, value);
    });
    
    // Handle conditional blocks {{#variable}}...{{/variable}}
    result = result.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, variable, content) => {
      const value = context[variable];
      return (value && value !== '' && value !== 'Not set') ? content : '';
    });
    
    // Handle inverted conditional blocks {{^variable}}...{{/variable}}
    result = result.replace(/{{\\^(\w+)}}(.*?){{\/\1}}/gs, (match, variable, content) => {
      const value = context[variable];
      return (!value || value === '' || value === 'Not set') ? content : '';
    });
    
    // Clean up any remaining template variables
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }
  
  /**
   * Send email with retry logic and exponential backoff
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML email body
   * @param {string} textBody - Plain text email body
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Object} Delivery result
   */
  static sendEmailWithRetry(email, subject, htmlBody, textBody, maxRetries = 3) {
    let attempt = 1;
    let lastError = null;
    
    while (attempt <= maxRetries) {
      try {
        // Send email using Gmail API
        const result = GmailApp.sendEmail(email, subject, textBody, {
          htmlBody: htmlBody,
          name: 'ProjectFlow Notifications',
          replyTo: 'noreply@projectflow.com'
        });
        
        console.log(`Email sent successfully to ${email} on attempt ${attempt}`);
        
        return {
          success: true,
          attempt: attempt,
          messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sentAt: new Date().toISOString()
        };
        
      } catch (error) {
        lastError = error;
        console.error(`Email send attempt ${attempt} failed for ${email}:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to send email after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff delay: 2s, 4s, 8s...
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        Utilities.sleep(delay);
        attempt++;
      }
    }
    
    throw lastError;
  }
  
  /**
   * Log email delivery attempt
   * @param {Object} notification - Notification object
   * @param {string} recipient - Recipient email
   * @param {string} status - Delivery status
   * @param {Object} details - Additional details
   */
  static logEmailDelivery(notification, recipient, status, details) {
    try {
      logActivity('system', 'email_delivery', 'notification', notification.id, {
        recipient: recipient,
        status: status,
        type: notification.type,
        attempt: details.attempt || 1,
        messageId: details.messageId || null,
        error: details.error || null,
        sentAt: details.sentAt || new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log email delivery:', error);
    }
  }
  
  /**
   * Get system URL for email links
   * @returns {string} System URL
   */
  static getSystemUrl() {
    try {
      return ScriptApp.getService().getUrl();
    } catch (error) {
      return 'https://your-projectflow-instance.com';
    }
  }
  
  /**
   * Get task URL for email links
   * @param {string} taskId - Task ID
   * @returns {string} Task URL
   */
  static getTaskUrl(taskId) {
    const baseUrl = this.getSystemUrl();
    return `${baseUrl}#/task/${taskId}`;
  }
  
  /**
   * Get project URL for email links
   * @param {string} projectId - Project ID
   * @returns {string} Project URL
   */
  static getProjectUrl(projectId) {
    const baseUrl = this.getSystemUrl();
    return `${baseUrl}#/project/${projectId}`;
  }
  
  /**
   * Get unsubscribe URL for user
   * @param {string} userId - User email
   * @returns {string} Unsubscribe URL
   */
  static getUnsubscribeUrl(userId) {
    const baseUrl = this.getSystemUrl();
    return `${baseUrl}#/settings/notifications?unsubscribe=${encodeURIComponent(userId)}`;
  }
  
  /**
   * Format date for email display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  static formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }
  
  /**
   * Get color for task priority
   * @param {string} priority - Task priority
   * @returns {string} Color hex code
   */
  static getPriorityColor(priority) {
    const colors = {
      'Critical': '#dc2626',
      'Highest': '#ea580c',
      'High': '#f59e0b',
      'Medium': '#3b82f6',
      'Low': '#10b981',
      'Lowest': '#6b7280'
    };
    
    return colors[priority] || '#3b82f6';
  }
  
  /**
   * Get color for task status
   * @param {string} status - Task status
   * @returns {string} Color hex code
   */
  static getStatusColor(status) {
    const colors = {
      'Backlog': '#6b7280',
      'To Do': '#3b82f6',
      'In Progress': '#f59e0b',
      'Review': '#8b5cf6',
      'Testing': '#06b6d4',
      'Done': '#10b981'
    };
    
    return colors[status] || '#3b82f6';
  }
  
  // =============================================================================
  // EMAIL TEMPLATES
  // =============================================================================
  
  /**
   * Get mention email HTML template
   */
  static getMentionEmailTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You were mentioned - ProjectFlow</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; }
    .mention-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .task-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .task-title { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 10px 0; }
    .task-meta { display: flex; gap: 20px; margin: 10px 0; }
    .meta-item { font-size: 14px; color: #64748b; }
    .priority { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: white; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: white; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 20px 0; }
    .button:hover { background: #2563eb; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    .footer a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 You were mentioned</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone mentioned you in a comment</p>
    </div>
    
    <div class="content">
      <div class="mention-box">
        <p><strong>{{mentionedByName}}</strong> mentioned you in a comment:</p>
        <p style="font-style: italic; margin: 10px 0;">"{{message}}"</p>
      </div>
      
      <div class="task-info">
        <div class="task-title">{{taskTitle}}</div>
        {{#taskDescription}}
        <p style="color: #64748b; margin: 10px 0;">{{taskDescription}}</p>
        {{/taskDescription}}
        
        <div class="task-meta">
          <div class="meta-item">
            <span class="priority" style="background-color: {{priorityColor}};">{{taskPriority}}</span>
          </div>
          <div class="meta-item">
            <span class="status" style="background-color: {{statusColor}};">{{taskStatus}}</span>
          </div>
          {{#taskDueDate}}
          <div class="meta-item">📅 Due: {{taskDueDate}}</div>
          {{/taskDueDate}}
        </div>
      </div>
      
      <a href="{{taskUrl}}" class="button">View Task & Reply</a>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        This mention was posted on {{formattedDate}} in the {{projectName}} project.
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you were mentioned in ProjectFlow.</p>
      <p><a href="{{unsubscribeUrl}}">Manage notification preferences</a> | <a href="{{systemUrl}}">Open ProjectFlow</a></p>
    </div>
  </div>
</body>
</html>`;
  }
  
  /**
   * Get mention email text template
   */
  static getMentionTextTemplate() {
    return `You were mentioned in ProjectFlow

{{mentionedByName}} mentioned you in a comment on "{{taskTitle}}":

"{{message}}"

Task Details:
- Title: {{taskTitle}}
- Status: {{taskStatus}}
- Priority: {{taskPriority}}
{{#taskDueDate}}
- Due Date: {{taskDueDate}}
{{/taskDueDate}}
{{#taskDescription}}
- Description: {{taskDescription}}
{{/taskDescription}}

View and reply to this task: {{taskUrl}}

This mention was posted on {{formattedDate}} in the {{projectName}} project.

---
You're receiving this because you were mentioned in ProjectFlow.
Manage your notification preferences: {{unsubscribeUrl}}`;
  }
  
  /**
   * Get task assigned email HTML template
   */
  static getTaskAssignedEmailTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Task Assigned - ProjectFlow</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; }
    .task-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin: 20px 0; }
    .task-title { font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 15px 0; }
    .task-meta { display: flex; gap: 15px; margin: 15px 0; flex-wrap: wrap; }
    .meta-badge { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; color: white; }
    .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 25px 0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Task Assigned</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">A new task has been assigned to you</p>
    </div>
    
    <div class="content">
      <div class="task-card">
        <div class="task-title">{{taskTitle}}</div>
        
        {{#taskDescription}}
        <p style="color: #475569; line-height: 1.6; margin: 15px 0;">{{taskDescription}}</p>
        {{/taskDescription}}
        
        <div class="task-meta">
          <span class="meta-badge" style="background-color: {{priorityColor}};">{{taskPriority}} Priority</span>
          <span class="meta-badge" style="background-color: {{statusColor}};">{{taskStatus}}</span>
          {{#taskDueDate}}
          <span class="meta-badge" style="background-color: #f59e0b;">📅 Due {{taskDueDate}}</span>
          {{/taskDueDate}}
        </div>
      </div>
      
      <a href="{{taskUrl}}" class="button">View Task Details</a>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        This task was assigned on {{formattedDate}} in the {{projectName}} project.
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this because a task was assigned to you in ProjectFlow.</p>
      <p><a href="{{unsubscribeUrl}}">Manage notification preferences</a> | <a href="{{systemUrl}}">Open ProjectFlow</a></p>
    </div>
  </div>
</body>
</html>`;
  }
  
  /**
   * Get task assigned text template
   */
  static getTaskAssignedTextTemplate() {
    return `New Task Assigned - ProjectFlow

A new task has been assigned to you:

{{taskTitle}}

{{#taskDescription}}
Description: {{taskDescription}}
{{/taskDescription}}

Task Details:
- Status: {{taskStatus}}
- Priority: {{taskPriority}}
{{#taskDueDate}}
- Due Date: {{taskDueDate}}
{{/taskDueDate}}
- Project: {{projectName}}

View task details: {{taskUrl}}

This task was assigned on {{formattedDate}}.

---
You're receiving this because a task was assigned to you in ProjectFlow.
Manage your notification preferences: {{unsubscribeUrl}}`;
  }
  
  /**
   * Get deadline approaching email HTML template
   */
  static getDeadlineEmailTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadline Approaching - ProjectFlow</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; }
    .warning-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .task-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin: 20px 0; }
    .deadline { font-size: 18px; font-weight: 600; color: #dc2626; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 25px 0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Deadline Approaching</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">A task deadline is coming up soon</p>
    </div>
    
    <div class="content">
      <div class="warning-box">
        <p style="margin: 0; font-weight: 500;">⏰ Your task deadline is approaching!</p>
      </div>
      
      <div class="task-card">
        <div style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 15px 0;">{{taskTitle}}</div>
        
        <div class="deadline">📅 Due: {{taskDueDate}}</div>
        
        {{#taskDescription}}
        <p style="color: #475569; line-height: 1.6; margin: 15px 0;">{{taskDescription}}</p>
        {{/taskDescription}}
        
        <div style="margin: 15px 0;">
          <span style="padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; color: white; background-color: {{statusColor}};">{{taskStatus}}</span>
          <span style="padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; color: white; background-color: {{priorityColor}}; margin-left: 10px;">{{taskPriority}}</span>
        </div>
      </div>
      
      <a href="{{taskUrl}}" class="button">Update Task Status</a>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        Don't let deadlines slip by. Update your task status to keep the team informed.
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you have a task with an approaching deadline.</p>
      <p><a href="{{unsubscribeUrl}}">Manage notification preferences</a> | <a href="{{systemUrl}}">Open ProjectFlow</a></p>
    </div>
  </div>
</body>
</html>`;
  }
  
  /**
   * Get deadline approaching text template
   */
  static getDeadlineTextTemplate() {
    return `⚠️ Deadline Approaching - ProjectFlow

Your task deadline is approaching:

{{taskTitle}}

Due Date: {{taskDueDate}}
Status: {{taskStatus}}
Priority: {{taskPriority}}

{{#taskDescription}}
Description: {{taskDescription}}
{{/taskDescription}}

Don't let deadlines slip by. Update your task status to keep the team informed.

Update task: {{taskUrl}}

---
You're receiving this because you have a task with an approaching deadline.
Manage your notification preferences: {{unsubscribeUrl}}`;
  }
  
  // Additional template methods for other notification types...
  static getTaskUpdatedEmailTemplate() {
    return this.getMentionEmailTemplate().replace('💬 You were mentioned', '📝 Task Updated').replace('Someone mentioned you', 'A task you\'re involved with was updated');
  }
  
  static getTaskUpdatedTextTemplate() {
    return this.getMentionTextTemplate().replace('You were mentioned', 'Task Updated').replace('mentioned you in a comment', 'updated a task you\'re involved with');
  }
  
  static getProjectUpdateEmailTemplate() {
    return this.getMentionEmailTemplate().replace('💬 You were mentioned', '📊 Project Update').replace('Someone mentioned you', 'A project you\'re involved with was updated');
  }
  
  static getProjectUpdateTextTemplate() {
    return this.getMentionTextTemplate().replace('You were mentioned', 'Project Update').replace('mentioned you in a comment', 'updated a project you\'re involved with');
  }
  
  static getCommentEmailTemplate() {
    return this.getMentionEmailTemplate().replace('💬 You were mentioned', '💬 New Comment').replace('Someone mentioned you', 'A new comment was added');
  }
  
  static getCommentTextTemplate() {
    return this.getMentionTextTemplate().replace('You were mentioned', 'New Comment').replace('mentioned you in a comment', 'added a comment');
  }
}

console.log('✅ EmailNotificationService.gs loaded - Enhanced email delivery system ready');