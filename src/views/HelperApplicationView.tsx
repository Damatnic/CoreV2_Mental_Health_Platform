import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { AppInput, AppTextArea } from '../components/AppInput';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { CheckIcon, ClockIcon, XIcon, FileIcon, UploadIcon } from '../components/icons.dynamic';

interface HelperApplication {
  id?: string;
  applicantId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  experience: {
    hasExperience: boolean;
    yearsOfExperience: number;
    previousRoles: string;
    relevantEducation: string;
    certifications: string[];
    specializations: string[];
  };
  motivation: {
    whyHelper: string;
    personalExperience: string;
    goals: string;
    availability: {
      hoursPerWeek: number;
      preferredSchedule: string;
      timezone: string;
    };
  };
  references: {
    name: string;
    relationship: string;
    email: string;
    phone: string;
  }[];
  documents: {
    resume?: File;
    backgroundCheck?: File;
    certifications?: File[];
  };
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewerNotes?: string;
}

interface ApplicationStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

const HelperApplicationView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [application, setApplication] = useState<HelperApplication>({
    applicantId: user?.id || '',
    personalInfo: {
      firstName: '',
      lastName: '',
      email: user?.email || '',
      phone: '',
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      }
    },
    experience: {
      hasExperience: false,
      yearsOfExperience: 0,
      previousRoles: '',
      relevantEducation: '',
      certifications: [],
      specializations: []
    },
    motivation: {
      whyHelper: '',
      personalExperience: '',
      goals: '',
      availability: {
        hoursPerWeek: 0,
        preferredSchedule: '',
        timezone: 'EST'
      }
    },
    references: [],
    documents: {},
    status: 'draft'
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);

  const steps: ApplicationStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic contact and demographic information',
      isCompleted: false,
      isActive: currentStep === 0
    },
    {
      id: 'experience',
      title: 'Experience & Qualifications',
      description: 'Your background, education, and certifications',
      isCompleted: false,
      isActive: currentStep === 1
    },
    {
      id: 'motivation',
      title: 'Motivation & Availability',
      description: 'Why you want to help and your availability',
      isCompleted: false,
      isActive: currentStep === 2
    },
    {
      id: 'references',
      title: 'References',
      description: 'Professional or personal references',
      isCompleted: false,
      isActive: currentStep === 3
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Upload required documents and certifications',
      isCompleted: false,
      isActive: currentStep === 4
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your application before submission',
      isCompleted: false,
      isActive: currentStep === 5
    }
  ];

  useEffect(() => {
    loadExistingApplication();
  }, [user]);

  const loadExistingApplication = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Check if user already has an application
      // Mock check - in real app, this would be an API call
      const existingApp = localStorage.getItem(`helper-application-${user.id}`);
      if (existingApp) {
        const parsed = JSON.parse(existingApp);
        setApplication(parsed);
        setHasExistingApplication(true);
        
        if (parsed.status === 'submitted') {
          showNotification('You have already submitted an application. You can view its status below.', 'info');
        }
      }
      
    } catch (error) {
      console.error('Error loading application:', error);
      showNotification('Failed to load existing application', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplication = (section: keyof HelperApplication, data: any) => {
    setApplication(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const addReference = () => {
    setApplication(prev => ({
      ...prev,
      references: [
        ...prev.references,
        { name: '', relationship: '', email: '', phone: '' }
      ]
    }));
  };

  const updateReference = (index: number, field: string, value: string) => {
    setApplication(prev => ({
      ...prev,
      references: prev.references.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const removeReference = (index: number) => {
    setApplication(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (type: keyof HelperApplication['documents'], file: File) => {
    setApplication(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [type]: file
      }
    }));
    showNotification('success', `${file.name} uploaded successfully`);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Personal Info
        const { personalInfo } = application;
        return !!(
          personalInfo.firstName &&
          personalInfo.lastName &&
          personalInfo.email &&
          personalInfo.phone &&
          personalInfo.dateOfBirth &&
          personalInfo.address.street &&
          personalInfo.address.city &&
          personalInfo.address.state &&
          personalInfo.address.zipCode
        );
      
      case 1: // Experience
        const { experience } = application;
        return !!(
          experience.relevantEducation &&
          experience.specializations.length > 0
        );
      
      case 2: // Motivation
        const { motivation } = application;
        return !!(
          motivation.whyHelper &&
          motivation.goals &&
          motivation.availability.hoursPerWeek > 0 &&
          motivation.availability.preferredSchedule
        );
      
      case 3: // References
        return application.references.length >= 2 &&
               application.references.every(ref => ref.name && ref.email);
      
      case 4: // Documents
        return !!application.documents.resume;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      showNotification('Please complete all required fields before continuing', 'warning');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const saveDraft = async () => {
    try {
      setIsLoading(true);
      
      // Save to localStorage (in real app, would be API call)
      localStorage.setItem(`helper-application-${user?.id}`, JSON.stringify(application));
      
      showNotification('Draft saved successfully', 'success');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      showNotification('Failed to save draft', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const submitApplication = async () => {
    if (!validateCurrentStep()) {
      showNotification('Please review and complete all sections', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      
      const submittedApplication = {
        ...application,
        status: 'submitted' as const,
        submittedAt: new Date()
      };
      
      // Submit application (mock API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save submitted application
      localStorage.setItem(`helper-application-${user?.id}`, JSON.stringify(submittedApplication));
      
      setApplication(submittedApplication);
      showNotification('Application submitted successfully! We will review it and get back to you within 5-7 business days.', 'success');
      
    } catch (error) {
      console.error('Error submitting application:', error);
      showNotification('Failed to submit application', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { icon: <FileIcon />, color: 'gray', text: 'Draft' },
      submitted: { icon: <ClockIcon />, color: 'blue', text: 'Under Review' },
      under_review: { icon: <ClockIcon />, color: 'yellow', text: 'Under Review' },
      approved: { icon: <CheckIcon />, color: 'green', text: 'Approved' },
      rejected: { icon: <XIcon />, color: 'red', text: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`status-badge ${config.color}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  if (isLoading && !hasExistingApplication) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading application...</p>
      </div>
    );
  }

  if (application.status === 'submitted' || application.status === 'under_review') {
    return (
      <div className="helper-application-view">
        <ViewHeader
          title="Helper Application"
          subtitle="Your application status"
        />

        <Card className="application-status-card">
          <div className="status-header">
            <h2>Application Status</h2>
            {getStatusBadge(application.status)}
          </div>

          <div className="status-info">
            <p>Thank you for applying to become a helper! Your application is currently being reviewed by our team.</p>
            
            {application.submittedAt && (
              <p>
                <strong>Submitted:</strong> {application.submittedAt.toLocaleDateString()}
              </p>
            )}
            
            <p>
              <strong>Expected Response Time:</strong> 5-7 business days
            </p>

            {application.reviewerNotes && (
              <div className="reviewer-notes">
                <h4>Reviewer Notes:</h4>
                <p>{application.reviewerNotes}</p>
              </div>
            )}
          </div>

          <div className="next-steps">
            <h4>What happens next?</h4>
            <ul>
              <li>Our team will review your application and documents</li>
              <li>We may contact your references</li>
              <li>If approved, you'll receive training materials and onboarding information</li>
              <li>You'll be notified via email once a decision is made</li>
            </ul>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="helper-application-view">
      <ViewHeader
        title="Become a Helper"
        subtitle="Join our community of peer supporters"
      />

      {/* Progress Steps */}
      <Card className="progress-steps">
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={step.id} className={`step ${step.isActive ? 'active' : ''} ${step.isCompleted ? 'completed' : ''}`}>
              <div className="step-number">
                {step.isCompleted ? <CheckIcon /> : index + 1}
              </div>
              <div className="step-info">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Step Content */}
      <Card className="application-form">
        {currentStep === 0 && (
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-grid">
              <AppInput
                label="First Name *"
                value={application.personalInfo.firstName}
                onChange={(e) => updateApplication('personalInfo', { firstName: e.target.value })}
                required
              />
              <AppInput
                label="Last Name *"
                value={application.personalInfo.lastName}
                onChange={(e) => updateApplication('personalInfo', { lastName: e.target.value })}
                required
              />
              <AppInput
                label="Email *"
                type="email"
                value={application.personalInfo.email}
                onChange={(e) => updateApplication('personalInfo', { email: e.target.value })}
                required
              />
              <AppInput
                label="Phone *"
                type="tel"
                value={application.personalInfo.phone}
                onChange={(e) => updateApplication('personalInfo', { phone: e.target.value })}
                required
              />
              <AppInput
                label="Date of Birth *"
                type="date"
                value={application.personalInfo.dateOfBirth}
                onChange={(e) => updateApplication('personalInfo', { dateOfBirth: e.target.value })}
                required
              />
            </div>
            
            <h4>Address</h4>
            <div className="form-grid">
              <AppInput
                label="Street Address *"
                value={application.personalInfo.address.street}
                onChange={(e) => updateApplication('personalInfo', { 
                  address: { ...application.personalInfo.address, street: e.target.value }
                })}
                required
              />
              <AppInput
                label="City *"
                value={application.personalInfo.address.city}
                onChange={(e) => updateApplication('personalInfo', { 
                  address: { ...application.personalInfo.address, city: e.target.value }
                })}
                required
              />
              <AppInput
                label="State *"
                value={application.personalInfo.address.state}
                onChange={(e) => updateApplication('personalInfo', { 
                  address: { ...application.personalInfo.address, state: e.target.value }
                })}
                required
              />
              <AppInput
                label="ZIP Code *"
                value={application.personalInfo.address.zipCode}
                onChange={(e) => updateApplication('personalInfo', { 
                  address: { ...application.personalInfo.address, zipCode: e.target.value }
                })}
                required
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="form-section">
            <h3>Experience & Qualifications</h3>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={application.experience.hasExperience}
                  onChange={(e) => updateApplication('experience', { hasExperience: e.target.checked })}
                />
                I have previous experience in mental health, counseling, or peer support
              </label>
            </div>

            {application.experience.hasExperience && (
              <div className="form-grid">
                <AppInput
                  label="Years of Experience"
                  type="number"
                  value={application.experience.yearsOfExperience.toString()}
                  onChange={(e) => updateApplication('experience', { yearsOfExperience: parseInt(e.target.value) || 0 })}
                />
                <AppTextArea
                  label="Previous Roles"
                  value={application.experience.previousRoles}
                  onChange={(e) => updateApplication('experience', { previousRoles: e.target.value })}
                  placeholder="Describe your previous roles and responsibilities..."
                />
              </div>
            )}

            <AppTextArea
              label="Relevant Education *"
              value={application.experience.relevantEducation}
              onChange={(e) => updateApplication('experience', { relevantEducation: e.target.value })}
              placeholder="Describe your educational background, degrees, relevant coursework..."
              required
            />

            <div className="specializations">
              <label>Areas of Interest/Specialization *</label>
              <div className="specialization-options">
                {['Anxiety', 'Depression', 'PTSD', 'Addiction Recovery', 'Grief & Loss', 'Teen Mental Health', 'Family Support', 'Crisis Intervention'].map(spec => (
                  <label key={spec} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={application.experience.specializations.includes(spec)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateApplication('experience', {
                            specializations: [...application.experience.specializations, spec]
                          });
                        } else {
                          updateApplication('experience', {
                            specializations: application.experience.specializations.filter(s => s !== spec)
                          });
                        }
                      }}
                    />
                    {spec}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-section">
            <h3>Motivation & Availability</h3>
            
            <AppTextArea
              label="Why do you want to become a helper? *"
              value={application.motivation.whyHelper}
              onChange={(e) => updateApplication('motivation', { whyHelper: e.target.value })}
              placeholder="Share your motivation for wanting to help others..."
              required
            />

            <AppTextArea
              label="Personal Experience (Optional)"
              value={application.motivation.personalExperience}
              onChange={(e) => updateApplication('motivation', { personalExperience: e.target.value })}
              placeholder="If comfortable, share any personal experience with mental health that motivates you to help others..."
            />

            <AppTextArea
              label="Goals as a Helper *"
              value={application.motivation.goals}
              onChange={(e) => updateApplication('motivation', { goals: e.target.value })}
              placeholder="What do you hope to achieve as a helper?"
              required
            />

            <h4>Availability</h4>
            <div className="form-grid">
              <AppInput
                label="Hours per week you can commit *"
                type="number"
                value={application.motivation.availability.hoursPerWeek.toString()}
                onChange={(e) => updateApplication('motivation', {
                  availability: {
                    ...application.motivation.availability,
                    hoursPerWeek: parseInt(e.target.value) || 0
                  }
                })}
                required
              />
              <select
                value={application.motivation.availability.timezone}
                onChange={(e) => updateApplication('motivation', {
                  availability: {
                    ...application.motivation.availability,
                    timezone: e.target.value
                  }
                })}
              >
                <option value="EST">Eastern Time</option>
                <option value="CST">Central Time</option>
                <option value="MST">Mountain Time</option>
                <option value="PST">Pacific Time</option>
              </select>
            </div>

            <AppTextArea
              label="Preferred Schedule *"
              value={application.motivation.availability.preferredSchedule}
              onChange={(e) => updateApplication('motivation', {
                availability: {
                  ...application.motivation.availability,
                  preferredSchedule: e.target.value
                }
              })}
              placeholder="Describe when you're typically available (e.g., weekday evenings, weekend mornings)..."
              required
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-section">
            <h3>References</h3>
            <p>Please provide at least 2 references who can speak to your character and suitability for this role.</p>
            
            {application.references.map((reference, index) => (
              <Card key={index} className="reference-card">
                <div className="reference-header">
                  <h4>Reference {index + 1}</h4>
                  <AppButton
                    variant="danger"
                    size="small"
                    onClick={() => removeReference(index)}
                  >
                    Remove
                  </AppButton>
                </div>
                
                <div className="form-grid">
                  <AppInput
                    label="Name *"
                    value={reference.name}
                    onChange={(e) => updateReference(index, 'name', e.target.value)}
                    required
                  />
                  <AppInput
                    label="Relationship *"
                    value={reference.relationship}
                    onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                    placeholder="e.g., Former supervisor, Professor, Colleague"
                    required
                  />
                  <AppInput
                    label="Email *"
                    type="email"
                    value={reference.email}
                    onChange={(e) => updateReference(index, 'email', e.target.value)}
                    required
                  />
                  <AppInput
                    label="Phone"
                    type="tel"
                    value={reference.phone}
                    onChange={(e) => updateReference(index, 'phone', e.target.value)}
                  />
                </div>
              </Card>
            ))}

            <AppButton
              variant="secondary"
              onClick={addReference}
            >
              Add Reference
            </AppButton>
          </div>
        )}

        {currentStep === 4 && (
          <div className="form-section">
            <h3>Documents</h3>
            <p>Please upload the required documents. All files should be in PDF format.</p>
            
            <div className="document-uploads">
              <div className="upload-section">
                <label>Resume/CV *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('resume', file);
                  }}
                />
                {application.documents.resume && (
                  <p className="file-uploaded">
                    <FileIcon /> {application.documents.resume.name}
                  </p>
                )}
              </div>

              <div className="upload-section">
                <label>Background Check (Optional)</label>
                <p className="upload-note">If you have a recent background check, you can upload it here. Otherwise, we'll guide you through the process after approval.</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('backgroundCheck', file);
                  }}
                />
                {application.documents.backgroundCheck && (
                  <p className="file-uploaded">
                    <FileIcon /> {application.documents.backgroundCheck.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="form-section">
            <h3>Review & Submit</h3>
            <p>Please review your application before submitting. You can go back to make changes if needed.</p>
            
            <div className="application-summary">
              <Card className="summary-section">
                <h4>Personal Information</h4>
                <p><strong>Name:</strong> {application.personalInfo.firstName} {application.personalInfo.lastName}</p>
                <p><strong>Email:</strong> {application.personalInfo.email}</p>
                <p><strong>Phone:</strong> {application.personalInfo.phone}</p>
              </Card>

              <Card className="summary-section">
                <h4>Experience</h4>
                <p><strong>Has Experience:</strong> {application.experience.hasExperience ? 'Yes' : 'No'}</p>
                <p><strong>Specializations:</strong> {application.experience.specializations.join(', ')}</p>
              </Card>

              <Card className="summary-section">
                <h4>Availability</h4>
                <p><strong>Hours per week:</strong> {application.motivation.availability.hoursPerWeek}</p>
                <p><strong>Timezone:</strong> {application.motivation.availability.timezone}</p>
              </Card>

              <Card className="summary-section">
                <h4>References</h4>
                <p>{application.references.length} references provided</p>
              </Card>

              <Card className="summary-section">
                <h4>Documents</h4>
                <p>Resume: {application.documents.resume ? '✓ Uploaded' : '✗ Missing'}</p>
                <p>Background Check: {application.documents.backgroundCheck ? '✓ Uploaded' : 'Not provided'}</p>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="form-navigation">
          <div className="nav-left">
            {currentStep > 0 && (
              <AppButton
                variant="secondary"
                onClick={prevStep}
                disabled={isLoading}
              >
                Previous
              </AppButton>
            )}
          </div>

          <div className="nav-center">
            <AppButton
              variant="secondary"
              onClick={saveDraft}
              disabled={isLoading}
            >
              Save Draft
            </AppButton>
          </div>

          <div className="nav-right">
            {currentStep < steps.length - 1 ? (
              <AppButton
                variant="primary"
                onClick={nextStep}
                disabled={isLoading}
              >
                Next
              </AppButton>
            ) : (
              <AppButton
                variant="primary"
                onClick={submitApplication}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </AppButton>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HelperApplicationView;
