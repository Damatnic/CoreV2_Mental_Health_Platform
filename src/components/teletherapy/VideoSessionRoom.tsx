/**
 * VideoSessionRoom Component
 * HIPAA-compliant video session interface with comprehensive controls
 * Includes emergency features and accessibility support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaVideo, 
  FaVideoSlash, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaDesktop,
  FaComments,
  FaRecordVinyl,
  FaPaintBrush,
  FaExpand,
  FaCompress,
  FaPhoneSlash,
  FaCog,
  FaExclamationTriangle,
  FaWifi,
  FaImage
} from 'react-icons/fa';
import { teletherapyService, SessionMetrics } from '../../services/teletherapy/teletherapyService';
import '../../styles/teletherapy.css';

interface VideoSessionRoomProps {
  appointmentId: string;
  onSessionEnd?: () => void;
  onEmergencyExit?: () => void;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: 'local' | 'remote';
  timestamp: string;
}

interface VirtualBackground {
  id: string;
  name: string;
  url: string;
}

const VideoSessionRoom: React.FC<VideoSessionRoomProps> = ({
  appointmentId,
  onSessionEnd,
  onEmergencyExit
}) => {
  // Media state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [connectionQuality, setConnectionQuality] = useState<SessionMetrics['connectionQuality']>('good');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Virtual backgrounds
  const virtualBackgrounds: VirtualBackground[] = [
    { id: 'none', name: 'None', url: '' },
    { id: 'blur', name: 'Blur', url: 'blur' },
    { id: 'office', name: 'Office', url: '/backgrounds/office.jpg' },
    { id: 'nature', name: 'Nature', url: '/backgrounds/nature.jpg' },
    { id: 'abstract', name: 'Abstract', url: '/backgrounds/abstract.jpg' }
  ];

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    initializeSession();

    // Start session timer
    sessionTimerRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => {
      // Cleanup on unmount
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      teletherapyService.endSession();
    };
  }, [appointmentId]);

  /**
   * Initialize teletherapy session
   */
  const initializeSession = async () => {
    try {
      // Set up event listeners
      teletherapyService.on('localStreamReady', handleLocalStream);
      teletherapyService.on('remoteStreamReady', handleRemoteStream);
      teletherapyService.on('metricsUpdate', handleMetricsUpdate);
      teletherapyService.on('chatMessageReceived', handleChatMessageReceived);
      teletherapyService.on('whiteboardDataReceived', handleWhiteboardData);
      teletherapyService.on('connectionStateChange', handleConnectionStateChange);
      teletherapyService.on('sessionError', handleSessionError);

      // Initialize the session
      await teletherapyService.initializeSession(appointmentId, {
        enableVideo: isVideoEnabled,
        enableAudio: isAudioEnabled,
        enableScreenShare: false,
        enableRecording: false,
        enableWhiteboard: false
      });
    } catch (error) {
      console.error('Failed to initialize session:', error);
      alert('Failed to start video session. Please check your camera and microphone permissions.');
    }
  };

  /**
   * Handle local stream ready
   */
  const handleLocalStream = (stream: MediaStream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  /**
   * Handle remote stream ready
   */
  const handleRemoteStream = (stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  };

  /**
   * Handle metrics update
   */
  const handleMetricsUpdate = (metrics: SessionMetrics) => {
    setConnectionQuality(metrics.connectionQuality);
  };

  /**
   * Handle incoming chat message
   */
  const handleChatMessageReceived = (message: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message.message,
      sender: 'remote',
      timestamp: message.timestamp
    };
    setChatMessages(prev => [...prev, newMessage]);
    
    // Auto-scroll to bottom
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }

    // Show notification if chat is closed
    if (!isChatOpen) {
      // Could add a badge or notification here
    }
  };

  /**
   * Handle whiteboard data
   */
  const handleWhiteboardData = (data: any) => {
    if (canvasRef.current && isWhiteboardActive) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Draw received whiteboard data
        // Implementation depends on whiteboard library
      }
    }
  };

  /**
   * Handle connection state changes
   */
  const handleConnectionStateChange = (state: string) => {
    if (state === 'failed' || state === 'disconnected') {
      // Show reconnecting indicator
    } else if (state === 'connected') {
      // Hide reconnecting indicator
    }
  };

  /**
   * Handle session errors
   */
  const handleSessionError = (error: any) => {
    console.error('Session error:', error);
    alert('An error occurred during the session. Please check your connection.');
  };

  /**
   * Toggle video on/off
   */
  const toggleVideo = useCallback(() => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    
    // Get local video track and enable/disable
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  }, [isVideoEnabled]);

  /**
   * Toggle audio on/off
   */
  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    
    // Get local audio track and enable/disable
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  }, [isAudioEnabled]);

  /**
   * Toggle screen sharing
   */
  const toggleScreenShare = useCallback(async () => {
    try {
      const newState = !isScreenSharing;
      await teletherapyService.toggleScreenShare(newState);
      setIsScreenSharing(newState);
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
      alert('Failed to share screen. Please try again.');
    }
  }, [isScreenSharing]);

  /**
   * Toggle recording with consent check
   */
  const toggleRecording = useCallback(async () => {
    if (!isRecording && !recordingConsent) {
      // Show consent dialog
      const consent = window.confirm(
        'Recording requires consent from all participants. By proceeding, you confirm that all participants have consented to recording this session. Continue?'
      );
      
      if (!consent) return;
      
      setRecordingConsent(true);
    }

    try {
      await teletherapyService.toggleRecording(recordingConsent || isRecording);
      setIsRecording(!isRecording);
    } catch (error) {
      console.error('Failed to toggle recording:', error);
      alert('Failed to start/stop recording. Please try again.');
    }
  }, [isRecording, recordingConsent]);

  /**
   * Toggle whiteboard
   */
  const toggleWhiteboard = useCallback(() => {
    setIsWhiteboardActive(!isWhiteboardActive);
  }, [isWhiteboardActive]);

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  /**
   * Send chat message
   */
  const sendChatMessage = useCallback(() => {
    if (currentMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        message: currentMessage,
        sender: 'local',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, message]);
      teletherapyService.sendChatMessage(currentMessage);
      setCurrentMessage('');
      
      // Auto-scroll to bottom
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, [currentMessage]);

  /**
   * Handle emergency exit
   */
  const handleEmergencyExit = useCallback(async () => {
    setShowEmergencyConfirm(true);
  }, []);

  /**
   * Confirm emergency exit
   */
  const confirmEmergencyExit = useCallback(async () => {
    try {
      await teletherapyService.endSession();
      if (onEmergencyExit) {
        onEmergencyExit();
      } else if (onSessionEnd) {
        onSessionEnd();
      }
    } catch (error) {
      console.error('Error during emergency exit:', error);
      // Force exit even if there's an error
      if (onEmergencyExit) {
        onEmergencyExit();
      }
    }
  }, [onEmergencyExit, onSessionEnd]);

  /**
   * End session normally
   */
  const endSession = useCallback(async () => {
    const confirmEnd = window.confirm('Are you sure you want to end this session?');
    if (confirmEnd) {
      try {
        await teletherapyService.endSession();
        if (onSessionEnd) {
          onSessionEnd();
        }
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  }, [onSessionEnd]);

  /**
   * Apply virtual background
   */
  const applyVirtualBackground = useCallback((backgroundId: string) => {
    setSelectedBackground(backgroundId);
    // Implementation would involve canvas manipulation and MediaStream processing
    // This is a placeholder for the actual implementation
  }, []);

  /**
   * Format session duration
   */
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get connection quality indicator color
   */
  const getQualityColor = (quality: SessionMetrics['connectionQuality']): string => {
    switch (quality) {
      case 'excellent': return '#4ade80';
      case 'good': return '#22c55e';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="video-session-room">
      {/* Main video area */}
      <div className="video-container">
        {/* Remote video (main view) */}
        <div className="remote-video-wrapper">
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
          />
          
          {/* Connection quality indicator */}
          <div className="connection-indicator" style={{ color: getQualityColor(connectionQuality) }}>
            <FaWifi />
            <span>{connectionQuality}</span>
          </div>

          {/* Session duration */}
          <div className="session-duration">
            {formatDuration(sessionDuration)}
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="recording-indicator">
              <FaRecordVinyl className="recording-icon" />
              <span>Recording</span>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="local-video-wrapper">
          <video
            ref={localVideoRef}
            className="local-video"
            autoPlay
            playsInline
            muted
          />
        </div>

        {/* Whiteboard overlay */}
        {isWhiteboardActive && (
          <div className="whiteboard-overlay">
            <canvas
              ref={canvasRef}
              className="whiteboard-canvas"
              width={1280}
              height={720}
            />
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="control-bar">
        <div className="control-group">
          {/* Video toggle */}
          <button
            className={`control-button ${!isVideoEnabled ? 'disabled' : ''}`}
            onClick={toggleVideo}
            aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>

          {/* Audio toggle */}
          <button
            className={`control-button ${!isAudioEnabled ? 'disabled' : ''}`}
            onClick={toggleAudio}
            aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>

          {/* Screen share toggle */}
          <button
            className={`control-button ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          >
            <FaDesktop />
          </button>

          {/* Recording toggle */}
          <button
            className={`control-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <FaRecordVinyl />
          </button>

          {/* Whiteboard toggle */}
          <button
            className={`control-button ${isWhiteboardActive ? 'active' : ''}`}
            onClick={toggleWhiteboard}
            aria-label={isWhiteboardActive ? 'Close whiteboard' : 'Open whiteboard'}
          >
            <FaPaintBrush />
          </button>

          {/* Chat toggle */}
          <button
            className={`control-button ${isChatOpen ? 'active' : ''}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
            aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
          >
            <FaComments />
            {chatMessages.length > 0 && !isChatOpen && (
              <span className="chat-badge">{chatMessages.length}</span>
            )}
          </button>

          {/* Settings */}
          <button
            className="control-button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            aria-label="Settings"
          >
            <FaCog />
          </button>

          {/* Fullscreen toggle */}
          <button
            className="control-button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>

        <div className="control-group">
          {/* Emergency exit button */}
          <button
            className="emergency-exit-button"
            onClick={handleEmergencyExit}
            aria-label="Emergency exit"
          >
            <FaExclamationTriangle />
            <span>Emergency Exit</span>
          </button>

          {/* End call button */}
          <button
            className="end-call-button"
            onClick={endSession}
            aria-label="End session"
          >
            <FaPhoneSlash />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Chat sidebar */}
      {isChatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Session Chat</h3>
            <button
              className="chat-close"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          
          <div className="chat-messages" ref={chatContainerRef}>
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`chat-message ${msg.sender}`}
              >
                <div className="message-content">{msg.message}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <button
              className="chat-send"
              onClick={sendChatMessage}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {isSettingsOpen && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Session Settings</h3>
            <button
              className="settings-close"
              onClick={() => setIsSettingsOpen(false)}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>
          
          <div className="settings-content">
            <div className="settings-section">
              <h4>Virtual Background</h4>
              <div className="background-options">
                {virtualBackgrounds.map(bg => (
                  <button
                    key={bg.id}
                    className={`background-option ${selectedBackground === bg.id ? 'selected' : ''}`}
                    onClick={() => applyVirtualBackground(bg.id)}
                  >
                    {bg.url && bg.url !== 'blur' ? (
                      <img src={bg.url} alt={bg.name} />
                    ) : (
                      <div className="background-placeholder">
                        {bg.id === 'blur' ? 'Blur' : 'None'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="settings-section">
              <h4>Audio Settings</h4>
              <label>
                <input type="checkbox" defaultChecked />
                Echo Cancellation
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                Noise Suppression
              </label>
            </div>
            
            <div className="settings-section">
              <h4>Video Quality</h4>
              <select defaultValue="720">
                <option value="360">360p</option>
                <option value="720">720p (HD)</option>
                <option value="1080">1080p (Full HD)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Emergency exit confirmation modal */}
      {showEmergencyConfirm && (
        <div className="emergency-confirm-modal">
          <div className="modal-content">
            <h3>Emergency Exit</h3>
            <p>
              Are you sure you want to immediately exit this session? 
              This action will end the session without saving.
            </p>
            <div className="modal-actions">
              <button
                className="confirm-button"
                onClick={confirmEmergencyExit}
              >
                Exit Now
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowEmergencyConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSessionRoom;