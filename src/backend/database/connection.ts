/**
 * Production Database Connection Module
 * Implements secure, scalable PostgreSQL connection with Neon
 * HIPAA-compliant with connection pooling and encryption
 */

import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from './schema';
import crypto from 'crypto';

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;
neonConfig.poolQueryViaFetch = true;

// Connection pool configuration for scalability
const poolConfig = {
  max: 25, // Maximum pool size
  min: 5,  // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500, // Close connections after this many uses
  ssl: {
    rejectUnauthorized: true,
    require: true
  }
};

// Encrypted connection class for HIPAA compliance
export class SecureDatabase {
  private pool: Pool;
  private sql: ReturnType<typeof neon>;
  private db: ReturnType<typeof drizzle>;
  private encryptionKey: Buffer;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private isHealthy = true;

  constructor() {
    // Validate environment variables
    this.validateEnvironment();
    
    // Initialize encryption key for sensitive data
    this.encryptionKey = this.getEncryptionKey();
    
    // Set up connection with retry logic
    this.initializeConnection();
    
    // Set up health monitoring
    this.startHealthMonitoring();
  }

  private validateEnvironment(): void {
    const required = [
      'DATABASE_URL',
      'DIRECT_URL',
      'DB_ENCRYPTION_KEY',
      'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  private getEncryptionKey(): Buffer {
    const key = process.env.DB_ENCRYPTION_KEY;
    if (!key || key.length < 32) {
      throw new Error('DB_ENCRYPTION_KEY must be at least 32 characters');
    }
    return crypto.scryptSync(key, 'salt', 32);
  }

  private async initializeConnection(): Promise<void> {
    try {
      // Create connection pool for production use
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ...poolConfig
      });

      // Create SQL client for queries
      this.sql = neon(process.env.DIRECT_URL!, {
        fullResults: true,
        fetchOptions: {
          // Add request timeout
          signal: AbortSignal.timeout(10000)
        }
      });

      // Initialize Drizzle ORM
      this.db = drizzle(this.sql, { schema });

      // Test connection
      await this.testConnection();

      // Run migrations if needed
      if (process.env.NODE_ENV === 'production') {
        await this.runMigrations();
      }

      console.log('✅ Database connection established successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      
      if (this.connectionAttempts < this.maxRetries) {
        this.connectionAttempts++;
        console.log(`Retrying connection (${this.connectionAttempts}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.initializeConnection();
      }
      
      throw error;
    }
  }

  private async testConnection(): Promise<void> {
    const result = await this.sql`SELECT NOW() as current_time`;
    if (!result || result.length === 0) {
      throw new Error('Database connection test failed');
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      await migrate(this.db, {
        migrationsFolder: './src/backend/database/migrations'
      });
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('Migration error:', error);
      // Don't throw in production - log and continue
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  }

  private startHealthMonitoring(): void {
    // Health check every 30 seconds
    setInterval(async () => {
      try {
        await this.sql`SELECT 1`;
        this.isHealthy = true;
      } catch (error) {
        this.isHealthy = false;
        console.error('Database health check failed:', error);
        // Attempt reconnection
        await this.reconnect();
      }
    }, 30000);
  }

  private async reconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.connectionAttempts = 0;
      await this.initializeConnection();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }

  // Encryption methods for sensitive data
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Transaction support for complex operations
  async transaction<T>(
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
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

  // Query with automatic retry and error handling
  async query<T>(
    queryFn: () => Promise<T>,
    retries = 3
  ): Promise<T> {
    try {
      if (!this.isHealthy) {
        throw new Error('Database is unhealthy');
      }
      return await queryFn();
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.query(queryFn, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
    return retryableCodes.some(code => error.code === code);
  }

  // Audit logging for HIPAA compliance
  async logAccess(
    userId: string,
    action: string,
    resource: string,
    details?: any
  ): Promise<void> {
    try {
      await this.sql`
        INSERT INTO audit_logs (user_id, action, resource, details, timestamp)
        VALUES (${userId}, ${action}, ${resource}, ${JSON.stringify(details)}, NOW())
      `;
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit failures shouldn't break the app
    }
  }

  // Getters for different access patterns
  getPool(): Pool {
    return this.pool;
  }

  getSql(): ReturnType<typeof neon> {
    return this.sql;
  }

  getDb(): ReturnType<typeof drizzle> {
    return this.db;
  }

  getHealth(): boolean {
    return this.isHealthy;
  }

  // Cleanup method
  async close(): Promise<void> {
    await this.pool.end();
    console.log('Database connections closed');
  }
}

// Singleton instance
let dbInstance: SecureDatabase | null = null;

export const getDatabase = (): SecureDatabase => {
  if (!dbInstance) {
    dbInstance = new SecureDatabase();
  }
  return dbInstance;
};

// Export commonly used methods
export const db = () => getDatabase().getDb();
export const sql = () => getDatabase().getSql();
export const pool = () => getDatabase().getPool();

// Health check endpoint helper
export const healthCheck = async (): Promise<{
  healthy: boolean;
  timestamp: Date;
  connections: number;
}> => {
  const database = getDatabase();
  const poolInfo = database.getPool();
  
  return {
    healthy: database.getHealth(),
    timestamp: new Date(),
    connections: poolInfo.totalCount || 0
  };
};