/**
 * Mental Health Platform - Helper Profile Creation View
 * 
 * Comprehensive helper profile creation system for mental health platform
 * with specialized features for crisis intervention, cultural competency,
 * and therapeutic approaches.
 * 
 * Features:
 * - Multi-step profile creation with validation
 * - Crisis intervention training requirements
 * - Cultural competency verification
 * - Professional credential validation
 * - Therapeutic approach specializations
 * - Mental health-specific privacy controls
 * 
 * @version 2.0.0 - Mental Health Specialized
 * @safety Crisis-aware helper verification and training
 * @therapeutic Comprehensive mental health support categories
 * @accessibility Enhanced UX for helper profile creation
 */

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

// Mental Health Platform - Comprehensive Helper Profile Interface
interface MentalHealthHelperProfile {
  id?: string;
  userId: string;
  personalInfo: {
    displayName: string;
    bio: string;
    profileImage?: File | string;
    location: {
      city: string;
      state: string;
      country: string;
      timezone: string;
    };
    contactPreferences: {
      email: boolean;
      phone: boolean;
      textMessage: boolean;
      videoCall: boolean;
    };
  };
  professionalBackground: {
    yearsOfExperience: number;
    currentRole: string;
    previousRoles: string;
    education: string;
    certifications: string[];
    licenses: {
      hasLicense: boolean;
      licenseType?: string;
      licenseNumber?: string;
      issuingState?: string;
      expirationDate?: Date;
    };
    specializations: MentalHealthSpecialization[];
    therapeuticApproaches: TherapeuticApproach[];
    professionalAffiliations: string[];
  };
  therapeuticExpertise: {
    primaryModalities: string[];
    secondaryModalities: string[];
    evidenceBasedPractices: string[];
    specializedTraining: {
      traumaInformed: boolean;
      crisisIntervention: boolean;
      suicidePrevention: boolean;
      substanceAbuse: boolean;
      eatingDisorders: boolean;
      domesticViolence: boolean;
    };
    populationExperience: {
      children: boolean;
      adolescents: boolean;
      adults: boolean;
      seniors: boolean;
      couples: boolean;
      families: boolean;
      groups: boolean;
    };
  };
  culturalCompetencies: {
    culturalBackgrounds: string[];
    languagesSpoken: string[];
    religiousAccommodations: string[];
    lgbtqAffirmative: boolean;
    traumaInformedCare: boolean;
    diversityTraining: boolean;
    immigrantRefugeeExperience: boolean;
    militaryVeteranExperience: boolean;
    disabilityAwareness: boolean;
    socioeconomicSensitivity: boolean;
  };
  crisisCapabilities: {
    crisisCertified: boolean;
    suicideRiskAssessment: boolean;
    emergencyProtocols: boolean;
    deescalationTechniques: boolean;
    safetyPlanning: boolean;
    hospitalConnections: boolean;
    emergencyContacts: boolean;
    availableForCrisis: boolean;
    crisisResponseTime: string;
    afterHoursCoverage: boolean;
  };
  availability: {
    hoursPerWeek: number;
    timeZone: string;
    weekdayAvailability: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
    };
    weekendAvailability: {
      saturday: boolean;
      sunday: boolean;
    };
    timeSlots: {
      morning: boolean; // 6-12
      afternoon: boolean; // 12-18
      evening: boolean; // 18-24
      lateNight: boolean; // 24-6
    };
    responseTime: string;
    sessionLengths: number[];
    maxClientsPerWeek: number;
    waitingListAcceptance: boolean;
  };
  supportCapabilities: {
    oneOnOneTherapy: boolean;
    groupTherapy: boolean;
    familyTherapy: boolean;
    couplesCounseling: boolean;
    crisisIntervention: boolean;
    peerSupport: boolean;
    coaching: boolean;
    consultation: boolean;
    assessmentServices: boolean;
    psychoeducation: boolean;
    supportGroups: boolean;
  };
  communicationMethods: {
    inPersonSessions: boolean;
    videoTherapy: boolean;
    phoneTherapy: boolean;
    textTherapy: boolean;
    emailSupport: boolean;
    chatSupport: boolean;
    emergencyContactMethods: string[];
  };
  verification: {
    identityVerified: boolean;
    backgroundCheck: boolean;
    professionalReferences: {
      provided: boolean;
      verified: boolean;
      referenceCount: number;
    };
    educationVerified: boolean;
    licenseVerified: boolean;
    insuranceProvider: boolean;
    malpracticeInsurance: boolean;
    platformTraining: {
      basicHelperTraining: boolean;
      crisisTraining: boolean;
      culturalCompetencyTraining: boolean;
      platformPolicies: boolean;
      ethicsTraining: boolean;
    };
    continuingEducation: {
      hoursCompleted: number;
      lastUpdate: Date;
      upcomingRequirements: string[];
    };
  };
  pricing: {
    sessionRates: {
      individual: number;
      couples: number;
      family: number;
      group: number;
    };
    acceptsInsurance: boolean;
    insuranceProviders: string[];
    slidingScale: boolean;
    proBonoSlots: number;
    emergencyRates: number;
    cancelationPolicy: string;
  };
  privacySettings: {
    profileVisibility: 'public' | 'verified-only' | 'referral-only';
    allowDirectBooking: boolean;
    shareRealName: boolean;
    shareLocation: boolean;
    shareCredentials: boolean;
    allowReviews: boolean;
    shareAvailability: boolean;
    emergencyContactSharing: boolean;
  };
  qualityMetrics: {
    clientSatisfactionScore: number;
    completionRate: number;
    responseTimeAverage: number;
    professionalDevelopmentHours: number;
    peerReviewScore: number;
    platformCompliance: number;
    crisisHandlingScore?: number;
    culturalSensitivityScore: number;
  };
  status: 'draft' | 'pending' | 'approved' | 'suspended' | 'under-review';
  createdAt?: Date;
  updatedAt?: Date;
  approvedAt?: Date;
  reviewNotes?: string[];
}

type MentalHealthSpecialization = 
  | 'Anxiety Disorders' | 'Depression' | 'Bipolar Disorder' | 'PTSD & Trauma'
  | 'Eating Disorders' | 'Substance Use Disorders' | 'ADHD' | 'Autism Spectrum'
  | 'OCD' | 'Personality Disorders' | 'Schizophrenia & Psychosis' | 'Grief & Loss'
  | 'Relationship Issues' | 'Family Therapy' | 'Child Psychology' | 'Adolescent Therapy'
  | 'Geriatric Psychology' | 'Crisis Intervention' | 'Suicide Prevention' | 'Self-Harm'
  | 'Domestic Violence' | 'Sexual Abuse Recovery' | 'LGBTQ+ Issues' | 'Military/Veterans'
  | 'Chronic Illness Support' | 'Pain Management Psychology' | 'Sleep Disorders'
  | 'Stress Management' | 'Life Transitions' | 'Career Counseling';

type TherapeuticApproach = 
  | 'Cognitive Behavioral Therapy (CBT)' | 'Dialectical Behavior Therapy (DBT)'
  | 'Acceptance and Commitment Therapy (ACT)' | 'Mindfulness-Based Therapy'
  | 'Eye Movement Desensitization and Reprocessing (EMDR)' | 'Psychodynamic Therapy'
  | 'Humanistic/Person-Centered Therapy' | 'Solution-Focused Brief Therapy'
  | 'Narrative Therapy' | 'Family Systems Therapy' | 'Gestalt Therapy'
  | 'Motivational Interviewing' | 'Exposure and Response Prevention'
  | 'Cognitive Processing Therapy' | 'Trauma-Focused CBT' | 'Somatic Therapy'
  | 'Art Therapy' | 'Music Therapy' | 'Play Therapy' | 'Sand Tray Therapy'
  | 'Equine Therapy' | 'Group Therapy' | 'Psychoeducation' | 'Peer Support';

// Helper Profile Creation Component
const CreateHelperProfileView: React.FC = () => {
  const [profile, setProfile] = useState<MentalHealthHelperProfile>({
    userId: 'current-user-id', // Would come from auth context
    personalInfo: {
      displayName: '',
      bio: '',
      location: {
        city: '',
        state: '',
        country: 'United States',
        timezone: 'EST'
      },
      contactPreferences: {
        email: true,
        phone: false,
        textMessage: false,
        videoCall: true
      }
    },
    professionalBackground: {
      yearsOfExperience: 0,
      currentRole: '',
      previousRoles: '',
      education: '',
      certifications: [],
      licenses: {
        hasLicense: false
      },
      specializations: [],
      therapeuticApproaches: [],
      professionalAffiliations: []
    },
    therapeuticExpertise: {
      primaryModalities: [],
      secondaryModalities: [],
      evidenceBasedPractices: [],
      specializedTraining: {
        traumaInformed: false,
        crisisIntervention: false,
        suicidePrevention: false,
        substanceAbuse: false,
        eatingDisorders: false,
        domesticViolence: false
      },
      populationExperience: {
        children: false,
        adolescents: false,
        adults: false,
        seniors: false,
        couples: false,
        families: false,
        groups: false
      }
    },
    culturalCompetencies: {
      culturalBackgrounds: [],
      languagesSpoken: ['English'],
      religiousAccommodations: [],
      lgbtqAffirmative: false,
      traumaInformedCare: false,
      diversityTraining: false,
      immigrantRefugeeExperience: false,
      militaryVeteranExperience: false,
      disabilityAwareness: false,
      socioeconomicSensitivity: false
    },
    crisisCapabilities: {
      crisisCertified: false,
      suicideRiskAssessment: false,
      emergencyProtocols: false,
      deescalationTechniques: false,
      safetyPlanning: false,
      hospitalConnections: false,
      emergencyContacts: false,
      availableForCrisis: false,
      crisisResponseTime: 'Not Available',
      afterHoursCoverage: false
    },
    availability: {
      hoursPerWeek: 0,
      timeZone: 'EST',
      weekdayAvailability: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false
      },
      weekendAvailability: {
        saturday: false,
        sunday: false
      },
      timeSlots: {
        morning: false,
        afternoon: false,
        evening: false,
        lateNight: false
      },
      responseTime: 'Within 24 hours',
      sessionLengths: [],
      maxClientsPerWeek: 0,
      waitingListAcceptance: false
    },
    supportCapabilities: {
      oneOnOneTherapy: false,
      groupTherapy: false,
      familyTherapy: false,
      couplesCounseling: false,
      crisisIntervention: false,
      peerSupport: false,
      coaching: false,
      consultation: false,
      assessmentServices: false,
      psychoeducation: false,
      supportGroups: false
    },
    communicationMethods: {
      inPersonSessions: false,
      videoTherapy: false,
      phoneTherapy: false,
      textTherapy: false,
      emailSupport: false,
      chatSupport: false,
      emergencyContactMethods: []
    },
    verification: {
      identityVerified: false,
      backgroundCheck: false,
      professionalReferences: {
        provided: false,
        verified: false,
        referenceCount: 0
      },
      educationVerified: false,
      licenseVerified: false,
      insuranceProvider: false,
      malpracticeInsurance: false,
      platformTraining: {
        basicHelperTraining: false,
        crisisTraining: false,
        culturalCompetencyTraining: false,
        platformPolicies: false,
        ethicsTraining: false
      },
      continuingEducation: {
        hoursCompleted: 0,
        lastUpdate: new Date(),
        upcomingRequirements: []
      }
    },
    pricing: {
      sessionRates: {
        individual: 0,
        couples: 0,
        family: 0,
        group: 0
      },
      acceptsInsurance: false,
      insuranceProviders: [],
      slidingScale: false,
      proBonoSlots: 0,
      emergencyRates: 0,
      cancelationPolicy: ''
    },
    privacySettings: {
      profileVisibility: 'public',
      allowDirectBooking: false,
      shareRealName: false,
      shareLocation: false,
      shareCredentials: false,
      allowReviews: true,
      shareAvailability: true,
      emergencyContactSharing: false
    },
    qualityMetrics: {
      clientSatisfactionScore: 0,
      completionRate: 0,
      responseTimeAverage: 0,
      professionalDevelopmentHours: 0,
      peerReviewScore: 0,
      platformCompliance: 0,
      culturalSensitivityScore: 0
    },
    status: 'draft'
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const profileSteps = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic profile information and contact preferences',
      required: true
    },
    {
      id: 'professional',
      title: 'Professional Background',
      description: 'Education, experience, and credentials',
      required: true
    },
    {
      id: 'therapeutic',
      title: 'Therapeutic Expertise',
      description: 'Specializations and treatment approaches',
      required: true
    },
    {
      id: 'cultural',
      title: 'Cultural Competencies',
      description: 'Diversity, inclusion, and cultural awareness',
      required: false
    },
    {
      id: 'crisis',
      title: 'Crisis Capabilities',
      description: 'Crisis intervention training and availability',
      required: false
    },
    {
      id: 'availability',
      title: 'Availability & Scheduling',
      description: 'Schedule, time zones, and session preferences',
      required: true
    },
    {
      id: 'services',
      title: 'Services & Communication',
      description: 'Types of services and communication methods',
      required: true
    },
    {
      id: 'verification',
      title: 'Verification & Training',
      description: 'Platform training and professional verification',
      required: true
    },
    {
      id: 'pricing',
      title: 'Pricing & Insurance',
      description: 'Session rates and insurance information',
      required: true
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'Profile visibility and sharing preferences',
      required: true
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Final review before submitting for approval',
      required: true
    }
  ];

  // Comprehensive validation function
  const validateCurrentStep = useCallback((): boolean => {
    const errors: string[] = [];

    switch (currentStep) {
      case 0: // Personal
        if (!profile.personalInfo.displayName.trim()) {
          errors.push('Display name is required');
        }
        if (!profile.personalInfo.bio.trim() || profile.personalInfo.bio.length < 50) {
          errors.push('Bio must be at least 50 characters');
        }
        if (!profile.personalInfo.location.city.trim()) {
          errors.push('City is required');
        }
        if (!profile.personalInfo.location.state.trim()) {
          errors.push('State is required');
        }
        break;

      case 1: // Professional
        if (profile.professionalBackground.yearsOfExperience < 0) {
          errors.push('Years of experience must be 0 or greater');
        }
        if (!profile.professionalBackground.education.trim()) {
          errors.push('Education information is required');
        }
        if (profile.professionalBackground.specializations.length === 0) {
          errors.push('At least one specialization is required');
        }
        if (profile.professionalBackground.therapeuticApproaches.length === 0) {
          errors.push('At least one therapeutic approach is required');
        }
        break;

      case 2: // Therapeutic
        const hasPopulationExperience = Object.values(profile.therapeuticExpertise.populationExperience).some(Boolean);
        if (!hasPopulationExperience) {
          errors.push('At least one population experience is required');
        }
        break;

      case 5: // Availability
        if (profile.availability.hoursPerWeek <= 0) {
          errors.push('Hours per week must be greater than 0');
        }
        const hasWeekdayAvailability = Object.values(profile.availability.weekdayAvailability).some(Boolean);
        const hasWeekendAvailability = Object.values(profile.availability.weekendAvailability).some(Boolean);
        if (!hasWeekdayAvailability && !hasWeekendAvailability) {
          errors.push('At least one day of availability is required');
        }
        const hasTimeSlot = Object.values(profile.availability.timeSlots).some(Boolean);
        if (!hasTimeSlot) {
          errors.push('At least one time slot is required');
        }
        if (profile.availability.sessionLengths.length === 0) {
          errors.push('At least one session length is required');
        }
        break;

      case 6: // Services
        const hasService = Object.values(profile.supportCapabilities).some(Boolean);
        if (!hasService) {
          errors.push('At least one service type is required');
        }
        const hasCommunicationMethod = Object.values(profile.communicationMethods).some(Boolean);
        if (!hasCommunicationMethod) {
          errors.push('At least one communication method is required');
        }
        break;

      case 7: // Verification
        if (!profile.verification.platformTraining.basicHelperTraining) {
          errors.push('Basic helper training is required');
        }
        if (!profile.verification.platformTraining.ethicsTraining) {
          errors.push('Ethics training is required');
        }
        if (!profile.verification.platformTraining.platformPolicies) {
          errors.push('Platform policies training is required');
        }
        // Crisis training required if crisis services offered
        if (profile.crisisCapabilities.availableForCrisis && !profile.verification.platformTraining.crisisTraining) {
          errors.push('Crisis training is required for crisis intervention services');
        }
        break;

      case 8: // Pricing
        if (profile.pricing.sessionRates.individual <= 0) {
          errors.push('Individual session rate must be greater than 0');
        }
        if (!profile.pricing.cancelationPolicy.trim()) {
          errors.push('Cancellation policy is required');
        }
        break;

      default:
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [currentStep, profile]);

  // Update profile section
  const updateProfile = useCallback(<T extends keyof MentalHealthHelperProfile>(
    section: T,
    updates: Partial<MentalHealthHelperProfile[T]>
  ) => {
    setProfile(prev => {
      const currentSection = prev[section];
      const updatedSection = typeof currentSection === 'object' && currentSection !== null
        ? { ...currentSection, ...updates }
        : updates;
      
      return {
        ...prev,
        [section]: updatedSection
      };
    });
  }, []);

  // Handle array toggles
  const toggleArrayItem = useCallback(<T extends keyof MentalHealthHelperProfile>(
    section: T,
    field: keyof MentalHealthHelperProfile[T],
    value: string
  ) => {
    setProfile(prev => {
      const currentSection = prev[section] as any;
      const currentArray = currentSection[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item: string) => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [field]: newArray
        }
      };
    });
  }, []);

  // Step navigation
  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, profileSteps.length - 1));
    }
  }, [validateCurrentStep, profileSteps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  // Calculate profile completion percentage
  const getCompletionPercentage = useCallback((): number => {
    let completedSections = 0;
    const totalSections = profileSteps.length - 1; // Exclude review step

    // Check each section for completion
    const checks = [
      // Personal
      profile.personalInfo.displayName && profile.personalInfo.bio && 
      profile.personalInfo.location.city && profile.personalInfo.location.state,
      
      // Professional
      profile.professionalBackground.education && 
      profile.professionalBackground.specializations.length > 0 &&
      profile.professionalBackground.therapeuticApproaches.length > 0,
      
      // Therapeutic
      Object.values(profile.therapeuticExpertise.populationExperience).some(Boolean),
      
      // Cultural (optional, counts as complete)
      true,
      
      // Crisis (optional, counts as complete)
      true,
      
      // Availability
      profile.availability.hoursPerWeek > 0 && 
      (Object.values(profile.availability.weekdayAvailability).some(Boolean) || 
       Object.values(profile.availability.weekendAvailability).some(Boolean)) &&
      Object.values(profile.availability.timeSlots).some(Boolean) &&
      profile.availability.sessionLengths.length > 0,
      
      // Services
      Object.values(profile.supportCapabilities).some(Boolean) &&
      Object.values(profile.communicationMethods).some(Boolean),
      
      // Verification
      profile.verification.platformTraining.basicHelperTraining &&
      profile.verification.platformTraining.ethicsTraining &&
      profile.verification.platformTraining.platformPolicies,
      
      // Pricing
      profile.pricing.sessionRates.individual > 0 && profile.pricing.cancelationPolicy,
      
      // Privacy
      true // Always complete as it has defaults
    ];

    completedSections = checks.filter(Boolean).length;
    return Math.round((completedSections / totalSections) * 100);
  }, [profile, profileSteps.length]);

  // Save draft
  const saveDraft = useCallback(async () => {
    setIsLoading(true);
    try {
      const updatedProfile = {
        ...profile,
        updatedAt: new Date()
      };
      
      // Save to localStorage (in real app, would call API)
      localStorage.setItem(`helper-profile-${profile.userId}`, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      
      // Show success notification
      console.log('Profile draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Submit profile for review
  const submitProfile = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsLoading(true);
    try {
      const submittedProfile = {
        ...profile,
        status: 'pending' as const,
        createdAt: profile.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      // Save to localStorage (in real app, would call API)
      localStorage.setItem(`helper-profile-${profile.userId}`, JSON.stringify(submittedProfile));
      setProfile(submittedProfile);
      
      console.log('Profile submitted for review successfully');
    } catch (error) {
      console.error('Error submitting profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile, validateCurrentStep]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return React.createElement('div', { className: 'profile-step' },
          React.createElement('h3', null, 'Personal Information'),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Display Name *'),
            React.createElement('input', {
              type: 'text',
              value: profile.personalInfo.displayName,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
                updateProfile('personalInfo', { displayName: e.target.value }),
              placeholder: 'How you want to be known to clients'
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Professional Bio *'),
            React.createElement('textarea', {
              value: profile.personalInfo.bio,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => 
                updateProfile('personalInfo', { bio: e.target.value }),
              placeholder: 'Describe your approach, experience, and what makes you a good helper...',
              rows: 4
            })
          ),
          React.createElement('div', { className: 'form-row' },
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', null, 'City *'),
              React.createElement('input', {
                type: 'text',
                value: profile.personalInfo.location.city,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
                  updateProfile('personalInfo', { 
                    location: { ...profile.personalInfo.location, city: e.target.value }
                  })
              })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', null, 'State *'),
              React.createElement('input', {
                type: 'text',
                value: profile.personalInfo.location.state,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
                  updateProfile('personalInfo', { 
                    location: { ...profile.personalInfo.location, state: e.target.value }
                  })
              })
            )
          )
        );

      case 1: // Professional Background
        return React.createElement('div', { className: 'profile-step' },
          React.createElement('h3', null, 'Professional Background'),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Years of Experience'),
            React.createElement('input', {
              type: 'number',
              value: profile.professionalBackground.yearsOfExperience.toString(),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
                updateProfile('professionalBackground', { yearsOfExperience: parseInt(e.target.value) || 0 }),
              min: '0',
              max: '50'
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Education & Training *'),
            React.createElement('textarea', {
              value: profile.professionalBackground.education,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => 
                updateProfile('professionalBackground', { education: e.target.value }),
              placeholder: 'Degrees, certifications, specialized training...',
              rows: 3
            })
          )
        );

      case 10: // Review & Submit
        return React.createElement('div', { className: 'profile-step' },
          React.createElement('h3', null, 'Review Your Profile'),
          React.createElement('div', { className: 'profile-summary' },
            React.createElement('h4', null, 'Profile Summary'),
            React.createElement('p', null, `Display Name: ${profile.personalInfo.displayName}`),
            React.createElement('p', null, `Location: ${profile.personalInfo.location.city}, ${profile.personalInfo.location.state}`),
            React.createElement('p', null, `Experience: ${profile.professionalBackground.yearsOfExperience} years`),
            React.createElement('p', null, `Specializations: ${profile.professionalBackground.specializations.length} selected`),
            React.createElement('p', null, `Completion: ${getCompletionPercentage()}%`)
          )
        );

      default:
        return React.createElement('div', { className: 'profile-step' },
          React.createElement('h3', null, profileSteps[currentStep]?.title || 'Step'),
          React.createElement('p', null, 'This step is under construction.')
        );
    }
  };

  // Render validation errors
  const renderValidationErrors = () => {
    if (validationErrors.length === 0) return null;

    return React.createElement('div', { className: 'validation-errors' },
      React.createElement('h4', null, 'Please fix the following errors:'),
      React.createElement('ul', null,
        ...validationErrors.map((error, index) =>
          React.createElement('li', { key: index }, error)
        )
      )
    );
  };

  // Main render
  return React.createElement('div', { className: 'create-helper-profile-view' },
    React.createElement('div', { className: 'profile-header' },
      React.createElement('h1', null, 'Create Helper Profile'),
      React.createElement('p', null, 'Join our mental health support community'),
      React.createElement('div', { className: 'progress-indicator' },
        React.createElement('div', { className: 'progress-bar' },
          React.createElement('div', {
            className: 'progress-fill',
            style: { width: `${(currentStep / (profileSteps.length - 1)) * 100}%` }
          })
        ),
        React.createElement('span', null, `Step ${currentStep + 1} of ${profileSteps.length}`)
      )
    ),

    React.createElement('div', { className: 'profile-content' },
      renderValidationErrors(),
      renderStepContent()
    ),

    React.createElement('div', { className: 'profile-navigation' },
      React.createElement('div', { className: 'nav-buttons' },
        currentStep > 0 && React.createElement('button', {
          onClick: prevStep,
          disabled: isLoading
        }, 'Previous'),
        
        React.createElement('button', {
          onClick: saveDraft,
          disabled: isLoading
        }, 'Save Draft'),
        
        currentStep < profileSteps.length - 1
          ? React.createElement('button', {
              onClick: nextStep,
              disabled: isLoading
            }, 'Next')
          : React.createElement('button', {
              onClick: submitProfile,
              disabled: isLoading || validationErrors.length > 0
            }, isLoading ? 'Submitting...' : 'Submit for Review')
      )
    )
  );
};

export default CreateHelperProfileView;