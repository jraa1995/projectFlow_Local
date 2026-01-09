/**
 * ProjectFlow - Enterprise Project Management System
 * Main entry point and server-side functions called by frontend
 * 
 * Architecture: Direct function calls from frontend, no API router
 * Frontend uses google.script.run to call these functions directly
 */

// =============================================================================
// WEB APP ENTRY POINT
// =============================================================================

/**
 * Serve the web application
 */
function doGet(e) {
  try {
    // Ensure system is set up
    initializeSystem();
    
    // Serve the main HTML template
    const template = HtmlService.createTemplateFromFile('Index');
    
    return template.evaluate()
      .setTitle('ProjectFlow')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
      
  } catch (error) {
    console.error('doGet error:', error);
    return HtmlService.createHtmlOutput(getErrorPage(error.message));
  }
}

/**
 * Include HTML files (for templates)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Error page HTML
 */
function getErrorPage(message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ProjectFlow - Setup Required</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; background: #f8fafc; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; 
                     border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #f59e0b; }
        .error { color: #dc2626; font-size: 14px; background: #fef2f2; padding: 10px; border-radius: 4px; margin: 20px 0; }
        button { padding: 12px 24px; background: #f59e0b; color: white; border: none; 
                 border-radius: 8px; cursor: pointer; font-size: 16px; }
        button:hover { background: #d97706; }
        code { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚙️ Setup Required</h1>
        <p>Please run <code>quickSetup()</code> in the Apps Script editor.</p>
        <div class="error">${message}</div>
        <button onclick="location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `;
}

// =============================================================================
// SYSTEM INITIALIZATION
// =============================================================================

/**
 * Initialize the system - creates all required sheets
 */
function initializeSystem() {
  console.log('Initializing ProjectFlow...');
  
  try {
    // First, verify CONFIG is loaded
    if (typeof CONFIG === 'undefined') {
      throw new Error('CONFIG object is undefined. Check Config.gs for syntax errors.');
    }
    
    console.log('CONFIG loaded successfully');
    console.log('Available CONFIG keys:', Object.keys(CONFIG));
    
    // Create all sheets (getSheet will create if missing)
    console.log('Creating/verifying sheets...');
    
    // Create sheets one by one with error handling
    try {
      getTasksSheet();
      console.log('✅ Tasks sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Tasks sheet:', e.message);
      throw e;
    }
    
    try {
      getUsersSheet();
      console.log('✅ Users sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Users sheet:', e.message);
      throw e;
    }
    
    try {
      getProjectsSheet();
      console.log('✅ Projects sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Projects sheet:', e.message);
      throw e;
    }
    
    try {
      getCommentsSheet();
      console.log('✅ Comments sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Comments sheet:', e.message);
      throw e;
    }
    
    try {
      getActivitySheet();
      console.log('✅ Activity sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Activity sheet:', e.message);
      throw e;
    }
    
    try {
      getMentionsSheet();
      console.log('✅ Mentions sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Mentions sheet:', e.message);
      throw e;
    }
    
    try {
      getNotificationsSheet();
      console.log('✅ Notifications sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Notifications sheet:', e.message);
      throw e;
    }
    
    try {
      getAnalyticsCacheSheet();
      console.log('✅ Analytics Cache sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Analytics Cache sheet:', e.message);
      throw e;
    }
    
    try {
      getTaskDependenciesSheet();
      console.log('✅ Task Dependencies sheet ready');
    } catch (e) {
      console.error('❌ Failed to create Task Dependencies sheet:', e.message);
      throw e;
    }
    
    console.log('All sheets verified/created');
    
    // Ensure current user exists
    console.log('Verifying current user...');
    getCurrentUser();
    console.log('Current user verified');
    
    console.log('ProjectFlow initialized successfully');
  } catch (error) {
    console.error('Error during system initialization:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Quick setup - run this first
 */
function quickSetup() {
  console.log('🚀 ProjectFlow Quick Setup');
  console.log('==========================');
  
  try {
    // Initialize system
    initializeSystem();
    console.log('✅ Sheets created');
    
    // Get current user
    const user = getCurrentUser();
    console.log('✅ User setup:', user.email);
    
    // Create a default project if none exist
    const projects = getAllProjects();
    if (projects.length === 0) {
      createProject({
        name: 'Default Project',
        description: 'Your first project'
      });
      console.log('✅ Default project created');
    }
    
    // Create sample tasks if none exist
    const tasks = getAllTasks();
    if (tasks.length === 0) {
      createSampleTasks();
      console.log('✅ Sample tasks created');
    }
    
    console.log('');
    console.log('🎉 Setup Complete!');
    console.log('==================');
    console.log('Deploy → New deployment → Web app');
    console.log('Execute as: Me');
    console.log('Access: Anyone (or your domain)');
    
    return { success: true, user: user.email };
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create sample tasks for demo
 */
function createSampleTasks() {
  const projects = getAllProjects();
  const projectId = projects[0]?.id || '';
  const userEmail = getCurrentUserEmail();
  
  const samples = [
    { title: 'Set up project repository', status: 'Done', priority: 'High', type: 'Task' },
    { title: 'Design database schema', status: 'Done', priority: 'High', type: 'Task' },
    { title: 'Implement user authentication', status: 'In Progress', priority: 'Critical', type: 'Feature' },
    { title: 'Create dashboard UI', status: 'In Progress', priority: 'High', type: 'Feature' },
    { title: 'Fix login redirect bug', status: 'To Do', priority: 'Medium', type: 'Bug' },
    { title: 'Write API documentation', status: 'To Do', priority: 'Low', type: 'Task' },
    { title: 'Set up CI/CD pipeline', status: 'Backlog', priority: 'Medium', type: 'Task' },
    { title: 'Performance optimization', status: 'Backlog', priority: 'Low', type: 'Story' }
  ];
  
  samples.forEach((task, i) => {
    createTask({
      ...task,
      projectId: projectId,
      assignee: userEmail,
      description: 'Sample task created during setup',
      dueDate: getFutureDate(i * 3) // Stagger due dates
    });
  });
}

/**
 * Get a date X days in the future
 */
function getFutureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// =============================================================================
// FRONTEND API FUNCTIONS
// These functions are called directly by the frontend via google.script.run
// =============================================================================

/**
 * Get initial data for app startup - optimized version
 */
function getInitialData() {
  try {
    console.log('Getting initial data...');
    
    // First ensure system is initialized
    initializeSystem();
    
    const userEmail = getCurrentUserEmailOptimized();
    
    if (!userEmail) {
      throw new Error('User not authenticated. Please login.');
    }
    
    const user = getUserByEmailOptimized(userEmail);
    if (!user) {
      throw new Error('User session invalid. Please login again.');
    }
    
    console.log('Loading board data for user:', userEmail);
    const boardData = getMyBoardOptimized(null, userEmail);
    
    const result = {
      user: user,
      board: boardData,
      config: {
        statuses: CONFIG.STATUSES,
        priorities: CONFIG.PRIORITIES,
        types: CONFIG.TYPES,
        colors: CONFIG.COLORS
      }
    };
    
    console.log('Initial data loaded successfully');
    return result;
  } catch (error) {
    console.error('getInitialData failed:', error);
    throw new Error('Failed to load initial data. Please try logging in manually.');
  }
}

/**
 * Enhanced login with email address - optimized for Google Apps Script
 */
function loginWithEmail(email) {
  try {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    
    // Normalize email
    email = email.toLowerCase().trim();
    
    // Check if user exists in the Users sheet (optimized query)
    const user = getUserByEmailOptimized(email);
    if (!user) {
      throw new Error('User not found. Please contact your administrator for access.');
    }
    
    // Set the user session efficiently
    setCurrentUserEmailOptimized(email);
    
    // Get board data for this user (with caching)
    const boardData = getMyBoardOptimized(null, email);
    
    return {
      user: user,
      board: boardData,
      config: {
        statuses: CONFIG.STATUSES,
        priorities: CONFIG.PRIORITIES,
        types: CONFIG.TYPES,
        colors: CONFIG.COLORS
      }
    };
  } catch (error) {
    console.error('loginWithEmail failed:', error);
    throw error;
  }
}

/**
 * Optimized user lookup by email
 */
function getUserByEmailOptimized(email) {
  try {
    const sheet = getUsersSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return null; // No users or only header
    
    const headers = data[0];
    const emailIndex = headers.indexOf('email');
    
    if (emailIndex === -1) return null;
    
    // Find user row
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] && data[i][emailIndex].toLowerCase() === email) {
        const user = {};
        headers.forEach((header, index) => {
          user[header] = data[i][index];
        });
        return user;
      }
    }
    
    return null;
  } catch (error) {
    console.error('getUserByEmailOptimized failed:', error);
    return null;
  }
}

/**
 * Optimized current user email storage
 */
function setCurrentUserEmailOptimized(email) {
  try {
    // Use PropertiesService for session storage (more efficient than sheets)
    PropertiesService.getScriptProperties().setProperty('CURRENT_USER_EMAIL', email);
    PropertiesService.getScriptProperties().setProperty('LOGIN_TIMESTAMP', new Date().getTime().toString());
  } catch (error) {
    console.error('setCurrentUserEmailOptimized failed:', error);
  }
}

/**
 * Get current user email from optimized storage
 */
function getCurrentUserEmailOptimized() {
  try {
    const email = PropertiesService.getScriptProperties().getProperty('CURRENT_USER_EMAIL');
    const timestamp = PropertiesService.getScriptProperties().getProperty('LOGIN_TIMESTAMP');
    
    // Check if session is still valid (24 hours)
    if (email && timestamp) {
      const loginTime = parseInt(timestamp);
      const now = new Date().getTime();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - loginTime < sessionDuration) {
        return email;
      }
    }
    
    return null;
  } catch (error) {
    console.error('getCurrentUserEmailOptimized failed:', error);
    return null;
  }
}

/**
 * Optimized board data loading
 */
function getMyBoardOptimized(projectId, userEmail) {
  try {
    const currentUser = userEmail || getCurrentUserEmailOptimized();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get tasks efficiently
    const allTasks = getAllTasksOptimized();
    const userTasks = allTasks.filter(task => task.assignee === currentUser);
    
    // Filter by project if specified
    const filteredTasks = projectId ? 
      userTasks.filter(task => task.projectId === projectId) : 
      userTasks;
    
    // Get projects and users (cached)
    const projects = getAllProjectsOptimized();
    const users = getActiveUsersOptimized();
    
    // Build board structure
    const board = buildBoardData(filteredTasks, projectId, {
      view: 'my',
      userEmail: currentUser
    });
    
    return {
      ...board,
      projects: projects,
      users: users,
      taskCount: filteredTasks.length
    };
    
  } catch (error) {
    console.error('getMyBoardOptimized failed:', error);
    throw error;
  }
}

/**
 * Optimized task loading with caching
 */
function getAllTasksOptimized() {
  try {
    // Check cache first
    const cache = CacheService.getScriptCache();
    const cacheKey = 'ALL_TASKS_CACHE';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Load from sheet
    const tasks = getAllTasks();
    
    // Cache for 5 minutes
    cache.put(cacheKey, JSON.stringify(tasks), 300);
    
    return tasks;
  } catch (error) {
    console.error('getAllTasksOptimized failed:', error);
    return getAllTasks(); // Fallback to original method
  }
}

/**
 * Optimized project loading with caching
 */
function getAllProjectsOptimized() {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'ALL_PROJECTS_CACHE';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const projects = getAllProjects();
    cache.put(cacheKey, JSON.stringify(projects), 600); // Cache for 10 minutes
    
    return projects;
  } catch (error) {
    console.error('getAllProjectsOptimized failed:', error);
    return getAllProjects();
  }
}

/**
 * Optimized user loading with caching
 */
function getActiveUsersOptimized() {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'ACTIVE_USERS_CACHE';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const users = getActiveUsers();
    cache.put(cacheKey, JSON.stringify(users), 1800); // Cache for 30 minutes
    
    return users;
  } catch (error) {
    console.error('getActiveUsersOptimized failed:', error);
    return getActiveUsers();
  }
}

/**
 * Clear all caches (for data updates)
 */
function clearAllCaches() {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll(['ALL_TASKS_CACHE', 'ALL_PROJECTS_CACHE', 'ACTIVE_USERS_CACHE']);
  } catch (error) {
    console.error('clearAllCaches failed:', error);
  }
}

/**
 * Enhanced logout with cache clearing
 */
function logoutOptimized() {
  try {
    // Clear session
    PropertiesService.getScriptProperties().deleteProperty('CURRENT_USER_EMAIL');
    PropertiesService.getScriptProperties().deleteProperty('LOGIN_TIMESTAMP');
    
    // Clear user-specific caches
    clearAllCaches();
    
    return { success: true };
  } catch (error) {
    console.error('logoutOptimized failed:', error);
    throw error;
  }
}

/**
 * Logout current user
 */
function logout() {
  return logoutOptimized();
}

/**
 * Create sample users for testing (admin function)
 */
function createSampleUsers() {
  try {
    const sampleUsers = [
      { email: 'user@test.com', name: 'Test User', role: 'member' },
      { email: 'admin@test.com', name: 'Admin User', role: 'admin' },
      { email: 'manager@test.com', name: 'Manager User', role: 'admin' },
      { email: 'developer@test.com', name: 'Developer User', role: 'member' }
    ];
    
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = getUserByEmail(userData.email);
      if (!existingUser) {
        const user = createUser(userData);
        createdUsers.push(user);
        console.log(`Created user: ${user.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }
    
    return {
      success: true,
      created: createdUsers.length,
      message: `Created ${createdUsers.length} sample users. You can now login with: user@test.com, admin@test.com, manager@test.com, or developer@test.com`
    };
  } catch (error) {
    console.error('createSampleUsers failed:', error);
    throw error;
  }
}

/**
 * Get My Board data - optimized
 */
function loadMyBoard(projectId) {
  return getMyBoardOptimized(projectId || null);
}

/**
 * Get Master Board data - optimized
 */
function loadMasterBoard(projectId) {
  try {
    // Get all tasks efficiently
    const allTasks = getAllTasksOptimized();
    
    // Filter by project if specified
    const filteredTasks = projectId ? 
      allTasks.filter(task => task.projectId === projectId) : 
      allTasks;
    
    // Get projects and users (cached)
    const projects = getAllProjectsOptimized();
    const users = getActiveUsersOptimized();
    
    // Build board structure
    const board = buildBoardData(filteredTasks, projectId, {
      view: 'master'
    });
    
    return {
      ...board,
      projects: projects,
      users: users,
      taskCount: filteredTasks.length
    };
    
  } catch (error) {
    console.error('loadMasterBoard failed:', error);
    throw error;
  }
}

/**
 * Create a new task
 */
function saveNewTask(taskData) {
  const result = createTask(taskData);
  clearAllCaches(); // Clear caches after data change
  return result;
}

/**
 * Update an existing task
 */
function saveTaskUpdate(taskId, updates) {
  const result = updateTask(taskId, updates);
  clearAllCaches(); // Clear caches after data change
  return result;
}

/**
 * Move task to new status
 */
function moveTaskToStatus(taskId, newStatus, newPosition) {
  // Convert column ID to status name if needed
  const status = denormalizeStatusId(newStatus);
  const result = moveTask(taskId, status, newPosition);
  clearAllCaches(); // Clear caches after data change
  return result;
}

/**
 * Delete a task
 */
function removeTask(taskId) {
  const result = deleteTask(taskId);
  clearAllCaches(); // Clear caches after data change
  return result;
}

/**
 * Get single task by ID
 */
function loadTask(taskId) {
  return getTaskById(taskId);
}

/**
 * Search tasks
 */
function searchAllTasks(query, projectId) {
  return searchTasks(query, projectId || null);
}

/**
 * Create a new project
 */
function saveNewProject(projectData) {
  return createProject(projectData);
}

/**
 * Get all projects
 */
function loadProjects() {
  return getAllProjects();
}

/**
 * Get all users
 */
function loadUsers() {
  return getActiveUsers();
}

/**
 * Get comments for a task (enhanced with mention support)
 */
function loadComments(taskId) {
  const comments = getCommentsForTask(taskId);
  
  // Process comments to include formatted content
  return comments.map(comment => {
    // Get mentioned users from comment
    const mentionedUsers = comment.mentionedUsers ? 
      (typeof comment.mentionedUsers === 'string' ? 
        comment.mentionedUsers.split(',').map(e => e.trim()).filter(e => e) : 
        comment.mentionedUsers) : [];
    
    // Format content with mention highlighting
    const formattedContent = getFormattedCommentContent(comment);
    
    return {
      ...comment,
      formattedContent: formattedContent,
      mentionedUsersList: mentionedUsers
    };
  });
}

/**
 * Add a comment
 */
function saveComment(taskId, content) {
  return addComment(taskId, content);
}

/**
 * Remove a comment
 */
function removeComment(commentId) {
  return deleteComment(commentId);
}

/**
 * Get activity log
 */
function loadActivity(limit, entityId) {
  return getRecentActivity(limit || 50, entityId || null);
}

/**
 * Get all unique labels
 */
function loadLabels() {
  return getAllLabels();
}

/**
 * Get all sprints
 */
function loadSprints() {
  return getAllSprints();
}

/**
 * Get parent tasks (for subtask dropdown)
 */
function loadParentTasks() {
  return getParentTasks();
}

/**
 * Get subtasks of a task
 */
function loadSubtasks(parentId) {
  return getSubtasks(parentId);
}

/**
 * Log time to a task
 */
function logTimeToTask(taskId, hours, description) {
  const task = getTaskById(taskId);
  if (!task) throw new Error('Task not found');
  
  const newActualHrs = (task.actualHrs || 0) + parseFloat(hours);
  updateTask(taskId, { actualHrs: newActualHrs });
  
  // Also add as a comment for tracking
  addComment(taskId, `⏱️ Logged ${hours} hours: ${description || 'Work logged'}`);
  
  return { actualHrs: newActualHrs };
}

/**
 * Get user suggestions for autocomplete
 */
function getUserSuggestions(query, excludeUsers) {
  try {
    return MentionEngine.getUserSuggestions(query, excludeUsers || []);
  } catch (error) {
    console.error('getUserSuggestions error:', error);
    return [];
  }
}

/**
 * Add comment with mention processing
 */
function saveCommentWithMentions(taskId, content, userId) {
  try {
    return addCommentWithMentions(taskId, content, userId);
  } catch (error) {
    console.error('saveCommentWithMentions error:', error);
    throw error;
  }
}

/**
 * Get formatted comment content for display
 */
function getFormattedComment(comment) {
  try {
    return getFormattedCommentContent(comment);
  } catch (error) {
    console.error('getFormattedComment error:', error);
    return comment?.content || '';
  }
}

/**
 * Create a user (admin function)
 */
function addUser(email, name, role) {
  return createUser({ email, name, role });
}

/**
 * Update user (admin function)
 */
function updateUserInfo(email, updates) {
  return updateUser(email, updates);
}

/**
 * Get notifications for current user
 */
function loadNotifications(limit, unreadOnly) {
  try {
    const currentUser = getCurrentUserEmail();
    if (!currentUser) {
      console.log('No current user found for notifications');
      return [];
    }
    return getNotificationsForUser(currentUser, limit || 50, unreadOnly || false);
  } catch (error) {
    console.error('Error loading notifications:', error);
    return []; // Return empty array instead of undefined
  }
}

/**
 * Mark notification as read
 */
function markNotificationRead(notificationId) {
  return markNotificationAsRead(notificationId);
}

/**
 * Get notification statistics for current user
 */
function getNotificationStats() {
  const currentUser = getCurrentUserEmail();
  return NotificationEngine.getNotificationStatistics(currentUser);
}

/**
 * Update user notification preferences
 */
function updateNotificationPreferences(preferences) {
  const currentUser = getCurrentUserEmail();
  return NotificationEngine.updateUserNotificationPreferences(currentUser, preferences);
}

/**
 * Get user notification preferences
 */
function getNotificationPreferences() {
  const currentUser = getCurrentUserEmail();
  return NotificationEngine.getUserNotificationPreferences(currentUser);
}

/**
 * Process pending notifications (admin function)
 */
function processPendingNotifications(batchSize) {
  return NotificationEngine.processPendingNotifications(batchSize || 50);
}

/**
 * Send test email notification (admin function)
 */
function sendTestEmailNotification(userId, type) {
  const testNotification = {
    userId: userId || getCurrentUserEmail(),
    type: type || 'mention',
    title: 'Test Email Notification',
    message: 'This is a test email notification from ProjectFlow',
    entityType: 'task',
    entityId: 'TEST-1',
    channels: ['email']
  };
  
  return EmailNotificationService.sendEmailNotification(testNotification);
}

/**
 * Send batch email notifications (admin function)
 */
function sendBatchEmailNotifications(notifications) {
  return EmailNotificationService.sendBatchEmailNotifications(notifications);
}

/**
 * Run notification property tests (testing function)
 */
function runNotificationPropertyTests() {
  return runMentionNotificationPropertyTest(100);
}

/**
 * Run multi-channel notification property tests (testing function)
 */
function runMultiChannelNotificationPropertyTests() {
  return runMultiChannelNotificationPropertyTest(100);
}

/**
 * Run notification status tracking property tests (testing function)
 */
function runNotificationStatusTrackingPropertyTests() {
  return runNotificationStatusTrackingPropertyTest(100);
}

/**
 * Generate timeline data for a project
 */
function generateTimeline(projectId, dateRange) {
  try {
    return TimelineEngine.generateProjectTimeline(projectId, dateRange);
  } catch (error) {
    console.error('generateTimeline error:', error);
    throw error;
  }
}

/**
 * Get Gantt chart data for a project
 */
function getGanttData(projectId, dateRange) {
  try {
    const timelineData = TimelineEngine.generateProjectTimeline(projectId, dateRange);
    return {
      tasks: timelineData.tasks,
      dependencies: timelineData.dependencies,
      criticalPath: timelineData.criticalPath,
      dateRange: timelineData.dateRange
    };
  } catch (error) {
    console.error('getGanttData error:', error);
    throw error;
  }
}

/**
 * Calculate critical path for a project
 */
function calculateCriticalPath(projectId) {
  try {
    const timelineData = TimelineEngine.generateProjectTimeline(projectId);
    return {
      criticalPath: timelineData.criticalPath,
      tasks: timelineData.tasks.filter(task => 
        timelineData.criticalPath.includes(task.id)
      )
    };
  } catch (error) {
    console.error('calculateCriticalPath error:', error);
    throw error;
  }
}

/**
 * Validate task dependencies for circular dependencies
 */
function validateTaskDependencies(projectId) {
  try {
    const tasks = projectId ? getAllTasks({ projectId }) : getAllTasks();
    const dependencies = TimelineEngine.processDependencies(tasks);
    return TimelineEngine.validateDependencies(dependencies);
  } catch (error) {
    console.error('validateTaskDependencies error:', error);
    throw error;
  }
}

/**
 * Run timeline data completeness property test (testing function)
 */
function runTimelineDataCompletenessPropertyTest(iterations) {
  return runTimelinePropertyTest(iterations || 100);
}

/**
 * Run dependency consistency property test (testing function)
 */
function runDependencyConsistencyPropertyTest(iterations) {
  return runDependencyPropertyTest(iterations || 100);
}

/**
 * Get filtered timeline data with search and filters
 */
function getFilteredTimeline(projectId, filters) {
  try {
    return getFilteredTimelineData(projectId, filters);
  } catch (error) {
    console.error('getFilteredTimeline error:', error);
    throw error;
  }
}

/**
 * Search timeline tasks with advanced search
 */
function searchTimeline(query, projectId, searchOptions) {
  try {
    return searchTimelineTasks(query, projectId, searchOptions);
  } catch (error) {
    console.error('searchTimeline error:', error);
    throw error;
  }
}

/**
 * Get timeline filter suggestions
 */
function getTimelineFilters(projectId) {
  try {
    return getTimelineFilterSuggestions(projectId);
  } catch (error) {
    console.error('getTimelineFilters error:', error);
    throw error;
  }
}

/**
 * Run timeline filtering accuracy property test (testing function)
 */
function runTimelineFilteringAccuracyPropertyTest(iterations) {
  return runTimelineFilteringPropertyTest(iterations || 100);
}

/**
 * Generate comprehensive critical path analysis
 */
function getCriticalPathAnalysis(projectId, options) {
  try {
    return generateCriticalPathAnalysis(projectId, options);
  } catch (error) {
    console.error('getCriticalPathAnalysis error:', error);
    throw error;
  }
}

/**
 * Run critical path calculation property test (testing function)
 */
function runCriticalPathCalculationPropertyTest(iterations) {
  return runCriticalPathPropertyTest(iterations || 100);
}

// =============================================================================
// MENU FUNCTIONS
// =============================================================================

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🚀 ProjectFlow')
      .addItem('Quick Setup', 'quickSetup')
      .addItem('Open Web App', 'openWebApp')
      .addSeparator()
      .addItem('Test System', 'testSystem')
      .addItem('Clear Sample Data', 'clearSampleData')
      .addItem('Cleanup Duplicate Sheets', 'cleanupDuplicateSheets')
      .addToUi();
  } catch (e) {
    console.error('Menu error:', e);
  }
}

function openWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = `<script>window.open('${url}', '_blank'); google.script.host.close();</script>`;
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(1).setHeight(1),
    'Opening...'
  );
}

function testSystem() {
  console.log('🧪 Testing ProjectFlow');
  console.log('======================');
  
  const tests = [
    { name: 'Get User', fn: () => getCurrentUser() },
    { name: 'Get Tasks', fn: () => getAllTasks() },
    { name: 'Get My Board', fn: () => getMyBoard(null) },
    { name: 'Get Master Board', fn: () => getMasterBoard(null) },
    { name: 'Get Projects', fn: () => getAllProjects() },
    { name: 'Get Users', fn: () => getAllUsers() }
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(test => {
    try {
      const result = test.fn();
      console.log(`✅ ${test.name}: OK`);
      passed++;
    } catch (e) {
      console.log(`❌ ${test.name}: ${e.message}`);
      failed++;
    }
  });
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  }
  
  return { passed, failed };
}

function clearSampleData() {
  const tasks = getAllTasks();
  let cleared = 0;
  
  tasks.forEach(task => {
    if (task.description?.includes('Sample task created during setup')) {
      deleteTask(task.id);
      cleared++;
    }
  });
  
  console.log(`Cleared ${cleared} sample tasks`);
  return cleared;
}
/**
 * Get analytics data for dashboard
 */
function getAnalyticsData(days) {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const dateRange = { start: startDate, end: endDate };
    
    // Get productivity metrics
    const metrics = AnalyticsEngine.calculateProductivityMetrics(dateRange);
    
    // Get team productivity
    const teamProductivity = AnalyticsEngine.calculateTeamUtilization(getAllTasks());
    
    // Get project health
    const projectHealth = getAllProjects().map(project => {
      const projectTasks = getAllTasks().filter(task => task.projectId === project.id);
      const completedTasks = projectTasks.filter(task => task.status === 'Done').length;
      const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
      
      let health = 'good';
      if (progress < 30) health = 'poor';
      else if (progress < 60) health = 'at-risk';
      else if (progress < 90) health = 'good';
      else health = 'excellent';
      
      return {
        name: project.name,
        progress: Math.round(progress),
        health: health,
        totalTasks: projectTasks.length,
        tasksCompleted: completedTasks
      };
    });
    
    // Get recent activity
    const recentActivity = getRecentActivity(20).map(activity => ({
      type: activity.action || 'update',
      description: activity.description || `${activity.action || 'Updated'} ${activity.entityType} ${activity.entityId}`,
      user: getNameFromEmail(activity.userId) || activity.userId,
      timestamp: activity.createdAt
    }));
    
    // Get completion trend
    const completionTrend = AnalyticsEngine.calculateVelocityTrend(
      getAllTasks(), 
      startDate, 
      endDate
    );
    
    // Get priority distribution
    const priorityDistribution = AnalyticsEngine.calculatePriorityDistribution(getAllTasks());
    
    return {
      metrics: metrics,
      teamProductivity: teamProductivity,
      projectHealth: projectHealth,
      recentActivity: recentActivity,
      completionTrend: completionTrend,
      priorityDistribution: priorityDistribution
    };
    
  } catch (error) {
    console.error('getAnalyticsData failed:', error);
    throw error;
  }
}

/**
 * Get filtered timeline data with enhanced filtering
 */
function getFilteredTimeline(projectId, filters) {
  try {
    // Get base timeline data
    const timelineData = TimelineEngine.generateProjectTimeline(projectId, filters?.dateRange);
    
    if (!timelineData || !timelineData.tasks) {
      return {
        tasks: [],
        dependencies: [],
        criticalPath: [],
        dateRange: filters?.dateRange || null
      };
    }
    
    let filteredTasks = [...timelineData.tasks];
    
    // Apply filters
    if (filters?.assignee) {
      filteredTasks = filteredTasks.filter(task => task.assignee === filters.assignee);
    }
    
    if (filters?.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    
    if (filters?.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        (task.name && task.name.toLowerCase().includes(searchLower)) ||
        (task.title && task.title.toLowerCase().includes(searchLower)) ||
        (task.id && task.id.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters?.showOverdueOnly) {
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => 
        task.end < now && task.status !== 'Done'
      );
    }
    
    return {
      tasks: filteredTasks,
      dependencies: timelineData.dependencies || [],
      criticalPath: timelineData.criticalPath || [],
      dateRange: timelineData.dateRange
    };
    
  } catch (error) {
    console.error('getFilteredTimeline failed:', error);
    throw error;
  }
}

/**
 * Get comprehensive analytics for executive dashboard
 */
function getExecutiveDashboard(portfolioFilter) {
  try {
    return AnalyticsEngine.generateExecutiveDashboard(portfolioFilter);
  } catch (error) {
    console.error('getExecutiveDashboard failed:', error);
    throw error;
  }
}

/**
 * Get predictive analytics for a project
 */
function getPredictiveAnalytics(projectId, confidenceLevel) {
  try {
    return AnalyticsEngine.generatePredictions(projectId, confidenceLevel || 0.8);
  } catch (error) {
    console.error('getPredictiveAnalytics failed:', error);
    throw error;
  }
}

/**
 * Get bottleneck analysis
 */
function getBottleneckAnalysis(timeframe) {
  try {
    const tasks = getAllTasks();
    return AnalyticsEngine.identifyBottlenecks(tasks, timeframe || 30);
  } catch (error) {
    console.error('getBottleneckAnalysis failed:', error);
    throw error;
  }
}

/**
 * Get burndown chart data
 */
function getBurndownData(sprintId, projectId) {
  try {
    return AnalyticsEngine.calculateBurndownData(sprintId, projectId);
  } catch (error) {
    console.error('getBurndownData failed:', error);
    throw error;
  }
}

/**
 * Detect anomalies in project data
 */
function detectProjectAnomalies(timeframe) {
  try {
    const tasks = getAllTasks();
    return AnalyticsEngine.detectAnomalies(tasks, timeframe || 30);
  } catch (error) {
    console.error('detectProjectAnomalies failed:', error);
    throw error;
  }
}

/**
 * Get name from email with fallback
 */
function getNameFromEmail(email) {
  if (!email) return 'Unknown';
  
  const users = getActiveUsers();
  const user = users.find(u => u.email === email);
  
  if (user && user.name) return user.name;
  
  // Fallback: format email as name
  return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}