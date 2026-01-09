/**
 * ProjectFlow Data Layer
 * All direct sheet operations - CRUD for tasks, users, projects, comments
 * No abstraction - direct, simple, fast
 */

// =============================================================================
// SHEET ACCESS
// =============================================================================

/**
 * Get or create a sheet by name with headers
 */
function getSheet(sheetName, columns) {
  // Defensive check for undefined columns
  if (!columns || !Array.isArray(columns)) {
    console.error(`Invalid columns parameter for sheet ${sheetName}:`, columns);
    throw new Error(`Invalid columns parameter for sheet ${sheetName}. Expected array, got: ${typeof columns}`);
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    console.log(`Creating new sheet: ${sheetName}`);
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, columns.length)
      .setValues([columns])
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('white');
    sheet.setFrozenRows(1);
  } else {
    // Sheet exists, verify it has headers
    const existingHeaders = sheet.getRange(1, 1, 1, columns.length).getValues()[0];
    const headersMatch = columns.every((col, index) => existingHeaders[index] === col);
    
    if (!headersMatch) {
      console.log(`Updating headers for sheet: ${sheetName}`);
      sheet.getRange(1, 1, 1, columns.length)
        .setValues([columns])
        .setFontWeight('bold')
        .setBackground('#1e293b')
        .setFontColor('white');
      sheet.setFrozenRows(1);
    }
  }
  
  return sheet;
}

function getTasksSheet() {
  if (!CONFIG || !CONFIG.TASK_COLUMNS) {
    throw new Error('CONFIG.TASK_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.TASKS, CONFIG.TASK_COLUMNS);
}

function getUsersSheet() {
  if (!CONFIG || !CONFIG.USER_COLUMNS) {
    throw new Error('CONFIG.USER_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.USERS, CONFIG.USER_COLUMNS);
}

function getProjectsSheet() {
  if (!CONFIG || !CONFIG.PROJECT_COLUMNS) {
    throw new Error('CONFIG.PROJECT_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.PROJECTS, CONFIG.PROJECT_COLUMNS);
}

function getCommentsSheet() {
  if (!CONFIG || !CONFIG.COMMENT_COLUMNS) {
    throw new Error('CONFIG.COMMENT_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.COMMENTS, CONFIG.COMMENT_COLUMNS);
}

function getActivitySheet() {
  if (!CONFIG || !CONFIG.ACTIVITY_COLUMNS) {
    throw new Error('CONFIG.ACTIVITY_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.ACTIVITY, CONFIG.ACTIVITY_COLUMNS);
}

function getMentionsSheet() {
  // Defensive check for CONFIG
  if (!CONFIG || !CONFIG.MENTION_COLUMNS) {
    console.error('CONFIG or CONFIG.MENTION_COLUMNS is undefined');
    console.error('CONFIG:', typeof CONFIG);
    if (CONFIG) {
      console.error('Available CONFIG keys:', Object.keys(CONFIG));
    }
    throw new Error('CONFIG.MENTION_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.MENTIONS, CONFIG.MENTION_COLUMNS);
}

function getNotificationsSheet() {
  if (!CONFIG || !CONFIG.NOTIFICATION_COLUMNS) {
    throw new Error('CONFIG.NOTIFICATION_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.NOTIFICATIONS, CONFIG.NOTIFICATION_COLUMNS);
}

function getAnalyticsCacheSheet() {
  if (!CONFIG || !CONFIG.ANALYTICS_CACHE_COLUMNS) {
    throw new Error('CONFIG.ANALYTICS_CACHE_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.ANALYTICS_CACHE, CONFIG.ANALYTICS_CACHE_COLUMNS);
}

function getTaskDependenciesSheet() {
  if (!CONFIG || !CONFIG.TASK_DEPENDENCY_COLUMNS) {
    throw new Error('CONFIG.TASK_DEPENDENCY_COLUMNS is undefined. Check Config.gs for syntax errors.');
  }
  return getSheet(CONFIG.SHEETS.TASK_DEPENDENCIES, CONFIG.TASK_DEPENDENCY_COLUMNS);
}

// =============================================================================
// ROW <-> OBJECT CONVERSION
// =============================================================================

/**
 * Convert a row array to an object using column definitions
 */
function rowToObject(row, columns) {
  const obj = {};
  columns.forEach((col, i) => {
    let value = row[i];
    // Handle dates
    if (value instanceof Date) {
      value = value.toISOString();
    }
    obj[col] = value !== undefined && value !== null ? value : '';
  });
  return obj;
}

/**
 * Convert an object to a row array using column definitions
 */
function objectToRow(obj, columns) {
  return columns.map(col => {
    const value = obj[col];
    // Handle arrays (like labels)
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value !== undefined ? value : '';
  });
}

// =============================================================================
// TASK OPERATIONS
// =============================================================================

/**
 * Get all tasks from the Tasks sheet
 * @param {Object} filters - Optional filters (assignee, projectId, status, etc.)
 * @returns {Array} Array of task objects
 */
function getAllTasks(filters = {}) {
  const sheet = getTasksSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const columns = CONFIG.TASK_COLUMNS;
  let tasks = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Skip empty rows
    if (!row[0] && !row[2]) continue;
    
    const task = rowToObject(row, columns);
    
    // Parse labels string to array
    if (typeof task.labels === 'string' && task.labels) {
      task.labels = task.labels.split(',').map(l => l.trim()).filter(l => l);
    } else {
      task.labels = [];
    }
    
    // Parse numeric fields
    task.storyPoints = parseInt(task.storyPoints) || 0;
    task.estimatedHrs = parseFloat(task.estimatedHrs) || 0;
    task.actualHrs = parseFloat(task.actualHrs) || 0;
    task.position = parseInt(task.position) || 0;
    
    tasks.push(task);
  }
  
  // Apply filters
  if (filters.assignee) {
    tasks = tasks.filter(t => t.assignee?.toLowerCase() === filters.assignee.toLowerCase());
  }
  if (filters.projectId) {
    tasks = tasks.filter(t => t.projectId === filters.projectId);
  }
  if (filters.status) {
    tasks = tasks.filter(t => t.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    tasks = tasks.filter(t => 
      t.title?.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q) ||
      t.id?.toLowerCase().includes(q)
    );
  }
  
  return tasks;
}

/**
 * Get a single task by ID
 */
function getTaskById(taskId) {
  const tasks = getAllTasks();
  return tasks.find(t => t.id === taskId) || null;
}

/**
 * Get tasks for a specific user (for My Board)
 */
function getTasksForUser(email) {
  return getAllTasks({ assignee: email });
}

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @returns {Object} Created task with generated ID
 */
function createTask(taskData) {
  const sheet = getTasksSheet();
  const existingTasks = getAllTasks();
  const currentUser = getCurrentUserEmail();
  const timestamp = now();
  
  // Generate smart task ID
  const taskId = generateTaskId(taskData.projectId, existingTasks);
  
  // Calculate position (add to end of status column)
  const sameStatusTasks = existingTasks.filter(t => t.status === (taskData.status || 'To Do'));
  const maxPosition = sameStatusTasks.reduce((max, t) => Math.max(max, t.position || 0), 0);
  
  const task = {
    id: taskId,
    projectId: taskData.projectId || '',
    title: sanitize(taskData.title || 'New Task'),
    description: sanitize(taskData.description || ''),
    status: taskData.status || 'To Do',
    priority: taskData.priority || 'Medium',
    type: taskData.type || 'Task',
    assignee: taskData.assignee || currentUser,
    reporter: taskData.reporter || currentUser,
    dueDate: taskData.dueDate || '',
    startDate: taskData.startDate || '',
    sprint: taskData.sprint || '',
    storyPoints: parseInt(taskData.storyPoints) || 0,
    estimatedHrs: parseFloat(taskData.estimatedHrs) || 0,
    actualHrs: 0,
    labels: Array.isArray(taskData.labels) ? taskData.labels : 
            (taskData.labels ? taskData.labels.split(',').map(l => l.trim()) : []),
    parentId: taskData.parentId || '',
    position: maxPosition + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: ''
  };
  
  sheet.appendRow(objectToRow(task, CONFIG.TASK_COLUMNS));
  
  // Log activity
  logActivity(currentUser, 'created', 'task', task.id, { title: task.title });
  
  return task;
}

/**
 * Update an existing task
 * @param {string} taskId - Task ID to update
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated task
 */
function updateTask(taskId, updates) {
  const sheet = getTasksSheet();
  const data = sheet.getDataRange().getValues();
  const columns = CONFIG.TASK_COLUMNS;
  const idIndex = 0; // 'id' is first column
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === taskId) {
      const task = rowToObject(data[i], columns);
      
      // Track what changed for activity log
      const changes = {};
      Object.keys(updates).forEach(key => {
        if (task[key] !== updates[key]) {
          changes[key] = { from: task[key], to: updates[key] };
        }
      });
      
      // Apply updates
      Object.assign(task, updates);
      task.updatedAt = now();
      
      // Set completedAt if moving to Done
      if (updates.status === 'Done' && !task.completedAt) {
        task.completedAt = now();
      }
      
      // Write back
      const newRow = objectToRow(task, columns);
      sheet.getRange(i + 1, 1, 1, columns.length).setValues([newRow]);
      
      // Log activity
      if (Object.keys(changes).length > 0) {
        logActivity(getCurrentUserEmail(), 'updated', 'task', taskId, changes);
      }
      
      return task;
    }
  }
  
  throw new Error('Task not found: ' + taskId);
}

/**
 * Move task to new status and/or position
 */
function moveTask(taskId, newStatus, newPosition) {
  const updates = { status: newStatus };
  if (newPosition !== undefined) {
    updates.position = newPosition;
  }
  return updateTask(taskId, updates);
}

/**
 * Delete a task
 */
function deleteTask(taskId) {
  const sheet = getTasksSheet();
  const data = sheet.getDataRange().getValues();
  const idIndex = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === taskId) {
      sheet.deleteRow(i + 1);
      logActivity(getCurrentUserEmail(), 'deleted', 'task', taskId, {});
      return true;
    }
  }
  
  return false;
}

// =============================================================================
// USER OPERATIONS
// =============================================================================

/**
 * Get current user's email
 */
function getCurrentUserEmail() {
  try {
    // First try to get from manual login session
    const manualEmail = getManualUserEmail();
    if (manualEmail) {
      return manualEmail;
    }
    
    // Fallback to Google Apps Script session
    return Session.getActiveUser().getEmail() || 'anonymous@example.com';
  } catch (e) {
    return 'anonymous@example.com';
  }
}

/**
 * Set current user email manually (for login system)
 */
function setCurrentUserEmail(email) {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('CURRENT_USER_EMAIL', email);
    return true;
  } catch (e) {
    console.error('Failed to set current user email:', e);
    return false;
  }
}

/**
 * Get manually set user email
 */
function getManualUserEmail() {
  try {
    const properties = PropertiesService.getScriptProperties();
    return properties.getProperty('CURRENT_USER_EMAIL');
  } catch (e) {
    return null;
  }
}

/**
 * Clear manual user session
 */
function clearCurrentUserEmail() {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.deleteProperty('CURRENT_USER_EMAIL');
    return true;
  } catch (e) {
    console.error('Failed to clear current user email:', e);
    return false;
  }
}

/**
 * Get current user object (creates if doesn't exist)
 */
function getCurrentUser() {
  const email = getCurrentUserEmail();
  
  // Don't auto-create user for anonymous email
  if (email === 'anonymous@example.com') {
    throw new Error('No authenticated user found. Please login manually.');
  }
  
  let user = getUserByEmail(email);
  
  if (!user) {
    user = createUser({
      email: email,
      name: email.split('@')[0],
      role: 'admin' // First user is admin
    });
  }
  
  return user;
}

/**
 * Get all users
 */
function getAllUsers() {
  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const columns = CONFIG.USER_COLUMNS;
  const users = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Skip empty rows
    
    const user = rowToObject(row, columns);
    user.active = user.active === true || user.active === 'true';
    users.push(user);
  }
  
  return users;
}

/**
 * Get user by email
 */
function getUserByEmail(email) {
  const users = getAllUsers();
  return users.find(u => u.email?.toLowerCase() === email?.toLowerCase()) || null;
}

/**
 * Create a new user
 */
function createUser(userData) {
  const sheet = getUsersSheet();
  
  // Check if already exists
  if (getUserByEmail(userData.email)) {
    return getUserByEmail(userData.email);
  }
  
  const user = {
    email: userData.email.toLowerCase().trim(),
    name: userData.name || userData.email.split('@')[0],
    role: userData.role || 'member',
    active: true,
    workbookId: userData.workbookId || '',
    createdAt: now()
  };
  
  sheet.appendRow(objectToRow(user, CONFIG.USER_COLUMNS));
  return user;
}

/**
 * Update a user
 */
function updateUser(email, updates) {
  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();
  const columns = CONFIG.USER_COLUMNS;
  const emailIndex = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIndex]?.toLowerCase() === email?.toLowerCase()) {
      const user = rowToObject(data[i], columns);
      Object.assign(user, updates);
      
      const newRow = objectToRow(user, columns);
      sheet.getRange(i + 1, 1, 1, columns.length).setValues([newRow]);
      
      return user;
    }
  }
  
  throw new Error('User not found: ' + email);
}

/**
 * Get active users only
 */
function getActiveUsers() {
  return getAllUsers().filter(u => u.active);
}

// =============================================================================
// PROJECT OPERATIONS
// =============================================================================

/**
 * Get all projects
 */
function getAllProjects() {
  const sheet = getProjectsSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const columns = CONFIG.PROJECT_COLUMNS;
  const projects = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    
    projects.push(rowToObject(row, columns));
  }
  
  return projects;
}

/**
 * Get project by ID
 */
function getProjectById(projectId) {
  const projects = getAllProjects();
  return projects.find(p => p.id === projectId) || null;
}

/**
 * Create a new project
 */
function createProject(projectData) {
  const sheet = getProjectsSheet();
  const existingProjects = getAllProjects();
  const currentUser = getCurrentUserEmail();
  
  // Generate acronym if not provided
  const projectId = projectData.id || generateProjectAcronym(projectData.name, existingProjects);
  
  const project = {
    id: projectId,
    name: sanitize(projectData.name || 'New Project'),
    description: sanitize(projectData.description || ''),
    status: projectData.status || 'active',
    ownerId: projectData.ownerId || currentUser,
    startDate: projectData.startDate || now().split('T')[0],
    endDate: projectData.endDate || '',
    createdAt: now()
  };
  
  sheet.appendRow(objectToRow(project, CONFIG.PROJECT_COLUMNS));
  logActivity(currentUser, 'created', 'project', project.id, { name: project.name });
  
  return project;
}

/**
 * Update a project
 */
function updateProject(projectId, updates) {
  const sheet = getProjectsSheet();
  const data = sheet.getDataRange().getValues();
  const columns = CONFIG.PROJECT_COLUMNS;
  const idIndex = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === projectId) {
      const project = rowToObject(data[i], columns);
      Object.assign(project, updates);
      
      const newRow = objectToRow(project, columns);
      sheet.getRange(i + 1, 1, 1, columns.length).setValues([newRow]);
      
      return project;
    }
  }
  
  throw new Error('Project not found: ' + projectId);
}

// =============================================================================
// COMMENT OPERATIONS
// =============================================================================

/**
 * Get comments for a task
 */
function getCommentsForTask(taskId) {
  const sheet = getCommentsSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const columns = CONFIG.COMMENT_COLUMNS;
  const taskIdIndex = 1; // taskId is second column
  const comments = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][taskIdIndex] === taskId) {
      comments.push(rowToObject(data[i], columns));
    }
  }
  
  // Sort by creation date
  return comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Add a comment to a task
 */
function addComment(taskId, content) {
  const sheet = getCommentsSheet();
  const currentUser = getCurrentUserEmail();
  const timestamp = now();
  
  const comment = {
    id: generateId('cmt'),
    taskId: taskId,
    userId: currentUser,
    content: sanitize(content),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  sheet.appendRow(objectToRow(comment, CONFIG.COMMENT_COLUMNS));
  logActivity(currentUser, 'commented', 'task', taskId, { preview: content.substring(0, 50) });
  
  return comment;
}

/**
 * Delete a comment
 */
function deleteComment(commentId) {
  const sheet = getCommentsSheet();
  const data = sheet.getDataRange().getValues();
  const idIndex = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === commentId) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  
  return false;
}

// =============================================================================
// MENTION OPERATIONS
// =============================================================================

/**
 * Create a mention record
 */
function createMention(mentionData) {
  const sheet = getMentionsSheet();
  const timestamp = now();
  
  const mention = {
    id: generateId('men'),
    commentId: mentionData.commentId,
    mentionedUserId: mentionData.mentionedUserId,
    mentionedByUserId: mentionData.mentionedByUserId,
    taskId: mentionData.taskId,
    createdAt: timestamp,
    notificationSent: false,
    acknowledged: false
  };
  
  sheet.appendRow(objectToRow(mention, CONFIG.MENTION_COLUMNS));
  return mention;
}

/**
 * Get mentions for a user
 */
function getMentionsForUser(userId, limit = 50) {
  const sheet = getMentionsSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const columns = CONFIG.MENTION_COLUMNS;
  const mentions = [];
  
  for (let i = 1; i < data.length; i++) {
    const mention = rowToObject(data[i], columns);
    if (mention.mentionedUserId === userId) {
      mentions.push(mention);
    }
  }
  
  // Sort by creation date descending
  mentions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return mentions.slice(0, limit);
}

/**
 * Mark mention as acknowledged
 */
function acknowledgeMention(mentionId) {
  const sheet = getMentionsSheet();
  const data = sheet.getDataRange().getValues();
  const columns = CONFIG.MENTION_COLUMNS;
  const idIndex = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === mentionId) {
      const mention = rowToObject(data[i], columns);
      mention.acknowledged = true;
      
      const newRow = objectToRow(mention, columns);
      sheet.getRange(i + 1, 1, 1, columns.length).setValues([newRow]);
      return mention;
    }
  }
  
  throw new Error('Mention not found: ' + mentionId);
}

// =============================================================================
// NOTIFICATION OPERATIONS
// =============================================================================

/**
 * Create a notification
 */
function createNotification(notificationData) {
  const sheet = getNotificationsSheet();
  const timestamp = now();
  
  const notification = {
    id: generateId('not'),
    userId: notificationData.userId,
    type: notificationData.type,
    title: sanitize(notificationData.title || ''),
    message: sanitize(notificationData.message || ''),
    entityType: notificationData.entityType || '',
    entityId: notificationData.entityId || '',
    read: false,
    createdAt: timestamp,
    scheduledFor: notificationData.scheduledFor || timestamp,
    channels: Array.isArray(notificationData.channels) ? 
              notificationData.channels.join(',') : 
              (notificationData.channels || 'in_app')
  };
  
  sheet.appendRow(objectToRow(notification, CONFIG.NOTIFICATION_COLUMNS));
  return notification;
}

/**
 * Get notifications for a user
 */
/**
 * Get notifications for a user
 */
function getNotificationsForUser(userId, limit = 50, unreadOnly = false) {
  try {
    const sheet = getNotificationsSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const columns = CONFIG.NOTIFICATION_COLUMNS;
    const notifications = [];
    
    for (let i = 1; i < data.length; i++) {
      const notification = rowToObject(data[i], columns);
      
      if (notification.userId === userId) {
        // Convert read status to boolean
        notification.read = notification.read === true || notification.read === 'true';
        
        // Filter by read status if requested
        if (unreadOnly && notification.read) continue;
        
        // Parse channels back to array
        if (typeof notification.channels === 'string' && notification.channels) {
          notification.channels = notification.channels.split(',').map(c => c.trim());
        } else {
          notification.channels = ['in_app'];
        }
        
        notifications.push(notification);
      }
    }
    
    // Sort by creation date descending
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return notifications.slice(0, limit);
  } catch (error) {
    console.error('Error getting notifications for user:', error);
    return []; // Return empty array instead of undefined
  }
}

/**
 * Mark notification as read
 */
function markNotificationAsRead(notificationId) {
  const sheet = getNotificationsSheet();
  const data = sheet.getDataRange().getValues();
  const columns = CONFIG.NOTIFICATION_COLUMNS;
  const idIndex = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === notificationId) {
      const notification = rowToObject(data[i], columns);
      notification.read = true;
      
      const newRow = objectToRow(notification, columns);
      sheet.getRange(i + 1, 1, 1, columns.length).setValues([newRow]);
      return notification;
    }
  }
  
  throw new Error('Notification not found: ' + notificationId);
}

/**
 * Get pending notifications (scheduled for delivery)
 */
function getPendingNotifications(limit = 100) {
  const sheet = getNotificationsSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const columns = CONFIG.NOTIFICATION_COLUMNS;
  const notifications = [];
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    const notification = rowToObject(data[i], columns);
    
    // Check if scheduled for delivery and not yet processed
    const scheduledFor = new Date(notification.scheduledFor);
    if (scheduledFor <= now && !notification.processed) {
      notifications.push(notification);
    }
  }
  
  return notifications.slice(0, limit);
}

// =============================================================================
// ANALYTICS CACHE OPERATIONS
// =============================================================================

/**
 * Get cached analytics data
 */
function getCachedAnalytics(cacheKey) {
  const sheet = getAnalyticsCacheSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return null;
  
  const columns = CONFIG.ANALYTICS_CACHE_COLUMNS;
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    const cache = rowToObject(data[i], columns);
    
    if (cache.cacheKey === cacheKey) {
      // Check if expired
      const expiresAt = new Date(cache.expiresAt);
      if (expiresAt > now) {
        try {
          return JSON.parse(cache.data);
        } catch (e) {
          console.error('Failed to parse cached data:', e);
          return null;
        }
      } else {
        // Remove expired cache entry
        sheet.deleteRow(i + 1);
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Set cached analytics data
 */
function setCachedAnalytics(cacheKey, data, ttlSeconds = 3600) {
  const sheet = getAnalyticsCacheSheet();
  const timestamp = now();
  const expiresAt = new Date(Date.now() + (ttlSeconds * 1000)).toISOString();
  
  // Remove existing cache entry if it exists
  const existingData = sheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][1] === cacheKey) { // cacheKey is column 1
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  const cache = {
    id: generateId('cache'),
    cacheKey: cacheKey,
    data: JSON.stringify(data),
    expiresAt: expiresAt,
    createdAt: timestamp
  };
  
  sheet.appendRow(objectToRow(cache, CONFIG.ANALYTICS_CACHE_COLUMNS));
  return cache;
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const sheet = getAnalyticsCacheSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return 0;
  
  const now = new Date();
  let cleared = 0;
  
  // Go backwards to avoid index shifting issues
  for (let i = data.length - 1; i >= 1; i--) {
    const expiresAt = new Date(data[i][3]); // expiresAt is column 3
    if (expiresAt <= now) {
      sheet.deleteRow(i + 1);
      cleared++;
    }
  }
  
  return cleared;
}

// =============================================================================
// TASK DEPENDENCY OPERATIONS
// =============================================================================

/**
 * Create a task dependency
 */
function createTaskDependency(dependencyData) {
  const sheet = getTaskDependenciesSheet();
  const timestamp = now();
  
  const dependency = {
    id: generateId('dep'),
    predecessorId: dependencyData.predecessorId,
    successorId: dependencyData.successorId,
    dependencyType: dependencyData.dependencyType || 'finish_to_start',
    lag: parseFloat(dependencyData.lag) || 0,
    createdAt: timestamp
  };
  
  sheet.appendRow(objectToRow(dependency, CONFIG.TASK_DEPENDENCY_COLUMNS));
  return dependency;
}

/**
 * Get dependencies for a task
 */
function getTaskDependencies(taskId) {
  const sheet = getTaskDependenciesSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return { predecessors: [], successors: [] };
  
  const columns = CONFIG.TASK_DEPENDENCY_COLUMNS;
  const predecessors = [];
  const successors = [];
  
  for (let i = 1; i < data.length; i++) {
    const dependency = rowToObject(data[i], columns);
    
    if (dependency.successorId === taskId) {
      predecessors.push(dependency);
    }
    if (dependency.predecessorId === taskId) {
      successors.push(dependency);
    }
  }
  
  return { predecessors, successors };
}

/**
 * Delete a task dependency
 */
function deleteTaskDependency(dependencyId) {
  const sheet = getTaskDependenciesSheet();
  const data = sheet.getDataRange().getValues();
  const idIndex = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === dependencyId) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  
  return false;
}

// =============================================================================
// ACTIVITY LOG
// =============================================================================

/**
 * Log an activity
 */
function logActivity(userId, action, entityType, entityId, details) {
  try {
    const sheet = getActivitySheet();
    
    const activity = {
      id: generateId('act'),
      userId: userId,
      action: action,
      entityType: entityType,
      entityId: entityId,
      details: JSON.stringify(details),
      timestamp: now()
    };
    
    sheet.appendRow(objectToRow(activity, CONFIG.ACTIVITY_COLUMNS));
  } catch (e) {
    // Don't let activity logging break operations
    console.error('Activity log error:', e);
  }
}

/**
 * Get recent activity
 */
function getRecentActivity(limit = 50, entityId = null) {
  const sheet = getActivitySheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const columns = CONFIG.ACTIVITY_COLUMNS;
  let activities = [];
  
  for (let i = 1; i < data.length; i++) {
    const activity = rowToObject(data[i], columns);
    
    // Parse details JSON
    try {
      activity.details = JSON.parse(activity.details || '{}');
    } catch (e) {
      activity.details = {};
    }
    
    // Filter by entity if specified
    if (entityId && activity.entityId !== entityId) continue;
    
    activities.push(activity);
  }
  
  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return activities.slice(0, limit);
}
