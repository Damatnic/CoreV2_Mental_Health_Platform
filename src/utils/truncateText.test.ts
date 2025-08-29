import { describe, it, expect } from '@jest/globals';

interface TruncateOptions {
  length: number;
  suffix?: string;
  breakOnWord?: boolean;
  preserveHtml?: boolean;
}

function truncateText(text: string, options: TruncateOptions): string {
  const { length, suffix = '...', breakOnWord = true, preserveHtml = false } = options;
  
  if (!text || text.length <= length) {
    return text;
  }
  
  let truncated: string;
  
  if (preserveHtml) {
    // Simple HTML preservation - remove tags for length calculation
    const textOnly = text.replace(/<[^>]*>/g, '');
    if (textOnly.length <= length) {
      return text;
    }
    
    // This is a simplified approach - a real implementation would be more complex
    truncated = text.substring(0, length);
  } else {
    truncated = text.substring(0, length);
  }
  
  if (breakOnWord) {
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > length * 0.8) { // Only break on word if space is reasonably close
      truncated = truncated.substring(0, lastSpace);
    }
  }
  
  return truncated + suffix;
}

function truncateTextSmart(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Find the last sentence that fits
  const sentences = text.split(/[.!?]+/);
  let result = '';
  
  for (const sentence of sentences) {
    const potential = result + sentence + '.';
    if (potential.length <= maxLength) {
      result = potential;
    } else {
      break;
    }
  }
  
  // If no complete sentence fits, fall back to word breaking
  if (result.length === 0) {
    return truncateText(text, { length: maxLength - 3, breakOnWord: true });
  }
  
  return result;
}

function truncateTextWithEllipsis(text: string, maxLength: number, position: 'end' | 'middle' = 'end'): string {
  if (text.length <= maxLength) return text;
  
  if (position === 'middle') {
    const ellipsis = '...';
    const availableLength = maxLength - ellipsis.length;
    const startLength = Math.ceil(availableLength / 2);
    const endLength = Math.floor(availableLength / 2);
    
    return text.substring(0, startLength) + ellipsis + text.substring(text.length - endLength);
  }
  
  return truncateText(text, { length: maxLength - 3 });
}

function truncateHTML(html: string, maxLength: number): string {
  // Simple HTML truncation - remove tags for length calculation
  const textOnly = html.replace(/<[^>]*>/g, '');
  
  if (textOnly.length <= maxLength) {
    return html;
  }
  
  // Find truncation point in original HTML
  let currentLength = 0;
  let truncationIndex = 0;
  let inTag = false;
  
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '<') {
      inTag = true;
    } else if (html[i] === '>') {
      inTag = false;
    } else if (!inTag) {
      currentLength++;
      if (currentLength >= maxLength) {
        truncationIndex = i + 1;
        break;
      }
    }
  }
  
  const truncated = html.substring(0, truncationIndex);
  
  // Simple approach to close unclosed tags
  const openTags: string[] = [];
  const tagRegex = /<\/?([a-zA-Z]+)[^>]*>/g;
  let match;
  
  while ((match = tagRegex.exec(truncated)) !== null) {
    const isClosing = match[0].startsWith('</');
    const tagName = match[1].toLowerCase();
    
    if (isClosing) {
      const index = openTags.lastIndexOf(tagName);
      if (index !== -1) {
        openTags.splice(index, 1);
      }
    } else if (!match[0].endsWith('/>')) {
      openTags.push(tagName);
    }
  }
  
  // Close remaining open tags
  let result = truncated;
  for (let i = openTags.length - 1; i >= 0; i--) {
    result += `</${openTags[i]}>`;
  }
  
  return result + '...';
}

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function truncateByWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  
  if (words.length <= maxWords) {
    return text;
  }
  
  return words.slice(0, maxWords).join(' ') + '...';
}

describe('truncateText', () => {
  it('should return original text if shorter than limit', () => {
    const result = truncateText('Hello world', { length: 20 });
    expect(result).toBe('Hello world');
  });

  it('should truncate text with default suffix', () => {
    const result = truncateText('This is a very long sentence that needs truncation', { length: 20 });
    expect(result).toBe('This is a very long ...'); // Breaks on word
  });

  it('should use custom suffix', () => {
    const result = truncateText('Hello world this is long', { length: 10, suffix: '…' });
    expect(result).toBe('Hello…');
  });

  it('should break on characters when breakOnWord is false', () => {
    const result = truncateText('Hello world', { length: 7, breakOnWord: false });
    expect(result).toBe('Hello w...');
  });

  it('should handle empty string', () => {
    const result = truncateText('', { length: 10 });
    expect(result).toBe('');
  });

  it('should handle exact length match', () => {
    const text = 'Hello';
    const result = truncateText(text, { length: 5 });
    expect(result).toBe('Hello');
  });
});

describe('truncateTextSmart', () => {
  it('should truncate by complete sentences when possible', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const result = truncateTextSmart(text, 30);
    expect(result).toBe('First sentence. Second sentence.');
  });

  it('should fall back to word truncation for long sentences', () => {
    const text = 'This is one very long sentence that cannot fit in the specified length limit.';
    const result = truncateTextSmart(text, 20);
    expect(result).toContain('...');
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('should return original text if it fits', () => {
    const text = 'Short text.';
    const result = truncateTextSmart(text, 50);
    expect(result).toBe(text);
  });
});

describe('truncateTextWithEllipsis', () => {
  it('should truncate at the end by default', () => {
    const result = truncateTextWithEllipsis('This is a long text', 10);
    expect(result).toContain('...');
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should truncate in the middle when specified', () => {
    const result = truncateTextWithEllipsis('This is a very long filename.txt', 20, 'middle');
    expect(result).toContain('...');
    expect(result.startsWith('This')).toBe(true);
    expect(result.endsWith('.txt')).toBe(true);
    expect(result.length).toBe(20);
  });

  it('should return original text if it fits', () => {
    const text = 'Short';
    const result = truncateTextWithEllipsis(text, 20);
    expect(result).toBe(text);
  });
});

describe('truncateHTML', () => {
  it('should truncate HTML while preserving tags', () => {
    const html = '<p>This is a <strong>very long</strong> paragraph with HTML tags.</p>';
    const result = truncateHTML(html, 20);
    
    expect(result).toContain('<p>');
    expect(result).toContain('</p>');
    expect(result.length).toBeLessThan(html.length);
  });

  it('should close unclosed tags', () => {
    const html = '<div><p>Some text';
    const result = truncateHTML(html, 8);
    
    expect(result).toContain('</p>');
    expect(result).toContain('</div>');
  });

  it('should return original HTML if text content fits', () => {
    const html = '<p>Short</p>';
    const result = truncateHTML(html, 20);
    expect(result).toBe(html);
  });
});

describe('getWordCount', () => {
  it('should count words correctly', () => {
    expect(getWordCount('Hello world')).toBe(2);
    expect(getWordCount('One two three four five')).toBe(5);
    expect(getWordCount('')).toBe(0);
    expect(getWordCount('   ')).toBe(0);
    expect(getWordCount('  word  ')).toBe(1);
  });

  it('should handle multiple spaces', () => {
    expect(getWordCount('Hello    world   test')).toBe(3);
  });
});

describe('truncateByWords', () => {
  it('should truncate by word count', () => {
    const result = truncateByWords('One two three four five six', 3);
    expect(result).toBe('One two three...');
  });

  it('should return original text if word count is within limit', () => {
    const text = 'One two three';
    const result = truncateByWords(text, 5);
    expect(result).toBe(text);
  });

  it('should handle single word', () => {
    const result = truncateByWords('Hello', 1);
    expect(result).toBe('Hello');
  });

  it('should handle empty string', () => {
    const result = truncateByWords('', 5);
    expect(result).toBe('');
  });
});
