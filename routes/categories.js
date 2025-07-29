import express from 'express';
import { pool } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT c.*, COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id AND e.status = 'active'
      GROUP BY c.id
      ORDER BY c.name
    `);
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)',
      [name, description, color || '#3B82F6']
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Category created successfully' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    const [result] = await pool.execute(
      'UPDATE categories SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, color, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    // Check if category has events
    const [events] = await pool.execute(
      'SELECT COUNT(*) as count FROM events WHERE category_id = ?',
      [req.params.id]
    );
    
    if (events[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing events. Please reassign or delete events first.' 
      });
    }
    
    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;