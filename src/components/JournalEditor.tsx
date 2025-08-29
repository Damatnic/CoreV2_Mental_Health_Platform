/**
 * Journal Editor Component
 * Simple text editor for journal entries
 */

import * as React from 'react';
import { useState } from 'react';
import { Save, Edit3, Calendar } from 'lucide-react';

interface JournalEditorProps {
  onSave?: (content: string) => void;
  initialContent?: string;
  placeholder?: string;
}

const JournalEditor: React.FC<JournalEditorProps> = ({
  onSave,
  initialContent = '',
  placeholder = 'Write your thoughts here...'
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(content);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return React.createElement('div', { className: "journal-editor p-4 bg-white rounded-lg shadow" },
    React.createElement('div', { className: "flex items-center justify-between mb-4" },
      React.createElement('h3', { className: "text-lg font-semibold flex items-center gap-2" },
        React.createElement(Edit3, { className: "w-5 h-5" }),
        "Journal Entry"
      ),
      React.createElement('div', { className: "flex items-center gap-2 text-sm text-gray-500" },
        React.createElement(Calendar, { className: "w-4 h-4" }),
        new Date().toLocaleDateString()
      )
    ),
    
    React.createElement('textarea', {
      value: content,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value),
      placeholder: placeholder,
      className: "w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      rows: 10
    }),
    
    React.createElement('div', { className: "flex justify-between items-center mt-4" },
      React.createElement('div', { className: "text-sm text-gray-500" },
        content.length, " characters"
      ),
      React.createElement('button', {
        onClick: handleSave,
        disabled: isSaving || !content.trim(),
        className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      },
        React.createElement(Save, { className: "w-4 h-4" }),
        isSaving ? 'Saving...' : 'Save Entry'
      )
    )
  );
};

export default JournalEditor;