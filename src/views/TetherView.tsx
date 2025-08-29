import React, { useState } from 'react';

interface TetherConnection {
  id: string;
  name: string;
  role: 'helper' | 'peer' | 'professional';
  status: 'online' | 'offline' | 'busy';
  connectionStrength: number;
}

const TetherView: React.FC = () => {
  const [connections] = useState<TetherConnection[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'professional',
      status: 'online',
      connectionStrength: 95
    },
    {
      id: '2',
      name: 'Mike Chen',
      role: 'peer',
      status: 'online',
      connectionStrength: 88
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      role: 'helper',
      status: 'busy',
      connectionStrength: 92
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'busy': return '🟡';
      case 'offline': return '⚪';
      default: return '⚪';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'professional': return '👨‍⚕️';
      case 'peer': return '🤝';
      case 'helper': return '💙';
      default: return '👤';
    }
  };

  return (
    <div className="tether-view">
      <div className="tether-header">
        <h1>Tether Connections</h1>
        <p>Connect with mental health professionals, peers, and trained helpers</p>
      </div>

      <div className="connection-stats">
        <div className="stat-card">
          <h3>Your Network</h3>
          <div className="stat-number">{connections.length}</div>
        </div>
        <div className="stat-card">
          <h3>Available Now</h3>
          <div className="stat-number">
            {connections.filter(c => c.status === 'online').length}
          </div>
        </div>
      </div>

      <div className="connections-section">
        <h2>Your Support Network</h2>
        <div className="connections-grid">
          {connections.map((connection) => (
            <div key={connection.id} className="connection-card">
              <div className="connection-header">
                <div className="connection-avatar">
                  {getRoleIcon(connection.role)}
                </div>
                <div className="connection-info">
                  <h3>{connection.name}</h3>
                  <p>{connection.role}</p>
          </div>
                <div className="connection-status">
                  {getStatusIcon(connection.status)}
          </div>
        </div>

        <div className="connection-strength">
                <span>Connection: {connection.connectionStrength}%</span>
          <div className="strength-bar">
            <div 
              className="strength-fill"
                    style={{ width: `${connection.connectionStrength}%` }}
                  ></div>
          </div>
        </div>

              <div className="connection-actions">
                <button
                  className="connect-button"
                  disabled={connection.status === 'offline'}
                >
                  {connection.status === 'offline' ? 'Offline' : 'Connect'}
                </button>
        </div>
              </div>
            ))}
          </div>
        </div>

      <div className="emergency-notice">
        <p>Crisis Support: <a href="tel:988">988</a> or <a href="tel:911">911</a></p>
          </div>
    </div>
  );
};

export default TetherView;
