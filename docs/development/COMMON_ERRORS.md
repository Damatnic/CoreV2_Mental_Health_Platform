# Astral Core - Common Errors & Solutions

*Last Updated: August 3, 2025*

## 🚨 Critical Errors

### 1. Build Failures

#### TypeScript Compilation Errors
```bash
Error: TS2345: Argument of type 'string' is not assignable to parameter of type 'ActiveView'
```
**Cause**: Incorrect type usage in view navigation
**Location**: `src/views/*.tsx` components
**Solution**:
```typescript
// ❌ Wrong
setActiveView('some-string');

// ✅ Correct
setActiveView({ view: 'feed', params: {} });
```

#### Vite Build Errors
```bash
Error: Could not resolve "./src/views/NonExistentView"
```
**Cause**: Missing lazy import or incorrect file path
**Location**: `index.tsx` lazy imports
**Solution**: Verify file exists and export is correct
```typescript
// ✅ Ensure file exists and has default export
const ExampleView = lazy(() => import('./src/views/ExampleView'));
```

### 2. Runtime Errors

#### Authentication Token Missing
```javascript
Error: Unauthorized - No valid token found
```
**Cause**: Auth0 token expired or missing
**Location**: `src/contexts/AuthContext.tsx`
**Frequency**: Common during development
**Solution**:
1. Check Auth0 configuration in environment variables
2. Ensure token refresh logic is working
3. Clear localStorage and re-authenticate
```typescript
// Clear auth state
localStorage.removeItem('auth0.token');
window.location.reload();
```

#### API Endpoint Not Found
```javascript
Error: 404 - Function not found
```
**Cause**: Netlify function not deployed or incorrect endpoint
**Location**: `src/utils/ApiClient.ts`
**Solution**:
1. Verify function exists in `netlify/functions/`
2. Check function export syntax
3. Redeploy if necessary
```typescript
// ✅ Correct function export
exports.handler = async (event, context) => {
  // Function logic
};
```

### 3. State Management Errors

#### Zustand Store State Reset
```javascript
Error: Cannot read property 'fetchDilemmas' of undefined
```
**Cause**: Store action called before store initialization
**Location**: Various store files
**Solution**: Add loading guards
```typescript
// ✅ Add guards in components
const { fetchDilemmas, isLoading } = useDilemmaStore();

useEffect(() => {
  if (fetchDilemmas && !isLoading) {
    fetchDilemmas();
  }
}, [fetchDilemmas, isLoading]);
```

## ⚠️ Common Development Errors

### 1. Component Rendering Issues

#### Memory Leaks from useEffect
```javascript
Warning: Can't perform a React state update on an unmounted component
```
**Cause**: Async operations continuing after component unmount
**Location**: Components with API calls
**Frequency**: Very common
**Solution**: Cleanup functions in useEffect
```typescript
// ✅ Proper cleanup
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const data = await ApiClient.getData();
    if (isMounted) {
      setData(data);
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, []);
```

#### Infinite Re-renders
```javascript
Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.
```
**Cause**: Missing dependencies in useEffect or useCallback
**Location**: Various components
**Solution**: Fix dependency arrays
```typescript
// ❌ Missing dependency
useEffect(() => {
  fetchData(someParam);
}, []); // Missing someParam

// ✅ Correct dependencies
useEffect(() => {
  fetchData(someParam);
}, [someParam]);
```

### 2. CSS and Styling Issues

#### Broken Layout on Mobile
**Symptom**: Components overlap or don't fit on mobile screens
**Cause**: Missing responsive CSS or incorrect viewport units
**Location**: Component CSS files
**Solution**: Use mobile-first responsive design
```css
/* ✅ Mobile-first approach */
.component {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 768px) {
  .component {
    width: 50%;
    padding: 2rem;
  }
}
```

#### CSS Not Loading
**Symptom**: Components appear unstyled
**Cause**: Incorrect CSS import or MIME type issues
**Location**: Component imports or build configuration
**Solution**: Check import paths and Netlify headers
```typescript
// ✅ Correct CSS import
import './Component.css';
```

### 3. Data Fetching Errors

#### Stale Closure in Async Functions
```javascript
Error: State not updating correctly in async operations
```
**Cause**: Capturing stale state in async callbacks
**Location**: Components with async operations
**Solution**: Use functional state updates
```typescript
// ❌ Stale closure
const handleUpdate = async () => {
  const result = await apiCall();
  setCount(count + result); // count might be stale
};

// ✅ Functional update
const handleUpdate = async () => {
  const result = await apiCall();
  setCount(prev => prev + result);
};
```

## 🔧 Environment & Configuration Errors

### 1. Environment Variables

#### Missing API Keys
```javascript
Error: API key is required but not provided
```
**Cause**: Missing or incorrect environment variables
**Location**: `.env` file or Netlify environment settings
**Solution**: Verify all required environment variables
```bash
# ✅ Required variables
GEMINI_API_KEY=your-key-here
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=your-audience
```

#### Environment Variable Not Loading
**Symptom**: `process.env.VARIABLE_NAME` is undefined
**Cause**: Variable name doesn't start with `VITE_` in Vite
**Solution**: Use proper prefix or access through import.meta.env
```typescript
// ❌ Won't work in Vite
const apiKey = process.env.GEMINI_API_KEY;

// ✅ Correct for Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

### 2. Netlify Function Errors

#### Function Timeout
```javascript
Error: Function execution timed out
```
**Cause**: Function taking longer than 10 seconds (free tier)
**Location**: Netlify functions
**Solution**: Optimize function or upgrade plan
```typescript
// ✅ Add timeout handling
exports.handler = async (event, context) => {
  const timeout = setTimeout(() => {
    throw new Error('Function timeout');
  }, 9000); // 9 seconds
  
  try {
    const result = await longRunningOperation();
    clearTimeout(timeout);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
};
```

#### CORS Issues
```javascript
Error: Access to fetch blocked by CORS policy
```
**Cause**: Missing CORS headers in function responses
**Location**: Netlify functions
**Solution**: Add proper CORS headers
```typescript
// ✅ Add CORS headers
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Handle actual request
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result)
  };
};
```

## 📱 Mobile-Specific Errors

### 1. Touch and Gesture Issues

#### Touch Events Not Working
**Symptom**: Buttons not responding to touch on mobile
**Cause**: Missing touch event handlers or incorrect CSS
**Solution**: Add proper touch handlers
```typescript
// ✅ Handle both mouse and touch events
const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
  e.preventDefault();
  // Handle interaction
};

<button 
  onMouseDown={handleInteraction}
  onTouchStart={handleInteraction}
>
  Button
</button>
```

#### Viewport Issues
**Symptom**: Page doesn't fit mobile screen properly
**Cause**: Missing or incorrect viewport meta tag
**Solution**: Ensure proper viewport configuration
```html
<!-- ✅ Correct viewport tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### 2. Performance Issues on Mobile

#### Large Bundle Size
**Symptom**: Slow loading on mobile devices
**Cause**: Large JavaScript bundle
**Solution**: Implement code splitting and lazy loading
```typescript
// ✅ Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ✅ Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

## 🔐 Security-Related Errors

### 1. XSS Prevention Errors

#### Unsafe HTML Rendering
```javascript
Warning: Detected potential XSS vulnerability
```
**Cause**: Rendering unsanitized user content
**Location**: Components displaying user-generated content
**Solution**: Use proper sanitization
```typescript
// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Safe
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### 2. Authentication Errors

#### Token Validation Failures
```javascript
Error: Invalid or expired token
```
**Cause**: Token tampering or expiration
**Location**: API client or auth context
**Solution**: Implement proper token refresh
```typescript
// ✅ Token refresh logic
const refreshToken = async () => {
  try {
    const newToken = await auth0Client.getTokenSilently();
    sessionStorage.setItem('accessToken', newToken);
    return newToken;
  } catch (error) {
    // Redirect to login
    auth0Client.loginWithRedirect();
  }
};
```

## 🧪 Testing Errors

### 1. Jest Configuration Issues

#### Module Resolution Errors
```javascript
Error: Cannot find module 'src/components/Component'
```
**Cause**: Incorrect Jest module resolution
**Location**: `jest.config.js`
**Solution**: Configure proper module mapping
```javascript
// ✅ Jest config
module.exports = {
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(module-to-transform)/)'
  ]
};
```

### 2. React Testing Library Issues

#### Component Not Found in Tests
```javascript
Error: Unable to find an element with the text: "Expected Text"
```
**Cause**: Component not rendering or text not exact match
**Solution**: Use proper queries and wait for async operations
```typescript
// ✅ Wait for async elements
const element = await screen.findByText('Expected Text');

// ✅ Use more flexible matchers
const element = screen.getByText(/expected text/i);
```

## 🚀 Deployment Errors

### 1. Netlify Build Failures

#### Build Command Errors
```bash
Error: Build script returned non-zero exit code
```
**Cause**: Build script failure or missing dependencies
**Location**: `package.json` scripts
**Solution**: Check build logs and dependencies
```json
{
  "scripts": {
    "build": "vite build",
    "postbuild": "node scripts/copy-videos.js"
  }
}
```

#### Function Deployment Errors
```bash
Error: Function failed to deploy
```
**Cause**: Syntax errors or missing dependencies in functions
**Location**: `netlify/functions/`
**Solution**: Test functions locally first
```bash
# ✅ Test functions locally
netlify dev
```

## 📊 Performance Issues

### 1. Memory Leaks

#### Component Memory Leaks
**Symptom**: Browser tab memory usage keeps increasing
**Cause**: Event listeners not cleaned up or ref leaks
**Solution**: Proper cleanup in useEffect
```typescript
// ✅ Cleanup event listeners
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### 2. Rendering Performance

#### Excessive Re-renders
**Symptom**: UI feels sluggish or laggy
**Cause**: Unnecessary component re-renders
**Solution**: Use React.memo and useMemo appropriately
```typescript
// ✅ Memoize expensive calculations
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});
```

## 🔍 Debugging Tips

### 1. Browser Developer Tools

#### Console Errors
- Always check browser console for errors
- Use `console.trace()` to trace function calls
- Set breakpoints in Sources tab for debugging

#### Network Tab
- Check for failed API requests
- Verify request headers and response data
- Monitor payload sizes

### 2. React Developer Tools

#### Component State
- Inspect component props and state
- Check for unnecessary re-renders in Profiler
- Use Component hierarchy to understand data flow

### 3. Common Debugging Commands

```javascript
// ✅ Useful debugging utilities
console.group('Debug Group');
console.log('Variable:', variable);
console.table(arrayData);
console.time('Operation');
// ... operation
console.timeEnd('Operation');
console.groupEnd();
```

## 📝 Error Prevention Best Practices

### 1. Code Review Checklist
- [ ] Check TypeScript types are correct
- [ ] Verify error handling is present
- [ ] Ensure cleanup functions exist for useEffect
- [ ] Validate responsive design
- [ ] Test on different browsers/devices

### 2. Pre-deployment Testing
- [ ] Run full test suite: `npm test`
- [ ] Test production build: `npm run build && npm run preview`
- [ ] Check for TypeScript errors: `npx tsc --noEmit`
- [ ] Validate accessibility: Use axe-core browser extension

### 3. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor performance metrics
- [ ] Check user feedback regularly
- [ ] Review analytics for unusual patterns

---

*This document should be updated whenever new errors are discovered or resolved. Keep it as a reference for both current and future team members.*
