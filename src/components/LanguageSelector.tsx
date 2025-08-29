import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import '../styles/LanguageSelector.css';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

interface LanguageSelectorProps {
  currentLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
  showFlags?: boolean;
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage = 'en',
  onLanguageChange,
  showFlags = true,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange?.(languageCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent, languageCode?: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (languageCode) {
        handleLanguageSelect(languageCode);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  if (compact) {
    return (
      <div className="language-selector compact" ref={dropdownRef}>
        <button
          className="language-trigger compact"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => handleKeyDown(e)}
          aria-label={`Current language: ${currentLang.name}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Globe size={16} />
          {showFlags && <span className="flag">{currentLang.flag}</span>}
          <span className="language-code">{currentLang.code.toUpperCase()}</span>
        </button>

        {isOpen && (
          <div className="language-dropdown compact">
            <div className="language-list" role="listbox">
              {languages.slice(0, 8).map(language => (
                <button
                  key={language.code}
                  className={`language-option ${currentLanguage === language.code ? 'selected' : ''}`}
                  onClick={() => handleLanguageSelect(language.code)}
                  onKeyDown={(e) => handleKeyDown(e, language.code)}
                  role="option"
                  aria-selected={currentLanguage === language.code}
                >
                  {showFlags && <span className="flag">{language.flag}</span>}
                  <span className="language-code">{language.code.toUpperCase()}</span>
                  {currentLanguage === language.code && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e)}
        aria-label={`Current language: ${currentLang.name}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe size={18} />
        {showFlags && <span className="flag">{currentLang.flag}</span>}
        <div className="language-info">
          <span className="language-name">{currentLang.name}</span>
          <span className="native-name">{currentLang.nativeName}</span>
        </div>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search languages..."
              className="language-search"
              aria-label="Search languages"
            />
          </div>

          <div className="language-list" role="listbox">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map(language => (
                <button
                  key={language.code}
                  className={`language-option ${currentLanguage === language.code ? 'selected' : ''} ${language.rtl ? 'rtl' : ''}`}
                  onClick={() => handleLanguageSelect(language.code)}
                  onKeyDown={(e) => handleKeyDown(e, language.code)}
                  role="option"
                  aria-selected={currentLanguage === language.code}
                >
                  {showFlags && <span className="flag">{language.flag}</span>}
                  <div className="language-details">
                    <span className="language-name">{language.name}</span>
                    <span className="native-name">{language.nativeName}</span>
                  </div>
                  {currentLanguage === language.code && (
                    <Check size={16} className="check-icon" />
                  )}
                </button>
              ))
            ) : (
              <div className="no-results">
                <p>No languages found matching "{searchTerm}"</p>
              </div>
            )}
          </div>

          <div className="dropdown-footer">
            <p className="language-note">
              Language changes may require a page refresh to take full effect
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
