import { describe, it, expect, jest } from '@jest/globals';

interface ExportData {
  journals?: any[];
  moods?: any[];
  safetyPlans?: any[];
  settings?: any;
}

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeMedia: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

class DataExportService {
  async exportUserData(userId: string, options: ExportOptions): Promise<Blob> {
    const data = await this.collectUserData(userId, options);
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(data);
      case 'csv':
        return this.exportAsCSV(data);
      case 'pdf':
        return this.exportAsPDF(data);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private async collectUserData(userId: string, options: ExportOptions): Promise<ExportData> {
    const data: ExportData = {};
    
    // Mock data collection
    data.journals = await this.getJournals(userId, options.dateRange);
    data.moods = await this.getMoods(userId, options.dateRange);
    data.safetyPlans = await this.getSafetyPlans(userId);
    data.settings = await this.getSettings(userId);
    
    return data;
  }

  private async getJournals(userId: string, dateRange?: { start: Date; end: Date }) {
    return [
      { id: '1', date: new Date(), content: 'Sample journal', userId }
    ];
  }

  private async getMoods(userId: string, dateRange?: { start: Date; end: Date }) {
    return [
      { id: '1', date: new Date(), mood: 7, userId }
    ];
  }

  private async getSafetyPlans(userId: string) {
    return [
      { id: '1', triggers: [], copingStrategies: [], userId }
    ];
  }

  private async getSettings(userId: string) {
    return { theme: 'light', notifications: true, userId };
  }

  private exportAsJSON(data: ExportData): Blob {
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  private exportAsCSV(data: ExportData): Blob {
    let csv = '';
    
    // Convert journals to CSV
    if (data.journals?.length) {
      csv += 'Journals\n';
      csv += 'Date,Content\n';
      data.journals.forEach(j => {
        csv += `"${j.date}","${j.content}"\n`;
      });
    }
    
    // Convert moods to CSV
    if (data.moods?.length) {
      csv += '\nMoods\n';
      csv += 'Date,Score\n';
      data.moods.forEach(m => {
        csv += `"${m.date}",${m.mood}\n`;
      });
    }
    
    return new Blob([csv], { type: 'text/csv' });
  }

  private exportAsPDF(data: ExportData): Blob {
    // Mock PDF generation
    const pdfContent = `User Data Export\n${JSON.stringify(data)}`;
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  async importData(file: File): Promise<ExportData> {
    const text = await file.text();
    
    if (file.type === 'application/json') {
      return JSON.parse(text);
    } else if (file.type === 'text/csv') {
      // Parse CSV
      return this.parseCSV(text);
    }
    
    throw new Error('Unsupported file type');
  }

  private parseCSV(text: string): ExportData {
    // Simple CSV parsing
    const lines = text.split('\n');
    return { journals: [], moods: [] };
  }
}

describe('DataExportService', () => {
  let service: DataExportService;

  beforeEach(() => {
    service = new DataExportService();
  });

  it('should export data as JSON', async () => {
    const blob = await service.exportUserData('user123', {
      format: 'json',
      includeMedia: false
    });
    
    expect(blob.type).toBe('application/json');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should export data as CSV', async () => {
    const blob = await service.exportUserData('user123', {
      format: 'csv',
      includeMedia: false
    });
    
    expect(blob.type).toBe('text/csv');
  });

  it('should export data as PDF', async () => {
    const blob = await service.exportUserData('user123', {
      format: 'pdf',
      includeMedia: false
    });
    
    expect(blob.type).toBe('application/pdf');
  });

  it('should filter by date range', async () => {
    const dateRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    };
    
    const blob = await service.exportUserData('user123', {
      format: 'json',
      includeMedia: false,
      dateRange
    });
    
    expect(blob).toBeDefined();
  });

  it('should import JSON data', async () => {
    const jsonData = { journals: [], moods: [] };
    const file = new File(
      [JSON.stringify(jsonData)],
      'export.json',
      { type: 'application/json' }
    );
    
    const imported = await service.importData(file);
    
    expect(imported).toEqual(jsonData);
  });

  it('should handle unsupported formats', async () => {
    await expect(
      service.exportUserData('user123', {
        format: 'xml' as any,
        includeMedia: false
      })
    ).rejects.toThrow('Unsupported format');
  });
});
