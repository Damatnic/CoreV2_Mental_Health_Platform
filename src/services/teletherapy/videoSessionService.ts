/**
 * Video Session Service for Teletherapy
 * 
 * Comprehensive video conferencing implementation with screen sharing,
 * session recording, and advanced features for professional teletherapy.
 */

import { EventEmitter } from 'events';

// ============================
// Type Definitions
// ============================

export interface VideoSession {
  id: string;
  roomId: string;
  therapistId: string;
  patientId: string;
  status: VideoSessionStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  quality: VideoQuality;
  recording?: SessionRecording;
  screenShare?: ScreenShareState;
  participants: Participant[];
  settings: VideoSessionSettings;
  metrics: SessionMetrics;
  features: SessionFeatures;
  securityFeatures: SecurityFeatures;
}

export type VideoSessionStatus = 
  | 'scheduled'
  | 'waiting'
  | 'connecting'
  | 'active'
  | 'paused'
  | 'ended'
  | 'failed'
  | 'reconnecting';

export interface VideoQuality {
  resolution: '360p' | '480p' | '720p' | '1080p' | '4k';
  bitrate: number;
  frameRate: number;
  adaptiveQuality: boolean;
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface SessionRecording {
  enabled: boolean;
  consentObtained: boolean;
  consentTimestamp?: Date;
  recordingId?: string;
  format: 'webm' | 'mp4' | 'mkv';
  quality: '720p' | '1080p';
  includesAudio: boolean;
  includesVideo: boolean;
  includesScreenShare: boolean;
  storageLocation: 'local' | 'cloud' | 'encrypted_cloud';
  retentionDays: number;
  accessControl: RecordingAccessControl;
}

export interface RecordingAccessControl {
  therapistAccess: boolean;
  patientAccess: boolean;
  requiresConsent: boolean;
  encryptionEnabled: boolean;
  watermarkEnabled: boolean;
}

export interface ScreenShareState {
  active: boolean;
  sharedBy: string;
  startTime?: Date;
  streamId?: string;
  quality: VideoQuality;
  annotations?: AnnotationData[];
}

export interface AnnotationData {
  id: string;
  type: 'drawing' | 'text' | 'pointer' | 'highlight';
  data: any;
  timestamp: Date;
  author: string;
}

export interface Participant {
  id: string;
  userId: string;
  role: 'therapist' | 'patient' | 'observer' | 'supervisor';
  displayName: string;
  joinedAt: Date;
  leftAt?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  mediaState: MediaState;
  deviceInfo: DeviceInfo;
  networkStats: NetworkStats;
}

export interface MediaState {
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenShareEnabled: boolean;
  virtualBackground: boolean;
  noiseSupression: boolean;
  echoCancellation: boolean;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  camera?: MediaDeviceInfo;
  microphone?: MediaDeviceInfo;
  speakers?: MediaDeviceInfo;
}

export interface NetworkStats {
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: {
    upload: number;
    download: number;
  };
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
}

export interface VideoSessionSettings {
  maxParticipants: number;
  sessionTimeout: number;
  autoRecord: boolean;
  requireConsent: boolean;
  waitingRoomEnabled: boolean;
  chatEnabled: boolean;
  fileShareEnabled: boolean;
  whiteboardEnabled: boolean;
  breakoutRoomsEnabled: boolean;
  transcriptionEnabled: boolean;
  closedCaptionsEnabled: boolean;
  languageInterpretation: boolean;
  virtualBackgrounds: VirtualBackgroundSettings;
}

export interface VirtualBackgroundSettings {
  enabled: boolean;
  blurEnabled: boolean;
  customBackgrounds: string[];
  therapeuticBackgrounds: TherapeuticBackground[];
}

export interface TherapeuticBackground {
  id: string;
  name: string;
  type: 'calming' | 'nature' | 'abstract' | 'office' | 'custom';
  imageUrl: string;
  videoUrl?: string;
  recommended: boolean;
}

export interface SessionMetrics {
  videoQualityScore: number;
  audioQualityScore: number;
  connectionStability: number;
  userExperienceScore: number;
  engagementMetrics: EngagementMetrics;
  technicalMetrics: TechnicalMetrics;
}

export interface EngagementMetrics {
  speakingTime: Map<string, number>;
  attentionScore: number;
  interactionCount: number;
  emotionalTone: 'positive' | 'neutral' | 'negative';
  therapeuticRapport: number;
}

export interface TechnicalMetrics {
  totalBandwidthUsed: number;
  averageLatency: number;
  reconnectionCount: number;
  qualityChanges: number;
  errorCount: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface SessionFeatures {
  aiTranscription: AITranscriptionFeature;
  emotionDetection: EmotionDetectionFeature;
  therapistTools: TherapistToolsFeature;
  accessibility: AccessibilityFeatures;
  collaboration: CollaborationFeatures;
}

export interface AITranscriptionFeature {
  enabled: boolean;
  realtime: boolean;
  language: string;
  accuracy: number;
  speakerIdentification: boolean;
  medicalTerminology: boolean;
  summaryGeneration: boolean;
}

export interface EmotionDetectionFeature {
  enabled: boolean;
  facialRecognition: boolean;
  voiceToneAnalysis: boolean;
  confidenceThreshold: number;
  privacyMode: boolean;
}

export interface TherapistToolsFeature {
  notesTaking: boolean;
  assessmentForms: boolean;
  resourceSharing: boolean;
  sessionPlanning: boolean;
  progressTracking: boolean;
  interventionSuggestions: boolean;
}

export interface AccessibilityFeatures {
  signLanguageInterpreter: boolean;
  liveCaptions: boolean;
  transcriptAvailable: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  screenReaderCompatible: boolean;
}

export interface CollaborationFeatures {
  whiteboard: boolean;
  documentSharing: boolean;
  breakoutRooms: boolean;
  polls: boolean;
  reactions: boolean;
  handRaising: boolean;
}

export interface SecurityFeatures {
  endToEndEncryption: boolean;
  hipaaCompliant: boolean;
  dataResidency: string;
  accessControl: AccessControlSettings;
  auditLogging: boolean;
  sessionPinRequired: boolean;
  biometricVerification: boolean;
}

export interface AccessControlSettings {
  requireAuthentication: boolean;
  twoFactorRequired: boolean;
  ipWhitelisting: string[];
  deviceWhitelisting: string[];
  geoRestrictions: string[];
}

// ============================
// Video Session Service
// ============================

export class VideoSessionService extends EventEmitter {
  private static instance: VideoSessionService;
  private sessions: Map<string, VideoSession> = new Map();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private mediaStreams: Map<string, MediaStream> = new Map();
  private recordingWorker?: Worker;
  private signalingSocket?: WebSocket;
  private stunServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];
  private turnServers: RTCIceServer[] = [];

  private constructor() {
    super();
    this.initializeService();
  }

  public static getInstance(): VideoSessionService {
    if (!VideoSessionService.instance) {
      VideoSessionService.instance = new VideoSessionService();
    }
    return VideoSessionService.instance;
  }

  private async initializeService(): Promise<void> {
    // Initialize WebRTC
    await this.checkWebRTCSupport();
    
    // Initialize signaling
    this.initializeSignaling();
    
    // Initialize recording worker
    this.initializeRecordingWorker();
    
    // Load TURN servers
    await this.loadTurnServers();
  }

  private async checkWebRTCSupport(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC is not supported in this browser');
    }

    // Check for required APIs
    const requiredAPIs = [
      'RTCPeerConnection',
      'RTCSessionDescription',
      'RTCIceCandidate',
      'MediaStream'
    ];

    for (const api of requiredAPIs) {
      if (!(api in window)) {
        throw new Error(`Required WebRTC API ${api} is not available`);
      }
    }
  }

  private initializeSignaling(): void {
    const wsUrl = process.env.REACT_APP_SIGNALING_SERVER || 'wss://signal.astralcore.ai';
    
    this.signalingSocket = new WebSocket(wsUrl);
    
    this.signalingSocket.onopen = () => {
      console.log('Signaling connection established');
      this.emit('signaling:connected');
    };

    this.signalingSocket.onmessage = (event) => {
      this.handleSignalingMessage(JSON.parse(event.data));
    };

    this.signalingSocket.onerror = (error) => {
      console.error('Signaling error:', error);
      this.emit('signaling:error', error);
    };

    this.signalingSocket.onclose = () => {
      console.log('Signaling connection closed');
      this.emit('signaling:disconnected');
      // Attempt reconnection
      setTimeout(() => this.initializeSignaling(), 5000);
    };
  }

  private handleSignalingMessage(message: any): void {
    const { type, sessionId, data } = message;

    switch (type) {
      case 'offer':
        this.handleOffer(sessionId, data);
        break;
      case 'answer':
        this.handleAnswer(sessionId, data);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(sessionId, data);
        break;
      case 'participant-joined':
        this.handleParticipantJoined(sessionId, data);
        break;
      case 'participant-left':
        this.handleParticipantLeft(sessionId, data);
        break;
      case 'session-ended':
        this.handleSessionEnded(sessionId);
        break;
      default:
        console.warn('Unknown signaling message type:', type);
    }
  }

  private initializeRecordingWorker(): void {
    if (typeof Worker !== 'undefined') {
      // Create recording worker for processing video streams
      const workerCode = `
        let mediaRecorder;
        let recordedChunks = [];

        self.onmessage = function(e) {
          const { command, data } = e.data;
          
          switch(command) {
            case 'start':
              startRecording(data);
              break;
            case 'stop':
              stopRecording();
              break;
            case 'pause':
              pauseRecording();
              break;
            case 'resume':
              resumeRecording();
              break;
          }
        };

        function startRecording(stream) {
          recordedChunks = [];
          const options = {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 2500000
          };
          
          try {
            mediaRecorder = new MediaRecorder(stream, options);
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                recordedChunks.push(event.data);
              }
            };
            
            mediaRecorder.onstop = () => {
              const blob = new Blob(recordedChunks, { type: 'video/webm' });
              self.postMessage({ type: 'recording-complete', blob });
            };
            
            mediaRecorder.start(1000); // Collect data every second
            self.postMessage({ type: 'recording-started' });
          } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
          }
        }

        function stopRecording() {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }

        function pauseRecording() {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            self.postMessage({ type: 'recording-paused' });
          }
        }

        function resumeRecording() {
          if (mediaRecorder && mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            self.postMessage({ type: 'recording-resumed' });
          }
        }
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.recordingWorker = new Worker(workerUrl);

      this.recordingWorker.onmessage = (event) => {
        this.handleRecordingWorkerMessage(event.data);
      };
    }
  }

  private handleRecordingWorkerMessage(data: any): void {
    const { type, blob, error } = data;

    switch (type) {
      case 'recording-started':
        this.emit('recording:started');
        break;
      case 'recording-paused':
        this.emit('recording:paused');
        break;
      case 'recording-resumed':
        this.emit('recording:resumed');
        break;
      case 'recording-complete':
        this.handleRecordingComplete(blob);
        break;
      case 'error':
        console.error('Recording error:', error);
        this.emit('recording:error', error);
        break;
    }
  }

  private async handleRecordingComplete(blob: Blob): Promise<void> {
    // Process and store the recording
    const formData = new FormData();
    formData.append('recording', blob, `session-${Date.now()}.webm`);
    
    try {
      const response = await fetch('/api/teletherapy/recordings/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        this.emit('recording:uploaded', result);
      } else {
        throw new Error('Failed to upload recording');
      }
    } catch (error) {
      console.error('Upload error:', error);
      this.emit('recording:upload-error', error);
    }
  }

  private async loadTurnServers(): Promise<void> {
    try {
      const response = await fetch('/api/teletherapy/turn-credentials', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const credentials = await response.json();
        this.turnServers = credentials.servers;
      }
    } catch (error) {
      console.error('Failed to load TURN servers:', error);
    }
  }

  // ============================
  // Public Methods
  // ============================

  public async createSession(
    therapistId: string,
    patientId: string,
    settings?: Partial<VideoSessionSettings>
  ): Promise<VideoSession> {
    const sessionId = this.generateSessionId();
    const roomId = this.generateRoomId();

    const defaultSettings: VideoSessionSettings = {
      maxParticipants: 2,
      sessionTimeout: 60 * 60 * 1000, // 1 hour
      autoRecord: false,
      requireConsent: true,
      waitingRoomEnabled: true,
      chatEnabled: true,
      fileShareEnabled: true,
      whiteboardEnabled: true,
      breakoutRoomsEnabled: false,
      transcriptionEnabled: true,
      closedCaptionsEnabled: true,
      languageInterpretation: false,
      virtualBackgrounds: {
        enabled: true,
        blurEnabled: true,
        customBackgrounds: [],
        therapeuticBackgrounds: this.getTherapeuticBackgrounds()
      }
    };

    const session: VideoSession = {
      id: sessionId,
      roomId,
      therapistId,
      patientId,
      status: 'scheduled',
      quality: {
        resolution: '720p',
        bitrate: 1500000,
        frameRate: 30,
        adaptiveQuality: true,
        networkQuality: 'good'
      },
      participants: [],
      settings: { ...defaultSettings, ...settings },
      metrics: this.initializeMetrics(),
      features: this.initializeFeatures(),
      securityFeatures: this.initializeSecurityFeatures()
    };

    this.sessions.set(sessionId, session);
    
    // Initialize room on server
    await this.initializeServerRoom(session);
    
    this.emit('session:created', session);
    return session;
  }

  public async joinSession(
    sessionId: string,
    userId: string,
    role: Participant['role']
  ): Promise<MediaStream> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check permissions
    if (!this.canJoinSession(session, userId, role)) {
      throw new Error('Not authorized to join this session');
    }

    // Get user media
    const stream = await this.getUserMedia(session.quality);
    this.mediaStreams.set(`${sessionId}-${userId}`, stream);

    // Create peer connection
    const peerConnection = await this.createPeerConnection(sessionId, userId);
    
    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send offer through signaling
    this.sendSignalingMessage('offer', sessionId, {
      userId,
      offer: offer.sdp
    });

    // Update session
    const participant: Participant = {
      id: userId,
      userId,
      role,
      displayName: await this.getUserDisplayName(userId),
      joinedAt: new Date(),
      connectionStatus: 'connecting',
      mediaState: {
        videoEnabled: true,
        audioEnabled: true,
        screenShareEnabled: false,
        virtualBackground: false,
        noiseSupression: true,
        echoCancellation: true
      },
      deviceInfo: await this.getDeviceInfo(),
      networkStats: await this.getNetworkStats()
    };

    session.participants.push(participant);
    session.status = 'connecting';
    
    this.emit('session:joined', { sessionId, userId, stream });
    return stream;
  }

  public async startScreenShare(sessionId: string, userId: string): Promise<MediaStream> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get screen share stream
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: true
    });

    // Store screen stream
    this.mediaStreams.set(`${sessionId}-${userId}-screen`, screenStream);

    // Get peer connection
    const peerConnection = this.peerConnections.get(`${sessionId}-${userId}`);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    // Replace video track with screen share
    const videoSender = peerConnection.getSenders().find(
      sender => sender.track?.kind === 'video'
    );

    if (videoSender) {
      videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
    }

    // Update session
    session.screenShare = {
      active: true,
      sharedBy: userId,
      startTime: new Date(),
      streamId: screenStream.id,
      quality: session.quality,
      annotations: []
    };

    // Notify other participants
    this.sendSignalingMessage('screen-share-started', sessionId, {
      userId,
      streamId: screenStream.id
    });

    // Handle screen share end
    screenStream.getVideoTracks()[0].onended = () => {
      this.stopScreenShare(sessionId, userId);
    };

    this.emit('screenshare:started', { sessionId, userId, screenStream });
    return screenStream;
  }

  public async stopScreenShare(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.screenShare) {
      return;
    }

    // Get screen stream
    const screenStream = this.mediaStreams.get(`${sessionId}-${userId}-screen`);
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      this.mediaStreams.delete(`${sessionId}-${userId}-screen`);
    }

    // Get original stream
    const originalStream = this.mediaStreams.get(`${sessionId}-${userId}`);
    const peerConnection = this.peerConnections.get(`${sessionId}-${userId}`);

    if (originalStream && peerConnection) {
      // Replace screen share with original video
      const videoSender = peerConnection.getSenders().find(
        sender => sender.track?.kind === 'video'
      );

      if (videoSender) {
        videoSender.replaceTrack(originalStream.getVideoTracks()[0]);
      }
    }

    // Update session
    session.screenShare = undefined;

    // Notify other participants
    this.sendSignalingMessage('screen-share-stopped', sessionId, { userId });

    this.emit('screenshare:stopped', { sessionId, userId });
  }

  public async startRecording(
    sessionId: string,
    userId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check permissions
    if (!this.canStartRecording(session, userId)) {
      throw new Error('Not authorized to start recording');
    }

    // Check consent
    if (session.settings.requireConsent && !await this.obtainRecordingConsent(session)) {
      throw new Error('Recording consent not obtained');
    }

    // Get combined stream
    const stream = await this.getCombinedStream(sessionId);

    // Configure recording
    session.recording = {
      enabled: true,
      consentObtained: true,
      consentTimestamp: new Date(),
      recordingId: this.generateRecordingId(),
      format: 'webm',
      quality: '1080p',
      includesAudio: true,
      includesVideo: true,
      includesScreenShare: !!session.screenShare,
      storageLocation: 'encrypted_cloud',
      retentionDays: 30,
      accessControl: {
        therapistAccess: true,
        patientAccess: false,
        requiresConsent: true,
        encryptionEnabled: true,
        watermarkEnabled: true
      }
    };

    // Start recording worker
    if (this.recordingWorker) {
      this.recordingWorker.postMessage({
        command: 'start',
        data: stream
      });
    }

    // Notify participants
    this.notifyRecordingStarted(session);

    this.emit('recording:started', { sessionId, recordingId: session.recording.recordingId });
  }

  public async stopRecording(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.recording?.enabled) {
      return;
    }

    // Stop recording worker
    if (this.recordingWorker) {
      this.recordingWorker.postMessage({ command: 'stop' });
    }

    // Update session
    session.recording.enabled = false;

    // Notify participants
    this.notifyRecordingStopped(session);

    this.emit('recording:stopped', { sessionId });
  }

  public async enableVirtualBackground(
    sessionId: string,
    userId: string,
    backgroundId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const stream = this.mediaStreams.get(`${sessionId}-${userId}`);
    if (!stream) {
      throw new Error('Media stream not found');
    }

    // Apply virtual background using Canvas and WebGL
    const processedStream = await this.applyVirtualBackground(stream, backgroundId);

    // Replace video track
    const peerConnection = this.peerConnections.get(`${sessionId}-${userId}`);
    if (peerConnection) {
      const videoSender = peerConnection.getSenders().find(
        sender => sender.track?.kind === 'video'
      );

      if (videoSender) {
        videoSender.replaceTrack(processedStream.getVideoTracks()[0]);
      }
    }

    // Update participant state
    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.mediaState.virtualBackground = true;
    }

    this.emit('virtualbackground:enabled', { sessionId, userId, backgroundId });
  }

  public async addAnnotation(
    sessionId: string,
    userId: string,
    annotation: Omit<AnnotationData, 'id' | 'timestamp' | 'author'>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.screenShare) {
      throw new Error('Screen share not active');
    }

    const annotationData: AnnotationData = {
      id: this.generateAnnotationId(),
      ...annotation,
      timestamp: new Date(),
      author: userId
    };

    session.screenShare.annotations = session.screenShare.annotations || [];
    session.screenShare.annotations.push(annotationData);

    // Broadcast annotation to other participants
    this.sendSignalingMessage('annotation-added', sessionId, annotationData);

    this.emit('annotation:added', { sessionId, annotation: annotationData });
  }

  public async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // Stop recording if active
    if (session.recording?.enabled) {
      await this.stopRecording(sessionId);
    }

    // Close all peer connections
    session.participants.forEach(participant => {
      const peerConnection = this.peerConnections.get(`${sessionId}-${participant.userId}`);
      if (peerConnection) {
        peerConnection.close();
        this.peerConnections.delete(`${sessionId}-${participant.userId}`);
      }

      // Stop media streams
      const stream = this.mediaStreams.get(`${sessionId}-${participant.userId}`);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        this.mediaStreams.delete(`${sessionId}-${participant.userId}`);
      }
    });

    // Update session
    session.status = 'ended';
    session.endTime = new Date();
    session.duration = session.startTime 
      ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 
      : 0;

    // Generate session summary
    const summary = await this.generateSessionSummary(session);

    // Notify server
    await this.notifyServerSessionEnded(session, summary);

    // Remove session
    this.sessions.delete(sessionId);

    this.emit('session:ended', { sessionId, summary });
  }

  // ============================
  // Helper Methods
  // ============================

  private async getUserMedia(quality: VideoQuality): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: this.getResolutionWidth(quality.resolution) },
        height: { ideal: this.getResolutionHeight(quality.resolution) },
        frameRate: { ideal: quality.frameRate }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
      }
    };

    return navigator.mediaDevices.getUserMedia(constraints);
  }

  private getResolutionWidth(resolution: VideoQuality['resolution']): number {
    const resolutionMap = {
      '360p': 640,
      '480p': 854,
      '720p': 1280,
      '1080p': 1920,
      '4k': 3840
    };
    return resolutionMap[resolution];
  }

  private getResolutionHeight(resolution: VideoQuality['resolution']): number {
    const resolutionMap = {
      '360p': 360,
      '480p': 480,
      '720p': 720,
      '1080p': 1080,
      '4k': 2160
    };
    return resolutionMap[resolution];
  }

  private async createPeerConnection(
    sessionId: string,
    userId: string
  ): Promise<RTCPeerConnection> {
    const configuration: RTCConfiguration = {
      iceServers: [...this.stunServers, ...this.turnServers],
      iceCandidatePoolSize: 10
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage('ice-candidate', sessionId, {
          userId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      this.handleConnectionStateChange(sessionId, userId, peerConnection.connectionState);
    };

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      this.handleIncomingTrack(sessionId, userId, event);
    };

    // Store peer connection
    this.peerConnections.set(`${sessionId}-${userId}`, peerConnection);

    return peerConnection;
  }

  private async handleOffer(sessionId: string, data: any): Promise<void> {
    const { userId, offer } = data;
    
    // Create peer connection if not exists
    let peerConnection = this.peerConnections.get(`${sessionId}-${userId}`);
    if (!peerConnection) {
      peerConnection = await this.createPeerConnection(sessionId, userId);
    }

    // Set remote description
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: offer })
    );

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer
    this.sendSignalingMessage('answer', sessionId, {
      userId,
      answer: answer.sdp
    });
  }

  private async handleAnswer(sessionId: string, data: any): Promise<void> {
    const { userId, answer } = data;
    const peerConnection = this.peerConnections.get(`${sessionId}-${userId}`);
    
    if (peerConnection) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: answer })
      );
    }
  }

  private async handleIceCandidate(sessionId: string, data: any): Promise<void> {
    const { userId, candidate } = data;
    const peerConnection = this.peerConnections.get(`${sessionId}-${userId}`);
    
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private handleParticipantJoined(sessionId: string, data: any): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.emit('participant:joined', { sessionId, participant: data });
    }
  }

  private handleParticipantLeft(sessionId: string, data: any): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const participantIndex = session.participants.findIndex(p => p.userId === data.userId);
      if (participantIndex !== -1) {
        session.participants[participantIndex].leftAt = new Date();
        session.participants[participantIndex].connectionStatus = 'disconnected';
      }
      this.emit('participant:left', { sessionId, participant: data });
    }
  }

  private handleSessionEnded(sessionId: string): void {
    this.endSession(sessionId);
  }

  private handleConnectionStateChange(
    sessionId: string,
    userId: string,
    state: RTCPeerConnectionState
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) return;

    switch (state) {
      case 'connected':
        participant.connectionStatus = 'connected';
        if (session.status === 'connecting') {
          session.status = 'active';
          session.startTime = new Date();
        }
        break;
      case 'disconnected':
        participant.connectionStatus = 'reconnecting';
        session.status = 'reconnecting';
        break;
      case 'failed':
        participant.connectionStatus = 'disconnected';
        if (session.participants.every(p => p.connectionStatus === 'disconnected')) {
          session.status = 'failed';
        }
        break;
    }

    this.emit('connection:statechange', { sessionId, userId, state });
  }

  private handleIncomingTrack(sessionId: string, userId: string, event: RTCTrackEvent): void {
    const { streams, track } = event;
    
    if (streams && streams[0]) {
      this.emit('track:received', {
        sessionId,
        userId,
        track,
        stream: streams[0]
      });
    }
  }

  private sendSignalingMessage(type: string, sessionId: string, data: any): void {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({
        type,
        sessionId,
        data
      }));
    }
  }

  private canJoinSession(session: VideoSession, userId: string, role: Participant['role']): boolean {
    // Check if user is authorized
    if (role === 'therapist' && session.therapistId !== userId) {
      return false;
    }
    if (role === 'patient' && session.patientId !== userId) {
      return false;
    }
    
    // Check max participants
    if (session.participants.length >= session.settings.maxParticipants) {
      return false;
    }

    return true;
  }

  private canStartRecording(session: VideoSession, userId: string): boolean {
    // Only therapist can start recording
    const participant = session.participants.find(p => p.userId === userId);
    return participant?.role === 'therapist';
  }

  private async obtainRecordingConsent(session: VideoSession): Promise<boolean> {
    // In a real implementation, this would show a consent dialog to all participants
    return new Promise((resolve) => {
      this.emit('consent:requested', {
        sessionId: session.id,
        type: 'recording',
        callback: (consented: boolean) => resolve(consented)
      });
    });
  }

  private async getCombinedStream(sessionId: string): Promise<MediaStream> {
    // Combine all participant streams into one
    const combinedStream = new MediaStream();
    
    this.mediaStreams.forEach((stream, key) => {
      if (key.startsWith(sessionId)) {
        stream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      }
    });

    return combinedStream;
  }

  private async applyVirtualBackground(
    stream: MediaStream,
    backgroundId: string
  ): Promise<MediaStream> {
    // This would use TensorFlow.js or similar for background segmentation
    // For now, returning the original stream
    return stream;
  }

  private notifyRecordingStarted(session: VideoSession): void {
    session.participants.forEach(participant => {
      this.sendSignalingMessage('recording-started', session.id, {
        recordingId: session.recording?.recordingId
      });
    });
  }

  private notifyRecordingStopped(session: VideoSession): void {
    session.participants.forEach(participant => {
      this.sendSignalingMessage('recording-stopped', session.id, {});
    });
  }

  private async generateSessionSummary(session: VideoSession): Promise<any> {
    return {
      sessionId: session.id,
      duration: session.duration,
      participants: session.participants.length,
      recordingAvailable: !!session.recording,
      metrics: session.metrics,
      features: session.features
    };
  }

  private async notifyServerSessionEnded(session: VideoSession, summary: any): Promise<void> {
    try {
      await fetch('/api/teletherapy/sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ sessionId: session.id, summary })
      });
    } catch (error) {
      console.error('Failed to notify server of session end:', error);
    }
  }

  private async initializeServerRoom(session: VideoSession): Promise<void> {
    try {
      await fetch('/api/teletherapy/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          roomId: session.roomId,
          sessionId: session.id,
          settings: session.settings
        })
      });
    } catch (error) {
      console.error('Failed to initialize server room:', error);
    }
  }

  private async getUserDisplayName(userId: string): Promise<string> {
    // In production, fetch from user service
    return `User ${userId}`;
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    const ua = navigator.userAgent;
    return {
      browser: this.detectBrowser(ua),
      os: this.detectOS(ua),
      deviceType: this.detectDeviceType(ua)
    };
  }

  private detectBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private detectDeviceType(ua: string): DeviceInfo['deviceType'] {
    if (ua.includes('Mobile')) return 'mobile';
    if (ua.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private async getNetworkStats(): Promise<NetworkStats> {
    // In production, would measure actual network stats
    return {
      latency: 20,
      jitter: 5,
      packetLoss: 0.01,
      bandwidth: {
        upload: 10000000, // 10 Mbps
        download: 50000000 // 50 Mbps
      },
      connectionType: 'wifi'
    };
  }

  private getTherapeuticBackgrounds(): TherapeuticBackground[] {
    return [
      {
        id: 'calm-ocean',
        name: 'Calm Ocean',
        type: 'nature',
        imageUrl: '/backgrounds/calm-ocean.jpg',
        recommended: true
      },
      {
        id: 'forest-path',
        name: 'Forest Path',
        type: 'nature',
        imageUrl: '/backgrounds/forest-path.jpg',
        recommended: true
      },
      {
        id: 'soft-gradient',
        name: 'Soft Gradient',
        type: 'abstract',
        imageUrl: '/backgrounds/soft-gradient.jpg',
        recommended: false
      },
      {
        id: 'therapy-office',
        name: 'Therapy Office',
        type: 'office',
        imageUrl: '/backgrounds/therapy-office.jpg',
        recommended: true
      }
    ];
  }

  private initializeMetrics(): SessionMetrics {
    return {
      videoQualityScore: 0,
      audioQualityScore: 0,
      connectionStability: 0,
      userExperienceScore: 0,
      engagementMetrics: {
        speakingTime: new Map(),
        attentionScore: 0,
        interactionCount: 0,
        emotionalTone: 'neutral',
        therapeuticRapport: 0
      },
      technicalMetrics: {
        totalBandwidthUsed: 0,
        averageLatency: 0,
        reconnectionCount: 0,
        qualityChanges: 0,
        errorCount: 0,
        cpuUsage: 0,
        memoryUsage: 0
      }
    };
  }

  private initializeFeatures(): SessionFeatures {
    return {
      aiTranscription: {
        enabled: true,
        realtime: true,
        language: 'en',
        accuracy: 0.95,
        speakerIdentification: true,
        medicalTerminology: true,
        summaryGeneration: true
      },
      emotionDetection: {
        enabled: false,
        facialRecognition: false,
        voiceToneAnalysis: true,
        confidenceThreshold: 0.7,
        privacyMode: true
      },
      therapistTools: {
        notesTaking: true,
        assessmentForms: true,
        resourceSharing: true,
        sessionPlanning: true,
        progressTracking: true,
        interventionSuggestions: true
      },
      accessibility: {
        signLanguageInterpreter: false,
        liveCaptions: true,
        transcriptAvailable: true,
        highContrast: false,
        keyboardNavigation: true,
        screenReaderCompatible: true
      },
      collaboration: {
        whiteboard: true,
        documentSharing: true,
        breakoutRooms: false,
        polls: true,
        reactions: true,
        handRaising: true
      }
    };
  }

  private initializeSecurityFeatures(): SecurityFeatures {
    return {
      endToEndEncryption: true,
      hipaaCompliant: true,
      dataResidency: 'us-west',
      accessControl: {
        requireAuthentication: true,
        twoFactorRequired: false,
        ipWhitelisting: [],
        deviceWhitelisting: [],
        geoRestrictions: []
      },
      auditLogging: true,
      sessionPinRequired: false,
      biometricVerification: false
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRoomId(): string {
    return `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecordingId(): string {
    return `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnnotationId(): string {
    return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAuthToken(): string {
    // In production, get from auth service
    return localStorage.getItem('authToken') || '';
  }
}

// Export singleton instance
export const videoSessionService = VideoSessionService.getInstance();

// Export convenience functions
export const createVideoSession = (
  therapistId: string,
  patientId: string,
  settings?: Partial<VideoSessionSettings>
) => videoSessionService.createSession(therapistId, patientId, settings);

export const joinVideoSession = (
  sessionId: string,
  userId: string,
  role: Participant['role']
) => videoSessionService.joinSession(sessionId, userId, role);

export const startScreenShare = (sessionId: string, userId: string) =>
  videoSessionService.startScreenShare(sessionId, userId);

export const startSessionRecording = (sessionId: string, userId: string) =>
  videoSessionService.startRecording(sessionId, userId);

export const endVideoSession = (sessionId: string) =>
  videoSessionService.endSession(sessionId);