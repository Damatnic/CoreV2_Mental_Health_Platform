import React, { useState } from 'react';
import { Shield, AlertTriangle, Heart, Phone, Plus, X } from 'lucide-react';
import '../../styles/SafetyPlanBuilder.css';

interface SafetyPlan {
  warningSignals: string[];
  copingStrategies: string[];
  distractions: string[];
  supportPeople: { name: string; phone: string }[];
  professionals: { name: string; phone: string; role: string }[];
  safeEnvironment: string[];
  reasonsToLive: string[];
}

const SafetyPlanBuilder: React.FC = () => {
  const [plan, setPlan] = useState<SafetyPlan>({
    warningSignals: [],
    copingStrategies: [],
    distractions: [],
    supportPeople: [],
    professionals: [],
    safeEnvironment: [],
    reasonsToLive: []
  });

  const [activeSection, setActiveSection] = useState<keyof SafetyPlan>('warningSignals');
  const [inputValue, setInputValue] = useState('');

  const sections = [
    { key: 'warningSignals', title: 'Warning Signals', icon: <AlertTriangle size={20} />, prompt: 'What thoughts, feelings, or behaviors indicate a crisis may be developing?' },
    { key: 'copingStrategies', title: 'Internal Coping Strategies', icon: <Heart size={20} />, prompt: 'What can I do to cope without contacting another person?' },
    { key: 'distractions', title: 'Healthy Distractions', icon: <Shield size={20} />, prompt: 'What activities or places can help distract me?' },
    { key: 'reasonsToLive', title: 'Reasons for Living', icon: <Heart size={20} />, prompt: 'What are my reasons for living and hope?' }
  ];

  const handleAddItem = () => {
    if (inputValue.trim()) {
      setPlan(prev => ({
        ...prev,
        [activeSection]: [...(prev[activeSection] as string[]), inputValue]
      }));
      setInputValue('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setPlan(prev => ({
      ...prev,
      [activeSection]: (prev[activeSection] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleAddContact = (type: 'supportPeople' | 'professionals') => {
    const name = prompt('Name:');
    const phone = prompt('Phone number:');
    const role = type === 'professionals' ? prompt('Role (e.g., Therapist, Psychiatrist):') : undefined;
    
    if (name && phone) {
      const contact = role ? { name, phone, role } : { name, phone };
      setPlan(prev => ({
        ...prev,
        [type]: [...prev[type], contact as any]
      }));
    }
  };

  const handleSavePlan = () => {
    localStorage.setItem('safety-plan', JSON.stringify(plan));
    alert('Safety plan saved successfully!');
  };

  return (
    <div className="safety-plan-builder">
      <div className="builder-header">
        <Shield size={24} />
        <div>
          <h2>Build Your Safety Plan</h2>
          <p>Create a personalized plan for times of crisis</p>
        </div>
      </div>

      <div className="builder-tabs">
        {sections.map(section => (
          <button
            key={section.key}
            className={activeSection === section.key ? 'active' : ''}
            onClick={() => setActiveSection(section.key as keyof SafetyPlan)}
          >
            {section.icon}
            {section.title}
          </button>
        ))}
      </div>

      <div className="builder-content">
        <div className="section-prompt">
          {sections.find(s => s.key === activeSection)?.prompt}
        </div>

        <div className="input-group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder="Type here and press Enter..."
            className="item-input"
          />
          <button onClick={handleAddItem} className="add-btn">
            <Plus size={20} />
          </button>
        </div>

        <div className="items-list">
          {(plan[activeSection] as string[]).map((item, index) => (
            <div key={index} className="plan-item">
              <span>{item}</span>
              <button onClick={() => handleRemoveItem(index)} className="remove-btn">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="contacts-section">
        <h3>Emergency Contacts</h3>
        
        <div className="contact-category">
          <h4>Support People</h4>
          <button onClick={() => handleAddContact('supportPeople')} className="add-contact-btn">
            <Plus size={16} /> Add Contact
          </button>
          {plan.supportPeople.map((person, index) => (
            <div key={index} className="contact-item">
              <span>{person.name}</span>
              <a href={`tel:${person.phone}`}>{person.phone}</a>
            </div>
          ))}
        </div>

        <div className="contact-category">
          <h4>Professionals</h4>
          <button onClick={() => handleAddContact('professionals')} className="add-contact-btn">
            <Plus size={16} /> Add Professional
          </button>
          {plan.professionals.map((prof, index) => (
            <div key={index} className="contact-item">
              <span>{prof.name} ({prof.role})</span>
              <a href={`tel:${prof.phone}`}>{prof.phone}</a>
            </div>
          ))}
        </div>

        <div className="crisis-lines">
          <h4>Crisis Hotlines</h4>
          <div className="hotline-item">
            <span>988 Suicide & Crisis Lifeline</span>
            <a href="tel:988">
              <Phone size={16} /> 988
            </a>
          </div>
        </div>
      </div>

      <button className="save-plan-btn" onClick={handleSavePlan}>
        Save Safety Plan
      </button>
    </div>
  );
};

export default SafetyPlanBuilder;
