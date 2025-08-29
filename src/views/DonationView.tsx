import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { HeartIcon, CreditCardIcon, GiftIcon, CheckIcon, StarIcon } from '../components/icons.dynamic';

interface DonationAmount {
  value: number;
  label: string;
  description: string;
  impact: string;
}

interface DonationHistory {
  id: string;
  amount: number;
  date: Date;
  type: 'one-time' | 'monthly';
  status: 'completed' | 'pending' | 'failed';
  dedicatedTo?: string;
  isAnonymous: boolean;
}

interface DonationStats {
  totalDonated: number;
  donationCount: number;
  monthlyContribution: number;
  impactPoints: number;
  rank: string;
  nextMilestone: {
    amount: number;
    reward: string;
  };
}

const DonationView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>('one-time');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dedicatedTo, setDedicatedTo] = useState('');
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const predefinedAmounts: DonationAmount[] = [
    {
      value: 10,
      label: '$10',
      description: 'Supporter',
      impact: 'Helps cover platform hosting for 1 day'
    },
    {
      value: 25,
      label: '$25',
      description: 'Advocate',
      impact: 'Supports one crisis intervention session'
    },
    {
      value: 50,
      label: '$50',
      description: 'Champion',
      impact: 'Funds mental health resources for 10 users'
    },
    {
      value: 100,
      label: '$100',
      description: 'Hero',
      impact: 'Enables helper training and certification'
    },
    {
      value: 250,
      label: '$250',
      description: 'Guardian',
      impact: 'Supports community outreach programs'
    },
    {
      value: 500,
      label: '$500',
      description: 'Angel',
      impact: 'Funds research and platform improvements'
    }
  ];

  useEffect(() => {
    loadDonationHistory();
    loadDonationStats();
  }, [user]);

  const loadDonationHistory = async () => {
    if (!user) return;
    
    try {
      // Mock donation history
      const mockHistory: DonationHistory[] = [
        {
          id: '1',
          amount: 50,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          type: 'one-time',
          status: 'completed',
          dedicatedTo: 'In memory of John Doe',
          isAnonymous: false
        },
        {
          id: '2',
          amount: 25,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          type: 'monthly',
          status: 'completed',
          isAnonymous: true
        },
        {
          id: '3',
          amount: 100,
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          type: 'one-time',
          status: 'completed',
          isAnonymous: false
        }
      ];

      setDonationHistory(mockHistory);
    } catch (error) {
      console.error('Error loading donation history:', error);
    }
  };

  const loadDonationStats = async () => {
    if (!user) return;
    
    try {
      // Mock stats
      const mockStats: DonationStats = {
        totalDonated: 175,
        donationCount: 3,
        monthlyContribution: 25,
        impactPoints: 875,
        rank: 'Champion',
        nextMilestone: {
          amount: 250,
          reward: 'Guardian Badge'
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getFinalAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseFloat(customAmount);
    return 0;
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const processDonation = async () => {
    const amount = getFinalAmount();
    
    if (amount < 1) {
      showNotification('Please select or enter a donation amount', 'warning');
      return;
    }

    if (amount > 10000) {
      showNotification('Maximum donation amount is $10,000. Please contact us for larger donations.', 'warning');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create new donation record
      const newDonation: DonationHistory = {
        id: Date.now().toString(),
        amount,
        date: new Date(),
        type: donationType,
        status: 'completed',
        dedicatedTo: dedicatedTo || undefined,
        isAnonymous
      };

      // Update history and stats
      setDonationHistory(prev => [newDonation, ...prev]);
      
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          totalDonated: prev.totalDonated + amount,
          donationCount: prev.donationCount + 1,
          monthlyContribution: donationType === 'monthly' ? amount : prev.monthlyContribution,
          impactPoints: prev.impactPoints + (amount * 5)
        } : null);
      }

      // Reset form
      setSelectedAmount(null);
      setCustomAmount('');
      setDedicatedTo('');
      setShowThankYou(true);
      
      showNotification(`Thank you for your ${donationType} donation of $${amount}!`, 'success');
      
      // Hide thank you message after 5 seconds
      setTimeout(() => setShowThankYou(false), 5000);
      
    } catch (error) {
      console.error('Error processing donation:', error);
      showNotification('Failed to process donation. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelMonthlyDonation = async () => {
    if (!confirm('Are you sure you want to cancel your monthly donation?')) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (stats) {
        setStats(prev => prev ? { ...prev, monthlyContribution: 0 } : null);
      }
      
      showNotification('Monthly donation cancelled', 'success');
    } catch (error) {
      console.error('Error cancelling donation:', error);
      showNotification('Failed to cancel monthly donation', 'error');
    }
  };

  const getImpactDescription = (amount: number): string => {
    if (amount >= 500) return 'Your donation will fund research and major platform improvements';
    if (amount >= 250) return 'Your donation will support community outreach programs';
    if (amount >= 100) return 'Your donation will enable helper training and certification';
    if (amount >= 50) return 'Your donation will fund mental health resources for multiple users';
    if (amount >= 25) return 'Your donation will support crisis intervention sessions';
    if (amount >= 10) return 'Your donation will help cover platform hosting costs';
    return 'Every donation helps us support mental health in our community';
  };

  const getRankBadge = (rank: string) => {
    const rankColors = {
      'Supporter': 'bg-gray-500',
      'Advocate': 'bg-green-500',
      'Champion': 'bg-blue-500',
      'Hero': 'bg-purple-500',
      'Guardian': 'bg-orange-500',
      'Angel': 'bg-gold-500'
    };
    
    return (
      <span className={`rank-badge ${rankColors[rank as keyof typeof rankColors] || 'bg-gray-500'}`}>
        <StarIcon /> {rank}
      </span>
    );
  };

  return (
    <div className="donation-view">
      <ViewHeader
        title="Support Our Mission"
        subtitle="Help us provide mental health support to those who need it most"
      />

      {showThankYou && (
        <Card className="thank-you-banner">
          <div className="thank-you-content">
            <CheckIcon className="thank-you-icon" />
            <h3>Thank You for Your Generosity!</h3>
            <p>Your donation makes a real difference in people's lives.</p>
          </div>
        </Card>
      )}

      {/* User Stats */}
      {stats && (
        <Card className="donation-stats">
          <div className="stats-header">
            <h3>Your Impact</h3>
            {getRankBadge(stats.rank)}
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">${stats.totalDonated}</div>
              <div className="stat-label">Total Donated</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.donationCount}</div>
              <div className="stat-label">Donations Made</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.impactPoints}</div>
              <div className="stat-label">Impact Points</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">${stats.monthlyContribution}</div>
              <div className="stat-label">Monthly Support</div>
            </div>
          </div>

          {stats.nextMilestone && (
            <div className="milestone-progress">
              <div className="milestone-info">
                <span>Next milestone: ${stats.nextMilestone.amount} ({stats.nextMilestone.reward})</span>
                <span>{Math.round((stats.totalDonated / stats.nextMilestone.amount) * 100)}% complete</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min((stats.totalDonated / stats.nextMilestone.amount) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Donation Form */}
      <Card className="donation-form">
        <h3>Make a Donation</h3>
        
        {/* Donation Type */}
        <div className="donation-type-selector">
          <button
            className={`type-button ${donationType === 'one-time' ? 'active' : ''}`}
            onClick={() => setDonationType('one-time')}
          >
            <GiftIcon /> One-time
          </button>
          <button
            className={`type-button ${donationType === 'monthly' ? 'active' : ''}`}
            onClick={() => setDonationType('monthly')}
          >
            <HeartIcon /> Monthly
          </button>
        </div>

        {/* Amount Selection */}
        <div className="amount-selection">
          <h4>Select Amount</h4>
          <div className="amount-grid">
            {predefinedAmounts.map(amount => (
              <button
                key={amount.value}
                className={`amount-card ${selectedAmount === amount.value ? 'selected' : ''}`}
                onClick={() => handleAmountSelect(amount.value)}
              >
                <div className="amount-value">{amount.label}</div>
                <div className="amount-description">{amount.description}</div>
                <div className="amount-impact">{amount.impact}</div>
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <AppInput
              label="Custom Amount"
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="Enter custom amount"
              min="1"
              max="10000"
            />
          </div>
        </div>

        {/* Impact Preview */}
        {getFinalAmount() > 0 && (
          <div className="impact-preview">
            <h4>Your Impact</h4>
            <p>{getImpactDescription(getFinalAmount())}</p>
            <div className="impact-calculation">
              <span>Impact Points: +{getFinalAmount() * 5}</span>
            </div>
          </div>
        )}

        {/* Additional Options */}
        <div className="donation-options">
          <div className="option-group">
            <AppInput
              label="Dedicate this donation (optional)"
              value={dedicatedTo}
              onChange={(e) => setDedicatedTo(e.target.value)}
              placeholder="In memory of... / In honor of..."
            />
          </div>

          <div className="option-group">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Make this donation anonymous
            </label>
          </div>
        </div>

        {/* Payment Section */}
        <div className="payment-section">
          <h4>Payment Information</h4>
          <p className="payment-note">
            <CreditCardIcon /> Secure payment processing powered by Stripe
          </p>
          
          <div className="payment-methods">
            <div className="method-icons">
              💳 💳 💳 💳
            </div>
            <p>We accept all major credit cards and PayPal</p>
          </div>
        </div>

        {/* Submit Button */}
        <AppButton
          variant="primary"
          size="large"
          onClick={processDonation}
          disabled={isProcessing || getFinalAmount() === 0}
          className="donation-submit"
        >
          {isProcessing ? (
            'Processing...'
          ) : (
            `Donate $${getFinalAmount()} ${donationType === 'monthly' ? 'Monthly' : 'Now'}`
          )}
        </AppButton>

        <p className="donation-disclaimer">
          Your donation is secure and helps us maintain and improve our mental health platform. 
          All donations are tax-deductible. You will receive a receipt via email.
        </p>
      </Card>

      {/* Monthly Donation Management */}
      {stats && stats.monthlyContribution > 0 && (
        <Card className="monthly-donation-card">
          <h3>Monthly Donation</h3>
          <div className="monthly-info">
            <p>You're currently contributing <strong>${stats.monthlyContribution}/month</strong></p>
            <p>Next payment: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          </div>
          <div className="monthly-actions">
            <AppButton variant="secondary" size="small">
              Update Amount
            </AppButton>
            <AppButton 
              variant="danger" 
              size="small"
              onClick={cancelMonthlyDonation}
            >
              Cancel Monthly
            </AppButton>
          </div>
        </Card>
      )}

      {/* Donation History */}
      <Card className="donation-history">
        <h3>Donation History</h3>
        
        {donationHistory.length === 0 ? (
          <p className="no-history">No donation history yet</p>
        ) : (
          <div className="history-list">
            {donationHistory.map(donation => (
              <div key={donation.id} className="history-item">
                <div className="donation-info">
                  <div className="donation-amount">${donation.amount}</div>
                  <div className="donation-details">
                    <span className="donation-date">
                      {donation.date.toLocaleDateString()}
                    </span>
                    <span className={`donation-type ${donation.type}`}>
                      {donation.type === 'monthly' ? 'Monthly' : 'One-time'}
                    </span>
                    <span className={`donation-status ${donation.status}`}>
                      {donation.status}
                    </span>
                  </div>
                  {donation.dedicatedTo && (
                    <div className="donation-dedication">
                      Dedicated: {donation.dedicatedTo}
                    </div>
                  )}
                  {donation.isAnonymous && (
                    <div className="donation-anonymous">Anonymous</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Impact Information */}
      <Card className="impact-info">
        <h3>How Your Donations Help</h3>
        <div className="impact-breakdown">
          <div className="impact-item">
            <div className="impact-icon">🏥</div>
            <div className="impact-content">
              <h4>Crisis Support</h4>
              <p>Fund 24/7 crisis intervention and emergency mental health support</p>
            </div>
          </div>
          <div className="impact-item">
            <div className="impact-icon">👥</div>
            <div className="impact-content">
              <h4>Helper Training</h4>
              <p>Train and certify peer supporters to provide quality mental health assistance</p>
            </div>
          </div>
          <div className="impact-item">
            <div className="impact-icon">📚</div>
            <div className="impact-content">
              <h4>Resources & Tools</h4>
              <p>Develop mental health resources, assessments, and therapeutic tools</p>
            </div>
          </div>
          <div className="impact-item">
            <div className="impact-icon">🔬</div>
            <div className="impact-content">
              <h4>Research & Innovation</h4>
              <p>Support research into new approaches for mental health support</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DonationView;
