import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { EncryptionService } from '../services/encryption';

/**
 * Seed test users for development environment
 * WARNING: DO NOT RUN IN PRODUCTION
 */
export async function seedTestUsers() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Cannot run seeds in production environment');
    process.exit(1);
  }

  console.log('Seeding test users...');

  try {
    // Initialize encryption
    EncryptionService.initialize();

    // Test users data
    const users = [
      {
        id: uuidv4(),
        email: 'admin@mentalhealth.com',
        password: 'Admin123!@#',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1-555-0100'
      },
      {
        id: uuidv4(),
        email: 'therapist1@mentalhealth.com',
        password: 'Therapist123!',
        role: 'therapist',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        phone: '+1-555-0101'
      },
      {
        id: uuidv4(),
        email: 'therapist2@mentalhealth.com',
        password: 'Therapist123!',
        role: 'therapist',
        firstName: 'Dr. Michael',
        lastName: 'Chen',
        phone: '+1-555-0102'
      },
      {
        id: uuidv4(),
        email: 'psychiatrist@mentalhealth.com',
        password: 'Psychiatrist123!',
        role: 'psychiatrist',
        firstName: 'Dr. Emily',
        lastName: 'Rodriguez',
        phone: '+1-555-0103'
      },
      {
        id: uuidv4(),
        email: 'crisis@mentalhealth.com',
        password: 'Crisis123!',
        role: 'crisis_counselor',
        firstName: 'James',
        lastName: 'Wilson',
        phone: '+1-555-0104'
      },
      {
        id: uuidv4(),
        email: 'patient1@mentalhealth.com',
        password: 'Patient123!',
        role: 'patient',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0201',
        therapistId: null // Will be set after therapist creation
      },
      {
        id: uuidv4(),
        email: 'patient2@mentalhealth.com',
        password: 'Patient123!',
        role: 'patient',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0202',
        therapistId: null
      },
      {
        id: uuidv4(),
        email: 'patient3@mentalhealth.com',
        password: 'Patient123!',
        role: 'patient',
        firstName: 'Robert',
        lastName: 'Brown',
        phone: '+1-555-0203',
        therapistId: null
      }
    ];

    // Get therapist IDs for patient assignment
    const therapist1 = users.find(u => u.email === 'therapist1@mentalhealth.com');
    const therapist2 = users.find(u => u.email === 'therapist2@mentalhealth.com');
    const psychiatrist = users.find(u => u.email === 'psychiatrist@mentalhealth.com');

    // Assign therapists to patients
    users.find(u => u.email === 'patient1@mentalhealth.com')!.therapistId = therapist1?.id;
    users.find(u => u.email === 'patient2@mentalhealth.com')!.therapistId = therapist2?.id;
    users.find(u => u.email === 'patient3@mentalhealth.com')!.therapistId = therapist1?.id;

    // Insert users
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await db.query(
        `INSERT INTO users (
          id, email, email_encrypted, password_hash, role,
          first_name_encrypted, last_name_encrypted, phone_encrypted,
          primary_therapist_id, primary_psychiatrist_id,
          two_factor_enabled, notification_preferences, privacy_settings,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (email) DO UPDATE SET
          password_hash = $4,
          updated_at = CURRENT_TIMESTAMP`,
        [
          user.id,
          user.email,
          EncryptionService.encryptField(user.email),
          hashedPassword,
          user.role,
          EncryptionService.encryptField(user.firstName),
          EncryptionService.encryptField(user.lastName),
          EncryptionService.encryptField(user.phone),
          user.therapistId || null,
          user.role === 'patient' ? psychiatrist?.id : null,
          false, // two_factor_enabled
          JSON.stringify({
            email: true,
            sms: false,
            push: true
          }),
          JSON.stringify({
            share_mood: false,
            share_journal: false,
            anonymous_mode: false
          })
        ]
      );

      console.log(`Created user: ${user.email}`);
    }

    // Add emergency contacts for patients
    const patients = users.filter(u => u.role === 'patient');
    for (const patient of patients) {
      await db.query(
        `INSERT INTO emergency_contacts (
          user_id, name_encrypted, phone_encrypted, email_encrypted,
          relationship, contact_type, priority_order, verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          patient.id,
          EncryptionService.encryptField('Emergency Contact'),
          EncryptionService.encryptField('+1-555-9111'),
          EncryptionService.encryptField('emergency@contact.com'),
          'Family Member',
          'emergency',
          1,
          true
        ]
      );

      console.log(`Added emergency contact for: ${patient.email}`);
    }

    // Add sample mood entries for patients
    for (const patient of patients) {
      for (let i = 0; i < 7; i++) {
        const moodScore = Math.floor(Math.random() * 5) + 3; // 3-7 range
        const date = new Date();
        date.setDate(date.getDate() - i);

        await db.query(
          `INSERT INTO mood_entries (
            user_id, mood_score, energy_level, anxiety_level, stress_level,
            emotions, sleep_hours, medication_taken, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            patient.id,
            moodScore.toString(),
            Math.floor(Math.random() * 5) + 3,
            Math.floor(Math.random() * 5) + 2,
            Math.floor(Math.random() * 5) + 2,
            JSON.stringify(['calm', 'focused', 'tired'][Math.floor(Math.random() * 3)]),
            6 + Math.random() * 3,
            Math.random() > 0.5,
            date
          ]
        );
      }
      console.log(`Added mood entries for: ${patient.email}`);
    }

    // Add sample appointments
    const appointmentTypes = ['individual', 'group', 'assessment', 'medication_review'];
    for (const patient of patients.slice(0, 2)) {
      const therapist = patient.therapistId ? users.find(u => u.id === patient.therapistId) : null;
      if (therapist) {
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 7) + 1);
        appointmentDate.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0);

        await db.query(
          `INSERT INTO appointments (
            patient_id, provider_id, scheduled_start, scheduled_end,
            appointment_type, status, location_type, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
          [
            patient.id,
            therapist.id,
            appointmentDate,
            new Date(appointmentDate.getTime() + 50 * 60000), // 50 minutes later
            appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
            'scheduled',
            Math.random() > 0.5 ? 'in_person' : 'video'
          ]
        );

        console.log(`Added appointment for: ${patient.email} with ${therapist.email}`);
      }
    }

    // Add sample journal entries for patients
    for (const patient of patients) {
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i * 2);

        const journalContent = [
          'Today was a good day. I managed to complete all my tasks and felt productive.',
          'Feeling a bit anxious about upcoming events, but practicing breathing exercises helped.',
          'Had a difficult morning but things improved after talking to a friend.',
          'Grateful for the support I have. Therapy session was helpful today.',
          'Struggling with sleep lately. Need to work on my bedtime routine.'
        ][Math.floor(Math.random() * 5)];

        await db.query(
          `INSERT INTO journal_entries (
            user_id, title_encrypted, content_encrypted,
            sentiment_score, word_count, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            patient.id,
            EncryptionService.encryptField(`Journal Entry ${i + 1}`),
            EncryptionService.encryptField(journalContent),
            Math.random() * 2 - 1, // -1 to 1
            journalContent.split(' ').length,
            date
          ]
        );
      }
      console.log(`Added journal entries for: ${patient.email}`);
    }

    console.log('\n✅ Test users seeded successfully!');
    console.log('\nTest credentials:');
    console.log('================');
    users.forEach(user => {
      console.log(`${user.role.padEnd(15)} | Email: ${user.email.padEnd(30)} | Password: ${user.password}`);
    });

  } catch (error) {
    console.error('Error seeding test users:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedTestUsers()
    .then(() => {
      console.log('\nSeed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}