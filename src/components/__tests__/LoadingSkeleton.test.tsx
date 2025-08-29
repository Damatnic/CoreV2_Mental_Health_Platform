import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '../../test-utils/testing-library-exports';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circle' | 'rectangle' | 'card' | 'list';
  width?: string | number;
  height?: string | number;
  count?: number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  count = 1,
  animation = 'pulse',
  className = ''
}) => {
  const getSkeletonStyle = () => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: '#e0e0e0',
      borderRadius: variant === 'circle' ? '50%' : '4px'
    };

    if (width) baseStyle.width = typeof width === 'number' ? `${width}px` : width;
    if (height) baseStyle.height = typeof height === 'number' ? `${height}px` : height;

    // Default heights for variants
    if (!height) {
      switch (variant) {
        case 'text':
          baseStyle.height = '1em';
          break;
        case 'circle':
          baseStyle.height = baseStyle.width;
          break;
        case 'card':
          baseStyle.height = '200px';
          break;
        case 'list':
          baseStyle.height = '60px';
          break;
        default:
          baseStyle.height = '20px';
      }
    }

    return baseStyle;
  };

  const renderSkeleton = (index: number) => {
    const skeletonClass = `skeleton-${variant} skeleton-${animation} ${className}`.trim();
    
    if (variant === 'card') {
      return (
        <div key={index} className={skeletonClass} data-testid="skeleton-card">
          <div className="skeleton-header" style={{ height: '120px', marginBottom: '12px' }} />
          <div className="skeleton-title" style={{ height: '20px', marginBottom: '8px', width: '70%' }} />
          <div className="skeleton-text" style={{ height: '16px', marginBottom: '4px' }} />
          <div className="skeleton-text" style={{ height: '16px', width: '60%' }} />
        </div>
      );
    }

    if (variant === 'list') {
      return (
        <div key={index} className={`skeleton-list-item ${skeletonClass}`} data-testid="skeleton-list">
          <div className="skeleton-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }} />
          <div className="skeleton-content" style={{ flex: 1 }}>
            <div className="skeleton-title" style={{ height: '16px', marginBottom: '4px', width: '60%' }} />
            <div className="skeleton-subtitle" style={{ height: '14px', width: '40%' }} />
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className={skeletonClass}
        style={getSkeletonStyle()}
        data-testid={`skeleton-${variant}`}
      />
    );
  };

  return (
    <div className="skeleton-container">
      {Array.from({ length: count }, (_, index) => renderSkeleton(index))}
    </div>
  );
};

describe('LoadingSkeleton', () => {
  it('should render single skeleton by default', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByTestId('skeleton-text')).toBeTruthy();
  });

  it('should render multiple skeletons when count is specified', () => {
    render(<LoadingSkeleton count={3} />);
    const skeletons = screen.getAllByTestId('skeleton-text');
    expect(skeletons).toHaveLength(3);
  });

  it('should render different variants', () => {
    const { rerender } = render(<LoadingSkeleton variant="circle" />);
    expect(screen.getByTestId('skeleton-circle')).toBeTruthy();

    rerender(<LoadingSkeleton variant="rectangle" />);
    expect(screen.getByTestId('skeleton-rectangle')).toBeTruthy();

    rerender(<LoadingSkeleton variant="card" />);
    expect(screen.getByTestId('skeleton-card')).toBeTruthy();

    rerender(<LoadingSkeleton variant="list" />);
    expect(screen.getByTestId('skeleton-list')).toBeTruthy();
  });

  it('should apply custom width and height', () => {
    render(<LoadingSkeleton width={200} height={50} />);
    const skeleton = screen.getByTestId('skeleton-text');
    
    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('50px');
  });

  it('should apply string width and height', () => {
    render(<LoadingSkeleton width="50%" height="2em" />);
    const skeleton = screen.getByTestId('skeleton-text');
    
    expect(skeleton.style.width).toBe('50%');
    expect(skeleton.style.height).toBe('2em');
  });

  it('should apply animation classes', () => {
    const { rerender } = render(<LoadingSkeleton animation="pulse" />);
    let skeleton = screen.getByTestId('skeleton-text');
    expect(skeleton.className).toContain('skeleton-pulse');

    rerender(<LoadingSkeleton animation="wave" />);
    skeleton = screen.getByTestId('skeleton-text');
    expect(skeleton.className).toContain('skeleton-wave');

    rerender(<LoadingSkeleton animation="none" />);
    skeleton = screen.getByTestId('skeleton-text');
    expect(skeleton.className).toContain('skeleton-none');
  });

  it('should apply custom className', () => {
    render(<LoadingSkeleton className="custom-skeleton" />);
    const skeleton = screen.getByTestId('skeleton-text');
    expect(skeleton.className).toContain('custom-skeleton');
  });

  it('should render card variant with proper structure', () => {
    render(<LoadingSkeleton variant="card" />);
    const card = screen.getByTestId('skeleton-card');
    
    expect(card.querySelector('.skeleton-header')).toBeTruthy();
    expect(card.querySelector('.skeleton-title')).toBeTruthy();
    expect(card.querySelectorAll('.skeleton-text')).toHaveLength(2);
  });

  it('should render list variant with proper structure', () => {
    render(<LoadingSkeleton variant="list" />);
    const list = screen.getByTestId('skeleton-list');
    
    expect(list.querySelector('.skeleton-avatar')).toBeTruthy();
    expect(list.querySelector('.skeleton-content')).toBeTruthy();
    expect(list.querySelector('.skeleton-title')).toBeTruthy();
    expect(list.querySelector('.skeleton-subtitle')).toBeTruthy();
  });

  it('should handle circle variant with equal width and height', () => {
    render(<LoadingSkeleton variant="circle" width={50} />);
    const skeleton = screen.getByTestId('skeleton-circle');
    
    expect(skeleton.style.width).toBe('50px');
    expect(skeleton.style.height).toBe('50px');
    expect(skeleton.style.borderRadius).toBe('50%');
  });

  it('should use default heights for different variants', () => {
    const variants = ['text', 'rectangle', 'card', 'list'] as const;
    
    variants.forEach(variant => {
      const { unmount } = render(<LoadingSkeleton variant={variant} />);
      const skeleton = screen.getByTestId(`skeleton-${variant}`);
      
      expect(skeleton.style.height).toBeTruthy();
      unmount();
    });
  });

  it('should render multiple card skeletons', () => {
    render(<LoadingSkeleton variant="card" count={2} />);
    const cards = screen.getAllByTestId('skeleton-card');
    expect(cards).toHaveLength(2);
  });

  it('should combine variant and animation classes', () => {
    render(<LoadingSkeleton variant="rectangle" animation="wave" />);
    const skeleton = screen.getByTestId('skeleton-rectangle');
    
    expect(skeleton.className).toContain('skeleton-rectangle');
    expect(skeleton.className).toContain('skeleton-wave');
  });
});
