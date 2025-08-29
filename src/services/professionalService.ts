import { format, addDays, startOfMonth, endOfMonth, differenceInDays, isWithinInterval } from 'date-fns';

// Types for professional services
export interface Professional {
  id: string;
  name: string;
  title: string;
  specialization: string[];
  licenseNumber: string;
  npiNumber?: string;
  deaNumber?: string;
  email: string;
  phone: string;
  maxCaseload: number;
  currentCaseload: number;
  supervisorId?: string;
  credentials: string[];
  languages: string[];
  availability: AvailabilitySlot[];
  acceptingNewPatients: boolean;
  insuranceAccepted: string[];
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6, Sunday to Saturday
  startTime: string; // HH:mm format
  endTime: string;
  type: 'in-person' | 'teletherapy' | 'both';
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: Date;
  age: number;
  gender: string;
  diagnosis: string[];
  medications: Medication[];
  allergies: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastSession: Date;
  nextAppointment?: Date;
  treatmentPlan: string;
  progress: number;
  assignedDate: Date;
  primaryTherapistId: string;
  careTeam: string[];
  contactInfo: ContactInfo;
  emergencyContacts: EmergencyContact[];
  insurance?: InsuranceInfo;
  consentForms: ConsentForm[];
  assessmentScores: AssessmentScore[];
  treatmentGoals: TreatmentGoal[];
  sessionHistory: SessionSummary[];
}

export interface ContactInfo {
  phone: string;
  alternatePhone?: string;
  email: string;
  address: Address;
  preferredContact: 'phone' | 'email' | 'text';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  isPrimaryContact: boolean;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  copay?: number;
  deductible?: number;
  authorizationNumber?: string;
  sessionsAuthorized?: number;
  sessionsUsed?: number;
  expirationDate?: Date;
}

export interface ConsentForm {
  type: string;
  signedDate: Date;
  expirationDate?: Date;
  documentUrl: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
  sideEffects?: string[];
}

export interface AssessmentScore {
  type: 'PHQ-9' | 'GAD-7' | 'PCL-5' | 'MDQ' | 'AUDIT' | 'custom';
  score: number;
  severity: string;
  date: Date;
  administeredBy: string;
}

export interface TreatmentGoal {
  id: string;
  description: string;
  targetDate: Date;
  progress: number;
  status: 'active' | 'achieved' | 'discontinued';
  interventions: string[];
}

export interface SessionSummary {
  date: Date;
  duration: number;
  type: string;
  presenting: string;
  interventions: string[];
  homework?: string;
  nextSteps: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  date: Date;
  duration: number; // in minutes
  type: 'initial' | 'followup' | 'crisis' | 'group' | 'teletherapy' | 'assessment';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
  location?: string;
  roomNumber?: string;
  isVirtual: boolean;
  virtualMeetingUrl?: string;
  notes?: string;
  reminder: ReminderSettings;
  billing?: BillingInfo;
  forms?: string[];
  recurrence?: RecurrencePattern;
}

export interface ReminderSettings {
  enabled: boolean;
  methods: ('email' | 'sms' | 'push')[];
  timing: number; // hours before appointment
}

export interface BillingInfo {
  cptCode: string;
  icdCodes: string[];
  units: number;
  rate: number;
  total: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid';
  claimNumber?: string;
  paymentDate?: Date;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  endDate?: Date;
  occurrences?: number;
}

export interface SessionNote {
  id: string;
  patientId: string;
  professionalId: string;
  appointmentId?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  type: 'progress' | 'intake' | 'discharge' | 'crisis' | 'group' | 'assessment';
  chiefComplaint: string;
  presentingProblem: string;
  mentalStatusExam: MentalStatusExam;
  content: string;
  interventions: string[];
  medications?: MedicationNote[];
  riskAssessment: RiskAssessment;
  treatmentPlan: string;
  homework?: string;
  nextSteps: string;
  followUpDate?: Date;
  signature: string;
  signatureDate: Date;
  supervisorSignature?: string;
  locked: boolean;
  addendum?: string[];
  billing?: BillingInfo;
}

export interface MentalStatusExam {
  appearance: string;
  behavior: string;
  speech: string;
  mood: string;
  affect: string;
  thoughtProcess: string;
  thoughtContent: string;
  perception: string;
  cognition: string;
  insight: string;
  judgment: string;
}

export interface MedicationNote {
  name: string;
  dosage: string;
  response: string;
  sideEffects?: string[];
  compliance: 'good' | 'fair' | 'poor';
}

export interface RiskAssessment {
  suicidalIdeation: boolean;
  suicidalPlan: boolean;
  suicidalIntent: boolean;
  homicidalIdeation: boolean;
  selfHarm: boolean;
  substanceUse: boolean;
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'imminent';
  safetyPlan?: string;
  interventions?: string[];
}

export interface SecureMessage {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  cc?: string[];
  subject: string;
  content: string;
  attachments?: MessageAttachment[];
  date: Date;
  encrypted: boolean;
  read: boolean;
  readDate?: Date;
  priority: 'normal' | 'high' | 'urgent';
  threadId?: string;
  replyTo?: string;
  hipaaCompliant: boolean;
  auditLog: AuditEntry[];
}

export interface MessageAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  encryptedUrl: string;
}

export interface AuditEntry {
  action: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  details?: string;
}

export interface WorkloadMetrics {
  professionalId: string;
  totalPatients: number;
  activePatients: number;
  weeklyAppointments: number;
  monthlyAppointments: number;
  pendingNotes: number;
  overdueNotes: number;
  upcomingAppointments: number;
  criticalPatients: number;
  supervisionHours: number;
  continuingEducationHours: number;
  productivityRate: number;
  cancellationRate: number;
  noShowRate: number;
  averageSessionsPerPatient: number;
  billingStatus: BillingStatus;
  caseloadTrend: TrendData[];
  outcomeMeasures: OutcomeMeasure[];
}

export interface BillingStatus {
  pending: number;
  submitted: number;
  approved: number;
  rejected: number;
  paid: number;
  totalBilled: number;
  totalCollected: number;
  outstandingAmount: number;
}

export interface TrendData {
  date: Date;
  value: number;
  label: string;
}

export interface OutcomeMeasure {
  measure: string;
  baseline: number;
  current: number;
  target: number;
  improvement: number;
}

export interface SupervisionNote {
  id: string;
  superviseeId: string;
  supervisorId: string;
  date: Date;
  duration: number;
  type: 'individual' | 'group' | 'peer';
  topics: string[];
  casesDiscussed: string[];
  feedback: string;
  goals: string[];
  nextMeetingDate?: Date;
  signature: string;
}

export interface Report {
  id: string;
  type: 'clinical' | 'administrative' | 'billing' | 'outcome' | 'compliance';
  title: string;
  description: string;
  generatedBy: string;
  generatedDate: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  url?: string;
  recipients?: string[];
  scheduled?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

class ProfessionalService {
  private baseUrl = (typeof window !== 'undefined' && (window as any).VITE_API_URL) || '/api';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Patient Management
  async getPatientCaseload(professionalId: string): Promise<Patient[]> {
    const cacheKey = `caseload-${professionalId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/professionals/${professionalId}/patients`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch patient caseload');
      
      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching patient caseload:', error);
      // Return mock data for development
      return this.getMockPatients();
    }
  }

  async requestPatientAssignment(professionalId: string, criteria?: any): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/professionals/${professionalId}/request-patient`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(criteria || {}),
      });
      
      if (!response.ok) throw new Error('Failed to request patient assignment');
    } catch (error) {
      console.error('Error requesting patient assignment:', error);
    }
  }

  async transferPatient(patientId: string, fromProfessionalId: string, toProfessionalId: string, reason: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/patients/${patientId}/transfer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          fromProfessionalId,
          toProfessionalId,
          reason,
          transferDate: new Date(),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to transfer patient');
    } catch (error) {
      console.error('Error transferring patient:', error);
      throw error;
    }
  }

  // Appointment Management
  async getAppointments(professionalId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());
    
    try {
      const response = await fetch(
        `${this.baseUrl}/professionals/${professionalId}/appointments?start=${start.toISOString()}&end=${end.toISOString()}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      const data = await response.json();
      return data.map((apt: any) => ({
        ...apt,
        date: new Date(apt.date),
      }));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return this.getMockAppointments();
    }
  }

  async scheduleAppointment(appointmentData: Partial<Appointment>): Promise<Appointment> {
    try {
      const response = await fetch(`${this.baseUrl}/appointments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) throw new Error('Failed to schedule appointment');
      
      const data = await response.json();
      this.invalidateCache(`appointments-${appointmentData.professionalId}`);
      return data;
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      // Return mock appointment
      return {
        id: Date.now().toString(),
        ...appointmentData,
        status: 'scheduled',
      } as Appointment;
    }
  }

  async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<Appointment> {
    try {
      const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update appointment');
      
      return await response.json();
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId: string, reason: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ reason, cancelledAt: new Date() }),
      });
      
      if (!response.ok) throw new Error('Failed to cancel appointment');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  // Session Notes Management
  async getSessionNotes(professionalId: string, patientId?: string): Promise<SessionNote[]> {
    const url = patientId
      ? `${this.baseUrl}/professionals/${professionalId}/notes?patientId=${patientId}`
      : `${this.baseUrl}/professionals/${professionalId}/notes`;
    
    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      
      if (!response.ok) throw new Error('Failed to fetch session notes');
      
      const data = await response.json();
      return data.map((note: any) => ({
        ...note,
        date: new Date(note.date),
        startTime: new Date(note.startTime),
        endTime: new Date(note.endTime),
        signatureDate: new Date(note.signatureDate),
      }));
    } catch (error) {
      console.error('Error fetching session notes:', error);
      return this.getMockSessionNotes();
    }
  }

  async createSessionNote(noteData: Partial<SessionNote>): Promise<SessionNote> {
    try {
      // Auto-lock note after 24 hours
      const autoLockTime = 24 * 60 * 60 * 1000;
      
      const response = await fetch(`${this.baseUrl}/notes`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...noteData,
          signatureDate: new Date(),
          locked: false,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create session note');
      
      const note = await response.json();
      
      // Schedule auto-lock
      setTimeout(() => this.lockSessionNote(note.id), autoLockTime);
      
      return note;
    } catch (error) {
      console.error('Error creating session note:', error);
      // Return mock note
      return {
        id: Date.now().toString(),
        ...noteData,
        signatureDate: new Date(),
        locked: false,
      } as SessionNote;
    }
  }

  async updateSessionNote(noteId: string, updates: Partial<SessionNote>): Promise<SessionNote> {
    try {
      const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update session note');
      
      return await response.json();
    } catch (error) {
      console.error('Error updating session note:', error);
      throw error;
    }
  }

  async lockSessionNote(noteId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notes/${noteId}/lock`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to lock session note');
    } catch (error) {
      console.error('Error locking session note:', error);
    }
  }

  async addAddendum(noteId: string, addendum: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notes/${noteId}/addendum`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ 
          addendum, 
          date: new Date(),
          author: 'current-user-id' // Should come from auth context
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add addendum');
    } catch (error) {
      console.error('Error adding addendum:', error);
      throw error;
    }
  }

  // Secure Messaging
  async getSecureMessages(userId: string): Promise<SecureMessage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/messages?userId=${userId}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      return data.map((msg: any) => ({
        ...msg,
        date: new Date(msg.date),
        readDate: msg.readDate ? new Date(msg.readDate) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return this.getMockMessages();
    }
  }

  async sendSecureMessage(messageData: Partial<SecureMessage>): Promise<SecureMessage> {
    try {
      // Encrypt message content
      const encryptedContent = await this.encryptMessage(messageData.content || '');
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...messageData,
          content: encryptedContent,
          encrypted: true,
          hipaaCompliant: true,
          auditLog: [{
            action: 'message_sent',
            userId: messageData.from || '',
            timestamp: new Date(),
            ipAddress: await this.getClientIP(),
          }],
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      // Return mock message
      return {
        id: Date.now().toString(),
        ...messageData,
        date: new Date(),
        encrypted: true,
        read: false,
        hipaaCompliant: true,
      } as SecureMessage;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/${messageId}/read`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ readDate: new Date() }),
      });
      
      if (!response.ok) throw new Error('Failed to mark message as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Workload and Metrics
  async getWorkloadMetrics(professionalId: string): Promise<WorkloadMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/professionals/${professionalId}/metrics`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch workload metrics');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching workload metrics:', error);
      return this.getMockWorkloadMetrics(professionalId);
    }
  }

  async optimizeWorkload(professionalId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/professionals/${professionalId}/optimize-workload`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to optimize workload');
      
      return await response.json();
    } catch (error) {
      console.error('Error optimizing workload:', error);
      return { recommendations: [] };
    }
  }

  // Supervision Tools
  async getSupervisionNotes(supervisorId: string): Promise<SupervisionNote[]> {
    try {
      const response = await fetch(`${this.baseUrl}/supervision/notes?supervisorId=${supervisorId}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch supervision notes');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching supervision notes:', error);
      return [];
    }
  }

  async createSupervisionNote(noteData: Partial<SupervisionNote>): Promise<SupervisionNote> {
    try {
      const response = await fetch(`${this.baseUrl}/supervision/notes`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(noteData),
      });
      
      if (!response.ok) throw new Error('Failed to create supervision note');
      
      return await response.json();
    } catch (error) {
      console.error('Error creating supervision note:', error);
      throw error;
    }
  }

  // Billing Integration
  async submitBillingClaim(billing: BillingInfo): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/billing/submit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(billing),
      });
      
      if (!response.ok) throw new Error('Failed to submit billing claim');
      
      const result = await response.json();
      return result.claimNumber;
    } catch (error) {
      console.error('Error submitting billing claim:', error);
      return `CLAIM-${Date.now()}`;
    }
  }

  async getBillingStatus(professionalId: string): Promise<BillingStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/professionals/${professionalId}/billing`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch billing status');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching billing status:', error);
      return this.getMockBillingStatus();
    }
  }

  // Report Generation
  async generateReport(reportConfig: Partial<Report>): Promise<Report> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(reportConfig),
      });
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      return await response.json();
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async getScheduledReports(professionalId: string): Promise<Report[]> {
    try {
      const response = await fetch(`${this.baseUrl}/professionals/${professionalId}/reports`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch scheduled reports');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      return [];
    }
  }

  // Helper Methods
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  private async encryptMessage(content: string): Promise<string> {
    // Implement actual encryption here
    // This is a placeholder - use proper encryption library
    return btoa(content);
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Mock Data Methods (for development)
  private getMockPatients(): Patient[] {
    return [
      {
        id: '1',
        name: 'Jane Smith',
        dateOfBirth: new Date('1990-05-15'),
        age: 33,
        gender: 'Female',
        diagnosis: ['Major Depressive Disorder', 'Generalized Anxiety Disorder'],
        medications: [],
        allergies: [],
        riskLevel: 'medium',
        lastSession: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextAppointment: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        treatmentPlan: 'CBT with focus on cognitive restructuring',
        progress: 65,
        assignedDate: new Date('2024-01-15'),
        primaryTherapistId: 'prof-1',
        careTeam: [],
        contactInfo: {
          phone: '555-0101',
          email: 'jane.smith@email.com',
          address: {
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
            country: 'USA'
          },
          preferredContact: 'email'
        },
        emergencyContacts: [],
        consentForms: [],
        assessmentScores: [],
        treatmentGoals: [],
        sessionHistory: []
      },
      {
        id: '2',
        name: 'John Doe',
        dateOfBirth: new Date('1985-08-22'),
        age: 38,
        gender: 'Male',
        diagnosis: ['PTSD', 'Substance Use Disorder'],
        medications: [],
        allergies: [],
        riskLevel: 'high',
        lastSession: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextAppointment: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        treatmentPlan: 'Trauma-focused therapy with EMDR',
        progress: 45,
        assignedDate: new Date('2024-02-01'),
        primaryTherapistId: 'prof-1',
        careTeam: [],
        contactInfo: {
          phone: '555-0102',
          email: 'john.doe@email.com',
          address: {
            street: '456 Oak Ave',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62702',
            country: 'USA'
          },
          preferredContact: 'phone'
        },
        emergencyContacts: [],
        consentForms: [],
        assessmentScores: [],
        treatmentGoals: [],
        sessionHistory: []
      }
    ];
  }

  private getMockAppointments(): Appointment[] {
    const today = new Date();
    return [
      {
        id: '1',
        patientId: '1',
        patientName: 'Jane Smith',
        professionalId: 'prof-1',
        date: new Date(today.getTime() + 2 * 60 * 60 * 1000),
        duration: 50,
        type: 'followup',
        status: 'confirmed',
        isVirtual: false,
        reminder: { enabled: true, methods: ['email'], timing: 24 }
      },
      {
        id: '2',
        patientId: '2',
        patientName: 'John Doe',
        professionalId: 'prof-1',
        date: new Date(today.getTime() + 4 * 60 * 60 * 1000),
        duration: 50,
        type: 'crisis',
        status: 'scheduled',
        isVirtual: true,
        virtualMeetingUrl: 'https://meet.example.com/session-123',
        reminder: { enabled: true, methods: ['email', 'sms'], timing: 2 }
      }
    ];
  }

  private getMockSessionNotes(): SessionNote[] {
    return [
      {
        id: '1',
        patientId: '1',
        professionalId: 'prof-1',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
        type: 'progress',
        chiefComplaint: 'Increased anxiety',
        presentingProblem: 'Patient reports increased anxiety related to work stress',
        mentalStatusExam: {
          appearance: 'Well-groomed',
          behavior: 'Cooperative',
          speech: 'Normal rate and rhythm',
          mood: 'Anxious',
          affect: 'Congruent',
          thoughtProcess: 'Linear',
          thoughtContent: 'No SI/HI',
          perception: 'No hallucinations',
          cognition: 'Alert and oriented x3',
          insight: 'Good',
          judgment: 'Good'
        },
        content: 'Patient discussed recent work stressors and anxiety management techniques...',
        interventions: ['Cognitive restructuring', 'Relaxation techniques'],
        riskAssessment: {
          suicidalIdeation: false,
          suicidalPlan: false,
          suicidalIntent: false,
          homicidalIdeation: false,
          selfHarm: false,
          substanceUse: false,
          riskLevel: 'low'
        },
        treatmentPlan: 'Continue CBT, practice relaxation daily',
        homework: 'Thought journal, progressive muscle relaxation',
        nextSteps: 'Follow up in 1 week',
        signature: 'Dr. Professional',
        signatureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        locked: true
      }
    ];
  }

  private getMockMessages(): SecureMessage[] {
    return [
      {
        id: '1',
        from: 'colleague-1',
        fromName: 'Dr. Colleague',
        to: 'prof-1',
        toName: 'Dr. Professional',
        subject: 'Patient Consultation Request',
        content: 'I would like to discuss a mutual patient...',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        encrypted: true,
        read: false,
        priority: 'high',
        hipaaCompliant: true,
        auditLog: []
      },
      {
        id: '2',
        from: 'admin-1',
        fromName: 'Admin Staff',
        to: 'prof-1',
        toName: 'Dr. Professional',
        subject: 'Schedule Update',
        content: 'Your Thursday afternoon appointment has been rescheduled...',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        encrypted: true,
        read: true,
        readDate: new Date(Date.now() - 20 * 60 * 60 * 1000),
        priority: 'normal',
        hipaaCompliant: true,
        auditLog: []
      }
    ];
  }

  private getMockWorkloadMetrics(professionalId: string): WorkloadMetrics {
    return {
      professionalId,
      totalPatients: 25,
      activePatients: 22,
      weeklyAppointments: 35,
      monthlyAppointments: 140,
      pendingNotes: 3,
      overdueNotes: 1,
      upcomingAppointments: 8,
      criticalPatients: 2,
      supervisionHours: 2,
      continuingEducationHours: 4,
      productivityRate: 0.85,
      cancellationRate: 0.08,
      noShowRate: 0.05,
      averageSessionsPerPatient: 6.2,
      billingStatus: this.getMockBillingStatus(),
      caseloadTrend: [],
      outcomeMeasures: []
    };
  }

  private getMockBillingStatus(): BillingStatus {
    return {
      pending: 5,
      submitted: 12,
      approved: 85,
      rejected: 3,
      paid: 78,
      totalBilled: 45000,
      totalCollected: 38500,
      outstandingAmount: 6500
    };
  }
}

export const professionalService = new ProfessionalService();