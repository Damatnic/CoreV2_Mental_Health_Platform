import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, TrendingUp, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { professionalService } from '../../services/professionalService';

interface TreatmentHistoryProps {
  patientId: string;
}

interface SessionRecord {
  id: string;
  date: Date;
  type: string;
  duration: number;
  therapist: string;
  presenting: string;
  interventions: string[];
  progress: number;
  homework?: string;
  nextSteps?: string;
  outcome?: string;
}

export const TreatmentHistory: React.FC<TreatmentHistoryProps> = ({ patientId }) => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'progress' | 'crisis' | 'assessment'>('all');

  useEffect(() => {
    loadTreatmentHistory();
  }, [patientId]);

  const loadTreatmentHistory = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from the API
      // For now, using mock data
      const mockSessions: SessionRecord[] = [
        {
          id: '1',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          type: 'progress',
          duration: 50,
          therapist: 'Dr. Smith',
          presenting: 'Anxiety about upcoming work presentation',
          interventions: ['CBT', 'Relaxation techniques', 'Cognitive restructuring'],
          progress: 75,
          homework: 'Practice deep breathing exercises daily',
          nextSteps: 'Continue exposure therapy',
          outcome: 'Good progress, anxiety reduced'
        },
        {
          id: '2',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          type: 'progress',
          duration: 50,
          therapist: 'Dr. Smith',
          presenting: 'Sleep difficulties and racing thoughts',
          interventions: ['Sleep hygiene education', 'Mindfulness', 'Thought stopping'],
          progress: 60,
          homework: 'Sleep diary, mindfulness practice',
          nextSteps: 'Monitor sleep patterns',
          outcome: 'Moderate improvement'
        },
        {
          id: '3',
          date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          type: 'assessment',
          duration: 90,
          therapist: 'Dr. Smith',
          presenting: 'Initial assessment',
          interventions: ['Clinical interview', 'PHQ-9', 'GAD-7'],
          progress: 0,
          nextSteps: 'Begin CBT treatment',
          outcome: 'Assessment completed, treatment plan established'
        }
      ];
      
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error loading treatment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.type === filter;
  });

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'crisis': return <Activity className="w-4 h-4 text-red-500" />;
      case 'assessment': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Treatment History
        </h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-1 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="all">All Sessions</option>
          <option value="progress">Progress Notes</option>
          <option value="crisis">Crisis Sessions</option>
          <option value="assessment">Assessments</option>
        </select>
      </div>

      {/* Treatment Summary */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {sessions.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Sessions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {sessions[0]?.progress || 0}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Current Progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / 60)}h
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Hours</p>
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-3">
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className="border rounded-lg hover:shadow-md transition-shadow"
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedSession(
                expandedSession === session.id ? null : session.id
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {getSessionIcon(session.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {format(session.date, 'MMM d, yyyy')}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {session.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.presenting}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.duration} min
                      </span>
                      <span>{session.therapist}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.progress > 0 && (
                    <div className="w-20">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{session.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getProgressColor(session.progress)}`}
                          style={{ width: `${session.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {expandedSession === session.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedSession === session.id && (
              <div className="px-4 pb-4 border-t">
                <div className="pt-4 space-y-3">
                  {/* Interventions */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interventions Used
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {session.interventions.map((intervention, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                        >
                          {intervention}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Homework */}
                  {session.homework && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Homework Assigned
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {session.homework}
                      </p>
                    </div>
                  )}

                  {/* Next Steps */}
                  {session.nextSteps && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Next Steps
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {session.nextSteps}
                      </p>
                    </div>
                  )}

                  {/* Outcome */}
                  {session.outcome && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Session Outcome
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {session.outcome}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sessions found for the selected filter
          </div>
        )}
      </div>
    </div>
  );
};