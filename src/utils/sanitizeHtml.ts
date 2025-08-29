/**
 * HTML Sanitization Utility
 * 
 * Comprehensive HTML sanitization for mental health platform preventing
 * XSS attacks while allowing safe formatting for therapeutic content.
 * 
 * @fileoverview HTML sanitization utilities with mental health content support
 * @version 2.0.0
 */

/**
 * HTML sanitization options
 */
export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  allowLinks?: boolean;
  allowMarkdown?: boolean;
  maxLength?: number;
}

/**
 * Default sanitization options
 */
export const DEFAULT_SANITIZE_OPTIONS: SanitizeOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li'],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height']
  },
  allowLinks: false,
  allowMarkdown: true,
  maxLength: 10000
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  if (!html) return '';

  const config = { ...DEFAULT_SANITIZE_OPTIONS, ...options };
  
  // Truncate if too long
  let sanitized = html.length > (config.maxLength || 10000) 
    ? html.substring(0, config.maxLength || 10000) 
    : html;

  // Create a temporary DOM element for safe parsing
  const temp = document.createElement('div');
  temp.innerHTML = sanitized;

  // Recursively clean the DOM tree
  const cleaned = cleanElement(temp, config);
  
  return cleaned.innerHTML;
}

/**
 * Clean DOM element recursively
 */
function cleanElement(element: Element, options: SanitizeOptions): Element {
  const allowedTags = options.allowedTags || [];
  const allowedAttributes = options.allowedAttributes || {};

  // Process all child nodes
  const children = Array.from(element.childNodes);
  
  children.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childElement = child as Element;
      const tagName = childElement.tagName.toLowerCase();

      // Check if tag is allowed
      if (!allowedTags.includes(tagName)) {
        // Remove disallowed tags but keep content
        const textContent = childElement.textContent || '';
        const textNode = document.createTextNode(textContent);
        element.replaceChild(textNode, child);
      } else {
        // Clean attributes
        cleanAttributes(childElement, allowedAttributes[tagName] || []);
        
        // Recursively clean children
        cleanElement(childElement, options);
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      // Keep text nodes but escape any remaining HTML
      const textContent = child.textContent || '';
      child.textContent = textContent;
    } else {
      // Remove other node types (comments, etc.)
      element.removeChild(child);
    }
  });

  return element;
}

/**
 * Clean element attributes
 */
function cleanAttributes(element: Element, allowedAttrs: string[]): void {
  const attributes = Array.from(element.attributes);
  
  attributes.forEach(attr => {
    const attrName = attr.name.toLowerCase();
    
    if (!allowedAttrs.includes(attrName)) {
      element.removeAttribute(attr.name);
    } else {
      // Validate attribute values
      const attrValue = attr.value;
      
      if (attrName === 'href' || attrName === 'src') {
        // Validate URLs
        if (!isValidUrl(attrValue)) {
          element.removeAttribute(attr.name);
        }
      } else if (attrName.startsWith('on')) {
        // Remove event handlers
        element.removeAttribute(attr.name);
      }
    }
  });
}

/**
 * Validate URL safety
 */
function isValidUrl(url: string): boolean {
  if (!url) return false;

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const urlLower = url.toLowerCase().trim();
  
  if (dangerousProtocols.some(protocol => urlLower.startsWith(protocol))) {
    return false;
  }

  try {
    // For absolute URLs, validate with URL constructor
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url);
      return true;
    }
    
    // Allow relative URLs and anchors
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Convert markdown-like syntax to safe HTML
 */
export function safeMarkdownToHtml(text: string): string {
  if (!text) return '';

  // First, escape any existing HTML to prevent XSS
  let safe = escapeHtml(text);

  // Then apply markdown transformations using safe replacements
  safe = safe
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br>');

  // Handle links separately with validation
  safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (isValidUrl(url)) {
      const safeUrl = escapeHtml(url);
      const safeText = escapeHtml(text);
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
    }
    return escapeHtml(match); // Return original if URL is not valid
  });

  return safe;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'\/]/g, (char) => escapeMap[char]);
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(text: string): string {
  if (!text) return '';

  const unescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/'
  };

  return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, (entity) => unescapeMap[entity]);
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * Sanitize text input for display (no HTML allowed)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return escapeHtml(text.trim());
}

/**
 * Create safe HTML object for React dangerouslySetInnerHTML
 */
export function createSafeHtml(content: string, options?: SanitizeOptions): { __html: string } {
  return { __html: sanitizeHtml(content, options) };
}

/**
 * Sanitize user-generated content for therapeutic contexts
 */
export function sanitizeTherapeuticContent(content: string): string {
  const therapeuticOptions: SanitizeOptions = {
    allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'blockquote'],
    allowedAttributes: {},
    allowLinks: false,
    allowMarkdown: true,
    maxLength: 5000
  };

  return sanitizeHtml(content, therapeuticOptions);
}

/**
 * Sanitize crisis message content with extra safety
 */
export function sanitizeCrisisContent(content: string): string {
  const crisisOptions: SanitizeOptions = {
    allowedTags: ['p', 'br', 'strong', 'em'],
    allowedAttributes: {},
    allowLinks: false,
    allowMarkdown: false,
    maxLength: 2000
  };

  // First sanitize HTML
  let sanitized = sanitizeHtml(content, crisisOptions);
  
  // Additional safety for crisis content
  sanitized = sanitized
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // Remove script tags

  return sanitized;
}

/**
 * Validate and sanitize URL for safe use
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Remove any HTML encoding
  const decoded = decodeURIComponent(url);
  
  if (!isValidUrl(decoded)) {
    return '';
  }

  return decoded;
}

/**
 * Comprehensive content sanitizer for different contexts
 */
export class ContentSanitizer {
  
  /**
   * Sanitize content based on context
   */
  public static sanitize(
    content: string, 
    context: 'general' | 'therapeutic' | 'crisis' | 'chat' | 'profile'
  ): string {
    switch (context) {
      case 'crisis':
        return sanitizeCrisisContent(content);
      
      case 'therapeutic':
        return sanitizeTherapeuticContent(content);
      
      case 'chat':
        return sanitizeHtml(content, {
          allowedTags: ['strong', 'em', 'br'],
          allowedAttributes: {},
          allowLinks: false,
          maxLength: 1000
        });
      
      case 'profile':
        return sanitizeHtml(content, {
          allowedTags: ['p', 'br', 'strong', 'em'],
          allowedAttributes: {},
          allowLinks: false,
          maxLength: 500
        });
      
      case 'general':
      default:
        return sanitizeHtml(content);
    }
  }

  /**
   * Batch sanitize multiple content items
   */
  public static sanitizeBatch(
    items: Array<{ content: string; context: string }>,
    defaultContext: string = 'general'
  ): Array<{ content: string; context: string }> {
    return items.map(item => ({
      ...item,
      content: this.sanitize(
        item.content, 
        item.context as any || defaultContext as any
      )
    }));
  }
}

// Default export with all utilities
export default {
  sanitizeHtml,
  safeMarkdownToHtml,
  escapeHtml,
  unescapeHtml,
  stripHtml,
  sanitizeText,
  createSafeHtml,
  sanitizeTherapeuticContent,
  sanitizeCrisisContent,
  sanitizeUrl,
  ContentSanitizer,
  DEFAULT_SANITIZE_OPTIONS
};
