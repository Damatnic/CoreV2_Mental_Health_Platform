import React, { useState } from 'react';
import { Palette, Type, Layout } from 'lucide-react';
import '../styles/DesignSystemShowcase.css';

const DesignSystemShowcase: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'components'>('colors');

  const colors = [
    { name: 'Primary', value: '#007bff', usage: 'Main actions and links' },
    { name: 'Success', value: '#28a745', usage: 'Positive feedback' },
    { name: 'Warning', value: '#ffc107', usage: 'Caution messages' },
    { name: 'Danger', value: '#dc3545', usage: 'Errors and critical actions' },
    { name: 'Dark', value: '#343a40', usage: 'Text and borders' },
    { name: 'Light', value: '#f8f9fa', usage: 'Backgrounds' }
  ];

  const typography = [
    { name: 'Heading 1', class: 'h1', sample: 'Main Page Title' },
    { name: 'Heading 2', class: 'h2', sample: 'Section Header' },
    { name: 'Heading 3', class: 'h3', sample: 'Subsection' },
    { name: 'Body', class: 'body', sample: 'Regular paragraph text' },
    { name: 'Small', class: 'small', sample: 'Helper text and captions' }
  ];

  const components = [
    { name: 'Button Primary', type: 'button-primary' },
    { name: 'Button Secondary', type: 'button-secondary' },
    { name: 'Card', type: 'card' },
    { name: 'Input Field', type: 'input' },
    { name: 'Toggle Switch', type: 'toggle' }
  ];

  return (
    <div className="design-system-showcase">
      <div className="showcase-header">
        <Palette size={24} />
        <h2>Design System</h2>
      </div>

      <div className="showcase-tabs">
        <button
          className={activeSection === 'colors' ? 'active' : ''}
          onClick={() => setActiveSection('colors')}
        >
          <Palette size={18} /> Colors
        </button>
        <button
          className={activeSection === 'typography' ? 'active' : ''}
          onClick={() => setActiveSection('typography')}
        >
          <Type size={18} /> Typography
        </button>
        <button
          className={activeSection === 'components' ? 'active' : ''}
          onClick={() => setActiveSection('components')}
        >
          <Layout size={18} /> Components
        </button>
      </div>

      <div className="showcase-content">
        {activeSection === 'colors' && (
          <div className="colors-grid">
            {colors.map(color => (
              <div key={color.name} className="color-card">
                <div 
                  className="color-swatch" 
                  style={{ backgroundColor: color.value }}
                />
                <h4>{color.name}</h4>
                <code>{color.value}</code>
                <p>{color.usage}</p>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'typography' && (
          <div className="typography-list">
            {typography.map(type => (
              <div key={type.name} className="type-sample">
                <label>{type.name}</label>
                <div className={type.class}>{type.sample}</div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'components' && (
          <div className="components-grid">
            {components.map(comp => (
              <div key={comp.name} className="component-demo">
                <h4>{comp.name}</h4>
                {comp.type === 'button-primary' && (
                  <button className="btn btn-primary">Primary Action</button>
                )}
                {comp.type === 'button-secondary' && (
                  <button className="btn btn-secondary">Secondary</button>
                )}
                {comp.type === 'card' && (
                  <div className="demo-card">
                    <h5>Card Title</h5>
                    <p>Card content goes here</p>
                  </div>
                )}
                {comp.type === 'input' && (
                  <input type="text" placeholder="Enter text..." className="demo-input" />
                )}
                {comp.type === 'toggle' && (
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignSystemShowcase;
