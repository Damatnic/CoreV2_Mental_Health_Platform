import { Pool, PoolConfig, QueryResult } from 'pg';
import * as dotenv from 'dotenv';
import winston from 'winston';
import crypto from 'crypto';

dotenv.config();

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
 * Database Configuration
 * HIPAA-compliant PostgreSQL connection with encryption
 */
export class DatabaseConfig {
  private static instance: DatabaseConfig;
  private pool: Pool | null = null;
  private readonly config: PoolConfig;
  private encryptionKey: Buffer;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 5000;

  private constructor() {
    // Validate required environment variables
    this.validateEnvironment();

    // Generate or load encryption key
    this.encryptionKey = this.loadEncryptionKey();

    // Database configuration
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'mental_health_platform',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      
      // Connection pool settings
      max: parseInt(process.env.DB_POOL_SIZE || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
      
      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY
      } : false,

      // Statement timeout (30 seconds)
      statement_timeout: 30000,
      
      // Application name for monitoring
      application_name: 'mental_health_platform'
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironment(): void {
    const required = ['DB_PASSWORD', 'ENCRYPTION_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Load or generate encryption key
   */
  private loadEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      logger.warn('No encryption key found, generating temporary key (NOT FOR PRODUCTION)');
      return crypto.randomBytes(32);
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Initialize database connection pool
   */
  public async initialize(): Promise<void> {
    try {
      this.pool = new Pool(this.config);

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Unexpected database pool error', err);
        this.handleConnectionError();
      });

      // Test connection
      await this.testConnection();
      
      // Set up prepared statements for common queries
      await this.prepareCoreStatements();

      logger.info('Database connection pool initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database connection', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    const client = await this.pool!.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      logger.info('Database connection test successful', result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Prepare commonly used statements
   */
  private async prepareCoreStatements(): Promise<void> {
    const statements = [
      {
        name: 'get_user_by_email',
        text: 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL'
      },
      {
        name: 'get_user_by_id',
        text: 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL'
      },
      {
        name: 'update_last_activity',
        text: 'UPDATE users SET last_activity_at = NOW() WHERE id = $1'
      },
      {
        name: 'create_audit_log',
        text: `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, request_method, request_path, request_id, phi_accessed) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
      }
    ];

    for (const stmt of statements) {
      try {
        await this.pool!.query({
          text: stmt.text,
          name: stmt.name,
          values: []
        });
      } catch (error) {
        logger.warn(`Failed to prepare statement: ${stmt.name}`, error);
      }
    }
  }

  /**
   * Handle connection errors with reconnection logic
   */
  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached, giving up');
      process.exit(1);
    }

    this.reconnectAttempts++;
    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.initialize();
        this.reconnectAttempts = 0;
      } catch (error) {
        logger.error('Reconnection failed', error);
        await this.handleConnectionError();
      }
    }, this.reconnectDelay);
  }

  /**
   * Execute a query with automatic retry
   */
  public async query<T = any>(
    text: string,
    values?: any[],
    retries: number = 3
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query<T>(text, values);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 1000) {
        logger.warn('Slow query detected', {
          query: text.substring(0, 100),
          duration,
          rows: result.rowCount
        });
      }

      return result;
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        logger.warn(`Query failed, retrying (${retries} attempts left)`, {
          error: error.message
        });
        await this.delay(1000);
        return this.query<T>(text, values, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }

    const client = await this.pool.connect();
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
   * Encrypt sensitive data
   */
  public encrypt(text: string): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt sensitive data
   */
  public decrypt(encryptedData: Buffer): string {
    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const encrypted = encryptedData.slice(32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      '57P03', // cannot_connect_now
      '08006', // connection_failure
      '08001', // sqlclient_unable_to_establish_sqlconnection
      '08004', // sqlserver_rejected_establishment_of_sqlconnection
      '40001', // serialization_failure
      '40P01'  // deadlock_detected
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get pool statistics
   */
  public getPoolStats(): any {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database connection pool closed');
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }
}

// Export singleton instance
export const db = DatabaseConfig.getInstance();

// Export types for use in other modules
export interface DatabaseService {
  query<T = any>(text: string, values?: any[]): Promise<QueryResult<T>>;
  transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
  encrypt(text: string): Buffer;
  decrypt(encryptedData: Buffer): string;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
}

// Helper functions for common database operations
export const dbHelpers = {
  /**
   * Insert and return created record
   */
  async insertOne<T>(table: string, data: any): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await db.query<T>(query, values);
    return result.rows[0];
  },

  /**
   * Update and return updated record
   */
  async updateOne<T>(table: string, id: string, data: any): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query<T>(query, [id, ...values]);
    return result.rows[0];
  },

  /**
   * Soft delete record
   */
  async softDelete(table: string, id: string, reason?: string): Promise<boolean> {
    const query = `
      UPDATE ${table}
      SET deleted_at = NOW(), deletion_reason = $2
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await db.query(query, [id, reason]);
    return result.rowCount > 0;
  },

  /**
   * Find one record by criteria
   */
  async findOne<T>(table: string, criteria: any): Promise<T | null> {
    const keys = Object.keys(criteria);
    const values = Object.values(criteria);
    const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `
      SELECT * FROM ${table}
      WHERE ${whereClause} AND deleted_at IS NULL
      LIMIT 1
    `;
    
    const result = await db.query<T>(query, values);
    return result.rows[0] || null;
  },

  /**
   * Find multiple records by criteria
   */
  async findMany<T>(
    table: string,
    criteria: any = {},
    options: { limit?: number; offset?: number; orderBy?: string } = {}
  ): Promise<T[]> {
    const keys = Object.keys(criteria);
    const values = Object.values(criteria);
    let whereClause = keys.length > 0
      ? 'WHERE ' + keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ') + ' AND deleted_at IS NULL'
      : 'WHERE deleted_at IS NULL';
    
    let query = `SELECT * FROM ${table} ${whereClause}`;
    
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }
    
    const result = await db.query<T>(query, values);
    return result.rows;
  },

  /**
   * Count records
   */
  async count(table: string, criteria: any = {}): Promise<number> {
    const keys = Object.keys(criteria);
    const values = Object.values(criteria);
    let whereClause = keys.length > 0
      ? 'WHERE ' + keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ') + ' AND deleted_at IS NULL'
      : 'WHERE deleted_at IS NULL';
    
    const query = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    
    const result = await db.query<{ count: string }>(query, values);
    return parseInt(result.rows[0].count);
  }
};

export default db;