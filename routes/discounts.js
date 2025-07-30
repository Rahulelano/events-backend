import express from 'express';
import { pool } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
const router = express.Router();

// Get all discounts
router.get('/', async (req, res) => {
  try {
    const { featured, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT * FROM discounts 
      WHERE is_active = TRUE
    `;
    
    const params = [];
    
    if (featured === 'true') {
      query += ' AND is_featured = TRUE';
    }
    
    const safeLimit = Math.max(0, parseInt(limit));
    const safeOffset = Math.max(0, parseInt(offset));
    query += ` ORDER BY priority_order DESC, created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    
    const [discounts] = await pool.execute(query, params);
    
    res.json({
      discounts,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total: discounts.length
      }
    });
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({ error: 'Failed to fetch discounts' });
  }
});

// Get featured discounts
router.get('/featured', async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    
    const safeLimit = Math.max(0, parseInt(limit));
    const [discounts] = await pool.execute(`
      SELECT * FROM discounts 
      WHERE is_active = TRUE AND is_featured = TRUE
      ORDER BY priority_order DESC, created_at DESC 
      LIMIT ${safeLimit}
    `);
    
    res.json(discounts);
  } catch (error) {
    console.error('Get featured discounts error:', error);
    res.status(500).json({ error: 'Failed to fetch featured discounts' });
  }
});

// Get discount by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [discounts] = await pool.execute(
      'SELECT * FROM discounts WHERE id = ? AND is_active = TRUE',
      [id]
    );
    
    if (discounts.length === 0) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    
    res.json(discounts[0]);
  } catch (error) {
    console.error('Get discount error:', error);
    res.status(500).json({ error: 'Failed to fetch discount' });
  }
});

// Create new discount (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      shop_name,
      shop_category,
      discount_title,
      description,
      discount_percentage,
      original_price,
      discounted_price,
      image_url,
      shop_location,
      shop_address,
      contact_number,
      website_url,
      valid_from,
      valid_until,
      terms_conditions,
      is_featured,
      priority_order
    } = req.body;
    
    const [result] = await pool.execute(`
      INSERT INTO discounts (
        shop_name, shop_category, discount_title, description, discount_percentage,
        original_price, discounted_price, image_url, shop_location, shop_address,
        contact_number, website_url, valid_from, valid_until, terms_conditions,
        is_featured, priority_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      shop_name, shop_category, discount_title, description, discount_percentage,
      original_price, discounted_price, image_url, shop_location, shop_address,
      contact_number, website_url, valid_from, valid_until, terms_conditions,
      is_featured || false, priority_order || 0
    ]);
    
    const [newDiscount] = await pool.execute(
      'SELECT * FROM discounts WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newDiscount[0]);
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({ error: 'Failed to create discount' });
  }
});

// Update discount (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shop_name,
      shop_category,
      discount_title,
      description,
      discount_percentage,
      original_price,
      discounted_price,
      image_url,
      shop_location,
      shop_address,
      contact_number,
      website_url,
      valid_from,
      valid_until,
      terms_conditions,
      is_featured,
      priority_order
    } = req.body;
    
    const [result] = await pool.execute(`
      UPDATE discounts SET
        shop_name = ?, shop_category = ?, discount_title = ?, description = ?,
        discount_percentage = ?, original_price = ?, discounted_price = ?, image_url = ?,
        shop_location = ?, shop_address = ?, contact_number = ?, website_url = ?,
        valid_from = ?, valid_until = ?, terms_conditions = ?, is_featured = ?,
        priority_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      shop_name, shop_category, discount_title, description, discount_percentage,
      original_price, discounted_price, image_url, shop_location, shop_address,
      contact_number, website_url, valid_from, valid_until, terms_conditions,
      is_featured || false, priority_order || 0, id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    
    const [updatedDiscount] = await pool.execute(
      'SELECT * FROM discounts WHERE id = ?',
      [id]
    );
    
    res.json(updatedDiscount[0]);
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({ error: 'Failed to update discount' });
  }
});

// Delete discount (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'UPDATE discounts SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    
    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({ error: 'Failed to delete discount' });
  }
});

export default router;
