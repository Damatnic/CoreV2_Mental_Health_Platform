# CoreV2 Mental Health Platform - Remaining Errors Fixing Plan

## Current Status
- **Starting Error Count**: 3,858
- **Current Error Count**: 1,944
- **Errors Eliminated**: 1,914 (49.7% reduction)
- **Progress**: Phase 1 (Unused Declarations) - COMPLETED ✅

## Error Type Breakdown (Top 10)
1. **TS2339: 657 errors** - Property does not exist on type
2. **TS2322: 472 errors** - Type assignment issues  
3. **TS2345: 200 errors** - Argument type mismatches
4. **TS2307: 97 errors** - Cannot find module
5. **TS2304: 49 errors** - Cannot find name
6. **TS2724: 46 errors** - Module has no exported member
7. **TS2305: 33 errors** - Module has no default export
8. **TS2614: 33 errors** - Module has no named export
9. **TS2353: 32 errors** - Object literal may only specify known properties
10. **TS18046: 31 errors** - This type is not assignable to type

## Phase 2: Property Existence Errors (TS2339) - 657 errors

### High-Priority Files (Most TS2339 errors)
1. **`src/components/LazyComponent.tsx`** - 15+ errors
   - Property '_payload' does not exist on type 'never'
   - Need to fix lazy component type definitions

2. **`src/components/LazyComponentRegistry.tsx`** - 12+ errors
   - Property 'fallback' does not exist on type 'JSX.IntrinsicElements'
   - Need to fix component registry types

3. **`src/components/MobileViewportProvider.tsx`** - 10+ errors
   - Property 'webkitOverflowScrolling' does not exist on type 'CSSStyleDeclaration'
   - Need to add CSS vendor prefix types

4. **`src/components/MoodThemeAdapter.tsx`** - 8+ errors
   - Properties 'currentMood', 'moodHistory' missing from WellnessState
   - Need to update wellness state interface

5. **`src/components/MoodTracker.tsx`** - 8+ errors
   - Missing crisis detection properties
   - Need to align with CulturalCrisisDetectionState interface

6. **`src/components/NotificationPreferences.tsx`** - 8+ errors
   - Missing PushNotificationService methods
   - Need to update service interface

7. **`src/components/OfflineCapabilities.tsx`** - 6+ errors
   - Missing OfflineContextValue properties
   - Need to update offline context interface

### Fix Strategy for TS2339
1. **Interface Alignment**: Update component interfaces to match actual implementations
2. **Service Method Addition**: Add missing methods to service interfaces
3. **Type Definition Updates**: Fix type definitions for external libraries
4. **Property Access Safety**: Use optional chaining and type guards

## Phase 3: Type Assignment Issues (TS2322) - 472 errors

### Common Patterns
1. **Button Size Mismatches**: `size="small"` vs `size="sm"`
2. **Component Prop Type Mismatches**: Interface vs implementation differences
3. **State Type Inconsistencies**: useState vs interface definitions
4. **Event Handler Type Mismatches**: React event types

### Fix Strategy for TS2322
1. **Standardize Component Props**: Align all component interfaces
2. **Fix Button Size Props**: Standardize on consistent size values
3. **Update State Types**: Ensure useState matches interface definitions
4. **Event Handler Types**: Fix React event handler type annotations

## Phase 4: Argument Type Mismatches (TS2345) - 200 errors

### Common Issues
1. **Function Parameter Order**: Wrong parameter sequence
2. **Type Union Mismatches**: String literal vs union type
3. **Interface Property Mismatches**: Missing or extra properties
4. **Generic Type Constraints**: Incorrect generic type usage

### Fix Strategy for TS2345
1. **Parameter Order Fixes**: Correct function call parameter sequences
2. **Type Union Alignment**: Ensure argument types match expected unions
3. **Interface Compliance**: Make objects conform to expected interfaces
4. **Generic Type Fixes**: Correct generic type constraints

## Phase 5: Module Resolution Issues (TS2307, TS2724, TS2305, TS2614) - 175 errors

### Common Issues
1. **Missing Module Exports**: Components not properly exported
2. **Import Path Errors**: Incorrect relative paths
3. **Default vs Named Exports**: Mismatched export/import patterns
4. **Missing Type Definitions**: No @types packages

### Fix Strategy for Module Issues
1. **Export Verification**: Ensure all components are properly exported
2. **Import Path Correction**: Fix relative import paths
3. **Export Pattern Alignment**: Match default vs named exports
4. **Type Definition Installation**: Add missing @types packages

## Phase 6: Object Property Issues (TS2353) - 32 errors

### Common Issues
1. **Unknown Properties**: Properties not in interface
2. **Excess Property Checks**: Extra properties in object literals
3. **Interface Mismatches**: Object doesn't match expected interface

### Fix Strategy for TS2353
1. **Interface Updates**: Add missing properties to interfaces
2. **Property Removal**: Remove unknown properties
3. **Type Assertions**: Use type assertions when appropriate

## Phase 7: Type Assignment Issues (TS18046) - 31 errors

### Common Issues
1. **Generic Type Constraints**: Incorrect generic type usage
2. **Interface Compatibility**: Types not assignable to interfaces
3. **Union Type Issues**: Type not in union

### Fix Strategy for TS18046
1. **Generic Type Fixes**: Correct generic type constraints
2. **Interface Updates**: Ensure type compatibility
3. **Union Type Alignment**: Fix union type membership

## Implementation Priority

### Week 1: TS2339 Errors (High Impact)
- Focus on component interface alignment
- Fix service method interfaces
- Update type definitions

### Week 2: TS2322 Errors (Medium Impact)
- Standardize component props
- Fix button size inconsistencies
- Update state type definitions

### Week 3: TS2345 Errors (Medium Impact)
- Fix function parameter orders
- Correct type union mismatches
- Update interface compliance

### Week 4: Module Issues (Low Impact)
- Fix export/import patterns
- Correct import paths
- Add missing type definitions

### Week 5: Remaining Issues (Low Impact)
- Fix object property issues
- Resolve type assignment problems
- Final cleanup and testing

## Success Metrics
- **Target**: Reduce errors to <500 by end of Week 5
- **Weekly Goal**: Eliminate 300+ errors per week
- **Quality Check**: Ensure no new errors introduced during fixes

## Risk Mitigation
1. **Incremental Fixes**: Fix one error type at a time
2. **Testing**: Run TypeScript compilation after each major fix
3. **Backup**: Keep working versions before major changes
4. **Documentation**: Document all interface changes

## Next Steps
1. **Start with Phase 2**: Focus on TS2339 property existence errors
2. **File-by-File Approach**: Fix one file completely before moving to next
3. **Regular Progress Checks**: Monitor error count reduction
4. **Interface Alignment**: Ensure all components use consistent interfaces

This systematic approach should eliminate the remaining 1,944 errors efficiently while maintaining code quality and preventing regression.

