#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Analyze Playwright test results and generate readable failure report
 */

const testResultsDir = path.join(__dirname, 'test-results');

// Read all test result directories
const dirs = fs.readdirSync(testResultsDir).filter(d => {
  const fullPath = path.join(testResultsDir, d);
  return fs.statSync(fullPath).isDirectory();
});

const results = {
  passed: [],
  failed: [],
  skipped: []
};

// Parse each test directory
dirs.forEach(dir => {
  const errorContextFile = path.join(testResultsDir, dir, 'error-context.md');
  
  // Extract test name from directory (format: spec-name-hash-test-name-chromium)
  const testName = dir
    .replace(/^(\d+-)?/, '') // Remove leading numbers
    .replace(/-[a-f0-9]{5}/, '') // Remove hash
    .replace(/-chromium$/, '') // Remove browser
    .replace(/-/g, ' ') // Replace dashes with spaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Title case

  // Check if error context exists (indicates failure)
  if (fs.existsSync(errorContextFile)) {
    const content = fs.readFileSync(errorContextFile, 'utf8');
    results.failed.push({
      name: testName,
      dir: dir,
      errorFile: errorContextFile,
      hasSnapshot: content.includes('Page snapshot')
    });
  } else {
    results.passed.push({
      name: testName,
      dir: dir
    });
  }
});

// Generate report
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║             PLAYWRIGHT TEST RESULTS SUMMARY                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`✅ PASSED: ${results.passed.length}`);
results.passed.forEach(t => console.log(`   • ${t.name}`));

console.log(`\n❌ FAILED: ${results.failed.length}`);
results.failed.forEach(t => console.log(`   • ${t.name}`));

if (results.failed.length > 0) {
  console.log('\n' + '═'.repeat(60));
  console.log('FAILURE DETAILS');
  console.log('═'.repeat(60) + '\n');

  results.failed.forEach((test, idx) => {
    console.log(`[${idx + 1}] ${test.name}`);
    console.log(`    Directory: ${test.dir}`);
    
    const errorFile = test.errorFile;
    if (fs.existsSync(errorFile)) {
      const content = fs.readFileSync(errorFile, 'utf8');
      
      // Extract error info if present
      if (content.includes('Error:')) {
        const errorMatch = content.match(/Error:\s*(.+?)(?:\n|$)/);
        if (errorMatch) {
          console.log(`    Error: ${errorMatch[1]}`);
        }
      }
      
      // Check what failed
      if (content.includes('expected')) {
        const expectedMatch = content.match(/expected\s*(.+?)(?:\n|$)/i);
        if (expectedMatch) {
          console.log(`    Expected: ${expectedMatch[1]}`);
        }
      }
      
      if (content.includes('Page snapshot')) {
        console.log('    → See full page context in: error-context.md');
      }
    }
    console.log('');
  });

  // Generate command to inspect failures
  if (results.failed.length > 0) {
    console.log('═'.repeat(60));
    console.log('TO VIEW DETAILS:');
    console.log('═'.repeat(60));
    console.log('\nFor detailed failure info:');
    results.failed.slice(0, 3).forEach(t => {
      console.log(`  cat test-results/${t.dir}/error-context.md`);
    });
  }
}

console.log('\n' + '═'.repeat(60));
console.log(`TOTAL: ${results.passed.length} passed, ${results.failed.length} failed`);
console.log('═'.repeat(60) + '\n');

process.exit(results.failed.length > 0 ? 1 : 0);
