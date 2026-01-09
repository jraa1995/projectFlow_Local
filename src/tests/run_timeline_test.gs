/**
 * Simple script to run timeline property test
 * Execute this function in Google Apps Script console
 */
function runTimelineTest() {
  try {
    console.log('🚀 Running Timeline Property Test');
    console.log('=================================');
    
    // Initialize system
    initializeSystem();
    
    // Run the timeline property test with fewer iterations for testing
    const result = runTimelineDataCompletenessPropertyTest(5);
    
    console.log('📊 Test Results:');
    console.log('================');
    console.log(`Test: ${result.testName}`);
    console.log(`Property: ${result.property}`);
    console.log(`Validates: ${result.validates}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Passed: ${result.passed}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Success Rate: ${result.successRate}`);
    
    if (result.failed > 0) {
      console.log('\n❌ Failures:');
      result.failures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.reason}`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Timeline test execution failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}