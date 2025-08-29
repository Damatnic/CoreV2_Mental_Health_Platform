/**
 * Biometric Dashboard Component
 * Displays real-time biometric data with health correlations and insights
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Heart,
  Moon,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Battery,
  Zap,
  Wind,
  Droplet,
  Brain,
  Shield,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  biometricService,
  BiometricData,
  StressIndicators,
  HealthCorrelation,
  WearableDevice,
  SleepData
} from '../../services/biometric/biometricService';
import { useBiometrics } from '../../hooks/useBiometrics';
import { format, subHours, startOfDay, endOfDay } from 'date-fns';

interface BiometricDashboardProps {
  className?: string;
  onDeviceConnect?: () => void;
  onStressAlert?: (stress: StressIndicators) => void;
}

// Color schemes for different metrics
const METRIC_COLORS = {
  heart: '#ef4444',
  hrv: '#10b981',
  stress: '#f59e0b',
  sleep: '#6366f1',
  activity: '#8b5cf6',
  respiratory: '#06b6d4',
  oxygen: '#ec4899'
};

// Gauge component for circular metrics
const MetricGauge: React.FC<{
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}> = ({ value, max, label, unit, color, icon, trend }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 mb-1">{icon}</div>
        <div className="text-2xl font-bold" style={{ color }}>
          {value}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{unit}</div>
        {trend && (
          <div className="flex items-center mt-1">
            {trend === 'up' && <ChevronUp className="w-3 h-3 text-green-500" />}
            {trend === 'down' && <ChevronDown className="w-3 h-3 text-red-500" />}
          </div>
        )}
      </div>
      <div className="text-center mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </div>
    </div>
  );
};

// Sleep stage visualization
const SleepStageChart: React.FC<{ data: SleepData }> = ({ data }) => {
  const stages = [
    { name: 'Deep', value: data.deepSleepMinutes, color: '#4c1d95' },
    { name: 'REM', value: data.remSleepMinutes, color: '#7c3aed' },
    { name: 'Light', value: data.lightSleepMinutes, color: '#a78bfa' },
    { name: 'Awake', value: data.awakeMinutes, color: '#f59e0b' }
  ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={stages}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {stages.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${Math.round(value)} min`}
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center space-x-4 mt-2">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stress radar chart
const StressRadar: React.FC<{ stress: StressIndicators }> = ({ stress }) => {
  const data = [
    { metric: 'Physical', value: stress.physiologicalStress, fullMark: 100 },
    { metric: 'Mental', value: stress.mentalStress, fullMark: 100 },
    { metric: 'Recovery', value: stress.recoveryScore, fullMark: 100 }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid strokeDasharray="3 3" />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar
          name="Stress Levels"
          dataKey="value"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.6}
        />
        <Tooltip
          formatter={(value: number) => `${value}%`}
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: 'none',
            borderRadius: '8px'
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export const BiometricDashboard: React.FC<BiometricDashboardProps> = ({
  className = '',
  onDeviceConnect,
  onStressAlert
}) => {
  const {
    currentData,
    devices,
    stressIndicators,
    healthCorrelation,
    isMonitoring,
    historicalData,
    connectDevice,
    disconnectDevice,
    startMonitoring,
    stopMonitoring
  } = useBiometrics();

  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['vitals', 'stress']));
  const [showDeviceManager, setShowDeviceManager] = useState(false);

  // Filter historical data based on selected time range
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoff: Date;

    switch (selectedTimeRange) {
      case '1h':
        cutoff = subHours(now, 1);
        break;
      case '6h':
        cutoff = subHours(now, 6);
        break;
      case '24h':
        cutoff = subHours(now, 24);
        break;
      case '7d':
        cutoff = subHours(now, 168);
        break;
      default:
        cutoff = subHours(now, 24);
    }

    return historicalData
      .filter(d => d.timestamp > cutoff)
      .map(d => ({
        ...d,
        time: format(d.timestamp, selectedTimeRange === '7d' ? 'MM/dd' : 'HH:mm')
      }));
  }, [historicalData, selectedTimeRange]);

  // Handle stress alerts
  useEffect(() => {
    if (stressIndicators?.needsIntervention && onStressAlert) {
      onStressAlert(stressIndicators);
    }
  }, [stressIndicators, onStressAlert]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Calculate trends
  const calculateTrend = (metric: keyof BiometricData): 'up' | 'down' | 'stable' => {
    if (filteredData.length < 2) return 'stable';
    
    const recent = filteredData.slice(-10);
    const older = filteredData.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, d) => sum + (d[metric] as number || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + (d[metric] as number || 0), 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
  };

  return (
    <div className={`biometric-dashboard ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Biometric Monitoring
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time health metrics and insights
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time range selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['1h', '6h', '24h', '7d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Monitoring toggle */}
            <button
              onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isMonitoring
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>

            {/* Device manager */}
            <button
              onClick={() => setShowDeviceManager(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Manage Devices
            </button>
          </div>
        </div>

        {/* Connected devices */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Connected:</span>
          {devices.length > 0 ? (
            devices.map(device => (
              <div
                key={device.id}
                className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  {device.name}
                </span>
                {device.batteryLevel && (
                  <Battery className="w-4 h-4 text-green-600 dark:text-green-400" />
                )}
              </div>
            ))
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-500">
              No devices connected
            </span>
          )}
        </div>
      </div>

      {/* Vital Signs Section */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => toggleSection('vitals')}
          className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vital Signs
            </h3>
          </div>
          {expandedSections.has('vitals') ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.has('vitals') && currentData && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {currentData.heartRate && (
                  <MetricGauge
                    value={currentData.heartRate}
                    max={200}
                    label="Heart Rate"
                    unit="bpm"
                    color={METRIC_COLORS.heart}
                    icon={<Heart className="w-4 h-4" />}
                    trend={calculateTrend('heartRate')}
                  />
                )}
                
                {currentData.heartRateVariability && (
                  <MetricGauge
                    value={currentData.heartRateVariability}
                    max={150}
                    label="HRV"
                    unit="ms"
                    color={METRIC_COLORS.hrv}
                    icon={<Activity className="w-4 h-4" />}
                    trend={calculateTrend('heartRateVariability')}
                  />
                )}
                
                {currentData.respiratoryRate && (
                  <MetricGauge
                    value={currentData.respiratoryRate}
                    max={30}
                    label="Respiratory"
                    unit="bpm"
                    color={METRIC_COLORS.respiratory}
                    icon={<Wind className="w-4 h-4" />}
                    trend={calculateTrend('respiratoryRate')}
                  />
                )}
                
                {currentData.bloodOxygen && (
                  <MetricGauge
                    value={currentData.bloodOxygen}
                    max={100}
                    label="SpO2"
                    unit="%"
                    color={METRIC_COLORS.oxygen}
                    icon={<Droplet className="w-4 h-4" />}
                    trend={calculateTrend('bloodOxygen')}
                  />
                )}
              </div>

              {/* Trends chart */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Trends
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    {currentData.heartRate && (
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        stroke={METRIC_COLORS.heart}
                        strokeWidth={2}
                        dot={false}
                        name="Heart Rate"
                      />
                    )}
                    {currentData.heartRateVariability && (
                      <Line
                        type="monotone"
                        dataKey="heartRateVariability"
                        stroke={METRIC_COLORS.hrv}
                        strokeWidth={2}
                        dot={false}
                        name="HRV"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stress Analysis Section */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={() => toggleSection('stress')}
          className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Brain className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stress Analysis
            </h3>
            {stressIndicators?.needsIntervention && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                Attention Needed
              </span>
            )}
          </div>
          {expandedSections.has('stress') ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.has('stress') && stressIndicators && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stress levels */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Stress Levels
                  </h4>
                  <StressRadar stress={stressIndicators} />
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {stressIndicators.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                      >
                        <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stress timeline */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Stress Timeline
                </h4>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="stressLevel"
                      stroke={METRIC_COLORS.stress}
                      fill={METRIC_COLORS.stress}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Sleep Quality Section */}
      {currentData?.sleepData && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => toggleSection('sleep')}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sleep Quality
              </h3>
            </div>
            {expandedSections.has('sleep') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has('sleep') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sleep metrics */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Sleep</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.floor(currentData.sleepData.totalSleepMinutes / 60)}h{' '}
                        {currentData.sleepData.totalSleepMinutes % 60}m
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Efficiency</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(currentData.sleepData.sleepEfficiency)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quality Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentData.sleepData.sleepQualityScore}/100
                      </p>
                    </div>
                  </div>

                  {/* Sleep stages */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Sleep Stages
                    </h4>
                    <SleepStageChart data={currentData.sleepData} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Health Correlations Section */}
      {healthCorrelation && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => toggleSection('correlations')}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Health & Mood Correlations
              </h3>
            </div>
            {expandedSections.has('correlations') ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has('correlations') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Activity impact */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Activity Impact
                      </span>
                      <Zap className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.abs(healthCorrelation.physicalActivityImpact) * 100}%`,
                            backgroundColor: healthCorrelation.physicalActivityImpact > 0 
                              ? '#10b981' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold">
                        {healthCorrelation.physicalActivityImpact > 0 ? '+' : ''}
                        {Math.round(healthCorrelation.physicalActivityImpact * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Sleep impact */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sleep Impact
                      </span>
                      <Moon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.abs(healthCorrelation.sleepQualityImpact) * 100}%`,
                            backgroundColor: healthCorrelation.sleepQualityImpact > 0 
                              ? '#10b981' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold">
                        {healthCorrelation.sleepQualityImpact > 0 ? '+' : ''}
                        {Math.round(healthCorrelation.sleepQualityImpact * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* HRV trend */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        HRV Trend
                      </span>
                      {healthCorrelation.hrvTrend === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : healthCorrelation.hrvTrend === 'declining' ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <p className="text-lg font-bold capitalize">
                      {healthCorrelation.hrvTrend}
                    </p>
                  </div>
                </div>

                {/* Insights */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Personalized Insights
                  </h4>
                  <div className="space-y-2">
                    {healthCorrelation.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Device Manager Modal */}
      <AnimatePresence>
        {showDeviceManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowDeviceManager(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Manage Devices
              </h3>
              
              {/* Connected devices */}
              {devices.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Connected Devices
                  </p>
                  <div className="space-y-2">
                    {devices.map(device => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {device.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Last sync: {format(device.lastSync, 'HH:mm')}
                          </p>
                        </div>
                        <button
                          onClick={() => disconnectDevice(device.id)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available devices to connect */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Connect New Device
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['fitbit', 'apple_watch', 'garmin', 'samsung'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        connectDevice(type);
                        if (onDeviceConnect) onDeviceConnect();
                      }}
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowDeviceManager(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};