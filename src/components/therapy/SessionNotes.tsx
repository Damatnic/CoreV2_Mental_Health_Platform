/**
 * SessionNotes Component
 * HIPAA-compliant session notes management for therapy sessions
 * Ensures privacy and encryption of sensitive mental health data
 */

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';

// Type definitions for session notes
export interface SessionNote {
  id: string;
  sessionId: string;
  therapistId: string;
  patientId: string;
  date: Date;
  type: 'individual' | 'group' | 'family' | 'couples';
  duration: number; // in minutes
  content: {
    chiefComplaint?: string;
    subjectiveObservations?: string;
    objectiveAssessment?: string;
    interventions?: string[];
    plan?: string;
    progressNotes?: string;
    riskAssessment?: RiskAssessment;
  };
  diagnoses?: DiagnosisCode[];
  medications?: MedicationNote[];
  encrypted: boolean;
  signature?: {
    therapistSignature: string;
    signedAt: Date;
    locked: boolean;
  };
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
  };
}

export interface RiskAssessment {
  suicidalIdeation: 'none' | 'passive' | 'active' | 'plan' | 'imminent';
  homicidalIdeation: 'none' | 'passive' | 'active' | 'plan' | 'imminent';
  selfHarm: 'none' | 'historical' | 'recent' | 'current';
  substanceUse: 'none' | 'historical' | 'current' | 'active';
  notes?: string;
}

export interface DiagnosisCode {
  code: string; // ICD-10 or DSM-5 code
  description: string;
  primary: boolean;
  dateAdded: Date;
}

export interface MedicationNote {
  name: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

// Props for the component
export interface SessionNotesProps {
  sessionId: string;
  patientId: string;
  therapistId: string;
  mode?: 'create' | 'edit' | 'view';
  onSave?: (note: SessionNote) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<SessionNote>;
  encryptionEnabled?: boolean;
  autoSaveInterval?: number; // in seconds
}

// Session Notes Component
export const SessionNotes: React.FC<SessionNotesProps> = ({
  sessionId,
  patientId,
  therapistId,
  mode = 'create',
  onSave,
  onCancel,
  initialData,
  encryptionEnabled = true,
  autoSaveInterval = 30
}) => {
  // State management
  const [note, setNote] = useState<Partial<SessionNote>>(() => ({
    sessionId,
    patientId,
    therapistId,
    date: new Date(),
    type: 'individual',
    duration: 50,
    content: {},
    encrypted: encryptionEnabled,
    ...initialData
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (mode === 'edit' && autoSaveInterval > 0) {
      const timer = setInterval(() => {
        handleAutoSave();
      }, autoSaveInterval * 1000);

      return () => clearInterval(timer);
    }
  }, [note, mode, autoSaveInterval]);

  // Handle auto-save
  const handleAutoSave = useCallback(async () => {
    if (isLocked || !onSave) return;
    
    try {
      await onSave(note as SessionNote);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [note, isLocked, onSave]);

  // Update note content
  const updateContent = useCallback((field: keyof SessionNote['content'], value: any) => {
    setNote(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  }, []);

  // Update risk assessment
  const updateRiskAssessment = useCallback((field: keyof RiskAssessment, value: any) => {
    setNote(prev => ({
      ...prev,
      content: {
        ...prev.content,
        riskAssessment: {
          ...(prev.content?.riskAssessment || {
            suicidalIdeation: 'none',
            homicidalIdeation: 'none',
            selfHarm: 'none',
            substanceUse: 'none'
          }),
          [field]: value
        }
      }
    }));
  }, []);

  // Add diagnosis
  const addDiagnosis = useCallback((diagnosis: DiagnosisCode) => {
    setNote(prev => ({
      ...prev,
      diagnoses: [...(prev.diagnoses || []), diagnosis]
    }));
  }, []);

  // Remove diagnosis
  const removeDiagnosis = useCallback((index: number) => {
    setNote(prev => ({
      ...prev,
      diagnoses: prev.diagnoses?.filter((_, i) => i !== index)
    }));
  }, []);

  // Add medication
  const addMedication = useCallback((medication: MedicationNote) => {
    setNote(prev => ({
      ...prev,
      medications: [...(prev.medications || []), medication]
    }));
  }, []);

  // Validate note
  const validateNote = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!note.content?.chiefComplaint) {
      newErrors.chiefComplaint = 'Chief complaint is required';
    }

    if (!note.content?.objectiveAssessment) {
      newErrors.objectiveAssessment = 'Objective assessment is required';
    }

    if (!note.content?.plan) {
      newErrors.plan = 'Treatment plan is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [note]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateNote() || !onSave) return;

    setIsSaving(true);
    try {
      await onSave({
        ...note,
        id: note.id || `note-${Date.now()}`,
        metadata: {
          ...note.metadata,
          updatedAt: new Date(),
          version: (note.metadata?.version || 0) + 1
        }
      } as SessionNote);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save session note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note, validateNote, onSave]);

  // Handle signature and lock
  const handleSignAndLock = useCallback(() => {
    setNote(prev => ({
      ...prev,
      signature: {
        therapistSignature: therapistId,
        signedAt: new Date(),
        locked: true
      }
    }));
    setIsLocked(true);
  }, [therapistId]);

  // Risk level indicator
  const getRiskLevel = useMemo(() => {
    const risk = note.content?.riskAssessment;
    if (!risk) return 'none';

    const levels = [
      risk.suicidalIdeation,
      risk.homicidalIdeation
    ];

    if (levels.includes('imminent')) return 'critical';
    if (levels.includes('plan')) return 'high';
    if (levels.includes('active')) return 'moderate';
    if (levels.includes('passive')) return 'low';
    return 'none';
  }, [note.content?.riskAssessment]);

  // Render risk indicator
  const renderRiskIndicator = () => {
    const riskColors = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      moderate: 'bg-yellow-500',
      low: 'bg-blue-500',
      none: 'bg-gray-400'
    };

    const riskLevel = getRiskLevel as keyof typeof riskColors;

    return React.createElement('div', {
      className: 'flex items-center gap-2'
    }, [
      React.createElement('span', {
        key: 'indicator',
        className: `inline-block w-3 h-3 rounded-full ${riskColors[riskLevel]}`
      }),
      React.createElement('span', {
        key: 'text',
        className: 'text-sm font-medium'
      }, `Risk Level: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`)
    ]);
  };

  // Render form based on mode
  const isReadOnly = mode === 'view' || isLocked;

  return React.createElement('div', {
    className: 'session-notes-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      className: 'mb-6 pb-4 border-b'
    }, [
      React.createElement('h2', {
        key: 'title',
        className: 'text-2xl font-bold text-gray-900 mb-2'
      }, mode === 'create' ? 'New Session Note' : 'Session Note'),
      
      React.createElement('div', {
        key: 'meta',
        className: 'flex items-center justify-between'
      }, [
        renderRiskIndicator(),
        lastSaved && React.createElement('span', {
          key: 'saved',
          className: 'text-sm text-gray-500'
        }, `Last saved: ${lastSaved.toLocaleTimeString()}`)
      ])
    ]),

    // Session Info
    React.createElement('div', {
      key: 'session-info',
      className: 'grid grid-cols-2 gap-4 mb-6'
    }, [
      React.createElement('div', { key: 'date' }, [
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Session Date'),
        React.createElement('input', {
          type: 'date',
          value: note.date ? new Date(note.date).toISOString().split('T')[0] : '',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
            setNote(prev => ({ ...prev, date: new Date(e.target.value) })),
          disabled: isReadOnly,
          className: 'w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500'
        })
      ]),

      React.createElement('div', { key: 'duration' }, [
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Duration (minutes)'),
        React.createElement('input', {
          type: 'number',
          value: note.duration || 50,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
            setNote(prev => ({ ...prev, duration: parseInt(e.target.value) })),
          disabled: isReadOnly,
          className: 'w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500'
        })
      ])
    ]),

    // Chief Complaint
    React.createElement('div', {
      key: 'chief-complaint',
      className: 'mb-6'
    }, [
      React.createElement('label', {
        className: 'block text-sm font-medium text-gray-700 mb-1'
      }, 'Chief Complaint *'),
      React.createElement('textarea', {
        value: note.content?.chiefComplaint || '',
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => 
          updateContent('chiefComplaint', e.target.value),
        disabled: isReadOnly,
        rows: 3,
        className: `w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
          errors.chiefComplaint ? 'border-red-500' : ''
        }`
      }),
      errors.chiefComplaint && React.createElement('p', {
        className: 'mt-1 text-sm text-red-600'
      }, errors.chiefComplaint)
    ]),

    // Risk Assessment
    React.createElement('div', {
      key: 'risk-assessment',
      className: 'mb-6 p-4 bg-gray-50 rounded-lg'
    }, [
      React.createElement('h3', {
        className: 'text-lg font-semibold mb-4'
      }, 'Risk Assessment'),
      
      React.createElement('div', {
        className: 'grid grid-cols-2 gap-4'
      }, [
        // Suicidal Ideation
        React.createElement('div', { key: 'suicidal' }, [
          React.createElement('label', {
            className: 'block text-sm font-medium text-gray-700 mb-1'
          }, 'Suicidal Ideation'),
          React.createElement('select', {
            value: note.content?.riskAssessment?.suicidalIdeation || 'none',
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => 
              updateRiskAssessment('suicidalIdeation', e.target.value),
            disabled: isReadOnly,
            className: 'w-full px-3 py-2 border rounded-md'
          }, [
            React.createElement('option', { key: 'none', value: 'none' }, 'None'),
            React.createElement('option', { key: 'passive', value: 'passive' }, 'Passive'),
            React.createElement('option', { key: 'active', value: 'active' }, 'Active'),
            React.createElement('option', { key: 'plan', value: 'plan' }, 'With Plan'),
            React.createElement('option', { key: 'imminent', value: 'imminent' }, 'Imminent Risk')
          ])
        ]),

        // Self-Harm
        React.createElement('div', { key: 'self-harm' }, [
          React.createElement('label', {
            className: 'block text-sm font-medium text-gray-700 mb-1'
          }, 'Self-Harm'),
          React.createElement('select', {
            value: note.content?.riskAssessment?.selfHarm || 'none',
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => 
              updateRiskAssessment('selfHarm', e.target.value),
            disabled: isReadOnly,
            className: 'w-full px-3 py-2 border rounded-md'
          }, [
            React.createElement('option', { key: 'none', value: 'none' }, 'None'),
            React.createElement('option', { key: 'historical', value: 'historical' }, 'Historical'),
            React.createElement('option', { key: 'recent', value: 'recent' }, 'Recent'),
            React.createElement('option', { key: 'current', value: 'current' }, 'Current')
          ])
        ])
      ])
    ]),

    // Action Buttons
    !isReadOnly && React.createElement('div', {
      key: 'actions',
      className: 'flex justify-between mt-8'
    }, [
      React.createElement('div', {
        key: 'left',
        className: 'flex gap-3'
      }, [
        React.createElement('button', {
          key: 'save',
          onClick: handleSave,
          disabled: isSaving,
          className: 'px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
        }, isSaving ? 'Saving...' : 'Save Note'),
        
        onCancel && React.createElement('button', {
          key: 'cancel',
          onClick: onCancel,
          className: 'px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
        }, 'Cancel')
      ]),

      mode === 'edit' && !isLocked && React.createElement('button', {
        key: 'sign',
        onClick: handleSignAndLock,
        className: 'px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
      }, 'Sign & Lock')
    ])
  ]);
};

// Export additional utilities
export const createEmptyNote = (): Partial<SessionNote> => ({
  content: {
    chiefComplaint: '',
    subjectiveObservations: '',
    objectiveAssessment: '',
    interventions: [],
    plan: '',
    progressNotes: '',
    riskAssessment: {
      suicidalIdeation: 'none',
      homicidalIdeation: 'none',
      selfHarm: 'none',
      substanceUse: 'none'
    }
  },
  diagnoses: [],
  medications: [],
  encrypted: true
});

export default SessionNotes;