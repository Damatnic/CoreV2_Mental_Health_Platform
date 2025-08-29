import * as React from 'react';
const { useState } = React;
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import LoadingSpinner from '../components/LoadingSpinner';

export const UIShowcaseView: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('components');

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const buttonVariants = ['primary', 'secondary', 'danger', 'success'];
  const buttonSizes = ['small', 'medium', 'large'];

  return React.createElement(
    'div',
    { className: 'ui-showcase' },
    React.createElement(
      'div',
      { className: 'showcase-header' },
      React.createElement('h1', null, 'UI Component Showcase'),
      React.createElement('p', null, 'Explore and test all available UI components')
    ),
    React.createElement(
      'div',
      { className: 'showcase-tabs' },
      React.createElement(
        'button',
        {
          className: `tab ${activeTab === 'components' ? 'active' : ''}`,
          onClick: () => setActiveTab('components')
        },
        'Components'
      ),
      React.createElement(
        'button',
        {
          className: `tab ${activeTab === 'forms' ? 'active' : ''}`,
          onClick: () => setActiveTab('forms')
        },
        'Forms'
      )
    ),
    React.createElement(
      'div',
      { className: 'showcase-content' },
      activeTab === 'components' && React.createElement(
        'div',
        { className: 'components-showcase' },
        React.createElement(Card, {
          title: 'Buttons',
          className: 'showcase-section',
          children: [
            React.createElement(
              'div',
              { className: 'component-group', key: 'variants' },
              React.createElement('h3', null, 'Button Variants'),
              React.createElement(
                'div',
                { className: 'button-grid' },
                buttonVariants.map(variant =>
                  React.createElement(AppButton, {
                    key: variant,
                    variant: variant as any,
                    onClick: () => console.log(`Clicked ${variant}`),
                    children: variant.charAt(0).toUpperCase() + variant.slice(1)
                  })
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'component-group', key: 'sizes' },
              React.createElement('h3', null, 'Button Sizes'),
              React.createElement(
                'div',
                { className: 'button-grid' },
                buttonSizes.map(size =>
                  React.createElement(AppButton, {
                    key: size,
                    size: size as any,
                    children: size.charAt(0).toUpperCase() + size.slice(1)
                  })
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'component-group', key: 'states' },
              React.createElement('h3', null, 'Button States'),
              React.createElement(
                'div',
                { className: 'button-grid' },
                React.createElement(AppButton, {
                  disabled: true,
                  children: 'Disabled'
                }),
                React.createElement(AppButton, {
                  loading: true,
                  children: 'Loading'
                }),
                React.createElement(AppButton, {
                  onClick: handleLoadingDemo,
                  children: 'Trigger Loading Demo'
                })
              )
            )
          ]
        }),
        React.createElement(Card, {
          title: 'Loading States',
          className: 'showcase-section',
          children: React.createElement(
            'div',
            { className: 'loading-examples' },
            isLoading ? React.createElement(
              'div',
              { className: 'loading-demo' },
              React.createElement(LoadingSpinner),
              React.createElement('p', null, 'Loading demo active...')
            ) : React.createElement(
              'p',
              null,
              'Click "Trigger Loading Demo" to see the loading spinner.'
            )
          )
        })
      ),
      activeTab === 'forms' && React.createElement(
        'div',
        { className: 'forms-showcase' },
        React.createElement(Card, {
          title: 'Form Components',
          className: 'showcase-section',
          children: React.createElement(
            'div',
            { className: 'form-examples' },
            React.createElement(
              'div',
              { className: 'input-group' },
              React.createElement('h3', null, 'Text Inputs'),
              React.createElement(AppInput, {
                label: 'Basic Input',
                value: inputValue,
                onChange: (e: any) => setInputValue(e.target.value),
                placeholder: 'Enter some text...'
              }),
              React.createElement(AppInput, {
                label: 'Email Input',
                type: 'email',
                placeholder: 'user@example.com'
              }),
              React.createElement(AppInput, {
                label: 'Disabled Input',
                disabled: true,
                value: 'This input is disabled'
              }),
              React.createElement(AppInput, {
                label: 'Input with Error',
                error: 'This field is required',
                placeholder: 'Required field'
              })
            ),
            React.createElement(
              'div',
              { className: 'form-actions' },
              React.createElement(AppButton, {
                variant: 'secondary',
                children: 'Reset Form'
              }),
              React.createElement(AppButton, {
                children: 'Submit Form'
              })
            )
          )
        })
      )
    ),
    React.createElement(
      'div',
      { className: 'showcase-footer' },
      React.createElement(
        'p',
        null,
        'This showcase demonstrates the available UI components and their various states.'
      )
    )
  );
};

export default UIShowcaseView;
