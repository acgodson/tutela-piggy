#!/usr/bin/env node
/**
 * Database setup script for Neon DB
 * Creates all required tables for pig tracking system
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupDatabase() {
  console.log('🗄️  Setting up Neon Database');
  console.log('=' .repeat(50));
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }
  
  console.log('🔍 Connecting to Neon database...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('✅ Connected to Neon database');
    
    // Create tables manually since we don't have migrations set up
    console.log('🔧 Creating database tables...');
    
    // Create pig_registry table
    await sql`
      CREATE TABLE IF NOT EXISTS pig_registry (
        id SERIAL PRIMARY KEY,
        pig_id VARCHAR(50) NOT NULL UNIQUE,
        pig_name VARCHAR(100) NOT NULL,
        marker_colors TEXT[] NOT NULL,
        birth_date DATE,
        pen_id VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ pig_registry table created');
    
    // Create pig_detections table
    await sql`
      CREATE TABLE IF NOT EXISTS pig_detections (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        frame_number INTEGER NOT NULL,
        camera_id VARCHAR(50) NOT NULL,
        pig_id VARCHAR(50),
        marker_colors TEXT[],
        confidence REAL NOT NULL,
        bbox_x INTEGER NOT NULL,
        bbox_y INTEGER NOT NULL,
        bbox_width INTEGER NOT NULL,
        bbox_height INTEGER NOT NULL,
        mask_area INTEGER,
        mask_compactness REAL,
        posture VARCHAR(50),
        activity VARCHAR(50),
        orientation REAL,
        movement_detected BOOLEAN,
        behavior_confidence REAL,
        track_id INTEGER,
        movement_speed REAL,
        activity_level VARCHAR(20)
      )
    `;
    console.log('✅ pig_detections table created');
    
    // Create pig_alerts table
    await sql`
      CREATE TABLE IF NOT EXISTS pig_alerts (
        id SERIAL PRIMARY KEY,
        pig_id VARCHAR(50) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        resolved BOOLEAN DEFAULT false NOT NULL,
        resolved_at TIMESTAMP,
        evidence_frames INTEGER[],
        movement_data JSONB,
        recommendations TEXT[],
        farmer_notes TEXT,
        action_taken VARCHAR(100)
      )
    `;
    console.log('✅ pig_alerts table created');
    
    // Create video_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS video_sessions (
        id SERIAL PRIMARY KEY,
        connection_id VARCHAR(100) NOT NULL UNIQUE,
        filename VARCHAR(255) NOT NULL,
        camera_id VARCHAR(50) NOT NULL,
        total_frames INTEGER,
        processed_frames INTEGER DEFAULT 0,
        target_fps INTEGER DEFAULT 2,
        status VARCHAR(20) DEFAULT 'processing',
        started_at TIMESTAMP DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMP,
        total_pigs_detected INTEGER DEFAULT 0,
        avg_confidence REAL,
        processing_time_seconds REAL
      )
    `;
    console.log('✅ video_sessions table created');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS pig_id_idx ON pig_registry(pig_id)`;
    await sql`CREATE INDEX IF NOT EXISTS timestamp_idx ON pig_detections(timestamp)`;
    await sql`CREATE INDEX IF NOT EXISTS connection_id_idx ON video_sessions(connection_id)`;
    console.log('✅ Database indexes created');
    
    // Insert sample data
    console.log('🌱 Inserting sample data...');
    
    // Sample pig
    await sql`
      INSERT INTO pig_registry (pig_id, pig_name, marker_colors, pen_id)
      VALUES ('PIG-001', 'Wilbur', ARRAY['red', 'blue'], 'PEN-A')
      ON CONFLICT (pig_id) DO NOTHING
    `;
    
    await sql`
      INSERT INTO pig_registry (pig_id, pig_name, marker_colors, pen_id)
      VALUES ('PIG-002', 'Charlotte', ARRAY['yellow', 'green'], 'PEN-A')
      ON CONFLICT (pig_id) DO NOTHING
    `;
    
    console.log('✅ Sample pigs inserted');
    
    // Test queries
    console.log('🧪 Testing database queries...');
    
    const pigs = await sql`SELECT COUNT(*) as count FROM pig_registry`;
    console.log(`✅ Pig registry: ${pigs[0].count} pigs`);
    
    const sessions = await sql`SELECT COUNT(*) as count FROM video_sessions`;
    console.log(`✅ Video sessions: ${sessions[0].count} sessions`);
    
    const alerts = await sql`SELECT COUNT(*) as count FROM pig_alerts`;
    console.log(`✅ Alerts: ${alerts[0].count} alerts`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Test API routes: python3 test_production_api.py');
    console.log('  2. Visit: http://localhost:3000/video-analysis');
    console.log('');
    console.log('🔗 Database is ready for:');
    console.log('  • Pig registration and tracking');
    console.log('  • Video processing sessions');
    console.log('  • Detection data storage');
    console.log('  • Alert management');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Check DATABASE_URL in .env file');
    console.error('  2. Verify Neon database is accessible');
    console.error('  3. Check network connection');
    process.exit(1);
  }
}

setupDatabase();