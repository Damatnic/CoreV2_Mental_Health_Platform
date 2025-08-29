/**
 * AppointmentScheduler Component
 * Comprehensive appointment booking and management interface
 * Includes therapist selection, calendar view, and reminders
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUser, 
  FaStar, 
  FaCheck, 
  FaTimes,
  FaBell,
  FaVideo,
  FaPhone,
  FaEnvelope,
  FaFilter,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationCircle
} from 'react-icons/fa';
import { 
  teletherapyService, 
  TherapistProfile, 
  AvailabilitySlot, 
  Appointment 
} from '../../services/teletherapy/teletherapyService';
import '../../styles/appointment-scheduler.css';

interface AppointmentSchedulerProps {
  patientId: string;
  onAppointmentBooked?: (appointment: Appointment) => void;
  onClose?: () => void;
}

interface TimeSlot {
  time: Date;
  available: boolean;
  therapistId?: string;
}

interface ReminderSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  dayBefore: boolean;
  hourBefore: boolean;
  custom?: number; // minutes before
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  patientId,
  onAppointmentBooked,
  onClose
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState<'therapist' | 'time' | 'confirm' | 'success'>('therapist');
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  
  // Booking details state
  const [sessionType, setSessionType] = useState<'video' | 'phone'>('video');
  const [sessionDuration, setSessionDuration] = useState(50);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    email: true,
    sms: false,
    push: true,
    dayBefore: true,
    hourBefore: true
  });
  const [notes, setNotes] = useState('');
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  // Calendar view state
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Mock therapist data - in production, this would come from API
  const mockTherapists: TherapistProfile[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      title: 'Licensed Clinical Psychologist',
      specializations: ['Anxiety', 'Depression', 'Trauma'],
      avatar: '/avatars/therapist1.jpg',
      rating: 4.8,
      availability: [],
      licensure: {
        state: 'CA',
        number: 'PSY123456',
        expiryDate: new Date('2025-12-31')
      }
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      title: 'Psychiatrist',
      specializations: ['ADHD', 'Bipolar Disorder', 'Medication Management'],
      avatar: '/avatars/therapist2.jpg',
      rating: 4.9,
      availability: [],
      licensure: {
        state: 'NY',
        number: 'MD789012',
        expiryDate: new Date('2026-06-30')
      }
    },
    {
      id: '3',
      name: 'Lisa Rodriguez, LMFT',
      title: 'Marriage and Family Therapist',
      specializations: ['Couples Therapy', 'Family Dynamics', 'Grief'],
      avatar: '/avatars/therapist3.jpg',
      rating: 4.7,
      availability: [],
      licensure: {
        state: 'TX',
        number: 'LMFT345678',
        expiryDate: new Date('2025-09-30')
      }
    }
  ];

  /**
   * Load therapists on mount
   */
  useEffect(() => {
    loadTherapists();
    loadUserAppointments();
  }, []);

  /**
   * Load available time slots when therapist or date changes
   */
  useEffect(() => {
    if (selectedTherapist && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedTherapist, selectedDate]);

  /**
   * Load therapists from API
   */
  const loadTherapists = async () => {
    setLoading(true);
    try {
      // In production, this would be an API call
      // const response = await fetch('/api/therapists');
      // const data = await response.json();
      
      // Using mock data for demonstration
      setTherapists(mockTherapists);
    } catch (err) {
      setError('Failed to load therapists');
      console.error('Error loading therapists:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user's existing appointments
   */
  const loadUserAppointments = async () => {
    try {
      // In production, this would be an API call
      // const response = await fetch(`/api/appointments/user/${patientId}`);
      // const data = await response.json();
      
      // Mock data
      setAppointments([]);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  /**
   * Load available time slots for selected therapist and date
   */
  const loadAvailableSlots = async () => {
    if (!selectedTherapist) return;

    setLoading(true);
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const availability = await teletherapyService.getTherapistAvailability(
        selectedTherapist.id,
        startDate,
        endDate
      );

      // Generate time slots for the day (9 AM to 5 PM)
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour < 17; hour++) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, 0, 0, 0);
        
        const isAvailable = availability.some(slot => 
          new Date(slot.startTime) <= slotTime && 
          new Date(slot.endTime) > slotTime &&
          slot.isAvailable
        );

        slots.push({
          time: slotTime,
          available: isAvailable,
          therapistId: selectedTherapist.id
        });

        // Add 30-minute slot
        const halfHourSlot = new Date(selectedDate);
        halfHourSlot.setHours(hour, 30, 0, 0);
        
        const isHalfHourAvailable = availability.some(slot => 
          new Date(slot.startTime) <= halfHourSlot && 
          new Date(slot.endTime) > halfHourSlot &&
          slot.isAvailable
        );

        slots.push({
          time: halfHourSlot,
          available: isHalfHourAvailable,
          therapistId: selectedTherapist.id
        });
      }

      setAvailableSlots(slots);
    } catch (err) {
      setError('Failed to load available time slots');
      console.error('Error loading availability:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter therapists based on search and filters
   */
  const getFilteredTherapists = useCallback(() => {
    return therapists.filter(therapist => {
      // Search filter
      if (searchTerm && !therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !therapist.specializations.some(spec => 
            spec.toLowerCase().includes(searchTerm.toLowerCase())
          )) {
        return false;
      }

      // Specialization filter
      if (filterSpecialization !== 'all' && 
          !therapist.specializations.includes(filterSpecialization)) {
        return false;
      }

      // Availability filter
      if (showOnlyAvailable) {
        // In production, check actual availability
        return true;
      }

      return true;
    });
  }, [therapists, searchTerm, filterSpecialization, showOnlyAvailable]);

  /**
   * Handle therapist selection
   */
  const selectTherapist = (therapist: TherapistProfile) => {
    setSelectedTherapist(therapist);
    setCurrentStep('time');
  };

  /**
   * Handle time slot selection
   */
  const selectTimeSlot = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedTime(slot.time);
      setCurrentStep('confirm');
    }
  };

  /**
   * Book the appointment
   */
  const bookAppointment = async () => {
    if (!selectedTherapist || !selectedTime) return;

    setLoading(true);
    setError(null);

    try {
      const appointment = await teletherapyService.scheduleAppointment(
        selectedTherapist.id,
        patientId,
        selectedTime,
        sessionDuration
      );

      // Set up reminders based on settings
      if (reminderSettings.email || reminderSettings.sms || reminderSettings.push) {
        await setupReminders(appointment.id);
      }

      setBookedAppointment(appointment);
      setCurrentStep('success');

      if (onAppointmentBooked) {
        onAppointmentBooked(appointment);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
      console.error('Error booking appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set up appointment reminders
   */
  const setupReminders = async (appointmentId: string) => {
    try {
      const reminderRequests = [];

      if (reminderSettings.dayBefore) {
        reminderRequests.push({
          type: reminderSettings.email ? 'email' : reminderSettings.sms ? 'sms' : 'push',
          timing: 24 * 60 // 24 hours in minutes
        });
      }

      if (reminderSettings.hourBefore) {
        reminderRequests.push({
          type: reminderSettings.push ? 'push' : reminderSettings.email ? 'email' : 'sms',
          timing: 60 // 1 hour in minutes
        });
      }

      if (reminderSettings.custom) {
        reminderRequests.push({
          type: reminderSettings.email ? 'email' : 'push',
          timing: reminderSettings.custom
        });
      }

      // In production, send reminder setup to backend
      console.log('Setting up reminders:', reminderRequests);
    } catch (err) {
      console.error('Error setting up reminders:', err);
    }
  };

  /**
   * Cancel or reschedule appointment
   */
  const modifyAppointment = async (
    appointmentId: string, 
    action: 'cancel' | 'reschedule'
  ) => {
    try {
      const updatedAppointment = await teletherapyService.modifyAppointment(
        appointmentId,
        action,
        action === 'reschedule' ? selectedTime || undefined : undefined
      );

      // Update local state
      setAppointments(prev => 
        prev.map(apt => apt.id === appointmentId ? updatedAppointment : apt)
      );

      alert(`Appointment ${action === 'cancel' ? 'cancelled' : 'rescheduled'} successfully`);
    } catch (err) {
      console.error(`Error ${action} appointment:`, err);
      alert(`Failed to ${action} appointment`);
    }
  };

  /**
   * Format time for display
   */
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  /**
   * Navigate calendar
   */
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentWeek(newDate);
  };

  /**
   * Get unique specializations for filter
   */
  const getSpecializations = (): string[] => {
    const specs = new Set<string>();
    therapists.forEach(t => t.specializations.forEach(s => specs.add(s)));
    return Array.from(specs);
  };

  return (
    <div className="appointment-scheduler">
      {/* Header */}
      <div className="scheduler-header">
        <h2>Schedule Appointment</h2>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="progress-indicator">
        <div className={`progress-step ${currentStep === 'therapist' ? 'active' : ''} ${['time', 'confirm', 'success'].includes(currentStep) ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Select Therapist</div>
        </div>
        <div className={`progress-step ${currentStep === 'time' ? 'active' : ''} ${['confirm', 'success'].includes(currentStep) ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Choose Time</div>
        </div>
        <div className={`progress-step ${currentStep === 'confirm' ? 'active' : ''} ${currentStep === 'success' ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Confirm</div>
        </div>
      </div>

      {/* Content based on current step */}
      <div className="scheduler-content">
        {/* Step 1: Select Therapist */}
        {currentStep === 'therapist' && (
          <div className="therapist-selection">
            {/* Search and filters */}
            <div className="search-filters">
              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search by name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filters">
                <select
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                >
                  <option value="all">All Specializations</option>
                  {getSpecializations().map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                
                <label className="availability-filter">
                  <input
                    type="checkbox"
                    checked={showOnlyAvailable}
                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  />
                  Show only available
                </label>
              </div>
            </div>

            {/* Therapist list */}
            <div className="therapist-list">
              {loading ? (
                <div className="loading">Loading therapists...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : (
                getFilteredTherapists().map(therapist => (
                  <div
                    key={therapist.id}
                    className="therapist-card"
                    onClick={() => selectTherapist(therapist)}
                  >
                    <div className="therapist-avatar">
                      {therapist.avatar ? (
                        <img src={therapist.avatar} alt={therapist.name} />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    
                    <div className="therapist-info">
                      <h3>{therapist.name}</h3>
                      <p className="title">{therapist.title}</p>
                      <div className="specializations">
                        {therapist.specializations.map(spec => (
                          <span key={spec} className="specialization-tag">
                            {spec}
                          </span>
                        ))}
                      </div>
                      <div className="therapist-meta">
                        {therapist.rating && (
                          <div className="rating">
                            <FaStar />
                            <span>{therapist.rating}</span>
                          </div>
                        )}
                        <div className="license">
                          License: {therapist.licensure.state} #{therapist.licensure.number}
                        </div>
                      </div>
                    </div>
                    
                    <button className="select-button">
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Choose Time */}
        {currentStep === 'time' && selectedTherapist && (
          <div className="time-selection">
            <div className="selected-therapist-summary">
              <h3>Selected Therapist</h3>
              <div className="therapist-summary">
                <div className="therapist-avatar-small">
                  {selectedTherapist.avatar ? (
                    <img src={selectedTherapist.avatar} alt={selectedTherapist.name} />
                  ) : (
                    <FaUser />
                  )}
                </div>
                <div>
                  <strong>{selectedTherapist.name}</strong>
                  <p>{selectedTherapist.title}</p>
                </div>
              </div>
            </div>

            {/* Calendar navigation */}
            <div className="calendar-navigation">
              <button onClick={() => navigateCalendar('prev')}>
                <FaChevronLeft />
              </button>
              <div className="calendar-current">
                {formatDate(currentWeek)}
              </div>
              <button onClick={() => navigateCalendar('next')}>
                <FaChevronRight />
              </button>
            </div>

            {/* Date picker */}
            <div className="date-picker">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            {/* Time slots */}
            <div className="time-slots">
              <h3>Available Times for {formatDate(selectedDate)}</h3>
              <div className="slots-grid">
                {loading ? (
                  <div className="loading">Loading available times...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="no-slots">No available time slots for this date</div>
                ) : (
                  availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      className={`time-slot ${!slot.available ? 'unavailable' : ''} ${selectedTime?.getTime() === slot.time.getTime() ? 'selected' : ''}`}
                      onClick={() => selectTimeSlot(slot)}
                      disabled={!slot.available}
                    >
                      {formatTime(slot.time)}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="navigation-buttons">
              <button
                className="back-button"
                onClick={() => setCurrentStep('therapist')}
              >
                Back
              </button>
              <button
                className="continue-button"
                onClick={() => setCurrentStep('confirm')}
                disabled={!selectedTime}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {currentStep === 'confirm' && selectedTherapist && selectedTime && (
          <div className="appointment-confirmation">
            <h3>Confirm Your Appointment</h3>
            
            {/* Appointment summary */}
            <div className="appointment-summary">
              <div className="summary-section">
                <h4>Therapist</h4>
                <div className="therapist-summary">
                  <div className="therapist-avatar-small">
                    {selectedTherapist.avatar ? (
                      <img src={selectedTherapist.avatar} alt={selectedTherapist.name} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div>
                    <strong>{selectedTherapist.name}</strong>
                    <p>{selectedTherapist.title}</p>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h4>Date & Time</h4>
                <p><FaCalendarAlt /> {formatDate(selectedTime)}</p>
                <p><FaClock /> {formatTime(selectedTime)}</p>
              </div>

              <div className="summary-section">
                <h4>Session Details</h4>
                <div className="session-options">
                  <label>
                    Session Type:
                    <select
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value as 'video' | 'phone')}
                    >
                      <option value="video">Video Call</option>
                      <option value="phone">Phone Call</option>
                    </select>
                  </label>
                  
                  <label>
                    Duration:
                    <select
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(Number(e.target.value))}
                    >
                      <option value="30">30 minutes</option>
                      <option value="50">50 minutes</option>
                      <option value="80">80 minutes</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="summary-section">
                <h4>Reminder Settings</h4>
                <div className="reminder-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={reminderSettings.email}
                      onChange={(e) => setReminderSettings({
                        ...reminderSettings,
                        email: e.target.checked
                      })}
                    />
                    <FaEnvelope /> Email
                  </label>
                  
                  <label>
                    <input
                      type="checkbox"
                      checked={reminderSettings.sms}
                      onChange={(e) => setReminderSettings({
                        ...reminderSettings,
                        sms: e.target.checked
                      })}
                    />
                    <FaPhone /> SMS
                  </label>
                  
                  <label>
                    <input
                      type="checkbox"
                      checked={reminderSettings.push}
                      onChange={(e) => setReminderSettings({
                        ...reminderSettings,
                        push: e.target.checked
                      })}
                    />
                    <FaBell /> Push Notification
                  </label>
                </div>
                
                <div className="reminder-timing">
                  <label>
                    <input
                      type="checkbox"
                      checked={reminderSettings.dayBefore}
                      onChange={(e) => setReminderSettings({
                        ...reminderSettings,
                        dayBefore: e.target.checked
                      })}
                    />
                    24 hours before
                  </label>
                  
                  <label>
                    <input
                      type="checkbox"
                      checked={reminderSettings.hourBefore}
                      onChange={(e) => setReminderSettings({
                        ...reminderSettings,
                        hourBefore: e.target.checked
                      })}
                    />
                    1 hour before
                  </label>
                </div>
              </div>

              <div className="summary-section">
                <h4>Additional Notes (Optional)</h4>
                <textarea
                  placeholder="Any specific topics or concerns you'd like to discuss..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* Confirmation buttons */}
            <div className="confirmation-buttons">
              <button
                className="back-button"
                onClick={() => setCurrentStep('time')}
              >
                Back
              </button>
              <button
                className="confirm-button"
                onClick={bookAppointment}
                disabled={loading}
              >
                {loading ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>

            {error && (
              <div className="error-message">
                <FaExclamationCircle />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && bookedAppointment && (
          <div className="booking-success">
            <div className="success-icon">
              <FaCheck />
            </div>
            
            <h3>Appointment Booked Successfully!</h3>
            
            <div className="success-details">
              <p>Your appointment has been confirmed for:</p>
              <div className="appointment-details">
                <p><strong>{formatDate(new Date(bookedAppointment.scheduledTime))}</strong></p>
                <p><strong>{formatTime(new Date(bookedAppointment.scheduledTime))}</strong></p>
                <p>Duration: {bookedAppointment.duration} minutes</p>
              </div>
              
              <div className="success-actions">
                <button className="add-to-calendar">
                  <FaCalendarAlt /> Add to Calendar
                </button>
                
                <button className="view-appointments" onClick={() => {
                  // Navigate to appointments list
                }}>
                  View My Appointments
                </button>
              </div>
              
              <div className="success-info">
                <p>You will receive a confirmation email shortly.</p>
                <p>A reminder will be sent according to your preferences.</p>
              </div>
            </div>

            {onClose && (
              <button className="done-button" onClick={onClose}>
                Done
              </button>
            )}
          </div>
        )}
      </div>

      {/* Existing appointments */}
      {appointments.length > 0 && currentStep === 'therapist' && (
        <div className="existing-appointments">
          <h3>Your Upcoming Appointments</h3>
          <div className="appointments-list">
            {appointments.map(apt => (
              <div key={apt.id} className="appointment-item">
                <div className="appointment-info">
                  <p className="appointment-date">
                    {formatDate(new Date(apt.scheduledTime))}
                  </p>
                  <p className="appointment-time">
                    {formatTime(new Date(apt.scheduledTime))}
                  </p>
                </div>
                <div className="appointment-actions">
                  <button
                    onClick={() => modifyAppointment(apt.id, 'reschedule')}
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => modifyAppointment(apt.id, 'cancel')}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentScheduler;