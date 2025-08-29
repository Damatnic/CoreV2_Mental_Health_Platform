import React, { useState, useEffect } from 'react';
import './SafetyPlanBuilder.css';

interface SafetyPlanData {
  warningSignals: string[];
  copingStrategies: string[];
  distractions: string[];
  supportPeople: Array<{ name: string; phone: string; relationship: string }>;
  professionals: Array<{ name: string; phone: string; role: string }>;
  safeEnvironment: string[];
  reasonsToLive: string[];
  emergencyContacts: Array<{ name: string; number: string }>;
  lastUpdated: string;
}

const DEFAULT_PLAN: SafetyPlanData = {
  warningSignals: [],
  copingStrategies: [],
  distractions: [],
  supportPeople: [],
  professionals: [],
  safeEnvironment: [],
  reasonsToLive: [],
  emergencyContacts: [
    { name: '988 Suicide & Crisis Lifeline', number: "988" },
    { name: 'Emergency Services', number: "911" }
  ],
  lastUpdated: new Date().toISOString()
};

interface SafetyPlanBuilderProps {
  onSave?: (plan: SafetyPlanData) => void;
  initialPlan?: SafetyPlanData;
}

export const SafetyPlanBuilder: React.FC<SafetyPlanBuilderProps> = ({
  onSave,
  initialPlan
}) => {
  const [plan, setPlan] = useState<SafetyPlanData>(initialPlan || DEFAULT_PLAN);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditing, setIsEditing] = useState(true);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    // Load saved plan from localStorage
    const savedPlan = localStorage.getItem('safetyPlan');
    if (savedPlan && !initialPlan) {
      try {
        setPlan(JSON.parse(savedPlan));
        setIsEditing(false);
      } catch (error) {
        console.error("Error loading saved plan:", error);
      }
    }
  }, [initialPlan]);

  const steps = [
    {
      title: "Warning Signals",
      key: "warningSignals",
      icon: "⚠️",
      description: "What thoughts, feelings, or behaviors tell you a crisis may be developing?",
      placeholder: "e.g., Feeling hopeless, isolating myself, not sleeping",
      tips: [
        "Be specific about your personal warning signs",
        'Include physical sensations you notice',
        "Think about past crisis situations"
      ]
    },
    {
      title: "Internal Coping Strategies",
      key: "copingStrategies",
      icon: "🧘",
      description: "What can you do on your own to help yourself not act on thoughts of suicide?",
      placeholder: "e.g., Deep breathing, taking a walk, listening to music",
      tips: [
        "List activities that calm or distract you",
        "Include things you can do anywhere",
        'Think of what has worked before'
      ]
    },
    {
      title: "Social Distractions",
      key: 'distractions',
      icon: "🎯",
      description: "What social settings or activities can provide distraction?",
      placeholder: 'e.g., Going to the gym, visiting a coffee shop, calling a friend',
      tips: [
        "Include places that feel safe",
        "List activities that engage your mind",
        "Think of healthy social environments"
      ]
    },
    {
      title: 'Support Network',
      key: 'supportPeople',
      icon: "👥",
      description: 'Who can you reach out to for support?',
      placeholder: "",
      tips: [
        "Include trusted friends and family",
        'Add their contact information',
        "Consider their availability"
      ],
      isComplex: true
    },
    {
      title: "Professional Contacts",
      key: "professionals",
      icon: "🏥",
      description: "What professionals can you contact during a crisis?",
      placeholder: "",
      tips: [
        "Include therapists and doctors",
        'Add crisis hotline numbers',
        "Include after-hours contacts"
      ],
      isComplex: true
    },
    {
      title: "Safe Environment",
      key: "safeEnvironment",
      icon: "🏠",
      description: "How can you make your environment safer?",
      placeholder: "e.g., Remove or secure medications, give weapons to trusted person",
      tips: [
        "Identify potential means of harm",
        "Plan how to remove or secure them",
        'Consider who can help with this'
      ]
    },
    {
      title: "Reasons to Live",
      key: 'reasonsToLive',
      icon: "💖",
      description: "What are your reasons for living? What gives you hope?",
      placeholder: 'e.g., My family, my pets, future goals, helping others',
      tips: [
        "Include people you care about",
        "Think about your values and beliefs",
        "Consider future hopes and dreams",
        "Remember past accomplishments"
      ]
    }
  ];

  const handleSavePlan = () => {
    const updatedPlan = { ...plan, lastUpdated: new Date().toISOString() };
    setPlan(updatedPlan);
    localStorage.setItem("safetyPlan", JSON.stringify(updatedPlan));
    if (onSave) onSave(updatedPlan);
    setIsEditing(false);
  };

  const handleAddItem = (key: string, value: string) => {
    if (!value.trim()) return;

    setPlan(prev => ({
      ...prev,
      [key]: [...(prev[key as keyof SafetyPlanData] as string[]), value]
    }));
  };

  const handleRemoveItem = (key: string, index: number) => {
    setPlan(prev => ({
      ...prev,
      [key]: (prev[key as keyof SafetyPlanData] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleAddContact = (key: 'supportPeople' | "professionals", contact: any) => {
    setPlan(prev => ({
      ...prev,
      [key]: [...prev[key], contact]
    }));
  };

  const handleRemoveContact = (key: "supportPeople" | "professionals", index: number) => {
    setPlan(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const exportPlan = () => {
    const dataStr = JSON.stringify(plan, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `safety-plan-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const printPlan = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  const currentStepData = steps[currentStep];

  if (showPrintView) {
    return <PrintView plan={plan} steps={steps} />;
  }

  if (!isEditing) {
    return (
      <div className='safety-plan-view'>
        <div className="plan-header">
          <h2>Your Safety Plan</h2>
          <p className="last-updated">Last updated: {new Date(plan.lastUpdated).toLocaleDateString()}</p>
          <div className="plan-actions">
            <button className="action-btn edit" onClick={() => setIsEditing(true)}>
              ✏️ Edit Plan
            </button>
            <button className="action-btn export" onClick={exportPlan}>
              💾 Export
            </button>
            <button className="action-btn print" onClick={printPlan}>
              🖨️ Print
            </button>
          </div>
        </div>

        <div className="plan-sections">
          {steps.map((step: any) => {
            const items = plan[step.key as keyof SafetyPlanData];
            if (!items || (Array.isArray(items) && items.length === 0)) return null;

            return (
              <div key={step.key} className='plan-section'>
                <div className="section-header">
                  <span className="section-icon">{step.icon}</span>
                  <h3>{step.title}</h3>
                </div>

                {step.isComplex ? (
                  <div className="contact-list">
                    {(items as Array<{ name: string; phone: string; relationship?: string; role?: string }>).map((item, index) => (
                      <div key={index} className="contact-card">
                        <div className="contact-name">{item.name}</div>
                        <div className="contact-role">{item.relationship || item.role}</div>
                        <a href={`tel:${item.phone}`} className="contact-phone">
                          📞 {item.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className='plan-items'>
                    {(items as string[]).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          <div className="emergency-section">
            <h3>🚨 Emergency Contacts</h3>
            <div className="emergency-contacts">
              {plan.emergencyContacts.map((contact, index) => (
                <a key={index} href={`tel:${contact.number}`} className="emergency-btn">
                  <span className="emergency-name">{contact.name}</span>
                  <span className="emergency-number">{contact.number}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="safety-plan-builder">
      <div className="builder-header">
        <h2>Create Your Safety Plan</h2>
        <p>A safety plan is a personalized, practical plan that can help you avoid a crisis and stay safe.</p>
      </div>

      <div className='progress-indicator'>
        {steps.map((_, index) => (
          <div
            key={index}
            className={`progress-step ${index === currentStep ? "active" : ""} ${index < currentStep ? "completed" : ""}`}
            onClick={() => setCurrentStep(index)}
          />
        ))}
      </div>

      <div className="step-container">
        <div className="step-header">
          <span className="step-icon">{currentStepData.icon}</span>
          <h3>{currentStepData.title}</h3>
        </div>

        <p className='step-description'>{currentStepData.description}</p>

        <div className='tips-box'>
          <h4>Tips:</h4>
          <ul>
            {currentStepData.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>

        {currentStepData.isComplex ? (
          <ComplexInput
            stepKey={currentStepData.key as 'supportPeople' | "professionals"}
            items={plan[currentStepData.key as keyof SafetyPlanData] as unknown[]}
            onAdd={(item) => handleAddContact(currentStepData.key as "supportPeople" | "professionals", item)}
            onRemove={(index) => handleRemoveContact(currentStepData.key as 'supportPeople' | "professionals", index)}
          />
        ) : (
          <SimpleInput
            items={plan[currentStepData.key as keyof SafetyPlanData] as string[]}
            placeholder={currentStepData.placeholder}
            onAdd={(value) => handleAddItem(currentStepData.key, value)}
            onRemove={(index) => handleRemoveItem(currentStepData.key, index)}
          />
        )}

        <div className='navigation'>
          <button className='nav-btn prev'
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            ← Previous
          </button>

          {currentStep === steps.length - 1 ? (
            <button className="nav-btn save" onClick={handleSavePlan}>
              💾 Save Plan
            </button>
          ) : (
            <button className="nav-btn next"
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Input Component
const SimpleInput: React.FC<{
  items: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}> = ({ items, placeholder, onAdd, onRemove }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className='input-section'>
      <div className="input-group">
        <input type='text'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyPress={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className='add-btn' onClick={handleAdd}>Add</button>
      </div>

      <div className="items-list">
        {items.map((item: any, index) => (
          <div key={index} className="item">
            <span>{item}</span>
            <button className="remove-btn" onClick={() => onRemove(index)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Complex Input Component for contacts
const ComplexInput: React.FC<{
  stepKey: 'supportPeople' | "professionals";
  items: unknown[];
  onAdd: (item: unknown) => void;
  onRemove: (index: number) => void;
}> = ({ stepKey, items, onAdd, onRemove }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [extra, setExtra] = useState("");

  const handleAdd = () => {
    if (name.trim() && phone.trim()) {
      const newItem = stepKey === 'supportPeople'
        ? { name, phone, relationship: extra }
        : { name, phone, role: extra };
      onAdd(newItem);
      setName("");
      setPhone("");
      setExtra("");
    }
  };

  return (
    <div className="complex-input-section">
      <div className="complex-input-group">
        <input type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
        />
        <input type='text'
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder={stepKey === "supportPeople" ? "Relationship" : "Role/Title"}
        />
        <button className="add-btn" onClick={handleAdd}>Add</button>
      </div>

      <div className="contacts-grid">
        {items.map((item: any, index) => (
          <div key={index} className="contact-item">
            <div className="contact-info">
              <strong>{item.name}</strong>
              <span>{item.relationship || item.role}</span>
              <span className='phone'>{item.phone}</span>
            </div>
            <button className='remove-btn' onClick={() => onRemove(index)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Print View Component
const PrintView: React.FC<{ plan: SafetyPlanData; steps: any[] }> = ({ plan, steps }) => {
  return (
    <div className="print-view">
      <h1>My Safety Plan</h1>
      <p className="print-date">Date: {new Date(plan.lastUpdated).toLocaleDateString()}</p>

      {steps.map((step: any) => {
        const items = plan[step.key as keyof SafetyPlanData];
        if (!items || (Array.isArray(items) && items.length === 0)) return null;

        return (
          <div key={step.key} className="print-section">
            <h2>{step.icon} {step.title}</h2>
            {step.isComplex ? (
              <div className="print-contacts">
                {(items as Array<{ name: string; phone: string; relationship?: string; role?: string }>).map((item, index) => (
                  <div key={index}>
                    <strong>{item.name}</strong> ({item.relationship || item.role}): {item.phone}
                  </div>
                ))}
              </div>
            ) : (
              <ul>
                {(items as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <div className="print-emergency">
        <h2>🚨 Emergency Contacts</h2>
        {plan.emergencyContacts.map((contact, index) => (
          <div key={index}>
            <strong>{contact.name}:</strong> {contact.number}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafetyPlanBuilder;