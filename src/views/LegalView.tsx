import React from 'react';
import { Card } from '../components/Card';
import { ViewHeader } from '../components/ViewHeader';
import { 
  ScaleIcon, 
  ShieldIcon, 
  UserIcon, 
  FileTextIcon,
  AlertTriangleIcon,
  InfoIcon
} from '../components/icons.dynamic';

export const LegalView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <ViewHeader
          title="Legal Information"
          subtitle="Terms of Service, Privacy Policy, and Helper Agreement"
        />

        <div className="space-y-8">
          {/* Terms of Service */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <ScaleIcon className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h2>
            </div>
            
            <div className="prose dark:prose-invert max-w-none space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Welcome to Peer Support Circle. By accessing or using our service, you agree to be bound by these terms. 
                If you disagree with any part of the terms, then you may not access the service.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Use of Service</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    This service is intended for peer-to-peer support. It is not a substitute for professional medical advice, 
                    diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with 
                    any questions you may have regarding a medical condition.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Conduct</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    You agree not to use the service to post any content that is unlawful, harmful, threatening, abusive, 
                    harassing, defamatory, vulgar, obscene, or otherwise objectionable. You are responsible for your own 
                    communications and for any consequences thereof.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Crisis Situations</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangleIcon className="w-6 h-6 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-red-800 dark:text-red-200 font-medium mb-2">Emergency Notice</p>
                        <p className="text-red-700 dark:text-red-300 text-sm">
                          If you are experiencing a mental health emergency, please contact emergency services immediately 
                          or call the National Suicide Prevention Lifeline at 988.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Privacy Policy */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldIcon className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>
            </div>
            
            <div className="prose dark:prose-invert max-w-none space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Your privacy is critically important to us. This application is designed to be anonymous and protect 
                your personal information.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Anonymous ID</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We assign you a randomly generated identifier (your "User Token") which is stored only on your device. 
                    This token is not linked to any personal information. You can reset this token at any time in the Settings page.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data We Don't Collect</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We do not collect your name, email address, IP address, or any other personally identifiable information 
                    for users seeking support. Your conversations remain anonymous.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data Helpers Provide</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Users who sign up to be "Helpers" will provide an email address for authentication purposes. 
                    This data is kept separate from the anonymous support system and is used only for account management.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data Security</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    All communications are encrypted in transit and at rest. We use industry-standard security measures 
                    to protect your data and maintain the confidentiality of all interactions on our platform.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Helper Agreement */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <UserIcon className="w-8 h-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Helper Agreement</h2>
            </div>
            
            <div className="prose dark:prose-invert max-w-none space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                This agreement applies to users who voluntarily sign up for a "Helper" account to provide peer support.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Role of a Helper</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    As a Helper, you agree to provide supportive and empathetic peer-to-peer communication. You acknowledge 
                    that you are not a licensed therapist or medical professional and will not provide medical advice, 
                    diagnoses, or crisis counseling.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confidentiality</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    You agree to respect the privacy and anonymity of all users. You will not attempt to identify users 
                    or share any information discussed within the platform outside of the platform context.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mandatory Reporting</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    While maintaining privacy is paramount, if you believe a user is in imminent danger of harming 
                    themselves or others, you are required to follow platform protocols for escalating the situation, 
                    which may involve alerting platform moderators or crisis intervention teams.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Training and Certification</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    All Helpers must complete our training program and maintain current certification. This includes 
                    understanding crisis recognition, appropriate boundaries, and escalation procedures.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Code of Conduct</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <InfoIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">Helper Responsibilities</p>
                        <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 list-disc list-inside">
                          <li>Respond with empathy and without judgment</li>
                          <li>Maintain appropriate boundaries</li>
                          <li>Recognize when to escalate situations</li>
                          <li>Respect user anonymity and privacy</li>
                          <li>Follow platform guidelines and policies</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <FileTextIcon className="w-8 h-8 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact & Updates</h2>
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These terms and policies may be updated from time to time. Users will be notified of any significant changes.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200 text-sm">
                  <strong>Last Updated:</strong> January 2024<br />
                  <strong>Questions?</strong> Contact our support team through the platform's help system.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LegalView;
