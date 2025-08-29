import React, { useState, useCallback } from 'react';
import { X, Flag, AlertTriangle, Shield, MessageSquare, User, ChevronDown } from 'lucide-react';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: ReportData) => void;
  reportType: 'user' | 'content' | 'behavior' | 'technical';
  targetId: string;
  targetType: 'message' | 'user' | 'post' | 'comment';
  targetPreview?: string;
  className?: string;
}

interface ReportData {
  category: string;
  subcategory: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  evidence?: string[];
  anonymous: boolean;
}

const REPORT_CATEGORIES = {
  user: {
    label: 'User Behavior',
    icon: User,
    subcategories: [
      'Harassment or bullying',
      'Inappropriate behavior',
      'Spam or fake account',
      'Violation of community guidelines',
      'Threatening behavior',
      'Discrimination'
    ]
  },
  content: {
    label: 'Inappropriate Content',
    icon: MessageSquare,
    subcategories: [
      'Harmful or dangerous content',
      'Inappropriate sharing',
      'Copyright violation',
      'Misinformation',
      'Graphic or disturbing content',
      'Off-topic content'
    ]
  },
  behavior: {
    label: 'Safety Concerns',
    icon: Shield,
    subcategories: [
      'Self-harm content',
      'Crisis situation',
      'Substance abuse',
      'Eating disorder content',
      'Dangerous advice',
      'Triggering content'
    ]
  },
  technical: {
    label: 'Technical Issues',
    icon: AlertTriangle,
    subcategories: [
      'App malfunction',
      'Security vulnerability',
      'Privacy concern',
      'Bug report',
      'Performance issue',
      'Feature request'
    ]
  }
};

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reportType,
  targetId,
  targetType,
  targetPreview,
  className = ''
}) => {
  const [formData, setFormData] = useState<ReportData>({
    category: reportType,
    subcategory: '',
    description: '',
    severity: 'medium',
    evidence: [],
    anonymous: false
  });
  
  const [step, setStep] = useState<'category' | 'details' | 'review'>('category');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryInfo = REPORT_CATEGORIES[reportType];

  const handleInputChange = useCallback((field: keyof ReportData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subcategory) {
      newErrors.subcategory = 'Please select a specific reason';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a description';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'category' && formData.subcategory) {
      setStep('details');
    } else if (step === 'details' && validateForm()) {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('category');
    } else if (step === 'review') {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      
      // Reset form
      setFormData({
        category: reportType,
        subcategory: '',
        description: '',
        severity: 'medium',
        evidence: [],
        anonymous: false
      });
      setStep('category');
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: ReportData['severity']) => {
    switch (severity) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderTargetPreview = () => {
    if (!targetPreview) return null;

    return (
      <div className="mb-6 p-3 bg-gray-50 rounded-lg border">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Reporting {targetType}: {targetId}
        </h4>
        <div className="text-sm text-gray-600 line-clamp-3">
          {targetPreview}
        </div>
      </div>
    );
  };

  const renderCategoryStep = () => {
    const IconComponent = categoryInfo.icon;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <IconComponent className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Report {categoryInfo.label}
          </h3>
          <p className="text-gray-600">
            Please select the specific issue you'd like to report
          </p>
        </div>

        {renderTargetPreview()}

        <div className="space-y-3">
          {categoryInfo.subcategories.map((subcategory) => (
            <label
              key={subcategory}
              className={`
                block p-4 border rounded-lg cursor-pointer transition-colors
                ${formData.subcategory === subcategory 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="subcategory"
                value={subcategory}
                checked={formData.subcategory === subcategory}
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-900">
                {subcategory}
              </span>
            </label>
          ))}
        </div>

        {errors.subcategory && (
          <p className="text-sm text-red-600">{errors.subcategory}</p>
        )}
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Report Details
        </h3>
        <p className="text-gray-600">
          Please provide additional information about this issue
        </p>
      </div>

      {renderTargetPreview()}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Flag className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">
              {formData.subcategory}
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              You selected this as the primary issue
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Please describe what happened and why you're reporting this..."
          rows={4}
          className={`
            w-full px-3 py-2 border rounded-md text-sm
            ${errors.description ? 'border-red-500' : 'border-gray-300'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          `}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {formData.description.length}/1000 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity Level
        </label>
        <div className="relative">
          <select
            value={formData.severity}
            onChange={(e) => handleInputChange('severity', e.target.value as ReportData['severity'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
          >
            <option value="low">Low - Minor issue</option>
            <option value="medium">Medium - Concerning issue</option>
            <option value="high">High - Serious issue</option>
            <option value="urgent">Urgent - Immediate attention needed</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="anonymous"
          type="checkbox"
          checked={formData.anonymous}
          onChange={(e) => handleInputChange('anonymous', e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
          Submit this report anonymously
        </label>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Review Your Report
        </h3>
        <p className="text-gray-600">
          Please review the information before submitting
        </p>
      </div>

      {renderTargetPreview()}

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Category</h4>
              <p className="text-sm text-gray-600">{categoryInfo.label}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Issue Type</h4>
              <p className="text-sm text-gray-600">{formData.subcategory}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
          <div className="bg-white border rounded-lg p-3">
            <p className="text-sm text-gray-700">{formData.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Severity</h4>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(formData.severity)}`}>
              {formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
            </span>
          </div>
          
          {formData.anonymous && (
            <div className="text-sm text-gray-600">
              ✓ Anonymous submission
            </div>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-medium text-yellow-900 mb-1">
              Important Information
            </h4>
            <ul className="text-yellow-700 space-y-1">
              <li>• Reports are reviewed by our moderation team within 24 hours</li>
              <li>• False reports may result in account restrictions</li>
              <li>• For immediate safety concerns, contact emergency services</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Submit Report
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-2 h-2 rounded-full ${
                    (step === 'category' && stepNum === 1) ||
                    (step === 'details' && stepNum === 2) ||
                    (step === 'review' && stepNum === 3)
                      ? 'bg-blue-600'
                      : stepNum < 
                        (['category', 'details', 'review'].indexOf(step) + 1)
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-2">
                Step {['category', 'details', 'review'].indexOf(step) + 1} of 3
              </span>
            </div>
          </div>
          
          <AppButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X className="w-5 h-5" />}
            aria-label="Close modal"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'category' && renderCategoryStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'review' && renderReviewStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            {step !== 'category' && (
              <AppButton
                variant="ghost"
                onClick={handleBack}
              >
                Back
              </AppButton>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <AppButton
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </AppButton>
            
            {step === 'review' ? (
              <AppButton
                variant="danger"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Submit Report
              </AppButton>
            ) : (
              <AppButton
                variant="primary"
                onClick={handleNext}
                disabled={
                  (step === 'category' && !formData.subcategory) ||
                  (step === 'details' && (!formData.description.trim() || formData.description.trim().length < 10))
                }
              >
                {step === 'category' ? 'Continue' : 'Review'}
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;

