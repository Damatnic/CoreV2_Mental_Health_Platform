# Enhanced Crisis Detection Integration

## Overview

The Enhanced Crisis Detection system has been successfully integrated into the main AI service (`optimizedAIService.ts`), providing comprehensive crisis keyword detection with contextual understanding, emotional pattern recognition, and risk assessment scoring.

## Implementation Details

### Service Integration

The enhanced crisis detection is now the default method for crisis analysis in the AI service:

- **Primary Method**: Enhanced Crisis Keyword Detection Service
- **Fallback Method**: Basic sentiment analysis with crisis keywords
- **Default Behavior**: Always attempts enhanced detection first for maximum safety

### Features Implemented

1. **Contextual Crisis Analysis**
   - Semantic understanding of crisis phrases
   - Context-aware keyword matching
   - Emotional pattern recognition

2. **Risk Assessment Scoring**
   - Immediate risk scoring (0-100)
   - Short-term and long-term risk assessment
   - Confidence scoring for accuracy

3. **Intervention Recommendations**
   - Automatic escalation triggers
   - Emergency services notifications when needed
   - Intervention urgency levels

4. **Enhanced Detection Capabilities**
   - Multi-layered validation to reduce false positives
   - Temporal urgency detection
   - Linguistic pattern analysis for indirect expressions
   - Suicide ideation detection with severity grading

### API Response Format

Enhanced detection returns comprehensive data:

```typescript
{
  score: number,                    // Immediate risk score (0-100)
  comparative: number,              // Confidence score (0-1)
  isCrisis: boolean,               // Primary crisis indicator
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'emergency',
  riskAssessment: {
    immediateRisk: number,
    shortTermRisk: number,
    longTermRisk: number,
    interventionUrgency: 'none' | 'low' | 'medium' | 'high' | 'immediate',
    confidenceScore: number,
    riskFactors: string[],
    protectiveFactors: string[]
  },
  keywordMatches: Array<CrisisKeywordMatch>,
  interventionRecommendations: Array<InterventionRecommendation>,
  escalationRequired: boolean,
  emergencyServicesRequired: boolean,
  enhanced: true
}
```

### Fallback Behavior

If enhanced detection fails, the system gracefully falls back to basic detection:

```typescript
{
  score: number,                    // Basic sentiment score
  comparative: number,              // Basic comparative score
  isCrisis: boolean,               // Basic crisis detection
  severity: 'low',                 // Default severity
  enhanced: false,                 // Indicates fallback mode
  error?: string                   // Error message if available
}
```

## Usage

### Getting Crisis Detection Service

```typescript
import { aiServiceManager } from './services/optimizedAIService';

// Get enhanced crisis detection (default)
const crisisService = await aiServiceManager.getCrisisDetectionService();

// Force basic detection for testing
const basicService = await aiServiceManager.getCrisisDetectionService(false);
```

### Analyzing Text for Crisis Indicators

```typescript
const result = await crisisService.analyze(userText);

if (result.isCrisis) {
  if (result.enhanced && result.escalationRequired) {
    // Handle crisis escalation
    await handleCrisisEscalation(result);
  }
  
  if (result.emergencyServicesRequired) {
    // Immediate emergency response
    await contactEmergencyServices(result);
  }
}
```

## Performance Optimizations

1. **Lazy Loading**: Enhanced detection is loaded on-demand
2. **Caching**: Results are cached for 1 hour to improve performance
3. **Progressive Enhancement**: Automatically uses best available method
4. **Preloading**: Critical services are preloaded during idle time

## Testing

Comprehensive test coverage includes:
- Enhanced detection functionality
- Fallback mechanism validation
- Crisis keyword detection accuracy
- False positive prevention
- Integration with AI service manager

Run tests:
```bash
npm test tests/integration/enhancedCrisisDetectionIntegration.test.ts
```

## Safety Considerations

1. **Always Enhanced First**: System prioritizes enhanced detection for safety
2. **Graceful Degradation**: Falls back to basic detection if enhanced fails
3. **Multiple Validation Layers**: Reduces false positives while maintaining sensitivity
4. **Immediate Escalation**: Critical cases trigger immediate intervention protocols

## Configuration

The enhanced crisis detection service can be configured through:
- Crisis keyword thresholds
- Risk assessment weights
- Intervention trigger levels
- Cache duration settings

## Future Enhancements

1. **Machine Learning Integration**: Add ML-based pattern recognition
2. **Cultural Context**: Enhance cultural sensitivity in detection
3. **Real-time Monitoring**: Add continuous monitoring capabilities
4. **Advanced Analytics**: Implement trend analysis and prediction

## Monitoring

Monitor the service through:
- Error logs for fallback events
- Performance metrics for response times
- Accuracy metrics for detection quality
- Usage analytics for optimization
