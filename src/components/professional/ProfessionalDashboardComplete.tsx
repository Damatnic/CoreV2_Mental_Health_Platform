import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  Bell,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Send,
  MessageSquare,
  Video,
  Phone,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart,
  PieChart,
  Activity,
  Clipboard,
  Shield,
  Award,
  Target,
  BookOpen,
  Settings,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Archive,
  UserCheck,
  UserX,
  Mail,
  Paperclip,
  Heart,
  Brain,
  Stethoscope
} from 'lucide-react';

// Types for professional dashboard
interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  diagnosis?: string[];
  medications?: string[];
  allergies?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  status: 'active' | 'inactive' | 'discharged';
  riskLevel: 'low' | 'medium' | 'high';
  lastSession?: Date;
  nextSession?: Date;
  notes?: string;
  tags?: string[];
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  treatmentPlan?: TreatmentPlan;
  sessions: Session[];
  assessments: Assessment[];
}

interface Session {
  id: string;
  patientId: string;
  date: Date;
  time: string;
  duration: number;
  type: 'initial' | 'followup' | 'crisis' | 'group' | 'teletherapy';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  interventions?: string[];
  homework?: string[];
  moodRating?: number;
  progressNotes?: string;
  billing?: {
    cptCode: string;
    fee: number;
    paid: boolean;
  };
}

interface Assessment {
  id: string;
  patientId: string;
  type: 'PHQ-9' | 'GAD-7' | 'PCL-5' | 'MDQ' | 'AUDIT' | 'Custom';
  date: Date;
  score: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  responses?: any;
  interpretation?: string;
  recommendations?: string[];
}

interface TreatmentPlan {
  id: string;
  patientId: string;
  goals: TreatmentGoal[];
  interventions: string[];
  frequency: string;
  duration: string;
  reviewDate: Date;
  progress: 'on-track' | 'slow-progress' | 'regression' | 'completed';
}

interface TreatmentGoal {
  id: string;
  description: string;
  targetDate: Date;
  status: 'active' | 'completed' | 'revised';
  progress: number;
  notes?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  time: string;
  duration: number;
  type: Session['type'];
  status: 'confirmed' | 'pending' | 'cancelled';
  location: 'office' | 'teletherapy' | 'home-visit';
  reminders: boolean;
  notes?: string;
}

// Patient Management Component
const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Patient['status']>('all');
  const [filterRisk, setFilterRisk] = useState<'all' | Patient['riskLevel']>('all');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockPatients: Patient[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '555-0123',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'male',
        diagnosis: ['Major Depressive Disorder', 'Generalized Anxiety'],
        medications: ['Sertraline 100mg', 'Alprazolam 0.5mg PRN'],
        status: 'active',
        riskLevel: 'medium',
        lastSession: new Date('2024-01-20'),
        nextSession: new Date('2024-01-27'),
        emergencyContact: {
          name: 'Jane Doe',
          phone: '555-0124',
          relationship: 'Spouse'
        },
        sessions: [],
        assessments: []
      },
      {
        id: '2',
        name: 'Sarah Smith',
        email: 'sarah.smith@email.com',
        phone: '555-0125',
        dateOfBirth: new Date('1992-03-22'),
        gender: 'female',
        diagnosis: ['PTSD', 'Insomnia'],
        medications: ['Prazosin 2mg', 'Trazodone 50mg'],
        status: 'active',
        riskLevel: 'high',
        lastSession: new Date('2024-01-22'),
        nextSession: new Date('2024-01-25'),
        emergencyContact: {
          name: 'Mike Smith',
          phone: '555-0126',
          relationship: 'Brother'
        },
        sessions: [],
        assessments: []
      }
    ];
    setPatients(mockPatients);
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || patient.riskLevel === filterRisk;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getRiskColor = (risk: Patient['riskLevel']) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
    }
  };

  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'discharged': return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="patient-management">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
          <p className="text-gray-600">Manage your patients and their treatment</p>
        </div>
        <button
          onClick={() => setShowAddPatient(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discharged">Discharged</option>
          </select>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="grid gap-4">
        {filteredPatients.map(patient => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedPatient(patient);
              setShowPatientDetails(true);
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(patient.riskLevel)}`}>
                    {patient.riskLevel} risk
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {patient.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Next: {patient.nextSession?.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last: {patient.lastSession?.toLocaleDateString()}
                  </div>
                </div>
                {patient.diagnosis && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {patient.diagnosis.map((dx, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {dx}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setShowPatientDetails(false)}
        />
      )}
    </div>
  );
};

// Patient Details Modal Component
const PatientDetailsModal: React.FC<{ patient: Patient; onClose: () => void }> = ({ patient, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'assessments' | 'treatment' | 'documents'>('overview');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{patient.name}</h2>
              <div className="flex gap-4 text-sm opacity-90">
                <span>{patient.email}</span>
                <span>{patient.phone}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['overview', 'sessions', 'assessments', 'treatment', 'documents'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 capitalize font-medium transition-colors ${
                activeTab === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[500px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span>{patient.dateOfBirth.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="capitalize">{patient.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize">{patient.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className="capitalize">{patient.riskLevel}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Emergency Contact</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span>{patient.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{patient.emergencyContact.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Relationship:</span>
                      <span>{patient.emergencyContact.relationship}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Diagnosis</h3>
                <div className="flex flex-wrap gap-2">
                  {patient.diagnosis?.map((dx, idx) => (
                    <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      {dx}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Medications</h3>
                <div className="flex flex-wrap gap-2">
                  {patient.medications?.map((med, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Session History</h3>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  Schedule Session
                </button>
              </div>
              <div className="text-gray-500 text-center py-8">
                No sessions recorded yet
              </div>
            </div>
          )}

          {activeTab === 'assessments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Assessment Results</h3>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  New Assessment
                </button>
              </div>
              <div className="text-gray-500 text-center py-8">
                No assessments completed yet
              </div>
            </div>
          )}

          {activeTab === 'treatment' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Treatment Plan</h3>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  Edit Plan
                </button>
              </div>
              <div className="text-gray-500 text-center py-8">
                No treatment plan created yet
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Clinical Documents</h3>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  Upload Document
                </button>
              </div>
              <div className="text-gray-500 text-center py-8">
                No documents uploaded yet
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Session Scheduling Component
const SessionScheduling: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showAddAppointment, setShowAddAppointment] = useState(false);

  // Mock appointments
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        patientId: '1',
        patientName: 'John Doe',
        date: new Date('2024-01-27'),
        time: '10:00',
        duration: 60,
        type: 'followup',
        status: 'confirmed',
        location: 'office',
        reminders: true
      },
      {
        id: '2',
        patientId: '2',
        patientName: 'Sarah Smith',
        date: new Date('2024-01-27'),
        time: '11:30',
        duration: 60,
        type: 'followup',
        status: 'confirmed',
        location: 'teletherapy',
        reminders: true
      },
      {
        id: '3',
        patientId: '3',
        patientName: 'Mike Johnson',
        date: new Date('2024-01-27'),
        time: '14:00',
        duration: 90,
        type: 'initial',
        status: 'pending',
        location: 'office',
        reminders: false
      }
    ];
    setAppointments(mockAppointments);
  }, []);

  const getTypeColor = (type: Session['type']) => {
    switch (type) {
      case 'initial': return 'bg-purple-100 text-purple-800';
      case 'followup': return 'bg-blue-100 text-blue-800';
      case 'crisis': return 'bg-red-100 text-red-800';
      case 'group': return 'bg-green-100 text-green-800';
      case 'teletherapy': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getLocationIcon = (location: Appointment['location']) => {
    switch (location) {
      case 'office': return <MapPin className="w-4 h-4" />;
      case 'teletherapy': return <Video className="w-4 h-4" />;
      case 'home-visit': return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="session-scheduling">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Scheduling</h2>
          <p className="text-gray-600">Manage your appointments and sessions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddAppointment(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Appointment
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <span className="font-medium">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar/Schedule View */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          {/* Today's Schedule */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              {appointments.map(appointment => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-semibold">{appointment.time}</div>
                    <div className="text-xs text-gray-500">{appointment.duration} min</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                        {appointment.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        {getLocationIcon(appointment.location)}
                        {appointment.location}
                      </span>
                      {appointment.reminders && (
                        <span className="flex items-center gap-1">
                          <Bell className="w-4 h-4" />
                          Reminders on
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Upcoming This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                const date = new Date();
                date.setDate(date.getDate() + dayOffset);
                const dayAppointments = appointments.filter(
                  a => a.date.toDateString() === date.toDateString()
                );
                return (
                  <div key={dayOffset} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`p-2 rounded-lg ${dayOffset === 0 ? 'bg-indigo-100' : 'bg-gray-50'}`}>
                      <div className="font-semibold">{date.getDate()}</div>
                      <div className="text-xs text-gray-600">{dayAppointments.length} appts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Tracking Component
const ProgressTracking: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('1');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | 'year'>('month');

  return (
    <div className="progress-tracking">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
          <p className="text-gray-600">Monitor patient progress and outcomes</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
          <option value="3months">Past 3 Months</option>
          <option value="year">Past Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Mood Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <BarChart className="w-12 h-12 text-gray-300" />
            <span className="ml-2">Chart visualization would go here</span>
          </div>
        </div>

        {/* Symptom Severity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Symptom Severity</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <Activity className="w-12 h-12 text-gray-300" />
            <span className="ml-2">Chart visualization would go here</span>
          </div>
        </div>

        {/* Treatment Goals */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Treatment Goal Progress</h3>
          <div className="space-y-3">
            {[
              { goal: 'Reduce anxiety symptoms', progress: 75 },
              { goal: 'Improve sleep quality', progress: 60 },
              { goal: 'Develop coping strategies', progress: 85 },
              { goal: 'Increase social activities', progress: 40 }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.goal}</span>
                  <span className="font-medium">{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Attendance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Session Attendance</h3>
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.85)}`}
                  className="text-green-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">85%</div>
                  <div className="text-xs text-gray-500">Attendance</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
            <div>
              <div className="font-semibold text-green-600">17</div>
              <div className="text-gray-500">Attended</div>
            </div>
            <div>
              <div className="font-semibold text-yellow-600">2</div>
              <div className="text-gray-500">Cancelled</div>
            </div>
            <div>
              <div className="font-semibold text-red-600">1</div>
              <div className="text-gray-500">No-show</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clinical Notes Component
const ClinicalNotes: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('soap');

  const templates = {
    soap: {
      name: 'SOAP Note',
      sections: ['Subjective', 'Objective', 'Assessment', 'Plan']
    },
    dap: {
      name: 'DAP Note',
      sections: ['Data', 'Assessment', 'Plan']
    },
    birp: {
      name: 'BIRP Note',
      sections: ['Behavior', 'Intervention', 'Response', 'Plan']
    }
  };

  return (
    <div className="clinical-notes">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clinical Notes</h2>
          <p className="text-gray-600">Document session notes and treatment progress</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {Object.entries(templates).map(([key, template]) => (
              <option key={key} value={key}>{template.name}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Save Note
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          {templates[selectedTemplate as keyof typeof templates].sections.map(section => (
            <div key={section}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{section}</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder={`Enter ${section.toLowerCase()} information...`}
              />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-2">
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            Add Diagnosis
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            Add Medication
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            Add Intervention
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            Schedule Follow-up
          </button>
        </div>
      </div>
    </div>
  );
};

// Assessment Tools Component
const AssessmentTools: React.FC = () => {
  const assessments = [
    { id: 'phq9', name: 'PHQ-9', description: 'Depression severity', questions: 9, time: '5 min' },
    { id: 'gad7', name: 'GAD-7', description: 'Anxiety severity', questions: 7, time: '3 min' },
    { id: 'pcl5', name: 'PCL-5', description: 'PTSD symptoms', questions: 20, time: '10 min' },
    { id: 'mdq', name: 'MDQ', description: 'Bipolar disorder screening', questions: 13, time: '5 min' },
    { id: 'audit', name: 'AUDIT', description: 'Alcohol use screening', questions: 10, time: '5 min' },
    { id: 'custom', name: 'Custom Assessment', description: 'Create your own', questions: 0, time: 'Varies' }
  ];

  return (
    <div className="assessment-tools">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessment Tools</h2>
          <p className="text-gray-600">Clinical assessment forms and questionnaires</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Create Custom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assessments.map(assessment => (
          <div key={assessment.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{assessment.name}</h3>
                <p className="text-sm text-gray-600">{assessment.description}</p>
              </div>
              <Clipboard className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <span>{assessment.questions} questions</span>
              <span>{assessment.time}</span>
            </div>
            <button className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
              Start Assessment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Professional Dashboard Component
const ProfessionalDashboardComplete: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'patients' | 'scheduling' | 'progress' | 'notes' | 'assessments'>('overview');

  const sections = [
    { id: 'overview', name: 'Overview', icon: <BarChart className="w-5 h-5" /> },
    { id: 'patients', name: 'Patients', icon: <Users className="w-5 h-5" /> },
    { id: 'scheduling', name: 'Scheduling', icon: <Calendar className="w-5 h-5" /> },
    { id: 'progress', name: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'notes', name: 'Clinical Notes', icon: <FileText className="w-5 h-5" /> },
    { id: 'assessments', name: 'Assessments', icon: <Clipboard className="w-5 h-5" /> }
  ];

  return (
    <div className="professional-dashboard min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <Stethoscope className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Professional</h1>
                <p className="text-xs text-gray-600">Dashboard</p>
              </div>
            </div>

            <nav className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="p-6 border-t">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Today's Sessions</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Patients</span>
                <span className="font-semibold">24</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold">18 sessions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'overview' && (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Dashboard</h1>
                  <p className="text-gray-600 mb-8">Welcome back! Here's your practice overview.</p>
                  
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Users className="w-10 h-10 text-indigo-600" />
                        <span className="text-xs text-green-600 font-medium">+12%</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">24</div>
                      <div className="text-sm text-gray-600">Active Patients</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Calendar className="w-10 h-10 text-purple-600" />
                        <span className="text-xs text-green-600 font-medium">+5%</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">87</div>
                      <div className="text-sm text-gray-600">Sessions This Month</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-10 h-10 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">+18%</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">78%</div>
                      <div className="text-sm text-gray-600">Goal Achievement</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Heart className="w-10 h-10 text-red-600" />
                        <span className="text-xs text-yellow-600 font-medium">Stable</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">4.8</div>
                      <div className="text-sm text-gray-600">Patient Satisfaction</div>
                    </div>
                  </div>

                  {/* Today's Schedule Preview */}
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Schedule</h2>
                    <div className="space-y-3">
                      {[
                        { time: '9:00 AM', patient: 'John Doe', type: 'Follow-up' },
                        { time: '10:30 AM', patient: 'Sarah Smith', type: 'Initial' },
                        { time: '2:00 PM', patient: 'Mike Johnson', type: 'Teletherapy' }
                      ].map((apt, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{apt.time}</span>
                            <span className="text-gray-700">{apt.patient}</span>
                          </div>
                          <span className="text-sm text-gray-600">{apt.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                      {[
                        { action: 'Session completed', patient: 'John Doe', time: '2 hours ago' },
                        { action: 'Assessment submitted', patient: 'Sarah Smith', time: '4 hours ago' },
                        { action: 'Treatment plan updated', patient: 'Mike Johnson', time: 'Yesterday' }
                      ].map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2">
                          <div>
                            <span className="font-medium text-gray-900">{activity.action}</span>
                            <span className="text-gray-600 ml-2">for {activity.patient}</span>
                          </div>
                          <span className="text-sm text-gray-500">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {activeSection === 'patients' && <PatientManagement />}
              {activeSection === 'scheduling' && <SessionScheduling />}
              {activeSection === 'progress' && <ProgressTracking />}
              {activeSection === 'notes' && <ClinicalNotes />}
              {activeSection === 'assessments' && <AssessmentTools />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboardComplete;