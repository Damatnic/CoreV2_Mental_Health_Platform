// React import not needed with modern JSX transform
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../ui/Modal';
import React from 'react';

// Mock components that might be used within modals
jest.mock('../../components/AppButton', () => ({
  AppButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  title: 'Test Modal',
  children: <div>Modal content</div>
};

describe('Modal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock body style manipulation
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = '';
  });

  describe('Basic Rendering', () => {
    it('should render modal when open', () => {
      render(<Modal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render title in header', () => {
      render(<Modal {...defaultProps} />);
      
      const title = screen.getByText('Test Modal');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H2');
    });

    it('should render children content', () => {
      const content = <div data-testid="custom-content">Custom modal content</div>;
      render(<Modal {...defaultProps}>{content}</Modal>);
      
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom modal content')).toBeInTheDocument();
    });
  });

  describe('Closing Behavior', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when escape key is pressed', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const overlay = screen.getByTestId('modal-overlay');
      await user.click(overlay);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking modal content', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const modalContent = screen.getByRole('dialog');
      await user.click(modalContent);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not close when closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);
      
      const overlay = screen.getByTestId('modal-overlay');
      await user.click(overlay);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not close when closeOnEscape is false', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      render(<Modal {...defaultProps} size="small" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-md');
    });

    it('should apply medium size classes (default)', () => {
      render(<Modal {...defaultProps} size="medium" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-lg');
    });

    it('should apply large size classes', () => {
      render(<Modal {...defaultProps} size="large" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-4xl');
    });

    it('should apply full size classes', () => {
      render(<Modal {...defaultProps} size="full" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-full', 'h-full', 'm-0');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<Modal {...defaultProps} className="custom-modal-class" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal-class');
    });

    it('should allow custom header content', () => {
      const customHeader = <div data-testid="custom-header">Custom Header</div>;
      render(<Modal {...defaultProps} header={customHeader} />);
      
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('should allow custom footer content', () => {
      const customFooter = <div data-testid="custom-footer">Custom Footer</div>;
      render(<Modal {...defaultProps} footer={customFooter} />);
      
      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.getByText('Custom Footer')).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
  });

  describe('Body Scroll Management', () => {
    it('should prevent body scroll when modal is open', () => {
      render(<Modal {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      
      expect(document.body.style.overflow).toBe('');
    });

    it('should not affect body scroll when preventScroll is false', () => {
      render(<Modal {...defaultProps} preventScroll={false} />);
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Focus Management', () => {
    it('should focus the modal when opened', async () => {
      render(<Modal {...defaultProps} />);
      
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveFocus();
      });
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal {...defaultProps}>
          <div>
            <input data-testid="input1" />
            <button data-testid="button1">Button 1</button>
            <button data-testid="button2">Button 2</button>
          </div>
        </Modal>
      );
      
      const input = screen.getByTestId('input1');
      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      // Focus should move through modal elements
      await user.tab();
      expect(closeButton).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(button1).toHaveFocus();
      
      await user.tab();
      expect(button2).toHaveFocus();
      
      // Should wrap back to close button
      await user.tab();
      expect(closeButton).toHaveFocus();
    });

    it('should restore focus when modal closes', async () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();
      
      const { rerender } = render(<Modal {...defaultProps} />);
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      
      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });
      
      document.body.removeChild(triggerButton);
    });
  });

  describe('Animation and Transitions', () => {
    it('should apply entrance animation classes', () => {
      render(<Modal {...defaultProps} />);
      
      const overlay = screen.getByTestId('modal-overlay');
      const modal = screen.getByRole('dialog');
      
      expect(overlay).toHaveClass('animate-fadeIn');
      expect(modal).toHaveClass('animate-scaleIn');
    });

    it('should support custom animation', () => {
      render(<Modal {...defaultProps} animation="slideUp" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('animate-slideUp');
    });

    it('should disable animations when specified', () => {
      render(<Modal {...defaultProps} animation="none" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal.className).not.toMatch(/animate-/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Modal {...defaultProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('should use custom aria-labelledby when provided', () => {
      render(<Modal {...defaultProps} ariaLabelledBy="custom-title" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby', 'custom-title');
    });

    it('should use aria-describedby when description is provided', () => {
      render(<Modal {...defaultProps} ariaDescribedBy="modal-description" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-describedby', 'modal-description');
    });

    it('should support screen reader announcements', () => {
      render(<Modal {...defaultProps} />);
      
      // Modal should be announced to screen readers
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Portal Rendering', () => {
    it('should render modal in portal by default', () => {
      render(<Modal {...defaultProps} />);
      
      // Modal should not be in the main document tree
      const modal = screen.getByRole('dialog');
      expect(modal.parentElement).not.toBe(document.body.firstChild);
    });

    it('should render inline when portal is disabled', () => {
      render(<Modal {...defaultProps} usePortal={false} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<Modal {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should disable close actions when loading', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<Modal {...defaultProps} loading={true} onClose={onClose} />);
      
      // Try to close via overlay click
      const overlay = screen.getByTestId('modal-overlay');
      await user.click(overlay);
      
      expect(onClose).not.toHaveBeenCalled();
      
      // Try to close via escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Confirmation Modal', () => {
    const confirmProps = {
      ...defaultProps,
      type: 'confirm' as const,
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
      confirmText: 'Confirm Action',
      cancelText: 'Cancel'
    };

    it('should render confirmation buttons', () => {
      render(<Modal {...confirmProps} />);
      
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      
      render(<Modal {...confirmProps} onConfirm={onConfirm} />);
      
      await user.click(screen.getByText('Confirm Action'));
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      
      render(<Modal {...confirmProps} onCancel={onCancel} />);
      
      await user.click(screen.getByText('Cancel'));
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onClose gracefully', () => {
      const { onClose, ...propsWithoutOnClose } = defaultProps;
      
      expect(() => {
        render(<Modal {...propsWithoutOnClose} onClose={() => {}} />);
      }).not.toThrow();
    });

    it('should handle missing title gracefully', () => {
      const { title, ...propsWithoutTitle } = defaultProps;
      
      render(<Modal {...propsWithoutTitle} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle render errors in children', () => {
      const ErrorComponent = () => {
        throw new Error('Render error');
      };

      // Mock console.error to prevent test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(
          <Modal {...defaultProps}>
            <ErrorComponent />
          </Modal>
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not render heavy content when modal is closed', () => {
      const HeavyComponent = jest.fn(() => <div>Heavy component</div>);
      
      render(
        <Modal {...defaultProps} isOpen={false}>
          <HeavyComponent />
        </Modal>
      );
      
      expect(HeavyComponent).not.toHaveBeenCalled();
    });

    it('should memoize expensive calculations', () => {
      const expensiveCalculation = jest.fn(() => 'calculated value');
      
      const TestModal = () => {
        const value = expensiveCalculation();
        return <Modal {...defaultProps}>{value}</Modal>;
      };
      
      const { rerender } = render(<TestModal />);
      rerender(<TestModal />);
      
      // Should only calculate once due to memoization
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
    });
  });
});
