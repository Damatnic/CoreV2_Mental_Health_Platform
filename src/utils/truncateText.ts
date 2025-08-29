/**
 * Truncate text utility functions
 * 
 * Provides various text truncation methods with smart handling
 * of word boundaries, HTML, and different truncation strategies
 */

interface TruncateOptions {
  /**
   * Maximum length of the truncated text
   */
  length: number;
  
  /**
   * String to append when text is truncated
   * @default '...'
   */
  suffix?: string;
  
  /**
   * Whether to break at word boundaries
   * @default true
   */
  breakWords?: boolean;
  
  /**
   * Whether to preserve HTML tags
   * @default false
   */
  preserveHtml?: boolean;
  
  /**
   * Whether to strip HTML tags before truncating
   * @default false
   */
  stripHtml?: boolean;
  
  /**
   * Custom word boundary characters
   * @default /\s/
   */
  wordBoundary?: RegExp;
  
  /**
   * Whether to count HTML tags in length calculation
   * @default false
   */
  countHtmlChars?: boolean;
}

/**
 * Basic text truncation
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + suffix;
}

/**
 * Advanced text truncation with options
 */
export function truncate(text: string, options: TruncateOptions): string {
  const {
    length,
    suffix = '...',
    breakWords = true,
    preserveHtml = false,
    stripHtml = false,
    wordBoundary = /\s/,
    countHtmlChars = false
  } = options;

  if (!text) return '';

  // Strip HTML if requested
  let processedText = text;
  if (stripHtml) {
    processedText = stripHtmlTags(text);
  }

  // If text is already short enough, return as is
  const textLength = getTextLength(processedText, countHtmlChars);
  if (textLength <= length) {
    return processedText;
  }

  // Handle HTML preservation
  if (preserveHtml && !stripHtml) {
    return truncateHtml(text, length, suffix, breakWords, wordBoundary);
  }

  // Regular text truncation
  if (breakWords) {
    return truncateAtWordBoundary(processedText, length, suffix, wordBoundary);
  } else {
    return processedText.substring(0, length) + suffix;
  }
}

/**
 * Truncate text at word boundary
 */
function truncateAtWordBoundary(
  text: string, 
  maxLength: number, 
  suffix: string, 
  wordBoundary: RegExp
): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last word boundary before maxLength
  let truncateIndex = maxLength;
  
  // Look backwards for a word boundary
  for (let i = maxLength; i >= 0; i--) {
    if (wordBoundary.test(text[i])) {
      truncateIndex = i;
      break;
    }
  }

  // If no word boundary found, use the original maxLength
  if (truncateIndex === maxLength && !wordBoundary.test(text[maxLength])) {
    // Try to find a reasonable break point
    const reasonableBreaks = /[.,;:!?]/;
    for (let i = maxLength; i >= Math.max(0, maxLength - 20); i--) {
      if (reasonableBreaks.test(text[i])) {
        truncateIndex = i + 1;
        break;
      }
    }
  }

  return text.substring(0, truncateIndex).trim() + suffix;
}

/**
 * Truncate HTML content while preserving tags
 */
function truncateHtml(
  html: string, 
  maxLength: number, 
  suffix: string, 
  breakWords: boolean,
  wordBoundary: RegExp
): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  let textLength = 0;
  let truncated = false;

  function traverseNodes(node: Node): boolean {
    if (truncated) return false;

    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || '';
      
      if (textLength + textContent.length <= maxLength) {
        textLength += textContent.length;
        return true;
      } else {
        // Need to truncate this text node
        const remainingLength = maxLength - textLength;
        let truncatedText = textContent.substring(0, remainingLength);
        
        if (breakWords && remainingLength < textContent.length) {
          // Find word boundary
          let wordBoundaryIndex = remainingLength;
          for (let i = remainingLength; i >= 0; i--) {
            if (wordBoundary.test(textContent[i])) {
              wordBoundaryIndex = i;
              break;
            }
          }
          truncatedText = textContent.substring(0, wordBoundaryIndex).trim();
        }
        
        node.textContent = truncatedText + suffix;
        truncated = true;
        return false;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const childNodes = Array.from(node.childNodes);
      for (const child of childNodes) {
        if (!traverseNodes(child)) {
          // Remove remaining siblings
          const index = childNodes.indexOf(child);
          for (let i = index + 1; i < childNodes.length; i++) {
            node.removeChild(childNodes[i]);
          }
          break;
        }
      }
    }
    
    return true;
  }

  traverseNodes(tempDiv);
  return tempDiv.innerHTML;
}

/**
 * Get text length (optionally excluding HTML tags)
 */
function getTextLength(text: string, countHtmlChars: boolean): number {
  if (countHtmlChars) {
    return text.length;
  }
  
  // Strip HTML tags for length calculation
  const withoutTags = stripHtmlTags(text);
  return withoutTags.length;
}

/**
 * Strip HTML tags from text
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Truncate text to a specific number of words
 */
export function truncateWords(text: string, maxWords: number, suffix = '...'): string {
  if (!text) return '';
  
  const words = text.trim().split(/\s+/);
  
  if (words.length <= maxWords) {
    return text;
  }
  
  return words.slice(0, maxWords).join(' ') + suffix;
}

/**
 * Truncate text to a specific number of sentences
 */
export function truncateSentences(text: string, maxSentences: number, suffix = '...'): string {
  if (!text) return '';
  
  // Split by sentence endings
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length <= maxSentences) {
    return text;
  }
  
  return sentences.slice(0, maxSentences).join('. ') + '.' + suffix;
}

/**
 * Smart truncation that tries different strategies
 */
export function smartTruncate(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Try sentence boundaries first
  const sentences = text.split(/[.!?]+/);
  if (sentences.length > 1) {
    let result = '';
    for (const sentence of sentences) {
      const candidate = result + sentence + '.';
      if (candidate.length <= maxLength) {
        result = candidate;
      } else {
        break;
      }
    }
    if (result.length > 0) {
      return result + suffix;
    }
  }

  // Try word boundaries
  return truncateAtWordBoundary(text, maxLength, suffix, /\s/);
}

/**
 * Truncate with ellipsis in the middle
 */
export function truncateMiddle(text: string, maxLength: number, separator = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  const separatorLength = separator.length;
  const availableLength = maxLength - separatorLength;
  const frontLength = Math.ceil(availableLength / 2);
  const backLength = Math.floor(availableLength / 2);

  return text.substring(0, frontLength) + separator + text.substring(text.length - backLength);
}

/**
 * Truncate file paths intelligently
 */
export function truncateFilePath(path: string, maxLength: number): string {
  if (!path || path.length <= maxLength) {
    return path;
  }

  const parts = path.split('/');
  
  if (parts.length <= 2) {
    return truncateMiddle(path, maxLength);
  }

  // Keep first and last parts, truncate middle
  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts.slice(1, -1);

  if (first.length + last.length + 5 > maxLength) {
    return truncateMiddle(path, maxLength);
  }

  let result = first + '/';
  let remainingLength = maxLength - first.length - last.length - 4; // 4 for "/.../"

  for (const part of middle) {
    if (result.length + part.length + 1 <= remainingLength) {
      result += part + '/';
    } else {
      result += '.../';
      break;
    }
  }

  return result + last;
}

/**
 * Truncate URL intelligently
 */
export function truncateUrl(url: string, maxLength: number): string {
  if (!url || url.length <= maxLength) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol + '//';
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    const search = urlObj.search;

    // Always keep protocol and hostname
    const base = protocol + hostname;
    if (base.length >= maxLength) {
      return truncateMiddle(base, maxLength);
    }

    const remainingLength = maxLength - base.length;

    // Add path if it fits
    if (pathname.length <= remainingLength) {
      return base + pathname + (search.length <= remainingLength - pathname.length ? search : '');
    } else {
      // Truncate path
      const truncatedPath = pathname.length > 10 
        ? truncateMiddle(pathname, remainingLength - 3) 
        : pathname.substring(0, remainingLength - 3) + '...';
      return base + truncatedPath;
    }
  } catch {
    // Fallback to simple truncation if URL parsing fails
    return truncateMiddle(url, maxLength);
  }
}

/**
 * Truncate with custom break characters
 */
export function truncateAtChars(text: string, maxLength: number, breakChars: string[], suffix = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Find the last break character before maxLength
  let breakIndex = -1;
  for (let i = maxLength; i >= 0; i--) {
    if (breakChars.includes(text[i])) {
      breakIndex = i;
      break;
    }
  }

  if (breakIndex === -1) {
    // No break character found, use regular truncation
    return text.substring(0, maxLength) + suffix;
  }

  return text.substring(0, breakIndex + 1) + suffix;
}

/**
 * Get truncated preview with context
 */
export function getTruncatedPreview(
  text: string, 
  searchTerm: string, 
  maxLength: number, 
  contextLength = 50
): string {
  if (!text || !searchTerm) {
    return truncate(text, { length: maxLength });
  }

  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  
  if (index === -1) {
    return truncate(text, { length: maxLength });
  }

  // Calculate start and end positions for context
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);
  
  let preview = text.substring(start, end);
  
  // Add ellipsis if we truncated
  if (start > 0) preview = '...' + preview;
  if (end < text.length) preview = preview + '...';
  
  // Further truncate if still too long
  if (preview.length > maxLength) {
    return truncate(preview, { length: maxLength });
  }
  
  return preview;
}

/**
 * Responsive truncation based on container width
 */
export function responsiveTruncate(
  text: string, 
  containerWidth: number, 
  characterWidth = 8, // approximate character width in pixels
  suffix = '...'
): string {
  if (!text) return '';
  
  const maxChars = Math.floor(containerWidth / characterWidth);
  
  if (text.length <= maxChars) {
    return text;
  }
  
  return truncate(text, { 
    length: maxChars, 
    suffix, 
    breakWords: true 
  });
}

export default {
  truncateText,
  truncate,
  truncateWords,
  truncateSentences,
  smartTruncate,
  truncateMiddle,
  truncateFilePath,
  truncateUrl,
  truncateAtChars,
  getTruncatedPreview,
  responsiveTruncate,
  stripHtmlTags
};

