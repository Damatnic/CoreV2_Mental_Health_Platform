/**
 * Symptom Tracker Component
 * Provides intuitive UI for logging symptoms with visual severity scales and quick entry forms
 */

import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  symptomTrackingService,
  SymptomCategory,
  SymptomType,
  Symptom,
  Trigger,
  TriggerCategory,
  MedicationLog,
  TimeOfDay,
  SymptomContext
} from '../../services/symptom/symptomTrackingService';
import { useAuth } from '../../contexts/AuthContext';
import { FiActivity, FiHeart, FiBrain, FiUser, FiClock, FiMapPin, FiAlertCircle, FiSave, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface SymptomTrackerProps {
  onSymptomLogged?: (symptom: Symptom) => void;
  defaultCategory?: SymptomCategory;
  quickMode?: boolean;
}

export const SymptomTracker: React.FC<SymptomTrackerProps> = ({
  onSymptomLogged,
  defaultCategory = SymptomCategory.GENERAL,
  quickMode = false
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [category, setCategory] = useState<SymptomCategory>(defaultCategory);
  const [type, setType] = useState<SymptomType>(SymptomType.EMOTIONAL);
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');
  const [customSymptom, setCustomSymptom] = useState<string>('');
  const [severity, setSeverity] = useState<number>(5);
  const [duration, setDuration] = useState<number | undefined>();
  const [selectedTriggers, setSelectedTriggers] = useState<Trigger[]>([]);
  const [medications, setMedications] = useState<MedicationLog[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [bodyLocation, setBodyLocation] = useState<string>('');
  
  // Context state
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [activity, setActivity] = useState<string>('');
  const [mood, setMood] = useState<number>(5);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [sleepQuality, setSleepQuality] = useState<number>(5);
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(!quickMode);
  const [availableSymptoms, setAvailableSymptoms] = useState<string[]>([]);
  const [availableTriggers, setAvailableTriggers] = useState<Trigger[]>([]);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [newMedication, setNewMedication] = useState<Partial<MedicationLog>>({});
  
  // Load symptom templates based on category
  useEffect(() => {
    const templates = symptomTrackingService.getSymptomTemplates(category);
    const typeSymptoms = templates[type] || [];
    setAvailableSymptoms(typeSymptoms);
    setSelectedSymptom('');
    setCustomSymptom('');
  }, [category, type]);
  
  // Load common triggers
  useEffect(() => {
    const triggers = symptomTrackingService.getCommonTriggers(category);
    setAvailableTriggers(triggers);
  }, [category]);
  
  // Get current time of day
  function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 7) return TimeOfDay.EARLY_MORNING;
    if (hour >= 7 && hour < 12) return TimeOfDay.MORNING;
    if (hour >= 12 && hour < 17) return TimeOfDay.AFTERNOON;
    if (hour >= 17 && hour < 21) return TimeOfDay.EVENING;
    if (hour >= 21 && hour < 24) return TimeOfDay.NIGHT;
    return TimeOfDay.LATE_NIGHT;
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to track symptoms');
      return;
    }
    
    const symptomName = selectedSymptom || customSymptom;
    if (!symptomName) {
      toast.error('Please select or enter a symptom');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const context: SymptomContext = {
        timeOfDay,
        activity: activity || undefined,
        mood: showAdvanced ? mood : undefined,
        energyLevel: showAdvanced ? energyLevel : undefined,
        stressLevel: showAdvanced ? stressLevel : undefined,
        sleepQuality: showAdvanced ? sleepQuality : undefined
      };
      
      const symptom = await symptomTrackingService.logSymptom({
        userId: user.id,
        category,
        type,
        name: symptomName,
        severity,
        duration,
        triggers: selectedTriggers.length > 0 ? selectedTriggers : undefined,
        medications: medications.length > 0 ? medications : undefined,
        notes: notes || undefined,
        context,
        location: type === SymptomType.PHYSICAL && bodyLocation ? bodyLocation : undefined
      });
      
      toast.success('Symptom logged successfully');
      onSymptomLogged?.(symptom);
      
      // Reset form
      if (quickMode) {
        setSeverity(5);
        setSelectedTriggers([]);
        setNotes('');
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('Error logging symptom:', error);
      toast.error('Failed to log symptom');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setSelectedSymptom('');
    setCustomSymptom('');
    setSeverity(5);
    setDuration(undefined);
    setSelectedTriggers([]);
    setMedications([]);
    setNotes('');
    setBodyLocation('');
    setActivity('');
    setMood(5);
    setEnergyLevel(5);
    setStressLevel(5);
    setSleepQuality(5);
  };
  
  // Handle trigger selection
  const toggleTrigger = (trigger: Trigger) => {
    setSelectedTriggers(prev => {
      const exists = prev.find(t => t.id === trigger.id);
      if (exists) {
        return prev.filter(t => t.id !== trigger.id);
      }
      return [...prev, trigger];
    });
  };
  
  // Handle medication addition
  const addMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      const medication: MedicationLog = {
        id: `med_${Date.now()}`,
        name: newMedication.name,
        dosage: newMedication.dosage,
        takenAt: new Date(),
        effectiveness: newMedication.effectiveness
      };
      setMedications(prev => [...prev, medication]);
      setNewMedication({});
      setShowMedicationForm(false);
    }
  };
  
  // Remove medication
  const removeMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };
  
  // Render severity scale
  const renderSeverityScale = () => {
    const labels = ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'];
    const colors = [
      'bg-green-500',
      'bg-yellow-400',
      'bg-yellow-500',
      'bg-orange-500',
      'bg-red-500'
    ];
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Severity: {severity}/10
        </label>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSeverity(Math.max(0, severity - 1))}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Decrease severity"
          >
            <FiMinus className="w-4 h-4" />
          </button>
          
          <div className="flex-1">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                style={{
                  background: `linear-gradient(to right, ${colors[Math.floor(severity / 2.5)]} 0%, ${colors[Math.floor(severity / 2.5)]} ${severity * 10}%, #e5e7eb ${severity * 10}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between mt-1">
                {[0, 2.5, 5, 7.5, 10].map((val, idx) => (
                  <span
                    key={val}
                    className="text-xs text-gray-500 dark:text-gray-400"
                    style={{ marginLeft: idx === 0 ? 0 : -10 }}
                  >
                    {labels[idx]}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setSeverity(Math.min(10, severity + 1))}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Increase severity"
          >
            <FiPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };
  
  // Render category icons
  const getCategoryIcon = (cat: SymptomCategory) => {
    switch (cat) {
      case SymptomCategory.ANXIETY:
        return <FiAlertCircle className="w-5 h-5" />;
      case SymptomCategory.DEPRESSION:
        return <FiHeart className="w-5 h-5" />;
      case SymptomCategory.ADHD:
      case SymptomCategory.PTSD:
        return <FiBrain className="w-5 h-5" />;
      default:
        return <FiActivity className="w-5 h-5" />;
    }
  };
  
  // Render type icons
  const getTypeIcon = (t: SymptomType) => {
    switch (t) {
      case SymptomType.PHYSICAL:
        return <FiActivity className="w-5 h-5" />;
      case SymptomType.EMOTIONAL:
        return <FiHeart className="w-5 h-5" />;
      case SymptomType.COGNITIVE:
        return <FiBrain className="w-5 h-5" />;
      case SymptomType.BEHAVIORAL:
        return <FiUser className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Track Symptom
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <FiClock className="w-4 h-4" />
          <span>{format(new Date(), 'PPp')}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.values(SymptomCategory).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`p-3 rounded-lg border-2 transition-all ${
                category === cat
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                {getCategoryIcon(cat)}
                <span className="text-xs capitalize">{cat.replace('_', ' ')}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Type Selection */}
        <div className="grid grid-cols-4 gap-2">
          {Object.values(SymptomType).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`p-3 rounded-lg border-2 transition-all ${
                type === t
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                {getTypeIcon(t)}
                <span className="text-xs capitalize">{t}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Symptom Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Symptom
          </label>
          
          {availableSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {availableSymptoms.map(symptom => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => {
                    setSelectedSymptom(symptom);
                    setCustomSymptom('');
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedSymptom === symptom
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          )}
          
          <input
            type="text"
            value={customSymptom}
            onChange={(e) => {
              setCustomSymptom(e.target.value);
              setSelectedSymptom('');
            }}
            placeholder="Or type your own symptom..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        {/* Body Location (for physical symptoms) */}
        {type === SymptomType.PHYSICAL && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <FiMapPin className="inline w-4 h-4 mr-1" />
              Location (optional)
            </label>
            <input
              type="text"
              value={bodyLocation}
              onChange={(e) => setBodyLocation(e.target.value)}
              placeholder="e.g., Head, chest, stomach..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}
        
        {/* Severity Scale */}
        {renderSeverityScale()}
        
        {/* Duration */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Duration (optional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={duration || ''}
              onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="0"
              min="0"
              className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
          </div>
        </div>
        
        {/* Triggers */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Triggers (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTriggers.map(trigger => (
              <button
                key={trigger.id}
                type="button"
                onClick={() => toggleTrigger(trigger)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedTriggers.find(t => t.id === trigger.id)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {trigger.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Medications */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Medications (optional)
            </label>
            <button
              type="button"
              onClick={() => setShowMedicationForm(!showMedicationForm)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              <FiPlus className="inline w-4 h-4 mr-1" />
              Add Medication
            </button>
          </div>
          
          {showMedicationForm && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
              <input
                type="text"
                value={newMedication.name || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Medication name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                value={newMedication.dosage || ''}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="Dosage (e.g., 10mg)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Effectiveness (0-10):
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={newMedication.effectiveness || 5}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, effectiveness: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm font-medium">{newMedication.effectiveness || 5}</span>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMedicationForm(false);
                    setNewMedication({});
                  }}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addMedication}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Add
                </button>
              </div>
            </div>
          )}
          
          {medications.length > 0 && (
            <div className="space-y-1">
              {medications.map(med => (
                <div key={med.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-sm">
                    {med.name} ({med.dosage})
                    {med.effectiveness && ` - Effectiveness: ${med.effectiveness}/10`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMedication(med.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Advanced Options */}
        {!quickMode && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
            
            {showAdvanced && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4">
                {/* Context Sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Mood: {mood}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={mood}
                      onChange={(e) => setMood(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Energy: {energyLevel}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Stress: {stressLevel}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={stressLevel}
                      onChange={(e) => setStressLevel(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Sleep Quality: {sleepQuality}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Activity */}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Current Activity
                  </label>
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="e.g., Working, exercising, resting..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context or observations..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isLoading || (!selectedSymptom && !customSymptom)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <FiSave className="w-5 h-5" />
            <span>{isLoading ? 'Logging...' : 'Log Symptom'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};