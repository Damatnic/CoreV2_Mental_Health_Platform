import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Monitor, CheckCircle, Shield, Wifi, Bell } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

interface InstallPromptProps {
  onClose?: () => void;
  onInstall?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose, onInstall }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'ios'>('desktop');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = /android|mobile/.test(userAgent);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isMobile) {
      setPlatform('mobile');
    } else {
      setPlatform('desktop');
    }

    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };
    checkInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has previously dismissed the prompt
      const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissedTime) {
        setShowPrompt(true);
      } else {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        // Show again after 7 days
        if (daysSinceDismissed > 7) {
          setShowPrompt(true);
        }
      }
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', Date.now().toString());
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    displayModeQuery.addEventListener('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeQuery.removeEventListener('change', checkInstalled);
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    if (platform === 'ios' || !deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.removeItem('pwa-prompt-dismissed');
      } else {
        console.log('User dismissed the install prompt');
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
    onClose?.();
  };

  const benefits = [
    {
      icon: <Wifi className="w-5 h-5" />,
      title: 'Works Offline',
      description: 'Access crisis resources even without internet'
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Smart Notifications',
      description: 'Timely reminders for wellness activities'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Enhanced Privacy',
      description: 'Your data stays secure on your device'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Quick Access',
      description: 'Launch instantly from your home screen'
    }
  ];

  const getInstructions = () => {
    switch (platform) {
      case 'ios':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Install on iOS</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="mr-2 font-semibold">1.</span>
                <span>Tap the Share button <span className="inline-block px-2 py-1 bg-gray-100 rounded">⬆️</span> in Safari</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">2.</span>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">3.</span>
                <span>Tap "Add" to install Astral Core</span>
              </li>
            </ol>
          </div>
        );
      case 'mobile':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Install on Android</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="mr-2 font-semibold">1.</span>
                <span>Tap the menu button <span className="inline-block px-2 py-1 bg-gray-100 rounded">⋮</span> in Chrome</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">2.</span>
                <span>Select "Install app" or "Add to Home screen"</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">3.</span>
                <span>Follow the prompts to install</span>
              </li>
            </ol>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Install on Desktop</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="mr-2 font-semibold">1.</span>
                <span>Look for the install icon <span className="inline-block px-2 py-1 bg-gray-100 rounded">⊕</span> in your browser's address bar</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">2.</span>
                <span>Click "Install" when prompted</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">3.</span>
                <span>Astral Core will open in its own window</span>
              </li>
            </ol>
          </div>
        );
    }
  };

  if (isInstalled) {
    return null; // Don't show anything if already installed
  }

  if (!showPrompt && !showInstructions) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {platform === 'desktop' ? (
              <Monitor className="w-6 h-6 text-purple-600" />
            ) : (
              <Smartphone className="w-6 h-6 text-purple-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Install Astral Core
            </h2>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {showInstructions ? (
            <>
              {getInstructions()}
              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            </>
          ) : (
            <>
              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300">
                Install Astral Core for a better experience with instant access, offline support, and enhanced privacy.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                      {benefit.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {benefit.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={handleInstallClick}
                  className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Install</span>
                </button>
              </div>

              {/* Platform hint */}
              {platform === 'ios' && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Requires Safari browser on iOS
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;