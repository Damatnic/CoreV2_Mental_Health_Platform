import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for serverless environment
neonConfig.fetchConnectionCache = true;

// Database connection singleton
let dbInstance: ReturnType<typeof neon> | null = null;
let poolInstance: Pool | null = null;

/**
 * Get a direct database connection for simple queries
 * Best for: Single queries, read operations
 */
export function getDb() {
  if (!dbInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    dbInstance = neon(databaseUrl);
  }
  return dbInstance;
}

/**
 * Get a connection pool for complex operations
 * Best for: Transactions, multiple queries, write operations
 */
export function getPool() {
  if (!poolInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    poolInstance = new Pool({ connectionString: databaseUrl });
  }
  return poolInstance;
}

/**
 * Get a Drizzle ORM instance for type-safe queries
 */
export function getDrizzle() {
  const sql = getDb();
  return drizzle(sql);
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const sql = getDb();
  try {
    const result = await sql(text, params);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const sql = getDb();
    const result = await sql`SELECT NOW()`;
    return !!result;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Clean up connections (for graceful shutdown)
 */
export async function cleanup() {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
  dbInstance = null;
}

// Connection retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Database operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

// Database error handler
export function handleDbError(error: any): { statusCode: number; message: string } {
  console.error('Database error:', error);
  
  // PostgreSQL error codes
  if (error.code === '23505') {
    return { statusCode: 409, message: 'Duplicate entry exists' };
  }
  if (error.code === '23503') {
    return { statusCode: 400, message: 'Referenced record not found' };
  }
  if (error.code === '23502') {
    return { statusCode: 400, message: 'Required field missing' };
  }
  if (error.code === '22P02') {
    return { statusCode: 400, message: 'Invalid input format' };
  }
  
  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return { statusCode: 503, message: 'Database connection unavailable' };
  }
  
  // Default error
  return { statusCode: 500, message: 'Database operation failed' };
}