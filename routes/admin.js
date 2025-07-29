import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });
    // Find admin user
    const [admins] = await pool.execute(
      'SELECT id, email, password, name, role, is_active FROM admin_users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    console.log('Admin user(s) found:', admins);
    if (admins.length === 0) {
      console.log('No admin found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = admins[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    console.log('Password valid:', isValidPassword);
    if (!isValidPassword) {
      console.log('Invalid password for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await pool.execute(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    // Get total events
    const [totalEvents] = await pool.execute(
      'SELECT COUNT(*) as count FROM events WHERE status = "active"'
    );
    
    // Get total bookings
    const [totalBookings] = await pool.execute(
      'SELECT COUNT(*) as count, SUM(total_amount) as revenue FROM bookings WHERE status = "confirmed"'
    );
    
    // Get upcoming events
    const [upcomingEvents] = await pool.execute(
      'SELECT COUNT(*) as count FROM events WHERE date >= CURDATE() AND status = "active"'
    );
    
    // Get category stats
    const [categoryStats] = await pool.execute(`
      SELECT c.name, c.color, COUNT(e.id) as event_count, 
             COALESCE(SUM(b.tickets_booked), 0) as total_bookings
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id AND e.status = 'active'
      LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
      GROUP BY c.id, c.name, c.color
      ORDER BY event_count DESC
    `);
    
    // Get recent bookings
    const [recentBookings] = await pool.execute(`
      SELECT b.*, e.title as event_title
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    
    res.json({
      totalEvents: totalEvents[0].count,
      totalBookings: totalBookings[0].count || 0,
      totalRevenue: totalBookings[0].revenue || 0,
      upcomingEvents: upcomingEvents[0].count,
      categoryStats,
      recentBookings
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Verify admin token
router.get('/verify', authenticateAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

export default router;