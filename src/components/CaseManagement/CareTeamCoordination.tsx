import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageSquare, Phone, Mail, Calendar, Activity, Stethoscope, Brain, Pill } from 'lucide-react';
import { format } from 'date-fns';

interface CareTeamCoordinationProps {
  patientId: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  isPrimary?: boolean;
  contact: {
    phone?: string;
    email?: string;
    preferredMethod?: 'phone' | 'email' | 'secure-message';
  };
  lastContact?: Date;
  nextMeeting?: Date;
  notes?: string;
  avatar?: string;
}

interface CareNote {
  id: string;
  authorId: string;
  authorName: string;
  date: Date;
  type: 'update' | 'consultation' | 'referral' | 'medication' | 'crisis';
  content: string;
  sharedWith: string[];
  attachments?: string[];
}

interface CareGoal {
  id: string;
  goal: string;
  targetDate: Date;
  assignedTo: string[];
  progress: number;
  status: 'active' | 'completed' | 'on-hold';
  milestones: {
    description: string;
    completed: boolean;
    date?: Date;
  }[];
}

export const CareTeamCoordination: React.FC<CareTeamCoordinationProps> = ({ patientId }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [careNotes, setCareNotes] = useState<CareNote[]>([]);
  const [careGoals, setCareGoals] = useState<CareGoal[]>([]);
  const [activeTab, setActiveTab] = useState<'team' | 'notes' | 'goals'>('team');
  const [showAddMember, setShowAddMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCareTeamData();
  }, [patientId]);

  const loadCareTeamData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from the API
      setTeamMembers([
        {
          id: '1',
          name: 'Dr. Sarah Smith',
          role: 'Primary Therapist',
          specialty: 'Clinical Psychology',
          isPrimary: true,
          contact: {
            phone: '555-0100',
            email: 'dr.smith@clinic.com',
            preferredMethod: 'email'
          },
          lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          nextMeeting: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: 'Dr. Michael Chen',
          role: 'Psychiatrist',
          specialty: 'Psychopharmacology',
          contact: {
            phone: '555-0101',
            email: 'dr.chen@clinic.com',
            preferredMethod: 'secure-message'
          },
          lastContact: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          notes: 'Medication review scheduled'
        },
        {
          id: '3',
          name: 'Lisa Johnson',
          role: 'Case Manager',
          specialty: 'Social Work',
          contact: {
            phone: '555-0102',
            email: 'l.johnson@clinic.com',
            preferredMethod: 'phone'
          },
          lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          name: 'Dr. Robert Williams',
          role: 'Primary Care Physician',
          specialty: 'Internal Medicine',
          contact: {
            phone: '555-0103',
            email: 'dr.williams@medical.com',
            preferredMethod: 'phone'
          },
          lastContact: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ]);

      setCareNotes([
        {
          id: '1',
          authorId: '1',
          authorName: 'Dr. Sarah Smith',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          type: 'update',
          content: 'Patient showing good progress with CBT interventions. Anxiety levels decreased from 8/10 to 5/10. Recommend continuing current treatment plan.',
          sharedWith: ['2', '3']
        },
        {
          id: '2',
          authorId: '2',
          authorName: 'Dr. Michael Chen',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          type: 'medication',
          content: 'Adjusted SSRI dosage to 20mg daily. Patient tolerating well with minimal side effects. Will reassess in 4 weeks.',
          sharedWith: ['1', '3', '4']
        },
        {
          id: '3',
          authorId: '3',
          authorName: 'Lisa Johnson',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          type: 'referral',
          content: 'Connected patient with vocational rehabilitation services. Initial assessment scheduled for next week.',
          sharedWith: ['1']
        }
      ]);

      setCareGoals([
        {
          id: '1',
          goal: 'Reduce anxiety symptoms to manageable level (3/10 or below)',
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          assignedTo: ['1', '2'],
          progress: 60,
          status: 'active',
          milestones: [
            { description: 'Complete anxiety assessment', completed: true, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            { description: 'Learn coping techniques', completed: true, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
            { description: 'Practice daily relaxation', completed: false },
            { description: 'Achieve target anxiety level', completed: false }
          ]
        },
        {
          id: '2',
          goal: 'Return to work part-time',
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          assignedTo: ['1', '3'],
          progress: 30,
          status: 'active',
          milestones: [
            { description: 'Complete work readiness assessment', completed: true, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            { description: 'Meet with vocational counselor', completed: false },
            { description: 'Develop return-to-work plan', completed: false },
            { description: 'Begin part-time schedule', completed: false }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error loading care team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role.includes('Therapist') || role.includes('Psychology')) return <Brain className="w-4 h-4" />;
    if (role.includes('Psychiatrist')) return <Pill className="w-4 h-4" />;
    if (role.includes('Physician')) return <Stethoscope className="w-4 h-4" />;
    if (role.includes('Case Manager') || role.includes('Social')) return <Users className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'crisis': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medication': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'referral': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'consultation': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Care Team Coordination
        </h3>
        <div className="flex gap-2">
          {['team', 'notes', 'goals'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Team Members Tab */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {teamMembers.length} team members coordinating care
            </p>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map(member => (
              <div
                key={member.id}
                className={`border rounded-lg p-4 ${
                  member.isPrimary ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {getRoleIcon(member.role)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                        {member.isPrimary && (
                          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                            PRIMARY
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                      {member.specialty && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">{member.specialty}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {member.contact.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-3 h-3" />
                      <span>{member.contact.phone}</span>
                    </div>
                  )}
                  {member.contact.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{member.contact.email}</span>
                    </div>
                  )}
                  {member.lastContact && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MessageSquare className="w-3 h-3" />
                      <span>Last contact: {format(member.lastContact, 'MMM d')}</span>
                    </div>
                  )}
                  {member.nextMeeting && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Calendar className="w-3 h-3" />
                      <span>Next: {format(member.nextMeeting, 'MMM d, h:mm a')}</span>
                    </div>
                  )}
                </div>

                {member.notes && (
                  <p className="mt-3 pt-3 border-t text-xs text-gray-600 dark:text-gray-400">
                    {member.notes}
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600">
                    Message
                  </button>
                  <button className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600">
                    Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Care Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
              Add Care Note
            </button>
          </div>

          <div className="space-y-3">
            {careNotes.map(note => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {note.authorName}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${getNoteTypeColor(note.type)}`}>
                        {note.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {format(note.date, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Shared with {note.sharedWith.length} team members
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Care Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
              Add Goal
            </button>
          </div>

          <div className="space-y-4">
            {careGoals.map(goal => (
              <div key={goal.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {goal.goal}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Target: {format(goal.targetDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                    goal.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {goal.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-1">
                  {goal.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        readOnly
                        className="rounded"
                      />
                      <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                        {milestone.description}
                      </span>
                      {milestone.date && (
                        <span className="text-xs text-gray-500">
                          ({format(milestone.date, 'MMM d')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Assigned to: {teamMembers
                      .filter(m => goal.assignedTo.includes(m.id))
                      .map(m => m.name)
                      .join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};