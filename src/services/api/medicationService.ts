/**
 * Medication Tracking API Service
 * Handles all medication-related API operations with offline support
 */

import { apiClient, ApiResponse } from './apiClient';
import { offlineStorage, StoreName, DataRecord } from '../../utils/offlineStorage';
import { dataSync } from '../sync/dataSync';

// Medication interface
export interface Medication {
  id: string;
  userId: string;
  name: string;
  genericName?: string;
  brand?: string;
  dosage: string;
  unit: string; // mg, ml, tablets, etc.
  frequency: {
    times: number; // times per period
    period: 'day' | 'week' | 'month';
    specificTimes?: string[]; // e.g., ['08:00', '20:00']
  };
  route: 'oral' | 'injection' | 'topical' | 'inhaled' | 'nasal' | 'other';
  purpose?: string;
  prescribedBy?: string;
  prescriptionDate?: string;
  startDate: string;
  endDate?: string;
  refillsRemaining?: number;
  nextRefillDate?: string;
  sideEffects?: string[];
  interactions?: string[];
  instructions?: string;
  foodRequirements?: 'with_food' | 'without_food' | 'no_restriction';
  isActive: boolean;
  isPRN: boolean; // as needed
  stockLevel?: number;
  lowStockThreshold?: number;
  color?: string; // pill color for identification
  shape?: string; // pill shape
  imprint?: string; // pill imprint code
  image?: string; // medication image URL
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Medication dose record
export interface MedicationDose {
  id: string;
  medicationId: string;
  userId: string;
  scheduledTime: string;
  takenTime?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped' | 'late';
  dosage?: string; // actual dose taken if different
  notes?: string;
  sideEffects?: string[];
  effectiveness?: number; // 1-5 scale
  mood?: number; // mood at time of dose
  symptoms?: string[];
  createdAt: string;
  updatedAt: string;
}

// Medication reminder
export interface MedicationReminder {
  id: string;
  medicationId: string;
  time: string;
  days: number[]; // 0-6 for Sunday-Saturday
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  message?: string;
  snoozeMinutes?: number;
  maxSnoozes?: number;
}

// Medication statistics
export interface MedicationStatistics {
  adherenceRate: number;
  totalMedications: number;
  activeMedications: number;
  dosesToday: number;
  dosesTaken: number;
  missedDoses: number;
  upcomingRefills: number;
  adherenceTrend: Array<{ date: string; rate: number }>;
  medicationBreakdown: Array<{
    medicationId: string;
    name: string;
    adherenceRate: number;
    missedCount: number;
  }>;
  sideEffectsReported: Array<{ effect: string; count: number }>;
  bestAdherenceTime: string;
  worstAdherenceTime: string;
}

// Filter options
export interface MedicationFilter {
  isActive?: boolean;
  isPRN?: boolean;
  route?: Medication['route'];
  prescribedBy?: string;
  hasRefills?: boolean;
  lowStock?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Medication Service Class
 */
class MedicationService {
  private readonly baseEndpoint = '/medications';
  private readonly dosesEndpoint = '/medication-doses';

  /**
   * Create a new medication
   */
  async createMedication(
    medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Medication> {
    try {
      // Generate ID and timestamps
      const newMedication: Medication = {
        ...medication,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to offline storage first
      await offlineStorage.put(StoreName.MEDICATIONS, newMedication.id, newMedication, {
        encrypt: true,
      });

      // Try to sync with server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.post<Medication>(this.baseEndpoint, newMedication);
          
          if (response.success && response.data) {
            // Update local storage with server response
            await offlineStorage.put(StoreName.MEDICATIONS, response.data.id, response.data, {
              encrypt: true,
            });
            
            // Mark as synced
            await offlineStorage.updateSyncStatus(StoreName.MEDICATIONS, response.data.id, 'synced');
            
            // Create reminders
            await this.createDefaultReminders(response.data);
            
            return response.data;
          }
        } catch (error) {
          console.error('Failed to sync medication, will retry later:', error);
        }
      }

      // Create local reminders
      await this.createDefaultReminders(newMedication);

      return newMedication;
    } catch (error) {
      console.error('Failed to create medication:', error);
      throw error;
    }
  }

  /**
   * Get all medications with optional filtering
   */
  async getMedications(filter?: MedicationFilter): Promise<Medication[]> {
    try {
      // Try to fetch from server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.get<Medication[]>(this.baseEndpoint, {
            params: filter,
          });

          if (response.success && response.data) {
            // Update local storage with server data
            for (const medication of response.data) {
              await offlineStorage.put(StoreName.MEDICATIONS, medication.id, medication, {
                encrypt: true,
              });
            }

            return response.data;
          }
        } catch (error) {
          console.error('Failed to fetch from server, using local data:', error);
        }
      }

      // Fallback to local storage
      const localRecords = await offlineStorage.getAll<Medication>(StoreName.MEDICATIONS);
      let medications = localRecords.map(record => record.data);

      // Apply local filtering
      if (filter) {
        medications = this.applyLocalFilter(medications, filter);
      }

      return medications;
    } catch (error) {
      console.error('Failed to get medications:', error);
      throw error;
    }
  }

  /**
   * Get a single medication by ID
   */
  async getMedication(id: string): Promise<Medication | null> {
    try {
      // Check local storage first
      const localRecord = await offlineStorage.get<Medication>(StoreName.MEDICATIONS, id);
      
      if (localRecord) {
        // Try to get updated version from server if online
        if (navigator.onLine) {
          try {
            const response = await apiClient.get<Medication>(`${this.baseEndpoint}/${id}`);
            
            if (response.success && response.data) {
              // Update local storage if server has newer version
              if (new Date(response.data.updatedAt) > new Date(localRecord.data.updatedAt)) {
                await offlineStorage.put(StoreName.MEDICATIONS, id, response.data, {
                  encrypt: true,
                });
                return response.data;
              }
            }
          } catch (error) {
            console.error('Failed to fetch from server, using local data:', error);
          }
        }
        
        return localRecord.data;
      }

      // If not in local storage and online, try server
      if (navigator.onLine) {
        const response = await apiClient.get<Medication>(`${this.baseEndpoint}/${id}`);
        
        if (response.success && response.data) {
          // Store locally for offline access
          await offlineStorage.put(StoreName.MEDICATIONS, id, response.data, {
            encrypt: true,
          });
          return response.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get medication:', error);
      throw error;
    }
  }

  /**
   * Update an existing medication
   */
  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication> {
    try {
      // Get existing medication
      const existing = await this.getMedication(id);
      
      if (!existing) {
        throw new Error('Medication not found');
      }

      // Merge updates
      const updated: Medication = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      // Save to offline storage
      await offlineStorage.put(StoreName.MEDICATIONS, id, updated, {
        encrypt: true,
      });

      // Try to sync with server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.put<Medication>(`${this.baseEndpoint}/${id}`, updated);
          
          if (response.success && response.data) {
            // Update local storage with server response
            await offlineStorage.put(StoreName.MEDICATIONS, id, response.data, {
              encrypt: true,
            });
            
            // Mark as synced
            await offlineStorage.updateSyncStatus(StoreName.MEDICATIONS, id, 'synced');
            
            return response.data;
          }
        } catch (error) {
          console.error('Failed to sync medication update, will retry later:', error);
        }
      }

      return updated;
    } catch (error) {
      console.error('Failed to update medication:', error);
      throw error;
    }
  }

  /**
   * Delete a medication
   */
  async deleteMedication(id: string): Promise<boolean> {
    try {
      // Delete from local storage
      await offlineStorage.delete(StoreName.MEDICATIONS, id);

      // Try to delete from server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.delete(`${this.baseEndpoint}/${id}`);
          return response.success;
        } catch (error) {
          console.error('Failed to delete from server, will retry later:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to delete medication:', error);
      throw error;
    }
  }

  /**
   * Record a medication dose
   */
  async recordDose(dose: Omit<MedicationDose, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationDose> {
    try {
      const newDose: MedicationDose = {
        ...dose,
        id: this.generateDoseId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save locally first
      const doseKey = `dose_${newDose.id}`;
      await offlineStorage.put(StoreName.CACHED_DATA, doseKey, newDose, {
        encrypt: true,
      });

      // Try to sync with server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.post<MedicationDose>(this.dosesEndpoint, newDose);
          
          if (response.success && response.data) {
            await offlineStorage.put(StoreName.CACHED_DATA, doseKey, response.data, {
              encrypt: true,
            });
            return response.data;
          }
        } catch (error) {
          console.error('Failed to sync dose record, will retry later:', error);
        }
      }

      return newDose;
    } catch (error) {
      console.error('Failed to record dose:', error);
      throw error;
    }
  }

  /**
   * Get dose history for a medication
   */
  async getDoseHistory(
    medicationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<MedicationDose[]> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.get<MedicationDose[]>(`${this.dosesEndpoint}`, {
          params: { medicationId, startDate, endDate },
        });

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Get from local storage
      const allRecords = await offlineStorage.getAll<MedicationDose>(StoreName.CACHED_DATA);
      let doses = allRecords
        .filter(record => record.id.startsWith('dose_'))
        .map(record => record.data)
        .filter(dose => dose.medicationId === medicationId);

      if (startDate) {
        doses = doses.filter(d => d.scheduledTime >= startDate);
      }

      if (endDate) {
        doses = doses.filter(d => d.scheduledTime <= endDate);
      }

      return doses.sort((a, b) => 
        new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
      );
    } catch (error) {
      console.error('Failed to get dose history:', error);
      throw error;
    }
  }

  /**
   * Mark dose as taken
   */
  async markDoseTaken(
    medicationId: string,
    scheduledTime: string,
    notes?: string
  ): Promise<MedicationDose> {
    return this.recordDose({
      medicationId,
      userId: '', // Will be filled by server
      scheduledTime,
      takenTime: new Date().toISOString(),
      status: 'taken',
      notes,
    });
  }

  /**
   * Mark dose as missed
   */
  async markDoseMissed(
    medicationId: string,
    scheduledTime: string,
    reason?: string
  ): Promise<MedicationDose> {
    return this.recordDose({
      medicationId,
      userId: '', // Will be filled by server
      scheduledTime,
      status: 'missed',
      notes: reason,
    });
  }

  /**
   * Mark dose as skipped
   */
  async markDoseSkipped(
    medicationId: string,
    scheduledTime: string,
    reason?: string
  ): Promise<MedicationDose> {
    return this.recordDose({
      medicationId,
      userId: '', // Will be filled by server
      scheduledTime,
      status: 'skipped',
      notes: reason,
    });
  }

  /**
   * Get today's medication schedule
   */
  async getTodaySchedule(userId: string): Promise<Array<{
    medication: Medication;
    doses: MedicationDose[];
  }>> {
    try {
      const medications = await this.getMedications({ isActive: true });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const schedule = await Promise.all(
        medications.map(async (medication) => {
          const doses = await this.getDoseHistory(
            medication.id,
            today.toISOString(),
            tomorrow.toISOString()
          );

          // Generate scheduled doses if none exist
          if (doses.length === 0 && medication.frequency.specificTimes) {
            const scheduledDoses = medication.frequency.specificTimes.map(time => {
              const [hours, minutes] = time.split(':').map(Number);
              const doseTime = new Date(today);
              doseTime.setHours(hours, minutes, 0, 0);

              return {
                id: this.generateDoseId(),
                medicationId: medication.id,
                userId,
                scheduledTime: doseTime.toISOString(),
                status: 'pending' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            });

            return {
              medication,
              doses: scheduledDoses,
            };
          }

          return {
            medication,
            doses,
          };
        })
      );

      return schedule.filter(item => item.doses.length > 0);
    } catch (error) {
      console.error('Failed to get today\'s schedule:', error);
      throw error;
    }
  }

  /**
   * Get medication statistics
   */
  async getMedicationStatistics(userId: string): Promise<MedicationStatistics> {
    try {
      // Try to get from server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.get<MedicationStatistics>(`${this.baseEndpoint}/statistics`, {
            params: { userId },
          });

          if (response.success && response.data) {
            return response.data;
          }
        } catch (error) {
          console.error('Failed to fetch statistics from server:', error);
        }
      }

      // Calculate statistics locally
      return await this.calculateLocalStatistics(userId);
    } catch (error) {
      console.error('Failed to get medication statistics:', error);
      throw error;
    }
  }

  /**
   * Get medication reminders
   */
  async getReminders(medicationId: string): Promise<MedicationReminder[]> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.get<MedicationReminder[]>(
          `${this.baseEndpoint}/${medicationId}/reminders`
        );

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Return default reminders
      return this.getDefaultReminders(medicationId);
    } catch (error) {
      console.error('Failed to get reminders:', error);
      return this.getDefaultReminders(medicationId);
    }
  }

  /**
   * Update medication reminder
   */
  async updateReminder(
    medicationId: string,
    reminderId: string,
    updates: Partial<MedicationReminder>
  ): Promise<MedicationReminder> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.put<MedicationReminder>(
          `${this.baseEndpoint}/${medicationId}/reminders/${reminderId}`,
          updates
        );

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Handle offline update
      const reminder: MedicationReminder = {
        id: reminderId,
        medicationId,
        time: updates.time || '09:00',
        days: updates.days || [0, 1, 2, 3, 4, 5, 6],
        enabled: updates.enabled ?? true,
        soundEnabled: updates.soundEnabled ?? true,
        vibrationEnabled: updates.vibrationEnabled ?? true,
        message: updates.message,
        snoozeMinutes: updates.snoozeMinutes,
        maxSnoozes: updates.maxSnoozes,
      };

      const reminderKey = `reminder_${reminderId}`;
      await offlineStorage.put(StoreName.CACHED_DATA, reminderKey, reminder, {
        encrypt: false,
      });

      return reminder;
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }

  /**
   * Check for drug interactions
   */
  async checkInteractions(medicationIds: string[]): Promise<Array<{
    medication1: string;
    medication2: string;
    severity: 'minor' | 'moderate' | 'major';
    description: string;
  }>> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.post(`${this.baseEndpoint}/interactions`, {
          medicationIds,
        });

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Return empty array if offline (requires API for accurate data)
      return [];
    } catch (error) {
      console.error('Failed to check interactions:', error);
      return [];
    }
  }

  /**
   * Get refill alerts
   */
  async getRefillAlerts(userId: string): Promise<Array<{
    medication: Medication;
    daysRemaining: number;
    message: string;
  }>> {
    try {
      const medications = await this.getMedications({ isActive: true });
      const alerts: Array<{
        medication: Medication;
        daysRemaining: number;
        message: string;
      }> = [];

      for (const medication of medications) {
        if (medication.nextRefillDate) {
          const refillDate = new Date(medication.nextRefillDate);
          const today = new Date();
          const daysRemaining = Math.floor(
            (refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysRemaining <= 7) {
            alerts.push({
              medication,
              daysRemaining,
              message: daysRemaining <= 0
                ? `${medication.name} refill is overdue`
                : `${medication.name} needs refill in ${daysRemaining} days`,
            });
          }
        }

        if (medication.stockLevel && medication.lowStockThreshold) {
          if (medication.stockLevel <= medication.lowStockThreshold) {
            alerts.push({
              medication,
              daysRemaining: Math.floor(
                medication.stockLevel / (medication.frequency.times || 1)
              ),
              message: `${medication.name} stock is low (${medication.stockLevel} remaining)`,
            });
          }
        }
      }

      return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    } catch (error) {
      console.error('Failed to get refill alerts:', error);
      return [];
    }
  }

  /**
   * Export medication list
   */
  async exportMedications(userId: string, format: 'pdf' | 'csv' | 'json'): Promise<Blob> {
    try {
      const medications = await this.getMedications();
      
      switch (format) {
        case 'json':
          const json = JSON.stringify(medications, null, 2);
          return new Blob([json], { type: 'application/json' });
          
        case 'csv':
          const csv = this.convertToCSV(medications);
          return new Blob([csv], { type: 'text/csv' });
          
        case 'pdf':
          if (navigator.onLine) {
            const response = await apiClient.post(`${this.baseEndpoint}/export/pdf`, {
              medications,
            }, {
              responseType: 'blob',
            });
            
            if (response.success && response.data) {
              return response.data;
            }
          }
          // Fallback to CSV if PDF generation fails
          const fallbackCSV = this.convertToCSV(medications);
          return new Blob([fallbackCSV], { type: 'text/csv' });
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Failed to export medications:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private generateId(): string {
    return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDoseId(): string {
    return `dose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private applyLocalFilter(medications: Medication[], filter: MedicationFilter): Medication[] {
    let filtered = [...medications];

    if (filter.isActive !== undefined) {
      filtered = filtered.filter(m => m.isActive === filter.isActive);
    }

    if (filter.isPRN !== undefined) {
      filtered = filtered.filter(m => m.isPRN === filter.isPRN);
    }

    if (filter.route) {
      filtered = filtered.filter(m => m.route === filter.route);
    }

    if (filter.prescribedBy) {
      filtered = filtered.filter(m => m.prescribedBy === filter.prescribedBy);
    }

    if (filter.hasRefills) {
      filtered = filtered.filter(m => (m.refillsRemaining || 0) > 0);
    }

    if (filter.lowStock) {
      filtered = filtered.filter(m => 
        m.stockLevel && m.lowStockThreshold && m.stockLevel <= m.lowStockThreshold
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  private async calculateLocalStatistics(userId: string): Promise<MedicationStatistics> {
    const medications = await this.getMedications();
    const activeMedications = medications.filter(m => m.isActive);
    
    // Get dose history for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let totalDoses = 0;
    let takenDoses = 0;
    let missedDoses = 0;
    const medicationStats: Map<string, { taken: number; missed: number }> = new Map();
    const sideEffectsCount: Map<string, number> = new Map();
    const adherenceByTime: Map<string, { taken: number; total: number }> = new Map();
    
    for (const medication of activeMedications) {
      const doses = await this.getDoseHistory(
        medication.id,
        thirtyDaysAgo.toISOString()
      );
      
      totalDoses += doses.length;
      const taken = doses.filter(d => d.status === 'taken').length;
      const missed = doses.filter(d => d.status === 'missed').length;
      
      takenDoses += taken;
      missedDoses += missed;
      
      medicationStats.set(medication.id, { taken, missed });
      
      // Count side effects
      doses.forEach(dose => {
        dose.sideEffects?.forEach(effect => {
          sideEffectsCount.set(effect, (sideEffectsCount.get(effect) || 0) + 1);
        });
        
        // Track adherence by time
        const hour = new Date(dose.scheduledTime).getHours();
        const timeKey = `${hour}:00`;
        const timeStats = adherenceByTime.get(timeKey) || { taken: 0, total: 0 };
        timeStats.total++;
        if (dose.status === 'taken') timeStats.taken++;
        adherenceByTime.set(timeKey, timeStats);
      });
    }
    
    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) : 0;
    
    // Calculate adherence trend
    const adherenceTrend: Array<{ date: string; rate: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let dayTotal = 0;
      let dayTaken = 0;
      
      for (const medication of activeMedications) {
        const doses = await this.getDoseHistory(
          medication.id,
          dateStr,
          dateStr + 'T23:59:59'
        );
        dayTotal += doses.length;
        dayTaken += doses.filter(d => d.status === 'taken').length;
      }
      
      adherenceTrend.push({
        date: dateStr,
        rate: dayTotal > 0 ? (dayTaken / dayTotal) : 0,
      });
    }
    
    // Get today's doses
    const today = new Date().toISOString().split('T')[0];
    let dosesToday = 0;
    let dosesTakenToday = 0;
    
    for (const medication of activeMedications) {
      const doses = await this.getDoseHistory(
        medication.id,
        today,
        today + 'T23:59:59'
      );
      dosesToday += doses.length;
      dosesTakenToday += doses.filter(d => d.status === 'taken').length;
    }
    
    // Calculate medication breakdown
    const medicationBreakdown = Array.from(medicationStats.entries()).map(([id, stats]) => {
      const medication = medications.find(m => m.id === id)!;
      const total = stats.taken + stats.missed;
      return {
        medicationId: id,
        name: medication.name,
        adherenceRate: total > 0 ? (stats.taken / total) : 0,
        missedCount: stats.missed,
      };
    });
    
    // Calculate best and worst adherence times
    let bestTime = '';
    let bestRate = 0;
    let worstTime = '';
    let worstRate = 1;
    
    adherenceByTime.forEach((stats, time) => {
      const rate = stats.total > 0 ? (stats.taken / stats.total) : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestTime = time;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstTime = time;
      }
    });
    
    // Count upcoming refills
    const upcomingRefills = medications.filter(m => {
      if (!m.nextRefillDate) return false;
      const refillDate = new Date(m.nextRefillDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return refillDate <= thirtyDaysFromNow;
    }).length;
    
    return {
      adherenceRate: Math.round(adherenceRate * 100) / 100,
      totalMedications: medications.length,
      activeMedications: activeMedications.length,
      dosesToday,
      dosesTaken: dosesTakenToday,
      missedDoses,
      upcomingRefills,
      adherenceTrend,
      medicationBreakdown,
      sideEffectsReported: Array.from(sideEffectsCount.entries())
        .map(([effect, count]) => ({ effect, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      bestAdherenceTime: bestTime,
      worstAdherenceTime: worstTime,
    };
  }

  private async createDefaultReminders(medication: Medication): Promise<void> {
    if (!medication.frequency.specificTimes || medication.frequency.specificTimes.length === 0) {
      return;
    }

    const reminders = medication.frequency.specificTimes.map((time, index) => ({
      id: `${medication.id}_reminder_${index}`,
      medicationId: medication.id,
      time,
      days: [0, 1, 2, 3, 4, 5, 6], // All days by default
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      message: `Time to take ${medication.name}`,
      snoozeMinutes: 10,
      maxSnoozes: 3,
    }));

    // Store reminders locally
    for (const reminder of reminders) {
      const reminderKey = `reminder_${reminder.id}`;
      await offlineStorage.put(StoreName.CACHED_DATA, reminderKey, reminder, {
        encrypt: false,
      });
    }
  }

  private getDefaultReminders(medicationId: string): MedicationReminder[] {
    // Return empty array as default (would be populated from stored reminders)
    return [];
  }

  private convertToCSV(medications: Medication[]): string {
    const headers = [
      'Name', 'Generic Name', 'Dosage', 'Frequency', 'Route',
      'Purpose', 'Prescribed By', 'Start Date', 'End Date',
      'Refills Remaining', 'Instructions'
    ];

    const rows = medications.map(med => [
      med.name,
      med.genericName || '',
      `${med.dosage} ${med.unit}`,
      `${med.frequency.times} times per ${med.frequency.period}`,
      med.route,
      med.purpose || '',
      med.prescribedBy || '',
      med.startDate,
      med.endDate || '',
      med.refillsRemaining?.toString() || '',
      med.instructions || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }
}

// Export singleton instance
export const medicationService = new MedicationService();

// Export types
export type { 
  Medication, 
  MedicationDose, 
  MedicationReminder, 
  MedicationStatistics, 
  MedicationFilter 
};