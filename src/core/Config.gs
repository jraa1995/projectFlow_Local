/**
 * ProjectFlow Configuration
 * All constants, field definitions, and configuration in one place
 */

const CONFIG = {
  // Sheet names in Master Workbook
  SHEETS: {
    TASKS: 'Tasks',
    USERS: 'Users', 
    PROJECTS: 'Projects',
    COMMENTS: 'Comments',
    ACTIVITY: 'Activity',
    MENTIONS: 'Mentions',
    NOTIFICATIONS: 'Notifications',
    ANALYTICS_CACHE: 'Analytics_Cache',
    TASK_DEPENDENCIES: 'Task_Dependencies'
  },
  
  // Workflow statuses (order matters for board columns)
  STATUSES: ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Done'],
  
  // Priority levels (order = severity)
  PRIORITIES: ['Lowest', 'Low', 'Medium', 'High', 'Highest', 'Critical'],
  
  // Task types
  TYPES: ['Task', 'Bug', 'Feature', 'Story', 'Epic', 'Spike'],
  
  // Column colors for board UI
  COLORS: {
    'Backlog': '#6B7280',
    'To Do': '#3B82F6',
    'In Progress': '#F59E0B',
    'Review': '#8B5CF6',
    'Testing': '#06B6D4',
    'Done': '#10B981'
  },
  
  // Task sheet columns (order must match sheet)
  TASK_COLUMNS: [
    'id',           // 0  - Unique task ID (e.g., PROJ-101)
    'projectId',    // 1  - Project acronym
    'title',        // 2  - Task title
    'description',  // 3  - Task description
    'status',       // 4  - Current status
    'priority',     // 5  - Priority level
    'type',         // 6  - Task type
    'assignee',     // 7  - Assigned user email
    'reporter',     // 8  - Creator email
    'dueDate',      // 9  - Due date
    'startDate',    // 10 - Start date
    'sprint',       // 11 - Sprint number
    'storyPoints',  // 12 - Story points estimate
    'estimatedHrs', // 13 - Estimated hours
    'actualHrs',    // 14 - Actual hours logged
    'labels',       // 15 - Comma-separated labels
    'parentId',     // 16 - Parent task ID (for subtasks)
    'position',     // 17 - Sort order within column
    'createdAt',    // 18 - Creation timestamp
    'updatedAt',    // 19 - Last update timestamp
    'completedAt',  // 20 - Completion timestamp
    'dependencies', // 21 - Comma-separated predecessor task IDs
    'timeEntries',  // 22 - JSON time tracking data
    'customFields', // 23 - JSON custom field data
    'templateId',   // 24 - Task template reference
    'recurringConfig' // 25 - JSON recurring configuration
  ],
  
  // User sheet columns
  USER_COLUMNS: [
    'email',        // 0  - User email (primary key)
    'name',         // 1  - Display name
    'role',         // 2  - admin, manager, member
    'active',       // 3  - true/false
    'workbookId',   // 4  - Personal workbook ID (optional)
    'createdAt'     // 5  - When user was added
  ],
  
  // Project sheet columns  
  PROJECT_COLUMNS: [
    'id',           // 0  - Project acronym (e.g., PROJ)
    'name',         // 1  - Full project name
    'description',  // 2  - Project description
    'status',       // 3  - active, archived, completed
    'ownerId',      // 4  - Project owner email
    'startDate',    // 5  - Project start date
    'endDate',      // 6  - Project end date
    'createdAt'     // 7  - Creation timestamp
  ],
  
  // Comment sheet columns
  COMMENT_COLUMNS: [
    'id',           // 0  - Comment ID
    'taskId',       // 1  - Related task ID
    'userId',       // 2  - Author email
    'content',      // 3  - Comment text
    'createdAt',    // 4  - Creation timestamp
    'updatedAt',    // 5  - Edit timestamp
    'mentionedUsers', // 6 - Comma-separated mentioned user emails
    'isEdited',     // 7  - Edit status flag
    'editHistory'   // 8  - JSON edit history
  ],
  
  // Activity log columns
  ACTIVITY_COLUMNS: [
    'id',           // 0  - Activity ID
    'userId',       // 1  - User who performed action
    'action',       // 2  - Action type (created, updated, moved, etc.)
    'entityType',   // 3  - task, project, comment
    'entityId',     // 4  - ID of affected entity
    'details',      // 5  - JSON details of change
    'timestamp'     // 6  - When it happened
  ],

  // Mentions sheet columns
  MENTION_COLUMNS: [
    'id',           // 0  - Unique mention ID
    'commentId',    // 1  - Related comment ID
    'mentionedUserId', // 2 - User being mentioned
    'mentionedByUserId', // 3 - User who made the mention
    'taskId',       // 4  - Related task ID
    'createdAt',    // 5  - Timestamp
    'notificationSent', // 6 - Notification status
    'acknowledged'  // 7  - User acknowledgment
  ],

  // Notifications sheet columns
  NOTIFICATION_COLUMNS: [
    'id',           // 0  - Unique notification ID
    'userId',       // 1  - Recipient user ID
    'type',         // 2  - Notification type
    'title',        // 3  - Notification title
    'message',      // 4  - Notification content
    'entityType',   // 5  - Related entity type
    'entityId',     // 6  - Related entity ID
    'read',         // 7  - Read status
    'createdAt',    // 8  - Creation timestamp
    'scheduledFor', // 9  - Scheduled delivery time
    'channels'      // 10 - Comma-separated delivery channels
  ],

  // Analytics cache sheet columns
  ANALYTICS_CACHE_COLUMNS: [
    'id',           // 0  - Cache entry ID
    'cacheKey',     // 1  - Unique cache identifier
    'data',         // 2  - JSON serialized analytics data
    'expiresAt',    // 3  - Cache expiration timestamp
    'createdAt'     // 4  - Cache creation time
  ],

  // Task dependencies sheet columns
  TASK_DEPENDENCY_COLUMNS: [
    'id',           // 0  - Dependency ID
    'predecessorId', // 1 - Predecessor task ID
    'successorId',  // 2  - Successor task ID
    'dependencyType', // 3 - Type of dependency
    'lag',          // 4  - Lag time in days
    'createdAt'     // 5  - Creation timestamp
  ],

  // Notification types
  NOTIFICATION_TYPES: [
    'mention',
    'task_assigned',
    'task_updated',
    'deadline_approaching',
    'project_update',
    'comment_added'
  ],

  // Notification channels
  NOTIFICATION_CHANNELS: [
    'email',
    'in_app',
    'push'
  ],

  // Dependency types
  DEPENDENCY_TYPES: [
    'finish_to_start',
    'start_to_start',
    'finish_to_finish',
    'start_to_finish'
  ]
};

/**
 * Get column index by name for a given sheet type
 */
function getColumnIndex(sheetType, columnName) {
  const columns = CONFIG[sheetType + '_COLUMNS'];
  if (!columns) return -1;
  return columns.indexOf(columnName);
}

/**
 * Generate unique ID with prefix
 */
function generateId(prefix) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Generate task ID based on project (e.g., PROJ-101)
 */
function generateTaskId(projectId, existingTasks) {
  const prefix = projectId || 'TASK';
  
  // Find highest number for this project
  let maxNum = 0;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  
  existingTasks.forEach(task => {
    const match = task.id?.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  });
  
  return `${prefix}-${maxNum + 1}`;
}

/**
 * Generate project acronym from name
 */
function generateProjectAcronym(name, existingProjects) {
  if (!name) return 'PROJ';
  
  // Split into words, remove special chars
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  
  let acronym;
  if (words.length >= 2) {
    // Take first letter of each word (max 4)
    acronym = words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
  } else {
    // Single word - take first 3-4 chars
    acronym = words[0].substring(0, 4).toUpperCase();
  }
  
  // Ensure uniqueness
  let finalAcronym = acronym;
  let counter = 1;
  const existingIds = new Set(existingProjects.map(p => p.id));
  
  while (existingIds.has(finalAcronym)) {
    finalAcronym = acronym + counter;
    counter++;
  }
  
  return finalAcronym;
}

/**
 * Get current timestamp as ISO string
 */
function now() {
  return new Date().toISOString();
}

/**
 * Sanitize user input
 */
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '');
}