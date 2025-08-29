/**
 * Playlist Manager Component
 * Allows users to create, edit, and manage their therapeutic music playlists
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Music,
  Clock,
  Heart,
  Share2,
  Download,
  Upload,
  Search,
  Filter,
  Copy,
  Check
} from 'lucide-react';
import {
  musicTherapyService,
  Playlist,
  MusicTrack,
  TherapeuticCategory
} from '../../services/music/musicTherapyService';
import { useAuth } from '../../contexts/AuthContext';

interface PlaylistManagerProps {
  onPlaylistSelect?: (playlist: Playlist) => void;
  onClose?: () => void;
}

interface PlaylistFormData {
  name: string;
  description: string;
  category: TherapeuticCategory;
  trackIds: string[];
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  onPlaylistSelect,
  onClose
}) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<TherapeuticCategory | 'all'>('all');
  const [availableTracks, setAvailableTracks] = useState<MusicTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<PlaylistFormData>({
    name: '',
    description: '',
    category: 'anxiety_relief',
    trackIds: []
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importExportModal, setImportExportModal] = useState<'import' | 'export' | null>(null);
  const [exportData, setExportData] = useState('');

  useEffect(() => {
    loadPlaylists();
    loadAvailableTracks();
  }, []);

  const loadPlaylists = () => {
    // Get all playlists from the service
    const allPlaylists = Array.from(musicTherapyService['playlists'].values());
    setPlaylists(allPlaylists);
  };

  const loadAvailableTracks = () => {
    // Get available tracks from the service
    const tracks = Array.from(musicTherapyService['tracks'].values());
    setAvailableTracks(tracks);
  };

  const handleCreatePlaylist = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedPlaylist(null);
    setFormData({
      name: '',
      description: '',
      category: 'anxiety_relief',
      trackIds: []
    });
    setSelectedTracks(new Set());
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsEditing(true);
    setIsCreating(false);
    setFormData({
      name: playlist.name,
      description: playlist.description,
      category: playlist.category,
      trackIds: playlist.tracks.map(t => t.id)
    });
    setSelectedTracks(new Set(playlist.tracks.map(t => t.id)));
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    // Remove playlist from service
    musicTherapyService['playlists'].delete(playlistId);
    loadPlaylists();
  };

  const handleSavePlaylist = async () => {
    if (!formData.name || formData.trackIds.length === 0) {
      alert('Please provide a name and select at least one track');
      return;
    }

    if (isCreating) {
      // Create new playlist
      await musicTherapyService.createCustomPlaylist(
        formData.name,
        formData.description,
        formData.category,
        formData.trackIds
      );
    } else if (isEditing && selectedPlaylist) {
      // Update existing playlist
      const tracks = formData.trackIds
        .map(id => musicTherapyService['tracks'].get(id))
        .filter(Boolean) as MusicTrack[];
      
      const updatedPlaylist: Playlist = {
        ...selectedPlaylist,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tracks,
        duration: tracks.reduce((sum, t) => sum + t.duration, 0),
        updatedAt: new Date()
      };

      musicTherapyService['playlists'].set(selectedPlaylist.id, updatedPlaylist);
    }

    // Reset form and reload
    setIsCreating(false);
    setIsEditing(false);
    setSelectedPlaylist(null);
    setFormData({
      name: '',
      description: '',
      category: 'anxiety_relief',
      trackIds: []
    });
    setSelectedTracks(new Set());
    loadPlaylists();
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedPlaylist(null);
    setFormData({
      name: '',
      description: '',
      category: 'anxiety_relief',
      trackIds: []
    });
    setSelectedTracks(new Set());
  };

  const toggleTrackSelection = (trackId: string) => {
    const newSelection = new Set(selectedTracks);
    if (newSelection.has(trackId)) {
      newSelection.delete(trackId);
    } else {
      newSelection.add(trackId);
    }
    setSelectedTracks(newSelection);
    setFormData({
      ...formData,
      trackIds: Array.from(newSelection)
    });
  };

  const handleDuplicatePlaylist = async (playlist: Playlist) => {
    const duplicatedPlaylist = await musicTherapyService.createCustomPlaylist(
      `${playlist.name} (Copy)`,
      playlist.description,
      playlist.category,
      playlist.tracks.map(t => t.id)
    );
    loadPlaylists();
  };

  const handleSharePlaylist = (playlist: Playlist) => {
    // Create shareable link or code
    const shareData = {
      name: playlist.name,
      description: playlist.description,
      category: playlist.category,
      tracks: playlist.tracks.map(t => ({
        title: t.title,
        artist: t.artist,
        duration: t.duration
      }))
    };

    const shareCode = btoa(JSON.stringify(shareData));
    navigator.clipboard.writeText(shareCode);
    setCopiedId(playlist.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportPlaylist = (playlist: Playlist) => {
    const exportData = {
      name: playlist.name,
      description: playlist.description,
      category: playlist.category,
      tracks: playlist.tracks,
      createdAt: playlist.createdAt,
      version: '1.0'
    };

    setExportData(JSON.stringify(exportData, null, 2));
    setImportExportModal('export');
  };

  const handleImportPlaylist = () => {
    setImportExportModal('import');
  };

  const processImport = async (importData: string) => {
    try {
      const data = JSON.parse(importData);
      
      // Create new playlist from imported data
      await musicTherapyService.createCustomPlaylist(
        data.name,
        data.description,
        data.category,
        data.tracks.map((t: any) => t.id)
      );
      
      loadPlaylists();
      setImportExportModal(null);
      alert('Playlist imported successfully!');
    } catch (error) {
      alert('Failed to import playlist. Please check the format.');
    }
  };

  const handleDownloadOffline = async (playlist: Playlist) => {
    const success = await musicTherapyService.cachePlaylistForOffline(playlist.id);
    if (success) {
      alert('Playlist cached for offline listening!');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  const filteredPlaylists = playlists.filter(playlist => {
    const matchesSearch = playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playlist.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || playlist.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="playlist-manager">
      {/* Header */}
      <div className="manager-header">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Playlist Manager
        </h2>
        <div className="header-actions">
          <button
            onClick={handleCreatePlaylist}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            <span>Create Playlist</span>
          </button>
          <button
            onClick={handleImportPlaylist}
            className="btn-secondary"
          >
            <Upload className="w-5 h-5" />
            <span>Import</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as TherapeuticCategory | 'all')}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="anxiety_relief">Anxiety Relief</option>
            <option value="focus">Focus</option>
            <option value="sleep">Sleep</option>
            <option value="meditation">Meditation</option>
            <option value="energy_boost">Energy Boost</option>
            <option value="depression_support">Depression Support</option>
            <option value="stress_relief">Stress Relief</option>
          </select>
        </div>
      </div>

      {/* Playlist Form */}
      {(isCreating || isEditing) && (
        <div className="playlist-form">
          <h3 className="form-title">
            {isCreating ? 'Create New Playlist' : 'Edit Playlist'}
          </h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                placeholder="Enter playlist name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TherapeuticCategory })}
                className="form-select"
              >
                <option value="anxiety_relief">Anxiety Relief</option>
                <option value="focus">Focus</option>
                <option value="sleep">Sleep</option>
                <option value="meditation">Meditation</option>
                <option value="energy_boost">Energy Boost</option>
                <option value="depression_support">Depression Support</option>
                <option value="stress_relief">Stress Relief</option>
              </select>
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
                placeholder="Enter playlist description"
                rows={3}
              />
            </div>
          </div>

          {/* Track Selection */}
          <div className="track-selection">
            <h4 className="section-title">Select Tracks</h4>
            <div className="tracks-grid">
              {availableTracks.map(track => (
                <div
                  key={track.id}
                  onClick={() => toggleTrackSelection(track.id)}
                  className={`track-item ${selectedTracks.has(track.id) ? 'selected' : ''}`}
                >
                  <div className="track-checkbox">
                    {selectedTracks.has(track.id) && <Check className="w-4 h-4" />}
                  </div>
                  <div className="track-info">
                    <p className="track-title">{track.title}</p>
                    <p className="track-artist">{track.artist}</p>
                  </div>
                  <div className="track-duration">
                    {formatDuration(track.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              onClick={handleCancel}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePlaylist}
              className="btn-save"
            >
              <Save className="w-5 h-5" />
              <span>Save Playlist</span>
            </button>
          </div>
        </div>
      )}

      {/* Playlists Grid */}
      <div className="playlists-grid">
        {filteredPlaylists.map(playlist => (
          <div key={playlist.id} className="playlist-card">
            <div className="playlist-header">
              <div className="playlist-icon">
                <Music className="w-8 h-8" />
              </div>
              <div className="playlist-meta">
                <span className="playlist-category">
                  {playlist.category.replace('_', ' ')}
                </span>
                {playlist.isCustom && (
                  <span className="custom-badge">Custom</span>
                )}
              </div>
            </div>
            
            <div className="playlist-body">
              <h3 className="playlist-name">{playlist.name}</h3>
              <p className="playlist-description">{playlist.description}</p>
              
              <div className="playlist-stats">
                <div className="stat">
                  <Music className="w-4 h-4" />
                  <span>{playlist.tracks.length} tracks</span>
                </div>
                <div className="stat">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(playlist.duration)}</span>
                </div>
              </div>
            </div>

            <div className="playlist-actions">
              <button
                onClick={() => onPlaylistSelect?.(playlist)}
                className="action-btn primary"
                title="Play playlist"
              >
                Play
              </button>
              
              {playlist.isCustom && (
                <>
                  <button
                    onClick={() => handleEditPlaylist(playlist)}
                    className="action-btn"
                    title="Edit playlist"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="action-btn danger"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              
              <button
                onClick={() => handleDuplicatePlaylist(playlist)}
                className="action-btn"
                title="Duplicate playlist"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleSharePlaylist(playlist)}
                className="action-btn"
                title="Share playlist"
              >
                {copiedId === playlist.id ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={() => handleExportPlaylist(playlist)}
                className="action-btn"
                title="Export playlist"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleDownloadOffline(playlist)}
                className="action-btn"
                title="Download for offline"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Import/Export Modal */}
      {importExportModal && (
        <div className="modal-overlay" onClick={() => setImportExportModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {importExportModal === 'import' ? 'Import Playlist' : 'Export Playlist'}
              </h3>
              <button
                onClick={() => setImportExportModal(null)}
                className="modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="modal-body">
              {importExportModal === 'import' ? (
                <div>
                  <p className="mb-4">Paste the playlist data below:</p>
                  <textarea
                    className="import-textarea"
                    placeholder="Paste playlist JSON here..."
                    rows={10}
                    onChange={(e) => setExportData(e.target.value)}
                  />
                  <button
                    onClick={() => processImport(exportData)}
                    className="btn-primary mt-4"
                  >
                    Import Playlist
                  </button>
                </div>
              ) : (
                <div>
                  <p className="mb-4">Copy the playlist data below:</p>
                  <textarea
                    className="export-textarea"
                    value={exportData}
                    readOnly
                    rows={10}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportData);
                      alert('Playlist data copied to clipboard!');
                    }}
                    className="btn-primary mt-4"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .playlist-manager {
          @apply bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6;
          @apply max-w-6xl mx-auto;
        }

        .manager-header {
          @apply flex justify-between items-center mb-6;
        }

        .header-actions {
          @apply flex gap-3;
        }

        .btn-primary {
          @apply flex items-center gap-2 px-4 py-2 rounded-lg;
          @apply bg-gradient-to-r from-purple-500 to-blue-500 text-white;
          @apply hover:from-purple-600 hover:to-blue-600;
          @apply transition-all;
        }

        .btn-secondary {
          @apply flex items-center gap-2 px-4 py-2 rounded-lg;
          @apply bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300;
          @apply hover:bg-gray-200 dark:hover:bg-gray-700;
          @apply transition-colors;
        }

        .btn-close {
          @apply p-2 rounded-lg;
          @apply text-gray-500 hover:text-gray-700 dark:hover:text-gray-300;
          @apply hover:bg-gray-100 dark:hover:bg-gray-800;
          @apply transition-colors;
        }

        .search-filter-section {
          @apply flex gap-4 mb-6;
        }

        .search-box {
          @apply flex-1 flex items-center gap-2 px-4 py-2 rounded-lg;
          @apply bg-gray-100 dark:bg-gray-800;
        }

        .search-input {
          @apply flex-1 bg-transparent outline-none;
          @apply text-gray-700 dark:text-gray-300;
        }

        .filter-box {
          @apply flex items-center gap-2 px-4 py-2 rounded-lg;
          @apply bg-gray-100 dark:bg-gray-800;
        }

        .filter-select {
          @apply bg-transparent outline-none;
          @apply text-gray-700 dark:text-gray-300;
        }

        .playlist-form {
          @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6;
        }

        .form-title {
          @apply text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4;
        }

        .form-grid {
          @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-6;
        }

        .form-group {
          @apply space-y-2;
        }

        .form-label {
          @apply text-sm font-medium text-gray-600 dark:text-gray-400;
        }

        .form-input,
        .form-select,
        .form-textarea {
          @apply w-full px-3 py-2 rounded-lg;
          @apply bg-white dark:bg-gray-700;
          @apply border border-gray-300 dark:border-gray-600;
          @apply text-gray-700 dark:text-gray-300;
          @apply focus:outline-none focus:ring-2 focus:ring-purple-500;
        }

        .col-span-2 {
          @apply md:col-span-2;
        }

        .track-selection {
          @apply mb-6;
        }

        .section-title {
          @apply text-sm font-medium text-gray-600 dark:text-gray-400 mb-3;
        }

        .tracks-grid {
          @apply max-h-64 overflow-y-auto;
          @apply bg-white dark:bg-gray-700 rounded-lg p-2;
        }

        .track-item {
          @apply flex items-center gap-3 p-2 rounded-lg cursor-pointer;
          @apply hover:bg-gray-100 dark:hover:bg-gray-600;
          @apply transition-colors;
        }

        .track-item.selected {
          @apply bg-purple-100 dark:bg-purple-900/30;
        }

        .track-checkbox {
          @apply w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500;
          @apply flex items-center justify-center;
        }

        .track-item.selected .track-checkbox {
          @apply bg-purple-500 border-purple-500 text-white;
        }

        .track-info {
          @apply flex-1;
        }

        .track-title {
          @apply text-sm font-medium text-gray-800 dark:text-gray-200;
        }

        .track-artist {
          @apply text-xs text-gray-500 dark:text-gray-400;
        }

        .track-duration {
          @apply text-xs text-gray-500 dark:text-gray-400;
        }

        .form-actions {
          @apply flex justify-end gap-3;
        }

        .btn-cancel {
          @apply px-4 py-2 rounded-lg;
          @apply text-gray-600 dark:text-gray-400;
          @apply hover:bg-gray-100 dark:hover:bg-gray-700;
          @apply transition-colors;
        }

        .btn-save {
          @apply flex items-center gap-2 px-4 py-2 rounded-lg;
          @apply bg-green-500 text-white;
          @apply hover:bg-green-600;
          @apply transition-colors;
        }

        .playlists-grid {
          @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
        }

        .playlist-card {
          @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4;
          @apply hover:shadow-lg transition-shadow;
        }

        .playlist-header {
          @apply flex justify-between items-start mb-3;
        }

        .playlist-icon {
          @apply w-16 h-16 rounded-lg;
          @apply bg-gradient-to-br from-purple-400 to-blue-400;
          @apply flex items-center justify-center text-white;
        }

        .playlist-meta {
          @apply flex flex-col items-end gap-1;
        }

        .playlist-category {
          @apply text-xs text-gray-500 dark:text-gray-400 capitalize;
        }

        .custom-badge {
          @apply text-xs px-2 py-1 rounded-full;
          @apply bg-purple-100 dark:bg-purple-900/30;
          @apply text-purple-600 dark:text-purple-400;
        }

        .playlist-body {
          @apply mb-4;
        }

        .playlist-name {
          @apply text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1;
        }

        .playlist-description {
          @apply text-sm text-gray-600 dark:text-gray-400 mb-3;
          @apply line-clamp-2;
        }

        .playlist-stats {
          @apply flex gap-4;
        }

        .stat {
          @apply flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400;
        }

        .playlist-actions {
          @apply flex flex-wrap gap-2;
        }

        .action-btn {
          @apply p-2 rounded-lg;
          @apply bg-white dark:bg-gray-700;
          @apply text-gray-600 dark:text-gray-400;
          @apply hover:bg-gray-100 dark:hover:bg-gray-600;
          @apply transition-colors;
        }

        .action-btn.primary {
          @apply px-4 bg-purple-500 text-white hover:bg-purple-600;
        }

        .action-btn.danger {
          @apply hover:bg-red-100 dark:hover:bg-red-900/30;
          @apply hover:text-red-600 dark:hover:text-red-400;
        }

        .modal-overlay {
          @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
        }

        .modal-content {
          @apply bg-white dark:bg-gray-900 rounded-xl p-6;
          @apply max-w-2xl w-full max-h-[80vh] overflow-y-auto;
        }

        .modal-header {
          @apply flex justify-between items-center mb-4;
        }

        .modal-title {
          @apply text-xl font-semibold text-gray-800 dark:text-gray-100;
        }

        .modal-close {
          @apply p-2 rounded-lg;
          @apply text-gray-500 hover:text-gray-700 dark:hover:text-gray-300;
          @apply hover:bg-gray-100 dark:hover:bg-gray-800;
          @apply transition-colors;
        }

        .modal-body {
          @apply text-gray-700 dark:text-gray-300;
        }

        .import-textarea,
        .export-textarea {
          @apply w-full p-3 rounded-lg;
          @apply bg-gray-100 dark:bg-gray-800;
          @apply text-sm font-mono;
          @apply focus:outline-none focus:ring-2 focus:ring-purple-500;
        }
      `}</style>
    </div>
  );
};