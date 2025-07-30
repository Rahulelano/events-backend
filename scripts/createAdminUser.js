import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// === EDIT THESE VALUES ===
const email = 'admin@coimbatoreevents.com';
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
    const [result] = await pool.execute(
      `UPDATE admin_users SET password = ?, is_active = TRUE, updated_at = NOW() WHERE email = ?`,
      [hashedPassword, email]
    );
    if (result.affectedRows > 0) {
      console.log('Admin user password updated.');
    } else {
      console.log('No admin user found with that email.');
    }
  } catch (err) {
    console.error('Error updating admin user:', err);
  } finally {
    await pool.end();
  }
}

main(); 
