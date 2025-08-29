import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import expressWinston from 'express-winston';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import moodRoutes from './routes/mood';
import crisisRoutes from './routes/crisis';
import appointmentRoutes from './routes/appointments';
import emergencyRoutes from './routes/emergency';
import journalRoutes from './routes/journal';
import medicationRoutes from './routes/medications';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import backupRoutes from './routes/backup';

// Import middleware
import { authenticate, authorize } from './middleware/auth';
import { auditLog } from './middleware/audit';
import { encryptionMiddleware } from './middleware/encryption';
import { errorHandler } from './middleware/errorHandler';
import { sessionManager } from './middleware/sessionManager';
import { aiRateLimiter } from './middleware/aiRateLimiter';
import { performanceMonitor } from './middleware/performanceMonitor';

// Import services
import { DatabaseService } from './services/database';
import { WebSocketService } from './services/websocket';
import { CrisisDetectionService } from './services/crisisDetection';
import { EncryptionService } from './services/encryption';
import { AIServicesIntegration } from '../../services/ai/aiServicesIntegration';
import { MonitoringService } from './services/monitoring';
import { BackupService } from './services/backup';

// Load environment configuration based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : process.env.NODE_ENV === 'staging' 
    ? '.env.staging' 
    : '.env';

if (fs.existsSync(path.resolve(process.cwd(), envFile))) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

// HIPAA-Compliant Logger Configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      // Remove sensitive data from logs
      const sanitized = JSON.stringify(meta, (key, value) => {
        const sensitiveKeys = ['password', 'ssn', 'dob', 'email', 'phone', 'address', 'medication'];
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
          return '[REDACTED]';
        }
        return value;
      });
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${sanitized}`;
    })
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/audit.log',
      maxsize: 10485760,
      maxFiles: 10
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 7
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class MentalHealthServer {
  private app: Express;
  private server: any;
  private io: SocketIOServer;
  private port: number;
  private dbService: DatabaseService;
  private wsService: WebSocketService;
  private crisisService: CrisisDetectionService;
  private aiService: AIServicesIntegration;
  private monitoringService: MonitoringService;
  private backupService: BackupService;
  private isProduction: boolean;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.isProduction = process.env.NODE_ENV === 'production';
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.dbService = new DatabaseService();
    this.wsService = new WebSocketService(this.io);
    this.crisisService = new CrisisDetectionService();
    this.aiService = new AIServicesIntegration();
    this.monitoringService = new MonitoringService();
    this.backupService = new BackupService();

    this.configureMiddleware();
    this.configureRoutes();
    this.configureWebSocket();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security Headers (HIPAA Compliant)
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS Configuration
    const corsOptions = {
      origin: (origin: string | undefined, callback: Function) => {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Request-ID'],
      exposedHeaders: ['X-Session-ID', 'X-Request-ID'],
      maxAge: 86400 // 24 hours
    };
    this.app.use(cors(corsOptions));

    // Request ID Generation (for audit trails)
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
      res.setHeader('X-Request-ID', req.headers['x-request-id']);
      next();
    });

    // Body Parser with size limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Rate Limiting (DDoS Protection)
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5, // Stricter limit for auth endpoints
      skipSuccessfulRequests: true
    });

    const crisisLimiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 10, // Allow more crisis requests
      skip: (req) => req.headers['x-crisis-override'] === process.env.CRISIS_OVERRIDE_KEY
    });

    this.app.use('/api/', generalLimiter);
    this.app.use('/api/auth/', authLimiter);
    this.app.use('/api/crisis/', crisisLimiter);

    // HIPAA-Compliant Request Logging
    this.app.use(expressWinston.logger({
      winstonInstance: logger,
      meta: true,
      msg: 'HTTP {{req.method}} {{req.url}}',
      expressFormat: true,
      colorize: false,
      requestFilter: (req, propName) => {
        // Filter sensitive data from request logs
        if (propName === 'headers') {
          const filtered = { ...req[propName] };
          delete filtered.authorization;
          delete filtered.cookie;
          return filtered;
        }
        if (propName === 'body') {
          const filtered = { ...req[propName] };
          delete filtered.password;
          delete filtered.ssn;
          delete filtered.dateOfBirth;
          return filtered;
        }
        return req[propName];
      },
      responseFilter: (res, propName) => {
        if (propName === 'body' && res.body) {
          // Don't log response bodies with sensitive data
          return '[RESPONSE_BODY_REDACTED]';
        }
        return res[propName];
      }
    }));

    // Session timeout management (HIPAA requirement)
    this.app.use(sessionManager);

    // Audit logging for HIPAA compliance
    this.app.use(auditLog);
  }

  private configureRoutes(): void {
    // Health check endpoints for production monitoring
    this.app.get('/health', async (req: Request, res: Response) => {
      const health = await this.getHealthStatus();
      res.status(health.isHealthy ? 200 : 503).json(health);
    });

    this.app.get('/ready', async (req: Request, res: Response) => {
      const readiness = await this.getReadinessStatus();
      res.status(readiness.isReady ? 200 : 503).json(readiness);
    });

    this.app.get('/alive', (req: Request, res: Response) => {
      res.json({ 
        status: 'alive', 
        timestamp: new Date().toISOString(),
        pid: process.pid
      });
    });

    // API Routes with authentication and encryption
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', authenticate, encryptionMiddleware, userRoutes);
    this.app.use('/api/mood', authenticate, encryptionMiddleware, moodRoutes);
    this.app.use('/api/crisis', authenticate, encryptionMiddleware, crisisRoutes);
    this.app.use('/api/appointments', authenticate, encryptionMiddleware, appointmentRoutes);
    this.app.use('/api/emergency', authenticate, encryptionMiddleware, emergencyRoutes);
    this.app.use('/api/journal', authenticate, encryptionMiddleware, journalRoutes);
    this.app.use('/api/medications', authenticate, encryptionMiddleware, medicationRoutes);
    
    // AI Services Routes (with special rate limiting)
    this.app.use('/api/ai', authenticate, aiRateLimiter, encryptionMiddleware, aiRoutes);
    
    // Analytics and Admin Routes
    this.app.use('/api/analytics', authenticate, authorize(['admin', 'therapist']), analyticsRoutes);
    this.app.use('/api/backup', authenticate, authorize(['admin']), backupRoutes);
    
    // Performance monitoring endpoint (production only)
    if (this.isProduction) {
      this.app.use('/api/metrics', authenticate, authorize(['admin']), performanceMonitor);
    }

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ 
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.originalUrl
      });
    });
  }

  private configureWebSocket(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }
        
        // Verify JWT token
        const user = await this.wsService.authenticateSocket(token);
        socket.data.user = user;
        
        // Log connection for audit
        logger.info('WebSocket connection established', {
          userId: user.id,
          socketId: socket.id,
          ip: socket.handshake.address
        });
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.user?.id;
      
      // Join user-specific room
      socket.join(`user:${userId}`);
      
      // Handle real-time crisis detection with AI integration
      socket.on('crisis:detect', async (data) => {
        try {
          // Use AI service for enhanced crisis detection
          const [localResult, aiResult] = await Promise.all([
            this.crisisService.analyze(data),
            this.aiService.detectCrisis(data.content, userId, data.context)
          ]);
          
          // Combine results for higher accuracy
          const finalResult = {
            ...localResult,
            aiAnalysis: aiResult,
            severity: Math.max(localResult.severity, aiResult.severity * 10),
            confidence: (localResult.confidence + aiResult.confidence) / 2
          };
          
          if (finalResult.severity >= 8) {
            // Critical severity - immediate action
            socket.to('therapists').emit('crisis:alert', {
              userId,
              severity: 'critical',
              aiConfidence: aiResult.confidence,
              responseTimeMs: aiResult.responseTimeMs,
              timestamp: new Date().toISOString()
            });
            
            // Log to monitoring service
            await this.monitoringService.logCriticalEvent('crisis_detected', {
              userId,
              severity: finalResult.severity,
              aiProvider: aiResult.provider
            });
          }
          
          socket.emit('crisis:result', finalResult);
        } catch (error) {
          logger.error('Crisis detection failed', { error, userId });
          socket.emit('error', { message: 'Crisis detection failed' });
        }
      });

      // Handle mood updates
      socket.on('mood:update', async (data) => {
        try {
          // Broadcast to user's therapist
          const therapistRoom = `therapist:${socket.data.user.therapistId}`;
          socket.to(therapistRoom).emit('patient:mood:updated', {
            patientId: userId,
            mood: data.mood,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Mood update failed' });
        }
      });

      // Handle live chat
      socket.on('chat:message', async (data) => {
        try {
          const encryptedMessage = await EncryptionService.encrypt(data.message);
          const room = data.room || `chat:${data.sessionId}`;
          socket.to(room).emit('chat:message', {
            ...data,
            message: encryptedMessage,
            timestamp: new Date().toISOString(),
            senderId: userId
          });
        } catch (error) {
          socket.emit('error', { message: 'Message send failed' });
        }
      });

      // Handle video call signaling
      socket.on('call:offer', (data) => {
        socket.to(data.to).emit('call:offer', {
          from: userId,
          offer: data.offer
        });
      });

      socket.on('call:answer', (data) => {
        socket.to(data.to).emit('call:answer', {
          from: userId,
          answer: data.answer
        });
      });

      socket.on('call:ice-candidate', (data) => {
        socket.to(data.to).emit('call:ice-candidate', {
          from: userId,
          candidate: data.candidate
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('WebSocket disconnected', {
          userId,
          socketId: socket.id
        });
        
        // Notify therapist if patient disconnects during session
        if (socket.data.user?.role === 'patient' && socket.data.activeSession) {
          socket.to(`therapist:${socket.data.user.therapistId}`).emit('patient:disconnected', {
            patientId: userId,
            sessionId: socket.data.activeSession
          });
        }
      });
    });
  }

  private configureErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      // Graceful shutdown
      this.shutdown();
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, starting graceful shutdown');
      this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down server...');
    
    // Send shutdown notification in production
    if (this.isProduction) {
      await this.monitoringService.sendShutdownNotification();
    }
    
    // Close WebSocket connections
    this.io.close();
    
    // Shutdown AI services
    await this.aiService.shutdown();
    
    // Close database connections
    await this.dbService.close();
    
    // Close HTTP server
    this.server.close(() => {
      logger.info('Server shut down successfully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }

  private async getHealthStatus(): Promise<any> {
    const checks = await Promise.allSettled([
      this.dbService.isHealthy(),
      this.aiService.getHealthStatus(),
      this.monitoringService.isHealthy()
    ]);

    const dbHealth = checks[0].status === 'fulfilled' ? checks[0].value : false;
    const aiHealth = checks[1].status === 'fulfilled' ? checks[1].value : { overall: 'down' };
    const monitoringHealth = checks[2].status === 'fulfilled' ? checks[2].value : false;

    const isHealthy = dbHealth && aiHealth.overall !== 'down';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '2.0.0',
      uptime: process.uptime(),
      checks: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        aiServices: aiHealth.overall,
        monitoring: monitoringHealth ? 'healthy' : 'unhealthy',
        websocket: this.io ? 'healthy' : 'unhealthy'
      },
      isHealthy
    };
  }

  private async getReadinessStatus(): Promise<any> {
    const aiStatus = this.aiService.getHealthStatus();
    const criticalServicesReady = 
      aiStatus.providers.filter(p => p.status === 'healthy').length > 0;

    const isReady = criticalServicesReady && await this.dbService.isHealthy();

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      criticalServices: {
        database: await this.dbService.isHealthy() ? 'ready' : 'not_ready',
        aiProviders: aiStatus.providers.filter(p => p.status === 'healthy').length,
        crisis988: process.env.ENABLE_988_INTEGRATION === 'true' ? 'ready' : 'disabled'
      },
      isReady
    };
  }

  private async verifyCriticalServices(): Promise<void> {
    logger.info('Verifying critical services...');
    
    // Check database
    const dbHealthy = await this.dbService.isHealthy();
    if (!dbHealthy) {
      throw new Error('Database service is not healthy');
    }
    
    // Check AI services
    const aiStatus = this.aiService.getHealthStatus();
    if (aiStatus.overall === 'down') {
      throw new Error('AI services are not available');
    }
    
    // Verify crisis detection is working
    const testCrisisResult = await this.aiService.detectCrisis(
      'test message for system verification',
      'system-test',
      { test: true }
    );
    
    if (!testCrisisResult) {
      throw new Error('Crisis detection service verification failed');
    }
    
    logger.info('All critical services verified successfully');
  }

  public async start(): Promise<void> {
    try {
      // Initialize all services
      logger.info('Initializing services...');
      
      await Promise.all([
        this.dbService.initialize(),
        this.aiService.initialize(),
        this.monitoringService.initialize()
      ]);
      
      // Start backup service in production
      if (this.isProduction) {
        await this.backupService.initialize();
        this.backupService.scheduleBackups();
      }
      
      // Verify critical services
      await this.verifyCriticalServices();
      
      // Start server
      this.server.listen(this.port, () => {
        logger.info('========================================');
        logger.info(`Mental Health Platform Backend v${process.env.APP_VERSION || '2.0.0'}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Port: ${this.port}`);
        logger.info(`HIPAA Compliance: ENABLED`);
        logger.info(`Encryption: AES-256-GCM`);
        logger.info(`AI Services: ${this.aiService.getHealthStatus().overall.toUpperCase()}`);
        logger.info(`Crisis Detection: ACTIVE`);
        logger.info(`988 Integration: ${process.env.ENABLE_988_INTEGRATION === 'true' ? 'ENABLED' : 'DISABLED'}`);
        logger.info(`WebSocket: READY`);
        logger.info('========================================');
        
        // Send startup notification in production
        if (this.isProduction) {
          this.monitoringService.sendStartupNotification();
        }
      });
    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }
}

// Initialize and start server
const server = new MentalHealthServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default server;