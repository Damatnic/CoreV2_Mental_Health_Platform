import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Phone, MessageSquare, Shield, Heart, Clock, MapPin, Users, Check, X, Pause, Play } from 'lucide-react';

interface CrisisAlert {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  type: 'self_harm' | 'suicide' | 'panic_attack' | 'substance_abuse' | 'domestic_violence' | 'general';
  triggers: string[];
  detectedAt: Date;
  source: 'text_analysis' | 'user_reported' | 'behavior_pattern' | 'emergency_button';
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  context: {
    recentMessages: string[];
    moodHistory: number[];
    previousAlerts: number;
    supportNetwork: string[];
  };
  status: 'active' | 'responding' | 'escalated' | 'resolved';
  responseTime?: number;
  assignedHelper?: string;
}

interface SafetyResource {
  id: string;
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'local_service' | 'emergency';
  contact: string;
  description: string;
  availability: '24/7' | 'business_hours' | 'limited';
  specialties: string[];
  language: string[];
  isVerified: boolean;
  responseTime: string;
  location?: string;
}

interface SafetyPlan {
  id: string;
  userId: string;
  personalWarnings: string[];
  copingStrategies: string[];
  safeEnvironment: string[];
  supportContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    priority: number;
  }>;
  professionalContacts: Array<{
    name: string;
    type: 'therapist' | 'psychiatrist' | 'counselor' | 'doctor';
    phone: string;
    available: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    instructions: string;
    importance: 'critical' | 'important' | 'supportive';
  }>;
  emergencyActions: string[];
  customInstructions: string;
  lastUpdated: Date;
  isActive: boolean;
}

interface CrisisSafetySystemProps {
  userId: string;
  currentCrisisLevel?: 'safe' | 'concerned' | 'high_risk' | 'immediate_danger';
  enableAutoDetection?: boolean;
  enableGeolocation?: boolean;
  onCrisisDetected?: (alert: CrisisAlert) => void;
  onSafetyPlanActivated?: (plan: SafetyPlan) => void;
  className?: string;
}

const EMERGENCY_RESOURCES: SafetyResource[] = [
  {
    id: 'suicide-lifeline',
    name: '988 Suicide & Crisis Lifeline',
    type: 'hotline',
    contact: '988',
    description: 'Free, confidential support 24/7 for people in distress',
    availability: '24/7',
    specialties: ['suicide prevention', 'crisis intervention'],
    language: ['English', 'Spanish'],
    isVerified: true,
    responseTime: 'Immediate'
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    type: 'text',
    contact: '741741',
    description: 'Text HOME to 741741 for crisis support',
    availability: '24/7',
    specialties: ['crisis support', 'emotional support'],
    language: ['English'],
    isVerified: true,
    responseTime: '< 5 minutes'
  },
  {
    id: 'emergency-services',
    name: 'Emergency Services',
    type: 'emergency',
    contact: '911',
    description: 'For immediate life-threatening emergencies',
    availability: '24/7',
    specialties: ['emergency response', 'medical emergency'],
    language: ['English', 'Spanish'],
    isVerified: true,
    responseTime: 'Immediate'
  },
  {
    id: 'domestic-violence',
    name: 'National Domestic Violence Hotline',
    type: 'hotline',
    contact: '1-800-799-7233',
    description: 'Support for domestic violence situations',
    availability: '24/7',
    specialties: ['domestic violence', 'safety planning'],
    language: ['English', 'Spanish'],
    isVerified: true,
    responseTime: 'Immediate'
  }
];

export const CrisisSafetySystem: React.FC<CrisisSafetySystemProps> = ({
  userId,
  currentCrisisLevel = 'safe',
  enableAutoDetection = true,
  enableGeolocation = true,
  onCrisisDetected,
  onSafetyPlanActivated,
  className = ''
}) => {
  const [activeCrisis, setActiveCrisis] = useState<CrisisAlert | null>(null);
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan | null>(null);
  const [isMonitoringActive, setIsMonitoringActive] = useState(enableAutoDetection);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [responseTeamConnected, setResponseTeamConnected] = useState(false);
  const [emergencyContactsAlerted, setEmergencyContactsAlerted] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'degraded'>('online');

  const monitoringIntervalRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const alertTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize safety system
  useEffect(() => {
    initializeSafetySystem();
    
    if (enableGeolocation) {
      getCurrentLocation();
    }

    startHeartbeat();

    return () => {
      cleanup();
    };
  }, [userId, enableGeolocation]);

  // Monitor crisis level changes
  useEffect(() => {
    if (currentCrisisLevel === 'immediate_danger') {
      triggerEmergencyProtocol();
    } else if (currentCrisisLevel === 'high_risk') {
      activateSafetyPlan();
    }
  }, [currentCrisisLevel]);

  const initializeSafetySystem = async () => {
    try {
      // Load safety plan
      const planResponse = await fetch(`/api/safety/plans/${userId}`);
      if (planResponse.ok) {
        const plan = await planResponse.json();
        setSafetyPlan(plan);
      }

      // Check for active alerts
      const alertsResponse = await fetch(`/api/crisis/alerts/${userId}/active`);
      if (alertsResponse.ok) {
        const alerts = await alertsResponse.json();
        if (alerts.length > 0) {
          setActiveCrisis(alerts[0]);
        }
      }

      // Start monitoring if enabled
      if (isMonitoringActive) {
        startCrisisMonitoring();
      }

      setSystemStatus('online');
    } catch (error) {
      console.error('Failed to initialize safety system:', error);
      setSystemStatus('degraded');
    }
  };

  const startCrisisMonitoring = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }

    monitoringIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/crisis/monitor/${userId}`);
        if (response.ok) {
          const monitoringData = await response.json();
          
          if (monitoringData.alertTriggered) {
            const newAlert: CrisisAlert = {
              ...monitoringData.alert,
              detectedAt: new Date(),
              status: 'active'
            };
            
            handleCrisisDetection(newAlert);
          }
        }
      } catch (error) {
        console.error('Crisis monitoring error:', error);
        setSystemStatus('degraded');
      }
    }, 30000); // Check every 30 seconds
  };

  const handleCrisisDetection = async (alert: CrisisAlert) => {
    setActiveCrisis(alert);
    onCrisisDetected?.(alert);

    // Immediate actions based on alert level
    switch (alert.level) {
      case 'critical':
        await triggerEmergencyProtocol();
        break;
      case 'high':
        await activateSafetyPlan();
        await notifyResponseTeam();
        break;
      case 'medium':
        await activateSafetyPlan();
        break;
      case 'low':
        await showSupportResources();
        break;
    }

    // Set auto-resolution timeout for lower severity alerts
    if (alert.level === 'low' || alert.level === 'medium') {
      alertTimeoutRef.current = setTimeout(() => {
        if (activeCrisis?.id === alert.id) {
          resolveAlert(alert.id, 'auto_timeout');
        }
      }, 3600000); // 1 hour
    }
  };

  const triggerEmergencyProtocol = async () => {
    try {
      // Alert emergency services if configured
      if (safetyPlan?.emergencyActions.includes('auto_911')) {
        await alertEmergencyServices();
      }

      // Notify emergency contacts immediately
      await notifyEmergencyContacts();
      
      // Connect to crisis response team
      await connectToResponseTeam();

      // Share location if available and permitted
      if (location && enableGeolocation) {
        await shareLocationWithResponders();
      }

      // Log emergency protocol activation
      await logEmergencyEvent('emergency_protocol_activated');

    } catch (error) {
      console.error('Emergency protocol error:', error);
    }
  };

  const activateSafetyPlan = async () => {
    if (!safetyPlan) {
      // Create emergency safety plan
      await createEmergencySafetyPlan();
      return;
    }

    setSafetyPlan(prev => prev ? { ...prev, isActive: true } : null);
    onSafetyPlanActivated?.(safetyPlan);

    // Execute safety plan steps
    await executeSafetyPlanSteps();

    // Log activation
    await logEmergencyEvent('safety_plan_activated');
  };

  const executeSafetyPlanSteps = async () => {
    if (!safetyPlan) return;

    // Step 1: Environment safety
    if (safetyPlan.safeEnvironment.length > 0) {
      // Prompt user to implement environmental safety measures
    }

    // Step 2: Contact support network
    for (const contact of safetyPlan.supportContacts.slice(0, 3)) {
      try {
        await notifyContact(contact);
      } catch (error) {
        console.error(`Failed to notify ${contact.name}:`, error);
      }
    }

    // Step 3: Engage coping strategies
    // Present coping strategies to user

    // Step 4: Professional help if needed
    if (currentCrisisLevel === 'high_risk' || currentCrisisLevel === 'immediate_danger') {
      const primaryProfessional = safetyPlan.professionalContacts[0];
      if (primaryProfessional) {
        await notifyProfessional(primaryProfessional);
      }
    }
  };

  const notifyEmergencyContacts = async () => {
    if (!safetyPlan?.supportContacts) return;

    const emergencyContacts = safetyPlan.supportContacts
      .filter(contact => contact.priority <= 2)
      .slice(0, 3);

    const promises = emergencyContacts.map(contact => 
      notifyContact(contact, true) // Emergency notification
    );

    await Promise.allSettled(promises);
    setEmergencyContactsAlerted(true);
  };

  const notifyContact = async (contact: SafetyPlan['supportContacts'][0], isEmergency = false) => {
    try {
      const response = await fetch('/api/crisis/notify-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contactId: contact.name,
          phone: contact.phone,
          message: isEmergency 
            ? `EMERGENCY: ${contact.name} needs immediate support. Crisis detected in mental health app.`
            : `${contact.name} has activated their safety plan and may need support.`,
          isEmergency
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to notify ${contact.name}`);
      }
    } catch (error) {
      console.error(`Contact notification failed for ${contact.name}:`, error);
    }
  };

  const connectToResponseTeam = async () => {
    try {
      const response = await fetch('/api/crisis/connect-response-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          alertId: activeCrisis?.id,
          urgency: 'immediate'
        })
      });

      if (response.ok) {
        setResponseTeamConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect to response team:', error);
    }
  };

  const alertEmergencyServices = async () => {
    // In a real implementation, this would integrate with emergency services APIs
    console.warn('Emergency services would be contacted automatically');
    
    await logEmergencyEvent('emergency_services_contacted');
  };

  const shareLocationWithResponders = async () => {
    if (!location) return;

    try {
      await fetch('/api/crisis/share-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          alertId: activeCrisis?.id,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp
          }
        })
      });
    } catch (error) {
      console.error('Failed to share location:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => setLocation(position),
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const createEmergencySafetyPlan = async () => {
    const emergencyPlan: SafetyPlan = {
      id: `emergency-${Date.now()}`,
      userId,
      personalWarnings: ['Feeling overwhelmed', 'Having dark thoughts'],
      copingStrategies: ['Deep breathing', 'Call someone', 'Go to safe place'],
      safeEnvironment: ['Remove harmful items', 'Stay in public area'],
      supportContacts: [],
      professionalContacts: [],
      medications: [],
      emergencyActions: ['Call 988', 'Go to emergency room'],
      customInstructions: 'This is an emergency safety plan created during crisis.',
      lastUpdated: new Date(),
      isActive: true
    };

    setSafetyPlan(emergencyPlan);
    onSafetyPlanActivated?.(emergencyPlan);
  };

  const resolveAlert = async (alertId: string, resolution: string) => {
    try {
      await fetch(`/api/crisis/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, userId })
      });

      if (activeCrisis?.id === alertId) {
        setActiveCrisis(null);
        setResponseTeamConnected(false);
        setEmergencyContactsAlerted(false);
      }

      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const logEmergencyEvent = async (eventType: string) => {
    try {
      await fetch('/api/crisis/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventType,
          timestamp: new Date().toISOString(),
          alertId: activeCrisis?.id,
          location: location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          } : null
        })
      });
    } catch (error) {
      console.error('Failed to log emergency event:', error);
    }
  };

  const startHeartbeat = () => {
    heartbeatIntervalRef.current = setInterval(() => {
      setLastHeartbeat(new Date());
      
      // Send heartbeat to server
      fetch('/api/crisis/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, timestamp: Date.now() })
      }).catch(error => {
        console.error('Heartbeat failed:', error);
        setSystemStatus('offline');
      });
    }, 60000); // Every minute
  };

  const cleanup = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
  };

  const handleEmergencyButtonPress = () => {
    const emergencyAlert: CrisisAlert = {
      id: `emergency-${Date.now()}`,
      level: 'critical',
      type: 'general',
      triggers: ['emergency_button'],
      detectedAt: new Date(),
      source: 'emergency_button',
      userId,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      } : undefined,
      context: {
        recentMessages: [],
        moodHistory: [],
        previousAlerts: 0,
        supportNetwork: safetyPlan?.supportContacts.map(c => c.name) || []
      },
      status: 'active'
    };

    handleCrisisDetection(emergencyAlert);
  };

  const showSupportResources = async () => {
    // This would trigger a modal or overlay showing support resources
    console.log('Showing support resources to user');
  };

  const notifyProfessional = async (professional: SafetyPlan['professionalContacts'][0]) => {
    try {
      await fetch('/api/crisis/notify-professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          professionalId: professional.name,
          phone: professional.phone,
          type: professional.type,
          urgency: currentCrisisLevel
        })
      });
    } catch (error) {
      console.error(`Failed to notify professional ${professional.name}:`, error);
    }
  };

  const getStatusColor = () => {
    switch (currentCrisisLevel) {
      case 'immediate_danger': return 'bg-red-600 text-white';
      case 'high_risk': return 'bg-orange-500 text-white';
      case 'concerned': return 'bg-yellow-500 text-black';
      case 'safe': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = () => {
    switch (currentCrisisLevel) {
      case 'immediate_danger': return <AlertTriangle className="w-5 h-5" />;
      case 'high_risk': return <AlertTriangle className="w-5 h-5" />;
      case 'concerned': return <Clock className="w-5 h-5" />;
      case 'safe': return <Shield className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  return (
    <div className={`crisis-safety-system ${className}`}>
      {/* System Status Header */}
      <div className={`flex items-center justify-between p-4 rounded-lg mb-4 ${getStatusColor()}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="font-semibold">
              Safety System {systemStatus === 'online' ? 'Active' : 'Degraded'}
            </div>
            <div className="text-sm opacity-90 capitalize">
              Status: {currentCrisisLevel.replace('_', ' ')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isMonitoringActive ? (
            <div className="flex items-center gap-1 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Monitoring
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              Paused
            </div>
          )}
          
          <button
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            aria-label={isMonitoringActive ? 'Pause monitoring' : 'Resume monitoring'}
          >
            {isMonitoringActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active Crisis Alert */}
      {activeCrisis && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">
                  Crisis Alert Active
                </h3>
                <p className="text-red-700 text-sm">
                  Level: {activeCrisis.level.toUpperCase()} | 
                  Type: {activeCrisis.type.replace('_', ' ')} |
                  Source: {activeCrisis.source.replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => resolveAlert(activeCrisis.id, 'user_resolved')}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              aria-label="Resolve alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {responseTeamConnected && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                <Users className="w-3 h-3" />
                Response team connected
              </div>
            )}
            {emergencyContactsAlerted && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                <Check className="w-3 h-3" />
                Contacts notified
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                <MapPin className="w-3 h-3" />
                Location available
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => window.open('tel:988')}
              className="flex items-center gap-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call 988
            </button>
            
            <button
              onClick={() => window.open('sms:741741?body=HOME')}
              className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Text Crisis Line
            </button>
            
            {safetyPlan && (
              <button
                onClick={() => activateSafetyPlan()}
                className="flex items-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Safety Plan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Emergency Button */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Emergency Support</h3>
        
        <button
          onClick={handleEmergencyButtonPress}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          <AlertTriangle className="w-6 h-6" />
          I Need Help Now
        </button>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press this button if you need immediate crisis support
        </p>
      </div>

      {/* Quick Access Resources */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Access</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMERGENCY_RESOURCES.slice(0, 4).map((resource) => (
            <button
              key={resource.id}
              onClick={() => {
                if (resource.type === 'hotline' || resource.type === 'emergency') {
                  window.open(`tel:${resource.contact.replace(/\D/g, '')}`);
                } else if (resource.type === 'text') {
                  window.open(`sms:${resource.contact}?body=HOME`);
                }
              }}
              className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                {resource.type === 'hotline' ? <Phone className="w-4 h-4 text-blue-600" /> :
                 resource.type === 'text' ? <MessageSquare className="w-4 h-4 text-blue-600" /> :
                 <AlertTriangle className="w-4 h-4 text-red-600" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  {resource.name}
                </div>
                <div className="text-xs text-gray-500">
                  {resource.contact} • {resource.availability}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="mt-4 text-center text-xs text-gray-500">
        Last heartbeat: {lastHeartbeat.toLocaleTimeString()} • 
        System: {systemStatus} • 
        Monitoring: {isMonitoringActive ? 'Active' : 'Paused'}
      </div>
    </div>
  );
};

export default CrisisSafetySystem;
