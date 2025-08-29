/**
 * Curriculum Dashboard Component
 * Main interface for browsing courses, tracking progress, and managing learning paths
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Play,
  CheckCircle,
  Star,
  Users,
  BarChart3,
  Target,
  Calendar,
  BookMarked,
  Trophy,
  Sparkles
} from 'lucide-react';
import { curriculumService, Course, CourseCategory, UserProgress, LearningPath } from '../../services/curriculum/curriculumService';
import { useCurriculum } from '../../hooks/useCurriculum';
import CourseCard from './CourseCard';
import LessonViewer from './LessonViewer';

interface CurriculumDashboardProps {
  userId: string;
}

const CurriculumDashboard: React.FC<CurriculumDashboardProps> = ({ userId }) => {
  const {
    enrolledCourses,
    allCourses,
    userProgress,
    learningPaths,
    currentCourse,
    currentLesson,
    enrollInCourse,
    setCurrentCourse,
    setCurrentLesson,
    completeLesson,
    refreshData
  } = useCurriculum(userId);

  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'catalog' | 'enrolled' | 'paths' | 'lesson'>('catalog');
  const [showCertificates, setShowCertificates] = useState(false);

  // Calculate overall progress statistics
  const progressStats = useMemo(() => {
    const stats = {
      totalEnrolled: enrolledCourses.length,
      coursesCompleted: 0,
      totalHours: 0,
      certificatesEarned: 0,
      currentStreak: 0,
      averageProgress: 0
    };

    userProgress.forEach(progress => {
      if (progress.progressPercentage === 100) {
        stats.coursesCompleted++;
        if (progress.certificateEarned) {
          stats.certificatesEarned++;
        }
      }
      stats.totalHours += progress.totalTimeSpent / 60;
      stats.averageProgress += progress.progressPercentage;
      stats.currentStreak = Math.max(stats.currentStreak, progress.streakDays);
    });

    if (userProgress.length > 0) {
      stats.averageProgress = Math.round(stats.averageProgress / userProgress.length);
    }

    return stats;
  }, [enrolledCourses, userProgress]);

  // Filter courses based on search and category
  const filteredCourses = useMemo(() => {
    let courses = viewMode === 'enrolled' ? enrolledCourses : allCourses;
    
    if (selectedCategory !== 'all') {
      courses = courses.filter(course => course.category === selectedCategory);
    }

    if (searchQuery) {
      courses = curriculumService.searchCourses(searchQuery);
    }

    return courses;
  }, [allCourses, enrolledCourses, selectedCategory, searchQuery, viewMode]);

  // Handle course enrollment
  const handleEnroll = (courseId: string) => {
    enrollInCourse(courseId);
    setViewMode('enrolled');
  };

  // Handle starting a course
  const handleStartCourse = (course: Course) => {
    setCurrentCourse(course);
    if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
      setCurrentLesson(course.modules[0].lessons[0]);
      setViewMode('lesson');
    }
  };

  // Render learning path visualization
  const renderLearningPath = (path: LearningPath) => (
    <motion.div
      key={path.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 mb-4"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{path.title}</h3>
          <p className="text-gray-600">{path.description}</p>
        </div>
        <Target className="w-8 h-8 text-indigo-500" />
      </div>

      <div className="flex items-center space-x-2 mb-4">
        {path.courses.map((courseId, index) => {
          const course = curriculumService.getCourse(courseId);
          const progress = curriculumService.getUserProgress(userId, courseId);
          
          return (
            <React.Fragment key={courseId}>
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  progress?.progressPercentage === 100 
                    ? 'bg-green-500 text-white' 
                    : progress 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {progress?.progressPercentage === 100 ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {course && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs text-gray-600">{course.title.substring(0, 20)}...</span>
                  </div>
                )}
              </div>
              {index < path.courses.length - 1 && (
                <div className={`flex-1 h-1 ${
                  progress?.progressPercentage === 100 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {path.targetCompletion && (
        <div className="mt-8 flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          Target completion: {new Date(path.targetCompletion).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );

  // Render progress overview
  const renderProgressOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <BookOpen className="w-8 h-8" />
          <span className="text-3xl font-bold">{progressStats.totalEnrolled}</span>
        </div>
        <p className="text-sm opacity-90">Courses Enrolled</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <Trophy className="w-8 h-8" />
          <span className="text-3xl font-bold">{progressStats.coursesCompleted}</span>
        </div>
        <p className="text-sm opacity-90">Courses Completed</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <Clock className="w-8 h-8" />
          <span className="text-3xl font-bold">{Math.round(progressStats.totalHours)}</span>
        </div>
        <p className="text-sm opacity-90">Hours Learning</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <Award className="w-8 h-8" />
          <span className="text-3xl font-bold">{progressStats.certificatesEarned}</span>
        </div>
        <p className="text-sm opacity-90">Certificates Earned</p>
      </motion.div>
    </div>
  );

  // Render category filter
  const renderCategoryFilter = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => setSelectedCategory('all')}
        className={`px-4 py-2 rounded-lg transition-colors ${
          selectedCategory === 'all'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All Courses
      </button>
      {Object.values(CourseCategory).map(category => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === category
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );

  // Render certificates section
  const renderCertificates = () => {
    const certificates = userProgress
      .filter(p => p.certificateEarned)
      .map(p => p.certificateEarned!);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map(cert => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gold-400 to-yellow-600 rounded-xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Award className="w-12 h-12" />
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{cert.courseName}</h3>
            <p className="text-sm opacity-90 mb-1">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
            <p className="text-xs opacity-75">Verification: {cert.verificationCode}</p>
            <button
              className="mt-4 w-full bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors"
              onClick={() => window.open(cert.certificateUrl, '_blank')}
            >
              View Certificate
            </button>
          </motion.div>
        ))}
      </div>
    );
  };

  // Main render
  if (viewMode === 'lesson' && currentCourse && currentLesson) {
    return (
      <LessonViewer
        course={currentCourse}
        lesson={currentLesson}
        userId={userId}
        onBack={() => setViewMode('enrolled')}
        onComplete={() => {
          completeLesson(currentLesson.id);
          // Navigate to next lesson
          const currentModuleIndex = currentCourse.modules.findIndex(m => 
            m.lessons.some(l => l.id === currentLesson.id)
          );
          const currentModule = currentCourse.modules[currentModuleIndex];
          const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
          
          if (currentLessonIndex < currentModule.lessons.length - 1) {
            setCurrentLesson(currentModule.lessons[currentLessonIndex + 1]);
          } else if (currentModuleIndex < currentCourse.modules.length - 1) {
            const nextModule = currentCourse.modules[currentModuleIndex + 1];
            if (nextModule.lessons.length > 0) {
              setCurrentLesson(nextModule.lessons[0]);
            }
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Wellness Curriculum</h1>
          <p className="text-lg text-gray-600">
            Explore evidence-based courses to improve your mental health and wellbeing
          </p>
        </div>

        {/* Progress Overview */}
        {renderProgressOverview()}

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setViewMode('catalog')}
            className={`pb-4 px-2 font-medium transition-colors ${
              viewMode === 'catalog'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Course Catalog
          </button>
          <button
            onClick={() => setViewMode('enrolled')}
            className={`pb-4 px-2 font-medium transition-colors ${
              viewMode === 'enrolled'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Courses
          </button>
          <button
            onClick={() => setViewMode('paths')}
            className={`pb-4 px-2 font-medium transition-colors ${
              viewMode === 'paths'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Learning Paths
          </button>
          <button
            onClick={() => setShowCertificates(!showCertificates)}
            className={`pb-4 px-2 font-medium transition-colors ${
              showCertificates
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Certificates
          </button>
        </div>

        {/* Search Bar */}
        {(viewMode === 'catalog' || viewMode === 'enrolled') && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Category Filter */}
        {(viewMode === 'catalog' || viewMode === 'enrolled') && renderCategoryFilter()}

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {showCertificates ? (
            <motion.div
              key="certificates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderCertificates()}
            </motion.div>
          ) : viewMode === 'paths' ? (
            <motion.div
              key="paths"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {learningPaths.map(path => renderLearningPath(path))}
            </motion.div>
          ) : (
            <motion.div
              key="courses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={curriculumService.getUserProgress(userId, course.id)}
                  onEnroll={() => handleEnroll(course.id)}
                  onStart={() => handleStartCourse(course)}
                  isEnrolled={enrolledCourses.some(c => c.id === course.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CurriculumDashboard;