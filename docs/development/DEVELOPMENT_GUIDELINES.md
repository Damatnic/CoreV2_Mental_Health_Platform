# Astral Core - Development Guidelines & Workflow Rules

## 🎯 Core Development Principles

### 1. Safety First
- **Crisis Detection**: Any changes affecting crisis detection must be thoroughly tested
- **Data Privacy**: Never compromise user anonymity or data security
- **Content Moderation**: Maintain robust content filtering and reporting
- **Accessibility**: Ensure all changes maintain WCAG 2.1 AA compliance

### 2. User Experience Priority
- **Responsive Design**: All changes must work on mobile and desktop
- **Performance**: No feature should negatively impact load times
- **Accessibility**: Every component must be keyboard navigable
- **Error Handling**: Graceful degradation for all error states

## 📋 Code Quality Standards

### TypeScript Requirements
```typescript
// ✅ Good: Strict typing
interface ComponentProps {
  userToken: string | null;
  onSave: (data: FormData) => Promise<void>;
}

// ❌ Bad: Any types
interface ComponentProps {
  userToken: any;
  onSave: any;
}
```

### Component Standards
```tsx
// ✅ Good: Functional component with proper typing
export const MyComponent: React.FC<ComponentProps> = ({ userToken, onSave }) => {
  // Component logic
};

// ✅ Good: Default export at bottom
export default MyComponent;
```

### Store Pattern
```typescript
// ✅ Good: Zustand store pattern
interface StoreState {
  data: DataType[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  updateItem: (id: string, data: Partial<DataType>) => Promise<void>;
}

export const useDataStore = create<StoreState>((set, get) => ({
  data: [],
  isLoading: false,
  error: null,
  
  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await ApiClient.fetchData();
      set({ data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
```

### API Client Pattern
```typescript
// ✅ Good: Consistent API structure
export const ApiClient = {
  resources: {
    getAll: (): Promise<Resource[]> => _callApi('/resources'),
    getById: (id: string): Promise<Resource> => _callApi(`/resources/${id}`),
    create: (data: CreateResourceData): Promise<Resource> => 
      _callApi('/resources', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateResourceData): Promise<Resource> => 
      _callApi(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> => 
      _callApi(`/resources/${id}`, { method: 'DELETE' })
  }
};
```

## 🔒 Security Guidelines

### Input Validation
```typescript
// ✅ Good: Always validate and sanitize input
const handleSubmit = (content: string) => {
  const sanitized = securityService.sanitizeInput(content);
  const isValid = securityService.validateInput(sanitized, ValidationRules.post);
  
  if (!isValid) {
    addToast('Invalid content', 'error');
    return;
  }
  
  // Process sanitized content
};
```

### Authentication Checks
```typescript
// ✅ Good: Check permissions before actions
const performHelperAction = () => {
  if (!user || !['Helper', 'Moderator', 'Admin'].includes(user.role)) {
    addToast('Unauthorized action', 'error');
    return;
  }
  
  // Perform action
};
```

### Rate Limiting
```typescript
// ✅ Good: Implement rate limiting for user actions
const handleAction = async () => {
  if (!securityService.checkRateLimit('action_type', userToken)) {
    addToast('Please wait before trying again', 'warning');
    return;
  }
  
  // Perform action
};
```

## 🎨 UI/UX Guidelines

### Component Composition
```tsx
// ✅ Good: Composable components
export const PostCard: React.FC<PostCardProps> = ({ post, onSupport, onReport }) => {
  return (
    <Card className="post-card">
      <PostHeader post={post} />
      <PostContent content={post.content} />
      <PostActions 
        onSupport={() => onSupport(post.id)}
        onReport={() => onReport(post.id)}
      />
    </Card>
  );
};
```

### Loading States
```tsx
// ✅ Good: Proper loading states
const MyView = () => {
  const { data, isLoading, error } = useDataStore();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!data.length) return <EmptyState message="No data found" />;
  
  return <DataList data={data} />;
};
```

### Error Boundaries
```tsx
// ✅ Good: Wrap views in error boundaries
<ErrorBoundary fallback={<ErrorState />}>
  <Suspense fallback={<LoadingSpinner />}>
    <ViewComponent />
  </Suspense>
</ErrorBoundary>
```

## 📱 Responsive Design Rules

### CSS Structure
```css
/* ✅ Good: Mobile-first responsive design */
.component {
  /* Mobile styles */
  padding: 1rem;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
    padding: 1.5rem;
    font-size: 1rem;
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
    padding: 2rem;
    font-size: 1.125rem;
  }
}
```

### Touch Targets
```css
/* ✅ Good: Adequate touch targets */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1rem;
}
```

## 🧪 Testing Requirements

### Component Testing
```typescript
// ✅ Good: Comprehensive component tests
describe('PostCard', () => {
  const mockPost = {
    id: '1',
    content: 'Test content',
    supportCount: 5
  };

  it('renders post content', () => {
    render(<PostCard post={mockPost} onSupport={jest.fn()} onReport={jest.fn()} />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('calls onSupport when support button clicked', async () => {
    const onSupport = jest.fn();
    render(<PostCard post={mockPost} onSupport={onSupport} onReport={jest.fn()} />);
    
    await userEvent.click(screen.getByText('Support'));
    expect(onSupport).toHaveBeenCalledWith('1');
  });
});
```

### Store Testing
```typescript
// ✅ Good: Store state testing
describe('useDataStore', () => {
  beforeEach(() => {
    useDataStore.setState({ data: [], isLoading: false, error: null });
  });

  it('loads data successfully', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    ApiClient.fetchData = jest.fn().mockResolvedValue(mockData);

    await act(async () => {
      await useDataStore.getState().fetchData();
    });

    expect(useDataStore.getState().data).toEqual(mockData);
    expect(useDataStore.getState().isLoading).toBe(false);
  });
});
```

## 🚀 Deployment Guidelines

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] No console errors or warnings
- [ ] Responsive design verified
- [ ] Accessibility tested
- [ ] Performance benchmarks met
- [ ] Security review completed

### Environment Variables
```bash
# ✅ Required for production
GEMINI_API_KEY=your-api-key
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=your-audience
JWT_SECRET=your-secret-key

# ✅ Optional but recommended
NODE_ENV=production
DATABASE_URL=your-database-url
```

### Build Verification
```bash
# ✅ Clean build process
npm run clean
npm ci
npm run build
npm run preview  # Test production build locally
```

## 🔄 Git Workflow

### Branch Naming
```bash
# ✅ Good branch names
feature/add-mood-tracking
bugfix/fix-chat-loading
hotfix/security-patch
refactor/improve-api-client
```

### Commit Messages
```bash
# ✅ Good commit messages
feat: add mood tracking dashboard
fix: resolve chat loading issue
docs: update API documentation
test: add unit tests for PostCard
refactor: simplify authentication flow
```

### Pull Request Process
1. **Create Feature Branch**: `git checkout -b feature/description`
2. **Write Tests**: Ensure new functionality is tested
3. **Update Documentation**: Keep docs current
4. **Self Review**: Check your own code first
5. **Submit PR**: Include description and testing instructions
6. **Code Review**: Address feedback promptly
7. **Merge**: Use squash merge for clean history

## ⚠️ Critical Constraints

### DO NOT Modify Without Approval
- Crisis detection algorithms
- Authentication/authorization logic
- Database schema changes
- API endpoint breaking changes
- Security-related configurations

### Always Preserve
- User anonymity features
- Crisis intervention flows
- Data privacy measures
- Accessibility features
- Mobile responsiveness

### Performance Budgets
- Initial page load: < 3 seconds
- Route transitions: < 500ms
- Bundle size: < 1MB gzipped
- First Contentful Paint: < 2 seconds

## 📊 Code Review Checklist

### Functionality
- [ ] Feature works as intended
- [ ] Edge cases handled
- [ ] Error states covered
- [ ] Loading states implemented

### Code Quality
- [ ] TypeScript types correct
- [ ] No console logs/debugger statements
- [ ] Proper error handling
- [ ] Clean, readable code

### UI/UX
- [ ] Responsive design
- [ ] Accessibility compliant
- [ ] Consistent styling
- [ ] Proper loading/error states

### Security
- [ ] Input validation
- [ ] XSS prevention
- [ ] Rate limiting where needed
- [ ] Proper authentication checks

### Testing
- [ ] Unit tests written
- [ ] Integration tests if needed
- [ ] Manual testing completed
- [ ] Accessibility testing done

## 🛠️ Development Tools

### Required VSCode Extensions
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### Recommended Settings
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

Following these guidelines ensures consistent, secure, and maintainable code that upholds the mission of providing safe mental health support.
