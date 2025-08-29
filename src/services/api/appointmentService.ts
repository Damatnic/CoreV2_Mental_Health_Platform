/**
 * Appointment Scheduling API Service
 * Handles all appointment-related API operations with offline support
 */

import { apiClient, ApiResponse } from './apiClient';
import { offlineStorage, StoreName, DataRecord } from '../../utils/offlineStorage';
import { dataSync } from '../sync/dataSync';

// Appointment interface
export interface Appointment {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  providerType: 'therapist' | 'psychiatrist' | 'counselor' | 'psychologist' | 'social_worker' | 'other';
  appointmentType: 'initial' | 'followup' | 'emergency' | 'group' | 'teletherapy';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  location?: {
    type: 'in_person' | 'video' | 'phone';
    address?: string;
    room?: string;
    videoLink?: string;
    phoneNumber?: string;
  };
  reason?: string;
  notes?: string;
  symptoms?: string[];
  goals?: string[];
  reminders: Array<{
    type: 'email' | 'sms' | 'push' | 'in_app';
    timeBefore: number; // minutes before appointment
    sent: boolean;
    sentAt?: string;
  }>;
  recurrence?: {
    type: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    endDate?: string;
    occurrences?: number;
    exceptions?: string[]; // dates to skip
  };
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
  payment?: {
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    method?: 'insurance' | 'credit_card' | 'cash' | 'other';
    insuranceClaimId?: string;
  };
  rating?: {
    score: number; // 1-5
    feedback?: string;
    helpful: boolean;
  };
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelReason?: string;
}

// Provider interface
export interface Provider {
  id: string;
  name: string;
  type: Appointment['providerType'];
  specializations: string[];
  languages: string[];
  availability: Array<{
    dayOfWeek: number; // 0-6
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }>;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  insurance: string[];
  rating: number;
  reviewCount: number;
  bio?: string;
  photo?: string;
  credentials: string[];
  yearsOfExperience: number;
  acceptingNewPatients: boolean;
}

// Appointment statistics
export interface AppointmentStatistics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowCount: number;
  averageDuration: number;
  attendanceRate: number;
  upcomingCount: number;
  providerBreakdown: Array<{
    providerId: string;
    providerName: string;
    count: number;
  }>;
  typeBreakdown: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>;
}

// Filter options for appointments
export interface AppointmentFilter {
  startDate?: string;
  endDate?: string;
  providerId?: string;
  status?: Appointment['status'] | Appointment['status'][];
  appointmentType?: Appointment['appointmentType'];
  upcoming?: boolean;
  past?: boolean;
  limit?: number;
  offset?: number;
}

// Time slot interface
export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  providerId: string;
}

/**
 * Appointment Service Class
 */
class AppointmentService {
  private readonly baseEndpoint = '/appointments';
  private readonly providersEndpoint = '/providers';

  /**
   * Create a new appointment
   */
  async createAppointment(
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    try {
      // Generate ID and timestamps
      const newAppointment: Appointment = {
        ...appointment,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validate appointment time
      if (!this.isValidAppointmentTime(newAppointment)) {
        throw new Error('Invalid appointment time');
      }

      // Save to offline storage first
      await offlineStorage.put(StoreName.APPOINTMENTS, newAppointment.id, newAppointment, {
        encrypt: true,
      });

      // Try to sync with server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.post<Appointment>(this.baseEndpoint, newAppointment);
          
          if (response.success && response.data) {
            // Update local storage with server response
            await offlineStorage.put(StoreName.APPOINTMENTS, response.data.id, response.data, {
              encrypt: true,
            });
            
            // Mark as synced
            await offlineStorage.updateSyncStatus(StoreName.APPOINTMENTS, response.data.id, 'synced');
            
            // Schedule reminders
            await this.scheduleReminders(response.data);
            
            return response.data;
          }
        } catch (error) {
          console.error('Failed to sync appointment, will retry later:', error);
        }
      }

      // Schedule local reminders
      await this.scheduleReminders(newAppointment);

      return newAppointment;
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw error;
    }
  }

  /**
   * Get all appointments with optional filtering
   */
  async getAppointments(filter?: AppointmentFilter): Promise<Appointment[]> {
    try {
      // Try to fetch from server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.get<Appointment[]>(this.baseEndpoint, {
            params: filter,
          });

          if (response.success && response.data) {
            // Update local storage with server data
            for (const appointment of response.data) {
              await offlineStorage.put(StoreName.APPOINTMENTS, appointment.id, appointment, {
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
      const localRecords = await offlineStorage.getAll<Appointment>(StoreName.APPOINTMENTS);
      let appointments = localRecords.map(record => record.data);

      // Apply local filtering
      if (filter) {
        appointments = this.applyLocalFilter(appointments, filter);
      }

      return appointments;
    } catch (error) {
      console.error('Failed to get appointments:', error);
      throw error;
    }
  }

  /**
   * Get a single appointment by ID
   */
  async getAppointment(id: string): Promise<Appointment | null> {
    try {
      // Check local storage first
      const localRecord = await offlineStorage.get<Appointment>(StoreName.APPOINTMENTS, id);
      
      if (localRecord) {
        // Try to get updated version from server if online
        if (navigator.onLine) {
          try {
            const response = await apiClient.get<Appointment>(`${this.baseEndpoint}/${id}`);
            
            if (response.success && response.data) {
              // Update local storage if server has newer version
              if (new Date(response.data.updatedAt) > new Date(localRecord.data.updatedAt)) {
                await offlineStorage.put(StoreName.APPOINTMENTS, id, response.data, {
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
        const response = await apiClient.get<Appointment>(`${this.baseEndpoint}/${id}`);
        
        if (response.success && response.data) {
          // Store locally for offline access
          await offlineStorage.put(StoreName.APPOINTMENTS, id, response.data, {
            encrypt: true,
          });
          return response.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get appointment:', error);
      throw error;
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    try {
      // Get existing appointment
      const existing = await this.getAppointment(id);
      
      if (!existing) {
        throw new Error('Appointment not found');
      }

      // Merge updates
      const updated: Appointment = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      // Validate if time was changed
      if (updates.startTime || updates.endTime) {
        if (!this.isValidAppointmentTime(updated)) {
          throw new Error('Invalid appointment time');
        }
      }

      // Save to offline storage
      await offlineStorage.put(StoreName.APPOINTMENTS, id, updated, {
        encrypt: true,
      });

      // Try to sync with server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.put<Appointment>(`${this.baseEndpoint}/${id}`, updated);
          
          if (response.success && response.data) {
            // Update local storage with server response
            await offlineStorage.put(StoreName.APPOINTMENTS, id, response.data, {
              encrypt: true,
            });
            
            // Mark as synced
            await offlineStorage.updateSyncStatus(StoreName.APPOINTMENTS, id, 'synced');
            
            // Reschedule reminders if time changed
            if (updates.startTime || updates.reminders) {
              await this.scheduleReminders(response.data);
            }
            
            return response.data;
          }
        } catch (error) {
          console.error('Failed to sync appointment update, will retry later:', error);
        }
      }

      // Reschedule local reminders if needed
      if (updates.startTime || updates.reminders) {
        await this.scheduleReminders(updated);
      }

      return updated;
    } catch (error) {
      console.error('Failed to update appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    return this.updateAppointment(id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
    });
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    id: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<Appointment> {
    return this.updateAppointment(id, {
      status: 'rescheduled',
      startTime: newStartTime,
      endTime: newEndTime,
    });
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(
    id: string,
    notes?: string,
    rating?: Appointment['rating']
  ): Promise<Appointment> {
    return this.updateAppointment(id, {
      status: 'completed',
      notes,
      rating,
    });
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(id: string): Promise<boolean> {
    try {
      // Delete from local storage
      await offlineStorage.delete(StoreName.APPOINTMENTS, id);

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
      console.error('Failed to delete appointment:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(userId: string, days: number = 7): Promise<Appointment[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.getAppointments({
      startDate: now.toISOString(),
      endDate: futureDate.toISOString(),
      status: ['scheduled', 'confirmed'],
    });
  }

  /**
   * Get past appointments
   */
  async getPastAppointments(userId: string, days: number = 30): Promise<Appointment[]> {
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - days);

    return this.getAppointments({
      startDate: pastDate.toISOString(),
      endDate: now.toISOString(),
      status: ['completed', 'cancelled', 'no_show'],
    });
  }

  /**
   * Get available time slots for a provider
   */
  async getAvailableSlots(
    providerId: string,
    date: string,
    duration: number = 60
  ): Promise<TimeSlot[]> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.get<TimeSlot[]>(`${this.providersEndpoint}/${providerId}/slots`, {
          params: { date, duration },
        });

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Generate local slots based on provider availability
      return this.generateLocalSlots(providerId, date, duration);
    } catch (error) {
      console.error('Failed to get available slots:', error);
      return this.generateLocalSlots(providerId, date, duration);
    }
  }

  /**
   * Get providers
   */
  async getProviders(filter?: {
    type?: Provider['type'];
    specialization?: string;
    insurance?: string;
    acceptingNewPatients?: boolean;
  }): Promise<Provider[]> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.get<Provider[]>(this.providersEndpoint, {
          params: filter,
        });

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Return mock providers for offline mode
      return this.getMockProviders(filter);
    } catch (error) {
      console.error('Failed to get providers:', error);
      return this.getMockProviders(filter);
    }
  }

  /**
   * Get provider by ID
   */
  async getProvider(id: string): Promise<Provider | null> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.get<Provider>(`${this.providersEndpoint}/${id}`);

        if (response.success && response.data) {
          return response.data;
        }
      }

      // Return mock provider for offline mode
      const providers = await this.getMockProviders();
      return providers.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Failed to get provider:', error);
      return null;
    }
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStatistics(userId: string): Promise<AppointmentStatistics> {
    try {
      // Try to get from server if online
      if (navigator.onLine) {
        try {
          const response = await apiClient.get<AppointmentStatistics>(`${this.baseEndpoint}/statistics`, {
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
      console.error('Failed to get appointment statistics:', error);
      throw error;
    }
  }

  /**
   * Create recurring appointments
   */
  async createRecurringAppointments(
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
    recurrence: NonNullable<Appointment['recurrence']>
  ): Promise<Appointment[]> {
    const appointments: Appointment[] = [];
    const startDate = new Date(appointment.startTime);
    const endDate = recurrence.endDate ? new Date(recurrence.endDate) : null;
    const maxOccurrences = recurrence.occurrences || 52; // Default to 1 year
    let currentDate = new Date(startDate);
    let occurrenceCount = 0;

    while (
      occurrenceCount < maxOccurrences &&
      (!endDate || currentDate <= endDate)
    ) {
      // Skip exceptions
      const dateStr = currentDate.toISOString().split('T')[0];
      if (recurrence.exceptions?.includes(dateStr)) {
        currentDate = this.getNextRecurrenceDate(currentDate, recurrence.type);
        continue;
      }

      // Create appointment for this occurrence
      const duration = new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime();
      const appointmentStartTime = new Date(currentDate);
      const appointmentEndTime = new Date(currentDate.getTime() + duration);

      const recurringAppointment = await this.createAppointment({
        ...appointment,
        startTime: appointmentStartTime.toISOString(),
        endTime: appointmentEndTime.toISOString(),
        recurrence,
      });

      appointments.push(recurringAppointment);
      occurrenceCount++;

      // Move to next occurrence
      currentDate = this.getNextRecurrenceDate(currentDate, recurrence.type);
    }

    return appointments;
  }

  /**
   * Send appointment reminder
   */
  async sendReminder(appointmentId: string, reminderType: 'email' | 'sms' | 'push'): Promise<boolean> {
    try {
      if (navigator.onLine) {
        const response = await apiClient.post(`${this.baseEndpoint}/${appointmentId}/remind`, {
          type: reminderType,
        });

        return response.success;
      }

      // Queue for later if offline
      console.log(`Reminder queued for appointment ${appointmentId}`);
      return false;
    } catch (error) {
      console.error('Failed to send reminder:', error);
      return false;
    }
  }

  /**
   * Export appointments to calendar
   */
  async exportToCalendar(appointmentIds: string[], format: 'ics' | 'google' | 'outlook'): Promise<Blob | string> {
    try {
      const appointments = await Promise.all(
        appointmentIds.map(id => this.getAppointment(id))
      );

      const validAppointments = appointments.filter(a => a !== null) as Appointment[];

      if (format === 'ics') {
        const icsContent = this.generateICSContent(validAppointments);
        return new Blob([icsContent], { type: 'text/calendar' });
      } else if (format === 'google') {
        return this.generateGoogleCalendarUrl(validAppointments[0]);
      } else if (format === 'outlook') {
        return this.generateOutlookCalendarUrl(validAppointments[0]);
      }

      throw new Error(`Unsupported calendar format: ${format}`);
    } catch (error) {
      console.error('Failed to export to calendar:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private generateId(): string {
    return `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidAppointmentTime(appointment: Appointment): boolean {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const now = new Date();

    // Check if times are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // Check if end is after start
    if (end <= start) {
      return false;
    }

    // Check if appointment is not too far in the past (allow 1 hour for late logging)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (start < oneHourAgo && appointment.status === 'scheduled') {
      return false;
    }

    // Check if appointment is not too far in the future (1 year)
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (start > oneYearFromNow) {
      return false;
    }

    return true;
  }

  private async scheduleReminders(appointment: Appointment): Promise<void> {
    if (!appointment.reminders || appointment.reminders.length === 0) {
      return;
    }

    for (const reminder of appointment.reminders) {
      if (!reminder.sent) {
        const appointmentTime = new Date(appointment.startTime);
        const reminderTime = new Date(appointmentTime.getTime() - reminder.timeBefore * 60 * 1000);

        if (reminderTime > new Date()) {
          // Schedule reminder (this would integrate with a notification service)
          console.log(`Reminder scheduled for ${reminderTime.toISOString()}`);
        }
      }
    }
  }

  private applyLocalFilter(appointments: Appointment[], filter: AppointmentFilter): Appointment[] {
    let filtered = [...appointments];

    if (filter.startDate) {
      filtered = filtered.filter(a => a.startTime >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter(a => a.startTime <= filter.endDate!);
    }

    if (filter.providerId) {
      filtered = filtered.filter(a => a.providerId === filter.providerId);
    }

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      filtered = filtered.filter(a => statuses.includes(a.status));
    }

    if (filter.appointmentType) {
      filtered = filtered.filter(a => a.appointmentType === filter.appointmentType);
    }

    if (filter.upcoming) {
      const now = new Date();
      filtered = filtered.filter(a => new Date(a.startTime) > now);
    }

    if (filter.past) {
      const now = new Date();
      filtered = filtered.filter(a => new Date(a.startTime) <= now);
    }

    // Sort by start time
    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Apply pagination
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  private async calculateLocalStatistics(userId: string): Promise<AppointmentStatistics> {
    const appointments = await this.getAppointments();
    
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const noShowCount = appointments.filter(a => a.status === 'no_show').length;
    
    const durations = appointments
      .filter(a => a.status === 'completed')
      .map(a => a.duration);
    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;
    
    const attendanceRate = totalAppointments > 0
      ? completedAppointments / (totalAppointments - cancelledAppointments)
      : 0;
    
    const now = new Date();
    const upcomingCount = appointments.filter(a => 
      new Date(a.startTime) > now && ['scheduled', 'confirmed'].includes(a.status)
    ).length;
    
    // Provider breakdown
    const providerCounts = new Map<string, { name: string; count: number }>();
    appointments.forEach(a => {
      const current = providerCounts.get(a.providerId) || { name: a.providerName, count: 0 };
      providerCounts.set(a.providerId, {
        name: a.providerName,
        count: current.count + 1,
      });
    });
    
    const providerBreakdown = Array.from(providerCounts.entries())
      .map(([providerId, data]) => ({
        providerId,
        providerName: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
    
    // Type breakdown
    const typeBreakdown: Record<string, number> = {};
    appointments.forEach(a => {
      typeBreakdown[a.appointmentType] = (typeBreakdown[a.appointmentType] || 0) + 1;
    });
    
    // Monthly trend (last 6 months)
    const monthlyTrend = this.calculateMonthlyTrend(appointments);
    
    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowCount,
      averageDuration: Math.round(averageDuration),
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      upcomingCount,
      providerBreakdown,
      typeBreakdown,
      monthlyTrend,
    };
  }

  private calculateMonthlyTrend(appointments: Appointment[]): AppointmentStatistics['monthlyTrend'] {
    const trend: AppointmentStatistics['monthlyTrend'] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthAppointments = appointments.filter(a => {
        const date = new Date(a.startTime);
        return date >= monthDate && date < nextMonth;
      });
      
      trend.push({
        month: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        scheduled: monthAppointments.length,
        completed: monthAppointments.filter(a => a.status === 'completed').length,
        cancelled: monthAppointments.filter(a => a.status === 'cancelled').length,
      });
    }
    
    return trend;
  }

  private generateLocalSlots(providerId: string, date: string, duration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = duration;
    
    const slotDate = new Date(date);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const startTime = new Date(slotDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + slotDuration);
        
        if (endTime.getHours() <= endHour || (endTime.getHours() === endHour && endTime.getMinutes() === 0)) {
          slots.push({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            available: Math.random() > 0.3, // Random availability for demo
            providerId,
          });
        }
      }
    }
    
    return slots;
  }

  private getNextRecurrenceDate(currentDate: Date, recurrenceType: string): Date {
    const nextDate = new Date(currentDate);
    
    switch (recurrenceType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    
    return nextDate;
  }

  private generateICSContent(appointments: Appointment[]): string {
    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mental Health App//EN',
      'CALSCALE:GREGORIAN',
    ];
    
    appointments.forEach(appointment => {
      const uid = `${appointment.id}@mentalhealthapp.com`;
      const start = new Date(appointment.startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const end = new Date(appointment.endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      
      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:Appointment with ${appointment.providerName}`,
        `DESCRIPTION:${appointment.reason || 'Mental health appointment'}`,
        appointment.location?.address ? `LOCATION:${appointment.location.address}` : '',
        'END:VEVENT'
      );
    });
    
    icsLines.push('END:VCALENDAR');
    
    return icsLines.filter(line => line).join('\r\n');
  }

  private generateGoogleCalendarUrl(appointment: Appointment): string {
    const start = new Date(appointment.startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(appointment.endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = encodeURIComponent(`Appointment with ${appointment.providerName}`);
    const details = encodeURIComponent(appointment.reason || 'Mental health appointment');
    const location = appointment.location?.address ? encodeURIComponent(appointment.location.address) : '';
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  }

  private generateOutlookCalendarUrl(appointment: Appointment): string {
    const start = new Date(appointment.startTime).toISOString();
    const end = new Date(appointment.endTime).toISOString();
    const title = encodeURIComponent(`Appointment with ${appointment.providerName}`);
    const details = encodeURIComponent(appointment.reason || 'Mental health appointment');
    const location = appointment.location?.address ? encodeURIComponent(appointment.location.address) : '';
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start}&enddt=${end}&body=${details}&location=${location}`;
  }

  private getMockProviders(filter?: any): Provider[] {
    const providers: Provider[] = [
      {
        id: 'provider1',
        name: 'Dr. Sarah Johnson',
        type: 'psychiatrist',
        specializations: ['Anxiety', 'Depression', 'ADHD'],
        languages: ['English', 'Spanish'],
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
        ],
        location: {
          address: '123 Main St, Suite 100',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
        contact: {
          phone: '555-0100',
          email: 'dr.johnson@example.com',
        },
        insurance: ['Blue Cross', 'Aetna', 'United Healthcare'],
        rating: 4.8,
        reviewCount: 124,
        bio: 'Board-certified psychiatrist with 15 years of experience',
        credentials: ['MD', 'Board Certified Psychiatrist'],
        yearsOfExperience: 15,
        acceptingNewPatients: true,
      },
      {
        id: 'provider2',
        name: 'Michael Chen, LCSW',
        type: 'therapist',
        specializations: ['CBT', 'Trauma', 'Relationships'],
        languages: ['English', 'Mandarin'],
        availability: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
          { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
          { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
          { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
        ],
        location: {
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
        },
        contact: {
          phone: '555-0200',
          email: 'm.chen@example.com',
        },
        insurance: ['Cigna', 'Anthem', 'Kaiser'],
        rating: 4.9,
        reviewCount: 89,
        bio: 'Specializing in cognitive behavioral therapy and trauma-informed care',
        credentials: ['LCSW', 'Trauma Specialist'],
        yearsOfExperience: 10,
        acceptingNewPatients: true,
      },
    ];
    
    if (filter) {
      let filtered = [...providers];
      
      if (filter.type) {
        filtered = filtered.filter(p => p.type === filter.type);
      }
      
      if (filter.specialization) {
        filtered = filtered.filter(p => 
          p.specializations.some(s => s.toLowerCase().includes(filter.specialization.toLowerCase()))
        );
      }
      
      if (filter.insurance) {
        filtered = filtered.filter(p => p.insurance.includes(filter.insurance));
      }
      
      if (filter.acceptingNewPatients !== undefined) {
        filtered = filtered.filter(p => p.acceptingNewPatients === filter.acceptingNewPatients);
      }
      
      return filtered;
    }
    
    return providers;
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();

// Export types
export type { Appointment, Provider, AppointmentStatistics, AppointmentFilter, TimeSlot };