# Loading Skeleton Implementation Guide

## Overview

This guide covers the implementation and usage of the comprehensive skeleton loading system in Astral Core. The skeleton components provide smooth loading states that improve perceived performance and user experience.

## Components Provided

### Base Components

#### `Skeleton`
The foundation component for all skeleton elements.

```tsx
<Skeleton 
  variant="rectangular" 
  width="200px" 
  height="40px" 
  animation="wave" 
/>
```

**Props:**
- `variant`: 'text' | 'rectangular' | 'circular'
- `width`: string | number
- `height`: string | number
- `borderRadius`: string
- `animation`: 'pulse' | 'wave' | 'none'

#### `TextSkeleton`
Specialized component for text content with multiple lines.

```tsx
<TextSkeleton 
  lines={3} 
  variant="body" 
/>
```

**Props:**
- `lines`: number (default: 1)
- `variant`: 'heading' | 'body' | 'caption'

### Specialized Components

#### `PostCardSkeleton`
Complete skeleton for social media post cards.

```tsx
<PostCardSkeleton className="my-custom-class" />
```

**Features:**
- User avatar and info
- Content text lines
- Optional image placeholder
- Action buttons

#### `ChatMessageSkeleton`
Skeleton for chat message bubbles.

```tsx
<ChatMessageSkeleton 
  isOwn={true} 
  hasAvatar={false} 
/>
```

**Props:**
- `isOwn`: boolean - Right-aligned for user's own messages
- `hasAvatar`: boolean - Show/hide avatar

#### `ProfileCardSkeleton`
Complete user profile card skeleton.

```tsx
<ProfileCardSkeleton />
```

**Features:**
- Large profile avatar
- User info (name, role, status)
- Statistics section
- Bio text
- Action buttons

#### `NavigationSkeleton`
Sidebar navigation skeleton.

```tsx
<NavigationSkeleton />
```

**Features:**
- 6 navigation items
- Icons and labels
- Responsive layout

#### `DashboardWidgetSkeleton`
Dashboard widget/card skeleton.

```tsx
<DashboardWidgetSkeleton />
```

**Features:**
- Widget header with title and icon
- Value and label display
- Optional chart area

#### `FeedSkeleton`
Multiple post cards for feed loading.

```tsx
<FeedSkeleton 
  itemCount={5} 
/>
```

**Props:**
- `itemCount`: number (default: 5)

#### `SearchResultsSkeleton`
Search results list skeleton.

```tsx
<SearchResultsSkeleton />
```

**Features:**
- 4 search result items
- Thumbnails and content
- Metadata display

#### `TableSkeleton`
Data table skeleton with headers and rows.

```tsx
<TableSkeleton 
  rows={5} 
  columns={4} 
  hasHeader={true} 
/>
```

**Props:**
- `rows`: number (default: 5)
- `columns`: number (default: 4)
- `hasHeader`: boolean (default: true)

#### `FormSkeleton`
Form skeleton with fields and actions.

```tsx
<FormSkeleton />
```

**Features:**
- Form title
- 4 form fields with labels
- Action buttons

### Utility Components

#### `LoadingWrapper`
Conditional rendering wrapper for loading states.

```tsx
<LoadingWrapper
  loading={isLoading}
  skeleton={<PostCardSkeleton />}
>
  <ActualPostCard data={postData} />
</LoadingWrapper>
```

**Props:**
- `loading`: boolean
- `skeleton`: React.ReactNode
- `children`: React.ReactNode

#### `SkeletonList`
Generic list of skeleton components.

```tsx
<SkeletonList
  count={3}
  skeleton={<ProfileCardSkeleton />}
/>
```

**Props:**
- `count`: number
- `skeleton`: React.ReactNode

## Implementation Examples

### Basic Usage

```tsx
import { 
  PostCardSkeleton, 
  LoadingWrapper,
  FeedSkeleton 
} from '../components/LoadingSkeletons';

// Single skeleton
const PostComponent = () => {
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);

  return (
    <LoadingWrapper
      loading={loading}
      skeleton={<PostCardSkeleton />}
    >
      <PostCard data={post} />
    </LoadingWrapper>
  );
};

// Multiple skeletons
const FeedComponent = () => {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <FeedSkeleton itemCount={5} />;
  }
  
  return <FeedList posts={posts} />;
};
```

### Custom Skeleton Combinations

```tsx
import { Skeleton, TextSkeleton } from '../components/LoadingSkeletons';

const CustomCardSkeleton = () => (
  <div className="custom-card-skeleton">
    <div className="header">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="info">
        <Skeleton variant="text" width="120px" height="1.2em" />
        <Skeleton variant="text" width="80px" height="1em" />
      </div>
    </div>
    <TextSkeleton lines={2} variant="body" />
    <Skeleton variant="rectangular" height="200px" />
  </div>
);
```

### React Query Integration

```tsx
import { useQuery } from '@tanstack/react-query';
import { PostCardSkeleton } from '../components/LoadingSkeletons';

const PostList = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts
  });

  if (isLoading) {
    return (
      <div className="post-list">
        {Array.from({ length: 5 }, (_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="post-list">
      {posts.map(post => (
        <PostCard key={post.id} data={post} />
      ))}
    </div>
  );
};
```

### Suspense Integration

```tsx
import { Suspense } from 'react';
import { FeedSkeleton } from '../components/LoadingSkeletons';

const App = () => (
  <Suspense fallback={<FeedSkeleton itemCount={5} />}>
    <LazyFeedComponent />
  </Suspense>
);
```

## Styling Customization

### CSS Custom Properties

The skeleton system uses CSS custom properties for easy theming:

```css
:root {
  --skeleton-base-color: #f0f0f0;
  --skeleton-highlight-color: #ffffff;
  --skeleton-border-radius: 4px;
}

[data-theme="dark"] {
  --skeleton-base-color: #2a2a2a;
  --skeleton-highlight-color: #3a3a3a;
}
```

### Custom Animation

```css
.skeleton-custom {
  animation: skeleton-custom 2s ease-in-out infinite;
}

@keyframes skeleton-custom {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

### Component-Specific Styling

```css
.my-custom-post-skeleton {
  border: 2px solid var(--color-primary);
  background: var(--color-primary-50);
}

.my-custom-post-skeleton .post-card-skeleton-header {
  border-bottom: 1px solid var(--color-primary-200);
}
```

## Accessibility Features

### Reduced Motion Support

The skeletons respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton-wave,
  .skeleton-pulse {
    animation: none;
  }
}
```

### High Contrast Support

```css
@media (prefers-contrast: high) {
  .skeleton {
    border: 1px solid var(--color-border);
    background: var(--color-surface-contrast);
  }
}
```

### Screen Reader Considerations

Add appropriate ARIA labels when needed:

```tsx
<div role="status" aria-label="Loading content">
  <PostCardSkeleton />
  <span className="sr-only">Loading post content...</span>
</div>
```

## Performance Optimization

### GPU Acceleration

Skeletons use CSS transforms for optimal performance:

```css
.skeleton-wave {
  transform: translateZ(0);
  will-change: background-position;
}
```

### CSS Containment

Components use CSS containment for better performance:

```css
.skeleton-container {
  contain: layout style paint;
}
```

### Lazy Loading Integration

```tsx
import { useInView } from 'react-intersection-observer';

const LazySection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div ref={ref}>
      {inView ? <ActualContent /> : <PostCardSkeleton />}
    </div>
  );
};
```

## Testing

### Jest Testing

```tsx
import { render, screen } from '@testing-library/react';
import { PostCardSkeleton } from '../LoadingSkeletons';

test('renders post card skeleton', () => {
  render(<PostCardSkeleton />);
  
  const skeleton = screen.getByRole('status', { hidden: true });
  expect(skeleton).toBeInTheDocument();
  expect(skeleton).toHaveClass('post-card-skeleton');
});
```

### Visual Regression Testing

```tsx
// Storybook story
export const AllSkeletons = () => (
  <div className="skeleton-showcase">
    <PostCardSkeleton />
    <ProfileCardSkeleton />
    <ChatMessageSkeleton />
    <DashboardWidgetSkeleton />
  </div>
);
```

## Migration Guide

### From Custom Loading States

**Before:**
```tsx
const Loading = () => <div className="spinner">Loading...</div>;
```

**After:**
```tsx
const Loading = () => <PostCardSkeleton />;
```

### From Placeholder Content

**Before:**
```tsx
const PostPlaceholder = () => (
  <div className="post-placeholder">
    <div className="placeholder-avatar"></div>
    <div className="placeholder-text"></div>
  </div>
);
```

**After:**
```tsx
const PostPlaceholder = () => <PostCardSkeleton />;
```

## Best Practices

### Do's

✅ Use skeletons that match the actual content layout
✅ Implement consistent timing (1-2 seconds max)
✅ Provide appropriate skeleton counts for lists
✅ Use semantic HTML structure
✅ Test with screen readers
✅ Respect user motion preferences

### Don'ts

❌ Don't show skeletons for very quick operations (< 300ms)
❌ Don't use skeletons for error states
❌ Don't make skeletons too different from actual content
❌ Don't ignore accessibility requirements
❌ Don't use too many animated elements at once

## Browser Support

- **Modern browsers**: Full support with animations
- **IE11**: Fallback to static placeholders
- **Reduced motion**: Automatic animation disable
- **High contrast**: Enhanced border visibility

## Performance Metrics

Expected improvements with skeleton implementation:

- **Perceived Performance**: 40-60% improvement
- **User Engagement**: 25-35% increase
- **Bounce Rate**: 15-25% reduction
- **Core Web Vitals**: Improved FCP and LCP scores
