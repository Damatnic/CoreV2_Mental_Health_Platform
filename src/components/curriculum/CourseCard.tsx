/**
 * Course Card Component
 * Displays individual course information in a card format
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Users,
  Star,
  Award,
  PlayCircle,
  CheckCircle,
  Lock,
  TrendingUp,
  BookOpen,
  Target
} from 'lucide-react';
import { Course, UserProgress } from '../../services/curriculum/curriculumService';

interface CourseCardProps {
  course: Course;
  progress?: UserProgress;
  onEnroll: () => void;
  onStart: () => void;
  isEnrolled: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  progress,
  onEnroll,
  onStart,
  isEnrolled
}) => {
  // Calculate course statistics
  const totalLessons = course.modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0
  );
  
  const completedLessons = progress?.completedLessons.length || 0;
  const progressPercentage = progress?.progressPercentage || 0;

  // Get difficulty color
  const getDifficultyColor = () => {
    switch (course.difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category gradient
  const getCategoryGradient = () => {
    const gradients = [
      'from-blue-400 to-indigo-600',
      'from-purple-400 to-pink-600',
      'from-green-400 to-teal-600',
      'from-orange-400 to-red-600',
      'from-pink-400 to-rose-600'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Course Thumbnail */}
      <div className={`h-48 bg-gradient-to-br ${getCategoryGradient()} relative`}>
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
            {course.category}
          </span>
        </div>

        {/* Certificate Badge */}
        {course.certificateAvailable && (
          <div className="absolute top-4 right-4">
            <Award className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
          </div>
        )}

        {/* Progress Indicator */}
        {isEnrolled && progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 h-2">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Title and Description */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.description}
        </p>

        {/* Course Meta */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>{course.duration} min</span>
          </div>
          <div className="flex items-center text-gray-500">
            <BookOpen className="w-4 h-4 mr-1" />
            <span>{totalLessons} lessons</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
            {course.difficulty}
          </div>
        </div>

        {/* Rating */}
        {course.rating && (
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(course.rating!)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {course.rating.toFixed(1)}
            </span>
            {course.enrollmentCount && (
              <span className="ml-2 text-sm text-gray-500">
                ({course.enrollmentCount} students)
              </span>
            )}
          </div>
        )}

        {/* Learning Objectives */}
        {!isEnrolled && course.learningObjectives.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">You'll learn:</h4>
            <ul className="space-y-1">
              {course.learningObjectives.slice(0, 3).map((objective, index) => (
                <li key={index} className="flex items-start text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Details (if enrolled) */}
        {isEnrolled && progress && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{progressPercentage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Lessons Completed</span>
              <span className="font-medium text-gray-900">
                {completedLessons} / {totalLessons}
              </span>
            </div>
            {progress.currentStreak > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Streak</span>
                <span className="font-medium text-orange-500">
                  {progress.streakDays} days 🔥
                </span>
              </div>
            )}
            {progress.certificateEarned && (
              <div className="flex items-center text-green-600 text-sm">
                <Award className="w-4 h-4 mr-2" />
                <span className="font-medium">Certificate Earned!</span>
              </div>
            )}
          </div>
        )}

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-start">
              <Lock className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-800">Prerequisites:</p>
                <p className="text-xs text-yellow-700 mt-1">
                  {course.prerequisites.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {isEnrolled ? (
          <button
            onClick={onStart}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-medium"
          >
            {progressPercentage === 100 ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Review Course
              </>
            ) : progressPercentage > 0 ? (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Continue Learning
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Start Course
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onEnroll}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center font-medium"
          >
            <Target className="w-5 h-5 mr-2" />
            Enroll Now
          </button>
        )}

        {/* Tags */}
        {course.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {course.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CourseCard;