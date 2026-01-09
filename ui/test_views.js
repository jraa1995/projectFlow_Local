/**
 * Test script for view switching functionality
 * This script can be run in the browser console to test view switching
 */

console.log('🧪 Starting ProjectFlow View Switching Tests...');

// Test 1: Check if all view elements exist
function testViewElements() {
  console.log('\n1️⃣ Testing view elements...');
  
  const boardView = document.getElementById('boardView');
  const timelineView = document.getElementById('timelineView');
  const analyticsView = document.getElementById('analyticsView');
  
  const results = {
    boardView: !!boardView,
    timelineView: !!timelineView,
    analyticsView: !!analyticsView
  };
  
  console.log('View elements:', results);
  
  if (results.boardView && results.timelineView && results.analyticsView) {
    console.log('✅ All view elements found');
    return true;
  } else {
    console.log('❌ Missing view elements');
    return false;
  }
}

// Test 2: Check if navigation links exist
function testNavigationLinks() {
  console.log('\n2️⃣ Testing navigation links...');
  
  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const views = ['my', 'master', 'timeline', 'analytics'];
  
  console.log(`Found ${navLinks.length} navigation links`);
  
  const foundViews = Array.from(navLinks).map(link => link.dataset.view);
  console.log('Available views:', foundViews);
  
  const allViewsPresent = views.every(view => foundViews.includes(view));
  
  if (allViewsPresent) {
    console.log('✅ All navigation links found');
    return true;
  } else {
    console.log('❌ Missing navigation links');
    return false;
  }
}

// Test 3: Test switchView function
function testSwitchViewFunction() {
  console.log('\n3️⃣ Testing switchView function...');
  
  if (typeof switchView !== 'function') {
    console.log('❌ switchView function not found');
    return false;
  }
  
  console.log('✅ switchView function exists');
  return true;
}

// Test 4: Test view switching functionality
function testViewSwitching() {
  console.log('\n4️⃣ Testing view switching...');
  
  const views = ['my', 'master', 'timeline', 'analytics'];
  let allTestsPassed = true;
  
  views.forEach(view => {
    console.log(`Testing switch to ${view}...`);
    
    try {
      // Switch to the view
      switchView(view);
      
      // Check if the correct view is visible
      const boardView = document.getElementById('boardView');
      const timelineView = document.getElementById('timelineView');
      const analyticsView = document.getElementById('analyticsView');
      
      let expectedVisible;
      if (view === 'timeline') {
        expectedVisible = timelineView;
      } else if (view === 'analytics') {
        expectedVisible = analyticsView;
      } else {
        expectedVisible = boardView;
      }
      
      const isVisible = expectedVisible && !expectedVisible.classList.contains('hidden');
      
      if (isVisible) {
        console.log(`✅ ${view} view is visible`);
      } else {
        console.log(`❌ ${view} view is not visible`);
        allTestsPassed = false;
      }
      
      // Check if navigation is updated
      const activeNavLink = document.querySelector(`.nav-link[data-view="${view}"].active`);
      if (activeNavLink) {
        console.log(`✅ ${view} navigation is active`);
      } else {
        console.log(`❌ ${view} navigation is not active`);
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.log(`❌ Error switching to ${view}:`, error);
      allTestsPassed = false;
    }
  });
  
  return allTestsPassed;
}

// Test 5: Test required functions exist
function testRequiredFunctions() {
  console.log('\n5️⃣ Testing required functions...');
  
  const requiredFunctions = [
    'switchView',
    'loadBoard',
    'loadTimelineData',
    'loadAnalyticsData',
    'initializeTimelineFilters'
  ];
  
  let allFunctionsExist = true;
  
  requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
      console.log(`✅ ${funcName} exists`);
    } else {
      console.log(`❌ ${funcName} missing`);
      allFunctionsExist = false;
    }
  });
  
  return allFunctionsExist;
}

// Test 6: Test MentionAutocomplete class
function testMentionAutocomplete() {
  console.log('\n6️⃣ Testing MentionAutocomplete class...');
  
  if (typeof MentionAutocomplete === 'function') {
    console.log('✅ MentionAutocomplete class exists');
    return true;
  } else {
    console.log('❌ MentionAutocomplete class missing');
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running ProjectFlow View Tests...\n');
  
  const tests = [
    { name: 'View Elements', test: testViewElements },
    { name: 'Navigation Links', test: testNavigationLinks },
    { name: 'SwitchView Function', test: testSwitchViewFunction },
    { name: 'View Switching', test: testViewSwitching },
    { name: 'Required Functions', test: testRequiredFunctions },
    { name: 'MentionAutocomplete', test: testMentionAutocomplete }
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  tests.forEach(({ name, test }) => {
    const result = test();
    if (result) {
      passedTests++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! View switching should work correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the issues above.');
  }
  
  return passedTests === totalTests;
}

// Auto-run tests when script is loaded
if (typeof document !== 'undefined' && document.readyState === 'complete') {
  setTimeout(runAllTests, 1000);
} else if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(runAllTests, 1000);
  });
}

// Export for manual testing
window.testProjectFlowViews = runAllTests;
window.testViewSwitching = testViewSwitching;

console.log('📝 Test script loaded. Run testProjectFlowViews() to test manually.');