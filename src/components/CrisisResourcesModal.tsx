import React from 'react';
import { X, Phone, MessageCircle, Heart, Shield, Globe } from 'lucide-react';
import '../styles/CrisisResourcesModal.css';

interface CrisisResource {
  id: string;
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'website';
  contact: string;
  description: string;
  available: string;
  icon: React.ReactNode;
}

interface CrisisResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CrisisResourcesModal: React.FC<CrisisResourcesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const resources: CrisisResource[] = [
    {
      id: '1',
      name: '988 Suicide & Crisis Lifeline',
      type: 'hotline',
      contact: '988',
      description: 'Free, confidential crisis support',
      available: '24/7',
      icon: <Phone size={20} />
    },
    {
      id: '2',
      name: 'Crisis Text Line',
      type: 'text',
      contact: '741741',
      description: 'Text HOME for support',
      available: '24/7',
      icon: <MessageCircle size={20} />
    },
    {
      id: '3',
      name: 'Veterans Crisis Line',
      type: 'hotline',
      contact: '1-800-273-8255',
      description: 'Support for veterans and their families',
      available: '24/7',
      icon: <Shield size={20} />
    },
    {
      id: '4',
      name: 'SAMHSA National Helpline',
      type: 'hotline',
      contact: '1-800-662-4357',
      description: 'Treatment referral and information',
      available: '24/7',
      icon: <Heart size={20} />
    },
    {
      id: '5',
      name: 'Trevor Project',
      type: 'hotline',
      contact: '1-866-488-7386',
      description: 'LGBTQ+ youth crisis support',
      available: '24/7',
      icon: <Phone size={20} />
    },
    {
      id: '6',
      name: 'RAINN Hotline',
      type: 'hotline',
      contact: '1-800-656-4673',
      description: 'Sexual assault support',
      available: '24/7',
      icon: <Phone size={20} />
    }
  ];

  const handleResourceClick = (resource: CrisisResource) => {
    switch (resource.type) {
      case 'hotline':
        window.location.href = `tel:${resource.contact.replace(/[^0-9]/g, '')}`;
        break;
      case 'text':
        window.location.href = `sms:${resource.contact}`;
        break;
      case 'website':
        window.open(resource.contact, '_blank');
        break;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="crisis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crisis Resources</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-alert">
          <Shield size={20} />
          <p>If you are in immediate danger, please call 911</p>
        </div>

        <div className="resources-list">
          {resources.map(resource => (
            <button
              key={resource.id}
              className="resource-item"
              onClick={() => handleResourceClick(resource)}
            >
              <div className="resource-icon">{resource.icon}</div>
              <div className="resource-details">
                <h3>{resource.name}</h3>
                <p>{resource.description}</p>
                <div className="resource-meta">
                  <span className="contact">{resource.contact}</span>
                  <span className="availability">{resource.available}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="international-section">
          <h3>International Resources</h3>
          <a 
            href="https://findahelpline.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="international-link"
          >
            <Globe size={20} />
            Find helplines in your country
          </a>
        </div>

        <div className="modal-footer">
          <p>You are not alone. Help is always available.</p>
        </div>
      </div>
    </div>
  );
};

export default CrisisResourcesModal;
