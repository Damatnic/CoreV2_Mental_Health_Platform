# Mobile Testing Checklist

## Device Testing

### iPhone (Safari)
- [ ] Site loads
- [ ] Menu toggle visible
- [ ] Menu opens/closes
- [ ] Navigation works
- [ ] Forms work
- [ ] Keyboard doesn't break layout
- [ ] Viewport scaling correct

### Android (Chrome)
- [ ] Site loads
- [ ] Menu toggle visible
- [ ] Menu opens/closes
- [ ] Navigation works
- [ ] Forms work
- [ ] Keyboard doesn't break layout
- [ ] Viewport scaling correct

### iPad/Tablet
- [ ] Layout adapts correctly
- [ ] Sidebar shows/hides appropriately
- [ ] Touch targets work
- [ ] Orientation change handled

## Feature Testing

### Navigation
- [x] Mobile menu toggle button added
- [x] Sidebar slides in/out
- [x] Overlay appears when menu open
- [x] Click overlay closes menu
- [ ] Swipe gestures work
- [ ] Back button behavior correct

### Forms & Input
- [ ] Text inputs work
- [ ] Textareas resize properly
- [ ] Dropdowns accessible
- [ ] Date pickers work
- [ ] Submit buttons reachable
- [ ] Validation messages visible

### Touch Optimization
- [x] Buttons minimum 44x44px
- [x] Links have adequate spacing
- [ ] Swipe navigation works
- [ ] Pull to refresh (if implemented)
- [ ] Long press menus work
- [ ] Double tap zoom disabled where appropriate

### Performance
- [ ] Page loads < 3s on 3G
- [ ] Smooth scrolling
- [ ] No janky animations
- [ ] Images optimized
- [ ] Lazy loading works
- [ ] Offline mode works

### Accessibility
- [ ] Screen reader announces properly
- [ ] Focus management correct
- [ ] Color contrast adequate
- [ ] Text readable without zoom
- [ ] Orientation lock respected
- [ ] Motion reduced option works

## Responsive Breakpoints

### 320px - Small phones
- [ ] Content fits
- [ ] Text readable
- [ ] Buttons reachable

### 375px - iPhone
- [x] Layout optimized
- [x] Menu works
- [ ] Forms fit

### 414px - Large phones
- [x] Content spacing good
- [ ] Images scale properly
- [ ] Grid layouts adapt

### 768px - Tablets
- [x] Sidebar behavior changes
- [x] Grid becomes multi-column
- [ ] Touch targets still work

### 1024px - Large tablets/small laptops
- [x] Desktop-like experience
- [x] Sidebar always visible
- [x] No mobile menu needed

## Critical User Flows

### First Visit
- [ ] Landing page loads fast
- [ ] Call-to-action visible
- [ ] Can navigate without login
- [ ] Crisis resources accessible

### Mood Tracking
- [ ] Can open mood form
- [ ] Can select mood
- [ ] Can add notes
- [ ] Can submit
- [ ] Confirmation shows

### Crisis Situation
- [ ] Crisis banner visible
- [ ] Emergency contacts accessible
- [ ] Resources load offline
- [ ] Phone numbers clickable
- [ ] Quick exit works

### Daily Use
- [ ] Dashboard loads
- [ ] Navigation smooth
- [ ] Data saves properly
- [ ] Notifications work
- [ ] Logout accessible

## PWA Features

### Installation
- [ ] Install prompt appears
- [ ] App installs correctly
- [ ] Icon appears on home screen
- [ ] Launches in standalone mode
- [ ] Splash screen shows

### Offline
- [ ] Service worker active
- [ ] Offline page shows
- [ ] Cached resources work
- [ ] Crisis resources available
- [ ] Data syncs when online

### Updates
- [ ] Update prompt shows
- [ ] Updates install correctly
- [ ] No data loss
- [ ] Version displayed
- [ ] Rollback possible

## Known Issues

### To Fix:
1. Mobile menu toggle visibility
2. Swipe gestures not implemented
3. Service worker not registered
4. PWA manifest not configured
5. Offline mode incomplete

### Fixed:
1. ✅ Sidebar width issue
2. ✅ White background problem
3. ✅ Responsive layout
4. ✅ Mobile menu toggle added
5. ✅ Production build working

## Test Commands

```bash
# Test on local network
npx vite --host

# Test production build
npm run build
npx vite preview

# Test with throttling
# Open Chrome DevTools > Network > Slow 3G

# Test offline
# Open Chrome DevTools > Network > Offline
```

## Browser Support

### Required:
- Chrome 90+ ✅
- Safari 14+ ✅
- Firefox 88+ ✅
- Edge 90+ ✅

### Nice to have:
- Samsung Internet
- Opera Mobile
- UC Browser

## Emulation Tools

1. Chrome DevTools Device Mode
2. Firefox Responsive Design Mode
3. Safari Responsive Design Mode
4. BrowserStack (if available)
5. Physical devices (best)

---

**Last Tested:** Not yet fully tested
**Next Test:** After auth implementation