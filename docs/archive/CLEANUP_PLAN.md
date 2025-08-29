# CoreV2 Cleanup Plan - Files to Remove
*Generated: 2025-08-12*

## 🗑️ FILES TO DELETE

### 1. Temporary/Lock Files
- [ ] `~$TLIFY_NEON_SETUP.md` - Temporary Word file
- [ ] `nul` - Accidental null file

### 2. Duplicate Service Worker Files
*Keep only one implementation, recommend keeping sw-enhanced.js*
- [ ] `src/sw-custom.js` - Duplicate
- [ ] `src/service-worker/sw-template.js` - Template file
- [ ] `public/sw-template.js` - Duplicate template
- [ ] `public/service-worker.js` - Old version
- [ ] `public/sw.js` - Duplicate
- [ ] `workbox-simple.js` - Unused config

### 3. Disabled/Backup Files
- [ ] `src/services/enhancedAiCrisisDetectionService.ts.disabled`
- [ ] `src/services/enhancedServiceWorkerRegistration.ts.disabled`
- [ ] `src/services/serviceWorkerManager.ts.disabled`
- [ ] `src/components/LazyComponents.original.tsx`
- [ ] `src/components/LazyComponents.safe.tsx`
- [ ] `src/components/icons.original.tsx`
- [ ] `src/components/icons.optimized.tsx`

### 4. Redundant Documentation
*Keep essential docs, archive or remove outdated ones*
- [ ] `CODE_REVIEW_EXECUTION_PLAN.md` - Completed
- [ ] `CODE_REVIEW_FINAL.md` - Completed
- [ ] `COMPLETED_FIXES_AND_FEATURES.md` - Historical
- [ ] `ENHANCEMENTS_COMPLETED.md` - Historical
- [ ] `FINAL_ENHANCEMENTS_SUMMARY.md` - Historical
- [ ] `FIXES_AND_FEATURES_COMPLETED.md` - Duplicate
- [ ] `PERFORMANCE_OPTIMIZATION_COMPLETE.md` - Historical
- [ ] `SERVICE_WORKER_TESTING_COMPLETE.md` - Historical
- [ ] `SERVICE_WORKER_VALIDATION_COMPLETE.md` - Historical
- [ ] `SITE_RESTORATION_PLAN.md` - Old plan
- [ ] `COMPLETE_PROJECT_SUMMARY.md` - Outdated
- [ ] `PROJECT_COMPLETION_SUMMARY.md` - Duplicate

### 5. Test/Development Files
- [ ] `server-simple.js` - If not needed
- [ ] `server-http.js` - If not needed
- [ ] `jest-env-setup.js` - Check if used

### 6. Redundant CSS Files
*Review and consolidate these styles*
- [ ] `src/styles/sidebar-fix.css`
- [ ] `src/styles/sidebar-gap-fix.css`
- [ ] `src/styles/sidebar-text-fix.css`
- [ ] `src/styles/global-alignment-fix.css`
- [ ] `src/styles/visibility-fixes.css`
- [ ] `src/styles/layout-fixes.css`
- [ ] `src/styles/critical-fixes.css`

### 7. Old Configuration Files
- [ ] `webpack.optimization.config.js` - Using Vite now
- [ ] `workbox-config.js` - If not using Workbox
- [ ] `ecosystem.config.js` - If not using PM2

### 8. Coverage Reports (Optional)
*Can regenerate these*
- [ ] `coverage/` directory contents

## ✅ FILES TO KEEP

### Essential Documentation
- `README.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `ARCHITECTURE.md`
- `DEPLOYMENT.md`
- `ENVIRONMENT_VARIABLES.md`
- `DEVELOPER_GUIDE.md`
- `ERROR_TRACKER.md` (New)
- `FIX_TODO_PHASES.md` (New)

### Configuration Files
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `netlify.toml`
- `jest.config.js`
- `playwright.config.ts`

### Environment Files
- `development.env`
- `production.env`
- `staging.env`

### Build/Deploy Scripts
- `deploy.sh`
- `deploy.bat`
- `start-server.bat`

## 📊 CLEANUP IMPACT

### Before Cleanup
- Total Files: ~500+
- Documentation Files: 64
- Duplicate/Disabled: ~20
- Test Coverage: Included

### After Cleanup
- Estimated Files: ~450
- Documentation Files: ~20 (essential only)
- No duplicates
- Cleaner structure

## 🎯 CLEANUP STRATEGY

### Step 1: Backup
```bash
# Create backup before cleanup
tar -czf backup-before-cleanup-$(date +%Y%m%d).tar.gz .
```

### Step 2: Remove Temporary Files
```bash
rm "~$TLIFY_NEON_SETUP.md"
rm nul
```

### Step 3: Clean Service Workers
```bash
# Keep only the enhanced version
rm src/sw-custom.js
rm src/service-worker/sw-template.js
rm public/sw-template.js
rm public/service-worker.js
rm public/sw.js
rm workbox-simple.js
```

### Step 4: Remove Disabled Files
```bash
rm src/services/*.disabled
rm src/components/*.original.tsx
rm src/components/*.safe.tsx
```

### Step 5: Archive Old Documentation
```bash
mkdir docs/archive
mv *COMPLETED*.md docs/archive/
mv *COMPLETE*.md docs/archive/
mv *FINAL*.md docs/archive/
```

### Step 6: Consolidate CSS
```bash
# Review and merge CSS fixes into main files
# Then remove redundant files
```

## ⚠️ WARNINGS

1. **Test First**: Run tests after each cleanup phase
2. **Git Commit**: Commit before major deletions
3. **Verify Imports**: Check that no active code imports deleted files
4. **Documentation**: Update README if removing documented features
5. **Dependencies**: Don't delete files referenced in package.json scripts

## 📝 CLEANUP CHECKLIST

- [ ] Create full backup
- [ ] Review each file category
- [ ] Check for active imports
- [ ] Delete files in phases
- [ ] Run tests after each phase
- [ ] Update documentation
- [ ] Commit changes
- [ ] Test build process
- [ ] Verify deployment

## 🎬 CLEANUP COMMANDS

```bash
# Quick cleanup of obvious files
rm "~$TLIFY_NEON_SETUP.md" nul

# Archive old docs
mkdir -p docs/archive
mv *COMPLETED*.md *COMPLETE*.md *FINAL*.md docs/archive/ 2>/dev/null

# Remove disabled files
find . -name "*.disabled" -delete
find . -name "*.original.*" -delete
find . -name "*.safe.*" -delete

# Clean node_modules and reinstall
rm -rf node_modules
npm ci
```

## 📊 EXPECTED RESULTS

- **Cleaner Structure**: Easier navigation
- **Reduced Confusion**: No duplicate implementations
- **Better Performance**: Smaller repository
- **Maintainability**: Clear file purposes
- **Documentation**: Only current, relevant docs

---
*Execute cleanup carefully, testing after each phase to ensure nothing breaks.*