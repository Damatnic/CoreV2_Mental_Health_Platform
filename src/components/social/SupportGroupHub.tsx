/**
 * SupportGroupHub Component - Central hub for support group discovery and management
 * Includes group chat, event scheduling, and resource sharing with safety features
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  forumService,
  SupportGroup,
  GroupType,
  ForumCategory,
  GroupEvent,
  GroupResource,
  GroupMember,
  MemberRole,
  EventType,
  ResourceType
} from '../../services/social/forumService';
import { useCrisisDetection } from '../../hooks/useCrisisDetection';
import { formatDistanceToNow, format, addDays, isFuture } from 'date-fns';
import './SupportGroupHub.css';

interface SupportGroupHubProps {
  userId: string;
  userRole?: 'member' | 'helper' | 'professional';
}

interface GroupMessage {
  id: string;
  groupId: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isAnonymous: boolean;
  reactions?: { [emoji: string]: string[] };
}

const SupportGroupHub: React.FC<SupportGroupHubProps> = ({
  userId,
  userRole = 'member'
}) => {
  // State Management
  const [groups, setGroups] = useState<SupportGroup[]>([]);
  const [myGroups, setMyGroups] = useState<SupportGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SupportGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups' | 'create'>('discover');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Group Discovery Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | undefined>();
  const [selectedType, setSelectedType] = useState<GroupType | undefined>();
  const [showPrivateGroups, setShowPrivateGroups] = useState(false);
  
  // Group Creation
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState<Partial<SupportGroup>>({
    name: '',
    description: '',
    type: GroupType.PEER_SUPPORT,
    category: ForumCategory.GENERAL,
    isPrivate: false,
    requiresApproval: false,
    maxMembers: 50,
    rules: [],
    settings: {
      allowAnonymous: true,
      requireIntroduction: false,
      autoModeration: true,
      contentFilters: []
    }
  });
  
  // Group Chat
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Event Management
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<GroupEvent>>({
    title: '',
    description: '',
    type: EventType.GROUP_SESSION,
    startTime: new Date(),
    endTime: addDays(new Date(), 1)
  });
  
  // Resource Management
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResource, setNewResource] = useState<Partial<GroupResource>>({
    title: '',
    description: '',
    type: ResourceType.DOCUMENT
  });
  
  // Member Management
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  // Crisis Detection
  const { checkContent } = useCrisisDetection();

  // Load groups on mount
  useEffect(() => {
    loadGroups();
    loadMyGroups();
  }, []);

  // Filter groups based on search and filters
  useEffect(() => {
    filterGroups();
  }, [searchQuery, selectedCategory, selectedType, showPrivateGroups]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadGroups = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const groupList = await forumService.getSupportGroups({
        category: selectedCategory,
        type: selectedType,
        isPrivate: showPrivateGroups ? undefined : false
      });
      setGroups(groupList);
    } catch (err) {
      setError('Failed to load support groups. Please try again.');
      console.error('Error loading groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyGroups = async () => {
    try {
      // This would typically fetch groups the user is a member of
      const myGroupList = await forumService.getSupportGroups();
      // Filter for groups where user is a member
      const userGroups = myGroupList.filter(group => 
        group.members.some(member => member.userId === userId)
      );
      setMyGroups(userGroups);
    } catch (err) {
      console.error('Error loading my groups:', err);
    }
  };

  const filterGroups = () => {
    let filtered = [...groups];
    
    if (searchQuery) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(group => group.category === selectedCategory);
    }
    
    if (selectedType) {
      filtered = filtered.filter(group => group.type === selectedType);
    }
    
    if (!showPrivateGroups) {
      filtered = filtered.filter(group => !group.isPrivate);
    }
    
    return filtered;
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.description) {
      setError('Please provide a name and description for the group.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const createdGroup = await forumService.createSupportGroup({
        ...newGroup,
        createdBy: userId,
        members: [{
          userId,
          role: MemberRole.ADMIN,
          joinedAt: new Date(),
          isAnonymous: false
        }],
        moderators: [userId]
      });
      
      // Add to my groups
      setMyGroups(prev => [...prev, createdGroup]);
      
      // Reset form and switch to my groups
      setNewGroup({
        name: '',
        description: '',
        type: GroupType.PEER_SUPPORT,
        category: ForumCategory.GENERAL,
        isPrivate: false,
        requiresApproval: false,
        maxMembers: 50,
        rules: [],
        settings: {
          allowAnonymous: true,
          requireIntroduction: false,
          autoModeration: true,
          contentFilters: []
        }
      });
      
      setActiveTab('my-groups');
      setSelectedGroup(createdGroup);
      
      showNotification('Group created successfully!', 'success');
    } catch (err) {
      setError('Failed to create group. Please try again.');
      console.error('Error creating group:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (group: SupportGroup) => {
    setIsLoading(true);
    
    try {
      const useAnonymous = group.settings.allowAnonymous && 
        window.confirm('Would you like to join this group anonymously?');
      
      await forumService.joinSupportGroup(group.id, useAnonymous);
      
      // Update local state
      setMyGroups(prev => [...prev, group]);
      
      showNotification(`Successfully joined ${group.name}!`, 'success');
    } catch (err) {
      setError('Failed to join group. Please try again.');
      console.error('Error joining group:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await forumService.leaveSupportGroup(groupId);
      
      // Update local state
      setMyGroups(prev => prev.filter(g => g.id !== groupId));
      
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      
      showNotification('You have left the group.', 'info');
    } catch (err) {
      setError('Failed to leave group. Please try again.');
      console.error('Error leaving group:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;
    
    // Check for crisis content
    if (checkContent(newMessage)) {
      showSupportiveMessage();
    }
    
    // Create message object
    const message: GroupMessage = {
      id: Date.now().toString(),
      groupId: selectedGroup.id,
      sender: userId,
      senderName: 'You', // Would be fetched from user profile
      content: newMessage,
      timestamp: new Date(),
      isAnonymous: false
    };
    
    // Add to messages
    setMessages(prev => [...prev, message]);
    
    // Clear input
    setNewMessage('');
    
    // Send to server (would use WebSocket in production)
    try {
      // await forumService.sendGroupMessage(message);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing indicator
    // This would emit to WebSocket in production
    
    // Clear typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      // Clear typing indicator
    }, 2000);
  };

  const handleScheduleEvent = async () => {
    if (!selectedGroup || !newEvent.title || !newEvent.startTime) {
      setError('Please provide event details.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const event = await forumService.scheduleGroupEvent(selectedGroup.id, newEvent);
      
      // Update group events
      setSelectedGroup(prev => prev ? {
        ...prev,
        events: [...prev.events, event]
      } : null);
      
      // Reset form and close modal
      setNewEvent({
        title: '',
        description: '',
        type: EventType.GROUP_SESSION,
        startTime: new Date(),
        endTime: addDays(new Date(), 1)
      });
      setShowEventModal(false);
      
      showNotification('Event scheduled successfully!', 'success');
    } catch (err) {
      setError('Failed to schedule event. Please try again.');
      console.error('Error scheduling event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      await forumService.joinGroupEvent(eventId);
      
      // Update event attendees
      setSelectedGroup(prev => prev ? {
        ...prev,
        events: prev.events.map(event => 
          event.id === eventId 
            ? { ...event, attendees: [...event.attendees, userId] }
            : event
        )
      } : null);
      
      showNotification('You have joined the event!', 'success');
    } catch (err) {
      console.error('Error joining event:', err);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const showSupportiveMessage = () => {
    const message = document.createElement('div');
    message.className = 'supportive-overlay';
    message.innerHTML = `
      <div class="supportive-content">
        <h3>We're here for you</h3>
        <p>It seems like you might be going through something difficult.</p>
        <p>Remember, seeking help is a sign of strength.</p>
        <div class="supportive-actions">
          <button onclick="window.location.href='/crisis-support'">Get Immediate Support</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()">Continue</button>
        </div>
      </div>
    `;
    document.body.appendChild(message);
  };

  const getGroupTypeIcon = (type: GroupType) => {
    const icons = {
      [GroupType.PEER_SUPPORT]: '🤝',
      [GroupType.RECOVERY]: '🌱',
      [GroupType.THERAPY]: '💭',
      [GroupType.EDUCATIONAL]: '📚',
      [GroupType.CRISIS_SUPPORT]: '🆘'
    };
    return icons[type] || '👥';
  };

  const getCategoryColor = (category: ForumCategory) => {
    const colors = {
      [ForumCategory.ANXIETY]: '#9333ea',
      [ForumCategory.DEPRESSION]: '#3b82f6',
      [ForumCategory.TRAUMA]: '#ef4444',
      [ForumCategory.SELF_CARE]: '#10b981',
      [ForumCategory.RELATIONSHIPS]: '#f59e0b',
      [ForumCategory.GENERAL]: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  return (
    <div className="support-group-hub">
      {/* Header */}
      <header className="hub-header">
        <h1>Support Groups</h1>
        <p>Find your community and connect with others who understand</p>
      </header>

      {/* Navigation Tabs */}
      <nav className="hub-nav">
        <button
          className={activeTab === 'discover' ? 'active' : ''}
          onClick={() => setActiveTab('discover')}
        >
          🔍 Discover Groups
        </button>
        <button
          className={activeTab === 'my-groups' ? 'active' : ''}
          onClick={() => setActiveTab('my-groups')}
        >
          👥 My Groups ({myGroups.length})
        </button>
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create Group
        </button>
      </nav>

      {/* Main Content */}
      <div className="hub-content">
        {/* Discover Groups Tab */}
        {activeTab === 'discover' && (
          <div className="discover-section">
            {/* Filters */}
            <div className="filters-bar">
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value as ForumCategory || undefined)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {Object.values(ForumCategory).map(cat => (
                  <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                ))}
              </select>
              
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value as GroupType || undefined)}
                className="filter-select"
              >
                <option value="">All Types</option>
                {Object.values(GroupType).map(type => (
                  <option key={type} value={type}>{type.replace('-', ' ')}</option>
                ))}
              </select>
              
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={showPrivateGroups}
                  onChange={(e) => setShowPrivateGroups(e.target.checked)}
                />
                Show Private Groups
              </label>
            </div>

            {/* Groups Grid */}
            <div className="groups-grid">
              {isLoading ? (
                <div className="loading">Loading groups...</div>
              ) : (
                filterGroups().map(group => (
                  <div key={group.id} className="group-card">
                    <div className="group-header">
                      <span className="group-icon">{getGroupTypeIcon(group.type)}</span>
                      <div className="group-badges">
                        {group.isPrivate && <span className="badge badge-private">Private</span>}
                        {group.requiresApproval && <span className="badge badge-approval">Requires Approval</span>}
                      </div>
                    </div>
                    
                    <h3>{group.name}</h3>
                    <p className="group-description">{group.description}</p>
                    
                    <div className="group-meta">
                      <span 
                        className="category-tag"
                        style={{ backgroundColor: getCategoryColor(group.category) }}
                      >
                        {group.category}
                      </span>
                      <span className="member-count">
                        👥 {group.members.length}
                        {group.maxMembers && `/${group.maxMembers}`} members
                      </span>
                    </div>
                    
                    <div className="group-activity">
                      <span>Last active: {formatDistanceToNow(new Date(group.lastActivity), { addSuffix: true })}</span>
                    </div>
                    
                    <button
                      className="join-button"
                      onClick={() => handleJoinGroup(group)}
                      disabled={myGroups.some(g => g.id === group.id)}
                    >
                      {myGroups.some(g => g.id === group.id) ? 'Joined' : 'Join Group'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* My Groups Tab */}
        {activeTab === 'my-groups' && (
          <div className="my-groups-section">
            {myGroups.length === 0 ? (
              <div className="empty-state">
                <h2>No Groups Yet</h2>
                <p>Join a support group to connect with others on similar journeys</p>
                <button onClick={() => setActiveTab('discover')}>
                  Discover Groups
                </button>
              </div>
            ) : (
              <div className="my-groups-layout">
                {/* Groups List */}
                <aside className="groups-sidebar">
                  <h2>Your Groups</h2>
                  {myGroups.map(group => (
                    <div
                      key={group.id}
                      className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <span className="group-icon">{getGroupTypeIcon(group.type)}</span>
                      <div className="group-info">
                        <h4>{group.name}</h4>
                        <span className="member-count">{group.members.length} members</span>
                      </div>
                    </div>
                  ))}
                </aside>

                {/* Selected Group Details */}
                {selectedGroup && (
                  <main className="group-details">
                    <div className="group-header-detail">
                      <h2>{selectedGroup.name}</h2>
                      <p>{selectedGroup.description}</p>
                      
                      <div className="group-actions">
                        <button onClick={() => setShowMemberModal(true)}>
                          👥 Members ({selectedGroup.members.length})
                        </button>
                        <button onClick={() => setShowEventModal(true)}>
                          📅 Schedule Event
                        </button>
                        <button onClick={() => setShowResourceModal(true)}>
                          📚 Add Resource
                        </button>
                        <button 
                          className="leave-button"
                          onClick={() => handleLeaveGroup(selectedGroup.id)}
                        >
                          Leave Group
                        </button>
                      </div>
                    </div>

                    {/* Group Chat */}
                    <div className="group-chat">
                      <div className="chat-header">
                        <h3>Group Chat</h3>
                        <span className="online-count">
                          🟢 {Math.floor(Math.random() * 10) + 1} online
                        </span>
                      </div>
                      
                      <div className="chat-messages" ref={chatContainerRef}>
                        {messages.length === 0 ? (
                          <div className="no-messages">
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          messages.map(msg => (
                            <div 
                              key={msg.id} 
                              className={`message ${msg.sender === userId ? 'own-message' : ''}`}
                            >
                              <div className="message-header">
                                <span className="sender-name">
                                  {msg.isAnonymous ? '🎭 Anonymous' : msg.senderName}
                                </span>
                                <span className="message-time">
                                  {format(new Date(msg.timestamp), 'HH:mm')}
                                </span>
                              </div>
                              <p className="message-content">{msg.content}</p>
                            </div>
                          ))
                        )}
                        
                        {/* Typing indicators */}
                        {Object.entries(isTyping).filter(([id, typing]) => typing && id !== userId).map(([id]) => (
                          <div key={id} className="typing-indicator">
                            <span>Someone is typing...</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="chat-input">
                        <input
                          type="text"
                          placeholder="Type a supportive message..."
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage}>Send</button>
                      </div>
                    </div>

                    {/* Upcoming Events */}
                    {selectedGroup.events.length > 0 && (
                      <div className="group-events">
                        <h3>Upcoming Events</h3>
                        <div className="events-list">
                          {selectedGroup.events
                            .filter(event => isFuture(new Date(event.startTime)))
                            .map(event => (
                              <div key={event.id} className="event-card">
                                <h4>{event.title}</h4>
                                <p>{event.description}</p>
                                <div className="event-details">
                                  <span>📅 {format(new Date(event.startTime), 'MMM dd, yyyy')}</span>
                                  <span>⏰ {format(new Date(event.startTime), 'HH:mm')}</span>
                                  <span>👥 {event.attendees.length} attending</span>
                                </div>
                                <button
                                  onClick={() => handleJoinEvent(event.id)}
                                  disabled={event.attendees.includes(userId)}
                                >
                                  {event.attendees.includes(userId) ? 'Attending' : 'Join Event'}
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Group Resources */}
                    {selectedGroup.resources.length > 0 && (
                      <div className="group-resources">
                        <h3>Resources</h3>
                        <div className="resources-list">
                          {selectedGroup.resources.map(resource => (
                            <div key={resource.id} className="resource-item">
                              <span className="resource-icon">
                                {resource.type === ResourceType.VIDEO ? '🎥' :
                                 resource.type === ResourceType.AUDIO ? '🎵' :
                                 resource.type === ResourceType.LINK ? '🔗' : '📄'}
                              </span>
                              <div className="resource-info">
                                <h4>{resource.title}</h4>
                                <p>{resource.description}</p>
                              </div>
                              {resource.url && (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </main>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create Group Tab */}
        {activeTab === 'create' && (
          <div className="create-group-section">
            <h2>Create a Support Group</h2>
            <p>Start a safe space for others to connect and support each other</p>
            
            <form className="create-group-form" onSubmit={(e) => {
              e.preventDefault();
              handleCreateGroup();
            }}>
              <div className="form-group">
                <label htmlFor="group-name">Group Name *</label>
                <input
                  id="group-name"
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Anxiety Warriors, Depression Support Circle"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="group-description">Description *</label>
                <textarea
                  id="group-description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and goals of your support group..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="group-category">Category</label>
                  <select
                    id="group-category"
                    value={newGroup.category}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, category: e.target.value as ForumCategory }))}
                  >
                    {Object.values(ForumCategory).map(cat => (
                      <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="group-type">Type</label>
                  <select
                    id="group-type"
                    value={newGroup.type}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, type: e.target.value as GroupType }))}
                  >
                    {Object.values(GroupType).map(type => (
                      <option key={type} value={type}>{type.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="max-members">Max Members</label>
                  <input
                    id="max-members"
                    type="number"
                    value={newGroup.maxMembers}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                    min="2"
                    max="500"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="group-rules">Group Rules (one per line)</label>
                <textarea
                  id="group-rules"
                  value={newGroup.rules?.join('\n')}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, rules: e.target.value.split('\n').filter(r => r.trim()) }))}
                  placeholder="e.g., Be respectful and supportive&#10;No medical advice&#10;Maintain confidentiality"
                  rows={4}
                />
              </div>
              
              <div className="form-settings">
                <h3>Privacy & Safety Settings</h3>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newGroup.isPrivate}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  />
                  Private Group (not visible in public listings)
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newGroup.requiresApproval}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                  />
                  Require Approval to Join
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newGroup.settings?.allowAnonymous}
                    onChange={(e) => setNewGroup(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings!, allowAnonymous: e.target.checked }
                    }))}
                  />
                  Allow Anonymous Participation
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newGroup.settings?.requireIntroduction}
                    onChange={(e) => setNewGroup(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings!, requireIntroduction: e.target.checked }
                    }))}
                  />
                  Require Introduction Post
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newGroup.settings?.autoModeration}
                    onChange={(e) => setNewGroup(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings!, autoModeration: e.target.checked }
                    }))}
                  />
                  Enable Automatic Content Moderation
                </label>
              </div>
              
              <div className="form-actions">
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Group'}
                </button>
                <button type="button" onClick={() => setActiveTab('discover')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Schedule Group Event</h3>
            
            <div className="form-group">
              <label>Event Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Weekly Check-in, Meditation Session"
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What will happen during this event?"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>Event Type</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as EventType }))}
              >
                {Object.values(EventType).map(type => (
                  <option key={type} value={type}>{type.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.startTime ? format(newEvent.startTime, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
                />
              </div>
              
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.endTime ? format(newEvent.endTime, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: new Date(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button onClick={handleScheduleEvent} disabled={isLoading}>
                Schedule Event
              </button>
              <button onClick={() => setShowEventModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default SupportGroupHub;