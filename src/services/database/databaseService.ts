/**
 * Database Service for Mental Health Platform
 * Provides a unified interface for all database operations
 * Supports multiple database backends with automatic failover
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Database configuration
interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
  connectionTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Query result types
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: any[];
}

// Transaction interface
export interface Transaction {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// Database connection status
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

// Default configuration
const DEFAULT_CONFIG: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/mental_health_dev',
  ssl: process.env.DATABASE_SSL === 'true',
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
  connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * DatabaseService - Core database service for the mental health platform
 */
export class DatabaseService {
  private pool: Pool | null = null;
  private db: any = null;
  private config: DatabaseConfig;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private transactionPool: Map<string, Transaction> = new Map();

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    if (this.status === ConnectionStatus.CONNECTED) {
      return;
    }

    this.status = ConnectionStatus.CONNECTING;

    try {
      // Create connection pool
      this.pool = new Pool({
        connectionString: this.config.connectionString,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        max: this.config.poolSize,
        connectionTimeoutMillis: this.config.connectionTimeout,
        idleTimeoutMillis: 30000,
        allowExitOnIdle: false
      });

      // Test connection
      await this.pool.query('SELECT NOW()');

      // Initialize Drizzle ORM
      this.db = drizzle(this.pool);

      this.status = ConnectionStatus.CONNECTED;
      this.startHealthCheck();

      console.log('Database connected successfully');
    } catch (error) {
      this.status = ConnectionStatus.ERROR;
      console.error('Database connection failed:', error);
      
      // Attempt reconnection
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Execute a query with automatic retry logic
   */
  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    await this.ensureConnected();

    let lastError: any;
    for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
      try {
        const result = await this.pool!.query(sql, params);
        return {
          rows: result.rows,
          rowCount: result.rowCount || 0,
          fields: result.fields
        };
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        if (this.isRetryableError(error)) {
          await this.delay(this.config.retryDelay || 1000);
          continue;
        }
        
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Execute a query using Drizzle ORM
   */
  async drizzleQuery(queryBuilder: any): Promise<any> {
    await this.ensureConnected();
    
    if (!this.db) {
      throw new Error('Drizzle ORM not initialized');
    }

    return queryBuilder;
  }

  /**
   * Begin a database transaction
   */
  async beginTransaction(): Promise<Transaction> {
    await this.ensureConnected();

    const client = await this.pool!.connect();
    await client.query('BEGIN');

    const transactionId = this.generateTransactionId();
    
    const transaction: Transaction = {
      async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
        try {
          const result = await client.query(sql, params);
          return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
            fields: result.fields
          };
        } catch (error) {
          // Auto-rollback on error
          await client.query('ROLLBACK');
          client.release();
          throw error;
        }
      },
      
      async commit(): Promise<void> {
        await client.query('COMMIT');
        client.release();
      },
      
      async rollback(): Promise<void> {
        await client.query('ROLLBACK');
        client.release();
      }
    };

    this.transactionPool.set(transactionId, transaction);
    return transaction;
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T> {
    const trx = await this.beginTransaction();
    
    try {
      const result = await callback(trx);
      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Batch insert operation
   */
  async batchInsert(table: string, records: any[]): Promise<number> {
    if (records.length === 0) {
      return 0;
    }

    const columns = Object.keys(records[0]);
    const values: any[] = [];
    const placeholders: string[] = [];

    records.forEach((record, recordIndex) => {
      const recordPlaceholders: string[] = [];
      columns.forEach((column, columnIndex) => {
        const paramIndex = recordIndex * columns.length + columnIndex + 1;
        recordPlaceholders.push(`$${paramIndex}`);
        values.push(record[column]);
      });
      placeholders.push(`(${recordPlaceholders.join(', ')})`);
    });

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders.join(', ')}
      ON CONFLICT DO NOTHING
    `;

    const result = await this.query(sql, values);
    return result.rowCount;
  }

  /**
   * Upsert operation
   */
  async upsert(table: string, record: any, conflictColumns: string[]): Promise<any> {
    const columns = Object.keys(record);
    const values = Object.values(record);
    
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const updateSet = columns
      .filter(col => !conflictColumns.includes(col))
      .map(col => `${col} = EXCLUDED.${col}`)
      .join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (${conflictColumns.join(', ')})
      DO UPDATE SET ${updateSet}
      RETURNING *
    `;

    const result = await this.query(sql, values);
    return result.rows[0];
  }

  /**
   * Execute raw SQL file
   */
  async executeSqlFile(sqlContent: string): Promise<void> {
    const statements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      await this.query(statement);
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    const stats = await this.query(`
      SELECT
        numbackends as active_connections,
        xact_commit as total_commits,
        xact_rollback as total_rollbacks,
        blks_read as blocks_read,
        blks_hit as blocks_hit,
        tup_returned as rows_returned,
        tup_fetched as rows_fetched,
        tup_inserted as rows_inserted,
        tup_updated as rows_updated,
        tup_deleted as rows_deleted
      FROM pg_stat_database
      WHERE datname = current_database()
    `);

    return stats.rows[0];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0]?.health === 1;
    } catch {
      return false;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    this.stopHealthCheck();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }

    this.db = null;
    this.status = ConnectionStatus.DISCONNECTED;
    this.transactionPool.clear();
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  // Private helper methods

  private async ensureConnected(): Promise<void> {
    if (this.status !== ConnectionStatus.CONNECTED) {
      await this.connect();
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ENETUNREACH',
      '57P03', // cannot_connect_now
      '08001', // sqlclient_unable_to_establish_sqlconnection
      '08004', // sqlserver_rejected_establishment_of_sqlconnection
    ];

    return retryableCodes.some(code => 
      error.code === code || error.message?.includes(code)
    );
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.status = ConnectionStatus.RECONNECTING;
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      }
    }, 5000);
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      const isHealthy = await this.healthCheck();
      
      if (!isHealthy && this.status === ConnectionStatus.CONNECTED) {
        this.status = ConnectionStatus.ERROR;
        this.scheduleReconnect();
      }
    }, 30000); // Check every 30 seconds
  }

  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  private generateTransactionId(): string {
    return `trx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export types
export type { DatabaseConfig, Transaction };
export { ConnectionStatus };

// Default export
export default databaseService;