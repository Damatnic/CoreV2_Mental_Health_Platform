import React, { useState, useEffect } from 'react';
import { Pill, Plus, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import '../../styles/MedicationManager.css';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice-daily' | 'three-times-daily' | 'weekly' | 'as-needed';
  times: string[];
  startDate: Date;
  endDate?: Date;
  notes?: string;
  color: string;
  reminders: boolean;
  sideEffects?: string[];
}

interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: Date;
  scheduledTime: string;
  notes?: string;
  missed: boolean;
}

const MedicationManager: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [todaysDoses, setTodaysDoses] = useState<any[]>([]);

  useEffect(() => {
    loadMedications();
    loadTodaysDoses();
  }, []);

  const loadMedications = () => {
    // Mock data - in real app, load from API
    const mockMedications: Medication[] = [
      {
        id: '1',
        name: 'Sertraline',
        dosage: '50mg',
        frequency: 'daily',
        times: ['09:00'],
        startDate: new Date('2024-01-15'),
        notes: 'Take with food',
        color: '#3b82f6',
        reminders: true,
        sideEffects: ['Nausea', 'Drowsiness']
      },
      {
        id: '2',
        name: 'Lorazepam',
        dosage: '0.5mg',
        frequency: 'as-needed',
        times: [],
        startDate: new Date('2024-01-20'),
        notes: 'For anxiety attacks only',
        color: '#ef4444',
        reminders: false
      }
    ];
    setMedications(mockMedications);
  };

  const loadTodaysDoses = () => {
    const today = new Date();
    const doses: any[] = [];

    medications.forEach(med => {
      if (med.frequency !== 'as-needed') {
        med.times.forEach(time => {
          const scheduledTime = new Date(today);
          const [hours, minutes] = time.split(':');
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          const taken = medicationLogs.some(log => 
            log.medicationId === med.id &&
            log.scheduledTime === time &&
            log.takenAt.toDateString() === today.toDateString()
          );

          doses.push({
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: time,
            scheduledDateTime: scheduledTime,
            taken,
            overdue: scheduledTime < new Date() && !taken,
            color: med.color
          });
        });
      }
    });

    setTodaysDoses(doses.sort((a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime()));
  };

  const addMedication = (medicationData: Omit<Medication, 'id'>) => {
    const newMedication: Medication = {
      id: Date.now().toString(),
      ...medicationData
    };
    setMedications([...medications, newMedication]);
    setShowAddForm(false);
  };

  const logMedication = (medicationId: string, scheduledTime: string, taken: boolean = true) => {
    const log: MedicationLog = {
      id: Date.now().toString(),
      medicationId,
      takenAt: new Date(),
      scheduledTime,
      missed: !taken
    };
    
    setMedicationLogs([...medicationLogs, log]);
    loadTodaysDoses(); // Refresh today's doses
  };

  const getAdherenceRate = () => {
    const totalScheduled = todaysDoses.filter(d => d.scheduledDateTime <= new Date()).length;
    const totalTaken = todaysDoses.filter(d => d.taken).length;
    
    if (totalScheduled === 0) return 100;
    return Math.round((totalTaken / totalScheduled) * 100);
  };

  const getNextDose = () => {
    const upcoming = todaysDoses.filter(d => d.scheduledDateTime > new Date() && !d.taken);
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  return (
    <div className="medication-manager">
      <div className="manager-header">
        <Pill size={24} />
        <div>
          <h2>Medication Manager</h2>
          <p>Track medications and manage schedules</p>
        </div>
        <button className="add-btn" onClick={() => setShowAddForm(true)}>
          <Plus size={18} />
          Add Medication
        </button>
      </div>

      <div className="adherence-overview">
        <div className="adherence-card">
          <div className="adherence-score">
            <div className={`score-circle ${getAdherenceRate() >= 80 ? 'good' : getAdherenceRate() >= 60 ? 'fair' : 'poor'}`}>
              <span className="score-value">{getAdherenceRate()}%</span>
              <span className="score-label">Today's Adherence</span>
            </div>
          </div>
          
          <div className="adherence-stats">
            <div className="stat">
              <span className="stat-value">{todaysDoses.filter(d => d.taken).length}</span>
              <span className="stat-label">Taken</span>
            </div>
            <div className="stat">
              <span className="stat-value">{todaysDoses.filter(d => d.overdue).length}</span>
              <span className="stat-label">Overdue</span>
            </div>
            <div className="stat">
              <span className="stat-value">{todaysDoses.filter(d => d.scheduledDateTime > new Date()).length}</span>
              <span className="stat-label">Upcoming</span>
            </div>
          </div>
        </div>
        
        {getNextDose() && (
          <div className="next-dose">
            <Clock size={20} />
            <div>
              <h4>Next Dose</h4>
              <p>{getNextDose()?.medicationName} {getNextDose()?.dosage}</p>
              <span>at {getNextDose()?.scheduledTime}</span>
            </div>
          </div>
        )}
      </div>

      <div className="todays-schedule">
        <h3>Today's Schedule</h3>
        <div className="doses-list">
          {todaysDoses.map((dose, index) => (
            <div key={index} className={`dose-item ${dose.taken ? 'taken' : dose.overdue ? 'overdue' : 'pending'}`}>
              <div className="dose-time">
                <span className="time">{dose.scheduledTime}</span>
                {dose.overdue && <AlertTriangle size={16} className="overdue-icon" />}
              </div>
              
              <div className="dose-info">
                <h4>{dose.medicationName}</h4>
                <span className="dosage">{dose.dosage}</span>
              </div>
              
              <div className="dose-actions">
                {!dose.taken ? (
                  <>
                    <button 
                      className="action-btn taken"
                      onClick={() => logMedication(dose.medicationId, dose.scheduledTime, true)}
                    >
                      <CheckCircle size={16} />
                      Taken
                    </button>
                    <button 
                      className="action-btn missed"
                      onClick={() => logMedication(dose.medicationId, dose.scheduledTime, false)}
                    >
                      Missed
                    </button>
                  </>
                ) : (
                  <span className="taken-indicator">
                    <CheckCircle size={16} />
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {todaysDoses.length === 0 && (
            <div className="no-doses">
              <Calendar size={32} />
              <p>No scheduled medications for today</p>
            </div>
          )}
        </div>
      </div>

      <div className="medications-list">
        <h3>My Medications</h3>
        <div className="medications-grid">
          {medications.map(medication => (
            <div 
              key={medication.id} 
              className="medication-card"
              onClick={() => setSelectedMedication(medication)}
            >
              <div className="medication-header">
                <div className="medication-color" style={{ backgroundColor: medication.color }} />
                <h4>{medication.name}</h4>
                {medication.reminders && <Clock size={16} className="reminder-icon" />}
              </div>
              
              <div className="medication-details">
                <p className="dosage">{medication.dosage}</p>
                <p className="frequency">{medication.frequency.replace('-', ' ')}</p>
                {medication.times.length > 0 && (
                  <p className="times">at {medication.times.join(', ')}</p>
                )}
              </div>
              
              {medication.notes && (
                <p className="notes">{medication.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {showAddForm && (
        <MedicationForm 
          onSave={addMedication}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {selectedMedication && (
        <MedicationDetail 
          medication={selectedMedication}
          onClose={() => setSelectedMedication(null)}
        />
      )}
    </div>
  );
};

// Add Medication Form Component
const MedicationForm: React.FC<{
  onSave: (medication: Omit<Medication, 'id'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as const,
    times: ['09:00'],
    notes: '',
    reminders: true,
    color: '#3b82f6'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      startDate: new Date(),
      sideEffects: []
    });
  };

  return (
    <div className="modal-overlay">
      <div className="medication-form">
        <h3>Add New Medication</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Medication Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Dosage</label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({...formData, dosage: e.target.value})}
              placeholder="e.g., 50mg, 1 tablet"
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit">Add Medication</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Medication Detail Component
const MedicationDetail: React.FC<{
  medication: Medication;
  onClose: () => void;
}> = ({ medication, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="medication-detail">
        <div className="detail-header">
          <h3>{medication.name}</h3>
          <button onClick={onClose}>×</button>
        </div>
        
        <div className="detail-content">
          <div className="detail-section">
            <h4>Dosage & Schedule</h4>
            <p>Dosage: {medication.dosage}</p>
            <p>Frequency: {medication.frequency}</p>
            {medication.times.length > 0 && (
              <p>Times: {medication.times.join(', ')}</p>
            )}
          </div>
          
          {medication.notes && (
            <div className="detail-section">
              <h4>Notes</h4>
              <p>{medication.notes}</p>
            </div>
          )}
          
          {medication.sideEffects && medication.sideEffects.length > 0 && (
            <div className="detail-section">
              <h4>Side Effects</h4>
              <ul>
                {medication.sideEffects.map(effect => (
                  <li key={effect}>{effect}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationManager;
