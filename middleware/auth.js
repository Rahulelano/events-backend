import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { pool } from '../config/database.js';

export async function authenticateAdmin(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [admins] = await pool.execute('SELECT * FROM admin_users WHERE id = ?', [decoded.id]);
    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.admin = admins[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}