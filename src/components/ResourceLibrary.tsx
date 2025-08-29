import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Heart, BookOpen, Video, FileText, Download, Star, Share2, Clock, CheckCircle, AlertCircle, TrendingUp, Users, Award, Eye } from 'lucide-react';
import { resourceService, Resource, ResourceCategory, ResourceType, ResourceFilter, ResourceCollection } from '../services/resourceService';
import Card from './Card';
import AppButton from './AppButton';
import FormInput from './FormInput';
import Modal from './Modal';
import EnhancedToast from './EnhancedToast';

interface ResourceLibraryProps {
  userId?: string;
  onResourceSelect?: (resource: Resource) => void;
  showContributeButton?: boolean;
}

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  userId,
  onResourceSelect,
  showContributeButton = true
}) => {
  // State management
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'recent' | 'popular'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<ResourceCollection[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ResourceCollection | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Categories configuration
  const categories: { value: ResourceCategory | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'all', label: 'All Resources', icon: <BookOpen className="w-4 h-4" />, color: 'bg-gray-100' },
    { value: 'anxiety', label: 'Anxiety', icon: <AlertCircle className="w-4 h-4" />, color: 'bg-purple-100' },
    { value: 'depression', label: 'Depression', icon: <Heart className="w-4 h-4" />, color: 'bg-blue-100' },
    { value: 'stress', label: 'Stress Management', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-green-100' },
    { value: 'mindfulness', label: 'Mindfulness', icon: <Eye className="w-4 h-4" />, color: 'bg-indigo-100' },
    { value: 'relationships', label: 'Relationships', icon: <Users className="w-4 h-4" />, color: 'bg-pink-100' },
    { value: 'self-care', label: 'Self-Care', icon: <Heart className="w-4 h-4" />, color: 'bg-yellow-100' },
    { value: 'trauma', label: 'Trauma & PTSD', icon: <Award className="w-4 h-4" />, color: 'bg-red-100' },
    { value: 'sleep', label: 'Sleep & Rest', icon: <Clock className="w-4 h-4" />, color: 'bg-purple-100' },
    { value: 'crisis', label: 'Crisis Resources', icon: <AlertCircle className="w-4 h-4" />, color: 'bg-red-100' }
  ];

  // Resource types configuration
  const resourceTypes: { value: ResourceType | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All Types', icon: <FileText className="w-4 h-4" /> },
    { value: 'article', label: 'Articles', icon: <FileText className="w-4 h-4" /> },
    { value: 'video', label: 'Videos', icon: <Video className="w-4 h-4" /> },
    { value: 'worksheet', label: 'Worksheets', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'audio', label: 'Audio', icon: <Clock className="w-4 h-4" /> },
    { value: 'infographic', label: 'Infographics', icon: <Eye className="w-4 h-4" /> },
    { value: 'tool', label: 'Interactive Tools', icon: <Award className="w-4 h-4" /> }
  ];

  // Load resources and user data
  useEffect(() => {
    loadResources();
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const filter: ResourceFilter = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        isPublished: true,
        isVetted: true
      };
      const data = await resourceService.getResources(filter);
      setResources(data);
      setFilteredResources(data);
      setError(null);
    } catch (err) {
      setError('Failed to load resources. Please try again later.');
      console.error('Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!userId) return;
    try {
      const [userFavorites, userCollections] = await Promise.all([
        resourceService.getUserFavorites(userId),
        resourceService.getUserCollections(userId)
      ]);
      setFavorites(new Set(userFavorites.map(r => r.id)));
      setCollections(userCollections);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  // Filter and sort resources
  useEffect(() => {
    let filtered = [...resources];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.type === selectedType);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'relevance':
      default:
        // Relevance sorting based on multiple factors
        filtered.sort((a, b) => {
          const aScore = a.rating * 0.4 + Math.min(a.viewCount / 100, 10) * 0.3 + 
                         (favorites.has(a.id) ? 3 : 0);
          const bScore = b.rating * 0.4 + Math.min(b.viewCount / 100, 10) * 0.3 + 
                         (favorites.has(b.id) ? 3 : 0);
          return bScore - aScore;
        });
        break;
    }

    setFilteredResources(filtered);
  }, [resources, searchQuery, selectedCategory, selectedType, sortBy, favorites]);

  // Handle favorite toggle
  const toggleFavorite = useCallback(async (resourceId: string) => {
    if (!userId) {
      setToast({ message: 'Please log in to save favorites', type: 'info' });
      return;
    }

    try {
      const isFavorite = favorites.has(resourceId);
      if (isFavorite) {
        await resourceService.removeFavorite(userId, resourceId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
        setToast({ message: 'Removed from favorites', type: 'success' });
      } else {
        await resourceService.addFavorite(userId, resourceId);
        setFavorites(prev => new Set([...prev, resourceId]));
        setToast({ message: 'Added to favorites', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Failed to update favorites', type: 'error' });
      console.error('Error toggling favorite:', err);
    }
  }, [userId, favorites]);

  // Handle resource view
  const handleResourceClick = useCallback(async (resource: Resource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
    
    // Track view
    try {
      await resourceService.trackView(resource.id, userId);
    } catch (err) {
      console.error('Error tracking view:', err);
    }

    if (onResourceSelect) {
      onResourceSelect(resource);
    }
  }, [userId, onResourceSelect]);

  // Handle add to collection
  const handleAddToCollection = useCallback(async (resourceId: string, collectionId: string) => {
    if (!userId) {
      setToast({ message: 'Please log in to manage collections', type: 'info' });
      return;
    }

    try {
      await resourceService.addToCollection(collectionId, resourceId);
      setToast({ message: 'Added to collection', type: 'success' });
      loadUserData(); // Reload collections
    } catch (err) {
      setToast({ message: 'Failed to add to collection', type: 'error' });
      console.error('Error adding to collection:', err);
    }
  }, [userId]);

  // Handle resource download
  const handleDownload = useCallback(async (resource: Resource) => {
    if (resource.downloadUrl) {
      try {
        await resourceService.trackDownload(resource.id, userId);
        window.open(resource.downloadUrl, '_blank');
        setToast({ message: 'Download started', type: 'success' });
      } catch (err) {
        setToast({ message: 'Failed to download resource', type: 'error' });
        console.error('Error downloading resource:', err);
      }
    }
  }, [userId]);

  // Handle share
  const handleShare = useCallback(async (resource: Resource) => {
    const shareUrl = `${window.location.origin}/resources/${resource.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setToast({ message: 'Link copied to clipboard', type: 'success' });
      } catch (err) {
        setToast({ message: 'Failed to copy link', type: 'error' });
      }
    }
  }, []);

  // Render resource card
  const renderResourceCard = (resource: Resource) => {
    const isFavorite = favorites.has(resource.id);
    const categoryConfig = categories.find(c => c.value === resource.category);

    return (
      <Card
        key={resource.id}
        className={`resource-card transition-all duration-300 hover:shadow-lg ${
          viewMode === 'list' ? 'flex flex-row' : ''
        }`}
      >
        {/* Resource thumbnail or icon */}
        <div className={`resource-thumbnail ${viewMode === 'list' ? 'w-32 h-32 mr-4' : 'w-full h-48'} bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mb-4`}>
          {resource.thumbnailUrl ? (
            <img 
              src={resource.thumbnailUrl} 
              alt={resource.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-4xl text-blue-500">
              {resourceTypes.find(t => t.value === resource.type)?.icon || <FileText className="w-12 h-12" />}
            </div>
          )}
          {resource.isVetted && (
            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full" title="Professionally Vetted">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Resource content */}
        <div className="flex-1">
          {/* Category and type badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs ${categoryConfig?.color || 'bg-gray-100'} text-gray-700`}>
              {categoryConfig?.label}
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
              {resourceTypes.find(t => t.value === resource.type)?.label}
            </span>
          </div>

          {/* Title and description */}
          <h3 className="text-lg font-semibold mb-2 text-gray-800 hover:text-blue-600 cursor-pointer"
              onClick={() => handleResourceClick(resource)}>
            {resource.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {resource.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {resource.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {resource.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {resource.duration || 'N/A'}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                #{tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="px-2 py-1 text-gray-500 text-xs">
                +{resource.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(resource.id);
              }}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-400'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            {resource.downloadUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(resource);
                }}
                className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-colors"
                title="Download resource"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare(resource);
              }}
              className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-green-50 hover:text-green-500 transition-colors"
              title="Share resource"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    );
  };

  // Render statistics
  const renderStatistics = useMemo(() => {
    const stats = {
      total: filteredResources.length,
      articles: filteredResources.filter(r => r.type === 'article').length,
      videos: filteredResources.filter(r => r.type === 'video').length,
      worksheets: filteredResources.filter(r => r.type === 'worksheet').length,
      vetted: filteredResources.filter(r => r.isVetted).length
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Resources</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.articles}</div>
          <div className="text-xs text-gray-600">Articles</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.videos}</div>
          <div className="text-xs text-gray-600">Videos</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.worksheets}</div>
          <div className="text-xs text-gray-600">Worksheets</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.vetted}</div>
          <div className="text-xs text-gray-600">Professionally Vetted</div>
        </div>
      </div>
    );
  }, [filteredResources]);

  return (
    <div className="resource-library-container p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resource Library</h1>
        <p className="text-gray-600">
          Explore our collection of professionally vetted mental health resources
        </p>
      </div>

      {/* Statistics */}
      {renderStatistics}

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1">
            <FormInput
              type="text"
              placeholder="Search resources by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5 text-gray-400" />}
            />
          </div>

          {/* Filter controls */}
          <div className="flex gap-2">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ResourceCategory | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ResourceType | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {resourceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Sort control */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated</option>
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                title="Grid view"
              >
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-2 h-2 bg-gray-400"></div>
                  <div className="w-2 h-2 bg-gray-400"></div>
                  <div className="w-2 h-2 bg-gray-400"></div>
                  <div className="w-2 h-2 bg-gray-400"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                title="List view"
              >
                <div className="space-y-1">
                  <div className="w-4 h-1 bg-gray-400"></div>
                  <div className="w-4 h-1 bg-gray-400"></div>
                  <div className="w-4 h-1 bg-gray-400"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Quick filter chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-gray-500">Quick filters:</span>
          <button
            onClick={() => setSelectedCategory('crisis')}
            className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm hover:bg-red-200 transition-colors"
          >
            Crisis Support
          </button>
          <button
            onClick={() => {
              setFilteredResources(resources.filter(r => favorites.has(r.id)));
            }}
            className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm hover:bg-pink-200 transition-colors"
          >
            My Favorites
          </button>
          <button
            onClick={() => {
              setFilteredResources(resources.filter(r => r.isVetted));
            }}
            className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm hover:bg-green-200 transition-colors"
          >
            Professionally Vetted
          </button>
          <button
            onClick={() => setSelectedType('worksheet')}
            className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            Worksheets
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadResources}
            className="mt-2 text-sm text-red-500 underline hover:text-red-600"
          >
            Try again
          </button>
        </div>
      )}

      {/* Resources grid/list */}
      {!loading && !error && (
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
          {filteredResources.map(renderResourceCard)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No resources found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or search query
          </p>
          <AppButton
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedType('all');
            }}
            variant="secondary"
          >
            Clear Filters
          </AppButton>
        </div>
      )}

      {/* Contribute button */}
      {showContributeButton && (
        <div className="fixed bottom-6 right-6">
          <AppButton
            onClick={() => window.location.href = '/contribute'}
            className="shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Contribute Resource
          </AppButton>
        </div>
      )}

      {/* Resource detail modal */}
      <Modal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        title={selectedResource?.title || ''}
      >
        {selectedResource && (
          <div className="space-y-4">
            {/* Resource header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    categories.find(c => c.value === selectedResource.category)?.color || 'bg-gray-100'
                  } text-gray-700`}>
                    {categories.find(c => c.value === selectedResource.category)?.label}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    {resourceTypes.find(t => t.value === selectedResource.type)?.label}
                  </span>
                  {selectedResource.isVetted && (
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Professionally Vetted
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{selectedResource.description}</p>
              </div>
            </div>

            {/* Resource content preview */}
            {selectedResource.thumbnailUrl && (
              <img 
                src={selectedResource.thumbnailUrl} 
                alt={selectedResource.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200">
              <div>
                <div className="text-sm text-gray-500">Rating</div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-semibold">{selectedResource.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({selectedResource.ratingCount})</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Views</div>
                <div className="font-semibold">{selectedResource.viewCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-semibold">{selectedResource.duration || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Created</div>
                <div className="font-semibold">
                  {new Date(selectedResource.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedResource.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Related resources */}
            {selectedResource.relatedResources && selectedResource.relatedResources.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Related Resources</h4>
                <div className="space-y-2">
                  {selectedResource.relatedResources.slice(0, 3).map(relatedId => {
                    const related = resources.find(r => r.id === relatedId);
                    if (!related) return null;
                    return (
                      <button
                        key={relatedId}
                        onClick={() => handleResourceClick(related)}
                        className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-800">{related.title}</div>
                        <div className="text-sm text-gray-500">{related.type} • {related.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <AppButton
                onClick={() => {
                  if (selectedResource.url) {
                    window.open(selectedResource.url, '_blank');
                  }
                }}
                variant="primary"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Resource
              </AppButton>
              
              {selectedResource.downloadUrl && (
                <AppButton
                  onClick={() => handleDownload(selectedResource)}
                  variant="secondary"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </AppButton>
              )}
              
              <button
                onClick={() => toggleFavorite(selectedResource.id)}
                className={`p-3 rounded-lg transition-colors ${
                  favorites.has(selectedResource.id) 
                    ? 'bg-red-100 text-red-500' 
                    : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-400'
                }`}
                title={favorites.has(selectedResource.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-5 h-5 ${favorites.has(selectedResource.id) ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={() => handleShare(selectedResource)}
                className="p-3 bg-gray-100 text-gray-500 rounded-lg hover:bg-green-50 hover:text-green-500 transition-colors"
                title="Share resource"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast notification */}
      {toast && (
        <EnhancedToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Add Plus icon import (was missing)
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default ResourceLibrary;