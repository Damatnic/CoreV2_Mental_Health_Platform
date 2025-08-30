/**
 * Journal Editor Component
 * Simple text editor for journal entries
 */

import React, { useState } from 'react';
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

  return (
    <div className="journal-editor p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Journal Entry
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={10}
      />

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          {content.length} characters
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
};

export default JournalEditor;
