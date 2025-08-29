import React, { useState, useEffect } from 'react';
import { Book, Video, Award, CheckCircle, Clock, User, Star, Play, Download, ExternalLink, BookOpen, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'fundamentals' | 'crisis' | 'communication' | 'ethics' | 'advanced';
  type: 'video' | 'reading' | 'interactive' | 'assessment';
  duration: number; // in minutes
  completed: boolean;
  score?: number;
  progress: number; // 0-100
  required: boolean;
  prerequisites: string[];
  tags: string[];
  lastAccessed?: Date;
}

interface TrainingProgress {
  totalModules: number;
  completedModules: number;
  totalHours: number;
  completedHours: number;
  averageScore: number;
  certificates: number;
  streakDays: number;
}

const categoryColors = {
  fundamentals: 'bg-blue-100 text-blue-800 border-blue-200',
  crisis: 'bg-red-100 text-red-800 border-red-200',
  communication: 'bg-green-100 text-green-800 border-green-200',
  ethics: 'bg-purple-100 text-purple-800 border-purple-200',
  advanced: 'bg-orange-100 text-orange-800 border-orange-200',
};

const categoryIcons = {
  fundamentals: Book,
  crisis: Award,
  communication: Users,
  ethics: Star,
  advanced: BookOpen,
};

export const HelperTrainingRoute: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock training modules
      setModules([
        {
          id: '1',
          title: 'Introduction to Mental Health Support',
          description: 'Learn the fundamentals of providing mental health support and understanding common mental health conditions.',
          category: 'fundamentals',
          type: 'video',
          duration: 45,
          completed: true,
          score: 92,
          progress: 100,
          required: true,
          prerequisites: [],
          tags: ['introduction', 'mental health', 'basics'],
          lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          title: 'Crisis Intervention Techniques',
          description: 'Essential skills for recognizing and responding to mental health crises effectively and safely.',
          category: 'crisis',
          type: 'interactive',
          duration: 60,
          completed: true,
          score: 88,
          progress: 100,
          required: true,
          prerequisites: ['1'],
          tags: ['crisis', 'intervention', 'safety'],
          lastAccessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          title: 'Active Listening and Communication',
          description: 'Develop effective communication skills and learn advanced active listening techniques.',
          category: 'communication',
          type: 'video',
          duration: 40,
          completed: false,
          progress: 65,
          required: true,
          prerequisites: ['1'],
          tags: ['communication', 'listening', 'skills'],
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: '4',
          title: 'Ethical Guidelines and Boundaries',
          description: 'Understand professional ethics, maintain appropriate boundaries, and handle ethical dilemmas.',
          category: 'ethics',
          type: 'reading',
          duration: 30,
          completed: false,
          progress: 0,
          required: true,
          prerequisites: ['1', '2'],
          tags: ['ethics', 'boundaries', 'professional'],
        },
        {
          id: '5',
          title: 'Trauma-Informed Care Principles',
          description: 'Learn about trauma-informed approaches to care and supporting trauma survivors.',
          category: 'advanced',
          type: 'video',
          duration: 55,
          completed: false,
          progress: 0,
          required: false,
          prerequisites: ['1', '2', '3'],
          tags: ['trauma', 'care', 'advanced'],
        },
        {
          id: '6',
          title: 'De-escalation Strategies',
          description: 'Master techniques for de-escalating tense situations and managing emotional intensity.',
          category: 'crisis',
          type: 'interactive',
          duration: 50,
          completed: false,
          progress: 25,
          required: true,
          prerequisites: ['2'],
          tags: ['de-escalation', 'crisis', 'strategies'],
        },
      ]);

      // Mock progress data
      setProgress({
        totalModules: 6,
        completedModules: 2,
        totalHours: 4.5,
        completedHours: 1.75,
        averageScore: 90,
        certificates: 1,
        streakDays: 3,
      });

    } catch (error) {
      console.error('Failed to load training data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getTypeIcon = (type: TrainingModule['type']) => {
    switch (type) {
      case 'video': return Video;
      case 'reading': return Book;
      case 'interactive': return Play;
      case 'assessment': return Award;
      default: return Book;
    }
  };

  const canStartModule = (module: TrainingModule) => {
    if (module.prerequisites.length === 0) return true;
    return module.prerequisites.every(prereqId => 
      modules.find(m => m.id === prereqId)?.completed
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Helper Training</h1>
              <p className="text-gray-600">Continue your professional development and improve your skills.</p>
            </div>
            
            <div className="flex gap-3">
              <AppButton variant="outline" onClick={() => navigate('/helper/certificates')}>
                <Award className="w-4 h-4 mr-2" />
                Certificates
              </AppButton>
              <AppButton variant="primary" onClick={() => navigate('/helper/dashboard')}>
                Back to Dashboard
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Progress Overview */}
        {progress && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Progress</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {progress.completedModules}/{progress.totalModules}
                </div>
                <div className="text-sm text-gray-600">Modules Completed</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.completedModules / progress.totalModules) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {progress.completedHours.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">Hours Completed</div>
                <div className="text-xs text-gray-500 mt-1">
                  of {progress.totalHours}h total
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {progress.averageScore}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="flex justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.floor(progress.averageScore / 20)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {progress.streakDays}
                </div>
                <div className="text-sm text-gray-600">Day Streak</div>
                <div className="text-xs text-gray-500 mt-1">
                  Keep it up! 🔥
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search training modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              
              {Object.keys(categoryColors).map((category) => {
                const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
                const count = modules.filter(m => m.category === category).length;
                
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedCategory === category
                        ? categoryColors[category as keyof typeof categoryColors]
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CategoryIcon className="w-3 h-3" />
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Training Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredModules.map((module) => {
            const TypeIcon = getTypeIcon(module.type);
            const CategoryIcon = categoryIcons[module.category];
            const canStart = canStartModule(module);
            
            return (
              <div
                key={module.id}
                className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${
                  canStart ? 'hover:shadow-md hover:border-blue-300' : 'opacity-75'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        module.completed 
                          ? 'bg-green-100' 
                          : canStart 
                            ? 'bg-blue-100' 
                            : 'bg-gray-100'
                      }`}>
                        {module.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <TypeIcon className={`w-5 h-5 ${
                            canStart ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{module.title}</h3>
                          {module.required && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {module.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(module.duration)}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <CategoryIcon className="w-3 h-3" />
                            {module.category}
                          </div>
                          
                          {module.score && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {module.score}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {module.progress > 0 && !module.completed && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900 font-medium">{module.progress}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${module.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Prerequisites */}
                  {module.prerequisites.length > 0 && !canStart && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-yellow-800">
                        <strong>Prerequisites required:</strong> Complete previous modules first
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {module.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {module.completed ? (
                      <AppButton
                        variant="outline"
                        size="small"
                        onClick={() => navigate(`/helper/training/${module.id}/review`)}
                        className="flex-1"
                      >
                        Review
                      </AppButton>
                    ) : canStart ? (
                      <AppButton
                        variant="primary"
                        size="small"
                        onClick={() => navigate(`/helper/training/${module.id}`)}
                        className="flex-1"
                      >
                        {module.progress > 0 ? 'Continue' : 'Start'}
                      </AppButton>
                    ) : (
                      <AppButton
                        variant="outline"
                        size="small"
                        disabled
                        className="flex-1"
                      >
                        Locked
                      </AppButton>
                    )}
                    
                    <AppButton
                      variant="ghost"
                      size="small"
                      onClick={() => navigate(`/helper/training/${module.id}/details`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </AppButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms or filters.'
                : 'No training modules available in this category.'
              }
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/helper/training/schedule')}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Schedule Training</div>
                  <div className="text-sm text-gray-600">Set learning goals and reminders</div>
                </div>
              </div>
            </AppButton>
            
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/helper/training/certificates')}
            >
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">View Certificates</div>
                  <div className="text-sm text-gray-600">Download completed certificates</div>
                </div>
              </div>
            </AppButton>
            
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/helper/training/resources')}
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Resources</div>
                  <div className="text-sm text-gray-600">Additional materials and guides</div>
                </div>
              </div>
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelperTrainingRoute;

