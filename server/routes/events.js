import express from 'express';
import { pool } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
const router = express.Router();

// Get all events with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { category, featured, trending, upcoming, limit = 20, offset = 0, search } = req.query;
    
    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.status = 'active'
    `;
    
    const params = [];
    
    if (category) {
      query += ' AND e.category_id = ?';
      params.push(category);
    }
    
    if (featured === 'true') {
      query += ' AND e.is_featured = TRUE';
    }
    
    if (trending === 'true') {
      query += ' AND e.is_trending = TRUE';
    }
    
    if (upcoming === 'true') {
      query += ' AND e.date >= CURDATE()';
    }
    
    if (search) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    let finalQuery = query;
    let finalParams = params;
    if (params.length === 0) {
      // No WHERE params, interpolate LIMIT and OFFSET directly
      finalQuery = `${query} ORDER BY e.priority_order DESC, e.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      finalParams = [];
    } else {
      // Params exist, keep LIMIT and OFFSET as parameters
      finalQuery = `${query} ORDER BY e.priority_order DESC, e.created_at DESC LIMIT ? OFFSET ?`;
      finalParams = [...params, parseInt(limit), parseInt(offset)];
    }
    const [events] = await pool.execute(finalQuery, finalParams);
    
    // Debug logging
    console.log('Events API - Query params:', { category, featured, trending, upcoming, limit, offset, search });
    console.log('Events API - Found events:', events.length);
    if (featured === 'true') {
      console.log('Featured events:', events.map(e => ({ id: e.id, title: e.title, is_featured: e.is_featured, priority_order: e.priority_order })));
    }
    if (trending === 'true') {
      console.log('Trending events:', events.map(e => ({ id: e.id, title: e.title, is_trending: e.is_trending, priority_order: e.priority_order })));
    }
    
    res.json({
      events,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: events.length
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get hero event
router.get('/hero', async (req, res) => {
  try {
    const [events] = await pool.execute(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.status = 'active' AND e.show_in_hero = TRUE
      LIMIT 1
    `);
    if (events.length === 0) {
      return res.status(404).json({ error: 'No hero event found' });
    }
    res.json(events[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero event' });
  }
});

// Get all hero events for slider
router.get('/hero-slider', async (req, res) => {
  try {
    const [events] = await pool.execute(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.status = 'active' AND e.show_in_hero = TRUE
      ORDER BY e.priority_order DESC, e.date ASC
    `);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero slider events' });
  }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const [events] = await pool.execute(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? AND e.status = 'active'
    `, [req.params.id]);
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(events[0]);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      title, description, short_description, image_url, date, time, venue,
      location, category_id, total_tickets, price, is_featured, is_trending,
      is_upcoming, priority_order, show_in_hero, contact_info
    } = req.body;
    
    // Handle priority order conflicts
    let finalPriorityOrder = priority_order || 0;
    if (finalPriorityOrder > 0) {
      // Check if another event has the same priority
      const [existingEvents] = await pool.execute(
        'SELECT id FROM events WHERE priority_order = ? AND status = "active"',
        [finalPriorityOrder]
      );
      
      if (existingEvents.length > 0) {
        // Shift down existing events with same or higher priority
        await pool.execute(
          'UPDATE events SET priority_order = priority_order + 1 WHERE priority_order >= ? AND status = "active"',
          [finalPriorityOrder]
        );
      }
    }
    
    // Provide default values for all parameters to prevent undefined values
    const eventData = {
      title: title || '',
      description: description || '',
      short_description: short_description || '',
      image_url: image_url || '',
      date: date || '',
      time: time || '',
      venue: venue || '',
      location: location || 'Coimbatore',
      category_id: category_id || null,
      total_tickets: total_tickets || 0,
      price: price || 0,
      is_featured: is_featured || false,
      is_trending: is_trending || false,
      is_upcoming: is_upcoming || false,
      priority_order: finalPriorityOrder,
      show_in_hero: show_in_hero || false,
      contact_info: contact_info || ''
    };
    
    const [result] = await pool.execute(`
      INSERT INTO events (
        title, description, short_description, image_url, date, time, venue,
        location, category_id, total_tickets, available_tickets, price,
        is_featured, is_trending, is_upcoming, priority_order, show_in_hero, contact_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventData.title, eventData.description, eventData.short_description, eventData.image_url,
      eventData.date, eventData.time, eventData.venue, eventData.location, eventData.category_id,
      eventData.total_tickets, eventData.total_tickets, eventData.price, eventData.is_featured,
      eventData.is_trending, eventData.is_upcoming, eventData.priority_order, eventData.show_in_hero, eventData.contact_info
    ]);
    
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Event created successfully' 
    });
  } catch (error) {
    console.error('Create event error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    res.status(500).json({ error: 'Failed to create event: ' + error.message });
  }
});

// Update event (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const {
      title, description, short_description, image_url, date, time, venue,
      location, category_id, total_tickets, price, is_featured, is_trending,
      is_upcoming, priority_order, status, show_in_hero, contact_info
    } = req.body;
    
    // Debug: Log the incoming data
    console.log('Update event - req.body:', req.body);
    console.log('Update event - req.params.id:', req.params.id);
    
    // Handle priority order conflicts for updates
    let finalPriorityOrder = priority_order || 0;
    const eventId = parseInt(req.params.id) || 0;
    
    if (finalPriorityOrder > 0) {
      // Check if another event has the same priority (excluding current event)
      const [existingEvents] = await pool.execute(
        'SELECT id FROM events WHERE priority_order = ? AND status = "active" AND id != ?',
        [finalPriorityOrder, eventId]
      );
      
      if (existingEvents.length > 0) {
        // Shift down existing events with same or higher priority
        await pool.execute(
          'UPDATE events SET priority_order = priority_order + 1 WHERE priority_order >= ? AND status = "active" AND id != ?',
          [finalPriorityOrder, eventId]
        );
      }
    }
    
    // Provide default values for all parameters to prevent undefined values
    const updateData = {
      title: title || '',
      description: description || '',
      short_description: short_description || '',
      image_url: image_url || '',
      date: date || '',
      time: time || '',
      venue: venue || '',
      location: location || 'Coimbatore',
      category_id: category_id || null,
      total_tickets: total_tickets || 0,
      price: price || 0,
      is_featured: is_featured || false,
      is_trending: is_trending || false,
      is_upcoming: is_upcoming || false,
      priority_order: finalPriorityOrder,
      status: status || 'active',
      show_in_hero: show_in_hero || false,
      contact_info: contact_info || ''
    };
    
    // Ensure event ID is valid
    if (!eventId) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    // Debug: Log the processed data
    console.log('Update event - processed data:', updateData);
    console.log('Update event - event ID:', eventId);
    
    const queryParams = [
      updateData.title, updateData.description, updateData.short_description, updateData.image_url,
      updateData.date, updateData.time, updateData.venue, updateData.location, updateData.category_id,
      updateData.total_tickets, updateData.price, updateData.is_featured, updateData.is_trending,
      updateData.is_upcoming, updateData.priority_order, updateData.status, updateData.show_in_hero, updateData.contact_info, eventId
    ];
    
    // Debug: Log the query parameters
    console.log('Update event - query parameters:', queryParams);
    
    const [result] = await pool.execute(`
      UPDATE events SET
        title = ?, description = ?, short_description = ?, image_url = ?,
        date = ?, time = ?, venue = ?, location = ?, category_id = ?,
        total_tickets = ?, price = ?, is_featured = ?, is_trending = ?,
        is_upcoming = ?, priority_order = ?, status = ?, show_in_hero = ?, contact_info = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, queryParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
