/**
 * Timeline Filtering and Search Engine
 * Server-side filtering and search functionality for timeline data
 * Supports project, assignee, date range, and search filters with overdue highlighting
 */

/**
 * Get filtered timeline data with search and filters
 * @param {string} projectId - Project ID filter (null for all projects)
 * @param {Object} filters - Filter criteria
 * @returns {Object} Filtered timeline data
 */
function getFilteredTimelineData(projectId = null, filters = {}) {
  try {
    // Generate base timeline data
    const timelineData = TimelineEngine.generateProjectTimeline(projectId, filters.dateRange);
    
    // Apply filters
    let filteredTasks = timelineData.tasks;
    
    // Apply assignee filter
    if (filters.assignee) {
      filteredTasks = filteredTasks.filter(task => task.assignee === filters.assignee);
    }
    
    // Apply status filter
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    
    // Apply priority filter
    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    
    // Apply type filter
    if (filters.type) {
      filteredTasks = filteredTasks.filter(task => task.type === filters.type);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm) ||
        task.id.toLowerCase().includes(searchTerm) ||
        (task.assignee && task.assignee.toLowerCase().includes(searchTerm)) ||
        (task.labels && task.labels.some(label => label.toLowerCase().includes(searchTerm)))
      );
    }
    
    // Apply overdue filter
    if (filters.showOverdueOnly) {
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => 
        task.end < now && task.status !== 'Done'
      );
    }
    
    // Apply completion status filter
    if (filters.completionStatus) {
      if (filters.completionStatus === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.status === 'Done');
      } else if (filters.completionStatus === 'incomplete') {
        filteredTasks = filteredTasks.filter(task => task.status !== 'Done');
      }
    }
    
    // Apply date range filter (additional to timeline generation)
    if (filters.taskDateRange) {
      filteredTasks = filteredTasks.filter(task => {
        const taskStart = task.start;
        const taskEnd = task.end;
        
        return (taskStart >= filters.taskDateRange.start && taskStart <= filters.taskDateRange.end) ||
               (taskEnd >= filters.taskDateRange.start && taskEnd <= filters.taskDateRange.end) ||
               (taskStart <= filters.taskDateRange.start && taskEnd >= filters.taskDateRange.end);
      });
    }
    
    // Highlight overdue tasks
    const highlightedTasks = highlightOverdueTasks(filteredTasks);
    
    // Update dependencies to only include tasks in filtered set
    const filteredTaskIds = new Set(highlightedTasks.map(t => t.id));
    const filteredDependencies = timelineData.dependencies.filter(dep => 
      filteredTaskIds.has(dep.from) && filteredTaskIds.has(dep.to)
    );
    
    // Recalculate critical path for filtered tasks
    const filteredCriticalPath = TimelineEngine.calculateCriticalPath(
      highlightedTasks, 
      filteredDependencies
    );
    
    return {
      ...timelineData,
      tasks: highlightedTasks,
      dependencies: filteredDependencies,
      criticalPath: filteredCriticalPath,
      filterStats: {
        totalTasks: timelineData.tasks.length,
        filteredTasks: highlightedTasks.length,
        overdueTasks: countOverdueTasks(highlightedTasks),
        completedTasks: countCompletedTasks(highlightedTasks),
        criticalPathTasks: filteredCriticalPath.length
      }
    };
    
  } catch (error) {
    console.error('Error filtering timeline data:', error);
    throw new Error('Failed to filter timeline data: ' + error.message);
  }
}

/**
 * Highlight overdue tasks in timeline data
 * @param {Array} tasks - Array of timeline tasks
 * @returns {Array} Tasks with overdue highlighting
 */
function highlightOverdueTasks(tasks) {
  const now = new Date();
  
  return tasks.map(task => {
    const isOverdue = task.end < now && task.status !== 'Done';
    
    return {
      ...task,
      isOverdue: isOverdue,
      overdueBy: isOverdue ? Math.ceil((now - task.end) / (1000 * 60 * 60 * 24)) : 0,
      customClass: (task.customClass || '') + (isOverdue ? ' overdue' : '')
    };
  });
}

/**
 * Count overdue tasks
 * @param {Array} tasks - Array of timeline tasks
 * @returns {number} Number of overdue tasks
 */
function countOverdueTasks(tasks) {
  const now = new Date();
  return tasks.filter(task => task.end < now && task.status !== 'Done').length;
}

/**
 * Count completed tasks
 * @param {Array} tasks - Array of timeline tasks
 * @returns {number} Number of completed tasks
 */
function countCompletedTasks(tasks) {
  return tasks.filter(task => task.status === 'Done').length;
}

/**
 * Search timeline tasks with advanced search capabilities
 * @param {string} query - Search query
 * @param {string} projectId - Project ID filter
 * @param {Object} searchOptions - Search options
 * @returns {Object} Search results
 */
function searchTimelineTasks(query, projectId = null, searchOptions = {}) {
  try {
    // Get all timeline data
    const timelineData = TimelineEngine.generateProjectTimeline(projectId);
    
    if (!query || query.trim().length === 0) {
      return {
        tasks: timelineData.tasks,
        totalResults: timelineData.tasks.length,
        searchQuery: '',
        searchTime: 0
      };
    }
    
    const startTime = Date.now();
    const searchTerm = query.toLowerCase().trim();
    
    // Advanced search parsing
    const searchCriteria = parseSearchQuery(searchTerm);
    
    // Filter tasks based on search criteria
    let results = timelineData.tasks.filter(task => {
      // Basic text search
      if (searchCriteria.text) {
        const textMatch = 
          task.name.toLowerCase().includes(searchCriteria.text) ||
          task.id.toLowerCase().includes(searchCriteria.text) ||
          (task.assignee && task.assignee.toLowerCase().includes(searchCriteria.text));
        
        if (!textMatch) return false;
      }
      
      // Status filter
      if (searchCriteria.status && task.status.toLowerCase() !== searchCriteria.status) {
        return false;
      }
      
      // Priority filter
      if (searchCriteria.priority && task.priority.toLowerCase() !== searchCriteria.priority) {
        return false;
      }
      
      // Assignee filter
      if (searchCriteria.assignee && 
          (!task.assignee || !task.assignee.toLowerCase().includes(searchCriteria.assignee))) {
        return false;
      }
      
      // Label filter
      if (searchCriteria.label && 
          (!task.labels || !task.labels.some(label => 
            label.toLowerCase().includes(searchCriteria.label)))) {
        return false;
      }
      
      // Overdue filter
      if (searchCriteria.overdue) {
        const now = new Date();
        const isOverdue = task.end < now && task.status !== 'Done';
        if (!isOverdue) return false;
      }
      
      return true;
    });
    
    // Sort results by relevance
    if (searchCriteria.text) {
      results = sortSearchResults(results, searchCriteria.text);
    }
    
    const searchTime = Date.now() - startTime;
    
    return {
      tasks: results,
      totalResults: results.length,
      searchQuery: query,
      searchTime: searchTime,
      searchCriteria: searchCriteria
    };
    
  } catch (error) {
    console.error('Error searching timeline tasks:', error);
    throw new Error('Failed to search timeline tasks: ' + error.message);
  }
}

/**
 * Parse advanced search query
 * Supports syntax like: status:done priority:high assignee:john overdue:true "exact phrase"
 * @param {string} query - Search query
 * @returns {Object} Parsed search criteria
 */
function parseSearchQuery(query) {
  const criteria = {
    text: '',
    status: null,
    priority: null,
    assignee: null,
    label: null,
    overdue: false
  };
  
  // Extract quoted phrases
  const quotedPhrases = [];
  let quotedQuery = query.replace(/"([^"]+)"/g, (match, phrase) => {
    quotedPhrases.push(phrase);
    return '';
  });
  
  // Extract field filters
  const fieldFilters = [
    { pattern: /status:(\w+)/gi, field: 'status' },
    { pattern: /priority:(\w+)/gi, field: 'priority' },
    { pattern: /assignee:(\w+)/gi, field: 'assignee' },
    { pattern: /label:(\w+)/gi, field: 'label' },
    { pattern: /overdue:(true|false)/gi, field: 'overdue' }
  ];
  
  fieldFilters.forEach(filter => {
    let match;
    while ((match = filter.pattern.exec(quotedQuery)) !== null) {
      if (filter.field === 'overdue') {
        criteria[filter.field] = match[1].toLowerCase() === 'true';
      } else {
        criteria[filter.field] = match[1].toLowerCase();
      }
      quotedQuery = quotedQuery.replace(match[0], '');
    }
  });
  
  // Combine remaining text with quoted phrases
  const remainingText = quotedQuery.trim();
  const allText = [remainingText, ...quotedPhrases].filter(t => t).join(' ').trim();
  
  if (allText) {
    criteria.text = allText;
  }
  
  return criteria;
}

/**
 * Sort search results by relevance
 * @param {Array} tasks - Array of tasks
 * @param {string} searchTerm - Search term
 * @returns {Array} Sorted tasks
 */
function sortSearchResults(tasks, searchTerm) {
  return tasks.sort((a, b) => {
    const aScore = calculateRelevanceScore(a, searchTerm);
    const bScore = calculateRelevanceScore(b, searchTerm);
    return bScore - aScore; // Higher score first
  });
}

/**
 * Calculate relevance score for search result
 * @param {Object} task - Task object
 * @param {string} searchTerm - Search term
 * @returns {number} Relevance score
 */
function calculateRelevanceScore(task, searchTerm) {
  let score = 0;
  const term = searchTerm.toLowerCase();
  
  // Exact match in title gets highest score
  if (task.name.toLowerCase() === term) {
    score += 100;
  } else if (task.name.toLowerCase().includes(term)) {
    score += 50;
  }
  
  // Exact match in ID gets high score
  if (task.id.toLowerCase() === term) {
    score += 80;
  } else if (task.id.toLowerCase().includes(term)) {
    score += 30;
  }
  
  // Match in assignee
  if (task.assignee && task.assignee.toLowerCase().includes(term)) {
    score += 20;
  }
  
  // Match in labels
  if (task.labels && task.labels.some(label => label.toLowerCase().includes(term))) {
    score += 15;
  }
  
  // Boost score for high priority tasks
  if (task.priority === 'Critical' || task.priority === 'High') {
    score += 10;
  }
  
  // Boost score for overdue tasks
  const now = new Date();
  if (task.end < now && task.status !== 'Done') {
    score += 5;
  }
  
  return score;
}

/**
 * Get timeline filter suggestions based on current data
 * @param {string} projectId - Project ID filter
 * @returns {Object} Filter suggestions
 */
function getTimelineFilterSuggestions(projectId = null) {
  try {
    const timelineData = TimelineEngine.generateProjectTimeline(projectId);
    
    // Extract unique values for filter suggestions
    const assignees = [...new Set(timelineData.tasks.map(t => t.assignee).filter(a => a))];
    const statuses = [...new Set(timelineData.tasks.map(t => t.status))];
    const priorities = [...new Set(timelineData.tasks.map(t => t.priority))];
    const types = [...new Set(timelineData.tasks.map(t => t.type))];
    const labels = [...new Set(timelineData.tasks.flatMap(t => t.labels || []))];
    
    // Calculate statistics
    const now = new Date();
    const overdueTasks = timelineData.tasks.filter(t => t.end < now && t.status !== 'Done');
    const completedTasks = timelineData.tasks.filter(t => t.status === 'Done');
    
    return {
      assignees: assignees.sort(),
      statuses: statuses.sort(),
      priorities: priorities.sort(),
      types: types.sort(),
      labels: labels.sort(),
      statistics: {
        totalTasks: timelineData.tasks.length,
        overdueTasks: overdueTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: timelineData.tasks.filter(t => 
          t.status === 'In Progress' || t.status === 'Review' || t.status === 'Testing'
        ).length
      }
    };
    
  } catch (error) {
    console.error('Error getting filter suggestions:', error);
    return {
      assignees: [],
      statuses: [],
      priorities: [],
      types: [],
      labels: [],
      statistics: {
        totalTasks: 0,
        overdueTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0
      }
    };
  }
}