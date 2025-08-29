import React, { useState } from 'react';
import { Download, FileText, Database, Calendar, Shield, CheckCircle } from 'lucide-react';
import '../../styles/DataExportManager.css';

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  dataTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  includeMedia: boolean;
  anonymize: boolean;
}

const DataExportManager: React.FC = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dataTypes: [],
    dateRange: {
      start: '',
      end: new Date().toISOString().split('T')[0]
    },
    includeMedia: false,
    anonymize: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const dataTypes = [
    { id: 'journal', name: 'Journal Entries', icon: <FileText size={16} />, count: 42 },
    { id: 'mood', name: 'Mood Tracking', icon: <Calendar size={16} />, count: 125 },
    { id: 'safety-plans', name: 'Safety Plans', icon: <Shield size={16} />, count: 3 },
    { id: 'sessions', name: 'Session Records', icon: <CheckCircle size={16} />, count: 28 },
    { id: 'habits', name: 'Habit Tracking', icon: <Database size={16} />, count: 67 },
    { id: 'settings', name: 'App Preferences', icon: <Database size={16} />, count: 1 }
  ];

  const handleDataTypeToggle = (typeId: string) => {
    setExportOptions(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(typeId)
        ? prev.dataTypes.filter(id => id !== typeId)
        : [...prev.dataTypes, typeId]
    }));
  };

  const handleSelectAll = () => {
    setExportOptions(prev => ({
      ...prev,
      dataTypes: dataTypes.map(type => type.id)
    }));
  };

  const handleDeselectAll = () => {
    setExportOptions(prev => ({
      ...prev,
      dataTypes: []
    }));
  };

  const handleExport = async () => {
    if (exportOptions.dataTypes.length === 0) return;

    setIsExporting(true);
    setExportComplete(false);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create download
      const exportData = {
        exportedAt: new Date().toISOString(),
        format: exportOptions.format,
        dataTypes: exportOptions.dataTypes,
        dateRange: exportOptions.dateRange,
        anonymized: exportOptions.anonymize,
        data: {
          // Mock data structure
          metadata: {
            totalRecords: exportOptions.dataTypes.reduce((sum, typeId) => {
              const type = dataTypes.find(t => t.id === typeId);
              return sum + (type?.count || 0);
            }, 0),
            exportVersion: '1.0'
          }
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: exportOptions.format === 'json' ? 'application/json' : 'text/csv'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mental-health-data-export-${new Date().getTime()}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportComplete(true);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getEstimatedFileSize = () => {
    const totalRecords = exportOptions.dataTypes.reduce((sum, typeId) => {
      const type = dataTypes.find(t => t.id === typeId);
      return sum + (type?.count || 0);
    }, 0);
    
    const estimatedSizeKB = totalRecords * (exportOptions.format === 'json' ? 2 : 1);
    return estimatedSizeKB > 1024 ? `${(estimatedSizeKB / 1024).toFixed(1)} MB` : `${estimatedSizeKB} KB`;
  };

  return (
    <div className="data-export-manager">
      <div className="export-header">
        <Download size={24} />
        <div>
          <h2>Export Your Data</h2>
          <p>Download your mental health data for personal records or backup</p>
        </div>
      </div>

      <div className="export-options">
        <div className="option-section">
          <h3>Data Types</h3>
          <div className="data-type-controls">
            <button onClick={handleSelectAll} className="control-btn">
              Select All
            </button>
            <button onClick={handleDeselectAll} className="control-btn">
              Deselect All
            </button>
          </div>
          
          <div className="data-types-list">
            {dataTypes.map(type => (
              <label key={type.id} className="data-type-item">
                <input
                  type="checkbox"
                  checked={exportOptions.dataTypes.includes(type.id)}
                  onChange={() => handleDataTypeToggle(type.id)}
                />
                <div className="type-info">
                  {type.icon}
                  <span className="type-name">{type.name}</span>
                  <span className="type-count">({type.count} records)</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="option-section">
          <h3>Export Format</h3>
          <div className="format-options">
            {['json', 'csv', 'pdf'].map(format => (
              <label key={format} className="format-option">
                <input
                  type="radio"
                  name="format"
                  value={format}
                  checked={exportOptions.format === format}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    format: e.target.value as any
                  }))}
                />
                <span className="format-name">{format.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="option-section">
          <h3>Date Range</h3>
          <div className="date-range">
            <div className="date-input">
              <label>Start Date</label>
              <input
                type="date"
                value={exportOptions.dateRange.start}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
              />
            </div>
            <div className="date-input">
              <label>End Date</label>
              <input
                type="date"
                value={exportOptions.dateRange.end}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
              />
            </div>
          </div>
        </div>

        <div className="option-section">
          <h3>Privacy Options</h3>
          <div className="privacy-options">
            <label className="privacy-option">
              <input
                type="checkbox"
                checked={exportOptions.anonymize}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  anonymize: e.target.checked
                }))}
              />
              <div className="option-details">
                <span className="option-name">Anonymize Data</span>
                <span className="option-desc">Remove personally identifiable information</span>
              </div>
            </label>
            
            <label className="privacy-option">
              <input
                type="checkbox"
                checked={exportOptions.includeMedia}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeMedia: e.target.checked
                }))}
              />
              <div className="option-details">
                <span className="option-name">Include Media</span>
                <span className="option-desc">Include uploaded images and attachments</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="export-summary">
        <div className="summary-item">
          <strong>Selected Data Types:</strong> {exportOptions.dataTypes.length}
        </div>
        <div className="summary-item">
          <strong>Estimated Size:</strong> {getEstimatedFileSize()}
        </div>
        <div className="summary-item">
          <strong>Format:</strong> {exportOptions.format.toUpperCase()}
        </div>
      </div>

      <div className="export-actions">
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={exportOptions.dataTypes.length === 0 || isExporting}
        >
          {isExporting ? (
            <>
              <div className="loading-spinner" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={18} />
              Export Data
            </>
          )}
        </button>
      </div>

      {exportComplete && (
        <div className="export-success">
          <CheckCircle size={20} />
          <span>Export completed successfully!</span>
        </div>
      )}

      <div className="export-disclaimer">
        <Shield size={16} />
        <p>
          Your data export will be securely processed and downloaded directly to your device. 
          We recommend storing exported data in a secure location and deleting it when no longer needed.
        </p>
      </div>
    </div>
  );
};

export default DataExportManager;
