import express from 'express';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import zlib from 'zlib';

const router = express.Router();
const pipelineAsync = promisify(pipeline);

interface BackupMetadata {
  id: string;
  type: 'user_data' | 'system' | 'analytics' | 'full';
  userId?: string;
  timestamp: Date;
  size: number;
  checksum: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  filename: string;
}

// In-memory backup tracking (use database in production)
const backupRegistry: Map<string, BackupMetadata> = new Map();

// Create backup
router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, userId } = req.body;
    const requestingUserId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Validate backup type
    const validTypes = ['user_data', 'system', 'analytics', 'full'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid backup type',
        validTypes
      });
    }

    // Authorization check
    if (type !== 'user_data' && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required for system backups'
      });
    }

    if (type === 'user_data' && userId && userId !== requestingUserId && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Cannot backup other user data without admin privileges'
      });
    }

    // Generate backup ID
    const backupId = generateBackupId();
    const timestamp = new Date();
    const filename = generateBackupFilename(type, userId, timestamp);

    // Create backup metadata
    const metadata: BackupMetadata = {
      id: backupId,
      type,
      userId: userId || requestingUserId,
      timestamp,
      size: 0,
      checksum: '',
      status: 'pending',
      filename
    };

    backupRegistry.set(backupId, metadata);

    // Start backup process asynchronously
    performBackup(backupId, type, userId || requestingUserId)
      .catch(error => {
        console.error('Backup failed:', error);
        const backup = backupRegistry.get(backupId);
        if (backup) {
          backup.status = 'failed';
          backupRegistry.set(backupId, backup);
        }
      });

    res.json({
      backupId,
      status: 'initiated',
      estimatedCompletion: estimateBackupTime(type),
      message: 'Backup process started'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initiate backup',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backup status
router.get('/status/:backupId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    const requestingUserId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const backup = backupRegistry.get(backupId);
    if (!backup) {
      return res.status(404).json({
        error: 'Backup not found'
      });
    }

    // Authorization check
    if (backup.userId !== requestingUserId && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized to access backup status'
      });
    }

    res.json({
      backupId: backup.id,
      type: backup.type,
      status: backup.status,
      timestamp: backup.timestamp,
      size: backup.size,
      filename: backup.filename,
      progress: calculateBackupProgress(backup)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get backup status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List user backups
router.get('/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const requestingUserId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { userId, type } = req.query;

    let backups = Array.from(backupRegistry.values());

    // Filter by user access
    if (userRole !== 'admin') {
      backups = backups.filter(backup => backup.userId === requestingUserId);
    } else if (userId) {
      backups = backups.filter(backup => backup.userId === userId);
    }

    // Filter by type
    if (type) {
      backups = backups.filter(backup => backup.type === type);
    }

    // Sort by timestamp (newest first)
    backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.json({
      backups: backups.map(backup => ({
        id: backup.id,
        type: backup.type,
        status: backup.status,
        timestamp: backup.timestamp,
        size: backup.size,
        filename: backup.filename
      })),
      total: backups.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list backups',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Download backup
router.get('/download/:backupId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    const requestingUserId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const backup = backupRegistry.get(backupId);
    if (!backup) {
      return res.status(404).json({
        error: 'Backup not found'
      });
    }

    // Authorization check
    if (backup.userId !== requestingUserId && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized to download backup'
      });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({
        error: 'Backup not ready for download',
        status: backup.status
      });
    }

    const backupPath = getBackupFilePath(backup.filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        error: 'Backup file not found on disk'
      });
    }

    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Length', backup.size);

    // Stream the backup file
    const fileStream = createReadStream(backupPath);
    fileStream.pipe(res);

  } catch (error) {
    res.status(500).json({
      error: 'Failed to download backup',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete backup
router.delete('/:backupId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    const requestingUserId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const backup = backupRegistry.get(backupId);
    if (!backup) {
      return res.status(404).json({
        error: 'Backup not found'
      });
    }

    // Authorization check
    if (backup.userId !== requestingUserId && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized to delete backup'
      });
    }

    // Delete backup file from disk
    const backupPath = getBackupFilePath(backup.filename);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    // Remove from registry
    backupRegistry.delete(backupId);

    res.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete backup',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore from backup (admin only)
router.post('/restore/:backupId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required for restore operations'
      });
    }

    const { backupId } = req.params;
    const { confirmRestore } = req.body;

    if (!confirmRestore) {
      return res.status(400).json({
        error: 'Restore confirmation required',
        message: 'Set confirmRestore: true to proceed'
      });
    }

    const backup = backupRegistry.get(backupId);
    if (!backup) {
      return res.status(404).json({
        error: 'Backup not found'
      });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({
        error: 'Cannot restore from incomplete backup',
        status: backup.status
      });
    }

    // Perform restore operation (placeholder implementation)
    const restoreResult = await performRestore(backup);

    res.json({
      success: true,
      message: 'Restore completed successfully',
      details: restoreResult
    });
  } catch (error) {
    res.status(500).json({
      error: 'Restore operation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function generateBackupId(): string {
  return 'backup_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function generateBackupFilename(type: string, userId: string, timestamp: Date): string {
  const dateStr = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${type}_${userId}_${dateStr}_${timeStr}.tar.gz`;
}

function getBackupFilePath(filename: string): string {
  const backupDir = process.env.BACKUP_DIR || '/tmp/backups';
  return path.join(backupDir, filename);
}

function estimateBackupTime(type: string): Date {
  const estimateMinutes = {
    'user_data': 2,
    'analytics': 5,
    'system': 10,
    'full': 30
  };
  
  const minutes = estimateMinutes[type as keyof typeof estimateMinutes] || 5;
  return new Date(Date.now() + minutes * 60 * 1000);
}

function calculateBackupProgress(backup: BackupMetadata): number {
  if (backup.status === 'completed') return 100;
  if (backup.status === 'failed') return 0;
  if (backup.status === 'pending') return 0;
  
  // For 'in_progress', estimate based on time elapsed
  const elapsed = Date.now() - backup.timestamp.getTime();
  const estimated = estimateBackupTime(backup.type).getTime() - backup.timestamp.getTime();
  
  return Math.min(Math.round((elapsed / estimated) * 100), 95);
}

async function performBackup(backupId: string, type: string, userId: string): Promise<void> {
  const backup = backupRegistry.get(backupId);
  if (!backup) throw new Error('Backup metadata not found');

  // Update status to in_progress
  backup.status = 'in_progress';
  backupRegistry.set(backupId, backup);

  try {
    // Create backup directory if it doesn't exist
    const backupDir = process.env.BACKUP_DIR || '/tmp/backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = getBackupFilePath(backup.filename);
    
    // Simulate backup data creation based on type
    const backupData = await createBackupData(type, userId);
    
    // Compress and write backup data
    const writeStream = createWriteStream(backupPath);
    const gzipStream = zlib.createGzip();
    
    await pipelineAsync(
      require('stream').Readable.from([JSON.stringify(backupData, null, 2)]),
      gzipStream,
      writeStream
    );

    // Get file size and calculate checksum
    const stats = fs.statSync(backupPath);
    backup.size = stats.size;
    backup.checksum = await calculateChecksum(backupPath);
    backup.status = 'completed';
    
    backupRegistry.set(backupId, backup);
  } catch (error) {
    backup.status = 'failed';
    backupRegistry.set(backupId, backup);
    throw error;
  }
}

async function createBackupData(type: string, userId: string): Promise<any> {
  const backupData: any = {
    metadata: {
      type,
      userId,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  switch (type) {
    case 'user_data':
      backupData.userData = {
        profile: { id: userId, name: 'User Profile' },
        preferences: { theme: 'dark', notifications: true },
        moodEntries: [],
        journalEntries: [],
        safetyPlan: {}
      };
      break;
      
    case 'analytics':
      backupData.analytics = {
        events: [],
        metrics: {},
        reports: []
      };
      break;
      
    case 'system':
      backupData.system = {
        configuration: {},
        logs: [],
        metrics: {}
      };
      break;
      
    case 'full':
      backupData.userData = { /* user data */ };
      backupData.analytics = { /* analytics data */ };
      backupData.system = { /* system data */ };
      break;
  }

  return backupData;
}

async function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = require('crypto').createHash('sha256');
    const stream = createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function performRestore(backup: BackupMetadata): Promise<any> {
  // Placeholder restore implementation
  // In production, this would restore data from backup to database
  
  return {
    type: backup.type,
    restoredAt: new Date(),
    itemsRestored: 0,
    status: 'completed'
  };
}

export default router;