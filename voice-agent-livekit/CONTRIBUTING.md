# Contributing to Voice Agent LiveKit

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Use the bug report template** when creating an issue
3. **Provide details:**
   - Environment (OS, Node version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages and logs

### Suggesting Features

1. **Check roadmap** to see if it's already planned
2. **Use the feature request template**
3. **Explain the use case** and benefit
4. **Consider alternatives** and trade-offs

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`feature/your-feature-name`)
3. **Make your changes** following our coding standards
4. **Write tests** for new functionality
5. **Update documentation** if needed
6. **Submit a PR** with clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/voice-agent-livekit
cd voice-agent-livekit

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials

# Run in development mode
npm run dev

# Run tests
npm test
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide type annotations for public APIs
- Use interfaces for data structures
- Avoid `any` type when possible

### Code Style

- Use Prettier for formatting (config in `.prettierrc.json`)
- Use ESLint for linting (config in `.eslintrc.json`)
- Maximum line length: 100 characters
- Use meaningful variable names

### Example

```typescript
// Good ✓
async function generateResponse(userInput: string): Promise<string> {
  const timer = new PerfTimer('generate_response');
  
  try {
    const response = await this.geminiManager.generateResponse(userInput);
    timer.end({ success: true });
    return response;
  } catch (error) {
    timer.end({ success: false });
    log.error('Failed to generate response', error as Error);
    throw error;
  }
}

// Bad ✗
async function gen(inp: any) {
  return await this.gem.gen(inp);
}
```

### Documentation

- Add JSDoc comments for public methods
- Include parameter descriptions and return types
- Provide usage examples for complex APIs

```typescript
/**
 * Process text input and generate a response.
 * 
 * This method checks pre-buffered responses first, then cache,
 * and finally generates a new response using Gemini.
 * 
 * @param input - User's text input
 * @returns Promise resolving to the agent's response
 * @throws Error if generation fails
 * 
 * @example
 * ```typescript
 * const response = await agent.processText('Hello!');
 * console.log(response);
 * ```
 */
async processText(input: string): Promise<string> {
  // Implementation
}
```

## Testing

### Unit Tests

- Write tests for all new functionality
- Aim for >80% code coverage
- Use descriptive test names

```typescript
describe('BufferManager', () => {
  it('should return pre-buffered response for exact match', async () => {
    const buffer = new BufferManager(config);
    await buffer.initialize();
    
    const response = buffer.getPreBufferedResponse('hello');
    expect(response).toBe('Hello! How can I assist you today?');
  });
  
  it('should return null for unknown input', async () => {
    const buffer = new BufferManager(config);
    await buffer.initialize();
    
    const response = buffer.getPreBufferedResponse('xyz123');
    expect(response).toBeNull();
  });
});
```

### Integration Tests

- Test component interactions
- Use test doubles for external services
- Verify event emissions

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test buffer-manager.test.ts
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(gemini): add streaming response support

Implement streaming response generation using Gemini's
streaming API. This reduces perceived latency for long responses.

Closes #42
```

```
fix(livekit): handle connection drops gracefully

Add automatic reconnection logic with exponential backoff
when LiveKit connection is lost.

Fixes #38
```

## Project Structure

```
voice-agent-livekit/
├── src/
│   ├── core/              # Core components
│   │   ├── voice-agent.ts
│   │   ├── livekit-manager.ts
│   │   ├── gemini-manager.ts
│   │   ├── mcp-manager.ts
│   │   ├── buffer-manager.ts
│   │   └── collaboration-manager.ts
│   ├── utils/             # Utilities
│   │   ├── logger.ts
│   │   └── config.ts
│   ├── types.ts           # Type definitions
│   ├── index.ts           # Public API
│   └── cli.ts             # CLI interface
├── examples/              # Usage examples
├── docs/                  # Documentation
├── tests/                 # Test files
└── dist/                  # Build output
```

## Adding a New Feature

### 1. Plan the Feature

- Define the use case
- Consider the API design
- Think about edge cases
- Check for breaking changes

### 2. Implement

- Create new files in appropriate directories
- Follow existing patterns
- Add comprehensive error handling
- Add logging for debugging

### 3. Test

- Write unit tests
- Add integration tests if needed
- Test error scenarios
- Verify performance impact

### 4. Document

- Update README.md if needed
- Add API documentation
- Create usage examples
- Update CHANGELOG.md

### 5. Submit PR

- Fill out the PR template
- Link related issues
- Request review from maintainers
- Address feedback

## Performance Guidelines

- Avoid blocking operations
- Use async/await for I/O
- Implement timeouts for external calls
- Cache when appropriate
- Log performance metrics

## Security Guidelines

- Never commit secrets or API keys
- Validate all user input
- Use parameterized queries
- Implement rate limiting
- Follow principle of least privilege

## Questions?

- Open an issue for questions
- Check existing documentation
- Join our community chat (if available)

Thank you for contributing! 🎉
