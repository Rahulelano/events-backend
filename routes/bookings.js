import express from 'express';
import { pool } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
const router = express.Router();

// Generate booking reference
const generateBookingReference = () => {
  return 'CBE' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Create new booking
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { event_id, user_name, user_email, user_phone, tickets_booked } = req.body;
    
    // Check event availability
    const [events] = await connection.execute(
      'SELECT available_tickets, price, title FROM events WHERE id = ? AND status = "active"',
      [event_id]
    );
    
    if (events.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Event not found or inactive' });
    }
    
    const event = events[0];
    
    if (event.available_tickets < tickets_booked) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Not enough tickets available',
        available: event.available_tickets
      });
    }
    
    // Create booking
    const booking_reference = generateBookingReference();
    const total_amount = event.price * tickets_booked;
    
    const [bookingResult] = await connection.execute(`
      INSERT INTO bookings (
        event_id, user_name, user_email, user_phone, tickets_booked,
        total_amount, booking_reference, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `, [event_id, user_name, user_email, user_phone, tickets_booked, total_amount, booking_reference]);
    
    // Update available tickets
    await connection.execute(
      'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
      [tickets_booked, event_id]
    );
    
    await connection.commit();
    
    res.status(201).json({
      booking_id: bookingResult.insertId,
      booking_reference,
      total_amount,
      message: 'Booking confirmed successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    connection.release();
  }
});

// Get booking by reference
router.get('/reference/:reference', async (req, res) => {
  try {
    const [bookings] = await pool.execute(`
      SELECT b.*, e.title as event_title, e.date, e.time, e.venue
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.booking_reference = ?
    `, [req.params.reference]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(bookings[0]);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Get all bookings (Admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { event_id, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT b.*, e.title as event_title, e.date, e.time, e.venue
      FROM bookings b
      JOIN events e ON b.event_id = e.id
    `;
    
    const params = [];
    
    if (event_id) {
      query += ' WHERE b.event_id = ?';
      params.push(event_id);
    }
    
    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [bookings] = await pool.execute(query, params);
    
    res.json({
      bookings,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Cancel booking (Admin only)
router.put('/:id/cancel', authenticateAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get booking details
    const [bookings] = await connection.execute(
      'SELECT event_id, tickets_booked, status FROM bookings WHERE id = ?',
      [req.params.id]
    );
    
    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookings[0];
    
    if (booking.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ error: 'Booking already cancelled' });
    }
    
    // Update booking status
    await connection.execute(
      'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );
    
    // Restore available tickets
    await connection.execute(
      'UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?',
      [booking.tickets_booked, booking.event_id]
    );
    
    await connection.commit();
    
    res.json({ message: 'Booking cancelled successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  } finally {
    connection.release();
  }
});

export default router;