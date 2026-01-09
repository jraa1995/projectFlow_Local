// Updated switchView function to support timeline view
function switchView(view) {
  if (State.loading) return;
  
  State.view = view;
  
  // Update nav
  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    link.classList.toggle('active', link.dataset.view === view);
  });
  
  // Update title and show appropriate view
  if (view === 'timeline') {
    document.getElementById('viewTitle').textContent = 'Project Timeline';
    hideTimelineView(); // Hide first to reset state
    showTimelineView(); // Then show timeline view
  } else {
    document.getElementById('viewTitle').textContent = view === 'my' ? 'My Board' : 'Master Board';
    hideTimelineView(); // Hide timeline view
    // Load board data for kanban views
    loadBoard();
  }
}

// Updated loadBoard function to handle timeline view
function loadBoard() {
  if (State.view === 'timeline') {
    // Timeline view is handled by showTimelineView()
    return;
  }
  
  showLoading(true);
  
  const projectId = State.projectFilter || null;
  
  if (State.view === 'master') {
    google.script.run
      .withSuccessHandler(handleBoardData)
      .withFailureHandler(handleError)
      .loadMasterBoard(projectId);
  } else {
    google.script.run
      .withSuccessHandler(handleBoardData)
      .withFailureHandler(handleError)
      .loadMyBoard(projectId);
  }
}