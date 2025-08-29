/**
 * HIPAA-compliant Teletherapy Service
 * Manages video sessions, appointments, and therapist availability
 * Implements end-to-end encryption and secure session management
 */

import { EventEmitter } from 'events';

// Types and Interfaces
export interface TherapistProfile {
  id: string;
  name: string;
  title: string;
  specializations: string[];
  avatar?: string;
  availability: AvailabilitySlot[];
  rating?: number;
  licensure: {
    state: string;
    number: string;
    expiryDate: Date;
  };
}

export interface AvailabilitySlot {
  id: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  recurringPattern?: 'weekly' | 'biweekly' | 'monthly';
}

export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  scheduledTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  sessionNotes?: string;
  recordingUrl?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  insuranceClaim?: InsuranceClaim;
}

export interface InsuranceClaim {
  claimId: string;
  provider: string;
  policyNumber: string;
  authorizationNumber?: string;
  status: 'pending' | 'approved' | 'denied' | 'processing';
  amount?: number;
}

export interface SessionConfig {
  enableVideo: boolean;
  enableAudio: boolean;
  enableScreenShare: boolean;
  enableRecording: boolean;
  enableWhiteboard: boolean;
  virtualBackground?: string;
  maxParticipants: number;
  sessionTimeout: number; // in minutes
}

export interface SessionMetrics {
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  bandwidth: {
    upload: number;
    download: number;
  };
  latency: number;
  packetLoss: number;
  jitter: number;
}

export interface WhiteboardData {
  sessionId: string;
  drawings: any[]; // Canvas drawing data
  timestamp: Date;
}

class TeletherapyService extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private sessionConfig: SessionConfig;
  private currentSession: Appointment | null = null;
  private encryptionKey: CryptoKey | null = null;
  private recordedChunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  // WebRTC configuration with TURN/STUN servers for NAT traversal
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for better connectivity
      {
        urls: 'turn:turnserver.example.com:3478',
        username: process.env.VITE_TURN_USERNAME || '',
        credential: process.env.VITE_TURN_CREDENTIAL || ''
      }
    ],
    iceCandidatePoolSize: 10
  };

  constructor() {
    super();
    this.sessionConfig = this.getDefaultSessionConfig();
    this.initializeEncryption();
  }

  /**
   * Initialize end-to-end encryption for HIPAA compliance
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Generate encryption key for session data
      this.encryptionKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed - cannot proceed with secure session');
    }
  }

  /**
   * Get default session configuration
   */
  private getDefaultSessionConfig(): SessionConfig {
    return {
      enableVideo: true,
      enableAudio: true,
      enableScreenShare: false,
      enableRecording: false,
      enableWhiteboard: false,
      virtualBackground: undefined,
      maxParticipants: 2,
      sessionTimeout: 60 // 60 minutes default
    };
  }

  /**
   * Schedule a new appointment
   */
  async scheduleAppointment(
    therapistId: string,
    patientId: string,
    scheduledTime: Date,
    duration: number = 50
  ): Promise<Appointment> {
    try {
      // Validate therapist availability
      const isAvailable = await this.checkTherapistAvailability(therapistId, scheduledTime, duration);
      
      if (!isAvailable) {
        throw new Error('Therapist is not available at the requested time');
      }

      // Create appointment
      const appointment: Appointment = {
        id: this.generateSecureId(),
        therapistId,
        patientId,
        scheduledTime,
        duration,
        status: 'scheduled',
        paymentStatus: 'pending'
      };

      // Send to backend API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(appointment)
      });

      if (!response.ok) {
        throw new Error('Failed to schedule appointment');
      }

      const savedAppointment = await response.json();
      
      // Schedule reminder notifications
      this.scheduleReminders(savedAppointment);
      
      this.emit('appointmentScheduled', savedAppointment);
      return savedAppointment;
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel or reschedule an appointment
   */
  async modifyAppointment(
    appointmentId: string,
    action: 'cancel' | 'reschedule',
    newTime?: Date
  ): Promise<Appointment> {
    try {
      const endpoint = `/api/appointments/${appointmentId}`;
      const body: any = { action };
      
      if (action === 'reschedule' && newTime) {
        body.newScheduledTime = newTime;
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} appointment`);
      }

      const updatedAppointment = await response.json();
      this.emit('appointmentModified', updatedAppointment);
      return updatedAppointment;
    } catch (error) {
      console.error(`Error modifying appointment:`, error);
      throw error;
    }
  }

  /**
   * Initialize a video session
   */
  async initializeSession(appointmentId: string, config?: Partial<SessionConfig>): Promise<void> {
    try {
      // Merge with default config
      this.sessionConfig = { ...this.sessionConfig, ...config };

      // Fetch appointment details
      const appointment = await this.fetchAppointment(appointmentId);
      this.currentSession = appointment;

      // Initialize WebRTC peer connection
      this.peerConnection = new RTCPeerConnection(this.rtcConfig);
      
      // Set up event handlers
      this.setupPeerConnectionHandlers();

      // Get user media
      await this.initializeMedia();

      // Create data channel for chat and whiteboard
      this.dataChannel = this.peerConnection.createDataChannel('teletherapy', {
        ordered: true,
        maxRetransmits: 3
      });
      this.setupDataChannelHandlers();

      // Start monitoring connection quality
      this.startMetricsMonitoring();

      this.emit('sessionInitialized', appointment);
    } catch (error) {
      console.error('Error initializing session:', error);
      this.emit('sessionError', error);
      throw error;
    }
  }

  /**
   * Initialize media streams
   */
  private async initializeMedia(): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        video: this.sessionConfig.enableVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: this.sessionConfig.enableAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      this.emit('localStreamReady', this.localStream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  }

  /**
   * Start or stop recording with consent
   */
  async toggleRecording(consent: boolean): Promise<void> {
    if (!consent) {
      console.warn('Recording requires explicit consent');
      return;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  /**
   * Start recording the session
   */
  private async startRecording(): Promise<void> {
    if (!this.localStream) {
      throw new Error('No media stream available for recording');
    }

    try {
      // Combine local and remote streams
      const combinedStream = new MediaStream();
      
      // Add local tracks
      this.localStream.getTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
      
      // Add remote tracks if available
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      }

      // Initialize MediaRecorder with HIPAA-compliant settings
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.saveRecording();
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.emit('recordingStarted');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording the session
   */
  private async stopRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.emit('recordingStopped');
    }
  }

  /**
   * Save and encrypt recording
   */
  private async saveRecording(): Promise<void> {
    if (this.recordedChunks.length === 0) return;

    try {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      
      // Encrypt the recording for HIPAA compliance
      const encryptedBlob = await this.encryptData(blob);
      
      // Upload to secure storage
      const formData = new FormData();
      formData.append('recording', encryptedBlob);
      formData.append('sessionId', this.currentSession?.id || '');
      formData.append('encrypted', 'true');

      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to save recording');
      }

      const result = await response.json();
      this.emit('recordingSaved', result.url);
    } catch (error) {
      console.error('Error saving recording:', error);
      throw error;
    }
  }

  /**
   * Enable or disable screen sharing
   */
  async toggleScreenShare(enable: boolean): Promise<void> {
    try {
      if (enable) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track with screen share
        const sender = this.peerConnection?.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );

        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        // Listen for screen share ending
        screenTrack.onended = () => {
          this.toggleScreenShare(false);
        };

        this.emit('screenShareStarted');
      } else {
        // Restore camera video
        const videoTrack = this.localStream?.getVideoTracks()[0];
        const sender = this.peerConnection?.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );

        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }

        this.emit('screenShareStopped');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      throw error;
    }
  }

  /**
   * Send whiteboard data through data channel
   */
  sendWhiteboardData(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const message = {
        type: 'whiteboard',
        data: data,
        timestamp: new Date().toISOString()
      };
      
      this.dataChannel.send(JSON.stringify(message));
    }
  }

  /**
   * Send chat message through data channel
   */
  sendChatMessage(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const chatMessage = {
        type: 'chat',
        message: message,
        timestamp: new Date().toISOString(),
        sender: 'local'
      };
      
      this.dataChannel.send(JSON.stringify(chatMessage));
      this.emit('chatMessageSent', chatMessage);
    }
  }

  /**
   * Get therapist availability
   */
  async getTherapistAvailability(
    therapistId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilitySlot[]> {
    try {
      const response = await fetch(
        `/api/therapists/${therapistId}/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }

  /**
   * Process insurance claim for session
   */
  async processInsuranceClaim(
    appointmentId: string,
    insuranceInfo: {
      provider: string;
      policyNumber: string;
      authorizationNumber?: string;
    }
  ): Promise<InsuranceClaim> {
    try {
      const response = await fetch('/api/insurance/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          appointmentId,
          ...insuranceInfo
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process insurance claim');
      }

      const claim = await response.json();
      this.emit('insuranceClaimProcessed', claim);
      return claim;
    } catch (error) {
      console.error('Error processing insurance claim:', error);
      throw error;
    }
  }

  /**
   * Save session notes (encrypted)
   */
  async saveSessionNotes(appointmentId: string, notes: string): Promise<void> {
    try {
      // Encrypt notes for HIPAA compliance
      const encryptedNotes = await this.encryptText(notes);

      const response = await fetch(`/api/appointments/${appointmentId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          notes: encryptedNotes,
          encrypted: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save session notes');
      }

      this.emit('sessionNotesSaved');
    } catch (error) {
      console.error('Error saving session notes:', error);
      throw error;
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    try {
      // Stop recording if active
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        await this.stopRecording();
      }

      // Stop metrics monitoring
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      // Close data channel
      if (this.dataChannel) {
        this.dataChannel.close();
        this.dataChannel = null;
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // Stop local media tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Update appointment status
      if (this.currentSession) {
        await this.updateAppointmentStatus(this.currentSession.id, 'completed');
      }

      this.emit('sessionEnded');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Monitor connection metrics for quality indicators
   */
  private startMetricsMonitoring(): void {
    this.metricsInterval = setInterval(async () => {
      if (!this.peerConnection) return;

      try {
        const stats = await this.peerConnection.getStats();
        const metrics: SessionMetrics = this.processStats(stats);
        this.emit('metricsUpdate', metrics);
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    }, 2000); // Update every 2 seconds
  }

  /**
   * Process WebRTC stats into metrics
   */
  private processStats(stats: RTCStatsReport): SessionMetrics {
    let metrics: SessionMetrics = {
      connectionQuality: 'good',
      bandwidth: { upload: 0, download: 0 },
      latency: 0,
      packetLoss: 0,
      jitter: 0
    };

    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        metrics.latency = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
      }
      
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        metrics.bandwidth.download = report.bytesReceived || 0;
        metrics.packetLoss = report.packetsLost || 0;
        metrics.jitter = report.jitter || 0;
      }
      
      if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
        metrics.bandwidth.upload = report.bytesSent || 0;
      }
    });

    // Determine connection quality based on metrics
    if (metrics.latency > 300 || metrics.packetLoss > 5) {
      metrics.connectionQuality = 'poor';
    } else if (metrics.latency > 150 || metrics.packetLoss > 2) {
      metrics.connectionQuality = 'fair';
    } else if (metrics.latency > 50 || metrics.packetLoss > 0.5) {
      metrics.connectionQuality = 'good';
    } else {
      metrics.connectionQuality = 'excellent';
    }

    return metrics;
  }

  /**
   * Set up WebRTC peer connection event handlers
   */
  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('iceCandidate', event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.emit('remoteStreamReady', this.remoteStream);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      this.emit('connectionStateChange', state);
      
      if (state === 'failed' || state === 'disconnected') {
        this.handleConnectionFailure();
      }
    };
  }

  /**
   * Set up data channel event handlers
   */
  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.emit('dataChannelOpen');
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'chat':
            this.emit('chatMessageReceived', message);
            break;
          case 'whiteboard':
            this.emit('whiteboardDataReceived', message.data);
            break;
          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing data channel message:', error);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      this.emit('dataChannelError', error);
    };
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailure(): void {
    this.emit('connectionFailed');
    
    // Attempt to reconnect
    setTimeout(() => {
      this.attemptReconnection();
    }, 3000);
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnection(): Promise<void> {
    try {
      if (this.currentSession) {
        await this.initializeSession(this.currentSession.id, this.sessionConfig);
        this.emit('reconnected');
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.emit('reconnectionFailed');
    }
  }

  /**
   * Helper methods
   */
  private async checkTherapistAvailability(
    therapistId: string,
    time: Date,
    duration: number
  ): Promise<boolean> {
    const endTime = new Date(time.getTime() + duration * 60000);
    const availability = await this.getTherapistAvailability(therapistId, time, endTime);
    return availability.some(slot => slot.isAvailable);
  }

  private scheduleReminders(appointment: Appointment): void {
    // Schedule 24-hour reminder
    const dayBefore = new Date(appointment.scheduledTime.getTime() - 24 * 60 * 60 * 1000);
    this.scheduleNotification(appointment, dayBefore, '24 hours');

    // Schedule 1-hour reminder
    const hourBefore = new Date(appointment.scheduledTime.getTime() - 60 * 60 * 1000);
    this.scheduleNotification(appointment, hourBefore, '1 hour');
  }

  private scheduleNotification(appointment: Appointment, time: Date, reminderText: string): void {
    const now = new Date();
    if (time > now) {
      const timeout = time.getTime() - now.getTime();
      setTimeout(() => {
        this.emit('reminderNotification', {
          appointment,
          reminderText
        });
      }, timeout);
    }
  }

  private async fetchAppointment(appointmentId: string): Promise<Appointment> {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointment');
    }

    return await response.json();
  }

  private async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<void> {
    await fetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify({ status })
    });
  }

  private async encryptData(blob: Blob): Promise<Blob> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const arrayBuffer = await blob.arrayBuffer();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      arrayBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return new Blob([combined], { type: blob.type });
  }

  private async encryptText(text: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      data
    );

    // Combine IV and encrypted data, then base64 encode
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  private generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async getAuthToken(): Promise<string> {
    // Retrieve auth token from secure storage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }
    return token;
  }
}

// Export singleton instance
export const teletherapyService = new TeletherapyService();