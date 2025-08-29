/**
 * Sanitize HTML Test Suite
 * Tests HTML sanitization and safe markdown conversion
 */

import { sanitizeHtml, safeMarkdownToHtml, createSafeHtml } from './sanitizeHtml';

// Mock DOM methods
const mockDiv = {
  textContent: '',
  innerHTML: ''
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockDiv),
  writable: true
});

// Mock URL constructor for link validation
const mockURL = jest.fn();
global.URL = mockURL as any;

describe('sanitizeHtml', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDiv.textContent = '';
    mockDiv.innerHTML = '';
  });

  describe('sanitizeHtml', () => {
    it('should sanitize basic HTML by escaping dangerous elements', () => {
      const dangerousHtml = '<script>alert("XSS")</script><p>Safe content</p>';

      // Mock the DOM behavior
      Object.defineProperty(mockDiv, 'textContent', {
        set(value) {
          // Simulate browser textContent behavior - strips HTML
          this._textContent = value;
          this.innerHTML = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },
        get() { return this._textContent; },
        configurable: true
      });

      const result = sanitizeHtml(dangerousHtml);

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(result).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;&lt;p&gt;Safe content&lt;/p&gt;');
    });

    it('should handle empty input', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const plainText = 'This is just plain text';
      mockDiv.innerHTML = plainText;
      const result = sanitizeHtml(plainText);
      expect(result).toBe(plainText);
    });

    it('should escape special characters', () => {
      const textWithSpecialChars = 'Text with <>&"\' characters';
      mockDiv.innerHTML = 'Text with &lt;&gt;&amp;""\' characters';
      const result = sanitizeHtml(textWithSpecialChars);
      expect(result).toBe('Text with &lt;&gt;&amp;""\' characters');
    });
  });

  describe('safeMarkdownToHtml', () => {
    beforeEach(() => {
      // Mock URL constructor to validate URLs
      mockURL.mockImplementation((url) => {
        const validUrls = ['https://example.com', 'http://test.org', 'mailto:test@example.com'];
        const relativeUrls = ['/path', '#anchor'];

        if (validUrls.includes(url) || relativeUrls.includes(url)) {
          return { protocol: url.startsWith('https') ? 'https:' : url.startsWith('http') ? 'http:' : 'mailto:' };
        }

        if (url.startsWith('javascript:') || url.startsWith('data:')) {
          throw new Error('Invalid protocol');
        }

        return { protocol: 'https:' };
      });
    });

    it('should return empty string for empty input', () => {
      const result = safeMarkdownToHtml('');
      expect(result).toBe('');
    });

    it('should return empty string for null input', () => {
      const result = safeMarkdownToHtml(null as any);
      expect(result).toBe('');
    });

    it('should convert bold markdown to HTML', () => {
      const markdown = 'This is **bold** text';
      mockDiv.innerHTML = 'This is **bold** text'; // Mock escaping
      const result = safeMarkdownToHtml(markdown);
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should convert italic markdown to HTML', () => {
      const markdown = 'This is *italic* text';
      mockDiv.innerHTML = 'This is *italic* text';
      const result = safeMarkdownToHtml(markdown);
      expect(result).toContain('<em>italic</em>');
    });

    it('should convert line breaks to <br> tags', () => {
      const markdown = 'Line 1\nLine 2\nLine 3';
      mockDiv.innerHTML = 'Line 1\nLine 2\nLine 3';
      const result = safeMarkdownToHtml(markdown);
      expect(result).toBe('Line 1<br>Line 2<br>Line 3');
    });

    it('should convert valid links to HTML', () => {
      const markdown = 'Visit [Example](https://example.com) for more info';
      mockDiv.innerHTML = 'Visit [Example](https://example.com) for more info';
      const result = safeMarkdownToHtml(markdown);
      expect(result).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>');
    });

    it('should handle mailto links', () => {
      const markdown = 'Contact [us](mailto:test@example.com)';
      mockDiv.innerHTML = 'Contact [us](mailto:test@example.com)';
      const result = safeMarkdownToHtml(markdown);
      expect(result).toContain('<a href="mailto:test@example.com" target="_blank" rel="noopener noreferrer">us</a>');
    });

    it('should handle relative links', () => {
      const markdown = 'Go to [home page](/) or [section](#section)';
      mockDiv.innerHTML = 'Go to [home page](/) or [section](#section)';
      const result = safeMarkdownToHtml(markdown);
      expect(result).toContain('<a href="/" target="_blank" rel="noopener noreferrer">home page</a>');
      expect(result).toContain('<a href="#section" target="_blank" rel="noopener noreferrer">section</a>');
    });

    it('should reject dangerous javascript: links', () => {
      const markdown = 'Dangerous [link](javascript:alert("XSS"))';
      mockDiv.innerHTML = 'Dangerous [link](javascript:alert("XSS"))';
      // Mock URL constructor to throw for javascript: protocol
      mockURL.mockImplementation((url) => {
        if (url.startsWith('javascript:')) {
          throw new Error('Invalid protocol');
        }
        return { protocol: 'https:' };
      });
      const result = safeMarkdownToHtml(markdown);
      // Should return the escaped original text when URL is invalid
      expect(result).toContain('Dangerous [link](javascript:alert("XSS"))');
      expect(result).not.toContain('<a href="javascript:">');
    });

    it('should reject data: URLs', () => {
      const markdown = 'Image [data](data:text/html,<script>alert(1)</script>)';
      mockDiv.innerHTML = 'Image [data](data:text/html,<script>alert(1)</script>)';

      mockURL.mockImplementation((url) => {
        if (url.startsWith('data:')) {
          throw new Error('Invalid protocol');
        }
        return { protocol: 'https:' };
      });
      const result = safeMarkdownToHtml(markdown);
      expect(result).not.toContain('<a href="data:">');
    });

    it('should handle multiple markdown formats in one string', () => {
      const markdown = 'This has **bold**, *italic*, and [link](https://example.com)\nOn multiple lines';
      mockDiv.innerHTML = 'This has **bold**, *italic*, and [link](https://example.com)\nOn multiple lines';
      const result = safeMarkdownToHtml(markdown);
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('<br>');
    });

    it('should escape HTML in markdown before processing', () => {
      const maliciousMarkdown = '<script>alert("XSS")</script>**bold**';
      mockDiv.innerHTML = '&lt;script&gt;alert("XSS")&lt;/script&gt;**bold**';
      const result = safeMarkdownToHtml(maliciousMarkdown);

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).not.toContain('<script>');
    });

    it('should handle nested markdown correctly', () => {
      const markdown = 'This is ***bold and italic*** text';
      mockDiv.innerHTML = 'This is ***bold and italic*** text';
      const result = safeMarkdownToHtml(markdown);
      // Should handle the outer ** first, then inner *
      expect(result).toContain('<strong><em>bold and italic</em></strong>');
    });

    it('should handle edge cases with empty markdown patterns', () => {
      const markdown = 'Empty ** and * patterns []() too';
      mockDiv.innerHTML = 'Empty ** and * patterns []() too';
      const result = safeMarkdownToHtml(markdown);
      // Should not create empty tags
      expect(result).not.toContain('<strong></strong>');
      expect(result).not.toContain('<em></em>');
      expect(result).not.toContain('<a href="">');
    });
  });

  describe('createSafeHtml', () => {
    it('should return object with __html property', () => {
      const content = 'This is **bold** text';
      const result = createSafeHtml(content);

      expect(result).toHaveProperty('__html');
      expect(typeof result.__html).toBe('string');
    });

    it('should process markdown through safeMarkdownToHtml', () => {
      const content = 'This is **bold** text';
      mockDiv.innerHTML = 'This is **bold** text';
      const result = createSafeHtml(content);

      expect(result.__html).toContain('<strong>bold</strong>');
    });

    it('should handle empty content', () => {
      const result = createSafeHtml('');
      expect(result.__html).toBe('');
    });

    it('should be compatible with React dangerouslySetInnerHTML', () => {
      const content = 'Safe *markdown* content';
      mockDiv.innerHTML = 'Safe *markdown* content';
      const result = createSafeHtml(content);

      // Should have the correct structure for React
      expect(result).toEqual({
        __html: expect.stringContaining('<em>markdown</em>')
      });
    });
  });

  describe('integration and real-world scenarios', () => {
    it('should handle user-generated content safely', () => {
      const userContent = `
        Here's my **important** message with a [link](https://trusted-site.com).
        <script>alert("This should be escaped")</script>
        And some *emphasis* text.
      `;
      mockDiv.innerHTML = userContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const result = safeMarkdownToHtml(userContent);

      expect(result).toContain('<strong>important</strong>');
      expect(result).toContain('<em>emphasis</em>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should handle comment-like content', () => {
      const comment = 'Great post! **Thanks** for sharing [this link](https://example.com)';
      mockDiv.innerHTML = comment;
      const result = safeMarkdownToHtml(comment);

      expect(result).toContain('<strong>Thanks</strong>');
      expect(result).toContain('<a href="https://example.com"');
    });

    it('should handle forum post content', () => {
      const forumPost = `
        **Update:** The issue is resolved!\n\n
        Thanks to [everyone](https://forum.example.com/users) who helped.
        *Note*: This affects versions 1.0-2.0 only.
      `;
      mockDiv.innerHTML = forumPost;
      const result = safeMarkdownToHtml(forumPost);

      expect(result).toContain('<strong>Update:</strong>');
      expect(result).toContain('<em>Note</em>');
      expect(result).toContain('<br>');
    });
  });

  describe('performance and edge cases', () => {
    it('should handle very long content efficiently', () => {
      const longContent = 'This is **bold** text. '.repeat(1000);
      mockDiv.innerHTML = longContent;
      const startTime = performance.now();
      const result = safeMarkdownToHtml(longContent);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should handle special regex characters in content', () => {
      const specialChars = 'Text with $1 and [brackets] and (parens) and *asterisks*';
      mockDiv.innerHTML = specialChars;
      const result = safeMarkdownToHtml(specialChars);

      expect(result).toContain('<em>asterisks</em>');
      expect(result).toContain('$1'); // Should preserve other special chars
    });

    it('should handle malformed markdown gracefully', () => {
      const malformedMarkdown = '**unclosed bold and *unclosed italic and [unclosed link';
      mockDiv.innerHTML = malformedMarkdown;
      const result = safeMarkdownToHtml(malformedMarkdown);

      // Should not crash and should return some reasonable output
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should maintain performance with many links', () => {
      const manyLinks = Array.from({ length: 100 }, (_, i) =>
        `[Link ${i}](https://example.com/${i})`
      ).join(' ');

      mockDiv.innerHTML = manyLinks;
      const startTime = performance.now();
      const result = safeMarkdownToHtml(manyLinks);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should handle many links efficiently
      expect(result).toContain('<a href="https://example.com/0"');
      expect(result).toContain('<a href="https://example.com/99"');
    });
  });

  describe('security considerations', () => {
    it('should prevent XSS through various vectors', () => {
      const xssAttempts = [
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      xssAttempts.forEach(attempt => {
        mockDiv.innerHTML = attempt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const result = safeMarkdownToHtml(attempt);

        expect(result).not.toContain('<script>');
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('onerror=');
        expect(result).not.toContain('onload=');
      });
    });

    it('should sanitize link URLs properly', () => {
      const dangerousLinks = [
        '[Click](javascript:alert(1))',
        '[File](data:text/html,<h1>Test</h1>)',
        '[Bad](vbscript:msgbox(1))'
      ];

      dangerousLinks.forEach(link => {
        mockDiv.innerHTML = link;

        // Mock URL to throw for dangerous protocols
        mockURL.mockImplementation((url) => {
          if (url.match(/^(javascript|data|vbscript):/)) {
            throw new Error('Dangerous protocol');
          }
          return { protocol: 'https:' };
        });
        const result = safeMarkdownToHtml(link);
        expect(result).not.toContain('href="javascript:"');
        expect(result).not.toContain('href="data:"');
        expect(result).not.toContain('href="vbscript:"');
      });
    });
  });
});

// Dummy test to keep suite active
describe('Test Suite Active', () => {
  it('Placeholder test to prevent empty suite', () => {
    expect(true).toBe(true);
  });
});