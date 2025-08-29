import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewProps } from '../types';
import { MicOnIcon, MicOffIcon, VideoOnIcon, VideoOffIcon, HangUpIcon } from '../components/icons.dynamic';
import { AppButton } from '../components/AppButton';
import { useNotification } from '../contexts/NotificationContext';

interface VideoChatViewProps extends ViewProps {
  sessionId?: string;
  partnerId?: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system';
}

const VideoChatView: React.FC<VideoChatViewProps> = ({ 
  sessionId, 
  partnerId, 
  onClose 
}) => {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    initializeVideoChat();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      startCallTimer();
    } else {
      stopCallTimer();
    }
  }, [isConnected]);

  const initializeVideoChat = async () => {
    try {
      setConnectionStatus('Requesting camera and microphone access...');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionStatus('Setting up connection...');
      
      // Initialize peer connection
      await setupPeerConnection();
      
      setConnectionStatus('Connecting to peer...');
      
      // Simulate connection process
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('Connected');
                 showNotification('Video call connected successfully', 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error initializing video chat:', error);
      setConnectionStatus('Failed to connect');
      setIsConnecting(false);
             showNotification('Failed to access camera or microphone', 'error');
    }
  };

  const setupPeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer
        console.log('ICE candidate:', event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      
      switch (peerConnection.connectionState) {
        case 'connected':
          setIsConnected(true);
          setConnectionStatus('Connected');
          break;
        case 'disconnected':
          setIsConnected(false);
          setConnectionStatus('Disconnected');
          break;
        case 'failed':
          setConnectionStatus('Connection failed');
          showNotification('Connection failed', 'error');
          break;
      }
    };
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const formatCallDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
                 showNotification(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted', 'info');
      }
    }
  }, [showNotification]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
                 showNotification(videoTrack.enabled ? 'Camera turned on' : 'Camera turned off', 'info');
      }
    }
  }, [showNotification]);

  const endCall = useCallback(() => {
    cleanup();
         showNotification('Call ended', 'info');
    onClose();
  }, [onClose, showNotification]);

  const cleanup = () => {
    stopCallTimer();
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'current-user',
        message: newMessage.trim(),
        timestamp: new Date(),
        type: 'text'
      };
      
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // TODO: Send message to remote peer
    }
  };

  return (
    <div className="video-chat-view">
      <div className="video-chat-header">
        <div className="call-info">
          <h2>Video Call</h2>
          {isConnected && (
            <span className="call-duration">{formatCallDuration(callDuration)}</span>
          )}
        </div>
        <div className="connection-status">
          <span className={`status ${isConnected ? 'connected' : 'connecting'}`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      <div className="video-container">
        <div className="remote-video-container">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
          {!isConnected && (
            <div className="video-placeholder">
              <div className="connecting-animation">
                <div className="spinner"></div>
                <p>{connectionStatus}</p>
              </div>
            </div>
          )}
        </div>

        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`local-video ${isCameraOff ? 'camera-off' : ''}`}
          />
          {isCameraOff && (
            <div className="camera-off-indicator">
              <VideoOffIcon />
            </div>
          )}
        </div>
      </div>

      <div className="video-controls">
        <div className="control-buttons">
          <button
            className={`control-button ${isMicMuted ? 'muted' : ''}`}
            onClick={toggleMicrophone}
            disabled={isConnecting}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMicMuted ? <MicOffIcon /> : <MicOnIcon />}
          </button>

          <button
            className={`control-button ${isCameraOff ? 'off' : ''}`}
            onClick={toggleCamera}
            disabled={isConnecting}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? <VideoOffIcon /> : <VideoOnIcon />}
          </button>

          <button
            className="control-button end-call"
            onClick={endCall}
            title="End call"
          >
            <HangUpIcon />
          </button>
        </div>

        <div className="secondary-controls">
          <AppButton
            variant="secondary"
            size="small"
            onClick={() => setShowChat(!showChat)}
          >
            Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
          </AppButton>
        </div>
      </div>

      {showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Chat</h3>
            <button 
              className="close-chat"
              onClick={() => setShowChat(false)}
            >
              ×
            </button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              chatMessages.map(message => (
                <div 
                  key={message.id} 
                  className={`message ${message.senderId === 'current-user' ? 'own' : 'other'}`}
                >
                  <div className="message-content">{message.message}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form className="chat-input" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!isConnected}
            />
            <AppButton
              type="submit"
              size="small"
              disabled={!newMessage.trim() || !isConnected}
            >
              Send
            </AppButton>
          </form>
        </div>
      )}
    </div>
  );
};

export default VideoChatView;