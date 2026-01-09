/**
 * ProjectFlow Setup & Admin Utilities
 * Initialization, testing, diagnostics, and admin functions
 */

// =============================================================================
// SETUP & INITIALIZATION
// =============================================================================

/**
 * Quick setup - run this first to initialize everything
 */
function quickSetup() {
  console.log('🚀 ProjectFlow Quick Setup');
  console.log('==========================');
  
  try {
    // Step 0: Verify CONFIG is loaded
    console.log('\n0️⃣ Verifying configuration...');
    if (typeof CONFIG === 'undefined') {
      throw new Error('CONFIG object is undefined. Check Config.gs for syntax errors.');
    }
    console.log('✅ CONFIG loaded successfully');
    console.log('Available CONFIG keys:', Object.keys(CONFIG));
    
    // Step 1: Create all sheets
    console.log('\n1️⃣ Creating sheets...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const existingSheets = ss.getSheets().map(s => s.getName());
    console.log('Existing sheets:', existingSheets.join(', '));
    
    // Initialize system with detailed error handling
    initializeSystem();
    
    const newSheets = ss.getSheets().map(s => s.getName());
    console.log('Final sheets:', newSheets.join(', '));
    console.log('✅ All sheets verified/created');
    
    // Step 2: Setup current user
    console.log('\n2️⃣ Setting up user...');
    const user = getCurrentUser();
    console.log(`✅ User ready: ${user.email} (${user.role})`);
    
    // Step 3: Create default project if none exist
    console.log('\n3️⃣ Checking projects...');
    const projects = getAllProjects();
    if (projects.length === 0) {
      const project = createProject({
        name: 'Default Project',
        description: 'Your first project - rename or delete as needed'
      });
      console.log(`✅ Created default project: ${project.id}`);
    } else {
      console.log(`✅ Found ${projects.length} existing project(s)`);
    }
    
    // Step 4: Create sample tasks if none exist
    console.log('\n4️⃣ Checking tasks...');
    const tasks = getAllTasks();
    if (tasks.length === 0) {
      createSampleTasks();
      console.log('✅ Created sample tasks');
    } else {
      console.log(`✅ Found ${tasks.length} existing task(s)`);
    }
    
    // Step 5: Test the system
    console.log('\n5️⃣ Running tests...');
    const testResults = runQuickTests();
    
    console.log('\n========================================');
    console.log('🎉 SETUP COMPLETE!');
    console.log('========================================');
    console.log('\n📋 Next Steps:');
    console.log('   1. Click Deploy → New deployment');
    console.log('   2. Select "Web app"');
    console.log('   3. Execute as: Me');
    console.log('   4. Who has access: Anyone (or your domain)');
    console.log('   5. Click Deploy and copy the URL');
    console.log('\n🔗 Run openWebApp() to open after deploying');
    
    return {
      success: true,
      user: user.email,
      projects: getAllProjects().length,
      tasks: getAllTasks().length,
      tests: testResults
    };
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.error('Stack:', error.stack);
    
    // Provide specific guidance based on error type
    if (error.message.includes('CONFIG')) {
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('   The CONFIG object is not loading properly.');
      console.error('   This usually means there is a syntax error in Config.gs');
      console.error('   Check the Config.gs file for any malformed code.');
    }
    
    return {
      success: false,
      error: error.message,
      troubleshooting: error.message.includes('CONFIG') ? 
        'Check Config.gs for syntax errors' : 
        'Check console logs for detailed error information'
    };
  }
}

/**
 * Create sample tasks for demonstration
 */
function createSampleTasks() {
  const projects = getAllProjects();
  const projectId = projects[0]?.id || '';
  const userEmail = getCurrentUserEmail();
  
  const sampleTasks = [
    { 
      title: 'Set up project repository', 
      description: 'Initialize Git repository and configure CI/CD pipeline',
      status: 'Done', 
      priority: 'High', 
      type: 'Task',
      labels: ['setup', 'infrastructure']
    },
    { 
      title: 'Design database schema', 
      description: 'Create ERD and define all tables, relationships, and indexes',
      status: 'Done', 
      priority: 'High', 
      type: 'Task',
      labels: ['database', 'design']
    },
    { 
      title: 'Implement user authentication', 
      description: 'Build secure login system with OAuth integration',
      status: 'In Progress', 
      priority: 'Critical', 
      type: 'Feature',
      labels: ['security', 'backend'],
      storyPoints: 8
    },
    { 
      title: 'Create dashboard UI', 
      description: 'Design and implement the main dashboard with charts and metrics',
      status: 'In Progress', 
      priority: 'High', 
      type: 'Feature',
      labels: ['frontend', 'ui'],
      storyPoints: 13
    },
    { 
      title: 'Fix login redirect bug', 
      description: 'Users not being redirected properly after successful login',
      status: 'To Do', 
      priority: 'Medium', 
      type: 'Bug',
      labels: ['bug', 'frontend']
    },
    { 
      title: 'Write API documentation', 
      description: 'Document all API endpoints with examples and schemas',
      status: 'To Do', 
      priority: 'Low', 
      type: 'Task',
      labels: ['documentation']
    },
    { 
      title: 'Set up monitoring', 
      description: 'Configure alerts and dashboards for system health',
      status: 'Backlog', 
      priority: 'Medium', 
      type: 'Task',
      labels: ['devops', 'monitoring']
    },
    { 
      title: 'Performance optimization sprint', 
      description: 'Identify and fix performance bottlenecks',
      status: 'Backlog', 
      priority: 'Low', 
      type: 'Story',
      labels: ['performance'],
      storyPoints: 21
    },
    { 
      title: 'Mobile responsive design', 
      description: 'Ensure application works on all device sizes',
      status: 'Review', 
      priority: 'High', 
      type: 'Feature',
      labels: ['mobile', 'responsive'],
      storyPoints: 8
    },
    { 
      title: 'Security audit', 
      description: 'Review code for security vulnerabilities',
      status: 'Testing', 
      priority: 'Critical', 
      type: 'Task',
      labels: ['security', 'audit']
    }
  ];
  
  sampleTasks.forEach((taskData, index) => {
    // Set assignee, project, and due dates
    taskData.projectId = projectId;
    taskData.assignee = userEmail;
    
    // Stagger due dates
    if (index % 2 === 0) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (index * 2) + 3);
      taskData.dueDate = dueDate.toISOString().split('T')[0];
    }
    
    createTask(taskData);
  });
  
  return sampleTasks.length;
}

/**
 * Clean up duplicate sheets (run if you have duplicate sheets)
 */
function cleanupDuplicateSheets() {
  console.log('🧹 Cleaning up duplicate sheets...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const requiredSheets = ['Tasks', 'Users', 'Projects', 'Comments', 'Activity', 'Mentions', 'Notifications', 'Analytics_Cache', 'Task_Dependencies'];
  
  const sheetCounts = {};
  const duplicates = [];
  
  // Count occurrences of each sheet name
  sheets.forEach(sheet => {
    const name = sheet.getName();
    sheetCounts[name] = (sheetCounts[name] || 0) + 1;
    
    if (sheetCounts[name] > 1) {
      duplicates.push(sheet);
    }
  });
  
  // Delete duplicates (keep the first one)
  let deletedCount = 0;
  duplicates.forEach(sheet => {
    try {
      if (ss.getSheets().length > 1) { // Don't delete if it's the only sheet
        ss.deleteSheet(sheet);
        deletedCount++;
        console.log(`🗑️ Deleted duplicate: ${sheet.getName()}`);
      }
    } catch (e) {
      console.error(`Failed to delete ${sheet.getName()}:`, e.message);
    }
  });
  
  console.log(`✅ Cleaned up ${deletedCount} duplicate sheets`);
  
  // Show final sheet list
  const finalSheets = ss.getSheets().map(s => s.getName());
  console.log('Final sheets:', finalSheets.join(', '));
  
  return { deleted: deletedCount, remaining: finalSheets };
}

/**
 * Clear all sample data
 */
function clearSampleData() {
  console.log('🧹 Clearing sample data...');
  
  const tasks = getAllTasks();
  let cleared = 0;
  
  tasks.forEach(task => {
    const labels = task.labels || [];
    if (labels.includes('setup') || labels.includes('infrastructure') || 
        task.description?.includes('sample') || task.description?.includes('Sample')) {
      deleteTask(task.id);
      cleared++;
    }
  });
  
  console.log(`✅ Cleared ${cleared} sample tasks`);
  return cleared;
}

/**
 * Reset entire system (use with caution!)
 */
function resetSystem() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ Reset System',
    'This will DELETE ALL DATA. Are you sure?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    console.log('Reset cancelled');
    return false;
  }
  
  console.log('🔄 Resetting system...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToDelete = ['Tasks', 'Users', 'Projects', 'Comments', 'Activity', 'Mentions', 'Notifications', 'Analytics_Cache', 'Task_Dependencies'];
  
  sheetsToDelete.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      // Can't delete if it's the only sheet
      if (ss.getSheets().length > 1) {
        ss.deleteSheet(sheet);
        console.log(`🗑️ Deleted ${name}`);
      } else {
        sheet.clear();
        console.log(`🧹 Cleared ${name}`);
      }
    }
  });
  
  console.log('✅ System reset. Run quickSetup() to reinitialize.');
  return true;
}

// =============================================================================
// TESTING
// =============================================================================

/**
 * Run all system tests
 */
function testSystem() {
  console.log('🧪 ProjectFlow System Tests');
  console.log('===========================');
  
  const tests = [
    { name: 'Get Current User', fn: () => {
      const user = getCurrentUser();
      return user && user.email;
    }},
    { name: 'Get All Tasks', fn: () => {
      const tasks = getAllTasks();
      return Array.isArray(tasks);
    }},
    { name: 'Get All Users', fn: () => {
      const users = getAllUsers();
      return Array.isArray(users);
    }},
    { name: 'Get All Projects', fn: () => {
      const projects = getAllProjects();
      return Array.isArray(projects);
    }},
    { name: 'Build My Board', fn: () => {
      const board = getMyBoard(null);
      return board && board.columns && board.columns.length > 0;
    }},
    { name: 'Build Master Board', fn: () => {
      const board = getMasterBoard(null);
      return board && board.columns && board.columns.length > 0;
    }},
    { name: 'Create Task', fn: () => {
      const task = createTask({ title: 'Test Task ' + Date.now(), status: 'To Do' });
      const success = task && task.id;
      if (success) deleteTask(task.id); // Cleanup
      return success;
    }},
    { name: 'Search Tasks', fn: () => {
      const results = searchTasks('test');
      return Array.isArray(results);
    }},
    { name: 'Get Initial Data', fn: () => {
      const data = getInitialData();
      return data && data.user && data.board && data.config;
    }},
    { name: 'Calculate Stats', fn: () => {
      const tasks = getAllTasks();
      const stats = calculateBoardStats(tasks);
      return stats && typeof stats.total === 'number';
    }}
  ];
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  tests.forEach(test => {
    try {
      const startTime = Date.now();
      const result = test.fn();
      const duration = Date.now() - startTime;
      
      if (result) {
        console.log(`✅ ${test.name} (${duration}ms)`);
        passed++;
        results.push({ name: test.name, passed: true, duration });
      } else {
        console.log(`❌ ${test.name} - returned false`);
        failed++;
        results.push({ name: test.name, passed: false, error: 'Returned false' });
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ${error.message}`);
      failed++;
      results.push({ name: test.name, passed: false, error: error.message });
    }
  });
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  }
  
  return { passed, failed, total: tests.length, results };
}

/**
 * Quick tests for setup verification
 */
function runQuickTests() {
  const tests = [
    { name: 'User', fn: () => getCurrentUser()?.email },
    { name: 'Tasks Sheet', fn: () => getTasksSheet()?.getName() },
    { name: 'My Board', fn: () => getMyBoard(null)?.columns?.length > 0 }
  ];
  
  let passed = 0;
  tests.forEach(t => {
    try {
      if (t.fn()) {
        console.log(`   ✅ ${t.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${t.name}`);
      }
    } catch (e) {
      console.log(`   ❌ ${t.name}: ${e.message}`);
    }
  });
  
  return { passed, total: tests.length };
}

/**
 * Run diagnostic check
 */
function diagnose() {
  console.log('🔍 ProjectFlow Diagnostics');
  console.log('==========================');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const issues = [];
  
  // Check spreadsheet
  console.log(`\n📊 Spreadsheet: ${ss.getName()}`);
  console.log(`   URL: ${ss.getUrl()}`);
  
  // Check sheets
  console.log('\n📋 Sheets:');
  const requiredSheets = ['Tasks', 'Users', 'Projects', 'Comments', 'Activity', 'Mentions', 'Notifications', 'Analytics_Cache', 'Task_Dependencies'];
  requiredSheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const rows = sheet.getLastRow();
      console.log(`   ✅ ${name}: ${rows - 1} records`);
    } else {
      console.log(`   ❌ ${name}: MISSING`);
      issues.push(`Missing sheet: ${name}`);
    }
  });
  
  // Check user
  console.log('\n👤 Current User:');
  try {
    const email = Session.getActiveUser().getEmail();
    console.log(`   Email: ${email || 'Not available'}`);
    
    const user = getUserByEmail(email);
    if (user) {
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log(`   ⚠️ User not in Users sheet`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
    issues.push(`User error: ${e.message}`);
  }
  
  // Check data
  console.log('\n📈 Data Summary:');
  try {
    const tasks = getAllTasks();
    const users = getAllUsers();
    const projects = getAllProjects();
    
    console.log(`   Tasks: ${tasks.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Projects: ${projects.length}`);
    
    // Task distribution by status
    const byStatus = {};
    tasks.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });
    console.log('   Tasks by status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });
    
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
    issues.push(`Data error: ${e.message}`);
  }
  
  // Check web app
  console.log('\n🌐 Web App:');
  try {
    const url = ScriptApp.getService().getUrl();
    if (url) {
      console.log(`   URL: ${url}`);
    } else {
      console.log(`   ⚠️ Not deployed yet`);
    }
  } catch (e) {
    console.log(`   Not deployed`);
  }
  
  // Summary
  console.log('\n📋 Summary:');
  if (issues.length === 0) {
    console.log('   ✅ No issues found');
  } else {
    console.log(`   ⚠️ Found ${issues.length} issue(s):`);
    issues.forEach(i => console.log(`      • ${i}`));
  }
  
  return { issues, issueCount: issues.length };
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * Add a team member
 */
function addTeamMember(email, name, role) {
  if (!email || !email.includes('@')) {
    throw new Error('Valid email required');
  }
  
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    console.log(`User already exists: ${email}`);
    return existingUser;
  }
  
  const user = createUser({
    email: email.toLowerCase().trim(),
    name: name || email.split('@')[0],
    role: role || 'member'
  });
  
  console.log(`✅ Added team member: ${user.name} (${user.email})`);
  return user;
}

/**
 * List all team members
 */
function listTeamMembers() {
  const users = getAllUsers();
  
  console.log('👥 Team Members');
  console.log('===============');
  
  users.forEach(user => {
    const status = user.active ? '✅' : '❌';
    console.log(`${status} ${user.name} (${user.email}) - ${user.role}`);
  });
  
  console.log(`\nTotal: ${users.length} members`);
  return users;
}

/**
 * Deactivate a user
 */
function deactivateUser(email) {
  return updateUser(email, { active: false });
}

/**
 * Activate a user
 */
function activateUser(email) {
  return updateUser(email, { active: true });
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Bulk update tasks by status
 */
function bulkMoveTasksToStatus(fromStatus, toStatus) {
  const tasks = getAllTasks({ status: fromStatus });
  let moved = 0;
  
  tasks.forEach(task => {
    try {
      updateTask(task.id, { status: toStatus });
      moved++;
    } catch (e) {
      console.error(`Failed to move ${task.id}: ${e.message}`);
    }
  });
  
  console.log(`Moved ${moved} tasks from "${fromStatus}" to "${toStatus}"`);
  return moved;
}

/**
 * Bulk assign tasks to user
 */
function bulkAssignTasks(taskIds, assigneeEmail) {
  let assigned = 0;
  
  taskIds.forEach(taskId => {
    try {
      updateTask(taskId, { assignee: assigneeEmail });
      assigned++;
    } catch (e) {
      console.error(`Failed to assign ${taskId}: ${e.message}`);
    }
  });
  
  console.log(`Assigned ${assigned} tasks to ${assigneeEmail}`);
  return assigned;
}

/**
 * Archive completed tasks older than X days
 */
function archiveOldCompletedTasks(daysOld) {
  daysOld = daysOld || 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  
  const tasks = getAllTasks({ status: 'Done' });
  let archived = 0;
  
  tasks.forEach(task => {
    if (task.completedAt && new Date(task.completedAt) < cutoff) {
      deleteTask(task.id);
      archived++;
    }
  });
  
  console.log(`Archived ${archived} tasks completed more than ${daysOld} days ago`);
  return archived;
}

// =============================================================================
// REPORTING
// =============================================================================

/**
 * Generate summary report
 */
function generateReport() {
  console.log('📊 ProjectFlow Report');
  console.log('=====================');
  console.log(`Generated: ${new Date().toLocaleString()}`);
  
  const tasks = getAllTasks();
  const stats = calculateBoardStats(tasks);
  const users = getAllUsers();
  const projects = getAllProjects();
  
  console.log('\n📈 Overview:');
  console.log(`   Total Tasks: ${stats.total}`);
  console.log(`   Completed: ${stats.completed} (${stats.progress}%)`);
  console.log(`   Due Soon: ${stats.dueSoon}`);
  console.log(`   Overdue: ${stats.overdue}`);
  
  console.log('\n📊 By Status:');
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    if (count > 0) {
      console.log(`   ${status}: ${count}`);
    }
  });
  
  console.log('\n🎯 By Priority:');
  Object.entries(stats.byPriority).forEach(([priority, count]) => {
    if (count > 0) {
      console.log(`   ${priority}: ${count}`);
    }
  });
  
  console.log('\n👥 By Assignee:');
  Object.entries(stats.byAssignee)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([assignee, count]) => {
      const name = assignee === 'Unassigned' ? assignee : 
                   users.find(u => u.email === assignee)?.name || assignee;
      console.log(`   ${name}: ${count}`);
    });
  
  console.log('\n📁 Projects:');
  projects.forEach(project => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const completed = projectTasks.filter(t => t.status === 'Done').length;
    console.log(`   ${project.name} (${project.id}): ${projectTasks.length} tasks, ${completed} done`);
  });
  
  console.log('\n⏱️ Time Tracking:');
  console.log(`   Estimated: ${stats.totalEstimatedHrs} hours`);
  console.log(`   Actual: ${stats.totalActualHrs} hours`);
  console.log(`   Story Points: ${stats.completedPoints}/${stats.totalPoints}`);
  
  return stats;
}

/**
 * Export tasks to CSV format
 */
function exportTasksToCSV() {
  const tasks = getAllTasks();
  const headers = CONFIG.TASK_COLUMNS.join(',');
  
  const rows = tasks.map(task => {
    return CONFIG.TASK_COLUMNS.map(col => {
      let value = task[col];
      if (Array.isArray(value)) value = value.join(';');
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  const csv = [headers, ...rows].join('\n');
  console.log('CSV Export:');
  console.log(csv);
  return csv;
}

console.log('✅ Setup.gs loaded');
