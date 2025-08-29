import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { 
  UserIcon, 
  SearchIcon, 
  BlockIcon, 
  UnblockIcon, 
  InfoIcon,
  FilterIcon,
  SortIcon
} from '../components/icons.dynamic';

interface BlockedUser {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  profileImage?: string;
  blockedAt: Date;
  blockedReason: string;
  blockType: 'user_initiated' | 'system_generated' | 'safety_block' | 'harassment_block';
  originalContext?: {
    chatId?: string;
    postId?: string;
    sessionId?: string;
    reportId?: string;
  };
  isActive: boolean;
  notes?: string;
}

interface BlockStats {
  totalBlocked: number;
  userInitiated: number;
  systemGenerated: number;
  safetyBlocks: number;
  harassmentBlocks: number;
  thisMonth: number;
}

const BlockedUsersView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<BlockedUser[]>([]);
  const [stats, setStats] = useState<BlockStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alphabetical'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
    loadBlockStats();
  }, [user]);

  useEffect(() => {
    filterAndSortUsers();
  }, [blockedUsers, searchQuery, filterType, sortBy, showInactive]);

  const loadBlockedUsers = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Mock blocked users data
      const mockBlockedUsers: BlockedUser[] = [
        {
          id: '1',
          userId: 'user123',
          username: 'troublemaker_99',
          displayName: 'Anonymous User',
          blockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          blockedReason: 'Inappropriate messages',
          blockType: 'user_initiated',
          originalContext: {
            chatId: 'chat456'
          },
          isActive: true,
          notes: 'Sent inappropriate messages during support chat'
        },
        {
          id: '2',
          userId: 'user456',
          username: 'spammer_user',
          displayName: 'Marketing Bot',
          blockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          blockedReason: 'Spam messages',
          blockType: 'system_generated',
          isActive: true,
          notes: 'Automatically blocked for sending spam content'
        },
        {
          id: '3',
          userId: 'user789',
          username: 'harasser_123',
          displayName: 'Blocked User',
          blockedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          blockedReason: 'Harassment and threats',
          blockType: 'harassment_block',
          originalContext: {
            reportId: 'report789'
          },
          isActive: true,
          notes: 'Multiple reports for harassment and threatening behavior'
        },
        {
          id: '4',
          userId: 'user101',
          username: 'safety_concern',
          displayName: 'Concerning User',
          blockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          blockedReason: 'Safety concerns',
          blockType: 'safety_block',
          originalContext: {
            sessionId: 'session123'
          },
          isActive: true,
          notes: 'Blocked due to concerning behavior during crisis support session'
        },
        {
          id: '5',
          userId: 'user202',
          username: 'unblocked_user',
          displayName: 'Reformed User',
          blockedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          blockedReason: 'Misunderstanding',
          blockType: 'user_initiated',
          isActive: false,
          notes: 'Unblocked after clarification - was a misunderstanding'
        }
      ];

      setBlockedUsers(mockBlockedUsers);
      
    } catch (error) {
      console.error('Error loading blocked users:', error);
      showNotification('Failed to load blocked users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlockStats = async () => {
    if (!user) return;
    
    try {
      // Mock stats
      const mockStats: BlockStats = {
        totalBlocked: 4,
        userInitiated: 2,
        systemGenerated: 1,
        safetyBlocks: 1,
        harassmentBlocks: 1,
        thisMonth: 2
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading block stats:', error);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...blockedUsers];

    // Apply active/inactive filter
    filtered = filtered.filter(user => showInactive || user.isActive);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query) ||
        user.blockedReason.toLowerCase().includes(query) ||
        user.notes?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.blockType === filterType);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.blockedAt).getTime() - new Date(b.blockedAt).getTime());
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
    }

    setFilteredUsers(filtered);
  };

  const handleUnblockUser = async (blockedUserId: string) => {
    const blockedUser = blockedUsers.find(u => u.id === blockedUserId);
    if (!blockedUser) return;

    if (!confirm(`Are you sure you want to unblock ${blockedUser.displayName}? They will be able to contact you again.`)) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBlockedUsers(prev => 
        prev.map(user => 
          user.id === blockedUserId 
            ? { ...user, isActive: false }
            : user
        )
      );
      
      showNotification(`${blockedUser.displayName} has been unblocked`, 'success');
      
      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          totalBlocked: prev.totalBlocked - 1
        } : null);
      }
      
    } catch (error) {
      console.error('Error unblocking user:', error);
      showNotification('Failed to unblock user', 'error');
    }
  };

  const handleBlockUser = async (username: string, reason: string) => {
    if (!username.trim()) {
      showNotification('Please enter a username', 'warning');
      return;
    }

    if (!reason.trim()) {
      showNotification('Please provide a reason for blocking', 'warning');
      return;
    }

    try {
      // Simulate API call to block user
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBlockedUser: BlockedUser = {
        id: Date.now().toString(),
        userId: `user_${Date.now()}`,
        username: username.trim(),
        displayName: username.trim(),
        blockedAt: new Date(),
        blockedReason: reason,
        blockType: 'user_initiated',
        isActive: true,
        notes: `Manually blocked by user: ${reason}`
      };
      
      setBlockedUsers(prev => [newBlockedUser, ...prev]);
      showNotification(`${username} has been blocked`, 'success');
      
      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          totalBlocked: prev.totalBlocked + 1,
          userInitiated: prev.userInitiated + 1
        } : null);
      }
      
    } catch (error) {
      console.error('Error blocking user:', error);
      showNotification('Failed to block user', 'error');
    }
  };

  const getBlockTypeLabel = (type: string) => {
    switch (type) {
      case 'user_initiated': return 'User Blocked';
      case 'system_generated': return 'System Block';
      case 'safety_block': return 'Safety Block';
      case 'harassment_block': return 'Harassment Block';
      default: return 'Blocked';
    }
  };

  const getBlockTypeColor = (type: string) => {
    switch (type) {
      case 'user_initiated': return 'blue';
      case 'system_generated': return 'orange';
      case 'safety_block': return 'red';
      case 'harassment_block': return 'red';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading blocked users...</p>
      </div>
    );
  }

  return (
    <div className="blocked-users-view">
      <ViewHeader
        title="Blocked Users"
        subtitle="Manage users you've blocked or who have been blocked for safety"
      />

      {/* Stats Overview */}
      {stats && (
        <div className="stats-grid">
          <Card className="stat-card">
            <div className="stat-value">{stats.totalBlocked}</div>
            <div className="stat-label">Total Blocked</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-value">{stats.userInitiated}</div>
            <div className="stat-label">User Blocked</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-value">{stats.systemGenerated}</div>
            <div className="stat-label">System Blocks</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-value">{stats.thisMonth}</div>
            <div className="stat-label">This Month</div>
          </Card>
        </div>
      )}

      {/* Block New User */}
      <Card className="block-user-card">
        <h3>Block a User</h3>
        <div className="block-user-form">
          <div className="form-row">
            <AppInput
              placeholder="Username to block"
              id="block-username"
            />
            <AppInput
              placeholder="Reason for blocking"
              id="block-reason"
            />
            <AppButton
              variant="danger"
              onClick={() => {
                const usernameInput = document.getElementById('block-username') as HTMLInputElement;
                const reasonInput = document.getElementById('block-reason') as HTMLInputElement;
                handleBlockUser(usernameInput.value, reasonInput.value);
                usernameInput.value = '';
                reasonInput.value = '';
              }}
            >
              <BlockIcon /> Block User
            </AppButton>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="filters-card">
        <div className="search-and-filters">
          <div className="search-bar">
            <SearchIcon />
            <AppInput
              type="text"
              placeholder="Search blocked users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filters">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="user_initiated">User Blocked</option>
              <option value="system_generated">System Blocks</option>
              <option value="safety_block">Safety Blocks</option>
              <option value="harassment_block">Harassment Blocks</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>

            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show unblocked users
            </label>
          </div>
        </div>
      </Card>

      {/* Blocked Users List */}
      <div className="blocked-users-list">
        {filteredUsers.length === 0 ? (
          <Card className="empty-state">
            {blockedUsers.length === 0 ? (
              <>
                <h3>No Blocked Users</h3>
                <p>You haven't blocked any users yet. If someone is bothering you, you can block them to prevent further contact.</p>
              </>
            ) : (
              <>
                <h3>No Results Found</h3>
                <p>Try adjusting your search or filters</p>
              </>
            )}
          </Card>
        ) : (
          filteredUsers.map(blockedUser => (
            <Card key={blockedUser.id} className={`blocked-user-card ${!blockedUser.isActive ? 'inactive' : ''}`}>
              <div className="user-header">
                <div className="user-avatar">
                  {blockedUser.profileImage ? (
                    <img src={blockedUser.profileImage} alt={blockedUser.displayName} />
                  ) : (
                    <UserIcon />
                  )}
                </div>

                <div className="user-info">
                  <div className="user-name-section">
                    <h4>{blockedUser.displayName}</h4>
                    <span className="username">@{blockedUser.username}</span>
                    <span className={`block-type-badge ${getBlockTypeColor(blockedUser.blockType)}`}>
                      {getBlockTypeLabel(blockedUser.blockType)}
                    </span>
                    {!blockedUser.isActive && <span className="unblocked-badge">Unblocked</span>}
                  </div>
                  
                  <div className="block-meta">
                    <span>Blocked {formatTimeAgo(blockedUser.blockedAt)}</span>
                  </div>
                </div>

                <div className="user-actions">
                  {blockedUser.isActive ? (
                    <AppButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleUnblockUser(blockedUser.id)}
                    >
                      <UnblockIcon /> Unblock
                    </AppButton>
                  ) : (
                    <span className="unblocked-indicator">Unblocked</span>
                  )}
                </div>
              </div>

              <div className="block-details">
                <div className="block-reason">
                  <strong>Reason:</strong> {blockedUser.blockedReason}
                </div>

                {blockedUser.notes && (
                  <div className="block-notes">
                    <strong>Notes:</strong> {blockedUser.notes}
                  </div>
                )}

                {blockedUser.originalContext && (
                  <div className="block-context">
                    <strong>Context:</strong>
                    {blockedUser.originalContext.chatId && <span> Chat Session</span>}
                    {blockedUser.originalContext.postId && <span> Post Interaction</span>}
                    {blockedUser.originalContext.sessionId && <span> Support Session</span>}
                    {blockedUser.originalContext.reportId && <span> User Report</span>}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Information Card */}
      <Card className="info-card">
        <div className="info-header">
          <InfoIcon />
          <h3>About Blocking Users</h3>
        </div>
        
        <div className="info-content">
          <div className="info-section">
            <h4>What happens when you block someone?</h4>
            <ul>
              <li>They cannot send you messages or chat requests</li>
              <li>They cannot see your posts or profile</li>
              <li>You won't be matched with them for support</li>
              <li>They cannot join group sessions you're in</li>
            </ul>
          </div>

          <div className="info-section">
            <h4>Types of blocks:</h4>
            <ul>
              <li><strong>User Blocked:</strong> You manually blocked this user</li>
              <li><strong>System Block:</strong> Automatically blocked for policy violations</li>
              <li><strong>Safety Block:</strong> Blocked for safety concerns</li>
              <li><strong>Harassment Block:</strong> Blocked for harassment or threatening behavior</li>
            </ul>
          </div>

          <div className="info-section">
            <h4>Unblocking users:</h4>
            <p>You can unblock users at any time. Once unblocked, they'll be able to contact you again. System blocks and safety blocks may require additional review.</p>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      {filteredUsers.length > 0 && (
        <div className="results-summary">
          <p>
            Showing {filteredUsers.length} of {blockedUsers.filter(u => showInactive || u.isActive).length} blocked users
            {filterType !== 'all' && ` with type: ${getBlockTypeLabel(filterType)}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default BlockedUsersView;
