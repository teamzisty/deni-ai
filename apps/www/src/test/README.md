# Testing Setup

This directory contains the test configuration for the www app.

## Running Tests

```bash
# Run all tests
bun test

# Run tests with UI
bun test:ui

# Run tests with coverage
bun test:coverage
```

## Test Structure

- Component tests: `src/components/__tests__/`
- Utility tests: `src/lib/__tests__/`
- API route tests: `src/app/api/*/[*]/__tests__/`

## Writing Tests

1. **Component Tests**: Use React Testing Library
2. **Utility Tests**: Standard Vitest tests
3. **API Route Tests**: Mock dependencies with `vi.mock()`

## Configuration

- Test runner: Vitest
- Environment: happy-dom
- Coverage: @vitest/coverage-v8
- React testing: @testing-library/react