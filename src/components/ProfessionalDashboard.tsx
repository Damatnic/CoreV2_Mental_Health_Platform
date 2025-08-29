import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Users, FileText, MessageSquare, TrendingUp, Clock, AlertCircle, Shield, Activity, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, isToday, isSameDay, parseISO } from 'date-fns';
import { professionalService } from '../services/professionalService';
import { PatientProfile } from './CaseManagement/PatientProfile';
import { TreatmentHistory } from './CaseManagement/TreatmentHistory';
import { RiskAssessment } from './CaseManagement/RiskAssessment';
import { CareTeamCoordination } from './CaseManagement/CareTeamCoordination';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';

// Types for professional dashboard
interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastSession: Date;
  nextAppointment?: Date;
  treatmentPlan: string;
  progress: number;
  assignedDate: Date;
  contactInfo: {
    phone: string;
    email: string;
    emergencyContact: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
  };
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  duration: number;
  type: 'initial' | 'followup' | 'crisis' | 'group' | 'teletherapy';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  location?: string;
}

interface SessionNote {
  id: string;
  patientId: string;
  date: Date;
  type: 'progress' | 'intake' | 'discharge' | 'crisis';
  content: string;
  interventions: string[];
  medications?: string[];
  nextSteps: string;
  signature: string;
  locked: boolean;
}

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  date: Date;
  encrypted: boolean;
  read: boolean;
  priority: 'normal' | 'high' | 'urgent';
}

interface WorkloadMetrics {
  totalPatients: number;
  weeklyAppointments: number;
  pendingNotes: number;
  upcomingAppointments: number;
  criticalPatients: number;
  supervisionHours: number;
  billingStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'patients' | 'appointments' | 'notes' | 'messages' | 'reports'>('overview');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [workloadMetrics, setWorkloadMetrics] = useState<WorkloadMetrics | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const [
          patientsData,
          appointmentsData,
          notesData,
          messagesData,
          metricsData
        ] = await Promise.all([
          professionalService.getPatientCaseload(user.id),
          professionalService.getAppointments(user.id),
          professionalService.getSessionNotes(user.id),
          professionalService.getSecureMessages(user.id),
          professionalService.getWorkloadMetrics(user.id)
        ]);

        setPatients(patientsData);
        setAppointments(appointmentsData);
        setSessionNotes(notesData);
        setMessages(messagesData);
        setWorkloadMetrics(metricsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(term) ||
      patient.diagnosis.some(d => d.toLowerCase().includes(term))
    );
  }, [patients, searchTerm]);

  // Get today's appointments
  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter(apt => 
      isSameDay(apt.date, today) && apt.status !== 'cancelled'
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [appointments]);

  // Get critical patients requiring attention
  const criticalPatients = useMemo(() => {
    return patients.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
  }, [patients]);

  // Handle appointment scheduling
  const scheduleAppointment = useCallback(async (patientId: string, appointmentData: Partial<Appointment>) => {
    try {
      const newAppointment = await professionalService.scheduleAppointment({
        ...appointmentData,
        patientId,
        professionalId: user?.id
      });
      
      setAppointments(prev => [...prev, newAppointment]);
      showNotification('Appointment scheduled successfully', 'success');
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      showNotification('Failed to schedule appointment', 'error');
    }
  }, [user?.id]);

  // Handle session note creation
  const createSessionNote = useCallback(async (patientId: string, noteData: Partial<SessionNote>) => {
    try {
      const newNote = await professionalService.createSessionNote({
        ...noteData,
        patientId,
        professionalId: user?.id,
        date: new Date()
      });
      
      setSessionNotes(prev => [...prev, newNote]);
      showNotification('Session note saved', 'success');
    } catch (error) {
      console.error('Error creating session note:', error);
      showNotification('Failed to save session note', 'error');
    }
  }, [user?.id]);

  // Handle secure messaging
  const sendSecureMessage = useCallback(async (recipient: string, message: Partial<Message>) => {
    try {
      const newMessage = await professionalService.sendSecureMessage({
        ...message,
        from: user?.id,
        to: recipient,
        encrypted: true,
        date: new Date()
      });
      
      setMessages(prev => [...prev, newMessage]);
      showNotification('Message sent securely', 'success');
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message', 'error');
    }
  }, [user?.id]);

  // Overview Dashboard
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Metrics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <Users className="w-8 h-8 text-blue-500" />
          <span className="text-2xl font-bold">{workloadMetrics?.totalPatients || 0}</span>
        </div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Patients</h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {criticalPatients.length} require immediate attention
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <Calendar className="w-8 h-8 text-green-500" />
          <span className="text-2xl font-bold">{todayAppointments.length}</span>
        </div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Appointments</h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Next: {todayAppointments[0]?.patientName || 'None scheduled'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <FileText className="w-8 h-8 text-yellow-500" />
          <span className="text-2xl font-bold">{workloadMetrics?.pendingNotes || 0}</span>
        </div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Notes</h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Complete within 24 hours
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <MessageSquare className="w-8 h-8 text-purple-500" />
          <span className="text-2xl font-bold">
            {messages.filter(m => !m.read).length}
          </span>
        </div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread Messages</h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {messages.filter(m => m.priority === 'urgent').length} urgent
        </p>
      </motion.div>
    </div>
  );

  // Patient Caseload View
  const renderPatientCaseload = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Patient Caseload</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={() => professionalService.requestPatientAssignment(user?.id)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Request New Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map(patient => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedPatient(patient)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{patient.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Age: {patient.age}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                patient.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                patient.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                patient.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {patient.riskLevel.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Activity className="w-4 h-4 mr-2" />
                Progress: {patient.progress}%
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-2" />
                Last: {format(patient.lastSession, 'MMM d')}
              </div>
              {patient.nextAppointment && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  Next: {format(patient.nextAppointment, 'MMM d, h:mm a')}
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {patient.diagnosis.join(', ')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPatient(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <PatientProfile patient={selectedPatient} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <TreatmentHistory patientId={selectedPatient.id} />
                <RiskAssessment patientId={selectedPatient.id} />
              </div>
              <CareTeamCoordination patientId={selectedPatient.id} />
              
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => scheduleAppointment(selectedPatient.id, {})}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Schedule Appointment
                </button>
                <button
                  onClick={() => createSessionNote(selectedPatient.id, {})}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Create Note
                </button>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Appointment Calendar View
  const renderAppointmentCalendar = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Appointment Schedule</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Previous Week
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Next Week
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const dayAppointments = appointments.filter(apt => 
              isSameDay(apt.date, day) && apt.status !== 'cancelled'
            );
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg p-3 min-h-[200px] ${
                  isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
                }`}
              >
                <div className="font-semibold text-sm mb-2">
                  {format(day, 'EEE, MMM d')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.map(apt => (
                    <div
                      key={apt.id}
                      className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 ${
                        apt.type === 'crisis' ? 'bg-red-100 dark:bg-red-900/30' :
                        apt.type === 'group' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        'bg-green-100 dark:bg-green-900/30'
                      }`}
                    >
                      <div className="font-medium">{format(apt.date, 'h:mm a')}</div>
                      <div className="truncate">{apt.patientName}</div>
                      <div className="text-gray-600 dark:text-gray-400">{apt.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Session Notes Interface
  const renderSessionNotes = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Session Notes</h2>
        <button
          onClick={() => {/* Open new note modal */}}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          New Session Note
        </button>
      </div>

      <div className="space-y-4">
        {sessionNotes.map(note => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">
                  {patients.find(p => p.id === note.patientId)?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(note.date, 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  note.type === 'crisis' ? 'bg-red-100 text-red-800' :
                  note.type === 'intake' ? 'bg-blue-100 text-blue-800' :
                  note.type === 'discharge' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {note.type.toUpperCase()}
                </span>
                {note.locked && (
                  <Shield className="w-4 h-4 text-gray-500" title="Note locked" />
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
              {note.content}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {note.interventions.map((intervention, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                >
                  {intervention}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Signed by: {note.signature}
              </p>
              <button
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                onClick={() => {/* Open full note */}}
              >
                View Full Note
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Secure Messaging Interface
  const renderSecureMessaging = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Secure Messages</h2>
        <button
          onClick={() => {/* Open compose modal */}}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Compose Message
        </button>
      </div>

      <div className="space-y-3">
        {messages.map(message => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
              !message.read ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{message.subject}</h3>
                  {message.encrypted && (
                    <Shield className="w-4 h-4 text-green-500" title="Encrypted" />
                  )}
                  {message.priority === 'urgent' && (
                    <AlertCircle className="w-4 h-4 text-red-500" title="Urgent" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  From: {message.from} • {format(message.date, 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {message.content}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Professional Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name || 'Doctor'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">License #</p>
                <p className="font-mono text-sm">{user?.licenseNumber || 'XXXX-XXXX'}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  HIPAA Compliant
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'patients', label: 'Patients', icon: Users },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'notes', label: 'Session Notes', icon: FileText },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeView === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'overview' && (
              <>
                {renderOverview()}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
                    <div className="space-y-3">
                      {todayAppointments.map(apt => (
                        <div key={apt.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {format(apt.date, 'HH')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {format(apt.date, 'mm')}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{apt.patientName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {apt.type} • {apt.duration} min
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      ))}
                      {todayAppointments.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          No appointments scheduled for today
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Critical Patients</h3>
                    <div className="space-y-3">
                      {criticalPatients.slice(0, 5).map(patient => (
                        <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Last contact: {format(patient.lastSession, 'MMM d')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              patient.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {patient.riskLevel.toUpperCase()}
                            </span>
                            <button
                              onClick={() => setSelectedPatient(patient)}
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeView === 'patients' && renderPatientCaseload()}
            {activeView === 'appointments' && renderAppointmentCalendar()}
            {activeView === 'notes' && renderSessionNotes()}
            {activeView === 'messages' && renderSecureMessaging()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;