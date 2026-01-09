/**
 * TimelineEngine - Timeline and Gantt Chart Data Generation
 * Handles timeline data generation, critical path calculation, and dependency processing
 */

class TimelineEngine {
  
  /**
   * Generate timeline data for projects
   * @param {string} projectId - Project ID to filter by (null for all projects)
   * @param {Object} dateRange - Optional date range filter {start: Date, end: Date}
   * @returns {Object} Timeline data with tasks, milestones, dependencies, and critical path
   */
  static generateProjectTimeline(projectId = null, dateRange = null) {
    try {
      // Get all tasks, optionally filtered by project
      const filters = projectId ? { projectId: projectId } : {};
      let tasks = getAllTasks(filters);
      
      // Filter by date range if provided
      if (dateRange) {
        tasks = tasks.filter(task => {
          const taskStart = task.startDate ? new Date(task.startDate) : null;
          const taskDue = task.dueDate ? new Date(task.dueDate) : null;
          
          // Include task if it overlaps with the date range
          if (taskStart && taskDue) {
            return (taskStart <= dateRange.end && taskDue >= dateRange.start);
          } else if (taskStart) {
            return taskStart >= dateRange.start && taskStart <= dateRange.end;
          } else if (taskDue) {
            return taskDue >= dateRange.start && taskDue <= dateRange.end;
          }
          return false;
        });
      }
      
      // Convert tasks to Gantt format
      const ganttTasks = this.convertTasksToGanttFormat(tasks);
      
      // Get task dependencies
      const dependencies = this.processDependencies(tasks);
      
      // Calculate critical path
      const criticalPath = this.calculateCriticalPath(ganttTasks, dependencies);
      
      // Generate milestones from completed tasks and project deadlines
      const milestones = this.generateMilestones(tasks, projectId);
      
      return {
        tasks: ganttTasks,
        milestones: milestones,
        dependencies: dependencies,
        criticalPath: criticalPath,
        dateRange: this.calculateTimelineRange(ganttTasks),
        projectId: projectId
      };
      
    } catch (error) {
      console.error('Error generating project timeline:', error);
      throw new Error('Failed to generate timeline data: ' + error.message);
    }
  }
  
  /**
   * Convert tasks to Gantt chart format
   * @param {Array} tasks - Array of task objects
   * @returns {Array} Array of Gantt-formatted tasks
   */
  static convertTasksToGanttFormat(tasks) {
    return tasks.map(task => {
      // Calculate dates - use start/due dates or estimate from creation
      let startDate = task.startDate ? new Date(task.startDate) : null;
      let endDate = task.dueDate ? new Date(task.dueDate) : null;
      
      // If no dates, estimate based on creation date and estimated hours
      if (!startDate && !endDate) {
        startDate = new Date(task.createdAt);
        const estimatedDays = Math.max(1, Math.ceil((task.estimatedHrs || 8) / 8));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + estimatedDays);
      } else if (!startDate && endDate) {
        // Work backwards from due date
        const estimatedDays = Math.max(1, Math.ceil((task.estimatedHrs || 8) / 8));
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - estimatedDays);
      } else if (startDate && !endDate) {
        // Work forwards from start date
        const estimatedDays = Math.max(1, Math.ceil((task.estimatedHrs || 8) / 8));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + estimatedDays);
      }
      
      // Calculate progress percentage
      let progress = 0;
      if (task.status === 'Done') {
        progress = 100;
      } else if (task.status === 'In Progress' || task.status === 'Review' || task.status === 'Testing') {
        // Estimate progress based on actual vs estimated hours
        if (task.estimatedHrs > 0) {
          progress = Math.min(90, (task.actualHrs / task.estimatedHrs) * 100);
        } else {
          progress = 50; // Default for in-progress tasks
        }
      } else if (task.status === 'To Do') {
        progress = 0;
      } else {
        progress = 0; // Backlog, etc.
      }
      
      return {
        id: task.id,
        name: task.title,
        start: startDate,
        end: endDate,
        progress: Math.round(progress),
        dependencies: this.parseTaskDependencies(task),
        assignee: task.assignee || '',
        priority: task.priority || 'Medium',
        type: task.type || 'Task',
        status: task.status || 'To Do',
        projectId: task.projectId || '',
        estimatedHrs: task.estimatedHrs || 0,
        actualHrs: task.actualHrs || 0,
        parentId: task.parentId || '',
        labels: task.labels || []
      };
    });
  }
  
  /**
   * Parse task dependencies from task data
   * @param {Object} task - Task object
   * @returns {Array} Array of dependency task IDs
   */
  static parseTaskDependencies(task) {
    if (!task.dependencies) return [];
    
    if (typeof task.dependencies === 'string') {
      return task.dependencies.split(',').map(dep => dep.trim()).filter(dep => dep);
    }
    
    if (Array.isArray(task.dependencies)) {
      return task.dependencies;
    }
    
    return [];
  }
  
  /**
   * Process task dependencies and validation
   * @param {Array} tasks - Array of task objects
   * @returns {Array} Array of dependency relationships
   */
  static processDependencies(tasks) {
    const dependencies = [];
    const taskIds = new Set(tasks.map(t => t.id));
    
    // Get dependencies from task dependency sheet
    const dependencySheet = getTaskDependenciesSheet();
    const dependencyData = dependencySheet.getDataRange().getValues();
    
    if (dependencyData.length > 1) {
      for (let i = 1; i < dependencyData.length; i++) {
        const row = dependencyData[i];
        const dependency = rowToObject(row, CONFIG.TASK_DEPENDENCY_COLUMNS);
        
        // Only include dependencies where both tasks exist in our task set
        if (taskIds.has(dependency.predecessorId) && taskIds.has(dependency.successorId)) {
          dependencies.push({
            id: dependency.id,
            from: dependency.predecessorId,
            to: dependency.successorId,
            type: dependency.dependencyType || 'finish_to_start',
            lag: parseFloat(dependency.lag) || 0
          });
        }
      }
    }
    
    // Also check task.dependencies field for backward compatibility
    tasks.forEach(task => {
      const taskDeps = this.parseTaskDependencies(task);
      taskDeps.forEach(depId => {
        if (taskIds.has(depId)) {
          // Avoid duplicates
          const exists = dependencies.some(d => d.from === depId && d.to === task.id);
          if (!exists) {
            dependencies.push({
              id: `dep_${depId}_${task.id}`,
              from: depId,
              to: task.id,
              type: 'finish_to_start',
              lag: 0
            });
          }
        }
      });
    });
    
    return dependencies;
  }
  
  /**
   * Calculate critical path using Critical Path Method (CPM)
   * @param {Array} tasks - Array of Gantt-formatted tasks
   * @param {Array} dependencies - Array of dependency relationships
   * @returns {Array} Array of task IDs on the critical path
   */
  static calculateCriticalPath(tasks, dependencies) {
    try {
      // Create task lookup map
      const taskMap = new Map();
      tasks.forEach(task => {
        taskMap.set(task.id, {
          ...task,
          duration: this.calculateTaskDuration(task),
          earliestStart: 0,
          earliestFinish: 0,
          latestStart: 0,
          latestFinish: 0,
          totalFloat: 0,
          predecessors: [],
          successors: []
        });
      });
      
      // Build dependency relationships
      dependencies.forEach(dep => {
        const predecessor = taskMap.get(dep.from);
        const successor = taskMap.get(dep.to);
        
        if (predecessor && successor) {
          predecessor.successors.push({
            taskId: dep.to,
            type: dep.type,
            lag: dep.lag
          });
          successor.predecessors.push({
            taskId: dep.from,
            type: dep.type,
            lag: dep.lag
          });
        }
      });
      
      // Forward pass - calculate earliest start and finish times
      this.forwardPass(taskMap);
      
      // Backward pass - calculate latest start and finish times
      this.backwardPass(taskMap);
      
      // Calculate total float for each task
      taskMap.forEach(task => {
        task.totalFloat = task.latestStart - task.earliestStart;
      });
      
      // Critical path consists of tasks with zero total float
      const criticalPath = [];
      taskMap.forEach(task => {
        if (Math.abs(task.totalFloat) < 0.01) { // Account for floating point precision
          criticalPath.push(task.id);
        }
      });
      
      return criticalPath;
      
    } catch (error) {
      console.error('Error calculating critical path:', error);
      return []; // Return empty array if calculation fails
    }
  }
  
  /**
   * Calculate task duration in days
   * @param {Object} task - Gantt-formatted task
   * @returns {number} Duration in days
   */
  static calculateTaskDuration(task) {
    if (task.start && task.end) {
      const diffTime = Math.abs(task.end - task.start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays); // Minimum 1 day
    }
    
    // Fallback to estimated hours
    if (task.estimatedHrs > 0) {
      return Math.max(1, Math.ceil(task.estimatedHrs / 8)); // 8 hours per day
    }
    
    return 1; // Default 1 day
  }
  
  /**
   * Forward pass for CPM calculation
   * @param {Map} taskMap - Map of tasks with CPM data
   */
  static forwardPass(taskMap) {
    const visited = new Set();
    const visiting = new Set();
    
    const visit = (taskId) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        // Circular dependency detected - skip this task
        console.warn('Circular dependency detected involving task:', taskId);
        return;
      }
      
      visiting.add(taskId);
      const task = taskMap.get(taskId);
      
      if (!task) return;
      
      // Process all predecessors first
      let maxEarliestFinish = 0;
      task.predecessors.forEach(pred => {
        visit(pred.taskId);
        const predTask = taskMap.get(pred.taskId);
        if (predTask) {
          const finishTime = predTask.earliestFinish + pred.lag;
          maxEarliestFinish = Math.max(maxEarliestFinish, finishTime);
        }
      });
      
      task.earliestStart = maxEarliestFinish;
      task.earliestFinish = task.earliestStart + task.duration;
      
      visiting.delete(taskId);
      visited.add(taskId);
    };
    
    // Visit all tasks
    taskMap.forEach((task, taskId) => {
      visit(taskId);
    });
  }
  
  /**
   * Backward pass for CPM calculation
   * @param {Map} taskMap - Map of tasks with CPM data
   */
  static backwardPass(taskMap) {
    // Find project end time (maximum earliest finish)
    let projectEndTime = 0;
    taskMap.forEach(task => {
      projectEndTime = Math.max(projectEndTime, task.earliestFinish);
    });
    
    const visited = new Set();
    const visiting = new Set();
    
    const visit = (taskId) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        // Circular dependency detected - skip this task
        return;
      }
      
      visiting.add(taskId);
      const task = taskMap.get(taskId);
      
      if (!task) return;
      
      // If no successors, this is an end task
      if (task.successors.length === 0) {
        task.latestFinish = projectEndTime;
      } else {
        // Process all successors first
        let minLatestStart = Infinity;
        task.successors.forEach(succ => {
          visit(succ.taskId);
          const succTask = taskMap.get(succ.taskId);
          if (succTask) {
            const startTime = succTask.latestStart - succ.lag;
            minLatestStart = Math.min(minLatestStart, startTime);
          }
        });
        
        task.latestFinish = minLatestStart === Infinity ? projectEndTime : minLatestStart;
      }
      
      task.latestStart = task.latestFinish - task.duration;
      
      visiting.delete(taskId);
      visited.add(taskId);
    };
    
    // Visit all tasks
    taskMap.forEach((task, taskId) => {
      visit(taskId);
    });
  }
  
  /**
   * Generate milestones from tasks and project data
   * @param {Array} tasks - Array of task objects
   * @param {string} projectId - Project ID
   * @returns {Array} Array of milestone objects
   */
  static generateMilestones(tasks, projectId) {
    const milestones = [];
    
    // Add completed tasks as milestones
    tasks.forEach(task => {
      if (task.status === 'Done' && task.completedAt) {
        milestones.push({
          id: `milestone_${task.id}`,
          name: `Completed: ${task.title}`,
          date: new Date(task.completedAt),
          type: 'task_completion',
          taskId: task.id,
          projectId: task.projectId
        });
      }
    });
    
    // Add project deadlines as milestones
    if (projectId) {
      const project = getProjectById(projectId);
      if (project && project.endDate) {
        milestones.push({
          id: `milestone_project_${projectId}`,
          name: `Project Deadline: ${project.name}`,
          date: new Date(project.endDate),
          type: 'project_deadline',
          projectId: projectId
        });
      }
    }
    
    // Sort milestones by date
    milestones.sort((a, b) => a.date - b.date);
    
    return milestones;
  }
  
  /**
   * Calculate the overall timeline date range
   * @param {Array} tasks - Array of Gantt-formatted tasks
   * @returns {Object} Date range {start: Date, end: Date}
   */
  static calculateTimelineRange(tasks) {
    if (tasks.length === 0) {
      const now = new Date();
      return {
        start: now,
        end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };
    }
    
    let minDate = null;
    let maxDate = null;
    
    tasks.forEach(task => {
      if (task.start) {
        if (!minDate || task.start < minDate) {
          minDate = task.start;
        }
      }
      if (task.end) {
        if (!maxDate || task.end > maxDate) {
          maxDate = task.end;
        }
      }
    });
    
    // Add some padding
    if (minDate) {
      minDate = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week before
    }
    if (maxDate) {
      maxDate = new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week after
    }
    
    return {
      start: minDate || new Date(),
      end: maxDate || new Date()
    };
  }
  
  /**
   * Validate dependency relationships for circular dependencies
   * @param {Array} dependencies - Array of dependency relationships
   * @returns {Object} Validation result {isValid: boolean, circularDependencies: Array}
   */
  static validateDependencies(dependencies) {
    const graph = new Map();
    const taskIds = new Set();
    
    // Build adjacency list
    dependencies.forEach(dep => {
      taskIds.add(dep.from);
      taskIds.add(dep.to);
      
      if (!graph.has(dep.from)) {
        graph.set(dep.from, []);
      }
      graph.get(dep.from).push(dep.to);
    });
    
    // Detect cycles using DFS
    const visited = new Set();
    const recursionStack = new Set();
    const circularDependencies = [];
    
    const hasCycle = (node, path = []) => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        circularDependencies.push(path.slice(cycleStart).concat([node]));
        return true;
      }
      
      if (visited.has(node)) {
        return false;
      }
      
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor, [...path])) {
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    // Check all nodes
    let hasCircularDependency = false;
    taskIds.forEach(taskId => {
      if (!visited.has(taskId)) {
        if (hasCycle(taskId)) {
          hasCircularDependency = true;
        }
      }
    });
    
    return {
      isValid: !hasCircularDependency,
      circularDependencies: circularDependencies
    };
  }
}