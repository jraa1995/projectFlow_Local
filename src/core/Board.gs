/**
 * ProjectFlow Board Module
 * Builds Kanban board views and calculates statistics
 */

// =============================================================================
// BOARD DATA BUILDING
// =============================================================================

/**
 * Get board data for "My Board" view
 * Shows only tasks assigned to the current user
 */
function getMyBoard(projectId) {
  const userEmail = getCurrentUserEmail();
  const tasks = getTasksForUser(userEmail);
  
  return buildBoardData(tasks, projectId, {
    view: 'my',
    userEmail: userEmail
  });
}

/**
 * Get board data for "Master Board" view
 * Shows all tasks
 */
function getMasterBoard(projectId) {
  const tasks = getAllTasks();
  
  return buildBoardData(tasks, projectId, {
    view: 'master'
  });
}

/**
 * Build board data structure from tasks
 * @param {Array} allTasks - All tasks to include
 * @param {string} projectId - Optional project filter
 * @param {Object} options - Additional options
 * @returns {Object} Board data with columns, stats, etc.
 */
function buildBoardData(allTasks, projectId, options = {}) {
  // Filter by project if specified
  let tasks = allTasks;
  if (projectId) {
    tasks = tasks.filter(t => t.projectId === projectId);
  }
  
  // Build columns with tasks
  const columns = CONFIG.STATUSES.map((status, index) => {
    const columnTasks = tasks
      .filter(t => t.status === status)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    return {
      id: normalizeStatusId(status),
      name: status,
      color: CONFIG.COLORS[status] || '#6B7280',
      order: index,
      tasks: columnTasks,
      count: columnTasks.length
    };
  });
  
  // Calculate statistics
  const stats = calculateBoardStats(tasks);
  
  // Get projects and users for dropdowns
  const projects = getAllProjects();
  const users = getActiveUsers();
  
  return {
    columns: columns,
    stats: stats,
    projects: projects,
    users: users,
    taskCount: tasks.length,
    view: options.view || 'board',
    userEmail: options.userEmail || null,
    projectFilter: projectId || null,
    config: {
      statuses: CONFIG.STATUSES,
      priorities: CONFIG.PRIORITIES,
      types: CONFIG.TYPES,
      colors: CONFIG.COLORS
    }
  };
}

/**
 * Convert status name to column ID (e.g., "To Do" -> "to_do")
 */
function normalizeStatusId(status) {
  if (!status) return 'backlog';
  return String(status).toLowerCase().replace(/\s+/g, '_');
}

/**
 * Convert column ID back to status name (e.g., "to_do" -> "To Do")
 */
function denormalizeStatusId(columnId) {
  const statusMap = {};
  CONFIG.STATUSES.forEach(s => {
    statusMap[normalizeStatusId(s)] = s;
  });
  return statusMap[columnId] || columnId;
}

/**
 * Calculate board statistics
 */
function calculateBoardStats(tasks) {
  const total = tasks.length;
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Count by status
  const byStatus = {};
  CONFIG.STATUSES.forEach(s => byStatus[s] = 0);
  
  // Count by priority
  const byPriority = {};
  CONFIG.PRIORITIES.forEach(p => byPriority[p] = 0);
  
  // Count by assignee
  const byAssignee = {};
  
  // Count by type
  const byType = {};
  CONFIG.TYPES.forEach(t => byType[t] = 0);
  
  let completed = 0;
  let dueSoon = 0;
  let overdue = 0;
  let totalPoints = 0;
  let completedPoints = 0;
  let totalEstimatedHrs = 0;
  let totalActualHrs = 0;
  
  tasks.forEach(task => {
    // Status
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    
    if (task.status === 'Done') {
      completed++;
      completedPoints += task.storyPoints || 0;
    }
    
    // Priority
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    
    // Assignee
    const assignee = task.assignee || 'Unassigned';
    byAssignee[assignee] = (byAssignee[assignee] || 0) + 1;
    
    // Type
    byType[task.type] = (byType[task.type] || 0) + 1;
    
    // Story points
    totalPoints += task.storyPoints || 0;
    
    // Hours
    totalEstimatedHrs += task.estimatedHrs || 0;
    totalActualHrs += task.actualHrs || 0;
    
    // Due dates
    if (task.dueDate && task.status !== 'Done') {
      const dueDate = new Date(task.dueDate);
      if (dueDate < now) {
        overdue++;
      } else if (dueDate <= weekFromNow) {
        dueSoon++;
      }
    }
  });
  
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    progress,
    dueSoon,
    overdue,
    totalPoints,
    completedPoints,
    totalEstimatedHrs,
    totalActualHrs,
    byStatus,
    byPriority,
    byAssignee,
    byType
  };
}

// =============================================================================
// SEARCH AND FILTER
// =============================================================================

/**
 * Search tasks across all fields
 */
function searchTasks(query, projectId) {
  const allTasks = getAllTasks();
  const q = query.toLowerCase();
  
  let results = allTasks.filter(task => {
    // Search across multiple fields
    return (
      task.id?.toLowerCase().includes(q) ||
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.assignee?.toLowerCase().includes(q) ||
      task.labels?.some(l => l.toLowerCase().includes(q)) ||
      task.status?.toLowerCase().includes(q) ||
      task.priority?.toLowerCase().includes(q)
    );
  });
  
  // Filter by project if specified
  if (projectId) {
    results = results.filter(t => t.projectId === projectId);
  }
  
  return results;
}

/**
 * Get tasks with advanced filters
 */
function getFilteredTasks(filters) {
  let tasks = getAllTasks();
  
  // Apply each filter
  if (filters.assignee) {
    tasks = tasks.filter(t => t.assignee === filters.assignee);
  }
  if (filters.reporter) {
    tasks = tasks.filter(t => t.reporter === filters.reporter);
  }
  if (filters.projectId) {
    tasks = tasks.filter(t => t.projectId === filters.projectId);
  }
  if (filters.status && filters.status.length > 0) {
    tasks = tasks.filter(t => filters.status.includes(t.status));
  }
  if (filters.priority && filters.priority.length > 0) {
    tasks = tasks.filter(t => filters.priority.includes(t.priority));
  }
  if (filters.type && filters.type.length > 0) {
    tasks = tasks.filter(t => filters.type.includes(t.type));
  }
  if (filters.sprint) {
    tasks = tasks.filter(t => t.sprint === filters.sprint);
  }
  if (filters.labels && filters.labels.length > 0) {
    tasks = tasks.filter(t => {
      const taskLabels = t.labels || [];
      return filters.labels.some(l => taskLabels.includes(l));
    });
  }
  if (filters.hasParent !== undefined) {
    if (filters.hasParent) {
      tasks = tasks.filter(t => t.parentId);
    } else {
      tasks = tasks.filter(t => !t.parentId);
    }
  }
  if (filters.overdue) {
    const now = new Date();
    tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done');
  }
  if (filters.dueSoon) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    tasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'Done') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= weekFromNow;
    });
  }
  
  return tasks;
}

// =============================================================================
// BOARD OPERATIONS
// =============================================================================

/**
 * Reorder tasks within a column
 */
function reorderTasksInColumn(taskId, newPosition, status) {
  const tasks = getAllTasks().filter(t => t.status === status);
  
  // Find and remove the task being moved
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return false;
  
  const [movedTask] = tasks.splice(taskIndex, 1);
  
  // Insert at new position
  tasks.splice(newPosition, 0, movedTask);
  
  // Update positions for all affected tasks
  tasks.forEach((task, index) => {
    if (task.position !== index) {
      updateTask(task.id, { position: index });
    }
  });
  
  return true;
}

/**
 * Get all unique labels used in tasks
 */
function getAllLabels() {
  const tasks = getAllTasks();
  const labelSet = new Set();
  
  tasks.forEach(task => {
    if (task.labels && Array.isArray(task.labels)) {
      task.labels.forEach(l => labelSet.add(l));
    }
  });
  
  return Array.from(labelSet).sort();
}

/**
 * Get all unique sprints
 */
function getAllSprints() {
  const tasks = getAllTasks();
  const sprintSet = new Set();
  
  tasks.forEach(task => {
    if (task.sprint) {
      sprintSet.add(task.sprint);
    }
  });
  
  return Array.from(sprintSet).sort((a, b) => {
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    return numA - numB;
  });
}

/**
 * Get subtasks for a parent task
 */
function getSubtasks(parentId) {
  return getAllTasks().filter(t => t.parentId === parentId);
}

/**
 * Get parent tasks (potential parents for subtasks)
 */
function getParentTasks() {
  return getAllTasks().filter(t => t.type === 'Epic' || t.type === 'Story');
}
