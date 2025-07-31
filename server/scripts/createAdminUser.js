import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// === EDIT THESE VALUES ===
const email = 'admin@coimbatore.events';
const password = 'admin123';
// =========================

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // First try to update existing user
    const [updateResult] = await pool.execute(
      `UPDATE admin_users SET password = ?, is_active = TRUE, updated_at = NOW() WHERE email = ?`,
      [hashedPassword, email]
    );
    
    if (updateResult.affectedRows > 0) {
      console.log('Admin user password updated.');
    } else {
      // If no user exists, insert a new one
      const [insertResult] = await pool.execute(
        `INSERT INTO admin_users (email, password, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [email, hashedPassword, 'Admin User', 'super_admin', true]
      );
      if (insertResult.affectedRows > 0) {
        console.log('New admin user created successfully.');
      } else {
        console.log('Failed to create admin user.');
      }
    }
  } catch (err) {
    console.error('Error managing admin user:', err);
  } finally {
    await pool.end();
  }
}

main(); 
