/**
 * useTeletherapy Hook
 * Comprehensive state management for teletherapy features
 * Handles sessions, appointments, and therapist data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  teletherapyService,
  TherapistProfile,
  Appointment,
  SessionConfig,
  SessionMetrics,
  AvailabilitySlot
} from '../services/teletherapy/teletherapyService';

// Types
interface TeletherapyState {
  // Session state
  isInSession: boolean;
  currentSession: Appointment | null;
  sessionMetrics: SessionMetrics | null;
  sessionConfig: SessionConfig;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  
  // Media state
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isWhiteboardActive: boolean;
  
  // Appointment state
  appointments: Appointment[];
  upcomingAppointment: Appointment | null;
  
  // Therapist state
  therapists: TherapistProfile[];
  selectedTherapist: TherapistProfile | null;
  therapistAvailability: AvailabilitySlot[];
  
  // UI state
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
  error: string | null;
  loading: boolean;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: 'local' | 'remote';
  timestamp: string;
}

interface UseTeletherapyReturn extends TeletherapyState {
  // Session methods
  startSession: (appointmentId: string) => Promise<void>;
  endSession: () => Promise<void>;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleRecording: (consent: boolean) => Promise<void>;
  toggleWhiteboard: () => void;
  
  // Chat methods
  sendMessage: (message: string) => void;
  chatMessages: ChatMessage[];
  
  // Whiteboard methods
  sendWhiteboardData: (data: any) => void;
  whiteboardData: any[];
  
  // Appointment methods
  scheduleAppointment: (
    therapistId: string,
    scheduledTime: Date,
    duration?: number
  ) => Promise<Appointment>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  rescheduleAppointment: (
    appointmentId: string,
    newTime: Date
  ) => Promise<void>;
  
  // Therapist methods
  loadTherapists: (filters?: {
    specialization?: string;
    availability?: Date;
  }) => Promise<void>;
  selectTherapist: (therapist: TherapistProfile) => void;
  loadTherapistAvailability: (
    therapistId: string,
    startDate: Date,
    endDate: Date
  ) => Promise<void>;
  
  // Session notes
  saveSessionNotes: (notes: string) => Promise<void>;
  
  // Insurance
  processInsurance: (insuranceInfo: {
    provider: string;
    policyNumber: string;
    authorizationNumber?: string;
  }) => Promise<void>;
}

/**
 * Custom hook for teletherapy functionality
 */
export const useTeletherapy = (patientId: string): UseTeletherapyReturn => {
  // State initialization
  const [state, setState] = useState<TeletherapyState>({
    // Session state
    isInSession: false,
    currentSession: null,
    sessionMetrics: null,
    sessionConfig: {
      enableVideo: true,
      enableAudio: true,
      enableScreenShare: false,
      enableRecording: false,
      enableWhiteboard: false,
      virtualBackground: undefined,
      maxParticipants: 2,
      sessionTimeout: 60
    },
    localStream: null,
    remoteStream: null,
    
    // Media state
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    isRecording: false,
    isWhiteboardActive: false,
    
    // Appointment state
    appointments: [],
    upcomingAppointment: null,
    
    // Therapist state
    therapists: [],
    selectedTherapist: null,
    therapistAvailability: [],
    
    // UI state
    connectionStatus: 'disconnected',
    error: null,
    loading: false
  });

  // Additional state for chat and whiteboard
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [whiteboardData, setWhiteboardData] = useState<any[]>([]);
  
  // Refs for cleanup
  const cleanupRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize teletherapy service listeners
   */
  useEffect(() => {
    const setupListeners = () => {
      // Session events
      teletherapyService.on('sessionInitialized', handleSessionInitialized);
      teletherapyService.on('sessionEnded', handleSessionEnded);
      teletherapyService.on('sessionError', handleSessionError);
      
      // Stream events
      teletherapyService.on('localStreamReady', handleLocalStream);
      teletherapyService.on('remoteStreamReady', handleRemoteStream);
      
      // Connection events
      teletherapyService.on('connectionStateChange', handleConnectionStateChange);
      teletherapyService.on('metricsUpdate', handleMetricsUpdate);
      teletherapyService.on('reconnected', handleReconnected);
      teletherapyService.on('reconnectionFailed', handleReconnectionFailed);
      
      // Communication events
      teletherapyService.on('chatMessageReceived', handleChatMessageReceived);
      teletherapyService.on('whiteboardDataReceived', handleWhiteboardDataReceived);
      
      // Recording events
      teletherapyService.on('recordingStarted', handleRecordingStarted);
      teletherapyService.on('recordingStopped', handleRecordingStopped);
      teletherapyService.on('recordingSaved', handleRecordingSaved);
      
      // Appointment events
      teletherapyService.on('appointmentScheduled', handleAppointmentScheduled);
      teletherapyService.on('appointmentModified', handleAppointmentModified);
      teletherapyService.on('reminderNotification', handleReminderNotification);
    };

    setupListeners();
    loadUserAppointments();

    // Cleanup function
    cleanupRef.current = () => {
      teletherapyService.removeAllListeners();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [patientId]);

  /**
   * Load user appointments on mount
   */
  const loadUserAppointments = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch(`/api/appointments/user/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const appointments = await response.json();
        
        // Find upcoming appointment
        const now = new Date();
        const upcoming = appointments
          .filter((apt: Appointment) => new Date(apt.scheduledTime) > now)
          .sort((a: Appointment, b: Appointment) => 
            new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
          )[0];
        
        setState(prev => ({
          ...prev,
          appointments,
          upcomingAppointment: upcoming || null,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load appointments',
        loading: false
      }));
    }
  };

  /**
   * Event handlers
   */
  const handleSessionInitialized = (appointment: Appointment) => {
    setState(prev => ({
      ...prev,
      isInSession: true,
      currentSession: appointment,
      connectionStatus: 'connecting'
    }));
  };

  const handleSessionEnded = () => {
    setState(prev => ({
      ...prev,
      isInSession: false,
      currentSession: null,
      sessionMetrics: null,
      connectionStatus: 'disconnected',
      localStream: null,
      remoteStream: null,
      isScreenSharing: false,
      isRecording: false,
      isWhiteboardActive: false
    }));
    
    // Clear chat and whiteboard data
    setChatMessages([]);
    setWhiteboardData([]);
  };

  const handleSessionError = (error: any) => {
    setState(prev => ({
      ...prev,
      error: error.message || 'Session error occurred'
    }));
  };

  const handleLocalStream = (stream: MediaStream) => {
    setState(prev => ({
      ...prev,
      localStream: stream
    }));
  };

  const handleRemoteStream = (stream: MediaStream) => {
    setState(prev => ({
      ...prev,
      remoteStream: stream
    }));
  };

  const handleConnectionStateChange = (state: string) => {
    let status: TeletherapyState['connectionStatus'] = 'disconnected';
    
    switch (state) {
      case 'new':
      case 'checking':
      case 'connecting':
        status = 'connecting';
        break;
      case 'connected':
      case 'completed':
        status = 'connected';
        break;
      case 'failed':
        status = 'failed';
        break;
      case 'disconnected':
      case 'closed':
        status = 'disconnected';
        break;
    }
    
    setState(prev => ({
      ...prev,
      connectionStatus: status
    }));
  };

  const handleMetricsUpdate = (metrics: SessionMetrics) => {
    setState(prev => ({
      ...prev,
      sessionMetrics: metrics
    }));
  };

  const handleReconnected = () => {
    setState(prev => ({
      ...prev,
      connectionStatus: 'connected',
      error: null
    }));
  };

  const handleReconnectionFailed = () => {
    setState(prev => ({
      ...prev,
      connectionStatus: 'failed',
      error: 'Failed to reconnect. Please check your connection.'
    }));
  };

  const handleChatMessageReceived = (message: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message.message,
      sender: 'remote',
      timestamp: message.timestamp
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleWhiteboardDataReceived = (data: any) => {
    setWhiteboardData(prev => [...prev, data]);
  };

  const handleRecordingStarted = () => {
    setState(prev => ({
      ...prev,
      isRecording: true
    }));
  };

  const handleRecordingStopped = () => {
    setState(prev => ({
      ...prev,
      isRecording: false
    }));
  };

  const handleRecordingSaved = (url: string) => {
    // Could show a notification or update session with recording URL
    console.log('Recording saved:', url);
  };

  const handleAppointmentScheduled = (appointment: Appointment) => {
    setState(prev => ({
      ...prev,
      appointments: [...prev.appointments, appointment]
    }));
  };

  const handleAppointmentModified = (appointment: Appointment) => {
    setState(prev => ({
      ...prev,
      appointments: prev.appointments.map(apt => 
        apt.id === appointment.id ? appointment : apt
      )
    }));
  };

  const handleReminderNotification = (data: any) => {
    // Show reminder notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Appointment Reminder', {
        body: `You have an appointment in ${data.reminderText}`,
        icon: '/icon-192x192.png'
      });
    }
  };

  /**
   * Public methods
   */
  const startSession = async (appointmentId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await teletherapyService.initializeSession(appointmentId, state.sessionConfig);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to start session'
      }));
      throw error;
    }
  };

  const endSession = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await teletherapyService.endSession();
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to end session'
      }));
      throw error;
    }
  };

  const toggleVideo = useCallback(() => {
    const newState = !state.isVideoEnabled;
    
    if (state.localStream) {
      state.localStream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }
    
    setState(prev => ({
      ...prev,
      isVideoEnabled: newState,
      sessionConfig: {
        ...prev.sessionConfig,
        enableVideo: newState
      }
    }));
  }, [state.isVideoEnabled, state.localStream]);

  const toggleAudio = useCallback(() => {
    const newState = !state.isAudioEnabled;
    
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
    }
    
    setState(prev => ({
      ...prev,
      isAudioEnabled: newState,
      sessionConfig: {
        ...prev.sessionConfig,
        enableAudio: newState
      }
    }));
  }, [state.isAudioEnabled, state.localStream]);

  const toggleScreenShare = async () => {
    try {
      const newState = !state.isScreenSharing;
      await teletherapyService.toggleScreenShare(newState);
      setState(prev => ({
        ...prev,
        isScreenSharing: newState,
        sessionConfig: {
          ...prev.sessionConfig,
          enableScreenShare: newState
        }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to toggle screen share'
      }));
      throw error;
    }
  };

  const toggleRecording = async (consent: boolean) => {
    try {
      await teletherapyService.toggleRecording(consent);
      // State update handled by event listeners
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to toggle recording'
      }));
      throw error;
    }
  };

  const toggleWhiteboard = () => {
    setState(prev => ({
      ...prev,
      isWhiteboardActive: !prev.isWhiteboardActive,
      sessionConfig: {
        ...prev.sessionConfig,
        enableWhiteboard: !prev.isWhiteboardActive
      }
    }));
  };

  const sendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      message,
      sender: 'local',
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    teletherapyService.sendChatMessage(message);
  };

  const sendWhiteboardData = (data: any) => {
    setWhiteboardData(prev => [...prev, data]);
    teletherapyService.sendWhiteboardData(data);
  };

  const scheduleAppointment = async (
    therapistId: string,
    scheduledTime: Date,
    duration: number = 50
  ): Promise<Appointment> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const appointment = await teletherapyService.scheduleAppointment(
        therapistId,
        patientId,
        scheduledTime,
        duration
      );
      setState(prev => ({ ...prev, loading: false }));
      return appointment;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to schedule appointment'
      }));
      throw error;
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await teletherapyService.modifyAppointment(appointmentId, 'cancel');
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to cancel appointment'
      }));
      throw error;
    }
  };

  const rescheduleAppointment = async (
    appointmentId: string,
    newTime: Date
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await teletherapyService.modifyAppointment(
        appointmentId,
        'reschedule',
        newTime
      );
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to reschedule appointment'
      }));
      throw error;
    }
  };

  const loadTherapists = async (filters?: {
    specialization?: string;
    availability?: Date;
  }) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // In production, this would include filters in the API call
      const response = await fetch('/api/therapists', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const therapists = await response.json();
        setState(prev => ({
          ...prev,
          therapists,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to load therapists:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load therapists',
        loading: false
      }));
    }
  };

  const selectTherapist = (therapist: TherapistProfile) => {
    setState(prev => ({
      ...prev,
      selectedTherapist: therapist
    }));
  };

  const loadTherapistAvailability = async (
    therapistId: string,
    startDate: Date,
    endDate: Date
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const availability = await teletherapyService.getTherapistAvailability(
        therapistId,
        startDate,
        endDate
      );
      
      setState(prev => ({
        ...prev,
        therapistAvailability: availability,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load availability',
        loading: false
      }));
    }
  };

  const saveSessionNotes = async (notes: string) => {
    if (!state.currentSession) {
      throw new Error('No active session');
    }
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await teletherapyService.saveSessionNotes(
        state.currentSession.id,
        notes
      );
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to save session notes'
      }));
      throw error;
    }
  };

  const processInsurance = async (insuranceInfo: {
    provider: string;
    policyNumber: string;
    authorizationNumber?: string;
  }) => {
    if (!state.currentSession) {
      throw new Error('No active session');
    }
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await teletherapyService.processInsuranceClaim(
        state.currentSession.id,
        insuranceInfo
      );
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to process insurance'
      }));
      throw error;
    }
  };

  return {
    ...state,
    
    // Session methods
    startSession,
    endSession,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    toggleRecording,
    toggleWhiteboard,
    
    // Chat methods
    sendMessage,
    chatMessages,
    
    // Whiteboard methods
    sendWhiteboardData,
    whiteboardData,
    
    // Appointment methods
    scheduleAppointment,
    cancelAppointment,
    rescheduleAppointment,
    
    // Therapist methods
    loadTherapists,
    selectTherapist,
    loadTherapistAvailability,
    
    // Session notes
    saveSessionNotes,
    
    // Insurance
    processInsurance
  };
};

export default useTeletherapy;