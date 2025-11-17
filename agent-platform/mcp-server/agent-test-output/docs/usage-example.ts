/**
 * Example: Using Agent Platform File Operations
 * 
 * This example shows how agents can use the file operations toolkit
 */

// Enable the file operations toolkit
await enable_toolkit({ toolkitId: 'file-operations' });

// Create a new file
await file_write({
  path: './output/data.json',
  content: JSON.stringify({ message: 'Hello from agent!' }, null, 2),
  createDirs: true
});

// Search for files
const results = await file_search({
  pattern: '**/*.ts',
  cwd: './src',
  limit: 100
});

console.log(`Found ${results.count} TypeScript files`);

// Search file contents with context
const todos = await file_grep({
  pattern: 'TODO:',
  filePattern: '**/*.ts',
  cwd: './src',
  contextLines: 3
});

console.log(`Found ${todos.count} TODO comments`);

// Read and analyze files
if (todos.matches.length > 0) {
  for (const match of todos.matches) {
    console.log(`TODO in ${match.file}:${match.line}`);
    console.log(`  ${match.content}`);
  }
}

// Create a summary report
const summary = `# TODO Summary
Found ${todos.count} items that need attention.
`;

await file_write({
  path: './reports/todo-summary.md',
  content: summary,
  createDirs: true
});
