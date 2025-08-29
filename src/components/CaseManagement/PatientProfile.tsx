import React from 'react';
import { User, Phone, Mail, MapPin, AlertCircle, Shield, Calendar, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface PatientProfileProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender?: string;
    dateOfBirth?: Date;
    diagnosis: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    contactInfo: {
      phone: string;
      email: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
      };
      emergencyContact?: string;
    };
    insurance?: {
      provider: string;
      policyNumber: string;
    };
    primaryTherapist?: string;
    assignedDate?: Date;
    lastSession?: Date;
    nextAppointment?: Date;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    allergies?: string[];
    notes?: string;
  };
}

export const PatientProfile: React.FC<PatientProfileProps> = ({ patient }) => {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {patient.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {patient.age} years old {patient.gender ? `• ${patient.gender}` : ''}
            </p>
            {patient.dateOfBirth && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                DOB: {format(patient.dateOfBirth, 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(patient.riskLevel)}`}>
          {patient.riskLevel.toUpperCase()} RISK
        </span>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Contact Information
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">{patient.contactInfo.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">{patient.contactInfo.email}</span>
            </div>
            {patient.contactInfo.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                <div className="text-gray-700 dark:text-gray-300">
                  <p>{patient.contactInfo.address.street}</p>
                  <p>{patient.contactInfo.address.city}, {patient.contactInfo.address.state} {patient.contactInfo.address.zipCode}</p>
                </div>
              </div>
            )}
            {patient.contactInfo.emergencyContact && (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Emergency: {patient.contactInfo.emergencyContact}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Insurance Information */}
        {patient.insurance && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Insurance
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">{patient.insurance.provider}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Policy: {patient.insurance.policyNumber}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Clinical Information */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Clinical Information
        </h3>
        
        {/* Diagnoses */}
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Primary Diagnoses</p>
          <div className="flex flex-wrap gap-2">
            {patient.diagnosis.map((diag, index) => (
              <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                {diag}
              </span>
            ))}
          </div>
        </div>

        {/* Medications */}
        {patient.medications && patient.medications.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Current Medications</p>
            <div className="space-y-1">
              {patient.medications.map((med, index) => (
                <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{med.name}</span> - {med.dosage} ({med.frequency})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allergies */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy, index) => (
                <span key={index} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Treatment Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Treatment Timeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patient.assignedDate && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Assigned</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {format(patient.assignedDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
          {patient.lastSession && (
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Last Session</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {format(patient.lastSession, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
          {patient.nextAppointment && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Next Appointment</p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {format(patient.nextAppointment, 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      {patient.notes && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Clinical Notes</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{patient.notes}</p>
        </div>
      )}
    </div>
  );
};