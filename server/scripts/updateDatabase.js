import mysql from 'mysql2/promise';
import 'dotenv/config';

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // Add contact_info column to events table (if not exists)
    console.log('Checking contact_info column in events table...');
    try {
      await pool.execute(`
        ALTER TABLE events ADD COLUMN contact_info VARCHAR(255) DEFAULT NULL
      `);
      console.log('✅ contact_info column added successfully');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ contact_info column already exists');
      } else {
        throw err;
      }
    }

    // Add "Others" category
    console.log('Adding "Others" category...');
    await pool.execute(`
      INSERT INTO categories (name, description, color) 
      VALUES ('Others', 'Other events and activities', '#6B7280')
      ON DUPLICATE KEY UPDATE name = name
    `);
    console.log('✅ "Others" category added successfully');

    // Update existing events with default contact info
    console.log('Updating existing events with default contact info...');
    await pool.execute(`
      UPDATE events SET contact_info = 'Contact organizer for details' 
      WHERE contact_info IS NULL
    `);
    console.log('✅ Existing events updated with default contact info');

    console.log('🎉 Database update completed successfully!');
  } catch (err) {
    console.error('❌ Error updating database:', err);
  } finally {
    await pool.end();
  }
}

main(); 