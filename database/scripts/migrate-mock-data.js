/**
 * CoreV2 Mental Health Platform
 * Mock Data to Database Migration Script
 * 
 * This script helps migrate from mock data to the real Neon PostgreSQL database
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Configuration
const config = {
  databaseUrl: process.env.DATABASE_URL,
  defaultPassword: 'TempPassword123!', // Users will need to reset
  batchSize: 100,
};

// Mock data that might exist in the application
const mockUsers = [
  {
    email: 'demo@corev2.app',
    username: 'demo_user',
    role: 'user',
    displayName: 'Demo User',
    bio: 'Testing the platform',
  },
  {
    email: 'helper@corev2.app',
    username: 'demo_helper',
    role: 'helper',
    displayName: 'Demo Helper',
    bio: 'Certified counselor for demo purposes',
  },
];

const mockCrisisResources = [
  {
    name: 'Local Crisis Center',
    phone: '555-0100',
    category: 'crisis',
    description: 'Local 24/7 crisis support',
    is_24_7: true,
  },
];

class DataMigrator {
  constructor() {
    this.client = null;
    this.stats = {
      users: 0,
      profiles: 0,
      moods: 0,
      journals: 0,
      safetyPlans: 0,
      resources: 0,
      errors: [],
    };
  }

  async connect() {
    try {
      this.client = new Client({
        connectionString: config.databaseUrl,
      });
      await this.client.connect();
      console.log('✅ Connected to database');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log('Disconnected from database');
    }
  }

  async migrateUsers() {
    console.log('\n🔄 Migrating users...');
    
    for (const mockUser of mockUsers) {
      try {
        // Check if user already exists
        const existing = await this.client.query(
          'SELECT id FROM users WHERE email = $1',
          [mockUser.email]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  User ${mockUser.email} already exists, skipping`);
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(config.defaultPassword, 10);

        // Begin transaction
        await this.client.query('BEGIN');

        // Insert user
        const userResult = await this.client.query(
          `INSERT INTO users (email, username, password_hash, role, status, email_verified)
           VALUES ($1, $2, $3, $4, 'active', false)
           RETURNING id`,
          [mockUser.email, mockUser.username, passwordHash, mockUser.role]
        );

        const userId = userResult.rows[0].id;

        // Insert profile
        await this.client.query(
          `INSERT INTO user_profiles (user_id, display_name, bio)
           VALUES ($1, $2, $3)`,
          [userId, mockUser.displayName, mockUser.bio]
        );

        // Insert preferences
        await this.client.query(
          `INSERT INTO user_preferences (user_id, theme, notifications_enabled)
           VALUES ($1, 'light', true)`,
          [userId]
        );

        await this.client.query('COMMIT');
        
        this.stats.users++;
        this.stats.profiles++;
        console.log(`✅ Migrated user: ${mockUser.email}`);
      } catch (error) {
        await this.client.query('ROLLBACK');
        console.error(`❌ Failed to migrate user ${mockUser.email}:`, error.message);
        this.stats.errors.push(`User ${mockUser.email}: ${error.message}`);
      }
    }
  }

  async migrateMockMoodData() {
    console.log('\n🔄 Migrating mock mood data...');
    
    try {
      // Get demo user
      const userResult = await this.client.query(
        'SELECT id FROM users WHERE email = $1',
        ['demo@corev2.app']
      );

      if (userResult.rows.length === 0) {
        console.log('No demo user found, skipping mood data');
        return;
      }

      const userId = userResult.rows[0].id;

      // Create sample mood entries
      const moodEntries = [
        { score: 7, label: 'Good', energy: 6, anxiety: 3, notes: 'Feeling positive today' },
        { score: 5, label: 'Neutral', energy: 5, anxiety: 5, notes: 'Average day' },
        { score: 8, label: 'Great', energy: 8, anxiety: 2, notes: 'Had a great therapy session' },
        { score: 4, label: 'Low', energy: 3, anxiety: 7, notes: 'Struggling a bit today' },
        { score: 6, label: 'Okay', energy: 5, anxiety: 4, notes: 'Managing well' },
      ];

      for (let i = 0; i < moodEntries.length; i++) {
        const entry = moodEntries[i];
        const daysAgo = i + 1;
        
        await this.client.query(
          `INSERT INTO mood_entries 
           (user_id, mood_score, mood_label, energy_level, anxiety_level, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${daysAgo} days')`,
          [userId, entry.score, entry.label, entry.energy, entry.anxiety, entry.notes]
        );
        
        this.stats.moods++;
      }

      console.log(`✅ Migrated ${this.stats.moods} mood entries`);
    } catch (error) {
      console.error('❌ Failed to migrate mood data:', error.message);
      this.stats.errors.push(`Mood data: ${error.message}`);
    }
  }

  async migrateMockJournalEntries() {
    console.log('\n🔄 Migrating mock journal entries...');
    
    try {
      // Get demo user
      const userResult = await this.client.query(
        'SELECT id FROM users WHERE email = $1',
        ['demo@corev2.app']
      );

      if (userResult.rows.length === 0) {
        console.log('No demo user found, skipping journal entries');
        return;
      }

      const userId = userResult.rows[0].id;

      // Create sample journal entries
      const journalEntries = [
        {
          title: 'Reflection on Today',
          content: 'Today was challenging but I learned a lot about myself...',
          mood_score: 6,
          tags: ['reflection', 'growth'],
        },
        {
          title: 'Gratitude Practice',
          content: 'Three things I\'m grateful for today: my health, my family, and the sunshine...',
          mood_score: 7,
          tags: ['gratitude', 'positive'],
        },
        {
          title: 'Working Through Anxiety',
          content: 'I noticed my anxiety triggers today and used breathing exercises to cope...',
          mood_score: 5,
          tags: ['anxiety', 'coping'],
        },
      ];

      for (const entry of journalEntries) {
        await this.client.query(
          `INSERT INTO journal_entries 
           (user_id, title, content, mood_score, tags, word_count)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            entry.title,
            entry.content,
            entry.mood_score,
            entry.tags,
            entry.content.split(/\s+/).length,
          ]
        );
        
        this.stats.journals++;
      }

      console.log(`✅ Migrated ${this.stats.journals} journal entries`);
    } catch (error) {
      console.error('❌ Failed to migrate journal entries:', error.message);
      this.stats.errors.push(`Journal entries: ${error.message}`);
    }
  }

  async migrateMockSafetyPlan() {
    console.log('\n🔄 Migrating mock safety plan...');
    
    try {
      // Get demo user
      const userResult = await this.client.query(
        'SELECT id FROM users WHERE email = $1',
        ['demo@corev2.app']
      );

      if (userResult.rows.length === 0) {
        console.log('No demo user found, skipping safety plan');
        return;
      }

      const userId = userResult.rows[0].id;

      // Check if safety plan already exists
      const existing = await this.client.query(
        'SELECT id FROM safety_plans WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      if (existing.rows.length > 0) {
        console.log('Safety plan already exists for demo user');
        return;
      }

      // Create sample safety plan
      await this.client.query(
        `INSERT INTO safety_plans 
         (user_id, warning_signs, internal_coping_strategies, 
          reasons_for_living, safe_places)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          ['Feeling overwhelmed', 'Isolating from others', 'Negative self-talk'],
          ['Deep breathing', 'Go for a walk', 'Listen to music', 'Call a friend'],
          ['My family', 'My goals', 'My pets', 'Making a difference'],
          ['My bedroom', 'The park', 'Library', 'Friend\'s house'],
        ]
      );

      this.stats.safetyPlans++;
      console.log('✅ Migrated safety plan');
    } catch (error) {
      console.error('❌ Failed to migrate safety plan:', error.message);
      this.stats.errors.push(`Safety plan: ${error.message}`);
    }
  }

  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    try {
      const tables = [
        'users',
        'user_profiles',
        'user_preferences',
        'mood_entries',
        'journal_entries',
        'safety_plans',
        'crisis_resources',
      ];

      for (const table of tables) {
        const result = await this.client.query(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        console.log(`  ${table}: ${result.rows[0].count} records`);
      }
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  }

  async generateReport() {
    console.log('\n📊 Migration Report');
    console.log('===================');
    console.log(`Users migrated: ${this.stats.users}`);
    console.log(`Profiles created: ${this.stats.profiles}`);
    console.log(`Mood entries: ${this.stats.moods}`);
    console.log(`Journal entries: ${this.stats.journals}`);
    console.log(`Safety plans: ${this.stats.safetyPlans}`);
    console.log(`Resources: ${this.stats.resources}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('\n✅ Migration completed without errors!');
    }
  }

  async run() {
    console.log('🚀 Starting CoreV2 Mock Data Migration');
    console.log('=====================================');
    
    // Connect to database
    const connected = await this.connect();
    if (!connected) {
      console.error('Cannot proceed without database connection');
      process.exit(1);
    }

    try {
      // Run migrations
      await this.migrateUsers();
      await this.migrateMockMoodData();
      await this.migrateMockJournalEntries();
      await this.migrateMockSafetyPlan();
      
      // Verify
      await this.verifyMigration();
      
      // Report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DataMigrator;