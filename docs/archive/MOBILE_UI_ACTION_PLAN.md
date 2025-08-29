# Astral Core - Mobile & UI Improvement Action Plan

*Priority Focus: Mobile Experience & UI Upgrades*
*Created: August 3, 2025*

## 🎯 Mission Statement
Transform Astral Core into a mobile-first, polished mental health platform with exceptional UI/UX that works flawlessly across all devices.

## 📱 Phase 1: Critical Mobile Fixes (Week 1)

### Day 1-2: Mobile Input & Keyboard Issues
**Priority: CRITICAL** - Users can't effectively use mobile chat

#### Tasks:
1. **Fix virtual keyboard behavior in chat**
   - File: `src/views/ChatView.tsx`
   - Issue: Keyboard pushes content up, breaking layout
   - Solution: Use `viewport-fit=cover` and proper CSS viewport units

2. **Fix mobile input focus issues**
   - Files: `src/components/AppInput.tsx`, `src/components/AppTextArea.tsx`
   - Issue: Inputs not properly focused on mobile
   - Solution: Add proper touch event handlers

3. **Fix chat input positioning**
   - File: `src/views/ChatView.tsx`
   - Issue: Input bar doesn't stick to bottom on mobile
   - Solution: Use `position: fixed` with safe area insets

#### Success Criteria:
- [ ] Chat input stays at bottom when keyboard opens
- [ ] Text inputs focus properly on first tap
- [ ] No layout jumping when keyboard appears
- [ ] Works on iOS Safari and Android Chrome

### Day 3-4: Mobile Navigation & Touch
**Priority: HIGH** - Core navigation must work on mobile

#### Tasks:
1. **Implement mobile sidebar menu**
   - File: `src/components/Sidebar.tsx`
   - Add hamburger menu icon
   - Slide-out overlay navigation
   - Touch gestures for opening/closing

2. **Fix touch target sizes**
   - All interactive elements minimum 44px
   - Review all buttons, links, form elements
   - Add proper touch spacing

3. **Add mobile-safe hover states**
   - Replace `:hover` with `:active` where appropriate
   - Remove hover-only interactions

#### Success Criteria:
- [ ] Sidebar navigation works smoothly on mobile
- [ ] All buttons are easily tappable
- [ ] No hover-dependent functionality
- [ ] Touch feedback is immediate and clear

### Day 5: Mobile Performance Optimization
**Priority: HIGH** - Site must load quickly on mobile

#### Tasks:
1. **Reduce bundle size for mobile**
   - Implement dynamic imports for heavy components
   - Code splitting by route
   - Lazy load images and videos

2. **Add loading skeletons**
   - Create skeleton components for major UI elements
   - PostCard skeleton, Chat skeleton, Profile skeleton

#### Success Criteria:
- [ ] Initial bundle < 500KB
- [ ] Loading skeletons prevent layout shift
- [ ] First Contentful Paint < 2 seconds on 3G

## 🎨 Phase 2: UI Polish & Consistency (Week 2)

### Day 1-2: Component Standardization

#### Tasks:
1. **Standardize loading states**
   - Create consistent LoadingSpinner component
   - Add loading states to all data-fetching components
   - Implement skeleton screens

2. **Fix responsive breakpoints**
   - Audit all CSS for mobile-first design
   - Fix layout issues on tablet and mobile
   - Test on various screen sizes

3. **Dark mode improvements**
   - Fix color contrast issues
   - Ensure WCAG 2.1 AA compliance
   - Test all components in dark mode

#### Success Criteria:
- [ ] All loading states are consistent
- [ ] Layout works on all screen sizes
- [ ] Dark mode has proper contrast ratios

### Day 3-4: Accessibility & Polish

#### Tasks:
1. **Accessibility improvements**
   - Add proper ARIA labels
   - Fix keyboard navigation
   - Add screen reader announcements

2. **Visual polish**
   - Consistent button styles
   - Smooth transitions
   - Micro-animations for feedback

#### Success Criteria:
- [ ] Passes WCAG 2.1 AA accessibility audit
- [ ] Smooth, polished user interactions
- [ ] Consistent visual design system

### Day 5: Testing & Bug Fixes

#### Tasks:
1. **Cross-device testing**
   - Test on real iOS and Android devices
   - Various screen sizes and orientations
   - Different browsers

2. **Performance testing**
   - Lighthouse audits
   - Real device performance testing
   - Network throttling tests

## 🔧 Phase 3: Advanced Mobile Features (Week 3)

### Mobile-Specific Enhancements

#### Tasks:
1. **Pull-to-refresh functionality**
   - Add to FeedView and other list views
   - Native mobile gesture support

2. **Swipe gestures**
   - Swipe to navigate between sections
   - Swipe actions on list items

3. **Mobile app features**
   - Add to home screen prompt
   - Push notification support
   - Offline functionality

#### Success Criteria:
- [ ] Native mobile gestures work smoothly
- [ ] App feels like native mobile app
- [ ] Works offline for basic functionality

## 📋 Implementation Checklist

### Before Starting
- [ ] Set up mobile testing environment
- [ ] Install browser dev tools for mobile debugging
- [ ] Set up device testing (iOS Safari, Android Chrome)
- [ ] Create mobile-specific test scenarios

### During Development
- [ ] Test every change on actual mobile devices
- [ ] Run Lighthouse audits regularly
- [ ] Check accessibility with screen reader
- [ ] Monitor bundle size changes

### Quality Gates
- [ ] Mobile Lighthouse score > 90
- [ ] Accessibility score > 95
- [ ] No critical mobile usability issues
- [ ] Works on iOS 14+ and Android 9+

## 🛠️ Technical Implementation Guide

### Mobile CSS Best Practices
```css
/* Mobile-first responsive design */
.component {
  /* Mobile styles (default) */
  padding: 1rem;
  font-size: 16px; /* Minimum for mobile inputs */
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
    padding: 2rem;
  }
}

/* Safe area insets for mobile */
.fixed-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Touch-friendly targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Mobile JavaScript Patterns
```typescript
// Touch event handling
const handleTouch = (e: React.TouchEvent) => {
  e.preventDefault();
  // Handle touch interaction
};

// Keyboard handling for mobile
const handleKeyboard = () => {
  if (window.visualViewport) {
    // Use Visual Viewport API for better keyboard handling
    window.visualViewport.addEventListener('resize', adjustLayout);
  }
};

// Mobile-specific feature detection
const isMobile = () => {
  return window.innerWidth <= 768 || 'ontouchstart' in window;
};
```

### Performance Optimization
```typescript
// Lazy loading for mobile
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Image optimization
const OptimizedImage = ({ src, alt }: ImageProps) => (
  <img 
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
  />
);

// Bundle splitting
const router = createBrowserRouter([
  {
    path: "/mobile-heavy-feature",
    lazy: () => import("./mobile-feature")
  }
]);
```

## 📊 Success Metrics

### Performance Targets
- **Mobile Lighthouse Score**: > 90
- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 500KB initial load

### User Experience Targets
- **Touch Target Success**: 100% of interactive elements ≥ 44px
- **Accessibility Score**: > 95
- **Mobile Navigation**: Works without horizontal scrolling
- **Keyboard Handling**: No layout breaks when virtual keyboard appears

### Cross-Platform Support
- **iOS Safari**: 14+ full support
- **Android Chrome**: 9+ full support
- **Screen Sizes**: 320px - 1920px width
- **Orientations**: Portrait and landscape

## 🚨 Risk Mitigation

### High-Risk Areas
1. **Chat functionality on mobile** - Critical for user safety
2. **Crisis detection on touch devices** - Must work reliably
3. **Authentication flow on mobile** - Helper access essential

### Testing Strategy
1. **Real device testing** - Not just browser dev tools
2. **Network throttling** - Test on slow connections
3. **Accessibility testing** - Screen reader and keyboard-only
4. **Crisis flow testing** - Ensure emergency features work on mobile

### Rollback Plan
1. **Feature flags** for mobile-specific changes
2. **Desktop-first fallback** if mobile optimization breaks
3. **Component-level rollback** for isolated issues

## 📱 Mobile-Specific Components to Create/Update

### New Components Needed
- `MobileNavigation.tsx` - Mobile-specific navigation
- `TouchGestureHandler.tsx` - Swipe and touch gestures
- `MobileKeyboardHandler.tsx` - Virtual keyboard management
- `SkeletonLoader.tsx` - Loading skeletons for mobile
- `PullToRefresh.tsx` - Native-feeling refresh

### Existing Components to Update
- `Sidebar.tsx` - Add mobile hamburger menu
- `ChatView.tsx` - Fix mobile keyboard issues
- `PostCard.tsx` - Optimize for touch
- `Modal.tsx` - Mobile-friendly dialogs
- `AppInput.tsx` - Mobile input handling

## 🎯 Weekly Goals

### Week 1: Mobile Functionality
- All critical mobile issues fixed
- Chat works perfectly on mobile
- Navigation is touch-friendly

### Week 2: UI Polish
- Consistent, professional appearance
- Dark mode perfected
- Accessibility compliant

### Week 3: Mobile Excellence
- Native app-like experience
- Advanced mobile features
- Performance optimized

**Success Definition**: Astral Core provides an exceptional mobile mental health support experience that rivals native apps while maintaining all safety and accessibility features.
