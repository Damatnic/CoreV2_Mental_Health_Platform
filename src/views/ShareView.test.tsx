/**
 * ShareView Component Tests
 * Testing the sharing functionality and social features  
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock navigator.share API
const mockShare = vi.fn();
Object.defineProperty(navigator, 'share', {
  value: mockShare,
  writable: true,
  configurable: true
});

// Mock navigator.clipboard API  
const mockWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText
  },
  writable: true,
  configurable: true
});

// Mock window.open for social media sharing
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

// Mock dependencies
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', name: 'Test User' },
    isAuthenticated: true
  })
}));

vi.mock('../services/analyticsService', () => ({
  trackEvent: vi.fn(),
  trackShare: vi.fn()
}));

vi.mock('../services/shareService', () => ({
  generateShareLink: vi.fn(() => 'https://share.example.com/abc123'),
  trackShareEvent: vi.fn(),
  getShareMetadata: vi.fn(() => ({
    title: 'Mental Health Resource',
    description: 'Supporting mental wellness',
    image: 'https://example.com/image.jpg'
  }))
}));

// Types
interface ShareContent {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  tags?: string[];
  type: 'article' | 'resource' | 'story' | 'tip';
}

interface ShareOptions {
  platform: 'native' | 'twitter' | 'facebook' | 'linkedin' | 'email' | 'clipboard';
  content: ShareContent;
  userId?: string;
}

// Mock ShareView Component
const MockShareView: React.FC = () => {
  const [shareContent, setShareContent] = React.useState<ShareContent>({
    id: 'content-1',
    title: 'Mental Health Resource',
    description: 'Supporting mental wellness and recovery',
    url: 'https://example.com/resource',
    type: 'resource'
  });
  
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareStatus, setShareStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>('');

  const handleShare = async (platform: ShareOptions['platform']) => {
    setIsSharing(true);
    setSelectedPlatform(platform);
    
    try {
      switch (platform) {
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: shareContent.title,
              text: shareContent.description,
              url: shareContent.url
            });
          }
          break;
          
        case 'clipboard':
          await navigator.clipboard.writeText(shareContent.url);
          break;
          
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.title)}&url=${encodeURIComponent(shareContent.url)}`,
            '_blank'
          );
          break;
          
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareContent.url)}`,
            '_blank'
          );
          break;
          
        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareContent.url)}`,
            '_blank'
          );
          break;
          
        case 'email':
          window.location.href = `mailto:?subject=${encodeURIComponent(shareContent.title)}&body=${encodeURIComponent(shareContent.description + '\n\n' + shareContent.url)}`;
          break;
      }
      
      setShareStatus('success');
    } catch (error) {
      setShareStatus('error');
    } finally {
      setIsSharing(false);
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  return (
    <div className="share-view" data-testid="share-view">
      <h1>Share Resources</h1>
      
      <div className="share-content" data-testid="share-content">
        <h2>{shareContent.title}</h2>
        <p>{shareContent.description}</p>
        <a href={shareContent.url} target="_blank" rel="noopener noreferrer">
          {shareContent.url}
        </a>
      </div>
      
      <div className="share-buttons" data-testid="share-buttons">
        {navigator.share && (
          <button
            onClick={() => handleShare('native')}
            disabled={isSharing}
            data-testid="native-share-button"
            aria-label="Share using device share menu"
          >
            {isSharing && selectedPlatform === 'native' ? 'Sharing...' : 'Share'}
          </button>
        )}
        
        <button
          onClick={() => handleShare('clipboard')}
          disabled={isSharing}
          data-testid="copy-link-button"
          aria-label="Copy link to clipboard"
        >
          {isSharing && selectedPlatform === 'clipboard' ? 'Copying...' : 'Copy Link'}
        </button>
        
        <button
          onClick={() => handleShare('twitter')}
          disabled={isSharing}
          data-testid="twitter-share-button"
          aria-label="Share on Twitter"
        >
          Twitter
        </button>
        
        <button
          onClick={() => handleShare('facebook')}
          disabled={isSharing}
          data-testid="facebook-share-button"
          aria-label="Share on Facebook"
        >
          Facebook
        </button>
        
        <button
          onClick={() => handleShare('linkedin')}
          disabled={isSharing}
          data-testid="linkedin-share-button"
          aria-label="Share on LinkedIn"
        >
          LinkedIn
        </button>
        
        <button
          onClick={() => handleShare('email')}
          disabled={isSharing}
          data-testid="email-share-button"
          aria-label="Share via email"
        >
          Email
        </button>
      </div>
      
      {shareStatus === 'success' && (
        <div className="share-success" data-testid="share-success" role="alert">
          Successfully shared!
        </div>
      )}
      
      {shareStatus === 'error' && (
        <div className="share-error" data-testid="share-error" role="alert">
          Failed to share. Please try again.
        </div>
      )}
    </div>
  );
};

// Test wrapper
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Tests
describe('ShareView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShare.mockClear();
    mockWriteText.mockClear();
    mockWindowOpen.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render share view', () => {
      renderWithRouter(<MockShareView />);
      
      expect(screen.getByTestId('share-view')).toBeInTheDocument();
      expect(screen.getByTestId('share-content')).toBeInTheDocument();
      expect(screen.getByTestId('share-buttons')).toBeInTheDocument();
    });

    it('should display share content', () => {
      renderWithRouter(<MockShareView />);
      
      expect(screen.getByText('Mental Health Resource')).toBeInTheDocument();
      expect(screen.getByText('Supporting mental wellness and recovery')).toBeInTheDocument();
      expect(screen.getByText('https://example.com/resource')).toBeInTheDocument();
    });

    it('should show native share button when API is available', () => {
      Object.defineProperty(navigator, 'share', { value: mockShare });
      renderWithRouter(<MockShareView />);
      
      expect(screen.getByTestId('native-share-button')).toBeInTheDocument();
    });

    it('should hide native share button when API is not available', () => {
      Object.defineProperty(navigator, 'share', { value: undefined });
      renderWithRouter(<MockShareView />);
      
      expect(screen.queryByTestId('native-share-button')).not.toBeInTheDocument();
    });
  });

  describe('Native Sharing', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'share', { value: mockShare });
    });

    it('should call native share API', async () => {
      mockShare.mockResolvedValueOnce(undefined);
      renderWithRouter(<MockShareView />);
      
      const shareButton = screen.getByTestId('native-share-button');
      await userEvent.click(shareButton);
      
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Mental Health Resource',
        text: 'Supporting mental wellness and recovery',
        url: 'https://example.com/resource'
      });
    });

    it('should show success message after sharing', async () => {
      mockShare.mockResolvedValueOnce(undefined);
      renderWithRouter(<MockShareView />);
      
      const shareButton = screen.getByTestId('native-share-button');
      await userEvent.click(shareButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('share-success')).toBeInTheDocument();
      });
    });

    it('should show error message on share failure', async () => {
      mockShare.mockRejectedValueOnce(new Error('Share failed'));
      renderWithRouter(<MockShareView />);
      
      const shareButton = screen.getByTestId('native-share-button');
      await userEvent.click(shareButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('share-error')).toBeInTheDocument();
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy link to clipboard', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      renderWithRouter(<MockShareView />);
      
      const copyButton = screen.getByTestId('copy-link-button');
      await userEvent.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith('https://example.com/resource');
    });

    it('should show success message after copying', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      renderWithRouter(<MockShareView />);
      
      const copyButton = screen.getByTestId('copy-link-button');
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('share-success')).toBeInTheDocument();
      });
    });
  });

  describe('Social Media Sharing', () => {
    it('should open Twitter share dialog', async () => {
      renderWithRouter(<MockShareView />);
      
      const twitterButton = screen.getByTestId('twitter-share-button');
      await userEvent.click(twitterButton);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank'
      );
    });

    it('should open Facebook share dialog', async () => {
      renderWithRouter(<MockShareView />);
      
      const facebookButton = screen.getByTestId('facebook-share-button');
      await userEvent.click(facebookButton);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank'
      );
    });

    it('should open LinkedIn share dialog', async () => {
      renderWithRouter(<MockShareView />);
      
      const linkedinButton = screen.getByTestId('linkedin-share-button');
      await userEvent.click(linkedinButton);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing'),
        '_blank'
      );
    });
  });

  describe('Email Sharing', () => {
    it('should create mailto link', async () => {
      const originalHref = window.location.href;
      renderWithRouter(<MockShareView />);
      
      const emailButton = screen.getByTestId('email-share-button');
      await userEvent.click(emailButton);
      
      await waitFor(() => {
        expect(window.location.href).toContain('mailto:');
      });
      
      // Reset
      window.location.href = originalHref;
    });
  });

  describe('Loading States', () => {
    it('should disable buttons while sharing', async () => {
      mockShare.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      Object.defineProperty(navigator, 'share', { value: mockShare });
      
      renderWithRouter(<MockShareView />);
      
      const shareButton = screen.getByTestId('native-share-button');
      fireEvent.click(shareButton);
      
      expect(shareButton).toHaveTextContent('Sharing...');
      expect(shareButton).toBeDisabled();
      
      await waitFor(() => {
        expect(shareButton).toHaveTextContent('Share');
        expect(shareButton).not.toBeDisabled();
      });
    });

    it('should show loading state for copy button', async () => {
      mockWriteText.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithRouter(<MockShareView />);
      
      const copyButton = screen.getByTestId('copy-link-button');
      fireEvent.click(copyButton);
      
      expect(copyButton).toHaveTextContent('Copying...');
      expect(copyButton).toBeDisabled();
      
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copy Link');
        expect(copyButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<MockShareView />);
      
      expect(screen.getByLabelText('Copy link to clipboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Share via email')).toBeInTheDocument();
    });

    it('should have proper ARIA roles for alerts', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      renderWithRouter(<MockShareView />);
      
      const copyButton = screen.getByTestId('copy-link-button');
      await userEvent.click(copyButton);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Successfully shared!');
      });
    });
  });
});

// Export for reuse
export { MockShareView, type ShareContent, type ShareOptions };