import React, { useState } from 'react';
import { AlertTriangle, Phone, MessageSquare, Clock, User, MapPin, Shield, FileText, Heart } from 'lucide-react';

interface CrisisAlert {
  id: string;
  clientId: string;
  clientName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'suicide_ideation' | 'self_harm' | 'panic_attack' | 'psychosis' | 'substance_abuse' | 'domestic_violence';
  message: string;
  timestamp: Date;
  location?: string;
  status: 'active' | 'responding' | 'resolved' | 'escalated';
  assignedHelper?: string;
  lastContact?: Date;
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  riskFactors?: string[];
  previousIncidents?: number;
}

interface EmergencyResource {
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'local_service';
  phone?: string;
  website?: string;
  description: string;
  availability: string;
  isSpecialized?: boolean;
  specialization?: string;
}

const CrisisSupportView: React.FC = () => {
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([
    {
      id: 'C001',
      clientId: 'CLIENT_001',
      clientName: 'Anonymous Client A',
      severity: 'critical',
      type: 'suicide_ideation',
      message: 'I can\'t take it anymore. I\'ve been thinking about ending it all. I have a plan.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      location: 'Chicago, IL',
      status: 'active',
      emergencyContacts: [
        { name: 'Sarah (Sister)', relationship: 'Sister', phone: '555-0123' },
        { name: 'Dr. Johnson', relationship: 'Therapist', phone: '555-0456' }
      ],
      riskFactors: ['Recent job loss', 'History of depression', 'Social isolation', 'Access to means'],
      previousIncidents: 2
    },
    {
      id: 'C002',
      clientId: 'CLIENT_002',
      clientName: 'Anonymous Client B',
      severity: 'high',
      type: 'panic_attack',
      message: 'I can\'t breathe, my chest is tight, I think I\'m having a heart attack. Everything is spinning.',
      timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
      location: 'New York, NY',
      status: 'responding',
      assignedHelper: 'Helper Sarah M.',
      lastContact: new Date(Date.now() - 2 * 60 * 1000),
      riskFactors: ['High stress job', 'Recent trauma'],
      previousIncidents: 0
    },
    {
      id: 'C003',
      clientId: 'CLIENT_003',
      clientName: 'Anonymous Client C',
      severity: 'medium',
      type: 'self_harm',
      message: 'I cut myself again last night. I know I shouldn\'t but I couldn\'t help it.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      location: 'Los Angeles, CA',
      status: 'resolved',
      assignedHelper: 'Helper Mike R.',
      riskFactors: ['History of self-harm', 'Borderline personality disorder'],
      previousIncidents: 5
    }
  ]);

  const [emergencyResources] = useState<EmergencyResource[]>([
    {
      name: 'National Suicide Prevention Lifeline',
      type: 'hotline',
      phone: '988',
      description: '24/7 free and confidential support for people in distress',
      availability: '24/7',
      isSpecialized: true,
      specialization: 'Suicide Prevention'
    },
    {
      name: 'Crisis Text Line',
      type: 'text',
      phone: '741741',
      description: 'Text HOME to 741741 for crisis support via text message',
      availability: '24/7',
      isSpecialized: false
    },
    {
      name: 'National Domestic Violence Hotline',
      type: 'hotline',
      phone: '1-800-799-7233',
      description: '24/7 confidential support for domestic violence survivors',
      availability: '24/7',
      isSpecialized: true,
      specialization: 'Domestic Violence'
    },
    {
      name: 'SAMHSA National Helpline',
      type: 'hotline',
      phone: '1-800-662-4357',
      description: 'Treatment referral and information service for mental health and substance use disorders',
      availability: '24/7',
      isSpecialized: true,
      specialization: 'Substance Abuse'
    },
    {
      name: 'Trans Lifeline',
      type: 'hotline',
      phone: '877-565-8860',
      description: 'Crisis support for transgender people, by transgender people',
      availability: '24/7',
      isSpecialized: true,
      specialization: 'LGBTQ+ Support'
    }
  ]);

  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'resources' | 'protocols'>('active');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'responding': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'escalated': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suicide_ideation': return <AlertTriangle className="w-5 h-5" />;
      case 'self_harm': return <Heart className="w-5 h-5" />;
      case 'panic_attack': return <AlertTriangle className="w-5 h-5" />;
      case 'psychosis': return <AlertTriangle className="w-5 h-5" />;
      case 'substance_abuse': return <AlertTriangle className="w-5 h-5" />;
      case 'domestic_violence': return <Shield className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const handleTakeAction = (alertId: string, action: string) => {
    setCrisisAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: action === 'respond' ? 'responding' : alert.status,
              assignedHelper: action === 'respond' ? 'You' : alert.assignedHelper,
              lastContact: action === 'respond' ? new Date() : alert.lastContact
            }
          : alert
      )
    );
  };

  const activeAlerts = crisisAlerts.filter(alert => alert.status === 'active' || alert.status === 'responding');
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical').length;

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            Crisis Support Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and respond to crisis situations requiring immediate attention
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {criticalAlerts > 0 && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-800 dark:text-red-200 font-medium">
                {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''}
              </span>
            </div>
          )}
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
            Emergency Protocols
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {[
          { id: 'active', label: 'Active Crises', count: activeAlerts.length },
          { id: 'resources', label: 'Emergency Resources', count: emergencyResources.length },
          { id: 'protocols', label: 'Crisis Protocols', count: null }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Crises Tab */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crisis Alerts List */}
          <div className="lg:col-span-2 space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Crises</h3>
                <p className="text-gray-600 dark:text-gray-400">All crisis situations have been resolved or are being handled.</p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 cursor-pointer transition-all hover:shadow-md ${
                    alert.severity === 'critical' ? 'border-l-red-500' :
                    alert.severity === 'high' ? 'border-l-orange-500' :
                    alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  } ${selectedAlert?.id === alert.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                        alert.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                        alert.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                        'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        {getTypeIcon(alert.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{alert.clientName}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                            {alert.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTimestamp(alert.timestamp)}
                      </div>
                      {alert.location && (
                        <div className="flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {alert.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg italic">
                      "{alert.message}"
                    </p>
                  </div>

                  {alert.assignedHelper && (
                    <div className="mb-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4 mr-2" />
                      Assigned to: {alert.assignedHelper}
                      {alert.lastContact && (
                        <span className="ml-2">
                          • Last contact: {formatTimestamp(alert.lastContact)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {alert.status === 'active' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTakeAction(alert.id, 'respond');
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Respond Now
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle escalation
                            }}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Escalate
                          </button>
                        </>
                      )}
                      {alert.status === 'responding' && (
                        <div className="flex space-x-2">
                          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <MessageSquare className="w-4 h-4 inline mr-2" />
                            Continue Chat
                          </button>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <Phone className="w-4 h-4 inline mr-2" />
                            Call
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {alert.previousIncidents && alert.previousIncidents > 0 && (
                        <span>{alert.previousIncidents} previous incident{alert.previousIncidents > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Crisis Details Panel */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {selectedAlert ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Crisis Details</h3>
                
                {/* Risk Factors */}
                {selectedAlert.riskFactors && selectedAlert.riskFactors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Factors</h4>
                    <div className="space-y-1">
                      {selectedAlert.riskFactors.map((factor, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                {selectedAlert.emergencyContacts && selectedAlert.emergencyContacts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Emergency Contacts</h4>
                    <div className="space-y-2">
                      {selectedAlert.emergencyContacts.map((contact, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{contact.relationship}</p>
                            </div>
                            <button
                              onClick={() => window.open(`tel:${contact.phone}`)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              <Phone className="w-4 h-4 inline mr-1" />
                              {contact.phone}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Quick Actions</h4>
                  <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Call 911 / Emergency Services
                  </button>
                  <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Contact Suicide Prevention Lifeline
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Send Safety Plan Resources
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Document Incident
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Crisis Alert</h3>
                <p className="text-gray-600 dark:text-gray-400">Click on a crisis alert to view detailed information and take action.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Resources Tab */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emergencyResources.map((resource, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{resource.name}</h3>
                {resource.isSpecialized && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    {resource.specialization}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{resource.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{resource.availability}</span>
                </div>
                {resource.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <a
                      href={`tel:${resource.phone}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {resource.phone}
                    </a>
                  </div>
                )}
              </div>
              <button
                onClick={() => resource.phone && window.open(`tel:${resource.phone}`)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Contact Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Crisis Protocols Tab */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Crisis Response Protocols
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Immediate Danger Protocol</h4>
                  <ol className="text-sm text-red-700 dark:text-red-300 space-y-1 list-decimal list-inside">
                    <li>Stay calm and assess immediate safety</li>
                    <li>If imminent danger: Contact 911 immediately</li>
                    <li>Keep the person on the line/chat</li>
                    <li>Use de-escalation techniques</li>
                    <li>Document everything</li>
                    <li>Follow up within 24 hours</li>
                  </ol>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Suicide Risk Assessment</h4>
                  <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                    <li>Ask directly about suicidal thoughts</li>
                    <li>Assess plan, means, and timeline</li>
                    <li>Evaluate protective factors</li>
                    <li>Determine level of supervision needed</li>
                    <li>Create or review safety plan</li>
                    <li>Connect with appropriate resources</li>
                  </ol>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">De-escalation Techniques</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Listen actively and empathetically</li>
                    <li>Validate their feelings</li>
                    <li>Use calm, non-judgmental language</li>
                    <li>Ask open-ended questions</li>
                    <li>Focus on immediate safety</li>
                    <li>Offer hope and alternatives</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Follow-up Procedures</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                    <li>Schedule check-in within 24-48 hours</li>
                    <li>Review safety plan effectiveness</li>
                    <li>Connect with ongoing support</li>
                    <li>Monitor for warning signs</li>
                    <li>Update crisis plan as needed</li>
                    <li>Coordinate with healthcare providers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrisisSupportView;
