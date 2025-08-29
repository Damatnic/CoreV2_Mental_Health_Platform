# CoreV2 Mental Health Platform - Comprehensive UI/UX Style Guide

## 🎨 Design Philosophy

Our design system is built on therapeutic principles that prioritize mental wellness through visual design:

- **Calming**: Soft colors, smooth transitions, and gentle animations reduce anxiety
- **Accessible**: WCAG AAA compliant, ensuring usability for all users
- **Intuitive**: Natural information hierarchy guides users effortlessly
- **Responsive**: Beautiful experiences across all devices
- **Supportive**: Visual feedback that feels encouraging, never judgmental

---

## 🎭 Design System Overview

### Core Design Files
```
src/styles/
├── modern-therapeutic-design.css    # Main design system
├── enhanced-dark-mode.css          # Dark theme
├── wcag-aaa-compliance.css         # Accessibility
└── mobile-optimizations.css        # Mobile experience
```

### Enhanced Components
```
src/components/
├── EnhancedMoodTracker.tsx         # Interactive mood tracking
├── EnhancedLoadingStates.tsx       # Beautiful loading animations
└── src/views/
    └── EnhancedDashboardView.tsx   # Modern dashboard
```

---

## 🌈 Color Palette

### Primary Colors - Therapeutic Blues
```css
--therapy-primary-50: #e3f2fd;   /* Lightest sky */
--therapy-primary-100: #bbdefb;  /* Morning mist */
--therapy-primary-200: #90caf9;  /* Clear sky */
--therapy-primary-300: #64b5f6;  /* Bright day */
--therapy-primary-400: #42a5f5;  /* Ocean blue */
--therapy-primary-500: #2196f3;  /* Primary action */
--therapy-primary-600: #1e88e5;  /* Deep ocean */
--therapy-primary-700: #1976d2;  /* Evening sky */
--therapy-primary-800: #1565c0;  /* Night approach */
--therapy-primary-900: #0d47a1;  /* Deep night */
```

### Supportive Colors - Warm Lavender
```css
--therapy-secondary-50: #f3e5f5;   /* Lavender mist */
--therapy-secondary-500: #9c27b0;  /* Purple heart */
--therapy-secondary-900: #4a148c;  /* Deep purple */
```

### Wellness Green - Growth & Recovery
```css
--therapy-wellness-50: #e8f5e9;    /* Fresh mint */
--therapy-wellness-500: #4caf50;   /* Growing forest */
--therapy-wellness-900: #1b5e20;   /* Deep earth */
```

### Beautiful Gradients
```css
--gradient-calm: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-wellness: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--gradient-peaceful: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
--gradient-sunset: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
```

---

## 🎯 Typography System

### Font Stack
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-secondary: 'Poppins', 'Inter', sans-serif;
--font-mono: 'Fira Code', monospace;
```

### Fluid Typography Scale
```css
--text-xs: clamp(0.75rem, 1.5vw, 0.875rem);
--text-sm: clamp(0.875rem, 2vw, 1rem);
--text-base: clamp(1rem, 2.5vw, 1.125rem);
--text-lg: clamp(1.125rem, 3vw, 1.25rem);
--text-xl: clamp(1.25rem, 3.5vw, 1.5rem);
--text-2xl: clamp(1.5rem, 4vw, 1.875rem);
--text-3xl: clamp(1.875rem, 5vw, 2.25rem);
```

### Usage Guidelines
- **Headers**: Bold, clear hierarchy with generous spacing
- **Body Text**: Minimum 16px, 1.6 line height for readability
- **Links**: Always underlined, high contrast colors
- **Emphasis**: Use color and weight, avoid ALL CAPS

---

## 🪟 Glassmorphism Components

### Glass Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}
```

### Glass Button
```css
.glass-button {
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  /* Shimmer effect on hover */
}
```

---

## 🎭 Neumorphism Elements

### Neumorph Card
```css
.neumorph-card {
  background: linear-gradient(145deg, #f0f0f3, #cacaca);
  box-shadow: 5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff;
  border-radius: 20px;
}
```

### Neumorph Input
```css
.neumorph-input {
  background: #ecf0f3;
  box-shadow: inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff;
}
```

---

## ✨ Micro-Animations

### Available Animations
```css
.animate-breathe    /* Gentle scaling, 4s loop */
.animate-float      /* Floating motion, 6s loop */
.animate-glow       /* Pulsing glow effect */
.animate-gradient   /* Gradient color shift */
.ripple-button      /* Ripple on click */
```

### Usage Examples
```jsx
// Breathing button for crisis support
<button className="crisis-button animate-breathe">
  Get Help Now
</button>

// Floating wellness card
<div className="wellness-card animate-float">
  Your Wellness Score
</div>

// Glowing mood selection
<div className="mood-option selected animate-glow">
  😊 Happy
</div>
```

---

## 🌙 Dark Mode Design

### Dark Theme Colors
```css
[data-theme="dark"] {
  --dark-bg-primary: #0a0e27;     /* Deep space */
  --dark-bg-secondary: #0f1429;   /* Midnight */
  --dark-text-primary: #e8eaf0;   /* Moon white */
  --dark-text-secondary: #b8bcc8; /* Star silver */
}
```

### Special Effects
- **Starfield Background**: Subtle animated stars
- **Aurora Effect**: Gentle color waves
- **Glow Effects**: Soft blue/purple glows on interaction

---

## 📱 Mobile-First Responsive Design

### Breakpoints
```css
/* Mobile: 0-768px */
@media (max-width: 768px)

/* Tablet: 769px-1024px */
@media (min-width: 769px) and (max-width: 1024px)

/* Desktop: 1025px+ */
@media (min-width: 1025px)
```

### Touch Targets
- Minimum 48x48px for all interactive elements
- 8px minimum spacing between targets
- Larger tap areas on mobile (touch-friendly zones)

---

## ♿ Accessibility Features

### WCAG AAA Compliance
- **Contrast Ratios**: 7:1 for normal text, 4.5:1 for large text
- **Focus Indicators**: 3px solid outline with 2px offset
- **Skip Links**: Hidden navigation aids for screen readers
- **ARIA Labels**: Comprehensive labeling for all interactive elements

### Keyboard Navigation
```css
*:focus-visible {
  outline: 3px solid var(--wcag-focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.5);
}
```

### Screen Reader Support
```html
<!-- Live regions for dynamic content -->
<div role="status" aria-live="polite">
  Mood successfully tracked
</div>

<!-- Descriptive labels -->
<button aria-label="Open crisis support chat">
  <svg>...</svg>
</button>
```

---

## 🎨 Component Patterns

### Dashboard Card
```jsx
<div className="therapy-card animate-slideIn">
  <div className="flex items-start gap-4">
    <div className="w-14 h-14 rounded-2xl gradient-background">
      <Icon />
    </div>
    <div className="flex-1">
      <h3>Card Title</h3>
      <p>Description text</p>
    </div>
  </div>
</div>
```

### Mood Selector
```jsx
<div className="mood-selector">
  {moods.map(mood => (
    <button className="mood-option" key={mood.id}>
      <span className="text-4xl">{mood.emoji}</span>
      <span className="text-sm">{mood.label}</span>
    </button>
  ))}
</div>
```

### Loading States
```jsx
// Therapeutic spinner
<TherapeuticSpinner size="large" />

// Pulsing dots
<PulsingDots color="purple" />

// Breathing loader
<BreathingLoader text="Take a deep breath..." />

// Skeleton card
<SkeletonCard showAvatar={true} />
```

---

## 🚨 Crisis Interface Guidelines

### Crisis Button Design
- High contrast but not alarming
- Breathing animation to encourage calm
- Always visible and easily accessible
- Warm, supportive language

```css
.crisis-button {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  animation: breathe 3s ease-in-out infinite;
  box-shadow: 0 4px 20px rgba(244, 67, 54, 0.3);
}
```

### Crisis Indicators
- Non-alarming colors (soft reds, not harsh)
- Gentle pulsing, not flashing
- Clear but calming messaging

---

## 🎯 Best Practices

### Do's ✅
- Use smooth, gentle transitions (300ms standard)
- Implement progressive disclosure for complex forms
- Provide immediate, positive feedback
- Use color to guide, not overwhelm
- Test with real users, especially those with disabilities

### Don'ts ❌
- Avoid sudden movements or jarring animations
- Don't use pure black/white (use off-blacks/whites)
- Never use flashing or strobing effects
- Avoid overwhelming users with too many options
- Don't rely solely on color to convey information

---

## 🔧 Implementation Examples

### Creating a New Component
```jsx
import '../styles/modern-therapeutic-design.css';

const WellnessCard = ({ title, value, trend }) => (
  <div className="glass-card wellness-stat-card animate-slideIn">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-3xl font-bold">{value}</p>
    <div className="wellness-progress">
      <div className="wellness-progress-bar" style={{ width: `${value}%` }} />
    </div>
  </div>
);
```

### Applying Dark Mode
```jsx
// Automatic theme detection
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

// Manual toggle
const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
};
```

---

## 📊 Performance Considerations

### CSS Optimization
- Use CSS custom properties for theming
- Implement critical CSS for above-the-fold content
- Lazy load animation styles for below-fold elements
- Use `will-change` sparingly for animated elements

### Animation Performance
```css
/* GPU-accelerated properties only */
.smooth-animation {
  transform: translateY(0);
  opacity: 1;
  will-change: transform, opacity;
}
```

---

## 🚀 Future Enhancements

### Planned Features
1. **Adaptive Themes**: Mood-based color adjustments
2. **Biometric Integration**: Calm animations synced with breathing
3. **AI-Powered Personalization**: Learn user preferences
4. **Advanced Haptics**: Touch feedback for mobile
5. **Voice UI Integration**: Audio feedback and commands

### Experimental Features
- 3D glassmorphism effects
- Particle animations for celebrations
- Dynamic theme generation based on user mood
- Augmented reality wellness visualizations

---

## 📚 Resources

### Design Tools
- **Figma Components**: [Coming Soon]
- **Storybook**: [Coming Soon]
- **Color Palette Generator**: Use our custom palette tool
- **Animation Previewer**: Test animations before implementing

### Testing Tools
- **WAVE**: Web accessibility evaluation
- **Axe DevTools**: Accessibility testing
- **Lighthouse**: Performance and accessibility audit
- **NVDA/JAWS**: Screen reader testing

### Documentation
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)

---

## 🤝 Contributing to the Design System

### How to Contribute
1. Review existing patterns before creating new ones
2. Ensure all new components meet WCAG AAA standards
3. Test across devices and assistive technologies
4. Document usage patterns and accessibility notes
5. Submit designs for review by the accessibility team

### Design Review Checklist
- [ ] Color contrast meets WCAG AAA (7:1 ratio)
- [ ] Touch targets are minimum 48x48px
- [ ] Focus indicators are clearly visible
- [ ] Animations respect prefers-reduced-motion
- [ ] Dark mode version is implemented
- [ ] Mobile experience is optimized
- [ ] Loading states are defined
- [ ] Error states are user-friendly
- [ ] Success feedback is encouraging

---

## 📞 Support

For questions about the design system:
- **Design Team**: design@astralcore.app
- **Accessibility**: a11y@astralcore.app
- **Developer Support**: dev@astralcore.app

---

*Last Updated: December 2024*
*Version: 2.0.0*