/**
 * Journal View Component
 * Main view for journaling functionality
 */

import React, { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import JournalEditor from '../components/JournalEditor';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
}

const JournalView: React.FC = () => {
  const [entries] = useState<JournalEntry[]>([]);
  const [showEditor, setShowEditor] = useState(false);

  const handleSaveEntry = (content: string) => {
    console.log('Saving entry:', content);
    setShowEditor(false);
  };

  return (
    <div className="journal-view p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          My Journal
        </h1>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {showEditor ? (
        <div className="mb-6">
          <JournalEditor onSave={handleSaveEntry} />
          <button
            onClick={() => setShowEditor(false)}
            className="mt-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
              <p className="text-gray-600 mb-4">Start writing your thoughts and feelings</p>
              <button
                onClick={() => setShowEditor(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Write your first entry
              </button>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold mb-2">{entry.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{entry.date.toLocaleDateString()}</p>
                <p className="text-gray-800">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default JournalView;
