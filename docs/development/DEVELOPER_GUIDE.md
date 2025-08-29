# Developer Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guide](#testing-guide)
- [Debugging Tips](#debugging-tips)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- VS Code (recommended) or your preferred IDE

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/corev2.git
cd corev2

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Development Setup

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required
NODE_ENV=development
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001

# Auth0 (Required)
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:3000/callback
VITE_AUTH0_AUDIENCE=https://api.astralcore.com

# Optional
VITE_SENTRY_DSN=
VITE_GA_MEASUREMENT_ID=
```

### VS Code Setup

Recommended extensions:
- ESLint
- Prettier
- TypeScript Vue Plugin
- Tailwind CSS IntelliSense
- Jest Runner

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Project Structure

```
corev2/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Business logic & APIs
│   ├── stores/          # Zustand stores
│   ├── utils/           # Utility functions
│   ├── views/           # Page components
│   ├── i18n/           # Translations
│   ├── styles/         # Global styles
│   ├── types.ts        # TypeScript types
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── tests/              # Test files
├── scripts/            # Build & utility scripts
└── netlify/           # Netlify functions
```

## Development Workflow

### Branch Strategy

```
main (production)
├── develop (staging)
│   ├── feature/feature-name
│   ├── bugfix/bug-description
│   └── hotfix/critical-fix
```

### Creating a Feature

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Follow Conventional Commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

Examples:
```
feat: add crisis detection algorithm
fix: resolve chat message ordering issue
docs: update API documentation
test: add unit tests for auth service
```

## Coding Standards

### TypeScript

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use enums for constants
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Helper = 'helper'
}

// Use type for unions
type Status = 'active' | 'inactive' | 'pending';

// Always specify return types
function getUser(id: string): User | null {
  // Implementation
}

// Use async/await over promises
async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  return response.json();
}
```

### React Components

```typescript
// Functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

// Custom hooks
export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Fetch user logic
  }, []);
  
  return { user };
};
```

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (start with `use`)
- Utils: `camelCase.ts`
- Types: `types.ts` or `ComponentName.types.ts`
- Tests: `ComponentName.test.tsx`

## Testing Guide

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Writing Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Login');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Debugging Tips

### Browser DevTools

1. **React DevTools**
   - Install React DevTools extension
   - Inspect component props and state
   - Profile performance

2. **Network Tab**
   - Monitor API calls
   - Check request/response headers
   - Analyze load times

3. **Console Debugging**
   ```typescript
   // Conditional logging
   if (process.env.NODE_ENV === 'development') {
     console.log('Debug info:', data);
   }
   
   // Group related logs
   console.group('User Action');
   console.log('Action:', action);
   console.log('Payload:', payload);
   console.groupEnd();
   ```

### VS Code Debugging

1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

2. Set breakpoints in VS Code
3. Press F5 to start debugging

## Common Tasks

### Adding a New Component

```bash
# Create component file
touch src/components/MyComponent.tsx

# Create test file
touch src/components/__tests__/MyComponent.test.tsx

# Create styles (if needed)
touch src/styles/my-component.css
```

### Adding a New Route

```typescript
// In App.tsx or router configuration
import { MyNewView } from './views/MyNewView';

<Route path="/my-new-route" element={<MyNewView />} />
```

### Adding a Translation

```json
// In src/i18n/locales/en/common.json
{
  "myNewKey": "My translated text"
}
```

### Creating a Custom Hook

```typescript
// src/hooks/useMyHook.ts
export const useMyHook = (param: string) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Hook logic
  }, [param]);
  
  return { data };
};
```

### Adding a Zustand Store

```typescript
// src/stores/myStore.ts
import { create } from 'zustand';

interface MyStore {
  items: Item[];
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
}

export const useMyStore = create<MyStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter(i => i.id !== id) 
  }))
}));
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

#### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"

# Check for type errors
npm run type-check
```

#### Build Failures
```bash
# Clean build cache
rm -rf dist .vite

# Try building again
npm run build
```

### Performance Issues

1. **Check bundle size**
   ```bash
   npm run analyze:bundle
   ```

2. **Profile React components**
   - Use React DevTools Profiler
   - Look for unnecessary re-renders

3. **Optimize images**
   - Use WebP format
   - Implement lazy loading
   - Use appropriate sizes

### Debugging Auth Issues

1. Check Auth0 configuration
2. Verify environment variables
3. Check network requests in DevTools
4. Review Auth0 logs in dashboard

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

### Internal Documentation
- [Architecture](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### Support
- GitHub Issues: Report bugs
- Discussions: Ask questions
- Wiki: Find detailed guides

---

Last Updated: November 2024
Version: 1.0.0