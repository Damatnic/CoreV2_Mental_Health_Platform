# Contributing to Astral Core

Thank you for your interest in contributing to Astral Core! We're building a mental health support platform that makes a real difference in people's lives, and we welcome contributions that help us achieve this mission.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Security Guidelines](#security-guidelines)
- [Accessibility Requirements](#accessibility-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, socio-economic status, nationality
- Personal appearance, race, religion, or sexual identity and orientation

### Expected Behavior
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members
- Be mindful that this project deals with sensitive mental health topics

### Unacceptable Behavior
- Harassment, discrimination, or offensive comments
- Public or private harassment
- Publishing others' private information without permission
- Conduct which could reasonably be considered inappropriate in a professional setting
- Dismissive or insensitive comments about mental health

## Getting Started

### Prerequisites
1. **Development Environment**
   ```bash
   # Required
   - Node.js 18+
   - npm 9+
   - Git
   
   # Recommended
   - VS Code with extensions:
     - ESLint
     - Prettier
     - TypeScript
     - Jest Runner
   ```

2. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   # Clone your fork
   git clone https://github.com/YOUR_USERNAME/astral-core.git
   cd astral-core
   
   # Add upstream remote
   git remote add upstream https://github.com/original/astral-core.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Environment Setup**
   ```bash
   # Copy development environment
   cp development.env .env
   
   # Update with your values (see ENVIRONMENT_VARIABLES.md)
   # Validate configuration
   npm run validate:env
   ```

5. **Run Tests**
   ```bash
   # Ensure everything is working
   npm test
   npm run lint
   npm run type-check
   ```

## Development Process

### 1. Find or Create an Issue
- Check [existing issues](https://github.com/astral-core/issues)
- If creating new issue, use appropriate template:
  - 🐛 Bug Report
  - ✨ Feature Request
  - 📚 Documentation
  - 🔒 Security Issue (see SECURITY.md)

### 2. Create a Branch
```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# Or for bugs
git checkout -b fix/issue-description
```

### 3. Make Your Changes
- Write clean, documented code
- Follow our coding standards
- Add/update tests
- Update documentation
- Ensure accessibility compliance

### 4. Test Your Changes
```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern=your-test

# Check coverage
npm run test:coverage

# Lint and format
npm run lint
npm run format

# Type checking
npm run type-check

# Security audit
node scripts/security/audit.js
```

### 5. Submit Pull Request
- Push to your fork
- Create pull request against `main`
- Fill out PR template completely
- Link related issues

## How to Contribute

### Types of Contributions

#### 🐛 Bug Fixes
- Verify the bug exists in latest version
- Write a test that fails without your fix
- Implement the minimal fix
- Ensure all tests pass

#### ✨ New Features
- Discuss in issue first
- Consider accessibility from the start
- Write comprehensive tests
- Update documentation
- Add feature flag if experimental

#### 📚 Documentation
- Fix typos and clarify language
- Add examples and use cases
- Improve API documentation
- Translate documentation

#### 🧪 Tests
- Increase test coverage
- Add edge case tests
- Improve test performance
- Add E2E tests for user flows

#### ♿ Accessibility
- Fix WCAG violations
- Add ARIA labels
- Improve keyboard navigation
- Test with screen readers

#### 🌍 Translations
- Add new language support
- Fix translation errors
- Improve cultural sensitivity
- Update crisis resources for locale

## Coding Standards

### TypeScript
```typescript
// ✅ Good
interface UserProfile {
  id: string;
  name: string;
  createdAt: Date;
}

const getUserProfile = async (id: string): Promise<UserProfile> => {
  // Implementation
};

// ❌ Bad
const getUserProfile = async (id: any) => {
  // No type safety
};
```

### React Components
```tsx
// ✅ Good - Functional component with proper typing
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      className="btn"
    >
      {label}
    </button>
  );
};

// ❌ Bad - Missing types and accessibility
export const Button = (props) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

### State Management (Zustand)
```typescript
// ✅ Good - Typed store with clear actions
interface UserStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user, error: null }),
  clearUser: () => set({ user: null }),
}));
```

### File Organization
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.module.css
│   │   └── index.ts
├── services/
│   ├── authService.ts
│   └── authService.test.ts
└── utils/
    ├── validation.ts
    └── validation.test.ts
```

## Testing Requirements

### Coverage Requirements
- **Minimum**: 80% overall coverage
- **New code**: 90% coverage required
- **Critical paths**: 100% coverage (auth, crisis detection)

### Test Types

#### Unit Tests
```typescript
// Component test example
describe('Button', () => {
  it('should render with label', () => {
    render(<Button label="Click me" onClick={jest.fn()} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be accessible', () => {
    const { container } = render(
      <Button label="Submit" onClick={jest.fn()} aria-label="Submit form" />
    );
    expect(container).toBeAccessible();
  });
});
```

#### Integration Tests
```typescript
// Service integration test
describe('AuthService Integration', () => {
  it('should complete login flow', async () => {
    const user = await authService.login('test@example.com', 'password');
    expect(user).toBeDefined();
    expect(await authService.isAuthenticated()).toBe(true);
  });
});
```

#### E2E Tests
```typescript
// Playwright E2E test
test('crisis flow should work', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="crisis-button"]');
  await expect(page).toHaveURL('/crisis-support');
  await expect(page.locator('h1')).toContainText('Crisis Support');
});
```

## Security Guidelines

### Handling Sensitive Data
- **Never** log sensitive information (passwords, tokens, PII)
- **Always** use encryption for sensitive data storage
- **Validate** all user inputs
- **Sanitize** outputs to prevent XSS
- **Use** parameterized queries to prevent SQL injection

### Authentication & Authorization
```typescript
// ✅ Good - Proper auth check
const SecureComponent = () => {
  const { user, hasRole } = useAuth();
  
  if (!user || !hasRole('admin')) {
    return <Unauthorized />;
  }
  
  return <AdminPanel />;
};

// ❌ Bad - Client-side only check
const InsecureComponent = () => {
  const isAdmin = localStorage.getItem('role') === 'admin';
  if (isAdmin) {
    return <AdminPanel />;
  }
};
```

### Security Checklist
- [ ] No hardcoded secrets or API keys
- [ ] Input validation implemented
- [ ] Output encoding for XSS prevention
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Audit logging implemented

## Accessibility Requirements

### WCAG AAA Compliance
All contributions must meet WCAG AAA standards:

#### Required Checks
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast ratio ≥ 7:1 (AAA)
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] No autoplay media
- [ ] Captions for videos

#### Testing Tools
```bash
# Run accessibility tests
npm run test:a11y

# Use these tools during development:
- axe DevTools browser extension
- WAVE browser extension
- NVDA/JAWS screen readers
- Keyboard-only navigation
```

#### Example Implementation
```tsx
// ✅ Accessible form
<form onSubmit={handleSubmit} aria-label="User registration">
  <label htmlFor="email">
    Email Address
    <span aria-label="required">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={errors.email ? 'true' : 'false'}
    aria-describedby="email-error"
  />
  {errors.email && (
    <span id="email-error" role="alert">
      {errors.email}
    </span>
  )}
</form>
```

## Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style (formatting, semicolons, etc)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding/updating tests
- **chore**: Maintenance tasks
- **security**: Security improvements
- **a11y**: Accessibility improvements

### Examples
```bash
# Feature
feat(crisis): add multilingual crisis detection
- Support for 7 languages
- Cultural sensitivity improvements
- Enhanced keyword matching

# Bug fix
fix(auth): resolve token refresh race condition
Fixes #123

# Documentation
docs(api): update authentication endpoints

# Security
security(session): implement secure cookie flags
```

### Commit Best Practices
- Write clear, concise commit messages
- Reference issues and PRs
- Commit logical units of work
- Sign commits with GPG when possible

## Pull Request Process

### Before Submitting
1. **Update from upstream**
   ```bash
   git pull upstream main
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run precommit
   # Includes: lint, format, test, type-check
   ```

3. **Update documentation**
   - Add/update JSDoc comments
   - Update README if needed
   - Add to CHANGELOG.md

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Accessibility
- [ ] WCAG AAA compliant
- [ ] Keyboard navigation tested
- [ ] Screen reader tested

## Security
- [ ] Security audit passed
- [ ] No sensitive data exposed
- [ ] Input validation added

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.logs left
- [ ] Branch is up to date

## Screenshots (if applicable)
```

### Review Process
1. **Automated Checks**
   - CI/CD pipeline runs tests
   - Code coverage verified
   - Security scan performed
   - Accessibility audit

2. **Code Review**
   - At least 1 approval required
   - Security-sensitive changes need 2 approvals
   - Address all feedback

3. **Merge Requirements**
   - All checks passing
   - No merge conflicts
   - Approved by maintainer
   - Documentation complete

## Community

### Getting Help
- 💬 [Discord](https://discord.gg/astralcore)
- 📧 dev@astralcore.app
- 📚 [Documentation](https://docs.astralcore.app)
- 🐛 [Issue Tracker](https://github.com/astral-core/issues)

### Recognition
We value all contributions! Contributors are:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Credited in release notes
- Eligible for contributor badges

### First-Time Contributors
Look for issues labeled:
- `good first issue`
- `help wanted`
- `documentation`

Don't hesitate to ask questions!

## License
By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for helping make mental health support more accessible! 💙