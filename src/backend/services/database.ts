import { Pool, PoolClient, QueryResult } from 'pg';
import winston from 'winston';
import crypto from 'crypto';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/database.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Database Service for managing PostgreSQL connections
 */
export class DatabaseService {
  private pool: Pool | null = null;
  private encryptionKey: Buffer;
  private initialized = false;

  constructor() {
    // Initialize encryption key for database field encryption
    const key = process.env.DB_ENCRYPTION_KEY || 'default-dev-key-change-in-production';
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  /**
   * Initialize database connection pool
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create connection pool
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'mental_health_platform',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: parseInt(process.env.DB_POOL_SIZE || '20'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.DB_SSL === 'true' ? {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        } : undefined
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Run migrations
      await this.runMigrations();

      // Set up connection error handlers
      this.pool.on('error', (err: Error) => {
        logger.error('Unexpected database error', err);
      });

      this.pool.on('connect', () => {
        logger.info('New database connection established');
      });

      this.pool.on('acquire', () => {
        logger.debug('Database connection acquired from pool');
      });

      this.pool.on('remove', () => {
        logger.debug('Database connection removed from pool');
      });

      this.initialized = true;
      logger.info('Database service initialized successfully', {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'mental_health_platform',
        poolSize: process.env.DB_POOL_SIZE || '20'
      });
    } catch (error) {
      logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    try {
      // Create migrations table if not exists
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Here you would run actual migration files
      logger.info('Database migrations completed');
    } catch (error) {
      logger.error('Migration failed', error);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Query executed', {
        query: text.substring(0, 100),
        duration,
        rows: result.rowCount
      });

      return result;
    } catch (error: any) {
      logger.error('Query failed', {
        query: text.substring(0, 100),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get a client for transactions
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return this.pool.connect();
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Encrypt sensitive data for storage
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('base64') + ':' + authTag.toString('base64') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data from storage
   */
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Check database health
   */
  async health(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1');
      return result.rowCount === 1;
    } catch (error) {
      logger.error('Health check failed', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingConnections: this.pool.waitingCount
    };
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.initialized = false;
      logger.info('Database connections closed');
    }
  }

  /**
   * Backup database (placeholder - implement based on your needs)
   */
  async backup(): Promise<string> {
    logger.info('Starting database backup');
    // Implement backup logic here
    // This could involve pg_dump, streaming to S3, etc.
    return 'backup-id-' + Date.now();
  }

  /**
   * Restore database (placeholder - implement based on your needs)
   */
  async restore(backupId: string): Promise<void> {
    logger.info('Starting database restore', { backupId });
    // Implement restore logic here
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;