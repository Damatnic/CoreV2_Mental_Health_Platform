import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  onClick,
  variant = 'default'
}) => (
  <div 
    className={`card card-${variant}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {title && <h3 className="card-title">{title}</h3>}
    {subtitle && <p className="card-subtitle">{subtitle}</p>}
    {children && <div className="card-content">{children}</div>}
  </div>
);

describe('Card Component', () => {
  it('should render with title', () => {
    render(<Card title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('should render with subtitle', () => {
    render(<Card subtitle="Test Subtitle" />);
    expect(screen.getByText('Test Subtitle')).toBeTruthy();
  });

  it('should render children', () => {
    render(
      <Card>
        <span>Card Content</span>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeTruthy();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Card title="Clickable" onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('should apply variant classes', () => {
    const { container } = render(<Card variant="elevated" />);
    expect(container.querySelector('.card-elevated')).toBeTruthy();
  });

  it('should be keyboard accessible when clickable', () => {
    const handleClick = jest.fn();
    render(<Card title="Keyboard" onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    expect(card.tabIndex).toBe(0);
  });

  it('should render all props together', () => {
    render(
      <Card 
        title="Full Card"
        subtitle="With all props"
        variant="outlined"
      >
        <p>Extra content</p>
      </Card>
    );
    
    expect(screen.getByText('Full Card')).toBeTruthy();
    expect(screen.getByText('With all props')).toBeTruthy();
    expect(screen.getByText('Extra content')).toBeTruthy();
  });
});
