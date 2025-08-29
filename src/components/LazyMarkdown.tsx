import React, { useState, useEffect, useRef } from 'react';
import { FileText, AlertCircle, Loader2, Eye, EyeOff, Copy, Check, Download } from 'lucide-react';

interface LazyMarkdownProps {
  content: string;
  className?: string;
  showPreview?: boolean;
  allowEdit?: boolean;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  maxHeight?: string;
  enableSyntaxHighlight?: boolean;
  showWordCount?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface MarkdownOptions {
  breaks: boolean;
  linkify: boolean;
  typographer: boolean;
  sanitize: boolean;
}

export const LazyMarkdown: React.FC<LazyMarkdownProps> = ({
  content = '',
  className = '',
  showPreview = true,
  allowEdit = false,
  onContentChange,
  placeholder = 'Start writing your markdown...',
  maxHeight = '400px',
  showWordCount = false,
  autoSave = false,
  autoSaveDelay = 1000
}) => {
  const [isEditing, setIsEditing] = useState(!showPreview);
  const [currentContent, setCurrentContent] = useState(content);
  const [previewContent, setPreviewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();



  useEffect(() => {
    setCurrentContent(content);
  }, [content]);

  useEffect(() => {
    if (showPreview && currentContent) {
      renderMarkdown();
    }
  }, [currentContent, showPreview]);

  useEffect(() => {
    if (showWordCount) {
      const words = currentContent.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  }, [currentContent, showWordCount]);

  useEffect(() => {
    if (autoSave && onContentChange) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(async () => {
        if (currentContent !== content) {
          setIsSaving(true);
          await onContentChange(currentContent);
          setIsSaving(false);
        }
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentContent, autoSave, onContentChange, content, autoSaveDelay]);

  const renderMarkdown = async () => {
    if (!currentContent.trim()) {
      setPreviewContent('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simple markdown parsing (in a real app, use a proper markdown library)
      let html = currentContent
        // Headers
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-900 mb-2 mt-4">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-gray-900 mb-3 mt-6">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mb-4 mt-8">$1</h1>')
        
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto my-3"><code class="text-sm font-mono">$1</code></pre>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono">$1</code>')
        
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
        
        // Lists
        .replace(/^\* (.*$)/gm, '<li class="ml-4">• $1</li>')
        .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
        
        // Line breaks
        .replace(/\n/g, '<br>');

      // Wrap consecutive list items
      html = html.replace(/(<li[^>]*>.*?<\/li>)(<br>)?(<li[^>]*>.*?<\/li>)/g, '<ul class="my-2">$1$3</ul>');

      setPreviewContent(html);

    } catch (err) {
      console.error('Markdown rendering failed:', err);
      setError('Failed to render markdown preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setCurrentContent(newContent);
    
    if (!autoSave && onContentChange) {
      onContentChange(newContent);
    }
  };

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = currentContent.substring(0, start) + '  ' + currentContent.substring(end);
      setCurrentContent(newContent);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([currentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const insertMarkdown = (before: string, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentContent.substring(start, end);
    const replacement = before + (selectedText || placeholder) + after;
    
    const newContent = currentContent.substring(0, start) + replacement + currentContent.substring(end);
    setCurrentContent(newContent);
    
    // Set cursor position
    setTimeout(() => {
      const newStart = start + before.length;
      const newEnd = newStart + (selectedText || placeholder).length;
      textarea.setSelectionRange(newStart, newEnd);
      textarea.focus();
    }, 0);
  };

  const MarkdownToolbar = () => (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
      <button
        onClick={() => insertMarkdown('**', '**', 'bold text')}
        className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800"
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => insertMarkdown('*', '*', 'italic text')}
        className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800"
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => insertMarkdown('`', '`', 'code')}
        className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 font-mono text-sm"
        title="Inline Code"
      >
        {'</>'}
      </button>
      <button
        onClick={() => insertMarkdown('```\n', '\n```', 'code block')}
        className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 text-sm"
        title="Code Block"
      >
        Code
      </button>
      <button
        onClick={() => insertMarkdown('[', '](url)', 'link text')}
        className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 text-sm"
        title="Link"
      >
        Link
      </button>
      <button
        onClick={() => insertMarkdown('- ', '', 'list item')}
        className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 text-sm"
        title="List"
      >
        List
      </button>
      
      <div className="ml-auto flex items-center gap-2">
        {showWordCount && (
          <span className="text-xs text-gray-500">
            {wordCount} words
          </span>
        )}
        
        {isSaving && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </div>
        )}
        
        <button
          onClick={copyToClipboard}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800"
          title="Copy"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
        
        <button
          onClick={downloadMarkdown}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`lazy-markdown border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">
            {allowEdit && isEditing ? 'Editor' : 'Preview'}
          </span>
        </div>
        
        {allowEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              {isEditing ? (
                <>
                  <Eye className="w-4 h-4" />
                  Preview
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Edit
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="relative">
        {allowEdit && isEditing ? (
          <div>
            <MarkdownToolbar />
            <textarea
              ref={textareaRef}
              value={currentContent}
              onChange={handleContentChange}
              onKeyDown={handleTabKey}
              placeholder={placeholder}
              className="w-full p-4 border-0 resize-none focus:outline-none focus:ring-0 font-mono text-sm"
              style={{ height: maxHeight, minHeight: '200px' }}
            />
          </div>
        ) : (
          <div 
            className="p-4 prose max-w-none"
            style={{ maxHeight, overflowY: 'auto' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Rendering preview...</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            ) : previewContent ? (
              <div 
                className="prose-sm prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            ) : (
              <div className="text-gray-500 text-center py-8">
                {currentContent.trim() ? 'No preview available' : 'No content to preview'}
              </div>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && !isEditing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading preview...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {(showWordCount || autoSave) && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          {showWordCount && (
            <span>{wordCount} words • {currentContent.length} characters</span>
          )}
          
          {autoSave && (
            <div className="flex items-center gap-1">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  Saved
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Markdown preview-only component
export const MarkdownPreview: React.FC<{
  content: string;
  className?: string;
  maxHeight?: string;
}> = ({ content, className = '', maxHeight = '400px' }) => (
  <LazyMarkdown
    content={content}
    className={className}
    showPreview={true}
    allowEdit={false}
    maxHeight={maxHeight}
  />
);

// Markdown editor-only component
export const MarkdownEditor: React.FC<{
  content: string;
  onChange: (content: string) => void;
  className?: string;
  placeholder?: string;
  maxHeight?: string;
  autoSave?: boolean;
}> = ({ content, onChange, className = '', placeholder, maxHeight, autoSave }) => (
  <LazyMarkdown
    content={content}
    onContentChange={onChange}
    className={className}
    showPreview={false}
    allowEdit={true}
    placeholder={placeholder}
    maxHeight={maxHeight}
    autoSave={autoSave}
    showWordCount={true}
  />
);

export default LazyMarkdown;
